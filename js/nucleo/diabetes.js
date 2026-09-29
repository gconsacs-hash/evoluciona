// Seguimiento de diabetes: glicemias, dosis indicadas y los indicadores que de
// verdad se usan en un control médico.
//
// QUÉ HACE Y QUÉ NO
// Este módulo registra, mide y muestra patrones. **No calcula dosis de insulina
// y no las sugiere.** La insulina es un medicamento de alto riesgo: las razones
// de cada persona las fija su médico, cambian con el tiempo, y un error de
// cálculo puede causar una hipoglicemia grave. La app guarda el esquema que
// indicó el médico y muestra los carbohidratos del plato; la decisión queda en
// la persona y su equipo de salud.
//
// Los umbrales vienen del consenso internacional sobre tiempo en rango
// (ADA/ATTD 2019), que es lo que se usa hoy en consulta.

import { hoyISO, redondear, suma, agrupar, limitar, diasEntre } from './utiles.js';

/** mg/dL es la unidad de uso corriente en Chile; mmol/L se usa en otros países. */
export const UNIDADES = {
  'mg/dL': { nombre: 'mg/dL', factor: 1, decimales: 0 },
  'mmol/L': { nombre: 'mmol/L', factor: 1 / 18.0182, decimales: 1 },
};

export function convertir(valorMgDl, unidad) {
  const u = UNIDADES[unidad] || UNIDADES['mg/dL'];
  return redondear(valorMgDl * u.factor, u.decimales);
}

export const TIPOS = {
  tipo1: 'Diabetes tipo 1',
  tipo2: 'Diabetes tipo 2',
  gestacional: 'Diabetes gestacional',
  prediabetes: 'Prediabetes',
};

/* Rango objetivo por omisión. El embarazo tiene metas más estrictas, así que se
   declara aparte en vez de aplicar el mismo número a todos. */
export const RANGOS = {
  estandar: { min: 70, max: 180, nombre: 'Estándar (70-180 mg/dL)' },
  gestacional: { min: 63, max: 140, nombre: 'Embarazo (63-140 mg/dL)' },
};

/** Umbrales fijos de seguridad, no configurables: son los del consenso clínico. */
export const UMBRALES = {
  hipoGrave: 54,
  hipo: 70,
  hiperAlta: 250,
};

/** Momentos del día en que se suele medir. */
export const MOMENTOS = {
  ayunas: { nombre: 'En ayunas', orden: 1 },
  antes_desayuno: { nombre: 'Antes del desayuno', orden: 2 },
  despues_desayuno: { nombre: 'Después del desayuno', orden: 3 },
  antes_almuerzo: { nombre: 'Antes del almuerzo', orden: 4 },
  despues_almuerzo: { nombre: 'Después del almuerzo', orden: 5 },
  antes_once: { nombre: 'Antes de la once', orden: 6 },
  despues_once: { nombre: 'Después de la once', orden: 7 },
  antes_cena: { nombre: 'Antes de la cena', orden: 8 },
  despues_cena: { nombre: 'Después de la cena', orden: 9 },
  antes_dormir: { nombre: 'Antes de dormir', orden: 10 },
  madrugada: { nombre: 'Madrugada', orden: 11 },
  antes_ejercicio: { nombre: 'Antes de ejercitar', orden: 12 },
  despues_ejercicio: { nombre: 'Después de ejercitar', orden: 13 },
  sintomas: { nombre: 'Por síntomas', orden: 14 },
};

export const TIPOS_INSULINA = {
  basal: { nombre: 'Basal (lenta)', descripcion: 'La de fondo, que cubre todo el día.' },
  bolo: { nombre: 'Bolo de comida (rápida)', descripcion: 'La que acompaña una comida.' },
  correccion: { nombre: 'Corrección', descripcion: 'La que indicó el médico para bajar una glicemia alta.' },
};

/** Clasifica una glicemia según los umbrales de seguridad y el rango objetivo. */
export function clasificar(valor, rango = RANGOS.estandar) {
  if (valor < UMBRALES.hipoGrave) {
    return { clave: 'hipo_grave', texto: 'Hipoglicemia grave', tono: 'mal', urgente: true };
  }
  if (valor < UMBRALES.hipo) {
    return { clave: 'hipo', texto: 'Hipoglicemia', tono: 'mal', urgente: true };
  }
  if (valor < rango.min) {
    return { clave: 'bajo', texto: 'Bajo el rango', tono: 'aviso', urgente: false };
  }
  if (valor <= rango.max) {
    return { clave: 'en_rango', texto: 'En rango', tono: 'bien', urgente: false };
  }
  if (valor <= UMBRALES.hiperAlta) {
    return { clave: 'alto', texto: 'Sobre el rango', tono: 'aviso', urgente: false };
  }
  return { clave: 'muy_alto', texto: 'Muy alta', tono: 'mal', urgente: false };
}

