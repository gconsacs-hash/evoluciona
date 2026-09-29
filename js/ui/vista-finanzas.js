// Finanzas: movimientos, presupuesto, balance, metas de ahorro y proyecciones.

import {
  tarjeta, estadistica, barrasAgrupadas, barrasHorizontales, barraApilada,
  listaNotas, aviso, esc, vacio, tablaDatos, modal, cerrarModal, lineaTiempo,
} from './comun.js';
import {
  CATEGORIAS_GASTO, CATEGORIAS_INGRESO, MAPA_CATEGORIAS, consejosFinancieros,
  proyectarMeta, proyectarInteresCompuesto, sugerirPresupuesto, resumenMensual,
} from '../nucleo/finanzas.js';
import { agregarMovimiento, borrarMovimiento, guardarMeta, borrarMeta } from '../nucleo/almacen.js';
import { tieneEfecto } from '../nucleo/tienda.js';
import { clp, hoyISO, mesDe, nombreMes } from '../nucleo/utiles.js';

let mesVista = mesDe(hoyISO());
let tipoNuevo = 'gasto';

export const acciones = {
  cambiarTipo(ctx, elemento) {
    tipoNuevo = elemento.value;
    const contenedor = document.querySelector('[data-categorias]');
    if (contenedor) contenedor.innerHTML = opcionesCategoria(tipoNuevo);
  },
  guardarMovimiento(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    const monto = Number(d.monto);
    if (!monto || monto <= 0) { aviso('Ingresa un monto mayor que cero.', 'aviso'); return; }
    ctx.aplicar((estado) => agregarMovimiento(estado, {
      fecha: d.fecha || hoyISO(),
      tipo: d.tipo,
      categoria: d.categoria,
      monto,
      nota: d.nota?.trim() || '',
    }));
    formulario.reset();
    const campoFecha = formulario.querySelector('[name="fecha"]');
    if (campoFecha) campoFecha.value = hoyISO();
    aviso('Movimiento registrado. +4 XP', 'bien');
  },
  borrarMovimiento(ctx, elemento) {
    ctx.aplicar((estado) => borrarMovimiento(estado, elemento.dataset.id));
  },
  cambiarMes(ctx, elemento) {
    const [y, m] = mesVista.split('-').map(Number);
    const fecha = new Date(y, m - 1 + Number(elemento.dataset.delta), 1);
    mesVista = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    ctx.refrescar();
  },
  editarPresupuesto(ctx) {
    const { estado } = ctx;
    modal({
      titulo: 'Presupuesto mensual por categoría',
      ancho: 620,
      cuerpo: `
        <form data-accion="guardarPresupuesto" class="formulario">
          <p class="tenue">Define cuánto quieres gastar como máximo en cada categoría. Déjalo en cero si no quieres controlarla.</p>
          <div class="presupuesto-editor">
            ${CATEGORIAS_GASTO.map((c) => `<label>${c.icono} ${esc(c.nombre)}
              <input type="number" name="${c.id}" min="0" step="1000" value="${Number(estado.presupuesto?.[c.id]) || 0}"></label>`).join('')}
          </div>
          <div class="formulario__pie">
            <button type="button" class="boton" data-accion="sugerirPresupuesto">Sugerir con la regla 50/30/20</button>
            <button type="submit" class="boton boton--principal">Guardar presupuesto</button>
          </div>
        </form>`,
    });
  },
  sugerirPresupuesto(ctx) {
    const ingreso = Number(ctx.estado.perfil.ingresoMensual) || ctx.stats.finanzas.resumen.ingresos;
    if (!ingreso) { aviso('Primero registra tu ingreso mensual en el perfil.', 'aviso'); return; }
    const sugerido = sugerirPresupuesto(ingreso);
    for (const [cat, valor] of Object.entries(sugerido)) {
      const campo = document.querySelector(`[name="${cat}"]`);
      if (campo) campo.value = valor;
    }
    aviso('Presupuesto sugerido cargado. Revísalo y guarda.', 'info');
  },
  guardarPresupuesto(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    const presupuesto = {};
    for (const c of CATEGORIAS_GASTO) presupuesto[c.id] = Number(d[c.id]) || 0;
    ctx.aplicar((estado) => ({ ...estado, presupuesto }));
    cerrarModal();
    aviso('Presupuesto guardado.', 'bien');
  },
  nuevaMeta(ctx) {
    const limite = tieneEfecto(ctx.estado.progreso, 'func:metas_multiples') ? 99 : 3;
    if (ctx.estado.metas.length >= limite) {
      aviso('Llegaste al límite de 3 metas. Se amplía canjeando "Metas de ahorro ilimitadas" en la tienda.', 'aviso', 5200);
      return;
    }
    abrirMeta(ctx, null);
  },
  editarMeta(ctx, elemento) { abrirMeta(ctx, ctx.estado.metas.find((m) => m.id === elemento.dataset.id)); },
  guardarMeta(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    if (!d.nombre?.trim()) { aviso('Ponle nombre a la meta.', 'aviso'); return; }
    ctx.aplicar((estado) => guardarMeta(estado, {
      id: d.id || undefined,
      nombre: d.nombre.trim(),
      montoObjetivo: Number(d.montoObjetivo) || 0,
      montoActual: Number(d.montoActual) || 0,
      aporteMensual: Number(d.aporteMensual) || 0,
      fechaLimite: d.fechaLimite || '',
    }));
    cerrarModal();
  },
  borrarMeta(ctx, elemento) {
    if (!confirm('¿Borrar esta meta?')) return;
    ctx.aplicar((estado) => borrarMeta(estado, elemento.dataset.id));
    cerrarModal();
  },
  aportarMeta(ctx, elemento) {
    const meta = ctx.estado.metas.find((m) => m.id === elemento.dataset.id);
    if (!meta) return;
    const monto = Number(prompt(`¿Cuánto aportas a "${meta.nombre}"?`, meta.aporteMensual || 0));
    if (!monto || monto <= 0) return;
    ctx.aplicar((estado) => guardarMeta(estado, { ...meta, montoActual: meta.montoActual + monto }));
    aviso(`Aportaste ${clp(monto)} a ${meta.nombre}.`, 'bien');
  },
  verProyeccion(ctx) {
    const { stats, estado } = ctx;
    const aporte = Math.max(0, Math.round(stats.finanzas.resumen.ahorroReal));
    const proy = proyectarInteresCompuesto({ inicial: stats.finanzas.acumulado, aporteMensual: aporte, tasaAnual: 0.05, meses: 120 });
    modal({
      titulo: 'Si sigues ahorrando así',
      ancho: 640,
      cuerpo: `
        <p class="tenue">Partiendo de ${clp(stats.finanzas.acumulado)} y aportando ${clp(aporte)} al mes a un 5% anual
          (rentabilidad conservadora de un depósito o fondo simple).</p>
        <div class="rejilla rejilla--3">
          ${estadistica({ valor: clp(proy.saldoFinal), etiqueta: 'A los 10 años' })}
          ${estadistica({ valor: clp(proy.aportadoTotal), etiqueta: 'Lo que pusiste tú' })}
          ${estadistica({ valor: clp(proy.interesGanado), etiqueta: 'Lo que generó el interés', tono: 'bien' })}
        </div>
        ${lineaTiempo({
        puntos: proy.puntos.map((p) => ({ etiqueta: `mes ${p.mes}`, valor: p.saldo })),
        formato: clp,
        alto: 180,
      })}
        ${tablaDatos({
        columnas: ['Mes', 'Saldo', 'Aportado', 'Interés'],
        filas: proy.puntos.map((p) => [p.mes, clp(p.saldo), clp(p.aportado), clp(p.interes)]),
        titulo: 'Ver la tabla mes a mes',
      })}
        <p class="tenue">${aporte === 0 ? 'Con un aporte de cero el ahorro no crece: la proyección solo se mueve si hay excedente mensual.' : 'El interés compuesto es lento al principio y brutal al final. Por eso importa empezar, no acertar el momento.'}</p>`,
    });
  },
};

