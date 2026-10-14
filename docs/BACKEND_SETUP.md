# Backend gratuito: Node + SQLite + WebSockets

## Decisión

Se utiliza un servidor propio, con una sola dependencia de ejecución nueva (`ws`, MIT), y SQLite incorporado en Node. No requiere Supabase, cuentas de terceros, API de pago ni claves privadas de un proveedor. SQLite y WebSocket resuelven persistencia y tiempo real en el mismo proceso. Un servicio de base de datos por sí solo no sustituye una simulación autoritativa de empujes y choques.

El servidor puede ejecutarse gratis en un ordenador ya disponible. Para acceso público por Internet necesita una máquina accesible y HTTPS/WSS; no se ha contratado, configurado ni prometido alojamiento gratuito permanente. Un hosting exclusivamente estático no ejecuta este backend. Funciona con Node 22.13 o posterior; se ha probado con Node 24.21.0.

## Desarrollo local

```sh
npm install
npm run server
```

En otra terminal:

```sh
npm run dev
```

Abre **http://localhost:8080**. Vite envía `/api` y `/socket` al backend de `127.0.0.1:3001`, conservando el origen. No necesitas crear ningún `.env` para probar localmente.

**Conserva la URL anterior del juego** para migrar sus guardados: `localhost`, `127.0.0.1`, un puerto diferente y una IP de red son orígenes distintos para localStorage. Abrir otro origen no permite leer automáticamente los datos del primero.

El servidor escribe `server/data/pixel-wake.sqlite`. La carpeta está excluida de Git y del servidor de archivos de Vite. Los perfiles de las pruebas automatizadas usan bases temporales y navegadores aislados.

## Opciones

`.env.example` documenta la variable pública de Vite:

```dotenv
VITE_BACKEND_URL=
```

Vacía: mismo origen, opción recomendada. Para separar frontend y backend, usa el origen HTTPS del backend, por ejemplo `https://juego.example.org`, y vuelve a compilar. No es una clave secreta.

`.env.server.example` documenta las opciones privadas del proceso:

```dotenv
PORT=3001
HOST=0.0.0.0
DATABASE_PATH=server/data/pixel-wake.sqlite
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

Puedes copiar los ejemplos a `.env` y `.env.server` en tu instalación. Esta intervención solo crea ejemplos, sin credenciales reales. `npm run server` carga `.env.server` si existe. `ALLOWED_ORIGINS` admite una lista exacta de orígenes adicionales; no se usa `*`. El mismo origen se admite automáticamente.

## Probar desde un móvil

Conecta móvil y ordenador a la misma red. Arranca las dos terminales y abre en el móvil `http://IP_DEL_ORDENADOR:8080`. Autoriza el acceso en el firewall si el sistema lo pide. El frontend usa la misma IP/origen y Vite reenvía el WebSocket. Introduce un alias independiente en cada navegador; rota a horizontal antes de marcarte listo o pulsar Jugar.

Otra opción, sin Vite:

```sh
npm run build
npm run server
```

El servidor entrega `dist/` en `http://IP_DEL_ORDENADOR:3001`. Ese puerto constituye un origen distinto al de desarrollo y, por tanto, un guardado local distinto.

No se han verificado teléfonos físicos, redes de operador ni políticas de firewall concretas.

## Publicar por Internet

1. Usa una máquina propia o un alojamiento que permita procesos Node persistentes, disco persistente y upgrades WebSocket. Comprueba las condiciones actuales y los límites antes de elegir un proveedor.
2. Instala Node compatible, ejecuta `npm ci` y `npm run build`.
3. Mantén el backend con un supervisor de procesos. Conserva `DATABASE_PATH` en un volumen persistente; reiniciar una máquina con disco efímero perdería la copia del servidor.
4. Coloca un proxy HTTPS delante. Reenvía HTTP y `/socket` al mismo proceso Node, con soporte de `Upgrade` / `Connection` para WebSocket. No expongas Vite como servidor público de producción.
5. Mantén frontend, `/api` y `/socket` en el mismo origen. Si los separas, configura `VITE_BACKEND_URL`, los orígenes permitidos y recompila.
6. Respalda SQLite mediante una herramienta compatible con WAL o deteniendo el proceso antes de copiar la base. Copiar solo el `.sqlite` mientras hay escrituras puede omitir el WAL.
7. Verifica dos dispositivos reales y la latencia antes de dar el despliegue por terminado.

