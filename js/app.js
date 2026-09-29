// Controlador de la app: estado, navegación y despacho de acciones.

import { cargar, guardar, repartirRecompensas, estadisticas } from './nucleo/almacen.js';
import { MONEDA, nivelDesdeXP } from './nucleo/progreso.js';
import { aviso, activarTooltips, cerrarModal } from './ui/comun.js';
import { num } from './nucleo/utiles.js';
import * as panel from './ui/vista-panel.js';
import * as rutina from './ui/vista-rutina.js';
import * as entreno from './ui/vista-entreno.js';
import * as nutricion from './ui/vista-nutricion.js';
import * as finanzas from './ui/vista-finanzas.js';
import * as tienda from './ui/vista-tienda.js';
import * as perfil from './ui/vista-perfil.js';
import * as diabetes from './ui/vista-diabetes.js';

const VISTAS = {
  panel: { modulo: panel, nombre: 'Panel', icono: '🧍' },
  rutina: { modulo: rutina, nombre: 'Rutina', icono: '🔥' },
  entreno: { modulo: entreno, nombre: 'Entrenar', icono: '🏋️' },
  nutricion: { modulo: nutricion, nombre: 'Nutrición', icono: '🥗' },
  // Solo aparece si la persona la activa en su perfil: la app no supone que
  // alguien tiene diabetes.
  diabetes: { modulo: diabetes, nombre: 'Diabetes', icono: '🩸', opcional: (e) => e.diabetes?.activo },
  finanzas: { modulo: finanzas, nombre: 'Finanzas', icono: '💰' },
  tienda: { modulo: tienda, nombre: 'Tienda', icono: '🛍️' },
  perfil: { modulo: perfil, nombre: 'Perfil', icono: '⚙️' },
};

function vistasVisibles() {
  return Object.entries(VISTAS).filter(([, v]) => !v.opcional || v.opcional(estado));
}

let estado = cargar();
let stats = estadisticas(estado);
let vistaActual = 'panel';

const accionesGlobales = {
  navegar(_ctx, elemento) { ir(elemento.dataset.vista); },
  cerrarModal() { cerrarModal(); },
};

const ctx = {
  get estado() { return estado; },
  get stats() { return stats; },
  ir,
  refrescar: render,
  aplicar(mutador) {
    const previo = estado;
    let siguiente = mutador(previo) || previo;
    const reparto = repartirRecompensas(siguiente);
    siguiente = reparto.estado;

    const nivelAntes = nivelDesdeXP(previo.progreso.xp);
    const nivelDespues = nivelDesdeXP(siguiente.progreso.xp);

    estado = siguiente;
    stats = estadisticas(estado);
    guardar(estado);
    render();

    anunciar(reparto, nivelAntes, nivelDespues);
  },
  reemplazar(nuevo) {
    estado = nuevo;
    stats = estadisticas(estado);
    guardar(estado);
    vistaActual = estado.configurado ? vistaActual : 'panel';
    render();
  },
};

function anunciar(reparto, nivelAntes, nivelDespues) {
  const xp = reparto.ganancias.reduce((a, g) => a + g.xp, 0);
  const tokens = reparto.ganancias.reduce((a, g) => a + g.tokens, 0);
  if (xp || tokens) {
    const partes = [];
    if (xp) partes.push(`+${num(xp)} XP`);
    if (tokens) partes.push(`+${num(tokens)} ${MONEDA.simbolo}`);
    aviso(partes.join(' · '), 'bien', 2600);
  }
  if (nivelDespues > nivelAntes) {
    aviso(`<strong>¡Nivel ${nivelDespues}!</strong><br>Tu avatar evolucionó.`, 'nivel', 5200);
  }
  for (const logro of reparto.logros) {
    aviso(`<strong>${logro.icono} ${logro.nombre}</strong><br>${logro.desc} · +${logro.tokens} ${MONEDA.simbolo}`, 'logro', 5600);
  }
}

