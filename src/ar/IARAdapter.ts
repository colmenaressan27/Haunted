// Contrato entre el juego y cualquier motor AR. El código de juego (src/game, futuro) solo debe
// depender de esta interfaz y de trackingState, nunca de XR8 directamente: así la migración a
// Unity/AR Foundation reescribe adaptadores, no reglas.
// Hito 0 implementa solo lo verificable hoy; createOccluder/getPose se añadirán cuando existan.

export interface ArAdapterCapabilities {
  /** El objeto queda fijado al espacio físico (SLAM). False = solo superpuesto a la cámara. */
  spatialAnchoring: boolean
  /** Soporta recentrar el origen del mundo. */
  recenter: boolean
}

export interface IARAdapter {
  readonly mode: 'slam' | 'fallback'
  readonly capabilities: ArAdapterCapabilities
  /** Pide permisos, arranca cámara y motor. Debe llamarse tras un gesto del usuario. */
  initialize(): Promise<void>
  recenter(): void
  /** Libera cámara, GPU y listeners. Idempotente. */
  shutdown(): void
}
