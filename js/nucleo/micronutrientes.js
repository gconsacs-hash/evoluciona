// Cálculo del panel de micronutrientes (artículo func:micros de la tienda).
//
// La regla que ordena todo este módulo: un alimento sin dato no aporta cero,
// no tiene dato. Si lo tratáramos como cero, el panel diría "te falta hierro"
// cuando en realidad lo que falta es información, y eso empuja a suplementarse
// sin motivo. Por eso cada nutriente viaja con su porcentaje de cobertura.

import { MICROS_POR_100G, REFERENCIA, CLAVES } from '../datos/micronutrientes.js';
import { MAPA_ALIMENTOS } from '../datos/alimentos.js';
import { redondear, limitar } from './utiles.js';

/** Objetivos diarios según el perfil. */
export function objetivosMicros(perfil) {
  const sexo = perfil?.sexo === 'femenino' ? 'femenino' : 'masculino';
  const salida = {};
  for (const clave of CLAVES) {
    salida[clave] = { ...REFERENCIA[clave], meta: REFERENCIA[clave][sexo] };
  }
  return salida;
}

/**
 * Suma los micronutrientes de una lista de registros {alimentoId, gramos}.
 * Devuelve además cuántos gramos y cuántas calorías quedaron sin dato.
 */
export function totalizarMicros(registros) {
  const total = {};
  for (const clave of CLAVES) total[clave] = 0;

  let gramosConDato = 0, gramosSinDato = 0;
  const sinDato = new Map();

  for (const r of registros) {
    const alimento = MAPA_ALIMENTOS.get(r.alimentoId);
    if (!alimento) continue;
    const micro = MICROS_POR_100G[r.alimentoId];
    if (!micro) {
      gramosSinDato += r.gramos;
      sinDato.set(r.alimentoId, (sinDato.get(r.alimentoId) || 0) + r.gramos);
      continue;
    }
    gramosConDato += r.gramos;
    const f = r.gramos / 100;
    for (const clave of CLAVES) total[clave] += (micro[clave] || 0) * f;
  }

  for (const clave of CLAVES) total[clave] = redondear(total[clave], 1);
  const gramosTotales = gramosConDato + gramosSinDato;

  return {
    total,
    gramosConDato: Math.round(gramosConDato),
    gramosSinDato: Math.round(gramosSinDato),
    cobertura: gramosTotales ? redondear((gramosConDato / gramosTotales) * 100, 0) : 100,
    alimentosSinDato: [...sinDato.entries()]
      .map(([id, gramos]) => ({ id, nombre: MAPA_ALIMENTOS.get(id)?.nombre || id, gramos: Math.round(gramos) }))
      .sort((a, b) => b.gramos - a.gramos),
  };
}

/** Estado de cada micronutriente frente a su referencia. */
export function evaluarMicros(registros, perfil) {
  const objetivos = objetivosMicros(perfil);
  const suma = totalizarMicros(registros);

  const filas = CLAVES.map((clave) => {
    const meta = objetivos[clave].meta;
    const consumido = suma.total[clave];
    const pct = meta ? redondear((consumido / meta) * 100, 0) : 0;
    let estado = 'bajo';
    if (pct >= 100) estado = 'optimo';
    else if (pct >= 70) estado = 'cerca';
    return {
      clave,
      nombre: objetivos[clave].nombre,
      unidad: objetivos[clave].unidad,
      consumido,
      meta,
      pct: limitar(pct, 0, 999),
      estado,
      falta: redondear(Math.max(0, meta - consumido), 1),
      porQue: objetivos[clave].porQue,
      fuentes: objetivos[clave].fuentes,
    };
  });

  return { filas, ...suma };
}

/**
 * Lee el panel en palabras. Solo señala un déficit cuando la cobertura de datos
 * es alta: con la mitad del plato sin información, cualquier conclusión sobra.
 */
export function leerMicros(evaluacion, diasRegistrados = 1) {
  const mensajes = [];
  const fiable = evaluacion.cobertura >= 70;

  if (!fiable) {
    mensajes.push({
      tono: 'info',
      texto: `Solo el ${evaluacion.cobertura}% de lo que registraste tiene datos de micronutrientes` +
        (evaluacion.alimentosSinDato.length
          ? ` (faltan, entre otros, ${evaluacion.alimentosSinDato.slice(0, 3).map((a) => a.nombre).join(', ')})`
          : '') +
        '. Con esa cobertura no vale la pena sacar conclusiones todavía.',
    });
    return mensajes;
  }

  const bajos = evaluacion.filas.filter((f) => f.estado === 'bajo');
  const cubiertos = evaluacion.filas.filter((f) => f.estado === 'optimo');

  if (!bajos.length) {
    mensajes.push({ tono: 'bien', texto: 'Los cuatro micronutrientes del panel quedaron cubiertos hoy.' });
  } else {
    for (const f of bajos.slice(0, 3)) {
      // Los miligramos se muestran enteros, igual que en la barra de arriba:
      // un decimal en 219,5 mg de calcio no aporta nada y descuadra la lectura.
      const cifra = f.unidad === 'mg' ? Math.round(f.consumido) : f.consumido;
      mensajes.push({
        tono: f.pct < 40 ? 'mal' : 'aviso',
        texto: `${f.nombre}: ${cifra} de ${f.meta} ${f.unidad} (${f.pct}%). ${f.porQue} ${f.fuentes}`,
      });
    }
  }
  if (cubiertos.length && bajos.length) {
    mensajes.push({
      tono: 'bien',
      texto: `Sí quedaron cubiertos: ${cubiertos.map((f) => f.nombre).join(', ')}.`,
    });
  }
  if (diasRegistrados < 3) {
    mensajes.push({
      tono: 'info',
      texto: 'Un solo día dice poco: los micronutrientes se miran por semana. Un día bajo en hierro no es un problema; tres semanas sí.',
    });
  }
  return mensajes;
}

/** Qué alimentos del catálogo cierran mejor el micronutriente que falta. */
export function sugerirParaMicro(clave, cantidad = 5) {
  const objetivo = REFERENCIA[clave];
  if (!objetivo) return [];
  return Object.entries(MICROS_POR_100G)
    .map(([id, micro]) => {
      const alimento = MAPA_ALIMENTOS.get(id);
      if (!alimento) return null;
      const porPorcion = ((micro[clave] || 0) * alimento.porcion) / 100;
      return {
        id, nombre: alimento.nombre, gramos: alimento.porcion, medida: alimento.medida,
        aporte: redondear(porPorcion, 1),
        unidad: objetivo.unidad,
        kcal: Math.round((alimento.kcal * alimento.porcion) / 100),
      };
    })
    .filter((x) => x && x.aporte > 0)
    .sort((a, b) => b.aporte - a.aporte)
    .slice(0, cantidad);
}
