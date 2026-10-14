// maps/05_snow.js — FABBRICA NELLA NEVE (v4). Tutto costruito col kit, deterministico (solo kit.rng).
// v4: materiali dipinti a codice (facciate con finestre, intonaci colorati, mattoni, asfalto, insegne in italiano).
const map_snow_H = Math.PI / 2;
const map_snow_GLYPH = {
  '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110',
  '2': '01110100010000100010001000100011111', '5': '11111100001000011110000010000111110',
  'З': '11110000010000101110000010000111110', 'А': '01110100011000111111100011000110001',
  'В': '11110100011000111110100011000111110', 'О': '01110100011000110001100011000101110',
  'Д': '00110010100101001010010101111110001', 'Ц': '10010100101001010010100101111100001',
  'Е': '11111100001000011110100001000011111', 'Х': '10001100010101000100010101000110001',
  'С': '01110100011000010000100001000101110', 'Л': '00111010010100101001010010100110001',
  'Т': '11111001000010000100001000010000100', 'Р': '11110100011000111110100001000010000',
  'У': '10001100011000101111000010000101110'
};

// ====================================================================================================
// MATERIALI DIPINTI A CODICE (canvas 2D -> CanvasTexture). Massimo 15: qui sono 14.
// ====================================================================================================
function map_snow_cv(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h || w;
  return [cv, cv.getContext('2d')];
}
function map_snow_tex(T, cv) {
  const t = new T.CanvasTexture(cv);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.colorSpace = T.SRGBColorSpace; t.needsUpdate = true;
  return t;
}
function map_snow_std(T, cv, metres, rough, em, ei) {
  const mat = new T.MeshStandardMaterial({ map: map_snow_tex(T, cv), roughness: rough, metalness: 0 });
  if (em) { mat.emissiveMap = map_snow_tex(T, em); mat.emissive = new T.Color(0xffffff); mat.emissiveIntensity = ei || 2.4; }
  mat.userData.uvScale = 1 / metres;
  return mat;
}
function map_snow_grain(g, w, h, r, n, a) {
  for (let i = 0; i < n; i++) {
    const v = r() < 0.5 ? 30 : 228, s = 1 + r() * 2.5;
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (r() * a).toFixed(3) + ')';
    g.fillRect(r() * w, r() * h, s, s);
  }
}
function map_snow_blotch(g, w, h, r, n, col, a, rad) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, R = rad * (0.35 + r()), gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, 'rgba(' + col + ',' + (a * (0.3 + r() * 0.7)).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
  }
}
function map_snow_crack(g, w, h, r, n, col, lw) {
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let x = r() * w, y = r() * h, a = r() * 6.283;
    g.lineWidth = lw * (0.5 + r()); g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 14; j++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * w * 0.022; y += Math.sin(a) * w * 0.022; g.lineTo(x, y); }
    g.stroke();
  }
}
function map_snow_drips(g, r, x, y, w, n, len, col, a) {
  for (let i = 0; i < n; i++) {
    const sx = x + r() * w, L = len * (0.4 + r()), gr = g.createLinearGradient(0, y, 0, y + L);
    gr.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = gr; g.fillRect(sx, y, 2 + r() * 5, L);
  }
}
function map_snow_bricks(g, r, x0, y0, w, h, bw, bh) {
  g.fillStyle = '#8c857a'; g.fillRect(x0, y0, w, h);
  let row = 0;
  for (let y = y0; y < y0 + h; y += bh, row++) for (let x = x0 - (row % 2) * bw / 2; x < x0 + w; x += bw) {
    const t = r(), d = r() < 0.08 ? -30 : 0, xa = Math.max(x + 1, x0), xb = Math.min(x + bw - 1, x0 + w), hh = Math.min(bh - 2, y0 + h - y - 1);
    if (xb <= xa || hh <= 0) continue;
    g.fillStyle = 'rgb(' + (152 + t * 40 + d | 0) + ',' + (72 + t * 26 + d * 0.5 | 0) + ',' + (56 + t * 22 + d * 0.4 | 0) + ')';
    g.fillRect(xa, y + 1, xb - xa, hh);
  }
}
// FACCIATA 12 m x 12 m (4 piani x 4 finestre). style 0 = pannelli prefabbricati con balconi, 1 = intonaco ocra, 2 = mattoni industriali
function map_snow_facade(kit, T, style) {
  const r = kit.rng, S = 1024, C = 256, cc = map_snow_cv(S), cv = cc[0], g = cc[1], ee = map_snow_cv(512), ev = ee[0], eg = ee[1];
  eg.fillStyle = '#000000'; eg.fillRect(0, 0, 512, 512); eg.scale(0.5, 0.5);
  if (style === 2) map_snow_bricks(g, r, 0, 0, S, S, 32, 16);
  else for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 4; fx++) {
    const t = r();
    if (style === 0) g.fillStyle = (fx + fy * 2) % 3 === 0 ? 'rgb(' + (148 + t * 14 | 0) + ',' + (170 + t * 12 | 0) + ',' + (158 + t * 12 | 0) + ')' : 'rgb(' + (198 + t * 16 | 0) + ',' + (188 + t * 14 | 0) + ',' + (158 + t * 14 | 0) + ')';
    else g.fillStyle = 'rgb(' + (198 + t * 12 | 0) + ',' + (158 + t * 10 | 0) + ',' + (86 + t * 10 | 0) + ')';
    g.fillRect(fx * C, fy * C, C, C);
  }
  map_snow_blotch(g, S, S, r, 50, '40,34,28', 0.16, 130); map_snow_blotch(g, S, S, r, 40, '240,236,220', 0.13, 120);
  const frame = style === 2 ? '#b9ad98' : '#d9d3c1', balc = ['#6f8ea4', '#8d9a6c', '#a8674e', '#b8b09a'];
  for (let i = 0; i < 4; i++) {
    if (style === 0) { g.fillStyle = '#6b6a61'; g.fillRect(0, i * C, S, 4); g.fillRect(i * C, 0, 4, S); g.fillStyle = 'rgba(235,230,215,0.35)'; g.fillRect(0, i * C + 4, S, 2); }
    else { g.fillStyle = style === 1 ? '#d8cfb4' : '#b6a38a'; g.fillRect(0, i * C, S, 14); g.fillStyle = 'rgba(30,25,20,0.35)'; g.fillRect(0, i * C + 14, S, 6); map_snow_drips(g, r, 0, i * C + 20, S, 26, 60, '40,34,28', 0.22); }
  }
  for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 4; fx++) {
    const ww = 120, wh = style === 2 ? 170 : 132, wx = fx * C + 68, wy = fy * C + 54, lit = r() < 0.22, cu = r();
    map_snow_drips(g, r, wx - 8, wy + wh + 14, ww + 16, 6, 60, '40,34,28', 0.3);
    g.fillStyle = frame; g.fillRect(wx - 9, wy - 9, ww + 18, wh + 18);
    if (style === 2) { g.beginPath(); g.ellipse(wx + ww / 2, wy - 8, ww / 2 + 9, 22, 0, Math.PI, 0); g.fill(); }
    const gr = g.createLinearGradient(0, wy, 0, wy + wh);
    if (lit) { gr.addColorStop(0, '#e6c07a'); gr.addColorStop(1, '#d2954a'); } else { gr.addColorStop(0, '#566f86'); gr.addColorStop(1, '#9fb4c2'); }
    g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    if (!lit) { g.fillStyle = 'rgba(220,230,235,0.2)'; g.beginPath(); g.moveTo(wx, wy + wh * 0.7); g.lineTo(wx + ww * 0.6, wy); g.lineTo(wx + ww * 0.92, wy); g.lineTo(wx, wy + wh); g.fill(); }
    if (cu < 0.3) {                                                   // tende ai lati
      g.fillStyle = kit.pick(['rgba(214,202,170,0.9)', 'rgba(170,110,96,0.9)', 'rgba(128,150,128,0.9)', 'rgba(200,196,186,0.9)']);
      g.fillRect(wx, wy, ww * 0.3, wh); if (r() < 0.6) g.fillRect(wx + ww * 0.72, wy, ww * 0.28, wh);
      g.fillStyle = 'rgba(40,34,28,0.18)'; for (let i = 0; i < 4; i++) g.fillRect(wx + 6 + i * 9, wy, 2, wh);
    } else if (cu < 0.5) { g.fillStyle = 'rgba(224,224,214,0.42)'; g.fillRect(wx, wy, ww, wh); }   // tulle
    else if (cu < 0.66) {                                             // tapparella a metà
      const bh = wh * (0.25 + r() * 0.5); g.fillStyle = '#b3ad9c'; g.fillRect(wx, wy, ww, bh);
      g.fillStyle = 'rgba(40,36,30,0.3)'; for (let y = wy + 5; y < wy + bh; y += 8) g.fillRect(wx, y, ww, 2);
    } else if (cu < 0.76 && style === 2 && !lit) {                    // finestra sbarrata con assi
      for (let y = wy; y < wy + wh; y += 28) { const t = r(); g.fillStyle = 'rgb(' + (128 + t * 26 | 0) + ',' + (104 + t * 20 | 0) + ',' + (76 + t * 16 | 0) + ')'; g.fillRect(wx, y + 1, ww, 26); }
    }
    g.fillStyle = frame;
    if (style === 2) {
      g.fillStyle = '#4a5054'; for (let i = 1; i < 3; i++) g.fillRect(wx + i * ww / 3 - 2, wy, 4, wh); for (let i = 1; i < 5; i++) g.fillRect(wx, wy + i * wh / 5 - 2, ww, 4);
      if (!lit) for (let i = 0; i < 3; i++) if (r() < 0.5) { g.fillStyle = '#2d343a'; g.fillRect(wx + (r() * 3 | 0) * ww / 3 + 3, wy + (r() * 5 | 0) * wh / 5 + 3, ww / 3 - 6, wh / 5 - 6); }
    } else { g.fillRect(wx + ww / 2 - 3, wy, 6, wh); g.fillRect(wx, wy + wh * 0.3 - 3, ww, 6); }
    if (lit) eg.drawImage(cv, wx, wy, ww, wh, wx, wy, ww, wh);
    if (style === 0 && fx % 2 === 1) {                                // balcone a pannello colorato
      const bx = wx - 34, by = wy + wh + 4, bw = ww + 68, bh = 62;
      g.fillStyle = 'rgba(25,22,20,0.3)'; g.fillRect(bx + 6, by + bh, bw, 8);
      g.fillStyle = balc[(fx + fy * 3 + (r() * 2 | 0)) % 4]; g.fillRect(bx, by, bw, bh);
      g.fillStyle = 'rgba(30,28,26,0.28)'; for (let x = bx + 12; x < bx + bw; x += 24) g.fillRect(x, by, 3, bh);
      g.fillStyle = '#5a5f62'; g.fillRect(bx - 3, by - 5, bw + 6, 6); g.fillStyle = '#dde3e6'; g.fillRect(bx - 2, by - 11, bw + 4, 7);
      map_snow_drips(g, r, bx, by + bh, bw, 5, 40, '90,60,40', 0.3);
    } else {
      g.fillStyle = '#bdb6a3'; g.fillRect(wx - 14, wy + wh + 9, ww + 28, 9); g.fillStyle = '#dde3e6'; g.fillRect(wx - 12, wy + wh + 3, ww + 24, 7);
    }
    if (style === 1 && r() < 0.3) {                                   // condizionatore
      const ax = wx + ww + 14, ay = wy + wh - 30; g.fillStyle = '#aeb4b4'; g.fillRect(ax, ay, 40, 30); g.fillStyle = '#5c6468'; g.beginPath(); g.arc(ax + 20, ay + 15, 10, 0, 6.283); g.fill(); g.fillStyle = '#dde3e6'; g.fillRect(ax - 1, ay - 5, 42, 6);
    }
  }
  if (style !== 0) { g.fillStyle = '#7a5a48'; g.fillRect(6, 0, 9, S); g.fillStyle = 'rgba(25,22,20,0.3)'; g.fillRect(15, 0, 4, S); for (let y = 90; y < S; y += 256) { g.fillStyle = '#5e4638'; g.fillRect(3, y, 15, 7); } }
  map_snow_crack(g, S, S, r, style === 0 ? 5 : 9, 'rgba(48,42,36,0.55)', 1.8);
  map_snow_blotch(g, S, S, r, 26, '222,230,234', 0.2, 60); map_snow_grain(g, S, S, r, 16000, 0.12);
  return map_snow_std(T, cv, 12, 0.9, ev, 2.6);
}
function map_snow_plaster(kit, T, R, G, B) {   // intonaco colorato con macchie, colature, crepe e mattoni a vista
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  g.fillStyle = 'rgb(' + R + ',' + G + ',' + B + ')'; g.fillRect(0, 0, S, S);
  map_snow_blotch(g, S, S, r, 40, '250,244,226', 0.16, 90); map_snow_blotch(g, S, S, r, 40, '44,38,30', 0.18, 80);
  for (let i = 0; i < 3; i++) {
    const cx = 70 + r() * 370, cy = 70 + r() * 370;
    g.save(); g.beginPath();
    for (let j = 0; j < 10; j++) { const a = j / 10 * 6.283, rad = 20 + r() * 34; g.lineTo(cx + Math.cos(a) * rad * 1.5, cy + Math.sin(a) * rad); }
    g.closePath(); g.strokeStyle = 'rgba(240,234,214,0.55)'; g.lineWidth = 5; g.stroke(); g.clip();
    map_snow_bricks(g, r, cx - 100, cy - 70, 200, 140, 30, 13); g.restore();
  }
  map_snow_drips(g, r, 0, 0, S, 22, 220, '50,42,34', 0.16);
  map_snow_crack(g, S, S, r, 5, 'rgba(52,44,36,0.55)', 1.5); map_snow_grain(g, S, S, r, 6000, 0.12);
  return map_snow_std(T, cv, 4, 0.95);
}
function map_snow_brickwall(kit, T) {
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  map_snow_bricks(g, r, 0, 0, S, S, 32, 16);
  map_snow_blotch(g, S, S, r, 30, '36,30,28', 0.28, 90); map_snow_blotch(g, S, S, r, 26, '226,224,214', 0.2, 60);
  map_snow_drips(g, r, 0, 0, S, 14, 240, '36,30,28', 0.2); map_snow_grain(g, S, S, r, 5000, 0.14);
  return map_snow_std(T, cv, 3, 0.94);
}
function map_snow_asphalt(kit, T) {   // asfalto con toppe, crepe, olio e neve battuta
  const r = kit.rng, S = 1024, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  g.fillStyle = '#5c636a'; g.fillRect(0, 0, S, S); map_snow_grain(g, S, S, r, 30000, 0.26);
  for (let i = 0; i < 8; i++) {
    const x = r() * 850, y = r() * 850, w = 60 + r() * 200, h = 50 + r() * 160;
    g.fillStyle = r() < 0.5 ? 'rgba(62,68,74,0.85)' : 'rgba(104,110,114,0.7)'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(44,48,52,0.7)'; g.lineWidth = 2.5; g.strokeRect(x, y, w, h);
  }
  map_snow_blotch(g, S, S, r, 14, '38,40,44', 0.5, 60); map_snow_crack(g, S, S, r, 18, 'rgba(46,50,54,0.9)', 2.4);
  map_snow_blotch(g, S, S, r, 60, '222,230,234', 0.55, 75); map_snow_grain(g, S, S, r, 5000, 0.3);
  return map_snow_std(T, cv, 8, 0.93);
}
function map_snow_paving(kit, T) {   // marciapiede a lastre con neve nelle fughe
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const t = r(); g.fillStyle = 'rgb(' + (150 + t * 22 | 0) + ',' + (152 + t * 20 | 0) + ',' + (148 + t * 20 | 0) + ')'; g.fillRect(i * 128, j * 128, 128, 128);
    g.fillStyle = 'rgba(60,62,64,0.8)'; g.fillRect(i * 128, j * 128, 128, 3); g.fillRect(i * 128, j * 128, 3, 128);
    g.fillStyle = 'rgba(222,230,234,0.6)'; g.fillRect(i * 128 + 3, j * 128 + 3, 125, 2 + r() * 5); g.fillRect(i * 128 + 3, j * 128 + 3, 2 + r() * 5, 125);
  }
  map_snow_crack(g, S, S, r, 6, 'rgba(56,58,60,0.8)', 1.6); map_snow_blotch(g, S, S, r, 26, '222,230,234', 0.5, 50);
  map_snow_blotch(g, S, S, r, 12, '70,60,48', 0.25, 40); map_snow_grain(g, S, S, r, 7000, 0.16);
  return map_snow_std(T, cv, 4, 0.94);
}
function map_snow_tiles(kit, T) {   // piastrelle a scacchi crema/terracotta consumate
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  g.fillStyle = '#77736a'; g.fillRect(0, 0, S, S);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const t = r() * 10 | 0; g.fillStyle = (i + j) % 2 ? 'rgb(' + (192 + t) + ',' + (182 + t) + ',' + (156 + t) + ')' : 'rgb(' + (164 + t) + ',' + (100 + t) + ',' + (78 + t) + ')';
    g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
  }
  map_snow_blotch(g, S, S, r, 26, '60,54,46', 0.3, 60); map_snow_blotch(g, S, S, r, 14, '226,226,216', 0.2, 50);
  map_snow_crack(g, S, S, r, 4, 'rgba(56,50,44,0.7)', 1.4); map_snow_grain(g, S, S, r, 4000, 0.12);
  return map_snow_std(T, cv, 4, 0.7);
}
function map_snow_parquet(kit, T) {   // assi di legno con usura al centro
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  g.fillStyle = '#4e3b2a'; g.fillRect(0, 0, S, S);
  for (let j = 0; j < 16; j++) for (let x = -r() * 120; x < S;) {
    const L = 90 + r() * 120, t = r(); g.fillStyle = 'rgb(' + (140 + t * 34 | 0) + ',' + (100 + t * 26 | 0) + ',' + (62 + t * 20 | 0) + ')';
    g.fillRect(x + 1, j * 32 + 1, L - 2, 30);
    g.fillStyle = 'rgba(60,40,24,0.25)'; for (let k2 = 0; k2 < 3; k2++) g.fillRect(x + 4, j * 32 + 5 + r() * 22, L - 8, 1);
    x += L;
  }
  map_snow_blotch(g, S, S, r, 20, '190,180,160', 0.25, 70); map_snow_blotch(g, S, S, r, 14, '44,34,26', 0.3, 50); map_snow_grain(g, S, S, r, 3000, 0.1);
  return map_snow_std(T, cv, 4, 0.75);
}
function map_snow_innerwall(kit, T) {   // parete interna "a due toni": zoccolo verde-petrolio lucido, sopra calce color crema
  const r = kit.rng, S = 512, cc = map_snow_cv(S), cv = cc[0], g = cc[1], y0 = S * 0.56;
  g.fillStyle = 'rgb(206,198,172)'; g.fillRect(0, 0, S, y0); g.fillStyle = 'rgb(94,140,130)'; g.fillRect(0, y0, S, S - y0);
  g.fillStyle = 'rgb(60,96,90)'; g.fillRect(0, y0 - 3, S, 7); g.fillStyle = 'rgb(92,72,56)'; g.fillRect(0, S - 22, S, 22);
  map_snow_blotch(g, S, S, r, 30, '50,44,36', 0.15, 80); map_snow_blotch(g, S, S, r, 20, '236,230,212', 0.15, 70);
  for (let i = 0; i < 9; i++) {                                    // vernice scrostata
    const cx = r() * S, cy = y0 + 20 + r() * (S - y0 - 60);
    g.fillStyle = 'rgb(' + (188 + r() * 14 | 0) + ',' + (182 + r() * 12 | 0) + ',' + (160 + r() * 10 | 0) + ')'; g.beginPath();
    for (let j = 0; j < 8; j++) { const a = j / 8 * 6.283, rad = 5 + r() * 16; g.lineTo(cx + Math.cos(a) * rad * 1.4, cy + Math.sin(a) * rad); }
    g.fill();
  }
  map_snow_drips(g, r, 0, 0, S, 10, 160, '70,58,44', 0.14); map_snow_crack(g, S, S, r, 4, 'rgba(60,52,44,0.5)', 1.3);
  g.fillStyle = 'rgba(40,36,32,0.25)'; for (let i = 0; i < 26; i++) g.fillRect(r() * S, S - 60 + r() * 36, 10 + r() * 40, 1.5);
  map_snow_grain(g, S, S, r, 4000, 0.1);
  return map_snow_std(T, cv, 3.4, 0.82);
}
function map_snow_hazard(kit, T) {   // strisce giallo/nero consumate
  const r = kit.rng, S = 256, cc = map_snow_cv(S), cv = cc[0], g = cc[1];
  g.fillStyle = '#d2a82c'; g.fillRect(0, 0, S, S); g.fillStyle = '#2e3236';
  for (let i = -S; i < S * 2; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 32 - S, S); g.lineTo(i - S, S); g.fill(); }
  map_snow_blotch(g, S, S, r, 16, '120,74,46', 0.4, 36); map_snow_blotch(g, S, S, r, 10, '222,230,234', 0.3, 30); map_snow_grain(g, S, S, r, 2500, 0.2);
  const mat = map_snow_std(T, cv, 1, 0.8); mat.metalness = 0.25; return mat;
}
// ATLANTE DELLE INSEGNE: 16 targhe 2:1 in una sola texture (2 colonne x 8 righe)
function map_snow_signs(kit, T) {
  const r = kit.rng, cc = map_snow_cv(1024, 2048), cv = cc[0], g = cc[1], ink = '#2a2f33', pale = '#e0ded2';
  const L = [
    ['DIREZIONE', 'PALAZZINA A', '#2f5f8a', pale, 0], ['DORMITORIO', 'PALAZZINA B', '#2f5f8a', pale, 0],
    ['MENSA', 'ORARIO 12 - 14', '#8a3f34', pale, 0], ['MAGAZZINO', 'DEPOSITO 3', '#3f6b55', pale, 0],
    ['SALA CONTROLLO', 'SOLO PERSONALE', '#2f5f8a', pale, 0], ['OFFICINA', 'REPARTO 2', '#3f6b55', pale, 0],
    ['ZONA 4', 'AREA MILITARE', '#4f5c46', '#d6b63a', 1], ['PERICOLO', 'ALTA TENSIONE', '#d6b63a', ink, 2],
    ['VIETATO', "L'ACCESSO", '#dcd8cc', '#b23a30', 0], ['GLORIA', 'AL LAVORO!', '#a8392f', '#e2cf96', 3],
    ['FRANCY 05', '', '#8f979b', '#c9462f', 4], ['RIFUGIO', 'PUNTO DI RACCOLTA', '#3f8a5a', pale, 0],
    ['BINARIO 1', '', '#dcd8cc', ink, 0], ['BINARIO 2', '', '#dcd8cc', ink, 0],
    ['CARICO MAX', '40 T', '#d6b63a', ink, 1], ['ATTENZIONE', 'AI TRENI', '#d6b63a', ink, 2]
  ];
  const txt = (s, cx, cy, maxW, size) => {
    g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif';
    while (g.measureText(s).width > maxW && size > 18) { size -= 4; g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif'; }
    g.fillText(s, cx, cy);
  };
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (let i = 0; i < L.length; i++) {
    const a = L[i][0], b = L[i][1], bg = L[i][2], fg = L[i][3], kind = L[i][4];
    let cx = 256, mw = 430;
    g.save(); g.translate((i % 2) * 512, (i >> 1) * 256); g.beginPath(); g.rect(0, 0, 512, 256); g.clip();
    g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
    if (kind === 0) { g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(16, 16, 480, 224); for (const p of [[32, 32], [480, 32], [32, 224], [480, 224]]) { g.fillStyle = '#6a6f72'; g.beginPath(); g.arc(p[0], p[1], 6, 0, 6.283); g.fill(); } }
    if (kind === 1) { g.fillStyle = fg; for (let x = -40; x < 560; x += 56) for (const y of [0, 220]) { g.beginPath(); g.moveTo(x, y + 36); g.lineTo(x + 28, y + 36); g.lineTo(x + 64, y); g.lineTo(x + 36, y); g.fill(); } }
    if (kind === 2) {
      g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(10, 10, 492, 236);
      g.fillStyle = fg; g.beginPath(); g.moveTo(28, 208); g.lineTo(152, 208); g.lineTo(90, 52); g.fill();
      g.fillStyle = bg; g.beginPath(); g.moveTo(50, 196); g.lineTo(130, 196); g.lineTo(90, 84); g.fill();
      g.fillStyle = fg; g.beginPath(); g.moveTo(98, 104); g.lineTo(76, 152); g.lineTo(90, 152); g.lineTo(80, 188); g.lineTo(108, 138); g.lineTo(94, 138); g.fill();
      cx = 326; mw = 320;
    }
    if (kind === 3) {
      g.fillStyle = 'rgba(214,120,70,0.5)'; for (let k2 = 0; k2 < 9; k2++) { const a0 = -1.5 + k2 * 0.36; g.beginPath(); g.moveTo(96, 150); g.lineTo(96 + Math.cos(a0) * 700, 150 + Math.sin(a0) * 700); g.lineTo(96 + Math.cos(a0 + 0.16) * 700, 150 + Math.sin(a0 + 0.16) * 700); g.fill(); }
      g.strokeStyle = fg; g.lineWidth = 12; g.beginPath(); g.arc(96, 150, 62, 0, 6.283); g.stroke();
      for (let k2 = 0; k2 < 12; k2++) { g.save(); g.translate(96, 150); g.rotate(k2 * 0.5236); g.fillStyle = fg; g.fillRect(-9, -80, 18, 18); g.restore(); }
      g.fillStyle = '#d6b63a'; g.beginPath(); for (let k2 = 0; k2 < 10; k2++) { const rr = k2 % 2 ? 20 : 48, a0 = -1.5708 + k2 * 0.6283; g.lineTo(96 + Math.cos(a0) * rr, 150 + Math.sin(a0) * rr); } g.fill();
      g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 496, 240); cx = 338; mw = 300;
    }
    g.fillStyle = fg;
    if (kind === 4) {
      map_snow_grain(g, 512, 256, r, 2500, 0.2);
      g.save(); g.translate(256, 120); g.rotate(-0.07); g.font = 'italic bold 104px Arial, Helvetica, sans-serif';
      g.strokeStyle = ink; g.lineWidth = 16; g.strokeText(a, 0, 0); g.fillStyle = fg; g.fillText(a, 0, 0);
      g.fillStyle = '#d6b63a'; g.font = 'italic bold 104px Arial, Helvetica, sans-serif'; g.save(); g.beginPath(); g.rect(-256, -60, 512, 44); g.clip(); g.fillText(a, 0, 0); g.restore();
      g.strokeStyle = '#3f7fa8'; g.lineWidth = 9; g.beginPath(); g.moveTo(-210, 74); g.quadraticCurveTo(0, 104, 214, 62); g.stroke(); g.restore();
      map_snow_drips(g, r, 60, 150, 390, 9, 70, '201,70,47', 0.8);
    } else if (b) { txt(a, cx, 100, mw, 92); txt(b, cx, 182, mw, 50); }
    else txt(a, cx, 128, mw, 124);
    if (kind !== 4) { map_snow_blotch(g, 512, 256, r, 9, '112,70,44', 0.5, 40); g.strokeStyle = 'rgba(60,56,50,0.35)'; g.lineWidth = 1.2; for (let k2 = 0; k2 < 10; k2++) { const x = r() * 512, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 70, y + r() * 16 - 8); g.stroke(); } }
    g.fillStyle = 'rgba(222,230,234,0.92)'; for (let x = 0; x < 512; x += 16) g.fillRect(x, 0, 16, 3 + r() * 9);
    map_snow_grain(g, 512, 256, r, 1200, 0.14);
    g.restore();
  }
  const mat = new T.MeshStandardMaterial({ map: map_snow_tex(T, cv), roughness: 0.7, metalness: 0.1 });
  mat.userData.uvScale = 1;
  return mat;
}
// targa dall'atlante: la faccia guarda (sin ry, 0, cos ry) — ry 0 = sud (+Z), PI = nord, PI/2 = est, -PI/2 = ovest
function map_snow_plate(c, idx, x, y, z, ry, w, h) {
  const g = new c.T.PlaneGeometry(w, h), a = g.attributes.uv, u0 = (idx % 2) * 0.5 + 0.004, v0 = 1 - ((idx >> 1) + 1) / 8 + 0.002;
  for (let i = 0; i < a.count; i++) a.setXY(i, u0 + a.getX(i) * 0.492, v0 + a.getY(i) * 0.121);
  g.rotateY(ry); g.translate(x, y, z); c.signs.push(g);
}
function map_snow_board(c, idx, x, y, z, ry, w, h) {   // targa con lamiera di supporto
  map_snow_I(c, c.g.box, c.m.metal, x, y, z, w + 0.08, h + 0.08, 0.04, 0, ry, 0);
  map_snow_plate(c, idx, x + Math.sin(ry) * 0.03, y, z + Math.cos(ry) * 0.03, ry, w, h);
}
function map_snow_post(c, idx, x, z, ry, top, w, h) {   // cartello su palo
  map_snow_S(c, c.m.metal, x, 0, z, x, top, z, 0.045);
  map_snow_board(c, idx, x + Math.sin(ry) * 0.07, top - h / 2, z + Math.cos(ry) * 0.07, ry, w, h);
  map_snow_I(c, c.g.box, c.m.snow, x + Math.sin(ry) * 0.05, top + 0.07, z + Math.cos(ry) * 0.05, w + 0.1, 0.06, 0.16, 0, ry, 0);
}

