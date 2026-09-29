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
  /* Recomposición: perder grasa y ganar músculo a la vez. Es posible, pero no
     para cualquiera ni en cualquier momento (ver viabilidadRecomposicion).
     Los parámetros salen de lo que muestra la evidencia que funciona: déficit
     moderado —no agresivo— y proteína claramente más alta que en una dieta
     normal de definición. */
  recomponer: { etiqueta: 'Perder grasa y ganar músculo a la vez', ajuste: -0.1, protPorKg: 2.4, grasaPorKg: 0.9 },
  ganar: { etiqueta: 'Ganar músculo', ajuste: 0.12, protPorKg: 1.8, grasaPorKg: 1.0 },
  salud: { etiqueta: 'Salud y mantención', ajuste: 0, protPorKg: 1.6, grasaPorKg: 1.0 },
};

export const EXPERIENCIA = {
  novato: { etiqueta: 'Menos de 6 meses entrenando', meses: 3 },
  intermedio: { etiqueta: 'Entre 6 meses y 2 años', meses: 15 },
  avanzado: { etiqueta: 'Más de 2 años entrenando en serio', meses: 36 },
  retomando: { etiqueta: 'Retomando tras una pausa larga', meses: 1 },
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

/**
 * Estimación de grasa corporal a partir del IMC (fórmula de Deurenberg).
 * Es una estimación poblacional con un error de alrededor de ±5 puntos: sirve
 * para orientar una decisión, no para ponerla en una ficha. Si la persona sabe
 * su porcentaje real (balanza de bioimpedancia, caliper, DEXA), ese manda.
 */
export function estimarGrasaCorporal({ sexo, edad, pesoKg, alturaCm }) {
  const imcValor = imc(pesoKg, alturaCm);
  const esHombre = sexo !== 'femenino' ? 1 : 0;
  const bruto = 1.20 * imcValor + 0.23 * edad - 10.8 * esHombre - 5.4;
  return { valor: redondear(limitar(bruto, 3, 70), 1), estimado: true, margen: 5 };
}

/* Umbrales de grasa corporal desde donde la recomposición se vuelve más fácil
   o más difícil. Son referencias de uso común, no cortes exactos. */
const GRASA = {
  masculino: { alta: 20, baja: 12 },
  femenino: { alta: 30, baja: 20 },
};

/**
 * ¿Es realista para esta persona perder grasa y ganar músculo al mismo tiempo?
 *
 * La recomposición está documentada, pero no en todos: funciona cuando hay
 * margen de mejora. Quien recién parte, quien vuelve tras una pausa y quien
 * tiene reservas de grasa que movilizar la consiguen con cierta facilidad.
 * Alguien entrenado y ya delgado avanza tan lento que le rinde más separar las
 * etapas. Esta función dice cuál de los dos casos es, en vez de prometer lo
 * mismo a todos.
 */
export function viabilidadRecomposicion(perfil, datos = {}) {
  const { sesionesRegistradas = 0 } = datos;
  const sexo = perfil.sexo === 'femenino' ? 'femenino' : 'masculino';
  const umbral = GRASA[sexo];

  const declarada = Number(perfil.grasaCorporal) > 0 ? Number(perfil.grasaCorporal) : null;
  const estimacion = estimarGrasaCorporal(perfil);
  const grasa = declarada !== null ? declarada : estimacion.valor;
  const esEstimada = declarada === null;

  // Si no declaró experiencia, se infiere de lo que lleva registrado en la app.
  const experiencia = perfil.experiencia
    || (sesionesRegistradas >= 80 ? 'avanzado' : sesionesRegistradas >= 25 ? 'intermedio' : 'novato');

  const grasaAlta = grasa >= umbral.alta;
  const grasaBaja = grasa <= umbral.baja;
  const motivos = [];

  let nivel;
  if (experiencia === 'novato' || experiencia === 'retomando') {
    nivel = 'alta';
    motivos.push(experiencia === 'retomando'
      ? 'Vuelves tras una pausa: el músculo que ya tuviste se recupera mucho más rápido de lo que costó ganarlo la primera vez.'
      : 'Llevas poco tiempo entrenando, y ese es el período en que el cuerpo responde más a cualquier estímulo.');
  } else if (grasaAlta) {
    nivel = experiencia === 'avanzado' ? 'media' : 'alta';
    motivos.push(`Con ${esEstimada ? 'una grasa corporal estimada en' : 'un'} ${grasa}%, hay reservas de sobra que tu cuerpo puede usar como energía mientras construye músculo.`);
  } else if (experiencia === 'avanzado' && grasaBaja) {
    nivel = 'baja';
    motivos.push(`Entrenas hace años y ya estás en ${grasa}% de grasa. En ese punto las dos cosas compiten de verdad: avanzarías tan lento que cuesta distinguirlo de no avanzar.`);
  } else {
    nivel = 'media';
    motivos.push('Estás en una zona intermedia: se puede, pero el avance será lento y hay que ser muy consistente para notarlo.');
  }

  if (esEstimada) {
    motivos.push(`El ${grasa}% es una estimación a partir de tu IMC, con un margen de unos ±${estimacion.margen} puntos. Si conoces tu porcentaje real, anótalo en el perfil y este análisis mejora.`);
  }

  const requisitos = [
    `Proteína alta: ${Math.round(perfil.pesoKg * OBJETIVOS.recomponer.protPorKg)} g al día (${OBJETIVOS.recomponer.protPorKg} g por kilo). Sin esto, no ocurre.`,
    'Déficit suave, no agresivo: la app usa 10% bajo tu gasto. Un déficit grande hace bajar de peso, pero se lleva músculo con la grasa.',
    'Entrenamiento de fuerza al menos 3 días por semana, subiendo carga o repeticiones. El estímulo es lo que decide si el peso que pierdes es grasa o músculo.',
    'Dormir 7 a 9 horas. Es donde se repara el músculo, y dormir mal echa abajo el resto.',
    'Meses, no semanas. La recomposición es lenta por definición.',
  ];

  const comoMedirlo = [
    'La balanza casi no se va a mover, y eso es lo esperado: estás cambiando grasa por músculo.',
    'Mide el contorno de cintura una vez por semana, en ayunas: es el mejor indicador casero de que la grasa baja.',
    'Mira tus cargas en la app. Si suben mientras la cintura baja, la recomposición está ocurriendo.',
    'Fotos cada 4 semanas, misma luz y misma hora.',
  ];

  const textos = {
    alta: {
      titulo: 'Sí, en tu caso es realista',
      explicacion: 'Estás en el escenario donde la recomposición sí funciona. Si cumples las condiciones de abajo, deberías ver la cintura bajar mientras las cargas suben.',
    },
    media: {
      titulo: 'Se puede, pero va a ser lento',
      explicacion: 'No es imposible, pero el avance será discreto y difícil de notar mes a mes. Si tienes prisa por un resultado visible, conviene separar las etapas.',
    },
    baja: {
      titulo: 'Te va a rendir más hacerlo por etapas',
      explicacion: 'En tu punto de entrenamiento y grasa corporal, perseguir las dos cosas a la vez suele terminar en ninguna. Separarlo en etapas —primero bajar grasa, después ganar músculo— avanza más en el mismo tiempo.',
    },
  };

  const salida = {
    nivel,
    ...textos[nivel],
    grasaCorporal: grasa,
    grasaEstimada: esEstimada,
    experiencia,
    motivos,
    requisitos,
    comoMedirlo,
  };

  if (nivel === 'baja') {
    salida.alternativa = {
      titulo: 'Por etapas',
      pasos: [
        'Primero una etapa de definición de 8 a 12 semanas con déficit moderado y proteína alta, para bajar la grasa.',
        'Después una etapa de volumen con superávit pequeño (10%) para ganar músculo con la menor grasa posible.',
        'Repetir el ciclo. Se avanza más en un año así que persiguiendo las dos cosas todo el tiempo.',
      ],
    };
  }
  return salida;
}

/** Proyección de cambio de peso según el déficit o superávit real de los últimos días. */
export function proyectarPeso(historialKcal, objetivos, pesoActual, objetivo = null) {
  if (!historialKcal.length) return null;
  const promedio = suma(historialKcal) / historialKcal.length;
  const balanceDiario = promedio - objetivos.get;
  const kgPorSemana = redondear((balanceDiario * 7) / 7700, 2); // 7700 kcal ≈ 1 kg de grasa
  const salida = {
    promedioKcal: Math.round(promedio),
    balanceDiario: Math.round(balanceDiario),
    kgPorSemana,
    pesoEn4Semanas: redondear(pesoActual + kgPorSemana * 4, 1),
    sostenible: Math.abs(kgPorSemana) <= limitar(pesoActual * 0.01, 0.3, 1),
  };
  /* En recomposición la proyección de peso engaña: el objetivo es cambiar la
     composición, no el número de la balanza. Se declara para que nadie lea una
     bajada mínima como falta de resultados. */
  if (objetivo === 'recomponer') {
    salida.pesoNoEsLaMedida = true;
    salida.nota = 'Vas en recomposición: el peso casi no debería moverse, porque estás cambiando grasa por músculo. Mide el avance con la cintura y con tus cargas, no con la balanza.';
  }
  return salida;
}
