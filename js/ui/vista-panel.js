// Panel principal: el avatar, el nivel y el estado de las cuatro áreas en una sola pantalla.

import { tarjeta, estadistica, barraXP, radarAtributos, anillo, listaNotas, mapaCalor, esc } from './comun.js';
import { dibujarAvatar, leerAvatar } from '../nucleo/avatar.js';
import { etapaDesdeNivel, MONEDA, LOGROS } from '../nucleo/progreso.js';
import { diaNutricion } from '../nucleo/almacen.js';
import { estadoDia, consejosRutina, historialReciente } from '../nucleo/habitos.js';
import { orientacionDelDia } from '../nucleo/nutricion.js';
import { consejosFinancieros } from '../nucleo/finanzas.js';
import { clp, num, hoyISO, inicioSemana } from '../nucleo/utiles.js';

export const acciones = {
  irA(ctx, elemento) { ctx.ir(elemento.dataset.vista); },
};

export function html(ctx) {
  const { estado, stats } = ctx;
  const hoy = hoyISO();
  const nivel = stats.nivel;
  const etapa = etapaDesdeNivel(nivel);
  const dia = estadoDia(estado.habitos, estado.registrosHabitos, hoy);
  const nut = diaNutricion(estado, hoy);
  const fin = stats.finanzas;
  const sesionesSemana = estado.entrenamientos.filter((s) => s.semana === inicioSemana(hoy)).length;

  const svgAvatar = dibujarAvatar({
    nivel,
    atributos: stats.atributos,
    avatar: estado.progreso.avatar,
    tonoPiel: estado.perfil.tonoPiel,
    racha: stats.racha,
  });

  const lecturas = leerAvatar(stats.atributos, nivel);

  const consejos = [
    ...consejosRutina(estado.habitos, estado.registrosHabitos, hoy).slice(0, 2),
    ...orientacionDelDia(nut.evaluacion, { entrenaHoy: sesionesSemana > 0 }).mensajes.slice(0, 2),
    ...consejosFinancieros(fin.resumen, fin.presupuestoEval, fin.serie).slice(0, 2),
  ];

  const logrosRecientes = estado.progreso.logros.slice(-4).reverse()
    .map((id) => LOGROS.find((l) => l.id === id)).filter(Boolean);

  return `
  <div class="panel">
    <section class="heroe">
      <div class="heroe__avatar">
        ${svgAvatar}
        <div class="heroe__etapa">Etapa ${etapa.etapa} · ${esc(etapa.nombre)}</div>
      </div>
      <div class="heroe__datos">
        <p class="heroe__saludo">${esc(saludo())}${estado.perfil.nombre ? `, ${esc(estado.perfil.nombre)}` : ''}</p>
        <h1>Nivel ${nivel} <span class="heroe__etapa-nombre">${esc(etapa.nombre)}</span></h1>
        ${barraXP(stats.detalleNivel)}
        <div class="heroe__tokens">
          <span class="ficha">${MONEDA.simbolo} ${num(estado.progreso.tokens)} ${MONEDA.plural}</span>
          <span class="ficha ficha--tenue">🔥 ${stats.racha} ${stats.racha === 1 ? 'día' : 'días'} de racha</span>
          <button class="boton boton--chico" data-accion="irA" data-vista="tienda">Ir a la tienda</button>
        </div>
        <ul class="heroe__lectura">${lecturas.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>
    </section>

    <div class="rejilla rejilla--4">
      ${estadistica({ valor: `${dia.cumplidos}/${dia.total}`, etiqueta: 'Rutina de hoy', detalle: `${dia.pct}% cumplido`, tono: dia.pct >= 80 ? 'bien' : dia.pct >= 40 ? 'aviso' : 'mal' })}
      ${estadistica({ valor: num(nut.total.kcal), etiqueta: 'Calorías de hoy', detalle: `meta ${num(nut.objetivos.kcal)} kcal`, tono: nut.enMeta ? 'bien' : 'aviso' })}
      ${estadistica({ valor: `${sesionesSemana}/${estado.perfil.diasEntreno}`, etiqueta: 'Entrenos de la semana', detalle: `${num(stats.entreno.sesiones)} en total`, tono: sesionesSemana >= estado.perfil.diasEntreno ? 'bien' : 'aviso' })}
      ${estadistica({ valor: `${fin.resumen.tasaAhorro}%`, etiqueta: 'Tasa de ahorro del mes', detalle: `balance ${clp(fin.resumen.balance)}`, tono: fin.resumen.tasaAhorro >= 20 ? 'bien' : fin.resumen.tasaAhorro >= 5 ? 'aviso' : 'mal' })}
    </div>

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Atributos del avatar',
    extra: `<span class="tenue">general ${stats.atributos.general}/100</span>`,
    cuerpo: radarAtributos(stats.atributos) + `<p class="tenue g-nota">Cada atributo sale de tus datos reales: cargas registradas, días en meta calórica, racha de hábitos y salud financiera.</p>`,
  })}
      ${tarjeta({
    titulo: 'Tu día de un vistazo',
    cuerpo: `
      <div class="dia-vistazo">
        ${anillo({
      pct: nut.evaluacion.kcal.pct,
      centroPrincipal: `${nut.evaluacion.kcal.pct}%`,
      centroSecundario: 'calorías',
      tono: nut.enMeta ? 'bien' : nut.evaluacion.kcal.pct > 110 ? 'mal' : 'aviso',
    })}
        <div class="dia-vistazo__lista">
          <div class="mini"><span>💧 Agua</span><strong>${num(nut.total.agua + (estado.aguaExtra[hoy] || 0))} / ${num(nut.objetivos.agua)} ml</strong></div>
          <div class="mini"><span>🥩 Proteína</span><strong>${num(nut.total.prot, 1)} / ${num(nut.objetivos.prot)} g</strong></div>
          <div class="mini"><span>🍬 Azúcares</span><strong>${num(nut.total.azucar, 1)} / ${num(nut.objetivos.azucar)} g</strong></div>
          <div class="mini"><span>🧂 Sodio</span><strong>${num(nut.total.sodio)} / ${num(nut.objetivos.sodio)} mg</strong></div>
        </div>
      </div>
      <div class="acciones-rapidas">
        <button class="boton boton--chico" data-accion="irA" data-vista="nutricion">Registrar comida</button>
        <button class="boton boton--chico" data-accion="irA" data-vista="entreno">Entrenar</button>
        <button class="boton boton--chico" data-accion="irA" data-vista="finanzas">Anotar gasto</button>
        <button class="boton boton--chico" data-accion="irA" data-vista="rutina">Ver rutina</button>
      </div>`,
  })}
    </div>

    ${tarjeta({
    titulo: 'Qué deberías hacer ahora',
    cuerpo: consejos.length ? listaNotas(consejos) : '<p class="vacio">Registra algo hoy y aquí aparecerán recomendaciones concretas.</p>',
  })}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Constancia de los últimos 28 días',
    cuerpo: mapaCalor(historialReciente(estado.habitos, estado.registrosHabitos, 28, hoy))
      + `<p class="tenue g-nota">Racha actual ${stats.racha} días · récord ${stats.rachaMaxima} días</p>`,
  })}
      ${tarjeta({
    titulo: 'Logros recientes',
    extra: `<span class="tenue">${estado.progreso.logros.length} de ${LOGROS.length}</span>`,
    cuerpo: logrosRecientes.length
      ? `<ul class="logros">${logrosRecientes.map((l) => `<li><span class="logro__icono">${l.icono}</span>
            <div><strong>${esc(l.nombre)}</strong><br><span class="tenue">${esc(l.desc)}</span></div>
            <span class="ficha ficha--chica">+${l.tokens} ${MONEDA.simbolo}</span></li>`).join('')}</ul>`
      : '<p class="vacio">Todavía no desbloqueas logros. El primero llega con tu primer hábito cumplido.</p>',
  })}
    </div>
  </div>`;
}

function saludo() {
  const h = new Date().getHours();
  if (h < 6) return 'Buena madrugada';
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}
