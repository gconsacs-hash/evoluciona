import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularTMB, calcularGET, calcularObjetivos, totalizarRegistros, evaluarDia,
  diaEnMeta, sugerirAlimentos, repartirComidas, proyectarPeso, imc, clasificarIMC,
} from '../js/nucleo/nutricion.js';
import { MAPA_ALIMENTOS, escalar, buscarAlimentos } from '../js/datos/alimentos.js';

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

test('escalar es proporcional a los gramos', () => {
  const a = MAPA_ALIMENTOS.get('avena');
  const mitad = escalar(a, 50);
  const doble = escalar(a, 100);
  assert.equal(Math.round(doble.kcal), Math.round(mitad.kcal * 2));
});
