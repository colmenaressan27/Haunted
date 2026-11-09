# Log de implementación — HAUNTED

Formato por entrada: logrado · parcial · bloqueado · pendiente de hardware · siguiente.

---

## 2026-11-09 — Hito 0: prueba de tracking WebAR

### Inventario inicial
- Repo con solo el kit de documentación; sin código ni git. Se inicializó git (`main`).
- Entorno: Git 2.56, Git LFS 3.8.1, Node 26.13, npm 11.20, Windows 11. CLI `claude` no está en PATH (solo afecta a añadir MCP por terminal).
- Verificado en fuentes oficiales: `@8thwall/engine-binary@1.0.0` (npm), `8thwall/threejs-world-effects-example` (usa three `^0.183.2` y CDN `@1` flotante; **sin LICENSE**), texto de la licencia del binario, requisitos de navegador (Safari iOS 16.4+, WASM SIMD, HTTPS) y API de `XrController.hitTest`, `reality.trackingstatus` y `onCameraStatusChange`.

### Plan P0/P1/P2 (riesgos)
- **P0**
  - SLAM no arranca en el hardware disponible → comprobación de requisitos + error visible + fallback rotulado + línea base con la demo oficial.
  - El teléfono necesita HTTPS → GitHub Pages (workflow) + `dev:lan` con certificado autofirmado.
  - Compatibilidad Three.js/XR8 → three fijado en 0.183.2.
  - Permiso de movimiento en iOS → pedido como primera operación asíncrona del gesto + XRExtras.Loading.
- **P1**
  - Deriva con poca luz → HUD con estado y contador de pérdidas.
  - Peso del motor ≈ 11,5 MB → medir en móvil.
  - Atribución de licencia → créditos + comentario en `index.html` + LICENSE servido.
- **P2**
  - Documentación de XR8 incompleta o contradictoria → valores desconocidos tratados como no fiables.
  - Hand tracking no incluido en el binario (conocido).

### Logrado (verificado en PC)
- Vite 8 + React 19 + TS 6 strict + three 0.183.2 + 8th Wall 1.0.0 / XRExtras 1.0.0, todo con versión exacta.
- Runtime de 8th Wall servido desde el propio origen, sin modificar (`scripts/copy-vendor.mjs` → `public/external/`, ignorado por git).
- `EighthWallAdapter` (SLAM, colocación por toque con hit-test o plano de suelo, retícula, tracking → store), `FallbackARAdapter` (cámara + cubo fijo, rotulado), `DeviceCapabilities`, `trackingState` (`isTrackingReliable`), permiso de movimiento en iOS.
- UI: portada con avisos de seguridad y requisitos, HUD (modo, tracking, FPS, distancia, pérdidas, Recentrar, Registro/copiar, Detener cámara), pantalla de error con salida al modo compatible y créditos/licencias.
- Three.js y los adaptadores en un chunk diferido; la portada no espera al 3D.
- Workflow de GitHub Pages: lint → typecheck → test → build → deploy de `dist/`.
- Revisión propia del diff, 2 bugs corregidos:
  1. Pulsar «Detener» mientras `getUserMedia` o la carga de XR8 seguían pendientes dejaba la cámara encendida. Ahora hay una bandera `disposed` y la cámara se libera al resolver.
  2. Un `CAMERA_READY` tardío degradaba un tracking `normal`. Hay un test nuevo.
