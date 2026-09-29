// Generador de menús de 7 días a partir de los objetivos del usuario.
// Es el contenido que se desbloquea con tokens: no son textos fijos, se calculan
// para las calorías y macros reales de cada persona.

import { ALIMENTOS, MAPA_ALIMENTOS, escalar } from '../datos/alimentos.js';
import { repartirComidas } from './nutricion.js';
import { aleatorioConSemilla, barajar, redondear, suma } from './utiles.js';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const PERFILES = {
  deficit: {
    nombre: 'Déficit sabroso',
    descripcion: 'Comidas de alto volumen y mucha fibra para que el déficit no se sienta como hambre.',
    proteinas: ['pollo_pechuga', 'merluza', 'atun_agua', 'clara_huevo', 'quesillo', 'yogur_natural', 'carne_molida', 'tofu', 'huevo'],
    carbos: ['papa_cocida', 'arroz_integral', 'quinoa', 'avena', 'pan_integral', 'lentejas', 'camote'],
    verduras: ['brocoli', 'lechuga', 'tomate', 'zapallo_italiano', 'espinaca', 'porotos_verdes', 'zanahoria'],
    grasas: ['palta', 'aceite_oliva', 'almendras'],
    frutas: ['manzana', 'frutilla', 'kiwi', 'naranja', 'arandano'],
  },
  volumen: {
    nombre: 'Ganancia limpia',
    descripcion: 'Superávit controlado con proteína alta: subir músculo sin acumular grasa de más.',
    proteinas: ['pollo_muslo', 'carne_posta', 'salmon', 'huevo', 'proteina_suero', 'leche_entera', 'cerdo_lomo', 'yogur_natural'],
    carbos: ['arroz_cocido', 'fideos', 'avena', 'papa_cocida', 'pan_marraqueta', 'quinoa', 'camote', 'tortilla_maiz'],
    verduras: ['brocoli', 'zanahoria', 'tomate', 'espinaca', 'choclo'],
    grasas: ['aceite_oliva', 'palta', 'nueces', 'mani', 'almendras'],
    frutas: ['platano', 'uva', 'manzana', 'naranja'],
  },
  economico: {
    nombre: 'Proteína barata',
    descripcion: 'Prioriza huevo, legumbres, jurel y pollo: el mejor costo por gramo de proteína.',
    proteinas: ['huevo', 'lentejas', 'porotos', 'garbanzos', 'jurel_lata', 'pollo_muslo', 'quesillo', 'leche_desc'],
    carbos: ['arroz_cocido', 'fideos', 'papa_cocida', 'avena', 'pan_marraqueta', 'tortilla_maiz'],
    verduras: ['zanahoria', 'zapallo_italiano', 'tomate', 'lechuga', 'porotos_verdes', 'betarraga'],
    grasas: ['aceite_oliva', 'mani'],
    frutas: ['platano', 'manzana', 'naranja'],
  },
};

export const TIPOS_MENU = Object.entries(PERFILES).map(([id, p]) => ({ id, nombre: p.nombre, descripcion: p.descripcion }));

/** Ajusta los gramos de un alimento para aportar aproximadamente los gramos objetivo de un macro. */
function gramosPara(alimento, macro, objetivoGramos, minimo = 30, maximo = 400) {
  const por100 = alimento[macro];
  if (!por100) return minimo;
  const gramos = (objetivoGramos / por100) * 100;
  return Math.round(Math.min(maximo, Math.max(minimo, gramos)) / 5) * 5;
}

function armarComida(nombreComida, objetivo, perfil, rnd) {
  const elegir = (lista) => MAPA_ALIMENTOS.get(barajar(lista, rnd)[0]);
  const items = [];

  const proteina = elegir(perfil.proteinas);
  items.push({ alimentoId: proteina.id, gramos: gramosPara(proteina, 'prot', objetivo.prot * 0.75, 40, 300) });

  const esDesayuno = /desayuno/i.test(nombreComida);
  const esColacion = /colaci/i.test(nombreComida);

  if (!esColacion) {
    const carbo = elegir(perfil.carbos);
    items.push({ alimentoId: carbo.id, gramos: gramosPara(carbo, 'carb', objetivo.carb * 0.7, 30, 350) });
    const verdura = elegir(perfil.verduras);
    if (!esDesayuno) items.push({ alimentoId: verdura.id, gramos: 150 });
  }
  if (esDesayuno || esColacion) {
    const fruta = elegir(perfil.frutas);
    items.push({ alimentoId: fruta.id, gramos: fruta.porcion });
  }

  // Cierra las grasas si quedaron bajas.
  const parcial = totalizar(items);
  if (parcial.grasa < objetivo.grasa * 0.6) {
    const grasa = elegir(perfil.grasas);
    items.push({ alimentoId: grasa.id, gramos: gramosPara(grasa, 'grasa', objetivo.grasa * 0.5, 8, 60) });
  }

  return { nombre: nombreComida, items, total: totalizar(items) };
}

function totalizar(items) {
  const total = { kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0 };
  for (const item of items) {
    const alimento = MAPA_ALIMENTOS.get(item.alimentoId);
    if (!alimento) continue;
    const n = escalar(alimento, item.gramos);
    for (const k of Object.keys(total)) total[k] += n[k] || 0;
  }
  for (const k of Object.keys(total)) total[k] = redondear(total[k], 1);
  return total;
}

