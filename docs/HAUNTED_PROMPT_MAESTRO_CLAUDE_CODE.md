# HAUNTED — EXPEDIENTE 01: EL OBSERVADOR
## Prompt maestro para Claude Code | WebAR · iOS/Android · Teaser de 8–10 minutos

**Versión de especificación:** 1.0 — 9 de noviembre de 2026  
**Proyecto:** videojuego de terror paranormal inmersivo, original y no comercial, para un parcial de juego web, portafolio y eventos universitarios.  
**Herramientas de trabajo:** Claude Code en Visual Studio Code, Windows 11, GitHub Pages, dispositivos móviles reales.  
**Estado:** **especificación de producto y encargo de implementación, NO código ya ejecutado ni compatibilidad garantizada.**

> **INSTRUCCIÓN PARA CLAUDE CODE:** Lee este documento completo antes de modificar archivos. Actúa como un equipo senior compuesto por director creativo, game designer especializado en terror, ingeniero WebAR, ingeniero gráfico Three.js, programador TypeScript, diseñador UX móvil, diseñador de sonido y QA de dispositivos. Debes crear un videojuego **real, jugable, verificable y visualmente sobresaliente**, no un mockup, un vídeo pre-renderizado ni una página con botones falsos. Investiga las APIs oficiales de las versiones instaladas; verifica cada integración. No inventes compatibilidad, nombres de métodos ni resultados de pruebas. Si una mecánica no puede garantizarse en Safari/Android, implementa una alternativa honesta y funcional. No declares que el juego funciona en iOS/Android hasta haber documentado pruebas reales o los pasos pendientes para ejecutarlas.

---

# 0. Contrato de entrega y modo de ejecución

1. Inspecciona primero el repositorio y el entorno; **no sobrescribas trabajo existente** ni asumas que está vacío.
2. Produce `docs/GDD.md`, `docs/TECHNICAL_DESIGN.md`, `docs/ART_DIRECTION.md`, `docs/QA_DEVICE_MATRIX.md`, `docs/ASSET_LICENSES.md` y `docs/IMPLEMENTATION_LOG.md`. Mantén `README.md` útil para otro desarrollador.
3. Trabaja con **hitos ejecutables y verificables**: primero prueba la cámara y el tracking; después el primer objeto anclado; posteriormente la interacción, la investigación, el fantasma, la cacería y el acabado audiovisual. No construyas diez sistemas incompletos a la vez.
4. Antes de cada subsistema, consulta documentación oficial vigente, indica la API exacta utilizada, crea una pequeña prueba y registra límites reales. Prioriza las referencias de la sección 19.
5. Selecciona versiones estables y compatibles de paquetes; fija versiones en `package-lock.json`. No uses APIs imaginarias de 8th Wall ni entregues pseudocódigo en lugar de implementaciones funcionales.
6. Ejecuta `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` y, cuando proceda, pruebas E2E. Corrige errores observables; registra honestamente lo que solo puede probarse en un teléfono real.
7. Entrega un videojuego completo de **un solo expediente y una sola entidad**, no un framework gigantesco. Los sistemas deben ser modulares para futura migración a Unity, pero no sacrifiques calidad del teaser por sobreingeniería.
8. No conviertas funciones indispensables en «próximamente». Una escena estática no satisface el encargo. Si aparece una limitación seria, propón un fallback jugable antes de continuar.
9. Mantén el proyecto sin servidores propios, sin cuentas, sin anuncios, sin bases de datos obligatorias y sin dependencias de pago. Claude Code puede requerir una suscripción propia: **no presupongas que la IA cuesta $0**.
10. No uses personajes, escenarios, música ni efectos extraídos de Phasmophobia u otros juegos. Todo debe ser original o tener licencia apropiada para web y para reutilización en un futuro juego nativo.

**Salida final exigida al terminar una iteración:** resumen de cambios, URL local, instrucciones de ejecución, scripts usados, verificación de cada criterio, capturas de la interfaz cuando sea posible, limitaciones pendientes, artefactos faltantes y siguiente acción específica.

---

# 1. Visión, promesa de jugador y pilares

**Título:** HAUNTED — Expediente 01: El Observador.  
**Frase de campaña:** «No estás solo en la habitación».  
**Género:** investigación paranormal + terror psicológico + supervivencia AR.  
**Plataforma inicial:** Safari en iPhone compatible y Chrome en Android compatible, desde un enlace HTTPS y sin instalación.  
**Formato:** móvil vertical como diseño principal; una mano sostiene el teléfono. Opcionalmente ofrecer modo horizontal si el motor y el layout se validan, sin complicar el primer lanzamiento.  
**Duración objetivo:** 8–10 minutos, sin incluir un onboarding lento; permitir abandonar, reiniciar y volver a calibrar.

**Pilares no negociables:**
- **El cuarto es el escenario.** Objetos 3D situados en superficies reales y puntos de interés indicados por el jugador; nunca depender de un mapa doméstico perfecto.
- **La entidad te observa.** Se asoma por una puerta, ventana o mueble marcado; desaparece cuando enfocas; algunas apariciones solo son detectables por instrumentos.
- **La investigación tiene consecuencias.** Hay evidencias que deben descubrirse; el retraso, las decisiones y los errores elevan una amenaza dinámica.
- **La voz y los sonidos son parte del gameplay.** Preguntas al fantasma y respuestas relacionadas con su ubicación y estado, junto con audio espacial aproximado.
- **Los objetos se pueden manipular.** Recoger, acercar, girar, examinar, soltar y usar elementos virtuales; lanzamiento opcional solo cuando sea estable.
- **La cacería te obliga a actuar y desplazarte con cuidado.** No se pide correr, agacharse bruscamente, huir de verdad o caminar hacia lugares peligrosos. El jugador usa pequeñas reubicaciones voluntarias, giro lento de cámara y decisiones tácticas.
- **Una demo premium antes que un simulador genérico.** Una entidad memorable, una dramaturgia clara, pocos objetos extraordinarios, buena animación, sonido trabajado y una interfaz que no rompa la inmersión.

