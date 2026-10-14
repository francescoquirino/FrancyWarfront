// =============================================================================
// maps/06_jungle.js — "Tempio nella Giungla" (versione 4: materiali dipinti a codice)
// =============================================================================
function map_jungle_cv(size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function map_jungle_tex(canvas, repeat, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = repeat === false ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function map_jungle_speckle(ctx, r, S, n, cols, smin, smax, alpha) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * (0.4 + 0.6 * r());
    ctx.fillStyle = cols[(r() * cols.length) | 0];
    const s = smin + r() * (smax - smin);
    ctx.fillRect(r() * S, r() * S, s, s * (0.6 + r() * 0.8));
  }
  ctx.globalAlpha = 1;
}

function map_jungle_blob(ctx, S, x, y, rad, rgb, alpha) {
  for (let ox = -S; ox <= S; ox += S) {
    for (let oy = -S; oy <= S; oy += S) {
      const cx = x + ox;
      const cy = y + oy;
      if (cx + rad < 0 || cx - rad > S || cy + rad < 0 || cy - rad > S) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
  }
}

function map_jungle_crack(ctx, r, S, n, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let x = r() * S;
    let y = r() * S;
    let a = r() * 6.28;
    const steps = 5 + ((r() * 8) | 0);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++) {
      a += (r() - 0.5) * 1.2;
      x += Math.cos(a) * (8 + r() * 22);
      y += Math.sin(a) * (8 + r() * 22);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function map_jungle_leaflet(ctx, x0, y0, x1, y1, wid, fill) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * wid;
  const ny = (dx / l) * wid;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx + nx, my + ny, x1, y1);
  ctx.quadraticCurveTo(mx - nx, my - ny, x0, y0);
  ctx.fill();
}

function map_jungle_glyph(ctx, r, cx, cy, rad) {
  const kind = (r() * 5) | 0;
  const path = () => {
    const q = rad;
    const rr = q * 0.28;
    ctx.beginPath();
    ctx.moveTo(-q + rr, -q);
    ctx.arcTo(q, -q, q, q, rr);
    ctx.arcTo(q, q, -q, q, rr);
    ctx.arcTo(-q, q, -q, -q, rr);
    ctx.arcTo(-q, -q, q, -q, rr);
    ctx.closePath();
    if (kind === 0) {
      ctx.rect(-0.6 * q, 0.1 * q, 1.2 * q, 0.16 * q);
      ctx.rect(-0.6 * q, 0.42 * q, 1.2 * q, 0.16 * q);
      for (let k = -1; k <= 1; k++) {
        ctx.moveTo(k * 0.4 * q + 0.13 * q, -0.32 * q);
        ctx.arc(k * 0.4 * q, -0.32 * q, 0.13 * q, 0, 6.283);
      }
    } else if (kind === 1) {
      ctx.moveTo(0, 0);
      for (let a = 0; a < 12.6; a += 0.3) ctx.lineTo(Math.cos(a) * a * q * 0.055, Math.sin(a) * a * q * 0.055);
    } else if (kind === 2) {
      ctx.moveTo(-0.02 * q, -0.25 * q);
      ctx.arc(-0.2 * q, -0.25 * q, 0.18 * q, 0, 6.283);
      ctx.moveTo(0.1 * q, -0.55 * q);
      ctx.lineTo(0.58 * q, 0);
      ctx.lineTo(0.15 * q, 0.1 * q);
      ctx.moveTo(-0.45 * q, 0.42 * q);
      ctx.lineTo(0.4 * q, 0.42 * q);
      ctx.moveTo(-0.6 * q, -0.62 * q);
      ctx.lineTo(0.5 * q, -0.72 * q);
    } else if (kind === 3) {
      ctx.moveTo(0.6 * q, 0);
      ctx.arc(0, 0, 0.6 * q, 0, 6.283);
      ctx.moveTo(0.28 * q, 0);
      ctx.arc(0, 0, 0.28 * q, 0, 6.283);
      ctx.moveTo(-0.6 * q, 0);
      ctx.lineTo(0.6 * q, 0);
      ctx.moveTo(0, -0.6 * q);
      ctx.lineTo(0, 0.6 * q);
    } else {
      ctx.moveTo(-0.7 * q, 0.6 * q);
      ctx.lineTo(-0.7 * q, -0.6 * q);
      ctx.lineTo(0.6 * q, -0.6 * q);
      ctx.lineTo(0.6 * q, 0.3 * q);
      ctx.lineTo(-0.3 * q, 0.3 * q);
      ctx.lineTo(-0.3 * q, -0.2 * q);
      ctx.lineTo(0.2 * q, -0.2 * q);
    }
  };
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,48,40,0.85)';
  ctx.lineWidth = 7;
  path();
  ctx.stroke();
  ctx.translate(3, 3);
  ctx.strokeStyle = 'rgba(206,198,168,0.5)';
  ctx.lineWidth = 2;
  path();
  ctx.stroke();
  ctx.restore();
}

// Pietra maya: glyphs=true blocchi scolpiti con glifi, false muratura a corsi sfalsati
function map_jungle_paintStone(r, glyphs) {
  const S = 1024;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#55564a';
  ctx.fillRect(0, 0, S, S);
  const rows = glyphs ? 4 : 6;
  const rh = S / rows;
  for (let row = 0; row < rows; row++) {
    const cols = glyphs ? 4 : 3 + (row % 2);
    const cw = S / cols;
    const off = glyphs ? 0 : (row % 2) * cw * 0.5;
    const tones = [];
    for (let k = 0; k < cols; k++) tones.push(116 + r() * 38);
    for (let k = -1; k <= cols; k++) {
      const tone = tones[((k % cols) + cols) % cols];
      const x = k * cw + off;
      const y = row * rh;
      ctx.fillStyle = 'rgb(' + ((tone + 12) | 0) + ',' + ((tone + 7) | 0) + ',' + ((tone - 14) | 0) + ')';
      ctx.fillRect(x + 4, y + 4, cw - 8, rh - 8);
      ctx.fillStyle = 'rgba(218,210,182,0.35)';
      ctx.fillRect(x + 4, y + 4, cw - 8, 5);
      ctx.fillRect(x + 4, y + 4, 5, rh - 8);
      ctx.fillStyle = 'rgba(52,50,42,0.42)';
      ctx.fillRect(x + 4, y + rh - 10, cw - 8, 6);
      ctx.fillRect(x + cw - 10, y + 4, 6, rh - 8);
    }
    if (glyphs) {
      for (let k = 0; k < cols; k++) {
        if (r() < 0.72) map_jungle_glyph(ctx, r, k * cw + cw / 2, row * rh + rh / 2, cw * 0.34);
      }
    }
  }
  map_jungle_speckle(ctx, r, S, 5200, ['#5d5c4e', '#b9b296', '#77745f', '#a39c82'], 2, 6, 0.16);
  for (let i = 0; i < 44; i++) {
    const x = r() * S;
    const y = r() * S;
    const w = 6 + r() * 12;
    const h = 60 + r() * 150;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(62,64,50,0.3)');
    g.addColorStop(1, 'rgba(62,64,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  for (let i = 0; i < 70; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 85, '84,118,58', 0.5);
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < 14; i++) map_jungle_blob(ctx, S, r() * S, row * rh + (r() - 0.5) * 22, 18 + r() * 34, '104,140,64', 0.55);
  }
  for (let i = 0; i < 50; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 8 + r() * 18, '132,160,78', 0.45);
  map_jungle_crack(ctx, r, S, 9, 'rgba(48,46,40,0.7)', 2);
  return c;
}

