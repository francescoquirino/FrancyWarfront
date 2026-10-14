// ===================== GIOCATORE: input, movimento FPS, camera =====================
const INPUT = { keys: {}, mouse: { left: false, right: false }, dx: 0, dy: 0, wheel: 0, pressed: {}, locked: false };
addEventListener('keydown', e => { if (!INPUT.keys[e.code]) INPUT.pressed[e.code] = true; INPUT.keys[e.code] = true; if (['Space', 'Tab'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { INPUT.keys[e.code] = false; });
addEventListener('mousedown', e => { if (e.button === 0) { INPUT.mouse.left = true; INPUT.pressed.Mouse0 = true; } if (e.button === 2) INPUT.mouse.right = true; });
addEventListener('mouseup', e => { if (e.button === 0) INPUT.mouse.left = false; if (e.button === 2) INPUT.mouse.right = false; });
addEventListener('mousemove', e => { if (INPUT.locked) { INPUT.dx += e.movementX; INPUT.dy += e.movementY; } });
addEventListener('wheel', e => { INPUT.wheel += Math.sign(e.deltaY); });
addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => { INPUT.locked = document.pointerLockElement === G.renderer.domElement; if (!INPUT.locked && G.started && !G.over) MAIN.pause(true); });

const PLAYER = {
  init() {
    G.player = { pos: new THREE.Vector3(), eye: new THREE.Vector3(), yaw: 0, pitch: 0, vel: new THREE.Vector3(), hp: 100, alive: true,
      team: 'blue', isPlayer: true, id: 0, name: 'Francy', kills: 0, deaths: 0, crouch: false, onGround: true, lastHurt: -99 };
    this.bobT = 0; this.stepT = 0; this.eyeH = 1.65; this.deadT = 0; this.fov = 75; this.recoilKick = 0;
  },
  spawn(p) {
    const P = G.player; P.pos.copy(p); P.vel.set(0, 0, 0); P.hp = 100; P.alive = true; P.crouch = false;
    // guarda verso il centro della mappa
    P.yaw = Math.atan2(-(0 - p.x), -(0 - p.z)) + Math.PI; P.yaw = Math.atan2(p.x, p.z); P.pitch = 0;
    if (typeof WPN !== 'undefined' && WPN.reset) WPN.reset();
    HUD.dead(false);
  },
  die(killer) {
    this.deadT = 0; this.killer = killer;
    HUD.dead(true, killer ? killer.name : null);
  },
  update(dt) {
    const P = G.player, K = INPUT.keys;
    if (!P.alive) {
      // camera che scende dolcemente a terra (niente rollio)
      this.deadT += dt;
      this.eyeH = Math.max(0.35, this.eyeH - dt * 2.5);
      if (this.killer && this.killer.pos) {
        const dx = this.killer.pos.x - P.pos.x, dz = this.killer.pos.z - P.pos.z;
        const want = Math.atan2(-dx, -dz); let d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 3);
      }
      if (this.deadT > 4) MAIN.respawnPlayer();
      this.camera(dt);
      return;
    }
    // immortalità: tasto I
    if (INPUT.pressed.KeyI) { G.godMode = !G.godMode; P.hp = 100; HUD.banner(G.godMode ? 'IMMORTALE: ON' : 'IMMORTALE: OFF', 'tasto I'); }
    // vista
    const sens = 0.0022 * G.settings.sens * (WPN.isADS && WPN.isADS() ? (WPN.scopeActive && WPN.scopeActive() ? 0.3 : 0.6) : 1);
    P.yaw -= INPUT.dx * sens; P.pitch -= INPUT.dy * sens;
    P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch));
    // movimento
    let fx = 0, fz = 0;
    if (K.KeyW) fz -= 1; if (K.KeyS) fz += 1; if (K.KeyA) fx -= 1; if (K.KeyD) fx += 1;
    const len = Math.hypot(fx, fz); if (len > 0) { fx /= len; fz /= len; }
    P.crouch = !!(K.ControlLeft || K.KeyC);
    const ads = WPN.isADS && WPN.isADS();
    const sprint = !!K.ShiftLeft && fz < 0 && !P.crouch && !ads;
    const speed = P.crouch ? 2.2 : ads ? 2.8 : sprint ? 7.2 : 4.6;
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    const wx = (fx * cy + fz * sy) * speed, wz = (-fx * sy + fz * cy) * speed;
    const acc = P.onGround ? 14 : 3;
    P.vel.x += (wx - P.vel.x) * Math.min(1, acc * dt);
    P.vel.z += (wz - P.vel.z) * Math.min(1, acc * dt);
    if (INPUT.pressed.Space && P.onGround) { P.vel.y = 6.4; P.onGround = false; SFX.play('jump', null, 0.4); }
    const wasAir = !P.onGround, vy = P.vel.y;
    const res = moveWithCollision(P.pos, P.vel, dt, 0.35, P.crouch ? 1.2 : 1.8, P);
    if (wasAir && res.onGround && vy < -6) { SFX.play('land', null, 0.5); G.shake(0.08); }
    // limiti mappa
    const b = G.map && G.map.bounds;
    if (b) { P.pos.x = Math.max(b.minX + 1, Math.min(b.maxX - 1, P.pos.x)); P.pos.z = Math.max(b.minZ + 1, Math.min(b.maxZ - 1, P.pos.z)); }
    // passi
    const hs = Math.hypot(P.vel.x, P.vel.z);
    if (P.onGround && hs > 1) {
      this.bobT += dt * hs * 1.6; this.stepT += dt * hs;
      if (this.stepT > (sprint ? 2.4 : 1.9)) { this.stepT = 0; SFX.play({ snow: 'footstep_snow', harbor: 'footstep_metal', jungle: 'footstep_wood' }[G.map && G.map.def.id] || 'footstep', null, P.crouch ? 0.15 : 0.35); }
    }
    // rigenerazione salute
    if (G.time - P.lastHurt > 5 && P.hp < 100) P.hp = Math.min(100, P.hp + 25 * dt);
    this.eyeH += ((P.crouch ? 1.12 : 1.65) - this.eyeH) * Math.min(1, dt * 12);
    // armi
    const winp = {
      fire: INPUT.mouse.left, firePressed: !!INPUT.pressed.Mouse0, ads: INPUT.mouse.right, reload: !!INPUT.pressed.KeyR,
      switchTo: null, wheel: INPUT.wheel, grenade: !!INPUT.pressed.KeyG, moving: hs > 0.5, sprint, lookDX: INPUT.dx, lookDY: INPUT.dy,
    };
    for (let i = 1; i <= 9; i++) if (INPUT.pressed['Digit' + i]) winp.switchTo = i - 1;
    WPN.update(dt, winp);
    this.camera(dt, sprint);
  },
  camera(dt, sprint) {
    const P = G.player, cam = G.camera;
    P.eye.set(P.pos.x, P.pos.y + this.eyeH, P.pos.z);
    const hs = Math.hypot(P.vel.x, P.vel.z);
    const bob = P.alive && P.onGround ? Math.sin(this.bobT * 2) * 0.035 * Math.min(1, hs / 5) : 0;
    cam.position.set(P.eye.x, P.eye.y + bob, P.eye.z);
    // scossa: solo traslazione e piccolo pitch/yaw, MAI rollio
    core_shakeAmt = Math.max(0, core_shakeAmt - dt * 2.2);
    const s = URLP.has('noshake') ? 0 : core_shakeAmt * core_shakeAmt;
    const t = G.time * 40;
    cam.position.x += Math.sin(t * 1.3) * 0.06 * s; cam.position.y += Math.sin(t * 1.7) * 0.05 * s;
    cam.rotation.set(P.pitch + Math.sin(t * 1.1) * 0.012 * s, P.yaw + Math.sin(t * 0.9) * 0.012 * s, 0, 'YXZ');
    let want = (WPN.desiredFov ? WPN.desiredFov() : 75) || 75;
    if (sprint) want += 6;
    this.fov += (want - this.fov) * Math.min(1, dt * 10);
    if (Math.abs(cam.fov - this.fov) > 0.01) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
  },
};
