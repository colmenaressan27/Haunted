// Hito 1a — Expediente: calibración semimanual + Evidencia 1 (fotografía manipulable).
// Une la lógica pura (src/game) con la presentación Three.js (src/presentation) y el motor (SpatialHost).
import * as THREE from 'three'
import type {ReticleState} from '../../ar/arStore'
import {placementRejectionMessage} from '../../ar/placement'
import type {SpatialController, SpatialHost} from '../../ar/SpatialController'
import type {TrackingState} from '../../ar/trackingState'
import {
  calibrationReducer,
  hasAnyZone,
  initialCalibration,
  photoSpawnPoint,
  toRoomLayout,
  ZONE_RULES,
  type CalibrationEvent,
  type CalibrationState,
  type RoomLayout,
  type ZoneKind,
} from '../../game/calibration'
import {intersectHorizontalPlane, yawTowards, type Vec3} from '../../game/geometry'
import {chooseDropPoint, initialPhotoState, photoReducer, type PhotoEvent, type PhotoState} from '../../game/photoObject'
import {createPhotoView, setPhotoAppearance, type PhotoView} from '../../presentation/photo'
import {
  COLOR,
  createReticle,
  disposeObject,
  placeRelativeToCamera,
  setObjectDimmed,
  setReticleColor,
} from '../../presentation/sceneUtils'
import {createZoneMarker} from '../../presentation/zoneMarkers'
import type {GameSnapshot} from '../gameStore'
import type {Store} from '../Store'

const RETICLE_INTERVAL_MS = 150
/** Distancia máxima de la retícula en el paso «suelo». */
const FLOOR_STEP_MAX_DISTANCE = 4.0
// Distancias a la cámara de la foto en mano (0,3 u) y en examen (0,19–0,36 u): por encima del plano de
// recorte cercano de XR8 (nearClipPlane por defecto 0,01, doc de updateCameraProjectionMatrix).
const HELD_OFFSET = new THREE.Vector3(0.065, -0.1, -0.3)
const HELD_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, -0.3, 0.1))
const EXAMINE_FAR = 0.36
const EXAMINE_NEAR = 0.19
const BACKDROP_OFFSET = new THREE.Vector3(0, 0, -0.6)
const IDENTITY = new THREE.Quaternion()
const DRAG_RADIANS_PER_PX = 0.012

const STEP_COLORS: Record<ZoneKind | 'floor', number> = {
  floor: COLOR.bone,
  safe: COLOR.teal,
  table: COLOR.amber,
  peek: COLOR.hostile,
}

function toVec3(v: THREE.Vector3): Vec3 {
  return {x: v.x, y: v.y, z: v.z}
}

export class ExpedienteController implements SpatialController {
  readonly name = 'expediente'
  private host: SpatialHost | null = null
  private calibration: CalibrationState = initialCalibration
  private photo: PhotoState = initialPhotoState
  private layout: RoomLayout | null = null
  private readonly markers = new Map<ZoneKind, THREE.Group>()
  private view: PhotoView | null = null
  private reticle: THREE.Mesh | null = null
  private readonly raycaster = new THREE.Raycaster()
  private readonly examineRotation = new THREE.Quaternion()
  private readonly examineEuler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly examineOffset = new THREE.Vector3()
  private lastReticleAt = 0
  private unreliable = false
  /** Salto de pose sin respuesta del jugador todavía. */
  private pendingCheck = false
  private appearanceKey = ''
  private readonly stats = {picks: 0, drops: 0, recovers: 0, recalibrations: 0}

  constructor(private readonly store: Store<GameSnapshot>) {}

  // ───────────────────────── SpatialController ─────────────────────────

  attach(host: SpatialHost): void {
    this.host = host
    this.reticle = createReticle()
    host.scene.add(this.reticle)
    this.view = createPhotoView()
    this.view.root.visible = false
    host.scene.add(this.view.root, this.view.backdrop)
    this.publish()
    host.log('Expediente: calibración iniciada (paso suelo)')
  }

  onFrame(now: number): void {
    if (now - this.lastReticleAt >= RETICLE_INTERVAL_MS) {
      this.lastReticleAt = now
      this.updateReticle()
    }
    this.applyPhotoPose()
  }

