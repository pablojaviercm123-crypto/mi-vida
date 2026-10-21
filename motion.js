/* Ejemplos animados: una figura que se mueve entre poses clave.
   Ángulos en grados. Tronco: 0 = vertical hacia arriba, + = se inclina hacia la derecha (adelante).
   Extremidades: 0 = hacia abajo, + = hacia la derecha. Pie: dirección absoluta (90 = plano hacia adelante).
   Sufijo 1 = lado cercano, 2 = lado lejano (más claro). En vista frontal (front) 1 = derecha, 2 = izquierda. */

const LEN = { trunk: 34, neck: 6, head: 7.5, arm: 17, fore: 16, thigh: 22, shin: 21, foot: 8 };
const GROUND = 140;

const BASE_POSE = {
  x: 100, lift: 0, T: 0, N: 0, sx: 1,
  a1: 8, f1: 4, a2: -6, f2: -2,
  t1: 0, s1: 0, t2: 0, s2: 0, ft1: 90, ft2: 90,
};

const rad = d => d * Math.PI / 180;
const down = (p, len, ang) => ({ x: p.x + len * Math.sin(rad(ang)), y: p.y + len * Math.cos(rad(ang)) });
const up = (p, len, ang) => ({ x: p.x + len * Math.sin(rad(ang)), y: p.y - len * Math.cos(rad(ang)) });

function joints(pose) {
  const P = { ...BASE_POSE, ...pose };
  const hip = { x: 0, y: 0 };
  const sh = up(hip, LEN.trunk, P.T);
  const neck = up(sh, LEN.neck, P.T + P.N);
  const head = up(sh, LEN.neck + LEN.head, P.T + P.N);
  const J = { hip, sh, neck, head };
  J.el1 = down(sh, LEN.arm, P.a1); J.ha1 = down(J.el1, LEN.fore, P.f1);
  J.el2 = down(sh, LEN.arm, P.a2); J.ha2 = down(J.el2, LEN.fore, P.f2);
  J.kn1 = down(hip, LEN.thigh, P.t1); J.an1 = down(J.kn1, LEN.shin, P.s1); J.to1 = down(J.an1, LEN.foot, P.ft1);
  J.kn2 = down(hip, LEN.thigh, P.t2); J.an2 = down(J.kn2, LEN.shin, P.s2); J.to2 = down(J.an2, LEN.foot, P.ft2);
  // Espejo para giros (vista frontal)
  if (P.sx !== 1) Object.values(J).forEach(p => { p.x *= P.sx; });
  // Apoyar en el suelo: el punto más bajo toca el piso
  const lowest = Math.max(...Object.entries(J).map(([k, p]) => p.y + (k === 'head' ? LEN.head : 0)));
  const dy = GROUND - P.lift - lowest;
  Object.values(J).forEach(p => { p.x += P.x; p.y += dy; });
  return J;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}
function lerpPose(a, b, t) {
  const A = { ...BASE_POSE, ...a }, B = { ...BASE_POSE, ...b }, out = {};
  for (const k of Object.keys(BASE_POSE)) {
    out[k] = ['x', 'lift', 'sx'].includes(k) ? A[k] + (B[k] - A[k]) * t : lerpAngle(A[k], B[k], t);
  }
  return out;
}
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ---------- Poses base reutilizables ---------- */
const STAND = {};
const SQUAT = { T: 38, t1: 82, s1: -28, t2: 78, s2: -26 };
const GOBLET_ARMS = { a1: 25, f1: 165, a2: 22, f2: 160 };
const PLANK = { T: 80, a1: 0, f1: 0, a2: 2, f2: 2, t1: -80, s1: -80, t2: -80, s2: -80, ft1: 0, ft2: 0 };
const PUSH_DOWN = { ...PLANK, T: 88, t1: -88, s1: -88, t2: -88, s2: -88, a1: -55, f1: 15, a2: -52, f2: 17 };
const SUPINE = { T: -90, N: 0, a1: 90, f1: 90, a2: 90, f2: 90, t1: 90, s1: 90, t2: 90, s2: 90, ft1: 180, ft2: 180 };
const PRONE = { T: 90, a1: 100, f1: 100, a2: 100, f2: 100, t1: -90, s1: -90, t2: -90, s2: -90, ft1: 0, ft2: 0 };
const QUAD = { T: 88, a1: 0, f1: 0, a2: 0, f2: 0, t1: 0, s1: -90, t2: 0, s2: -90, ft1: -90, ft2: -90 };
const KNEES_UP = { ...SUPINE, t1: 135, s1: 15, t2: 132, s2: 15, ft1: 90, ft2: 90 };
const BENT_ROW = { T: 72, t1: 15, s1: -5, t2: -12, s2: -8, a1: 0, f1: 0, a2: 0, f2: 0 };

/* ---------- Movimientos ----------
   frames: poses clave; dur: ms por tramo; props: objetos; hl: segmentos que trabajan (en color);
   anchor: articulación que no se mueve; front: vista de frente (ambos lados iguales). */
