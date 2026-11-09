// Declaraciones mínimas de la API de 8th Wall Engine Binary 1.0.0 que usa este proyecto.
// Fuente: https://8thwall.org/docs/api/engine (consultado 2026-11-09). Solo se declara lo que
// la documentación oficial describe y que el código usa; ampliar únicamente tras verificar la doc.
import type {Camera, Quaternion, Scene, Vector3, WebGLRenderer} from 'three'

declare global {
  interface Xr8Vec3 {x: number; y: number; z: number}
  interface Xr8Quat {x: number; y: number; z: number; w: number}

  type Xr8HitType = 'FEATURE_POINT' | 'ESTIMATED_SURFACE' | 'DETECTED_SURFACE' | 'UNSPECIFIED'

  interface Xr8HitResult {
    type: Xr8HitType
    position: Xr8Vec3
    rotation: Xr8Quat
    distance: number
  }

  type Xr8CameraStatus = 'requesting' | 'hasStream' | 'hasVideo' | 'failed'

  interface Xr8PipelineEvent {
    name: string
    detail: unknown
  }

  interface Xr8PipelineModule {
    name: string
    onStart?: (args: {canvas: HTMLCanvasElement}) => void
    onUpdate?: () => void
    onCameraStatusChange?: (args: {status: Xr8CameraStatus}) => void
    onException?: (error: unknown) => void
    onDetach?: () => void
    listeners?: Array<{event: string; process: (event: Xr8PipelineEvent) => void}>
  }

  interface Xr8ThreejsScene {
    scene: Scene
    camera: Camera
    renderer: WebGLRenderer
  }

  interface Xr8 {
    addCameraPipelineModules(modules: Xr8PipelineModule[]): void
    clearCameraPipelineModules(): void
    run(config: {canvas: HTMLCanvasElement}): void
    stop(): void
    version(): string
    GlTextureRenderer: {pipelineModule(): Xr8PipelineModule}
    Threejs: {
      pipelineModule(): Xr8PipelineModule
      xrScene(): Xr8ThreejsScene
    }
    XrController: {
      pipelineModule(): Xr8PipelineModule
      configure(options: {scale?: 'responsive' | 'absolute'; disableWorldTracking?: boolean}): void
      hitTest(x: number, y: number, includedTypes?: Xr8HitType[]): Xr8HitResult[]
      recenter(): void
      updateCameraProjectionMatrix(args: {origin: Vector3; facing: Quaternion}): void
    }
  }

  interface XrExtrasApi {
    FullWindowCanvas: {pipelineModule(): Xr8PipelineModule}
    Loading: {pipelineModule(): Xr8PipelineModule}
  }

  interface Window {
    XR8?: Xr8
    XRExtras?: XrExtrasApi
    /** @8thwall/coaching-overlay 1.0.0: guía para escala absoluta. Eventos coaching-overlay.show/hide. */
    CoachingOverlay?: {pipelineModule(): Xr8PipelineModule}
    THREE?: unknown
  }
}

export {}
