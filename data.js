// Contenido fijo de la app: plan de ejercicio, rutina base de skincare y categorías.

const GOAL_AREAS = [
  { id: 'personal', name: 'Personal', icon: '🌱' },
  { id: 'salud', name: 'Salud', icon: '❤️' },
  { id: 'finanzas', name: 'Finanzas', icon: '💰' },
  { id: 'estudios', name: 'Estudios / Trabajo', icon: '📚' },
  { id: 'relaciones', name: 'Relaciones', icon: '🤝' },
  { id: 'proyectos', name: 'Proyectos', icon: '🚀' },
];

const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Cuidado personal',
  'Ropa', 'Ocio', 'Educación', 'Deudas', 'Ahorro / Inversión', 'Otros',
];
const INCOME_CATEGORIES = ['Sueldo', 'Extra', 'Negocio', 'Regalo', 'Intereses', 'Otros'];

// Calentamiento y estiramiento se hacen en todas las sesiones.
const WARMUP = [
  'Trote suave en el sitio o jumping jacks – 1 min',
  'Círculos de brazos adelante y atrás – 30 s',
  'Rotaciones de cadera y tronco – 30 s',
  'Sentadillas lentas – 10',
  'Movilidad de tobillo (rodilla a la pared) – 10 por lado',
];
const COOLDOWN = [
  'Estiramiento de cuádriceps – 30 s por pierna',
  'Estiramiento de isquiotibiales – 30 s por pierna',
  'Estiramiento de pecho en el marco de la puerta – 30 s',
  'Hombro cruzado – 30 s por brazo',
  'Postura del niño (espalda) – 45 s',
];

