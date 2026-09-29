import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  xpParaNivel, nivelDesdeXP, detalleNivel, etapaDesdeNivel, calcularAtributos,
  otorgar, gastarTokens, acreditarTokens, revisarLogros, progresoInicial, LOGROS, REGLAS, ETAPAS,
} from '../js/nucleo/progreso.js';
import { canjear, aplicarPaquete, estadoArticulo, tieneEfecto, atuendosDesbloqueados, temasDesbloqueados } from '../js/nucleo/tienda.js';
import { ARTICULOS, PAQUETES, MAPA_ARTICULOS, valorEnTokens } from '../js/datos/tienda-catalogo.js';
import {
  estadoDia, rachaActual, rachaMasLarga, puntajeDisciplina, cumplimientoPorHabito,
  historialReciente, habitosIniciales, consejosRutina,
} from '../js/nucleo/habitos.js';
import { dibujarAvatar, leerAvatar } from '../js/nucleo/avatar.js';

// --- Niveles y XP ---

test('el nivel 1 empieza en 0 XP y la curva es creciente', () => {
  assert.equal(xpParaNivel(1), 0);
  let previo = 0;
  for (let n = 2; n <= 30; n++) {
    const actual = xpParaNivel(n);
    assert.ok(actual > previo, `el nivel ${n} no exige más XP que el anterior`);
    previo = actual;
  }
});

test('nivelDesdeXP es coherente con xpParaNivel', () => {
  for (let n = 1; n <= 25; n++) {
    assert.equal(nivelDesdeXP(xpParaNivel(n)), n);
    if (n > 1) assert.equal(nivelDesdeXP(xpParaNivel(n) - 1), n - 1);
  }
});

test('el detalle de nivel entrega el avance dentro del nivel', () => {
  const d = detalleNivel(xpParaNivel(5) + 50);
  assert.equal(d.nivel, 5);
  assert.equal(d.xpEnNivel, 50);
  assert.ok(d.pct > 0 && d.pct < 100);
  assert.equal(d.xpFaltante, xpParaNivel(6) - xpParaNivel(5) - 50);
});

test('las etapas del avatar avanzan con el nivel', () => {
  assert.equal(etapaDesdeNivel(1).etapa, 1);
  assert.equal(etapaDesdeNivel(12).etapa, 5);
  assert.equal(etapaDesdeNivel(99).etapa, 10);
  for (let i = 1; i < ETAPAS.length; i++) assert.ok(ETAPAS[i].desde > ETAPAS[i - 1].desde);
});

// --- Atributos ---

test('los atributos parten en cero sin datos', () => {
  const a = calcularAtributos({});
  assert.equal(a.fuerza, 0);
  assert.equal(a.nutricion, 0);
  assert.equal(a.general, 0);
});

test('la fuerza crece con el tonelaje y los récords', () => {
  const poco = calcularAtributos({ tonelajeTotal: 1000, recordsRM: 100, pesoCorporal: 80 });
  const mucho = calcularAtributos({ tonelajeTotal: 200000, recordsRM: 400, pesoCorporal: 80 });
  assert.ok(mucho.fuerza > poco.fuerza);
  assert.ok(mucho.fuerza <= 100);
});

test('ningún atributo se pasa de 100', () => {
  const a = calcularAtributos({
    tonelajeTotal: 9e9, sesiones: 5000, recordsRM: 9999, pesoCorporal: 50,
    diasEnMetaNutricion: 900, diasRegistradosNutricion: 900, disciplina: 500,
    puntajeFinanciero: 500, minutosCardio: 1e6,
  });
  for (const [clave, valor] of Object.entries(a)) assert.ok(valor <= 100, `${clave} = ${valor}`);
});

test('la nutrición exige al menos diez días registrados para llegar al máximo', () => {
  const pocos = calcularAtributos({ diasEnMetaNutricion: 3, diasRegistradosNutricion: 3 });
  assert.ok(pocos.nutricion < 100);
  const muchos = calcularAtributos({ diasEnMetaNutricion: 20, diasRegistradosNutricion: 20 });
  assert.equal(muchos.nutricion, 100);
});

