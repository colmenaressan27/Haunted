import {
  CUBE_SIZES,
  PLACEMENT_LABELS,
  SCALE_LABELS,
  type ArOptions,
  type PlacementStrategy,
  type ScaleMode,
} from '../../ar/arOptions'
import {useState} from 'react'
import type {LogEntry} from '../../ar/arStore'
import type {CapabilityReport} from '../../ar/DeviceCapabilities'
import {copyLogForQa} from '../qaLog'

interface Props {
  report: CapabilityReport
  options: ArOptions
  /** Registro de la sesión anterior (incluye la línea RESUMEN al detener). */
  log: readonly LogEntry[]
  slamNeedsReload: boolean
  onOptionsChange: (options: ArOptions) => void
  onStartSlam: () => void
  onStartFallback: () => void
  onCredits: () => void
}

export function IntroScreen({
  report,
  options,
  log,
  slamNeedsReload,
  onOptionsChange,
  onStartSlam,
  onStartFallback,
  onCredits,
}: Props) {
  const failing = report.checks.filter((c) => !c.ok)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const copyLog = async () => setCopyState((await copyLogForQa(log)) ? 'ok' : 'fail')

  return (
    <main className="screen intro interactive">
      <header className="intro-header">
        <p className="file-tag">Expediente 01 · Sujeto 01</p>
        <h1 className="title">HAUNTED</h1>
        <p className="subtitle">El Observador</p>
      </header>

      <section className="panel" aria-labelledby="hito0-title">
        <h2 id="hito0-title" className="panel-title">
          Prueba técnica · Hito 0
        </h2>
        <p>
          Esto todavía <strong>no es el juego</strong>. Comprueba si este teléfono puede fijar un objeto 3D a tu
          habitación real.
        </p>
        <ul className="safety">
          <li>Usa un espacio despejado y con luz.</li>
          <li>Muévete despacio. Nunca camines mirando solo la pantalla.</li>
          <li>Puedes detener la cámara en cualquier momento.</li>
        </ul>
      </section>

      {report.warnings.map((w) => (
        <p key={w} className="notice">
          {w}
        </p>
      ))}

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onStartSlam} disabled={!report.slamCandidate}>
          {slamNeedsReload ? 'Reiniciar AR (recarga la página)' : 'Iniciar AR · seguimiento real'}
        </button>
        {!report.slamCandidate && (
          <p className="notice" role="status">
            Este dispositivo no cumple los requisitos de seguimiento espacial:
            <br />
            {failing.map((c) => c.hint).join(' ')}
          </p>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onStartFallback}
          disabled={!report.fallbackAvailable}
        >
          Modo compatible · sin anclaje espacial
        </button>
        {log.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => void copyLog()}>
            {copyState === 'ok'
              ? 'Registro copiado'
              : copyState === 'fail'
                ? 'No se pudo copiar'
                : 'Copiar registro de la sesión anterior (QA)'}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onCredits}>
          Créditos y licencias
        </button>
      </div>

      <details className="checks variants">
        <summary>Variante de prueba (QA)</summary>
        <div className="variant-grid">
          <label>
            Colocación
            <select
              value={options.placement}
              onChange={(e) => onOptionsChange({...options, placement: e.target.value as PlacementStrategy})}
            >
              {(Object.keys(PLACEMENT_LABELS) as PlacementStrategy[]).map((k) => (
                <option key={k} value={k}>
                  {PLACEMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Escala
            <select
              value={options.scale}
              onChange={(e) => onOptionsChange({...options, scale: e.target.value as ScaleMode})}
            >
              {(Object.keys(SCALE_LABELS) as ScaleMode[]).map((k) => (
                <option key={k} value={k}>
                  {SCALE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tamaño del cubo
            <select
              value={options.cubeSize}
              onChange={(e) => onOptionsChange({...options, cubeSize: Number(e.target.value)})}
            >
              {CUBE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {Math.round(s * 100)} cm (aprox.)
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="fine">
          La variante queda en la URL; compártela para repetir la misma prueba. Predeterminado: suelo estimado,
          escala relativa, 15 cm.
        </p>
      </details>

      <details className="checks">
        <summary>Requisitos detectados ({report.platform})</summary>
        <ul>
          {report.checks.map((c) => (
            <li key={c.id} className={c.ok ? 'ok' : 'fail'}>
              <span aria-hidden="true">{c.ok ? '✓' : '✕'}</span> {c.label}
              <span className="sr-only">{c.ok ? ': disponible' : ': no disponible'}</span>
            </li>
          ))}
        </ul>
        <p className="fine">
          Que todo esté en verde no garantiza el seguimiento en este modelo: solo indica que merece la pena
          intentarlo.
        </p>
      </details>

      <footer className="legal">Motor AR: 8th Wall Engine · © 2026 Niantic Spatial, Inc.</footer>
    </main>
  )
}
