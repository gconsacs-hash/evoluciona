// Caricatura del rostro: los rasgos salen de una foto, el dibujo es del estilo
// de la app.
//
// POR QUÉ NO SE "CARTOONIZA" LA FOTO
// Filtrar la foto (posterizar, detectar bordes) da resultados que dependen por
// completo de la luz: con luz plana queda una mancha y a contraluz queda un
// borrón. Además una cara fotográfica pegada sobre un cuerpo dibujado se ve
// mal. Aquí se hace al revés: de la foto se extraen unos pocos parámetros
// —tono de piel, color de pelo, proporción de la cara, si hay barba— y con
// ellos se dibuja una cara en el mismo lenguaje gráfico del resto del avatar.
//
// LA FOTO NO SE GUARDA. Solo estos parámetros, que son media docena de números
// y colores. Nada sale del dispositivo, y la imagen se descarta apenas se
// analiza.

import { limitar } from './utiles.js';

export const PEINADOS = {
  rapado: 'Rapado',
  corto: 'Corto',
  medio: 'Media melena',
  largo: 'Largo',
  rizado: 'Rizado',
  tomado: 'Tomado',
  calvo: 'Sin pelo',
};

export const BARBAS = {
  ninguna: 'Sin barba',
  bigote: 'Bigote',
  candado: 'Candado',
  corta: 'Barba corta',
  completa: 'Barba completa',
};

export const FORMAS = {
  ovalo: 'Ovalada',
  redondo: 'Redonda',
  cuadrado: 'Cuadrada',
  alargado: 'Alargada',
};

export const LENTES = {
  ninguno: 'Sin lentes',
  rectangulares: 'Rectangulares',
  redondos: 'Redondos',
};

export function parametrosPorDefecto() {
  return {
    piel: '#d9a173',
    cabello: '#2c2118',
    peinado: 'corto',
    barba: 'ninguna',
    forma: 'ovalo',
    lentes: 'ninguno',
    cejas: 'normales',
    desdeFoto: false,
  };
}

// --- utilidades de color ---

