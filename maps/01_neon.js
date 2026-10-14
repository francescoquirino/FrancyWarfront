// maps/01_neon.js — NEON DISTRICT (v3): quartiere cyberpunk di notte sotto la pioggia leggera.
// Zone: VICOLI (ovest) · VIALE + INCROCIO con maxischermo e metro sopraelevata (centro) · MERCATO notturno (est).
// Tutto costruito col kit; forme speciali unite per materiale con mergeGeometries (poche draw call).
const map_neon_PI = Math.PI, map_neon_HP = Math.PI / 2;
const map_neon_FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101',
  N: '110101101101101', O: '111101101101111', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', ' ': '000000000000000'
};
const map_neon_WORDS = ['RAMEN', 'BAR', 'PIZZA', 'SUSHI', 'HOTEL', 'GELATO', 'KARAOKE', 'TABACCHI', 'CAFFE', 'MANGA', 'UDON', 'PASTA', 'TAXI', 'FARMACIA', 'NEON'];
const map_neon_SPR = {
  invader: ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  fish: ['..###...#', '.#####.##', '###.#####', '.#####.##', '..###...#'],
  bowl: ['.#..#..#.', '..#..#...', '#########', '#########', '.#######.', '..#####..']
};

// ---------- strumenti di base ----------
function map_neon_batch(kit) {
  const T = kit.THREE, bins = new Map(), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), s = new T.Vector3();
  return {
    add(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      const ax = sx === undefined ? 1 : sx;
      e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); q.setFromEuler(e); p.set(x, y, z); s.set(ax, sy === undefined ? ax : sy, sz === undefined ? ax : sz);
      g.applyMatrix4(m.compose(p, q, s));
      let a = bins.get(mat); if (!a) { a = []; bins.set(mat, a); } a.push(g);
    },
    flush() {
      bins.forEach((a, mat) => { const g = mergeGeometries(a, false); if (g) kit.mesh(g, mat, { x: 0, y: 0, z: 0 }, { collide: false }); });
      bins.clear();
    }
  };
}
function map_neon_ctx(kit) {
  const T = kit.THREE, m = (n, o) => kit.mat(n, o || {});
  const M = {
    asph: m('asphalt', { color: 0x4a4e5c, roughness: 0.25 }), puddle: m('asphalt', { color: 0x30343f, roughness: 0.06, scale: 6 }),
    walk: m('tile', { color: 0x767b88, roughness: 0.4, scale: 1.5 }), curb: m('concrete', { color: 0x9a9da6 }), conc: m('concrete', { color: 0x747985 }),
    towA: m('concrete_dark', { color: 0x565c72 }), towB: m('concrete_dark', { color: 0x62547a }),
    wTeal: m('tile', { color: 0x4f8088, scale: 1.2 }), wBrick: m('brick_red', { color: 0x9a6a62 }), wMauve: m('plaster', { color: 0x8a7892 }), wBlue: m('concrete', { color: 0x5c6b80 }),
    inner: m('plaster', { color: 0xb4aa9c }), floorW: m('wood', { color: 0x8a6a4c }), wood: m('wood'), woodD: m('wood_dark'),
    metal: m('metal', { color: 0x9aa0aa }), steel: m('metal_painted', { color: 0x343a46 }), rust: m('rust'), corr: m('corrugated', { color: 0x6a7078 }),
    glass: m('glass'), rubber: m('rubber', { color: 0x2c2c32 }), red: m('container_red'), blue: m('container_blue'), yellow: m('container_yellow'), green: m('container_green'),
    line: m('road_line', { color: 0xc8c8bc }), lineY: m('road_line', { color: 0xc9a63c }), dirt: m('dirt', { color: 0x4a4038 }), stain: m('dirt', { color: 0x2e2a2c, roughness: 0.2 }),
    sakura: m('grass', { color: 0xd78fb0 }), leaf: m('grass', { color: 0x4a7a55 }), sandbag: m('sandbag'),
    carA: m('metal_painted', { color: 0x8a2f4a, roughness: 0.3, metalness: 0.6 }), carB: m('metal_painted', { color: 0x2f6f8a, roughness: 0.3, metalness: 0.6 }), taxi: m('metal_painted', { color: 0xc9a227, roughness: 0.35, metalness: 0.4 })
  };
  const N = {
    pink: kit.neon(0xff2d95, 6), cyan: kit.neon(0x22e6ff, 6), violet: kit.neon(0x9b4dff, 6), yellow: kit.neon(0xffd23f, 5), red: kit.neon(0xff3b30, 5), green: kit.neon(0x3dff8a, 5),
    warm: kit.neon(0xffc27a, 5), cool: kit.neon(0xcfe8ff, 5), warmDim: kit.neon(0xffb866, 1.8), coolDim: kit.neon(0x8fd8ff, 1.6), screen: kit.neon(0x2a3cff, 1.3)
  };
  const holo = c => { const h = kit.neon(c, 2.2).clone(); h.transparent = true; h.opacity = 0.42; h.depthWrite = false; h.side = T.DoubleSide; return h; };
  const blob = ph => {
    const g = new T.IcosahedronGeometry(0.5, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.22 * Math.sin(x * 7 + ph) * Math.sin(y * 9 + ph * 1.7) + 0.14 * Math.sin(z * 11 + ph * 2.3);
      p.setXYZ(i, x * f, y * f, z * f);
    }
    g.computeVertexNormals(); return g;
  };
  const js = new T.Shape();
  [[-0.3, 0], [0.3, 0], [0.3, 0.18], [0.13, 0.48], [0.09, 0.85], [-0.09, 0.85], [-0.13, 0.48], [-0.3, 0.18]].forEach((v, i) => (i ? js.lineTo(v[0], v[1]) : js.moveTo(v[0], v[1])));
  const jersey = new T.ExtrudeGeometry(js, { depth: 2.4, bevelEnabled: false }); jersey.translate(0, 0, -1.2);
  const g = {
    box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(0.5, 0.5, 1, 10), cyl6: new T.CylinderGeometry(0.5, 0.5, 1, 6), cone: new T.CylinderGeometry(0.3, 0.5, 1, 7),
    sph: new T.IcosahedronGeometry(0.5, 1), tor: new T.TorusGeometry(0.5, 0.18, 6, 12), halo: new T.TorusGeometry(6.5, 0.13, 6, 40), quad: new T.PlaneGeometry(1, 1),
    blob: [blob(0.3), blob(1.9), blob(3.7)], jersey
  };
  return {
    kit, T, M, N, g, B: map_neon_batch(kit), H1: holo(0x22e6ff), H2: holo(0xff2d95),
    I: { winW: [], winC: [], winP: [], lantern: [], bulb: [], trash: [], debris: [], bollard: [], cap: [], sleeper: [], sandbag: [], bush: [], petal: [] },
    e: new T.Euler(), q: new T.Quaternion(), p: new T.Vector3(), s: new T.Vector3()
  };
}
function map_neon_mtx(C, x, y, z, ry, sx, sy, sz) {
  C.e.set(0, ry, 0); C.q.setFromEuler(C.e);
  return new C.T.Matrix4().compose(C.p.set(x, y, z), C.q, C.s.set(sx, sy, sz));
}
// sistema locale ruotato: +Z locale = "davanti", +X locale = destra di chi guarda il fronte
function map_neon_frame(C, ox, oy, oz, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return (geo, mat, lx, ly, lz, sx, sy, sz, rx, ry, rz) => C.B.add(geo, mat, ox + lx * c + lz * s, oy + ly, oz - lx * s + lz * c, rx || 0, rot + (ry || 0), rz || 0, sx, sy, sz);
}
function map_neon_obb(C, x, z, w, d, rot, y0, y1) {
  const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot)), hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2;
  C.kit.collider(x - hx, y0, z - hz, x + hx, y1, z + hz);
}
// box appoggiato a un muro: th = direzione della normale (0:+z, PI:-z, HP:+x, -HP:-x), t = spostamento lungo il muro
function map_neon_wb(C, th, x, z, t, y, along, h, thick, off, mat, collide) {
  const s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th));
  C.kit.box(x + c * t + s * off, y, z - s * t + c * off, s ? thick : along, h, s ? along : thick, mat, { collide: !!collide, cast: !!collide });
}
function map_neon_face(th, x0, x1, z0, z1) {
  const s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th));
  return { x: s ? (s > 0 ? x1 : x0) : (x0 + x1) / 2, z: c ? (c > 0 ? z1 : z0) : (z0 + z1) / 2, len: s ? z1 - z0 : x1 - x0 };
}

// ---------- scritte e disegni a pixel fatti di tubi al neon ----------
function map_neon_sprite(C, th, x, z, t, y, rows, px, mat, off) {
  const w = rows[0].length, h = rows.length;
  for (let r = 0; r < h; r++) {
    let c0 = -1;
    for (let c = 0; c <= w; c++) {
      const ch = c < w ? rows[r][c] : '.', on = ch === '1' || ch === '#';
      if (on && c0 < 0) c0 = c;
      if (!on && c0 >= 0) {
        const len = c - c0;
        map_neon_wb(C, th, x, z, t + (c0 + len / 2 - w / 2) * px, y + (h / 2 - r - 1) * px, len * px, px, 0.05, off, mat, false);
        c0 = -1;
      }
    }
  }
}
function map_neon_text(C, th, x, z, t, y, str, px, mat, off, vertical) {
  if (vertical) {
    for (let i = 0; i < str.length; i++) map_neon_text(C, th, x, z, t, y + ((str.length - 1) / 2 - i) * px * 6.2, str[i], px, mat, off, false);
    return;
  }
  const rows = ['', '', '', '', ''];
  for (let i = 0; i < str.length; i++) {
    const g = map_neon_FONT[str[i]] || map_neon_FONT[' '];
    for (let r = 0; r < 5; r++) rows[r] += (i ? '0' : '') + g.substr(r * 3, 3);
  }
  map_neon_sprite(C, th, x, z, t, y, rows, px, mat, off);
}
function map_neon_kanji(C, th, x, z, t, y, n, px, mat, off, vertical) {
  const R = C.kit.rng;
  for (let i = 0; i < n; i++) {
    const g = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
    const nh = 2 + Math.floor(R() * 2), nv = 1 + Math.floor(R() * 2);
    for (let j = 0; j < nh; j++) { const r = Math.floor(R() * 5), a = Math.floor(R() * 2), b = 3 + Math.floor(R() * 2); for (let c = a; c <= b; c++) g[r][c] = 1; }
    for (let j = 0; j < nv; j++) { const c = Math.floor(R() * 5), a = Math.floor(R() * 2), b = 3 + Math.floor(R() * 2); for (let r = a; r <= b; r++) g[r][c] = 1; }
    if (R() < 0.4) { g[4][0] = 1; g[4][4] = 1; }
    const rows = g.map(r => r.map(v => (v ? '1' : '0')).join('')), o = (i - (n - 1) / 2) * px * 6.4;
    map_neon_sprite(C, th, x, z, vertical ? t : t + o, vertical ? y - o : y, rows, px, mat, off);
  }
}
// insegna verticale a bandiera (sporge dal muro, scritta sulle due facce)
function map_neon_blade(C, th, x, z, t, y, h, mat, latin) {
  const s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th)), bx = x + c * t + s * 0.75, bz = z - s * t + c * 0.75, St = C.M.steel;
  map_neon_wb(C, th, x, z, t, y, 0.16, h, 1.0, 0.75, St, false);
  for (const f of [0.15, 0.85]) map_neon_wb(C, th, x, z, t, y + h * f, 0.06, 0.06, 0.3, 0.15, St, false);
  for (const yy of [y - 0.07, y + h]) map_neon_wb(C, th, x, z, t, yy, 0.2, 0.07, 1.04, 0.75, mat, false);
  for (const sg of [1, -1]) {
    const th2 = th + sg * map_neon_HP;
    if (latin) map_neon_text(C, th2, bx, bz, 0, y + h / 2, latin, 0.2, mat, 0.11, true);
    else map_neon_kanji(C, th2, bx, bz, 0, y + h / 2, Math.max(1, Math.floor(h / 0.95)), 0.14, mat, 0.11, true);
  }
}

