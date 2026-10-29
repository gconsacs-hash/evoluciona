import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PROGRAMAS } from '../js/datos/programas.js';
import { MAPA_EJERCICIOS, ORDEN_EQUIPO, EJERCICIOS } from '../js/datos/ejercicios.js';
import { programasParaPerfil, semanaDelPrograma, sesionesDelPrograma, programaActivo } from '../js/nucleo/programas.js';
import { generarPlanSemanal, volumenSemanal, siguienteCarga } from '../js/nucleo/entrenamiento.js';

const entradasDe = (p) => (p.etapas ? p.etapas.flatMap((e) => e.sesiones) : p.sesiones).flatMap((s) => s.ejercicios);

test('hay al menos diez programas con id único', () => {
  assert.ok(PROGRAMAS.length >= 10);
  assert.equal(new Set(PROGRAMAS.map((p) => p.id)).size, PROGRAMAS.length);
});

test('cada ejercicio de un programa existe y no supera el nivel ni el equipo del programa', () => {
  for (const p of PROGRAMAS) {
    for (const e of entradasDe(p)) {
      const info = MAPA_EJERCICIOS.get(e.id);
      assert.ok(info, `${p.id}: el ejercicio ${e.id} no existe`);
      assert.ok(info.tier <= p.tier, `${p.id}: ${e.id} es nivel ${info.tier} y el programa es nivel ${p.tier}`);
      assert.ok(ORDEN_EQUIPO[info.equipo] <= ORDEN_EQUIPO[p.equipo], `${p.id}: ${e.id} necesita ${info.equipo}`);
      assert.ok(e.series >= 1 && e.min > 0 && e.max >= e.min, `${p.id}: ${e.id} con rango inválido`);
    }
  }
});

test('las unidades coinciden con el tipo de ejercicio', () => {
  for (const p of PROGRAMAS) {
    for (const e of entradasDe(p)) {
      const info = MAPA_EJERCICIOS.get(e.id);
      if (e.unidad === 'seg' || e.unidad === 'min') assert.ok(info.tiempo, `${p.id}: ${e.id} se pide por tiempo pero no es de tiempo`);
    }
  }
});

test('cada semana de cada programa tiene tantas sesiones como días y ninguna vacía', () => {
  for (const p of PROGRAMAS) {
    for (const semana of [1, 2, 3, p.semanas, p.semanas + 3]) {
      const sesiones = sesionesDelPrograma(p, semana);
      assert.equal(sesiones.length, p.dias, `${p.id} semana ${semana}`);
      for (const s of sesiones) {
        assert.ok(s.ejercicios.length >= 4, `${p.id}: "${s.nombre}" tiene ${s.ejercicios.length} ejercicios`);
        assert.ok(s.duracionEstimadaMin > 10 && s.duracionEstimadaMin < 120, `${p.id}: "${s.nombre}" dura ${s.duracionEstimadaMin} min`);
      }
    }
  }
});

test('el 5×5 alterna A y B de una semana a la otra', () => {
  const p = PROGRAMAS.find((x) => x.id === 'fuerza_5x5');
  assert.deepEqual(sesionesDelPrograma(p, 1).map((s) => s.nombre), ['Entreno A', 'Entreno B', 'Entreno A']);
  assert.deepEqual(sesionesDelPrograma(p, 2).map((s) => s.nombre), ['Entreno B', 'Entreno A', 'Entreno B']);
});

test('de cero a 5 km avanza por etapas y la última es trote continuo', () => {
  const p = PROGRAMAS.find((x) => x.id === 'cero_a_5k');
  const intervalos = (semana) => sesionesDelPrograma(p, semana)[0].ejercicios.find((e) => e.ejercicioId === 'intervalos_trote');
  assert.match(intervalos(1).objetivoTexto, /1 min trotando/);
  assert.match(intervalos(8).objetivoTexto, /30 minutos/);
  assert.equal(intervalos(8).unidad, 'min');
  assert.match(intervalos(12).objetivoTexto, /30 minutos/, 'pasado el final se mantiene la última etapa');
});

test('la semana del programa se cuenta desde la semana de inicio', () => {
  assert.equal(semanaDelPrograma('2026-10-26', '2026-10-29'), 1);
  assert.equal(semanaDelPrograma('2026-10-26', '2026-11-02'), 2);
  assert.equal(semanaDelPrograma('2026-10-29', '2026-12-28'), 10);
  assert.equal(semanaDelPrograma('2026-10-29', '2026-10-01'), 1, 'una fecha anterior no da semanas negativas');
});

test('la disponibilidad respeta equipo y nivel, y explica el motivo', () => {
  const casa = programasParaPerfil({ equipo: 'ninguno', tierMax: 1, objetivo: 'perder', dias: 3 });
  const gym = casa.find((p) => p.id === 'fuerza_5x5');
  assert.equal(gym.disponible, false);
  assert.match(gym.motivo, /gimnasio/i);
  const calistenia = casa.find((p) => p.id === 'calistenia');
  assert.equal(calistenia.disponible, false);
  assert.match(calistenia.motivo, /nivel de contenido 2/);
  assert.ok(casa.some((p) => p.disponible), 'un principiante en casa siempre tiene algún programa');
  assert.ok(casa[0].recomendado, 'los recomendados van primero');
});

test('programaActivo devuelve null sin programa y marca el término', () => {
  assert.equal(programaActivo(null, '2026-10-29'), null);
  assert.equal(programaActivo({ id: 'no_existe', inicio: '2026-10-29' }, '2026-10-29'), null);
  const a = programaActivo({ id: 'inicio_casa', inicio: '2026-09-01' }, '2026-10-29');
  assert.equal(a.terminado, true);
  assert.equal(a.sesiones.length, 3);
});

test('los ejercicios de movilidad no entran al plan automático ni al volumen muscular', () => {
  for (const equipo of ['ninguno', 'gimnasio']) {
    const plan = generarPlanSemanal({ dias: 3, equipo, tierMax: 1, objetivo: 'salud', semilla: 'mov' });
    for (const s of plan) assert.ok(s.ejercicios.every((e) => e.patron !== 'movilidad'));
  }
  const vol = volumenSemanal([{ ejercicios: [{ ejercicioId: 'gato_camello', series: [{ reps: 10 }] }] }]);
  assert.equal(vol.length, 0);
});

test('los ejercicios por tiempo del plan automático guardan el rango en segundos', () => {
  const plan = generarPlanSemanal({ dias: 2, equipo: 'ninguno', tierMax: 1, objetivo: 'salud', semilla: 'tiempo' });
  const tiempo = plan.flatMap((s) => s.ejercicios).filter((e) => e.esTiempo);
  for (const e of tiempo) {
    assert.ok(e.objetivoTexto.includes(`${e.repMin}-${e.repMax} seg`), `${e.nombre}: ${e.objetivoTexto} vs ${e.repMin}-${e.repMax}`);
  }
});

test('la progresión de un ejercicio por minutos habla de minutos', () => {
  const r = siguienteCarga({ repMin: 20, repMax: 30, esTiempo: true, unidad: 'min' }, [{ peso: 0, reps: 30 }]);
  assert.equal(r.accion, 'subir_reps');
  assert.match(r.mensaje, /32 minutos/);
});

test('el catálogo de ejercicios creció y cubre movilidad y máquinas', () => {
  assert.ok(EJERCICIOS.length >= 130, `solo ${EJERCICIOS.length} ejercicios`);
  assert.ok(EJERCICIOS.filter((e) => e.patron === 'movilidad').length >= 6);
  assert.ok(EJERCICIOS.filter((e) => e.equipo === 'gimnasio').length >= 30);
});
