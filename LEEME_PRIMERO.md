# HAUNTED — Kit de arranque para Claude Code

**Proyecto:** *HAUNTED — Expediente 01: El Observador*  
**Formato:** teaser WebAR de 8–10 minutos, una entidad, iPhone + Android compatibles, publicación en GitHub Pages, futura reconstrucción nativa en Unity.

## ¿Qué contiene este paquete?

- `docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md`: la especificación completa que leerá Claude Code. Es la fuente de verdad del proyecto.
- `docs/HAUNTED_GUIA_DE_DESARROLLO.pdf`: guía de trabajo detallada, cómoda de leer y con enlaces a recursos.
- `docs/HAUNTED_PROMPT_MAESTRO_LECTURA.pdf`: versión de lectura del prompt maestro.
- `docs/HAUNTED_GUIA_DE_DESARROLLO.md`: versión editable de la guía.
- `CLAUDE.md`: reglas breves para cargar contexto en el repositorio.
- `.claude/skills/`: tres skills de control de calidad, ritmo de terror y QA móvil.
- `INICIO_PARA_CLAUDE.txt`: primer mensaje exacto que conviene enviar al agente.
- `docs/QA_DEVICE_MATRIX_TEMPLATE.csv`: plantilla para pruebas reales de iPhone y Android.
- `docs/ASSET_LICENSES_TEMPLATE.csv`: inventario de procedencia y licencia de assets.

## Cómo comenzar

1. Lee `docs/HAUNTED_GUIA_DE_DESARROLLO.pdf` antes de abrir VS Code.
2. Instala Git, Node LTS, VS Code y la extensión oficial Claude Code. Si usarás su terminal/CLI, verifica `claude --version`. Claude Code puede tener costo de acceso o consumo.
3. **Antes de crear el juego**, reproduce el ejemplo `https://github.com/8thwall/threejs-world-effects-example` en iPhone y Android reales. Verifica cámara, anclajes AR y compatibilidad; guarda evidencia.
4. Crea tu repositorio `haunted-webar` e introduce en su raíz `CLAUDE.md`, `.claude/` e `INICIO_PARA_CLAUDE.txt`, y la carpeta `docs/`.
5. Desde VS Code abre el repositorio, inicia Claude Code y pega el contenido de `INICIO_PARA_CLAUDE.txt`.
6. Pide **solo el Hito 0**: tracking real de un objeto anclado, fallback honesto y un build verificable. No le pidas generar todo el juego en una sola iteración.
7. Avanza por hitos, haciendo commits y anotando `PASS / FAIL / NO PROBADO` en la matriz de QA. No marques pruebas móviles como aprobadas si solo se ejecutaron en escritorio.

## Dos límites reales que debes comprender

- El motor SLAM distribuido de 8th Wall tiene licencia específica y no incluye hand tracking; el framework MIT por sí solo no incluye SLAM. Revisa los avisos legales de 8th Wall antes de publicar.
- En Safari no debes asumir acceso general a reconstrucción LiDAR, reconocimiento automático de muebles u oclusión de profundidad de ARKit. El teaser usa puntos calibrados manualmente y máscaras parciales. Para ir más allá, la ruta recomendada es Unity + AR Foundation, reconstruyendo la integración AR.

## Seguridad y alcance

La cacería puede pedir **uno o dos pasos lentos dentro de una zona libre y señalizada**, y siempre tiene modo sin desplazamiento. Nunca exige correr, oscuridad física ni giros bruscos. Al perder seguimiento, pausa el peligro. Los jumpscares se pueden regular.

**Importante:** estos archivos son documentación y reglas para producir el juego; no contienen una versión ya programada y validada del videojuego.
