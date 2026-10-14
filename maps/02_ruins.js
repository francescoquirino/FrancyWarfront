// ============================================================================
// FRANCY WARFRONT — maps/02_ruins.js — "Città in Rovina" (v3)
// Città europea bombardata. Punto eroe: campanile semicrollato che fuma.
// Zone: Piazza del Duomo (centro) · Giardini e Mercato (ovest) · Corso del Tram (est).
// Corsie: Via dei Giardini (x=-40) · Via Maggiore + piazza (x=0) · Corso del Tram (x=+40).
// ============================================================================

function map_ruins_ctx(kit) {
  const T = kit.THREE, PI = Math.PI;
  const mt = (name, color, o) => kit.mat(name, Object.assign({ color: color }, o || {}));
  const smk = (color, opacity) => new T.MeshStandardMaterial({ color: color, roughness: 1, metalness: 0, transparent: true, opacity: opacity, depthWrite: false });
  const P = {
    gnd: mt('asphalt', 0x5b5955, { roughness: 0.9, scale: 3 }), patch: mt('asphalt', 0x45433f, { roughness: 0.95, scale: 2 }),
    cob: mt('tile', 0x8a8175, { roughness: 0.86, scale: 1.6 }), walk: mt('concrete', 0x9d958a, { roughness: 0.86, scale: 2 }),
    stone: mt('concrete', 0xc2b8a5, { roughness: 0.8, scale: 1.5 }), cdark: mt('concrete_dark', 0x4c4a48, { roughness: 0.92, scale: 2 }),
    brick: mt('brick_red', 0xa25f45, { roughness: 0.88, scale: 2 }), brickO: mt('brick', 0x8d7060, { roughness: 0.9, scale: 2 }),
    ochre: mt('plaster', 0xcdab74, { roughness: 0.84, scale: 2.5 }), cream: mt('plaster', 0xd6cab2, { roughness: 0.82, scale: 2.5 }),
    rose: mt('plaster', 0xc08f7f, { roughness: 0.84, scale: 2.5 }), sage: mt('plaster', 0x9aa791, { roughness: 0.85, scale: 2.5 }),
    rub: mt('rubble', 0x8a8072, { roughness: 0.95, scale: 2 }), dirt: mt('dirt', 0x73634f, { roughness: 0.95, scale: 2.5 }),
    scorch: mt('dirt', 0x302c29, { roughness: 0.97, scale: 2 }), bag: mt('sandbag', 0xb09d7c, { roughness: 0.92, scale: 1.2 }),
    wood: mt('wood', 0x94704c, { roughness: 0.8, scale: 2 }), woodD: mt('wood_dark', 0x5e4735, { roughness: 0.84, scale: 2 }),
    char: mt('wood_dark', 0x352f2b, { roughness: 0.94, scale: 1.5 }),
    met: mt('metal', 0x7a7e80, { roughness: 0.5, metalness: 0.75, scale: 1.5 }), metD: mt('metal', 0x3f4245, { roughness: 0.58, metalness: 0.7, scale: 1.5 }),
    rust: mt('rust', 0x80502f, { roughness: 0.82, metalness: 0.4, scale: 1.5 }),
    tram: mt('metal_painted', 0xcfa03c, { roughness: 0.55, metalness: 0.3, scale: 2 }),
    pGreen: mt('metal_painted', 0x566544, { roughness: 0.62, metalness: 0.3, scale: 2 }),
    pBlue: mt('metal_painted', 0x4d6678, { roughness: 0.6, metalness: 0.35, scale: 2 }),
    roof: mt('corrugated', 0xa5623f, { roughness: 0.85, metalness: 0.05, scale: 1.2 }),
    cont: mt('container_green', 0x61755a, { roughness: 0.7, metalness: 0.35, scale: 2 }),
    glass: mt('glass', 0x90a8b2, { roughness: 0.15, metalness: 0.1, scale: 1 }), rubber: mt('rubber', 0x2c2c2d, { roughness: 0.9, scale: 1 }),
    line: mt('road_line', 0xcfc6aa, { roughness: 0.8, scale: 1 }), cloth: mt('sandbag', 0xa64a3a, { roughness: 0.9, scale: 0.8 }),
    net: mt('camo_net', 0x66714f, { roughness: 0.9, scale: 1.5 }),
    fire: kit.neon(0xff7a1c, 7), ember: kit.neon(0xff3d0c, 4), win: kit.neon(0xffc27a, 2.4),
    cross: kit.neon(0x4fe08a, 4), blue: kit.neon(0x57b0ff, 3.5), red: kit.neon(0xff5548, 3.5),
    smk1: smk(0x3a3632, 0.42), smk2: smk(0x5c5650, 0.26)
  };

  // ---- banca delle geometrie (tutte non indicizzate, così si possono fondere) ----
  const nz = g => (g.index ? g.toNonIndexed() : g);
  const poly = pts => { const s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; };
  const ext = s => new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -0.5);
  const rock = det => {
    const g = new T.IcosahedronGeometry(0.5, det), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = Math.round(p.getX(i) * 500) / 500, y = Math.round(p.getY(i) * 500) / 500, z = Math.round(p.getZ(i) * 500) / 500;
      const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453, f = 0.72 + 0.5 * (n - Math.floor(n));
      p.setXYZ(i, x * f, y * f * 0.9, z * f);
    }
    g.computeVertexNormals(); return g;
  };
  const sArch = new T.Shape(); sArch.moveTo(0.5, 0); sArch.absarc(0, 0, 0.5, 0, PI, false); sArch.lineTo(-0.36, 0); sArch.absarc(0, 0, 0.36, PI, 0, true); sArch.closePath();
  const sHalf = new T.Shape(); sHalf.moveTo(0.5, 0); sHalf.absarc(0, 0, 0.5, 0, PI, false); sHalf.closePath();
  const lathe = pts => nz(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), 14));
  const GEO = {
    box: nz(new T.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), cbox: nz(new T.BoxGeometry(1, 1, 1)),
    cyl: nz(new T.CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0)),
    cyl5: nz(new T.CylinderGeometry(0.5, 0.5, 1, 5, 1, true).translate(0, 0.5, 0)),
    cyl12: nz(new T.CylinderGeometry(0.5, 0.5, 1, 14).translate(0, 0.5, 0)),
    cone: nz(new T.CylinderGeometry(0.3, 0.5, 1, 7).translate(0, 0.5, 0)),
    spk: nz(new T.CylinderGeometry(0, 0.5, 1, 6).translate(0, 0.5, 0)),
    pyr: nz(new T.CylinderGeometry(0, 0.7071, 1, 4).rotateY(PI / 4).translate(0, 0.5, 0)),
    hub: nz(new T.CylinderGeometry(0.5, 0.5, 1, 12).rotateZ(PI / 2)),
    sph: nz(new T.IcosahedronGeometry(0.5, 1)),
    torus: nz(new T.TorusGeometry(0.5, 0.07, 6, 18)),
    tire: nz(new T.TorusGeometry(0.31, 0.13, 7, 14).rotateY(PI / 2)),
    rock: rock(1),
    prism: nz(ext(poly([[-0.5, 0], [0.5, 0], [0, 1]]))),
    arch: nz(ext(sArch)), half: nz(ext(sHalf)),
    jer: nz(ext(poly([[-0.3, 0], [0.3, 0], [0.3, 0.2], [0.12, 0.5], [0.1, 1], [-0.1, 1], [-0.12, 0.5], [-0.3, 0.2]]))),
    bell: lathe([[0.5, 0], [0.5, 0.03], [0.36, 0.2], [0.28, 0.5], [0.24, 0.85], [0.18, 0.98], [0.02, 1]])
  };
  const part = (w, h, d, x, y, z) => nz(new T.BoxGeometry(w, h, d).translate(x, y, z));
  const chairGeo = mergeGeometries([part(0.42, 0.05, 0.42, 0, 0.45, 0), part(0.42, 0.5, 0.04, 0, 0.72, -0.19), part(0.04, 0.45, 0.04, -0.18, 0.225, -0.18),
    part(0.04, 0.45, 0.04, 0.18, 0.225, -0.18), part(0.04, 0.45, 0.04, -0.18, 0.225, 0.18), part(0.04, 0.45, 0.04, 0.18, 0.225, 0.18)], false);

  // ---- clutter in istanze (1 draw call ciascuno) ----
  const inst = {};
  const def = (n, geo, mat, cast) => { inst[n] = { geo: geo, mat: mat, list: [], cast: cast !== false }; };
  def('rk', rock(0), P.rub); def('rk2', rock(0), P.stone);
  def('brk', new T.BoxGeometry(0.26, 0.11, 0.13), P.brick); def('blk', new T.BoxGeometry(0.55, 0.3, 0.35), P.stone);
  def('bag', new T.SphereGeometry(0.5, 8, 5).scale(0.62, 0.23, 0.36), P.bag);
  def('wire', new T.TorusGeometry(0.38, 0.014, 5, 14), P.metD, false);
  def('plk', new T.BoxGeometry(1, 0.05, 0.2), P.char); def('bm', new T.BoxGeometry(0.2, 0.2, 1), P.woodD);
  def('scr', new T.BoxGeometry(0.7, 0.03, 0.5), P.rust); def('rb', new T.CylinderGeometry(0.015, 0.015, 1, 5).translate(0, 0.5, 0), P.rust, false);
  def('chr', chairGeo, P.woodD); def('itm', new T.BoxGeometry(0.2, 0.24, 0.16), P.cloth, false); def('itm2', new T.BoxGeometry(0.16, 0.2, 0.16), P.pBlue, false);
  def('tile', new T.BoxGeometry(0.3, 0.03, 0.2), P.roof, false);
  def('smk1', new T.IcosahedronGeometry(0.5, 1), P.smk1, false); def('smk2', new T.IcosahedronGeometry(0.5, 1), P.smk2, false);

  // ---- sistema di riferimento locale + raccolta delle mesh da fondere ----
  const D = new T.Object3D(), M = new T.Matrix4(), PM = new T.Matrix4(), pool = new Map();
  const fr = { on: false, x: 0, y: 0, z: 0, r: 0, c: 1, s: 0 };
  const wx = (x, z) => (fr.on ? fr.x + x * fr.c + z * fr.s : x);
  const wz = (x, z) => (fr.on ? fr.z - x * fr.s + z * fr.c : z);
  const wy = y => (fr.on ? fr.y + y : y);
  const wr = r => (fr.on ? fr.r : 0) + (r || 0);
  const box = (x, y, z, w, h, d, mat, r, collide, cast) => kit.box(wx(x, z), wy(y), wz(x, z), w, h, d, mat, { collide: collide, rotY: wr(r), cast: cast });
  const mtx = (x, y, z, sx, sy, sz, rx, ry, rz) => {
    D.position.set(x, y, z); D.rotation.set(rx || 0, ry || 0, rz || 0);
    D.scale.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
    D.updateMatrix(); M.copy(D.matrix); if (fr.on) M.premultiply(PM); return M;
  };
  const push = (mat, g) => { let a = pool.get(mat); if (!a) { a = []; pool.set(mat, a); } a.push(g); };
  const c = { kit: kit, T: T, P: P, PI: PI, K: 0.14, nz: nz, lathe: lathe };
  c.rn = () => kit.rng(); c.R = (a, b) => kit.rand(a, b); c.pk = arr => kit.pick(arr);
  c.fr = (x, y, z, r) => {                       // attiva (o spegne, senza argomenti) il riferimento locale
    if (x === undefined) { fr.on = false; return; }
    fr.on = true; fr.x = x; fr.y = y; fr.z = z; fr.r = r || 0; fr.c = Math.cos(fr.r); fr.s = Math.sin(fr.r);
    PM.makeRotationY(fr.r).setPosition(x, y, z);
  };
  c.wp = (x, z) => [wx(x, z), wz(x, z)];
  c.b = (x, y, z, w, h, d, mat, r) => box(x, y, z, w, h, d, mat, r, false, true);    // box decorativo
  c.s = (x, y, z, w, h, d, mat, r) => box(x, y, z, w, h, d, mat, r, true, true);     // box solido
  c.f = (x, y, z, w, h, d, mat, r) => box(x, y, z, w, h, d, mat, r, false, false);   // box piatto senza ombra
  c.d = (x, z, w, d, r, mat) => kit.decal(wx(x, z), wz(x, z), w, d, wr(r), mat);
  c.stain = (x, y, z, w, d, r, mat) => { if (wy(y) > 0.02) c.f(x, y, z, w, 0.012, d, mat, r); else c.d(x, z, w, d, r, mat); };
  c.g = (n, mat, x, y, z, sx, sy, sz, rx, ry, rz) => { const g = (typeof n === 'string' ? GEO[n] : n).clone(); g.applyMatrix4(mtx(x, y, z, sx, sy, sz, rx, ry, rz)); push(mat, g); };
  c.i = (n, x, y, z, sx, sy, sz, rx, ry, rz) => { inst[n].list.push(mtx(x, y, z, sx, sy, sz, rx, ry, rz).clone()); };
  c.rod = (mat, x1, y1, z1, x2, y2, z2, rad, n) => {            // asta tra due punti (cavi, tubi, rami)
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz); if (L < 0.01) return;
    D.rotation.order = 'YXZ'; D.position.set(x1, y1, z1); D.rotation.set(Math.acos(dy / L), Math.atan2(dx, dz), 0);
    D.scale.set(rad * 2, L, rad * 2); D.updateMatrix(); D.rotation.order = 'XYZ';
    M.copy(D.matrix); if (fr.on) M.premultiply(PM);
    const g = GEO[n || 'cyl'].clone(); g.applyMatrix4(M); push(mat, g);
  };
  c.col = (x, y, z, w, h, d, r) => {                            // collider per rettangoli ruotati (catena di AABB)
    const a = wr(r), X = wx(x, z), Z = wz(x, z), Y = wy(y), cs = Math.cos(a), sn = Math.sin(a);
    if (Math.abs(sn * cs) < 0.06) { const sw = Math.abs(cs) > 0.5 ? w : d, sd = Math.abs(cs) > 0.5 ? d : w; kit.collider(X - sw / 2, Y, Z - sd / 2, X + sw / 2, Y + h, Z + sd / 2); return; }
    const lon = Math.max(w, d), sho = Math.min(w, d), n = Math.max(1, Math.round(lon / sho * 1.2)), hs = sho * 0.55;
    const lx = d >= w ? sn : cs, lz = d >= w ? cs : -sn;
    for (let k = 0; k < n; k++) { const t = n === 1 ? 0 : (k / (n - 1) - 0.5) * (lon - sho); kit.collider(X + lx * t - hs, Y, Z + lz * t - hs, X + lx * t + hs, Y + h, Z + lz * t + hs); }
  };
  c.flush = () => {
    pool.forEach((list, mat) => { for (let k = 0; k < list.length; k += 900) { const g = mergeGeometries(list.slice(k, k + 900), false); if (g) kit.mesh(g, mat, { x: 0, y: 0, z: 0, rotY: 0, rotX: 0, rotZ: 0, scale: 1 }, { collide: false }); } });
    for (const n in inst) { const o = inst[n]; if (o.list.length) kit.instanced(o.geo, o.mat, o.list, { cast: o.cast }); }
  };
  return c;
}

