import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  costoPorGramo, costoDeItems, DIETAS_ECONOMICAS, escalarDieta, analizarDieta,
  aporteAlEntrenamiento, proteinaMasBarata, tablaPrecios,
} from '../js/nucleo/presupuesto.js';
import { PRECIOS_REFERENCIA } from '../js/datos/precios.js';
import { MAPA_ALIMENTOS, registrarProducto, olvidarProducto } from '../js/datos/alimentos.js';
import { calcularObjetivos, totalizarRegistros } from '../js/nucleo/nutricion.js';

const perfil = { sexo: 'masculino', edad: 35, pesoKg: 80, alturaCm: 175, actividad: 'moderado', objetivo: 'salud', diasEntreno: 3 };
const objetivos = calcularObjetivos(perfil);

test('todo precio de referencia corresponde a un alimento de la base', () => {
  for (const [id, p] of Object.entries(PRECIOS_REFERENCIA)) {
    assert.ok(MAPA_ALIMENTOS.has(id), `${id} tiene precio pero no existe`);
    assert.ok(p.kg > 0 && p.rinde > 0, `${id} con precio o rendimiento inválido`);
  }
});

test('el grano cocido sale más barato por gramo que crudo, y la carne con hueso más cara', () => {
  // Arroz a $1.500 el kilo crudo rinde 2,5: el gramo cocido cuesta $0,60.
  assert.equal(costoPorGramo('arroz_cocido'), 1.5 / 2.5);
  assert.ok(costoPorGramo('pollo_muslo') > PRECIOS_REFERENCIA.pollo_muslo.kg / 1000);
});

test('el precio propio reemplaza al de referencia', () => {
  assert.equal(costoPorGramo('avena', { avena: 3000 }), 3);
  assert.equal(costoPorGramo('avena', { avena: 0 }), 2.1, 'un precio vacío no anula la referencia');
});

test('un producto escaneado con precio de envase tiene costo', () => {
  registrarProducto({ id: 'cb_prueba', nombre: 'Yogur de prueba', cat: 'Escaneado', kcal: 60, prot: 10, carb: 4, grasa: 0, azucar: 4, sodio: 40, fibra: 0, porcion: 150, medida: 'pote', precioEnvase: 900, gramosEnvase: 150 });
  assert.equal(costoPorGramo('cb_prueba'), 6);
  assert.ok(proteinaMasBarata({}, 100).some((p) => p.id === 'cb_prueba'));
  olvidarProducto('cb_prueba');
});

test('lo que no tiene precio no se cuenta como gratis: se informa aparte', () => {
  const c = costoDeItems([{ alimentoId: 'avena', gramos: 100 }, { alimentoId: 'chirimoya', gramos: 150 }]);
  assert.equal(c.total, 210);
  assert.deepEqual(c.sinPrecio, ['chirimoya']);
});

test('todas las dietas económicas usan alimentos con precio', () => {
  for (const d of DIETAS_ECONOMICAS) {
    const a = analizarDieta(d, { perfil, objetivos });
    assert.deepEqual(a.costo.sinPrecio, [], `${d.id} tiene alimentos sin precio`);
    assert.ok(a.costo.total > 1000 && a.costo.total < 8000, `${d.id} cuesta $${a.costo.total} al día`);
  }
});

test('las dietas se ajustan a las calorías de la persona', () => {
  for (const d of DIETAS_ECONOMICAS) {
    for (const kcal of [1800, 2600, 3200]) {
      const e = escalarDieta(d, kcal);
      const total = totalizarRegistros(e.items).kcal;
      if (e.factor > 0.6 && e.factor < 1.8) {
        assert.ok(Math.abs(total - kcal) / kcal < 0.08, `${d.id} a ${kcal} kcal dio ${Math.round(total)}`);
      }
    }
  }
});

test('los huevos se ajustan en unidades enteras y las verduras no se escalan', () => {
  const d = DIETAS_ECONOMICAS.find((x) => x.id === 'basica');
  const e = escalarDieta(d, 3200);
  for (const i of e.items.filter((x) => x.alimentoId === 'huevo')) assert.equal(i.gramos % 55, 0);
  assert.equal(e.items.find((x) => x.alimentoId === 'lechuga').gramos, 80);
  assert.equal(e.items.find((x) => x.alimentoId === 'agua').gramos, 2000);
});

test('las dietas para entrenar llegan a 1,6 g de proteína por kilo', () => {
  for (const d of DIETAS_ECONOMICAS) {
    const a = analizarDieta(d, { perfil, objetivos });
    assert.ok(a.aporte.protKg >= 1.6, `${d.id}: ${a.aporte.protKg} g/kg`);
  }
});

test('el aporte al entrenamiento avisa cuando falta proteína', () => {
  const pocoProteico = [
    { momento: 'Desayuno', alimentoId: 'avena', gramos: 60 },
    { momento: 'Almuerzo', alimentoId: 'arroz_cocido', gramos: 300 },
    { momento: 'Almuerzo', alimentoId: 'lechuga', gramos: 80 },
  ];
  const a = aporteAlEntrenamiento(pocoProteico, perfil, objetivos);
  assert.ok(a.protKg < 1.6);
  assert.equal(a.lineas[0].tono, 'aviso');
  assert.match(a.lineas[0].texto, /Proteína/);
});

test('el ranking de proteína barata ordena por costo y descarta lo que no es fuente de proteína', () => {
  const lista = proteinaMasBarata({}, 30);
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i].costo >= lista[i - 1].costo);
  for (const id of ['fideos', 'arroz_cocido', 'aceite_vegetal', 'linaza']) {
    assert.ok(!lista.some((p) => p.id === id), `${id} no debería aparecer`);
  }
  assert.ok(lista.some((p) => p.id === 'huevo'));
});

test('la tabla de precios muestra referencia y precio propio', () => {
  const tabla = tablaPrecios({ huevo: 4200 });
  const huevo = tabla.find((p) => p.id === 'huevo');
  assert.equal(huevo.propio, 4200);
  assert.equal(huevo.referencia, PRECIOS_REFERENCIA.huevo.kg);
  assert.ok(!tabla.some((p) => p.id === 'agua'));
});
