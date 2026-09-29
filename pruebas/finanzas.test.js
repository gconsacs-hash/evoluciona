import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resumenMensual, desglosePorCategoria, evaluarPresupuesto, sugerirPresupuesto,
  fondoEmergencia, proyectarMeta, proyectarInteresCompuesto, consejosFinancieros,
  serieMensual, gastoMensualPromedio, puntajeFinanciero, CATEGORIAS_GASTO,
} from '../js/nucleo/finanzas.js';

const movimientos = [
  { id: 'm1', fecha: '2026-09-01', tipo: 'ingreso', categoria: 'sueldo', monto: 1000000, nota: 'sueldo' },
  { id: 'm2', fecha: '2026-09-02', tipo: 'gasto', categoria: 'vivienda', monto: 350000, nota: 'arriendo' },
  { id: 'm3', fecha: '2026-09-05', tipo: 'gasto', categoria: 'mercado', monto: 150000, nota: '' },
  { id: 'm4', fecha: '2026-09-10', tipo: 'gasto', categoria: 'comida_fuera', monto: 120000, nota: 'delivery' },
  { id: 'm5', fecha: '2026-09-15', tipo: 'ahorro', categoria: 'ahorro', monto: 100000, nota: '' },
  { id: 'm6', fecha: '2026-08-01', tipo: 'ingreso', categoria: 'sueldo', monto: 1000000, nota: '' },
  { id: 'm7', fecha: '2026-08-03', tipo: 'gasto', categoria: 'vivienda', monto: 350000, nota: '' },
];

test('el resumen mensual separa ingresos, gastos y ahorro', () => {
  const r = resumenMensual(movimientos, '2026-09');
  assert.equal(r.ingresos, 1000000);
  assert.equal(r.gastos, 620000);
  assert.equal(r.ahorroExplicito, 100000);
  assert.equal(r.balance, 1000000 - 620000 - 100000);
  assert.equal(r.ahorroReal, 100000 + 280000);
});

test('las necesidades y los gustos se agrupan por categoría', () => {
  const r = resumenMensual(movimientos, '2026-09');
  assert.equal(r.necesidades, 500000);
  assert.equal(r.gustos, 120000);
});

test('la tasa de ahorro es el ahorro real sobre el ingreso', () => {
  const r = resumenMensual(movimientos, '2026-09');
  assert.equal(r.tasaAhorro, 38);
});

test('un mes sin ingresos no rompe el cálculo', () => {
  const r = resumenMensual([{ id: 'x', fecha: '2026-07-01', tipo: 'gasto', categoria: 'mercado', monto: 50000 }], '2026-07');
  assert.equal(r.tasaAhorro, 0);
  assert.equal(r.regla.necesidadesPct, 0);
});

test('el desglose ordena de mayor a menor y calcula porcentajes', () => {
  const desglose = desglosePorCategoria(movimientos.filter((m) => m.fecha.startsWith('2026-09')));
  assert.equal(desglose[0].categoria, 'vivienda');
  assert.equal(desglose[0].pct, 56.5);
  assert.equal(desglose.reduce((a, c) => a + c.cantidad, 0), 3);
});

test('el presupuesto detecta categorías excedidas', () => {
  const r = resumenMensual(movimientos, '2026-09');
  const ev = evaluarPresupuesto(r, { vivienda: 300000, mercado: 200000 }, 30, 30);
  const vivienda = ev.filas.find((f) => f.categoria === 'vivienda');
  assert.equal(vivienda.estado, 'mal');
  assert.equal(vivienda.disponible, -50000);
  assert.equal(ev.filas.find((f) => f.categoria === 'mercado').estado, 'bien');
  assert.equal(ev.alertas.length, 1);
});

test('el presupuesto avisa cuando el gasto va muy adelantado en el mes', () => {
  const r = resumenMensual(movimientos, '2026-09');
  const ev = evaluarPresupuesto(r, { mercado: 200000 }, 5, 30); // mes al 17%, gastado 75%
  assert.equal(ev.filas[0].estado, 'aviso');
});

test('las categorías sin presupuesto no aparecen', () => {
  const r = resumenMensual(movimientos, '2026-09');
  const ev = evaluarPresupuesto(r, { vivienda: 400000 }, 15, 30);
  assert.equal(ev.filas.length, 1);
});

test('el presupuesto sugerido cubre todas las categorías y no pasa el ingreso', () => {
  const sugerido = sugerirPresupuesto(1000000);
  assert.equal(Object.keys(sugerido).length, CATEGORIAS_GASTO.length);
  const total = Object.values(sugerido).reduce((a, b) => a + b, 0);
  assert.ok(total <= 1000000, `el total sugerido es ${total}`);
  assert.ok(total >= 700000);
});

test('el fondo de emergencia clasifica los meses de colchón', () => {
  assert.equal(fondoEmergencia(3600000, 600000).estado, 'excelente');
  assert.equal(fondoEmergencia(1800000, 600000).estado, 'bien');
  assert.equal(fondoEmergencia(700000, 600000).estado, 'aviso');
  assert.equal(fondoEmergencia(100000, 600000).estado, 'mal');
  assert.equal(fondoEmergencia(100000, 0).estado, 'sin_datos');
});

