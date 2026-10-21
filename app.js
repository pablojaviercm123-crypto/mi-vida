'use strict';

/* ---------- Almacenamiento ---------- */

const STORAGE_KEY = 'mi-proyecto-de-vida-v1';

function defaultState() {
  return {
    settings: { name: '', currency: 'Bs' },
    goals: [],
    tx: [],
    savings: [],
    decisions: [],
    workout: { level: 1, levelStart: 0, sessions: [], volley: [], yoga: [], dance: [], current: null },
    skin: {
      am: DEFAULT_SKINCARE.am.map(s => ({ ...s })),
      pm: DEFAULT_SKINCARE.pm.map(s => ({ ...s })),
      weekly: DEFAULT_SKINCARE.weekly.map(s => ({ ...s })),
      log: {},
      weeklyLog: [],
      sun: {},
    },
    skinV: 0, // 0 = aún sin la rutina base actual
    nutrition: { profile: null, v: 0 },
    fixedIncome: [],
    goalsV: 0,
    financeV: 0,
    ui: { finTab: 'resumen', finMonth: null, workoutPick: null, workoutTab: 'plan' },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeDefaults(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.error(e);
    return defaultState();
  }
}

// Completa claves que falten en datos viejos o importados.
function mergeDefaults(def, data) {
  if (Array.isArray(def) || typeof def !== 'object' || def === null) return data ?? def;
  const out = { ...def };
  for (const k of Object.keys(data || {})) {
    out[k] = k in def && def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])
      ? mergeDefaults(def[k], data[k])
      : data[k];
  }
  return out;
}

let S = loadState();
S.ui.workoutPick = null; // cada vez que abres la app, muestra la sesión que te toca
// Carga los datos del brief de alimentación una sola vez (si aún no hay perfil propio).
if ((S.nutrition.v || 0) < NUTRITION_VERSION) {
  if (!S.nutrition.profile) S.nutrition.profile = { ...NUTRITION_PRESET };
  S.nutrition.v = NUTRITION_VERSION;
  save();
}
// Ingresos fijos del brief (sueldo y pago pendiente de un trabajo anterior).
if ((S.financeV || 0) < FINANCE_VERSION) {
  if (!S.fixedIncome.length) S.fixedIncome = FIXED_INCOME_PRESET.map((f, i) => ({ ...f, id: 'fx' + i }));
  S.financeV = FINANCE_VERSION;
  save();
}
// Metas pedidas por chat: se agregan una vez y luego son tuyas para editar.
if ((S.goalsV || 0) < GOALS_VERSION) {
  GOALS_PRESET.forEach((g, i) => {
    if (S.goals.some(x => x.preset === g.key || x.title === g.title)) return;
    S.goals.push({
      id: 'gp' + i + Date.now().toString(36), preset: g.key, title: g.title, area: g.area, deadline: g.deadline, why: g.why,
      milestones: g.steps.map((text, j) => ({ id: `${g.key}-${j}`, text, done: false })),
      manual: 0, done: false, createdAt: dateKey(),
    });
  });
  S.goalsV = GOALS_VERSION;
  save();
}
// Rutina base de skincare actualizada (los productos reales de Pablo).
if ((S.skinV || 1) < SKINCARE_VERSION) {
  S.skin.am = DEFAULT_SKINCARE.am.map(s => ({ ...s }));
  S.skin.pm = DEFAULT_SKINCARE.pm.map(s => ({ ...s }));
  S.skin.weekly = DEFAULT_SKINCARE.weekly.map(s => ({ ...s }));
  S.skinV = SKINCARE_VERSION;
  save();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (e) {
    toast('No se pudo guardar. ¿Memoria llena?');
  }
}

/* ---------- Iconos (trazo 1.8, 24 × 24) ---------- */

const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  wallet: '<rect x="3" y="6.5" width="18" height="13.5" rx="3"/><path d="M16 13.5h2M6.5 6.5V6a2.5 2.5 0 0 1 2.5-2.5h8"/>',
  bolt: '<path d="M13.5 2.5 5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  drop: '<path d="M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9.5 7V4h5v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  chevL: '<path d="m14.5 6-6 6 6 6"/>',
  chevR: '<path d="m9.5 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  leaf: '<path d="M5 19.5C5 11 10.5 5 20 4.5c0 9.5-6 15-14 15"/><path d="M5 19.5 13 11.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.8"/><path d="M3.5 7v4.5c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V7"/><path d="M14.5 11c3 0 6 1.2 6 2.8v3.4c0 1.5-2.7 2.8-6 2.8-2.1 0-3.9-.5-5-1.3"/>',
  book: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M15.5 5a3.5 3.5 0 0 1 0 7M17.5 14.5A6 6 0 0 1 21 20"/>',
  spark: '<path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  ball: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5c3 2.5 4 6 3 9.5M20.2 10c-3.5-1-7.3 0-9.7 2.7M7.3 19c-.6-3.8.9-7.3 4.2-9.5"/>',
  flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4.5-3.5-6.5-4.5-11-2 2-3 4.3-3 6.5-1-.8-1.7-2-1.8-3.2C7 9.5 6 12.3 6 15a6 6 0 0 0 6 6z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  lotus: '<path d="M12 19c-4 0-8-2-8.5-6 2.5-.5 5 .5 6.5 2M12 19c4 0 8-2 8.5-6-2.5-.5-5 .5-6.5 2M12 19c-2.5-2-3.5-4.5-3.5-7S10 6.5 12 5c2 1.5 3.5 4.5 3.5 7S14.5 17 12 19z"/>',
  scale: '<path d="M12 4v16M6 20h12M5 8h14M8 8l-3 6a3 3 0 0 0 6 0zM16 8l-3 6a3 3 0 0 0 6 0z"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  trend: '<path d="M3.5 17 9 11.5l3.5 3.5L20 7.5"/><path d="M15 7.5h5v5"/>',
  bank: '<path d="M3.5 9.5 12 4l8.5 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3.5 20.5h17"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 3h5M12 3v3"/>',
  play: '<rect x="3" y="5.5" width="18" height="13" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  skip: '<path d="m6 6 8 6-8 6zM17 6v12"/>',
  food: '<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M8 8c0-2 2-2 2-4M12 8c0-2 2-2 2-4M16 8c0-2 2-2 2-4"/>',
  scaleBody: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12z"/>',
  piggy: '<path d="M5 11.5c0-3 3-5.5 7-5.5 3 0 5.5 1.3 6.5 3.5h1.5v4h-1.5a6 6 0 0 1-2.5 3V19h-3v-1.5h-3V19H7v-2.5c-1.3-1.2-2-3-2-5z"/><circle cx="15.5" cy="10.5" r=".8" fill="currentColor"/>',
};

function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ---------- Ilustraciones de productos (40 × 40) ---------- */

const PRODUCT_ART = {
  cerave: `<rect x="17" y="3" width="6" height="4" rx="1" fill="#3A3A38"/><rect x="21" y="4" width="8" height="2.4" rx="1.2" fill="#3A3A38"/>
    <rect x="18.5" y="7" width="3" height="4" fill="#3A3A38"/><rect x="12" y="10" width="16" height="27" rx="4" fill="#FFFFFF" stroke="#D9D6CE"/>
    <rect x="12" y="20" width="16" height="9" fill="#2FA59C"/><rect x="15" y="14" width="10" height="2" rx="1" fill="#1D5E8C"/>
    <rect x="15" y="23" width="10" height="1.6" rx=".8" fill="#FFFFFF" opacity=".85"/>`,
  byphasse: `<rect x="15.5" y="3" width="9" height="7" rx="2" fill="#FFFFFF" stroke="#D9D6CE"/><path d="M14 12a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v23a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#BFE6B3"/>
    <rect x="14" y="19" width="12" height="11" fill="#FFFFFF" opacity=".9"/><path d="M20 21.5c2.6 1 3 4 0 6.5-3-2.5-2.6-5.5 0-6.5z" fill="#4FA34A"/>`,
  purito: `<path d="M11 4h18l-2.5 25h-13z" fill="#EFE9DC" stroke="#D9D6CE"/><rect x="13.2" y="10" width="13.6" height="9" fill="#A9BE8F"/>
    <rect x="16" y="13" width="8" height="1.6" rx=".8" fill="#FFFFFF"/><rect x="15.5" y="29" width="9" height="8" rx="2" fill="#6E7B5B"/>`,
  neutrogena: `<rect x="14" y="3" width="12" height="7" rx="2.5" fill="#F26A21"/><path d="M13 12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v22a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="#FFFFFF" stroke="#D9D6CE"/>
    <rect x="13" y="17" width="14" height="4" fill="#F26A21"/><rect x="16" y="25" width="8" height="1.6" rx=".8" fill="#2B4C8C"/><rect x="16" y="28.5" width="5" height="1.6" rx=".8" fill="#9A988F"/>`,
  tocobo: `<rect x="15" y="3" width="10" height="7" rx="2" fill="#FFFFFF" stroke="#D9D6CE"/><path d="M13 12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v23a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z" fill="#FFF3B0" stroke="#E8D67A"/>
    <path d="M13.6 22h12.8v13a2.4 2.4 0 0 1-2.4 2.4h-8a2.4 2.4 0 0 1-2.4-2.4z" fill="#FBE36B" opacity=".8"/><circle cx="20" cy="16.5" r="3.4" fill="#F4C21B"/><path d="M20 13.1v6.8M16.6 16.5h6.8" stroke="#FFF3B0" stroke-width=".9"/>
    <rect x="16" y="27" width="8" height="1.6" rx=".8" fill="#3A3A38" opacity=".7"/>`,
  skin1004: `<rect x="15.5" y="3" width="9" height="8" rx="2" fill="#5A9BD8"/><path d="M13 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v21a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="#EAF4FC" stroke="#C9DDEE"/>
    <rect x="13" y="16" width="14" height="2" fill="#5A9BD8"/><rect x="16" y="22" width="8" height="1.6" rx=".8" fill="#2E5C8A"/><rect x="16" y="25.5" width="6" height="1.6" rx=".8" fill="#7FB2E0"/>
    <path d="M20 29.5c1.9.8 2.2 3 0 4.8-2.2-1.8-1.9-4 0-4.8z" fill="#6BBF8E"/>`,
};

function productArt(id, cls = '') {
  if (!PRODUCT_ART[id]) return '';
  return `<span class="product-art ${cls}"><svg viewBox="0 0 40 40" aria-hidden="true">${PRODUCT_ART[id]}</svg></span>`;
}

/* ---------- Utilidades ---------- */

const $ = sel => document.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
const today = () => dateKey();
const monthKey = (key = today()) => key.slice(0, 7);

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function prettyDate(key) {
  const d = parseKey(key);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}