**Fuera de alcance del teaser:** multijugador, mapa automático fiable de toda una vivienda, reconstrucción automática de muebles con LiDAR desde Safari, física real de objetos existentes, guardado en nube, IA generativa en tiempo real, VR estereoscópica para cardboard y ocho fantasmas distintos.

---

# 2. Narrativa: una única entidad original

**Nombre de la entidad:** EL OBSERVADOR. Nombre de expediente: **Sujeto 01**. No copiar diseños, símbolos ni lore de otras franquicias.

**Premisa:** El teléfono detecta una interferencia en la habitación. Una presencia estuvo esperando que alguien la mirara. No es agresiva al principio: observa desde un umbral, deja evidencias y responde con frases aparentemente útiles. Cuando percibe que el investigador empieza a comprenderla, intenta retenerlo en el espacio. Una fotografía revelada al final implica que el Observador estaba presente desde la primera imagen de la partida.

**Diseño visual:** silueta humanoide alta pero proporcionada, extremidades ligeramente desfasadas, cuello inclinado, ropa oscura desgastada con movimiento sutil, cara parcialmente oscurecida, ojos apenas reflectantes; sin sangre constante ni gore gratuito. Silueta inmediatamente reconocible en una puerta o junto a un mueble. Anima microgestos: inclinación, asomar medio rostro, retroceso rápido, espasmo breve, andar arrastrado y ataque final. No hacer una figura negra plana ni copiar un fantasma existente.

**Reglas de comportamiento:**
- Prefiere observar desde puntos calibrados antes que aparecer en medio de la habitación.
- Deja pistas verdaderas durante investigación, pero puede mentir al aumentar la amenaza.
- Responde de modo espacialmente coherente: si dice «detrás de ti», debe haber un estado y una posición válida detrás de la orientación actual del teléfono; si no puede garantizarse, utiliza otra frase.
- Su aparición se relaciona con estados del juego, no con números aleatorios puros. Tiene memoria de la última zona usada para evitar repetirse.
- Puede desaparecer al ser observado; si aparece de forma exclusiva en cámara paranormal, la representación normal no lo muestra.
- En la cacería realiza acercamientos virtuales, rutas cortas entre zonas conocidas y ataques **sin exigir carrera física**.

---

# 3. Guion cronometrado del teaser (8–10 minutos)

El jugador puede invertir más o menos tiempo; el director de ritmo adapta eventos. No conviertas el cronograma en un vídeo ininterrumpible ni en una cuenta regresiva punitiva.

| Tiempo orientativo | Secuencia | Interacción evaluable | Señal audiovisual |
|---|---|---|---|
| 0:00–0:45 | Prólogo y permisos | Elegir audio/jumpscares, iniciar cámara/mic opcional | Interferencia, voz de sistema diegético |
| 0:45–1:40 | Calibración | Registrar ancla estable, zona puerta/mueble y zona de pared; comprobar límites | Retícula, barras de seguimiento |
| 1:40–3:00 | Primera evidencia | Encontrar fotografía/libro virtual; tomar, girar, revelar primera marca | Susurros suaves, un golpe lejano |
| 3:00–4:20 | Manifestación | Buscar huellas/símbolo con herramienta UV; observar aparición furtiva | Cambio progresivo de ambiente |
| 4:20–5:30 | Comunicación | Abrir Spirit Box, preguntar «¿Dónde estás?» y otra pregunta; recibir pista contextual | Voz direccional, vibración opcional |
| 5:30–6:45 | Amenaza y tercera evidencia | Recoger amuleto o cassette virtual; usar cámara paranormal y revelar al Observador | Objetos levitan, marcas en pared |
| 6:45–8:45 | Cacería controlada | Reorientarse, desplazarse poco hacia un punto seguro validado, colocar 3 evidencias en un sello | Jumpscare final condicional y crescendo |
| 8:45–10:00 | Resolución y coda | Sellar presencia o fallar; pantalla final con resultado y reinicio | Foto final con aparición retrospectiva |

**Variación:** Si el jugador es rápido, producir un evento de observación adicional; si le cuesta, activar ayudas tras 30–45 s y reducir la presión temporal. A los 10 minutos ofrecer salida narrativa sin bloquear al jugador.

---

# 4. Bucle central y reglas de juego

**Loop:** explorar una zona -> detectar pista -> manipular objeto -> interpretar evidencia -> formular pregunta o usar instrumento -> aumentar conocimiento y/o amenaza -> tomar decisión -> avanzar.

**Tres evidencias obligatorias:**
1. **Fotografía imposible:** aparece en una mesa/ancla; se puede coger, girar y observar su reverso; revela una marca asociada a la entidad.
2. **Marca UV:** el jugador enfoca una pared calibrada; con instrumento virtual UV aparecen un símbolo y una frase breve. Que el filtro afecte **únicamente zonas virtuales**; no fingir iluminación física real.
3. **Respuesta electromagnética:** Spirit Box reproduce una pista vinculada a la ubicación del Observador y al orden del ritual; voz opcional, preguntas táctiles garantizadas.

**Objetivo final:** colocar fotografía, amuleto y una cinta/fragmento en tres lugares del círculo ritual virtual; cada acierto mantiene a la entidad temporalmente alejada. El orden es inferible mediante pistas encontradas. Un error eleva la amenaza, pero no bloquea la partida.

