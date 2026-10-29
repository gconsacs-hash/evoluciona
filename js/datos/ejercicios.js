// Catálogo de ejercicios organizado por patrón de movimiento, equipo y nivel de desbloqueo.
// tier 1 = disponible desde el día uno; tier 5 = solo para avanzados.

export const PATRONES = {
  empuje_h: 'Empuje horizontal',
  empuje_v: 'Empuje vertical',
  tiron_h: 'Tirón horizontal',
  tiron_v: 'Tirón vertical',
  rodilla: 'Dominante de rodilla',
  cadera: 'Dominante de cadera',
  core: 'Core',
  brazo: 'Brazos',
  hombro: 'Hombro',
  pantorrilla: 'Pantorrilla',
  metcon: 'Acondicionamiento',
  movilidad: 'Movilidad',
};

export const EQUIPOS = {
  ninguno: 'Sin equipo (casa)',
  mancuernas: 'Mancuernas o bandas',
  gimnasio: 'Gimnasio completo',
};

// El equipo requerido se declara como nivel mínimo: ninguno < mancuernas < gimnasio.
export const ORDEN_EQUIPO = { ninguno: 0, mancuernas: 1, gimnasio: 2 };

export const EJERCICIOS = [
  // --- Empuje horizontal ---
  { id: 'flexion_pared', nombre: 'Flexión en pared', patron: 'empuje_h', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'hombro', 'triceps'] },
  { id: 'flexion_rodillas', nombre: 'Flexión con rodillas apoyadas', patron: 'empuje_h', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'triceps'] },
  { id: 'flexion', nombre: 'Flexión de brazos', patron: 'empuje_h', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'triceps', 'hombro'] },
  { id: 'press_banca_mancuerna', nombre: 'Press de banca con mancuernas', patron: 'empuje_h', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['pecho', 'triceps'] },
  { id: 'press_banca', nombre: 'Press de banca con barra', patron: 'empuje_h', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['pecho', 'triceps', 'hombro'] },
  { id: 'press_inclinado', nombre: 'Press inclinado', patron: 'empuje_h', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['pecho', 'hombro'] },
  { id: 'flexion_declinada', nombre: 'Flexión con pies elevados', patron: 'empuje_h', equipo: 'ninguno', tier: 3, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'hombro'] },
  { id: 'flexion_arquera', nombre: 'Flexión arquera', patron: 'empuje_h', equipo: 'ninguno', tier: 4, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'triceps'] },
  { id: 'flexion_una_mano', nombre: 'Flexión a una mano', patron: 'empuje_h', equipo: 'ninguno', tier: 5, tipo: 'compuesto', corporal: true, musculos: ['pecho', 'core'] },

  // --- Empuje vertical ---
  { id: 'press_mochila', nombre: 'Press de hombro con mochila cargada', patron: 'empuje_v', equipo: 'ninguno', tier: 1, tipo: 'compuesto', musculos: ['hombro', 'triceps'] },
  { id: 'flexion_pica_rodillas', nombre: 'Flexión en pica con rodillas apoyadas', patron: 'empuje_v', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['hombro', 'triceps'] },
  { id: 'press_hombro_mancuerna', nombre: 'Press de hombro con mancuernas', patron: 'empuje_v', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['hombro', 'triceps'] },
  { id: 'press_militar', nombre: 'Press militar con barra', patron: 'empuje_v', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['hombro', 'triceps', 'core'] },
  { id: 'flexion_pica', nombre: 'Flexión en pica', patron: 'empuje_v', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['hombro', 'triceps'] },
  { id: 'pseudo_planche', nombre: 'Flexión pseudo-planche', patron: 'empuje_v', equipo: 'ninguno', tier: 4, tipo: 'compuesto', corporal: true, musculos: ['hombro', 'core'] },
  { id: 'flexion_vertical', nombre: 'Flexión vertical en pared', patron: 'empuje_v', equipo: 'ninguno', tier: 5, tipo: 'compuesto', corporal: true, musculos: ['hombro', 'triceps'] },

  // --- Tirón horizontal ---
  { id: 'remo_toalla', nombre: 'Remo con toalla en puerta', patron: 'tiron_h', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'remo_mancuerna', nombre: 'Remo con mancuerna a una mano', patron: 'tiron_h', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'remo_barra', nombre: 'Remo con barra', patron: 'tiron_h', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['espalda', 'biceps', 'core'] },
  { id: 'remo_invertido', nombre: 'Remo invertido bajo la mesa', patron: 'tiron_h', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'remo_sentado', nombre: 'Remo sentado en polea', patron: 'tiron_h', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'remo_pendlay', nombre: 'Remo Pendlay', patron: 'tiron_h', equipo: 'gimnasio', tier: 5, tipo: 'compuesto', musculos: ['espalda', 'core'] },

  // --- Tirón vertical ---
  { id: 'jalon_toalla_alto', nombre: 'Jalón con toalla sobre una puerta', patron: 'tiron_v', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'jalon_polea', nombre: 'Jalón al pecho en polea', patron: 'tiron_v', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'dominada_asistida', nombre: 'Dominada asistida con banda', patron: 'tiron_v', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'dominada', nombre: 'Dominada', patron: 'tiron_v', equipo: 'ninguno', tier: 3, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'dominada_lastrada', nombre: 'Dominada con lastre', patron: 'tiron_v', equipo: 'gimnasio', tier: 4, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'dominada_arquera', nombre: 'Dominada arquera', patron: 'tiron_v', equipo: 'ninguno', tier: 5, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'core'] },

  // --- Dominante de rodilla ---
  { id: 'sentadilla_silla', nombre: 'Sentadilla a la silla', patron: 'rodilla', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_libre', nombre: 'Sentadilla con peso corporal', patron: 'rodilla', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'zancada', nombre: 'Zancadas alternas', patron: 'rodilla', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_goblet', nombre: 'Sentadilla goblet', patron: 'rodilla', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo', 'core'] },
  { id: 'sentadilla_barra', nombre: 'Sentadilla con barra', patron: 'rodilla', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo', 'core'] },
  { id: 'sentadilla_bulgara', nombre: 'Sentadilla búlgara', patron: 'rodilla', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'prensa', nombre: 'Prensa de piernas', patron: 'rodilla', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_salto', nombre: 'Sentadilla con salto', patron: 'rodilla', equipo: 'ninguno', tier: 3, tipo: 'compuesto', corporal: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_pistol', nombre: 'Sentadilla pistol', patron: 'rodilla', equipo: 'ninguno', tier: 5, tipo: 'compuesto', corporal: true, unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_frontal', nombre: 'Sentadilla frontal', patron: 'rodilla', equipo: 'gimnasio', tier: 4, tipo: 'compuesto', musculos: ['cuadriceps', 'core'] },

  // --- Dominante de cadera ---
  { id: 'puente_gluteo', nombre: 'Puente de glúteo', patron: 'cadera', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['gluteo', 'isquios'] },
  { id: 'peso_muerto_rumano_mancuerna', nombre: 'Peso muerto rumano con mancuernas', patron: 'cadera', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['isquios', 'gluteo', 'espalda'] },
  { id: 'peso_muerto', nombre: 'Peso muerto convencional', patron: 'cadera', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['isquios', 'gluteo', 'espalda'] },
  { id: 'hip_thrust', nombre: 'Hip thrust con barra', patron: 'cadera', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['gluteo', 'isquios'] },
  { id: 'buenos_dias', nombre: 'Buenos días con barra', patron: 'cadera', equipo: 'gimnasio', tier: 4, tipo: 'compuesto', musculos: ['isquios', 'espalda'] },
  { id: 'nordic_curl', nombre: 'Curl nórdico', patron: 'cadera', equipo: 'ninguno', tier: 5, tipo: 'aislado', corporal: true, musculos: ['isquios'] },
  { id: 'peso_muerto_una_pierna', nombre: 'Peso muerto a una pierna', patron: 'cadera', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', unilateral: true, musculos: ['isquios', 'gluteo'] },

  // --- Hombro y brazos ---
  { id: 'elevacion_lateral_botella', nombre: 'Elevaciones laterales con botellas de agua', patron: 'hombro', equipo: 'ninguno', tier: 1, tipo: 'aislado', musculos: ['hombro'] },
  { id: 'curl_botella', nombre: 'Curl de bíceps con botellas o bolsas', patron: 'brazo', equipo: 'ninguno', tier: 1, tipo: 'aislado', musculos: ['biceps'] },
  { id: 'fondos_silla_facil', nombre: 'Fondos en silla con rodillas flectadas', patron: 'brazo', equipo: 'ninguno', tier: 1, tipo: 'compuesto', corporal: true, musculos: ['triceps', 'pecho'] },
  { id: 'elevacion_lateral', nombre: 'Elevaciones laterales', patron: 'hombro', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['hombro'] },
  { id: 'pajaro', nombre: 'Pájaro (deltoides posterior)', patron: 'hombro', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['hombro', 'espalda'] },
  { id: 'face_pull', nombre: 'Face pull', patron: 'hombro', equipo: 'gimnasio', tier: 3, tipo: 'aislado', musculos: ['hombro', 'espalda'] },
  { id: 'curl_biceps', nombre: 'Curl de bíceps', patron: 'brazo', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['biceps'] },
  { id: 'curl_martillo', nombre: 'Curl martillo', patron: 'brazo', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['biceps'] },
  { id: 'fondos_silla', nombre: 'Fondos en silla', patron: 'brazo', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['triceps', 'pecho'] },
  { id: 'fondos_paralelas', nombre: 'Fondos en paralelas', patron: 'brazo', equipo: 'gimnasio', tier: 4, tipo: 'compuesto', corporal: true, musculos: ['triceps', 'pecho'] },
  { id: 'extension_triceps', nombre: 'Extensión de tríceps en polea', patron: 'brazo', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['triceps'] },
  { id: 'curl_concentrado', nombre: 'Curl concentrado', patron: 'brazo', equipo: 'mancuernas', tier: 3, tipo: 'aislado', musculos: ['biceps'] },

  // --- Core ---
  { id: 'plancha', nombre: 'Plancha frontal', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, tiempo: true, musculos: ['core'] },
  { id: 'plancha_lateral', nombre: 'Plancha lateral', patron: 'core', equipo: 'ninguno', tier: 2, tipo: 'aislado', corporal: true, tiempo: true, unilateral: true, musculos: ['core'] },
  { id: 'bicho_muerto', nombre: 'Bicho muerto (dead bug)', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'elevacion_piernas', nombre: 'Elevación de piernas colgado', patron: 'core', equipo: 'gimnasio', tier: 4, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'rueda_abdominal', nombre: 'Rueda abdominal', patron: 'core', equipo: 'mancuernas', tier: 4, tipo: 'aislado', musculos: ['core'] },
  { id: 'hollow_hold', nombre: 'Hollow hold', patron: 'core', equipo: 'ninguno', tier: 3, tipo: 'aislado', corporal: true, tiempo: true, musculos: ['core'] },
  { id: 'paseo_granjero', nombre: 'Paseo del granjero', patron: 'core', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['core', 'espalda'] },

  // --- Pantorrilla ---
  { id: 'elevacion_talones', nombre: 'Elevación de talones', patron: 'pantorrilla', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['pantorrilla'] },
  { id: 'elevacion_talones_carga', nombre: 'Elevación de talones con carga', patron: 'pantorrilla', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['pantorrilla'] },

  // --- Acondicionamiento ---
  { id: 'caminata_rapida', nombre: 'Caminata rápida', patron: 'metcon', equipo: 'ninguno', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'trote', nombre: 'Trote continuo', patron: 'metcon', equipo: 'ninguno', tier: 2, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'burpee', nombre: 'Burpees', patron: 'metcon', equipo: 'ninguno', tier: 3, tipo: 'cardio', corporal: true, musculos: ['cardio', 'pecho', 'cuadriceps'] },
  { id: 'saltos_cuerda', nombre: 'Salto de cuerda', patron: 'metcon', equipo: 'ninguno', tier: 2, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'pantorrilla'] },
  { id: 'escalador', nombre: 'Escalador (mountain climbers)', patron: 'metcon', equipo: 'ninguno', tier: 2, tipo: 'cardio', corporal: true, musculos: ['cardio', 'core'] },
  { id: 'sprint_intervalos', nombre: 'Sprints en intervalos', patron: 'metcon', equipo: 'ninguno', tier: 4, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'isquios'] },

  /* ---------- Ampliación del catálogo (29-oct-2026) ---------- */

  // --- Empuje ---
  { id: 'press_pecho_maquina', nombre: 'Press de pecho en máquina', patron: 'empuje_h', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', musculos: ['pecho', 'triceps'] },
  { id: 'aperturas_mancuerna', nombre: 'Aperturas con mancuernas', patron: 'empuje_h', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['pecho'] },
  { id: 'press_inclinado_mancuerna', nombre: 'Press inclinado con mancuernas', patron: 'empuje_h', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['pecho', 'hombro', 'triceps'] },
  { id: 'cruce_poleas', nombre: 'Cruce de poleas', patron: 'empuje_h', equipo: 'gimnasio', tier: 3, tipo: 'aislado', musculos: ['pecho'] },
  { id: 'press_hombro_maquina', nombre: 'Press de hombro en máquina', patron: 'empuje_v', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', musculos: ['hombro', 'triceps'] },
  { id: 'press_arnold', nombre: 'Press Arnold', patron: 'empuje_v', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['hombro', 'triceps'] },

  // --- Tirón ---
  { id: 'remo_banda', nombre: 'Remo con banda elástica', patron: 'tiron_h', equipo: 'mancuernas', tier: 1, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'remo_inclinado_mancuerna', nombre: 'Remo con apoyo en banco inclinado', patron: 'tiron_h', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'remo_t', nombre: 'Remo en T', patron: 'tiron_h', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'jalon_banda', nombre: 'Jalón con banda elástica', patron: 'tiron_v', equipo: 'mancuernas', tier: 1, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'dominada_negativa', nombre: 'Dominada negativa (bajada lenta)', patron: 'tiron_v', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'biceps'] },
  { id: 'jalon_agarre_cerrado', nombre: 'Jalón con agarre cerrado', patron: 'tiron_v', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['espalda', 'biceps'] },
  { id: 'pullover_polea', nombre: 'Pullover en polea alta', patron: 'tiron_v', equipo: 'gimnasio', tier: 3, tipo: 'aislado', musculos: ['espalda'] },

  // --- Rodilla ---
  { id: 'sentadilla_isometrica', nombre: 'Sentadilla isométrica contra la pared', patron: 'rodilla', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, tiempo: true, musculos: ['cuadriceps'] },
  { id: 'zancada_atras', nombre: 'Zancada hacia atrás', patron: 'rodilla', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'step_up', nombre: 'Subida al cajón o escalón', patron: 'rodilla', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'sentadilla_sumo_mancuerna', nombre: 'Sentadilla sumo con mancuerna', patron: 'rodilla', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo'] },
  { id: 'extension_cuadriceps', nombre: 'Extensión de cuádriceps en máquina', patron: 'rodilla', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['cuadriceps'] },
  { id: 'zancada_caminando_mancuerna', nombre: 'Zancadas caminando con mancuernas', patron: 'rodilla', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', unilateral: true, musculos: ['cuadriceps', 'gluteo'] },
  { id: 'thruster', nombre: 'Thruster con mancuernas (sentadilla y press)', patron: 'rodilla', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo', 'hombro'] },
  { id: 'sentadilla_hack', nombre: 'Sentadilla hack', patron: 'rodilla', equipo: 'gimnasio', tier: 3, tipo: 'compuesto', musculos: ['cuadriceps', 'gluteo'] },

  // --- Cadera ---
  { id: 'patada_gluteo', nombre: 'Patada de glúteo en cuadrupedia', patron: 'cadera', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, unilateral: true, musculos: ['gluteo'] },
  { id: 'abduccion_banda', nombre: 'Caminata lateral con banda', patron: 'cadera', equipo: 'mancuernas', tier: 1, tipo: 'aislado', musculos: ['gluteo'] },
  { id: 'puente_una_pierna', nombre: 'Puente de glúteo a una pierna', patron: 'cadera', equipo: 'ninguno', tier: 2, tipo: 'compuesto', corporal: true, unilateral: true, musculos: ['gluteo', 'isquios'] },
  { id: 'hip_thrust_mancuerna', nombre: 'Hip thrust con mancuerna', patron: 'cadera', equipo: 'mancuernas', tier: 2, tipo: 'compuesto', musculos: ['gluteo', 'isquios'] },
  { id: 'curl_femoral', nombre: 'Curl femoral en máquina', patron: 'cadera', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['isquios'] },
  { id: 'abduccion_maquina', nombre: 'Abducción de cadera en máquina', patron: 'cadera', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['gluteo'] },
  { id: 'hiperextension', nombre: 'Hiperextensión en banco romano', patron: 'cadera', equipo: 'gimnasio', tier: 2, tipo: 'compuesto', corporal: true, musculos: ['espalda', 'gluteo', 'isquios'] },
  { id: 'swing_pesa_rusa', nombre: 'Swing con pesa rusa o mancuerna', patron: 'cadera', equipo: 'mancuernas', tier: 3, tipo: 'compuesto', musculos: ['gluteo', 'isquios', 'core'] },
  { id: 'peso_muerto_sumo', nombre: 'Peso muerto sumo', patron: 'cadera', equipo: 'gimnasio', tier: 4, tipo: 'compuesto', musculos: ['gluteo', 'isquios', 'cuadriceps'] },

  // --- Hombro y brazos ---
  { id: 'ytw_suelo', nombre: 'Y-T-W boca abajo', patron: 'hombro', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['hombro', 'espalda'] },
  { id: 'elevacion_frontal', nombre: 'Elevación frontal', patron: 'hombro', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['hombro'] },
  { id: 'face_pull_banda', nombre: 'Face pull con banda', patron: 'hombro', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['hombro', 'espalda'] },
  { id: 'encogimientos', nombre: 'Encogimientos de hombros', patron: 'hombro', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['espalda'] },
  { id: 'curl_banda', nombre: 'Curl de bíceps con banda', patron: 'brazo', equipo: 'mancuernas', tier: 1, tipo: 'aislado', musculos: ['biceps'] },
  { id: 'extension_triceps_mancuerna', nombre: 'Extensión de tríceps sobre la cabeza', patron: 'brazo', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['triceps'] },
  { id: 'patada_triceps', nombre: 'Patada de tríceps', patron: 'brazo', equipo: 'mancuernas', tier: 2, tipo: 'aislado', musculos: ['triceps'] },
  { id: 'curl_barra', nombre: 'Curl de bíceps con barra', patron: 'brazo', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['biceps'] },
  { id: 'flexion_diamante', nombre: 'Flexión diamante', patron: 'brazo', equipo: 'ninguno', tier: 3, tipo: 'compuesto', corporal: true, musculos: ['triceps', 'pecho'] },
  { id: 'press_frances', nombre: 'Press francés con barra Z', patron: 'brazo', equipo: 'gimnasio', tier: 3, tipo: 'aislado', musculos: ['triceps'] },
  { id: 'curl_predicador', nombre: 'Curl en banco predicador', patron: 'brazo', equipo: 'gimnasio', tier: 3, tipo: 'aislado', musculos: ['biceps'] },

  // --- Core ---
  { id: 'crunch', nombre: 'Abdominal corto (crunch)', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'abdominal_bicicleta', nombre: 'Abdominal bicicleta', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'bird_dog', nombre: 'Bird dog (brazo y pierna opuestos)', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, unilateral: true, musculos: ['core', 'espalda'] },
  { id: 'superman', nombre: 'Superman', patron: 'core', equipo: 'ninguno', tier: 1, tipo: 'aislado', corporal: true, musculos: ['espalda', 'gluteo'] },
  { id: 'giro_ruso', nombre: 'Giro ruso', patron: 'core', equipo: 'ninguno', tier: 2, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'plancha_toque_hombro', nombre: 'Plancha alta con toque de hombro', patron: 'core', equipo: 'ninguno', tier: 2, tipo: 'aislado', corporal: true, musculos: ['core', 'hombro'] },
  { id: 'elevacion_piernas_suelo', nombre: 'Elevación de piernas en el suelo', patron: 'core', equipo: 'ninguno', tier: 2, tipo: 'aislado', corporal: true, musculos: ['core'] },
  { id: 'pallof', nombre: 'Press Pallof con banda', patron: 'core', equipo: 'mancuernas', tier: 2, tipo: 'aislado', unilateral: true, musculos: ['core'] },
  { id: 'l_sit', nombre: 'L-sit', patron: 'core', equipo: 'ninguno', tier: 4, tipo: 'aislado', corporal: true, tiempo: true, musculos: ['core', 'triceps'] },
  { id: 'dragon_flag', nombre: 'Dragon flag', patron: 'core', equipo: 'ninguno', tier: 5, tipo: 'aislado', corporal: true, musculos: ['core'] },

  // --- Pantorrilla ---
  { id: 'elevacion_talones_maquina', nombre: 'Elevación de talones en máquina', patron: 'pantorrilla', equipo: 'gimnasio', tier: 2, tipo: 'aislado', musculos: ['pantorrilla'] },
  { id: 'elevacion_talones_una_pierna', nombre: 'Elevación de talones a una pierna', patron: 'pantorrilla', equipo: 'ninguno', tier: 3, tipo: 'aislado', corporal: true, unilateral: true, musculos: ['pantorrilla'] },

  // --- Acondicionamiento ---
  { id: 'jumping_jacks', nombre: 'Saltos de tijera (jumping jacks)', patron: 'metcon', equipo: 'ninguno', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'subir_escaleras', nombre: 'Subir y bajar escaleras', patron: 'metcon', equipo: 'ninguno', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'cuadriceps'] },
  { id: 'intervalos_trote', nombre: 'Intervalos de trote y caminata', patron: 'metcon', equipo: 'ninguno', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'rodillas_altas', nombre: 'Rodillas arriba en el lugar', patron: 'metcon', equipo: 'ninguno', tier: 2, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'boxeo_sombra', nombre: 'Boxeo de sombra', patron: 'metcon', equipo: 'ninguno', tier: 2, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'hombro'] },
  { id: 'bicicleta_estatica', nombre: 'Bicicleta estática', patron: 'metcon', equipo: 'gimnasio', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'eliptica', nombre: 'Elíptica', patron: 'metcon', equipo: 'gimnasio', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio'] },
  { id: 'cinta_inclinada', nombre: 'Caminata en cinta inclinada', patron: 'metcon', equipo: 'gimnasio', tier: 1, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'gluteo'] },
  { id: 'remo_ergometro', nombre: 'Remo en máquina (ergómetro)', patron: 'metcon', equipo: 'gimnasio', tier: 2, tipo: 'cardio', tiempo: true, musculos: ['cardio', 'espalda'] },

  // --- Movilidad (no suma series de músculo: prepara y alivia) ---
  { id: 'gato_camello', nombre: 'Gato-camello', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, musculos: ['movilidad'] },
  { id: 'rotacion_toracica', nombre: 'Rotación torácica en cuadrupedia', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, unilateral: true, musculos: ['movilidad'] },
  { id: 'estiramiento_flexor_cadera', nombre: 'Estiramiento de flexor de cadera (rodilla al suelo)', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, tiempo: true, unilateral: true, musculos: ['movilidad'] },
  { id: 'estiramiento_isquios', nombre: 'Estiramiento de isquiotibiales', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, tiempo: true, musculos: ['movilidad'] },
  { id: 'movilidad_tobillo', nombre: 'Movilidad de tobillo (rodilla a la pared)', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, unilateral: true, musculos: ['movilidad'] },
  { id: 'cadera_90_90', nombre: 'Cambios de cadera 90/90', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, musculos: ['movilidad'] },
  { id: 'estiramiento_pecho', nombre: 'Estiramiento de pecho en el marco de la puerta', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, tiempo: true, musculos: ['movilidad'] },
  { id: 'postura_nino', nombre: 'Postura del niño', patron: 'movilidad', equipo: 'ninguno', tier: 1, tipo: 'movilidad', corporal: true, tiempo: true, musculos: ['movilidad'] },
];

export const MAPA_EJERCICIOS = new Map(EJERCICIOS.map((e) => [e.id, e]));

export const NOMBRES_MUSCULOS = {
  pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps', isquios: 'Isquiotibiales', gluteo: 'Glúteos', core: 'Core',
  pantorrilla: 'Pantorrillas', cardio: 'Cardiovascular', movilidad: 'Movilidad',
};
