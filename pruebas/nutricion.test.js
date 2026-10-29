import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularTMB, calcularGET, calcularObjetivos, totalizarRegistros, evaluarDia,
  diaEnMeta, sugerirAlimentos, repartirComidas, proyectarPeso, imc, clasificarIMC,
  distribucionCalorias, resumenPorComida, calidadDelDia, resumenSemanal,
} from '../js/nucleo/nutricion.js';
import { MAPA_ALIMENTOS, ALIMENTOS, CATEGORIAS, escalar, buscarAlimentos } from '../js/datos/alimentos.js';
import { MICROS_POR_100G } from '../js/datos/micronutrientes.js';

const perfil = { sexo: 'masculino', edad: 30, pesoKg: 80, alturaCm: 175, actividad: 'moderado', objetivo: 'perder', diasEntreno: 4 };

test('TMB con Mifflin-St Jeor para hombre', () => {
  // 10*80 + 6.25*175 - 5*30 + 5 = 800 + 1093.75 - 150 + 5 = 1748.75 -> 1749
  assert.equal(calcularTMB(perfil), 1749);
});

test('TMB para mujer resta 161 en lugar de sumar 5', () => {
  const hombre = calcularTMB(perfil);
  const mujer = calcularTMB({ ...perfil, sexo: 'femenino' });
  assert.equal(hombre - mujer, 166);
});

test('el gasto total aplica el factor de actividad', () => {
  assert.equal(calcularGET(perfil), Math.round(1749 * 1.55));
  assert.ok(calcularGET({ ...perfil, actividad: 'atleta' }) > calcularGET({ ...perfil, actividad: 'sedentario' }));
});

test('objetivo de bajar grasa deja un déficit del 20%', () => {
  const o = calcularObjetivos(perfil);
  assert.equal(o.kcal, Math.round(o.get * 0.8));
});

test('objetivo de ganar músculo deja superávit', () => {
  const o = calcularObjetivos({ ...perfil, objetivo: 'ganar' });
  assert.ok(o.kcal > o.get);
});

test('la proteína se calcula por kilo de peso', () => {
  const o = calcularObjetivos(perfil);
  assert.equal(o.prot, 160); // 80 kg × 2.0 g para bajar grasa
});

test('los macros suman aproximadamente las calorías objetivo', () => {
  const o = calcularObjetivos(perfil);
  const kcalMacros = o.prot * 4 + o.carb * 4 + o.grasa * 9;
  assert.ok(Math.abs(kcalMacros - o.kcal) < 25, `diferencia de ${Math.abs(kcalMacros - o.kcal)} kcal`);
});

test('las calorías nunca bajan de 1200', () => {
  const o = calcularObjetivos({ ...perfil, pesoKg: 40, alturaCm: 145, edad: 70, actividad: 'sedentario' });
  assert.ok(o.kcal >= 1200);
});

test('el agua sale de 35 ml por kilo más los entrenamientos', () => {
  const o = calcularObjetivos(perfil);
  assert.ok(o.agua >= 80 * 35);
  assert.ok(o.agua <= 80 * 35 + 600);
});

test('el límite de azúcares es el 10% de las calorías', () => {
  const o = calcularObjetivos(perfil);
  assert.equal(o.azucar, Math.round((o.kcal * 0.10) / 4));
  assert.ok(o.azucarIdeal < o.azucar);
});

test('totalizar suma los nutrientes escalados por gramos', () => {
  const total = totalizarRegistros([
    { alimentoId: 'pollo_pechuga', gramos: 200 },
    { alimentoId: 'arroz_cocido', gramos: 200 },
  ]);
  assert.equal(Math.round(total.kcal), 330 + 260);
  assert.equal(Math.round(total.prot), 62 + 5);
});

test('totalizar ignora alimentos inexistentes', () => {
  const total = totalizarRegistros([{ alimentoId: 'no_existe', gramos: 100 }]);
  assert.equal(total.kcal, 0);
});

