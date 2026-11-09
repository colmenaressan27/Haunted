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

### Siguiente
1. El usuario crea el repo de GitHub y activa Pages; push (con confirmación).
2. QA real en los dos teléfonos (línea base + protocolo del README) y registro en la matriz.
3. Solo si la puerta pasa: Hito 1 (calibración simplificada, foto virtual manipulable, primer audio espacial).