  onTap(nx: number, ny: number): void {
    const host = this.host
    const view = this.view
    if (!host || !view || this.photo.location !== 'world') return
    const ray = host.rayFromScreen(nx, ny)
    if (!ray) return
    view.root.updateMatrixWorld(true)
    this.raycaster.set(ray.origin, ray.direction)
    if (this.raycaster.intersectObject(view.pickVolume, false).length > 0) {
      this.dispatchPhoto({type: 'PICK'})
    }
  }

  onDrag(dxPx: number, dyPx: number): void {
    if (this.photo.location !== 'examining') return
    this.dispatchPhoto({type: 'ROTATE', dYaw: dxPx * DRAG_RADIANS_PER_PX, dPitch: dyPx * DRAG_RADIANS_PER_PX})
  }

  onTrackingChange(_prev: TrackingState, next: TrackingState): void {
    this.unreliable = next.quality !== 'normal'
    if (this.unreliable) this.dispatchPhoto({type: 'TRACKING_UNRELIABLE'})
    this.refreshMarkerDimming()
    this.publish()
  }

  onPoseJump(): void {
    this.pendingCheck = true
    this.dispatchPhoto({type: 'TRACKING_UNRELIABLE'})
    this.refreshMarkerDimming()
  }

  onAnchorAnswer(moved: boolean): void {
    this.pendingCheck = false
    if (moved) {
      this.recalibrate()
    } else {
      this.dispatchPhoto({type: 'POSITION_CONFIRMED'})
      this.refreshMarkerDimming()
    }
  }

  hasPlacedContent(): boolean {
    return hasAnyZone(this.calibration) || this.photo.location === 'world'
  }

  summary(): string {
    const zones = Object.keys(this.calibration.zones).join('+') || 'ninguna'
    const {picks, drops, recovers, recalibrations} = this.stats
    return (
      `calibración ${this.calibration.step} (zonas ${zones}${this.calibration.skipped.length ? `, omitida ${this.calibration.skipped.join('+')}` : ''})` +
      ` · foto ${this.photo.location} · reverso ${this.photo.backSeen ? 'visto' : 'no visto'}` +
      ` · cogida ${picks} · soltada ${drops} · recuperada ${recovers} · recalibraciones ${recalibrations}`
    )
  }

  detach(): void {
    const scene = this.host?.scene
    const objects: THREE.Object3D[] = [...this.markers.values()]
    if (this.reticle) objects.push(this.reticle)
    if (this.view) objects.push(this.view.root, this.view.backdrop)
    for (const obj of objects) {
      scene?.remove(obj)
      disposeObject(obj)
    }
    this.markers.clear()
    this.reticle = null
    this.view = null
    this.host = null
  }

  // ───────────────────────── Acciones de la UI ─────────────────────────

  confirmFloor(): void {
    if (this.calibration.step !== 'floor') return
    if (this.store.getSnapshot().reticle !== 'surface') {
      this.dispatchCalibration({type: 'MARK_FAILED', error: 'Apunta al suelo hasta ver el anillo estable.'})
      return
    }
    this.dispatchCalibration({type: 'FLOOR_CONFIRMED'})
    this.host?.log('Calibración: suelo confirmado')
  }

  markHere(): void {
    const host = this.host
    const step = this.calibration.step
    if (!host || (step !== 'safe' && step !== 'table' && step !== 'peek')) return
    const rule = ZONE_RULES[step]
    // Sin límite aquí: el reductor valida distancias con mensajes específicos de cada zona.
    const surface = host.findSurface(0.5, 0.5, rule.surface === 'floor' ? 'ground' : 'plane', Infinity)
    if (!surface.ok) {
      const error =
        step === 'table' && surface.reason !== 'too-far'
          ? 'No se detecta la superficie. Apunta a la mesa (mejor si tiene objetos o textura) y mueve el teléfono un poco.'
          : placementRejectionMessage(surface.reason, surface.distance)
      this.dispatchCalibration({type: 'MARK_FAILED', error})
      host.log(`Calibración: ${step} sin superficie (${surface.reason})`)
      return
    }
    const camera = toVec3(host.camera.position)
    this.dispatchCalibration({
      type: 'MARK',
      position: toVec3(surface.point),
      method: surface.method === 'surface-plane' ? 'surface-plane' : 'floor-plane',
      cameraPosition: camera,
    })
    const marked = this.calibration.zones[step]
    if (marked) {
      host.log(
        `Calibración: ${step} marcada a ${marked.distanceAtMark.toFixed(2)} u · ${surface.detail} · ` +
          `(${marked.position.x.toFixed(2)}, ${marked.position.y.toFixed(2)}, ${marked.position.z.toFixed(2)})`,
      )
    } else {
      host.log(`Calibración: ${step} rechazada — ${this.calibration.error ?? 'sin motivo'}`)
    }
  }