const MOTIONS = {
  squat: { frames: [{ ...GOBLET_ARMS }, { ...SQUAT, ...GOBLET_ARMS }], dur: 1100, hl: ['thigh1', 'thigh2'], props: [{ t: 'pack', at: 'ha1' }], anchor: 'an1' },
  jumpSquat: { frames: [{ ...SQUAT, a1: -30, f1: -20, a2: -30, f2: -20 }, { lift: 22, a1: 165, f1: 170, a2: 160, f2: 165, ft1: 40, ft2: 40 }, { T: 20, t1: 45, s1: -15, t2: 45, s2: -15, a1: 40, f1: 60 }], dur: 450, hl: ['thigh1', 'shin1'] },
  landing: { frames: [{ lift: 0 }, { lift: 16, x: 112, ft1: 45, ft2: 45, a1: 120, f1: 130 }, { x: 124, T: 30, t1: 70, s1: -22, t2: 66, s2: -22, a1: 50, f1: 60 }, { x: 124, T: 30, t1: 70, s1: -22, t2: 66, s2: -22, a1: 50, f1: 60 }], dur: 600, hl: ['thigh1', 'shin1'], props: [{ t: 'box', under: 'an1', w: 26 }] },
  wallSit: { frames: [{ T: 0, t1: 90, s1: 0, t2: 88, s2: 0, a1: 10, f1: 30 }, { T: 2, t1: 90, s1: 0, t2: 88, s2: 0, a1: 12, f1: 32 }], dur: 1400, hl: ['thigh1', 'thigh2'], props: [{ t: 'wall', at: 'hip', dx: -7 }], hold: true },
  bulgarian: { frames: [{ T: 6, t1: 8, s1: 0, t2: -20, s2: -100, ft2: 180 }, { T: 22, t1: 78, s1: -12, t2: 2, s2: -95, ft2: 180 }], dur: 1100, hl: ['thigh1'], props: [{ t: 'box', under: 'an2', w: 24 }, { t: 'pack', at: 'ha1' }], anchor: 'an1' },
  bridge: { frames: [{ ...KNEES_UP }, { ...KNEES_UP, T: -112, t1: 112, s1: 2, t2: 110, s2: 2 }], dur: 1000, hl: ['hip'], anchor: 'an1' },
  hipThrust: { frames: [{ ...KNEES_UP, T: -60, a1: 60, f1: 120 }, { ...KNEES_UP, T: -96, t1: 100, s1: 2, t2: 98, s2: 2, a1: 60, f1: 120 }], dur: 1000, hl: ['hip'], props: [{ t: 'box', under: 'sh', w: 30 }, { t: 'pack', at: 'hip' }], anchor: 'an1' },
  nordic: { frames: [{ T: 0, t1: 0, s1: -90, t2: 0, s2: -90, ft1: 180, ft2: 180, a1: 30, f1: 120 }, { T: 62, t1: 62, s1: -90, t2: 62, s2: -90, ft1: 180, ft2: 180, a1: 120, f1: 110 }], dur: 1600, hl: ['thigh1'], anchor: 'kn1', props: [{ t: 'couch', at: 'an1' }] },
  calfRaise: { frames: [{}, { ft1: 30, ft2: 30 }], dur: 800, hl: ['shin1', 'shin2'], anchor: 'to1' },
  calfSingle: { frames: [{ t2: 10, s2: -70 }, { t2: 10, s2: -70, ft1: 30 }], dur: 900, hl: ['shin1'], anchor: 'to1', props: [{ t: 'step', at: 'to1' }] },
  balance: { frames: [{ T: -3, t2: 15, s2: -75, a1: 40, f1: 50, a2: -10 }, { T: 3, t2: 15, s2: -75, a1: 35, f1: 45, a2: -5 }], dur: 1300, hl: ['shin1'], anchor: 'an1', hold: true },
  pushup: { frames: [PLANK, PUSH_DOWN], dur: 1000, hl: ['arm1', 'trunk'], anchor: 'ha1' },
  pushupPack: { frames: [PLANK, PUSH_DOWN], dur: 1100, hl: ['arm1', 'trunk'], anchor: 'ha1', props: [{ t: 'pack', at: 'mid' }] },
  pushupPlyo: { frames: [PUSH_DOWN, { ...PLANK, lift: 10, a1: 20, f1: 30, a2: 20, f2: 30 }, PLANK], dur: 380, hl: ['arm1', 'trunk'], anchor: 'to1' },
  pike: { frames: [{ T: 132, t1: -48, s1: -48, t2: -48, s2: -48, a1: 0, f1: 0, a2: 2, f2: 2, ft1: 0, ft2: 0 }, { T: 150, t1: -40, s1: -40, t2: -40, s2: -40, a1: -40, f1: 25, a2: -38, f2: 27, ft1: 0, ft2: 0 }], dur: 1100, hl: ['arm1'], anchor: 'ha1' },
  rowOne: { frames: [{ ...BENT_ROW }, { ...BENT_ROW, a1: -70, f1: 0 }], dur: 900, hl: ['arm1', 'trunk'], props: [{ t: 'box', under: 'ha2', w: 22 }, { t: 'pack', at: 'ha1' }], anchor: 'an1' },
  rowTable: { frames: [{ ...SUPINE, T: -78, t1: 82, s1: 82, t2: 82, s2: 82, a1: 180, f1: 180, a2: 178, f2: 178 }, { ...SUPINE, T: -64, t1: 72, s1: 72, t2: 72, s2: 72, a1: 120, f1: 230, a2: 118, f2: 228 }], dur: 1000, hl: ['arm1', 'trunk'], props: [{ t: 'bar', at: 'ha1' }], anchor: 'an1' },
  lateral: { front: true, frames: [{ a1: 10, f1: 12, a2: -10, f2: -12, t1: 4, t2: -4 }, { a1: 85, f1: 88, a2: -85, f2: -88, t1: 4, t2: -4 }], dur: 1000, hl: ['arm1', 'arm2'], props: [{ t: 'bottle', at: 'ha1' }, { t: 'bottle', at: 'ha2' }] },
  dips: { frames: [{ T: 2, t1: 78, s1: 8, t2: 76, s2: 8, a1: -14, f1: -10, a2: -14, f2: -10 }, { T: 6, t1: 62, s1: 20, t2: 60, s2: 20, a1: -62, f1: 12, a2: -62, f2: 12 }], dur: 1000, hl: ['arm1', 'arm2'], props: [{ t: 'box', under: 'ha1', w: 26 }], anchor: 'ha1' },
  curl: { frames: [{ a1: 2, f1: 2 }, { a1: 4, f1: 150 }], dur: 900, hl: ['arm1'], props: [{ t: 'pack', at: 'ha1' }], anchor: 'an1' },
  extRot: { frames: [{ ...SUPINE, a1: 88, f1: 0, a2: 100, f2: 100 }, { ...SUPINE, a1: 88, f1: 175, a2: 100, f2: 100 }], dur: 1000, hl: ['arm1'], props: [{ t: 'bottle', at: 'ha1' }], anchor: 'an1' },
  ytw: { frames: [{ ...PRONE, a1: 100, f1: 100 }, { ...PRONE, a1: 128, f1: 128, a2: 126, f2: 126 }, { ...PRONE, a1: 20, f1: 80, a2: 20, f2: 80 }, { ...PRONE, a1: -25, f1: 60, a2: -25, f2: 60, T: 86 }], dur: 900, hl: ['arm1', 'trunk'], anchor: 'an1' },
  birdDog: { frames: [QUAD, { ...QUAD, a1: 90, f1: 90, t2: -90, s2: -90, ft2: 0 }, QUAD, { ...QUAD, a2: 90, f2: 90, t1: -90, s1: -90, ft1: 0 }], dur: 1000, hl: ['trunk'], anchor: 'kn1' },
  shoulderTap: { frames: [PLANK, { ...PLANK, a2: -40, f2: 150 }, PLANK, { ...PLANK, a1: -40, f1: 150 }], dur: 600, hl: ['trunk'], anchor: 'to1' },
  curlUp: { frames: [{ ...SUPINE, t1: 135, s1: 15, ft1: 90, a1: 95, f1: 95 }, { ...SUPINE, T: -78, N: -6, t1: 135, s1: 15, ft1: 90, a1: 95, f1: 95 }], dur: 1400, hl: ['trunk'], anchor: 'an2', hold: true },
  reverseCrunch: { frames: [{ ...SUPINE, t1: 180, s1: 90, t2: 178, s2: 90, ft1: 180, ft2: 180 }, { ...SUPINE, T: -96, t1: 212, s1: 125, t2: 210, s2: 125, ft1: 210, ft2: 210 }], dur: 1000, hl: ['trunk'], anchor: 'sh' },
  deadBug: { frames: [{ ...SUPINE, a1: 180, f1: 180, a2: 180, f2: 180, t1: 180, s1: 90, t2: 180, s2: 90 }, { ...SUPINE, a1: 180, f1: 180, a2: 268, f2: 268, t1: 98, s1: 98, t2: 180, s2: 90 }, { ...SUPINE, a1: 180, f1: 180, a2: 180, f2: 180, t1: 180, s1: 90, t2: 180, s2: 90 }, { ...SUPINE, a1: 268, f1: 268, a2: 180, f2: 180, t1: 180, s1: 90, t2: 98, s2: 98 }], dur: 900, hl: ['trunk'], anchor: 'sh' },
  sidePlank: { front: true, frames: [{ T: -66, t1: 66, s1: 66, t2: 66, s2: 66, a1: 0, f1: 92, a2: 180, f2: 180, ft1: 150, ft2: 150 }, { T: -73, t1: 73, s1: 73, t2: 73, s2: 73, a1: 0, f1: 92, a2: 180, f2: 180, ft1: 155, ft2: 155 }], dur: 1400, hl: ['trunk'], anchor: 'el1', hold: true },
  superman: { frames: [{ ...PRONE }, { ...PRONE, T: 78, a1: 112, f1: 112, a2: 110, f2: 110, t1: -102, s1: -102, t2: -100, s2: -100 }], dur: 1200, hl: ['trunk'], anchor: 'hip' },
  shuffle: { front: true, frames: [{ T: 0, t1: 30, s1: -5, t2: -30, s2: 5, a1: 25, f1: 60, a2: -25, f2: -60, x: 92 }, { T: 0, t1: 18, s1: -8, t2: -18, s2: 8, a1: 25, f1: 60, a2: -25, f2: -60, x: 100 }, { T: 0, t1: 30, s1: -5, t2: -30, s2: 5, a1: 25, f1: 60, a2: -25, f2: -60, x: 108 }, { T: 0, t1: 18, s1: -8, t2: -18, s2: 8, a1: 25, f1: 60, a2: -25, f2: -60, x: 100 }], dur: 260, hl: ['thigh1', 'thigh2'] },
  quickFeet: { frames: [{ T: 8, t1: 40, s1: -30, a1: -30, f1: 60, a2: 30, f2: 100, ft1: 60 }, { T: 8, t2: 40, s2: -30, a1: 30, f1: 100, a2: -30, f2: 60, ft2: 60 }], dur: 200, hl: ['shin1', 'shin2'] },
  lateralHop: { front: true, frames: [{ x: 80, t2: -20, s2: 40, a1: 30, a2: -30 }, { x: 100, lift: 14, t2: -15, s2: 30, a1: 50, a2: -50 }, { x: 120, t1: 20, s1: -40, a1: 30, a2: -30 }], dur: 450, hl: ['shin1', 'shin2'] },
  heelToe: { frames: [{ t1: 15, s1: 5, t2: -15, s2: -5, ft1: 150, a1: -15, a2: 15 }, { t1: -15, s1: -5, t2: 15, s2: 5, ft2: 150, a1: 15, a2: -15 }, { t1: 15, s1: 5, t2: -15, s2: -5, ft1: 40, ft2: 40, a1: -15, a2: 15 }, { t1: -15, s1: -5, t2: 15, s2: 5, ft1: 40, ft2: 40, a1: 15, a2: -15 }], dur: 450, hl: ['shin1'] },
  calfBall: { frames: [{}, { ft1: 30, ft2: 30 }], dur: 900, hl: ['shin1', 'shin2'], anchor: 'to1', props: [{ t: 'ball', at: 'an1', r: 5 }] },
  jacks: { front: true, frames: [{ a1: 8, f1: 8, a2: -8, f2: -8, t1: 4, s1: 4, t2: -4, s2: -4 }, { lift: 6, a1: 165, f1: 172, a2: -165, f2: -172, t1: 24, s1: 24, t2: -24, s2: -24 }], dur: 330, hl: ['arm1', 'thigh1'] },
  wallThrow: { frames: [{ T: -8, a1: 190, f1: 215, t1: 15, t2: -10 }, { T: 18, a1: 80, f1: 60, t1: 15, t2: -10 }], dur: 600, hl: ['arm1', 'trunk'], props: [{ t: 'ball', at: 'ha1', r: 6 }, { t: 'wall', x: 175 }] },
  rdl: { frames: [{ t2: 0, s2: 0, a1: 0, f1: 0 }, { T: 82, t2: -82, s2: -82, ft2: 0, a1: 0, f1: 0, a2: 0, f2: 0 }], dur: 1300, hl: ['thigh1', 'hip'], props: [{ t: 'pack', at: 'ha1' }], anchor: 'an1' },
  donkey: { frames: [QUAD, { ...QUAD, t1: -95, s1: 175, ft1: 85 }], dur: 900, hl: ['hip'], anchor: 'ha1' },
  vacuum: { frames: [{ T: 3, a1: 20, f1: 80, a2: 18, f2: 78 }, { T: 3, a1: 20, f1: 80, a2: 18, f2: 78 }], dur: 1600, hl: ['trunk'], props: [{ t: 'belly' }], hold: true },
  sunSalute: { frames: [{ a1: 175, f1: 178, a2: 172, f2: 176 }, { T: 150, a1: 0, f1: 0, a2: 2, f2: 2 }, { ...PLANK }, { ...PRONE, T: 55, a1: 10, f1: 0, a2: 10, f2: 0 }, { T: 132, t1: -48, s1: -48, t2: -48, s2: -48, a1: 0, f1: 0, a2: 2, f2: 2, ft1: 10, ft2: 10 }, { a1: 175, f1: 178, a2: 172, f2: 176 }], dur: 1300, hl: ['trunk'] },
  warrior: { front: true, frames: [{ t1: 55, s1: 5, t2: -35, s2: -35, a1: 90, f1: 90, a2: -90, f2: -90, N: 0 }, { T: 45, t1: 40, s1: 40, t2: -35, s2: -35, a1: 20, f1: 20, a2: 200, f2: 200 }], dur: 2200, hl: ['thigh1'], hold: true },
  tree: { front: true, frames: [{ T: -2, t2: -60, s2: 50, ft2: 60, a1: 172, f1: 200, a2: -172, f2: -200 }, { T: 2, t2: -60, s2: 50, ft2: 60, a1: 170, f1: 198, a2: -170, f2: -198 }], dur: 1500, hl: ['shin1'], anchor: 'an1', hold: true },
  lowLunge: { frames: [{ T: 0, t1: 82, s1: -8, t2: -55, s2: -90, ft2: 180, a1: 175, f1: 178, a2: 172, f2: 176 }, { T: -8, t1: 85, s1: -10, t2: -62, s2: -90, ft2: 180, a1: 178, f1: 182, a2: 175, f2: 180 }], dur: 1800, hl: ['thigh2'], anchor: 'an1', hold: true },
  threadNeedle: { frames: [{ ...QUAD, a1: 0, f1: 0 }, { ...QUAD, T: 100, a1: -75, f1: -85, N: 20 }], dur: 1500, hl: ['trunk'], anchor: 'kn1' },
  savasana: { frames: [{ ...SUPINE, a1: 80, f1: 85 }, { ...SUPINE, a1: 80, f1: 85 }], dur: 2000, props: [{ t: 'breath' }], hold: true },
  groove: { frames: [{ T: 4, t1: 12, s1: -12, t2: 10, s2: -10, a1: 20, f1: 60, a2: -10, f2: 40 }, { T: 0, a1: 10, f1: 40, a2: -18, f2: 30 }], dur: 320, hl: ['thigh1'] },
  chest: { frames: [{ T: -6, N: 6, a1: 6, f1: 10 }, { T: 10, N: -8, a1: 6, f1: 10 }], dur: 450, hl: ['trunk'], anchor: 'an1' },
  hips: { front: true, frames: [{ x: 92, T: 8, t1: 12, s1: -8, t2: 2, s2: -2, a1: 25, f1: 70, a2: -25, f2: -70 }, { x: 100, T: 0, t1: 8, s1: -8, t2: -8, s2: 8, a1: 25, f1: 70, a2: -25, f2: -70, lift: -2 }, { x: 108, T: -8, t1: -2, s1: 2, t2: -12, s2: 8, a1: 25, f1: 70, a2: -25, f2: -70 }, { x: 100, T: 0, t1: 6, s1: -6, t2: -6, s2: 6, a1: 25, f1: 70, a2: -25, f2: -70, lift: 1 }], dur: 420, hl: ['hip'] },
  bodyRoll: { frames: [{ T: -10, N: 8 }, { T: 12, N: -6 }, { T: -6, t1: -10, s1: 6, t2: -10, s2: 6 }, { T: 6, t1: 25, s1: -30, t2: 25, s2: -30 }], dur: 380, hl: ['trunk'], anchor: 'an1' },
  stepTouch: { front: true, frames: [{ x: 92, t1: 4, t2: -4, a1: 40, f1: 90, a2: -20, f2: -60 }, { x: 100, t1: 18, s1: -10, t2: -18, s2: 10, a1: 20, f1: 60, a2: -40, f2: -90 }, { x: 108, t1: 4, t2: -4, a1: 20, f1: 60, a2: -40, f2: -90 }, { x: 100, t1: 18, s1: -10, t2: -18, s2: 10, a1: 40, f1: 90, a2: -20, f2: -60 }], dur: 320, hl: ['thigh1'] },
  pivot: { front: true, frames: [{ sx: 1, a1: 60, f1: 120, a2: -60, f2: -120, ft1: 60 }, { sx: 0.1, a1: 60, f1: 120, a2: -60, f2: -120, ft1: 40, ft2: 40 }, { sx: -1, a1: 60, f1: 120, a2: -60, f2: -120, ft1: 60 }, { sx: 1, a1: 60, f1: 120, a2: -60, f2: -120 }], dur: 300, hl: ['shin1'] },
  releve: { front: true, frames: [{ a1: 30, f1: 90, a2: -30, f2: -90 }, { ft1: 25, ft2: -25, a1: 170, f1: 195, a2: -170, f2: -195 }], dur: 1100, hl: ['shin1', 'shin2'], anchor: 'to1' },
  freestyle: { front: true, frames: [{ x: 94, T: 6, t1: 15, s1: -10, a1: 150, f1: 200, a2: -30, f2: -80 }, { x: 100, T: -6, t2: -15, s2: 10, a1: 40, f1: 100, a2: -150, f2: -200 }, { x: 106, T: 4, t1: 12, s1: -12, t2: -12, s2: 12, a1: 90, f1: 140, a2: -90, f2: -140, lift: 4 }, { x: 100, T: 0, a1: 20, f1: 60, a2: -20, f2: -60 }], dur: 340, hl: ['trunk'] },
  plie: { front: true, frames: [{ t1: 18, s1: 18, t2: -18, s2: -18, ft1: 135, ft2: -135, a1: 80, f1: 95, a2: -80, f2: -95 }, { t1: 68, s1: 14, t2: -68, s2: -14, ft1: 135, ft2: -135, a1: 80, f1: 95, a2: -80, f2: -95 }], dur: 1000, hl: ['thigh1', 'thigh2'] },
  plieReleve: { front: true, frames: [{ t1: 62, s1: 14, t2: -62, s2: -14, ft1: 40, ft2: -40, a1: 80, f1: 95, a2: -80, f2: -95 }, { t1: 56, s1: 12, t2: -56, s2: -12, ft1: 35, ft2: -35, a1: 80, f1: 95, a2: -80, f2: -95 }], dur: 280, hl: ['thigh1', 'thigh2', 'shin1', 'shin2'] },
  arabesque: { frames: [{ T: 12, a1: 30, f1: 30, a2: 32, f2: 32, t2: -18, s2: -18, ft2: -30 }, { T: 22, a1: 40, f1: 40, a2: 42, f2: 42, t2: -58, s2: -58, ft2: -70 }], dur: 900, hl: ['thigh2', 'hip'], props: [{ t: 'box', under: 'ha1', w: 18 }], anchor: 'an1' },
  sideLeg: { front: true, frames: [{ a1: 40, f1: 70, a2: -60, f2: -110, t2: -4, s2: -4, ft2: -120 }, { T: 6, a1: 40, f1: 70, a2: -60, f2: -110, t2: -55, s2: -55, ft2: -150 }], dur: 900, hl: ['thigh2'], anchor: 'an1' },
  portDeBras: { front: true, frames: [{ a1: 20, f1: 40, a2: -20, f2: -40 }, { a1: 85, f1: 100, a2: -85, f2: -100 }, { a1: 165, f1: 200, a2: -165, f2: -200 }, { a1: 85, f1: 100, a2: -85, f2: -100 }], dur: 1100, hl: ['arm1', 'arm2'] },
  warmup: { frames: [{ T: 8, t1: 40, s1: -30, a1: -30, f1: 60, a2: 30, f2: 100 }, { T: 8, t2: 40, s2: -30, a1: 30, f1: 100, a2: -30, f2: 60 }], dur: 350 },
};

