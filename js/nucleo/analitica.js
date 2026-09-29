// Analítica avanzada: tendencias que solo aparecen cuando hay historial.
// Es el contenido que se desbloquea con func:estadisticas en la tienda.
//
// Todo lo que hay aquí son correlaciones descriptivas sobre los datos del
// propio usuario. Sirven para mirar el propio comportamiento, no para
// diagnosticar nada: una correlación entre comer más y levantar más no
// demuestra que una cosa cause la otra, y así se dice en los textos.

import { estimar1RM, tonelaje } from './entrenamiento.js';
import { MAPA_EJERCICIOS } from '../datos/ejercicios.js';
import { redondear, suma, diasEntre, agrupar } from './utiles.js';

/* Los textos de este módulo se muestran tal cual en pantalla, así que los
   números van con coma decimal como el resto de la app. */
function cifra(v, decimales = 1) {
  return (Number(v) || 0).toLocaleString('es-CL', {
    minimumFractionDigits: 0, maximumFractionDigits: decimales,
  });
}

/** Recta de mínimos cuadrados sobre puntos {x, y}. */
export function regresionLineal(puntos) {
  const n = puntos.length;
  if (n < 2) return null;
  const mediaX = suma(puntos, (p) => p.x) / n;
  const mediaY = suma(puntos, (p) => p.y) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of puntos) {
    const dx = p.x - mediaX, dy = p.y - mediaY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0) return null;
  const pendiente = sxy / sxx;
  const denominador = Math.sqrt(sxx * syy);
  return {
    pendiente,
    interseccion: mediaY - pendiente * mediaX,
    r: denominador === 0 ? 0 : redondear(sxy / denominador, 3),
    n,
  };
}

/** Cómo leer un coeficiente de correlación sin exagerar lo que dice. */
export function fuerzaCorrelacion(r) {
  const a = Math.abs(r);
  if (a >= 0.7) return { etiqueta: 'fuerte', tono: 'bien' };
  if (a >= 0.4) return { etiqueta: 'moderada', tono: 'aviso' };
  if (a >= 0.2) return { etiqueta: 'débil', tono: 'aviso' };
  return { etiqueta: 'sin relación aparente', tono: 'info' };
}

/**
 * Evolución del 1RM estimado de un ejercicio, sesión a sesión, con la
 * tendencia en kg por semana.
 */
export function tendencia1RM(historial, ejercicioId) {
  const puntos = [];
  for (const sesion of historial) {
    let mejor = 0;
    for (const ej of sesion.ejercicios || []) {
      if (ej.ejercicioId !== ejercicioId) continue;
      for (const s of ej.series || []) {
        mejor = Math.max(mejor, estimar1RM(Number(s.peso) || 0, Number(s.reps) || 0));
      }
    }
    if (mejor > 0) puntos.push({ fecha: sesion.fecha, rm: redondear(mejor, 1) });
  }
  puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!puntos.length) return null;

  const origen = puntos[0].fecha;
  const recta = regresionLineal(puntos.map((p) => ({ x: diasEntre(origen, p.fecha), y: p.rm })));
  const primero = puntos[0].rm;
  const ultimo = puntos[puntos.length - 1].rm;

  return {
    ejercicioId,
    nombre: MAPA_EJERCICIOS.get(ejercicioId)?.nombre || ejercicioId,
    puntos,
    sesiones: puntos.length,
    primero,
    ultimo,
    mejor: Math.max(...puntos.map((p) => p.rm)),
    ganancia: redondear(ultimo - primero, 1),
    gananciaPct: primero ? redondear(((ultimo - primero) / primero) * 100, 1) : 0,
    kgPorSemana: recta ? redondear(recta.pendiente * 7, 2) : 0,
    dias: diasEntre(origen, puntos[puntos.length - 1].fecha),
  };
}

/** Los ejercicios con más historial, que son los que dan tendencias fiables. */
export function ejerciciosConTendencia(historial, minimoSesiones = 3) {
  const conteo = new Map();
  for (const sesion of historial) {
    for (const ej of sesion.ejercicios || []) {
      if (!(ej.series || []).some((s) => Number(s.peso) > 0)) continue;
      conteo.set(ej.ejercicioId, (conteo.get(ej.ejercicioId) || 0) + 1);
    }
  }
  return [...conteo.entries()]
    .filter(([, n]) => n >= minimoSesiones)
    .map(([id]) => tendencia1RM(historial, id))
    .filter(Boolean)
    .sort((a, b) => b.sesiones - a.sesiones);
}

/**
 * ¿Los días que comes más rindes más? Cruza las calorías del día con el
 * tonelaje de la sesión de ese mismo día.
 */
export function relacionCaloriasRendimiento(historial, kcalPorFecha) {
  const puntos = [];
  for (const sesion of historial) {
    const kcal = kcalPorFecha[sesion.fecha];
    if (!kcal) continue;
    const volumen = suma(sesion.ejercicios || [], (e) => tonelaje(e.series || []));
    if (volumen <= 0) continue;
    puntos.push({ fecha: sesion.fecha, x: kcal, y: Math.round(volumen) });
  }
  if (puntos.length < 4) {
    return {
      puntos,
      suficiente: false,
      mensaje: `Necesitas al menos 4 días con comida y entrenamiento registrados el mismo día. Llevas ${puntos.length}.`,
    };
  }
  const recta = regresionLineal(puntos);
  const fuerza = fuerzaCorrelacion(recta.r);
  const signo = recta.r >= 0 ? 'más' : 'menos';
  return {
    puntos,
    suficiente: true,
    r: recta.r,
    fuerza: fuerza.etiqueta,
    tono: fuerza.tono,
    kgPorCada100kcal: redondear(recta.pendiente * 100, 1),
    mensaje: Math.abs(recta.r) < 0.2
      ? `Con ${puntos.length} días cruzados no se ve relación entre lo que comes y el volumen que mueves. Puede que tu rendimiento dependa más del descanso que de las calorías del mismo día.`
      : `Relación ${fuerza.etiqueta} (r = ${cifra(recta.r, 2)}): los días que comes más, mueves ${signo} volumen (${cifra(Math.abs(recta.pendiente * 100))} kg por cada 100 kcal). Son ${puntos.length} días cruzados, y una relación no demuestra causa: la comida del día previo y el sueño también pesan.`,
  };
}