function prettyMonth(mk) {
  const [y, m] = mk.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

const numFmt = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = n => `${esc(S.settings.currency)} ${numFmt.format(Number(n) || 0)}`;
const pct = n => `${Math.round(n)}%`;

function progressBar(p, cls = '') {
  const v = Math.max(0, Math.min(100, p));
  return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${v}%"></i></div>`;
}

// Anillos de actividad: [{value 0..1, cls}]
function rings(list, size = 132) {
  const stroke = 11, gap = 3;
  const c = size / 2;
  return `<svg class="rings" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${list.map((r, i) => {
    const rad = c - stroke / 2 - i * (stroke + gap);
    const len = 2 * Math.PI * rad;
    const v = Math.max(0, Math.min(1, r.value));
    return `<circle class="track" cx="${c}" cy="${c}" r="${rad}" stroke-width="${stroke}"/>
      <circle class="ring ${r.cls}" cx="${c}" cy="${c}" r="${rad}" stroke-width="${stroke}"
        stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - v)}" transform="rotate(-90 ${c} ${c})"/>`;
  }).join('')}</svg>`;
}

function pageHead(eyebrow, title, right = '') {
  return `<header class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div>${right}</header>`;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- Modal ---------- */

let modalSubmit = null;

function openModal(title, body, onSubmit, submitLabel = 'Guardar') {
  const form = $('#modal-form');
  form.innerHTML = `
    <div class="modal-head"><h2>${esc(title)}</h2>
      <button type="button" class="icon-btn" data-action="close-modal" aria-label="Cerrar">${icon('x')}</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="close-modal">Cancelar</button>
      <button type="submit" class="btn primary">${esc(submitLabel)}</button>
    </div>`;
  modalSubmit = onSubmit;
  $('#modal').showModal();
  const first = form.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
  if (first && !('ontouchstart' in window)) first.focus();
}

function closeModal() {
  $('#modal').close();
  modalSubmit = null;
}

$('#modal-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!modalSubmit) return closeModal();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const keepOpen = modalSubmit(data) === false;
  if (!keepOpen) {
    closeModal();
    save();
    render();
  }
});

function confirmModal(text, onYes, yesLabel = 'Eliminar') {
  openModal('¿Seguro?', `<p>${esc(text)}</p>`, () => onYes(), yesLabel);
}

/* ---------- Navegación ---------- */

const VIEWS = {
  hoy: { render: viewHoy },
  metas: { render: viewMetas },
  finanzas: { render: viewFinanzas },
  ejercicio: { render: viewEjercicio },
  piel: { render: viewPiel },
  ajustes: { render: viewAjustes },
};
const TABS = [
  ['hoy', 'Hoy', 'home'],
  ['metas', 'Metas', 'target'],
  ['finanzas', 'Dinero', 'wallet'],
  ['ejercicio', 'Entreno', 'bolt'],
  ['piel', 'Piel', 'drop'],
];

function currentView() {
  const v = location.hash.replace('#', '');
  return VIEWS[v] ? v : 'hoy';
}

function render() {
  const v = currentView();
  $('#app').innerHTML = VIEWS[v].render();
  document.querySelectorAll('.tabbar button').forEach(b => {
    const on = b.dataset.view === v;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (v === 'finanzas' && ['calc', 'decidir'].includes(S.ui.finTab)) updateCalcs();
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

/* ---------- Skincare: lógica ---------- */

function skinDay(key) {
  if (!S.skin.log[key]) S.skin.log[key] = { am: [], pm: [] };
  return S.skin.log[key];
}
function skinDone(key, slot) {
  const log = S.skin.log[key];
  if (!log) return 0;
  return S.skin[slot].filter(s => log[slot].includes(s.id)).length;
}
function skinComplete(key) {
  return S.skin.am.length + S.skin.pm.length > 0 &&
    skinDone(key, 'am') === S.skin.am.length && skinDone(key, 'pm') === S.skin.pm.length;
}
function skinRatio(key) {
  const total = S.skin.am.length + S.skin.pm.length;
  return total ? (skinDone(key, 'am') + skinDone(key, 'pm')) / total : 0;
}
// Un día suma a la racha si completaste al menos una rutina (mañana o noche).
function skinActive(key) {
  return ['am', 'pm'].some(slot => S.skin[slot].length && skinDone(key, slot) === S.skin[slot].length);
}
function skinStreak() {
  let key = today();
  if (!skinActive(key)) key = addDays(key, -1); // el día de hoy aún no termina
  let n = 0;
  while (skinActive(key)) { n++; key = addDays(key, -1); }
  return n;
}
// Aplicaciones = rutinas completas + reaplicaciones de protector, desde el lunes.
function skinApplications(from = weekStart()) {
  let n = 0;
  for (let k = from; k <= today(); k = addDays(k, 1)) {
    ['am', 'pm'].forEach(slot => { if (S.skin[slot].length && skinDone(k, slot) === S.skin[slot].length) n++; });
    n += Math.max(0, (S.skin.sun[k] || []).length - 1);
  }
  return n;
}

/* Protector solar: cada aplicación guarda la hora. */
function sunToday() {
  return S.skin.sun[today()] || [];
}
function sunState() {
  const list = sunToday();
  if (!list.length) return { n: 0 };
  const last = list[list.length - 1];
  const next = last.t + SUN_REAPPLY_MIN * 60000;
  const dayOver = new Date().getHours() >= SUN_DAY_END;
  return { n: list.length, last, next, due: !dayOver && Date.now() >= next, dayOver };
}
function sunLog(product) {
  const k = today();
  S.skin.sun[k] = [...(S.skin.sun[k] || []), { t: Date.now(), p: product }];
  // Mantener ~3 meses
  const cutoff = addDays(k, -90);
  Object.keys(S.skin.sun).forEach(d => { if (d < cutoff) delete S.skin.sun[d]; });
}
function clock(t) {
  return new Date(t).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}
function sunCard() {
  const s = sunState();
  const left = s.n ? Math.max(0, Math.round((s.next - Date.now()) / 60000)) : 0;
  const status = !s.n ? 'Aún no te pusiste protector hoy.'
    : s.dayOver ? 'Ya bajó el sol: no hace falta reaplicar.'
    : s.due ? 'Te toca reaplicar ahora.'
    : new Date(s.next).getHours() >= SUN_DAY_END ? 'Estás cubierto hasta que baje el sol.'
    : `Próxima a las ${clock(s.next)} · faltan ${left >= 60 ? `${Math.floor(left / 60)} h ${left % 60} min` : `${left} min`}.`;
  const p = s.n && !s.dayOver ? Math.min(100, (1 - left / SUN_REAPPLY_MIN) * 100) : 0;
  return `<section class="card sun-card ${s.due ? 'is-due' : ''}">
    <div class="card-head">
      <div class="title-ic am">${icon('sun')}</div>
      <div class="grow"><p class="eyebrow">Protector solar · cada 2 h</p><h3>${s.n ? `${s.n} ${s.n === 1 ? 'aplicación' : 'aplicaciones'} hoy` : 'Protector'}</h3></div>
      ${s.n ? `<span class="pill ${s.due ? 'coral' : 'lime'}">${clock(s.last.t)}</span>` : ''}
    </div>
    <p class="${s.due ? 'due-text' : 'muted small'}" data-sun-status>${status}</p>
    ${s.n && !s.dayOver ? progressBar(p, s.due ? 'coral' : '') : ''}
    <div class="sun-btns">${SUN_PRODUCTS.map(id => `<button class="btn small" data-action="sun-apply" data-product="${id}">${productArt(id)}${s.n ? 'Reapliqué' : 'Me puse'} ${esc(PRODUCTS[id].brand)}</button>`).join('')}</div>
    ${s.n > 1 ? `<p class="micro">${sunToday().map(x => `${clock(x.t)} ${esc(PRODUCTS[x.p]?.brand || '')}`).join(' · ')}</p>` : ''}
    ${s.n ? `<button class="link-btn" data-action="sun-undo">${icon('x')}Deshacer la última</button>` : ''}
  </section>`;
}
function weekStart(key = today()) {
  const d = parseKey(key);
  const offset = (d.getDay() + 6) % 7; // semana de lunes a domingo
  return addDays(key, -offset);
}
function weeklyCount(id) {
  const start = weekStart();
  return S.skin.weeklyLog.filter(l => l.id === id && l.date >= start).length;
}

function skinChecklist(slot, detailed = false) {
  const key = today();
  const log = S.skin.log[key];
  const items = S.skin[slot];
  if (!items.length) return '<p class="muted">Sin pasos. Edita tu rutina.</p>';
  return `<ul class="checklist">${items.map((s, i) => {
    const on = log && log[slot].includes(s.id);
    return `<li><button class="check ${on ? 'on' : ''}" data-action="skin-toggle" data-slot="${slot}" data-id="${s.id}" aria-pressed="${on}">
      <span class="box">${icon('check')}</span>${s.product ? productArt(s.product) : `<span class="step-n">${String(i + 1).padStart(2, '0')}</span>`}
      <span class="label">${esc(s.text)}${detailed && s.note ? `<small>${esc(s.note)}</small>` : ''}</span></button></li>`;
  }).join('')}</ul>`;
}

function skinCard(slot, detailed = false) {
  const key = today();
  const done = skinDone(key, slot), total = S.skin[slot].length;
  const full = total && done === total;
  return `<section class="card ${full ? 'is-done' : ''}">
    <div class="card-head">
      <div class="title-ic ${slot}">${icon(slot === 'am' ? 'sun' : 'moon')}</div>
      <div class="grow"><p class="eyebrow">Skincare</p><h3>${slot === 'am' ? 'Mañana' : 'Noche'}</h3></div>
      <span class="pill ${full ? 'lime' : ''}">${done}/${total}</span>
    </div>
    ${skinChecklist(slot, detailed)}
  </section>`;
}

/* ---------- Ejercicio: lógica ---------- */

function lastSession() {
  return S.workout.sessions[S.workout.sessions.length - 1];
}
function nextWorkoutDay() {
  const last = [...S.workout.sessions].reverse().find(s => WORKOUT_ORDER.includes(s.day));
  if (!last) return WORKOUT_ORDER[0];
  return WORKOUT_ORDER[(WORKOUT_ORDER.indexOf(last.day) + 1) % WORKOUT_ORDER.length];
}
function sessionsAtLevel() {
  return S.workout.sessions.length - S.workout.levelStart;
}
function sessionsInLast(days) {
  const from = addDays(today(), -(days - 1));
  return S.workout.sessions.filter(s => s.date >= from).length;
}
function doneToday() {
  return S.workout.sessions.find(s => s.date === today());
}
const OPTIONAL_DAYS = ['Y', 'K'];
const OPTIONAL_ICON = { Y: 'lotus', K: 'music' };
function optionalToday(day) {
  return S.workout[WORKOUT_PLAN[day].log].includes(today());
}
function yogaToday() {
  return S.workout.yoga.includes(today());
}
function activeWorkoutDay() {
  return S.ui.workoutPick || nextWorkoutDay();
}
// Ejercicios marcados hoy en una sesión (se guardan por sesión para poder cambiar de pestaña).
function checkedToday(day) {
  const cur = S.workout.current;
  if (!cur || cur.date !== today() || !cur.done || Array.isArray(cur.done)) return [];
  return cur.done[day] || [];
}
function groupBlocks(exercises) {
  const groups = [];
  exercises.forEach((ex, i) => {
    let g = groups[groups.length - 1];
    if (!g || g.block !== ex.block) groups.push(g = { block: ex.block, items: [] });
    g.items.push({ ex, i });
  });
  return groups;
}

/* ---------- Metas: lógica ---------- */

function goalProgress(g) {
  if (g.done) return 100;
  if (g.milestones.length) return g.milestones.filter(m => m.done).length / g.milestones.length * 100;
  return Number(g.manual) || 0;
}
function goalArea(id) {
  return GOAL_AREAS.find(a => a.id === id) || GOAL_AREAS[0];
}
function deadlineText(g) {
  if (!g.deadline || g.done) return '';
  const d = daysBetween(today(), g.deadline);
  if (d < 0) return `<span class="tag warn">Vencida hace ${-d} d</span>`;
  if (d === 0) return '<span class="tag warn">Vence hoy</span>';
  if (d <= 30) return `<span class="tag">Faltan ${d} d</span>`;
  return `<span class="tag subtle">${esc(g.deadline.split('-').reverse().join('/'))}</span>`;
}
function goalsAverage() {
  const active = S.goals.filter(g => !g.done);
  return active.length ? active.reduce((a, g) => a + goalProgress(g), 0) / active.length : 0;
}

/* ---------- Finanzas: lógica ---------- */

function monthTx(mk) {
  return S.tx.filter(t => t.date.startsWith(mk));
}
function monthSummary(mk) {
  const list = monthTx(mk);
  const income = list.filter(t => t.type === 'in').reduce((a, t) => a + t.amount, 0);
  const expense = list.filter(t => t.type === 'out').reduce((a, t) => a + t.amount, 0);
  const byCat = {};
  list.filter(t => t.type === 'out').forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  return { income, expense, balance: income - expense, byCat, count: list.length };
}
function shiftMonth(mk, n) {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// Ingreso y gasto mensual promedio de los últimos 3 meses con movimientos.
function monthlyAverages() {
  const months = [...new Set(S.tx.map(t => monthKey(t.date)))].sort().slice(-3);
  if (!months.length) return null;
  let income = 0, expense = 0;
  months.forEach(mk => { const s = monthSummary(mk); income += s.income; expense += s.expense; });
  return { income: income / months.length, expense: expense / months.length, months: months.length };
}

/* ================= VISTAS ================= */

function viewHoy() {
  const key = today();
  const d = parseKey(key);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const name = S.settings.name ? `, <em>${esc(S.settings.name)}</em>` : '';

  const skin = skinRatio(key);
  const skinTotal = S.skin.am.length + S.skin.pm.length;
  const week = sessionsInLast(7);
  const goalsAvg = goalsAverage();
  const fin = monthSummary(monthKey());

  const activeGoals = S.goals.filter(g => !g.done)
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).slice(0, 3);

  const wDay = activeWorkoutDay();
  const plan = WORKOUT_PLAN[wDay];
  const wDone = doneToday();
  const tip = SKINCARE_TIPS[d.getDate() % SKINCARE_TIPS.length];
  const streak = skinStreak();

  return `
    ${pageHead(`${DAY_NAMES[d.getDay()]} · ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`, `${greet}${name}.`)}

    <section class="card hero">
      ${rings([
        { value: skin, cls: 'r1' },
        { value: week / SESSIONS_PER_WEEK, cls: 'r2' },
        { value: goalsAvg / 100, cls: 'r3' },
      ])}
      <ul class="legend-list">
        <li><i class="dot r1"></i><span>Piel</span><b>${skinDone(key, 'am') + skinDone(key, 'pm')}/${skinTotal}</b></li>
        <li><i class="dot r2"></i><span>Entreno</span><b>${week}/${SESSIONS_PER_WEEK} <small>sem.</small></b></li>
        <li><i class="dot r3"></i><span>Metas</span><b>${pct(goalsAvg)}</b></li>
        <li class="streak">${icon('flame')}<span>${streak} ${streak === 1 ? 'día' : 'días'} de racha</span></li>
      </ul>
    </section>

    <p class="section-label">Ahora</p>
    ${hour < 15 ? skinCard('am') + (sunToday().length ? sunCard() : '') + skinCard('pm') : (hour < SUN_DAY_END && sunToday().length ? sunCard() : '') + skinCard('pm') + skinCard('am')}

    <a class="card session-card ${wDone ? 'is-done' : ''}" href="#ejercicio">
      <div class="session-letter">${wDone ? icon('check') : wDay}</div>
      <div class="grow">
        <p class="eyebrow">${wDone ? 'Entreno de hoy completado' : `Entreno · ${plan.minutes} min`}</p>
        <h3>${esc(wDone ? WORKOUT_PLAN[wDone.day].name : plan.name)}</h3>
        <p class="muted small">${wDone ? 'Recupérate: descanso, yoga o vóley.' : esc(plan.focus)}</p>
      </div>
      ${icon('arrow', 'go')}
    </a>

    <p class="section-label">Metas en curso <a href="#metas">Ver todas</a></p>
    <section class="card">
      ${activeGoals.length ? activeGoals.map(g => `
        <div class="mini-goal">
          <div class="row"><span class="with-ic">${icon(goalArea(g.area).icon)}${esc(g.title)}</span><b>${pct(goalProgress(g))}</b></div>
          ${progressBar(goalProgress(g))}
        </div>`).join('') : `<div class="empty-inline"><p>Aún no tienes metas.</p><a class="btn small" href="#metas">${icon('plus')}Crear la primera</a></div>`}
    </section>

    <p class="section-label">Dinero · ${esc(MONTH_NAMES[d.getMonth()])} <a href="#finanzas">Detalle</a></p>
    <section class="card">
      <div class="figures">
        <div><span>Ingresos</span><b class="pos">${money(fin.income)}</b></div>
        <div><span>Gastos</span><b class="neg">${money(fin.expense)}</b></div>
        <div><span>Te queda</span><b>${money(fin.balance)}</b></div>
      </div>
      <div class="btn-row">
        <button class="btn" data-action="tx-add" data-type="out">${icon('minus')}Gasto</button>
        <button class="btn" data-action="tx-add" data-type="in">${icon('plus')}Ingreso</button>
      </div>
    </section>

    <section class="card quote"><p class="eyebrow">Consejo del día</p><p>${esc(tip)}</p></section>
  `;
}

/* ----- Metas ----- */

function goalCard(g) {
  const p = goalProgress(g);
  const area = goalArea(g.area);
  return `
    <article class="card goal ${g.done ? 'is-done' : ''}">
      <div class="card-head">
        <div class="title-ic">${icon(area.icon)}</div>
        <div class="grow">${g.done ? `<p class="eyebrow">${esc(area.name)}</p>` : ''}<h3>${esc(g.title)}</h3></div>
        <span class="big-num">${Math.round(p)}<small>%</small></span>
      </div>
      ${progressBar(p, g.done ? 'lime' : '')}
      <div class="tags">${deadlineText(g)}${g.done ? '<span class="tag lime">Lograda</span>' : ''}</div>
      ${g.why ? `<p class="why">${esc(g.why)}</p>` : ''}
      ${g.milestones.length ? `<ul class="checklist">${g.milestones.map(m => `
        <li><button class="check ${m.done ? 'on' : ''}" data-action="ms-toggle" data-goal="${g.id}" data-id="${m.id}" aria-pressed="${m.done}">
          <span class="box">${icon('check')}</span><span class="label">${esc(m.text)}</span></button></li>`).join('')}</ul>` : ''}
      <div class="actions">
        ${g.done ? '' : `<button class="btn small" data-action="ms-add" data-goal="${g.id}">${icon('plus')}Paso</button>`}
        <button class="btn small" data-action="goal-done" data-goal="${g.id}">${g.done ? 'Reabrir' : `${icon('check')}Lograda`}</button>
        <span class="grow"></span>
        <button class="icon-btn" data-action="goal-edit" data-goal="${g.id}" aria-label="Editar meta">${icon('edit')}</button>
        <button class="icon-btn" data-action="goal-del" data-goal="${g.id}" aria-label="Eliminar meta">${icon('trash')}</button>
      </div>
    </article>`;
}

function viewMetas() {
  const active = S.goals.filter(g => !g.done);
  const done = S.goals.filter(g => g.done);
  const overall = goalsAverage();
  const byArea = GOAL_AREAS.map(a => ({ area: a, goals: active.filter(g => g.area === a.id) }))
    .filter(x => x.goals.length);

  return `
    ${pageHead('Proyecto de vida', 'Metas y proyectos', `<button class="fab" data-action="goal-add" aria-label="Nueva meta">${icon('plus')}</button>`)}

    ${S.goals.length ? `<section class="card dark stat-strip">
      <div><span>Activas</span><b>${active.length}</b></div>
      <div><span>Logradas</span><b>${done.length}</b></div>
      <div><span>Avance medio</span><b>${pct(overall)}</b></div>
    </section>` : ''}

    ${byArea.map(x => `<p class="section-label">${esc(x.area.name)}</p>${x.goals.map(goalCard).join('')}`).join('')}

    ${!S.goals.length ? `<section class="empty">
      <div class="empty-ic">${icon('target')}</div>
      <h3>¿Qué quieres lograr este año?</h3>
      <p class="muted">Divide cada meta en pasos pequeños. Marcar pasos es lo que mueve tu avance.</p>
      <p class="muted small">Ideas: ahorrar para un viaje, jugar vóley 2 veces por semana, terminar un curso, leer 12 libros.</p>
      <button class="btn primary" data-action="goal-add">${icon('plus')}Nueva meta</button>
    </section>` : ''}

    ${done.length ? `<details class="done-list"><summary>Metas logradas (${done.length})</summary>${done.map(goalCard).join('')}</details>` : ''}
  `;
}

function goalForm(g = {}) {
  return `
    <label>Meta o proyecto<input name="title" required maxlength="120" value="${esc(g.title)}" placeholder="Ej: Ahorrar para una moto"></label>
    <label>Área<select name="area">${GOAL_AREAS.map(a => `<option value="${a.id}" ${g.area === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
    <label>Fecha límite (opcional)<input type="date" name="deadline" value="${esc(g.deadline)}"></label>
    <label>¿Por qué es importante para ti?<textarea name="why" rows="2" placeholder="Tu motivación">${esc(g.why)}</textarea></label>
    ${g.id ? `<label>Avance manual (solo si no tiene pasos): <output id="manual-out">${Number(g.manual) || 0}%</output>
      <input type="range" name="manual" min="0" max="100" step="5" value="${Number(g.manual) || 0}" oninput="document.getElementById('manual-out').value=this.value+'%'"></label>`
      : `<label>Pasos (uno por línea)<textarea name="steps" rows="4" placeholder="Abrir cuenta de ahorro&#10;Ahorrar Bs 500 al mes&#10;Comparar precios"></textarea></label>`}
  `;
}

/* ----- Finanzas ----- */

function viewFinanzas() {
  const tabs = [['resumen', 'Resumen'], ['movs', 'Movimientos'], ['calc', 'Intereses'], ['decidir', 'Decidir']];
  const content = { resumen: finResumen, movs: finMovs, calc: finCalc, decidir: finDecidir }[S.ui.finTab] || finResumen;
  return `
    ${pageHead('Finanzas', 'Tu dinero')}
    <div class="segmented" role="tablist">${tabs.map(([id, label]) =>
      `<button role="tab" aria-selected="${S.ui.finTab === id}" class="${S.ui.finTab === id ? 'active' : ''}" data-action="fin-tab" data-tab="${id}">${label}</button>`).join('')}</div>
    ${content()}`;
}

function finMonthNav() {
  const mk = S.ui.finMonth || monthKey();
  return `<div class="month-nav">
      <button class="icon-btn" data-action="fin-month" data-step="-1" aria-label="Mes anterior">${icon('chevL')}</button>
      <b>${esc(prettyMonth(mk))}</b>
      <button class="icon-btn" data-action="fin-month" data-step="1" aria-label="Mes siguiente" ${mk >= monthKey() ? 'disabled' : ''}>${icon('chevR')}</button>
    </div>`;
}

// ¿Ya registraste este ingreso fijo en el mes mk?
function fixedPaid(f, mk) {
  return S.tx.some(t => t.fixedId === f.id && t.date.startsWith(mk));
}
function fixedLeft(f) {
  return f.total ? Math.max(0, f.total - (f.received || 0)) : null;
}
function fixedActive() {
  return S.fixedIncome.filter(f => fixedLeft(f) !== 0);
}

function fixedIncomeCard(mk) {
  if (!S.fixedIncome.length) return `<section class="card"><p class="muted">Agrega tu sueldo o pagos que recibes cada mes para registrarlos con un toque.</p></section>`;
  return S.fixedIncome.map(f => {
    const left = fixedLeft(f);
    const paid = fixedPaid(f, mk);
    const done = left === 0;
    const p = f.total ? (f.received || 0) / f.total * 100 : 0;
    const cuotas = left ? Math.ceil(left / f.amount) : 0;
    return `<section class="card fixed ${done ? 'is-done' : ''}">
      <div class="card-head"><div class="title-ic">${icon(f.total ? 'calendar' : 'wallet')}</div>
        <div class="grow"><h3>${esc(f.name)}</h3>
          <p class="muted small">${money(f.amount)} al mes${f.total ? ` · ${money(f.received || 0)} de ${money(f.total)}` : ''}</p></div>
        ${f.total ? `<span class="big-num">${Math.round(p)}<small>%</small></span>` : ''}</div>
      ${f.total ? progressBar(p, done ? 'lime' : '') + `<p class="micro">${done ? 'Ya cobraste todo.' : `Faltan ${money(left)}: ${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'} más.`}</p>` : ''}
      <div class="actions">
        ${done ? '' : paid
          ? `<span class="paid-tag">${icon('check')}Cobrado este mes</span>`
          : `<button class="btn small primary" data-action="fixed-pay" data-id="${f.id}">${icon('plus')}Registrar cobro</button>`}
        <span class="grow"></span>
        <button class="icon-btn" data-action="fixed-edit" data-id="${f.id}" aria-label="Editar">${icon('edit')}</button>
      </div></section>`;
  }).join('');
}

// Reparto sugerido: vive con su familia y no paga casa, así que el ahorro puede ser alto.
function splitCard() {
  const base = fixedActive().reduce((a, f) => a + f.amount, 0);
  if (!base) return `<section class="card quote"><p class="eyebrow">Regla 50/30/20</p><p>50 % necesidades, 30 % gustos y 20 % ahorro e inversión. Es una guía: ajústala a tu realidad.</p></section>`;
  const parts = [
    { name: 'Ahorro', share: 0.40, note: 'Apenas cobras. Primero un fondo de emergencia, luego a generar intereses.', cls: 'lime' },
    { name: 'Necesidades', share: 0.30, note: 'Transporte, la U, celular, comida fuera.', cls: '' },
    { name: 'Gustos', share: 0.30, note: 'Salidas, ropa, vóley. Sin culpa, pero con tope.', cls: 'coral' },
  ];
  return `<section class="card">
    <p class="eyebrow">Tu reparto sugerido · ${money(base)} al mes</p>
    ${parts.map(x => `<div class="cat-row"><div class="row"><span>${x.name} <span class="muted">${pct(x.share * 100)}</span></span><b>${money(Math.round(base * x.share))}</b></div>${progressBar(x.share * 100, x.cls)}<p class="micro">${x.note}</p></div>`).join('')}
    <p class="muted small">Como vives con tu familia y no pagas casa, puedes ahorrar más que el 20 % típico. Cuando termine el pago pendiente, el reparto se recalcula solo.</p>
  </section>`;
}

function finResumen() {
  const mk = S.ui.finMonth || monthKey();
  const s = monthSummary(mk);
  const rate = s.income > 0 ? (s.balance / s.income) * 100 : 0;
  const cats = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  let advice = '';
  if (s.count === 0) advice = 'Registra tus ingresos y gastos del mes para ver en qué se va tu dinero.';
  else if (s.income === 0) advice = 'Registra también tus ingresos para calcular cuánto estás ahorrando.';
  else if (rate < 0) advice = 'Este mes gastas más de lo que ganas. Revisa las categorías más altas y recorta una.';
  else if (rate < 10) advice = 'Ahorras menos del 10 %. Separa el ahorro apenas recibes tu ingreso, no lo que sobre.';
  else if (rate < 20) advice = 'Vas bien. Si llegas al 20 % de ahorro, tu fondo de emergencia crecerá mucho más rápido.';
  else advice = 'Excelente: ahorras más del 20 %. Considera poner una parte a generar intereses.';

  return `
    ${finMonthNav()}
    <section class="card dark balance">
      <p class="eyebrow">Balance del mes</p>
      <p class="display-num">${money(s.balance)}</p>
      <div class="figures on-dark">
        <div><span>Ingresos</span><b>${money(s.income)}</b></div>
        <div><span>Gastos</span><b>${money(s.expense)}</b></div>
        <div><span>Ahorro</span><b>${s.income > 0 ? pct(rate) : '—'}</b></div>
      </div>
      ${s.income > 0 ? progressBar(Math.max(0, rate * 5), 'lime') + '<p class="micro">La barra se llena al llegar a 20 % de ahorro.</p>' : ''}
    </section>
    <div class="btn-row">
      <button class="btn" data-action="tx-add" data-type="out">${icon('minus')}Gasto</button>
      <button class="btn primary" data-action="tx-add" data-type="in">${icon('plus')}Ingreso</button>
    </div>
    <p class="note">${advice}</p>

    ${cats.length ? `<p class="section-label">¿En qué se va?</p><section class="card">
      ${cats.map(([c, v]) => `<div class="cat-row"><div class="row"><span>${esc(c)}</span><span>${money(v)} <span class="muted">${pct(v / s.expense * 100)}</span></span></div>${progressBar(v / max * 100, 'coral')}</div>`).join('')}
    </section>` : ''}

    <p class="section-label">Ingresos fijos <button class="link-btn" data-action="fixed-edit">${icon('plus')}Nuevo</button></p>
    ${fixedIncomeCard(mk)}

    <p class="section-label">Metas de ahorro <button class="link-btn" data-action="sav-add">${icon('plus')}Nueva</button></p>
    ${S.savings.length ? S.savings.map(sv => {
      const p = sv.target ? sv.saved / sv.target * 100 : 0;
      return `<section class="card saving">
        <div class="card-head"><div class="title-ic">${icon('piggy')}</div>
          <div class="grow"><h3>${esc(sv.name)}</h3><p class="muted small">${money(sv.saved)} de ${money(sv.target)}</p></div>
          <span class="big-num">${Math.round(p)}<small>%</small></span></div>
        ${progressBar(p, p >= 100 ? 'lime' : '')}
        <div class="actions">
          <button class="btn small" data-action="sav-move" data-id="${sv.id}" data-dir="1">${icon('plus')}Aportar</button>
          <button class="btn small" data-action="sav-move" data-id="${sv.id}" data-dir="-1">${icon('minus')}Retirar</button>
          <span class="grow"></span>
          <button class="icon-btn" data-action="sav-del" data-id="${sv.id}" aria-label="Eliminar">${icon('trash')}</button>
        </div></section>`;
    }).join('') : '<section class="card"><p class="muted">Ej: fondo de emergencia (3 meses de gastos), un viaje, una laptop.</p></section>'}

    ${splitCard()}
  `;
}

function finMovs() {
  const mk = S.ui.finMonth || monthKey();
  const list = monthTx(mk).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const groups = {};
  list.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  return `
    ${finMonthNav()}
    <div class="btn-row">
      <button class="btn" data-action="tx-add" data-type="out">${icon('minus')}Gasto</button>
      <button class="btn primary" data-action="tx-add" data-type="in">${icon('plus')}Ingreso</button>
    </div>
    ${list.length ? Object.entries(groups).map(([d, items]) => `
      <p class="section-label cap">${esc(prettyDate(d))}</p>
      <section class="card list">${items.map(t => `
        <div class="tx">
          <div class="tx-ic ${t.type}">${icon(t.type === 'in' ? 'plus' : 'minus')}</div>
          <div class="grow"><b>${esc(t.category)}</b>${t.note ? `<span class="muted small">${esc(t.note)}</span>` : ''}</div>
          <b class="${t.type === 'in' ? 'pos' : ''}">${t.type === 'in' ? '+' : '−'}${money(t.amount)}</b>
          <button class="icon-btn subtle" data-action="tx-del" data-id="${t.id}" aria-label="Eliminar movimiento">${icon('x')}</button>
        </div>`).join('')}</section>`).join('')
      : `<section class="empty"><div class="empty-ic">${icon('wallet')}</div><p class="muted">Sin movimientos este mes.</p></section>`}
  `;
}

function finCalc() {
  return `
    <section class="card calc" data-calc="compound">
      <div class="card-head"><div class="title-ic">${icon('trend')}</div>
        <div class="grow"><h3>¿Cuánto crece mi ahorro?</h3><p class="muted small">Interés compuesto: tus intereses también generan intereses.</p></div></div>
      <div class="grid2">
        <label>Monto inicial<input type="number" inputmode="decimal" min="0" name="p" value="1000"></label>
        <label>Aporte mensual<input type="number" inputmode="decimal" min="0" name="m" value="200"></label>
        <label>Tasa anual %<input type="number" inputmode="decimal" min="0" step="0.1" name="r" value="6"></label>
        <label>Años<input type="number" inputmode="numeric" min="1" max="50" name="y" value="5"></label>
      </div>
      <div class="result" id="res-compound"></div>
    </section>

    <section class="card calc" data-calc="loan">
      <div class="card-head"><div class="title-ic">${icon('bank')}</div>
        <div class="grow"><h3>¿Cuánto pagaré por un préstamo?</h3><p class="muted small">También sirve para compras a cuotas.</p></div></div>
      <div class="grid2">
        <label>Monto<input type="number" inputmode="decimal" min="0" name="a" value="5000"></label>
        <label>Tasa anual %<input type="number" inputmode="decimal" min="0" step="0.1" name="r" value="18"></label>
        <label>Plazo (meses)<input type="number" inputmode="numeric" min="1" name="n" value="12"></label>
      </div>
      <div class="result" id="res-loan"></div>
    </section>

    <section class="card quote"><p class="eyebrow">Recuerda</p><p>El interés compuesto trabaja a tu favor cuando ahorras y en tu contra cuando te endeudas. Compara siempre la tasa anual entre bancos.</p></section>
  `;
}

function updateCalcs() {
  const c = document.querySelector('[data-calc="compound"]');
  if (c) {
    const v = n => Math.max(0, Number(c.querySelector(`[name=${n}]`).value) || 0);
    const p = v('p'), m = v('m'), r = v('r') / 100 / 12, months = Math.round(v('y') * 12);
    let total = p;
    for (let i = 0; i < months; i++) total = total * (1 + r) + m;
    const put = p + m * months;
    $('#res-compound').innerHTML = `
      <p class="eyebrow">Tendrás</p><p class="display-num pos">${money(total)}</p>
      <div class="row"><span>Pusiste de tu bolsillo</span><span>${money(put)}</span></div>
      <div class="row"><span>Ganado en intereses</span><b class="pos">${money(total - put)}</b></div>`;
  }
  const l = document.querySelector('[data-calc="loan"]');
  if (l) {
    const v = n => Math.max(0, Number(l.querySelector(`[name=${n}]`).value) || 0);
    const a = v('a'), r = v('r') / 100 / 12, n = Math.max(1, Math.round(v('n')));
    const pay = r === 0 ? a / n : a * r / (1 - Math.pow(1 + r, -n));
    const total = pay * n;
    const avg = monthlyAverages();
    let note = '';
    if (avg && avg.income > 0) {
      const share = pay / avg.income * 100;
      note = `<p class="note">La cuota sería el <b>${pct(share)}</b> de tu ingreso mensual promedio. ${share > 30
        ? 'Más del 30 % es arriesgado: busca un plazo mayor, un monto menor o ahorra primero.'
        : share > 15 ? 'Es manejable, pero cuida no sumar otras deudas.' : 'Es una cuota cómoda para tus ingresos.'}</p>`;
    }
    $('#res-loan').innerHTML = `
      <p class="eyebrow">Cuota mensual</p><p class="display-num">${money(pay)}</p>
      <div class="row"><span>Pagarás en total</span><span>${money(total)}</span></div>
      <div class="row"><span>De eso, intereses</span><b class="neg">${money(total - a)}</b></div>${note}`;
  }
  const b = document.querySelector('[data-calc="buy"]');
  if (b) updateBuy(b);
}

let buyDraft = {};

function finDecidir() {
  const bv = n => esc(buyDraft[n] ?? '');
  const bc = n => (buyDraft[n] ? 'checked' : '');
  const qs = [
    ['q1', 'Lo necesito (no solo lo quiero)'],
    ['q2', 'Lo voy a usar al menos 1 vez por semana'],
    ['q3', 'Lo puedo pagar sin endeudarme'],
    ['q4', 'Lo quería desde hace más de una semana'],
    ['q5', 'Comparé precios en al menos 2 lugares'],
  ];
  return `
    <section class="card calc" data-calc="buy">
      <div class="card-head"><div class="title-ic">${icon('bag')}</div>
        <div class="grow"><h3>¿Me lo compro?</h3><p class="muted small">Responde con honestidad.</p></div></div>
      <div class="grid2">
        <label>¿Qué es?<input name="what" value="${bv('what')}" placeholder="Zapatillas de vóley" maxlength="80"></label>
        <label>Precio<input type="number" inputmode="decimal" min="0" name="price" value="${bv('price')}" placeholder="0"></label>
      </div>
      <div class="toggles">${qs.map(([q, t]) => `<label class="toggle"><input type="checkbox" name="${q}" ${bc(q)}><span class="sw"></span><span>${t}</span></label>`).join('')}</div>
      <div class="result" id="res-buy"></div>
    </section>

    <p class="section-label">Comparar opciones <button class="link-btn" data-action="dec-add">${icon('plus')}Nueva</button></p>
    ${S.decisions.length ? '' : `<section class="card"><div class="card-head"><div class="title-ic">${icon('scale')}</div><p class="muted small grow">Para decisiones grandes: pon tus opciones y lo que te importa, califica, y la app calcula cuál conviene más.</p></div></section>`}
    ${S.decisions.slice().reverse().map(decisionCard).join('')}
  `;
}

function updateBuy(b) {
  const price = Number(b.querySelector('[name=price]').value) || 0;
  const what = b.querySelector('[name=what]').value.trim() || 'esto';
  const yes = ['q1', 'q2', 'q3', 'q4', 'q5'].filter(q => b.querySelector(`[name=${q}]`).checked).length;
  const out = $('#res-buy');
  if (!price) { out.innerHTML = '<p class="muted small">Pon el precio para ver el análisis.</p>'; return; }

  const avg = monthlyAverages();
  const free = avg ? avg.income - avg.expense : null;
  const lines = [];
  let score = yes; // 0..5
  if (avg && avg.income > 0) {
    const days = price / (avg.income / 30);
    lines.push(`Equivale a <b>${days < 1 ? 'menos de 1 día' : `${Math.round(days)} días`}</b> de tus ingresos.`);
  }
  if (free !== null) {
    if (free <= 0) { lines.push('Últimamente gastas todo lo que ganas.'); score -= 2; }
    else {
      const share = price / free * 100;
      lines.push(`Es el <b>${pct(share)}</b> de lo que te sobra al mes (${money(free)}).`);
      if (share > 100) score -= 2;
      else if (share > 50) score -= 1;
    }
  } else {
    lines.push('<span class="muted">Registra tus ingresos y gastos para un análisis con tus números reales.</span>');
  }
  if (b.querySelector('[name=q2]').checked) lines.push(`Usándolo cada semana por un año, cuesta ${money(price / 52)} por uso.`);

  let verdict;
  if (!b.querySelector('[name=q3]').checked) verdict = `<div class="verdict no"><b>No lo compres ahora.</b> Si te endeudarías por ${esc(what)}, primero crea una meta de ahorro.</div>`;
  else if (score >= 4) verdict = '<div class="verdict yes"><b>Buena compra.</b> Adelante.</div>';
  else if (score >= 2) verdict = '<div class="verdict wait"><b>Espera 48 horas.</b> Si después lo sigues queriendo igual, cómpralo.</div>';
  else verdict = '<div class="verdict no"><b>Mejor no por ahora.</b> Ese dinero puede ir a una de tus metas.</div>';

  out.innerHTML = `${verdict}<ul class="facts">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
}

function decisionScores(d) {
  const totalW = d.criteria.reduce((a, c) => a + c.weight, 0) || 1;
  return d.options.map((_, oi) => d.criteria.reduce((a, c, ci) => a + c.weight * (d.scores[oi]?.[ci] || 0), 0) / totalW);
}

function decisionCard(d) {
  const scores = decisionScores(d);
  const best = Math.max(...scores);
  const filled = d.scores.some(r => r.some(Boolean));
  return `
    <article class="card decision">
      <div class="card-head"><div class="title-ic">${icon('scale')}</div><h3 class="grow">${esc(d.question)}</h3>
        <button class="icon-btn" data-action="dec-del" data-id="${d.id}" aria-label="Eliminar decisión">${icon('trash')}</button></div>
      <p class="muted small">Califica cada opción del 1 (mal) al 5 (excelente).</p>
      <div class="matrix-wrap"><table class="matrix">
        <thead><tr><th>Criterio</th>${d.options.map(o => `<th>${esc(o)}</th>`).join('')}</tr></thead>
        <tbody>${d.criteria.map((c, ci) => `<tr><td>${esc(c.name)} <span class="muted">×${c.weight}</span></td>
          ${d.options.map((_, oi) => `<td><select data-change="dec-score" data-id="${d.id}" data-o="${oi}" data-c="${ci}" aria-label="${esc(c.name)}">
            <option value="0">–</option>${[1, 2, 3, 4, 5].map(v => `<option ${d.scores[oi]?.[ci] === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select></td>`).join('')}</tr>`).join('')}</tbody>
        <tfoot><tr><td>Puntaje</td>${scores.map(s => `<td class="${filled && s === best ? 'winner' : ''}">${s.toFixed(1)}</td>`).join('')}</tr></tfoot>
      </table></div>
      ${filled ? `<p class="note">Según lo que más te importa, gana <b>${esc(d.options[scores.indexOf(best)])}</b>. Si tu intuición dice otra cosa, quizá falte un criterio.</p>` : ''}
    </article>`;
}

/* ----- Ejercicio ----- */

function viewEjercicio() {
  const tab = ['plan', 'comida', 'guia'].includes(S.ui.workoutTab) ? S.ui.workoutTab : 'plan';
  const titles = { plan: 'Tu plan', comida: 'Alimentación', guia: 'La ciencia detrás' };
  return `
    ${pageHead('Esculpido · vóley', titles[tab])}
    <div class="segmented">
      ${[['plan', 'Entreno'], ['comida', 'Alimentación'], ['guia', 'Guía']].map(([id, l]) =>
        `<button class="${tab === id ? 'active' : ''}" data-action="workout-tab" data-tab="${id}">${l}</button>`).join('')}
    </div>
    ${tab === 'guia' ? workoutGuide() : tab === 'comida' ? nutritionView() : workoutPlan()}`;
}

/* ----- Alimentación ----- */

function nutritionPlan(p) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5); // Mifflin-St Jeor
  const act = ACTIVITY_LEVELS.find(a => a.id === p.activity) || ACTIVITY_LEVELS[1];
  const goal = NUTRITION_GOALS.find(g => g.id === p.goal) || NUTRITION_GOALS[2];
  const tdee = bmr * act.factor;
  const kcal = Math.round(tdee * (1 + goal.kcal) / 10) * 10;
  const protein = Math.round(p.weight * goal.protein);
  const fat = Math.round(kcal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const bmi = p.weight / Math.pow(p.height / 100, 2);
  const water = Math.round(p.weight * 35 / 100) / 10; // litros, sin contar el entreno
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, fat, carbs, bmi, water, goal, act };
}

function nutritionForm(p = {}) {
  const sel = (v, x) => (v === x ? 'selected' : '');
  return `
    <div class="grid2">
      <label>Peso (kg)<input type="number" inputmode="decimal" name="weight" min="30" max="250" step="0.1" required value="${esc(p.weight)}"></label>
      <label>Estatura (cm)<input type="number" inputmode="numeric" name="height" min="120" max="230" required value="${esc(p.height)}"></label>
      <label>Edad<input type="number" inputmode="numeric" name="age" min="14" max="90" required value="${esc(p.age)}"></label>
      <label>Sexo<select name="sex"><option value="m" ${sel(p.sex, 'm')}>Hombre</option><option value="f" ${sel(p.sex, 'f')}>Mujer</option></select></label>
    </div>
    <label>Objetivo<select name="goal">${NUTRITION_GOALS.map(g => `<option value="${g.id}" ${sel(p.goal, g.id)}>${g.name}</option>`).join('')}</select></label>
    <label>Actividad<select name="activity">${ACTIVITY_LEVELS.map(a => `<option value="${a.id}" ${sel(p.activity || 'media', a.id)}>${a.name}</option>`).join('')}</select></label>
    <label>Comidas al día<select name="meals">${[3, 4, 5].map(n => `<option ${String(p.meals || 4) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Alergias o lo que no comes (opcional)<input name="avoid" maxlength="80" value="${esc(p.avoid)}" placeholder="Ej: lácteos, mariscos"></label>`;
}

function nutritionView() {
  const p = S.nutrition.profile;
  if (!p) {
    return `<section class="empty">
      <div class="empty-ic">${icon('food')}</div>
      <h3>Tu plan de alimentación</h3>
      <p class="muted">Con tu peso, estatura, edad y objetivo calculo tus calorías, proteína y porciones por comida.</p>
      <button class="btn primary" data-action="nutri-edit">${icon('edit')}Completar mis datos</button>
    </section>`;
  }
  const n = nutritionPlan(p);
  const split = MEAL_SPLITS[p.meals] || MEAL_SPLITS[4];
  const kP = n.protein * 4, kC = n.carbs * 4, kF = n.fat * 9;
  // Porciones con la mano: palma ≈ 25 g proteína, puñado ≈ 25 g carbohidrato, pulgar ≈ 8 g grasa.
  const hand = (g, per) => Math.max(0.5, Math.round(g / per * 2) / 2);
  const fmt = v => String(v).replace('.', ',');
  return `
    <section class="card dark">
      <p class="eyebrow">${esc(n.goal.name)} · ${String(p.weight).replace('.', ',')} kg · ${p.height} cm · ${p.age} años</p>
      <p class="display-num">${n.kcal.toLocaleString('es-BO')}<small>kcal al día</small></p>
      <div class="macro-bar"><i class="p" style="flex:${kP}"></i><i class="c" style="flex:${kC}"></i><i class="f" style="flex:${kF}"></i></div>
      <div class="figures on-dark">
        <div><span><i class="dot mp"></i>Proteína</span><b>${n.protein} g</b></div>
        <div><span><i class="dot mc"></i>Carbohidratos</span><b>${n.carbs} g</b></div>
        <div><span><i class="dot mf"></i>Grasas</span><b>${n.fat} g</b></div>
      </div>
      <p class="micro">${esc(n.goal.note)}</p>
    </section>

    <div class="figures card">
      <div><span>Agua</span><b>${fmt(n.water)} L</b></div>
      <div><span>Mantenimiento</span><b>${n.tdee.toLocaleString('es-BO')}</b></div>
      <div><span>IMC</span><b>${fmt(n.bmi.toFixed(1))}</b></div>
    </div>
    <p class="note">Suma 0,5–0,75 L de agua por cada hora de entreno o vóley. El IMC es solo una referencia: no distingue músculo de grasa.</p>
    ${p.goal === 'grasa' && n.bmi < 21 ? `<p class="note warn-note">Tu IMC ya es bajo. Para definir sin perder rendimiento ni músculo conviene más <b>Rendir y definir</b> que un déficit de calorías.</p>` : ''}

    <p class="section-label">Tu día, comida por comida</p>
    <p class="micro hand-legend">Porciones con tu mano: <b>palma</b> = proteína · <b>puñado</b> = carbohidrato · <b>pulgar</b> = grasa · más 1–2 puños de verduras.</p>
    ${split.map(([meal, share]) => {
      const ideas = MEAL_IDEAS[meal] || [];
      return `<section class="card meal">
        <div class="card-head"><h3 class="grow">${meal}</h3><span class="pill">${Math.round(n.kcal * share)} kcal</span></div>
        <div class="portions">
          <span><b>${fmt(hand(n.protein * share, 25))}</b> palma</span>
          <span><b>${fmt(hand(n.carbs * share, 25))}</b> puñado</span>
          <span><b>${fmt(hand(n.fat * share, 8))}</b> pulgar</span>
        </div>
        <ul class="dash">${ideas.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </section>`;
    }).join('')}
    ${p.avoid ? `<p class="note">Evita: <b>${esc(p.avoid)}</b>. Cambia esos alimentos por otros del mismo grupo.</p>` : ''}

    ${['grasa', 'recomp'].includes(p.goal) ? `<p class="section-label">Sobre la grasa de la cara</p>
    <section class="card"><ul class="dash">${FACE_FAT_NOTES.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}

    <p class="section-label">Alrededor del vóley y el entreno</p>
    <section class="card"><ul class="dash">
      <li>1–3 h antes: comida con carbohidrato y algo de proteína (arroz con pollo, pan con huevo, avena con plátano).</li>
      <li>Después: 20–40 g de proteína en las 2 horas siguientes (un vaso de leche + 2 huevos, o una palma de pollo).</li>
      <li>Si juegas más de 1 hora con calor, bebe agua durante el partido y come algo con sal después.</li>
    </ul></section>

    <button class="btn block" data-action="nutri-edit">${icon('edit')}Actualizar mis datos</button>
    <p class="micro">Guía general calculada con la ecuación de Mifflin-St Jeor y las recomendaciones de proteína de la ISSN. Revisa tu peso cada 2 semanas y ajusta ±150 kcal si no avanzas. Si tienes alguna condición de salud, consulta a un nutricionista.</p>
  `;
}

function workoutPlan() {
  const W = S.workout;
  const level = W.level;
  const atLevel = sessionsAtLevel();
  const weekNum = Math.min(4, Math.floor(atLevel / SESSIONS_PER_WEEK) + 1);
  const day = activeWorkoutDay();
  const plan = WORKOUT_PLAN[day];
  const checked = checkedToday(day);
  const wDone = doneToday();
  const isYoga = !!plan.optional;
  const ready = atLevel >= SESSIONS_TO_LEVEL_UP;

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today(), -i);
    const s = W.sessions.find(x => x.date === k);
    const v = W.volley.includes(k);
    const y = W.yoga.includes(k);
    const dn = W.dance.includes(k);
    const mark = s ? s.day : v ? icon('ball') : dn ? icon('music') : y ? icon('lotus') : '';
    week.push(`<div class="day ${s ? 'done' : ''} ${!s && (v || y || dn) ? 'extra' : ''} ${i === 0 ? 'today' : ''}">
      <span>${DAY_SHORT[parseKey(k).getDay()]}</span><b>${mark}</b></div>`);
  }

  return `
    <section class="card dark level">
      <div class="level-top">
        <div><p class="eyebrow">Nivel ${level} de 3 · semana ${weekNum} de 4</p>
          <p class="display-num">${Math.min(atLevel, SESSIONS_TO_LEVEL_UP)}<small>/${SESSIONS_TO_LEVEL_UP} sesiones</small></p></div>
        ${rings([{ value: atLevel / SESSIONS_TO_LEVEL_UP, cls: 'r2' }], 64)}
      </div>
      <p class="micro">${ready && level < 3
        ? '¡Listo para subir! Si los ejercicios ya se sienten fáciles, sube de nivel.'
        : '4 sesiones por semana: torso, vóley, piernas y vóley. Si una semana solo puedes 3, sigue donde te quedaste.'}</p>
      <div class="actions">
        ${level < 3 ? `<button class="btn small ${ready ? 'lime' : 'on-dark'}" data-action="level" data-dir="1">Subir nivel</button>` : ''}
        ${level > 1 ? '<button class="btn small on-dark" data-action="level" data-dir="-1">Bajar nivel</button>' : ''}
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3 class="grow">Últimos 7 días</h3><span class="pill">${sessionsInLast(7)} entrenos</span></div>
      <div class="week">${week.join('')}</div>
      <div class="actions">
        <button class="btn small" data-action="volley">${icon('ball')}${W.volley.includes(today()) ? 'Quitar vóley' : 'Hoy jugué vóley'}</button>
        <button class="btn small" data-action="ics-workout">${icon('bell')}Recordatorio</button>
      </div>
    </section>

    <p class="section-label">Elige la sesión</p>
    <div class="session-picker">${[...WORKOUT_ORDER, ...OPTIONAL_DAYS].map(d => {
      const p = WORKOUT_PLAN[d];
      return `<button class="${d === day ? 'active' : ''}" data-action="pick-workout" data-day="${d}">
        <b>${OPTIONAL_ICON[d] ? icon(OPTIONAL_ICON[d]) : d}</b><span>${esc(p.short)}</span>${d === nextWorkoutDay() ? '<i>te toca</i>' : ''}</button>`;
    }).join('')}</div>

    ${wDone && !isYoga ? `<section class="card banner">${icon('check')}<p>Ya completaste la sesión de hoy (${esc(WORKOUT_PLAN[wDone.day].name)}). Descansa o haz yoga.</p></section>` : ''}

    <section class="card session">
      <p class="eyebrow">${isYoga ? (day === 'K' ? 'Opcional · cuando quieras' : 'Opcional · días de descanso') : `Sesión ${day}`} · ${plan.minutes} min</p>
      <h2>${esc(plan.name)}</h2>
      <p class="muted">${esc(plan.focus)}</p>

      ${isYoga ? '' : `<details class="block-list"><summary><span>Calentamiento dinámico</span><small>8 min</small></summary>
        <ol>${WARMUP.map(w => `<li>${esc(w)}</li>`).join('')}</ol>
        <p class="micro">Solo movimiento: los estiramientos largos van al final.</p></details>`}

      ${groupBlocks(plan.exercises).map(g => `
        <p class="block-label">${esc(g.block)}</p>
        <ul class="checklist exercises">${g.items.map(({ ex, i }) => {
          const on = checked.includes(i);
          return `<li>
            <button class="check ${on ? 'on' : ''}" data-action="ex-toggle" data-day="${day}" data-i="${i}" aria-pressed="${on}">
              <span class="box">${icon('check')}</span>
              <span class="label"><b>${esc(ex.name)}</b><span class="reps">${esc(ex.reps[level - 1])}</span></span>
            </button>
            <div class="ex-tools">
              <button class="tool" data-action="timer-open" data-day="${day}" data-i="${i}">${icon('timer')}Temporizador</button>
              <a class="tool" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.q || ex.name)}" target="_blank" rel="noopener">${icon('play')}Ver ejemplo</a>
            </div>
            <details class="tipbox"><summary>Cómo hacerlo</summary><p>${esc(ex.tip)}</p></details>
          </li>`;
        }).join('')}</ul>`).join('')}

      ${isYoga ? '' : `<details class="block-list"><summary><span>Estiramiento y yoga final</span><small>5–8 min</small></summary>
        <ol>${COOLDOWN.map(w => `<li>${esc(w)}</li>`).join('')}</ol>
        <p class="micro">2 × 30 s cada postura, con tensión leve, nunca dolor.</p></details>`}

      <p class="micro">${isYoga ? (day === 'K' ? 'Empieza lento y sin música; cuando te salga, súbele el ritmo.' : 'Respira lento y nunca fuerces una postura.') : 'Descansa 60–90 s en potencia y 1–2 min en fuerza. Si algo duele (no es cansancio), detente.'}</p>

      ${isYoga
        ? (optionalToday(day) ? `<div class="banner-inline">${icon('check')}${day === 'K' ? 'Baile' : 'Yoga'} de hoy registrado</div>` : `<button class="btn primary block" data-action="finish-optional" data-day="${day}">${day === 'K' ? 'Terminé de bailar' : 'Terminé el yoga'}</button>`)
        : (wDone ? '' : `<button class="btn primary block" data-action="finish-workout" data-day="${day}">Terminé la sesión</button>`)}
    </section>

    <section class="card">
      <h3>Historial</h3>
      <div class="figures">
        <div><span>Sesiones</span><b>${W.sessions.length}</b></div>
        <div><span>Vóley</span><b>${W.volley.length}</b></div>
        <div><span>Yoga · baile</span><b>${W.yoga.length}<small> · ${W.dance.length}</small></b></div>
      </div>
      ${W.sessions.slice(-5).reverse().map(s => `<div class="row hist"><span class="cap">${esc(prettyDate(s.date))}</span><span class="muted">${s.day} · nivel ${s.level}</span></div>`).join('')}
    </section>
  `;
}

function workoutGuide() {
  return `
    <section class="card quote"><p>Tu plan sigue lo que recomiendan la OMS, el Colegio Americano de Medicina del Deporte y estudios científicos revisados por pares. Esto es educación general: si tienes una lesión o dolor persistente, consulta a un profesional.</p></section>
    ${GUIDE.map(g => `
      <section class="card guide">
        <div class="card-head"><h3 class="grow">${esc(g.title)}</h3><span class="tag subtle">${esc(g.tag)}</span></div>
        <ul class="dash">${g.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <p class="refs">${g.sources.map(i => `<a href="${GUIDE_SOURCES[i].url}" target="_blank" rel="noopener">[${i + 1}]</a>`).join(' ')}</p>
      </section>`).join('')}
    <p class="section-label">Fuentes</p>
    <section class="card"><ol class="sources">${GUIDE_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ol></section>
  `;
}

/* ----- Skincare ----- */

function viewPiel() {
  const key = today();
  const streak = skinStreak();
  let full = 0;
  const cells = [];
  const start = addDays(key, -27);
  const pad = (parseKey(start).getDay() + 6) % 7;
  for (let i = 0; i < pad; i++) cells.push('<div class="cell empty"></div>');
  for (let i = 27; i >= 0; i--) {
    const k = addDays(key, -i);
    const r = skinRatio(k);
    if (r === 1) full++;
    const lvl = r === 1 ? 'full' : r > 0 ? 'half' : '';
    cells.push(`<div class="cell ${lvl} ${i === 0 ? 'today' : ''}" title="${esc(k)}">${parseKey(k).getDate()}</div>`);
  }

  return `
    ${pageHead('Skincare', 'Tu rutina', `<button class="icon-btn boxed" data-action="skin-edit" aria-label="Editar rutina">${icon('edit')}</button>`)}

    <section class="card dark stat-strip">
      <div><span>Racha</span><b>${icon('flame')}${streak}<small> ${streak === 1 ? 'día' : 'días'}</small></b></div>
      <div><span>Esta semana</span><b>${skinApplications()}<small> apl.</small></b></div>
      <div><span>Hoy</span><b>${Math.round(skinRatio(key) * 100)}<small>%</small></b></div>
    </section>
    <p class="micro streak-note">La racha suma cada día que completas tu rutina de mañana o de noche. Las aplicaciones cuentan rutinas completas y reaplicaciones de protector.</p>

    ${skinCard('am', true)}
    ${sunCard()}
    ${skinCard('pm', true)}

    <p class="section-label">Mis productos</p>
    <div class="products">${Object.entries(PRODUCTS).map(([id, p]) => `
      <div class="product">${productArt(id, 'lg')}<div><p class="eyebrow">${esc(p.brand)}</p><b>${esc(p.name)}</b><span class="muted small">${esc(p.detail)}</span></div></div>`).join('')}</div>

    <p class="section-label">Esta semana</p>
    <section class="card">
      ${S.skin.weekly.map(w => {
        const n = weeklyCount(w.id);
        const doneToday = S.skin.weeklyLog.some(l => l.id === w.id && l.date === key);
        return `<div class="weekly">
          <div class="grow"><b>${esc(w.text)}</b><div class="dots">${Array.from({ length: w.times }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}<span class="muted small">${n}/${w.times}</span></div></div>
          <button class="btn small ${doneToday ? 'lime' : ''}" data-action="weekly-toggle" data-id="${w.id}">${doneToday ? `${icon('check')}Hoy` : 'Lo hice'}</button>
        </div>`;
      }).join('') || '<p class="muted">Sin tareas semanales.</p>'}
    </section>

    <p class="section-label">Últimas 4 semanas</p>
    <section class="card">
      <div class="cal-head">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
      <div class="cal">${cells.join('')}</div>
      <p class="legend"><i class="cell full"></i>Completo <i class="cell half"></i>A medias <i class="cell"></i>Nada</p>
    </section>

    <button class="btn block" data-action="ics-skin">${icon('bell')}Recordatorios en mi calendario</button>

    <p class="section-label">Tips</p>
    <section class="card"><ul class="dash">${SKINCARE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
  `;
}

/* ----- Ajustes ----- */

function viewAjustes() {
  return `
    ${pageHead('Ajustes', 'Tu app')}
    <section class="card">
      <label>Tu nombre<input data-change="setting" name="name" value="${esc(S.settings.name)}" maxlength="40" placeholder="¿Cómo te llamo?"></label>
      <label>Moneda<input data-change="setting" name="currency" value="${esc(S.settings.currency)}" maxlength="6" placeholder="Bs"></label>
    </section>

    <p class="section-label">Instalar en tu celular</p>
    <section class="card">
      <p><b>Android (Chrome):</b> menú ⋮ → <i>Instalar aplicación</i>.</p>
      <p><b>iPhone (Safari):</b> Compartir → <i>Agregar a inicio</i>.</p>
      <p class="micro">Funciona sin internet una vez instalada.</p>
    </section>

    <p class="section-label">Copia de seguridad</p>
    <section class="card">
      <p class="muted small">Tus datos se guardan solo en este celular. Descarga una copia de vez en cuando, o para pasarlos a otro teléfono.</p>
      <div class="btn-row">
        <button class="btn" data-action="export">${icon('download')}Descargar</button>
        <label class="btn file-btn">${icon('upload')}Restaurar<input type="file" accept="application/json,.json" data-change="import" hidden></label>
      </div>
    </section>

    <section class="card danger-zone">
      <button class="btn danger block" data-action="reset">${icon('trash')}Borrar todos mis datos</button>
    </section>
    <p class="micro center">Mi Proyecto de Vida · v2</p>
  `;
}

// Marca o desmarca un ejercicio de la sesión de hoy (force = true solo marca).
function markExercise(day, i, force) {
  let cur = S.workout.current;
  if (!cur || cur.date !== today() || !cur.done || Array.isArray(cur.done)) cur = S.workout.current = { date: today(), done: {} };
  const list = cur.done[day] = cur.done[day] || [];
  const j = list.indexOf(i);
  if (j >= 0 && !force) list.splice(j, 1);
  else if (j < 0) list.push(i);
  save(); render();
}

/* ---------- Temporizador de ejercicios ---------- */

// Lee las series, segundos y lados del texto de repeticiones del nivel actual.
function timerPhases(ex, level) {
  const raw = ex.reps[level - 1];
  const text = raw.replace(/\([^)]*\)/g, '');
  const rest = REST_BY_BLOCK[ex.block] ?? 60;
  const phases = [{ type: 'prep', secs: 5, title: 'Prepárate', sub: raw }];

  const hiit = raw.match(/(\d+)\s*rondas?:\s*(\d+)\s*s[^/]*\/\s*(\d+)\s*s/);
  if (hiit) {
    const [, rounds, work, off] = hiit.map(Number);
    for (let r = 1; r <= rounds; r++) {
      phases.push({ type: 'work', secs: work, title: '¡Dale!', sub: `Ronda ${r} de ${rounds}` });
      if (r < rounds) phases.push({ type: 'rest', secs: off, title: 'Descansa', sub: `Sigue la ronda ${r + 1}` });
    }
    return phases;
  }

  const setsM = text.match(/^\s*(\d+)\s*(?:×|rondas?)/);
  const sets = setsM ? Number(setsM[1]) : 1;
  const secM = text.match(/^\s*(?:\d+\s*×\s*)?(\d+)\s*(s|min)\b/);
  const each = /c\/u/.test(text);
  const sides = secM && (each || /por (lado|pierna|brazo)/.test(text)) ? 2 : 1;

  for (let s = 1; s <= sets; s++) {
    const setLabel = sets > 1 ? `Serie ${s} de ${sets}` : '';
    if (secM) {
      const secs = Number(secM[1]) * (secM[2] === 'min' ? 60 : 1);
      for (let side = 1; side <= sides; side++) {
        phases.push({ type: 'work', secs, title: sides > 1 ? `${each ? 'Parte' : 'Lado'} ${side}` : 'Mantén', sub: setLabel });
        if (side < sides) phases.push({ type: 'rest', secs: 5, title: each ? 'Cambia' : 'Cambia de lado', sub: setLabel });
      }
    } else {
      phases.push({ type: 'reps', secs: 0, title: raw.replace(/^\s*\d+\s*×\s*/, ''), sub: setLabel || 'Haz tus repeticiones' });
    }
    if (s < sets && rest) phases.push({ type: 'rest', secs: rest, title: 'Descansa', sub: `Sigue la serie ${s + 1}` });
  }
  return phases;
}

let T = null;
let audioCtx = null;
let wakeLock = null;

function beep(freq = 880, ms = 140) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) { /* sin sonido */ }
}

