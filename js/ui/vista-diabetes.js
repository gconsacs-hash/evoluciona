// Seguimiento de diabetes: glicemias, dosis indicadas, patrones e informe médico.
//
// Esta vista solo aparece si la persona la activa desde su perfil. La app no
// asume que nadie tiene diabetes.

import {
  tarjeta, estadistica, listaNotas, lineaTiempo, barrasHorizontales,
  modal, cerrarModal, aviso, esc, vacio, tablaDatos,
} from './comun.js';
import {
  TIPOS, RANGOS, MOMENTOS, TIPOS_INSULINA, UMBRALES, clasificar, indicadores,
  evaluarMetas, patronesPorMomento, hallazgos, queHacer, insulinaDelDia,
  seriePorDia, ultimosDias, convertir,
} from '../nucleo/diabetes.js';
import {
  registrarGlicemia, borrarGlicemia, registrarInsulina, borrarInsulina,
  guardarPerfilDiabetes, diaNutricion,
} from '../nucleo/almacen.js';
import { hoyISO, num, redondear } from '../nucleo/utiles.js';

let periodo = 14;

export const acciones = {
  cambiarPeriodo(ctx, elemento) {
    periodo = Number(elemento.dataset.dias) || 14;
    ctx.refrescar();
  },

  guardarGlicemia(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    const valor = Number(d.valor);
    if (!valor || valor < 20 || valor > 800) {
      aviso('Ingresa un valor entre 20 y 800 mg/dL.', 'aviso');
      return;
    }
    ctx.aplicar((estado) => registrarGlicemia(estado, d));
    formulario.reset();
    const hora = formulario.querySelector('[name="hora"]');
    if (hora) hora.value = horaActual();

    // Si el valor requiere una acción inmediata, se muestra antes que nada.
    const indicacion = queHacer(valor, ctx.estado.diabetes);
    if (indicacion) {
      modal({
        titulo: indicacion.titulo,
        ancho: 480,
        cuerpo: `<p class="nota nota--${indicacion.tono}"><span class="nota__icono">${indicacion.urgente ? '✕' : '!'}</span>
            <span>${esc(indicacion.texto)}</span></p>
          <p class="tenue">Esto es información general de manejo, la misma que está en cualquier guía de educación
            en diabetes. No reemplaza lo que te haya indicado tu equipo de salud.</p>
          <div class="formulario__pie"><button class="boton boton--principal" data-accion="cerrar">Entendido</button></div>`,
      });
    }
  },
  borrarGlicemia(ctx, elemento) {
    ctx.aplicar((estado) => borrarGlicemia(estado, elemento.dataset.id));
  },

  guardarInsulina(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    if (!Number(d.unidades)) { aviso('Indica cuántas unidades te pusiste.', 'aviso'); return; }
    ctx.aplicar((estado) => registrarInsulina(estado, d));
    formulario.reset();
    const hora = formulario.querySelector('[name="hora"]');
    if (hora) hora.value = horaActual();
  },
  borrarInsulina(ctx, elemento) {
    ctx.aplicar((estado) => borrarInsulina(estado, elemento.dataset.id));
  },

  editarEsquema(ctx) {
    const e = ctx.estado.diabetes.esquema;
    modal({
      titulo: 'Esquema indicado por tu médico',
      ancho: 620,
      cuerpo: `
        <p class="nota nota--info"><span class="nota__icono">i</span><span>Copia aquí lo que te indicó tu médico, tal
          cual. La app lo guarda y te lo muestra a mano: <strong>no hace cuentas con estos datos ni calcula dosis</strong>.</span></p>
        <form class="formulario" data-accion="guardarEsquema">
          <label>Insulina basal (lenta)
            <input name="basal" value="${esc(e.basal)}" placeholder="Ej: 20 unidades de glargina a las 22:00"></label>
          <label>Bolos de comida (rápida)
            <input name="bolos" value="${esc(e.bolos)}" placeholder="Ej: 6 U desayuno, 8 U almuerzo, 6 U cena"></label>
          <label>Correcciones
            <input name="correccion" value="${esc(e.correccion)}" placeholder="Ej: según tabla entregada en el control"></label>
          <label>Otras indicaciones
            <textarea name="notas" rows="3" placeholder="Metformina, horarios, qué hacer si hay hipoglicemia…">${esc(e.notas)}</textarea></label>
          <div class="formulario__fila">
            <label>Médico tratante<input name="medico" value="${esc(ctx.estado.diabetes.medico || '')}"></label>
            <label>Próximo control<input type="date" name="proximoControl" value="${esc(ctx.estado.diabetes.proximoControl || '')}"></label>
          </div>
          <div class="formulario__pie"><button class="boton boton--principal" type="submit">Guardar</button></div>
        </form>`,
    });
  },
  guardarEsquema(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    ctx.aplicar((estado) => guardarPerfilDiabetes(estado, {
      esquema: { basal: d.basal, bolos: d.bolos, correccion: d.correccion, notas: d.notas },
      medico: d.medico,
      proximoControl: d.proximoControl,
    }));
    cerrarModal();
    aviso('Esquema guardado.', 'bien');
  },

  verInforme(ctx) { abrirInforme(ctx); },
  imprimirInforme() { window.print(); },
  cerrar() { cerrarModal(); },
};

