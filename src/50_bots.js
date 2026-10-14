// ============================================================================
// FRANCY WARFRONT — src/50_bots.js  (versione 2: soldati più chiari e realistici)
// Soldati 3D procedurali (niente skinning: gerarchia di Object3D + IK a due
// ossa per braccia e gambe) e IA di squadra. Niente sangue: solo un lampo.
// 14 mesh per soldato: ogni osso è UNA mesh unita (mergeGeometries) con colori
// per vertice e un solo materiale per squadra (atlante: mimetica / tinta unita /
// fascia di squadra emissiva / lenti lucide).
// ============================================================================
const bot_V = () => new THREE.Vector3();
const bot_v1 = bot_V(), bot_v2 = bot_V(), bot_v3 = bot_V(), bot_v4 = bot_V(), bot_v5 = bot_V(), bot_v6 = bot_V(), bot_sc = bot_V();
const bot_DOWN = new THREE.Vector3(0, -1, 0), bot_m4 = new THREE.Matrix4(), bot_qt = new THREE.Quaternion(), bot_eu = new THREE.Euler(), bot_col = new THREE.Color();
const bot_TAU = Math.PI * 2;
const bot_clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const bot_lerp = (a, b, t) => a + (b - a) * t;
const bot_ss = (t, a, b) => { t = bot_clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bot_angDiff = (a, b) => { let d = (b - a) % bot_TAU; if (d > Math.PI) d -= bot_TAU; else if (d < -Math.PI) d += bot_TAU; return d; };
function bot_mkRng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function bot_sfx(n, p, v) { if (typeof SFX !== 'undefined' && SFX && SFX.play) SFX.play(n, p, v); }
function bot_def(id) {
  const d = (typeof WPN_DEFS !== 'undefined' && WPN_DEFS) ? WPN_DEFS.find(x => x.id === id) : null;
  return d || { id, name: id, damage: 22, rpm: 600, mag: 30, reload: 2.4, range: 120, pellets: 1, auto: true };
}
function bot_snap(v) { const n = G.nav; if (n && n.nearest && n.points) { const p = n.points[n.nearest(v)]; if (p) v.copy(p); } return v; }

// ---------------------------------------------------------------- tabelle IA
const bot_DIFF = {
  react: [0.9, 0.7, 0.5, 0.32, 0.18], err: [7, 5.2, 3.6, 2.2, 1.2], pause: [1.8, 1.4, 1.1, 0.85, 0.65],
  cover: [0.25, 0.45, 0.65, 0.85, 0.97], gCd: [40, 26, 18, 13, 9], gCh: [0.06, 0.14, 0.24, 0.36, 0.5],
  turn: [5, 6.5, 8, 10.5, 13], lead: [0, 0, 0, 0.6, 1], aggr: [0.3, 0.45, 0.6, 0.75, 0.9], head: [0, 0.04, 0.1, 0.2, 0.35]
};
const bot_D = () => bot_clamp(Math.round((G.settings && G.settings.difficulty) || 3), 1, 5) - 1;
const bot_ROLE = {
  AR: { ideal: 28, burst: [3, 6], pause: 0.45 }, SMG: { ideal: 14, burst: [5, 9], pause: 0.3 },
  SHOTGUN: { ideal: 7, burst: [1, 1], pause: 0.15 }, SNIPER: { ideal: 60, burst: [1, 1], pause: 0.9 },
  LMG: { ideal: 32, burst: [8, 16], pause: 0.6 }
};
const bot_WPN_BAG = ['AR', 'AR', 'AR', 'AR', 'AR', 'SMG', 'SMG', 'SMG', 'SHOTGUN', 'SHOTGUN', 'SNIPER', 'SNIPER', 'LMG', 'LMG'];
const bot_RANKS = ['Sdt.', 'Cpl.', 'Cpl.', 'Sgt.', 'Sgt.', 'Mar.', 'Ten.', 'Cap.'];
const bot_NAMES = ['Ferro', 'Neri', 'Rossi', 'Bianchi', 'Greco', 'Conti', 'Marino', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'Marchetti', 'Parisi', 'Villa', 'Conte', 'Ferraro', 'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini', 'Messina', 'Sala'];
const bot_name = k => bot_RANKS[(k * 5 + 3) % bot_RANKS.length] + ' ' + bot_NAMES[(k * 7) % bot_NAMES.length];

// stato condiviso: rumori di sparo, avvistamenti di squadra, info mappa
const bot_noise = []; for (let i = 0; i < 16; i++) bot_noise.push({ x: 0, y: 0, z: 0, t: -99, ent: null });
let bot_noiseI = 0, bot_hooked = false, bot_warned = false, bot_idSeq = 1, bot_pathBudget = 0, bot_uvk = 0;
const bot_intel = { blue: { p: bot_V(), t: -99 }, red: { p: bot_V(), t: -99 } };
const bot_side = { blue: bot_V(), red: bot_V(), mid: bot_V(), high: [], B: { minX: -60, maxX: 60, minZ: -60, maxZ: 60 } };
const bot_cI = new Int32Array(8), bot_cD = new Float32Array(8);

function bot_noiseAdd(ent, o) { const n = bot_noise[bot_noiseI = (bot_noiseI + 1) & 15]; n.x = o.x; n.y = o.y; n.z = o.z; n.t = G.time || 0; n.ent = ent; }
function bot_hookShots() {          // ascolta TUTTI gli spari (anche quelli del giocatore)
  if (bot_hooked || typeof WPN === 'undefined' || !WPN || !WPN.fireFrom) return;
  try {
    const orig = WPN.fireFrom;
    if (!orig.bot_hook) { const f = function (ent, id, o, d) { if (ent && o) bot_noiseAdd(ent, o); return orig.apply(this, arguments); }; f.bot_hook = true; WPN.fireFrom = f; }
    bot_hooked = WPN.fireFrom.bot_hook === true;
  } catch (e) { bot_hooked = false; }
}
function bot_fire(b, id, o, d) {
  try { if (!bot_hooked) bot_noiseAdd(b, o); WPN.fireFrom(b, id, o, d); }
  catch (e) { if (!bot_warned) { bot_warned = true; console.warn('BOT: errore nello sparo', e); } }
}
function bot_mapInfo() {
  const mp = G.map || {}, sp = mp.spawns || {}, B = mp.bounds || bot_side.B;
  bot_side.B = B; bot_side.mid.set((B.minX + B.maxX) / 2, 0, (B.minZ + B.maxZ) / 2);
  for (const t of ['blue', 'red']) {
    const c = bot_side[t].set(0, 0, 0), L = sp[t] || [];
    for (const p of L) c.add(p);
    if (L.length) c.multiplyScalar(1 / L.length); else c.set(bot_side.mid.x, 0, t === 'blue' ? B.maxZ - 8 : B.minZ + 8);
  }
  bot_side.high.length = 0;
  const pts = G.nav && G.nav.points; if (pts) for (const p of pts) if (p.y > 2.6) bot_side.high.push(p);
  bot_intel.blue.t = bot_intel.red.t = -99;
}
function bot_spawnPt(team, i, out) {
  const L = G.map && G.map.spawns && G.map.spawns[team];
  if (!L || !L.length) return out.set((i % 6 - 2.5) * 2, 0, team === 'blue' ? 40 : -40);
  const p = L[i % L.length], k = (i / L.length) | 0; return out.set(p.x + k * 0.9, p.y || 0, p.z + k * 0.6);
}

// ------------------------------------------------- texture mimetica (atlante)
// Atlante 512x256, 4 zone in orizzontale:
//   u 0.00-0.50  mimetica (ripete in verticale)
//   u 0.50-0.75  bianco: tinta unita data dal colore per vertice
//   u 0.75-0.875 fascia di squadra (accesa nella mappa emissiva)
//   u 0.875-1.0  lenti: lucide e metalliche (riflettono il cielo)
// I colori sono dati in LINEARE e convertiti in sRGB per il canvas.
function bot_css(r, g, b) {
  const f = c => { c = bot_clamp(c, 0, 1); return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255); };
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}
function bot_atlas(cols, seed, band) {
  const mk = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; return c; };
  const c = mk(), g = c.getContext('2d'), r = bot_mkRng(seed), css = cols.map(k => bot_css(k[0], k[1], k[2]));
  g.fillStyle = css[0]; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 96; i++) {
    g.fillStyle = css[1 + (i % (css.length - 1))];
    const x = r() * 256, y = r() * 256, n = 5 + ((r() * 4) | 0), rad = 9 + r() * 22;
    for (let oy = -256; oy <= 256; oy += 256) {
      g.beginPath();
      for (let k = 0; k < n; k++) { const a = k / n * bot_TAU, rr = rad * (0.55 + ((k * 7 + i) % 5) * 0.14); g.lineTo(x + Math.cos(a) * rr * 1.5, y + oy + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    }
  }
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1); }
  for (let i = 0; i < 10; i++) {      // sporco leggero
    g.fillStyle = 'rgba(125,105,80,0.07)'; g.beginPath(); g.arc(r() * 256, r() * 256, 12 + r() * 26, 0, bot_TAU); g.fill();
  }
  g.fillStyle = '#fff'; g.fillRect(256, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
  // emissiva: 0.04 ovunque (leggibili in ombra) + fascia di squadra a 0.6
  const e = mk(), ge = e.getContext('2d');
  ge.fillStyle = bot_css(0.04, 0.04, 0.04); ge.fillRect(0, 0, 512, 256);
  ge.fillStyle = bot_css(band[0] * 0.6, band[1] * 0.6, band[2] * 0.6); ge.fillRect(384, 0, 64, 256);
  const em = new THREE.CanvasTexture(e); em.colorSpace = THREE.SRGBColorSpace; em.wrapT = THREE.RepeatWrapping;
  // G = roughness, B = metalness
  const o = mk(), go = o.getContext('2d');
  go.fillStyle = 'rgb(255,217,5)'; go.fillRect(0, 0, 512, 256);
  go.fillStyle = 'rgb(255,166,0)'; go.fillRect(384, 0, 64, 256);
  go.fillStyle = 'rgb(255,36,170)'; go.fillRect(448, 0, 64, 256);
  const orm = new THREE.CanvasTexture(o); orm.wrapT = THREE.RepeatWrapping;
  return { tex, em, orm };
}

