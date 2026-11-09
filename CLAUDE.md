# HAUNTED — reglas del repositorio

Proyecto: WebAR iOS/Android, teaser de 8–10 minutos, una entidad: El Observador.
Especificación completa: `docs/HAUNTED_PROMPT_MAESTRO_CLAUDE_CODE.md`.
Guía de producción: `docs/HAUNTED_GUIA_DE_DESARROLLO.md`.

## Prioridades
- Primero probar 8th Wall SLAM real en móvil, no un mockup AR.
- Three.js para escena AR; React para overlay/UI; TypeScript strict y Vite.
- Input táctil debe completar todo; mano/voz son opcionales y requieren fallback.
- Nunca decir que hay detección automática de muebles/LiDAR desde Safari.
- El usuario nunca tiene que correr; tracking perdido pausa cacería y jumpscares.
- Una entidad y tres evidencias; más calidad narrativa y menos scope.
- Assets propios o con licencias verificadas; conservar avisos de 8th Wall.

## Verificaciones por hito
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Registrar QA real iPhone/Android y fallbacks en `docs/QA_DEVICE_MATRIX.md`.
- No afirmar que un test en PC prueba AR espacial iOS/Android.

## Trabajo
- Inspeccionar primero, plan breve, implementar un hito verificable y revisar diff.
- Registrar bloqueos y pruebas pendientes en `docs/IMPLEMENTATION_LOG.md`.
- No crear sistemas falsos etiquetados como funcionales.
