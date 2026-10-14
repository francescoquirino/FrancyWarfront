// ===================== AMBIENTE: renderer, cielo, luci, post, meteo =====================
const ENV = {
  sun: null, hemi: null, sky: null, composer: null, bloom: null, weather: null, pmrem: null, envTex: null, quality: 1,
};
function env_initRenderer() {
  const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: URLP.has('demo') });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, URLP.has('demo') ? 1 : 1.5));
  r.setSize(innerWidth, innerHeight);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.5;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(r.domElement);
  G.renderer = r;
  G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.03, 1200);
  G.scene.add(G.camera);
  ENV.pmrem = new THREE.PMREMGenerator(r);
  const comp = new EffectComposer(r);
  comp.addPass(new RenderPass(G.scene, G.camera));
  if (URLP.get('ao') !== '0') {
    // occlusione ambientale: "incolla" gli oggetti a terra e scurisce gli angoli
    const ao = new GTAOPass(G.scene, G.camera, innerWidth, innerHeight);
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = 0.9;
    ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 12 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
    // AO a metà risoluzione: quasi uguale a vedersi, costa un quarto
    const aoSet = ao.setSize.bind(ao); ao.setSize = (w, h) => aoSet(Math.ceil(w / 2), Math.ceil(h / 2));
    ao.setSize(innerWidth, innerHeight);
    // passata delle normali dell'AO: niente soldati, meteo e arma in mano (si notano poco e costano 3 disegni ciascuno)
    const hidden = [];
    ao.overrideVisibility = () => {
      hidden.length = 0;
      const hide = o => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
      for (const b of G.bots) hide(b.model);
      hide(ENV.weather);
      for (const c of G.camera.children) hide(c);
      G.scene.children.forEach(o => { if (o.isPoints || o.isLine || (o.material && o.material.transparent && !o.isMesh)) hide(o); });
    };
    ao.restoreVisibility = () => { for (const o of hidden) o.visible = true; hidden.length = 0; };
    comp.addPass(ao); ENV.ao = ao;
  }
  ENV.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.5, 0.5, 2.0);
  // arma in mano: disegnata dopo il mondo, con la SUA profondità (niente pezzi che si vedono attraverso,
  // e l'arma non entra mai dentro i muri). Sta sul layer 1.
  ENV.vmCam = new THREE.PerspectiveCamera(); ENV.vmCam.layers.set(1);
  comp.addPass({
    enabled: !URLP.has('novm'), needsSwap: false, clear: false, renderToScreen: false,
    setSize() {}, dispose() {},
    render(renderer, writeBuffer, readBuffer) {
      const cam = ENV.vmCam, src = G.camera;
      cam.projectionMatrix.copy(src.projectionMatrix); cam.projectionMatrixInverse.copy(src.projectionMatrixInverse);
      src.updateMatrixWorld(); cam.matrixWorld.copy(src.matrixWorld); cam.matrixWorldInverse.copy(src.matrixWorldInverse);
      cam.matrixAutoUpdate = false; cam.matrixWorldAutoUpdate = false;
      const bg = G.scene.background, fog = G.scene.fog, au = renderer.autoClear, sh = renderer.shadowMap.autoUpdate;
      G.scene.background = null; G.scene.fog = null; renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
      renderer.clearDepth();
      renderer.render(G.scene, cam);
      G.scene.background = bg; G.scene.fog = fog; renderer.autoClear = au; renderer.shadowMap.autoUpdate = sh;
    },
  });
  comp.addPass(ENV.bloom);
  comp.addPass(new OutputPass());
  ENV.composer = comp;
  addEventListener('resize', () => {
    G.camera.aspect = innerWidth / innerHeight; G.camera.updateProjectionMatrix();
    r.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight);
  });
}

// cupola del cielo a gradiente (notte, coperto, neve) — Sky di three per giorno/tramonto
function env_gradientSky(top, horizon, bottom, sunDir, sunCol, sunSize) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(bottom) }, sd: { value: sunDir.clone() }, sc: { value: new THREE.Color(sunCol) }, ss: { value: sunSize }, t: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `uniform vec3 top,hor,bot,sc,sd; uniform float ss; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ float y=vD.y; vec3 c = y>0.0 ? mix(hor, top, pow(clamp(y,0.0,1.0),0.55)) : mix(hor, bot, pow(clamp(-y,0.0,1.0),0.4));
        float s = max(dot(normalize(vD), normalize(sd)), 0.0); c += sc * (pow(s, 900.0)*ss*8.0 + pow(s, 12.0)*0.25*ss);
        if (ss < 0.01 && y > 0.05) { vec3 q = floor(vD*420.0); float st = step(0.9975, h(q)); c += vec3(st)*0.8*y; }
        gl_FragColor = vec4(c,1.0); }`,
  });
  return new THREE.Mesh(geo, mat);
}

