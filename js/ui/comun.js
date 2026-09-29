// Componentes de interfaz y gráficos en SVG.
// Los colores salen de variables CSS: los slots de serie (--s1..--s5) y los de estado.
// El texto usa siempre tinta (--ink*), nunca el color de la serie.

import { num, clp, redondear } from '../nucleo/utiles.js';

export const esc = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function $(selector, raiz = document) { return raiz.querySelector(selector); }
export function $$(selector, raiz = document) { return [...raiz.querySelectorAll(selector)]; }

// --- Avisos flotantes ------------------------------------------------------

export function aviso(texto, tono = 'info', duracion = 3600) {
  let capa = $('#avisos');
  if (!capa) {
    capa = document.createElement('div');
    capa.id = 'avisos';
    document.body.appendChild(capa);
  }
  const nodo = document.createElement('div');
  nodo.className = `aviso aviso--${tono}`;
  nodo.innerHTML = texto;
  capa.appendChild(nodo);
  requestAnimationFrame(() => nodo.classList.add('visible'));
  setTimeout(() => {
    nodo.classList.remove('visible');
    setTimeout(() => nodo.remove(), 320);
  }, duracion);
}

// --- Modal ----------------------------------------------------------------

export function modal({ titulo, cuerpo, ancho = 560 }) {
  cerrarModal();
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" style="max-width:${ancho}px" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <header class="modal__cab">
        <h2>${esc(titulo)}</h2>
        <button class="boton-icono" data-cerrar-modal aria-label="Cerrar">✕</button>
      </header>
      <div class="modal__cuerpo">${cuerpo}</div>
    </div>`;
  fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrarModal(); });
  document.body.appendChild(fondo);
  requestAnimationFrame(() => fondo.classList.add('visible'));
  return fondo;
}

export function cerrarModal() {
  const abierto = $('.modal-fondo');
  if (!abierto) return;
  abierto.classList.remove('visible');
  setTimeout(() => abierto.remove(), 200);
}

// --- Tooltip compartido de los gráficos -----------------------------------

let nodoTip = null;

export function activarTooltips() {
  if (nodoTip) return;
  nodoTip = document.createElement('div');
  nodoTip.className = 'grafico-tip';
  document.body.appendChild(nodoTip);

  const mostrar = (evento) => {
    const objetivo = evento.target.closest?.('[data-tip]');
    if (!objetivo) { nodoTip.classList.remove('visible'); return; }
    nodoTip.innerHTML = objetivo.getAttribute('data-tip');
    nodoTip.classList.add('visible');
    const r = nodoTip.getBoundingClientRect();
    const x = Math.min(Math.max(8, evento.clientX - r.width / 2), window.innerWidth - r.width - 8);
    const y = Math.max(8, evento.clientY - r.height - 14);
    nodoTip.style.transform = `translate(${x}px, ${y}px)`;
  };
  document.addEventListener('mousemove', mostrar, { passive: true });
  document.addEventListener('mouseleave', () => nodoTip.classList.remove('visible'));
  document.addEventListener('touchstart', mostrar, { passive: true });
}

// --- Piezas de interfaz ---------------------------------------------------

export function tarjeta({ titulo, extra = '', cuerpo, clase = '' }) {
  return `<section class="tarjeta ${clase}">
    ${titulo ? `<header class="tarjeta__cab"><h2>${esc(titulo)}</h2>${extra}</header>` : ''}
    <div class="tarjeta__cuerpo">${cuerpo}</div>
  </section>`;
}

export function estadistica({ valor, etiqueta, detalle = '', tono = '' }) {
  return `<div class="estad ${tono ? `estad--${tono}` : ''}">
    <div class="estad__valor">${valor}</div>
    <div class="estad__etiqueta">${esc(etiqueta)}</div>
    ${detalle ? `<div class="estad__detalle">${detalle}</div>` : ''}
  </div>`;
}

const ICONO_TONO = { bien: '✓', optimo: '✓', aviso: '!', mal: '✕', exceso: '✕', bajo: '↓', info: 'i' };

export function nota(tono, texto) {
  return `<p class="nota nota--${tono}"><span class="nota__icono" aria-hidden="true">${ICONO_TONO[tono] || 'i'}</span>
    <span>${texto}</span></p>`;
}

export function listaNotas(mensajes) {
  if (!mensajes?.length) return '';
  return `<div class="notas">${mensajes.map((m) => nota(m.tono, esc(m.texto))).join('')}</div>`;
}

/** Barra de progreso de un nutriente, con estado por icono + etiqueta (no solo color). */
export function barraMacro(fila, unidadCorta = '') {
  const pct = Math.min(200, fila.pct);
  const etiquetaEstado = { optimo: 'en meta', bajo: 'bajo', exceso: 'excedido' }[fila.estado] || '';
  const tono = fila.estado === 'optimo' ? 'bien' : fila.estado === 'exceso' ? 'mal' : 'aviso';
  return `<div class="macro">
    <div class="macro__fila">
      <span class="macro__nombre">${esc(fila.clave)}</span>
      <span class="macro__cifra"><strong>${num(fila.consumido, fila.unidad === 'mg' || fila.unidad === 'ml' ? 0 : 1)}</strong>
        <span class="tenue">/ ${num(fila.meta)} ${unidadCorta || fila.unidad}</span></span>
    </div>
    <div class="macro__pista" role="img" aria-label="${fila.pct}% de la meta">
      <div class="macro__relleno macro__relleno--${tono}" style="width:${Math.min(100, pct)}%"></div>
      ${pct > 100 ? `<div class="macro__exceso" style="width:${Math.min(50, pct - 100)}%"></div>` : ''}
    </div>
    <div class="macro__pie"><span class="marca marca--${tono}">${ICONO_TONO[fila.estado] || ''} ${etiquetaEstado}</span>
      <span class="tenue">${fila.pct}%</span></div>
  </div>`;
}

export function barraXP(detalle) {
  return `<div class="xp">
    <div class="xp__pista"><div class="xp__relleno" style="width:${detalle.pct}%"></div></div>
    <div class="xp__texto"><span>Nivel ${detalle.nivel}</span>
      <span class="tenue">${num(detalle.xpEnNivel)} / ${num(detalle.xpNecesaria)} XP</span></div>
  </div>`;
}

// --- Gráficos -------------------------------------------------------------

function rectArribaRedondeado(x, y, w, h, r = 4) {
  const radio = Math.min(r, w / 2, Math.max(0, h));
  if (h <= 0.5) return '';
  return `M ${x} ${y + h} L ${x} ${y + radio} Q ${x} ${y} ${x + radio} ${y} L ${x + w - radio} ${y} Q ${x + w} ${y} ${x + w} ${y + radio} L ${x + w} ${y + h} Z`;
}

/** Barras agrupadas: hasta 3 series. Leyenda siempre presente y valores en tooltip. */
export function barrasAgrupadas({ datos, series, alto = 190, formato = num, etiquetaX = (d) => d.etiqueta }) {
  if (!datos.length) return vacio('Sin datos todavía.');
  const ancho = 320;
  const margen = { arriba: 10, abajo: 24 };
  const areaAlto = alto - margen.arriba - margen.abajo;
  const max = Math.max(1, ...datos.flatMap((d) => series.map((s) => Number(d[s.clave]) || 0)));
  const pasoGrupo = ancho / datos.length;
  const anchoGrupo = Math.max(6, pasoGrupo - 6);
  const anchoBarra = Math.max(3, anchoGrupo / series.length - 2);

  const marcas = datos.flatMap((d, i) => series.map((s, j) => {
    const v = Number(d[s.clave]) || 0;
    const h = (v / max) * areaAlto;
    const x = i * pasoGrupo + (pasoGrupo - anchoGrupo) / 2 + j * (anchoBarra + 2);
    const y = margen.arriba + areaAlto - h;
    const tip = `<b>${esc(etiquetaX(d))}</b><br>${series.map((ss) => `${esc(ss.nombre)}: ${formato(d[ss.clave])}`).join('<br>')}`;
    const path = rectArribaRedondeado(x, y, anchoBarra, h);
    return path ? `<path d="${path}" fill="var(${s.color})" data-tip="${esc(tip)}"/>` : '';
  }));

  // Con muchas columnas solo se etiqueta una de cada dos, para que no se pisen.
  const salto = datos.length > 9 ? 2 : 1;
  const ejes = datos.map((d, i) => (i % salto ? '' :
    `<text x="${(i * pasoGrupo + pasoGrupo / 2).toFixed(1)}" y="${alto - 7}" class="g-eje" text-anchor="middle">${esc(etiquetaX(d))}</text>`));

  const yBase = margen.arriba + areaAlto;
  const guias = [0.5, 1].map((f) => `<line x1="0" y1="${(yBase - areaAlto * f).toFixed(1)}" x2="${ancho}" y2="${(yBase - areaAlto * f).toFixed(1)}" class="g-guia"/>`);

  return `<div class="grafico">
    ${leyenda(series)}
    <svg viewBox="0 0 ${ancho} ${alto}" class="g-svg" role="img"
      aria-label="${esc(datos.map((d) => `${etiquetaX(d)}: ${series.map((s) => `${s.nombre} ${formato(d[s.clave])}`).join(', ')}`).join('; '))}">
      ${guias.join('')}
      <line x1="0" y1="${yBase}" x2="${ancho}" y2="${yBase}" class="g-base"/>
      ${marcas.join('')}${ejes.join('')}
    </svg>
    <p class="g-nota tenue">Máximo del período: ${formato(max)}</p>
  </div>`;
}

/** Barras horizontales de una sola serie: magnitud comparada, con etiqueta directa. */
export function barrasHorizontales({ datos, formato = num, maximo }) {
  if (!datos.length) return vacio('Sin datos todavía.');
  const max = maximo || Math.max(1, ...datos.map((d) => d.valor));
  return `<div class="barras-h">
    ${datos.map((d) => `
      <div class="barra-h" data-tip="${esc(`<b>${d.etiqueta}</b><br>${formato(d.valor)}${d.detalle ? `<br>${d.detalle}` : ''}`)}">
        <div class="barra-h__etiqueta">${d.icono ? `<span aria-hidden="true">${d.icono}</span> ` : ''}${esc(d.etiqueta)}</div>
        <div class="barra-h__pista">
          <div class="barra-h__relleno" style="width:${Math.max(1.5, (d.valor / max) * 100)}%"></div>
        </div>
        <div class="barra-h__valor">${formato(d.valor)}</div>
      </div>`).join('')}
  </div>`;
}

/** Línea temporal de una serie, con línea de referencia opcional. */
export function lineaTiempo({ puntos, meta = null, alto = 170, formato = num, etiquetaMeta = 'Meta' }) {
  const validos = puntos.filter((p) => p.valor !== null && p.valor !== undefined);
  if (validos.length < 2) return vacio('Necesitas al menos dos días registrados.');
  const ancho = 320;
  const margen = { arriba: 12, abajo: 14 };
  const areaAlto = alto - margen.arriba - margen.abajo;
  const valores = validos.map((p) => p.valor).concat(meta ? [meta] : []);
  const max = Math.max(...valores) * 1.08;
  const min = Math.min(...valores, 0) * 0.98;
  const rango = Math.max(1, max - min);
  const x = (i) => (puntos.length === 1 ? ancho / 2 : (i / (puntos.length - 1)) * ancho);
  const y = (v) => margen.arriba + areaAlto - ((v - min) / rango) * areaAlto;

  let camino = '';
  puntos.forEach((p, i) => {
    if (p.valor === null || p.valor === undefined) return;
    camino += `${camino ? 'L' : 'M'} ${x(i).toFixed(2)} ${y(p.valor).toFixed(2)} `;
  });

  const marcadores = puntos.map((p, i) => (p.valor === null || p.valor === undefined) ? '' :
    `<circle cx="${x(i).toFixed(2)}" cy="${y(p.valor).toFixed(2)}" r="4" class="g-punto"
      data-tip="${esc(`<b>${p.etiqueta}</b><br>${formato(p.valor)}`)}"/>`).join('');

  const lineaMeta = meta ? `<line x1="0" y1="${y(meta).toFixed(2)}" x2="${ancho}" y2="${y(meta).toFixed(2)}" class="g-meta"/>` : '';
  const etiquetas = [puntos[0], puntos[puntos.length - 1]].filter(Boolean);

  return `<div class="grafico">
    <svg viewBox="0 0 ${ancho} ${alto}" class="g-svg" role="img"
      aria-label="${esc(validos.map((p) => `${p.etiqueta}: ${formato(p.valor)}`).join('; '))}">
      <line x1="0" y1="${margen.arriba + areaAlto}" x2="${ancho}" y2="${margen.arriba + areaAlto}" class="g-base"/>
      ${lineaMeta}
      <path d="${camino}" fill="none" class="g-linea"/>
      ${marcadores}
    </svg>
    <div class="g-pie">
      <span class="tenue">${esc(etiquetas[0]?.etiqueta || '')}</span>
      ${meta ? `<span class="marca marca--meta">${esc(etiquetaMeta)}: ${formato(meta)}</span>` : ''}
      <span class="tenue">${esc(etiquetas[1]?.etiqueta || '')}</span>
    </div>
  </div>`;
}

/** Radar de los cinco atributos del avatar. Una sola serie, un solo color. */
export function radarAtributos(atributos) {
  const ejes = [
    { clave: 'fuerza', nombre: 'Fuerza' },
    { clave: 'resistencia', nombre: 'Resistencia' },
    { clave: 'nutricion', nombre: 'Nutrición' },
    { clave: 'disciplina', nombre: 'Disciplina' },
    { clave: 'finanzas', nombre: 'Finanzas' },
  ];
  const cx = 110;
  const cy = 104;
  const r = 74;
  const punto = (i, factor) => {
    const ang = (Math.PI * 2 * i) / ejes.length - Math.PI / 2;
    return [cx + Math.cos(ang) * r * factor, cy + Math.sin(ang) * r * factor];
  };
  const anillos = [0.25, 0.5, 0.75, 1].map((f) =>
    `<polygon points="${ejes.map((_, i) => punto(i, f).map((n) => n.toFixed(1)).join(',')).join(' ')}" class="g-anillo"/>`).join('');
  const radios = ejes.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${punto(i, 1)[0].toFixed(1)}" y2="${punto(i, 1)[1].toFixed(1)}" class="g-guia"/>`).join('');
  const puntos = ejes.map((e, i) => punto(i, Math.max(0.04, (atributos[e.clave] || 0) / 100)));
  const area = `<polygon points="${puntos.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" class="g-radar"/>`;
  const nodos = puntos.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" class="g-punto"
    data-tip="${esc(`<b>${ejes[i].nombre}</b><br>${atributos[ejes[i].clave] || 0} / 100`)}"/>`).join('');
  const textos = ejes.map((e, i) => {
    const [px, py] = punto(i, 1.2);
    const anclaje = px > cx + 6 ? 'start' : px < cx - 6 ? 'end' : 'middle';
    return `<text x="${px.toFixed(1)}" y="${(py + 3).toFixed(1)}" class="g-eje" text-anchor="${anclaje}">${e.nombre} ${atributos[e.clave] || 0}</text>`;
  }).join('');

  return `<div class="grafico grafico--radar">
    <svg viewBox="0 0 220 210" class="g-svg g-svg--fijo" role="img" aria-label="Atributos: ${ejes.map((e) => `${e.nombre} ${atributos[e.clave] || 0}`).join(', ')}">
      ${anillos}${radios}${area}${nodos}${textos}
    </svg>
  </div>`;
}

/** Anillo de progreso para la cifra principal del día. */
export function anillo({ pct, centroPrincipal, centroSecundario, tono = 'bien' }) {
  const r = 52;
  const circunferencia = 2 * Math.PI * r;
  const avance = Math.min(100, Math.max(0, pct));
  return `<div class="anillo">
    <svg viewBox="0 0 130 130" class="g-svg g-svg--fijo" aria-hidden="true">
      <circle cx="65" cy="65" r="${r}" class="anillo__pista"/>
      <circle cx="65" cy="65" r="${r}" class="anillo__avance anillo__avance--${tono}"
        stroke-dasharray="${circunferencia.toFixed(1)}"
        stroke-dashoffset="${(circunferencia * (1 - avance / 100)).toFixed(1)}"
        transform="rotate(-90 65 65)"/>
    </svg>
    <div class="anillo__centro">
      <strong>${centroPrincipal}</strong>
      <span class="tenue">${centroSecundario}</span>
    </div>
  </div>`;
}

/** Mapa de calor de cumplimiento diario. Rampa de un solo tono (azul), oscuro a claro. */
export function mapaCalor(dias) {
  const nivel = (pct) => {
    if (pct === null) return 'nulo';
    if (pct >= 100) return 'n4';
    if (pct >= 80) return 'n3';
    if (pct >= 40) return 'n2';
    if (pct > 0) return 'n1';
    return 'n0';
  };
  return `<div class="calor" role="img" aria-label="Cumplimiento de los últimos ${dias.length} días">
    ${dias.map((d) => `<span class="calor__celda calor__celda--${nivel(d.pct)}"
      data-tip="${esc(`<b>${d.fecha}</b><br>${d.pct === null ? 'sin registro' : `${d.cumplidos} de ${d.total} · ${d.pct}%`}`)}"></span>`).join('')}
  </div>
  <div class="calor__leyenda tenue">
    <span>Menos</span>
    <span class="calor__celda calor__celda--n1"></span>
    <span class="calor__celda calor__celda--n2"></span>
    <span class="calor__celda calor__celda--n3"></span>
    <span class="calor__celda calor__celda--n4"></span>
    <span>Más</span>
  </div>`;
}

/** Barra apilada 50/30/20 con separación de 2px entre segmentos. */
export function barraApilada({ segmentos, total }) {
  const base = Math.max(1, total);
  return `<div class="apilada">
    ${segmentos.map((s) => {
    const pct = Math.max(0, (s.valor / base) * 100);
    if (pct < 0.6) return '';
    return `<div class="apilada__seg" style="width:${pct}%;background:var(${s.color})"
        data-tip="${esc(`<b>${s.nombre}</b><br>${clp(s.valor)} · ${redondear(pct, 1)}%`)}"></div>`;
  }).join('')}
  </div>
  ${leyenda(segmentos.map((s) => ({ nombre: `${s.nombre} ${redondear((s.valor / base) * 100, 0)}%`, color: s.color })))}`;
}

export function leyenda(series) {
  if (series.length < 2) return '';
  return `<div class="leyenda">${series.map((s) => `<span class="leyenda__item">
    <span class="leyenda__marca" style="background:var(${s.color})"></span>${esc(s.nombre)}</span>`).join('')}</div>`;
}

export function vacio(texto) {
  return `<p class="vacio">${esc(texto)}</p>`;
}

/** Tabla como alternativa accesible a cualquier gráfico. */
export function tablaDatos({ columnas, filas, titulo = 'Ver datos' }) {
  if (!filas.length) return '';
  return `<details class="tabla-datos">
    <summary>${esc(titulo)}</summary>
    <table>
      <thead><tr>${columnas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map((f) => `<tr>${f.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </details>`;
}
