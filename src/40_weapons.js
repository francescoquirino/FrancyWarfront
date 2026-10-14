

const WPN_DEFS = [
  {
    id: 'AR', name: "Fucile d'assalto", slot: 1,
    damage: 28, headMult: 2, rpm: 750, mag: 30, reserve: 150, reload: 2.2,
    spread: 0.012, adsSpread: 0.0015, recoil: 0.014,
    range: 220, pellets: 1, auto: true, sound: 'rifle', projectile: 'hitscan',
    adsFov: 55, sightY: 0.135, muzzleZ: -0.74
  },
  {
    id: 'SMG', name: 'Mitra', slot: 2,
    damage: 20, headMult: 1.8, rpm: 950, mag: 35, reserve: 175, reload: 1.85,
    spread: 0.017, adsSpread: 0.0028, recoil: 0.009,
    range: 125, pellets: 1, auto: true, sound: 'smg', projectile: 'hitscan',
    adsFov: 55, sightY: 0.135, muzzleZ: -0.56
  },
  {
    id: 'SHOTGUN', name: 'Fucile a pompa', slot: 3,
    damage: 12, headMult: 1.5, rpm: 80, mag: 8, reserve: 48, reload: 2.8,
    spread: 0.052, adsSpread: 0.037, recoil: 0.044,
    range: 85, pellets: 8, auto: false, sound: 'shotgun', projectile: 'hitscan',
    adsFov: 55, sightY: 0.115, muzzleZ: -0.88
  },
  {
    id: 'SNIPER', name: 'Fucile di precisione', slot: 4,
    damage: 120, headMult: 2, rpm: 45, mag: 5, reserve: 25, reload: 3.1,
    spread: 0.015, adsSpread: 0.00012, recoil: 0.05,
    range: 520, pellets: 1, auto: false, sound: 'sniper', projectile: 'hitscan',
    adsFov: 20, sightY: 0.15, muzzleZ: -1.0
  },
  {
    id: 'PISTOL', name: 'Pistola', slot: 5,
    damage: 30, headMult: 2, rpm: 360, mag: 15, reserve: 75, reload: 1.45,
    spread: 0.016, adsSpread: 0.003, recoil: 0.022,
    range: 125, pellets: 1, auto: false, sound: 'pistol', projectile: 'hitscan',
    adsFov: 55, sightY: 0.10, muzzleZ: -0.36
  },
  {
    id: 'LMG', name: 'Mitragliatrice leggera', slot: 6,
    damage: 26, headMult: 1.8, rpm: 650, mag: 100, reserve: 300, reload: 4.8,
    spread: 0.021, adsSpread: 0.003, recoil: 0.017,
    range: 260, pellets: 1, auto: true, sound: 'lmg', projectile: 'hitscan',
    adsFov: 55, sightY: 0.135, muzzleZ: -0.92
  },
  {
    id: 'RPG', name: 'Lanciarazzi', slot: 7,
    damage: 140, headMult: 1, rpm: 45, mag: 1, reserve: 5, reload: 3.4,
    spread: 0.008, adsSpread: 0.002, recoil: 0.045,
    range: 280, pellets: 1, auto: false, sound: 'rocket', projectile: 'rocket',
    adsFov: 55, sightY: 0.175, muzzleZ: -0.82,
    blastRadius: 6
  },
  {
    id: 'GRENADE', name: 'Granata', slot: 8,
    damage: 150, headMult: 1, rpm: 40, mag: 1, reserve: 3, reload: 0.85,
    spread: 0, adsSpread: 0, recoil: 0,
    range: 55, pellets: 1, auto: false, sound: 'grenade_pin', projectile: 'grenade',
    adsFov: 75, sightY: 0.08, muzzleZ: -0.22,
    blastRadius: 7
  }
];

const wpn_state = {
  G: null,
  root: null,
  models: [],
  materials: null,
  geometry: null,
  assetMaterials: new WeakMap(),
  current: 0,
  requested: 0,
  switching: false,
  switchTime: 0,
  switchTarget: 0,
  switchCommitted: false,
  reloadActive: false,
  reloadTime: 0,
  ads: 0,
  adsTarget: false,
  moving: false,
  sprint: false,
  clock: 0,
  bob: 0,
  swayX: 0,
  swayY: 0,
  kick: 0,
  recoilPitch: 0,
  recoilYaw: 0,
  throwTime: 0,
  quickCooldown: 0,
  emptyCooldown: 0,
  previousFire: false,
  previousReload: false,
  previousGrenade: false,
  ammo: WPN_DEFS.map(def => ({
    mag: def.mag, reserve: def.reserve, cooldown: 0, bloom: 0
  })),
  projectiles: [],
  projectileCursor: 0,
  rocketMesh: null,
  grenadeMesh: null,
  map: null,
  scopeCanvas: null,
  scopeWidth: 0,
  scopeHeight: 0,
  scopeVisible: false
};

const wpn_scratch = {
  object: new THREE.Object3D(),
  cameraPosition: new THREE.Vector3(),
  cameraQuaternion: new THREE.Quaternion(),
  origin: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  aim: new THREE.Vector3(),
  target: new THREE.Vector3(),
  muzzle: new THREE.Vector3(),
  right: new THREE.Vector3(),
  up: new THREE.Vector3(),
  shotOrigin: new THREE.Vector3(),
  shotBase: new THREE.Vector3(),
  shotDirection: new THREE.Vector3(),
  shotRight: new THREE.Vector3(),
  shotUp: new THREE.Vector3(),
  endpoint: new THREE.Vector3(),
  displacement: new THREE.Vector3(),
  trail: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  armDirection: new THREE.Vector3(),
  axisY: new THREE.Vector3(0, 1, 0),
  axisZ: new THREE.Vector3(0, 0, 1),
  forward: new THREE.Vector3(0, 0, -1),
  scale: new THREE.Vector3(1, 1, 1),
  worldOptions: { ignore: null, entities: false },
  shotOptions: { ignore: null, entities: true },
  sweep: { hit: false, t: 1, nx: 0, ny: 1, nz: 0, depth: 0 }
};

function wpn_sound(name, pos, volume = 1) {
  if (typeof SFX !== 'undefined') SFX.play(name, pos, volume);
}

function wpn_material(options) {
  return new THREE.MeshStandardMaterial({
    ...options
  });
}

