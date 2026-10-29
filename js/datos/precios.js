// Precios referenciales de supermercado en Chile (pesos, octubre 2026).
//
// Son una estimación para que la cuenta parta de algo razonable, no una
// cotización: cambian por ciudad, marca y oferta de la semana. Cada persona
// puede reemplazarlos por lo que paga (se guardan en estado.precios) y desde
// ese momento manda su precio.
//
// kg: precio de 1 kg (o 1 litro) tal como se compra.
// rinde: gramos del alimento como está en la base por cada gramo comprado.
//   El arroz se compra crudo y la base lo tiene cocido: 1 g crudo rinde 2,5 g
//   cocido, así que el gramo cocido sale 2,5 veces más barato. La carne con
//   hueso pierde peso al cocinarse y al descartar el hueso: rinde menos de 1.

export const PRECIOS_REFERENCIA = {
  // Proteínas
  huevo: { kg: 3700, rinde: 1, compra: 'bandeja de 30 huevos ≈ $6.100' },
  pollo_muslo: { kg: 3800, rinde: 0.55, compra: 'trutro entero, con hueso y piel' },
  pollo_pechuga: { kg: 6900, rinde: 0.75, compra: 'pechuga deshuesada cruda' },
  carne_molida: { kg: 9800, rinde: 0.75, compra: 'molida 5% grasa' },
  carne_molida_10: { kg: 7900, rinde: 0.72, compra: 'molida 10% grasa' },
  higado: { kg: 4500, rinde: 0.75, compra: 'hígado de vacuno' },
  jurel_lata: { kg: 6300, rinde: 1, compra: 'lata de 425 g ≈ $1.900 (≈300 g escurrido)' },
  atun_agua: { kg: 11000, rinde: 1, compra: 'lata de 160 g ≈ $1.300 (≈120 g escurrido)' },
  sardinas_lata: { kg: 13000, rinde: 1, compra: 'lata de 125 g ≈ $1.400' },
  merluza: { kg: 6500, rinde: 0.8, compra: 'filete congelado' },
  lentejas: { kg: 2900, rinde: 2.5, compra: 'bolsa de 1 kg cruda' },
  porotos: { kg: 3200, rinde: 2.4, compra: 'bolsa de 1 kg cruda' },
  garbanzos: { kg: 3100, rinde: 2.4, compra: 'bolsa de 1 kg cruda' },
  soya_texturizada: { kg: 4200, rinde: 1, compra: 'bolsa de 500 g ≈ $2.100' },
  tofu: { kg: 8000, rinde: 1, compra: 'bloque de 500 g' },
  proteina_suero: { kg: 26000, rinde: 1, compra: 'tarro de 1 kg' },
  quesillo: { kg: 8000, rinde: 1, compra: 'quesillo de 500 g' },

  // Carbohidratos
  avena: { kg: 2100, rinde: 1, compra: 'bolsa de 1 kg (se registra cruda)' },
  arroz_cocido: { kg: 1500, rinde: 2.5, compra: 'bolsa de 1 kg cruda' },
  arroz_integral: { kg: 2200, rinde: 2.5, compra: 'bolsa de 1 kg cruda' },
  fideos: { kg: 1800, rinde: 2.3, compra: 'paquete de 400 g ≈ $720' },
  papa_cocida: { kg: 1100, rinde: 0.9, compra: 'malla de papas' },
  papa_horno: { kg: 1100, rinde: 0.9, compra: 'malla de papas' },
  pan_marraqueta: { kg: 2200, rinde: 1, compra: 'en panadería' },
  hallulla: { kg: 2200, rinde: 1, compra: 'en panadería' },
  pan_integral: { kg: 4500, rinde: 1, compra: 'pan de molde integral' },
  harina_tostada: { kg: 2800, rinde: 1, compra: 'bolsa de 1 kg' },
  mote_trigo: { kg: 2400, rinde: 2.5, compra: 'bolsa de 1 kg crudo' },
  quinoa: { kg: 6500, rinde: 2.7, compra: 'bolsa de 500 g cruda' },
  polenta: { kg: 2000, rinde: 4.5, compra: 'sémola de maíz cruda' },
  camote: { kg: 2200, rinde: 0.9, compra: 'a granel' },

  // Verduras
  lechuga: { kg: 2300, rinde: 0.8, compra: 'una lechuga ≈ $900' },
  tomate: { kg: 1800, rinde: 1, compra: 'a granel' },
  zanahoria: { kg: 900, rinde: 0.9, compra: 'a granel' },
  cebolla: { kg: 1000, rinde: 0.9, compra: 'a granel' },
  repollo: { kg: 800, rinde: 0.85, compra: 'un repollo ≈ $1.200' },
  zapallo_italiano: { kg: 1500, rinde: 0.95, compra: 'a granel' },
  zapallo: { kg: 1200, rinde: 0.8, compra: 'trozo de zapallo' },
  betarraga: { kg: 1200, rinde: 0.85, compra: 'a granel' },
  pepino: { kg: 1500, rinde: 0.95, compra: 'a granel' },
  brocoli: { kg: 2600, rinde: 0.75, compra: 'una cabeza ≈ $1.300' },
  espinaca: { kg: 3000, rinde: 0.9, compra: 'paquete' },
  acelga: { kg: 1800, rinde: 0.8, compra: 'atado' },
  porotos_verdes: { kg: 2500, rinde: 0.95, compra: 'a granel o congelados' },
  arvejas: { kg: 2800, rinde: 1, compra: 'congeladas' },
  choclo: { kg: 2500, rinde: 1, compra: 'congelado' },
  ensalada_chilena: { kg: 1500, rinde: 0.95, compra: 'tomate y cebolla' },

  // Frutas
  platano: { kg: 1500, rinde: 0.65, compra: 'a granel (sin cáscara)' },
  manzana: { kg: 1500, rinde: 0.9, compra: 'a granel' },
  naranja: { kg: 1300, rinde: 0.7, compra: 'malla' },
  mandarina: { kg: 1800, rinde: 0.75, compra: 'malla' },
  pera: { kg: 1700, rinde: 0.9, compra: 'a granel' },
  limon: { kg: 1800, rinde: 1, compra: 'a granel' },

  // Lácteos
  leche_entera: { kg: 1150, rinde: 1, compra: 'caja de 1 L' },
  leche_semi: { kg: 1150, rinde: 1, compra: 'caja de 1 L' },
  leche_desc: { kg: 1150, rinde: 1, compra: 'caja de 1 L' },
  yogur_natural: { kg: 2600, rinde: 1, compra: 'pote de 1 kg sin azúcar' },
  queso_gauda: { kg: 11000, rinde: 1, compra: 'laminado' },

  // Grasas
  aceite_vegetal: { kg: 2500, rinde: 1, compra: 'botella de 1 L' },
  aceite_oliva: { kg: 9500, rinde: 1, compra: 'botella de 1 L' },
  mani: { kg: 6000, rinde: 1, compra: 'a granel, sin sal' },
  mantequilla_mani: { kg: 8500, rinde: 1, compra: 'frasco de 340 g' },
  palta: { kg: 4500, rinde: 0.7, compra: 'a granel (sin cuesco ni cáscara)' },
  linaza: { kg: 4000, rinde: 1, compra: 'a granel' },

  // Bebidas
  agua: { kg: 1, rinde: 1, compra: 'de la llave' },
  te_sin_azucar: { kg: 40, rinde: 1, compra: 'bolsita de té o café soluble' },
};