// ---------------------------------------------------------------------------
// Oggetti di scena riusabili
// ---------------------------------------------------------------------------
function map_ruins_props(c) {
  const kit = c.kit, P = c.P, PI = Math.PI, R = c.R, rn = c.rn;

  c.steps = (x, y, z, wd, rise, run, dir, mat, solid) => {      // scala mia: dir 0=-Z 1=+X 2=+Z 3=-X
    const n = Math.ceil(rise / 0.25), t = run / n, fx = [0, 1, 0, -1][dir], fz = [-1, 0, 1, 0][dir];
    for (let k = 0; k < n; k++) { const top = (k + 1) * rise / n, h = solid ? top : 0.2, o = (k + 0.5) * t;
      kit.box(x + fx * o, y + top - h, z + fz * o, fx ? t : wd, h, fx ? wd : t, mat, { collide: true, rotY: 0, cast: true }); }
  };
  c.pave = (x0, z0, x1, z1, mat, hole) => {                     // lastra di marciapiede con cordolo (e buco per l'edificio)
    const h = c.K, q = hole ? [[x0, z0, x1, hole[1]], [x0, hole[3], x1, z1], [x0, hole[1], hole[0], hole[3]], [hole[2], hole[1], x1, hole[3]]] : [[x0, z0, x1, z1]];
    for (const e of q) if (e[2] - e[0] > 0.05 && e[3] - e[1] > 0.05) kit.box((e[0] + e[2]) / 2, 0, (e[1] + e[3]) / 2, e[2] - e[0], h, e[3] - e[1], mat, { collide: true, rotY: 0, cast: false });
    c.f((x0 + x1) / 2, 0, z0 + 0.09, x1 - x0 + 0.04, h + 0.015, 0.22, P.stone); c.f((x0 + x1) / 2, 0, z1 - 0.09, x1 - x0 + 0.04, h + 0.015, 0.22, P.stone);
    c.f(x0 + 0.09, 0, (z0 + z1) / 2, 0.22, h + 0.015, z1 - z0 + 0.04, P.stone); c.f(x1 - 0.09, 0, (z0 + z1) / 2, 0.22, h + 0.015, z1 - z0 + 0.04, P.stone);
  };
  c.smoke = (x, y, z, h, rad, dx, dz) => {                      // colonna di fumo semitrasparente
    const n = Math.max(7, Math.round(h * 0.8));
    for (let i = 0; i < n; i++) { const t = i / (n - 1), s = rad * (0.8 + t * 2.4) * R(0.85, 1.2);
      c.i(t < 0.5 ? 'smk1' : 'smk2', x + dx * t * t + R(-0.3, 0.3) * (1 + t), y + t * h, z + dz * t * t + R(-0.3, 0.3) * (1 + t), s * 2, s * 1.7, s * 2, R(0, 3), R(0, 3), 0); }
  };
  c.scat = (name, n, x, y, z, r, h, s0, s1) => {
    for (let i = 0; i < n; i++) { const a = R(0, 6.283), q = Math.sqrt(rn()) * r, s = R(s0, s1), k = 1 - q / (r + 0.01);
      c.i(name, x + Math.cos(a) * q, y + 0.05 + k * h * R(0.5, 1), z + Math.sin(a) * q, s * R(0.8, 1.3), s * R(0.6, 1), s * R(0.8, 1.3), R(-0.6, 0.6), R(0, 6.28), R(-0.6, 0.6)); }
  };
  c.crack = (x, y, z, r0, a, len) => {
    let px = x + Math.cos(a) * r0, pz = z + Math.sin(a) * r0;
    for (let k = 0; k < 3; k++) { const l = len / 3, b = a + R(-0.5, 0.5), qx = px + Math.cos(b) * l, qz = pz + Math.sin(b) * l;
      c.g('cbox', P.scorch, (px + qx) / 2, y + 0.024, (pz + qz) / 2, l + 0.04, 0.008, 0.07 - k * 0.015, 0, -b, 0); px = qx; pz = qz; }
  };
  c.rubble = (x, y, z, r, h, solid) => {                        // cumulo vero: nucleo + mattoni, blocchi, travi, ferri
    c.stain(x, y, z, r * 2.8, r * 2.8, R(0, 3), P.rub);
    c.g('rock', P.rub, x, y, z, r * 2.1, h * 1.9, r * 2.1, 0, R(0, 6), 0);
    c.g('rock', P.rub, x + R(-0.5, 0.5) * r, y, z + R(-0.5, 0.5) * r, r * 1.3, h * 1.3, r * 1.5, 0, R(0, 6), 0);
    c.g('rock', P.cdark, x + R(-0.6, 0.6) * r, y, z + R(-0.6, 0.6) * r, r * 0.9, h * 1.1, r * 0.8, 0, R(0, 6), 0);
    c.scat('rk', Math.round(8 + r * 7), x, y, z, r * 1.15, h, 0.3, 0.75); c.scat('rk2', Math.round(3 + r * 3), x, y, z, r * 1.2, h, 0.25, 0.6);
    c.scat('brk', Math.round(10 + r * 8), x, y, z, r * 1.4, h, 0.8, 1.3); c.scat('blk', Math.round(2 + r * 2), x, y, z, r * 1.2, h * 0.8, 0.8, 1.3);
    c.scat('tile', Math.round(r * 3), x, y, z, r * 1.5, h * 0.5, 0.8, 1.2);
    for (let i = 0, n = Math.round(1 + r); i < n; i++) c.i('bm', x + R(-0.6, 0.6) * r, y + h * R(0.4, 0.9), z + R(-0.6, 0.6) * r, 1, 1, R(1.6, 3.2), R(-0.5, 0.5), R(0, 6.28), 0);
    for (let i = 0, n = Math.round(2 + r * 2); i < n; i++) c.i('rb', x + R(-0.7, 0.7) * r, y + h * R(0.2, 0.7), z + R(-0.7, 0.7) * r, 1, R(0.6, 1.5), 1, R(-0.9, 0.9), 0, R(-0.9, 0.9));
    if (solid) { const n = Math.max(1, Math.ceil(h / 0.48)); for (let k = 0; k < n; k++) { const s = r * (1.5 - 0.9 * k / n); kit.collider(x - s / 2, y, z - s / 2, x + s / 2, y + (k + 1) * h / n * 0.9, z + s / 2); } }
  };
  c.crater = (x, y, z, r, fire) => {                            // cratere con bordo rialzato
    c.stain(x, y, z, r * 3, r * 3, R(0, 3), P.scorch); c.stain(x, y + 0.004, z, r * 1.7, r * 1.7, R(0, 3), P.dirt);
    const n = Math.round(7 + r * 2);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(-0.15, 0.15), q = r * R(0.85, 1.1);
      c.g('rock', i % 3 ? P.dirt : P.rub, x + Math.cos(a) * q, y, z + Math.sin(a) * q, r * R(0.55, 0.85), R(0.5, 0.95), r * R(0.4, 0.6), 0, PI / 2 - a, 0); }
    c.scat('rk', 10, x, y, z, r * 1.5, 0.3, 0.2, 0.55); c.scat('scr', 4, x, y, z, r, 0.1, 0.8, 1.4); c.scat('brk', 8, x, y, z, r * 1.6, 0.1, 0.8, 1.2);
    for (let i = 0; i < 5; i++) c.crack(x, y, z, r * 1.2, i * 1.26 + R(-0.3, 0.3), r * R(1.2, 2));
    if (fire) { c.g('rock', P.ember, x, y, z, r * 0.5, 0.25, r * 0.4, 0, R(0, 3), 0); c.smoke(x, y + 0.4, z, 12, 0.55, R(1, 2.2), R(-1.6, -0.6)); }
  };
  c.bags = (x, y, z, len, r, rows, wire, nocol) => {            // muro di sacchi (+ filo spinato a spirale sul lato wire=±1)
    rows = rows || 4; c.fr(x, y, z, r);
    const cols = Math.max(2, Math.round(len / 0.57));
    for (let j = 0; j < rows; j++) for (let dp = 0; dp < (j < rows - 1 ? 2 : 1); dp++) for (let i = 0; i < cols - (j % 2); i++) {
      if (j === rows - 1 && rn() < 0.18) continue;
      c.i('bag', (i + 0.5 + (j % 2) * 0.5 - cols / 2) * 0.57 + R(-0.03, 0.03), 0.11 + j * 0.205, (j < rows - 1 ? dp * 0.34 - 0.17 : 0) + R(-0.03, 0.03), R(0.95, 1.08), R(0.9, 1.1), R(0.95, 1.08), R(-0.06, 0.06), R(-0.1, 0.1), R(-0.06, 0.06)); }
    if (!nocol) c.col(0, 0, 0, len, rows * 0.205 + 0.05, 0.66, 0);
    if (wire) { const wzz = wire * 1.05;
      for (let s = -len / 2; s <= len / 2; s += 0.21) c.i('wire', s, 0.42 + R(-0.04, 0.04), wzz, 1, 1, 1, R(-0.25, 0.25), PI / 2 + R(-0.2, 0.2), 0);
      for (const s of [-len / 2, 0, len / 2]) { c.g('cbox', P.woodD, s, 0.45, wzz, 0.07, 1.1, 0.07, 0.6, 0, 0); c.g('cbox', P.woodD, s, 0.45, wzz, 0.07, 1.1, 0.07, -0.6, 0, 0); }
      c.col(0, 0, wzz, len, 0.8, 0.5, 0); }
    c.fr();
  };
  c.hedgehog = (x, y, z) => { const a = R(0, 6);              // cavallo di Frisia
    c.g('cbox', P.rust, x, y + 0.62, z, 0.13, 1.9, 0.13, 0.95, a, 0); c.g('cbox', P.rust, x, y + 0.62, z, 0.13, 1.9, 0.13, -0.6, a + 2.1, 0.75); c.g('cbox', P.rust, x, y + 0.62, z, 0.13, 1.9, 0.13, 0.25, a + 4.2, -0.95);
    kit.collider(x - 0.55, y, z - 0.55, x + 0.55, y + 1.15, z + 0.55); };
  c.barrelFire = (x, y, z, light) => {
    kit.cyl(x, y, z, 0.3, 0.3, 0.9, P.rust, { collide: true, seg: 12 });
    c.g('torus', P.metD, x, y + 0.3, z, 0.62, 0.62, 0.9, PI / 2, 0, 0); c.g('torus', P.metD, x, y + 0.62, z, 0.62, 0.62, 0.9, PI / 2, 0, 0);
    c.g('cyl12', P.ember, x, y + 0.84, z, 0.52, 0.05, 0.52);
    for (let i = 0; i < 4; i++) c.g('spk', P.fire, x + R(-0.12, 0.12), y + 0.86, z + R(-0.12, 0.12), R(0.14, 0.24), R(0.35, 0.7), R(0.14, 0.24), R(-0.2, 0.2), R(0, 3), R(-0.2, 0.2));
    c.stain(x, y, z, 2.4, 2.4, R(0, 3), P.scorch); c.smoke(x, y + 1.4, z, 9, 0.32, R(0.6, 1.4), R(-1.2, -0.4)); c.scat('plk', 3, x, y, z, 1.2, 0.05, 0.6, 1);
    if (light) kit.light(x, y + 1.7, z, 0xff7a2a, 4.2, 20);
  };
  c.jersey = (x, y, z, len, r) => { c.g('jer', P.walk, x, y, z, 1, 1, len, 0, r, 0); c.col(x, y, z, 0.6, 1.0, len, r); };
  c.stack = (x, y, z, r, v) => {                                // pallet + casse + barile
    c.fr(x, y, z, r);
    c.b(0, 0.1, 0, 1.25, 0.04, 1.05, P.wood); for (const lx of [-0.5, 0, 0.5]) c.b(lx, 0, 0, 0.1, 0.1, 1.05, P.woodD);
    c.s(-0.1, 0.14, 0, 1.0, 0.8, 0.9, v ? P.pGreen : P.wood, 0.06); c.b(-0.1, 0.5, 0, 1.03, 0.08, 0.93, P.woodD, 0.06);
    if (v !== 2) c.s(0.05, 0.94, 0.05, 0.7, 0.55, 0.7, P.woodD, -0.2);
    c.s(1.15, 0, 0.3, 0.8, 0.65, 0.8, P.wood, 0.3); c.b(1.15, 0.28, 0.3, 0.83, 0.07, 0.83, P.woodD, 0.3);
    c.g('cyl12', v ? P.pBlue : P.rust, -1.05, 0, 0.35, 0.58, 0.9, 0.58); c.g('torus', P.metD, -1.05, 0.45, 0.35, 0.6, 0.6, 0.8, PI / 2, 0, 0);
    c.col(-1.05, 0, 0.35, 0.58, 0.9, 0.58, 0); c.fr();
  };
  c.lamp = (x, y, z, r, st) => {                                // lampione in ghisa: 0 spento, 1 acceso, 2 piegato, 3 a terra
    c.g('cyl12', P.metD, x, y, z, 0.42, 0.5, 0.42); c.g('cone', P.metD, x, y + 0.5, z, 0.26, 0.5, 0.26);
    const dx = Math.sin(r), dz = Math.cos(r);
    if (st === 3) { c.rod(P.metD, x, y + 0.9, z, x + dx * 4.4, y + 0.25, z + dz * 4.4, 0.06); c.g('box', P.glass, x + dx * 4.5, y + 0.1, z + dz * 4.5, 0.36, 0.3, 0.5, 0, r, 0.4); return; }
    const lean = st === 2 ? 1.4 : 0.06, tx = x + dx * lean, tz = z + dz * lean, ty = y + (st === 2 ? 4.3 : 4.7);
    c.rod(P.metD, x, y + 0.9, z, tx, ty, tz, 0.055); c.g('torus', P.metD, x, y + 1.4, z, 0.2, 0.2, 0.6, PI / 2, 0, 0);
    c.rod(P.metD, tx, ty, tz, tx + dx * 0.9, ty + 0.25, tz + dz * 0.9, 0.035); c.rod(P.metD, tx, ty - 0.6, tz, tx + dx * 0.7, ty + 0.2, tz + dz * 0.7, 0.02);
    const lx = tx + dx * 0.9, lz = tz + dz * 0.9;
    c.g('pyr', P.metD, lx, ty + 0.02, lz, 0.5, 0.22, 0.5, 0, r, 0); c.g('pyr', st === 1 ? P.win : P.glass, lx, ty, lz, 0.4, 0.42, 0.4, PI, r, 0);
    kit.collider(x - 0.15, y, z - 0.15, x + 0.15, y + 3, z + 0.15);
  };
  c.cable = (x1, y1, z1, x2, y2, z2, sag) => { let px = x1, py = y1, pz = z1;
    for (let k = 1; k <= 4; k++) { const t = k / 4, qx = x1 + (x2 - x1) * t, qy = y1 + (y2 - y1) * t - sag * 4 * t * (1 - t), qz = z1 + (z2 - z1) * t;
      c.rod(P.metD, px, py, pz, qx, qy, qz, 0.016, 'cyl5'); px = qx; py = qy; pz = qz; } };
  c.tree = (x, y, z, s) => {                                    // albero bruciato: tronco storto, rami, ciuffi secchi
    const h = R(2.6, 3.4) * s, tx = x + R(-0.4, 0.4), tz = z + R(-0.4, 0.4), nb = 3 + Math.floor(rn() * 3);
    c.rod(P.char, x, y, z, tx, y + h, tz, 0.24 * s, 'cone'); c.g('cone', P.char, x, y, z, 0.8 * s, 0.35, 0.8 * s);
    for (let i = 0; i < nb; i++) { const a = i / nb * 6.283 + R(-0.5, 0.5), l = R(1.4, 2.4) * s, bx = tx + Math.cos(a) * l, by = y + h + R(0.9, 1.9) * s, bz = tz + Math.sin(a) * l;
      c.rod(P.char, tx, y + h - 0.15, tz, bx, by, bz, 0.12 * s, 'cone');
      for (let j = 0; j < 2; j++) { const a2 = a + R(-1, 1), l2 = R(0.7, 1.3) * s, ex = bx + Math.cos(a2) * l2, ey = by + R(0.3, 1) * s, ez = bz + Math.sin(a2) * l2;
        c.rod(P.char, bx, by, bz, ex, ey, ez, 0.05 * s, 'cone');
        if (rn() < 0.55) c.g('rock', P.dirt, ex, ey, ez, R(0.7, 1.3) * s, R(0.5, 0.9) * s, R(0.7, 1.3) * s, R(0, 3), R(0, 3), 0); } }
    kit.collider(x - 0.22 * s, y, z - 0.22 * s, x + 0.22 * s, y + h, z + 0.22 * s);
  };
  c.bench = (x, y, z, r) => { c.fr(x, y, z, r);
    for (const lx of [-0.75, 0.75]) { c.g('box', P.metD, lx, 0, 0, 0.06, 0.45, 0.5); c.g('box', P.metD, lx, 0.45, -0.22, 0.06, 0.45, 0.06, -0.2, 0, 0); }
    for (let k = 0; k < 3; k++) c.g('box', P.wood, 0, 0.43, -0.16 + k * 0.16, 1.7, 0.04, 0.13);
    for (let k = 0; k < 2; k++) if (rn() < 0.8) c.g('box', P.wood, 0, 0.58 + k * 0.17, -0.27 - k * 0.035, 1.7, 0.13, 0.04, -0.2, 0, 0);
    c.col(0, 0, 0, 1.7, 0.5, 0.5, 0); c.fr(); };
  c.car = (x, z, r, paint, burnt, y) => {                       // auto (davanti = -Z), ~30 pezzi
    y = y || 0; if (burnt) c.stain(x, y, z, 3.4, 5.6, r, P.scorch);
    const body = burnt ? P.rust : paint, sag = burnt ? 0.12 : 0, gl = burnt ? P.cdark : P.glass; c.fr(x, y, z, r);
    c.b(0, 0.32 - sag, 0, 1.76, 0.5, 4.2, body); c.b(0, 0.82 - sag, 0.25, 1.62, 0.1, 2.0, body); c.b(0, 1.36 - sag, 0.3, 1.5, 0.07, 1.5, body);
    for (const sx of [-1, 1]) { c.g('box', body, sx * 0.72, 0.9 - sag, -0.75, 0.07, 0.56, 0.07, 0.5, 0, 0); c.g('box', body, sx * 0.72, 0.9 - sag, 0.3, 0.07, 0.48, 0.07); c.g('box', body, sx * 0.72, 0.9 - sag, 1.25, 0.07, 0.52, 0.07, -0.4, 0, 0);
      c.b(sx * 0.62, 0.52 - sag, -2.11, 0.26, 0.16, 0.06, gl); c.b(sx * 0.66, 0.55 - sag, 2.11, 0.22, 0.12, 0.05, burnt ? P.cdark : P.cloth);
      if (!burnt) c.b(sx * 0.76, 0.92, 0.28, 0.03, 0.4, 1.7, P.glass); }
    if (!burnt) { c.g('box', P.glass, 0, 0.9, -0.74, 1.44, 0.54, 0.04, 0.5, 0, 0); c.g('box', P.glass, 0, 0.9, 1.25, 1.44, 0.5, 0.04, -0.4, 0, 0); }
    c.g('box', body, 0, 0.8 - sag, -1.45, 1.66, 0.05, 1.3, burnt ? 0.5 : 0.05, 0, 0);
    c.b(0, 0.3 - sag, -2.14, 1.8, 0.16, 0.12, P.metD); c.b(0, 0.3 - sag, 2.14, 1.8, 0.16, 0.12, P.metD); c.b(0, 0.5 - sag, -2.11, 0.9, 0.2, 0.05, P.cdark);
    let k = 0; for (const sx of [-1, 1]) for (const sz of [-1.35, 1.35]) { const flat = burnt && (k++ % 2 === 0);
      if (!flat) c.g('tire', P.rubber, sx * 0.84, 0.42, sz, 1, 1, 1); c.g('hub', burnt ? P.rust : P.met, sx * 0.84, flat ? 0.22 : 0.42, sz, 0.16, 0.42, 0.42); }
    c.g('box', body, 0.95, 0.34 - sag, 0.1, 0.05, 0.9, 1.0, 0, -0.9, 0);
    c.col(0, 0, 0, 1.8, 1.35, 4.2, 0); c.fr();
    if (burnt) { c.scat('scr', 3, x, y, z, 2.6, 0.05, 0.8, 1.3); c.scat('rk', 4, x, y, z, 2.8, 0.05, 0.15, 0.3); }
  };
  c.truck = (x, z, r, burnt, y) => {                            // camion militare (davanti = -Z)
    y = y || 0; if (burnt) c.stain(x, y, z, 4, 8, r, P.scorch);
    const body = burnt ? P.rust : P.pGreen, gl = burnt ? P.cdark : P.glass; c.fr(x, y, z, r);
    c.b(0, 0.7, 0.3, 1.0, 0.22, 6.6, P.metD); c.b(0, 0.92, -2.2, 2.2, 1.45, 1.7, body); c.b(0, 2.37, -2.2, 2.26, 0.08, 1.8, body);
    c.b(0, 0.92, -3.65, 1.7, 0.85, 1.25, body); c.g('box', body, 0, 1.77, -3.65, 1.74, 0.05, 1.3, 0.06, 0, 0);
    c.b(0, 1.0, -4.3, 1.3, 0.62, 0.06, P.cdark); c.b(0, 0.62, -4.42, 2.3, 0.2, 0.16, P.metD);
    for (const sx of [-1, 1]) { c.b(sx * 0.98, 1.05, -3.7, 0.36, 0.1, 1.3, body); c.b(sx * 0.78, 1.25, -4.3, 0.24, 0.24, 0.08, gl);
      c.b(sx * 0.5, 1.72, -3.07, 0.92, 0.6, 0.04, gl); c.b(sx * 1.11, 1.62, -2.2, 0.03, 0.6, 1.0, gl); c.b(sx * 1.12, 1.07, 1.2, 0.06, 0.6, 4.3, P.woodD);
      for (const wz of [-3.5, 0.9, 2.3]) { c.g('tire', P.rubber, sx * 1.0, 0.56, wz, 1.5, 1.28, 1.28); c.g('hub', burnt ? P.rust : P.pGreen, sx * 1.0, 0.56, wz, 0.3, 0.5, 0.5); } }
    c.b(0, 0.95, 1.2, 2.3, 0.12, 4.3, P.wood); c.b(0, 1.07, -0.92, 2.3, 0.75, 0.06, P.woodD); c.g('box', P.woodD, 0, 0.95, 3.38, 2.3, 0.6, 0.06, 2.2, 0, 0);
    for (let k = 0; k < 4; k++) { const hz = -0.7 + k * 1.3; c.g('arch', P.metD, 0, 1.67, hz, 2.3, 2.0, 0.05); for (const sx of [-1, 1]) c.rod(P.metD, sx * 1.1, 1.07, hz, sx * 1.1, 1.67, hz, 0.025); }
    if (!burnt) c.g('arch', P.net, 0, 1.69, 0.6, 2.4, 2.1, 2.7);
    c.g('cyl12', P.metD, 1.0, 0.55, -1.0, 0.45, 1.0, 0.45, PI / 2, 0, 0); c.g('tire', P.rubber, 0, 1.5, -1.25, 1.3, 1.2, 1.2, 0, PI / 2, 0);
    c.b(-0.3, 1.07, 0.6, 0.9, 0.6, 0.9, P.wood, 0.2); c.b(0.5, 1.07, 1.8, 0.7, 0.5, 1.0, P.pGreen, -0.1);
    c.col(0, 0, 0.3, 2.3, 2.5, 6.9, 0); c.fr();
  };
  c.tank = (x, z, r, y) => {                                    // carro armato fuori uso
    y = y || 0; c.stain(x, y, z, 5, 8, r, P.scorch); c.fr(x, y, z, r);
    for (const sx of [-1, 1]) { c.b(sx * 1.3, 0, 0, 0.55, 0.85, 6.0, P.metD); c.b(sx * 1.3, 0.85, 0, 0.7, 0.06, 6.0, P.pGreen);
      for (let k = 0; k < 6; k++) c.g('hub', P.rust, sx * 1.58, 0.4, -2.5 + k, 0.08, 0.72, 0.72); }
    c.b(0, 0.4, 0, 2.1, 0.75, 5.6, P.pGreen); c.g('box', P.pGreen, 0, 0.75, -2.5, 2.1, 0.5, 1.4, -0.9, 0, 0);
    c.b(0, 1.15, 0.5, 1.9, 0.6, 2.3, P.pGreen, 0.5); c.g('cyl12', P.pGreen, 0, 1.75, 0.5, 0.7, 0.14, 0.7); c.g('cyl12', P.metD, 0.3, 1.8, 0.4, 0.6, 0.05, 0.6, 0, 0, 0.9);
    c.rod(P.metD, -0.55, 1.45, -0.5, -2.3, 1.15, -3.6, 0.09); c.b(-0.5, 1.2, -0.45, 0.6, 0.5, 0.5, P.metD, 0.5);
    c.g('cyl', P.rust, 0.6, 1.15, 2.6, 0.2, 0.9, 0.2, PI / 2, 0, 0); c.g('cyl', P.rust, -0.6, 1.15, 2.6, 0.2, 0.9, 0.2, PI / 2, 0, 0);
    c.g('rock', P.ember, 0.2, 1.2, 1.9, 0.9, 0.4, 0.8); c.col(0, 0, 0, 3.1, 1.75, 6.0, 0); const f = c.wp(0.2, 1.9); c.fr();
    c.smoke(f[0], y + 1.6, f[1], 13, 0.6, R(1, 2), R(-1.5, -0.5));
  };
  c.container = (x, y, z, r, m) => { c.fr(x, y, z, r); c.b(0, 0, 0, 2.44, 2.59, 6.06, m);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.b(sx * 1.2, 0, sz * 3.0, 0.14, 2.62, 0.14, P.metD);
    c.b(0, 2.56, 0, 2.5, 0.07, 6.1, P.metD); for (const sx of [-0.6, 0.6]) c.rod(P.met, sx, 0.2, 3.06, sx, 2.4, 3.06, 0.025); c.b(0, 1.2, 3.05, 2.0, 0.08, 0.04, P.met);
    c.col(0, 0, 0, 2.44, 2.59, 6.06, 0); c.fr(); };
  c.fence = (x0, z0, x1, z1, y) => {                            // cancellata in ferro su muretto
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / 3));
    c.fr((x0 + x1) / 2, y, (z0 + z1) / 2, Math.atan2(dx, dz));
    c.b(0, 0, 0, 0.3, 0.4, L, P.stone); c.g('box', P.metD, 0, 1.5, 0, 0.05, 0.05, L); c.g('box', P.metD, 0, 0.55, 0, 0.04, 0.04, L);
    for (let s = -L / 2 + 0.1; s <= L / 2; s += 0.19) c.g('box', P.metD, 0, 0.4, s, 0.025, 1.25, 0.025);
    for (let k = 0; k <= n; k++) { c.b(0, 0, -L / 2 + k * L / n, 0.36, 1.6, 0.36, P.stone); c.g('pyr', P.stone, 0, 1.6, -L / 2 + k * L / n, 0.44, 0.25, 0.44); }
    c.col(0, 0, 0, 0.3, 1.6, L, 0); c.fr();
  };
  c.barricade = (x, y, z, len, r) => {                          // barricata di mobili
    c.fr(x, y, z, r);
    c.b(-len * 0.28, 0, 0, 2.0, 0.95, 0.6, P.woodD, 0.08); c.b(-len * 0.28, 0.3, 0.31, 0.8, 0.5, 0.02, P.wood, 0.08);
    c.b(len * 0.2, 0, 0.1, 1.5, 1.0, 0.07, P.wood, -0.1); for (const sx of [-0.6, 0.6]) for (const sy of [0.15, 0.85]) c.g('box', P.woodD, len * 0.2 + sx, sy, 0.1, 0.06, 0.7, 0.06, PI / 2, 0, 0);
    c.g('box', P.cream, 0.1, 0, -0.5, 1.0, 1.9, 0.18, 0.5, 0.2, 0); c.g('box', P.wood, -len * 0.1, 0, 0.55, 0.9, 2.0, 0.05, -0.45, -0.3, 0);
    c.i('chr', len * 0.42, 0.25, 0.2, 1, 1, 1, 1.4, 0.5, 0); c.i('chr', -len * 0.45, 1.0, 0, 1, 1, 1, 0.3, 2, 0.4); c.i('chr', 0.3, 0.95, 0.1, 1, 1, 1, 2.6, 1, 0);
    c.g('cyl12', P.rust, len * 0.45, 0, -0.4, 0.58, 0.88, 0.58); c.g('torus', P.woodD, -len * 0.45, 0.55, 0.5, 1.1, 1.1, 1.2, 0, 0.4, 0.2);
    c.b(0, 0.95, 0, 0.9, 0.5, 0.5, P.woodD, 0.3); c.col(0, 0, 0, len, 1.15, 0.9, 0); c.fr();
  };
  c.shell = (x, y, z, len, r, fl, mat) => {                     // facciata sventrata (r = 0 oppure PI/2), con porta al centro
    const bays = Math.max(3, Math.round(len / 3.2)), bw = len / bays, door = Math.floor(bays / 2);
    c.fr(x, y, z, r);
    for (let i = 0; i < bays; i++) { const lx = (i + 0.5 - bays / 2) * bw, top = Math.max(1, Math.round(fl * R(0.4, 1.05)));
      for (let f = 0; f < top; f++) { const y0 = f * 3.4, last = f === top - 1;
        c.s(lx - bw / 2 + 0.45, y0, 0, 0.9, last ? R(1.6, 3.3) : 3.4, 0.5, mat); c.s(lx + bw / 2 - 0.45, y0, 0, 0.9, last ? R(1.3, 3.1) : 3.4, 0.5, mat);
        if (f > 0 || i !== door) { c.s(lx, y0, 0, bw - 1.8, 1.0, 0.5, mat); c.b(lx, y0 + 0.98, 0.06, bw - 1.6, 0.1, 0.7, P.stone); }
        if (!last) { c.s(lx, y0 + 2.6, 0, bw - 1.8, 0.8, 0.5, mat); c.b(lx, y0 + 3.26, 0.05, bw, 0.2, 0.66, P.stone); if (rn() < 0.6) c.b(lx, y0 + 2.62, 0.26, bw - 2.0, 0.76, 0.02, P.scorch); } }
      if (rn() < 0.6) c.i('bm', lx, top * 3.4 - R(0.5, 1.6), -1.3, 1, 1, R(2.4, 3.6), R(0.3, 0.8), R(-0.3, 0.3), 0);
      for (let k = 0; k < 3; k++) c.i('rb', lx + R(-1, 1), top * 3.4 - 1.2, 0, 1, R(0.5, 1.2), 1, R(-0.8, 0.8), 0, R(-0.8, 0.8)); }
    c.g('cbox', P.walk, R(-1, 1), 2.7, -1.7, len * 0.45, 0.22, 3.0, 0.42, 0, 0);
    const p = c.wp(0, -2.2); c.fr(); c.rubble(p[0], y, p[1], 2.4, 1.0, true);
  };
}

