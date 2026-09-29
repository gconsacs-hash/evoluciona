import { test } from 'node:test';
import assert from 'node:assert/strict';

import { seriesDeAproximacion, detectarDescarga, estimar1RM } from '../js/nucleo/entrenamiento.js';
import {
  regresionLineal, fuerzaCorrelacion, tendencia1RM, ejerciciosConTendencia,
  relacionCaloriasRendimiento, tendenciaPeso, volumenPorSemanaYMusculo, titularesAnalitica,
} from '../js/nucleo/analitica.js';

// --- Series de aproximación ---

test('el calentamiento sube por tramos hasta la carga objetivo', () => {
  const r = seriesDeAproximacion(100);
  assert.equal(r.tipo, 'carga');
  assert.equal(r.objetivo, 100);
  assert.ok(r.series.length >= 3);
  for (let i = 1; i < r.series.length; i++) {
    assert.ok(r.series[i].peso > r.series[i - 1].peso, 'cada serie pesa más que la anterior');
    assert.ok(r.series[i].reps <= r.series[i - 1].reps, 'y lleva menos repeticiones');
  }
  assert.ok(r.series[r.series.length - 1].peso < 100, 'ninguna aproximación llega a la carga de trabajo');
});

test('los pesos se redondean a saltos de 2,5 kg', () => {
  for (const s of seriesDeAproximacion(97.5).series) {
    assert.equal(s.peso % 2.5, 0, `${s.peso} no es múltiplo de 2,5`);
  }
});

test('ninguna aproximación baja del peso de la barra', () => {
  for (const s of seriesDeAproximacion(60).series) assert.ok(s.peso >= 20);
});

test('con carga liviana se usan menos tramos', () => {
  assert.ok(seriesDeAproximacion(30).series.length < seriesDeAproximacion(140).series.length);
});

test('no se repiten series con el mismo peso', () => {
  const pesos = seriesDeAproximacion(25).series.map((s) => s.peso);
  assert.equal(new Set(pesos).size, pesos.length);
});

test('en peso corporal el calentamiento es por dificultad', () => {
  const r = seriesDeAproximacion(0, { esCorporal: true });
  assert.equal(r.tipo, 'corporal');
  assert.ok(r.series.length >= 3);
  assert.match(r.nota, /variante/i);
});

// --- Descarga ---

function sesion(semana, fecha, peso, reps = 5, ejercicioId = 'sentadilla_barra') {
  return { id: `s-${fecha}`, fecha, semana, ejercicios: [{ ejercicioId, series: [{ peso, reps }] }] };
}

test('sin semanas suficientes no se opina sobre la descarga', () => {
  const r = detectarDescarga([sesion('2026-09-07', '2026-09-08', 100)]);
  assert.equal(r.necesita, false);
  assert.match(r.mensaje, /suficientes/);
});

test('cuatro semanas subiendo carga piden descarga', () => {
  const h = [
    sesion('2026-08-31', '2026-09-01', 100),
    sesion('2026-09-07', '2026-09-08', 105),
    sesion('2026-09-14', '2026-09-15', 110),
    sesion('2026-09-21', '2026-09-22', 115),
    sesion('2026-09-28', '2026-09-29', 120),
  ];
  const r = detectarDescarga(h);
  assert.equal(r.necesita, true);
  assert.equal(r.motivo, 'progresion');
  assert.equal(r.subiendo, 4);
  assert.equal(r.propuesta.seriesPct, 60);
});

test('tres semanas sin mejorar se leen como estancamiento', () => {
  const h = [
    sesion('2026-08-31', '2026-09-01', 100),
    sesion('2026-09-07', '2026-09-08', 100),
    sesion('2026-09-14', '2026-09-15', 100),
    sesion('2026-09-21', '2026-09-22', 100),
  ];
  const r = detectarDescarga(h);
  assert.equal(r.necesita, true);
  assert.equal(r.motivo, 'estancamiento');
  assert.equal(r.propuesta.cargaPct, 85);
});

test('dos semanas subiendo todavía no piden descarga', () => {
  const h = [
    sesion('2026-09-07', '2026-09-08', 100),
    sesion('2026-09-14', '2026-09-15', 105),
    sesion('2026-09-21', '2026-09-22', 110),
  ];
  const r = detectarDescarga(h);
  assert.equal(r.necesita, false);
  assert.equal(r.subiendo, 2);
  assert.match(r.mensaje, /2 semanas subiendo/);
});

test('la descarga solo mira ejercicios compuestos', () => {
  const h = [
    sesion('2026-08-31', '2026-09-01', 10, 12, 'curl_biceps'),
    sesion('2026-09-07', '2026-09-08', 12, 12, 'curl_biceps'),
    sesion('2026-09-14', '2026-09-15', 14, 12, 'curl_biceps'),
    sesion('2026-09-21', '2026-09-22', 16, 12, 'curl_biceps'),
    sesion('2026-09-28', '2026-09-29', 18, 12, 'curl_biceps'),
  ];
  const r = detectarDescarga(h);
  assert.equal(r.semanas.length, 0, 'un aislado no debería contar como carga principal');
  assert.equal(r.necesita, false);
});

// --- Regresión y correlación ---

test('la regresión recupera una recta exacta', () => {
  const r = regresionLineal([{ x: 0, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 6 }, { x: 3, y: 8 }]);
  assert.equal(Math.round(r.pendiente * 1000) / 1000, 2);
  assert.equal(Math.round(r.interseccion * 1000) / 1000, 2);
  assert.equal(r.r, 1);
});