// --- Recompensas ---

test('otorgar suma XP y tokens según la regla', () => {
  const { progreso, ganado } = otorgar(progresoInicial(), 'entreno_completado', 'entreno:1');
  assert.equal(progreso.xp, REGLAS.entreno_completado.xp);
  assert.equal(progreso.tokens, REGLAS.entreno_completado.tokens);
  assert.equal(ganado.tokens, REGLAS.entreno_completado.tokens);
  assert.equal(progreso.historial.length, 1);
});

test('la misma clave no se paga dos veces', () => {
  const primera = otorgar(progresoInicial(), 'habito_cumplido', 'hab:1:2026-09-28');
  const segunda = otorgar(primera.progreso, 'habito_cumplido', 'hab:1:2026-09-28');
  assert.equal(segunda.ganado, null);
  assert.equal(segunda.progreso.xp, primera.progreso.xp);
});

test('claves distintas del mismo tipo sí se pagan', () => {
  let p = progresoInicial();
  p = otorgar(p, 'habito_cumplido', 'hab:1:2026-09-28').progreso;
  p = otorgar(p, 'habito_cumplido', 'hab:2:2026-09-28').progreso;
  assert.equal(p.xp, REGLAS.habito_cumplido.xp * 2);
});

test('subir de nivel entrega tokens extra', () => {
  const { progreso, ganado } = otorgar(progresoInicial(), 'meta_ahorro', 'meta:1');
  assert.ok(ganado.subidas.length >= 1, 'debería subir al menos un nivel con 400 XP');
  assert.equal(progreso.tokens, REGLAS.meta_ahorro.tokens + ganado.subidas.length * REGLAS.subir_nivel.tokens);
});

test('un tipo de evento desconocido no altera el progreso', () => {
  const inicial = progresoInicial();
  const { progreso, ganado } = otorgar(inicial, 'no_existe', 'x');
  assert.equal(ganado, null);
  assert.equal(progreso, inicial);
});

test('gastar tokens falla si no alcanza', () => {
  const r = gastarTokens(progresoInicial(), 100, 'algo');
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /faltan 100/);
});

test('gastar tokens descuenta y deja registro', () => {
  const con = acreditarTokens(progresoInicial(), 300, 'compra');
  const r = gastarTokens(con, 120, 'canje de prueba');
  assert.equal(r.ok, true);
  assert.equal(r.progreso.tokens, 180);
  assert.equal(r.progreso.tokensGastadosTotal, 120);
  assert.equal(r.progreso.historial[0].tokens, -120);
});

test('el historial no crece sin límite', () => {
  let p = progresoInicial();
  for (let i = 0; i < 400; i++) p = otorgar(p, 'serie_registrada', `s:${i}`).progreso;
  assert.ok(p.historial.length <= 300);
});

// --- Logros ---

test('los logros se entregan una sola vez', () => {
  const stats = { habitosCumplidos: 1, sesiones: 0, movimientos: 0, comidas: 0, racha: 0, tonelaje: 0, records: 0, diasEnMeta: 0, diasAgua: 0, mejorTasaAhorro: 0, mesesColchon: 0, metasCumplidas: 0, nivel: 1, atributosMinimo: 0, atributoGeneral: 0 };
  const primera = revisarLogros(progresoInicial(), stats);
  assert.equal(primera.nuevos.length, 1);
  assert.equal(primera.nuevos[0].id, 'primer_paso');
  const segunda = revisarLogros(primera.progreso, stats);
  assert.equal(segunda.nuevos.length, 0);
});

test('un logro entrega sus tokens', () => {
  const logro = LOGROS.find((l) => l.id === 'racha_7');
  const r = revisarLogros(progresoInicial(), { racha: 7 });
  assert.ok(r.nuevos.some((l) => l.id === 'racha_7'));
  assert.ok(r.progreso.tokens >= logro.tokens);
});