function wpn_camoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('WPN: Canvas 2D non disponibile.');
  ctx.fillStyle = '#596247';
  ctx.fillRect(0, 0, 128, 128);
  const colors = ['#333b2f', '#7a7755', '#494f37', '#9b9069'];
  let seed = 1717;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 65; i++) {
    const x = random() * 128;
    const y = random() * 128;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 7; j++) {
      const angle = j * Math.PI * 2 / 7;
      const radius = 7 + random() * 17;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function wpn_part(parent, type, material, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(wpn_state.geometry[type], material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.set(rx, ry, rz);
  mesh.renderOrder = 30;
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

function wpn_armSegment(parent, material, ax, ay, az, bx, by, bz, radius) {
  const mesh = new THREE.Mesh(wpn_state.geometry.cylinder, material);
  mesh.position.set((ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5);
  wpn_scratch.armDirection.set(bx - ax, by - ay, bz - az);
  const length = wpn_scratch.armDirection.length();
  wpn_scratch.armDirection.divideScalar(length);
  mesh.quaternion.setFromUnitVectors(wpn_scratch.axisY, wpn_scratch.armDirection);
  mesh.scale.set(radius * 2, length, radius * 2);
  mesh.renderOrder = 30;
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

function wpn_hands(parent, def) {
  const m = wpn_state.materials;
  const pistol = def.id === 'PISTOL';
  const grenade = def.id === 'GRENADE';
  const rightZ = grenade ? -0.13 : pistol ? 0.025 : 0.055;
  const leftZ = grenade ? -0.21 : pistol ? -0.065 : def.id === 'RPG' ? -0.36 : -0.34;

  if (ASSETS.arms && ASSETS.arms.ARM_R && ASSETS.arms.ARM_L) {
    // braccia modellate in Blender: mano all'origine, braccio lungo -Z (gomito a +Z)
    const put = (src, hx, hy, hz, ex, ey, ez) => {
      const a = src.clone(true);
      a.traverse(o => { if (o.isMesh) { o.renderOrder = 30; o.frustumCulled = false; o.castShadow = false; } });
      a.position.set(hx, hy, hz);
      const d = new THREE.Vector3(hx - ex, hy - ey, hz - ez).normalize();
      a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), d);
      a.scale.set(1, 1, 1.15); // braccio più lungo: il fondo della manica resta sempre fuori dallo schermo
      parent.add(a);
    };
    // punti di presa dal modello Blender: impugnatura = origine del modello, guardamano = empty 'lhand'
    parent.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
    const content = parent.children.find(c => c.getObjectByName && (c.getObjectByName('muzzle') || c.getObjectByName('lhand')));
    const R = new THREE.Vector3(0.055, -0.125, rightZ), L = new THREE.Vector3(-0.045, -0.095, leftZ);
    if (content) {
      R.setFromMatrixPosition(content.matrixWorld).applyMatrix4(inv);
      const lh = content.getObjectByName('lhand');
      if (lh) L.setFromMatrixPosition(lh.matrixWorld).applyMatrix4(inv);
    }
    put(ASSETS.arms.ARM_R, R.x, R.y, R.z, R.x + 0.10, R.y - 0.55, R.z + 0.22);
    if (def.id !== 'PISTOL' && def.id !== 'GRENADE') put(ASSETS.arms.ARM_L, L.x, L.y, L.z, L.x - 0.10, L.y - 0.55, L.z + 0.20);
    else put(ASSETS.arms.ARM_L, R.x - 0.05, R.y - 0.01, R.z + 0.02, R.x - 0.16, R.y - 0.55, R.z + 0.22);
    return;
  }
  wpn_armSegment(parent, m.camo, 0.19, -0.23, 0.19, 0.075, -0.145, rightZ + 0.055, 0.042);
  wpn_armSegment(parent, m.camo, -0.20, -0.23, 0.18, -0.06, -0.105, leftZ + 0.07, 0.041);

  for (let side = 0; side < 2; side++) {
    const x = side === 0 ? 0.055 : -0.045;
    const y = side === 0 ? -0.125 : -0.095;
    const z = side === 0 ? rightZ : leftZ;
    wpn_part(parent, 'box', m.glove, x, y, z, 0.065, 0.065, 0.09, 0.2, 0, side ? -0.18 : 0.15);
    wpn_part(parent, 'box', m.sand, x, y + 0.034, z + 0.004, 0.048, 0.012, 0.055);
    wpn_part(parent, 'box', m.polymer, x, y - 0.022, z + 0.056, 0.07, 0.034, 0.027);
    for (let finger = 0; finger < 4; finger++) {
      wpn_part(
        parent, 'box', m.glove,
        x + (finger - 1.5) * 0.013, y - 0.02, z - 0.035,
        0.011, 0.042, 0.022, -0.45
      );
    }
    wpn_part(parent, 'box', m.glove, x + (side ? 0.033 : -0.033), y + 0.004, z - 0.02,
      0.023, 0.033, 0.033, 0, 0, side ? -0.45 : 0.45);
  }
}

function wpn_redDot(parent, y, z) {
  const m = wpn_state.materials;
  wpn_part(parent, 'box', m.metal, 0, y - 0.035, z, 0.075, 0.025, 0.095);
  wpn_part(parent, 'box', m.metal, -0.036, y, z, 0.014, 0.063, 0.022);
  wpn_part(parent, 'box', m.metal, 0.036, y, z, 0.014, 0.063, 0.022);
  wpn_part(parent, 'box', m.metal, 0, y + 0.033, z, 0.085, 0.012, 0.026);
  wpn_part(parent, 'box', m.glass, 0, y, z, 0.060, 0.052, 0.003);
  wpn_part(parent, 'sphere', m.dot, 0, y, z + 0.006, 0.0035, 0.0035, 0.0035);
  wpn_part(parent, 'cylinder', m.metal, 0.048, y - 0.019, z,
    0.025, 0.023, 0.025, 0, 0, Math.PI / 2);
}

function wpn_scope(parent, y, z, length = 0.31) {
  const m = wpn_state.materials;
  for (const offset of [-0.075, 0.07]) {
    wpn_part(parent, 'box', m.metal, 0, y - 0.052, z + offset, 0.065, 0.04, 0.028);
    wpn_part(parent, 'ring', m.metal, 0, y, z + offset, 0.073, 0.073, 0.025);
  }
  wpn_part(parent, 'cylinder', m.metal, 0, y, z, 0.066, length, 0.066, Math.PI / 2);
  wpn_part(parent, 'cylinder', m.polymer, 0, y, z - length * 0.45,
    0.086, 0.065, 0.086, Math.PI / 2);
  wpn_part(parent, 'cylinder', m.polymer, 0, y, z + length * 0.45,
    0.079, 0.045, 0.079, Math.PI / 2);
  wpn_part(parent, 'cylinder', m.lens, 0, y, z + length * 0.5 + 0.005,
    0.059, 0.003, 0.059, Math.PI / 2);
  wpn_part(parent, 'cylinder', m.metal, 0, y + 0.043, z,
    0.035, 0.036, 0.035);
  wpn_part(parent, 'cylinder', m.metal, 0.045, y, z,
    0.035, 0.032, 0.035, 0, 0, Math.PI / 2);
}

function wpn_procedural(def) {
  const group = new THREE.Group();
  group.name = `wpn_${def.id}`;
  const m = wpn_state.materials;
  let magazine = null;

  if (def.id === 'GRENADE') {
    wpn_part(group, 'sphere', m.olive, 0, 0, -0.17, 0.095, 0.135, 0.095);
    wpn_part(group, 'cylinder', m.metal, 0, 0.08, -0.17, 0.043, 0.038, 0.043);
    wpn_part(group, 'box', m.sand, 0.024, 0.036, -0.17, 0.016, 0.12, 0.026, 0, 0, -0.2);
    wpn_part(group, 'ring', m.metal, -0.028, 0.085, -0.17, 0.035, 0.035, 0.02, 0, Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      wpn_part(group, 'ring', m.polymer, 0, -0.038 + i * 0.027, -0.17,
        0.092, 0.092, 0.009, Math.PI / 2);
    }
  } else if (def.id === 'PISTOL') {
    wpn_part(group, 'box', m.metal, 0, 0.029, -0.12, 0.056, 0.074, 0.31);
    wpn_part(group, 'box', m.polymer, 0, -0.039, -0.092, 0.058, 0.055, 0.23);
    wpn_part(group, 'box', m.polymer, 0, -0.135, 0.004, 0.056, 0.15, 0.09, -0.18);
    wpn_part(group, 'box', m.metal, 0, -0.096, -0.075, 0.013, 0.045, 0.02, -0.3);
    wpn_part(group, 'box', m.polymer, 0, -0.109, -0.088, 0.062, 0.012, 0.115);
    wpn_part(group, 'box', m.polymer, -0.027, -0.083, -0.138, 0.009, 0.053, 0.014);
    wpn_part(group, 'box', m.polymer, 0.027, -0.083, -0.138, 0.009, 0.053, 0.014);
    wpn_part(group, 'cylinder', m.metal, 0, 0.026, -0.295, 0.021, 0.12, 0.021, Math.PI / 2);
    wpn_part(group, 'ring', m.metal, 0, 0.026, -0.359, 0.026, 0.026, 0.015);
    for (let i = 0; i < 7; i++) {
      wpn_part(group, 'box', m.sand, 0.029, 0.022, 0.005 - i * 0.009,
        0.002, 0.044, 0.003, 0.15);
    }
    wpn_redDot(group, def.sightY, 0.005);
    magazine = new THREE.Group();
    magazine.position.set(0, -0.135, 0.012);
    wpn_part(magazine, 'box', m.metal, 0, 0, 0, 0.043, 0.14, 0.065, -0.18);
    wpn_part(magazine, 'box', m.polymer, 0, -0.079, 0.014, 0.065, 0.017, 0.087);
    group.add(magazine);
  } else if (def.id === 'RPG') {
    wpn_part(group, 'cylinder', m.olive, 0, 0.015, -0.13, 0.16, 1.08, 0.16, Math.PI / 2);
    wpn_part(group, 'cylinder', m.metal, 0, 0.015, -0.72, 0.19, 0.15, 0.19, Math.PI / 2);
    wpn_part(group, 'ring', m.metal, 0, 0.015, -0.805, 0.20, 0.20, 0.055);
    wpn_part(group, 'cylinder', m.polymer, 0, 0.015, 0.29, 0.19, 0.18, 0.19, Math.PI / 2);
    wpn_part(group, 'box', m.polymer, 0, -0.123, 0.035, 0.065, 0.18, 0.09, -0.18);
    wpn_part(group, 'box', m.sand, 0, -0.042, -0.36, 0.13, 0.10, 0.25);
    for (let i = 0; i < 5; i++) {
      wpn_part(group, 'ring', m.metal, 0, 0.015, -0.45 + i * 0.16, 0.17, 0.17, 0.025);
    }
    wpn_scope(group, def.sightY, -0.12, 0.23);
    magazine = new THREE.Group();
    magazine.position.set(0, 0.015, -0.67);
    wpn_part(magazine, 'cone', m.olive, 0, 0, -0.1, 0.13, 0.22, 0.13, -Math.PI / 2);
    wpn_part(magazine, 'cylinder', m.metal, 0, 0, 0, 0.06, 0.12, 0.06, Math.PI / 2);
    group.add(magazine);
  } else {
    const smg = def.id === 'SMG';
    const shotgun = def.id === 'SHOTGUN';
    const sniper = def.id === 'SNIPER';
    const lmg = def.id === 'LMG';
    const handLength = smg ? 0.21 : sniper ? 0.41 : 0.31;
    const handZ = smg ? -0.26 : sniper ? -0.37 : -0.31;

    wpn_part(group, 'box', m.metal, 0, 0, -0.10,
      lmg ? 0.115 : 0.088, 0.115, sniper ? 0.40 : 0.34);
    wpn_part(group, 'box', m.polymer, 0, -0.019, 0.22, 0.075, 0.115, 0.28);
    wpn_part(group, 'box', m.polymer, 0, -0.015, 0.375, 0.092, 0.145, 0.035);
    wpn_part(group, 'cylinder', m.metal, 0, 0.021, 0.10, 0.027, 0.19, 0.027, Math.PI / 2);
    wpn_part(group, 'box', m.polymer, 0, -0.131, 0.025, 0.068, 0.16, 0.086, -0.25);
    wpn_part(group, 'box', m.metal, 0, -0.087, -0.052, 0.013, 0.039, 0.024, -0.4);
    wpn_part(group, 'box', m.polymer, 0, -0.112, -0.061, 0.069, 0.012, 0.117);
    wpn_part(group, 'box', m.polymer, -0.03, -0.09, -0.113, 0.009, 0.047, 0.016);
    wpn_part(group, 'box', m.polymer, 0.03, -0.09, -0.113, 0.009, 0.047, 0.016);
    wpn_part(group, 'box', shotgun ? m.polymer : m.sand, 0, -0.008, handZ,
      0.10, 0.102, handLength);

    const barrelBack = handZ - handLength * 0.30;
    const barrelFront = def.muzzleZ + 0.045;
    wpn_part(group, 'cylinder', m.metal, 0, 0.004, (barrelBack + barrelFront) * 0.5,
      shotgun ? 0.038 : 0.024, barrelBack - barrelFront, shotgun ? 0.038 : 0.024,
      Math.PI / 2);
    wpn_part(group, 'cylinder', m.metal, 0, 0.004, def.muzzleZ + 0.026,
      0.040, 0.065, 0.040, Math.PI / 2);
    wpn_part(group, 'ring', m.metal, 0, 0.004, def.muzzleZ - 0.008,
      0.044, 0.044, 0.02);

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      wpn_part(group, 'box', m.polymer,
        Math.cos(angle) * 0.019, 0.004 + Math.sin(angle) * 0.019,
        def.muzzleZ + 0.01, 0.009, 0.009, 0.035);
    }

    for (let i = 0; i < 12; i++) {
      const z = 0.028 - i * 0.036;
      wpn_part(group, 'box', m.metal, 0, 0.069, z, 0.063, 0.014, 0.019);
    }
    for (let i = 0; i < 7; i++) {
      const z = handZ - handLength * 0.38 + i * handLength * 0.11;
      wpn_part(group, 'box', m.polymer, -0.052, -0.007, z, 0.006, 0.025, 0.022);
      wpn_part(group, 'box', m.polymer, 0.052, -0.007, z, 0.006, 0.025, 0.022);
    }

    wpn_part(group, 'box', m.sand, 0.049, 0.018, -0.069, 0.008, 0.035, 0.085);
    wpn_part(group, 'cylinder', m.metal, -0.052, -0.009, 0.005,
      0.018, 0.012, 0.018, 0, 0, Math.PI / 2);

    if (sniper) {
      wpn_scope(group, def.sightY, -0.15, 0.36);
      wpn_part(group, 'cylinder', m.metal, 0.079, -0.008, 0.033,
        0.016, 0.105, 0.016, 0, 0, Math.PI / 2);
      wpn_part(group, 'sphere', m.polymer, 0.136, -0.018, 0.033, 0.035, 0.035, 0.035);
    } else if (shotgun) {
      wpn_part(group, 'box', m.metal, 0, def.sightY, 0.004, 0.065, 0.026, 0.023);
      wpn_part(group, 'box', m.polymer, 0, def.sightY, 0.017, 0.028, 0.01, 0.025);
      wpn_part(group, 'sphere', m.dot, 0, def.sightY, -0.67, 0.005, 0.005, 0.005);
      wpn_part(group, 'cylinder', m.metal, 0, -0.05, -0.41, 0.032, 0.47, 0.032, Math.PI / 2);
      for (let i = 0; i < 6; i++) {
        wpn_part(group, 'box', m.sand, 0.051, -0.024, -0.22 - i * 0.045,
          0.018, 0.041, 0.021);
      }
    } else {
      wpn_redDot(group, def.sightY, -0.105);
    }

    magazine = new THREE.Group();
    magazine.position.set(0, -0.104, -0.126);
    group.add(magazine);

    if (def.id === 'AR') {
      for (let i = 0; i < 5; i++) {
        const z = i * 0.012;
        wpn_part(magazine, 'box', m.polymer, 0, -i * 0.044, z,
          0.062, 0.057, 0.125, -0.10 - i * 0.065);
        wpn_part(magazine, 'box', m.sand, 0.032, -i * 0.044, z,
          0.003, 0.028, 0.084, -0.10 - i * 0.065);
      }
    } else if (lmg) {
      wpn_part(magazine, 'box', m.olive, 0, -0.073, 0, 0.17, 0.18, 0.14);
      wpn_part(magazine, 'box', m.polymer, 0, -0.169, 0, 0.18, 0.018, 0.15);
      for (let i = 0; i < 9; i++) {
        wpn_part(group, 'cylinder', m.brass, 0.07 + i * 0.013, -0.012, -0.13,
          0.008, 0.033, 0.008, Math.PI / 2);
      }
      for (const side of [-1, 1]) {
        wpn_part(group, 'cylinder', m.metal, side * 0.045, -0.09, -0.53,
          0.015, 0.22, 0.015, -0.45, 0, side * 0.25);
        wpn_part(group, 'box', m.polymer, side * 0.074, -0.185, -0.48,
          0.033, 0.02, 0.053);
      }
    } else if (shotgun) {
      wpn_part(magazine, 'cylinder', m.metal, 0, 0.038, -0.24,
        0.026, 0.26, 0.026, Math.PI / 2);
    } else {
      wpn_part(magazine, 'box', m.polymer, 0, sniper ? -0.037 : -0.10, 0,
        0.058, sniper ? 0.085 : 0.22, smg ? 0.074 : 0.115, smg ? -0.08 : 0);
      for (let i = 0; i < 4; i++) {
        wpn_part(magazine, 'box', m.sand, 0.030, -0.025 - i * 0.035, 0,
          0.003, 0.013, smg ? 0.06 : 0.09);
      }
    }
  }

  const muzzle = new THREE.Object3D();
  muzzle.name = 'muzzle';
  muzzle.position.set(0, def.id === 'RPG' ? 0.015 : 0.004, def.muzzleZ);
  group.add(muzzle);
  return { group, muzzle, magazine };
}

function wpn_assetMaterial(material) {
  let copy = wpn_state.assetMaterials.get(material);
  if (!copy) {
    copy = material.clone();
    // vetri/lenti del modello Blender: trasparenti e incolori (si mira attraverso)
    if (/red_?dot|reticle|dot/i.test(material.name || '')) {
      // punto rosso del mirino: acceso e visibile (non toccato dalla tonemap)
      copy = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.0, 0.01), toneMapped: false, transparent: true, depthTest: false });
    }
    if (/lens|glass/i.test(material.name || '')) {
      copy.transparent = true; copy.opacity = 0.12; copy.depthWrite = false;
      if (copy.color) copy.color.set(0xdfe8ea);
      if ('metalness' in copy) { copy.metalness = 0; copy.roughness = 0.05; }
    }
    wpn_state.assetMaterials.set(material, copy);
  }
  return copy;
}

