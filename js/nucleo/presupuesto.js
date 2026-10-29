// Comer bien con poco presupuesto: cuánto cuesta un día de comida y qué le
// aporta a un entrenamiento.
//
// Los precios son referenciales (ver datos/precios.js) y cada persona puede
// reemplazarlos por los suyos. Lo que no tiene precio no se cuenta como gratis:
// se informa aparte, igual que los micronutrientes sin dato.

import { PRECIOS_REFERENCIA } from '../datos/precios.js';
import { MAPA_ALIMENTOS, escalar } from '../datos/alimentos.js';
import { totalizarRegistros } from './nutricion.js';
import { totalizarMicros } from './micronutrientes.js';
import { redondear } from './utiles.js';

/**
 * Pesos por gramo del alimento tal como está en la base, o null si no hay precio.
 * preciosUsuario: { alimentoId: precio por kg } — reemplaza la referencia.
 * Un producto escaneado con precio de envase también cuenta.
 */
export function costoPorGramo(alimentoId, preciosUsuario = {}) {
  const ref = PRECIOS_REFERENCIA[alimentoId];
  const propio = Number(preciosUsuario[alimentoId]);
  if (propio > 0) return propio / 1000 / (ref?.rinde || 1);
  if (ref) return ref.kg / 1000 / ref.rinde;
  const a = MAPA_ALIMENTOS.get(alimentoId);
  if (a?.precioEnvase > 0 && a?.gramosEnvase > 0) return a.precioEnvase / a.gramosEnvase;
  return null;
}

/** Costo total de una lista de items {alimentoId, gramos}. */
export function costoDeItems(items, preciosUsuario = {}) {
  let total = 0;
  const sinPrecio = [];
  const detalle = items.map((i) => {
    const porGramo = costoPorGramo(i.alimentoId, preciosUsuario);
    if (porGramo === null) { sinPrecio.push(i.alimentoId); return { ...i, costo: null }; }
    const costo = porGramo * i.gramos;
    total += costo;
    return { ...i, costo: Math.round(costo) };
  });
  return { total: Math.round(total), detalle, sinPrecio };
}

/**
 * Días de comida baratos, armados con lo que hay en cualquier almacén.
 * Están escritos para unas 2.300 kcal y se escalan a las calorías de cada uno.
 * fijo: true = no se escala (verduras, agua: no dependen del tamaño de la persona).
 */
export const DIETAS_ECONOMICAS = [
  {
    id: 'basica',
    nombre: 'La básica para entrenar',
    descripcion: 'Avena con leche, huevos duros, legumbres con arroz y ensaladas. Lo más simple y barato que alcanza para entrenar de verdad.',
    items: [
      ['Desayuno', 'avena', 80], ['Desayuno', 'leche_entera', 300], ['Desayuno', 'platano', 120],
      ['Almuerzo', 'lentejas', 300], ['Almuerzo', 'arroz_cocido', 150],
      ['Almuerzo', 'lechuga', 80, true], ['Almuerzo', 'tomate', 130, true], ['Almuerzo', 'zanahoria', 100, true], ['Almuerzo', 'aceite_vegetal', 10],
      ['Colación', 'huevo', 110], ['Colación', 'pan_marraqueta', 50],
      ['Cena', 'huevo', 110], ['Cena', 'papa_cocida', 250], ['Cena', 'repollo', 100, true], ['Cena', 'aceite_vegetal', 5],
      ['Durante el día', 'agua', 2000, true],
    ],
  },
  {
    id: 'proteica',
    nombre: 'Económica alta en proteína',
    descripcion: 'Para quien busca ganar músculo con poca plata: jurel, pollo con hueso, huevo, leche y porotos. Proteína sobre 1,8 g por kilo.',
    items: [
      ['Desayuno', 'avena', 60], ['Desayuno', 'leche_entera', 400], ['Desayuno', 'huevo', 110],
      ['Almuerzo', 'pollo_muslo', 150], ['Almuerzo', 'arroz_cocido', 200], ['Almuerzo', 'ensalada_chilena', 200, true], ['Almuerzo', 'aceite_vegetal', 5],
      ['Colación', 'jurel_lata', 125], ['Colación', 'pan_marraqueta', 100], ['Colación', 'tomate', 130, true],
      ['Cena', 'porotos', 250], ['Cena', 'huevo', 55], ['Cena', 'zapallo_italiano', 150, true],
      ['Antes de dormir', 'leche_entera', 200], ['Antes de dormir', 'mani', 30],
      ['Durante el día', 'agua', 2000, true],
    ],
  },
  {
    id: 'vegetariana',
    nombre: 'Vegetariana económica',
    descripcion: 'Sin carne ni pescado. La proteína sale de legumbres, soya texturizada, huevo y lácteos, combinados con cereal para que sea completa.',
    items: [
      ['Desayuno', 'avena', 70], ['Desayuno', 'leche_entera', 300], ['Desayuno', 'manzana', 180],
      ['Almuerzo', 'garbanzos', 250], ['Almuerzo', 'arroz_cocido', 150], ['Almuerzo', 'lechuga', 80, true], ['Almuerzo', 'tomate', 130, true], ['Almuerzo', 'aceite_vegetal', 10],
      ['Colación', 'yogur_natural', 200], ['Colación', 'mani', 30],
      ['Cena', 'soya_texturizada', 50], ['Cena', 'fideos', 200], ['Cena', 'zanahoria', 100, true], ['Cena', 'cebolla', 80, true],
      ['Cena', 'huevo', 55],
      ['Durante el día', 'agua', 2000, true],
    ],
  },
  {
    id: 'minima',
    nombre: 'Presupuesto mínimo absoluto',
    descripcion: 'Lo más barato que todavía cubre la proteína de alguien que entrena: porotos, lentejas, huevo, avena, leche y repollo. Repetitiva, pero cumple.',
    items: [
      ['Desayuno', 'avena', 90], ['Desayuno', 'leche_entera', 250],
      ['Almuerzo', 'porotos', 300], ['Almuerzo', 'fideos', 150], ['Almuerzo', 'repollo', 120, true], ['Almuerzo', 'aceite_vegetal', 10],
      ['Colación', 'huevo', 110], ['Colación', 'pan_marraqueta', 100],
      ['Cena', 'lentejas', 300], ['Cena', 'papa_cocida', 200], ['Cena', 'zanahoria', 100, true],
      ['Durante el día', 'agua', 2000, true],
    ],
  },
];

