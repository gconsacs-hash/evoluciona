// Estado de la app: persistencia, estadísticas derivadas y reparto de recompensas.
//
// El reparto es *idempotente*: en vez de premiar en el momento de cada acción, se recorre
// todo el historial y se paga cada condición cumplida una sola vez, usando una clave por
// evento. Así nunca se paga doble aunque el usuario edite o reabra la app.

import { hoyISO, mesDe, inicioSemana, suma, id as nuevoId, sumarDias } from './utiles.js';
import { registrarProducto, olvidarProducto } from '../datos/alimentos.js';
import { habitosIniciales, estadoDia, rachaActual, rachaMasLarga, puntajeDisciplina } from './habitos.js';
import { calcularObjetivos, totalizarRegistros, evaluarDia, diaEnMeta } from './nutricion.js';
import { detectarPR, resumenEntrenamiento, tierDesbloqueado, calcularRecords } from './entrenamiento.js';
import {
  resumenMensual, serieMensual, gastoMensualPromedio, fondoEmergencia,
  evaluarPresupuesto, puntajeFinanciero, CATEGORIAS_GASTO,
} from './finanzas.js';
import { progresoInicial, otorgar, revisarLogros, calcularAtributos, nivelDesdeXP, detalleNivel } from './progreso.js';
import { perfilInicial as perfilDiabetesInicial } from './diabetes.js';

export const CLAVE_ALMACEN = 'evoluciona.estado.v1';
const VERSION = 1;

export function estadoInicial() {
  return {
    version: VERSION,
    configurado: false,
    perfil: {
      nombre: '',
      sexo: 'masculino',
      edad: 30,
      pesoKg: 75,
      alturaCm: 172,
      actividad: 'ligero',
      objetivo: 'perder',
      diasEntreno: 3,
      equipo: 'ninguno',
      comidas: 4,
      tonoPiel: 'medio',
      ingresoMensual: 0,
    },
    habitos: habitosIniciales(),
    registrosHabitos: {},        // { fecha: { habitoId: valor } }
    comidas: {},                 // { fecha: [ {id, alimentoId, gramos, momento} ] }
    productos: {},               // { codigoDeBarras: producto } — despensa escaneada
    aguaExtra: {},               // { fecha: ml }
    pesos: [],                   // [ {fecha, peso} ]
    diabetes: perfilDiabetesInicial(),
    glicemias: [],               // [ {id, fecha, hora, valor, momento, nota} ]
    insulina: [],                // [ {id, fecha, hora, tipo, unidades, nota} ]
    entrenamientos: [],          // [ {id, fecha, semana, nombre, tier, duracionMin, ejercicios} ]
    planSemanal: null,           // { semana, sesiones }
    movimientos: [],             // [ {id, fecha, tipo, categoria, monto, nota} ]
    presupuesto: {},
    metas: [],                   // [ {id, nombre, montoObjetivo, montoActual, aporteMensual, fechaLimite} ]
    ahorroInicial: 0,
    progreso: progresoInicial(),
    tema: 'base',
    paquetesComprados: [],
    avisos: [],                  // cola de novedades para mostrar al usuario
  };
}

// --- Persistencia ---------------------------------------------------------

function almacenDisponible() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

export function cargar() {
  if (!almacenDisponible()) return estadoInicial();
  try {
    const bruto = localStorage.getItem(CLAVE_ALMACEN);
    if (!bruto) return estadoInicial();
    const datos = JSON.parse(bruto);
    return migrar(datos);
  } catch (error) {
    console.warn('No se pudo leer el estado guardado, se empieza de cero.', error);
    return estadoInicial();
  }
}

export function guardar(estado) {
  if (!almacenDisponible()) return false;
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado));
    return true;
  } catch (error) {
    console.error('No se pudo guardar el estado.', error);
    return false;
  }
}