// ---------- contesto: geometrie condivise + raccolta delle istanze (1 draw call per geometria+materiale) ----------
function map_snow_ctx(kit) {
  const T = kit.THREE;
  const uv = (g, u, v) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * u, a.getY(i) * v); return g; };
  const rock = new T.IcosahedronGeometry(1, 1), p = rock.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.22 * Math.sin(x * 5.1 + y * 3.7) * Math.cos(z * 4.3 - y * 2.9) + 0.1 * Math.sin(z * 9.2 + x * 7.7);
    p.setXYZ(i, x * k, y * k * 0.8, z * k);
  }
  rock.computeVertexNormals();
  const prism = (pts, depth) => {
    const s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g;
  };
  const wedge = prism([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5]], 1); wedge.rotateY(map_snow_H);      // alto a z=-0.5, zero a z=+0.5
  const shed = prism([[-3, 0], [3, 0], [3, 1.8]], 12.4); shed.rotateY(map_snow_H);                 // dente del tetto a shed (misure vere)
  const jersey = prism([[-0.32, 0], [0.32, 0], [0.32, 0.2], [0.11, 0.5], [0.08, 0.92], [-0.08, 0.92], [-0.11, 0.5], [-0.32, 0.2]], 3);
  const parts = [], rr = (y) => 4 * Math.sqrt(1 + ((y - 15.5) / 11.27) ** 2);
  for (let i = 0; i < 8; i++) parts.push(uv(new T.CylinderGeometry(rr(i * 2.75 + 2.75), rr(i * 2.75), 2.75, 28, 1, true), 14, 1.4).translate(0, i * 2.75 + 1.375, 0));
  return {
    kit, T, m: null, bat: new Map(), signs: [],
    v: new T.Vector3(), s: new T.Vector3(), d: new T.Vector3(), up: new T.Vector3(0, 1, 0),
    e: new T.Euler(), q: new T.Quaternion(), q2: new T.Quaternion(), mx: new T.Matrix4(),
    g: {
      box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 14), rod: new T.CylinderGeometry(1, 1, 1, 6),
      bcyl: uv(new T.CylinderGeometry(1, 1, 1, 20), 4, 2), chim: uv(new T.CylinderGeometry(0.55, 1, 1, 20), 5, 14),
      cone: new T.ConeGeometry(1, 1, 8), pyr: new T.ConeGeometry(1, 1, 4), ico: new T.IcosahedronGeometry(1, 0),
      sph: new T.SphereGeometry(1, 10, 7), tor: new T.TorusGeometry(1, 0.3, 6, 14), rock, wedge, shed, jersey,
      tower: mergeGeometries(parts)
    }
  };
}
function map_snow_put(c, geo, mat) {
  let a = c.bat.get(geo); if (!a) { a = new Map(); c.bat.set(geo, a); }
  let l = a.get(mat); if (!l) { l = []; a.set(mat, l); }
  l.push(c.mx.clone());
}
// istanza generica: y = CENTRO
function map_snow_I(c, geo, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  c.v.set(x, y, z); c.s.set(sx, sy, sz); c.q.setFromEuler(c.e.set(rx, ry, rz));
  c.mx.compose(c.v, c.q, c.s); map_snow_put(c, geo, mat);
}
// asta/tubo tra due punti
function map_snow_S(c, mat, ax, ay, az, bx, by, bz, r, geo) {
  c.d.set(bx - ax, by - ay, bz - az); const len = c.d.length(); if (len < 1e-5) return;
  c.d.multiplyScalar(1 / len); c.v.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); c.s.set(r, len, r);
  c.q.setFromUnitVectors(c.up, c.d); c.mx.compose(c.v, c.q, c.s); map_snow_put(c, geo || c.g.rod, mat);
}
// sistema locale ruotato: b = kit.box (y base), d = scatola di dettaglio (y base), c = cilindro (y base), i = istanza (y centro)
function map_snow_F(c, ox, oz, rot = 0) {
  const cs = Math.cos(rot), sn = Math.sin(rot), kit = c.kit;
  const X = (lx, lz) => ox + lx * cs + lz * sn, Z = (lx, lz) => oz - lx * sn + lz * cs;
  return {
    X, Z, rot,
    b(lx, y, lz, w, h, d, mat, collide = false, cast = true) { kit.box(X(lx, lz), y, Z(lx, lz), w, h, d, mat, { collide, rotY: rot, cast }); },
    d(mat, lx, y, lz, w, h, d, ry = 0) { map_snow_I(c, c.g.box, mat, X(lx, lz), y + h / 2, Z(lx, lz), w, h, d, 0, rot + ry, 0); },
    c(mat, lx, y, lz, r, h, geo) { map_snow_I(c, geo || c.g.cyl, mat, X(lx, lz), y + h / 2, Z(lx, lz), r, h, r, 0, rot, 0); },
    i(geo, mat, lx, y, lz, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
      c.q2.setFromAxisAngle(c.up, rot); c.q.setFromEuler(c.e.set(rx, ry, rz)); c.q2.multiply(c.q);
      c.v.set(X(lx, lz), y, Z(lx, lz)); c.s.set(sx, sy, sz); c.mx.compose(c.v, c.q2, c.s); map_snow_put(c, geo, mat);
    },
    s(mat, ax, ay, az, bx, by, bz, r, geo) { map_snow_S(c, mat, X(ax, az), ay, Z(ax, az), X(bx, bz), by, Z(bx, bz), r, geo); },
    w(lx, y, lz, R, wd) {   // ruota: copertone a toro + cerchione
      this.i(c.g.tor, c.m.rubber, lx, y, lz, R / 1.3, R / 1.3, wd / 0.6, 0, map_snow_H, 0);
      this.i(c.g.cyl, c.m.metal, lx, y, lz, R * 0.55, wd * 0.9, R * 0.55, 0, 0, map_snow_H);
    },
    col(x0, y0, z0, x1, y1, z1) {
      const xs = [X(x0, z0), X(x1, z0), X(x0, z1), X(x1, z1)], zs = [Z(x0, z0), Z(x1, z0), Z(x0, z1), Z(x1, z1)];
      kit.collider(Math.min(...xs), y0, Math.min(...zs), Math.max(...xs), y1, Math.max(...zs));
    }
  };
}
// tubazione a spezzata con gomiti e flange
function map_snow_pipe(c, mat, pts, r, fl) {
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    map_snow_I(c, c.g.sph, mat, p[0], p[1], p[2], r * 1.05, r * 1.05, r * 1.05);
    if (!q) break;
    map_snow_S(c, mat, p[0], p[1], p[2], q[0], q[1], q[2], r, c.g.bcyl);
    if (!fl) continue;
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz), e = 0.07 / L;
    for (let t = fl / 2; t < L; t += fl) {
      const u = t / L;
      map_snow_S(c, c.m.rust, p[0] + dx * (u - e), p[1] + dy * (u - e), p[2] + dz * (u - e), p[0] + dx * (u + e), p[1] + dy * (u + e), p[2] + dz * (u + e), r * 1.22, c.g.cyl);
    }
  }
}
// scritta a "lampadine": la faccia guarda -Z locale (rot 0 = nord, PI = sud, -PI/2 = est, PI/2 = ovest)
function map_snow_sign(c, x, y, z, rot, text, px, mat, board = true) {
  const f = map_snow_F(c, x, z, rot), n = text.length * 6 - 1;
  if (board) f.b(0, y - px * 1.5, 0.06, n * px + px * 3, px * 10, 0.1, c.m.paint);
  for (let i = 0; i < text.length; i++) {
    const gl = map_snow_GLYPH[text[i]]; if (!gl) continue;
    for (let k = 0; k < 35; k++) if (gl[k] === '1') f.d(mat, -((i * 6 + k % 5 + 0.5) - n / 2) * px, y + (6 - (k / 5 | 0)) * px, -0.03, px * 0.86, px * 0.86, 0.06);
  }
}

