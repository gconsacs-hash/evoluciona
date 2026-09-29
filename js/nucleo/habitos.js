// Rutinas diarias: hábitos con horario, rachas y cumplimiento.

import { hoyISO, sumarDias, agrupar, suma, redondear, id } from './utiles.js';

export const BLOQUES = {
  manana: { nombre: 'Mañana', icono: '🌅', orden: 1 },
  tarde: { nombre: 'Tarde', icono: '☀️', orden: 2 },
  noche: { nombre: 'Noche', icono: '🌙', orden: 3 },
};

export const AREAS = {
  cuerpo: { nombre: 'Cuerpo', color: 'var(--c-fuerza)' },
  mente: { nombre: 'Mente', color: 'var(--c-mente)' },
  nutricion: { nombre: 'Nutrición', color: 'var(--c-nutricion)' },
  dinero: { nombre: 'Dinero', color: 'var(--c-dinero)' },
  orden: { nombre: 'Orden', color: 'var(--c-orden)' },
};

/** Rutina inicial: hábitos de bajo costo que sostienen las otras tres áreas de la app. */
export function habitosIniciales() {
  const crear = (nombre, bloque, area, hora, meta = 1, unidad = '') =>
    ({ id: id('hab'), nombre, bloque, area, hora, meta, unidad, activo: true, creado: hoyISO() });

  return [
    crear('Beber 500 ml de agua al despertar', 'manana', 'nutricion', '07:00'),
    crear('Estirar o movilidad 5 minutos', 'manana', 'cuerpo', '07:15'),
    crear('Revisar el plan del día', 'manana', 'orden', '07:30'),
    crear('Desayuno con proteína', 'manana', 'nutricion', '08:00'),
    crear('Caminar 8.000 pasos', 'tarde', 'cuerpo', '13:00', 8000, 'pasos'),
    crear('Registrar los gastos del día', 'tarde', 'dinero', '19:00'),
    crear('Entrenamiento del día', 'tarde', 'cuerpo', '19:30'),
    crear('Leer 10 páginas', 'noche', 'mente', '22:00', 10, 'páginas'),
    crear('Sin pantallas 30 min antes de dormir', 'noche', 'mente', '22:30'),
    crear('Dormir antes de las 23:30', 'noche', 'cuerpo', '23:30'),
  ];
}

/**
 * Estado de los hábitos de un día.
 * registros: { [fechaISO]: { [habitoId]: valor } } — valor numérico o 1/0.
 */
export function estadoDia(habitos, registros, fecha = hoyISO()) {
  const delDia = registros[fecha] || {};
  const activos = habitos.filter((h) => h.activo);
  const items = activos.map((h) => {
    const valor = Number(delDia[h.id]) || 0;
    const meta = Number(h.meta) || 1;
    return {
      ...h,
      valor,
      cumplido: valor >= meta,
      pct: redondear(Math.min(100, (valor / meta) * 100), 0),
    };
  });
  const cumplidos = items.filter((i) => i.cumplido).length;
  return {
    fecha,
    items: items.sort((a, b) => (BLOQUES[a.bloque].orden - BLOQUES[b.bloque].orden) || a.hora.localeCompare(b.hora)),
    total: activos.length,
    cumplidos,
    pct: activos.length ? redondear((cumplidos / activos.length) * 100, 0) : 0,
    perfecto: activos.length > 0 && cumplidos === activos.length,
  };
}

export function porBloques(estado) {
  const grupos = agrupar(estado.items, (i) => i.bloque);
  return Object.entries(BLOQUES)
    .sort((a, b) => a[1].orden - b[1].orden)
    .map(([clave, info]) => ({
      clave,
      ...info,
      items: grupos.get(clave) || [],
    }))
    .filter((b) => b.items.length);
}

/** Racha de días consecutivos con al menos el umbral de cumplimiento (por defecto 80%). */
export function rachaActual(habitos, registros, hoy = hoyISO(), umbral = 80) {
  let racha = 0;
  let cursor = hoy;
  // El día de hoy solo cuenta si ya se cumplió el umbral; no rompe la racha si aún va en curso.
  const estadoHoy = estadoDia(habitos, registros, hoy);
  if (estadoHoy.pct >= umbral) racha++;
  cursor = sumarDias(hoy, -1);
  for (let i = 0; i < 400; i++) {
    const e = estadoDia(habitos, registros, cursor);
    if (e.total === 0 || e.pct < umbral) break;
    racha++;
    cursor = sumarDias(cursor, -1);
  }
  return racha;
}