// ---------------------------------------------------------------------------
// Palazzi di bordo (non entrabili): facciata europea completa sul lato interno
// v: 0 = residenziale, 1 = con negozi, 2 = sventrato
// ---------------------------------------------------------------------------
function map_ruins_palazzo(c, x, z, r, w, d, fl, wall, v) {
  const P = c.P, R = c.R, rn = c.rn, PI = Math.PI, fh = 3.5, fz = d / 2, ruin = v === 2;
  const full = ruin ? Math.max(2, fl - 2) : fl, h = full * fh + 0.5;
  const cols = Math.max(2, Math.floor((w - 1.6) / 2.8)), pitch = (w - 1.6) / cols, mid = Math.floor(cols / 2), shut = c.pk([P.pGreen, P.woodD, P.pBlue]);
  const balcony = (lx, y) => {
    c.b(lx, y - 0.02, fz + 0.5, 2.1, 0.14, 0.95, P.stone); for (const sx of [-1, 1]) { c.b(lx + sx * 0.8, y - 0.3, fz + 0.3, 0.16, 0.28, 0.5, P.stone); c.g('box', P.metD, lx + sx * 1.02, y + 1.0, fz + 0.5, 0.05, 0.05, 0.9); }
    c.g('box', P.metD, lx, y + 1.0, fz + 0.95, 2.05, 0.05, 0.05); for (let j = 0; j < 10; j++) c.g('box', P.metD, lx - 0.95 + j * 0.21, y + 0.12, fz + 0.95, 0.025, 0.9, 0.025);
  };
  c.fr(x, 0, z, r);
  c.s(0, 0, 0, w, h, d, wall); c.b(0, 0, fz + 0.06, w + 0.08, 0.95, 0.14, P.stone);
  for (let f = 1; f <= full; f++) c.b(0, f * fh - 0.14, fz + 0.09, w + 0.16, f === full ? 0.4 : 0.22, f === full ? 0.34 : 0.2, P.stone);
  for (const sx of [-1, 1]) c.b(sx * (w / 2 - 0.3), 0.95, fz + 0.05, 0.6, h - 1.2, 0.1, P.stone);
  c.g('cyl', P.metD, -w / 2 + 0.75, 0, fz + 0.16, 0.11, h - 0.4, 0.11); c.g('box', P.metD, -w / 2 + 0.75, h - 0.4, fz + 0.2, 0.3, 0.2, 0.3);
  for (let f = 0; f < full; f++) for (let k = 0; k < cols; k++) {
    const lx = -w / 2 + 0.8 + (k + 0.5) * pitch, y = f * fh + 1.05, q = rn();
    if (f === 0) {
      if (k === mid) {                                           // portone ad arco
        c.b(lx, 0, fz + 0.04, 1.9, 2.5, 0.1, P.woodD); c.g('half', P.woodD, lx, 2.5, fz + 0.04, 1.9, 1.9, 0.1); c.g('arch', P.stone, lx, 2.5, fz + 0.1, 2.6, 2.6, 0.3);
        for (const sx of [-1, 1]) c.b(lx + sx * 1.13, 0, fz + 0.1, 0.34, 2.5, 0.3, P.stone); c.b(lx, 0, fz + 0.3, 2.9, 0.14, 0.5, P.stone); c.b(lx, 0.2, fz + 0.1, 0.06, 2.8, 0.04, P.metD);
      } else if (v === 1) {                                      // vetrina con tenda e insegna
        c.b(lx, 0.55, fz + 0.03, pitch - 0.7, 2.1, 0.08, P.cdark);
        if (q < 0.5) c.b(lx, 0.6, fz + 0.07, pitch - 0.9, 1.95, 0.04, P.glass); else for (let j = 0; j < 3; j++) c.g('box', P.wood, lx + R(-0.1, 0.1), 0.7 + j * 0.65, fz + 0.09, pitch - 0.8, 0.22, 0.04, 0, 0, R(-0.12, 0.12));
        c.b(lx, 0.4, fz + 0.1, pitch - 0.5, 0.16, 0.24, P.stone); c.b(lx, 2.75, fz + 0.1, pitch - 0.4, 0.42, 0.14, q < 0.3 ? P.cloth : P.woodD);
        if (q > 0.35) c.g('box', q > 0.7 ? P.cloth : P.cream, lx, 2.45, fz + 0.78, pitch - 0.5, 0.05, 1.45, 0.38, 0, 0);
      } else {                                                   // finestra con inferriata
        c.b(lx, 0.95, fz + 0.03, 1.3, 1.75, 0.1, P.stone); c.b(lx, 1.1, fz + 0.06, 1.0, 1.4, 0.1, P.cdark);
        for (let j = 0; j < 4; j++) c.g('box', P.metD, lx - 0.36 + j * 0.24, 1.1, fz + 0.14, 0.03, 1.4, 0.03); c.g('box', P.metD, lx, 1.75, fz + 0.14, 1.0, 0.03, 0.03);
      }
      continue;
    }
    const dead = ruin || q < 0.3;
    c.b(lx, y - 0.14, fz + 0.03, 1.42, 2.06, 0.1, P.stone); c.b(lx, y, fz + 0.06, 1.06, 1.7, 0.1, q > 0.94 && !ruin ? P.win : P.cdark); c.b(lx, y - 0.18, fz + 0.14, 1.6, 0.1, 0.3, P.stone);
    if (f === 1) c.b(lx, y + 1.84, fz + 0.14, 1.7, 0.14, 0.3, P.stone); else if (f === 2 && k % 2) c.g('prism', P.stone, lx, y + 1.84, fz + 0.1, 1.6, 0.4, 0.2);
    if (!dead && q < 0.62) c.b(lx, y + 0.02, fz + 0.115, 1.0, 1.66, 0.02, P.glass);
    else if (q < 0.16) for (let j = 0; j < 3; j++) c.g('box', P.wood, lx, y + 0.2 + j * 0.5, fz + 0.14, 1.3, 0.2, 0.04, 0, 0, R(-0.15, 0.15));
    if ((dead && q < 0.2) || (ruin && rn() < 0.6)) c.b(lx, y + 1.9, fz + 0.012, 1.2, R(0.8, 1.5), 0.03, P.scorch);
    if (q > 0.4) { c.b(lx - 0.8, y, fz + 0.1, 0.5, 1.7, 0.05, shut); if (q < 0.85) c.b(lx + 0.8, y, fz + 0.1, 0.5, 1.7, 0.05, shut); else c.g('box', shut, lx + 0.85, y - 0.3, fz + 0.12, 0.5, 1.7, 0.05, 0, 0, -0.35); }
    if ((f === 1 && k % 2 === mid % 2) || (f === 2 && rn() < 0.2)) balcony(lx, f * fh);
  }
  if (!ruin) {
    if (v === 1 || rn() < 0.75) {                                // tetto a falde con comignoli e abbaino
      const rh = R(2.2, 3.4); c.g('prism', P.roof, 0, h, 0, d + 0.7, rh, w + 0.5, 0, PI / 2, 0);
      for (let i = 0, n = 1 + Math.floor(rn() * 3); i < n; i++) { const cx = R(-w / 2 + 1.5, w / 2 - 1.5), cz = R(-d * 0.3, d * 0.3), ch = rh + R(0.2, 1.2);
        c.b(cx, h + 0.3, cz, 0.8, ch, 0.7, P.brick); c.b(cx, h + 0.3 + ch, cz, 1.0, 0.12, 0.9, P.stone); c.g('cyl', P.roof, cx, h + 0.42 + ch, cz, 0.25, 0.4, 0.25); }
      const ax = R(-w / 4, w / 4); c.b(ax, h + 0.2, fz - 1.3, 1.3, 1.3, 1.6, wall); c.g('prism', P.roof, ax, h + 1.5, fz - 1.3, 1.6, 0.6, 1.8); c.b(ax, h + 0.5, fz - 0.48, 0.8, 0.8, 0.04, P.cdark);
    } else {                                                     // tetto piano con parapetto, cisterna e antenna
      c.b(0, h, fz - 0.2, w, 0.9, 0.3, wall); c.b(0, h + 0.9, fz - 0.2, w + 0.2, 0.12, 0.45, P.stone);
      c.g('cyl12', P.rust, R(-w / 3, w / 3), h, -0.5, 1.6, 2.0, 1.6); c.rod(P.metD, w / 3, h, 0, w / 3 + 0.3, h + R(3, 5), 0.2, 0.03);
    }
  } else {                                                       // sommità sventrata: muri a denti, travi, vani neri
    for (let k = 0; k < cols; k++) { const lx = -w / 2 + 0.8 + (k + 0.5) * pitch, hh = R(0.4, fh * 1.9);
      c.b(lx, h, fz - 0.3, pitch + 0.05, hh, 0.5, wall); if (hh > 2.6) c.b(lx, h + 1.0, fz - 0.3, 1.0, 1.5, 0.54, P.cdark);
      if (rn() < 0.6) c.i('bm', lx, h + R(0.5, 2.5), fz - 2, 1, 1, R(3, 5), R(-0.6, 0.3), R(-0.3, 0.3), 0); }
    c.b(-w / 2 + 0.3, h, 0, 0.5, R(2, 6), d - 0.4, wall); c.b(w / 2 - 0.3, h, 0, 0.5, R(1, 4), d - 0.4, wall); c.b(0, h, -fz + 0.3, w, R(1, 3), 0.5, wall);
  }
  c.fr();
  if (ruin && rn() < 0.7) c.smoke(x, h + 1, z, 18, 1.1, R(1.5, 3), R(-2, -0.5));
}

