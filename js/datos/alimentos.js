// Base de alimentos por 100 g (o 100 ml en líquidos).
// kcal, prot (g), carb (g), grasa (g), azucar (g), sodio (mg), fibra (g)
// Valores de tablas de composición de alimentos de uso común en Chile, redondeados.

import { PLATOS } from './platos.js';

export const CATEGORIAS = ['Proteína', 'Carbohidrato', 'Verdura', 'Fruta', 'Lácteo', 'Grasa', 'Bebida', 'Snack'];

export const ALIMENTOS = [
  // --- Proteínas ---
  { id: 'pollo_pechuga', nombre: 'Pechuga de pollo cocida', cat: 'Proteína', kcal: 165, prot: 31, carb: 0, grasa: 3.6, azucar: 0, sodio: 74, fibra: 0, porcion: 150, medida: 'filete' },
  { id: 'pollo_muslo', nombre: 'Muslo de pollo sin piel', cat: 'Proteína', kcal: 209, prot: 26, carb: 0, grasa: 11, azucar: 0, sodio: 88, fibra: 0, porcion: 120, medida: 'muslo' },
  { id: 'carne_posta', nombre: 'Posta rosada (vacuno magro)', cat: 'Proteína', kcal: 187, prot: 30, carb: 0, grasa: 7, azucar: 0, sodio: 60, fibra: 0, porcion: 150, medida: 'bistec' },
  { id: 'carne_molida', nombre: 'Carne molida 5% grasa', cat: 'Proteína', kcal: 155, prot: 24, carb: 0, grasa: 6, azucar: 0, sodio: 70, fibra: 0, porcion: 150, medida: 'porción' },
  { id: 'cerdo_lomo', nombre: 'Lomo de cerdo', cat: 'Proteína', kcal: 195, prot: 27, carb: 0, grasa: 9, azucar: 0, sodio: 55, fibra: 0, porcion: 150, medida: 'porción' },
  { id: 'merluza', nombre: 'Merluza', cat: 'Proteína', kcal: 90, prot: 18, carb: 0, grasa: 1.5, azucar: 0, sodio: 90, fibra: 0, porcion: 180, medida: 'filete' },
  { id: 'salmon', nombre: 'Salmón', cat: 'Proteína', kcal: 208, prot: 20, carb: 0, grasa: 13, azucar: 0, sodio: 60, fibra: 0, porcion: 140, medida: 'porción' },
  { id: 'atun_agua', nombre: 'Atún en agua (lata)', cat: 'Proteína', kcal: 108, prot: 24, carb: 0, grasa: 1, azucar: 0, sodio: 320, fibra: 0, porcion: 120, medida: 'lata' },
  { id: 'jurel_lata', nombre: 'Jurel en agua (lata)', cat: 'Proteína', kcal: 140, prot: 22, carb: 0, grasa: 5, azucar: 0, sodio: 400, fibra: 0, porcion: 125, medida: 'lata' },
  { id: 'huevo', nombre: 'Huevo entero', cat: 'Proteína', kcal: 143, prot: 13, carb: 1, grasa: 10, azucar: 0.4, sodio: 142, fibra: 0, porcion: 55, medida: 'unidad' },
  { id: 'clara_huevo', nombre: 'Clara de huevo', cat: 'Proteína', kcal: 52, prot: 11, carb: 0.7, grasa: 0.2, azucar: 0.7, sodio: 166, fibra: 0, porcion: 33, medida: 'clara' },
  { id: 'lentejas', nombre: 'Lentejas cocidas', cat: 'Proteína', kcal: 116, prot: 9, carb: 20, grasa: 0.4, azucar: 1.8, sodio: 2, fibra: 8, porcion: 200, medida: 'plato' },
  { id: 'garbanzos', nombre: 'Garbanzos cocidos', cat: 'Proteína', kcal: 164, prot: 9, carb: 27, grasa: 2.6, azucar: 4.8, sodio: 7, fibra: 8, porcion: 200, medida: 'plato' },
  { id: 'porotos', nombre: 'Porotos cocidos', cat: 'Proteína', kcal: 127, prot: 9, carb: 23, grasa: 0.5, azucar: 0.3, sodio: 1, fibra: 6, porcion: 200, medida: 'plato' },
  { id: 'tofu', nombre: 'Tofu firme', cat: 'Proteína', kcal: 144, prot: 17, carb: 3, grasa: 9, azucar: 0.6, sodio: 14, fibra: 2, porcion: 150, medida: 'porción' },
  { id: 'proteina_suero', nombre: 'Proteína de suero (polvo)', cat: 'Proteína', kcal: 380, prot: 78, carb: 8, grasa: 4, azucar: 4, sodio: 300, fibra: 1, porcion: 30, medida: 'scoop' },
  { id: 'pavo_fiambre', nombre: 'Pavo laminado (fiambre)', cat: 'Proteína', kcal: 110, prot: 18, carb: 3, grasa: 2.5, azucar: 1.5, sodio: 980, fibra: 0, porcion: 40, medida: 'láminas' },

  // --- Carbohidratos ---
  { id: 'arroz_cocido', nombre: 'Arroz blanco cocido', cat: 'Carbohidrato', kcal: 130, prot: 2.7, carb: 28, grasa: 0.3, azucar: 0.1, sodio: 1, fibra: 0.4, porcion: 200, medida: 'taza' },
  { id: 'arroz_integral', nombre: 'Arroz integral cocido', cat: 'Carbohidrato', kcal: 123, prot: 2.7, carb: 26, grasa: 1, azucar: 0.4, sodio: 4, fibra: 1.8, porcion: 200, medida: 'taza' },
  { id: 'fideos', nombre: 'Fideos cocidos', cat: 'Carbohidrato', kcal: 158, prot: 6, carb: 31, grasa: 0.9, azucar: 0.6, sodio: 1, fibra: 1.8, porcion: 200, medida: 'plato' },
  { id: 'papa_cocida', nombre: 'Papa cocida', cat: 'Carbohidrato', kcal: 87, prot: 2, carb: 20, grasa: 0.1, azucar: 0.9, sodio: 5, fibra: 1.8, porcion: 200, medida: 'porción' },
  { id: 'camote', nombre: 'Camote cocido', cat: 'Carbohidrato', kcal: 90, prot: 2, carb: 21, grasa: 0.1, azucar: 6.5, sodio: 36, fibra: 3.3, porcion: 200, medida: 'porción' },
  { id: 'pan_marraqueta', nombre: 'Marraqueta', cat: 'Carbohidrato', kcal: 270, prot: 9, carb: 54, grasa: 1.5, azucar: 2, sodio: 560, fibra: 2.5, porcion: 100, medida: 'unidad' },
  { id: 'pan_integral', nombre: 'Pan integral (molde)', cat: 'Carbohidrato', kcal: 247, prot: 10, carb: 41, grasa: 3.5, azucar: 4, sodio: 450, fibra: 6, porcion: 60, medida: '2 rebanadas' },
  { id: 'hallulla', nombre: 'Hallulla', cat: 'Carbohidrato', kcal: 295, prot: 8.5, carb: 55, grasa: 4.5, azucar: 2.5, sodio: 580, fibra: 2, porcion: 100, medida: 'unidad' },
  { id: 'avena', nombre: 'Avena cruda', cat: 'Carbohidrato', kcal: 389, prot: 17, carb: 66, grasa: 7, azucar: 1, sodio: 2, fibra: 10.6, porcion: 50, medida: 'media taza' },
  { id: 'quinoa', nombre: 'Quinoa cocida', cat: 'Carbohidrato', kcal: 120, prot: 4.4, carb: 21, grasa: 1.9, azucar: 0.9, sodio: 7, fibra: 2.8, porcion: 200, medida: 'taza' },
  { id: 'tortilla_maiz', nombre: 'Tortilla de maíz', cat: 'Carbohidrato', kcal: 218, prot: 5.7, carb: 45, grasa: 2.8, azucar: 0.8, sodio: 45, fibra: 5.4, porcion: 60, medida: '2 unidades' },
  { id: 'choclo', nombre: 'Choclo (maíz) cocido', cat: 'Carbohidrato', kcal: 96, prot: 3.4, carb: 21, grasa: 1.5, azucar: 4.5, sodio: 15, fibra: 2.4, porcion: 150, medida: 'porción' },

  // --- Verduras ---
  { id: 'brocoli', nombre: 'Brócoli cocido', cat: 'Verdura', kcal: 35, prot: 2.4, carb: 7, grasa: 0.4, azucar: 1.4, sodio: 41, fibra: 3.3, porcion: 150, medida: 'porción' },
  { id: 'lechuga', nombre: 'Lechuga', cat: 'Verdura', kcal: 15, prot: 1.4, carb: 2.9, grasa: 0.2, azucar: 0.8, sodio: 28, fibra: 1.3, porcion: 80, medida: 'plato' },
  { id: 'tomate', nombre: 'Tomate', cat: 'Verdura', kcal: 18, prot: 0.9, carb: 3.9, grasa: 0.2, azucar: 2.6, sodio: 5, fibra: 1.2, porcion: 130, medida: 'unidad' },
  { id: 'zapallo_italiano', nombre: 'Zapallo italiano', cat: 'Verdura', kcal: 17, prot: 1.2, carb: 3.1, grasa: 0.3, azucar: 2.5, sodio: 8, fibra: 1, porcion: 150, medida: 'porción' },
  { id: 'zanahoria', nombre: 'Zanahoria', cat: 'Verdura', kcal: 41, prot: 0.9, carb: 10, grasa: 0.2, azucar: 4.7, sodio: 69, fibra: 2.8, porcion: 100, medida: 'unidad' },
  { id: 'espinaca', nombre: 'Espinaca', cat: 'Verdura', kcal: 23, prot: 2.9, carb: 3.6, grasa: 0.4, azucar: 0.4, sodio: 79, fibra: 2.2, porcion: 100, medida: 'porción' },
  { id: 'porotos_verdes', nombre: 'Porotos verdes', cat: 'Verdura', kcal: 31, prot: 1.8, carb: 7, grasa: 0.2, azucar: 3.3, sodio: 6, fibra: 2.7, porcion: 150, medida: 'porción' },
  { id: 'betarraga', nombre: 'Betarraga cocida', cat: 'Verdura', kcal: 44, prot: 1.7, carb: 10, grasa: 0.2, azucar: 8, sodio: 77, fibra: 2, porcion: 120, medida: 'porción' },
  { id: 'palta', nombre: 'Palta', cat: 'Grasa', kcal: 160, prot: 2, carb: 9, grasa: 15, azucar: 0.7, sodio: 7, fibra: 6.7, porcion: 70, medida: 'media unidad' },

  // --- Frutas ---
  { id: 'manzana', nombre: 'Manzana', cat: 'Fruta', kcal: 52, prot: 0.3, carb: 14, grasa: 0.2, azucar: 10.4, sodio: 1, fibra: 2.4, porcion: 180, medida: 'unidad' },
  { id: 'platano', nombre: 'Plátano', cat: 'Fruta', kcal: 89, prot: 1.1, carb: 23, grasa: 0.3, azucar: 12.2, sodio: 1, fibra: 2.6, porcion: 120, medida: 'unidad' },
  { id: 'naranja', nombre: 'Naranja', cat: 'Fruta', kcal: 47, prot: 0.9, carb: 12, grasa: 0.1, azucar: 9.4, sodio: 0, fibra: 2.4, porcion: 150, medida: 'unidad' },
  { id: 'frutilla', nombre: 'Frutillas', cat: 'Fruta', kcal: 32, prot: 0.7, carb: 7.7, grasa: 0.3, azucar: 4.9, sodio: 1, fibra: 2, porcion: 150, medida: 'taza' },
  { id: 'arandano', nombre: 'Arándanos', cat: 'Fruta', kcal: 57, prot: 0.7, carb: 14, grasa: 0.3, azucar: 10, sodio: 1, fibra: 2.4, porcion: 100, medida: 'taza' },
  { id: 'uva', nombre: 'Uva', cat: 'Fruta', kcal: 69, prot: 0.7, carb: 18, grasa: 0.2, azucar: 16, sodio: 2, fibra: 0.9, porcion: 150, medida: 'racimo chico' },
  { id: 'kiwi', nombre: 'Kiwi', cat: 'Fruta', kcal: 61, prot: 1.1, carb: 15, grasa: 0.5, azucar: 9, sodio: 3, fibra: 3, porcion: 90, medida: 'unidad' },

  // --- Lácteos ---
  { id: 'leche_desc', nombre: 'Leche descremada', cat: 'Lácteo', kcal: 35, prot: 3.4, carb: 5, grasa: 0.1, azucar: 5, sodio: 44, fibra: 0, porcion: 200, medida: 'vaso' },
  { id: 'leche_entera', nombre: 'Leche entera', cat: 'Lácteo', kcal: 61, prot: 3.2, carb: 4.8, grasa: 3.3, azucar: 4.8, sodio: 43, fibra: 0, porcion: 200, medida: 'vaso' },
  { id: 'yogur_natural', nombre: 'Yogur natural sin azúcar', cat: 'Lácteo', kcal: 59, prot: 10, carb: 3.6, grasa: 0.4, azucar: 3.6, sodio: 36, fibra: 0, porcion: 170, medida: 'pote' },
  { id: 'yogur_dulce', nombre: 'Yogur con sabor (azucarado)', cat: 'Lácteo', kcal: 95, prot: 3.5, carb: 15, grasa: 2.2, azucar: 14, sodio: 50, fibra: 0, porcion: 170, medida: 'pote' },
  { id: 'queso_gauda', nombre: 'Queso gauda', cat: 'Lácteo', kcal: 356, prot: 25, carb: 2.2, grasa: 27, azucar: 2.2, sodio: 819, fibra: 0, porcion: 30, medida: 'láminas' },
  { id: 'quesillo', nombre: 'Quesillo', cat: 'Lácteo', kcal: 98, prot: 14, carb: 3, grasa: 3, azucar: 3, sodio: 320, fibra: 0, porcion: 100, medida: 'porción' },

  // --- Grasas ---
  { id: 'aceite_oliva', nombre: 'Aceite de oliva', cat: 'Grasa', kcal: 884, prot: 0, carb: 0, grasa: 100, azucar: 0, sodio: 2, fibra: 0, porcion: 10, medida: 'cucharada' },
  { id: 'almendras', nombre: 'Almendras', cat: 'Grasa', kcal: 579, prot: 21, carb: 22, grasa: 50, azucar: 4.4, sodio: 1, fibra: 12.5, porcion: 30, medida: 'puñado' },
  { id: 'nueces', nombre: 'Nueces', cat: 'Grasa', kcal: 654, prot: 15, carb: 14, grasa: 65, azucar: 2.6, sodio: 2, fibra: 6.7, porcion: 30, medida: 'puñado' },
  { id: 'mani', nombre: 'Maní sin sal', cat: 'Grasa', kcal: 567, prot: 26, carb: 16, grasa: 49, azucar: 4.7, sodio: 18, fibra: 8.5, porcion: 30, medida: 'puñado' },
  { id: 'mantequilla', nombre: 'Mantequilla', cat: 'Grasa', kcal: 717, prot: 0.9, carb: 0.1, grasa: 81, azucar: 0.1, sodio: 643, fibra: 0, porcion: 10, medida: 'cucharadita' },

  // --- Bebidas ---
  { id: 'agua', nombre: 'Agua', cat: 'Bebida', kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 0, fibra: 0, porcion: 250, medida: 'vaso', agua: 1 },
  { id: 'agua_mineral', nombre: 'Agua mineral', cat: 'Bebida', kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 10, fibra: 0, porcion: 500, medida: 'botella', agua: 1 },
  { id: 'te_sin_azucar', nombre: 'Té o café sin azúcar', cat: 'Bebida', kcal: 2, prot: 0.1, carb: 0.3, grasa: 0, azucar: 0, sodio: 3, fibra: 0, porcion: 250, medida: 'taza', agua: 0.9 },
  { id: 'bebida_azucarada', nombre: 'Bebida gaseosa azucarada', cat: 'Bebida', kcal: 42, prot: 0, carb: 10.6, grasa: 0, azucar: 10.6, sodio: 9, fibra: 0, porcion: 350, medida: 'lata' },
  { id: 'bebida_light', nombre: 'Bebida light / zero', cat: 'Bebida', kcal: 1, prot: 0, carb: 0.2, grasa: 0, azucar: 0, sodio: 12, fibra: 0, porcion: 350, medida: 'lata', agua: 0.8 },
  { id: 'jugo_natural', nombre: 'Jugo de fruta natural', cat: 'Bebida', kcal: 45, prot: 0.5, carb: 10.5, grasa: 0.1, azucar: 9, sodio: 2, fibra: 0.2, porcion: 250, medida: 'vaso', agua: 0.85 },
  { id: 'cerveza', nombre: 'Cerveza', cat: 'Bebida', kcal: 43, prot: 0.5, carb: 3.6, grasa: 0, azucar: 0, sodio: 4, fibra: 0, porcion: 350, medida: 'lata' },

  // --- Snacks y preparaciones ---
  { id: 'papas_fritas', nombre: 'Papas fritas', cat: 'Snack', kcal: 312, prot: 3.4, carb: 41, grasa: 15, azucar: 0.3, sodio: 210, fibra: 3.8, porcion: 150, medida: 'porción' },
  { id: 'completo', nombre: 'Completo (hot dog)', cat: 'Snack', kcal: 290, prot: 10, carb: 26, grasa: 16, azucar: 4, sodio: 720, fibra: 1.5, porcion: 200, medida: 'unidad' },
  { id: 'empanada_pino', nombre: 'Empanada de pino', cat: 'Snack', kcal: 260, prot: 11, carb: 27, grasa: 12, azucar: 3, sodio: 560, fibra: 1.5, porcion: 180, medida: 'unidad' },
  { id: 'galletas_dulces', nombre: 'Galletas dulces', cat: 'Snack', kcal: 460, prot: 6, carb: 70, grasa: 17, azucar: 28, sodio: 350, fibra: 2, porcion: 40, medida: 'paquete chico' },
  { id: 'chocolate', nombre: 'Chocolate de leche', cat: 'Snack', kcal: 535, prot: 7.6, carb: 59, grasa: 30, azucar: 52, sodio: 79, fibra: 3.4, porcion: 30, medida: 'barra chica' },
  { id: 'helado', nombre: 'Helado', cat: 'Snack', kcal: 207, prot: 3.5, carb: 24, grasa: 11, azucar: 21, sodio: 80, fibra: 0.7, porcion: 100, medida: 'porción' },
  { id: 'palomitas', nombre: 'Palomitas de maíz', cat: 'Snack', kcal: 387, prot: 13, carb: 78, grasa: 4.5, azucar: 0.9, sodio: 8, fibra: 15, porcion: 30, medida: 'bol' },
  { id: 'barra_cereal', nombre: 'Barra de cereal', cat: 'Snack', kcal: 400, prot: 6, carb: 66, grasa: 12, azucar: 28, sodio: 220, fibra: 4, porcion: 25, medida: 'unidad' },
];

