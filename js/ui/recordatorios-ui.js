// Puente entre la lógica de recordatorios y el navegador: permisos, el reloj
// que revisa cada minuto y las notificaciones en sí.
//
// Se mantiene aparte del núcleo para que aquella lógica siga siendo probable
// sin navegador. Aquí solo hay efectos: pedir permiso, poner un intervalo y
// mostrar avisos.

import {
  pendientesDeAvisar, textoRecordatorio, marcarAvisado, limpiarAvisados,
  estadoPermiso as leerPermiso,
} from '../nucleo/recordatorios.js';
import { hoyISO } from '../nucleo/utiles.js';

const CLAVE_AVISADOS = 'evoluciona.avisados';
const CADA_MS = 60000;

let reloj = null;

export const estadoPermiso = leerPermiso;
export function vigilando() { return reloj !== null; }

function leerAvisados() {
  try {
    const bruto = localStorage.getItem(CLAVE_AVISADOS);
    return limpiarAvisados(bruto ? JSON.parse(bruto) : {}, hoyISO());
  } catch {
    return {};
  }
}

function guardarAvisados(avisados) {
  try { localStorage.setItem(CLAVE_AVISADOS, JSON.stringify(avisados)); } catch { /* sin espacio, da igual */ }
}

export async function pedirPermiso() {
  if (typeof Notification === 'undefined') return leerPermiso();
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch { /* el usuario cerró el diálogo */ }
  }
  return leerPermiso();
}

function mostrar(habito) {
  const t = textoRecordatorio(habito);
  try {
    const n = new Notification(t.titulo, {
      body: t.cuerpo,
      tag: t.etiqueta,
      icon: './iconos/icono.svg',
      badge: './iconos/icono.svg',
    });
    n.addEventListener('click', () => {
      window.focus();
      location.hash = '#rutina';
      n.close();
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Empieza a revisar cada minuto. `obtener` devuelve {habitos, registros} del
 * estado actual: se pasa como función para leer siempre lo último, no una
 * copia congelada del momento en que se activó.
 */
export function arrancarVigilancia(obtener) {
  detenerVigilancia();
  if (leerPermiso().estado !== 'concedido') return false;

  const revisar = () => {
    const { habitos, registros } = obtener();
    let avisados = leerAvisados();
    const pendientes = pendientesDeAvisar({ habitos, registros, avisados });
    for (const h of pendientes) {
      if (!mostrar(h)) break;
      avisados = marcarAvisado(avisados, h.id);
    }
    guardarAvisados(avisados);
  };

  revisar();
  reloj = setInterval(revisar, CADA_MS);
  return true;
}

export function detenerVigilancia() {
  if (reloj) clearInterval(reloj);
  reloj = null;
}
