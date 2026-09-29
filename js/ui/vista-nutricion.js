// Nutrición: registro de comidas, macros, agua y orientación del día.

import {
  tarjeta, estadistica, barraMacro, anillo, listaNotas, lineaTiempo,
  aviso, esc, vacio, modal, cerrarModal,
} from './comun.js';
import { buscarAlimentos, MAPA_ALIMENTOS, escalar } from '../datos/alimentos.js';
import { PLATOS, CATEGORIAS_PLATOS } from '../datos/platos.js';
import { buscarProducto, productoManual, soportaEscaneo, codigoValido, normalizarCodigo, FORMATOS } from '../nucleo/productos.js';
import { evaluarMicros, leerMicros, sugerirParaMicro } from '../nucleo/micronutrientes.js';
import { orientacionDelDia, repartirComidas, proyectarPeso, OBJETIVOS, imc, clasificarIMC } from '../nucleo/nutricion.js';
import {
  diaNutricion, agregarComida, quitarComida, sumarAgua, registrarPeso,
  guardarProducto, borrarProducto,
} from '../nucleo/almacen.js';
import { tieneEfecto } from '../nucleo/tienda.js';
import { generarMenuSemanal, recetasConMacros } from '../nucleo/menus.js';
import { hoyISO, sumarDias, num, redondear } from '../nucleo/utiles.js';

let fechaVista = hoyISO();
let busqueda = '';
let momentoActual = 'Desayuno';
let categoriaPlatos = CATEGORIAS_PLATOS[0];
let camara = null;          // { stream, video, detector, timer } mientras el escáner está abierto