// Plan de cuerpo completo en casa, pensado para vóley: piernas fuertes para saltar,
// hombros sanos para remate y saque, core para estabilidad y pies rápidos.
// reps = [nivel 1, nivel 2, nivel 3]
const WORKOUT_PLAN = {
  A: {
    name: 'Piernas y salto',
    short: 'Piernas',
    focus: 'Fuerza de piernas, potencia de salto y tobillos fuertes',
    exercises: [
      { name: 'Sentadilla', reps: ['3 × 12', '4 × 15', '4 × 20 (baja en 3 s)'], tip: 'Pies al ancho de hombros, pecho arriba, rodillas en línea con la punta del pie.' },
      { name: 'Zancada hacia atrás', reps: ['3 × 8 por pierna', '3 × 12 por pierna', '4 × 12 por pierna'], tip: 'Da un paso atrás y baja hasta que ambas rodillas formen 90°.' },
      { name: 'Puente de glúteo', reps: ['3 × 15', '3 × 12 a una pierna', '4 × 15 a una pierna'], tip: 'Aprieta glúteos arriba 1 segundo. Clave para saltar más.' },
      { name: 'Elevación de talones (pantorrillas)', reps: ['3 × 15', '3 × 20 en escalón', '4 × 15 a una pierna en escalón'], tip: 'Sube rápido, baja lento. Protege tus tobillos al caer.' },
      { name: 'Sentadilla con salto', reps: ['3 × 6', '4 × 8', '5 × 8'], tip: 'Aterriza suave, con rodillas flexionadas y sin que se vayan hacia adentro.' },
      { name: 'Equilibrio a una pierna', reps: ['3 × 30 s por pierna', '3 × 45 s ojos cerrados', '3 × 45 s sobre cojín'], tip: 'Previene esguinces de tobillo, la lesión más común en vóley.' },
    ],
  },
  B: {
    name: 'Tren superior y hombros',
    short: 'Brazos',
    focus: 'Brazos, espalda y hombros sanos para remate y saque',
    exercises: [
      { name: 'Flexiones', reps: ['3 × 8 inclinadas (manos en mesa)', '3 × 10 normales', '4 × 15 normales'], tip: 'Cuerpo en línea recta, codos a 45° del cuerpo.' },
      { name: 'Remo con mochila o bajo mesa', reps: ['3 × 10', '3 × 12', '4 × 15'], tip: 'Lleva los codos hacia atrás y junta los omóplatos.' },
      { name: 'Pike push-up (hombros)', reps: ['3 × 6', '3 × 10', '4 × 10 pies elevados'], tip: 'Cadera arriba en forma de V, baja la cabeza entre las manos.' },
      { name: 'Y-T-W boca abajo', reps: ['2 × 8 de cada letra', '3 × 10', '3 × 12 con botellas de agua'], tip: 'Fortalece el manguito rotador. El mejor seguro para tu hombro de remate.' },
      { name: 'Fondos en silla (tríceps)', reps: ['3 × 8', '3 × 12', '4 × 15'], tip: 'Hombros lejos de las orejas, baja hasta 90°.' },
      { name: 'Plancha con toque de hombro', reps: ['3 × 10 toques', '3 × 16', '4 × 20'], tip: 'Que la cadera no se mueva de lado a lado.' },
    ],
  },
  C: {
    name: 'Core y agilidad',
    short: 'Core',
    focus: 'Abdomen fuerte, estabilidad y desplazamientos rápidos',
    exercises: [
      { name: 'Plancha frontal', reps: ['3 × 30 s', '3 × 45 s', '3 × 60 s'], tip: 'Aprieta abdomen y glúteos, no dejes caer la cadera.' },
      { name: 'Plancha lateral', reps: ['2 × 20 s por lado', '3 × 30 s por lado', '3 × 45 s con elevación de pierna'], tip: 'Cuerpo en línea, cadera arriba.' },
      { name: 'Dead bug', reps: ['3 × 8 por lado', '3 × 10 por lado', '3 × 12 lento'], tip: 'La zona lumbar siempre pegada al suelo.' },
      { name: 'Superman', reps: ['3 × 10', '3 × 12 (2 s arriba)', '3 × 15 (3 s arriba)'], tip: 'Espalda baja fuerte para saltar y caer sin dolor.' },
      { name: 'Desplazamiento lateral (posición de defensa)', reps: ['4 × 20 s', '5 × 25 s', '6 × 30 s'], tip: 'Postura baja como recibiendo, pasos cortos y rápidos sin cruzar pies.' },
      { name: 'Saltos de patinador', reps: ['3 × 10', '3 × 16', '4 × 20'], tip: 'Salta de lado y aterriza en una pierna, estable 1 segundo.' },
      { name: 'Escaladores (mountain climbers)', reps: ['3 × 20 s', '3 × 30 s', '4 × 40 s'], tip: 'Ritmo rápido, cadera baja.' },
    ],
  },
};
const WORKOUT_ORDER = ['A', 'B', 'C'];
const SESSIONS_TO_LEVEL_UP = 12; // ~4 semanas a 3 sesiones por semana

const DEFAULT_SKINCARE = {
  am: [
    { id: 'am1', text: 'Limpiador suave' },
    { id: 'am2', text: 'Hidratante' },
    { id: 'am3', text: 'Protector solar FPS 30+' },
  ],
  pm: [
    { id: 'pm1', text: 'Limpiador (doble si usaste protector)' },
    { id: 'pm2', text: 'Tratamiento / sérum' },
    { id: 'pm3', text: 'Hidratante' },
  ],
  weekly: [
    { id: 'wk1', text: 'Exfoliación suave', times: 2 },
    { id: 'wk2', text: 'Mascarilla', times: 1 },
    { id: 'wk3', text: 'Cambiar funda de almohada', times: 1 },
  ],
};

const SKINCARE_TIPS = [
  'El protector solar es el paso más importante, incluso si está nublado o te quedas en casa.',
  'Aplica el protector 15 minutos antes de salir y repítelo cada 2–3 horas si estás al sol (¡en la cancha también!).',
  'Lávate la cara después de jugar o entrenar: el sudor acumulado tapa los poros.',
  'Introduce un producto nuevo a la vez y espera 2 semanas para ver cómo reacciona tu piel.',
  'Constancia > cantidad: 3 pasos todos los días valen más que 10 pasos de vez en cuando.',
  'Toma agua y duerme bien: se nota en la piel.',
];