function map_ruins_skyline(c) {
  const P = c.P, kit = c.kit, mats = [P.ochre, P.brick, P.cream, P.rose, P.sage, P.brickO, P.cream, P.ochre];
  const row = (ws, fls, fixed, r, axisX, vs, off) => { let a = -ws.reduce((p, q) => p + q, 0) / 2;
    for (let i = 0; i < ws.length; i++) { const cc = a + ws[i] / 2; a += ws[i];
      map_ruins_palazzo(c, axisX ? fixed : cc, axisX ? cc : fixed, r, ws[i] - 0.06, 8, fls[i], mats[(i + off) % mats.length], vs[i]); } };
  row([18, 16, 20, 15, 19, 17, 18, 17], [5, 4, 6, 4, 5, 6, 4, 5], -66, 0, false, [0, 1, 2, 1, 0, 1, 2, 0], 0);
  row([17, 19, 15, 20, 16, 18, 17, 18], [4, 6, 5, 4, 6, 4, 5, 5], 66, Math.PI, false, [1, 0, 1, 2, 1, 0, 1, 2], 3);
  row([17, 15, 19, 16, 18, 20, 19], [5, 6, 4, 5, 6, 4, 5], -66, Math.PI / 2, true, [1, 2, 0, 1, 0, 2, 1], 1);
  row([19, 20, 18, 16, 19, 15, 17], [4, 5, 6, 4, 5, 6, 4], 66, -Math.PI / 2, true, [0, 1, 2, 0, 1, 1, 2], 5);
  kit.collider(-74, 0, -74, -62, 60, 74); kit.collider(62, 0, -74, 74, 60, 74); kit.collider(-74, 0, -74, 74, 60, -62); kit.collider(-74, 0, 62, 74, 60, 74);
}

// ---------------------------------------------------------------------------
// Edifici entrabili: kit.building + ornamenti che non dipendono dalle finestre
// ---------------------------------------------------------------------------
function map_ruins_casa(c, o) {
  const kit = c.kit, P = c.P, R = c.R, rn = c.rn, PI = Math.PI, x = o.x, z = o.z, w = o.w, d = o.d, fl = o.fl, fh = o.fh || 3.4, H = fl * fh, dw = o.dw || 1.8, hw = w / 2, hd = d / 2, t = o.theme;
  kit.building({ x: x, z: z, w: w, d: d, floors: fl, floorH: fh, wall: 0.32, mat: o.mat, innerMat: P.cream, floorMat: o.floor,
    doors: [{ side: 'n', at: 0, width: dw }, { side: 's', at: 0, width: dw }, { side: 'e', at: 0, width: dw }, { side: 'w', at: 0, width: dw }],
    windows: true, roof: o.roof || 'parapet', ruined: o.ruin, rotY: 0 });
  let k = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {           // cantonali in pietra, comignoli, pluviali
    const qx = x + sx * (hw + 0.05), qz = z + sz * (hd + 0.05), top = H + 0.4 + (k % 2 ? 1.6 : 0);
    c.b(qx, 0, qz, 0.6, top, 0.6, P.stone); c.b(qx, 0, qz, 0.74, 0.7, 0.74, P.stone);
    if (k % 2) { c.b(qx, top, qz, 0.8, 0.12, 0.8, P.stone); c.g('cyl', P.roof, qx, top + 0.12, qz, 0.26, 0.45, 0.26); } else if (k === 0) c.rod(P.metD, qx, top, qz, qx + 0.2, top + R(2.5, 4), qz, 0.025);
    c.g('cyl', P.metD, qx + sx * 0.36, 0, qz - sz * 0.5, 0.1, H, 0.1); k++;
  }
  for (let f = 1; f <= fl; f++) { const y = f * fh - 0.12, tk = f === fl ? 0.3 : 0.15, hh = f === fl ? 0.36 : 0.2;   // marcapiani e cornicione
    c.b(x, y, z - hd - tk / 2, w + 2 * tk, hh, tk, P.stone); c.b(x, y, z + hd + tk / 2, w + 2 * tk, hh, tk, P.stone); c.b(x - hw - tk / 2, y, z, tk, hh, d, P.stone); c.b(x + hw + tk / 2, y, z, tk, hh, d, P.stone); }
  const sides = [['s', x, z + hd, 0, hw], ['n', x, z - hd, PI, hw], ['e', x + hw, z, PI / 2, hd], ['w', x - hw, z, -PI / 2, hd]];
  for (const s of sides) {
    const L = s[4]; c.fr(s[1], 0, s[2], s[3]);
    for (const sx of [-1, 1]) c.b(sx * (dw / 2 + 0.2), 0, 0.1, 0.3, 2.45, 0.22, P.stone);
    c.b(0, 2.4, 0.12, dw + 1.0, 0.3, 0.28, P.stone); c.b(0, 0, 0.4, dw + 0.9, 0.1, 0.6, P.stone);
    c.b(-L + 1.5, fh + 0.5, 0.26, 0.85, 0.55, 0.42, P.met); c.b(-L + 1.5, fh + 0.6, 0.48, 0.5, 0.35, 0.02, P.metD);
    c.rod(P.metD, L - 1.6, 0.2, 0.1, L - 1.6, H - 0.5, 0.1, 0.04); c.rod(P.metD, L - 1.6, fh * 0.8, 0.1, L - 3.4, fh * 0.8, 0.1, 0.03);
    if (s[0] !== o.front) { if (rn() < 0.6) c.g('box', P.woodD, dw / 2 + 0.9, 0, 0.5, dw * 0.5, 2.2, 0.06, -0.14, R(-0.3, 0.3), 0); c.fr(); continue; }
    c.b(0, 2.78, 0.1, dw + 1.6, 0.55, 0.1, t === 'bank' ? P.stone : P.woodD); c.b(0, 2.9, 0.16, dw + 1.0, 0.3, 0.02, t === 'pharm' ? P.cream : t === 'bar' ? P.cloth : P.pBlue);
    if (t === 'bank' || t === 'office' || t === 'theatre') {       // pronao con colonne
      for (const sx of [-1, 1]) { c.g('cyl12', P.stone, sx * (dw / 2 + 0.9), 0, 1.3, 0.5, fh - 0.3, 0.5); c.b(sx * (dw / 2 + 0.9), 0, 1.3, 0.7, 0.3, 0.7, P.stone); }
      c.b(0, fh - 0.3, 0.9, dw + 2.8, 0.3, 1.5, P.stone);
      if (t !== 'theatre') c.g('prism', P.stone, 0, fh, 0.9, dw + 2.8, 1.0, 1.4); else c.b(0, fh - 0.7, 1.62, dw + 2.6, 0.4, 0.06, P.cloth);
    } else {                                                     // balcone con ringhiera sopra il portone
      const bw = dw + 1.6, n = Math.round(bw / 0.2);
      c.b(0, fh - 0.05, 0.62, bw, 0.14, 1.0, P.stone); for (const sx of [-1, 1]) c.b(sx * (dw / 2 + 0.5), fh - 0.4, 0.4, 0.18, 0.35, 0.6, P.stone);
      c.g('box', P.metD, 0, fh + 1.05, 1.09, bw, 0.05, 0.05); for (let j = 0; j <= n; j++) c.g('box', P.metD, -bw / 2 + j * bw / n, fh + 0.09, 1.09, 0.025, 0.96, 0.025);
    }
    if (t === 'pharm') { c.b(L - 1.2, fh + 0.3, 0.5, 0.16, 1.2, 0.4, P.cross); c.b(L - 1.2, fh + 0.7, 0.5, 0.16, 0.4, 1.2, P.cross); c.rod(P.metD, L - 1.2, fh + 0.9, 0, L - 1.2, fh + 0.9, 0.5, 0.03); }
    if (t === 'bar' || t === 'hotel') { c.g('box', P.cloth, 0, 2.45, 1.2, dw + 2.4, 0.05, 2.0, 0.3, 0, 0); for (const sx of [-1, 1]) c.rod(P.metD, sx * (dw / 2 + 1.1), 0.1, 2.1, sx * (dw / 2 + 1.1), 2.2, 2.1, 0.025); }
    if (t === 'hotel') { c.b(-L + 0.6, fh + 0.4, 0.5, 0.14, 3.2, 0.7, P.pBlue); for (let j = 0; j < 5; j++) c.b(-L + 0.6, fh + 0.6 + j * 0.6, 0.5, 0.16, 0.4, 0.5, j % 2 ? P.win : P.cream); }
    if (t === 'barracks' || t === 'depot' || t === 'store') { c.b(0, 3.0, 0.16, dw + 2.4, 0.5, 0.06, P.pGreen); c.g('box', P.net, 0, 2.5, 1.3, dw + 3, 0.05, 2.4, 0.2, 0, 0); for (const sx of [-1, 1]) c.rod(P.woodD, sx * (dw / 2 + 1.3), 0.1, 2.4, sx * (dw / 2 + 1.3), 2.3, 2.4, 0.04); }
    c.fr();
  }
  map_ruins_arredo(c, o);
}