function wpn_buildModel(def) {
  const wrapper = new THREE.Group();
  let muzzle;
  let magazine;
  let content;
  const asset = typeof ASSETS !== 'undefined' && ASSETS.weapons && ASSETS.weapons[def.id];

  if (asset) {
    if (!asset.isObject3D) throw new Error(`WPN: ASSETS.weapons.${def.id} non è un Object3D.`);
    content = asset.clone(true);
    content.traverse(node => {
      if (!node.isMesh) return;
      // il punto rosso del mirino olografico: 4 volte più grande, così si vede bene mirando
      if (!Array.isArray(node.material) && /red_?dot/i.test(node.material.name || '')) {
        const g = node.geometry.clone(); g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3());
        g.translate(-c.x, -c.y, -c.z); g.scale(4, 4, 4); g.translate(c.x, c.y, c.z); node.geometry = g; node.userData.redDot = true;
      }
      node.material = Array.isArray(node.material)
        ? node.material.map(wpn_assetMaterial)
        : wpn_assetMaterial(node.material);
      node.castShadow = false;
      if (node.userData.redDot) node.renderOrder = 40; // dopo la lente trasparente
      node.receiveShadow = false;
      node.renderOrder = 30;
      node.frustumCulled = false;
    });
    muzzle = content.getObjectByName('muzzle');
    magazine = content.getObjectByName('magazine') || content.getObjectByName('mag');
    if (!muzzle) {
      muzzle = new THREE.Object3D();
      muzzle.name = 'muzzle';
      muzzle.position.set(0, 0.004, def.muzzleZ);
      content.add(muzzle);
    }
  } else {
    const procedural = wpn_procedural(def);
    content = procedural.group;
    muzzle = procedural.muzzle;
    magazine = procedural.magazine;
  }

  wrapper.add(content);
  wpn_hands(wrapper, def);
  wrapper.visible = false;
  wpn_state.root.add(wrapper);
  return {
    group: wrapper,
    muzzle,
    magazine,
    magazinePosition: magazine ? magazine.position.clone() : null,
    magazineQuaternion: magazine ? magazine.quaternion.clone() : null,
    magazineScale: magazine ? magazine.scale.clone() : null
  };
}

