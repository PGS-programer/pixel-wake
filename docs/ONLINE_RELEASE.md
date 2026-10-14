# Pixel Wake 2.0 — perfiles, ranking, 1v1 y móvil

Fecha: 14 de octubre de 2026.

## Estado

Implementado en el proyecto local, con backend propio ejecutable. Verificado mediante reglas, SQLite, conexiones WebSocket reales y dos contextos aislados de Chrome. No desplegado por Internet. No verificado en teléfonos físicos ni con latencias de operador.

Antes de editar: inspección de escenas, sistemas, persistencia y configuración; build de la versión anterior correcto; checkpoint completo y comprobado en `.checkpoints/pixel-wake_2026-10-14_before-online/`. SHA-256 del archivo: `0854b1183c7a24d2a503e04e8c95d284e643945a68af72f4dca8d301e7a07f25`. Los backups anteriores permanecen intactos. El backup del proyecto no incluye localStorage.

## Arquitectura final

```text
src/shared/profile.js               Validación común de perfil/nombre/límites
src/game/scenes/                    Escenas Phaser, incluidas las cinco nuevas
src/game/services/player.js         Perfil local, migración, cola y sincronización
src/game/services/shop.js           Compra/selección para el garaje táctil
src/game/multiplayer/network.js      Transporte y eventos del cliente
src/game/multiplayer/simulation.js   Física y reglas autoritativas, sin Phaser/DOM
src/game/ui/screen.js                Pantallas DOM accesibles y formularios
src/game/ui/mobile.js                Controles y orientación
src/game/ui/mobileMenus.js           Garaje, bitácora y ajustes táctiles
server/index.js                     HTTP, archivos dist, autenticación WebSocket
server/rooms.js                     Salas, lifecycle, reloj y resultados
server/store.js                     SQLite, autorización, ranking y transacciones
```

Single-player conserva su escena y lógica. Multiplayer comparte catálogo, patrones, búsqueda de rutas, generador con semilla, geometría de obstáculos, helpers de colisión, barcos, gráficos y efectos. El servidor añade coordinación de dos jugadores y empujes; no se duplica una segunda colección de obstáculos/renderers.

## Perfil y migración

Primera apertura sin perfil: formulario obligatorio de alias de 3–15 caracteres, con normalización NFKC y validación tanto local como en servidor. No pide datos personales. Se genera ID y secreto aleatorios, conservados localmente. Los cinco guardados heredados se incorporan al perfil; siguen existiendo con sus nombres/formato. Misiones y ajustes también se conservan.

El perfil muestra monedas, mejores marcas, partidas y resultados 1v1. Las partidas multiplayer se cuentan también si terminan en empate; solo una victoria/derrota confirmada incrementa wins/losses. Los cambios individuales y compras se guardan localmente. Si falla el backend, el modo individual sigue disponible y la subida se reintenta.

La sincronización usa revisiones. Al detectar conflicto guarda la copia local anterior, une desbloqueos/progreso y conserva máximos; el saldo del servidor prevalece para evitar duplicaciones. El caso de dos economías offline concurrentes requiere revisión del backup local y se explica en `BACKEND_SETUP.md`.

## Ranking

Una fila por ID, diez mejores y posición propia. Principal: puntos; alternativo: distancia. Marcas monotónicas, timestamps del servidor, orden estable y consultas SQL preparadas. Solo el propietario autenticado actualiza su perfil. Se rechazan valores negativos, no finitos, fraccionarios o por encima de límites.

**No es un ranking con anti-cheat completo:** los récords heredados y offline son declaraciones del navegador. Su autenticación/validación básica no demuestra una partida real. Esa limitación aparece en la documentación del backend. Las puntuaciones 1v1 no reemplazan el ranking individual.

## Salas y sincronización

Crear con nombre opcional y contraseña obligatoria de 4–64 caracteres. Código `PW-` más seis caracteres. Contraseña derivada con scrypt y salt; no se guarda ni transmite a otros jugadores en claro. La API/sala usa la identidad autenticada, con rate limits y errores de sala inexistente, contraseña incorrecta, sala llena y permisos insuficientes.

