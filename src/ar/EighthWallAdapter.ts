// Adaptador SLAM real con 8th Wall Engine Binary 1.0.0 + Three.js. Solo motor: cámara, tracking,
// entrada, rendimiento y saltos de pose. El contenido lo gestiona un SpatialController.
// API usada (https://8thwall.org/docs/api/engine, 2026-11-09):
//   XR8.addCameraPipelineModules, XR8.run, XR8.stop, XR8.clearCameraPipelineModules, XR8.version
//   XR8.GlTextureRenderer.pipelineModule, XR8.Threejs.pipelineModule/xrScene
//   XR8.XrController.configure/pipelineModule/hitTest/recenter/updateCameraProjectionMatrix
//   Evento 'reality.trackingstatus' {status, reason}; hook onCameraStatusChange {status}.
//   CoachingOverlay.pipelineModule() (escala absoluta), eventos 'coaching-overlay.show'/'hide'.
import * as THREE from 'three'
import {PoseJumpDetector} from '../game/poseJump'
import {addLights} from '../presentation/sceneUtils'
import {describeArOptions, type ArOptions, type PlacementStrategy} from './arOptions'
import type {ArStore} from './arStore'
import {formatFpsSummary, summarizeFps} from './fpsStats'
import type {IARAdapter} from './IARAdapter'
import {
  distance,
  estimatePlaneHeight,
  intersectHorizontalPlane,
  MAX_PLACEMENT_DISTANCE,
  PLANE_SAMPLE_OFFSETS,
} from './placement'
import type {ScreenRay, SpatialController, SpatialHost, SurfaceResult} from './SpatialController'
import {shouldAskAnchorCheck} from './trackingState'

/**
 * Altura inicial de la cámara en unidades de escena. Con scale 'responsive' el suelo es y=0 y la
 * cámara arranca a esta altura, así que 1 unidad ≈ 1 m SOLO si el teléfono está a ~1,4 m del suelo.
 * QA 2026-11-09: el «suelo» es la superficie hacia la que se apunta al iniciar (una mesa cuenta).
 */
const CAMERA_START_HEIGHT = 1.4
const XR8_LOAD_TIMEOUT_MS = 20_000
const STATS_INTERVAL_MS = 500
const FPS_LOG_EVERY_SAMPLES = 10 // 10 × 500 ms = cada 5 s
const NOTICE_MS = 3000
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

interface PointerTrack {
  startX: number
  startY: number
  lastX: number
  lastY: number
  t: number
  dragging: boolean
}

export class EighthWallAdapter implements IARAdapter {
  readonly mode = 'slam' as const
  readonly capabilities = {spatialAnchoring: true, recenter: true}

