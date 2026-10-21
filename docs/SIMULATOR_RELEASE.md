# PW–20 · primera versión completa

Este informe corresponde a la versión 3.0. La distribución del puerto, tolerancias y cifras de la actualización 3.1 se documentan en [MEDITERRANEAN_HARBOR.md](MEDITERRANEAN_HARBOR.md).

Fecha: 21 de octubre de 2026. Nueva plataforma con arcade conservado y simulador 3D de atraque. Investigación y ecuaciones: [NAUTICAL_DESIGN.md](NAUTICAL_DESIGN.md). Controles e inicio: [README](../README.md).

## Comprobaciones realizadas

| Área | Resultado y alcance |
| --- | --- |
| Punto de partida | Repositorio limpio en `186fec0`, build previa PASS, archivo recuperable con SHA-256 documentado |
| Unitarias | `npm test`: 31/31 PASS; 21 existentes y 10 del simulador |
| Física | Avante/atrás simétricos sin giro espurio, mando independiente, giro diferencial y motores opuestos, inercia en neutral, retardo al invertir, timón sin efecto en reposo sin flujo, respuesta limitada y eficaz con flujo |
| Ambiente y tiempo | Corriente relativa/STW vs SOG, viento que produce deriva/giro y equivalencia a 30/60/120 FPS en el reloj fijo |
| Colisiones y reglas | Casco contra muelle, impulso y corrección de penetración; rechaza amarre con velocidad, ángulo, distancia o motores incorrectos; aborta al perder la posición segura |
| Viajes completos | Niveles 1, 2 y 3 desde fuera del puerto hasta seis amarras, sólo mediante órdenes de motor y fuerzas; 0 colisiones. Los niveles 4 y 5 tienen escenario, ambiente y evaluación funcionales, pero no se ha completado todavía su recorrido en una prueba automática |
| Backend conservado | `npm run test:online`: PASS. Autenticación, migración, ranking, contraseñas, salas, host, listos, mundo compartido, entradas, empujes, resultados, revancha, desconexión, caducidad y SQLite |
| Navegador / teclado | W actúa sólo en babor; O sólo en estribor; flecha derecha mueve el timón; indicadores RPM/marcha responden. Instrumentos ampliados y cámaras operativos |
| Navegador / viaje completo | Herramienta QA local ejecutó el mismo paso físico y de misión hasta la pantalla real de resultados: 96/100, 7 min 9 s de tiempo simulado, 1,68 kn máximos en aproximación, 0 colisiones, 0,38 m de error longitudinal, 1,32° de alineación, 2,04 m de banda, 6 cabos. Desbloqueo del nivel 2 persistió al volver a la selección |
| Navegador / arcade | Selector → perfil → menú → partida original → resultado → menú → centro náutico. Récord de la prueba conservado; interfaz antigua retirada al destruir Phaser. No se ejecutan dos motores gráficos a la vez |
| Pantallas pequeñas | Menú a 390×844, simulador a 844×390 en calidad reducida; palancas virtuales a +45% y −30%, timón 12°, indicadores avante/atrás, neutral, centrado y pausa comprobados. Es prueba de viewport e interacción en navegador, no prueba física en iPhone/Android |
| Producción | Build con `SITE_URL=https://pgs-programer.github.io/pixel-wake/` y URL real de backend: PASS. `verify:deploy`: PASS. Preview servido en `/pixel-wake/`: selector, puente, motor y pantallas cargan; consola sin errores ni advertencias en esa sesión |

La prueba del viaje en navegador **acelera el tiempo sólo en la página QA local**, enviando órdenes calculadas al mismo integrador de la partida. No cambia posiciones, velocidades, banderas de entrada ni puntuación para conseguir el resultado. No es una prueba de usabilidad de siete minutos realizada por una persona. El piloto de pruebas no existe en el producto ni es una ayuda desbloqueable.

## Repetir las verificaciones

```sh
npm ci
npm test
npm run test:online
npm run dev
```

