// Contrato entre el adaptador SLAM (motor) y un controlador de sesión (qué se juega).
// El adaptador posee cámara, canvas, tracking y entrada; el controlador posee el contenido.
import type * as THREE from 'three'
import type {PlacementStrategy} from './arOptions'
import type {PlacementMethod} from './arStore'
import type {PlacementRejection} from './placement'
import type {TrackingState} from './trackingState'

export interface ScreenRay {
  origin: THREE.Vector3
  direction: THREE.Vector3
}

export type SurfaceResult =
  | {ok: true; point: THREE.Vector3; method: PlacementMethod; hitType: string | null; detail: string}
  | {ok: false; reason: PlacementRejection; distance?: number}

/** Lo que el motor ofrece al controlador una vez que la escena existe. */
export interface SpatialHost {
  readonly scene: THREE.Scene
  readonly camera: THREE.Camera
  /** Rayo desde la cámara por un punto normalizado de pantalla (0..1). */
  rayFromScreen(nx: number, ny: number): ScreenRay | null
  /** Superficie bajo un punto de pantalla según la estrategia; rechaza más allá de maxDistance. */
  findSurface(nx: number, ny: number, strategy: PlacementStrategy, maxDistance?: number): SurfaceResult
  log(msg: string): void
  /** Mensaje breve para el jugador (se borra solo). */
  notify(msg: string): void
}

export interface SpatialController {
  readonly name: string
  attach(host: SpatialHost): void
  /** Cada fotograma, después de que el motor actualice la cámara y antes del render. */
  onFrame(nowMs: number): void
  /** Toque corto en el canvas (coordenadas normalizadas). */
  onTap(nx: number, ny: number): void
  /** Arrastre en el canvas (píxeles desde el evento anterior). */
  onDrag(dxPx: number, dyPx: number): void
  onTrackingChange(prev: TrackingState, next: TrackingState): void
  /** Corrección silenciosa de pose detectada por el adaptador. */
  onPoseJump(delta: number): void
  /** Respuesta del jugador a «¿Sigue en su sitio?» tras una pérdida o un salto. */
  onAnchorAnswer(moved: boolean): void
  /** Hay contenido anclado al mundo cuya posición importa (para decidir si preguntar). */
  hasPlacedContent(): boolean
  /** Línea breve para el RESUMEN del registro. */
  summary(): string
  detach(): void
}
