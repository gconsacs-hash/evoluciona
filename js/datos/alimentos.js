// Base de alimentos por 100 g (o 100 ml en líquidos).
// kcal, prot (g), carb (g), grasa (g), azucar (g), sodio (mg), fibra (g)
// Valores de tablas de composición de alimentos de uso común en Chile, redondeados.

import { PLATOS } from './platos.js';

export const CATEGORIAS = ['Proteína', 'Carbohidrato', 'Verdura', 'Fruta', 'Lácteo', 'Grasa', 'Bebida', 'Snack', 'Condimento'];

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
  { id: 'pavo_fiambre', nombre: 'Pavo laminado (fiambre)', cat: 'Proteína', kcal: 110, prot: 18, carb: 3, grasa: 2.5, azucar: 1.5, sodio: 980, fibra: 0, porcion: 40, medida: 'láminas', up: true },

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
  { id: 'yogur_dulce', nombre: 'Yogur con sabor (azucarado)', cat: 'Lácteo', kcal: 95, prot: 3.5, carb: 15, grasa: 2.2, azucar: 14, sodio: 50, fibra: 0, porcion: 170, medida: 'pote', up: true },
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
  { id: 'bebida_azucarada', nombre: 'Bebida gaseosa azucarada', cat: 'Bebida', kcal: 42, prot: 0, carb: 10.6, grasa: 0, azucar: 10.6, sodio: 9, fibra: 0, porcion: 350, medida: 'lata', up: true },
  { id: 'bebida_light', nombre: 'Bebida light / zero', cat: 'Bebida', kcal: 1, prot: 0, carb: 0.2, grasa: 0, azucar: 0, sodio: 12, fibra: 0, porcion: 350, medida: 'lata', agua: 0.8, up: true },
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

  /* ---------- Ampliación de la base (29-oct-2026) ----------
     up: true marca los ultraprocesados que no son Snack (fiambres, cereales
     azucarados, salsas): el cuadro de calidad del día los cuenta aparte. */

  // --- Proteínas: carnes, pescados y mariscos ---
  { id: 'pavo_pechuga', nombre: 'Pechuga de pavo cocida', cat: 'Proteína', kcal: 135, prot: 30, carb: 0, grasa: 1.5, azucar: 0, sodio: 60, fibra: 0, porcion: 150, medida: 'filete' },
  { id: 'pollo_asado', nombre: 'Pollo asado con piel', cat: 'Proteína', kcal: 239, prot: 27, carb: 0, grasa: 14, azucar: 0, sodio: 80, fibra: 0, porcion: 200, medida: 'cuarto de pollo' },
  { id: 'pollo_apanado', nombre: 'Milanesa de pollo apanada', cat: 'Proteína', kcal: 230, prot: 16, carb: 15, grasa: 12, azucar: 1, sodio: 450, fibra: 0.8, porcion: 120, medida: 'milanesa', up: true },
  { id: 'carne_lomo_liso', nombre: 'Lomo liso (vacuno)', cat: 'Proteína', kcal: 215, prot: 27, carb: 0, grasa: 12, azucar: 0, sodio: 55, fibra: 0, porcion: 150, medida: 'bistec' },
  { id: 'carne_olla', nombre: 'Carne de olla (asiento, tapapecho)', cat: 'Proteína', kcal: 250, prot: 26, carb: 0, grasa: 16, azucar: 0, sodio: 60, fibra: 0, porcion: 150, medida: 'presa' },
  { id: 'carne_molida_10', nombre: 'Carne molida 10% grasa', cat: 'Proteína', kcal: 176, prot: 20, carb: 0, grasa: 10, azucar: 0, sodio: 70, fibra: 0, porcion: 150, medida: 'porción' },
  { id: 'hamburguesa_vacuno', nombre: 'Hamburguesa de vacuno (envasada)', cat: 'Proteína', kcal: 250, prot: 17, carb: 3, grasa: 19, azucar: 0.5, sodio: 600, fibra: 0, porcion: 100, medida: 'unidad', up: true },
  { id: 'higado', nombre: 'Hígado de vacuno', cat: 'Proteína', kcal: 175, prot: 27, carb: 5, grasa: 5, azucar: 0, sodio: 79, fibra: 0, porcion: 120, medida: 'bistec' },
  { id: 'cerdo_chuleta', nombre: 'Chuleta de cerdo', cat: 'Proteína', kcal: 231, prot: 25, carb: 0, grasa: 14, azucar: 0, sodio: 62, fibra: 0, porcion: 150, medida: 'chuleta' },
  { id: 'longaniza', nombre: 'Longaniza', cat: 'Proteína', kcal: 320, prot: 14, carb: 2, grasa: 29, azucar: 0.5, sodio: 900, fibra: 0, porcion: 80, medida: 'unidad', up: true },
  { id: 'vienesa', nombre: 'Vienesa', cat: 'Proteína', kcal: 280, prot: 11, carb: 4, grasa: 25, azucar: 1, sodio: 950, fibra: 0, porcion: 45, medida: 'unidad', up: true },
  { id: 'jamon_cerdo', nombre: 'Jamón de cerdo', cat: 'Proteína', kcal: 120, prot: 18, carb: 2, grasa: 4.5, azucar: 1, sodio: 1050, fibra: 0, porcion: 40, medida: 'láminas', up: true },
  { id: 'reineta', nombre: 'Reineta', cat: 'Proteína', kcal: 110, prot: 20, carb: 0, grasa: 3.2, azucar: 0, sodio: 70, fibra: 0, porcion: 180, medida: 'filete' },
  { id: 'congrio', nombre: 'Congrio', cat: 'Proteína', kcal: 95, prot: 19, carb: 0, grasa: 1.8, azucar: 0, sodio: 80, fibra: 0, porcion: 180, medida: 'trozo' },
  { id: 'trucha', nombre: 'Trucha', cat: 'Proteína', kcal: 150, prot: 21, carb: 0, grasa: 7, azucar: 0, sodio: 50, fibra: 0, porcion: 150, medida: 'filete' },
  { id: 'choritos', nombre: 'Choritos (mejillones) cocidos', cat: 'Proteína', kcal: 172, prot: 24, carb: 7, grasa: 4.5, azucar: 0, sodio: 370, fibra: 0, porcion: 100, medida: 'taza sin concha' },
  { id: 'camarones', nombre: 'Camarones cocidos', cat: 'Proteína', kcal: 99, prot: 24, carb: 0.2, grasa: 0.3, azucar: 0, sodio: 110, fibra: 0, porcion: 100, medida: 'porción' },
  { id: 'sardinas_lata', nombre: 'Sardinas en aceite (escurridas)', cat: 'Proteína', kcal: 208, prot: 25, carb: 0, grasa: 11.5, azucar: 0, sodio: 307, fibra: 0, porcion: 90, medida: 'lata' },
  { id: 'atun_aceite', nombre: 'Atún en aceite (escurrido)', cat: 'Proteína', kcal: 198, prot: 29, carb: 0, grasa: 8, azucar: 0, sodio: 350, fibra: 0, porcion: 120, medida: 'lata' },
  { id: 'surimi', nombre: 'Kanikama (surimi)', cat: 'Proteína', kcal: 95, prot: 7.5, carb: 15, grasa: 0.5, azucar: 5, sodio: 700, fibra: 0, porcion: 60, medida: '4 barritas', up: true },

  // --- Proteínas vegetales y legumbres ---
  { id: 'habas', nombre: 'Habas cocidas', cat: 'Proteína', kcal: 110, prot: 7.6, carb: 19.7, grasa: 0.4, azucar: 1.8, sodio: 5, fibra: 5.4, porcion: 150, medida: 'porción' },
  { id: 'soya_texturizada', nombre: 'Soya texturizada (seca)', cat: 'Proteína', kcal: 330, prot: 50, carb: 30, grasa: 1.5, azucar: 8, sodio: 10, fibra: 17, porcion: 40, medida: 'media taza seca' },
  { id: 'tempeh', nombre: 'Tempeh', cat: 'Proteína', kcal: 193, prot: 19, carb: 9, grasa: 11, azucar: 0, sodio: 9, fibra: 5, porcion: 100, medida: 'porción' },
  { id: 'seitan', nombre: 'Seitán', cat: 'Proteína', kcal: 140, prot: 25, carb: 6, grasa: 2, azucar: 0.5, sodio: 300, fibra: 1, porcion: 120, medida: 'porción' },

  // --- Carbohidratos ---
  { id: 'pan_molde_blanco', nombre: 'Pan de molde blanco', cat: 'Carbohidrato', kcal: 265, prot: 9, carb: 49, grasa: 3.2, azucar: 5, sodio: 490, fibra: 2.7, porcion: 50, medida: '2 rebanadas', up: true },
  { id: 'pan_amasado', nombre: 'Pan amasado', cat: 'Carbohidrato', kcal: 300, prot: 8, carb: 52, grasa: 6.5, azucar: 2, sodio: 500, fibra: 2, porcion: 100, medida: 'unidad' },
  { id: 'pan_pita', nombre: 'Pan pita', cat: 'Carbohidrato', kcal: 275, prot: 9, carb: 56, grasa: 1.2, azucar: 1.3, sodio: 536, fibra: 2.2, porcion: 60, medida: 'unidad' },
  { id: 'pan_centeno', nombre: 'Pan de centeno', cat: 'Carbohidrato', kcal: 259, prot: 8.5, carb: 48, grasa: 3.3, azucar: 3.9, sodio: 600, fibra: 5.8, porcion: 60, medida: '2 rebanadas' },
  { id: 'tortilla_trigo', nombre: 'Tortilla de trigo (wrap)', cat: 'Carbohidrato', kcal: 310, prot: 8, carb: 50, grasa: 8, azucar: 3, sodio: 600, fibra: 3, porcion: 60, medida: 'unidad', up: true },
  { id: 'galletas_agua', nombre: 'Galletas de agua o soda', cat: 'Carbohidrato', kcal: 420, prot: 9, carb: 70, grasa: 11, azucar: 3, sodio: 900, fibra: 3, porcion: 30, medida: 'paquete chico', up: true },
  { id: 'fideos_integrales', nombre: 'Fideos integrales cocidos', cat: 'Carbohidrato', kcal: 149, prot: 6, carb: 30, grasa: 1.7, azucar: 0.8, sodio: 4, fibra: 4.5, porcion: 200, medida: 'plato' },
  { id: 'cuscus', nombre: 'Cuscús cocido', cat: 'Carbohidrato', kcal: 112, prot: 3.8, carb: 23, grasa: 0.2, azucar: 0.1, sodio: 5, fibra: 1.4, porcion: 200, medida: 'taza' },
  { id: 'mote_trigo', nombre: 'Mote de trigo cocido', cat: 'Carbohidrato', kcal: 125, prot: 4.5, carb: 25, grasa: 0.7, azucar: 0.3, sodio: 5, fibra: 3.5, porcion: 200, medida: 'taza' },
  { id: 'polenta', nombre: 'Polenta cocida', cat: 'Carbohidrato', kcal: 70, prot: 1.6, carb: 15, grasa: 0.3, azucar: 0.2, sodio: 2, fibra: 0.8, porcion: 200, medida: 'porción' },
  { id: 'harina_tostada', nombre: 'Harina tostada', cat: 'Carbohidrato', kcal: 380, prot: 11, carb: 75, grasa: 3, azucar: 1, sodio: 5, fibra: 9, porcion: 30, medida: '3 cucharadas' },
  { id: 'papa_horno', nombre: 'Papa al horno con cáscara', cat: 'Carbohidrato', kcal: 93, prot: 2.5, carb: 21, grasa: 0.1, azucar: 1.2, sodio: 10, fibra: 2.2, porcion: 200, medida: 'unidad' },
  { id: 'pure_papas', nombre: 'Puré de papas (con leche y mantequilla)', cat: 'Carbohidrato', kcal: 110, prot: 2, carb: 16, grasa: 4.2, azucar: 1.5, sodio: 300, fibra: 1.4, porcion: 200, medida: 'porción' },
  { id: 'cereal_maiz', nombre: 'Cereal de maíz (corn flakes)', cat: 'Carbohidrato', kcal: 375, prot: 7, carb: 84, grasa: 0.9, azucar: 9, sodio: 700, fibra: 3, porcion: 30, medida: 'taza', up: true },
  { id: 'granola', nombre: 'Granola', cat: 'Carbohidrato', kcal: 470, prot: 10, carb: 64, grasa: 19, azucar: 22, sodio: 50, fibra: 7, porcion: 40, medida: 'media taza', up: true },

  // --- Verduras ---
  { id: 'cebolla', nombre: 'Cebolla', cat: 'Verdura', kcal: 40, prot: 1.1, carb: 9.3, grasa: 0.1, azucar: 4.2, sodio: 4, fibra: 1.7, porcion: 100, medida: 'unidad chica' },
  { id: 'pimenton', nombre: 'Pimentón', cat: 'Verdura', kcal: 31, prot: 1, carb: 6, grasa: 0.3, azucar: 4.2, sodio: 4, fibra: 2.1, porcion: 120, medida: 'unidad' },
  { id: 'pepino', nombre: 'Pepino', cat: 'Verdura', kcal: 15, prot: 0.7, carb: 3.6, grasa: 0.1, azucar: 1.7, sodio: 2, fibra: 0.5, porcion: 150, medida: 'medio pepino' },
  { id: 'coliflor', nombre: 'Coliflor cocida', cat: 'Verdura', kcal: 23, prot: 1.8, carb: 4.1, grasa: 0.5, azucar: 2.1, sodio: 15, fibra: 2.3, porcion: 150, medida: 'porción' },
  { id: 'repollo', nombre: 'Repollo', cat: 'Verdura', kcal: 25, prot: 1.3, carb: 5.8, grasa: 0.1, azucar: 3.2, sodio: 18, fibra: 2.5, porcion: 100, medida: 'taza picado' },
  { id: 'champinones', nombre: 'Champiñones', cat: 'Verdura', kcal: 22, prot: 3.1, carb: 3.3, grasa: 0.3, azucar: 2, sodio: 5, fibra: 1, porcion: 100, medida: 'taza' },
  { id: 'acelga', nombre: 'Acelga cocida', cat: 'Verdura', kcal: 20, prot: 1.9, carb: 4.1, grasa: 0.1, azucar: 1.1, sodio: 179, fibra: 2.1, porcion: 150, medida: 'porción' },
  { id: 'apio', nombre: 'Apio', cat: 'Verdura', kcal: 16, prot: 0.7, carb: 3, grasa: 0.2, azucar: 1.3, sodio: 80, fibra: 1.6, porcion: 100, medida: '2 ramas' },
  { id: 'berenjena', nombre: 'Berenjena cocida', cat: 'Verdura', kcal: 35, prot: 0.8, carb: 8.7, grasa: 0.2, azucar: 3.2, sodio: 1, fibra: 2.5, porcion: 150, medida: 'porción' },
  { id: 'zapallo', nombre: 'Zapallo cocido', cat: 'Verdura', kcal: 20, prot: 0.7, carb: 4.9, grasa: 0.1, azucar: 2.1, sodio: 1, fibra: 1.1, porcion: 150, medida: 'porción' },
  { id: 'esparragos', nombre: 'Espárragos cocidos', cat: 'Verdura', kcal: 22, prot: 2.4, carb: 4.1, grasa: 0.2, azucar: 1.3, sodio: 14, fibra: 2, porcion: 100, medida: '6 unidades' },
  { id: 'alcachofa', nombre: 'Alcachofa cocida', cat: 'Verdura', kcal: 53, prot: 2.9, carb: 12, grasa: 0.3, azucar: 1, sodio: 60, fibra: 8.6, porcion: 120, medida: 'unidad' },
  { id: 'arvejas', nombre: 'Arvejas cocidas', cat: 'Verdura', kcal: 84, prot: 5.4, carb: 15.6, grasa: 0.2, azucar: 5.9, sodio: 3, fibra: 5.5, porcion: 150, medida: 'porción' },
  { id: 'rucula', nombre: 'Rúcula', cat: 'Verdura', kcal: 25, prot: 2.6, carb: 3.7, grasa: 0.7, azucar: 2, sodio: 27, fibra: 1.6, porcion: 50, medida: 'plato' },
  { id: 'palmitos', nombre: 'Palmitos en conserva', cat: 'Verdura', kcal: 28, prot: 2.5, carb: 4.6, grasa: 0.6, azucar: 0, sodio: 426, fibra: 2.4, porcion: 80, medida: '3 unidades' },
  { id: 'ensalada_chilena', nombre: 'Ensalada chilena (tomate y cebolla, sin aceite)', cat: 'Verdura', kcal: 22, prot: 0.9, carb: 5, grasa: 0.2, azucar: 3, sodio: 5, fibra: 1.3, porcion: 200, medida: 'plato' },

  // --- Frutas ---
  { id: 'pera', nombre: 'Pera', cat: 'Fruta', kcal: 57, prot: 0.4, carb: 15, grasa: 0.1, azucar: 9.8, sodio: 1, fibra: 3.1, porcion: 170, medida: 'unidad' },
  { id: 'durazno', nombre: 'Durazno', cat: 'Fruta', kcal: 39, prot: 0.9, carb: 9.5, grasa: 0.3, azucar: 8.4, sodio: 0, fibra: 1.5, porcion: 150, medida: 'unidad' },
  { id: 'damasco', nombre: 'Damasco', cat: 'Fruta', kcal: 48, prot: 1.4, carb: 11, grasa: 0.4, azucar: 9.2, sodio: 1, fibra: 2, porcion: 105, medida: '3 unidades' },
  { id: 'ciruela', nombre: 'Ciruela', cat: 'Fruta', kcal: 46, prot: 0.7, carb: 11.4, grasa: 0.3, azucar: 9.9, sodio: 0, fibra: 1.4, porcion: 130, medida: '2 unidades' },
  { id: 'cereza', nombre: 'Cerezas', cat: 'Fruta', kcal: 63, prot: 1.1, carb: 16, grasa: 0.2, azucar: 12.8, sodio: 0, fibra: 2.1, porcion: 100, medida: 'taza' },
  { id: 'sandia', nombre: 'Sandía', cat: 'Fruta', kcal: 30, prot: 0.6, carb: 7.6, grasa: 0.2, azucar: 6.2, sodio: 1, fibra: 0.4, porcion: 300, medida: 'tajada' },
  { id: 'melon', nombre: 'Melón', cat: 'Fruta', kcal: 34, prot: 0.8, carb: 8.2, grasa: 0.2, azucar: 7.9, sodio: 16, fibra: 0.9, porcion: 200, medida: 'tajada' },
  { id: 'pina', nombre: 'Piña', cat: 'Fruta', kcal: 50, prot: 0.5, carb: 13, grasa: 0.1, azucar: 9.9, sodio: 1, fibra: 1.4, porcion: 150, medida: '2 rodajas' },
  { id: 'mango', nombre: 'Mango', cat: 'Fruta', kcal: 60, prot: 0.8, carb: 15, grasa: 0.4, azucar: 13.7, sodio: 1, fibra: 1.6, porcion: 165, medida: 'taza' },
  { id: 'mandarina', nombre: 'Mandarina', cat: 'Fruta', kcal: 53, prot: 0.8, carb: 13.3, grasa: 0.3, azucar: 10.6, sodio: 2, fibra: 1.8, porcion: 80, medida: 'unidad' },
  { id: 'chirimoya', nombre: 'Chirimoya', cat: 'Fruta', kcal: 75, prot: 1.6, carb: 17.7, grasa: 0.7, azucar: 12.9, sodio: 7, fibra: 3, porcion: 150, medida: 'media unidad' },
  { id: 'frambuesa', nombre: 'Frambuesas', cat: 'Fruta', kcal: 52, prot: 1.2, carb: 12, grasa: 0.7, azucar: 4.4, sodio: 1, fibra: 6.5, porcion: 125, medida: 'taza' },
  { id: 'limon', nombre: 'Limón', cat: 'Fruta', kcal: 29, prot: 1.1, carb: 9.3, grasa: 0.3, azucar: 2.5, sodio: 2, fibra: 2.8, porcion: 60, medida: 'unidad' },
  { id: 'pasas', nombre: 'Pasas', cat: 'Fruta', kcal: 299, prot: 3.1, carb: 79, grasa: 0.5, azucar: 59, sodio: 11, fibra: 3.7, porcion: 30, medida: 'puñado' },
  { id: 'datiles', nombre: 'Dátiles', cat: 'Fruta', kcal: 282, prot: 2.5, carb: 75, grasa: 0.4, azucar: 63, sodio: 2, fibra: 8, porcion: 30, medida: '3 unidades' },
  { id: 'ciruela_seca', nombre: 'Ciruelas secas', cat: 'Fruta', kcal: 240, prot: 2.2, carb: 64, grasa: 0.4, azucar: 38, sodio: 2, fibra: 7.1, porcion: 40, medida: '5 unidades' },

  // --- Lácteos y bebidas vegetales ---
  { id: 'leche_semi', nombre: 'Leche semidescremada', cat: 'Lácteo', kcal: 46, prot: 3.3, carb: 4.8, grasa: 1.5, azucar: 4.8, sodio: 44, fibra: 0, porcion: 200, medida: 'vaso' },
  { id: 'leche_sin_lactosa', nombre: 'Leche sin lactosa semidescremada', cat: 'Lácteo', kcal: 44, prot: 3.2, carb: 4.8, grasa: 1.3, azucar: 4.8, sodio: 45, fibra: 0, porcion: 200, medida: 'vaso' },
  { id: 'leche_chocolatada', nombre: 'Leche chocolatada', cat: 'Lácteo', kcal: 80, prot: 3.1, carb: 12, grasa: 2, azucar: 11.5, sodio: 60, fibra: 0.5, porcion: 200, medida: 'cajita', up: true },
  { id: 'bebida_avena', nombre: 'Bebida vegetal de avena', cat: 'Lácteo', kcal: 45, prot: 0.6, carb: 7, grasa: 1.5, azucar: 4, sodio: 40, fibra: 0.8, porcion: 200, medida: 'vaso' },
  { id: 'bebida_almendra', nombre: 'Bebida de almendra sin azúcar', cat: 'Lácteo', kcal: 15, prot: 0.5, carb: 0.3, grasa: 1.2, azucar: 0, sodio: 70, fibra: 0.3, porcion: 200, medida: 'vaso' },
  { id: 'bebida_soya', nombre: 'Bebida de soya', cat: 'Lácteo', kcal: 40, prot: 3.3, carb: 2.5, grasa: 1.8, azucar: 2, sodio: 45, fibra: 0.4, porcion: 200, medida: 'vaso' },
  { id: 'yogur_griego', nombre: 'Yogur griego natural', cat: 'Lácteo', kcal: 97, prot: 9, carb: 4, grasa: 5, azucar: 4, sodio: 35, fibra: 0, porcion: 150, medida: 'pote' },
  { id: 'yogur_proteina', nombre: 'Yogur alto en proteína', cat: 'Lácteo', kcal: 63, prot: 10, carb: 5, grasa: 0.3, azucar: 4, sodio: 45, fibra: 0, porcion: 155, medida: 'pote' },
  { id: 'kefir', nombre: 'Kéfir natural', cat: 'Lácteo', kcal: 55, prot: 3.3, carb: 4.5, grasa: 2.5, azucar: 4.5, sodio: 40, fibra: 0, porcion: 200, medida: 'vaso' },
  { id: 'queso_cottage', nombre: 'Queso cottage', cat: 'Lácteo', kcal: 98, prot: 11, carb: 3.4, grasa: 4.3, azucar: 2.7, sodio: 364, fibra: 0, porcion: 100, medida: 'media taza' },
  { id: 'queso_fresco', nombre: 'Queso fresco', cat: 'Lácteo', kcal: 260, prot: 18, carb: 3, grasa: 20, azucar: 3, sodio: 600, fibra: 0, porcion: 40, medida: 'trozo' },
  { id: 'queso_mantecoso', nombre: 'Queso mantecoso', cat: 'Lácteo', kcal: 360, prot: 23, carb: 1, grasa: 29.5, azucar: 0.5, sodio: 650, fibra: 0, porcion: 30, medida: 'láminas' },
  { id: 'queso_parmesano', nombre: 'Queso parmesano rallado', cat: 'Lácteo', kcal: 420, prot: 36, carb: 3.2, grasa: 28, azucar: 0.8, sodio: 1500, fibra: 0, porcion: 10, medida: 'cucharada' },
  { id: 'queso_crema', nombre: 'Queso crema', cat: 'Lácteo', kcal: 340, prot: 6, carb: 4, grasa: 33, azucar: 3.2, sodio: 320, fibra: 0, porcion: 20, medida: 'cucharada' },
  { id: 'ricotta', nombre: 'Ricotta', cat: 'Lácteo', kcal: 150, prot: 11, carb: 3, grasa: 10, azucar: 0.3, sodio: 85, fibra: 0, porcion: 60, medida: '3 cucharadas' },

  // --- Grasas, frutos secos y semillas ---
  { id: 'aceite_vegetal', nombre: 'Aceite vegetal (maravilla, canola)', cat: 'Grasa', kcal: 884, prot: 0, carb: 0, grasa: 100, azucar: 0, sodio: 0, fibra: 0, porcion: 10, medida: 'cucharada' },
  { id: 'mantequilla_mani', nombre: 'Mantequilla de maní', cat: 'Grasa', kcal: 588, prot: 25, carb: 20, grasa: 50, azucar: 9, sodio: 17, fibra: 6, porcion: 16, medida: 'cucharada' },
  { id: 'castanas_caju', nombre: 'Castañas de cajú', cat: 'Grasa', kcal: 553, prot: 18, carb: 30, grasa: 44, azucar: 6, sodio: 12, fibra: 3.3, porcion: 30, medida: 'puñado' },
  { id: 'chia', nombre: 'Semillas de chía', cat: 'Grasa', kcal: 486, prot: 17, carb: 42, grasa: 31, azucar: 0, sodio: 16, fibra: 34, porcion: 15, medida: 'cucharada' },
  { id: 'linaza', nombre: 'Linaza', cat: 'Grasa', kcal: 534, prot: 18, carb: 29, grasa: 42, azucar: 1.6, sodio: 30, fibra: 27, porcion: 10, medida: 'cucharada' },
  { id: 'semillas_zapallo', nombre: 'Semillas de zapallo', cat: 'Grasa', kcal: 559, prot: 30, carb: 11, grasa: 49, azucar: 1.4, sodio: 7, fibra: 6, porcion: 30, medida: 'puñado' },
  { id: 'semillas_maravilla', nombre: 'Semillas de maravilla', cat: 'Grasa', kcal: 584, prot: 21, carb: 20, grasa: 51, azucar: 2.6, sodio: 9, fibra: 8.6, porcion: 30, medida: 'puñado' },
  { id: 'aceitunas', nombre: 'Aceitunas', cat: 'Grasa', kcal: 145, prot: 1, carb: 3.8, grasa: 15, azucar: 0.5, sodio: 1550, fibra: 3.3, porcion: 30, medida: '6 unidades' },
  { id: 'coco_rallado', nombre: 'Coco rallado', cat: 'Grasa', kcal: 660, prot: 6.9, carb: 24, grasa: 64, azucar: 7.4, sodio: 37, fibra: 16, porcion: 15, medida: 'cucharada' },
  { id: 'crema_leche', nombre: 'Crema de leche', cat: 'Grasa', kcal: 340, prot: 2, carb: 3, grasa: 35.5, azucar: 3, sodio: 35, fibra: 0, porcion: 15, medida: 'cucharada' },
  { id: 'mayonesa', nombre: 'Mayonesa', cat: 'Grasa', kcal: 680, prot: 1, carb: 0.6, grasa: 75, azucar: 0.6, sodio: 635, fibra: 0, porcion: 15, medida: 'cucharada', up: true },
  { id: 'mayonesa_light', nombre: 'Mayonesa light', cat: 'Grasa', kcal: 330, prot: 0.8, carb: 7, grasa: 33, azucar: 4, sodio: 700, fibra: 0, porcion: 15, medida: 'cucharada', up: true },

  // --- Bebidas ---
  { id: 'cafe_leche', nombre: 'Café con leche sin azúcar', cat: 'Bebida', kcal: 25, prot: 1.7, carb: 2.5, grasa: 0.8, azucar: 2.5, sodio: 25, fibra: 0, porcion: 250, medida: 'taza', agua: 0.9 },
  { id: 'te_con_azucar', nombre: 'Té o café con 2 cucharaditas de azúcar', cat: 'Bebida', kcal: 16, prot: 0, carb: 4, grasa: 0, azucar: 4, sodio: 3, fibra: 0, porcion: 250, medida: 'taza', agua: 0.9 },
  { id: 'jugo_caja', nombre: 'Néctar o jugo en caja', cat: 'Bebida', kcal: 50, prot: 0.2, carb: 12.3, grasa: 0, azucar: 11.5, sodio: 10, fibra: 0.2, porcion: 200, medida: 'cajita', up: true },
  { id: 'isotonica', nombre: 'Bebida isotónica', cat: 'Bebida', kcal: 25, prot: 0, carb: 6, grasa: 0, azucar: 6, sodio: 45, fibra: 0, porcion: 500, medida: 'botella', agua: 0.9, up: true },
  { id: 'energetica', nombre: 'Bebida energética', cat: 'Bebida', kcal: 45, prot: 0, carb: 11, grasa: 0, azucar: 11, sodio: 80, fibra: 0, porcion: 250, medida: 'lata', up: true },
  { id: 'mote_huesillo', nombre: 'Mote con huesillo', cat: 'Bebida', kcal: 95, prot: 1, carb: 23, grasa: 0.2, azucar: 17, sodio: 5, fibra: 1.5, porcion: 350, medida: 'vaso' },
  { id: 'cerveza_sin_alcohol', nombre: 'Cerveza sin alcohol', cat: 'Bebida', kcal: 22, prot: 0.3, carb: 5, grasa: 0, azucar: 2.5, sodio: 5, fibra: 0, porcion: 350, medida: 'lata' },
  { id: 'piscola', nombre: 'Piscola', cat: 'Bebida', kcal: 78, prot: 0, carb: 8, grasa: 0, azucar: 8, sodio: 7, fibra: 0, porcion: 250, medida: 'vaso', alcohol: true },

  // --- Snacks y postres ---
  { id: 'papas_fritas_bolsa', nombre: 'Papas fritas de bolsa', cat: 'Snack', kcal: 536, prot: 6.6, carb: 53, grasa: 34, azucar: 0.5, sodio: 525, fibra: 4.4, porcion: 40, medida: 'bolsa chica' },
  { id: 'ramitas', nombre: 'Ramitas saladas', cat: 'Snack', kcal: 490, prot: 7, carb: 63, grasa: 23, azucar: 2, sodio: 1100, fibra: 3, porcion: 30, medida: 'bolsa chica' },
  { id: 'mani_salado', nombre: 'Maní salado', cat: 'Snack', kcal: 600, prot: 25, carb: 15, grasa: 51, azucar: 4, sodio: 450, fibra: 8, porcion: 30, medida: 'puñado' },
  { id: 'chocolate_amargo', nombre: 'Chocolate 70% cacao', cat: 'Snack', kcal: 600, prot: 7.8, carb: 46, grasa: 43, azucar: 24, sodio: 20, fibra: 11, porcion: 20, medida: '2 cuadritos' },
  { id: 'alfajor', nombre: 'Alfajor', cat: 'Snack', kcal: 440, prot: 5.5, carb: 62, grasa: 19, azucar: 38, sodio: 150, fibra: 2, porcion: 50, medida: 'unidad' },
  { id: 'gomitas', nombre: 'Gomitas', cat: 'Snack', kcal: 330, prot: 6, carb: 77, grasa: 0, azucar: 50, sodio: 40, fibra: 0, porcion: 30, medida: 'bolsa chica' },
  { id: 'galletas_avena', nombre: 'Galletas de avena', cat: 'Snack', kcal: 450, prot: 7, carb: 64, grasa: 18, azucar: 24, sodio: 300, fibra: 4, porcion: 30, medida: '3 unidades' },
  { id: 'barra_proteina', nombre: 'Barra de proteína', cat: 'Snack', kcal: 360, prot: 30, carb: 35, grasa: 11, azucar: 5, sodio: 200, fibra: 8, porcion: 50, medida: 'unidad' },
  { id: 'kuchen', nombre: 'Kuchen de fruta', cat: 'Snack', kcal: 260, prot: 4, carb: 38, grasa: 10, azucar: 22, sodio: 180, fibra: 1.5, porcion: 100, medida: 'trozo' },
  { id: 'berlin', nombre: 'Berlín', cat: 'Snack', kcal: 350, prot: 6, carb: 45, grasa: 16, azucar: 20, sodio: 250, fibra: 1.5, porcion: 80, medida: 'unidad' },
  { id: 'queque', nombre: 'Queque', cat: 'Snack', kcal: 380, prot: 6, carb: 52, grasa: 16.5, azucar: 30, sodio: 300, fibra: 1, porcion: 60, medida: 'trozo' },
  { id: 'torta', nombre: 'Torta (crema, manjar o panqueque)', cat: 'Snack', kcal: 370, prot: 5, carb: 45, grasa: 19, azucar: 32, sodio: 150, fibra: 1, porcion: 100, medida: 'trozo' },
  { id: 'arroz_con_leche', nombre: 'Arroz con leche', cat: 'Snack', kcal: 130, prot: 3.5, carb: 22, grasa: 3, azucar: 13, sodio: 50, fibra: 0.2, porcion: 150, medida: 'pote' },
  { id: 'leche_asada', nombre: 'Leche asada o flan', cat: 'Snack', kcal: 130, prot: 5, carb: 19, grasa: 4, azucar: 18, sodio: 65, fibra: 0, porcion: 120, medida: 'porción' },
  { id: 'jalea', nombre: 'Jalea con azúcar', cat: 'Snack', kcal: 62, prot: 1.2, carb: 14, grasa: 0, azucar: 14, sodio: 45, fibra: 0, porcion: 120, medida: 'pote' },
  { id: 'jalea_light', nombre: 'Jalea light', cat: 'Snack', kcal: 8, prot: 1.5, carb: 0.5, grasa: 0, azucar: 0, sodio: 50, fibra: 0, porcion: 120, medida: 'pote' },

  // --- Condimentos, salsas y endulzantes ---
  { id: 'azucar', nombre: 'Azúcar', cat: 'Condimento', kcal: 400, prot: 0, carb: 100, grasa: 0, azucar: 100, sodio: 0, fibra: 0, porcion: 5, medida: 'cucharadita' },
  { id: 'miel', nombre: 'Miel', cat: 'Condimento', kcal: 304, prot: 0.3, carb: 82, grasa: 0, azucar: 82, sodio: 4, fibra: 0.2, porcion: 15, medida: 'cucharada' },
  { id: 'mermelada', nombre: 'Mermelada', cat: 'Condimento', kcal: 250, prot: 0.4, carb: 62, grasa: 0.1, azucar: 48, sodio: 30, fibra: 1, porcion: 20, medida: 'cucharada' },
  { id: 'manjar', nombre: 'Manjar', cat: 'Condimento', kcal: 315, prot: 6.8, carb: 55, grasa: 7.5, azucar: 50, sodio: 130, fibra: 0, porcion: 20, medida: 'cucharada', up: true },
  { id: 'ketchup', nombre: 'Ketchup', cat: 'Condimento', kcal: 112, prot: 1.7, carb: 26, grasa: 0.1, azucar: 22, sodio: 900, fibra: 0.3, porcion: 15, medida: 'cucharada', up: true },
  { id: 'mostaza', nombre: 'Mostaza', cat: 'Condimento', kcal: 66, prot: 4, carb: 5.8, grasa: 3.3, azucar: 0.9, sodio: 1100, fibra: 3.3, porcion: 10, medida: 'cucharadita' },
  { id: 'pebre', nombre: 'Pebre', cat: 'Condimento', kcal: 60, prot: 1, carb: 5, grasa: 4, azucar: 2.5, sodio: 400, fibra: 1.5, porcion: 30, medida: '2 cucharadas' },
  { id: 'salsa_tomate', nombre: 'Salsa de tomate (pomarola)', cat: 'Condimento', kcal: 45, prot: 1.5, carb: 8, grasa: 0.8, azucar: 5, sodio: 450, fibra: 1.5, porcion: 60, medida: 'cuarto de taza' },
  { id: 'salsa_soya', nombre: 'Salsa de soya', cat: 'Condimento', kcal: 53, prot: 8, carb: 4.9, grasa: 0.6, azucar: 0.4, sodio: 5600, fibra: 0.8, porcion: 15, medida: 'cucharada', up: true },
  { id: 'caldo_cubo', nombre: 'Caldo en cubo', cat: 'Condimento', kcal: 230, prot: 8, carb: 25, grasa: 11, azucar: 3, sodio: 22000, fibra: 0, porcion: 10, medida: 'cubo', up: true },
  { id: 'sal', nombre: 'Sal de mesa', cat: 'Condimento', kcal: 0, prot: 0, carb: 0, grasa: 0, azucar: 0, sodio: 38758, fibra: 0, porcion: 1, medida: 'pizca (1 g)' },
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
export function buscarAlimentos(texto, limite = 20, categoria = '') {
  const q = normalizar(texto).trim();
  const todos = [...MAPA_ALIMENTOS.values()].filter((a) => !categoria || a.cat === categoria);
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