function map_jungle_paintBark(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b5540';
  ctx.fillRect(0, 0, S, S);
  const cols = ['#4a3a2c', '#7d664c', '#8c7558', '#55452f', '#665038'];
  for (let i = 0; i < 230; i++) {
    const x0 = r() * S;
    const k = 1 + ((r() * 3) | 0);
    const ph = r() * 6.28;
    const amp = 2 + r() * 7;
    ctx.strokeStyle = cols[(r() * cols.length) | 0];
    ctx.lineWidth = 1.5 + r() * 4;
    ctx.globalAlpha = 0.55 + r() * 0.4;
    for (let o = -S; o <= S; o += S) {
      ctx.beginPath();
      for (let y = 0; y <= S; y += 16) {
        const x = x0 + o + Math.sin((y / S) * 6.283 * k + ph) * amp;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 170; i++) {
    ctx.fillStyle = 'rgba(58,46,36,0.6)';
    ctx.fillRect(r() * S, r() * S, 6 + r() * 16, 1.5 + r() * 2);
  }
  for (let i = 0; i < 26; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 16 + r() * 46, '86,120,60', 0.5);
  for (let i = 0; i < 40; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 4 + r() * 9, '170,174,140', 0.5);
  return c;
}

// Atlante foglie con trasparenza: 4 colonne (felce, palma, foglia larga, liana)
function map_jungle_paintLeaves(r) {
  const S = 1024;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  ctx.lineCap = 'round';
  const green = (a, b, d) => 'rgb(' + (a | 0) + ',' + (b | 0) + ',' + (d | 0) + ')';
  // Colonna 0: felce
  for (let i = 0; i < 36; i++) {
    const t = i / 35;
    const y = 996 - t * 960;
    const len = 108 * Math.pow(1 - t, 0.75) * Math.min(1, 0.45 + t * 5) + 8;
    for (const s of [-1, 1]) {
      map_jungle_leaflet(ctx, 128, y, 128 + s * len, y - len * 0.38, len * 0.2 + 3, green(58 + r() * 34, 122 + r() * 52, 44 + r() * 22));
    }
  }
  ctx.strokeStyle = '#6a8a3a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(128, 1018);
  ctx.lineTo(128, 30);
  ctx.stroke();
  // Colonna 1: fronda di palma
  for (let i = 0; i < 46; i++) {
    const t = i / 45;
    const y = 1000 - t * 960;
    const len = 34 + 84 * Math.sin(Math.PI * (0.08 + 0.9 * t));
    for (const s of [-1, 1]) {
      map_jungle_leaflet(ctx, 384, y, 384 + s * len, y - len * 0.75 + 10, 5 + len * 0.05, green(50 + r() * 30, 112 + r() * 46, 46 + r() * 18));
    }
  }
  ctx.strokeStyle = '#7a8a40';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(384, 1018);
  ctx.lineTo(384, 24);
  ctx.stroke();
  // Colonna 2: foglia larga tipo banano
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(640, 1012);
  ctx.bezierCurveTo(490, 800, 500, 250, 640, 18);
  ctx.bezierCurveTo(780, 250, 790, 800, 640, 1012);
  ctx.closePath();
  const lg = ctx.createLinearGradient(530, 0, 750, 0);
  lg.addColorStop(0, '#4f8f3a');
  lg.addColorStop(0.5, '#7fb548');
  lg.addColorStop(1, '#46843a');
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(52,104,48,0.75)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) {
    const y = 960 - i * 43;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(640, y);
      ctx.quadraticCurveTo(640 + s * 60, y - 34, 640 + s * 130, y - 44);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 9; i++) map_jungle_blob(ctx, S, 560 + r() * 160, 80 + r() * 860, 18 + r() * 30, '150,160,70', 0.45);
  ctx.restore();
  ctx.strokeStyle = '#a9c96a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(640, 1018);
  ctx.lineTo(640, 30);
  ctx.stroke();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) {
    const y = 140 + r() * 760;
    const s = r() < 0.5 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(640 + s * 128, y - 12);
    ctx.lineTo(640 + s * 40, y);
    ctx.lineTo(640 + s * 128, y + 12);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // Colonna 3: liana con foglioline
  ctx.strokeStyle = '#6a5a3c';
  ctx.lineWidth = 10;
  ctx.beginPath();
  for (let y = 0; y <= S; y += 8) {
    const x = 896 + Math.sin((y / S) * 6.283 * 3) * 30;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5f8a3c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let y = 0; y <= S; y += 8) {
    const x = 896 + Math.sin((y / S) * 6.283 * 5 + 1.3) * 40;
    if (y === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < 34; i++) {
    const y = 16 + i * 30;
    const s = i % 2 ? 1 : -1;
    const x = 896 + Math.sin((y / S) * 6.283 * 3) * 30 + s * (26 + r() * 22);
    ctx.fillStyle = green(60 + r() * 40, 124 + r() * 56, 46 + r() * 24);
    ctx.beginPath();
    ctx.ellipse(x, y, 24 + r() * 10, 12 + r() * 6, s * 0.6 + (r() - 0.5) * 0.5, 0, 6.283);
    ctx.fill();
  }
  return c;
}

function map_jungle_paintCanopy(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3f6a34';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 30; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 50, '40,64,38', 0.6);
  for (let i = 0; i < 900; i++) {
    const x = r() * S;
    const y = r() * S;
    const a = r() * 6.283;
    const l = 14 + r() * 20;
    const w = 6 + r() * 8;
    const col = 'rgb(' + ((52 + r() * 52) | 0) + ',' + ((98 + r() * 78) | 0) + ',' + ((40 + r() * 30) | 0) + ')';
    for (let ox = -S; ox <= S; ox += S) {
      for (let oy = -S; oy <= S; oy += S) {
        const cx = x + ox;
        const cy = y + oy;
        if (cx < -40 || cx > S + 40 || cy < -40 || cy > S + 40) continue;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(cx, cy, l, w, a, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = 'rgba(176,206,112,0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * l, cy - Math.sin(a) * l);
        ctx.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        ctx.stroke();
      }
    }
  }
  return c;
}

function map_jungle_paintPlanks(r) {
  const S = 1024;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  const bw = S / 8;
  for (let b = 0; b < 8; b++) {
    const x = b * bw;
    const t = r();
    ctx.fillStyle = 'rgb(' + ((124 + t * 40) | 0) + ',' + ((90 + t * 30) | 0) + ',' + ((58 + t * 20) | 0) + ')';
    ctx.fillRect(x, 0, bw, S);
    for (let i = 0; i < 42; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(72,52,36,0.28)' : 'rgba(196,164,118,0.22)';
      ctx.fillRect(x + 4 + r() * (bw - 8), 0, 1 + r() * 2.5, S);
    }
    for (let k = 0; k < 2; k++) {
      if (r() < 0.6) {
        const kx = x + 24 + r() * (bw - 48);
        const ky = r() * S;
        for (let q = 3; q > 0; q--) {
          ctx.strokeStyle = 'rgba(66,46,32,' + (0.25 + q * 0.14) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(kx, ky, q * 5, q * 8, 0, 0, 6.283);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = '#3e3026';
    ctx.fillRect(x, 0, 4, S);
    ctx.fillStyle = 'rgba(214,186,140,0.3)';
    ctx.fillRect(x + 4, 0, 2, S);
    for (const ny of [60, 572]) {
      for (const nx of [26, bw - 26]) {
        ctx.fillStyle = '#463a30';
        ctx.beginPath();
        ctx.arc(x + nx, ny, 4.5, 0, 6.283);
        ctx.fill();
        const g = ctx.createLinearGradient(0, ny, 0, ny + 70);
        g.addColorStop(0, 'rgba(120,70,42,0.45)');
        g.addColorStop(1, 'rgba(120,70,42,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x + nx - 3, ny, 6, 70);
      }
    }
  }
  for (let i = 0; i < 22; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 70, '98,120,70', 0.3);
  map_jungle_speckle(ctx, r, S, 2600, ['#5a4232', '#b89868'], 1, 4, 0.14);
  return c;
}

function map_jungle_paintThatch(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a8925a';
  ctx.fillRect(0, 0, S, S);
  const cols = ['#c2ab6a', '#8f7a48', '#d2bc7c', '#7a6740', '#b39a5c', '#9c8850'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 6200; i++) {
    const x = r() * S;
    const y = r() * S;
    const l = 20 + r() * 44;
    const dx = (r() - 0.5) * 9;
    ctx.strokeStyle = cols[(r() * cols.length) | 0];
    ctx.lineWidth = 1 + r() * 1.4;
    ctx.globalAlpha = 0.6 + r() * 0.4;
    for (let oy = -S; oy <= 0; oy += S) {
      ctx.beginPath();
      ctx.moveTo(x, y + oy);
      ctx.lineTo(x + dx, y + oy + l);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (let k = 0; k < 4; k++) {
    const y = k * 128;
    const g = ctx.createLinearGradient(0, y, 0, y + 52);
    g.addColorStop(0, 'rgba(72,60,38,0.62)');
    g.addColorStop(1, 'rgba(72,60,38,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, S, 52);
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = '#d6c284';
      ctx.lineWidth = 1.3;
      const x = r() * S;
      ctx.beginPath();
      ctx.moveTo(x, y - 14 - r() * 20);
      ctx.lineTo(x + (r() - 0.5) * 6, y + 4 + r() * 8);
      ctx.stroke();
    }
  }
  return c;
}

// Fango bagnato: ritorna [colore, rugosita'] (pozzanghere lucide)
function map_jungle_paintMud(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  const c2 = map_jungle_cv(S);
  const ctx2 = c2.getContext('2d');
  ctx.fillStyle = '#6c5742';
  ctx.fillRect(0, 0, S, S);
  ctx2.fillStyle = '#d8d8d8';
  ctx2.fillRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 70, '82,64,48', 0.55);
  for (let i = 0; i < 40; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 20 + r() * 60, '132,110,80', 0.45);
  for (let i = 0; i < 20; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 26 + r() * 50, '88,104,64', 0.3);
  map_jungle_speckle(ctx, r, S, 2600, ['#544234', '#94805e', '#7a6a50'], 1.5, 5, 0.3);
  for (let i = 0; i < 9; i++) {
    const x = 70 + r() * (S - 140);
    const y = 70 + r() * (S - 140);
    const rx = 22 + r() * 36;
    const ry = 14 + r() * 24;
    const a = r() * 3.14;
    ctx.fillStyle = 'rgba(70,56,44,0.7)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx + 7, ry + 7, a, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = 'rgba(104,122,112,0.92)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, a, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,184,172,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.2, y - ry * 0.2, rx * 0.5, ry * 0.4, a, 0, 6.283);
    ctx.fill();
    ctx2.fillStyle = '#262626';
    ctx2.beginPath();
    ctx2.ellipse(x, y, rx, ry, a, 0, 6.283);
    ctx2.fill();
  }
  for (let i = 0; i < 210; i++) {
    const cols = ['#8a7a3e', '#6f8a44', '#9a6a3c', '#a89250'];
    ctx.fillStyle = cols[(r() * 4) | 0];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(r() * S, r() * S, 5 + r() * 6, 2.5 + r() * 2.5, r() * 6.28, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return [c, c2];
}

function map_jungle_paintWater(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3f7c74';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 34; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 40 + r() * 80, '44,98,94', 0.55);
  for (let i = 0; i < 30; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 60, '74,146,126', 0.45);
  for (let i = 0; i < 16; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 50, '96,128,84', 0.3);
  ctx.lineCap = 'round';
  for (let i = 0; i < 280; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 10 + r() * 34;
    const a = r() * 6.28;
    ctx.strokeStyle = 'rgba(176,218,204,' + (0.18 + r() * 0.26) + ')';
    ctx.lineWidth = 1 + r() * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, rad, a, a + 0.5 + r() * 1.1);
    ctx.stroke();
  }
  map_jungle_speckle(ctx, r, S, 380, ['#c4e0d4', '#a8d0c4'], 1, 3, 0.45);
  return c;
}

// Facciata coloniale 6 m x 6 m (2 piani x 3 finestre) + mappa emissiva delle finestre accese
function map_jungle_paintFacade(r) {
  const S = 1024;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  const c2 = map_jungle_cv(S);
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = '#000000';
  ctx2.fillRect(0, 0, S, S);
  ctx.fillStyle = '#c9a25a';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 50 + r() * 110, '216,182,112', 0.4);
  for (let i = 0; i < 40; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 40 + r() * 100, '162,122,72', 0.35);
  for (let i = 0; i < 26; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 70, '112,134,82', 0.3);
  map_jungle_speckle(ctx, r, S, 4200, ['#a8844a', '#dcc080', '#b8945a'], 1.5, 5, 0.16);
  // Macchia di mattoni a vista dove l'intonaco e' caduto
  const bx = 380 + r() * 200;
  const by = 300 + r() * 100;
  ctx.fillStyle = '#7a4a3a';
  ctx.fillRect(bx, by, 130, 84);
  for (let ry = 0; ry < 6; ry++) {
    for (let rx = 0; rx < 5; rx++) {
      ctx.fillStyle = 'rgb(' + ((158 + r() * 30) | 0) + ',' + ((86 + r() * 20) | 0) + ',' + ((62 + r() * 16) | 0) + ')';
      ctx.fillRect(bx + rx * 26 + (ry % 2) * 13 - 6, by + ry * 14 + 1, 23, 11);
    }
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.28;
    map_jungle_blob(ctx, S, bx + 65 + Math.cos(a) * 78, by + 42 + Math.sin(a) * 54, 26 + r() * 14, '201,162,90', 0.95);
  }
  for (let row = 0; row < 2; row++) {
    const fy = row * 512;
    ctx.fillStyle = '#d9cba4';
    ctx.fillRect(0, fy + 486, S, 26);
    ctx.fillStyle = 'rgba(70,52,34,0.45)';
    ctx.fillRect(0, fy + 480, S, 6);
    for (let col = 0; col < 3; col++) {
      const cx = col * 341.33 + 170;
      const top = fy + 110;
      const w = 150;
      const h = 250;
      const kind = (r() * 4) | 0;
      const lit = (kind === 0 || kind === 3) && r() < 0.55;
      ctx.fillStyle = 'rgba(70,52,34,0.35)';
      ctx.fillRect(cx - w / 2 - 20, top - 20, w + 40, h + 40);
      ctx.fillStyle = '#ded2ae';
      ctx.fillRect(cx - w / 2 - 14, top - 14, w + 28, h + 28);
      const gg = ctx.createLinearGradient(0, top, 0, top + h);
      if (lit) {
        gg.addColorStop(0, '#e6c078');
        gg.addColorStop(1, '#c89850');
      } else {
        gg.addColorStop(0, '#a4c8d2');
        gg.addColorStop(1, '#4f7480');
      }
      ctx.fillStyle = gg;
      ctx.fillRect(cx - w / 2, top, w, h);
      if (lit) {
        ctx2.fillStyle = '#ffcf80';
        ctx2.fillRect(cx - w / 2, top, w, h);
      } else {
        ctx.fillStyle = 'rgba(226,236,230,0.25)';
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, top + h * 0.5);
        ctx.lineTo(cx + w / 2, top + h * 0.12);
        ctx.lineTo(cx + w / 2, top + h * 0.3);
        ctx.lineTo(cx - w / 2, top + h * 0.72);
        ctx.fill();
      }
      if (kind === 1) {
        ctx.fillStyle = '#4f7a5c';
        ctx.fillRect(cx - w / 2, top, w, h);
        ctx.fillStyle = 'rgba(44,70,52,0.7)';
        for (let ly = top + 6; ly < top + h; ly += 11) ctx.fillRect(cx - w / 2 + 5, ly, w - 10, 3);
        ctx2.fillStyle = '#000000';
        ctx2.fillRect(cx - w / 2, top, w, h);
      } else if (kind === 2) {
        ctx.fillStyle = '#b8a888';
        ctx.fillRect(cx - w / 2, top, w, h * 0.55);
        ctx.fillStyle = 'rgba(110,96,74,0.6)';
        for (let ly = top + 5; ly < top + h * 0.55; ly += 9) ctx.fillRect(cx - w / 2, ly, w, 2);
      } else if (kind === 3) {
        ctx.fillStyle = 'rgba(206,150,134,0.85)';
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, top);
        ctx.lineTo(cx + 10, top);
        ctx.quadraticCurveTo(cx - 30, top + h * 0.6, cx - w / 2, top + h);
        ctx.fill();
      }
      ctx.fillStyle = '#ded2ae';
      ctx.fillRect(cx - 4, top, 8, h);
      ctx.fillRect(cx - w / 2, top + h * 0.38, w, 8);
      ctx.fillStyle = '#d6c9a2';
      ctx.fillRect(cx - w / 2 - 26, top + h + 14, w + 52, 16);
      ctx.fillStyle = 'rgba(64,48,32,0.42)';
      ctx.fillRect(cx - w / 2 - 26, top + h + 30, w + 52, 6);
      for (let d = 0; d < 3; d++) {
        const sx = cx - w / 2 - 14 + r() * (w + 20);
        const sh = 70 + r() * 80;
        const sg = ctx.createLinearGradient(0, top + h + 34, 0, top + h + 34 + sh);
        sg.addColorStop(0, 'rgba(92,76,50,0.4)');
        sg.addColorStop(1, 'rgba(92,76,50,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(sx, top + h + 34, 8 + r() * 10, sh);
      }
    }
  }
  map_jungle_crack(ctx, r, S, 7, 'rgba(92,70,44,0.7)', 2);
  return [c, c2];
}

// Atlante insegne 2 colonne x 4 righe (celle 512x256)
function map_jungle_paintSigns(r) {
  const S = 1024;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  const defs = [
    ['ZONA 4', 'AREA MILITARE', '#5c6b44', '#ddd4b0', 0],
    ['CAMPO BASE', 'TIGRE', '#8a6844', '#e0d6b4', 1],
    ['PERICOLO', 'SCAVI IN CORSO', '#d6b23c', '#3e382c', 2],
    ['EMPORIO', 'DEL FIUME', '#3f7f78', '#e0d8b8', 0],
    ['LOCANDA', 'DEL GIAGUARO', '#b5633f', '#e2d8b6', 0],
    ['RADIO GIUNGLA', '88.5 FM', '#a34a38', '#e0d6b4', 0],
    ['TEMPIO ANTICO', '200 m', '#7e6242', '#e2d8b6', 3],
    ['VIETATO', "L'ACCESSO", '#dcd4b4', '#b04030', 0]
  ];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 8; i++) {
    const d = defs[i];
    const x = (i % 2) * 512;
    const y = (i >> 1) * 256;
    ctx.fillStyle = d[2];
    ctx.fillRect(x, y, 512, 256);
    if (d[4] === 1 || d[4] === 3) {
      for (let k = 0; k < 60; k++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(70,50,34,0.3)' : 'rgba(196,164,118,0.22)';
        ctx.fillRect(x, y + r() * 256, 512, 1 + r() * 2.5);
      }
      ctx.fillStyle = 'rgba(58,44,32,0.8)';
      ctx.fillRect(x, y + 84, 512, 3);
      ctx.fillRect(x, y + 170, 512, 3);
    }
    if (d[4] === 2) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 8, y + 8, 496, 30);
      ctx.rect(x + 8, y + 218, 496, 30);
      ctx.clip();
      ctx.fillStyle = '#3e382c';
      for (let k = -2; k < 20; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 40, y);
        ctx.lineTo(x + k * 40 + 20, y);
        ctx.lineTo(x + k * 40 + 276, y + 256);
        ctx.lineTo(x + k * 40 + 256, y + 256);
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.strokeStyle = d[3];
      ctx.lineWidth = 8;
      ctx.strokeRect(x + 16, y + 16, 480, 224);
    }
    ctx.fillStyle = 'rgba(46,40,32,0.4)';
    ctx.font = 'bold 84px Impact, Haettenschweiler, "Arial Black", sans-serif';
    ctx.fillText(d[0], x + 259, y + 97, 440);
    ctx.fillStyle = d[3];
    ctx.fillText(d[0], x + 256, y + 94, 440);
    ctx.font = 'bold 52px Impact, Haettenschweiler, "Arial Black", sans-serif';
    ctx.fillText(d[1], x + (d[4] === 3 ? 216 : 256), y + 178, 420);
    if (d[4] === 3) {
      ctx.beginPath();
      ctx.moveTo(x + 340, y + 166);
      ctx.lineTo(x + 420, y + 166);
      ctx.lineTo(x + 420, y + 148);
      ctx.lineTo(x + 466, y + 178);
      ctx.lineTo(x + 420, y + 208);
      ctx.lineTo(x + 420, y + 190);
      ctx.lineTo(x + 340, y + 190);
      ctx.fill();
    }
    for (let k = 0; k < 8; k++) {
      const bx = x + 30 + r() * 452;
      const by = y + 30 + r() * 196;
      const rad = 12 + r() * 30;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
      g.addColorStop(0, 'rgba(126,78,46,0.5)');
      g.addColorStop(1, 'rgba(126,78,46,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - rad, by - rad, rad * 2, rad * 2);
    }
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = '#50483c';
      ctx.beginPath();
      ctx.arc(x + (k % 2 ? 486 : 26), y + (k > 1 ? 230 : 26), 6, 0, 6.283);
      ctx.fill();
    }
  }
  map_jungle_speckle(ctx, r, S, 2600, ['#5a5040', '#cfc4a0'], 1, 4, 0.16);
  return c;
}

function map_jungle_paintCanvas(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#66704a';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 40 + r() * 80, '112,98,68', 0.42);
  for (let i = 0; i < 26; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 70, '82,94,62', 0.5);
  for (let i = 0; i < 20; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 20 + r() * 50, '128,136,94', 0.4);
  ctx.fillStyle = 'rgba(48,54,40,0.1)';
  for (let k = 0; k < S; k += 4) {
    ctx.fillRect(k, 0, 1, S);
    ctx.fillRect(0, k, S, 1);
  }
  for (const sx of [0, 256]) {
    ctx.fillStyle = 'rgba(58,64,44,0.75)';
    ctx.fillRect(sx + 2, 0, 4, S);
    ctx.fillStyle = 'rgba(174,176,132,0.7)';
    for (let y = 4; y < S; y += 16) ctx.fillRect(sx + 10, y, 2, 8);
  }
  map_jungle_speckle(ctx, r, S, 1800, ['#4e5840', '#8a906a'], 1, 3, 0.2);
  return c;
}

function map_jungle_paintParquet(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a3a2c';
  ctx.fillRect(0, 0, S, S);
  for (let row = 0; row < 8; row++) {
    const off = (row % 2) * 128 + ((row * 37) % 64);
    for (let k = -1; k < 3; k++) {
      const x = k * 256 + off;
      const t = r();
      const col = 'rgb(' + ((150 + t * 40) | 0) + ',' + ((106 + t * 30) | 0) + ',' + ((66 + t * 22) | 0) + ')';
      for (let o = -S; o <= S; o += S) {
        ctx.fillStyle = col;
        ctx.fillRect(x + o + 2, row * 64 + 2, 252, 60);
      }
    }
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(86,58,38,0.25)' : 'rgba(214,180,130,0.2)';
      ctx.fillRect(0, row * 64 + 4 + r() * 56, S, 1 + r() * 1.5);
    }
  }
  for (let i = 0; i < 14; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 40 + r() * 70, '196,166,124', 0.3);
  for (let i = 0; i < 12; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 16 + r() * 40, '84,62,44', 0.4);
  return c;
}

function map_jungle_paintPlaster(r) {
  const S = 512;
  const c = map_jungle_cv(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d8d2c0';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 34; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 40 + r() * 90, '176,166,146', 0.4);
  for (let i = 0; i < 24; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 30 + r() * 80, '226,222,206', 0.4);
  for (let i = 0; i < 20; i++) map_jungle_blob(ctx, S, r() * S, r() * S, 26 + r() * 60, '142,164,112', 0.35);
  for (let p = 0; p < 2; p++) {
    const bx = 60 + r() * 300;
    const by = 60 + r() * 330;
    ctx.fillStyle = '#806050';
    ctx.fillRect(bx, by, 104, 70);
    for (let ry = 0; ry < 5; ry++) {
      for (let rx = 0; rx < 4; rx++) {
        ctx.fillStyle = 'rgb(' + ((172 + r() * 30) | 0) + ',' + ((108 + r() * 22) | 0) + ',' + ((88 + r() * 18) | 0) + ')';
        ctx.fillRect(bx + rx * 26 + (ry % 2) * 13 - 6, by + ry * 14 + 1, 23, 11);
      }
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.28;
      map_jungle_blob(ctx, S, bx + 52 + Math.cos(a) * 64, by + 35 + Math.sin(a) * 46, 22 + r() * 12, '214,208,190', 0.95);
    }
  }
  map_jungle_speckle(ctx, r, S, 2600, ['#aaa08a', '#e2dcc8'], 1.5, 4, 0.18);
  map_jungle_crack(ctx, r, S, 7, 'rgba(110,100,84,0.75)', 1.6);
  return c;
}

MAPS.push({
  id: 'jungle',
  name: 'Tempio nella Giungla',
  size: 140,
  env: {
    sky: 'day',
    sunElev: 52,
    sunAzim: 128,
    sunColor: 0xffd9a0,
    sunIntensity: 4.4,
    hemiSky: 0xa9d4a4,
    hemiGround: 0x5a5f3c,
    hemiIntensity: 1.45,
    fogColor: 0x7f9c80,
    fogDensity: 0.009,
    exposure: 0.78,
    bloomThreshold: 1.7,
    bloomStrength: 0.38,
    rain: false,
    snow: false,
    dust: false
  },

  build(kit) {
    const T = kit.THREE;
    const rnd = () => kit.rng();
    const R = (a, b) => kit.rand(a, b);
    const NC = { collide: false };
    const NCS = { collide: false, cast: false };
    const PI = Math.PI;

    // =========================================================================
    // MATERIALI DEL KIT (pochi, riusati)
    // =========================================================================
    const grass = kit.mat('grass', { color: 0x5a7a40, roughness: 0.95, scale: 3 });
    const sand = kit.mat('sand', { color: 0xb09a70, roughness: 0.93, scale: 2 });
    const stoneTrim = kit.mat('concrete', { color: 0x9a927a, roughness: 0.9, scale: 1.8 });
    const cliff = kit.mat('rubble', { color: 0x6f7d58, roughness: 0.96, scale: 3 });
    const woodDark = kit.mat('wood_dark', { color: 0x5a4632, roughness: 0.93, scale: 1.4 });
    const metalGreen = kit.mat('metal_painted', { color: 0x5c6e48, roughness: 0.7, metalness: 0.35, scale: 1.2 });
    const metalDark = kit.mat('metal', { color: 0x50544e, roughness: 0.62, metalness: 0.55, scale: 1.2 });
    const rust = kit.mat('rust', { color: 0x8a5a3c, roughness: 0.9, metalness: 0.2, scale: 1.2 });
    const glass = kit.mat('glass', { color: 0x7fa39a, roughness: 0.25, metalness: 0.1, scale: 2 });
    const rubber = kit.mat('rubber', { color: 0x3a3c36, roughness: 0.94, scale: 1 });
    const sandbag = kit.mat('sandbag', { color: 0x978763, roughness: 0.95, scale: 1.1 });
    const jade = kit.mat('tile', { color: 0x4f9a78, roughness: 0.4, metalness: 0.15, scale: 1 });
    const corrugated = kit.mat('corrugated', { color: 0x7a8272, roughness: 0.78, metalness: 0.3, scale: 1.4 });
    const flagBlue = kit.mat('metal_painted', { color: 0x3f66b0, roughness: 0.8, metalness: 0.05, scale: 1.2 });
    const flagRed = kit.mat('metal_painted', { color: 0xb0443a, roughness: 0.8, metalness: 0.05, scale: 1.2 });
    const neonFire = kit.neon(0xff9a3c, 3.2);
    const neonJade = kit.neon(0x6fe0a0, 2.4);
    const neonWarm = kit.neon(0xffd08a, 2.0);

    // =========================================================================
    // 15 MATERIALI DIPINTI A CODICE
    // =========================================================================
    const mk = (tex, meters, o) => {
      const m = new T.MeshStandardMaterial(Object.assign({ map: tex, roughness: 0.9, metalness: 0 }, o || {}));
      m.userData.uvScale = 1 / meters;
      return m;
    };
    const tGlyph = map_jungle_tex(map_jungle_paintStone(rnd, true));
    const tBlocks = map_jungle_tex(map_jungle_paintStone(rnd, false));
    const tBark = map_jungle_tex(map_jungle_paintBark(rnd));
    const tLeaf = map_jungle_tex(map_jungle_paintLeaves(rnd), false);
    const tCanopy = map_jungle_tex(map_jungle_paintCanopy(rnd));
    const tPlank = map_jungle_tex(map_jungle_paintPlanks(rnd));
    const tThatch = map_jungle_tex(map_jungle_paintThatch(rnd));
    const mudPair = map_jungle_paintMud(rnd);
    const tMud = map_jungle_tex(mudPair[0]);
    const tMudR = map_jungle_tex(mudPair[1], true, false);
    const tWater = map_jungle_tex(map_jungle_paintWater(rnd));
    const facPair = map_jungle_paintFacade(rnd);
    const tFacade = map_jungle_tex(facPair[0]);
    const tFacadeE = map_jungle_tex(facPair[1]);
    const tSign = map_jungle_tex(map_jungle_paintSigns(rnd), false);
    const tCanvas = map_jungle_tex(map_jungle_paintCanvas(rnd));
    const tParquet = map_jungle_tex(map_jungle_paintParquet(rnd));
    const tPlaster = map_jungle_tex(map_jungle_paintPlaster(rnd));

    const mGlyph = mk(tGlyph, 4, { roughness: 0.92, bumpMap: tGlyph, bumpScale: 2.2 });
    const mBlocks = mk(tBlocks, 3, { roughness: 0.94, bumpMap: tBlocks, bumpScale: 2.0 });
    const mBark = mk(tBark, 2, { roughness: 0.95, bumpMap: tBark, bumpScale: 2.5 });
    const mLeaf = mk(tLeaf, 1, { roughness: 0.72, alphaTest: 0.4, side: T.DoubleSide });
    const mCanopy = mk(tCanopy, 2, { roughness: 0.85, bumpMap: tCanopy, bumpScale: 1.5 });
    const mPlank = mk(tPlank, 2, { roughness: 0.9, bumpMap: tPlank, bumpScale: 1.5 });
    const mThatch = mk(tThatch, 1.5, { roughness: 0.98, bumpMap: tThatch, bumpScale: 2.0 });
    const mMud = mk(tMud, 3, { roughness: 1.0, roughnessMap: tMudR });
    const mWater = mk(tWater, 6, { roughness: 0.1, metalness: 0.25, transparent: true, opacity: 0.86 });
    const mFacade = mk(tFacade, 6, { roughness: 0.86, emissive: 0xffffff, emissiveMap: tFacadeE, emissiveIntensity: 1.5 });
    const mSign = mk(tSign, 1, { roughness: 0.8, metalness: 0.05 });
    const mCanvas = mk(tCanvas, 2, { roughness: 0.94 });
    const mParquet = mk(tParquet, 2, { roughness: 0.78 });
    const mOchre = mk(tPlaster, 3, { roughness: 0.9, color: 0xdcae58, bumpMap: tPlaster, bumpScale: 1.0 });
    const mRose = mk(tPlaster, 3, { roughness: 0.9, color: 0xd69884, bumpMap: tPlaster, bumpScale: 1.0 });

    // =========================================================================
    // HELPER
    // =========================================================================
    const upVec = new T.Vector3(0, 1, 0);
    const M = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
      const q = new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz));
      return new T.Matrix4().compose(new T.Vector3(x, y, z), q, new T.Vector3(sx, sy, sz));
    };
    const seg = (ax, ay, az, bx, by, bz, radX, radZ) => {
      const d = new T.Vector3(bx - ax, by - ay, bz - az);
      const len = Math.max(0.001, d.length());
      const q = new T.Quaternion().setFromUnitVectors(upVec, d.normalize());
      return new T.Matrix4().compose(
        new T.Vector3((ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5),
        q,
        new T.Vector3(radX, len, radZ === undefined ? radX : radZ)
      );
    };
    const rp = (cx, cz, dx, dz, rot) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      return { x: cx + dx * c + dz * s, z: cz - dx * s + dz * c };
    };
    const scaleUV = (g, su, sv) => {
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      return g;
    };

    // Batch: geometrie custom unite in una sola mesh per materiale (1 draw call ciascuno)
    const batches = new Map();
    const addGeo = (mat, geo, m4) => {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) {
        if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      if (m4) g.applyMatrix4(m4);
      let arr = batches.get(mat);
      if (!arr) {
        arr = [];
        batches.set(mat, arr);
      }
      arr.push(g);
    };

    // Zone occupate (per non piantare vegetazione dentro le strutture)
    const blocked = [];
    const block = (minX, minZ, maxX, maxZ) => blocked.push([minX, minZ, maxX, maxZ]);
    const clear = (x, z, pad = 0) => {
      for (const b of blocked) {
        if (x > b[0] - pad && x < b[2] + pad && z > b[1] - pad && z < b[3] + pad) return false;
      }
      return true;
    };
    const inLane = (x, z) =>
      Math.abs(x - 32) < 3.6 ||
      Math.abs(x + 32) < 3.6 ||
      (Math.abs(x) < 3.6 && (z > 0 || z < -33)) ||
      Math.abs(z - 47) < 2.8 ||
      Math.abs(z - 26) < 2.8 ||
      Math.abs(z + 48) < 2.8 ||
      (Math.abs(z - 3) < 2.2 && Math.abs(x) > 4);
    const inRiver = (z) => z > 5.5 && z < 22.5;

    // Chiazza organica a terra (decal irregolare con UV in metri)
    let patchN = 0;
    const patch = (mat, x, z, w, d, y) => {
      const g = new T.CircleGeometry(1, 11);
      g.rotateX(-PI / 2);
      const p = g.attributes.position;
      const uv = g.attributes.uv;
      const s = mat.userData.uvScale || 0.4;
      const ou = R(0, 4);
      const ov = R(0, 4);
      const rot = R(0, 6.28);
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      const yy = y === undefined ? 0.025 + (patchN++ % 12) * 0.003 : y;
      let k1 = 1;
      for (let i = 0; i < p.count; i++) {
        let k = i === 0 ? 1 : R(0.72, 1.12);
        if (i === 1) k1 = k;
        if (i === p.count - 1) k = k1;
        const lx = p.getX(i) * k * w * 0.5;
        const lz = p.getZ(i) * k * d * 0.5;
        const wx = lx * c + lz * sn;
        const wz = -lx * sn + lz * c;
        p.setXYZ(i, x + wx, yy, z + wz);
        uv.setXY(i, wx * s + ou, wz * s + ov);
      }
      addGeo(mat, g, null);
    };

    // Insegna dall'atlante (cell 0..7), piano che guarda +Z ruotato di rotY
    const sign = (cell, x, y, z, w, h, rotY) => {
      const g = new T.PlaneGeometry(w, h);
      const uv = g.attributes.uv;
      const u0 = (cell % 2) * 0.5;
      const v0 = 1 - (cell >> 1) * 0.25 - 0.25;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * 0.5, v0 + uv.getY(i) * 0.25);
      addGeo(mSign, g, M(x, y, z, 1, 1, 1, 0, rotY, 0));
    };
    const signPost = (cell, x, z, rot) => {
      kit.cyl(x, 0, z, 0.08, 0.1, 2.3, woodDark, { collide: true, seg: 6 });
      kit.box(x, 1.25, z, 1.9, 0.95, 0.08, woodDark, { rotY: rot, collide: false });
      const nx = Math.sin(rot) * 0.05;
      const nz = Math.cos(rot) * 0.05;
      sign(cell, x + nx, 1.725, z + nz, 1.8, 0.9, rot);
      sign(cell, x - nx, 1.725, z - nz, 1.8, 0.9, rot + PI);
    };

    const cylGeo = new T.CylinderGeometry(1, 1, 1, 5, 1);
    const cable = (ax, ay, az, bx, by, bz, sag, mat, rad) => {
      const n = 6;
      let px = ax;
      let py = ay;
      let pz = az;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        const y = ay + (by - ay) * t - sag * 4 * t * (1 - t);
        addGeo(mat, cylGeo, seg(px, py, pz, x, y, z, rad, rad));
        px = x;
        py = y;
        pz = z;
      }
    };

    // =========================================================================
    // GEOMETRIE CONDIVISE
    // =========================================================================
    const makeRock = (jit, squash) => {
      const g = new T.IcosahedronGeometry(1, 1);
      const p = g.attributes.position;
      const offs = {};
      for (let i = 0; i < p.count; i++) {
        const vx = p.getX(i);
        const vy = p.getY(i);
        const vz = p.getZ(i);
        const key = Math.round(vx * 100) + '_' + Math.round(vy * 100) + '_' + Math.round(vz * 100);
        if (!offs[key]) offs[key] = [R(1 - jit, 1 + jit), R(1 - jit, 1 + jit) * squash, R(1 - jit, 1 + jit)];
        const o = offs[key];
        p.setXYZ(i, vx * o[0], Math.max(-0.45, vy * o[1]), vz * o[2]);
      }
      g.computeVertexNormals();
      return g;
    };
    const rockGeo = scaleUV(makeRock(0.28, 0.7), 2, 2);
    const canopyGeo = scaleUV(makeRock(0.2, 0.75), 3, 2);

    const trunkGeo = (() => {
      const g = new T.CylinderGeometry(0.42, 0.6, 1, 12, 8);
      g.translate(0, 0.5, 0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const ang = Math.atan2(z, x);
        const flare = 1 + 1.9 * Math.exp(-y * 14) * (0.65 + 0.35 * Math.cos(ang * 5));
        p.setXYZ(i, x * flare, y, z * flare);
      }
      g.computeVertexNormals();
      return scaleUV(g, 3, 6);
    })();
    const rootGeo = scaleUV(new T.CylinderGeometry(0.09, 0.28, 1, 6, 1), 1, 2);
    const palmTrunkGeo = (() => {
      const g = new T.CylinderGeometry(0.15, 0.3, 1, 7, 6);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = p.getY(i) + 0.5;
        p.setXYZ(i, p.getX(i) + Math.sin(t * PI * 0.85) * 0.22, t, p.getZ(i));
      }
      g.computeVertexNormals();
      return scaleUV(g, 1, 4);
    })();

    // Fronda su piano curvo con UV su una colonna dell'atlante foglie
    const frond = (col, len, wid, rise, droop, segs) => {
      const g = new T.PlaneGeometry(wid, 1, 1, segs);
      const p = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const t = p.getY(i) + 0.5;
        const u = uv.getX(i);
        p.setXYZ(i, p.getX(i), len * (rise * t - droop * t * t), len * t * 0.92);
        uv.setXY(i, col * 0.25 + 0.01 + u * 0.23, 0.01 + t * 0.98);
      }
      return g;
    };
    const cluster = (col, n, len, wid, rise, droop, segs) => {
      const parts = [];
      for (let i = 0; i < n; i++) {
        const k = R(0.75, 1.15);
        const g = frond(col, len * k, wid * k, rise * R(0.8, 1.2), droop * R(0.85, 1.15), segs);
        g.rotateY((i / n) * PI * 2 + R(-0.2, 0.2));
        parts.push(g);
      }
      const merged = mergeGeometries(parts, false);
      merged.computeVertexNormals();
      return merged;
    };
    const fernGeo = cluster(0, 8, 1.3, 0.55, 0.9, 0.75, 4);
    const palmCrownGeo = cluster(1, 11, 3.8, 1.25, 0.55, 0.85, 5);
    const bananaGeo = cluster(2, 6, 2.1, 0.9, 1.6, 1.0, 4);
    const lianaGeo = (() => {
      const parts = [];
      for (let k = 0; k < 2; k++) {
        const g = new T.PlaneGeometry(0.8, 1, 1, 1);
        g.translate(0, -0.5, 0);
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.76 + uv.getX(i) * 0.23, uv.getY(i));
        g.rotateY(k * PI * 0.5);
        parts.push(g);
      }
      return mergeGeometries(parts, false);
    })();

    const colGeo = (() => {
      const g = new T.CylinderGeometry(0.55, 0.62, 1, 10, 1);
      g.translate(0, 0.5, 0);
      return scaleUV(g, 0.9, 1);
    })();
    const drumGeo = scaleUV(new T.CylinderGeometry(0.56, 0.6, 1, 10, 1), 0.9, 0.5);
    const urnGeo = new T.LatheGeometry(
      [
        new T.Vector2(0.01, 0),
        new T.Vector2(0.42, 0),
        new T.Vector2(0.38, 0.18),
        new T.Vector2(0.22, 0.45),
        new T.Vector2(0.48, 0.78),
        new T.Vector2(0.54, 1.02),
        new T.Vector2(0.4, 1.08),
        new T.Vector2(0.32, 0.92),
        new T.Vector2(0.01, 0.9)
      ],
      10
    );
    const archGeo = (() => {
      const sh = new T.Shape();
      sh.moveTo(-3.4, 0);
      sh.lineTo(-3.4, 3.9);
      sh.lineTo(-2.8, 5.0);
      sh.lineTo(2.8, 5.0);
      sh.lineTo(3.4, 3.9);
      sh.lineTo(3.4, 0);
      sh.lineTo(1.9, 0);
      sh.lineTo(1.9, 2.4);
      sh.lineTo(0.7, 3.9);
      sh.lineTo(-0.7, 3.9);
      sh.lineTo(-1.9, 2.4);
      sh.lineTo(-1.9, 0);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false });
      g.translate(0, 0, -0.65);
      return scaleUV(g, 0.25, 0.25);
    })();
    const serpentGeo = (() => {
      const sh = new T.Shape();
      sh.moveTo(0, 0);
      sh.lineTo(1.45, 0);
      sh.lineTo(1.55, 0.35);
      sh.lineTo(1.1, 0.42);
      sh.lineTo(1.1, 0.62);
      sh.lineTo(1.5, 0.72);
      sh.lineTo(1.32, 1.18);
      sh.lineTo(0.65, 1.38);
      sh.lineTo(0, 1.22);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 0.72, bevelEnabled: false });
      g.translate(-0.75, 0, -0.36);
      return scaleUV(g, 0.33, 0.33);
    })();
    const tentGeo = (() => {
      const sh = new T.Shape();
      sh.moveTo(-2.5, 0);
      sh.lineTo(0, 2.6);
      sh.lineTo(2.5, 0);
      sh.lineTo(2.36, 0);
      sh.lineTo(0, 2.45);
      sh.lineTo(-2.36, 0);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 6.5, bevelEnabled: false });
      g.translate(0, 0, -3.25);
      return scaleUV(g, 0.5, 0.5);
    })();
    const hutRoofGeo = (() => {
      const g = new T.ConeGeometry(5.4, 2.6, 4, 3);
      g.rotateY(PI / 4);
      g.translate(0, 1.3, 0);
      g.scale(1, 1, 0.88);
      g.computeVertexNormals();
      return scaleUV(g, 5, 2.5);
    })();
    const hoodGeo = (len, hRear, hFront, width) => {
      const sh = new T.Shape();
      sh.moveTo(0, 0);
      sh.lineTo(len, 0);
      sh.lineTo(len, hFront);
      sh.lineTo(0.15, hRear);
      sh.lineTo(0, hRear);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: width, bevelEnabled: false });
      g.translate(-len * 0.5, 0, -width * 0.5);
      return g;
    };
    const jeepHoodGeo = hoodGeo(1.45, 0.52, 0.34, 1.88);
    const truckHoodGeo = hoodGeo(1.75, 0.72, 0.48, 2.25);
    const tireGeo = new T.TorusGeometry(0.36, 0.15, 8, 14);
    const ringGeo = new T.TorusGeometry(0.85, 0.2, 8, 14);
    const barrelGeo = new T.CylinderGeometry(0.31, 0.31, 0.92, 10, 1);
    const sandbagGeo = new T.BoxGeometry(0.76, 0.26, 0.44);
    const bambooGeo = new T.CylinderGeometry(0.065, 0.075, 1, 6, 1);

    // Matrici per kit.instanced
    const trunkM = [];
    const rootM = [];
    const canopyM = [];
    const palmTrunkM = [];
    const palmCrownM = [];
    const fernM = [];
    const bananaM = [];
    const lianaM = [];
    const rockM = [];
    const barrelM = [];
    const tireM = [];
    const urnM = [];
    const sandbagM = [];
    const bambooM = [];

    const urn = (x, y, z, s, fire) => {
      urnM.push(M(x, y, z, s, s, s, 0, R(0, 3), 0));
      if (fire) kit.box(x, y + 0.95 * s, z, 0.36 * s, 0.26 * s, 0.36 * s, neonFire, NC);
    };

    const sandbags = (x, z, count, layers, rotY, curved) => {
      const spacing = 0.72;
      for (let row = 0; row < layers; row++) {
        const n = Math.max(1, count - (row % 2));
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) * 0.5) * spacing;
          const cz = curved ? Math.abs(off) * 0.18 : 0;
          const p = rp(x, z, off, cz, rotY);
          sandbagM.push(
            M(p.x, 0.13 + row * 0.23, p.z, R(0.94, 1.08), R(0.92, 1.08), R(0.95, 1.1), R(-0.03, 0.03), rotY + R(-0.08, 0.08), R(-0.03, 0.03))
          );
        }
      }
      const tw = count * spacing * 0.52;
      const c = Math.abs(Math.cos(rotY));
      const s = Math.abs(Math.sin(rotY));
      const ex = tw * c + 0.35 * s;
      const ez = tw * s + 0.35 * c;
      kit.collider(x - ex, 0, z - ez, x + ex, layers * 0.25, z + ez);
    };

    // Colonna maya (intera o spezzata)
    const column = (x, z, h, capital) => {
      addGeo(mGlyph, colGeo, M(x, 0, z, 1, h, 1, R(-0.02, 0.02), R(0, 6), R(-0.02, 0.02)));
      kit.box(x, 0, z, 1.5, 0.3, 1.5, mBlocks, { rotY: R(-0.05, 0.05) });
      if (capital) kit.box(x, h, z, 1.45, 0.38, 1.45, mBlocks, { rotY: R(-0.05, 0.05), collide: false });
      kit.collider(x - 0.6, 0, z - 0.6, x + 0.6, h, z + 0.6);
      block(x - 1, z - 1, x + 1, z + 1);
    };
    const fallenDrum = (x, z) => {
      const a = R(0, 6.28);
      const len = R(1.6, 3.2);
      const ex = x + Math.cos(a) * len;
      const ez = z + Math.sin(a) * len;
      addGeo(mGlyph, drumGeo, seg(x, 0.52, z, ex, R(0.5, 0.9), ez, 1, 1));
      const mx = (x + ex) * 0.5;
      const mz = (z + ez) * 0.5;
      const hx = Math.abs(ex - x) * 0.5 + 0.45;
      const hz = Math.abs(ez - z) * 0.5 + 0.45;
      kit.collider(mx - hx, 0, mz - hz, mx + hx, 1.05, mz + hz);
      block(mx - hx, mz - hz, mx + hx, mz + hz);
    };
    const arch = (x, z, rot, s) => {
      addGeo(mGlyph, archGeo, M(x, 0, z, s, s, s, 0, rot, 0));
      const alongX = Math.abs(Math.cos(rot)) > 0.5;
      if (alongX) {
        kit.collider(x - 3.4 * s, 0, z - 0.65 * s, x - 1.9 * s, 3.9 * s, z + 0.65 * s);
        kit.collider(x + 1.9 * s, 0, z - 0.65 * s, x + 3.4 * s, 3.9 * s, z + 0.65 * s);
        block(x - 3.5 * s, z - 1, x - 1.8 * s, z + 1);
        block(x + 1.8 * s, z - 1, x + 3.5 * s, z + 1);
      } else {
        kit.collider(x - 0.65 * s, 0, z - 3.4 * s, x + 0.65 * s, 3.9 * s, z - 1.9 * s);
        kit.collider(x - 0.65 * s, 0, z + 1.9 * s, x + 0.65 * s, 3.9 * s, z + 3.4 * s);
        block(x - 1, z - 3.5 * s, x + 1, z - 1.8 * s);
        block(x - 1, z + 1.8 * s, x + 1, z + 3.5 * s);
      }
      for (let i = 0; i < 3; i++) {
        const o = R(-2.4, 2.4) * s;
        lianaM.push(M(x + (alongX ? o : 0.7 * s), 5 * s, z + (alongX ? 0.7 * s : o), 1, R(1.6, 3.4), 1, 0, R(0, 3), 0));
      }
    };

    // =========================================================================
    // 1. TERRENO, SENTIERI DI FANGO, CHIAZZE
    // =========================================================================
    kit.ground(grass);

    for (const lx of [-32, 0, 32]) {
      for (let z = -63; z <= 63; z += 4.4) {
        if (inRiver(z)) continue;
        if (lx === 0 && z > -34 && z < 2) continue;
        patch(mMud, lx + R(-1, 1), z, R(6, 8.4), R(5.6, 7.4));
      }
    }
    for (const cz of [47, 26, 3, -48]) {
      for (let x = -44; x <= 44; x += 4.8) patch(mMud, x, cz + R(-0.8, 0.8), R(5.6, 7.2), R(4.4, 5.8));
    }
    for (const sx of [-21, 21]) {
      for (let z = -34; z <= 2; z += 4.6) patch(mMud, sx + R(-0.8, 0.8), z, R(5, 6.6), R(5, 6.4));
    }
    for (let i = 0; i < 80; i++) {
      const x = R(-64, 64);
      const z = R(-64, 64);
      if (inRiver(z)) continue;
      patch(mMud, x, z, R(2, 6), R(2, 5));
    }
    for (let i = 0; i < 46; i++) {
      const x = R(-62, 62);
      const z = R(-62, 62);
      if (inRiver(z)) continue;
      kit.decal(x, z, R(1.8, 5.5), R(1.4, 4.6), R(-0.8, 0.8), i % 2 ? sand : cliff);
    }

    // =========================================================================
    // 2. FIUME GUADABILE, ARGINI, CASCATA, PONTI
    // =========================================================================
    const RZ = 14;
    kit.decal(0, RZ, 138, 15.4, 0, sand);
    kit.box(0, 0, RZ, 137.6, 0.16, 14.6, mWater, NCS);
    for (let x = -66; x <= 66; x += 6) {
      for (const bz of [6.3, 21.7]) {
        kit.box(x + R(-0.5, 0.5), 0, bz + R(-0.4, 0.4), 6.8, R(0.22, 0.34), R(2, 2.8), mMud, { rotY: R(-0.05, 0.05), cast: false });
      }
    }
    for (let i = 0; i < 46; i++) {
      const x = R(-62, 58);
      const z = RZ + R(-6.4, 6.4);
      if (Math.abs(x + 32) < 3.4 || Math.abs(x) < 4.4 || Math.abs(x - 32) < 3.4) continue;
      const s = R(0.5, 1.5);
      rockM.push(M(x, s * 0.25, z, s * 1.2, s * 0.7, s, 0, R(0, 3), 0));
      if (s > 1.15) kit.collider(x - s * 0.7, 0, z - s * 0.6, x + s * 0.7, s * 0.7, z + s * 0.6);
    }
    // Guado di pietre e tronco caduto
    for (let i = 0; i < 8; i++) {
      kit.box(16.5 + Math.sin(i * 0.9) * 0.8, 0, 6.8 + i * 2.05, 1.9, 0.3, 1.5, mBlocks, { rotY: R(-0.25, 0.25) });
    }
    addGeo(mBark, drumGeo, seg(-17, 0.5, 5.5, -14.5, 0.75, 22.5, 1.35, 1.35));
    kit.collider(-17.4, 0, 5.5, -14.2, 1.3, 22.5);
    block(-18, 5, -13.6, 23);

    // Cascata a gradoni sulla parete est
    kit.box(66, 0, RZ, 6, 23, 24, cliff);
    kit.box(62.6, 0, RZ - 7.2, 4.6, 16, 6, cliff, { rotY: 0.08 });
    kit.box(62.6, 0, RZ + 7.2, 4.6, 17, 6, cliff, { rotY: -0.08 });
    for (let s = 0; s < 6; s++) {
      kit.box(60.4 + s * 0.6, s * 3.2, RZ, 2.2, 3.3, 7.4 - s * 0.35, mWater, NCS);
      rockM.push(M(60 + s * 0.6, s * 3.2 + 3.1, RZ + (s % 2 ? 3.6 : -3.6), 1.2, 0.8, 1.1, 0, s, 0));
    }
    block(58.5, RZ - 11, 70, RZ + 11);
    // Portale di scolo a ovest
    kit.box(-66.4, 0, RZ, 4, 10, 20, mBlocks);
    addGeo(mGlyph, archGeo, M(-64.2, 0, RZ, 2.1, 1.5, 1, 0, PI / 2, 0));
    block(-70, RZ - 11, -62, RZ + 11);

    // Ponti sospesi laterali
    const suspension = (bx) => {
      const z0 = 4.5;
      const z1 = 23.5;
      kit.box(bx, 0.3, RZ, 3.6, 0.2, 19, mPlank);
      kit.box(bx - 1.55, 0.14, RZ, 0.3, 0.2, 19, woodDark, NC);
      kit.box(bx + 1.55, 0.14, RZ, 0.3, 0.2, 19, woodDark, NC);
      for (const sx of [-1.75, 1.75]) {
        kit.collider(bx + sx - 0.1, 0.5, z0, bx + sx + 0.1, 1.5, z1);
        kit.box(bx + sx, 1.36, RZ, 0.07, 0.07, 19, mThatch, NC);
        kit.box(bx + sx, 0.95, RZ, 0.06, 0.06, 19, mThatch, NC);
        for (let z = z0 + 1.2; z < z1 - 0.5; z += 2.4) {
          const t = (z - z0) / (z1 - z0);
          const cy = 4.5 - 2.6 * 4 * t * (1 - t);
          kit.box(bx + sx, 0.5, z, 0.1, 0.9, 0.1, woodDark, NC);
          kit.box(bx + sx, 1.4, z, 0.05, Math.max(0.1, cy - 1.4), 0.05, mThatch, NCS);
        }
        cable(bx + sx, 4.5, z0 + 0.4, bx + sx, 4.5, z1 - 0.4, 2.6, mThatch, 0.05);
        for (const ez of [z0 + 0.4, z1 - 0.4]) {
          kit.box(bx + sx * 1.2, 0, ez, 0.34, 4.6, 0.34, woodDark);
          kit.box(bx + sx * 1.2, 4.6, ez, 0.5, 0.22, 0.5, mThatch, NC);
        }
      }
      for (const ez of [z0 + 0.4, z1 - 0.4]) {
        kit.box(bx, 4.15, ez, 4.8, 0.26, 0.3, woodDark, NC);
        kit.box(bx, 3.78, ez, 0.3, 0.36, 0.3, neonFire, NC);
        lianaM.push(M(bx + 1.4, 4.1, ez, 1, 2.2, 1, 0, 1, 0));
      }
      block(bx - 2.6, z0 - 0.5, bx + 2.6, z1 + 0.5);
      kit.nav(bx, 0.55, 6);
      kit.nav(bx, 0.55, 14);
      kit.nav(bx, 0.55, 22);
    };
    suspension(-32);
    suspension(32);

    // Ponte antico maya centrale
    kit.box(0, 0, RZ, 5.6, 0.5, 19.6, mBlocks);
    for (const sx of [-2.55, 2.55]) {
      kit.box(sx, 0.5, RZ, 0.5, 0.9, 19.6, mGlyph);
      for (const pz of [4.6, 9.3, 14, 18.7, 23.4]) {
        kit.box(sx, 0, pz, 0.8, 1.7, 0.8, mBlocks);
      }
      urn(sx, 1.7, 4.6, 0.7, true);
      urn(sx, 1.7, 23.4, 0.7, true);
    }
    arch(0, 3.5, 0, 1);
    arch(0, 24.5, 0, 1);
    block(-3.2, 3, 3.2, 25);
    kit.nav(0, 0.55, 6);
    kit.nav(0, 0.55, 14);
    kit.nav(0, 0.55, 22);
    kit.nav(16.5, 0.35, 14);

    // =========================================================================
    // 3. CONFINI: PARETI DI ROCCIA, PALAZZI COLONIALI CON FACCIATE, TORRI MAYA
    // =========================================================================
    kit.box(-69.5, 0, 0, 1, 24, 140, cliff);
    kit.box(69.5, 0, 0, 1, 24, 140, cliff);
    kit.box(0, 0, -69.5, 140, 24, 1, cliff);
    kit.box(0, 0, 69.5, 140, 24, 1, cliff);
    for (let i = 0; i < 19; i++) {
      const pc = -64 + i * 7.1;
      kit.box(pc, 0, -67.4, R(5.5, 9), R(12, 24), R(2.4, 4), cliff, { rotY: R(-0.05, 0.05) });
      kit.box(pc, 0, 67.4, R(5.5, 9), R(12, 23), R(2.4, 4), cliff, { rotY: R(-0.05, 0.05) });
      if (Math.abs(pc - RZ) > 11) {
        kit.box(67.4, 0, pc, R(2.4, 4), R(12, 24), R(5.5, 9), cliff, { rotY: R(-0.05, 0.05) });
        kit.box(-67.4, 0, pc, R(2.4, 4), R(12, 24), R(5.5, 9), cliff, { rotY: R(-0.05, 0.05) });
      }
      rockM.push(M(pc + R(-2, 2), 1.2, -64.6, R(2, 3.4), R(2, 3.6), R(1.6, 2.4), 0, R(0, 3), 0));
      rockM.push(M(pc + R(-2, 2), 1.2, 64.6, R(2, 3.4), R(2, 3.6), R(1.6, 2.4), 0, R(0, 3), 0));
    }

    const facade = (x, z, w, d, h, cell, nx, nz) => {
      kit.box(x, 0, z, w, h, d, mFacade);
      kit.box(x, 0, z, w + 0.4, 0.7, d + 0.4, stoneTrim, NC);
      kit.box(x, h, z, w + 0.7, 0.4, d + 0.7, stoneTrim, NC);
      kit.box(x, h + 0.4, z, w + 0.3, 0.5, d + 0.3, mRose, NC);
      const fx = x + nx * (d * 0.5);
      const fz = z + nz * (w * 0.5);
      const px = nx ? x + nx * (w * 0.5) : x;
      const pz = nz ? z + nz * (d * 0.5) : z;
      const rot = Math.atan2(nx, nz);
      const span = nx ? d : w;
      for (const by of [3, 9]) {
        if (by + 2 > h) continue;
        const bx = px + nx * 0.6;
        const bz = pz + nz * 0.6;
        kit.box(bx, by - 0.15, bz, nx ? 1.2 : span * 0.5, 0.15, nx ? span * 0.5 : 1.2, stoneTrim, NC);
        kit.box(px + nx * 1.15, by, pz + nz * 1.15, nx ? 0.06 : span * 0.5, 0.95, nx ? span * 0.5 : 0.06, metalDark, NCS);
      }
      sign(cell, px + nx * 0.06, h - 2.2, pz + nz * 0.06, 5.2, 2.6, rot);
      kit.box(px + nx * 0.1, h - 3.75, pz + nz * 0.1, nx ? 0.08 : 5.2, 0.12, nx ? 5.2 : 0.08, neonWarm, NC);
      kit.cyl(x - (nx ? 0 : w * 0.3), h + 0.9, z - (nz ? 0 : d * 0.3), 0.9, 0.9, 1.8, corrugated, { collide: false, seg: 10 });
      kit.cyl(x + (nx ? 0 : w * 0.3), h + 0.9, z + (nz ? 0 : d * 0.3), 0.05, 0.08, 5, metalDark, { collide: false, seg: 5 });
      for (let i = 0; i < 5; i++) {
        const o = R(-span * 0.45, span * 0.45);
        lianaM.push(M(px + nx * 0.4 + (nz ? o : 0), h, pz + nz * 0.4 + (nx ? o : 0), 1.3, R(4, 9), 1.3, 0, R(0, 3), 0));
      }
      block(x - w * 0.5 - 1, z - d * 0.5 - 1, x + w * 0.5 + 1, z + d * 0.5 + 1);
      void fx;
      void fz;
    };
    facade(-54, 65.8, 18, 5.6, 18, 5, 0, -1);
    facade(54, 65.8, 18, 5.6, 21, 4, 0, -1);
    facade(-54, -65.8, 18, 5.6, 21, 7, 0, 1);
    facade(54, -65.8, 18, 5.6, 18, 3, 0, 1);
    facade(-66, -8, 5.6, 14, 24, 0, 1, 0);
    facade(-66, 36, 5.6, 14, 18, 1, 1, 0);

    const mayaTower = (x, z, w, d, h) => {
      kit.box(x, 0, z, w, h * 0.45, d, mBlocks);
      kit.box(x, h * 0.45, z, w * 0.78, h * 0.35, d * 0.78, mGlyph);
      kit.box(x, h * 0.8, z, w * 0.54, h * 0.25, d * 0.54, mBlocks);
      kit.box(x, h * 1.05, z, w * 0.3, 3.2, d * 0.3, mGlyph, NC);
      kit.box(x, h * 0.6, z, w * 0.8, 0.5, d * 0.8, neonFire, NC);
      kit.box(x, h * 0.9, z, w * 0.56, 0.4, d * 0.56, neonJade, NC);
      for (let i = 0; i < 4; i++) {
        lianaM.push(M(x - w * 0.5 - 0.3, h * 0.45, z + R(-d * 0.4, d * 0.4), 1.4, R(4, 8), 1.4, 0, R(0, 3), 0));
      }
      block(x - w * 0.5 - 1, z - d * 0.5 - 1, x + w * 0.5 + 1, z + d * 0.5 + 1);
    };
    mayaTower(65.5, -44, 6.5, 12, 26);
    mayaTower(65.5, 40, 6.5, 12, 23);
    mayaTower(-65.5, -40, 6.5, 12, 22);
    mayaTower(22, 66, 12, 6, 22);
    mayaTower(-22, -66, 12, 6, 24);

    // =========================================================================
    // 4. PIRAMIDE A GRADONI (PUNTO EROE) CON SANTUARIO E CRESTA
    // =========================================================================
    const PZ = -16;
    const tiers = [
      [34.0, 32.0, mBlocks],
      [28.5, 26.5, mGlyph],
      [23.0, 21.0, mBlocks],
      [17.5, 15.5, mGlyph],
      [12.4, 10.8, mBlocks]
    ];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const ty = i * 1.15;
      const th = i === 4 ? 1.1 : 1.15;
      kit.box(0, ty, PZ, t[0], th, t[1], t[2]);
      kit.box(0, ty + th - 0.2, PZ, t[0] + 0.36, 0.2, t[1] + 0.36, stoneTrim, NC);
      const top = ty + th;
      for (let k = 0; k < 9; k++) {
        const side = k % 4;
        const hw = t[0] * 0.5 - 0.9;
        const hd = t[1] * 0.5 - 0.9;
        let x = side < 2 ? R(-hw, hw) : side === 2 ? -hw : hw;
        let z = side < 2 ? (side === 0 ? -hd : hd) : R(-hd, hd);
        if (Math.abs(x) < 3.6 || (Math.abs(z) < 2.8 && i < 3)) continue;
        patch(mMud, x, PZ + z, R(1.6, 3), R(1.2, 2), top + 0.02);
        fernM.push(M(x, top, PZ + z, R(0.8, 1.3), R(0.8, 1.3), R(0.8, 1.3), 0, R(0, 6), 0));
        if (k % 2 === 0 && i > 0) {
          const ox = side === 2 ? -t[0] * 0.5 - 0.25 : side === 3 ? t[0] * 0.5 + 0.25 : x;
          const oz = side === 0 ? -t[1] * 0.5 - 0.25 : side === 1 ? t[1] * 0.5 + 0.25 : z;
          lianaM.push(M(ox, top, PZ + oz, 1, R(1.4, 2.6), 1, 0, R(0, 3), 0));
        }
      }
      kit.nav(0, top + 0.1, PZ + t[1] * 0.5 - 1);
      kit.nav(0, top + 0.1, PZ - t[1] * 0.5 + 1);
    }
    const alfarda = (x, zTop, zBot, yTop) => {
      const l = Math.abs(zBot - zTop) / 3;
      for (let k = 0; k < 3; k++) {
        const zc = zTop + ((zBot - zTop) * (k + 0.5)) / 3;
        kit.box(x, 0, zc, 0.62, yTop * (1 - (k + 0.35) / 3) + 0.55, l, mGlyph);
      }
    };
    // Scalinate sud e nord fino in cima, est e ovest fino al terzo gradone
    kit.stairs(0, 0, PZ + 11.15, 5.4, 5.7, 11.5, 0, mBlocks);
    kit.stairs(0, 0, PZ - 11.15, 5.4, 5.7, 11.5, PI, mBlocks);
    for (const sx of [-3.05, 3.05]) {
      alfarda(sx, PZ + 5.4, PZ + 16.9, 5.7);
      alfarda(sx, PZ - 5.4, PZ - 16.9, 5.7);
      addGeo(mBlocks, serpentGeo, M(sx, 0, PZ + 17.9, 1.2, 1.2, 1.2, 0, -PI / 2, 0));
      kit.collider(sx - 0.5, 0, PZ + 16.9, sx + 0.5, 1.5, PZ + 18.9);
      addGeo(mBlocks, serpentGeo, M(sx, 0, PZ - 17.9, 1.2, 1.2, 1.2, 0, PI / 2, 0));
      kit.collider(sx - 0.5, 0, PZ - 18.9, sx + 0.5, 1.5, PZ - 16.9);
    }
    kit.stairs(-15.3, 0, PZ, 4.2, 3.45, 7.6, -PI / 2, mBlocks);
    kit.stairs(15.3, 0, PZ, 4.2, 3.45, 7.6, PI / 2, mBlocks);
    for (const sx of [-1, 1]) {
      for (const sz of [-2.45, 2.45]) {
        kit.box(sx * 15.3, 0, PZ + sz, 7.6, 1.9, 0.6, mGlyph);
      }
    }
    // Santuario in cima (y = 5.70)
    const TY = 5.7;
    for (const sx of [-4.5, 4.5]) {
      kit.box(sx, TY, PZ, 0.9, 3.2, 6.2, mGlyph);
      for (const sz of [-3.5, 3.5]) kit.box(sx, TY, PZ + sz, 1.3, 3.2, 1.3, mBlocks);
    }
    kit.box(0, TY + 3.2, PZ, 10.6, 0.7, 9.0, mBlocks);
    kit.box(0, TY + 3.9, PZ, 8.6, 0.7, 7.0, mGlyph);
    kit.box(0, TY + 4.6, PZ, 6.4, 2.4, 1.3, mGlyph);
    kit.box(0, TY + 7.0, PZ, 4.6, 2.0, 1.0, mBlocks);
    kit.box(0, TY + 9.0, PZ, 2.8, 1.4, 0.8, mGlyph);
    kit.box(0, TY + 10.4, PZ, 1.2, 0.9, 0.6, jade);
    for (const sx of [-2, 0, 2]) kit.box(sx, TY + 5.4, PZ, 0.9, 0.9, 1.36, neonJade, NC);
    kit.box(0, TY + 7.6, PZ, 1.2, 0.7, 1.06, neonFire, NC);
    kit.box(0, TY, PZ, 2.2, 0.9, 1.4, mGlyph);
    kit.box(0, TY + 0.9, PZ, 1.5, 0.2, 1.0, jade, NC);
    kit.box(0, TY + 1.1, PZ, 0.5, 0.6, 0.4, neonFire, NC);
    for (const sx of [-5.4, 5.4]) {
      for (const sz of [-4.6, 4.6]) urn(sx, TY, PZ + sz, 0.85, true);
    }
    for (const sx of [-15.6, 15.6]) {
      for (const sz of [-14.6, 14.6]) urn(sx, 1.15, PZ + sz, 0.9, true);
    }
    for (let i = 0; i < 8; i++) lianaM.push(M(R(-5, 5), TY + 3.2, PZ + (i % 2 ? 4.6 : -4.6), 1, R(1.2, 2.4), 1, 0, R(0, 3), 0));
    block(-20.5, PZ - 19.5, 20.5, PZ + 19.5);
    kit.nav(0, TY + 0.1, PZ + 3);
    kit.nav(0, TY + 0.1, PZ - 3);
    kit.nav(-12.5, 3.55, PZ);
    kit.nav(12.5, 3.55, PZ);
    kit.nav(-20, 0.1, PZ);
    kit.nav(20, 0.1, PZ);

    // Sferisterio a nord con anelli di pietra
    for (const sx of [-9.5, 9.5]) {
      const s = sx < 0 ? 1 : -1;
      kit.box(sx, 0, -43, 2.4, 3.6, 11, mBlocks);
      kit.box(sx + s * 1.9, 0, -43, 1.5, 1.2, 11, mGlyph);
      addGeo(mBlocks, ringGeo, M(sx + s * 1.5, 2.9, -43, 1, 1, 1, 0, 0, 0));
      urn(sx, 3.6, -38.4, 0.8, true);
      urn(sx, 3.6, -47.6, 0.8, true);
      block(sx - 2.6, -49, sx + 2.6, -37);
    }
    for (const c of [[-16, -37, 4.4, 1], [16, -37, 2.1, 0], [-16, -43, 1.6, 0], [16, -43, 4.6, 1], [-16, -49, 4.2, 1], [16, -49, 3.9, 1]]) {
      column(c[0], c[1], c[2], c[3] === 1);
    }
    arch(-22, -40, PI / 2, 1);
    arch(22, -8, PI / 2, 1);
    arch(-22, -16, PI / 2, 1);

    // Piazza delle rovine a sud: colonnato, stele, idolo di giada, testa colossale
    for (const c of [[-7, 29, 4.6, 1], [7, 29, 2.2, 0], [-7, 34, 1.5, 0], [7, 34, 4.4, 1], [-7, 39, 4.5, 1], [7, 39, 4.6, 1], [-7, 44, 2.6, 0], [7, 44, 1.2, 0]]) {
      column(c[0], c[1], c[2], c[3] === 1);
    }
    kit.box(-7, 4.9, 39, 1.2, 0.5, 6.4, mBlocks, NC);
    kit.box(7, 4.9, 41.5, 1.2, 0.5, 6.4, mBlocks, NC);
    kit.box(0, 0, 36, 4.2, 0.5, 4.2, mBlocks);
    kit.box(0, 0, 36, 4.2, 0.5, 4.2, mBlocks, { rotY: PI / 4, collide: false });
    kit.box(0, 0.5, 36, 1.6, 1.6, 1.6, mGlyph);
    addGeo(mBlocks, serpentGeo, M(0, 2.1, 36, 1.3, 1.3, 1.3, 0, PI / 2, 0));
    kit.box(0, 2.6, 36.0, 0.5, 0.4, 0.98, neonJade, NC);
    urn(-2.6, 0, 33.6, 0.9, true);
    urn(2.6, 0, 38.4, 0.9, true);
    block(-3.4, 32.6, 3.4, 39.4);
    for (const d of [[-4, 31], [5, 42], [-11, 36], [11, 31], [3, 46], [-13, 43], [12, -33], [-12, -34], [20, 2], [-19, -2]]) fallenDrum(d[0], d[1]);
    // Testa colossale di pietra
    addGeo(mBlocks, rockGeo, M(-20, 1.2, 36, 2.1, 3.0, 2.0, 0, 0.4, 0.08));
    kit.box(-20, 2.0, 37.9, 2.6, 0.4, 0.5, mGlyph, { rotY: 0.1, collide: false });
    kit.box(-20, 1.2, 38.0, 0.7, 0.9, 0.6, mBlocks, { rotY: 0.1, collide: false });
    kit.box(-20, 0.6, 37.9, 1.5, 0.3, 0.5, mGlyph, { rotY: 0.1, collide: false });
    kit.collider(-22, 0, 34.1, -18, 3.2, 38);
    block(-22.5, 33.5, -17.5, 38.6);
    arch(-14, 26, 0, 1);
    arch(14, 26, 0, 1);

    // =========================================================================
    // 5. OTTO EDIFICI ENTRABILI: DECORAZIONE ESTERNA E ARREDO
    // =========================================================================
    const doorPos = (b, dr) => {
      const at = dr.at || 0;
      if (dr.side === 'n') return { x: b.x + at, z: b.z - b.d * 0.5, nx: 0, nz: -1 };
      if (dr.side === 's') return { x: b.x + at, z: b.z + b.d * 0.5, nx: 0, nz: 1 };
      if (dr.side === 'e') return { x: b.x + b.w * 0.5, z: b.z + at, nx: 1, nz: 0 };
      return { x: b.x - b.w * 0.5, z: b.z + at, nx: -1, nz: 0 };
    };

    const decorate = (b) => {
      const H = b.floors * b.floorH;
      const hw = b.w * 0.5;
      const hd = b.d * 0.5;
      const trim = b.wood ? woodDark : stoneTrim;
      const band = (y, out, bh) => {
        kit.box(b.x, y, b.z - hd - out * 0.5, b.w + out * 2, bh, out, trim, NC);
        kit.box(b.x, y, b.z + hd + out * 0.5, b.w + out * 2, bh, out, trim, NC);
        kit.box(b.x - hw - out * 0.5, y, b.z, out, bh, b.d, trim, NC);
        kit.box(b.x + hw + out * 0.5, y, b.z, out, bh, b.d, trim, NC);
      };
      for (let f = 1; f < b.floors; f++) band(f * b.floorH - 0.1, 0.1, 0.2);
      band(H - 0.12, 0.22, 0.26);
      for (const sx of [-hw, hw]) {
        for (const sz of [-hd, hd]) kit.box(b.x + sx, 0, b.z + sz, 0.42, H + 0.2, 0.42, trim, NC);
      }
      kit.cyl(b.x - hw - 0.14, 0, b.z - hd + 0.6, 0.06, 0.06, H, metalDark, { collide: false, seg: 6 });
      kit.cyl(b.x + hw + 0.14, 0, b.z + hd - 0.6, 0.06, 0.06, H, rust, { collide: false, seg: 6 });
      for (let i = 0; i < b.doors.length; i++) {
        const dr = b.doors[i];
        const p = doorPos(b, dr);
        const dw = dr.width || 1.6;
        const ax = p.nz !== 0;
        const fx = p.x + p.nx * 0.12;
        const fz = p.z + p.nz * 0.12;
        for (const s of [-1, 1]) {
          kit.box(fx + (ax ? s * (dw * 0.5 + 0.12) : 0), 0, fz + (ax ? 0 : s * (dw * 0.5 + 0.12)), 0.24, 2.45, 0.24, trim, NC);
        }
        kit.box(fx, 2.4, fz, ax ? dw + 0.6 : 0.3, 0.22, ax ? 0.3 : dw + 0.6, trim, NC);
        kit.box(p.x + p.nx * 0.65, 2.62, p.z + p.nz * 0.65, ax ? dw + 1 : 1.3, 0.08, ax ? 1.3 : dw + 1, b.wood ? mThatch : mCanvas, NC);
        kit.box(p.x + p.nx * 0.3 + (ax ? dw * 0.5 + 0.5 : 0), 2.0, p.z + p.nz * 0.3 + (ax ? 0 : dw * 0.5 + 0.5), 0.16, 0.24, 0.16, neonWarm, NC);
        if (i === 0) sign(b.cell, p.x + p.nx * 0.08, 3.25, p.z + p.nz * 0.08, 2.4, 1.2, Math.atan2(p.nx, p.nz));
        patch(mMud, p.x + p.nx * 1.6, p.z + p.nz * 1.6, 3, 2.4);
      }
      // Unita' tecniche, casse e liane sui muri
      kit.box(b.x + hw + 0.26, 2.0, b.z - hd * 0.5, 0.5, 0.6, 0.8, corrugated, NC);
      kit.box(b.x - hw - 0.2, b.floorH + 1.6, b.z + hd * 0.4, 0.38, 0.55, 0.7, rust, NC);
      for (let i = 0; i < 7; i++) {
        const side = (rnd() * 4) | 0;
        const o = side < 2 ? R(-hw + 0.5, hw - 0.5) : R(-hd + 0.5, hd - 0.5);
        const lx = side === 0 ? b.x + o : side === 1 ? b.x + o : side === 2 ? b.x - hw - 0.35 : b.x + hw + 0.35;
        const lz = side === 0 ? b.z - hd - 0.35 : side === 1 ? b.z + hd + 0.35 : b.z + o;
        lianaM.push(M(lx, H, lz, 1.2, R(2.5, H - 0.4), 1.2, 0, R(0, 3), 0));
      }
      // Tetto: cisterna, antenna, casse oppure pergola di paglia
      if (b.wood) {
        addGeo(mThatch, hutRoofGeo, M(b.x, H + 2.3, b.z, (b.w + 1.6) / 7.64, 0.8, (b.d + 1.6) / 6.72, 0, 0, 0));
        for (const sx of [-hw + 0.3, hw - 0.3]) {
          for (const sz of [-hd + 0.3, hd - 0.3]) kit.box(b.x + sx, H, b.z + sz, 0.2, 2.35, 0.2, woodDark, NC);
        }
        kit.box(b.x, H + 2.0, b.z, 0.22, 0.26, 0.22, neonWarm, NC);
      } else {
        kit.box(b.x - hw * 0.5, H, b.z - hd * 0.45, 1.5, 0.5, 1.5, metalDark, NC);
        kit.cyl(b.x - hw * 0.5, H + 0.5, b.z - hd * 0.45, 0.7, 0.7, 1.6, corrugated, { collide: true, seg: 10 });
        kit.cyl(b.x + hw * 0.55, H, b.z + hd * 0.5, 0.05, 0.08, 4.4, metalDark, { collide: false, seg: 6 });
        kit.box(b.x + hw * 0.55, H + 3.5, b.z + hd * 0.5, 1.3, 0.05, 0.05, metalDark, NCS);
        kit.box(b.x + hw * 0.55, H + 4.4, b.z + hd * 0.5, 0.14, 0.14, 0.14, neonFire, NC);
        kit.box(b.x + hw * 0.3, H, b.z - hd * 0.5, 1.0, 0.8, 1.0, mPlank, NC);
      }
      sandbags(b.x + (b.x < 0 ? hw - 2 : -hw + 2), b.z, 1, 1, 0, false);
    };

    const goods = [sandbag, metalGreen, rust, jade, mCanvas, sand];
    const furnish = (b) => {
      const hw = b.w * 0.5 - 0.3;
      const hd = b.d * 0.5 - 0.3;
      const styles = {
        hq: ['desk', 'board', 'locker', 'bunk', 'crates', 'shelf'],
        barracks: ['bunk', 'locker', 'bunk', 'crates', 'desk'],
        radio: ['desk', 'shelf', 'desk', 'board', 'crates'],
        lab: ['shelf', 'table', 'crates', 'board', 'altar'],
        inn: ['counter', 'bed', 'sacks', 'shelf', 'bed', 'table'],
        shop: ['shelf', 'counter', 'sacks', 'shelf', 'crates'],
        shaman: ['altar', 'bed', 'sacks', 'shelf', 'table']
      };
      const list = styles[b.style];
      let idx = 0;
      for (let f = 0; f < b.floors; f++) {
        const fy = f * b.floorH + 0.02;
        kit.box(b.x, fy + b.floorH - 0.5, b.z, 0.2, 0.24, 0.2, neonWarm, NC);
        for (const side of ['n', 's', 'w', 'e']) {
          const ns = side === 'n' || side === 's';
          const half = (ns ? hw : hd) - 1.7;
          for (let a0 = -half; a0 <= half + 0.01; a0 += 2.75) {
            idx++;
            if (f === 0) {
              let near = false;
              for (const dr of b.doors) {
                if (dr.side === side && Math.abs((dr.at || 0) - a0) < (dr.width || 1.6) * 0.5 + 1.5) near = true;
              }
              if (near) continue;
            }
            const sl = {
              x: ns ? b.x + a0 : side === 'w' ? b.x - hw : b.x + hw,
              z: ns ? (side === 'n' ? b.z - hd : b.z + hd) : b.z + a0,
              ax: ns ? 1 : 0,
              az: ns ? 0 : 1,
              ix: ns ? 0 : side === 'w' ? 1 : -1,
              iz: ns ? (side === 'n' ? 1 : -1) : 0
            };
            const ib = (a, y, i, la, h, li, mat) => {
              kit.box(sl.x + sl.ax * a + sl.ix * i, fy + y, sl.z + sl.az * a + sl.iz * i, ns ? la : li, h, ns ? li : la, mat, NC);
            };
            const wp = (a, i) => ({ x: sl.x + sl.ax * a + sl.ix * i, z: sl.z + sl.az * a + sl.iz * i });
            const item = list[(idx + f * 2) % list.length];
            if (item === 'desk' || item === 'table') {
              ib(0, 0.74, 0.55, 1.7, 0.08, 0.8, mPlank);
              for (const la of [-0.75, 0.75]) {
                for (const li of [0.22, 0.88]) ib(la, 0, li, 0.09, 0.74, 0.09, woodDark);
              }
              if (item === 'desk') {
                ib(-0.4, 0.82, 0.4, 0.55, 0.34, 0.36, metalGreen);
                ib(-0.4, 0.9, 0.59, 0.34, 0.16, 0.03, neonJade);
                ib(0.4, 0.82, 0.6, 0.7, 0.02, 0.5, sand);
              } else {
                ib(-0.4, 0.82, 0.5, 0.3, 0.3, 0.3, jade);
                ib(0.2, 0.82, 0.6, 0.5, 0.12, 0.4, mGlyph);
                ib(0.6, 0.82, 0.35, 0.16, 0.22, 0.16, neonWarm);
              }
              ib(0, 0.42, 1.3, 0.45, 0.06, 0.45, woodDark);
              ib(0, 0.48, 1.52, 0.45, 0.5, 0.06, woodDark);
              ib(0, 0, 1.3, 0.3, 0.42, 0.3, woodDark);
            } else if (item === 'shelf') {
              ib(0, 0, 0.06, 2.0, 2.0, 0.06, woodDark);
              ib(-1.0, 0, 0.28, 0.06, 2.0, 0.45, woodDark);
              ib(1.0, 0, 0.28, 0.06, 2.0, 0.45, woodDark);
              for (let k = 0; k < 4; k++) {
                ib(0, 0.1 + k * 0.6, 0.28, 2.0, 0.06, 0.45, mPlank);
                for (let g = -1; g <= 1; g++) {
                  if (rnd() < 0.2) continue;
                  ib(g * 0.62 + R(-0.08, 0.08), 0.16 + k * 0.6, 0.28, R(0.3, 0.5), R(0.2, 0.42), 0.34, goods[(rnd() * goods.length) | 0]);
                }
              }
            } else if (item === 'bunk') {
              for (const la of [-0.95, 0.95]) {
                for (const li of [0.1, 0.9]) ib(la, 0, li, 0.08, 1.8, 0.08, metalDark);
              }
              ib(0, 0.4, 0.5, 2.0, 0.14, 0.9, mCanvas);
              ib(0, 1.35, 0.5, 2.0, 0.14, 0.9, mCanvas);
              ib(0.75, 0.54, 0.5, 0.4, 0.1, 0.6, sand);
              ib(0.75, 1.49, 0.5, 0.4, 0.1, 0.6, sand);
              ib(-0.3, 0, 1.25, 0.8, 0.36, 0.4, metalGreen);
            } else if (item === 'bed') {
              ib(0, 0.2, 0.55, 2.0, 0.2, 1.0, woodDark);
              ib(0, 0.4, 0.55, 1.9, 0.12, 0.9, sand);
              ib(-0.4, 0.52, 0.55, 1.1, 0.03, 0.92, mCanvas);
              ib(0.75, 0.52, 0.55, 0.36, 0.1, 0.6, mThatch);
              ib(1.25, 0, 0.3, 0.4, 0.5, 0.4, woodDark);
              ib(1.25, 0.5, 0.3, 0.14, 0.2, 0.14, neonWarm);
              ib(0, 0, 1.5, 1.6, 0.03, 0.9, mThatch);
            } else if (item === 'crates') {
              ib(-0.5, 0, 0.6, 1.0, 0.9, 1.0, mPlank);
              ib(0.55, 0, 0.5, 0.8, 0.6, 0.8, metalGreen);
              ib(-0.45, 0.9, 0.6, 0.7, 0.6, 0.7, woodDark);
              ib(0.55, 0.6, 0.5, 0.5, 0.3, 0.5, mCanvas);
            } else if (item === 'locker') {
              for (let k = -1; k <= 1; k++) {
                ib(k * 0.65, 0, 0.3, 0.6, 1.9, 0.5, k === 0 ? corrugated : metalGreen);
                ib(k * 0.65, 1.5, 0.56, 0.36, 0.14, 0.02, metalDark);
              }
            } else if (item === 'counter') {
              ib(0, 0, 1.5, 2.3, 1.05, 0.55, mPlank);
              ib(0, 1.05, 1.5, 2.5, 0.06, 0.7, woodDark);
              ib(0, 1.2, 0.2, 2.2, 0.06, 0.3, woodDark);
              ib(0, 1.75, 0.2, 2.2, 0.06, 0.3, woodDark);
              for (let k = 0; k < 6; k++) {
                ib(-0.9 + k * 0.36, k % 2 ? 1.26 : 1.81, 0.2, 0.12, R(0.22, 0.34), 0.12, k % 3 === 0 ? neonWarm : k % 3 === 1 ? jade : rust);
              }
              ib(-0.6, 0, 2.3, 0.34, 0.62, 0.34, woodDark);
              ib(0.6, 0, 2.3, 0.34, 0.62, 0.34, woodDark);
              ib(0.7, 1.11, 1.5, 0.3, 0.2, 0.3, mGlyph);
            } else if (item === 'sacks') {
              for (let k = 0; k < 6; k++) {
                const p = wp(R(-0.7, 0.7), R(0.35, 0.9));
                sandbagM.push(M(p.x, fy + 0.13 + (k > 2 ? 0.24 : 0), p.z, 1, 1, 1, 0, R(0, 3), 0));
              }
              const pb = wp(1.0, 0.45);
              barrelM.push(M(pb.x, fy + 0.46, pb.z, 1, 1, 1, 0, 0, 0));
            } else if (item === 'altar') {
              ib(0, 0, 0.5, 1.5, 0.85, 0.8, mGlyph);
              ib(0, 0.85, 0.5, 0.9, 0.18, 0.5, jade);
              ib(0, 1.03, 0.5, 0.25, 0.3, 0.25, neonFire);
              for (const la of [-1.1, 1.1]) {
                const p = wp(la, 0.45);
                urnM.push(M(p.x, fy, p.z, 0.6, 0.6, 0.6, 0, 0, 0));
              }
            } else if (item === 'board') {
              const p = wp(0, 0.04);
              sign([0, 2, 6, 7][idx % 4], p.x, fy + 1.6, p.z, 1.6, 0.8, Math.atan2(sl.ix, sl.iz));
              ib(0, 0, 0.35, 1.6, 0.42, 0.4, woodDark);
              ib(0.5, 0.42, 0.35, 0.36, 0.26, 0.3, metalGreen);
            }
          }
        }
      }
    };

    const buildingDefs = [
      { x: 0, z: 60, w: 22, d: 9, floors: 2, mat: mOchre, inner: mRose, floor: mParquet, wood: false, style: 'hq', cell: 1, ruined: 0,
        doors: [{ side: 'n', at: 0, width: 3 }, { side: 'n', at: -7.5, width: 2 }, { side: 'n', at: 7.5, width: 2 }, { side: 'w', at: 0, width: 1.8 }, { side: 'e', at: 0, width: 1.8 }] },
      { x: 0, z: -60, w: 22, d: 9, floors: 2, mat: mRose, inner: mOchre, floor: mParquet, wood: false, style: 'hq', cell: 0, ruined: 0,
        doors: [{ side: 's', at: 0, width: 3 }, { side: 's', at: -7.5, width: 2 }, { side: 's', at: 7.5, width: 2 }, { side: 'w', at: 0, width: 1.8 }, { side: 'e', at: 0, width: 1.8 }] },
      { x: -48, z: 36, w: 12, d: 11, floors: 2, mat: mOchre, inner: mPlank, floor: mParquet, wood: false, style: 'barracks', cell: 1, ruined: 0.04,
        doors: [{ side: 'e', at: 0, width: 1.9 }, { side: 'n', at: 2.2, width: 1.6 }, { side: 's', at: -2.2, width: 1.6 }] },
      { x: -48, z: -6, w: 12, d: 12, floors: 3, mat: mRose, inner: mOchre, floor: mParquet, wood: false, style: 'radio', cell: 5, ruined: 0.05,
        doors: [{ side: 'e', at: 0, width: 2 }, { side: 's', at: -2.2, width: 1.6 }, { side: 'n', at: 2.2, width: 1.6 }] },
      { x: -48, z: -38, w: 12, d: 11, floors: 2, mat: mBlocks, inner: mOchre, floor: mParquet, wood: false, style: 'lab', cell: 2, ruined: 0.08,
        doors: [{ side: 'e', at: 0, width: 1.9 }, { side: 's', at: -2.2, width: 1.6 }, { side: 'n', at: 2.2, width: 1.6 }] },
      { x: 48, z: 36, w: 12, d: 11, floors: 2, mat: mPlank, inner: mPlank, floor: mParquet, wood: true, style: 'inn', cell: 4, ruined: 0.03,
        doors: [{ side: 'w', at: 0, width: 1.9 }, { side: 'n', at: -2.2, width: 1.6 }, { side: 's', at: 2.2, width: 1.6 }] },
      { x: 48, z: -6, w: 12, d: 12, floors: 3, mat: mPlank, inner: mPlank, floor: mParquet, wood: true, style: 'shop', cell: 3, ruined: 0.04,
        doors: [{ side: 'w', at: 0, width: 2 }, { side: 's', at: 2.2, width: 1.6 }, { side: 'n', at: -2.2, width: 1.6 }] },
      { x: 48, z: -38, w: 12, d: 11, floors: 2, mat: mPlank, inner: mBlocks, floor: mParquet, wood: true, style: 'shaman', cell: 6, ruined: 0.06,
        doors: [{ side: 'w', at: 0, width: 1.9 }, { side: 's', at: 2.2, width: 1.6 }, { side: 'n', at: -2.2, width: 1.6 }] }
    ];
    for (const b of buildingDefs) {
      b.floorH = 3.3;
      kit.building({
        x: b.x,
        z: b.z,
        w: b.w,
        d: b.d,
        floors: b.floors,
        floorH: b.floorH,
        wall: 0.3,
        mat: b.mat,
        innerMat: b.inner,
        floorMat: b.floor,
        doors: b.doors,
        windows: true,
        roof: b.wood ? 'flat' : 'parapet',
        ruined: b.ruined
      });
      decorate(b);
      furnish(b);
      block(b.x - b.w * 0.5 - 1.2, b.z - b.d * 0.5 - 1.2, b.x + b.w * 0.5 + 1.2, b.z + b.d * 0.5 + 1.2);
    }
    for (let i = 0; i < 8; i++) {
      const sx = -8.75 + i * 2.5;
      kit.spawn('blue', sx, 60 + (i % 2 ? 1.2 : -1.2));
      kit.spawn('red', sx, -60 + (i % 2 ? -1.2 : 1.2));
    }
    // Bandiere di squadra davanti ai quartier generali
    for (const f of [[12.5, 54.6, flagBlue], [-12.5, 54.6, flagBlue], [12.5, -54.6, flagRed], [-12.5, -54.6, flagRed]]) {
      kit.cyl(f[0], 0, f[1], 0.05, 0.07, 6.5, metalDark, { collide: true, seg: 6 });
      kit.box(f[0] + 0.8, 5.2, f[1], 1.5, 1.0, 0.04, f[2], NC);
      kit.box(f[0], 0, f[1], 0.7, 0.3, 0.7, stoneTrim, NC);
    }

    // =========================================================================
    // 6. VILLAGGIO DI PALAFITTE A EST, PONTILE, CANOE
    // =========================================================================
    const hut = (x, z, dir) => {
      const dy = 1.8;
      const L = (dx, dz) => ({ x: x + dx, z: z + dz * dir });
      for (const dx of [-2.9, 0, 2.9]) {
        for (const dz of [-2.5, 2.5]) {
          const p = L(dx, dz);
          kit.box(p.x, 0, p.z, 0.3, dy, 0.3, woodDark);
        }
      }
      kit.box(x, dy - 0.22, z, 6.4, 0.22, 5.6, mPlank);
      let p = L(0, -2.65);
      kit.box(p.x, dy, p.z, 6.1, 2.4, 0.18, mPlank);
      for (const sx of [-3.05, 3.05]) {
        kit.box(x + sx, dy, z, 0.18, 0.95, 5.3, mPlank);
        kit.box(x + sx, dy + 2.0, z, 0.18, 0.4, 5.3, mPlank);
        for (const dz of [-2.4, 0, 2.4]) {
          p = L(0, dz);
          kit.box(x + sx, dy + 0.95, p.z, 0.18, 1.05, 0.4, woodDark);
        }
      }
      for (const dx of [-2.0, 2.0]) {
        p = L(dx, 2.65);
        kit.box(p.x, dy, p.z, 2.1, 2.4, 0.18, mPlank);
      }
      p = L(0, 2.65);
      kit.box(p.x, dy + 2.05, p.z, 1.9, 0.35, 0.18, woodDark);
      addGeo(mThatch, hutRoofGeo, M(x, dy + 2.4, z, 1, 1, 1, 0, 0, 0));
      p = L(0, 4.6);
      kit.stairs(p.x, 0, p.z, 1.8, dy, 3.6, dir > 0 ? 0 : PI, mPlank);
      // Arredo: stuoia, tavolo basso, ceste, amaca, lanterna
      kit.box(x, dy + 0.01, z, 3.4, 0.03, 2.4, mThatch, NC);
      p = L(-1.9, -1.6);
      kit.box(p.x, dy, p.z, 1.6, 0.5, 0.9, woodDark, NC);
      kit.box(p.x, dy + 0.5, p.z, 0.3, 0.22, 0.3, jade, NC);
      p = L(1.9, -1.7);
      kit.box(p.x, dy + 0.7, p.z, 2.0, 0.06, 0.8, mCanvas, NC);
      p = L(2.3, 1.6);
      barrelM.push(M(p.x, dy + 0.46, p.z, 1, 1, 1, 0, 0, 0));
      kit.box(x, dy + 2.1, z, 0.22, 0.26, 0.22, neonWarm, NC);
      // Sotto la palafitta
      p = L(-1.5, 0);
      kit.box(p.x, 0, p.z, 1.1, 0.8, 1.1, mPlank);
      p = L(1.4, -0.8);
      sandbagM.push(M(p.x, 0.13, p.z, 1, 1, 1, 0, 0.4, 0));
      sandbagM.push(M(p.x + 0.5, 0.13, p.z + 0.3, 1, 1, 1, 0, 1.2, 0));
      lianaM.push(M(x - 3.4, dy + 2.4, z + 2.9 * dir, 1, 2.6, 1, 0, 0.5, 0));
      lianaM.push(M(x + 3.4, dy + 2.4, z - 2.9 * dir, 1, 3.2, 1, 0, 1.5, 0));
      block(x - 4, z - 3.6, x + 4, z + 3.6);
      p = L(0, 4.6);
      block(p.x - 1.3, p.z - 2.2, p.x + 1.3, p.z + 2.2);
      kit.nav(x, dy + 0.1, z);
      p = L(0, 7);
      kit.nav(p.x, 0.1, p.z);
    };
    hut(59.5, 27, 1);
    hut(59.5, 0, -1);
    hut(59.5, -25, 1);
    hut(59.5, 52, -1);
    // Pontile da pesca e canoe
    kit.box(59.5, 1.6, 19.4, 2.4, 0.2, 9.6, mPlank);
    for (const pz of [15.2, 18.4, 21.6]) {
      kit.box(58.5, 0, pz, 0.24, 1.6, 0.24, woodDark);
      kit.box(60.5, 0, pz, 0.24, 1.6, 0.24, woodDark);
    }
    kit.box(59.5, 1.8, 14.8, 0.2, 1.0, 0.2, woodDark, NC);
    kit.box(59.5, 2.8, 14.8, 0.26, 0.3, 0.26, neonFire, NC);
    kit.nav(59.5, 1.9, 17);
    for (const c of [[55.5, 12, 0.2, mPlank], [52.6, 17.5, -0.3, woodDark], [-50, 10.5, 1.3, mPlank]]) {
      kit.box(c[0], 0.06, c[1], 0.9, 0.36, 4.2, c[3], { rotY: c[2] });
      kit.box(c[0], 0.42, c[1], 0.9, 0.05, 0.3, woodDark, { rotY: c[2], collide: false });
    }
    // Torce di bambu' e recinto del villaggio
    for (const t of [[54.6, 24], [54.6, 44.5], [55, -3], [54.8, -20], [55, 6.2], [55, 22]]) {
      kit.cyl(t[0], 0, t[1], 0.05, 0.07, 2.2, woodDark, { collide: false, seg: 5 });
      kit.box(t[0], 2.2, t[1], 0.16, 0.24, 0.16, neonFire, NC);
    }
    const bambooWall = (x, z, n, alongX) => {
      for (let i = 0; i < n; i++) {
        const o = (i - n * 0.5) * 0.36;
        const h = R(1.8, 2.6);
        bambooM.push(M(x + (alongX ? o : R(-0.05, 0.05)), h * 0.5, z + (alongX ? R(-0.05, 0.05) : o), 1, h, 1, R(-0.04, 0.04), 0, R(-0.04, 0.04)));
      }
      const l = n * 0.36;
      kit.box(x, 1.3, z, alongX ? l : 0.1, 0.1, alongX ? 0.1 : l, woodDark, NC);
      kit.collider(x - (alongX ? l * 0.5 : 0.15), 0, z - (alongX ? 0.15 : l * 0.5), x + (alongX ? l * 0.5 : 0.15), 2.0, z + (alongX ? 0.15 : l * 0.5));
    };
    bambooWall(40, 44.5, 14, true);
    bambooWall(38.5, -15.5, 12, false);
    bambooWall(40, -46, 14, true);
    bambooWall(54.8, 38, 10, false);
    bambooWall(-38.5, 30, 12, false);
    bambooWall(-40, -46.5, 14, true);

    // =========================================================================
    // 7. VECCHIO CAMPO MILITARE A OVEST: TENDE, FALO', TORRI, RADIO, VEICOLI
    // =========================================================================
    const tent = (x, z) => {
      kit.box(x, 0, z, 4.6, 0.12, 6.5, mPlank);
      addGeo(mCanvas, tentGeo, M(x, 0.12, z, 1, 1, 1, 0, 0, 0));
      kit.collider(x - 2.5, 0, z - 3.25, x - 1.85, 1.1, z + 3.25);
      kit.collider(x + 1.85, 0, z - 3.25, x + 2.5, 1.1, z + 3.25);
      kit.box(x, 0.12, z - 3.2, 0.1, 2.5, 0.1, woodDark, NC);
      kit.box(x, 0.12, z + 3.2, 0.1, 2.5, 0.1, woodDark, NC);
      kit.box(x - 1.0, 0.42, z - 1.2, 0.8, 0.1, 2.0, mCanvas, NC);
      kit.box(x - 1.0, 0.12, z - 1.2, 0.7, 0.3, 1.9, woodDark, NC);
      kit.box(x + 1.0, 0.42, z + 1.0, 0.8, 0.1, 2.0, mCanvas, NC);
      kit.box(x + 1.0, 0.12, z + 1.0, 0.7, 0.3, 1.9, woodDark, NC);
      kit.box(x + 1.1, 0.12, z - 2.2, 0.7, 0.5, 0.6, metalGreen, NC);
      kit.box(x, 2.25, z, 0.16, 0.2, 0.16, neonWarm, NC);
      kit.box(x + 3.1, 0, z - 1.2, 1.1, 0.85, 1.1, mPlank, { rotY: R(-0.2, 0.2) });
      barrelM.push(M(x + 3.1, 0.46, z + 0.9, 1, 1, 1, 0, 0, 0));
      kit.collider(x + 2.8, 0, z + 0.6, x + 3.4, 0.92, z + 1.2);
      for (const s of [-1, 1]) {
        cable(x + s * 2.5, 0.12, z - 2.6, x + s * 3.3, 0.02, z - 3.6, 0, mThatch, 0.02);
        cable(x + s * 2.5, 0.12, z + 2.6, x + s * 3.3, 0.02, z + 3.6, 0, mThatch, 0.02);
      }
      block(x - 3.2, z - 3.8, x + 3.9, z + 3.8);
    };
    for (const t of [[-46, 52], [-57, 52], [-47, -23.5], [-58, -23.5], [-46, -54], [-57, -54], [-59, 25]]) tent(t[0], t[1]);

    // Falo' del campo
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.28;
      rockM.push(M(-52 + Math.cos(a) * 0.9, 0.12, 45.6 + Math.sin(a) * 0.9, 0.28, 0.24, 0.26, 0, a, 0));
    }
    kit.box(-52, 0.05, 45.6, 1.1, 0.16, 0.2, woodDark, { rotY: 0.5, collide: false });
    kit.box(-52, 0.05, 45.6, 1.1, 0.16, 0.2, woodDark, { rotY: -0.7, collide: false });
    kit.box(-52, 0.2, 45.6, 0.4, 0.45, 0.4, neonFire, NC);
    kit.box(-50.2, 0, 45.2, 0.5, 0.4, 1.6, mBark, { rotY: 0.2 });
    kit.box(-53.6, 0, 46.4, 0.5, 0.4, 1.6, mBark, { rotY: -0.3 });
    block(-54.5, 43.6, -49.4, 47.6);

    const tower = (tx, tz) => {
      for (const sx of [-1.7, 1.7]) {
        for (const sz of [-1.7, 1.7]) kit.box(tx + sx, 0, tz + sz, 0.28, 6.3, 0.28, woodDark);
      }
      kit.box(tx, 3.8, tz, 4.2, 0.24, 4.2, mPlank);
      kit.box(tx, 4.04, tz - 1.95, 4.1, 1.0, 0.16, mPlank);
      kit.box(tx, 4.04, tz + 1.95, 4.1, 1.0, 0.16, mPlank);
      kit.box(tx - 1.95, 4.04, tz, 0.16, 1.0, 3.8, mPlank);
      kit.box(tx + 1.95, 4.04, tz + 1.1, 0.16, 1.0, 1.6, mPlank);
      addGeo(mThatch, hutRoofGeo, M(tx, 6.3, tz, 0.72, 0.7, 0.8, 0, 0, 0));
      kit.stairs(tx + 3.2, 0, tz - 0.8, 1.4, 3.8, 4.4, PI / 2, mPlank);
      for (const s of [[-1.7, 1.7], [1.7, -1.7]]) {
        addGeo(woodDark, cylGeo, seg(tx + s[0], 0.2, tz - 1.7, tx + s[0], 3.7, tz + 1.7, 0.06, 0.06));
        addGeo(woodDark, cylGeo, seg(tx - 1.7, 0.2, tz + s[1], tx + 1.7, 3.7, tz + s[1], 0.06, 0.06));
      }
      sandbagM.push(M(tx - 1.2, 4.17, tz + 1.5, 1, 1, 1, 0, 0, 0));
      sandbagM.push(M(tx - 0.4, 4.17, tz + 1.5, 1, 1, 1, 0, 0.1, 0));
      kit.box(tx, 5.9, tz, 0.16, 0.2, 0.16, neonWarm, NC);
      block(tx - 2.6, tz - 2.6, tx + 5.8, tz + 2.6);
      kit.nav(tx, 4.14, tz);
      kit.nav(tx + 6, 0.1, tz - 0.8);
    };
    tower(-23, 52);
    tower(23, -50);
    tower(-59, 2);
    tower(38, -24);

    // Traliccio radio del campo
    kit.box(-58, 0, -13, 3, 1.0, 3, stoneTrim);
    for (const sx of [-0.9, 0.9]) {
      for (const sz of [-0.9, 0.9]) {
        addGeo(metalDark, cylGeo, seg(-58 + sx, 1, -13 + sz, -58 + sx * 0.2, 19, -13 + sz * 0.2, 0.07, 0.07));
      }
    }
    for (let ry = 3; ry <= 17; ry += 2.8) {
      const k = 1 - ((ry - 1) / 18) * 0.8;
      kit.box(-58, ry, -13, 1.9 * k, 0.1, 1.9 * k, rust, NCS);
    }
    kit.box(-58, 19, -13, 0.3, 0.3, 0.3, neonFire, NC);
    kit.box(-58, 15, -12.5, 1.2, 1.2, 0.1, corrugated, NCS);
    kit.collider(-59, 0, -14, -57, 12, -12);
    block(-60, -15, -56, -11);
    cable(-58, 15, -13, -48, 10.2, -6, 1.2, rubber, 0.03);
    cable(-58, 12, -13, -59, 6.2, 2, 1.5, rubber, 0.03);

    // Jeep e camion
    const jeep = (x, y, z, rot) => {
      const pt = (dx, dz) => rp(x, z, dx, dz, rot);
      let p = pt(0, 0);
      kit.box(p.x, y + 0.42, p.z, 1.92, 0.34, 4.15, metalDark, { rotY: rot });
      for (const bz of [-2.14, 2.12]) {
        p = pt(0, bz);
        kit.box(p.x, y + 0.46, p.z, 1.98, 0.2, 0.18, rust, { rotY: rot, collide: false });
      }
      p = pt(0, 0.68);
      kit.box(p.x, y + 0.76, p.z, 1.9, 0.54, 2.65, metalGreen, { rotY: rot });
      for (const sz of [0.15, 1.25]) {
        p = pt(0, sz);
        kit.box(p.x, y + 0.85, p.z, 1.55, 0.2, 0.55, mCanvas, { rotY: rot, collide: false });
        p = pt(0, sz + 0.3);
        kit.box(p.x, y + 1.05, p.z, 1.55, 0.5, 0.1, mCanvas, { rotY: rot, collide: false });
      }
      p = pt(0, -1.32);
      kit.mesh(jeepHoodGeo, metalGreen, { x: p.x, y: y + 0.76, z: p.z, rotY: rot + PI / 2 }, { collide: true });
      p = pt(0, -2.02);
      kit.box(p.x, y + 0.76, p.z, 1.65, 0.34, 0.08, metalDark, { rotY: rot, collide: false });
      for (const sx of [-0.62, 0.62]) {
        p = pt(sx, -2.05);
        kit.box(p.x, y + 0.9, p.z, 0.22, 0.2, 0.08, neonWarm, { rotY: rot, collide: false });
        p = pt(sx * 1.55, -1.3);
        kit.box(p.x, y + 0.82, p.z, 0.3, 0.08, 1.1, metalGreen, { rotY: rot, collide: false });
      }
      p = pt(0, -0.52);
      kit.box(p.x, y + 1.26, p.z, 1.84, 0.58, 0.08, metalDark, { rotY: rot, collide: false });
      kit.box(p.x, y + 1.3, p.z, 1.66, 0.46, 0.1, glass, { rotY: rot, collide: false });
      p = pt(-0.45, -0.2);
      kit.box(p.x, y + 1.15, p.z, 0.36, 0.05, 0.36, rubber, { rotY: rot, collide: false });
      for (const sx of [-0.86, 0.86]) {
        for (const sz of [-0.45, 1.75]) {
          p = pt(sx, sz);
          kit.box(p.x, y + 1.28, p.z, 0.08, 0.66, 0.08, metalDark, { rotY: rot, collide: false });
        }
      }
      p = pt(0, 0.65);
      kit.box(p.x, y + 1.9, p.z, 1.94, 0.1, 2.45, mCanvas, { rotY: rot });
      p = pt(-1.0, 1.7);
      kit.box(p.x, y + 0.8, p.z, 0.18, 0.5, 0.36, rust, { rotY: rot, collide: false });
      for (const wo of [[-0.98, -1.32], [0.98, -1.32], [-0.98, 1.28], [0.98, 1.28]]) {
        p = pt(wo[0], wo[1]);
        tireM.push(M(p.x, y + 0.48, p.z, 1, 1, 1, 0, rot + PI / 2, 0));
        kit.box(p.x, y + 0.34, p.z, 0.24, 0.28, 0.28, metalDark, { rotY: rot, collide: false });
      }
      p = pt(0.35, 2.16);
      tireM.push(M(p.x, y + 1.05, p.z, 0.9, 0.9, 0.9, 0, rot, 0));
      block(x - 2.8, z - 2.8, x + 2.8, z + 2.8);
    };
    const truck = (x, z, rot) => {
      const pt = (dx, dz) => rp(x, z, dx, dz, rot);
      let p = pt(0, 0);
      kit.box(p.x, 0.52, p.z, 2.35, 0.42, 6.8, metalDark, { rotY: rot });
      p = pt(0, -3.48);
      kit.box(p.x, 0.55, p.z, 2.45, 0.26, 0.22, rust, { rotY: rot, collide: false });
      p = pt(0, -2.52);
      kit.mesh(truckHoodGeo, metalGreen, { x: p.x, y: 0.94, z: p.z, rotY: rot + PI / 2 }, { collide: true });
      for (const sx of [-0.82, 0.82]) {
        p = pt(sx, -3.4);
        kit.box(p.x, 1.08, p.z, 0.26, 0.22, 0.08, neonWarm, { rotY: rot, collide: false });
        p = pt(sx * 1.48, -2.5);
        kit.box(p.x, 1.0, p.z, 0.3, 0.1, 1.4, metalGreen, { rotY: rot, collide: false });
        p = pt(sx * 1.45, -1.15);
        kit.box(p.x, 1.7, p.z, 0.06, 0.5, 0.9, glass, { rotY: rot, collide: false });
      }
      p = pt(0, -1.15);
      kit.box(p.x, 0.94, p.z, 2.32, 1.55, 1.45, metalGreen, { rotY: rot });
      p = pt(0, -1.89);
      kit.box(p.x, 1.75, p.z, 1.98, 0.55, 0.08, glass, { rotY: rot, collide: false });
      p = pt(0, 1.45);
      kit.box(p.x, 0.94, p.z, 2.46, 0.78, 3.85, mPlank, { rotY: rot });
      kit.box(p.x, 1.72, p.z, 2.42, 1.18, 3.8, mCanvas, { rotY: rot });
      kit.box(p.x, 2.9, p.z, 1.9, 0.16, 3.8, mCanvas, { rotY: rot, collide: false });
      p = pt(0, 3.42);
      kit.box(p.x, 0.94, p.z, 2.4, 0.5, 0.08, rust, { rotY: rot, collide: false });
      for (const sx of [-1.18, 1.18]) {
        for (const sz of [-2.45, 0.75, 2.25]) {
          p = pt(sx, sz);
          tireM.push(M(p.x, 0.56, p.z, 1.22, 1.22, 1.25, 0, rot + PI / 2, 0));
          kit.box(p.x, 0.38, p.z, 0.28, 0.34, 0.34, metalDark, { rotY: rot, collide: false });
        }
      }
      block(x - 4, z - 4, x + 4, z + 4);
    };
    jeep(-40, 0, 46, 0.3);
    jeep(20, 0, 52, 1.2);
    jeep(-20, 0, -52, -1.9);
    jeep(11.5, -0.3, 13, 0.5);
    truck(-37.6, -21.5, 0.08);
    truck(26, -38, 0.15);

    // Pali, luci a festone e cavi del campo
    const poles = [[-36, 54], [-36, 42], [-36, 30], [-37, -2], [-36, -14], [-36, -30], [-36, -44]];
    for (let i = 0; i < poles.length; i++) {
      const p = poles[i];
      kit.cyl(p[0], 0, p[1], 0.1, 0.15, 5.6, woodDark, { collide: true, seg: 7 });
      kit.box(p[0], 5.2, p[1], 1.3, 0.12, 0.14, woodDark, NC);
      kit.box(p[0], 4.9, p[1], 0.26, 0.22, 0.26, neonWarm, NC);
      if (i < poles.length - 1 && i !== 2) {
        const q = poles[i + 1];
        cable(p[0] - 0.5, 5.3, p[1], q[0] - 0.5, 5.3, q[1], 0.8, rubber, 0.022);
        cable(p[0] + 0.5, 5.3, p[1], q[0] + 0.5, 5.3, q[1], 0.7, rubber, 0.022);
      }
    }
    cable(-36, 5.3, 42, -42, 6.4, 38, 0.5, rubber, 0.022);
    cable(-37, 5.3, -2, -42, 9.6, -4, 0.6, rubber, 0.022);
    signPost(0, -28.6, 49.5, PI / 2);
    signPost(7, -28.4, -27, PI / 2);
    signPost(6, 3.8, 28.5, 0);
    signPost(6, -4, -34.5, PI);
    signPost(3, 35.6, 4.2, -PI / 2);
    signPost(4, 35.6, 27, -PI / 2);
    signPost(2, -36, -31.5, PI / 2);
    signPost(5, -35.8, 4.4, 0);

    // 6 LUCI VERE
    kit.light(0, 8.2, PZ, 0xffa040, 2.4, 28);
    kit.light(0, 3.6, RZ, 0xffb860, 1.6, 22);
    kit.light(-52, 2.2, 45.6, 0xff9a48, 2.0, 20);
    kit.light(58, 4.2, 15, 0xffb060, 1.6, 24);
    kit.light(0, 3.2, 36, 0x7fe0a8, 1.4, 18);
    kit.light(0, 3.4, -43, 0xffa850, 1.5, 20);

    // =========================================================================
    // 8. COPERTURE TATTICHE OGNI 6-10 M
    // =========================================================================
    const cover = (kind, x, z) => {
      const r = R(-0.12, 0.12);
      if (kind === 0) {
        kit.box(x, 0, z, 3.2, 1.25, 0.8, mGlyph, { rotY: r });
        kit.box(x - 1.0, 1.25, z, 1.1, 0.5, 0.75, mBlocks, { rotY: r });
        rockM.push(M(x + 1.9, 0.3, z + 0.5, 0.6, 0.45, 0.55, 0, R(0, 3), 0));
        lianaM.push(M(x + 0.8, 1.25, z + 0.45, 0.8, 1.1, 0.8, 0, R(0, 3), 0));
      } else if (kind === 1) {
        kit.box(x, 0, z, 2.2, 0.14, 1.8, woodDark, { rotY: r, collide: false });
        kit.box(x - 0.45, 0.14, z, 1.2, 1.05, 1.2, mPlank, { rotY: r });
        kit.box(x + 0.7, 0.14, z + 0.15, 0.9, 0.8, 0.95, metalGreen, { rotY: -r });
        kit.box(x - 0.4, 1.19, z, 0.9, 0.5, 0.9, mCanvas, { rotY: r * 2 });
      } else if (kind === 2) {
        kit.box(x, 0, z, 1.9, 1.2, 1.1, rust, { rotY: r });
        barrelM.push(M(x + 1.35, 0.46, z - 0.3, 1, 1, 1, 0, 0, 0));
        barrelM.push(M(x + 1.4, 0.46, z + 0.4, 1, 1, 1, 0, 0, 0));
        kit.collider(x + 1.0, 0, z - 0.65, x + 1.75, 0.92, z + 0.75);
        tireM.push(M(x - 1.4, 0.15, z + 0.2, 1, 1, 1, PI / 2, 0, 0));
        tireM.push(M(x - 1.4, 0.43, z + 0.25, 1, 1, 1, PI / 2, 0, 0.3));
      } else if (kind === 3) {
        kit.box(x, 0, z, 1.9, 0.4, 1.2, mBlocks, { rotY: r });
        kit.box(x, 0.4, z, 1.3, 2.6, 0.6, mGlyph, { rotY: r });
        kit.box(x, 3.0, z, 1.5, 0.3, 0.7, mBlocks, { rotY: r, collide: false });
        kit.box(x + 1.8, 0, z + 0.3, 1.4, 0.95, 1.2, mBlocks, { rotY: -r * 2 });
        kit.box(x + 1.8, 0.95, z + 0.3, 0.5, 0.2, 0.5, jade, NC);
      } else {
        sandbags(x, z, 5, 3, r, true);
      }
      block(x - 2.4, z - 1.3, x + 2.6, z + 1.3);
    };
    let ck = 0;
    for (const lx of [-32, 32]) {
      for (let z = -54; z <= 54; z += 8) {
        ck++;
        if (z > 2 && z < 26) continue;
        cover(ck % 5, lx + (ck % 2 ? 2.3 : -2.3), z + R(-0.6, 0.6));
      }
    }
    const coverList = [
      [-14, 50, 0], [14, 50, 1], [-6, 46, 4], [7, 45, 2],
      [-14, 41, 3], [13, 41, 0], [-17, 30, 1], [9.5, 27, 4], [-9, 24.5, 2],
      [-10, 3, 4], [10, 3, 0], [-23, 4.5, 1], [24, 4, 2],
      [-24, -9, 3], [24, -22, 0], [-23, -30, 2], [24.5, -30, 1],
      [-14, -31.5, 1], [15, -55, 3], [-20, -46, 4], [20.5, -43, 2], [-6, -52.5, 0], [6, -51, 4], [0, -36.5, 1],
      [39, 25.5, 1], [56.5, 40, 2], [54.6, -15, 1], [40, -17, 4], [-40, -17, 2], [-38.5, 25, 4],
      [0, 43, 4], [0, 51.5, 0], [-40, 10, 3], [40.5, 46, 0], [-56, 41, 1], [56, -40, 3]
    ];
    for (const c of coverList) cover(c[2], c[0], c[1]);
    sandbags(-8, 54.4, 6, 3, 0, true);
    sandbags(8, 54.4, 6, 3, 0, true);
    sandbags(-8, -54.4, 6, 3, PI, true);
    sandbags(8, -54.4, 6, 3, PI, true);
    sandbags(-32, 27.2, 5, 3, 0, false);
    sandbags(32, 1.2, 5, 3, 0, false);
    sandbags(0, 27.6, 4, 2, 0, false);

    // =========================================================================
    // 9. GIUNGLA: ALBERI GIGANTI, PALME, FELCI, BANANI, CESPUGLI, ROCCE, LIANE
    // =========================================================================
    const tree = (x, z, h, r) => {
      trunkM.push(M(x, 0, z, r, h, r, 0, R(0, 6.28), 0));
      const cr = 0.66 * r;
      kit.collider(x - cr, 0, z - cr, x + cr, h * 0.8, z + cr);
      block(x - cr - 0.6, z - cr - 0.6, x + cr + 0.6, z + cr + 0.6);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28 + R(-0.25, 0.25);
        const reach = R(2.2, 3.8) * r;
        rootM.push(seg(x, R(1.2, 2.4), z, x + Math.cos(a) * reach, 0.04, z + Math.sin(a) * reach, 0.9 * r, 0.45 * r));
      }
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.28 + R(-0.3, 0.3);
        const d = i === 0 ? 0 : R(1.8, 4.6) * r;
        canopyM.push(
          M(x + Math.cos(a) * d, h + (i === 0 ? 1.5 : R(-1.6, 1.4)), z + Math.sin(a) * d, R(2.6, 4.4) * r, R(2, 3.2) * r, R(2.6, 4.4) * r, R(-0.1, 0.1), R(0, 3), R(-0.1, 0.1))
        );
      }
      for (let i = 0; i < 5; i++) {
        const a = R(0, 6.28);
        const d = R(1.4, 4.2) * r;
        lianaM.push(M(x + Math.cos(a) * d, h - R(0.5, 2), z + Math.sin(a) * d, 1.3, R(5, h - 4), 1.3, 0, R(0, 3), 0));
      }
      bananaM.push(M(x + cr + 0.8, 0, z + 0.4, 0.8, 0.8, 0.8, 0, R(0, 6), 0));
      fernM.push(M(x - cr - 0.6, 0, z - 0.5, 1.4, 1.4, 1.4, 0, R(0, 6), 0));
    };
    const treeSpots = [
      [-62, -57, 20, 1.3], [-36, -62, 21, 1.4], [-8, -65.5, 18, 1.1], [10, -65.5, 19, 1.1], [36, -62, 22, 1.4], [62, -58, 20, 1.3],
      [-62, 59, 20, 1.3], [-36, 62, 19, 1.2], [-9, 65.5, 19, 1.1], [8, 65.5, 20, 1.1], [38, 62, 19, 1.2], [63, 60, 21, 1.3],
      [-63, -28, 21, 1.3], [-63.5, 14.5, 18, 1.0], [-63, 46, 19, 1.2], [63.5, -32, 20, 1.2], [63.5, -12, 22, 1.3], [63.5, 34, 19, 1.1],
      [-25.5, -22, 16, 1.0], [25.5, -12, 17, 1.0], [-41, 25, 16, 1.1], [41, 4, 16, 1.0], [16, 31, 17, 1.1], [-12, 49, 15, 0.95],
      [-15, -52, 16, 1.0], [15, -46, 17, 1.05], [-40, 49.5, 17, 1.1], [40, 50, 16, 1.0], [-40.5, -29.5, 16, 1.0], [24, 48, 15, 0.95],
      [-24, 27, 16, 1.0], [39, -48.5, 16, 1.0], [-26, 40, 15, 0.9], [26, 36, 16, 0.95], [-40, -50, 15, 0.95], [55.5, -46, 16, 1.0]
    ];
    for (const t of treeSpots) tree(t[0], t[1], t[2], t[3]);

    const palm = (x, z) => {
      const h = R(7, 11);
      const rot = R(0, 6.28);
      palmTrunkM.push(M(x, 0, z, 1, h, 1, 0, rot, 0));
      kit.collider(x - 0.3, 0, z - 0.3, x + 0.3, h, z + 0.3);
      const s = R(0.85, 1.2);
      palmCrownM.push(M(x + 0.11 * Math.cos(rot), h - 0.1, z - 0.11 * Math.sin(rot), s, s, s, 0, R(0, 6), 0));
      block(x - 0.8, z - 0.8, x + 0.8, z + 0.8);
    };
    for (let x = -60; x <= 56; x += 9.5) {
      for (const pz of [3.6, 24.4]) {
        const px = x + R(-1.5, 1.5);
        if (Math.abs(px + 32) < 4.5 || Math.abs(px) < 5.5 || Math.abs(px - 32) < 4.5) continue;
        if (!clear(px, pz, 0.6)) continue;
        palm(px, pz + R(-0.6, 0.6));
      }
    }
    for (const p of [[-17, 55], [17, 56], [-17, -56], [17, -57], [55.5, 32], [55.2, 8], [55.4, -12], [55.6, -31], [55, 46], [-55, 30], [-41, 44], [41, 30.5], [41, -31], [-41, -12.5], [21, 14], [-23, 14.5], [-28, 58], [28, -58], [27.5, 58], [-28, -59]]) {
      if (clear(p[0], p[1], 0.3)) palm(p[0], p[1]);
    }

    // Felci a centinaia
    for (let i = 0; i < 620; i++) {
      const x = R(-65, 65);
      const z = R(-65, 65);
      if (inRiver(z) || !clear(x, z, -0.4)) continue;
      const s = R(0.8, 1.7);
      fernM.push(M(x, 0, z, s, s * R(0.8, 1.2), s, 0, R(0, 6.28), 0));
    }
    // Felci e canne lungo le rive
    for (let x = -62; x <= 58; x += 2.2) {
      for (const bz of [5.4, 22.6]) {
        if (rnd() < 0.35) continue;
        const px = x + R(-0.8, 0.8);
        if (Math.abs(px + 32) < 2.6 || Math.abs(px) < 3.6 || Math.abs(px - 32) < 2.6) continue;
        const s = R(1.0, 1.9);
        fernM.push(M(px, 0.2, bz + R(-0.6, 0.6), s, s, s, 0, R(0, 6.28), 0));
      }
    }
    // Banani e piante a foglia larga (lontano dal centro delle corsie)
    for (let i = 0; i < 230; i++) {
      const x = R(-65, 65);
      const z = R(-65, 65);
      if (inRiver(z) || !clear(x, z, 0.2) || inLane(x, z)) continue;
      const s = R(0.7, 1.5);
      bananaM.push(M(x, 0, z, s, s * R(0.85, 1.25), s, 0, R(0, 6.28), 0));
    }
    // Cespugli fitti
    for (let i = 0; i < 240; i++) {
      const x = R(-65, 65);
      const z = R(-65, 65);
      if (inRiver(z) || !clear(x, z, 0.5) || inLane(x, z)) continue;
      const sy = R(0.6, 1.3);
      canopyM.push(M(x, sy * 0.4, z, R(0.8, 1.7), sy, R(0.8, 1.7), R(-0.1, 0.1), R(0, 3), R(-0.1, 0.1)));
    }
    // Siepe di giungla continua contro le pareti di confine
    for (let i = 0; i < 70; i++) {
      const t = -66 + i * 1.9;
      for (const e of [[t, -65], [t, 65], [-65, t], [65, t]]) {
        if (inRiver(e[1]) && Math.abs(e[0]) > 60) continue;
        if (!clear(e[0], e[1], -0.5)) continue;
        if (rnd() < 0.4) canopyM.push(M(e[0], R(1, 3.5), e[1], R(1.6, 2.8), R(1.4, 2.6), R(1.6, 2.8), 0, R(0, 3), 0));
        if (rnd() < 0.5) bananaM.push(M(e[0] + R(-1, 1), 0, e[1] + R(-1, 1), R(1.2, 1.9), R(1.3, 2.1), R(1.2, 1.9), 0, R(0, 6), 0));
        if (rnd() < 0.25) lianaM.push(M(e[0] * 1.02, R(8, 14), e[1] * 1.02, 1.6, R(5, 9), 1.6, 0, R(0, 3), 0));
      }
    }
    // Radici affioranti
    for (let i = 0; i < 90; i++) {
      const x = R(-60, 60);
      const z = R(-60, 60);
      if (inRiver(z) || !clear(x, z, 0.3)) continue;
      const a = R(0, 6.28);
      const len = R(2, 4.4);
      rootM.push(seg(x, 0.1, z, x + Math.cos(a) * len, 0.03, z + Math.sin(a) * len, R(0.5, 0.9), R(0.3, 0.5)));
    }
    // Massi muschiosi
    for (let i = 0; i < 170; i++) {
      const x = R(-65, 65);
      const z = R(-65, 65);
      if (inRiver(z) || !clear(x, z, 0.6)) continue;
      const s = R(0.4, 2.1);
      if (s > 1.0 && inLane(x, z)) continue;
      rockM.push(M(x, s * 0.3, z, s * R(0.85, 1.3), s * R(0.6, 1), s * R(0.85, 1.3), R(-0.15, 0.15), R(0, 3), R(-0.15, 0.15)));
      if (s > 1.2) {
        kit.collider(x - s * 0.7, 0, z - s * 0.7, x + s * 0.7, s * 0.8, z + s * 0.7);
        block(x - s, z - s, x + s, z + s);
        fernM.push(M(x + s * 0.9, 0, z, 1.2, 1.2, 1.2, 0, R(0, 6), 0));
      }
    }
    // Tronco gigante caduto nella corsia ovest-centro (copertura naturale)
    addGeo(mBark, drumGeo, seg(-27.5, 0.75, -40.5, -18.5, 0.95, -35.5, 1.5, 1.5));
    kit.collider(-27.6, 0, -40.9, -18.4, 1.7, -35.1);
    addGeo(mBark, drumGeo, seg(19, 0.7, 40, 27.5, 0.8, 43.5, 1.3, 1.3));
    kit.collider(19, 0, 39.4, 27.5, 1.5, 44);

    // =========================================================================
    // 10. INVIO: BATCH UNITI + ISTANZE
    // =========================================================================
    for (const entry of batches) {
      const merged = mergeGeometries(entry[1], false);
      if (merged) kit.mesh(merged, entry[0], { x: 0, y: 0, z: 0 }, { collide: false });
    }
    const inst = (geo, mat, arr, cast) => {
      if (arr.length > 0) kit.instanced(geo, mat, arr, { cast: cast });
    };
    inst(trunkGeo, mBark, trunkM, true);
    inst(rootGeo, mBark, rootM, true);
    inst(canopyGeo, mCanopy, canopyM, true);
    inst(palmTrunkGeo, mBark, palmTrunkM, true);
    inst(palmCrownGeo, mLeaf, palmCrownM, true);
    inst(fernGeo, mLeaf, fernM, false);
    inst(bananaGeo, mLeaf, bananaM, true);
    inst(lianaGeo, mLeaf, lianaM, false);
    inst(rockGeo, cliff, rockM, true);
    inst(barrelGeo, rust, barrelM, true);
    inst(tireGeo, rubber, tireM, true);
    inst(urnGeo, mBlocks, urnM, true);
    inst(sandbagGeo, sandbag, sandbagM, true);
    inst(bambooGeo, mThatch, bambooM, true);

    // =========================================================================
    // 11. NAV POINT EXTRA
    // =========================================================================
    const navPts = [
      [-32, 0.1, 50], [-32, 0.1, 30], [-32, 0.1, 2], [-32, 0.1, -20], [-32, 0.1, -44],
      [32, 0.1, 50], [32, 0.1, 30], [32, 0.1, 2], [32, 0.1, -20], [32, 0.1, -44],
      [0, 0.1, 50], [0, 0.1, 42], [0, 0.1, 29], [0, 0.1, 2.4], [0, 0.1, -35], [0, 0.1, -43], [0, 0.1, -52],
      [-21, 0.1, 2], [21, 0.1, 2], [-21, 0.1, -34], [21, 0.1, -34], [-21, 0.1, 26], [21, 0.1, 26],
      [-40, 0.1, 47], [40, 0.1, 47], [-40, 0.1, -48], [40, 0.1, -48],
      [-39, 0.1, 36], [39, 0.1, 36], [-39, 0.1, -6], [39, 0.1, -6], [-39, 0.1, -38], [39, 0.1, -38],
      [55.5, 0.1, 40], [55.5, 0.1, -12], [-52, 0.1, 42], [-52.5, 0.1, -30]
    ];
    for (const n of navPts) kit.nav(n[0], n[1], n[2]);
  }
});

