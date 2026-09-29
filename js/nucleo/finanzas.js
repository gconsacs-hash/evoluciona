// Motor financiero: presupuesto mensual, balance, tasa de ahorro, metas y proyecciones.

import { mesDe, suma, agrupar, redondear, limitar, diasEntre, hoyISO, sumarDias } from './utiles.js';

export const CATEGORIAS_GASTO = [
  { id: 'vivienda', nombre: 'Vivienda y arriendo', grupo: 'necesidad', icono: '🏠' },
  { id: 'servicios', nombre: 'Servicios básicos', grupo: 'necesidad', icono: '💡' },
  { id: 'mercado', nombre: 'Supermercado', grupo: 'necesidad', icono: '🛒' },
  { id: 'transporte', nombre: 'Transporte y combustible', grupo: 'necesidad', icono: '🚗' },
  { id: 'salud', nombre: 'Salud y farmacia', grupo: 'necesidad', icono: '💊' },
  { id: 'educacion', nombre: 'Educación', grupo: 'necesidad', icono: '📚' },
  { id: 'deudas', nombre: 'Deudas y créditos', grupo: 'necesidad', icono: '🏦' },
  { id: 'comida_fuera', nombre: 'Comida fuera y delivery', grupo: 'gusto', icono: '🍔' },
  { id: 'entretencion', nombre: 'Entretención y suscripciones', grupo: 'gusto', icono: '🎬' },
  { id: 'ropa', nombre: 'Ropa y cuidado personal', grupo: 'gusto', icono: '👕' },
  { id: 'gimnasio', nombre: 'Gimnasio y deporte', grupo: 'gusto', icono: '🏋️' },
  { id: 'regalos', nombre: 'Regalos y celebraciones', grupo: 'gusto', icono: '🎁' },
  { id: 'otros', nombre: 'Otros', grupo: 'gusto', icono: '📦' },
];

export const MAPA_CATEGORIAS = new Map(CATEGORIAS_GASTO.map((c) => [c.id, c]));

export const CATEGORIAS_INGRESO = [
  { id: 'sueldo', nombre: 'Sueldo', icono: '💼' },
  { id: 'extra', nombre: 'Trabajos extra', icono: '🔧' },
  { id: 'venta', nombre: 'Ventas', icono: '🏷️' },
  { id: 'inversion', nombre: 'Intereses e inversiones', icono: '📈' },
  { id: 'otro_ingreso', nombre: 'Otros ingresos', icono: '✨' },
];

/**
 * Cierra el mes: ingresos, gastos, ahorro, tasa de ahorro y comparación 50/30/20.
 * movimientos: {id, fecha, tipo: 'ingreso'|'gasto'|'ahorro', categoria, monto, nota}
 */