// ------------------------------------------------------- mattoncini geometria
function bot_rbox(w, h, d, r) {      // scatola con spigoli smussati
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), p = g.attributes.position, hx = w / 2, hy = h / 2, hz = d / 2;
  r = Math.min(r === undefined ? 0.012 : r, hx * 0.9, hy * 0.9, hz * 0.9);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = Math.sign(x) * (hx - r), cy = Math.sign(y) * (hy - r), cz = Math.sign(z) * (hz - r);
    const dx = Math.abs(x) < hx - 1e-5 ? 0 : x - cx, dy = Math.abs(y) < hy - 1e-5 ? 0 : y - cy, dz = Math.abs(z) < hz - 1e-5 ? 0 : z - cz;
    const l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, cx + dx / l * r, cy + dy / l * r, cz + dz / l * r);
  }
  g.computeVertexNormals(); return g;
}
function bot_wrinkle(g, wr) {        // pieghe del tessuto: gonfia/sgonfia il raggio
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
    const k = 1 + wr * (Math.sin(y * 46 + a * 2) * 0.6 + Math.sin(y * 83 - a * 3 + 1.3) * 0.4);
    p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals(); return g;
}
function bot_tube(rt, rb, h, wr, seg, hs) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg || 10, hs || 4);
  return wr ? bot_wrinkle(g, wr) : g;
}
function bot_limb(pts, seg, wr) {    // arto rastremato: profilo [raggio, y] con y CRESCENTE
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 10);
  return wr ? bot_wrinkle(g, wr) : g;
}
const bot_sph = (r, w, h) => new THREE.SphereGeometry(r, w || 10, h || 8);
// col: esadecimale sRGB oppure [r,g,b] lineare.
// camo: 0 = tinta unita, 2 = fascia squadra (emissiva), 3 = lente lucida, (0..1] = scala mimetica
function bot_add(L, g, col, camo, x, y, z, rx, ry, rz, sx, sy, sz) {
  bot_m4.compose(bot_v1.set(x || 0, y || 0, z || 0), bot_qt.setFromEuler(bot_eu.set(rx || 0, ry || 0, rz || 0)), bot_sc.set(sx || 1, sy || 1, sz || 1));
  g.applyMatrix4(bot_m4);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), uv = g.attributes.uv, isCamo = camo > 0 && camo <= 1;
  const off = isCamo ? ((bot_uvk++ * 0.37) % 1) * (1 - camo) : 0, pu = camo === 2 ? 0.8125 : camo === 3 ? 0.9375 : 0.625;
  if (Array.isArray(col)) bot_col.setRGB(col[0], col[1], col[2]); else bot_col.set(col);
  for (let i = 0; i < n; i++) {
    c[i * 3] = bot_col.r; c[i * 3 + 1] = bot_col.g; c[i * 3 + 2] = bot_col.b;
    if (isCamo) uv.setXY(i, 0.03 + 0.44 * (uv.getX(i) * camo + off), uv.getY(i) * camo * 1.3 + off * 3);
    else uv.setXY(i, pu, 0.5);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); L.push(g);
}
function bot_merge(L) { const g = mergeGeometries(L, false); for (const s of L) s.dispose(); g.computeBoundingSphere(); return g; }
const bot_HELM = [[0.127, -0.012], [0.131, 0], [0.13, 0.035], [0.12, 0.075], [0.097, 0.108], [0.06, 0.13], [0.02, 0.14], [0.0005, 0.141]].map(p => new THREE.Vector2(p[0], p[1]));

