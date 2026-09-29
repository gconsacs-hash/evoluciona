import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  UNIDADES, convertir, RANGOS, UMBRALES, MOMENTOS, TIPOS_INSULINA,
  clasificar, indicadores, evaluarMetas, patronesPorMomento, hallazgos,
  queHacer, efectoDeLasComidas, insulinaDelDia, seriePorDia, ultimosDias,
  perfilInicial, METAS,
} from '../js/nucleo/diabetes.js';

const reg = (valor, momento, fecha = '2026-09-29') => ({ valor, momento, fecha });

// --- Unidades ---

test('convierte mg/dL a mmol/L', () => {
  assert.equal(convertir(180, 'mmol/L'), 10);
  assert.equal(convertir(70, 'mmol/L'), 3.9);
  assert.equal(convertir(100, 'mg/dL'), 100);
});

test('una unidad desconocida no rompe nada', () => {
  assert.equal(convertir(120, 'inventada'), 120);
});

// --- Clasificación ---

test('clasifica según los umbrales de seguridad', () => {
  assert.equal(clasificar(50).clave, 'hipo_grave');
  assert.equal(clasificar(65).clave, 'hipo');
  assert.equal(clasificar(120).clave, 'en_rango');
  assert.equal(clasificar(200).clave, 'alto');
  assert.equal(clasificar(300).clave, 'muy_alto');
});

test('los límites exactos caen del lado correcto', () => {
  assert.equal(clasificar(54).clave, 'hipo', '54 ya no es grave');
  assert.equal(clasificar(53.9).clave, 'hipo_grave');
  assert.equal(clasificar(70).clave, 'en_rango', '70 es el piso del rango');
  assert.equal(clasificar(69.9).clave, 'hipo');
  assert.equal(clasificar(180).clave, 'en_rango', '180 es el techo del rango');
  assert.equal(clasificar(180.1).clave, 'alto');
  assert.equal(clasificar(250).clave, 'alto');
  assert.equal(clasificar(250.1).clave, 'muy_alto');
});

test('las hipoglicemias se marcan como urgentes', () => {
  assert.equal(clasificar(60).urgente, true);
  assert.equal(clasificar(300).urgente, false, 'una alta no es urgencia inmediata');
});

test('el rango de embarazo es más estricto', () => {
  assert.equal(clasificar(160, RANGOS.gestacional).clave, 'alto');
  assert.equal(clasificar(160, RANGOS.estandar).clave, 'en_rango');
  assert.equal(clasificar(65, RANGOS.gestacional).clave, 'hipo');
});

// --- Indicadores ---

test('sin mediciones no se inventan indicadores', () => {
  const i = indicadores([]);
  assert.equal(i.n, 0);
  assert.equal(i.suficiente, false);
});

test('calcula promedio, desviación y variabilidad', () => {
  const i = indicadores([reg(100), reg(120), reg(140), reg(160)]);
  assert.equal(i.n, 4);
  assert.equal(i.media, 130);
  // Desviación real: raíz de 2000/4 = 22,36. El CV se calcula con ese valor
  // completo, no con el redondeado que se muestra en pantalla.
  assert.equal(i.desviacion, 22);
  assert.equal(i.cv, 17.2);
});

test('el tiempo en rango cuenta los que están dentro', () => {
  const i = indicadores([reg(60), reg(100), reg(150), reg(200)]);
  assert.equal(i.tiempoEnRango, 50);
  assert.equal(i.tiempoHipo, 25);
  assert.equal(i.tiempoAlto, 25);
});

test('separa hipoglicemia de hipoglicemia grave', () => {
  const i = indicadores([reg(50), reg(65), reg(120), reg(120)]);
  assert.equal(i.hipoglicemias, 2);
  assert.equal(i.hipoglicemiasGraves, 1);
  assert.equal(i.tiempoHipoGrave, 25);
});

test('el GMI sale de la fórmula de consenso', () => {
  // GMI = 3.31 + 0.02392 x media
  const i = indicadores([reg(154)]);
  assert.equal(i.gmi, Math.round((3.31 + 0.02392 * 154) * 10) / 10);
  assert.ok(i.gmi > 6.9 && i.gmi < 7.1, 'una media de 154 equivale a ~7% de HbA1c');
});

test('con pocas mediciones se declara insuficiente', () => {
  assert.equal(indicadores([reg(100), reg(110)]).suficiente, false);
  const muchas = Array.from({ length: 14 }, () => reg(120));
  assert.equal(indicadores(muchas).suficiente, true);
});

test('los valores inválidos se descartan sin romper el cálculo', () => {
  const i = indicadores([reg(100), reg(0), reg(NaN), reg(null), reg(140)]);
  assert.equal(i.n, 2);
  assert.equal(i.media, 120);
});

