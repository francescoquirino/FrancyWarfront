// ===================== CORE: stato globale, collisioni, raggi, navigazione =====================
const MAPS = [];
const ASSETS = { weapons: {} };
const URLP = new URLSearchParams(location.search);

const G = {
  scene: null, camera: null, renderer: null, time: 0, dt: 0,
  player: null, bots: [], colliders: [], nav: null, map: null,
  settings: { difficulty: 3, botCount: 24, sens: 1.0 },
  shake(a) { core_shakeAmt = Math.min(1.2, core_shakeAmt + a); },
  flashHit() { HUD.hurt(); },
  hitMarker(kill) { HUD.hitmarker(kill); },
  killFeed(k, v, w) { HUD.feed(k, v, w); },
  score: { blue: 0, red: 0 },
  paused: true, started: false,
};
let core_shakeAmt = 0;

// ---------- griglia spaziale dei collider (celle 8 m) ----------
const CORE_CELL = 8;
const core_grid = new Map();
let core_stamp = 1;
function core_key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
function core_gridClear() { core_grid.clear(); G.colliders.length = 0; }
function core_addCollider(box) {
  box.__s = 0;
  G.colliders.push(box);
  const x0 = Math.floor(box.min.x / CORE_CELL), x1 = Math.floor(box.max.x / CORE_CELL);
  const z0 = Math.floor(box.min.z / CORE_CELL), z1 = Math.floor(box.max.z / CORE_CELL);
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
    const k = core_key(ix, iz);
    let a = core_grid.get(k); if (!a) { a = []; core_grid.set(k, a); }
    a.push(box);
  }
}
// raccoglie i collider che toccano il rettangolo XZ
const core_q = [];
function core_query(minX, minZ, maxX, maxZ) {
  core_q.length = 0; core_stamp++;
  const x0 = Math.floor(minX / CORE_CELL), x1 = Math.floor(maxX / CORE_CELL);
  const z0 = Math.floor(minZ / CORE_CELL), z1 = Math.floor(maxZ / CORE_CELL);
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
    const a = core_grid.get(core_key(ix, iz)); if (!a) continue;
    for (let i = 0; i < a.length; i++) { const b = a[i]; if (b.__s !== core_stamp) { b.__s = core_stamp; core_q.push(b); } }
  }
  return core_q;
}