// Palette: mimetiche in lineare (chiare: mai sotto 0.12), equipaggiamento in sRGB.
const bot_PAL = {
  blue: {   // woodland + ranger green chiaro
    camo: [[0.32, 0.36, 0.22], [0.38, 0.29, 0.18], [0.62, 0.55, 0.40], [0.15, 0.20, 0.12], [0.26, 0.31, 0.17]], seed: 11, band: [0.15, 0.35, 0.9],
    vest: 0x8c9070, pouch: 0x7b8062, dark: 0x5f605a, boot: 0x8a6f52, sole: 0x56534e, glove: 0x716d5a, face: 0x6b7059, lens: 0x9db4c2,
    strap: 0x777b5f, lace: 0xa89a7c, metal: 0x8b8b82, mag: 0x5e5f5c, skin: [0.55, 0.40, 0.32], nade: 0x6c7256
  },
  red: {    // deserto / grigio urbano + coyote
    camo: [[0.62, 0.55, 0.42], [0.46, 0.39, 0.29], [0.40, 0.39, 0.37], [0.70, 0.65, 0.54], [0.27, 0.24, 0.20]], seed: 23, band: [0.9, 0.15, 0.1],
    vest: 0xb09468, pouch: 0x9c8460, dark: 0x676158, boot: 0xa08666, sole: 0x5a544c, glove: 0x877861, face: 0x8c8474, lens: 0xc4a888,
    strap: 0x8e7c5e, lace: 0xc2b598, metal: 0x8e8a80, mag: 0x625f5a, skin: [0.55, 0.40, 0.32], nade: 0x7c7460
  }
};
const bot_KITS = {};
function bot_teamKit(team) {
  if (bot_KITS[team]) return bot_KITS[team];
  const P = bot_PAL[team], at = bot_atlas(P.camo, P.seed, P.band), geo = {}, W = 0xffffff, Wd = 0xdcdcdc, PI = Math.PI, BD = P.band;
  let L = []; const A = (...a) => bot_add(L, ...a);

  // --- bacino (origine = altezza anche)
  A(bot_rbox(0.34, 0.21, 0.225, 0.07), W, 0.8, 0, 0.03, 0);
  for (const s of [-1, 1]) A(bot_sph(0.1), W, 0.5, s * 0.095, -0.04, 0.008, 0, 0, 0, 1.02, 1.12, 1.1);
  A(bot_rbox(0.365, 0.05, 0.245, 0.016), P.dark, 0, 0, 0.118, 0);                       // cinturone
  A(bot_rbox(0.05, 0.04, 0.012, 0.004), P.metal, 0, 0, 0.118, -0.125);                  // fibbia
  A(bot_rbox(0.1, 0.15, 0.07, 0.02), P.pouch, 0, -0.205, 0.035, 0.03);                  // tasca utility sinistra
  A(bot_rbox(0.104, 0.035, 0.075, 0.01), P.strap, 0, -0.207, 0.105, 0.03);
  A(bot_rbox(0.16, 0.12, 0.055, 0.025), P.pouch, 0, 0, 0.04, 0.135);                    // tasca posteriore
  A(bot_rbox(0.055, 0.19, 0.095, 0.015), P.dark, 0, 0.203, -0.03, 0);                   // fondina
  A(bot_rbox(0.035, 0.07, 0.05, 0.01), P.mag, 0, 0.207, 0.1, 0.03, 0.3);
  geo.pelvis = bot_merge(L);

  // --- busto (origine = vita): torace a botte, spalle tonde, collo, plate carrier, radio, zainetto
  L = [];
  A(bot_limb([[0.15, 0], [0.156, 0.08], [0.165, 0.17], [0.182, 0.26], [0.19, 0.34], [0.18, 0.41], [0.14, 0.46], [0.085, 0.495], [0.06, 0.51]], 12, 0.018),
    W, 0.9, 0, 0, 0, 0, 0, 0, 1, 1, 0.72);
  A(bot_tube(0.068, 0.08, 0.04, 0, 12, 1), W, 0.3, 0, 0.505, 0.004);                    // colletto
  A(bot_tube(0.054, 0.06, 0.1, 0, 10, 1), P.face, 0, 0, 0.55, 0.002);                   // collo (passamontagna)
  A(bot_rbox(0.3, 0.34, 0.06, 0.028), P.vest, 0, 0, 0.285, -0.128, -0.04);              // piastra davanti
  A(bot_rbox(0.3, 0.36, 0.06, 0.028), P.vest, 0, 0, 0.29, 0.125, 0.04);                 // piastra dietro
  for (const s of [-1, 1]) {
    A(bot_sph(0.07), W, 0.4, s * 0.115, 0.455, 0.012, 0, 0, 0, 1.5, 0.62, 1.15);        // trapezio
    A(bot_sph(0.084), W, 0.45, s * 0.2, 0.42, 0, 0, 0, 0, 1, 1.05, 1.05);               // deltoide
    A(bot_rbox(0.07, 0.03, 0.28, 0.013), P.vest, 0, s * 0.105, 0.495, -0.002);          // spallacci
    A(bot_rbox(0.03, 0.15, 0.26, 0.012), P.vest, 0, s * 0.172, 0.19, 0);                // fascione laterale
    A(bot_rbox(0.05, 0.11, 0.11, 0.016), P.pouch, 0, s * 0.205, 0.18, 0.012);           // tasche laterali
    A(bot_sph(0.032, 8, 6), P.nade, 0, s * 0.135, 0.085, -0.135, 0, 0, 0, 1, 1.25, 1);
  }
  for (let i = -1; i <= 1; i++) {                                                       // 3 porta-caricatori
    A(bot_rbox(0.08, 0.14, 0.05, 0.012), P.pouch, 0, i * 0.09, 0.18, -0.182);
    A(bot_rbox(0.058, 0.05, 0.024, 0.006), P.mag, 0, i * 0.09, 0.268, -0.184, 0.1);
    A(bot_rbox(0.03, 0.09, 0.008, 0.003), P.strap, 0, i * 0.09, 0.22, -0.21);
  }
  A(bot_rbox(0.17, 0.085, 0.03, 0.01), P.pouch, 0, 0, 0.37, -0.172);                    // tasca admin
  A(bot_rbox(0.06, 0.035, 0.006, 0.002), BD, 2, 0.045, 0.375, -0.189);                  // toppa squadra sul petto
  A(bot_rbox(0.065, 0.13, 0.04, 0.01), P.dark, 0, -0.13, 0.36, 0.168);                  // radio
  A(bot_tube(0.004, 0.006, 0.34, 0, 5, 1), P.dark, 0, -0.145, 0.59, 0.172, 0.1, 0, 0.06);
  A(bot_rbox(0.03, 0.045, 0.02, 0.006), P.dark, 0, -0.105, 0.42, -0.165);               // PTT
  A(bot_rbox(0.23, 0.3, 0.1, 0.04), Wd, 0.7, 0.02, 0.26, 0.2);                          // zainetto / idratazione
  A(bot_rbox(0.18, 0.085, 0.07, 0.02), P.pouch, 0, 0.02, 0.4, 0.2);
  A(bot_rbox(0.1, 0.06, 0.006, 0.002), BD, 2, 0.02, 0.27, 0.252);                       // toppa squadra sulla schiena
  A(bot_rbox(0.016, 0.016, 0.24, 0.006), P.dark, 0, 0.1, 0.515, 0.03, 0, 0.1);          // tubo idratazione
  geo.torso = bot_merge(L);

  // --- testa (origine = centro testa): passamontagna, striscia di pelle, occhiali, elmetto, cuffie, NVG
  L = [];
  A(bot_sph(0.098, 12, 10), P.face, 0, 0, 0, 0, 0, 0, 0, 0.93, 1.13, 1.02);
  A(bot_sph(0.07, 10, 8), P.face, 0, 0, -0.06, -0.022, 0, 0, 0, 0.95, 0.85, 1);
  A(bot_rbox(0.146, 0.058, 0.05, 0.022), P.skin, 0, 0, 0.014, -0.079);                  // pelle attorno agli occhi
  A(bot_sph(0.02, 6, 5), P.skin, 0, 0, -0.004, -0.102, 0, 0, 0, 0.8, 1.2, 1);
  A(bot_sph(0.024, 6, 5), P.face, 0, 0, -0.032, -0.093);
  A(bot_tube(0.1, 0.1, 0.024, 0, 14, 1), P.strap, 0, 0, 0.015, 0.004, 0, 0, 0, 0.95, 1, 1.03);
  A(bot_rbox(0.14, 0.008, 0.016, 0.003), P.dark, 0, 0, 0.037, -0.111);                  // montatura
  A(bot_rbox(0.016, 0.01, 0.012, 0.003), P.dark, 0, 0, 0.02, -0.112);
  A(new THREE.LatheGeometry(bot_HELM, 14), W, 0.6, 0, 0.05, 0.006, 0, 0, 0, 1, 1, 1.13);   // elmetto con telo mimetico
  A(bot_tube(0.134, 0.134, 0.016, 0, 14, 1), Wd, 0.3, 0, 0.042, 0.006, 0, 0, 0, 1, 1, 1.13);
  A(bot_tube(0.127, 0.134, 0.032, 0, 14, 1), BD, 2, 0, 0.1, 0.006, 0, 0, 0, 1, 1, 1.13);   // NASTRO di squadra sul casco
  for (const s of [-1, 1]) {
    A(bot_rbox(0.058, 0.038, 0.012, 0.005), P.lens, 3, s * 0.034, 0.016, -0.112);       // lenti (riflesso)
    A(bot_rbox(0.006, 0.008, 0.11, 0.002), P.dark, 0, s * 0.072, 0.024, -0.058);
    A(bot_rbox(0.012, 0.022, 0.12, 0.004), P.dark, 0, s * 0.133, 0.062, 0.005);         // guida laterale
    A(bot_tube(0.042, 0.042, 0.04, 0, 10, 1), P.vest, 0, s * 0.112, -0.008, 0.014, 0, 0, PI / 2);   // cuffie
    A(bot_tube(0.03, 0.03, 0.008, 0, 10, 1), P.dark, 0, s * 0.134, -0.008, 0.014, 0, 0, PI / 2);
    A(bot_rbox(0.008, 0.07, 0.014, 0.003), P.dark, 0, s * 0.128, 0.03, 0.014);
    A(bot_rbox(0.01, 0.12, 0.016, 0.004), P.strap, 0, s * 0.092, -0.045, -0.035, 0.25); // sottogola
    A(bot_tube(0.019, 0.019, 0.08, 0, 8, 1), P.dark, 0, s * 0.024, 0.215, -0.135, -0.35);   // NVG ribaltato
    A(bot_tube(0.015, 0.015, 0.006, 0, 8, 1), 0x8fbfa4, 3, s * 0.024, 0.254, -0.149, -0.35);
  }
  A(bot_rbox(0.05, 0.045, 0.02, 0.006), P.dark, 0, 0, 0.13, -0.142, 0.25);
  A(bot_rbox(0.03, 0.06, 0.03, 0.008), P.dark, 0, 0, 0.178, -0.135, 0.3);
  A(bot_rbox(0.055, 0.018, 0.035, 0.006), P.strap, 0, 0, -0.112, -0.05);
  A(bot_rbox(0.007, 0.007, 0.1, 0.002), P.dark, 0, -0.085, -0.055, -0.06, 0.2, 0.5);    // microfono
  A(bot_sph(0.012, 6, 5), P.dark, 0, -0.045, -0.062, -0.1);
  A(bot_rbox(0.035, 0.02, 0.04, 0.005), P.dark, 0, 0.03, 0.193, 0.03);
  geo.head = bot_merge(L);

  // --- braccio (origine = spalla): bicipite rastremato + FASCIA di squadra grande
  L = [];
  A(bot_sph(0.07), W, 0.4, 0, -0.012, 0);
  A(bot_limb([[0.046, -0.29], [0.049, -0.24], [0.057, -0.18], [0.064, -0.12], [0.066, -0.06], [0.06, 0]], 10, 0.03), W, 0.6);
  A(bot_tube(0.071, 0.064, 0.11, 0, 12, 1), BD, 2, 0, -0.125, 0);
  geo.armU = bot_merge(L);

  // --- avambraccio + gomitiera + mano guantata (origine = gomito)
  const mkArmL = s => {
    L = [];
    A(bot_sph(0.052), W, 0.4);
    A(bot_limb([[0.037, -0.25], [0.04, -0.2], [0.047, -0.13], [0.053, -0.06], [0.05, 0]], 10, 0.035), W, 0.6);
    A(bot_rbox(0.085, 0.1, 0.035, 0.016), P.dark, 0, 0, -0.01, 0.047);
    A(bot_sph(0.04, 8, 6), P.vest, 0, 0, -0.01, 0.06, 0, 0, 0, 0.9, 1.1, 0.45);
    A(bot_tube(0.043, 0.04, 0.045, 0, 10, 1), P.glove, 0, 0, -0.25, 0);
    A(bot_rbox(0.042, 0.095, 0.082, 0.015), P.glove, 0, 0, -0.31, 0);
    A(bot_rbox(0.046, 0.05, 0.086, 0.017), P.glove, 0, -s * 0.022, -0.365, -0.005);
    A(bot_rbox(0.022, 0.06, 0.026, 0.009), P.glove, 0, -s * 0.015, -0.315, -0.05, 0.5);
    A(bot_rbox(0.015, 0.032, 0.076, 0.005), P.dark, 0, s * 0.025, -0.335, 0);
    return bot_merge(L);
  };
  geo.armL = [mkArmL(-1), mkArmL(1)];

  // --- coscia (origine = anca): tasca cargo + pieghe al ginocchio
  const mkThigh = s => {
    L = [];
    A(bot_limb([[0.066, -0.43], [0.069, -0.37], [0.078, -0.27], [0.088, -0.16], [0.093, -0.07], [0.088, 0]], 12, 0.025), W, 0.9, 0, 0, 0, 0, 0, 0, 1, 1, 1.06);
    A(bot_tube(0.072, 0.071, 0.022, 0, 12, 1), Wd, 0.4, 0, -0.365, 0, 0.12, 0, 0, 1, 1, 1.08);
    A(bot_tube(0.071, 0.069, 0.02, 0, 12, 1), Wd, 0.4, 0, -0.4, 0, -0.1, 0, 0, 1, 1, 1.08);
    A(bot_rbox(0.036, 0.17, 0.13, 0.013), Wd, 0.4, s * 0.078, -0.25, 0.005);
    A(bot_rbox(0.042, 0.048, 0.136, 0.01), Wd, 0.3, s * 0.079, -0.172, 0.005);
    return bot_merge(L);
  };
  geo.thigh = [mkThigh(-1), mkThigh(1)];

  // --- stinco (origine = ginocchio): polpaccio, ginocchiera sporgente, gambale dello scarpone con lacci
  L = [];
  A(bot_sph(0.066), W, 0.4);
  A(bot_limb([[0.058, -0.34], [0.062, -0.31], [0.055, -0.27], [0.061, -0.2], [0.067, -0.12], [0.063, -0.04], [0.062, 0]], 10, 0.03), W, 0.7);
  A(bot_rbox(0.11, 0.135, 0.05, 0.022), P.dark, 0, 0, -0.005, -0.052);
  A(bot_sph(0.052, 8, 6), P.vest, 0, 0, -0.005, -0.072, 0, 0, 0, 0.95, 1.15, 0.55);
  A(bot_tube(0.07, 0.068, 0.02, 0, 10, 1), P.dark, 0, 0, 0.035, 0);
  A(bot_tube(0.066, 0.064, 0.02, 0, 10, 1), P.dark, 0, 0, -0.06, 0);
  A(bot_tube(0.052, 0.05, 0.12, 0, 10, 1), P.boot, 0, 0, -0.385, 0);
  for (let i = 0; i < 3; i++) A(bot_rbox(0.04, 0.007, 0.01, 0.003), P.lace, 0, 0, -0.35 - i * 0.03, -0.052);
  geo.shin = bot_merge(L);

  // --- scarpone con suola e lacci (origine = caviglia, suola a y = -0.09)
  L = [];
  A(bot_rbox(0.098, 0.085, 0.17, 0.03), P.boot, 0, 0, -0.033, -0.03);
  A(bot_sph(0.052, 8, 6), P.boot, 0, 0, -0.044, -0.125, 0, 0, 0, 0.98, 0.74, 1.15);
  A(bot_rbox(0.106, 0.026, 0.28, 0.009), P.sole, 0, 0, -0.077, -0.045);
  for (let i = 0; i < 4; i++) A(bot_rbox(0.05, 0.008, 0.012, 0.003), P.lace, 0, 0, 0.012 - i * 0.005, -0.05 - i * 0.022);
  geo.foot = bot_merge(L);

  // un solo materiale per squadra; roughness/metalness dall'atlante (stoffa 0.85, lenti lucide)
  const mat = new THREE.MeshStandardMaterial({ map: at.tex, vertexColors: true, roughness: 1, metalness: 1, roughnessMap: at.orm, metalnessMap: at.orm,
    emissive: 0xffffff, emissiveMap: at.em, emissiveIntensity: 1 });
  return (bot_KITS[team] = { mat, geo });
}

