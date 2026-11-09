// Variantes de prueba del Hito 0.1, seleccionables por URL (?place=…&scale=…&size=…) o desde la portada.
// Viven en la URL porque reiniciar el SLAM recarga la página y la variante debe sobrevivir.

export type PlacementStrategy = 'ground' | 'hit' | 'plane'
export type ScaleMode = 'responsive' | 'absolute'

export interface ArOptions {
  /**
   * ground: rayo contra el plano de suelo y=0 del motor (como el ejemplo oficial de 8th Wall).
   * hit:    punto FEATURE_POINT más cercano (método del Hito 0; peor en iPhone).
   * plane:  altura robusta con varios hit-tests + rayo contra ese plano horizontal (para mesas).
   */
  placement: PlacementStrategy
  scale: ScaleMode
  /** Lado del cubo en unidades de escena (≈ metros). */
  cubeSize: number
}

export const DEFAULT_AR_OPTIONS: ArOptions = {placement: 'ground', scale: 'responsive', cubeSize: 0.15}

export const PLACEMENT_LABELS: Record<PlacementStrategy, string> = {
  ground: 'Suelo estimado',
  hit: 'Punto detectado',
  plane: 'Plano de superficie',
}

export const SCALE_LABELS: Record<ScaleMode, string> = {
  responsive: 'Relativa',
  absolute: 'Absoluta (metros)',
}

export const CUBE_SIZES = [0.15, 0.5] as const

function isPlacement(v: string | null): v is PlacementStrategy {
  return v === 'ground' || v === 'hit' || v === 'plane'
}

function isScale(v: string | null): v is ScaleMode {
  return v === 'responsive' || v === 'absolute'
}

export function parseArOptions(search: string): ArOptions {
  const params = new URLSearchParams(search)
  const place = params.get('place')
  const scale = params.get('scale')
  const size = Number(params.get('size'))
  return {
    placement: isPlacement(place) ? place : DEFAULT_AR_OPTIONS.placement,
    scale: isScale(scale) ? scale : DEFAULT_AR_OPTIONS.scale,
    cubeSize: (CUBE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_AR_OPTIONS.cubeSize,
  }
}

/** Query string con solo los valores distintos del predeterminado ('' si todo es predeterminado). */
export function serializeArOptions(opts: ArOptions): string {
  const params = new URLSearchParams()
  if (opts.placement !== DEFAULT_AR_OPTIONS.placement) params.set('place', opts.placement)
  if (opts.scale !== DEFAULT_AR_OPTIONS.scale) params.set('scale', opts.scale)
  if (opts.cubeSize !== DEFAULT_AR_OPTIONS.cubeSize) params.set('size', String(opts.cubeSize))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function describeArOptions(opts: ArOptions): string {
  return `place=${opts.placement} scale=${opts.scale} size=${opts.cubeSize}`
}
