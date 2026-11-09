import {describe, expect, it} from 'vitest'
import {
  assessCapabilities,
  detectPlatform,
  isInAppBrowser,
  supportsWasmSimd,
  type CapabilityEnv,
} from './DeviceCapabilities'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const IPADOS_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'

function env(overrides: Partial<CapabilityEnv> = {}): CapabilityEnv {
  return {
    secureContext: true,
    hasGetUserMedia: true,
    hasWebGL: true,
    hasWasmSimd: true,
    hasDeviceOrientation: true,
    isTouchDevice: true,
    userAgent: IPHONE_SAFARI,
    ...overrides,
  }
}

describe('detectPlatform', () => {
  it('reconoce iPhone, Android y escritorio', () => {
    expect(detectPlatform(IPHONE_SAFARI, true)).toBe('ios')
    expect(detectPlatform(ANDROID_CHROME, true)).toBe('android')
    expect(detectPlatform(WINDOWS_CHROME, false)).toBe('desktop')
  })

  it('trata iPadOS (UA de Mac + táctil) como iOS y un Mac sin táctil como escritorio', () => {
    expect(detectPlatform(IPADOS_DESKTOP_UA, true)).toBe('ios')
    expect(detectPlatform(IPADOS_DESKTOP_UA, false)).toBe('desktop')
  })
})

describe('assessCapabilities', () => {
  it('un móvil que cumple todo es candidato a SLAM', () => {
    const r = assessCapabilities(env())
    expect(r.slamCandidate).toBe(true)
    expect(r.fallbackAvailable).toBe(true)
    expect(r.checks.every((c) => c.ok)).toBe(true)
  })

  it('sin HTTPS no hay SLAM ni modo compatible (la cámara no abre)', () => {
    const r = assessCapabilities(env({secureContext: false}))
    expect(r.slamCandidate).toBe(false)
    expect(r.fallbackAvailable).toBe(false)
    expect(r.checks.find((c) => c.id === 'secureContext')?.ok).toBe(false)
  })

  it('sin WebAssembly SIMD no hay SLAM pero sí modo compatible', () => {
    const r = assessCapabilities(env({hasWasmSimd: false}))
    expect(r.slamCandidate).toBe(false)
    expect(r.fallbackAvailable).toBe(true)
  })

  it('el escritorio nunca se ofrece como SLAM aunque tenga webcam', () => {
    const r = assessCapabilities(env({userAgent: WINDOWS_CHROME, isTouchDevice: false}))
    expect(r.platform).toBe('desktop')
    expect(r.slamCandidate).toBe(false)
    expect(r.fallbackAvailable).toBe(true)
  })

  it('avisa si se abre dentro del navegador de una app', () => {
    const r = assessCapabilities(env({userAgent: `${IPHONE_SAFARI} Instagram 350.0`}))
    expect(r.warnings).toHaveLength(1)
  })
})

describe('isInAppBrowser', () => {
  it('no marca Safari ni Chrome normales', () => {
    expect(isInAppBrowser(IPHONE_SAFARI)).toBe(false)
    expect(isInAppBrowser(ANDROID_CHROME)).toBe(false)
    expect(isInAppBrowser(`${ANDROID_CHROME} [FBAN/FB4A;FBAV/400.0]`)).toBe(true)
  })
})

describe('supportsWasmSimd', () => {
  it('valida el módulo de prueba en un motor con SIMD (Node/V8)', () => {
    expect(supportsWasmSimd()).toBe(true)
  })
})