test('el agua de las bebidas cuenta para la hidratación', () => {
  const total = totalizarRegistros([{ alimentoId: 'agua', gramos: 500 }]);
  assert.equal(total.agua, 500);
  assert.equal(total.kcal, 0);
});

test('evaluarDia marca óptimo entre 95% y 110% de la meta', () => {
  const objetivos = calcularObjetivos(perfil);
  const total = { kcal: objetivos.kcal, prot: objetivos.prot, carb: objetivos.carb, grasa: objetivos.grasa, azucar: 10, sodio: 900, fibra: objetivos.fibra, agua: objetivos.agua };
  const ev = evaluarDia(total, objetivos);
  assert.equal(ev.kcal.estado, 'optimo');
  assert.equal(ev.prot.estado, 'optimo');
  assert.equal(ev.azucar.estado, 'optimo');
  assert.ok(diaEnMeta(ev));
});

test('evaluarDia marca exceso cuando se pasa un límite', () => {
  const objetivos = calcularObjetivos(perfil);
  const ev = evaluarDia({ kcal: 100, prot: 0, carb: 0, grasa: 0, azucar: 999, sodio: 9999, fibra: 0, agua: 0 }, objetivos);
  assert.equal(ev.azucar.estado, 'exceso');
  assert.equal(ev.sodio.estado, 'exceso');
  assert.equal(ev.kcal.estado, 'bajo');
  assert.equal(diaEnMeta(ev), false);
});

test('el agua extra registrada a mano se suma a la evaluación', () => {
  const objetivos = calcularObjetivos(perfil);
  const sinExtra = evaluarDia({ kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0, agua: 0 }, objetivos, 0);
  const conExtra = evaluarDia({ kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0, agua: 0 }, objetivos, 1000);
  assert.equal(sinExtra.agua.consumido, 0);
  assert.equal(conExtra.agua.consumido, 1000);
});

test('las sugerencias priorizan proteína cuando falta proteína', () => {
  const objetivos = calcularObjetivos(perfil);
  const ev = evaluarDia({ kcal: 400, prot: 10, carb: 60, grasa: 10, azucar: 5, sodio: 200, fibra: 5, agua: 0 }, objetivos);
  const sugerencias = sugerirAlimentos(ev, 5);
  assert.ok(sugerencias.length > 0);
  const proteicas = sugerencias.filter((s) => s.prot >= 15).length;
  assert.ok(proteicas >= 3, `solo ${proteicas} sugerencias proteicas`);
});

test('las sugerencias no exceden las calorías que quedan disponibles', () => {
  const objetivos = calcularObjetivos(perfil);
  const ev = evaluarDia({ kcal: objetivos.kcal - 150, prot: 50, carb: 100, grasa: 30, azucar: 5, sodio: 200, fibra: 5, agua: 0 }, objetivos);
  for (const s of sugerirAlimentos(ev, 6)) {
    assert.ok(s.kcal <= 150 * 1.2, `${s.nombre} aporta ${s.kcal} kcal`);
  }
});

test('el reparto de comidas suma el total del día', () => {
  const objetivos = calcularObjetivos(perfil);
  for (const n of [3, 4, 5]) {
    const reparto = repartirComidas(objetivos, n);
    assert.equal(reparto.length, n);
    const suma = reparto.reduce((a, c) => a + c.kcal, 0);
    assert.ok(Math.abs(suma - objetivos.kcal) <= 5, `${n} comidas suman ${suma} de ${objetivos.kcal}`);
  }
});

test('la proyección de peso detecta un déficit sostenible', () => {
  const objetivos = calcularObjetivos(perfil);
  const proy = proyectarPeso(new Array(7).fill(objetivos.get - 500), objetivos, 80);
  assert.ok(proy.kgPorSemana < 0);
  assert.ok(proy.sostenible);
});

