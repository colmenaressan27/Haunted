// iOS (Safari 13+) exige pedir permiso de orientación/movimiento dentro de un gesto del usuario.
// Llamar a requestMotionPermission() como PRIMERA operación asíncrona del manejador del botón.
// En Android y escritorio la API no existe y no hace falta pedirlo.

interface PermissionRequester {
  requestPermission?: () => Promise<string>
}

export type MotionPermissionResult = 'granted' | 'denied' | 'not-required' | 'unknown'

export async function requestMotionPermission(): Promise<MotionPermissionResult> {
  const orientation = window.DeviceOrientationEvent as unknown as PermissionRequester | undefined
  const motion = window.DeviceMotionEvent as unknown as PermissionRequester | undefined

  // Ambas llamadas se lanzan de forma síncrona, todavía dentro del gesto.
  const calls: Promise<string>[] = []
  if (typeof orientation?.requestPermission === 'function') calls.push(orientation.requestPermission())
  if (typeof motion?.requestPermission === 'function') calls.push(motion.requestPermission())
  if (calls.length === 0) return 'not-required'

  try {
    const results = await Promise.all(calls)
    return results.every((r) => r === 'granted') ? 'granted' : 'denied'
  } catch {
    // Puede fallar si el navegador no considera válido el gesto; XRExtras volverá a pedirlo.
    return 'unknown'
  }
}
