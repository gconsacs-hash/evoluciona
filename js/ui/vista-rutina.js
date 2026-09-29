// Rutinas diarias: marcar hábitos, ver rachas y editar la lista.

import { tarjeta, estadistica, listaNotas, mapaCalor, barrasHorizontales, modal, cerrarModal, aviso, esc, tablaDatos } from './comun.js';
import {
  estadoDia, porBloques, consejosRutina, historialReciente,
  cumplimientoPorHabito, BLOQUES, AREAS,
} from '../nucleo/habitos.js';
import { marcarHabito, guardarHabito, borrarHabito } from '../nucleo/almacen.js';
import { tieneEfecto } from '../nucleo/tienda.js';
import { estadoPermiso, pedirPermiso, arrancarVigilancia, detenerVigilancia, vigilando } from '../ui/recordatorios-ui.js';
import { hoyISO, sumarDias, num } from '../nucleo/utiles.js';

let fechaVista = hoyISO();

export const acciones = {
  alternar(ctx, elemento) {
    const habitoId = elemento.dataset.id;
    const meta = Number(elemento.dataset.meta) || 1;
    const actual = Number(ctx.estado.registrosHabitos[fechaVista]?.[habitoId]) || 0;
    ctx.aplicar((estado) => marcarHabito(estado, habitoId, actual >= meta ? 0 : meta, fechaVista));
  },
  sumarCantidad(ctx, elemento) {
    const habitoId = elemento.dataset.id;
    const paso = Number(elemento.dataset.paso) || 1;
    const actual = Number(ctx.estado.registrosHabitos[fechaVista]?.[habitoId]) || 0;
    ctx.aplicar((estado) => marcarHabito(estado, habitoId, Math.max(0, actual + paso), fechaVista));
  },
  cambiarDia(ctx, elemento) {
    const delta = Number(elemento.dataset.delta) || 0;
    const nueva = sumarDias(fechaVista, delta);
    if (nueva > hoyISO()) { aviso('No puedes registrar días futuros.', 'aviso'); return; }
    fechaVista = nueva;
    ctx.refrescar();
  },
  hoy(ctx) { fechaVista = hoyISO(); ctx.refrescar(); },

  nuevoHabito(ctx) { abrirEditor(ctx, null); },
  editarHabito(ctx, elemento) {
    const habito = ctx.estado.habitos.find((h) => h.id === elemento.dataset.id);
    abrirEditor(ctx, habito);
  },
  guardarHabito(ctx, formulario, evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(formulario));
    if (!datos.nombre?.trim()) { aviso('Ponle un nombre al hábito.', 'aviso'); return; }
    ctx.aplicar((estado) => guardarHabito(estado, {
      id: datos.id || undefined,
      nombre: datos.nombre.trim(),
      bloque: datos.bloque,
      area: datos.area,
      hora: datos.hora,
      meta: Number(datos.meta) || 1,
      unidad: datos.unidad?.trim() || '',
      activo: true,
    }));
    cerrarModal();
    aviso('Hábito guardado.', 'bien');
  },
  borrarHabito(ctx, elemento) {
    const habito = ctx.estado.habitos.find((h) => h.id === elemento.dataset.id);
    if (!habito) return;
    if (!confirm(`¿Borrar "${habito.nombre}"? Se mantienen los registros pasados pero dejará de aparecer.`)) return;
    ctx.aplicar((estado) => borrarHabito(estado, habito.id));
    cerrarModal();
  },
  pausarHabito(ctx, elemento) {
    const habito = ctx.estado.habitos.find((h) => h.id === elemento.dataset.id);
    if (!habito) return;
    ctx.aplicar((estado) => guardarHabito(estado, { ...habito, activo: !habito.activo }));
  },

  async activarAvisos(ctx) {
    const permiso = await pedirPermiso();
    if (permiso.estado !== 'concedido') {
      aviso(permiso.texto, permiso.estado === 'denegado' ? 'mal' : 'aviso', 5000);
      ctx.refrescar();
      return;
    }
    arrancarVigilancia(() => ({ habitos: ctx.estado.habitos, registros: ctx.estado.registrosHabitos }));
    aviso('Avisos activados. Funcionan mientras la app esté abierta.', 'bien', 4500);
    ctx.refrescar();
  },
  apagarAvisos(ctx) {
    detenerVigilancia();
    aviso('Avisos apagados.', 'info');
    ctx.refrescar();
  },
};