Dos jugadores deben marcarse listos. Solo el creador inicia. El servidor elige la seed y resuelve el mundo a 60 Hz, enviando snapshots a 20 Hz. Ambos reciben los mismos obstáculos y velocidades. El cliente envía dirección/secuencia/ronda; predice su barco y reconcilia el estado confirmado. El rival se interpola y los obstáculos se extrapolan de forma limitada. No se envían 60 paquetes por segundo ni RNG independientes.

**Decisión de arquitectura:** el creador es host del lobby, pero el proceso Node es autoridad de la partida. Esto evita que el host del navegador pueda decidir libremente choques y ganador. El servidor comprueba rutas para ambos barcos antes de añadir una situación. No se añade migración de host; su salida termina la ronda y cierra la sala.

## Empujes, ganador y revancha

Barcos en el mismo plano y x común: acercarse verticalmente provoca separación a 28 px entre centros, impulso de 125 px/s amortiguado y cooldown de 350 ms. El contacto entre barcos no mata; el desplazamiento puede llevar a un obstáculo. Hay splash, sonido y microshake respetando efectos suaves.

Cada jugador tiene combo y puntos propios. El near miss usa el helper de movimiento relativo durante el frame. Se desactivan monedas en 1v1 para centrar la competición; las monedas individuales permanecen.

El último barco vivo gana. El primer choque abre una ventana de empate de 250 ms durante la que el rival sigue simulándose. Una ronda tiene ID único y el resultado se guarda en transacción una sola vez. Desconectar durante la ronda concede victoria al rival; heartbeat detecta conexiones rotas. Tras terminar: revancha si ambos aceptan, vuelta al lobby o salida. La revancha reinicia seed, entidades, combos e inputs; se ignoran inputs de rondas anteriores.

## Móvil

Menú principal, perfil, ranking, salas y lobby usan DOM/CSS responsive. Garaje, bitácora, ajustes, pausa y resultados tienen versiones táctiles. Inputs de 18 px y botones de al menos 46 px en esos menús; controles de navegación de 60 px. Safe areas y altura dinámica del viewport.

Gameplay conserva 960×540, Scale.FIT y ratio sin deformar hitboxes. Botones ▲/▼ con Pointer Events, captura/cancelación, respuesta inmediata y soporte de varios dedos; también se mantiene arrastrar en el mar. W/S y flechas siguen disponibles. El teclado virtual se usa con inputs HTML normales y las teclas de formularios no se interceptan como controles del juego.

En vertical se bloquea el inicio individual y el estado listo del lobby. Si se gira durante single-player, se pausa y aparece la cubierta de rotación. El 1v1 no pausa globalmente al girar o perder foco: deja de enviar dirección activa y exige volver a horizontal para controlar; la competición del rival continúa. No se puede garantizar la misma UX en Safari/iOS sin una prueba física.

Partículas limitadas y destruidas, efectos suaves configurables, obstáculos fuera de pantalla eliminados, historiales de inputs/near misses acotados y listeners retirados al salir de escena. No se añaden filtros WebGL caros.

## Verificación realizada