function horaActual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mostrar(valor, unidad) {
  return unidad === 'mmol/L' ? `${convertir(valor, 'mmol/L')} mmol/L` : `${num(valor)} mg/dL`;
}

export function html(ctx) {
  const { estado } = ctx;
  const perfil = estado.diabetes;
  const rango = perfil.rango || RANGOS.estandar;
  const hoy = hoyISO();
  const delPeriodo = ultimosDias(estado.glicemias, periodo, hoy);
  const ind = indicadores(delPeriodo, rango);
  const metas = evaluarMetas(ind);
  const patrones = patronesPorMomento(delPeriodo, rango);
  const avisos = hallazgos(delPeriodo, rango, perfil);
  const serie = seriePorDia(delPeriodo, periodo, hoy);
  const insulinaHoy = insulinaDelDia(estado.insulina, hoy);
  const deHoy = estado.glicemias.filter((g) => g.fecha === hoy)
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  const nutHoy = diaNutricion(estado, hoy);

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Diabetes</h1>
        <p class="tenue">${esc(TIPOS[perfil.tipo] || '')} · rango objetivo ${rango.min}-${rango.max} mg/dL</p>
      </div>
      <div class="botones">
        ${[7, 14, 30, 90].map((d) => `<button class="chip ${periodo === d ? 'chip--activo' : ''}"
          data-accion="cambiarPeriodo" data-dias="${d}">${d} días</button>`).join('')}
        <button class="boton boton--chico" data-accion="verInforme">Informe médico</button>
      </div>
    </header>

    <p class="nota nota--info"><span class="nota__icono">i</span><span>Esta sección <strong>registra y muestra</strong>
      tus mediciones. <strong>No calcula ni sugiere dosis de insulina</strong>: esa indicación es de tu médico.
      Tampoco reemplaza un control ni un examen de laboratorio.</span></p>

    ${tarjeta({
    titulo: 'Anotar una medición',
    cuerpo: `
      <form class="formulario" data-accion="guardarGlicemia">
        <div class="formulario__fila">
          <label>Glicemia (mg/dL)<input type="number" name="valor" min="20" max="800" step="1" required autocomplete="off"></label>
          <label>Momento<select name="momento">
            <option value="">Sin especificar</option>
            ${Object.entries(MOMENTOS).sort((a, b) => a[1].orden - b[1].orden)
        .map(([k, v]) => `<option value="${k}">${esc(v.nombre)}</option>`).join('')}
          </select></label>
          <label>Hora<input type="time" name="hora" value="${horaActual()}"></label>
          <label>Fecha<input type="date" name="fecha" value="${hoy}"></label>
        </div>
        <label>Nota (opcional)<input name="nota" placeholder="Ej: después de caminar, o me sentí mal"></label>
        <div class="formulario__pie"><button class="boton boton--principal" type="submit">Registrar</button></div>
      </form>
      <p class="tenue g-nota">Registrar suma XP siempre, sea cual sea el número.
        Los días difíciles son justamente los que tu médico necesita ver.</p>`,
  })}

    <div class="rejilla rejilla--4">
      ${estadistica({
    valor: ind.n ? `${ind.tiempoEnRango}%` : '—',
    etiqueta: 'Tiempo en rango',
    detalle: 'meta: sobre 70%',
    tono: !ind.n ? '' : ind.tiempoEnRango > 70 ? 'bien' : 'aviso',
  })}
      ${estadistica({
    valor: ind.n ? mostrar(ind.media, perfil.unidad) : '—',
    etiqueta: 'Promedio del período',
    detalle: ind.n ? `${ind.n} mediciones` : 'sin datos',
  })}
      ${estadistica({
    valor: ind.n ? `${ind.gmi}%` : '—',
    etiqueta: 'HbA1c estimada (GMI)',
    detalle: 'estimación, no reemplaza el examen',
  })}
      ${estadistica({
    valor: ind.n ? ind.hipoglicemias : '—',
    etiqueta: 'Hipoglicemias',
    detalle: ind.n ? `${ind.hipoglicemiasGraves} graves (bajo 54)` : '',
    tono: !ind.n ? '' : ind.hipoglicemias ? 'mal' : 'bien',
  })}
    </div>

    ${tarjeta({ titulo: 'Qué muestran tus registros', cuerpo: listaNotas(avisos) })}

    ${ind.n ? tarjeta({
    titulo: 'Metas del control',
    extra: '<span class="tenue">consenso internacional de tiempo en rango</span>',
    cuerpo: `<table class="tabla">
        <thead><tr><th>Indicador</th><th>Tuyo</th><th>Meta</th><th></th></tr></thead>
        <tbody>${metas.map((m) => `<tr>
          <td>${esc(m.nombre)}</td>
          <td><strong>${m.valor}%</strong></td>
          <td class="tenue">${esc(m.objetivo)}</td>
          <td><span class="marca marca--${m.cumple ? 'bien' : 'aviso'}">${m.cumple ? '✓ cumple' : '! revisar'}</span></td>
        </tr>`).join('')}</tbody>
      </table>
      ${ind.suficiente ? '' : '<p class="tenue g-nota">Con menos de 14 mediciones estos porcentajes son solo una referencia.</p>'}`,
  }) : ''}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: `Promedio diario (${periodo} días)`,
    cuerpo: serie.length >= 2
      ? lineaTiempo({
        puntos: serie.map((s) => ({ etiqueta: s.fecha.slice(5), valor: s.media })),
        meta: rango.max,
        etiquetaMeta: 'Techo del rango',
        formato: (v) => `${num(v)} mg/dL`,
      }) + tablaDatos({
        columnas: ['Día', 'Mediciones', 'Promedio', 'Mínima', 'Máxima'],
        filas: serie.map((s) => [s.fecha, s.n, num(s.media), num(s.minimo), num(s.maximo)]),
      })
      : vacio('Necesitas al menos dos días con mediciones.'),
  })}
      ${tarjeta({
    titulo: 'Promedio por momento del día',
    cuerpo: patrones.length
      ? barrasHorizontales({
        datos: patrones.map((p) => ({
          etiqueta: p.nombre, valor: p.media,
          detalle: `${p.n} mediciones · ${p.hipos} bajo 70 · ${p.altos} sobre el rango`,
        })),
        formato: (v) => `${num(v)} mg/dL`,
      }) + '<p class="tenue g-nota">Este es el análisis más útil para el control: muestra a qué hora se repite el problema.</p>'
      : vacio('Registra al menos 3 mediciones en un mismo momento del día (ayunas, después de almuerzo…) para ver el patrón.'),
  })}
    </div>

    ${tarjeta({
    titulo: `Mediciones de hoy`,
    extra: `<span class="tenue">${deHoy.length} registro${deHoy.length === 1 ? '' : 's'}</span>`,
    cuerpo: deHoy.length
      ? `<table class="tabla">
          <thead><tr><th>Hora</th><th>Valor</th><th>Momento</th><th>Estado</th><th>Nota</th><th></th></tr></thead>
          <tbody>${deHoy.map((g) => {
        const c = clasificar(g.valor, rango);
        return `<tr>
              <td class="tenue">${esc(g.hora || '—')}</td>
              <td><strong>${mostrar(g.valor, perfil.unidad)}</strong></td>
              <td class="tenue">${esc(MOMENTOS[g.momento]?.nombre || '—')}</td>
              <td><span class="marca marca--${c.tono}">${esc(c.texto)}</span></td>
              <td class="tenue">${esc(g.nota)}</td>
              <td><button class="boton-icono" data-accion="borrarGlicemia" data-id="${esc(g.id)}" aria-label="Borrar">✕</button></td>
            </tr>`;
      }).join('')}</tbody>
        </table>`
      : vacio('Sin mediciones hoy.'),
  })}

    ${perfil.usaInsulina ? tarjeta({
    titulo: 'Insulina de hoy',
    extra: `<span class="ficha ficha--chica">${num(insulinaHoy.total, 1)} U en total</span>`,
    cuerpo: `
      <p class="nota nota--info"><span class="nota__icono">i</span><span>Registra <strong>lo que te pusiste</strong>,
        según lo indicado por tu médico. La app no decide cuánto corresponde.</span></p>
      <form class="formulario" data-accion="guardarInsulina">
        <div class="formulario__fila">
          <label>Tipo<select name="tipo">
            ${Object.entries(TIPOS_INSULINA).map(([k, v]) => `<option value="${k}">${esc(v.nombre)}</option>`).join('')}
          </select></label>
          <label>Unidades<input type="number" name="unidades" min="0" step="0.5" required></label>
          <label>Hora<input type="time" name="hora" value="${horaActual()}"></label>
          <label>Fecha<input type="date" name="fecha" value="${hoy}"></label>
        </div>
        <div class="formulario__pie"><button class="boton boton--principal" type="submit">Registrar dosis</button></div>
      </form>
      ${insulinaHoy.registros.length
      ? `<table class="tabla">
            <thead><tr><th>Hora</th><th>Tipo</th><th>Unidades</th><th></th></tr></thead>
            <tbody>${insulinaHoy.registros.map((d) => `<tr>
              <td class="tenue">${esc(d.hora || '—')}</td>
              <td>${esc(TIPOS_INSULINA[d.tipo]?.nombre || d.tipo)}</td>
              <td><strong>${num(d.unidades, 1)} U</strong></td>
              <td><button class="boton-icono" data-accion="borrarInsulina" data-id="${esc(d.id)}" aria-label="Borrar">✕</button></td>
            </tr>`).join('')}</tbody>
          </table>`
      : vacio('Sin dosis registradas hoy.')}`,
  }) : ''}

    ${tarjeta({
    titulo: 'Tu esquema indicado',
    extra: '<button class="boton boton--chico" data-accion="editarEsquema">Editar</button>',
    cuerpo: perfil.esquema.basal || perfil.esquema.bolos || perfil.esquema.notas
      ? `<table class="tabla tabla--compacta">
          <tbody>
            ${perfil.esquema.basal ? `<tr><td>Basal</td><td><strong>${esc(perfil.esquema.basal)}</strong></td></tr>` : ''}
            ${perfil.esquema.bolos ? `<tr><td>Bolos</td><td><strong>${esc(perfil.esquema.bolos)}</strong></td></tr>` : ''}
            ${perfil.esquema.correccion ? `<tr><td>Correcciones</td><td>${esc(perfil.esquema.correccion)}</td></tr>` : ''}
            ${perfil.esquema.notas ? `<tr><td>Otras indicaciones</td><td>${esc(perfil.esquema.notas)}</td></tr>` : ''}
            ${perfil.medico ? `<tr><td>Médico</td><td class="tenue">${esc(perfil.medico)}</td></tr>` : ''}
            ${perfil.proximoControl ? `<tr><td>Próximo control</td><td class="tenue">${esc(perfil.proximoControl)}</td></tr>` : ''}
          </tbody>
        </table>`
      : vacio('Aún no has copiado tu esquema. Tenerlo a mano evita errores de memoria.'),
  })}

    ${tarjeta({
    titulo: 'Carbohidratos de hoy',
    cuerpo: `<div class="rejilla rejilla--3">
        ${estadistica({ valor: `${num(nutHoy.total.carb, 1)} g`, etiqueta: 'Carbohidratos registrados' })}
        ${estadistica({ valor: `${num(nutHoy.total.azucar, 1)} g`, etiqueta: 'De los cuales azúcares' })}
        ${estadistica({ valor: `${num(nutHoy.total.fibra, 1)} g`, etiqueta: 'Fibra' })}
      </div>
      <p class="tenue g-nota">Sale de lo que registraste en Nutrición. Si cuentas carbohidratos, este es el número que
        usas con el esquema que te indicó tu médico.</p>`,
  })}
  </div>`;
}

function abrirInforme(ctx) {
  const { estado } = ctx;
  const perfil = estado.diabetes;
  const rango = perfil.rango || RANGOS.estandar;
  const hoy = hoyISO();
  const registros = ultimosDias(estado.glicemias, periodo, hoy);
  const ind = indicadores(registros, rango);
  const metas = evaluarMetas(ind);
  const patrones = patronesPorMomento(registros, rango);
  const dosis = ultimosDias(estado.insulina, periodo, hoy);
  const diasConDosis = [...new Set(dosis.map((d) => d.fecha))];
  const promedioDiario = diasConDosis.length
    ? redondear(dosis.reduce((s, d) => s + Number(d.unidades || 0), 0) / diasConDosis.length, 1)
    : 0;

  modal({
    titulo: `Informe para el control · últimos ${periodo} días`,
    ancho: 820,
    cuerpo: `
      <div class="informe">
        <p class="tenue">${esc(TIPOS[perfil.tipo] || '')}${perfil.medico ? ' · médico: ' + esc(perfil.medico) : ''} ·
          período ${periodo} días hasta ${hoy} · rango objetivo ${rango.min}-${rango.max} mg/dL</p>

        ${ind.n ? `
        <h3>Resumen</h3>
        <table class="tabla">
          <tbody>
            <tr><td>Mediciones registradas</td><td><strong>${ind.n}</strong></td></tr>
            <tr><td>Promedio</td><td><strong>${num(ind.media)} mg/dL</strong></td></tr>
            <tr><td>HbA1c estimada (GMI)</td><td><strong>${ind.gmi}%</strong> <span class="tenue">estimación a partir del promedio</span></td></tr>
            <tr><td>Desviación estándar</td><td>${num(ind.desviacion)} mg/dL</td></tr>
            <tr><td>Coeficiente de variación</td><td>${ind.cv}%</td></tr>
            <tr><td>Mínima / máxima</td><td>${num(ind.minimo)} / ${num(ind.maximo)} mg/dL</td></tr>
          </tbody>
        </table>

        <h3>Distribución del tiempo</h3>
        <table class="tabla">
          <thead><tr><th>Tramo</th><th>%</th><th>Meta</th></tr></thead>
          <tbody>
            <tr><td>Bajo 54 mg/dL</td><td>${ind.tiempoHipoGrave}%</td><td class="tenue">&lt; 1%</td></tr>
            <tr><td>Bajo 70 mg/dL</td><td>${ind.tiempoHipo}%</td><td class="tenue">&lt; 4%</td></tr>
            <tr><td>En rango</td><td><strong>${ind.tiempoEnRango}%</strong></td><td class="tenue">&gt; 70%</td></tr>
            <tr><td>Sobre ${rango.max} mg/dL</td><td>${ind.tiempoAlto}%</td><td class="tenue">&lt; 25%</td></tr>
            <tr><td>Sobre 250 mg/dL</td><td>${ind.tiempoMuyAlto}%</td><td class="tenue">&lt; 5%</td></tr>
          </tbody>
        </table>

        ${patrones.length ? `
        <h3>Por momento del día</h3>
        <table class="tabla">
          <thead><tr><th>Momento</th><th>n</th><th>Promedio</th><th>Mín</th><th>Máx</th><th>Bajo 70</th></tr></thead>
          <tbody>${patrones.map((p) => `<tr>
            <td>${esc(p.nombre)}</td><td>${p.n}</td><td><strong>${num(p.media)}</strong></td>
            <td>${num(p.minimo)}</td><td>${num(p.maximo)}</td>
            <td>${p.hipos}${p.hipos ? ` (${p.pctHipos}%)` : ''}</td>
          </tr>`).join('')}</tbody>
        </table>` : ''}

        ${perfil.usaInsulina && dosis.length ? `
        <h3>Insulina</h3>
        <p class="tenue">Promedio de ${promedioDiario} U por día, sobre ${diasConDosis.length} días con registro.</p>
        <table class="tabla tabla--compacta">
          <tbody>${Object.entries(TIPOS_INSULINA).map(([k, v]) => {
      const total = dosis.filter((d) => d.tipo === k).reduce((s, d) => s + Number(d.unidades || 0), 0);
      if (!total) return '';
      return `<tr><td>${esc(v.nombre)}</td><td>${redondear(total, 1)} U en el período</td></tr>`;
    }).join('')}</tbody>
        </table>` : ''}

        <h3>Esquema declarado</h3>
        <table class="tabla tabla--compacta"><tbody>
          <tr><td>Basal</td><td>${esc(perfil.esquema.basal || '—')}</td></tr>
          <tr><td>Bolos</td><td>${esc(perfil.esquema.bolos || '—')}</td></tr>
          <tr><td>Correcciones</td><td>${esc(perfil.esquema.correccion || '—')}</td></tr>
          <tr><td>Otras</td><td>${esc(perfil.esquema.notas || '—')}</td></tr>
        </tbody></table>
        ` : vacio('No hay mediciones en el período seleccionado.')}

        <p class="tenue g-nota">Informe generado por una aplicación de autorregistro a partir de mediciones capilares
          ingresadas a mano. No constituye un diagnóstico ni reemplaza los exámenes de laboratorio.</p>
      </div>
      <div class="formulario__pie">
        <button class="boton" data-accion="cerrar">Cerrar</button>
        <button class="boton boton--principal" data-accion="imprimirInforme">Imprimir o guardar en PDF</button>
      </div>`,
  });
}
