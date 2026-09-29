// Entrenamiento: plan semanal generado, registro de series con progresión y récords.

import {
  tarjeta, estadistica, barrasHorizontales, barrasAgrupadas, lineaTiempo,
  modal, listaNotas, aviso, esc, tablaDatos, vacio,
} from './comun.js';
import {
  generarPlanSemanal, estadoTiers, siguienteCarga, estimar1RM, volumenSemanal, TIERS,
  seriesDeAproximacion, detectarDescarga,
} from '../nucleo/entrenamiento.js';
import { tieneEfecto } from '../nucleo/tienda.js';
import { ejerciciosConTendencia, titularesAnalitica, tendenciaPeso } from '../nucleo/analitica.js';
import { MAPA_EJERCICIOS, NOMBRES_MUSCULOS, EQUIPOS } from '../datos/ejercicios.js';
import { guardarEntrenamiento, borrarEntrenamiento, diaNutricion } from '../nucleo/almacen.js';
import { hoyISO, inicioSemana, num, id as nuevoId } from '../nucleo/utiles.js';

let borrador = null;
let cronometro = null;   // { segundos, restante, timer, ejercicio } mientras corre el descanso

export const acciones = {
  // --- Cronómetro de descanso (func:cronometro) ---
  descansar(ctx, elemento) {
    const segundos = Number(elemento.dataset.seg) || 90;
    iniciarCronometro(segundos, elemento.dataset.nombre || '');
  },
  pararCronometro() { detenerCronometro(); pintarCronometro(); },
  sumarDescanso(ctx, elemento) {
    if (!cronometro) return;
    cronometro.restante = Math.max(5, cronometro.restante + Number(elemento.dataset.seg));
    pintarCronometro();
  },

  // --- Series de aproximación (func:calentamiento) ---
  verCalentamiento(ctx, elemento) {
    const ej = borrador?.ejercicios[Number(elemento.dataset.ej)];
    if (!ej) return;
    const previo = ultimaVez(ctx.estado, ej.ejercicioId);
    const sugerido = siguienteCarga(ej, previo?.series || []).pesoSugerido || 0;
    const entrada = document.querySelector(`[data-ej="${elemento.dataset.ej}"][data-serie="0"][data-campo="peso"]`);
    const objetivo = Number(entrada?.value) || sugerido;
    const cal = seriesDeAproximacion(objetivo, { esCorporal: ej.esCorporal && !objetivo });

    modal({
      titulo: `Calentamiento · ${ej.nombre}`,
      ancho: 480,
      cuerpo: cal.tipo === 'corporal'
        ? `<ol class="calentamiento">${cal.series.map((s) => `<li><strong>${esc(s.descripcion)}</strong>
             <span class="tenue">${s.reps} repeticiones</span></li>`).join('')}</ol>
           <p class="tenue">${esc(cal.nota)}</p>`
        : `<p class="tenue">Para una carga de trabajo de <strong>${num(cal.objetivo, 1)} kg</strong>:</p>
           <table class="tabla">
             <thead><tr><th>Serie</th><th>Peso</th><th>Reps</th><th>%</th></tr></thead>
             <tbody>${cal.series.map((s, i) => `<tr><td>${i + 1}</td><td><strong>${num(s.peso, 1)} kg</strong></td>
               <td>${s.reps}</td><td class="tenue">${s.pct}%</td></tr>`).join('')}</tbody>
           </table>
           <p class="tenue">${esc(cal.nota)}</p>`,
    });
  },

  // --- Descarga (func:deload) ---
  verDescarga(ctx) {
    const d = detectarDescarga(ctx.estado.entrenamientos, { semanaActual: inicioSemana(hoyISO()) });
    modal({
      titulo: 'Planificador de descarga',
      ancho: 560,
      cuerpo: `
        ${listaNotas([{ tono: d.necesita ? 'aviso' : 'bien', texto: d.mensaje }])}
        ${d.necesita ? `<div class="aviso-pago">
          <strong>Semana de descarga propuesta</strong>
          <p>Mismas sesiones y mismos ejercicios, pero al <strong>${d.propuesta.seriesPct}% de las series</strong>
          y al <strong>${d.propuesta.cargaPct}% del peso</strong>, durante ${d.propuesta.duracion}.
          No es descansar: es entrenar suave para que la siguiente semana puedas subir.</p>
        </div>` : ''}
        ${d.semanas && d.semanas.length >= 2 ? lineaTiempo({
        puntos: d.semanas.map((s) => ({ etiqueta: s.semana.slice(5), valor: s.rm })),
        formato: (v) => `${num(v, 1)} kg`,
        alto: 150,
      }) + '<p class="tenue g-nota">Mejor 1RM estimado de cada semana, sobre los ejercicios compuestos.</p>' : ''}`,
    });
  },

  // --- Analítica avanzada (func:estadisticas) ---
  verAnalitica(ctx) {
    const { estado, stats } = ctx;
    const kcalPorFecha = {};
    for (const fecha of Object.keys(estado.comidas)) {
      if (!(estado.comidas[fecha] || []).length) continue;
      kcalPorFecha[fecha] = Math.round(diaNutricion(estado, fecha).total.kcal);
    }
    const tendencias = ejerciciosConTendencia(estado.entrenamientos);
    const titulares = titularesAnalitica(estado.entrenamientos, kcalPorFecha, estado.pesos, estado.perfil);
    const peso = tendenciaPeso(estado.pesos);

    modal({
      titulo: 'Analítica avanzada',
      ancho: 820,
      cuerpo: `
        ${listaNotas(titulares)}
        <h3 class="sub">Evolución de la fuerza por ejercicio</h3>
        ${tendencias.length ? tendencias.slice(0, 5).map((t) => `
          <article class="registro__ej">
            <header>
              <div><strong>${esc(t.nombre)}</strong>
                <span class="tenue">${t.sesiones} sesiones en ${t.dias} días · de ${num(t.primero, 1)} a ${num(t.ultimo, 1)} kg de 1RM estimado</span></div>
              <span class="ficha ficha--chica">${t.ganancia >= 0 ? '+' : ''}${num(t.ganancia, 1)} kg · ${t.kgPorSemana >= 0 ? '+' : ''}${num(t.kgPorSemana, 2)} kg/semana</span>
            </header>
            ${t.puntos.length >= 2 ? lineaTiempo({
        puntos: t.puntos.map((p) => ({ etiqueta: p.fecha.slice(5), valor: p.rm })),
        formato: (v) => `${num(v, 1)} kg`, alto: 130,
      }) : ''}
          </article>`).join('')
        : vacio('Necesitas al menos 3 sesiones del mismo ejercicio con peso registrado.')}
        <h3 class="sub">Peso corporal</h3>
        ${peso.suficiente
        ? lineaTiempo({ puntos: peso.puntos.map((p) => ({ etiqueta: p.fecha.slice(5), valor: p.peso })), formato: (v) => `${num(v, 1)} kg`, alto: 150 })
        : vacio(peso.mensaje)}
        <p class="tenue g-nota">Todo lo que aparece aquí son relaciones descriptivas sobre tus propios datos.
          Que dos cosas se muevan juntas no significa que una cause la otra.</p>`,
    });
  },

  empezar(ctx, elemento) {
    const indice = Number(elemento.dataset.indice);
    const plan = planActual(ctx);
    const sesion = plan[indice];
    if (!sesion) return;
    borrador = {
      id: nuevoId('ses'),
      nombre: sesion.nombre,
      tier: sesion.tier,
      descansoSeg: sesion.descansoSeg,
      inicio: Date.now(),
      ejercicios: sesion.ejercicios.map((e) => ({
        ...e,
        series: Array.from({ length: e.series }, () => ({ peso: '', reps: '' })),
      })),
    };
    ctx.refrescar();
    aviso('Sesión iniciada. Anota cada serie mientras entrenas.', 'info');
  },
  cancelar(ctx) {
    if (borrador && !confirm('¿Descartar la sesión en curso?')) return;
    borrador = null;
    ctx.refrescar();
  },
  editarSerie(ctx, elemento) {
    if (!borrador) return;
    const ej = borrador.ejercicios[Number(elemento.dataset.ej)];
    if (!ej) return;
    const serie = ej.series[Number(elemento.dataset.serie)];
    if (!serie) return;
    serie[elemento.dataset.campo] = elemento.value;
    const marcador = document.querySelector(`[data-resumen-ej="${elemento.dataset.ej}"]`);
    if (marcador) marcador.textContent = resumenEjercicio(ej);
  },
  agregarSerie(ctx, elemento) {
    if (!borrador) return;
    borrador.ejercicios[Number(elemento.dataset.ej)]?.series.push({ peso: '', reps: '' });
    ctx.refrescar();
  },
  quitarSerie(ctx, elemento) {
    if (!borrador) return;
    const ej = borrador.ejercicios[Number(elemento.dataset.ej)];
    if (ej && ej.series.length > 1) ej.series.pop();
    ctx.refrescar();
  },
  terminar(ctx) {
    if (!borrador) return;
    const conDatos = borrador.ejercicios.filter((e) => e.series.some((s) => Number(s.reps) > 0));
    if (!conDatos.length) { aviso('Anota al menos una serie antes de terminar.', 'aviso'); return; }
    const duracion = Math.max(1, Math.round((Date.now() - borrador.inicio) / 60000));
    const sesion = {
      id: borrador.id,
      fecha: hoyISO(),
      nombre: borrador.nombre,
      tier: borrador.tier,
      duracionMin: duracion,
      ejercicios: borrador.ejercicios,
    };
    borrador = null;
    ctx.aplicar((estado) => guardarEntrenamiento(estado, sesion));
  },
  borrarSesion(ctx, elemento) {
    if (!confirm('¿Borrar esta sesión del historial? Los tokens ya ganados se mantienen.')) return;
    ctx.aplicar((estado) => borrarEntrenamiento(estado, elemento.dataset.id));
  },
  regenerar(ctx) {
    ctx.aplicar((estado) => ({ ...estado, planSemanal: { semana: inicioSemana(hoyISO()), variante: (estado.planSemanal?.variante || 0) + 1 } }));
    aviso('Plan regenerado con otra combinación de ejercicios.', 'bien');
  },
  sesionLibre(ctx) {
    const plan = planActual(ctx);
    const sesion = plan[0];
    if (!sesion) return;
    acciones.empezar(ctx, { dataset: { indice: '0' } });
  },
};