// Ejercicios de pies: un pie de perfil (o desde arriba) en primer plano.
const FOOT_MOTIONS = { shortFoot: 'arch', toeYoga: 'bigtoe', towel: 'curl', toeSpread: 'spread' };

const EXERCISE_MOTION = {
  'Aterrizaje controlado → salto': 'landing', 'Sentadilla con salto': 'jumpSquat', 'Sentadilla búlgara': 'bulgarian',
  'Puente de glúteo': 'bridge', 'Curl nórdico': 'nordic', 'Sentadilla isométrica en pared': 'wallSit',
  'Elevación de talones': 'calfRaise', 'Equilibrio a una pierna': 'balance', 'Pie corto (short foot)': 'shortFoot', 'Yoga de dedos': 'toeYoga',
  'Flexión explosiva': 'pushupPlyo', 'Lanzamiento de balón a la pared': 'wallThrow', 'Flexiones': 'pushup',
  'Remo bajo mesa o con mochila': 'rowTable', 'Pike push-up': 'pike', 'Rotación externa de lado': 'extRot', 'Y-T-W boca abajo': 'ytw',
  'Bird dog': 'birdDog', 'Plancha con toque de hombro': 'shoulderTap', 'Recoger toalla con los dedos': 'towel', 'Separar los dedos': 'toeSpread',
  'Curl-up de McGill': 'curlUp', 'Plancha lateral': 'sidePlank', 'Dead bug': 'deadBug', 'Superman': 'superman',
  'Desplazamiento de defensa': 'shuffle', 'Pies rápidos en escalera imaginaria': 'quickFeet', 'Salto lateral y caída a una pierna': 'lateralHop',
  'Caminar de puntillas y de talones': 'heelToe', 'Elevación de talones con pelota': 'calfBall', 'HIIT final': 'jacks',
  'Flexiones con mochila': 'pushupPack', 'Remo a una mano con mochila': 'rowOne', 'Elevaciones laterales': 'lateral',
  'Fondos en silla': 'dips', 'Curl de bíceps con mochila': 'curl',
  'Sentadilla goblet con mochila': 'squat', 'Hip thrust con mochila': 'hipThrust', 'Sentadilla búlgara con mochila': 'bulgarian',
  'Peso muerto rumano a una pierna': 'rdl', 'Patada de glúteo en cuadrupedia': 'donkey', 'Elevación de talones a una pierna': 'calfSingle',
  'Crunch invertido': 'reverseCrunch', 'Vacío abdominal': 'vacuum',
  'Saludo al sol': 'sunSalute', 'Guerrero II y triángulo': 'warrior', 'Postura del árbol': 'tree', 'Estocada baja y media paloma': 'lowLunge',
  'Puente y torsión acostado': 'bridge', 'Hilo en la aguja (hombros)': 'threadNeedle', 'Respiración en savasana': 'savasana',
  'Marcar el pulso (groove)': 'groove', 'Aislamiento de pecho': 'chest', 'Cadera: círculos y ochos': 'hips', 'Body roll': 'bodyRoll',
  'Pliés en segunda': 'plie', 'Relevé en primera': 'releve', 'Arabesque con silla': 'arabesque', 'Elevación lateral de pierna': 'sideLeg',
  'Pulsos en plié con relevé': 'plieReleve', 'Port de bras': 'portDeBras',
  'Pasos base en combinación': 'stepTouch', 'Giros con punto fijo': 'pivot', 'Equilibrio en puntillas': 'releve', 'Freestyle': 'freestyle',
};

