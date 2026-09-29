// Micronutrientes por 100 g de alimento. Contenido del artículo func:micros.
//
// Valores referenciales de tablas de composición de alimentos de uso corriente.
// Sirven para detectar déficits gruesos y sostenidos, no para calcular una dieta
// clínica: el contenido real cambia con el cultivo, la cocción y la marca.
//
// Importante: un alimento que no aparece aquí NO aporta cero, simplemente no
// tiene dato. El panel lo declara como cobertura para no subestimar el consumo.

export const MICROS_POR_100G = {
  // --- Proteínas ---
  pollo_pechuga: { hierro: 1.0, calcio: 15, potasio: 256, vitaminaC: 0 },
  pollo_muslo: { hierro: 1.3, calcio: 12, potasio: 230, vitaminaC: 0 },
  carne_posta: { hierro: 2.6, calcio: 18, potasio: 318, vitaminaC: 0 },
  carne_molida: { hierro: 2.3, calcio: 12, potasio: 330, vitaminaC: 0 },
  cerdo_lomo: { hierro: 0.9, calcio: 18, potasio: 423, vitaminaC: 0 },
  merluza: { hierro: 0.4, calcio: 20, potasio: 350, vitaminaC: 0 },
  salmon: { hierro: 0.3, calcio: 12, potasio: 363, vitaminaC: 0 },
  atun_agua: { hierro: 1.0, calcio: 11, potasio: 237, vitaminaC: 0 },
  jurel_lata: { hierro: 1.4, calcio: 185, potasio: 300, vitaminaC: 0 },
  huevo: { hierro: 1.8, calcio: 56, potasio: 138, vitaminaC: 0 },
  clara_huevo: { hierro: 0.1, calcio: 7, potasio: 163, vitaminaC: 0 },
  lentejas: { hierro: 3.3, calcio: 19, potasio: 369, vitaminaC: 1.5 },
  garbanzos: { hierro: 2.9, calcio: 49, potasio: 291, vitaminaC: 1.3 },
  porotos: { hierro: 2.1, calcio: 50, potasio: 405, vitaminaC: 0 },
  tofu: { hierro: 2.7, calcio: 350, potasio: 121, vitaminaC: 0.1 },
  proteina_suero: { hierro: 1.5, calcio: 400, potasio: 300, vitaminaC: 0 },
  pavo_fiambre: { hierro: 0.8, calcio: 10, potasio: 300, vitaminaC: 0 },

  // --- Carbohidratos ---
  arroz_cocido: { hierro: 0.2, calcio: 10, potasio: 35, vitaminaC: 0 },
  arroz_integral: { hierro: 0.4, calcio: 10, potasio: 43, vitaminaC: 0 },
  fideos: { hierro: 0.5, calcio: 7, potasio: 44, vitaminaC: 0 },
  papa_cocida: { hierro: 0.3, calcio: 8, potasio: 379, vitaminaC: 13 },
  camote: { hierro: 0.6, calcio: 30, potasio: 337, vitaminaC: 12.8 },
  pan_marraqueta: { hierro: 3.0, calcio: 30, potasio: 120, vitaminaC: 0 },
  pan_integral: { hierro: 2.5, calcio: 60, potasio: 250, vitaminaC: 0 },
  hallulla: { hierro: 2.8, calcio: 40, potasio: 110, vitaminaC: 0 },
  avena: { hierro: 4.7, calcio: 54, potasio: 429, vitaminaC: 0 },
  quinoa: { hierro: 1.5, calcio: 17, potasio: 172, vitaminaC: 0 },
  tortilla_maiz: { hierro: 1.2, calcio: 81, potasio: 186, vitaminaC: 0 },
  choclo: { hierro: 0.5, calcio: 2, potasio: 270, vitaminaC: 6 },

  // --- Verduras ---
  brocoli: { hierro: 0.7, calcio: 47, potasio: 316, vitaminaC: 65 },
  lechuga: { hierro: 0.9, calcio: 36, potasio: 194, vitaminaC: 9 },
  tomate: { hierro: 0.3, calcio: 10, potasio: 237, vitaminaC: 14 },
  zapallo_italiano: { hierro: 0.4, calcio: 16, potasio: 261, vitaminaC: 17 },
  zanahoria: { hierro: 0.3, calcio: 33, potasio: 320, vitaminaC: 6 },
  espinaca: { hierro: 2.7, calcio: 99, potasio: 558, vitaminaC: 28 },
  porotos_verdes: { hierro: 1.0, calcio: 37, potasio: 211, vitaminaC: 12 },
  betarraga: { hierro: 0.8, calcio: 16, potasio: 305, vitaminaC: 3.6 },

  // --- Frutas ---
  manzana: { hierro: 0.1, calcio: 6, potasio: 107, vitaminaC: 4.6 },
  platano: { hierro: 0.3, calcio: 5, potasio: 358, vitaminaC: 8.7 },
  naranja: { hierro: 0.1, calcio: 40, potasio: 181, vitaminaC: 53 },
  frutilla: { hierro: 0.4, calcio: 16, potasio: 153, vitaminaC: 59 },
  arandano: { hierro: 0.3, calcio: 6, potasio: 77, vitaminaC: 9.7 },
  uva: { hierro: 0.4, calcio: 10, potasio: 191, vitaminaC: 3.2 },
  kiwi: { hierro: 0.3, calcio: 34, potasio: 312, vitaminaC: 93 },

  // --- Lácteos ---
  leche_desc: { hierro: 0.03, calcio: 122, potasio: 156, vitaminaC: 0 },
  leche_entera: { hierro: 0.03, calcio: 113, potasio: 143, vitaminaC: 0 },
  yogur_natural: { hierro: 0.05, calcio: 110, potasio: 141, vitaminaC: 0.5 },
  yogur_dulce: { hierro: 0.05, calcio: 120, potasio: 150, vitaminaC: 0.5 },
  queso_gauda: { hierro: 0.2, calcio: 700, potasio: 121, vitaminaC: 0 },
  quesillo: { hierro: 0.1, calcio: 80, potasio: 104, vitaminaC: 0 },

  // --- Grasas ---
  palta: { hierro: 0.6, calcio: 12, potasio: 485, vitaminaC: 10 },
  aceite_oliva: { hierro: 0.1, calcio: 1, potasio: 1, vitaminaC: 0 },
  almendras: { hierro: 3.7, calcio: 269, potasio: 733, vitaminaC: 0 },
  nueces: { hierro: 2.9, calcio: 98, potasio: 441, vitaminaC: 1.3 },
  mani: { hierro: 4.6, calcio: 92, potasio: 705, vitaminaC: 0 },
  mantequilla: { hierro: 0, calcio: 24, potasio: 24, vitaminaC: 0 },

  // --- Bebidas ---
  agua: { hierro: 0, calcio: 0, potasio: 0, vitaminaC: 0 },
  agua_mineral: { hierro: 0, calcio: 30, potasio: 1, vitaminaC: 0 },
  te_sin_azucar: { hierro: 0, calcio: 1, potasio: 20, vitaminaC: 0 },
  bebida_azucarada: { hierro: 0.1, calcio: 2, potasio: 2, vitaminaC: 0 },
  bebida_light: { hierro: 0, calcio: 2, potasio: 2, vitaminaC: 0 },
  jugo_natural: { hierro: 0.2, calcio: 11, potasio: 200, vitaminaC: 38 },
  cerveza: { hierro: 0, calcio: 4, potasio: 27, vitaminaC: 0 },

  // --- Snacks ---
  papas_fritas: { hierro: 0.8, calcio: 12, potasio: 600, vitaminaC: 10 },
  completo: { hierro: 1.5, calcio: 60, potasio: 200, vitaminaC: 3 },
  empanada_pino: { hierro: 1.8, calcio: 40, potasio: 200, vitaminaC: 2 },
  galletas_dulces: { hierro: 2.0, calcio: 40, potasio: 80, vitaminaC: 0 },
  chocolate: { hierro: 2.4, calcio: 189, potasio: 372, vitaminaC: 0 },
  helado: { hierro: 0.1, calcio: 128, potasio: 199, vitaminaC: 0.6 },
  palomitas: { hierro: 3.2, calcio: 7, potasio: 300, vitaminaC: 0 },
  barra_cereal: { hierro: 2.0, calcio: 60, potasio: 200, vitaminaC: 0 },
};

