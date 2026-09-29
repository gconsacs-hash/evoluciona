// Servidor estático mínimo para abrir la app en el navegador.
// Necesario porque los módulos de JavaScript no se pueden cargar desde file://
// No usa dependencias: solo Node.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.env.PUERTO) || 4173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const servidor = createServer(async (peticion, respuesta) => {
  try {
    const url = new URL(peticion.url, `http://localhost:${PUERTO}`);
    let relativa = decodeURIComponent(url.pathname);
    if (relativa === '/' || relativa === '') relativa = '/index.html';

    // Evita salir de la carpeta del proyecto.
    const destino = normalize(join(RAIZ, relativa));
    if (!destino.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep)) {
      respuesta.writeHead(403).end('Fuera de alcance');
      return;
    }

    const info = await stat(destino);
    if (info.isDirectory()) {
      respuesta.writeHead(302, { Location: `${relativa.replace(/\/$/, '')}/index.html` }).end();
      return;
    }

    const contenido = await readFile(destino);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    respuesta.end(contenido);
  } catch (error) {
    if (error.code === 'ENOENT') {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
    } else {
      respuesta.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Error del servidor');
    }
  }
});

servidor.listen(PUERTO, () => {
  console.log('');
  console.log('  Evoluciona está corriendo.');
  console.log(`  Abre en el navegador:  http://localhost:${PUERTO}`);
  console.log('');
  console.log('  Desde el celular, en la misma red WiFi, usa la IP de este PC:');
  console.log(`  http://<ip-del-pc>:${PUERTO}   (averíguala con "ipconfig")`);
  console.log('');
  console.log('  Para cerrar: Ctrl + C');
  console.log('');
});