/* ---------- Dibujo ---------- */

const SEGMENTS = [
  ['arm2', 'sh', 'el2', 2], ['fore2', 'el2', 'ha2', 2], ['thigh2', 'hip', 'kn2', 2], ['shin2', 'kn2', 'an2', 2], ['foot2', 'an2', 'to2', 2],
  ['trunk', 'hip', 'sh', 0], ['neckS', 'sh', 'neck', 0],
  ['thigh1', 'hip', 'kn1', 1], ['shin1', 'kn1', 'an1', 1], ['foot1', 'an1', 'to1', 1], ['arm1', 'sh', 'el1', 1], ['fore1', 'el1', 'ha1', 1],
];
const WIDTH = { trunk: 9, neckS: 5, thigh1: 7.5, thigh2: 7.5, shin1: 6, shin2: 6, arm1: 5.5, arm2: 5.5, fore1: 5, fore2: 5, foot1: 4.5, foot2: 4.5 };

function hlMatch(seg, hl, front) {
  if (!hl) return false;
  if (hl.includes(seg)) return true;
  // En vista frontal o con ambos lados trabajando, colorea el par
  const pair = seg.replace(/2$/, '1');
  if (front && hl.includes(pair)) return true;
  if (seg.startsWith('fore') && hl.includes(seg.replace('fore', 'arm'))) return true;
  if (seg === 'trunk' && hl.includes('hip')) return false;
  return false;
}