export function resumenMensual(movimientos, mes) {
  const delMes = movimientos.filter((m) => mesDe(m.fecha) === mes);
  const ingresos = suma(delMes.filter((m) => m.tipo === 'ingreso'), (m) => m.monto);
  const gastos = suma(delMes.filter((m) => m.tipo === 'gasto'), (m) => m.monto);
  const ahorroExplicito = suma(delMes.filter((m) => m.tipo === 'ahorro'), (m) => m.monto);

  const necesidades = suma(delMes.filter((m) => m.tipo === 'gasto' && MAPA_CATEGORIAS.get(m.categoria)?.grupo === 'necesidad'), (m) => m.monto);
  const gustos = gastos - necesidades;
  const balance = ingresos - gastos - ahorroExplicito;
  const ahorroReal = ahorroExplicito + Math.max(0, balance);

  return {
    mes,
    ingresos,
    gastos,
    ahorroExplicito,
    balance,
    ahorroReal,
    necesidades,
    gustos,
    tasaAhorro: ingresos ? redondear((ahorroReal / ingresos) * 100, 1) : 0,
    regla: {
      necesidadesPct: ingresos ? redondear((necesidades / ingresos) * 100, 1) : 0,
      gustosPct: ingresos ? redondear((gustos / ingresos) * 100, 1) : 0,
      ahorroPct: ingresos ? redondear((ahorroReal / ingresos) * 100, 1) : 0,
      objetivo: { necesidades: 50, gustos: 30, ahorro: 20 },
    },
    porCategoria: desglosePorCategoria(delMes),
    movimientos: delMes.sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

export function desglosePorCategoria(movimientos) {
  const gastos = movimientos.filter((m) => m.tipo === 'gasto');
  const total = suma(gastos, (m) => m.monto);
  const grupos = agrupar(gastos, (m) => m.categoria);
  return [...grupos.entries()]
    .map(([categoria, lista]) => {
      const info = MAPA_CATEGORIAS.get(categoria);
      const monto = suma(lista, (m) => m.monto);
      return {
        categoria,
        nombre: info?.nombre || categoria,
        icono: info?.icono || '📦',
        grupo: info?.grupo || 'gusto',
        monto,
        pct: total ? redondear((monto / total) * 100, 1) : 0,
        cantidad: lista.length,
      };
    })
    .sort((a, b) => b.monto - a.monto);
}

/** Compara el gasto del mes con el presupuesto por categoría y devuelve alertas. */
export function evaluarPresupuesto(resumen, presupuesto, diaDelMes, diasDelMes) {
  const avanceMes = diasDelMes ? diaDelMes / diasDelMes : 1;
  const filas = [];
  for (const cat of CATEGORIAS_GASTO) {
    const tope = Number(presupuesto?.[cat.id]) || 0;
    if (!tope) continue;
    const gastado = resumen.porCategoria.find((c) => c.categoria === cat.id)?.monto || 0;
    const pct = tope ? redondear((gastado / tope) * 100, 0) : 0;
    const esperado = tope * avanceMes;
    let estado = 'bien';
    if (gastado > tope) estado = 'mal';
    else if (gastado > esperado * 1.2) estado = 'aviso';
    filas.push({ ...cat, categoria: cat.id, tope, gastado, pct, esperado: Math.round(esperado), disponible: tope - gastado, estado });
  }
  const alertas = filas
    .filter((f) => f.estado !== 'bien')
    .map((f) => ({
      tono: f.estado,
      texto: f.estado === 'mal'
        ? `${f.nombre}: te pasaste del presupuesto en $${Math.round(f.gastado - f.tope).toLocaleString('es-CL')}.`
        : `${f.nombre}: vas en ${f.pct}% del presupuesto y el mes va en ${Math.round(avanceMes * 100)}%. Frena ahí.`,
    }));
  return { filas: filas.sort((a, b) => b.pct - a.pct), alertas };
}

/** Sugiere un presupuesto inicial con la regla 50/30/20 ajustada a categorías. */
export function sugerirPresupuesto(ingresoMensual) {
  const pesos = {
    vivienda: 0.25, servicios: 0.06, mercado: 0.13, transporte: 0.06, salud: 0.03,
    educacion: 0.02, deudas: 0.05, comida_fuera: 0.06, entretencion: 0.04,
    ropa: 0.03, gimnasio: 0.02, regalos: 0.02, otros: 0.03,
  };
  const resultado = {};
  for (const [cat, p] of Object.entries(pesos)) {
    resultado[cat] = Math.round((ingresoMensual * p) / 1000) * 1000;
  }
  return resultado;
}

/** Fondo de emergencia: cuántos meses de gastos fijos cubre el ahorro acumulado. */
export function fondoEmergencia(ahorroAcumulado, gastosMensualesPromedio) {
  if (!gastosMensualesPromedio) return { meses: 0, estado: 'sin_datos', mensaje: 'Registra un mes completo de gastos para calcular tu colchón.' };
  const meses = redondear(ahorroAcumulado / gastosMensualesPromedio, 1);
  let estado = 'mal';
  let mensaje = `Tu colchón cubre ${meses} meses. Bajo 1 mes cualquier imprevisto se convierte en deuda.`;
  if (meses >= 6) { estado = 'excelente'; mensaje = `${meses} meses de colchón. Estás blindado: ahora el ahorro puede ir a inversión.`; }
  else if (meses >= 3) { estado = 'bien'; mensaje = `${meses} meses de colchón. Vas bien, la meta sana son 6 meses.`; }
  else if (meses >= 1) { estado = 'aviso'; mensaje = `${meses} meses de colchón. Apunta primero a 3 meses antes de cualquier otra meta.`; }
  return { meses, estado, mensaje, objetivoMonto: Math.round(gastosMensualesPromedio * 6) };
}

/**
 * Proyecta una meta de ahorro: cuándo se cumple con el aporte mensual actual.
 * meta: {id, nombre, montoObjetivo, montoActual, aporteMensual, fechaLimite}
 */
export function proyectarMeta(meta, hoy = hoyISO()) {
  const falta = Math.max(0, meta.montoObjetivo - meta.montoActual);
  const aporte = Number(meta.aporteMensual) || 0;
  const pct = meta.montoObjetivo ? redondear((meta.montoActual / meta.montoObjetivo) * 100, 1) : 0;

  if (falta === 0) return { ...meta, pct: 100, cumplida: true, mensaje: '¡Meta cumplida! Cobra tus tokens.', mesesFaltantes: 0 };
  if (aporte <= 0) return { ...meta, pct, cumplida: false, mesesFaltantes: null, mensaje: 'Define un aporte mensual para saber cuándo la cumples.' };

  const mesesFaltantes = Math.ceil(falta / aporte);
  const fechaEstimada = sumarDias(hoy, mesesFaltantes * 30);
  let mensaje = `A ${pesos(aporte)} por mes la cumples en ${mesesFaltantes} ${mesesFaltantes === 1 ? 'mes' : 'meses'} (≈ ${fechaEstimada}).`;

  if (meta.fechaLimite) {
    const diasDisponibles = diasEntre(hoy, meta.fechaLimite);
    const mesesDisponibles = Math.max(0, diasDisponibles / 30);
    if (mesesDisponibles > 0) {
      const aporteNecesario = Math.ceil(falta / mesesDisponibles / 1000) * 1000;
      if (aporteNecesario > aporte) {
        mensaje += ` Para llegar a tu fecha límite necesitas ${pesos(aporteNecesario)} al mes.`;
      }
    } else {
      mensaje += ' La fecha límite ya pasó: ajústala o sube el aporte.';
    }
  }
  return { ...meta, pct, cumplida: false, falta, mesesFaltantes, fechaEstimada, mensaje };
}

/** Interés compuesto con aportes mensuales (para mostrar el efecto de ahorrar de verdad). */
export function proyectarInteresCompuesto({ inicial = 0, aporteMensual = 0, tasaAnual = 0.05, meses = 60 }) {
  const tasaMensual = tasaAnual / 12;
  const puntos = [];
  let saldo = inicial;
  let aportado = inicial;
  for (let m = 1; m <= meses; m++) {
    saldo = saldo * (1 + tasaMensual) + aporteMensual;
    aportado += aporteMensual;
    if (m % 6 === 0 || m === meses) {
      puntos.push({ mes: m, saldo: Math.round(saldo), aportado: Math.round(aportado), interes: Math.round(saldo - aportado) });
    }
  }
  return { puntos, saldoFinal: Math.round(saldo), aportadoTotal: Math.round(aportado), interesGanado: Math.round(saldo - aportado) };
}

/** Monto en pesos para los textos de consejo. */
function pesos(monto) {
  return `$${Math.round(monto).toLocaleString('es-CL')}`;
}

/**
 * Consejos accionables a partir de los números reales del mes.
 * No moraliza: apunta al monto concreto y a qué hacer con él.
 */
export function consejosFinancieros(resumen, presupuestoEval, historialMeses = []) {
  const consejos = [];
  const { ingresos, gastos, tasaAhorro, porCategoria, regla } = resumen;

  if (!ingresos) {
    consejos.push({ tono: 'info', texto: 'Registra tu sueldo del mes para que el resto de los cálculos tengan sentido.' });
    return consejos;
  }

  // El indicador que importa aquí es el excedente, no la tasa: la tasa se trunca en cero
  // cuando el mes cierra en rojo y escondería el problema.
  if (ingresos - gastos < 0) {
    consejos.push({ tono: 'mal', texto: `Estás gastando ${pesos(gastos - ingresos)} más de lo que entra. Esto es deuda creciendo: corta primero los gustos, no la comida.` });
  } else if (tasaAhorro < 10) {
    consejos.push({ tono: 'aviso', texto: `Ahorras ${tasaAhorro}% de tu ingreso. Sube a 10% recortando ${pesos(ingresos * 0.1 - resumen.ahorroReal)} de gustos: es la meta más realista para empezar.` });
  } else if (tasaAhorro >= 20) {
    consejos.push({ tono: 'bien', texto: `${tasaAhorro}% de tasa de ahorro. Estás en el tramo que construye patrimonio, no solo colchón.` });
  } else {
    consejos.push({ tono: 'bien', texto: `${tasaAhorro}% ahorrado. Vas encaminado; la meta siguiente es 20%.` });
  }

  if (regla.necesidadesPct > 60) {
    consejos.push({ tono: 'aviso', texto: `Tus gastos fijos son ${regla.necesidadesPct}% del ingreso (lo sano es 50%). Con esta estructura ahorrar cuesta el doble: revisa arriendo, deudas y plan de celular.` });
  }

  const top = porCategoria[0];
  if (top && top.pct > 30) {
    consejos.push({ tono: 'info', texto: `${top.nombre} se lleva ${top.pct}% de tus gastos (${pesos(top.monto)}). Si recortas un 15% de ahí, liberas ${pesos(top.monto * 0.15)} al mes sin tocar nada más.` });
  }

  const delivery = porCategoria.find((c) => c.categoria === 'comida_fuera');
  if (delivery && delivery.monto > ingresos * 0.08) {
    const veces = delivery.cantidad === 1 ? '1 ocasión' : `${delivery.cantidad} ocasiones`;
    consejos.push({ tono: 'aviso', texto: `Comida fuera: ${pesos(delivery.monto)} en ${veces}. Cocinar algunas de esas veces te devuelve plata y te ordena las calorías al mismo tiempo.` });
  }

  for (const alerta of presupuestoEval?.alertas || []) consejos.push(alerta);

  if (historialMeses.length >= 2) {
    const [previo, actual] = historialMeses.slice(-2);
    const dif = actual.gastos - previo.gastos;
    if (Math.abs(dif) > ingresos * 0.05) {
      consejos.push({
        tono: dif > 0 ? 'aviso' : 'bien',
        texto: dif > 0
          ? `Gastaste ${pesos(dif)} más que el mes pasado. Revisa qué categoría se movió.`
          : `Gastaste ${pesos(-dif)} menos que el mes pasado. Manda esa diferencia al ahorro antes de que se evapore.`,
      });
    }
  }

  return consejos;
}

/** Serie histórica mes a mes, para el gráfico de balance. */
export function serieMensual(movimientos, cantidadMeses = 12) {
  const meses = [...new Set(movimientos.map((m) => mesDe(m.fecha)))].sort();
  return meses.slice(-cantidadMeses).map((mes) => {
    const r = resumenMensual(movimientos, mes);
    return { mes, ingresos: r.ingresos, gastos: r.gastos, ahorro: r.ahorroReal, tasaAhorro: r.tasaAhorro };
  });
}

/** Promedio de gastos de los últimos meses cerrados (para el fondo de emergencia). */
export function gastoMensualPromedio(movimientos, mesActual) {
  const serie = serieMensual(movimientos).filter((s) => s.mes !== mesActual);
  if (!serie.length) {
    const actual = resumenMensual(movimientos, mesActual);
    return actual.gastos;
  }
  return Math.round(suma(serie, (s) => s.gastos) / serie.length);
}

/** Puntaje de salud financiera 0-100, para alimentar el avatar. */
export function puntajeFinanciero({ tasaAhorro, mesesColchon, cumplimientoPresupuesto, registroDias }) {
  const pAhorro = limitar((tasaAhorro / 20) * 40, 0, 40);
  const pColchon = limitar((mesesColchon / 6) * 30, 0, 30);
  const pPresupuesto = limitar(cumplimientoPresupuesto * 20, 0, 20);
  const pConstancia = limitar((registroDias / 20) * 10, 0, 10);
  return Math.round(pAhorro + pColchon + pPresupuesto + pConstancia);
}