export function rachaMasLarga(habitos, registros, umbral = 80) {
  const fechas = Object.keys(registros).sort();
  let mejor = 0;
  let actual = 0;
  let anterior = null;
  for (const fecha of fechas) {
    const e = estadoDia(habitos, registros, fecha);
    const cumple = e.pct >= umbral;
    if (!cumple) { actual = 0; anterior = fecha; continue; }
    actual = anterior && sumarDias(anterior, 1) === fecha ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = fecha;
  }
  return mejor;
}

/** Cumplimiento por hábito en los últimos N días: sirve para detectar el eslabón débil. */
export function cumplimientoPorHabito(habitos, registros, dias = 30, hoy = hoyISO()) {
  const fechas = [];
  for (let i = 0; i < dias; i++) fechas.push(sumarDias(hoy, -i));
  return habitos.filter((h) => h.activo).map((h) => {
    const meta = Number(h.meta) || 1;
    const conDatos = fechas.filter((f) => registros[f]);
    const cumplidos = conDatos.filter((f) => (Number(registros[f][h.id]) || 0) >= meta).length;
    return {
      ...h,
      dias: conDatos.length,
      cumplidos,
      pct: conDatos.length ? redondear((cumplidos / conDatos.length) * 100, 0) : 0,
    };
  }).sort((a, b) => a.pct - b.pct);
}

/** Últimos N días para el mapa de calor. */
export function historialReciente(habitos, registros, dias = 28, hoy = hoyISO()) {
  const salida = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = sumarDias(hoy, -i);
    const e = estadoDia(habitos, registros, fecha);
    salida.push({ fecha, pct: registros[fecha] ? e.pct : null, cumplidos: e.cumplidos, total: e.total });
  }
  return salida;
}

/** Puntaje de disciplina 0-100: mezcla cumplimiento reciente y racha. */
export function puntajeDisciplina(habitos, registros, hoy = hoyISO()) {
  const ultimos = historialReciente(habitos, registros, 14, hoy).filter((d) => d.pct !== null);
  const promedio = ultimos.length ? suma(ultimos, (d) => d.pct) / ultimos.length : 0;
  const racha = rachaActual(habitos, registros, hoy);
  return Math.round(Math.min(100, promedio * 0.75 + Math.min(racha, 30) * 0.83));
}

/** Consejos sobre la rutina: apuntan al hábito concreto que está fallando. */
export function consejosRutina(habitos, registros, hoy = hoyISO()) {
  const consejos = [];
  const estado = estadoDia(habitos, registros, hoy);
  const racha = rachaActual(habitos, registros, hoy);
  const debiles = cumplimientoPorHabito(habitos, registros, 21, hoy).filter((h) => h.dias >= 5 && h.pct < 50);

  if (!estado.total) {
    consejos.push({ tono: 'info', texto: 'No tienes hábitos activos. Empieza con tres, no con diez: la rutina se gana por constancia, no por volumen.' });
    return consejos;
  }
  if (estado.perfecto) consejos.push({ tono: 'bien', texto: '¡Día perfecto! Todos los hábitos cumplidos. Eso son tokens y XP extra.' });
  else if (estado.pct >= 80) consejos.push({ tono: 'bien', texto: `${estado.cumplidos} de ${estado.total} cumplidos. Te falta poco para el día perfecto.` });
  else if (estado.pct < 40) consejos.push({ tono: 'aviso', texto: `Vas en ${estado.pct}% del día. Elige el hábito más fácil de la lista y hazlo ahora: la inercia se rompe moviéndose.` });

  if (racha >= 7) consejos.push({ tono: 'bien', texto: `Racha de ${racha} días. Cuidado con romperla hoy, es tu activo más valioso.` });

  for (const h of debiles.slice(0, 2)) {
    consejos.push({ tono: 'aviso', texto: `"${h.nombre}" solo lo cumples ${h.pct}% de las veces. O lo mueves a otra hora, o lo haces más pequeño. Un hábito que no se cumple solo genera culpa.` });
  }
  return consejos;
}