function propSvg(pr, J, J0) {
  const pt = k => k === 'mid' ? { x: (J.hip.x + J.sh.x) / 2, y: (J.hip.y + J.sh.y) / 2 } : J[k];
  const st = k => J0[k];
  switch (pr.t) {
    case 'pack': { const p = pt(pr.at); return `<rect x="${p.x - 7}" y="${p.y - 6}" width="14" height="13" rx="3.5" class="m-prop-acc"/>`; }
    case 'bottle': { const p = pt(pr.at); return `<rect x="${p.x - 3}" y="${p.y - 6}" width="6" height="12" rx="2" class="m-prop-acc"/>`; }
    case 'ball': { const p = pt(pr.at); return `<circle cx="${p.x}" cy="${p.y}" r="${pr.r || 6}" class="m-prop-acc"/>`; }
    case 'box': { const p = st(pr.under); const w = pr.w || 24; const top = p.y + 1; return `<rect x="${p.x - w / 2}" y="${top}" width="${w}" height="${Math.max(2, GROUND - top)}" rx="3" class="m-prop"/>`; }
    case 'step': { const p = st(pr.at); return `<rect x="${p.x - 14}" y="${GROUND - 2}" width="26" height="2" class="m-prop"/>`; }
    case 'bar': { const p = st(pr.at); return `<line x1="${p.x - 26}" y1="${p.y - 2}" x2="${p.x + 26}" y2="${p.y - 2}" class="m-line" stroke-width="5"/><line x1="${p.x + 22}" y1="${p.y}" x2="${p.x + 22}" y2="${GROUND}" class="m-line" stroke-width="3"/>`; }
    case 'wall': { const x = pr.x ?? (st(pr.at).x + (pr.dx || 0)); return `<rect x="${x - 4}" y="40" width="4" height="${GROUND - 40}" class="m-prop"/>`; }
    case 'couch': { const p = st(pr.at); return `<rect x="${p.x - 18}" y="${p.y - 10}" width="22" height="7" rx="3" class="m-prop"/>`; }
    case 'belly': { const mx = (J.hip.x + J.sh.x) / 2 + 6, my = (J.hip.y + J.sh.y) / 2 + 4; return `<ellipse cx="${mx}" cy="${my}" rx="5" ry="7" class="m-prop-acc m-pulse-in"/>`; }
    case 'breath': { return `<circle cx="100" cy="70" r="12" class="m-breath"/>`; }
    default: return '';
  }
}

