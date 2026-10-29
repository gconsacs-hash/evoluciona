// Programas de entrenamiento con nombre: disponibilidad, semana en curso y
// sesiones de la semana en el mismo formato que el plan automático, para que
// el registro de series, la progresión y los récords funcionen igual.

import { PROGRAMAS, MAPA_PROGRAMAS } from '../datos/programas.js';
import { MAPA_EJERCICIOS, ORDEN_EQUIPO, EQUIPOS } from '../datos/ejercicios.js';
import { TIERS } from './entrenamiento.js';
import { inicioSemana, suma } from './utiles.js';

/** Programas con su estado para la persona: si puede seguirlo y por qué no. */
export function programasParaPerfil({ equipo, tierMax, objetivo, dias }) {
  const limite = ORDEN_EQUIPO[equipo] ?? 0;
  return PROGRAMAS.map((p) => {
    const faltaEquipo = (ORDEN_EQUIPO[p.equipo] ?? 0) > limite;
    const faltaNivel = p.tier > tierMax;
    const recomendado = !faltaEquipo && !faltaNivel && p.objetivos.includes(objetivo) && Math.abs(p.dias - (dias || 3)) <= 1;
    return {
      ...p,
      disponible: !faltaEquipo && !faltaNivel,
      recomendado,
      motivo: faltaEquipo
        ? `Necesita ${EQUIPOS[p.equipo].toLowerCase()}. Cambia el equipo en tu perfil si lo tienes.`
        : faltaNivel
          ? `Se abre en el nivel de contenido ${p.tier} (${TIERS.find((t) => t.tier === p.tier)?.nombre}).`
          : '',
    };
  }).sort((a, b) => (b.recomendado - a.recomendado) || (b.disponible - a.disponible) || a.tier - b.tier);
}

/** Semana del programa (1 = la semana en que se empezó). */
export function semanaDelPrograma(inicio, hoy) {
  const a = new Date(`${inicioSemana(inicio)}T12:00:00`);
  const b = new Date(`${inicioSemana(hoy)}T12:00:00`);
  return Math.max(1, Math.floor(Math.round((b - a) / 86400000) / 7) + 1);
}

function prescripcion(entrada) {
  const info = MAPA_EJERCICIOS.get(entrada.id);
  const enTiempo = entrada.unidad !== 'reps';
  const rango = entrada.min === entrada.max ? `${entrada.min}` : `${entrada.min}-${entrada.max}`;
  const unidadTexto = { reps: 'reps', seg: 'seg', min: 'min' }[entrada.unidad];
  return {
    ejercicioId: entrada.id,
    nombre: info?.nombre || entrada.id,
    patron: info?.patron,
    musculos: info?.musculos || [],
    series: entrada.series,
    repMin: entrada.min,
    repMax: entrada.max,
    esTiempo: enTiempo,
    unidad: entrada.unidad,
    esCorporal: !!info?.corporal,
    unilateral: !!info?.unilateral,
    nota: entrada.nota || '',
    objetivoTexto: entrada.texto
      ? `${entrada.texto} (${rango} min)`
      : `${entrada.series} × ${rango} ${unidadTexto}${info?.unilateral && !enTiempo ? ' por lado' : ''}`,
  };
}

function duracion(ejercicios, descansoSeg) {
  const minutosCardio = suma(ejercicios.filter((e) => e.unidad === 'min'), (e) => e.repMax);
  const series = suma(ejercicios.filter((e) => e.unidad !== 'min'), (e) => e.series);
  return Math.round(minutosCardio + (series * (40 + descansoSeg)) / 60 + 5);
}

/**
 * Las sesiones que tocan esta semana. Si el programa tiene más plantillas que
 * días (A/B en 3 días), se rotan: semana 1 = A B A, semana 2 = B A B.
 */
export function sesionesDelPrograma(programa, semana) {
  let plantillas = programa.sesiones;
  if (programa.etapas) {
    const etapa = programa.etapas.find((e) => e.semanas.includes(semana)) || programa.etapas[programa.etapas.length - 1];
    plantillas = etapa.sesiones;
  }
  const dias = programa.dias;
  const elegidas = plantillas.length >= dias
    ? plantillas.slice(0, dias)
    : Array.from({ length: dias }, (_, i) => plantillas[((semana - 1) * dias + i) % plantillas.length]);

  const tier = TIERS.find((t) => t.tier === programa.tier) || TIERS[0];
  return elegidas.map((plantilla, indice) => {
    const ejercicios = plantilla.ejercicios.map(prescripcion);
    return {
      indice,
      nombre: plantilla.nombre,
      tier: programa.tier,
      tierNombre: tier.nombre,
      lema: programa.resumen,
      descansoSeg: programa.descanso,
      duracionEstimadaMin: duracion(ejercicios, programa.descanso),
      ejercicios,
      programaId: programa.id,
    };
  });
}

/** Todo lo que necesita la vista del programa activo, o null si no hay. */
export function programaActivo(elegido, hoy) {
  const programa = elegido && MAPA_PROGRAMAS.get(elegido.id);
  if (!programa) return null;
  const semana = semanaDelPrograma(elegido.inicio, hoy);
  return {
    programa,
    semana,
    terminado: semana > programa.semanas,
    // Pasadas las semanas del programa se sigue con la última etapa: no se corta en seco.
    sesiones: sesionesDelPrograma(programa, programa.etapas ? Math.min(semana, programa.semanas) : semana),
  };
}

export { PROGRAMAS, MAPA_PROGRAMAS };
