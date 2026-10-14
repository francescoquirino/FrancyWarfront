

const fx_state = {
  G: null,
  root: null,
  map: null,
  fire: null,
  smoke: null,
  sparks: null,
  flashes: [],
  lights: [],
  tracers: [],
  debris: [],
  casings: [],
  rings: [],
  tracerMesh: null,
  debrisMesh: null,
  casingMesh: null,
  ringMesh: null,
  ringOpacity: null,
  decals: null,
  decalCursor: 0,
  flashCursor: 0,
  tracerCursor: 0,
  debrisCursor: 0,
  casingCursor: 0,
  ringCursor: 0
};

const fx_scratch = {
  object: new THREE.Object3D(),
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  displacement: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  scale: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
  spin: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0),
  forward: new THREE.Vector3(0, 0, -1),
  z: new THREE.Vector3(0, 0, 1),
  worldOptions: { ignore: null, entities: false }
};

function fx_texture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('FX: Canvas 2D non disponibile.');

  if (kind === 'smoke') {
    const image = ctx.createImageData(128, 128);
    let seed = 7193;
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const nx = (x - 63.5) / 63.5;
        const ny = (y - 63.5) / 63.5;
        const radius = Math.sqrt(nx * nx + ny * ny);
        const waves = 0.84 + 0.10 * Math.sin(nx * 16 + Math.sin(ny * 11));
        const noise = 0.90 + (seed / 4294967296) * 0.10;
        const alpha = Math.pow(Math.max(0, 1 - radius), 0.8) * waves * noise;
        const i = (y * 128 + x) * 4;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
  } else if (kind === 'hole') {
    const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 58);
    gradient.addColorStop(0, 'rgba(25,22,19,0.98)');
    gradient.addColorStop(0.2, 'rgba(38,33,27,0.85)');
    gradient.addColorStop(0.5, 'rgba(72,61,49,0.35)');
    gradient.addColorStop(1, 'rgba(72,61,49,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = 'rgba(35,29,24,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.399;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(angle) * 9, 64 + Math.sin(angle) * 9);
      ctx.lineTo(64 + Math.cos(angle + 0.12) * 31, 64 + Math.sin(angle + 0.12) * 31);
      ctx.lineTo(64 + Math.cos(angle) * 45, 64 + Math.sin(angle) * 45);
      ctx.stroke();
    }
  } else {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.48, 'rgba(255,255,255,0.48)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    if (kind === 'star') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      for (let i = 0; i < 6; i++) {
        const angle = (i + 0.5) * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(64, 64);
        ctx.lineTo(64 + Math.cos(angle - 0.22) * 100, 64 + Math.sin(angle - 0.22) * 100);
        ctx.lineTo(64 + Math.cos(angle + 0.22) * 100, 64 + Math.sin(angle + 0.22) * 100);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fx_particlePool(count, texture, additive) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(quad.index);
  geometry.setAttribute('position', quad.getAttribute('position'));
  geometry.setAttribute('uv', quad.getAttribute('uv'));
  geometry.instanceCount = count;

  const centers = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const sizes = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  const rotations = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
  for (const attribute of [centers, sizes, colors, rotations]) {
    attribute.setUsage(THREE.DynamicDrawUsage);
  }
  geometry.setAttribute('fxCenter', centers);
  geometry.setAttribute('fxSize', sizes);
  geometry.setAttribute('fxColor', colors);
  geometry.setAttribute('fxRotation', rotations);

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { fxMap: { value: null } }]),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `
      attribute vec3 fxCenter;
      attribute vec2 fxSize;
      attribute vec4 fxColor;
      attribute float fxRotation;
      varying vec2 fxUV;
      varying vec4 fxTint;
      #include <fog_pars_vertex>
      void main() {
        fxUV = uv;
        fxTint = fxColor;
        float c = cos(fxRotation);
        float s = sin(fxRotation);
        vec2 p = position.xy * fxSize;
        p = mat2(c, s, -s, c) * p;
        vec4 mvPosition = modelViewMatrix * vec4(fxCenter, 1.0);
        mvPosition.xy += p;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform sampler2D fxMap;
      varying vec2 fxUV;
      varying vec4 fxTint;
      #include <fog_pars_fragment>
      void main() {
        float alpha = texture2D(fxMap, fxUV).a * fxTint.a;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(fxTint.rgb * (0.78 + 0.22 * fxUV.y), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `
  });
  material.uniforms.fxMap.value = texture;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = additive ? 4 : 2;
  fx_state.root.add(mesh);

  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      active: false,
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
      age: 0,
      life: 1,
      size: 1,
      endSize: 1,
      r: 1,
      g: 1,
      b: 1,
      alpha: 1,
      rotation: 0,
      spin: 0,
      gravity: 0,
      drag: 0,
      kind: 0,
      stretch: 1
    });
  }

  return { count, cursor: 0, particles, centers, sizes, colors, rotations, mesh };
}

