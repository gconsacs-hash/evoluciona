// Tienda: canje con tokens ganados (vía gratuita) y paquetes de pago (vía comercial).

import { tarjeta, estadistica, aviso, esc, vacio, modal, cerrarModal, listaNotas } from './comun.js';
import { CATEGORIAS_TIENDA, PAQUETES, MAPA_PAQUETES, MAPA_ARTICULOS, valorEnTokens } from '../datos/tienda-catalogo.js';
import { catalogoConEstado, canjear, aplicarPaquete } from '../nucleo/tienda.js';
import { MONEDA, REGLAS, LOGROS } from '../nucleo/progreso.js';
import { clp, num } from '../nucleo/utiles.js';

let categoriaVista = 'todas';

export const acciones = {
  filtrar(ctx, elemento) { categoriaVista = elemento.dataset.cat; ctx.refrescar(); },

  canjear(ctx, elemento) {
    const articulo = MAPA_ARTICULOS.get(elemento.dataset.id);
    if (!articulo) return;
    let resultado;
    ctx.aplicar((estado) => {
      resultado = canjear(estado.progreso, articulo.id);
      return { ...estado, progreso: resultado.progreso };
    });
    aviso(resultado.mensaje, resultado.ok ? 'bien' : 'aviso', 4200);
  },

  verPaquete(ctx, elemento) {
    const paquete = MAPA_PAQUETES.get(elemento.dataset.id);
    if (!paquete) return;
    const yaComprado = ctx.estado.paquetesComprados.includes(paquete.id);
    modal({
      titulo: paquete.nombre,
      ancho: 560,
      cuerpo: `
        <p class="precio-grande">${clp(paquete.precio)} <span class="tenue">pago único</span></p>
        <ul class="lista-check">${paquete.incluye.map((i) => `<li>✓ ${esc(i)}</li>`).join('')}</ul>
        <p class="tenue">Equivale a ${num(valorEnTokens(paquete))} ${MONEDA.plural} si lo consiguieras cumpliendo metas.</p>
        <div class="aviso-pago">
          <strong>Modo demostración</strong>
          <p>Esta app no tiene pasarela de pago conectada, así que no se cobra nada y no se envía ningún dato.
          El botón de abajo activa el paquete localmente para que puedas probar el contenido y ver cómo funcionaría el negocio.</p>
        </div>
        <div class="formulario__pie">
          <button type="button" class="boton" data-accion="cerrar">Cancelar</button>
          <button type="button" class="boton boton--principal" data-accion="simularCompra" data-id="${esc(paquete.id)}" ${yaComprado ? 'disabled' : ''}>
            ${yaComprado ? 'Ya lo tienes' : 'Activar (simulado)'}</button>
        </div>`,
    });
  },

  simularCompra(ctx, elemento) {
    const paqueteId = elemento.dataset.id;
    let resultado;
    ctx.aplicar((estado) => {
      resultado = aplicarPaquete(estado.progreso, paqueteId);
      return { ...estado, progreso: resultado.progreso, paquetesComprados: [...estado.paquetesComprados, paqueteId] };
    });
    cerrarModal();
    aviso(resultado.mensaje, 'bien', 5000);
  },

  verNegocio() {
    modal({
      titulo: 'Cómo se financia esta app',
      ancho: 640,
      cuerpo: `
        <p>La app completa funciona gratis: todo el contenido del catálogo se puede conseguir cumpliendo metas reales.
          Los tokens no se pueden comprar con trampa: se ganan entrenando, comiendo bien, ahorrando y no rompiendo la racha.</p>
        <h3>Las dos vías</h3>
        <ul class="lista-check">
          <li><strong>Gratuita:</strong> ganas ${MONEDA.plural} cumpliendo metas y canjeas lo que quieras. Tarda más, pero llega al mismo lugar.</li>
          <li><strong>Pagada:</strong> compras un paquete y desbloqueas de golpe. Ahorras tiempo, no ventaja competitiva.</li>
        </ul>
        <h3>Por qué este modelo funciona</h3>
        <ul class="lista-check">
          <li>El usuario que no paga igual usa la app, genera racha y la recomienda. Es el motor de crecimiento.</li>
          <li>El que paga ya validó que la app le sirve: la conversión ocurre después del hábito, no antes.</li>
          <li>Un pago único (no suscripción) reduce la fricción y las bajas. El ingreso recurrente vendría de contenido nuevo.</li>
        </ul>
        <h3>Líneas de ingreso posibles</h3>
        <ul class="lista-check">
          <li>Paquetes de contenido (los de esta tienda) y bolsas de ${MONEDA.plural}.</li>
          <li>Planes de nutrición y rutinas firmados por profesionales, como contenido premium.</li>
          <li>Versión para gimnasios y entrenadores: panel para seguir a varios alumnos.</li>
          <li>Convenios con marcas de suplementos o supermercados en la lista de compras, siempre declarados.</li>
        </ul>
        <h3>Lo que falta para cobrar de verdad</h3>
        <p class="tenue">Una cuenta de comercio (Mercado Pago, Flow, Transbank o Stripe), un servidor mínimo que valide los pagos
          y guarde qué compró cada usuario, y cuentas de usuario. Hoy todos los datos viven solo en este dispositivo,
          que es justamente lo que hace que la app funcione sin internet y sin costos.</p>`,
    });
  },

  cerrar() { cerrarModal(); },
};

