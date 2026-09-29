// Motor de entrenamiento: niveles de desbloqueo, generación de rutinas y progresión de cargas.

import { EJERCICIOS, MAPA_EJERCICIOS, ORDEN_EQUIPO } from '../datos/ejercicios.js';
import { aleatorioConSemilla, barajar, redondear, suma, agrupar } from './utiles.js';

/** Niveles de contenido. Cada uno se abre cumpliendo nivel de avatar Y sesiones acumuladas. */
export const TIERS = [
  { tier: 1, nombre: 'Iniciación', nivel: 1, sesiones: 0, series: [2, 3], reps: [10, 15], descanso: 60, lema: 'Aprender el movimiento y no faltar.' },
  { tier: 2, nombre: 'Base', nivel: 3, sesiones: 6, series: [3, 3], reps: [8, 12], descanso: 75, lema: 'Construir la base: técnica firme y carga controlada.' },
  { tier: 3, nombre: 'Fuerza', nivel: 7, sesiones: 20, series: [3, 4], reps: [5, 8], descanso: 120, lema: 'Menos reps, más peso. Aquí empieza la fuerza real.' },
  { tier: 4, nombre: 'Hipertrofia avanzada', nivel: 12, sesiones: 45, series: [4, 5], reps: [8, 12], descanso: 90, lema: 'Volumen alto y técnicas de intensidad.' },
  { tier: 5, nombre: 'Élite', nivel: 18, sesiones: 80, series: [4, 6], reps: [3, 8], descanso: 150, lema: 'Movimientos de dominio corporal y cargas máximas.' },
];

export const DIVISIONES = {
  2: [
    { nombre: 'Cuerpo completo A', patrones: ['rodilla', 'empuje_h', 'tiron_h', 'core', 'metcon'] },
    { nombre: 'Cuerpo completo B', patrones: ['cadera', 'empuje_v', 'tiron_v', 'core', 'pantorrilla'] },
  ],
  3: [
    { nombre: 'Cuerpo completo A', patrones: ['rodilla', 'empuje_h', 'tiron_v', 'core'] },
    { nombre: 'Cuerpo completo B', patrones: ['cadera', 'empuje_v', 'tiron_h', 'core'] },
    { nombre: 'Cuerpo completo C', patrones: ['rodilla', 'empuje_h', 'tiron_h', 'metcon', 'core'] },
  ],
  4: [
    { nombre: 'Tren superior A (empuje)', patrones: ['empuje_h', 'empuje_v', 'hombro', 'brazo'] },
    { nombre: 'Tren inferior A', patrones: ['rodilla', 'cadera', 'pantorrilla', 'core'] },
    { nombre: 'Tren superior B (tirón)', patrones: ['tiron_v', 'tiron_h', 'hombro', 'brazo'] },
    { nombre: 'Tren inferior B', patrones: ['cadera', 'rodilla', 'core', 'metcon'] },
  ],
  5: [
    { nombre: 'Empuje', patrones: ['empuje_h', 'empuje_v', 'hombro', 'brazo'] },
    { nombre: 'Tirón', patrones: ['tiron_v', 'tiron_h', 'hombro', 'brazo'] },
    { nombre: 'Piernas', patrones: ['rodilla', 'cadera', 'pantorrilla', 'core'] },
    { nombre: 'Torso y brazos', patrones: ['empuje_h', 'tiron_h', 'brazo', 'core'] },
    { nombre: 'Piernas y acondicionamiento', patrones: ['cadera', 'rodilla', 'metcon', 'core'] },
  ],
  6: [
    { nombre: 'Empuje pesado', patrones: ['empuje_h', 'empuje_v', 'hombro'] },
    { nombre: 'Tirón pesado', patrones: ['tiron_v', 'tiron_h', 'brazo'] },
    { nombre: 'Piernas pesadas', patrones: ['rodilla', 'cadera', 'pantorrilla'] },
    { nombre: 'Empuje volumen', patrones: ['empuje_h', 'hombro', 'brazo'] },
    { nombre: 'Tirón volumen', patrones: ['tiron_h', 'tiron_v', 'brazo'] },
    { nombre: 'Piernas y core', patrones: ['cadera', 'rodilla', 'core', 'metcon'] },
  ],
};

/** Tier máximo desbloqueado según nivel de avatar y sesiones completadas. */
export function tierDesbloqueado(nivel, sesiones, tiersComprados = []) {
  let max = 1;
  for (const t of TIERS) {
    if ((nivel >= t.nivel && sesiones >= t.sesiones) || tiersComprados.includes(t.tier)) max = Math.max(max, t.tier);
  }
  return max;
}