function figureSvg(m, pose, J0) {
  const J = joints(pose);
  const parts = [`<line x1="10" y1="${GROUND + 1}" x2="190" y2="${GROUND + 1}" class="m-floor"/>`];
  (m.props || []).filter(p => ['box', 'step', 'bar', 'wall', 'couch', 'breath'].includes(p.t)).forEach(p => parts.push(propSvg(p, J, J0)));
  SEGMENTS.forEach(([name, a, b, side]) => {
    const far = side === 2 && !m.front;
    const hot = hlMatch(name, m.hl, m.front) || (name === 'trunk' && m.hl && m.hl.includes('trunk')) || ((name === 'thigh1' || name === 'thigh2') && m.hl && m.hl.includes('hip') && false);
    parts.push(`<line x1="${J[a].x.toFixed(1)}" y1="${J[a].y.toFixed(1)}" x2="${J[b].x.toFixed(1)}" y2="${J[b].y.toFixed(1)}" stroke-width="${WIDTH[name]}" class="m-seg ${far ? 'far' : ''} ${hot ? 'hot' : ''}"/>`);
  });
  parts.push(`<circle cx="${J.head.x.toFixed(1)}" cy="${J.head.y.toFixed(1)}" r="${LEN.head}" class="m-head"/>`);
  (m.props || []).filter(p => ['pack', 'bottle', 'ball', 'belly'].includes(p.t)).forEach(p => parts.push(propSvg(p, J, J0)));
  if (m.hl && m.hl.includes('hip')) parts.push(`<circle cx="${J.hip.x}" cy="${J.hip.y}" r="6.5" class="m-hot-dot"/>`);
  return parts.join('');
}