test('el objetivo del fondo son seis meses de gastos', () => {
  assert.equal(fondoEmergencia(0, 500000).objetivoMonto, 3000000);
});

test('la proyección de meta calcula los meses que faltan', () => {
  const meta = proyectarMeta({ id: 'm', nombre: 'Viaje', montoObjetivo: 1000000, montoActual: 200000, aporteMensual: 100000 }, '2026-09-28');
  assert.equal(meta.mesesFaltantes, 8);
  assert.equal(meta.pct, 20);
  assert.equal(meta.cumplida, false);
});

test('una meta cumplida se marca como tal', () => {
  const meta = proyectarMeta({ id: 'm', nombre: 'Meta', montoObjetivo: 500000, montoActual: 500000, aporteMensual: 0 });
  assert.equal(meta.cumplida, true);
  assert.equal(meta.pct, 100);
});

test('sin aporte mensual la meta no proyecta fecha', () => {
  const meta = proyectarMeta({ id: 'm', nombre: 'Meta', montoObjetivo: 500000, montoActual: 0, aporteMensual: 0 });
  assert.equal(meta.mesesFaltantes, null);
  assert.match(meta.mensaje, /aporte mensual/);
});

test('con fecha límite se recalcula el aporte necesario', () => {
  const meta = proyectarMeta(
    { id: 'm', nombre: 'Meta', montoObjetivo: 1200000, montoActual: 0, aporteMensual: 50000, fechaLimite: '2026-12-28' },
    '2026-09-28',
  );
  assert.match(meta.mensaje, /necesitas/);
});

test('el interés compuesto supera la suma de los aportes', () => {
  const proy = proyectarInteresCompuesto({ inicial: 0, aporteMensual: 100000, tasaAnual: 0.05, meses: 60 });
  assert.equal(proy.aportadoTotal, 6000000);
  assert.ok(proy.saldoFinal > proy.aportadoTotal);
  assert.ok(proy.interesGanado > 0);
  assert.ok(proy.puntos.length >= 10);
});

test('con tasa cero el saldo es igual a lo aportado', () => {
  const proy = proyectarInteresCompuesto({ inicial: 100000, aporteMensual: 10000, tasaAnual: 0, meses: 12 });
  assert.equal(proy.saldoFinal, 220000);
  assert.equal(proy.interesGanado, 0);
});

test('los consejos detectan gasto mayor que ingreso', () => {
  const r = resumenMensual([
    { id: 'a', fecha: '2026-09-01', tipo: 'ingreso', categoria: 'sueldo', monto: 500000 },
    { id: 'b', fecha: '2026-09-02', tipo: 'gasto', categoria: 'vivienda', monto: 700000 },
  ], '2026-09');
  const consejos = consejosFinancieros(r, { alertas: [] }, []);
  assert.ok(consejos.some((c) => c.tono === 'mal'));
});

test('los consejos felicitan una tasa de ahorro alta', () => {
  const r = resumenMensual(movimientos, '2026-09');
  const consejos = consejosFinancieros(r, { alertas: [] }, []);
  assert.ok(consejos.some((c) => c.tono === 'bien'));
});

test('los consejos avisan del exceso en comida fuera', () => {
  const r = resumenMensual(movimientos, '2026-09');
  const consejos = consejosFinancieros(r, { alertas: [] }, []);
  assert.ok(consejos.some((c) => /Comida fuera/.test(c.texto)));
});

test('sin ingresos el consejo pide registrar el sueldo', () => {
  const r = resumenMensual([], '2026-09');
  const consejos = consejosFinancieros(r, { alertas: [] }, []);
  assert.equal(consejos.length, 1);
  assert.match(consejos[0].texto, /sueldo/);
});

test('la serie mensual ordena los meses y calcula cada uno', () => {
  const serie = serieMensual(movimientos);
  assert.deepEqual(serie.map((s) => s.mes), ['2026-08', '2026-09']);
  assert.equal(serie[0].gastos, 350000);
});

test('el gasto promedio excluye el mes en curso', () => {
  assert.equal(gastoMensualPromedio(movimientos, '2026-09'), 350000);
});

test('con un único mes registrado el promedio usa ese mes', () => {
  const soloUno = movimientos.filter((m) => m.fecha.startsWith('2026-09'));
  assert.equal(gastoMensualPromedio(soloUno, '2026-09'), 620000);
});

test('el puntaje financiero está entre 0 y 100', () => {
  assert.equal(puntajeFinanciero({ tasaAhorro: 0, mesesColchon: 0, cumplimientoPresupuesto: 0, registroDias: 0 }), 0);
  assert.equal(puntajeFinanciero({ tasaAhorro: 20, mesesColchon: 6, cumplimientoPresupuesto: 1, registroDias: 20 }), 100);
  const medio = puntajeFinanciero({ tasaAhorro: 10, mesesColchon: 3, cumplimientoPresupuesto: 0.5, registroDias: 10 });
  assert.ok(medio > 0 && medio < 100);
});

test('el puntaje no se pasa de 100 con valores extremos', () => {
  assert.equal(puntajeFinanciero({ tasaAhorro: 90, mesesColchon: 60, cumplimientoPresupuesto: 1, registroDias: 300 }), 100);
});
