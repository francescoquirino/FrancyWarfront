// ===================== MAIN: partita, rotazione mappe, ciclo =====================
const MAIN = {
  MATCH: 15 * 60, PER_MAP: 150,
  matchLeft: 900, mapLeft: 150, mapIndex: 0, order: [], mapGroup: null,
  async boot() {
    env_initRenderer();
    if (typeof FX !== 'undefined' && FX.explosion) { const orig = FX.explosion.bind(FX); FX.explosion = (...a) => { window.main_boomCount = (window.main_boomCount || 0) + 1; return orig(...a); }; }
    await main_loadAssets();
    PLAYER.init();
    if (typeof FX !== 'undefined' && FX.init) FX.init(G);
    if (typeof WPN !== 'undefined' && WPN.init) WPN.init(G);
    if (typeof wpn_state !== 'undefined' && wpn_state.root) wpn_state.root.traverse(o => o.layers.set(1));
    this.mode = URLP.get('mode') || 'battle';
    this.setOrder();
    if (URLP.has('diff')) G.settings.difficulty = +URLP.get('diff');
    if (URLP.has('bots')) G.settings.botCount = +URLP.get('bots');
    this.loadMap(0);
    document.getElementById('loading').style.display = 'none';
    if (URLP.has('demo')) { this.startDemo(); }
    else if (URLP.has('autostart')) { window.WF_MODE = this.mode; this.start(); this.pause(true); }
    else document.getElementById('menu').style.display = 'flex';
    let last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      let dt = (now - last) / 1000; last = now;
      main_adaptive(dt);
      if (URLP.has('demo')) dt = 1 / 60;
      dt = Math.max(0, Math.min(0.05, dt));
      this.frame(dt);
    };
    requestAnimationFrame(loop);
  },
  setOrder() {
    const wanted = URLP.get('map');
    const city = MAPS.findIndex(m => m.id === 'city');
    if (wanted) { const i = MAPS.findIndex(m => m.id === wanted); this.order = [i >= 0 ? i : 0]; if (this.mode === 'blitz') this.order = [i, ...MAPS.map((m, j) => j).filter(j => j !== i && j !== city)]; return; }
    if (this.mode === 'battle') this.order = [city >= 0 ? city : Math.max(0, MAPS.findIndex(m => m.id === 'ruins'))];
    else this.order = MAPS.map((m, i) => i).filter(i => i !== city);
  },
  loadMap(k) {
    this.mapIndex = k;
    const def = MAPS[this.order[k]];
    if (this.mapGroup) {
      G.scene.remove(this.mapGroup);
      this.mapGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
    if (typeof BOT !== 'undefined' && BOT.clearAll) BOT.clearAll();
    core_gridClear();
    const t0 = performance.now();
    const kit = new Kit(1234 + k * 99);
    try { def.build(kit); } catch (e) { console.error('Errore nella mappa ' + def.id, e); main_err('Mappa ' + def.id + ': ' + e.message); }
    if (!core_grid.size) kit.ground(kit_mat('dirt'));
    main_scatterProps(kit, def);
    const half = (def.size || 140) / 2;
    const bounds = { minX: -half, maxX: half, minZ: -half, maxZ: half };
    // muri invisibili di bordo
    kit.collider(-half - 1, -2, -half - 1, -half, 60, half + 1); kit.collider(half, -2, -half - 1, half + 1, 60, half + 1);
    kit.collider(-half, -2, -half - 1, half, 60, -half); kit.collider(-half, -2, half, half, 60, half + 1);
    if (kit.spawns.blue.length < 2) for (let i = 0; i < 8; i++) kit.spawn('blue', -half * 0.5 + i * 3, half - 8);
    if (kit.spawns.red.length < 2) for (let i = 0; i < 8; i++) kit.spawn('red', -half * 0.5 + i * 3, -half + 8);
    this.mapGroup = kit.finish();
    G.scene.add(this.mapGroup);
    env_apply(def.env);
    G.map = { def, bounds, spawns: kit.spawns };
    G.nav = core_buildNav(kit.navPts, kit.navLinks, bounds);
    const t1 = performance.now();
    console.log(`mappa ${def.id}: ${G.colliders.length} collider, ${G.nav.points.length} nav, ${(t1 - t0) | 0} ms`);
    this.respawnPlayer(true);
    if (typeof BOT !== 'undefined' && BOT.spawnAll) BOT.spawnAll(G);
    G.renderer.compile(G.scene, G.camera);
    HUD.banner(def.name, this.mode === 'battle' ? 'Battaglia normale' : `Mappa ${k + 1} di ${this.order.length}`);
    const amb = { city: 'war_distant', neon: 'city_night_rain', ruins: 'war_distant', desert: 'desert_wind', harbor: 'harbor', snow: 'wind_snow', jungle: 'jungle' }[def.id] || 'war_distant';
    this.ambience = amb; if (SFX.ambience && G.started && !URLP.has('demo')) try { SFX.ambience(amb); } catch (e) { console.warn(e); }
  },
  respawnPlayer(first) {
    const sp = G.map.spawns.blue;
    let best = sp[0], bd = -1;
    for (const p of sp) {
      let d = 1e9; for (const b of G.bots) if (b.alive && b.team === 'red') d = Math.min(d, b.pos.distanceTo(p));
      if (first) d = URLP.has('demo') ? -sp.indexOf(p) : Math.random();
      if (d > bd) { bd = d; best = p; }
    }
    PLAYER.spawn(best);
  },
  start() {
    G.settings.difficulty = +document.getElementById('diff').value;
    G.settings.botCount = +document.getElementById('nbots').value;
    G.settings.sens = +document.getElementById('sens').value;
    document.getElementById('menu').style.display = 'none';
    SFX.init && SFX.init();
    if (SFX.ambience && this.ambience) try { SFX.ambience(this.ambience); } catch (e) { console.warn(e); }
    const mode = window.WF_MODE || this.mode;
    if (!G.started && mode !== this.mode) { this.mode = mode; this.setOrder(); this.loadMap(0); }
    this.PER_MAP = this.mode === 'battle' ? Infinity : 150;
    if (!G.started) {
      G.started = true; G.score.blue = 0; G.score.red = 0; this.matchLeft = this.MATCH; this.mapLeft = this.PER_MAP;
      if (typeof BOT !== 'undefined' && BOT.clearAll) { BOT.clearAll(); BOT.spawnAll(G); }
    }
    try { const p = G.renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    this.pause(false);
  },
  pause(on) {
    G.paused = on;
    document.getElementById('pausescr').style.display = on && G.started && !G.over ? 'flex' : 'none';
    if (on && G.started) {
      document.getElementById('psens').value = G.settings.sens; document.getElementById('pgod').textContent = G.godMode ? 'ON' : 'OFF';
      document.getElementById('pscore').innerHTML = HUD.scoreboard(); document.getElementById('pquit').style.display = 'none';
    }
  },
  setSens(v) { G.settings.sens = +v; const m = document.getElementById('sens'); if (m) m.value = v; },
  setVol(v) { try { SFX.setVolume && SFX.setVolume(+v); } catch (e) {} },
  toggleGod() { G.godMode = !G.godMode; if (G.player) G.player.hp = 100; document.getElementById('pgod').textContent = G.godMode ? 'ON' : 'OFF'; },
  restart() { const u = new URL(location.href); u.searchParams.set('mode', this.mode); u.searchParams.set('autostart', '1'); location.href = u.toString(); },
  quit() { try { window.close(); } catch (e) {} setTimeout(() => { document.getElementById('pquit').style.display = 'block'; }, 300); },
  resume() { try { const p = G.renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} this.pause(false); },
  startDemo() {
    G.started = true; G.paused = false;
    const c = URLP.get('cam');
    if (c) { const [x, y, z, yaw, pitch] = c.split(',').map(Number); this.demoCam = { x, y, z, yaw: yaw * Math.PI / 180, pitch: (pitch || 0) * Math.PI / 180 }; }
    this.demoFrames = 0;
  },
  nextMap() {
    const fade = document.getElementById('fade');
    fade.style.opacity = 1;
    setTimeout(() => { this.loadMap((this.mapIndex + 1) % this.order.length); this.mapLeft = this.PER_MAP; fade.style.opacity = 0; }, 650);
  },
  end() {
    G.over = true; G.paused = true; document.exitPointerLock();
    const win = G.score.blue > G.score.red ? 'VITTORIA!' : G.score.blue < G.score.red ? 'SCONFITTA' : 'PAREGGIO';
    document.getElementById('endtitle').textContent = win;
    document.getElementById('endscore').textContent = `BLU ${G.score.blue} — ${G.score.red} ROSSI`;
    document.getElementById('endtable').innerHTML = HUD.scoreboard();
    document.getElementById('endscr').style.display = 'flex';
  },
  frame(dt) {
    const tf0 = performance.now(); let tb = 0, tp = 0, tfx = 0;
    G.dt = dt;
    const demo = URLP.has('demo');
    if (demo) {
      // prove automatiche: ?w=N arma, ?fire=1 spara, ?ads=1 mira, ?yaw=gradi
      if (this.demoFrames === 2 && URLP.has('w')) INPUT.pressed['Digit' + URLP.get('w')] = true;
      if (this.demoFrames === 1 && URLP.has('yaw')) { G.player.yaw = +URLP.get('yaw') * Math.PI / 180; G.player.pitch = +(URLP.get('pitch') || 0) * Math.PI / 180; }
      if (URLP.has('fire') && this.demoFrames > 8) INPUT.mouse.left = true;
      if (URLP.has('ads') && this.demoFrames > 4) INPUT.mouse.right = true;
    }
    if (!G.paused) {
      G.time += dt;
      if (!demo || !this.demoCam) PLAYER.update(dt);
      const tb0 = performance.now();
      if (typeof BOT !== 'undefined' && BOT.updateAll) BOT.updateAll(dt);
      tb = performance.now() - tb0; this._botMs = (this._botMs || 0) * 0.95 + tb * 0.05;
      if (typeof WPN !== 'undefined' && WPN.updateProjectiles) WPN.updateProjectiles(dt);
      // respawn dei bot
      for (const b of G.bots) if (!b.alive && G.time - (b.diedAt || 0) > 4) {
        const sp = G.map.spawns[b.team]; b.respawn(sp[Math.floor(Math.random() * sp.length)].clone().add(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5)));
      }
      main_botLOD();
      if (typeof FX !== 'undefined' && FX.update) FX.update(dt);
      if (G.started && !demo) {
        this.matchLeft -= dt; this.mapLeft -= dt;
        if (this.matchLeft <= 0) this.end();
        else if (this.mapLeft <= 0 && !this._switching) { this._switching = true; this.nextMap(); setTimeout(() => this._switching = false, 1500); }
      }
    }
    if (demo && URLP.has('look') && G.bots.length) {
      // foto ritratto: camera davanti al soldato n. look
      const b = G.bots[+URLP.get('look') % G.bots.length], f = new THREE.Vector3(-Math.sin(b.yaw), 0, -Math.cos(b.yaw));
      this.demoCam = { x: b.pos.x + f.x * 2.6 + 0.6, y: b.pos.y + 1.5, z: b.pos.z + f.z * 2.6 + 0.6, yaw: 0, pitch: 0 };
      const cam = G.camera; cam.position.set(this.demoCam.x, this.demoCam.y, this.demoCam.z); cam.lookAt(b.pos.x, b.pos.y + 1.0, b.pos.z);
      this.demoCam.yaw = cam.rotation.y; this.demoCam.pitch = cam.rotation.x;
      const e = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ'); this.demoCam.yaw = e.y; this.demoCam.pitch = e.x;
    }
    if (demo && this.demoCam) {
      const d = this.demoCam; G.camera.position.set(d.x, d.y, d.z); G.camera.rotation.set(d.pitch, d.yaw, 0, 'YXZ');
      G.player.pos.set(d.x, d.y - 1.65, d.z);
      if (typeof wpn_state !== 'undefined' && wpn_state.root) wpn_state.root.visible = false;
    }
    env_followShadow(demo && this.demoCam ? G.camera.position : G.player.pos);
    env_update(dt);
    if (typeof SFX !== 'undefined' && SFX.update) SFX.update(G.camera.position, G.player.yaw);
    if (G.started) HUD.update(dt);
    INPUT.dx = 0; INPUT.dy = 0; INPUT.wheel = 0; INPUT.pressed = {};
    const tr0 = performance.now();
    ENV.composer.render();
    const trn = performance.now() - tr0; this._renMs = (this._renMs || 0) * 0.95 + trn * 0.05;
    const tot = performance.now() - tf0;
    if (tot > 20) { (window.__spikes || (window.__spikes = [])).push({ t: +G.time.toFixed(1), tot: +tot.toFixed(1), bot: +tb.toFixed(1), ren: +trn.toFixed(1) }); if (window.__spikes.length > 30) window.__spikes.shift(); }
    if (demo) {
      this.demoFrames++;
      const nowT = performance.now(); (this._ft || (this._ft = [])).push(nowT - (this._lt || nowT)); this._lt = nowT; if (this._ft.length > 120) this._ft.shift();
      if (this.demoFrames === +(URLP.get('frames') || 30)) {
        const info = G.renderer.info.render;
        const st = { map: G.map.def.id, calls: info.calls, tris: info.triangles, colliders: G.colliders.length, nav: G.nav.points.length, bots: G.bots.length, alive: G.bots.filter(b => b.alive).length, score: G.score, t: G.time.toFixed(1), fps: (() => { const a = (this._ft || []).slice(10).sort((x, y) => x - y); return a.length ? { p50: +(1000 / a[a.length >> 1]).toFixed(0), p95: +(1000 / a[Math.floor(a.length * 0.95)]).toFixed(0) } : null; })(), booms: window.main_boomCount || 0, spikes: (window.__spikes || []).slice(-8), botMs: +(this._botMs || 0).toFixed(2), botMeshes: (() => { let n = 0, sh = 0; if (G.bots[0]) G.bots[0].model.traverse(o => { if (o.isMesh) { n++; if (o.castShadow) sh++; } }); return [n, sh]; })(), renMs: +(this._renMs || 0).toFixed(2), arms: ASSETS.arms ? Object.keys(ASSETS.arms) : null, props: ASSETS.props ? Object.keys(ASSETS.props).length : 0, hp: G.player.hp, kills: G.player.kills, wpn: (typeof wpn_state !== 'undefined') ? { ammo: WPN.ammo(), sw: wpn_state.switching, sprint: wpn_state.sprint, rel: wpn_state.reloadActive, thr: wpn_state.throwTime, cur: wpn_state.current } : null, mouse: INPUT.mouse.left };
        window.__STATE__ = st;
        const pre = document.createElement('pre'); pre.id = 'state'; pre.textContent = JSON.stringify(st); pre.style.display = 'none'; document.body.appendChild(pre);
        document.title = 'READY';
      }
    }
  },
};
async function main_glb(b64) {
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
  return await new Promise((res, rej) => new GLTFLoader().parse(bin, '', res, rej));
}
async function main_loadAssets() {
  if (typeof ASSETS_CITY_B64 !== 'undefined' && ASSETS_CITY_B64) {
    try { const g = await main_glb(ASSETS_CITY_B64); ASSETS.cityScene = g.scene; console.log('città Blender caricata'); }
    catch (e) { console.warn('GLB città non caricato', e); }
  }
  for (const [b64, dst] of [[typeof ASSETS_PROPS_B64 !== 'undefined' ? ASSETS_PROPS_B64 : '', 'props'], [typeof ASSETS_ARMS_B64 !== 'undefined' ? ASSETS_ARMS_B64 : '', 'arms'], [typeof ASSETS_PROPS2_B64 !== 'undefined' ? ASSETS_PROPS2_B64 : '', 'props'], [typeof ASSETS_PROPS3_B64 !== 'undefined' ? ASSETS_PROPS3_B64 : '', 'props']]) {
    if (!b64) continue;
    try {
      const g = await main_glb(b64); ASSETS[dst] = ASSETS[dst] || {};
      for (const ch of g.scene.children) { ch.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); ASSETS[dst][ch.name] = ch; }
      // radici annidate (es. ARMS_ROOT > ARM_R): registra anche i figli con nome MAIUSCOLO
      g.scene.traverse(o => { if (o !== g.scene && /^[A-Z][A-Z0-9_]+$/.test(o.name) && !ASSETS[dst][o.name] && !o.isMesh) ASSETS[dst][o.name] = o; });
      console.log('asset ' + dst + ':', Object.keys(ASSETS[dst]).join(','));
    } catch (e) { console.warn('GLB ' + dst + ' non caricato', e); }
  }
  if (typeof ASSETS_GLB_B64 === 'undefined' || !ASSETS_GLB_B64) return;
  try {
    const bin = Uint8Array.from(atob(ASSETS_GLB_B64), c => c.charCodeAt(0)).buffer;
    const gltf = await new Promise((res, rej) => new GLTFLoader().parse(bin, '', res, rej));
    for (const ch of gltf.scene.children) {
      ch.traverse(o => { if (o.isMesh) { o.castShadow = true; } if (o.name.startsWith('muzzle')) o.name = 'muzzle'; if (o.name.startsWith('lhand')) o.name = 'lhand'; });
      ASSETS.weapons[ch.name] = ch;
    }
    console.log('armi Blender:', Object.keys(ASSETS.weapons).join(','));
  } catch (e) { console.warn('GLB armi non caricato', e); }
}
// unisce i pezzi di un soldato che hanno lo stesso genitore (osso) e lo stesso materiale
function main_mergeSoldier(root) {
  const groups = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.children.length || !o.parent || Array.isArray(o.material) || o.userData.keep) return;
    const k = o.parent.uuid + '|' + o.material.uuid;
    let g = groups.get(k); if (!g) groups.set(k, g = []); g.push(o);
  });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const parent = list[0].parent, geos = [];
    for (const o of list) {
      o.updateMatrix();
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(o.matrix); geos.push(g);
    }
    const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose());
    if (!merged) continue;
    const mm = new THREE.Mesh(merged, list[0].material);
    mm.castShadow = list.some(o => o.castShadow); mm.receiveShadow = true; mm.renderOrder = list[0].renderOrder;
    for (const o of list) { o.visible = false; parent.remove(o); }
    parent.add(mm);
  }
}
// livello di dettaglio dei soldati: pezzi piccoli nascosti da lontano, ombre solo da vicino
let main_lodTick = 0;
function main_botLOD() {
  if ((main_lodTick++ & 7) !== 0) return;
  const cam = G.camera.position;
  for (const b of G.bots) {
    const m = b.model; if (!m) continue;
    if (!m.userData.merged) { main_mergeSoldier(m); m.userData.merged = true; }
    if (!m.userData.lod) {
      const small = [], all = [];
      m.traverse(o => { if (!o.isMesh) return; all.push(o); if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const sc = Math.max(o.scale.x, o.scale.y, o.scale.z); if (o.geometry.boundingSphere.radius * sc < 0.11) small.push(o); });
      m.userData.lod = { small, all, level: -1 };
    }
    if (URLP.has('hidebots')) m.visible = false;
    const d = cam.distanceTo(b.pos), L = m.userData.lod;
    const lvl = d < 18 ? 0 : d < 40 ? 1 : 2;
    if (lvl === L.level) continue;
    L.level = lvl;
    for (const o of L.small) o.visible = lvl === 0;
    for (const o of L.all) o.castShadow = lvl === 0 ? !L.small.includes(o) || true : lvl === 1 ? !L.small.includes(o) : false;
  }
}
// veicoli e oggetti di Blender sparsi negli spazi liberi (diventano coperture)
const MAIN_PROPS = {
  city: { TANK: 1, HUMVEE: 2, CAR_BURNT: 8, BUS: 1, JERSEY: 10, SANDBAGS: 12, BARBED_WIRE: 6, CRATE: 6, BARREL: 8, TIRE_STACK: 4, DUMPSTER: 3 },
  desert: { TANK: 2, HUMVEE: 3, TRUCK: 2, HELI: 1, JERSEY: 8, SANDBAGS: 8, CRATE: 10, AMMO_BOX: 8, BARREL: 10, GENERATOR: 2, ANTENNA: 1 },
  ruins: { TANK: 2, HUMVEE: 2, TRUCK: 1, JERSEY: 10, SANDBAGS: 12, CRATE: 6, BARREL: 8 },
  snow: { TRUCK: 2, HUMVEE: 2, TANK: 1, JERSEY: 6, SANDBAGS: 6, CRATE: 8, BARREL: 10, GENERATOR: 2 },
  harbor: { HUMVEE: 2, TRUCK: 2, JERSEY: 8, SANDBAGS: 6, CRATE: 10, BARREL: 8, GENERATOR: 1 },
  neon: { HUMVEE: 3, JERSEY: 12, SANDBAGS: 8, CRATE: 6, BARREL: 6 },
  jungle: { HUMVEE: 2, TRUCK: 1, SANDBAGS: 8, CRATE: 10, AMMO_BOX: 8, BARREL: 6, GENERATOR: 1, ANTENNA: 1 },
};
function main_scatterProps(kit, def) {
  if (!ASSETS.props || URLP.get('props') === '0') return;
  const want = MAIN_PROPS[def.id] || {}, half = (def.size || 140) / 2 - 6, rnd = core_rng(4242 + def.id.length * 17);
  const spawns = [...kit.spawns.blue, ...kit.spawns.red];
  const size = {}; let placed = 0;
  for (const name of Object.keys(want)) {
    const src = ASSETS.props[name]; if (!src) continue;
    const bb = new THREE.Box3().setFromObject(src); size[name] = bb.getSize(new THREE.Vector3());
    const r = Math.max(size[name].x, size[name].z) / 2 + 0.8;
    for (let n = 0, tries = 0; n < want[name] && tries < 400; tries++) {
      const x = (rnd() * 2 - 1) * (half - r), z = (rnd() * 2 - 1) * (half - r);
      const gy = groundHeightAt(x, 1.0, z); if (gy < -0.5 || gy > 0.4) continue;
      if (spawns.some(p => Math.hypot(p.x - x, p.z - z) < r + 6)) continue;
      const list = core_query(x - r, z - r, x + r, z + r);
      if (list.some(b => b.max.y > gy + 0.25 && b.min.y < gy + 6 && x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z)) continue;
      kit.prop(name, x, gy, z, rnd() * Math.PI * 2); n++; placed++;
    }
  }
  console.warn('INFO oggetti Blender piazzati: ' + placed);
}
// risoluzione che si adatta: se i fotogrammi rallentano abbassa un po' i pixel, se c'è margine li rialza
const MAIN_Q = { scale: 1, acc: 0, n: 0, cool: 0 };
function main_adaptive(dt) {
  if (URLP.has('demo') || G.paused || dt <= 0 || dt > 0.25) return;
  MAIN_Q.acc += dt; MAIN_Q.n++; MAIN_Q.cool -= dt;
  if (MAIN_Q.acc < 1.0) return;
  const avg = MAIN_Q.acc / MAIN_Q.n * 1000; MAIN_Q.acc = 0; MAIN_Q.n = 0;
  let s = MAIN_Q.scale;
  if (avg > 14.5 && s > 0.55) s = Math.max(0.55, s - 0.1);
  else if (avg < 8.5 && s < 1 && MAIN_Q.cool <= 0) s = Math.min(1, s + 0.05);
  else return;
  if (Math.abs(s - MAIN_Q.scale) < 0.01) return;
  MAIN_Q.scale = s; MAIN_Q.cool = 3;
  const pr = Math.min(window.devicePixelRatio || 1, 1.5) * s;
  G.renderer.setPixelRatio(pr); ENV.composer.setPixelRatio(pr); ENV.composer.setSize(innerWidth, innerHeight);
}
window.MAIN = MAIN; window.SFX = SFX; // i pulsanti dell'HTML (onclick) lo cercano qui
function main_err(msg) { const e = document.getElementById('err'); e.style.display = 'block'; e.textContent += msg + '\n'; }
addEventListener('error', e => main_err(e.message + ' (' + (e.filename || '').split('/').pop() + ':' + e.lineno + ')'));
MAIN.boot().catch(e => {
  console.error(e);
  if (/WebGL/i.test(e.message)) main_err('Il browser non riesce a usare la scheda video (WebGL).\nApri il gioco con GIOCA.sh (sulla Scrivania: "GIOCA Francy Warfront")\noppure in Chrome accendi: Impostazioni > Sistema > Usa l\'accelerazione grafica.');
  else main_err('Avvio: ' + e.message);
});