function abrirMeta(ctx, meta) {
  const m = meta || { id: '', nombre: '', montoObjetivo: 0, montoActual: 0, aporteMensual: 0, fechaLimite: '' };
  modal({
    titulo: meta ? 'Editar meta' : 'Nueva meta de ahorro',
    cuerpo: `
      <form data-accion="guardarMeta" class="formulario">
        <input type="hidden" name="id" value="${esc(m.id)}">
        <label>Nombre<input name="nombre" value="${esc(m.nombre)}" placeholder="Ej: Fondo de emergencia, viaje, pie de auto" required></label>
        <div class="formulario__fila">
          <label>Monto objetivo<input type="number" name="montoObjetivo" min="0" step="10000" value="${m.montoObjetivo}"></label>
          <label>Ya tengo ahorrado<input type="number" name="montoActual" min="0" step="10000" value="${m.montoActual}"></label>
        </div>
        <div class="formulario__fila">
          <label>Aporte mensual<input type="number" name="aporteMensual" min="0" step="10000" value="${m.aporteMensual}"></label>
          <label>Fecha límite (opcional)<input type="date" name="fechaLimite" value="${esc(m.fechaLimite)}"></label>
        </div>
        <p class="tenue">Cumplir una meta entrega 400 XP y 50 ◈.</p>
        <div class="formulario__pie">
          ${meta ? `<button type="button" class="boton boton--peligro" data-accion="borrarMeta" data-id="${esc(meta.id)}">Borrar</button>` : ''}
          <button type="submit" class="boton boton--principal">Guardar</button>
        </div>
      </form>`,
  });
}