function abrirEditor(ctx, habito) {
  const h = habito || { id: '', nombre: '', bloque: 'manana', area: 'cuerpo', hora: '08:00', meta: 1, unidad: '' };
  modal({
    titulo: habito ? 'Editar hábito' : 'Nuevo hábito',
    cuerpo: `
      <form data-accion="guardarHabito" class="formulario">
        <input type="hidden" name="id" value="${esc(h.id)}">
        <label>Nombre<input name="nombre" value="${esc(h.nombre)}" placeholder="Ej: Caminar 30 minutos" required></label>
        <div class="formulario__fila">
          <label>Momento del día<select name="bloque">
            ${Object.entries(BLOQUES).map(([k, v]) => `<option value="${k}" ${h.bloque === k ? 'selected' : ''}>${v.icono} ${v.nombre}</option>`).join('')}
          </select></label>
          <label>Hora<input type="time" name="hora" value="${esc(h.hora)}"></label>
        </div>
        <div class="formulario__fila">
          <label>Área<select name="area">
            ${Object.entries(AREAS).map(([k, v]) => `<option value="${k}" ${h.area === k ? 'selected' : ''}>${v.nombre}</option>`).join('')}
          </select></label>
          <label>Meta diaria<input type="number" name="meta" min="1" step="1" value="${h.meta}"></label>
          <label>Unidad<input name="unidad" value="${esc(h.unidad)}" placeholder="pasos, páginas…"></label>
        </div>
        <p class="tenue">Si la meta es 1 y no pones unidad, el hábito funciona como un simple visto bueno.</p>
        <div class="formulario__pie">
          ${habito ? `<button type="button" class="boton boton--peligro" data-accion="borrarHabito" data-id="${esc(habito.id)}">Borrar</button>` : ''}
          <button type="submit" class="boton boton--principal">Guardar</button>
        </div>
      </form>`,
  });
}