const ENV_PRESETS = {
  day: { top: 0x3d74c4, hor: 0xc9dcef, bot: 0x8d8574 },
  sunset: { top: 0x27406e, hor: 0xf0a565, bot: 0x5a4a40 },
  dusk: { top: 0x1c2747, hor: 0xb07a6a, bot: 0x2c2a2e },
  night: { top: 0x04060f, hor: 0x1b1730, bot: 0x0a0a10 },
  overcast: { top: 0x6f757d, hor: 0xb3b0a8, bot: 0x5d5850 },
  snow: { top: 0x8d9cae, hor: 0xd9e1ea, bot: 0xb7c0ca },
};

function env_apply(env) {
  const sc = G.scene;
  if (ENV.sky) { sc.remove(ENV.sky); ENV.sky.geometry.dispose(); ENV.sky.material.dispose(); }
  if (ENV.sun) { sc.remove(ENV.sun); sc.remove(ENV.sun.target); ENV.sun.dispose(); }
  if (ENV.hemi) { sc.remove(ENV.hemi); }
  if (ENV.envTex) { ENV.envTex.dispose(); }
  const e = Object.assign({ sky: 'day', sunElev: 30, sunAzim: 135, sunColor: 0xffd9a8, sunIntensity: 4.5, hemiSky: 0x9ec4ff, hemiGround: 0x6b5a45, hemiIntensity: 1.2, fogColor: 0xb8c6d6, fogDensity: 0.006, exposure: 0.5, bloomThreshold: 2.0, bloomStrength: 0.5 }, env || {});
  const qn = k => URLP.has(k) ? parseFloat(URLP.get(k)) : null;
  if (qn('exp') != null) e.exposure = qn('exp');
  if (qn('bthr') != null) e.bloomThreshold = qn('bthr');
  if (qn('bstr') != null) e.bloomStrength = qn('bstr');
  if (qn('fog') != null) e.fogDensity = qn('fog');
  const el = THREE.MathUtils.degToRad(e.sunElev), az = THREE.MathUtils.degToRad(e.sunAzim);
  const sunDir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
  const pr = ENV_PRESETS[e.sky] || ENV_PRESETS.day;
  const night = e.sky === 'night';
  const sunVisible = e.sky === 'day' || e.sky === 'sunset' || e.sky === 'dusk';
  ENV.sky = env_gradientSky(pr.top, e.fogColor != null && !sunVisible ? new THREE.Color(pr.hor).lerp(new THREE.Color(e.fogColor), 0.5) : pr.hor, pr.bot, sunDir, e.sunColor, sunVisible ? 1 : (night ? 0 : 0.15));
  ENV.sky.renderOrder = -1; ENV.sky.frustumCulled = false;
  sc.add(ENV.sky);
  // IBL dal solo cielo + pavimento scuro (niente luce che arriva da sotto)
  const tmp = new THREE.Scene();
  const skyClone = env_gradientSky(pr.top, pr.hor, pr.bot, sunDir, e.sunColor, sunVisible ? 0.6 : 0);
  tmp.add(skyClone);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(800, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(e.hemiGround).multiplyScalar(0.35) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -5; tmp.add(floor);
  ENV.envTex = ENV.pmrem.fromScene(tmp, 0.02).texture;
  sc.environment = ENV.envTex;
  sc.environmentIntensity = night ? 0.35 : 0.6;
  skyClone.geometry.dispose(); skyClone.material.dispose(); floor.geometry.dispose(); floor.material.dispose();
  sc.background = new THREE.Color(pr.hor);
  sc.fog = new THREE.FogExp2(e.fogColor, e.fogDensity);
  // sole
  const sun = new THREE.DirectionalLight(e.sunColor, e.sunIntensity);
  sun.castShadow = true;
  const sz = 45; const s = sun.shadow;
  s.mapSize.set(URLP.has('demo') ? 2048 : 2048, URLP.has('demo') ? 2048 : 2048);
  s.camera.left = -sz; s.camera.right = sz; s.camera.top = sz; s.camera.bottom = -sz; s.camera.near = 1; s.camera.far = 260;
  s.bias = -0.0004; s.normalBias = 0.04;
  ENV.sunDir = sunDir;
  sc.add(sun); sc.add(sun.target);
  ENV.sun = sun;
  // cielo del riempimento meno saturo: le zone in ombra non devono diventare blu notte
  const hsky = new THREE.Color(e.hemiSky).lerp(new THREE.Color(0xd8d8d4), night ? 0.15 : 0.45);
  const hgr = new THREE.Color(e.hemiGround).lerp(new THREE.Color(0x9a8a74), 0.3);
  ENV.hemi = new THREE.HemisphereLight(hsky, hgr, e.hemiIntensity * (night ? 1 : 1.15));
  sc.add(ENV.hemi);
  sun.layers.enable(1); ENV.hemi.layers.enable(1);
  G.renderer.toneMappingExposure = e.exposure;
  ENV.bloom.threshold = e.bloomThreshold; ENV.bloom.strength = URLP.has('nobloom') ? 0 : e.bloomStrength; ENV.bloom.radius = 0.45;
  env_weather(e);
  ENV.cur = e;
}
function env_followShadow(p) {
  if (!ENV.sun) return;
  // ombra agganciata a texel per non tremolare
  const tex = 90 / 2048;
  const x = Math.round(p.x / tex) * tex, z = Math.round(p.z / tex) * tex;
  ENV.sun.target.position.set(x, 0, z);
  ENV.sun.position.set(x + ENV.sunDir.x * 120, ENV.sunDir.y * 120, z + ENV.sunDir.z * 120);
}

// pioggia / neve / polvere: Points che seguono la camera
function env_weather(e) {
  if (ENV.weather) { G.scene.remove(ENV.weather); ENV.weather.geometry.dispose(); ENV.weather.material.dispose(); ENV.weather = null; }
  const kind = e.rain ? 'rain' : e.snow ? 'snow' : e.dust ? 'dust' : null;
  if (!kind) return;
  const N = kind === 'rain' ? 9000 : kind === 'snow' ? 6000 : 2500;
  const pos = new Float32Array(N * 3), r = core_rng(77);
  for (let i = 0; i < N; i++) { pos[i * 3] = (r() - 0.5) * 60; pos[i * 3 + 1] = r() * 30; pos[i * 3 + 2] = (r() - 0.5) * 60; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const col = kind === 'rain' ? 0x9fb4d0 : kind === 'snow' ? 0xffffff : 0xc8b08a;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { t: { value: 0 }, cam: { value: new THREE.Vector3() }, col: { value: new THREE.Color(col) }, kind: { value: kind === 'rain' ? 0 : kind === 'snow' ? 1 : 2 } },
    vertexShader: `uniform float t; uniform vec3 cam; uniform float kind; varying float vA;
      void main(){ vec3 p = position; float sp = kind < 0.5 ? 16.0 : (kind < 1.5 ? 1.6 : 0.4);
        p.y = mod(p.y - t*sp, 30.0); p.x += kind > 0.5 ? sin(t*0.7 + position.z)*1.5 + t*(kind>1.5?1.5:0.3) : 0.0;
        p.x = mod(p.x - cam.x + 30.0, 60.0) - 30.0 + cam.x; p.z = mod(p.z - cam.z + 30.0, 60.0) - 30.0 + cam.z; p.y += cam.y - 10.0;
        vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv;
        float d = -mv.z; vA = clamp(1.0 - d/30.0, 0.0, 1.0);
        gl_PointSize = clamp((kind < 0.5 ? 1.6 : (kind < 1.5 ? 3.0 : 1.4)) * (40.0 / max(d,1.0)), 1.0, kind < 0.5 ? 3.0 : 6.0); }`,
    fragmentShader: `uniform vec3 col; uniform float kind; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; float a = kind < 0.5 ? (1.0 - smoothstep(0.03, 0.12, abs(c.x))) * 0.55 : (1.0 - smoothstep(0.2,0.5,length(c))) * (kind<1.5?0.9:0.35);
        gl_FragColor = vec4(col, a * vA); if (gl_FragColor.a < 0.01) discard; }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  G.scene.add(pts); ENV.weather = pts;
}
function env_update(dt) {
  if (ENV.weather) { ENV.weather.material.uniforms.t.value += dt; ENV.weather.material.uniforms.cam.value.copy(G.camera.position); }
  if (ENV.sky) ENV.sky.position.copy(G.camera.position);
}
