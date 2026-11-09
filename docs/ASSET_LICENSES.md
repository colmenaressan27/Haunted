# Inventario de licencias — HAUNTED

Regla: nada entra en producción sin fila verificada aquí. Plantilla de columnas en `ASSET_LICENSES_TEMPLATE.csv`.

## Software de terceros distribuido con el juego

| ID | Componente | Versión | Cómo se distribuye | Licencia | Obligaciones | Verificado |
|---|---|---|---|---|---|---|
| SW-001 | 8th Wall Engine — Distributed Engine Binary (`@8thwall/engine-binary`) | 1.0.0 (fijada) | Copia **sin modificar** de `dist/` en `external/xr/` (scripts/copy-vendor.mjs) | XR Engine License Agreement, Niantic Spatial — **no MIT** — https://github.com/8thwall/engine/blob/main/LICENSE | Mantener aviso de copyright; identificar a Niantic Spatial como creador; referir al acuerdo y al descargo de garantías; enlace a la licencia; no modificar, descompilar ni redistribuir fuera de la forma original; no usar en producto de pago cuyo valor derive sustancialmente del motor; no implicar patrocinio. | 2026-11-09 — texto leído; avisos en `index.html` (comentario) y pantalla Créditos; `external/xr/LICENSE` se sirve tal cual |
| SW-002 | XRExtras (`@8thwall/xrextras`) | 1.0.0 (fijada) | Copia sin modificar en `external/xrextras/` | MIT | Conservar LICENSE (se sirve en `external/xrextras/LICENSE`) | 2026-11-09 (npm: MIT) |
| SW-003 | three.js | 0.183.2 (fijada) | Bundle de Vite | MIT | Aviso de licencia en créditos | 2026-11-09 (npm: MIT) |
| SW-004 | React / React DOM | 19.3.1 (fijada) | Bundle de Vite | MIT | Aviso en créditos | 2026-11-09 (npm: MIT) |

Notas:
- El uso previsto (parcial universitario, portafolio, stand) es **no comercial**. Si el proyecto pasara a venderse, revisar la sección 1.2 del acuerdo de 8th Wall antes.
- El ejemplo oficial `8thwall/threejs-world-effects-example` **no incluye archivo LICENSE**; por eso no se copió su código: el adaptador se escribió desde la API documentada.
- Hand Tracking, VPS y Maps **no** están incluidos en el binario.

## Modelos, texturas, audio y fuentes

| ID | Asset | Fuente | Licencia | Atribución | Uso nativo futuro | Estado |
|---|---|---|---|---|---|---|
| — | (ninguno en el Hito 0) | — | — | — | — | El cubo de prueba es geometría generada por código. Fuentes del sistema. |