// ---------- oggetti di scena ----------
function map_snow_crate(c, x, z, rot, w = 1.3, h = 1.1, y = 0) {
  const f = map_snow_F(c, x, z, rot), m = c.m, e = w / 2 + 0.02;
  f.b(0, y, 0, w, h, w, m.wood, true);
  for (const s of [-1, 1]) {
    f.d(m.wood, s * (w / 2 - 0.06), y, -e, 0.12, h, 0.04); f.d(m.wood, s * (w / 2 - 0.06), y, e, 0.12, h, 0.04);
    f.d(m.wood, -e, y, s * (w / 2 - 0.06), 0.04, h, 0.12); f.d(m.wood, e, y, s * (w / 2 - 0.06), 0.04, h, 0.12);
    const yy = y + (s > 0 ? h - 0.12 : 0);
    f.d(m.wood, 0, yy, -e, w, 0.12, 0.04); f.d(m.wood, 0, yy, e, w, 0.12, 0.04); f.d(m.wood, -e, yy, 0, 0.04, 0.12, w); f.d(m.wood, e, yy, 0, 0.04, 0.12, w);
  }
  f.d(m.metal, 0, y + h * 0.45, -e - 0.02, 0.3, 0.2, 0.02); f.d(m.snow, 0.03, y + h, 0, w * 0.95, 0.07, w * 0.93);
}
function map_snow_barrel(c, x, z, mat, lying = false) {
  const m = c.m, g = c.g;
  if (lying) { map_snow_I(c, g.cyl, mat, x, 0.3, z, 0.3, 0.92, 0.3, 0, c.kit.rand(0, 3), map_snow_H); return; }
  map_snow_I(c, g.cyl, mat, x, 0.46, z, 0.3, 0.92, 0.3);
  map_snow_I(c, g.cyl, m.metal, x, 0.3, z, 0.315, 0.04, 0.315); map_snow_I(c, g.cyl, m.metal, x, 0.62, z, 0.315, 0.04, 0.315);
  map_snow_I(c, g.cyl, m.snow, x, 0.94, z, 0.28, 0.05, 0.28);
  c.kit.collider(x - 0.27, 0, z - 0.27, x + 0.27, 0.95, z + 0.27);
}
function map_snow_fire(c, x, z) {   // bidone-braciere
  const m = c.m, g = c.g, k = c.kit;
  map_snow_I(c, g.cyl, m.rust, x, 0.45, z, 0.33, 0.9, 0.33); map_snow_I(c, g.cyl, m.fire, x, 0.9, z, 0.29, 0.04, 0.29);
  for (let i = 0; i < 5; i++) map_snow_I(c, g.cone, m.fire, x + k.rand(-0.15, 0.15), 1.1 + k.rand(0, 0.15), z + k.rand(-0.15, 0.15), 0.09, k.rand(0.3, 0.6), 0.09);
  k.collider(x - 0.3, 0, z - 0.3, x + 0.3, 0.9, z + 0.3);
}
function map_snow_jersey(c, x, z, rot) {   // lunga 3 m lungo Z locale
  const f = map_snow_F(c, x, z, rot), m = c.m;
  f.i(c.g.jersey, m.conc, 0, 0, 0, 1, 1, 1);
  for (const s of [-1, 1]) { f.d(m.red, 0.115, 0.52, s * 0.9, 0.02, 0.3, 0.5); f.d(m.white, -0.115, 0.52, s * 0.9, 0.02, 0.3, 0.5); f.d(m.white, 0.115, 0.52, s * 0.3, 0.02, 0.3, 0.5); }
  f.d(m.snow, 0, 0.92, 0, 0.2, 0.07, 2.9); f.col(-0.3, 0, -1.5, 0.3, 0.95, 1.5);
}
function map_snow_bags(c, x, z, rot, n = 4) {   // muro di sacchi lungo X locale
  const f = map_snow_F(c, x, z, rot), m = c.m, k = c.kit, L = n * 0.74;
  for (let r = 0; r < 4; r++) for (let i = 0; i < n - (r % 2); i++) {
    const lx = -L / 2 + 0.37 + i * 0.74 + (r % 2) * 0.37, lz = k.rand(-0.05, 0.05);
    f.i(c.g.ico, m.bag, lx, 0.14 + r * 0.26, lz, 0.42, 0.17, 0.3, 0, k.rand(-0.1, 0.1), 0);
    if (r === 3 || (r === 2 && i === 0)) f.i(c.g.sph, m.snow, lx, 0.3 + r * 0.26, lz, 0.36, 0.07, 0.26);
  }
  f.col(-L / 2, 0, -0.32, L / 2, 1.1, 0.32);
}
function map_snow_pallets(c, x, z, rot, n = 4) {
  const f = map_snow_F(c, x, z, rot), m = c.m;
  for (let i = 0; i < n; i++) {
    const y = i * 0.15, r = c.kit.rand(-0.05, 0.05);
    for (const a of [-0.5, 0, 0.5]) f.d(m.wood, a, y, 0, 0.1, 0.09, 1.0, r);
    for (let j = -2; j <= 2; j++) f.d(m.wood, 0, y + 0.09, j * 0.22, 1.2, 0.03, 0.14, r);
  }
  f.d(m.snow, 0, n * 0.15 - 0.02, 0, 1.1, 0.06, 0.9); f.col(-0.6, 0, -0.5, 0.6, n * 0.15, 0.5);
}
function map_snow_tires(c, x, z, n = 3) {
  for (let i = 0; i < n; i++) map_snow_I(c, c.g.tor, c.m.rubber, x + c.kit.rand(-0.05, 0.05), 0.14 + i * 0.27, z + c.kit.rand(-0.05, 0.05), 0.36, 0.36, 0.45, map_snow_H, 0, 0);
  map_snow_I(c, c.g.sph, c.m.snow, x, n * 0.27 + 0.02, z, 0.42, 0.06, 0.42);
  c.kit.collider(x - 0.45, 0, z - 0.45, x + 0.45, n * 0.27, z + 0.45);
}
function map_snow_reel(c, x, z, rot) {   // bobina di cavo
  const f = map_snow_F(c, x, z, rot), m = c.m, g = c.g;
  for (const s of [-1, 1]) f.i(g.cyl, m.wood, s * 0.45, 0.8, 0, 0.8, 0.07, 0.8, 0, 0, map_snow_H);
  f.i(g.cyl, m.rubber, 0, 0.8, 0, 0.45, 0.84, 0.45, 0, 0, map_snow_H); f.d(m.snow, 0, 1.58, 0, 0.98, 0.06, 0.4);
  f.col(-0.5, 0, -0.8, 0.5, 1.6, 0.8);
}
function map_snow_container(c, x, y, z, rot, mat) {
  const f = map_snow_F(c, x, z, rot), m = c.m;
  f.b(0, y, 0, 2.44, 2.6, 6.06, mat, true);
  for (let i = -2.8; i <= 2.81; i += 0.4) for (const s of [-1, 1]) f.d(mat, s * 1.24, y + 0.15, i, 0.05, 2.3, 0.2);
  for (const s of [-0.6, 0.6]) f.d(m.metal, s, y + 0.2, 3.05, 0.05, 2.2, 0.05);
  f.d(m.white, 0.7, y + 1.7, -3.045, 0.7, 0.35, 0.02); f.d(m.snow, 0, y + 2.6, 0, 2.4, 0.08, 6);
}
function map_snow_lamp(c, x, z, rot) {   // lampione: braccio verso -Z locale
  const f = map_snow_F(c, x, z, rot), m = c.m;
  f.d(m.conc, 0, 0, 0, 0.5, 0.4, 0.5); f.s(m.metal, 0, 0.3, 0, 0, 7, 0, 0.08); f.s(m.metal, 0, 7, 0, 0, 7.5, -1.6, 0.05);
  f.d(m.metal, 0, 7.42, -1.9, 0.34, 0.14, 0.8); f.d(m.amber, 0, 7.39, -1.9, 0.24, 0.04, 0.6); f.d(m.snow, 0, 7.56, -1.9, 0.36, 0.06, 0.82);
  c.kit.collider(x - 0.2, 0, z - 0.2, x + 0.2, 7, z + 0.2);
}
function map_snow_pine(c, x, z, h, col = false) {
  const k = c.kit, m = c.m, g = c.g, lx = k.rand(-0.3, 0.3), lz = k.rand(-0.3, 0.3);
  map_snow_S(c, m.wood, x, 0, z, x + lx * 0.5, h * 0.5, z + lz * 0.5, h * 0.024);
  map_snow_S(c, m.wood, x + lx * 0.5, h * 0.5, z + lz * 0.5, x + lx, h * 0.96, z + lz, h * 0.013);
  for (let t = 0; t < 6; t++) {
    const u = t / 5, y = h * (0.2 + 0.13 * t), R = h * 0.25 * (1 - u * 0.76), hh = h * 0.27, cx = x + lx * (0.2 + u * 0.8), cz = z + lz * (0.2 + u * 0.8), ry = k.rand(0, 3);
    map_snow_I(c, g.cone, m.pine, cx, y + hh / 2, cz, R, hh, R, k.rand(-0.05, 0.05), ry, k.rand(-0.05, 0.05));
    map_snow_I(c, g.cone, m.snow, cx + R * 0.08, y + hh * 0.57, cz + R * 0.05, R * 0.78, hh * 0.92, R * 0.78, 0, ry, 0);
  }
  if (col) k.collider(x - 0.25, 0, z - 0.25, x + 0.25, h * 0.5, z + 0.25);
}
function map_snow_rock(c, x, z, s) {
  const k = c.kit;
  map_snow_I(c, c.g.rock, c.m.cdark, x, s * 0.35, z, s, s * 0.8, s * k.rand(0.8, 1.2), 0, k.rand(0, 6), 0);
  map_snow_I(c, c.g.sph, c.m.snow, x, s * 0.82, z, s * 0.75, s * 0.2, s * 0.7);
  k.collider(x - s * 0.7, 0, z - s * 0.7, x + s * 0.7, s * 0.9, z + s * 0.7);
}

// ---------- veicoli ----------
function map_snow_truck(c, x, z, rot, cab, tarp) {   // camion tipo ZIL, muso verso -Z locale
  const f = map_snow_F(c, x, z, rot), m = c.m, g = c.g;
  f.b(0, 0.72, 0.4, 1.0, 0.24, 7.0, m.metal);
  f.b(0, 0.96, -1.55, 2.3, 1.1, 1.6, cab); f.b(0, 2.06, -1.5, 2.2, 0.78, 1.4, cab);
  f.b(0, 0.96, -3.0, 1.9, 0.62, 1.3, cab); f.i(g.wedge, cab, 0, 1.78, -3.0, 1.9, 0.4, 1.3, 0, Math.PI, 0);
  f.d(m.white, 0, 1.0, -3.67, 1.5, 0.52, 0.05); for (let i = -3; i <= 3; i++) f.d(m.metal, i * 0.2, 1.02, -3.7, 0.04, 0.48, 0.03);
  f.d(m.metal, 0, 0.66, -3.8, 2.4, 0.2, 0.16); f.d(m.snow, 0, 2.84, -1.5, 2.1, 0.09, 1.3); f.d(m.snow, 0, 1.6, -3.3, 1.7, 0.05, 0.6);
  f.d(m.glass, 0, 2.16, -2.22, 1.9, 0.56, 0.04); f.d(m.glass, 0, 2.2, -0.79, 1.2, 0.4, 0.04);
  f.s(m.rust, 0.95, 0.9, -0.55, 0.95, 3.2, -0.55, 0.05); f.i(g.cyl, m.rust, -0.85, 0.7, 0.4, 0.26, 1.0, 0.26, map_snow_H, 0, 0);
  for (const s of [-1, 1]) {
    f.d(m.amber, s * 0.72, 1.14, -3.68, 0.2, 0.2, 0.05); f.d(cab, s * 1.08, 0.9, -2.9, 0.34, 0.3, 1.25); f.d(m.glass, s * 1.11, 2.16, -1.5, 0.03, 0.56, 1.0);
    f.s(m.metal, s * 1.12, 2.0, -2.15, s * 1.45, 2.3, -2.2, 0.02); f.d(m.metal, s * 1.48, 2.2, -2.2, 0.05, 0.3, 0.16);
    f.w(s * 1.02, 0.5, -2.85, 0.5, 0.3); f.w(s * 1.0, 0.5, 1.5, 0.5, 0.5); f.w(s * 1.0, 0.5, 2.7, 0.5, 0.5);
    f.b(s * 1.17, 1.1, 1.75, 0.07, 0.62, 4.5, m.paint);
    for (let i = 0; i < 5; i++) f.d(m.rust, s * 1.22, 1.0, -0.2 + i * 1.0, 0.05, 0.75, 0.09);
  }
  f.b(0, 0.96, 1.75, 2.4, 0.14, 4.5, m.wood); f.b(0, 1.1, -0.47, 2.4, 0.9, 0.07, m.paint); f.b(0, 1.1, 3.97, 2.4, 0.62, 0.07, m.paint);
  if (tarp) { f.b(0, 1.72, 1.75, 2.36, 0.95, 4.4, m.bag); f.d(m.snow, 0, 2.67, 1.75, 2.2, 0.1, 4.2); }
  else { f.b(-0.5, 1.1, 0.6, 1.1, 0.9, 1.1, m.wood); f.b(0.45, 1.1, 2.3, 1.2, 0.7, 1.6, m.wood); f.d(m.snow, 0, 1.11, 1.75, 2.2, 0.06, 4.3); f.c(m.rust, 0.6, 1.1, 0.5, 0.3, 0.9); }
  f.col(-1.2, 0, -3.85, 1.2, 1.9, -2.3); f.col(-1.2, 0, -2.35, 1.2, 2.85, -0.7); f.col(-1.25, 0, -0.7, 1.25, tarp ? 2.7 : 1.75, 4.0);
}
function map_snow_car(c, x, z, rot, mat) {   // berlina tipo Lada, muso verso -Z locale
  const f = map_snow_F(c, x, z, rot), m = c.m, g = c.g;
  f.b(0, 0.32, 0, 1.68, 0.5, 4.1, mat); f.b(0, 0.82, 0.2, 1.5, 0.5, 1.5, mat);
  f.i(g.wedge, m.glass, 0, 1.07, -0.85, 1.44, 0.5, 0.6, 0, Math.PI, 0); f.i(g.wedge, m.glass, 0, 1.07, 1.2, 1.44, 0.5, 0.5);
  f.d(m.snow, 0, 1.32, 0.2, 1.4, 0.08, 1.4); f.d(m.snow, 0, 0.82, -1.55, 1.5, 0.05, 0.8); f.d(m.snow, 0, 0.82, 1.75, 1.5, 0.05, 0.5);
  f.d(m.metal, 0, 0.5, -2.06, 0.8, 0.2, 0.03);
  for (const s of [-1, 1]) {
    f.d(m.glass, s * 0.755, 0.9, 0.2, 0.02, 0.36, 1.3); f.d(m.metal, 0, 0.28, s * 2.1, 1.72, 0.14, 0.1);
    f.d(m.amber, s * 0.6, 0.55, -2.06, 0.22, 0.14, 0.04); f.d(m.redN, s * 0.62, 0.55, 2.06, 0.24, 0.12, 0.04);
    f.d(m.rubber, s * 0.845, 0.36, 0, 0.02, 0.05, 2.4); f.d(m.metal, s * 0.86, 0.7, 0.1, 0.03, 0.04, 0.14);
    f.w(s * 0.8, 0.31, -1.3, 0.31, 0.2); f.w(s * 0.8, 0.31, 1.3, 0.31, 0.2);
  }
  f.col(-0.85, 0, -2.1, 0.85, 1.3, 2.1);
}
function map_snow_bogie(c, f, lz) {   // carrello ferroviario a 2 assi
  const m = c.m;
  for (const s of [-1, 1]) {
    f.d(m.metal, s * 0.95, 0.42, lz, 0.14, 0.34, 2.4);
    for (const a of [-0.9, 0.9]) { f.i(c.g.cyl, m.metal, s * 0.78, 0.63, lz + a, 0.46, 0.13, 0.46, 0, 0, map_snow_H); f.d(m.rust, s * 1.0, 0.5, lz + a, 0.12, 0.3, 0.3); }
  }
  f.d(m.rust, 0, 0.55, lz, 1.5, 0.12, 0.12);
}
function map_snow_wagon(c, x, z, kind) {   // 0 = carro chiuso, 1 = cisterna, 2 = pianale con tubi
  const f = map_snow_F(c, x, z, 0), m = c.m, g = c.g, R = map_snow_H;
  f.b(0, 0.92, 0, 2.9, 0.3, 10.2, m.metal);
  for (const e of [-1, 1]) {
    map_snow_bogie(c, f, e * 3.4); f.d(m.rust, 0, 0.95, e * 5.3, 0.3, 0.26, 0.6);
    for (const s of [-1, 1]) f.i(g.cyl, m.rust, s * 0.9, 1.05, e * 5.22, 0.18, 0.3, 0.18, R, 0, 0);
  }
  if (kind === 0) {
    f.b(0, 1.22, 0, 3.0, 2.6, 10, m.wagon);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 9; i++) f.d(m.rust, s * 1.53, 1.22, -4.4 + i * 1.1, 0.07, 2.6, 0.09);
      f.d(m.paint, s * 1.56, 1.3, 0.4, 0.08, 2.3, 2.2); f.d(m.metal, s * 1.58, 3.65, 0, 0.05, 0.07, 5); f.d(m.white, s * 1.57, 1.6, -3.3, 0.02, 0.3, 0.9);
    }
    f.i(g.cyl, m.rust, 0, 3.8, 0, 1.53, 10.1, 0.42, R, 0, 0); f.i(g.cyl, m.snow, 0, 3.93, 0, 1.25, 9.9, 0.36, R, 0, 0);
    for (let y = 1.4; y < 3.8; y += 0.4) f.d(m.metal, 1.1, y, 5.03, 0.5, 0.04, 0.04);
    f.col(-1.55, 0, -5.1, 1.55, 4.2, 5.1);
  } else if (kind === 1) {
    f.i(g.bcyl, m.pipe, 0, 2.6, 0, 1.4, 9, 1.4, R, 0, 0); f.i(g.cyl, m.yel, 0, 2.6, 0, 1.42, 0.5, 1.42, R, 0, 0);
    for (const e of [-1, 1]) { f.i(g.sph, m.pipe, 0, 2.6, e * 4.5, 1.4, 1.4, 0.5); f.d(m.metal, 0, 1.22, e * 3, 2.4, 0.55, 0.4); f.d(m.snow, 0, 3.96, e * 2.5, 1.3, 0.08, 3.6); }
    f.c(m.pipe, 0, 3.9, 0, 0.55, 0.45); f.c(m.rust, 0, 4.35, 0, 0.35, 0.08); f.d(m.metal, 0, 3.95, 0, 0.6, 0.05, 8.6);
    for (const a of [0.55, 1.05]) f.s(m.metal, 1.45, 1.2, a, 1.2, 4.0, a, 0.03);
    for (let y = 1.5; y < 4; y += 0.4) f.d(m.metal, 1.45 - (y - 1.2) * 0.09, y, 0.8, 0.04, 0.04, 0.5);
    f.col(-1.45, 0, -5.1, 1.45, 4.0, 5.1);
  } else {
    for (const s of [-1, 1]) for (let i = -4; i <= 4; i += 2) f.d(m.rust, s * 1.4, 1.22, i, 0.1, 1.6, 0.1);
    for (const p of [[-0.92, 1.68], [0, 1.68], [0.92, 1.68], [-0.46, 2.47], [0.46, 2.47]]) {
      f.i(g.bcyl, m.pipe, p[0], p[1], 0, 0.45, 9, 0.45, R, 0, 0);
      for (const e of [-1, 1]) f.i(g.cyl, m.rubber, p[0], p[1], e * 4.5, 0.38, 0.03, 0.38, R, 0, 0);
      if (p[1] > 2) f.d(m.snow, p[0], 2.9, 0, 0.5, 0.06, 8.8);
    }
    f.col(-1.5, 0, -5.1, 1.5, 3.0, 5.1);
  }
}
function map_snow_loco(c, x, z) {   // locomotiva diesel da manovra
  const f = map_snow_F(c, x, z, 0), m = c.m, g = c.g;
  f.b(0, 0.95, 0, 3.0, 0.4, 12.4, m.metal); f.b(0, 1.35, -2.6, 2.3, 1.9, 6.2, m.paint); f.b(0, 2.0, -2.6, 2.34, 0.3, 6.24, m.yel);
  f.b(0, 1.35, 2.3, 2.9, 2.9, 2.6, m.paint); f.b(0, 1.35, 4.8, 2.3, 1.6, 2.2, m.paint); f.b(0, 2.0, 4.8, 2.34, 0.3, 2.24, m.yel);
  f.i(g.cyl, m.metal, 0, 4.25, 2.3, 1.5, 2.8, 0.3, map_snow_H, 0, 0); f.d(m.snow, 0, 4.48, 2.3, 2.2, 0.08, 2.6); f.d(m.snow, 0, 3.25, -2.6, 2.1, 0.08, 6); f.d(m.snow, 0, 2.95, 4.8, 2.1, 0.08, 2);
  f.d(m.amber, 0, 2.85, -5.72, 0.5, 0.3, 0.05); f.d(m.amber, 0, 2.6, 5.92, 0.5, 0.3, 0.05); f.c(m.rust, 0.5, 3.25, -4, 0.2, 0.5); f.c(m.rust, -0.4, 3.25, -1.5, 0.14, 0.35);
  for (const e of [-1, 1]) {
    map_snow_bogie(c, f, e * 3.9); f.d(m.red, 0, 0.75, e * 6.22, 2.9, 0.6, 0.06); f.d(m.rust, 0, 0.95, e * 6.4, 0.3, 0.26, 0.5);
    for (let i = -2; i <= 2; i++) f.d(m.white, i * 0.58, 0.8, e * 6.26, 0.2, 0.5, 0.02, 0.5);
    f.d(m.glass, e * 0.72, 3.3, 0.99, 0.9, 0.6, 0.03); f.d(m.glass, e * 0.72, 3.3, 3.61, 0.9, 0.6, 0.03);
  }
  for (const s of [-1, 1]) {
    f.d(m.glass, s * 1.46, 3.1, 2.3, 0.03, 0.8, 1.6); f.s(m.yel, s * 1.45, 2.3, -6.1, s * 1.45, 2.3, 0.95, 0.03);
    for (let i = 0; i < 5; i++) { f.d(m.metal, s * 1.16, 1.75, -5 + i * 1.2, 0.03, 0.9, 0.8); f.s(m.yel, s * 1.45, 1.35, -6.1 + i * 1.75, s * 1.45, 2.3, -6.1 + i * 1.75, 0.025); }
  }
  f.col(-1.5, 0, -6.3, 1.5, 4.3, 6.3);
}