**Amenaza:** variable continua `threat: 0..100`, modificada por tiempo transcurrido, acciones provocadoras, avances y acciones de defensa. Ejemplo inicial ajustable: `+0.06/s` cuando hay investigación activa, `+8` al fallar ritual, `-6` por encontrar evidencia, `+10` al insistir con pregunta provocadora. Estos son parámetros de diseño para balanceo, no resultados finales. Requiere caps, tiempos de enfriamiento y límites para evitar cascadas.

**Estados:** `ONBOARDING`, `CALIBRATION`, `INVESTIGATION`, `MANIFESTATION`, `ESCALATION`, `HUNT`, `RESOLUTION`, `PAUSED`, `RECOVERY`.

**Director de tensión:** reglas explícitas con semilla determinista opcional para reproducir bugs. Nunca lanzar varios jumpscares a la vez; imponer *cooldown*; evitar castigos aleatorios imposibles. No se desbloquea la cacería antes de que el jugador tenga instrucciones para el ritual.

---

# 5. Interacción con el entorno real y calibración

**Restricción central:** Safari/iOS no expone de forma estándar la reconstrucción LiDAR/RoomPlan o la profundidad ARKit para un sitio web ordinario. **No implementar escaneo automático falso** ni prometer oclusión universal. Usar tracking WebAR SLAM y calibración semimanual.

**Wizard de calibración: máximo ~50–75 segundos:**
1. Elige un área despejada, iluminada, sin escaleras, bordes, cables, vidrio cercano ni tráfico de personas. Muestra límites de seguridad; permite salir en cualquier momento.
2. Solicita permiso de cámara por interacción explícita. Enciende audio únicamente tras pulsar «Comenzar»; solicita micrófono solo si el jugador elige voz.
3. Usa seguimiento espacial con el motor; apunta a una superficie estable. Un retículo indica calidad de seguimiento. Coloca **un ancla de origen** sobre mesa o suelo cuando exista una estimación válida.
4. Pide señalar aproximadamente **un umbral** (puerta o mueble), **una pared** y **una zona segura**. Valida que estén dentro de distancias/campo de visión razonables. Permite corregir después.
5. Guarda `RoomLayout` de sesión en coordenadas relativas al ancla. Evita almacenar fotos, vídeo o planos reales. Si el tracking se pierde, pausa amenazas, conserva el estado y solicita recalibrar/relocalizar.
6. Si no existe puerta, permite configurar un **objeto alto / esquina / cortina** como `PeekZone`. Si falta pared, coloca huellas en un panel AR flotante junto al ancla. Si no hay tracking, ofrece **modo de demostración 3D sobre cámara** sin afirmar que sea SLAM real, o un marcador de imagen como alternativa técnica claramente etiquetada.

**Datos:** `Anchor { id, kind, pose, confidence, calibrationMethod, visibleBounds? }`, `RoomLayout { origin, wallZone, peekZone, safeZone, ritualZone, schemaVersion }`.

**Oclusión:**
- Primera versión: crear *occluder meshes* invisibles alineadas manualmente con borde de puerta/mueble: material que escribe profundidad y no color en Three.js, con orden de renderizado probado. El fantasma puede aparecer parcialmente tapado **solo donde haya una geometría calibrada**.
- Verificar alineación moviendo lentamente la cámara y desde ángulos distintos; si deriva, desactivar oclusión puntual y usar aparición desde el borde de la silueta o por detrás del marco de manera guionizada.
- Una máscara de pantalla fija no equivale a oclusión 3D: no utilizarla como sustituto si provoca que el fantasma atraviese el objeto al mover el dispositivo.
- No afirmar detección automática de ventana, sofá o silla. No intentar trasladar una silla física real mediante IA visual en este teaser.

**Objetos:** aparecen encima o cerca de anclas; usan sombras falsas suaves, reflejos controlados, ruido/ocultación parcial y sonido de material. Prefiere una fotografía con animación extraordinaria a veinte props genéricos.

---

# 6. Objetos virtuales: manos y controles de respaldo

**Interacción principal obligatoria:** controles táctiles accesibles con una mano: raycast a objeto, resalte diegético discreto, pulsación para coger, arrastre para trasladar, rotación con un dedo/dos cuando sea posible, acercar/alejar con slider visible, soltar y examinar. Garantizar zonas táctiles cómodas, evitar acciones escondidas. No depender de que el jugador pueda usar dos manos sosteniendo el móvil.

