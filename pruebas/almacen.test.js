import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  estadoInicial, migrar, exportar, importar, repartirRecompensas, estadisticas,
  marcarHabito, agregarComida, quitarComida, sumarAgua, guardarEntrenamiento,
  borrarEntrenamiento, agregarMovimiento, borrarMovimiento, guardarMeta, borrarMeta,
  registrarPeso, guardarHabito, borrarHabito, diaNutricion, ahorroAcumulado, semanaEnCurso,
} from '../js/nucleo/almacen.js';
import { hoyISO, inicioSemana, sumarDias, diasEntre, mesDe, aleatorioConSemilla, clp, num } from '../js/nucleo/utiles.js';
import { generarMenuSemanal, listaDeCompras, recetasConMacros, TIPOS_MENU } from '../js/nucleo/menus.js';
import { calcularObjetivos } from '../js/nucleo/nutricion.js';

const HOY = hoyISO();

function estadoDePrueba() {
  const base = estadoInicial();
  return { ...base, configurado: true };
}

// --- Utilidades de fecha ---

test('las fechas se manejan en horario local, sin saltos por UTC', () => {
  const f = new Date(2026, 0, 1, 23, 30);
  assert.equal(hoyISO(f), '2026-01-01');
});

test('sumarDias cruza meses y años', () => {
  assert.equal(sumarDias('2026-01-31', 1), '2026-02-01');
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
});

test('inicioSemana siempre devuelve el lunes', () => {
  assert.equal(inicioSemana('2026-09-28'), '2026-09-28'); // lunes
  assert.equal(inicioSemana('2026-10-04'), '2026-09-28'); // domingo
  assert.equal(inicioSemana('2026-10-01'), '2026-09-28');
});

test('diasEntre y mesDe', () => {
  assert.equal(diasEntre('2026-09-01', '2026-09-28'), 27);
  assert.equal(mesDe('2026-09-28'), '2026-09');
});

test('la semana en curso son siete días desde el lunes', () => {
  const semana = semanaEnCurso('2026-09-30');
  assert.equal(semana.length, 7);
  assert.equal(semana[0], '2026-09-28');
  assert.equal(semana[6], '2026-10-04');
});

test('el generador con semilla es reproducible', () => {
  const a = aleatorioConSemilla('x');
  const b = aleatorioConSemilla('x');
  assert.equal(a(), b());
  const c = aleatorioConSemilla('y');
  assert.notEqual(aleatorioConSemilla('x')(), c());
});

test('formato de pesos chilenos y números', () => {
  assert.equal(clp(1234567), '$1.234.567');
  assert.equal(clp(0), '$0');
  assert.equal(num(1500), '1.500');
});

// --- Persistencia ---

test('migrar completa los campos que falten', () => {
  const viejo = { perfil: { nombre: 'Ana' }, movimientos: null, habitos: [] };
  const estado = migrar(viejo);
  assert.equal(estado.perfil.nombre, 'Ana');
  assert.equal(estado.perfil.pesoKg, 75, 'debería tomar el valor por omisión');
  assert.ok(Array.isArray(estado.movimientos));
  assert.ok(estado.habitos.length > 0, 'debería reponer los hábitos iniciales');
  assert.ok(estado.progreso.avatar);
});

test('exportar e importar dan la vuelta completa', () => {
  let estado = estadoDePrueba();
  estado = marcarHabito(estado, estado.habitos[0].id, 1, HOY);
  estado = agregarMovimiento(estado, { tipo: 'ingreso', categoria: 'sueldo', monto: 500000 });
  const recuperado = importar(exportar(estado));
  assert.equal(recuperado.movimientos.length, 1);
  assert.deepEqual(recuperado.registrosHabitos, estado.registrosHabitos);
});

test('importar rechaza un archivo que no es un objeto', () => {
  assert.throws(() => importar('"texto"'));
  assert.throws(() => importar('no es json'));
});

// --- Mutaciones ---

test('marcar y desmarcar un hábito', () => {
  let estado = estadoDePrueba();
  const id = estado.habitos[0].id;
  estado = marcarHabito(estado, id, 1, HOY);
  assert.equal(estado.registrosHabitos[HOY][id], 1);
  estado = marcarHabito(estado, id, 0, HOY);
  assert.equal(estado.registrosHabitos[HOY][id], undefined);
});

