import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  minutosDeHora, minutosDeFecha, pendientesDeAvisar, textoRecordatorio,
  marcarAvisado, limpiarAvisados, estadoPermiso,
} from '../js/nucleo/recordatorios.js';

const habitos = [
  { id: 'h1', nombre: 'Beber agua', hora: '07:00', meta: 1, activo: true },
  { id: 'h2', nombre: 'Caminar', hora: '13:00', meta: 8000, unidad: 'pasos', activo: true },
  { id: 'h3', nombre: 'Leer', hora: '22:00', meta: 10, unidad: 'páginas', activo: true },
  { id: 'h4', nombre: 'Pausado', hora: '09:00', meta: 1, activo: false },
];

const enHora = (h, m = 0) => new Date(2026, 8, 29, h, m);

test('interpreta las horas en formato HH:MM', () => {
  assert.equal(minutosDeHora('07:00'), 420);
  assert.equal(minutosDeHora('13:30'), 810);
  assert.equal(minutosDeHora('00:00'), 0);
  assert.equal(minutosDeHora('23:59'), 1439);
});

test('rechaza horas imposibles o mal escritas', () => {
  assert.equal(minutosDeHora('25:00'), null);
  assert.equal(minutosDeHora('12:70'), null);
  assert.equal(minutosDeHora('mediodía'), null);
  assert.equal(minutosDeHora(''), null);
  assert.equal(minutosDeHora(null), null);
});

test('minutosDeFecha usa la hora local', () => {
  assert.equal(minutosDeFecha(enHora(13, 45)), 825);
});

test('avisa del hábito cuya hora acaba de pasar', () => {
  const r = pendientesDeAvisar({ habitos, ahora: enHora(13, 10) });
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'h2');
});

test('no avisa antes de la hora', () => {
  assert.equal(pendientesDeAvisar({ habitos, ahora: enHora(12, 50) }).length, 0);
});

test('no avisa cuando ya pasó la ventana: ese día ya se perdió', () => {
  assert.equal(pendientesDeAvisar({ habitos, ahora: enHora(14, 30) }).length, 0);
});

test('la ventana de tolerancia es configurable', () => {
  assert.equal(pendientesDeAvisar({ habitos, ahora: enHora(14, 30), ventanaMin: 120 }).length, 1);
});

test('no molesta con un hábito ya cumplido', () => {
  const registros = { '2026-09-29': { h2: 8200 } };
  assert.equal(pendientesDeAvisar({ habitos, registros, ahora: enHora(13, 10) }).length, 0);
});

test('un hábito a medias sí se recuerda', () => {
  const registros = { '2026-09-29': { h2: 3000 } };
  const r = pendientesDeAvisar({ habitos, registros, ahora: enHora(13, 10) });
  assert.equal(r.length, 1);
});

test('los hábitos en pausa no avisan', () => {
  assert.equal(pendientesDeAvisar({ habitos, ahora: enHora(9, 5) }).length, 0);
});

test('no repite el aviso el mismo día', () => {
  const avisados = marcarAvisado({}, 'h2', '2026-09-29');
  assert.equal(pendientesDeAvisar({ habitos, avisados, ahora: enHora(13, 10) }).length, 0);
});

test('un aviso de ayer no bloquea el de hoy', () => {
  const avisados = marcarAvisado({}, 'h2', '2026-09-28');
  assert.equal(pendientesDeAvisar({ habitos, avisados, ahora: enHora(13, 10) }).length, 1);
});

test('el texto del aviso dice qué tocaba y no regaña', () => {
  const t = textoRecordatorio(habitos[1]);
  assert.equal(t.titulo, 'Caminar');
  assert.match(t.cuerpo, /13:00/);
  assert.match(t.cuerpo, /8000 pasos/);
  assert.match(t.cuerpo, /a tiempo/);
  assert.doesNotMatch(t.cuerpo, /fallaste|no cumpliste|perdiste/i);
});

test('un hábito de visto bueno no inventa una meta numérica', () => {
  assert.doesNotMatch(textoRecordatorio(habitos[0]).cuerpo, /meta/);
});

test('limpiar deja solo las marcas de hoy', () => {
  let avisados = marcarAvisado({}, 'h1', '2026-09-27');
  avisados = marcarAvisado(avisados, 'h2', '2026-09-28');
  avisados = marcarAvisado(avisados, 'h3', '2026-09-29');
  const limpio = limpiarAvisados(avisados, '2026-09-29');
  assert.deepEqual(Object.keys(limpio), ['h3|2026-09-29']);
});

test('fuera del navegador se informa que no hay soporte', () => {
  const e = estadoPermiso();
  assert.equal(e.soportado, false);
  assert.equal(e.estado, 'no_soportado');
});

test('varios hábitos pendientes en la misma ventana se devuelven todos', () => {
  const juntos = [
    { id: 'a', nombre: 'A', hora: '08:00', meta: 1, activo: true },
    { id: 'b', nombre: 'B', hora: '08:15', meta: 1, activo: true },
  ];
  assert.equal(pendientesDeAvisar({ habitos: juntos, ahora: enHora(8, 20) }).length, 2);
});
