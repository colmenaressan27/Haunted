# Matriz QA en dispositivos — HAUNTED

Estados: `PASS` · `FAIL` · `NO PROBADO` · `N/A`. **Nunca** marcar PASS algo probado solo en escritorio.
Evidencia: vídeo corto grabado con el propio teléfono + texto de «Copiar registro para QA» (botón Registro del HUD).
Versión CSV para hoja de cálculo: `QA_DEVICE_MATRIX_TEMPLATE.csv`.

## Hito 0 — tracking y fallback

### Línea base (antes de probar nuestro build)

Abrir la demo oficial https://8thwall.org/threejs-world-effects-example/ en cada teléfono. Si allí el cubo no queda anclado, el problema es motor/dispositivo, no nuestro código.

| Dispositivo | SO | Navegador | Demo oficial ancla cubo | Notas |
|---|---|---|---|---|
| iPhone 13 Pro Max | pendiente | Safari pendiente | NO PROBADO | |
| Android (modelo pendiente) | pendiente | Chrome pendiente | NO PROBADO | |

### Build HAUNTED Hito 0

Dispositivos de la sesión del 2026-11-09:
- **iPhone**: Safari 27.2 (el usuario indica iOS 27.2). El UA congela el SO en `iPhone OS 18_7`, así que no sirve para saber la versión. Modelo por confirmar.
- **Android prestado**: Chrome 157. El UA reducido de Chrome (`Android 10; K`) oculta la versión real y el modelo; hay que anotarlos desde Ajustes → Acerca del teléfono.

| # | Caso | Pasos | iPhone / Safari 27.2 | Android (prestado) / Chrome 157 | Windows 11 / Chrome (solo UI) |
|---|---|---|---|---|---|
| 1 | Carga por HTTPS | Abrir URL de Pages (o LAN https) | PASS (GitHub Pages) | PASS (GitHub Pages) | NO PROBADO |
| 2 | Requisitos detectados | Desplegar «Requisitos detectados»; anotar fallos | PASS (SLAM ofrecido) | PASS (SLAM ofrecido) | NO PROBADO (esperado: SLAM no disponible) |
| 3 | Permisos cámara + movimiento aceptados | «Iniciar AR» → aceptar | PASS (movimiento `granted`; vídeo 1,0 s tras el toque) | PASS (vídeo 1,4 s tras el toque) | N/A |
| 4 | Permiso cámara denegado | Denegar → mensaje claro + opción compatible / volver, sin pantalla negra | NO PROBADO | NO PROBADO | NO PROBADO (modo compatible) |
| 5 | Permiso movimiento denegado (iOS) | Denegar diálogo de movimiento → mensaje y salida | NO PROBADO | N/A | N/A |
| 6 | Tracking inicializa | Estado pasa a «Seguimiento estable» moviendo despacio | PASS (NORMAL 0,1 s después del vídeo) | PASS (NORMAL 0,2 s después del vídeo) | N/A |
| 7 | Colocar cubo en suelo | Tocar suelo; método mostrado (hit-test / suelo y=0) | PASS (hit-test FEATURE_POINT, y≈0,03) | PASS (hit-test FEATURE_POINT, y≈0,00) | N/A |
| 8 | Colocar cubo en mesa | Tocar mesa; ¿queda sobre la mesa o cae al plano y=0? | NO PROBADO | NO PROBADO | N/A |
| 9 | **Puerta del hito: estabilidad** | Moverse despacio 30–60 cm y rodear medio cubo; ¿se queda en su sitio? Grabar vídeo | **FAIL**: a veces quieto, pero se desliza al acercarse, deriva lenta con el tiempo y a veces cambia de escala (se ve más pequeño). Sin vídeo registrado | **PASS** (deriva casi imperceptible). Falta vídeo | N/A |
| 10 | Pérdida de tracking | Tapar cámara 2 s → aviso «limitado» y contador de pérdidas; destapar → ¿recupera y el cubo vuelve a su sitio? | Detección PASS (LIMITED 3,4 s → NORMAL). Posición tras recuperar: no reportada | Detección PASS (2 pérdidas). **Posición FAIL: el cubo cambia de sitio tras destapar** | N/A |
| 11 | Baja luz | Repetir #9 con luz tenue (no oscuridad) | NO PROBADO | NO PROBADO | N/A |
| 12 | Recentrar | Botón Recentrar; anotar comportamiento | Usado (después se recolocó el cubo); sin observaciones | Usado; sin observaciones | N/A |
| 13 | Background/foreground | Cambiar de app 5 s y volver | NO PROBADO | NO PROBADO | N/A |
| 14 | Rotación | Girar a horizontal y volver | NO PROBADO | NO PROBADO | N/A |
| 15 | Detener cámara | Botón → indicador de cámara del SO se apaga | NO PROBADO | NO PROBADO | NO PROBADO |
| 16 | Reinicio | Tras detener, «Reiniciar AR» recarga y vuelve a funcionar | NO PROBADO | NO PROBADO | N/A |
| 17 | Modo compatible | Botón compatible → vídeo + cubo con rótulo «SIN anclaje espacial» | NO PROBADO | NO PROBADO | NO PROBADO |
| 18 | FPS | Anotar FPS del HUD con cubo visible (30 s) | NO PROBADO (percepción: peor que Android) | NO PROBADO (percepción: fluido) | NO PROBADO |
| 19 | Tiempo de carga | Desde abrir URL hasta cámara activa, Wi-Fi | ~3 s hasta pulsar + 1,0 s hasta vídeo (desde el registro) | ~1,3 s + 1,4 s | N/A |
| 20 | Navegador de app | Abrir el enlace desde WhatsApp/Instagram → aviso | NO PROBADO | NO PROBADO | N/A |

