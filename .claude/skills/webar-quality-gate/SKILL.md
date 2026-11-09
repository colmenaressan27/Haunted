---
name: webar-quality-gate
description: Audita cada integración de tracking WebAR, anclajes, oclusión y degradaciones antes de aprobar un hito de HAUNTED.
---
# Puerta de calidad WebAR
1. Confirmar fuente oficial y versión exacta de 8th Wall, Three.js y binarios usados.
2. Distinguir claramente: SLAM real, marcador, overlay cámara, simulación en desktop.
3. Verificar permiso HTTPS, inicialización, teardown y recuperación de tracking.
4. Probar en hardware real: objeto anclado, cambio de posición, deriva, ocultación y pérdida de foco.
5. Informar limitaciones de Safari, orientación y oclusión; nunca inventar datos LiDAR.
6. Si no hay teléfono, generar checklist ejecutable y marcar `NO PROBADO`.
7. Proponer fallback jugable y medible, conservar evidencia en `docs/QA_DEVICE_MATRIX.md`.