function wpn_restoreMagazine(model) {
  if (!model || !model.magazine) return;
  model.magazine.position.copy(model.magazinePosition);
  model.magazine.quaternion.copy(model.magazineQuaternion);
  model.magazine.scale.copy(model.magazineScale);
  model.magazine.visible = true;
}

function wpn_cancelReload() {
  wpn_restoreMagazine(wpn_state.models[wpn_state.current]);
  wpn_state.reloadActive = false;
  wpn_state.reloadTime = 0;
}

function wpn_startReload() {
  const def = WPN_DEFS[wpn_state.current];
  const ammo = wpn_state.ammo[wpn_state.current];
  if (wpn_state.reloadActive || wpn_state.switching || wpn_state.throwTime > 0 ||
      ammo.mag >= def.mag || ammo.reserve <= 0 || !wpn_state.G.player.alive) return false;
  wpn_state.reloadActive = true;
  wpn_state.reloadTime = 0;
  wpn_sound('reload', null);
  return true;
}

function wpn_beginSwitch(index) {
  if (index === wpn_state.current) return;
  wpn_cancelReload();
  wpn_state.switching = true;
  wpn_state.switchTime = 0;
  wpn_state.switchTarget = index;
  wpn_state.switchCommitted = false;
  wpn_state.adsTarget = false;
  wpn_sound('switch', null);
}

function wpn_requestSwitch(index) {
  if (!Number.isInteger(index) || index < 0 || index >= WPN_DEFS.length) return;
  wpn_state.requested = index;
  if (!wpn_state.switching && wpn_state.throwTime <= 0) wpn_beginSwitch(index);
  else if (wpn_state.switching && !wpn_state.switchCommitted) wpn_state.switchTarget = index;
}

function wpn_basis(direction, right, up) {
  right.set(-direction.z, 0, direction.x);
  if (right.lengthSq() < 0.000001) right.set(1, 0, 0);
  right.normalize();
  up.crossVectors(right, direction).normalize();
}

function wpn_spread(base, right, up, spread, result) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * Math.tan(spread);
  result.copy(base)
    .addScaledVector(right, Math.cos(angle) * radius)
    .addScaledVector(up, Math.sin(angle) * radius)
    .normalize();
}

function wpn_resolveDefinition(id) {
  if (typeof id === 'number') return Number.isInteger(id) ? WPN_DEFS[id] : undefined;
  if (typeof id !== 'string') return undefined;
  const key = id.toUpperCase();
  for (const def of WPN_DEFS) if (def.id === key) return def;
  return undefined;
}

function wpn_projectilePool() {
  const body = new THREE.CylinderGeometry(0.032, 0.032, 0.25, 10);
  body.rotateX(-Math.PI / 2);
  const nose = new THREE.ConeGeometry(0.047, 0.16, 10);
  nose.rotateX(-Math.PI / 2);
  nose.translate(0, 0, -0.20);
  const finsA = new THREE.BoxGeometry(0.13, 0.007, 0.10);
  finsA.translate(0, 0, 0.10);
  const finsB = new THREE.BoxGeometry(0.007, 0.13, 0.10);
  finsB.translate(0, 0, 0.10);
  const rocketGeometry = mergeGeometries([body, nose, finsA, finsB], false);
  body.dispose();
  nose.dispose();
  finsA.dispose();
  finsB.dispose();
  if (!rocketGeometry) throw new Error('WPN: geometria del razzo non unificabile.');

  const grenadeGeometry = new THREE.SphereGeometry(0.095, 10, 8);
  grenadeGeometry.scale(1, 1.18, 1);
  const rocketMaterial = new THREE.MeshStandardMaterial({
    color: 0x77734d, roughness: 0.5, metalness: 0.55
  });
  const grenadeMaterial = new THREE.MeshStandardMaterial({
    color: 0x566044, roughness: 0.75, metalness: 0.22
  });
  wpn_state.rocketMesh = new THREE.InstancedMesh(rocketGeometry, rocketMaterial, 128);
  wpn_state.grenadeMesh = new THREE.InstancedMesh(grenadeGeometry, grenadeMaterial, 128);

  for (const mesh of [wpn_state.rocketMesh, wpn_state.grenadeMesh]) {
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    wpn_state.G.scene.add(mesh);
  }
  for (let i = 0; i < 128; i++) {
    wpn_state.projectiles.push({
      active: false,
      type: '',
      p: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      v: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      axis: new THREE.Vector3(0.6, 0.3, 0.7).normalize(),
      angle: 0,
      spin: 8,
      age: 0,
      fuse: 3,
      distance: 0,
      trailTime: 0,
      settled: false,
      attacker: null,
      def: null,
      options: { ignore: null, entities: true }
    });
  }
  wpn_clearProjectiles();
}

function wpn_hideProjectile(index) {
  wpn_scratch.object.position.set(0, 0, 0);
  wpn_scratch.object.quaternion.identity();
  wpn_scratch.object.scale.set(0, 0, 0);
  wpn_scratch.object.updateMatrix();
  wpn_state.rocketMesh.setMatrixAt(index, wpn_scratch.object.matrix);
  wpn_state.grenadeMesh.setMatrixAt(index, wpn_scratch.object.matrix);
}

function wpn_clearProjectiles() {
  if (!wpn_state.rocketMesh) return;
  for (let i = 0; i < wpn_state.projectiles.length; i++) {
    const projectile = wpn_state.projectiles[i];
    projectile.active = false;
    projectile.attacker = null;
    projectile.options.ignore = null;
    wpn_hideProjectile(i);
  }
  wpn_state.rocketMesh.instanceMatrix.needsUpdate = true;
  wpn_state.grenadeMesh.instanceMatrix.needsUpdate = true;
}