test('revisarLogros tolera estadísticas incompletas', () => {
  const r = revisarLogros(progresoInicial(), {});
  assert.ok(Array.isArray(r.nuevos));
});

test('todos los logros tienen id único, icono y recompensa', () => {
  const ids = new Set();
  for (const l of LOGROS) {
    assert.ok(!ids.has(l.id), `logro duplicado ${l.id}`);
    ids.add(l.id);
    assert.ok(l.nombre && l.desc && l.icono);
    assert.ok(l.tokens > 0);
    assert.equal(typeof l.prueba, 'function');
  }
});

// --- Tienda ---

test('no se puede canjear sin tokens', () => {
  const r = canjear(progresoInicial(), 'atuendo_deportivo');
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /faltan/);
});

test('el canje descuenta tokens y desbloquea el artículo', () => {
  const con = acreditarTokens(progresoInicial(), 200, 'prueba');
  const r = canjear(con, 'atuendo_deportivo');
  assert.equal(r.ok, true);
  assert.equal(r.progreso.tokens, 140);
  assert.ok(r.progreso.desbloqueos.includes('atuendo_deportivo'));
  assert.equal(r.progreso.avatar.atuendo, 'deportivo');
});

test('no se canjea dos veces el mismo artículo', () => {
  const con = acreditarTokens(progresoInicial(), 400, 'prueba');
  const primera = canjear(con, 'atuendo_deportivo');
  const segunda = canjear(primera.progreso, 'atuendo_deportivo');
  assert.equal(segunda.ok, false);
  assert.equal(segunda.progreso.tokens, primera.progreso.tokens);
});

test('un artículo con requisito de nivel se bloquea', () => {
  const con = acreditarTokens(progresoInicial(), 5000, 'prueba');
  const r = canjear(con, 'atuendo_titan');
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /nivel 18/);
});

test('comprar un nivel de entrenamiento lo agrega a tiersComprados', () => {
  let p = acreditarTokens(progresoInicial(), 5000, 'prueba');
  // El artículo exige nivel 4: se acumula XP hasta llegar.
  p = otorgar(p, 'meta_ahorro', 'meta:1').progreso;
  p = otorgar(p, 'mes_presupuesto', 'pres:1').progreso;
  p = otorgar(p, 'racha_30', 'r30').progreso;
  assert.ok(nivelDesdeXP(p.xp) >= 4, `nivel ${nivelDesdeXP(p.xp)} con ${p.xp} XP`);
  const r = canjear(p, 'tier3_early');
  assert.equal(r.ok, true, r.mensaje);
  assert.ok(r.progreso.tiersComprados.includes(3));
});

test('un paquete acredita tokens y desbloquea todos sus artículos', () => {
  const paquete = PAQUETES.find((p) => p.id === 'pack_nutricion');
  const r = aplicarPaquete(progresoInicial(), 'pack_nutricion');
  assert.equal(r.ok, true);
  assert.equal(r.progreso.tokens, paquete.tokens);
  for (const articuloId of paquete.articulos) assert.ok(r.progreso.desbloqueos.includes(articuloId));
  assert.ok(tieneEfecto(r.progreso, 'plan:deficit'));
});

test('el paquete total desbloquea el catálogo completo', () => {
  const r = aplicarPaquete(progresoInicial(), 'pack_total');
  assert.equal(r.progreso.desbloqueos.length, ARTICULOS.length);
  assert.ok(temasDesbloqueados(r.progreso).length >= 4);
  assert.ok(atuendosDesbloqueados(r.progreso).length >= 5);
});

test('aplicar dos veces un paquete no duplica desbloqueos', () => {
  const primera = aplicarPaquete(progresoInicial(), 'pack_avatar');
  const segunda = aplicarPaquete(primera.progreso, 'pack_avatar');
  assert.equal(segunda.progreso.desbloqueos.length, primera.progreso.desbloqueos.length);
});

test('un paquete inexistente no rompe nada', () => {
  const r = aplicarPaquete(progresoInicial(), 'no_existe');
  assert.equal(r.ok, false);
});