/** Ingestas diarias de referencia para personas adultas sanas. */
export const REFERENCIA = {
  hierro: {
    nombre: 'Hierro', unidad: 'mg',
    masculino: 8, femenino: 18,
    porQue: 'Transporta el oxígeno. Su falta se nota como cansancio que no se explica con el entrenamiento.',
    fuentes: 'Carnes rojas, legumbres, avena, espinaca. Con vitamina C en la misma comida se absorbe mucho mejor.',
  },
  calcio: {
    nombre: 'Calcio', unidad: 'mg',
    masculino: 1000, femenino: 1000,
    porQue: 'Hueso y contracción muscular. Importante si entrenas con carga.',
    fuentes: 'Lácteos, tofu, jurel en lata con espinas, almendras.',
  },
  potasio: {
    nombre: 'Potasio', unidad: 'mg',
    masculino: 3500, femenino: 3500,
    porQue: 'Equilibra el sodio y regula la presión. Casi nadie llega a la recomendación.',
    fuentes: 'Papa, plátano, legumbres, palta, espinaca.',
  },
  vitaminaC: {
    nombre: 'Vitamina C', unidad: 'mg',
    masculino: 90, femenino: 75,
    porQue: 'Colágeno y absorción del hierro vegetal. Se pierde con la cocción larga.',
    fuentes: 'Kiwi, naranja, frutilla, brócoli, tomate.',
  },
};

export const CLAVES = Object.keys(REFERENCIA);
