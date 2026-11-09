// Comprobación honesta de requisitos para el SLAM de 8th Wall.
// Requisitos oficiales (https://8thwall.org/docs/troubleshooting/browser-requirements, 2026-11-09):
// HTTPS, WebGL, getUserMedia, WebAssembly SIMD y DeviceOrientation (este último solo para SLAM).
// Que todos pasen NO garantiza que el SLAM funcione en ese modelo: solo que merece la pena intentarlo.

export interface CapabilityEnv {
  secureContext: boolean
  hasGetUserMedia: boolean
  hasWebGL: boolean
  hasWasmSimd: boolean
  hasDeviceOrientation: boolean
  /** Heurística: puntero táctil grueso. No hay API estándar para «es un móvil». */
  isTouchDevice: boolean
  userAgent: string
}

export type CapabilityId =
  | 'secureContext'
  | 'getUserMedia'
  | 'webgl'
  | 'wasmSimd'
  | 'deviceOrientation'
  | 'mobileDevice'

export interface CapabilityCheck {
  id: CapabilityId
  ok: boolean
  label: string
  /** Explicación para el jugador cuando falla. */
  hint: string
}

export interface CapabilityReport {
  checks: CapabilityCheck[]
  /** Se puede intentar SLAM real (todas las comprobaciones pasan). */
  slamCandidate: boolean
  /** Se puede ofrecer el modo compatible (cámara + 3D sin anclaje). */
  fallbackAvailable: boolean
  platform: 'ios' | 'android' | 'desktop' | 'other'
  /** Avisos que no bloquean pero conviene mostrar. */
  warnings: string[]
}

export function detectPlatform(userAgent: string, isTouchDevice: boolean): CapabilityReport['platform'] {
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
  // iPadOS se presenta como Macintosh con pantalla táctil.
  if (/macintosh/i.test(userAgent) && isTouchDevice) return 'ios'
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return 'desktop'
  return 'other'
}

/** Detecta navegadores integrados en apps (Instagram, Facebook, TikTok…), con permisos de cámara poco fiables. */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat|musical_ly/i.test(userAgent)
}

export function assessCapabilities(env: CapabilityEnv): CapabilityReport {
  const platform = detectPlatform(env.userAgent, env.isTouchDevice)
  const isMobile = platform === 'ios' || platform === 'android'

  const checks: CapabilityCheck[] = [
    {
      id: 'secureContext',
      ok: env.secureContext,
      label: 'Conexión segura (HTTPS)',
      hint: 'La cámara solo funciona desde una URL https://. Abre el enlace publicado, no una IP con http.',
    },
    {
      id: 'getUserMedia',
      ok: env.hasGetUserMedia,
      label: 'Acceso a cámara',
      hint: 'Este navegador no expone la cámara. Prueba Safari (iOS 16.4+) o Chrome en Android.',
    },
    {
      id: 'webgl',
      ok: env.hasWebGL,
      label: 'WebGL',
      hint: 'WebGL no está disponible o está desactivado.',
    },
    {
      id: 'wasmSimd',
      ok: env.hasWasmSimd,
      label: 'WebAssembly SIMD',
      hint: 'El motor SLAM necesita WebAssembly SIMD. En iPhone requiere Safari de iOS 16.4 o superior.',
    },
    {
      id: 'deviceOrientation',
      ok: env.hasDeviceOrientation,
      label: 'Sensores de orientación',
      hint: 'El seguimiento espacial necesita los sensores de movimiento del teléfono.',
    },
    {
      id: 'mobileDevice',
      ok: isMobile,
      label: 'Teléfono iOS o Android',
      hint: 'El seguimiento espacial (SLAM) es para teléfonos. En ordenador solo está disponible el modo compatible.',
    },
  ]

  const warnings: string[] = []
  if (isInAppBrowser(env.userAgent)) {
    warnings.push('Estás en el navegador de una app. Abre el enlace en Safari o Chrome para mejores permisos de cámara.')
  }

  return {
    checks,
    slamCandidate: checks.every((c) => c.ok),
    fallbackAvailable: env.secureContext && env.hasGetUserMedia && env.hasWebGL,
    platform,
    warnings,
  }
}

// Módulo wasm mínimo que usa una instrucción SIMD (i8x16.splat + i8x16.popcnt).
// Mismo test que la librería wasm-feature-detect (Apache-2.0).
const WASM_SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
])

export function supportsWasmSimd(): boolean {
  try {
    return typeof WebAssembly === 'object' && WebAssembly.validate(WASM_SIMD_PROBE)
  } catch {
    return false
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Lee el entorno real del navegador. Solo en cliente. */
export function probeEnvironment(): CapabilityEnv {
  return {
    secureContext: window.isSecureContext,
    hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
    hasWebGL: supportsWebGL(),
    hasWasmSimd: supportsWasmSimd(),
    hasDeviceOrientation: typeof window.DeviceOrientationEvent !== 'undefined',
    isTouchDevice: window.matchMedia?.('(pointer: coarse)').matches === true || navigator.maxTouchPoints > 0,
    userAgent: navigator.userAgent,
  }
}
