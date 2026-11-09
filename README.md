# HAUNTED — Expediente 01: El Observador

Teaser WebAR de terror (8–10 min) para iPhone y Android desde una URL HTTPS.
**Estado actual: Hito 0. Prueba técnica de tracking, todavía no es el juego.**

- Especificación: [docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md](docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md)
- Guía de producción: [docs/HAUNTED_GUIA_DE_DESARROLLO.md](docs/HAUNTED_GUIA_DE_DESARROLLO.md)
- Diseño técnico: [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md) · Log: [docs/IMPLEMENTATION_LOG.md](docs/IMPLEMENTATION_LOG.md)
- QA en dispositivos: [docs/QA_DEVICE_MATRIX.md](docs/QA_DEVICE_MATRIX.md) · Licencias: [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md)

## Qué hace el Hito 0

1. Comprueba los requisitos oficiales del SLAM de 8th Wall: HTTPS, cámara, WebGL, WebAssembly SIMD, sensores y móvil.
2. **Iniciar AR · seguimiento real**: arranca el SLAM de 8th Wall Engine 1.0.0. Al tocar el suelo o una mesa se coloca un cubo de 15 cm (aprox.) anclado a la habitación. El HUD muestra el estado del tracking, los FPS, la distancia al cubo, las pérdidas de tracking y el método de colocación.
3. **Modo compatible · sin anclaje espacial**: la cámara con un cubo 3D fijo a la pantalla, rotulado como tal. Es para dispositivos sin SLAM o para revisar la UI en un PC.
4. Botones **Recentrar**, **Registro** (con «Copiar registro para QA») y **Detener cámara**. Créditos con la atribución exigida por la licencia de 8th Wall.

Un build correcto o los tests en PC **no demuestran** que el AR funcione en un teléfono. Eso se registra en `docs/QA_DEVICE_MATRIX.md`.

## Requisitos

Node 22 o superior (probado con 26.13), npm, Git y Git LFS.

```powershell
npm install        # también copia el runtime de 8th Wall a public/external (sin modificarlo)
```

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor local en PC (http://localhost:5173). Sirve para la UI y el modo compatible con webcam. **No vale para el teléfono.** |
| `npm run dev:lan` | HTTPS autofirmado en tu red Wi-Fi. Abre en el teléfono la URL `https://192.168.x.x:5173` que imprime la consola y acepta el aviso del certificado. Android/Chrome suele funcionar; en iOS/Safari no está garantizado. |
| `npm run build` / `npm run preview` | Build de producción en `dist/` y previsualización. `preview:lan` hace lo mismo con HTTPS en LAN. |
| `npm run lint` · `npm run typecheck` · `npm run test` | Verificaciones de cada hito. |

## Publicar en GitHub Pages (vía recomendada para el teléfono)

1. Crea un repositorio en GitHub (por ejemplo `haunted-webar`).
2. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
3. `git remote add origin https://github.com/<usuario>/haunted-webar.git` y luego `git push -u origin main`.
4. El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) ejecuta lint, typecheck, tests y build, y despliega solo `dist/`. La URL queda como `https://<usuario>.github.io/haunted-webar/`.

Las rutas son relativas (`base: './'`), así que no hace falta configurar el nombre del repositorio en Vite.

## Protocolo de prueba en el teléfono (puerta del Hito 0)

1. **Línea base:** abre la demo oficial https://8thwall.org/threejs-world-effects-example/ y comprueba que su cubo queda anclado.
2. Abre la URL HTTPS de HAUNTED, pulsa **Iniciar AR** y acepta los permisos de cámara y movimiento.
3. Mueve el teléfono despacio de lado a lado hasta que aparezca «Seguimiento estable».
4. Toca el suelo y luego una mesa. Fíjate si el HUD indica `hit-test` o `suelo y=0`.
5. Muévete despacio 30–60 cm alrededor del cubo y **graba un vídeo con el propio teléfono**.
6. Tapa la cámara 2 s: debe aparecer «limitado» y el contador de pérdidas debe subir. Destápala y anota si el cubo vuelve a su sitio.
7. Abre **Registro → Copiar registro para QA** y pega el texto en la matriz.

## Hito 0.1: comparar variantes en el iPhone

Abre **Variante de prueba (QA)** en la portada (o usa la URL directamente). La variante queda en la URL y sobrevive a la recarga.

| Prueba | URL (añadir a la de Pages) | Qué mirar |
|---|---|---|
| A · referencia | demo oficial https://8thwall.org/threejs-world-effects-example/ | Línea base del motor en ese iPhone. |
| B · predeterminada | *(sin parámetros)* (suelo estimado) | ¿Se parece a A? ¿Desaparece el «se hace más pequeño»? |
| C · escala absoluta | `?scale=absolute` | Sigue la guía (adelante/atrás). ¿Menos deriva? ¿El cubo mide ~15 cm de verdad? |
| D · método anterior | `?place=hit` | Debería reproducir el problema del Hito 0. |
| E · mesa | `?place=plane` | Tocar una mesa: ¿queda **sobre** la mesa? |
| F · tamaño | `?size=0.5` (combinable) | ¿La deriva se nota menos con un objeto grande? |

Mismo sitio, misma luz y suelo con textura (no liso ni brillante). En cada prueba:
1. Coloca el cubo a 1–1,5 m de ti.
2. Graba **20 s** acercándote y rodeándolo despacio.
3. Tapa la cámara 2 s, destápala y contesta la pregunta «¿Sigue en su sitio?» con sinceridad.
4. Pulsa **Detener cámara**. Así se escribe la línea `RESUMEN` en el registro.
5. Copia el registro y anota: deriva (nada / leve / notable / se descontrola) y cambio de tamaño (sí / no).

## Licencias

El SLAM usa **8th Wall Distributed Engine Binary**, de Niantic Spatial, bajo el *XR Engine License Agreement*. **No es MIT.** Se distribuye sin modificar desde `external/xr/`. Detalle en [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md).
