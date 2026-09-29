// Catálogo de la tienda.
// VÍA GRATUITA: se paga con tokens EVO ganados cumpliendo metas.
// VÍA PAGADA: paquetes que entregan tokens y contenido de golpe (maqueta de precios, sin pasarela).

export const CATEGORIAS_TIENDA = [
  { id: 'entreno', nombre: 'Entrenamiento', icono: '🏋️' },
  { id: 'nutricion', nombre: 'Nutrición', icono: '🥗' },
  { id: 'avatar', nombre: 'Avatar', icono: '🧍' },
  { id: 'herramienta', nombre: 'Herramientas', icono: '🧰' },
  { id: 'tema', nombre: 'Apariencia', icono: '🎨' },
];

/**
 * efecto: identificador que la app lee para habilitar algo real.
 *   tier:N          → desbloquea el nivel N de entrenamiento antes de lo que toca
 *   plan:<id>       → plan de comidas
 *   atuendo:<id>    → ropa del avatar
 *   aura:<id>       → efecto visual
 *   skin:<id>       → físico alternativo
 *   tema:<id>       → paleta de la app
 *   func:<id>       → función extra de la app
 */
export const ARTICULOS = [
  // --- Entrenamiento ---
  { id: 'tier3_early', nombre: 'Acceso anticipado: Fuerza', cat: 'entreno', costo: 250, efecto: 'tier:3', desc: 'Abre el bloque de Fuerza (series de 5-8 reps, peso muerto, sentadilla con barra) sin esperar el nivel 7.', requiereNivel: 4 },
  { id: 'tier4_early', nombre: 'Acceso anticipado: Hipertrofia avanzada', cat: 'entreno', costo: 600, efecto: 'tier:4', desc: 'Volumen alto, series de 4-5 y técnicas de intensidad. Normalmente llega en el nivel 12.', requiereNivel: 8 },
  { id: 'tier5_early', nombre: 'Acceso anticipado: Élite', cat: 'entreno', costo: 1200, efecto: 'tier:5', desc: 'Pistol squat, dominada arquera, flexión a una mano y cargas máximas. Normalmente llega en el nivel 18.', requiereNivel: 14 },
  { id: 'func_deload', nombre: 'Planificador de descarga', cat: 'entreno', costo: 180, efecto: 'func:deload', desc: 'Detecta cuándo llevas 4 semanas subiendo carga y programa una semana de descarga automática para que no te estanques.' },
  { id: 'func_calentamiento', nombre: 'Calculadora de series de aproximación', cat: 'entreno', costo: 120, efecto: 'func:calentamiento', desc: 'Calcula las series de calentamiento exactas (40%, 60%, 80%) para tu carga objetivo del día.' },
  { id: 'func_cronometro', nombre: 'Cronómetro de descanso inteligente', cat: 'entreno', costo: 90, efecto: 'func:cronometro', desc: 'Temporizador por serie que ajusta el descanso según el tipo de ejercicio y el esfuerzo que reportes.' },

  // --- Nutrición ---
  { id: 'plan_deficit', nombre: 'Plan de comidas: déficit sabroso', cat: 'nutricion', costo: 200, efecto: 'plan:deficit', desc: '7 días de menú chileno de alta saciedad con las calorías de tu perfil, lista de compras incluida.' },
  { id: 'plan_volumen', nombre: 'Plan de comidas: ganancia limpia', cat: 'nutricion', costo: 200, efecto: 'plan:volumen', desc: '7 días de menú con superávit controlado y proteína alta para ganar músculo sin grasa de más.' },
  { id: 'plan_economico', nombre: 'Plan de comidas: proteína barata', cat: 'nutricion', costo: 150, efecto: 'plan:economico', desc: 'Menú de 7 días priorizando huevo, legumbres, jurel y pollo: proteína al menor costo por gramo.' },
  { id: 'func_recetas', nombre: 'Recetario de alta proteína', cat: 'nutricion', costo: 160, efecto: 'func:recetas', desc: '20 recetas con más de 30 g de proteína por porción y menos de 500 kcal.' },
  { id: 'func_micros', nombre: 'Panel de micronutrientes', cat: 'nutricion', costo: 220, efecto: 'func:micros', desc: 'Suma hierro, calcio, potasio y vitamina C además de los macros, y avisa de déficits.' },

  // --- Avatar ---
  { id: 'atuendo_deportivo', nombre: 'Atuendo deportivo', cat: 'avatar', costo: 60, efecto: 'atuendo:deportivo', desc: 'Buzo y polera técnica para tu avatar.' },
  { id: 'atuendo_gimnasio', nombre: 'Atuendo de gimnasio', cat: 'avatar', costo: 120, efecto: 'atuendo:gimnasio', desc: 'Musculosa, cinturón de levantamiento y muñequeras.' },
  { id: 'atuendo_guerrero', nombre: 'Armadura del guerrero', cat: 'avatar', costo: 400, efecto: 'atuendo:guerrero', desc: 'Armadura ligera. Solo para quien ya levantó su propio peso.', requiereNivel: 10 },
  { id: 'atuendo_titan', nombre: 'Manto del Titán', cat: 'avatar', costo: 900, efecto: 'atuendo:titan', desc: 'El atuendo más buscado. Manto, hombreras y grabados dorados.', requiereNivel: 18 },
  { id: 'aura_fuego', nombre: 'Aura de fuego', cat: 'avatar', costo: 300, efecto: 'aura:fuego', desc: 'Aura ardiente alrededor del avatar. Se intensifica con tu racha.' },
  { id: 'aura_hielo', nombre: 'Aura glacial', cat: 'avatar', costo: 300, efecto: 'aura:hielo', desc: 'Partículas de hielo. Para quien entrena con la cabeza fría.' },
  { id: 'aura_dorada', nombre: 'Aura dorada', cat: 'avatar', costo: 750, efecto: 'aura:dorada', desc: 'Resplandor dorado reservado a los niveles altos.', requiereNivel: 15 },
  { id: 'mascota_lobo', nombre: 'Compañero: lobo', cat: 'avatar', costo: 500, efecto: 'mascota:lobo', desc: 'Un lobo acompaña a tu avatar y aúlla cuando cumples un día perfecto.' },
  { id: 'mascota_dragon', nombre: 'Compañero: dragón', cat: 'avatar', costo: 1500, efecto: 'mascota:dragon', desc: 'Dragón que crece con tu tonelaje acumulado.', requiereNivel: 20 },

  // --- Herramientas ---
  { id: 'func_estadisticas', nombre: 'Analítica avanzada', cat: 'herramienta', costo: 260, efecto: 'func:estadisticas', desc: 'Gráficos de tendencia de 1RM por ejercicio, correlación entre calorías y rendimiento, y proyección de peso corporal.' },
  { id: 'func_exportar', nombre: 'Exportar e importar datos', cat: 'herramienta', costo: 80, efecto: 'func:exportar', desc: 'Respaldo completo en archivo, para cambiar de teléfono sin perder tu progreso.' },
  { id: 'func_metas_multiples', nombre: 'Metas de ahorro ilimitadas', cat: 'herramienta', costo: 200, efecto: 'func:metas_multiples', desc: 'Sin el límite de 3 metas simultáneas.' },
  { id: 'func_recordatorios', nombre: 'Recordatorios por hábito', cat: 'herramienta', costo: 140, efecto: 'func:recordatorios', desc: 'Avisos del navegador a la hora exacta de cada hábito.' },

  // --- Apariencia ---
  { id: 'tema_noche', nombre: 'Tema Noche profunda', cat: 'tema', costo: 70, efecto: 'tema:noche', desc: 'Paleta oscura con acentos violeta.' },
  { id: 'tema_amanecer', nombre: 'Tema Amanecer', cat: 'tema', costo: 70, efecto: 'tema:amanecer', desc: 'Paleta clara con acentos cálidos.' },
  { id: 'tema_neon', nombre: 'Tema Neón', cat: 'tema', costo: 150, efecto: 'tema:neon', desc: 'Alto contraste, verdes y cian eléctricos.' },
  { id: 'tema_bosque', nombre: 'Tema Bosque', cat: 'tema', costo: 150, efecto: 'tema:bosque', desc: 'Verdes profundos y tierra.' },
];

