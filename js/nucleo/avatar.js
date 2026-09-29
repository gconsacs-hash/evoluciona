// Avatar: SVG generado a partir de los atributos reales del usuario.
// Cuanta más fuerza registrada, más ancho de hombros y brazos. Cuanta mejor nutrición,
// más definición. La disciplina enciende el halo; las finanzas, los detalles del atuendo.

import { limitar } from './utiles.js';
import { etapaDesdeNivel } from './progreso.js';

export const TONOS_PIEL = {
  claro: { piel: '#f2c8a8', sombra: '#d9a880' },
  medio: { piel: '#d9a173', sombra: '#b87f52' },
  oliva: { piel: '#c08a5c', sombra: '#9c6a41' },
  moreno: { piel: '#8d5a3b', sombra: '#6d4229' },
  oscuro: { piel: '#5d3a26', sombra: '#432717' },
};

const ATUENDOS = {
  basico: { principal: '#5c6b7a', secundario: '#41505e', detalle: '#8f9dab', nombre: 'Básico' },
  deportivo: { principal: '#2f7fd4', secundario: '#1f5a9c', detalle: '#7cc0ff', nombre: 'Deportivo' },
  gimnasio: { principal: '#2a2f36', secundario: '#14181d', detalle: '#e0524a', nombre: 'Gimnasio' },
  guerrero: { principal: '#6b4a2a', secundario: '#4a3220', detalle: '#c9a227', nombre: 'Guerrero' },
  titan: { principal: '#2b1d47', secundario: '#1a1130', detalle: '#ffd35c', nombre: 'Titán' },
};

const AURAS = {
  fuego: ['#ff8a3d', '#ff3d00'],
  hielo: ['#7fdcff', '#1f8fd6'],
  dorada: ['#ffe07a', '#e0a400'],
};

/**
 * Devuelve el SVG del avatar como texto.
 * @param {object} cfg { nivel, atributos, avatar:{atuendo,aura,mascota}, tonoPiel, racha }
 */