  skipZone(): void {
    const step = this.calibration.step
    this.dispatchCalibration({type: 'SKIP'})
    if (this.calibration.step !== step) this.host?.log(`Calibración: ${step} omitida`)
  }

  back(): void {
    this.dispatchCalibration({type: 'BACK'})
  }

  /** Vuelve a calibrar sin perder la fotografía: si estaba en el mundo, pasa a la mano. */
  recalibrate(): void {
    this.stats.recalibrations++
    // El examen oscurece la cámara: cerrarlo antes de calibrar para que el jugador vea su entorno.
    if (this.photo.location === 'examining') this.dispatchPhoto({type: 'CLOSE_EXAMINE'})
    if (this.photo.location === 'world') this.dispatchPhoto({type: 'RECOVER'})
    this.layout = null
    this.pendingCheck = false
    this.dispatchCalibration({type: 'RESTART'})
    this.host?.log('Calibración: reiniciada (la fotografía se conserva en la mano si estaba colocada)')
  }

  examine(): void {
    this.dispatchPhoto({type: 'EXAMINE'})
  }

  closeExamine(): void {
    this.dispatchPhoto({type: 'CLOSE_EXAMINE'})
  }

  flip(): void {
    this.dispatchPhoto({type: 'FLIP'})
  }

  setZoom(value: number): void {
    this.dispatchPhoto({type: 'ZOOM', value})
  }

  recover(): void {
    this.dispatchPhoto({type: 'RECOVER'})
  }

  drop(): void {
    const host = this.host
    if (!host || !this.layout) return
    const ray = host.rayFromScreen(0.5, 0.5)
    const target = ray ? chooseDropPoint(toVec3(ray.origin), toVec3(ray.direction), this.layout) : null
    if (!target) {
      host.notify('Apunta a la mesa o al suelo cerca de ti para soltarla.')
      return
    }
    const yaw = yawTowards(target.position, toVec3(host.camera.position))
    this.dispatchPhoto({type: 'DROP', position: target.position, yaw})
  }

  // ───────────────────────── Internos ─────────────────────────

  private dispatchCalibration(event: CalibrationEvent): void {
    const prevStep = this.calibration.step
    this.calibration = calibrationReducer(this.calibration, event)
    this.syncMarkers()
    if (prevStep !== 'done' && this.calibration.step === 'done') this.onCalibrationComplete()
    this.publish()
  }

  private dispatchPhoto(event: PhotoEvent): void {
    const prev = this.photo
    this.photo = photoReducer(prev, event)
    if (this.photo === prev) return
    const host = this.host
    if (prev.location !== this.photo.location) {
      if (event.type === 'PICK') this.stats.picks++
      if (event.type === 'DROP') this.stats.drops++
      if (event.type === 'RECOVER') this.stats.recovers++
      host?.log(`Foto: ${prev.location} → ${this.photo.location} (${event.type})`)
    }
    if (!prev.backSeen && this.photo.backSeen) host?.log('Foto: reverso examinado — inscripción y marca vistas')
    this.publish()
  }

  private onCalibrationComplete(): void {
    const host = this.host
    this.layout = toRoomLayout(this.calibration)
    if (!host || !this.layout) return
    host.log(
      `Calibración completa: mesa ${this.layout.tableZone ? 'sí' : 'no (foto en el suelo)'}, ` +
        `umbral a ${this.layout.peekZone.distanceAtMark.toFixed(2)} u`,
    )
    if (this.photo.location === 'hidden') {
      const position = photoSpawnPoint(this.layout)
      const yaw = yawTowards(position, toVec3(host.camera.position))
      this.dispatchPhoto({type: 'SPAWN', position, yaw})
    }
  }

