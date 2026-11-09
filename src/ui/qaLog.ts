import type {LogEntry} from '../ar/arStore'

/** Texto del registro para pegar en la matriz de QA (orden cronológico, con el UA del dispositivo). */
export function formatLogForQa(log: readonly LogEntry[], userAgent: string, url: string): string {
  const lines = [...log].reverse().map((e) => `[${(e.t / 1000).toFixed(1)}s] ${e.msg}`)
  return [userAgent, url, ...lines].join('\n')
}

export async function copyLogForQa(log: readonly LogEntry[]): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(formatLogForQa(log, navigator.userAgent, window.location.href))
    return true
  } catch {
    return false
  }
}
