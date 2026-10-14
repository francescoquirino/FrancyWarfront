// ===================== KIT: materiali procedurali PBR + costruttori per le mappe =====================
const KIT_TEX = 512;
const kit_matCache = new Map();
const kit_texCache = new Map();

function kit_noise2(seed) {
  // value noise tileabile su griglia 64
  const N = 64, r = core_rng(seed), v = new Float32Array(N * N);
  for (let i = 0; i < v.length; i++) v[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = v[((yi & 63) * N) + (xi & 63)], b = v[((yi & 63) * N) + ((xi + 1) & 63)];
    const c = v[(((yi + 1) & 63) * N) + (xi & 63)], d = v[(((yi + 1) & 63) * N) + ((xi + 1) & 63)];
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
}
// Disegna su un canvas un'altezza [0..1] e un colore; restituisce {map, normalMap, roughnessMap}
function kit_makeTextures(name) {
  if (kit_texCache.has(name)) return kit_texCache.get(name);
  const S = KIT_TEX, seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = core_rng(seed), n1 = kit_noise2(seed), n2 = kit_noise2(seed + 1);
  const H = new Float32Array(S * S), C = new Float32Array(S * S * 3), R = new Float32Array(S * S);
  const fbm = (x, y, o = 5) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * n1(x * f, y * f); a *= 0.5; f *= 2; } return s; };
  const base = {
    concrete: [0.52, 0.51, 0.49], concrete_dark: [0.30, 0.30, 0.31], brick: [0.50, 0.33, 0.26], brick_red: [0.55, 0.24, 0.18],
    plaster: [0.72, 0.68, 0.60], metal: [0.45, 0.46, 0.48], metal_painted: [0.32, 0.38, 0.33], rust: [0.42, 0.24, 0.14],
    asphalt: [0.20, 0.20, 0.21], sand: [0.72, 0.60, 0.42], snow: [0.86, 0.88, 0.92], dirt: [0.40, 0.32, 0.23], grass: [0.27, 0.36, 0.16],
    wood: [0.50, 0.36, 0.22], wood_dark: [0.28, 0.19, 0.12], tile: [0.70, 0.70, 0.68], glass: [0.30, 0.38, 0.45], sandbag: [0.58, 0.50, 0.36],
    camo_net: [0.30, 0.33, 0.20], container_red: [0.55, 0.16, 0.12], container_blue: [0.13, 0.27, 0.48], container_green: [0.18, 0.38, 0.25],
    container_yellow: [0.75, 0.56, 0.12], rubber: [0.10, 0.10, 0.10], road_line: [0.85, 0.84, 0.78], rubble: [0.48, 0.45, 0.42],
    ice: [0.70, 0.80, 0.88], corrugated: [0.55, 0.56, 0.55],
  }[name] || [0.5, 0.5, 0.5];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, u = x / S, v = y / S;
    let h = fbm(u * 16, v * 16) * 0.5, tint = 0, rough = 0.85, grime = fbm(u * 4 + 9, v * 4 + 3, 4);
    switch (name) {
      case 'brick': case 'brick_red': {
        const rows = 16, by = v * rows, row = Math.floor(by), bx = u * 8 + (row % 2) * 0.5;
        const mx = bx - Math.floor(bx), my = by - row;
        const mortar = mx < 0.06 || my < 0.1;
        const bid = n2(Math.floor(bx) * 7.1, row * 3.3);
        h = mortar ? 0.1 : 0.7 + fbm(u * 40, v * 40, 3) * 0.3; tint = mortar ? 0.25 : (bid - 0.5) * 0.35; rough = mortar ? 0.95 : 0.8; break;
      }
      case 'tile': {
        const tx = (u * 8) % 1, ty = (v * 8) % 1, gr = tx < 0.04 || ty < 0.04;
        h = gr ? 0.2 : 0.8; tint = gr ? -0.35 : (n2(Math.floor(u * 8) * 5, Math.floor(v * 8) * 5) - 0.5) * 0.12; rough = gr ? 0.9 : 0.35; break;
      }
      case 'wood': case 'wood_dark': {
        const pl = Math.floor(u * 6), grain = Math.sin((v * 40 + n1(u * 6, v * 2) * 6) * 3.0) * 0.5 + 0.5;
        const gap = (u * 6) % 1 < 0.03;
        h = gap ? 0.1 : 0.6 + grain * 0.2; tint = gap ? -0.4 : (grain - 0.5) * 0.25 + (n2(pl * 3, 1) - 0.5) * 0.2; rough = 0.75; break;
      }
      case 'corrugated': case 'container_red': case 'container_blue': case 'container_green': case 'container_yellow': {
        const w = Math.sin(u * Math.PI * 2 * 24); h = 0.5 + w * 0.4; tint = (fbm(u * 8, v * 8) - 0.5) * 0.25;
        const rustm = Math.max(0, fbm(u * 6 + 3, v * 6) - 0.62) * 3; tint -= rustm * 0.3; rough = 0.55 + rustm * 0.4; break;
      }
      case 'asphalt': {
        h = fbm(u * 64, v * 64, 3); tint = (h - 0.5) * 0.25 + (grime - 0.5) * 0.25; rough = 0.82 - (grime > 0.6 ? 0.2 : 0);
        if (n2(u * 90, v * 90) > 0.93) tint += 0.2; break;
      }
      case 'metal': case 'metal_painted': case 'rust': {
        h = 0.5 + (fbm(u * 30, v * 30, 3) - 0.5) * 0.3; tint = (fbm(u * 6, v * 6) - 0.5) * 0.3;
        rough = name === 'rust' ? 0.9 : 0.45 + fbm(u * 20, v * 20, 3) * 0.3; break;
      }
      case 'sandbag': {
        const by = v * 8, row = Math.floor(by), bx = u * 4 + (row % 2) * 0.5, mx = bx % 1, my = by % 1;
        h = Math.sin(mx * Math.PI) * Math.sin(my * Math.PI); tint = (h - 0.5) * 0.3 + (fbm(u * 50, v * 50, 3) - 0.5) * 0.15; rough = 0.95; break;
      }
      case 'glass': { h = 0.5; tint = (fbm(u * 3, v * 3) - 0.5) * 0.2; rough = 0.08 + (grime > 0.6 ? 0.3 : 0); break; }
      case 'snow': { h = fbm(u * 10, v * 10); tint = (h - 0.5) * 0.08; rough = 0.7; break; }
      case 'sand': { h = fbm(u * 24, v * 24) * 0.6 + Math.sin(u * 50 + fbm(u * 4, v * 4) * 8) * 0.15; tint = (h - 0.5) * 0.15; rough = 0.95; break; }
      case 'grass': { h = fbm(u * 60, v * 60, 3); tint = (h - 0.5) * 0.45 + (grime - 0.5) * 0.3; rough = 0.92; break; }
      case 'dirt': case 'rubble': { h = fbm(u * 30, v * 30); tint = (h - 0.5) * 0.4; rough = 0.95; if (n2(u * 70, v * 70) > 0.8) { h += 0.3; tint += 0.12; } break; }
      case 'camo_net': { const m = fbm(u * 8, v * 8); tint = m > 0.55 ? 0.15 : m > 0.45 ? -0.1 : -0.25; h = ((u * 60) % 1 < 0.2 || (v * 60) % 1 < 0.2) ? 0.8 : 0.3; break; }
      default: { h = fbm(u * 20, v * 20); tint = (h - 0.5) * 0.22 + (grime - 0.5) * 0.2; rough = 0.88; }
    }
    // sporco/macchie generali
    const stain = Math.max(0, grime - 0.62) * 1.2;
    const k = Math.max(0.12, 1 + tint - stain * 0.5);
    H[i] = h; R[i] = Math.min(1, Math.max(0.04, rough + (rnd() - 0.5) * 0.06));
    C[i * 3] = base[0] * k; C[i * 3 + 1] = base[1] * k; C[i * 3 + 2] = base[2] * k;
  }
  const mk = (fill) => { const c = document.createElement('canvas'); c.width = c.height = S; const ctx = c.getContext('2d'); const img = ctx.createImageData(S, S); fill(img.data); ctx.putImageData(img, 0, 0); return c; };
  const clamp = v => Math.max(8, Math.min(240, v));
  const colC = mk(d => { for (let i = 0; i < S * S; i++) { d[i * 4] = clamp(Math.pow(C[i * 3], 1 / 2.2) * 255); d[i * 4 + 1] = clamp(Math.pow(C[i * 3 + 1], 1 / 2.2) * 255); d[i * 4 + 2] = clamp(Math.pow(C[i * 3 + 2], 1 / 2.2) * 255); d[i * 4 + 3] = 255; } });
  const strength = name === 'glass' || name === 'snow' ? 1.5 : 5;
  const norC = mk(d => { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, l = H[y * S + ((x - 1 + S) % S)], r = H[y * S + ((x + 1) % S)], t = H[((y - 1 + S) % S) * S + x], b = H[((y + 1) % S) * S + x];
    let nx = (l - r) * strength, ny = (b - t) * strength, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
    d[i * 4] = (nx * 0.5 + 0.5) * 255; d[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; d[i * 4 + 2] = (nz * 0.5 + 0.5) * 255; d[i * 4 + 3] = 255; } });
  const rouC = mk(d => { for (let i = 0; i < S * S; i++) { const v = R[i] * 255; d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } });
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const out = { map: tex(colC, true), normalMap: tex(norC, false), roughnessMap: tex(rouC, false) };
  kit_texCache.set(name, out);
  return out;
}

