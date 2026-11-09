// Prueba de anclaje (Hito 0/0.1): colocar un cubo estático y comprobar la deriva. Se conserva como
// herramienta de QA para validar teléfonos antes de abrir el stand al público.
import type * as THREE from 'three'
import {describeArOptions, type ArOptions} from '../../ar/arOptions'
import type {ArStore, ReticleState} from '../../ar/arStore'
import {distance, intersectHorizontalPlane, placementRejectionMessage} from '../../ar/placement'
import type {SpatialController, SpatialHost} from '../../ar/SpatialController'
import type {TrackingState} from '../../ar/trackingState'
import {COLOR, createReticle, disposeObject, setObjectDimmed, setReticleColor} from '../../presentation/sceneUtils'
import {createTestCube} from '../../presentation/testCube'

const RETICLE_INTERVAL_MS = 150
const DISTANCE_INTERVAL_MS = 500

export class AnchorTestController implements SpatialController {
  readonly name = 'prueba de anclaje'
  private host: SpatialHost | null = null
  private cube: THREE.Group | null = null
  private reticle: THREE.Mesh | null = null
  private placements = 0
  private lastReticleAt = 0
  private lastDistanceAt = 0

  constructor(
    private readonly store: ArStore,
    private readonly options: ArOptions,
  ) {}

  attach(host: SpatialHost): void {
    this.host = host
    this.reticle = createReticle()
    host.scene.add(this.reticle)
    host.log(`Prueba de anclaje (${describeArOptions(this.options)}): apunta al suelo y toca para colocar el cubo.`)
  }

  onFrame(now: number): void {
    if (now - this.lastReticleAt >= RETICLE_INTERVAL_MS) {
      this.lastReticleAt = now
      this.updateReticle()
    }
    if (now - this.lastDistanceAt >= DISTANCE_INTERVAL_MS && this.host) {
      this.lastDistanceAt = now
      const d = this.cube?.visible ? Number(this.host.camera.position.distanceTo(this.cube.position).toFixed(2)) : null
      this.store.patch({distanceToObject: d})
    }
  }

  onTap(nx: number, ny: number): void {
    const host = this.host
    if (!host) return
    const surface = host.findSurface(nx, ny, this.options.placement)
    if (!surface.ok) {
      host.notify(placementRejectionMessage(surface.reason, surface.distance))
      host.log(`Colocar rechazado: ${surface.reason}${surface.distance ? ` ${surface.distance.toFixed(2)} u` : ''}`)
      return
    }
    if (!this.cube) {
      this.cube = createTestCube(this.options.cubeSize)
      host.scene.add(this.cube)
    }
    this.cube.visible = true
    this.cube.position.copy(surface.point)
    setObjectDimmed(this.cube, this.store.getSnapshot().tracking.quality !== 'normal')
    this.placements++
    this.store.patch({
      placement: {method: surface.method, hitType: surface.hitType, count: this.placements},
      notice: null,
    })
    const p = surface.point
    host.log(
      `Colocar #${this.placements}: ${surface.method}${surface.hitType ? ` (${surface.hitType})` : ''} · ${surface.detail}` +
        ` · (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) · a ${distance(p, host.camera.position).toFixed(2)} u`,
    )
  }

  onDrag(): void {
    // La prueba de anclaje no usa arrastre.
  }

  onTrackingChange(_prev: TrackingState, next: TrackingState): void {
    if (this.cube) setObjectDimmed(this.cube, next.quality !== 'normal')
  }

  onPoseJump(): void {
    // El adaptador ya registra el salto y pregunta al jugador.
  }

  onAnchorAnswer(moved: boolean): void {
    if (!moved || !this.cube) return
    this.cube.visible = false
    this.store.patch({placement: null, distanceToObject: null})
    this.host?.log('Ancla: cubo retirado para recolocar')
  }

  hasPlacedContent(): boolean {
    return this.cube?.visible === true
  }

  summary(): string {
    return `colocaciones ${this.placements}`
  }

  detach(): void {
    const scene = this.host?.scene
    for (const obj of [this.cube, this.reticle]) {
      if (obj) {
        scene?.remove(obj)
        disposeObject(obj)
      }
    }
    this.cube = null
    this.reticle = null
    this.host = null
  }

  private updateReticle(): void {
    const host = this.host
    const reticle = this.reticle
    if (!host || !reticle) return
    const surface = host.findSurface(0.5, 0.5, this.options.placement)
    let state: ReticleState = 'none'
    if (surface.ok) {
      state = 'surface'
      reticle.position.copy(surface.point)
      setReticleColor(reticle, COLOR.amber)
    } else if (surface.reason === 'too-far') {
      const ray = host.rayFromScreen(0.5, 0.5)
      const p = ray ? intersectHorizontalPlane(ray.origin, ray.direction, 0) : null
      if (p) reticle.position.set(p.x, p.y, p.z)
      setReticleColor(reticle, COLOR.hostile)
      state = 'too-far'
    }
    reticle.visible = state !== 'none'
    this.store.patch({reticle: state})
  }
}