/* ---------- cronómetro de descanso ---------- */

function detenerCronometro() {
  if (cronometro?.timer) clearInterval(cronometro.timer);
  cronometro = null;
}

function iniciarCronometro(segundos, nombre) {
  detenerCronometro();
  cronometro = { total: segundos, restante: segundos, nombre, timer: null };
  cronometro.timer = setInterval(() => {
    if (!cronometro) return;
    cronometro.restante--;
    if (cronometro.restante <= 0) {
      avisarFinDescanso();
      detenerCronometro();
    }
    pintarCronometro();
  }, 1000);
  pintarCronometro();
}

function avisarFinDescanso() {
  aviso('<strong>Descanso terminado.</strong><br>A la siguiente serie.', 'nivel', 4000);
  // Vibración corta si el dispositivo la soporta: en el gimnasio no siempre se mira la pantalla.
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* sin vibración, da igual */ }
}

function pintarCronometro() {
  const caja = document.querySelector('[data-cronometro]');
  if (!caja) return;
  caja.innerHTML = vistaCronometro();
}

function vistaCronometro() {
  if (!cronometro) return '';
  const m = Math.floor(cronometro.restante / 60);
  const s = String(cronometro.restante % 60).padStart(2, '0');
  const pct = Math.max(0, (cronometro.restante / cronometro.total) * 100);
  return `<div class="cronometro">
    <div class="cronometro__tiempo">${m}:${s}</div>
    <div class="cronometro__pista"><div class="cronometro__relleno" style="width:${pct}%"></div></div>
    <div class="cronometro__pie">
      <span class="tenue">${esc(cronometro.nombre)}</span>
      <div class="botones">
        <button class="boton boton--chico" data-accion="sumarDescanso" data-seg="30">+30 s</button>
        <button class="boton boton--chico" data-accion="pararCronometro">Saltar</button>
      </div>
    </div>
  </div>`;
}