Ejemplo de bloque nginx, dentro de un servidor TLS configurado por el administrador:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
}
```

El certificado, dominio y proveedor no están configurados por esta tarea.

## Esquema real

Se crea automáticamente en `server/store.js`, sin pasos SQL manuales:

| Tabla | Campos |
| --- | --- |
| `profiles` | `id` PK, `token_hash`, `data` JSON, `revision` |
| `leaderboard` | `player_id` PK/FK, `player_name`, `best_score`, `best_distance`, `updated_at` |
| `match_results` | `round_id` PK, `room_code`, `host_id`, `guest_id`, `winner_id` nullable, `reason`, `finished_at` |

El JSON de perfil contiene alias, monedas, barco, desbloqueos, mejores marcas, partidas, partidas multiplayer, victorias, derrotas, progreso, ajustes y timestamp. Ranking tiene índices para ambas métricas. Se usan sentencias preparadas, transacciones y una fila única por jugador/resultado. No hay RLS porque no se expone SQLite al navegador: la autorización pertenece a la API.

Las salas son efímeras en memoria: código de seis caracteres, nombre, host/guest, salt y hash de contraseña, estado, seed, actividad, ronda y aceptaciones de revancha. No se guarda la contraseña ni se devuelve su hash. Caducan tras diez minutos sin actividad fuera de una partida; una ronda tiene un límite de treinta minutos. Reiniciar el backend cierra las salas y cancela las rondas en curso, conservando resultados ya confirmados.

## API y seguridad básica

- Identidad anónima: ID aleatorio y secreto de 256 bits. El cliente conserva el secreto localmente y el servidor solo su SHA-256. No se pide email ni nombre real.
- `POST /api/identity`: registro o autenticación de la identidad existente.
- `GET /api/profile`, `PUT /api/profile`: requieren `Authorization: Bearer ID.SECRETO`; revisiones detectan escrituras concurrentes.
- `GET /api/ranking?metric=score|distance`: ranking y posición propia, autenticados, sin secretos ajenos.
- `/socket`: autenticación en el primer mensaje, con plazo de cinco segundos; nunca en la URL.
- Orígenes permitidos, tamaños máximos, validación de nombres/números, rate limits de API y acciones de sala, límite de conexiones y heartbeat.
- Contraseñas de sala: scrypt con salt aleatorio y comparación de tiempo constante. Entre 4 y 64 caracteres; usar una contraseña más larga mejora su resistencia.
- Máximos de subida: 10.000.000 puntos, 1.000.000 m, 1.000.000 monedas/partidas. Se rechazan negativos, fracciones y números no finitos. Los mejores resultados son monotónicos; timestamps los establece el servidor. Una marca local que supere los límites de subida se conserva localmente y no se recorta para encajar en el ranking.
- Wins/losses y partidas multiplayer se calculan en el servidor y no se aceptan del cliente. El identificador de ronda evita premios repetidos. Los inputs de una ronda anterior se ignoran.

**Límite deliberado:** el ranking individual importa récords antiguos y resultados offline declarados por el cliente. Las validaciones y autenticación reducen abuso básico, pero no prueban que una puntuación se haya conseguido jugando. Un usuario que modifique su propio cliente puede falsificar una marca dentro de los límites. Para un ranking competitivo haría falta verificar replays/partidas en el servidor y separar marcas heredadas. El 1v1 sí resuelve movimiento, obstáculos, colisiones y ganador en el servidor.

La identidad anónima depende del secreto local: borrar todos los datos del navegador impide recuperar esa identidad solamente con el alias. No hay recuperación por email, contraseña de cuenta ni sincronización automática entre identidades distintas. No compartas el secreto ni los archivos de almacenamiento del navegador.

## Guardado y conflictos

Se conservan las cinco claves originales y sus formatos. `pixelWakePlayerV1` añade el perfil, `pixelWakeIdentitySecretV1` la credencial y `pixelWakeSyncPendingV1` el indicador de envío pendiente. Los guardados de misiones/ajustes siguen existiendo.

Los cambios se guardan localmente y se envían con debounce. Si falla Internet, continúan el modo individual y las compras locales; se reintenta al reconectar y cada treinta segundos mientras hay trabajo pendiente. No hay ranking global ni 1v1 offline.

Ante una revisión concurrente, se unen desbloqueos/insignias y se conservan los máximos de récords y progreso. Para evitar sumar dos veces un saldo, prevalece el saldo del servidor; el perfil local anterior completo se conserva en `pixelWakeSyncConflictBackupV1` y se informa del conflicto. No se promete combinar automáticamente dos economías offline concurrentes. El saldo de esa copia puede revisarse manualmente; no se elimina silenciosamente el estado anterior.

Si localStorage está bloqueado o lleno, el fallback en memoria permite continuar esa sesión, pero no garantiza persistencia tras cerrar o recargar.

## Pruebas

```sh
npm test
npm run test:online
npm run build
```

La segunda prueba abre sockets de loopback y crea/elimina una base temporal. Las pruebas unitarias normales no necesitan un servidor ya iniciado.

Prueba de navegador opcional, con Playwright instalado aparte:

```sh
npm run test:browser
```

Necesita Vite y backend en ejecución. Puede usar `PLAYWRIGHT_MODULE_PATH`, `CHROME_PATH`, `PIXEL_WAKE_URL`, `PIXEL_WAKE_PROD_URL` y `QA_OUTPUT_DIR`; no se añade Playwright como dependencia de producción. La prueba usa perfiles de navegador separados e inspección de desarrollo; no la ejecutes contra el guardado habitual.

Para prueba manual: Chrome normal e incógnito → alias distintos → crear sala y contraseña → entrar con código → ambos listos → host inicia → probar controles y empujes → choque → resultado → ambos Revancha. Cierra una de las sesiones durante la ronda y verifica el aviso y el resultado del rival.

Referencias técnicas: [SQLite de Node](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html) y [ws](https://github.com/websockets/ws).
