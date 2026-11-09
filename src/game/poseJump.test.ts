import {describe, expect, it} from 'vitest'
import {vec3} from './geometry'
import {POSE_JUMP_COOLDOWN_MS, PoseJumpDetector} from './poseJump'

const FRAME = 1000 / 60

describe('PoseJumpDetector', () => {
  it('movimiento normal de mano (1,5 u/s a 60 FPS) no es un salto', () => {
    const d = new PoseJumpDetector()
    for (let i = 0; i < 120; i++) {
      expect(d.update(vec3(i * 0.025, 1.4, 0), i * FRAME).jump).toBe(false)
    }
    expect(d.takePeak()).toBeCloseTo(0.025, 5)
    expect(d.takePeak()).toBe(0)
  })

  it('una corrección silenciosa (0,8 u en un fotograma, como el vídeo test1) es un salto', () => {
    const d = new PoseJumpDetector()
    d.update(vec3(0, 1.4, 0), 0)
    const r = d.update(vec3(0, 1.4, 0.8), FRAME)
    expect(r.jump).toBe(true)
    expect(r.delta).toBeCloseTo(0.8, 5)
  })

  it('no evalúa huecos largos entre fotogramas (pausa, FPS muy bajos)', () => {
    const d = new PoseJumpDetector()
    d.update(vec3(0, 1.4, 0), 0)
    expect(d.update(vec3(2, 1.4, 0), 500).jump).toBe(false)
  })

  it('tras un salto aplica enfriamiento para no encadenar avisos', () => {
    const d = new PoseJumpDetector()
    d.update(vec3(0, 0, 0), 0)
    expect(d.update(vec3(1, 0, 0), FRAME).jump).toBe(true)
    expect(d.update(vec3(2, 0, 0), 2 * FRAME).jump).toBe(false)
    const after = POSE_JUMP_COOLDOWN_MS + 10 * FRAME
    d.update(vec3(2, 0, 0), after)
    expect(d.update(vec3(3, 0, 0), after + FRAME).jump).toBe(true)
  })

  it('reset() evita contar como salto el primer fotograma tras recentrar', () => {
    const d = new PoseJumpDetector()
    d.update(vec3(0, 0, 0), 0)
    d.reset()
    expect(d.update(vec3(5, 0, 0), FRAME).jump).toBe(false)
  })
})
