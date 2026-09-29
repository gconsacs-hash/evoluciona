import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  codigoValido, normalizarCodigo, porcionDesdeTexto, desdeOpenFoodFacts,
  buscarProducto, productoManual, soportaEscaneo,
} from '../js/nucleo/productos.js';
import { evaluarMicros, totalizarMicros, objetivosMicros, leerMicros, sugerirParaMicro } from '../js/nucleo/micronutrientes.js';
import { PLATOS, MAPA_PLATOS } from '../js/datos/platos.js';
import { buscarAlimentos, MAPA_ALIMENTOS, registrarProducto, olvidarProducto, escalar } from '../js/datos/alimentos.js';

// --- Códigos de barras ---

test('acepta códigos EAN-13 con dígito verificador correcto', () => {
  assert.ok(codigoValido('7801234567894'), 'EAN-13 chileno de ejemplo');
  assert.ok(codigoValido('4006381333931'), 'EAN-13 de ejemplo conocido');
  assert.ok(codigoValido('96385074'), 'EAN-8 de ejemplo conocido');
  assert.ok(codigoValido('036000291452'), 'UPC-A de ejemplo conocido');
});

test('rechaza códigos con el verificador cambiado', () => {
  assert.equal(codigoValido('4006381333932'), false);
  assert.equal(codigoValido('96385075'), false);
});

test('rechaza largos que no existen', () => {
  assert.equal(codigoValido('123'), false);
  assert.equal(codigoValido('1234567890123456'), false);
  assert.equal(codigoValido(''), false);
  assert.equal(codigoValido(null), false);
});

test('normalizar deja solo los dígitos', () => {
  assert.equal(normalizarCodigo(' 780-123 456.7894 '), '7801234567894');
});

// --- Porciones ---

test('interpreta la porción declarada en el envase', () => {
  assert.equal(porcionDesdeTexto('30 g'), 30);
  assert.equal(porcionDesdeTexto('250ml'), 250);
  assert.equal(porcionDesdeTexto('1,5 L'), 1500);
  assert.equal(porcionDesdeTexto('2 kg'), 2000);
  assert.equal(porcionDesdeTexto('sin datos'), 100);
  assert.equal(porcionDesdeTexto(''), 100);
  assert.equal(porcionDesdeTexto(undefined, 55), 55);
});

// --- Conversión desde Open Food Facts ---

const respuestaOFF = {
  status: 1,
  product: {
    code: '7801234567894',
    product_name: 'Yogur natural',
    brands: 'Marca X, Otra',
    quantity: '155 g',
    serving_size: '155 g',
    nutriments: {
      'energy-kcal_100g': 60, proteins_100g: 3.5, carbohydrates_100g: 7,
      fat_100g: 1.5, sugars_100g: 6, sodium_100g: 0.05, fiber_100g: 0,
    },
  },
};

test('convierte un producto de Open Food Facts al formato de la app', () => {
  const r = desdeOpenFoodFacts(respuestaOFF);
  assert.equal(r.ok, true);
  assert.equal(r.producto.id, 'cb_7801234567894');
  assert.equal(r.producto.kcal, 60);
  assert.equal(r.producto.prot, 3.5);
  assert.equal(r.producto.porcion, 155);
  assert.equal(r.producto.escaneado, true);
});

test('el sodio se pasa de gramos a miligramos', () => {
  assert.equal(desdeOpenFoodFacts(respuestaOFF).producto.sodio, 50);
});

test('la sal se convierte a sodio cuando no viene el sodio', () => {
  const conSal = JSON.parse(JSON.stringify(respuestaOFF));
  delete conSal.product.nutriments.sodium_100g;
  conSal.product.nutriments.salt_100g = 1;
  assert.equal(desdeOpenFoodFacts(conSal).producto.sodio, 400);
});

test('la energía en kJ se convierte a kcal', () => {
  const enKj = JSON.parse(JSON.stringify(respuestaOFF));
  delete enKj.product.nutriments['energy-kcal_100g'];
  enKj.product.nutriments.energy_100g = 418.4;
  assert.equal(desdeOpenFoodFacts(enKj).producto.kcal, 100);
});

test('se agrega la marca al nombre si no la trae', () => {
  assert.match(desdeOpenFoodFacts(respuestaOFF).producto.nombre, /Marca X/);
});

test('un producto sin tabla nutricional se rechaza en vez de inventarla', () => {
  const vacio = { status: 1, product: { code: '1', product_name: 'Algo', nutriments: {} } };
  const r = desdeOpenFoodFacts(vacio);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'datos_incompletos');
});

test('un código inexistente devuelve no encontrado', () => {
  assert.equal(desdeOpenFoodFacts({ status: 0 }).motivo, 'no_encontrado');
  assert.equal(desdeOpenFoodFacts(null).motivo, 'no_encontrado');
});

// --- Búsqueda con caché ---