/**
 * Indicadores del período. Son los mismos que aparecen en un informe de sensor
 * y los que el médico va a mirar.
 */
export function indicadores(registros, rango = RANGOS.estandar) {
  const valores = registros.map((r) => Number(r.valor)).filter((v) => isFinite(v) && v > 0);
  const n = valores.length;
  if (!n) {
    return { n: 0, suficiente: false, mensaje: 'Sin mediciones en el período.' };
  }

  const media = suma(valores) / n;
  const varianza = suma(valores, (v) => (v - media) ** 2) / n;
  const desviacion = Math.sqrt(varianza);
  const cuenta = (prueba) => valores.filter(prueba).length;
  const pct = (cantidad) => redondear((cantidad / n) * 100, 1);

  return {
    n,
    suficiente: n >= 14,   // con menos mediciones los porcentajes engañan
    media: redondear(media, 0),
    desviacion: redondear(desviacion, 0),
    // Coeficiente de variación: mide lo parejo que está. Bajo 36% se considera estable.
    cv: redondear((desviacion / media) * 100, 1),
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
    // Indicador de manejo de glucosa: estimación de HbA1c a partir del promedio
    // (Bergenstal 2018). Es una estimación, no reemplaza el examen de sangre.
    gmi: redondear(3.31 + 0.02392 * media, 1),
    tiempoEnRango: pct(cuenta((v) => v >= rango.min && v <= rango.max)),
    tiempoBajo: pct(cuenta((v) => v < rango.min)),
    tiempoHipo: pct(cuenta((v) => v < UMBRALES.hipo)),
    tiempoHipoGrave: pct(cuenta((v) => v < UMBRALES.hipoGrave)),
    tiempoAlto: pct(cuenta((v) => v > rango.max)),
    tiempoMuyAlto: pct(cuenta((v) => v > UMBRALES.hiperAlta)),
    hipoglicemias: cuenta((v) => v < UMBRALES.hipo),
    hipoglicemiasGraves: cuenta((v) => v < UMBRALES.hipoGrave),
  };
}

/** Metas del consenso internacional, para contrastar los indicadores. */
export const METAS = [
  { clave: 'tiempoEnRango', nombre: 'Tiempo en rango', objetivo: '> 70 %', prueba: (i) => i.tiempoEnRango > 70, direccion: 'mayor' },
  { clave: 'tiempoHipo', nombre: 'Tiempo bajo 70', objetivo: '< 4 %', prueba: (i) => i.tiempoHipo < 4, direccion: 'menor' },
  { clave: 'tiempoHipoGrave', nombre: 'Tiempo bajo 54', objetivo: '< 1 %', prueba: (i) => i.tiempoHipoGrave < 1, direccion: 'menor' },
  { clave: 'tiempoAlto', nombre: 'Tiempo sobre el rango', objetivo: '< 25 %', prueba: (i) => i.tiempoAlto < 25, direccion: 'menor' },
  { clave: 'tiempoMuyAlto', nombre: 'Tiempo sobre 250', objetivo: '< 5 %', prueba: (i) => i.tiempoMuyAlto < 5, direccion: 'menor' },
  { clave: 'cv', nombre: 'Variabilidad', objetivo: '≤ 36 %', prueba: (i) => i.cv <= 36, direccion: 'menor' },
];

export function evaluarMetas(ind) {
  if (!ind || !ind.n) return [];
  return METAS.map((m) => ({
    ...m,
    valor: ind[m.clave],
    cumple: m.prueba(ind),
  }));
}

/**
 * Promedio y sobresaltos por momento del día. Es el análisis que encuentra el
 * problema real: "siempre se va abajo de madrugada" o "siempre sube después de
 * almuerzo" son hallazgos que cambian un tratamiento.
 */