// ---------- edifici entrabili: facciata, tetto, arredo ----------
function map_snow_dress(c, x, z, w, d, fl, o) {
  const k = c.kit, m = c.m, g = c.g, f = map_snow_F(c, x, z, 0), H = fl * 3.4, hw = w / 2, hd = d / 2;
  for (const s of [-1, 1]) {
    for (const e of [-1, 1]) {
      f.b(e * (hw / 2 + 0.75), 0, s * (hd + 0.04), hw - 1.5, 0.7, 0.1, m.cdark); f.b(s * (hw + 0.04), 0, e * (hd / 2 + 0.75), 0.1, 0.7, hd - 1.5, m.cdark);
      f.b(s * hw, 0, e * hd, 0.6, H + 0.3, 0.6, o.trim);                                   // lesena d'angolo
    }
    for (let i = 1; i <= fl; i++) {                                                         // marcapiani e cornicione con neve
      const y = i * 3.4 - 0.1, top = i === fl, t = top ? 0.3 : 0.12, hh = top ? 0.35 : 0.18;
      f.b(0, y, s * (hd + t / 2), w + t * 2, hh, t, o.trim); f.b(s * (hw + t / 2), y, 0, t, hh, d, o.trim);
      f.d(m.snow, 0, y + hh, s * (hd + t / 2 + 0.02), w + t * 2, 0.06, t + 0.06); f.d(m.snow, s * (hw + t / 2 + 0.02), y + hh, 0, t + 0.06, 0.06, d);
    }
    if (o.doors.includes(s < 0 ? 'n' : 's')) {                                              // porta nord/sud: stipiti, pensilina, gradino, luce
      for (const e of [-1, 1]) { f.d(o.trim, e * 1.35, 0, s * (hd + 0.1), 0.22, 2.75, 0.22); f.s(m.metal, e * 1.6, 2.75, s * (hd + 1.2), e * 1.6, 3.5, s * (hd + 0.05), 0.025); }
      f.b(0, 2.7, s * (hd + 0.6), 3.4, 0.14, 1.3, m.metal); f.d(m.snow, 0, 2.84, s * (hd + 0.6), 3.3, 0.08, 1.25);
      f.d(m.amber, 0, 2.6, s * (hd + 0.5), 0.5, 0.08, 0.2); f.b(0, 0, s * (hd + 0.6), 3.0, 0.07, 1.1, m.conc, false, false);
    }
    if (o.doors.includes(s < 0 ? 'w' : 'e')) {
      for (const e of [-1, 1]) f.d(o.trim, s * (hw + 0.1), 0, e * 1.3, 0.22, 2.75, 0.22);
      f.b(s * (hw + 0.6), 2.7, 0, 1.3, 0.14, 3.2, m.metal); f.d(m.snow, s * (hw + 0.6), 2.84, 0, 1.25, 0.08, 3.1);
      f.d(m.amber, s * (hw + 0.5), 2.6, 0, 0.2, 0.08, 0.5); f.b(s * (hw + 0.6), 0, 0, 1.1, 0.07, 3.0, m.conc, false, false);
    }
    f.s(m.rust, s * (hw + 0.14), 0.2, s * (hd - 0.55), s * (hw + 0.14), H, s * (hd - 0.55), 0.07);          // pluviale
    f.s(m.rust, s * (hw + 0.14), 0.2, s * (hd - 0.55), s * (hw + 0.5), 0.08, s * (hd - 0.55), 0.07);
    for (let i = 0; i < fl; i++) {                                                          // condizionatori sopra le finestre + tubi al neon interni
      const lx = s * (hw - 2.6 - (i % 2) * 2.2), y = i * 3.4 + 2.62;
      f.d(m.pipe, lx, y, s * (hd + 0.28), 0.9, 0.55, 0.45); f.d(m.rubber, lx, y + 0.1, s * (hd + 0.51), 0.5, 0.36, 0.02); f.d(m.snow, lx, y + 0.55, s * (hd + 0.28), 0.94, 0.07, 0.5);
      f.d(i % 2 ? m.amber : m.cold, s * hw * 0.5, i * 3.4 + 3.0, 0, 0.12, 0.05, 2.4);
    }
    for (let lx = -hw + 0.4; lx < hw; lx += k.rand(0.5, 1.2)) {                             // ghiaccioli sotto il cornicione
      const L = k.rand(0.25, 0.8); f.i(g.cone, m.ice, lx, H - 0.1 - L / 2, s * (hd + 0.2), 0.045, L, 0.045, Math.PI, 0, 0);
    }
    if (!o.flat) { f.b(s * (hw - 0.16), H + 0.65, 0, 0.42, 0.09, d, m.snow); f.b(0, H + 0.65, s * (hd - 0.16), w, 0.09, 0.42, m.snow); }
  }
  // tetto: neve, estrattori, antenna, botola (solo decorazione: non blocca l'uscita della scala)
  f.b(0, H + 0.22, 0, w - 1.2, 0.06, d - 1.2, m.snow, false, false);
  f.b(hw - 3, H + 0.25, -hd + 2.6, 1.6, 1.0, 1.2, m.pipe); f.c(m.metal, hw - 3, H + 1.25, -hd + 2.6, 0.42, 0.12); f.d(m.snow, hw - 3.3, H + 1.25, -hd + 2.9, 0.8, 0.08, 0.5);
  f.s(m.metal, -hw + 2, H + 0.2, hd - 2, -hw + 2, H + 6, hd - 2, 0.05);
  for (const y of [4.2, 5, 5.6]) f.s(m.metal, -hw + 1.2, H + y, hd - 2, -hw + 2.8, H + y, hd - 2, 0.025);
  for (const a of [[-1.8, 0], [1.2, 1.5], [1.2, -1.5]]) f.s(m.rubber, -hw + 2, H + 4, hd - 2, -hw + 2 + a[0], H + 0.3, hd - 2 + a[1], 0.012);
  if (o.esc) {                                                                               // scala antincendio con pianerottoli
    const s = o.esc, lx = s * (hw + 0.78), z0 = o.ez;
    for (let i = 1; i <= fl; i++) {
      const y = i * 3.4 - 0.35, a = i % 2 ? 1 : -1;
      f.b(lx, y, z0, 1.3, 0.07, 4.4, m.metal); f.d(m.snow, lx, y + 0.07, z0, 1.1, 0.04, 4.2);
      f.s(m.rust, lx + s * 0.62, y + 1, z0 - 2.2, lx + s * 0.62, y + 1, z0 + 2.2, 0.025);
      for (const t of [-2.2, -0.7, 0.7, 2.2]) f.s(m.rust, lx + s * 0.62, y, z0 + t, lx + s * 0.62, y + 1, z0 + t, 0.022);
      for (const t of [-2.1, 2.1]) f.s(m.rust, lx - s * 0.6, y - 0.7, z0 + t, lx + s * 0.6, y, z0 + t, 0.03);
      if (i === 1) { for (const t of [-0.25, 0.25]) f.s(m.rust, lx, y, z0 - 1.8 + t, lx, 1.9, z0 - 1.8 + t, 0.025); for (let r = 2; r < y; r += 0.35) f.d(m.rust, lx, r, z0 - 1.8, 0.04, 0.04, 0.5); continue; }
      for (const t of [-0.3, 0.3]) f.s(m.rust, lx + t, y, z0 + a * 1.7, lx + t, y - 3.4, z0 - a * 1.7, 0.03);
      for (let r = 1; r < 9; r++) f.d(m.metal, lx, y - r * 0.378, z0 + a * (1.7 - r * 0.378), 0.6, 0.03, 0.26);
    }
  }
}
function map_snow_interior(c, x, z, d, kind, rot = 0) {
  const f = map_snow_F(c, x, z, rot), m = c.m, g = c.g, k = c.kit, q = d / 20, hd = d / 2, QQ = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const table = (lx, lz, w, dd, top) => {
    f.b(lx, 0.72, lz, w, 0.07, dd, top);
    for (const a of [-1, 1]) for (const b of [-1, 1]) f.d(m.metal, lx + a * (w / 2 - 0.07), 0, lz + b * (dd / 2 - 0.07), 0.06, 0.72, 0.06);
    f.col(lx - w / 2, 0, lz - dd / 2, lx + w / 2, 0.8, lz + dd / 2);
  };
  const chair = (lx, lz, ry) => {
    f.d(m.metal, lx, 0, lz, 0.34, 0.42, 0.34, ry); f.d(m.wood, lx, 0.42, lz, 0.42, 0.05, 0.42, ry);
    f.d(m.wood, lx + Math.sin(ry) * 0.2, 0.47, lz + Math.cos(ry) * 0.2, 0.42, 0.46, 0.05, ry);
  };
  const shelf = (lx, lz, len, ax) => {   // scaffale pieno (ax = lungo X)
    const w = ax ? len : 0.6, dd = ax ? 0.6 : len;
    for (const a of [-1, 1]) for (const b of [-1, 1]) f.d(m.metal, lx + a * (w / 2 - 0.04), 0, lz + b * (dd / 2 - 0.04), 0.07, 2.2, 0.07);
    for (let y = 0.2; y < 2.3; y += 0.66) {
      f.d(m.wood, lx, y, lz, w, 0.05, dd);
      for (let t = -len / 2 + 0.4; t < len / 2 - 0.2; t += 0.62) if (k.rng() < 0.8)
        f.d(k.pick([m.wood, m.paint, m.bag, m.rust]), lx + (ax ? t : 0), y + 0.05, lz + (ax ? 0 : t), 0.46, k.rand(0.25, 0.5), 0.46, k.rand(-0.1, 0.1));
    }
    f.col(lx - w / 2, 0, lz - dd / 2, lx + w / 2, 2.2, lz + dd / 2);
  };
  const bed = (lx, lz) => {   // letto a castello lungo X
    for (const y of [0.35, 1.45]) { f.d(m.metal, lx, y, lz, 2.0, 0.06, 0.9); f.d(m.bag, lx, y + 0.06, lz, 1.9, 0.14, 0.82); f.d(m.blue, lx + 0.25, y + 0.2, lz, 1.3, 0.05, 0.84); f.d(m.white, lx - 0.72, y + 0.2, lz, 0.4, 0.09, 0.6); }
    for (const a of [-1, 1]) for (const b of [-1, 1]) f.d(m.metal, lx + a * 0.98, 0, lz + b * 0.43, 0.05, 1.9, 0.05);
    f.col(lx - 1, 0, lz - 0.45, lx + 1, 1.7, lz + 0.45);
  };
  const locker = (lx, lz, n, ax) => {
    for (let i = 0; i < n; i++) { const t = (i - (n - 1) / 2) * 0.52; f.d(i % 2 ? m.paint : m.pipe, lx + (ax ? t : 0), 0, lz + (ax ? 0 : t), 0.5, 1.9, 0.5); }
    const w = ax ? n * 0.26 : 0.25, dd = ax ? 0.25 : n * 0.26; f.col(lx - w, 0, lz - dd, lx + w, 1.9, lz + dd);
  };
  const stove = (lx, lz) => { f.c(m.rust, lx, 0, lz, 0.32, 1.0); f.d(m.fire, lx, 0.35, lz - 0.31, 0.22, 0.2, 0.04); f.s(m.rust, lx, 1, lz, lx, 3.3, lz, 0.07); f.col(lx - 0.3, 0, lz - 0.3, lx + 0.3, 1, lz + 0.3); };
  if (kind === 0) for (const [a, b] of QQ) {                       // uffici della direzione
    const lz = b * 5.4 * q;
    table(a * 5.2, lz, 1.7, 0.85, m.wood); chair(a * 5.2, lz + b * 0.8, b > 0 ? 0 : Math.PI);
    f.d(m.metal, a * 5.2, 0.79, lz - b * 0.15, 0.5, 0.4, 0.3); f.d(m.cold, a * 5.2, 0.84, lz + b * 0.01, 0.4, 0.28, 0.02); f.d(m.white, a * 5.7, 0.79, lz + b * 0.15, 0.3, 0.02, 0.22, 0.3);
    for (let i = 0; i < 3; i++) f.d(i % 2 ? m.paint : m.pipe, a * 8.2, 0, b * (2.6 + i * 0.62) * q, 0.6, 1.35, 0.58);
    f.col(a * 8.2 - 0.3, 0, b * 3.2 * q - 1, a * 8.2 + 0.3, 1.35, b * 3.2 * q + 1); shelf(a * 5, b * (hd - 0.75), 3, true);
    f.b(a * 3, 0, b * (hd - 1.0), 0.8, 0.45, 0.8, m.red, true); f.b(a * 3, 0.45, b * (hd - 0.7), 0.8, 0.45, 0.2, m.red);
    f.d(m.red, a * 5.2, 0.005, lz, 2.6, 0.02, 2.2);                                                   // tappeto
  }
  if (kind === 1) {                                                // camerata
    for (const [a, b] of QQ) { for (let j = 0; j < 3; j++) bed(a * 7.4, b * (2.6 + j * 2.2) * q); locker(a * 3.6, b * (hd - 0.7), 4, true); }
    table(4.2, 4.6 * q, 1.4, 0.8, m.wood); chair(4.2, 4.6 * q + 0.75, 0); chair(4.2, 4.6 * q - 0.75, Math.PI); stove(-3.2, 3.4 * q); stove(3.2, -3.4 * q);
  }
  if (kind === 2) {                                                // mensa con cucina
    for (const [a, b] of QQ) for (let j = 0; j < 2; j++) {
      const lz = b * (3.2 + j * 3) * q; table(a * 5.4, lz, 3.2, 0.8, m.pipe);
      for (const e of [-1, 1]) { f.d(m.wood, a * 5.4, 0, lz + e * 0.75, 3.0, 0.42, 0.3); f.d(m.white, a * 5.4 + e * 0.9, 0.79, lz, 0.4, 0.02, 0.3); f.c(m.metal, a * 5.4 + e * 0.9, 0.8, lz + 0.05, 0.07, 0.1); }
    }
    for (const a of [-1, 1]) {
      f.b(a * 5.2, 0, -(hd - 1.0), 5.4, 1.0, 0.8, m.pipe, true);
      for (let i = 0; i < 3; i++) { f.c(m.metal, a * (3.6 + i * 1.3), 1.0, -(hd - 1.0), 0.26, 0.34); f.d(m.fire, a * (3.6 + i * 1.3), 1.0, -(hd - 1.0), 0.4, 0.015, 0.4); }
      f.b(a * 8.1, 0, hd - 1.0, 0.8, 2.0, 0.8, m.white, true); f.d(m.metal, a * 8.1, 1.0, hd - 1.42, 0.05, 0.5, 0.04);
    }
  }
  if (kind === 3) for (const [a, b] of QQ) {                       // magazzino
    shelf(a * 3.6, b * 5.6 * q, 6 * q, false); shelf(a * 6.6, b * 5.6 * q, 6 * q, false);
    map_snow_crate(c, f.X(a * 8, b * 1.9), f.Z(a * 8, b * 1.9), 0.1, 1.0, 0.9); f.d(m.bag, a * 5.1, 0, b * 5.6 * q, 0.9, 0.5, 2.2 * q);
  }
  if (kind === 4) {                                                // sala controllo
    for (const a of [-1, 1]) {
      for (const i of [-3, -2, 2, 3]) {
        const lz = i * 1.9 * q;
        f.d(m.paint, a * 7.9, 0, lz, 0.9, 0.95, 1.7); f.i(g.wedge, m.pipe, a * 7.75, 1.15, lz, 1.7, 0.4, 0.8, 0, a > 0 ? -map_snow_H : map_snow_H, 0);
        f.d(m.cold, a * 8.4, 1.6, lz, 0.05, 0.6, 1.3); chair(a * 6.6, lz, a > 0 ? -map_snow_H : map_snow_H);
        for (let j = -2; j <= 2; j++) f.d(k.pick([m.amber, m.redN, m.cold]), a * 7.5, 1.1, lz + j * 0.3, 0.07, 0.05, 0.07);
        f.col(a * 7.9 - 0.5, 0, lz - 0.9, a * 7.9 + 0.5, 1.2, lz + 0.9);
      }
      f.b(a * 5, 0, -(hd - 0.8), 5, 2.4, 0.5, m.paint, true);
      for (let i = 0; i < 30; i++) f.d(k.pick([m.amber, m.redN, m.cold, m.metal]), a * 5 - 2.2 + (i % 10) * 0.49, 1.0 + (i / 10 | 0) * 0.45, -(hd - 1.06), 0.12, 0.12, 0.03);
    }
    table(0, 4.5 * q, 2.6, 1.2, m.wood); f.d(m.white, 0, 0.79, 4.5 * q, 1.8, 0.02, 0.9, 0.1);
  }
  if (kind === 5) for (const [a, b] of QQ) {                       // officina
    f.b(a * 8.0, 0, b * 5 * q, 0.9, 0.9, 4.2 * q, m.wood, true); f.d(m.wood, a * 8.55, 1.3, b * 5 * q, 0.05, 0.9, 3 * q); f.d(m.metal, a * 8, 0.9, b * 4 * q, 0.25, 0.2, 0.3);
    for (let i = 0; i < 5; i++) f.d(m.metal, a * 8.5, 1.45, b * (4 + i * 0.4) * q, 0.03, k.rand(0.3, 0.6), 0.05);
    f.b(a * 4.4, 0, b * 5 * q, 1.1, 0.9, 2.6, m.paint, true); f.i(g.cyl, m.metal, a * 4.4, 1.15, b * 5 * q, 0.28, 1.6, 0.28, map_snow_H, 0, 0); f.d(m.paint, a * 4.4, 0.9, b * 5 * q - 1, 0.9, 0.7, 0.5);
    map_snow_tires(c, f.X(a * 3, b * 8.6 * q), f.Z(a * 3, b * 8.6 * q), 3); map_snow_barrel(c, f.X(a * 6, b * 8.8 * q), f.Z(a * 6, b * 8.8 * q), a > 0 ? m.blue : m.rust);
  }
  if (kind === 6) {                                                // guardiola
    table(2.4, 1.9, 1.4, 0.7, m.wood); chair(2.4, 1.1, Math.PI); f.d(m.cold, 2.4, 0.84, 2.1, 0.4, 0.28, 0.02); locker(3.3, -2, 3, false); stove(1.4, -2.4);
    f.d(m.metal, 1.2, 0.3, 2.7, 1.9, 0.06, 0.8); f.d(m.bag, 1.2, 0.36, 2.7, 1.8, 0.12, 0.74); f.d(m.wood, -2.6, 1.3, 3.1, 1.2, 0.8, 0.04);
  }
}
function map_snow_office(c, x, z, d, fl, kind, wall, trim, esc, floor, sign) {
  const m = c.m;
  c.kit.building({ x, z, w: 18, d, floors: fl, floorH: 3.4, wall: 0.32, mat: wall, innerMat: m.plast, floorMat: floor,
    doors: [{ side: 'n', at: 0, width: 2.2 }, { side: 's', at: 0, width: 2.2 }, { side: 'e', at: 0, width: 2.2 }, { side: 'w', at: 0, width: 2.2 }],
    windows: true, roof: 'parapet', ruined: 0, rotY: 0 });
  map_snow_dress(c, x, z, 18, d, fl, { trim, esc, ez: d / 2 - 4.5, doors: 'nsew' });
  map_snow_interior(c, x, z, d, kind);
  for (const s of [-1, 1]) {                                        // insegne dipinte sopra le pensiline dei 4 ingressi
    map_snow_board(c, sign, x, 3.27, z + s * (d / 2 + 1.2), s > 0 ? 0 : Math.PI, 2.6, 0.65);
    map_snow_board(c, sign, x + s * 10.2, 3.27, z, s * map_snow_H, 2.6, 0.65);
  }
}