function wpn_launch(entity, def, origin, direction) {
  let index = -1;
  for (let n = 0; n < wpn_state.projectiles.length; n++) {
    const i = (wpn_state.projectileCursor + n) % wpn_state.projectiles.length;
    if (!wpn_state.projectiles[i].active) {
      index = i;
      break;
    }
  }
  if (index < 0) return false;
  wpn_state.projectileCursor = (index + 1) % wpn_state.projectiles.length;
  const p = wpn_state.projectiles[index];
  p.active = true;
  p.type = def.projectile;
  p.p.copy(origin);
  p.previous.copy(origin);
  p.dir.copy(direction).normalize();
  p.v.copy(p.dir).multiplyScalar(p.type === 'rocket' ? 70 : 16);
  if (p.type === 'grenade') p.v.y += 4;
  p.attacker = entity;
  p.options.ignore = entity;
  p.def = def;
  p.age = 0;
  p.fuse = 3;
  p.distance = 0;
  p.trailTime = 0;
  p.angle = Math.random() * Math.PI * 2;
  p.spin = 7 + Math.random() * 5;
  p.settled = false;
  p.q.setFromUnitVectors(wpn_scratch.forward, p.dir);
  wpn_drawProjectile(index);
  return true;
}

function wpn_drawProjectile(index) {
  const p = wpn_state.projectiles[index];
  const mesh = p.type === 'rocket' ? wpn_state.rocketMesh : wpn_state.grenadeMesh;
  wpn_scratch.object.position.copy(p.p);
  wpn_scratch.object.quaternion.copy(p.q);
  wpn_scratch.object.scale.set(1, 1, 1);
  wpn_scratch.object.updateMatrix();
  mesh.setMatrixAt(index, wpn_scratch.object.matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

function wpn_detonate(index) {
  const p = wpn_state.projectiles[index];
  if (!p.active) return;
  p.active = false;
  wpn_hideProjectile(index);
  FX.explosion(p.p, p.def.blastRadius);
  explosionDamage(p.p, p.def.blastRadius, p.def.damage, p.attacker, p.def.name);
  wpn_sound('explosion', p.p);
  p.attacker = null;
  p.options.ignore = null;
}

function wpn_emitShot(entity, def, origin, direction, playerSound) {
  wpn_scratch.shotOrigin.copy(origin);
  wpn_scratch.shotBase.copy(direction).normalize();

  if (def.projectile !== 'hitscan') {
    if (!wpn_launch(entity, def, wpn_scratch.shotOrigin, wpn_scratch.shotBase)) return false;
    if (def.projectile === 'rocket') FX.muzzle(wpn_scratch.shotOrigin, wpn_scratch.shotBase, 1.5);
    wpn_sound(def.sound, playerSound ? null : wpn_scratch.shotOrigin);
    return true;
  }

  FX.muzzle(
    wpn_scratch.shotOrigin, wpn_scratch.shotBase,
    def.id === 'SNIPER' || def.id === 'SHOTGUN' ? 1.35 : def.id === 'PISTOL' ? 0.55 : 1
  );
  wpn_sound(def.sound, playerSound ? null : wpn_scratch.shotOrigin);
  wpn_scratch.shotOptions.ignore = entity;
  wpn_basis(wpn_scratch.shotBase, wpn_scratch.shotRight, wpn_scratch.shotUp);

  const pelletSpread = def.pellets > 1
    ? THREE.MathUtils.lerp(def.spread, def.adsSpread, playerSound ? wpn_state.ads : 0)
    : 0;

  for (let pellet = 0; pellet < def.pellets; pellet++) {
    if (pelletSpread > 0) {
      wpn_spread(
        wpn_scratch.shotBase, wpn_scratch.shotRight, wpn_scratch.shotUp,
        pelletSpread, wpn_scratch.shotDirection
      );
    } else {
      wpn_scratch.shotDirection.copy(wpn_scratch.shotBase);
    }
    const hit = raycastWorld(
      wpn_scratch.shotOrigin, wpn_scratch.shotDirection, def.range,
      wpn_scratch.shotOptions
    );
    if (hit) {
      wpn_scratch.endpoint.copy(hit.point);
      FX.tracer(wpn_scratch.shotOrigin, wpn_scratch.endpoint);
      FX.impact(hit.point, hit.normal, hit.kind);
      if (hit.kind === 'entity') {
        applyDamage(
          hit.entity, def.damage * (hit.head ? def.headMult : 1),
          entity, def.name, hit.point
        );
      }
    } else {
      wpn_scratch.endpoint.copy(wpn_scratch.shotOrigin)
        .addScaledVector(wpn_scratch.shotDirection, def.range);
      FX.tracer(wpn_scratch.shotOrigin, wpn_scratch.endpoint);
    }
  }
  return true;
}

function wpn_playerAim(def, spread, quickGrenade) {
  const camera = wpn_state.G.camera;
  camera.updateWorldMatrix(true, false);
  camera.getWorldPosition(wpn_scratch.cameraPosition);
  camera.getWorldQuaternion(wpn_scratch.cameraQuaternion);
  wpn_scratch.aim.copy(wpn_scratch.forward).applyQuaternion(wpn_scratch.cameraQuaternion);
  wpn_basis(wpn_scratch.aim, wpn_scratch.right, wpn_scratch.up);

  if (spread > 0) {
    wpn_spread(wpn_scratch.aim, wpn_scratch.right, wpn_scratch.up, spread, wpn_scratch.direction);
  } else {
    wpn_scratch.direction.copy(wpn_scratch.aim);
  }

  if (quickGrenade || def.projectile === 'grenade') {
    wpn_scratch.origin.copy(wpn_scratch.cameraPosition)
      .addScaledVector(wpn_scratch.right, 0.12)
      .addScaledVector(wpn_scratch.aim, 0.35);
    wpn_scratch.origin.y -= 0.12;
    wpn_scratch.direction.y += 0.12;
    wpn_scratch.direction.normalize();
  } else {
    wpn_state.root.updateWorldMatrix(true, true);
    wpn_state.models[wpn_state.current].muzzle.getWorldPosition(wpn_scratch.origin);
    wpn_scratch.shotOptions.ignore = wpn_state.G.player;
    const hit = raycastWorld(
      wpn_scratch.cameraPosition, wpn_scratch.direction, def.range,
      wpn_scratch.shotOptions
    );
    if (hit) wpn_scratch.target.copy(hit.point);
    else wpn_scratch.target.copy(wpn_scratch.cameraPosition)
      .addScaledVector(wpn_scratch.direction, def.range);
  }

  // Il controllo parte dall'occhio per impedire spari oltre un muro attraversato dal modello.
  wpn_scratch.displacement.subVectors(wpn_scratch.origin, wpn_scratch.cameraPosition);
  const offset = wpn_scratch.displacement.length();
  if (offset > 0.00001) {
    wpn_scratch.displacement.divideScalar(offset);
    const obstruction = raycastWorld(
      wpn_scratch.cameraPosition, wpn_scratch.displacement, offset,
      wpn_scratch.worldOptions
    );
    if (obstruction) {
      wpn_scratch.origin.copy(obstruction.point).addScaledVector(obstruction.normal, 0.025);
    }
  }

  if (!quickGrenade && def.projectile !== 'grenade') {
    wpn_scratch.direction.subVectors(wpn_scratch.target, wpn_scratch.origin);
    if (wpn_scratch.direction.lengthSq() < 0.000001 ||
        wpn_scratch.direction.dot(wpn_scratch.aim) <= 0) {
      wpn_scratch.direction.copy(wpn_scratch.aim);
    } else {
      wpn_scratch.direction.normalize();
    }
  }
}

function wpn_applyRecoil(def) {
  const player = wpn_state.G.player;
  const amount = def.recoil * THREE.MathUtils.lerp(1, 0.67, wpn_state.ads);
  const pitchBefore = player.pitch;
  player.pitch = THREE.MathUtils.clamp(player.pitch + amount, -Math.PI / 2 + 0.04, Math.PI / 2 - 0.04);
  wpn_state.recoilPitch += player.pitch - pitchBefore;
  const yaw = (Math.random() - 0.5) * amount * 0.32;
  player.yaw += yaw;
  wpn_state.recoilYaw += yaw;
  wpn_state.kick = Math.min(2, wpn_state.kick + (def.id === 'PISTOL' ? 0.6 : 1));
}

function wpn_firePlayer() {
  const def = WPN_DEFS[wpn_state.current];
  const ammo = wpn_state.ammo[wpn_state.current];
  if (ammo.mag <= 0) {
    if (ammo.reserve > 0) wpn_startReload();
    else if (wpn_state.emptyCooldown <= 0) {
      wpn_sound('empty', null);
      wpn_state.emptyCooldown = 0.3;
    }
    return false;
  }

  let spread = THREE.MathUtils.lerp(def.spread, def.adsSpread, wpn_state.ads);
  if (def.pellets > 1) spread *= 0.16;
  spread += ammo.bloom * THREE.MathUtils.lerp(1, 0.28, wpn_state.ads);
  spread *= wpn_state.moving ? 1.35 : 0.65;
  wpn_playerAim(def, spread, false);
  if (!wpn_emitShot(wpn_state.G.player, def, wpn_scratch.origin, wpn_scratch.direction, true)) {
    return false;
  }

  ammo.mag--;
  ammo.bloom = Math.min(0.045, ammo.bloom + (def.auto ? 0.0032 : 0.006));
  wpn_applyRecoil(def);

  if (def.projectile === 'hitscan') {
    wpn_state.models[wpn_state.current].muzzle.getWorldPosition(wpn_scratch.muzzle);
    wpn_scratch.muzzle.addScaledVector(wpn_scratch.aim, -0.27);
    wpn_scratch.muzzle.addScaledVector(wpn_scratch.right, 0.06);
    FX.casing(wpn_scratch.muzzle, wpn_scratch.right);
  }
  if (def.projectile === 'grenade') wpn_state.throwTime = 0.5;
  if (ammo.mag === 0 && ammo.reserve > 0 && def.projectile !== 'grenade') wpn_startReload();
  return true;
}

function wpn_quickGrenade() {
  if (wpn_state.quickCooldown > 0 || wpn_state.throwTime > 0 || wpn_state.switching) return;
  const ammo = wpn_state.ammo[7];
  if (ammo.mag <= 0 && ammo.reserve <= 0) {
    if (wpn_state.emptyCooldown <= 0) {
      wpn_sound('empty', null);
      wpn_state.emptyCooldown = 0.3;
    }
    return;
  }

  wpn_playerAim(WPN_DEFS[7], 0, true);
  if (!wpn_emitShot(wpn_state.G.player, WPN_DEFS[7], wpn_scratch.origin, wpn_scratch.direction, true)) {
    return;
  }
  wpn_cancelReload();
  if (ammo.mag > 0) ammo.mag--;
  else ammo.reserve--;
  ammo.cooldown = 60 / WPN_DEFS[7].rpm;
  wpn_state.quickCooldown = 1;
  wpn_state.throwTime = 0.5;
}

function wpn_pose() {
  if (!wpn_state.root) return;
  const def = WPN_DEFS[wpn_state.current];
  const ads = wpn_state.ads;
  const bobScale = wpn_state.moving ? (wpn_state.sprint ? 1.7 : 1) * (1 - ads * 0.85) : 0;
  const bobX = Math.sin(wpn_state.bob) * 0.009 * bobScale;
  const bobY = Math.cos(wpn_state.bob * 2) * 0.008 * bobScale;
  const lower = wpn_state.switching ? Math.sin(wpn_state.switchTime / 0.35 * Math.PI) * 0.34 : 0;
  const reloadProgress = wpn_state.reloadActive ? wpn_state.reloadTime / def.reload : 0;
  const reloadCurve = Math.sin(Math.PI * Math.min(1, reloadProgress));
  const throwCurve = wpn_state.throwTime > 0 ? Math.sin(wpn_state.throwTime / 0.5 * Math.PI) : 0;
  const sprint = wpn_state.sprint ? 1 - ads : 0;

  wpn_state.root.position.set(
    THREE.MathUtils.lerp(0.235, 0, ads) + bobX + wpn_state.swayX * (1 - ads * 0.8),
    THREE.MathUtils.lerp(-0.25, -def.sightY, ads) + bobY - lower -
      reloadCurve * 0.13 - throwCurve * 0.17 - sprint * 0.08,
    THREE.MathUtils.lerp(-0.43, -0.40, ads) + wpn_state.kick * 0.047 + reloadCurve * 0.09
  );
  wpn_state.root.rotation.set(
    wpn_state.kick * 0.038 + wpn_state.swayY * 0.7 + reloadCurve * 0.55 + throwCurve * 0.45,
    wpn_state.swayX * -0.65 + sprint * 0.33,
    reloadCurve * -0.38 + sprint * -0.34
  );

  const model = wpn_state.models[wpn_state.current];
  if (model && model.magazine) {
    wpn_restoreMagazine(model);
    if (wpn_state.reloadActive) {
      const excursion = Math.sin(Math.PI * Math.min(1, reloadProgress / 0.9));
      model.magazine.position.y -= excursion * 0.25;
      model.magazine.position.z += excursion * 0.10;
      model.magazine.visible = !(reloadProgress > 0.28 && reloadProgress < 0.62);
    }
  }

  wpn_state.root.visible = wpn_state.G.player.alive && !WPN.scopeActive();
}

function wpn_scopeDraw() {
  const canvas = wpn_state.scopeCanvas;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  if (width === wpn_state.scopeWidth && height === wpn_state.scopeHeight) return;
  wpn_state.scopeWidth = width;
  wpn_state.scopeHeight = height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('WPN: mirino Canvas 2D non disponibile.');

  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * 0.425;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0,0,0,0.985)';
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill('evenodd');

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.strokeStyle = 'rgba(15,17,13,0.95)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx - radius * 0.32, cy);
  ctx.moveTo(cx + radius * 0.32, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy + radius * 0.32);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    const d = radius * 0.10 * i;
    ctx.beginPath();
    ctx.moveTo(cx + d, cy - 4);
    ctx.lineTo(cx + d, cy + 4);
    ctx.moveTo(cx - 4, cy + d);
    ctx.lineTo(cx + 4, cy + d);
    ctx.stroke();
  }
  ctx.fillStyle = '#a82720';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wpn_scopeUpdate() {
  if (!wpn_state.scopeCanvas) return;
  const visible = WPN.scopeActive();
  if (visible) wpn_scopeDraw();
  if (visible !== wpn_state.scopeVisible) {
    wpn_state.scopeVisible = visible;
    wpn_state.scopeCanvas.style.display = visible ? 'block' : 'none';
  }
}

function wpn_sweepGrenade(pos, dx, dy, dz, radius) {
  const result = wpn_scratch.sweep;
  result.hit = false;
  result.t = 1;
  result.depth = 0;

  if (pos.y < radius) {
    result.hit = true;
    result.t = 0;
    result.nx = 0;
    result.ny = 1;
    result.nz = 0;
    result.depth = radius - pos.y;
  } else if (dy < 0 && pos.y + dy <= radius) {
    result.hit = true;
    result.t = (radius - pos.y) / dy;
    result.nx = 0;
    result.ny = 1;
    result.nz = 0;
  }

  for (const box of wpn_state.G.colliders) {
    const minX = box.min.x - radius;
    const minY = box.min.y - radius;
    const minZ = box.min.z - radius;
    const maxX = box.max.x + radius;
    const maxY = box.max.y + radius;
    const maxZ = box.max.z + radius;

    if (Math.max(pos.x, pos.x + dx) < minX || Math.min(pos.x, pos.x + dx) > maxX ||
        Math.max(pos.y, pos.y + dy) < minY || Math.min(pos.y, pos.y + dy) > maxY ||
        Math.max(pos.z, pos.z + dz) < minZ || Math.min(pos.z, pos.z + dz) > maxZ) continue;

    if (pos.x > minX && pos.x < maxX && pos.y > minY && pos.y < maxY &&
        pos.z > minZ && pos.z < maxZ) {
      let depth = pos.x - minX;
      let nx = -1;
      let ny = 0;
      let nz = 0;
      if (maxX - pos.x < depth) {
        depth = maxX - pos.x; nx = 1;
      }
      if (pos.y - minY < depth) {
        depth = pos.y - minY; nx = 0; ny = -1; nz = 0;
      }
      if (maxY - pos.y < depth) {
        depth = maxY - pos.y; nx = 0; ny = 1; nz = 0;
      }
      if (pos.z - minZ < depth) {
        depth = pos.z - minZ; nx = 0; ny = 0; nz = -1;
      }
      if (maxZ - pos.z < depth) {
        depth = maxZ - pos.z; nx = 0; ny = 0; nz = 1;
      }
      if (!result.hit || result.t > 0 || depth < result.depth) {
        result.hit = true;
        result.t = 0;
        result.depth = depth;
        result.nx = nx;
        result.ny = ny;
        result.nz = nz;
      }
      continue;
    }

    let enter = -Infinity;
    let exit = Infinity;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let valid = true;

    for (let axis = 0; axis < 3; axis++) {
      const origin = axis === 0 ? pos.x : axis === 1 ? pos.y : pos.z;
      const delta = axis === 0 ? dx : axis === 1 ? dy : dz;
      const minimum = axis === 0 ? minX : axis === 1 ? minY : minZ;
      const maximum = axis === 0 ? maxX : axis === 1 ? maxY : maxZ;
      if (Math.abs(delta) < 0.000000001) {
        if (origin < minimum || origin > maximum) {
          valid = false;
          break;
        }
        continue;
      }
      let near = (minimum - origin) / delta;
      let far = (maximum - origin) / delta;
      const sign = delta > 0 ? -1 : 1;
      if (near > far) {
        const swap = near;
        near = far;
        far = swap;
      }
      if (near > enter) {
        enter = near;
        nx = axis === 0 ? sign : 0;
        ny = axis === 1 ? sign : 0;
        nz = axis === 2 ? sign : 0;
      }
      exit = Math.min(exit, far);
      if (enter > exit) {
        valid = false;
        break;
      }
    }

    if (valid && enter >= 0 && enter <= result.t && enter <= 1 && exit >= 0) {
      result.hit = true;
      result.t = enter;
      result.depth = 0;
      result.nx = nx;
      result.ny = ny;
      result.nz = nz;
    }
  }
  return result;
}

function wpn_moveGrenade(projectile, dt) {
  if (projectile.settled) return;
  projectile.v.y -= 9.81 * dt;
  let remaining = dt;

  for (let bounce = 0; bounce < 4 && remaining > 0.000001; bounce++) {
    const dx = projectile.v.x * remaining;
    const dy = projectile.v.y * remaining;
    const dz = projectile.v.z * remaining;
    const hit = wpn_sweepGrenade(projectile.p, dx, dy, dz, 0.105);
    if (!hit.hit) {
      projectile.p.x += dx;
      projectile.p.y += dy;
      projectile.p.z += dz;
      break;
    }

    projectile.p.x += dx * hit.t + hit.nx * (hit.depth + 0.002);
    projectile.p.y += dy * hit.t + hit.ny * (hit.depth + 0.002);
    projectile.p.z += dz * hit.t + hit.nz * (hit.depth + 0.002);
    const incoming = projectile.v.x * hit.nx + projectile.v.y * hit.ny + projectile.v.z * hit.nz;
    if (incoming < 0) {
      projectile.v.x -= hit.nx * incoming * 1.43;
      projectile.v.y -= hit.ny * incoming * 1.43;
      projectile.v.z -= hit.nz * incoming * 1.43;
      projectile.v.multiplyScalar(0.76);
      projectile.spin *= 0.73;
    }
    remaining *= 1 - hit.t;
    if (hit.ny > 0.5 && projectile.v.lengthSq() < 0.45) {
      projectile.v.set(0, 0, 0);
      projectile.settled = true;
      break;
    }
  }

  projectile.angle += projectile.spin * dt;
  projectile.q.setFromAxisAngle(projectile.axis, projectile.angle);
}

const WPN = {
  init(game) {
    if (!game || !game.camera || !game.scene || !game.player || !game.colliders) {
      throw new Error('WPN.init: servono camera, scene, player e colliders.');
    }
    wpn_state.G = game;
    wpn_state.map = game.map;

    if (!wpn_state.root) {
      wpn_state.root = new THREE.Group();
      wpn_state.root.name = 'wpn_viewmodel';
      game.camera.add(wpn_state.root);
      wpn_state.geometry = {
        box: new THREE.BoxGeometry(1, 1, 1),
        cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
        cone: new THREE.ConeGeometry(0.5, 1, 12),
        sphere: new THREE.SphereGeometry(0.5, 10, 8),
        ring: new THREE.TorusGeometry(0.5, 0.075, 6, 16)
      };
      wpn_state.materials = {
        metal: wpn_material({ color: 0x282d31, roughness: 0.45, metalness: 0.8 }),
        polymer: wpn_material({ color: 0x303632, roughness: 0.7, metalness: 0.05 }),
        sand: wpn_material({ color: 0xb4a07b, roughness: 0.68, metalness: 0.12 }),
        olive: wpn_material({ color: 0x596148, roughness: 0.7, metalness: 0.15 }),
        glove: wpn_material({ color: 0x454b40, roughness: 0.88 }),
        brass: wpn_material({ color: 0xb79850, roughness: 0.4, metalness: 0.8 }),
        camo: wpn_material({ map: wpn_camoTexture(), roughness: 0.95 }),
        glass: new THREE.MeshPhysicalMaterial({
          color: 0x74a7ab, roughness: 0.12, metalness: 0.05,
          transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false
        }),
        lens: new THREE.MeshPhysicalMaterial({
          color: 0xdfe8ea, roughness: 0.05, metalness: 0,
          transparent: true, opacity: 0.12, depthWrite: false
        }),
        dot: new THREE.MeshBasicMaterial({
          color: new THREE.Color(2.8, 0.055, 0.02)
        })
      };
      for (const def of WPN_DEFS) wpn_state.models.push(wpn_buildModel(def));
      wpn_projectilePool();

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:100;';
      (document.body || document.documentElement).appendChild(canvas);
      wpn_state.scopeCanvas = canvas;
    } else {
      game.camera.add(wpn_state.root);
      game.scene.add(wpn_state.rocketMesh);
      game.scene.add(wpn_state.grenadeMesh);
      wpn_clearProjectiles();
    }
    WPN.reset();
  },

  update(dt, input = {}) {
    if (!wpn_state.G) return;
    if (!Number.isFinite(dt) || dt < 0) throw new Error(`WPN.update: dt non valido (${dt}).`);

    const fire = !!input.fire;
    const firePressed = !!input.firePressed || (fire && !wpn_state.previousFire);
    const reloadPressed = !!input.reload && !wpn_state.previousReload;
    const grenadePressed = !!input.grenade && !wpn_state.previousGrenade;
    wpn_state.previousFire = fire;
    wpn_state.previousReload = !!input.reload;
    wpn_state.previousGrenade = !!input.grenade;
    wpn_state.clock += dt;

    if (!wpn_state.G.player.alive) {
      wpn_cancelReload();
      wpn_state.ads = 0;
      wpn_state.adsTarget = false;
      wpn_state.root.visible = false;
      wpn_scopeUpdate();
      return;
    }

    const recovery = 1 - Math.exp(-4.8 * dt);
    const recoverPitch = wpn_state.recoilPitch * recovery;
    const recoverYaw = wpn_state.recoilYaw * recovery;
    wpn_state.G.player.pitch = THREE.MathUtils.clamp(
      wpn_state.G.player.pitch - recoverPitch, -Math.PI / 2 + 0.04, Math.PI / 2 - 0.04
    );
    wpn_state.G.player.yaw -= recoverYaw;
    wpn_state.recoilPitch -= recoverPitch;
    wpn_state.recoilYaw -= recoverYaw;
    wpn_state.kick *= Math.exp(-15 * dt);
    wpn_state.quickCooldown = Math.max(0, wpn_state.quickCooldown - dt);
    wpn_state.emptyCooldown = Math.max(0, wpn_state.emptyCooldown - dt);
    wpn_state.throwTime = Math.max(0, wpn_state.throwTime - dt);

    for (const ammo of wpn_state.ammo) {
      ammo.cooldown = Math.max(-dt, ammo.cooldown - dt);
      ammo.bloom = Math.max(0, ammo.bloom - dt * 0.027);
    }

    if (input.switchTo !== null && input.switchTo !== undefined) wpn_requestSwitch(input.switchTo);
    if (Number.isFinite(input.wheel) && input.wheel !== 0) {
      const next = (wpn_state.requested + (input.wheel > 0 ? 1 : -1) + WPN_DEFS.length) % WPN_DEFS.length;
      wpn_requestSwitch(next);
    }

    if (wpn_state.switching) {
      wpn_state.switchTime = Math.min(0.35, wpn_state.switchTime + dt);
      if (!wpn_state.switchCommitted && wpn_state.switchTime >= 0.175) {
        wpn_state.models[wpn_state.current].group.visible = false;
        wpn_state.current = wpn_state.switchTarget;
        wpn_state.models[wpn_state.current].group.visible = true;
        wpn_state.switchCommitted = true;
        wpn_state.kick = 0;
      }
      if (wpn_state.switchTime >= 0.35) {
        wpn_state.switching = false;
        wpn_state.switchTime = 0;
      }
    }
    if (!wpn_state.switching && wpn_state.throwTime <= 0 && wpn_state.requested !== wpn_state.current) {
      wpn_beginSwitch(wpn_state.requested);
    }

    wpn_state.moving = !!input.moving;
    wpn_state.sprint = !!input.sprint;
    const def = WPN_DEFS[wpn_state.current];
    const ammo = wpn_state.ammo[wpn_state.current];

    if (wpn_state.reloadActive) {
      wpn_state.reloadTime += dt;
      if (wpn_state.reloadTime >= def.reload) {
        const transfer = Math.min(def.mag - ammo.mag, ammo.reserve);
        ammo.mag += transfer;
        ammo.reserve -= transfer;
        wpn_cancelReload();
      }
    }

    if (reloadPressed) wpn_startReload();
    if (grenadePressed) wpn_quickGrenade();
    if (ammo.mag === 0 && ammo.reserve > 0 && !wpn_state.reloadActive &&
        !wpn_state.switching && wpn_state.throwTime <= 0) {
      wpn_startReload();
    }

    wpn_state.adsTarget = !!input.ads && !wpn_state.sprint && !wpn_state.reloadActive &&
      !wpn_state.switching && wpn_state.throwTime <= 0 && def.id !== 'GRENADE';
    const adsStep = dt / 0.15;
    wpn_state.ads = wpn_state.adsTarget
      ? Math.min(1, wpn_state.ads + adsStep)
      : Math.max(0, wpn_state.ads - adsStep);

    if (wpn_state.moving) wpn_state.bob += dt * (wpn_state.sprint ? 13.5 : 9);
    const lookX = Number.isFinite(input.lookDX) ? input.lookDX : 0;
    const lookY = Number.isFinite(input.lookDY) ? input.lookDY : 0;
    const smoothing = 1 - Math.exp(-18 * dt);
    wpn_state.swayX = THREE.MathUtils.lerp(
      wpn_state.swayX, THREE.MathUtils.clamp(-lookX * 0.0013, -0.025, 0.025), smoothing
    );
    wpn_state.swayY = THREE.MathUtils.lerp(
      wpn_state.swayY, THREE.MathUtils.clamp(lookY * 0.0013, -0.025, 0.025), smoothing
    );

    wpn_pose();
    const wantsFire = def.auto ? fire || firePressed : firePressed;
    if (wantsFire && !wpn_state.sprint && !wpn_state.reloadActive &&
        !wpn_state.switching && wpn_state.throwTime <= 0) {
      let shots = 0;
      while (ammo.cooldown <= 0 && shots < 3) {
        if (!wpn_firePlayer()) {
          ammo.cooldown = 0;
          break;
        }
        ammo.cooldown += 60 / def.rpm;
        shots++;
        if (!def.auto || wpn_state.reloadActive || wpn_state.throwTime > 0) break;
      }
    } else {
      ammo.cooldown = Math.max(0, ammo.cooldown);
    }

    wpn_pose();
    wpn_scopeUpdate();
  },

  current() {
    return WPN_DEFS[wpn_state.current];
  },

  ammo() {
    const ammo = wpn_state.ammo[wpn_state.current];
    return { mag: ammo.mag, reserve: ammo.reserve };
  },

  isADS() {
    return wpn_state.adsTarget;
  },

  adsAmount() {
    return wpn_state.ads;
  },

  desiredFov() {
    return THREE.MathUtils.lerp(75, WPN_DEFS[wpn_state.current].adsFov, wpn_state.ads);
  },

  scopeActive() {
    return !!wpn_state.G && wpn_state.G.player.alive &&
      WPN_DEFS[wpn_state.current].id === 'SNIPER' && wpn_state.adsTarget &&
      wpn_state.ads >= 0.94 && !wpn_state.reloadActive &&
      !wpn_state.switching && wpn_state.throwTime <= 0;
  },

  reset() {
    for (let i = 0; i < WPN_DEFS.length; i++) {
      const def = WPN_DEFS[i];
      const ammo = wpn_state.ammo[i];
      ammo.mag = def.mag;
      ammo.reserve = def.reserve;
      ammo.cooldown = 0;
      ammo.bloom = 0;
      if (wpn_state.models[i]) {
        wpn_restoreMagazine(wpn_state.models[i]);
        wpn_state.models[i].group.visible = i === 0;
      }
    }
    wpn_state.current = 0;
    wpn_state.requested = 0;
    wpn_state.switching = false;
    wpn_state.switchTime = 0;
    wpn_state.switchTarget = 0;
    wpn_state.switchCommitted = false;
    wpn_state.reloadActive = false;
    wpn_state.reloadTime = 0;
    wpn_state.ads = 0;
    wpn_state.adsTarget = false;
    wpn_state.kick = 0;
    wpn_state.recoilPitch = 0;
    wpn_state.recoilYaw = 0;
    wpn_state.swayX = 0;
    wpn_state.swayY = 0;
    wpn_state.bob = 0;
    wpn_state.moving = false;
    wpn_state.sprint = false;
    wpn_state.throwTime = 0;
    wpn_state.quickCooldown = 0;
    wpn_state.emptyCooldown = 0;
    wpn_state.previousFire = false;
    wpn_state.previousReload = false;
    wpn_state.previousGrenade = false;
    if (wpn_state.root) wpn_pose();
    wpn_scopeUpdate();
  },

  fireFrom(entity, defId, origin, dir) {
    if (!wpn_state.G) return false;
    const def = wpn_resolveDefinition(defId);
    if (!def) throw new Error(`WPN.fireFrom: arma sconosciuta (${defId}).`);
    if (!origin || !dir || !Number.isFinite(origin.x) || !Number.isFinite(origin.y) ||
        !Number.isFinite(origin.z) || !Number.isFinite(dir.x) || !Number.isFinite(dir.y) ||
        !Number.isFinite(dir.z) || dir.lengthSq() < 0.000001) {
      throw new Error('WPN.fireFrom: origine o direzione non valida.');
    }
    return wpn_emitShot(entity, def, origin, dir, false);
  },

  updateProjectiles(dt) {
    if (!wpn_state.G) return;
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error(`WPN.updateProjectiles: dt non valido (${dt}).`);
    }
    if (wpn_state.map !== wpn_state.G.map) {
      wpn_clearProjectiles();
      wpn_state.map = wpn_state.G.map;
    }
    if (dt === 0) return;

    for (let i = 0; i < wpn_state.projectiles.length; i++) {
      const p = wpn_state.projectiles[i];
      if (!p.active) continue;
      p.previous.copy(p.p);

      if (p.type === 'rocket') {
        const distance = Math.min(p.v.length() * dt, Math.max(0, p.def.range - p.distance));
        const hit = distance > 0
          ? raycastWorld(p.p, p.dir, distance, p.options)
          : null;
        if (hit) {
          p.p.copy(hit.point);
          wpn_detonate(i);
          continue;
        }

        p.p.addScaledVector(p.dir, distance);
        p.distance += distance;
        p.age += dt;
        p.trailTime += dt;
        let puffs = 0;
        while (p.trailTime >= 0.028 && puffs < 8) {
          p.trailTime -= 0.028;
          const fraction = THREE.MathUtils.clamp(1 - p.trailTime / dt, 0, 1);
          wpn_scratch.trail.lerpVectors(p.previous, p.p, fraction);
          FX.smoke(wpn_scratch.trail, 0.14, 0.6);
          puffs++;
        }
        if (p.distance >= p.def.range) {
          wpn_detonate(i);
          continue;
        }
      } else {
        let remaining = dt;
        while (remaining > 0.000001 && p.active) {
          const step = Math.min(remaining, 1 / 120, Math.max(0, p.fuse - p.age));
          if (step <= 0.000001) {
            wpn_detonate(i);
            break;
          }
          wpn_moveGrenade(p, step);
          p.age += step;
          remaining -= step;
          if (p.age >= p.fuse - 0.000001) wpn_detonate(i);
        }
        if (!p.active) continue;
      }
      wpn_drawProjectile(i);
    }
    wpn_state.rocketMesh.instanceMatrix.needsUpdate = true;
    wpn_state.grenadeMesh.instanceMatrix.needsUpdate = true;
  }
};
