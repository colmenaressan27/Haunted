import type {CapabilityReport} from '../../ar/DeviceCapabilities'

interface Props {
  report: CapabilityReport
  slamNeedsReload: boolean
  onStartSlam: () => void
  onStartFallback: () => void
  onCredits: () => void
}

export function IntroScreen({report, slamNeedsReload, onStartSlam, onStartFallback, onCredits}: Props) {
  const failing = report.checks.filter((c) => !c.ok)

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
        <button type="button" className="btn btn-ghost" onClick={onCredits}>
          Créditos y licencias
        </button>
      </div>

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