**Interacción experimental opcional:** MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`) mediante la cámara disponible: detectar gesto de pinza pulgar/índice, proximidad proyectada a un objeto, movimiento y liberación. Debe poder desactivarse. Reconocer que landmarks de mano **no proporcionan por sí solos coordenadas espaciales absolutas equivalentes al SLAM** y que sostener la cámara limita visibilidad de manos. La detección puede costar CPU; probar worker/intervalos y degradación.

**Sistema de objetos:** cada objeto debe tener identidad, collider o volumen para selección, estado (`WORLD`, `HELD`, `EXAMINING`, `PLACED`, `CONSUMED`), orientación, escala, animación de aparición, audio, descripción y clave de pista. Reglas inequívocas para impedir duplicaciones o pérdidas al pausar/recalibrar. Soltar un objeto en el suelo real no debe exigir caminar hacia él para recuperarlo; implementar botón «Recuperar».

**Objetos del teaser:** fotografía, libro/carpeta paranormal, amuleto y Spirit Box. Instrumentos: cámara paranormal y luz UV digitales. Materiales/animaciones con versión de calidad baja y alta.

---

# 7. Inteligencia de comportamiento y apariciones

Implementar **un director de apariciones orientado a eventos** con estructuras de datos reproducibles y estados. No se necesita un LLM remoto ni generar toda la IA en vivo.

**Estados entidad:** `DORMANT`, `WATCHING`, `PEEKING`, `HIDDEN`, `MISLEADING`, `MANIFESTED`, `HUNTING`, `REPELLED`, `BANISHED`.

**Puntos válidos:** `peekZone` (puerta/sofá), `wallZone`, `ritualZone`, `behindOrientation` solo si existe geometría segura y rango visual razonable. «Detrás de ti» significa detrás de la **orientación de la cámara**, no necesariamente de los ojos/cuerpo del jugador; nunca pretender seguimiento de mirada.

**Apariciones obligatorias:**
- **Umbral:** asoma medio rostro por 1–2 s y se retrae cuando el usuario lo enfoca; usar oclusión calibrada cuando sea posible.
- **Observador pasivo:** figura al final del marco, inmóvil, con microanimaciones; desaparece cuando el jugador usa la cámara paranormal de forma incorrecta o cambia de ángulo.
- **Instrumento exclusivo:** silueta que solo se renderiza mientras el modo cámara paranormal está activo; debe dar una pista concreta.
- **Falso movimiento de objeto:** un libro virtual vibra, levita unos centímetros y cae con sonido; en eventos más intensos, una fotografía sale despedida, pero siempre se recupera en inventario.
- **Espalda:** al preguntar «¿Dónde estás?», la voz suena desde una zona trasera válida; si el jugador gira lentamente, puede ver el fantasma ya retirándose.
- **Ataque:** secuencia diegética 3D ligada al estado de cacería (no vídeo insertado), con aviso anticipado, animación y sonido regulable.

**Evitar:** apariciones a través de objetos no escaneados, persecuciones con navegación por casas desconocidas, teletransportes arbitrarios sin reglas, reconocimiento de muebles no soportado y patrones que rompan el tracking.

---

# 8. Sistema de preguntas y audio paranormal

**Entrada garantizada:** panel de preguntas táctil con cuatro frases localizadas al español. **Entrada de voz:** mejora opcional, solo con permiso del usuario; detectar disponibilidad de `SpeechRecognition`/`webkitSpeechRecognition`, manejar `onerror`, `onnomatch`, interrupciones, permisos y idioma `es-ES` o `es-CO` según test. No exigir conectividad de reconocimiento para ganar; no registrar audio.

Preguntas base: «¿Dónde estás?», «¿Puedes mostrarte?», «¿Qué quieres?», «¿Cómo te llamas?». Además, «¿Estás aquí?» como variante reconocible y comando «Ayuda» para volver al tutorial. Implementar normalización de acentos, puntuación y formas frecuentes sin abrir una escucha permanente.

**Motor de respuesta:** `ResponseSelector(question, entityState, roomLayout, threat, lastResponse, rngSeed)` devuelve `{ text, audioCue, emitterAnchor, hallucination?, gameplayEffect }`. Si no hay ubicación válida para decir «detrás de ti», generar respuesta verdadera y coherente alternativa. **Mentiras permitidas** únicamente como mecánica explícita con pistas para detectarlas.

**Sonido:** Web Audio API; `AudioContext` desbloqueado por gesto del usuario; `PannerNode` para emisores AR con actualización suave respecto a la cámara; caída de volumen por distancia y mezcla de ambiencia ambiental. Estéreo aproximado, no afirmar HRTF universal ni ubicación real exacta. Priorizar audífonos y ofrecer volumen independiente para efectos/sustos/voz. Ofrecer subtítulos con dirección («voz a tu izquierda») y modo sin micrófono.

**Contenido sonoro mínimo:** hum eléctrico, 3 pasos lejanos, susurro cercano, radio estática, interferencia de cacería, crujidos, golpe, objeto deslizándose, respiración, ataque final, 4–6 respuestas interpretadas. Usar voces pregrabadas propias o grabadas con consentimiento; no falsificar una persona identificable. Toda pieza de audio debe tener procedencia y licencia verificada.

---

# 9. La cacería: desplazamiento real, lento y seguro

**Regla no negociable:** el jugador **sí debe desplazarse ligeramente** para escapar de la entidad, **pero nunca correr ni atravesar su vivienda**. La supervivencia depende más de observar, reaccionar y reposicionarse que de la velocidad física.

**Diseño preferido:**
- Previamente a la cacería, el jugador registra una **zona segura accesible en uno o dos pasos lentos** o una zona de visión alternativa sin obstáculos.
- El sistema indica «Retrocede despacio», «Muévete un paso hacia la zona iluminada» o «Gira hacia el sello», con señales audiovisuales; nunca «¡CORRE!».
- La cacería incluye **tres embestidas virtuales** separadas por tiempo de reacción suficiente. Superar una embestida requiere ubicarse dentro de zona segura o activar un objeto defensivo; si el tracking no detecta bien el traslado, ofrecer una alternativa de interacción igualmente válida (p. ej., dirigir el símbolo con la cámara y tocar para protegerte).
- El fantasma se aproxima **en el espacio virtual** según la posición relativa del teléfono; no impulsa al jugador a desplazarse físicamente más de lo validado.
- Ante pérdida de tracking o proximidad a borde de zona, **pausa inmediata**, sin penalizar. No depender de GPS, velocidad o detección de obstáculos no disponible.
- No obligar a apagar luces físicas ni cerrar los ojos; permitir sentarse o permanecer de pie. Incluir un «Modo movilidad reducida» donde el desplazamiento se reemplaza por movimientos lentos de cámara.

**Jumpscare:** primero señales (flicker virtual, audio, fallo de instrumentos), después aparición/embestida con animación 3D completa, sonido de impacto limitado y cooldown. Ajuste «Sustos: bajo/normal/intenso». Sin destellos de frecuencia alta ni sacudidas incontrolables. La opción «Reducir destellos» afecta cualquier parpadeo, y «Reducir movimiento» disminuye sacudida de cámara.

**Fracaso justo:** resolución alternativa corta; no bloquear cámara ni impedir salir; reinicio rápido del expediente. **Victoria:** secuencia de exorcismo/sello de 20–30 s y escena final de fotografía con silueta escondida.

---

# 10. Dirección visual: premium y adecuada a mobile

**Identidad:** thriller analógico paranormal con una interfaz editorial sobria sobre cámara real. Evitar UI de dashboard corporativo, colores neón genéricos, tipografías ilegibles y exceso de HUD. Menús con composición cinematográfica, texto breve y detalles de grano, interferencia, cinta magnética y marca de expediente.

**Paleta propuesta:** carbón `#090D10`; gris pizarra `#242C31`; blanco roto `#EEE9E1`; ámbar investigador `#D8AC6B`; azul verdoso de equipo `#7199A0`; rojo hostil `#A92B36` solamente en peligro. Transparencias cuidadosas para conservar visibilidad de cámara. Elegir tipografías con licencia OFL y alojarlas localmente; ofrecer fuente de sistema como fallback.

