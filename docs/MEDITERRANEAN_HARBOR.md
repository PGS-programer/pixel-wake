# Puerto mediterráneo · versión 3.1

21 de octubre de 2026. Actualización sobre el simulador existente de `5ac1661`.

## Navegación conservada y suavidad

No se modifican `physics/vessel.js`, `physics/collisions.js`, `physics/clock.js` ni `services/controls.js`. Conservan empuje, masa, amortiguamiento, inercia, inversión de marcha, respuesta de los ejes, giro diferencial, timón, teclado y controles de cámara. El paso físico continúa siendo 1/60 s.

`PoseInterpolator` interpola exclusivamente la representación entre dos estados físicos, también al cruzar ±π de rumbo; nunca escribe en el estado. El coste temporal es como máximo un paso físico (16,7 ms), sin filtro adicional sobre los mandos. Se reinicia al pausar/reintentar. El cabeceo, balanceo y altura de las olas son sutiles y visuales; la cámara compensa la mayor parte de la inclinación. Se mantiene la precisión física de las maniobras a baja velocidad. La altura del ojo aumenta 10 cm para facilitar la vista exterior.

Una prueba de trayectoria de 120 s reproduce doce muestras previas con motores independientes, avante/atrás, neutral, timón, viento y corriente con tolerancia 1e−9. Otra verifica los hashes de los tres archivos de fuerzas/contactos/controles originales, para detectar cambios accidentales en esta entrega. La aceleración progresiva, inercia y retardo de inversión ya estaban en el integrador; no se duplican con retardos nuevos.

## Puerto y recursos

Dársena interior de 124 m de anchura y unos 148 m de longitud, bocana despejada de 60 m, diques cortos, muelles laterales, cantil norte y un pantalán pesquero separado de las primeras aproximaciones. Los mismos datos generan los obstáculos físicos, las embarcaciones estacionadas, la carta y el radar.

Se añaden barcos de pesca, veleros, recreo y trabajo; defensas, bolardos/cornamusas, escaleras, aros salvavidas, pasarela, farolas, bancos, lonja, edificios de estuco con persianas y tejas y una costa discreta con pinos. Los barcos amarrados tienen oscilación visual mínima y colisionadores estacionarios conservadores. Las dos primeras misiones mantienen su zona y aproximación libres de estos barcos. La misión avanzada conserva vecinos que reducen el hueco.

Todos los modelos, texturas de 128² y sonidos añadidos son originales, generados por código local. No hay modelos externos ni atribuciones de assets pendientes; no se añade dependencia, descarga de arte ni servicio remoto. Las licencias de Three.js y Phaser siguen incluidas en `public/THIRD_PARTY_NOTICES.txt`. Es un puerto ficticio inspirado visualmente en pequeños puertos mediterráneos, sin representar una instalación real.

Se mejora el agua con reflejo planar de 512², normales animadas y variación de color; cielo procedural con nubes, luz cálida, sombras y materiales de hormigón, madera, piedra, caucho y estuco. El ambiente Web Audio añade agua y llamadas discretas de gaviotas y respeta silencio/pausa. La calidad reducida elimina reflejo planar y sombras y reduce densidad de detalle y resolución, manteniendo los mismos objetivos y física.

Las piezas estáticas se agrupan por material y uso de sombras; las rocas usan instancias. Los cabos comparten una malla por embarcación con buffers reutilizados. El HUD actualiza texto a 10 Hz, la física permanece a 60 Hz y el render sigue `requestAnimationFrame`. Los mandos e instrumentos físicos no se agrupan con las piezas estáticas para conservar interacción y animación.

## Objetivos, colores y amarre

Las primeras dos misiones comienzan centradas a 43 m de la bocana, con tiempo tranquilo y sin corriente. Puestos amplios de 39/37 × 10,5 m, precisión longitudinal 9/8 m, banda de 0,4 a 5,5 m y alineación <16°. Se exigen velocidades reducidas: avance <0,28 m/s, deriva <0,16 m/s, giro <0,012 rad/s, velocidad total <0,33 m/s, ambos mandos neutrales y ejes desacelerados durante 2 s. Los siguientes niveles endurecen tolerancias y condiciones.

`missions/berth.js` es la fuente común de criterios para autorizar el amarre y mostrar la superficie, contorno, franja de cantil, carta y HUD:

