import {describe, expect, it} from 'vitest'
import {DEFAULT_AR_OPTIONS, parseArOptions, serializeArOptions} from './arOptions'

describe('parseArOptions', () => {
  it('sin parámetros usa el predeterminado (suelo estimado, como el ejemplo oficial)', () => {
    expect(parseArOptions('')).toEqual(DEFAULT_AR_OPTIONS)
    expect(DEFAULT_AR_OPTIONS.placement).toBe('ground')
  })

  it('lee variantes válidas', () => {
    expect(parseArOptions('?place=plane&scale=absolute&size=0.5')).toEqual({
      placement: 'plane',
      scale: 'absolute',
      cubeSize: 0.5,
    })
  })

  it('ignora valores inválidos en lugar de romper', () => {
    expect(parseArOptions('?place=lidar&scale=huge&size=9')).toEqual(DEFAULT_AR_OPTIONS)
  })
})

describe('serializeArOptions', () => {
  it('omite los valores predeterminados', () => {
    expect(serializeArOptions(DEFAULT_AR_OPTIONS)).toBe('')
    expect(serializeArOptions({...DEFAULT_AR_OPTIONS, placement: 'hit'})).toBe('?place=hit')
  })

  it('es reversible', () => {
    const opts = {placement: 'plane', scale: 'absolute', cubeSize: 0.5} as const
    expect(parseArOptions(serializeArOptions(opts))).toEqual(opts)
  })
})