// ---------------------------------------------------------------------------
// Arredo interno per tema. Regola: i mobili alti lungo i muri NON bloccano (la scala
// del kit può essere ovunque); bloccano solo i ripari messi ai "quarti" della stanza.
// ---------------------------------------------------------------------------
function map_ruins_arredo(c, o) {
  const P = c.P, R = c.R, rn = c.rn, PI = Math.PI, x = o.x, z = o.z, fh = o.fh || 3.4, t = o.theme;
  const a = o.w / 2 - 0.62, b = o.d / 2 - 0.62, qa = o.w / 4, qb = o.d / 4;
  let Y = 0.03;
  const F = (u, v, r) => c.fr(x + u, Y, z + v, r || 0), E = () => c.fr();
  const table = (u, v, w, d, r, n) => { F(u, v, r); c.b(0, 0.72, 0, w, 0.05, d, P.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.g('box', P.woodD, sx * (w / 2 - 0.07), 0, sz * (d / 2 - 0.07), 0.06, 0.72, 0.06);
    for (let i = 0; i < (n || 0); i++) { const an = i / n * 6.283 + 0.4; c.i('chr', Math.sin(an) * (w / 2 + 0.45), rn() < 0.2 ? 0.22 : 0, Math.cos(an) * (d / 2 + 0.45), 1, 1, 1, rn() < 0.2 ? 1.45 : 0, an + PI + R(-0.4, 0.4), 0); } E(); };
  const tipT = (u, v, r) => { F(u, v, r); c.b(0, 0, 0, 1.4, 0.9, 0.07, P.wood); for (const sx of [-0.6, 0.6]) for (const sy of [0.1, 0.78]) c.g('box', P.woodD, sx, sy, 0, 0.06, 0.7, 0.06, PI / 2, 0, 0); c.col(0, 0, 0, 1.4, 0.9, 0.25, 0); E(); };
  const shelf = (u, v, len, r, hh) => { F(u, v, r); hh = hh || 2.0; c.b(0, 0, -0.17, len, hh, 0.04, P.woodD); for (const sx of [-1, 1]) c.b(sx * len / 2, 0, 0, 0.04, hh, 0.38, P.woodD);
    for (let k = 0; k * 0.44 < hh; k++) { c.b(0, k * 0.44 + 0.04, 0, len, 0.035, 0.36, P.wood);
      if (k * 0.44 + 0.4 < hh) for (let s = -len / 2 + 0.16; s < len / 2 - 0.1; s += 0.23) if (rn() < 0.72) c.i(rn() < 0.5 ? 'itm' : 'itm2', s, k * 0.44 + 0.195, R(-0.05, 0.05), 1, R(0.8, 1.15), 1, 0, R(-0.3, 0.3), 0); } E(); };
  const bed = (u, v, r, m) => { F(u, v, r); c.b(0, 0.2, 0, 0.95, 0.12, 2.0, P.woodD); c.b(0, 0, -0.97, 0.95, 0.85, 0.05, P.woodD); c.b(0, 0, 0.97, 0.95, 0.45, 0.05, P.woodD);
    c.b(0, 0.32, 0, 0.88, 0.15, 1.88, P.cream); c.b(0, 0.47, -0.68, 0.6, 0.09, 0.34, P.bag); c.b(0, 0.475, 0.28, 0.9, 0.03, 1.2, m || P.cloth, R(-0.05, 0.05)); E(); };
  const bunk = (u, v, r) => { bed(u, v, r, P.net); F(u, v, r); for (const sx of [-0.47, 0.47]) for (const sz of [-0.97, 0.97]) c.g('box', P.metD, sx, 0, sz, 0.05, 1.7, 0.05);
    c.b(0, 1.2, 0, 0.95, 0.1, 2.0, P.metD); c.b(0, 1.3, 0, 0.88, 0.14, 1.88, P.cream); c.b(0, 1.44, 0.2, 0.9, 0.03, 1.3, P.net); E(); };
  const counter = (u, v, len, r, top, nc) => { F(u, v, r); c.b(0, 0, 0, len, 1.0, 0.6, P.woodD); c.b(0, 1.0, 0, len + 0.12, 0.06, 0.72, top || P.stone); c.b(0, 0.1, 0.31, len - 0.2, 0.75, 0.02, P.wood); if (!nc) c.col(0, 0, 0, len, 1.06, 0.6, 0); E(); };
  const sofa = (u, v, r, m) => { F(u, v, r); c.b(0, 0.12, 0, 1.9, 0.3, 0.8, m); c.b(0, 0.42, -0.32, 1.9, 0.45, 0.16, m); for (const sx of [-1, 1]) c.b(sx * 0.87, 0.42, 0.05, 0.16, 0.22, 0.7, m); E(); };
  const pic = (u, v, r, w, h, m, y) => { F(u, v, r); c.b(0, y || 1.4, 0, w + 0.1, h + 0.1, 0.03, P.woodD); c.b(0, (y || 1.4) + 0.05, 0.012, w, h, 0.03, m); E(); };
  const rug = (u, v, w, d, m, r) => c.f(x + u, Y, z + v, w, 0.018, d, m, r || 0);
  const locker = (u, v, r, n, m) => { F(u, v, r); for (let i = 0; i < n; i++) { const lx = (i + 0.5 - n / 2) * 0.52; c.b(lx, 0, 0, 0.5, 1.8, 0.45, m); c.b(lx, 1.2, 0.23, 0.3, 0.02, 0.02, P.metD); c.b(lx + 0.17, 0.85, 0.23, 0.03, 0.14, 0.03, P.metD); } E(); };
  const drum = (u, v, m) => { c.g('cyl12', m, x + u, Y, z + v, 0.58, 0.88, 0.58); c.g('torus', P.metD, x + u, Y + 0.44, z + v, 0.6, 0.6, 0.8, PI / 2, 0, 0); };
  const crate = (u, v, s, m, r, y) => { c.b(x + u, Y + (y || 0), z + v, s, s * 0.75, s, m || P.wood, r || 0); c.b(x + u, Y + (y || 0) + s * 0.3, z + v, s + 0.03, 0.09, s + 0.03, P.woodD, r || 0); };
  const cover = (u, v, m) => { c.s(x + u, Y, z + v, 1.2, 0.95, 1.2, m || P.wood, 0.05); c.b(x + u, Y + 0.4, z + v, 1.23, 0.1, 1.23, P.woodD, 0.05); c.b(x + u + 0.1, Y + 0.95, z + v, 0.8, 0.6, 0.8, P.woodD, -0.3); };
  const desk = (u, v, r) => { F(u, v, r); c.b(0, 0.72, 0, 1.5, 0.05, 0.75, P.woodD); c.b(-0.5, 0, 0, 0.45, 0.72, 0.7, P.woodD); c.b(0.7, 0, 0, 0.05, 0.72, 0.7, P.woodD); c.b(0.2, 0.77, 0, 0.36, 0.14, 0.3, P.metD);
    c.b(-0.45, 0.775, 0.1, 0.3, 0.012, 0.22, P.cream, 0.3); c.i('chr', 0.1, 0, 0.7, 1, 1, 1, 0, PI + R(-0.5, 0.5), 0); E(); };
  const papers = n => { for (let i = 0; i < n; i++) c.g('cbox', P.cream, x + R(-a, a), Y + 0.012, z + R(-b, b), 0.21, 0.004, 0.3, 0, R(0, 3), 0); };
  const stove = (u, v) => { c.b(x + u, Y, z + v, 0.6, 0.85, 0.6, P.metD); c.rod(P.metD, x + u, Y + 0.85, z + v, x + u, Y + fh - 0.3, z + v, 0.06); };

  // ---- piano terra ----
  if (t === 'hotel') {
    counter(qa, -qb, 2.6, 0); shelf(qa, -b, 2.4, 0, 1.6); sofa(-a + 0.1, qb, PI / 2, P.cloth); sofa(-qa, qb + 2.6, PI, P.cloth); table(-qa, qb + 0.9, 1.0, 0.6, 0.1, 0); rug(-qa, qb + 1, 3.2, 3.6, P.pBlue, 0.05);
    crate(-a + 0.2, -qb, 0.6, P.woodD, 0.3); crate(-a + 0.3, -qb + 0.8, 0.5, P.cloth, -0.2); crate(-a + 0.25, -qb + 0.4, 0.45, P.wood, 0.5, 0.45);
    pic(-qa, -b - 0.05, 0, 1.2, 0.8, P.sage); pic(a + 0.05, qb, -PI / 2, 0.8, 1.1, P.ochre); tipT(qa, qb, 0.3); drum(a - 0.2, b - 0.3, P.pBlue); table(qa + 1.2, qb + 2.6, 0.9, 0.9, 0.2, 3);
  } else if (t === 'flat') {
    counter(-a + 0.05, -qb - 1.2, 2.4, PI / 2, P.stone, true); stove(-a + 0.1, -qb + 0.7); c.b(x - a + 0.1, Y, z - qb - 3, 0.6, 1.6, 0.6, P.cream); table(-qa + 0.6, -qb, 1.4, 0.9, 0.1, 4);
    sofa(a - 0.1, qb, -PI / 2, P.sage); rug(qa, qb, 2.6, 3.4, P.cloth, 0.04); shelf(qa, b, 2.2, PI); crate(qa - 1.6, b - 0.2, 0.55, P.woodD);
    bed(-a + 0.15, qb + 1.4, 0, P.pBlue); locker(-qa, b + 0.1, PI, 2, P.woodD); pic(-a - 0.05, qb - 1.2, PI / 2, 0.7, 0.9, P.rose); tipT(qa, -qb, -0.4); pic(qa, -b - 0.05, 0, 1.4, 0.9, P.pBlue); papers(8);
  } else if (t === 'bar') {
    counter(qa, -qb, 3.2, 0); shelf(qa, -b, 3.2, 0, 2.2); for (let i = 0; i < 3; i++) c.i('chr', x + qa - 1 + i, Y, z - qb + 0.8, 1, 1.5, 1, 0, PI + R(-0.4, 0.4), 0);
    table(-qa, -qb, 0.9, 0.9, 0.2, 3); table(-qa, qb, 0.9, 0.9, -0.1, 4); table(qa + 1, qb + 1, 0.9, 0.9, 0.4, 3); tipT(qa - 0.6, qb - 0.4, 0.8);
    c.b(x - a + 0.05, Y, z + qb + 1.5, 0.65, 1.1, 1.5, P.woodD); c.b(x - a + 0.42, Y + 0.8, z + qb + 1.5, 0.3, 0.05, 1.3, P.cream); rug(0, 0, 2, 6, P.cloth);
    pic(-qa, -b - 0.05, 0, 1.6, 1.0, P.ochre); pic(-a - 0.05, -qb, PI / 2, 0.9, 0.7, P.sage); drum(a - 0.3, b - 0.3, P.woodD); drum(a - 0.9, b - 0.25, P.woodD);
  } else if (t === 'bank') {
    counter(-qa, -qb + 0.3, 3.0, 0, P.stone); counter(qa, -qb + 0.3, 3.0, 0, P.stone); for (const s of [-qa, qa]) { c.b(x + s, Y + 1.06, z - qb + 0.3, 3.0, 0.7, 0.03, P.glass); c.b(x + s, Y + 1.76, z - qb + 0.3, 3.1, 0.05, 0.08, P.rust); }
    c.b(x + a - 0.3, Y, z - b + 0.2, 1.3, 1.9, 1.0, P.metD); c.b(x + a - 1.1, Y + 0.1, z - b + 0.9, 0.08, 1.7, 1.0, P.metD, 0.9); c.g('torus', P.met, x + a - 0.3, Y + 1.0, z - b + 0.72, 0.5, 0.5, 0.6);
    desk(-qa, qb + 0.6, PI); desk(qa, qb + 0.6, PI); locker(-a + 0.02, qb, PI / 2, 3, P.met); rug(0, 2, 2.2, 7, P.cloth); pic(a + 0.05, qb, -PI / 2, 1.2, 0.8, P.sage); papers(14); crate(-a + 0.3, -b + 0.3, 0.6, P.woodD);
  } else if (t === 'pharm') {
    counter(-qa, -qb, 2.8, 0, P.glass); shelf(-qa - 0.3, -b, 2.6, 0, 2.3); shelf(qa + 0.3, -b, 2.6, 0, 2.3); shelf(-a, qb + 0.2, 2.2, PI / 2, 2.3); shelf(a, qb + 0.2, 2.2, -PI / 2, 2.3); shelf(a, -qb - 0.2, 2.2, -PI / 2, 2.3);
    locker(-qa, b + 0.1, PI, 3, P.cream); tipT(qa, qb - 0.5, 0.2); table(qa, -qb + 0.6, 1.2, 0.7, 0, 1); c.b(x + qa, Y + 0.77, z - qb + 0.6, 0.3, 0.25, 0.2, P.met); rug(0, 0, 2, 5, P.sage); papers(6);
  } else if (t === 'theatre') {
    c.s(x, Y, z - b + 1.3, 9, 0.45, 2.8, P.wood); for (const s of [-4.2, 4.2]) c.b(x + s, Y + 0.45, z - b + 2.6, 0.9, fh - 0.9, 0.12, P.cloth); c.b(x, Y + fh - 0.7, z - b + 2.65, 9.4, 0.5, 0.14, P.cloth);
    for (let i = 0; i < 4; i++) for (const s of [-3.1, 3.1]) { const v = 1.0 + i * 1.1; c.b(x + s, Y, z + v, 3.8, 0.42, 0.5, P.cloth, R(-0.03, 0.03)); c.b(x + s, Y + 0.42, z + v + 0.22, 3.8, 0.45, 0.1, P.cloth); c.b(x + s - 1.92 * Math.sign(s), Y, z + v, 0.06, 0.6, 0.5, P.woodD); }
    c.b(x + 2.6, Y + 0.45, z - b + 1.0, 1.5, 1.0, 0.65, P.woodD); c.b(x + 2.6, Y + 1.2, z - b + 1.36, 1.3, 0.04, 0.2, P.cream); c.i('chr', x + 2.6, Y + 0.45, z - b + 2.0, 1, 1, 1, 0, PI, 0);
    tipT(-qa, -0.6, 0.1); pic(-qa, b + 0.05, PI, 1.0, 1.5, P.cloth); pic(qa, b + 0.05, PI, 1.0, 1.5, P.ochre); c.rod(P.metD, x - 2, Y + fh - 0.3, z - b + 2.2, x - 2.6, Y + fh - 1.6, z - b + 2.6, 0.12);
  } else if (t === 'depot') {
    table(-a + 0.2, -qb, 0.8, 3.0, 0, 0); c.b(x - a + 0.2, Y + 0.77, z - qb - 1, 0.3, 0.2, 0.3, P.metD); shelf(-a, qb, 3, PI / 2, 2.4); for (let i = 0; i < 4; i++) drum(a - 0.3 - (i % 2) * 0.65, qb + 1 + Math.floor(i / 2) * 0.7, i % 2 ? P.rust : P.pBlue);
    c.b(x + qa, Y + 0.3, z - qb, 1.6, 0.4, 2.2, P.metD); for (const sx of [-0.85, 0.85]) for (const sz of [-0.6, 0.6]) c.g('hub', P.rust, x + qa + sx, Y + 0.4, z - qb + sz, 0.12, 0.8, 0.8); c.col(x + qa, Y, z - qb, 1.8, 0.9, 2.2, 0);
    cover(-qa, qb); crate(a - 0.3, -b + 0.3, 0.8, P.pGreen); crate(a - 0.3, -b + 1.2, 0.7); c.f(x + 1, Y, z + 2, 2.4, 0.012, 1.8, P.scorch, 0.4); c.f(x - 2, Y, z - 6, 1.6, 0.012, 2.2, P.scorch, 1.1);
    c.rod(P.metD, x, Y + 3.7, z - qb, x, Y + 1.9, z - qb, 0.02); c.g('torus', P.metD, x, Y + 1.75, z - qb, 0.3, 0.3, 0.6); pic(a + 0.05, 1.6, -PI / 2, 1.4, 0.9, P.tram); locker(-qa + 1, b + 0.1, PI, 3, P.pGreen);
  } else if (t === 'store') {
    for (const s of [-1, 1]) for (const v of [-qb - 1.4, qb + 1.4]) { F(s * (a - 0.2), v, 0); for (const sx of [-0.45, 0.45]) for (const sz of [-1.4, 1.4]) c.g('box', P.pBlue, sx, 0, sz, 0.07, 2.7, 0.07);
      for (const yy of [0.1, 1.3, 2.5]) { c.b(0, yy, 0, 1.0, 0.07, 2.9, P.met); for (const sz of [-0.9, 0, 0.9]) if (rn() < 0.75) c.b(R(-0.05, 0.05), yy + 0.07, sz, 0.75, R(0.5, 0.8), 0.75, rn() < 0.5 ? P.wood : P.pGreen, R(-0.2, 0.2)); } E(); }
    cover(-qa, qb - 1, P.pGreen); cover(qa, -qb + 1); drum(0.9, b - 0.4, P.rust); drum(1.6, b - 0.3, P.rust); c.bags(x - qa, Y, z - b + 0.5, 2.2, 0, 3, 0, true); papers(5);
  } else if (t === 'barracks') {
    for (const v of [-5.6, -2.7, 2.7, 5.6]) bunk(-a + 0.15, v, 0); locker(a + 0.02, -3.6, -PI / 2, 5, P.pGreen); locker(a + 0.02, 3.6, -PI / 2, 4, P.pGreen);
    table(qa - 0.6, qb, 1.8, 1.1, 0.05, 3); c.b(x + qa - 0.6, Y + 0.775, z + qb, 1.3, 0.012, 0.9, P.cream, 0.2); cover(qa - 0.4, -qb, P.pGreen); crate(-0.9, b - 0.3, 0.7, P.pGreen); crate(0.9, -b + 0.3, 0.7, P.pGreen, 0.2);
    stove(-1.4, -b + 0.2); F(1.5, b + 0.1, PI); c.b(0, 0.9, 0, 1.6, 0.9, 0.05, P.wood); for (let i = 0; i < 4; i++) c.rod(P.metD, -0.6 + i * 0.4, 0.1, 0.2, -0.6 + i * 0.4, 1.4, 0.06, 0.02); E(); pic(-1, -b - 0.05, 0, 1.5, 1.0, P.sage);
  } else {
    desk(-qa, -qb, 0); desk(qa, -qb, 0.1); desk(-qa, qb, PI); desk(qa + 0.4, qb + 1, PI - 0.2); locker(-qa, -b - 0.1, 0, 4, P.met); locker(qa, -b - 0.1, 0, 3, P.met); shelf(-a, qb + 0.5, 2.6, PI / 2, 2.2);
    tipT(qa - 0.4, qb - 1.2, 0.5); rug(0, 0, 2.2, 6, P.pBlue); pic(a + 0.05, -qb, -PI / 2, 1.6, 1.1, P.sage); pic(a + 0.05, qb, -PI / 2, 0.8, 1.0, P.cloth); papers(22); c.b(x - a + 0.2, Y, z - b + 0.2, 0.8, 1.1, 0.7, P.metD);
  }
  // ---- piani alti: un "angolo superstite" per piano (solaio sporgente con ferri + arredo) ----
  const kind = t === 'hotel' || t === 'flat' || t === 'barracks' ? 0 : t === 'office' || t === 'bank' || t === 'pharm' ? 1 : 2;
  for (let f = 1; f < o.fl; f++) {
    const cs = [[-1, -1], [1, 1], [1, -1], [-1, 1]][(f + o.w) % 4], u = cs[0] * (o.w / 2 - 2.15), v = cs[1] * (o.d / 2 - 1.95);
    c.b(x + u, f * fh - 0.2, z + v, 3.6, 0.23, 3.2, P.walk);
    for (let i = 0; i < 6; i++) c.i('rb', x + u - cs[0] * 1.8, f * fh - 0.1, z + v + R(-1.4, 1.4), 1, R(0.5, 1.1), 1, R(-0.4, 0.4), 0, cs[0] * R(1.1, 1.6));
    Y = f * fh + 0.035;
    if (kind === 0) { bed(u - cs[0] * 0.2, v, 0, f % 2 ? P.pBlue : P.cloth); rug(u - cs[0] * 1.2, v, 1.0, 1.8, P.sage); crate(u + cs[0] * 0.9, v - 1.1, 0.5, P.woodD); pic(u, v + cs[1] * 1.72, cs[1] > 0 ? PI : 0, 0.7, 0.9, P.ochre); }
    else if (kind === 1) { desk(u, v, cs[1] > 0 ? PI : 0); locker(u - cs[0] * 0.2, v + cs[1] * 1.25, cs[1] > 0 ? PI : 0, 2, P.met); papers(5); }
    else { crate(u, v, 0.9); crate(u + 0.2, v + 1.0, 0.7, P.pGreen, 0.3); crate(u, v, 0.6, P.woodD, 0.4, 0.68); drum(u - cs[0] * 1.2, v - cs[1] * 0.8, P.rust); c.bags(x + u - cs[0] * 1.3, Y, z + v + cs[1] * 0.6, 1.8, PI / 2, 3, 0, true); }
  }
}

// ---------------------------------------------------------------------------
// Chiesa (navata entrabile) + campanile semicrollato: il PUNTO EROE della mappa
// ---------------------------------------------------------------------------
function map_ruins_chiesa(c) {
  const kit = c.kit, P = c.P, R = c.R, PI = Math.PI, K = c.K, cx = -28;
  c.f(cx, K, -20, 10.6, 0.02, 26.6, P.cob); c.f(cx, K + 0.02, -20, 2.2, 0.012, 26.6, P.stone);
  const side = (xc, out, breach, solid) => {
    for (let i = 0; i < 5; i++) { const z0 = -34 + i * 5.6, zc = z0 + 2.8;
      if (i !== solid) { c.s(xc + out * 0.75, 0, z0 + 0.05, 0.9, 6.6, 0.9, P.stone); c.g('box', P.stone, xc + out * 0.75, 6.6, z0 + 0.05, 0.9, 0.9, 0.9, 0, 0, out * 0.5); }
      if (i === breach) { c.s(xc, 0, z0 + 0.45, 0.7, R(4.5, 6.5), 0.9, P.brickO); c.s(xc, 0, z0 + 5.15, 0.7, R(3, 5), 0.9, P.brickO); c.rubble(xc + out * 0.8, K, zc, 2.3, 0.5, false); c.scat('blk', 6, xc, K, zc, 2.6, 0.2, 0.8, 1.3); kit.nav(xc, K, zc); continue; }
      c.s(xc, 0, zc, 0.7, 3.2, 5.6, P.brickO); c.b(xc, 3.1, zc, 0.86, 0.14, 5.6, P.stone); c.b(xc, 9, zc, 0.9, 0.3, 5.6, P.stone);
      if (i === solid) { c.s(xc, 3.2, zc, 0.7, 5.8, 5.6, P.brickO); continue; }
      c.s(xc, 3.2, z0 + 0.85, 0.7, 4.2, 1.7, P.brickO); c.s(xc, 3.2, z0 + 4.75, 0.7, 4.2, 1.7, P.brickO); c.s(xc, 7.4, zc, 0.7, 1.6, 5.6, P.brickO);
      c.g('arch', P.stone, xc, 6.3, zc, 2.2, 2.2, 0.8, 0, PI / 2, 0); for (const dz of [-0.55, 0, 0.55]) c.rod(P.metD, xc, 3.2, zc + dz, xc, 6.9, zc + dz, 0.02); }
  };
  side(-33.65, -1, 3, -1); side(-22.35, 1, 1, 4);
  // facciata sud con portale ad arco, rosone e timpano spezzato
  c.s(-31.7, 0, -6.35, 4.6, 9, 0.7, P.stone); c.s(-24.3, 0, -6.35, 4.6, 9, 0.7, P.stone); c.s(cx, 4.9, -6.35, 2.8, 4.1, 0.7, P.stone);
  c.g('arch', P.stone, cx, 3.6, -6.2, 3.6, 3.6, 1.0); for (const sx of [-1, 1]) { c.b(cx + sx * 1.6, 0, -5.9, 0.5, 3.6, 0.5, P.stone); c.b(cx + sx * 4.2, 1.2, -5.96, 1.1, 2.2, 0.1, P.cdark); c.g('half', P.cdark, cx + sx * 4.2, 3.4, -5.96, 1.1, 1.1, 0.1); c.g('cyl', P.stone, cx + sx * 4.2, 1.2, -5.8, 0.4, 1.3, 0.4); c.g('sph', P.stone, cx + sx * 4.2, 2.7, -5.8, 0.36, 0.4, 0.36); }
  c.b(cx, 9, -6.35, 12.4, 0.3, 0.9, P.stone); c.b(cx, 9.3, -6.35, 12, 1.2, 0.7, P.stone); c.b(cx - 0.6, 10.5, -6.35, 8, 1.2, 0.7, P.stone); c.b(cx - 1.5, 11.7, -6.35, 4.2, 1.1, 0.7, P.stone);
  c.g('cyl12', P.cdark, cx, 7, -6.02, 2.7, 0.06, 2.7, PI / 2, 0, 0); c.g('torus', P.stone, cx, 7, -5.95, 3.0, 3.0, 2.0); for (let k = 0; k < 4; k++) c.g('cbox', P.stone, cx, 7, -5.93, 0.1, 2.8, 0.12, 0, 0, k * PI / 4);
  c.s(cx, K, -5.0, 5.4, 0.12, 1.8, P.stone); c.b(cx - 2.0, K, -7.2, 1.35, 3.4, 0.1, P.woodD, 1.2); c.b(cx + 1.2, K + 0.02, -8.6, 1.35, 0.1, 3.4, P.woodD, 0.3);
  // parete nord con porticina, nicchia e croce
  c.s(-29.9, 0, -33.65, 8.2, 9, 0.7, P.brickO); c.s(-23.1, 0, -33.65, 2.2, 9, 0.7, P.brickO); c.s(-25, 2.4, -33.65, 1.6, 6.6, 0.7, P.brickO);
  c.g('arch', P.stone, cx - 1.5, 2.4, -33.2, 5.6, 5.6, 0.3); c.b(cx - 1.5, 3.4, -33.25, 0.22, 2.8, 0.1, P.woodD); c.b(cx - 1.5, 5.1, -33.25, 1.5, 0.22, 0.1, P.woodD);
  // altare, banchi, confessionale, lampadario caduto
  c.s(cx - 1.5, K, -30.6, 7, 0.3, 4.4, P.stone); c.s(cx - 1.5, K + 0.3, -31.3, 2.6, 1.0, 1.0, P.stone); c.b(cx - 1.5, K + 1.3, -31.3, 2.8, 0.04, 1.2, P.cloth);
  for (const sx of [-1, 1]) { c.g('cyl', P.cream, cx - 1.5 + sx * 1.0, K + 1.34, -31.3, 0.07, 0.5, 0.07); c.g('sph', P.fire, cx - 1.5 + sx * 1.0, K + 1.9, -31.3, 0.09, 0.14, 0.09); }
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const zp = -10.5 - i * 2.4; if ((sx < 0 && zp < -12 && zp > -17) || (sx > 0 && zp < -23)) continue;
    const rr = R(-0.06, 0.06); c.b(cx + sx * 3.3, K, zp, 3.4, 0.45, 0.5, P.woodD, rr); c.s(cx + sx * 3.3, K, zp + 0.25, 3.4, 0.95, 0.08, P.woodD, rr); }
  c.s(-23.3, K, -19.5, 1.0, 2.4, 2.0, P.woodD); c.b(-23.85, K + 0.3, -19.5, 0.04, 1.8, 0.7, P.cloth);
  c.g('torus', P.metD, cx + 0.5, K + 0.15, -17, 1.8, 1.8, 1.2, PI / 2, 0, 0.1); c.rod(P.metD, cx + 0.5, K + 0.2, -17, cx + 2.5, K + 0.1, -15.5, 0.02);
  c.rubble(cx - 0.5, K, -14.6, 2.4, 1.0, true); c.rubble(cx + 3, K, -27.5, 1.6, 0.6, false);
  // capriate: due integre con un lembo di tetto a nord, le altre spezzate
  for (const zt of [-33, -28.4, -22.8]) { c.g('cbox', P.char, cx, 9.25, zt, 12, 0.3, 0.3); c.rod(P.char, -34, 9.2, zt, cx, 12.7, zt, 0.14); c.rod(P.char, -22, 9.2, zt, cx, 12.7, zt, 0.14); c.rod(P.char, cx, 9.3, zt, cx, 12.7, zt, 0.1); }
  c.g('cbox', P.roof, cx - 3, 11, -28, 6.95, 0.16, 10.6, 0, 0, 0.528); c.g('cbox', P.roof, cx + 3.4, 10.75, -30.5, 6.1, 0.16, 5.4, 0, 0, -0.528);
  c.rod(P.char, -34, 9.2, -17.2, cx - 1, 12.1, -17.2, 0.14); c.rod(P.char, -22.4, 9, -11.6, cx - 2, K + 0.8, -12.5, 0.14); c.rod(P.char, cx + 3, K + 1.2, -19, cx - 3, K + 0.3, -21, 0.13);
  kit.light(cx - 1.5, 3.4, -28.5, 0xffb060, 3.2, 18);
  for (const p of [[cx, -9], [cx, -20], [cx, -27], [-25, -32]]) kit.nav(p[0], K, p[1]);

  // ---- campanile: 6x6 m, alto 30 m, crollato verso la piazza (sud-est) ----
  const tx = -19, tz = -9;
  const tw = (face, a0, a1, y0, y1) => { const m = (a0 + a1) / 2, len = a1 - a0;
    if (face < 2) c.s(m, y0, face ? tz - 2.6 : tz + 2.6, len, y1 - y0, 0.8, P.brickO); else c.s(face === 2 ? tx + 2.6 : tx - 2.6, y0, m, 0.8, y1 - y0, len, P.brickO); };
  c.s(tx - 2.3, 0, tz - 2.3, 1.4, 30, 1.4, P.stone); c.s(tx + 2.3, 0, tz - 2.3, 1.4, 24, 1.4, P.stone); c.s(tx - 2.3, 0, tz + 2.3, 1.4, 25, 1.4, P.stone); c.s(tx + 2.3, 0, tz + 2.3, 1.4, 17, 1.4, P.stone);
  tw(0, -20.6, -19.7, 0, 2.5); tw(0, -18.3, -17.4, 0, 2.5); tw(0, -20.6, -17.4, 2.5, 6.2); tw(0, -20.6, -19.8, 6.2, 7.5); tw(0, -18.2, -17.4, 6.2, 7.5); tw(0, -20.6, -19, 7.5, 20); tw(0, -19, -17.4, 7.5, 14.5);
  tw(1, -20.6, -19.7, 0, 2.5); tw(1, -18.3, -17.4, 0, 2.5); tw(1, -20.6, -17.4, 2.5, 22); tw(1, -20.6, -19, 22, 27.5); tw(1, -19, -17.4, 22, 24);
  tw(2, -10.6, -7.4, 0, 6.2); tw(2, -10.6, -9.8, 6.2, 7.5); tw(2, -8.2, -7.4, 6.2, 7.5); tw(2, -10.6, -9, 7.5, 21); tw(2, -9, -7.4, 7.5, 15.5);
  tw(3, -10.6, -7.4, 0, 24); tw(3, -10.6, -9, 24, 27);
  c.b(tx, 8.5, tz + 3.05, 6.3, 0.35, 0.25, P.stone); c.b(tx, 8.5, tz - 3.05, 6.3, 0.35, 0.25, P.stone); c.b(tx + 3.05, 8.5, tz, 0.25, 0.35, 6.3, P.stone);
  c.b(tx, 15.5, tz - 3.05, 6.3, 0.35, 0.25, P.stone); c.b(tx - 1.6, 15.5, tz + 3.05, 3.1, 0.35, 0.25, P.stone); c.b(tx + 3.05, 15.5, tz - 1.6, 0.25, 0.35, 3.1, P.stone); c.b(tx - 1.2, 21.6, tz - 3.05, 3.9, 0.4, 0.3, P.stone);
  c.g('cyl12', P.cream, tx + 3.02, 11.5, tz - 0.4, 2.0, 0.08, 2.0, 0, 0, -PI / 2); c.g('torus', P.stone, tx + 3.08, 11.5, tz - 0.4, 2.2, 2.2, 2.0, 0, PI / 2, 0); c.g('cbox', P.metD, tx + 3.13, 11.75, tz - 0.4, 0.04, 0.7, 0.07, 0.6, 0, 0); c.g('cbox', P.metD, tx + 3.13, 11.4, tz - 0.6, 0.04, 0.5, 0.07, -1.2, 0, 0);
  c.g('cyl12', P.cream, tx - 0.7, 11.5, tz + 3.02, 2.0, 0.08, 2.0, PI / 2, 0, 0); c.g('torus', P.stone, tx - 0.7, 11.5, tz + 3.08, 2.2, 2.2, 2.0);
  c.g('arch', P.stone, tx - 0.8, 24.6, tz - 2.6, 1.8, 1.8, 0.9); c.g('arch', P.stone, tx - 2.6, 24.4, tz - 1.0, 1.8, 1.8, 0.9, 0, PI / 2, 0);
  c.rod(P.woodD, tx - 2.3, 23, tz - 1.4, tx + 2.3, 23, tz - 1.4, 0.12); c.rod(P.metD, tx - 0.9, 23, tz - 1.4, tx - 0.9, 22.4, tz - 1.4, 0.03); c.g('bell', P.rust, tx - 0.9, 20.8, tz - 1.4, 1.7, 1.7, 1.7);
  c.g('pyr', P.roof, tx - 2.0, 30, tz - 2.0, 3.6, 4.5, 3.6, 0.2, 0, 0.16); c.g('rock', P.ember, tx + 0.8, 14.6, tz + 0.6, 1.6, 0.6, 1.4); c.smoke(tx + 0.5, 15.5, tz + 0.5, 24, 1.2, 3.5, -2);
  // scala interna a due rampe e piano di tiro a 5 m sopra la piazza
  c.steps(tx - 1.65, K, tz + 1.8, 1.1, 2.5, 3.0, 0, P.wood, false); c.s(tx - 1.65, K + 2.3, tz - 1.7, 1.1, 0.2, 1.0, P.wood);
  c.steps(tx - 1.1, K + 2.5, tz - 1.65, 1.1, 2.5, 3.3, 1, P.wood, false); c.s(tx + 0.55, K + 4.8, tz + 0.55, 3.3, 0.2, 3.3, P.wood);
  c.rod(P.metD, tx - 1.1, K + 5, tz - 1.1, tx - 1.1, K + 6, tz - 1.1, 0.03); c.rod(P.metD, tx - 1.1, K + 6, tz - 1.1, tx - 1.1, K + 6, tz + 2.2, 0.03); c.bags(tx + 1.7, K + 5, tz + 0.6, 1.6, PI / 2, 2, 0, true);
  kit.nav(tx, K, tz + 1.2); kit.nav(tx + 0.6, K + 5, tz + 0.6);
  // campana caduta e macerie ai piedi
  c.g('bell', P.rust, -11.6, K + 0.8, -5.2, 1.9, 1.9, 1.9, 0, 0.4, 1.35); kit.collider(-12.6, K, -6, -10.4, K + 1.5, -4.4); for (let i = 0; i < 5; i++) c.crack(-11.6, K, -5.2, 1.2, i * 1.25, R(2, 3.5));
  c.rubble(tx + 4.8, K, tz + 4.0, 2.6, 1.3, true); c.rubble(tx + 5.5, K, tz - 1.5, 1.8, 0.8, false); c.scat('blk', 14, tx + 5, K, tz + 2, 5, 0.2, 0.8, 1.5);
}

