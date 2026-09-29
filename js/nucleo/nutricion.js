// Motor nutricional: gasto energético, objetivos de macros y micros, y orientación diaria.
// Todo calculado en el dispositivo con fórmulas validadas. Sin IA externa, sin internet.

import { ALIMENTOS, MAPA_ALIMENTOS, escalar } from '../datos/alimentos.js';
import { limitar, redondear, suma } from './utiles.js';

export const FACTORES_ACTIVIDAD = {
  sedentario: { factor: 1.2, etiqueta: 'Sedentario (oficina, poco movimiento)' },
  ligero: { factor: 1.375, etiqueta: 'Ligero (1-3 entrenos por semana)' },
  moderado: { factor: 1.55, etiqueta: 'Moderado (3-5 entrenos por semana)' },
  alto: { factor: 1.725, etiqueta: 'Alto (6-7 entrenos por semana)' },
  atleta: { factor: 1.9, etiqueta: 'Muy alto (trabajo físico + entreno diario)' },
};

export const OBJETIVOS = {
  perder: { etiqueta: 'Bajar grasa', ajuste: -0.2, protPorKg: 2.0, grasaPorKg: 0.8 },
  recomponer: { etiqueta: 'Recomposición (mantener peso, ganar músculo)', ajuste: 0, protPorKg: 2.0, grasaPorKg: 0.9 },
  ganar: { etiqueta: 'Ganar músculo', ajuste: 0.12, protPorKg: 1.8, grasaPorKg: 1.0 },
  salud: { etiqueta: 'Salud y mantención', ajuste: 0, protPorKg: 1.6, grasaPorKg: 1.0 },
};

/** Metabolismo basal — Mifflin-St Jeor (kcal/día). */
export function calcularTMB({ sexo, pesoKg, alturaCm, edad }) {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad;
  return Math.round(sexo === 'femenino' ? base - 161 : base + 5);
}

/** Gasto energético total diario. */
export function calcularGET(perfil) {
  const f = FACTORES_ACTIVIDAD[perfil.actividad]?.factor ?? 1.375;
  return Math.round(calcularTMB(perfil) * f);
}

export function imc(pesoKg, alturaCm) {
  const m = alturaCm / 100;
  return redondear(pesoKg / (m * m), 1);
}

export function clasificarIMC(valor) {
  if (valor < 18.5) return { texto: 'Bajo peso', tono: 'aviso' };
  if (valor < 25) return { texto: 'Peso normal', tono: 'bien' };
  if (valor < 30) return { texto: 'Sobrepeso', tono: 'aviso' };
  return { texto: 'Obesidad', tono: 'mal' };
}

/**
 * Objetivos diarios completos a partir del perfil.
 * Proteína y grasa por kg de peso; carbohidrato = calorías restantes.
 */
export function calcularObjetivos(perfil) {
  const get = calcularGET(perfil);
  const obj = OBJETIVOS[perfil.objetivo] ?? OBJETIVOS.salud;
  const kcal = Math.max(1200, Math.round(get * (1 + obj.ajuste)));

  const prot = Math.round(perfil.pesoKg * obj.protPorKg);
  const grasa = Math.round(perfil.pesoKg * obj.grasaPorKg);
  const kcalRestantes = kcal - prot * 4 - grasa * 9;
  const carb = Math.max(50, Math.round(kcalRestantes / 4));

  // Agua: 35 ml/kg + 500 ml por sesión de entrenamiento planificada.
  const entrenosDia = (perfil.diasEntreno || 3) / 7;
  const agua = Math.round((perfil.pesoKg * 35 + entrenosDia * 500) / 50) * 50;

  return {
    tmb: calcularTMB(perfil),
    get,
    kcal,
    prot,
    carb,
    grasa,
    agua,                                     // ml
    azucar: Math.round((kcal * 0.10) / 4),    // límite: 10% de las kcal en azúcares libres
    azucarIdeal: Math.round((kcal * 0.05) / 4), // meta OMS: menos del 5%
    sodio: 2000,                              // mg, recomendación OMS
    fibra: Math.round((kcal / 1000) * 14),    // 14 g por cada 1000 kcal
  };
}

/** Suma nutricional de una lista de registros {alimentoId, gramos}. */
export function totalizarRegistros(registros) {
  const total = { kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0, agua: 0 };
  for (const r of registros) {
    const alimento = MAPA_ALIMENTOS.get(r.alimentoId);
    if (!alimento) continue;
    const n = escalar(alimento, r.gramos);
    for (const k of Object.keys(total)) total[k] += n[k] || 0;
  }
  for (const k of Object.keys(total)) total[k] = redondear(total[k], 1);
  return total;
}

/**
 * Compara consumo vs objetivos y devuelve el estado de cada nutriente.
 * tipo 'meta' = hay que llegar; tipo 'limite' = no hay que pasarse.
 */
