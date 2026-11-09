// Adaptador SLAM real con 8th Wall Engine Binary 1.0.0 + Three.js.
// API usada (https://8thwall.org/docs/api/engine, 2026-11-09):
//   XR8.addCameraPipelineModules, XR8.run, XR8.stop, XR8.clearCameraPipelineModules, XR8.version
//   XR8.GlTextureRenderer.pipelineModule, XR8.Threejs.pipelineModule/xrScene
//   XR8.XrController.configure/pipelineModule/hitTest/recenter/updateCameraProjectionMatrix
//   Evento 'reality.trackingstatus' {status, reason}; hook onCameraStatusChange {status}.
import * as THREE from 'three'
import type {ArStore, ReticleState} from './arStore'
import type {IARAdapter} from './IARAdapter'
import {addTestLights, createReticle, createTestCube, disposeObject} from './testObject'

/**
 * Altura inicial de la cámara en unidades de escena. Con scale 'responsive' el suelo es y=0 y la
 * cámara arranca a esta altura, así que 1 unidad ≈ 1 m SOLO si el teléfono está a ~1,4 m del suelo.
 * Es una aproximación; la escala absoluta ('absolute') queda para evaluar en el Hito 1.
 */
const CAMERA_START_HEIGHT = 1.4
const XR8_LOAD_TIMEOUT_MS = 20_000
const RETICLE_INTERVAL_MS = 100
const STATS_INTERVAL_MS = 500
const TAP_MAX_MOVE_PX = 12
const TAP_MAX_MS = 500

function waitForXr8(timeoutMs: number): Promise<Xr8> {
  return new Promise((resolve, reject) => {
    if (window.XR8) {
      resolve(window.XR8)
      return
    }
    const timer = window.setTimeout(() => {
      window.removeEventListener('xrloaded', onLoaded)
      reject(new Error('El motor 8th Wall no cargó a tiempo (red lenta o archivo external/xr/xr.js ausente).'))
    }, timeoutMs)
    function onLoaded() {
      window.clearTimeout(timer)
      if (window.XR8) resolve(window.XR8)
      else reject(new Error('Evento xrloaded sin window.XR8.'))
    }
    window.addEventListener('xrloaded', onLoaded, {once: true})
  })
}

function isTrackingDetail(d: unknown): d is {status: string; reason: string} {
  return typeof d === 'object' && d !== null && 'status' in d && typeof d.status === 'string'
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Error desconocido del motor'
  }
}

export class EighthWallAdapter implements IARAdapter {
  readonly mode = 'slam' as const
  readonly capabilities = {spatialAnchoring: true, recenter: true}

