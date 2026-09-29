// Captura la foto y saca de ella los rasgos. Todo ocurre en el dispositivo.
//
// La foto se analiza en un canvas en memoria y se descarta: no se guarda, no se
// sube y nunca llega a localStorage. Lo único que queda son los parámetros de
// dibujo (unos colores y tres o cuatro opciones).
//
// Detección del rostro: se usa la API del navegador cuando existe (Chrome en
// Android). Cuando no, la persona alinea su cara con un óvalo guía y se
// muestrea esa zona, que funciona igual de bien porque solo necesitamos
// promedios de color de regiones grandes.

import { desdeMuestras, aHex } from '../nucleo/rostro.js';

export function soportaDeteccion() {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

export function soportaCamara() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** Color medio de una región rectangular, descartando píxeles muy oscuros o quemados. */
function colorMedio(ctx, x, y, w, h) {
  x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  let datos;
  try { datos = ctx.getImageData(x, y, w, h).data; } catch { return null; }

  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < datos.length; i += 4) {
    const lum = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
    // Las sombras duras y los brillos quemados no informan del color real.
    if (lum < 18 || lum > 245) continue;
    r += datos[i]; g += datos[i + 1]; b += datos[i + 2]; n++;
  }
  if (!n) return null;
  return aHex({ r: r / n, g: g / n, b: b / n });
}

/** Proporción de píxeles de una región que difieren mucho de un color dado. */
function proporcionDistinta(ctx, x, y, w, h, hexReferencia) {
  x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  let datos;
  try { datos = ctx.getImageData(x, y, w, h).data; } catch { return 0; }
  const ref = hexReferencia.replace('#', '');
  const rr = parseInt(ref.slice(0, 2), 16);
  const rg = parseInt(ref.slice(2, 4), 16);
  const rb = parseInt(ref.slice(4, 6), 16);

  let distintos = 0, total = 0;
  for (let i = 0; i < datos.length; i += 4) {
    total++;
    const d = Math.abs(datos[i] - rr) + Math.abs(datos[i + 1] - rg) + Math.abs(datos[i + 2] - rb);
    if (d > 90) distintos++;
  }
  return total ? distintos / total : 0;
}

/**
 * Analiza una imagen ya dibujada y devuelve los parámetros del rostro.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} caja zona de la cara { x, y, ancho, alto }
 */
export function analizarCara(ctx, caja) {
  const { x, y, ancho, alto } = caja;

  // Mejillas: dos zonas a los lados, bajo los ojos.
  const izq = colorMedio(ctx, x + ancho * 0.12, y + alto * 0.5, ancho * 0.18, alto * 0.16);
  const der = colorMedio(ctx, x + ancho * 0.7, y + alto * 0.5, ancho * 0.18, alto * 0.16);
  const frente = colorMedio(ctx, x + ancho * 0.35, y + alto * 0.22, ancho * 0.3, alto * 0.1);
  const pieles = [izq, der, frente].filter(Boolean);
  const piel = pieles.length ? promedioDeHex(pieles) : null;

  // Pelo: franja sobre la frente, un poco por fuera de la caja de la cara.
  const yPelo = Math.max(0, y - alto * 0.22);
  const cabello = colorMedio(ctx, x + ancho * 0.2, yPelo, ancho * 0.6, alto * 0.2);
  const cubierto = piel ? proporcionDistinta(ctx, x + ancho * 0.2, yPelo, ancho * 0.6, alto * 0.2, piel) : 1;

  // Mentón: zona de la barba.
  const menton = colorMedio(ctx, x + ancho * 0.3, y + alto * 0.78, ancho * 0.4, alto * 0.18);

  return desdeMuestras({
    piel, cabello, menton, cubierto,
    relacion: alto / ancho,
  });
}

function promedioDeHex(lista) {
  let r = 0, g = 0, b = 0;
  for (const hex of lista) {
    const h = hex.replace('#', '');
    r += parseInt(h.slice(0, 2), 16);
    g += parseInt(h.slice(2, 4), 16);
    b += parseInt(h.slice(4, 6), 16);
  }
  return aHex({ r: r / lista.length, g: g / lista.length, b: b / lista.length });
}

/** Busca la cara con la API del navegador. Devuelve null si no se puede. */
export async function detectarCara(fuente) {
  if (!soportaDeteccion()) return null;
  try {
    const detector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: false });
    const caras = await detector.detect(fuente);
    if (!caras.length) return null;
    const c = caras[0].boundingBox;
    return { x: c.x, y: c.y, ancho: c.width, alto: c.height };
  } catch {
    return null;
  }
}

/**
 * Procesa una imagen (video o img) y devuelve los parámetros del rostro.
 * La imagen no se conserva en ninguna parte.
 */
export async function analizarImagen(fuente, anchoNatural, altoNatural) {
  const lienzo = document.createElement('canvas');
  lienzo.width = anchoNatural;
  lienzo.height = altoNatural;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(fuente, 0, 0, anchoNatural, altoNatural);

  let caja = await detectarCara(fuente);
  let detectada = !!caja;
  if (!caja) {
    // Sin detección: se asume la cara centrada, como pide el óvalo guía.
    const ancho = anchoNatural * 0.45;
    const alto = altoNatural * 0.5;
    caja = { x: (anchoNatural - ancho) / 2, y: (altoNatural - alto) / 2.1, ancho, alto };
  }

  const parametros = analizarCara(ctx, caja);

  // El lienzo se suelta de inmediato: la imagen no queda en memoria ni en disco.
  lienzo.width = 0;
  lienzo.height = 0;

  return { parametros, detectada };
}