/* Los platos preparados viven en su propio archivo porque son otra cosa: no son
   ingredientes sino comidas completas. Se buscan y se registran igual, pero no
   entran en las sugerencias ni en los menús, donde se cocina con ingredientes. */
export { PLATOS, MAPA_PLATOS, CATEGORIAS_PLATOS } from './platos.js';

/** Todo lo registrable: ingredientes, platos preparados y productos escaneados. */
export const CATALOGO = [...ALIMENTOS, ...PLATOS];

export const MAPA_ALIMENTOS = new Map(CATALOGO.map((a) => [a.id, a]));

/* Los productos escaneados se agregan en caliente: no vienen en el archivo
   porque dependen de lo que cada persona tenga en la despensa. */
export function registrarProducto(producto) {
  if (!producto || !producto.id) return false;
  MAPA_ALIMENTOS.set(producto.id, producto);
  return true;
}

export function olvidarProducto(id) {
  return MAPA_ALIMENTOS.delete(id);
}

/**
 * Busca por texto (sin tildes, insensible a mayúsculas). Los ingredientes van
 * primero y los platos después: quien escribe "pollo" suele buscar el
 * ingrediente, no el pollo frito.
 */
export function buscarAlimentos(texto, limite = 20) {
  const q = normalizar(texto).trim();
  const todos = [...MAPA_ALIMENTOS.values()];
  if (!q) return todos.filter((a) => !a.plato).slice(0, limite);

  const coincide = (a) => normalizar(a.nombre).includes(q) ||
    normalizar(a.cat).includes(q) ||
    (a.composicion && normalizar(a.composicion).includes(q));

  const encontrados = todos.filter(coincide);
  const peso = (a) => (a.escaneado ? 0 : a.plato ? 2 : 1);
  return encontrados.sort((a, b) => peso(a) - peso(b)).slice(0, limite);
}

export function normalizar(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Escala los nutrientes de un alimento a los gramos indicados. */
export function escalar(alimento, gramos) {
  const f = gramos / 100;
  return {
    kcal: alimento.kcal * f,
    prot: alimento.prot * f,
    carb: alimento.carb * f,
    grasa: alimento.grasa * f,
    azucar: alimento.azucar * f,
    sodio: alimento.sodio * f,
    fibra: alimento.fibra * f,
    agua: (alimento.agua || 0) * gramos, // ml aportados a la hidratación
  };
}