  private xr8: Xr8 | null = null
  private camera: THREE.Camera | null = null
  private readonly invProjection = new THREE.Matrix4()
  private readonly poseJumps = new PoseJumpDetector()
  private lastStatsAt = 0
  private framesSinceStats = 0
  private fpsWindow: number[] = []
  private fpsSession: number[] = []
  private poseJumpCount = 0
  private startedAt = 0
  private noticeTimer = 0
  private pointer: PointerTrack | null = null
  private running = false
  private attached = false
  /** shutdown() pedido: cualquier await pendiente de initialize() debe abortar. */
  private disposed = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly store: ArStore,
    private readonly options: ArOptions,
    private readonly controller: SpatialController,
  ) {}

  async initialize(): Promise<void> {
    this.store.dispatch({type: 'START', mode: 'slam'})
    this.store.log(`SLAM: sesión «${this.controller.name}» · ${describeArOptions(this.options)}`)
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
    this.poseJumps.reset() // el salto de origen es intencional, no una corrección silenciosa
    this.store.log('SLAM: recentrado (el origen vuelve a la posición actual)')
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
        `RESUMEN: ${this.controller.name} · ${describeArOptions(this.options)} · ${secs} s · ` +
          `${formatFpsSummary(summarizeFps(this.fpsSession))} · pérdidas ${losses} · saltos ${this.poseJumpCount}` +
          ` · ${this.controller.summary()}`,
      )
    }
    if (this.attached) this.controller.detach()
    this.attached = false
    if (this.xr8 && this.running) {
      try {
        this.xr8.stop()
        this.xr8.clearCameraPipelineModules()
      } catch (err) {
        this.store.log(`SLAM: error al detener: ${errorMessage(err)}`)
      }
    }
    this.running = false
    this.camera = null
    this.canvas.hidden = true
    this.store.dispatch({type: 'STOPPED'})
    this.store.patch({
      fps: null,
      reticle: 'none',
      placement: null,
      distanceToObject: null,
      anchorCheck: null,
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

  private createHost(scene: THREE.Scene, camera: THREE.Camera): SpatialHost {
    return {
      scene,
      camera,
      rayFromScreen: (nx, ny) => this.rayFromScreen(nx, ny),
      findSurface: (nx, ny, strategy, maxDistance) => this.findSurface(nx, ny, strategy, maxDistance),
      log: (msg) => this.store.log(msg),
      notify: (msg) => this.notify(msg),
    }
  }

  private createSceneModule(xr8: Xr8): Xr8PipelineModule {
    return {
      name: 'haunted-session',
      onStart: ({canvas}) => {
        const {scene, camera} = xr8.Threejs.xrScene()
        this.camera = camera
        addLights(scene)

        camera.position.set(0, CAMERA_START_HEIGHT, 0)
        xr8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion})

        canvas.addEventListener('touchmove', preventDefault, {passive: false})
        canvas.addEventListener('pointerdown', this.onPointerDown)
        canvas.addEventListener('pointermove', this.onPointerMove)
        canvas.addEventListener('pointerup', this.onPointerUp)
        canvas.addEventListener('pointercancel', this.onPointerCancel)

        this.controller.attach(this.createHost(scene, camera))
        this.attached = true
        this.store.log('SLAM: escena lista')
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
        {
          event: 'coaching-overlay.show',
          process: () => this.store.log('Escala absoluta: guía visible (mueve el teléfono adelante y atrás)'),
        },
        {event: 'coaching-overlay.hide', process: () => this.store.log('Escala absoluta: escala estimada, guía oculta')},
      ],
    }
  }

  private onTrackingStatus(status: string, reason: string): void {
    const prev = this.store.getSnapshot().tracking
    this.store.dispatch({type: 'ENGINE_STATUS', status, reason})
    const next = this.store.getSnapshot().tracking
    if (prev.quality !== next.quality) this.poseJumps.reset()
    if (this.attached) this.controller.onTrackingChange(prev, next)
    if (this.attached && shouldAskAnchorCheck(prev, next, this.controller.hasPlacedContent())) {
      this.store.patch({anchorCheck: 'recovered'})
      this.store.log('Ancla: tracking recuperado tras una pérdida, preguntando si el contenido sigue en su sitio')
    }
  }

  private onFrame(): void {
    const now = performance.now()
    this.framesSinceStats++

    if (this.camera && this.attached) {
      this.detectPoseJump(now)
      this.controller.onFrame(now)
    }

    if (now - this.lastStatsAt >= STATS_INTERVAL_MS) {
      const elapsed = now - this.lastStatsAt
      const fps = this.lastStatsAt === 0 ? null : Math.round((this.framesSinceStats * 1000) / elapsed)
      this.lastStatsAt = now
      this.framesSinceStats = 0
      if (fps !== null) this.recordFps(fps)
      this.store.patch({fps})
    }
  }

  private detectPoseJump(now: number): void {
    if (!this.camera || this.store.getSnapshot().tracking.quality !== 'normal') return
    const {x, y, z} = this.camera.position
    const result = this.poseJumps.update({x, y, z}, now)
    if (!result.jump) return
    this.poseJumpCount++
    this.store.log(`SALTO de pose: ${result.delta.toFixed(2)} u en un fotograma sin aviso del motor`)
    if (this.controller.hasPlacedContent()) {
      this.controller.onPoseJump(result.delta)
      this.store.patch({anchorCheck: 'jump'})
      this.store.log('Ancla: preguntando si el contenido sigue en su sitio tras el salto')
    }
  }

  private recordFps(fps: number): void {
    this.fpsWindow.push(fps)
    this.fpsSession.push(fps)
    if (this.fpsWindow.length >= FPS_LOG_EVERY_SAMPLES) {
      const peak = this.poseJumps.takePeak()
      this.store.log(
        `Rendimiento 5 s: ${formatFpsSummary(summarizeFps(this.fpsWindow))} · pico mov. ${peak.toFixed(3)} u/fotograma`,
      )
      this.fpsWindow = []
    }
  }

  /**
   * Rayo desde la cámara a través de un punto de pantalla. Se calcula a mano desde projectionMatrix
   * y matrixWorld (no con Raycaster.setFromCamera) porque XR8 escribe la proyección directamente y
   * no está documentado que mantenga projectionMatrixInverse ni el tipo PerspectiveCamera.
   * Validado en iPhone (QA Hito 0.1): el suelo estimado coloca donde apunta la retícula.
   */
  private rayFromScreen(nx: number, ny: number): ScreenRay | null {
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

  /** Busca la superficie bajo un punto normalizado de pantalla según la estrategia indicada. */
  private findSurface(
    nx: number,
    ny: number,
    strategy: PlacementStrategy,
    maxDistance: number = MAX_PLACEMENT_DISTANCE,
  ): SurfaceResult {
    if (!this.xr8 || !this.camera) return {ok: false, reason: 'no-surface'}
    let result: SurfaceResult

    switch (strategy) {
      case 'ground':
        result = this.planeSurface(nx, ny, 0, 'ground-plane', 'plano y=0')
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
          ? this.planeSurface(
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
      const d = distance(result.point, this.camera.position)
      if (d > maxDistance) return {ok: false, reason: 'too-far', distance: d}
    }
    return result
  }

  private planeSurface(
    nx: number,
    ny: number,
    planeY: number,
    method: 'ground-plane' | 'surface-plane',
    detail: string,
  ): SurfaceResult {
    const ray = this.rayFromScreen(nx, ny)
    const p = ray ? intersectHorizontalPlane(ray.origin, ray.direction, planeY) : null
    return p
      ? {ok: true, point: new THREE.Vector3(p.x, p.y, p.z), method, hitType: null, detail}
      : {ok: false, reason: 'no-surface'}
  }

  private normalized(e: PointerEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect()
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.pointer = {startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, t: performance.now(), dragging: false}
  }

  private readonly onPointerMove = (e: PointerEvent): void => {
    const p = this.pointer
    if (!p) return
    if (!p.dragging && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > TAP_MAX_MOVE_PX) p.dragging = true
    if (p.dragging && this.attached) this.controller.onDrag(e.clientX - p.lastX, e.clientY - p.lastY)
    p.lastX = e.clientX
    p.lastY = e.clientY
  }

  private readonly onPointerUp = (e: PointerEvent): void => {
    const p = this.pointer
    this.pointer = null
    if (!p || p.dragging || performance.now() - p.t > TAP_MAX_MS || !this.attached) return
    const [nx, ny] = this.normalized(e)
    this.controller.onTap(nx, ny)
  }

  private readonly onPointerCancel = (): void => {
    this.pointer = null
  }

  private detachInput(): void {
    this.canvas.removeEventListener('touchmove', preventDefault)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel)
  }
}

function preventDefault(e: Event): void {
  e.preventDefault()
}