Observaciones del motor (confirmadas en ambos dispositivos):
- `reality.trackingstatus.reason` llega como `UNSPECIFIED`, no como `UNDEFINED`.
- `XR8.version()` devuelve `0.0.0.0` con el binario 1.0.0 de npm. La versión fiable es la del paquete.
- Un hit-test `FEATURE_POINT` aceptó un punto a 3,9 u de distancia (colocación #2 en iPhone). Los puntos lejanos son candidatos a mala estimación de profundidad.

### Registro de sesiones

| Fecha | Dispositivo + SO + navegador (versiones) | URL | Iluminación | Resultado general | Evidencia / bugs |
|---|---|---|---|---|---|
| 2026-11-09 | — | — | — | Sin pruebas en hardware todavía | Solo verificaciones automáticas en PC (lint/typecheck/test/build) |
| 2026-11-09 | iPhone (modelo por confirmar), Safari 27.2 | https://colmenaressan27.github.io/Haunted/ (commit 3de7941) | no anotada | **Puerta FAIL**: deslizamiento al acercarse, deriva lenta, cambios de escala ocasionales | Registro QA pegado en el chat; sin vídeo |
| 2026-11-09 | Android prestado (modelo/versión por confirmar), Chrome 157 | ídem | no anotada | **Puerta PASS**; el cubo se desplaza tras perder y recuperar el tracking | Registro QA pegado en el chat; sin vídeo |
| 2026-11-09 | iPhone, Safari 27.2 — Hito 0.1, variante B (suelo estimado · relativa · 15 cm) | ídem (build Hito 0.1) | interior, luz cálida suficiente | **Mejora clara respecto al Hito 0**: estable la mayor parte de los 30 s. **Salto al final** tras un barrido rápido con desenfoque: distancia de 1,79 → 2,62 → 3,27 u sin que el motor reporte pérdida («Pérdidas 0», «Seguimiento estable» todo el tiempo). FPS en el HUD 12–26 (≈22 de media) **con grabación de pantalla activa**. Superficie: **cama** (manta con pliegues, textura acanalada repetitiva, deformable) → no representativa del suelo del juego | `qa-evidence/test1.mp4` (local, fuera de git); análisis fotograma a fotograma en el chat |
| 2026-11-09 | iPhone, Safari 27.2 — Hito 0.1, variante B, **sin grabar pantalla** | ídem | mesa con objetos alrededor | **Puerta PASS**: estable; deslizamiento leve solo con movimientos bruscos. **FPS media 56** (60 sostenidos al inicio; baja a ~50 hacia los 2 min). 3 pérdidas; tras la de 88 s el jugador confirma que el cubo **siguió en su sitio** (relocalización correcta en iPhone). 8 colocaciones a 1,26–2,25 u, todas en y=0 sobre la mesa. Anomalía: la cámara se pidió 3 veces al arrancar (2,8 s → 5,3 s), sin diagnosticar | Registro QA pegado en el chat (126 s) |

## Hito 1a — calibración y Evidencia 1

| # | Caso | iPhone / Safari | Android / Chrome |
|---|---|---|---|
| 1 | Paso suelo: anillo visible y «Continuar» habilitado solo con tracking estable | NO PROBADO | NO PROBADO |
| 2 | Zona segura marcada a 1–2 pasos (círculo azul verdoso en su sitio) | NO PROBADO | NO PROBADO |
| 3 | Zona segura demasiado lejos → mensaje claro, no avanza | NO PROBADO | NO PROBADO |
| 4 | Mesa marcada: anillo ámbar **sobre** la superficie (no en el suelo) | NO PROBADO | NO PROBADO |
| 5 | Apuntar al suelo en el paso mesa → «Eso parece el suelo» | NO PROBADO | NO PROBADO |
| 6 | «No tengo mesa» → foto en el suelo entre zona segura y umbral | NO PROBADO | NO PROBADO |
| 7 | Umbral marcado: marco rojo orientado hacia el jugador; rechazado si está pegado a la zona segura | NO PROBADO | NO PROBADO |
| 8 | Foto aparece apoyada en la mesa (no flota ni se hunde de forma notable) | NO PROBADO | NO PROBADO |
| 9 | Tocar la foto la coge (también desde 1–1,5 m) | NO PROBADO | NO PROBADO |
| 10 | Examinar: arrastrar gira, «Dar la vuelta» muestra el reverso, inscripción legible o subtítulo | NO PROBADO | NO PROBADO |
| 11 | Soltar en la mesa y en el suelo; «Soltar aquí» deshabilitado si no hay destino | NO PROBADO | NO PROBADO |
| 12 | «Recuperar fotografía» la trae a la mano sin caminar | NO PROBADO | NO PROBADO |
| 13 | Tapar 2 s: atenuado + pregunta al recuperar; «Sigue igual» restaura | NO PROBADO | NO PROBADO |
| 14 | «Se movió» → recalibración desde el paso 1; la foto queda en la mano (no se pierde) | NO PROBADO | NO PROBADO |
| 15 | Movimiento brusco → `SALTO de pose` en el registro + pregunta (si hay contenido) | NO PROBADO | NO PROBADO |
| 16 | Sin falsos `SALTO` con movimientos lentos durante 2 min (anotar el pico de movimiento) | NO PROBADO | NO PROBADO |
| 17 | FPS medio con foto en la mano y en examen (línea `RESUMEN`) | NO PROBADO | NO PROBADO |
| 18 | Prueba de anclaje (cubo) sigue funcionando desde Herramientas de QA | NO PROBADO | NO PROBADO |
