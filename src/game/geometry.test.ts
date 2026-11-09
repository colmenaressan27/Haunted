import {describe, expect, it} from 'vitest'
import {horizontalDistance, normalizeAngle, towards, vec3, yawTowards} from './geometry'

describe('geometry', () => {
  it('horizontalDistance ignora la altura', () => {
    expect(horizontalDistance(vec3(0, 0, 0), vec3(3, 10, 4))).toBe(5)
  })

  it('towards avanza sobre el plano del origen', () => {
    const p = towards(vec3(0, 0, 0), vec3(0, 2, -4), 1)
    expect(p).toEqual({x: 0, y: 0, z: -1})
    expect(towards(vec3(1, 0, 1), vec3(1, 0, 1), 1)).toEqual(vec3(1, 0, 1))
  })

  it('yawTowards: +Z es 0 y +X es π/2', () => {
    expect(yawTowards(vec3(0, 0, 0), vec3(0, 0, 1))).toBeCloseTo(0, 6)
    expect(yawTowards(vec3(0, 0, 0), vec3(1, 0, 0))).toBeCloseTo(Math.PI / 2, 6)
  })

  it('normalizeAngle deja el ángulo en (-π, π]', () => {
    // Se evita la frontera exacta ±π, donde el redondeo de coma flotante decide el signo.
    expect(normalizeAngle(3 * Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1, 6)
    expect(normalizeAngle(-3 * Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 6)
    expect(normalizeAngle(Math.PI / 4 + 4 * Math.PI)).toBeCloseTo(Math.PI / 4, 6)
  })
})