/** Tendencia real del peso corporal y cuándo llegarías a una meta. */
export function tendenciaPeso(pesos, pesoObjetivo = null) {
  if (!pesos || pesos.length < 3) {
    return { suficiente: false, mensaje: 'Registra tu peso al menos tres días distintos para ver la tendencia real.' };
  }
  const orden = [...pesos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const origen = orden[0].fecha;
  const recta = regresionLineal(orden.map((p) => ({ x: diasEntre(origen, p.fecha), y: p.peso })));
  if (!recta) return { suficiente: false, mensaje: 'Los registros son todos del mismo día.' };

  const kgPorSemana = redondear(recta.pendiente * 7, 2);
  const actual = orden[orden.length - 1].peso;
  const salida = {
    suficiente: true,
    puntos: orden,
    kgPorSemana,
    actual,
    dias: diasEntre(origen, orden[orden.length - 1].fecha),
    // Con menos de 0,05 kg/semana el ruido de la balanza tapa la tendencia.
    estable: Math.abs(kgPorSemana) < 0.05,
  };

  if (salida.estable) {
    salida.mensaje = `Tu peso lleva ${salida.dias} días estable en torno a ${cifra(actual)} kg. Si buscabas cambiarlo, hay que mover las calorías.`;
    return salida;
  }
  salida.mensaje = `Tendencia real: ${kgPorSemana > 0 ? '+' : ''}${cifra(kgPorSemana, 2)} kg por semana, medida sobre ${orden.length} registros en ${salida.dias} días. Esta es la cifra que vale, no la diferencia entre dos pesadas.`;

  if (pesoObjetivo && Math.abs(pesoObjetivo - actual) > 0.2) {
    const falta = pesoObjetivo - actual;
    const semanas = falta / kgPorSemana;
    if (semanas > 0) {
      salida.semanasParaObjetivo = Math.ceil(semanas);
      salida.mensaje += ` A este ritmo llegarías a ${pesoObjetivo} kg en unas ${Math.ceil(semanas)} semanas.`;
    } else {
      salida.mensaje += ` Ojo: vas en dirección contraria a tu meta de ${pesoObjetivo} kg.`;
    }
  }
  return salida;
}

/** Volumen por semana y por grupo muscular, para ver dónde se concentra el trabajo. */
export function volumenPorSemanaYMusculo(historial, semanas = 8) {
  const porSemana = agrupar(historial, (s) => s.semana || '');
  const claves = [...porSemana.keys()].sort().slice(-semanas);
  return claves.map((semana) => {
    const sesiones = porSemana.get(semana) || [];
    const musculos = {};
    for (const sesion of sesiones) {
      for (const ej of sesion.ejercicios || []) {
        const info = MAPA_EJERCICIOS.get(ej.ejercicioId);
        if (!info) continue;
        const series = (ej.series || []).length;
        for (const m of info.musculos) {
          if (m === 'cardio') continue;
          musculos[m] = (musculos[m] || 0) + series;
        }
      }
    }
    return {
      semana,
      sesiones: sesiones.length,
      musculos,
      seriesTotales: suma(Object.values(musculos)),
      tonelaje: Math.round(suma(sesiones, (s) => suma(s.ejercicios || [], (e) => tonelaje(e.series || [])))),
    };
  });
}

/** Resumen para encabezar el panel: lo que más ha cambiado. */
export function titularesAnalitica(historial, kcalPorFecha, pesos, perfil) {
  const titulares = [];
  const tendencias = ejerciciosConTendencia(historial);

  const mejor = tendencias.filter((t) => t.kgPorSemana > 0).sort((a, b) => b.gananciaPct - a.gananciaPct)[0];
  if (mejor) {
    titulares.push({
      tono: 'bien',
      texto: `Tu mayor avance es en ${mejor.nombre}: de ${cifra(mejor.primero)} a ${cifra(mejor.ultimo)} kg de 1RM estimado (${mejor.gananciaPct > 0 ? '+' : ''}${cifra(mejor.gananciaPct)}%) en ${mejor.dias} días.`,
    });
  }
  const estancado = tendencias.filter((t) => t.sesiones >= 4 && Math.abs(t.kgPorSemana) < 0.1)[0];
  if (estancado) {
    titulares.push({
      tono: 'aviso',
      texto: `${estancado.nombre} lleva ${estancado.sesiones} sesiones sin moverse (${cifra(estancado.ultimo)} kg). Cambia el rango de repeticiones o baja el peso una semana y vuelve a subir.`,
    });
  }
  const peso = tendenciaPeso(pesos, null);
  if (peso.suficiente) titulares.push({ tono: peso.estable ? 'info' : 'bien', texto: peso.mensaje });

  const rel = relacionCaloriasRendimiento(historial, kcalPorFecha);
  if (rel.suficiente) titulares.push({ tono: rel.tono, texto: rel.mensaje });

  if (!titulares.length) {
    titulares.push({
      tono: 'info',
      texto: 'Todavía no hay historial suficiente para sacar tendencias. Con tres sesiones del mismo ejercicio y tres pesadas ya empieza a haber algo que mirar.',
    });
  }
  return titulares;
}
