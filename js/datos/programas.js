// Programas de entrenamiento con nombre: alternativa al plan automático.
//
// El plan automático elige ejercicios por patrón cada semana. Un programa es lo
// contrario: una estructura fija que se repite y progresa, que es lo que mejor
// funciona cuando alguien quiere seguir algo concreto (correr 5 km, fuerza
// 5×5, glúteos). Cada programa declara su equipo y su nivel de contenido; un
// ejercicio nunca supera el nivel del programa (lo verifican las pruebas).
//
// Forma de cada ejercicio:
//   r(id, series, repMin, repMax)  → repeticiones
//   s(id, series, segMin, segMax)  → segundos (planchas, estiramientos)
//   m(id, minMin, minMax, texto)   → minutos de cardio, con indicación opcional
//
// sesiones: las del programa, en orden. Si dias < sesiones.length, se rotan
// de semana en semana (A-B-A, luego B-A-B), como en los programas de fuerza.
// etapas: para programas que cambian semana a semana (correr): cada etapa
// trae sus propias sesiones y cubre una o más semanas.

const r = (id, series, min, max, nota) => ({ id, series, min, max, unidad: 'reps', nota });
const s = (id, series, min, max, nota) => ({ id, series, min, max, unidad: 'seg', nota });
const m = (id, min, max, texto) => ({ id, series: 1, min, max, unidad: 'min', texto });

/* De cero a 5 km: 8 semanas, 3 salidas por semana. Cada salida parte con
   5 min de caminata y termina con estiramientos. */
const CARRERA = [
  ['8 × (1 min trotando + 1 min 30 s caminando)', 20, 22],
  ['6 × (1 min 30 s trotando + 2 min caminando)', 21, 23],
  ['5 × (2 min trotando + 2 min caminando)', 20, 22],
  ['4 × (3 min trotando + 1 min 30 s caminando)', 18, 20],
  ['3 × (5 min trotando + 2 min caminando)', 21, 23],
  ['2 × (8 min trotando + 2 min caminando)', 20, 22],
  ['2 × (10 min trotando + 1 min caminando), y si te sientes bien, 20 min seguidos', 21, 25],
  ['30 minutos de trote continuo: a ritmo suave son 4 a 5 km', 30, 32],
];