// ---------- pezzi da facciata ----------
function map_neon_awning(C, th, x, z, t, y, w, mat) {
  const L = map_neon_frame(C, x + Math.cos(th) * t, 0, z - Math.sin(th) * t, th), g = C.g;
  L(g.box, mat, 0, y, 0.62, w, 0.05, 1.3, 0.3); L(g.box, mat, 0, y - 0.3, 1.22, w, 0.24, 0.03);
  for (const s of [-1, 1]) L(g.box, C.M.steel, s * (w / 2 - 0.05), y - 0.03, 0.6, 0.04, 0.04, 1.25, 0.3);
}
function map_neon_ac(C, th, x, z, t, y) {
  const W = (tt, yy, al, h, tk, off, mat) => map_neon_wb(C, th, x, z, t + tt, y + yy, al, h, tk, off, mat, false), M = C.M;
  W(0, 0, 0.95, 0.62, 0.42, 0.21, M.metal); W(-0.14, 0.08, 0.5, 0.46, 0.03, 0.43, M.steel); W(0.33, 0.1, 0.2, 0.4, 0.03, 0.43, M.steel);
  W(0, -0.1, 1.0, 0.05, 0.4, 0.2, M.steel); W(0.52, -1.6, 0.05, 1.7, 0.05, 0.04, M.rust);
}
function map_neon_vend(C, th, x, z, t, y0, body, neon) {
  const W = (tt, y, al, h, tk, off, mat, col) => map_neon_wb(C, th, x, z, t + tt, y0 + y, al, h, tk, off, mat, col), M = C.M;
  W(0, 0, 1.1, 1.95, 0.8, 0.42, body, true);
  W(-0.12, 0.72, 0.72, 1.05, 0.04, 0.83, C.N.coolDim); W(0, 1.8, 0.95, 0.1, 0.04, 0.83, neon); W(0, 0.52, 0.95, 0.07, 0.04, 0.83, neon);
  W(0, 0.18, 0.6, 0.22, 0.05, 0.83, M.steel); W(0.42, 0.85, 0.14, 0.6, 0.05, 0.83, M.metal);
  for (let i = 0; i < 3; i++) W(-0.12, 0.98 + i * 0.3, 0.72, 0.03, 0.05, 0.84, M.steel);
}
// scala antincendio con pianerottoli, ringhiere, rampe inclinate e scala a pioli
function map_neon_fire(C, th, x, z, t, levels, y0, dy) {
  const g = C.g, St = C.M.steel, L = map_neon_frame(C, x + Math.cos(th) * t, 0, z - Math.sin(th) * t, th);
  const run = 2.0, len = Math.hypot(run, dy), ang = Math.atan2(dy, run);
  for (let i = 0; i < levels; i++) {
    const y = y0 + i * dy;
    L(g.box, St, 0, y, 0.6, 3.2, 0.07, 1.1);
    for (const h of [0.5, 1.0]) { L(g.box, St, 0, y + h, 1.13, 3.2, 0.05, 0.05); for (const sx of [-1.58, 1.58]) L(g.box, St, sx, y + h, 0.6, 0.05, 0.05, 1.1); }
    for (let j = -3; j <= 3; j++) L(g.box, St, j * 0.52, y + 0.5, 1.13, 0.04, 1.0, 0.04);
    for (const sx of [-1.4, 1.4]) L(g.box, St, sx, y - 0.35, 0.4, 0.05, 0.05, 1.0, 0.7);
    if (i < levels - 1) {
      const d = i % 2 ? -1 : 1;
      L(g.box, St, 0, y + dy / 2, 0.38, len, 0.07, 0.6, 0, 0, d * ang); L(g.box, St, 0, y + dy / 2 + 0.9, 0.7, len, 0.04, 0.04, 0, 0, d * ang);
    }
  }
  L(g.box, St, 0.86, y0 / 2 + 0.5, 0.98, 0.05, y0 - 1.0, 0.05); L(g.box, St, 1.34, y0 / 2 + 0.5, 0.98, 0.05, y0 - 1.0, 0.05);
  for (let j = 0; j < 5; j++) L(g.box, St, 1.1, 1.2 + j * (y0 - 1.4) / 5, 0.98, 0.5, 0.04, 0.04);
}
// finestre accese dei grattacieli: quadratini emissivi in istanza (migliaia, 3 draw call)
function map_neon_wins(C, th, x, z, len, y0, y1, p) {
  const s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th)), R = C.kit.rng, n = Math.floor((len - 1.2) / 2.2), I = C.I;
  for (let y = y0; y < y1 - 2.4; y += 3.4) {
    const fp = p * (0.4 + 1.2 * R());
    for (let i = 0; i < n; i++) {
      if (R() > fp) continue;
      const t = (i - (n - 1) / 2) * 2.2, r = R();
      (r < 0.6 ? I.winW : r < 0.92 ? I.winC : I.winP).push(map_neon_mtx(C, x + c * t + s * 0.06, y + 1.0, z - s * t + c * 0.06, th, 1.3, 1.8, 1));
    }
  }
}
// facciata di strada: negozi, serrande, vetrine, porte, insegne, tende, marcapiani, lesene, finestre con davanzale
function map_neon_facade(C, th, x, z, len, H) {
  const k = C.kit, M = C.M, N = C.N, R = k.rng, sC = [N.pink, N.cyan, N.violet, N.yellow];
  const W = (t, y, al, h, tk, off, mat, col) => map_neon_wb(C, th, x, z, t, y, al, h, tk, off, mat, col);
  const fl = Math.max(0, Math.min(4, Math.floor((H - 4.2) / 3.4))), bays = Math.max(1, Math.round(len / 4.2)), bw = len / bays;
  W(0, 0, len, 0.5, 0.12, 0.06, M.conc);
  for (let i = 0; i <= fl; i++) W(0, 4.0 + i * 3.4, len, 0.22, 0.3, 0.15, M.conc);
  for (let b = 0; b <= bays; b++) W(-len / 2 + b * bw, 0, 0.5, 4.0 + fl * 3.4, 0.2, 0.1, M.conc);
  for (let b = 0; b < bays; b++) {
    const t = -len / 2 + (b + 0.5) * bw, kind = R(), col = k.pick(sC);
    if (kind < 0.3) { W(t, 0.1, bw - 1.0, 2.9, 0.08, 0.04, M.corr); W(t, 0.1, bw - 0.8, 0.12, 0.14, 0.07, M.steel); W(t, 1.5, 0.3, 0.06, 0.1, 0.06, M.metal); }
    else if (kind < 0.62) {
      W(t, 0.9, bw - 1.2, 2.0, 0.06, 0.03, k.pick([N.warmDim, N.coolDim])); W(t, 0.5, bw - 1.0, 0.4, 0.14, 0.07, M.steel); W(t, 2.9, bw - 1.0, 0.14, 0.14, 0.07, M.steel); W(t, 0.9, 0.08, 2.0, 0.1, 0.05, M.steel);
    } else if (kind < 0.85) {
      W(t, 0.15, 1.3, 2.4, 0.1, 0.05, M.steel); W(t, 0.15, 1.05, 2.2, 0.06, 0.1, M.woodD); W(t, 0, 1.6, 0.15, 0.5, 0.25, M.conc, true); W(t + 0.35, 1.1, 0.08, 0.12, 0.06, 0.15, M.metal); W(t, 2.65, 0.5, 0.16, 0.2, 0.12, N.warm);
    } else {
      W(t + 0.9, 1.0, 0.7, 0.9, 0.25, 0.125, M.metal); W(t + 1.5, 0.5, 0.1, 3.4, 0.1, 0.07, M.rust); W(t + 1.7, 0.5, 0.1, 3.4, 0.1, 0.07, M.metal);
      if (R() < 0.7) map_neon_vend(C, th, x, z, t - 0.6, 0, k.pick([M.red, M.blue, M.steel]), col);
    }
    if (kind < 0.85 && R() < 0.75) {
      W(t, 3.0, bw - 0.9, 0.9, 0.12, 0.2, M.steel);
      const word = k.pick(map_neon_WORDS);
      if (R() < 0.5 && (word.length * 4 - 1) * 0.11 < bw - 1.2) map_neon_text(C, th, x, z, t, 3.45, word, 0.11, col, 0.29);
      else map_neon_kanji(C, th, x, z, t, 3.45, Math.max(2, Math.floor((bw - 1.3) / 0.75)), 0.11, col, 0.29);
    } else if (kind >= 0.3 && kind < 0.85) map_neon_awning(C, th, x, z, t, 2.95, bw - 0.9, k.pick([M.red, M.blue, M.yellow]));
    for (let i = 0; i < fl; i++) {
      const y = 5.0 + i * 3.4;
      for (const dt of [-bw * 0.24, bw * 0.24]) {
        const lit = R();
        W(t + dt, y - 0.1, 1.5, 1.9, 0.1, 0.05, M.steel); W(t + dt, y, 1.3, 1.7, 0.06, 0.09, lit < 0.4 ? M.glass : lit < 0.75 ? N.warmDim : N.coolDim); W(t + dt, y - 0.18, 1.7, 0.08, 0.3, 0.15, M.conc);
        if (lit > 0.9) for (let j = 0; j < 3; j++) W(t + dt, y + 0.3 + j * 0.5, 1.4, 0.16, 0.05, 0.13, M.wood);
      }
      if (R() < 0.35) map_neon_ac(C, th, x, z, t, y - 0.85);
    }
    if (R() < 0.3 && fl > 0) map_neon_blade(C, th, x, z, t + bw * 0.5 - 0.3, 4.4, Math.min(6, fl * 3.4 - 0.8), col, null);
  }
}
// grattacielo di bordo: podio dettagliato + fusto arretrato con finestre accese, neon sugli spigoli, antenna, insegna gigante
function map_neon_tower(C, x0, x1, z0, z1, H, th, o) {
  o = o || {};
  const k = C.kit, M = C.M, N = C.N, R = k.rng, s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th)), nc = { collide: false, cast: false };
  const mat = k.pick([M.towA, M.towB]), hp = o.hp || k.pick([11, 14.4, 17.8]), col = k.pick([N.pink, N.cyan, N.violet, N.yellow]);
  k.box((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, hp, z1 - z0, mat);
  const f = map_neon_face(th, x0, x1, z0, z1);
  map_neon_facade(C, th, f.x, f.z, f.len, hp);
  if (f.len >= 12 && R() < 0.75) map_neon_fire(C, th, f.x, f.z, k.rand(-f.len / 4, f.len / 4), Math.min(3, Math.floor((hp - 4.1) / 3.4) + 1), 4.1, 3.4);
  map_neon_wb(C, th, f.x, f.z, 0, hp, f.len, 0.7, 0.25, -0.13, M.conc, false);
  map_neon_wb(C, th, f.x, f.z, 0, hp + 0.4, f.len, 0.1, 0.05, 0.03, col, false);
  const a0 = s ? (s < 0 ? x0 + 2.6 : x0) : x0 + 0.8, a1 = s ? (s > 0 ? x1 - 2.6 : x1) : x1 - 0.8;
  const b0 = c ? (c < 0 ? z0 + 2.6 : z0) : z0 + 0.8, b1 = c ? (c > 0 ? z1 - 2.6 : z1) : z1 - 0.8, cx = (a0 + a1) / 2, cz = (b0 + b1) / 2;
  k.box(cx, hp, cz, a1 - a0, H - hp, b1 - b0, mat);
  for (const t2 of [th, th + map_neon_HP, th - map_neon_HP]) { const g2 = map_neon_face(t2, a0, a1, b0, b1); map_neon_wins(C, t2, g2.x, g2.z, g2.len, hp + 1.2, H - 0.5, 0.5); }
  const fs = map_neon_face(th, a0, a1, b0, b1), W = (t, y, al, h, tk, off, m2) => map_neon_wb(C, th, fs.x, fs.z, t, y, al, h, tk, off, m2, false);
  for (const sg of [-1, 1]) W(sg * (fs.len / 2 - 0.1), hp, 0.14, H - hp, 0.14, 0.07, col);
  W(0, H - 0.6, fs.len, 0.2, 0.1, 0.05, k.pick([N.pink, N.cyan, N.violet]));
  k.box(cx, H, cz, (a1 - a0) * 0.5, 2.6, (b1 - b0) * 0.5, mat, nc);
  const ah = k.rand(6, 14);
  k.box(cx, H + 2.6, cz, 0.3, ah, 0.3, M.steel, nc); k.box(cx, H + 2.6 + ah, cz, 0.5, 0.5, 0.5, N.red, nc);
  if (o.hero) {
    W(0, hp + 3, 16, 36, 0.3, 0.15, M.steel); W(0, hp + 3.4, 15.2, 35.2, 0.04, 0.32, N.screen);
    map_neon_text(C, th, fs.x, fs.z, -4.2, hp + 21, o.hero, 0.9, N.pink, 0.4, true);
    map_neon_sprite(C, th, fs.x, fs.z, 3.4, hp + 31, map_neon_SPR.heart, 0.8, N.pink, 0.4);
    map_neon_sprite(C, th, fs.x, fs.z, 3.4, hp + 21, map_neon_SPR.invader, 0.6, N.cyan, 0.4);
    map_neon_sprite(C, th, fs.x, fs.z, 3.4, hp + 11, map_neon_SPR.fish, 0.7, N.yellow, 0.4);
    for (const sg of [-1, 1]) { k.box(cx + sg * 7, H, cz, 1.2, 12, 1.2, mat, nc); k.box(cx + sg * 7, H + 12, cz, 0.6, 0.6, 0.6, N.red, nc); W(sg * 8.4, hp + 3, 0.2, 36, 0.1, 0.2, N.cyan); }
  } else if (R() < 0.7) {
    const t = k.rand(-fs.len / 4, fs.len / 4), y = hp + k.rand(3, 8), word = k.pick(map_neon_WORDS);
    if (R() < 0.5 && word.length <= 5) { W(t, y, 2.6, word.length * 3.1 + 1, 0.3, 0.15, M.steel); map_neon_text(C, th, fs.x, fs.z, t, y + word.length * 1.55 + 0.5, word, 0.5, col, 0.33, true); }
    else { W(t, y, 3.0, 14.6, 0.3, 0.15, M.steel); map_neon_kanji(C, th, fs.x, fs.z, t, y + 7.3, 5, 0.42, col, 0.33, true); }
  }
}
// palazzo con la galleria della metro (chiude i due capi del viadotto)
function map_neon_portal(C, sgn, H) {
  const k = C.kit, M = C.M, N = C.N, th = -sgn * map_neon_HP, xf = sgn > 0 ? 51 : -50, xa = sgn > 0 ? 51 : -70, w = sgn > 0 ? 19 : 20, cx = xa + w / 2, nc = { collide: false, cast: false };
  for (const z of [-7.5, 7.5]) { k.box(cx, 0, z, w, 13, 5, M.towA); map_neon_facade(C, th, xf, z, 5, 13); }
  k.box(cx, 13, 0, w, H - 13, 20, M.towA); k.box(xf + sgn * 3.5, 0, 0, 1, 13, 10, M.towB);
  k.box(xf + sgn * 2.96, 6.6, 0, 0.06, 4.6, 6.4, N.screen, nc);
  for (const t of [-5.15, 5.15]) map_neon_wb(C, th, xf, 0, t, 0, 0.3, 13, 0.12, 0.06, N.cyan, false);
  map_neon_wb(C, th, xf, 0, 0, 13, 10.6, 0.3, 0.12, 0.06, N.cyan, false);
  map_neon_wb(C, th, xf, 0, 0, 14, 9, 2.6, 0.2, 0.1, M.steel, false);
  map_neon_text(C, th, xf, 0, 0, 15.3, 'METRO', 0.4, N.yellow, 0.23);
  map_neon_wins(C, th, xf, 0, 20, 18, H - 0.5, 0.5);
  k.box(cx, H, 0, 6, 3, 8, M.towA, nc); k.box(cx, H + 3, 0, 0.3, 10, 0.3, M.steel, nc); k.box(cx, H + 13, 0, 0.5, 0.5, 0.5, N.red, nc);
}