/** Completa campos que falten al abrir un respaldo de una versión anterior. */
export function migrar(datos) {
  const base = estadoInicial();
  const estado = {
    ...base,
    ...datos,
    version: VERSION,
    perfil: { ...base.perfil, ...(datos.perfil || {}) },
    progreso: { ...base.progreso, ...(datos.progreso || {}), avatar: { ...base.progreso.avatar, ...(datos.progreso?.avatar || {}) } },
    diabetes: {
      ...base.diabetes,
      ...(datos.diabetes || {}),
      rango: { ...base.diabetes.rango, ...(datos.diabetes?.rango || {}) },
      esquema: { ...base.diabetes.esquema, ...(datos.diabetes?.esquema || {}) },
    },
  };
  for (const campo of ['glicemias', 'insulina']) {
    if (!Array.isArray(estado[campo])) estado[campo] = [];
  }
  if (!Array.isArray(estado.habitos) || !estado.habitos.length) estado.habitos = habitosIniciales();
  for (const campo of ['registrosHabitos', 'comidas', 'aguaExtra', 'presupuesto', 'productos']) {
    if (!estado[campo] || typeof estado[campo] !== 'object') estado[campo] = {};
  }
  // Los productos escaneados vuelven al catálogo para poder buscarlos y sumarlos.
  for (const producto of Object.values(estado.productos)) registrarProducto(producto);
  for (const campo of ['pesos', 'entrenamientos', 'movimientos', 'metas', 'paquetesComprados', 'avisos']) {
    if (!Array.isArray(estado[campo])) estado[campo] = [];
  }
  return estado;
}

export function exportar(estado) {
  return JSON.stringify({ ...estado, exportado: new Date().toISOString() }, null, 2);
}

export function importar(texto) {
  const datos = JSON.parse(texto);
  if (!datos || typeof datos !== 'object') throw new Error('Archivo no válido.');
  return migrar(datos);
}

// --- Datos derivados ------------------------------------------------------

export function objetivosNutricion(estado) {
  return calcularObjetivos(estado.perfil);
}

export function diaNutricion(estado, fecha = hoyISO()) {
  const registros = estado.comidas[fecha] || [];
  const total = totalizarRegistros(registros);
  const objetivos = objetivosNutricion(estado);
  const evaluacion = evaluarDia(total, objetivos, estado.aguaExtra[fecha] || 0);
  return { fecha, registros, total, objetivos, evaluacion, enMeta: diaEnMeta(evaluacion) };
}

export function resumenFinanzas(estado, mes = mesDe(hoyISO())) {
  const resumen = resumenMensual(estado.movimientos, mes);
  const serie = serieMensual(estado.movimientos);
  const promedio = gastoMensualPromedio(estado.movimientos, mes);
  const acumulado = ahorroAcumulado(estado);
  const colchon = fondoEmergencia(acumulado, promedio);
  const hoy = hoyISO();
  const diaDelMes = mes === mesDe(hoy) ? Number(hoy.slice(8, 10)) : 30;
  const diasDelMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
  const presupuestoEval = evaluarPresupuesto(resumen, estado.presupuesto, diaDelMes, diasDelMes);
  return { resumen, serie, promedioGastos: promedio, acumulado, colchon, presupuestoEval };
}

export function ahorroAcumulado(estado) {
  const serie = serieMensual(estado.movimientos, 999);
  return Math.round((Number(estado.ahorroInicial) || 0) + suma(serie, (s) => s.ahorro));
}