- Rojo: lejos del puesto o acercándose con exceso de velocidad (>0,65 m/s dentro del entorno próximo).
- Amarillo: cerca, pero falta posición, velocidad, neutral o estabilidad suficiente.
- Verde: ha entrado al puerto, cumple todos los criterios y ha mantenido el tiempo seguro. Aparece **POSICIÓN CORRECTA — LISTO PARA AMARRAR**. También se mantiene durante el amarre seguro ya iniciado.

Una posición geométrica buena nunca basta si la embarcación lleva demasiada arrancada. No hay atraque automático: es necesaria la orden M o su botón. La tripulación tarda 10 s en asegurar seis cabos y aborta al perder las condiciones seguras.

La baliza elevada indica E–02/W–02 y la banda, una flecha discreta señala el objetivo respecto a la cámara y se muestra distancia. El marcado del agua no es una hitbox ni obliga a centrar exactamente el casco.

Los largos, esprines y traveses parten de las cornamusas modeladas en el barco y terminan en bolardos reales del costado correspondiente, con selección de puntos que conduce hacia fuera del casco. Los barcos decorativos usan puntos propios y anclajes de su muelle/pantalán. Los cabos tienen una pequeña catenaria visual aproximada; no hay dinámica completa de cuerdas.

## Verificación

- `npm test`: 39/39 PASS, incluidos los 31 previos. Recorridos completos con fuerzas y órdenes de motor en los primeros tres niveles; colisiones, persistencia, reglas arcade y navegación conservadas. Los niveles 4 y 5 tienen escenario y reglas, pero no se afirma una travesía completa automática en esta entrega.
- Navegador local, primera misión: aproximación por el integrador real, verde sin amarre automático; W activa sólo babor y cambia a amarillo/bloquea M; N recupera verde. Orden manual y pantalla real de resultados: 98/100, seis cabos, cero colisiones graves o de casco, un contacto con defensa, 2,07 m de error longitudinal, 0,57° y 1,94 m de separación. El recorrido previo está acelerado por la herramienta QA; el amarre manual final se observa en tiempo real. No equivale a una sesión de usabilidad humana.
- Evidencias locales: `.checkpoints/mediterranean-evidence/`; la página QA se excluye de producción y no se añade piloto al juego.
- Rendimiento en el navegador local, 1280×720, ventanas de 180 frames a tiempo real: alta ≈60 FPS, p95 17,7 ms, 495 llamadas de dibujo y 84.370 triángulos; reducida ≈60 FPS, p95 17,3 ms, 263 llamadas y 43.089 triángulos. Incluye pasadas de sombra/reflejo. Es una medición de este equipo, no una garantía de FPS ni una prueba física en teléfonos.
- Interfaz comprobada en 844×390 y 390×844: mandos virtuales independientes +45%/−30%, timón 12°, neutral, cámara, objetivo e indicador. Corregido el estiramiento vertical de los botones de cámara y la superposición entre tutorial e indicador al mostrar los mandos en horizontal.
- Build de producción con URL de Pages y backend real: PASS; `verify:deploy`: PASS. Preview en `/pixel-wake/`: selector → arcade → partida → resultado → menú con récord conservado → centro → simulador; carga y render del puerto correctos, sin avisos/errores de consola en la sesión. `npm run test:online`: PASS, incluido multijugador/SQLite. La prueba responsive se realiza en navegador, no en dispositivos iOS/Android físicos.

El bundle del simulador/Three.js queda en unos 652 KB (169 KB gzip), frente a unos 618 KB anteriores. El selector carga por separado Phaser o el simulador según el modo elegido. Vite mantiene su aviso por tamaño de los motores; no se ha ocultado.

Para repetir: `npm test`, `npm run dev` y abrir `/tests/simulator.browser.html`. **APROXIMACIÓN QA** se detiene antes de dar amarras; **TRAVESÍA COMPLETA QA** incluye la orden. La raíz sigue siendo la entrada normal al juego. No hay cambios de claves o formatos de guardado y no se modifica código del arcade, backend ni workflows.

## Checkpoint de recuperación

Antes de modificar nada se archivó el código de `5ac1661` en `.checkpoints/before-mediterranean-harbor/source.tar.gz`, excluyendo Git, dependencias, distribución, estado local y otros checkpoints. SHA-256: `1aa6b4d36d70bc3f60b8370443b7d71b18d143ebd574f718f7bec7d218e80191`.

Para inspeccionar o recuperar archivos sin sobrescribir el proyecto: extraer el archivo en una carpeta vacía y comparar/copiar lo necesario. El commit anterior permanece disponible en Git. Los checkpoints y capturas no se publican.
