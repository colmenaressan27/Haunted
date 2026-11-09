// Ciclo de vida de un objeto manipulable (especificación §6): mundo → mano → examen → mundo.
// Reglas: nunca se pierde (siempre hay «Recuperar»), no se duplica, y una pérdida de tracking
// marca su posición en el mundo como dudosa en lugar de moverlo.
import {horizontalDistance, intersectHorizontalPlane, normalizeAngle, distance, type Vec3} from './geometry'
import type {RoomLayout} from './calibration'

export type ObjectLocation = 'hidden' | 'world' | 'held' | 'examining'

export interface PhotoState {
  location: ObjectLocation
  worldPosition: Vec3 | null
  worldYaw: number
  examineYaw: number
  examinePitch: number
  /** 0 = lejos, 1 = cerca. */
  zoom: number
  /** El jugador vio el reverso (la inscripción) al menos una vez. */
  backSeen: boolean
  /** Tras pérdida o salto de tracking: su posición en el mundo puede no coincidir con la real. */
  needsCheck: boolean
}

export const initialPhotoState: PhotoState = {
  location: 'hidden',
  worldPosition: null,
  worldYaw: 0,
  examineYaw: 0,
  examinePitch: 0,
  zoom: 0.4,
  backSeen: false,
  needsCheck: false,
}

export const MAX_EXAMINE_PITCH = 1.2

export type PhotoEvent =
  | {type: 'SPAWN'; position: Vec3; yaw: number}
  | {type: 'PICK'}
  | {type: 'EXAMINE'}
  | {type: 'CLOSE_EXAMINE'}
  | {type: 'DROP'; position: Vec3; yaw: number}
  | {type: 'RECOVER'}
  | {type: 'ROTATE'; dYaw: number; dPitch: number}
  | {type: 'FLIP'}
  | {type: 'ZOOM'; value: number}
  | {type: 'TRACKING_UNRELIABLE'}
  | {type: 'POSITION_CONFIRMED'}

/** El reverso queda de cara a la cámara cuando el giro supera 120°. */
export function isBackFacing(yaw: number): boolean {
  return Math.abs(normalizeAngle(yaw)) > (2 * Math.PI) / 3
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function withRotation(state: PhotoState, yaw: number, pitch: number): PhotoState {
  const examineYaw = normalizeAngle(yaw)
  return {
    ...state,
    examineYaw,
    examinePitch: clamp(pitch, -MAX_EXAMINE_PITCH, MAX_EXAMINE_PITCH),
    backSeen: state.backSeen || isBackFacing(examineYaw),
  }
}

export function photoReducer(state: PhotoState, event: PhotoEvent): PhotoState {
  switch (event.type) {
    case 'SPAWN':
      if (state.location !== 'hidden') return state
      return {...state, location: 'world', worldPosition: event.position, worldYaw: event.yaw, needsCheck: false}
    case 'PICK':
      return state.location === 'world' ? {...state, location: 'held', needsCheck: false} : state
    case 'EXAMINE':
      return state.location === 'held' ? {...state, location: 'examining', examineYaw: 0, examinePitch: 0} : state
    case 'CLOSE_EXAMINE':
      return state.location === 'examining' ? {...state, location: 'held'} : state
    case 'DROP':
      if (state.location !== 'held' && state.location !== 'examining') return state
      return {...state, location: 'world', worldPosition: event.position, worldYaw: event.yaw, needsCheck: false}
    case 'RECOVER':
      return state.location === 'world' ? {...state, location: 'held', needsCheck: false} : state
    case 'ROTATE':
      if (state.location !== 'examining') return state
      return withRotation(state, state.examineYaw + event.dYaw, state.examinePitch + event.dPitch)
    case 'FLIP':
      if (state.location !== 'examining') return state
      return withRotation(state, state.examineYaw + Math.PI, state.examinePitch)
    case 'ZOOM':
      return state.location === 'examining' ? {...state, zoom: clamp(event.value, 0, 1)} : state
    case 'TRACKING_UNRELIABLE':
      return state.location === 'world' ? {...state, needsCheck: true} : state
    case 'POSITION_CONFIRMED':
      return {...state, needsCheck: false}
  }
}

/** Radio horizontal alrededor del ancla de mesa donde se considera «sobre la mesa». */
export const TABLE_DROP_RADIUS = 0.6
export const MAX_DROP_DISTANCE = 2.5

/**
 * Dónde soltar el objeto según el rayo de la retícula: primero la mesa calibrada (plano a su
 * altura, cerca del ancla), si no el suelo (y = 0). null si no hay punto razonable.
 */
export function chooseDropPoint(
  origin: Vec3,
  direction: Vec3,
  layout: RoomLayout,
): {position: Vec3; surface: 'table' | 'floor'} | null {
  const table = layout.tableZone
  if (table) {
    const p = intersectHorizontalPlane(origin, direction, table.position.y)
    if (p && horizontalDistance(p, table.position) <= TABLE_DROP_RADIUS && distance(p, origin) <= MAX_DROP_DISTANCE) {
      return {position: p, surface: 'table'}
    }
  }
  const floor = intersectHorizontalPlane(origin, direction, 0)
  if (floor && distance(floor, origin) <= MAX_DROP_DISTANCE) return {position: floor, surface: 'floor'}
  return null
}
