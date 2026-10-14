# Publicación de Pixel Wake

## Arquitectura

Frontend: GitHub Pages, URL configurada por GitHub: **https://pgs-programer.github.io/pixel-wake/**.
Repositorio: **https://github.com/PGS-programer/pixel-wake**.

Backend público: **https://pixel-wake-backend.pixel-wake.workers.dev**.

Backend: Cloudflare Worker con un Durable Object de SQLite. Comparte las mismas clases de salas, reglas, simulación y consultas de perfil/ranking que el servidor Node. Solo cambia el transporte HTTP/WebSocket y el adaptador de almacenamiento. El servidor Node local sigue disponible y se prueba aparte.

GitHub Pages no ejecuta Node ni WebSockets. Cloudflare añade esos servicios sin depender del Mac y sin sustituir el progreso por almacenamiento efímero. El despliegue completo requiere una cuenta Workers Free autorizada; no se activa Workers Paid ni se contrata un disco de pago. En Workers Free, exceder cuotas produce errores, no convierte el servicio en capacidad ilimitada. Consulta los límites actuales: https://developers.cloudflare.com/durable-objects/platform/pricing/.

El Durable Object es único para este proyecto académico, con máximo de 100 conexiones. Las rondas/salas son efímeras como en Node; perfiles y resultados confirmados están en SQLite persistente. Reiniciar/desplegar puede cerrar rondas activas, pero no borra perfiles ya guardados. No se ha implementado despliegue sin interrupción de una ronda ni escalado distribuido.

## Variables

- `SITE_URL`: URL absoluta HTTPS del frontend. El workflow la toma de `actions/configure-pages`, no la deduce de un nombre supuesto.
- `VITE_BACKEND_URL`: origen HTTPS del Worker. Es público y se configura como variable del repositorio antes de compilar.
- `CLOUDFLARE_ACCOUNT_ID`: ID público de cuenta, usado al desplegar.
- `CLOUDFLARE_API_TOKEN`: **secreto** de GitHub Actions para despliegues futuros del backend. No se incluye en archivos ni en el frontend. El login local de Wrangler no sustituye un token permanente de CI.
- `CLOUDFLARE_BACKEND_AUTO_DEPLOY=true`: activa el workflow del backend cuando el token restringido ya está configurado. Sin ese ajuste, el job se omite y el backend se actualiza con `npm run backend:cloud:deploy` desde una sesión autorizada.

No se deben subir `.env`, `.dev.vars`, `.wrangler`, SQLite, backups ni credenciales OAuth. El checkpoint completo contiene estado privado local y permanece excluido.

## Actualizaciones

Frontend: commit y push a `main` → pruebas y build → comprobación de canonical/assets/robots/sitemap → GitHub Pages. Mantiene la misma URL. El workflow usa permisos mínimos de lectura y publicación de Pages, environment `github-pages` y concurrencia controlada.

Backend: automatización activada. El secreto `CLOUDFLARE_API_TOKEN` está configurado en GitHub Actions y limitado a `Workers Scripts: Edit` de la cuenta elegida. No tiene permisos de DNS, facturación ni administración de tokens. Se creó con autorización del propietario, sin copiarlo al código ni a archivos locales. El workflow se ejecuta al cambiar los archivos de backend/reglas incluidos en sus filtros; también admite ejecución manual. Revocar el token detiene futuros despliegues automáticos, pero no elimina la versión publicada.

Primer despliegue automático del backend confirmado: https://github.com/PGS-programer/pixel-wake/actions/runs/38576484356 (PASS).

```sh
npm install
npm test
npm run test:online
SITE_URL=https://pgs-programer.github.io/pixel-wake/ npm run build
SITE_URL=https://pgs-programer.github.io/pixel-wake/ npm run verify:deploy
npm run preview
```

Prueba del adaptador Cloudflare:

```sh
npm run backend:cloud:dev
# otra terminal:
node tests/cloud.integration.js
```

`BACKEND_TEST_URL` permite ejecutar esa prueba contra un Worker real. Crea perfiles de QA en ese backend; no se deben confundir con jugadores reales.

## SEO e indexación

