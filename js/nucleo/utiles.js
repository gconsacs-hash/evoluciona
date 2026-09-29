// Utilidades compartidas. Sin dependencias, sin DOM: se puede probar en Node.

export const DIA_MS = 86400000;

/** Fecha local en formato YYYY-MM-DD (no usa toISOString para no saltar de día por UTC). */
export function hoyISO(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function desdeISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso, dias) {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + dias);
  return hoyISO(f);
}

export function diasEntre(isoA, isoB) {
  return Math.round((desdeISO(isoB) - desdeISO(isoA)) / DIA_MS);
}

/** Lunes de la semana de una fecha, en ISO. */
export function inicioSemana(iso) {
  const f = desdeISO(iso);
  const dow = (f.getDay() + 6) % 7; // 0 = lunes
  f.setDate(f.getDate() - dow);
  return hoyISO(f);
}

export function mesDe(iso) {
  return iso.slice(0, 7);
}

export function nombreMes(mesISO) {
  const [y, m] = mesISO.split('-').map(Number);
  const nombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${nombres[m - 1]} ${y}`;
}

export function clp(n) {
  const v = Math.round(Number(n) || 0);
  return '$' + v.toLocaleString('es-CL');
}

export function num(n, decimales = 0) {
  return (Number(n) || 0).toLocaleString('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function limitar(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function redondear(v, decimales = 1) {
  const f = 10 ** decimales;
  return Math.round(v * f) / f;
}

export function suma(lista, fn = (x) => x) {
  return lista.reduce((acc, x) => acc + (Number(fn(x)) || 0), 0);
}

export function agrupar(lista, fn) {
  const mapa = new Map();
  for (const item of lista) {
    const clave = fn(item);
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(item);
  }
  return mapa;
}

export function id(prefijo = 'x') {
  return `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Generador pseudoaleatorio con semilla: rutinas reproducibles para la misma semana. */
export function aleatorioConSemilla(semilla) {
  let s = 0;
  const texto = String(semilla);
  for (let i = 0; i < texto.length; i++) s = (s * 31 + texto.charCodeAt(i)) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function siguiente() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Baraja una copia de la lista usando un generador dado. */
export function barajar(lista, rnd = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function porcentaje(parte, total) {
  if (!total) return 0;
  return limitar((parte / total) * 100, 0, 999);
}
