// Perfil: datos personales, objetivos calculados, apariencia del avatar y respaldo de datos.

import { tarjeta, estadistica, aviso, esc, modal, cerrarModal } from './comun.js';
import { FACTORES_ACTIVIDAD, OBJETIVOS, calcularObjetivos, imc, clasificarIMC } from '../nucleo/nutricion.js';
import { EQUIPOS } from '../datos/ejercicios.js';
import { TONOS_PIEL, dibujarAvatar } from '../nucleo/avatar.js';
import { atuendosDesbloqueados, aurasDesbloqueadas, temasDesbloqueados, tieneEfecto } from '../nucleo/tienda.js';
import { exportar, importar, estadoInicial } from '../nucleo/almacen.js';
import { num, redondear, hoyISO } from '../nucleo/utiles.js';

export const acciones = {
  guardarPerfil(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    const perfil = {
      nombre: (d.nombre || '').trim(),
      sexo: d.sexo,
      edad: Number(d.edad) || 30,
      pesoKg: Number(d.pesoKg) || 75,
      alturaCm: Number(d.alturaCm) || 172,
      actividad: d.actividad,
      objetivo: d.objetivo,
      diasEntreno: Number(d.diasEntreno) || 3,
      equipo: d.equipo,
      comidas: Number(d.comidas) || 4,
      tonoPiel: d.tonoPiel,
      ingresoMensual: Number(d.ingresoMensual) || 0,
    };
    if (perfil.edad < 12 || perfil.edad > 100) { aviso('Ingresa una edad entre 12 y 100 años.', 'aviso'); return; }
    if (perfil.alturaCm < 120 || perfil.alturaCm > 230) { aviso('Ingresa una altura entre 120 y 230 cm.', 'aviso'); return; }
    if (perfil.pesoKg < 25 || perfil.pesoKg > 350) { aviso('Ingresa un peso entre 25 y 350 kg.', 'aviso'); return; }

    ctx.aplicar((estado) => ({
      ...estado,
      configurado: true,
      perfil,
      ahorroInicial: Number(d.ahorroInicial ?? estado.ahorroInicial) || 0,
      pesos: estado.pesos.some((p) => p.fecha === hoyISO())
        ? estado.pesos.map((p) => (p.fecha === hoyISO() ? { ...p, peso: perfil.pesoKg } : p))
        : [...estado.pesos, { fecha: hoyISO(), peso: perfil.pesoKg }],
    }));
    aviso('Perfil guardado. Los objetivos se recalcularon.', 'bien');
  },

  aplicarApariencia(ctx, formulario, evento) {
    evento.preventDefault();
    const d = Object.fromEntries(new FormData(formulario));
    ctx.aplicar((estado) => ({
      ...estado,
      tema: d.tema || 'base',
      perfil: { ...estado.perfil, tonoPiel: d.tonoPiel },
      progreso: { ...estado.progreso, avatar: { ...estado.progreso.avatar, atuendo: d.atuendo, aura: d.aura || null } },
    }));
    aviso('Apariencia actualizada.', 'bien');
  },

  exportar(ctx) {
    const texto = exportar(ctx.estado);
    const blob = new Blob([texto], { type: 'application/json' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `evoluciona-respaldo-${hoyISO()}.json`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    aviso('Respaldo descargado.', 'bien');
  },

  importar(ctx) {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'application/json,.json';
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files?.[0];
      if (!archivo) return;
      try {
        const texto = await archivo.text();
        const nuevo = importar(texto);
        if (!confirm('Esto reemplaza todos los datos actuales por los del archivo. ¿Continuar?')) return;
        ctx.reemplazar(nuevo);
        aviso('Datos importados.', 'bien');
      } catch (error) {
        aviso('El archivo no se pudo leer: ' + esc(error.message), 'mal', 5000);
      }
    });
    entrada.click();
  },

  reiniciar(ctx) {
    modal({
      titulo: 'Empezar de cero',
      cuerpo: `<p>Esto borra <strong>todo</strong>: hábitos, entrenamientos, comidas, movimientos de dinero, tokens, logros y nivel.
        No se puede deshacer.</p>
        <p class="tenue">Si solo quieres cambiar de teléfono, usa "Descargar respaldo" en lugar de esto.</p>
        <div class="formulario__pie">
          <button class="boton" data-accion="cerrar">Cancelar</button>
          <button class="boton boton--peligro" data-accion="confirmarReinicio">Sí, borrar todo</button>
        </div>`,
    });
  },
  confirmarReinicio(ctx) {
    cerrarModal();
    ctx.reemplazar(estadoInicial());
    aviso('Todo reiniciado.', 'info');
  },
  cerrar() { cerrarModal(); },
};

