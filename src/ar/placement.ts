// Geometría de colocación, pura (sin Three.js ni XR8) para poder testearla.
// Hallazgo QA 2026-11-09: un único FEATURE_POINT en iPhone produce deslizamiento y cambios de
// escala aparentes; el plano de suelo del motor (como el ejemplo oficial) se comporta mejor.

export {distance, intersectHorizontalPlane, type Vec3} from '../game/geometry'

/** Más allá de esta distancia la profundidad estimada es poco fiable: se rechaza la colocación. */
export const MAX_PLACEMENT_DISTANCE = 2.5
/** Muestras de hit-test necesarias para fiarse de la altura de una superficie. */
export const PLANE_MIN_INLIERS = 3
/** Una muestra es inlier si su altura dista menos de esto de la mediana. */
export const PLANE_INLIER_TOLERANCE = 0.05

/** Desplazamientos normalizados de pantalla alrededor del toque para muestrear la superficie. */
export const PLANE_SAMPLE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-0.04, 0],
  [0.04, 0],
  [0, -0.04],
  [0, 0.04],
]

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('median() de una lista vacía')
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const hi = sorted[mid] as number
  return sorted.length % 2 === 1 ? hi : ((sorted[mid - 1] as number) + hi) / 2
}

export interface PlaneEstimate {
  y: number
  inliers: number
  /** Diferencia max-min de altura entre inliers. */
  spread: number
}

/** Altura robusta de una superficie horizontal a partir de alturas de hit-test. null si no hay consenso. */
export function estimatePlaneHeight(ys: readonly number[]): PlaneEstimate | null {
  if (ys.length < PLANE_MIN_INLIERS) return null
  const m = median(ys)
  const inliers = ys.filter((y) => Math.abs(y - m) <= PLANE_INLIER_TOLERANCE)
  if (inliers.length < PLANE_MIN_INLIERS) return null
  const y = inliers.reduce((s, v) => s + v, 0) / inliers.length
  return {y, inliers: inliers.length, spread: Math.max(...inliers) - Math.min(...inliers)}
}

export type PlacementRejection = 'no-surface' | 'too-far' | 'no-consensus'

export function placementRejectionMessage(reason: PlacementRejection, dist?: number): string {
  switch (reason) {
    case 'no-surface':
      return 'No hay superficie en ese punto. Apunta hacia el suelo.'
    case 'too-far':
      return `Demasiado lejos${dist === undefined ? '' : ` (${dist.toFixed(1)} u)`}: acércate o toca más cerca.`
    case 'no-consensus':
      return 'Superficie poco clara. Apunta a una zona con textura y vuelve a tocar.'
  }
}
