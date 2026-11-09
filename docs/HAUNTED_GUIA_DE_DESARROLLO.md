# HAUNTED — EXPEDIENTE 01: EL OBSERVADOR
## Guía de producción, herramientas y puesta en marcha · Edición noviembre de 2026

**Qué es este documento.** Una hoja de ruta que puedes leer antes de abrir VS Code. Acompaña al archivo `HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md`, que es la especificación extensa que Claude Code debe ejecutar. No es código terminado ni una garantía de funcionamiento en todos los móviles.

**Objetivo:** un teaser WebAR original de horror e investigación paranormal, **8–10 minutos**, con **una entidad**, disponible en iPhone y Android compatibles desde una URL HTTPS y apto para un stand universitario. El producto debe permitir investigar, coger objetos digitales, escuchar respuestas espaciales, ver al fantasma asomarse desde un punto real calibrado, usar una cámara paranormal y resistir una cacería desplazándose **lentamente y dentro de un área segura**. Se prevé su migración posterior a un motor nativo.

> **Decisión de dirección:** primero lograr un efecto paranormal **realmente anclado a la habitación y estable en los dos teléfonos**; después añadir detalles de terror. No sacrificar jugabilidad por cinco tecnologías experimentales que fallen durante el parcial.

---

# 01 · La experiencia que vamos a fabricar

**Nombre de trabajo:** HAUNTED — Expediente 01: El Observador.  
**Frase de portada:** «No estás solo en la habitación».  
**Género:** investigación paranormal + suspense creciente + supervivencia AR.  
**Formato:** WebAR vertical, una mano sostiene el móvil y la otra puede tocar controles; modo de gestos por cámara opcional.  
**Duración:** 8–10 minutos por partida, más calibración muy breve.  
**Entorno:** habitación, salón u otra zona segura con iluminación suficiente; **nunca** requiere apagar completamente las luces ni correr.

## El minuto a minuto

| Tiempo | Momento | Acciones importantes |
|---|---|---|
| 0:00–1:30 | Inicio y calibración | Aceptar permisos, seleccionar superficie, umbral/mueble, pared y zona segura; apoyo contextual. |
| 1:30–3:00 | Primera pista | Fotografía imposible sobre una mesa; coger, girar, examinar y descubrir inscripción. |
| 3:00–4:20 | Primer «wow» | Voz a un lado y fantasma que asoma por el marco calibrado; se retira al ser observado. |
| 4:20–5:30 | Spirit Box | Preguntar «¿Dónde estás?» por voz opcional o botón; respuesta ligada a una posición válida. |
| 5:30–6:45 | Revelación | Cámara paranormal, marca UV, objeto levitando, tercera evidencia. |
| 6:45–8:45 | Cacería | Avance virtual del fantasma, desplazamientos cortos o modo sin desplazamiento, ritual de tres objetos, jumpscare si falla. |
| 8:45–10:00 | Resolución | Sellar la presencia o perder; fotografía final que recontextualiza el comienzo y reinicio. |

**Regla narrativa:** el fantasma, **El Observador**, teme ser descubierto; observa desde bordes, puertas y muebles, alterna pistas reales y engaños, y emplea sonidos para obligarte a mirar lugares concretos. Un único personaje bien animado vale más que diez criaturas sin personalidad.

## No negociables de diseño

1. **Oclusión calibrada**: en un umbral o mueble elegido manualmente, una malla invisible debe poder tapar parte de la entidad; si la geometría no es estable, la aparición se reescribe visualmente para no atravesar objetos.
2. **Objetos virtuales manipulables**: fotografía, libro/amuleto, herramientas. Tocar para tomar, arrastrar, girar, examinar, dejar y recuperar; mano por visión es experimental, nunca la única interacción.
3. **Audio direccional**: una voz dice algo coherente con dónde está colocado el fantasma. No mentir de forma accidental: si dice «detrás de ti», el motor debe comprobar esa dirección antes.
4. **Cacería con movilidad segura**: girar lentamente y dar uno o dos pasos opcionales en un área delimitada; nunca correr, trepar, agacharse de golpe ni caminar a oscuras.
5. **Jumpscare con causa**: reservado para un fallo jugable o momento dramático, con avisos de contenido, control de intensidad, volumen y alternativa accesible.
6. **Salvavidas de evento**: experiencia jugable sin micrófono y con controles táctiles; modo demostración explícito si el tracking no está disponible, video real de respaldo y reinicio rápido.

