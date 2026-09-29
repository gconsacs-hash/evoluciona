import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PEINADOS, BARBAS, FORMAS, LENTES, parametrosPorDefecto,
  aHex, aRgb, mezclar, brillo, desdeMuestras, dibujarRostro,
} from '../js/nucleo/rostro.js';
import { dibujarAvatar } from '../js/nucleo/avatar.js';

// --- Color ---

test('convierte entre hex y rgb sin perder el valor', () => {
  assert.equal(aHex({ r: 217, g: 161, b: 115 }), '#d9a173');
  assert.deepEqual(aRgb('#d9a173'), { r: 217, g: 161, b: 115 });
  assert.deepEqual(aRgb('d9a173'), { r: 217, g: 161, b: 115 });
});

test('acepta hex de tres dígitos', () => {
  assert.deepEqual(aRgb('#fff'), { r: 255, g: 255, b: 255 });
});

test('mezclar aclara y oscurece', () => {
  assert.equal(mezclar('#000000', 1), '#ffffff');
  assert.equal(mezclar('#ffffff', -1), '#000000');
  assert.ok(brillo(mezclar('#808080', 0.3)) > brillo('#808080'));
  assert.ok(brillo(mezclar('#808080', -0.3)) < brillo('#808080'));
});

test('los valores se mantienen dentro del rango válido', () => {
  const claro = mezclar('#f0f0f0', 0.9);
  for (const v of Object.values(aRgb(claro))) assert.ok(v >= 0 && v <= 255);
});

test('el brillo distingue claro de oscuro', () => {
  assert.ok(brillo('#ffffff') > 250);
  assert.ok(brillo('#000000') < 5);
});

// --- Deducción desde la foto ---

test('sin muestras devuelve algo dibujable', () => {
  const p = desdeMuestras({});
  assert.ok(p.piel && p.cabello);
  assert.ok(PEINADOS[p.peinado]);
  assert.equal(p.desdeFoto, true);
});

test('toma el tono de piel muestreado', () => {
  assert.equal(desdeMuestras({ piel: '#8d5a3b' }).piel, '#8d5a3b');
});

test('con poca superficie distinta sobre la frente, asume rapado', () => {
  const p = desdeMuestras({ piel: '#d9a173', cabello: '#d8a070', cubierto: 0.05 });
  assert.equal(p.peinado, 'rapado');
});

test('con pelo claramente distinto de la piel, lo conserva', () => {
  const p = desdeMuestras({ piel: '#d9a173', cabello: '#2c2118', cubierto: 0.8 });
  assert.equal(p.cabello, '#2c2118');
  assert.notEqual(p.peinado, 'rapado');
});

test('un mentón mucho más oscuro que la mejilla da barba', () => {
  // Diferencias de brillo respecto de la piel: ~90 puntos, ~36 y ~12.
  assert.equal(desdeMuestras({ piel: '#d9a173', menton: '#4a3a2c' }).barba, 'completa');
  assert.equal(desdeMuestras({ piel: '#d9a173', menton: '#a98060' }).barba, 'corta');
  assert.equal(desdeMuestras({ piel: '#d9a173', menton: '#cb9668' }).barba, 'ninguna');
});

test('una sombra leve en el mentón no pone barba', () => {
  assert.equal(desdeMuestras({ piel: '#d9a173', menton: '#cb9668' }).barba, 'ninguna');
});

test('la proporción de la cara define su forma', () => {
  assert.equal(desdeMuestras({ relacion: 1.45 }).forma, 'alargado');
  assert.equal(desdeMuestras({ relacion: 1.05 }).forma, 'redondo');
  assert.equal(desdeMuestras({ relacion: 1.2 }).forma, 'ovalo');
});

// --- Dibujo ---

test('dibuja un rostro válido con los valores por omisión', () => {
  const svg = dibujarRostro(parametrosPorDefecto(), { cx: 60, cy: 60, r: 30 });
  assert.ok(svg.length > 400);
  assert.ok(!svg.includes('NaN'), 'el SVG no debe contener NaN');
  assert.ok(!svg.includes('undefined'));
});

