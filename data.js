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
const INCOME_CATEGORIES = ['Sueldo', 'Extra', 'Negocio', 'Regalo', 'Intereses', 'Pago pendiente', 'Otros'];

// Ingresos fijos del brief (oct. 2026): sueldo y lo que le deben de un trabajo anterior.
const FIXED_INCOME_PRESET = [
  { name: 'Sueldo', amount: 2000, category: 'Sueldo', total: null, received: 0 },
  { name: 'Pago del trabajo anterior', amount: 250, category: 'Pago pendiente', total: 1750, received: 500 },
];
const FINANCE_VERSION = 1;

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
    minutes: 50,
    exercises: [
      { block: 'Potencia', name: 'Aterrizaje controlado → salto', q: 'drop jump landing technique', reps: ['3 × 5 caídas desde escalón (solo aterrizar)', '4 × 5 saltos con contramovimiento', '4 × 5 drop jump: cae del escalón y salta'], tip: 'Cae en silencio, con rodillas flexionadas y alineadas con la punta del pie. Descansa 60–90 s: la calidad importa más que la cantidad.' },
      { block: 'Potencia', name: 'Sentadilla con salto', q: 'jump squat proper form', reps: ['3 × 5', '4 × 6', '4 × 8'], tip: 'Sube explosivo, aterriza suave y para 1 segundo antes del siguiente salto.' },
      { block: 'Fuerza', name: 'Sentadilla búlgara', q: 'bulgarian split squat bodyweight form', reps: ['3 × 8 por pierna', '3 × 10 por pierna', '3 × 12 por pierna (bajando en 3 s)'], tip: 'Pie de atrás sobre una silla. Baja recto, con el peso en la pierna de adelante.' },
      { block: 'Fuerza', name: 'Puente de glúteo', q: 'single leg glute bridge form', reps: ['3 × 12 a dos piernas', '3 × 10 a una pierna', '3 × 12 a una pierna con pausa arriba'], tip: 'Aprieta glúteos arriba. Glúteos fuertes = más salto y rodillas más protegidas.' },
      { block: 'Fuerza', name: 'Curl nórdico', q: 'nordic hamstring curl at home couch', reps: ['3 × 3 (baja lento, frena con las manos)', '3 × 5', '3 × 6 bajando más profundo'], tip: 'Rodillas en un cojín y talones bajo el sofá. Déjate caer hacia adelante lo más lento posible. Reduce ~50 % los tirones de isquiotibiales.' },
      { block: 'Fuerza', name: 'Sentadilla isométrica en pared', q: 'wall sit isometric patellar tendon', reps: ['3 × 30 s', '3 × 45 s', '3 × 45 s a una pierna con apoyo'], tip: 'Protege el tendón de la rodilla (la "rodilla del saltador"). Rodillas a 60–90°.' },
      { block: 'Fuerza', name: 'Elevación de talones', q: 'single leg calf raise step eccentric', reps: ['3 × 15', '3 × 15 en escalón', '3 × 12 a una pierna en escalón'], tip: 'Sube rápido, baja en 3 s. Tobillos y pantorrillas listos para cada salto.' },
      { block: 'Equilibrio', name: 'Equilibrio a una pierna', q: 'single leg balance ankle exercise', reps: ['3 × 30 s por pierna', '3 × 30 s por pierna, ojos cerrados', '3 × 30 s por pierna sobre cojín, pasándote un balón'], tip: 'En 116 equipos de vóley, el entrenamiento de equilibrio redujo los esguinces de tobillo.' },
      { block: 'Pies y pisada', name: 'Pie corto (short foot)', q: 'short foot exercise intrinsic foot', reps: ['3 × 8 sentado (5 s)', '3 × 10 de pie (5 s)', '3 × 10 a una pierna (5 s)'], tip: 'Descalzo. Acorta el pie subiendo el arco sin doblar los dedos, como si quisieras acercar la punta al talón. Activa los músculos que estabilizan tu pisada.' },
      { block: 'Pies y pisada', name: 'Yoga de dedos', q: 'toe yoga exercise', reps: ['3 × 8 c/u', '3 × 10 c/u', '3 × 12 c/u de pie'], tip: 'Levanta solo el dedo gordo dejando los demás abajo, y luego al revés. Mejora el control fino del pie.' },
    ],
  },
  B: {
    name: 'Tren superior y hombros',
    short: 'Superior',
    focus: 'Remate y saque potentes con hombros sanos',
    minutes: 45,
    exercises: [
      { block: 'Potencia', name: 'Flexión explosiva', q: 'plyometric push up progression', reps: ['3 × 5 inclinada (manos en mesa), rápido', '3 × 5 en el suelo, despegando las manos', '3 × 5 con palmada'], tip: 'Baja controlado y empuja lo más rápido posible. Descansa 60 s.' },
      { block: 'Potencia', name: 'Lanzamiento de balón a la pared', q: 'volleyball wall spike drill arm swing', reps: ['3 × 8 por brazo', '3 × 10 por brazo', '4 × 10 por brazo'], tip: 'Con tu balón de vóley, imita el remate contra la pared a 2–3 m. Rápido, pero con buena técnica.' },
      { block: 'Fuerza', name: 'Flexiones', q: 'push up proper form', reps: ['3 × 8–10 inclinadas', '3 × 10–12', '3 × 12–15 bajando en 3 s'], tip: 'Cuerpo recto como tabla, codos a 45° del cuerpo.' },
      { block: 'Fuerza', name: 'Remo bajo mesa o con mochila', q: 'table inverted row at home', reps: ['3 × 10', '3 × 12', '3 × 12 con pausa de 2 s arriba'], tip: 'Lleva los codos atrás y junta los omóplatos. Equilibra todo el empuje del remate.' },
      { block: 'Fuerza', name: 'Pike push-up', q: 'pike push up form', reps: ['3 × 6', '3 × 8', '3 × 8 con pies elevados'], tip: 'Cadera arriba en forma de V y baja la cabeza entre las manos. Fortalece los hombros por encima de la cabeza.' },
      { block: 'Hombro', name: 'Rotación externa de lado', q: 'side lying external rotation shoulder', reps: ['2 × 12 por brazo', '3 × 12 con botella de agua', '3 × 15 con botella, bajando lento'], tip: 'Acostado de lado, codo pegado al cuerpo a 90°: gira el antebrazo hacia arriba. Es el músculo que frena el brazo después de rematar.' },
      { block: 'Hombro', name: 'Y-T-W boca abajo', q: 'prone Y T W exercise', reps: ['2 × 8 de cada letra', '3 × 10', '3 × 10 con botellas'], tip: 'Pulgares hacia el techo y omóplatos hacia atrás y abajo.' },
      { block: 'Core', name: 'Bird dog', q: 'bird dog exercise McGill', reps: ['3 × 6 por lado (5 s arriba)', '3 × 8 por lado', '3 × 10 por lado'], tip: 'Brazo y pierna contrarios extendidos sin que la espalda se mueva. Uno de los "3 grandes" de McGill.' },
      { block: 'Core', name: 'Plancha con toque de hombro', q: 'plank shoulder tap form', reps: ['3 × 10 toques', '3 × 16', '3 × 20'], tip: 'Pies separados y cadera quieta: entrenas anti-rotación.' },
      { block: 'Pies y pisada', name: 'Recoger toalla con los dedos', q: 'towel scrunch toe curl exercise', reps: ['3 × 30 s', '3 × 45 s', '3 × 45 s con un libro encima'], tip: 'Sentado, con una toalla en el suelo: arrúgala hacia ti solo con los dedos, sin mover el talón.' },
      { block: 'Pies y pisada', name: 'Separar los dedos', q: 'toe spread out exercise', reps: ['3 × 10 (3 s)', '3 × 12 (3 s)', '3 × 12 (5 s) de pie'], tip: 'Abre los dedos en abanico, sobre todo el gordo hacia adentro. Da una base más ancha y estable al caer.' },
    ],
  },
  C: {
    name: 'Core, agilidad y resistencia',
    short: 'Core',
    focus: 'Estabilidad, reacción y aguantar todo el partido',
    minutes: 45,
    exercises: [
      { block: 'Core', name: 'Curl-up de McGill', q: 'McGill curl up', reps: ['3 × 6 (10 s arriba)', '3 × 8 (10 s arriba)', '4 × 8 (10 s arriba)'], tip: 'Una rodilla doblada, manos bajo la zona lumbar. Despega solo cabeza y hombros, sin doblar el cuello.' },
      { block: 'Core', name: 'Plancha lateral', q: 'side plank form', reps: ['3 × 20 s por lado', '3 × 30 s por lado', '3 × 40 s por lado, elevando la pierna'], tip: 'Cuerpo en línea y cadera arriba. Protege la espalda en saltos y caídas.' },
      { block: 'Core', name: 'Dead bug', q: 'dead bug exercise form', reps: ['3 × 6 por lado', '3 × 8 por lado', '3 × 10 por lado, lento'], tip: 'Zona lumbar siempre pegada al suelo mientras estiras brazo y pierna contrarios.' },
      { block: 'Core', name: 'Superman', q: 'superman exercise back extension', reps: ['3 × 10', '3 × 10 (3 s arriba)', '3 × 12 (3 s arriba)'], tip: 'Extensores de espalda fuertes para saltar y caer sin dolor.' },
      { block: 'Coordinación', name: 'Desplazamiento de defensa', q: 'volleyball defensive shuffle footwork drill', reps: ['4 × 15 s', '5 × 20 s', '6 × 20 s'], tip: 'Postura baja como recibiendo, pasos laterales cortos y rápidos sin cruzar los pies. Toca el suelo en cada extremo.' },
      { block: 'Coordinación', name: 'Pies rápidos en escalera imaginaria', q: 'agility ladder drills without ladder', reps: ['3 × 15 s', '4 × 20 s', '4 × 20 s cambiando el patrón'], tip: 'Dibuja una escalera con cinta o líneas del piso: dentro-dentro-fuera-fuera.' },
      { block: 'Equilibrio', name: 'Salto lateral y caída a una pierna', q: 'lateral hop and stick', reps: ['3 × 5 por lado', '3 × 6 por lado', '3 × 8 por lado, más lejos'], tip: 'Salta de lado y "congela" la caída 2 s sobre una pierna, rodilla alineada.' },
      { block: 'Pies y pisada', name: 'Caminar de puntillas y de talones', q: 'heel walk toe walk exercise', reps: ['2 × 30 s c/u', '3 × 30 s c/u', '3 × 45 s c/u'], tip: 'Puntillas bien altas y luego sobre talones con la punta arriba. Fortalece pantorrilla y tibial, clave para frenar al aterrizar.' },
      { block: 'Pies y pisada', name: 'Elevación de talones con pelota', q: 'heel raise with ball between ankles', reps: ['3 × 10', '3 × 12 en escalón', '3 × 12 a una pierna, apretando el arco'], tip: 'Pelota o cojín pequeño entre los tobillos: aprieta mientras subes. El talón sube recto, sin que el tobillo se vaya hacia afuera.' },
      { block: 'Resistencia', name: 'HIIT final', q: 'bodyweight HIIT jumping jacks mountain climbers burpees', reps: ['6 rondas: 20 s intenso / 40 s descanso', '8 rondas: 30 s / 30 s', '10 rondas: 30 s / 20 s'], tip: 'Alterna jumping jacks, escaladores, desplazamientos y burpees. Esfuerzo alto: solo puedes decir palabras sueltas.' },
    ],
  },
  Y: {
    name: 'Yoga y movilidad',
    short: 'Yoga',
    focus: 'Flexibilidad, equilibrio y recuperación. Para días de descanso o después de jugar',
    minutes: 20,
    optional: true,
    exercises: [
      { block: 'Flujo', name: 'Saludo al sol', q: 'yoga sun salutation for beginners', reps: ['3 rondas lentas', '4 rondas', '5 rondas'], tip: 'Coordina cada movimiento con la respiración. Calienta todo el cuerpo.' },
      { block: 'Flujo', name: 'Guerrero II y triángulo', q: 'warrior 2 triangle pose', reps: ['30 s por lado c/u', '45 s por lado c/u', '60 s por lado c/u'], tip: 'Piernas fuertes y pecho abierto.' },
      { block: 'Equilibrio', name: 'Postura del árbol', q: 'tree pose yoga balance', reps: ['30 s por lado', '45 s por lado', '45 s por lado con ojos cerrados'], tip: 'Mira un punto fijo. Equilibrio = tobillos más estables.' },
      { block: 'Movilidad', name: 'Estocada baja y media paloma', q: 'low lunge half pigeon stretch', reps: ['2 × 30 s por lado', '2 × 45 s por lado', '2 × 60 s por lado'], tip: 'Abre caderas y flexores, muy cargados por saltar y estar en posición baja.' },
      { block: 'Movilidad', name: 'Puente y torsión acostado', q: 'yoga bridge supine twist', reps: ['2 × 30 s c/u', '2 × 45 s c/u', '2 × 60 s c/u'], tip: 'Libera la espalda baja.' },
      { block: 'Movilidad', name: 'Hilo en la aguja (hombros)', q: 'thread the needle stretch', reps: ['30 s por lado', '45 s por lado', '60 s por lado'], tip: 'En cuatro apoyos, pasa un brazo por debajo del otro y gira el tronco.' },
      { block: 'Respiración', name: 'Respiración en savasana', q: 'savasana breathing 4 6', reps: ['2 min', '3 min', '5 min'], tip: 'Inhala 4 s, exhala 6 s. Baja el estrés y ayuda a recuperarte.' },
    ],
  },
};
const WORKOUT_ORDER = ['A', 'B', 'C'];
const SESSIONS_TO_LEVEL_UP = 12; // ~4 semanas a 3 sesiones por semana