// --- Metas ---

test('las metas se contrastan con los indicadores', () => {
  const buenos = indicadores(Array.from({ length: 20 }, () => reg(120)));
  const metas = evaluarMetas(buenos);
  assert.equal(metas.length, METAS.length);
  assert.ok(metas.find((m) => m.clave === 'tiempoEnRango').cumple);
  assert.ok(metas.find((m) => m.clave === 'tiempoHipo').cumple);
});

test('un control malo no cumple las metas', () => {
  const malos = indicadores([...Array(5).fill(reg(60)), ...Array(5).fill(reg(300))]);
  const metas = evaluarMetas(malos);
  assert.equal(metas.find((m) => m.clave === 'tiempoEnRango').cumple, false);
  assert.equal(metas.find((m) => m.clave === 'tiempoHipo').cumple, false);
});

test('sin datos no hay metas que evaluar', () => {
  assert.deepEqual(evaluarMetas(indicadores([])), []);
});

// --- Patrones ---

test('agrupa por momento del día y ordena cronológicamente', () => {
  const registros = [
    reg(70, 'madrugada'), reg(65, 'madrugada'), reg(60, 'madrugada'),
    reg(120, 'ayunas'), reg(130, 'ayunas'), reg(125, 'ayunas'),
  ];
  const p = patronesPorMomento(registros);
  assert.equal(p.length, 2);
  assert.equal(p[0].momento, 'ayunas', 'ayunas va antes que madrugada');
  const madrugada = p.find((x) => x.momento === 'madrugada');
  assert.equal(madrugada.n, 3);
  assert.equal(madrugada.hipos, 2);
});

test('un momento con pocas mediciones no genera patrón', () => {
  assert.equal(patronesPorMomento([reg(100, 'ayunas'), reg(110, 'ayunas')]).length, 0);
});

test('los registros sin momento se ignoran en el patrón', () => {
  assert.equal(patronesPorMomento([reg(100), reg(110), reg(120)]).length, 0);
});

// --- Hallazgos ---

test('sin registros invita a empezar', () => {
  const h = hallazgos([]);
  assert.equal(h.length, 1);
  assert.match(h[0].texto, /Aún no hay mediciones/);
});

test('una hipoglicemia grave se informa como algo que avisar al médico', () => {
  const h = hallazgos([reg(45), reg(120), reg(130)]);
  assert.ok(h.some((x) => x.tono === 'mal' && /grave/.test(x.texto)));
  assert.ok(h.some((x) => /control/.test(x.texto)));
});

test('detecta hipoglicemias repetidas a la misma hora', () => {
  const h = hallazgos([
    reg(60, 'madrugada'), reg(62, 'madrugada'), reg(58, 'madrugada'), reg(130, 'madrugada'),
    ...Array(12).fill(reg(120, 'ayunas')),
  ]);
  assert.ok(h.some((x) => /Madrugada/.test(x.texto) && /ajuste/.test(x.texto)));
});

test('reconoce un buen tiempo en rango', () => {
  const h = hallazgos(Array.from({ length: 20 }, () => reg(120, 'ayunas')));
  assert.ok(h.some((x) => x.tono === 'bien' && /Tiempo en rango/.test(x.texto)));
});

test('advierte de la variabilidad alta', () => {
  const registros = [];
  for (let i = 0; i < 10; i++) { registros.push(reg(70, 'ayunas')); registros.push(reg(230, 'ayunas')); }
  const h = hallazgos(registros);
  assert.ok(h.some((x) => /variabilidad/i.test(x.texto)));
});

test('en tipo 1 advierte sobre cetoacidosis con glicemias muy altas', () => {
  const registros = [...Array(14).fill(reg(300, 'ayunas')), ...Array(6).fill(reg(120, 'ayunas'))];
  const h = hallazgos(registros, RANGOS.estandar, { tipo: 'tipo1' });
  assert.ok(h.some((x) => /cetoacidosis/.test(x.texto)));
});

test('ningún hallazgo sugiere cambiar el tratamiento por cuenta propia', () => {
  const registros = [reg(45), reg(60, 'madrugada'), reg(62, 'madrugada'), reg(58, 'madrugada'), reg(300)];
  for (const h of hallazgos(registros, RANGOS.estandar, { tipo: 'tipo1' })) {
    assert.doesNotMatch(h.texto, /sube la dosis|baja la dosis|aum(enta|éntate)|inyéctate|ponte \d+ unidades/i,
      'no debe indicar cambios de dosis: ' + h.texto);
  }
});

// --- Qué hacer ---

test('ante hipoglicemia da la regla 15/15 y dice no inyectarse', () => {
  const q = queHacer(60);
  assert.equal(q.urgente, true);
  assert.match(q.texto, /15/);
  assert.match(q.texto, /no te inyectes/i);
});