// fucile di riserva (se manca ASSETS.weapons): origine all'impugnatura, canna verso -Z
let bot_gunG = null, bot_gunM = null;
function bot_gunGeo() {
  if (bot_gunG) return bot_gunG;
  const L = [], A = (...a) => bot_add(L, ...a), K = 0x57595c, T = 0x7a725f, H = Math.PI / 2;
  A(bot_rbox(0.045, 0.07, 0.24, 0.01), K, 0, 0, 0.075, -0.06);
  A(bot_rbox(0.05, 0.055, 0.26, 0.012), T, 0, 0, 0.078, -0.31);
  A(bot_tube(0.011, 0.011, 0.2, 0, 8, 1), K, 0, 0, 0.08, -0.53, H);
  A(bot_tube(0.016, 0.014, 0.06, 0, 8, 1), K, 0, 0, 0.08, -0.65, H);
  A(bot_rbox(0.035, 0.1, 0.045, 0.01), T, 0, 0, -0.03, 0.015, 0.3);
  A(bot_rbox(0.03, 0.17, 0.055, 0.008), K, 0, 0, -0.06, -0.11, -0.2);
  A(bot_rbox(0.04, 0.05, 0.2, 0.01), K, 0, 0, 0.07, 0.16);
  A(bot_rbox(0.045, 0.11, 0.07, 0.012), T, 0, 0, 0.045, 0.27);
  A(bot_rbox(0.035, 0.045, 0.09, 0.01), K, 0, 0, 0.14, -0.08);
  A(bot_rbox(0.012, 0.04, 0.012, 0.003), K, 0, 0, 0.125, -0.42);
  bot_gunM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.45, emissive: 0x0a0a0a });
  return (bot_gunG = bot_merge(L));
}

// --------------------------------------------------------------- animazione
const bot_newAnim = seed => ({ t: 0, seed: seed || 0, phase: 0, move: 0, run: 0, S: 0, duty: 0.4, vf: 1, vr: 0, aim: 0, crouch: 0, pitch: 0,
  headYaw: 0, recoil: 0, hit: 0, reload: -1, thro: -1, death: -1, fallBack: true, fallSide: 1 });

function bot_legIK(rig, i, hipY, fx, fy, fz, footPitch, splay) {   // IK nel piano sagittale: il ginocchio piega solo in avanti
  const A = 0.43, B = 0.42, dy = -(hipY - 0.09 - fy);
  const Ld = bot_clamp(Math.sqrt(dy * dy + fz * fz), 0.25, A + B - 0.004);
  const phi = Math.atan2(-fz, -dy);
  const al = Math.acos(bot_clamp((A * A + Ld * Ld - B * B) / (2 * A * Ld), -1, 1));
  const kn = Math.PI - Math.acos(bot_clamp((A * A + B * B - Ld * Ld) / (2 * A * B), -1, 1));
  const t = phi + al;
  rig.thigh[i].rotation.set(t, 0, fx / 0.85 + splay);
  rig.shin[i].rotation.x = -kn;
  rig.foot[i].rotation.x = kn - t + footPitch;
}
function bot_armIK(up, lo, sx, sy, sz, tx, ty, tz, side) {         // IK a due ossa: la mano resta sull'arma
  const A = 0.29, B = 0.335;
  let dx = tx - sx, dy = ty - sy, dz = tz - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
  dx /= d; dy /= d; dz /= d; d = bot_clamp(d, 0.1, A + B - 0.006);
  const h = (A * A - B * B + d * d) / (2 * d), r = Math.sqrt(Math.max(0, A * A - h * h));
  let px = side * 0.75, py = -1, pz = 0.3; const dt = px * dx + py * dy + pz * dz;   // polo: gomito in fuori e in basso
  px -= dx * dt; py -= dy * dt; pz -= dz * dt;
  const pl = Math.sqrt(px * px + py * py + pz * pz) || 1; px /= pl; py /= pl; pz /= pl;
  const ex = dx * h + px * r, ey = dy * h + py * r, ez = dz * h + pz * r;
  up.position.set(sx, sy, sz); up.quaternion.setFromUnitVectors(bot_DOWN, bot_v1.set(ex, ey, ez).normalize());
  lo.position.set(sx + ex, sy + ey, sz + ez);
  lo.quaternion.setFromUnitVectors(bot_DOWN, bot_v1.set(dx * d - ex, dy * d - ey, dz * d - ez).normalize());
}
function bot_pose(rig, a) {
  const P = rig.pelvis, T = rig.torso, H = rig.head, gun = rig.gun, mv = a.move, run = a.run, cr = a.crouch;
  const de = a.death >= 0 ? bot_ss(a.death, 0, 0.8) : 0, aim = a.aim * (1 - de);
  const sn = Math.sin(a.phase), br = Math.sin(a.t * 1.7 + a.seed), cs = a.duty * bot_TAU;
  // bacino: altezza (camminata, mira, in ginocchio), oscillazione, inclinazione in corsa
  const hipY = bot_lerp(0.925 - 0.03 * mv - 0.03 * aim * (1 - mv), 0.52, cr) - Math.cos(2 * a.phase - cs) * 0.028 * mv * (0.6 + run) - de * 0.24;
  P.position.y = hipY;
  P.rotation.set(-(0.04 + 0.12 * run) * mv * a.vf - 0.05 * cr, sn * 0.07 * mv, sn * 0.03 * mv);
  // gambe: appoggio (piede fermo a terra) + volo; in ginocchio: sinistra avanti, destra a terra
  const lift = (0.08 + 0.14 * run) * mv;
  for (let i = 0; i < 2; i++) {
    let c = (a.phase + i * Math.PI) % bot_TAU, s, ly = 0, fp;
    if (c < 0) c += bot_TAU;
    if (c < cs) { s = 0.5 - c / cs; fp = 0.25 * bot_ss(s, 0.3, 0.5) - 0.4 * bot_ss(-s, 0.25, 0.5); }
    else { const u = (c - cs) / (bot_TAU - cs); s = -0.5 + u * u * (3 - 2 * u); ly = Math.sin(u * Math.PI); fp = bot_lerp(-0.4, 0.25, u) - 0.35 * ly; }
    bot_legIK(rig, i, hipY, s * a.S * a.vr * (1 - cr), bot_lerp(ly * lift, i ? 0.06 : 0, cr),
      bot_lerp(-s * a.S * a.vf + (i ? 0.1 : -0.1) * aim * (1 - mv), i ? 0.4 : -0.3, cr),
      bot_lerp(fp * mv, i ? -1.2 : 0, cr), (i ? 1 : -1) * 0.035 * (1 + aim));
  }
  // busto: torsione da tiro, pitch di mira, respiro, sussulto, lancio granata
  const tw = -0.3 * aim;
  let k1 = 0, k2 = 0, k3 = 0, k4 = 0, thr = 0, thp = 0;
  if (a.thro >= 0) { const q = a.thro; k1 = bot_ss(q, 0, 0.18); k2 = bot_ss(q, 0.2, 0.5); k3 = bot_ss(q, 0.52, 0.66); k4 = bot_ss(q, 0.78, 1); thr = -0.45 * k2 + 0.9 * k3 - 0.45 * k4; thp = 0.2 * k2 - 0.45 * k3 + 0.25 * k4; }
  const rl = a.reload >= 0 ? bot_ss(a.reload, 0, 0.15) * (1 - bot_ss(a.reload, 0.85, 1)) : 0;
  const tp = a.pitch * 0.55 * aim - 0.22 * cr * (1 - 0.6 * aim) + br * 0.012 - a.hit * 0.15 + a.recoil * 0.02 - (0.03 + 0.1 * run) * mv + thp;
  T.position.y = 0.08 + br * 0.004;
  T.rotation.set(tp, tw + thr - sn * 0.1 * mv, -sn * 0.03 * mv + a.hit * 0.07 * a.fallSide);
  H.position.set(0.02 + 0.045 * aim, 0.61 - 0.03 * aim, -0.015 - 0.035 * aim);
  H.rotation.set(bot_clamp(a.pitch * 0.85 - tp - P.rotation.x, -0.6, 0.6) - 0.08 * aim - de * 0.3, -tw - thr * 0.6 + a.headYaw * (1 - aim) + sn * 0.1 * mv, -0.14 * aim);
  // arma: da "bassa pronta" a "alla spalla"; rinculo, ricarica, caduta
  const low = 1 - aim, rm = run * mv, s2 = Math.sin(a.phase * 2);
  const gx = bot_lerp(0.1, 0.11 + 0.03 * rm, low) + sn * 0.012 * mv;
  const gy = bot_lerp(0.47, 0.25 + 0.06 * rm, low) + s2 * 0.012 * mv - 0.05 * rl * aim - de * 0.25;
  const gz = bot_lerp(-0.34, -0.2, low) + a.recoil * 0.035;
  const gp = bot_lerp(a.pitch * 0.45, -0.5 + 0.28 * rm, low) + a.recoil * 0.05 + 0.3 * rl + br * 0.008 - de * 0.9;
  const ct = Math.cos(tw), st = Math.sin(tw);
  gun.position.set(gx * ct - gz * st, gy, gx * st + gz * ct);
  gun.rotation.set(gp, bot_lerp(0, 0.5 + 0.3 * rm, low) - tw, bot_lerp(0, 0.15, low) - 0.5 * rl);
  // mani: destra all'impugnatura, sinistra al guardamano
  bot_v2.set(0, -0.035, 0.012).applyQuaternion(gun.quaternion).add(gun.position);
  bot_v3.set(0, 0.03, -0.2).applyQuaternion(gun.quaternion).add(gun.position);
  if (a.reload >= 0) {          // sinistra: guardamano -> caricatore -> tasca -> caricatore -> guardamano
    const r = a.reload;
    bot_v4.set(0, -0.09, -0.1).applyQuaternion(gun.quaternion).add(gun.position);
    bot_v3.lerp(bot_v4, bot_ss(r, 0.05, 0.2) - bot_ss(r, 0.82, 0.97));
    bot_v3.lerp(bot_v4.set(-0.06, 0.17, -0.21), bot_ss(r, 0.25, 0.42) - bot_ss(r, 0.5, 0.68));
  }
  if (a.thro >= 0) {            // destra: cintura -> dietro la spalla -> lancio -> impugnatura
    bot_v6.copy(bot_v2);
    bot_v2.lerp(bot_v4.set(0.14, 0.1, -0.14), k1).lerp(bot_v4.set(0.34, 0.62, 0.2), k2).lerp(bot_v4.set(0.2, 0.64, -0.5), k3).lerp(bot_v6, k4);
  }
  if (de > 0) bot_v3.lerp(bot_v4.set(-0.36, 0.1, -0.06), de);
  bot_armIK(rig.armU[1], rig.armL[1], 0.2, 0.42, 0, bot_v2.x, bot_v2.y, bot_v2.z, 1);
  bot_armIK(rig.armU[0], rig.armL[0], -0.2, 0.42, 0, bot_v3.x, bot_v3.y, bot_v3.z, -1);
  // lampo da colpo: alza l'emissiva del busto (base 0.04 -> circa 0.7), niente sangue
  rig.flashMat.emissiveIntensity = 1 + a.hit * 16;
}