export function patronesPorMomento(registros, rango = RANGOS.estandar, minimoPorMomento = 3) {
  const grupos = agrupar(registros.filter((r) => r.momento), (r) => r.momento);
  const filas = [];

  for (const [momento, lista] of grupos) {
    const valores = lista.map((r) => Number(r.valor)).filter((v) => isFinite(v) && v > 0);
    if (valores.length < minimoPorMomento) continue;
    const media = suma(valores) / valores.length;
    const hipos = valores.filter((v) => v < UMBRALES.hipo).length;
    const altos = valores.filter((v) => v > rango.max).length;
    filas.push({
      momento,
      nombre: MOMENTOS[momento]?.nombre || momento,
      orden: MOMENTOS[momento]?.orden || 99,
      n: valores.length,
      media: redondear(media, 0),
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
      hipos,
      pctHipos: redondear((hipos / valores.length) * 100, 0),
      altos,
      pctAltos: redondear((altos / valores.length) * 100, 0),
      clasificacion: clasificar(media, rango),
    });
  }
  return filas.sort((a, b) => a.orden - b.orden);
}

/**
 * Hallazgos en palabras. Todos terminan en lo mismo: llevarlo al control, no
 * cambiarse el tratamiento por cuenta propia.
 */
export function hallazgos(registros, rango = RANGOS.estandar, perfil = {}) {
  const avisos = [];
  const ind = indicadores(registros, rango);
  if (!ind.n) {
    return [{ tono: 'info', texto: 'Aún no hay mediciones registradas. Con dos semanas de registros ya se pueden ver patrones.' }];
  }
  if (!ind.suficiente) {
    avisos.push({
      tono: 'info',
      texto: `Llevas ${ind.n} ${ind.n === 1 ? 'medición' : 'mediciones'}. Los porcentajes recién se vuelven confiables desde unas 14: hasta entonces, míralos como una referencia.`,
    });
  }

  if (ind.hipoglicemiasGraves > 0) {
    avisos.push({
      tono: 'mal',
      texto: `Hubo ${ind.hipoglicemiasGraves} ${ind.hipoglicemiasGraves === 1 ? 'medición' : 'mediciones'} bajo 54 mg/dL. Eso es hipoglicemia grave y hay que avisarlo en el control, no esperar a la próxima cita de rutina.`,
    });
  } else if (ind.tiempoHipo >= 4) {
    avisos.push({
      tono: 'mal',
      texto: `${ind.tiempoHipo}% de tus mediciones están bajo 70 mg/dL (la meta es menos de 4%). Las hipoglicemias repetidas son lo primero que hay que corregir con el médico.`,
    });
  }

  const patrones = patronesPorMomento(registros, rango);
  const conHipos = patrones.filter((p) => p.pctHipos >= 25 && p.n >= 3);
  for (const p of conHipos) {
    avisos.push({
      tono: 'mal',
      texto: `En "${p.nombre}" el ${p.pctHipos}% de las mediciones salió bajo 70 (${p.hipos} de ${p.n}). Un patrón así, a la misma hora, suele significar que ese tramo del esquema necesita ajuste: anótalo para el control.`,
    });
  }
  const altosPersistentes = patrones.filter((p) => p.pctAltos >= 60 && p.n >= 3);
  for (const p of altosPersistentes.slice(0, 2)) {
    avisos.push({
      tono: 'aviso',
      texto: `En "${p.nombre}" el ${p.pctAltos}% quedó sobre el rango, con un promedio de ${p.media} mg/dL. Vale la pena revisar qué se come antes y qué indica tu esquema para ese momento.`,
    });
  }

  if (ind.tiempoEnRango > 70) {
    avisos.push({ tono: 'bien', texto: `Tiempo en rango de ${ind.tiempoEnRango}%, sobre la meta de 70%. Eso es un buen control.` });
  } else if (ind.suficiente) {
    avisos.push({
      tono: 'aviso',
      texto: `Tiempo en rango de ${ind.tiempoEnRango}% (la meta es sobre 70%). Es el número que más conviene mostrarle al médico, más que el promedio.`,
    });
  }

  if (ind.suficiente && ind.cv > 36) {
    avisos.push({
      tono: 'aviso',
      texto: `Tu variabilidad es de ${ind.cv}% (la meta es 36% o menos). Mucha variabilidad significa subidas y bajadas bruscas, y eso cansa aunque el promedio se vea bien.`,
    });
  }

  if (perfil.tipo === 'tipo1' && ind.tiempoMuyAlto >= 5) {
    avisos.push({
      tono: 'aviso',
      texto: `${ind.tiempoMuyAlto}% de las mediciones pasó de 250 mg/dL. En diabetes tipo 1, glicemias altas sostenidas con malestar o vómitos requieren descartar cetoacidosis: eso es consulta de urgencia, no espera.`,
    });
  }

  return avisos;
}