function planActual(ctx) {
  const { estado, stats } = ctx;
  const semana = inicioSemana(hoyISO());
  const variante = estado.planSemanal?.semana === semana ? (estado.planSemanal.variante || 0) : 0;
  return generarPlanSemanal({
    dias: estado.perfil.diasEntreno,
    equipo: estado.perfil.equipo,
    tierMax: stats.tierMax,
    objetivo: estado.perfil.objetivo,
    semilla: `${semana}|${variante}`,
  });
}

function ultimaVez(estado, ejercicioId) {
  const sesiones = [...estado.entrenamientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  for (const s of sesiones) {
    const ej = (s.ejercicios || []).find((e) => e.ejercicioId === ejercicioId);
    if (ej?.series?.length) return { fecha: s.fecha, series: ej.series };
  }
  return null;
}

function resumenEjercicio(ej) {
  const hechas = ej.series.filter((s) => Number(s.reps) > 0);
  if (!hechas.length) return 'sin series';
  const tonelaje = hechas.reduce((acc, s) => acc + (Number(s.peso) || 0) * (Number(s.reps) || 0), 0);
  return `${hechas.length} series · ${tonelaje ? `${num(tonelaje)} kg de volumen` : 'peso corporal'}`;
}

export function html(ctx) {
  const { estado, stats } = ctx;
  const semana = inicioSemana(hoyISO());
  const sesionesSemana = estado.entrenamientos.filter((s) => s.semana === semana);
  const tiers = estadoTiers(stats.nivel, stats.entreno.sesiones, estado.progreso.tiersComprados);
  const volumen = volumenSemanal(sesionesSemana);
  const plan = planActual(ctx);

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Entrenamiento</h1>
        <p class="tenue">Nivel de contenido ${stats.tierMax} · ${esc(TIERS.find((t) => t.tier === stats.tierMax)?.nombre || '')} · equipo: ${esc(EQUIPOS[estado.perfil.equipo])}</p>
      </div>
      <div class="botones">
        ${tieneEfecto(estado.progreso, 'func:deload')
      ? '<button class="boton boton--chico" data-accion="verDescarga">Descarga</button>' : ''}
        ${tieneEfecto(estado.progreso, 'func:estadisticas')
      ? '<button class="boton boton--chico" data-accion="verAnalitica">Analítica</button>' : ''}
        ${borrador ? '' : '<button class="boton boton--chico" data-accion="regenerar">Regenerar plan</button>'}
      </div>
    </header>
    ${cronometro ? `<div data-cronometro>${vistaCronometro()}</div>` : '<div data-cronometro></div>'}

    <div class="rejilla rejilla--4">
      ${estadistica({ valor: `${sesionesSemana.length}/${estado.perfil.diasEntreno}`, etiqueta: 'Esta semana', tono: sesionesSemana.length >= estado.perfil.diasEntreno ? 'bien' : 'aviso' })}
      ${estadistica({ valor: num(stats.entreno.sesiones), etiqueta: 'Sesiones totales' })}
      ${estadistica({ valor: `${num(Math.round(stats.entreno.tonelajeTotal / 1000))} t`, etiqueta: 'Volumen acumulado', detalle: `${num(stats.entreno.seriesTotales)} series` })}
      ${estadistica({ valor: stats.atributos.fuerza, etiqueta: 'Atributo fuerza', detalle: 'de 100' })}
    </div>

    ${borrador ? vistaBorrador(ctx) : vistaPlan(plan)}

    ${tarjeta({
    titulo: 'Niveles de contenido',
    cuerpo: `<div class="tiers">${tiers.map((t) => `
        <article class="tier ${t.desbloqueado ? 'tier--abierto' : 'tier--cerrado'}">
          <header><strong>${t.tier}. ${esc(t.nombre)}</strong>
            <span class="ficha ficha--chica">${t.desbloqueado ? (t.comprado ? 'comprado' : 'abierto') : 'bloqueado'}</span></header>
          <p class="tenue">${esc(t.lema)}</p>
          <p class="tenue">${t.series[0]}-${t.series[1]} series · ${t.reps[0]}-${t.reps[1]} reps · ${t.descanso}s de descanso</p>
          ${t.desbloqueado ? '' : `<p class="nota nota--aviso"><span class="nota__icono">!</span><span>Necesitas nivel ${t.nivel} y ${t.sesiones} sesiones. Te faltan ${t.faltaNivel} niveles y ${t.faltaSesiones} sesiones.</span></p>`}
        </article>`).join('')}</div>
        <p class="tenue g-nota">También puedes abrir un nivel antes de tiempo canjeando tokens en la tienda.</p>`,
  })}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Volumen semanal por músculo',
    cuerpo: volumen.length
      ? barrasHorizontales({
        datos: volumen.map((v) => ({ etiqueta: NOMBRES_MUSCULOS[v.musculo] || v.musculo, valor: v.series, detalle: `${v.estado === 'optimo' ? 'en rango 10-20' : v.estado === 'bajo' ? 'bajo el rango recomendado' : 'sobre el rango'}` })),
        formato: (v) => `${v} series`,
      }) + '<p class="tenue g-nota">El rango recomendado para crecer es de 10 a 20 series semanales por grupo muscular.</p>'
      : vacio('Registra entrenamientos esta semana para ver el reparto.'),
  })}
      ${tarjeta({
    titulo: 'Volumen por semana',
    cuerpo: stats.entreno.semanas.length >= 2
      ? barrasAgrupadas({
        datos: stats.entreno.semanas.map((s) => ({ etiqueta: s.semana.slice(5), tonelaje: s.tonelaje, sesiones: s.sesiones })),
        series: [{ clave: 'tonelaje', nombre: 'Volumen (kg)', color: '--s1' }],
        formato: (v) => `${num(v)} kg`,
      }) + tablaDatos({
        columnas: ['Semana', 'Sesiones', 'Volumen (kg)'],
        filas: stats.entreno.semanas.map((s) => [s.semana, s.sesiones, num(s.tonelaje)]),
      })
      : vacio('Necesitas al menos dos semanas registradas.'),
  })}
    </div>

    ${tarjeta({
    titulo: 'Récords personales',
    extra: `<span class="tenue">1RM estimado con la fórmula de Epley</span>`,
    cuerpo: stats.records.length
      ? `<table class="tabla">
          <thead><tr><th>Ejercicio</th><th>Mejor serie</th><th>1RM estimado</th><th>Fecha</th></tr></thead>
          <tbody>${stats.records.slice(0, 12).map((r) => `<tr>
            <td>${esc(r.nombre)}</td>
            <td>${r.peso ? `${num(r.peso, 1)} kg × ${r.reps}` : `${r.reps} reps`}</td>
            <td><strong>${r.rm ? `${num(r.rm, 1)} kg` : '—'}</strong></td>
            <td class="tenue">${r.fecha}</td></tr>`).join('')}</tbody>
        </table>`
      : vacio('Aún no hay récords. Registra tu primera sesión con peso.'),
  })}

    ${tarjeta({
    titulo: 'Historial',
    cuerpo: estado.entrenamientos.length
      ? `<ul class="historial">${[...estado.entrenamientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 15).map((s) => `
          <li>
            <div>
              <strong>${esc(s.nombre)}</strong>
              <span class="tenue">${s.fecha} · nivel ${s.tier} · ${s.duracionMin} min · ${(s.ejercicios || []).length} ejercicios</span>
            </div>
            <button class="boton boton--chico boton--peligro" data-accion="borrarSesion" data-id="${esc(s.id)}">Borrar</button>
          </li>`).join('')}</ul>`
      : vacio('Sin sesiones registradas.'),
  })}
  </div>`;
}

function vistaPlan(plan) {
  return tarjeta({
    titulo: 'Plan de esta semana',
    cuerpo: `<div class="plan">${plan.map((s, i) => `
      <article class="sesion">
        <header>
          <div>
            <strong>Día ${i + 1} · ${esc(s.nombre)}</strong>
            <span class="tenue">${s.ejercicios.length} ejercicios · ~${s.duracionEstimadaMin} min · descanso ${s.descansoSeg}s</span>
          </div>
          <button class="boton boton--principal boton--chico" data-accion="empezar" data-indice="${i}">Empezar</button>
        </header>
        <ul class="sesion__lista">
          ${s.ejercicios.map((e) => `<li><span>${esc(e.nombre)}</span><span class="tenue">${esc(e.objetivoTexto)}</span></li>`).join('')}
        </ul>
      </article>`).join('')}</div>`,
  });
}

function vistaBorrador(ctx) {
  const { estado } = ctx;
  return tarjeta({
    clase: 'tarjeta--activa',
    titulo: `En curso: ${borrador.nombre}`,
    extra: `<div class="botones">
      <button class="boton boton--chico" data-accion="cancelar">Descartar</button>
      <button class="boton boton--principal boton--chico" data-accion="terminar">Terminar sesión</button>
    </div>`,
    cuerpo: `<div class="registro">${borrador.ejercicios.map((ej, i) => {
      const previo = ultimaVez(estado, ej.ejercicioId);
      const sugerencia = siguienteCarga(ej, previo?.series || []);
      const info = MAPA_EJERCICIOS.get(ej.ejercicioId);
      return `
      <article class="registro__ej">
        <header>
          <div>
            <strong>${esc(ej.nombre)}</strong>
            <span class="tenue">${esc(ej.objetivoTexto)} · ${(info?.musculos || []).map((m) => NOMBRES_MUSCULOS[m] || m).join(', ')}</span>
          </div>
          <span class="tenue" data-resumen-ej="${i}">${resumenEjercicio(ej)}</span>
        </header>
        <p class="nota nota--info"><span class="nota__icono">i</span><span>${esc(sugerencia.mensaje)}${previo ? ` (última vez el ${previo.fecha})` : ''}</span></p>
        <div class="series">
          <div class="series__cab"><span>Serie</span><span>${ej.esTiempo ? 'Segundos' : 'Reps'}</span><span>Peso (kg)</span><span>1RM</span></div>
          ${ej.series.map((s, j) => `
            <div class="serie">
              <span class="serie__n">${j + 1}</span>
              <input type="number" inputmode="numeric" min="0" step="1" value="${esc(s.reps)}" placeholder="${ej.repMin}-${ej.repMax}"
                data-accion="editarSerie" data-ej="${i}" data-serie="${j}" data-campo="reps" aria-label="Repeticiones serie ${j + 1}">
              <input type="number" inputmode="decimal" min="0" step="0.5" value="${esc(s.peso)}" placeholder="${ej.esCorporal ? 'corporal' : (sugerencia.pesoSugerido || 0)}"
                data-accion="editarSerie" data-ej="${i}" data-serie="${j}" data-campo="peso" aria-label="Peso serie ${j + 1}">
              <span class="tenue">${Number(s.peso) && Number(s.reps) ? `${num(estimar1RM(Number(s.peso), Number(s.reps)), 1)} kg` : '—'}</span>
            </div>`).join('')}
        </div>
        <div class="botones">
          <button class="boton boton--chico" data-accion="agregarSerie" data-ej="${i}">+ Serie</button>
          <button class="boton boton--chico" data-accion="quitarSerie" data-ej="${i}">− Serie</button>
          ${tieneEfecto(estado.progreso, 'func:calentamiento')
        ? `<button class="boton boton--chico" data-accion="verCalentamiento" data-ej="${i}">Calentamiento</button>` : ''}
          ${tieneEfecto(estado.progreso, 'func:cronometro')
        ? `<button class="boton boton--chico boton--principal" data-accion="descansar"
             data-seg="${borrador.descansoSeg || 90}" data-nombre="${esc(ej.nombre)}">⏱ Descansar</button>` : ''}
        </div>
      </article>`;
    }).join('')}</div>`,
  });
}