export function estadoTiers(nivel, sesiones, tiersComprados = []) {
  const actual = tierDesbloqueado(nivel, sesiones, tiersComprados);
  return TIERS.map((t) => {
    const porNivel = nivel >= t.nivel && sesiones >= t.sesiones;
    const comprado = tiersComprados.includes(t.tier);
    return {
      ...t,
      desbloqueado: porNivel || comprado || t.tier <= actual,
      comprado,
      faltaNivel: Math.max(0, t.nivel - nivel),
      faltaSesiones: Math.max(0, t.sesiones - sesiones),
    };
  });
}

export function ejerciciosDisponibles(tierMax, equipo) {
  const limite = ORDEN_EQUIPO[equipo] ?? 0;
  return EJERCICIOS.filter((e) => e.tier <= tierMax && (ORDEN_EQUIPO[e.equipo] ?? 0) <= limite);
}

/**
 * Patrones equivalentes. Si el nivel o el equipo del usuario no tienen ningún
 * ejercicio de un patrón, se busca en el más parecido antes que dejar el hueco.
 */
const SUSTITUTOS = {
  empuje_v: ['empuje_h', 'hombro'],
  empuje_h: ['empuje_v'],
  tiron_v: ['tiron_h'],
  tiron_h: ['tiron_v'],
  hombro: ['empuje_v', 'empuje_h'],
  brazo: ['empuje_h', 'tiron_h'],
  rodilla: ['cadera'],
  cadera: ['rodilla'],
  pantorrilla: ['rodilla'],
  core: ['cadera'],
  metcon: ['core', 'rodilla'],
};

const MINIMO_EJERCICIOS = 4;

/**
 * Genera el plan semanal. Determinista para la misma semana y configuración,
 * así el usuario no ve la rutina cambiar cada vez que abre la app.
 */
export function generarPlanSemanal({ dias, equipo, tierMax, objetivo, semilla }) {
  const diasValidos = Math.min(6, Math.max(2, dias));
  const division = DIVISIONES[diasValidos];
  const tier = TIERS.find((t) => t.tier === tierMax) || TIERS[0];
  const disponibles = ejerciciosDisponibles(tierMax, equipo);
  const rnd = aleatorioConSemilla(`${semilla}|${diasValidos}|${equipo}|${tierMax}|${objetivo}`);

  const usados = new Set();

  /** Elige el mejor ejercicio de un patrón, evitando repetir dentro de la sesión. */
  const elegir = (patron, enSesion) => {
    const candidatos = disponibles.filter((e) => e.patron === patron && !enSesion.has(e.id));
    if (!candidatos.length) return null;
    // Prefiere el tier más alto disponible y los que aún no se usaron esta semana.
    return barajar(candidatos, rnd).sort((a, b) => {
      const pesoA = (usados.has(a.id) ? -5 : 0) + a.tier;
      const pesoB = (usados.has(b.id) ? -5 : 0) + b.tier;
      return pesoB - pesoA;
    })[0];
  };

  return division.map((sesion, indice) => {
    const ejercicios = [];
    const enSesion = new Set();

    for (const patron of sesion.patrones) {
      let elegido = elegir(patron, enSesion);
      for (const alterno of SUSTITUTOS[patron] || []) {
        if (elegido) break;
        elegido = elegir(alterno, enSesion);
      }
      if (!elegido) continue;
      usados.add(elegido.id);
      enSesion.add(elegido.id);
      ejercicios.push(construirPrescripcion(elegido, tier, objetivo));
    }

    // Si aún quedó corta (nivel bajo y poco equipo), se completa con lo que haya.
    if (ejercicios.length < MINIMO_EJERCICIOS) {
      const relleno = barajar(disponibles.filter((e) => !enSesion.has(e.id) && e.tipo !== 'cardio'), rnd)
        .sort((a, b) => (usados.has(a.id) ? 1 : 0) - (usados.has(b.id) ? 1 : 0));
      for (const extra of relleno) {
        if (ejercicios.length >= MINIMO_EJERCICIOS) break;
        usados.add(extra.id);
        enSesion.add(extra.id);
        ejercicios.push(construirPrescripcion(extra, tier, objetivo));
      }
    }

    return {
      indice,
      nombre: sesion.nombre,
      tier: tier.tier,
      tierNombre: tier.nombre,
      lema: tier.lema,
      descansoSeg: tier.descanso,
      duracionEstimadaMin: estimarDuracion(ejercicios, tier.descanso),
      ejercicios,
    };
  });
}

