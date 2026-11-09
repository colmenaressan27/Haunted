// Adaptador SLAM real con 8th Wall Engine Binary 1.0.0 + Three.js.
// API usada (https://8thwall.org/docs/api/engine, 2026-11-09):
//   XR8.addCameraPipelineModules, XR8.run, XR8.stop, XR8.clearCameraPipelineModules, XR8.version
//   XR8.GlTextureRenderer.pipelineModule, XR8.Threejs.pipelineModule/xrScene
//   XR8.XrController.configure/pipelineModule/hitTest/recenter/updateCameraProjectionMatrix
//   Evento 'reality.trackingstatus' {status, reason}; hook onCameraStatusChange {status}.
//   CoachingOverlay.pipelineModule() (escala absoluta), eventos 'coaching-overlay.show'/'hide'.
import * as THREE from 'three'
import {describeArOptions, type ArOptions} from './arOptions'
import type {ArStore, PlacementMethod, ReticleState} from './arStore'
import {formatFpsSummary, summarizeFps} from './fpsStats'
import type {IARAdapter} from './IARAdapter'
import {
  distance,
  estimatePlaneHeight,
  intersectHorizontalPlane,
  MAX_PLACEMENT_DISTANCE,
  PLANE_SAMPLE_OFFSETS,
  placementRejectionMessage,
  type PlacementRejection,
} from './placement'
import {addTestLights, createReticle, createTestCube, disposeObject, setObjectDimmed} from './testObject'
import {shouldAskAnchorCheck} from './trackingState'

/**
 * Altura inicial de la cámara en unidades de escena. Con scale 'responsive' el suelo es y=0 y la
 * cámara arranca a esta altura, así que 1 unidad ≈ 1 m SOLO si el teléfono está a ~1,4 m del suelo.
 * Con scale 'absolute' el motor estima la altura real y la y de este origen se ignora.
 */
const CAMERA_START_HEIGHT = 1.4
const XR8_LOAD_TIMEOUT_MS = 20_000
const RETICLE_INTERVAL_MS = 150
const STATS_INTERVAL_MS = 500
const FPS_LOG_EVERY_SAMPLES = 10 // 10 × 500 ms = cada 5 s
const NOTICE_MS = 3000
const TAP_MAX_MOVE_PX = 12
const TAP_MAX_MS = 500

const RETICLE_OK = 0xd8ac6b
const RETICLE_FAR = 0xa92b36