- `npm test`: 21 pruebas aprobadas. Incluyen las reglas previas, nombres/límites, simulación determinista, combos independientes, empujes, empate y ganador, mejores marcas, revisiones y resultados idempotentes en SQL.
- `npm run test:online`: aprobado. Backend real con DB temporal y tres sockets: identidad, credenciales incorrectas, ranking, números inválidos, contraseña/hash, errores de sala, host/listos, mundo compartido, inputs, empuje, resultado, estadísticas, revancha, desconexión, caducidad y lectura persistente de SQLite.
- Chrome/Playwright, dos contextos aislados: alias inválido/válido, migración de 75 monedas + Riptide + 2.000 puntos, recarga, ambos rankings, partida individual, recogida, pausa, game over, garaje y compra, creación/unión con contraseña errónea, lobby, seed común, movimiento con teclado, empuje real, resultado, revancha y desconexión. El perfil registra una victoria y una derrota en esa secuencia.
- Emulación móvil: menús en 390×844, bloqueo de Jugar en vertical, garaje táctil, cambio a 844×390, eventos touch reales sobre botones y pausa/cubierta al volver a vertical.
- Single-player con todas las llamadas API bloqueadas: inicia y avanza sin backend.
- Producción servida por Node: creación de perfil y ranking, sin solicitudes fallidas; sin inspector `window.__PIXEL_WAKE__`.
- Sin errores de JavaScript (`pageerror`) en esas pruebas de navegador.
- `npm run build`: correcto con Phaser 4 y Vite 6.4.4. Persiste el aviso de tamaño del bloque Phaser (~1,35 MB); no se ha ocultado.
- Auditoría de npm después de actualizaciones compatibles: cero vulnerabilidades reportadas en esta instalación.

La prueba individual coloca el barco en la línea inicial para verificar recogida; las pruebas de backend fuerzan algunos estados internos para comprobar resultados. El navegador también comprueba empujes y choque mediante inputs reales. No se presenta esto como playtesting humano.

## No verificado / límites

Internet público, HTTPS/certificado/dominio, dos dispositivos físicos, Safari/Firefox, iOS/Android reales, redes con pérdida de paquetes y altas latencias, ni 60 FPS sostenidos en hardware objetivo. Predicción y reconciliación son simplificadas y necesitan ajuste con latencia real. Rooms funciona en un único proceso con límite de conexiones; no es un servicio distribuido de matchmaking. No hay cuentas recuperables por email, anti-cheat para single-player ni combinación automática de identidades de navegadores distintos.

## Comandos y configuración

Desarrollo: `npm install`, `npm run server` y, en otra terminal, `npm run dev`. Producción local: `npm run build` y `npm run server`. Pruebas: `npm test`, `npm run test:online`, y opcional `npm run test:browser` con Playwright aparte.

La guía completa de backend, esquema, variables, seguridad, móvil en LAN, publicación y prueba manual con normal/incógnito está en [BACKEND_SETUP.md](BACKEND_SETUP.md). Solo se crean `.env.example` y `.env.server.example`, sin claves reales.


## Archivos creados

- `.env.example`
- `.env.server.example`
- `docs/BACKEND_SETUP.md`
- `docs/ONLINE_RELEASE.md`
- `server/index.js`
- `server/rooms.js`
- `server/store.js`
- `src/game/multiplayer/network.js`
- `src/game/multiplayer/simulation.js`
- `src/game/scenes/LobbyScene.js`
- `src/game/scenes/MultiplayerGameScene.js`
- `src/game/scenes/MultiplayerMenuScene.js`
- `src/game/scenes/ProfileScene.js`
- `src/game/scenes/RankingScene.js`
- `src/game/services/player.js`
- `src/game/services/shop.js`
- `src/game/ui/mobile.js`
- `src/game/ui/mobileMenus.js`
- `src/game/ui/screen.js`
- `src/shared/profile.js`
- `tests/backend.integration.js`
- `tests/browser.integration.cjs`
- `tests/multiplayer.test.js`

## Archivos modificados

- `.DS_Store`
- `.gitignore`
- `README.md`
- `docs/verification.md`
- `package-lock.json`
- `package.json`
- `public/style.css`
- `src/game/main.js`
- `src/game/scenes/GameScene.js`
- `src/game/scenes/GarageScene.js`
- `src/game/scenes/JournalScene.js`
- `src/game/scenes/MenuScene.js`
- `src/game/scenes/SettingsScene.js`
- `src/game/services/storage.js`
- `src/game/ui/kit.js`
- `src/game/ui/runResults.js`
- `src/main.js`
- `vite/config.dev.mjs`

También se regenera `dist/` mediante Vite; `node_modules/` y el lockfile reflejan la dependencia ws y las actualizaciones compatibles de seguridad.