test('los paquetes valen más en tokens de lo que costaría comprarlos suelto por separado', () => {
  for (const p of PAQUETES) {
    assert.ok(valorEnTokens(p) >= p.tokens, `${p.id} no entrega valor`);
    assert.ok(p.precio > 0 && p.incluye.length > 0);
  }
});

test('el catálogo está bien formado', () => {
  const ids = new Set();
  for (const a of ARTICULOS) {
    assert.ok(!ids.has(a.id), `artículo duplicado ${a.id}`);
    ids.add(a.id);
    assert.ok(a.costo > 0 && a.nombre && a.desc && a.efecto);
    assert.ok(a.efecto.includes(':'), `${a.id} con efecto mal formado`);
  }
  for (const p of PAQUETES) {
    for (const articuloId of p.articulos || []) {
      assert.ok(MAPA_ARTICULOS.has(articuloId), `el paquete ${p.id} referencia ${articuloId}, que no existe`);
    }
  }
});

test('estadoArticulo informa cuánto falta', () => {
  const e = estadoArticulo(MAPA_ARTICULOS.get('aura_fuego'), progresoInicial());
  assert.equal(e.faltanTokens, 300);
  assert.equal(e.puedeComprar, false);
});

// --- Hábitos ---

const habitos = [
  { id: 'h1', nombre: 'Agua', bloque: 'manana', area: 'nutricion', hora: '07:00', meta: 1, activo: true },
  { id: 'h2', nombre: 'Pasos', bloque: 'tarde', area: 'cuerpo', hora: '13:00', meta: 8000, unidad: 'pasos', activo: true },
  { id: 'h3', nombre: 'Leer', bloque: 'noche', area: 'mente', hora: '22:00', meta: 10, unidad: 'páginas', activo: true },
];

test('estadoDia calcula cumplidos y porcentaje', () => {
  const registros = { '2026-09-28': { h1: 1, h2: 4000, h3: 10 } };
  const dia = estadoDia(habitos, registros, '2026-09-28');
  assert.equal(dia.cumplidos, 2);
  assert.equal(dia.total, 3);
  assert.equal(dia.pct, 67);
  assert.equal(dia.perfecto, false);
  assert.equal(dia.items.find((i) => i.id === 'h2').pct, 50);
});

test('un día perfecto se detecta', () => {
  const dia = estadoDia(habitos, { '2026-09-28': { h1: 1, h2: 9000, h3: 12 } }, '2026-09-28');
  assert.equal(dia.perfecto, true);
  assert.equal(dia.pct, 100);
});

test('los hábitos en pausa no cuentan', () => {
  const conPausa = habitos.map((h) => (h.id === 'h3' ? { ...h, activo: false } : h));
  const dia = estadoDia(conPausa, { '2026-09-28': { h1: 1, h2: 9000 } }, '2026-09-28');
  assert.equal(dia.total, 2);
  assert.equal(dia.perfecto, true);
});

test('la racha cuenta días consecutivos sobre el umbral', () => {
  const registros = {
    '2026-09-28': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-27': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-26': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-24': { h1: 1, h2: 9000, h3: 10 },
  };
  assert.equal(rachaActual(habitos, registros, '2026-09-28'), 3);
});

test('un día en curso no rompe la racha anterior', () => {
  const registros = {
    '2026-09-27': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-26': { h1: 1, h2: 9000, h3: 10 },
  };
  assert.equal(rachaActual(habitos, registros, '2026-09-28'), 2);
});

test('la mejor racha histórica se calcula sobre todo el registro', () => {
  const registros = {
    '2026-09-01': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-02': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-03': { h1: 1, h2: 9000, h3: 10 },
    '2026-09-05': { h1: 1, h2: 9000, h3: 10 },
  };
  assert.equal(rachaMasLarga(habitos, registros), 3);
});