test('agregar y quitar comidas', () => {
  let estado = estadoDePrueba();
  estado = agregarComida(estado, { alimentoId: 'huevo', gramos: 110, momento: 'Desayuno' }, HOY);
  assert.equal(estado.comidas[HOY].length, 1);
  const registroId = estado.comidas[HOY][0].id;
  assert.ok(diaNutricion(estado, HOY).total.kcal > 100);
  estado = quitarComida(estado, registroId, HOY);
  assert.equal(estado.comidas[HOY].length, 0);
});

test('el agua no baja de cero', () => {
  let estado = estadoDePrueba();
  estado = sumarAgua(estado, 500, HOY);
  estado = sumarAgua(estado, -900, HOY);
  assert.equal(estado.aguaExtra[HOY], 0);
});

test('guardar un entrenamiento descarta las series vacías', () => {
  let estado = estadoDePrueba();
  estado = guardarEntrenamiento(estado, {
    nombre: 'Prueba', tier: 1, duracionMin: 40,
    ejercicios: [
      { ejercicioId: 'flexion', series: [{ peso: 0, reps: 12 }, { peso: 0, reps: 0 }] },
      { ejercicioId: 'plancha', series: [{ peso: 0, reps: 0 }] },
    ],
  });
  assert.equal(estado.entrenamientos.length, 1);
  assert.equal(estado.entrenamientos[0].ejercicios.length, 1, 'el ejercicio sin series no se guarda');
  assert.equal(estado.entrenamientos[0].ejercicios[0].series.length, 1);
  assert.equal(estado.entrenamientos[0].semana, inicioSemana(HOY));
});

test('guardar un entrenamiento con el mismo id lo reemplaza', () => {
  let estado = estadoDePrueba();
  estado = guardarEntrenamiento(estado, { id: 'fijo', nombre: 'A', ejercicios: [{ ejercicioId: 'flexion', series: [{ peso: 0, reps: 10 }] }] });
  estado = guardarEntrenamiento(estado, { id: 'fijo', nombre: 'B', ejercicios: [{ ejercicioId: 'flexion', series: [{ peso: 0, reps: 12 }] }] });
  assert.equal(estado.entrenamientos.length, 1);
  assert.equal(estado.entrenamientos[0].nombre, 'B');
  estado = borrarEntrenamiento(estado, 'fijo');
  assert.equal(estado.entrenamientos.length, 0);
});

test('los movimientos guardan el monto en positivo', () => {
  let estado = estadoDePrueba();
  estado = agregarMovimiento(estado, { tipo: 'gasto', categoria: 'mercado', monto: -5000 });
  assert.equal(estado.movimientos[0].monto, 5000);
  estado = borrarMovimiento(estado, estado.movimientos[0].id);
  assert.equal(estado.movimientos.length, 0);
});

test('las metas se guardan, editan y borran', () => {
  let estado = estadoDePrueba();
  estado = guardarMeta(estado, { nombre: 'Viaje', montoObjetivo: 1000000, aporteMensual: 50000 });
  const id = estado.metas[0].id;
  estado = guardarMeta(estado, { ...estado.metas[0], montoActual: 200000 });
  assert.equal(estado.metas.length, 1);
  assert.equal(estado.metas[0].montoActual, 200000);
  estado = borrarMeta(estado, id);
  assert.equal(estado.metas.length, 0);
});

test('registrar peso actualiza el perfil y no duplica el día', () => {
  let estado = estadoDePrueba();
  estado = registrarPeso(estado, 82, HOY);
  estado = registrarPeso(estado, 81.5, HOY);
  assert.equal(estado.pesos.length, 1);
  assert.equal(estado.pesos[0].peso, 81.5);
  assert.equal(estado.perfil.pesoKg, 81.5);
});

test('los hábitos personalizados se crean y se borran', () => {
  let estado = estadoDePrueba();
  const antes = estado.habitos.length;
  estado = guardarHabito(estado, { nombre: 'Meditar', bloque: 'manana', area: 'mente', hora: '06:30' });
  assert.equal(estado.habitos.length, antes + 1);
  const nuevo = estado.habitos.find((h) => h.nombre === 'Meditar');
  estado = borrarHabito(estado, nuevo.id);
  assert.equal(estado.habitos.length, antes);
});

// --- Reparto de recompensas ---