export function html(ctx) {
  const { estado, stats } = ctx;
  const catalogo = catalogoConEstado(estado.progreso);
  const visibles = categoriaVista === 'todas' ? catalogo : catalogo.filter((a) => a.cat === categoriaVista);
  const historial = estado.progreso.historial.slice(0, 25);
  const logrosPendientes = LOGROS.filter((l) => !estado.progreso.logros.includes(l.id));

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Tienda</h1>
        <p class="tenue">Todo se puede conseguir gratis cumpliendo metas. Los paquetes solo aceleran.</p>
      </div>
      <button class="boton boton--chico" data-accion="verNegocio">¿Cómo se financia?</button>
    </header>

    <div class="rejilla rejilla--4">
      ${estadistica({ valor: `${MONEDA.simbolo} ${num(estado.progreso.tokens)}`, etiqueta: `${MONEDA.plural} disponibles`, tono: 'bien' })}
      ${estadistica({ valor: num(estado.progreso.tokensGanadosTotal), etiqueta: 'Ganados en total' })}
      ${estadistica({ valor: num(estado.progreso.tokensGastadosTotal), etiqueta: 'Canjeados' })}
      ${estadistica({ valor: `${estado.progreso.desbloqueos.length}/${catalogo.length}`, etiqueta: 'Artículos desbloqueados' })}
    </div>

    ${tarjeta({
    titulo: 'Cómo se ganan tokens',
    cuerpo: `<div class="tabla-recompensas">
        ${Object.entries(REGLAS).filter(([, r]) => r.tokens > 0).map(([, r]) => `
          <div class="recompensa"><span>${esc(r.texto)}</span><strong>+${r.tokens} ${MONEDA.simbolo}</strong></div>`).join('')}
      </div>
      <p class="tenue g-nota">Los logros entregan entre 3 y 250 ${MONEDA.plural} extra. Te quedan ${logrosPendientes.length} por desbloquear,
        que suman ${num(logrosPendientes.reduce((a, l) => a + l.tokens, 0))} ${MONEDA.plural}.</p>`,
  })}

    ${tarjeta({
    titulo: 'Catálogo (se paga con tokens)',
    extra: `<div class="filtros">
      <button class="chip ${categoriaVista === 'todas' ? 'chip--activo' : ''}" data-accion="filtrar" data-cat="todas">Todo</button>
      ${CATEGORIAS_TIENDA.map((c) => `<button class="chip ${categoriaVista === c.id ? 'chip--activo' : ''}" data-accion="filtrar" data-cat="${c.id}">${c.icono} ${esc(c.nombre)}</button>`).join('')}
    </div>`,
    cuerpo: `<div class="catalogo">
        ${visibles.map((a) => `
          <article class="articulo ${a.comprado ? 'articulo--mio' : ''}">
            <header>
              <strong>${esc(a.nombre)}</strong>
              <span class="ficha ficha--chica">${MONEDA.simbolo} ${num(a.costo)}</span>
            </header>
            <p class="tenue">${esc(a.desc)}</p>
            ${a.requiereNivel ? `<p class="tenue">Requiere nivel ${a.requiereNivel}${a.faltanNiveles ? ` (te faltan ${a.faltanNiveles})` : ''}</p>` : ''}
            ${a.comprado
      ? '<span class="marca marca--bien">✓ desbloqueado</span>'
      : `<button class="boton boton--chico ${a.puedeComprar ? 'boton--principal' : ''}" data-accion="canjear" data-id="${esc(a.id)}" ${a.puedeComprar ? '' : 'disabled'}>
                  ${!a.nivelOk ? `Nivel ${a.requiereNivel}` : a.alcanza ? 'Canjear' : `Faltan ${num(a.faltanTokens)} ${MONEDA.simbolo}`}
                </button>`}
          </article>`).join('')}
      </div>`,
  })}

    ${tarjeta({
    titulo: 'Paquetes (vía de pago)',
    cuerpo: `<div class="paquetes">
        ${PAQUETES.map((p) => {
      const comprado = estado.paquetesComprados.includes(p.id);
      return `<article class="paquete ${p.destacado ? 'paquete--destacado' : ''} ${comprado ? 'paquete--mio' : ''}">
            ${p.destacado ? '<span class="cinta">El más completo</span>' : ''}
            <h3>${esc(p.nombre)}</h3>
            <p class="precio">${clp(p.precio)}</p>
            <ul class="lista-check">${p.incluye.map((i) => `<li>✓ ${esc(i)}</li>`).join('')}</ul>
            <p class="tenue">Valor equivalente: ${num(valorEnTokens(p))} ${MONEDA.plural}</p>
            <button class="boton ${p.destacado ? 'boton--principal' : ''}" data-accion="verPaquete" data-id="${esc(p.id)}" ${comprado ? 'disabled' : ''}>
              ${comprado ? 'Activado' : 'Ver detalle'}</button>
          </article>`;
    }).join('')}
      </div>
      ${listaNotas([{ tono: 'info', texto: 'Los pagos están en modo demostración: no hay pasarela conectada, no se cobra nada y ningún dato sale de tu dispositivo.' }])}`,
  })}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Movimientos de tokens',
    cuerpo: historial.length
      ? `<ul class="ledger">${historial.map((h) => `<li>
            <span>${esc(h.texto)}</span>
            <span class="tenue">${h.fecha}</span>
            <strong class="${h.tokens >= 0 ? 'positivo' : 'negativo'}">${h.tokens >= 0 ? '+' : ''}${h.tokens} ${MONEDA.simbolo}</strong>
            ${h.xp ? `<span class="tenue">+${h.xp} XP</span>` : '<span></span>'}
          </li>`).join('')}</ul>`
      : vacio('Todavía no hay movimientos. Cumple tu primer hábito.'),
  })}
      ${tarjeta({
    titulo: 'Logros',
    extra: `<span class="tenue">${estado.progreso.logros.length} de ${LOGROS.length}</span>`,
    cuerpo: `<ul class="logros logros--todos">${LOGROS.map((l) => {
      const tengo = estado.progreso.logros.includes(l.id);
      return `<li class="${tengo ? '' : 'logro--cerrado'}">
            <span class="logro__icono">${tengo ? l.icono : '🔒'}</span>
            <div><strong>${esc(l.nombre)}</strong><br><span class="tenue">${esc(l.desc)}</span></div>
            <span class="ficha ficha--chica">+${l.tokens} ${MONEDA.simbolo}</span>
          </li>`;
    }).join('')}</ul>`,
  })}
    </div>
  </div>`;
}