export function aHex({ r, g, b }) {
  const dos = (v) => Math.round(limitar(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

export function aRgb(hex) {
  const h = String(hex).replace('#', '');
  const completo = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(completo.slice(0, 2), 16) || 0,
    g: parseInt(completo.slice(2, 4), 16) || 0,
    b: parseInt(completo.slice(4, 6), 16) || 0,
  };
}

export function mezclar(hex, factor) {
  const { r, g, b } = aRgb(hex);
  if (factor >= 0) {
    return aHex({ r: r + (255 - r) * factor, g: g + (255 - g) * factor, b: b + (255 - b) * factor });
  }
  const f = 1 + factor;
  return aHex({ r: r * f, g: g * f, b: b * f });
}

/** Luminancia percibida, 0 a 255. Sirve para saber si un color es claro u oscuro. */
export function brillo(hex) {
  const { r, g, b } = aRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Traduce lo muestreado de la foto a parámetros de dibujo.
 *
 * @param {object} m
 *   piel      color medio de las mejillas
 *   cabello   color medio de la zona sobre la frente
 *   menton    color medio de la zona de la barba
 *   relacion  alto/ancho de la cara detectada
 *   cubierto  cuánta de la zona del pelo tenía color distinto a la piel (0-1)
 */
export function desdeMuestras(m) {
  const p = parametrosPorDefecto();
  p.desdeFoto = true;
  if (m.piel) p.piel = m.piel;

  /* Si sobre la frente casi no hay superficie distinta de la piel, es calvo o
     rapado; si el color muestreado es muy parecido a la piel, lo mismo. */
  const hayPelo = (m.cubierto === undefined ? 1 : m.cubierto) > 0.25 &&
    (!m.cabello || !m.piel || diferencia(m.cabello, m.piel) > 24);
  p.cabello = hayPelo && m.cabello ? m.cabello : mezclar(p.piel, -0.55);
  if (!hayPelo) p.peinado = 'rapado';

  /* Barba: la zona del mentón notoriamente más oscura que la mejilla. El
     umbral es generoso a propósito, porque la sombra natural del mentón
     también oscurece y no queremos ponerle barba a todo el mundo. */
  if (m.menton && m.piel) {
    const dif = brillo(m.piel) - brillo(m.menton);
    if (dif > 42) p.barba = 'completa';
    else if (dif > 26) p.barba = 'corta';
  }

  if (m.relacion) {
    if (m.relacion > 1.35) p.forma = 'alargado';
    else if (m.relacion < 1.12) p.forma = 'redondo';
    else p.forma = 'ovalo';
  }
  return p;
}

function diferencia(a, b) {
  const x = aRgb(a), y = aRgb(b);
  return Math.abs(x.r - y.r) + Math.abs(x.g - y.g) + Math.abs(x.b - y.b);
}

// --- dibujo ---

/** Anchos relativos de la cara según su forma. */
const PROPORCION = {
  ovalo: { ancho: 1, alto: 1.1, mandibula: 0.82 },
  redondo: { ancho: 1.08, alto: 1, mandibula: 0.95 },
  cuadrado: { ancho: 1.05, alto: 1.05, mandibula: 1 },
  alargado: { ancho: 0.9, alto: 1.25, mandibula: 0.75 },
};

/**
 * Dibuja la cabeza completa. Devuelve SVG para insertar dentro del avatar.
 * @param {object} p parámetros del rostro
 * @param {object} caja { cx, cy, r } centro y radio base de la cabeza
 * @param {object} extra { sonrisa: 0-1 }
 */
export function dibujarRostro(p, caja, extra = {}) {
  const { cx, cy, r } = caja;
  const prop = PROPORCION[p.forma] || PROPORCION.ovalo;
  const rx = r * prop.ancho;
  const ry = r * prop.alto;
  const sombra = mezclar(p.piel, -0.22);
  const partes = [];

  // --- cuello ---
  partes.push(`<rect x="${cx - rx * 0.32}" y="${cy + ry * 0.75}" width="${rx * 0.64}" height="${ry * 0.55}" rx="${rx * 0.2}" fill="${sombra}"/>`);

  // --- orejas ---
  const oreja = rx * 0.19;
  partes.push(`<ellipse cx="${cx - rx * 0.98}" cy="${cy + ry * 0.06}" rx="${oreja * 0.7}" ry="${oreja}" fill="${p.piel}" stroke="${sombra}" stroke-width="0.8"/>`);
  partes.push(`<ellipse cx="${cx + rx * 0.98}" cy="${cy + ry * 0.06}" rx="${oreja * 0.7}" ry="${oreja}" fill="${p.piel}" stroke="${sombra}" stroke-width="0.8"/>`);

  // --- cara ---
  const mand = rx * prop.mandibula;
  partes.push(`<path d="
    M ${cx - rx} ${cy - ry * 0.15}
    C ${cx - rx} ${cy - ry * 0.95}, ${cx + rx} ${cy - ry * 0.95}, ${cx + rx} ${cy - ry * 0.15}
    C ${cx + rx} ${cy + ry * 0.45}, ${cx + mand} ${cy + ry * 0.92}, ${cx} ${cy + ry}
    C ${cx - mand} ${cy + ry * 0.92}, ${cx - rx} ${cy + ry * 0.45}, ${cx - rx} ${cy - ry * 0.15} Z"
    fill="${p.piel}" stroke="${sombra}" stroke-width="1"/>`);

  // --- cejas ---
  const grosorCeja = p.cejas === 'gruesas' ? 2.6 : p.cejas === 'finas' ? 1.2 : 1.9;
  const yCeja = cy - ry * 0.3;
  const colorCeja = mezclar(p.cabello, -0.1);
  for (const lado of [-1, 1]) {
    const x0 = cx + lado * rx * 0.2;
    const x1 = cx + lado * rx * 0.62;
    partes.push(`<path d="M ${x0} ${yCeja} Q ${cx + lado * rx * 0.42} ${yCeja - ry * 0.09}, ${x1} ${yCeja + ry * 0.02}"
      stroke="${colorCeja}" stroke-width="${grosorCeja}" fill="none" stroke-linecap="round"/>`);
  }

  /* Ojos: almendra oscura con un brillo, más el párpado marcado arriba. Se
     evitan a propósito el blanco grande y la pupila enorme, que dan ese aire
     de muñeco asustado. */
  const yOjo = cy - ry * 0.12;
  const sepOjo = rx * 0.38;
  const rxOjo = rx * 0.125, ryOjo = ry * 0.085;
  for (const lado of [-1, 1]) {
    const x = cx + lado * sepOjo;
    partes.push(`<ellipse cx="${x}" cy="${yOjo}" rx="${rxOjo}" ry="${ryOjo}" fill="#f7f3ee"/>`);
    partes.push(`<circle cx="${x}" cy="${yOjo}" r="${ryOjo * 0.92}" fill="#3a2a20"/>`);
    partes.push(`<circle cx="${x + rxOjo * 0.22}" cy="${yOjo - ryOjo * 0.3}" r="${ryOjo * 0.28}" fill="#fff"/>`);
    partes.push(`<path d="M ${x - rxOjo} ${yOjo - ryOjo * 0.55} Q ${x} ${yOjo - ryOjo * 1.5}, ${x + rxOjo} ${yOjo - ryOjo * 0.55}"
      stroke="${mezclar(sombra, -0.25)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`);
  }

  // --- nariz ---
  partes.push(`<path d="M ${cx + rx * 0.02} ${cy + ry * 0.02} Q ${cx + rx * 0.11} ${cy + ry * 0.19}, ${cx - rx * 0.03} ${cy + ry * 0.21}"
    stroke="${sombra}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);

  /* La barba va antes que la boca: al revés tapaba los labios y el resultado
     parecía una boca abierta. */
  partes.push(dibujarBarba(p, { cx, cy, rx, ry, mand }));

  // --- boca ---
  const sonrisa = limitar(extra.sonrisa === undefined ? 0.5 : extra.sonrisa, 0, 1);
  const yBoca = cy + ry * 0.48;
  const curva = ry * (0.05 + sonrisa * 0.14);
  partes.push(`<path d="M ${cx - rx * 0.28} ${yBoca} Q ${cx} ${yBoca + curva}, ${cx + rx * 0.28} ${yBoca}"
    stroke="#8d4a3c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);

  // --- pelo ---
  partes.push(dibujarPeinado(p, { cx, cy, rx, ry }));

  // --- lentes ---
  partes.push(dibujarLentes(p, { cx, cy, rx, ry, yOjo, sepOjo }));

  return partes.join('\n');
}

function dibujarBarba(p, { cx, cy, rx, ry, mand }) {
  if (!p.barba || p.barba === 'ninguna') return '';
  const color = mezclar(p.cabello, 0.05);
  const yBoca = cy + ry * 0.48;

  /* Bigote sobre el labio: se reutiliza en el candado y en la barba completa. */
  const bigote = `<path d="M ${cx - rx * 0.3} ${yBoca - ry * 0.11} Q ${cx} ${yBoca - ry * 0.01}, ${cx + rx * 0.3} ${yBoca - ry * 0.11}
    Q ${cx} ${yBoca + ry * 0.05}, ${cx - rx * 0.3} ${yBoca - ry * 0.11} Z" fill="${color}"/>`;

  if (p.barba === 'bigote') return bigote;

  if (p.barba === 'candado') {
    /* Bigote arriba y perilla abajo, separados. Dibujarlo como un anillo
       cerrado alrededor de la boca hacía que se leyera como una boca abierta. */
    return `${bigote}
      <path d="M ${cx - rx * 0.17} ${yBoca + ry * 0.14}
        Q ${cx} ${yBoca + ry * 0.08}, ${cx + rx * 0.17} ${yBoca + ry * 0.14}
        Q ${cx + rx * 0.2} ${cy + ry * 0.87}, ${cx} ${cy + ry * 0.9}
        Q ${cx - rx * 0.2} ${cy + ry * 0.87}, ${cx - rx * 0.17} ${yBoca + ry * 0.14} Z" fill="${color}"/>`;
  }
  /* Corta y completa siguen la mandíbula. La completa arranca más arriba, pero
     sin llegar a los pómulos: cuando subía hasta las orejas parecía un casco. */
  const altura = p.barba === 'completa' ? 0.26 : 0.4;
  const opacidad = p.barba === 'corta' ? 0.7 : 1;
  // Una barba completa lleva bigote; una de tres días, no.
  const conBigote = p.barba === 'completa' ? bigote : '';
  return conBigote + `<path d="
    M ${cx - rx * 0.93} ${cy + ry * altura}
    C ${cx - rx * 0.9} ${cy + ry * 0.75}, ${cx - mand * 0.7} ${cy + ry * 1.01}, ${cx} ${cy + ry * 1.01}
    C ${cx + mand * 0.7} ${cy + ry * 1.01}, ${cx + rx * 0.9} ${cy + ry * 0.75}, ${cx + rx * 0.93} ${cy + ry * altura}
    C ${cx + rx * 0.76} ${cy + ry * 0.56}, ${cx + rx * 0.42} ${cy + ry * 0.5}, ${cx} ${cy + ry * 0.52}
    C ${cx - rx * 0.42} ${cy + ry * 0.5}, ${cx - rx * 0.76} ${cy + ry * 0.56}, ${cx - rx * 0.93} ${cy + ry * altura} Z"
    fill="${color}" opacity="${opacidad}"/>`;
}

function dibujarPeinado(p, { cx, cy, rx, ry }) {
  if (p.peinado === 'calvo') return '';
  const color = p.cabello;
  const oscuro = mezclar(color, -0.25);
  const yTope = cy - ry * 0.98;

  if (p.peinado === 'rapado') {
    return `<path d="M ${cx - rx * 0.99} ${cy - ry * 0.3}
      C ${cx - rx} ${yTope}, ${cx + rx} ${yTope}, ${cx + rx * 0.99} ${cy - ry * 0.3}
      C ${cx + rx * 0.8} ${cy - ry * 0.52}, ${cx - rx * 0.8} ${cy - ry * 0.52}, ${cx - rx * 0.99} ${cy - ry * 0.3} Z"
      fill="${color}" opacity=".85"/>`;
  }
  if (p.peinado === 'corto') {
    return `<path d="M ${cx - rx * 1.02} ${cy - ry * 0.22}
      C ${cx - rx * 1.05} ${yTope - ry * 0.12}, ${cx + rx * 1.05} ${yTope - ry * 0.12}, ${cx + rx * 1.02} ${cy - ry * 0.22}
      C ${cx + rx * 0.95} ${cy - ry * 0.42}, ${cx + rx * 0.55} ${cy - ry * 0.58}, ${cx + rx * 0.1} ${cy - ry * 0.5}
      C ${cx - rx * 0.4} ${cy - ry * 0.62}, ${cx - rx * 0.9} ${cy - ry * 0.5}, ${cx - rx * 1.02} ${cy - ry * 0.22} Z"
      fill="${color}"/>
      <path d="M ${cx - rx * 0.5} ${cy - ry * 0.62} Q ${cx} ${cy - ry * 0.82}, ${cx + rx * 0.6} ${cy - ry * 0.55}"
      stroke="${oscuro}" stroke-width="1.2" fill="none" opacity=".6"/>`;
  }
  if (p.peinado === 'medio') {
    return `<path d="M ${cx - rx * 1.06} ${cy + ry * 0.25}
      C ${cx - rx * 1.14} ${cy - ry * 0.6}, ${cx - rx * 0.6} ${yTope - ry * 0.15}, ${cx} ${yTope - ry * 0.12}
      C ${cx + rx * 0.6} ${yTope - ry * 0.15}, ${cx + rx * 1.14} ${cy - ry * 0.6}, ${cx + rx * 1.06} ${cy + ry * 0.25}
      C ${cx + rx * 0.98} ${cy - ry * 0.1}, ${cx + rx * 0.9} ${cy - ry * 0.45}, ${cx + rx * 0.35} ${cy - ry * 0.52}
      C ${cx - rx * 0.3} ${cy - ry * 0.62}, ${cx - rx * 0.92} ${cy - ry * 0.4}, ${cx - rx * 1.06} ${cy + ry * 0.25} Z"
      fill="${color}"/>`;
  }
  if (p.peinado === 'largo') {
    return `<path d="M ${cx - rx * 1.1} ${cy + ry * 1.15}
      C ${cx - rx * 1.25} ${cy - ry * 0.4}, ${cx - rx * 0.7} ${yTope - ry * 0.18}, ${cx} ${yTope - ry * 0.15}
      C ${cx + rx * 0.7} ${yTope - ry * 0.18}, ${cx + rx * 1.25} ${cy - ry * 0.4}, ${cx + rx * 1.1} ${cy + ry * 1.15}
      C ${cx + rx * 0.96} ${cy + ry * 0.5}, ${cx + rx * 1} ${cy - ry * 0.3}, ${cx + rx * 0.4} ${cy - ry * 0.5}
      C ${cx - rx * 0.35} ${cy - ry * 0.6}, ${cx - rx * 1} ${cy - ry * 0.3}, ${cx - rx * 0.96} ${cy + ry * 0.5} Z"
      fill="${color}"/>`;
  }
  if (p.peinado === 'rizado') {
    const rizos = [];
    for (let i = 0; i <= 10; i++) {
      const ang = Math.PI + (Math.PI * i) / 10;
      const x = cx + Math.cos(ang) * rx * 1.02;
      const y = cy + Math.sin(ang) * ry * 0.92;
      rizos.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rx * 0.27).toFixed(1)}" fill="${color}"/>`);
    }
    return rizos.join('') +
      `<circle cx="${cx}" cy="${cy - ry * 0.78}" r="${rx * 0.34}" fill="${color}"/>`;
  }
  if (p.peinado === 'tomado') {
    return `<path d="M ${cx - rx * 1.02} ${cy - ry * 0.12}
      C ${cx - rx * 1.06} ${yTope - ry * 0.1}, ${cx + rx * 1.06} ${yTope - ry * 0.1}, ${cx + rx * 1.02} ${cy - ry * 0.12}
      C ${cx + rx * 0.9} ${cy - ry * 0.45}, ${cx - rx * 0.9} ${cy - ry * 0.45}, ${cx - rx * 1.02} ${cy - ry * 0.12} Z"
      fill="${color}"/>
      <circle cx="${cx}" cy="${cy - ry * 1.12}" r="${rx * 0.32}" fill="${color}"/>
      <path d="M ${cx - rx * 0.2} ${cy - ry * 1.02} h ${rx * 0.4}" stroke="${oscuro}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return '';
}

function dibujarLentes(p, { cx, rx, ry, yOjo, sepOjo }) {
  if (!p.lentes || p.lentes === 'ninguno') return '';
  const marco = '#2f3640';
  const w = rx * 0.42, h = ry * 0.3;
  const forma = p.lentes === 'redondos'
    ? (lado) => `<circle cx="${cx + lado * sepOjo}" cy="${yOjo}" r="${w * 0.6}" fill="rgba(180,220,255,.16)" stroke="${marco}" stroke-width="2"/>`
    : (lado) => `<rect x="${cx + lado * sepOjo - w / 2}" y="${yOjo - h / 2}" width="${w}" height="${h}" rx="${w * 0.12}"
        fill="rgba(180,220,255,.16)" stroke="${marco}" stroke-width="2"/>`;
  return `${forma(-1)}${forma(1)}
    <line x1="${cx - sepOjo + w * 0.5}" y1="${yOjo}" x2="${cx + sepOjo - w * 0.5}" y2="${yOjo}" stroke="${marco}" stroke-width="2"/>
    <line x1="${cx - sepOjo - w * 0.55}" y1="${yOjo}" x2="${cx - rx * 0.98}" y2="${yOjo + ry * 0.04}" stroke="${marco}" stroke-width="1.8"/>
    <line x1="${cx + sepOjo + w * 0.55}" y1="${yOjo}" x2="${cx + rx * 0.98}" y2="${yOjo + ry * 0.04}" stroke="${marco}" stroke-width="1.8"/>`;
}
