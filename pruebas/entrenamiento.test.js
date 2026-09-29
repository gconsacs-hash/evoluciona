import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TIERS, tierDesbloqueado, estadoTiers, ejerciciosDisponibles, generarPlanSemanal,
  estimar1RM, tonelaje, siguienteCarga, calcularRecords, detectarPR, volumenSemanal,
  resumenEntrenamiento, rachaSemanal,
} from '../js/nucleo/entrenamiento.js';
import { EJERCICIOS, MAPA_EJERCICIOS, ORDEN_EQUIPO } from '../js/datos/ejercicios.js';

test('el nivel 1 está disponible desde el principio', () => {
  assert.equal(tierDesbloqueado(1, 0), 1);
});

test('los niveles se abren con nivel de avatar y sesiones', () => {
  assert.equal(tierDesbloqueado(3, 6), 2);
  assert.equal(tierDesbloqueado(3, 5), 1, 'faltan sesiones');
  assert.equal(tierDesbloqueado(2, 40), 1, 'falta nivel');
  assert.equal(tierDesbloqueado(7, 20), 3);
  assert.equal(tierDesbloqueado(18, 80), 5);
});

test('un nivel comprado en la tienda se abre aunque falte nivel', () => {
  assert.equal(tierDesbloqueado(1, 0, [4]), 4);
});

test('estadoTiers informa cuánto falta para cada nivel', () => {
  const estado = estadoTiers(3, 6);
  const fuerza = estado.find((t) => t.tier === 3);
  assert.equal(fuerza.desbloqueado, false);
  assert.equal(fuerza.faltaNivel, 4);
  assert.equal(fuerza.faltaSesiones, 14);
});

test('sin equipo solo aparecen ejercicios sin equipo', () => {
  for (const e of ejerciciosDisponibles(5, 'ninguno')) {
    assert.equal(e.equipo, 'ninguno', `${e.id} requiere ${e.equipo}`);
  }
});

test('el gimnasio incluye los ejercicios de casa y de mancuernas', () => {
  const gym = ejerciciosDisponibles(5, 'gimnasio');
  const casa = ejerciciosDisponibles(5, 'ninguno');
  for (const e of casa) assert.ok(gym.some((g) => g.id === e.id), `${e.id} debería estar en gimnasio`);
  assert.ok(gym.length > casa.length);
});

test('un nivel bajo no incluye ejercicios avanzados', () => {
  for (const e of ejerciciosDisponibles(2, 'gimnasio')) assert.ok(e.tier <= 2);
});

test('el plan semanal respeta los días pedidos', () => {
  for (const dias of [2, 3, 4, 5, 6]) {
    const plan = generarPlanSemanal({ dias, equipo: 'gimnasio', tierMax: 3, objetivo: 'recomponer', semilla: '2026-09-28' });
    assert.equal(plan.length, dias);
    for (const sesion of plan) assert.ok(sesion.ejercicios.length >= 4, `${sesion.nombre} tiene muy pocos ejercicios`);
  }
});

test('ninguna combinación de nivel, equipo y días deja sesiones cortas', () => {
  for (const tierMax of [1, 2, 3, 4, 5]) {
    for (const equipo of ['ninguno', 'mancuernas', 'gimnasio']) {
      for (const dias of [2, 3, 4, 5, 6]) {
        const plan = generarPlanSemanal({ dias, equipo, tierMax, objetivo: 'perder', semilla: 'cobertura' });
        for (const sesion of plan) {
          assert.ok(sesion.ejercicios.length >= 4,
            `nivel ${tierMax}, ${equipo}, ${dias} días: "${sesion.nombre}" quedó con ${sesion.ejercicios.length} ejercicios`);
        }
      }
    }
  }
});

test('una sesión no repite el mismo ejercicio dos veces', () => {
  for (const tierMax of [1, 3, 5]) {
    for (const equipo of ['ninguno', 'gimnasio']) {
      const plan = generarPlanSemanal({ dias: 5, equipo, tierMax, objetivo: 'ganar', semilla: 'repes' });
      for (const sesion of plan) {
        const ids = sesion.ejercicios.map((e) => e.ejercicioId);
        assert.equal(new Set(ids).size, ids.length, `"${sesion.nombre}" repite ejercicios`);
      }
    }
  }
});

