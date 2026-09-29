// Progreso: experiencia, niveles, tokens EVO, logros y atributos del avatar.
// Es el corazón del juego: todo lo que el usuario hace en las otras tres áreas entra por aquí.

import { limitar, redondear, suma, hoyISO } from './utiles.js';

export const MONEDA = { simbolo: '◈', nombre: 'EVO', plural: 'EVO' };

/**
 * Reglas de recompensa. Cada evento da XP (progreso del avatar) y tokens (moneda gastable).
 * Un evento se registra una sola vez por clave de idempotencia (ver otorgar()).
 */
export const REGLAS = {
  habito_cumplido: { xp: 10, tokens: 1, texto: 'Hábito cumplido' },
  dia_perfecto: { xp: 60, tokens: 5, texto: 'Día perfecto de rutina' },
  racha_7: { xp: 120, tokens: 12, texto: 'Racha de 7 días' },
  racha_30: { xp: 500, tokens: 60, texto: 'Racha de 30 días' },
  entreno_completado: { xp: 45, tokens: 8, texto: 'Entrenamiento completado' },
  serie_registrada: { xp: 3, tokens: 0, texto: 'Serie registrada' },
  record_personal: { xp: 80, tokens: 15, texto: 'Récord personal' },
  semana_entreno: { xp: 150, tokens: 15, texto: 'Semana de entrenamiento completa' },
  dia_calorias: { xp: 30, tokens: 5, texto: 'Día en meta calórica' },
  dia_proteina: { xp: 20, tokens: 3, texto: 'Proteína del día cubierta' },
  dia_agua: { xp: 15, tokens: 2, texto: 'Hidratación del día completa' },
  /* En diabetes se premia SOLO el acto de medir y registrar, nunca el número.
     Dar puntos por "buena" glicemia sería castigar a alguien por un valor que
     no controla del todo, y empujaría a no registrar los días malos, que son
     justamente los que el médico necesita ver. */
  glicemia_registrada: { xp: 6, tokens: 1, texto: 'Glicemia registrada' },
  dia_glicemias: { xp: 20, tokens: 2, texto: 'Día con controles completos' },
  insulina_registrada: { xp: 4, tokens: 0, texto: 'Dosis registrada' },
  gasto_registrado: { xp: 4, tokens: 0, texto: 'Movimiento registrado' },
  dia_finanzas: { xp: 15, tokens: 2, texto: 'Día con finanzas al día' },
  mes_presupuesto: { xp: 300, tokens: 40, texto: 'Mes dentro del presupuesto' },
  meta_ahorro: { xp: 400, tokens: 50, texto: 'Meta de ahorro cumplida' },
  subir_nivel: { xp: 0, tokens: 10, texto: 'Nivel alcanzado' },
  logro: { xp: 0, tokens: 0, texto: 'Logro desbloqueado' },
};

/** XP acumulada necesaria para alcanzar un nivel. Curva suave al principio, exigente después. */
export function xpParaNivel(nivel) {
  if (nivel <= 1) return 0;
  return Math.round(60 * (nivel - 1) * (nivel - 1) + 140 * (nivel - 1));
}

export function nivelDesdeXP(xp) {
  let nivel = 1;
  while (nivel < 100 && xp >= xpParaNivel(nivel + 1)) nivel++;
  return nivel;
}

export function detalleNivel(xp) {
  const nivel = nivelDesdeXP(xp);
  const base = xpParaNivel(nivel);
  const siguiente = xpParaNivel(nivel + 1);
  return {
    nivel,
    xp,
    xpEnNivel: xp - base,
    xpNecesaria: siguiente - base,
    pct: siguiente > base ? redondear(((xp - base) / (siguiente - base)) * 100, 0) : 100,
    xpFaltante: Math.max(0, siguiente - xp),
  };
}