function opcionesCategoria(tipo) {
  if (tipo === 'ingreso') {
    return CATEGORIAS_INGRESO.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('');
  }
  if (tipo === 'ahorro') {
    return '<option value="ahorro">🐖 Ahorro o inversión</option>';
  }
  return CATEGORIAS_GASTO.map((c) => `<option value="${c.id}">${c.icono} ${esc(c.nombre)}</option>`).join('');
}

export function html(ctx) {
  const { estado, stats } = ctx;
  const fin = stats.finanzas;
  const r = mesVista === mesDe(hoyISO()) ? fin.resumen : recalcularMes(ctx, mesVista);
  const consejos = consejosFinancieros(r, fin.presupuestoEval, fin.serie);
  const metas = estado.metas.map((m) => proyectarMeta(m));

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Finanzas</h1>
        <p class="tenue">Cada movimiento registrado son 4 XP. Un mes completo dentro del presupuesto, 300 XP y 40 ◈.</p>
      </div>
      <div class="selector-fecha">
        <button class="boton-icono" data-accion="cambiarMes" data-delta="-1" aria-label="Mes anterior">‹</button>
        <span>${esc(nombreMes(mesVista))}</span>
        <button class="boton-icono" data-accion="cambiarMes" data-delta="1" aria-label="Mes siguiente">›</button>
      </div>
    </header>

    <div class="rejilla rejilla--4">
      ${estadistica({ valor: clp(r.ingresos), etiqueta: 'Ingresos del mes' })}
      ${estadistica({ valor: clp(r.gastos), etiqueta: 'Gastos del mes' })}
      ${estadistica({ valor: clp(r.ahorroReal), etiqueta: 'Ahorro del mes', detalle: `${r.tasaAhorro}% del ingreso`, tono: r.tasaAhorro >= 20 ? 'bien' : r.tasaAhorro >= 5 ? 'aviso' : 'mal' })}
      ${estadistica({ valor: `${fin.colchon.meses}`, etiqueta: 'Meses de colchón', detalle: `acumulado ${clp(fin.acumulado)}`, tono: fin.colchon.estado === 'excelente' || fin.colchon.estado === 'bien' ? 'bien' : 'aviso' })}
    </div>

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Registrar movimiento',
    cuerpo: `
      <form class="formulario" data-accion="guardarMovimiento">
        <div class="formulario__fila">
          <label>Tipo<select name="tipo" data-accion="cambiarTipo">
            <option value="gasto" ${tipoNuevo === 'gasto' ? 'selected' : ''}>Gasto</option>
            <option value="ingreso" ${tipoNuevo === 'ingreso' ? 'selected' : ''}>Ingreso</option>
            <option value="ahorro" ${tipoNuevo === 'ahorro' ? 'selected' : ''}>Ahorro o inversión</option>
          </select></label>
          <label>Monto<input type="number" name="monto" min="0" step="100" placeholder="0" required></label>
          <label>Fecha<input type="date" name="fecha" value="${hoyISO()}"></label>
        </div>
        <label>Categoría<select name="categoria" data-categorias>${opcionesCategoria(tipoNuevo)}</select></label>
        <label>Nota (opcional)<input name="nota" placeholder="Ej: supermercado del sábado"></label>
        <div class="formulario__pie"><button type="submit" class="boton boton--principal">Registrar</button></div>
      </form>`,
  })}
      ${tarjeta({
    titulo: 'Regla 50/30/20',
    extra: '<button class="boton boton--chico" data-accion="editarPresupuesto">Presupuesto</button>',
    cuerpo: r.ingresos
      ? barraApilada({
        total: r.ingresos,
        segmentos: [
          { nombre: 'Necesidades', valor: r.necesidades, color: '--s1' },
          { nombre: 'Gustos', valor: r.gustos, color: '--s2' },
          { nombre: 'Ahorro', valor: Math.max(0, r.ahorroReal), color: '--s3' },
        ],
      }) + `<table class="tabla tabla--compacta">
            <thead><tr><th>Grupo</th><th>Real</th><th>Ideal</th></tr></thead>
            <tbody>
              <tr><td>Necesidades</td><td>${r.regla.necesidadesPct}%</td><td class="tenue">50%</td></tr>
              <tr><td>Gustos</td><td>${r.regla.gustosPct}%</td><td class="tenue">30%</td></tr>
              <tr><td>Ahorro</td><td>${r.regla.ahorroPct}%</td><td class="tenue">20%</td></tr>
            </tbody></table>`
      : vacio('Registra tu ingreso del mes para comparar.'),
  })}
    </div>

    ${tarjeta({ titulo: 'Diagnóstico y consejos', cuerpo: listaNotas(consejos) || vacio('Sin datos suficientes.') })}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'En qué se fue la plata',
    cuerpo: r.porCategoria.length
      ? barrasHorizontales({
        datos: r.porCategoria.map((c) => ({ etiqueta: c.nombre, valor: c.monto, icono: c.icono, detalle: `${c.pct}% de los gastos · ${c.cantidad} movimientos` })),
        formato: clp,
      }) + tablaDatos({
        columnas: ['Categoría', 'Monto', '% de gastos', 'Movimientos'],
        filas: r.porCategoria.map((c) => [esc(c.nombre), clp(c.monto), `${c.pct}%`, c.cantidad]),
      })
      : vacio('Sin gastos registrados este mes.'),
  })}
      ${tarjeta({
    titulo: 'Historial mensual',
    cuerpo: fin.serie.length >= 2
      ? barrasAgrupadas({
        datos: fin.serie.map((s) => ({ etiqueta: s.mes.slice(5), ingresos: s.ingresos, gastos: s.gastos, ahorro: s.ahorro })),
        series: [
          { clave: 'ingresos', nombre: 'Ingresos', color: '--s1' },
          { clave: 'gastos', nombre: 'Gastos', color: '--s2' },
          { clave: 'ahorro', nombre: 'Ahorro', color: '--s3' },
        ],
        formato: clp,
      }) + tablaDatos({
        columnas: ['Mes', 'Ingresos', 'Gastos', 'Ahorro', 'Tasa'],
        filas: fin.serie.map((s) => [s.mes, clp(s.ingresos), clp(s.gastos), clp(s.ahorro), `${s.tasaAhorro}%`]),
      })
      : vacio('Necesitas al menos dos meses con movimientos.'),
  })}
    </div>

    ${tarjeta({
    titulo: 'Presupuesto del mes',
    extra: '<button class="boton boton--chico" data-accion="editarPresupuesto">Editar</button>',
    cuerpo: fin.presupuestoEval.filas.length
      ? `<div class="presupuesto">${fin.presupuestoEval.filas.map((f) => `
          <div class="pres-fila">
            <div class="pres-fila__cab">
              <span>${f.icono} ${esc(f.nombre)}</span>
              <span class="marca marca--${f.estado === 'mal' ? 'mal' : f.estado === 'aviso' ? 'aviso' : 'bien'}">
                ${f.estado === 'mal' ? '✕ excedido' : f.estado === 'aviso' ? '! acelerado' : '✓ al día'}</span>
            </div>
            <div class="macro__pista">
              <div class="macro__relleno macro__relleno--${f.estado === 'mal' ? 'mal' : f.estado === 'aviso' ? 'aviso' : 'bien'}" style="width:${Math.min(100, f.pct)}%"></div>
            </div>
            <div class="pres-fila__pie tenue">${clp(f.gastado)} de ${clp(f.tope)} · ${f.pct}% · ${f.disponible >= 0 ? `quedan ${clp(f.disponible)}` : `exceso ${clp(-f.disponible)}`}</div>
          </div>`).join('')}</div>`
      : vacio('Todavía no defines presupuesto. Es el paso que más ordena el mes.'),
  })}

    ${tarjeta({
    titulo: 'Metas de ahorro',
    extra: `<div class="botones">
      <button class="boton boton--chico" data-accion="verProyeccion">Ver proyección</button>
      <button class="boton boton--chico boton--principal" data-accion="nuevaMeta">+ Nueva meta</button>
    </div>`,
    cuerpo: metas.length
      ? `<div class="metas">${metas.map((m) => `
          <article class="meta ${m.cumplida ? 'meta--lista' : ''}">
            <header>
              <div><strong>${esc(m.nombre)}</strong>
                <span class="tenue">${clp(m.montoActual)} de ${clp(m.montoObjetivo)}</span></div>
              <span class="ficha ficha--chica">${m.pct}%</span>
            </header>
            <div class="macro__pista"><div class="macro__relleno macro__relleno--${m.cumplida ? 'bien' : 'aviso'}" style="width:${Math.min(100, m.pct)}%"></div></div>
            <p class="tenue">${esc(m.mensaje)}</p>
            <div class="botones">
              <button class="boton boton--chico boton--principal" data-accion="aportarMeta" data-id="${esc(m.id)}">Aportar</button>
              <button class="boton boton--chico" data-accion="editarMeta" data-id="${esc(m.id)}">Editar</button>
            </div>
          </article>`).join('')}</div>`
      : vacio('Sin metas todavía. La primera debería ser el fondo de emergencia: ' + clp(fin.colchon.objetivoMonto || 0) + '.'),
  })}

    ${tarjeta({
    titulo: `Movimientos de ${nombreMes(mesVista)}`,
    extra: `<span class="tenue">${r.movimientos.length} registros</span>`,
    cuerpo: r.movimientos.length
      ? `<table class="tabla">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Nota</th><th>Monto</th><th></th></tr></thead>
          <tbody>${r.movimientos.map((m) => `<tr>
            <td class="tenue">${m.fecha.slice(5)}</td>
            <td>${m.tipo === 'ingreso' ? '↑ Ingreso' : m.tipo === 'ahorro' ? '🐖 Ahorro' : '↓ Gasto'}</td>
            <td>${esc(MAPA_CATEGORIAS.get(m.categoria)?.nombre || (m.categoria === 'ahorro' ? 'Ahorro' : CATEGORIAS_INGRESO.find((c) => c.id === m.categoria)?.nombre || m.categoria))}</td>
            <td class="tenue">${esc(m.nota)}</td>
            <td class="num">${clp(m.monto)}</td>
            <td><button class="boton-icono" data-accion="borrarMovimiento" data-id="${esc(m.id)}" aria-label="Borrar">✕</button></td>
          </tr>`).join('')}</tbody>
        </table>`
      : vacio('Sin movimientos este mes.'),
  })}

    ${tarjeta({
    titulo: 'Fondo de emergencia',
    cuerpo: `<p class="nota nota--${fin.colchon.estado === 'excelente' || fin.colchon.estado === 'bien' ? 'bien' : 'aviso'}">
        <span class="nota__icono">${fin.colchon.estado === 'excelente' || fin.colchon.estado === 'bien' ? '✓' : '!'}</span>
        <span>${esc(fin.colchon.mensaje)}</span></p>
      <p class="tenue">Gasto mensual promedio: ${clp(fin.promedioGastos)} · objetivo de 6 meses: ${clp(fin.colchon.objetivoMonto || 0)}.
        El ahorro acumulado suma tus aportes marcados como ahorro más el excedente de cada mes, partiendo del saldo inicial que declaraste en tu perfil.</p>`,
  })}
  </div>`;
}

function recalcularMes(ctx, mes) {
  // Un mes distinto al actual se recalcula aparte, sin tocar las estadísticas globales.
  return resumenMensual(ctx.estado.movimientos, mes);
}