// ---------------------------------------------------------------------------
// ZONA CENTRO — Piazza del Duomo: fontana distrutta, colonna, caffè all'aperto
// ---------------------------------------------------------------------------
function map_ruins_piazza(c) {
  const kit = c.kit, P = c.P, R = c.R, PI = Math.PI, K = c.K;
  c.f(0, K, 17.2, 38.4, 0.012, 0.6, P.stone); c.f(0, K, -17.2, 38.4, 0.012, 0.6, P.stone); c.f(19.2, K, 0, 0.6, 0.012, 35, P.stone); c.f(-19.2, K, 0, 0.6, 0.012, 35, P.stone);
  for (let k = 0; k < 8; k++) { const a = k * PI / 4 + 0.39; c.g('cbox', P.stone, Math.cos(a) * 11.5, K + 0.008, Math.sin(a) * 11.5, 11.5, 0.016, 0.5, 0, -a, 0); }
  // fontana
  kit.cyl(0, K, 0, 5.3, 5.5, 0.2, P.stone, { collide: true, seg: 20 });
  c.g('cyl12', P.cdark, 0, K + 0.2, 0, 8.6, 0.03, 8.6); c.g('cyl12', P.glass, 0.6, K + 0.23, -0.4, 5.2, 0.012, 4.4);
  for (let i = 0; i < 12; i++) { if (i === 2 || i === 7 || i === 8) continue; const a = i / 12 * 6.283, hh = i % 3 === 1 ? 0.55 : 0.85, px = Math.cos(a) * 4.5, pz = Math.sin(a) * 4.5;
    c.b(px, K + 0.2, pz, 0.55, hh, 2.45, P.stone, -a); c.b(px, K + 0.2 + hh, pz, 0.7, 0.1, 2.5, P.stone, -a); c.col(px, K + 0.2, pz, 0.55, hh + 0.1, 2.45, -a); }
  c.g(c.lathe([[1.1, 0], [1.1, 0.3], [0.75, 0.45], [0.5, 0.95], [0.55, 1.5], [0.85, 1.75], [0.9, 1.9], [0.3, 2.0]]), P.stone, 0, K + 0.2, 0, 1, 1, 1);
  c.g(c.lathe([[0.25, 0], [1.2, 0.15], [1.9, 0.5], [2.05, 0.75], [1.95, 0.78], [1.2, 0.4], [0.1, 0.3]]), P.stone, 1.9, K + 1.0, 1.6, 1, 1, 1, 0.9, 0.3, 0.5);
  kit.collider(-1.1, K, -1.1, 1.1, K + 2.2, 1.1); c.rod(P.rust, 0, K + 2.1, 0, 0.3, K + 3.2, 0.2, 0.04);
  c.g('cyl', P.stone, -2.6, K + 0.5, 1.2, 0.55, 1.7, 0.55, 1.45, 0.6, 0); c.g('sph', P.stone, -3.9, K + 0.55, 2.1, 0.5, 0.55, 0.5); c.g('cyl', P.stone, -2.2, K + 0.45, 2.2, 0.2, 0.9, 0.2, 1.3, -0.8, 0);   // statua abbattuta
  c.rubble(-3.2, K, -4.6, 1.7, 0.7, false); c.rubble(4.9, K, 3.4, 1.4, 0.6, false);
  // colonna votiva spezzata (verticale che si legge da lontano)
  c.s(12, K, 10, 1.8, 1.4, 1.8, P.stone); c.b(12, K + 1.4, 10, 2.1, 0.2, 2.1, P.stone); c.g('cyl12', P.stone, 12, K + 1.6, 10, 0.9, 6.6, 0.9, 0.03, 0, 0.03); c.g('cyl12', P.stone, 12.2, K + 8.1, 10.2, 1.3, 0.35, 1.3);
  c.g('cyl12', P.stone, 14.6, K + 0.45, 12.4, 0.9, 3.2, 0.9, PI / 2, 0.8, 0); c.col(15.6, K, 13.6, 0.9, 0.9, 3.2, 0.8);
  // caffè all'aperto davanti al bar
  for (const p of [[-15.5, 19.4], [-12, 19.6], [-8.6, 19.3]]) { c.g('cyl12', P.metD, p[0], K, p[1], 0.08, 0.72, 0.08); c.g('cyl12', P.stone, p[0], K + 0.72, p[1], 0.8, 0.04, 0.8);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + p[0]; c.i('chr', p[0] + Math.sin(a) * 0.8, K + (i === 1 ? 0.22 : 0), p[1] + Math.cos(a) * 0.8, 1, 1, 1, i === 1 ? 1.45 : 0, a + PI, 0); } }
  c.rod(P.woodD, -12, K, 18.6, -11.6, K + 2.5, 18.9, 0.03); c.g('pyr', P.cloth, -11.6, K + 2.2, 18.9, 2.6, 0.6, 2.6, 0.15, 0.3, 0);
  // alberi in fioriere, panchine, lampioni
  for (const p of [[-14, 13], [14, -13], [-14, -13.5], [15, 14]]) { c.b(p[0], K, p[1], 1.8, 0.5, 1.8, P.stone); c.b(p[0], K + 0.5, p[1], 1.5, 0.05, 1.5, P.dirt); c.tree(p[0], K + 0.5, p[1], 0.9); kit.collider(p[0] - 0.9, K, p[1] - 0.9, p[0] + 0.9, K + 0.5, p[1] + 0.9); }
  c.bench(-8, K, 15.6, PI); c.bench(8, K, -15.6, 0); c.bench(17.6, K, 5, -PI / 2); c.bench(-17.2, K, 6, PI / 2);
  c.lamp(-18.4, K, 16.4, 0.8, 2); c.lamp(18.4, K, -16.4, -2.4, 0); c.lamp(18.4, K, 16.4, -0.8, 3); c.lamp(-9, K, -16.6, 0.3, 0);
  c.lamp(4.2, K, 19.4, -1.6, 1); kit.light(3.3, K + 4.6, 19.4, 0xbcd4ff, 3.5, 20);          // unico lampione ancora acceso: luce fredda
  // ripari e crateri
  c.crater(9, K, -8.5, 3.0, true); c.crater(-9.5, K, 9.5, 2.4, false);
  c.bags(-7.5, K, 5.5, 3.8, 0.5, 4, 1); c.bags(7.5, K, 6.5, 3.8, -0.4, 4, 1); c.bags(-6.5, K, -9.5, 3.8, -0.5, 4, -1); c.bags(0, K, -13.5, 4.4, 0, 4, -1); c.bags(0, K, 13.5, 4.4, 0, 4, 1); c.bags(14.5, K, 1, 3.4, PI / 2, 4, 0);
  c.barrelFire(5.2, K, -3.6, true); c.stack(-15, K, 2, 0.3, 0); c.stack(15.5, K, -5, -0.4, 1); c.hedgehog(3, K, 9); c.hedgehog(-3.5, K, -7.5); c.hedgehog(11, K, 4);
  c.car(-13, -14.5, 1.2, P.pBlue, true, K); c.barricade(16.8, K, 9.5, 5, PI / 2);
  for (const p of [[0, 8], [0, -8], [8, 0], [-8, 0], [-15, -4], [15, 14], [-15, 15]]) kit.nav(p[0], K, p[1]);
}

// ---------------------------------------------------------------------------
// Strade, marciapiedi con cordolo, segnaletica consumata, tombini, crepe
// ---------------------------------------------------------------------------
function map_ruins_strade(c) {
  const kit = c.kit, P = c.P, R = c.R, rn = c.rn;
  kit.ground(P.gnd);
  const pv = [
    [-20, -18, 20, 18, P.cob], [-35.5, -6, -20, 4, P.cob], [20, -11, 34.5, 11, P.cob], [-35.5, -35.5, -20, -6, P.walk], [-35.5, 4, -20, 35.5, P.walk],
    [-20, 18, -4.5, 35.5, P.walk, [-18.5, 21, -5.5, 34]], [4.5, 18, 20, 35.5, P.walk, [5.5, 21, 18.5, 34]], [-20, -35.5, -4.5, -18, P.walk, [-18, -34, -6, -21]], [4.5, -35.5, 20, -18, P.walk, [5.5, -34, 18.5, -21]],
    [20, 11, 34.5, 35.5, P.walk, [21.5, 11, 33.5, 31]], [20, -35.5, 34.5, -11, P.walk, [21.5, -31, 33.5, -11]],
    [-62, 13, -44.5, 35.5, P.walk, [-59, 15, -46, 33]], [-62, -13, -44.5, 13, P.dirt], [-62, -35.5, -44.5, -13, P.walk, [-59, -33, -46, -15]],
    [45.5, 14, 62, 35.5, P.walk, [47.5, 14, 59.5, 30]], [45.5, -14, 62, 14, P.dirt], [45.5, -35.5, 62, -14, P.walk, [47.5, -30, 59.5, -14]],
    [-62, 44.5, 62, 62, P.walk], [-62, -62, 62, -44.5, P.walk]
  ];
  for (const e of pv) c.pave(e[0], e[1], e[2], e[3], e[4], e[5]);
  // mezzerie e strisce pedonali (consumate: ne manca qualcuna)
  for (let t = -58; t <= 58; t += 8) { if (Math.abs(Math.abs(t) - 40) > 6 && rn() < 0.85) c.d(-40, t, 0.16, 2.6, R(-0.02, 0.02), P.line); if (rn() < 0.85) c.d(t, 40, 2.6, 0.16, 0, P.line); if (rn() < 0.85) c.d(t, -40, 2.6, 0.16, 0, P.line); }
  for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) { if (rn() < 0.9) c.d(-40 + i * 1.6, s * 33.8, 0.6, 2.6, 0, P.line); if (rn() < 0.9) c.d(37.2 + i * 1.3, s * 33.8, 0.55, 2.6, 0, P.line); if (rn() < 0.9) c.d(i * 1.5, s * 34, 0.55, 2.4, 0, P.line); }
  // binari del tram sul Corso (interrotti dove il tram è deragliato)
  c.d(42, 0, 2.3, 124, 0, P.cob);
  for (const rx of [41.28, 42.72]) { c.f(rx, 0, -33.5, 0.1, 0.035, 57, P.met); c.f(rx, 0, 36, 0.1, 0.035, 52, P.met); }
  c.rod(P.met, 41.28, 0.03, -5, 40.2, 0.5, 1.5, 0.05); c.rod(P.met, 42.72, 0.03, 10, 43.6, 0.35, 5.5, 0.05);
  // toppe, sporco, pozzanghere, tombini, caditoie, crepe
  const road = () => { const k = Math.floor(rn() * 5), t = R(-58, 58); return k === 0 ? [-40 + R(-3.5, 3.5), t] : k === 1 ? [38 + R(-3, 2.5), t] : k === 2 ? [t, 40 + R(-3.5, 3.5)] : k === 3 ? [t, -40 + R(-3.5, 3.5)] : [R(-3.5, 3.5), (rn() < 0.5 ? -1 : 1) * R(19, 35)]; };
  for (let i = 0; i < 16; i++) { const p = road(); c.d(p[0], p[1], R(1.5, 4), R(1.5, 4), R(0, 3), P.patch); }
  for (let i = 0; i < 10; i++) { const p = road(); c.d(p[0], p[1], R(1.5, 3.5), R(1.2, 3), R(0, 3), P.dirt); }
  for (let i = 0; i < 7; i++) { const p = road(); c.d(p[0], p[1], R(1.2, 2.6), R(0.8, 1.8), R(0, 3), P.glass); }
  for (let i = 0; i < 12; i++) { const p = road(); c.g('cyl12', P.metD, p[0], 0, p[1], 0.8, 0.028, 0.8); c.g('torus', P.cdark, p[0], 0.02, p[1], 0.95, 0.95, 0.3, Math.PI / 2, 0, 0); }
  for (let t = -54; t <= 54; t += 12) { c.g('cbox', P.metD, -35.9, 0.02, t, 0.4, 0.03, 0.7); c.g('cbox', P.metD, 34.9, 0.02, t + 5, 0.4, 0.03, 0.7); c.g('cbox', P.metD, t, 0.02, 35.9, 0.7, 0.03, 0.4); c.g('cbox', P.metD, t + 5, 0.02, -35.9, 0.7, 0.03, 0.4); }
  for (let i = 0; i < 30; i++) { const p = road(); c.crack(p[0], 0, p[1], 0, R(0, 6.28), R(2, 5)); }
  for (let i = 0; i < 40; i++) { const p = road(); c.scat(i % 3 ? 'rk' : 'brk', 4, p[0], 0, p[1], 1.5, 0.02, 0.2, 0.5); if (i % 4 === 0) c.scat('plk', 2, p[0], 0, p[1], 1.5, 0.02, 0.7, 1.2); }
}

