import {useState, type ReactNode} from 'react'
import type {PlacementStrategy} from '../../ar/arOptions'
import type {ArSnapshot, PlacementMethod} from '../../ar/arStore'
import {copyLogForQa} from '../qaLog'
import {sessionHint, trackingLabel} from '../trackingCopy'

const METHOD_LABELS: Record<PlacementMethod, string> = {
  'ground-plane': 'suelo',
  'hit-test': 'punto',
  'surface-plane': 'plano',
}

interface Props {
  snap: ArSnapshot
  placement: PlacementStrategy
  variantLabel: string
  /** Qué se pregunta tras una pérdida o un salto: «el cubo» o «las marcas y la foto». */
  anchorSubject: string
  canRecenter: boolean
  canFallback: boolean
  onRecenter: () => void
  onRecalibrate?: () => void
  onStop: () => void
  onSwitchToFallback: () => void
  onConfirmAnchor: () => void
  onReplaceAnchor: () => void
  /** Panel principal de la sesión (expediente). Sin él se muestra la pista genérica. */
  children?: ReactNode
}

export function SessionHud({
  snap,
  placement,
  variantLabel,
  anchorSubject,
  canRecenter,
  canFallback,
  onRecenter,
  onRecalibrate,
  onStop,
  onSwitchToFallback,
  onConfirmAnchor,
  onReplaceAnchor,
  children,
}: Props) {
  const [showLog, setShowLog] = useState(false)
  const [copied, setCopied] = useState(false)
  const {tracking} = snap
  const isSlam = tracking.mode === 'slam'
  const failed = tracking.quality === 'failed'

  const copyLog = async () => {
    const ok = await copyLogForQa(snap.log)
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 1500)
  }

  let center: ReactNode
  if (failed) {
    center = (
      <div className="panel error-panel interactive" role="alert">
        <h2 className="panel-title">No se pudo iniciar</h2>
        <p>{tracking.error}</p>
        <div className="actions">
          {isSlam && canFallback && (
            <button type="button" className="btn btn-secondary" onClick={onSwitchToFallback}>
              Probar modo compatible (sin anclaje)
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onStop}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  } else if (snap.anchorCheck) {
    center = (
      <div className="panel anchor-panel interactive" role="alertdialog" aria-labelledby="anchor-q">
        <p id="anchor-q" className="panel-title">
          {snap.anchorCheck === 'jump' ? 'El seguimiento dio un salto.' : 'Se recuperó el seguimiento.'} ¿{anchorSubject}{' '}
          sigue en su sitio?
        </p>
        <div className="actions actions-row">
          <button type="button" className="btn btn-secondary" onClick={onConfirmAnchor}>
            Sí, sigue igual
          </button>
          <button type="button" className="btn btn-primary" onClick={onReplaceAnchor}>
            Se movió
          </button>
        </div>
      </div>
    )
  } else if (children && tracking.mode === 'slam' && tracking.quality !== 'starting') {
    center = (
      <>
        {snap.notice && <p className="hint">{snap.notice}</p>}
        {children}
      </>
    )
  } else {
    center = <p className="hint">{sessionHint(snap, placement)}</p>
  }

  return (
    <div className="hud">
      <div className="hud-top">
        <span className={`mode-badge ${isSlam ? 'mode-slam' : 'mode-fallback'}`}>
          {isSlam ? 'SLAM real · 8th Wall' : 'Modo compatible · SIN anclaje espacial'}
        </span>
        {isSlam && <span className="variant-tag">{variantLabel}</span>}
        <p className={`tracking-pill q-${tracking.quality}`} role="status" aria-live="polite">
          {trackingLabel(tracking.quality)}
        </p>
      </div>

      {center}

      <div className="hud-bottom interactive">
        <dl className="stats">
          <div>
            <dt>FPS</dt>
            <dd>{snap.fps ?? '—'}</dd>
          </div>
          {isSlam && (
            <div>
              <dt>Pérdidas</dt>
              <dd>{tracking.lossCount}</dd>
            </div>
          )}
          {isSlam && snap.placement && (
            <>
              <div>
                <dt>Distancia</dt>
                <dd>{snap.distanceToObject === null ? '—' : `${snap.distanceToObject} u`}</dd>
              </div>
              <div>
                <dt>Colocado</dt>
                <dd>{METHOD_LABELS[snap.placement.method]}</dd>
              </div>
            </>
          )}
        </dl>

        <div className="hud-buttons">
          {canRecenter && (
            <button type="button" className="btn btn-small" onClick={onRecenter}>
              Recentrar
            </button>
          )}
          {onRecalibrate && (
            <button type="button" className="btn btn-small" onClick={onRecalibrate}>
              Recalibrar
            </button>
          )}
          <button
            type="button"
            className="btn btn-small"
            aria-expanded={showLog}
            onClick={() => setShowLog((v) => !v)}
          >
            Registro
          </button>
          <button type="button" className="btn btn-small btn-stop" onClick={onStop}>
            Detener cámara
          </button>
        </div>

        {showLog && (
          <div className="log-panel">
            <button type="button" className="btn btn-small" onClick={() => void copyLog()}>
              {copied ? 'Copiado' : 'Copiar registro para QA'}
            </button>
            <ol>
              {snap.log.map((e) => (
                <li key={`${e.t}-${e.msg}`}>
                  <span className="log-t">{(e.t / 1000).toFixed(1)}s</span> {e.msg}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
