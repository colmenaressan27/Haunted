# Diseño técnico — HAUNTED (estado: Hito 0)

Fuente de requisitos: `HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md`. Este documento registra solo decisiones tomadas y verificadas.

## Stack fijado

| Pieza | Versión | Motivo |
|---|---|---|
| @8thwall/engine-binary | 1.0.0 exacta | Único SLAM web disponible sin coste para el teaser. Licencia propia (ver `ASSET_LICENSES.md`). |
| @8thwall/xrextras | 1.0.0 | Pantalla de carga y flujo de permisos (incl. iOS) probados por 8th Wall. |
| three | 0.183.2 exacta | Misma línea que el ejemplo oficial (`^0.183.2`). La 0.187 existe pero no está verificada con XR8. |
| React 19 + Vite 8 + TypeScript 6 (strict) | exactas | Overlay/UI. TS 7 descartado: typescript-eslint 8.72 exige `<6.1`. |
| Vitest 5, ESLint 10 + typescript-eslint | exactas | Lógica pura testeable. |

## Carga del runtime AR

- `scripts/copy-vendor.mjs` copia `node_modules/@8thwall/{engine-binary,xrextras}/dist` **sin modificar** a `public/external/{xr,xrextras}` (ignorado por git; se regenera en `npm install`/`dev`/`build`).
- `index.html` carga `external/xrextras/xrextras.js` y `external/xr/xr.js` (async, `data-preload-chunks="slam"`) desde el mismo origen. Nada depende de una CDN con versión flotante.
- Peso del motor que descarga el cliente (según listado del paquete): `xr.js` 1,0 MB + `xr-slam.js` 5,5 MB + `resources/media-worker.js` 5,0 MB ≈ **11,5 MB sin comprimir**, antes de assets del juego. Pendiente medir transferencia real comprimida en móvil.
- `base: './'` en Vite: rutas relativas válidas en GitHub Pages (`/<repo>/`), LAN y preview.

## Arquitectura (Hito 0)

```
src/ar/
  IARAdapter.ts          contrato motor-agnóstico (initialize, recenter, shutdown, capabilities)
  EighthWallAdapter.ts   SLAM real: pipeline XR8 + Three.js, hit-test, eventos de tracking
  FallbackARAdapter.ts   getUserMedia + Three.js superpuesto, SIN anclaje (rotulado)
  DeviceCapabilities.ts  requisitos oficiales (HTTPS, getUserMedia, WebGL, WASM SIMD, orientación, móvil) — puro
  trackingState.ts       máquina de estados de tracking + isTrackingReliable() — puro, sin XR8
  arStore.ts             store observable (≤4 Hz) entre adaptadores imperativos y React
  motionPermission.ts    permiso de movimiento iOS dentro del gesto del usuario
  testObject.ts          cubo de prueba estático + sombra de contacto falsa + retícula
src/ui/                  pantallas React (intro, HUD, créditos) y textos
```

Regla para hitos futuros: `src/game/*` solo depende de `IARAdapter` y `trackingState`, nunca de `window.XR8`.

## Pipeline XR8 usado (API documentada, 2026-11-09)

1. `XR8.XrController.configure({scale: 'responsive', disableWorldTracking: false})`
2. `XR8.addCameraPipelineModules([GlTextureRenderer, Threejs, XrController, XRExtras.FullWindowCanvas, XRExtras.Loading, módulo propio])`
3. Módulo propio:
   - `onStart`: `XR8.Threejs.xrScene()`, luces, retícula; cámara a `y = 1.4` y `updateCameraProjectionMatrix({origin, facing})`.
   - `listeners: [{event: 'reality.trackingstatus'}]` → `trackingReducer`.
   - `onCameraStatusChange` (`requesting | hasStream | hasVideo | failed`) y `onException` → estado `failed` con mensaje.
   - `onUpdate`: retícula cada 100 ms con `hitTest(0.5, 0.5, ['FEATURE_POINT'])`; FPS y distancia cada 500 ms.
4. Toque (pointerup con <12 px y <500 ms): `hitTest(x, y, ['FEATURE_POINT'])` → punto más cercano; si no hay, rayo contra el plano de suelo `y = 0`. El HUD muestra qué método se usó.

### Escala

`responsive`: el suelo es `y = 0` y la cámara arranca a `y = 1.4`. 1 unidad ≈ 1 m **solo** si el teléfono está a ~1,4 m del suelo. El cubo mide 0,15 u. La escala `absolute` (metros reales) queda para evaluar en Hito 1, cuando haya props con tamaño físico.

### Tracking y seguridad

- `isTrackingReliable()` = SLAM y status `NORMAL`. Cualquier otro valor (incluidos desconocidos) es no fiable.
- La doc de 8th Wall es contradictoria en los valores de `reason` (`UNDEFINED` vs `UNSPECIFIED`); el reducer no depende de ellos salvo `INITIALIZING`.
- Base para el Hito 4: cacería y jumpscares deben pausarse cuando `isTrackingReliable()` sea false.

### Reinicio

XR8 no documenta reiniciar `run()` tras `stop()` en la misma página. Decisión: «Detener cámara» libera la cámara (`XR8.stop()` + `clearCameraPipelineModules()`), y un segundo inicio de SLAM **recarga la página**. Más lento, pero predecible en el stand.

## Fallback honesto

- Se ofrece si hay HTTPS + getUserMedia + WebGL. Badge permanente «Modo compatible · SIN anclaje espacial»; el cubo es fijo a la pantalla.
- En escritorio el SLAM nunca se ofrece (8th Wall SLAM es para móviles).
- Pendiente (P1): 3DoF por orientación del dispositivo; marcador de imagen como alternativa técnica.

## Pruebas automáticas vs reales

- Vitest cubre: requisitos, plataforma, SIMD, máquina de tracking, textos de seguridad.
- **No** cubren: cámara, SLAM, permisos reales, rendimiento. Eso exige `QA_DEVICE_MATRIX.md` en hardware.
- Playwright (UI/fallback con cámara falsa) se añadirá en Hito 1 si el coste de instalación de navegadores compensa.
