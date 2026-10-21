# Aurea 24 · versión 3.2

Actualización del 21 de octubre de 2026 sobre `8941504`. Conserva el simulador, el arcade, los cinco niveles desbloqueables, el guardado y el despliegue existentes.

## Yate y puente

Modelo original de 24 m por 6,2 m: casco blanco perlado generado por secciones con quilla, pantoque y proa afinada; banda acristalada, cubierta de teca, solárium de proa, terraza de popa, plataforma de baño, escaleras laterales, cubierta superior y arco de radar. El puente incorpora cristales amplios, montantes finos, consola de cuero oscuro con acento metálico, tres pantallas operativas, rueda y dos palancas 3D que se pueden arrastrar. La cámara está dentro del nuevo puente a 5,65 m, con vistas de banda y controles originales.

Como referencia de proporciones de yates modernos se consultó la [ficha oficial del Sunseeker 76 Yacht](https://www.sunseeker.com/es/yachts-and-boats/yacht/76-yacht), que publica 23,60 m de eslora y 5,95 m de manga. Aurea es un diseño ficticio propio; no es un modelo de ese fabricante, no copia sus planos, imágenes o logotipos y no reproduce sus prestaciones.

La malla del casco se genera en `render/yachtGeometry.js` y se mantiene dentro de la envolvente de colisión. Las cornamusas modeladas y los seis cabos comparten sus posiciones en `world/moorings.js`; sus alturas de unión se adaptan a la cubierta nueva.

## Marina e inicio inmediato de la maniobra

Dársena interior de 100 m de ancho y 116 m entre la bocana y el cantil norte, frente a 124 × 148 m de la versión 3.1. Muelles, pantalanes y cinco fingers con flotadores y cornamusas tienen colisiones. Los fingers separan los puestos del norte; no invaden las aproximaciones fáciles. La flota estacionada incluye veleros, dos yates de recreo, embarcación de servicio, lancha y llaüt.

Se añaden pedestales de agua/electricidad, mangueras, números de puesto, defensas cilíndricas colgadas, bolardos, escaleras, salvavidas, paseo sobre una ribera conectada con colisiones, club náutico acristalado, oficina y terraza. La costa es un terreno continuo con relieve y colores por altura; palmeras y parasoles sustituyen la composición de edificios y colinas genéricos anterior. Las texturas del pavimento usan escala local coherente, evitando estirar una imagen por toda la longitud del muelle.

Los cinco niveles comienzan dentro de la dársena, sin navegación abierta previa, a menos de 40 m del amarre. En los primeros dos, la distancia directa es 31,65 m (antes unos 128 m). El rumbo inicial oblicuo invita a corregir y combinar hélices desde el inicio. Se conserva espacio para virar y abortar una aproximación.

La misión reconoce el inicio dentro del puerto mediante su posición configurada; no obliga a salir y volver a cruzar la bocana. No regala el atraque: la posición inicial no cumple criterios de amarre. Se conservan tolerancias progresivas, límites de velocidad/deriva/giro, neutral y estabilidad, colores rojo/amarillo/verde y orden manual M. Los cabos se aseguran durante 10 s; un movimiento inseguro sigue abortando la secuencia.

## Física y fluidez

Únicos parámetros físicos cambiados: `VESSEL.length` de 19,2 a 24 m y `VESSEL.beam` de 5,3 a 6,2 m, para que colisiones y evaluación correspondan al nuevo casco. Se mantienen masa, inercias, empuje, retraso de los motores, retardo de inversión, reductoras, timón, arrastre, corriente, viento y ecuaciones. No es una calibración hidrodinámica nueva ni un modelo validado del comportamiento real de un superyate.

Una prueba protege el código anterior de fuerzas normalizando únicamente esos dos valores y el comentario de cabecera; otra reproduce la trayectoria de referencia de 120 s a tolerancia 1e−9. `collisions.js`, `controls.js` y `clock.js` permanecen intactos. La embarcación necesita más espacio por su eslora y manga mayores, sin cambiar cómo se accionan los mandos.

Se conserva el paso físico fijo de 60 Hz y la interpolación de posición, rumbo, timón y oleaje visual. Ahora también se interpolan las palancas, ejes y RPM visibles entre estados. La representación devuelve copias y no filtra ni escribe las órdenes del jugador. No se introduce un retardo adicional al control. La vista exterior recupera su campo de visión normal al salir de un zoom, para encuadrar todo el yate.

## Gráficos y rendimiento

Pintura con clearcoat, vidrio, metal, cuero, tejido y teca con juntas y veta se diferencian mediante materiales. Cielo más claro, iluminación equilibrada y reflejos del agua. Las ondas combinan direcciones y escalas; el mapa normal usa filtrado lineal, mipmaps y anisotropía para evitar vibración y dibujo en cuadrícula a distancia. Los reflejos planares siguen limitados a 512² en alta; en reducida se omiten reflejo planar y sombras.

Geometría estática agrupada por material, rocas instanciadas y cabos con buffers reutilizados. No se añaden librerías, modelos externos ni texturas descargadas. El arte y los sonidos siguen generados localmente; los avisos de Phaser y Three.js se mantienen en la distribución.

## Verificación

Las pruebas cubren geometría visual frente a dimensiones físicas, posiciones iniciales libres de colisión, proximidad de todos los objetivos, separación de fingers y barcos, interpolación sin mutaciones, controles y trayectoria conservados, reglas de atraque, colores, cabos y guardado.

`npm test`: 44/44 PASS. `npm run test:online`: PASS (perfiles, ranking, salas, simulación compartida y SQLite). Compilación de producción y `verify:deploy` con las URLs reales de Pages/backend: PASS. Bundle del simulador/Three.js de unos 659 KB, 171 KB gzip (unos 7 KB/2 KB más que en 3.1); sin dependencias nuevas. Se conserva el aviso de Vite por tamaño de los motores.

Navegador, 1280×720, muestra de 180 frames a tiempo real: alta ≈60 FPS, p95 17,7 ms, 310 llamadas de dibujo, 107.810 triángulos; reducida ≈60 FPS, p95 17,6 ms, 167 llamadas, 53.758 triángulos. Son mediciones locales de este equipo, no una garantía para todos los dispositivos. La calidad reducida y los controles virtuales se comprueban a 844×390 y 390×844; no es una prueba física en iOS/Android.

En el navegador se comprobaron W/O independientes, timón, neutral, selección/arrastre de la palanca física, cámaras y zoom. Tras aproximación QA, el verde aparece sin dar amarres. La orden manual completa la pantalla real de resultados: 97/100, seis cabos, cero colisiones o contactos con defensas, 0,87 m longitudinales y 0,06°; el nivel 2 queda desbloqueado y persiste al volver al selector. El tramo QA previo acelera el tiempo, el amarre manual final ocurre a tiempo real. Capturas en `.checkpoints/superyacht-evidence/`.

Recorridos completos de los primeros tres niveles, usando sólo órdenes de motor y el integrador real: 97/97/99 puntos, cero contactos, seis cabos. Los primeros dos recorren unos 39,5 m y tardan unos 214 s de tiempo simulado con el piloto de prueba conservador; el tercero, unos 54 m y 284 s. No son tiempos garantizados para una persona. La secuencia de amarre de los cinco niveles también se prueba desde una posición segura, con su viento/corriente reales. Los niveles 4 y 5 no se presentan como recorridos completos validados por el piloto automático de QA.

La versión de producción se comprobó en `/pixel-wake/`: selector → arcade con perfil/récord conservado → partida → resultados → menú → centro náutico → nuevo yate. Cámaras, zoom y render completos; consola sin errores ni avisos en esa sesión. No se modifican fuentes del arcade ni del backend.

El piloto se utiliza sólo en pruebas y en `/tests/simulator.browser.html`, página excluida del build. No cambia posiciones, velocidades ni banderas para lograr el resultado. **APROXIMACIÓN QA** se detiene antes de la orden de amarre, permitiendo comprobar el verde y dar M manualmente.

## Recuperación

Checkpoint anterior, creado con el árbol limpio en `8941504`: `.checkpoints/before-superyacht/source.tar.gz`. SHA-256: `949b450dae03fbf22f841203e383b3c8c8b87da86f356654b379ebdbf43d6a94`.

Excluye Git, dependencias, distribución, estado de Wrangler y otros checkpoints. Extraer en una carpeta vacía permite comparar o recuperar archivos sin sobrescribir el proyecto. Los checkpoints, capturas y datos locales no se publican.