// ---------------------------------------------------------------------------
// ZONA OVEST — Mercato coperto in ferro (mezzo crollato) + Giardino pubblico bruciato
// ---------------------------------------------------------------------------
function map_ruins_ovest(c) {
  const kit = c.kit, P = c.P, R = c.R, rn = c.rn, PI = Math.PI, K = c.K, T6 = K + 6.6, T4 = K + 4.6;
  c.f(-28, K, 20, 11.6, 0.015, 24.4, P.cob);
  for (let i = 0; i < 5; i++) { const zc = 9 + i * 5.5, gone = i >= 3;
    for (const xc of [-33.5, -22.5]) { c.g('cyl12', P.pGreen, xc, K, zc, 0.5, 0.4, 0.5); kit.collider(xc - 0.2, K, zc - 0.2, xc + 0.2, K + 3, zc + 0.2);
      if (gone) { c.rod(P.pGreen, xc, K + 0.4, zc, xc + R(-1.6, 1.6), K + R(2, 3.6), zc + R(-1.2, 1.2), 0.12, 'cyl12'); continue; }
      c.g('cyl12', P.pGreen, xc, K + 0.4, zc, 0.24, 4.2, 0.24); c.rod(P.pGreen, xc, K + 3.7, zc, xc + (xc < -28 ? 1.1 : -1.1), T4, zc, 0.04); c.g('cyl12', P.pGreen, xc, T4 - 0.15, zc, 0.44, 0.15, 0.44); }
    if (gone) { c.rod(P.pGreen, -33, K + 0.3, zc + 0.6, -24, K + 1.6, zc - 0.8, 0.06); c.rod(P.pGreen, -31, K + 0.2, zc - 1, -27.5, K + 2.2, zc + 1.2, 0.05);
      for (let k = 0; k < 4; k++) c.g('cbox', P.rust, -28 + R(-4, 4), K + R(0.3, 1.2), zc + R(-2, 2), 2.9, 0.05, R(2.5, 4.5), R(-0.5, 0.5), R(0, 3), R(-0.6, 0.6)); continue; }
    c.rod(P.pGreen, -33.5, T4, zc, -22.5, T4, zc, 0.05); c.rod(P.pGreen, -33.5, T4, zc, -28, T6, zc, 0.06); c.rod(P.pGreen, -22.5, T4, zc, -28, T6, zc, 0.06); c.rod(P.pGreen, -28, T4, zc, -28, T6, zc, 0.04);
    for (const s of [-1, 1]) { c.rod(P.pGreen, -28 + s * 2.75, T4, zc, -28, T6, zc, 0.03); c.rod(P.pGreen, -28 + s * 2.75, T4, zc, -28 + s * 2.75, T4 + 1, zc, 0.03); }
    if (i < 2) for (const s of [-1, 1]) for (let j = 0; j < 2; j++) { const q = 1.375 + j * 2.75; c.rod(P.pGreen, -28 + s * q, T6 - q * 0.364, zc, -28 + s * q, T6 - q * 0.364, zc + 5.5, 0.03);
      if (rn() < 0.72) c.g('cbox', j === 0 && rn() < 0.4 ? P.glass : P.rust, -28 + s * q, T6 - q * 0.364 + 0.06, zc + 2.75, 2.9, 0.05, 5.4, 0, 0, -s * 0.349); }
  }
  c.rubble(-28, K, 28.5, 3.2, 1.2, true); c.rubble(-32, K, 31, 1.8, 0.7, false);
  const stall = (sx, sz, r, m, wreck) => { c.fr(sx, K, sz, r);              // banco del mercato con tenda a strisce
    c.b(0, 0, 0, 2.6, 0.85, 1.1, P.wood); c.b(0, 0.85, 0, 2.8, 0.05, 1.3, P.woodD); c.col(0, 0, 0, 2.6, 0.9, 1.1, 0);
    for (const px of [-1.3, 1.3]) for (const pz of [-0.6, 0.6]) c.rod(P.woodD, px, 0, pz, px + (wreck ? R(-0.5, 0.5) : 0), wreck ? 1.5 : 2.3, pz, 0.03);
    if (!wreck) for (let j = 0; j < 5; j++) c.g('box', j % 2 ? m : P.cream, -1.12 + j * 0.56, 2.2, 0.3, 0.56, 0.04, 2.1, 0.2, 0, 0); else c.g('box', m, 0.4, 0.9, 0.9, 2.6, 0.04, 1.8, 0.9, 0.3, 0);
    for (let j = 0; j < 3; j++) { c.b(-0.85 + j * 0.85, 0.9, R(-0.1, 0.1), 0.7, 0.22, 0.6, P.woodD, R(-0.2, 0.2)); for (let k = 0; k < 6; k++) c.i(j % 2 ? 'itm' : 'itm2', -0.85 + j * 0.85 + R(-0.25, 0.25), 1.16, R(-0.2, 0.2), 0.7, 0.5, 0.8, 0, R(0, 3), 0); }
    c.g('cyl12', P.wood, 1.7, 0, 0.6, 0.5, 0.45, 0.5); c.g('cyl12', P.wood, -1.8, 0, -0.4, 0.45, 0.4, 0.45); c.fr(); };
  stall(-31.2, 11, PI / 2, P.cloth); stall(-31.2, 16.5, PI / 2, P.pBlue); stall(-31.2, 22, PI / 2, P.cloth, true); stall(-24.8, 11.5, -PI / 2, P.sage); stall(-24.8, 17, -PI / 2, P.cloth, true); stall(-24.8, 22.5, -PI / 2, P.ochre);
  c.fr(-28, K, 5.6, 0.3); c.b(0, 0.55, 0, 1.0, 0.3, 1.8, P.wood); c.g('tire', P.woodD, -0.6, 0.5, 0.2, 0.5, 1.15, 1.15); c.g('tire', P.woodD, 0.6, 0.5, 0.2, 0.5, 1.15, 1.15); c.rod(P.woodD, -0.4, 0.7, -0.9, -0.5, 0.3, -2.2, 0.03); c.rod(P.woodD, 0.4, 0.7, -0.9, 0.5, 0.3, -2.2, 0.03); c.col(0, 0, 0, 1.2, 0.9, 1.8, 0); c.fr();
  c.b(-28, T4 + 0.3, 7.9, 5, 0.7, 0.1, P.pGreen); c.b(-28, T4 + 0.45, 7.84, 4.2, 0.4, 0.03, P.cream); c.rod(P.pGreen, -30.4, T4, 8, -30.4, T4 + 0.4, 7.9, 0.03); c.rod(P.pGreen, -25.6, T4, 8, -25.6, T4 + 0.4, 7.9, 0.03);
  c.bags(-28, K, 33.6, 4, 0, 4, 1); c.stack(-22, K, 33, 0.5, 0); c.stack(-34, K, 6, 1.2, 2); c.lamp(-21, K, 5.2, 2, 0);
  for (const zz of [12, 20, 28]) kit.nav(-28, K, zz);
  // sagrato della chiesa
  c.bags(-30.5, K, -1, 3.6, 0.1, 4, 1); c.hedgehog(-24, K, 1.5); c.stack(-33.5, K, -3.5, 0.2, 1); c.barricade(-23.5, K, -2.6, 4.5, 0.25); c.tree(-33.5, K, 1.8, 0.85); c.lamp(-21.2, K, -4.6, 1.2, 2); kit.nav(-28, K, -1);
  // giardino pubblico
  c.f(-53, K, 0, 16.5, 0.015, 2.2, P.cob); c.f(-53, K, 0, 2.2, 0.015, 25.4, P.cob); c.g('cyl12', P.cob, -53, K, 0, 6.4, 0.018, 6.4);
  c.s(-53, K, 0, 1.6, 1.6, 1.6, P.stone); c.b(-53, K + 1.6, 0, 1.9, 0.18, 1.9, P.stone); c.g('cyl', P.stone, -53, K + 1.78, 0, 0.5, 0.5, 0.5);
  c.g('cyl', P.stone, -51.2, K + 0.35, 1.6, 0.6, 1.9, 0.6, PI / 2, 0.5, 0); c.g('sph', P.stone, -50.5, K + 0.35, 3.0, 0.5, 0.55, 0.5); c.g('cyl', P.stone, -51.8, K + 0.25, 2.6, 0.22, 1.0, 0.22, 1.4, -0.6, 0);
  for (const p of [[-58, -9, 1.1], [-58, 9, 1], [-48, -9, 0.9], [-48, 9, 1.1], [-57, -3.5, 0.8], [-49, 4.2, 1], [-56.5, 5, 1.2], [-50, -5, 0.9], [-60, 0.5, 1]]) c.tree(p[0], K, p[1], p[2]);
  c.bench(-53, K, 3.6, PI); c.bench(-53, K, -3.6, 0); c.bench(-56.6, K, 0, PI / 2); c.bench(-49.4, K, -1.5, -PI / 2 + 0.4);
  c.s(-47.4, K, -10.6, 2.2, 2.4, 2.2, P.pGreen); c.g('pyr', P.metD, -47.4, K + 2.4, -10.6, 3.0, 0.9, 3.0); c.b(-46.28, K + 1.0, -10.6, 0.04, 1.0, 1.5, P.cdark); c.g('box', P.cloth, -45.9, K + 2.0, -10.6, 0.9, 0.04, 1.8, 0, 0, -0.3);
  for (let k = 0; k < 8; k++) c.i(k % 2 ? 'itm' : 'itm2', -46.2, K + 1.12, -11.2 + k * 0.17, 0.3, 0.9, 0.8, 0, 0, 0.2);
  c.fence(-44.7, -13, -44.7, -1.8, K); c.fence(-44.7, 1.8, -44.7, 5.8, K); c.fence(-44.7, 9.4, -44.7, 13, K); c.rubble(-44.9, K, 7.6, 1.4, 0.4, false);
  c.crater(-51, K, 7.5, 2.4, false); c.bags(-46.6, K, 3.6, 3.2, PI / 2, 4, 0); c.bags(-55, K, -7.5, 3.6, 0.2, 4, -1); c.stack(-59.5, K, 10.5, 0.4, 1); c.lamp(-45.6, K, 0, -1.57, 0); c.lamp(-60.4, K, -11.5, 1, 2);
  for (const p of [[-53, 6], [-53, -6], [-47, 0], [-59, 0], [-60.5, 24], [-60.5, -24]]) kit.nav(p[0], K, p[1]);
}

// ---------------------------------------------------------------------------
// ZONA EST — Corso del Tram: tram rovesciato che brucia, rimorchio deragliato,
// linea aerea, fermata, Largo del Tram, posto di blocco militare
// ---------------------------------------------------------------------------
function map_ruins_est(c) {
  const kit = c.kit, P = c.P, R = c.R, PI = Math.PI, K = c.K;
  // tram coricato sul fianco (lungo 11 m, si vedono tetto, carrelli e finestrini)
  c.stain(39.5, 0, 3, 6, 14, 0.5, P.scorch); c.fr(39.5, 0, 3, 0.5);
  c.b(0.75, 0.02, 0, 1.15, 2.3, 10.6, P.tram); c.b(-0.45, 0.04, 0, 1.3, 2.26, 10.6, P.cream); c.b(0.12, 0.03, 0, 0.14, 2.32, 10.7, P.cloth); c.b(-1.2, 0.1, 0, 0.3, 2.1, 10.3, P.met);
  c.g('cyl12', P.met, -1.3, 1.15, -5.15, 0.5, 10.3, 2.1, PI / 2, 0, 0); c.b(1.42, 0.25, 0, 0.2, 1.8, 9.6, P.metD);
  for (const bz of [-3.2, 3.2]) { c.b(1.75, 0.45, bz, 0.5, 1.4, 2.2, P.metD); for (const dz of [-0.7, 0.7]) for (const dy of [0.5, 1.8]) c.g('cyl12', P.rust, 1.7, dy, bz + dz, 0.75, 0.5, 0.75, 0, 0, -PI / 2); }
  for (let i = 0; i < 7; i++) c.b(-0.45, 2.3, -4.2 + i * 1.4, 0.85, 0.03, 1.0, i % 3 === 1 ? P.cdark : P.glass);
  c.b(0.75, 2.3, -3.9, 0.9, 0.03, 1.2, P.cdark); c.b(0.75, 2.3, 3.9, 0.9, 0.03, 1.2, P.cdark);
  for (const ez of [-5.5, 5.5]) { const sg = Math.sign(ez); c.b(-0.1, 0.15, ez, 2.2, 2.0, 0.5, P.tram); c.b(-0.5, 0.5, ez + sg * 0.26, 1.0, 1.3, 0.04, P.glass); c.b(0.9, 0.9, ez + sg * 0.27, 0.3, 0.3, 0.05, ez < 0 ? P.win : P.cdark); c.b(1.3, 0.2, ez + sg * 0.35, 0.3, 1.9, 0.2, P.metD); }
  c.rod(P.metD, -1.5, 1.2, -1, -3.2, 0.3, -1.8, 0.03); c.rod(P.metD, -1.5, 1.2, 0.2, -3.0, 0.2, 0.9, 0.03); c.rod(P.metD, -3.2, 0.3, -1.8, -3.0, 0.2, 0.9, 0.03); c.rod(P.metD, -1.4, 1.6, 2.5, -4.6, 0.15, 4.2, 0.025);
  c.g('rock', P.ember, 1.6, 0.3, -3.2, 1.2, 0.5, 1.6); for (let i = 0; i < 5; i++) c.g('spk', P.fire, 1.6 + R(-0.4, 0.4), 0.4, -3.2 + R(-0.6, 0.6), R(0.2, 0.4), R(0.5, 1.1), R(0.2, 0.4), R(-0.2, 0.2), 0, R(-0.2, 0.2));
  c.col(0.1, 0, 0, 2.9, 2.3, 11.4, 0); const tf = c.wp(1.9, -3.2), tr = c.wp(-2.6, 3.4); c.fr();
  c.smoke(tf[0], 1.4, tf[1], 16, 0.8, 2.4, -1.6); kit.light(tf[0], 2.2, tf[1], 0xff6a20, 5, 24); c.rubble(tr[0], 0, tr[1], 2.0, 0.9, true);
  // rimorchio rimasto in piedi (stessa livrea: così il tram si riconosce subito)
  c.fr(42.1, 0, -10, 0.07);
  c.b(0, 0.45, 0, 2.2, 0.25, 9.6, P.metD); c.b(0, 0.7, 0, 2.3, 1.15, 9.8, P.tram); c.b(0, 1.85, 0, 2.24, 1.0, 9.8, P.cream); c.b(0, 1.82, 0, 2.34, 0.08, 9.84, P.cloth);
  c.b(0, 2.85, 0, 2.3, 0.14, 9.9, P.met); c.g('cyl12', P.met, 0, 2.95, -4.95, 2.2, 9.9, 0.5, PI / 2, 0, 0);
  for (let i = 0; i < 7; i++) for (const sx of [-1, 1]) c.b(sx * 1.125, 1.95, -4.2 + i * 1.4, 0.03, 0.75, 1.05, (i * 3 + (sx > 0 ? 1 : 0)) % 4 === 0 ? P.cdark : P.glass);
  for (const bz of [-3, 3]) { c.b(0, 0.12, bz, 1.7, 0.4, 2.0, P.metD); for (const dz of [-0.65, 0.65]) for (const sx of [-1, 1]) c.g('hub', P.rust, sx * 0.72, 0.36, bz + dz, 0.12, 0.72, 0.72); }
  for (const ez of [-4.95, 4.95]) { c.b(0, 1.9, ez, 1.7, 0.8, 0.04, P.glass); c.b(0, 0.5, ez + Math.sign(ez) * 0.1, 2.0, 0.2, 0.25, P.metD); }
  c.b(1.16, 0.75, 3.8, 0.04, 1.9, 1.0, P.cdark); c.b(-1.16, 0.75, -3.8, 0.04, 1.9, 1.0, P.cdark); c.rod(P.metD, 0, 3.2, 0, 0.3, 4.6, -2.4, 0.03); c.col(0, 0, 0, 2.3, 3.2, 9.9, 0); c.fr();
  // pali e linea aerea (spezzata sopra il tram: un capo penzola)
  const pz = [-56, -42, -28, -14, 0, 14, 28, 42, 56];
  for (let i = 0; i < pz.length; i++) { const lean = i === 4 ? 1.2 : 0.05, tx = 45.1 - lean;
    c.g('cyl12', P.metD, 45.1, c.K, pz[i], 0.4, 0.5, 0.4); c.rod(P.metD, 45.1, K, pz[i], tx, 7, pz[i], 0.09); c.rod(P.metD, tx, 6.4, pz[i], tx - 3.2, 6.1, pz[i], 0.04); c.rod(P.metD, tx, 6.9, pz[i], tx - 2.6, 6.15, pz[i], 0.02);
    c.g('cyl', P.cream, tx - 3.1, 5.85, pz[i], 0.12, 0.25, 0.12); kit.collider(44.9, 0, pz[i] - 0.2, 45.3, 5, pz[i] + 0.2);
    if (i > 0 && i !== 4 && i !== 5) c.cable(42, 5.85, pz[i - 1], 42, 5.85, pz[i], 0.35); }
  c.cable(42, 5.85, -14, 41, 1.2, -4, 0.2); c.cable(42, 5.85, 14, 43.4, 0.3, 8.5, 0.4);
  c.cable(33.4, 7.5, 16, 45, 6.9, 14, 0.7); c.cable(33.4, 8.2, -18, 45, 6.9, -14, 0.7); c.cable(47.5, 8, 20, 45, 6.9, 28, 0.5); c.cable(-46, 8.5, 26, -35.4, 6.5, 24, 0.8); c.cable(-46, 9, -22, -34.6, 7.5, -20, 0.8); c.cable(-5.5, 6.2, 30, 5.5, 6.6, 29, 0.6); c.cable(-6, 7, -29, 5.5, 7.2, -30, 0.6);
  // Largo del Tram: pensilina, colonna delle affissioni, facciata sventrata
  c.fr(31.5, K, 5.5, -PI / 2); for (const px of [-1.8, 1.8]) { c.rod(P.pGreen, px, 0, -0.6, px, 2.5, -0.6, 0.04); c.rod(P.pGreen, px, 2.5, -0.6, px, 2.3, 0.9, 0.03); }
  c.g('box', P.glass, 0, 2.42, 0.1, 4.2, 0.04, 1.7, 0.12, 0, 0); c.b(0, 0.4, -0.66, 3.6, 1.6, 0.04, P.glass); c.b(0, 0.42, -0.3, 3.2, 0.06, 0.4, P.wood); c.b(-1.3, 0, -0.3, 0.06, 0.42, 0.4, P.metD); c.b(1.3, 0, -0.3, 0.06, 0.42, 0.4, P.metD);
  c.rod(P.pGreen, 2.7, 0, 0.6, 2.7, 2.9, 0.6, 0.035); c.g('cyl12', P.cloth, 2.7, 2.6, 0.56, 0.6, 0.05, 0.6, PI / 2, 0, 0); c.col(0, 0, -0.5, 3.8, 1.9, 0.5, 0); c.fr();
  c.g('cyl12', P.pGreen, 25.5, K, -6.5, 1.2, 2.7, 1.2); c.g('pyr', P.pGreen, 25.5, K + 2.7, -6.5, 1.5, 0.7, 1.5); c.g('sph', P.pGreen, 25.5, K + 3.5, -6.5, 0.25, 0.25, 0.25); kit.collider(24.9, K, -7.1, 26.1, K + 2.7, -5.9);
  for (let k = 0; k < 4; k++) c.g('cbox', k % 2 ? P.cream : P.cloth, 25.5 + Math.sin(k * 1.6) * 0.61, K + 1.5, -6.5 + Math.cos(k * 1.6) * 0.61, 0.6, 0.9, 0.02, 0, k * 1.6, 0);
  c.shell(22.5, K, 0, 9.6, PI / 2, 3, P.rose); c.barrelFire(31.6, K, -6.4, true); c.bench(28, K, 8.6, PI); c.stack(29.5, K, -9, 0.3, 0); c.hedgehog(33, K, 0.5); c.bags(27.5, K, 2.5, 3.6, 0.2, 4, -1); c.lamp(33.6, K, 9.6, -1.2, 2); c.tree(24, K, 8.5, 0.9);
  for (const p of [[27, 0], [31, -3], [27, 7]]) kit.nav(p[0], K, p[1]);
  // posto di blocco militare nel cortile est
  c.truck(51, -6.5, 0.12, false, K); c.container(57.5, K, 5.5, PI / 2, P.cont); c.container(52, K, 10.6, PI / 2 + 0.05, P.pBlue);
  for (const p of [[48, 0.5], [52.5, 0.5], [48, 4.5], [52.5, 4.5]]) c.rod(P.woodD, p[0], K, p[1], p[0], K + 2.6, p[1], 0.05); c.g('cbox', P.net, 50.25, K + 2.65, 2.5, 5.4, 0.06, 4.8, 0.05, 0, 0.04);
  c.stack(50.2, K, 2.4, 0.2, 1); c.stack(57, K, -2, 1.1, 1); c.bags(46.6, K, 4.2, 3.4, PI / 2, 4, 0); c.bags(46.6, K, -4.2, 3.4, PI / 2, 4, 0); c.hedgehog(47.5, K, 0);
  c.b(45.9, K, -1.9, 0.3, 1.1, 0.3, P.metD); for (let k = 0; k < 6; k++) c.g('cbox', k % 2 ? P.cream : P.cloth, 45.9, K + 1.5 + k * 0.33, -1.6 + k * 0.42, 0.1, 0.1, 0.6, -0.65, 0, 0);
  const mx = 58.5, mz = -10.5;                                    // traliccio radio: verticale sullo skyline
  for (const a of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) c.rod(P.metD, mx + a[0], K, mz + a[1], mx + a[0] * 0.25, K + 15, mz + a[1] * 0.25, 0.035);
  for (let k = 0; k < 7; k++) { const y0 = K + k * 2.1, s0 = 0.5 - k * 0.053, s1 = 0.5 - (k + 1) * 0.053; c.rod(P.metD, mx - s0, y0, mz - s0, mx + s1, y0 + 2.1, mz - s1, 0.02, 'cyl5'); c.rod(P.metD, mx + s0, y0, mz + s0, mx - s1, y0 + 2.1, mz + s1, 0.02, 'cyl5'); c.rod(P.metD, mx + s0, y0, mz - s0, mx + s1, y0 + 2.1, mz + s1, 0.02, 'cyl5'); c.rod(P.metD, mx - s0, y0, mz + s0, mx - s1, y0 + 2.1, mz - s1, 0.02, 'cyl5'); }
  c.rod(P.metD, mx, K + 15, mz, mx, K + 18, mz, 0.02); c.g('sph', P.red, mx, K + 18, mz, 0.22, 0.22, 0.22); kit.collider(mx - 0.5, K, mz - 0.5, mx + 0.5, K + 6, mz + 0.5);
  for (const p of [[50, -1], [55, 0], [50, 7], [60.6, 22], [60.6, -22]]) kit.nav(p[0], K, p[1]);
}

