// Resumen de FPS para el registro de QA (las muestras son ventanas de ~500 ms).

export interface FpsSummary {
  avg: number
  min: number
  samples: number
}

export function summarizeFps(samples: readonly number[]): FpsSummary | null {
  if (samples.length === 0) return null
  const sum = samples.reduce((s, v) => s + v, 0)
  return {avg: Math.round(sum / samples.length), min: Math.min(...samples), samples: samples.length}
}

export function formatFpsSummary(s: FpsSummary | null): string {
  return s ? `FPS media ${s.avg}, mínimo ${s.min} (${s.samples} muestras)` : 'FPS sin muestras'
}