// ---------- veicoli ----------
function map_neon_car(C, x, z, rot, body, taxi, oy) {
  const g = C.g, M = C.M, N = C.N, L = map_neon_frame(C, x, oy || 0, z, rot), HP = map_neon_HP;
  L(g.box, body, 0, 0.6, 0, 1.84, 0.5, 4.4); L(g.box, M.rubber, 0, 0.3, 0, 1.78, 0.16, 4.3);
  L(g.box, body, 0, 0.9, -1.5, 1.74, 0.1, 1.35, -0.07); L(g.box, body, 0, 0.9, 1.75, 1.74, 0.1, 0.9, 0.05);
  L(g.box, M.rubber, 0, 1.12, 0.2, 1.5, 0.5, 2.0); L(g.box, body, 0, 1.4, 0.2, 1.56, 0.07, 1.7);
  L(g.box, M.glass, 0, 1.12, -0.95, 1.5, 0.62, 0.05, 0.55); L(g.box, M.glass, 0, 1.12, 1.33, 1.5, 0.6, 0.05, -0.55);
  for (const sx of [-1, 1]) {
    L(g.box, M.glass, sx * 0.78, 1.14, 0.2, 0.04, 0.4, 1.9); L(g.box, N.cool, sx * 0.6, 0.68, -2.21, 0.36, 0.12, 0.05); L(g.box, N.red, sx * 0.62, 0.7, 2.21, 0.34, 0.1, 0.05);
    L(g.box, body, sx * 0.98, 1.0, -0.75, 0.14, 0.1, 0.08); L(g.box, taxi ? N.yellow : N.violet, sx * 0.9, 0.2, 0, 0.04, 0.04, 3.0);
    for (const sz of [-1.35, 1.35]) { L(g.cyl, M.rubber, sx * 0.86, 0.33, sz, 0.66, 0.24, 0.66, 0, 0, HP); L(g.cyl, M.metal, sx * 0.985, 0.33, sz, 0.36, 0.03, 0.36, 0, 0, HP); }
  }
  for (const sz of [-1, 1]) L(g.box, M.rubber, 0, 0.42, sz * 2.22, 1.86, 0.22, 0.14);
  L(g.box, M.line, 0, 0.5, 2.3, 0.5, 0.12, 0.02);
  if (taxi) { L(g.box, N.yellow, 0, 1.5, 0.2, 0.55, 0.14, 0.2); L(g.box, M.steel, 0, 0.62, 0, 1.86, 0.1, 1.4); }
  if (!oy) map_neon_obb(C, x, z, 1.9, 4.5, rot, 0, 1.45);
}
function map_neon_van(C, x, z, rot, body, sign) {
  const g = C.g, M = C.M, N = C.N, L = map_neon_frame(C, x, 0, z, rot), HP = map_neon_HP;
  L(g.box, body, 0, 1.45, 0.75, 2.0, 1.9, 3.3); L(g.box, body, 0, 0.95, -1.7, 1.9, 0.9, 1.5); L(g.box, M.rubber, 0, 1.6, -1.55, 1.8, 0.5, 1.1);
  L(g.box, M.glass, 0, 1.6, -2.12, 1.7, 0.6, 0.05, 0.3); L(g.box, body, 0, 1.9, -1.5, 1.86, 0.08, 1.3); L(g.box, M.rubber, 0, 0.36, 0, 1.9, 0.2, 5.0);
  for (const sz of [-1, 1]) L(g.box, M.rubber, 0, 0.5, sz * 2.52, 1.96, 0.24, 0.14);
  for (const sx of [-1, 1]) {
    L(g.box, N.cool, sx * 0.65, 0.85, -2.47, 0.34, 0.14, 0.05); L(g.box, N.red, sx * 0.75, 0.9, 2.42, 0.2, 0.3, 0.05); L(g.box, M.glass, sx * 0.91, 1.6, -1.55, 0.04, 0.42, 0.9); L(g.box, body, sx * 1.05, 1.45, -2.0, 0.16, 0.22, 0.08);
    for (const sz of [-1.6, 1.5]) { L(g.cyl, M.rubber, sx * 0.9, 0.38, sz, 0.76, 0.26, 0.76, 0, 0, HP); L(g.cyl, M.metal, sx * 1.035, 0.38, sz, 0.4, 0.03, 0.4, 0, 0, HP); }
  }
  L(g.box, N.warmDim, 1.01, 1.55, 0.8, 0.04, 0.8, 2.2); L(g.box, M.red, 1.5, 2.25, 0.8, 1.0, 0.05, 2.5, 0, 0, -0.25); L(g.box, M.steel, 1.25, 1.1, 0.8, 0.5, 0.05, 2.3);
  L(g.box, sign, 0, 2.58, 0.75, 0.1, 0.36, 2.4); L(g.box, M.steel, 0, 2.43, 0.75, 0.3, 0.06, 2.6); L(g.box, sign, -1.01, 1.0, 0.75, 0.03, 0.08, 3.0);
  map_neon_obb(C, x, z, 2.1, 5.2, rot, 0, 2.4);
}

// ---------- oggetti di strada ----------
function map_neon_jersey(C, x, z, rot) { C.B.add(C.g.jersey, C.M.conc, x, 0, z, 0, rot, 0); C.B.add(C.g.box, C.M.yellow, x, 0.87, z, 0, rot, 0, 0.14, 0.05, 2.3); map_neon_obb(C, x, z, 0.6, 2.4, rot, 0, 0.85); }
function map_neon_barrel(C, x, y, z, mat) {
  const g = C.g, B = C.B;
  B.add(g.cyl, mat, x, y + 0.45, z, 0, 0, 0, 0.6, 0.9, 0.6); for (const h of [0.25, 0.65]) B.add(g.cyl, C.M.steel, x, y + h, z, 0, 0, 0, 0.63, 0.04, 0.63); B.add(g.cyl, C.M.steel, x, y + 0.9, z, 0, 0, 0, 0.56, 0.03, 0.56);
  C.kit.collider(x - 0.3, y, z - 0.3, x + 0.3, y + 0.9, z + 0.3);
}
function map_neon_crate(C, x, y, z, s, rot, mat) {
  const k = C.kit, D = C.M.woodD;
  k.box(x, y, z, s, s, s, mat, { collide: true, rotY: rot, cast: true });
  k.box(x, y + s, z, s + 0.06, 0.05, s + 0.06, D, { collide: false, rotY: rot, cast: false }); k.box(x, y + s * 0.45, z, s + 0.04, 0.08, s + 0.04, D, { collide: false, rotY: rot, cast: false });
}
function map_neon_dumpster(C, x, z, rot, y0) {
  const g = C.g, M = C.M, by = y0 || 0, L = map_neon_frame(C, x, by, z, rot);
  L(g.box, M.green, 0, 0.7, 0, 1.9, 1.0, 1.0); L(g.box, M.steel, 0, 1.24, -0.04, 1.96, 0.06, 1.08, -0.1); L(g.box, M.steel, 0, 1.18, 0, 1.96, 0.06, 1.06); L(g.box, M.line, 0, 0.75, 0.51, 0.6, 0.3, 0.02);
  for (const sx of [-1, 1]) { L(g.box, M.steel, sx * 0.99, 0.9, 0, 0.06, 0.1, 0.6); for (const sz of [-0.4, 0.4]) L(g.cyl, M.rubber, sx * 0.8, 0.1, sz, 0.2, 0.08, 0.2, 0, 0, map_neon_HP); }
  map_neon_obb(C, x, z, 1.9, 1.0, rot, 0, by + 1.25);
}
function map_neon_scooter(C, x, z, rot, col, y0) {
  const g = C.g, M = C.M, by = y0 || 0, L = map_neon_frame(C, x, by, z, rot);
  for (const sz of [-0.62, 0.62]) L(g.tor, M.rubber, 0, 0.28, sz, 0.42, 0.42, 0.42, 0, map_neon_HP);
  L(g.box, col, 0, 0.42, 0.12, 0.34, 0.26, 1.0); L(g.box, M.rubber, 0, 0.7, 0.3, 0.32, 0.1, 0.62); L(g.box, col, 0, 0.72, -0.5, 0.4, 0.62, 0.08, -0.2);
  L(g.box, M.steel, 0, 0.9, -0.55, 0.06, 0.5, 0.06, -0.2); L(g.box, M.steel, 0, 1.12, -0.6, 0.62, 0.05, 0.05); L(g.box, C.N.cool, 0, 1.0, -0.66, 0.14, 0.1, 0.04);
  L(g.box, col, 0, 1.0, 0.72, 0.46, 0.46, 0.46); L(g.box, C.N.pink, 0, 1.0, 0.96, 0.3, 0.12, 0.02); L(g.box, C.N.red, 0, 0.6, 0.63, 0.12, 0.06, 0.03);
  map_neon_obb(C, x, z, 0.5, 1.7, rot, 0, by + 1.1);
}
function map_neon_bench(C, th, x, z, y0) {
  const by = y0 || 0, W = (t, y, al, h, tk, off, mat) => map_neon_wb(C, th, x, z, t, by + y, al, h, tk, off, mat, false);
  W(0, 0.42, 1.8, 0.07, 0.5, 0, C.M.wood); W(0, 0.55, 1.8, 0.45, 0.06, -0.25, C.M.wood); for (const s of [-0.75, 0.75]) W(s, 0, 0.08, 0.42, 0.45, 0, C.M.steel);
  map_neon_obb(C, x, z, 1.8, 0.5, th, 0, by + 0.9);
}
function map_neon_bin(C, x, z, y0) {
  const by = y0 || 0;
  C.B.add(C.g.cyl, C.M.steel, x, by + 0.45, z, 0, 0, 0, 0.5, 0.9, 0.5); C.B.add(C.g.cyl, C.M.metal, x, by + 0.92, z, 0, 0, 0, 0.54, 0.05, 0.54);
  C.kit.collider(x - 0.25, by, z - 0.25, x + 0.25, by + 0.95, z + 0.25);
}
function map_neon_pallet(C, x, z, rot, n) {
  const L = map_neon_frame(C, x, 0, z, rot), g = C.g, Wd = C.M.wood;
  for (let j = 0; j < n; j++) { const y = j * 0.15; for (const o of [-0.5, 0, 0.5]) L(g.box, Wd, o, y + 0.05, 0, 0.1, 0.1, 1.0); for (let i = -2; i <= 2; i++) L(g.box, Wd, 0, y + 0.125, i * 0.22, 1.2, 0.03, 0.14); }
  map_neon_obb(C, x, z, 1.2, 1.0, rot, 0, n * 0.15);
}
function map_neon_container(C, x, z, alongX, mat, y0) {
  const k = C.kit, w = alongX ? 6.1 : 2.44, d = alongX ? 2.44 : 6.1, by = y0 || 0, nc = { collide: false, cast: false };
  k.box(x, by, z, w, 2.6, d, mat);
  for (let i = -5; i <= 5; i++) for (const sg of [-1, 1]) k.box(x + (alongX ? i * 0.55 : sg * 1.24), by + 0.15, z + (alongX ? sg * 1.24 : i * 0.55), alongX ? 0.2 : 0.06, 2.3, alongX ? 0.06 : 0.2, mat, nc);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(x + sx * (w / 2 - 0.06), by, z + sz * (d / 2 - 0.06), 0.16, 2.64, 0.16, C.M.steel, nc);
  for (const o of [-0.5, 0.5]) k.box(x + (alongX ? w / 2 + 0.03 : o), by + 0.2, z + (alongX ? o : d / 2 + 0.03), 0.06, 2.2, 0.06, C.M.metal, nc);
}
function map_neon_sandbags(C, x, z, rot, n, layers) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let l = 0; l < layers; l++) for (let i = 0; i < n - l; i++) { const o = (i - (n - l - 1) / 2) * 0.62; C.I.sandbag.push(map_neon_mtx(C, x + o * c, 0.14 + l * 0.25, z - o * s, rot + C.kit.rand(-0.15, 0.15), 0.66, 0.28, 0.38)); }
  map_neon_obb(C, x, z, n * 0.62, 0.42, rot, 0, layers * 0.25 + 0.05);
}
// ciliegio: tronco conico piegato, rami, 7-10 ciuffi rosa irregolari, petali a terra
function map_neon_tree(C, x, z, s, y0) {
  const g = C.g, M = C.M, k = C.kit, by = y0 || 0, lean = k.rand(-0.12, 0.12), ry = k.rand(0, 6.28), h = 3.0 * s;
  C.B.add(g.cone, M.woodD, x, by + h / 2, z, lean, ry, 0, 0.5 * s, h, 0.5 * s);
  const tx = x + Math.sin(ry) * Math.sin(lean) * h * 0.5, tz = z + Math.cos(ry) * Math.sin(lean) * h * 0.5;
  for (let i = 0; i < 3; i++) { const a = ry + i * 2.1 + k.rand(-0.3, 0.3); C.B.add(g.cyl6, M.woodD, tx + Math.sin(a) * 0.5 * s, by + h + 0.3 * s, tz + Math.cos(a) * 0.5 * s, 0.9, a, 0, 0.12 * s, 1.5 * s, 0.12 * s); }
  const n = 7 + Math.floor(k.rng() * 4);
  for (let i = 0; i < n; i++) { const a = k.rand(0, 6.28), r = k.rand(0.2, 1.4) * s, sc = k.rand(1.5, 2.5) * s; C.B.add(g.blob[i % 3], M.sakura, tx + Math.cos(a) * r, by + h + k.rand(0.3, 1.7) * s, tz + Math.sin(a) * r, k.rand(0, 3), a, 0, sc, sc * k.rand(0.7, 0.95), sc); }
  for (let i = 0; i < 12; i++) C.I.petal.push(map_neon_mtx(C, x + k.rand(-3, 3), 0.165, z + k.rand(-3, 3), k.rand(0, 6.28), 0.12, 0.012, 0.08));
  k.collider(x - 0.2, by, z - 0.2, x + 0.2, by + h, z + 0.2);
}
function map_neon_lamp(C, x, z, th, y0) {
  const M = C.M, by = y0 || 0;
  C.kit.box(x, by, z, 0.36, 0.6, 0.36, M.steel);
  C.B.add(C.g.cyl6, M.steel, x, by + 3.4, z, 0, 0, 0, 0.16, 5.8, 0.16);
  map_neon_wb(C, th, x, z, 0, by + 6.2, 0.1, 0.1, 1.8, 0.8, M.steel, false); map_neon_wb(C, th, x, z, 0, by + 6.08, 0.4, 0.12, 0.9, 1.4, M.steel, false);
  map_neon_wb(C, th, x, z, 0, by + 6.03, 0.28, 0.05, 0.7, 1.4, C.N.warm, false);
  map_neon_wb(C, th, x, z, 0, by + 3.0, 0.5, 1.2, 0.04, 0.12, C.kit.pick([C.N.pink, C.N.cyan, C.N.violet]), false);
}
function map_neon_pole(C, x, z, alongX) {
  const M = C.M, k = C.kit, nc = { collide: false, cast: false };
  C.B.add(C.g.cone, M.woodD, x, 4.5, z, 0.015, 0, 0.02, 0.5, 9, 0.5);
  for (const y of [8.3, 7.6]) k.box(x, y, z, alongX ? 0.12 : 2.2, 0.12, alongX ? 2.2 : 0.12, M.woodD, nc);
  C.B.add(C.g.cyl, M.metal, x + (alongX ? 0 : 0.45), 6.3, z + (alongX ? 0.45 : 0), 0, 0, 0, 0.5, 0.9, 0.5);
  k.box(x, 5.2, z, 0.3, 0.4, 0.3, M.steel, nc); k.collider(x - 0.15, 0, z - 0.15, x + 0.15, 9, z + 0.15);
}
// cavo con catenaria (pancia), opzionalmente con lanterne/lampadine appese
function map_neon_cable(C, ax, ay, az, bx, by, bz, sag, n, lamps) {
  let px = ax, py = ay, pz = az;
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t - sag * 4 * t * (1 - t), z = az + (bz - az) * t;
    const dx = x - px, dy = y - py, dz = z - pz, len = Math.hypot(dx, dy, dz);
    C.B.add(C.g.cyl6, C.M.rubber, (x + px) / 2, (y + py) / 2, (z + pz) / 2, Math.acos(dy / len), Math.atan2(dx, dz), 0, 0.04, len, 0.04);
    if (lamps && i < n) C.I[lamps].push(map_neon_mtx(C, x, y - 0.22, z, 0, lamps === 'bulb' ? 0.16 : 0.3, lamps === 'bulb' ? 0.2 : 0.38, lamps === 'bulb' ? 0.16 : 0.3));
    px = x; py = y; pz = z;
  }
}
// bancarella di street food: banco, cucina, tenda inclinata, lanterne, sgabelli, insegna
function map_neon_stall(C, x, z, rot, cloth, neon, y0) {
  const g = C.g, M = C.M, N = C.N, L = map_neon_frame(C, x, y0, z, rot);
  L(g.box, M.wood, 0, 0.5, 0.5, 2.6, 1.0, 0.7); L(g.box, M.woodD, 0, 1.03, 0.5, 2.8, 0.06, 0.9); L(g.box, M.metal, 0, 0.45, -0.85, 2.4, 0.9, 0.55);
  for (const sx of [-1.35, 1.35]) for (const sz of [-1.05, 0.95]) L(g.box, M.steel, sx, 1.25, sz, 0.07, 2.5, 0.07);
  L(g.box, cloth, 0, 2.6, 0, 3.2, 0.06, 2.7, 0.16); L(g.box, cloth, 0, 2.2, 1.34, 3.2, 0.3, 0.03); L(g.box, M.steel, 0, 2.95, 0.9, 2.3, 0.5, 0.08); L(g.box, N.warm, 0, 2.3, 0.4, 2.3, 0.04, 0.06);
  for (const sx of [-1.25, 1.25]) L(g.sph, N.red, sx, 1.95, 1.2, 0.34, 0.42, 0.34);
  L(g.cyl, M.metal, 0.6, 1.08, -0.85, 0.45, 0.36, 0.45); L(g.cyl, M.metal, -0.4, 1.02, -0.85, 0.36, 0.24, 0.36);
  for (let i = -1; i <= 1; i++) { L(g.cyl, M.line, i * 0.7, 1.1, 0.5, 0.24, 0.09, 0.24); L(g.cyl, M.red, i * 0.9, 0.24, 1.45, 0.34, 0.48, 0.34); }
  L(g.cyl, M.rust, 1.6, 0.45, -0.9, 0.32, 0.9, 0.32); L(g.box, M.woodD, -1.5, 1.5, 0.5, 0.05, 0.8, 0.55);
  map_neon_kanji(C, rot, x, z, 0, y0 + 2.95, 3, 0.07, neon, 0.95);
  map_neon_obb(C, x + Math.sin(rot) * 0.5, z + Math.cos(rot) * 0.5, 2.8, 0.9, rot, 0, y0 + 1.05);
  map_neon_obb(C, x - Math.sin(rot) * 0.85, z - Math.cos(rot) * 0.85, 2.4, 0.55, rot, 0, y0 + 0.9);
}
function map_neon_traffic(C, x, z, th) {
  const N = C.N, St = C.M.steel, s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th));
  C.B.add(C.g.cyl6, St, x, 2.9, z, 0, 0, 0, 0.16, 5.8, 0.16);
  map_neon_wb(C, th, x, z, 0, 5.6, 0.1, 0.1, 3.4, 1.7, St, false); map_neon_wb(C, th, x, z, 0, 4.9, 0.36, 1.05, 0.3, 3.3, St, false);
  [N.red, N.yellow, N.green].forEach((m, i) => { for (const sg of [-1, 1]) map_neon_wb(C, th + sg * map_neon_HP, x + s * 3.3, z + c * 3.3, 0, 5.62 - i * 0.32, 0.2, 0.2, 0.04, 0.2, m, false); });
  C.kit.collider(x - 0.12, 0, z - 0.12, x + 0.12, 5.8, z + 0.12);
}