/** 10 etapas evolutivas del avatar, una cada 3 niveles. */
export const ETAPAS = [
  { etapa: 1, nombre: 'Despertar', desde: 1, descripcion: 'Empiezas. Nada que demostrar todavía.' },
  { etapa: 2, nombre: 'Constante', desde: 3, descripcion: 'Ya no dependes de las ganas. Apareces.' },
  { etapa: 3, nombre: 'Activo', desde: 6, descripcion: 'El cuerpo empieza a responder.' },
  { etapa: 4, nombre: 'Firme', desde: 9, descripcion: 'Fuerza visible y rutina estable.' },
  { etapa: 5, nombre: 'Atlético', desde: 12, descripcion: 'Rendimiento y estética juntos.' },
  { etapa: 6, nombre: 'Forjado', desde: 16, descripcion: 'Cargas serias, hábitos automáticos.' },
  { etapa: 7, nombre: 'Titán', desde: 20, descripcion: 'Fuerza notable y finanzas ordenadas.' },
  { etapa: 8, nombre: 'Maestro', desde: 26, descripcion: 'Controlas las cuatro áreas sin esfuerzo.' },
  { etapa: 9, nombre: 'Leyenda', desde: 33, descripcion: 'Referencia para los demás.' },
  { etapa: 10, nombre: 'Ascendido', desde: 42, descripcion: 'Evolución completa.' },
];

export function etapaDesdeNivel(nivel) {
  let actual = ETAPAS[0];
  for (const e of ETAPAS) if (nivel >= e.desde) actual = e;
  return actual;
}

/**
 * Atributos del avatar, 0-100, derivados de datos reales.
 * fuerza: cargas y récords. resistencia: cardio y constancia semanal.
 * nutricion: días en meta. disciplina: rachas de hábitos. finanzas: puntaje financiero.
 */
export function calcularAtributos(datos) {
  const {
    tonelajeTotal = 0, sesiones = 0, recordsRM = 0, pesoCorporal = 70,
    diasEnMetaNutricion = 0, diasRegistradosNutricion = 0,
    disciplina = 0, puntajeFinanciero = 0, minutosCardio = 0,
  } = datos;

  const fuerzaRelativa = pesoCorporal ? recordsRM / pesoCorporal : 0;
  const fuerza = limitar(fuerzaRelativa * 22 + Math.log10(1 + tonelajeTotal / 1000) * 18, 0, 100);
  const resistencia = limitar(Math.log10(1 + minutosCardio / 10) * 32 + sesiones * 0.55, 0, 100);
  const nutricion = diasRegistradosNutricion
    ? limitar((diasEnMetaNutricion / Math.max(diasRegistradosNutricion, 10)) * 100, 0, 100)
    : 0;

  const atributos = {
    fuerza: Math.round(fuerza),
    resistencia: Math.round(resistencia),
    nutricion: Math.round(nutricion),
    disciplina: Math.round(limitar(disciplina, 0, 100)),
    finanzas: Math.round(limitar(puntajeFinanciero, 0, 100)),
  };
  atributos.general = Math.round(suma(Object.values(atributos)) / 5);
  return atributos;
}

/**
 * Registra un evento de recompensa. Devuelve el nuevo estado y lo que se ganó.
 * `clave` hace el evento idempotente: "habito_cumplido:hab_1:2026-09-28" no se paga dos veces.
 */
export function otorgar(progreso, tipo, clave, extra = {}) {
  const regla = REGLAS[tipo];
  if (!regla) return { progreso, ganado: null };
  if (clave && progreso.eventos[clave]) return { progreso, ganado: null };

  const xp = extra.xp ?? regla.xp;
  const tokens = extra.tokens ?? regla.tokens;
  const nivelAntes = nivelDesdeXP(progreso.xp);

  const nuevo = {
    ...progreso,
    xp: progreso.xp + xp,
    tokens: progreso.tokens + tokens,
    tokensGanadosTotal: progreso.tokensGanadosTotal + tokens,
    eventos: clave ? { ...progreso.eventos, [clave]: hoyISO() } : progreso.eventos,
    historial: [
      { tipo, texto: extra.texto || regla.texto, xp, tokens, fecha: hoyISO(), sello: Date.now() },
      ...progreso.historial,
    ].slice(0, 300),
  };

  const nivelDespues = nivelDesdeXP(nuevo.xp);
  const subidas = [];
  for (let n = nivelAntes + 1; n <= nivelDespues; n++) {
    nuevo.tokens += REGLAS.subir_nivel.tokens;
    nuevo.tokensGanadosTotal += REGLAS.subir_nivel.tokens;
    nuevo.historial.unshift({ tipo: 'subir_nivel', texto: `Nivel ${n} alcanzado`, xp: 0, tokens: REGLAS.subir_nivel.tokens, fecha: hoyISO(), sello: Date.now() });
    subidas.push(n);
  }

  return {
    progreso: nuevo,
    ganado: { xp, tokens: tokens + subidas.length * REGLAS.subir_nivel.tokens, texto: extra.texto || regla.texto, subidas },
  };
}