// ---------------------------------------------------------------------------
// Basi di partenza: portici ad archi (spawn al coperto) + ripari davanti. s=+1 blu (sud), s=-1 rossi (nord)
// ---------------------------------------------------------------------------
function map_ruins_base(c, s) {
  const kit = c.kit, P = c.P, PI = Math.PI, K = c.K, team = s > 0 ? 'blue' : 'red', rf = s > 0 ? 0 : PI;
  for (let px = -42; px <= 42; px += 6) { c.s(px, K, s * 57.4, 0.8, 2.0, 0.8, P.stone); c.b(px, K, s * 57.4, 1.0, 0.3, 1.0, P.stone); c.b(px, K + 1.9, s * 57.4, 1.0, 0.16, 1.0, P.stone);
    if (px < 42) { c.g('arch', P.stone, px + 3, K + 2.0, s * 57.4, 6, 6, 0.8); c.rod(P.metD, px + 3, K + 4.3, s * 57.4, px + 3, K + 3.5, s * 57.4, 0.015); c.g('pyr', (px + 42) % 24 === 0 ? P.win : P.glass, px + 3, K + 3.5, s * 57.4, 0.3, 0.35, 0.3, PI, 0, 0); } }
  c.b(0, K + 5.0, s * 57.4, 85, 0.9, 0.8, P.cream); c.b(0, K + 5.9, s * 57.4, 85.4, 0.2, 1.1, P.stone); c.s(0, K + 5.0, s * 59.9, 85, 0.3, 4.4, P.cdark); c.g('prism', P.roof, 0, K + 6.1, s * 59.9, 4.8, 1.2, 85, 0, PI / 2, 0);
  c.b(0, K + 3.6, s * 57.0, 4.4, 0.6, 0.1, P.woodD); c.b(0, K + 3.7, s * 56.94, 3.6, 0.36, 0.04, s > 0 ? P.blue : P.red);
  const sp = [-39, -33, -21, -15, -9, 9, 15, 21, 33, 39];
  for (const px of sp) { kit.spawn(team, px, s * 59.6); kit.nav(px, K, s * 59.6); kit.nav(px, K, s * 54); }
  for (const px of [-27, 3, 27]) { c.b(px, K, s * 61.2, 1.6, 0.45, 0.5, P.wood); c.b(px + 2.4, K, s * 61, 0.9, 0.7, 0.7, P.pGreen, 0.2); }
  // ripari tra il portico e la via
  c.shell(-13, K, s * 49.5, 12.8, rf, 3, s > 0 ? P.ochre : P.brick); c.shell(15, K, s * 50, 9.6, rf, 2, s > 0 ? P.sage : P.rose);
  c.container(-30, K, s * 51, PI / 2 + s * 0.06, P.cont); c.container(30.5, K, s * 51.5, PI / 2 - s * 0.05, P.pBlue); c.truck(2, s * 52.5, PI / 2 + s * 0.1, false, K); c.truck(-44, s * 50, s * 0.15, true, K);
  c.bags(-21.5, K, s * 47, 3.6, 0.1 * s, 4, -s); c.bags(7, K, s * 47, 3.6, -0.1 * s, 4, -s); c.bags(24, K, s * 47.2, 3.4, 0.05, 4, -s); c.bags(-38, K, s * 47.2, 3.4, 0, 4, -s); c.bags(44, K, s * 49, 3.6, PI / 2, 4, 0);
  c.stack(37.5, K, s * 55, 0.4, 1); c.stack(-36, K, s * 55.2, -0.3, 1); c.stack(12, K, s * 55, 1.2, 0); c.barrelFire(-6, K, s * 54.6, false); c.barrelFire(47, K, s * 55, false);
  c.jersey(52, K, s * 48, 3, PI / 2); c.jersey(56, K, s * 51, 3, 0.3); c.jersey(-53, K, s * 48, 3, PI / 2); c.jersey(-57, K, s * 52, 3, -0.3); c.hedgehog(-50, K, s * 53); c.hedgehog(50.5, K, s * 54.5);
  c.tree(-55, K, s * 57, 1); c.tree(55.5, K, s * 57.5, 0.9); c.lamp(-47, K, s * 45.4, s > 0 ? PI : 0, 0); c.lamp(20, K, s * 45.4, s > 0 ? PI : 0, 2); c.rubble(58, K, s * 58, 2.6, 1.3, true); c.rubble(-58.5, K, s * 46.5, 2.2, 1.0, true);
  for (const px of [-52, -24, 0, 24, 52]) kit.nav(px, K, s * 46);
}

// ---------------------------------------------------------------------------
// Ripari lungo le tre corsie e le due vie trasversali (uno ogni 6-10 m)
// ---------------------------------------------------------------------------
function map_ruins_coperture(c) {
  const kit = c.kit, P = c.P, PI = Math.PI, K = c.K;
  // Via dei Giardini (ovest)
  c.car(-42, -30, 0.2, P.pBlue, true); c.bags(-38.5, 0, -22, 3.6, 0.1, 4, 1); c.hedgehog(-42.5, 0, -19); c.rubble(-36.6, 0, -14.4, 2.2, 1.0, true); c.truck(-41.5, -7, -0.25, true);
  c.crater(-40, 0, 1, 3.2, false); c.jersey(-37, 0, 4.5, 3, 0.2); c.bags(-42, 0, 9, 3.6, -0.1, 4, -1); c.barrelFire(-37.2, 0, 6.6, true); c.car(-38, 16, 2.9, P.pGreen, false);
  c.barricade(-41, 0, 23, 5.5, 0.1); c.stack(-43, 0, 30, 0.3, 0); c.car(-38.5, 31.5, -0.3, P.pBlue, true); c.hedgehog(-37, 0, 26); c.jersey(-43.5, 0, 15, 3, 0.05); c.lamp(-35.9, 0, -26, -1.57, 2); c.lamp(-44.2, 0, 28, 1.57, 0);
  // Corso del Tram (est)
  c.car(37, -30, -0.2, P.pGreen, true); c.bags(43.5, 0, -27, 3.4, 0.1, 4, 1); c.crater(38, 0, -20.5, 3.0, true); c.hedgehog(36, 0, -15); c.jersey(36.5, 0, -5, 3, 0.3); c.stack(44, 0, 12.5, -0.2, 1);
  c.hedgehog(37, 0, 12); c.truck(37.6, 21, 0.15, false); c.bags(42, 0, 28, 3.6, 0, 4, -1); c.car(38, 32, 0.5, P.pBlue, true); c.bags(36.5, 0, 9.5, 3.2, -0.3, 4, -1); c.lamp(34.9, 0, -24, 1.57, 0); c.lamp(34.9, 0, 30, 1.57, 3);
  // Via Maggiore (centro), a nord e a sud della piazza
  c.tank(-0.5, -25.5, 0.3); c.barricade(1.5, 0, -32, 5, -0.1); c.hedgehog(-3, 0, -19.5); c.jersey(3.4, 0, -20.5, 3, 0.1);
  c.bags(0, 0, 30.5, 4.2, 0, 4, -1); c.car(2.4, 24, 0.3, P.pGreen, false); c.jersey(-3.2, 0, 20.5, 3, -0.1); c.stack(-3.2, 0, 26.5, 0.5, 0); c.hedgehog(3.2, 0, 33.6);
  // Via Nord e Via Sud
  for (const s of [-1, 1]) {
    c.stack(-52, 0, s * 38, 0.3 * s, 1); c.car(-28, s * 41.5, 1.5 + s * 0.2, P.pBlue, s > 0); c.bags(-18, 0, s * 38.5, 3.6, PI / 2 + 0.1, 4, 0); c.jersey(-10, 0, s * 42, 3, PI / 2); c.truck(11, s * 38.6, PI / 2 - s * 0.1, true);
    c.bags(21, 0, s * 42, 3.6, PI / 2, 4, 0); c.crater(28, 0, s * 39.5, 2.6, s < 0); c.stack(52, 0, s * 41.5, -0.4, 0); c.hedgehog(-34, 0, s * 42.5); c.hedgehog(46.5, 0, s * 37.5); c.car(54.5, s * 38, 1.2, P.pGreen, true); c.rubble(-58, 0, s * 40, 2.4, 1.1, true);
    c.lamp(-20, 0, s * 35.9, s > 0 ? PI : 0, s > 0 ? 0 : 2); c.lamp(20, 0, s * 44.1, s > 0 ? 0 : PI, 0);
  }
  // vicolo della chiesa e retri
  c.stack(-20, K, -24, 0.2, 0); c.rubble(-20.2, K, -31, 1.4, 0.5, false); c.bags(-20, K, -15.5, 2.4, 0, 4, 0); kit.nav(-20, K, -20); kit.nav(-20, K, -30);
  c.rubble(60.5, K, 33, 1.6, 0.8, false); c.rubble(-60.5, K, -34, 1.6, 0.8, false); c.stack(-60.3, K, 34, 0.2, 2); c.stack(60.6, K, -33, 0.2, 2);
  // colonne di fumo lontane e punti di navigazione sugli incroci
  c.smoke(-52, 14, -24, 20, 1.3, 3, -2); c.smoke(27.5, 14, -21, 20, 1.3, 2.6, -2.4); c.smoke(12, 10, -27, 16, 1.0, 2, -1.5);
  for (const p of [[-40, -40], [-40, -20], [-40, 0], [-40, 20], [-40, 40], [40, -40], [38, -20], [36, 0], [38, 20], [40, 40], [0, -40], [0, 40], [0, -26], [0, 26], [-20, 40], [20, 40], [-20, -40], [20, -40], [-28, 0]]) kit.nav(p[0], 0, p[1]);
}

MAPS.push({
  id: 'ruins',
  name: 'Città in Rovina',
  size: 140,
  env: {
    sky: 'overcast', sunElev: 34, sunAzim: 215, sunColor: 0xffe2bf, sunIntensity: 3.8,
    hemiSky: 0xb9bcc0, hemiGround: 0x6e6355, hemiIntensity: 1.9,
    fogColor: 0xa39a8f, fogDensity: 0.0052, exposure: 0.9, bloomThreshold: 1.6, bloomStrength: 0.55,
    rain: false, snow: false, dust: true
  },
  build(kit) {
    const c = map_ruins_ctx(kit), P = c.P;
    map_ruins_props(c);
    map_ruins_strade(c);                       // terreno, marciapiedi, segnaletica
    map_ruins_skyline(c);                      // palazzi di bordo + muri invisibili
    // dieci edifici entrabili, ognuno arredato secondo il suo tema
    map_ruins_casa(c, { x: -52.5, z: 24, w: 13, d: 18, fl: 3, mat: P.ochre, floor: P.wood, ruin: 0.45, theme: 'hotel', front: 'e' });
    map_ruins_casa(c, { x: -52.5, z: -24, w: 13, d: 18, fl: 4, mat: P.brick, floor: P.woodD, ruin: 0.7, theme: 'flat', front: 'e' });
    map_ruins_casa(c, { x: -12, z: 27.5, w: 13, d: 13, fl: 2, mat: P.rose, floor: P.wood, ruin: 0.4, theme: 'bar', front: 'n' });
    map_ruins_casa(c, { x: 12, z: 27.5, w: 13, d: 13, fl: 3, mat: P.cream, floor: P.cob, ruin: 0.5, theme: 'bank', front: 'n', dw: 2.0 });
    map_ruins_casa(c, { x: -12, z: -27.5, w: 12, d: 13, fl: 3, mat: P.sage, floor: P.cob, ruin: 0.55, theme: 'pharm', front: 's' });
    map_ruins_casa(c, { x: 12, z: -27.5, w: 13, d: 13, fl: 3, mat: P.ochre, floor: P.woodD, ruin: 0.6, theme: 'theatre', front: 's', dw: 2.0 });
    map_ruins_casa(c, { x: 27.5, z: 21, w: 12, d: 20, fl: 2, fh: 4, mat: P.brickO, floor: P.walk, ruin: 0.45, theme: 'depot', front: 'e', dw: 2.0, roof: 'flat' });
    map_ruins_casa(c, { x: 27.5, z: -21, w: 12, d: 20, fl: 4, mat: P.brick, floor: P.cdark, ruin: 0.75, theme: 'store', front: 'e', roof: 'flat' });
    map_ruins_casa(c, { x: 53.5, z: 22, w: 12, d: 16, fl: 3, mat: P.sage, floor: P.wood, ruin: 0.4, theme: 'barracks', front: 'w' });
    map_ruins_casa(c, { x: 53.5, z: -22, w: 12, d: 16, fl: 3, mat: P.cream, floor: P.woodD, ruin: 0.6, theme: 'office', front: 'w' });
    map_ruins_chiesa(c);                       // punto eroe: chiesa + campanile
    map_ruins_piazza(c);                       // zona centro
    map_ruins_ovest(c);                        // zona ovest: mercato + giardino
    map_ruins_est(c);                          // zona est: tram + posto di blocco
    map_ruins_base(c, 1);                      // base blu (sud, z+)
    map_ruins_base(c, -1);                     // base rossa (nord, z-)
    map_ruins_coperture(c);                    // ripari sulle corsie
    c.flush();                                 // fonde le mesh per materiale ed emette le istanze
  }
});