test('cada peinado, barba, forma y lentes se dibuja sin romperse', () => {
  for (const peinado of Object.keys(PEINADOS)) {
    for (const barba of Object.keys(BARBAS)) {
      for (const forma of Object.keys(FORMAS)) {
        for (const lentes of Object.keys(LENTES)) {
          const svg = dibujarRostro(
            { ...parametrosPorDefecto(), peinado, barba, forma, lentes },
            { cx: 60, cy: 60, r: 30 },
          );
          assert.ok(!svg.includes('NaN'), `NaN en ${peinado}/${barba}/${forma}/${lentes}`);
          assert.ok(svg.length > 300, `dibujo vacío en ${peinado}/${barba}/${forma}/${lentes}`);
        }
      }
    }
  }
});

test('sin pelo no se dibuja peinado', () => {
  const conPelo = dibujarRostro({ ...parametrosPorDefecto(), peinado: 'largo' }, { cx: 60, cy: 60, r: 30 });
  const calvo = dibujarRostro({ ...parametrosPorDefecto(), peinado: 'calvo' }, { cx: 60, cy: 60, r: 30 });
  assert.ok(calvo.length < conPelo.length);
});

test('la sonrisa cambia el trazo de la boca', () => {
  const seria = dibujarRostro(parametrosPorDefecto(), { cx: 60, cy: 60, r: 30 }, { sonrisa: 0 });
  const feliz = dibujarRostro(parametrosPorDefecto(), { cx: 60, cy: 60, r: 30 }, { sonrisa: 1 });
  assert.notEqual(seria, feliz);
});

test('las formas de cara producen anchos distintos', () => {
  const alargado = dibujarRostro({ ...parametrosPorDefecto(), forma: 'alargado' }, { cx: 60, cy: 60, r: 30 });
  const redondo = dibujarRostro({ ...parametrosPorDefecto(), forma: 'redondo' }, { cx: 60, cy: 60, r: 30 });
  assert.notEqual(alargado, redondo);
});

// --- Integración con el avatar ---

test('el avatar usa la caricatura cuando existe', () => {
  const base = { nivel: 5, atributos: { fuerza: 40, nutricion: 40, disciplina: 40 } };
  const generico = dibujarAvatar({ ...base, avatar: {} });
  const conCara = dibujarAvatar({ ...base, avatar: { rostro: parametrosPorDefecto() } });
  assert.notEqual(generico, conCara);
  assert.ok(!conCara.includes('NaN'));
  assert.match(conCara, /^<svg /);
  assert.match(conCara, /<\/svg>$/);
});

test('el cuerpo toma el tono de piel de la caricatura', () => {
  const svg = dibujarAvatar({
    nivel: 5,
    atributos: { fuerza: 40 },
    avatar: { rostro: { ...parametrosPorDefecto(), piel: '#5d3a26' } },
    tonoPiel: 'claro',
  });
  assert.ok(svg.includes('#5d3a26'), 'el color de la foto debe mandar sobre el tono elegido');
});

test('sin caricatura el avatar sigue funcionando como antes', () => {
  const svg = dibujarAvatar({ nivel: 1, atributos: {}, avatar: { atuendo: 'basico' }, tonoPiel: 'medio' });
  assert.ok(!svg.includes('NaN'));
  assert.ok(svg.includes('#d9a173'), 'debe usar el tono elegido en el perfil');
});

test('la caricatura convive con atuendos, auras y mascotas', () => {
  for (const atuendo of ['basico', 'gimnasio', 'titan']) {
    for (const aura of [null, 'fuego']) {
      const svg = dibujarAvatar({
        nivel: 30,
        atributos: { fuerza: 90, nutricion: 80, disciplina: 90, resistencia: 70, finanzas: 80 },
        avatar: { atuendo, aura, mascota: 'lobo', rostro: parametrosPorDefecto() },
      });
      assert.ok(!svg.includes('NaN'), `NaN con ${atuendo}/${aura}`);
    }
  }
});

test('los parámetros guardados son pocos y simples: nunca una imagen', () => {
  const p = parametrosPorDefecto();
  const serializado = JSON.stringify(p);
  assert.ok(serializado.length < 250, 'debe ser un objeto chico');
  assert.doesNotMatch(serializado, /data:image|base64/i, 'no debe contener una imagen');
  for (const valor of Object.values(p)) {
    assert.ok(['string', 'boolean'].includes(typeof valor), 'solo colores y opciones');
  }
});
