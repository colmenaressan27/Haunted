// Store mínimo (sin dependencias) que conecta los adaptadores AR imperativos con el overlay React.
// Los adaptadores publican aquí a baja frecuencia (≤4 Hz) para no saturar React.
import {initialTrackingState, trackingReducer, type TrackingEvent, type TrackingState} from './trackingState'

export type ReticleState = 'none' | 'surface' | 'too-far'

export type PlacementMethod = 'ground-plane' | 'hit-test' | 'surface-plane'

export interface PlacementInfo {
  method: PlacementMethod
  hitType: string | null
  count: number
}

export interface LogEntry {
  t: number
  msg: string
}

export interface ArSnapshot {
  tracking: TrackingState
  fps: number | null
  reticle: ReticleState
  placement: PlacementInfo | null
  /** Distancia cámara→objeto en unidades de escena (≈metros solo si la escala inicial es correcta). */
  distanceToObject: number | null
  engineVersion: string | null
  /** Tras recuperar el tracking con un objeto colocado: preguntar si sigue en su sitio. */
  anchorCheck: boolean
  /** Mensaje breve para el jugador (p. ej. colocación rechazada). Se borra solo. */
  notice: string | null
  log: LogEntry[]
}

const MAX_LOG = 60

export const initialArSnapshot: ArSnapshot = {
  tracking: initialTrackingState,
  fps: null,
  reticle: 'none',
  placement: null,
  distanceToObject: null,
  engineVersion: null,
  anchorCheck: false,
  notice: null,
  log: [],
}

type Listener = () => void

export class ArStore {
  private snapshot: ArSnapshot = initialArSnapshot
  private readonly listeners = new Set<Listener>()
  private readonly t0 = performance.now()

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): ArSnapshot => this.snapshot

  dispatch(event: TrackingEvent): void {
    const tracking = trackingReducer(this.snapshot.tracking, event)
    if (tracking !== this.snapshot.tracking) this.set({tracking})
  }

  patch(partial: Partial<Omit<ArSnapshot, 'tracking' | 'log'>>): void {
    const changed = (Object.keys(partial) as Array<keyof typeof partial>).some(
      (k) => partial[k] !== this.snapshot[k],
    )
    if (changed) this.set(partial)
  }

  log(msg: string): void {
    const entry = {t: Math.round(performance.now() - this.t0), msg}
    this.set({log: [entry, ...this.snapshot.log].slice(0, MAX_LOG)})
  }

  reset(): void {
    this.set({...initialArSnapshot, log: this.snapshot.log})
  }

  private set(partial: Partial<ArSnapshot>): void {
    this.snapshot = {...this.snapshot, ...partial}
    for (const l of this.listeners) l()
  }
}

export const arStore = new ArStore()
