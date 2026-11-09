import {useSyncExternalStore} from 'react'
import type {ExpedienteController} from '../../app/controllers/ExpedienteController'
import {gameStore} from '../../app/gameStore'
import type {CalibrationStep} from '../../game/calibration'
import {PHOTO_EVIDENCE} from '../../game/evidenceText'
import {isBackFacing} from '../../game/photoObject'

interface Props {
  controller: ExpedienteController
  trackingNormal: boolean
}

const STEP_COPY: Record<Exclude<CalibrationStep, 'done'>, {n: number; title: string; body: string; action: string}> = {
  floor: {
    n: 1,
    title: 'Suelo',
    body: 'De pie, apunta al suelo a uno o dos pasos y mueve el teléfono despacio hasta ver el anillo estable.',
    action: 'Continuar',
  },
  safe: {
    n: 2,
    title: 'Zona segura',
    body: 'Apunta a un punto libre del suelo, a uno o dos pasos y sin obstáculos. Ahí te refugiarás durante la cacería.',
    action: 'Marcar zona segura',
  },
  table: {
    n: 3,
    title: 'Mesa (opcional)',
    body: 'Apunta a la superficie de una mesa o mueble bajo. Ahí aparecerá la primera evidencia.',
    action: 'Marcar mesa',
  },
  peek: {
    n: 4,
    title: 'Umbral',
    body: 'Apunta a la base de una puerta, un mueble alto, una esquina o una cortina, a más de un paso de la zona segura. Desde ahí te observarán.',
    action: 'Marcar umbral',
  },
}

export function ExpedientePanel({controller, trackingNormal}: Props) {
  const game = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const {calibration, photo} = game
  const step = calibration.step

  if (step !== 'done') {
    const copy = STEP_COPY[step]
    const canAct = trackingNormal && game.reticle === 'surface'
    return (
      <section className="panel game-panel interactive" aria-labelledby="calib-title">
        <p className="file-tag">Calibración · paso {copy.n} de 4</p>
        <h2 id="calib-title" className="panel-title">
          {copy.title}
        </h2>
        <p>{copy.body}</p>
        {game.reticle === 'too-far' && <p className="notice">Ese punto está demasiado lejos: apunta más cerca.</p>}
        {calibration.error && (
          <p className="notice notice-error" role="alert">
            {calibration.error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canAct}
            onClick={() => (step === 'floor' ? controller.confirmFloor() : controller.markHere())}
          >
            {copy.action}
          </button>
          {!trackingNormal && <p className="fine">Espera a «Seguimiento estable» para marcar.</p>}
          <div className="actions-row">
            {step !== 'floor' && (
              <button type="button" className="btn btn-ghost" onClick={() => controller.back()}>
                Atrás
              </button>
            )}
            {step === 'table' && (
              <button type="button" className="btn btn-secondary" onClick={() => controller.skipZone()}>
                No tengo mesa
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (photo.location === 'examining') {
    const showingBack = isBackFacing(photo.examineYaw)
    return (
      <section className="panel game-panel interactive" aria-labelledby="exam-title">
        <h2 id="exam-title" className="panel-title">
          Examinando la fotografía
        </h2>
        <p className="fine">Arrastra sobre la imagen para girarla.</p>
        {/* Subtítulo accesible: el texto de la foto también se lee aquí. */}
        <p className="caption" aria-live="polite">
          {showingBack
            ? `Reverso: «${PHOTO_EVIDENCE.inscription}» ${PHOTO_EVIDENCE.backCaption}`
            : `${PHOTO_EVIDENCE.frontCaption} ${PHOTO_EVIDENCE.date}.`}
        </p>
        <label className="zoom-control">
          Acercar
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={photo.zoom}
            onChange={(e) => controller.setZoom(Number(e.target.value))}
          />
        </label>
        <div className="actions-row">
          <button type="button" className="btn btn-secondary" onClick={() => controller.flip()}>
            Dar la vuelta
          </button>
          <button type="button" className="btn btn-primary" onClick={() => controller.closeExamine()}>
            Cerrar
          </button>
        </div>
      </section>
    )
  }

  if (photo.location === 'held') {
    return (
      <section className="panel game-panel interactive" aria-labelledby="held-title">
        <h2 id="held-title" className="panel-title">
          Tienes la fotografía
        </h2>
        {photo.backSeen && <p className="chip">Reverso examinado: hay una inscripción</p>}
        <p className="fine">
          {game.dropSurface
            ? `Para soltarla, apunta el anillo ${game.dropSurface === 'table' ? 'a la mesa' : 'al suelo'}.`
            : 'Apunta a la mesa o al suelo cerca de ti para poder soltarla.'}
        </p>
        <div className="actions-row">
          <button type="button" className="btn btn-primary" onClick={() => controller.examine()}>
            Examinar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!game.dropSurface}
            onClick={() => controller.drop()}
          >
            Soltar aquí
          </button>
        </div>
      </section>
    )
  }

  if (photo.location === 'world') {
    const onTable = photo.worldPosition !== null && photo.worldPosition.y > 0.1
    return (
      <section className="panel game-panel interactive" aria-labelledby="world-title">
        <h2 id="world-title" className="panel-title">
          {photo.backSeen ? 'La fotografía' : 'Hay algo ' + (onTable ? 'sobre la mesa' : 'en el suelo')}
        </h2>
        <p className="fine">
          {photo.needsCheck || game.unreliable
            ? 'El seguimiento no es fiable: su posición puede no ser exacta.'
            : 'Tócala para cogerla. No hace falta caminar: también puedes recuperarla.'}
        </p>
        <div className="actions-row">
          <button type="button" className="btn btn-secondary" onClick={() => controller.recover()}>
            Recuperar fotografía
          </button>
        </div>
      </section>
    )
  }

  return null
}