---

# 02 · Viabilidad: lo que funciona y lo que no conviene prometer

| Mecánica | WebAR en móvil | Condición o límite real |
|---|---|---|
| Personaje 3D anclado sobre superficie | **Viable** | SLAM compatible, suficiente iluminación y dispositivos reales; probar con 8th Wall Engine Binary. |
| Objetos digitales flotantes y manipulables | **Viable** | Three.js + raycasting + animación; input táctil como base. |
| Manchas y símbolos en una pared | **Viable con calibración** | La pared se indica manualmente; no es pintura real ni detección automática universal. |
| Fantasma que asoma detrás de puerta/mueble | **Viable en zonas calibradas** | Oclusión por geometría aproximada y ángulos limitados; necesita pruebas de deriva. |
| Cualquier silla real que sube físicamente | **No en teaser web generalista** | Requiere segmentar la silla, ocultar el original y reconstruir fondo, sin garantía móvil. |
| Reconocer manos y hacer pinza | **Experimental** | MediaPipe no proporciona por sí solo posición 3D absoluta; móviles y manos pueden quedar fuera de la cámara. |
| Preguntas al fantasma con voz | **Opcional** | Web Speech tiene soporte y procesamiento variables; botones siempre disponibles. |
| Mapeo LiDAR automático desde Safari | **No como API web común** | El LiDAR/ARKit avanzado se aprovecharía mejor en futuro nativo. |
| Persecución física inteligente en cualquier casa | **No aconsejable** | No conocemos obstáculos, suelo y rutas; diseñar amenaza virtual con zonas seguras. |

**8th Wall a noviembre de 2026.** El *framework* abierto es MIT, pero **el seguimiento espacial SLAM está en el `Distributed Engine Binary` bajo otra licencia**, no MIT. El binario no incluye Hand Tracking, VPS ni Maps. Debes incorporar los avisos y revisar la licencia antes de publicar. Los requisitos oficiales incluyen HTTPS, cámara, orientación y WebAssembly SIMD; la documentación cita Safari **iOS 16.4+** y navegadores Android compatibles. No equivale a prometer que funcione en todos los modelos.