export function gastarTokens(progreso, costo, concepto) {
  if (progreso.tokens < costo) return { progreso, ok: false, mensaje: `Te faltan ${costo - progreso.tokens} ${MONEDA.plural}.` };
  return {
    ok: true,
    mensaje: `Canjeaste ${costo} ${MONEDA.plural}.`,
    progreso: {
      ...progreso,
      tokens: progreso.tokens - costo,
      tokensGastadosTotal: progreso.tokensGastadosTotal + costo,
      historial: [{ tipo: 'canje', texto: concepto, xp: 0, tokens: -costo, fecha: hoyISO(), sello: Date.now() }, ...progreso.historial].slice(0, 300),
    },
  };
}

export function acreditarTokens(progreso, cantidad, concepto) {
  return {
    ...progreso,
    tokens: progreso.tokens + cantidad,
    tokensGanadosTotal: progreso.tokensGanadosTotal + cantidad,
    historial: [{ tipo: 'compra', texto: concepto, xp: 0, tokens: cantidad, fecha: hoyISO(), sello: Date.now() }, ...progreso.historial].slice(0, 300),
  };
}

// --- Logros ---------------------------------------------------------------

export const LOGROS = [
  { id: 'primer_paso', nombre: 'Primer paso', desc: 'Completa tu primer hábito', icono: '👣', tokens: 3, prueba: (e) => e.habitosCumplidos >= 1 },
  { id: 'primer_entreno', nombre: 'Se rompió el hielo', desc: 'Registra tu primer entrenamiento', icono: '🏋️', tokens: 5, prueba: (e) => e.sesiones >= 1 },
  { id: 'primer_peso', nombre: 'Contabilidad viva', desc: 'Registra tu primer movimiento de dinero', icono: '💰', tokens: 5, prueba: (e) => e.movimientos >= 1 },
  { id: 'primer_plato', nombre: 'Ojo al plato', desc: 'Registra tu primera comida', icono: '🍽️', tokens: 3, prueba: (e) => e.comidas >= 1 },
  { id: 'racha_7', nombre: 'Semana limpia', desc: '7 días de racha en tu rutina', icono: '🔥', tokens: 15, prueba: (e) => e.racha >= 7 },
  { id: 'racha_30', nombre: 'Mes de hierro', desc: '30 días de racha', icono: '⚡', tokens: 60, prueba: (e) => e.racha >= 30 },
  { id: 'racha_100', nombre: 'Imparable', desc: '100 días de racha', icono: '🌟', tokens: 200, prueba: (e) => e.racha >= 100 },
  { id: 'diez_entrenos', nombre: 'Rutina instalada', desc: '10 entrenamientos', icono: '💪', tokens: 20, prueba: (e) => e.sesiones >= 10 },
  { id: 'cincuenta_entrenos', nombre: 'Veterano', desc: '50 entrenamientos', icono: '🛡️', tokens: 70, prueba: (e) => e.sesiones >= 50 },
  { id: 'cien_entrenos', nombre: 'Forjado en el hierro', desc: '100 entrenamientos', icono: '🔨', tokens: 150, prueba: (e) => e.sesiones >= 100 },
  { id: 'tonelaje_10k', nombre: '10 toneladas', desc: '10.000 kg de tonelaje acumulado', icono: '🧱', tokens: 25, prueba: (e) => e.tonelaje >= 10000 },
  { id: 'tonelaje_100k', nombre: '100 toneladas', desc: '100.000 kg de tonelaje acumulado', icono: '🏗️', tokens: 120, prueba: (e) => e.tonelaje >= 100000 },
  { id: 'cinco_prs', nombre: 'Rompedor de récords', desc: '5 récords personales', icono: '📈', tokens: 30, prueba: (e) => e.records >= 5 },
  { id: 'nutricion_7', nombre: 'Semana en la meta', desc: '7 días dentro de la meta calórica', icono: '🥗', tokens: 25, prueba: (e) => e.diasEnMeta >= 7 },
  { id: 'nutricion_30', nombre: 'Dieta bajo control', desc: '30 días dentro de la meta calórica', icono: '🧬', tokens: 90, prueba: (e) => e.diasEnMeta >= 30 },
  { id: 'hidratado', nombre: 'Bien hidratado', desc: '14 días cumpliendo el agua', icono: '💧', tokens: 20, prueba: (e) => e.diasAgua >= 14 },
  { id: 'ahorro_10', nombre: 'Ahorrador', desc: 'Cierra un mes con 10% de tasa de ahorro', icono: '🐖', tokens: 30, prueba: (e) => e.mejorTasaAhorro >= 10 },
  { id: 'ahorro_20', nombre: 'Constructor de patrimonio', desc: 'Cierra un mes con 20% de tasa de ahorro', icono: '🏦', tokens: 70, prueba: (e) => e.mejorTasaAhorro >= 20 },
  { id: 'colchon_3', nombre: 'Colchón de 3 meses', desc: 'Fondo de emergencia de 3 meses', icono: '🛟', tokens: 80, prueba: (e) => e.mesesColchon >= 3 },
  { id: 'colchon_6', nombre: 'Blindado', desc: 'Fondo de emergencia de 6 meses', icono: '🛡️', tokens: 180, prueba: (e) => e.mesesColchon >= 6 },
  { id: 'meta_cumplida', nombre: 'Meta cumplida', desc: 'Completa una meta de ahorro', icono: '🎯', tokens: 50, prueba: (e) => e.metasCumplidas >= 1 },
  { id: 'nivel_10', nombre: 'Nivel 10', desc: 'Alcanza el nivel 10', icono: '🔟', tokens: 40, prueba: (e) => e.nivel >= 10 },
  { id: 'nivel_20', nombre: 'Nivel 20', desc: 'Alcanza el nivel 20', icono: '🎖️', tokens: 100, prueba: (e) => e.nivel >= 20 },
  { id: 'equilibrio', nombre: 'Equilibrio total', desc: 'Los cinco atributos sobre 50', icono: '☯️', tokens: 120, prueba: (e) => e.atributosMinimo >= 50 },
  { id: 'maestro', nombre: 'Maestro', desc: 'Atributo general sobre 80', icono: '👑', tokens: 250, prueba: (e) => e.atributoGeneral >= 80 },
];