/**
 * Genera el menú de 7 días.
 * @param {object} objetivos resultado de calcularObjetivos()
 * @param {string} tipo 'deficit' | 'volumen' | 'economico'
 * @param {number} comidasPorDia
 */
export function generarMenuSemanal(objetivos, tipo, comidasPorDia = 4, semilla = 'menu') {
  const perfil = PERFILES[tipo] || PERFILES.deficit;
  const reparto = repartirComidas(objetivos, comidasPorDia);
  const rnd = aleatorioConSemilla(`${semilla}|${tipo}|${objetivos.kcal}`);

  const dias = DIAS.map((dia) => {
    const comidas = reparto.map((c) => armarComida(c.nombre, c, perfil, rnd));
    const total = {
      kcal: Math.round(suma(comidas, (c) => c.total.kcal)),
      prot: Math.round(suma(comidas, (c) => c.total.prot)),
      carb: Math.round(suma(comidas, (c) => c.total.carb)),
      grasa: Math.round(suma(comidas, (c) => c.total.grasa)),
      fibra: Math.round(suma(comidas, (c) => c.total.fibra)),
    };
    return { dia, comidas, total };
  });

  return {
    tipo,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    objetivos,
    dias,
    compras: listaDeCompras(dias),
  };
}

/** Suma los gramos de cada alimento en los 7 días. */
export function listaDeCompras(dias) {
  const mapa = new Map();
  for (const d of dias) {
    for (const c of d.comidas) {
      for (const item of c.items) {
        mapa.set(item.alimentoId, (mapa.get(item.alimentoId) || 0) + item.gramos);
      }
    }
  }
  return [...mapa.entries()]
    .map(([alimentoId, gramos]) => {
      const a = MAPA_ALIMENTOS.get(alimentoId);
      return {
        alimentoId,
        nombre: a?.nombre || alimentoId,
        categoria: a?.cat || 'Otros',
        gramos: Math.round(gramos),
        kilos: redondear(gramos / 1000, 2),
      };
    })
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || b.gramos - a.gramos);
}

/** Recetas de alta proteína, construidas con la misma base de alimentos. */
export const RECETAS = [
  { nombre: 'Pollo al sartén con quinoa y brócoli', items: [['pollo_pechuga', 180], ['quinoa', 180], ['brocoli', 150], ['aceite_oliva', 8]], pasos: 'Sella el pollo 4 min por lado con sal y pimienta. Cocina la quinoa en el doble de agua 15 min. Saltea el brócoli 3 min con el aceite.' },
  { nombre: 'Tortilla de claras con quesillo y tomate', items: [['clara_huevo', 200], ['huevo', 55], ['quesillo', 80], ['tomate', 130]], pasos: 'Bate las claras con el huevo, vierte en sartén caliente, agrega el quesillo en cubos y el tomate. Dobla a los 3 min.' },
  { nombre: 'Merluza al horno con papas y ensalada', items: [['merluza', 200], ['papa_cocida', 250], ['lechuga', 80], ['aceite_oliva', 8]], pasos: 'Horno 200 °C, 18 min con limón y ajo. Papas cocidas aplastadas y ensalada aliñada aparte.' },
  { nombre: 'Lentejas con arroz y huevo', items: [['lentejas', 250], ['arroz_cocido', 150], ['huevo', 55]], pasos: 'Guiso de lentejas con zanahoria y cebolla. Sirve con arroz y un huevo frito encima. Proteína completa y barata.' },
  { nombre: 'Bowl de yogur, avena y frutillas', items: [['yogur_natural', 250], ['avena', 40], ['frutilla', 150], ['almendras', 20]], pasos: 'Mezcla el yogur con la avena la noche anterior. Agrega frutillas y almendras al servir.' },
  { nombre: 'Salteado de carne molida con verduras', items: [['carne_molida', 180], ['zapallo_italiano', 150], ['tomate', 130], ['arroz_integral', 180]], pasos: 'Dora la carne, agrega las verduras en cubos, cocina 6 min y sirve con el arroz integral.' },
  { nombre: 'Jurel a la parrilla con camote', items: [['jurel_lata', 125], ['camote', 250], ['espinaca', 100]], pasos: 'Escurre el jurel y caliéntalo con ajo. Camote al horno 25 min. Espinaca salteada 2 min.' },
  { nombre: 'Batido post entreno', items: [['proteina_suero', 30], ['platano', 120], ['leche_desc', 300], ['avena', 30]], pasos: 'Licúa todo con hielo. Tómalo dentro de la hora siguiente al entrenamiento.' },
  { nombre: 'Tofu salteado con fideos y verduras', items: [['tofu', 200], ['fideos', 180], ['brocoli', 150], ['aceite_oliva', 8]], pasos: 'Dora el tofu en cubos hasta que quede firme. Saltea con el brócoli y mezcla con los fideos.' },
  { nombre: 'Ensalada de garbanzos y atún', items: [['garbanzos', 200], ['atun_agua', 120], ['tomate', 130], ['palta', 50]], pasos: 'Mezcla todo frío con limón, sal y orégano. Rinde para dos almuerzos.' },
];

export function recetasConMacros() {
  return RECETAS.map((r) => {
    const items = r.items.map(([alimentoId, gramos]) => ({ alimentoId, gramos }));
    return { ...r, items, total: totalizar(items) };
  }).sort((a, b) => b.total.prot - a.total.prot);
}
