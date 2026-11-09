// Modo compatible: vídeo de la cámara trasera + escena Three.js superpuesta.
// NO hay seguimiento espacial: el cubo está fijo respecto a la pantalla. La UI debe rotularlo así.
// Sirve para dispositivos sin SLAM y para probar UI en escritorio con webcam.
import * as THREE from 'three'
import type {ArStore} from './arStore'
import type {IARAdapter} from './IARAdapter'
import {addTestLights, createTestCube, disposeObject} from './testObject'

const STATS_INTERVAL_MS = 500

export function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permiso de cámara denegado. Actívalo en los ajustes del navegador para este sitio y vuelve a intentarlo.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No se encontró una cámara disponible en este dispositivo.'
    case 'NotReadableError':
    case 'AbortError':
      return 'La cámara está en uso por otra app o pestaña. Ciérrala y vuelve a intentarlo.'
    default:
      return err instanceof Error ? err.message : 'No se pudo abrir la cámara.'
  }
}

export class FallbackARAdapter implements IARAdapter {
  readonly mode = 'fallback' as const
  readonly capabilities = {spatialAnchoring: false, recenter: false}

  private stream: MediaStream | null = null
  private video: HTMLVideoElement | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private cube: THREE.Group | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private rafId = 0
  private lastStatsAt = 0
  private frames = 0
  /** shutdown() pedido: si getUserMedia resuelve después, la cámara se libera al momento. */
  private disposed = false

  constructor(
    private readonly container: HTMLElement,
    private readonly store: ArStore,
  ) {}

  async initialize(): Promise<void> {
    this.store.dispatch({type: 'START', mode: 'fallback'})
    this.store.log('Compatible: solicitando cámara trasera…')
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: {ideal: 'environment'}},
        audio: false,
      })
    } catch (err) {
      if (this.disposed) return
      const msg = describeCameraError(err)
      this.store.log(`Compatible: ERROR ${msg}`)
      this.store.dispatch({type: 'FAILED', error: msg})
      return
    }
    if (this.disposed) {
      // El jugador pulsó «Detener» mientras el navegador pedía permiso: no dejar la cámara encendida.
      for (const track of this.stream.getTracks()) track.stop()
      this.stream = null
      return
    }

    const video = document.createElement('video')
    video.className = 'fallback-video'
    video.playsInline = true
    video.muted = true
    video.srcObject = this.stream
    this.container.append(video)
    this.video = video
    try {
      await video.play()
    } catch (err) {
      this.store.log(`Compatible: el vídeo no arrancó (${err instanceof Error ? err.message : String(err)})`)
    }
    if (this.disposed) return // shutdown() ya liberó stream y vídeo

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.className = 'fallback-canvas'
    this.container.append(renderer.domElement)
    this.renderer = renderer

    const scene = new THREE.Scene()
    addTestLights(scene)
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50)
    const cube = createTestCube()
    cube.position.set(0, -0.12, -0.8)
    cube.rotation.set(0.35, 0.6, 0)
    scene.add(cube)
    this.scene = scene
    this.camera = camera
    this.cube = cube

    window.addEventListener('resize', this.onResize)
    this.store.dispatch({type: 'CAMERA_READY'})
    this.store.log('Compatible: cámara activa. Cubo fijo a la pantalla (SIN anclaje espacial).')
    this.rafId = requestAnimationFrame(this.loop)
  }

  recenter(): void {
    // Sin seguimiento espacial no hay origen que recentrar.
  }

  shutdown(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.onResize)
    for (const track of this.stream?.getTracks() ?? []) track.stop()
    this.stream = null
    if (this.video) {
      this.video.srcObject = null
      this.video.remove()
      this.video = null
    }
    if (this.cube) disposeObject(this.cube)
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.domElement.remove()
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.cube = null
    this.store.dispatch({type: 'STOPPED'})
    this.store.patch({fps: null})
    this.store.log('Compatible: sesión detenida, cámara liberada')
  }

  private readonly onResize = (): void => {
    if (!this.renderer || !this.camera) return
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private readonly loop = (now: number): void => {
    if (!this.renderer || !this.scene || !this.camera || !this.cube) return
    this.cube.rotation.y += 0.004
    this.renderer.render(this.scene, this.camera)
    this.frames++
    if (now - this.lastStatsAt >= STATS_INTERVAL_MS) {
      const fps = this.lastStatsAt === 0 ? null : Math.round((this.frames * 1000) / (now - this.lastStatsAt))
      this.lastStatsAt = now
      this.frames = 0
      this.store.patch({fps})
    }
    this.rafId = requestAnimationFrame(this.loop)
  }
}
