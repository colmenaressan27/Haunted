// Máquina de estados del seguimiento, independiente del motor AR.
// Regla de producto: cualquier estado que no sea 'NORMAL' bajo SLAM se considera NO fiable.
// Los sistemas de peligro futuros (cacería, jumpscares) deben consultar `isTrackingReliable`
// y pausarse cuando devuelva false.

export type ArMode = 'none' | 'slam' | 'fallback'

export type TrackingQuality =
  | 'idle' // sin sesión
  | 'starting' // pidiendo permisos / cargando motor
  | 'initializing' // cámara activa, SLAM aún no estable
  | 'normal' // SLAM estable
  | 'limited' // SLAM degradado (poca textura, movimiento brusco, etc.)
  | 'untracked' // modo compatible: no hay seguimiento espacial por diseño
  | 'failed' // error de cámara o del motor

export interface TrackingState {
  mode: ArMode
  quality: TrackingQuality
  /** Último status/reason crudo del motor, para el registro de QA. */
  raw: {status: string; reason: string} | null
  error: string | null
  /** Veces que el tracking pasó de 'normal' a otro estado durante la sesión. */
  lossCount: number
}

export type TrackingEvent =
  | {type: 'START'; mode: Exclude<ArMode, 'none'>}
  | {type: 'CAMERA_READY'}
  | {type: 'ENGINE_STATUS'; status: string; reason: string}
  | {type: 'FAILED'; error: string}
  | {type: 'STOPPED'}

export const initialTrackingState: TrackingState = {
  mode: 'none',
  quality: 'idle',
  raw: null,
  error: null,
  lossCount: 0,
}

/**
 * Traduce el status del motor. La doc de 8th Wall documenta status 'NORMAL' | 'LIMITED' y
 * reason 'INITIALIZING' | 'UNDEFINED'/'UNSPECIFIED' (contradictoria). En hardware real
 * (iPhone Safari 27.2 y Android Chrome 157, 2026-11-09) llega 'UNSPECIFIED'.
 * Cualquier valor desconocido se trata como no fiable.
 */
export function qualityFromEngine(status: string, reason: string): TrackingQuality {
  if (status === 'NORMAL') return 'normal'
  if (status === 'LIMITED' && reason === 'INITIALIZING') return 'initializing'
  return 'limited'
}

export function trackingReducer(state: TrackingState, event: TrackingEvent): TrackingState {
  switch (event.type) {
    case 'START':
      return {...initialTrackingState, mode: event.mode, quality: 'starting'}
    case 'CAMERA_READY':
      // Solo avanza desde 'starting': si el motor ya informó NORMAL/LIMITED, no se degrada.
      if (state.quality !== 'starting') return state
      return {...state, quality: state.mode === 'fallback' ? 'untracked' : 'initializing'}
    case 'ENGINE_STATUS': {
      if (state.mode !== 'slam' || state.quality === 'failed') return state
      const quality = qualityFromEngine(event.status, event.reason)
      const lost = state.quality === 'normal' && quality !== 'normal'
      return {
        ...state,
        quality,
        raw: {status: event.status, reason: event.reason},
        lossCount: state.lossCount + (lost ? 1 : 0),
      }
    }
    case 'FAILED':
      return {...state, quality: 'failed', error: event.error}
    case 'STOPPED':
      return {...initialTrackingState}
  }
}

/** True solo con SLAM real y estable. El modo compatible nunca es «fiable» espacialmente. */
export function isTrackingReliable(state: TrackingState): boolean {
  return state.mode === 'slam' && state.quality === 'normal'
}

/**
 * Tras recuperar el tracking, el contenido anclado puede haberse desplazado (QA Android
 * 2026-11-09: el cubo cambia de sitio al tapar y destapar la cámara). Si hay objetos colocados,
 * hay que preguntar al jugador si siguen en su sitio o recolocarlos. Base del estado RECOVERY.
 */
export function shouldAskAnchorCheck(prev: TrackingState, next: TrackingState, hasPlacedObject: boolean): boolean {
  return (
    hasPlacedObject &&
    next.mode === 'slam' &&
    prev.quality !== 'normal' &&
    next.quality === 'normal' &&
    next.lossCount > 0
  )
}