// ---------- movimento con collisione (capsula come AABB, step-up) ----------
const CORE_STEP = 0.55;
function core_overlap(b, px, py, pz, r, h) {
  return px + r > b.min.x && px - r < b.max.x && pz + r > b.min.z && pz - r < b.max.z && py + h > b.min.y && py < b.max.y;
}
function core_slide(pos, axis, delta, r, h, out) {
  if (delta === 0) return;
  pos[axis] += delta;
  const list = core_query(pos.x - r, pos.z - r, pos.x + r, pos.z + r);
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (!core_overlap(b, pos.x, pos.y + 0.02, pos.z, r, h - 0.02)) continue;
    const top = b.max.y;
    if (top - pos.y <= CORE_STEP && out.wasGround) {
      // gradino: sali se c'è spazio sopra
      let free = true;
      for (let j = 0; j < list.length; j++) { const c = list[j]; if (c !== b && core_overlap(c, pos.x, top + 0.02, pos.z, r, h - 0.04)) { free = false; break; } }
      if (free) { pos.y = top; out.stepped = true; continue; }
    }
    if (axis === 'x') pos.x = delta > 0 ? b.min.x - r - 0.001 : b.max.x + r + 0.001;
    else pos.z = delta > 0 ? b.min.z - r - 0.001 : b.max.z + r + 0.001;
    out.blocked = true;
  }
}
function moveWithCollision(pos, vel, dt, radius = 0.35, height = 1.8, state = null) {
  const out = { onGround: false, blocked: false, stepped: false, wasGround: state ? !!state.onGround : true };
  vel.y -= 22 * dt;
  if (vel.y < -40) vel.y = -40;
  const dx = vel.x * dt, dz = vel.z * dt;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.18));
  for (let s = 0; s < steps; s++) { core_slide(pos, 'x', dx / steps, radius, height, out); core_slide(pos, 'z', dz / steps, radius, height, out); }
  // verticale
  const prevY = pos.y;
  pos.y += vel.y * dt;
  const list = core_query(pos.x - radius, pos.z - radius, pos.x + radius, pos.z + radius);
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (!(pos.x + radius > b.min.x && pos.x - radius < b.max.x && pos.z + radius > b.min.z && pos.z - radius < b.max.z)) continue;
    if (vel.y <= 0 && prevY >= b.max.y - 0.3 && pos.y < b.max.y && pos.y + height > b.min.y) {
      pos.y = b.max.y; vel.y = 0; out.onGround = true;
    } else if (vel.y > 0 && prevY + height <= b.min.y + 0.05 && pos.y + height > b.min.y && pos.y < b.max.y) {
      pos.y = b.min.y - height; vel.y = 0;
    }
  }
  // appoggio: se siamo esattamente sopra un collider contiamo a terra
  if (!out.onGround && vel.y <= 0) {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (pos.x + radius > b.min.x && pos.x - radius < b.max.x && pos.z + radius > b.min.z && pos.z - radius < b.max.z && Math.abs(pos.y - b.max.y) < 0.03) { out.onGround = true; vel.y = 0; break; }
    }
  }
  if (out.stepped) out.onGround = true;
  if (pos.y < -20) { pos.y = 2; vel.y = 0; } // rete di sicurezza
  if (state) state.onGround = out.onGround;
  return out;
}
function groundHeightAt(x, y, z) {
  const list = core_query(x - 0.05, z - 0.05, x + 0.05, z + 0.05);
  let best = -100;
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z && b.max.y <= y + 0.5 && b.max.y > best) best = b.max.y;
  }
  return best;
}