export const MAPA_ARTICULOS = new Map(ARTICULOS.map((a) => [a.id, a]));

/**
 * Paquetes de pago. Precios en pesos chilenos, pensados como referencia de modelo de negocio.
 * La app funciona completa sin comprar nada: esto solo acelera.
 */
export const PAQUETES = [
  {
    id: 'pack_tokens_chico',
    nombre: 'Bolsa de 500 EVO',
    precio: 2990,
    tokens: 500,
    incluye: ['500 tokens EVO al instante', 'Equivale a unas 3 semanas de constancia'],
    destacado: false,
  },
  {
    id: 'pack_tokens_grande',
    nombre: 'Bolsa de 1.500 EVO',
    precio: 6990,
    tokens: 1500,
    incluye: ['1.500 tokens EVO al instante', 'Rinde un 25% más por peso que la bolsa chica'],
    destacado: false,
  },
  {
    id: 'pack_elite',
    nombre: 'Pack Élite',
    precio: 12990,
    tokens: 800,
    articulos: ['tier3_early', 'tier4_early', 'func_deload', 'func_calentamiento', 'func_cronometro'],
    incluye: [
      'Todos los niveles de entrenamiento hasta Hipertrofia avanzada',
      'Planificador de descarga y series de aproximación',
      'Cronómetro de descanso inteligente',
      '800 tokens EVO de regalo',
    ],
    destacado: true,
  },
  {
    id: 'pack_nutricion',
    nombre: 'Pack Nutrición Pro',
    precio: 9990,
    tokens: 300,
    articulos: ['plan_deficit', 'plan_volumen', 'plan_economico', 'func_recetas', 'func_micros'],
    incluye: [
      'Los 3 planes de comidas de 7 días con lista de compras',
      'Recetario de alta proteína (20 recetas)',
      'Panel de micronutrientes',
      '300 tokens EVO de regalo',
    ],
    destacado: false,
  },
  {
    id: 'pack_avatar',
    nombre: 'Pack Coleccionista',
    precio: 7990,
    tokens: 200,
    articulos: ['atuendo_deportivo', 'atuendo_gimnasio', 'aura_fuego', 'aura_hielo', 'tema_noche', 'tema_neon'],
    incluye: [
      '2 atuendos y 2 auras para el avatar',
      '2 temas visuales de la app',
      '200 tokens EVO de regalo',
    ],
    destacado: false,
  },
  {
    id: 'pack_total',
    nombre: 'Acceso Total (un pago)',
    precio: 24990,
    tokens: 2000,
    articulos: ARTICULOS.map((a) => a.id),
    incluye: [
      'Absolutamente todo el catálogo desbloqueado, para siempre',
      'Incluye Élite, todos los planes, atuendos, auras y herramientas',
      '2.000 tokens EVO para gastar en lo que venga después',
      'Sin suscripción: un pago y listo',
    ],
    destacado: true,
  },
];

export const MAPA_PAQUETES = new Map(PAQUETES.map((p) => [p.id, p]));

/** Cuánto vale en tokens todo lo que trae un paquete: sirve para mostrar el ahorro. */
export function valorEnTokens(paquete) {
  const deArticulos = (paquete.articulos || []).reduce((acc, id) => acc + (MAPA_ARTICULOS.get(id)?.costo || 0), 0);
  return deArticulos + (paquete.tokens || 0);
}
