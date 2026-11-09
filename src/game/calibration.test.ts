import {describe, expect, it} from 'vitest'
import {
  calibrationReducer,
  hasAnyZone,
  initialCalibration,
  photoSpawnPoint,
  toRoomLayout,
  validateMark,
  type CalibrationEvent,
  type CalibrationState,
} from './calibration'
import {horizontalDistance, vec3} from './geometry'

const CAM = vec3(0, 1.4, 0)
const SAFE = vec3(0, 0, -1)
const TABLE = vec3(0.8, 0.75, -0.6)
const PEEK = vec3(-0.5, 0, -3)

function run(events: CalibrationEvent[], from: CalibrationState = initialCalibration): CalibrationState {
  return events.reduce(calibrationReducer, from)
}

const mark = (position = SAFE, method: 'floor-plane' | 'surface-plane' = 'floor-plane'): CalibrationEvent => ({
  type: 'MARK',
  position,
  method,
  cameraPosition: CAM,
})

describe('flujo de calibración', () => {
  it('suelo → zona segura → mesa → umbral → completa', () => {
    const s = run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), mark(TABLE, 'surface-plane'), mark(PEEK)])
    expect(s.step).toBe('done')
    expect(Object.keys(s.zones).sort()).toEqual(['peek', 'safe', 'table'])
    expect(s.error).toBeNull()
    const layout = toRoomLayout(s)
    expect(layout?.tableZone?.position).toEqual(TABLE)
  })

  it('no acepta marcas antes de confirmar el suelo', () => {
    const s = run([mark(SAFE)])
    expect(s.step).toBe('floor')
    expect(hasAnyZone(s)).toBe(false)
  })

  it('la mesa es opcional; el umbral y la zona segura no', () => {
    const noTable = run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), {type: 'SKIP'}, mark(PEEK)])
    expect(noTable.step).toBe('done')
    expect(noTable.skipped).toEqual(['table'])
    expect(toRoomLayout(noTable)?.tableZone).toBeNull()

    const trySkipSafe = run([{type: 'FLOOR_CONFIRMED'}, {type: 'SKIP'}])
    expect(trySkipSafe.step).toBe('safe')
  })

  it('«Atrás» vuelve al paso anterior y borra esa zona', () => {
    const s = run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), {type: 'BACK'}])
    expect(s.step).toBe('safe')
    expect(s.zones.safe).toBeUndefined()
  })

  it('RESTART vuelve al principio sin zonas', () => {
    const s = run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), {type: 'RESTART'}])
    expect(s).toEqual(initialCalibration)
  })

  it('una marca inválida deja el paso igual y explica el motivo', () => {
    const s = run([{type: 'FLOOR_CONFIRMED'}, mark(vec3(0, 0, -5))])
    expect(s.step).toBe('safe')
    expect(s.error).toMatch(/lejos/)
    const fixed = calibrationReducer(s, mark(SAFE))
    expect(fixed.error).toBeNull()
    expect(fixed.step).toBe('table')
  })

  it('toRoomLayout es null si la calibración no terminó', () => {
    expect(toRoomLayout(run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE)]))).toBeNull()
  })
})

describe('validateMark', () => {
  it('zona segura: a uno o dos pasos, ni pegada ni lejos', () => {
    expect(validateMark('safe', vec3(0, 0, -0.1), vec3(0, 0.1, 0), {})).toMatch(/cerca/)
    expect(validateMark('safe', vec3(0, 0, -3), CAM, {})).toMatch(/lejos/)
    expect(validateMark('safe', SAFE, CAM, {})).toBeNull()
  })

  it('mesa: rechaza alturas de suelo o demasiado altas', () => {
    expect(validateMark('table', vec3(0.5, 0.02, -0.8), CAM, {})).toMatch(/suelo/)
    expect(validateMark('table', vec3(0.5, 1.5, -0.8), CAM, {})).toMatch(/alta/)
    expect(validateMark('table', TABLE, CAM, {})).toBeNull()
  })

  it('umbral: no encima de la zona segura', () => {
    const safe = {kind: 'safe' as const, position: SAFE, method: 'floor-plane' as const, distanceAtMark: 1.7}
    expect(validateMark('peek', vec3(0.3, 0, -1.4), CAM, {safe})).toMatch(/zona segura/)
    expect(validateMark('peek', PEEK, CAM, {safe})).toBeNull()
  })
})

describe('photoSpawnPoint', () => {
  it('sobre la mesa si existe', () => {
    const layout = toRoomLayout(run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), mark(TABLE, 'surface-plane'), mark(PEEK)]))
    expect(layout && photoSpawnPoint(layout)).toEqual(TABLE)
  })

  it('sin mesa: en el suelo, a 0,6 u de la zona segura hacia el umbral', () => {
    const layout = toRoomLayout(run([{type: 'FLOOR_CONFIRMED'}, mark(SAFE), {type: 'SKIP'}, mark(PEEK)]))
    expect(layout).not.toBeNull()
    if (!layout) return
    const p = photoSpawnPoint(layout)
    expect(p.y).toBe(0)
    expect(horizontalDistance(p, SAFE)).toBeCloseTo(0.6, 5)
    expect(horizontalDistance(p, PEEK)).toBeLessThan(horizontalDistance(SAFE, PEEK))
  })
})