export function estadisticas(estado) {
  const hoy = hoyISO();
  const entreno = resumenEntrenamiento(estado.entrenamientos);
  const records = calcularRecords(estado.entrenamientos);
  const fin = resumenFinanzas(estado);
  const disciplina = puntajeDisciplina(estado.habitos, estado.registrosHabitos, hoy);

  let diasEnMeta = 0;
  let diasAgua = 0;
  let diasRegistrados = 0;
  const kcalRecientes = [];
  const fechasComida = Object.keys(estado.comidas).sort();
  for (const fecha of fechasComida) {
    if (!(estado.comidas[fecha] || []).length) continue;
    diasRegistrados++;
    const dia = diaNutricion(estado, fecha);
    if (dia.enMeta) diasEnMeta++;
    if (dia.evaluacion.agua.pct >= 100) diasAgua++;
    kcalRecientes.push(dia.total.kcal);
  }

  let habitosCumplidos = 0;
  for (const fecha of Object.keys(estado.registrosHabitos)) {
    habitosCumplidos += estadoDia(estado.habitos, estado.registrosHabitos, fecha).cumplidos;
  }

  const minutosCardio = suma(estado.entrenamientos, (s) =>
    (s.ejercicios || []).some((e) => e.patron === 'metcon') ? (s.duracionMin || 0) * 0.5 : 0);

  const pctPresupuesto = cumplimientoPresupuesto(estado, fin);
  const puntajeFin = puntajeFinanciero({
    tasaAhorro: fin.resumen.tasaAhorro,
    mesesColchon: fin.colchon.meses,
    cumplimientoPresupuesto: pctPresupuesto,
    registroDias: new Set(estado.movimientos.map((m) => m.fecha)).size,
  });

  const atributos = calcularAtributos({
    tonelajeTotal: entreno.tonelajeTotal,
    sesiones: entreno.sesiones,
    recordsRM: suma(records.slice(0, 4), (r) => r.rm),
    pesoCorporal: estado.perfil.pesoKg,
    diasEnMetaNutricion: diasEnMeta,
    diasRegistradosNutricion: diasRegistrados,
    disciplina,
    puntajeFinanciero: puntajeFin,
    minutosCardio,
  });

  const nivel = nivelDesdeXP(estado.progreso.xp);
  const mejorTasaAhorro = fin.serie.length ? Math.max(...fin.serie.map((s) => s.tasaAhorro)) : 0;

  return {
    nivel,
    detalleNivel: detalleNivel(estado.progreso.xp),
    atributos,
    disciplina,
    puntajeFinanciero: puntajeFin,
    cumplimientoPresupuesto: pctPresupuesto,
    entreno,
    records,
    finanzas: fin,
    nutricion: { diasEnMeta, diasAgua, diasRegistrados, kcalRecientes: kcalRecientes.slice(-14) },
    racha: rachaActual(estado.habitos, estado.registrosHabitos, hoy),
    rachaMaxima: rachaMasLarga(estado.habitos, estado.registrosHabitos),
    habitosCumplidos,
    sesiones: entreno.sesiones,
    tonelaje: entreno.tonelajeTotal,
    movimientos: estado.movimientos.length,
    comidas: suma(Object.values(estado.comidas), (lista) => lista.length),
    metasCumplidas: estado.metas.filter((m) => m.montoActual >= m.montoObjetivo).length,
    mesesColchon: fin.colchon.meses,
    mejorTasaAhorro,
    tierMax: tierDesbloqueado(nivel, entreno.sesiones, estado.progreso.tiersComprados),
    atributosMinimo: Math.min(atributos.fuerza, atributos.resistencia, atributos.nutricion, atributos.disciplina, atributos.finanzas),
    atributoGeneral: atributos.general,
  };
}

/** Fracción de categorías con presupuesto que se están respetando (0-1). */
function cumplimientoPresupuesto(estado, fin) {
  const conTope = CATEGORIAS_GASTO.filter((c) => Number(estado.presupuesto?.[c.id]) > 0);
  if (!conTope.length) return 0;
  const dentro = fin.presupuestoEval.filas.filter((f) => f.gastado <= f.tope).length;
  return dentro / conTope.length;
}

// --- Recompensas ----------------------------------------------------------

/**
 * Recorre los datos y paga todo lo pendiente. Devuelve {estado, ganancias, logros}.
 * Cada condición usa una clave única, así que llamarlo muchas veces no duplica premios.
 */