// ---------- edifici entrabili: decorazione esterna ----------
function map_neon_dress(C, b) {
  const k = C.kit, M = C.M, N = C.N, R = k.rng, g = C.g, fh = 3.4, H = b.fl * fh, PI = map_neon_PI, HP = map_neon_HP, nc = { collide: false, cast: false };
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
  for (const th of [0, PI, HP, -HP]) {
    const f = map_neon_face(th, x0, x1, z0, z1), long = Math.abs(Math.cos(th)) > 0.5, doors = long ? [-6, 6] : [0];
    const W = (t, y, al, h, tk, off, mat, col) => map_neon_wb(C, th, f.x, f.z, t, y, al, h, tk, off, mat, col);
    for (let i = 1; i <= b.fl; i++) W(0, i * fh - 0.22, f.len + 0.36, 0.22, i === b.fl ? 0.3 : 0.18, i === b.fl ? 0.15 : 0.09, M.conc);
    W(0, H - 0.5, f.len + 0.1, 0.08, 0.05, 0.03, b.neon);
    for (const sg of [-1, 1]) W(sg * (f.len / 2 - 0.2), 0, 0.46, H, 0.14, 0.07, M.conc);
    W(-f.len / 2 + 0.8, 0, 0.11, H, 0.11, 0.08, M.rust); W(-f.len / 2 + 0.8, H - 0.3, 0.3, 0.25, 0.25, 0.14, M.rust);
    for (const t of doors) {
      for (const sg of [-1, 1]) W(t + sg * 1.03, 0, 0.16, 2.5, 0.2, 0.1, M.steel);
      W(t, 2.45, 2.22, 0.16, 0.22, 0.11, M.steel); W(t, 2.52, 0.34, 0.07, 0.14, 0.2, N.warm);
      map_neon_awning(C, th, f.x, f.z, t, 3.0, 2.8, b.awn);
      const sw = Math.max(2.4, b.n.length * 0.4 + 0.5);
      W(t, 3.52, sw, 0.74, 0.1, 0.17, M.steel); W(t, 3.48, sw + 0.1, 0.04, 0.12, 0.17, b.neon);
      map_neon_text(C, th, f.x, f.z, t, 3.89, b.n, 0.1, b.neon, 0.25);
    }
    for (let i = 1; i <= b.fl; i++) for (const t of long ? [-9, -3, 3, 9] : [-4.6, 4.6]) if (R() < 0.45) map_neon_ac(C, th, f.x, f.z, t, i * fh - 0.98);
    for (let i = 1; i < b.fl; i++) for (const t of long ? (i === 1 ? [0] : [-6, 0, 6]) : [-3.6, 3.6]) if (R() < 0.6) {
      const y = i * fh;
      W(t, y - 0.16, 2.6, 0.16, 1.1, 0.55, M.conc, true); W(t, y + 0.95, 2.6, 0.05, 0.05, 1.07, M.steel);
      for (const sg of [-1, 1]) W(t + sg * 1.28, y + 0.95, 0.05, 0.05, 1.1, 0.55, M.steel);
      for (let j = -3; j <= 3; j++) W(t + j * 0.42, y, 0.04, 0.95, 0.04, 1.07, M.steel);
      if (R() < 0.6) { W(t, y + 1.85, 2.4, 0.02, 0.02, 0.95, M.rubber); for (let j = -1; j <= 1; j++) W(t + j * 0.7, y + 1.25, 0.5, 0.6, 0.02, 0.95, k.pick([M.red, M.blue, M.inner, M.yellow])); }
      else { W(t + 0.8, y, 0.4, 0.35, 0.4, 0.6, M.rust); W(t - 0.7, y, 0.5, 0.3, 0.35, 0.65, M.wood); }
    }
    if (long) {
      const h = Math.max(3, Math.min(H - 4.4, 6.2));
      map_neon_blade(C, th, f.x, f.z, (th === 0 ? 1 : -1) * (f.len / 2 - 1.5), 4.0, h, b.neon, b.n.length * 1.24 <= h ? b.n : null);
    }
  }
  // tetto: cisterna su gambe, macchine dell'aria, antenna, cartellone luminoso verso il viale
  const L = map_neon_frame(C, b.x + b.w * 0.28, H, b.z - b.d * 0.22, 0);
  L(g.cyl, M.wood, 0, 2.0, 0, 2.2, 2.0, 2.2); L(g.cone, M.rust, 0, 3.3, 0, 2.3, 0.6, 2.3);
  for (const y of [1.5, 2.5]) L(g.cyl, M.steel, 0, y, 0, 2.26, 0.06, 2.26);
  for (const a of [-0.7, 0.7]) for (const c of [-0.7, 0.7]) L(g.box, M.steel, a, 0.5, c, 0.1, 1.0, 0.1);
  for (let i = 0; i < 2; i++) { const ax = b.x - b.w * 0.25 + i * 2.2, az = b.z + b.d * 0.2; k.box(ax, H, az, 1.6, 1.1, 1.2, M.metal, nc); C.B.add(g.cyl, M.steel, ax, H + 1.13, az, 0, 0, 0, 0.9, 0.06, 0.9); }
  const mx = b.x - b.w * 0.4, mz = b.z - b.d * 0.35;
  k.box(mx, H, mz, 0.1, 5, 0.1, M.steel, nc); k.box(mx, H + 4, mz, 1.4, 0.05, 0.05, M.steel, nc); k.box(mx, H + 4.5, mz, 0.05, 0.05, 1.0, M.steel, nc); k.box(mx, H + 5, mz, 0.2, 0.2, 0.2, N.red, nc);
  const th = b.x < 0 ? HP : -HP, f = map_neon_face(th, x0, x1, z0, z1), pw = (b.n.length * 4 - 1) * 0.3 + 1.0;
  const W = (t, y, al, h, tk, off, mat) => map_neon_wb(C, th, f.x, f.z, t, y, al, h, tk, off, mat, false);
  W(0, H + 1.6, pw, 2.4, 0.2, -0.7, M.steel); for (const sg of [-1, 1]) W(sg * (pw / 2 - 0.3), H, 0.15, 4, 0.15, -0.9, M.steel);
  for (const y of [H + 1.6, H + 3.92]) W(0, y, pw, 0.08, 0.06, -0.58, b.neon);
  map_neon_text(C, th, f.x, f.z, 0, H + 2.8, b.n, 0.3, b.neon, -0.57);
}