  private xr8: Xr8 | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.Camera | null = null
  private cube: THREE.Group | null = null
  private reticle: THREE.Mesh | null = null
  private readonly raycaster = new THREE.Raycaster()
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private placements = 0
  private lastReticleAt = 0
  private lastStatsAt = 0
  private framesSinceStats = 0
  private pointerDown: {x: number; y: number; t: number} | null = null
  private running = false
  /** shutdown() pedido: cualquier await pendiente de initialize() debe abortar. */
  private disposed = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly store: ArStore,
  ) {}

  async initialize(): Promise<void> {
    this.store.dispatch({type: 'START', mode: 'slam'})
    this.store.log('SLAM: esperando motor 8th Wall…')

    let xr8: Xr8
    try {
      xr8 = await waitForXr8(XR8_LOAD_TIMEOUT_MS)
    } catch (err) {
      if (!this.disposed) this.fail(err)
      return
    }
    if (this.disposed) return // el jugador detuvo antes de que cargara el motor
    this.xr8 = xr8
    const version = xr8.version()
    this.store.patch({engineVersion: version})
    this.store.log(`SLAM: motor cargado (XR8 ${version})`)

    // XR8.Threejs crea la escena con el THREE global (patrón del ejemplo oficial).
    window.THREE = THREE
    xr8.XrController.configure({scale: 'responsive', disableWorldTracking: false})

    const extras = window.XRExtras
    if (!extras) this.store.log('Aviso: XRExtras no cargó; sin pantalla de carga ni ajuste de canvas.')

    xr8.addCameraPipelineModules([
      xr8.GlTextureRenderer.pipelineModule(),
      xr8.Threejs.pipelineModule(),
      xr8.XrController.pipelineModule(),
      ...(extras ? [extras.FullWindowCanvas.pipelineModule(), extras.Loading.pipelineModule()] : []),
      this.createSceneModule(xr8),
    ])

    this.canvas.hidden = false
    this.running = true
    try {
      xr8.run({canvas: this.canvas})
    } catch (err) {
      this.fail(err)
    }
  }

  recenter(): void {
    if (!this.xr8 || !this.running) return
    this.xr8.XrController.recenter()
    this.store.log('SLAM: recentrado (el origen vuelve a la posición actual)')
  }

  shutdown(): void {
    if (this.disposed) return
    this.disposed = true
    this.detachInput()
    if (this.xr8 && this.running) {
      try {
        this.xr8.stop()
        this.xr8.clearCameraPipelineModules()
      } catch (err) {
        this.store.log(`SLAM: error al detener: ${errorMessage(err)}`)
      }
    }
    if (this.scene) {
      if (this.cube) {
        this.scene.remove(this.cube)
        disposeObject(this.cube)
      }
      if (this.reticle) {
        this.scene.remove(this.reticle)
        disposeObject(this.reticle)
      }
    }
    this.running = false
    this.cube = null
    this.reticle = null
    this.scene = null
    this.camera = null
    this.canvas.hidden = true
    this.store.dispatch({type: 'STOPPED'})
    this.store.patch({fps: null, reticle: 'none', placement: null, distanceToObject: null})
    this.store.log('SLAM: sesión detenida, cámara liberada')
  }

  private fail(err: unknown): void {
    const msg = errorMessage(err)
    this.store.log(`SLAM: ERROR ${msg}`)
    this.store.dispatch({type: 'FAILED', error: msg})
  }

  private createSceneModule(xr8: Xr8): Xr8PipelineModule {
    return {
      name: 'haunted-hito0',
      onStart: ({canvas}) => {
        const {scene, camera} = xr8.Threejs.xrScene()
        this.scene = scene
        this.camera = camera

        addTestLights(scene)
        this.reticle = createReticle()
        scene.add(this.reticle)

        camera.position.set(0, CAMERA_START_HEIGHT, 0)
        xr8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion})

        canvas.addEventListener('touchmove', preventDefault, {passive: false})
        canvas.addEventListener('pointerdown', this.onPointerDown)
        canvas.addEventListener('pointerup', this.onPointerUp)
        this.store.log('SLAM: escena lista. Apunta al suelo o a una mesa y toca para colocar el cubo.')
      },
      onCameraStatusChange: ({status}) => {
        this.store.log(`Cámara: ${status}`)
        if (status === 'hasVideo') this.store.dispatch({type: 'CAMERA_READY'})
        if (status === 'failed') {
          this.store.dispatch({
            type: 'FAILED',
            error: 'No se pudo abrir la cámara. Revisa que el navegador tenga permiso de cámara y movimiento.',
          })
        }
      },
      onUpdate: () => this.onFrame(),
      onException: (err) => this.fail(err),
      listeners: [
        {
          event: 'reality.trackingstatus',
          process: ({detail}) => {
            if (!isTrackingDetail(detail)) return
            const reason = typeof detail.reason === 'string' ? detail.reason : 'UNKNOWN'
            this.store.log(`Tracking: ${detail.status} / ${reason}`)
            this.store.dispatch({type: 'ENGINE_STATUS', status: detail.status, reason})
          },
        },
      ],
    }
  }

  private onFrame(): void {
    const now = performance.now()
    this.framesSinceStats++

    if (now - this.lastReticleAt >= RETICLE_INTERVAL_MS) {
      this.lastReticleAt = now
      this.updateReticle()
    }

    if (now - this.lastStatsAt >= STATS_INTERVAL_MS) {
      const elapsed = now - this.lastStatsAt
      const fps = this.lastStatsAt === 0 ? null : Math.round((this.framesSinceStats * 1000) / elapsed)
      this.lastStatsAt = now
      this.framesSinceStats = 0
      const distance =
        this.cube && this.camera ? Number(this.camera.position.distanceTo(this.cube.position).toFixed(2)) : null
      this.store.patch({fps, distanceToObject: distance})
    }
  }

  /** Busca superficie bajo un punto normalizado de pantalla: hit-test SLAM y, si no hay, plano de suelo y=0. */
  private findSurface(nx: number, ny: number): {point: THREE.Vector3; kind: ReticleState; hitType: string | null} | null {
    if (!this.xr8 || !this.camera) return null
    const hits = this.xr8.XrController.hitTest(nx, ny, ['FEATURE_POINT'])
    const nearest = hits.reduce<Xr8HitResult | null>(
      (best, h) => (best === null || h.distance < best.distance ? h : best),
      null,
    )
    if (nearest) {
      const {x, y, z} = nearest.position
      return {point: new THREE.Vector3(x, y, z), kind: 'feature-point', hitType: nearest.type}
    }
    this.raycaster.setFromCamera(new THREE.Vector2(nx * 2 - 1, -(ny * 2 - 1)), this.camera)
    const point = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.groundPlane, point)) {
      return {point, kind: 'ground-plane', hitType: null}
    }
    return null
  }

  private updateReticle(): void {
    if (!this.reticle) return
    const surface = this.findSurface(0.5, 0.5)
    if (surface) {
      this.reticle.visible = true
      this.reticle.position.copy(surface.point)
      const mat = this.reticle.material as THREE.MeshBasicMaterial
      mat.color.setHex(surface.kind === 'feature-point' ? 0xd8ac6b : 0x7199a0)
    } else {
      this.reticle.visible = false
    }
    this.store.patch({reticle: surface?.kind ?? 'none'})
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.pointerDown = {x: e.clientX, y: e.clientY, t: performance.now()}
  }

  private readonly onPointerUp = (e: PointerEvent): void => {
    const down = this.pointerDown
    this.pointerDown = null
    if (!down) return
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
    if (moved > TAP_MAX_MOVE_PX || performance.now() - down.t > TAP_MAX_MS) return
    const rect = this.canvas.getBoundingClientRect()
    this.placeAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height)
  }

  private placeAt(nx: number, ny: number): void {
    if (!this.scene) return
    const surface = this.findSurface(nx, ny)
    if (!surface) {
      this.store.log('Colocar: sin superficie en ese punto. Apunta hacia el suelo o una mesa.')
      return
    }
    if (!this.cube) {
      this.cube = createTestCube()
      this.scene.add(this.cube)
    }
    this.cube.position.copy(surface.point)
    this.placements++
    const method = surface.kind === 'feature-point' ? 'hit-test' : 'ground-plane'
    this.store.patch({placement: {method, hitType: surface.hitType, count: this.placements}})
    const p = surface.point
    this.store.log(
      `Colocar #${this.placements}: ${method}${surface.hitType ? ` (${surface.hitType})` : ''} en ` +
        `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`,
    )
  }

  private detachInput(): void {
    this.canvas.removeEventListener('touchmove', preventDefault)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
  }
}

function preventDefault(e: Event): void {
  e.preventDefault()
}
