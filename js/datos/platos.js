// Platos preparados: lo que se come de verdad cuando no se cocina en casa.
// Valores por 100 g, con la porción típica con que se sirve en Chile.
//
// Son promedios de preparación casera o de restaurante corriente: cambian con
// la receta, el corte y la mano del cocinero. Sirven para tener una cifra
// razonable en vez de no registrar nada, que es el error que de verdad arruina
// el seguimiento.

export const PLATOS = [
  // --- Sushi ---
  {
    id: 'roll_california', nombre: 'Roll california', cat: 'Sushi', plato: true,
    kcal: 190, prot: 7, carb: 28, grasa: 5.5, azucar: 4, sodio: 400, fibra: 1.2,
    porcion: 250, medida: 'roll de 10 piezas',
    composicion: 'Arroz, kanikama, palta, queso crema, sésamo.',
    consejo: 'El arroz es casi todo el hidrato. Si pides un roll sin queso crema bajas unas 80 kcal.',
  },
  {
    id: 'roll_panko', nombre: 'Roll frito en panko', cat: 'Sushi', plato: true,
    kcal: 250, prot: 7.5, carb: 30, grasa: 11.1, azucar: 5, sodio: 480, fibra: 1.3,
    porcion: 250, medida: 'roll de 10 piezas',
    composicion: 'Igual que el california pero apanado y frito, con salsa dulce encima.',
    consejo: 'Un roll frito suma unas 150 kcal sobre el mismo roll sin freír.',
  },
  {
    id: 'sashimi_salmon', nombre: 'Sashimi de salmón', cat: 'Sushi', plato: true,
    kcal: 150, prot: 20, carb: 0, grasa: 7.8, azucar: 0, sodio: 60, fibra: 0,
    porcion: 120, medida: '8 cortes',
    composicion: 'Salmón crudo, sin arroz.',
    consejo: 'La opción de sushi con más proteína y menos hidratos.',
  },

  // --- Parrilla ---
  {
    id: 'asado_tira', nombre: 'Asado de tira', cat: 'Parrilla', plato: true,
    kcal: 290, prot: 24, carb: 0, grasa: 21, azucar: 0, sodio: 75, fibra: 0,
    porcion: 250, medida: 'porción de parrilla',
    composicion: 'Costilla de vacuno a la parrilla.',
    consejo: 'Buena proteína, pero la grasa del corte pesa: 250 g son unas 725 kcal antes del pan.',
  },
  {
    id: 'entrana', nombre: 'Entraña a la parrilla', cat: 'Parrilla', plato: true,
    kcal: 235, prot: 27, carb: 0, grasa: 14, azucar: 0, sodio: 80, fibra: 0,
    porcion: 220, medida: 'porción',
    composicion: 'Entraña de vacuno.',
    consejo: 'Corte más magro que el asado de tira con casi la misma proteína.',
  },
  {
    id: 'chorizo_parrilla', nombre: 'Chorizo a la parrilla', cat: 'Parrilla', plato: true,
    kcal: 330, prot: 15, carb: 2, grasa: 29, azucar: 1, sodio: 900, fibra: 0,
    porcion: 100, medida: 'unidad',
    composicion: 'Chorizo de cerdo.',
    consejo: 'Un chorizo aporta casi la mitad del sodio de todo el día.',
  },
  {
    id: 'choripan', nombre: 'Choripán', cat: 'Parrilla', plato: true,
    kcal: 290, prot: 12, carb: 25, grasa: 15.8, azucar: 2, sodio: 780, fibra: 1.5,
    porcion: 180, medida: 'unidad',
    composicion: 'Chorizo en pan, con pebre.',
    consejo: 'El pebre no suma casi nada; la mayonesa sí, unas 90 kcal por cucharada.',
  },
  {
    id: 'costillar_cerdo', nombre: 'Costillar de cerdo', cat: 'Parrilla', plato: true,
    kcal: 320, prot: 20, carb: 1, grasa: 26.2, azucar: 1, sodio: 320, fibra: 0,
    porcion: 250, medida: 'porción',
    composicion: 'Costillar al horno o a la parrilla.',
    consejo: 'Si va con salsa barbacoa, suma unos 60 g de azúcar por porción grande.',
  },

  // --- Pizza y comida rápida ---
  {
    id: 'pizza_muzzarella', nombre: 'Pizza de muzzarella', cat: 'Rápida', plato: true,
    kcal: 265, prot: 11, carb: 30, grasa: 10, azucar: 3.5, sodio: 600, fibra: 2,
    porcion: 125, medida: 'trozo grande',
    composicion: 'Masa, salsa de tomate y queso.',
    consejo: 'Una pizza familiar son 8 trozos: 1.000 kcal en media pizza.',
  },
  {
    id: 'pizza_pepperoni', nombre: 'Pizza de pepperoni', cat: 'Rápida', plato: true,
    kcal: 300, prot: 12, carb: 29, grasa: 14.2, azucar: 3.5, sodio: 780, fibra: 2,
    porcion: 125, medida: 'trozo grande',
    composicion: 'Masa, salsa, queso y pepperoni.',
    consejo: 'El pepperoni suma unas 45 kcal y bastante sodio por trozo.',
  },
  {
    id: 'hamburguesa_doble', nombre: 'Hamburguesa doble con queso', cat: 'Rápida', plato: true,
    kcal: 260, prot: 15, carb: 18, grasa: 14.2, azucar: 4, sodio: 620, fibra: 1.2,
    porcion: 250, medida: 'unidad',
    composicion: 'Dos medallones, queso, pan y salsas.',
    consejo: 'Con papas medianas y bebida, el combo llega cerca de 1.200 kcal.',
  },
  {
    id: 'pollo_frito', nombre: 'Pollo frito', cat: 'Rápida', plato: true,
    kcal: 280, prot: 22, carb: 9, grasa: 17.3, azucar: 0, sodio: 700, fibra: 0.5,
    porcion: 200, medida: '2 presas',
    composicion: 'Presas apanadas y fritas.',
    consejo: 'Sacar la piel apanada baja cerca de un tercio de las calorías.',
  },
  {
    id: 'nuggets', nombre: 'Nuggets de pollo', cat: 'Rápida', plato: true,
    kcal: 300, prot: 15, carb: 18, grasa: 18.6, azucar: 0.5, sodio: 560, fibra: 1,
    porcion: 120, medida: '6 unidades',
    composicion: 'Pollo procesado apanado.',
    consejo: 'Las salsas para mojar suman entre 50 y 120 kcal cada una.',
  },

  // --- Chilena ---
  {
    id: 'completo_italiano', nombre: 'Completo italiano', cat: 'Chilena', plato: true,
    kcal: 250, prot: 8, carb: 22, grasa: 14.4, azucar: 3, sodio: 700, fibra: 1.8,
    porcion: 230, medida: 'unidad',
    composicion: 'Vienesa, tomate, palta y mayonesa.',
    consejo: 'La mayonesa es la mitad de la grasa. Sin ella queda en unas 380 kcal.',
  },
  {
    id: 'churrasco_italiano', nombre: 'Churrasco italiano', cat: 'Chilena', plato: true,
    kcal: 260, prot: 12, carb: 21, grasa: 14.2, azucar: 2.5, sodio: 650, fibra: 2,
    porcion: 280, medida: 'unidad',
    composicion: 'Carne, tomate, palta y mayonesa en pan frica.',
    consejo: 'Cambiar la mayonesa por más tomate deja el sándwich en unas 500 kcal.',
  },
  {
    id: 'barros_luco', nombre: 'Barros Luco', cat: 'Chilena', plato: true,
    kcal: 270, prot: 15, carb: 22, grasa: 13.6, azucar: 2, sodio: 720, fibra: 1.5,
    porcion: 260, medida: 'unidad',
    composicion: 'Carne y queso caliente en pan.',
    consejo: 'Más proteína que el italiano, pero el queso sube la grasa saturada.',
  },
  {
    id: 'chorrillana', nombre: 'Chorrillana', cat: 'Chilena', plato: true,
    kcal: 215, prot: 10, carb: 18, grasa: 11.5, azucar: 1, sodio: 480, fibra: 2,
    porcion: 500, medida: 'porción para compartir',
    composicion: 'Papas fritas, carne, cebolla y huevo.',
    consejo: 'La porción de restaurante es para dos o tres personas: son 1.075 kcal completa.',
  },
  {
    id: 'lomo_pobre', nombre: 'Lomo a lo pobre', cat: 'Chilena', plato: true,
    kcal: 230, prot: 13, carb: 15, grasa: 13, azucar: 1.5, sodio: 420, fibra: 1.8,
    porcion: 450, medida: 'plato',
    composicion: 'Carne, papas fritas, cebolla y dos huevos fritos.',
    consejo: 'Con arroz en vez de papas fritas el plato baja unas 250 kcal.',
  },
  {
    id: 'cazuela_vacuno', nombre: 'Cazuela de vacuno', cat: 'Chilena', plato: true,
    kcal: 75, prot: 6, carb: 8, grasa: 2, azucar: 1.5, sodio: 300, fibra: 1.5,
    porcion: 500, medida: 'plato hondo',
    composicion: 'Caldo, carne, papa, zapallo, choclo y arroz.',
    consejo: 'De los platos chilenos, el más completo y el de menor densidad calórica.',
  },
  {
    id: 'pastel_choclo', nombre: 'Pastel de choclo', cat: 'Chilena', plato: true,
    kcal: 150, prot: 7, carb: 18, grasa: 5.5, azucar: 6, sodio: 380, fibra: 2,
    porcion: 350, medida: 'porción',
    composicion: 'Pino de carne y pollo con pasta de choclo y azúcar encima.',
    consejo: 'El azúcar espolvoreada suma; se puede pedir sin ella.',
  },
  {
    id: 'porotos_granados', nombre: 'Porotos granados', cat: 'Chilena', plato: true,
    kcal: 110, prot: 5, carb: 17, grasa: 2.5, azucar: 2.5, sodio: 260, fibra: 5,
    porcion: 400, medida: 'plato',
    composicion: 'Porotos, zapallo, choclo y albahaca.',
    consejo: 'Mucha fibra y saciedad por poca caloría: buen plato en déficit.',
  },
  {
    id: 'pescado_frito_papas', nombre: 'Pescado frito con papas', cat: 'Chilena', plato: true,
    kcal: 230, prot: 14, carb: 18, grasa: 11.4, azucar: 0.5, sodio: 420, fibra: 2,
    porcion: 350, medida: 'plato',
    composicion: 'Merluza apanada frita con papas fritas.',
    consejo: 'El mismo pescado al horno con ensalada queda en menos de la mitad de calorías.',
  },
  {
    id: 'sopaipilla', nombre: 'Sopaipillas', cat: 'Chilena', plato: true,
    kcal: 320, prot: 5, carb: 42, grasa: 14.7, azucar: 1, sodio: 380, fibra: 1.8,
    porcion: 60, medida: '2 unidades',
    composicion: 'Masa de zapallo frita.',
    consejo: 'Con chancaca, cada una suma unos 12 g de azúcar.',
  },
  {
    id: 'humita', nombre: 'Humita', cat: 'Chilena', plato: true,
    kcal: 160, prot: 4, carb: 20, grasa: 7.1, azucar: 5, sodio: 300, fibra: 2.5,
    porcion: 200, medida: 'unidad',
    composicion: 'Pasta de choclo con albahaca, cocida en hoja.',
    consejo: 'Cuenta como hidrato, no como verdura.',
  },

  // --- Internacional corriente ---
  {
    id: 'tallarines_bolonesa', nombre: 'Tallarines con salsa boloñesa', cat: 'Internacional', plato: true,
    kcal: 130, prot: 6, carb: 17, grasa: 4.2, azucar: 3, sodio: 320, fibra: 1.8,
    porcion: 400, medida: 'plato',
    composicion: 'Pasta con salsa de tomate y carne molida.',
    consejo: 'El queso rallado encima suma unas 100 kcal por puñado.',
  },
  {
    id: 'lasana', nombre: 'Lasaña', cat: 'Internacional', plato: true,
    kcal: 165, prot: 9, carb: 14, grasa: 8.2, azucar: 3.5, sodio: 450, fibra: 1.5,
    porcion: 350, medida: 'porción',
    composicion: 'Pasta, carne, bechamel y queso.',
    consejo: 'La bechamel y el queso son la mayor parte de la grasa.',
  },
  {
    id: 'arroz_chaufan', nombre: 'Arroz chaufán', cat: 'Internacional', plato: true,
    kcal: 165, prot: 8, carb: 21, grasa: 5.4, azucar: 2, sodio: 700, fibra: 1.2,
    porcion: 400, medida: 'plato',
    composicion: 'Arroz salteado con pollo, huevo, verduras y salsa de soya.',
    consejo: 'La salsa de soya dispara el sodio: pídela aparte.',
  },
  {
    id: 'poke_bowl', nombre: 'Poke bowl', cat: 'Internacional', plato: true,
    kcal: 130, prot: 8, carb: 17, grasa: 3.4, azucar: 4, sodio: 400, fibra: 2.5,
    porcion: 400, medida: 'bowl',
    composicion: 'Arroz, pescado crudo, verduras y aderezo.',
    consejo: 'Los aderezos dulces y la mayonesa picante pueden duplicar la grasa del bowl.',
  },
  {
    id: 'ensalada_cesar_pollo', nombre: 'Ensalada césar con pollo', cat: 'Internacional', plato: true,
    kcal: 145, prot: 9, carb: 6, grasa: 9.4, azucar: 1.5, sodio: 420, fibra: 1.5,
    porcion: 350, medida: 'plato',
    composicion: 'Lechuga, pollo, crutones, parmesano y aderezo césar.',
    consejo: 'Parece liviana, pero el aderezo aporta más grasa que el pollo. Pídelo aparte.',
  },
  {
    id: 'wrap_pollo', nombre: 'Wrap de pollo', cat: 'Internacional', plato: true,
    kcal: 210, prot: 13, carb: 20, grasa: 8.6, azucar: 2.5, sodio: 480, fibra: 2,
    porcion: 250, medida: 'unidad',
    composicion: 'Tortilla, pollo, verduras y salsa.',
    consejo: 'De las opciones rápidas, la de mejor relación proteína/calorías.',
  },
  {
    id: 'sandwich_ave_palta', nombre: 'Sándwich de ave palta', cat: 'Chilena', plato: true,
    kcal: 250, prot: 11, carb: 22, grasa: 13.1, azucar: 2, sodio: 520, fibra: 2,
    porcion: 220, medida: 'unidad',
    composicion: 'Pollo desmenuzado con mayonesa y palta en pan.',
    consejo: 'El "ave palta" lleva mayonesa aunque no se vea: son unas 120 kcal extra.',
  },
  {
    id: 'sopa_verduras', nombre: 'Sopa de verduras', cat: 'Internacional', plato: true,
    kcal: 40, prot: 1.5, carb: 6, grasa: 1.1, azucar: 2.5, sodio: 380, fibra: 1.8,
    porcion: 350, medida: 'plato hondo',
    composicion: 'Caldo con verduras.',
    consejo: 'Buen primer plato: llena con muy pocas calorías.',
  },

  // --- Alcohol ---
  {
    id: 'pisco_sour', nombre: 'Pisco sour', cat: 'Alcohol', plato: true, alcohol: true,
    kcal: 160, prot: 0.3, carb: 20, grasa: 0, azucar: 19, sodio: 5, fibra: 0,
    porcion: 200, medida: 'copa',
    composicion: 'Pisco, limón y azúcar.',
    consejo: 'El alcohol aporta 7 kcal por gramo y no se registra en los macros: por eso las calorías no cuadran con proteína, carbohidratos y grasa.',
  },
  {
    id: 'vino_copa', nombre: 'Vino tinto', cat: 'Alcohol', plato: true, alcohol: true,
    kcal: 85, prot: 0.1, carb: 2.6, grasa: 0, azucar: 0.6, sodio: 4, fibra: 0,
    porcion: 150, medida: 'copa',
    composicion: 'Vino tinto seco.',
    consejo: 'Una copa son unas 128 kcal que no sacian nada.',
  },
  {
    id: 'schop', nombre: 'Schop de cerveza', cat: 'Alcohol', plato: true, alcohol: true,
    kcal: 43, prot: 0.5, carb: 3.6, grasa: 0, azucar: 0, sodio: 4, fibra: 0,
    porcion: 500, medida: 'schop',
    composicion: 'Cerveza de barril.',
    consejo: 'Un schop de medio litro son unas 215 kcal.',
  },
];

export const MAPA_PLATOS = new Map(PLATOS.map((p) => [p.id, p]));

export const CATEGORIAS_PLATOS = [...new Set(PLATOS.map((p) => p.cat))];