function ir(nombre) {
  if (!VISTAS[nombre]) return;
  vistaActual = nombre;
  cerrarModal();
  if (location.hash.slice(1) !== nombre) history.replaceState(null, '', `#${nombre}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

function render() {
  document.documentElement.dataset.tema = estado.tema || 'base';
  const raiz = document.getElementById('app');
  if (!raiz) return;

  if (!estado.configurado) {
    raiz.innerHTML = perfil.htmlBienvenida();
    return;
  }

  // Si la vista activa dejó de estar disponible (se desactivó diabetes), se vuelve al panel.
  if (!vistasVisibles().some(([clave]) => clave === vistaActual)) vistaActual = 'panel';

  const vista = VISTAS[vistaActual];
  raiz.innerHTML = `
    <nav class="nav" aria-label="Secciones">
      <div class="nav__marca">Evoluciona</div>
      <div class="nav__enlaces">
        ${vistasVisibles().map(([clave, v]) => `
          <button class="nav__enlace ${clave === vistaActual ? 'nav__enlace--activo' : ''}"
            data-accion="navegar" data-vista="${clave}" aria-current="${clave === vistaActual}">
            <span aria-hidden="true">${v.icono}</span><span class="nav__texto">${v.nombre}</span>
          </button>`).join('')}
      </div>
      <div class="nav__estado">
        <span class="ficha ficha--chica">Nv ${stats.nivel}</span>
        <span class="ficha ficha--chica">${MONEDA.simbolo} ${num(estado.progreso.tokens)}</span>
      </div>
    </nav>
    <main class="contenido">${vista.modulo.html(ctx)}</main>`;
}

// --- Despacho de acciones -------------------------------------------------

function despachar(evento, tipo) {
  const elemento = evento.target.closest('[data-accion]');
  if (!elemento) return;
  const nombre = elemento.dataset.accion;

  // 'submit' solo para formularios; 'input' solo para campos; 'click' para el resto.
  if (tipo === 'submit' && elemento.tagName !== 'FORM') return;
  if (tipo === 'click' && (elemento.tagName === 'FORM' || esCampo(elemento))) return;
  if (tipo === 'input' && !esCampo(elemento)) return;

  const modulo = VISTAS[vistaActual]?.modulo;
  const manejador = modulo?.acciones?.[nombre] || accionesGlobales[nombre]
    || perfil.acciones[nombre]; // la bienvenida usa acciones del perfil sin estar en esa vista
  if (!manejador) return;
  manejador(ctx, elemento, evento);
}

function esCampo(elemento) {
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(elemento.tagName);
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar-modal]')) { cerrarModal(); return; }
  despachar(e, 'click');
});
document.addEventListener('submit', (e) => despachar(e, 'submit'));
document.addEventListener('input', (e) => despachar(e, 'input'));
document.addEventListener('change', (e) => {
  const elemento = e.target.closest('[data-accion]');
  if (!elemento || !esCampo(elemento) || elemento.type === 'number' || elemento.type === 'search') return;
  despachar(e, 'input');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

// --- Arranque -------------------------------------------------------------

activarTooltips();

// Los atajos del manifiesto (index.html#nutricion, #entreno, #finanzas) abren su sección.
const desdeHash = location.hash.slice(1);
if (VISTAS[desdeHash]) vistaActual = desdeHash;
window.addEventListener('hashchange', () => {
  const destino = location.hash.slice(1);
  if (VISTAS[destino] && destino !== vistaActual) ir(destino);
});

// Al abrir, se reparte lo que haya quedado pendiente (por ejemplo logros de una versión anterior).
const inicial = repartirRecompensas(estado);
estado = inicial.estado;
stats = estadisticas(estado);
guardar(estado);
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* sin conexión o sin permisos: la app funciona igual */ });
}

window.addEventListener('error', (e) => {
  console.error('Error en la app:', e.error || e.message);
});