export function html(ctx) {
  const { estado } = ctx;
  if (fechaVista > hoyISO()) fechaVista = hoyISO();
  const dia = estadoDia(estado.habitos, estado.registrosHabitos, fechaVista);
  const bloques = porBloques(dia);
  const cumplimiento = cumplimientoPorHabito(estado.habitos, estado.registrosHabitos, 30, hoyISO());
  const esHoy = fechaVista === hoyISO();

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Rutina diaria</h1>
        <p class="tenue">Cada hábito cumplido son 10 XP y 1 ${'◈'}. El día perfecto vale 5 más.</p>
      </div>
      <div class="selector-fecha">
        <button class="boton-icono" data-accion="cambiarDia" data-delta="-1" aria-label="Día anterior">‹</button>
        <span>${esc(etiquetaFecha(fechaVista))}</span>
        <button class="boton-icono" data-accion="cambiarDia" data-delta="1" aria-label="Día siguiente" ${esHoy ? 'disabled' : ''}>›</button>
        ${esHoy ? '' : '<button class="boton boton--chico" data-accion="hoy">Hoy</button>'}
      </div>
    </header>

    <div class="rejilla rejilla--4">
      ${estadistica({ valor: `${dia.cumplidos}/${dia.total}`, etiqueta: 'Cumplidos', detalle: `${dia.pct}% del día`, tono: dia.pct >= 80 ? 'bien' : 'aviso' })}
      ${estadistica({ valor: ctx.stats.racha, etiqueta: 'Racha actual', detalle: 'días seguidos sobre 80%' })}
      ${estadistica({ valor: ctx.stats.rachaMaxima, etiqueta: 'Mejor racha', detalle: 'tu récord' })}
      ${estadistica({ valor: ctx.stats.disciplina, etiqueta: 'Disciplina', detalle: 'atributo del avatar (0-100)' })}
    </div>

    ${bloques.map((b) => tarjeta({
    titulo: `${b.icono} ${b.nombre}`,
    extra: `<span class="tenue">${b.items.filter((i) => i.cumplido).length}/${b.items.length}</span>`,
    cuerpo: `<ul class="habitos">${b.items.map((i) => filaHabito(i)).join('')}</ul>`,
  })).join('')}

    ${tarjeta({
    titulo: 'Tus hábitos',
    extra: '<button class="boton boton--chico boton--principal" data-accion="nuevoHabito">+ Nuevo hábito</button>',
    cuerpo: `<ul class="habitos habitos--gestion">
        ${estado.habitos.map((h) => `<li>
          <div class="habito__info">
            <strong>${esc(h.nombre)}</strong>
            <span class="tenue">${BLOQUES[h.bloque]?.icono || ''} ${h.hora} · ${AREAS[h.area]?.nombre || ''} · meta ${h.meta} ${esc(h.unidad)}${h.activo ? '' : ' · en pausa'}</span>
          </div>
          <div class="habito__botones">
            <button class="boton boton--chico" data-accion="pausarHabito" data-id="${esc(h.id)}">${h.activo ? 'Pausar' : 'Reactivar'}</button>
            <button class="boton boton--chico" data-accion="editarHabito" data-id="${esc(h.id)}">Editar</button>
          </div>
        </li>`).join('')}
      </ul>`,
  })}

    ${tieneEfecto(estado.progreso, 'func:recordatorios') ? tarjeta({
    titulo: 'Recordatorios',
    extra: vigilando()
      ? '<button class="boton boton--chico" data-accion="apagarAvisos">Apagar</button>'
      : '<button class="boton boton--chico boton--principal" data-accion="activarAvisos">Activar avisos</button>',
    cuerpo: `<p class="tenue">${esc(estadoPermiso().texto)}
        ${vigilando() ? 'Te avisará a la hora de cada hábito que aún no hayas cumplido.' : ''}</p>
      <p class="nota nota--info"><span class="nota__icono">i</span><span>Esta app no tiene servidor, y sin servidor el
        navegador no puede despertar solo. Los avisos funcionan <strong>mientras la app esté abierta</strong>, aunque sea
        en segundo plano. Para lo que no puedes olvidar de verdad, usa además la alarma del teléfono.</span></p>`,
  }) : ''}

    ${tarjeta({ titulo: 'Consejos sobre tu rutina', cuerpo: listaNotas(consejosRutina(estado.habitos, estado.registrosHabitos, hoyISO())) || '<p class="vacio">Sin datos suficientes.</p>' })}

    <div class="rejilla rejilla--2">
      ${tarjeta({ titulo: 'Últimos 28 días', cuerpo: mapaCalor(historialReciente(estado.habitos, estado.registrosHabitos, 28, hoyISO())) })}
      ${tarjeta({
    titulo: 'Cumplimiento por hábito (30 días)',
    cuerpo: cumplimiento.length
      ? barrasHorizontales({
        datos: cumplimiento.map((h) => ({ etiqueta: h.nombre, valor: h.pct, detalle: `${h.cumplidos} de ${h.dias} días` })),
        formato: (v) => `${v}%`,
        maximo: 100,
      }) + tablaDatos({
        columnas: ['Hábito', 'Cumplidos', 'Días', '%'],
        filas: cumplimiento.map((h) => [esc(h.nombre), h.cumplidos, h.dias, `${h.pct}%`]),
      })
      : '<p class="vacio">Registra algunos días para ver esto.</p>',
  })}
    </div>
  </div>`;
}

function filaHabito(item) {
  const porCantidad = item.meta > 1;
  return `<li class="habito ${item.cumplido ? 'habito--listo' : ''}">
    <button class="casilla ${item.cumplido ? 'casilla--marcada' : ''}" data-accion="alternar" data-id="${esc(item.id)}" data-meta="${item.meta}"
      aria-pressed="${item.cumplido}" aria-label="${item.cumplido ? 'Desmarcar' : 'Marcar'} ${esc(item.nombre)}">${item.cumplido ? '✓' : ''}</button>
    <div class="habito__info">
      <strong>${esc(item.nombre)}</strong>
      <span class="tenue">${item.hora} · ${AREAS[item.area]?.nombre || ''}${porCantidad ? ` · ${num(item.valor)} de ${num(item.meta)} ${esc(item.unidad)}` : ''}</span>
      ${porCantidad ? `<div class="habito__barra"><div style="width:${item.pct}%"></div></div>` : ''}
    </div>
    ${porCantidad ? `<div class="habito__botones">
      <button class="boton-icono" data-accion="sumarCantidad" data-id="${esc(item.id)}" data-paso="${Math.max(1, Math.round(item.meta / 10))}" aria-label="Sumar">+</button>
      <button class="boton-icono" data-accion="sumarCantidad" data-id="${esc(item.id)}" data-paso="${-Math.max(1, Math.round(item.meta / 10))}" aria-label="Restar">−</button>
    </div>` : ''}
  </li>`;
}

function etiquetaFecha(iso) {
  const hoy = hoyISO();
  if (iso === hoy) return 'Hoy';
  if (iso === sumarDias(hoy, -1)) return 'Ayer';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