function footSvg(kind, t) {
  // t: 0..1 (fase del movimiento)
  const s = ease(t);
  if (kind === 'spread') {
    const toes = [[-18, 6.5], [-7, 5], [2, 4.6], [10, 4.2], [17, 3.6]];
    return `<path d="M70 125 C66 95 72 62 100 58 C128 62 134 95 130 125 C127 140 73 140 70 125Z" class="m-foot"/>
      ${toes.map(([dx, r], i) => `<circle cx="${100 + dx * (1 + s * 0.35)}" cy="${48 - (i === 0 ? 2 : 0) + Math.abs(dx) * 0.12}" r="${r}" class="m-foot"/>`).join('')}
      <text x="100" y="152" class="m-cap">Abre los dedos</text>`;
  }
  const arch = kind === 'arch' ? 6 + s * 12 : 6;
  const toeAng = kind === 'bigtoe' ? -s * 28 : kind === 'curl' ? s * 35 : 0;
  const tx = 150, ty = 120;
  const tipX = tx + 22 * Math.cos(rad(toeAng)), tipY = ty - 22 * Math.sin(rad(-toeAng)) * -1;
  return `<line x1="20" y1="${GROUND - 9}" x2="190" y2="${GROUND - 9}" class="m-floor"/>
    <path d="M40 120 C40 104 52 98 62 96 L70 72 L88 72 L92 96 C110 ${120 - arch} 128 ${120 - arch} ${tx} ${ty} L${tx} 131 L44 131 C40 131 40 126 40 120Z" class="m-foot"/>
    <line x1="${tx}" y1="${ty + 6}" x2="${tipX}" y2="${tipY + 6}" stroke-width="11" class="m-seg hot"/>
    ${kind === 'curl' ? `<path d="M${tx - 6} 131 Q${tx + 30 - s * 18} ${131 - s * 6} 190 131" class="m-towel"/>` : ''}
    <text x="100" y="40" class="m-cap">${kind === 'arch' ? 'El arco sube, los dedos quedan planos' : kind === 'bigtoe' ? 'Solo sube el dedo gordo' : 'Los dedos arrastran la toalla'}</text>`;
}