// ---------- capannone a shed con forno, presse e carroponte ----------
function map_snow_hall(c, x, z, sd, num) {
  const k = c.kit, m = c.m, g = c.g, f = map_snow_F(c, x, z, sd > 0 ? 0 : Math.PI);
  k.room({ x, y: 0, z, w: 12, d: 36, h: 9, mat: m.brick, floorMat: m.conc, ceiling: false,
    doors: [{ side: 'n', at: 0, width: 3.2 }, { side: 's', at: 0, width: 3.2 }, { side: sd > 0 ? 'e' : 'w', at: 0, width: 3.6 }], windows: [] });
  for (let i = 0; i < 6; i++) {
    const bz = -15 + i * 6;
    f.i(g.shed, m.corr, 0, 9, bz, 1, 1, 1); f.b(0, 9.2, bz - 3.06, 12, 1.4, 0.06, m.glass);
    for (let j = -5; j <= 5; j += 2) f.d(m.metal, j, 9, bz - 3.1, 0.08, 1.8, 0.08);
    f.i(g.box, m.snow, 0, 9.97, bz + 0.05, 12.3, 0.12, 5.9, Math.atan2(1.8, 6), 0, 0); f.d(m.snow, 0, 10.8, bz - 2.95, 12.4, 0.1, 0.4);
    f.s(m.rust, -5.8, 8.8, bz - 2.9, 5.8, 8.8, bz - 2.9, 0.09);
    for (const s of [-1, 1]) { f.s(m.rust, s * 5.8, 8.8, bz + 2.9, 0, 10.2, bz - 2.9, 0.05); f.b(s * 5.75, 0, bz - 3, 0.3, 9, 0.3, m.metal); f.b(s * 6.12, 0, bz - 3, 0.25, 9.2, 0.5, m.brick); }
    f.d(m.amber, 0, 6.9, bz, 0.5, 0.1, 0.5); f.s(m.metal, 0, 7, bz, 0, 8.8, bz, 0.02);
    for (let lx = -5.8; lx < 6; lx += k.rand(0.6, 1.3)) { const L = k.rand(0.3, 0.9); f.i(g.cone, m.ice, lx, 9 - L / 2, bz + 3.02, 0.05, L, 0.05, Math.PI, 0, 0); }
  }
  for (const s of [-1, 1]) { f.b(6.06, 0, s * 10, 0.1, 0.9, 16, m.cdark); f.b(s * 5.6, 7.3, 0, 0.3, 0.3, 35.4, m.rust); f.d(m.metal, 6.15, 0, s * 1.95, 0.25, 3.4, 0.25); }
  f.d(m.metal, 6.2, 3.3, 2.4, 0.12, 0.14, 9); f.b(6.28, 0.1, 4.6, 0.1, 3.1, 3.8, m.rust); for (let i = 0; i < 4; i++) f.d(m.metal, 6.35, 0.1, 3 + i * 1.05, 0.04, 3.1, 0.1);
  map_snow_sign(c, x + sd * 6.2, 5.2, z, sd > 0 ? -map_snow_H : map_snow_H, 'ЦЕХ ' + num, 0.2, m.amber);
  map_snow_board(c, 5, f.X(6.2, -7), 2.0, f.Z(6.2, -7), f.rot + map_snow_H, 2.2, 1.1);
  // forno acceso
  f.b(-3.2, 0, -13.5, 3.4, 4.2, 3.4, m.brick, true); f.d(m.fire, -3.2, 0.8, -11.78, 1.2, 1.0, 0.06); f.d(m.rust, -3.2, 0.6, -11.74, 1.6, 1.4, 0.08); f.c(m.rust, -3.2, 4.2, -13.5, 0.5, 6.4, g.bcyl);
  f.b(-3.2, 0, -10.6, 2.4, 0.3, 1.6, m.cdark, true); for (let i = 0; i < 6; i++) f.i(g.rock, m.fire, -3.2 + k.rand(-0.8, 0.8), 0.4, -10.6 + k.rand(-0.5, 0.5), 0.16, 0.1, 0.16);
  k.light(f.X(-3.2, -10.3), 2.2, f.Z(-3.2, -10.3), 0xff7a33, 36, 22);
  // presse, banchi, carroponte, casse
  for (const lz of [-6, 6, 12]) {
    f.b(3.4, 0, lz, 2.2, 1.2, 3.0, m.paint, true); f.b(3.4, 1.2, lz - 0.8, 1.6, 2.2, 1.0, m.paint); f.c(m.metal, 3.4, 1.2, lz + 0.6, 0.5, 0.9); f.c(m.metal, 3.4, 3.4, lz - 0.8, 0.22, 1.2);
    f.d(m.yel, 3.4, 1.21, lz + 0.6, 1.9, 0.02, 1.5); f.d(m.pipe, 2.0, 0, lz + 1.2, 0.4, 1.3, 0.3); f.d(m.redN, 1.99, 1.05, lz + 1.04, 0.1, 0.1, 0.03); f.d(m.cold, 2.12, 1.05, lz + 1.04, 0.1, 0.1, 0.03);
  }
  for (const lz of [4, 11]) { f.b(-4.9, 0, lz, 1.2, 0.95, 3.2, m.wood, true); f.d(m.metal, -4.9, 0.95, lz - 1, 0.3, 0.25, 0.3); f.d(m.wood, -5.6, 1.4, lz, 0.05, 1.0, 2.6); }
  f.b(0, 7.6, 3, 11.4, 0.5, 0.5, m.haz); f.b(0, 7.6, 4, 11.4, 0.5, 0.5, m.haz); f.b(1, 8.1, 3.5, 1.4, 0.7, 1.6, m.paint); f.s(m.rubber, 1, 7.6, 3.5, 1, 4.2, 3.5, 0.03); f.d(m.yel, 1, 3.8, 3.5, 0.4, 0.5, 0.3);
  f.b(1, 2.6, 3.5, 1.6, 1.2, 1.6, m.rust); map_snow_crate(c, f.X(-4.4, -4), f.Z(-4.4, -4), 0.15, 1.3, 1.2); map_snow_pallets(c, f.X(-4.6, -7), f.Z(-4.6, -7), 0.1, 5);
  map_snow_barrel(c, f.X(4.8, 0.5), f.Z(4.8, 0.5), m.blue); map_snow_barrel(c, f.X(4.9, 1.3), f.Z(4.9, 1.3), m.rust); map_snow_crate(c, f.X(-1, 15.5), f.Z(-1, 15.5), 0.4, 1.1, 1.0);
  for (let lz = -14; lz <= 14; lz += 4) k.nav(f.X(0.6, lz), 0, f.Z(0.6, lz));
  k.nav(f.X(7.6, 0), 0, f.Z(7.6, 0));
}