test('el reparto paga los hábitos cumplidos', () => {
  let estado = estadoDePrueba();
  estado = marcarHabito(estado, estado.habitos[0].id, 1, HOY);
  const r = repartirRecompensas(estado);
  assert.ok(r.estado.progreso.xp >= 10);
  assert.ok(r.estado.progreso.tokens >= 1);
  assert.ok(r.ganancias.length >= 1);
});

test('el reparto es idempotente: llamarlo de nuevo no paga otra vez', () => {
  let estado = estadoDePrueba();
  estado = marcarHabito(estado, estado.habitos[0].id, 1, HOY);
  estado = agregarMovimiento(estado, { tipo: 'ingreso', categoria: 'sueldo', monto: 900000 });
  const primera = repartirRecompensas(estado);
  const segunda = repartirRecompensas(primera.estado);
  assert.equal(segunda.estado.progreso.xp, primera.estado.progreso.xp);
  assert.equal(segunda.estado.progreso.tokens, primera.estado.progreso.tokens);
  assert.equal(segunda.ganancias.length, 0);
});

test('un día perfecto paga el bono además de cada hábito', () => {
  let estado = estadoDePrueba();
  for (const h of estado.habitos) estado = marcarHabito(estado, h.id, h.meta, HOY);
  const r = repartirRecompensas(estado);
  assert.ok(r.ganancias.some((g) => /Día perfecto/.test(g.texto)));
});

test('borrar un registro no quita los premios ya entregados', () => {
  let estado = estadoDePrueba();
  const id = estado.habitos[0].id;
  estado = marcarHabito(estado, id, 1, HOY);
  const conPremio = repartirRecompensas(estado).estado;
  const xpAntes = conPremio.progreso.xp;
  const sinHabito = repartirRecompensas(marcarHabito(conPremio, id, 0, HOY)).estado;
  assert.equal(sinHabito.progreso.xp, xpAntes);
});

test('un entrenamiento paga la sesión y sus récords', () => {
  let estado = estadoDePrueba();
  estado = guardarEntrenamiento(estado, {
    nombre: 'Fuerza', tier: 2, duracionMin: 50,
    ejercicios: [{ ejercicioId: 'press_banca_mancuerna', series: [{ peso: 20, reps: 10 }, { peso: 20, reps: 10 }] }],
  });
  const r = repartirRecompensas(estado);
  assert.ok(r.ganancias.some((g) => /Fuerza/.test(g.texto)));
  assert.ok(r.ganancias.some((g) => /Récord/.test(g.texto)));
});

test('un día en meta calórica se premia una sola vez', () => {
  let estado = estadoDePrueba();
  const objetivos = calcularObjetivos(estado.perfil);
  // Se llena con pollo y arroz hasta acercarse a la meta.
  const gramosPollo = Math.round((objetivos.prot / 31) * 100);
  estado = agregarComida(estado, { alimentoId: 'pollo_pechuga', gramos: gramosPollo, momento: 'Almuerzo' }, HOY);
  const faltan = objetivos.kcal - diaNutricion(estado, HOY).total.kcal;
  estado = agregarComida(estado, { alimentoId: 'arroz_cocido', gramos: Math.max(0, Math.round((faltan / 130) * 100)), momento: 'Almuerzo' }, HOY);

  const dia = diaNutricion(estado, HOY);
  assert.ok(dia.enMeta, `el día debería quedar en meta (${dia.evaluacion.kcal.pct}% kcal, ${dia.evaluacion.prot.pct}% proteína)`);

  const primera = repartirRecompensas(estado);
  const segunda = repartirRecompensas(primera.estado);
  assert.ok(primera.ganancias.some((g) => /Calorías en meta/.test(g.texto)));
  assert.equal(segunda.ganancias.length, 0);
});

test('los hitos de racha se pagan una sola vez', () => {
  let estado = estadoDePrueba();
  // Siete días seguidos cumpliendo todos los hábitos.
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(HOY, -i);
    for (const h of estado.habitos) estado = marcarHabito(estado, h.id, h.meta, fecha);
  }
  const primera = repartirRecompensas(estado);
  assert.ok(primera.ganancias.some((g) => g.texto === 'Racha de 7 días'), 'debería pagar el hito de 7 días');
  const segunda = repartirRecompensas(primera.estado);
  assert.equal(segunda.ganancias.length, 0);
});

test('las estadísticas no fallan con el estado vacío', () => {
  const stats = estadisticas(estadoInicial());
  assert.equal(stats.nivel, 1);
  assert.equal(stats.sesiones, 0);
  assert.equal(stats.tierMax, 1);
  assert.equal(stats.atributos.general, 0);
  assert.ok(stats.finanzas.resumen);
});