Abrir `http://127.0.0.1:8080/` para jugar. El backend local es opcional para el simulador y necesario para perfil/ranking/1v1 local: `npm run server` en otra terminal. Si Vite elige otro puerto, usar la URL que imprime.

Prueba integrada del simulador en desarrollo: `http://127.0.0.1:8080/tests/simulator.browser.html`. Pulsar **INICIAR QA** y **TRAVESÍA COMPLETA QA**. La página se excluye del build y sus inspecciones están protegidas con `import.meta.env.DEV`. Para navegación ordinaria usar siempre la raíz del juego.

```sh
SITE_URL=https://pgs-programer.github.io/pixel-wake/ VITE_BACKEND_URL=https://pixel-wake-backend.pixel-wake.workers.dev npm run build
SITE_URL=https://pgs-programer.github.io/pixel-wake/ npm run verify:deploy
SITE_URL=https://pgs-programer.github.io/pixel-wake/ npm run preview
```

Preview de esta build: `http://127.0.0.1:4173/pixel-wake/`. Una build sin SITE_URL sigue siendo válida para preview local en la raíz. La prueba anterior de navegador del arcade se ha adaptado para entrar mediante el nuevo selector; no se presenta como reejecutada íntegramente en esta entrega.

## Dependencias, rutas y datos

Añadida únicamente Three.js `0.186.1` (MIT), sin servicios de pago ni nuevos secretos. `npm install --package-lock-only --ignore-scripts --offline` sincronizó la versión 3.0.0 del proyecto. Auditoría de npm: 0 vulnerabilidades al instalar. Se mantienen Phaser 4 y los scripts/Workflows de Pages y Cloudflare.

El selector inicial tiene un bundle propio pequeño. Phaser se importa al elegir arcade; Three.js, Water y el simulador al elegir atraque. Hay advertencias de Vite por tamaño de los motores (Phaser ≈1,35 MB y simulador/Three ≈618 KB sin gzip); no se han ocultado. La carga inicial del selector no descarga ambos motores.

El guardado `pixelWakeDockingV1` valida versión, niveles, resultados numéricos y preferencias. Los fallos de localStorage conservan el progreso de la sesión, pero pueden perderse al recargar. El progreso del simulador aún no se sincroniza entre dispositivos. No se renombran ni migran las claves del arcade.

## Archivos

`public/THIRD_PARTY_NOTICES.txt` conserva los avisos MIT de los dos motores en la distribución compilada.

- `src/platform/Platform.js`, `navigation.js`, `platform.css`: centro náutico, niveles, preferencias y ciclo de vida de cada modo.
- `src/simulator/physics/vessel.js`, `collisions.js`, `clock.js`: estado, actuadores, fuerzas, impulso y paso fijo.
- `src/simulator/world/harbor.js`: geometría física, puestos, bolardos y parámetros de las cinco misiones.
- `src/simulator/render/primitives.js`, `bridge.js`, `harborView.js`, `instruments.js`, `Renderer.js`: recursos originales y representación 3D.
- `src/simulator/missions/docking.js`, `tutorial.js`: criterios de atraque, cabos, evaluación y lecciones.
- `src/simulator/services/controls.js`, `audio.js`, `persistence.js`: teclado/puntero, Web Audio y progreso local.
- `src/simulator/ui/Hud.js`, `simulator.css` e `index.js`: presentación y coordinación del simulador.
- `tests/simulator.test.js`, `fixtures/dockingPilot.js`, `simulator.browser.html`: pruebas y herramienta local de recorrido completo.
- Modificados: `src/main.js`, `game/scenes/MenuScene.js` (regreso al centro), `game/ui/screen.js` (limpieza también al destruir el motor), README, package/lock, HTML, SEO y entrada de la prueba de navegador existente.

Las capturas están en `.checkpoints/simulator-evidence/`, fuera de Git. El checkpoint previo permanece intacto. El simulador conserva una estética 3D procedural; no se afirma fotorealismo, certificación naval ni validación en dispositivos físicos. Las limitaciones hidrodinámicas están enumeradas en el documento de diseño.