/** Revisa los logros pendientes contra las estadísticas actuales. */
export function revisarLogros(progreso, estadisticas) {
  const nuevos = [];
  let estado = progreso;
  for (const logro of LOGROS) {
    if (estado.logros.includes(logro.id)) continue;
    let cumple = false;
    try { cumple = !!logro.prueba(estadisticas); } catch { cumple = false; }
    if (!cumple) continue;
    estado = {
      ...estado,
      logros: [...estado.logros, logro.id],
      tokens: estado.tokens + logro.tokens,
      tokensGanadosTotal: estado.tokensGanadosTotal + logro.tokens,
      historial: [{ tipo: 'logro', texto: `Logro: ${logro.nombre}`, xp: 0, tokens: logro.tokens, fecha: hoyISO(), sello: Date.now() }, ...estado.historial].slice(0, 300),
    };
    nuevos.push(logro);
  }
  return { progreso: estado, nuevos };
}

export function progresoInicial() {
  return {
    xp: 0,
    tokens: 0,
    tokensGanadosTotal: 0,
    tokensGastadosTotal: 0,
    logros: [],
    eventos: {},
    historial: [],
    desbloqueos: [],        // ids de la tienda ya canjeados
    tiersComprados: [],
    // `rostro` guarda los parámetros de la caricatura, nunca la foto.
    avatar: { skin: 'base', atuendo: 'basico', aura: null, mascota: null, rostro: null },
  };
}