export function evaluarDia(total, objetivos, aguaExtraMl = 0) {
  const agua = total.agua + aguaExtraMl;
  const fila = (clave, consumido, meta, tipo, unidad) => {
    const pct = meta ? (consumido / meta) * 100 : 0;
    let estado = 'bajo';
    if (tipo === 'meta') {
      if (pct >= 95 && pct <= 110) estado = 'optimo';
      else if (pct > 110) estado = 'exceso';
    } else {
      estado = pct <= 100 ? 'optimo' : 'exceso';
    }
    return {
      clave, consumido: redondear(consumido, 1), meta, tipo, unidad,
      pct: redondear(pct, 0), estado, falta: redondear(Math.max(0, meta - consumido), 1),
    };
  };

  return {
    kcal: fila('Calorías', total.kcal, objetivos.kcal, 'meta', 'kcal'),
    prot: fila('Proteínas', total.prot, objetivos.prot, 'meta', 'g'),
    carb: fila('Carbohidratos', total.carb, objetivos.carb, 'meta', 'g'),
    grasa: fila('Grasas', total.grasa, objetivos.grasa, 'meta', 'g'),
    fibra: fila('Fibra', total.fibra, objetivos.fibra, 'meta', 'g'),
    agua: fila('Agua', agua, objetivos.agua, 'meta', 'ml'),
    azucar: fila('Azúcares', total.azucar, objetivos.azucar, 'limite', 'g'),
    sodio: fila('Sodio', total.sodio, objetivos.sodio, 'limite', 'mg'),
  };
}

/** ¿Cerró el día dentro de la meta calórica y con proteína suficiente? */
export function diaEnMeta(evaluacion) {
  return evaluacion.kcal.pct >= 90 && evaluacion.kcal.pct <= 110 && evaluacion.prot.pct >= 90;
}

/**
 * Orientación del día: qué falta, qué sobra y qué comer para cerrar los huecos.
 * Ordena los alimentos por cuánto ayudan al macro faltante sin romper los límites.
 */
export function orientacionDelDia(evaluacion, opciones = {}) {
  const mensajes = [];
  const { kcal, prot, carb, grasa, fibra, agua, azucar, sodio } = evaluacion;

  if (kcal.consumido === 0) {
    mensajes.push({ tono: 'info', texto: 'Aún no registras nada hoy. Empieza por el desayuno para que el plan se ajuste a tu día real.' });
  } else if (kcal.pct < 60) {
    mensajes.push({ tono: 'aviso', texto: `Vas en ${kcal.pct}% de tus calorías. Te faltan ${Math.round(kcal.falta)} kcal: comer muy por debajo frena el metabolismo y te hace perder músculo.` });
  } else if (kcal.pct > 110) {
    mensajes.push({ tono: 'mal', texto: `Te pasaste ${redondear(kcal.consumido - kcal.meta, 0)} kcal. Compénsalo con una caminata de 30-40 min, no saltándote la próxima comida.` });
  } else if (kcal.pct >= 95) {
    mensajes.push({ tono: 'bien', texto: 'Calorías en el punto. Así se construye el hábito.' });
  }

  if (prot.falta > 15) {
    mensajes.push({ tono: 'aviso', texto: `Te faltan ${prot.falta} g de proteína. Es el macro que protege tu músculo cuando bajas de peso: priorízalo.` });
  } else if (prot.pct >= 95) {
    mensajes.push({ tono: 'bien', texto: 'Proteína cubierta. Tu recuperación de hoy está asegurada.' });
  }
  if (azucar.estado === 'exceso') {
    mensajes.push({ tono: 'mal', texto: `Azúcares en ${azucar.consumido} g (límite ${azucar.meta} g). Revisa bebidas, yogures de sabor y galletas: ahí se esconde casi todo.` });
  }
  if (sodio.estado === 'exceso') {
    mensajes.push({ tono: 'mal', texto: `Sodio en ${sodio.consumido} mg (límite ${sodio.meta} mg). Pan, fiambres, quesos y caldos concentrados son los principales aportes.` });
  }
  if (agua.pct < 70) {
    mensajes.push({ tono: 'aviso', texto: `Hidratación en ${agua.pct}%. Te faltan ${Math.round(agua.falta)} ml, unos ${Math.ceil(agua.falta / 250)} vasos.` });
  }
  if (fibra.pct < 60 && kcal.pct > 50) {
    mensajes.push({ tono: 'aviso', texto: `Fibra baja (${fibra.consumido} g de ${fibra.meta} g). Agrega verduras, legumbres o fruta con cáscara.` });
  }
  if (grasa.pct > 130) {
    mensajes.push({ tono: 'aviso', texto: 'Grasas altas. No son el enemigo, pero son densas en calorías: mide el aceite con cuchara.' });
  }
  if (carb.pct < 50 && opciones.entrenaHoy) {
    mensajes.push({ tono: 'aviso', texto: 'Entrenas hoy y vas bajo en carbohidratos. Son el combustible de las series duras: come algo 1-2 h antes.' });
  }

  return { mensajes, sugerencias: sugerirAlimentos(evaluacion) };
}

/**
 * Elige alimentos que cierran los huecos del día.
 * Puntaje = aporte al macro faltante − penalización por azúcar/sodio ya excedidos.
 */