export function html(ctx) {
  const { estado, stats } = ctx;
  const p = estado.perfil;
  const objetivos = calcularObjetivos(p);
  const indiceMasa = imc(p.pesoKg, p.alturaCm);
  const clase = clasificarIMC(indiceMasa);
  const atuendos = atuendosDesbloqueados(estado.progreso);
  const auras = aurasDesbloqueadas(estado.progreso);
  const temas = [{ id: 'base', nombre: 'Predeterminado' }, ...temasDesbloqueados(estado.progreso)];

  return `
  <div class="vista">
    <header class="vista__cab">
      <div>
        <h1>Perfil y ajustes</h1>
        <p class="tenue">De estos datos salen tus calorías, tus macros, tu agua y la dificultad de tus rutinas.</p>
      </div>
    </header>

    ${tarjeta({
    titulo: 'Tus datos',
    cuerpo: `
      <form class="formulario" data-accion="guardarPerfil">
        <div class="formulario__fila">
          <label>Nombre<input name="nombre" value="${esc(p.nombre)}" placeholder="Cómo te llamamos"></label>
          <label>Sexo biológico<select name="sexo">
            <option value="masculino" ${p.sexo === 'masculino' ? 'selected' : ''}>Masculino</option>
            <option value="femenino" ${p.sexo === 'femenino' ? 'selected' : ''}>Femenino</option>
          </select></label>
          <label>Edad<input type="number" name="edad" min="12" max="100" value="${p.edad}"></label>
        </div>
        <div class="formulario__fila">
          <label>Peso (kg)<input type="number" name="pesoKg" step="0.1" min="25" max="350" value="${p.pesoKg}"></label>
          <label>Altura (cm)<input type="number" name="alturaCm" min="120" max="230" value="${p.alturaCm}"></label>
          <label>Tono de piel del avatar<select name="tonoPiel">
            ${Object.keys(TONOS_PIEL).map((t) => `<option value="${t}" ${p.tonoPiel === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select></label>
        </div>
        <label>Nivel de actividad diaria<select name="actividad">
          ${Object.entries(FACTORES_ACTIVIDAD).map(([k, v]) => `<option value="${k}" ${p.actividad === k ? 'selected' : ''}>${esc(v.etiqueta)}</option>`).join('')}
        </select></label>
        <label>Objetivo<select name="objetivo">
          ${Object.entries(OBJETIVOS).map(([k, v]) => `<option value="${k}" ${p.objetivo === k ? 'selected' : ''}>${esc(v.etiqueta)}</option>`).join('')}
        </select></label>
        <div class="formulario__fila">
          <label>Días de entrenamiento por semana<input type="number" name="diasEntreno" min="2" max="6" value="${p.diasEntreno}"></label>
          <label>Equipo disponible<select name="equipo">
            ${Object.entries(EQUIPOS).map(([k, v]) => `<option value="${k}" ${p.equipo === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}
          </select></label>
          <label>Comidas al día<select name="comidas">
            ${[3, 4, 5].map((n) => `<option value="${n}" ${p.comidas === n ? 'selected' : ''}>${n} comidas</option>`).join('')}
          </select></label>
        </div>
        <div class="formulario__fila">
          <label>Ingreso mensual aproximado<input type="number" name="ingresoMensual" min="0" step="10000" value="${p.ingresoMensual}"></label>
          <label>Ahorro que ya tienes<input type="number" name="ahorroInicial" min="0" step="10000" value="${estado.ahorroInicial}"></label>
        </div>
        <div class="formulario__pie"><button type="submit" class="boton boton--principal">Guardar perfil</button></div>
      </form>`,
  })}

    ${tarjeta({
    titulo: 'Lo que la app calcula con esos datos',
    cuerpo: `<div class="rejilla rejilla--4">
        ${estadistica({ valor: num(objetivos.tmb), etiqueta: 'Metabolismo basal', detalle: 'kcal en reposo (Mifflin-St Jeor)' })}
        ${estadistica({ valor: num(objetivos.get), etiqueta: 'Gasto total diario', detalle: `factor ${FACTORES_ACTIVIDAD[p.actividad]?.factor}` })}
        ${estadistica({ valor: num(objetivos.kcal), etiqueta: 'Meta calórica', detalle: esc(OBJETIVOS[p.objetivo]?.etiqueta || '') })}
        ${estadistica({ valor: redondear(indiceMasa, 1), etiqueta: 'IMC', detalle: clase.texto, tono: clase.tono })}
      </div>
      <table class="tabla tabla--compacta">
        <thead><tr><th>Nutriente</th><th>Objetivo diario</th><th>De dónde sale</th></tr></thead>
        <tbody>
          <tr><td>Proteínas</td><td>${num(objetivos.prot)} g</td><td class="tenue">${OBJETIVOS[p.objetivo]?.protPorKg} g por kilo de peso</td></tr>
          <tr><td>Carbohidratos</td><td>${num(objetivos.carb)} g</td><td class="tenue">las calorías que quedan después de proteína y grasa</td></tr>
          <tr><td>Grasas</td><td>${num(objetivos.grasa)} g</td><td class="tenue">${OBJETIVOS[p.objetivo]?.grasaPorKg} g por kilo de peso</td></tr>
          <tr><td>Fibra</td><td>${num(objetivos.fibra)} g</td><td class="tenue">14 g por cada 1.000 kcal</td></tr>
          <tr><td>Agua</td><td>${num(objetivos.agua)} ml</td><td class="tenue">35 ml por kilo + 500 ml por entrenamiento</td></tr>
          <tr><td>Azúcares libres</td><td>máximo ${num(objetivos.azucar)} g</td><td class="tenue">10% de las calorías (ideal bajo ${num(objetivos.azucarIdeal)} g)</td></tr>
          <tr><td>Sodio</td><td>máximo ${num(objetivos.sodio)} mg</td><td class="tenue">recomendación de la OMS</td></tr>
        </tbody>
      </table>`,
  })}

    ${tarjeta({
    titulo: 'Apariencia',
    cuerpo: `
      <div class="apariencia">
        <div class="apariencia__vista">
          ${dibujarAvatar({ nivel: stats.nivel, atributos: stats.atributos, avatar: estado.progreso.avatar, tonoPiel: p.tonoPiel, racha: stats.racha })}
        </div>
        <form class="formulario" data-accion="aplicarApariencia">
          <label>Atuendo<select name="atuendo">
            ${atuendos.map((a) => `<option value="${a.id}" ${estado.progreso.avatar.atuendo === a.id ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}
          </select></label>
          <label>Aura<select name="aura">
            ${auras.map((a) => `<option value="${a.id}" ${(estado.progreso.avatar.aura || '') === a.id ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}
          </select></label>
          <label>Tono de piel<select name="tonoPiel">
            ${Object.keys(TONOS_PIEL).map((t) => `<option value="${t}" ${p.tonoPiel === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select></label>
          <label>Tema de la app<select name="tema">
            ${temas.map((t) => `<option value="${t.id}" ${estado.tema === t.id ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}
          </select></label>
          <p class="tenue">Los atuendos, auras y temas adicionales se desbloquean en la tienda.</p>
          <div class="formulario__pie"><button type="submit" class="boton boton--principal">Aplicar</button></div>
        </form>
      </div>`,
  })}

    ${tarjeta({
    titulo: 'Tus datos y respaldos',
    cuerpo: `
      <p class="tenue">Todo se guarda solo en este dispositivo, en el almacenamiento del navegador. Nada se sube a internet.
        Si borras los datos del navegador o cambias de equipo, necesitas un respaldo.</p>
      <div class="botones">
        <button class="boton" data-accion="exportar">Descargar respaldo</button>
        <button class="boton" data-accion="importar">Restaurar desde archivo</button>
        <button class="boton boton--peligro" data-accion="reiniciar">Empezar de cero</button>
      </div>
      <p class="tenue g-nota">${tieneEfecto(estado.progreso, 'func:exportar')
      ? 'Tienes la herramienta de respaldo desbloqueada: también puedes exportar desde cualquier dispositivo.'
      : 'La herramienta "Exportar e importar datos" de la tienda agrega respaldo automático semanal.'}</p>`,
  })}

    ${tarjeta({
    titulo: 'Cómo funciona el juego',
    cuerpo: `
      <ul class="lista-check">
        <li>Cada acción real (hábito, serie, comida registrada, gasto anotado) entrega <strong>XP</strong>, que sube tu nivel.</li>
        <li>El nivel abre etapas del avatar y niveles de entrenamiento más difíciles.</li>
        <li>Las metas cumplidas entregan <strong>tokens ◈</strong>, que se canjean por contenido en la tienda.</li>
        <li>El avatar no es decorativo: su ancho de hombros sale de tu carga levantada, su definición de tus días en meta calórica,
          su halo de tu racha y su emblema de tu salud financiera.</li>
        <li>Nada se paga dos veces: si editas o borras un registro antiguo, los premios ya entregados se mantienen.</li>
      </ul>`,
  })}
  </div>`;
}

/** Pantalla de bienvenida para la primera vez. */
export function htmlBienvenida() {
  return `
  <div class="bienvenida">
    <div class="bienvenida__caja">
      <h1>Evoluciona</h1>
      <p class="bienvenida__lema">Una sola app para tu rutina, tu comida, tu entrenamiento y tu plata.
        Todo lo que cumples hace evolucionar a tu avatar.</p>
      <div class="bienvenida__puntos">
        <div><strong>🔥 Rutina</strong><span>Hábitos con racha y día perfecto.</span></div>
        <div><strong>🏋️ Entrenamiento</strong><span>Rutinas que se desbloquean por nivel, con progresión de carga.</span></div>
        <div><strong>🥗 Nutrición</strong><span>Calorías, proteína, agua, azúcar y sodio calculados para ti.</span></div>
        <div><strong>💰 Finanzas</strong><span>Gastos, presupuesto, ahorro y metas con proyección.</span></div>
      </div>
      <form class="formulario" data-accion="guardarPerfil">
        <div class="formulario__fila">
          <label>¿Cómo te llamas?<input name="nombre" placeholder="Tu nombre"></label>
          <label>Sexo biológico<select name="sexo"><option value="masculino">Masculino</option><option value="femenino">Femenino</option></select></label>
          <label>Edad<input type="number" name="edad" min="12" max="100" value="30" required></label>
        </div>
        <div class="formulario__fila">
          <label>Peso (kg)<input type="number" name="pesoKg" step="0.1" min="25" max="350" value="75" required></label>
          <label>Altura (cm)<input type="number" name="alturaCm" min="120" max="230" value="172" required></label>
          <label>Tono de piel<select name="tonoPiel">
            ${Object.keys(TONOS_PIEL).map((t) => `<option value="${t}" ${t === 'medio' ? 'selected' : ''}>${t}</option>`).join('')}
          </select></label>
        </div>
        <label>¿Cuánto te mueves en el día?<select name="actividad">
          ${Object.entries(FACTORES_ACTIVIDAD).map(([k, v]) => `<option value="${k}" ${k === 'ligero' ? 'selected' : ''}>${esc(v.etiqueta)}</option>`).join('')}
        </select></label>
        <label>¿Qué quieres lograr?<select name="objetivo">
          ${Object.entries(OBJETIVOS).map(([k, v]) => `<option value="${k}" ${k === 'perder' ? 'selected' : ''}>${esc(v.etiqueta)}</option>`).join('')}
        </select></label>
        <div class="formulario__fila">
          <label>Días de entreno por semana<input type="number" name="diasEntreno" min="2" max="6" value="3"></label>
          <label>Equipo<select name="equipo">
            ${Object.entries(EQUIPOS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}
          </select></label>
          <label>Comidas al día<select name="comidas"><option value="3">3</option><option value="4" selected>4</option><option value="5">5</option></select></label>
        </div>
        <div class="formulario__fila">
          <label>Ingreso mensual (opcional)<input type="number" name="ingresoMensual" min="0" step="10000" value="0"></label>
          <label>Ahorro actual (opcional)<input type="number" name="ahorroInicial" min="0" step="10000" value="0"></label>
        </div>
        <p class="tenue">Todo queda guardado solo en este dispositivo. Puedes cambiarlo después en tu perfil.</p>
        <div class="formulario__pie"><button type="submit" class="boton boton--principal boton--grande">Crear mi avatar</button></div>
      </form>
    </div>
  </div>`;
}