test('una relación inversa da correlación negativa', () => {
  const r = regresionLineal([{ x: 0, y: 10 }, { x: 1, y: 8 }, { x: 2, y: 6 }]);
  assert.ok(r.pendiente < 0);
  assert.equal(r.r, -1);
});

test('con un solo punto o sin variación en x no hay recta', () => {
  assert.equal(regresionLineal([{ x: 1, y: 1 }]), null);
  assert.equal(regresionLineal([{ x: 2, y: 1 }, { x: 2, y: 5 }]), null);
});

test('la fuerza de la correlación se describe con prudencia', () => {
  assert.equal(fuerzaCorrelacion(0.9).etiqueta, 'fuerte');
  assert.equal(fuerzaCorrelacion(-0.85).etiqueta, 'fuerte');
  assert.equal(fuerzaCorrelacion(0.5).etiqueta, 'moderada');
  assert.equal(fuerzaCorrelacion(0.25).etiqueta, 'débil');
  assert.equal(fuerzaCorrelacion(0.05).etiqueta, 'sin relación aparente');
});

// --- Tendencias ---

const historial = [
  sesion('2026-08-31', '2026-09-01', 80),
  sesion('2026-09-07', '2026-09-08', 85),
  sesion('2026-09-14', '2026-09-15', 90),
  sesion('2026-09-21', '2026-09-22', 95),
];

test('la tendencia de 1RM mide la ganancia y el ritmo', () => {
  const t = tendencia1RM(historial, 'sentadilla_barra');
  assert.equal(t.sesiones, 4);
  assert.equal(t.primero, estimar1RM(80, 5));
  assert.equal(t.ultimo, estimar1RM(95, 5));
  assert.ok(t.ganancia > 0);
  assert.ok(t.kgPorSemana > 0);
  assert.equal(t.dias, 21);
});

test('un ejercicio sin registros no tiene tendencia', () => {
  assert.equal(tendencia1RM(historial, 'press_banca'), null);
});

test('solo se listan los ejercicios con historial suficiente', () => {
  const lista = ejerciciosConTendencia(historial, 3);
  assert.equal(lista.length, 1);
  assert.equal(lista[0].ejercicioId, 'sentadilla_barra');
  assert.equal(ejerciciosConTendencia(historial, 9).length, 0);
});

test('la tendencia de peso distingue estable de real', () => {
  const baja = tendenciaPeso([
    { fecha: '2026-09-01', peso: 82 }, { fecha: '2026-09-08', peso: 81.5 },
    { fecha: '2026-09-15', peso: 81 }, { fecha: '2026-09-22', peso: 80.5 },
  ]);
  assert.ok(baja.suficiente);
  assert.ok(baja.kgPorSemana < 0);
  assert.equal(baja.estable, false);

  const plano = tendenciaPeso([
    { fecha: '2026-09-01', peso: 80 }, { fecha: '2026-09-08', peso: 80 }, { fecha: '2026-09-15', peso: 80 },
  ]);
  assert.equal(plano.estable, true);
  assert.match(plano.mensaje, /estable/);
});

test('con menos de tres pesadas no se proyecta nada', () => {
  assert.equal(tendenciaPeso([{ fecha: '2026-09-01', peso: 80 }]).suficiente, false);
});

test('la proyección al objetivo avisa si vas en sentido contrario', () => {
  const subiendo = tendenciaPeso([
    { fecha: '2026-09-01', peso: 80 }, { fecha: '2026-09-08', peso: 81 }, { fecha: '2026-09-15', peso: 82 },
  ], 75);
  assert.match(subiendo.mensaje, /dirección contraria/);

  const bajando = tendenciaPeso([
    { fecha: '2026-09-01', peso: 82 }, { fecha: '2026-09-08', peso: 81 }, { fecha: '2026-09-15', peso: 80 },
  ], 75);
  assert.ok(bajando.semanasParaObjetivo > 0);
});

test('la relación calorías-rendimiento exige datos cruzados', () => {
  const pocos = relacionCaloriasRendimiento(historial, { '2026-09-01': 2000 });
  assert.equal(pocos.suficiente, false);
  assert.match(pocos.mensaje, /al menos 4 días/);
});

test('con datos suficientes se informa la correlación sin afirmar causa', () => {
  const kcal = { '2026-09-01': 1800, '2026-09-08': 2000, '2026-09-15': 2200, '2026-09-22': 2400 };
  const r = relacionCaloriasRendimiento(historial, kcal);
  assert.equal(r.suficiente, true);
  assert.equal(r.puntos.length, 4);
  assert.ok(typeof r.r === 'number');
  assert.match(r.mensaje, /no demuestra causa|no se ve relación/);
});

test('el volumen por semana agrupa los músculos trabajados', () => {
  const v = volumenPorSemanaYMusculo(historial);
  assert.equal(v.length, 4);
  assert.ok(v[0].musculos.cuadriceps >= 1);
  assert.ok(!('cardio' in v[0].musculos));
  assert.ok(v[0].tonelaje > 0);
});

test('los titulares no se caen con el historial vacío', () => {
  const t = titularesAnalitica([], {}, [], {});
  assert.equal(t.length, 1);
  assert.match(t[0].texto, /historial suficiente/);
});

test('los titulares destacan el mayor avance', () => {
  const t = titularesAnalitica(historial, {}, [
    { fecha: '2026-09-01', peso: 82 }, { fecha: '2026-09-08', peso: 81 }, { fecha: '2026-09-15', peso: 80 },
  ], {});
  assert.ok(t.some((x) => /mayor avance/.test(x.texto)));
  assert.ok(t.every((x) => typeof x.texto === 'string' && x.texto.length > 10));
});
