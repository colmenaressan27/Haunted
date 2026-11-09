import {describe, expect, it} from 'vitest'
import {formatFpsSummary, summarizeFps} from './fpsStats'
import {
  distance,
  estimatePlaneHeight,
  intersectHorizontalPlane,
  MAX_PLACEMENT_DISTANCE,
  median,
  placementRejectionMessage,
} from './placement'

describe('median', () => {
  it('impar, par y desordenado', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('lista vacía es un error explícito', () => {
    expect(() => median([])).toThrow()
  })
})

describe('estimatePlaneHeight', () => {
  it('promedia los inliers y descarta un punto de profundidad mal estimada', () => {
    const r = estimatePlaneHeight([0.72, 0.73, 0.71, 0.72, 1.4])
    expect(r).not.toBeNull()
    expect(r?.y).toBeCloseTo(0.72, 2)
    expect(r?.inliers).toBe(4)
  })

  it('sin consenso (alturas dispersas) no inventa superficie', () => {
    expect(estimatePlaneHeight([0, 0.3, 0.6, 0.9, 1.2])).toBeNull()
  })

  it('con menos de 3 muestras no hay estimación', () => {
    expect(estimatePlaneHeight([0.7, 0.7])).toBeNull()
  })
})

describe('intersectHorizontalPlane', () => {
  const camera = {x: 0, y: 1.4, z: 0}

  it('mirando 45° hacia abajo corta el suelo a 1,4 u por delante', () => {
    const dir = {x: 0, y: -Math.SQRT1_2, z: -Math.SQRT1_2}
    const p = intersectHorizontalPlane(camera, dir, 0)
    expect(p?.y).toBe(0)
    expect(p?.z).toBeCloseTo(-1.4, 5)
  })

  it('mirando al horizonte o hacia arriba no hay intersección delante', () => {
    expect(intersectHorizontalPlane(camera, {x: 0, y: 0, z: -1}, 0)).toBeNull()
    expect(intersectHorizontalPlane(camera, {x: 0, y: 0.5, z: -0.8}, 0)).toBeNull()
  })

  it('casi rasante produce un punto lejano que el límite de distancia rechaza', () => {
    const dir = {x: 0, y: -0.2, z: -0.98}
    const p = intersectHorizontalPlane(camera, dir, 0)
    expect(p).not.toBeNull()
    if (p) expect(distance(p, camera)).toBeGreaterThan(MAX_PLACEMENT_DISTANCE)
  })
})

describe('placementRejectionMessage', () => {
  it('ningún mensaje pide correr o caminar rápido', () => {
    for (const r of ['no-surface', 'too-far', 'no-consensus'] as const) {
      expect(placementRejectionMessage(r, 3.9)).not.toMatch(/corre|rápido/i)
    }
  })
})

describe('summarizeFps', () => {
  it('media redondeada y mínimo', () => {
    expect(summarizeFps([30, 28, 31, 25])).toEqual({avg: 29, min: 25, samples: 4})
    expect(summarizeFps([])).toBeNull()
    expect(formatFpsSummary(null)).toMatch(/sin muestras/)
  })
})
