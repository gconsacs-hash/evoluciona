// Recordatorios de hábitos (artículo func:recordatorios de la tienda).
//
// Límite honesto: esta app no tiene servidor, y sin servidor un navegador no
// puede despertar solo para avisarte. Los recordatorios funcionan mientras la
// app esté abierta, aunque sea en una pestaña de fondo o en segundo plano en el
// teléfono. No reemplazan la alarma del celular para lo que de verdad no puedes
// olvidar; sirven para el empujón de "son las 19:00 y no has caminado".
//
// La lógica de decidir a quién avisar vive aquí, separada del navegador, para
// poder probarla sin depender de permisos ni de relojes reales.

import { hoyISO } from './utiles.js';

/** Minutos desde la medianoche de un "HH:MM". */
export function minutosDeHora(hora) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora || '').trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutosDeFecha(fecha) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

/**
 * Qué hábitos toca recordar ahora.
 *
 * Avisa dentro de una ventana después de la hora (por omisión 45 min): si
 * abres la app a las 20:00 no tiene sentido recordarte el hábito de las 07:00,
 * ese día ya se perdió y el aviso solo genera culpa.
 *
 * @param {object} p
 *   habitos      lista de hábitos
 *   registros    registros del día, para no avisar de lo ya cumplido
 *   avisados     { 'habitoId|fecha': true } de lo ya notificado
 *   ahora        Date
 *   ventanaMin   minutos de tolerancia después de la hora
 */
export function pendientesDeAvisar({ habitos, registros = {}, avisados = {}, ahora = new Date(), ventanaMin = 45 }) {
  const fecha = hoyISO(ahora);
  const delDia = registros[fecha] || {};
  const minutosAhora = minutosDeFecha(ahora);

  return habitos.filter((h) => {
    if (!h.activo) return false;
    const hora = minutosDeHora(h.hora);
    if (hora === null) return false;

    // Ya cumplido: no se molesta.
    const valor = Number(delDia[h.id]) || 0;
    if (valor >= (Number(h.meta) || 1)) return false;

    // Ya avisado hoy: una vez basta.
    if (avisados[`${h.id}|${fecha}`]) return false;

    const desfase = minutosAhora - hora;
    return desfase >= 0 && desfase <= ventanaMin;
  });
}

/** Texto del aviso. Recuerda qué hacer, no regaña. */
export function textoRecordatorio(habito) {
  const meta = Number(habito.meta) || 1;
  const detalle = meta > 1 && habito.unidad ? ` · meta: ${meta} ${habito.unidad}` : '';
  return {
    titulo: habito.nombre,
    cuerpo: `Tocaba a las ${habito.hora}${detalle}. Todavía estás a tiempo.`,
    etiqueta: `habito-${habito.id}`,
  };
}

export function marcarAvisado(avisados, habitoId, fecha = hoyISO()) {
  return { ...avisados, [`${habitoId}|${fecha}`]: true };
}

/** Quita las marcas de días pasados para que el registro no crezca sin fin. */
export function limpiarAvisados(avisados, hoy = hoyISO()) {
  const salida = {};
  for (const clave of Object.keys(avisados)) {
    if (clave.endsWith(`|${hoy}`)) salida[clave] = true;
  }
  return salida;
}

/** Estado del permiso del navegador, en palabras que se puedan mostrar. */
export function estadoPermiso() {
  if (typeof Notification === 'undefined') {
    return { soportado: false, estado: 'no_soportado', texto: 'Este navegador no puede mostrar avisos.' };
  }
  const p = Notification.permission;
  if (p === 'granted') return { soportado: true, estado: 'concedido', texto: 'Los avisos están activos.' };
  if (p === 'denied') {
    return {
      soportado: true, estado: 'denegado',
      texto: 'Bloqueaste los avisos para este sitio. Hay que reactivarlos desde los permisos del navegador.',
    };
  }
  return { soportado: true, estado: 'pendiente', texto: 'Falta darle permiso al navegador.' };
}