test('el puntaje de disciplina está entre 0 y 100', () => {
  assert.equal(puntajeDisciplina(habitos, {}, '2026-09-28'), 0);
  const registros = {};
  for (let i = 0; i < 40; i++) {
    const f = new Date(2026, 8, 28 - i);
    registros[`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`] = { h1: 1, h2: 9000, h3: 10 };
  }
  const alto = puntajeDisciplina(habitos, registros, '2026-09-28');
  assert.ok(alto > 80 && alto <= 100, `puntaje ${alto}`);
});

test('el cumplimiento por hábito ordena del peor al mejor', () => {
  const registros = {
    '2026-09-28': { h1: 1, h3: 10 },
    '2026-09-27': { h1: 1 },
  };
  const filas = cumplimientoPorHabito(habitos, registros, 7, '2026-09-28');
  assert.equal(filas[0].id, 'h2');
  assert.equal(filas[0].pct, 0);
  assert.equal(filas[filas.length - 1].pct, 100);
});

test('el historial reciente devuelve nulo en los días sin registro', () => {
  const dias = historialReciente(habitos, { '2026-09-28': { h1: 1 } }, 7, '2026-09-28');
  assert.equal(dias.length, 7);
  assert.equal(dias[dias.length - 1].pct, 33);
  assert.equal(dias[0].pct, null);
});

test('los hábitos iniciales son válidos y cubren varias áreas', () => {
  const iniciales = habitosIniciales();
  assert.ok(iniciales.length >= 8);
  const areas = new Set(iniciales.map((h) => h.area));
  assert.ok(areas.size >= 4);
  for (const h of iniciales) {
    assert.ok(h.id && h.nombre && h.hora && h.meta >= 1);
    assert.ok(['manana', 'tarde', 'noche'].includes(h.bloque));
  }
});

test('los consejos de rutina apuntan al hábito que falla', () => {
  const registros = {};
  for (let i = 0; i < 10; i++) {
    const f = new Date(2026, 8, 28 - i);
    registros[`2026-09-${String(f.getDate()).padStart(2, '0')}`] = { h1: 1, h3: 10 };
  }
  const consejos = consejosRutina(habitos, registros, '2026-09-28');
  assert.ok(consejos.some((c) => /Pasos/.test(c.texto)));
});

// --- Avatar ---

test('el avatar genera un SVG válido', () => {
  const svg = dibujarAvatar({ nivel: 1, atributos: { fuerza: 0, resistencia: 0, nutricion: 0, disciplina: 0, finanzas: 0 } });
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>$/);
  assert.ok(!svg.includes('NaN'), 'el SVG contiene NaN');
  assert.ok(!svg.includes('undefined'), 'el SVG contiene undefined');
});

test('el avatar cambia con los atributos y los accesorios', () => {
  const base = dibujarAvatar({ nivel: 1, atributos: { fuerza: 0, nutricion: 0 } });
  const fuerte = dibujarAvatar({ nivel: 20, atributos: { fuerza: 90, nutricion: 85, disciplina: 80, resistencia: 70, finanzas: 75 } });
  assert.notEqual(base, fuerte);
  assert.ok(fuerte.length > base.length, 'el avatar avanzado debería tener más detalles');
});

test('el avatar admite cualquier accesorio sin romperse', () => {
  for (const atuendo of ['basico', 'deportivo', 'gimnasio', 'guerrero', 'titan']) {
    for (const aura of [null, 'fuego', 'hielo', 'dorada']) {
      for (const mascota of [null, 'lobo', 'dragon']) {
        const svg = dibujarAvatar({ nivel: 25, atributos: { fuerza: 60, nutricion: 60 }, avatar: { atuendo, aura, mascota } });
        assert.ok(!svg.includes('NaN'), `NaN con ${atuendo}/${aura}/${mascota}`);
      }
    }
  }
});

test('leerAvatar explica en texto lo que refleja el avatar', () => {
  const lineas = leerAvatar({ fuerza: 70, nutricion: 80, disciplina: 50, resistencia: 60, finanzas: 70 }, 20);
  assert.ok(lineas.length >= 3);
  for (const l of lineas) assert.equal(typeof l, 'string');
});
