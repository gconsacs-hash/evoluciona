// Lógica de la tienda: qué se puede canjear, qué efectos están activos y cómo se aplican.

import { ARTICULOS, MAPA_ARTICULOS, MAPA_PAQUETES } from '../datos/tienda-catalogo.js';
import { gastarTokens, acreditarTokens, nivelDesdeXP } from './progreso.js';

export function estadoArticulo(articulo, progreso) {
  const nivel = nivelDesdeXP(progreso.xp);
  const comprado = progreso.desbloqueos.includes(articulo.id);
  const nivelOk = !articulo.requiereNivel || nivel >= articulo.requiereNivel;
  return {
    ...articulo,
    comprado,
    nivelOk,
    alcanza: progreso.tokens >= articulo.costo,
    faltanTokens: Math.max(0, articulo.costo - progreso.tokens),
    faltanNiveles: articulo.requiereNivel ? Math.max(0, articulo.requiereNivel - nivel) : 0,
    puedeComprar: !comprado && nivelOk && progreso.tokens >= articulo.costo,
  };
}

export function catalogoConEstado(progreso) {
  return ARTICULOS.map((a) => estadoArticulo(a, progreso));
}

/** Canjea un artículo con tokens. Devuelve el progreso actualizado. */
export function canjear(progreso, articuloId) {
  const articulo = MAPA_ARTICULOS.get(articuloId);
  if (!articulo) return { ok: false, mensaje: 'Ese artículo no existe.', progreso };
  const estado = estadoArticulo(articulo, progreso);
  if (estado.comprado) return { ok: false, mensaje: 'Ya lo tienes.', progreso };
  if (!estado.nivelOk) return { ok: false, mensaje: `Necesitas nivel ${articulo.requiereNivel}. Te faltan ${estado.faltanNiveles}.`, progreso };
  if (!estado.alcanza) return { ok: false, mensaje: `Te faltan ${estado.faltanTokens} EVO. Sigue cumpliendo metas.`, progreso };

  const gasto = gastarTokens(progreso, articulo.costo, `Canje: ${articulo.nombre}`);
  if (!gasto.ok) return { ok: false, mensaje: gasto.mensaje, progreso };

  return {
    ok: true,
    mensaje: `Desbloqueaste "${articulo.nombre}".`,
    progreso: aplicarEfecto({ ...gasto.progreso, desbloqueos: [...gasto.progreso.desbloqueos, articulo.id] }, articulo.efecto),
  };
}

/** Aplica el efecto de un artículo al estado del avatar o a los tiers comprados. */
export function aplicarEfecto(progreso, efecto) {
  if (!efecto) return progreso;
  const [tipo, valor] = efecto.split(':');
  switch (tipo) {
    case 'tier': {
      const n = Number(valor);
      if (progreso.tiersComprados.includes(n)) return progreso;
      return { ...progreso, tiersComprados: [...progreso.tiersComprados, n] };
    }
    case 'atuendo': return { ...progreso, avatar: { ...progreso.avatar, atuendo: valor } };
    case 'aura': return { ...progreso, avatar: { ...progreso.avatar, aura: valor } };
    case 'skin': return { ...progreso, avatar: { ...progreso.avatar, skin: valor } };
    case 'mascota': return { ...progreso, avatar: { ...progreso.avatar, mascota: valor } };
    default: return progreso; // plan:, func: y tema: se leen desde `desbloqueos`
  }
}

/**
 * Aplica un paquete de pago: acredita tokens y desbloquea sus artículos.
 * Se llama solo después de un pago confirmado; hoy la app lo simula.
 */
export function aplicarPaquete(progreso, paqueteId) {
  const paquete = MAPA_PAQUETES.get(paqueteId);
  if (!paquete) return { ok: false, mensaje: 'Paquete no encontrado.', progreso };

  let estado = acreditarTokens(progreso, paquete.tokens || 0, `Compra: ${paquete.nombre}`);
  const nuevos = [];
  for (const articuloId of paquete.articulos || []) {
    if (estado.desbloqueos.includes(articuloId)) continue;
    estado = { ...estado, desbloqueos: [...estado.desbloqueos, articuloId] };
    estado = aplicarEfecto(estado, MAPA_ARTICULOS.get(articuloId)?.efecto);
    nuevos.push(articuloId);
  }
  return { ok: true, mensaje: `${paquete.nombre} activado: ${nuevos.length} artículos y ${paquete.tokens} EVO.`, progreso: estado, nuevos };
}

/** ¿Está activa una función comprada? (func:estadisticas, plan:deficit, tema:neon…) */
export function tieneEfecto(progreso, efecto) {
  return ARTICULOS.some((a) => a.efecto === efecto && progreso.desbloqueos.includes(a.id));
}

export function temasDesbloqueados(progreso) {
  return ARTICULOS
    .filter((a) => a.efecto.startsWith('tema:') && progreso.desbloqueos.includes(a.id))
    .map((a) => ({ id: a.efecto.split(':')[1], nombre: a.nombre }));
}

export function atuendosDesbloqueados(progreso) {
  const base = [{ id: 'basico', nombre: 'Básico' }];
  const comprados = ARTICULOS
    .filter((a) => a.efecto.startsWith('atuendo:') && progreso.desbloqueos.includes(a.id))
    .map((a) => ({ id: a.efecto.split(':')[1], nombre: a.nombre }));
  return [...base, ...comprados];
}

export function aurasDesbloqueadas(progreso) {
  const base = [{ id: '', nombre: 'Sin aura' }];
  const compradas = ARTICULOS
    .filter((a) => a.efecto.startsWith('aura:') && progreso.desbloqueos.includes(a.id))
    .map((a) => ({ id: a.efecto.split(':')[1], nombre: a.nombre }));
  return [...base, ...compradas];
}