// Descanso entre series para el temporizador (segundos), según el tipo de trabajo (ACSM).
const REST_BY_BLOCK = {
  'Potencia': 75, 'Fuerza': 90, 'Hombro': 60, 'Core': 45, 'Equilibrio': 20,
  'Coordinación': 40, 'Pies y pisada': 20, 'Resistencia': 30,
  'Flujo': 10, 'Movilidad': 10, 'Respiración': 0,
};

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
  {
    title: 'Pies y pisada',
    tag: 'Ensayo clínico',
    points: [
      'En 118 corredores, 8 semanas de fortalecimiento de pies (y luego 3 veces por semana) bajaron las lesiones: 14 % frente a 33 % en el grupo control.',
      'El "pie corto" activa el arco y en varios estudios mejoró el equilibrio dinámico. Se necesitan al menos 5 semanas.',
      'Por eso cada sesión tiene 2 ejercicios de pies, descalzo, unos 4 minutos.',
    ],
    sources: [12, 13],
  },
  {
    title: 'Alimentación',
    tag: 'ISSN · Ecuaciones',
    points: [
      'Tus calorías se calculan con la ecuación de Mifflin-St Jeor, la más precisa para adultos sanos, ajustada por tu actividad.',
      'Proteína: 1,4–2,0 g por kg al día repartida cada 3–4 h, con 20–40 g por comida, para ganar o mantener músculo.',
      'Es una guía de inicio: ajusta según cómo cambien tu peso y tu energía en 2–3 semanas.',
    ],
    sources: [14, 15],
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
  { label: 'Taddei y cols. – Fortalecimiento de pies y lesiones (AJSM 2020)', url: 'https://www.physio-network.com/research-reviews/ankle-foot/foot-core-training-to-prevent-running-related-injuries-a-survival-analysis-of-a-single-blind-randomized-controlled-trial/' },
  { label: 'Hara y cols. – Ejercicio de pie corto (revisión, 2023)', url: 'https://journals.sagepub.com/doi/10.3233/BMR-210374' },
  { label: 'ISSN – Proteína y ejercicio (Jäger y cols. 2017)', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
  { label: 'Frankenfield y cols. – Ecuaciones de metabolismo en reposo (2005)', url: 'https://pure.psu.edu/en/publications/comparison-of-predictive-equations-for-resting-metabolic-rate-in-/' },
];

// Productos de la rutina de Pablo (ilustración en app.js → PRODUCT_ART).
const PRODUCTS = {
  cerave: { brand: 'CeraVe', name: 'Gel Limpiador Espumoso', detail: 'Piel normal a grasa · niacinamida y ceramidas' },
  byphasse: { brand: 'Byphasse', name: 'Tónico Sensi Fresh con aloe vera', detail: 'Piel sensible · calma e hidrata' },
  purito: { brand: 'Purito', name: 'B5 Panthenol Re-barrier Cream', detail: 'Pantenol y centella · repara la barrera' },
  neutrogena: { brand: 'Neutrogena', name: 'Sun Fresh Derm Care Oil Control', detail: 'Protector solar facial · toque seco' },
};

const DEFAULT_SKINCARE = {
  am: [
    { id: 'am-cerave', product: 'cerave', text: 'CeraVe Gel Limpiador Espumoso', note: 'Una pequeña cantidad sobre la cara húmeda, masajea 30–60 s y enjuaga con agua tibia.' },
    { id: 'am-byphasse', product: 'byphasse', text: 'Byphasse Tónico Sensi Fresh con aloe vera', note: 'Con un algodón o con las manos, sin frotar. Deja que se absorba.' },
    { id: 'am-purito', product: 'purito', text: 'Purito B5 Panthenol Re-barrier Cream', note: 'Una capa fina en cara y cuello. Espera 1–2 min antes del protector.' },
    { id: 'am-neutrogena', product: 'neutrogena', text: 'Neutrogena Sun Fresh Derm Care Oil Control', note: 'Último paso. Usa la regla de dos dedos para cara y cuello, y reaplica cada 2–3 h al sol.' },
  ],
  pm: [
    { id: 'pm-cerave', product: 'cerave', text: 'CeraVe Gel Limpiador Espumoso', note: 'Limpia bien para quitar el protector y el sudor del día. Si jugaste, lávate apenas termines.' },
    { id: 'pm-byphasse', product: 'byphasse', text: 'Byphasse Tónico Sensi Fresh con aloe vera', note: 'Calma la piel después de la limpieza.' },
    { id: 'pm-purito', product: 'purito', text: 'Purito B5 Panthenol Re-barrier Cream', note: 'De noche puedes poner una capa un poco más generosa.' },
  ],
  weekly: [
    { id: 'wk1', text: 'Exfoliación suave', times: 2 },
    { id: 'wk2', text: 'Mascarilla', times: 1 },
    { id: 'wk3', text: 'Cambiar funda de almohada', times: 1 },
  ],
};
const SKINCARE_VERSION = 2; // sube al cambiar la rutina base para actualizarla en el celular

const SKINCARE_TIPS = [
  'El protector solar es el paso más importante, incluso si está nublado o te quedas en casa.',
  'Aplica el protector 15 minutos antes de salir y repítelo cada 2–3 horas si estás al sol, también en la cancha.',
  'Lávate la cara después de jugar o entrenar: el sudor acumulado tapa los poros.',
  'Introduce un producto nuevo a la vez y espera 2 semanas para ver cómo reacciona tu piel.',
  'Constancia antes que cantidad: 3 pasos todos los días valen más que 10 pasos de vez en cuando.',
  'Toma agua y duerme bien: se nota en la piel.',
];

/* ---------- Alimentación ---------- */

const ACTIVITY_LEVELS = [
  { id: 'baja', name: 'Poca: trabajo sentado y entreno 1–2 veces', factor: 1.375 },
  { id: 'media', name: 'Media: 3 entrenos + vóley ocasional', factor: 1.55 },
  { id: 'alta', name: 'Alta: entreno o deporte 5–6 días', factor: 1.725 },
];
const NUTRITION_GOALS = [
  { id: 'grasa', name: 'Bajar grasa', kcal: -0.15, protein: 2.0, note: 'Déficit moderado (~15 %) para perder grasa sin perder músculo ni energía para jugar.' },
  { id: 'musculo', name: 'Ganar músculo', kcal: 0.10, protein: 1.8, note: 'Superávit pequeño (~10 %) para construir músculo con poca grasa extra.' },
  { id: 'rendir', name: 'Mantenerme y rendir', kcal: 0, protein: 1.6, note: 'Calorías de mantenimiento con proteína suficiente para recuperarte.' },
  { id: 'recomp', name: 'Rendir y definir', kcal: 0, protein: 2.0, note: 'Calorías de mantenimiento, proteína alta y entreno de fuerza: ganas músculo y pierdes grasa poco a poco sin bajar tu rendimiento.' },
];

// Datos del brief de Pablo (18 oct 2026). Se cargan la primera vez; se pueden cambiar en "Mis datos".
const NUTRITION_PRESET = { weight: 49, height: 157, age: 19, sex: 'm', goal: 'recomp', activity: 'media', meals: 4, avoid: 'papaya' };
const NUTRITION_VERSION = 1;
// Reparto del día según número de comidas.
const MEAL_SPLITS = {
  3: [['Desayuno', 0.30], ['Almuerzo', 0.40], ['Cena', 0.30]],
  4: [['Desayuno', 0.25], ['Almuerzo', 0.35], ['Snack para la U', 0.15], ['Cena', 0.25]],
  5: [['Desayuno', 0.22], ['Media mañana', 0.10], ['Almuerzo', 0.33], ['Merienda', 0.13], ['Cena', 0.22]],
};
// Ideas con comida fácil de conseguir en Santa Cruz, a partir de lo que ya comes.
const MEAL_IDEAS = {
  'Desayuno': [
    '3 huevos + 1 marraqueta o 2 rebanadas de pan integral + kiwi o piña',
    'Avena cocida con leche + 2 huevos + arándanos',
    'Tostadas con palta + huevos revueltos + manzana verde',
  ],
  'Media mañana': ['Yogur natural + fruta', 'Puñado de maní + mandarina'],
  'Almuerzo': [
    'Pechuga de pollo + papa hervida y arroz + tomate, lechuga y pepino con aceite de oliva',
    'Carne magra + yuca o arroz + verduras salteadas',
    'Majadito de pollo con huevo + ensalada',
  ],
  'Snack para la U': [
    'Sándwich de pollo o huevo en pan integral + una fruta (lo llevas en la mochila)',
    'Yogur bebible + plátano + puñado de maní',
    'Tupper pequeño de arroz con pollo',
  ],
  'Merienda': ['Yogur + avena o granola', 'Sándwich de pollo o atún', 'Plátano + leche o licuado de frutas con leche'],
  'Cena': [
    'Pechuga o carne + arroz o papa + tomate y pepino',
    'Tortilla de 2–3 huevos con verduras + yuca',
    'Sopa de quinua o fideo con carne + ensalada',
  ],
};

const FACE_FAT_NOTES = [
  'No se puede quemar grasa de una sola zona: la cara se afina cuando baja tu grasa total, y eso depende de la genética y la edad.',
  'A los 19 años la cara todavía cambia y se define con los años.',
  'La hinchazón de la cara baja si duermes 7–9 horas, comes menos ultraprocesados y sal, y tomas suficiente agua.',
  'La creatina a 5 g al día es segura y retiene agua dentro del músculo, no en la cara.',
];