**Pantallas obligatorias:**
1. Portada con tipografía fuerte, fondo oscuro animado, «Iniciar expediente», «Créditos», «Ajustes», aviso de terror.
2. Tutorial breve que explica que debes moverte **despacio**, nunca correr, y cómo salir.
3. Calibración AR con barras de calidad, zonas seleccionadas y «Recalibrar».
4. HUD mínimo: medidor diegético de amenaza, accesos instrumentales, indicador de evidencias y pausa visible.
5. Modo examen de objetos con fondo de cámara atenuado, controles de giro, «guardar pista» y «soltar».
6. Spirit Box con subtítulos accesibles y selección táctil de preguntas.
7. Cacería con información clara de dirección segura y acción posible.
8. Resultado con puntuación narrativa (evidencias, tiempo, finales) y QR/«Jugar otra vez» útil para eventos.

**Cinematografía:** animación con anticipación y seguimiento, sombras falsas en anclas, transparencias atmosféricas moderadas, bloom limitado, fog local virtual, distorsión sutil, decals para marcas en pared registrada, partículas solo en momentos clave. En móvil, preferir shaders baratos y compositing controlado. No oscurecer vídeo de cámara tanto que el jugador deje de ver obstáculos reales.

**Entregables artísticos:** moodboard documentado, guía de silueta y materiales del fantasma, mapa de efectos por fase, animatic breve de jumpscare y lista de assets de calidad profesional. Si no hay modelo autorizado descargable, crear sustituto original en Blender; no fingir que un placeholder es el modelo final.

---

# 11. Pipeline 3D y assets libres

**Formato runtime:** glTF/GLB 2.0. Exportar FBX/OBJ únicamente como intermediario cuando proceda. Configurar `GLTFLoader` con `DRACOLoader`/Meshopt y `KTX2Loader` **solo cuando los assets realmente lo requieran**. Mantener decodificadores en ruta accesible bajo el `base` correcto de Vite/GitHub Pages.

**Fuentes recomendadas:** Poly Haven (modelos, texturas y HDRI CC0); Kenney Furniture Kit / Graveyard Kit (CC0); Mixamo (rigs y animaciones gratuitas para videojuegos conforme sus términos); Blender (modelado original); Freesound preferentemente sonidos CC0 o CC BY bien atribuidos; Sonniss GDC 2026 (sonidos bajo su licencia específica). Comprobar cada archivo y documentar `source_url`, `creator`, `license`, `attribution`, `download_date`, `restrictions`.

**Calidad vs rendimiento:** metas iniciales, medir y ajustar en hardware real:
- Meta orientativa de **30 FPS estables** para móviles compatibles; 60 FPS como mejora si hay margen.
- DPR ajustable; priorizar cámara y SLAM antes que bloom, sombras y postprocesado.
- Fantasma con LOD/variantes optimizadas y texturas comprimidas; empezar con 30–60 mil triángulos **como presupuesto tentativo total para el fantasma y props visibles**, sujeto a benchmarks (no regla universal).
- Texturas principales 1K, 2K solo donde el test demuestre que aporta valor; WebP/KTX2 donde proceda.
- Preferir pocos materiales, atlas, instancias y animaciones comprimidas; eliminar luces con sombras en tiempo real innecesarias.
- Objetivo indicativo de descarga inicial inferior a 20 MB y descarga diferida de assets extra; **no prometer este número sin medir**.
- Evitar HDRI panorámicos enormes, vídeos 4K de fondo, modelos premium sin licencia y dependencias externas imprescindibles para arrancar.

**Asset crítico:** producir un fantasma original riggeado con cinco animaciones: `idle_watch`, `peek_out`, `retreat`, `stalk_walk`, `hunt_attack`. Variantes de pose y niveles de intensidad. Asegurarse de que las animaciones funcionan en GLB con `AnimationMixer`.

---

# 12. Stack y viabilidad real WebAR (decisiones de arquitectura)

**Framework/UI:** Vite + TypeScript strict + React para menús/HUD/configuración. **Motor 3D:** Three.js para la escena de AR, no montar react-three-fiber sobre un renderer que ya controla XR8 sin comprobar compatibilidad. Si la integración R3F es problemática, Three.js imperativo para runtime AR y React únicamente para overlay; esta es la opción por defecto.

