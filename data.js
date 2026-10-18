// Contenido fijo de la app: plan de ejercicio, guía, rutina base de skincare y categorías.

const GOAL_AREAS = [
  { id: 'personal', name: 'Personal', icon: 'leaf' },
  { id: 'salud', name: 'Salud', icon: 'heart' },
  { id: 'finanzas', name: 'Finanzas', icon: 'coins' },
  { id: 'estudios', name: 'Estudios / Trabajo', icon: 'book' },
  { id: 'relaciones', name: 'Relaciones', icon: 'users' },
  { id: 'proyectos', name: 'Proyectos', icon: 'spark' },
];

const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Cuidado personal',
  'Ropa', 'Ocio', 'Educación', 'Deudas', 'Ahorro / Inversión', 'Otros',
];
const INCOME_CATEGORIES = ['Sueldo', 'Extra', 'Negocio', 'Regalo', 'Intereses', 'Otros'];

/* ---------- Plan de entrenamiento ----------
   Basado en la guía (ver GUIDE): fuerza 2–3 días/semana de cuerpo completo (ACSM, OMS),
   pliometría al inicio de la sesión y >10 semanas (Sáez de Villarreal 2009,
   Ramirez-Campillo 2020), equilibrio para tobillos (Verhagen 2004), curl nórdico
   (van Dyk 2019), HIIT corto (Wen 2019) y estiramiento estático solo al final (ACSM, Behm).
   reps = [nivel 1, nivel 2, nivel 3]. Cada nivel dura ~4 semanas (12 sesiones). */

// Calentamiento neuromuscular dinámico: igual para todas las sesiones.
const WARMUP = [
  'Trote suave o jumping jacks – 1 min',
  'Abrir y cerrar la puerta (cadera) – 8 por lado',
  'Zancada con giro de tronco – 5 por lado',
  'Sentadilla con brazos arriba – 10',
  'Círculos de brazos y Y-T con brazos – 10 c/u',
  'Movilidad de tobillo (rodilla a la pared) – 10 por lado',
  'Saltitos de pantorrilla – 20',
  'Skipping en el sitio – 20 s',
];

// Vuelta a la calma: estiramiento estático y yoga, 2 × 30 s cada postura.
const COOLDOWN = [
  'Perro boca abajo – pantorrillas e isquiotibiales',
  'Estocada baja – flexor de cadera',
  'Paloma (o figura 4 acostado) – glúteo',
  'Cuádriceps de pie o de lado',
  'Pecho en el marco de la puerta',
  'Hombro cruzado y tríceps',
  'Postura del niño con respiración lenta',
];