const PESO_HUEVO = 55;

/**
 * Ajusta una dieta a las calorías de la persona escalando solo lo que no es
 * fijo. Los huevos se redondean a unidades enteras.
 */
export function escalarDieta(dieta, kcalObjetivo) {
  const kcalDe = (lista) => totalizarRegistros(lista.map(([, alimentoId, gramos]) => ({ alimentoId, gramos }))).kcal;
  const fijas = kcalDe(dieta.items.filter((i) => i[3]));
  const escalables = kcalDe(dieta.items.filter((i) => !i[3]));
  const bruto = kcalObjetivo && escalables ? (kcalObjetivo - fijas) / escalables : 1;
  const factor = Math.min(1.8, Math.max(0.6, bruto));
  const items = dieta.items.map(([momento, alimentoId, gramos, fijo]) => {
    let g = fijo ? gramos : gramos * factor;
    g = alimentoId === 'huevo' ? Math.max(1, Math.round(g / PESO_HUEVO)) * PESO_HUEVO : Math.round(g / 5) * 5;
    return { momento, alimentoId, gramos: g };
  });
  return { ...dieta, factor: redondear(factor, 2), items };
}

/**
 * Qué le aporta un día de comida a alguien que entrena. Usa rangos de uso
 * corriente en nutrición deportiva para fuerza y resistencia moderada:
 * proteína 1,6 a 2,2 g/kg y carbohidrato 3 a 5 g/kg.
 */
