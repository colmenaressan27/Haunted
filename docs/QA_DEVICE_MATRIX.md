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

| # | Caso | Pasos | iPhone 13 Pro Max / Safari | Android / Chrome | Windows 11 / Chrome (solo UI) |
|---|---|---|---|---|---|
| 1 | Carga por HTTPS | Abrir URL de Pages (o LAN https) | NO PROBADO | NO PROBADO | NO PROBADO |
| 2 | Requisitos detectados | Desplegar «Requisitos detectados»; anotar fallos | NO PROBADO | NO PROBADO | NO PROBADO (esperado: SLAM no disponible) |
| 3 | Permisos cámara + movimiento aceptados | «Iniciar AR» → aceptar | NO PROBADO | NO PROBADO | N/A |
| 4 | Permiso cámara denegado | Denegar → mensaje claro + opción compatible / volver, sin pantalla negra | NO PROBADO | NO PROBADO | NO PROBADO (modo compatible) |
| 5 | Permiso movimiento denegado (iOS) | Denegar diálogo de movimiento → mensaje y salida | NO PROBADO | N/A | N/A |
| 6 | Tracking inicializa | Estado pasa a «Seguimiento estable» moviendo despacio | NO PROBADO | NO PROBADO | N/A |
| 7 | Colocar cubo en suelo | Tocar suelo; método mostrado (hit-test / suelo y=0) | NO PROBADO | NO PROBADO | N/A |
| 8 | Colocar cubo en mesa | Tocar mesa; ¿queda sobre la mesa o cae al plano y=0? | NO PROBADO | NO PROBADO | N/A |
| 9 | **Puerta del hito: estabilidad** | Moverse despacio 30–60 cm y rodear medio cubo; ¿se queda en su sitio? Grabar vídeo | NO PROBADO | NO PROBADO | N/A |
| 10 | Pérdida de tracking | Tapar cámara 2 s → aviso «limitado» y contador de pérdidas; destapar → ¿recupera y el cubo vuelve a su sitio? | NO PROBADO | NO PROBADO | N/A |
| 11 | Baja luz | Repetir #9 con luz tenue (no oscuridad) | NO PROBADO | NO PROBADO | N/A |
| 12 | Recentrar | Botón Recentrar; anotar comportamiento | NO PROBADO | NO PROBADO | N/A |
| 13 | Background/foreground | Cambiar de app 5 s y volver | NO PROBADO | NO PROBADO | N/A |
| 14 | Rotación | Girar a horizontal y volver | NO PROBADO | NO PROBADO | N/A |
| 15 | Detener cámara | Botón → indicador de cámara del SO se apaga | NO PROBADO | NO PROBADO | NO PROBADO |
| 16 | Reinicio | Tras detener, «Reiniciar AR» recarga y vuelve a funcionar | NO PROBADO | NO PROBADO | N/A |
| 17 | Modo compatible | Botón compatible → vídeo + cubo con rótulo «SIN anclaje espacial» | NO PROBADO | NO PROBADO | NO PROBADO |
| 18 | FPS | Anotar FPS del HUD con cubo visible (30 s) | NO PROBADO | NO PROBADO | NO PROBADO |
| 19 | Tiempo de carga | Desde abrir URL hasta cámara activa, Wi-Fi | NO PROBADO | NO PROBADO | N/A |
| 20 | Navegador de app | Abrir el enlace desde WhatsApp/Instagram → aviso | NO PROBADO | NO PROBADO | N/A |

### Registro de sesiones

| Fecha | Dispositivo + SO + navegador (versiones) | URL | Iluminación | Resultado general | Evidencia / bugs |
|---|---|---|---|---|---|
| 2026-11-09 | — | — | — | Sin pruebas en hardware todavía | Solo verificaciones automáticas en PC (lint/typecheck/test/build) |