// ---------- passerella sopraelevata con tubi giganti e 2 scale ----------
function map_snow_bridge(c, sz) {
  const k = c.kit, m = c.m, g = c.g, f = map_snow_F(c, 0, 0, 0), z0 = sz * 12, zi = sz * 10.5, zo = sz * 13.5, zp = sz * 12.75;
  f.b(0, 5.0, z0, 71.4, 0.2, 3, m.metal, true);
  for (const e of [-1, 1]) f.b(0, 4.7, z0 + e * 1.4, 71.4, 0.3, 0.16, m.rust);
  for (let x = -35; x <= 35; x += 2.5) f.d(m.rust, x, 4.82, z0, 0.1, 0.18, 2.8);
  for (let x = -35.6; x <= 35.61; x += 1.78) { f.s(m.yel, x, 5.2, zo, x, 6.3, zo, 0.03); if (Math.abs(x) < 33.3) f.s(m.yel, x, 5.2, zi, x, 6.3, zi, 0.03); }
  for (const y of [5.75, 6.3]) { f.s(m.yel, -35.7, y, zo, 35.7, y, zo, 0.035); f.s(m.yel, -33.3, y, zi, 33.3, y, zi, 0.035); }
  k.collider(-35.7, 5.2, zo - 0.06, 35.7, 6.3, zo + 0.06); k.collider(-33.3, 5.2, zi - 0.06, 33.3, 6.3, zi + 0.06);
  for (const e of [-1, 1]) {
    const sx = e * 34.5;
    k.collider(e * 35.7 - 0.06, 5.2, Math.min(zi, zo), e * 35.7 + 0.06, 6.3, Math.max(zi, zo)); f.s(m.yel, e * 35.7, 6.3, zi, e * 35.7, 6.3, zo, 0.035);
    for (let i = 0; i < 20; i++) {                                    // scala: pedate sottili + collider a gradino
      const zz = sz * (1.5 + 0.45 * (i + 0.5));
      k.box(sx, 0.26 * i + 0.2, zz, 2.2, 0.06, 0.47, m.metal, { collide: false });
      k.collider(sx - 1.1, 0.26 * i, zz - 0.225, sx + 1.1, 0.26 * (i + 1), zz + 0.225);
      if (i % 4 === 1) k.nav(sx, 0.26 * (i + 1), zz);
    }
    for (const s of [-1, 1]) {
      f.s(m.rust, sx + s * 1.14, 0.05, sz * 1.5, sx + s * 1.14, 5.1, sz * 10.5, 0.07); f.s(m.yel, sx + s * 1.14, 1.1, sz * 1.5, sx + s * 1.14, 6.2, sz * 10.5, 0.035);
      for (let i = 0; i <= 4; i++) f.s(m.yel, sx + s * 1.14, i * 1.275, sz * (1.5 + i * 2.25), sx + s * 1.14, i * 1.275 + 1.1, sz * (1.5 + i * 2.25), 0.025);
      f.d(m.metal, sx + s * 1.0, 0, sz * 6.4, 0.14, 2.7, 0.14);
    }
    k.nav(sx, 0, sz * 0.8); k.nav(sx, 5.2, z0);
    f.i(g.tor, m.red, e * 36.4, 1.3, zp - sz * 0.62, 0.3, 0.3, 0.3); f.s(m.metal, e * 36.4, 1.3, zp, e * 36.4, 1.3, zp - sz * 0.62, 0.03);
  }
  for (const x of [-32.7, -12.6, 0, 12.6, 32.7]) {                   // cavalletti
    for (const e of [-1, 1]) { f.b(x, 0, z0 + e * 1.3, 0.3, 4.7, 0.3, m.metal, true); f.d(m.haz, x, 0, z0 + e * 1.3, 0.7, 0.3, 0.7); f.d(m.snow, x, 0.3, z0 + e * 1.3, 0.72, 0.05, 0.72); }
    f.s(m.rust, x, 0.4, z0 - 1.3, x, 4.5, z0 + 1.3, 0.04); f.s(m.rust, x, 0.4, z0 + 1.3, x, 4.5, z0 - 1.3, 0.04);
  }
  for (let x = -32; x <= 32; x += 6.4) { f.s(m.metal, x, 5.2, zo, x, 8.5, zo, 0.07); f.s(m.metal, x, 7.15, zo, x, 7.15, zo - sz * 2.2, 0.06); f.s(m.metal, x, 8.4, zo, x, 7.2, zo - sz * 1.4, 0.03); }
  map_snow_pipe(c, m.pipe, [[-36.4, 0, zp], [-36.4, 7.75, zp], [36.4, 7.75, zp], [36.4, 0, zp]], 0.5, 6.4);
  map_snow_pipe(c, m.rust, [[-35.6, 7.45, zo - sz * 1.75], [35.6, 7.45, zo - sz * 1.75]], 0.26, 0);
  f.d(m.snow, 0, 8.2, zp, 71, 0.07, 0.6); f.d(m.snow, 0, 7.68, zo - sz * 1.75, 70, 0.05, 0.3);
  for (let x = -32; x <= 32; x += 4) k.nav(x, 5.2, z0);
  for (const x of [-18, 6, 22]) { f.b(x, 5.2, z0 - sz * 0.8, 1.4, 0.8, 0.9, m.paint, true); f.d(m.snow, x, 6.0, z0 - sz * 0.8, 1.36, 0.06, 0.86); }
}
// tubo del gas giallo: basso lungo il marciapiede, arco a Π sopra il passaggio, poi sale al ponte
function map_snow_gas(c, sx, sz) {
  const x = sx * 37.1, m = c.m, P = (z, y) => [x, y, sz * z];
  map_snow_pipe(c, m.yel, [P(50, 0), P(50, 1.1), P(39.2, 1.1), P(39.2, 3.9), P(32.8, 3.9), P(32.8, 1.1), P(24.6, 1.1), P(24.6, 7.5), P(13.3, 7.5), [sx * 35.9, 7.5, sz * 13.3]], 0.13, 3.1);
  for (const z of [48, 45, 42, 30, 27.5]) map_snow_I(c, c.g.box, m.metal, x, 0.5, sz * z, 0.08, 1.0, 0.08);
  for (const z of [22.3, 14]) { map_snow_S(c, m.metal, x, 0, sz * z, x, 7.4, sz * z, 0.06); c.kit.collider(x - 0.1, 0, sz * z - 0.1, x + 0.1, 7.4, sz * z + 0.1); }
  for (const [a, b] of [[39.3, 50], [24.6, 32.7]]) {
    c.kit.collider(x - 0.13, 0, Math.min(sz * a, sz * b), x + 0.13, 1.25, Math.max(sz * a, sz * b));
    map_snow_I(c, c.g.box, m.snow, x, 1.25, sz * (a + b) / 2, 0.2, 0.05, b - a - 0.4);
  }
  map_snow_I(c, c.g.tor, m.red, x - sx * 0.3, 1.1, sz * 46.5, 0.2, 0.2, 0.2, 0, map_snow_H, 0);
}

// ---------- grandi strutture industriali ----------
function map_snow_stack(c, x, z, h) {   // ciminiera a fasce bianche e rosse con luci
  const m = c.m, g = c.g, k = c.kit, R = (y) => 2.5 * (1 - 0.45 * y / h);
  k.box(x, 0, z, 6, 2.2, 6, m.conc); k.box(x, 2.2, z, 6.3, 0.12, 6.3, m.snow, { collide: false });
  map_snow_I(c, g.chim, m.brick, x, 2.2 + h / 2, z, 2.5, h, 2.5);
  for (let i = 0; i < 6; i++) { const y = h - 2 - i * 3.2, r = R(y - 1.6) + 0.03; map_snow_I(c, g.cyl, i % 2 ? m.white : m.red, x, 2.2 + y, z, r, 3.2, r); }
  for (let y = 4; y < h - 20; y += 4) map_snow_I(c, g.cyl, m.rust, x, 2.2 + y, z, R(y) + 0.04, 0.14, R(y) + 0.04);
  map_snow_I(c, g.cyl, m.metal, x, 2.2 + h - 21, z, R(h - 21) + 0.9, 0.1, R(h - 21) + 0.9); map_snow_I(c, g.cyl, m.cdark, x, 2.3 + h, z, 1.5, 0.3, 1.5);
  for (const y of [h - 0.4, h - 21 + 1.2, h * 0.4]) for (let a = 0; a < 4; a++) map_snow_I(c, g.box, m.redN, x + Math.cos(a * map_snow_H) * (R(y) + 0.2), 2.2 + y, z + Math.sin(a * map_snow_H) * (R(y) + 0.2), 0.32, 0.32, 0.32);
  for (const e of [-0.25, 0.25]) map_snow_S(c, m.metal, x + 2.56, 2.3, z + e, x + 1.44, 2.2 + h, z + e, 0.035);
  for (let y = 1; y < h; y += 1.3) map_snow_I(c, g.box, m.metal, x + R(y) + 0.06, 2.2 + y, z, 0.04, 0.04, 0.5);
  k.collider(x - 2, 0, z - 2, x + 2, h, z + 2);
}
function map_snow_silos(c, sd) {   // 3 silos + nastro trasportatore inclinato
  const m = c.m, g = c.g, k = c.kit, x = sd * -60;
  for (let i = 0; i < 3; i++) {
    const z = sd * (40 + i * 6.2), h = 13 + (i === 1 ? 2.5 : 0);
    map_snow_I(c, g.bcyl, m.conc, x, 0.3, z, 3.0, 0.6, 3.0); map_snow_I(c, g.bcyl, m.pipe, x, 0.6 + h / 2, z, 2.7, h, 2.7);
    map_snow_I(c, g.cone, m.metal, x, 1.3 + h, z, 2.7, 1.4, 2.7); map_snow_I(c, g.cone, m.snow, x + 0.1, 1.42 + h, z, 2.5, 1.3, 2.5);
    for (let y = 2; y < h; y += 2.2) map_snow_I(c, g.cyl, m.rust, x, 0.6 + y, z, 2.74, 0.1, 2.74);
    for (const e of [-0.25, 0.25]) map_snow_S(c, m.metal, x + sd * 2.78, 0.6, z + e, x + sd * 2.78, h + 0.6, z + e, 0.03);
    for (let y = 1; y < h; y += 0.45) map_snow_I(c, g.box, m.metal, x + sd * 2.78, 0.6 + y, z, 0.03, 0.03, 0.5);
    k.collider(x - 2.3, 0, z - 2.3, x + 2.3, h + 0.6, z + 2.3); k.collider(x - 2.75, 0, z - 1.2, x + 2.75, h, z + 1.2); k.collider(x - 1.2, 0, z - 2.75, x + 1.2, h, z + 2.75);
  }
  k.box(x, 14.5, sd * 46.2, 1.2, 0.1, 14.5, m.metal, { collide: false });
  for (const e of [-0.6, 0.6]) map_snow_S(c, m.yel, x + e, 15.5, sd * 39, x + e, 15.5, sd * 53.4, 0.03);
  map_snow_I(c, g.box, m.corr, x, 7.55, sd * 34, 1.8, 1.9, 15.1, -sd * 0.931, 0, 0); map_snow_I(c, g.box, m.snow, x, 8.6, sd * 34.6, 1.7, 0.1, 14.6, -sd * 0.931, 0, 0);
  for (const t of [0.3, 0.62]) for (const e of [-1, 1]) map_snow_S(c, m.rust, x + e * 1.6, 0, sd * (29.5 + 9 * t), x + e * 0.7, 1.5 + 12.1 * t - 1, sd * (29.5 + 9 * t), 0.09);
  k.box(x, 0, sd * 28.4, 4.4, 3.2, 4, m.brick); k.box(x, 3.2, sd * 28.4, 4.6, 0.14, 4.2, m.snow, { collide: false });
}
function map_snow_cooling(c, x, z) {   // torre di raffreddamento iperbolica
  const m = c.m, g = c.g, k = c.kit;
  map_snow_I(c, g.bcyl, m.conc, x, 0.5, z, 7.1, 1.0, 7.1); map_snow_I(c, g.tower, m.conc, x, 2.6, z, 1, 1, 1); map_snow_I(c, g.cyl, m.snow, x, 1.02, z, 7.0, 0.06, 7.0);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2, b = a + (i % 2 ? 0.16 : -0.16);
    map_snow_S(c, m.cdark, x + Math.cos(a) * 6.9, 1, z + Math.sin(a) * 6.9, x + Math.cos(b) * 6.75, 2.7, z + Math.sin(b) * 6.75, 0.16);
  }
  for (let i = 0; i < 4; i++) map_snow_I(c, g.box, m.redN, x + Math.cos(i * map_snow_H + 0.8) * 4.7, 24.5, z + Math.sin(i * map_snow_H + 0.8) * 4.7, 0.3, 0.3, 0.3);
  for (const e of [-0.25, 0.25]) map_snow_S(c, m.metal, x + 6.9, 1, z + e, x + 4.1, 18, z + e, 0.03);
  k.collider(x - 5, 0, z - 5, x + 5, 26, z + 5); k.collider(x - 6.8, 0, z - 2.6, x + 6.8, 3, z + 2.6); k.collider(x - 2.6, 0, z - 6.8, x + 2.6, 3, z + 6.8);
}
function map_snow_water(c, x, z) {   // torre dell'acqua su traliccio
  const m = c.m, g = c.g;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * 6.283, b = a + 1.047;
    map_snow_S(c, m.rust, x + Math.cos(a) * 3.4, 0, z + Math.sin(a) * 3.4, x + Math.cos(a) * 2.6, 15, z + Math.sin(a) * 2.6, 0.14, g.cyl);
    for (const y of [0.3, 5.2, 10.1]) map_snow_S(c, m.rust, x + Math.cos(a) * 3.3, y, z + Math.sin(a) * 3.3, x + Math.cos(b) * 3.0, y + 4.9, z + Math.sin(b) * 3.0, 0.05);
  }
  map_snow_I(c, g.bcyl, m.paint, x, 17.5, z, 3.6, 5, 3.6); map_snow_I(c, g.cyl, m.white, x, 18, z, 3.63, 0.8, 3.63); map_snow_I(c, g.cone, m.rust, x, 20.9, z, 3.8, 1.8, 3.8);
  map_snow_I(c, g.cone, m.snow, x + 0.1, 21.05, z, 3.5, 1.7, 3.5); map_snow_I(c, g.cone, m.paint, x, 14.3, z, 3.6, 1.4, 3.6, Math.PI, 0, 0);
  map_snow_I(c, g.cyl, m.metal, x, 15.05, z, 4.3, 0.1, 4.3); map_snow_S(c, m.pipe, x, 0, z, x, 14, z, 0.3, g.bcyl); map_snow_I(c, g.box, m.redN, x, 22, z, 0.3, 0.3, 0.3);
  c.kit.collider(x - 3.5, 0, z - 3.5, x + 3.5, 3, z + 3.5);
}
function map_snow_substation(c, x, z) {   // trasformatori + traliccio dell'alta tensione
  const f = map_snow_F(c, x, z, 0), m = c.m;
  for (const lz of [-4.5, 0, 4.5]) {
    f.b(0, 0, lz, 2.6, 0.4, 3, m.haz, true); f.b(0, 0.4, lz, 2, 2.2, 2.4, m.pipe, true); f.d(m.snow, 0, 2.6, lz, 2, 0.08, 2.4);
    for (let i = -4; i <= 4; i++) f.d(m.metal, -1.15, 0.6, lz + i * 0.26, 0.3, 1.8, 0.05);
    for (const e of [-0.6, 0, 0.6]) { f.c(m.rust, e, 2.6, lz, 0.09, 0.9); for (let j = 0; j < 4; j++) f.c(m.white, e, 2.75 + j * 0.2, lz, 0.17, 0.06); f.s(m.rubber, e, 3.5, lz, 4, 19, 8.5 + e * 6, 0.015); }
  }
  for (const a of [-1, 1]) for (const b of [-1, 1]) f.s(m.metal, 4 + a * 2, 0, 8.5 + b * 2, 4 + a * 0.5, 26, 8.5 + b * 0.5, 0.09);
  for (let i = 0; i < 6; i++) {
    const y0 = i * 4.3, y1 = y0 + 4.3, r0 = 2 - 1.5 * y0 / 26, r1 = 2 - 1.5 * y1 / 26;
    for (const s of [-1, 1]) {
      f.s(m.metal, 4 - r0, y0, 8.5 + s * r0, 4 + r1, y1, 8.5 + s * r1, 0.04); f.s(m.metal, 4 + r0, y0, 8.5 + s * r0, 4 - r1, y1, 8.5 + s * r1, 0.04);
      f.s(m.metal, 4 + s * r0, y0, 8.5 - r0, 4 + s * r1, y1, 8.5 + r1, 0.04); f.s(m.metal, 4 + s * r0, y0, 8.5 + r0, 4 + s * r1, y1, 8.5 - r1, 0.04);
    }
  }
  for (const y of [19, 23]) { f.s(m.metal, 4, y, 2.5, 4, y, 14.5, 0.07); for (const e of [-1, 1]) { f.s(m.metal, 4, y + 1.5, 8.5, 4, y, 8.5 + e * 6, 0.03); f.s(m.rubber, 4, y - 0.3, 8.5 + e * 6, 44, y - 6, 8.5 + e * 8, 0.015); } }
  f.d(m.redN, 4, 26, 8.5, 0.3, 0.3, 0.3); f.col(2, 0, 6.5, 6, 4, 10.5);
  map_snow_post(c, 7, x - 2.6, z - 2.2, -map_snow_H, 2.3, 1.5, 0.75); map_snow_post(c, 7, x - 2.6, z + 2.4, -map_snow_H, 2.3, 1.5, 0.75);
}
function map_snow_boiler(c, sd) {   // centrale termica (solo esterno): facciata di mattoni dipinta con finestroni industriali
  const f = map_snow_F(c, sd * -61.5, sd * -57, sd > 0 ? 0 : Math.PI), m = c.m;
  f.b(0, 0, 0, 11, 13, 16, m.fBrick, true); f.b(0, 13, 0, 11.5, 0.5, 16.5, m.conc); f.b(0, 13.5, 0, 11.3, 0.1, 16.3, m.snow); f.b(5.56, 0, 0, 0.12, 1.2, 16, m.cdark);
  for (const e of [-1, 1]) f.b(5.3, 0, e * 7.9, 0.7, 13, 0.5, m.brick);
  for (const lz of [-4, 3]) { f.b(-1, 13.5, lz, 2.4, 1.6, 2.4, m.pipe); f.c(m.rust, -1, 15.1, lz, 0.6, 3.5, c.g.bcyl); f.c(m.metal, -1, 18.6, lz, 0.8, 0.15); }
  f.b(1.5, 6, 9.6, 2, 2, 3.4, m.rust); f.d(m.snow, 1.5, 8, 9.6, 1.9, 0.08, 3.2); f.d(m.metal, 1.5, 0, 9.6, 0.25, 6, 0.25);
  f.b(4.2, 0, -9.4, 2.4, 2.4, 2.6, m.cdark, true); f.d(m.snow, 4.2, 2.4, -9.4, 2.5, 0.1, 2.7);
  map_snow_board(c, 9, f.X(5.66, 0), 2.5, f.Z(5.66, 0), f.rot + map_snow_H, 4.4, 2.2);     // manifesto "GLORIA AL LAVORO!"
}
function map_snow_crane(c) {   // PUNTO EROE: gru a portale gialla sopra lo scalo, con container appeso
  const f = map_snow_F(c, 0, 0, 0), m = c.m, g = c.g, k = c.kit;
  for (const s of [-1, 1]) {
    f.b(s * 12.3, 0, 0, 0.5, 0.2, 9.6, m.metal, false, false);
    for (const e of [-1, 1]) {
      f.b(s * 12.3, 0.2, e * 3.6, 0.9, 0.7, 1.6, m.haz, true); f.s(m.yel, s * 12.3, 0.9, e * 3.6, s * 12.3, 15, e * 1.2, 0.26, g.cyl);
      k.collider(s * 12.3 - 0.3, 0, e * 3.6 - 0.5, s * 12.3 + 0.3, 3.2, e * 3.6 + 0.5); f.d(m.rubber, s * 12.3, 0.9, e * 3.6, 0.92, 0.25, 0.25, 0.3);
      f.d(m.redN, s * 12.9, 16.6, e * 1.2, 0.26, 0.26, 0.26);
    }
    f.b(s * 12.3, 6.4, 0, 0.3, 0.3, 5.3, m.yel); f.b(s * 12.3, 14.8, 0, 0.9, 1.0, 3.4, m.yel);
    for (let y = 1.2; y < 14; y += 0.45) f.d(m.metal, s * 12.62, y, 3.6 - (y - 0.9) * 0.17, 0.04, 0.04, 0.5);
  }
  for (const e of [-1, 1]) {
    f.b(0, 15, e * 1.2, 26.4, 1.5, 0.5, m.yel); f.b(0, 16.5, e * 1.2, 26, 0.08, 0.52, m.snow); f.s(m.metal, -13, 17.5, e * 1.45, 13, 17.5, e * 1.45, 0.03);
    for (let x = -12; x <= 12; x += 2) { f.d(m.rust, x, 15, e * 1.2, 0.12, 1.5, 0.56); f.s(m.metal, x, 16.5, e * 1.45, x, 17.5, e * 1.45, 0.025); }
    for (const x of [-11, 11]) for (let i = 0; i < 4; i++) f.d(m.rubber, x + i * 0.5 - 0.75, 15.2, e * 1.46, 0.22, 1.1, 0.02, 0, 0);
    for (const s of [-1, 1]) f.s(m.rubber, 5 + s * 0.8, 16.6, e * 0.9, 5 + s * 0.8, 8.8, e * 2.6, 0.03);
    map_snow_board(c, 14, -3, 15.75, e * 1.5, e > 0 ? 0 : Math.PI, 1.8, 0.9);
  }
  f.b(5, 16.5, 0, 2.6, 0.8, 3, m.paint); f.b(5.3, 17.3, 0, 1.6, 1.0, 2.2, m.paint); f.d(m.snow, 5.3, 18.3, 0, 1.6, 0.08, 2.2);
  f.b(5, 8.6, 0, 2.5, 0.25, 6.2, m.haz); map_snow_container(c, 5, 6, 0, 0, m.blue);
  f.b(-8, 12.6, 0, 2, 2.3, 2.3, m.paint); f.d(m.amber, -8, 13.5, -1.17, 1.6, 0.9, 0.03); f.d(m.amber, -8, 13.5, 1.17, 1.6, 0.9, 0.03); f.d(m.glass, -9.02, 13.5, 0, 0.03, 0.9, 1.8); f.d(m.snow, -8, 14.9, 0, 2, 0.08, 2.3);
  for (const x of [-6, 0, 6]) f.d(m.amber, x, 14.9, 0, 0.6, 0.1, 0.4);
}

