// Productos escaneados por código de barras.
//
// Una advertencia honesta sobre este módulo: es la única parte de la app que
// necesita internet. El código de barras de un producto no dice nada por sí
// mismo, hay que preguntarle a una base de datos quién es. Se usa Open Food
// Facts, que es abierta, gratuita y sin clave.
//
// Para que eso no rompa la promesa de funcionar sin conexión, cada producto
// consultado queda guardado en el dispositivo: la segunda vez que escanees el
// mismo yogur, la app ya no pregunta nada. Y si no hay internet y el producto
// es nuevo, se puede cargar a mano.

import { redondear } from './utiles.js';

const API = 'https://world.openfoodfacts.org/api/v2/product/';
const CAMPOS = 'code,product_name,product_name_es,generic_name,brands,quantity,serving_size,nutriments,image_front_small_url';

/**
 * Valida un código EAN-8, EAN-13 o UPC-A comprobando su dígito verificador.
 * Sirve para no salir a consultar por un código mal leído por la cámara.
 */
export function codigoValido(codigo) {
  const c = String(codigo || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(c.length)) return false;

  const digitos = c.split('').map(Number);
  const verificador = digitos.pop();
  // Se pondera de derecha a izquierda alternando 3 y 1.
  let suma = 0;
  for (let i = digitos.length - 1, peso = 3; i >= 0; i--, peso = peso === 3 ? 1 : 3) {
    suma += digitos[i] * peso;
  }
  return (10 - (suma % 10)) % 10 === verificador;
}

export function normalizarCodigo(codigo) {
  return String(codigo || '').replace(/\D/g, '');
}

/** "250 g", "1,5 L", "330ml" → gramos (los mililitros se cuentan 1:1). */
export function porcionDesdeTexto(texto, porDefecto = 100) {
  if (!texto) return porDefecto;
  const m = String(texto).replace(',', '.').match(/([\d.]+)\s*(kg|g|l|ml|cc)?/i);
  if (!m) return porDefecto;
  const valor = parseFloat(m[1]);
  if (!isFinite(valor) || valor <= 0) return porDefecto;
  const unidad = (m[2] || 'g').toLowerCase();
  if (unidad === 'kg' || unidad === 'l') return Math.round(valor * 1000);
  return Math.round(valor);
}

/**
 * Convierte la respuesta de Open Food Facts al mismo formato que usa el resto
 * de la app: todo por 100 g, con la porción declarada del envase.
 */
export function desdeOpenFoodFacts(datos) {
  if (!datos || datos.status !== 1 || !datos.product) {
    return { ok: false, motivo: 'no_encontrado' };
  }
  const p = datos.product;
  const n = p.nutriments || {};
  const numero = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

  // La energía puede venir en kcal o solo en kJ.
  let kcal = numero(n['energy-kcal_100g']);
  if (!kcal && numero(n.energy_100g)) kcal = numero(n.energy_100g) / 4.184;

  // Open Food Facts entrega el sodio en gramos; aquí se usa en miligramos.
  let sodio = numero(n.sodium_100g) * 1000;
  if (!sodio && numero(n.salt_100g)) sodio = numero(n.salt_100g) * 400;  // sal → sodio

  const nombre = (p.product_name_es || p.product_name || p.generic_name || '').trim();
  if (!nombre || !kcal) return { ok: false, motivo: 'datos_incompletos', nombre, codigo: p.code };

  const marca = (p.brands || '').split(',')[0].trim();

  return {
    ok: true,
    producto: {
      id: `cb_${p.code}`,
      codigo: String(p.code),
      nombre: marca && !nombre.toLowerCase().includes(marca.toLowerCase()) ? `${nombre} (${marca})` : nombre,
      marca,
      cat: 'Escaneado',
      escaneado: true,
      kcal: redondear(kcal, 1),
      prot: redondear(numero(n.proteins_100g), 1),
      carb: redondear(numero(n.carbohydrates_100g), 1),
      grasa: redondear(numero(n.fat_100g), 1),
      azucar: redondear(numero(n.sugars_100g), 1),
      sodio: Math.round(sodio),
      fibra: redondear(numero(n.fiber_100g), 1),
      porcion: porcionDesdeTexto(p.serving_size, porcionDesdeTexto(p.quantity, 100)),
      medida: p.serving_size ? `porción de ${p.serving_size}` : 'porción',
      envase: p.quantity || '',
      imagen: p.image_front_small_url || '',
      obtenido: new Date().toISOString().slice(0, 10),
    },
  };
}

