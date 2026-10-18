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
    workout: { level: 1, levelStart: 0, sessions: [], volley: [], current: null },
    skin: {
      am: DEFAULT_SKINCARE.am.map(s => ({ ...s })),
      pm: DEFAULT_SKINCARE.pm.map(s => ({ ...s })),
      weekly: DEFAULT_SKINCARE.weekly.map(s => ({ ...s })),
      log: {},
      weeklyLog: [],
    },
    ui: { finTab: 'resumen', finMonth: null, workoutPick: null },
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

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (e) {
    toast('No se pudo guardar. ¿Memoria llena?');
  }
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
  return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${v}%"></div></div>`;
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
    <h2>${esc(title)}</h2>
    <div class="modal-body">${body}</div>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="close-modal">Cancelar</button>
      <button type="submit" class="btn primary">${esc(submitLabel)}</button>
    </div>`;
  modalSubmit = onSubmit;
  $('#modal').showModal();
  const first = form.querySelector('input, select, textarea');
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
  hoy: { title: 'Hoy', render: viewHoy },
  metas: { title: 'Metas y proyectos', render: viewMetas },
  finanzas: { title: 'Finanzas', render: viewFinanzas },
  ejercicio: { title: 'Ejercicio en casa', render: viewEjercicio },
  piel: { title: 'Skincare', render: viewPiel },
  ajustes: { title: 'Ajustes', render: viewAjustes },
};

function currentView() {
  const v = location.hash.replace('#', '');
  return VIEWS[v] ? v : 'hoy';
}

function render() {
  const v = currentView();
  $('#view-title').textContent = VIEWS[v].title;
  $('#app').innerHTML = VIEWS[v].render();
  document.querySelectorAll('.tabbar button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === v);
    if (b.dataset.view === v) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
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
function skinStreak() {
  let key = today();
  if (!skinComplete(key)) key = addDays(key, -1); // el día de hoy aún no termina
  let n = 0;
  while (skinComplete(key)) { n++; key = addDays(key, -1); }
  return n;
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

function skinChecklist(slot, compact = false) {
  const key = today();
  const log = S.skin.log[key];
  const items = S.skin[slot];
  if (!items.length) return '<p class="muted">Sin pasos. Edita tu rutina.</p>';
  return `<ul class="checklist ${compact ? 'compact' : ''}">${items.map(s => {
    const on = log && log[slot].includes(s.id);
    return `<li><button class="check ${on ? 'on' : ''}" data-action="skin-toggle" data-slot="${slot}" data-id="${s.id}" aria-pressed="${on}">
      <span class="box">${on ? '✓' : ''}</span><span>${esc(s.text)}</span></button></li>`;
  }).join('')}</ul>`;
}

/* ---------- Ejercicio: lógica ---------- */

function lastSession() {
  return S.workout.sessions[S.workout.sessions.length - 1];
}
function nextWorkoutDay() {
  const last = lastSession();
  if (!last) return 'A';
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
function activeWorkoutDay() {
  const cur = S.workout.current;
  if (cur && cur.date === today()) return cur.day;
  return S.ui.workoutPick || nextWorkoutDay();
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
  if (!g.deadline) return '';
  const d = daysBetween(today(), g.deadline);
  if (g.done) return '';
  if (d < 0) return `<span class="tag warn">Vencida hace ${-d} d</span>`;
  if (d === 0) return '<span class="tag warn">Vence hoy</span>';
  if (d <= 30) return `<span class="tag">Faltan ${d} d</span>`;
  return `<span class="tag subtle">${esc(g.deadline.split('-').reverse().join('/'))}</span>`;
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
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const name = S.settings.name ? `, ${esc(S.settings.name)}` : '';

  const streak = skinStreak();
  const week = sessionsInLast(7);
  const mk = monthKey();
  const fin = monthSummary(mk);

  const activeGoals = S.goals.filter(g => !g.done)
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')).slice(0, 3);

  const wDay = activeWorkoutDay();
  const plan = WORKOUT_PLAN[wDay];
  const wDone = doneToday();
  const tip = SKINCARE_TIPS[parseKey(key).getDate() % SKINCARE_TIPS.length];

  const showAmFirst = hour < 15;
  const amCard = `<div class="card">
      <div class="card-head"><h3>☀️ Skincare mañana</h3><span class="count">${skinDone(key, 'am')}/${S.skin.am.length}</span></div>
      ${skinChecklist('am', true)}</div>`;
  const pmCard = `<div class="card">
      <div class="card-head"><h3>🌙 Skincare noche</h3><span class="count">${skinDone(key, 'pm')}/${S.skin.pm.length}</span></div>
      ${skinChecklist('pm', true)}</div>`;

  return `
    <section class="hello">
      <p class="date">${esc(prettyDate(key))}</p>
      <h2>${greet}${name} 👋</h2>
    </section>

    <section class="stats">
      <a class="stat" href="#piel"><b>${streak}</b><span>días de racha skincare</span></a>
      <a class="stat" href="#ejercicio"><b>${week}/3</b><span>entrenos esta semana</span></a>
      <a class="stat" href="#metas"><b>${S.goals.filter(g => g.done).length}/${S.goals.length}</b><span>metas logradas</span></a>
    </section>

    ${showAmFirst ? amCard + pmCard : pmCard + amCard}

    <div class="card">
      <div class="card-head"><h3>💪 Entreno</h3>${wDone ? '<span class="tag ok">Hecho hoy</span>' : ''}</div>
      ${wDone
        ? `<p>¡Bien! Completaste <b>${esc(WORKOUT_PLAN[wDone.day].name)}</b>. Mañana descansa o juega vóley.</p>`
        : `<p><b>Sesión ${wDay}: ${esc(plan.name)}</b><br><span class="muted">${esc(plan.focus)} · unos 30–40 min</span></p>
           <a class="btn primary block" href="#ejercicio">Empezar entreno</a>`}
    </div>

    <div class="card">
      <div class="card-head"><h3>🎯 Metas en curso</h3><a href="#metas" class="link">Ver todas</a></div>
      ${activeGoals.length ? activeGoals.map(g => `
        <div class="mini-goal">
          <div class="row"><span>${goalArea(g.area).icon} ${esc(g.title)}</span><span class="muted">${pct(goalProgress(g))}</span></div>
          ${progressBar(goalProgress(g))}
        </div>`).join('') : '<p class="muted">Aún no tienes metas. ¡Crea la primera!</p><a class="btn block" href="#metas">Crear meta</a>'}
    </div>

    <div class="card">
      <div class="card-head"><h3>💰 Este mes</h3><a href="#finanzas" class="link">Detalle</a></div>
      <div class="money-row">
        <div><span class="muted">Ingresos</span><b class="pos">${money(fin.income)}</b></div>
        <div><span class="muted">Gastos</span><b class="neg">${money(fin.expense)}</b></div>
        <div><span class="muted">Te queda</span><b>${money(fin.balance)}</b></div>
      </div>
      <div class="btn-row">
        <button class="btn" data-action="tx-add" data-type="out">− Gasto</button>
        <button class="btn" data-action="tx-add" data-type="in">+ Ingreso</button>
      </div>
    </div>

    <div class="card tip"><b>💡 Consejo del día:</b> ${esc(tip)}</div>
  `;
}

/* ----- Metas ----- */

function goalCard(g) {
  const p = goalProgress(g);
  const area = goalArea(g.area);
  return `
    <article class="card goal ${g.done ? 'done' : ''}">
      <div class="card-head">
        <h3>${area.icon} ${esc(g.title)}</h3>
        <span class="count">${pct(p)}</span>
      </div>
      <div class="tags"><span class="tag subtle">${esc(area.name)}</span>${deadlineText(g)}${g.done ? '<span class="tag ok">Lograda 🎉</span>' : ''}</div>
      ${progressBar(p, g.done ? 'ok' : '')}
      ${g.why ? `<p class="why">“${esc(g.why)}”</p>` : ''}
      ${g.milestones.length ? `<ul class="checklist compact">${g.milestones.map(m => `
        <li><button class="check ${m.done ? 'on' : ''}" data-action="ms-toggle" data-goal="${g.id}" data-id="${m.id}" aria-pressed="${m.done}">
          <span class="box">${m.done ? '✓' : ''}</span><span>${esc(m.text)}</span></button></li>`).join('')}</ul>` : ''}
      <div class="btn-row small">
        ${g.done ? '' : `<button class="btn" data-action="ms-add" data-goal="${g.id}">+ Paso</button>`}
        <button class="btn" data-action="goal-edit" data-goal="${g.id}">Editar</button>
        <button class="btn" data-action="goal-done" data-goal="${g.id}">${g.done ? 'Reabrir' : 'Marcar lograda'}</button>
        <button class="btn ghost danger" data-action="goal-del" data-goal="${g.id}" aria-label="Eliminar meta">🗑</button>
      </div>
    </article>`;
}

function viewMetas() {
  const active = S.goals.filter(g => !g.done);
  const done = S.goals.filter(g => g.done);
  const overall = active.length ? active.reduce((a, g) => a + goalProgress(g), 0) / active.length : 0;

  const byArea = GOAL_AREAS.map(a => ({ area: a, goals: active.filter(g => g.area === a.id) }))
    .filter(x => x.goals.length);

  return `
    <div class="card intro">
      <p>Divide cada meta en <b>pasos pequeños</b>. Marcar pasos es lo que mueve tu barra de avance.</p>
      ${active.length ? `<div class="row"><span>Avance promedio de metas activas</span><b>${pct(overall)}</b></div>${progressBar(overall)}` : ''}
    </div>
    <button class="btn primary block" data-action="goal-add">+ Nueva meta o proyecto</button>

    ${byArea.map(x => `<h2 class="section">${x.area.icon} ${esc(x.area.name)}</h2>${x.goals.map(goalCard).join('')}`).join('')}

    ${!S.goals.length ? `<div class="empty">
      <p>🎯</p><p>¿Qué quieres lograr este año?</p>
      <p class="muted">Ideas: “Ahorrar para un viaje”, “Jugar vóley 2 veces por semana”, “Terminar un curso”, “Leer 12 libros”.</p>
    </div>` : ''}

    ${done.length ? `<details class="done-list"><summary>Metas logradas (${done.length})</summary>${done.map(goalCard).join('')}</details>` : ''}
  `;
}

function goalForm(g = {}) {
  return `
    <label>Meta o proyecto<input name="title" required maxlength="120" value="${esc(g.title)}" placeholder="Ej: Ahorrar para una moto"></label>
    <label>Área<select name="area">${GOAL_AREAS.map(a => `<option value="${a.id}" ${g.area === a.id ? 'selected' : ''}>${a.icon} ${esc(a.name)}</option>`).join('')}</select></label>
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
    <div class="segmented" role="tablist">${tabs.map(([id, label]) =>
      `<button role="tab" aria-selected="${S.ui.finTab === id}" class="${S.ui.finTab === id ? 'active' : ''}" data-action="fin-tab" data-tab="${id}">${label}</button>`).join('')}</div>
    ${content()}`;
}

function finMonthNav() {
  const mk = S.ui.finMonth || monthKey();
  return `<div class="month-nav">
      <button class="icon-btn" data-action="fin-month" data-step="-1" aria-label="Mes anterior">‹</button>
      <b>${esc(prettyMonth(mk))}</b>
      <button class="icon-btn" data-action="fin-month" data-step="1" aria-label="Mes siguiente" ${mk >= monthKey() ? 'disabled' : ''}>›</button>
    </div>`;
}

function finResumen() {
  const mk = S.ui.finMonth || monthKey();
  const s = monthSummary(mk);
  const rate = s.income > 0 ? (s.balance / s.income) * 100 : 0;
  const cats = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  let advice = '';
  if (s.count === 0) advice = 'Registra tus ingresos y gastos del mes para ver aquí en qué se va tu dinero.';
  else if (s.income === 0) advice = 'Registra también tus ingresos para calcular cuánto estás ahorrando.';
  else if (rate < 0) advice = '⚠️ Este mes gastas más de lo que ganas. Revisa las categorías más altas y recorta una.';
  else if (rate < 10) advice = 'Ahorras menos del 10%. Meta sugerida: separa el ahorro apenas recibes tu ingreso, no lo que sobre.';
  else if (rate < 20) advice = '👍 Vas bien. Si llegas al 20% de ahorro, tu fondo de emergencia crecerá mucho más rápido.';
  else advice = '🎉 ¡Excelente! Ahorras más del 20%. Considera poner parte a generar intereses (pestaña Intereses).';

  return `
    ${finMonthNav()}
    <div class="card">
      <div class="money-row">
        <div><span class="muted">Ingresos</span><b class="pos">${money(s.income)}</b></div>
        <div><span class="muted">Gastos</span><b class="neg">${money(s.expense)}</b></div>
        <div><span class="muted">Balance</span><b>${money(s.balance)}</b></div>
      </div>
      ${s.income > 0 ? `<div class="row"><span>Tasa de ahorro</span><b>${pct(rate)}</b></div>${progressBar(Math.max(0, rate * 5), rate >= 20 ? 'ok' : '')}<p class="muted small">La barra se llena al llegar a 20%.</p>` : ''}
      <p class="advice">${advice}</p>
      <div class="btn-row">
        <button class="btn" data-action="tx-add" data-type="out">− Gasto</button>
        <button class="btn" data-action="tx-add" data-type="in">+ Ingreso</button>
      </div>
    </div>

    ${cats.length ? `<div class="card"><h3>¿En qué se va el dinero?</h3>
      ${cats.map(([c, v]) => `<div class="cat-row"><div class="row"><span>${esc(c)}</span><span>${money(v)} <span class="muted">· ${pct(v / s.expense * 100)}</span></span></div>${progressBar(v / max * 100, 'neg')}</div>`).join('')}
    </div>` : ''}

    <div class="card">
      <div class="card-head"><h3>🐷 Metas de ahorro</h3><button class="btn small-btn" data-action="sav-add">+ Nueva</button></div>
      ${S.savings.length ? S.savings.map(sv => {
        const p = sv.target ? sv.saved / sv.target * 100 : 0;
        return `<div class="saving">
          <div class="row"><b>${esc(sv.name)}</b><span>${money(sv.saved)} / ${money(sv.target)}</span></div>
          ${progressBar(p, p >= 100 ? 'ok' : '')}
          <div class="btn-row small">
            <button class="btn" data-action="sav-move" data-id="${sv.id}" data-dir="1">+ Aportar</button>
            <button class="btn" data-action="sav-move" data-id="${sv.id}" data-dir="-1">− Retirar</button>
            <button class="btn ghost danger" data-action="sav-del" data-id="${sv.id}" aria-label="Eliminar">🗑</button>
          </div></div>`;
      }).join('') : '<p class="muted">Ej: Fondo de emergencia (3 meses de gastos), un viaje, una laptop.</p>'}
    </div>

    <div class="card tip"><b>Regla 50/30/20:</b> 50% necesidades (vivienda, comida, transporte), 30% gustos, 20% ahorro e inversión. Es una guía, ajústala a tu realidad.</div>
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
      <button class="btn primary" data-action="tx-add" data-type="out">− Gasto</button>
      <button class="btn primary" data-action="tx-add" data-type="in">+ Ingreso</button>
    </div>
    ${list.length ? Object.entries(groups).map(([d, items]) => `
      <h2 class="section small">${esc(prettyDate(d))}</h2>
      <div class="card list">${items.map(t => `
        <div class="tx">
          <div><b>${esc(t.category)}</b>${t.note ? `<br><span class="muted">${esc(t.note)}</span>` : ''}</div>
          <div class="tx-right"><b class="${t.type === 'in' ? 'pos' : 'neg'}">${t.type === 'in' ? '+' : '−'} ${money(t.amount)}</b>
          <button class="icon-btn" data-action="tx-del" data-id="${t.id}" aria-label="Eliminar movimiento">✕</button></div>
        </div>`).join('')}</div>`).join('')
      : '<div class="empty"><p>📒</p><p>Sin movimientos este mes.</p></div>'}
  `;
}

function finCalc() {
  return `
    <div class="card calc" data-calc="compound">
      <h3>📈 ¿Cuánto crece mi ahorro?</h3>
      <p class="muted small">Interés compuesto: tus intereses también generan intereses.</p>
      <div class="grid2">
        <label>Monto inicial<input type="number" inputmode="decimal" min="0" name="p" value="1000"></label>
        <label>Aporte mensual<input type="number" inputmode="decimal" min="0" name="m" value="200"></label>
        <label>Tasa anual %<input type="number" inputmode="decimal" min="0" step="0.1" name="r" value="6"></label>
        <label>Años<input type="number" inputmode="numeric" min="1" max="50" name="y" value="5"></label>
      </div>
      <div class="result" id="res-compound"></div>
    </div>

    <div class="card calc" data-calc="loan">
      <h3>🏦 ¿Cuánto pagaré por un préstamo o compra a cuotas?</h3>
      <div class="grid2">
        <label>Monto<input type="number" inputmode="decimal" min="0" name="a" value="5000"></label>
        <label>Tasa anual %<input type="number" inputmode="decimal" min="0" step="0.1" name="r" value="18"></label>
        <label>Plazo (meses)<input type="number" inputmode="numeric" min="1" name="n" value="12"></label>
      </div>
      <div class="result" id="res-loan"></div>
    </div>

    <div class="card tip"><b>Recuerda:</b> el interés compuesto trabaja a tu favor cuando ahorras y en tu contra cuando te endeudas. Compara siempre la tasa anual (TEA) entre bancos.</div>
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
      <div class="row"><span>Tendrás</span><b class="pos big">${money(total)}</b></div>
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
      note = `<p class="advice">La cuota sería el <b>${pct(share)}</b> de tu ingreso mensual promedio. ${share > 30
        ? '⚠️ Más del 30% es arriesgado: busca un plazo mayor, un monto menor o ahorra primero.'
        : share > 15 ? 'Es manejable, pero cuida no sumar otras deudas.' : '✅ Es una cuota cómoda para tus ingresos.'}</p>`;
    }
    $('#res-loan').innerHTML = `
      <div class="row"><span>Cuota mensual</span><b class="big">${money(pay)}</b></div>
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
  return `
    <div class="card calc" data-calc="buy">
      <h3>🛍️ ¿Me lo compro?</h3>
      <label>¿Qué quieres comprar?<input name="what" value="${bv('what')}" placeholder="Ej: zapatillas de vóley" maxlength="80"></label>
      <label>Precio<input type="number" inputmode="decimal" min="0" name="price" value="${bv('price')}" placeholder="0"></label>
      <fieldset class="questions">
        <legend>Responde con honestidad</legend>
        <label class="inline"><input type="checkbox" name="q1" ${bc('q1')}> Lo necesito (no solo lo quiero)</label>
        <label class="inline"><input type="checkbox" name="q2" ${bc('q2')}> Lo voy a usar al menos 1 vez por semana</label>
        <label class="inline"><input type="checkbox" name="q3" ${bc('q3')}> Lo puedo pagar sin endeudarme</label>
        <label class="inline"><input type="checkbox" name="q4" ${bc('q4')}> Lo quería desde hace más de una semana</label>
        <label class="inline"><input type="checkbox" name="q5" ${bc('q5')}> Comparé precios en al menos 2 lugares</label>
      </fieldset>
      <div class="result" id="res-buy"></div>
    </div>

    <div class="card">
      <div class="card-head"><h3>⚖️ Comparar opciones</h3><button class="btn small-btn" data-action="dec-add">+ Nueva decisión</button></div>
      <p class="muted small">Para decisiones grandes: pon tus opciones, lo que te importa y califica. La app calcula cuál conviene más.</p>
    </div>
    ${S.decisions.slice().reverse().map(decisionCard).join('')}
  `;
}

function updateBuy(b) {
  const price = Number(b.querySelector('[name=price]').value) || 0;
  const what = b.querySelector('[name=what]').value.trim() || 'esto';
  const yes = ['q1', 'q2', 'q3', 'q4', 'q5'].filter(q => b.querySelector(`[name=${q}]`).checked).length;
  const out = $('#res-buy');
  if (!price) { out.innerHTML = '<p class="muted">Pon el precio para ver el análisis.</p>'; return; }

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
  const costPerUse = b.querySelector('[name=q2]').checked ? price / 52 : null;
  if (costPerUse) lines.push(`Usándolo cada semana por un año, cuesta ${money(costPerUse)} por uso.`);

  let verdict;
  if (!b.querySelector('[name=q3]').checked) verdict = `<div class="verdict no">✋ No lo compres ahora. Si te endeudarías por ${esc(what)}, primero crea una meta de ahorro.</div>`;
  else if (score >= 4) verdict = '<div class="verdict yes">✅ Parece una buena compra. ¡Adelante!</div>';
  else if (score >= 2) verdict = '<div class="verdict wait">⏳ Espera 48 horas. Si después lo sigues queriendo igual, cómpralo.</div>';
  else verdict = '<div class="verdict no">✋ Mejor no por ahora. Ese dinero puede ir a una de tus metas.</div>';

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
      <div class="card-head"><h3>${esc(d.question)}</h3>
        <button class="icon-btn" data-action="dec-del" data-id="${d.id}" aria-label="Eliminar decisión">🗑</button></div>
      <p class="muted small">Califica cada opción del 1 (mal) al 5 (excelente).</p>
      <div class="matrix-wrap"><table class="matrix">
        <thead><tr><th>Criterio <span class="muted">(peso)</span></th>${d.options.map(o => `<th>${esc(o)}</th>`).join('')}</tr></thead>
        <tbody>${d.criteria.map((c, ci) => `<tr><td>${esc(c.name)} <span class="muted">×${c.weight}</span></td>
          ${d.options.map((_, oi) => `<td><select data-change="dec-score" data-id="${d.id}" data-o="${oi}" data-c="${ci}" aria-label="${esc(c.name)}">
            <option value="0">–</option>${[1, 2, 3, 4, 5].map(v => `<option ${d.scores[oi]?.[ci] === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select></td>`).join('')}</tr>`).join('')}</tbody>
        <tfoot><tr><td><b>Puntaje</b></td>${scores.map(s => `<td class="${filled && s === best ? 'winner' : ''}"><b>${s.toFixed(1)}</b></td>`).join('')}</tr></tfoot>
      </table></div>
      ${filled ? `<p class="advice">Según lo que más te importa, gana <b>${esc(d.options[scores.indexOf(best)])}</b>. Si tu intuición dice otra cosa, quizá falte un criterio.</p>` : ''}
    </article>`;
}

/* ----- Ejercicio ----- */

function viewEjercicio() {
  const W = S.workout;
  const level = W.level;
  const atLevel = sessionsAtLevel();
  const day = activeWorkoutDay();
  const plan = WORKOUT_PLAN[day];
  const cur = W.current && W.current.date === today() && W.current.day === day ? W.current : null;
  const checked = cur ? cur.done : [];
  const wDone = doneToday();

  // Últimos 7 días
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today(), -i);
    const s = W.sessions.find(x => x.date === k);
    const v = W.volley.includes(k);
    week.push(`<div class="day ${s ? 'done' : ''} ${v ? 'volley' : ''} ${i === 0 ? 'today' : ''}">
      <span>${DAY_SHORT[parseKey(k).getDay()]}</span><b>${s ? s.day : v ? '🏐' : '·'}</b></div>`);
  }

  return `
    <div class="card">
      <div class="card-head"><h3>Nivel ${level} de 3</h3><span class="count">${Math.min(atLevel, SESSIONS_TO_LEVEL_UP)}/${SESSIONS_TO_LEVEL_UP}</span></div>
      ${progressBar(atLevel / SESSIONS_TO_LEVEL_UP * 100, atLevel >= SESSIONS_TO_LEVEL_UP ? 'ok' : '')}
      <p class="muted small">${atLevel >= SESSIONS_TO_LEVEL_UP && level < 3
        ? '¡Listo para subir de nivel! Si los ejercicios ya se sienten fáciles, súbelo.'
        : `Plan: 3 sesiones por semana (ej. lunes, miércoles y viernes). Completa ${SESSIONS_TO_LEVEL_UP} sesiones para subir.`}</p>
      <div class="btn-row small">
        ${level < 3 ? `<button class="btn ${atLevel >= SESSIONS_TO_LEVEL_UP ? 'primary' : ''}" data-action="level" data-dir="1">Subir nivel</button>` : ''}
        ${level > 1 ? '<button class="btn" data-action="level" data-dir="-1">Bajar nivel</button>' : ''}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Últimos 7 días</h3><span class="count">${sessionsInLast(7)} entrenos</span></div>
      <div class="week">${week.join('')}</div>
      <div class="btn-row small">
        <button class="btn" data-action="volley">${W.volley.includes(today()) ? '🏐 Quitar vóley de hoy' : '🏐 Hoy jugué vóley'}</button>
        <button class="btn" data-action="ics-workout">⏰ Recordatorios</button>
      </div>
    </div>

    ${wDone ? `<div class="card done-banner">✅ Ya completaste la sesión de hoy (${esc(WORKOUT_PLAN[wDone.day].name)}). ¡Descansa y recupérate!</div>` : ''}

    <div class="segmented">${WORKOUT_ORDER.map(d => `<button class="${d === day ? 'active' : ''}" data-action="pick-workout" data-day="${d}">${d} · ${esc(WORKOUT_PLAN[d].short)}</button>`).join('')}</div>

    <div class="card">
      <h3>Sesión ${day}: ${esc(plan.name)}</h3>
      <p class="muted">${esc(plan.focus)}${day === nextWorkoutDay() ? ' · <b>te toca hoy</b>' : ''}</p>

      <details class="block-list"><summary>🔥 Calentamiento (5 min)</summary><ul>${WARMUP.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>

      <ul class="checklist exercises">${plan.exercises.map((ex, i) => {
        const on = checked.includes(i);
        return `<li>
          <button class="check ${on ? 'on' : ''}" data-action="ex-toggle" data-day="${day}" data-i="${i}" aria-pressed="${on}">
            <span class="box">${on ? '✓' : ''}</span>
            <span><b>${esc(ex.name)}</b><br><span class="reps">${esc(ex.reps[level - 1])}</span></span>
          </button>
          <details class="tipbox"><summary>Cómo hacerlo</summary><p>${esc(ex.tip)}</p></details>
        </li>`;
      }).join('')}</ul>
      <p class="muted small">Descansa 45–60 s entre series. Si algo duele (no es cansancio), detente.</p>

      <details class="block-list"><summary>🧘 Estiramiento final (3 min)</summary><ul>${COOLDOWN.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>

      ${wDone ? '' : `<button class="btn primary block" data-action="finish-workout" data-day="${day}">Terminé la sesión 💪</button>`}
    </div>

    <div class="card tip"><b>🏐 Para el vóley:</b> la sesión A te ayuda a saltar más alto, la B protege tu hombro al rematar y la C te da reacción y estabilidad en defensa. Un día después de jugar, mejor descansa o haz solo estiramiento.</div>

    <div class="card">
      <h3>Historial</h3>
      <p>Total: <b>${W.sessions.length}</b> sesiones · <b>${W.volley.length}</b> partidos de vóley</p>
      ${W.sessions.slice(-5).reverse().map(s => `<div class="row"><span>${esc(prettyDate(s.date))}</span><span>${s.day} · nivel ${s.level}</span></div>`).join('') || '<p class="muted">Tu primera sesión aparecerá aquí.</p>'}
    </div>
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
    <section class="stats two">
      <div class="stat"><b>${streak} 🔥</b><span>días seguidos completos</span></div>
      <div class="stat"><b>${full}/28</b><span>días completos (4 semanas)</span></div>
    </section>

    <div class="card">
      <div class="card-head"><h3>☀️ Mañana</h3><span class="count">${skinDone(key, 'am')}/${S.skin.am.length}</span></div>
      ${skinChecklist('am')}
    </div>
    <div class="card">
      <div class="card-head"><h3>🌙 Noche</h3><span class="count">${skinDone(key, 'pm')}/${S.skin.pm.length}</span></div>
      ${skinChecklist('pm')}
    </div>

    <div class="card">
      <h3>📅 Esta semana</h3>
      ${S.skin.weekly.map(w => {
        const n = weeklyCount(w.id);
        const doneToday = S.skin.weeklyLog.some(l => l.id === w.id && l.date === key);
        return `<div class="weekly">
          <div><b>${esc(w.text)}</b><br><span class="muted small">${n}/${w.times} veces esta semana</span></div>
          <button class="btn small-btn ${n >= w.times ? 'ok' : ''}" data-action="weekly-toggle" data-id="${w.id}">${doneToday ? '✓ Hoy' : 'Lo hice hoy'}</button>
        </div>`;
      }).join('') || '<p class="muted">Sin tareas semanales.</p>'}
    </div>

    <div class="card">
      <h3>Últimas 4 semanas</h3>
      <div class="cal-head">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
      <div class="cal">${cells.join('')}</div>
      <p class="legend"><span class="cell full"></span> completo <span class="cell half"></span> a medias <span class="cell"></span> nada</p>
    </div>

    <div class="btn-row">
      <button class="btn" data-action="skin-edit">✏️ Editar rutina</button>
      <button class="btn" data-action="ics-skin">⏰ Recordatorios</button>
    </div>

    <div class="card tip"><b>💡 Tips:</b><ul>${SKINCARE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
  `;
}

/* ----- Ajustes ----- */

function viewAjustes() {
  return `
    <div class="card">
      <h3>Tus datos</h3>
      <label>Tu nombre<input data-change="setting" name="name" value="${esc(S.settings.name)}" maxlength="40" placeholder="¿Cómo te llamo?"></label>
      <label>Moneda<input data-change="setting" name="currency" value="${esc(S.settings.currency)}" maxlength="6" placeholder="Bs"></label>
    </div>

    <div class="card">
      <h3>📲 Instalar en tu celular</h3>
      <p><b>Android (Chrome):</b> menú ⋮ → <i>Instalar aplicación</i> o <i>Agregar a pantalla principal</i>.</p>
      <p><b>iPhone (Safari):</b> botón Compartir ⬆️ → <i>Agregar a inicio</i>.</p>
      <p class="muted small">Funciona sin internet una vez instalada.</p>
    </div>

    <div class="card">
      <h3>💾 Copia de seguridad</h3>
      <p class="muted small">Tus datos se guardan solo en este celular. Descarga una copia de vez en cuando, o para pasarlos a otro teléfono.</p>
      <div class="btn-row">
        <button class="btn" data-action="export">Descargar copia</button>
        <label class="btn file-btn">Restaurar copia<input type="file" accept="application/json,.json" data-change="import" hidden></label>
      </div>
    </div>

    <div class="card">
      <h3>Zona peligrosa</h3>
      <button class="btn danger" data-action="reset">Borrar todos mis datos</button>
    </div>
    <p class="muted small center">Mi Proyecto de Vida · v1</p>
  `;
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
    save(); render();
    if (skinDone(today(), el.dataset.slot) === S.skin[el.dataset.slot].length && i < 0) {
      toast(skinComplete(today()) ? `¡Rutina del día completa! 🔥 Racha: ${skinStreak()}` : '¡Rutina completa! ✨');
    }
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
    openModal('Editar rutina de skincare', `
      <label>☀️ Mañana (un paso por línea)<textarea name="am" rows="4">${lines(S.skin.am)}</textarea></label>
      <label>🌙 Noche (un paso por línea)<textarea name="pm" rows="4">${lines(S.skin.pm)}</textarea></label>
      <label>📅 Semanal (formato: tarea | veces por semana)<textarea name="weekly" rows="3">${esc(S.skin.weekly.map(w => `${w.text} | ${w.times}`).join('\n'))}</textarea></label>
      <p class="muted small">Consejo: si tu piel es grasa o con acné, usa limpiador y productos “no comedogénicos”. Ante dudas, consulta a un dermatólogo.</p>`,
    data => {
      const parse = (text, old) => text.split('\n').map(t => t.trim()).filter(Boolean).map(t => {
        const prev = old.find(o => o.text === t);
        return { id: prev ? prev.id : uid(), text: t };
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
        <label>☀️ Mañana<input type="time" name="am" value="07:00" required></label>
        <label>🌙 Noche<input type="time" name="pm" value="21:30" required></label>
      </div>`,
    data => {
      download('recordatorio-skincare.ics', icsFile([
        icsEvent({ summary: '☀️ Skincare de la mañana', description: S.skin.am.map(s => s.text).join(' → '), time: data.am, rrule: 'FREQ=DAILY' }),
        icsEvent({ summary: '🌙 Skincare de la noche', description: S.skin.pm.map(s => s.text).join(' → '), time: data.pm, rrule: 'FREQ=DAILY' }),
      ]), 'text/calendar');
      toast('Abre el archivo descargado para agregarlo a tu calendario');
    }, 'Descargar');
  },
  'ics-workout': () => {
    const days = [['MO', 'Lun'], ['TU', 'Mar'], ['WE', 'Mié'], ['TH', 'Jue'], ['FR', 'Vie'], ['SA', 'Sáb'], ['SU', 'Dom']];
    openModal('Recordatorio de entreno', `
      <p class="muted small">Elige tus días (recomendado 3, con un día de descanso entre ellos).</p>
      <div class="days-pick">${days.map(([c, n]) => `<label class="inline"><input type="checkbox" name="d_${c}" ${['MO', 'WE', 'FR'].includes(c) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <label>Hora<input type="time" name="time" value="19:00" required></label>`,
    data => {
      const sel = days.map(d => d[0]).filter(c => data[`d_${c}`]);
      if (!sel.length) { toast('Elige al menos un día'); return false; }
      download('recordatorio-entreno.ics', icsFile([icsEvent({
        summary: '💪 Entreno en casa', description: 'Abre Mi Proyecto de Vida y haz tu sesión de hoy (30–40 min).',
        time: data.time, rrule: `FREQ=WEEKLY;BYDAY=${sel.join(',')}`,
      })]), 'text/calendar');
      toast('Abre el archivo descargado para agregarlo a tu calendario');
    }, 'Descargar');
  },

  'pick-workout': el => { S.ui.workoutPick = el.dataset.day; render(); },
  'ex-toggle': el => {
    const day = el.dataset.day, i = Number(el.dataset.i);
    let cur = S.workout.current;
    if (!cur || cur.date !== today() || cur.day !== day) cur = S.workout.current = { date: today(), day, done: [] };
    const j = cur.done.indexOf(i);
    if (j >= 0) cur.done.splice(j, 1); else cur.done.push(i);
    save(); render();
  },
  'finish-workout': el => {
    const day = el.dataset.day;
    const total = WORKOUT_PLAN[day].exercises.length;
    const cur = S.workout.current;
    const n = cur && cur.date === today() && cur.day === day ? cur.done.length : 0;
    const finish = () => {
      S.workout.sessions.push({ date: today(), day, level: S.workout.level });
      S.workout.current = null;
      S.ui.workoutPick = null;
      save(); render();
      const left = SESSIONS_TO_LEVEL_UP - sessionsAtLevel();
      toast(left === 0 && S.workout.level < 3 ? '🎉 ¡Puedes subir de nivel!' : '💪 ¡Sesión registrada! Gran trabajo.');
    };
    if (n < total) {
      openModal('¿Terminar la sesión?', `<p>Marcaste ${n} de ${total} ejercicios. ¿Registrarla igual?</p>`, () => { finish(); }, 'Sí, registrar');
    } else finish();
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
    if (i >= 0) S.workout.volley.splice(i, 1); else { S.workout.volley.push(k); toast('🏐 ¡Partido registrado!'); }
    save(); render();
  },

  'goal-add': () => openModal('Nueva meta', goalForm(), data => {
    S.goals.push({
      id: uid(), title: data.title.trim(), area: data.area, deadline: data.deadline || '', why: data.why.trim(),
      milestones: (data.steps || '').split('\n').map(t => t.trim()).filter(Boolean).map(text => ({ id: uid(), text, done: false })),
      manual: 0, done: false, createdAt: today(),
    });
    toast('Meta creada 🎯');
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
    if (g.done) toast('🎉 ¡Meta lograda! Felicidades.');
  },
  'goal-del': el => confirmModal('Se eliminará esta meta y sus pasos.', () => {
    S.goals = S.goals.filter(x => x.id !== el.dataset.goal);
  }),
  'ms-toggle': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    const m = g.milestones.find(x => x.id === el.dataset.id);
    m.done = !m.done;
    save(); render();
    if (g.milestones.every(x => x.done)) toast('¡Todos los pasos listos! Márcala como lograda 🎉');
  },
  'ms-add': el => {
    const g = S.goals.find(x => x.id === el.dataset.goal);
    openModal(`Nuevo paso: ${g.title}`, '<label>Paso<input name="text" required maxlength="120" placeholder="Algo concreto que puedas hacer"></label>', data => {
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
      <label>Monto (${esc(S.settings.currency)})<input type="number" inputmode="decimal" name="amount" min="0.01" step="0.01" required></label>
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
      '<label>Monto<input type="number" inputmode="decimal" name="amount" min="0.01" step="0.01" required></label>',
      data => {
        const a = Number(data.amount) || 0;
        sv.saved = Math.max(0, Math.round((sv.saved + dir * a) * 100) / 100);
        if (dir > 0 && sv.saved >= sv.target) toast(`🎉 ¡Llegaste a tu meta "${sv.name}"!`);
      });
  },
  'sav-del': el => confirmModal('Se eliminará esta meta de ahorro.', () => { S.savings = S.savings.filter(x => x.id !== el.dataset.id); }),
  'dec-add': () => openModal('Nueva decisión', `
    <label>¿Qué tienes que decidir?<input name="question" required maxlength="100" placeholder="Ej: ¿Qué celular me compro?"></label>
    <label>Opciones (una por línea, 2 a 4)<textarea name="options" rows="3" required placeholder="Opción A&#10;Opción B"></textarea></label>
    <label>¿Qué te importa? (una por línea, con peso 1–5 después de “|”)<textarea name="criteria" rows="4" required>Precio | 5
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
      toast('Copia restaurada ✅');
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

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
}