// ---------- edifici entrabili: arredo stanza per stanza ----------
function map_neon_interior(C, b) {
  const k = C.kit, M = C.M, N = C.N, R = k.rng, fh = 3.4, hw = b.w / 2 - 0.5, hd = b.d / 2 - 0.5, cols = [M.red, M.blue, M.yellow, M.green, M.inner], K = b.kind;
  const F = (fl, lx, y, lz, w, h, d, mat) => k.box(b.x + lx, fl * fh + y, b.z + lz, w, h, d, mat, { collide: y + h <= 0.5, cast: false });
  const table = (fl, lx, lz, w, d, h) => { F(fl, lx, h - 0.06, lz, w, 0.06, d, M.wood); for (const a of [-1, 1]) for (const c of [-1, 1]) F(fl, lx + a * (w / 2 - 0.08), 0, lz + c * (d / 2 - 0.08), 0.07, h - 0.06, 0.07, M.steel); };
  const stool = (fl, lx, lz, mat) => { F(fl, lx, 0.42, lz, 0.38, 0.08, 0.38, mat); F(fl, lx, 0, lz, 0.1, 0.42, 0.1, M.steel); };
  const shelf = (fl, lx, lz, len, ax) => {
    for (let i = 0; i < 5; i++) F(fl, lx, i * 0.48, lz, ax ? len : 0.5, 0.05, ax ? 0.5 : len, M.steel);
    for (const e of [-1, 1]) F(fl, lx + (ax ? e * len / 2 : 0), 0, lz + (ax ? 0 : e * len / 2), ax ? 0.06 : 0.5, 2.0, ax ? 0.5 : 0.06, M.steel);
    for (let i = 0; i < 4; i++) for (let o = -len / 2 + 0.35; o < len / 2 - 0.2; o += 0.55) if (R() < 0.8) { const s = k.rand(0.22, 0.42); F(fl, lx + (ax ? o : 0), i * 0.48 + 0.05, lz + (ax ? 0 : o), ax ? s : 0.36, k.rand(0.15, 0.36), ax ? 0.36 : s, k.pick(cols)); }
  };
  const bed = (fl, lx, lz, y, mat) => { F(fl, lx, y, lz, 0.95, 0.3, 2.0, M.woodD); F(fl, lx, y + 0.3, lz, 0.9, 0.16, 1.94, M.inner); F(fl, lx, y + 0.46, lz + 0.25, 0.92, 0.05, 1.4, mat); F(fl, lx, y + 0.46, lz - 0.75, 0.6, 0.1, 0.35, M.inner); };
  const bunk = (fl, lx, lz, mat) => { bed(fl, lx, lz, 0, mat); bed(fl, lx, lz, 1.25, mat); for (const a of [-0.45, 0.45]) for (const c of [-0.97, 0.97]) F(fl, lx + a, 0, lz + c, 0.06, 1.9, 0.06, M.steel); };
  const sofa = (fl, lx, lz, mat, sg) => { F(fl, lx, 0, lz, 2.0, 0.42, 0.85, mat); F(fl, lx, 0.42, lz + sg * 0.33, 2.0, 0.45, 0.2, mat); for (const a of [-1, 1]) F(fl, lx + a * 0.93, 0.42, lz, 0.15, 0.2, 0.85, mat); };
  const counter = (fl, lx, lz, len, ax, mat) => { F(fl, lx, 0, lz, ax ? len : 0.7, 1.0, ax ? 0.7 : len, mat); F(fl, lx, 1.0, lz, ax ? len + 0.1 : 0.9, 0.06, ax ? 0.9 : len + 0.1, M.woodD); };
  const crates = (fl, n) => { for (let i = 0; i < n; i++) { const s = k.rand(0.6, 1.1), lx = k.rand(-hw + 1, hw - 1), lz = k.rand(-hd + 1, hd - 1); F(fl, lx, 0, lz, s, s, s, M.wood); F(fl, lx, s, lz, s + 0.05, 0.05, s + 0.05, M.woodD); if (R() < 0.4) F(fl, lx, s + 0.05, lz, s * 0.7, s * 0.7, s * 0.7, M.wood); } };
  const desk = (fl, lx, lz) => { table(fl, lx, lz, 1.4, 0.7, 0.74); F(fl, lx, 0.82, lz - 0.2, 0.5, 0.34, 0.04, N.coolDim); F(fl, lx, 0.74, lz - 0.2, 0.1, 0.08, 0.1, M.steel); F(fl, lx, 0.4, lz + 0.7, 0.45, 0.08, 0.45, M.rubber); F(fl, lx, 0.48, lz + 0.92, 0.45, 0.5, 0.06, M.rubber); F(fl, lx, 0, lz + 0.7, 0.1, 0.4, 0.1, M.steel); };
  for (let fl = 0; fl < b.fl; fl++) {
    for (const lx of [-5.5, 5.5]) for (const lz of [-hd / 2, hd / 2]) F(fl, lx, 3.0, lz, 2.4, 0.05, 0.2, N.warmDim);
    F(fl, -hw + 0.22, 1.3, hd * 0.55, 0.04, 1.0, 0.7, k.pick([N.pink, N.cyan, N.violet])); F(fl, hw - 0.22, 1.3, -hd * 0.55, 0.04, 0.8, 1.1, M.woodD);
  }
  if (K === 0) { // RAMEN: bancone + cucina · appartamento · magazzino
    counter(0, -1, -2.5, 9, true, M.wood); for (let i = 0; i < 8; i++) stool(0, -5 + i * 1.15, -1.6, M.red);
    F(0, -1, 0, -hd + 0.2, 7, 0.9, 0.7, M.metal); F(0, -1, 2.1, -hd + 0.3, 7, 0.45, 0.9, M.steel);
    for (let i = 0; i < 4; i++) F(0, -3.5 + i * 1.6, 0.9, -hd + 0.2, 0.4, 0.3, 0.4, M.metal);
    F(0, -1, 2.3, -2.5, 8, 0.6, 0.08, M.steel); map_neon_kanji(C, 0, b.x - 1, b.z - 2.5, 0, 2.6, 7, 0.07, N.yellow, 0.07);
    for (const lx of [-8, -3, 2, 7.5]) for (const lz of [2, 4.6]) { table(0, lx, lz, 1.3, 0.8, 0.74); stool(0, lx - 0.95, lz, M.red); stool(0, lx + 0.95, lz, M.red); F(0, lx, 0.74, lz, 0.25, 0.1, 0.25, M.line); }
    F(0, -hw + 0.3, 0, -4.2, 0.8, 1.9, 1.6, M.steel); F(0, -hw + 0.72, 0.3, -4.2, 0.04, 1.4, 1.3, N.coolDim);
    for (const lx of [-6, -2, 2, 6]) F(0, lx, 2.45, 0.6, 0.3, 0.4, 0.3, N.red);
    for (const lx of [-8.5, -6.8, 6.8, 8.5]) bed(1, lx, -hd + 1.2, 0, M.blue);
    table(1, 0, 2, 1.6, 1.0, 0.38); for (const a of [-1.2, 1.2]) F(1, a, 0, 2, 0.5, 0.08, 0.5, M.red); F(1, 0, 0, 2.8, 4, 0.02, 3.4, M.red);
    sofa(1, 0, 3.8, M.blue, -1); F(1, 0, 0, hd - 0.3, 1.6, 0.5, 0.4, M.woodD); F(1, 0, 0.6, hd - 0.2, 1.5, 0.85, 0.06, N.screen);
    F(1, -hw + 0.3, 0, 3, 0.7, 2.1, 2.0, M.woodD); shelf(1, hw - 0.2, 3, 3, false);
    crates(2, 12); shelf(2, -hw + 0.2, 0, 5, false); shelf(2, hw - 0.2, 0, 5, false);
  } else if (K === 1) { // ARCADE: file di cabinati · sala karaoke e biliardi
    const cab = (lx, lz, dir) => { F(0, lx, 0, lz, 0.75, 1.75, 0.8, M.steel); F(0, lx, 1.05, lz + dir * 0.41, 0.55, 0.45, 0.03, k.pick([N.coolDim, N.pink, N.cyan, N.violet])); F(0, lx, 1.58, lz + dir * 0.41, 0.7, 0.14, 0.03, k.pick([N.yellow, N.pink])); F(0, lx, 0.85, lz + dir * 0.5, 0.7, 0.07, 0.25, M.rubber); };
    for (let lx = -8.4; lx <= 8.4; lx += 1.2) { if (Math.abs(Math.abs(lx) - 6) > 1.3) { cab(lx, -hd + 0.3, 1); cab(lx, hd - 0.3, -1); } if (Math.abs(lx) < 4.5) { cab(lx, -0.45, -1); cab(lx, 0.45, 1); } }
    counter(0, hw - 0.9, 3.6, 3.2, false, M.blue);
    for (const lz of [-3.5, 3.5]) { F(0, -hw + 0.4, 0, lz, 0.9, 0.9, 0.9, M.red); F(0, -hw + 0.4, 0.9, lz, 0.9, 0.9, 0.9, M.glass); F(0, -hw + 0.4, 1.8, lz, 0.94, 0.2, 0.94, N.pink); }
    for (const lx of [-6, 0, 6]) { sofa(1, lx, 1.5, M.red, -1); table(1, lx, 3.2, 1.2, 0.6, 0.4); F(1, lx, 1.2, hd - 0.2, 2.2, 1.2, 0.06, N.screen); F(1, lx, 0, -3, 2.4, 0.75, 1.3, M.woodD); F(1, lx, 0.75, -3, 2.2, 0.05, 1.1, M.green); }
  } else if (K === 2) { // HOTEL A CAPSULE: reception · tre piani di capsule
    counter(0, 0, -4.5, 5, true, M.woodD); F(0, 0, 1.2, -hd + 0.1, 4, 1.2, 0.08, M.woodD); F(0, 0, 2.5, -hd + 0.12, 3, 0.08, 0.05, N.violet);
    for (const a of [-1, 1]) { sofa(0, a * 2.5, 3, M.blue, 1); F(0, a * (hw - 0.3), 0, -3.5, 0.6, 1.9, 4, M.metal); F(0, a * (hw - 0.62), 0.95, -3.5, 0.03, 0.04, 4, N.cyan); }
    table(0, 0, 1.6, 1.4, 0.7, 0.4);
    for (let fl = 1; fl < b.fl; fl++) for (let lx = -8.4; lx <= 8.5; lx += 1.3) for (const sg of [-1, 1]) for (let lev = 0; lev < 2; lev++) {
      F(fl, lx, lev * 1.15, sg * (hd - 1.1), 1.2, 1.1, 2.2, M.inner);
      F(fl, lx, lev * 1.15 + 0.15, sg * (hd - 2.22), 0.9, 0.8, 0.03, R() < 0.3 ? M.rubber : R() < 0.6 ? N.warmDim : N.coolDim);
    }
  } else if (K === 3) { // CLINICA: sala d'attesa e farmacia · uffici · sala server
    counter(0, 0, -3.5, 5, true, M.inner); F(0, 0, 1.6, -hd + 0.1, 0.3, 0.9, 0.05, N.green); F(0, 0, 1.9, -hd + 0.1, 0.9, 0.3, 0.05, N.green);
    for (let lx = -3; lx <= 3; lx += 0.75) for (const lz of [2.5, 4]) { F(0, lx, 0.4, lz, 0.5, 0.08, 0.5, M.blue); F(0, lx, 0.48, lz + 0.22, 0.5, 0.45, 0.06, M.blue); F(0, lx, 0, lz, 0.08, 0.4, 0.08, M.steel); }
    for (const a of [-1, 1]) for (const lz of [-3.5, 3.5]) shelf(0, a * (hw - 0.2), lz, 4, false);
    for (const lx of [-7, -3.5, 0, 3.5, 7]) for (const lz of [-3.5, 2.5]) desk(1, lx, lz);
    for (const a of [-1, 1]) for (const c of [-1, 1]) F(1, a * (hw - 0.2), 0, c * 5, 0.6, 1.3, 0.5, M.metal);
    for (let lx = -7; lx <= 7; lx += 1.0) for (const lz of [-3, 3]) { F(2, lx, 0, lz, 0.8, 2.0, 1.0, M.steel); for (let j = 0; j < 4; j++) F(2, lx, 0.3 + j * 0.4, lz + 0.51, 0.6, 0.04, 0.02, (j + Math.round(lx)) % 2 ? N.green : N.cyan); }
  } else if (K === 4) { // OFFICINA: auto sul ponte, banco attrezzi, gomme · camerata
    map_neon_car(C, b.x - 4, b.z, 0.05, M.carB, false, 1.1); map_neon_car(C, b.x + 4, b.z + 0.5, 3.0, M.carA, false, 0.001);
    for (const a of [-1.25, 1.25]) { F(0, -4 + a, 0, 0, 0.25, 2.5, 0.25, M.yellow); F(0, -4 + a * 0.5, 1.0, 0, 1.2, 0.1, 0.2, M.steel); }
    counter(0, 0, -hd + 0.3, 5, true, M.steel); F(0, 0, 1.3, -hd + 0.05, 4.5, 1.0, 0.05, M.woodD);
    for (let i = 0; i < 7; i++) F(0, -2 + i * 0.65, 1.45 + (i % 2) * 0.25, -hd + 0.1, 0.12, 0.45, 0.04, M.metal);
    for (const a of [-1, 1]) for (let j = 0; j < 4; j++) C.B.add(C.g.tor, M.rubber, b.x + a * (hw - 0.6), 0.12 + j * 0.22, b.z + hd - 0.7, map_neon_HP, 0, 0, 0.62, 0.62, 0.62);
    F(0, hw - 0.5, 0, -2.5, 0.7, 0.8, 1.2, M.red); F(0, -hw + 0.4, 0, 3, 0.6, 1.8, 2, M.metal);
    for (const lx of [-8, -5.5, 5.5, 8]) bunk(1, lx, -hd + 1.2, M.green);
    table(1, 0, 2.5, 2, 0.9, 0.74); for (const a of [-1, 1]) { stool(1, a * 0.6, 3.4, M.steel); F(1, a * (hw - 0.2), 0, 3, 0.6, 1.9, 2.4, M.metal); }
  } else if (K === 5) { // KONBINI: corsie di scaffali, frigoriferi, cassa · magazzino
    for (const lx of [-3, 0, 3]) for (const lz of [-2.9, 2.9]) shelf(0, lx, lz, 3.4, false);
    F(0, 0, 0, -hd + 0.2, 8, 2.0, 0.6, M.metal); for (let i = 0; i < 6; i++) F(0, -3.33 + i * 1.33, 0.25, -hd + 0.52, 1.2, 1.6, 0.03, N.coolDim);
    counter(0, hw - 0.9, 3.4, 3, false, M.inner); F(0, hw - 0.9, 1.06, 3.4, 0.4, 0.3, 0.4, M.steel); shelf(0, -hw + 0.2, 3.4, 3, false);
    crates(1, 14); shelf(1, -hw + 0.2, 0, 5, false); shelf(1, hw - 0.2, 0, 5, false);
  } else if (K === 6) { // DEPOSITO: scaffalature da pallet, muletto · ufficio e brande
    for (const lz of [-2.6, 2.6]) {
      for (const a of [-4.5, 0, 4.5]) F(0, a, 0, lz, 0.1, 3.0, 1.1, M.steel);
      for (const y of [1.2, 2.3]) F(0, 0, y, lz, 9, 0.08, 1.1, M.steel);
      for (let lx = -3.9; lx <= 4; lx += 1.3) for (const y of [0, 1.28, 2.38]) if (R() < 0.8) { const s = k.rand(0.6, 0.95); F(0, lx, y, lz, s, s * 0.9, s, k.pick([M.wood, M.wood, M.blue, M.yellow])); }
    }
    const fx = 7.5, fz = 2;
    F(0, fx, 0.25, fz, 1.1, 0.8, 1.7, M.yellow); F(0, fx, 0.25, fz + 0.95, 1.1, 0.9, 0.3, M.steel); F(0, fx, 1.05, fz + 0.3, 0.5, 0.12, 0.5, M.rubber); F(0, fx, 2.15, fz, 1.1, 0.06, 1.3, M.steel); F(0, fx, 0.2, fz - 1.6, 0.9, 0.8, 0.9, M.wood);
    for (const a of [-1, 1]) {
      for (const c of [-0.6, 0.6]) { F(0, fx + a * 0.5, 1.05, fz + c, 0.06, 1.1, 0.06, M.steel); F(0, fx + a * 0.55, 0, fz + c, 0.2, 0.5, 0.5, M.rubber); }
      F(0, fx + a * 0.35, 0.1, fz - 0.95, 0.1, 2.4, 0.12, M.steel); F(0, fx + a * 0.25, 0.12, fz - 1.55, 0.12, 0.06, 1.1, M.steel);
    }
    for (const lx of [-8, -5.5]) bunk(1, lx, -hd + 1.2, M.red); desk(1, 5, -2); desk(1, 7.5, -2); crates(1, 5);
  } else { // IZAKAYA: bancone con bottiglie · salette tatami · brande
    counter(0, 0, -2.8, 8, true, M.woodD); for (let i = 0; i < 7; i++) stool(0, -3.6 + i * 1.2, -1.9, M.red);
    for (let j = 0; j < 3; j++) {
      F(0, 0, 1.1 + j * 0.45, -hd + 0.15, 7, 0.05, 0.3, M.woodD); F(0, 0, 1.05 + j * 0.45, -hd + 0.28, 7, 0.03, 0.03, N.pink);
      for (let lx = -3.3; lx <= 3.3; lx += 0.3) if (R() < 0.75) F(0, lx, 1.15 + j * 0.45, -hd + 0.15, 0.09, 0.28, 0.09, k.pick([M.green, M.yellow, M.red, M.glass]));
    }
    for (const lx of [-7, -2.5, 2.5, 7]) { table(0, lx, 2.6, 1.2, 0.8, 0.74); stool(0, lx - 0.9, 2.6, M.woodD); stool(0, lx + 0.9, 2.6, M.woodD); F(0, lx, 2.45, 2.6, 0.3, 0.4, 0.3, N.red); }
    for (const a of [-1, 1]) {
      F(1, a * 5, 0, 0, 7, 0.25, 8, M.floorW); table(1, a * 5, 0, 1.6, 1.0, 0.6); for (const c of [-1, 1]) F(1, a * 5 + c * 1.2, 0.25, 0, 0.5, 0.08, 0.5, M.red);
      F(1, a * 1.4, 0, 0, 0.06, 2.0, 6, M.inner); F(1, a * 1.4, 2.0, 0, 0.1, 0.08, 6.1, M.woodD);
    }
    for (const lx of [-8, -5.5, 5.5, 8]) bunk(2, lx, -hd + 1.2, M.blue); crates(2, 6);
  }
}