// ---------- raggi ----------
const core_ray = new THREE.Ray();
const core_v1 = new THREE.Vector3(), core_v2 = new THREE.Vector3(), core_v3 = new THREE.Vector3();
function core_rayBoxes(origin, dir, maxDist) {
  // DDA 2D sulla griglia + test AABB
  let best = maxDist, bestBox = null;
  core_ray.origin.copy(origin); core_ray.direction.copy(dir);
  core_stamp++;
  let ix = Math.floor(origin.x / CORE_CELL), iz = Math.floor(origin.z / CORE_CELL);
  const stepX = dir.x > 0 ? 1 : -1, stepZ = dir.z > 0 ? 1 : -1;
  const tDX = Math.abs(dir.x) > 1e-9 ? CORE_CELL / Math.abs(dir.x) : Infinity;
  const tDZ = Math.abs(dir.z) > 1e-9 ? CORE_CELL / Math.abs(dir.z) : Infinity;
  let tMX = Math.abs(dir.x) > 1e-9 ? ((dir.x > 0 ? (ix + 1) * CORE_CELL - origin.x : origin.x - ix * CORE_CELL) / Math.abs(dir.x)) : Infinity;
  let tMZ = Math.abs(dir.z) > 1e-9 ? ((dir.z > 0 ? (iz + 1) * CORE_CELL - origin.z : origin.z - iz * CORE_CELL) / Math.abs(dir.z)) : Infinity;
  let tCell = 0;
  for (let n = 0; n < 200; n++) {
    const a = core_grid.get(core_key(ix, iz));
    if (a) for (let i = 0; i < a.length; i++) {
      const b = a[i]; if (b.__s === core_stamp) continue; b.__s = core_stamp;
      const p = core_ray.intersectBox(b, core_v3);
      if (p) { const d = p.distanceTo(origin); if (d < best) { best = d; bestBox = b; } }
    }
    if (best <= tCell) break;
    if (tMX < tMZ) { tCell = tMX; tMX += tDX; ix += stepX; } else { tCell = tMZ; tMZ += tDZ; iz += stepZ; }
    if (tCell > maxDist) break;
  }
  return bestBox ? { dist: best, box: bestBox } : null;
}
function core_boxNormal(box, p, out) {
  const e = 0.02;
  if (Math.abs(p.x - box.min.x) < e) return out.set(-1, 0, 0);
  if (Math.abs(p.x - box.max.x) < e) return out.set(1, 0, 0);
  if (Math.abs(p.z - box.min.z) < e) return out.set(0, 0, -1);
  if (Math.abs(p.z - box.max.z) < e) return out.set(0, 0, 1);
  if (Math.abs(p.y - box.min.y) < e) return out.set(0, -1, 0);
  return out.set(0, 1, 0);
}
function core_allEntities() { const a = G.bots.slice(); if (G.player) a.push(G.player); return a; }
// distanza minima tra un raggio e un segmento verticale → t lungo il raggio o -1
function core_rayCapsule(o, d, cx, cz, y0, y1, r) {
  // proiezione XZ: intersezione raggio-cerchio, poi controllo altezza
  const ox = o.x - cx, oz = o.z - cz;
  const a = d.x * d.x + d.z * d.z;
  if (a < 1e-9) return -1;
  const b = 2 * (ox * d.x + oz * d.z), c = ox * ox + oz * oz - r * r;
  const disc = b * b - 4 * a * c; if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  let t = (-b - s) / (2 * a); if (t < 0) t = (-b + s) / (2 * a); if (t < 0) return -1;
  const y = o.y + d.y * t; if (y < y0 || y > y1) return -1;
  return t;
}
function core_raySphere(o, d, cx, cy, cz, r) {
  const ox = o.x - cx, oy = o.y - cy, oz = o.z - cz;
  const b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - c; if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc); return t >= 0 ? t : -1;
}
function core_entHeights(e) { const cr = e.crouch ? 0.55 : 0; return { top: 1.75 - cr, head: 1.62 - cr }; }
function raycastWorld(origin, dir, maxDist, opts = {}) {
  const wall = core_rayBoxes(origin, dir, maxDist);
  let best = wall ? wall.dist : maxDist, hit = null;
  if (opts.entities !== false) {
    const ents = core_allEntities();
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i]; if (!e.alive || e === opts.ignore) continue;
      const dx = e.pos.x - origin.x, dz = e.pos.z - origin.z;
      if (dx * dx + dz * dz > (best + 2) * (best + 2)) continue;
      const hh = core_entHeights(e);
      let t = core_raySphere(origin, dir, e.pos.x, e.pos.y + hh.head, e.pos.z, 0.15);
      if (t >= 0 && t < best) { best = t; hit = { entity: e, head: true }; continue; }
      t = core_rayCapsule(origin, dir, e.pos.x, e.pos.z, e.pos.y, e.pos.y + hh.top - 0.25, 0.33);
      if (t >= 0 && t < best) { best = t; hit = { entity: e, head: false }; }
    }
  }
  if (hit) {
    const point = new THREE.Vector3().copy(dir).multiplyScalar(best).add(origin);
    const normal = new THREE.Vector3().copy(dir).negate();
    return { dist: best, point, normal, kind: 'entity', entity: hit.entity, head: hit.head };
  }
  if (wall) {
    const point = new THREE.Vector3().copy(dir).multiplyScalar(wall.dist).add(origin);
    const normal = core_boxNormal(wall.box, point, new THREE.Vector3());
    return { dist: wall.dist, point, normal, kind: 'world', entity: null };
  }
  return null;
}
function hasLineOfSight(a, b) {
  core_v1.subVectors(b, a); const d = core_v1.length(); if (d < 0.01) return true;
  core_v1.divideScalar(d);
  return !core_rayBoxes(a, core_v1, d - 0.05);
}