export const acciones = {
  buscar(ctx, elemento) {
    busqueda = elemento.value;
    const contenedor = document.querySelector('[data-resultados]');
    if (contenedor) contenedor.innerHTML = resultadosBusqueda(ctx);
  },
  elegirMomento(ctx, elemento) {
    momentoActual = elemento.value;
  },
  agregar(ctx, elemento) {
    const alimentoId = elemento.dataset.id;
    const alimento = MAPA_ALIMENTOS.get(alimentoId);
    if (!alimento) return;
    const entrada = document.querySelector(`[data-gramos="${alimentoId}"]`);
    const gramos = Number(entrada?.value) || alimento.porcion;
    ctx.aplicar((estado) => agregarComida(estado, { alimentoId, gramos, momento: momentoActual }, fechaVista));
  },
  quitar(ctx, elemento) {
    ctx.aplicar((estado) => quitarComida(estado, elemento.dataset.id, fechaVista));
  },
  agua(ctx, elemento) {
    ctx.aplicar((estado) => sumarAgua(estado, Number(elemento.dataset.ml), fechaVista));
  },
  cambiarDia(ctx, elemento) {
    const nueva = sumarDias(fechaVista, Number(elemento.dataset.delta) || 0);
    if (nueva > hoyISO()) { aviso('No puedes registrar días futuros.', 'aviso'); return; }
    fechaVista = nueva;
    ctx.refrescar();
  },
  hoy(ctx) { fechaVista = hoyISO(); ctx.refrescar(); },
  guardarPeso(ctx, formulario, evento) {
    evento.preventDefault();
    const peso = Number(new FormData(formulario).get('peso'));
    if (!peso || peso < 25 || peso > 350) { aviso('Ingresa un peso válido en kilos.', 'aviso'); return; }
    ctx.aplicar((estado) => registrarPeso(estado, peso, hoyISO()));
    aviso('Peso registrado. Los objetivos se recalcularon.', 'bien');
  },
  verMenu(ctx, elemento) {
    const tipo = elemento.dataset.tipo;
    const menu = generarMenuSemanal(diaNutricion(ctx.estado).objetivos, tipo, ctx.estado.perfil.comidas, ctx.estado.perfil.nombre || 'evo');
    modal({
      titulo: `Menú de 7 días · ${menu.nombre}`,
      ancho: 860,
      cuerpo: `
        <p class="tenue">${esc(menu.descripcion)} Calculado para ${num(menu.objetivos.kcal)} kcal y ${num(menu.objetivos.prot)} g de proteína al día.</p>
        <div class="menu">
          ${menu.dias.map((d) => `
            <details class="menu__dia">
              <summary><strong>${d.dia}</strong> <span class="tenue">${num(d.total.kcal)} kcal · ${num(d.total.prot)} g proteína · ${num(d.total.fibra)} g fibra</span></summary>
              ${d.comidas.map((c) => `
                <div class="menu__comida">
                  <strong>${esc(c.nombre)}</strong> <span class="tenue">${num(c.total.kcal)} kcal</span>
                  <ul>${c.items.map((i) => `<li>${esc(MAPA_ALIMENTOS.get(i.alimentoId)?.nombre || '')} — ${num(i.gramos)} g</li>`).join('')}</ul>
                </div>`).join('')}
            </details>`).join('')}
        </div>
        <h3>Lista de compras de la semana</h3>
        <table class="tabla">
          <thead><tr><th>Alimento</th><th>Categoría</th><th>Cantidad</th></tr></thead>
          <tbody>${menu.compras.map((c) => `<tr><td>${esc(c.nombre)}</td><td class="tenue">${esc(c.categoria)}</td><td>${c.gramos >= 1000 ? `${c.kilos} kg` : `${c.gramos} g`}</td></tr>`).join('')}</tbody>
        </table>`,
    });
  },
  verRecetas(ctx) {
    const recetas = recetasConMacros();
    modal({
      titulo: 'Recetario de alta proteína',
      ancho: 820,
      cuerpo: `<div class="recetas">${recetas.map((r) => `
        <article class="receta">
          <header><strong>${esc(r.nombre)}</strong>
            <span class="ficha ficha--chica">${num(r.total.prot)} g proteína · ${num(r.total.kcal)} kcal</span></header>
          <ul>${r.items.map((i) => `<li>${esc(MAPA_ALIMENTOS.get(i.alimentoId)?.nombre || '')} — ${num(i.gramos)} g</li>`).join('')}</ul>
          <p class="tenue">${esc(r.pasos)}</p>
        </article>`).join('')}</div>`,
    });
  },
  // --- Platos preparados ---
  verPlatos(ctx) { abrirPlatos(ctx); },
  filtrarPlatos(ctx, elemento) {
    categoriaPlatos = elemento.dataset.cat;
    const caja = document.querySelector('[data-lista-platos]');
    if (caja) caja.innerHTML = listaPlatos();
    document.querySelectorAll('[data-accion="filtrarPlatos"]').forEach((b) => {
      b.classList.toggle('chip--activo', b.dataset.cat === categoriaPlatos);
    });
  },
  agregarPlato(ctx, elemento) {
    const plato = MAPA_ALIMENTOS.get(elemento.dataset.id);
    if (!plato) return;
    const entrada = document.querySelector(`[data-gramos="${elemento.dataset.id}"]`);
    const gramos = Number(entrada?.value) || plato.porcion;
    ctx.aplicar((estado) => agregarComida(estado, { alimentoId: plato.id, gramos, momento: momentoActual }, fechaVista));
    cerrarModal();
    aviso(`${plato.nombre} agregado a ${momentoActual}.`, 'bien');
  },

  // --- Escáner de códigos ---
  escanear(ctx) { abrirEscaner(ctx); },
  async leerCodigoManual(ctx, formulario, evento) {
    evento.preventDefault();
    const codigo = new FormData(formulario).get('codigo');
    await resolverCodigo(ctx, codigo);
  },
  cargarAMano(ctx, elemento) { formularioManual(ctx, elemento.dataset.codigo || ''); },
  guardarManual(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    if (!d.nombre?.trim()) { aviso('Ponle nombre al producto.', 'aviso'); return; }
    if (!Number(d.kcal)) { aviso('Las calorías por 100 g son obligatorias: están en la tabla del envase.', 'aviso'); return; }
    const producto = productoManual(d);
    ctx.aplicar((estado) => guardarProducto(estado, producto));
    cerrarModal();
    aviso(`"${producto.nombre}" guardado en tu despensa. La próxima vez lo encuentras al tiro.`, 'bien', 4500);
  },
  agregarProducto(ctx, elemento) {
    const producto = MAPA_ALIMENTOS.get(elemento.dataset.id);
    if (!producto) return;
    const entrada = document.querySelector(`[data-gramos="${elemento.dataset.id}"]`);
    const gramos = Number(entrada?.value) || producto.porcion;
    ctx.aplicar((estado) => agregarComida(estado, { alimentoId: producto.id, gramos, momento: momentoActual }, fechaVista));
    cerrarModal();
  },
  verDespensa(ctx) { abrirDespensa(ctx); },
  borrarProducto(ctx, elemento) {
    ctx.aplicar((estado) => borrarProducto(estado, elemento.dataset.clave));
    abrirDespensa(ctx);
  },

  // --- Micronutrientes ---
  verMicros(ctx) {
    const dia = diaNutricion(ctx.estado, fechaVista);
    const ev = evaluarMicros(dia.registros, ctx.estado.perfil);
    const mensajes = leerMicros(ev, ctx.stats.nutricion.diasRegistrados);
    modal({
      titulo: 'Micronutrientes del día',
      ancho: 720,
      cuerpo: `
        <div class="macros">${ev.filas.map((f) => barraMacro({
        clave: f.nombre, consumido: f.consumido, meta: f.meta, unidad: f.unidad,
        pct: f.pct, estado: f.estado === 'cerca' ? 'bajo' : f.estado, tipo: 'meta',
      })).join('')}</div>
        <p class="tenue g-nota">Cobertura de datos: ${ev.cobertura}% de lo que registraste hoy
          (${num(ev.gramosConDato)} g con tabla de micronutrientes, ${num(ev.gramosSinDato)} g sin ella).</p>
        ${listaNotas(mensajes)}
        ${ev.alimentosSinDato.length ? `<details class="tabla-datos"><summary>Qué quedó sin datos</summary>
          <ul>${ev.alimentosSinDato.map((a) => `<li class="tenue">${esc(a.nombre)} — ${num(a.gramos)} g</li>`).join('')}</ul>
          <p class="tenue">Que no tengan dato no significa que no aporten: significa que no lo sabemos.</p></details>` : ''}
        <h3 class="sub">Para cerrar lo que falta</h3>
        ${ev.filas.filter((f) => f.estado === 'bajo').slice(0, 2).map((f) => `
          <div class="menu__comida">
            <strong>${esc(f.nombre)}</strong> <span class="tenue">faltan ${f.falta} ${f.unidad}</span>
            <ul>${sugerirParaMicro(f.clave, 4).map((s) => `<li>${esc(s.nombre)} — ${num(s.gramos)} g aportan ${s.aporte} ${s.unidad} (${num(s.kcal)} kcal)</li>`).join('')}</ul>
          </div>`).join('') || '<p class="tenue">Nada que cerrar: los cuatro están cubiertos.</p>'}
        <p class="tenue g-nota">Valores referenciales de tablas de composición. Cambian con el cultivo, la cocción y la marca:
          sirven para detectar déficits sostenidos, no para calcular una dieta clínica.</p>`,
    });
  },

  cerrar() { cerrarModal(); detenerCamara(); },
};