export function dibujarAvatar(cfg) {
  const { nivel = 1, atributos = {}, avatar = {}, tonoPiel = 'medio', racha = 0 } = cfg;
  const fuerza = limitar(atributos.fuerza || 0, 0, 100);
  const nutricion = limitar(atributos.nutricion || 0, 0, 100);
  const resistencia = limitar(atributos.resistencia || 0, 0, 100);
  const disciplina = limitar(atributos.disciplina || 0, 0, 100);
  const finanzas = limitar(atributos.finanzas || 0, 0, 100);
  const etapa = etapaDesdeNivel(nivel);

  const piel = TONOS_PIEL[tonoPiel] || TONOS_PIEL.medio;
  const ropa = ATUENDOS[avatar.atuendo] || ATUENDOS.basico;

  // Geometría derivada de los atributos.
  const hombro = 26 + fuerza * 0.30;               // media anchura de hombros
  const cintura = 17 + fuerza * 0.06 - nutricion * 0.05;
  const cadera = 19 + fuerza * 0.05;
  const brazo = 5.2 + fuerza * 0.055;              // grosor del brazo
  const muslo = 8.5 + fuerza * 0.06;
  const cx = 100;

  const yHombro = 108;
  const yCintura = 168;
  const yCadera = 186;
  const yRodilla = 232;
  const yPie = 278;

  const definido = nutricion >= 45;
  const muyDefinido = nutricion >= 70 && fuerza >= 45;

  const partes = [];

  // --- Fondo y aura ---
  partes.push(`<defs>
    <radialGradient id="fondoAv" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,.10)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="pielGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${piel.piel}"/>
      <stop offset="70%" stop-color="${piel.piel}"/>
      <stop offset="100%" stop-color="${piel.sombra}"/>
    </linearGradient>
    <linearGradient id="ropaGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ropa.principal}"/>
      <stop offset="100%" stop-color="${ropa.secundario}"/>
    </linearGradient>
    ${auraDefs(avatar.aura)}
  </defs>`);
  partes.push(`<rect width="200" height="300" fill="url(#fondoAv)" rx="16"/>`);

  if (avatar.aura && AURAS[avatar.aura]) {
    const intensidad = limitar(0.25 + racha / 60, 0.25, 0.8);
    partes.push(`<ellipse cx="${cx}" cy="185" rx="${hombro + 34}" ry="118" fill="url(#auraGrad)" opacity="${intensidad.toFixed(2)}"/>`);
  }

  // Halo de disciplina
  if (disciplina >= 30) {
    const anillo = limitar(disciplina / 100, 0, 1);
    partes.push(`<ellipse cx="${cx}" cy="${yPie + 8}" rx="${52 + anillo * 18}" ry="${10 + anillo * 4}"
      fill="none" stroke="rgba(110,231,183,${0.15 + anillo * 0.45})" stroke-width="${1.5 + anillo * 2}"/>`);
  }

  // El manto va detrás del cuerpo, no encima.
  if (avatar.atuendo === 'titan') {
    partes.push(`<path d="M ${cx - hombro} ${yHombro - 4}
      C ${cx - hombro - 22} ${yCintura}, ${cx - hombro - 16} ${yCadera + 46}, ${cx - hombro + 4} ${yCadera + 58}
      L ${cx + hombro - 4} ${yCadera + 58}
      C ${cx + hombro + 16} ${yCadera + 46}, ${cx + hombro + 22} ${yCintura}, ${cx + hombro} ${yHombro - 4} Z"
      fill="#3b2a63" stroke="#241a3f" stroke-width="1.5" opacity=".92"/>`);
  }

  // --- Piernas --- (se separan lo justo para que el short no parezca falda)
  const separacion = Math.max(cadera * 0.52, muslo * 0.95);
  partes.push(pierna(cx - separacion, yCadera, yRodilla, yPie, muslo, ropa, piel, definido, 1));
  partes.push(pierna(cx + separacion, yCadera, yRodilla, yPie, muslo, ropa, piel, definido, -1));

  // --- Brazos ---
  partes.push(brazoSVG(cx - hombro, yHombro, brazo, piel, fuerza, -1));
  partes.push(brazoSVG(cx + hombro, yHombro, brazo, piel, fuerza, 1));

  // --- Torso ---
  const torso = `M ${cx - hombro} ${yHombro}
    C ${cx - hombro - 2} ${yHombro + 22}, ${cx - cintura - 3} ${yCintura - 20}, ${cx - cintura} ${yCintura}
    L ${cx - cadera} ${yCadera + 4}
    L ${cx + cadera} ${yCadera + 4}
    L ${cx + cintura} ${yCintura}
    C ${cx + cintura + 3} ${yCintura - 20}, ${cx + hombro + 2} ${yHombro + 22}, ${cx + hombro} ${yHombro}
    C ${cx + hombro * 0.4} ${yHombro - 9}, ${cx - hombro * 0.4} ${yHombro - 9}, ${cx - hombro} ${yHombro} Z`;
  partes.push(`<path d="${torso}" fill="url(#pielGrad)" stroke="${piel.sombra}" stroke-width="1"/>`);

  // Pectorales y abdominales aparecen con fuerza y definición
  if (fuerza >= 25) {
    const anchoPec = hombro * 0.62;
    partes.push(`<path d="M ${cx - anchoPec} ${yHombro + 12} Q ${cx - anchoPec * 0.45} ${yHombro + 28}, ${cx - 2} ${yHombro + 20}" fill="none" stroke="${piel.sombra}" stroke-width="1.4" opacity=".8"/>`);
    partes.push(`<path d="M ${cx + anchoPec} ${yHombro + 12} Q ${cx + anchoPec * 0.45} ${yHombro + 28}, ${cx + 2} ${yHombro + 20}" fill="none" stroke="${piel.sombra}" stroke-width="1.4" opacity=".8"/>`);
  }
  if (definido) {
    const filas = muyDefinido ? 4 : 3;
    for (let i = 0; i < filas; i++) {
      const y = yHombro + 36 + i * 11;
      const w = cintura * 0.55 - i * 1.2;
      partes.push(`<line x1="${cx - w}" y1="${y}" x2="${cx + w}" y2="${y}" stroke="${piel.sombra}" stroke-width="1" opacity=".55"/>`);
    }
    partes.push(`<line x1="${cx}" y1="${yHombro + 32}" x2="${cx}" y2="${yHombro + 36 + filas * 11}" stroke="${piel.sombra}" stroke-width="1" opacity=".45"/>`);
  }

  // --- Ropa ---
  // El short no debe sobresalir de las piernas o parece falda.
  const anchoShort = separacion + muslo * 0.9;
  partes.push(ropaSVG({ cx, hombro, cintura, cadera, anchoShort, yHombro, yCintura, yCadera, ropa, atuendo: avatar.atuendo, finanzas }));

  // --- Cabeza ---
  const rCabeza = 15.5;
  const yCabeza = yHombro - 26;
  partes.push(`<rect x="${cx - 5}" y="${yCabeza + rCabeza - 4}" width="10" height="14" rx="4" fill="${piel.sombra}"/>`);
  partes.push(`<circle cx="${cx}" cy="${yCabeza}" r="${rCabeza}" fill="url(#pielGrad)" stroke="${piel.sombra}" stroke-width="1"/>`);
  partes.push(`<path d="M ${cx - rCabeza} ${yCabeza - 3} Q ${cx} ${yCabeza - rCabeza - 7}, ${cx + rCabeza} ${yCabeza - 3} Q ${cx} ${yCabeza - 9}, ${cx - rCabeza} ${yCabeza - 3} Z" fill="#2c2118"/>`);
  partes.push(`<circle cx="${cx - 5.5}" cy="${yCabeza + 1}" r="1.7" fill="#2c2118"/>`);
  partes.push(`<circle cx="${cx + 5.5}" cy="${yCabeza + 1}" r="1.7" fill="#2c2118"/>`);
  const sonrisa = disciplina >= 50 ? 5 : 2;
  partes.push(`<path d="M ${cx - 4} ${yCabeza + 7} Q ${cx} ${yCabeza + 7 + sonrisa}, ${cx + 4} ${yCabeza + 7}" fill="none" stroke="#2c2118" stroke-width="1.3" stroke-linecap="round"/>`);

  // Corona en la etapa máxima
  if (etapa.etapa >= 9) {
    partes.push(`<path d="M ${cx - 12} ${yCabeza - rCabeza - 2} l 4 -8 4 5 4 -9 4 9 4 -5 4 8 Z" fill="#ffd35c" stroke="#c9a227" stroke-width="1"/>`);
  }

  // --- Compañero ---
  if (avatar.mascota) partes.push(mascotaSVG(avatar.mascota, fuerza));

  // Marca de resistencia: estela de movimiento
  if (resistencia >= 50) {
    partes.push(`<g opacity="${(0.2 + resistencia / 300).toFixed(2)}" stroke="#7cc0ff" stroke-width="1.6" stroke-linecap="round">
      <line x1="${cx - hombro - 16}" y1="140" x2="${cx - hombro - 6}" y2="140"/>
      <line x1="${cx - hombro - 20}" y1="152" x2="${cx - hombro - 8}" y2="152"/>
      <line x1="${cx - hombro - 14}" y1="164" x2="${cx - hombro - 5}" y2="164"/>
    </g>`);
  }

  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" class="avatar-svg" role="img"
    aria-label="Avatar etapa ${etapa.etapa}: ${etapa.nombre}">${partes.join('\n')}</svg>`;
}

function auraDefs(aura) {
  const colores = AURAS[aura];
  if (!colores) return '';
  return `<radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
    <stop offset="55%" stop-color="${colores[0]}" stop-opacity="0"/>
    <stop offset="82%" stop-color="${colores[0]}" stop-opacity=".55"/>
    <stop offset="100%" stop-color="${colores[1]}" stop-opacity="0"/>
  </radialGradient>`;
}

function pierna(x, yCadera, yRodilla, yPie, muslo, ropa, piel, definido, lado) {
  const pantorrilla = muslo * 0.72;
  const tobillo = muslo * 0.42;
  const d = `M ${x - muslo} ${yCadera}
    C ${x - muslo - 1} ${yRodilla - 18}, ${x - pantorrilla - 2} ${yRodilla - 4}, ${x - pantorrilla} ${yRodilla + 8}
    C ${x - pantorrilla + 1} ${yPie - 26}, ${x - tobillo} ${yPie - 14}, ${x - tobillo} ${yPie - 4}
    L ${x + tobillo} ${yPie - 4}
    C ${x + tobillo} ${yPie - 14}, ${x + pantorrilla - 1} ${yPie - 26}, ${x + pantorrilla} ${yRodilla + 8}
    C ${x + pantorrilla + 2} ${yRodilla - 4}, ${x + muslo + 1} ${yRodilla - 18}, ${x + muslo} ${yCadera} Z`;
  const zapato = `<path d="M ${x - tobillo - 1} ${yPie - 5} h ${tobillo * 2 + 2} v 6 q 0 3 -3 3 h ${-(tobillo * 2 - 4)} q -4 0 -4 -4 Z" fill="${ropa.detalle}" stroke="${ropa.secundario}" stroke-width="1"/>`;
  const cuadriceps = definido
    ? `<path d="M ${x + lado * muslo * 0.35} ${yCadera + 14} Q ${x + lado * muslo * 0.15} ${yRodilla - 22}, ${x + lado * muslo * 0.3} ${yRodilla - 6}" fill="none" stroke="${piel.sombra}" stroke-width="1" opacity=".5"/>`
    : '';
  return `<g>${`<path d="${d}" fill="url(#pielGrad)" stroke="${piel.sombra}" stroke-width="1"/>`}${cuadriceps}${zapato}</g>`;
}

function brazoSVG(x, y, grosor, piel, fuerza, lado) {
  const codoY = y + 38;
  const manoY = y + 76;
  const biceps = grosor * (1 + fuerza / 180);
  const d = `M ${x} ${y}
    C ${x + lado * (biceps + 2)} ${y + 12}, ${x + lado * (biceps + 1)} ${codoY - 8}, ${x + lado * grosor * 0.9} ${codoY}
    C ${x + lado * (grosor + 1)} ${codoY + 16}, ${x + lado * grosor * 0.8} ${manoY - 10}, ${x + lado * grosor * 0.7} ${manoY}
    L ${x - lado * grosor * 0.7} ${manoY}
    C ${x - lado * grosor * 0.5} ${manoY - 12}, ${x - lado * grosor * 0.6} ${codoY + 8}, ${x - lado * grosor * 0.5} ${codoY}
    C ${x - lado * grosor * 0.4} ${codoY - 14}, ${x - lado * (biceps * 0.3)} ${y + 10}, ${x} ${y} Z`;
  const mano = `<circle cx="${x + lado * grosor * 0.05}" cy="${manoY + 4}" r="${grosor * 0.85}" fill="${piel.piel}" stroke="${piel.sombra}" stroke-width="1"/>`;
  const trazoBiceps = fuerza >= 40
    ? `<path d="M ${x + lado * biceps * 0.45} ${y + 14} Q ${x + lado * biceps * 0.75} ${y + 24}, ${x + lado * biceps * 0.4} ${codoY - 6}" fill="none" stroke="${piel.sombra}" stroke-width="1" opacity=".55"/>`
    : '';
  return `<g><path d="${d}" fill="url(#pielGrad)" stroke="${piel.sombra}" stroke-width="1"/>${trazoBiceps}${mano}</g>`;
}

function ropaSVG({ cx, hombro, cintura, cadera, anchoShort, yHombro, yCintura, yCadera, ropa, atuendo, finanzas }) {
  const partes = [];
  const esMusculosa = atuendo === 'gimnasio' || atuendo === 'titan';
  const anchoTirante = esMusculosa ? hombro * 0.32 : hombro * 0.9;

  // Camiseta
  const camiseta = `M ${cx - anchoTirante} ${yHombro - 2}
    C ${cx - hombro * 0.9} ${yHombro + 24}, ${cx - cintura - 4} ${yCintura - 22}, ${cx - cintura - 1} ${yCintura - 4}
    L ${cx + cintura + 1} ${yCintura - 4}
    C ${cx + cintura + 4} ${yCintura - 22}, ${cx + hombro * 0.9} ${yHombro + 24}, ${cx + anchoTirante} ${yHombro - 2}
    C ${cx + anchoTirante * 0.4} ${yHombro + 10}, ${cx - anchoTirante * 0.4} ${yHombro + 10}, ${cx - anchoTirante} ${yHombro - 2} Z`;
  partes.push(`<path d="${camiseta}" fill="url(#ropaGrad)" stroke="${ropa.secundario}" stroke-width="1"/>`);

  // Short: acompaña el ancho de las piernas, con la entrepierna marcada.
  const short = `M ${cx - cadera - 1} ${yCintura - 4} L ${cx + cadera + 1} ${yCintura - 4}
    L ${cx + anchoShort} ${yCadera + 20} L ${cx + 3} ${yCadera + 14}
    L ${cx} ${yCadera + 22} L ${cx - 3} ${yCadera + 14} L ${cx - anchoShort} ${yCadera + 20} Z`;
  partes.push(`<path d="${short}" fill="${ropa.secundario}" stroke="${ropa.secundario}" stroke-width="1"/>`);

  // Cinturón de levantamiento
  if (atuendo === 'gimnasio' || atuendo === 'guerrero' || atuendo === 'titan') {
    partes.push(`<rect x="${cx - cintura - 3}" y="${yCintura - 12}" width="${(cintura + 3) * 2}" height="9" rx="3" fill="${ropa.detalle}" stroke="${ropa.secundario}" stroke-width="1"/>`);
  }
  // Hombreras
  if (atuendo === 'guerrero' || atuendo === 'titan') {
    partes.push(`<path d="M ${cx - hombro - 5} ${yHombro + 2} q ${-6} ${-14}, ${10} ${-16} q ${12} ${-1}, ${12} ${12} Z" fill="${ropa.detalle}" stroke="${ropa.secundario}" stroke-width="1"/>`);
    partes.push(`<path d="M ${cx + hombro + 5} ${yHombro + 2} q ${6} ${-14}, ${-10} ${-16} q ${-12} ${-1}, ${-12} ${12} Z" fill="${ropa.detalle}" stroke="${ropa.secundario}" stroke-width="1"/>`);
  }
  // Un buen puntaje financiero se nota en el detalle del atuendo
  if (finanzas >= 60) {
    partes.push(`<circle cx="${cx}" cy="${yHombro + 18}" r="3.4" fill="${ropa.detalle}" stroke="${ropa.secundario}" stroke-width=".8"/>`);
  }
  return partes.join('\n');
}

function mascotaSVG(tipo, fuerza) {
  if (tipo === 'lobo') {
    return `<g transform="translate(24,236) scale(0.9)">
      <ellipse cx="18" cy="24" rx="17" ry="10" fill="#6b7280"/>
      <circle cx="33" cy="15" r="8" fill="#6b7280"/>
      <path d="M 28 9 l 1 -7 5 5 Z" fill="#4b5563"/>
      <path d="M 37 9 l 4 -6 2 6 Z" fill="#4b5563"/>
      <circle cx="36" cy="14" r="1.4" fill="#111827"/>
      <path d="M 2 22 q -8 -6 -5 -14 q 5 5 7 11 Z" fill="#6b7280"/>
      <rect x="8" y="31" width="3.5" height="9" rx="1.6" fill="#4b5563"/>
      <rect x="24" y="31" width="3.5" height="9" rx="1.6" fill="#4b5563"/>
    </g>`;
  }
  if (tipo === 'dragon') {
    const escala = (0.75 + Math.min(fuerza, 100) / 250).toFixed(2);
    return `<g transform="translate(14,214) scale(${escala})">
      <ellipse cx="24" cy="30" rx="20" ry="12" fill="#7c3aed"/>
      <circle cx="43" cy="18" r="10" fill="#7c3aed"/>
      <path d="M 38 10 l 2 -9 6 6 Z" fill="#5b21b6"/>
      <path d="M 48 10 l 5 -7 1 7 Z" fill="#5b21b6"/>
      <circle cx="47" cy="17" r="1.7" fill="#fde68a"/>
      <path d="M 14 22 q 8 -22 26 -16 q -14 4 -18 18 Z" fill="#a78bfa"/>
      <path d="M 4 30 q -12 -4 -12 -16 q 9 4 13 12 Z" fill="#5b21b6"/>
      <rect x="12" y="40" width="4" height="10" rx="2" fill="#5b21b6"/>
      <rect x="30" y="40" width="4" height="10" rx="2" fill="#5b21b6"/>
    </g>`;
  }
  return '';
}

/** Texto que explica qué está reflejando el avatar ahora mismo. */
export function leerAvatar(atributos, nivel) {
  const etapa = etapaDesdeNivel(nivel);
  const lineas = [];
  const f = atributos.fuerza || 0;
  const n = atributos.nutricion || 0;
  const d = atributos.disciplina || 0;
  const fin = atributos.finanzas || 0;
  const r = atributos.resistencia || 0;

  lineas.push(`Etapa ${etapa.etapa} · ${etapa.nombre}: ${etapa.descripcion}`);
  if (f < 25) lineas.push('Los hombros crecerán cuando registres más carga en los básicos.');
  else if (f < 55) lineas.push('Se nota la masa en hombros y brazos: la carga está subiendo.');
  else lineas.push('Espalda ancha y brazos marcados. La fuerza ya es visible.');

  if (n < 45) lineas.push('Falta definición: necesitas más días dentro de tu meta calórica.');
  else if (n < 70) lineas.push('Abdomen marcándose. La nutrición está haciendo su parte.');
  else lineas.push('Definición completa: dieta bajo control sostenido.');

  if (d >= 30) lineas.push('El halo bajo tus pies es tu racha de hábitos.');
  if (r >= 50) lineas.push('Las líneas de movimiento indican tu acondicionamiento cardiovascular.');
  if (fin >= 60) lineas.push('El emblema del pecho aparece porque tus finanzas están sanas.');
  return lineas;
}