function kit_mat(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  if (kit_matCache.has(key)) return kit_matCache.get(key);
  const t = kit_makeTextures(name);
  const scale = opts.scale || ({ brick: 3, brick_red: 3, tile: 2.5, asphalt: 6, sand: 6, snow: 6, grass: 5, dirt: 5, sandbag: 2, wood: 2.5, wood_dark: 2.5, glass: 4, corrugated: 3 }[name] || 3);
  const metal = { metal: 0.75, metal_painted: 0.35, rust: 0.2, corrugated: 0.45, container_red: 0.3, container_blue: 0.3, container_green: 0.3, container_yellow: 0.3, glass: 0.5 }[name] || 0;
  const m = new THREE.MeshStandardMaterial({
    map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap,
    roughness: opts.roughness != null ? opts.roughness : 1, metalness: opts.metalness != null ? opts.metalness : metal,
    color: opts.color != null ? new THREE.Color(opts.color) : new THREE.Color(1, 1, 1),
  });
  m.normalScale.set(0.9, 0.9);
  m.userData.uvScale = 1 / scale;
  if (name === 'glass') { m.transparent = true; m.opacity = 0.55; m.envMapIntensity = 1.6; }
  kit_matCache.set(key, m);
  return m;
}
function kit_neon(color, intensity = 6) {
  const key = 'neon' + color + '_' + intensity;
  if (kit_matCache.has(key)) return kit_matCache.get(key);
  const c = new THREE.Color(color);
  const m = new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.3), emissive: c, emissiveIntensity: intensity, roughness: 0.4 });
  m.userData.uvScale = 1; m.userData.neon = true;
  kit_matCache.set(key, m);
  return m;
}

