import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  OBJETIVOS, EXPERIENCIA, calcularObjetivos, estimarGrasaCorporal,
  viabilidadRecomposicion, proyectarPeso, calcularGET,
} from '../js/nucleo/nutricion.js';
import { estadoInicial, registrarPeso } from '../js/nucleo/almacen.js';

const base = { sexo: 'masculino', edad: 30, pesoKg: 80, alturaCm: 175, actividad: 'moderado', objetivo: 'recomponer', diasEntreno: 4 };

// --- Parámetros del objetivo ---

test('recomposición usa déficit suave, no agresivo', () => {
  assert.equal(OBJETIVOS.recomponer.ajuste, -0.1);
  assert.ok(OBJETIVOS.recomponer.ajuste > OBJETIVOS.perder.ajuste,
    'el déficit debe ser menor que el de bajar grasa');
  assert.ok(OBJETIVOS.recomponer.ajuste < 0, 'pero tiene que haber déficit para perder grasa');
});

test('recomposición exige la proteína más alta de todos los objetivos', () => {
  const proteinas = Object.values(OBJETIVOS).map((o) => o.protPorKg);
  assert.equal(OBJETIVOS.recomponer.protPorKg, Math.max(...proteinas));
  assert.ok(OBJETIVOS.recomponer.protPorKg >= 2.2, 'la evidencia usa 2,2 g/kg o más');
});

test('la etiqueta dice lo que la persona busca', () => {
  assert.match(OBJETIVOS.recomponer.etiqueta, /perder grasa/i);
  assert.match(OBJETIVOS.recomponer.etiqueta, /ganar músculo/i);
});

test('los objetivos calculados reflejan el déficit y la proteína', () => {
  const o = calcularObjetivos(base);
  assert.equal(o.kcal, Math.round(o.get * 0.9));
  assert.equal(o.prot, Math.round(80 * 2.4));
  assert.ok(o.kcal < calcularGET(base), 'debe quedar bajo el gasto');
});

// --- Estimación de grasa corporal ---

test('la estimación se declara siempre como estimación', () => {
  const e = estimarGrasaCorporal(base);
  assert.equal(e.estimado, true);
  assert.ok(e.margen >= 5, 'debe declarar un margen de error honesto');
});

test('a igual IMC, la fórmula da más grasa en mujeres y en mayores', () => {
  const hombre = estimarGrasaCorporal(base).valor;
  const mujer = estimarGrasaCorporal({ ...base, sexo: 'femenino' }).valor;
  const mayor = estimarGrasaCorporal({ ...base, edad: 60 }).valor;
  assert.ok(mujer > hombre);
  assert.ok(mayor > hombre);
});

test('la estimación se mantiene en un rango posible', () => {
  const extremo = estimarGrasaCorporal({ sexo: 'masculino', edad: 18, pesoKg: 45, alturaCm: 190 });
  assert.ok(extremo.valor >= 3 && extremo.valor <= 70);
});

// --- Viabilidad ---

test('a quien recién parte se le dice que sí', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'novato' });
  assert.equal(v.nivel, 'alta');
  assert.match(v.titulo, /realista/i);
  assert.ok(v.motivos.some((m) => /poco tiempo entrenando/i.test(m)));
});

test('a quien retoma tras una pausa también', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'retomando' });
  assert.equal(v.nivel, 'alta');
  assert.ok(v.motivos.some((m) => /pausa/i.test(m)));
});

test('con grasa corporal alta es viable aunque sea intermedio', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'intermedio', grasaCorporal: 28 });
  assert.equal(v.nivel, 'alta');
  assert.ok(v.motivos.some((m) => /reservas/i.test(m)));
});

test('a un avanzado y delgado se le dice que no le conviene, con alternativa', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'avanzado', grasaCorporal: 10 });
  assert.equal(v.nivel, 'baja');
  assert.ok(v.alternativa, 'debe ofrecer el camino por etapas');
  assert.equal(v.alternativa.pasos.length, 3);
  assert.match(v.explicacion, /etapas/i);
});

test('el caso intermedio se declara lento en vez de prometer', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'intermedio', grasaCorporal: 16 });
  assert.equal(v.nivel, 'media');
  assert.match(v.titulo, /lento/i);
});