// ---------- rifugi di partenza, recinzione, sfondo ----------
function map_snow_shelter(c, x, sz) {
  const k = c.kit, m = c.m, g = c.g, f = map_snow_F(c, x, sz * 60, sz > 0 ? 0 : Math.PI), team = sz > 0 ? 'blue' : 'red', tm = sz > 0 ? m.blue : m.red;
  f.b(0, 0, 5, 15, 3.8, 0.4, m.brick, true); f.b(0, 3.8, 0, 15.8, 0.22, 10.8, m.corr, true); f.b(0, 4.02, 0, 15.9, 0.14, 10.9, m.snow);
  for (const e of [-1, 1]) {
    f.b(e * 7.5, 0, 0.6, 0.4, 3.8, 9, m.brick, true); f.b(e * 7.3, 0, -4.8, 0.3, 3.8, 0.3, m.metal, true); f.b(e * 6.8, 0, 1, 0.5, 0.45, 5, m.wood, true);
    f.d(m.amber, e * 3.5, 3.4, 0, 1.2, 0.06, 0.15); f.d(m.paint, e * 2.2, 0, 4.4, 1.0, 0.5, 0.6); f.d(m.paint, e * 2.2, 0.5, 4.45, 0.9, 0.4, 0.5); f.d(m.yel, e * 2.2, 0.62, 4.18, 0.3, 0.12, 0.02);
    map_snow_bags(c, f.X(e * 4.6, -6.3), f.Z(e * 4.6, -6.3), 0, 5);
  }
  for (let i = -6; i <= 6; i += 3) f.d(m.rust, i, 3.55, 0, 0.12, 0.25, 10);
  f.d(tm, 0, 2.0, 4.76, 6.5, 1.1, 0.05); f.d(m.white, 0, 2.5, 4.72, 6.5, 0.1, 0.03);
  map_snow_board(c, 11, f.X(4.9, 4.74), 1.9, f.Z(4.9, 4.74), f.rot + Math.PI, 2.4, 1.2);
  map_snow_crate(c, f.X(-5.6, 3.9), f.Z(-5.6, 3.9), 0.05, 1.1, 1.0); map_snow_crate(c, f.X(-5.5, 2.6), f.Z(-5.5, 2.6), 0.3, 0.8, 0.6); map_snow_barrel(c, f.X(5.8, 4), f.Z(5.8, 4), tm);
  for (let lx = -7.6; lx < 7.7; lx += k.rand(0.5, 1.1)) { const L = k.rand(0.25, 0.7); f.i(g.cone, m.ice, lx, 3.8 - L / 2, -5.38, 0.04, L, 0.04, Math.PI, 0, 0); }
  map_snow_fire(c, f.X(6.4, -7.2), f.Z(6.4, -7.2)); k.light(f.X(6.4, -7.2), 1.7, f.Z(6.4, -7.2), 0xff8a3a, 28, 18);
  for (const dx of [-4.5, -1.5, 1.5, 4.5]) { k.spawn(team, f.X(dx, 1), f.Z(dx, 1)); k.nav(f.X(dx, 1), 0, f.Z(dx, 1)); }
  k.nav(f.X(0, -8), 0, f.Z(0, -8));
}
function map_snow_fence(c) {   // recinzione sovietica a pannelli con rombi + filo spinato + cancelli
  const k = c.kit, m = c.m, g = c.g, f = map_snow_F(c, 0, 0, 0);
  for (const s of [-1, 1]) {
    k.box(s * 69.4, 0, 0, 0.3, 3.2, 139, m.conc); k.box(s * 69.4, 3.2, 0, 0.4, 0.08, 139, m.snow, { collide: false });
    k.collider(s * 69.4 - 0.4, 0, -70, s * 69.4 + 0.4, 40, 70); k.collider(-70, 0, s * 69.4 - 0.4, 70, 40, s * 69.4 + 0.4);
    for (const e of [-1, 1]) { k.box(e * 38.9, 0, s * 69.4, 61.5, 3.2, 0.3, m.conc); k.box(e * 38.9, 3.2, s * 69.4, 61.5, 0.08, 0.4, m.snow, { collide: false }); }
    for (let t = -68.75; t <= 68.76; t += 2.5) {
      f.d(m.conc, s * 69.2, 0, t, 0.35, 3.35, 0.35); f.s(m.rust, s * 69.3, 3.2, t, s * 68.9, 3.8, t, 0.025);
      for (const a of [-0.62, 0.62]) for (const y of [0.95, 2.15]) f.i(g.pyr, m.conc, s * 69.19, y, t + 1.25 + a, 0.55, 0.12, 0.55, 0, 0, s * map_snow_H);
      if (Math.abs(t) > 8.2) {
        f.d(m.conc, t, 0, s * 69.2, 0.35, 3.35, 0.35); f.s(m.rust, t, 3.2, s * 69.3, t, 3.8, s * 68.9, 0.025);
        if (Math.abs(t + 1.25) > 9) for (const a of [-0.62, 0.62]) for (const y of [0.95, 2.15]) f.i(g.pyr, m.conc, t + 1.25 + a, y, s * 69.19, 0.55, 0.12, 0.55, -s * map_snow_H, 0, 0);
      }
    }
    for (const y of [3.45, 3.62, 3.8]) { f.s(m.metal, s * (69.3 - (y - 3.2) * 0.66), y, -69, s * (69.3 - (y - 3.2) * 0.66), y, 69, 0.012); for (const e of [-1, 1]) f.s(m.metal, e * 8.5, y, s * (69.3 - (y - 3.2) * 0.66), e * 69, y, s * (69.3 - (y - 3.2) * 0.66), 0.012); }
    // targhe "ZONA 4", pericolo e un graffito sul muro
    for (const z of [-42.5, -17.5, 15, 40]) map_snow_board(c, 6, s * 69.06, 1.6, z, -s * map_snow_H, 1.9, 0.95);
    map_snow_board(c, 7, s * 69.06, 1.6, -s * 27.5, -s * map_snow_H, 1.8, 0.9);
    map_snow_plate(c, 10, s * 69.05, 1.5, s * 2.5, -s * map_snow_H, 2.1, 1.05);
    for (const x of [-45, -25, 25, 45]) map_snow_board(c, 6, x, 1.6, s * 69.06, s > 0 ? Math.PI : 0, 1.9, 0.95);
    // cancello: pilastri, trave con scritta, sbarre
    for (const e of [-1, 1]) { k.box(e * 8.6, 0, s * 69.2, 1.1, 5.6, 1.1, m.brick); k.box(e * 8.6, 5.6, s * 69.2, 1.3, 0.14, 1.3, m.snow, { collide: false }); f.d(m.amber, e * 8.6, 4.6, s * 68.6, 0.3, 0.3, 0.12); }
    k.box(0, 5.0, s * 69.2, 16.2, 0.5, 0.5, m.metal, { collide: false }); k.box(0, 5.5, s * 69.2, 16, 0.07, 0.5, m.snow, { collide: false });
    for (let x = -7.9; x <= 7.91; x += 0.395) f.d(m.metal, x, 0.15, s * 69.4, 0.06, 4.5, 0.06);
    for (const y of [0.5, 2.4, 4.4]) f.d(m.metal, 0, y, s * 69.4, 16, 0.1, 0.09);
    for (const e of [-1, 1]) for (let i = 0; i < 5; i++) f.d(m.red, e * 4 - 1.2 + i * 0.6, 1.2, s * 69.3, 0.35, 0.9, 0.05, 0, 0);
    map_snow_board(c, 8, 0, 2.0, s * 69.3, s > 0 ? Math.PI : 0, 2.2, 1.1);
    map_snow_sign(c, 0, 5.75, s * 68.95, s > 0 ? 0 : Math.PI, 'ЗАВОД 05', 0.2, m.amber);
    k.box(0, -0.4, s * 105, 280, 0.4, 70, m.snow, { collide: false, cast: false }); k.box(s * 105, -0.4, 0, 70, 0.4, 140, m.snow, { collide: false, cast: false });
    k.box(0, 0, s * 78, 9, 0.03, 16, m.asph, { collide: false, cast: false });
  }
}
function map_snow_skyline(c) {   // palazzoni con facciate DIPINTE (finestre, balconi, luci accese) + cintura di pini fuori dal muro
  const k = c.kit, m = c.m, g = c.g, fm = [m.fPanel, m.fOchre, m.fBrick], nc = { collide: false };
  const blocks = [[-85, -40, 12, 42, 30, 1, 0], [-87, 22, 12, 36, 24, 1, 1], [85, 38, 12, 42, 33, 1, 0], [87, -24, 12, 36, 24, 1, 2],
    [-30, -86, 46, 12, 27, 0, 1], [36, -88, 36, 12, 36, 0, 0], [30, 86, 46, 12, 27, 0, 2], [-36, 88, 36, 12, 36, 0, 0]];
  for (const [x, z, w, d, h, alongZ, t] of blocks) {
    k.box(x, 0, z, w, h, d, fm[t], nc); k.box(x, h, z, w + 0.7, 0.45, d + 0.7, m.conc, nc); k.box(x, h + 0.45, z, w + 0.5, 0.25, d + 0.5, m.snow, nc);
    k.box(x, 0, z, w + 0.3, 1.1, d + 0.3, m.cdark, nc);
    const ox = alongZ ? 0 : w * 0.2, oz = alongZ ? d * 0.2 : 0;
    k.box(x + ox, h + 0.45, z + oz, 4, 3, 4, m.brick, nc); k.box(x + ox, h + 3.45, z + oz, 4.3, 0.2, 4.3, m.snow, nc);
    k.box(x - ox, h + 0.45, z - oz, 2.2, 1.4, 2.2, m.pipe, nc); map_snow_I(c, g.cyl, m.rust, x - ox, h + 2.6, z - oz, 0.4, 1.6, 0.4);
    if (t === 2) { map_snow_I(c, g.chim, m.brick, x - ox * 1.6, h + 7, z - oz * 1.6, 1.2, 14, 1.2); map_snow_I(c, g.box, m.redN, x - ox * 1.6, h + 14.2, z - oz * 1.6, 0.3, 0.3, 0.3); }
    map_snow_S(c, m.metal, x, h, z, x, h + 9, z, 0.08); map_snow_I(c, g.box, m.redN, x, h + 9, z, 0.3, 0.3, 0.3);
    for (const a of [3, 5, 6.5]) map_snow_S(c, m.metal, x - 1, h + a + 2, z - (alongZ ? 0.9 : 0), x + 1, h + a + 2, z + (alongZ ? 0.9 : 0), 0.03);
  }
  for (let i = 0; i < 72; i++) {
    const t = k.rand(-76, 76), o = k.rand(71.5, 77.5), s = i % 2 ? 1 : -1, h = k.rand(8, 14);
    if (i % 4 < 2) { if (Math.abs(t) > 7) map_snow_pine(c, t, s * o, h); } else map_snow_pine(c, s * o, t, h);
  }
}

