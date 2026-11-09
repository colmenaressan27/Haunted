const XR_LICENSE_URL = 'https://github.com/8thwall/engine/blob/main/LICENSE'
const BASE = import.meta.env.BASE_URL

interface Props {
  onBack: () => void
}

export function CreditsScreen({onBack}: Props) {
  return (
    <main className="screen credits interactive">
      <h1 className="panel-title">Créditos y licencias</h1>

      <section className="panel">
        <h2>Seguimiento espacial</h2>
        <p>8th Wall Engine — Distributed Engine Binary 1.0.0 (paquete npm @8thwall/engine-binary).</p>
        <p lang="en">
          This product includes the XR Engine software developed by Niantic Spatial, Inc. Copyright © 2026 Niantic
          Spatial, Inc. All rights reserved. Licensed under the{' '}
          <a href={XR_LICENSE_URL} target="_blank" rel="noreferrer">
            XR Engine License Agreement
          </a>{' '}
          (<a href={`${BASE}external/xr/LICENSE`}>copia local</a>). The Software is provided “AS IS” without
          warranties of any kind; see Section 4 (Disclaimers) of the Agreement.
        </p>
        <p className="fine">
          HAUNTED es un proyecto universitario no comercial y no está afiliado, patrocinado ni respaldado por Niantic
          Spatial. El binario se distribuye sin modificar.
        </p>
      </section>

      <section className="panel">
        <h2>Software libre</h2>
        <ul>
          <li>
            XRExtras 1.0.0 — MIT (<a href={`${BASE}external/xrextras/LICENSE`}>licencia</a>)
          </li>
          <li>
            8th Wall Coaching Overlay 1.0.0 — MIT (
            <a href={`${BASE}external/coaching-overlay/LICENSE`}>licencia</a>)
          </li>
          <li>three.js 0.183.2 — MIT</li>
          <li>React 19 — MIT</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Arte y sonido</h2>
        <p>
          Esta prueba técnica no usa modelos, texturas ni sonidos de terceros. El inventario completo vive en{' '}
          <code>docs/ASSET_LICENSES.md</code>.
        </p>
      </section>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Volver
        </button>
      </div>
    </main>
  )
}