test('ante hipoglicemia grave menciona la urgencia', () => {
  const q = queHacer(45);
  assert.match(q.texto, /131|urgencia/i);
});

test('ante glicemia alta en tipo 1 menciona los signos de alarma', () => {
  const q = queHacer(300, { tipo: 'tipo1' });
  assert.match(q.texto, /cetoacidosis/);
});

test('una glicemia normal no genera instrucción', () => {
  assert.equal(queHacer(120), null);
});

test('queHacer nunca entrega una dosis', () => {
  for (const v of [40, 55, 65, 120, 200, 400]) {
    const q = queHacer(v, { tipo: 'tipo1' });
    if (q) assert.doesNotMatch(q.texto, /\d+\s*unidades/i, 'no debe nombrar unidades de insulina');
  }
});

// --- Insulina ---

test('suma la insulina del día separada por tipo', () => {
  const dosis = [
    { fecha: '2026-09-29', tipo: 'basal', unidades: 20, hora: '22:00' },
    { fecha: '2026-09-29', tipo: 'bolo', unidades: 6, hora: '13:00' },
    { fecha: '2026-09-29', tipo: 'bolo', unidades: 4, hora: '08:00' },
    { fecha: '2026-09-28', tipo: 'basal', unidades: 20, hora: '22:00' },
  ];
  const d = insulinaDelDia(dosis, '2026-09-29');
  assert.equal(d.total, 30);
  assert.equal(d.porTipo.basal, 20);
  assert.equal(d.porTipo.bolo, 10);
  assert.equal(d.porTipo.correccion, 0);
  assert.equal(d.registros[0].hora, '08:00', 'ordenadas por hora');
});

test('un día sin dosis no rompe la suma', () => {
  const d = insulinaDelDia([], '2026-09-29');
  assert.equal(d.total, 0);
  assert.equal(d.registros.length, 0);
});

test('el módulo no expone ninguna función que calcule dosis', () => {
  const exportado = Object.keys({
    UNIDADES, convertir, RANGOS, UMBRALES, MOMENTOS, TIPOS_INSULINA, clasificar,
    indicadores, evaluarMetas, patronesPorMomento, hallazgos, queHacer,
    efectoDeLasComidas, insulinaDelDia, seriePorDia, ultimosDias, perfilInicial, METAS,
  });
  const sospechosas = exportado.filter((n) => /calcularDosis|sugerirDosis|bolo\w*Calc|corregir/i.test(n));
  assert.deepEqual(sospechosas, []);
});

// --- Series y filtros ---

test('la serie diaria promedia cada día', () => {
  const registros = [
    reg(100, 'ayunas', '2026-09-28'), reg(140, 'antes_cena', '2026-09-28'),
    reg(110, 'ayunas', '2026-09-29'),
  ];
  const s = seriePorDia(registros, 30, '2026-09-29');
  assert.equal(s.length, 2);
  assert.equal(s[0].fecha, '2026-09-28');
  assert.equal(s[0].media, 120);
  assert.equal(s[0].minimo, 100);
  assert.equal(s[1].media, 110);
});

test('ultimosDias recorta el período', () => {
  const registros = [
    reg(100, 'ayunas', '2026-09-29'),
    reg(100, 'ayunas', '2026-09-20'),
    reg(100, 'ayunas', '2026-08-01'),
  ];
  assert.equal(ultimosDias(registros, 14, '2026-09-29').length, 2);
  assert.equal(ultimosDias(registros, 7, '2026-09-29').length, 1);
});

test('el efecto de las comidas cruza carbohidratos con la glicemia posterior', () => {
  const registros = [
    reg(190, 'despues_almuerzo', '2026-09-29'),
    reg(120, 'ayunas', '2026-09-29'),
  ];
  const comidas = { '2026-09-29': [{ momento: 'Almuerzo', carbos: 80 }] };
  const puntos = efectoDeLasComidas(registros, comidas, (lista) => lista[0].carbos);
  assert.equal(puntos.length, 1);
  assert.equal(puntos[0].carbos, 80);
  assert.equal(puntos[0].valor, 190);
});

// --- Perfil ---

test('el perfil inicial viene apagado y sin insulina', () => {
  const p = perfilInicial();
  assert.equal(p.activo, false);
  assert.equal(p.usaInsulina, false);
  assert.equal(p.unidad, 'mg/dL');
  assert.deepEqual(p.rango, RANGOS.estandar);
});

test('el esquema del médico se guarda como texto, no como parámetros de cálculo', () => {
  const p = perfilInicial();
  for (const valor of Object.values(p.esquema)) assert.equal(typeof valor, 'string');
});
