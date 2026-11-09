// Geometría de dominio, pura: sin Three.js ni XR8 (portable a C#/Unity).

export interface Vec3 {
  x: number
  y: number
  z: number
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return {x, y, z}
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Distancia en el plano del suelo (ignora la altura). */
export function horizontalDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

/** Intersección de un rayo con el plano horizontal y = planeY. null si es paralelo o queda detrás. */
export function intersectHorizontalPlane(origin: Vec3, direction: Vec3, planeY: number): Vec3 | null {
  if (Math.abs(direction.y) < 1e-6) return null
  const t = (planeY - origin.y) / direction.y
  if (t <= 0) return null
  return {x: origin.x + direction.x * t, y: planeY, z: origin.z + direction.z * t}
}

/** Punto a `dist` de `from` en dirección a `to`, sobre el plano horizontal de `from`. */
export function towards(from: Vec3, to: Vec3, dist: number): Vec3 {
  const d = horizontalDistance(from, to)
  if (d < 1e-6) return {...from}
  const k = dist / d
  return {x: from.x + (to.x - from.x) * k, y: from.y, z: from.z + (to.z - from.z) * k}
}

/** Ángulo de giro (alrededor de Y) para que un objeto en `from` mire hacia `to`. */
export function yawTowards(from: Vec3, to: Vec3): number {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

/** Normaliza un ángulo a (-π, π]. */
export function normalizeAngle(a: number): number {
  let r = a % (2 * Math.PI)
  if (r <= -Math.PI) r += 2 * Math.PI
  if (r > Math.PI) r -= 2 * Math.PI
  return r
}