// ------------------------------------------------------------ modello soldato
function bot_createSoldier(team, rng, weaponId) {
  team = team === 'red' ? 'red' : 'blue'; rng = rng || Math.random;
  const K = bot_teamKit(team), root = new THREE.Group(), flashMat = K.mat.clone();   // clone: le texture restano condivise
  const mk = (geo, parent, x, y, z, cast, mat) => {
    const m = new THREE.Mesh(geo, mat || K.mat); m.position.set(x, y, z); m.castShadow = cast !== false; m.receiveShadow = true; parent.add(m); return m;
  };
  const pelvis = mk(K.geo.pelvis, root, 0, 0.925, 0);
  const torso = mk(K.geo.torso, pelvis, 0, 0.08, 0, true, flashMat);
  const head = mk(K.geo.head, torso, 0, 0.61, -0.015); head.rotation.order = 'YXZ';
  const rig = { pelvis, torso, head, armU: [], armL: [], thigh: [], shin: [], foot: [], flashMat, gun: null };
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1;
    rig.armU[i] = mk(K.geo.armU, torso, s * 0.2, 0.42, 0);
    rig.armL[i] = mk(K.geo.armL[i], torso, s * 0.2, 0.13, 0);
    rig.thigh[i] = mk(K.geo.thigh[i], pelvis, s * 0.095, 0, 0);
    rig.shin[i] = mk(K.geo.shin, rig.thigh[i], 0, -0.43, 0);
    rig.foot[i] = mk(K.geo.foot, rig.shin[i], 0, -0.42, 0, false);
  }
  let gun;
  const W = (typeof ASSETS !== 'undefined' && ASSETS && ASSETS.weapons) ? ASSETS.weapons : null, src = W ? (W[weaponId] || W.AR) : null;
  if (src && src.isObject3D) {
    gun = src.clone(true); gun.position.set(0, 0, 0); gun.rotation.set(0, 0, 0); gun.scale.setScalar(1); gun.visible = true;
    gun.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  } else {
    gun = new THREE.Mesh(bot_gunGeo(), bot_gunM); gun.receiveShadow = true;
    const mz = new THREE.Object3D(); mz.name = 'muzzle'; mz.position.set(0, 0.08, -0.68); gun.add(mz);
  }
  gun.rotation.order = 'YXZ'; torso.add(gun); rig.gun = gun;
  root.rotation.order = 'YXZ'; root.scale.setScalar(0.97 + rng() * 0.06);
  root.userData.rig = rig; root.userData.team = team;
  bot_pose(rig, bot_newAnim(0));
  return root;
}