test('un producto ya guardado no consulta internet', async () => {
  let consultas = 0;
  const guardados = { '7801234567894': { id: 'cb_7801234567894', nombre: 'Guardado' } };
  const r = await buscarProducto('7801234567894', {
    guardados,
    traer: () => { consultas++; throw new Error('no debería consultar'); },
  });
  assert.equal(r.ok, true);
  assert.equal(r.origen, 'guardado');
  assert.equal(consultas, 0);
});

test('un código nuevo se consulta y se devuelve convertido', async () => {
  const r = await buscarProducto('7801234567894', {
    guardados: {},
    traer: async () => ({ ok: true, status: 200, json: async () => respuestaOFF }),
  });
  assert.equal(r.ok, true);
  assert.equal(r.origen, 'internet');
  assert.equal(r.producto.nombre.includes('Yogur'), true);
});

test('un código mal leído no sale a internet', async () => {
  let consultas = 0;
  const r = await buscarProducto('4006381333932', { traer: () => { consultas++; } });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'invalido');
  assert.equal(consultas, 0);
  assert.match(r.mensaje, /vuelve a escanear/);
});

test('sin internet se propone cargarlo a mano', async () => {
  const r = await buscarProducto('7801234567894', {
    guardados: {},
    traer: async () => { throw new Error('offline'); },
  });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'sin_red');
  assert.match(r.mensaje, /a mano/);
});

test('un 404 se lee como "no está en la base", no como caída', async () => {
  const r = await buscarProducto('7801234567894', {
    guardados: {},
    traer: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'no_encontrado');
  assert.match(r.mensaje, /no está en la base/);
  assert.doesNotMatch(r.mensaje, /falló/);
});

test('un error real del servidor sí se informa como falla', async () => {
  const r = await buscarProducto('7801234567894', {
    guardados: {},
    traer: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  });
  assert.equal(r.motivo, 'error_red');
  assert.match(r.mensaje, /503/);
});

test('un producto no encontrado explica qué hacer', async () => {
  const r = await buscarProducto('7801234567894', {
    guardados: {},
    traer: async () => ({ ok: true, status: 200, json: async () => ({ status: 0 }) }),
  });
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /a mano/);
});

// --- Carga manual ---

test('un producto cargado a mano queda bien formado', () => {
  const p = productoManual({ codigo: '7801234567894', nombre: 'Galletas de la esquina', kcal: 450, prot: 6, carb: 70, grasa: 16, azucar: 25, sodio: 300, fibra: 2, porcion: 40 });
  assert.equal(p.id, 'cb_7801234567894');
  assert.equal(p.manual, true);
  assert.equal(p.porcion, 40);
  assert.equal(p.kcal, 450);
});

test('la carga manual no deja azúcar mayor que los carbohidratos', () => {
  const p = productoManual({ nombre: 'X', kcal: 100, carb: 10, azucar: 50 });
  assert.equal(p.azucar, 10);
});

test('la carga manual sanea valores negativos y vacíos', () => {
  const p = productoManual({ nombre: '', kcal: -5, porcion: 0 });
  assert.equal(p.kcal, 0);
  assert.equal(p.porcion, 100);
  assert.ok(p.nombre.length > 0);
});

test('soportaEscaneo no se cae fuera del navegador', () => {
  assert.equal(soportaEscaneo(), false);
});

// --- Catálogo con productos y platos ---

test('un producto registrado se puede buscar y escalar como cualquier alimento', () => {
  const p = productoManual({ codigo: '96385074', nombre: 'Barra prueba', kcal: 400, prot: 10, carb: 50, grasa: 16, porcion: 50 });
  registrarProducto(p);
  assert.ok(MAPA_ALIMENTOS.has(p.id));
  assert.ok(buscarAlimentos('barra prueba').some((a) => a.id === p.id));
  const n = escalar(MAPA_ALIMENTOS.get(p.id), 50);
  assert.equal(Math.round(n.kcal), 200);
  olvidarProducto(p.id);
  assert.equal(MAPA_ALIMENTOS.has(p.id), false);
});

// --- Platos preparados ---

test('el catálogo de platos está bien formado', () => {
  const ids = new Set();
  for (const p of PLATOS) {
    assert.ok(!ids.has(p.id), `plato duplicado: ${p.id}`);
    ids.add(p.id);
    for (const campo of ['nombre', 'cat', 'kcal', 'prot', 'carb', 'grasa', 'azucar', 'sodio', 'fibra', 'porcion', 'medida', 'composicion', 'consejo']) {
      assert.ok(p[campo] !== undefined, `${p.id} sin ${campo}`);
    }
    assert.equal(p.plato, true);
    assert.ok(p.porcion > 0 && p.kcal > 0);
    assert.ok(p.consejo.length > 20, `${p.id}: el consejo no dice nada útil`);
  }
});