function construirPrescripcion(ejercicio, tier, objetivo) {
  let [sMin, sMax] = tier.series;
  let [rMin, rMax] = tier.reps;

  if (ejercicio.tipo === 'aislado') { rMin = Math.max(rMin, 10); rMax = Math.max(rMax, 15); }
  if (ejercicio.tipo === 'cardio') { sMin = 1; sMax = 1; }
  if (objetivo === 'perder') { rMax += 2; }
  if (objetivo === 'ganar' && ejercicio.tipo === 'compuesto') { sMax += 1; }

  const series = Math.round((sMin + sMax) / 2);
  return {
    ejercicioId: ejercicio.id,
    nombre: ejercicio.nombre,
    patron: ejercicio.patron,
    musculos: ejercicio.musculos,
    series,
    repMin: rMin,
    repMax: rMax,
    esTiempo: !!ejercicio.tiempo,
    esCorporal: !!ejercicio.corporal,
    unilateral: !!ejercicio.unilateral,
    objetivoTexto: ejercicio.tiempo
      ? `${series} × ${rMin * 5}-${rMax * 5} seg`
      : `${series} × ${rMin}-${rMax} reps`,
  };
}

function estimarDuracion(ejercicios, descansoSeg) {
  const seriesTotales = suma(ejercicios, (e) => e.series);
  const minutos = (seriesTotales * (40 + descansoSeg)) / 60 + 8; // +8 min de calentamiento
  return Math.round(minutos);
}

/** 1RM estimado con la fórmula de Epley. */
export function estimar1RM(pesoKg, reps) {
  if (!pesoKg || !reps) return 0;
  if (reps === 1) return pesoKg;
  return redondear(pesoKg * (1 + reps / 30), 1);
}

/** Volumen de una serie: peso × reps (tonelaje). */
export function tonelaje(series) {
  return suma(series, (s) => (Number(s.peso) || 0) * (Number(s.reps) || 0));
}

/**
 * Doble progresión: si todas las series llegaron al tope del rango, sube la carga.
 * Si ninguna llegó al mínimo, baja. En medio, mantener y sumar repeticiones.
 */
export function siguienteCarga(prescripcion, seriesRealizadas) {
  if (!seriesRealizadas.length) return { accion: 'mantener', mensaje: 'Sin registros previos: empieza con una carga que te deje 2 reps de margen.' };

  const completas = seriesRealizadas.filter((s) => s.reps >= prescripcion.repMax).length;
  const fallidas = seriesRealizadas.filter((s) => s.reps < prescripcion.repMin).length;
  const pesoBase = Math.max(...seriesRealizadas.map((s) => Number(s.peso) || 0));

  if (completas === seriesRealizadas.length) {
    if (prescripcion.esCorporal && pesoBase === 0) {
      return { accion: 'subir_reps', pesoSugerido: 0, mensaje: `Rango completo. Sube a ${prescripcion.repMax + 2} reps o pasa a la variante más difícil.` };
    }
    const incremento = pesoBase >= 40 ? 5 : 2.5;
    return { accion: 'subir', pesoSugerido: redondear(pesoBase + incremento, 1), mensaje: `¡Rango completo! Sube a ${redondear(pesoBase + incremento, 1)} kg la próxima sesión.` };
  }
  if (fallidas >= Math.ceil(seriesRealizadas.length / 2)) {
    const pesoSugerido = redondear(pesoBase * 0.9, 1);
    return { accion: 'bajar', pesoSugerido, mensaje: `Se te fue la mano. Baja a ${pesoSugerido} kg y consolida la técnica.` };
  }
  return { accion: 'mantener', pesoSugerido: pesoBase, mensaje: `Mantén ${pesoBase || 'el peso corporal'} y suma repeticiones hasta llegar a ${prescripcion.repMax}.` };
}

/**
 * Series de aproximación para llegar a la carga de trabajo sin llegar frío
 * ni cansado. Porcentajes clásicos: 40-60-80 y una de 90% solo en cargas altas.
 * Se desbloquea en la tienda (func:calentamiento).
 */