  private syncMarkers(): void {
    const host = this.host
    if (!host) return
    for (const [kind, marker] of this.markers) {
      if (!this.calibration.zones[kind]) {
        host.scene.remove(marker)
        disposeObject(marker)
        this.markers.delete(kind)
      }
    }
    for (const zone of Object.values(this.calibration.zones)) {
      if (this.markers.has(zone.kind)) continue
      const faceYaw = yawTowards(zone.position, toVec3(host.camera.position))
      const marker = createZoneMarker(zone.kind, faceYaw)
      marker.position.set(zone.position.x, zone.position.y, zone.position.z)
      host.scene.add(marker)
      this.markers.set(zone.kind, marker)
    }
    this.refreshMarkerDimming()
  }

  private refreshMarkerDimming(): void {
    const dimmed = this.unreliable || this.pendingCheck
    for (const marker of this.markers.values()) setObjectDimmed(marker, dimmed)
  }

  private updateReticle(): void {
    const host = this.host
    const reticle = this.reticle
    if (!host || !reticle) return
    const step = this.calibration.step
    let state: ReticleState = 'none'
    let dropSurface: GameSnapshot['dropSurface'] = null

    if (step !== 'done') {
      const strategy = step === 'table' ? 'plane' : 'ground'
      const max = step === 'floor' ? FLOOR_STEP_MAX_DISTANCE : ZONE_RULES[step].maxDistance
      const surface = host.findSurface(0.5, 0.5, strategy, max)
      if (surface.ok) {
        state = 'surface'
        reticle.position.copy(surface.point)
        setReticleColor(reticle, STEP_COLORS[step])
      } else if (surface.reason === 'too-far') {
        const ray = host.rayFromScreen(0.5, 0.5)
        const p = ray ? intersectHorizontalPlane(ray.origin, ray.direction, 0) : null
        if (p) reticle.position.set(p.x, p.y, p.z)
        setReticleColor(reticle, COLOR.hostile)
        state = 'too-far'
      }
    } else if (this.photo.location === 'held' && this.layout) {
      const ray = host.rayFromScreen(0.5, 0.5)
      const target = ray ? chooseDropPoint(toVec3(ray.origin), toVec3(ray.direction), this.layout) : null
      if (target) {
        state = 'surface'
        dropSurface = target.surface
        reticle.position.set(target.position.x, target.position.y, target.position.z)
        setReticleColor(reticle, target.surface === 'table' ? COLOR.amber : COLOR.teal)
      }
    }
    reticle.visible = state !== 'none'
    this.store.set({reticle: state, dropSurface})
  }

  private applyPhotoPose(): void {
    const host = this.host
    const view = this.view
    if (!host || !view) return
    const {location} = this.photo
    view.root.visible = location !== 'hidden'
    view.backdrop.visible = location === 'examining'

    if (location === 'world' && this.photo.worldPosition) {
      const p = this.photo.worldPosition
      view.root.position.set(p.x, p.y, p.z)
      view.root.rotation.set(0, this.photo.worldYaw, 0)
      view.body.rotation.set(-Math.PI / 2, 0, 0)
      view.body.position.set(0, 0.003, 0)
    } else if (location === 'held') {
      placeRelativeToCamera(view.root, host.camera, HELD_OFFSET, HELD_ROTATION)
      view.body.rotation.set(0, 0, 0)
      view.body.position.set(0, 0, 0)
    } else if (location === 'examining') {
      const dist = EXAMINE_FAR + (EXAMINE_NEAR - EXAMINE_FAR) * this.photo.zoom
      this.examineOffset.set(0, 0, -dist)
      this.examineEuler.set(this.photo.examinePitch, this.photo.examineYaw, 0)
      this.examineRotation.setFromEuler(this.examineEuler)
      placeRelativeToCamera(view.root, host.camera, this.examineOffset, this.examineRotation)
      view.body.rotation.set(0, 0, 0)
      view.body.position.set(0, 0, 0)
      placeRelativeToCamera(view.backdrop, host.camera, BACKDROP_OFFSET, IDENTITY)
    }

    const overlay = location === 'held' || location === 'examining'
    const dimmed = location === 'world' && (this.unreliable || this.photo.needsCheck)
    const key = `${overlay}|${dimmed}`
    if (key !== this.appearanceKey) {
      setPhotoAppearance(view, {overlay, dimmed})
      this.appearanceKey = key
    }
  }

  private publish(): void {
    this.store.set({calibration: this.calibration, photo: this.photo, unreliable: this.unreliable})
  }
}
