// Calibración semimanual de la habitación (especificación §5). Pura y serializable.
// No hay detección automática de muebles: el jugador señala cada zona con la retícula.
// Coordenadas en unidades de escena del motor (≈ metros si se inició de pie apuntando al suelo).
import {distance, horizontalDistance, towards, type Vec3} from './geometry'

export type ZoneKind = 'safe' | 'table' | 'peek'
export type CalibrationStep = 'floor' | ZoneKind | 'done'
export type MarkMethod = 'floor-plane' | 'surface-plane'

export const STEP_ORDER: readonly CalibrationStep[] = ['floor', 'safe', 'table', 'peek', 'done']

export interface ZoneAnchor {
  kind: ZoneKind
  position: Vec3
  method: MarkMethod
  /** Distancia cámara→punto al marcar (dato de QA y de confianza). */
  distanceAtMark: number
}

export interface CalibrationState {
  step: CalibrationStep
  zones: Partial<Record<ZoneKind, ZoneAnchor>>
  skipped: ZoneKind[]
  error: string | null
}

export interface ZoneRule {
  minDistance: number
  maxDistance: number
  optional: boolean
  /** Estrategia de superficie con la que se marca. */
  surface: 'floor' | 'surface'
}

export const ZONE_RULES: Record<ZoneKind, ZoneRule> = {
  // «Uno o dos pasos lentos» (especificación §9).
  safe: {minDistance: 0.3, maxDistance: 2.0, optional: false, surface: 'floor'},
  // Sin mesa, la fotografía aparece en el suelo junto a la zona segura.
  table: {minDistance: 0.3, maxDistance: 2.5, optional: true, surface: 'surface'},
  // Puerta, mueble alto, esquina o cortina: se marca la base, en el suelo.
  peek: {minDistance: 0.8, maxDistance: 4.0, optional: false, surface: 'floor'},
}

/** Altura válida de una mesa sobre el suelo calibrado (unidades ≈ m con inicio de pie). */
export const TABLE_HEIGHT_RANGE = {min: 0.25, max: 1.3}
/** El fantasma no debe asomarse encima de la zona segura. */
export const MIN_PEEK_TO_SAFE = 1.0

export const initialCalibration: CalibrationState = {step: 'floor', zones: {}, skipped: [], error: null}

export type CalibrationEvent =
  | {type: 'FLOOR_CONFIRMED'}
  | {type: 'MARK'; position: Vec3; method: MarkMethod; cameraPosition: Vec3}
  | {type: 'MARK_FAILED'; error: string}
  | {type: 'SKIP'}
  | {type: 'BACK'}
  | {type: 'RESTART'}

function nextStep(step: CalibrationStep): CalibrationStep {
  const i = STEP_ORDER.indexOf(step)
  return STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)] ?? 'done'
}

function prevStep(step: CalibrationStep): CalibrationStep {
  const i = STEP_ORDER.indexOf(step)
  return STEP_ORDER[Math.max(i - 1, 0)] ?? 'floor'
}

function isZone(step: CalibrationStep): step is ZoneKind {
  return step === 'safe' || step === 'table' || step === 'peek'
}

function withoutZone(zones: CalibrationState['zones'], kind: ZoneKind): CalibrationState['zones'] {
  return Object.fromEntries(Object.entries(zones).filter(([k]) => k !== kind)) as CalibrationState['zones']
}

/** Devuelve un mensaje de error para el jugador, o null si la marca es válida. */
export function validateMark(
  kind: ZoneKind,
  position: Vec3,
  cameraPosition: Vec3,
  zones: CalibrationState['zones'],
): string | null {
  const rule = ZONE_RULES[kind]
  const d = distance(position, cameraPosition)
  if (d < rule.minDistance) return 'Demasiado cerca de ti. Apunta un poco más lejos.'
  if (d > rule.maxDistance) {
    return kind === 'peek'
      ? 'Demasiado lejos. Elige una puerta o mueble más cercano.'
      : 'Demasiado lejos. Elige un punto a uno o dos pasos.'
  }
  if (kind === 'table') {
    const h = position.y
    if (h < TABLE_HEIGHT_RANGE.min) return 'Eso parece el suelo. Apunta a la superficie de la mesa.'
    if (h > TABLE_HEIGHT_RANGE.max) return 'Superficie demasiado alta. Apunta a una mesa o mueble bajo.'
  }
  if (kind === 'peek' && zones.safe && horizontalDistance(position, zones.safe.position) < MIN_PEEK_TO_SAFE) {
    return 'El umbral está demasiado cerca de la zona segura. Elige otro sitio.'
  }
  return null
}

export function calibrationReducer(state: CalibrationState, event: CalibrationEvent): CalibrationState {
  switch (event.type) {
    case 'FLOOR_CONFIRMED':
      return state.step === 'floor' ? {...state, step: 'safe', error: null} : state
    case 'MARK': {
      const kind = state.step
      if (!isZone(kind)) return state
      const error = validateMark(kind, event.position, event.cameraPosition, state.zones)
      if (error) return {...state, error}
      const anchor: ZoneAnchor = {
        kind,
        position: event.position,
        method: event.method,
        distanceAtMark: distance(event.position, event.cameraPosition),
      }
      return {
        ...state,
        zones: {...state.zones, [kind]: anchor},
        skipped: state.skipped.filter((k) => k !== kind),
        step: nextStep(kind),
        error: null,
      }
    }
    case 'MARK_FAILED':
      return isZone(state.step) || state.step === 'floor' ? {...state, error: event.error} : state
    case 'SKIP': {
      const kind = state.step
      if (!isZone(kind) || !ZONE_RULES[kind].optional) return state
      const zones = withoutZone(state.zones, kind)
      return {...state, zones, skipped: [...state.skipped, kind], step: nextStep(kind), error: null}
    }
    case 'BACK': {
      if (state.step === 'floor') return state
      const target = prevStep(state.step)
      const zones = isZone(target) ? withoutZone(state.zones, target) : state.zones
      return {...state, zones, skipped: state.skipped.filter((k) => k !== target), step: target, error: null}
    }
    case 'RESTART':
      return initialCalibration
  }
}

export interface RoomLayout {
  schemaVersion: 1
  safeZone: ZoneAnchor
  tableZone: ZoneAnchor | null
  peekZone: ZoneAnchor
}

/** Layout de sesión cuando la calibración está completa; null si falta algo obligatorio. */
export function toRoomLayout(state: CalibrationState): RoomLayout | null {
  const {safe, table, peek} = state.zones
  if (state.step !== 'done' || !safe || !peek) return null
  return {schemaVersion: 1, safeZone: safe, tableZone: table ?? null, peekZone: peek}
}

/** Dónde aparece la fotografía: sobre la mesa, o en el suelo a 0,6 u de la zona segura hacia el umbral. */
export function photoSpawnPoint(layout: RoomLayout): Vec3 {
  if (layout.tableZone) return layout.tableZone.position
  return towards(layout.safeZone.position, layout.peekZone.position, 0.6)
}

export function hasAnyZone(state: CalibrationState): boolean {
  return Object.keys(state.zones).length > 0
}