const WORKOUT_PLAN = {
  A: {
    name: 'Potencia y piernas',
    short: 'Potencia',
    focus: 'Saltar más alto y caer seguro',
    minutes: 45,
    exercises: [
      { block: 'Potencia', name: 'Aterrizaje controlado → salto', reps: ['3 × 5 caídas desde escalón (solo aterrizar)', '4 × 5 saltos con contramovimiento', '4 × 5 drop jump: cae del escalón y salta'], tip: 'Cae en silencio, con rodillas flexionadas y alineadas con la punta del pie. Descansa 60–90 s: la calidad importa más que la cantidad.' },
      { block: 'Potencia', name: 'Sentadilla con salto', reps: ['3 × 5', '4 × 6', '4 × 8'], tip: 'Sube explosivo, aterriza suave y para 1 segundo antes del siguiente salto.' },
      { block: 'Fuerza', name: 'Sentadilla búlgara', reps: ['3 × 8 por pierna', '3 × 10 por pierna', '3 × 12 por pierna (bajando en 3 s)'], tip: 'Pie de atrás sobre una silla. Baja recto, con el peso en la pierna de adelante.' },
      { block: 'Fuerza', name: 'Puente de glúteo', reps: ['3 × 12 a dos piernas', '3 × 10 a una pierna', '3 × 12 a una pierna con pausa arriba'], tip: 'Aprieta glúteos arriba. Glúteos fuertes = más salto y rodillas más protegidas.' },
      { block: 'Fuerza', name: 'Curl nórdico', reps: ['3 × 3 (baja lento, frena con las manos)', '3 × 5', '3 × 6 bajando más profundo'], tip: 'Rodillas en un cojín y talones bajo el sofá. Déjate caer hacia adelante lo más lento posible. Reduce ~50 % los tirones de isquiotibiales.' },
      { block: 'Fuerza', name: 'Sentadilla isométrica en pared', reps: ['3 × 30 s', '3 × 45 s', '3 × 45 s a una pierna con apoyo'], tip: 'Protege el tendón de la rodilla (la "rodilla del saltador"). Rodillas a 60–90°.' },
      { block: 'Fuerza', name: 'Elevación de talones', reps: ['3 × 15', '3 × 15 en escalón', '3 × 12 a una pierna en escalón'], tip: 'Sube rápido, baja en 3 s. Tobillos y pantorrillas listos para cada salto.' },
      { block: 'Equilibrio', name: 'Equilibrio a una pierna', reps: ['3 × 30 s por pierna', '3 × 30 s ojos cerrados', '3 × 30 s sobre cojín pasándote un balón'], tip: 'En 116 equipos de vóley, el entrenamiento de equilibrio redujo los esguinces de tobillo.' },
    ],
  },
  B: {
    name: 'Tren superior y hombros',
    short: 'Superior',
    focus: 'Remate y saque potentes con hombros sanos',
    minutes: 40,
    exercises: [
      { block: 'Potencia', name: 'Flexión explosiva', reps: ['3 × 5 inclinada (manos en mesa), rápido', '3 × 5 en el suelo, despegando las manos', '3 × 5 con palmada'], tip: 'Baja controlado y empuja lo más rápido posible. Descansa 60 s.' },
      { block: 'Potencia', name: 'Lanzamiento de balón a la pared', reps: ['3 × 8 por brazo', '3 × 10 por brazo', '4 × 10 por brazo'], tip: 'Con tu balón de vóley, imita el remate contra la pared a 2–3 m. Rápido, pero con buena técnica.' },
      { block: 'Fuerza', name: 'Flexiones', reps: ['3 × 8–10 inclinadas', '3 × 10–12', '3 × 12–15 bajando en 3 s'], tip: 'Cuerpo recto como tabla, codos a 45° del cuerpo.' },
      { block: 'Fuerza', name: 'Remo bajo mesa o con mochila', reps: ['3 × 10', '3 × 12', '3 × 12 con pausa de 2 s arriba'], tip: 'Lleva los codos atrás y junta los omóplatos. Equilibra todo el empuje del remate.' },
      { block: 'Fuerza', name: 'Pike push-up', reps: ['3 × 6', '3 × 8', '3 × 8 con pies elevados'], tip: 'Cadera arriba en forma de V y baja la cabeza entre las manos. Fortalece los hombros por encima de la cabeza.' },
      { block: 'Hombro', name: 'Rotación externa de lado', reps: ['2 × 12 por brazo', '3 × 12 con botella de agua', '3 × 15 con botella, bajando lento'], tip: 'Acostado de lado, codo pegado al cuerpo a 90°: gira el antebrazo hacia arriba. Es el músculo que frena el brazo después de rematar.' },
      { block: 'Hombro', name: 'Y-T-W boca abajo', reps: ['2 × 8 de cada letra', '3 × 10', '3 × 10 con botellas'], tip: 'Pulgares hacia el techo y omóplatos hacia atrás y abajo.' },
      { block: 'Core', name: 'Bird dog', reps: ['3 × 6 por lado (5 s arriba)', '3 × 8 por lado', '3 × 10 por lado'], tip: 'Brazo y pierna contrarios extendidos sin que la espalda se mueva. Uno de los "3 grandes" de McGill.' },
      { block: 'Core', name: 'Plancha con toque de hombro', reps: ['3 × 10 toques', '3 × 16', '3 × 20'], tip: 'Pies separados y cadera quieta: entrenas anti-rotación.' },
    ],
  },
  C: {
    name: 'Core, agilidad y resistencia',
    short: 'Core',
    focus: 'Estabilidad, reacción y aguantar todo el partido',
    minutes: 40,
    exercises: [
      { block: 'Core', name: 'Curl-up de McGill', reps: ['3 × 6 (10 s arriba)', '3 × 8 (10 s arriba)', '4 × 8 (10 s arriba)'], tip: 'Una rodilla doblada, manos bajo la zona lumbar. Despega solo cabeza y hombros, sin doblar el cuello.' },
      { block: 'Core', name: 'Plancha lateral', reps: ['3 × 20 s por lado', '3 × 30 s por lado', '3 × 40 s con elevación de pierna'], tip: 'Cuerpo en línea y cadera arriba. Protege la espalda en saltos y caídas.' },
      { block: 'Core', name: 'Dead bug', reps: ['3 × 6 por lado', '3 × 8 por lado', '3 × 10 por lado, lento'], tip: 'Zona lumbar siempre pegada al suelo mientras estiras brazo y pierna contrarios.' },
      { block: 'Core', name: 'Superman', reps: ['3 × 10', '3 × 10 (3 s arriba)', '3 × 12 (3 s arriba)'], tip: 'Extensores de espalda fuertes para saltar y caer sin dolor.' },
      { block: 'Coordinación', name: 'Desplazamiento de defensa', reps: ['4 × 15 s', '5 × 20 s', '6 × 20 s'], tip: 'Postura baja como recibiendo, pasos laterales cortos y rápidos sin cruzar los pies. Toca el suelo en cada extremo.' },
      { block: 'Coordinación', name: 'Pies rápidos en escalera imaginaria', reps: ['3 × 15 s', '4 × 20 s', '4 × 20 s cambiando el patrón'], tip: 'Dibuja una escalera con cinta o líneas del piso: dentro-dentro-fuera-fuera.' },
      { block: 'Equilibrio', name: 'Salto lateral y caída a una pierna', reps: ['3 × 5 por lado', '3 × 6 por lado', '3 × 8 por lado, más lejos'], tip: 'Salta de lado y "congela" la caída 2 s sobre una pierna, rodilla alineada.' },
      { block: 'Resistencia', name: 'HIIT final', reps: ['6 rondas: 20 s intenso / 40 s descanso', '8 rondas: 30 s / 30 s', '10 rondas: 30 s / 20 s'], tip: 'Alterna jumping jacks, escaladores, desplazamientos y burpees. Esfuerzo alto: solo puedes decir palabras sueltas.' },
    ],
  },
  Y: {
    name: 'Yoga y movilidad',
    short: 'Yoga',
    focus: 'Flexibilidad, equilibrio y recuperación. Para días de descanso o después de jugar',
    minutes: 20,
    optional: true,
    exercises: [
      { block: 'Flujo', name: 'Saludo al sol', reps: ['3 rondas lentas', '4 rondas', '5 rondas'], tip: 'Coordina cada movimiento con la respiración. Calienta todo el cuerpo.' },
      { block: 'Flujo', name: 'Guerrero II y triángulo', reps: ['30 s por lado c/u', '45 s por lado c/u', '60 s por lado c/u'], tip: 'Piernas fuertes y pecho abierto.' },
      { block: 'Equilibrio', name: 'Postura del árbol', reps: ['30 s por lado', '45 s por lado', '45 s por lado con ojos cerrados'], tip: 'Mira un punto fijo. Equilibrio = tobillos más estables.' },
      { block: 'Movilidad', name: 'Estocada baja y media paloma', reps: ['2 × 30 s por lado', '2 × 45 s por lado', '2 × 60 s por lado'], tip: 'Abre caderas y flexores, muy cargados por saltar y estar en posición baja.' },
      { block: 'Movilidad', name: 'Puente y torsión acostado', reps: ['2 × 30 s c/u', '2 × 45 s c/u', '2 × 60 s c/u'], tip: 'Libera la espalda baja.' },
      { block: 'Movilidad', name: 'Hilo en la aguja (hombros)', reps: ['30 s por lado', '45 s por lado', '60 s por lado'], tip: 'En cuatro apoyos, pasa un brazo por debajo del otro y gira el tronco.' },
      { block: 'Respiración', name: 'Respiración en savasana', reps: ['2 min', '3 min', '5 min'], tip: 'Inhala 4 s, exhala 6 s. Baja el estrés y ayuda a recuperarte.' },
    ],
  },
};
const WORKOUT_ORDER = ['A', 'B', 'C'];
const SESSIONS_TO_LEVEL_UP = 12; // ~4 semanas a 3 sesiones por semana