// ---------- isolato: marciapiede con cordolo, edificio, cortile, baracche (ovest) o bancarelle (est) ----------
function map_neon_yard(C, b, skip) {
  const k = C.kit, M = C.M, N = C.N, R = k.rng, Y = 0.15, x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
  for (const th of [0, map_neon_PI, map_neon_HP, -map_neon_HP]) {
    if (skip.includes(th)) continue;
    const f = map_neon_face(th, x0, x1, z0, z1), long = Math.abs(Math.cos(th)) > 0.5, doors = long ? [-6, 6] : [0], s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th));
    for (let t = -f.len / 2 + 1.4; t <= f.len / 2 - 1.2; t += 2.6) {
      if (doors.some(d => Math.abs(t - d) < 2.3)) continue;
      const r = R(), px = f.x + c * t + s * 0.9, pz = f.z - s * t + c * 0.9;
      if (r < 0.2) map_neon_vend(C, th, f.x, f.z, t, Y, k.pick([M.red, M.blue, M.steel]), k.pick([N.pink, N.cyan, N.yellow]));
      else if (r < 0.32) { map_neon_crate(C, px, Y, pz, 1.0, k.rand(-0.2, 0.2), M.wood); if (R() < 0.6) map_neon_crate(C, px, Y + 1.05, pz, 0.7, k.rand(-0.4, 0.4), M.wood); }
      else if (r < 0.44) { map_neon_barrel(C, px, Y, pz, k.pick([M.blue, M.rust, M.yellow])); map_neon_barrel(C, px + c * 0.75, Y, pz - s * 0.75, M.rust); }
      else if (r < 0.54) map_neon_dumpster(C, px, pz, th + k.rand(-0.06, 0.06), Y);
      else if (r < 0.64) map_neon_bench(C, th, px, pz, Y);
      else if (r < 0.72) map_neon_scooter(C, px + s * 0.3, pz + c * 0.3, th + map_neon_HP + k.rand(-0.3, 0.3), k.pick([M.red, M.blue, M.yellow]), Y);
      else if (r < 0.82) {
        k.box(px, Y, pz, s ? 0.7 : 1.3, 0.5, s ? 1.3 : 0.7, M.conc);
        for (let j = 0; j < 3; j++) C.I.bush.push(map_neon_mtx(C, px + k.rand(-0.25, 0.25), Y + 0.72, pz + k.rand(-0.25, 0.25), k.rand(0, 6), k.rand(0.5, 0.8), k.rand(0.45, 0.7), k.rand(0.5, 0.8)));
      } else if (r < 0.9) map_neon_bin(C, px, pz, Y);
    }
  }
}
function map_neon_shack(C, xa, xb, za, zb, H, mat) {
  const k = C.kit, M = C.M, N = C.N, HP = map_neon_HP, cx = (xa + xb) / 2, cz = (za + zb) / 2, len = zb - za, nc = { collide: false, cast: false };
  k.box(cx, 0, cz, xb - xa, H, len, mat);
  map_neon_facade(C, -HP, xa, cz, len, H);
  if (H > 10) map_neon_fire(C, -HP, xa, cz, k.rand(-1.5, 1.5), 2, 4.1, 3.4);
  const W = (t, y, al, h, tk, off, m2) => map_neon_wb(C, HP, xb, cz, t, y, al, h, tk, off, m2, false);
  W(-len / 2 + 0.6, 0, 0.1, H, 0.1, 0.07, M.rust); W(len / 2 - 0.9, 0.3, 0.09, H - 0.6, 0.09, 0.06, M.metal); W(0, 2.6, len - 2, 0.07, 0.07, 0.05, M.rust);
  map_neon_ac(C, HP, xb, cz, k.rand(-2, 2), 2.9); W(k.rand(-3, 3), 3.9, 1.6, 0.08, 0.05, 0.04, k.pick([N.pink, N.cyan, N.violet]));
  C.B.add(C.g.box, M.corr, cx, H + 0.3, cz, 0, 0, 0.09, xb - xa + 0.7, 0.06, len + 0.5);
  C.B.add(C.g.cyl, M.rust, cx + 0.6, H + 1.1, cz + len * 0.25, 0, 0, 0, 1.3, 1.5, 1.3);
  k.box(cx - 1.2, H, cz - len * 0.3, 0.08, 3.2, 0.08, M.steel, nc); k.box(cx - 1.2, H + 2.6, cz - len * 0.3, 1.2, 0.05, 0.05, M.steel, nc);
}
function map_neon_block(C, b) {
  const k = C.kit, M = C.M, N = C.N, PI = map_neon_PI, HP = map_neon_HP, nc = { collide: false, cast: false };
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, cx = (b.X0 + b.X1) / 2, bw = b.X1 - b.X0;
  k.box(cx, 0, (b.Z0 + z0) / 2, bw, 0.15, z0 - b.Z0, M.walk); k.box(cx, 0, (z1 + b.Z1) / 2, bw, 0.15, b.Z1 - z1, M.walk);
  k.box((b.X0 + x0) / 2, 0, b.z, x0 - b.X0, 0.15, b.d, M.walk); k.box((x1 + b.X1) / 2, 0, b.z, b.X1 - x1, 0.15, b.d, M.walk);
  for (const z of [b.Z0 + 0.14, b.Z1 - 0.14]) k.box(cx, 0, z, bw, 0.18, 0.28, M.curb, nc);
  for (const x of [b.X0 + 0.14, b.X1 - 0.14]) k.box(x, 0, (b.Z0 + b.Z1) / 2, 0.28, 0.18, b.Z1 - b.Z0, M.curb, nc);
  k.building({
    x: b.x, z: b.z, w: b.w, d: b.d, floors: b.fl, floorH: 3.4, wall: 0.3, mat: b.wall, innerMat: M.inner, floorMat: b.kind === 4 || b.kind === 6 ? M.conc : M.floorW,
    doors: [{ side: 'n', at: -6, width: 1.8 }, { side: 'n', at: 6, width: 1.8 }, { side: 's', at: -6, width: 1.8 }, { side: 's', at: 6, width: 1.8 }, { side: 'e', at: 0, width: 1.8 }, { side: 'w', at: 0, width: 1.8 }],
    windows: true, roof: 'parapet', ruined: 0, rotY: 0
  });
  map_neon_dress(C, b); map_neon_interior(C, b);
  const west = b.x < 0, inner = Math.abs(b.z) < 30, toC = b.z > 0 ? -1 : 1, skip = [west ? -HP : HP];
  if (!inner) skip.push(b.z > 0 ? 0 : PI);
  map_neon_yard(C, b, skip);
  const xb = west ? -10.6 : 10.6;
  for (const dz of inner ? [-5.5, 5.5] : [toC * 5]) { k.box(xb, 0.15, b.z + dz, 2, 0.45, 2, M.conc); k.box(xb, 0.6, b.z + dz, 1.7, 0.03, 1.7, M.dirt, nc); map_neon_tree(C, xb, b.z + dz, k.rand(0.9, 1.15), 0.6); }
  map_neon_lamp(C, west ? -7.9 : 7.9, b.z, west ? HP : -HP, 0.15);
  if (inner || b.z < 0) map_neon_lamp(C, b.x + 3, b.Z1 - 0.8, 0, 0.15);
  if (inner || b.z > 0) map_neon_lamp(C, b.x - 3, b.Z0 + 0.8, PI, 0.15);
  for (let z = b.Z0 + 1.5; z <= b.Z1 - 1.5; z += 3) { const x = west ? -7.45 : 7.45; C.I.bollard.push(map_neon_mtx(C, x, 0.55, z, 0, 0.18, 0.8, 0.18)); C.I.cap.push(map_neon_mtx(C, x, 0.9, z, 0, 0.2, 0.06, 0.2)); }
  if (west) {
    for (const zz of [[b.Z0 + 0.4, b.z - 1.4], [b.z + 1.4, b.Z1 - 0.4]]) map_neon_shack(C, -42, -37.2, zz[0], zz[1], k.pick([7.4, 10.8, 10.8]), k.pick([M.wBrick, M.corr, M.wMauve]));
  } else {
    const cl = [M.red, M.blue, M.yellow], nn = [N.pink, N.cyan, N.yellow, N.violet];
    for (const dz of inner ? [-8.5, -3, 3.5, 8.5] : [-6, 0, 6]) map_neon_stall(C, 39.6, b.z + dz, HP, k.pick(cl), k.pick(nn), 0.15);
    for (const dz of [-6, 5]) map_neon_stall(C, 49.3, b.z + dz, -HP, k.pick(cl), k.pick(nn), 0);
  }
}