test('el plan es determinista para la misma semana y configuración', () => {
  const cfg = { dias: 4, equipo: 'mancuernas', tierMax: 3, objetivo: 'perder', semilla: '2026-09-28|0' };
  const a = generarPlanSemanal(cfg);
  const b = generarPlanSemanal(cfg);
  assert.deepEqual(a, b);
});

test('cambiar la semilla cambia la selección de ejercicios', () => {
  const base = { dias: 4, equipo: 'gimnasio', tierMax: 4, objetivo: 'ganar' };
  const a = generarPlanSemanal({ ...base, semilla: 'a' });
  const b = generarPlanSemanal({ ...base, semilla: 'b' });
  const idsA = a.flatMap((s) => s.ejercicios.map((e) => e.ejercicioId)).join();
  const idsB = b.flatMap((s) => s.ejercicios.map((e) => e.ejercicioId)).join();
  assert.notEqual(idsA, idsB);
});

test('el plan solo usa ejercicios permitidos por equipo y nivel', () => {
  const plan = generarPlanSemanal({ dias: 3, equipo: 'ninguno', tierMax: 2, objetivo: 'salud', semilla: 'x' });
  for (const sesion of plan) {
    for (const ej of sesion.ejercicios) {
      const info = MAPA_EJERCICIOS.get(ej.ejercicioId);
      assert.ok(info, `${ej.ejercicioId} no existe`);
      assert.ok(info.tier <= 2);
      assert.equal(ORDEN_EQUIPO[info.equipo], 0);
    }
  }
});

test('la prescripción de cardio usa una sola serie', () => {
  const plan = generarPlanSemanal({ dias: 3, equipo: 'ninguno', tierMax: 3, objetivo: 'perder', semilla: 'cardio' });
  const cardio = plan.flatMap((s) => s.ejercicios).filter((e) => e.patron === 'metcon');
  for (const c of cardio) assert.equal(c.series, 1);
});

test('1RM estimado con Epley', () => {
  assert.equal(estimar1RM(100, 1), 100);
  assert.equal(estimar1RM(100, 10), 133.3);
  assert.equal(estimar1RM(0, 10), 0);
  assert.equal(estimar1RM(80, 5), 93.3);
});

test('tonelaje multiplica peso por repeticiones', () => {
  assert.equal(tonelaje([{ peso: 50, reps: 10 }, { peso: 60, reps: 8 }]), 980);
  assert.equal(tonelaje([{ peso: 0, reps: 15 }]), 0);
});

test('la doble progresión sube la carga al completar el rango', () => {
  const prescripcion = { repMin: 8, repMax: 12, esCorporal: false };
  const r = siguienteCarga(prescripcion, [{ peso: 50, reps: 12 }, { peso: 50, reps: 12 }, { peso: 50, reps: 12 }]);
  assert.equal(r.accion, 'subir');
  assert.equal(r.pesoSugerido, 55); // sobre 40 kg el salto es de 5 kg
});

test('el incremento es de 2.5 kg en cargas livianas', () => {
  const r = siguienteCarga({ repMin: 8, repMax: 12, esCorporal: false }, [{ peso: 20, reps: 12 }]);
  assert.equal(r.pesoSugerido, 22.5);
});

test('en peso corporal la progresión es por repeticiones', () => {
  const r = siguienteCarga({ repMin: 8, repMax: 12, esCorporal: true }, [{ peso: 0, reps: 12 }, { peso: 0, reps: 12 }]);
  assert.equal(r.accion, 'subir_reps');
});

test('si la mitad de las series falla, se baja la carga', () => {
  const r = siguienteCarga({ repMin: 8, repMax: 12, esCorporal: false }, [{ peso: 100, reps: 5 }, { peso: 100, reps: 4 }]);
  assert.equal(r.accion, 'bajar');
  assert.equal(r.pesoSugerido, 90);
});

test('en el medio del rango se mantiene la carga', () => {
  const r = siguienteCarga({ repMin: 8, repMax: 12, esCorporal: false }, [{ peso: 60, reps: 10 }, { peso: 60, reps: 9 }]);
  assert.equal(r.accion, 'mantener');
});

test('sin historial se recomienda empezar con margen', () => {
  const r = siguienteCarga({ repMin: 8, repMax: 12 }, []);
  assert.equal(r.accion, 'mantener');
  assert.match(r.mensaje, /margen/);
});