// ======================================================================= Bot
class Bot {
  constructor(team, name, rng) {
    this.team = team === 'red' ? 'red' : 'blue'; this.name = name || 'Soldato'; this.rng = rng || Math.random; this.id = bot_idSeq++;
    this.isPlayer = false; this.isBot = true;
    this.pos = bot_V(); this.vel = bot_V(); this.eye = bot_V(); this.yaw = 0; this.pitch = 0; this.hp = 100; this.alive = false; this.crouch = false;
    this.kills = 0; this.deaths = 0;
    this.weaponId = bot_WPN_BAG[(this.rng() * bot_WPN_BAG.length) | 0];
    this.def = bot_def(this.weaponId); this.role = bot_ROLE[this.weaponId] || bot_ROLE.AR;
    this.model = bot_createSoldier(this.team, this.rng, this.weaponId); this.rig = this.model.userData.rig; this.model.visible = false;
    this.a = bot_newAnim(this.rng() * 100);
    this.goal = bot_V(); this.lastSeen = bot_V(); this.coverPos = bot_V(); this.heard = bot_V(); this.mzl = bot_V(); this.fdir = bot_V();
    this._reset();
  }
  _reset() {
    const now = G.time || 0, r = this.rng;
    this.state = 'ADV'; this.target = null; this.tVis = false; this.seenT = -99; this.lostT = 0; this.reactT = 0; this.trackT = 0; this.headShot = false;
    this.path = null; this.pi = 0; this.hasGoal = false; this.nextPathT = now + r() * 0.5; this.stuckT = 0; this.stuckN = 0; this.holdT = 0; this.chaseT = 0;
    this.mag = this.def.mag || 30; this.reloadEnd = -1; this.nextShot = 0; this.burst = 0; this.burstT = 0;
    this.strafe = r() < 0.5 ? -1 : 1; this.strafeT = 0; this.coverT = 0; this.coverCd = 0; this.inCover = false;
    this.gCd = now + 4 + r() * 6; this.gLeft = 2; this.throwT = -1; this.thrown = false;
    this.percT = now + r() * 0.25; this.tick = (r() * 6) | 0; this.hurtT = -99; this.hurtN = 0; this.lastHp = 100; this.heardT = now;
    this.aimYaw = this.yaw; this.aimPitch = 0; this.lookYaw = this.yaw; this.scanYaw = this.yaw; this.spd = 0; this.onGround = true;
    this.mvx = 0; this.mvz = 0; this.wantCrouch = false; this.wantAim = false; this.faceAim = false;
  }
  respawn(p) {
    this.pos.copy(p); this.vel.set(0, 0, 0); this.hp = 100; this.alive = true; this.crouch = false; this.def = bot_def(this.weaponId);
    this.yaw = Math.atan2(p.x - bot_side.mid.x, p.z - bot_side.mid.z);       // guarda verso il centro mappa
    this._reset();
    const a = this.a; a.death = -1; a.reload = -1; a.thro = -1; a.hit = 0; a.crouch = 0; a.aim = 0; a.move = 0; a.run = 0; a.recoil = 0; a.headYaw = 0;
    this.model.visible = true; this._animate(0);
  }
  onDeath(attacker) {
    this.alive = false; this.crouch = false; this.target = null; this.tVis = false;
    const a = this.a; a.death = 0; a.reload = -1; a.thro = -1; a.hit = 1;
    let back = this.rng() < 0.5, side = this.rng() < 0.5 ? -1 : 1;
    if (attacker && attacker.pos) {                                           // cade lontano da chi ha sparato
      const dx = attacker.pos.x - this.pos.x, dz = attacker.pos.z - this.pos.z, l = Math.hypot(dx, dz) || 1, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      back = (-sy * dx - cy * dz) / l > 0.35; side = (cy * dx - sy * dz) / l > 0 ? 1 : -1;
    }
    a.fallBack = back; a.fallSide = side;
  }
  update(dt) {
    const a = this.a, now = G.time || 0;
    if (!this.alive) { if (a.death < 0) this.onDeath(null); a.death += dt; this._animate(dt); return; }
    const D = bot_D();
    if (this.hp < this.lastHp) { a.hit = 1; this.hurtN = now - this.hurtT < 1.5 ? this.hurtN + 1 : 1; this.hurtT = now; this._alert(now); }
    this.lastHp = this.hp;
    if (now >= this.percT) { this.percT = now + 0.25; this._perceive(D, now); }
    this._think(D, now, dt);
    this._move(dt, now);
    this._animate(dt);
  }
  // ---------------------------------------------------------- percezione
  _alert(now) {                       // colpito senza vedere nessuno: si gira verso lo sparo nemico più recente
    if (this.target && this.tVis) return; let b = null;
    for (let i = 0; i < 16; i++) {
      const n = bot_noise[i]; if (!n.ent || n.ent.team === this.team || now - n.t > 1.5) continue;
      const dx = n.x - this.pos.x, dz = n.z - this.pos.z; if (dx * dx + dz * dz < 8100 && (!b || n.t > b.t)) b = n;
    }
    if (b) { this.heard.set(b.x, b.y, b.z); this.heardT = now; }
  }
  _score(e, fx, fz) {
    if (!e || e === this || !e.alive || e.team === this.team) return 1e9;
    const dx = e.pos.x - this.pos.x, dy = e.pos.y - this.pos.y, dz = e.pos.z - this.pos.z, d2 = dx * dx + dy * dy + dz * dz;
    if (d2 > 8100) return 1e9;                                               // 90 m
    const d = Math.sqrt(d2) || 0.01;
    if (e !== this.target && d > 5 && (dx * fx + dz * fz) / d < 0.5736) return 1e9;   // fuori dal cono di 110°
    return d + (e !== this.target && (e.bot_aim | 0) >= 3 ? 45 : 0) - (e === this.target ? 6 : 0);   // max 3 sullo stesso bersaglio
  }
  _perceive(D, now) {
    this.eye.set(this.pos.x, this.pos.y + (this.crouch ? 1.05 : 1.62), this.pos.z); this.tick++;
    const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw), bots = G.bots;
    let c0 = null, s0 = 1e8, c1 = null, s1 = 1e8;
    for (let i = 0, n = bots.length; i <= n; i++) {
      const e = i < n ? bots[i] : (this.team === 'red' ? G.player : null), s = this._score(e, fx, fz);
      if (s < s0) { c1 = c0; s1 = s0; c0 = e; s0 = s; } else if (s < s1) { c1 = e; s1 = s; }
    }
    let t = this.target; if (t && !t.alive) { t = this.target = null; this.tVis = false; }
    let pick = t;
    if (!t) pick = ((this.tick & 1) && c1) ? c1 : c0;
    else if (c0 && c0 !== t && (this.tick % 3 === 2 || (!this.tVis && (this.tick & 1)))) pick = c0;
    if (pick) {                       // UNA sola linea di vista per giro (4 al secondo)
      const vis = hasLineOfSight(this.eye, bot_v1.set(pick.pos.x, pick.pos.y + (pick.crouch ? 1.05 : 1.6), pick.pos.z));
      if (pick === t) this.tVis = vis;
      else if (vis && (!t || !this.tVis || s0 < this._score(t, fx, fz) * 0.7)) {
        this.reactT = now + bot_DIFF.react[D] * (0.8 + this.rng() * 0.4) * (t && this.tVis ? 0.5 : 1);
        t = this.target = pick; this.tVis = true; this.trackT = 0; this.lostT = 0; this.burst = 0; this.headShot = this.rng() < bot_DIFF.head[D];
      }
      if (t && this.tVis && pick === t) { this.lastSeen.copy(t.pos); this.seenT = now; const it = bot_intel[this.team]; it.p.copy(t.pos); it.t = now; }
    }
    if (!this.tVis) for (let i = 0; i < 16; i++) {                           // udito: spari nemici entro 40 m
      const n = bot_noise[i]; if (n.t <= this.heardT || now - n.t > 1 || !n.ent || n.ent.team === this.team) continue;
      const hx = n.x - this.pos.x, hz = n.z - this.pos.z;
      if (hx * hx + hz * hz < 1600) { this.heard.set(n.x, n.y, n.z); this.heardT = now; break; }
    }
  }
  // ------------------------------------------------------------ decisioni
  _think(D, now, dt) {
    const a = this.a, def = this.def, id = this.weaponId, r = this.rng, magMax = def.mag || 30;
    this.mvx = this.mvz = 0; this.wantCrouch = this.wantAim = this.faceAim = false;
    if (this.reloadEnd > 0) {
      if (now >= this.reloadEnd) { this.reloadEnd = -1; this.mag = magMax; a.reload = -1; }
      else a.reload = 1 - (this.reloadEnd - now) / (def.reload || 2.4);
    }
    let t = this.target;
    if (t && (!t.alive || now - this.seenT > 7)) { t = this.target = null; this.tVis = false; }
    let dx = 0, dz = 0, dist = 0, wy = this.yaw, wp = 0;
    if (t) {                          // punto di mira (con anticipo alle difficoltà alte)
      const P = this.tVis ? t.pos : this.lastSeen, tv = this.tVis ? t.vel : null, ld = bot_DIFF.lead[D] / bot_DIFF.turn[D];
      dx = P.x - this.pos.x; dz = P.z - this.pos.z; dist = Math.hypot(dx, dz) || 0.01;
      const ax = dx + (tv ? tv.x * ld : 0), az = dz + (tv ? tv.z * ld : 0);
      const ay = P.y + (!this.tVis ? 1.2 : t.crouch ? 0.8 : this.headShot ? 1.6 : 1.15) - this.pos.y - (this.crouch ? 1.03 : 1.47);
      wy = Math.atan2(-ax, -az); wp = Math.atan2(ay, Math.hypot(ax, az) || 1);
    } else if (now - this.heardT < 2.5) wy = Math.atan2(this.pos.x - this.heard.x, this.pos.z - this.heard.z);
    else if (now < this.holdT) wy = this.scanYaw + Math.sin(now * 0.8 + a.seed) * 0.9;
    const k = 1 - Math.exp(-dt * bot_DIFF.turn[D]);
    this.aimYaw += bot_angDiff(this.aimYaw, wy) * k; this.aimPitch += (wp - this.aimPitch) * k; this.lookYaw = wy; this.pitch = this.aimPitch;

    if (this.state === 'GRN') {       // lancio granata in corso
      this.throwT += dt / 0.95; a.thro = Math.min(1, this.throwT); this.faceAim = true;
      if (!this.thrown && this.throwT >= 0.6) { this.thrown = true; this._throw(); }
      if (this.throwT >= 1) { a.thro = -1; this.throwT = -1; if (t) this._chase(this.lastSeen, now); else { this.state = 'ADV'; this.hasGoal = false; } }
      return;
    }
    if (t && this.tVis && this.state !== 'COV' && this.state !== 'REL') this.state = 'ENG';
    const hot = now - this.hurtT < 1.5;
    if (t && now > this.coverCd && this.state !== 'COV' && (hot || this.tVis) &&
        (this.hp < 50 || (hot && this.hurtN >= 3) || (this.reloadEnd > 0 && this.tVis && dist < 40))) {
      this.coverCd = now + 3;
      if (r() < bot_DIFF.cover[D] && this._findCover()) {
        this.state = 'COV'; this.inCover = false; this.goal.copy(this.coverPos); this.hasGoal = true; this.path = null; this.nextPathT = 0;
        this.coverT = now + 6; this.coverCd = now + 9;
      }
    }
    switch (this.state) {
      case 'ENG': {
        if (!t) { this.state = 'ADV'; break; }
        this.wantAim = this.faceAim = true;
        if (this.tVis) { this.lostT = 0; this.trackT += dt; this._combatMove(D, now, dist, dx, dz, false); this._shoot(D, now, dist); }
        else {
          this.lostT += dt; this.trackT = Math.max(0, this.trackT - dt * 2);
          if (this.reloadEnd < 0 && this.mag < magMax * 0.4) { this._startReload(now); break; }
          if (this.lostT > 0.7) {
            if (this._wantGrenade(D, now, dist)) this._startThrow();
            else if (id === 'SNIPER') { this.wantCrouch = true; if (this.lostT > 4) this.state = 'ADV'; }
            else if (this.lostT > 0.7 + (1 - bot_DIFF.aggr[D]) * 2.5) this._chase(this.lastSeen, now);
          }
        }
        break;
      }
      case 'REL': {
        if (this.reloadEnd < 0) { this.state = t ? 'ENG' : 'ADV'; break; }
        if (t) { this.faceAim = true; this._combatMove(D, now, dist, dx, dz, true); }
        break;
      }
      case 'COV': {
        if (!this.inCover) {
          if (this._travel(now, 5.2, 0.9) || now > this.coverT) {
            this.inCover = true; this.coverT = now + 1.6 + r() * 2.2 + (this.hp < 35 ? 1.5 : 0);
            if (this.mag < magMax * 0.7) this._startReload(now);
          }
        } else {
          this.wantCrouch = true; this.wantAim = this.faceAim = !!t && this.reloadEnd < 0;
          if (t && this.tVis && this.reloadEnd < 0) { this.trackT += dt; this._shoot(D, now, dist); }
          if (now > this.coverT && this.reloadEnd < 0) {                      // rispunta
            this.inCover = false; this.coverCd = now + 6;
            if (t) this._chase(this.lastSeen, now); else { this.state = 'ADV'; this.hasGoal = false; }
          }
        }
        break;
      }
      default: {                      // ADV (avanza) e CHS (insegue l'ultima posizione vista / il rumore)
        if (!t && this.state === 'ADV' && now - this.heardT < 0.3 && id !== 'SNIPER' && r() < bot_DIFF.aggr[D]) this._chase(this.heard, now);
        if (t && !this.tVis && this._wantGrenade(D, now, dist)) { this._startThrow(); break; }
        if (!t && this.reloadEnd < 0 && this.mag < magMax * 0.5) this._startReload(now);
        if (!this.hasGoal) this._pickGoal(now);
        if (now < this.holdT) { this.wantCrouch = id === 'SNIPER'; this.wantAim = id === 'SNIPER' || !!t; this.faceAim = true; break; }
        const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z, careful = this.state === 'CHS' && gx * gx + gz * gz < 150;
        this.wantAim = careful;
        if (this._travel(now, careful ? 3.2 : 5.2, 1.6) || (this.state === 'CHS' && now > this.chaseT)) {
          const en = bot_side[this.team === 'blue' ? 'red' : 'blue'];
          this.scanYaw = Math.atan2(this.pos.x - en.x, this.pos.z - en.z);
          this.holdT = now + (id === 'SNIPER' && this.state === 'ADV' ? 9 + r() * 9 : 0.6 + r() * 1.4);
          this.hasGoal = false; this.path = null; this.state = 'ADV';
        }
      }
    }
  }
  _chase(p, now) {
    this.state = 'CHS'; this.goal.copy(p); bot_snap(this.goal); this.hasGoal = true; this.path = null;
    this.nextPathT = Math.min(this.nextPathT, now + 0.1); this.holdT = 0; this.chaseT = now + 9; this.stuckN = 0;
  }
  _pickGoal(now) {
    const r = this.rng, S = bot_side, mid = S.mid, B = S.B, en = S[this.team === 'blue' ? 'red' : 'blue'], own = S[this.team], it = bot_intel[this.team], g = this.goal;
    let done = false;
    if (this.weaponId === 'SNIPER' && r() < 0.85) {                           // cecchino: punto alto dal proprio lato
      let best = null, bs = 1e9;
      for (let k = 0; k < 8 && S.high.length; k++) {
        const p = S.high[(r() * S.high.length) | 0], s = p.distanceToSquared(mid) * (0.5 + r());
        if (p.distanceToSquared(own) < p.distanceToSquared(en) && s < bs) { bs = s; best = p; }
      }
      if (best) g.copy(best); else { g.copy(own).lerp(mid, 0.3 + r() * 0.3); g.x += (r() - 0.5) * 30; g.z += (r() - 0.5) * 12; }
      done = true;
    }
    if (!done) {
      if (now - it.t < 6 && r() < 0.5) g.copy(it.p);                         // nemico segnalato dai compagni
      else if (r() < 0.45) g.set(mid.x + (r() - 0.5) * 30, 0, mid.z + (r() - 0.5) * 30);   // zona centrale
      else {                                                                  // punto nella metà nemica (3 corsie)
        g.copy(mid).lerp(en, r() * 0.85);
        const lx = -(en.z - own.z), lz = en.x - own.x, l = Math.hypot(lx, lz) || 1, w = (r() - 0.5) * (B.maxX - B.minX) * 0.7;
        g.x += lx / l * w; g.z += lz / l * w;
      }
    }
    g.x = bot_clamp(g.x, B.minX + 4, B.maxX - 4); g.z = bot_clamp(g.z, B.minZ + 4, B.maxZ - 4);
    bot_snap(g); this.hasGoal = true; this.path = null; this.stuckN = 0;
  }
  _travel(now, speed, arriveR) {      // segue il percorso; true quando è arrivato
    if (!this.path && now >= this.nextPathT && bot_pathBudget > 0) {
      bot_pathBudget--; this.nextPathT = now + 1.5 + this.rng();
      let p = null; try { p = (G.nav && G.nav.path) ? G.nav.path(this.pos, this.goal) : null; } catch (e) { p = null; }
      this.path = (p && p.length) ? p : [this.goal]; this.pi = 0;
    }
    const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z;
    if (gx * gx + gz * gz < arriveR * arriveR && Math.abs(this.goal.y - this.pos.y) < 2.5) return true;
    if (!this.path) return false;
    const last = this.path.length - 1; let w = this.path[this.pi];
    while (this.pi < last) { const x = w.x - this.pos.x, z = w.z - this.pos.z; if (x * x + z * z < 0.8) w = this.path[++this.pi]; else break; }
    let x = w.x - this.pos.x, z = w.z - this.pos.z, l = Math.hypot(x, z);
    if (l < 0.5 && this.pi >= last) { x = gx; z = gz; l = Math.hypot(x, z); }   // fine percorso: dritto all'obiettivo
    if (l > 0.05) { this.mvx = x / l * speed; this.mvz = z / l * speed; }
    return false;
  }
  _combatMove(D, now, dist, dx, dz, back) {
    const id = this.weaponId, ideal = this.role.ideal, r = this.rng;
    if (now > this.strafeT) { this.strafeT = now + 0.6 + r() * 1.3; this.strafe = r() < 0.25 + (4 - D) * 0.08 ? 0 : (r() < 0.5 ? -1 : 1); }
    const still = id === 'SNIPER' || (id === 'LMG' && dist > 18 && !back);
    let f = back ? -0.6 : dist > ideal * 1.35 ? 1 : (dist < ideal * 0.45 && id !== 'SHOTGUN' ? -0.7 : 0);
    if (still) { this.wantCrouch = dist > 14; if (f > 0 && dist < (this.def.range || 120) * 0.9) f = 0; }
    const nx = dx / dist, nz = dz / dist, s = still ? 0 : this.strafe * 0.85, mx = nx * f - nz * s, mz = nz * f + nx * s, l = Math.hypot(mx, mz);
    if (l > 0.01) { const sp = (f > 0 && dist > ideal * 2 && (id === 'SHOTGUN' || id === 'SMG')) ? 5.2 : 2.9; this.mvx = mx / l * sp; this.mvz = mz / l * sp; }
  }
  _startReload(now) {
    if (this.reloadEnd > 0 || this.mag >= (this.def.mag || 30)) return;
    this.reloadEnd = now + (this.def.reload || 2.4); this.a.reload = 0; this.burst = 0;
    if (this.state === 'ENG') this.state = 'REL';
    bot_sfx('reload', this.pos, 0.5);
  }
  _muzzle(o) {
    const cy = Math.cos(this.aimYaw), sy = Math.sin(this.aimYaw), cp = Math.cos(this.aimPitch), sp = Math.sin(this.aimPitch);
    return o.set(this.pos.x - sy * cp * 0.45 + cy * 0.1, this.pos.y + (this.crouch ? 1.03 : 1.47) + sp * 0.45, this.pos.z - cy * cp * 0.45 - sy * 0.1);
  }
  _shoot(D, now, dist) {
    const def = this.def, role = this.role, t = this.target, r = this.rng;
    if (this.reloadEnd > 0 || now < this.reactT) return;
    if (this.mag <= 0) { this._startReload(now); return; }
    if (now < this.nextShot || now < this.burstT) return;
    if (Math.abs(bot_angDiff(this.yaw, this.aimYaw)) > 0.3 || dist > (def.range || 120) * 1.2) return;
    if (this.burst <= 0) { this.burst = role.burst[0] + ((r() * (role.burst[1] - role.burst[0] + 1)) | 0); this.headShot = r() < bot_DIFF.head[D]; }
    // errore di mira: cala mentre continua a tracciare, cresce se il bersaglio corre
    let err = bot_DIFF.err[D] * (0.3 + 0.7 * Math.exp(-this.trackT / 1.1));
    const tv = t.vel; if (tv && tv.x * tv.x + tv.z * tv.z > 14) err *= 1.4;
    if (this.spd > 1.5) err *= 1.25; if (this.crouch) err *= 0.8; if (this.weaponId === 'SNIPER') err *= 0.6;
    err *= Math.PI / 180;
    const ey = this.aimYaw + (r() + r() - 1) * err, ep = this.aimPitch + (r() + r() - 1) * err * 0.7, cp = Math.cos(ep);
    this.fdir.set(-Math.sin(ey) * cp, Math.sin(ep), -Math.cos(ey) * cp);
    bot_fire(this, def.id, this._muzzle(this.mzl), this.fdir);
    this.mag--; this.a.recoil = 1; this.burst--;
    this.nextShot = now + 60 / (def.rpm || 600) * (def.auto === false ? 1.25 : 1);
    if (this.burst <= 0) this.burstT = now + role.pause * bot_DIFF.pause[D] * (0.7 + r() * 0.6);
  }
  _wantGrenade(D, now, dist) {        // nemico dietro copertura a 10-30 m
    if (now < this.gCd || this.gLeft <= 0 || dist < 10 || dist > 30 || this.reloadEnd > 0 || now - this.seenT < 0.8 || now - this.seenT > 5) return false;
    this.gCd = now + 3;
    if (this.rng() > bot_DIFF.gCh[D]) return false;
    const bots = G.bots;
    for (let i = 0; i < bots.length; i++) { const o = bots[i]; if (o !== this && o.alive && o.team === this.team && o.pos.distanceToSquared(this.lastSeen) < 64) return false; }
    if (this.team === 'blue' && G.player && G.player.alive && G.player.pos.distanceToSquared(this.lastSeen) < 64) return false;
    this.gCd = now + bot_DIFF.gCd[D] * (0.8 + this.rng() * 0.4); return true;
  }
  _startThrow() { this.state = 'GRN'; this.throwT = 0; this.thrown = false; this.a.thro = 0; bot_sfx('grenade_pin', this.pos, 0.7); }
  _throw() {                          // direzione parabolica (arco basso) verso l'ultima posizione vista
    const gd = bot_def('GRENADE'), v = gd.speed || gd.projSpeed || gd.velocity || 17, g = gd.gravity || 9.8;
    const o = bot_v2.set(this.pos.x, this.pos.y + 1.7, this.pos.z), dx = this.lastSeen.x - o.x, dz = this.lastSeen.z - o.z;
    const R0 = Math.hypot(dx, dz) || 1, R = R0 + 1.5, h = this.lastSeen.y + 0.3 - o.y, v2 = v * v, disc = v2 * v2 - g * (g * R * R + 2 * h * v2);
    const th = disc > 0 ? Math.atan2(v2 - Math.sqrt(disc), g * R) : Math.PI / 4, c = Math.cos(th);
    bot_v3.set(dx / R0 * c, Math.sin(th), dz / R0 * c);
    o.x += dx / R0 * 0.4; o.z += dz / R0 * 0.4;
    bot_fire(this, 'GRENADE', o.clone(), bot_v3.clone()); this.gLeft--;
  }
  _findCover() {                      // nav point vicino SENZA linea di vista sul nemico (max 8 controlli, raro)
    const pts = G.nav && G.nav.points; if (!pts || !pts.length) return false;
    const T = bot_v5.set(this.lastSeen.x, this.lastSeen.y + 1.5, this.lastSeen.z); let n = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], dx = p.x - this.pos.x, dz = p.z - this.pos.z, d = dx * dx + dz * dz;
      if (d > 196 || d < 2.5 || Math.abs(p.y - this.pos.y) > 2 || (n === 8 && d >= bot_cD[7])) continue;
      let k = n < 8 ? n++ : 7;
      while (k > 0 && bot_cD[k - 1] > d) { bot_cD[k] = bot_cD[k - 1]; bot_cI[k] = bot_cI[k - 1]; k--; }
      bot_cD[k] = d; bot_cI[k] = i;
    }
    for (let k = 0; k < n; k++) {
      const p = pts[bot_cI[k]]; bot_v6.set(p.x, p.y + 1.0, p.z);
      if (bot_v6.distanceToSquared(T) > 20 && !hasLineOfSight(bot_v6, T)) { this.coverPos.copy(p); return true; }
    }
    return false;
  }
  // ------------------------------------------------------------ movimento
  _move(dt, now) {
    let mx = this.mvx, mz = this.mvz; const bots = G.bots, want = Math.hypot(mx, mz);
    for (let i = 0, n = bots.length; i <= n; i++) {                           // separazione: non si compenetrano
      const o = i < n ? bots[i] : G.player; if (!o || o === this || !o.alive) continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < 1 && d2 > 1e-4 && Math.abs(this.pos.y - o.pos.y) < 1.5) { const d = Math.sqrt(d2), f = (1 - d) * 4.5 / d; mx += dx * f; mz += dz * f; }
    }
    const k = Math.min(1, dt * 10); this.vel.x += (mx - this.vel.x) * k; this.vel.z += (mz - this.vel.z) * k; this.vel.y -= 22 * dt;
    const px = this.pos.x, pz = this.pos.z, res = moveWithCollision(this.pos, this.vel, dt, 0.35, 1.8);
    this.onGround = !!(res && res.onGround); if (this.onGround && this.vel.y < 0) this.vel.y = 0;
    if (this.pos.y < -25) { bot_snap(this.pos); this.vel.set(0, 0, 0); this.path = null; }
    this.spd = dt > 1e-5 ? Math.hypot(this.pos.x - px, this.pos.z - pz) / dt : 0;
    if (want > 1 && this.spd < want * 0.25) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt * 2);
    if (this.stuckT > 1.5) {                                                  // bloccato: ricalcola
      this.stuckT = 0; this.path = null; this.nextPathT = Math.min(this.nextPathT, now); this.strafe = -this.strafe || 1;
      if (this.onGround) this.vel.y = 5;
      if (++this.stuckN >= 3) { this.hasGoal = false; this.stuckN = 0; if (this.state === 'CHS' || this.state === 'COV') { this.state = 'ADV'; this.inCover = false; } }
    }
    this.crouch = this.wantCrouch && want < 0.5;
    const face = (this.faceAim || want < 0.5) ? this.aimYaw : Math.atan2(-this.mvx, -this.mvz);
    this.yaw += bot_angDiff(this.yaw, face) * Math.min(1, dt * (this.faceAim ? 12 : 7));
  }
  _animate(dt) {
    const a = this.a, m = this.model, k = Math.min(1, dt * 9); a.t += dt;
    if (this.alive) {
      const sp = this.spd, fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      a.move += (bot_clamp(sp / 2.6, 0, 1) - a.move) * k; a.run += (bot_clamp((sp - 3.4) / 1.6, 0, 1) - a.run) * k;
      if (sp > 0.3) { a.vf += ((this.vel.x * fx + this.vel.z * fz) / sp - a.vf) * k; a.vr += ((-this.vel.x * fz + this.vel.z * fx) / sp - a.vr) * k; }
      const step = 0.75 + 0.12 * sp, p0 = a.phase;
      a.S = (0.6 + 0.1 * a.run) * a.move; a.duty = bot_clamp(a.S / (2 * step), 0.22, 0.5); a.phase += sp * dt * Math.PI / step;
      if (sp > 1 && this.onGround && Math.floor(p0 / Math.PI) !== Math.floor(a.phase / Math.PI) && G.player && this.pos.distanceToSquared(G.player.pos) < 500)
        bot_sfx('footstep', this.pos, 0.3 + 0.2 * a.run);
      if (a.phase > 6000) a.phase -= bot_TAU * 900;
      a.aim += ((this.wantAim ? 1 : 0) - a.aim) * Math.min(1, dt * 7);
      a.crouch += ((this.crouch ? 1 : 0) - a.crouch) * Math.min(1, dt * 6);
      a.pitch = this.aimPitch;
      a.headYaw += (bot_clamp(bot_angDiff(this.yaw, this.lookYaw), -1.1, 1.1) - a.headYaw) * Math.min(1, dt * 6);
      m.position.copy(this.pos); m.rotation.set(0, this.yaw, 0);
    } else {
      // morte: cede sulle ginocchia e cade su un fianco o all'indietro in 0.8 s, resta a terra,
      // poi scompare abbassandosi (prima del respawn a 4 s). Niente sangue.
      if (a.death > 4.3) { m.visible = false; return; }
      a.move *= 1 - k; a.run *= 1 - k; a.aim *= 1 - k; a.crouch *= 1 - k;
      const e = Math.min(1, a.death / 0.8), q = e * e * (3 - 2 * e), ang = 1.38 * e * e;
      m.position.copy(this.pos);
      if (a.death > 3.3) m.position.y -= (a.death - 3.3) * 0.75;
      m.rotation.set(a.fallBack ? ang : ang * 0.12, this.yaw + a.fallSide * 0.5 * q, a.fallBack ? a.fallSide * 0.22 * q : a.fallSide * ang * 1.02);
    }
    a.recoil = Math.max(0, a.recoil - dt * 9); a.hit = Math.max(0, a.hit - dt * 4);
    bot_pose(this.rig, a);
  }
}

