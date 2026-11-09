import {describe, expect, it} from 'vitest'
import {toRoomLayout, initialCalibration, calibrationReducer, type CalibrationEvent} from './calibration'
import {vec3} from './geometry'
import {
  chooseDropPoint,
  initialPhotoState,
  isBackFacing,
  MAX_EXAMINE_PITCH,
  photoReducer,
  type PhotoEvent,
  type PhotoState,
} from './photoObject'

function run(events: PhotoEvent[], from: PhotoState = initialPhotoState): PhotoState {
  return events.reduce(photoReducer, from)
}

const spawned: PhotoEvent[] = [{type: 'SPAWN', position: vec3(0.8, 0.75, -0.6), yaw: 0.3}]

describe('ciclo de vida de la fotografía', () => {
  it('mundo → mano → examen → mano → mundo', () => {
    const s = run([
      ...spawned,
      {type: 'PICK'},
      {type: 'EXAMINE'},
      {type: 'CLOSE_EXAMINE'},
      {type: 'DROP', position: vec3(0, 0, -1), yaw: 0},
    ])
    expect(s.location).toBe('world')
    expect(s.worldPosition).toEqual(vec3(0, 0, -1))
  })

  it('no hay transiciones imposibles (no se duplica ni se pierde)', () => {
    expect(run([{type: 'PICK'}]).location).toBe('hidden')
    expect(run([...spawned, {type: 'EXAMINE'}]).location).toBe('world')
    expect(run([...spawned, {type: 'SPAWN', position: vec3(9, 9, 9), yaw: 0}]).worldPosition).toEqual(
      vec3(0.8, 0.75, -0.6),
    )
    expect(run([...spawned, {type: 'DROP', position: vec3(1, 0, 1), yaw: 0}]).worldPosition).toEqual(
      vec3(0.8, 0.75, -0.6),
    )
  })

  it('«Recuperar» la trae a la mano sin caminar', () => {
    expect(run([...spawned, {type: 'RECOVER'}]).location).toBe('held')
  })

  it('perder el tracking marca su posición como dudosa; confirmar la limpia', () => {
    const lost = run([...spawned, {type: 'TRACKING_UNRELIABLE'}])
    expect(lost.needsCheck).toBe(true)
    expect(lost.location).toBe('world')
    expect(photoReducer(lost, {type: 'POSITION_CONFIRMED'}).needsCheck).toBe(false)
    expect(photoReducer(lost, {type: 'PICK'}).needsCheck).toBe(false)
  })

  it('en la mano no le afecta la pérdida de tracking', () => {
    const s = run([...spawned, {type: 'PICK'}, {type: 'TRACKING_UNRELIABLE'}])
    expect(s.needsCheck).toBe(false)
  })
})

describe('examen', () => {
  const examining: PhotoEvent[] = [...spawned, {type: 'PICK'}, {type: 'EXAMINE'}]

  it('dar la vuelta revela el reverso y queda registrado', () => {
    const s = run([...examining, {type: 'FLIP'}])
    expect(isBackFacing(s.examineYaw)).toBe(true)
    expect(s.backSeen).toBe(true)
    const back = photoReducer(s, {type: 'FLIP'})
    expect(isBackFacing(back.examineYaw)).toBe(false)
    expect(back.backSeen).toBe(true)
  })

  it('girar arrastrando también revela el reverso pasado 120°', () => {
    expect(run([...examining, {type: 'ROTATE', dYaw: 1.5, dPitch: 0}]).backSeen).toBe(false)
    expect(run([...examining, {type: 'ROTATE', dYaw: 2.2, dPitch: 0}]).backSeen).toBe(true)
  })

  it('limita la inclinación y el zoom', () => {
    const s = run([...examining, {type: 'ROTATE', dYaw: 0, dPitch: 5}, {type: 'ZOOM', value: 3}])
    expect(s.examinePitch).toBe(MAX_EXAMINE_PITCH)
    expect(s.zoom).toBe(1)
  })

  it('fuera del examen girar no hace nada', () => {
    expect(run([...spawned, {type: 'ROTATE', dYaw: 3, dPitch: 0}]).backSeen).toBe(false)
  })
})

describe('chooseDropPoint', () => {
  const CAM = vec3(0, 1.4, 0)
  const events: CalibrationEvent[] = [
    {type: 'FLOOR_CONFIRMED'},
    {type: 'MARK', position: vec3(0, 0, -1), method: 'floor-plane', cameraPosition: CAM},
    {type: 'MARK', position: vec3(0, 0.75, -1.2), method: 'surface-plane', cameraPosition: CAM},
    {type: 'MARK', position: vec3(-0.5, 0, -3), method: 'floor-plane', cameraPosition: CAM},
  ]
  const layout = toRoomLayout(events.reduce(calibrationReducer, initialCalibration))
  if (!layout) throw new Error('layout de prueba inválido')

  const dirTo = (t: {x: number; y: number; z: number}) => {
    const d = vec3(t.x - CAM.x, t.y - CAM.y, t.z - CAM.z)
    const n = Math.hypot(d.x, d.y, d.z)
    return vec3(d.x / n, d.y / n, d.z / n)
  }

  it('apuntando a la mesa la deja sobre la mesa', () => {
    const r = chooseDropPoint(CAM, dirTo(vec3(0.1, 0.75, -1.1)), layout)
    expect(r?.surface).toBe('table')
    expect(r?.position.y).toBeCloseTo(0.75, 5)
  })

  it('apuntando al suelo lejos de la mesa la deja en el suelo', () => {
    const r = chooseDropPoint(CAM, dirTo(vec3(1.2, 0, -0.5)), layout)
    expect(r?.surface).toBe('floor')
    expect(r?.position.y).toBe(0)
  })

  it('mirando al horizonte no hay destino', () => {
    expect(chooseDropPoint(CAM, vec3(0, 0, -1), layout)).toBeNull()
  })
})