/**
 * Busca un producto: primero en lo ya guardado, y solo si no está, en internet.
 * `traer` se inyecta para poder probar el módulo sin red.
 */
export async function buscarProducto(codigo, opciones = {}) {
  const { guardados = {}, traer = (typeof fetch !== 'undefined' ? fetch : null), señal = null } = opciones;
  const c = normalizarCodigo(codigo);

  if (!c) return { ok: false, motivo: 'vacio', mensaje: 'No se leyó ningún código.' };
  if (!codigoValido(c)) {
    return {
      ok: false, motivo: 'invalido',
      mensaje: `El código ${c} no pasa la verificación. Suele ser una lectura a medias: vuelve a escanear con mejor luz.`,
    };
  }

  if (guardados[c]) {
    return { ok: true, origen: 'guardado', producto: guardados[c] };
  }
  if (!traer) {
    return { ok: false, motivo: 'sin_red', mensaje: 'Este producto no está guardado y no hay forma de consultarlo. Cárgalo a mano.' };
  }

  try {
    const respuesta = await traer(`${API}${c}.json?fields=${CAMPOS}`, { signal: señal });
    // Un 404 no es un fallo: es la forma que tiene la API de decir que ese
    // código no está en la base. Conviene distinguirlo de una caída real.
    if (respuesta.status === 404) {
      return {
        ok: false, motivo: 'no_encontrado', codigo: c,
        mensaje: `El código ${c} no está en la base de datos abierta. Cárgalo a mano una vez y queda guardado para siempre.`,
      };
    }
    if (!respuesta.ok) {
      return { ok: false, motivo: 'error_red', codigo: c, mensaje: `La consulta falló (${respuesta.status}). Puedes cargarlo a mano.` };
    }
    const datos = await respuesta.json();
    const convertido = desdeOpenFoodFacts(datos);
    if (!convertido.ok) {
      return {
        ok: false, motivo: convertido.motivo, codigo: c,
        mensaje: convertido.motivo === 'no_encontrado'
          ? `El código ${c} no está en la base de datos abierta. Cárgalo a mano una vez y queda guardado para siempre.`
          : 'El producto existe pero no trae su tabla nutricional completa. Cárgalo a mano.',
      };
    }
    return { ok: true, origen: 'internet', producto: convertido.producto };
  } catch (error) {
    return {
      ok: false, motivo: 'sin_red', codigo: c,
      mensaje: 'No se pudo consultar (sin internet). El producto se puede cargar a mano y queda guardado.',
    };
  }
}

/** Producto cargado a mano, con los datos del envase. */
export function productoManual({ codigo, nombre, kcal, prot, carb, grasa, azucar, sodio, fibra, porcion }) {
  const c = normalizarCodigo(codigo);
  const limpio = (v) => Math.max(0, Number(v) || 0);
  return {
    id: c ? `cb_${c}` : `man_${Date.now().toString(36)}`,
    codigo: c,
    nombre: (nombre || 'Producto sin nombre').trim(),
    cat: 'Escaneado',
    escaneado: true,
    manual: true,
    kcal: limpio(kcal),
    prot: limpio(prot),
    carb: limpio(carb),
    grasa: limpio(grasa),
    azucar: Math.min(limpio(azucar), limpio(carb)),
    sodio: limpio(sodio),
    fibra: limpio(fibra),
    porcion: Math.max(1, Number(porcion) || 100),
    medida: 'porción',
    obtenido: new Date().toISOString().slice(0, 10),
  };
}

/** ¿Puede este navegador leer códigos con la cámara? */
export function soportaEscaneo() {
  return typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    !!navigator.mediaDevices?.getUserMedia;
}

export const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