// ======================================================================= BOT
const BOT = {
  pool: [],                           // i Bot restano tra una mappa e l'altra (nomi, kills, deaths)
  createSoldier: bot_createSoldier,
  spawnAll(g) {
    g = g || G; if (!g.bots) g.bots = [];
    bot_hookShots(); BOT.clearAll(); bot_mapInfo();
    // botCount = soldati totali: il giocatore conta nella squadra blu
    const n = bot_clamp(((g.settings && g.settings.botCount) | 0) || 24, 2, 64), nRed = Math.ceil(n / 2), nBlue = Math.max(0, n - nRed - 1);
    let k = 0;
    const mk = (team, i) => {
      let b = BOT.pool[k];
      if (!b || b.team !== team) { if (b) b.rig.flashMat.dispose(); b = BOT.pool[k] = new Bot(team, bot_name(k), bot_mkRng(1000 + k * 77)); }
      k++; g.scene.add(b.model); g.bots.push(b); b.respawn(bot_spawnPt(team, i, bot_v4));
    };
    for (let i = 0; i < nBlue; i++) mk('blue', i);
    for (let i = 0; i < nRed; i++) mk('red', i);
  },
  updateAll(dt) {
    const bots = G.bots; if (!bots) return;
    bot_pathBudget = 2;               // al massimo 2 percorsi nuovi per fotogramma
    if (G.player) G.player.bot_aim = 0;
    for (let i = 0; i < bots.length; i++) bots[i].bot_aim = 0;
    for (let i = 0; i < bots.length; i++) { const b = bots[i], t = b.target; if (b.alive && t) t.bot_aim = (t.bot_aim | 0) + 1; }
    for (let i = 0; i < bots.length; i++) bots[i].update(dt);
  },
  clearAll() {
    const bots = G.bots || (G.bots = []);
    for (let i = 0; i < bots.length; i++) { const m = bots[i].model; if (m && m.parent) m.parent.remove(m); }
    bots.length = 0;
    for (let i = 0; i < 16; i++) { bot_noise[i].t = -99; bot_noise[i].ent = null; }
  },
  resetStats() { for (const b of BOT.pool) if (b) { b.kills = 0; b.deaths = 0; } }
};