test('los umbrales de grasa son distintos para mujeres', () => {
  // 25% de grasa es alto en un hombre, normal en una mujer.
  const hombre = viabilidadRecomposicion({ ...base, sexo: 'masculino', experiencia: 'avanzado', grasaCorporal: 25 });
  const mujer = viabilidadRecomposicion({ ...base, sexo: 'femenino', experiencia: 'avanzado', grasaCorporal: 25 });
  assert.equal(hombre.nivel, 'media', 'con 25% un hombre aún tiene margen');
  assert.equal(mujer.nivel, 'media');
  const mujerDelgada = viabilidadRecomposicion({ ...base, sexo: 'femenino', experiencia: 'avanzado', grasaCorporal: 18 });
  assert.equal(mujerDelgada.nivel, 'baja');
});

test('sin experiencia declarada se infiere de las sesiones registradas', () => {
  const pocas = viabilidadRecomposicion({ ...base }, { sesionesRegistradas: 5 });
  assert.equal(pocas.experiencia, 'novato');
  const muchas = viabilidadRecomposicion({ ...base }, { sesionesRegistradas: 100 });
  assert.equal(muchas.experiencia, 'avanzado');
  const medias = viabilidadRecomposicion({ ...base }, { sesionesRegistradas: 40 });
  assert.equal(medias.experiencia, 'intermedio');
});

test('la grasa declarada manda sobre la estimada', () => {
  const v = viabilidadRecomposicion({ ...base, grasaCorporal: 27, experiencia: 'intermedio' });
  assert.equal(v.grasaCorporal, 27);
  assert.equal(v.grasaEstimada, false);
});

test('cuando la grasa es estimada se avisa', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'intermedio' });
  assert.equal(v.grasaEstimada, true);
  assert.ok(v.motivos.some((m) => /estimación/i.test(m)));
});

test('siempre entrega las condiciones que hay que cumplir', () => {
  for (const exp of Object.keys(EXPERIENCIA)) {
    const v = viabilidadRecomposicion({ ...base, experiencia: exp });
    assert.ok(v.requisitos.length >= 4, `faltan requisitos para ${exp}`);
    assert.ok(v.requisitos.some((r) => /proteína/i.test(r)));
    assert.ok(v.requisitos.some((r) => /fuerza/i.test(r)));
    assert.ok(v.requisitos.some((r) => /dormir/i.test(r)));
  }
});

test('explica cómo medir el avance sin la balanza', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'novato' });
  assert.ok(v.comoMedilo === undefined);
  assert.ok(v.comoMedirlo.some((m) => /cintura/i.test(m)));
  assert.ok(v.comoMedirlo.some((m) => /balanza/i.test(m)));
  assert.ok(v.comoMedirlo.some((m) => /cargas/i.test(m)));
});

test('la proteína del requisito coincide con la que calcula la app', () => {
  const v = viabilidadRecomposicion({ ...base, experiencia: 'novato' });
  const objetivos = calcularObjetivos(base);
  assert.ok(v.requisitos[0].includes(String(objetivos.prot)),
    `el requisito debería citar ${objetivos.prot} g`);
});

// --- Proyección de peso ---

test('en recomposición se avisa que el peso no es la medida', () => {
  const objetivos = calcularObjetivos(base);
  const p = proyectarPeso([objetivos.kcal], objetivos, 80, 'recomponer');
  assert.equal(p.pesoNoEsLaMedida, true);
  assert.match(p.nota, /cintura/i);
});

test('en los demás objetivos la proyección no cambia', () => {
  const objetivos = calcularObjetivos({ ...base, objetivo: 'perder' });
  const p = proyectarPeso([objetivos.kcal], objetivos, 80, 'perder');
  assert.equal(p.pesoNoEsLaMedida, undefined);
  assert.equal(p.nota, undefined);
});

// --- Registro de cintura ---

test('el peso admite guardar la cintura junto a él', () => {
  let estado = estadoInicial();
  estado = registrarPeso(estado, 80, '2026-09-29', 88);
  assert.equal(estado.pesos[0].cintura, 88);
  assert.equal(estado.pesos[0].peso, 80);
});

test('al repesarse sin medir la cintura, se conserva la última', () => {
  let estado = estadoInicial();
  estado = registrarPeso(estado, 80, '2026-09-29', 88);
  estado = registrarPeso(estado, 79.5, '2026-09-29');
  assert.equal(estado.pesos.length, 1);
  assert.equal(estado.pesos[0].peso, 79.5);
  assert.equal(estado.pesos[0].cintura, 88, 'no se debe perder la medida anterior');
});

test('sin cintura el registro sigue funcionando como antes', () => {
  let estado = estadoInicial();
  estado = registrarPeso(estado, 80, '2026-09-29');
  assert.equal(estado.pesos[0].cintura, undefined);
  assert.equal(estado.perfil.pesoKg, 80);
});