function openTimer(day, i) {
  const ex = WORKOUT_PLAN[day].exercises[i];
  T = { day, i, ex, phases: timerPhases(ex, S.workout.level), idx: -1, running: false, remaining: 0, endAt: 0, tick: null };
  beep(0, 1); // desbloquea el audio con el toque del usuario
  $('#timer').showModal();
  if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {});
  timerNext();
}

function closeTimer() {
  if (T) clearInterval(T.tick);
  T = null;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  $('#timer').close();
}

// Si se cierra con el botón atrás o Esc, limpia el temporizador.
$('#timer').addEventListener('close', () => { if (T) closeTimer(); });

function timerNext() {
  if (!T) return;
  clearInterval(T.tick);
  T.idx++;
  const ph = T.phases[T.idx];
  if (!ph) { T.finished = true; T.running = false; beep(660, 160); setTimeout(() => beep(990, 260), 180); navigator.vibrate?.([120, 80, 220]); timerPaint(); return; }
  if (T.idx > 0) { beep(ph.type === 'work' ? 990 : 660, 180); navigator.vibrate?.(120); }
  T.remaining = ph.secs;
  T.running = ph.type !== 'reps';
  T.endAt = Date.now() + ph.secs * 1000;
  if (T.running) T.tick = setInterval(timerTick, 200);
  timerPaint();
}