export function repartirRecompensas(estado) {
  let progreso = estado.progreso;
  const ganancias = [];
  const registrar = (tipo, clave, extra) => {
    const r = otorgar(progreso, tipo, clave, extra);
    progreso = r.progreso;
    if (r.ganado) ganancias.push(r.ganado);
  };

  // Hábitos
  for (const fecha of Object.keys(estado.registrosHabitos)) {
    const dia = estadoDia(estado.habitos, estado.registrosHabitos, fecha);
    for (const item of dia.items) {
      if (item.cumplido) registrar('habito_cumplido', `hab:${item.id}:${fecha}`, { texto: item.nombre });
    }
    if (dia.perfecto) registrar('dia_perfecto', `perfecto:${fecha}`, { texto: `Día perfecto (${fecha})` });
  }

  // Hitos de racha: se pagan una sola vez, cuando la mejor racha histórica los alcanza.
  const mejorRacha = rachaMasLarga(estado.habitos, estado.registrosHabitos);
  if (mejorRacha >= 7) registrar('racha_7', 'racha:7', { texto: 'Racha de 7 días' });
  if (mejorRacha >= 30) registrar('racha_30', 'racha:30', { texto: 'Racha de 30 días' });

  // Entrenamientos, en orden cronológico para que los PR se detecten bien
  const sesiones = [...estado.entrenamientos].sort((a, b) => (a.fecha + a.id).localeCompare(b.fecha + b.id));
  const previas = [];
  for (const sesion of sesiones) {
    const series = suma(sesion.ejercicios || [], (e) => (e.series || []).length);
    if (series > 0) {
      registrar('entreno_completado', `entreno:${sesion.id}`, { texto: `${sesion.nombre} (${sesion.fecha})`, xp: 45 + series * 3 });
    }
    for (const pr of detectarPR(previas, sesion)) {
      registrar('record_personal', `pr:${sesion.id}:${pr.ejercicioId}`, { texto: `Récord en ${pr.nombre}: ${pr.rm} kg estimados` });
    }
    previas.push(sesion);
  }

  // Semanas de entrenamiento completas
  const porSemana = new Map();
  for (const s of sesiones) {
    const semana = s.semana || inicioSemana(s.fecha);
    porSemana.set(semana, (porSemana.get(semana) || 0) + 1);
  }
  const semanaActual = inicioSemana(hoyISO());
  for (const [semana, cantidad] of porSemana) {
    if (cantidad >= (estado.perfil.diasEntreno || 3) && semana !== semanaActual) {
      registrar('semana_entreno', `semana:${semana}`, { texto: `Semana completa del ${semana}` });
    }
  }

  // Nutrición
  for (const fecha of Object.keys(estado.comidas)) {
    if (!(estado.comidas[fecha] || []).length) continue;
    const dia = diaNutricion(estado, fecha);
    if (dia.enMeta) registrar('dia_calorias', `kcal:${fecha}`, { texto: `Calorías en meta (${fecha})` });
    if (dia.evaluacion.prot.pct >= 95) registrar('dia_proteina', `prot:${fecha}`, { texto: `Proteína cubierta (${fecha})` });
    if (dia.evaluacion.agua.pct >= 100) registrar('dia_agua', `agua:${fecha}`, { texto: `Hidratación completa (${fecha})` });
  }

  // Finanzas
  const fechasConMovimiento = new Set();
  for (const mov of estado.movimientos) {
    registrar('gasto_registrado', `mov:${mov.id}`, { texto: mov.nota || 'Movimiento registrado' });
    fechasConMovimiento.add(mov.fecha);
  }
  for (const fecha of fechasConMovimiento) {
    registrar('dia_finanzas', `fin:${fecha}`, { texto: `Finanzas al día (${fecha})` });
  }
  for (const meta of estado.metas) {
    if (meta.montoActual >= meta.montoObjetivo && meta.montoObjetivo > 0) {
      registrar('meta_ahorro', `meta:${meta.id}`, { texto: `Meta cumplida: ${meta.nombre}` });
    }
  }
  const mesActual = mesDe(hoyISO());
  const conTope = CATEGORIAS_GASTO.filter((c) => Number(estado.presupuesto?.[c.id]) > 0);
  if (conTope.length >= 3) {
    for (const mes of [...new Set(estado.movimientos.map((m) => mesDe(m.fecha)))]) {
      if (mes >= mesActual) continue;
      const r = resumenMensual(estado.movimientos, mes);
      const dentro = conTope.every((c) => {
        const gastado = r.porCategoria.find((x) => x.categoria === c.id)?.monto || 0;
        return gastado <= Number(estado.presupuesto[c.id]);
      });
      if (dentro && r.ingresos > 0) registrar('mes_presupuesto', `pres:${mes}`, { texto: `Mes dentro del presupuesto (${mes})` });
    }
  }

  /* Diabetes: se paga registrar, nunca el valor obtenido. Un día "malo" da
     exactamente los mismos puntos que uno bueno, porque lo que queremos
     sostener es el hábito de medir y de anotarlo todo. */
  const fechasConGlicemia = new Map();
  for (const g of estado.glicemias) {
    registrar('glicemia_registrada', `gli:${g.id}`, { texto: 'Glicemia registrada' });
    fechasConGlicemia.set(g.fecha, (fechasConGlicemia.get(g.fecha) || 0) + 1);
  }
  for (const [fecha, cantidad] of fechasConGlicemia) {
    if (cantidad >= 3) registrar('dia_glicemias', `glidia:${fecha}`, { texto: `Controles del día (${fecha})` });
  }
  for (const d of estado.insulina) {
    registrar('insulina_registrada', `ins:${d.id}`, { texto: 'Dosis registrada' });
  }

  // Logros, con las estadísticas ya actualizadas
  const estadoParcial = { ...estado, progreso };
  const stats = estadisticas(estadoParcial);
  const revision = revisarLogros(progreso, stats);
  progreso = revision.progreso;

  return { estado: { ...estado, progreso }, ganancias, logros: revision.nuevos };
}