test('las estadísticas reflejan los datos registrados', () => {
  let estado = estadoDePrueba();
  estado = guardarEntrenamiento(estado, { nombre: 'A', duracionMin: 45, ejercicios: [{ ejercicioId: 'sentadilla_barra', series: [{ peso: 100, reps: 5 }] }] });
  estado = agregarMovimiento(estado, { tipo: 'ingreso', categoria: 'sueldo', monto: 1000000 });
  estado = agregarMovimiento(estado, { tipo: 'ahorro', categoria: 'ahorro', monto: 200000 });
  estado = repartirRecompensas(estado).estado;
  const stats = estadisticas(estado);
  assert.equal(stats.sesiones, 1);
  assert.equal(stats.tonelaje, 500);
  assert.ok(stats.records.length === 1);
  assert.ok(stats.atributos.fuerza > 0);
  assert.ok(stats.finanzas.resumen.tasaAhorro > 0);
  assert.ok(stats.nivel >= 1);
});

test('el ahorro acumulado parte del saldo declarado', () => {
  let estado = { ...estadoDePrueba(), ahorroInicial: 500000 };
  assert.equal(ahorroAcumulado(estado), 500000);
  estado = agregarMovimiento(estado, { tipo: 'ingreso', categoria: 'sueldo', monto: 1000000 });
  estado = agregarMovimiento(estado, { tipo: 'ahorro', categoria: 'ahorro', monto: 300000 });
  assert.equal(ahorroAcumulado(estado), 500000 + 1000000);
});

// --- Menús ---

test('el menú semanal cubre siete días y se acerca a las calorías objetivo', () => {
  const objetivos = calcularObjetivos(estadoInicial().perfil);
  const menu = generarMenuSemanal(objetivos, 'deficit', 4, 'semilla');
  assert.equal(menu.dias.length, 7);
  for (const dia of menu.dias) {
    assert.equal(dia.comidas.length, 4);
    const desvio = Math.abs(dia.total.kcal - objetivos.kcal) / objetivos.kcal;
    assert.ok(desvio < 0.45, `${dia.dia}: ${dia.total.kcal} kcal frente a ${objetivos.kcal}`);
    assert.ok(dia.total.prot > objetivos.prot * 0.6, `${dia.dia}: solo ${dia.total.prot} g de proteína`);
  }
});

test('cada tipo de menú usa alimentos distintos', () => {
  const objetivos = calcularObjetivos(estadoInicial().perfil);
  const nombres = TIPOS_MENU.map((t) => t.id);
  assert.deepEqual(nombres, ['deficit', 'volumen', 'economico']);
  const listas = nombres.map((tipo) => generarMenuSemanal(objetivos, tipo, 4, 'x').compras.map((c) => c.alimentoId).sort().join());
  assert.notEqual(listas[0], listas[1]);
});

test('el menú es reproducible con la misma semilla', () => {
  const objetivos = calcularObjetivos(estadoInicial().perfil);
  const a = generarMenuSemanal(objetivos, 'volumen', 4, 'fija');
  const b = generarMenuSemanal(objetivos, 'volumen', 4, 'fija');
  assert.deepEqual(a.compras, b.compras);
});

test('la lista de compras suma los gramos de toda la semana', () => {
  const dias = [
    { comidas: [{ items: [{ alimentoId: 'huevo', gramos: 100 }] }] },
    { comidas: [{ items: [{ alimentoId: 'huevo', gramos: 50 }, { alimentoId: 'avena', gramos: 40 }] }] },
  ];
  const lista = listaDeCompras(dias);
  assert.equal(lista.find((l) => l.alimentoId === 'huevo').gramos, 150);
  assert.equal(lista.length, 2);
});

test('las recetas informan sus macros y tienen proteína alta', () => {
  const recetas = recetasConMacros();
  assert.ok(recetas.length >= 10);
  for (const r of recetas) {
    assert.ok(r.total.prot > 20, `${r.nombre} solo tiene ${r.total.prot} g de proteína`);
    assert.ok(r.items.length >= 2 && r.pasos.length > 20);
  }
  // Vienen ordenadas de mayor a menor proteína.
  for (let i = 1; i < recetas.length; i++) assert.ok(recetas[i - 1].total.prot >= recetas[i].total.prot);
});