// geometria box con UV in metri
function kit_boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  return g;
}

// ---------- il builder di una mappa ----------
class Kit {
  constructor(seed) {
    this.rngf = core_rng(seed);
    this.batches = new Map();   // material -> [geometrie già trasformate]
    this.group = new THREE.Group();
    this.lights = 0; this.spawns = { blue: [], red: [] }; this.navPts = []; this.navLinks = [];
    this.THREE = THREE;
    // metodi legati: le mappe possono fare const r = kit.rand
    for (const k of Object.getOwnPropertyNames(Kit.prototype)) if (k !== 'constructor' && typeof this[k] === 'function') this[k] = this[k].bind(this);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
  }
  rng() { return this.rngf(); }
  rand(a, b) { return a + (b - a) * this.rngf(); }
  pick(a) { return a[Math.floor(this.rngf() * a.length) % a.length]; }
  mat(n, o) { return kit_mat(n, o); }
  neon(c, i) { return kit_neon(c, i); }
  _push(geo, mat, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) { const n = g.attributes.position.count; g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); }
    if (!g.attributes.normal) g.computeVertexNormals();
    const sc = mat.userData.uvScale || 1;
    if (sc !== 1) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sc, uv.getY(i) * sc); }
    g.applyMatrix4(matrix);
    let a = this.batches.get(mat); if (!a) this.batches.set(mat, a = []);
    a.push(g);
    return g;
  }
  _matrix(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
    this._e.set(rx, ry, rz); this._q.setFromEuler(this._e);
    if (typeof s === 'number') this._s.set(s, s, s); else this._s.set(s.x, s.y, s.z);
    return this._m.compose(this._p.set(x, y, z), this._q, this._s);
  }
  _colliderFromGeo(g) { g.computeBoundingBox(); const b = g.boundingBox.clone(); if (b.max.y - b.min.y < 0.05) b.max.y = b.min.y + 0.05; core_addCollider(b); }
  box(x, y, z, w, h, d, mat, opts = {}) {
    if (!mat) mat = kit_mat('concrete');
    if (w <= 0 || h <= 0 || d <= 0) return;
    const geo = kit_boxGeo(w, h, d);
    const g = this._push(geo, mat, this._matrix(x, y + h / 2, z, opts.rotX || 0, opts.rotY || 0, opts.rotZ || 0));
    geo.dispose();
    if (opts.collide !== false) this._colliderFromGeo(g);
    return g;
  }
  cyl(x, y, z, rTop, rBot, h, mat, opts = {}) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, opts.seg || 16, 1, false);
    const uv = geo.attributes.uv; const circ = Math.PI * 2 * Math.max(rTop, rBot);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
    const g = this._push(geo, mat || kit_mat('metal'), this._matrix(x, y + h / 2, z, opts.rotX || 0, opts.rotY || 0, opts.rotZ || 0));
    geo.dispose();
    if (opts.collide !== false) this._colliderFromGeo(g);
    return g;
  }
  mesh(geometry, mat, t = {}, opts = {}) {
    const g = this._push(geometry, mat || kit_mat('concrete'), this._matrix(t.x || 0, t.y || 0, t.z || 0, t.rotX || 0, t.rotY || 0, t.rotZ || 0, t.scale != null ? t.scale : 1));
    if (opts.collide) this._colliderFromGeo(g);
    return g;
  }
  collider(a, b, c, d, e, f) { core_addCollider(new THREE.Box3(new THREE.Vector3(Math.min(a, d), Math.min(b, e), Math.min(c, f)), new THREE.Vector3(Math.max(a, d), Math.max(b, e), Math.max(c, f)))); }
  instanced(geometry, mat, matrices, opts = {}) {
    const im = new THREE.InstancedMesh(geometry, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = opts.cast !== false; im.receiveShadow = true;
    im.computeBoundingSphere();
    this.group.add(im);
    return im;
  }
  light(x, y, z, color, intensity, distance) {
    if (this.lights >= 6) return null;
    this.lights++;
    const l = new THREE.PointLight(color, intensity, distance || 20, 2);
    l.position.set(x, y, z); this.group.add(l);
    return l;
  }
  spawn(team, x, z) { const y = Math.max(0, groundHeightAt(x, 3, z)); (this.spawns[team] || this.spawns.blue).push(new THREE.Vector3(x, y, z)); }
  nav(x, y, z) { this.navPts.push(new THREE.Vector3(x, y, z)); return this.navPts.length - 1; }
  navLink(a, b) { this.navLinks.push([a, b]); }
  decal(x, z, w, d, rotY, mat) {
    const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
    this._push(geo, mat, this._matrix(x, 0.015 + this.rngf() * 0.01, z, 0, rotY || 0, 0));
  }
  ground(mat) {
    const S = 400;
    const geo = new THREE.PlaneGeometry(S, S, 1, 1); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * S, uv.getY(i) * S);
    this._push(geo, mat, this._matrix(0, 0, 0));
    core_addCollider(new THREE.Box3(new THREE.Vector3(-S / 2, -2, -S / 2), new THREE.Vector3(S / 2, 0, S / 2)));
  }
  ramp(x, y, z, w, d, rise, rotY, mat) {
    // mesh inclinata + collider a gradini da 0.12 m
    const len = Math.hypot(d, rise), ang = Math.atan2(rise, d);
    const geo = kit_boxGeo(w, 0.15, len);
    const m = new THREE.Matrix4().makeRotationY(rotY || 0).multiply(new THREE.Matrix4().makeTranslation(0, rise / 2, 0)).multiply(new THREE.Matrix4().makeRotationX(ang));
    m.premultiply(new THREE.Matrix4().makeTranslation(x, y, z));
    this._push(geo, mat || kit_mat('concrete'), m); geo.dispose();
    this._stepColliders(x, y, z, w, rise, d, rotY, Math.max(2, Math.ceil(rise / 0.12)));
  }
  _stepColliders(x, y, z, width, rise, run, rotY, n) {
    const r = Math.round(((rotY || 0) / (Math.PI / 2))) & 3;
    for (let i = 0; i < n; i++) {
      const top = y + rise * (i + 1) / n, z0 = run / 2 - run * (i + 1) / n, z1 = run / 2 - run * i / n; // salire andando verso -Z
      const pts = [[-width / 2, z0], [width / 2, z1]].map(([lx, lz]) => {
        const c = [[lx, lz], [-lz, lx], [-lx, -lz], [lz, -lx]][r]; return [x + c[0], z + c[1]];
      });
      this.collider(Math.min(pts[0][0], pts[1][0]), y, Math.min(pts[0][1], pts[1][1]), Math.max(pts[0][0], pts[1][0]), top, Math.max(pts[0][1], pts[1][1]));
    }
  }
  stairs(x, y, z, width, rise, run, rotY, mat) {
    const n = Math.max(2, Math.ceil(rise / 0.19)), sh = rise / n, sd = run / n;
    const r = Math.round(((rotY || 0) / (Math.PI / 2))) & 3, ry = r * Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const lz = run / 2 - sd * (i + 0.5);
      const c = [[0, lz], [lz, 0], [0, -lz], [-lz, 0]][r];
      // il gradino i va da terra fino alla sua alzata (pieno sotto: niente buchi)
      this.box(x + c[0], y, z + c[1], width, sh * (i + 1), sd, mat || kit_mat('concrete'), { rotY: ry, collide: false });
    }
    this._stepColliders(x, y, z, width, rise, run, ry, n);
    // nav: fondo e cima della scala
    const fb = [[0, run / 2 + 0.8], [run / 2 + 0.8, 0], [0, -run / 2 - 0.8], [-run / 2 - 0.8, 0]][r];
    const a = this.nav(x + fb[0], y, z + fb[1]);
    const b = this.nav(x - fb[0], y + rise, z - fb[1]);
    this.navLink(a, b);
    return { bottom: a, top: b };
  }
  room(o) {
    const { x, z, w, d } = o, y = o.y || 0, h = o.h || 3.2, t = o.wall || 0.25, mat = o.mat || kit_mat('plaster');
    this.box(x, y, z, w, 0.12, d, o.floorMat || kit_mat('tile'));
    if (o.ceiling !== false) this.box(x, y + h - 0.15, z, w, 0.15, d, mat);
    const op = side => [...(o.doors || []).filter(e => e.side === side).map(e => ({ at: e.at || 0, width: e.width || 1.4, bottom: 0, top: e.height || 2.2 })),
      ...(o.windows || []).filter(e => e.side === side).map(e => ({ at: e.at || 0, width: e.width || 1.2, bottom: e.y || 1, top: (e.y || 1) + (e.height || 1.1) }))];
    this._wall(x, y, z - d / 2 + t / 2, w, h, t, 'x', op('n'), mat, 0);
    this._wall(x, y, z + d / 2 - t / 2, w, h, t, 'x', op('s'), mat, 0);
    this._wall(x - w / 2 + t / 2, y, z, d - 2 * t, h, t, 'z', op('w'), mat, 0);
    this._wall(x + w / 2 - t / 2, y, z, d - 2 * t, h, t, 'z', op('e'), mat, 0);
  }
  // muro lungo un asse con aperture [{at,width,bottom,top}]
  _wall(cx, y, cz, L, h, t, axis, openings, mat, ruined) {
    const ops = openings.map(o => ({ a: Math.max(-L / 2 + 0.2, o.at - o.width / 2), b: Math.min(L / 2 - 0.2, o.at + o.width / 2), bot: o.bottom, top: Math.min(h, o.top) })).filter(o => o.b > o.a).sort((p, q) => p.a - q.a);
    const seg = (a, b, y0, y1) => {
      if (b - a < 0.05 || y1 - y0 < 0.05) return;
      if (ruined && this.rngf() < ruined * 0.5) {
        // pezzo crollato: resta un moncone basso e frastagliato
        const hh = (y1 - y0) * this.rand(0.1, 0.5); if (y0 > y + 0.01) return; y1 = y0 + hh;
      }
      const m = (a + b) / 2, len = b - a;
      if (axis === 'x') this.box(cx + m, y0, cz, len, y1 - y0, t, mat); else this.box(cx, y0, cz + m, t, y1 - y0, len, mat);
    };
    let cur = -L / 2;
    for (const o of ops) {
      seg(cur, o.a, y, y + h);
      if (o.bot > 0.01) seg(o.a, o.b, y, y + o.bot);
      if (o.top < h - 0.01) seg(o.a, o.b, y + o.top, y + h);
      cur = o.b;
    }
    seg(cur, L / 2, y, y + h);
  }
  building(o) {
    let { x, z, w, d } = o;
    const floors = o.floors || 2, fh = o.floorH || 3.4, t = o.wall || 0.3, mat = o.mat || kit_mat('concrete');
    const floorMat = o.floorMat || kit_mat('concrete_dark'), ruined = o.ruined || 0, innerMat = o.innerMat || mat;
    const rot = Math.round((o.rotY || 0) / (Math.PI / 2)) & 1;
    const sideMap = { n: 'n', s: 's', e: 'e', w: 'w' };
    if (rot) { [w, d] = [d, w]; Object.assign(sideMap, { n: 'e', e: 's', s: 'w', w: 'n' }); }
    const doors = (o.doors && o.doors.length ? o.doors : [{ side: 's', at: 0 }]).map(e => ({ ...e, side: sideMap[e.side] || 's' }));
    // scala interna lungo il lato ovest, salendo verso -Z
    const sw = 1.3, run = fh * 1.45, sx = x - w / 2 + t + sw / 2 + 0.05, sz = z + d / 2 - t - 1.6 - run / 2;
    const stairFits = w >= 6 && d >= run + 3.6;
    const windows = o.windows !== false;
    for (let f = 0; f < floors; f++) {
      const y0 = f * fh;
      // muri del piano
      const ops = side => {
        const len = (side === 'n' || side === 's') ? w : d, arr = [];
        if (f === 0) for (const e of doors) if (e.side === side) arr.push({ at: e.at || 0, width: e.width || 1.6, bottom: 0, top: 2.3 });
        if (windows) {
          const n = Math.max(1, Math.floor(len / 3.2));
          for (let k = 0; k < n; k++) {
            const at = -len / 2 + (k + 0.5) * len / n;
            if (arr.some(a => Math.abs(a.at - at) < 1.6)) continue;
            if (side === 'w' && stairFits && Math.abs(at - (sz - z)) < run / 2 + 0.6) continue;
            arr.push({ at, width: 1.2, bottom: 1.0, top: 2.3 });
          }
        }
        return arr;
      };
      const wr = f === 0 ? ruined * 0.3 : ruined;
      this._wall(x, y0, z - d / 2 + t / 2, w, fh, t, 'x', ops('n'), mat, wr);
      this._wall(x, y0, z + d / 2 - t / 2, w, fh, t, 'x', ops('s'), mat, wr);
      this._wall(x - w / 2 + t / 2, y0, z, d - 2 * t, fh, t, 'z', ops('w'), mat, wr);
      this._wall(x + w / 2 - t / 2, y0, z, d - 2 * t, fh, t, 'z', ops('e'), mat, wr);
      // pavimento (piano terra: soletta sottile)
      if (f === 0) this.box(x, 0, z, w - 0.02, 0.1, d - 0.02, floorMat);
      // solaio sopra questo piano, con buco della scala
      const yTop = y0 + fh, last = f === floors - 1, slabT = 0.25;
      const roofMat = o.roof === 'none' && last ? null : (last ? mat : floorMat);
      if (roofMat) {
        const holeX0 = sx - sw / 2 - 0.1, holeX1 = sx + sw / 2 + 0.1, holeZ0 = sz - run / 2 - 0.2, holeZ1 = sz + run / 2 + 0.1;
        const slab = (ax, az, bx, bz) => {
          if (bx - ax < 0.1 || bz - az < 0.1) return;
          if (ruined && !last && this.rngf() < ruined * 0.35) return;
          this.box((ax + bx) / 2, yTop - slabT, (az + bz) / 2, bx - ax, slabT, bz - az, roofMat);
        };
        const X0 = x - w / 2 + 0.01, X1 = x + w / 2 - 0.01, Z0 = z - d / 2 + 0.01, Z1 = z + d / 2 - 0.01;
        if (stairFits) { slab(holeX1, Z0, X1, Z1); slab(X0, Z0, holeX1, holeZ0); slab(X0, holeZ1, holeX1, Z1); }
        else slab(X0, Z0, X1, Z1);
        // ringhiera attorno al buco
        if (stairFits) this.box(holeX1 + 0.04, yTop, (holeZ0 + holeZ1) / 2, 0.06, 1.0, holeZ1 - holeZ0, kit_mat('metal'), { collide: true });
      }
      if (stairFits && (f < floors - 1 || o.roof !== 'none')) {
        const st = this.stairs(sx, y0, sz, sw, fh, run, 0, kit_mat('concrete'));
      }
      // nav interni
      for (let ix = x - w / 2 + 1.5; ix <= x + w / 2 - 1.5; ix += 3) for (let iz = z - d / 2 + 1.5; iz <= z + d / 2 - 1.5; iz += 3) {
        if (stairFits && Math.abs(ix - sx) < sw && Math.abs(iz - sz) < run / 2 + 0.5) continue;
        if (f > 0 && ruined) continue;
        this.nav(ix, y0 + (f === 0 ? 0.1 : 0), iz);
      }
    }
    // tetto
    const roofY = floors * fh;
    if (o.roof !== 'none') {
      if (o.roof === 'parapet' || o.roof === undefined) {
        const pm = mat;
        this.box(x, roofY, z - d / 2 + 0.15, w, 1.0, 0.3, pm); this.box(x, roofY, z + d / 2 - 0.15, w, 1.0, 0.3, pm);
        this.box(x - w / 2 + 0.15, roofY, z, 0.3, 1.0, d - 0.6, pm); this.box(x + w / 2 - 0.15, roofY, z, 0.3, 1.0, d - 0.6, pm);
      }
      // condizionatori/cisterne sul tetto
      if (!ruined) for (let k = 0; k < 2; k++) this.box(x + this.rand(-w / 4, w / 4) + 1, roofY, z + this.rand(-d / 4, d / 4), 1.1, 0.8, 0.8, kit_mat('metal_painted'));
      for (let ix = x - w / 2 + 2; ix <= x + w / 2 - 2; ix += 4) for (let iz = z - d / 2 + 2; iz <= z + d / 2 - 2; iz += 4) this.nav(ix, roofY, iz);
    }
    // cornicione/basamento per dare spessore
    this.box(x, 0, z, w + 0.2, 0.35, d + 0.2, kit_mat('concrete_dark'), { collide: false });
    if (ruined) {
      // macerie attorno
      const mats = [];
      const g = new THREE.DodecahedronGeometry(0.35, 0);
      for (let k = 0; k < 40 * ruined; k++) {
        const m = new THREE.Matrix4(); const s = this.rand(0.4, 1.8);
        m.compose(new THREE.Vector3(x + this.rand(-w / 2 - 2, w / 2 + 2), 0.1, z + this.rand(-d / 2 - 2, d / 2 + 2)), new THREE.Quaternion().setFromEuler(new THREE.Euler(this.rngf() * 3, this.rngf() * 3, 0)), new THREE.Vector3(s, s * 0.6, s));
        mats.push(m);
      }
      this.instanced(g, kit_mat('rubble'), mats);
    }
  }
  // oggetto fatto in Blender (ASSETS.props): clone + collider dalla sua scatola
  prop(name, x, y, z, rotY = 0, opts = {}) {
    const src = ASSETS.props && ASSETS.props[name]; if (!src) return null;
    const o = src.clone(); o.position.set(x, y, z); o.rotation.y = rotY; if (opts.scale) o.scale.setScalar(opts.scale);
    this.group.add(o); o.updateMatrixWorld(true);
    if (opts.collide !== false) { const b = new THREE.Box3().setFromObject(o); core_addCollider(b); }
    return o;
  }
  // mappa costruita in Blender: collider AABB per ogni mesh non DECO_, spawn/nav dagli empty, mesh unite per materiale
  glbMap(scene) {
    scene.updateMatrixWorld(true);
    const groups = new Map(); let nCol = 0;
    scene.traverse(o => {
      const n = o.name || '';
      if (!o.isMesh) {
        const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
        if (/^SPAWN_BLUE/i.test(n)) this.spawns.blue.push(p.clone().setY(Math.max(0, p.y)));
        else if (/^SPAWN_RED/i.test(n)) this.spawns.red.push(p.clone().setY(Math.max(0, p.y)));
        else if (/^NAV/i.test(n)) this.navPts.push(p);
        return;
      }
      const deco = /^DECO_/i.test(n) || /^DECO_/i.test((o.parent && o.parent.name) || '');
      let g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.index) { const idx = []; for (let i = 0; i < g.attributes.position.count; i++) idx.push(i); g.setIndex(idx); }
      if (/^GROUND/i.test(n)) { g.computeBoundingBox(); const b = g.boundingBox; core_addCollider(new THREE.Box3(new THREE.Vector3(b.min.x, -2, b.min.z), new THREE.Vector3(b.max.x, b.max.y, b.max.z))); nCol++; }
      else if (!deco) { g.computeBoundingBox(); const b = g.boundingBox.clone(); if (b.max.y - b.min.y < 0.05) b.max.y = b.min.y + 0.05; core_addCollider(b); nCol++; }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const m = mats[0];
      if (m.map) m.map.anisotropy = 8;
      let a = groups.get(m); if (!a) groups.set(m, a = []); a.push(g);
    });
    for (const [mat, geos] of groups) {
      let chunk = [], cnt = 0;
      const flush = () => { if (!chunk.length) return; const mg = mergeGeometries(chunk, false); if (mg) { mg.computeBoundingSphere(); const me = new THREE.Mesh(mg, mat); me.castShadow = !mat.transparent; me.receiveShadow = true; this.group.add(me); } chunk.forEach(x => x.dispose()); chunk = []; cnt = 0; };
      for (const g of geos) { chunk.push(g); cnt += g.attributes.position.count; if (cnt > 500000) flush(); }
      flush();
    }
    console.warn('INFO città Blender: ' + nCol + ' collider, ' + groups.size + ' materiali, spawn ' + this.spawns.blue.length + '/' + this.spawns.red.length + ', nav ' + this.navPts.length);
  }
  // unisce tutto: un mesh per materiale
  finish() {
    for (const [mat, geos] of this.batches) {
      // spezza in blocchi da max ~400k vertici
      let chunk = [], count = 0;
      const flush = () => {
        if (!chunk.length) return;
        const merged = mergeGeometries(chunk, false);
        if (merged) {
          merged.computeBoundingSphere();
          const m = new THREE.Mesh(merged, mat);
          const isNeon = mat.userData.neon, isGlass = mat.transparent;
          m.castShadow = !isNeon && !isGlass; m.receiveShadow = !isNeon;
          this.group.add(m);
        }
        chunk.forEach(g => g.dispose()); chunk = []; count = 0;
      };
      for (const g of geos) { chunk.push(g); count += g.attributes.position.count; if (count > 400000) flush(); }
      flush();
    }
    this.batches.clear();
    return this.group;
  }
}
