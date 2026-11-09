import type {PlacementStrategy} from '../ar/arOptions'
import type {ArSnapshot} from '../ar/arStore'
import type {TrackingQuality} from '../ar/trackingState'

export function trackingLabel(quality: TrackingQuality): string {
  switch (quality) {
    case 'idle':
      return 'Sin sesión'
    case 'starting':
      return 'Iniciando cámara y motor…'
    case 'initializing':
      return 'Inicializando seguimiento: mueve el teléfono despacio de lado a lado'
    case 'normal':
      return 'Seguimiento estable'
    case 'limited':
      return 'Seguimiento limitado: detente y apunta a una zona con luz y textura'
    case 'untracked':
      return 'Sin seguimiento espacial (modo compatible)'
    case 'failed':
      return 'Error'
  }
}

/** Instrucción principal según el estado. Nunca pide correr ni caminar a ciegas. */
export function sessionHint(s: ArSnapshot, placement: PlacementStrategy = 'ground'): string {
  const {mode, quality} = s.tracking
  if (mode === 'fallback') {
    return 'El cubo está fijo a la pantalla: este modo NO ancla objetos a la habitación.'
  }
  if (s.notice) return s.notice
  if (quality === 'starting') return 'Acepta los permisos de cámara y movimiento.'
  if (quality === 'limited') return 'Quédate quieto un momento. No camines mientras miras la pantalla.'
  if (!s.placement) {
    if (s.reticle === 'too-far') return 'Ese punto está demasiado lejos: apunta más cerca de ti.'
    if (s.reticle === 'none') return 'Apunta hacia el suelo, a uno o dos pasos de ti.'
    return placement === 'ground'
      ? 'Toca el suelo para colocar el cubo.'
      : 'Toca el suelo o una mesa para colocar el cubo.'
  }
  return 'Muévete despacio 30–60 cm alrededor del cubo: debería quedarse en su sitio.'
}
