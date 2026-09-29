// Service worker: la app queda disponible sin conexión.
// Estrategia: "cache first" para los archivos propios, que son todos estáticos.
// Al cambiar de versión se borran las cachés viejas.

const VERSION = 'evoluciona-v2';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilos.css',
  './iconos/icono.svg',
  './iconos/icono-mascara.svg',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-mascara-512.png',
  './js/app.js',
  './js/nucleo/utiles.js',
  './js/nucleo/almacen.js',
  './js/nucleo/nutricion.js',
  './js/nucleo/entrenamiento.js',
  './js/nucleo/finanzas.js',
  './js/nucleo/habitos.js',
  './js/nucleo/progreso.js',
  './js/nucleo/avatar.js',
  './js/nucleo/tienda.js',
  './js/nucleo/menus.js',
  './js/nucleo/analitica.js',
  './js/nucleo/productos.js',
  './js/nucleo/micronutrientes.js',
  './js/nucleo/recordatorios.js',
  './js/ui/recordatorios-ui.js',
  './js/datos/alimentos.js',
  './js/datos/ejercicios.js',
  './js/datos/tienda-catalogo.js',
  './js/datos/platos.js',
  './js/datos/micronutrientes.js',
  './js/ui/comun.js',
  './js/ui/vista-panel.js',
  './js/ui/vista-rutina.js',
  './js/ui/vista-entreno.js',
  './js/ui/vista-nutricion.js',
  './js/ui/vista-finanzas.js',
  './js/ui/vista-tienda.js',
  './js/ui/vista-perfil.js',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION)
      // addAll falla completo si un archivo falta: se agregan de a uno para ser tolerantes.
      .then((cache) => Promise.all(ARCHIVOS.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Estrategia: responde al instante con la copia guardada y, en paralelo, baja la versión
// nueva para la próxima vez. Así la app abre sin conexión y a la vez se actualiza sola.
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || !peticion.url.startsWith(self.location.origin)) return;

  evento.respondWith(
    caches.match(peticion).then((guardado) => {
      const desdeLaRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => guardado || caches.match('./index.html'));

      return guardado || desdeLaRed;
    }),
  );
});