function fx_emit(pool, pos, velocity, life, size, endSize, r, g, b, alpha, kind, gravity = 0, drag = 1) {
  const p = pool.particles[pool.cursor];
  pool.cursor = (pool.cursor + 1) % pool.count;
  p.active = true;
  p.p.copy(pos);
  p.v.copy(velocity);
  p.age = 0;
  p.life = Math.max(0.02, life);
  p.size = size;
  p.endSize = endSize;
  p.r = r;
  p.g = g;
  p.b = b;
  p.alpha = alpha;
  p.rotation = Math.random() * Math.PI * 2;
  p.spin = (Math.random() - 0.5) * 0.65;
  p.gravity = gravity;
  p.drag = drag;
  p.kind = kind;
  p.stretch = kind === 2 ? 2.8 : 1;
}

function fx_updateParticles(pool, dt) {
  const centers = pool.centers.array;
  const sizes = pool.sizes.array;
  const colors = pool.colors.array;
  const rotations = pool.rotations.array;

  for (let i = 0; i < pool.count; i++) {
    const p = pool.particles[i];
    const c = i * 4;
    if (!p.active) {
      colors[c + 3] = 0;
      continue;
    }
    p.age += dt;
    if (p.age >= p.life) {
      p.active = false;
      colors[c + 3] = 0;
      continue;
    }

    const damping = Math.exp(-p.drag * dt);
    p.v.multiplyScalar(damping);
    p.v.y += p.gravity * dt;
    p.p.addScaledVector(p.v, dt);
    p.rotation += p.spin * dt;

    const t = p.age / p.life;
    const size = THREE.MathUtils.lerp(p.size, p.endSize, t);
    const fadeIn = Math.min(1, p.age / (p.kind === 1 ? 0.02 : 0.12));
    const fadeOut = p.kind === 1 ? Math.pow(1 - t, 0.8) : Math.min(1, (1 - t) / 0.28);
    let r = p.r;
    let g = p.g;
    let b = p.b;

    if (p.kind === 1) {
      if (t < 0.22) {
        const u = t / 0.22;
        r = THREE.MathUtils.lerp(2.3, 2.0, u);
        g = THREE.MathUtils.lerp(1.7, 0.46, u);
        b = THREE.MathUtils.lerp(0.95, 0.035, u);
      } else {
        const u = (t - 0.22) / 0.78;
        r = THREE.MathUtils.lerp(2.0, 0.12, u);
        g = THREE.MathUtils.lerp(0.46, 0.008, u);
        b = THREE.MathUtils.lerp(0.035, 0.004, u);
      }
    }

    centers[i * 3] = p.p.x;
    centers[i * 3 + 1] = p.p.y;
    centers[i * 3 + 2] = p.p.z;
    sizes[i * 2] = size;
    sizes[i * 2 + 1] = size * p.stretch;
    colors[c] = r;
    colors[c + 1] = g;
    colors[c + 2] = b;
    colors[c + 3] = p.alpha * fadeIn * fadeOut;
    rotations[i] = p.rotation;
  }

  pool.centers.needsUpdate = true;
  pool.sizes.needsUpdate = true;
  pool.colors.needsUpdate = true;
  pool.rotations.needsUpdate = true;
}

function fx_instanced(geometry, material, count) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  fx_scratch.object.position.set(0, 0, 0);
  fx_scratch.object.quaternion.identity();
  fx_scratch.object.scale.set(0, 0, 0);
  fx_scratch.object.updateMatrix();
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, fx_scratch.object.matrix);
  mesh.instanceMatrix.needsUpdate = true;
  fx_state.root.add(mesh);
  return mesh;
}

function fx_bodyPool(count) {
  const pool = [];
  for (let i = 0; i < count; i++) {
    pool.push({
      active: false,
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      axis: new THREE.Vector3(),
      scale: new THREE.Vector3(),
      age: 0,
      life: 0,
      spin: 0,
      radius: 0.02,
      settled: false
    });
  }
  return pool;
}