- Prueba de humo con `vite preview` por HTTP y HTTPS (`mode lan`): HTML, `external/xr/{xr.js, xr-slam.js, resources/media-worker.js, LICENSE}`, XRExtras y chunks responden 200.
- Tamaños: portada `index` 236 kB (75 kB gzip); chunk diferido de three.js 716 kB (183 kB gzip); motor XR8 ≈ 11,3 MB sin comprimir (xr.js + xr-slam.js + media-worker.js).
- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run test` ✅ (23 tests) · `npm run build` ✅.

### Avisos aceptados
- Vite avisa de que los `<script>` de `external/xr/xr.js` y `external/xrextras/xrextras.js` no se bundlean sin `type="module"`. Es intencional: son scripts clásicos distribuidos por 8th Wall y deben servirse tal cual.
- `npm audit`: 10 avisos moderados, todos por un DoS de `minimatch` en **herramientas de lint (solo dev)**. Producción: 0. Arreglarlo exige bajar ESLint/typescript-eslint de versión mayor; se reevalúa en el Hito 1.

### Pendiente de hardware (NO PROBADO)
- Toda la matriz de `QA_DEVICE_MATRIX.md`, en especial la **puerta del hito**: cubo estable al moverse 30–60 cm en iPhone 13 Pro Max/Safari y en un Android/Chrome real (modelo por definir), con vídeo.
- Si el hit-test con `FEATURE_POINT` coloca bien en mesas o cae al plano y=0.
- Comportamiento de `Recentrar`, background/foreground, rotación y recarga para reiniciar.
- Si `dev:lan` (autofirmado) permite la cámara en iOS Safari.

### Decisiones
- Reiniciar el SLAM recarga la página: XR8 no documenta `run()` tras `stop()`.
- Escala `responsive` con la cámara a y=1,4 (≈ metros solo si el teléfono está a ~1,4 m del suelo). Escala `absolute` a evaluar en el Hito 1.
- Sin LandingPage de 8th Wall: la compatibilidad y el fallback los controla el código propio para no bloquear el modo compatible.
- GDD y ART_DIRECTION se redactan en los Hitos 1–2, cuando haya decisiones reales que documentar.

### QA real (misma fecha, commit 3de7941 en GitHub Pages)
- El primer deploy falló porque Pages no estaba activado. El job de build en CI (lint, typecheck, tests y build) pasó.
- **Android (prestado, Chrome 157): puerta PASS.** Deriva casi imperceptible. Tras tapar y destapar la cámara, el cubo **cambia de sitio**: el motor no relocaliza el contenido al mapa anterior, o lo hace mal.
- **iPhone (Safari 27.2): puerta FAIL.** El cubo se desliza al acercarse, deriva lentamente y a veces cambia de escala.
- Faltan los vídeos, los modelos exactos, la iluminación y el tipo de suelo.
- **Estado del Hito 0: PARCIAL.** El SLAM real funciona en ambos (NORMAL en <0,3 s tras el vídeo), pero el anclaje en iPhone no alcanza el nivel que exige el asomo desde el marco.

### Hipótesis sobre la deriva en iPhone (sin verificar)
1. **Profundidad mal estimada del hit-test con un solo `FEATURE_POINT`.** Si el cubo queda a otra profundidad que la superficie real, el paralaje al acercarse lo hace «deslizar». Además, se aceptó un punto a 3,9 u.
2. **Escala `responsive`.** La escala depende de la altura supuesta de la cámara (1,4) y el motor puede reajustarla. Eso encaja con «se hace más pequeño».
3. **Entorno.** Suelo uniforme o brillante, o poca luz. No se anotó.

### Línea base oficial en iPhone (dato del usuario)
- La demo oficial de 8th Wall, que coloca sobre el plano de suelo, **no se encoge ni se descontrola**, pero sigue deslizándose un poco de forma visible. Funciona mejor que HAUNTED Hito 0.
- Conclusión: parte del problema era el método de colocación (un único `FEATURE_POINT`). El deslizamiento residual es el límite del motor en ese iPhone y fija el listón.

### Siguiente
1. Hito 0.1 (estabilización): ver la entrada siguiente.
2. Repetir la QA en el iPhone con vídeo, anotando modelo, luz y suelo.
3. Hito 1 (calibración simplificada, foto virtual manipulable, primer audio espacial) cuando el anclaje en iPhone sea aceptable o el diseño se adapte a sus límites.

---

## 2026-11-09 — Hito 0.1: estabilización del anclaje

### Objetivo
Igualar en iPhone la línea base de la demo oficial (sin encogerse, deslizamiento leve) y tener una regla de recuperación tras perder el tracking.

### Cambios
- **Colocación por variantes** (`src/ar/arOptions.ts`, `src/ar/placement.ts`):
  - `ground` (predeterminada): rayo contra el plano y=0, como la demo oficial.
  - `hit`: el método anterior, para comparar.
  - `plane`: altura robusta a partir de 5 hit-tests más la intersección con ese plano; pensada para mesas.
  - Selección desde la portada o por URL; persiste al recargar.
- **Límite de colocación a 2,5 u**, con retícula roja y aviso «Demasiado lejos».
- **Escala absoluta opcional** (`?scale=absolute`) con el Coaching Overlay oficial (MIT, alojado en el propio sitio).
- **Recuperación:** el objeto se atenúa mientras el tracking no es estable. Al recuperarlo tras una pérdida, se pregunta «¿Sigue en su sitio?» (`shouldAskAnchorCheck`) y la respuesta queda registrada.
- **Instrumentación:** FPS cada 5 s y línea `RESUMEN` al detener (variante, duración, FPS medio y mínimo, pérdidas, colocaciones). Cada colocación registra método, muestras y distancia.
- El rayo de pantalla se calcula a mano desde `projectionMatrix` y `matrixWorld`, sin `Raycaster.setFromCamera`: el camino de suelo nunca se ejecutó en el Hito 0 y XR8 no documenta que mantenga la proyección inversa.
- Menores: `version()` = 0.0.0.0 ya no se muestra como versión; `UNSPECIFIED` documentado y testeado.

### Pendiente de hardware (NO PROBADO)
- Comparativa A–F del README en el iPhone, con vídeo.
- Que el rayo manual coincida con el punto tocado. Si el cubo aparece desplazado respecto al dedo, el fallo está en `rayFromScreen`.
- Comportamiento de la guía de escala absoluta y su interacción con XRExtras.Loading.

### Criterio para cerrar el Hito 0
- La variante predeterminada en iPhone se comporta **como la demo oficial o mejor** (sin encogerse; deriva leve) en el mismo sitio.
- Android sin regresiones.
- La pregunta de recuperación aparece tras tapar y destapar la cámara.