// --- Mutaciones ----------------------------------------------------------

export function marcarHabito(estado, habitoId, valor, fecha = hoyISO()) {
  const delDia = { ...(estado.registrosHabitos[fecha] || {}) };
  if (valor === null || valor === 0) delete delDia[habitoId];
  else delDia[habitoId] = valor;
  return { ...estado, registrosHabitos: { ...estado.registrosHabitos, [fecha]: delDia } };
}

export function agregarComida(estado, { alimentoId, gramos, momento }, fecha = hoyISO()) {
  const lista = [...(estado.comidas[fecha] || []), { id: nuevoId('com'), alimentoId, gramos: Number(gramos) || 0, momento: momento || 'Comida' }];
  return { ...estado, comidas: { ...estado.comidas, [fecha]: lista } };
}

export function quitarComida(estado, registroId, fecha = hoyISO()) {
  const lista = (estado.comidas[fecha] || []).filter((r) => r.id !== registroId);
  return { ...estado, comidas: { ...estado.comidas, [fecha]: lista } };
}

// --- Diabetes ---

export function guardarPerfilDiabetes(estado, perfil) {
  return { ...estado, diabetes: { ...estado.diabetes, ...perfil } };
}

export function registrarGlicemia(estado, datos) {
  const registro = {
    id: datos.id || nuevoId('gli'),
    fecha: datos.fecha || hoyISO(),
    hora: datos.hora || '',
    valor: Math.max(0, Number(datos.valor) || 0),
    momento: datos.momento || '',
    nota: (datos.nota || '').trim(),
  };
  if (!registro.valor) return estado;
  const resto = estado.glicemias.filter((g) => g.id !== registro.id);
  return { ...estado, glicemias: [...resto, registro] };
}

export function borrarGlicemia(estado, id) {
  return { ...estado, glicemias: estado.glicemias.filter((g) => g.id !== id) };
}

export function registrarInsulina(estado, datos) {
  const registro = {
    id: datos.id || nuevoId('ins'),
    fecha: datos.fecha || hoyISO(),
    hora: datos.hora || '',
    tipo: datos.tipo || 'bolo',
    unidades: Math.max(0, Number(datos.unidades) || 0),
    nota: (datos.nota || '').trim(),
  };
  if (!registro.unidades) return estado;
  const resto = estado.insulina.filter((d) => d.id !== registro.id);
  return { ...estado, insulina: [...resto, registro] };
}

export function borrarInsulina(estado, id) {
  return { ...estado, insulina: estado.insulina.filter((d) => d.id !== id) };
}

/** Guarda un producto escaneado en la despensa y lo deja buscable. */
export function guardarProducto(estado, producto) {
  if (!producto || !producto.id) return estado;
  registrarProducto(producto);
  const clave = producto.codigo || producto.id;
  return { ...estado, productos: { ...estado.productos, [clave]: producto } };
}

