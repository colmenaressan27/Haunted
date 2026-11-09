import {describe, expect, it} from 'vitest'
import {initialArSnapshot, type ArSnapshot} from '../ar/arStore'
import {initialTrackingState, type TrackingState} from '../ar/trackingState'
import {sessionHint} from './trackingCopy'

function snap(tracking: Partial<TrackingState>, rest: Partial<ArSnapshot> = {}): ArSnapshot {
  return {...initialArSnapshot, tracking: {...initialTrackingState, ...tracking}, ...rest}
}

describe('sessionHint', () => {
  it('el modo compatible siempre declara que no ancla objetos', () => {
    expect(sessionHint(snap({mode: 'fallback', quality: 'untracked'}))).toMatch(/NO ancla/)
  })

  it('con tracking limitado pide quedarse quieto, nunca moverse', () => {
    const hint = sessionHint(snap({mode: 'slam', quality: 'limited'}))
    expect(hint).toMatch(/quieto/i)
  })

  it('guía la colocación según la retícula y la estrategia', () => {
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}))).toMatch(/Apunta/)
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}, {reticle: 'surface'}))).toMatch(/Toca el suelo para/)
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}, {reticle: 'surface'}), 'plane')).toMatch(/mesa/)
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}, {reticle: 'too-far'}))).toMatch(/lejos/)
  })

  it('un aviso puntual (colocación rechazada) tiene prioridad', () => {
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}, {notice: 'Demasiado lejos'}))).toBe('Demasiado lejos')
  })

  it('ninguna instrucción pide correr', () => {
    const states: TrackingState['quality'][] = ['starting', 'initializing', 'normal', 'limited']
    for (const quality of states) {
      for (const reticle of ['none', 'surface', 'too-far'] as const) {
        expect(sessionHint(snap({mode: 'slam', quality}, {reticle}))).not.toMatch(/corre/i)
      }
    }
  })
})
