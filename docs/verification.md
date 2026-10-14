# Verificación de Pixel Wake

Este documento recoge las pruebas de la versión arcade del 12 de octubre. La ampliación de perfiles, ranking, 1v1 y móvil del 14 de octubre está documentada en [ONLINE_RELEASE.md](ONLINE_RELEASE.md).

Fecha: 12 de octubre de 2026.

## Automatización de reglas

`npm test`: **16 pruebas aprobadas**. Ejecuta pruebas con el runner incorporado de Node:

- Umbrales y máximo de dificultad.
- Bordes exactos de hitboxes.
- Premios y caducidad de combos.
- Detección real de near miss: candidato, salida completa y premio único.
- Pasos lejanos y colisiones sin premio de near miss.
- Colisiones y near misses entre los extremos de un frame.
- Apertura con tres monedas alcanzables y reacción antes de dos segundos.
- Rechazo de barreras completas y extremos de los obstáculos móviles.
- Rutas continuas comprobadas para 180 variaciones de los nueve patrones.
- 140 encuentros superpuestos, con validación de peligros y recompensas.
- Semillas reproducibles y combo por encima de x50.
- Liquidación de misiones sin modificar el perfil de entrada ni volver a premiar contratos reclamados.
- Desbloqueo de estelas.
- Datos corruptos de progreso y ajustes.
- Compatibilidad con saldo, lista de barcos y récord heredados.
- Fallback en memoria cuando lectura y escritura de localStorage fallan.

## Prueba de navegador

Chrome local en modo headless, mediante Playwright del entorno de trabajo, con un perfil aislado: no se usa ni modifica el guardado del navegador habitual del usuario.

Se comprueban menú, garaje y rechazo de compra sin saldo; inicio con Espacio; movimiento real de flechas; pausa que congela distancia y reanudación; recogida; combo; choque y game over; récords; monedas de misiones; compra de Riptide; selección de estela menta; recarga; bitácora; ajustes; ocho ciclos de salida y reinicio; un solo listener por control; pausa por pérdida de foco; entrada táctil mediante eventos reales de touch en un viewport móvil.

Para los hitos de puntuación y recompensas se inyecta un estado controlado mediante el inspector de desarrollo y se invocan los sistemas del juego. Esto comprueba la integración, pero no sustituye una partida completa realizada por una persona.

Se capturan menú, garaje, gameplay, pausa, resultados, bitácora, ajustes y vistas móviles para revisar la composición. Los fundidos deben terminar antes de evaluar la captura.

La última pasada de navegador terminó sin errores de JavaScript y verificó también la compilación de producción bajo `/release/`, sin solicitudes fallidas ni inspector de desarrollo. Se corrigió el recorte al girar la pantalla: en el viewport vertical 390 × 844, el canvas mide 390 × 219,375 y queda centrado sin exceder el ancho.

`npm run build` terminó correctamente. Vite mantiene un aviso por el tamaño del bloque de Phaser: 1.352,43 kB, 349,79 kB gzip; el código del juego ocupa 46,63 kB, 17,28 kB gzip. No se han ocultado avisos ni modificado límites para silenciarlos.

## Primera situación y carga máxima

Prueba adicional en Chrome con perfil aislado: una escena real, avances controlados de 16 ms y el barco en la línea de monedas de la apertura. Resultado: tres monedas, un near miss y combo x1 antes de los tres segundos, sin choque. Es una prueba de integración con control automatizado, no una valoración humana de diversión.

También se ejecutan 7.000 pasos (112 segundos simulados) al nivel 14 y 454 px/s, con efectos suaves activados, siguiendo las rutas completas calculadas por el validador. Se recorren los nueve patrones, con un máximo observado de 10 obstáculos activos y menos de 300 objetos de escena. No se mide FPS con esta simulación acelerada ni se presenta como una garantía de fluidez en un portátil físico.

Se revisa una captura de los nueve tipos de obstáculos para comprobar siluetas, estelas y contraste. La partida conserva el mismo ángulo de cámara.

## Límites

No se han probado dispositivos físicos, Safari ni Firefox. No se ha medido FPS en hardware objetivo ni evaluado la diversión con usuarios. La variante móvil vertical conserva la composición horizontal escalada; recomienda girar el móvil. El juego tiene un escenario y efectos de sonido sintetizados, sin música de fondo.

El generador usa una búsqueda conservadora de rutas, no una prueba exhaustiva de todos los estados posibles. Las pruebas cubren semillas y trayectorias concretas; el balance necesita playtesting humano.
