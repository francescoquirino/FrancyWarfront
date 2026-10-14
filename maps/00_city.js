// Città Distrutta — modellata in Blender da Opus 5.5 (assets/city.glb). Solo modalità "Battaglia normale".
MAPS.push({
  id: 'city', name: 'Città Distrutta', size: 150,
  env: { sky: 'dusk', sunElev: 14, sunAzim: 235, sunColor: 0xffb070, sunIntensity: 4.2,
    hemiSky: 0x8a96b0, hemiGround: 0x6a5a48, hemiIntensity: 1.5,
    fogColor: 0x9c8f86, fogDensity: 0.0075, exposure: 0.62, bloomThreshold: 2.2, bloomStrength: 0.5, dust: true },
  build(kit) {
    if (ASSETS.cityScene) { kit.glbMap(ASSETS.cityScene); return; }
    // la città di Blender non è ancora pronta: usa la Città in Rovina
    const r = MAPS.find(m => m.id === 'ruins'); if (r) r.build(kit);
  },
});