test('la proyección marca como no sostenible un déficit extremo', () => {
  const objetivos = calcularObjetivos(perfil);
  const proy = proyectarPeso(new Array(7).fill(objetivos.get - 1800), objetivos, 60);
  assert.equal(proy.sostenible, false);
});

test('IMC y su clasificación', () => {
  assert.equal(imc(80, 175), 26.1);
  assert.equal(clasificarIMC(22).texto, 'Peso normal');
  assert.equal(clasificarIMC(26.1).texto, 'Sobrepeso');
  assert.equal(clasificarIMC(31).texto, 'Obesidad');
  assert.equal(clasificarIMC(17).texto, 'Bajo peso');
});

test('la búsqueda de alimentos ignora tildes y mayúsculas', () => {
  assert.ok(buscarAlimentos('PLATANO').some((a) => a.id === 'platano'));
  assert.ok(buscarAlimentos('proteína').length > 0);
  assert.equal(buscarAlimentos('zzzz').length, 0);
});

test('todos los alimentos tienen los campos necesarios y valores coherentes', () => {
  for (const [id, a] of MAPA_ALIMENTOS) {
    for (const campo of ['nombre', 'cat', 'kcal', 'prot', 'carb', 'grasa', 'azucar', 'sodio', 'fibra', 'porcion', 'medida']) {
      assert.ok(a[campo] !== undefined, `${id} sin ${campo}`);
    }
    assert.ok(a.azucar <= a.carb + 0.1, `${id}: azúcar mayor que carbohidratos`);
    // En las bebidas alcohólicas las calorías no salen de los macros: el alcohol
    // aporta 7 kcal por gramo y no se registra como macro. Se declaran aparte.
    if (a.alcohol) continue;
    const kcalTeoricas = a.prot * 4 + a.carb * 4 + a.grasa * 9;
    // Tolerancia amplia: la fibra aporta distinto que los macros puros.
    assert.ok(Math.abs(kcalTeoricas - a.kcal) <= Math.max(45, a.kcal * 0.3), `${id}: ${a.kcal} kcal declaradas vs ${Math.round(kcalTeoricas)} calculadas`);
  }
});

test('la base tiene más de 180 alimentos sin ids repetidos', () => {
  assert.ok(ALIMENTOS.length >= 180, `solo ${ALIMENTOS.length}`);
  assert.equal(new Set(ALIMENTOS.map((a) => a.id)).size, ALIMENTOS.length);
  for (const a of ALIMENTOS) assert.ok(CATEGORIAS.includes(a.cat), `${a.id} con categoría ${a.cat}`);
});

test('casi todos los alimentos tienen micronutrientes', () => {
  const sin = ALIMENTOS.filter((a) => !MICROS_POR_100G[a.id]).map((a) => a.id);
  assert.deepEqual(sin, []);
});

test('la búsqueda filtra por categoría', () => {
  const frutas = buscarAlimentos('', 200, 'Fruta');
  assert.ok(frutas.length >= 20);
  assert.ok(frutas.every((a) => a.cat === 'Fruta'));
  assert.ok(buscarAlimentos('chirimoya', 10, 'Fruta').some((a) => a.id === 'chirimoya'));
  assert.equal(buscarAlimentos('chirimoya', 10, 'Lácteo').length, 0);
});

test('las sugerencias nunca proponen condimentos ni ultraprocesados', () => {
  const objetivos = calcularObjetivos(perfil);
  const ev = evaluarDia({ kcal: 300, prot: 5, carb: 20, grasa: 5, azucar: 2, sodio: 100, fibra: 1, agua: 0 }, objetivos);
  for (const s of sugerirAlimentos(ev, 20)) {
    const a = MAPA_ALIMENTOS.get(s.id);
    assert.ok(a.cat !== 'Condimento' && !a.up, `${s.nombre} no debería sugerirse`);
  }
});