test('hay platos de las categorías que la gente come fuera', () => {
  const cats = new Set(PLATOS.map((p) => p.cat));
  for (const c of ['Sushi', 'Parrilla', 'Rápida', 'Chilena']) {
    assert.ok(cats.has(c), `falta la categoría ${c}`);
  }
  assert.ok(PLATOS.length >= 30, `solo hay ${PLATOS.length} platos`);
});

test('los platos se pueden buscar junto a los ingredientes', () => {
  assert.ok(buscarAlimentos('sushi').length > 0);
  assert.ok(buscarAlimentos('pizza').some((a) => a.id === 'pizza_muzzarella'));
  assert.ok(buscarAlimentos('parrillada').length >= 0);
  assert.ok(buscarAlimentos('choripán').some((a) => a.plato));
});

test('buscar un ingrediente lo pone antes que el plato preparado', () => {
  const r = buscarAlimentos('pollo');
  const iIngrediente = r.findIndex((a) => !a.plato);
  const iPlato = r.findIndex((a) => a.plato);
  assert.ok(iIngrediente >= 0);
  if (iPlato >= 0) assert.ok(iIngrediente < iPlato, 'el ingrediente debería ir primero');
});

test('un plato registrado suma como cualquier comida', () => {
  const pizza = MAPA_PLATOS.get('pizza_muzzarella');
  const n = escalar(pizza, pizza.porcion);
  assert.equal(Math.round(n.kcal), Math.round(265 * 1.25));
  assert.ok(n.prot > 10);
});

test('la búsqueda sin texto no muestra platos preparados', () => {
  assert.ok(buscarAlimentos('').every((a) => !a.plato));
});

// --- Micronutrientes ---

test('los objetivos de micros dependen del sexo', () => {
  assert.equal(objetivosMicros({ sexo: 'femenino' }).hierro.meta, 18);
  assert.equal(objetivosMicros({ sexo: 'masculino' }).hierro.meta, 8);
  assert.equal(objetivosMicros({}).calcio.meta, 1000);
});

test('un alimento sin datos de micros no cuenta como cero', () => {
  const r = totalizarMicros([
    { alimentoId: 'espinaca', gramos: 100 },
    { alimentoId: 'pizza_muzzarella', gramos: 125 },
  ]);
  assert.equal(r.total.hierro, 2.7, 'solo cuenta la espinaca');
  assert.equal(r.gramosSinDato, 125);
  assert.ok(r.cobertura < 100);
  assert.ok(r.alimentosSinDato.some((a) => a.id === 'pizza_muzzarella'));
});

test('con todo el plato cubierto la cobertura es del 100%', () => {
  const r = totalizarMicros([{ alimentoId: 'espinaca', gramos: 100 }, { alimentoId: 'lentejas', gramos: 200 }]);
  assert.equal(r.cobertura, 100);
  assert.equal(r.gramosSinDato, 0);
});

test('evaluarMicros marca lo que falta', () => {
  const ev = evaluarMicros([{ alimentoId: 'espinaca', gramos: 100 }], { sexo: 'masculino' });
  const hierro = ev.filas.find((f) => f.clave === 'hierro');
  assert.equal(hierro.consumido, 2.7);
  assert.equal(hierro.meta, 8);
  assert.equal(hierro.estado, 'bajo');
  assert.ok(hierro.falta > 0);
});

test('con cobertura baja el panel no saca conclusiones', () => {
  const ev = evaluarMicros([
    { alimentoId: 'espinaca', gramos: 20 },
    { alimentoId: 'pizza_muzzarella', gramos: 300 },
  ], { sexo: 'masculino' });
  const mensajes = leerMicros(ev, 5);
  assert.equal(mensajes.length, 1);
  assert.match(mensajes[0].texto, /no vale la pena sacar conclusiones/);
});

test('con buena cobertura sí señala los déficits', () => {
  const ev = evaluarMicros([{ alimentoId: 'arroz_cocido', gramos: 300 }], { sexo: 'femenino' });
  const mensajes = leerMicros(ev, 5);
  assert.ok(mensajes.some((m) => /Hierro/.test(m.texto)));
});

test('avisa que un solo día dice poco', () => {
  const ev = evaluarMicros([{ alimentoId: 'espinaca', gramos: 200 }], { sexo: 'masculino' });
  assert.ok(leerMicros(ev, 1).some((m) => /por semana/.test(m.texto)));
});

test('sugiere los alimentos con más aporte del micro que falta', () => {
  const s = sugerirParaMicro('vitaminaC', 4);
  assert.equal(s.length, 4);
  assert.ok(s[0].aporte >= s[1].aporte);
  assert.ok(s.every((x) => x.aporte > 0 && x.nombre));
  const hierro = sugerirParaMicro('hierro', 3);
  assert.ok(hierro.some((x) => /avena|mani|almendra|lenteja/i.test(x.nombre)));
});

test('un micro inexistente no rompe la sugerencia', () => {
  assert.deepEqual(sugerirParaMicro('inventado'), []);
});