export function seriesDeAproximacion(pesoObjetivo, opciones = {}) {
  const { esCorporal = false, barra = 20, incremento = 2.5 } = opciones;

  if (esCorporal || !pesoObjetivo) {
    return {
      tipo: 'corporal',
      series: [
        { descripcion: 'Movilidad del patrón, sin carga', reps: 10 },
        { descripcion: 'Variante más fácil del ejercicio', reps: 8 },
        { descripcion: 'El ejercicio, a mitad de esfuerzo', reps: 5 },
      ],
      nota: 'En peso corporal el calentamiento es por dificultad, no por kilos: se empieza por la variante fácil.',
    };
  }

  const redondear = (v) => Math.max(barra, Math.round(v / incremento) * incremento);
  const tramos = pesoObjetivo >= barra * 2.5
    ? [{ pct: 0.4, reps: 8 }, { pct: 0.6, reps: 5 }, { pct: 0.8, reps: 3 }, { pct: 0.9, reps: 1 }]
    : [{ pct: 0.5, reps: 8 }, { pct: 0.75, reps: 4 }];

  const series = tramos
    .map((t) => ({ peso: redondear(pesoObjetivo * t.pct), reps: t.reps, pct: Math.round(t.pct * 100) }))
    // Con cargas bajas varios tramos caen en la barra sola: se deja uno.
    .filter((s, i, lista) => i === 0 || s.peso > lista[i - 1].peso);

  return {
    tipo: 'carga',
    objetivo: pesoObjetivo,
    series,
    nota: `Descansa poco entre aproximaciones (30-60 s). La última serie de calentamiento no debe cansarte: es para ajustar la técnica con ${series[series.length - 1].peso} kg.`,
  };
}

/**
 * Detecta si toca una semana de descarga. Mira la carga máxima semanal de los
 * ejercicios principales: si lleva varias semanas subiendo sin bajar, el cuerpo
 * necesita bajar el volumen antes de estancarse; si lleva varias sin mejorar,
 * ya se estancó. Se desbloquea en la tienda (func:deload).
 */
export function detectarDescarga(historial, opciones = {}) {
  const { semanasParaDescarga = 4, semanasDeEstancamiento = 3, semanaActual = null } = opciones;

  // Mejor 1RM estimado de cada semana, sobre los compuestos.
  const porSemana = new Map();
  for (const sesion of historial) {
    const semana = sesion.semana;
    if (!semana) continue;
    for (const ej of sesion.ejercicios || []) {
      const info = MAPA_EJERCICIOS.get(ej.ejercicioId);
      if (!info || info.tipo !== 'compuesto') continue;
      for (const s of ej.series || []) {
        const rm = estimar1RM(Number(s.peso) || 0, Number(s.reps) || 0);
        if (rm <= 0) continue;
        porSemana.set(semana, Math.max(porSemana.get(semana) || 0, rm));
      }
    }
  }

  const semanas = [...porSemana.entries()]
    .map(([semana, rm]) => ({ semana, rm: redondear(rm, 1) }))
    .sort((a, b) => a.semana.localeCompare(b.semana));

  if (semanas.length < 3) {
    return {
      necesita: false, semanas,
      mensaje: 'Aún no hay semanas suficientes para saber si vas subiendo o estancado. Registra al menos tres.',
    };
  }

  // Racha de semanas consecutivas con la carga al alza, mirando desde la última.
  let subiendo = 0;
  for (let i = semanas.length - 1; i > 0; i--) {
    if (semanas[i].rm > semanas[i - 1].rm + 0.5) subiendo++;
    else break;
  }
  let estancado = 0;
  for (let i = semanas.length - 1; i > 0; i--) {
    if (Math.abs(semanas[i].rm - semanas[i - 1].rm) <= 0.5) estancado++;
    else break;
  }

  const base = {
    semanas: semanas.slice(-12),
    subiendo,
    estancado,
    ultimaSemana: semanas[semanas.length - 1].semana,
    semanaActual,
  };

  if (subiendo >= semanasParaDescarga) {
    return {
      ...base, necesita: true, motivo: 'progresion',
      propuesta: { seriesPct: 60, cargaPct: 90, duracion: '1 semana' },
      mensaje: `Llevas ${subiendo} semanas seguidas subiendo carga. Antes de estancarte conviene una semana de descarga: mismas sesiones, 60% de las series y 90% del peso. No se pierde nada, se consolida.`,
    };
  }
  if (estancado >= semanasDeEstancamiento) {
    return {
      ...base, necesita: true, motivo: 'estancamiento',
      propuesta: { seriesPct: 50, cargaPct: 85, duracion: '1 semana' },
      mensaje: `Llevas ${estancado} semanas sin mejorar la carga. Eso suele ser fatiga acumulada, no falta de esfuerzo: baja a 50% de series y 85% del peso una semana y vuelve a subir.`,
    };
  }
  return {
    ...base, necesita: false,
    mensaje: subiendo > 0
      ? `Vas ${subiendo} ${subiendo === 1 ? 'semana' : 'semanas'} subiendo carga. La descarga se sugiere a las ${semanasParaDescarga}.`
      : 'Sin señales de fatiga acumulada por ahora. Sigue con el plan.',
  };
}

