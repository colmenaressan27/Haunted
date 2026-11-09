import {describe, expect, it} from 'vitest'
import type {ArSnapshot} from '../ar/arStore'
import {initialTrackingState, type TrackingState} from '../ar/trackingState'
import {sessionHint} from './trackingCopy'

function snap(tracking: Partial<TrackingState>, rest: Partial<ArSnapshot> = {}): ArSnapshot {
  return {
    tracking: {...initialTrackingState, ...tracking},
    fps: null,
    reticle: 'none',
    placement: null,
    distanceToObject: null,
    engineVersion: null,
    log: [],
    ...rest,
  }
}

describe('sessionHint', () => {
  it('el modo compatible siempre declara que no ancla objetos', () => {
    expect(sessionHint(snap({mode: 'fallback', quality: 'untracked'}))).toMatch(/NO ancla/)
  })

  it('con tracking limitado pide quedarse quieto, nunca moverse', () => {
    const hint = sessionHint(snap({mode: 'slam', quality: 'limited'}))
    expect(hint).toMatch(/quieto/i)
  })

  it('guía la colocación según la retícula', () => {
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}))).toMatch(/Apunta/)
    expect(sessionHint(snap({mode: 'slam', quality: 'normal'}, {reticle: 'feature-point'}))).toMatch(/Toca/)
  })

  it('ninguna instrucción pide correr', () => {
    const states: TrackingState['quality'][] = ['starting', 'initializing', 'normal', 'limited']
    for (const quality of states) {
      expect(sessionHint(snap({mode: 'slam', quality}))).not.toMatch(/corre/i)
    }
  })
})