function timerTick() {
  if (!T || !T.running) return;
  const left = Math.ceil((T.endAt - Date.now()) / 1000);
  if (left !== T.remaining) {
    T.remaining = left;
    if (left > 0 && left <= 3) beep(520, 90);
    if (left <= 0) return timerNext();
    timerPaint();
  }
}

function timerToggle() {
  if (!T || T.finished) return;
  const ph = T.phases[T.idx];
  if (ph.type === 'reps') return timerNext();
  if (T.running) { T.running = false; clearInterval(T.tick); }
  else { T.running = true; T.endAt = Date.now() + T.remaining * 1000; T.tick = setInterval(timerTick, 200); }
  timerPaint();
}

function timerPaint() {
  if (!T) return;
  const box = $('#timer-body');
  const ph = T.phases[T.idx];
  const total = T.phases.length - 1;
  const step = Math.min(T.idx, total);
  if (T.finished) {
    box.className = 'timer-body done';
    box.innerHTML = `
      <p class="eyebrow">${esc(T.ex.block)}</p><h2>${esc(T.ex.name)}</h2>
      <div class="timer-face"><div class="big">${icon('check')}</div><p>¡Ejercicio terminado!</p></div>
      <button class="btn lime block" data-action="timer-done">Marcar como hecho</button>
      <button class="btn on-dark block" data-action="timer-close">Cerrar</button>`;
    return;
  }
  const frac = ph.secs ? Math.max(0, T.remaining) / ph.secs : 1;
  const len = 2 * Math.PI * 108;
  const mm = Math.floor(Math.max(0, T.remaining) / 60), ss = String(Math.max(0, T.remaining) % 60).padStart(2, '0');
  box.className = `timer-body ${ph.type}`;
  box.innerHTML = `
    <p class="eyebrow">${esc(T.ex.block)} · paso ${step} de ${total}</p><h2>${esc(T.ex.name)}</h2>
    <div class="timer-face">
      <svg viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="108" class="t-track"/>
        <circle cx="120" cy="120" r="108" class="t-ring" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - frac)}" transform="rotate(-90 120 120)"/></svg>
      <div class="t-center">
        <span class="t-phase">${esc(ph.title)}</span>
        ${ph.type === 'reps' ? `<span class="t-reps">${icon('bolt')}</span>` : `<span class="t-time">${mm ? `${mm}:${ss}` : Math.max(0, T.remaining)}</span>`}
        <span class="t-sub">${esc(ph.sub)}</span>
      </div>
    </div>
    <div class="timer-controls">
      ${ph.type === 'reps'
        ? `<button class="btn lime block" data-action="timer-skip">Terminé la serie</button>`
        : `<button class="t-btn" data-action="timer-add" aria-label="Sumar 15 segundos">+15</button>
           <button class="t-btn main" data-action="timer-toggle" aria-label="${T.running ? 'Pausar' : 'Seguir'}">${icon(T.running ? 'pause' : 'play')}</button>
           <button class="t-btn" data-action="timer-skip" aria-label="Saltar">${icon('skip')}</button>`}
    </div>
    <button class="btn ghost block t-close" data-action="timer-close">Salir</button>`;
}

