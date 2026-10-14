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

Backend: mismo flujo cuando se configura el token de CI y la variable de activación. Si falta ese token, ejecuta `npm run backend:cloud:deploy` después de cambiar reglas/servidor. No se inventan credenciales ni se reutilizan tokens OAuth temporales como secretos de automatización permanente.

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

El propietario debe iniciar sesión en su cuenta Google. Verificación HTML: descargar el archivo que Google indique o facilitar la etiqueta de verificación; se puede añadir al proyecto y desplegar sin cambiar el juego. Después se verifica la propiedad, se envía `sitemap.xml` y se solicita indexación con Inspección de URLs. No se inserta una etiqueta inventada ni se afirma que se ha solicitado/indexado sin confirmación.

Estados distintos:

- Publicado: respuesta HTTPS válida y juego cargando.
- Indexable: no hay bloqueo técnico observado; no garantiza indexación.
- Solicitud enviada: confirmada en Search Console.
- Indexado: confirmado por Search Console o búsqueda real, no por publicar un sitemap.

## Checkpoint

Commit anterior a despliegue: `e5675c4`. Backup completo `.checkpoints/pixel-wake_2026-10-14_before-deploy/`, SHA-256 `2045c55c8a1c9fd9173e5ba0824503285b5ea5414011e40abed8806f233992c7`. Restaurar en una carpeta nueva, no sobrescribir sin conservar el estado actual. localStorage pertenece al origen del navegador y no está dentro del backup.