/** Récords personales por ejercicio, a partir del historial de sesiones. */
export function calcularRecords(historial) {
  const records = new Map();
  for (const sesion of historial) {
    for (const ej of sesion.ejercicios || []) {
      for (const s of ej.series || []) {
        const rm = estimar1RM(Number(s.peso) || 0, Number(s.reps) || 0);
        const actual = records.get(ej.ejercicioId);
        const candidato = {
          ejercicioId: ej.ejercicioId,
          nombre: MAPA_EJERCICIOS.get(ej.ejercicioId)?.nombre || ej.ejercicioId,
          peso: Number(s.peso) || 0,
          reps: Number(s.reps) || 0,
          rm,
          fecha: sesion.fecha,
        };
        if (!actual || rm > actual.rm || (rm === actual.rm && candidato.reps > actual.reps)) {
          records.set(ej.ejercicioId, candidato);
        }
      }
    }
  }
  return [...records.values()].sort((a, b) => b.rm - a.rm);
}

/** ¿Esta sesión contiene algún récord nuevo respecto al historial anterior? */
export function detectarPR(historialPrevio, sesionNueva) {
  const previos = new Map(calcularRecords(historialPrevio).map((r) => [r.ejercicioId, r.rm]));
  const nuevos = [];
  for (const ej of sesionNueva.ejercicios || []) {
    for (const s of ej.series || []) {
      const rm = estimar1RM(Number(s.peso) || 0, Number(s.reps) || 0);
      if (rm <= 0) continue;
      const anterior = previos.get(ej.ejercicioId) || 0;
      if (rm > anterior) {
        nuevos.push({
          ejercicioId: ej.ejercicioId,
          nombre: MAPA_EJERCICIOS.get(ej.ejercicioId)?.nombre || ej.ejercicioId,
          rm, anterior,
        });
        previos.set(ej.ejercicioId, rm);
      }
    }
  }
  // Un solo PR por ejercicio, el mejor.
  const mejores = new Map();
  for (const pr of nuevos) {
    if (!mejores.has(pr.ejercicioId) || mejores.get(pr.ejercicioId).rm < pr.rm) mejores.set(pr.ejercicioId, pr);
  }
  return [...mejores.values()];
}

/** Series semanales por grupo muscular, con lectura del rango recomendado (10-20). */
export function volumenSemanal(sesionesDeLaSemana) {
  const conteo = {};
  for (const sesion of sesionesDeLaSemana) {
    for (const ej of sesion.ejercicios || []) {
      const info = MAPA_EJERCICIOS.get(ej.ejercicioId);
      const series = (ej.series || []).length;
      if (!info || !series) continue;
      for (const m of info.musculos) {
        if (m === 'cardio') continue;
        conteo[m] = (conteo[m] || 0) + series;
      }
    }
  }
  return Object.entries(conteo)
    .map(([musculo, series]) => ({
      musculo,
      series,
      estado: series < 10 ? 'bajo' : series <= 20 ? 'optimo' : 'alto',
    }))
    .sort((a, b) => b.series - a.series);
}

/** Estadísticas del historial completo para el panel de progreso. */
export function resumenEntrenamiento(historial) {
  const sesiones = historial.length;
  const seriesTotales = suma(historial, (s) => suma(s.ejercicios || [], (e) => (e.series || []).length));
  const tonelajeTotal = suma(historial, (s) => suma(s.ejercicios || [], (e) => tonelaje(e.series || [])));
  const porSemana = agrupar(historial, (s) => s.semana || '');
  const semanas = [...porSemana.entries()]
    .map(([semana, lista]) => ({ semana, sesiones: lista.length, tonelaje: Math.round(suma(lista, (s) => suma(s.ejercicios || [], (e) => tonelaje(e.series || [])))) }))
    .sort((a, b) => a.semana.localeCompare(b.semana));
  return {
    sesiones,
    seriesTotales,
    tonelajeTotal: Math.round(tonelajeTotal),
    minutosTotales: suma(historial, (s) => s.duracionMin || 0),
    semanas: semanas.slice(-12),
  };
}

/** Racha de semanas consecutivas cumpliendo la meta de sesiones. */
export function rachaSemanal(historial, metaSesiones, semanasOrdenadas) {
  const porSemana = agrupar(historial, (s) => s.semana || '');
  let racha = 0;
  for (const semana of semanasOrdenadas) {
    const cumplio = (porSemana.get(semana) || []).length >= metaSesiones;
    if (!cumplio) break;
    racha++;
  }
  return racha;
}