MAPS.push({
  id: 'snow',
  name: 'Fabbrica nella Neve',
  size: 140,
  env: {
    sky: 'snow', sunElev: 21, sunAzim: 140, sunColor: 0xd6dff0, sunIntensity: 1.6,
    hemiSky: 0xc9daee, hemiGround: 0x8a8f98, hemiIntensity: 1.6,
    fogColor: 0xcfdfea, fogDensity: 0.010, exposure: 0.72, bloomThreshold: 2.0, bloomStrength: 0.42,
    rain: false, snow: true, dust: false
  },
  build(kit) {
    const c = map_snow_ctx(kit), k = kit, T = k.THREE, g = c.g, W = map_snow_F(c, 0, 0, 0);
    // palette: neve bianco-azzurra (freddo) contro intonaci ocra / rosa antico / salvia e mattone rosso (caldo); accento ambra e giallo-gru
    const m = c.m = {
      snow: k.mat('snow', { color: 0xe1e8eb, roughness: 0.94, scale: 3 }),
      conc: k.mat('concrete', { color: 0x9aa0a0, roughness: 0.94, scale: 3 }),
      cdark: k.mat('concrete_dark', { color: 0x70777c, roughness: 0.95, scale: 3 }),
      metal: k.mat('metal', { color: 0x626f79, roughness: 0.68, metalness: 0.72 }),
      paint: k.mat('metal_painted', { color: 0x3f7a6c, roughness: 0.8, metalness: 0.35 }),
      pipe: k.mat('metal_painted', { color: 0x9fb0b6, roughness: 0.76, metalness: 0.48 }),
      rust: k.mat('rust', { color: 0xa4694a, roughness: 0.95, metalness: 0.3 }),
      wood: k.mat('wood_dark', { color: 0x90785a, roughness: 0.96 }),
      glass: k.mat('glass', { color: 0x829ca8, roughness: 0.3, metalness: 0.1 }),
      rubber: k.mat('rubber', { color: 0x343d43, roughness: 0.94 }),
      dirt: k.mat('dirt', { color: 0x80786c, roughness: 1, scale: 3 }),
      rubble: k.mat('rubble', { color: 0x8f9492, roughness: 1 }),
      bag: k.mat('sandbag', { color: 0x9c9a80, roughness: 1 }),
      pine: k.mat('grass', { color: 0x3c5a48, roughness: 1 }),
      corr: k.mat('corrugated', { color: 0x7f939d, roughness: 0.82, metalness: 0.4 }),
      blue: k.mat('container_blue', { color: 0x4a7cab, roughness: 0.85 }),
      red: k.mat('container_red', { color: 0xb5503f, roughness: 0.85 }),
      yel: k.mat('road_line', { color: 0xd6a92e, roughness: 0.88 }),
      white: k.mat('road_line', { color: 0xd6d8d2, roughness: 0.9 }),
      ice: k.mat('ice', { color: 0xbfd6e2, roughness: 0.25 }),
      amber: k.neon(0xffc978, 4), redN: k.neon(0xff3b2e, 5), cold: k.neon(0xa9d8ff, 3.2), fire: k.neon(0xff7a22, 6),
      // --- materiali dipinti a codice (14) ---
      fPanel: map_snow_facade(k, T, 0), fOchre: map_snow_facade(k, T, 1), fBrick: map_snow_facade(k, T, 2),
      ochre: map_snow_plaster(k, T, 201, 160, 84), rose: map_snow_plaster(k, T, 198, 142, 124), sage: map_snow_plaster(k, T, 150, 168, 136),
      brick: map_snow_brickwall(k, T), asph: map_snow_asphalt(k, T), pave: map_snow_paving(k, T),
      tile: map_snow_tiles(k, T), parq: map_snow_parquet(k, T), plast: map_snow_innerwall(k, T),
      haz: map_snow_hazard(k, T), sign: map_snow_signs(k, T)
    };
    m.wagon = m.red;
    const flat = { collide: false, cast: false };
    k.ground(m.snow);

    // 1) TERRENO: 3 corsie, 2 traverse, 2 strade di fondo, marciapiedi a lastre con cordolo
    k.box(0, 0, 0, 23, 0.025, 112, m.dirt, flat);
    for (const x of [-44, 44]) k.box(x, 0, 0, 13, 0.03, 112, m.asph, flat);
    for (const z of [-18, 18]) k.box(0, 0, z, 108, 0.036, 7.2, m.asph, flat);
    for (const z of [-50.5, 50.5]) k.box(0, 0, z, 108, 0.034, 7, m.asph, flat);
    for (const sx of [-1, 1]) for (const [zc, len] of [[-33.8, 24.4], [0, 28.8], [33.8, 24.4]]) {
      k.box(sx * 34.5, 0, zc, 6, 0.15, len, m.pave); k.box(sx * 37.6, 0, zc, 0.2, 0.18, len, m.cdark, { collide: false });
      k.box(sx * 52.25, 0, zc, 3.5, 0.15, len, m.pave); k.box(sx * 50.4, 0, zc, 0.2, 0.18, len, m.cdark, { collide: false });
      k.box(sx * 12.5, 0, zc, 2, 0.15, len, m.pave); k.box(sx * 11.4, 0, zc, 0.2, 0.18, len, m.cdark, { collide: false });
    }
    // segnaletica consumata, strisce pedonali, tombini
    for (const x of [-44, 44]) {
      for (let z = -54; z <= 54; z += 4) if (Math.abs(Math.abs(z) - 18) > 5 && k.rng() < 0.85) W.d(m.white, x, 0.031, z, 0.14, 0.006, k.rand(1.2, 2.2), k.rand(-0.02, 0.02));
      for (const z of [-24, -12, 12, 24]) for (let i = -6; i <= 5; i++) if (k.rng() < 0.9) W.d(m.white, x + i * 1.05 + 0.5, 0.032, z, 0.5, 0.006, 2.4);
      for (const z of [-48, -31, -4, 9, 33, 47]) { W.c(m.rust, x + k.rand(-4, 4), 0.02, z, 0.42, 0.022); }
      for (const o of [-2.2, 2.4]) k.decal(x + o, 0, 0.45, 104, 0, m.dirt);
    }
    for (const z of [-18, 18]) for (const x of [-30, -14, 14, 30]) W.d(m.yel, x, 0.038, z, k.rand(1.6, 2.4), 0.006, 0.14, k.rand(-0.02, 0.02));

    // 2) SCALO FERROVIARIO (corsia centrale): massicciata, rotaie, traversine, respingenti, vagoni, locomotiva
    for (const tx of [-5, 5]) {
      k.box(tx, 0.02, 0, 3.4, 0.07, 113, m.rubble, flat);
      for (const s of [-1, 1]) k.box(tx + s * 0.78, 0.09, 0, 0.08, 0.14, 112, m.metal, { collide: false });
      for (let z = -55.5; z <= 55.5; z += 0.9) W.d(m.wood, tx, 0.07, z, 2.5, 0.08, 0.24, k.rand(-0.02, 0.02));
      for (const e of [-1, 1]) {
        k.box(tx, 0, e * 56.4, 2.6, 1.3, 0.5, m.haz); W.d(m.red, tx, 0.7, e * 56.1, 2.2, 0.4, 0.06); W.d(m.snow, tx, 1.3, e * 56.4, 2.6, 0.08, 0.5);
        for (const s of [-1, 1]) W.s(m.rust, tx + s * 0.9, 0.1, e * 54.6, tx + s * 0.9, 1.2, e * 56.2, 0.06);
        map_snow_post(c, tx < 0 ? 12 : 13, tx + Math.sign(tx) * 2.5, e * 22.5, e > 0 ? 0 : Math.PI, 2.9, 1.5, 0.75);
      }
    }
    map_snow_wagon(c, -5, -42, 0); map_snow_wagon(c, -5, -30.5, 1); map_snow_wagon(c, -5, 31, 2);
    map_snow_wagon(c, 5, -31, 2); map_snow_wagon(c, 5, 29.5, 1); map_snow_loco(c, 5, 42);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) map_snow_post(c, 15, sx * 12.6, sz * 22.2, sz > 0 ? Math.PI : 0, 2.6, 1.4, 0.7);

    // 3) PUNTO EROE: gru a portale + pile di container
    map_snow_crane(c);
    map_snow_container(c, -9.6, 0, -4.6, 0.02, m.blue); map_snow_container(c, -9.6, 2.6, -4.3, -0.03, m.red); map_snow_container(c, -9.6, 0, 4.6, -0.02, m.paint);
    map_snow_container(c, 9.6, 0, 4.6, 0.03, m.wagon); map_snow_container(c, 9.5, 0, -4.8, -0.04, m.yel);

    // 4) EDIFICI ENTRABILI (8): dormitorio, direzione, mensa, magazzino, sala controllo, officina, 2 guardiole
    map_snow_office(c, -22.5, -36, 20, 2, 1, m.brick, m.conc, -1, m.tile, 1);
    map_snow_office(c, -22.5, 0, 16, 4, 0, m.ochre, m.conc, 0, m.parq, 0);
    map_snow_office(c, -22.5, 36, 20, 2, 2, m.rose, m.cdark, -1, m.tile, 2);
    map_snow_office(c, 22.5, -36, 20, 3, 3, m.brick, m.conc, 1, m.conc, 3);
    map_snow_office(c, 22.5, 0, 16, 3, 4, m.sage, m.cdark, 0, m.parq, 4);
    map_snow_office(c, 22.5, 36, 20, 2, 5, m.ochre, m.conc, 1, m.conc, 5);
    // scritta rossa sul tetto della direzione ("Gloria al lavoro"), rivolta allo scalo
    map_snow_sign(c, -14.1, 14.9, 0, -map_snow_H, 'СЛАВА ТРУДУ', 0.2, m.redN, false);
    for (let z = -6; z <= 6; z += 2) { W.s(m.metal, -14.25, 13.8, z, -14.25, 16.4, z, 0.04); W.s(m.metal, -14.25, 16.2, z, -15.6, 13.9, z, 0.03); }
    for (const y of [14.8, 16.35]) W.s(m.metal, -14.25, y, -6.7, -14.25, y, 6.7, 0.03);
    // traliccio radio sul tetto della sala controllo
    for (const a of [-1, 1]) for (const b of [-1, 1]) W.s(m.metal, 22.5 + a * 0.9, 10.4, b * 0.9, 22.5 + a * 0.15, 24, b * 0.15, 0.05);
    for (let y = 10.6; y < 22.5; y += 2.2) for (const a of [-1, 1]) {
      const r = 0.9 - 0.75 * (y - 10.4) / 13.6, r2 = 0.9 - 0.75 * (y - 8.2) / 13.6;
      W.s(m.metal, 22.5 - r, y, a * r, 22.5 + r2, y + 2.2, a * r2, 0.025); W.s(m.metal, 22.5 + a * r, y, -r, 22.5 + a * r2, y + 2.2, r2, 0.025);
    }
    W.d(m.redN, 22.5, 24, 0, 0.3, 0.3, 0.3); W.d(m.redN, 22.5, 17, 0, 0.25, 0.25, 0.25);
    W.i(g.cone, m.white, 23.2, 20, 0.6, 0.7, 0.35, 0.7, 0, 0, -1.2);
    for (const s of [1, -1]) {
      k.building({ x: s * 17, z: s * 60.5, w: 8, d: 7, floors: 2, floorH: 3.4, wall: 0.3, mat: m.rose, innerMat: m.plast, floorMat: m.tile,
        doors: [{ side: s > 0 ? 'n' : 's', at: 0, width: 1.7 }, { side: s > 0 ? 'w' : 'e', at: 0, width: 1.7 }], windows: true, roof: 'flat', ruined: 0, rotY: 0 });
      map_snow_dress(c, s * 17, s * 60.5, 8, 7, 2, { trim: m.conc, esc: 0, ez: 0, doors: s > 0 ? 'nw' : 'se', flat: true });
      map_snow_interior(c, s * 17, s * 60.5, 7, 6, s > 0 ? 0 : Math.PI);
      // sbarra del cancello alzata
      W.d(m.haz, s * 7, 0, s * 63.5, 0.4, 1.1, 0.4); W.s(m.white, s * 7, 1.0, s * 63.5, s * -1.5, 3.4, s * 63.5, 0.06); W.s(m.red, s * 4, 1.85, s * 63.5, s * 2, 2.42, s * 63.5, 0.066);
      k.collider(s * 7 - 0.25, 0, s * 63.5 - 0.25, s * 7 + 0.25, 1.1, s * 63.5 + 0.25);
    }

    // 5) FONDERIA E IMPIANTI: capannoni a shed, ciminiere, centrali, silos, torre di raffreddamento, torre dell'acqua
    map_snow_hall(c, -60, -18, 1, 1); map_snow_hall(c, 60, 18, -1, 2);
    map_snow_stack(c, -60, -43.5, 56); map_snow_stack(c, 60, 43.5, 50);
    for (const sd of [1, -1]) { map_snow_boiler(c, sd); map_snow_silos(c, sd); }
    map_snow_cooling(c, -61.5, 17); map_snow_water(c, 60.5, -9); map_snow_substation(c, 60.5, -27);

    // 6) PASSERELLE, TUBAZIONI, LAMPIONI
    map_snow_bridge(c, -1); map_snow_bridge(c, 1);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) map_snow_gas(c, sx, sz);
      const X = sx * 52.6, z0 = -sx * 30, xi = X - sx * 3.2;
      map_snow_pipe(c, m.pipe, [[X, 0, -51], [X, 6.7, -51], [X, 6.7, z0 - 2], [xi, 6.7, z0 - 2], [xi, 6.7, z0 + 2], [X, 6.7, z0 + 2], [X, 6.7, 51], [X, 0, 51]], 0.45, 8.5);
      map_snow_pipe(c, m.rust, [[X + sx * 0.75, 6.4, -50], [X + sx * 0.75, 6.4, 50]], 0.2, 0);
      for (let z = -46.75; z <= 47; z += 8.5) {
        k.box(X, 0, z, 0.3, 6.2, 0.3, m.metal); W.d(m.metal, X + sx * 0.2, 6.05, z, 1.9, 0.15, 0.2); W.d(m.conc, X, 0.15, z, 0.7, 0.3, 0.7);
        if (Math.abs(z + 2 - z0) > 5.5) W.d(m.snow, X, 7.15, z + 2, 0.5, 0.07, 6);
      }
      for (const z of [-45, -27, -9, 9, 27, 45]) map_snow_lamp(c, sx * 51.2, z, sx * map_snow_H);
      for (let z = -45; z < 45; z += 18) { W.s(m.rubber, sx * 51.2, 6.9, z, sx * 51.2, 6.3, z + 9, 0.02); W.s(m.rubber, sx * 51.2, 6.3, z + 9, sx * 51.2, 6.9, z + 18, 0.02); }
    }
    // cavi tesi tra gli edifici
    for (const bx of [-22.5, 22.5]) for (const s of [-1, 1]) for (const o of [-6, 5]) {
      W.s(m.rubber, bx + o, 7.2, s * 26, bx + o * 0.9, 8.6, s * 17, 0.015); W.s(m.rubber, bx + o * 0.9, 8.6, s * 17, bx + o * 0.8, 10.6, s * 8, 0.015);
    }

    // 7) COPERTURE: ogni voce è messa due volte (specchiata rispetto al centro) così le squadre sono pari
    const put = (t, x, z, r, sd) => {
      if (t === 'j') map_snow_jersey(c, x, z, r);
      else if (t === 'c') map_snow_crate(c, x, z, r);
      else if (t === 'C') { map_snow_crate(c, x, z, r, 1.5, 1.3); map_snow_crate(c, x + 0.1, z - 0.1, r + 0.5, 0.9, 0.8, 1.3); map_snow_crate(c, x + 1.45, z + 0.2, r - 0.2, 1.0, 0.9); }
      else if (t === 'b') map_snow_bags(c, x, z, r, 4);
      else if (t === 'B') { map_snow_barrel(c, x, z, m.rust); map_snow_barrel(c, x + 0.7, z + 0.2, m.blue); map_snow_barrel(c, x + 0.3, z + 0.75, m.yel); map_snow_barrel(c, x - 0.9, z + 0.4, m.rust, true); }
      else if (t === 'p') map_snow_pallets(c, x, z, r, 5);
      else if (t === 't') { map_snow_tires(c, x, z, 4); map_snow_tires(c, x + 0.95, z + 0.2, 2); }
      else if (t === 'r') map_snow_reel(c, x, z, r);
      else if (t === 'T') map_snow_truck(c, x, z, r, sd > 0 ? m.blue : m.paint, sd > 0);
      else if (t === 'a') map_snow_car(c, x, z, r, sd > 0 ? m.red : m.yel);
    };
    const items = [
      // corsia laterale
      ['T', -46.6, -31, 0.03], ['j', -40.6, -44.5, 1.57], ['j', -47.6, -40, 1.6], ['C', -40.2, -36.5, 0.1], ['B', -48.6, -25, 0], ['b', -42.5, -10.5, 0],
      ['r', -47.2, -7, 0.3], ['a', -41, 2.5, 3.18], ['p', -47.8, 5.5, 0.2], ['j', -46.2, 12, 1.55], ['c', -40.6, 14, 0.2], ['b', -46.5, 25.5, 0],
      ['t', -40.4, 27.5, 0], ['C', -47.8, 33, -0.1], ['j', -41, 38.5, 1.6], ['B', -46, 43.5, 0], ['p', -40.6, 46.5, 0.4],
      // scalo centrale
      ['c', 2.4, -51, 0.2], ['b', -1.2, -43, 0], ['j', 1.6, -36, 1.57], ['B', -9.8, -33, 0], ['p', 9.6, -27, 0.1], ['c', -0.6, -24.5, -0.2],
      ['r', 9.8, -15.5, 0.2], ['j', -1.5, -8.5, 1.57], ['t', 2.2, -6.5, 0], ['C', 9.2, -40, 0.05],
      // traversa e strada di fondo
      ['j', -27.5, -18.6, 0.04], ['c', -20, -20.6, 0.3], ['B', -16.5, -15.6, 0], ['j', 28, -17.4, -0.05], ['C', 19, -20.2, 0.2], ['p', 24.5, -15.4, 0],
      ['a', 24, -52.2, 1.62], ['c', -17.5, -52.6, 0.1], ['j', -28, -49.6, 0.05], ['b', 30.5, -48.2, 0], ['t', -24, -53, 0], ['B', 12.8, -53.2, 0]
    ];
    for (const sd of [1, -1]) for (const [t, x, z, r] of items) put(t, sd * x, sd * z, r + (sd < 0 ? Math.PI : 0), sd);

    // 8) PARTENZE AL COPERTO (8 per squadra), RECINZIONE, SFONDO
    for (const sz of [1, -1]) for (const x of [-44, 44]) map_snow_shelter(c, x, sz);
    map_snow_fence(c);
    map_snow_skyline(c);
    for (let i = 0; i < 26; i++) {
      const s = i % 2 ? 1 : -1, x = k.rand(-34, 34), z = s * k.rand(65.5, 67.8), h = k.rand(6.5, 10);
      if (Math.abs(x) > 10) map_snow_pine(c, x, z, h, true);
    }
    for (const [x, z, s] of [[-66, 30, 1.2], [-55.5, 33.5, 0.8], [66.5, -36, 1.1], [56, -14.5, 0.7], [-33, 66.5, 0.9], [31, -66.8, 1.0], [-66.8, 66.5, 1.4], [66.8, -66.5, 1.4], [10.5, 66.8, 0.7], [-10.8, -66.9, 0.8]]) map_snow_rock(c, x, z, s);

    // 9) DETTAGLIO DEL TERRENO: macchie, ghiaccio, crepe, detriti, cumuli di neve spalata
    const LX = [-44, 0, 44];
    for (let i = 0; i < 72; i++) {
      const onLane = i % 3 !== 2, x = onLane ? k.pick(LX) + k.rand(-5.5, 5.5) : k.rand(-50, 50);
      const z = onLane ? k.rand(-54, 54) : k.pick([-18, 18, -50.5, 50.5]) + k.rand(-2.8, 2.8);
      k.decal(x, z, k.rand(0.8, 3.2), k.rand(0.8, 3.6), k.rand(0, 3.1), k.pick([m.dirt, m.ice, m.rubber, m.rubble, m.ice, m.dirt]));
      for (let j = 0; j < 3; j++) W.d(m.rubber, x + k.rand(-1.5, 1.5), 0.037, z + k.rand(-1.5, 1.5), 0.03, 0.004, k.rand(0.5, 1.6), k.rand(0, 3.1));
    }
    for (let i = 0; i < 300; i++) {
      const x = k.pick(LX) + k.pick([-1, 1]) * k.rand(4.6, 6.4), z = k.rand(-54, 54);
      W.i(i % 4 ? g.ico : g.rock, k.pick([m.rubble, m.rubble, m.rust, m.brick, m.cdark]), x, k.rand(0.05, 0.12), z,
        k.rand(0.08, 0.26), k.rand(0.05, 0.14), k.rand(0.1, 0.3), k.rand(-0.3, 0.3), k.rand(0, 6), k.rand(-0.3, 0.3));
    }
    for (const ex of [-50.1, -37.9, -11.1, 11.1, 37.9, 50.1]) for (let z = -54; z < 54; z += k.rand(1.6, 3.2)) {
      if (Math.abs(Math.abs(z) - 18) < 4.2 || (Math.abs(z) < 1.8 && Math.abs(ex) < 40) || Math.abs(Math.abs(z) - 50.5) < 3.8) continue;
      W.i(g.sph, m.snow, ex + k.rand(-0.25, 0.25), 0.05, z, k.rand(0.5, 0.95), k.rand(0.18, 0.42), k.rand(0.9, 1.9), 0, k.rand(-0.2, 0.2), 0);
    }
    for (let i = 0; i < 130; i++) {
      const s = i % 2 ? 1 : -1, t = k.rand(-68, 68), w = k.rand(1, 2.6), h = k.rand(0.3, 0.8), d = k.rand(0.6, 1.1);
      if (i % 4 < 2) { if (Math.abs(t) > 8.5) W.i(g.sph, m.snow, t, 0, s * 68.9, w, h, d); } else W.i(g.sph, m.snow, s * 68.9, 0, t, d, h, w);
    }
    for (const bx of [-22.5, 22.5]) for (const bz of [-36, 0, 36]) for (let i = 0; i < 10; i++) {
      const hd = bz ? 10 : 8, a = k.pick([-1, 1]), t = k.pick([-1, 1]) * k.rand(2.4, 8), w = k.rand(0.7, 1.5), h = k.rand(0.2, 0.45);
      if (i % 2) W.i(g.sph, m.snow, bx + t, 0.1, bz + a * (hd + 0.5), w, h, 0.6); else W.i(g.sph, m.snow, bx + a * 9.5, 0.1, bz + t * (hd / 9), 0.6, h, w);
    }

    // 10) PUNTI DI NAVIGAZIONE EXTRA lungo corsie, traverse e strade di fondo
    for (const x of LX) for (let z = -54; z <= 54; z += 6) k.nav(x || (z < 0 ? -0.6 : 0.6), 0, z);
    for (const z of [-50.5, -18, 18, 50.5]) for (let x = -48; x <= 48; x += 8) k.nav(x, 0, z);

    // tutte le targhe dipinte: una sola mesh (1 draw call) con UV sull'atlante
    if (c.signs.length) k.mesh(mergeGeometries(c.signs), m.sign, { x: 0, y: 0, z: 0 }, { collide: false });
    // tutte le istanze raccolte: una sola draw call per coppia geometria+materiale
    for (const [geo, mm] of c.bat) for (const [mat, list] of mm) k.instanced(geo, mat, list, { cast: true });
  }
});