export function aporteAlEntrenamiento(items, perfil, objetivos) {
  const total = totalizarRegistros(items);
  const kg = perfil.pesoKg || 70;
  const protKg = redondear(total.prot / kg, 1);
  const carbKg = redondear(total.carb / kg, 1);
  const lineas = [];

  lineas.push(protKg >= 1.6
    ? { tono: 'bien', texto: `Proteína: ${Math.round(total.prot)} g, ${protKg} g por kilo. Alcanza para recuperar y construir músculo (el rango útil es 1,6 a 2,2 g/kg).` }
    : { tono: 'aviso', texto: `Proteína: ${Math.round(total.prot)} g, ${protKg} g por kilo. Queda bajo 1,6 g/kg: sirve para mantenerse, pero para ganar músculo suma un huevo o un vaso de leche más.` });

  lineas.push(carbKg >= 3
    ? { tono: 'bien', texto: `Carbohidratos: ${Math.round(total.carb)} g, ${carbKg} g por kilo. Es combustible suficiente para una sesión de fuerza o una hora de trote (se recomiendan 3 a 5 g/kg).` }
    : { tono: 'aviso', texto: `Carbohidratos: ${Math.round(total.carb)} g, ${carbKg} g por kilo. Bajo 3 g/kg las series duras se sienten pesadas: come la avena o el pan 1 a 2 horas antes de entrenar.` });

  // Cuántas comidas superan ~20 g de proteína: cada una es un estímulo de reparación.
  const porMomento = new Map();
  for (const i of items) porMomento.set(i.momento, [...(porMomento.get(i.momento) || []), i]);
  const comidasProteicas = [...porMomento.values()].filter((lista) => totalizarRegistros(lista).prot >= 20).length;
  lineas.push({
    tono: comidasProteicas >= 3 ? 'bien' : 'aviso',
    texto: `${comidasProteicas} comidas con 20 g de proteína o más. Repartirla en 3 o 4 tomas rinde más para el músculo que comerla toda junta.`,
  });

  const kcalPct = objetivos?.kcal ? Math.round((total.kcal / objetivos.kcal) * 100) : null;
  if (kcalPct !== null) {
    lineas.push({
      tono: kcalPct >= 90 && kcalPct <= 110 ? 'bien' : 'aviso',
      texto: `Energía: ${Math.round(total.kcal)} kcal, ${kcalPct}% de tu meta diaria.`,
    });
  }

  const micros = totalizarMicros(items);
  const mujer = perfil.sexo === 'femenino';
  const hierroMeta = mujer ? 18 : 8;
  if (micros.total.hierro < hierroMeta) {
    lineas.push({ tono: 'aviso', texto: `Hierro: ${micros.total.hierro} de ${hierroMeta} mg. Junta las legumbres con algo ácido (tomate, limón, naranja): la vitamina C multiplica lo que se absorbe.` });
  }
  if (micros.total.calcio < 1000) {
    lineas.push({ tono: 'aviso', texto: `Calcio: ${Math.round(micros.total.calcio)} de 1.000 mg. Un vaso más de leche o un yogur lo cierra.` });
  }
  if (micros.total.vitaminaC < (mujer ? 75 : 90)) {
    lineas.push({ tono: 'aviso', texto: `Vitamina C: ${Math.round(micros.total.vitaminaC)} mg. Una naranja o medio pimentón crudo la completan por poca plata.` });
  }

  const agua = total.agua;
  lineas.push({
    tono: agua >= kg * 35 ? 'bien' : 'aviso',
    texto: `Agua: ${Math.round(agua)} ml de bebidas${agua >= kg * 35 ? '' : `; para tu peso conviene llegar a ${Math.round(kg * 35)} ml, más medio litro el día que entrenas`}.`,
  });

  return { total, protKg, carbKg, comidasProteicas, lineas };
}

/** Todo lo que la vista necesita para una dieta: items escalados, costo y aporte. */
export function analizarDieta(dieta, { perfil, objetivos, precios = {} }) {
  const escalada = escalarDieta(dieta, objetivos?.kcal);
  const costo = costoDeItems(escalada.items, precios);
  const aporte = aporteAlEntrenamiento(escalada.items, perfil, objetivos);
  return {
    ...escalada,
    costo,
    aporte,
    costoMensual: costo.total * 30,
    costoPor30gProt: aporte.total.prot ? Math.round((costo.total / aporte.total.prot) * 30) : null,
  };
}

/**
 * Las fuentes de proteína más baratas: cuánto cuesta juntar 30 g de proteína
 * con cada alimento que tiene precio.
 */
export function proteinaMasBarata(precios = {}, cantidad = 10) {
  const ids = new Set([...Object.keys({ ...precios }), ...Object.keys(PRECIOS_REFERENCIA)]);
  for (const a of MAPA_ALIMENTOS.values()) if (a.precioEnvase > 0) ids.add(a.id);
  return [...ids]
    .map((id) => {
      const a = MAPA_ALIMENTOS.get(id);
      const porGramo = costoPorGramo(id, precios);
      // Fuente de proteína de verdad: al menos 4 g por cada 100 kcal.
      if (!a || porGramo === null || !a.kcal || (a.prot / a.kcal) * 100 < 4 || a.cat === 'Snack') return null;
      const gramos = (30 / a.prot) * 100;
      const n = escalar(a, gramos);
      return {
        id, nombre: a.nombre, gramos: Math.round(gramos),
        costo: Math.round(porGramo * gramos),
        kcal: Math.round(n.kcal),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.costo - b.costo)
    .slice(0, cantidad);
}

/** Lista de alimentos con precio editable: referencia y precio propio. */
export function tablaPrecios(precios = {}) {
  return Object.entries(PRECIOS_REFERENCIA)
    .map(([id, ref]) => ({
      id,
      nombre: MAPA_ALIMENTOS.get(id)?.nombre || id,
      cat: MAPA_ALIMENTOS.get(id)?.cat || '',
      referencia: ref.kg,
      propio: Number(precios[id]) || null,
      compra: ref.compra,
    }))
    .filter((p) => p.id !== 'agua')
    .sort((a, b) => a.cat.localeCompare(b.cat) || a.nombre.localeCompare(b.nombre));
}