**Fuente principal:** [8th Wall — Open Source](https://8thwall.org/docs/open-source) · [Engine overview](https://8thwall.org/docs/engine/overview) · [Requisitos](https://8thwall.org/docs/troubleshooting/browser-requirements) · [Licencia de binario](https://github.com/8thwall/engine/blob/main/LICENSE).

## Plan de contingencia con reglas claras

- **Plan A:** WebAR SLAM, objeto anclado, oclusión parcial calibrada, audio 3D y cámara en vivo.
- **Plan B:** si SLAM falla en cierto móvil, fallback con seguimiento por *image target* o escena sobre cámara, **expresamente identificados**; el juego sigue teniendo evidencias, preguntas, amenaza y final.
- **Plan C de stand:** teléfono validado previamente, iluminación/zonas señalizadas, QR, soporte, audífonos limpiables y video grabado de una partida real; nunca presentar un video como gameplay AR en vivo.

---

# 03 · Herramientas recomendadas, por qué y cuánto cuestan

| Capa | Herramienta | Uso en HAUNTED | Costo/licencia a revisar |
|---|---|---|---|
| Editor | VS Code + Claude Code | Código, refactorización, QA asistido | VS Code gratis; Claude Code requiere acceso de pago o cuenta API con consumo. |
| Frontend | Vite + React + TypeScript | Menú, HUD, opciones, estado UI | Software libre, paquetes con licencia propia. |
| Render 3D | Three.js | glTF, animaciones, raycast, sprites, profundidad | MIT. |
| Tracking AR | 8th Wall Engine Binary | AR espacial SLAM móvil | Uso bajo licencia binaria, no MIT. |
| Gestos opcionales | MediaPipe Tasks Vision | Landmarks y pinza de una mano | Consultar licencias de SDK y modelos. |
| Sonido | Web Audio API | Panner 3D, filtros, capas y ambientes | API del navegador. |
| Modelado | Blender | Crear el Observador, retopología y props | Libre/gratuito. |
| Rig/animación | Adobe Mixamo | Animación humanoide cuando la geometría lo permita | Gratis con Adobe ID; condiciones de reutilización específicas. |
| Optimización | glTF Transform | Comprimir GLB/texturas/meshes | Libre; verificar pipeline y medidas. |
| Test | Vitest + Playwright | Lógica y UI, test automatizado | Libre; AR necesita pruebas reales. |
| Hosting | GitHub Pages | Distribución HTTPS del juego estático | Gratis sujeto a políticas/uso de GitHub. |

**Arquitectura ideal:** motor AR `adapter`, lógica de juego `core` sin dependencias del motor, componentes visuales `presentation`, librería `assets`, y puente de interacción `input`. Esta separación hace menos doloroso reescribir la presentación al migrar a Unity.

---

# 04 · Preparación inicial en Windows 11 (paso a paso)

## Paso 1. Instala y verifica el entorno

1. Instala [Git para Windows](https://git-scm.com/download/win), [Node.js LTS](https://nodejs.org/en) y [Visual Studio Code](https://code.visualstudio.com/).
2. En VS Code instala la extensión oficial **Claude Code** desde el marketplace (busca exactamente ese nombre). Inicia sesión con tu cuenta compatible.
3. Si quieres utilizar comandos `claude` y añadir MCP por terminal, instala además la CLI. La extensión **no** instala por sí sola el comando `claude` en el PATH. En PowerShell, una opción oficial es:

```powershell
winget install Anthropic.ClaudeCode
```

4. Cierra y abre el terminal, luego verifica:

```powershell
git --version
node --version
npm --version
claude --version
```

5. Abre una carpeta de trabajo vacía en VS Code. Inicia Git **antes** de permitir que el asistente realice cambios grandes.

```powershell
mkdir haunted-webar
cd haunted-webar
git init
```

> **Precaución:** Claude Code no es un servicio universalmente gratuito. Revisa qué plan o facturación tienes antes de iniciar sesiones largas. Instalar el editor y sus herramientas gratuitas no implica que la generación con IA cueste cero.

Fuentes: [Claude Code VS Code](https://code.claude.com/docs/en/vs-code) · [Instalación oficial](https://code.claude.com/docs/en/setup).

## Paso 2. Empieza desde una muestra AR oficial, no desde una escena falsa

**Opción recomendada:** examina o clona [8thwall/threejs-world-effects-example](https://github.com/8thwall/threejs-world-effects-example). Está preparada con Three.js, binario AR y despliegue GitHub Pages. Debe tratarse como una muestra técnica, no como producto terminado. Revisa su licencia y dependencias, crea un proyecto propio a partir de una copia adaptada y conserva atribuciones aplicables.

```powershell
# En una carpeta de pruebas, distinta de tu proyecto principal:
git lfs install   # si Git LFS está disponible; instalarlo si el clone lo requiere
git clone https://github.com/8thwall/threejs-world-effects-example.git haunted-ar-spike
cd haunted-ar-spike
git lfs pull
npm install
```

Abre su README y ejecuta el comando de desarrollo **que indique la versión descargada** (en la documentación consultada aparece `npm run serve`). Comprueba que el ejemplo realmente enciende la cámara y fija una malla a una superficie en el teléfono. La carpeta principal `haunted-webar` se convierte en el proyecto definitivo solo después de esa validación.

**No debes intentar copiar un script binario y afirmar que ya existe SLAM:** primero ejecuta un ejemplo real en tu iPhone y en un Android. Haz un video corto del cubo anclado y una nota sobre errores.

## Paso 3. Cómo abrirlo en tu teléfono durante el desarrollo

- La cámara requiere **HTTPS** en una URL pública o contexto seguro admitido por el navegador; `localhost` del PC solo cuenta para el propio equipo, no para el iPhone.
- Vía simple: sube un prototipo de prueba a GitHub Pages y abre el enlace en Safari y Chrome Android. Ajusta `base` de Vite a `/nombre-del-repositorio/` si usas una URL de repositorio.
- Alternativa de iteración: túnel HTTPS confiable, verificando políticas/limitaciones del proveedor. No pongas tokens ni archivos privados en rutas públicas.
- Verifica permisos, superficie detectada, estabilidad al mover 30–60 cm, iluminación baja, recarga de página, orientación y pérdida de señal.

Guía técnica: [Vite — GitHub Pages](https://vite.dev/guide/static-deploy) · [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Paso 4. Crear el repositorio y despliegue

1. Abre un repositorio `haunted-webar` en GitHub, preferiblemente privado mientras trabajas; GitHub Pages publica el sitio visible para visitantes aunque el repositorio pueda ser privado según tu plan.
2. Configura un flujo de GitHub Actions para hacer `npm ci`, `npm run build` y desplegar **solo `dist/`**, siguiendo la guía de Vite.
3. Revisa los avisos de licencias y la página de créditos.
4. Prueba el enlace real **en ambos dispositivos** antes de imprimir un QR.
5. Usa etiquetas Git para guardar versiones estables: `v0.1-tracking`, `v0.2-interaction`, `v0.3-teaser`.

---

# 05 · Cómo darle el prompt a Claude Code sin desperdiciar contexto

**NO pegues 40 páginas de instrucciones en cada turno.** Guarda `HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md` dentro de `docs/` del repositorio; crea un `CLAUDE.md` breve que apunte al archivo. Anthropic aconseja usar instrucciones concretas, mantener `CLAUDE.md` corto y ejecutar comprobaciones reales.

## Inicio de la primera sesión

Dentro de la carpeta del proyecto, abre la extensión Claude Code o ejecuta `claude` en la terminal integrada. Envía este mensaje inicial (o usa el archivo `INICIO_PARA_CLAUDE.txt` del kit):

> Lee `docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md` y `CLAUDE.md` de principio a fin. No empieces por el juego completo. Examina el repositorio, herramientas disponibles, licencias y compatibilidad. Quiero que ejecutes el **Hito 0**: una prueba real de tracking WebAR con un objeto 3D anclado, un dispositivo soportado y un fallback honesto. Entrega un plan concreto con P0/P1/P2, luego implementa, ejecuta los comandos de prueba y registra qué requiere un móvil real. No declares compatibilidad sin evidencia ni crees una interfaz que solo simule AR.

## Ritual recomendado por cada sesión

1. Pide a Claude un **plan corto** del siguiente hito, archivos afectados y riesgos.
2. Exige un **resultado que pueda probarse** al final de esa sesión, no 30 carpetas vacías.
3. Antes de aceptar los cambios, mira el diff de Git, verifica qué archivos fueron creados y ejecuta los comandos reportados.
4. Graba en `docs/IMPLEMENTATION_LOG.md` el estado: logrado, parcial, bloqueado, próximo.
5. Haz commit del hito estable antes de avanzar.

Comandos deseados, una vez configurado `package.json`:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

Esos scripts **deben definirse realmente**; si no existen, Claude primero debe crearlos o explicar cuál se usa. Un `npm run build` correcto no demuestra que la cámara, el SLAM o el sonido funcionen en iPhone.

---

# 06 · Plugins, MCP y skills de Claude Code que sí aportan

**Distingue tres conceptos:** la extensión **Claude Code** se instala en VS Code; un **plugin de Claude Code** agrupa recursos para Claude; un **servidor MCP** conecta herramientas; un **skill** es un procedimiento especializado que Claude puede invocar. No son intercambiables.

## Mi paquete mínimo recomendado

| Prioridad | Extensión / herramienta | Valor real | Instalación |
|---|---|---|---|
| Esencial | Claude Code VS Code | Agente de programación integrado y diffs | Buscar «Claude Code» en extensiones de VS Code. |
| Muy útil | Context7 | Documentación reciente de librerías, menos APIs inventadas | Plugin oficial comunitario con instrucciones abajo. |
| Muy útil | Playwright MCP | Navegar y verificar la UI y flujos del sitio | CLI de Claude tras instalar Node. |
| Opcional | Chrome DevTools MCP | Inspeccionar consola, red y rendimiento web | Añadir si necesitas perf y diagnósticos. |
| Esencial | Skills locales del proyecto | Revisar AR, horror y QA bajo criterios específicos | Incluidos en el kit `starter_claude`. |

### Context7 (plugin o MCP)

En una sesión **dentro de Claude Code** (no en PowerShell), instala el plugin listado en el directorio oficial de Anthropic:

```text
/plugin install context7@claude-plugins-official
```

Si no aparece el marketplace, usa `/plugin` y la sección Discover; no fuerces una instalación descargada de un repositorio desconocido. Reinicia Claude, ejecuta `/mcp` y comprueba que Context7 realmente se conecte. Context7 consulta documentación en línea; **requiere conexión**. Fuente: [Directorio oficial de plugins](https://github.com/anthropics/claude-plugins-official) · [Plugin Context7](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/context7).

### Playwright MCP

Desde PowerShell, después de instalar **la CLI** de Claude Code:

```powershell
claude mcp add playwright npx @playwright/mcp@latest
```

Sirve para probar menús, fallbacks, flujos de permiso, botones y capturas del sitio, pero **no sustituye** una prueba AR física. Fuente: [Playwright MCP](https://github.com/microsoft/playwright-mcp).

### Chrome DevTools MCP (opcional)

```powershell
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

Verifica sintaxis en su [guía de configuración](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/client-configurations.md); sus requisitos pueden cambiar. Si ya estás usando Playwright y necesitas ahorrar contexto, instala Chrome DevTools después del primer prototipo.

### Tres skills locales listos para usar

En el kit adicional se incluyen estos archivos, que debes copiar dentro del repositorio:

```text
.claude/skills/webar-quality-gate/SKILL.md
.claude/skills/horror-beat-review/SKILL.md
.claude/skills/mobile-ar-qa/SKILL.md
```

- **webar-quality-gate:** obliga a distinguir tracking real, fallback, pérdida de seguimiento, montaje SLAM y pruebas en hardware.
- **horror-beat-review:** revisa ritmo, señales, pruebas, jumpscares y coherencia narrativa sin tener que programar otro fantasma.
- **mobile-ar-qa:** genera la matriz de pruebas iOS/Android, accesibilidad y degradaciones de rendimiento.

Los skills del proyecto son simplemente archivos Markdown con instrucciones en `.claude/skills/.../SKILL.md`, y puedes versionarlos en Git. [Documentación oficial de skills](https://code.claude.com/docs/en/skills).

> **Consejo de rendimiento:** no instales diez MCP a la vez. Cada herramienta extra consume contexto y puede distraer al agente. Playwright + Context7 + tus skills locales son suficientes para iniciar.

---

# 07 · Recursos gratuitos de alta calidad: modelos, animaciones, audio

La calidad visual premium no exige miles de objetos. Para este teaser, asigna tiempo a **una figura humana original con animaciones creíbles**, cuatro props muy cuidados, texturas físicas, audio de dirección y efectos de partículas.

## Modelos 3D y escenarios

| Fuente | Qué conseguir | Recomendación |
|---|---|---|
| [Poly Haven](https://polyhaven.com/) | Texturas PBR, props realistas, HDRI | Ideal para materiales, mesas, paredes y superficies. Catálogo general CC0; verificar ficha individual. |
| [Kenney](https://kenney.nl/assets) | Objetos modulares, muebles, pequeños elementos | CC0, excelente para prototipos y colisiones; puede requerir retexturizado para estilo realista. |
| [Quaternius](https://quaternius.com/) | Personajes y kits 3D estilo low-poly | Referencia y prototipado, no confundir con un fantasma final fotorrealista. |
| [Sketchfab](https://sketchfab.com/) | Props de terror, libros, marcos y personajes | Filtra por downloadable y revisa **licencia específica de cada modelo**; varios exigen atribución. |
| [Blender](https://www.blender.org/) | Tu modelo fantasma original, rig y exportación GLB | Mejor para una silueta distintiva y visualmente premium. |
| [Mixamo](https://www.mixamo.com/) | Animación de caminata, reacción, gestos y movimiento | Gratis con Adobe ID; comprueba FAQ y adapta animación para observar y retirarse. |

**Propuesta artística:** toma un humanoide original, alarga visualmente la silueta con discreción, baja contraste del rostro, mantén ojos reflectantes mínimos y anima una inclinación de cabeza. Evita ropa genérica flotando sin rig, iluminación uniforme o el cliché de «silueta negra recortada». Es el comportamiento, no solo el modelo, lo que causa miedo.

**Animaciones necesarias para El Observador:** `idle_watch`, `peek_out`, `retreat`, `stalk_walk`, `hunt_attack`. Produce y revisa también variaciones de respiración/cabeza. Rig > exportación FBX > Blender > GLB. Verificar que `AnimationMixer` pueda reproducirlas.

**Uso de assets en el futuro nativo:** descarga los archivos fuente **legalmente permitidos** (BLEND/FBX/GLB/texturas), guarda URL, autor, versión, licencia y fecha en `ASSET_LICENSES.md`. No descargues modelos copiados de juegos comerciales.

## Sonido: el 50 % del terror

| Fuente | Uso | Atención |
|---|---|---|
| [Freesound](https://freesound.org/) | Golpes, pasos, susurros, crujidos | Preferir CC0; CC BY requiere crédito; evita archivos con licencia incompatible. |
| [Sonniss GDC Bundle](https://gdc.sonniss.com/) | SFX de alta calidad | Gratuito según el paquete, con **licencia propia**, no asumir CC0. |
| [Kenney Audio](https://kenney.nl/assets?q=audio) | UI, capas, clicks y prototipos | Verificar licencia de cada pack. |
| Grabación propia | Respiraciones, golpes en mueble, voz de la entidad | Mucha identidad; no revelar datos de la habitación ni de otras personas. |

**Diseño de mezcla:** capa base casi silenciosa + detalle direccional + crescendo + golpe controlado. Emplea compresor/limitador en Web Audio para que un jumpscare no suene brutalmente más alto. Subtítulos y sliders individuales para voces, ambiente y sustos.

## Optimización de modelos para móviles

- Exporta runtime en **GLB/glTF**; no cargar archivos FBX gigantes en producción.
- Prueba `gltf-transform` para simplificación y compresión solo después de conservar un master de alta calidad.
- Empieza con texturas 1K en props, 2K solo si un primer plano lo requiere; no existe un número mágico válido para todos los teléfonos.
- Prioriza **30 FPS sostenidos** sobre bloom complejo; perfila móvil real. Tamaño de descarga inicial indicativo: tratar de mantenerlo por debajo de 20 MB, sujeto a mediciones, no promesa.
- Para disimular la unión entre prop virtual y mesa real, crea una sombra de contacto suave y un sonido físico coherente con la interacción.

Fuentes: [Licencia Poly Haven](https://polyhaven.com/license) · [Adobe Mixamo FAQ](https://helpx.adobe.com/co/creative-cloud/faq/mixamo-faq.html) · [glTF Transform](https://gltf-transform.dev/cli).

---

# 08 · Hitos de producción y entregables para mostrar al profesor

**Hito 0 — Base AR (riesgo máximo).** Web + cámara en HTTPS + cubo real anclado en un iPhone y un Android. Si esto no funciona, no pasar a producir modelos de terror. Entregable: enlace, breve grabación real, lista de compatibilidad y problemas.

**Hito 1 — Interacción.** Calibración, foto virtual y acción de agarrar/girar/examinar/devolver; interacción táctil estable. Entregable: evidencia de que el objeto no salta al perder tracking.

**Hito 2 — El momento memorable.** Modelo de El Observador, asomarse desde un marco semicalibrado, audio localizado y un objeto levitando. Entregable: video real en el que se aprecia que el fantasma se oculta parcialmente tras el marco y se retira al mirarlo.

**Hito 3 — Investigación.** Tres evidencias con lógica; Spirit Box táctil/voz opcional; herramienta de cámara paranormal; threat director y ayudas para el jugador. Entregable: un tester externo completa investigación sin que le expliquen cada botón.

**Hito 4 — Cacería y cierre.** Amenaza controlada, movimientos lentos dentro de zona, ritual con objetos, victoria/fracaso, jumpscare regulable, pausa y modo sin desplazamiento. Entregable: partida jugable completa.

**Hito 5 — Pulido.** Performance real, optimización de assets, subtítulos, credits, telemetría local, QR, video de respaldo y página de presentación del juego. Entregable: demo de 8–10 min reproducible en el stand.

## Pruebas de aceptación (no dar por aprobado con un build)

- [ ] iPhone real, Safari: cámaras, SLAM, ancla, UI y final probados.
- [ ] Android real, Chrome: lo mismo, con modelo y versión registrados.
- [ ] Permisos denegados: mensaje y opción de salida/fallback funcional.
- [ ] Recalibración por pérdida de tracking; peligro pausado de inmediato.
- [ ] Un fantasma se asoma desde una **zona real calibrada**, no un sprite pegado a la pantalla.
- [ ] Dos objetos se pueden coger y examinar, y uno levita.
- [ ] Tres evidencias se pueden encontrar realmente, no solamente listarse.
- [ ] Voz opcional y Spirit Box con preguntas por botón como respaldo.
- [ ] Audio espacial y subtítulos; ninguna respuesta espacial contradictoria.
- [ ] Cacería terminable sin correr ni cruzar obstáculos.
- [ ] Victoria, derrota, jumpscare, reinicio y botón de salida.
- [ ] Créditos y avisos legales; sin assets ni sonidos pirateados.
- [ ] Registro honesto de rendimiento, compatibilidad y límites.

**Fallo típico a evitar:** que Claude Code produzca pantallas visualmente perfectas con una cámara simulada y que el primer iPhone muestre una pantalla negra. La validación AR en hardware debe ocurrir en el primer hito.

---

# 09 · Preparar una demostración universitaria memorable

**Estación recomendada:** superficie despejada de aprox. 2 x 2 m (ajustar a recinto real), buena luz ambiental incluso cuando el juego simule oscuridad, zona de seguridad marcada en el suelo, móvil con batería/powerbank, una persona operadora y audífonos. Sin gafas VR de celular en la primera exposición: reducen la visibilidad real y empeoran el control sin tracking de manos nativo.

**Antes de abrir al público:**

1. Abre la URL definitiva en ambos teléfonos y verifica certificados, permisos y carga de modelos.
2. Limpia la memoria del navegador si hay versiones antiguas; no dependas de que el juego sea offline.
3. Marca dos puntos concretos del stand donde conviene que el fantasma aparezca; crea un escenario de calibración repetible.
4. Prueba el audio del lugar; evita volumen que asuste físicamente o moleste a vecinos.
5. Crea un QR grande, un aviso «Experiencia de terror con sustos», instrucciones de 3 pasos y tiempo estimado.
6. Ten listo un video de **una partida real**, no un render manipulado, para mostrar la mecánica si un dispositivo falla.

**Pitch de 20 segundos:** «HAUNTED transforma la habitación real en un escenario de investigación paranormal. Una entidad te observa desde lugares que tú mismo calibras, responde a tus preguntas y, si demoras en reunir evidencias, empieza a cazarte. Puedes manipular objetos, usar instrumentos y sobrevivir sin correr».

**Qué suele convencer a un jurado:** un momento inesperado que depende del espacio físico, interacción evidente con la cámara, un ciclo completo de 8 minutos, sonido y dirección artística coherentes, y la honestidad de demostrar tanto funcionamiento como límites técnicos.

---

# 10 · Migración futura a un videojuego nativo

**Viabilidad general: ALTA para reconstruir la experiencia; NO es una conversión de un clic.** Unity + AR Foundation es la ruta más directa para compartir un proyecto entre Android (ARCore) e iOS (ARKit). La versión nativa puede aprovechar mejor profundidad, clasificación y reconstrucción espacial en dispositivos compatibles.

## Lo que podrás reutilizar

- **Mucho:** diseño del juego, escenas narrativas, flujo de amenazas, pistas, puzzle, dramaturgia, lista de assets, GLB/FBX, materiales fuente y sonidos.
- **Parcialmente:** reglas en TypeScript reimplementadas en C#, parámetros numéricos, estructuras JSON, tablas de respuestas, máquina de estados, pruebas funcionales como especificación.
- **Poco o nada directamente:** código React, Three.js renderer, hooks de navegador, Web Audio y la integración 8th Wall SLAM. Habrá que reescribir adaptadores y render.

**Recomendación práctica:** mantener lógica de `threat`, guion, datos de evidencias y diálogos en JSON bien tipado/validado y sin dependencias de Three.js. Dejar GLB originales y archivos de animación editables para importarlos a Unity. Documentar valores y coordenas para evitar divergencias.

## Lo que ganas al migrar

- AR Foundation unifica subsistemas ARCore/ARKit y facilita detección de planos, raycasts y anclajes.
- En iPhone compatibles con LiDAR, ARKit puede proporcionar una malla aproximada del entorno para oclusión realista, si el dispositivo lo soporta.
- Oportunidad de interacción con objetos y audio más robustos, según plugins y capacidades reales.
- Más control sobre sensores, renderizado, escena 3D y empaquetado.

## Lo que te costará

- Migrar shaders/animaciones, adaptar interfaz móvil, reescribir lógica de AR y pruebas.
- La compilación nativa de iOS **requiere macOS + Xcode localmente**; sin Mac puedes explorar **Unity Build Automation** en la nube, sujeto a precio, configuración y firma de Apple. No presupongas que la distribución iOS será $0.
- Para publicar en App Store, tendrás que revisar el Apple Developer Program; es diferente a probar un prototipo en tu móvil.
- Android requiere confirmar compatibilidad ARCore por modelo, no solo Android moderno.

**Primer objetivo nativo razonable:** portar *un solo cuarto y El Observador*, pero reemplazando máscaras manuales por oclusión basada en geometría cuando exista LiDAR. Es la mejora visual que más justifica salir del navegador.

Fuentes: [Unity AR Foundation Samples](https://github.com/Unity-Technologies/arfoundation-samples) · [ARKit Scene Reconstruction](https://developer.apple.com/documentation/arkit/arworldtrackingconfiguration/scenereconstruction) · [Unity iOS build](https://docs.unity.com/en-us/engine/7000.0/manual/platform-specific/iphone/ios-building-and-delivering/build-process) · [Unity Personal](https://unity.com/pages/license-compliance).

---

# 11 · Tu orden de trabajo, resumida para comenzar hoy

1. **Descarga los archivos entregados:** prompt maestro `.md`, esta guía y el kit de skills.
2. **Instala Git, Node LTS, VS Code y Claude Code**; verifica terminal, sesión y acceso.
3. **Prueba el starter oficial 8th Wall** en iPhone y Android; mide el tracking.
4. **Crea tu repositorio definitivo** y copia `docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md`, `CLAUDE.md`, `.claude/skills/`.
5. **Dale a Claude solo el Hito 0** con el mensaje de inicio de esta guía.
6. **No pases al arte hasta conseguir una escena anclada fiable** y el primer objeto interactivo.
7. **Construye el único susto premium:** asomo parcial desde marco + voz localizada + objeto levitando.
8. **Incorpora investigación, ritual y cacería**; obliga a validar la partida completa en 8–10 minutos.
9. **Haz pruebas con jugadores externos y prepara modo stand** con iluminación, zona segura, QR y reinicio.
10. **Congela una versión estable** antes del parcial; después podrás iterar hacia la versión nativa.

## Referencias esenciales y repositorios

- [Ejemplo oficial 8th Wall + Three.js + GitHub Pages](https://github.com/8thwall/threejs-world-effects-example)
- [8th Wall Engine Docs](https://8thwall.org/docs/engine/overview) · [licencia](https://github.com/8thwall/engine/blob/main/LICENSE) · [navegadores](https://8thwall.org/docs/troubleshooting/browser-requirements)
- [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) · [glTF Transform](https://gltf-transform.dev/cli)
- [Claude Code Quickstart](https://code.claude.com/docs/en/quickstart) · [VS Code](https://code.claude.com/docs/en/vs-code) · [Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Skills](https://code.claude.com/docs/en/skills) · [Plugins](https://code.claude.com/docs/en/plugins)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) · [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) · [Context7](https://github.com/upstash/context7)
- [Poly Haven](https://polyhaven.com/) · [Kenney](https://kenney.nl/assets) · [Mixamo](https://www.mixamo.com/) · [Blender](https://www.blender.org/)
- [Unity AR Foundation Samples](https://github.com/Unity-Technologies/arfoundation-samples) · [Unity Build iOS](https://docs.unity.com/en-us/engine/7000.0/manual/platform-specific/iphone/ios-building-and-delivering/build-process)

**Nota de auditoría:** referencias públicas consultadas el **9 de noviembre de 2026**. Revisa licencias y compatibilidad de versiones instaladas justo antes de desarrollar. El resultado premium dependerá de assets, testing y decisiones técnicas, no solo de la longitud de un prompt.