**Seguimiento espacial primario:** `@8thwall/engine-binary` con chunk `slam` y `XR8.Threejs.pipelineModule()`, `XR8.XrController.pipelineModule()`, módulos de cámara necesarios. Usar **referencias oficiales y un ejemplo ejecutable**: https://8thwall.org/docs/engine/overview y https://8thwall.org/docs/api/engine/threejs. Copiar/servir el runtime según documentación; añadir avisos de Niantic Spatial y enlace a licencia https://github.com/8thwall/engine/blob/main/LICENSE. El framework MIT de 8th Wall **no incluye SLAM**. El binario **no incluye Hand Tracking, VPS ni reconstrucción LiDAR**. NO modificar/redistribuir el binario fuera de lo permitido.

**Fallback:** modo 3D sobre cámara o image-target/marker, etiquetado como modo compatible, para móviles que no superen el chequeo de soporte o fallen tras un intento de recuperación. Mantener las tres pistas, el ritual y la cacería (por eventos relativos a cámara) aunque pierda capacidades de anclaje. No afirmar oclusión de entorno si no se está ofreciendo.

**API de gestos:** MediaPipe `@mediapipe/tasks-vision` en módulo optativo. **Voz:** Web Speech cuando disponible; fallback de preguntas por botones, voz pregrabada. **Audio:** Web Audio API. **Física virtual:** cálculo propio de interpolación y colisión para props simples; considerar Rapier 3D únicamente si se justifica y se mide el impacto, no añadir por costumbre. **Estado:** máquina de estados pura con datos serializables, tests en Vitest.

**Hosting:** build estático de Vite y GitHub Pages con GitHub Actions; ajustar `base` (`/nombre-repo/` en proyecto GitHub Pages). El móvil necesita HTTPS para cámara/micrófono. Para desarrollo usar `localhost` en PC y una URL HTTPS temporal o despliegue de staging para teléfono. El funcionamiento offline será **best effort** tras cachear assets, pero no prometerlo sin validar runtime SLAM y permisos en iOS/Android.

**Seguridad/privacidad:** no subir audio/cámara; no grabar por defecto; no usar analytics de terceros; sin cuentas. Los modelos de reconocimiento de voz pueden utilizar procesamiento externo según el navegador: explicarlo y ofrecer entrada táctil. Añadir botón «Detener cámara» y liberar MediaStream/AudioContext al salir.

---

# 13. Arquitectura de carpetas sugerida

```text
haunted/
  .claude/
    skills/                     # opcional: AR audit, QA, asset audit
  .github/workflows/
    deploy.yml
  public/
    ar-runtime/                 # motor XR8 copiado conforme licencia
    assets/
      models/                   # GLB optimizados
      textures/
      audio/
      fonts/
  src/
    app/                       # React, rutas/pantallas, provider, bootstrap
    ar/
      ARRuntime.ts              # inicia/apaga tracking y camera pipeline
      IARAdapter.ts             # interfaz separable del motor
      EighthWallAdapter.ts
      FallbackARAdapter.ts
      AnchorCalibration.ts
      OccluderManager.ts
      DeviceCapabilities.ts
    game/
      GameDirector.ts           # FSM y threat
      EvidenceSystem.ts
      InteractionSystem.ts
      RitualSystem.ts
      HuntSystem.ts
      EntityBrain.ts
      GameTypes.ts
      gameBalance.ts
    audiovisual/
      AudioDirector.ts
      VoiceCommands.ts
      VisualEffects.ts
      GhostAnimation.ts
    ui/
      screens/
      components/
      styles/
    assets/
      manifest.ts
    tests/
  docs/
    GDD.md
    TECHNICAL_DESIGN.md
    ART_DIRECTION.md
    QA_DEVICE_MATRIX.md
    ASSET_LICENSES.md
    IMPLEMENTATION_LOG.md
  CLAUDE.md
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  README.md
```

**Interfaces para migración:** `IARAdapter` expone `initialize`, `placeAnchor`, `getPose`, `getTrackingStatus`, `createOccluder`, `shutdown`; `GameDirector` no importa código de XR8; `EntityBrain` recibe zonas y matrices en un formato de dominio propio; narrativa y balanceo viven en JSON/TS portable. Guardar assets GLB, efectos y ficheros de datos fuera del adaptador web.

---

# 14. Plan por hitos con puertas de calidad

**Hito 0 — Documento + prueba técnica (no saltar):**
- Revisar documentación actual, licencia y ejemplo 8th Wall; preparar entorno.
- Crear landing mínima, HTTPS de staging y módulo de detección de dispositivos.
- Verificar permisos de cámara y AR SLAM en un iPhone real y un Android real; registrar si no se dispone de dispositivo.
- **Puerta:** un cubo virtual permanece razonablemente anclado durante un movimiento corto de teléfono. Si falla, diagnosticar antes de crear el juego.

**Hito 1 — Vertical slice técnico:**
- Calibración simplificada; crear ancla, superficie y zona de aparición.
- Modelo de foto/libro colocado en mesa; tap/drag, rotación, examinar, recuperar.
- Primer sonido espacial y objeto levitando.
- **Puerta:** coger, rotar, soltar y relocalizar el objeto sin cuelgues tras perder el tracking.

**Hito 2 — Una escena de terror perfecta:**
- Modelo 3D original de El Observador + cinco animaciones.
- Asomarse por un marco calibrado, ocultación aproximada y desaparición al mirar.
- Cámara paranormal que revela presencia invisible.
- **Puerta:** grabación real desde teléfono que pruebe un asomo convincente, no un montaje.