// Guía resumida que se muestra en la app (detalle completo en la guía del proyecto).
const GUIDE = [
  {
    title: 'Lo mínimo semanal',
    tag: 'OMS 2020',
    points: [
      '150–300 min de actividad moderada o 75–150 min de actividad intensa por semana. El vóley cuenta.',
      'Fuerza al menos 2 días por semana.',
      'Menos tiempo sentado: cualquier movimiento suma.',
    ],
    sources: [0],
  },
  {
    title: 'Fuerza',
    tag: 'ACSM',
    points: [
      '2–3 días por semana, cuerpo completo, 1–3 series de 8–15 repeticiones.',
      'Descansa 2–3 min en ejercicios grandes y 1–2 min en los demás.',
      'Si te sobran 1–2 repeticiones dos sesiones seguidas, sube la dificultad: más lento, a una pierna o con mochila.',
    ],
    sources: [1],
  },
  {
    title: 'Pliometría',
    tag: 'Metaanálisis',
    points: [
      'En jugadores de vóley mejora el salto vertical (efecto 0,82).',
      'Más de 10 semanas y más de 20 sesiones dan mejores resultados.',
      'Combina sentadilla con salto, contramovimiento y drop jump. Agregar peso no ayuda más.',
      'Hazla al inicio, fresco, y aprende primero a caer bien.',
    ],
    sources: [2, 3],
  },
  {
    title: 'Core',
    tag: 'Revisión sistemática',
    points: [
      'Solo, el core da beneficios pequeños al rendimiento. Funciona junto con fuerza y saltos.',
      'Entrénalo para resistir movimiento: planchas, dead bug, bird dog, curl-up de McGill.',
    ],
    sources: [4],
  },
  {
    title: 'Equilibrio y tobillos',
    tag: 'Ensayo en vóley',
    points: [
      'En 116 equipos de vóley, el entrenamiento de equilibrio redujo los esguinces de tobillo, sobre todo en quien ya tuvo uno.',
      '5–10 min, 3 veces por semana: una pierna, ojos cerrados, cojín y saltos con caída.',
    ],
    sources: [5],
  },
  {
    title: 'Resistencia',
    tag: 'Metaanálisis',
    points: [
      'El HIIT mejora la capacidad aeróbica con cualquier protocolo, incluso intervalos ≤30 s.',
      'Más rondas y más semanas = mejoras mayores.',
    ],
    sources: [6],
  },
  {
    title: 'Flexibilidad y yoga',
    tag: 'ACSM · Estudios',
    points: [
      'Estira al menos 2–3 días por semana (mejor diario), 10–30 s por postura.',
      'Antes de jugar: calentamiento dinámico. Nada de estiramientos largos (más de 60 s) justo antes de saltar.',
      'En atletas, 10 semanas de yoga mejoraron la flexibilidad y el equilibrio.',
    ],
    sources: [7, 8, 9],
  },
  {
    title: 'Prevención de lesiones',
    tag: 'Vóley',
    points: [
      'Curl nórdico: los programas que lo incluyen reducen ~50 % los tirones de isquiotibiales.',
      'Rodilla del saltador: hasta 14 % de jugadores amateur. Sentadilla isométrica y bajar lento la protegen; no aumentes saltos de golpe.',
      'Hombro: rotación externa y control de escápula para frenar el brazo después del remate.',
    ],
    sources: [10, 11],
  },
];