`index.html` incluye title, description, robots, Open Graph, Twitter y contenido semántico en la sección accesible «Sobre Pixel Wake». Ese contenido también es útil a visitantes y no es texto oculto para manipular resultados. Se oculta el botón plegado durante la navegación para no tapar controles; puede abrirse desde los menús. El nombre se mantiene; la búsqueda preliminar encontró otros usos de «Pixel Wake», pero no demostró un competidor dominante del mismo arcade. Se añaden términos descriptivos como retro ocean runner y juego de barcos sin prometer posiciones.

La compilación con `SITE_URL` añade canonical, URL/imagen absolutas, datos `VideoGame`, robots y sitemap con la URL real. Sin `SITE_URL`, el build local no inventa enlaces; `verify:deploy` rechaza una publicación sin URL. Los iconos y la imagen social se generan localmente. El manifest es una mejora móvil; no se añade un service worker que pueda servir versiones antiguas ni se promete instalación/offline completo.

**GitHub Pages de proyecto:** el archivo del juego está en `/pixel-wake/robots.txt`, pero Google consulta robots en la raíz del host (`https://pgs-programer.github.io/robots.txt`). Un 404 en esa raíz normalmente no bloquea rastreo. Se comprueba también la raíz; no se presenta el robots de subcarpeta como sustituto de la política del host.

## Search Console

Propiedad recomendada: prefijo de URL `https://pgs-programer.github.io/pixel-wake/`. No se puede verificar el dominio completo `github.io` ni modificar su DNS.

Propiedad verificada el 14 de octubre de 2026 mediante la etiqueta HTML real suministrada por Google. Mantener la etiqueta `google-site-verification` de `index.html` para conservar la verificación.

El sitemap se ha enviado. Su URL devuelve HTTP 200 y XML válido; Search Console inicialmente mostró «No se ha podido obtener». Se reenvió tras comprobar la disponibilidad. Ese estado de Google requiere una nueva lectura: no se presenta como sitemap procesado correctamente.

La solicitud de indexación de la página principal está confirmada por Search Console: «Se ha solicitado la indexación» y URL añadida a la cola de rastreo prioritaria. La inspección todavía indica «La URL no está en Google». No se garantiza cuándo cambiará ni una posición en resultados.

## Validación del despliegue público

- Build y comprobación de assets/canonical/robots/sitemap: PASS, también en GitHub Actions.
- HTTPS frontend y backend: HTTP 200 con validación TLS normal.
- Navegador público: alta de alias, menú, garaje, partida individual, resultado, perfil online, ranking y creación/salida de lobby comprobados. Alias y récord persistieron tras recargar; consola sin errores ni advertencias en esa sesión.
- Backend público: prueba HTTP/WebSocket con dos clientes; contraseña incorrecta rechazada, mundo compartido, entradas, empujón y resultado por desconexión persistido: PASS. Perfiles `QA_CLOUD_HOST` y `QA_CLOUD_GUEST` identifican esta prueba; no se inyectan monedas ni puntuaciones altas en un destino público. `QA_DEPLOY` corresponde a la prueba de navegador y su partida real de 23 m / 11 puntos.
- Responsive: menú verificado a 390 × 844 y escritorio a 1280 × 720. No se ha probado físicamente en iPhone/Android ni Safari; no se afirma esa cobertura. El soporte táctil existente se conserva.
- Robots de la carpeta: HTTP 200, permite rastreo. Robots de la raíz del host: HTTP 404, sin regla de bloqueo observada.
- Hosting remoto: frontend en GitHub y backend/datos en Cloudflare; no dependen de procesos locales del Mac. No se ha apagado físicamente el ordenador durante la prueba.

Las capturas de comprobación están en `.checkpoints/deploy-evidence/`, excluidas del repositorio.

Estados distintos:

- Publicado: respuesta HTTPS válida y juego cargando.
- Indexable: no hay bloqueo técnico observado; no garantiza indexación.
- Solicitud enviada: confirmada en Search Console.
- Indexado: confirmado por Search Console o búsqueda real, no por publicar un sitemap.

## Checkpoint

Commit anterior a despliegue: `e5675c4`. Backup completo `.checkpoints/pixel-wake_2026-10-14_before-deploy/`, SHA-256 `2045c55c8a1c9fd9173e5ba0824503285b5ea5414011e40abed8806f233992c7`. Restaurar en una carpeta nueva, no sobrescribir sin conservar el estado actual. localStorage pertenece al origen del navegador y no está dentro del backup.