/* ---------- Reproductor ---------- */

let ANIM = null;

function exerciseMotionKey(name) {
  return EXERCISE_MOTION[name] || 'warmup';
}

function startMotion(svg, key) {
  stopMotion();
  const footKind = FOOT_MOTIONS[key];
  const m = MOTIONS[key] || MOTIONS.warmup;
  const frames = m.frames;
  const J0 = joints(frames[0]);
  const anchor = m.anchor;
  const anchor0 = anchor ? { ...J0[anchor] } : null;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  const seg = footKind ? 1200 : m.dur;
  const loop = (now) => {
    const total = footKind ? seg * 2 : seg * frames.length;
    const el = reduce ? total * 0.25 : (now - start) % total;
    if (footKind) {
      const ph = el / seg; const t = ph < 1 ? ph : 2 - ph;
      svg.innerHTML = footSvg(footKind, t);
    } else {
      const i = Math.floor(el / seg), t = ease((el % seg) / seg);
      const a = frames[i], b = frames[(i + 1) % frames.length];
      let pose = lerpPose(a, b, t);
      if (anchor) {
        const Jt = joints(pose);
        pose = { ...pose, x: pose.x + (anchor0.x - Jt[anchor].x), lift: pose.lift + (Jt[anchor].y - anchor0.y) };
      }
      svg.innerHTML = figureSvg(m, pose, J0);
    }
    if (!reduce) ANIM = requestAnimationFrame(loop);
  };
  ANIM = requestAnimationFrame(loop);
}

function stopMotion() {
  if (ANIM) cancelAnimationFrame(ANIM);
  ANIM = null;
}