type SurfaceResult =
  | {ok: true; point: THREE.Vector3; method: PlacementMethod; hitType: string | null; detail: string}
  | {ok: false; reason: PlacementRejection; distance?: number}

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
  private readonly invProjection = new THREE.Matrix4()
  private placements = 0
  private lastReticleAt = 0
  private lastStatsAt = 0
  private framesSinceStats = 0
  private fpsWindow: number[] = []
  private fpsSession: number[] = []
  private startedAt = 0
  private noticeTimer = 0
  private pointerDown: {x: number; y: number; t: number} | null = null
  private running = false
  /** shutdown() pedido: cualquier await pendiente de initialize() debe abortar. */
  private disposed = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly store: ArStore,
    private readonly options: ArOptions,
  ) {}

  async initialize(): Promise<void> {
    this.store.dispatch({type: 'START', mode: 'slam'})
    this.store.log(`SLAM: variante ${describeArOptions(this.options)}`)
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
    // El binario 1.0.0 de npm reporta 0.0.0.0; la versión fiable es la del paquete (package-lock).
    this.store.log(`SLAM: motor cargado (paquete 1.0.0, version() = ${version})`)

    // XR8.Threejs crea la escena con el THREE global (patrón del ejemplo oficial).
    window.THREE = THREE
    xr8.XrController.configure({scale: this.options.scale, disableWorldTracking: false})

    const extras = window.XRExtras
    if (!extras) this.store.log('Aviso: XRExtras no cargó; sin pantalla de carga ni ajuste de canvas.')
    const coaching = this.options.scale === 'absolute' ? window.CoachingOverlay : undefined
    if (this.options.scale === 'absolute' && !coaching) {
      this.store.log('Aviso: CoachingOverlay no cargó; la escala absoluta funcionará sin guía visual.')
    }

    xr8.addCameraPipelineModules([
      xr8.GlTextureRenderer.pipelineModule(),
      xr8.Threejs.pipelineModule(),
      xr8.XrController.pipelineModule(),
      ...(extras ? [extras.FullWindowCanvas.pipelineModule(), extras.Loading.pipelineModule()] : []),
      ...(coaching ? [coaching.pipelineModule()] : []),
      this.createSceneModule(xr8),
    ])

    this.canvas.hidden = false
    this.running = true
    this.startedAt = performance.now()
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

  /** Retira el objeto colocado para que el jugador lo vuelva a colocar (recuperación tras pérdida). */
  clearPlacedObject(): void {
    if (this.cube) this.cube.visible = false
    this.store.patch({placement: null, distanceToObject: null, anchorCheck: false})
    this.store.log('Ancla: retirada para recolocar')
  }

  shutdown(): void {
    if (this.disposed) return
    this.disposed = true
    this.detachInput()
    window.clearTimeout(this.noticeTimer)
    if (this.running) {
      const secs = ((performance.now() - this.startedAt) / 1000).toFixed(0)
      const losses = this.store.getSnapshot().tracking.lossCount
      this.store.log(
        `RESUMEN: ${describeArOptions(this.options)} · ${secs} s · ${formatFpsSummary(summarizeFps(this.fpsSession))}` +
          ` · pérdidas ${losses} · colocaciones ${this.placements}`,
      )
    }
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
    this.store.patch({
      fps: null,
      reticle: 'none',
      placement: null,
      distanceToObject: null,
      anchorCheck: false,
      notice: null,
    })
    this.store.log('SLAM: sesión detenida, cámara liberada')
  }

  private fail(err: unknown): void {
    const msg = errorMessage(err)
    this.store.log(`SLAM: ERROR ${msg}`)
    this.store.dispatch({type: 'FAILED', error: msg})
  }

  private notify(msg: string): void {
    this.store.patch({notice: msg})
    window.clearTimeout(this.noticeTimer)
    this.noticeTimer = window.setTimeout(() => this.store.patch({notice: null}), NOTICE_MS)
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
        this.store.log('SLAM: escena lista. Apunta al suelo y toca para colocar el cubo.')
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
            this.onTrackingStatus(detail.status, reason)
          },
        },
        {event: 'coaching-overlay.show', process: () => this.store.log('Escala absoluta: guía visible (mueve el teléfono adelante y atrás)')},
        {event: 'coaching-overlay.hide', process: () => this.store.log('Escala absoluta: escala estimada, guía oculta')},
      ],
    }
  }

  private onTrackingStatus(status: string, reason: string): void {
    const prev = this.store.getSnapshot().tracking
    this.store.dispatch({type: 'ENGINE_STATUS', status, reason})
    const next = this.store.getSnapshot().tracking
    const hasObject = this.cube?.visible === true
    if (this.cube) setObjectDimmed(this.cube, next.quality !== 'normal')
    if (shouldAskAnchorCheck(prev, next, hasObject)) {
      this.store.patch({anchorCheck: true})
      this.store.log('Ancla: tracking recuperado tras una pérdida, preguntando si el cubo sigue en su sitio')
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
      if (fps !== null) this.recordFps(fps)
      const dist =
        this.cube?.visible && this.camera ? Number(this.camera.position.distanceTo(this.cube.position).toFixed(2)) : null
      this.store.patch({fps, distanceToObject: dist})
    }
  }

  private recordFps(fps: number): void {
    this.fpsWindow.push(fps)
    this.fpsSession.push(fps)
    if (this.fpsWindow.length >= FPS_LOG_EVERY_SAMPLES) {
      this.store.log(`Rendimiento 5 s: ${formatFpsSummary(summarizeFps(this.fpsWindow))}`)
      this.fpsWindow = []
    }
  }

  /**
   * Rayo desde la cámara a través de un punto de pantalla. Se calcula a mano desde projectionMatrix
   * y matrixWorld (no con Raycaster.setFromCamera) porque XR8 escribe la proyección directamente y
   * no está documentado que mantenga projectionMatrixInverse ni el tipo PerspectiveCamera.
   */
  private rayFromScreen(nx: number, ny: number): {origin: THREE.Vector3; direction: THREE.Vector3} | null {
    const cam = this.camera
    if (!cam) return null
    cam.updateMatrixWorld()
    this.invProjection.copy(cam.projectionMatrix).invert()
    const origin = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld)
    const through = new THREE.Vector3(nx * 2 - 1, -(ny * 2 - 1), 0.5)
      .applyMatrix4(this.invProjection)
      .applyMatrix4(cam.matrixWorld)
    const direction = through.sub(origin).normalize()
    return Number.isFinite(direction.x) ? {origin, direction} : null
  }

  /** Busca la superficie bajo un punto normalizado de pantalla según la estrategia configurada. */
  private findSurface(nx: number, ny: number): SurfaceResult {
    if (!this.xr8 || !this.camera) return {ok: false, reason: 'no-surface'}
    const cameraPos = this.camera.position
    let result: SurfaceResult

    switch (this.options.placement) {
      case 'ground':
        result = this.groundPlaneSurface(nx, ny, 0, 'ground-plane', 'plano y=0')
        break
      case 'hit': {
        const hits = this.xr8.XrController.hitTest(nx, ny, ['FEATURE_POINT'])
        const nearest = hits.reduce<Xr8HitResult | null>(
          (best, h) => (best === null || h.distance < best.distance ? h : best),
          null,
        )
        result = nearest
          ? {
              ok: true,
              point: new THREE.Vector3(nearest.position.x, nearest.position.y, nearest.position.z),
              method: 'hit-test',
              hitType: nearest.type,
              detail: '1 punto',
            }
          : {ok: false, reason: 'no-surface'}
        break
      }
      case 'plane': {
        const ys: number[] = []
        for (const [dx, dy] of PLANE_SAMPLE_OFFSETS) {
          for (const h of this.xr8.XrController.hitTest(nx + dx, ny + dy, ['FEATURE_POINT'])) ys.push(h.position.y)
        }
        const plane = estimatePlaneHeight(ys)
        result = plane
          ? this.groundPlaneSurface(
              nx,
              ny,
              plane.y,
              'surface-plane',
              `${plane.inliers}/${ys.length} muestras, dispersión ${plane.spread.toFixed(3)}`,
            )
          : {ok: false, reason: ys.length === 0 ? 'no-surface' : 'no-consensus'}
        break
      }
    }

    if (result.ok) {
      const d = distance(result.point, cameraPos)
      if (d > MAX_PLACEMENT_DISTANCE) return {ok: false, reason: 'too-far', distance: d}
    }
    return result
  }

  private groundPlaneSurface(
    nx: number,
    ny: number,
    planeY: number,
    method: PlacementMethod,
    detail: string,
  ): SurfaceResult {
    const ray = this.rayFromScreen(nx, ny)
    const p = ray ? intersectHorizontalPlane(ray.origin, ray.direction, planeY) : null
    return p
      ? {ok: true, point: new THREE.Vector3(p.x, p.y, p.z), method, hitType: null, detail}
      : {ok: false, reason: 'no-surface'}
  }

  private updateReticle(): void {
    if (!this.reticle) return
    const surface = this.findSurface(0.5, 0.5)
    let state: ReticleState = 'none'
    const mat = this.reticle.material as THREE.MeshBasicMaterial
    if (surface.ok) {
      state = 'surface'
      this.reticle.position.copy(surface.point)
      mat.color.setHex(RETICLE_OK)
    } else if (surface.reason === 'too-far') {
      // Se muestra en rojo sobre el suelo para que se entienda por qué no se puede colocar.
      const ray = this.rayFromScreen(0.5, 0.5)
      const p = ray ? intersectHorizontalPlane(ray.origin, ray.direction, 0) : null
      if (p) this.reticle.position.set(p.x, p.y, p.z)
      mat.color.setHex(RETICLE_FAR)
      state = 'too-far'
    }
    this.reticle.visible = state !== 'none'
    this.store.patch({reticle: state})
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
    if (!surface.ok) {
      const msg = placementRejectionMessage(surface.reason, surface.distance)
      this.notify(msg)
      this.store.log(`Colocar rechazado: ${surface.reason}${surface.distance ? ` ${surface.distance.toFixed(2)} u` : ''}`)
      return
    }
    if (!this.cube) {
      this.cube = createTestCube(this.options.cubeSize)
      this.scene.add(this.cube)
    }
    this.cube.visible = true
    this.cube.position.copy(surface.point)
    setObjectDimmed(this.cube, this.store.getSnapshot().tracking.quality !== 'normal')
    this.placements++
    this.store.patch({
      placement: {method: surface.method, hitType: surface.hitType, count: this.placements},
      anchorCheck: false,
      notice: null,
    })
    const p = surface.point
    const d = this.camera ? distance(p, this.camera.position) : NaN
    this.store.log(
      `Colocar #${this.placements}: ${surface.method}${surface.hitType ? ` (${surface.hitType})` : ''} · ${surface.detail}` +
        ` · (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) · a ${d.toFixed(2)} u`,
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