export const PROGRAMAS = [
  {
    id: 'inicio_casa',
    nombre: 'Primeros pasos en casa',
    resumen: 'Cuerpo completo sin equipo, para empezar de cero o volver tras una pausa larga.',
    objetivos: ['perder', 'salud', 'recomponer'],
    equipo: 'ninguno', tier: 1, dias: 3, semanas: 6, descanso: 60,
    progresion: 'Cuando completes el rango alto en todas las series de un ejercicio, súmale 2 repeticiones. Al terminar las 6 semanas pasa a Calistenia progresiva o Express de 20 minutos.',
    sesiones: [
      { nombre: 'Día A', ejercicios: [r('sentadilla_silla', 3, 10, 15), r('flexion_pared', 3, 10, 15), r('remo_toalla', 3, 10, 15), r('puente_gluteo', 3, 12, 15), s('plancha', 3, 20, 40), m('caminata_rapida', 15, 20)] },
      { nombre: 'Día B', ejercicios: [r('sentadilla_libre', 3, 10, 15), r('flexion_pica_rodillas', 3, 8, 12), r('jalon_toalla_alto', 3, 10, 15), r('patada_gluteo', 2, 12, 15), r('bicho_muerto', 3, 8, 12), r('elevacion_talones', 2, 15, 20)] },
      { nombre: 'Día C', ejercicios: [s('sentadilla_isometrica', 3, 20, 40), r('flexion_rodillas', 3, 6, 12), r('remo_toalla', 3, 10, 15), r('bird_dog', 3, 8, 12), r('superman', 2, 10, 12), m('subir_escaleras', 10, 15)] },
    ],
  },
  {
    id: 'express_20',
    nombre: 'Express de 20 minutos',
    resumen: 'Circuito corto para los días sin tiempo: se hace todo seguido y se repite la vuelta.',
    objetivos: ['perder', 'salud'],
    equipo: 'ninguno', tier: 1, dias: 3, semanas: 8, descanso: 30, circuito: true,
    progresion: 'Haz los ejercicios uno tras otro, descansa 60 s al final y repite: 3 vueltas las primeras semanas, 4 desde la semana 4.',
    sesiones: [
      { nombre: 'Circuito A', ejercicios: [r('sentadilla_libre', 3, 15, 20), r('flexion_rodillas', 3, 8, 12), s('jumping_jacks', 3, 30, 45), r('puente_gluteo', 3, 15, 20), s('plancha', 3, 20, 30)] },
      { nombre: 'Circuito B', ejercicios: [r('sentadilla_silla', 3, 15, 20), r('flexion_pared', 3, 12, 20), r('abdominal_bicicleta', 3, 16, 24), r('patada_gluteo', 3, 12, 15), s('jumping_jacks', 3, 30, 45)] },
      { nombre: 'Circuito C', ejercicios: [s('sentadilla_isometrica', 3, 30, 45), r('remo_toalla', 3, 12, 15), r('crunch', 3, 12, 20), r('superman', 3, 10, 12), s('jumping_jacks', 3, 30, 45)] },
    ],
  },
  {
    id: 'movilidad_espalda',
    nombre: 'Movilidad y espalda sana',
    resumen: 'Para quien pasa el día sentado o manejando: cadera, columna y core profundo.',
    objetivos: ['salud', 'perder', 'recomponer', 'ganar'],
    equipo: 'ninguno', tier: 1, dias: 3, semanas: 4, descanso: 30,
    progresion: 'Se puede hacer todos los días, también como calentamiento. Si hay dolor que baja por la pierna, hormigueo o dolor que despierta de noche, primero un kinesiólogo.',
    sesiones: [
      { nombre: 'Columna y cadera', ejercicios: [r('gato_camello', 2, 8, 10), r('rotacion_toracica', 2, 8, 10), s('estiramiento_flexor_cadera', 2, 30, 45), r('bird_dog', 3, 8, 10), r('puente_gluteo', 3, 12, 15), s('postura_nino', 2, 30, 60)] },
      { nombre: 'Hombros y pecho', ejercicios: [r('ytw_suelo', 2, 6, 8), s('estiramiento_pecho', 2, 30, 45), r('rotacion_toracica', 2, 8, 10), r('bicho_muerto', 3, 8, 10), s('plancha', 2, 20, 30), s('postura_nino', 2, 30, 60)] },
      { nombre: 'Piernas y tobillos', ejercicios: [r('movilidad_tobillo', 2, 10, 12), r('cadera_90_90', 2, 8, 10), s('estiramiento_isquios', 2, 30, 45), r('sentadilla_silla', 3, 10, 12), r('superman', 2, 10, 12), m('caminata_rapida', 10, 20)] },
    ],
  },
  {
    id: 'cero_a_5k',
    nombre: 'De cero a 5 km',
    resumen: 'De caminar a trotar 30 minutos seguidos en 8 semanas, con intervalos que crecen de a poco.',
    objetivos: ['perder', 'salud', 'recomponer'],
    equipo: 'ninguno', tier: 1, dias: 3, semanas: 8, descanso: 30,
    progresion: 'Deja un día de descanso entre salidas. Si una semana te costó mucho, repítela antes de avanzar: es más importante terminar que ir rápido. El ritmo correcto es el que te deja hablar en frases cortas.',
    etapas: CARRERA.map(([texto, a, b], i) => ({
      semanas: [i + 1],
      sesiones: [1, 2, 3].map((n) => ({
        nombre: `Semana ${i + 1} · salida ${n}`,
        ejercicios: [m('caminata_rapida', 5, 5, 'Calentamiento caminando a paso firme'), m('intervalos_trote', a, b, texto), s('estiramiento_isquios', 1, 30, 45), s('estiramiento_flexor_cadera', 1, 30, 45)],
      })),
    })),
  },
  {
    id: 'cardio_maquinas',
    nombre: 'Cardio y core en máquinas',
    resumen: 'Bajo impacto para cuidar rodillas y espalda: elíptica, bicicleta y cinta, más core.',
    objetivos: ['perder', 'salud'],
    equipo: 'gimnasio', tier: 1, dias: 3, semanas: 8, descanso: 45,
    progresion: 'Sube 2 minutos por semana o un nivel de resistencia cuando el esfuerzo se sienta moderado (puedes hablar, pero no cantar).',
    sesiones: [
      { nombre: 'Elíptica + core', ejercicios: [m('eliptica', 20, 30), r('bicho_muerto', 3, 10, 12), s('plancha', 3, 30, 45), r('crunch', 3, 12, 15)] },
      { nombre: 'Bicicleta + core', ejercicios: [m('bicicleta_estatica', 20, 30), r('bird_dog', 3, 10, 12), r('abdominal_bicicleta', 3, 16, 20), r('superman', 3, 10, 12)] },
      { nombre: 'Cinta inclinada + core', ejercicios: [m('cinta_inclinada', 20, 30), r('bicho_muerto', 3, 10, 12), s('plancha', 3, 30, 45), r('puente_gluteo', 3, 12, 15)] },
    ],
  },
  {
    id: 'calistenia',
    nombre: 'Calistenia progresiva',
    resumen: 'Solo con el cuerpo y una barra en la puerta: flexiones, dominadas y sentadillas que se vuelven más difíciles.',
    objetivos: ['recomponer', 'ganar', 'salud'],
    equipo: 'ninguno', tier: 2, dias: 3, semanas: 12, descanso: 90,
    progresion: 'Cuando completes 3 series en el tope del rango, pasa a la variante más difícil: flexión → flexión con pies elevados → arquera; dominada negativa → dominada; sentadilla → zancada → búlgara → pistol.',
    sesiones: [
      { nombre: 'Empuje y pierna', ejercicios: [r('flexion', 3, 8, 15), r('flexion_pica', 3, 6, 10), r('zancada', 3, 10, 12), r('fondos_silla', 3, 8, 12), s('plancha_lateral', 2, 20, 40)] },
      { nombre: 'Tirón y cadera', ejercicios: [r('dominada_negativa', 4, 3, 6, 'Baja en 4 a 5 segundos'), r('remo_invertido', 3, 8, 12), r('puente_una_pierna', 3, 8, 12), r('elevacion_piernas_suelo', 3, 10, 15), r('elevacion_talones', 3, 15, 20)] },
      { nombre: 'Cuerpo completo', ejercicios: [r('step_up', 3, 10, 12), r('flexion', 3, 8, 15), r('remo_invertido', 3, 8, 12), r('zancada_atras', 3, 10, 12), r('plancha_toque_hombro', 3, 16, 24)] },
    ],
  },
  {
    id: 'circuito_quema',
    nombre: 'Circuito quema grasa',
    resumen: 'Fuerza y cardio mezclados sin descanso largo: el pulso se mantiene arriba toda la sesión.',
    objetivos: ['perder', 'recomponer'],
    equipo: 'ninguno', tier: 2, dias: 3, semanas: 8, descanso: 30, circuito: true,
    progresion: '40 s de trabajo y 20 s de pausa por ejercicio; 3 vueltas con 90 s entre vueltas. Desde la semana 5, 4 vueltas.',
    sesiones: [
      { nombre: 'Circuito A', ejercicios: [r('sentadilla_libre', 3, 15, 20), r('flexion', 3, 8, 15), r('escalador', 3, 20, 30), r('zancada_atras', 3, 10, 12), s('rodillas_altas', 3, 30, 40)] },
      { nombre: 'Circuito B', ejercicios: [r('step_up', 3, 10, 12), r('remo_invertido', 3, 8, 12), s('boxeo_sombra', 3, 40, 60), r('puente_una_pierna', 3, 10, 12), r('giro_ruso', 3, 16, 24)] },
      { nombre: 'Circuito C', ejercicios: [r('zancada', 3, 10, 12), r('plancha_toque_hombro', 3, 16, 24), s('jumping_jacks', 3, 40, 60), r('flexion_pica', 3, 6, 10), m('trote', 10, 15)] },
    ],
  },
  {
    id: 'mancuernas_casa',
    nombre: 'Mancuernas en casa: torso y pierna',
    resumen: 'Cuatro días con un par de mancuernas y una banda: el programa más completo sin ir al gimnasio.',
    objetivos: ['ganar', 'recomponer', 'salud'],
    equipo: 'mancuernas', tier: 2, dias: 4, semanas: 10, descanso: 90,
    progresion: 'Doble progresión: sube repeticiones hasta el tope del rango en todas las series y recién entonces sube el peso. Con mancuernas fijas, alarga la bajada a 3 segundos.',
    sesiones: [
      { nombre: 'Torso A', ejercicios: [r('press_banca_mancuerna', 3, 8, 12), r('remo_mancuerna', 3, 8, 12), r('press_hombro_mancuerna', 3, 8, 12), r('curl_biceps', 2, 10, 15), r('extension_triceps_mancuerna', 2, 10, 15)] },
      { nombre: 'Pierna A', ejercicios: [r('sentadilla_goblet', 3, 8, 12), r('peso_muerto_rumano_mancuerna', 3, 8, 12), r('zancada', 3, 10, 12), r('elevacion_talones_carga', 3, 12, 15), s('plancha', 3, 30, 45)] },
      { nombre: 'Torso B', ejercicios: [r('flexion', 3, 8, 15), r('jalon_banda', 3, 10, 15), r('aperturas_mancuerna', 3, 10, 15), r('elevacion_lateral', 3, 12, 15), r('curl_martillo', 2, 10, 15), r('pajaro', 2, 12, 15)] },
      { nombre: 'Pierna B', ejercicios: [r('sentadilla_sumo_mancuerna', 3, 10, 12), r('hip_thrust_mancuerna', 3, 10, 15), r('step_up', 3, 10, 12), r('puente_una_pierna', 2, 10, 12), r('pallof', 3, 10, 12)] },
    ],
  },
  {
    id: 'gluteos',
    nombre: 'Glúteos y piernas',
    resumen: 'Dos días de tren inferior con énfasis en glúteo y uno de torso para mantener el equilibrio.',
    objetivos: ['ganar', 'recomponer', 'salud', 'perder'],
    equipo: 'mancuernas', tier: 2, dias: 3, semanas: 10, descanso: 90,
    progresion: 'El hip thrust manda: súbele peso apenas completes 4 × 12. Aprieta un segundo arriba en cada repetición; sin esa pausa trabaja más la pierna que el glúteo.',
    sesiones: [
      { nombre: 'Glúteo A', ejercicios: [r('hip_thrust_mancuerna', 4, 8, 12), r('sentadilla_goblet', 3, 8, 12), r('peso_muerto_rumano_mancuerna', 3, 10, 12), r('abduccion_banda', 3, 15, 20), r('puente_una_pierna', 2, 10, 12)] },
      { nombre: 'Torso', ejercicios: [r('press_banca_mancuerna', 3, 8, 12), r('remo_mancuerna', 3, 8, 12), r('press_hombro_mancuerna', 3, 10, 12), r('elevacion_lateral', 3, 12, 15), s('plancha', 3, 30, 45)] },
      { nombre: 'Glúteo B', ejercicios: [r('sentadilla_sumo_mancuerna', 4, 10, 12), r('zancada', 3, 10, 12), r('step_up', 3, 10, 12), r('patada_gluteo', 3, 12, 15), r('elevacion_talones_carga', 3, 12, 15), r('pallof', 2, 10, 12)] },
    ],
  },
  {
    id: 'torso_pierna_gym',
    nombre: 'Hipertrofia torso / pierna',
    resumen: 'Cuatro días en el gimnasio, cada músculo dos veces por semana. El clásico para ganar masa.',
    objetivos: ['ganar', 'recomponer'],
    equipo: 'gimnasio', tier: 3, dias: 4, semanas: 12, descanso: 120,
    progresion: 'Los dos primeros ejercicios de cada día son los pesados (6-10): progresa ahí. El resto es volumen: busca la congestión, no el récord.',
    sesiones: [
      { nombre: 'Torso pesado', ejercicios: [r('press_banca', 4, 6, 10), r('remo_barra', 4, 6, 10), r('press_militar', 3, 8, 10), r('jalon_polea', 3, 10, 12), r('curl_barra', 2, 10, 12), r('extension_triceps', 2, 10, 15)] },
      { nombre: 'Pierna pesada', ejercicios: [r('sentadilla_barra', 4, 6, 8), r('peso_muerto', 3, 5, 6), r('prensa', 3, 10, 12), r('curl_femoral', 3, 10, 15), r('elevacion_talones_maquina', 4, 10, 15)] },
      { nombre: 'Torso volumen', ejercicios: [r('press_inclinado_mancuerna', 3, 8, 12), r('remo_sentado', 3, 10, 12), r('press_hombro_maquina', 3, 10, 12), r('cruce_poleas', 3, 12, 15), r('face_pull', 3, 12, 15), r('curl_martillo', 2, 10, 12)] },
      { nombre: 'Pierna volumen', ejercicios: [r('sentadilla_hack', 3, 8, 12), r('hip_thrust', 3, 8, 12), r('zancada_caminando_mancuerna', 3, 10, 12), r('extension_cuadriceps', 3, 12, 15), r('hiperextension', 3, 12, 15)] },
    ],
  },
  {
    id: 'fuerza_5x5',
    nombre: 'Fuerza básica 5×5',
    resumen: 'Tres días con los grandes básicos y pocas repeticiones. Lo más directo para ponerse fuerte.',
    objetivos: ['ganar', 'recomponer', 'salud'],
    equipo: 'gimnasio', tier: 3, dias: 3, semanas: 12, descanso: 180,
    progresion: 'Si completas 5 × 5 con buena técnica, sube 2,5 kg la siguiente sesión (5 kg en peso muerto). Si fallas el mismo peso tres sesiones seguidas, baja un 10% y vuelve a subir.',
    sesiones: [
      { nombre: 'Entreno A', ejercicios: [r('sentadilla_barra', 5, 5, 5), r('press_banca', 5, 5, 5), r('remo_barra', 5, 5, 5), s('plancha', 3, 30, 45)] },
      { nombre: 'Entreno B', ejercicios: [r('sentadilla_barra', 5, 5, 5), r('press_militar', 5, 5, 5), r('peso_muerto', 1, 5, 5, 'Una sola serie pesada, después de las de aproximación'), r('dominada', 3, 5, 8)] },
    ],
  },
  {
    id: 'ppl',
    nombre: 'Empuje / Tirón / Piernas',
    resumen: 'Seis días, cada grupo dos veces por semana con variantes. Para quien ya tiene base y tiempo.',
    objetivos: ['ganar'],
    equipo: 'gimnasio', tier: 3, dias: 6, semanas: 12, descanso: 120,
    progresion: 'Primer ejercicio de cada día en 6-10 repeticiones con progresión de carga; el resto en 10-15. Si no recuperas entre sesiones, baja a 5 días quitando el segundo día de piernas.',
    sesiones: [
      { nombre: 'Empuje A', ejercicios: [r('press_banca', 4, 6, 10), r('press_militar', 3, 8, 10), r('press_inclinado_mancuerna', 3, 8, 12), r('elevacion_lateral', 3, 12, 15), r('extension_triceps', 3, 10, 15)] },
      { nombre: 'Tirón A', ejercicios: [r('dominada', 4, 6, 10), r('remo_barra', 3, 8, 10), r('remo_sentado', 3, 10, 12), r('face_pull', 3, 12, 15), r('curl_barra', 3, 8, 12)] },
      { nombre: 'Piernas A', ejercicios: [r('sentadilla_barra', 4, 6, 8), r('hip_thrust', 3, 8, 12), r('prensa', 3, 10, 12), r('curl_femoral', 3, 10, 15), r('elevacion_talones_maquina', 4, 10, 15)] },
      { nombre: 'Empuje B', ejercicios: [r('press_inclinado', 4, 6, 10), r('press_hombro_mancuerna', 3, 8, 12), r('cruce_poleas', 3, 12, 15), r('elevacion_lateral', 3, 12, 15), r('press_frances', 3, 10, 12)] },
      { nombre: 'Tirón B', ejercicios: [r('jalon_agarre_cerrado', 4, 8, 10), r('remo_t', 3, 8, 10), r('pullover_polea', 3, 12, 15), r('pajaro', 3, 12, 15), r('curl_predicador', 3, 10, 12)] },
      { nombre: 'Piernas B', ejercicios: [r('sentadilla_hack', 4, 8, 10), r('peso_muerto', 3, 5, 6), r('zancada_caminando_mancuerna', 3, 10, 12), r('extension_cuadriceps', 3, 12, 15), r('elevacion_talones_maquina', 3, 12, 15)] },
    ],
  },
];

export const MAPA_PROGRAMAS = new Map(PROGRAMAS.map((p) => [p.id, p]));