export function sugerirAlimentos(evaluacion, cantidad = 6) {
  const faltaProt = evaluacion.prot.falta;
  const faltaCarb = evaluacion.carb.falta;
  const faltaGrasa = evaluacion.grasa.falta;
  const faltaFibra = evaluacion.fibra.falta;
  const kcalDisponibles = Math.max(0, evaluacion.kcal.meta - evaluacion.kcal.consumido);
  const azucarApretado = evaluacion.azucar.pct > 70;
  const sodioApretado = evaluacion.sodio.pct > 70;

  const candidatos = ALIMENTOS
    .filter((a) => a.cat !== 'Bebida' && a.cat !== 'Snack')
    .map((a) => {
      const n = escalar(a, a.porcion);
      if (kcalDisponibles > 0 && n.kcal > kcalDisponibles * 1.15) return null;

      let puntaje = 0;
      if (faltaProt > 10) puntaje += (n.prot / Math.max(faltaProt, 1)) * 100;
      if (faltaCarb > 15) puntaje += (n.carb / Math.max(faltaCarb, 1)) * 55;
      if (faltaGrasa > 8) puntaje += (n.grasa / Math.max(faltaGrasa, 1)) * 45;
      if (faltaFibra > 4) puntaje += (n.fibra / Math.max(faltaFibra, 1)) * 40;
      if (azucarApretado) puntaje -= n.azucar * 3;
      if (sodioApretado) puntaje -= n.sodio / 25;
      // Penaliza el gasto calórico: preferimos densidad nutricional, no volumen de kcal.
      puntaje -= n.kcal / 40;
      return { alimento: a, puntaje, nutrientes: n };
    })
    .filter(Boolean)
    .sort((a, b) => b.puntaje - a.puntaje);

  return candidatos.slice(0, cantidad).map((c) => ({
    id: c.alimento.id,
    nombre: c.alimento.nombre,
    gramos: c.alimento.porcion,
    medida: c.alimento.medida,
    kcal: Math.round(c.nutrientes.kcal),
    prot: redondear(c.nutrientes.prot, 1),
    motivo: motivoSugerencia(c.nutrientes, { faltaProt, faltaCarb, faltaGrasa, faltaFibra }),
  }));
}

function motivoSugerencia(n, faltas) {
  const razones = [];
  if (faltas.faltaProt > 10 && n.prot >= 10) razones.push(`+${Math.round(n.prot)} g proteína`);
  if (faltas.faltaCarb > 15 && n.carb >= 15) razones.push(`+${Math.round(n.carb)} g carbos`);
  if (faltas.faltaGrasa > 8 && n.grasa >= 8) razones.push(`+${Math.round(n.grasa)} g grasas buenas`);
  if (faltas.faltaFibra > 4 && n.fibra >= 3) razones.push(`+${Math.round(n.fibra)} g fibra`);
  return razones.length ? razones.join(' · ') : 'aporte equilibrado';
}

/**
 * Reparte las calorías objetivo en comidas del día, con un reparto de macros por comida.
 */
export function repartirComidas(objetivos, numeroComidas = 4) {
  const plantillas = {
    3: [{ nombre: 'Desayuno', p: 0.3 }, { nombre: 'Almuerzo', p: 0.4 }, { nombre: 'Cena', p: 0.3 }],
    4: [{ nombre: 'Desayuno', p: 0.25 }, { nombre: 'Almuerzo', p: 0.35 }, { nombre: 'Colación', p: 0.15 }, { nombre: 'Cena', p: 0.25 }],
    5: [{ nombre: 'Desayuno', p: 0.22 }, { nombre: 'Colación AM', p: 0.1 }, { nombre: 'Almuerzo', p: 0.33 }, { nombre: 'Colación PM', p: 0.1 }, { nombre: 'Cena', p: 0.25 }],
  };
  const plan = plantillas[numeroComidas] || plantillas[4];
  return plan.map((c) => ({
    nombre: c.nombre,
    kcal: Math.round(objetivos.kcal * c.p),
    prot: Math.round(objetivos.prot * c.p),
    carb: Math.round(objetivos.carb * c.p),
    grasa: Math.round(objetivos.grasa * c.p),
  }));
}

/** Proyección de cambio de peso según el déficit o superávit real de los últimos días. */
export function proyectarPeso(historialKcal, objetivos, pesoActual) {
  if (!historialKcal.length) return null;
  const promedio = suma(historialKcal) / historialKcal.length;
  const balanceDiario = promedio - objetivos.get;
  const kgPorSemana = redondear((balanceDiario * 7) / 7700, 2); // 7700 kcal ≈ 1 kg de grasa
  return {
    promedioKcal: Math.round(promedio),
    balanceDiario: Math.round(balanceDiario),
    kgPorSemana,
    pesoEn4Semanas: redondear(pesoActual + kgPorSemana * 4, 1),
    sostenible: Math.abs(kgPorSemana) <= limitar(pesoActual * 0.01, 0.3, 1),
  };
}