// ---------- danni e punteggio ----------
function applyDamage(entity, amount, attacker, weaponName, hitPoint) {
  if (!entity || !entity.alive || amount <= 0) return;
  if (entity.isPlayer && G.godMode) { G.flashHit(); return; } // immortalità (tasto I)
  if (attacker && attacker !== entity && attacker.team === entity.team) return; // niente fuoco amico
  entity.hp -= amount;
  entity.lastHurt = G.time;
  if (entity.isPlayer) { G.flashHit(); SFX.play('hurt', null, 0.8); if (attacker) HUD.hurtFrom(attacker.pos); }
  if (attacker && attacker.isPlayer && entity !== attacker) { G.hitMarker(entity.hp <= 0); SFX.play(entity.hp <= 0 ? 'kill' : 'hitmarker', null, 0.6); }
  if (entity.onHit) entity.onHit(attacker, hitPoint);
  if (entity.hp <= 0) core_kill(entity, attacker, weaponName);
}
function core_kill(entity, attacker, weaponName) {
  entity.hp = 0; entity.alive = false; entity.deaths = (entity.deaths || 0) + 1; entity.diedAt = G.time;
  if (attacker && attacker !== entity) { attacker.kills = (attacker.kills || 0) + 1; G.score[attacker.team]++; }
  G.killFeed(attacker ? attacker.name : '—', entity.name, weaponName || '');
  if (entity.onDeath) entity.onDeath(attacker);
  if (entity.isPlayer) PLAYER.die(attacker);
}
function explosionDamage(center, radius, maxDamage, attacker, weaponName) {
  const ents = core_allEntities();
  for (const e of ents) {
    if (!e.alive) continue;
    core_v2.set(e.pos.x, e.pos.y + 1.0, e.pos.z);
    const d = core_v2.distanceTo(center);
    if (d > radius) continue;
    if (!hasLineOfSight(center, core_v2)) continue;
    const f = 1 - d / radius;
    // le proprie granate fanno male solo a metà (perdona i bambini)
    const self = e === attacker ? 0.5 : 1;
    if (e.isPlayer && G.godMode) continue;
    if (e === attacker) { e.hp -= maxDamage * f * f * self; if (e.isPlayer) G.flashHit(); if (e.hp <= 0) core_kill(e, null, weaponName); continue; }
    applyDamage(e, maxDamage * (0.25 + 0.75 * f) * self, attacker, weaponName, core_v2.clone());
  }
  if (G.player) { const d = G.player.pos.distanceTo(center); G.shake(Math.max(0, 1.1 - d / 30)); }
}