// ---------- metropolitana sopraelevata: viadotto calpestabile, scale, pensiline, treni, maxischermo e torre a portale ----------
function map_neon_train(C, x0, z, col) {
  const k = C.kit, M = C.M, N = C.N, nc = { collide: false, cast: false };
  for (let c = 0; c < 2; c++) {
    const x = x0 + c * 12.5, lt = c ? N.red : N.cool;
    k.box(x, 6.75, z, 12, 2.5, 2.7, M.metal); k.box(x, 9.25, z, 11.4, 0.22, 2.2, M.steel, nc); k.box(x, 9.47, z, 3, 0.3, 1.4, M.steel, nc); k.box(x, 9.5, z, 0.06, 0.7, 1.6, M.steel, nc);
    for (const a of [-4, 4]) k.box(x + a, 6.48, z, 2.6, 0.3, 2.2, M.steel, nc);
    for (const sg of [-1, 1]) {
      k.box(x, 7.85, z + sg * 1.36, 11, 0.85, 0.04, N.coolDim, nc); k.box(x, 7.3, z + sg * 1.36, 12, 0.12, 0.05, col, nc); k.box(x, 6.9, z + sg * 1.36, 12, 0.3, 0.04, M.steel, nc);
      for (const a of [-3.7, 0, 3.7]) { k.box(x + a, 6.8, z + sg * 1.37, 1.3, 2.05, 0.05, M.steel, nc); k.box(x + a, 7.9, z + sg * 1.39, 0.9, 0.7, 0.03, N.coolDim, nc); }
      k.box(x + sg * 6.01, 7.9, z, 0.04, 0.8, 1.9, M.glass, nc); for (const o of [-0.9, 0.9]) k.box(x + sg * 6.02, 7.0, z + o, 0.04, 0.16, 0.3, lt, nc);
    }
  }
}
function map_neon_metro(C) {
  const k = C.kit, M = C.M, N = C.N, g = C.g, B = C.B, PI = map_neon_PI, nc = { collide: false, cast: false };
  k.box(0, 5.8, 0, 140, 0.6, 7, M.conc);
  for (const z of [-2.3, 2.3]) k.box(0, 5.1, z, 140, 0.7, 0.5, M.steel, nc);
  for (const z of [-2.45, -1.05, 1.05, 2.45]) k.box(0, 6.4, z, 140, 0.1, 0.08, M.metal, nc);
  for (let x = -52; x <= 53; x += 1.2) for (const z of [-1.75, 1.75]) C.I.sleeper.push(map_neon_mtx(C, x, 6.43, z, 0, 0.26, 0.06, 2.1));
  const piers = [-39.5, -29, -18.5, -8.5, 8.5, 18.5, 28.5, 38.5];
  piers.forEach((x, i) => {
    k.box(x, 0, 0, 1.9, 0.5, 2.3, M.conc); k.box(x, 0.5, 0, 1.3, 4.5, 1.6, M.conc); k.box(x, 5.0, 0, 1.7, 0.8, 6.8, M.conc, nc); k.box(x, 0.9, 0, 1.36, 0.5, 1.66, M.yellow, nc);
    for (const z of [-0.82, 0.82]) k.box(x, 1.7, z, 0.12, 2.8, 0.05, i % 2 ? N.pink : N.cyan, nc);
    if (i < piers.length - 1 && i !== 3) { const xm = (x + piers[i + 1]) / 2, len = piers[i + 1] - x - 2.4; for (const z of [-1.1, 1.1]) k.box(xm, 5.0, z, len, 0.06, 0.08, i % 2 ? N.violet : N.cyan, nc); }
    B.add(g.cyl6, M.rust, x - 0.72, 2.75, 0.5, 0, 0, 0, 0.12, 5.5, 0.12);
  });
  for (const sg of [-1, 1]) for (const seg of [[-52.5, -21], [-18.5, 18.5], [21, 53.5]]) {
    const xc = (seg[0] + seg[1]) / 2, len = seg[1] - seg[0];
    k.box(xc, 6.4, sg * 3.38, len, 1.0, 0.24, M.conc); k.box(xc, 7.4, sg * 3.38, len, 0.06, 0.34, M.steel, nc); k.box(xc, 6.0, sg * 3.53, len, 0.1, 0.05, sg > 0 ? N.pink : N.cyan, nc);
  }
  for (const sg of [-1, 1]) for (const sx of [-1, 1]) { // quattro scale a gradini pieni (salgono verso il centro)
    const z = sg * 4.5, xs = sx * 30;
    for (let i = 0; i < 20; i++) k.box(xs - sx * (i + 0.5) * 0.45, 0, z, 0.45, (i + 1) * 0.32, 1.8, M.conc);
    k.box(sx * 19.75, 6.1, sg * 4.45, 2.5, 0.3, 1.9, M.conc); k.box(sx * 19.75, 0, sg * 5.0, 0.3, 6.1, 0.3, M.steel);
    k.box(sx * 19.75, 6.4, sg * 5.34, 2.5, 1.0, 0.1, M.steel); k.box(sx * 18.55, 6.4, sg * 4.45, 0.1, 1.0, 1.9, M.steel);
    B.add(g.box, M.steel, sx * 25.5, 4.2, sg * 5.36, 0, 0, -sx * Math.atan2(6.4, 9), 11.05, 0.06, 0.06);
    k.nav(xs + sx * 1.2, 0, z); k.nav(sx * 25.5, 3.2, z); k.nav(sx * 19.75, 6.4, sg * 4.4); k.nav(sx * 19.75, 6.4, sg * 1.6);
  }
  for (const sx of [-1, 1]) { // pensiline di stazione
    const cx = sx * 13.5;
    k.box(cx, 9.3, 0, 8.6, 0.14, 7.6, M.corr, nc); k.box(cx, 9.1, 0, 8.6, 0.2, 0.3, M.steel, nc);
    for (const a of [-3.9, 3.9]) for (const z of [-3.1, 3.1]) k.box(cx + a, 6.4, z, 0.16, 2.9, 0.16, M.steel, nc);
    for (const z of [-3.7, 3.7]) k.box(cx, 9.16, z, 8.4, 0.06, 0.06, sx > 0 ? N.cyan : N.pink, nc);
    k.box(cx, 6.4, 0, 2.4, 0.45, 0.5, M.wood); k.box(cx, 6.85, 0, 2.4, 0.5, 0.08, M.wood, nc);
    k.box(cx + sx * 3, 8.3, 0, 3.4, 0.7, 0.12, M.steel, nc);
    map_neon_text(C, 0, cx + sx * 3, 0.06, 0, 8.65, 'METRO', 0.1, N.yellow, 0.03); map_neon_text(C, PI, cx + sx * 3, -0.06, 0, 8.65, 'METRO', 0.1, N.yellow, 0.03);
  }
  for (const sx of [-1, 1]) { // torre a portale: il "punto eroe" al centro della mappa
    for (const z of [-3.0, 3.0]) k.box(sx * 8.5, 6.4, z, 0.6, 24, 0.6, M.steel);
    for (let y = 16.6; y < 29; y += 4) { k.box(sx * 8.5, y, 0, 0.2, 0.2, 6.2, sx > 0 ? N.violet : N.cyan, nc); for (const d of [-1, 1]) B.add(g.box, M.steel, sx * 8.5, y + 2, 0, d * 0.588, 0, 0, 0.12, 0.12, 7.0); }
    k.box(sx * 8.5, 30.4, 0, 1.0, 0.5, 7.0, M.steel, nc); k.box(sx * 8.5, 30.9, 0, 0.12, 5, 0.12, M.steel, nc); k.box(sx * 8.5, 35.9, 0, 0.3, 0.3, 0.3, N.red, nc);
  }
  for (const y of [16.2, 30.0]) for (const z of [-3.0, 3.0]) k.box(0, y, z, 17.6, 0.4, 0.4, M.steel, nc);
  B.add(g.halo, N.cyan, 0, 32.6, 0, map_neon_HP, 0, 0); B.add(g.halo, N.pink, 0, 34.2, 0, map_neon_HP, 0, 0, 0.7, 0.7, 0.7);
  k.mesh(new C.T.CylinderGeometry(6.4, 4.4, 6, 24, 1, true), C.H1, { x: 0, y: 35, z: 0 }, { collide: false });
  for (const sc of [[0, 3.45], [PI, -3.45]]) { // due maxischermi, uno per lato del viale
    const th = sc[0], zs = sc[1], sg = zs > 0 ? 1 : -1, z = zs + sg * 0.15;
    k.box(0, 9.2, zs, 15.6, 7.0, 0.3, M.steel, nc); k.box(0, 9.4, zs + sg * 0.17, 15.2, 6.6, 0.04, N.screen, nc);
    k.box(0, 9.3, zs + sg * 0.2, 15.2, 0.1, 0.04, N.pink, nc); k.box(0, 16.0, zs + sg * 0.2, 15.2, 0.1, 0.04, N.cyan, nc);
    map_neon_sprite(C, th, 0, z, -4.4, 13.2, sg > 0 ? map_neon_SPR.invader : map_neon_SPR.bowl, 0.42, N.pink, 0.1);
    map_neon_kanji(C, th, 0, z, 3.4, 13.4, 3, 0.36, N.yellow, 0.1);
    map_neon_text(C, th, 0, z, 0, 10.4, sg > 0 ? 'RAMEN BAR PIZZA' : 'SUSHI HOTEL TAXI', 0.2, N.cyan, 0.1);
  }
  map_neon_train(C, -45.5, -1.75, N.pink); map_neon_train(C, 33, 1.75, N.cyan);
  for (let x = -48; x <= 48; x += 8) k.nav(x, 6.4, x <= 0 ? 1.6 : -1.6);
}

// ---------- strade: segnaletica consumata, strisce, pozzanghere, macchie, crepe, tombini ----------
const map_neon_LANES = [[-6, 6, -56, 56], [-49.5, -42.5, -56, 56], [41.5, 50.5, -56, 56], [-42, 41, 31, 37], [-42, 41, -37, -31], [-48, 49, -5, 5]];
function map_neon_roads(C) {
  const k = C.kit, M = C.M, nc = { collide: false, cast: false }, LN = map_neon_LANES;
  const line = (x, z, w, d, mat) => k.box(x, 0, z, w, 0.012, d, mat || M.line, nc);
  const cross = z => Math.abs(z) < 9 || Math.abs(Math.abs(z) - 34) < 6;
  for (let z = -56; z <= 56; z += 4) if (!cross(z)) { line(-0.25, z, 0.14, 2.4, M.lineY); line(0.25, z, 0.14, 2.4, M.lineY); line(-46, z, 0.12, 1.6); }
  for (let x = -40; x <= 39; x += 4) if (Math.abs(x) > 9) { for (const z of [-34, 34]) line(x, z, 2.2, 0.14); for (const z of [-5.6, 5.6]) line(x, z, 2.6, 0.12, M.lineY); }
  const zebra = (x, z, ax, n) => { for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 1.0; if (ax) line(x + o, z, 0.55, 3.2); else line(x, z + o, 3.2, 0.55); } };
  for (const z of [-8.2, 8.2, -28, 28, -40, 40]) zebra(0, z, true, 13);
  for (const x of [-11, 11]) { zebra(x, 0, false, 11); zebra(x, -34, false, 7); zebra(x, 34, false, 7); }
  for (const x of [-46, 46]) for (const z of [-8.2, 8.2, -28.5, 28.5, -39.5, 39.5]) zebra(x, z, true, x < 0 ? 7 : 9);
  for (const z of [-47, -18, 18, 47]) k.decal(46, z, 10, 18, 0, M.walk);
  for (let i = 0; i < 24; i++) { const l = LN[i % 6]; k.decal(k.rand(l[0], l[1]), k.rand(l[2], l[3]), k.rand(1.6, 4.2), k.rand(1.2, 3.2), k.rand(0, 3.14), M.puddle); }
  for (let i = 0; i < 14; i++) { const l = LN[i % 6]; k.decal(k.rand(l[0], l[1]), k.rand(l[2], l[3]), k.rand(1, 2.6), k.rand(0.8, 2), k.rand(0, 3.14), M.stain); }
  for (let i = 0; i < 12; i++) { const l = LN[i % 6]; k.decal(k.rand(l[0], l[1]), k.rand(l[2], l[3]), k.rand(3, 7), 0.12, k.rand(0, 3.14), M.stain); }
  for (let i = 0; i < 20; i++) { const l = LN[i % 6]; C.B.add(C.g.cyl, M.steel, k.rand(l[0], l[1]), 0.012, k.rand(l[2], l[3]), 0, 0, 0, 0.9, 0.024, 0.9); }
}

