import {describe, expect, it} from 'vitest'
import {
  initialTrackingState,
  isTrackingReliable,
  qualityFromEngine,
  shouldAskAnchorCheck,
  trackingReducer,
  type TrackingEvent,
  type TrackingState,
} from './trackingState'

function run(events: TrackingEvent[], from: TrackingState = initialTrackingState): TrackingState {
  return events.reduce(trackingReducer, from)
}

describe('qualityFromEngine', () => {
  it('mapea los valores documentados por 8th Wall', () => {
    expect(qualityFromEngine('NORMAL', 'UNDEFINED')).toBe('normal')
    expect(qualityFromEngine('LIMITED', 'INITIALIZING')).toBe('initializing')
    expect(qualityFromEngine('LIMITED', 'UNDEFINED')).toBe('limited')
  })

  it('mapea los valores observados en hardware real (reason UNSPECIFIED)', () => {
    expect(qualityFromEngine('NORMAL', 'UNSPECIFIED')).toBe('normal')
    expect(qualityFromEngine('LIMITED', 'UNSPECIFIED')).toBe('limited')
  })

  it('trata valores desconocidos como no fiables', () => {
    expect(qualityFromEngine('RELOCALIZING', 'X')).toBe('limited')
    expect(qualityFromEngine('', '')).toBe('limited')
  })
})

describe('trackingReducer — SLAM', () => {
  const slamReady: TrackingEvent[] = [{type: 'START', mode: 'slam'}, {type: 'CAMERA_READY'}]

  it('arranca en starting → initializing al tener vídeo', () => {
    expect(run([{type: 'START', mode: 'slam'}]).quality).toBe('starting')
    expect(run(slamReady).quality).toBe('initializing')
  })

  it('solo es fiable con status NORMAL', () => {
    const normal = run([...slamReady, {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNDEFINED'}])
    expect(normal.quality).toBe('normal')
    expect(isTrackingReliable(normal)).toBe(true)
    expect(isTrackingReliable(run(slamReady))).toBe(false)
  })

  it('perder el tracking lo vuelve no fiable y cuenta la pérdida (regla: pausar peligro)', () => {
    const s = run([
      ...slamReady,
      {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNDEFINED'},
      {type: 'ENGINE_STATUS', status: 'LIMITED', reason: 'UNDEFINED'},
    ])
    expect(s.quality).toBe('limited')
    expect(isTrackingReliable(s)).toBe(false)
    expect(s.lossCount).toBe(1)
    expect(s.raw).toEqual({status: 'LIMITED', reason: 'UNDEFINED'})
  })

  it('CAMERA_READY tardío no degrada un tracking ya estable', () => {
    const s = run([
      {type: 'START', mode: 'slam'},
      {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNDEFINED'},
      {type: 'CAMERA_READY'},
    ])
    expect(s.quality).toBe('normal')
  })

  it('no cuenta pérdida si nunca estuvo estable', () => {
    const s = run([...slamReady, {type: 'ENGINE_STATUS', status: 'LIMITED', reason: 'UNDEFINED'}])
    expect(s.lossCount).toBe(0)
  })

  it('un fallo es terminal: estados posteriores del motor no lo ocultan', () => {
    const s = run([
      ...slamReady,
      {type: 'FAILED', error: 'cámara denegada'},
      {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNDEFINED'},
      {type: 'CAMERA_READY'},
    ])
    expect(s.quality).toBe('failed')
    expect(s.error).toBe('cámara denegada')
    expect(isTrackingReliable(s)).toBe(false)
  })

  it('STOPPED vuelve al estado inicial', () => {
    expect(run([...slamReady, {type: 'STOPPED'}])).toEqual(initialTrackingState)
  })
})

describe('shouldAskAnchorCheck — recuperación tras pérdida', () => {
  // Secuencia real del registro Android 2026-11-09: NORMAL → LIMITED → NORMAL con cubo colocado.
  const ready: TrackingEvent[] = [{type: 'START', mode: 'slam'}, {type: 'CAMERA_READY'}]
  const normal: TrackingEvent = {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNSPECIFIED'}
  const limited: TrackingEvent = {type: 'ENGINE_STATUS', status: 'LIMITED', reason: 'UNSPECIFIED'}

  it('pregunta al recuperar el tracking si había objeto colocado', () => {
    const prev = run([...ready, normal, limited])
    const next = trackingReducer(prev, normal)
    expect(shouldAskAnchorCheck(prev, next, true)).toBe(true)
  })

  it('no pregunta sin objeto colocado', () => {
    const prev = run([...ready, normal, limited])
    expect(shouldAskAnchorCheck(prev, trackingReducer(prev, normal), false)).toBe(false)
  })

  it('no pregunta en la primera estabilización (sin pérdida previa)', () => {
    const prev = run(ready)
    expect(shouldAskAnchorCheck(prev, trackingReducer(prev, normal), true)).toBe(false)
  })

  it('no pregunta si sigue estable', () => {
    const prev = run([...ready, normal, limited, normal])
    expect(shouldAskAnchorCheck(prev, trackingReducer(prev, normal), true)).toBe(false)
  })
})

describe('trackingReducer — modo compatible', () => {
  it('nunca es espacialmente fiable e ignora eventos de motor SLAM', () => {
    const s = run([
      {type: 'START', mode: 'fallback'},
      {type: 'CAMERA_READY'},
      {type: 'ENGINE_STATUS', status: 'NORMAL', reason: 'UNDEFINED'},
    ])
    expect(s.quality).toBe('untracked')
    expect(isTrackingReliable(s)).toBe(false)
  })
})