// ---------- navigazione ----------
function core_buildNav(extraPoints, extraLinks, bounds) {
  const pts = [], STEP = 4;
  for (let x = bounds.minX + 3; x <= bounds.maxX - 3; x += STEP) for (let z = bounds.minZ + 3; z <= bounds.maxZ - 3; z += STEP) {
    const y = groundHeightAt(x, 1.2, z);
    if (y < -1 || y > 1.2) continue;
    const list = core_query(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
    let blocked = false;
    for (const b of list) if (core_overlap(b, x, y + 0.1, z, 0.4, 1.6)) { blocked = true; break; }
    if (!blocked) pts.push(new THREE.Vector3(x, y, z));
  }
  const base = pts.length;
  for (const p of extraPoints) pts.push(p.clone());
  const links = pts.map(() => []);
  // hash dei punti
  const ph = new Map();
  const hk = (x, z) => Math.floor(x / 6) * 100003 + Math.floor(z / 6);
  pts.forEach((p, i) => { const k = hk(p.x, p.z); let a = ph.get(k); if (!a) ph.set(k, a = []); a.push(i); });
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], cx = Math.floor(p.x / 6), cz = Math.floor(p.z / 6);
    for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
      const a = ph.get((cx + ox) * 100003 + (cz + oz)); if (!a) continue;
      for (const j of a) {
        if (j <= i) continue;
        const q = pts[j], d = p.distanceTo(q);
        if (d > 6.2 || Math.abs(p.y - q.y) > 0.6) continue;
        A.set(p.x, p.y + 0.7, p.z); B.set(q.x, q.y + 0.7, q.z);
        if (!hasLineOfSight(A, B)) continue;
        A.y = p.y + 1.4; B.y = q.y + 1.4;
        if (!hasLineOfSight(A, B)) continue;
        links[i].push(j); links[j].push(i);
      }
    }
  }
  for (const [a, b] of extraLinks) { const i = base + a, j = base + b; if (links[i] && links[j]) { links[i].push(j); links[j].push(i); } }
  const nav = {
    points: pts, links, hash: ph,
    nearest(pos) {
      let best = -1, bd = 1e9;
      const cx = Math.floor(pos.x / 6), cz = Math.floor(pos.z / 6);
      for (let r = 0; r <= 3 && best < 0; r++) for (let ox = -r; ox <= r; ox++) for (let oz = -r; oz <= r; oz++) {
        const a = ph.get((cx + ox) * 100003 + (cz + oz)); if (!a) continue;
        for (const j of a) { const q = pts[j]; const d = (q.x - pos.x) ** 2 + (q.z - pos.z) ** 2 + ((q.y - pos.y) * 3) ** 2; if (d < bd && links[j].length) { bd = d; best = j; } }
      }
      if (best < 0) for (let j = 0; j < pts.length; j++) { const q = pts[j]; const d = q.distanceToSquared(pos); if (d < bd && links[j].length) { bd = d; best = j; } }
      return best;
    },
    path(from, to) {
      const s = this.nearest(from), g = this.nearest(to);
      if (s < 0 || g < 0) return [to.clone()];
      // A* con heap binario
      const n = pts.length, gs = core_navG(n), came = core_navC(n), closed = core_navClosed(n);
      core_navGen++;
      const open = [s]; gs[s] = 0; came[s] = -1; core_navSeen[s] = core_navGen;
      const fs = new Float32Array(1); // placeholder
      const f = i => gs[i] + pts[i].distanceTo(pts[g]);
      let iter = 0;
      while (open.length && iter++ < 4000) {
        let bi = 0, bf = Infinity;
        for (let k = 0; k < open.length; k++) { const v = f(open[k]); if (v < bf) { bf = v; bi = k; } }
        const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
        if (cur === g) break;
        closed[cur] = core_navGen;
        for (const nb of links[cur]) {
          if (closed[nb] === core_navGen) continue;
          const ng = gs[cur] + pts[cur].distanceTo(pts[nb]);
          if (core_navSeen[nb] !== core_navGen || ng < gs[nb]) {
            if (core_navSeen[nb] !== core_navGen) open.push(nb);
            core_navSeen[nb] = core_navGen; gs[nb] = ng; came[nb] = cur;
          }
        }
      }
      if (core_navSeen[g] !== core_navGen) return [pts[g].clone(), to.clone()];
      const out = []; let c = g; let guard = 0;
      while (c !== -1 && guard++ < 2000) { out.push(pts[c].clone()); c = came[c]; }
      out.reverse(); out.push(to.clone());
      return out;
    },
  };
  return nav;
}
let core_navGen = 1, core_navGs = null, core_navCame = null, core_navCl = null, core_navSeen = null;
function core_navG(n) { if (!core_navGs || core_navGs.length < n) { core_navGs = new Float32Array(n); core_navCame = new Int32Array(n); core_navCl = new Int32Array(n); core_navSeen = new Int32Array(n); } return core_navGs; }
function core_navC() { return core_navCame; }
function core_navClosed() { return core_navCl; }

// ---------- rng seminato ----------
function core_rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
