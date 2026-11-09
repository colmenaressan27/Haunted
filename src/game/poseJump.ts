// Detector de saltos de pose: correcciones silenciosas del SLAM que el motor no reporta como
// LIMITED (QA iPhone 2026-11-09, vídeo test1: la distancia al cubo saltó 1,79 → 2,62 u tras un
// barrido brusco con «Seguimiento estable» y «Pérdidas 0»).
//
// Criterio: traslación de cámara entre dos fotogramas consecutivos mayor que lo que una mano puede
// mover el teléfono en ese tiempo. A 60 FPS, 1,5 m/s reales = 2,5 cm/fotograma; con escala relativa
// iniciada sobre una mesa 1 u ≈ 0,3 m, eso son ~8 cm/fotograma en unidades. El umbral 0,25 u deja
// margen >3×. UMBRALES PROVISIONALES: se registran los picos reales para calibrarlos.
import {distance, type Vec3} from './geometry'

export const POSE_JUMP_MAX_FRAME_DELTA = 0.25
/** Si entre fotogramas pasa más tiempo (pestaña en pausa, FPS muy bajos) no se evalúa. */
export const POSE_JUMP_MAX_FRAME_MS = 100
/** Tras un salto, se ignoran otros durante este tiempo para no encadenar avisos. */
export const POSE_JUMP_COOLDOWN_MS = 1500

export interface PoseJumpResult {
  jump: boolean
  delta: number
}

export class PoseJumpDetector {
  private last: {p: Vec3; t: number} | null = null
  private cooldownUntil = 0
  private windowPeak = 0

  update(position: Vec3, tMs: number): PoseJumpResult {
    const prev = this.last
    this.last = {p: {...position}, t: tMs}
    if (!prev) return {jump: false, delta: 0}
    const dt = tMs - prev.t
    if (dt <= 0 || dt > POSE_JUMP_MAX_FRAME_MS) return {jump: false, delta: 0}
    const delta = distance(position, prev.p)
    this.windowPeak = Math.max(this.windowPeak, delta)
    const jump = delta > POSE_JUMP_MAX_FRAME_DELTA && tMs >= this.cooldownUntil
    if (jump) this.cooldownUntil = tMs + POSE_JUMP_COOLDOWN_MS
    return {jump, delta}
  }

  /** Pico de desplazamiento por fotograma desde la última llamada (para el registro de QA). */
  takePeak(): number {
    const p = this.windowPeak
    this.windowPeak = 0
    return p
  }

  /** Tras recentrar o recuperar el tracking, el primer fotograma no debe contar como salto. */
  reset(): void {
    this.last = null
  }
}