test('la distribución de calorías suma 100% y separa el alcohol', () => {
  const objetivos = calcularObjetivos(perfil);
  const d = distribucionCalorias({ kcal: 2000, prot: 150, carb: 200, grasa: 60 }, objetivos);
  assert.equal(d.actual.prot + d.actual.carb + d.actual.grasa + d.actual.otras, 100);
  assert.equal(d.actual.prot, 30);
  const conAlcohol = distribucionCalorias({ kcal: 1000, prot: 25, carb: 100, grasa: 20 }, objetivos);
  assert.ok(conAlcohol.actual.otras > 20, 'las calorías que no son macros se informan como otras');
  assert.equal(distribucionCalorias({ kcal: 0, prot: 0, carb: 0, grasa: 0 }, objetivos).actual.prot, 0);
});

test('el resumen por comida compara contra el reparto y suma lo que no está en él', () => {
  const objetivos = calcularObjetivos(perfil);
  const reparto = repartirComidas(objetivos, 4);
  const registros = [
    { alimentoId: 'avena', gramos: 100, momento: 'Desayuno' },
    { alimentoId: 'manzana', gramos: 180, momento: 'Otro' },
  ];
  const r = resumenPorComida(registros, reparto);
  assert.equal(r.length, 5);
  const desayuno = r.find((c) => c.nombre === 'Desayuno');
  assert.equal(desayuno.kcal, 389);
  assert.equal(desayuno.pct, Math.round((389 / reparto[0].kcal) * 100));
  assert.equal(r.find((c) => c.nombre === 'Otro').pct, null);
  assert.equal(r.find((c) => c.nombre === 'Cena').registros, 0);
});

test('la calidad del día premia frutas, verduras y variedad, y castiga ultraprocesados', () => {
  const objetivos = calcularObjetivos(perfil);
  const evaluar = (registros) => evaluarDia(totalizarRegistros(registros), objetivos);
  const bueno = [
    ['avena', 80], ['leche_semi', 250], ['platano', 120], ['pollo_pechuga', 200], ['arroz_integral', 200],
    ['brocoli', 150], ['tomate', 130], ['lechuga', 80], ['lentejas', 250], ['manzana', 180], ['yogur_natural', 170],
    ['zanahoria', 100], ['huevo', 110], ['aceite_oliva', 10],
  ].map(([alimentoId, gramos]) => ({ alimentoId, gramos, momento: 'x' }));
  const malo = [['completo', 400], ['bebida_azucarada', 700], ['papas_fritas_bolsa', 120], ['alfajor', 100]]
    .map(([alimentoId, gramos]) => ({ alimentoId, gramos, momento: 'x' }));
  const cb = calidadDelDia(bueno, evaluar(bueno));
  const cm = calidadDelDia(malo, evaluar(malo));
  assert.ok(cb.puntaje >= 75, `día bueno: ${cb.puntaje}`);
  assert.ok(cm.puntaje <= 35, `día malo: ${cm.puntaje}`);
  assert.ok(cb.porcionesFV >= 5);
  assert.ok(cm.pctUP >= 90);
  assert.equal(cb.componentes.length, 6);
  assert.equal(calidadDelDia([], evaluar([])).vacio, true);
});

test('el resumen semanal promedia los días con registro', () => {
  const r = resumenSemanal([
    { total: { kcal: 2000, prot: 100, fibra: 20 }, enMeta: true },
    { total: { kcal: 2400, prot: 140, fibra: 30 }, enMeta: false },
  ]);
  assert.equal(r.kcal, 2200);
  assert.equal(r.prot, 120);
  assert.equal(r.enMeta, 1);
  assert.equal(resumenSemanal([]), null);
});

test('escalar es proporcional a los gramos', () => {
  const a = MAPA_ALIMENTOS.get('avena');
  const mitad = escalar(a, 50);
  const doble = escalar(a, 100);
  assert.equal(Math.round(doble.kcal), Math.round(mitad.kcal * 2));
});