**Hito 3 — Investigación jugable:**
- Evidencias 1, 2 y 3; Spirit Box con respuestas contextualizadas.
- Director de amenaza y guía sin bloquear el progreso.
- **Puerta:** un jugador externo puede reunir tres evidencias sin instrucciones del desarrollador.

**Hito 4 — Cacería segura y final:**
- Zona segura, aproximación virtual, tres embestidas, ritual, final bueno/malo, susto y accesibilidad.
- **Puerta:** se puede ganar sin correr y sin caminar más allá de la zona calibrada; pérdida de tracking pausa el peligro.

**Hito 5 — Pulido y exhibición:**
- Visual, iluminación y sonido; optimización GLB; loading, errores, créditos, QR, pausa y reiniciar.
- QA en Safari iOS/Chrome Android; pruebas de batería/calor, redeploy, permisos denegados, conexiones lentas.
- **Puerta:** `npm run build` limpio; checklist de aceptación; video real de prueba; versión pública HTTPS lista para un stand.

En cada hito, reporta qué se probó, qué no se pudo probar y qué queda por resolver. Las pruebas con navegador automatizado no reemplazan pruebas reales de SLAM, audio espacial y mano en dispositivo.

---

# 15. Pruebas y calidad (Definition of Done)

**Sistema de pruebas:** Vitest para máquina de estados y reglas; Playwright para menú, navegación, versión sin cámara, textos, permisos denegados simulados y flujos con adaptadores mock; pruebas manuales de tracking y experiencia sensorial. Mantener fixtures deterministas y logs que no graben imagen/audio.

**Matriz de pruebas mínima:**
- iPhone 13 Pro Max / Safari iOS (dispositivo de referencia, pero no asumir que ya se probó).
- Android real gama media / Chrome estable (especificar modelo y versión durante QA).
- Windows 11 / Chrome + webcam solo para UI/fallback, sin adjudicarle AR SLAM móvil.
- Cámara autorizada/denegada; micro autorizado/denegado; orientación cambiada; interrupción por llamada; pestaña en background; pérdida de tracking; batería baja; sin internet después de entrar; baja luz; texturas y objetos faltantes.

**Objetivos medibles, no promesas:** 30 FPS sostenidos en móviles de referencia; interfaz con objetivos táctiles cómodos; ausencia de errores no controlados; memoria sin crecimiento sostenido en tres partidas consecutivas; inicio razonable en Wi-Fi, medido; subtítulos siempre disponibles; final alcanzable en 8–10 min para tester familiarizado, con opción de ayuda; cero acciones que exijan correr.

**Criterios de aceptación innegociables (todos con evidencia):**
- [ ] Se abre desde un enlace HTTPS en Safari iOS y Chrome Android compatibles.
- [ ] Tiene permisos, error de cámara y fallback explícitos; no pantalla negra.
- [ ] Entrega AR anclada cuando el motor disponible lo permite.
- [ ] Permite calibrar al menos ancla, umbral y pared, o su fallback marcado.
- [ ] Tres evidencias reales y al menos dos objetos manipulables.
- [ ] Fantasma 3D original con animaciones, aparición furtiva y cacería.
- [ ] Oclusión manual calibrada demostrada o degradación honesta sin prometerla.
- [ ] Preguntas a Spirit Box con fallback táctil, subtítulos y respuestas consistentes.
- [ ] Audio espacial relativo a la orientación, sujeto a dispositivo.
- [ ] Se mueve lentamente para escapar dentro de un límite; modo accesible alternativo.
- [ ] Jumpscare en cacería con controles de intensidad, volumen y reducir movimiento.
- [ ] Ritual, victoria, fracaso, reinicio y pausa funcionales.
- [ ] No requiere cuenta, servidor propio ni pagos para entrar.
- [ ] Licencias/atribuciones inventariadas, avisos de 8th Wall presentes.
- [ ] No presenta funcionalidades simuladas como si ya funcionaran.

---

# 16. Criterios de calidad de exhibición y presentación

**Primera impresión (primeros 20 segundos):** título cinematográfico con mensaje inmediato, botón destacado, instrucción muy corta; no demorar la primera acción sobrenatural. La pantalla inicial debe verse editorial, reconocible y profesional, incluso antes de activar cámara.

**«Momento wow» obligatorio:** a los ~3–4 minutos, el usuario escucha una presencia a su derecha, gira hacia el marco calibrado, ve a El Observador asomarse y retirarse; acto seguido una fotografía virtual levita sobre una mesa. Esa secuencia debe existir en el código con eventos disparados por progreso.

**Demo de jurado:** botón de reinicio rápido; QR imprimible; modo demostración cuando el lugar no se pueda calibrar; contador de sesión opcional accesible solo al operador; vídeo de respaldo **grabado desde una sesión real** para mostrar lo que sucede si el entorno del jurado no permite cámara/tracking. Mostrar créditos y limitaciones sin esconderlas.

**Telemetría opcional local:** duración, FPS medio, calidad de tracking y fases completadas, con panel de debug protegido por modo desarrollo. No recopilar datos personales ni video/audio.

---

# 17. Accesibilidad, confort y prevención de accidentes

Antes de jugar: explicar terror/sustos/luces, espacio despejado, capacidad de pausar en cualquier momento. Ofrecer «Reducir destellos», «Reducir movimiento», «Volumen de sustos», «Subtítulos», «Sin micrófono» y «Modo sin desplazamiento». Evitar efectos luminosos agresivos; jamás simular una salida de emergencia en una puerta real.

Durante tracking perdido o demasiado cerca de la zona límite: congelar persecución, quitar jumpscare pendiente y mostrar «Detente y recalibra» con opción cancelar. Mantener el video suficientemente legible para ver el entorno físico. Si el jugador reporta mareo o desorientación, «Salir» detiene cámara y audio inmediatamente.