const historial = [
  { id: 's1', fecha: '2026-09-01', semana: '2026-08-31', duracionMin: 50, ejercicios: [{ ejercicioId: 'press_banca', series: [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }] }] },
  { id: 's2', fecha: '2026-09-08', semana: '2026-09-07', duracionMin: 55, ejercicios: [{ ejercicioId: 'press_banca', series: [{ peso: 65, reps: 8 }] }, { ejercicioId: 'sentadilla_barra', series: [{ peso: 80, reps: 5 }] }] },
];

test('los récords toman la mejor serie de cada ejercicio', () => {
  const records = calcularRecords(historial);
  const press = records.find((r) => r.ejercicioId === 'press_banca');
  assert.equal(press.peso, 65);
  assert.equal(press.fecha, '2026-09-08');
  assert.equal(records.length, 2);
});

test('detectarPR reconoce solo las mejoras reales', () => {
  const nuevos = detectarPR(historial, {
    id: 's3', fecha: '2026-09-15',
    ejercicios: [
      { ejercicioId: 'press_banca', series: [{ peso: 70, reps: 8 }] },
      { ejercicioId: 'sentadilla_barra', series: [{ peso: 70, reps: 5 }] },
    ],
  });
  assert.equal(nuevos.length, 1);
  assert.equal(nuevos[0].ejercicioId, 'press_banca');
});

test('detectarPR entrega un solo récord por ejercicio', () => {
  const nuevos = detectarPR([], {
    id: 's1', fecha: '2026-09-15',
    ejercicios: [{ ejercicioId: 'press_banca', series: [{ peso: 50, reps: 8 }, { peso: 60, reps: 8 }, { peso: 55, reps: 8 }] }],
  });
  assert.equal(nuevos.length, 1);
  assert.equal(nuevos[0].rm, estimar1RM(60, 8));
});

test('el volumen semanal cuenta series por grupo muscular', () => {
  const volumen = volumenSemanal([historial[1]]);
  const pecho = volumen.find((v) => v.musculo === 'pecho');
  assert.equal(pecho.series, 1);
  assert.ok(volumen.every((v) => v.musculo !== 'cardio'));
  assert.equal(pecho.estado, 'bajo');
});

test('el volumen marca óptimo entre 10 y 20 series', () => {
  const sesiones = [{
    id: 'x', fecha: '2026-09-10', semana: '2026-09-07',
    ejercicios: [{ ejercicioId: 'press_banca', series: new Array(12).fill({ peso: 50, reps: 8 }) }],
  }];
  assert.equal(volumenSemanal(sesiones).find((v) => v.musculo === 'pecho').estado, 'optimo');
});

test('el resumen acumula sesiones, series y tonelaje', () => {
  const r = resumenEntrenamiento(historial);
  assert.equal(r.sesiones, 2);
  assert.equal(r.seriesTotales, 4);
  assert.equal(r.tonelajeTotal, 60 * 8 + 60 * 8 + 65 * 8 + 80 * 5);
  assert.equal(r.minutosTotales, 105);
  assert.equal(r.semanas.length, 2);
});

test('la racha semanal se corta en la primera semana incumplida', () => {
  const sesiones = [
    { semana: '2026-09-21', ejercicios: [] }, { semana: '2026-09-21', ejercicios: [] }, { semana: '2026-09-21', ejercicios: [] },
    { semana: '2026-09-14', ejercicios: [] },
  ];
  assert.equal(rachaSemanal(sesiones, 3, ['2026-09-21', '2026-09-14', '2026-09-07']), 1);
});

test('el catálogo de ejercicios está bien formado', () => {
  const ids = new Set();
  for (const e of EJERCICIOS) {
    assert.ok(!ids.has(e.id), `id duplicado: ${e.id}`);
    ids.add(e.id);
    assert.ok(e.nombre && e.patron && e.equipo && e.tipo);
    assert.ok(e.tier >= 1 && e.tier <= 5, `${e.id} con tier ${e.tier}`);
    assert.ok(Array.isArray(e.musculos) && e.musculos.length, `${e.id} sin músculos`);
    assert.ok(ORDEN_EQUIPO[e.equipo] !== undefined, `${e.id} con equipo desconocido`);
  }
});

test('cada nivel tiene al menos un ejercicio nuevo disponible', () => {
  for (const t of TIERS) {
    const delTier = EJERCICIOS.filter((e) => e.tier === t.tier);
    assert.ok(delTier.length >= 3, `el nivel ${t.tier} solo tiene ${delTier.length} ejercicios`);
  }
});
