import type {ReticleState} from '../ar/arStore'
import {initialCalibration, type CalibrationState} from '../game/calibration'
import {initialPhotoState, type PhotoState} from '../game/photoObject'
import {Store} from './Store'

export interface GameSnapshot {
  calibration: CalibrationState
  photo: PhotoState
  /** Retícula de la calibración o del destino de «Soltar». */
  reticle: ReticleState
  /** Dónde caería la foto al soltarla ahora (null = no hay destino válido). */
  dropSurface: 'table' | 'floor' | null
  /** El tracking no es fiable: atenuar y no confiar en posiciones del mundo. */
  unreliable: boolean
}

export const initialGameSnapshot: GameSnapshot = {
  calibration: initialCalibration,
  photo: initialPhotoState,
  reticle: 'none',
  dropSurface: null,
  unreliable: false,
}

export const gameStore = new Store<GameSnapshot>(initialGameSnapshot)