export function borrarProducto(estado, clave) {
  const resto = { ...estado.productos };
  const producto = resto[clave];
  delete resto[clave];
  if (producto) olvidarProducto(producto.id);
  return { ...estado, productos: resto };
}

export function sumarAgua(estado, ml, fecha = hoyISO()) {
  const actual = Number(estado.aguaExtra[fecha]) || 0;
  return { ...estado, aguaExtra: { ...estado.aguaExtra, [fecha]: Math.max(0, actual + ml) } };
}

export function guardarEntrenamiento(estado, sesion) {
  const fecha = sesion.fecha || hoyISO();
  const registro = {
    id: sesion.id || nuevoId('ses'),
    fecha,
    semana: inicioSemana(fecha),
    nombre: sesion.nombre || 'Entrenamiento',
    tier: sesion.tier || 1,
    duracionMin: Number(sesion.duracionMin) || 0,
    ejercicios: (sesion.ejercicios || []).map((e) => ({
      ejercicioId: e.ejercicioId,
      patron: e.patron,
      series: (e.series || []).filter((s) => Number(s.reps) > 0).map((s) => ({ peso: Number(s.peso) || 0, reps: Number(s.reps) || 0 })),
    })).filter((e) => e.series.length),
  };
  const resto = estado.entrenamientos.filter((s) => s.id !== registro.id);
  return { ...estado, entrenamientos: [...resto, registro] };
}

export function borrarEntrenamiento(estado, sesionId) {
  return { ...estado, entrenamientos: estado.entrenamientos.filter((s) => s.id !== sesionId) };
}

export function agregarMovimiento(estado, mov) {
  const registro = {
    id: mov.id || nuevoId('mov'),
    fecha: mov.fecha || hoyISO(),
    tipo: mov.tipo || 'gasto',
    categoria: mov.categoria || 'otros',
    monto: Math.abs(Number(mov.monto) || 0),
    nota: mov.nota || '',
  };
  const resto = estado.movimientos.filter((m) => m.id !== registro.id);
  return { ...estado, movimientos: [...resto, registro] };
}

export function borrarMovimiento(estado, movId) {
  return { ...estado, movimientos: estado.movimientos.filter((m) => m.id !== movId) };
}

export function guardarMeta(estado, meta) {
  const registro = {
    id: meta.id || nuevoId('meta'),
    nombre: meta.nombre || 'Meta',
    montoObjetivo: Number(meta.montoObjetivo) || 0,
    montoActual: Number(meta.montoActual) || 0,
    aporteMensual: Number(meta.aporteMensual) || 0,
    fechaLimite: meta.fechaLimite || '',
  };
  const resto = estado.metas.filter((m) => m.id !== registro.id);
  return { ...estado, metas: [...resto, registro] };
}

export function borrarMeta(estado, metaId) {
  return { ...estado, metas: estado.metas.filter((m) => m.id !== metaId) };
}

export function registrarPeso(estado, peso, fecha = hoyISO()) {
  const resto = estado.pesos.filter((p) => p.fecha !== fecha);
  const pesos = [...resto, { fecha, peso: Number(peso) }].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { ...estado, pesos, perfil: { ...estado.perfil, pesoKg: Number(peso) } };
}

export function guardarHabito(estado, habito) {
  const registro = {
    id: habito.id || nuevoId('hab'),
    nombre: habito.nombre,
    bloque: habito.bloque || 'manana',
    area: habito.area || 'orden',
    hora: habito.hora || '08:00',
    meta: Number(habito.meta) || 1,
    unidad: habito.unidad || '',
    activo: habito.activo !== false,
    creado: habito.creado || hoyISO(),
  };
  const resto = estado.habitos.filter((h) => h.id !== registro.id);
  return { ...estado, habitos: [...resto, registro] };
}

export function borrarHabito(estado, habitoId) {
  return { ...estado, habitos: estado.habitos.filter((h) => h.id !== habitoId) };
}

/** Semana ISO en curso y días de la semana, para vistas de calendario. */
export function semanaEnCurso(fecha = hoyISO()) {
  const lunes = inicioSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}