/** Qué hacer ante una medición concreta. Educativo y estándar, nunca dosis. */
export function queHacer(valor, perfil = {}) {
  if (valor < UMBRALES.hipoGrave) {
    return {
      tono: 'mal', urgente: true, titulo: 'Hipoglicemia grave',
      texto: 'Toma azúcar de absorción rápida ahora (15 g: una cucharada de azúcar, medio vaso de bebida no light o 3 caramelos). Espera 15 minutos y vuelve a medir. Si no subes, repite. Si hay confusión, convulsión o pérdida de conciencia, es una urgencia: llama al 131.',
    };
  }
  if (valor < UMBRALES.hipo) {
    return {
      tono: 'mal', urgente: true, titulo: 'Hipoglicemia',
      texto: 'Regla 15/15: toma 15 g de azúcar rápida, espera 15 minutos y vuelve a medir. No esperes a sentirte peor, y no te inyectes insulina ahora.',
    };
  }
  if (valor > UMBRALES.hiperAlta) {
    return {
      tono: 'aviso', urgente: false, titulo: 'Glicemia muy alta',
      texto: perfil.tipo === 'tipo1'
        ? 'Hidrátate y sigue el esquema que te indicó tu médico. Si tienes náuseas, vómitos, dolor abdominal o respiración agitada, consulta de inmediato: pueden ser signos de cetoacidosis.'
        : 'Hidrátate y sigue el esquema indicado. Si se repite en días seguidos, llévalo al control.',
    };
  }
  return null;
}

/**
 * Cruza cada glicemia posterior a una comida con los carbohidratos de esa
 * comida. Sirve para ver qué comidas disparan la glicemia; no para calcular nada.
 */
export function efectoDeLasComidas(registros, comidasPorFecha, carbohidratosDe) {
  const DESPUES = ['despues_desayuno', 'despues_almuerzo', 'despues_once', 'despues_cena'];
  const puntos = [];
  for (const r of registros) {
    if (!DESPUES.includes(r.momento)) continue;
    const comidas = comidasPorFecha[r.fecha];
    if (!comidas || !comidas.length) continue;
    const carbos = carbohidratosDe(comidas, r.momento);
    if (!carbos) continue;
    puntos.push({ fecha: r.fecha, momento: r.momento, carbos: redondear(carbos, 0), valor: Number(r.valor) });
  }
  return puntos;
}

/** Total de insulina del día, separada por tipo. */
export function insulinaDelDia(dosis, fecha) {
  const delDia = dosis.filter((d) => d.fecha === fecha);
  const porTipo = {};
  for (const clave of Object.keys(TIPOS_INSULINA)) {
    porTipo[clave] = redondear(suma(delDia.filter((d) => d.tipo === clave), (d) => Number(d.unidades) || 0), 1);
  }
  return {
    fecha,
    total: redondear(suma(delDia, (d) => Number(d.unidades) || 0), 1),
    porTipo,
    registros: delDia.sort((a, b) => (a.hora || '').localeCompare(b.hora || '')),
  };
}

/** Serie diaria para el gráfico: promedio del día y cuántas mediciones lo respaldan. */
export function seriePorDia(registros, dias = 30, hoy = hoyISO()) {
  const porFecha = agrupar(registros, (r) => r.fecha);
  return [...porFecha.entries()]
    .filter(([fecha]) => diasEntre(fecha, hoy) < dias && diasEntre(fecha, hoy) >= 0)
    .map(([fecha, lista]) => {
      const valores = lista.map((r) => Number(r.valor)).filter((v) => isFinite(v));
      return {
        fecha,
        n: valores.length,
        media: redondear(suma(valores) / valores.length, 0),
        minimo: Math.min(...valores),
        maximo: Math.max(...valores),
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Filtra los registros de los últimos N días. */
export function ultimosDias(registros, dias, hoy = hoyISO()) {
  return registros.filter((r) => {
    const d = diasEntre(r.fecha, hoy);
    return d >= 0 && d < dias;
  });
}

export function perfilInicial() {
  return {
    activo: false,
    tipo: 'tipo2',
    usaInsulina: false,
    unidad: 'mg/dL',
    rango: { ...RANGOS.estandar },
    // El esquema lo escribe la persona copiando lo que le indicó su médico.
    // Es texto, no parámetros de cálculo: la app no opera con estos números.
    esquema: { basal: '', bolos: '', correccion: '', notas: '' },
    medico: '',
    proximoControl: '',
  };
}