/* ---------- platos preparados ---------- */

function listaPlatos() {
  const lista = PLATOS.filter((p) => p.cat === categoriaPlatos);
  return lista.map((p) => {
    const n = escalar(p, p.porcion);
    return `<article class="alimento">
      <div class="alimento__info">
        <strong>${esc(p.nombre)}</strong>
        <span class="tenue">${p.porcion} g (${esc(p.medida)}) · <strong>${num(n.kcal)} kcal</strong> ·
          P ${num(n.prot, 1)} C ${num(n.carb, 1)} G ${num(n.grasa, 1)} · sodio ${num(n.sodio)} mg</span>
        <span class="tenue">${esc(p.composicion)}</span>
        <span class="marca marca--aviso">${esc(p.consejo)}</span>
      </div>
      <input type="number" value="${p.porcion}" min="1" step="10" data-gramos="${esc(p.id)}" aria-label="Gramos de ${esc(p.nombre)}">
      <button class="boton boton--chico boton--principal" data-accion="agregarPlato" data-id="${esc(p.id)}">Agregar</button>
    </article>`;
  }).join('');
}

function abrirPlatos() {
  modal({
    titulo: 'Comida preparada',
    ancho: 820,
    cuerpo: `
      <p class="tenue">Lo que se come fuera de casa, con la porción con que se sirve en Chile.
        Son promedios de restaurante corriente: cambian con la receta y la mano del cocinero,
        pero registrar un valor razonable es mucho mejor que no registrar nada.</p>
      <div class="filtros">
        ${CATEGORIAS_PLATOS.map((c) => `<button class="chip ${c === categoriaPlatos ? 'chip--activo' : ''}"
          data-accion="filtrarPlatos" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>
      <div class="alimentos" data-lista-platos>${listaPlatos()}</div>`,
  });
}

/* ---------- escáner ---------- */

function detenerCamara() {
  if (!camara) return;
  clearInterval(camara.timer);
  camara.stream?.getTracks().forEach((t) => t.stop());
  camara = null;
}

function abrirEscaner(ctx) {
  const puede = soportaEscaneo();
  modal({
    titulo: 'Escanear producto',
    ancho: 560,
    cuerpo: `
      ${puede
      ? `<div class="escaner"><video data-video autoplay muted playsinline></video>
           <div class="escaner__mira"></div></div>
         <p class="tenue" data-estado-escaner>Apunta al código de barras del envase.</p>`
      : `<p class="nota nota--info"><span class="nota__icono">i</span><span>Este navegador no puede leer códigos con la cámara.
           Funciona en Chrome para Android. Igual puedes escribir el código a mano.</span></p>`}
      <form class="formulario formulario--linea" data-accion="leerCodigoManual">
        <label>Código de barras<input name="codigo" inputmode="numeric" placeholder="7801234567894" autocomplete="off"></label>
        <button class="boton boton--principal" type="submit">Buscar</button>
      </form>
      <div data-resultado-escaner></div>
      <p class="tenue g-nota">Buscar un producto nuevo necesita internet una sola vez: los datos vienen de Open Food Facts,
        una base abierta. Después queda guardado en tu dispositivo y funciona sin conexión.
        Si no aparece, lo cargas a mano una vez copiando la tabla del envase.</p>`,
  });

  if (puede) iniciarCamara(ctx);
}

async function iniciarCamara(ctx) {
  const video = document.querySelector('[data-video]');
  const estado = document.querySelector('[data-estado-escaner]');
  if (!video) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, audio: false,
    });
    video.srcObject = stream;
    const detector = new window.BarcodeDetector({ formats: FORMATOS });
    camara = { stream, video, detector, timer: null };

    camara.timer = setInterval(async () => {
      if (!camara || video.readyState !== 4) return;
      try {
        const codigos = await detector.detect(video);
        const leido = codigos.find((c) => codigoValido(c.rawValue));
        if (!leido) return;
        detenerCamara();
        if (estado) estado.textContent = `Código leído: ${leido.rawValue}`;
        await resolverCodigo(ctx, leido.rawValue);
      } catch { /* un fotograma borroso no es un error */ }
    }, 400);
  } catch (error) {
    if (estado) {
      estado.innerHTML = '<span class="marca marca--aviso">! No se pudo abrir la cámara' +
        (error?.name === 'NotAllowedError' ? ': falta el permiso' : '') + '. Escribe el código a mano.</span>';
    }
  }
}

async function resolverCodigo(ctx, codigo) {
  const caja = document.querySelector('[data-resultado-escaner]');
  const c = normalizarCodigo(codigo);
  if (caja) caja.innerHTML = '<p class="tenue">Buscando…</p>';

  const r = await buscarProducto(c, { guardados: ctx.estado.productos });

  if (!r.ok) {
    if (caja) {
      caja.innerHTML = `<p class="nota nota--aviso"><span class="nota__icono">!</span><span>${esc(r.mensaje)}</span></p>
        ${r.motivo === 'invalido' ? '' : `<div class="botones"><button class="boton boton--principal" data-accion="cargarAMano" data-codigo="${esc(c)}">Cargarlo a mano</button></div>`}`;
    }
    return;
  }

  const p = r.producto;
  if (r.origen === 'internet') ctx.aplicar((estado) => guardarProducto(estado, p));
  const n = escalar(p, p.porcion);
  if (caja) {
    caja.innerHTML = `
      <article class="alimento">
        <div class="alimento__info">
          <strong>${esc(p.nombre)}</strong>
          <span class="tenue">${r.origen === 'guardado' ? 'ya estaba en tu despensa' : 'nuevo, guardado en tu despensa'} ·
            ${p.envase ? esc(p.envase) + ' · ' : ''}por 100 g: ${num(p.kcal)} kcal</span>
          <span class="tenue">Porción de ${num(p.porcion)} g: <strong>${num(n.kcal)} kcal</strong> ·
            P ${num(n.prot, 1)} C ${num(n.carb, 1)} G ${num(n.grasa, 1)} · azúcar ${num(n.azucar, 1)} g · sodio ${num(n.sodio)} mg</span>
        </div>
        <input type="number" value="${p.porcion}" min="1" step="5" data-gramos="${esc(p.id)}" aria-label="Gramos">
        <button class="boton boton--chico boton--principal" data-accion="agregarProducto" data-id="${esc(p.id)}">Agregar a ${esc(momentoActual)}</button>
      </article>`;
  }
}

function formularioManual(ctx, codigo) {
  modal({
    titulo: 'Cargar producto a mano',
    ancho: 560,
    cuerpo: `
      <p class="tenue">Copia la tabla nutricional del envase, la columna <strong>por 100 g</strong>.
        Queda guardado para siempre en este dispositivo.</p>
      <form class="formulario" data-accion="guardarManual">
        <input type="hidden" name="codigo" value="${esc(codigo)}">
        <div class="formulario__fila">
          <label>Nombre<input name="nombre" placeholder="Ej: Yogur griego natural" required></label>
          <label>Porción habitual (g)<input type="number" name="porcion" min="1" value="100"></label>
        </div>
        <div class="formulario__fila">
          <label>Calorías (por 100 g)<input type="number" name="kcal" min="0" step="1" required></label>
          <label>Proteínas (g)<input type="number" name="prot" min="0" step="0.1" value="0"></label>
          <label>Carbohidratos (g)<input type="number" name="carb" min="0" step="0.1" value="0"></label>
        </div>
        <div class="formulario__fila">
          <label>Grasas (g)<input type="number" name="grasa" min="0" step="0.1" value="0"></label>
          <label>Azúcares (g)<input type="number" name="azucar" min="0" step="0.1" value="0"></label>
          <label>Fibra (g)<input type="number" name="fibra" min="0" step="0.1" value="0"></label>
        </div>
        <label>Sodio (mg por 100 g)<input type="number" name="sodio" min="0" step="1" value="0"></label>
        <p class="tenue">Si el envase trae la sal en gramos en vez del sodio, multiplícala por 400 para obtener los miligramos de sodio.</p>
        <div class="formulario__pie"><button class="boton boton--principal" type="submit">Guardar en mi despensa</button></div>
      </form>`,
  });
}

function abrirDespensa(ctx) {
  const productos = Object.entries(ctx.estado.productos);
  modal({
    titulo: 'Mi despensa escaneada',
    ancho: 640,
    cuerpo: productos.length
      ? `<p class="tenue">${productos.length} producto${productos.length === 1 ? '' : 's'} guardado${productos.length === 1 ? '' : 's'} en este dispositivo.
           Funcionan sin internet.</p>
         <ul class="habitos habitos--gestion">
           ${productos.map(([clave, p]) => `<li>
             <div class="habito__info">
               <strong>${esc(p.nombre)}</strong>
               <span class="tenue">${p.codigo ? 'código ' + esc(p.codigo) + ' · ' : ''}${num(p.kcal)} kcal/100 g ·
                 porción ${num(p.porcion)} g${p.manual ? ' · cargado a mano' : ''}</span>
             </div>
             <button class="boton boton--chico boton--peligro" data-accion="borrarProducto" data-clave="${esc(clave)}">Quitar</button>
           </li>`).join('')}
         </ul>`
      : vacio('Todavía no has escaneado ningún producto.'),
  });
}

export function html(ctx) {
  const { estado, stats } = ctx;
  if (fechaVista > hoyISO()) fechaVista = hoyISO();
  const dia = diaNutricion(estado, fechaVista);
  const ev = dia.evaluacion;
  const guia = orientacionDelDia(ev, { entrenaHoy: estado.entrenamientos.some((s) => s.fecha === fechaVista) });
  const reparto = repartirComidas(dia.objetivos, estado.perfil.comidas);
  const aguaTotal = dia.total.agua + (estado.aguaExtra[fechaVista] || 0);
  const esHoy = fechaVista === hoyISO();
  const indiceMasa = imc(estado.perfil.pesoKg, estado.perfil.alturaCm);
  const claseIMC = clasificarIMC(indiceMasa);
  const proyeccion = proyectarPeso(stats.nutricion.kcalRecientes, dia.objetivos, estado.perfil.pesoKg);

  const porMomento = new Map();
  for (const r of dia.registros) {
    if (!porMomento.has(r.momento)) porMomento.set(r.momento, []);
    porMomento.get(r.momento).push(r);
  }

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Nutrición</h1>
        <p class="tenue">Objetivos calculados con Mifflin-St Jeor · gasto total ${num(dia.objetivos.get)} kcal · ${esc(OBJETIVOS[estado.perfil.objetivo]?.etiqueta || '')}</p>
      </div>
      <div class="selector-fecha">
        <button class="boton-icono" data-accion="cambiarDia" data-delta="-1" aria-label="Día anterior">‹</button>
        <span>${esc(esHoy ? 'Hoy' : fechaVista)}</span>
        <button class="boton-icono" data-accion="cambiarDia" data-delta="1" aria-label="Día siguiente" ${esHoy ? 'disabled' : ''}>›</button>
        ${esHoy ? '' : '<button class="boton boton--chico" data-accion="hoy">Hoy</button>'}
      </div>
    </header>

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Balance del día',
    cuerpo: `
      <div class="dia-vistazo">
        ${anillo({
      pct: ev.kcal.pct,
      centroPrincipal: num(dia.total.kcal),
      centroSecundario: `de ${num(dia.objetivos.kcal)} kcal`,
      tono: dia.enMeta ? 'bien' : ev.kcal.pct > 110 ? 'mal' : 'aviso',
    })}
        <div class="macros">
          ${barraMacro(ev.prot)}
          ${barraMacro(ev.carb)}
          ${barraMacro(ev.grasa)}
        </div>
      </div>
      <div class="macros macros--fila">
        ${barraMacro(ev.fibra)}
        ${barraMacro(ev.azucar)}
        ${barraMacro(ev.sodio)}
      </div>`,
  })}
      ${tarjeta({
    titulo: 'Hidratación',
    cuerpo: `
      ${anillo({
      pct: (aguaTotal / dia.objetivos.agua) * 100,
      centroPrincipal: `${num(aguaTotal)}`,
      centroSecundario: `de ${num(dia.objetivos.agua)} ml`,
      tono: aguaTotal >= dia.objetivos.agua ? 'bien' : 'aviso',
    })}
      <div class="botones botones--centro">
        <button class="boton" data-accion="agua" data-ml="250">+ 1 vaso (250 ml)</button>
        <button class="boton" data-accion="agua" data-ml="500">+ 1 botella (500 ml)</button>
        <button class="boton boton--chico" data-accion="agua" data-ml="-250">− 250 ml</button>
      </div>
      <p class="tenue g-nota">Tu meta sale de 35 ml por kilo de peso más 500 ml por cada entrenamiento planificado.
        Las bebidas registradas ya cuentan aquí.</p>`,
  })}
    </div>

    ${tarjeta({
    titulo: 'Qué te conviene comer ahora',
    cuerpo: listaNotas(guia.mensajes) + (guia.sugerencias.length ? `
      <h3 class="sub">Sugerencias que cierran tus huecos de hoy</h3>
      <div class="sugerencias">
        ${guia.sugerencias.map((s) => `
          <article class="sugerencia">
            <div>
              <strong>${esc(s.nombre)}</strong>
              <span class="tenue">${num(s.gramos)} g (${esc(s.medida)}) · ${num(s.kcal)} kcal · ${esc(s.motivo)}</span>
            </div>
            <input type="number" value="${s.gramos}" min="1" step="5" data-gramos="${esc(s.id)}" aria-label="Gramos de ${esc(s.nombre)}">
            <button class="boton boton--chico boton--principal" data-accion="agregar" data-id="${esc(s.id)}">Agregar</button>
          </article>`).join('')}
      </div>` : ''),
  })}

    ${tarjeta({
    titulo: 'Registrar comida',
    extra: `<label class="etiqueta-inline">Momento
      <select data-accion="elegirMomento">
        ${reparto.map((c) => `<option ${c.nombre === momentoActual ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}
        <option ${momentoActual === 'Otro' ? 'selected' : ''}>Otro</option>
      </select></label>`,
    cuerpo: `
      <div class="botones botones--registro">
        <button class="boton boton--principal" data-accion="escanear">📷 Escanear producto</button>
        <button class="boton" data-accion="verPlatos">🍽️ Comida preparada</button>
        ${Object.keys(estado.productos).length
      ? `<button class="boton boton--chico" data-accion="verDespensa">Mi despensa (${Object.keys(estado.productos).length})</button>`
      : ''}
      </div>
      <input class="buscador" type="search" placeholder="Buscar alimento o plato: pollo, sushi, pizza, palta…" value="${esc(busqueda)}" data-accion="buscar" aria-label="Buscar alimento">
      <div data-resultados>${resultadosBusqueda(ctx)}</div>`,
  })}

    ${tarjeta({
    titulo: `Lo que comiste ${esHoy ? 'hoy' : `el ${fechaVista}`}`,
    extra: `<span class="tenue">${dia.registros.length} registros</span>`,
    cuerpo: dia.registros.length
      ? `<div class="comidas">${[...porMomento.entries()].map(([momento, lista]) => {
        const total = lista.reduce((acc, r) => {
          const n = escalar(MAPA_ALIMENTOS.get(r.alimentoId) || { kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0 }, r.gramos);
          return { kcal: acc.kcal + n.kcal, prot: acc.prot + n.prot };
        }, { kcal: 0, prot: 0 });
        return `<div class="comida">
            <header><strong>${esc(momento)}</strong><span class="tenue">${num(total.kcal)} kcal · ${num(total.prot, 1)} g proteína</span></header>
            <ul>${lista.map((r) => {
          const a = MAPA_ALIMENTOS.get(r.alimentoId);
          const n = escalar(a, r.gramos);
          return `<li>
                  <span>${esc(a?.nombre || r.alimentoId)} <span class="tenue">${num(r.gramos)} g</span></span>
                  <span class="tenue">${num(n.kcal)} kcal · P ${num(n.prot, 1)} · C ${num(n.carb, 1)} · G ${num(n.grasa, 1)}</span>
                  <button class="boton-icono" data-accion="quitar" data-id="${esc(r.id)}" aria-label="Quitar">✕</button>
                </li>`;
        }).join('')}</ul>
          </div>`;
      }).join('')}</div>`
      : vacio('Todavía no registras nada este día.'),
  })}

    ${tarjeta({
    titulo: 'Reparto sugerido de comidas',
    cuerpo: `<table class="tabla">
        <thead><tr><th>Comida</th><th>Calorías</th><th>Proteína</th><th>Carbos</th><th>Grasas</th></tr></thead>
        <tbody>${reparto.map((c) => `<tr><td>${esc(c.nombre)}</td><td>${num(c.kcal)} kcal</td><td>${num(c.prot)} g</td><td>${num(c.carb)} g</td><td>${num(c.grasa)} g</td></tr>`).join('')}</tbody>
      </table>
      <p class="tenue g-nota">Puedes cambiar el número de comidas al día desde tu perfil.</p>`,
  })}

    <div class="rejilla rejilla--2">
      ${tarjeta({
    titulo: 'Peso corporal',
    cuerpo: `
      <form class="formulario formulario--linea" data-accion="guardarPeso">
        <label>Peso de hoy (kg)<input type="number" name="peso" step="0.1" min="25" max="350" value="${estado.perfil.pesoKg}"></label>
        <button class="boton boton--principal" type="submit">Registrar</button>
      </form>
      <div class="rejilla rejilla--2">
        ${estadistica({ valor: redondear(indiceMasa, 1), etiqueta: 'IMC', detalle: claseIMC.texto, tono: claseIMC.tono })}
        ${estadistica({ valor: `${num(dia.objetivos.tmb)}`, etiqueta: 'Metabolismo basal', detalle: `gasto total ${num(dia.objetivos.get)} kcal` })}
      </div>
      ${estado.pesos.length >= 2
      ? lineaTiempo({
        puntos: estado.pesos.slice(-30).map((p) => ({ etiqueta: p.fecha, valor: p.peso })),
        formato: (v) => `${num(v, 1)} kg`,
        alto: 150,
      })
      : vacio('Registra tu peso varios días para ver la tendencia.')}
      ${proyeccion ? `<p class="nota nota--${proyeccion.sostenible ? 'bien' : 'aviso'}">
        <span class="nota__icono">${proyeccion.sostenible ? '✓' : '!'}</span>
        <span>Con un promedio de ${num(proyeccion.promedioKcal)} kcal al día tu balance es de ${proyeccion.balanceDiario > 0 ? '+' : ''}${num(proyeccion.balanceDiario)} kcal:
        eso proyecta ${proyeccion.kgPorSemana > 0 ? '+' : ''}${proyeccion.kgPorSemana} kg por semana y ${num(proyeccion.pesoEn4Semanas, 1)} kg en un mes.
        ${proyeccion.sostenible ? 'Es un ritmo sostenible.' : 'Es un ritmo demasiado agresivo: se pierde músculo y se recupera rápido.'}</span></p>` : ''}`,
  })}
      ${tarjeta({
    titulo: 'Calorías de los últimos 14 días',
    cuerpo: stats.nutricion.kcalRecientes.length >= 2
      ? lineaTiempo({
        puntos: Object.keys(estado.comidas).filter((f) => (estado.comidas[f] || []).length).sort().slice(-14)
          .map((f) => ({ etiqueta: f.slice(5), valor: Math.round(diaNutricion(estado, f).total.kcal) })),
        meta: dia.objetivos.kcal,
        etiquetaMeta: 'Meta diaria',
        formato: (v) => `${num(v)} kcal`,
      }) + `<p class="tenue g-nota">${stats.nutricion.diasEnMeta} de ${stats.nutricion.diasRegistrados} días registrados quedaron dentro de la meta.</p>`
      : vacio('Registra al menos dos días para ver la tendencia.'),
  })}
    </div>

    ${tarjeta({
    titulo: 'Contenido de nutrición desbloqueado',
    cuerpo: `<div class="desbloqueos">
        ${['deficit', 'volumen', 'economico'].map((tipo) => {
      const activo = tieneEfecto(estado.progreso, `plan:${tipo}`);
      const nombres = { deficit: 'Plan déficit sabroso', volumen: 'Plan ganancia limpia', economico: 'Plan proteína barata' };
      return `<article class="desbloqueo ${activo ? '' : 'desbloqueo--cerrado'}">
            <strong>${nombres[tipo]}</strong>
            <p class="tenue">Menú de 7 días con lista de compras, calculado para tus calorías.</p>
            ${activo
          ? `<button class="boton boton--chico boton--principal" data-accion="verMenu" data-tipo="${tipo}">Ver menú</button>`
          : '<span class="ficha ficha--chica">se canjea en la tienda</span>'}
          </article>`;
    }).join('')}
        <article class="desbloqueo ${tieneEfecto(estado.progreso, 'func:recetas') ? '' : 'desbloqueo--cerrado'}">
          <strong>Recetario de alta proteína</strong>
          <p class="tenue">10 preparaciones con más de 30 g de proteína por porción.</p>
          ${tieneEfecto(estado.progreso, 'func:recetas')
      ? '<button class="boton boton--chico boton--principal" data-accion="verRecetas">Ver recetas</button>'
      : '<span class="ficha ficha--chica">se canjea en la tienda</span>'}
        </article>
        <article class="desbloqueo ${tieneEfecto(estado.progreso, 'func:micros') ? '' : 'desbloqueo--cerrado'}">
          <strong>Panel de micronutrientes</strong>
          <p class="tenue">Hierro, calcio, potasio y vitamina C además de los macros, con lo que falta y cómo cerrarlo.</p>
          ${tieneEfecto(estado.progreso, 'func:micros')
      ? '<button class="boton boton--chico boton--principal" data-accion="verMicros">Ver micronutrientes</button>'
      : '<span class="ficha ficha--chica">se canjea en la tienda</span>'}
        </article>
      </div>`,
  })}
  </div>`;
}

function resultadosBusqueda(ctx) {
  const resultados = buscarAlimentos(busqueda, 14);
  if (!resultados.length) return vacio('Sin resultados. Prueba con otra palabra.');
  return `<div class="alimentos">
    ${resultados.map((a) => {
    const n = escalar(a, a.porcion);
    return `<article class="alimento">
        <div class="alimento__info">
          <strong>${esc(a.nombre)}</strong>
          <span class="tenue">${esc(a.cat)} · porción ${a.porcion} g (${esc(a.medida)}) · ${num(n.kcal)} kcal · P ${num(n.prot, 1)} C ${num(n.carb, 1)} G ${num(n.grasa, 1)}</span>
        </div>
        <input type="number" value="${a.porcion}" min="1" step="5" data-gramos="${esc(a.id)}" aria-label="Gramos de ${esc(a.nombre)}">
        <button class="boton boton--chico boton--principal" data-accion="agregar" data-id="${esc(a.id)}">Agregar</button>
      </article>`;
  }).join('')}
  </div>`;
}
