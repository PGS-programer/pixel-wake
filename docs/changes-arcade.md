# Cambios de la versión arcade

## Archivos

| Archivo | Cambio |
| --- | --- |
| `src/game/config.js` | 220 px/s iniciales, 420 px/s de control vertical y +18 por nivel. |
| `src/game/scenes/GameScene.js` | Apertura inmediata, captura del movimiento previo y breve impacto antes de resultados. |
| `src/game/data/obstacles.js` (nuevo) | Nueve tipos de peligro, tamaños, velocidades y movimiento lateral reproducible. |
| `src/game/entities/obstacle.js` (nuevo) | Construcción de siluetas, variantes, espuma, estelas e indicadores de entrada. |
| `src/game/systems/spawnDirector.js` (nuevo) | Nueve patrones, recuperación, búsqueda de rutas y validación de monedas. |
| `src/game/systems/obstacles.js` | Integración del director, adelantamientos reales, movimiento y colisiones continuas. |
| `src/game/systems/coins.js` | Monedas creadas por patrones y velocidad ligada a su ruta. |
| `src/game/systems/scoring.js` | Curva de velocidad, máxima cercanía durante el frame y feedback según combo. |
| `src/game/systems/rules.js` | Intersección continua de trayectorias; retirada del generador antiguo de carriles. |
| `src/game/systems/effects.js` | Animación de combo de 650 ms, intensidad acotada y textos separados del HUD. |
| `src/game/ui/gameHud.js` | Posiciones y tamaño de feedback, conservando todas las estadísticas. |
| `src/game/visuals/ocean.js` | Olas con distintas velocidades, reflejos, sombra y espuma. |
| `tests/director.test.js` (nuevo) | Apertura, cruces entre frames, rutas, barreras y encuentros superpuestos. |
| `tests/near-miss.test.js` | Conservación del premio único; retirada de la prueba de separación artificial. |
| `tests/rules.test.js` | Semillas y reglas vigentes. |
| `README.md` | Balance, obstáculos, patrones, arquitectura y alcance de la validación. |
| `docs/verification.md` | Resultados y límites de pruebas de reglas y navegador. |
| `docs/changes-arcade.md` (este archivo) | Inventario de la intervención. |
| `dist/` | Salida regenerada mediante `npm run build`. |

## Decisiones

Se mantienen el ángulo de cámara, controles simples, cosméticos sin ventajas, precios, progreso y las cinco claves heredadas de almacenamiento. El combo sigue sin límite y conserva sus bonus; se acota únicamente la intensidad de efectos. No hay cuentas, monetización ni servicios externos.

El director comprueba rutas seguras para el conjunto de peligros activos, con margen y tiempo de reacción. Si no encuentra salida, rechaza la nueva propuesta y deja espacio. Se omiten las monedas cuya ruta no es segura, y las nuevas situaciones respetan las monedas ya presentes. Esto no convierte cualquier movimiento del jugador en una decisión salvable.

Se implementan rocas de tres tamaños, boya, lancha, pesquero, velero, moto de agua y tronco; los canales y bancos de rocas son formaciones. No se añade una ola dañina: el oleaje sigue siendo decorativo para que la lectura del peligro sea clara.

La curva es 220 + 18 × (nivel − 1), cada 250 m y hasta nivel 14 (454 px/s), con transición de 72 px/s². La apertura presenta monedas antes del primer segundo y obliga a esquivar antes de los dos segundos. El desplazamiento vertical responde sin inercia; solo la inclinación se suaviza.

## Recuperación

El checkpoint anterior permanece intacto en `.checkpoints/pixel-wake_2026-10-12_23-36-48/`. Se ha vuelto a verificar el SHA-256 del archivo. Consulta su `RESTAURAR.md` antes de recuperar. El checkpoint contiene el proyecto y sus dependencias; los guardados del navegador se almacenan aparte y no se han borrado ni migrado.

## Validación

16 pruebas de Node aprobadas, compilación de producción correcta y comprobación de navegación, compras, guardado, controles, pausa, táctil y reinicios en Chrome con perfil aislado, sin errores de JavaScript. Véase `verification.md` para distinguir pruebas automatizadas, estados inyectados y límites de hardware/playtesting.