// ---------- costruzione completa ----------
function map_neon_build(kit) {
  const C = map_neon_ctx(kit), k = kit, M = C.M, N = C.N, g = C.g, B = C.B, I = C.I, PI = map_neon_PI, HP = map_neon_HP, nc = { collide: false, cast: false };
  k.ground(M.asph);
  map_neon_roads(C);

  // bordi invalicabili: skyline di grattacieli, due palazzi-galleria per la metro, due torri-schermo in fondo al viale
  const zn = [-70, -54, -38, -24, -10], zp = [10, 24, 38, 54, 70];
  for (const arr of [zn, zp]) for (let i = 0; i < 4; i++) {
    map_neon_tower(C, -70, -50, arr[i], arr[i + 1], k.rand(44, 78), HP);
    map_neon_tower(C, 51, 70, arr[i], arr[i + 1], k.rand(44, 78), -HP);
  }
  map_neon_portal(C, -1, 58); map_neon_portal(C, 1, 64);
  const xs = [-50, -32, -12, 12, 30, 51];
  for (let i = 0; i < 5; i++) {
    map_neon_tower(C, xs[i], xs[i + 1], -70, -58, i === 2 ? 96 : k.rand(44, 72), 0, i === 2 ? { hero: 'FRANCY', hp: 14.4 } : null);
    map_neon_tower(C, xs[i], xs[i + 1], 58, 70, i === 2 ? 84 : k.rand(44, 72), PI, i === 2 ? { hero: 'NEON', hp: 14.4 } : null);
  }

  // otto isolati con edificio entrabile e arredato
  const BL = [
    { n: 'RAMEN', x: -24.5, z: 18, w: 20, d: 14, fl: 3, X0: -42, X1: -7, Z0: 6, Z1: 30, wall: M.wTeal, neon: N.pink, awn: M.red, kind: 0 },
    { n: 'ARCADE', x: 24, z: 18, w: 20, d: 14, fl: 2, X0: 7, X1: 41, Z0: 6, Z1: 30, wall: M.wBlue, neon: N.cyan, awn: M.blue, kind: 1 },
    { n: 'HOTEL', x: -24.5, z: -18, w: 20, d: 14, fl: 4, X0: -42, X1: -7, Z0: -30, Z1: -6, wall: M.wMauve, neon: N.violet, awn: M.blue, kind: 2 },
    { n: 'CLINICA', x: 24, z: -18, w: 20, d: 14, fl: 3, X0: 7, X1: 41, Z0: -30, Z1: -6, wall: M.conc, neon: N.green, awn: M.green, kind: 3 },
    { n: 'OFFICINA', x: -24.5, z: 48, w: 20, d: 12, fl: 2, X0: -42, X1: -7, Z0: 38, Z1: 58, wall: M.wBrick, neon: N.yellow, awn: M.yellow, kind: 4 },
    { n: 'KONBINI', x: 24, z: 48, w: 20, d: 12, fl: 2, X0: 7, X1: 41, Z0: 38, Z1: 58, wall: M.wMauve, neon: N.cyan, awn: M.blue, kind: 5 },
    { n: 'DEPOSITO', x: -24.5, z: -48, w: 20, d: 12, fl: 2, X0: -42, X1: -7, Z0: -58, Z1: -38, wall: M.wBlue, neon: N.yellow, awn: M.yellow, kind: 6 },
    { n: 'IZAKAYA', x: 24, z: -48, w: 20, d: 12, fl: 3, X0: 7, X1: 41, Z0: -58, Z1: -38, wall: M.wBrick, neon: N.pink, awn: M.red, kind: 7 }
  ];
  BL.forEach(b => map_neon_block(C, b));
  map_neon_metro(C);

  // ologrammi pubblicitari sopra la sala giochi e l'hotel (croce di pixel semitrasparenti + cono di luce)
  for (const h of [[24, 18, 6.8, map_neon_SPR.invader, C.H1, 0.8], [-24.5, -18, 13.6, map_neon_SPR.heart, C.H2, 0.9]]) {
    k.mesh(new C.T.CylinderGeometry(3.4, 0.25, 7, 16, 1, true), h[4], { x: h[0], y: h[2] + 4.5, z: h[1] }, { collide: false });
    k.box(h[0], h[2], h[1], 0.8, 1.0, 0.8, M.steel, nc);
    map_neon_sprite(C, 0, h[0], h[1], 0, h[2] + 11.5, h[3], h[5], h[4], 0); map_neon_sprite(C, HP, h[0], h[1], 0, h[2] + 11.5, h[3], h[5], h[4], 0);
  }

  // VIALE: aiuole spartitraffico con ciliegi e pannelli olografici, auto, taxi, furgoni, barriere
  [-51, -44.5, -23, -14.5, 14.5, 23, 44.5, 51].forEach((z, i) => {
    k.box(0, 0, z, 1.8, 0.45, 5, M.conc); k.box(0, 0.45, z, 1.5, 0.04, 4.7, M.dirt, nc);
    for (let j = 0; j < 5; j++) I.bush.push(map_neon_mtx(C, k.rand(-0.4, 0.4), 0.7, z + k.rand(-2.1, 2.1), k.rand(0, 6), k.rand(0.6, 1.0), k.rand(0.5, 0.8), k.rand(0.6, 1.0)));
    if (i % 2) { map_neon_tree(C, 0, z, 1.1, 0.45); return; }
    const word = k.pick(map_neon_WORDS.filter(w => w.length <= 5)), hm = i % 4 ? C.H2 : C.H1, nm = i % 4 ? N.yellow : N.pink;
    k.box(0, 0.45, z, 0.5, 0.5, 0.5, M.steel, nc); k.box(0, 1.2, z, 2.6, 3.8, 0.04, hm, nc);
    for (const fc of [[0, 0.05], [PI, -0.05]]) {
      map_neon_text(C, fc[0], 0, z + fc[1], 0, 4.2, word, 0.1, nm, 0.02);
      map_neon_sprite(C, fc[0], 0, z + fc[1], 0, 2.6, k.pick([map_neon_SPR.heart, map_neon_SPR.fish, map_neon_SPR.bowl]), 0.2, nm, 0.02);
    }
  });
  const paint = [M.carA, M.carB, M.metal, M.taxi];
  [[-5.6, -47, 0, 0], [5.6, -50, 3.14, 1], [-5.6, -20, 0.04, 2], [5.6, -13, 3.1, 0], [5.5, 20, 3.14, 1], [-5.6, 13, 0, 2], [-5.6, 47, 0.03, 1], [5.6, 50, 3.14, 0], [-2.6, 33, 0.5, 3], [2.8, -33.4, 3.6, 3],
    [-30, 32, 1.57, 0], [-17, 36, -1.6, 2], [20, 32.2, 1.57, 1], [31, 36, -1.55, 0], [-28, -36, 1.57, 2], [-15, -32, -1.57, 1], [18, -36, 1.6, 0], [30, -32.2, -1.57, 2],
    [-35.5, 3.3, 1.57, 3], [35.5, -3.3, -1.57, 3], [-13.5, -3.4, 1.6, 1], [13.5, 3.4, -1.6, 0]].forEach(c => map_neon_car(C, c[0], c[1], c[2], paint[c[3]], c[3] === 3));
  [[4.6, -41.5, 3.14], [-4.6, 41.5, 0], [44, 33.8, 1.57], [-45.5, -34, 1.5]].forEach(v => map_neon_van(C, v[0], v[1], v[2], k.pick([M.inner, M.blue, M.red]), k.pick([N.pink, N.cyan, N.yellow])));
  [[-3.4, 10.8, 1.57], [-0.9, 10.9, 1.62], [3.4, -10.8, 1.57], [0.9, -10.9, 1.5], [3.6, 38.8, 1.57], [-3.6, -38.8, 1.57], [-12, 34, 0.1], [12, -34, -0.1], [-24, 33.2, 1.5], [24, -33.2, 1.6],
    [-36, 35.5, 1.57], [36, -35.5, 1.57], [-46, 30.5, 1.5], [46, -30.5, 1.6], [-44, -9, 1.57], [44, 9, 1.57]].forEach(j => map_neon_jersey(C, j[0], j[1], j[2]));
  [[-3.6, 27.3, 0, 5, 3], [3.6, -27.3, 0, 5, 3], [-46.5, 1.5, 0.2, 5, 3], [46, -1.5, -0.2, 5, 3], [-20, -34.5, 1.57, 4, 2], [20, 34.5, 1.57, 4, 2]].forEach(s => map_neon_sandbags(C, s[0], s[1], s[2], s[3], s[4]));
  [[10.5, 50.5, false, M.blue, 0.15], [-10.5, 50.5, false, M.green, 0.15], [10.5, -50.5, false, M.red, 0.15], [-10.5, -50.5, false, M.yellow, 0.15], [-23, 31.4, true, M.blue, 0], [23, -31.4, true, M.red, 0],
    [-48.6, 46, false, M.green, 0], [-48.6, -46, false, M.yellow, 0]].forEach(c => map_neon_container(C, c[0], c[1], c[2], c[3], c[4]));
  map_neon_traffic(C, -7.6, 6.6, HP); map_neon_traffic(C, 7.6, -6.6, -HP); map_neon_traffic(C, -7.6, -29.4, HP); map_neon_traffic(C, 7.6, 29.4, -HP);

  // VICOLI (ovest): cassonetti, casse, barili, pallet, scooter a lati alterni; pali di legno con cavi
  let ai = 0;
  for (let z = -53; z <= 53; z += 6.5) {
    if (Math.abs(z) < 8 || Math.abs(Math.abs(z) - 34) < 5 || Math.abs(Math.abs(z) - 46) < 4.5) continue;
    const x = ai % 2 ? -43.4 : -48.8, kind = ai++ % 5;
    if (kind === 0) map_neon_dumpster(C, x, z, HP + k.rand(-0.08, 0.08), 0);
    else if (kind === 1) { map_neon_crate(C, x, 0, z, 1.1, k.rand(-0.2, 0.2), M.wood); map_neon_crate(C, x, 1.15, z, 0.8, k.rand(-0.4, 0.4), M.wood); map_neon_crate(C, x + 0.1, 0, z + 1.2, 0.8, k.rand(-0.3, 0.3), M.wood); }
    else if (kind === 2) { map_neon_barrel(C, x, 0, z, M.blue); map_neon_barrel(C, x, 0, z + 0.75, M.rust); map_neon_barrel(C, x + 0.1, 0, z - 0.75, M.yellow); }
    else if (kind === 3) { map_neon_pallet(C, x, z, k.rand(-0.15, 0.15), 4); map_neon_crate(C, x, 0.6, z, 0.9, k.rand(-0.3, 0.3), M.wood); }
    else map_neon_scooter(C, x, z, k.rand(-0.4, 0.4), k.pick([M.red, M.blue, M.yellow]), 0);
  }
  for (const sg of [-1, 1]) {
    const pz = [9.5, 22, 37, 55.5].map(v => v * sg);
    pz.forEach((z, i) => {
      map_neon_pole(C, -43.3, z, false);
      if (i) for (const o of [-0.95, 0, 0.95]) map_neon_cable(C, -43.3 + o, 8.4, pz[i - 1], -43.3 + o, 8.4, z, 0.7, 5);
      map_neon_cable(C, -43.3, 8.0, z, -49.9, 9.4, z + sg * 2.5, 0.8, 4);
    });
  }

  // MERCATO (est): file di lanterne rosse a zig-zag sopra le bancarelle
  for (let z = -54; z <= 54; z += 6) {
    if (Math.abs(z) < 9) continue;
    B.add(g.cyl6, M.steel, 41.3, 2.9, z, 0, 0, 0, 0.12, 5.8, 0.12);
    map_neon_cable(C, 41.3, 5.7, z, 50.9, 5.9, z + 3, 0.7, 6, 'lantern');
  }
  // cavi sopra le traverse (lampadine calde) e sopra il viale (lanterne)
  for (const x of [-30, -19, 19, 30]) for (const sg of [-1, 1]) map_neon_cable(C, x, 6.5, sg * 25.1, x + 1.5, 6.4, sg * 41.9, 1.0, 8, 'bulb');
  for (const z of [11.3, 19, 47.8, -11.3, -19, -47.8]) map_neon_cable(C, -14.4, 6.6, z, 13.9, 6.6, z, 1.2, 10, 'lantern');

  // sporco sparso: cartacce e calcinacci a centinaia (una draw call per tipo)
  const LN = map_neon_LANES;
  for (let i = 0; i < 240; i++) { const l = LN[i % 6]; I.trash.push(map_neon_mtx(C, k.rand(l[0], l[1]), 0.012, k.rand(l[2], l[3]), k.rand(0, 6.28), k.rand(0.15, 0.4), 0.012, k.rand(0.12, 0.3))); }
  for (let i = 0; i < 130; i++) { const l = LN[1 + (i % 5)], s = k.rand(0.12, 0.34); I.debris.push(map_neon_mtx(C, k.rand(l[0], l[1]), s * 0.3, k.rand(l[2], l[3]), k.rand(0, 6.28), s, s * 0.7, s)); }

  // 6 luci vere: due sotto i maxischermi, due nel mercato, due nei vicoli
  k.light(0, 11, 9, 0x66d8ff, 130, 40); k.light(0, 11, -9, 0xff5fb0, 130, 40);
  k.light(46, 5.5, 17, 0xffa85c, 110, 34); k.light(46, 5.5, -17, 0xff7a9a, 110, 34);
  k.light(-46, 6, 17, 0x9b6bff, 100, 34); k.light(-46, 6, -17, 0x35e6ff, 100, 34);

  // spawn al coperto dietro gli edifici: blu a sud (z+), rossi a nord (z-)
  for (const x of [-32, -27, -22, -17, -11, 11, 17, 22, 27, 32]) { k.spawn('blue', x, 56); k.spawn('red', x, -56); }
  // nav extra: passaggi dietro le baracche e dietro le bancarelle
  for (const z of [-48, -18, 18, 48]) { k.nav(-35.8, 0.15, z); k.nav(-39.6, 0.15, z); k.nav(36.2, 0.15, z); }

  // istanze e geometrie unite
  const inst = (geo, mat, arr, cast) => { if (arr.length) k.instanced(geo, mat, arr, { cast: !!cast }); };
  inst(g.quad, N.warmDim, I.winW); inst(g.quad, N.coolDim, I.winC); inst(g.quad, N.pink, I.winP);
  inst(g.sph, N.red, I.lantern); inst(g.sph, N.warm, I.bulb); inst(g.box, M.inner, I.trash); inst(g.blob[1], M.conc, I.debris, true);
  inst(g.cyl6, M.steel, I.bollard, true); inst(g.cyl6, N.cyan, I.cap); inst(g.box, M.woodD, I.sleeper); inst(g.sph, M.sandbag, I.sandbag, true);
  inst(g.blob[0], M.leaf, I.bush, true); inst(g.box, M.sakura, I.petal);
  B.flush();
}

MAPS.push({
  id: 'neon', name: 'Neon District', size: 140,
  env: {
    sky: 'night', sunElev: 38, sunAzim: 215, sunColor: 0x9fb2ff, sunIntensity: 1.6,
    hemiSky: 0x5a62b0, hemiGround: 0x4a3560, hemiIntensity: 2.4,
    fogColor: 0x2a2450, fogDensity: 0.0065, exposure: 1.05, bloomThreshold: 1.6, bloomStrength: 0.7,
    rain: true, snow: false, dust: false
  },
  build(kit) { map_neon_build(kit); }
});