/* ---------- Recordatorios (.ics para el calendario del celular) ---------- */

function icsEvent({ summary, description, time, rrule }) {
  const start = new Date();
  const [h, m] = time.split(':').map(Number);
  start.setHours(h, m, 0, 0);
  if (start < new Date()) start.setDate(start.getDate() + 1);
  const f = d => `${dateKey(d).replace(/-/g, '')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const end = new Date(start.getTime() + 15 * 60000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VEVENT', `UID:${uid()}@mi-proyecto-de-vida`, `DTSTAMP:${stamp}`,
    `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `RRULE:${rrule}`,
    `SUMMARY:${summary}`, `DESCRIPTION:${description}`,
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}
function icsFile(events) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mi Proyecto de Vida//ES', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

/* ---------- Acciones ---------- */

const ACTIONS = {
  go: el => { location.hash = el.dataset.view; },
  'close-modal': () => closeModal(),

  'skin-toggle': el => {
    const day = skinDay(today());
    const list = day[el.dataset.slot];
    const i = list.indexOf(el.dataset.id);
    if (i >= 0) list.splice(i, 1); else list.push(el.dataset.id);
    // Marcar el protector de la mañana inicia la cuenta para reaplicar.
    const step = S.skin[el.dataset.slot].find(s => s.id === el.dataset.id);
    if (i < 0 && step && SUN_PRODUCTS.includes(step.product) && !sunToday().length) sunLog(step.product);
    save(); render();
    if (skinDone(today(), el.dataset.slot) === S.skin[el.dataset.slot].length && i < 0) {
      toast(skinComplete(today()) ? `Rutina del día completa · racha de ${skinStreak()}` : 'Rutina completa');
    }
  },
  'sun-apply': el => {
    sunLog(el.dataset.product);
    save(); render();
    const s = sunState();
    toast(s.n === 1 ? `Protector puesto · reaplica a las ${clock(s.next)}` : `Reaplicación ${s.n - 1} · la próxima a las ${clock(s.next)}`);
  },
  'sun-undo': () => {
    const k = today();
    (S.skin.sun[k] || []).pop();
    save(); render();
  },
  'weekly-toggle': el => {
    const k = today();
    const i = S.skin.weeklyLog.findIndex(l => l.id === el.dataset.id && l.date === k);
    if (i >= 0) S.skin.weeklyLog.splice(i, 1); else S.skin.weeklyLog.push({ id: el.dataset.id, date: k });
    // Mantener solo ~3 meses de historial semanal
    const cutoff = addDays(k, -90);
    S.skin.weeklyLog = S.skin.weeklyLog.filter(l => l.date >= cutoff);
    save(); render();
  },
  'skin-edit': () => {
    const lines = arr => esc(arr.map(s => s.text).join('\n'));
    openModal('Editar rutina', `
      <label>Mañana (un paso por línea)<textarea name="am" rows="4">${lines(S.skin.am)}</textarea></label>
      <label>Noche (un paso por línea)<textarea name="pm" rows="4">${lines(S.skin.pm)}</textarea></label>
      <label>Semanal (tarea | veces por semana)<textarea name="weekly" rows="3">${esc(S.skin.weekly.map(w => `${w.text} | ${w.times}`).join('\n'))}</textarea></label>
      <p class="micro">Si tu piel es grasa o con acné, busca productos “no comedogénicos”. Ante dudas, consulta a un dermatólogo.</p>`,
    data => {
      const parse = (text, old) => text.split('\n').map(t => t.trim()).filter(Boolean).map(t => {
        const prev = old.find(o => o.text === t);
        return prev ? { ...prev } : { id: uid(), text: t };
      });
      S.skin.am = parse(data.am, S.skin.am);
      S.skin.pm = parse(data.pm, S.skin.pm);
      S.skin.weekly = data.weekly.split('\n').map(t => t.trim()).filter(Boolean).map(line => {
        const [text, times] = line.split('|').map(x => x.trim());
        const prev = S.skin.weekly.find(o => o.text === text);
        return { id: prev ? prev.id : uid(), text, times: Math.max(1, Math.min(7, parseInt(times, 10) || 1)) };
      });
      toast('Rutina actualizada');
    });
  },
  'ics-skin': () => {
    openModal('Recordatorios de skincare', `
      <p class="muted small">Se descargará un archivo para agregar a tu calendario. El calendario te avisará todos los días.</p>
      <div class="grid2">
        <label>Mañana<input type="time" name="am" value="07:00" required></label>
        <label>Noche<input type="time" name="pm" value="21:30" required></label>
      </div>`,
    data => {
      download('recordatorio-skincare.ics', icsFile([
        icsEvent({ summary: 'Skincare de la mañana', description: S.skin.am.map(s => s.text).join(' → '), time: data.am, rrule: 'FREQ=DAILY' }),
        icsEvent({ summary: 'Skincare de la noche', description: S.skin.pm.map(s => s.text).join(' → '), time: data.pm, rrule: 'FREQ=DAILY' }),
      ]), 'text/calendar');
      toast('Abre el archivo descargado para agregarlo a tu calendario');
    }, 'Descargar');
  },
  'ics-workout': () => {
    const days = [['MO', 'Lun'], ['TU', 'Mar'], ['WE', 'Mié'], ['TH', 'Jue'], ['FR', 'Vie'], ['SA', 'Sáb'], ['SU', 'Dom']];
    openModal('Recordatorio de entreno', `
      <p class="muted small">Elige tus días: lo ideal son 3, con un día de descanso entre ellos.</p>
      <div class="days-pick">${days.map(([c, n]) => `<label class="chip"><input type="checkbox" name="d_${c}" ${['MO', 'WE', 'FR'].includes(c) ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
      <label>Hora<input type="time" name="time" value="19:00" required></label>`,
    data => {
      const sel = days.map(d => d[0]).filter(c => data[`d_${c}`]);
      if (!sel.length) { toast('Elige al menos un día'); return false; }
      download('recordatorio-entreno.ics', icsFile([icsEvent({
        summary: 'Entreno en casa', description: 'Abre Mi Proyecto de Vida y haz tu sesión de hoy (40–45 min).',
        time: data.time, rrule: `FREQ=WEEKLY;BYDAY=${sel.join(',')}`,
      })]), 'text/calendar');
      toast('Abre el archivo descargado para agregarlo a tu calendario');
    }, 'Descargar');
  },

  'nutri-edit': () => openModal('Mis datos', nutritionForm(S.nutrition.profile || {}), data => {
    const num = k => Number(String(data[k]).replace(',', '.'));
    const p = { weight: num('weight'), height: num('height'), age: num('age'), sex: data.sex, goal: data.goal, activity: data.activity, meals: Number(data.meals), avoid: data.avoid.trim() };
    if (!(p.weight > 0 && p.height > 0 && p.age > 0)) { toast('Revisa peso, estatura y edad'); return false; }
    S.nutrition.profile = p;
    toast('Plan de alimentación listo');
  }),
  'timer-open': el => openTimer(el.dataset.day, Number(el.dataset.i)),
  'timer-toggle': () => timerToggle(),
  'timer-skip': () => timerNext(),
  'timer-add': () => { if (T) { T.endAt += 15000; T.remaining += 15; timerPaint(); } },
  'timer-close': () => closeTimer(),
  'timer-done': () => {
    if (T) markExercise(T.day, T.i, true);
    closeTimer();
  },
  'workout-tab': el => { S.ui.workoutTab = el.dataset.tab; save(); render(); },
  'pick-workout': el => { S.ui.workoutPick = el.dataset.day; render(); },
  'ex-toggle': el => markExercise(el.dataset.day, Number(el.dataset.i)),
  'finish-workout': el => {
    const day = el.dataset.day;
    const total = WORKOUT_PLAN[day].exercises.length;
    const n = checkedToday(day).length;
    const finish = () => {
      S.workout.sessions.push({ date: today(), day, level: S.workout.level });
      if (S.workout.current && S.workout.current.done) delete S.workout.current.done[day];
      S.ui.workoutPick = null;
      save(); render();
      const left = SESSIONS_TO_LEVEL_UP - sessionsAtLevel();
      toast(left === 0 && S.workout.level < 3 ? '¡Puedes subir de nivel!' : 'Sesión registrada. Gran trabajo.');
    };
    if (n < total) {
      openModal('¿Terminar la sesión?', `<p>Marcaste ${n} de ${total} ejercicios. ¿Registrarla igual?</p>`, () => { finish(); }, 'Sí, registrar');
    } else finish();
  },
  'finish-optional': el => {
    const day = el.dataset.day;
    if (!optionalToday(day)) S.workout[WORKOUT_PLAN[day].log].push(today());
    if (S.workout.current && S.workout.current.done) delete S.workout.current.done[day];
    save(); render();
    toast(day === 'K' ? 'Baile registrado. ¡A disfrutar la próxima fiesta!' : 'Yoga registrado. Buena recuperación.');
  },
  level: el => {
    S.workout.level = Math.max(1, Math.min(3, S.workout.level + Number(el.dataset.dir)));
    S.workout.levelStart = S.workout.sessions.length;
    save(); render();
    toast(`Ahora estás en nivel ${S.workout.level}`);
  },
  volley: () => {
    const k = today();
    const i = S.workout.volley.indexOf(k);
    if (i >= 0) S.workout.volley.splice(i, 1); else { S.workout.volley.push(k); toast('Partido registrado'); }
    save(); render();
  },

  'goal-add': () => openModal('Nueva meta', goalForm(), data => {
    S.goals.push({
      id: uid(), title: data.title.trim(), area: data.area, deadline: data.deadline || '', why: data.why.trim(),
      milestones: (data.steps || '').split('\n').map(t => t.trim()).filter(Boolean).map(text => ({ id: uid(), text, done: false })),
      manual: 0, done: false, createdAt: today(),
    });
    toast('Meta creada');
  }),
  'goal-edit': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    openModal('Editar meta', goalForm(g), data => {
      Object.assign(g, { title: data.title.trim(), area: data.area, deadline: data.deadline || '', why: data.why.trim(), manual: Number(data.manual) || 0 });
    });
  },
  'goal-done': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    g.done = !g.done;
    if (g.done) g.doneAt = today();
    save(); render();
    if (g.done) toast('¡Meta lograda! Felicidades.');
  },
  'goal-del': el => confirmModal('Se eliminará esta meta y sus pasos.', () => {
    S.goals = S.goals.filter(x => x.id !== el.dataset.goal);
  }),
  'ms-toggle': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    const m = g.milestones.find(x => x.id === el.dataset.id);
    m.done = !m.done;
    save(); render();
    if (g.milestones.every(x => x.done)) toast('Todos los pasos listos: márcala como lograda');
  },
  'ms-add': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    openModal(`Nuevo paso`, `<p class="muted small">${esc(g.title)}</p><label>Paso<input name="text" required maxlength="120" placeholder="Algo concreto que puedas hacer"></label>`, data => {
      g.milestones.push({ id: uid(), text: data.text.trim(), done: false });
    });
  },

  'fin-tab': el => { S.ui.finTab = el.dataset.tab; save(); render(); },
  'fin-month': el => {
    const next = shiftMonth(S.ui.finMonth || monthKey(), Number(el.dataset.step));
    if (next > monthKey()) return;
    S.ui.finMonth = next === monthKey() ? null : next;
    render();
  },
  'tx-add': el => {
    const type = el.dataset.type;
    const cats = type === 'in' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    openModal(type === 'in' ? 'Nuevo ingreso' : 'Nuevo gasto', `
      <label>Monto (${esc(S.settings.currency)})<input type="number" inputmode="decimal" name="amount" min="0.01" step="0.01" required class="big-input"></label>
      <label>Categoría<select name="category">${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
      <label>Nota (opcional)<input name="note" maxlength="80" placeholder="${type === 'in' ? 'Ej: sueldo de octubre' : 'Ej: almuerzo'}"></label>
      <label>Fecha<input type="date" name="date" value="${today()}" max="${today()}" required></label>`,
    data => {
      const amount = Math.round(parseFloat(data.amount) * 100) / 100;
      if (!(amount > 0)) { toast('Pon un monto válido'); return false; }
      S.tx.push({ id: uid(), type, amount, category: data.category, note: data.note.trim(), date: data.date || today() });
      toast(type === 'in' ? 'Ingreso guardado' : 'Gasto guardado');
    });
  },
  'tx-del': el => confirmModal('Se eliminará este movimiento.', () => { S.tx = S.tx.filter(t => t.id !== el.dataset.id); }),
  'fixed-pay': el => {
    const f = S.fixedIncome.find(x => x.id === el.dataset.id);
    if (!f) return;
    const left = fixedLeft(f);
    const amount = left === null ? f.amount : Math.min(f.amount, left);
    const mk = S.ui.finMonth || monthKey();
    const date = mk === monthKey() ? today() : `${mk}-01`;
    S.tx.push({ id: uid(), type: 'in', amount, category: f.category, note: f.name, date, fixedId: f.id });
    if (f.total) f.received = (f.received || 0) + amount;
    save(); render();
    toast(`Cobro de ${money(amount)} guardado`);
  },
  'fixed-edit': el => {
    const f = el.dataset.id ? S.fixedIncome.find(x => x.id === el.dataset.id) : null;
    openModal(f ? 'Editar ingreso fijo' : 'Nuevo ingreso fijo', `
      <label>Nombre<input name="name" maxlength="40" required value="${esc(f?.name || '')}" placeholder="Ej: Sueldo"></label>
      <label>Monto al mes (${esc(S.settings.currency)})<input type="number" inputmode="decimal" name="amount" min="0.01" step="0.01" required value="${f?.amount ?? ''}"></label>
      <label>Categoría<select name="category">${INCOME_CATEGORIES.map(c => `<option ${f?.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label>Total a cobrar (solo si termina)<input type="number" inputmode="decimal" name="total" min="0" step="0.01" value="${f?.total ?? ''}" placeholder="Vacío si es indefinido"></label>
      <label>Ya cobrado<input type="number" inputmode="decimal" name="received" min="0" step="0.01" value="${f?.received ?? 0}"></label>
      ${f ? `<button type="button" class="btn danger small" data-action="fixed-del" data-id="${f.id}">${icon('trash')}Eliminar</button>` : ''}`,
    data => {
      const amount = Math.round(parseFloat(data.amount) * 100) / 100;
      if (!(amount > 0)) { toast('Pon un monto válido'); return false; }
      const total = parseFloat(data.total) > 0 ? parseFloat(data.total) : null;
      const item = { name: data.name.trim(), amount, category: data.category, total, received: total ? (parseFloat(data.received) || 0) : 0 };
      if (f) Object.assign(f, item); else S.fixedIncome.push({ id: uid(), ...item });
      toast('Ingreso fijo guardado');
    });
  },
  'fixed-del': el => {
    S.fixedIncome = S.fixedIncome.filter(x => x.id !== el.dataset.id);
    closeModal(); save(); render();
    toast('Ingreso fijo eliminado');
  },
  'sav-add': () => openModal('Nueva meta de ahorro', `
    <label>Nombre<input name="name" required maxlength="60" placeholder="Ej: Fondo de emergencia"></label>
    <label>Monto objetivo<input type="number" inputmode="decimal" name="target" min="1" step="0.01" required></label>
    <label>Ya tengo ahorrado<input type="number" inputmode="decimal" name="saved" min="0" step="0.01" value="0"></label>`,
  data => {
    S.savings.push({ id: uid(), name: data.name.trim(), target: Number(data.target) || 0, saved: Number(data.saved) || 0 });
  }),
  'sav-move': el => {
    const sv = S.savings.find(x => x.id === el.dataset.id);
    const dir = Number(el.dataset.dir);
    openModal(dir > 0 ? `Aportar a ${sv.name}` : `Retirar de ${sv.name}`,
      '<label>Monto<input type="number" inputmode="decimal" name="amount" min="0.01" step="0.01" required class="big-input"></label>',
      data => {
        const a = Number(data.amount) || 0;
        sv.saved = Math.max(0, Math.round((sv.saved + dir * a) * 100) / 100);
        if (dir > 0 && sv.saved >= sv.target) toast(`¡Llegaste a tu meta "${sv.name}"!`);
      });
  },
  'sav-del': el => confirmModal('Se eliminará esta meta de ahorro.', () => { S.savings = S.savings.filter(x => x.id !== el.dataset.id); }),
  'dec-add': () => openModal('Nueva decisión', `
    <label>¿Qué tienes que decidir?<input name="question" required maxlength="100" placeholder="Ej: ¿Qué celular me compro?"></label>
    <label>Opciones (una por línea, 2 a 4)<textarea name="options" rows="3" required placeholder="Opción A&#10;Opción B"></textarea></label>
    <label>¿Qué te importa? (criterio | peso 1–5)<textarea name="criteria" rows="4" required>Precio | 5
Calidad | 4
Lo uso a diario | 3</textarea></label>`,
  data => {
    const options = data.options.split('\n').map(t => t.trim()).filter(Boolean).slice(0, 4);
    const criteria = data.criteria.split('\n').map(t => t.trim()).filter(Boolean).slice(0, 8).map(line => {
      const [name, w] = line.split('|').map(x => x.trim());
      return { name, weight: Math.max(1, Math.min(5, parseInt(w, 10) || 3)) };
    });
    if (options.length < 2 || !criteria.length) { toast('Pon al menos 2 opciones y 1 criterio'); return false; }
    S.decisions.push({ id: uid(), question: data.question.trim(), options, criteria, scores: options.map(() => criteria.map(() => 0)) });
  }),
  'dec-del': el => confirmModal('Se eliminará esta decisión.', () => { S.decisions = S.decisions.filter(d => d.id !== el.dataset.id); }),

  export: () => {
    download(`mi-proyecto-de-vida-${today()}.json`, JSON.stringify(S, null, 2), 'application/json');
    toast('Copia descargada');
  },
  reset: () => confirmModal('Se borrarán TODOS tus datos de este celular. Esto no se puede deshacer.', () => {
    S = defaultState();
    toast('Datos borrados');
  }, 'Borrar todo'),
};

const CHANGES = {
  setting: el => {
    S.settings[el.name] = el.value.trim() || (el.name === 'currency' ? 'Bs' : '');
    save();
    toast('Guardado');
  },
  'dec-score': el => {
    const d = S.decisions.find(x => x.id === el.dataset.id);
    d.scores[el.dataset.o][el.dataset.c] = Number(el.value);
    save(); render();
  },
  import: el => {
    const file = el.files[0];
    if (!file) return;
    file.text().then(text => {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || !data.settings) throw new Error('formato');
      S = mergeDefaults(defaultState(), data);
      save(); render();
      toast('Copia restaurada');
    }).catch(() => toast('Ese archivo no es una copia válida'));
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || !ACTIONS[el.dataset.action]) return;
  e.preventDefault();
  ACTIONS[el.dataset.action](el);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el);
});
document.addEventListener('input', e => {
  if (e.target.closest('[data-calc="buy"]')) buyDraft[e.target.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (e.target.closest('[data-calc]')) updateCalcs();
});

// Barra de pestañas y botón de ajustes con iconos propios.
$('.tabbar').innerHTML = TABS.map(([v, label, ic]) =>
  `<button data-action="go" data-view="${v}" aria-label="${label}">${icon(ic)}<span>${label}</span></button>`).join('');
$('#settings-btn').innerHTML = icon('sliders');

render();

// Actualiza la cuenta del protector cada minuto (sin tocar formularios abiertos).
setInterval(() => {
  if (document.querySelector('[data-sun-status]') && !$('#modal').open && !$('#timer').open) render();
}, 60000);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
}