const GUIDE_SOURCES = [
  { label: 'OMS – Guías de actividad física 2020 (BJSM)', url: 'https://bjsm.bmj.com/content/54/24' },
  { label: 'ACSM – Modelos de progresión en fuerza (2009)', url: 'https://sfu.ca/~ryand/kin343/ACSMresistance.pdf' },
  { label: 'Ramirez-Campillo y cols. – Pliometría en vóley (JSSM 2020)', url: 'https://jssm.org/jssm-19-489.xml-abst' },
  { label: 'Sáez de Villarreal y cols. – Variables de la pliometría (JSCR 2009)', url: 'https://www.bisp-surf.de/Record/PU200909004175' },
  { label: 'Reed y cols. – Core y rendimiento (Sports Med 2012)', url: 'https://sponet.de/sponet/Record/4027189?lng=en' },
  { label: 'Verhagen y cols. – Equilibrio y tobillo en vóley (AJSM 2004)', url: 'https://journals.sagepub.com/doi/10.1177/0363546503262177' },
  { label: 'Wen y cols. – HIIT y VO2máx (JSAMS 2019)', url: 'https://vu-9.eprints-hosting.org/37877/1/PIIS1440244018309198.pdf' },
  { label: 'ACSM – Guía de estiramiento y flexibilidad', url: 'https://www.acsm.org/blog-detail/acsm-certified-blog/2021/03/18/stretching-and-flexibility-guidelines-update' },
  { label: 'Shea, Behm y cols. – Estiramiento y rendimiento (JSSM 2024)', url: 'https://www.jssm.org/jssm-23-663.xml-Fulltext' },
  { label: 'Polsgrove y cols. – Yoga en atletas (IJOY 2016)', url: 'https://doaj.org/article/2209cccb67be442b9a81b704217efb51' },
  { label: 'van Dyk y cols. – Curl nórdico (BJSM 2019)', url: 'https://bjsm.bmj.com/content/53/21/1362.abstract' },
  { label: 'Theodorou y cols. – Rodilla del saltador (2023)', url: 'https://link.springer.com/article/10.1007/s00402-023-04998-5' },
];

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
  'Aplica el protector 15 minutos antes de salir y repítelo cada 2–3 horas si estás al sol, también en la cancha.',
  'Lávate la cara después de jugar o entrenar: el sudor acumulado tapa los poros.',
  'Introduce un producto nuevo a la vez y espera 2 semanas para ver cómo reacciona tu piel.',
  'Constancia antes que cantidad: 3 pasos todos los días valen más que 10 pasos de vez en cuando.',
  'Toma agua y duerme bien: se nota en la piel.',
];