Privacidad: sesión local; no videos del hogar almacenados por defecto; no grabación sin consentimiento; mostrar claramente permiso de micrófono opcional y posible procesamiento por servicios del navegador; no guardar información del espacio en servidores.

---

# 18. Revisión del código y requisitos al ejecutar en Claude Code

**Archivo `CLAUDE.md` pequeño:** entre 20–45 líneas con stack, comandos, reglas «no fake AR», criterios de entrega y punteros a documentos; no copiar todo este prompt dentro de `CLAUDE.md`.

**Evitar errores frecuentes:**
- Cargar librerías con versiones distintas de Three.js que rompan XR8.
- Iniciar cámara/audio automáticamente sin gesto y sin HTTPS.
- Cargar modelos muy pesados sin optimizar, o rutas absolutas que fallen en GitHub Pages.
- Ejecutar MediaPipe a 60 FPS en hilo principal causando lag; probar rendimiento y throttling.
- Confiar en `SpeechRecognition` como único medio de resolver un puzzle.
- Falsear la oclusión usando una máscara fija no adherida a un objeto.
- Cortar el render de cámara al pausar el navegador sin restauración.
- Hacer que el fantasma diga estar detrás y aparecer enfrente por error.
- Intentar acceder a LiDAR/RoomPlan directamente desde Safari.
- Recortar calidad artística en favor de cientos de ficheros boilerplate.

**Proceso de revisión:** tras cada hito, solicita revisión interna con perspectivas AR, diseño y QA. Conserva issues en `docs/IMPLEMENTATION_LOG.md` y no declares el producto terminado si falta una mecánica clave. Si falta un asset, genera un plan exacto de producción y un placeholder claramente rotulado. Refactoriza cuando se haya demostrado el vertical slice, no antes.

**Tu primera acción concreta ahora mismo:** realiza inventario del repo y entorno, revisa docs oficiales de 8th Wall y Claude Code, crea una propuesta de implementación de una página con riesgos P0/P1/P2 y arranca el Hito 0. Una vez estable la prueba AR, continúa hitos con entregables reales, sin convertir este encargo en un mero documento de planificación.

---

# 19. Referencias oficiales y recursos verificables (consultados 9/11/2026)

**WebAR y compatibilidad**
- 8th Wall Engine overview: https://8thwall.org/docs/engine/overview
- 8th Wall open source vs. binario SLAM: https://8thwall.org/docs/open-source
- API Three.js: https://8thwall.org/docs/api/engine/threejs
- Requisitos de navegadores: https://8thwall.org/docs/troubleshooting/browser-requirements
- Licencia binario XR: https://github.com/8thwall/engine/blob/main/LICENSE
- Ejemplos: https://github.com/8thwall/aframe-world-effects-example
- MediaPipe Hand Landmarker Web: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- Web Audio spatialization: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
- Cámara/HTTPS: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- glTF Transform CLI: https://gltf-transform.dev/cli

**Claude Code y pruebas**
- Quickstart: https://code.claude.com/docs/en/quickstart
- VS Code: https://code.claude.com/docs/en/vs-code
- Best practices: https://code.claude.com/docs/en/best-practices
- Skills: https://code.claude.com/docs/en/skills
- MCP: https://code.claude.com/docs/en/mcp
- Plugins: https://code.claude.com/docs/en/plugins
- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Context7: https://github.com/upstash/context7

**Assets y licencias**
- Poly Haven / CC0: https://polyhaven.com/license
- Kenney Furniture Kit: https://kenney.nl/assets/furniture-kit
- Kenney Graveyard Kit: https://kenney.nl/assets/graveyard-kit
- Adobe Mixamo FAQ: https://helpx.adobe.com/co/creative-cloud/faq/mixamo-faq.html
- Freesound / licencias: https://freesound.org/help/faq/
- Sonniss GDC 2026: https://gdc.sonniss.com/ y https://sonniss.com/gdc-bundle-license/

**Despliegue y futuro nativo**
- Vite GitHub Pages: https://vite.dev/guide/static-deploy
- Unity AR Foundation samples: https://github.com/Unity-Technologies/arfoundation-samples
- Unity ARCore/ARKit integración: https://developers.google.com/ar/develop/unity-arf/getting-started-ar-foundation
- Unity Personal eligibility: https://unity.com/pages/license-compliance
- Build iOS sin Mac: https://docs.unity.com/en-us/engine/7000.0/manual/platform-specific/iphone/ios-building-and-delivering/build-process

---

# 20. Orden de prioridad final

**P0 = debe funcionar antes del parcial:** web móvil HTTPS; cámara; ancla o fallback claro; un objeto manipulable; una entidad 3D; dos manifestaciones; tres evidencias; Spirit Box táctil; cacería segura; cierre/reinicio; no crashes.

**P1 = diferenciadores de calidad:** oclusión manual por marco; audio espacial; voz opcional; múltiples objetos voladores; tres animaciones de amenaza; postprocesado cuidadoso; subtítulos, créditos y calidad de assets.

**P2 = experimentación no bloqueante:** pinza con MediaPipe en cámara trasera; oclusión automática en dispositivos que expongan profundidad; IA de diálogo abierta; objetos reales replicados; modo VR cardboard; nativo con ARKit/ARCore.

**Regla de decisión:** si un P2 pone en riesgo P0 o P1, desactívalo. El producto gana por la inmersión real, no por marcar casillas técnicas. El teaser estará listo cuando se pueda jugar completo en iOS y Android compatibles, no cuando Claude diga «implementado».