function fx_hideInstance(mesh, index) {
  fx_scratch.object.scale.set(0, 0, 0);
  fx_scratch.object.updateMatrix();
  mesh.setMatrixAt(index, fx_scratch.object.matrix);
}

function fx_updateBodies(pool, mesh, dt) {
  for (let i = 0; i < pool.length; i++) {
    const body = pool[i];
    if (!body.active) continue;
    body.age += dt;
    if (body.age >= body.life) {
      body.active = false;
      fx_hideInstance(mesh, i);
      continue;
    }

    if (!body.settled) {
      body.v.y -= 9.81 * dt;
      fx_scratch.displacement.copy(body.v).multiplyScalar(dt);
      const distance = fx_scratch.displacement.length();

      if (distance > 0.00001) {
        fx_scratch.direction.copy(fx_scratch.displacement).divideScalar(distance);
        const hit = raycastWorld(
          body.p,
          fx_scratch.direction,
          distance + body.radius,
          fx_scratch.worldOptions
        );
        if (hit) {
          fx_scratch.normal.copy(hit.normal);
          if (fx_scratch.normal.lengthSq() < 0.000001) fx_scratch.normal.copy(fx_scratch.up);
          fx_scratch.normal.normalize();
          body.p.copy(hit.point).addScaledVector(fx_scratch.normal, body.radius + 0.002);
          const incoming = body.v.dot(fx_scratch.normal);
          if (incoming < 0) body.v.addScaledVector(fx_scratch.normal, -incoming * 1.42);
          body.v.multiplyScalar(0.63);
          body.spin *= 0.65;
        } else {
          body.p.add(fx_scratch.displacement);
        }
      }

      const ground = groundHeightAt(body.p.x, body.p.y, body.p.z);
      if (Number.isFinite(ground) && body.p.y < ground + body.radius) {
        body.p.y = ground + body.radius;
        if (body.v.y < 0) body.v.y *= -0.34;
        body.v.x *= 0.66;
        body.v.z *= 0.66;
        body.spin *= 0.65;
      }
      if (body.v.lengthSq() < 0.12 && Number.isFinite(ground) &&
          body.p.y <= ground + body.radius + 0.015) {
        body.settled = true;
        body.v.set(0, 0, 0);
      }
      fx_scratch.spin.setFromAxisAngle(body.axis, body.spin * dt);
      body.q.multiply(fx_scratch.spin).normalize();
    }

    const fade = Math.min(1, (body.life - body.age) / 0.35);
    fx_scratch.object.position.copy(body.p);
    fx_scratch.object.quaternion.copy(body.q);
    fx_scratch.object.scale.copy(body.scale).multiplyScalar(fade);
    fx_scratch.object.updateMatrix();
    mesh.setMatrixAt(i, fx_scratch.object.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function fx_light(pos, intensity, distance, life, color) {
  let slot = null;
  for (const candidate of fx_state.lights) {
    if (!candidate.active) {
      slot = candidate;
      break;
    }
    if (!slot || candidate.light.intensity < slot.light.intensity) slot = candidate;
  }
  if (slot.active && slot.light.intensity > intensity) return;
  slot.active = true;
  slot.age = 0;
  slot.life = life;
  slot.power = intensity;
  slot.light.position.copy(pos);
  slot.light.color.setHex(color);
  slot.light.distance = distance;
  slot.light.intensity = intensity;
  slot.light.visible = true;
}

function fx_clear() {
  if (!fx_state.root) return;
  for (const pool of [fx_state.fire, fx_state.smoke, fx_state.sparks]) {
    for (const p of pool.particles) p.active = false;
    pool.colors.array.fill(0);
    pool.colors.needsUpdate = true;
    pool.cursor = 0;
  }
  for (const flash of fx_state.flashes) {
    flash.active = false;
    flash.group.visible = false;
  }
  for (const light of fx_state.lights) {
    light.active = false;
    light.light.intensity = 0;
    light.light.intensity = 0;
  }
  for (const tracer of fx_state.tracers) tracer.active = false;
  for (const body of fx_state.debris) body.active = false;
  for (const body of fx_state.casings) body.active = false;
  for (const ring of fx_state.rings) ring.active = false;

  for (const mesh of [
    fx_state.tracerMesh, fx_state.debrisMesh, fx_state.casingMesh,
    fx_state.ringMesh, fx_state.decals
  ]) {
    for (let i = 0; i < mesh.count; i++) fx_hideInstance(mesh, i);
    mesh.instanceMatrix.needsUpdate = true;
  }
  fx_state.ringOpacity.array.fill(0);
  fx_state.ringOpacity.needsUpdate = true;
  fx_state.decalCursor = 0;
}

const FX = {
  init(game) {
    if (!game || !game.scene || !game.camera || !game.player) {
      throw new Error('FX.init: servono scene, camera e player.');
    }
    fx_state.G = game;
    fx_state.map = game.map;

    if (fx_state.root) {
      game.scene.add(fx_state.root);
      fx_clear();
      return;
    }

    fx_state.root = new THREE.Group();
    fx_state.root.name = 'fx_effects';
    game.scene.add(fx_state.root);

    const softTexture = fx_texture('soft');
    const smokeTexture = fx_texture('smoke');
    const starTexture = fx_texture('star');
    fx_state.fire = fx_particlePool(384, softTexture, true);
    fx_state.smoke = fx_particlePool(1200, smokeTexture, false);
    fx_state.sparks = fx_particlePool(320, softTexture, true);

    const plane = new THREE.PlaneGeometry(1, 1);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc775,
      map: starTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 24; i++) {
      const group = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const pivot = new THREE.Group();
        pivot.rotation.z = j * Math.PI / 3;
        const mesh = new THREE.Mesh(plane, flashMaterial);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.z = -0.12;
        mesh.scale.set(0.15, 0.34, 1);
        pivot.add(mesh);
        group.add(pivot);
      }
      const front = new THREE.Mesh(plane, flashMaterial);
      front.position.z = -0.045;
      front.scale.set(0.19, 0.19, 1);
      group.add(front);
      group.visible = false;
      fx_state.root.add(group);
      fx_state.flashes.push({ group, active: false, age: 0, life: 0.05, scale: 1 });
    }

    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xffbd70, 0, 6, 2);
      light.castShadow = false;
      light.visible = true; // sempre visibile: cambiare il numero di luci ricompila tutti gli shader
      fx_state.root.add(light);
      fx_state.lights.push({ light, active: false, age: 0, life: 0, power: 0 });
    }

    fx_state.tracerMesh = fx_instanced(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.2, 0.18) }),
      128
    );
    for (let i = 0; i < 128; i++) {
      fx_state.tracers.push({
        active: false, from: new THREE.Vector3(), dir: new THREE.Vector3(),
        distance: 0, age: 0, life: 0
      });
    }

    fx_state.debris = fx_bodyPool(80);
    fx_state.casings = fx_bodyPool(60);
    fx_state.debrisMesh = fx_instanced(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: 0x716659, roughness: 0.95 }),
      80
    );
    fx_state.casingMesh = fx_instanced(
      new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
      new THREE.MeshStandardMaterial({
        color: 0xbd984b, roughness: 0.34, metalness: 0.82
      }),
      60
    );

    const ringGeometry = new THREE.RingGeometry(0.91, 1, 48);
    ringGeometry.rotateX(-Math.PI / 2);
    fx_state.ringOpacity = new THREE.InstancedBufferAttribute(new Float32Array(20), 1);
    fx_state.ringOpacity.setUsage(THREE.DynamicDrawUsage);
    ringGeometry.setAttribute('fxOpacity', fx_state.ringOpacity);
    const ringMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float fxOpacity;
        varying float fxAlpha;
        void main() {
          fxAlpha = fxOpacity;
          gl_Position = projectionMatrix * modelViewMatrix *
            instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float fxAlpha;
        void main() {
          if (fxAlpha < 0.002) discard;
          gl_FragColor = vec4(0.85, 0.53, 0.22, fxAlpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    fx_state.ringMesh = fx_instanced(ringGeometry, ringMaterial, 20);
    for (let i = 0; i < 20; i++) {
      fx_state.rings.push({
        active: false, p: new THREE.Vector3(), age: 0, life: 0.55, radius: 1
      });
    }

    fx_state.decals = fx_instanced(
      plane,
      new THREE.MeshBasicMaterial({
        color: 0xbab0a0,
        map: fx_texture('hole'),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.DoubleSide
      }),
      200
    );
    fx_state.decals.renderOrder = 1;
  },

  update(dt) {
    if (!fx_state.root) return;
    if (!Number.isFinite(dt) || dt < 0) throw new Error(`FX.update: dt non valido (${dt}).`);
    if (fx_state.map !== fx_state.G.map) {
      fx_clear();
      fx_state.map = fx_state.G.map;
    }

    fx_updateParticles(fx_state.fire, dt);
    fx_updateParticles(fx_state.smoke, dt);
    fx_updateParticles(fx_state.sparks, dt);

    for (const flash of fx_state.flashes) {
      if (!flash.active) continue;
      flash.age += dt;
      if (flash.age >= flash.life) {
        flash.active = false;
        flash.group.visible = false;
      } else {
        flash.group.scale.setScalar(flash.scale * (1 - 0.6 * flash.age / flash.life));
      }
    }

    for (const slot of fx_state.lights) {
      if (!slot.active) continue;
      slot.age += dt;
      if (slot.age >= slot.life) {
        slot.active = false;
        slot.light.intensity = 0;
        slot.light.intensity = 0;
      } else {
        slot.light.intensity = slot.power * Math.pow(1 - slot.age / slot.life, 1.5);
      }
    }

    for (let i = 0; i < fx_state.tracers.length; i++) {
      const tracer = fx_state.tracers[i];
      if (!tracer.active) continue;
      tracer.age += dt;
      if (tracer.age > tracer.life) {
        tracer.active = false;
        fx_hideInstance(fx_state.tracerMesh, i);
        continue;
      }
      const head = Math.min(tracer.distance, tracer.age * 400);
      const length = Math.min(1.8, Math.max(0.02, head), tracer.distance);
      fx_scratch.object.position.copy(tracer.from).addScaledVector(tracer.dir, head - length * 0.5);
      fx_scratch.object.quaternion.setFromUnitVectors(fx_scratch.z, tracer.dir);
      fx_scratch.object.scale.set(0.012, 0.012, length);
      fx_scratch.object.updateMatrix();
      fx_state.tracerMesh.setMatrixAt(i, fx_scratch.object.matrix);
    }
    fx_state.tracerMesh.instanceMatrix.needsUpdate = true;

    fx_updateBodies(fx_state.debris, fx_state.debrisMesh, dt);
    fx_updateBodies(fx_state.casings, fx_state.casingMesh, dt);

    for (let i = 0; i < fx_state.rings.length; i++) {
      const ring = fx_state.rings[i];
      if (!ring.active) continue;
      ring.age += dt;
      const t = Math.min(1, ring.age / ring.life);
      if (t >= 1) {
        ring.active = false;
        fx_hideInstance(fx_state.ringMesh, i);
        fx_state.ringOpacity.array[i] = 0;
        continue;
      }
      fx_scratch.object.position.copy(ring.p);
      fx_scratch.object.quaternion.identity();
      fx_scratch.object.scale.setScalar(Math.max(0.03, ring.radius * t * 1.65));
      fx_scratch.object.updateMatrix();
      fx_state.ringMesh.setMatrixAt(i, fx_scratch.object.matrix);
      fx_state.ringOpacity.array[i] = (1 - t) * 0.32;
    }
    fx_state.ringMesh.instanceMatrix.needsUpdate = true;
    fx_state.ringOpacity.needsUpdate = true;
  },

  muzzle(pos, dir, scale = 1) {
    if (!fx_state.root || scale <= 0 || dir.lengthSq() < 0.000001) return;
    const slot = fx_state.flashes[fx_state.flashCursor];
    fx_state.flashCursor = (fx_state.flashCursor + 1) % fx_state.flashes.length;
    slot.active = true;
    slot.age = 0;
    slot.scale = scale * (0.8 + Math.random() * 0.4);
    slot.group.visible = true;
    slot.group.position.copy(pos);
    fx_scratch.direction.copy(dir).normalize();
    slot.group.quaternion.setFromUnitVectors(fx_scratch.forward, fx_scratch.direction);
    fx_scratch.spin.setFromAxisAngle(fx_scratch.z, Math.random() * Math.PI * 2);
    slot.group.quaternion.multiply(fx_scratch.spin);
    slot.group.scale.setScalar(slot.scale);
    fx_light(pos, 40 * Math.min(1.5, scale), 6, 0.05, 0xffc078);
  },

  tracer(from, to) {
    if (!fx_state.root) return;
    const distance = from.distanceTo(to);
    if (distance < 0.001) return;
    const tracer = fx_state.tracers[fx_state.tracerCursor];
    fx_state.tracerCursor = (fx_state.tracerCursor + 1) % fx_state.tracers.length;
    tracer.active = true;
    tracer.from.copy(from);
    tracer.dir.subVectors(to, from).divideScalar(distance);
    tracer.distance = distance;
    tracer.age = 0;
    tracer.life = Math.max(0.04, distance / 400 + 0.008);
  },

  impact(point, normal, kind) {
    if (!fx_state.root) return;
    fx_scratch.normal.copy(normal);
    if (fx_scratch.normal.lengthSq() < 0.000001) fx_scratch.normal.copy(fx_scratch.up);
    fx_scratch.normal.normalize();

    const world = kind === 'world';
    const dustCount = world ? 7 : 4;
    for (let i = 0; i < dustCount; i++) {
      fx_scratch.position.copy(point).addScaledVector(fx_scratch.normal, 0.025);
      fx_scratch.velocity.set(
        (Math.random() - 0.5) * 1.6,
        Math.random() * 1.2,
        (Math.random() - 0.5) * 1.6
      ).addScaledVector(fx_scratch.normal, Math.random() * 1.6);
      fx_emit(
        fx_state.smoke, fx_scratch.position, fx_scratch.velocity,
        0.35 + Math.random() * 0.45, 0.06, world ? 0.44 : 0.22,
        world ? 0.32 : 0.36, world ? 0.28 : 0.35, world ? 0.23 : 0.30,
        world ? 0.48 : 0.32, 0, 0.35, 2.8
      );
    }

    const sparkCount = world ? 4 + Math.floor(Math.random() * 5) : 1;
    for (let i = 0; i < sparkCount; i++) {
      fx_scratch.velocity.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 3,
        (Math.random() - 0.5) * 5
      ).addScaledVector(fx_scratch.normal, 2 + Math.random() * 3);
      fx_emit(
        fx_state.sparks, point, fx_scratch.velocity,
        0.09 + Math.random() * 0.16, 0.025, 0.006,
        2.0, 0.9, 0.16, 0.9, 2, -7.5, 2
      );
    }

    if (world) {
      fx_scratch.object.position.copy(point).addScaledVector(fx_scratch.normal, 0.006);
      fx_scratch.object.quaternion.setFromUnitVectors(fx_scratch.z, fx_scratch.normal);
      fx_scratch.spin.setFromAxisAngle(fx_scratch.z, Math.random() * Math.PI * 2);
      fx_scratch.object.quaternion.multiply(fx_scratch.spin);
      const size = 0.055 + Math.random() * 0.045;
      fx_scratch.object.scale.set(size, size, 1);
      fx_scratch.object.updateMatrix();
      fx_state.decals.setMatrixAt(fx_state.decalCursor, fx_scratch.object.matrix);
      fx_state.decalCursor = (fx_state.decalCursor + 1) % 200;
      fx_state.decals.instanceMatrix.needsUpdate = true;
    }
  },

  explosion(pos, radius) {
    if (!fx_state.root || !Number.isFinite(radius) || radius <= 0) return;
    const scale = Math.max(0.4, radius / 6);
    for (let i = 0; i < 36; i++) {
      fx_scratch.position.copy(pos);
      fx_scratch.position.x += (Math.random() - 0.5) * scale;
      fx_scratch.position.y += Math.random() * scale;
      fx_scratch.position.z += (Math.random() - 0.5) * scale;
      fx_scratch.velocity.set(
        (Math.random() - 0.5) * 7 * scale,
        (1.5 + Math.random() * 4) * scale,
        (Math.random() - 0.5) * 7 * scale
      );
      fx_emit(
        fx_state.fire, fx_scratch.position, fx_scratch.velocity,
        0.48 + Math.random() * 0.75,
        (0.6 + Math.random() * 0.9) * scale,
        (1.9 + Math.random()) * scale,
        2, 0.6, 0.06, 0.95, 1, 0.65, 2.4
      );
    }

    for (let i = 0; i < 62; i++) {
      fx_scratch.position.copy(pos);
      fx_scratch.position.x += (Math.random() - 0.5) * radius * 0.55;
      fx_scratch.position.y += Math.random() * radius * 0.2;
      fx_scratch.position.z += (Math.random() - 0.5) * radius * 0.55;
      fx_scratch.velocity.set(
        (Math.random() - 0.5) * 3.2 * scale,
        (0.7 + Math.random() * 1.9) * scale,
        (Math.random() - 0.5) * 3.2 * scale
      );
      const shade = 0.07 + Math.random() * 0.10;
      fx_emit(
        fx_state.smoke, fx_scratch.position, fx_scratch.velocity,
        4, (0.65 + Math.random() * 0.65) * scale,
        (2.8 + Math.random() * 1.6) * scale,
        shade * 1.06, shade, shade * 0.94, 0.64, 0, 0.24, 0.75
      );
    }

    for (let i = 0; i < 24; i++) {
      const body = fx_state.debris[fx_state.debrisCursor];
      fx_state.debrisCursor = (fx_state.debrisCursor + 1) % fx_state.debris.length;
      body.active = true;
      body.settled = false;
      body.age = 0;
      body.life = 2.4 + Math.random() * 1.6;
      body.p.copy(pos);
      body.p.y += 0.12;
      body.v.set(
        (Math.random() - 0.5) * 12 * scale,
        (3 + Math.random() * 8) * scale,
        (Math.random() - 0.5) * 12 * scale
      );
      body.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      if (body.axis.lengthSq() < 0.00001) body.axis.copy(fx_scratch.up);
      body.axis.normalize();
      body.q.setFromAxisAngle(body.axis, Math.random() * Math.PI * 2);
      body.spin = 5 + Math.random() * 10;
      body.radius = 0.04 + Math.random() * 0.06;
      body.scale.set(body.radius, body.radius * 0.65, body.radius * 1.3);
    }

    const ring = fx_state.rings[fx_state.ringCursor];
    fx_state.ringCursor = (fx_state.ringCursor + 1) % fx_state.rings.length;
    ring.active = true;
    ring.age = 0;
    ring.radius = radius;
    ring.p.copy(pos);
    const ground = groundHeightAt(pos.x, pos.y, pos.z);
    ring.p.y = (Number.isFinite(ground) ? ground : 0) + 0.025;

    fx_light(pos, 180 * scale, radius * 3, 0.25, 0xffb965);
    const distance = fx_state.G.player.pos.distanceTo(pos);
    const shake = Math.min(0.85, radius * 1.15 / (distance + radius));
    if (shake > 0.025) fx_state.G.shake(shake);
  },

  smoke(pos, radius, seconds) {
    if (!fx_state.root || !Number.isFinite(radius) || radius <= 0 ||
        !Number.isFinite(seconds) || seconds <= 0) return;

    const count = radius < 0.3 ? 3 : Math.min(80, Math.ceil(28 + radius * 7));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius * 0.8;
      fx_scratch.position.copy(pos);
      fx_scratch.position.x += Math.cos(angle) * distance;
      fx_scratch.position.z += Math.sin(angle) * distance;
      fx_scratch.position.y += (Math.random() - 0.15) * radius * 0.7;
      fx_scratch.velocity.set(
        (Math.random() - 0.5) * 0.15,
        radius < 0.3 ? 0.18 : 0.10 + Math.random() * 0.12,
        (Math.random() - 0.5) * 0.15
      );
      const shade = 0.30 + Math.random() * 0.09;
      fx_emit(
        fx_state.smoke, fx_scratch.position, fx_scratch.velocity, seconds,
        radius * (radius < 0.3 ? 1.2 : 0.75),
        radius * (radius < 0.3 ? 2.2 : 1.3),
        shade, shade, shade * 0.97, radius < 0.3 ? 0.3 : 0.76,
        0, 0, 0.8
      );
    }
  },

  casing(pos, dir) {
    if (!fx_state.root || dir.lengthSq() < 0.000001) return;
    const body = fx_state.casings[fx_state.casingCursor];
    fx_state.casingCursor = (fx_state.casingCursor + 1) % fx_state.casings.length;
    body.active = true;
    body.settled = false;
    body.age = 0;
    body.life = 2.5 + Math.random();
    body.radius = 0.009;
    body.p.copy(pos);
    body.v.copy(dir).normalize().multiplyScalar(1.8 + Math.random() * 1.4);
    body.v.y += 1.0 + Math.random() * 1.1;
    body.v.z += (Math.random() - 0.5) * 0.9;
    body.axis.set(0.65, 0.3, 0.7).normalize();
    body.q.setFromAxisAngle(body.axis, Math.random() * Math.PI * 2);
    body.spin = 10 + Math.random() * 14;
    body.scale.set(0.014, 0.034, 0.014);
  }
};

