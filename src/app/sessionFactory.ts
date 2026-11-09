// Se carga de forma diferida (chunk 3D): crea el adaptador SLAM con el controlador de la sesión.
import type {ArOptions} from '../ar/arOptions'
import {arStore} from '../ar/arStore'
import {EighthWallAdapter} from '../ar/EighthWallAdapter'
import {AnchorTestController} from './controllers/AnchorTestController'
import {ExpedienteController} from './controllers/ExpedienteController'
import {gameStore} from './gameStore'

export type SlamSessionKind = 'expediente' | 'anchor-test'

export function createSlamSession(kind: SlamSessionKind, canvas: HTMLCanvasElement, options: ArOptions) {
  const controller = kind === 'expediente' ? new ExpedienteController(gameStore) : new AnchorTestController(arStore, options)
  const adapter = new EighthWallAdapter(canvas, arStore, options, controller)
  return {adapter, controller}
}
