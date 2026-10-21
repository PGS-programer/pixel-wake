# Pixel Wake

[Jugar online](https://pgs-programer.github.io/pixel-wake/) · [Repositorio](https://github.com/PGS-programer/pixel-wake) · [Despliegue y SEO](docs/DEPLOYMENT.md)

**Versión 3.1 — Puerto mediterráneo:** el inicio permite elegir entre el arcade original y un simulador de atraque 3D en primera persona. El simulador incorpora un puerto compacto, embarcaciones amarradas, guía de atraque por colores y movimiento visual interpolado. El arcade conserva perfiles, ranking, garaje, combos, guardados y 1v1. El simulador funciona sin backend y usa una clave de progreso independiente. [Actualización del puerto y pruebas](docs/MEDITERRANEAN_HARBOR.md) · [Diseño naval, fuentes y límites](docs/NAUTICAL_DESIGN.md) · [Verificación inicial del simulador](docs/SIMULATOR_RELEASE.md).

Plataforma marítima hecha con JavaScript, Phaser 4.0.0, Three.js 0.186.1 y Vite. El arcade sigue navegando por la Costa Esmeralda, recogiendo monedas y encadenando pasos cercanos. Sus barcos y estelas siguen siendo cosméticos: comprar nunca cambia velocidad ni hitbox. El nuevo PW–20 permite practicar maniobras aproximadas de doble hélice; no es una herramienta de navegación real.

## Ejecutar

Requiere Node.js 22.13 o posterior (probado con Node 24).

```sh
npm install
npm run server # primera terminal: perfiles, ranking y 1v1
# en otra terminal:
npm run dev
```

Abre la dirección que indique Vite (normalmente http://localhost:8080). Los comandos no ejecutan la telemetría de la plantilla original.

```sh
npm test       # reglas, generador, colisiones y almacenamiento
npm run build # salida estática en dist/
```

`dev-nolog` y `build-nolog` siguen disponibles por compatibilidad. La publicación usa GitHub Pages para el juego y Cloudflare Workers con SQLite persistente para perfiles, ranking y 1v1. No requiere que el Mac permanezca encendido; se respetan los límites del plan gratuito.

## Controles

### Simulador de atraque

En el centro náutico, selecciona **Al mando del puente → Primer atraque**. El barco empieza fuera del puerto. Sigue la práctica guiada y la carta; entra entre roja a babor y verde a estribor, gira dentro de la dársena y aproxima al puesto E–02 por estribor. No hay piloto automático en el juego.

| Acción | Control |
| --- | --- |
| Motor de babor, aumentar/reducir | W / S, mantener |
| Motor de estribor, aumentar/reducir | O / L, mantener |
| Ambos mandos a neutral | N |
| Timón a babor / estribor | ← / → |
| Retorno progresivo a la vía | ↑ |
| Mirar sin cambiar rumbo | Arrastrar ratón o dedo sobre el exterior |
| Puente / banda babor / banda estribor / exterior didáctico | 1 / 2 / 3 / 4 |
| Acercar instrumentos | Z o rueda del ratón; botón para pantallas ampliadas |
| Ordenar amarre cuando se autorice | M o botón |
| Pausa / reanudar | P / Escape o botón |
| Mostrar/ocultar práctica guiada | H |

También puedes arrastrar las palancas físicas y el timón del puente. En móvil hay dos palancas virtuales independientes, timón, neutral, centrado, cámara y amarre. Horizontal deja más vista exterior; los menús funcionan en vertical. Desde **Opciones** en el centro náutico se eligen calidad gráfica, sonido y sensibilidad. La calidad reducida elimina reflejos planares y sombras; no cambia la física.

La flecha, la baliza y la carta indican el puesto y la banda. La zona es roja al estar lejos o aproximarse demasiado rápido, amarilla cuando faltan ajustes y verde únicamente cuando se puede ordenar el amarre. Aparece **POSICIÓN CORRECTA — LISTO PARA AMARRAR**; sigue siendo necesario pulsar M.

En las dos primeras misiones: alineación <16°, banda a 0,4–5,5 m, tolerancia longitudinal de 9/8 m, casi detenido, ambos mandos neutrales y ejes desacelerados durante 2 s. Se comprueban por separado avance, deriva, giro y velocidad total: una buena posición no autoriza amarrar con demasiada arrancada. Los niveles posteriores reducen estas tolerancias. La tripulación asegura seis cabos durante 10 s; perder la posición segura aborta la orden. La nota ≥60 desbloquea la siguiente de cinco misiones. El progreso del simulador es local y separado del ranking arcade.

### Arcade original

| Acción | Control |
| --- | --- |
| Zarpar desde el menú | Espacio o botón |
| Navegar | W/S o flechas arriba/abajo |
| Navegar en pantalla táctil | Mantener y arrastrar en el mar |
| Pausar / reanudar | P, Escape o botón de pausa |
| Reintentar al terminar | Espacio o botón |
| Volver al menú tras una partida | M o botón |
| Volver desde garaje, bitácora y ajustes | Escape o botón |
| Mostrar hitboxes | H durante la partida |

Al cambiar de pestaña o perder el foco, la partida se pausa; vuelve mediante una acción explícita. En móvil se recomienda orientación horizontal. Los menús tienen interfaz responsive en vertical. El gameplay requiere horizontal; girar a vertical pausa el modo individual.

## Sistemas

- **Océano procedural:** paleta esmeralda, oleaje con parallax, isla del menú, barcos con detalles y estelas reactivas. No depende de descargas de arte.
- **Nueve peligros:** roca pequeña, mediana y grande, boya, lancha, pesquero, velero, moto de agua y tronco. Canales y bancos de rocas combinan esas entidades. Tienen siluetas, variantes de color, sombras, espuma y estelas propias.
- **Dificultad:** velocidad inicial 220 px/s (+25,7 %), +18 por nivel, aceleración de 72 px/s², nivel cada 250 m y máximo 14.
- **Puntuación:** 12 m/s y 6 puntos/s a velocidad inicial, escalados por velocidad; una moneda añade 75 puntos.
- **Combo:** un paso cercano premia 100 × combo y renueva una ventana de 3 segundos. Se concede después de que el obstáculo pase completamente; cada obstáculo solo puede premiarse una vez.
- **Monedas:** recogida inmediata y saldo conservado entre partidas.
- **Misiones:** siete contratos permanentes, con progreso entre partidas y recompensas únicas. Las monedas de misiones se conceden al terminar la partida. La bitácora permite consultar todas las misiones, incluidas las completadas.
- **Insignias:** primera partida, combo x3, 1.000 m y 20 partidas. Combo x3 desbloquea la estela menta; 1.000 m desbloquea la dorada. Se equipan en el garaje.
- **Audio procedural:** interfaz, monedas, combo, nivel, impacto y recompensa. Requiere interacción para activarse; tiene volumen y silencio. Sin música de fondo ni recursos remotos.
- **Ajustes:** volumen, silencio y efectos suaves persistentes. Efectos suaves reducen partículas y desactivan sacudidas, líneas de velocidad y fundidos.

## Balance y cambios deliberados

La separación inicial trasladó literalmente los 39 métodos de partida y compiló antes de modificar el diseño. Después se introdujeron estos cambios:

- Inicio inmediato, sin cuenta atrás: monedas a unos 0,8 segundos y una roca que obliga a reaccionar antes de los 2 segundos si se mantiene el rumbo inicial. Tutorial breve superpuesto, sin detener el juego.
- Área vertical del barco entre y=110 e y=446 para separar el juego del HUD; obstáculos entre y=120 e y=435.
- Nueve patrones progresivos, alternancia sin repetición consecutiva y separación extra cada quinto encuentro. Las situaciones se programan por distancia recorrida, de modo que la velocidad también intensifica su frecuencia.
- Se permiten adelantamientos reales: no se teletransportan lanchas para mantener una separación artificial. Un validador comprueba el conjunto de peligros activos antes de aceptar cada nueva situación; las monedas tienen una ruta propia validada.
- RNG jugable con semilla independiente de las partículas. `?seed=42` reproduce una secuencia jugable si se mantienen los mismos pasos de simulación y controles. La semilla por sí sola no implementa repeticiones ni garantiza el mismo resultado entre tasas de frames distintas.
- Inclinación suavizada con delta y límite de 40 ms por actualización para evitar saltos tras una interrupción. El tiempo descartado no se recupera; bajo carga extrema la simulación puede ralentizarse.
- Selección del barco validada también contra desbloqueos en menú y partida.
- Se mantienen precios 0 / 25 / 75 / 150 y prestaciones idénticas. Las primeras dos misiones añaden 18 monedas: con las 9 recogidas requeridas, el saldo potencial llega a 27, suficiente para Riptide. El número real de partidas depende de la habilidad; no se ha validado con usuarios.

Se ha priorizado el control sencillo. No se añade impulso, inmunidad ni otra mecánica de combate en esta versión. Se añaden perfiles anónimos y ranking mediante backend propio; no se añaden anuncios, pagos ni rachas.

## Director y justicia

| Nivel / distancia | Nuevas situaciones | Velocidad objetivo |
| --- | --- | --- |
| 1 / 0 m | Slalom y monedas cerca de roca | 220 px/s |
| 2 / 250 m | Canal de boyas, escollos y troncos | 238 px/s |
| 3 / 500 m | Tráfico cruzado y velero | 256 px/s |
| 4 / 750 m | Pesquero seguido por lancha | 274 px/s |
| 7 / 1.500 m | Moto de agua con deriva | 328 px/s |
| 14 / 3.250 m | Todos los patrones, máxima intensidad | 454 px/s |

El barco se desplaza verticalmente a 420 px/s, sin inercia al soltar el botón; la inclinación visual sigue suavizada. La aceleración entre niveles dura 0,25 segundos. Los precios, hitboxes del jugador, puntos por moneda, bonus de combo y claves originales de guardado se mantienen.

El director usa una búsqueda de rutas en una malla de 4 px y pasos de 40 ms, con margen de 6 px y 120 ms sin movimiento al principio de la ruta. Comprueba segmentos continuos frente a los rectángulos barridos por los obstáculos, incluidos los extremos exactos de la deriva sinusoidal. Valida a la velocidad máxima (454 px/s); el movimiento lateral depende de la distancia del mundo, así que a velocidades inferiores hay más tiempo para recorrer la misma ruta. Rechaza el patrón cuando no encuentra una salida: no borra peligros ni mueve obstáculos para salvar al jugador.

Las monedas se aceptan solo si hay una ruta segura que recoge la secuencia. Además se comprueba que los obstáculos nuevos no invadan las monedas existentes. Si la recompensa propuesta no es segura, se omite esa secuencia. La prueba es conservadora: puede rechazar situaciones que una persona sí podría superar. No implica que cualquier decisión del jugador sea salvable.

El máximo es de 7 peligros activos al principio y 10 a partir del nivel 3, contando también los que aún están fuera de pantalla; la proximidad al jugador suele involucrar menos elementos. La recuperación añade 160 px de separación cada quinto encuentro. Si cuatro propuestas fallan, se deja un respiro de 100 px antes de intentarlo otra vez. Los vehículos móviles tienen un indicador de entrada y aparecen por delante del jugador.

La detección de choque y near miss analiza el movimiento relativo durante todo el frame, conserva la máxima cercanía del cruce y premia una sola vez al salir completamente. El combo sigue sin límite, con efectos de intensidad acotada para mantener la lectura. El impacto congela el mundo y muestra resultados tras 90 ms (inmediato con efectos suaves); Espacio permite reiniciar incluso durante ese impacto.

## Arquitectura

```text
src/
  main.js                 Arranque del DOM; inspector solo en desarrollo
  platform/               Centro náutico, selector de modos y misiones, navegación
  simulator/              Física naval, Three.js, puerto, tutorial, amarre y resultados
  game/
    main.js               Configuración y registro de escenas
    config.js             Dimensiones, balance y claves heredadas
    data/                 Barcos, obstáculos, misiones, insignias y progreso
    entities/             Construcción visual de los obstáculos
    scenes/               Menu, Game, Garage, Journal y Settings
    services/             Almacenamiento, progreso, preferencias y audio
    systems/              Director de patrones, rutas, obstáculos, monedas y efectos
    ui/                   Componentes, HUD y resultados
    visuals/              Océano, isla y barcos procedurales
```

Los sistemas exportan grupos de métodos aplicados al prototipo de GameScene; comparten el contexto de la partida. GameScene crea el estado y coordina el orden de actualización. Las reglas puras se prueban sin iniciar Phaser. No se incorpora otro framework.

La escena `scenes/Game.js`, `ui/button.js`, los PNG de `public/assets`, `screenshot.png` y `log.js` son restos inactivos de la plantilla original; se conservan, pero no participan en el juego ni en los scripts normales.

## Guardado compatible

Las cinco claves originales mantienen nombre y formato:

| Clave | Valor |
| --- | --- |
| pixelWakeHighScore | Récord de distancia, entero |
| pixelWakeBestPoints | Récord de puntos, entero |
| pixelWakeCoins | Saldo, entero |
| pixelWakeSelectedBoat | Identificador del barco |
| pixelWakeUnlockedBoats | Array JSON de identificadores |

Se añaden `pixelWakeProgressV1` y `pixelWakeSettingsV1`. Se mantienen las claves originales y sus formatos; el nuevo perfil incorpora sus valores y la sincronización actualiza esas mismas claves de forma compatible. El récord de distancia existente cuenta hacia misiones; no se inventan monedas recogidas, combos ni partidas anteriores. Las recompensas pendientes se liquidan al finalizar una nueva partida.

Las lecturas validan números, listas y preferencias. Si el almacenamiento está bloqueado o lleno, una copia en memoria conserva los cambios entre escenas de esa sesión. Al cerrar o recargar, lo que no pudo guardarse se pierde. Las claves heredadas siguen escribiéndose por separado; no hay una transacción atómica entre saldo, desbloqueos y perfil.

Los récords y las misiones se guardan al terminar; las monedas recogidas, al recogerlas. Salir desde pausa no liquida la partida ni guarda un nuevo récord. El almacenamiento es local a cada navegador/origen.

## Verificación

Consulta [docs/verification.md](docs/verification.md) para el alcance de las pruebas de esta versión. En desarrollo, `window.__PIXEL_WAKE__` permite inspeccionar escenas; esa asignación no se incluye en producción.

El proyecto conserva la licencia MIT de la base Phaser/Vite; consulta LICENSE. Los gráficos y el audio actuales se generan localmente mediante código.
