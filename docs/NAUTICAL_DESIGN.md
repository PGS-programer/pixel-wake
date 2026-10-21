# Pixel Wake · PW–20, diseño e investigación

Consultado el 21 de octubre de 2026. Es un juego didáctico introductorio, no un simulador homologado. No está calibrado mediante pruebas de mar ni representa exactamente un barco comercial. El arcade original mantiene sus reglas y almacenamiento. El nuevo modo usa exclusivamente `pixelWakeDockingV1` para resultados y preferencias locales; no modifica el perfil remoto ni las monedas.

## Referencias verificadas

1. [Damen, ficha Stan Tender 1905](https://media.damen.com/image/upload/v1655839081/catalogue/pilot-tenders/stan-tender/stan-tender-1905/damen-product-sheet-stan-tender-1905.pdf). La ficha declara 19,2 m de eslora, 5,3 m de manga, calado máximo de 1,8 m; casco de acero, superestructura de aluminio, dos motores, reductoras y dos hélices de paso fijo. Sirve de referencia dimensional y de configuración. **No se usa su marca como nombre del barco ni se atribuye a Damen el comportamiento implementado.** No se copia su plano ni se importa su fotografía.
2. [Damen, serie Stan Tender](https://www.damen.com/vessels/high-speed-crafts/stan-tenders). Referencia visual del casco profesional, superestructura y visibilidad del puente. Nuestro interior es geometría original, no una reconstrucción de su consola. La cámara se sitúa en un puente cerrado con ventanas y puestos de banda.
3. [Wärtsilä, Rudder](https://www.wartsila.com/encyclopedia/term/rudder). Confirma que el timón genera fuerza transversal y momento al desviar flujo; situarlo detrás de las hélices mejora su efecto. Describe 35° como un ángulo convencional habitual y distingue timones especiales. Adoptamos **dos timones convencionales ligados a ±35°**, no timones Schilling, hélices azimutales ni waterjets. La tasa de 5°/s es un ajuste de nuestro actuador, no un dato comprobado de la Damen.
4. [Wärtsilä, Propeller](https://www.wartsila.com/encyclopedia/term/propeller-screw-propeller). Distingue paso fijo de paso controlable. El PW–20 usa hélices de paso fijo y marcha avante/neutral/atrás por reductora; no modifica el paso. El retardo de engranaje de 0,9 s es un parámetro didáctico, no una especificación de fabricante.
5. [Thor I. Fossen, Marine Craft Model](https://www.fossen.biz/html/marineCraftModel.html). Referencia matemática para separar coordenadas del casco y del mundo, fuerzas, inercias, amortiguamiento y corriente relativa en surge/sway/yaw. Implementamos una aproximación diagonal con acoplamientos de Coriolis conservativos; no se afirma implementar un modelo identificado MMG completo. Se integran velocidades y posiciones con paso fijo de 1/60 s.
6. [IALA R1001](https://www.iala.int/product/r1001/) y [documento oficial](https://www.iala.int/content/uploads/2022/05/C75-10.3.7-Revised-Recommendation-R1001-Ed2.0-The-IALA-Maritime-Buoyage-System-June-2022.pdf). Puerto ficticio en región A; sentido convencional de entrada desde el mar hacia el norte: roja cilíndrica a babor, verde cónica a estribor. No pretende representar un puerto ni carta náutica existente.
7. [IMO, amarre seguro](https://www.imo.org/es/ourwork/safety/pages/safemooring.aspx), [MCA MGN 592 (M+F), enmienda 2](https://www.gov.uk/government/publications/mgn-592-mf-anchoring-mooring-towing-or-hauling-equipment/mgn-592-mf-amendment-2-anchoring-mooring-towing-or-hauling-equipment-on-all-vessels) y [MCA COSWP, capítulo 26](https://assets.publishing.service.gov.uk/media/67e527b5a82c168e578c9b5a/12464_MCA_COSWP_BLACK_AND_WHITE_v3_0W.pdf). Las operaciones requieren tripulación, equipos adecuados, evaluación del entorno y protección frente a cabos en tensión. La tripulación del juego es una abstracción; no se enseña a manipular cabos reales. Se representan largos, esprines y traveses con sus puntos físicos y bolardos.
8. [Three.js, instalación](https://threejs.org/manual/pages/installation.html), [Water](https://threejs.org/docs/pages/Water.html), [sombras](https://threejs.org/manual/pages/shadows.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer). Motor libre instalado desde npm, cargado bajo demanda con Vite. Water proporciona una reflexión planar; calidad reducida evita ese segundo renderizado. Se liberan geometrías, materiales, texturas, eventos y contexto al salir del simulador.

## Hipótesis y fuerzas

PW–20: embarcación profesional ficticia de casco de semidesplazamiento, usada únicamente a velocidades de maniobra. La forma visible y sus coeficientes son propios. No se simula planeo ni se intenta reproducir los 27 kn de una variante real. Los mandos representan el rango de maniobra, no toda la curva de potencia de los motores de referencia.

Mundo: X este, Y norte. Rumbo 0 norte, positivo a estribor. Casco: u avante, v estribor, r giro a estribor. Unidades SI internas; pantallas convierten m/s a nudos y radianes a grados. En render: X este, Y arriba, Z sur.

Cada hélice produce `T = K · shaft · abs(shaft)`. Su brazo transversal es ±1,65 m, con `N = 1,65 (T_babor − T_estribor)`. No hay rotación directa por teclado. Babor avante y estribor atrás genera momento a estribor. No se permite ordenar desplazamiento lateral directo; éste emerge de fuerzas transversales, ambiente, inercia y contactos.

Los timones actúan a 7,4 m a popa del centro, sobre flujo longitudinal relativo al agua más una aproximación a la estela de cada hélice en avante. Su fuerza depende del cuadrado del flujo y del ángulo efectivo, con coeficiente de sustentación limitado. En reposo y sin hélices ni ambiente, mover el timón no genera giro. La eficacia en atrás se reduce al flujo del casco; no se modela detalladamente la estela inversa.

Se calculan resistencias lineales y cuadráticas distintas en cada eje; viento aparente sobre áreas frontal/lateral y momento de superestructura; corriente uniforme restada de la velocidad del casco para la resistencia y el timón. SOG y STW son distintos. La corriente no se añade mágicamente a la posición: acelera el casco por fuerzas relativas al agua.

Todos los valores no presentes en las fichas son **aproximaciones ajustables**, reunidas en `physics/vessel.js`: masa 60 t, masa efectiva longitudinal 66 t, lateral 96 t, inercia efectiva de giro 2,3·10⁶ kg·m², empuje máximo por hélice 18 kN avante / 11,5 kN atrás. Las áreas de viento y timones, amortiguamientos, respuesta de motores (1,6 s), brazos y separación de ejes no proceden de ensayos del buque. No deben extrapolarse a una embarcación real.

## Contactos y amarre

Casco rectangular orientado de dimensiones completas, colisionadores rectangulares del puerto, SAT y resolución por impulso en el punto de contacto, incluyendo inercia de giro y restitución baja. Defensas con restitución menor. Las boyas tienen una caja conservadora. No hay resistencia estructural ni daños de inundación; se penalizan velocidad, frecuencia y gravedad de contactos. Se registran eventos separados por 2 s para no contar cada frame de un roce como colisión nueva.

La entrada debe cruzarse de verdad por la bocana. El amarre exige banda entre 0,35 y 3,5 m, error longitudinal ≤ tolerancia de misión, ángulo <8°, |u|<0,22 m/s, |v|<0,12 m/s, |r|<0,008 rad/s, palancas neutrales y ejes casi detenidos. Debe mantenerse 3 s. La tripulación asegura 6 cabos secuencialmente durante 10 s. Si se pierde la posición segura, se aborta. Los cabos producen tensión elástica y amortiguamiento sólo cuando se aseguran; los extremos están anclados a cornamusas del barco y bolardos del muelle. Al acabar, queda amarrado. No se teletransporta al jugador al recuadro.

Esta simplificación omite holgura geométrica/catenaria, elasticidad no lineal de cabos, carga de rotura y trabajo real de marineros. Sólo sirve para visualizar las funciones básicas del arreglo de amarre.

## Misiones y evaluación

Cinco niveles jugables sobre el mismo puerto: calma/estribor, calma/babor, mayor precisión/estribor, hueco de 30 m y viento/corriente/babor. El primero está abierto; lograr ≥60 puntos desbloquea el siguiente. El jugador no se traslada al puesto al elegir una misión.

Nota 0–100 determinista: posición 25, alineación 20, contactos 25, velocidad final 20, uso de motores 10. Fórmulas explícitas en `missions/docking.js`; tiempo y contactos con defensas se informan aparte. No se premia correr ni se usa azar en la puntuación. Los consejos dependen de errores observados.

Tutorial en marcha: mirar, motores avante, neutral, atrás, timón y centrado, giro con potencias opuestas, entrada, aproximación y amarre. Avanza según acciones y estados reales. H oculta/muestra. Se puede jugar sin completar lecciones.

## Recursos y límites

La distribución incluye `public/THIRD_PARTY_NOTICES.txt` con los avisos y licencias MIT de Three.js y Phaser, también copiados a `dist/` en producción.

Toda la geometría del casco, puente, puerto, pantallas, carta del menú y normales de agua es original y generada en código local. Se investigaron referencias gratuitas; no se encontró necesario incorporar un modelo externo con una licencia o propulsión incompatible. No se descargan fotografías, fuentes, texturas ni sonidos esenciales de CDNs. Audio sintetizado localmente con Web Audio: dos motores ligados a RPM, ambiente ligado a velocidad/viento y señales de órdenes/contacto. Three.js: licencia MIT, conservada por npm. Phaser y el backend permanecen presentes.

Limitaciones: sin identificación hidrodinámica experimental, sin prop walk calibrado, sin interacción hélice/casco completa, sin squat/bank effects, sin marea ni oleaje 6DOF. Profundidad uniforme de 7,2 m, carta y radar esquemáticos sin clutter/AIS/ARPA, iluminación diurna, barcos del entorno estáticos. Balanceo visual mínimo no interviene en colisiones. La calidad reducida elimina reflejos planares y sombras. Esto no es una réplica fotorealista ni un equipo ECDIS/radar certificado.

## Arquitectura y recuperación

`platform/`: navegación y selección; `game/`: arcade intacto salvo botón de regreso; `simulator/physics/`: estado, fuerzas, contacto y reloj; `world/`: puerto/misiones; `render/`: Three.js, barco, instrumentación; `missions/`: tutorial, reglas de atraque y evaluación; `services/`: entrada, sonido, guardado; `ui/`: HUD y ventanas.

Vite conserva `base`, SEO, GitHub Pages y Worker existente. Three.js y Phaser se importan sólo al elegir su modo. El simulador no requiere cambios del servidor ni credenciales nuevas.

Checkpoint anterior: commit `186fec0` y archivo `.checkpoints/2026-10-21-before-simulator/source.tar.gz`, SHA-256 `51a28af526e2c5399e6eeb69c3d9382e69b2767507c8fd677b5a3646592181d8`. Extraer en una carpeta nueva. El archivo no contiene node_modules ni dist; ejecutar `npm ci`. Los guardados del navegador pertenecen al origen y no están en ese archivo.
