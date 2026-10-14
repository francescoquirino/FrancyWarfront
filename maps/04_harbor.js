// ============================================================================
// maps/04_harbor.js — "Porto al Tramonto" v4 (prefisso: map_harbor_)
// Zone: via dei magazzini e delle botteghe (ovest) · labirinto di container +
//       dogana (centro) · banchina con gru e nave cargo (est, punto eroe)
// Materiali dipinti a codice: facciate con finestre, botteghe, container con
// loghi, scafo, asfalto, lastre, macchie con trasparenza, insegne.
// ============================================================================
const map_harbor_H = 2.6;   // altezza container
const map_harbor_L = 6.2;   // passo container
const map_harbor_JP = [[-0.4, 0], [0.4, 0], [0.4, 0.14], [0.16, 0.44], [0.1, 0.9], [-0.1, 0.9], [-0.16, 0.44], [-0.4, 0.14]];
const map_harbor_CC = [[150, 52, 40], [40, 84, 132], [52, 110, 76], [204, 150, 36], [196, 188, 170]];
const map_harbor_CN = ['FRANCY LINES', 'MAREBLU', 'TRAMONTO CARGO', 'ITALCARGO', 'PORTO NORD'];
const map_harbor_CI = [0, 1, 2, 3, 4, 0, 1, 2, 3];
const map_harbor_FK = ['facA', 'facB', 'facC', 'facD'];
const map_harbor_BK = ['stOcra', 'stRosa', 'brickR', 'stSalvia'];
const map_harbor_FP = [
  { base: [214, 164, 74], trim: [226, 214, 186], shut: [62, 96, 70] },
  { base: [206, 138, 120], trim: [228, 218, 198], shut: [96, 64, 46] },
  { base: [158, 74, 52], trim: [222, 212, 190], shut: [52, 72, 96], brick: true, mortar: [176, 160, 140] },
  { base: [158, 178, 138], trim: [228, 222, 200], shut: [110, 60, 50] }
];
// insegne: [testo, sfondo, scritta, rapporto larghezza/altezza, bordo a strisce]
const map_harbor_SG = [
  ['MAGAZZINO A', '#20303a', '#ffc870', 5, 0], ['MAGAZZINO B', '#20303a', '#ffc870', 5, 0],
  ['DOGANA', '#1c3a5c', '#e6dcc0', 4.5, 0], ['TORRE 4', '#3a2a22', '#ff9a40', 4.2, 0],
  ['UFFICIO PORTO', '#4a2218', '#f0d9a0', 5, 0], ['CAPITANERIA', '#14303a', '#d8e6e0', 5, 0],
  ['MENSA · BAR', '#0e2a30', '#5ae0ff', 4.6, 0], ['ALLOGGI', '#2e2418', '#ffcf90', 4.4, 0],
  ['PORTO 4', '#102a44', '#ffb24a', 4.67, 0], ['PORTO DI FRANCY', '#3a1810', '#ffd9a0', 4.67, 0],
  ['ZONA 4', '#4a5a3a', '#e2dcc4', 3, 0], ['VIETATO L\'ACCESSO', '#dcd6c6', '#b02a1e', 3, 0],
  ['MOLO EST →', '#22508a', '#e6e0d0', 3.75, 0], ['PESO MAX 40 T', '#d8aa28', '#28282a', 3, 0],
  ['ATTENZIONE CARRELLI', '#d8aa28', '#28282a', 3.75, 1], ['BANCHINA 7', '#dcd6c6', '#22508a', 4, 0]
];
const map_harbor_Y = new THREE.Vector3(0, 1, 0);
const map_harbor_q = new THREE.Quaternion();
const map_harbor_eu = new THREE.Euler(0, 0, 0, 'YXZ');
const map_harbor_m = new THREE.Matrix4();
const map_harbor_s1 = new THREE.Vector3(1, 1, 1);
const map_harbor_va = new THREE.Vector3();
const map_harbor_vb = new THREE.Vector3();
const map_harbor_vc = new THREE.Vector3();
const map_harbor_vd = new THREE.Vector3();

// ---------------------------------------------------------------- pittura su canvas
function map_harbor_can(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function map_harbor_tx(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function map_harbor_css(c, k, a) {
  if (k === undefined) k = 1;
  const r = Math.round(Math.min(230, Math.max(36, c[0] * k)));
  const g = Math.round(Math.min(230, Math.max(36, c[1] * k)));
  const b = Math.round(Math.min(230, Math.max(36, c[2] * k)));
  return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')';
}
// macchie morbide che si ripetono senza cuciture
function map_harbor_blot(g, R, W, H, n, rgb, a, r0, r1) {
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * H, r = r0 + R() * (r1 - r0);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const px = x + ox * W, py = y + oy * H;
      if (px + r < 0 || px - r > W || py + r < 0 || py - r > H) continue;
      const gr = g.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }
}
function map_harbor_speck(g, R, W, H, n, lo, hi, a, s) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(lo + R() * (hi - lo)), q = 1 + R() * s;
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + a + ')';
    g.fillRect(R() * W, R() * H, q, q);
  }
}
function map_harbor_crk(g, R, x, y, len, ang, css, lw) {
  const n = 6 + Math.floor(R() * 6);
  g.strokeStyle = css; g.lineWidth = lw;
  g.beginPath(); g.moveTo(x, y);
  for (let i = 0; i < n; i++) {
    ang += (R() - 0.5) * 1.1;
    x += Math.cos(ang) * len / n; y += Math.sin(ang) * len / n;
    g.lineTo(x, y);
  }
  g.stroke();
}
function map_harbor_drip(g, x, y, w, len, rgb, a) {
  const gr = g.createLinearGradient(0, y, 0, y + len);
  gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  gr.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = gr;
  g.fillRect(x, y, w, len);
}
function map_harbor_text(g, t, cx, cy, maxW, px, css, st) {
  const f = function () { g.font = (st || 'bold') + ' ' + px + 'px Arial, Helvetica, sans-serif'; };
  f();
  while (g.measureText(t).width > maxW && px > 8) { px -= 2; f(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = css;
  g.fillText(t, cx, cy);
}
function map_harbor_slats(g, x, y, w, h, c, step) {
  g.fillStyle = map_harbor_css(c); g.fillRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += step) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, yy, w, 2);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, yy + 2, w, 1);
  }
}

// FACCIATA: 8 m x 14 m = 4 finestre x 4 piani (1024x1024) + mappa delle finestre accese
function map_harbor_paintFacade(R, P) {
  const W = 1024, cv = map_harbor_can(W, W), g = cv.getContext('2d');
  const ev = map_harbor_can(512, 512), e = ev.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, 512, 512);
  if (P.brick) {
    g.fillStyle = map_harbor_css(P.mortar); g.fillRect(0, 0, W, W);
    for (let r = 0; r < 128; r++) for (let c = -1; c < 32; c++) {
      g.fillStyle = map_harbor_css(P.base, 0.8 + R() * 0.34);
      g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 8 + 1, 30, 6);
    }
  } else {
    g.fillStyle = map_harbor_css(P.base); g.fillRect(0, 0, W, W);
    map_harbor_blot(g, R, W, W, 40, '255,250,235', 0.1, 40, 160);
    map_harbor_blot(g, R, W, W, 46, '70,50,40', 0.1, 40, 170);
    map_harbor_speck(g, R, W, W, 9000, 90, 240, 0.07, 2);
    for (let c = 1; c < 4; c++) {          // intonaco caduto: si vede il mattone
      if (R() < 0.4) continue;
      const px = c * 256 + (R() - 0.5) * 16, py = Math.floor(R() * 4) * 256 + 90 + R() * 110, pr = 12 + R() * 14;
      g.save(); g.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * 6.283, rr = pr * (0.6 + R() * 0.6);
        if (k === 0) g.moveTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 1.3);
        else g.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 1.3);
      }
      g.closePath(); g.clip();
      g.fillStyle = 'rgb(156,90,66)'; g.fillRect(px - 40, py - 50, 80, 100);
      g.fillStyle = 'rgba(210,196,176,0.8)';
      for (let yy = py - 50; yy < py + 50; yy += 7) g.fillRect(px - 40, yy, 80, 1.5);
      g.restore();
    }
  }
  map_harbor_blot(g, R, W, W, 14, '50,44,40', 0.14, 60, 200);
  for (let f = 0; f < 4; f++) {
    const y0 = f * 256;
    g.fillStyle = map_harbor_css(P.trim); g.fillRect(0, y0 + 246, W, 10);      // marcapiano
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y0 + 246, W, 2);
    map_harbor_drip(g, 0, y0, W, 30, '40,30,25', 0.24);
    for (let c = 0; c < 4; c++) {
      const wx = c * 256 + 58, wy = y0 + 59, ww = 140, wh = 124, t = R();
      const closed = t >= 0.44 && t < 0.72, lit = !closed && R() < 0.26;
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(wx - 9, wy - 9, ww + 24, wh + 24);
      g.fillStyle = map_harbor_css(P.trim);
      g.fillRect(wx - 12, wy - 12, ww + 24, wh + 24);
      g.fillRect(wx - 18, wy - 23, ww + 36, 12);
      g.fillRect(wx - 20, wy + wh + 10, ww + 40, 9);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(wx - 18, wy + wh + 19, ww + 36, 4);
      g.fillRect(wx - 18, wy - 11, ww + 36, 2);
      const nd = 3 + Math.floor(R() * 3);
      for (let k = 0; k < nd; k++) map_harbor_drip(g, wx - 16 + R() * (ww + 28), wy + wh + 22, 2 + R() * 4, 14 + R() * 24, '44,32,26', 0.3);
      const gg = g.createLinearGradient(0, wy, 0, wy + wh);
      if (lit) { gg.addColorStop(0, 'rgb(230,196,120)'); gg.addColorStop(1, 'rgb(226,150,72)'); }
      else {
        const k = 0.7 + R() * 0.5;
        gg.addColorStop(0, map_harbor_css([52, 68, 92], k));
        gg.addColorStop(0.55, map_harbor_css([120, 108, 116], k));
        gg.addColorStop(1, map_harbor_css([204, 146, 104], k));
      }
      g.fillStyle = gg; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(255,255,255,0.09)';
      g.beginPath(); g.moveTo(wx + 14, wy + wh); g.lineTo(wx + 60, wy); g.lineTo(wx + 84, wy); g.lineTo(wx + 38, wy + wh); g.fill();
      let cover = 0;
      if (lit) { e.fillStyle = 'rgb(255,186,104)'; e.fillRect(wx / 2, wy / 2, ww / 2, wh / 2); }
      if (t < 0.22) {                                   // tende
        const cw = 30 + R() * 16, cc = [226, 216, 196];
        g.fillStyle = map_harbor_css(cc, 0.8 + R() * 0.2, 0.85);
        g.fillRect(wx, wy, cw, wh); g.fillRect(wx + ww - cw, wy, cw, wh); g.fillRect(wx, wy, ww, 14);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let k = 6; k < cw; k += 9) { g.fillRect(wx + k, wy, 2, wh); g.fillRect(wx + ww - k, wy, 2, wh); }
        if (lit) { e.fillStyle = 'rgba(0,0,0,0.3)'; e.fillRect(wx / 2, wy / 2, cw / 2, wh / 2); e.fillRect((wx + ww - cw) / 2, wy / 2, cw / 2, wh / 2); }
      } else if (t < 0.58) {                            // tapparella (a metà oppure chiusa)
        cover = t < 0.44 ? wh * (0.25 + R() * 0.5) : wh;
        map_harbor_slats(g, wx, wy, ww, cover, [150 + R() * 40, 146 + R() * 30, 130 + R() * 20], 6);
        if (lit) { e.fillStyle = '#000'; e.fillRect(wx / 2, wy / 2, ww / 2, cover / 2); }
      } else if (t < 0.72) {                            // persiane chiuse
        map_harbor_slats(g, wx, wy, ww, wh, P.shut, 5);
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(wx + ww / 2 - 1, wy, 3, wh);
        cover = wh;
      } else if (t < 0.86) {                            // persiane aperte ai lati
        map_harbor_slats(g, wx - 58, wy - 4, 46, wh + 8, P.shut, 5);
        map_harbor_slats(g, wx + ww + 12, wy - 4, 46, wh + 8, P.shut, 5);
      }
      if (cover < wh) {                                 // traversi del serramento
        g.fillStyle = map_harbor_css(P.trim, 0.94);
        g.fillRect(wx + ww / 2 - 3, wy + cover, 5, wh - cover);
        if (cover < wh * 0.4) g.fillRect(wx, wy + wh * 0.4, ww, 4);
        if (lit) { e.fillStyle = '#000'; e.fillRect((wx + ww / 2 - 3) / 2, wy / 2, 3, wh / 2); }
      }
    }
  }
  for (let i = 0; i < 7; i++) map_harbor_crk(g, R, R() * W, R() * W, 80 + R() * 160, R() * 6.28, 'rgba(40,32,28,0.45)', 1.2);
  return { map: map_harbor_tx(cv), emis: map_harbor_tx(ev) };
}

// BOTTEGHE: 8 vetrine/portoni da 4 m x 4 m (2048x1024) + mappa luminosa
function map_harbor_paintShops(R) {
  const cv = map_harbor_can(2048, 1024), g = cv.getContext('2d');
  const ev = map_harbor_can(1024, 512), e = ev.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, 1024, 512);
  const lit = function (x, y, w, h, css) { e.fillStyle = css; e.fillRect(x, y, w, h); };
  const band = function (t, bg, fg, glow) {
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(26, 172, 464, 5);
    g.fillStyle = bg; g.fillRect(22, 92, 468, 80);
    g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(29, 99, 454, 66);
    map_harbor_text(g, t, 256, 134, 420, 50, fg);
    if (glow) { lit(22, 92, 468, 80, 'rgba(255,255,255,0.1)'); map_harbor_text(e, t, 256, 134, 420, 50, fg); }
  };
  const win = function (x, y, w, h, frame, on, warm) {
    g.fillStyle = frame; g.fillRect(x - 8, y - 8, w + 16, h + 16);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    if (on) { gr.addColorStop(0, warm ? 'rgb(230,204,140)' : 'rgb(214,228,220)'); gr.addColorStop(1, warm ? 'rgb(214,150,84)' : 'rgb(170,196,186)'); }
    else { gr.addColorStop(0, 'rgb(50,64,84)'); gr.addColorStop(1, 'rgb(170,124,96)'); }
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    if (on) {
      for (let i = 0; i < 14; i++) {
        g.fillStyle = map_harbor_css([90 + R() * 120, 70 + R() * 90, 50 + R() * 80], 1, 0.75);
        g.fillRect(x + 6 + R() * (w - 34), y + h * 0.45 + R() * h * 0.4, 8 + R() * 18, 8 + R() * 20);
      }
      g.fillStyle = 'rgba(60,40,30,0.5)'; g.fillRect(x, y + h * 0.42, w, 4); g.fillRect(x, y + h * 0.7, w, 4);
      lit(x, y, w, h, warm ? 'rgb(255,200,120)' : 'rgb(200,235,220)');
      lit(x, y + h * 0.45, w, h * 0.55, 'rgba(0,0,0,0.35)');
    }
    g.fillStyle = 'rgba(255,255,255,0.1)';
    g.beginPath(); g.moveTo(x + w * 0.1, y + h); g.lineTo(x + w * 0.45, y); g.lineTo(x + w * 0.6, y); g.lineTo(x + w * 0.25, y + h); g.fill();
    g.fillStyle = frame; g.fillRect(x + w / 2 - 3, y, 6, h);
    lit(x + w / 2 - 3, y, 6, h, '#000');
  };
  const door = function (x, y, w, h, col, on) {
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 10, y - 10, w + 20, h + 10);
    g.fillStyle = col; g.fillRect(x - 6, y - 6, w + 12, h + 6);
    if (on) {
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, 'rgb(230,200,138)'); gr.addColorStop(1, 'rgb(190,130,80)');
      g.fillStyle = gr; g.fillRect(x + 8, y + 8, w - 16, h - 70);
      lit(x + 8, y + 8, w - 16, h - 70, 'rgb(255,196,118)');
    } else {
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(x + 10, y + 12, w - 20, h * 0.36); g.fillRect(x + 10, y + h * 0.46, w - 20, h * 0.44);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x + 14, y + 16, w - 28, h * 0.36 - 8); g.fillRect(x + 14, y + h * 0.46 + 4, w - 28, h * 0.44 - 8);
    }
    g.fillStyle = 'rgb(196,170,96)'; g.fillRect(x + w - 22, y + h * 0.52, 8, 26);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 6, y + h - 12, w + 12, 12);
  };
  const shut = function (x, y, w, h) {
    g.fillStyle = 'rgb(70,70,72)'; g.fillRect(x - 8, y - 8, w + 16, h + 8);
    map_harbor_slats(g, x, y, w, h, [132, 134, 130], 9);
    for (let i = 0; i < 6; i++) map_harbor_drip(g, x + R() * (w - 12), y + R() * h * 0.5, 4 + R() * 8, 40 + R() * 90, '120,64,34', 0.4);
    g.fillStyle = 'rgb(60,60,62)'; g.fillRect(x + w / 2 - 14, y + h - 22, 28, 12);
  };
  const poster = function (x, y, w, h, bg, fg, lines, rot) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
    g.fillStyle = bg; g.fillRect(-w / 2, -h / 2, w, h);
    for (let i = 0; i < lines.length; i++) map_harbor_text(g, lines[i], 0, -h / 2 + (i + 0.5) * h / lines.length, w - 14, Math.floor(h / lines.length * 0.6), fg);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-w / 2, -h / 2, w, 3);
    g.restore();
  };
  const plate = function (x, y, t) {
    g.fillStyle = 'rgb(224,218,202)'; g.fillRect(x, y, 42, 32);
    g.strokeStyle = 'rgb(40,70,120)'; g.lineWidth = 3; g.strokeRect(x + 3, y + 3, 36, 26);
    map_harbor_text(g, t, x + 21, y + 17, 30, 22, 'rgb(40,70,120)');
  };
  const scribble = function (x, y, w, h, css) {
    g.strokeStyle = css; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, y + h * R());
    for (let i = 1; i <= 7; i++) g.lineTo(x + w * i / 7, y + h * R());
    g.stroke();
  };
  for (let i = 0; i < 8; i++) {
    const cx = (i % 4) * 512, cy = (i >> 2) * 512;
    g.save(); g.translate(cx, cy); g.beginPath(); g.rect(0, 0, 512, 512); g.clip();
    e.save(); e.scale(0.5, 0.5); e.translate(cx, cy); e.beginPath(); e.rect(0, 0, 512, 512); e.clip();
    // bugnato di pietra chiara con zoccolo scuro
    g.fillStyle = 'rgb(120,108,94)'; g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) {
      g.fillStyle = map_harbor_css([188, 170, 142], 0.9 + R() * 0.2);
      g.fillRect(c * 128 + (r % 2) * 64 + 2, r * 64 + 2, 124, 60);
    }
    g.fillStyle = 'rgb(112,102,92)'; g.fillRect(0, 456, 512, 56);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 452, 512, 4);
    map_harbor_speck(g, R, 512, 512, 1600, 80, 230, 0.1, 2);
    map_harbor_blot(g, R, 512, 512, 5, '60,50,40', 0.14, 40, 120);
    map_harbor_drip(g, 0, 0, 512, 40, '40,30,24', 0.3);
    const gb = g.createLinearGradient(0, 512, 0, 440);
    gb.addColorStop(0, 'rgba(40,34,28,0.4)'); gb.addColorStop(1, 'rgba(40,34,28,0)');
    g.fillStyle = gb; g.fillRect(0, 440, 512, 72);
    if (i === 0) {
      band('BAR DEL MOLO', 'rgb(34,78,60)', 'rgb(228,220,190)', true);
      win(44, 204, 250, 236, 'rgb(60,44,34)', true, true);
      door(336, 204, 130, 302, 'rgb(60,44,34)', true);
      map_harbor_text(g, 'CAFFÈ · PANINI', 169, 224, 220, 24, 'rgba(228,220,196,0.9)');
    } else if (i === 1) {
      band('FARMACIA', 'rgb(224,220,206)', 'rgb(28,122,62)', true);
      g.fillStyle = 'rgb(40,150,80)'; g.fillRect(436, 18, 20, 60); g.fillRect(416, 38, 60, 20);
      lit(436, 18, 20, 60, 'rgb(60,255,130)'); lit(416, 38, 60, 20, 'rgb(60,255,130)');
      win(44, 204, 260, 236, 'rgb(196,196,190)', true, false);
      door(340, 204, 128, 302, 'rgb(196,196,190)', true);
    } else if (i === 2) {
      band('FERRAMENTA', 'rgb(124,92,60)', 'rgb(214,198,160)', false);
      shut(52, 196, 408, 310);
      scribble(80, 250, 340, 70, 'rgba(60,150,190,0.8)');
      map_harbor_text(g, 'PORTO LIBERO', 256, 392, 340, 46, 'rgba(210,70,60,0.85)', 'italic bold');
      scribble(110, 430, 280, 30, 'rgba(210,70,60,0.7)');
    } else if (i === 3) {
      g.fillStyle = 'rgb(206,192,166)'; g.fillRect(150, 150, 212, 362);
      g.beginPath(); g.arc(256, 150, 106, Math.PI, 0); g.fill();
      g.fillStyle = 'rgb(92,58,38)'; g.fillRect(170, 150, 172, 356);
      g.beginPath(); g.arc(256, 150, 86, Math.PI, 0); g.fill();
      g.fillStyle = 'rgb(60,72,88)'; g.beginPath(); g.arc(256, 148, 70, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgb(92,58,38)'; g.lineWidth = 5;
      for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(256, 148); g.lineTo(256 + Math.cos(Math.PI * k / 5) * 72, 148 - Math.sin(Math.PI * k / 5) * 72); g.stroke(); }
      for (let s = 0; s < 2; s++) {
        const dx = 178 + s * 84;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(dx, 166, 72, 130); g.fillRect(dx, 312, 72, 176);
        g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(dx + 5, 171, 62, 120); g.fillRect(dx + 5, 317, 62, 166);
      }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(254, 150, 4, 356);
      g.fillStyle = 'rgb(196,170,96)'; g.fillRect(240, 330, 8, 8); g.fillRect(264, 330, 8, 8);
      plate(382, 226, '12');
      g.fillStyle = 'rgb(176,150,84)'; g.fillRect(386, 290, 28, 62);
      g.fillStyle = 'rgb(60,50,40)'; for (let k = 0; k < 5; k++) g.fillRect(392, 297 + k * 11, 16, 5);
      poster(30, 250, 96, 130, 'rgb(222,196,60)', 'rgb(40,40,44)', ['AFFITTASI', 'tel. 0444'], -0.04);
    } else if (i === 4) {
      band('TABACCHI', 'rgb(30,44,76)', 'rgb(228,224,210)', true);
      g.fillStyle = 'rgb(30,44,76)'; g.fillRect(30, 18, 60, 64);
      map_harbor_text(g, 'T', 60, 52, 50, 56, 'rgb(228,224,210)');
      lit(30, 18, 60, 64, 'rgba(255,255,255,0.15)'); map_harbor_text(e, 'T', 60, 52, 50, 56, 'rgb(255,255,255)');
      door(44, 204, 124, 302, 'rgb(50,52,60)', false);
      win(200, 204, 268, 236, 'rgb(50,52,60)', true, true);
      poster(220, 214, 70, 44, 'rgb(200,50,40)', 'rgb(228,224,210)', ['LOTTO'], 0);
    } else if (i === 5) {
      band('PESCHERIA DA GINO', 'rgb(40,96,146)', 'rgb(228,226,214)', true);
      win(44, 204, 424, 236, 'rgb(208,208,202)', true, false);
      shut(44, 204, 424, 104);
      lit(36, 196, 440, 114, '#000');
      map_harbor_text(g, 'PESCE FRESCO', 256, 256, 300, 34, 'rgba(40,96,146,0.8)');
    } else if (i === 6) {
      g.fillStyle = 'rgb(40,44,52)'; g.fillRect(380, 110, 96, 84);
      g.fillStyle = 'rgb(90,86,80)'; for (let k = 0; k < 5; k++) g.fillRect(388 + k * 20, 110, 5, 84);
      g.strokeStyle = 'rgba(226,222,208,0.85)'; g.lineWidth = 5; g.strokeRect(96, 40, 250, 80);
      map_harbor_text(g, 'ZONA 4', 221, 82, 220, 60, 'rgba(226,222,208,0.85)');
      poster(40, 170, 120, 170, 'rgb(196,66,48)', 'rgb(228,222,196)', ['FESTA', 'DEL MARE', '12 AGOSTO'], 0.03);
      poster(176, 190, 110, 150, 'rgb(52,96,132)', 'rgb(228,224,206)', ['CIRCO', 'FRANCY'], -0.05);
      poster(304, 236, 120, 160, 'rgb(216,206,176)', 'rgb(60,50,44)', ['CERCASI', 'MARINAIO'], 0.02);
      scribble(60, 380, 380, 50, 'rgba(70,160,90,0.75)');
    } else {
      g.fillStyle = 'rgb(206,192,166)'; g.fillRect(70, 156, 372, 356);
      g.fillStyle = 'rgb(50,84,62)'; g.fillRect(84, 170, 344, 336);
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 1; k < 12; k++) g.fillRect(84 + k * 28.6, 170, 2, 336);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(254, 170, 4, 336);
      g.fillStyle = 'rgb(44,44,46)';
      for (let k = 0; k < 3; k++) { g.fillRect(84, 200 + k * 130, 46, 9); g.fillRect(382, 200 + k * 130, 46, 9); }
      for (let k = 0; k < 5; k++) map_harbor_drip(g, 90 + R() * 330, 180 + R() * 120, 5, 60 + R() * 80, '110,60,34', 0.35);
      g.fillStyle = 'rgb(224,218,204)'; g.fillRect(446, 196, 58, 76);
      g.strokeStyle = 'rgb(190,44,34)'; g.lineWidth = 6; g.beginPath(); g.arc(475, 224, 18, 0, 6.283); g.stroke();
      g.beginPath(); g.moveTo(463, 236); g.lineTo(487, 212); g.stroke();
      map_harbor_text(g, 'PASSO', 475, 256, 50, 13, 'rgb(40,40,44)');
      plate(452, 330, '7');
    }
    g.restore(); e.restore();
  }
  return { map: map_harbor_tx(cv), emis: map_harbor_tx(ev) };
}

// INTONACO chiaro (3 m) da tingere con il colore del materiale
function map_harbor_paintStucco(R) {
  const W = 512, cv = map_harbor_can(W, W), g = cv.getContext('2d');
  g.fillStyle = 'rgb(226,222,214)'; g.fillRect(0, 0, W, W);
  map_harbor_blot(g, R, W, W, 40, '120,110,100', 0.11, 30, 110);
  map_harbor_blot(g, R, W, W, 30, '255,255,250', 0.12, 30, 100);
  map_harbor_speck(g, R, W, W, 5000, 150, 235, 0.18, 2);
  for (let i = 0; i < 12; i++) map_harbor_drip(g, R() * W, R() * W * 0.6, 3 + R() * 6, 50 + R() * 120, '90,80,70', 0.14);
  for (let i = 0; i < 6; i++) map_harbor_crk(g, R, 40 + R() * 430, 40 + R() * 430, 60 + R() * 120, R() * 6.28, 'rgba(70,60,54,0.5)', 1.2);
  for (let i = 0; i < 2; i++) {
    const px = 80 + R() * 350, py = 80 + R() * 350;
    g.save(); g.beginPath(); g.ellipse(px, py, 20 + R() * 16, 14 + R() * 12, R() * 3, 0, 6.283); g.clip();
    g.fillStyle = 'rgb(168,146,134)'; g.fillRect(px - 50, py - 50, 100, 100);
    g.fillStyle = 'rgba(214,206,196,0.8)'; for (let yy = py - 50; yy < py + 50; yy += 8) g.fillRect(px - 50, yy, 100, 2);
    g.restore();
  }
  return map_harbor_tx(cv);
}

// ASFALTO (8 m) con toppe, crepe sigillate e olio
function map_harbor_paintAsphalt(R) {
  const W = 1024, cv = map_harbor_can(W, W), g = cv.getContext('2d');
  g.fillStyle = 'rgb(68,67,70)'; g.fillRect(0, 0, W, W);
  map_harbor_speck(g, R, W, W, 26000, 40, 124, 0.5, 2);
  map_harbor_blot(g, R, W, W, 24, '110,104,96', 0.1, 60, 200);
  map_harbor_blot(g, R, W, W, 24, '30,30,34', 0.16, 60, 200);
  for (let i = 0; i < 5; i++) {
    const x = 40 + R() * 700, y = 40 + R() * 700, w = 90 + R() * 200, h = 70 + R() * 160;
    g.fillStyle = R() < 0.5 ? 'rgba(48,48,52,0.85)' : 'rgba(86,84,80,0.8)'; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgb(38,38,40)'; g.lineWidth = 4; g.strokeRect(x, y, w, h);
  }
  map_harbor_speck(g, R, W, W, 6000, 50, 130, 0.3, 2);
  for (let i = 0; i < 14; i++) map_harbor_crk(g, R, R() * W, R() * W, 150 + R() * 350, R() * 6.28, 'rgb(38,38,40)', 2 + R() * 1.5);
  for (let i = 0; i < 4; i++) map_harbor_crk(g, R, R() * W, R() * W, 300 + R() * 400, R() * 6.28, 'rgb(40,40,44)', 6);
  map_harbor_blot(g, R, W, W, 10, '26,26,30', 0.35, 20, 70);
  return map_harbor_tx(cv);
}

// LASTRE di cemento della banchina (8 m, lastre da 2 m)
function map_harbor_paintSlabs(R) {
  const W = 1024, cv = map_harbor_can(W, W), g = cv.getContext('2d');
  g.fillStyle = 'rgb(88,82,76)'; g.fillRect(0, 0, W, W);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const t = 150 + R() * 26;
    g.fillStyle = 'rgb(' + Math.round(t + 8) + ',' + Math.round(t) + ',' + Math.round(t - 12) + ')';
    g.fillRect(c * 256 + 3, r * 256 + 3, 250, 250);
    if (R() < 0.35) {
      g.fillStyle = 'rgb(88,82,76)'; g.beginPath();
      g.moveTo(c * 256 + 3, r * 256 + 3); g.lineTo(c * 256 + 20 + R() * 20, r * 256 + 3); g.lineTo(c * 256 + 3, r * 256 + 20 + R() * 20); g.fill();
    }
  }
  map_harbor_speck(g, R, W, W, 16000, 110, 200, 0.25, 2);
  map_harbor_blot(g, R, W, W, 30, '60,54,48', 0.14, 40, 160);
  map_harbor_blot(g, R, W, W, 6, '150,84,40', 0.25, 30, 90);
  for (let i = 0; i < 8; i++) map_harbor_crk(g, R, R() * W, R() * W, 100 + R() * 200, R() * 6.28, 'rgba(60,54,50,0.8)', 1.6);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(30,30,32,0.07)'; g.fillRect(0, R() * W, W, 14 + R() * 12); }
  return map_harbor_tx(cv);
}

// MACCHIE a terra con trasparenza: atlante 4x4 (olio, ruggine, crepe, tombini, scritte)
function map_harbor_paintDecals(R) {
  const cv = map_harbor_can(1024, 1024), g = cv.getContext('2d');
  const cell = function (i, fn) {
    g.save(); g.translate((i % 4) * 256, (i >> 2) * 256); g.beginPath(); g.rect(0, 0, 256, 256); g.clip(); fn(); g.restore();
  };
  const lb = function (n, rgb, a, r0, r1, sp) {
    for (let i = 0; i < n; i++) {
      const x = 128 + (R() - 0.5) * 2 * sp, y = 128 + (R() - 0.5) * 2 * sp, r = r0 + R() * (r1 - r0);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(0.6, 'rgba(' + rgb + ',' + (a * 0.6) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };
  const wear = function (n) {
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) {
      const s = 2 + R() * 9;
      g.fillStyle = 'rgba(0,0,0,' + (0.3 + R() * 0.6) + ')';
      g.fillRect(R() * 256, R() * 256, s, s * (0.4 + R()));
    }
    g.globalCompositeOperation = 'source-over';
  };
  cell(0, function () { lb(9, '36,36,40', 0.7, 30, 62, 58); });
  cell(1, function () {
    lb(6, '36,36,40', 0.75, 50, 84, 36);
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(96,66,126,0.25)'; g.beginPath(); g.ellipse(128, 128, 70, 54, 0.4, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(44,112,122,0.22)'; g.beginPath(); g.ellipse(124, 132, 56, 40, 0.4, 0, 6.283); g.stroke();
  });
  cell(2, function () { lb(10, '140,70,36', 0.6, 26, 60, 60); });
  cell(3, function () {
    lb(10, '150,125,90', 0.55, 30, 64, 56);
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(120,100,70,0.5)'; g.fillRect(60 + R() * 136, 60 + R() * 136, 2, 2); }
  });
  cell(4, function () { for (let i = 0; i < 6; i++) map_harbor_crk(g, R, 128, 128, 50 + R() * 50, R() * 6.28, 'rgba(36,36,38,0.9)', 2.5); });
  cell(5, function () {
    g.strokeStyle = 'rgba(36,36,38,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 128);
    for (let i = 1; i <= 12; i++) g.lineTo(14 + i * 19, 128 + (R() - 0.5) * 36);
    g.stroke();
    for (let i = 0; i < 4; i++) map_harbor_crk(g, R, 50 + R() * 150, 128, 40 + R() * 30, (R() < 0.5 ? 1 : -1) * (1 + R()), 'rgba(36,36,38,0.8)', 1.8);
  });
  cell(6, function () {
    g.strokeStyle = 'rgba(36,36,38,0.5)'; g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(34, 226); g.quadraticCurveTo(70, 90, 190, 34); g.stroke();
    g.beginPath(); g.moveTo(80, 230); g.quadraticCurveTo(116, 110, 226, 62); g.stroke();
  });
  cell(7, function () {
    g.fillStyle = 'rgb(58,56,54)'; g.beginPath(); g.arc(128, 128, 112, 0, 6.283); g.fill();
    g.strokeStyle = 'rgb(88,84,78)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 104, 0, 6.283); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 70, 0, 6.283); g.stroke();
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * 6.283;
      g.beginPath(); g.moveTo(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44); g.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); g.stroke();
    }
    map_harbor_text(g, 'PORTO', 128, 128, 70, 22, 'rgb(96,92,86)');
    lb(4, '120,70,40', 0.3, 30, 60, 50);
  });
  cell(8, function () {
    g.fillStyle = 'rgb(84,82,78)'; g.fillRect(24, 64, 208, 128);
    g.fillStyle = 'rgb(54,54,56)'; g.fillRect(32, 72, 192, 112);
    g.fillStyle = 'rgb(36,36,38)'; for (let k = 0; k < 9; k++) g.fillRect(40 + k * 20, 78, 11, 100);
  });
  cell(9, function () { lb(8, '36,40,48', 0.55, 46, 80, 40); });
  cell(10, function () {
    g.fillStyle = 'rgba(224,220,208,0.9)'; g.beginPath();
    g.moveTo(128, 20); g.lineTo(196, 110); g.lineTo(152, 110); g.lineTo(152, 236); g.lineTo(104, 236); g.lineTo(104, 110); g.lineTo(60, 110); g.closePath(); g.fill();
    wear(240);
  });
  cell(11, function () {
    g.strokeStyle = 'rgba(222,178,40,0.92)'; g.lineWidth = 8; g.strokeRect(16, 66, 224, 124);
    map_harbor_text(g, 'ZONA 4', 128, 130, 196, 64, 'rgba(222,178,40,0.92)');
    wear(260);
  });
  cell(12, function () { map_harbor_text(g, 'STOP', 128, 130, 236, 104, 'rgba(224,220,208,0.9)'); wear(260); });
  cell(13, function () {
    g.save(); g.beginPath(); g.rect(18, 18, 220, 220); g.clip();
    g.fillStyle = 'rgb(42,42,44)'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgb(222,178,40)';
    for (let k = -6; k < 8; k++) { g.beginPath(); g.moveTo(k * 44, 256); g.lineTo(k * 44 + 22, 256); g.lineTo(k * 44 + 278, 0); g.lineTo(k * 44 + 256, 0); g.closePath(); g.fill(); }
    g.restore();
    wear(300);
  });
  cell(14, function () {
    g.strokeStyle = 'rgba(222,178,40,0.9)'; g.lineWidth = 7; g.strokeRect(30, 70, 196, 116);
    map_harbor_text(g, 'A-12', 128, 130, 170, 76, 'rgba(222,178,40,0.9)');
    wear(240);
  });
  cell(15, function () {
    lb(8, '36,36,36', 0.8, 50, 90, 30);
    for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(150,146,140,0.5)'; g.fillRect(70 + R() * 116, 70 + R() * 116, 2 + R() * 3, 2 + R() * 3); }
  });
  return map_harbor_tx(cv);
}

// INSEGNE con testo: 16 targhe 512x128 in un solo atlante
function map_harbor_paintSigns(R) {
  const cv = map_harbor_can(1024, 1024), g = cv.getContext('2d');
  for (let i = 0; i < map_harbor_SG.length; i++) {
    const s = map_harbor_SG[i], vw = 128 * s[3];
    g.save(); g.translate((i % 2) * 512, (i >> 1) * 128); g.scale(4 / s[3], 1);
    g.fillStyle = s[1]; g.fillRect(0, 0, vw, 128);
    if (s[4]) {
      g.fillStyle = s[2];
      for (let x = -20; x < vw; x += 36) {
        g.beginPath(); g.moveTo(x, 18); g.lineTo(x + 18, 18); g.lineTo(x + 30, 2); g.lineTo(x + 12, 2); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(x, 126); g.lineTo(x + 18, 126); g.lineTo(x + 30, 110); g.lineTo(x + 12, 110); g.closePath(); g.fill();
      }
    } else { g.strokeStyle = s[2]; g.lineWidth = 5; g.strokeRect(7, 7, vw - 14, 114); }
    map_harbor_text(g, s[0], vw / 2, 66, vw - 40, s[4] ? 60 : 78, s[2]);
    for (let k = 0; k < 4; k++) map_harbor_drip(g, R() * vw, 6, 4 + R() * 6, 40 + R() * 60, '40,30,24', 0.25);
    g.fillStyle = 'rgba(150,150,146,0.9)';
    g.fillRect(12, 12, 5, 5); g.fillRect(vw - 17, 12, 5, 5); g.fillRect(12, 111, 5, 5); g.fillRect(vw - 17, 111, 5, 5);
    g.restore();
  }
  return map_harbor_tx(cv);
}

// CONTAINER: 5 colori (fianchi con logo, porte, tetti) in un solo atlante
function map_harbor_paintCont(R) {
  const cv = map_harbor_can(1024, 1024), g = cv.getContext('2d');
  g.fillStyle = 'rgb(90,90,92)'; g.fillRect(0, 0, 1024, 1024);
  for (let r = 0; r < 5; r++) {
    const c = map_harbor_CC[r], y0 = r * 160, ink = r === 4 ? 'rgba(40,62,100,0.9)' : 'rgba(228,222,204,0.9)';
    g.fillStyle = map_harbor_css(c); g.fillRect(0, y0, 1024, 160);
    map_harbor_text(g, map_harbor_CN[r], 300, y0 + 86, 440, 62, ink);
    map_harbor_text(g, 'FRLU ' + (100000 + Math.floor(R() * 899999)) + ' ' + Math.floor(R() * 10), 860, y0 + 36, 240, 22, ink);
    map_harbor_text(g, '22G1', 930, y0 + 62, 100, 18, ink);
    g.fillStyle = ink; g.fillRect(650, y0 + 100, 60, 34);
    g.fillStyle = map_harbor_css(c); g.fillRect(654, y0 + 104, 52, 26);
    for (let x = 12; x < 1012; x += 16) {
      g.fillStyle = 'rgba(0,0,0,0.17)'; g.fillRect(x, y0 + 9, 5, 142);
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x + 8, y0 + 9, 3, 142);
    }
    g.fillStyle = map_harbor_css(c, 0.66); g.fillRect(0, y0, 1024, 9); g.fillRect(0, y0 + 151, 1024, 9);
    g.fillStyle = map_harbor_css(c, 0.58); g.fillRect(0, y0, 11, 160); g.fillRect(1013, y0, 11, 160);
    for (let k = 0; k < 16; k++) map_harbor_drip(g, 14 + R() * 990, y0 + 8 + R() * 30, 3 + R() * 7, 30 + R() * 90, '112,58,32', 0.45);
    for (let k = 0; k < 8; k++) {
      const bx = R() * 1000, by = y0 + 30 + R() * 110, br = 8 + R() * 16;
      const gr = g.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, 'rgba(112,58,32,0.6)'); gr.addColorStop(1, 'rgba(112,58,32,0)');
      g.fillStyle = gr; g.fillRect(bx - br, Math.max(y0, by - br), br * 2, Math.min(br * 2, y0 + 160 - by + br));
    }
    g.strokeStyle = 'rgba(230,226,214,0.3)'; g.lineWidth = 1.5;
    for (let k = 0; k < 10; k++) { const sx = R() * 980, sy = y0 + 20 + R() * 120; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 20 + R() * 50, sy + (R() - 0.5) * 14); g.stroke(); }
    const gd = g.createLinearGradient(0, y0 + 160, 0, y0 + 118);
    gd.addColorStop(0, 'rgba(40,34,28,0.4)'); gd.addColorStop(1, 'rgba(40,34,28,0)');
    g.fillStyle = gd; g.fillRect(0, y0 + 118, 1024, 42);
    // porte
    const x0 = r * 160, yd = 800;
    g.fillStyle = map_harbor_css(c); g.fillRect(x0, yd, 160, 224);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x0 + 8, yd + 20 + k * 36, 144, 4); }
    g.strokeStyle = map_harbor_css(c, 0.6); g.lineWidth = 7; g.strokeRect(x0 + 3.5, yd + 3.5, 153, 217);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x0 + 79, yd + 6, 3, 212);
    const rods = [38, 62, 98, 122];
    for (let k = 0; k < 4; k++) {
      g.fillStyle = 'rgb(172,172,166)'; g.fillRect(x0 + rods[k], yd + 12, 3, 200);
      g.fillStyle = 'rgb(70,70,72)'; g.fillRect(x0 + rods[k] - 6, yd + 126, 15, 5);
    }
    g.fillStyle = 'rgb(54,54,56)';
    for (let k = 0; k < 5; k++) { g.fillRect(x0 + 6, yd + 22 + k * 44, 10, 6); g.fillRect(x0 + 144, yd + 22 + k * 44, 10, 6); }
    g.fillStyle = 'rgb(224,218,204)'; g.fillRect(x0 + 100, yd + 44, 34, 24);
    g.fillStyle = 'rgb(60,60,64)'; for (let k = 0; k < 4; k++) g.fillRect(x0 + 104, yd + 48 + k * 5, 26, 2);
    map_harbor_text(g, 'FRLU', x0 + 40, yd + 30, 50, 14, ink);
    for (let k = 0; k < 5; k++) map_harbor_drip(g, x0 + 10 + R() * 136, yd + 10 + R() * 60, 3 + R() * 5, 30 + R() * 70, '112,58,32', 0.45);
    // tetto
    const xr = 800 + r * 44;
    g.fillStyle = map_harbor_css(c, 0.86); g.fillRect(xr, yd, 44, 224);
    for (let yy = yd; yy < yd + 224; yy += 12) {
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(xr, yy, 44, 3);
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(xr, yy + 6, 44, 2);
    }
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(112,58,32,0.4)'; g.fillRect(xr + R() * 34, yd + R() * 200, 6 + R() * 8, 8 + R() * 16); }
  }
  return map_harbor_tx(cv);
}

// SCAFO della nave: 44 m x 12,5 m (2048x512), lamiere, ruggine, nome
function map_harbor_paintHull(R) {
  const W = 2048, cv = map_harbor_can(W, 512), g = cv.getContext('2d');
  const yh = function (h) { return 512 - h * 40.96; };
  g.fillStyle = 'rgb(44,62,84)'; g.fillRect(0, 0, W, 512);
  g.fillStyle = 'rgb(128,52,42)'; g.fillRect(0, yh(3), W, 512 - yh(3));
  map_harbor_blot(g, R, W, 512, 50, '20,30,44', 0.2, 40, 160);
  map_harbor_blot(g, R, W, 512, 30, '90,110,130', 0.1, 40, 140);
  g.fillStyle = 'rgb(222,216,200)'; g.fillRect(0, yh(3.15), W, 12); g.fillRect(0, yh(9.6), W, 12);
  map_harbor_text(g, 'FRANCY LINES', 1024, yh(6.4), 1100, 112, 'rgb(222,216,200)');
  for (let m = 3.6; m < 6.6; m += 0.6) {
    g.fillStyle = 'rgb(222,216,200)'; g.fillRect(70, yh(m), 22, 3);
    map_harbor_text(g, String(Math.round(m * 2)), 110, yh(m), 30, 14, 'rgb(222,216,200)');
  }
  for (let x = 0; x < W; x += 116) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, 0, 2, 512); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x + 2, 0, 1, 512); }
  for (let h = 1; h < 12.5; h += 2) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, yh(h), W, 2); }
  for (let i = 0; i < 46; i++) {
    const x = R() * W, top = R() < 0.6 ? yh(9.3) : yh(3 + R() * 6);
    map_harbor_drip(g, x, top, 3 + R() * 9, 60 + R() * 180, '150,82,42', 0.5);
  }
  for (let x = 58; x < W; x += 232) { g.fillStyle = 'rgb(36,40,48)'; g.fillRect(x, yh(9.9), 26, 9); map_harbor_drip(g, x + 4, yh(9.9) + 9, 18, 120 + R() * 100, '130,76,44', 0.45); }
  const gw = g.createLinearGradient(0, 512, 0, yh(1.2));
  gw.addColorStop(0, 'rgba(40,60,50,0.55)'); gw.addColorStop(1, 'rgba(40,60,50,0)');
  g.fillStyle = gw; g.fillRect(0, yh(1.2), W, 512 - yh(1.2));
  map_harbor_speck(g, R, W, 512, 9000, 40, 200, 0.08, 2);
  return map_harbor_tx(cv);
}

// ---------------------------------------------------------------- geometria di base
function map_harbor_mat4(x, y, z, sx, sy, sz, ry) {
  map_harbor_vc.set(x, y, z);
  map_harbor_vd.set(sx, sy, sz);
  map_harbor_q.setFromAxisAngle(map_harbor_Y, ry || 0);
  return new THREE.Matrix4().compose(map_harbor_vc, map_harbor_q, map_harbor_vd);
}

// UV in metri (proiezione sull'asse dominante della normale), scalate di s
function map_harbor_uvm(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  s = s || 1;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) * s, p.getZ(i) * s);
    else if (ax >= az) uv.setXY(i, p.getZ(i) * s, p.getY(i) * s);
    else uv.setXY(i, p.getX(i) * s, p.getY(i) * s);
  }
}

// rimappa le UV 0..1 di una geometria dentro un rettangolo (in pixel) di un atlante
function map_harbor_quv(g, px, py, pw, ph, TW, TH) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + 2 + uv.getX(i) * (pw - 4)) / TW, 1 - (py + 2 + (1 - uv.getY(i)) * (ph - 4)) / TH);
}

// aggiunge una geometria al lotto del materiale `key` (fuso alla fine: 1 draw call per materiale)
function map_harbor_put(C, key, g, x, y, z, ry, rx, rz, keepUV) {
  map_harbor_eu.set(rx || 0, ry || 0, rz || 0, 'YXZ');
  map_harbor_q.setFromEuler(map_harbor_eu);
  map_harbor_vc.set(x, y, z);
  map_harbor_m.compose(map_harbor_vc, map_harbor_q, map_harbor_s1);
  const n = g.index ? g.toNonIndexed() : g;
  n.applyMatrix4(map_harbor_m);
  if (!keepUV) map_harbor_uvm(n, C.S[key]);
  (C.G[key] || (C.G[key] = [])).push(n);
}

// cilindro tra due punti (r alla base A, r2 in cima B)
function map_harbor_tube(C, key, ax, ay, az, bx, by, bz, r, seg, r2) {
  map_harbor_va.set(ax, ay, az);
  map_harbor_vb.set(bx, by, bz);
  map_harbor_vd.subVectors(map_harbor_vb, map_harbor_va);
  const len = map_harbor_vd.length();
  if (len < 1e-4) return;
  map_harbor_vd.multiplyScalar(1 / len);
  map_harbor_q.setFromUnitVectors(map_harbor_Y, map_harbor_vd);
  map_harbor_vc.addVectors(map_harbor_va, map_harbor_vb).multiplyScalar(0.5);
  map_harbor_m.compose(map_harbor_vc, map_harbor_q, map_harbor_s1);
  const g = new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, len, seg || 5, 1, r < 0.07).toNonIndexed();
  g.applyMatrix4(map_harbor_m);
  (C.G[key] || (C.G[key] = [])).push(g);
}

// cilindro verticale con base a y, UV in metri
function map_harbor_cyl(C, key, x, y, z, rt, rb, h, seg, solid) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg || 12).toNonIndexed();
  const uv = g.attributes.uv, r = Math.max(rt, rb), k = r * 6.283;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * h);
  g.translate(x, y + h / 2, z);
  (C.G[key] || (C.G[key] = [])).push(g);
  if (solid) C.kit.collider(x - r, y, z - r, x + r, y + h, z + r);
}

// trave/tavola orientata tra due punti (larghezza w, spessore t)
function map_harbor_beam(C, key, ax, ay, az, bx, by, bz, w, t) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  map_harbor_put(C, key, new THREE.BoxGeometry(w, t, len), (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, Math.atan2(dx, dz), -Math.asin(dy / len));
}

// cavo con catenaria
function map_harbor_sag(C, key, ax, ay, az, bx, by, bz, sag, r) {
  let px = ax, py = ay, pz = az;
  for (let i = 1; i <= 5; i++) {
    const t = i / 5, qx = ax + (bx - ax) * t, qz = az + (bz - az) * t, qy = ay + (by - ay) * t - sag * 4 * t * (1 - t);
    map_harbor_tube(C, key, px, py, pz, qx, qy, qz, r, 3);
    px = qx; py = qy; pz = qz;
  }
}

// icosaedro deformato (rocce, chiome, fiamme)
function map_harbor_blob(C, key, x, y, z, r, sy, jit, detail) {
  const g = new THREE.IcosahedronGeometry(r, detail || 0), p = g.attributes.position, sd = C.rng() * 100;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
    const k = 1 + jit * Math.sin(px * 3.1 / r + sd) * Math.cos(py * 2.7 / r + sd * 1.3) + jit * 0.6 * Math.sin(pz * 4.3 / r + sd * 0.7);
    p.setXYZ(i, px * k, py * k * sy, pz * k);
  }
  g.computeVertexNormals();
  g.translate(x, y, z);
  (C.G[key] || (C.G[key] = [])).push(g);
}

// profilo (z,y) estruso lungo X locale, centrato in X
function map_harbor_prof(pts, width) {
  const sh = new THREE.Shape();
  sh.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2, 0, 0);
  return g;
}

// pianta (x,z) estrusa in altezza
function map_harbor_plan(pts, h) {
  const sh = new THREE.Shape();
  sh.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], -pts[i][1]);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

// traliccio a sezione quadrata tra A e B
function map_harbor_lattice(C, key, A, B, u, v, hw, n, r) {
  const rings = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t, pz = A[2] + (B[2] - A[2]) * t, ring = [];
    for (let k = 0; k < 4; k++) {
      const su = (k === 0 || k === 3) ? -hw : hw, sv = (k < 2) ? -hw : hw;
      ring.push([px + u[0] * su + v[0] * sv, py + u[1] * su + v[1] * sv, pz + u[2] * su + v[2] * sv]);
    }
    rings.push(ring);
  }
  for (let i = 0; i <= n; i++) {
    const a = rings[i];
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      map_harbor_tube(C, key, a[k][0], a[k][1], a[k][2], a[k2][0], a[k2][1], a[k2][2], r * 0.6, 4);
      if (i < n) {
        const b = rings[i + 1];
        map_harbor_tube(C, key, a[k][0], a[k][1], a[k][2], b[k][0], b[k][1], b[k][2], r, 5);
        if ((i + k) % 2 === 0) map_harbor_tube(C, key, a[k][0], a[k][1], a[k][2], b[k2][0], b[k2][1], b[k2][2], r * 0.6, 4);
        else map_harbor_tube(C, key, a[k2][0], a[k2][1], a[k2][2], b[k][0], b[k][1], b[k][2], r * 0.6, 4);
      }
    }
  }
}

function map_harbor_flush(C) {
  const flat = { decal: 1, signs: 1, asfalto: 1, lastre: 1, fire: 1 };
  for (const key in C.G) {
    const list = C.G[key];
    if (!list.length || !C.M[key]) continue;
    const g = mergeGeometries(list, false);
    if (g) C.kit.mesh(g, C.M[key], { x: 0, y: 0, z: 0 }, { collide: false, cast: !flat[key] });
    list.length = 0;
  }
}

// sistema di riferimento locale ruotato (avanti = -Z locale)
function map_harbor_frame(C, x, z, rot, y0) {
  const c = Math.cos(rot), s = Math.sin(rot), kit = C.kit;
  const F = { x: x, z: z, rot: rot, y0: y0 || 0 };
  F.wx = function (lx, lz) { return x + lx * c + lz * s; };
  F.wz = function (lx, lz) { return z - lx * s + lz * c; };
  F.box = function (lx, ly, lz, w, h, d, mat, solid, ry) {
    kit.box(F.wx(lx, lz), F.y0 + ly, F.wz(lx, lz), w, h, d, mat, { collide: !!solid, rotY: rot + (ry || 0) });
  };
  F.put = function (key, g, lx, ly, lz, ry, rx, rz) {
    map_harbor_put(C, key, g, F.wx(lx, lz), F.y0 + ly, F.wz(lx, lz), rot + (ry || 0), rx, rz);
  };
  F.tube = function (key, ax, ay, az, bx, by, bz, r, seg, r2) {
    map_harbor_tube(C, key, F.wx(ax, az), F.y0 + ay, F.wz(ax, az), F.wx(bx, bz), F.y0 + by, F.wz(bx, bz), r, seg, r2);
  };
  F.wheel = function (lx, lz, r, wd) {
    const px = F.wx(lx, lz), pz = F.wz(lx, lz);
    C.I.wheel.push(map_harbor_mat4(px, F.y0 + r, pz, wd, r, r, rot));
    C.I.hub.push(map_harbor_mat4(px, F.y0 + r, pz, wd * 1.06, r * 0.55, r * 0.55, rot));
  };
  F.col = function (hw, hl, h, lz) {
    const cx = F.wx(0, lz || 0), cz = F.wz(0, lz || 0);
    const ex = Math.abs(c) * hw + Math.abs(s) * hl, ez = Math.abs(s) * hw + Math.abs(c) * hl;
    kit.collider(cx - ex, F.y0, cz - ez, cx + ex, F.y0 + h, cz + ez);
  };
  return F;
}

// insegna presa dall'atlante (idx = riga di map_harbor_SG)
function map_harbor_sg(C, idx, x, y, z, rotY, w, h) {
  const g = new THREE.PlaneGeometry(w, h);
  map_harbor_quv(g, (idx % 2) * 512, (idx >> 1) * 128, 512, 128, 1024, 1024);
  map_harbor_put(C, 'signs', g, x, y, z, rotY, 0, 0, true);
}

// macchia a terra presa dall'atlante (cell 0..15)
function map_harbor_dq(C, cell, x, z, w, d, rot) {
  const g = new THREE.PlaneGeometry(w, d);
  map_harbor_quv(g, (cell % 4) * 256, (cell >> 2) * 256, 256, 256, 1024, 1024);
  g.rotateX(-Math.PI / 2);
  C.dn++;
  map_harbor_put(C, 'decal', g, x, 0.06 + (C.dn % 9) * 0.002, z, rot, 0, 0, true);
}

// ---------------------------------------------------------------- materiali
// palette: ocra / rosa antico / salvia / mattone (caldi) contro blu acciaio e petrolio (freddi), accento giallo gru
function map_harbor_mats(kit) {
  const T = kit.THREE;
  const mp = function (c) { return kit.mat('metal_painted', { color: c }); };
  const M = {
    conc: kit.mat('concrete', { scale: 3 }), concD: kit.mat('concrete_dark', { scale: 3 }),
    brickR: kit.mat('brick_red'), cream: kit.mat('plaster', { color: 0xdccfae }),
    metal: kit.mat('metal'), metalD: kit.mat('metal', { color: 0x54565a }), rust: kit.mat('rust'),
    wood: kit.mat('wood'), woodD: kit.mat('wood_dark'), glass: kit.mat('glass'),
    sandbag: kit.mat('sandbag'), tarp: kit.mat('sandbag', { color: 0x2f7078 }),
    rubber: kit.mat('rubber'), leaf: kit.mat('grass', { color: 0x5f7a3a }),
    corrA: kit.mat('corrugated', { color: 0x3f8088 }), corrB: kit.mat('corrugated', { color: 0xb05a3c }),
    white: mp(0xd8d2c4), crane: mp(0xe0a21c), blue: mp(0x2f5f96), red: mp(0xb23a24),
    winLit: kit.neon(0xffb458, 2.4), lamp: kit.neon(0xffe2a8, 4), signC: kit.neon(0x38d8ff, 3.5), fire: kit.neon(0xff5a1e, 6),
    water: new T.MeshStandardMaterial({ color: 0x20343f, metalness: 0.6, roughness: 0.15 })
  };
  if (typeof document === 'undefined') {
    M.facA = M.cream; M.facB = M.cream; M.facC = M.brickR; M.facD = M.cream; M.shops = M.conc;
    M.stOcra = M.cream; M.stRosa = M.cream; M.stSalvia = M.cream;
    M.asfalto = M.concD; M.lastre = M.conc; M.cont = M.red; M.hull = M.blue; M.decal = null; M.signs = null;
  } else {
    const R = function () { return kit.rng(); };
    const white = function () { return new T.Color(0xffffff); };
    for (let i = 0; i < 4; i++) {
      const f = map_harbor_paintFacade(R, map_harbor_FP[i]);
      M[map_harbor_FK[i]] = new T.MeshStandardMaterial({ map: f.map, bumpMap: f.map, bumpScale: 0.5, emissiveMap: f.emis, emissive: white(), emissiveIntensity: 2.0, roughness: 0.82, metalness: 0 });
    }
    const sh = map_harbor_paintShops(R);
    M.shops = new T.MeshStandardMaterial({ map: sh.map, bumpMap: sh.map, bumpScale: 0.4, emissiveMap: sh.emis, emissive: white(), emissiveIntensity: 1.5, roughness: 0.8, metalness: 0 });
    const st = map_harbor_paintStucco(R);
    const stucco = function (c) {
      const m = new T.MeshStandardMaterial({ map: st, bumpMap: st, bumpScale: 0.4, color: c, roughness: 0.9, metalness: 0 });
      m.userData.uvScale = 1 / 3;
      return m;
    };
    M.stOcra = stucco(0xd9a84c); M.stRosa = stucco(0xd08f7c); M.stSalvia = stucco(0xa2b88e);
    const as = map_harbor_paintAsphalt(R);
    M.asfalto = new T.MeshStandardMaterial({ map: as, bumpMap: as, bumpScale: 0.5, roughness: 0.92, metalness: 0 });
    const ls = map_harbor_paintSlabs(R);
    M.lastre = new T.MeshStandardMaterial({ map: ls, bumpMap: ls, bumpScale: 0.5, roughness: 0.88, metalness: 0 });
    const ct = map_harbor_paintCont(R);
    M.cont = new T.MeshStandardMaterial({ map: ct, bumpMap: ct, bumpScale: 0.9, roughness: 0.55, metalness: 0.35 });
    const hl = map_harbor_paintHull(R);
    M.hull = new T.MeshStandardMaterial({ map: hl, bumpMap: hl, bumpScale: 0.5, roughness: 0.6, metalness: 0.3 });
    const dc = map_harbor_paintDecals(R);
    M.decal = new T.MeshStandardMaterial({ map: dc, transparent: true, depthWrite: false, roughness: 0.7, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const sn = map_harbor_paintSigns(R);
    M.signs = new T.MeshStandardMaterial({ map: sn, emissiveMap: sn, emissive: white(), emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.1 });
  }
  // alias: stesso materiale, nessuna draw call in più
  M.card = M.sandbag; M.cloth = M.sandbag; M.screen = M.signC; M.greenL = M.signC; M.redL = M.fire;
  M.signO = M.winLit; M.lineY = M.crane; M.net = M.leaf; M.rubble = M.concD; M.dirt = M.woodD;
  M.goods = [M.wood, M.woodD, M.card];
  return M;
}

// ---------------------------------------------------------------- piccoli oggetti
function map_harbor_barrel(C, x, z, which) {
  C.I['bar' + which].push(map_harbor_mat4(x, 0, z, 1, 1, 1, C.rng() * 6.28));
  C.kit.collider(x - 0.3, 0, z - 0.3, x + 0.3, 0.92, z + 0.3);
}
function map_harbor_barrels(C, x, z, n) {
  for (let i = 0; i < n; i++) {
    const a = C.rng() * 6.28, r = 0.2 + i * 0.28;
    map_harbor_barrel(C, x + Math.cos(a) * r, z + Math.sin(a) * r, C.pick(['R', 'B', 'Y', 'Rust']));
  }
  map_harbor_dq(C, C.pick([0, 2]), x, z, 2.6, 2.6, C.rng() * 6.28);
}
function map_harbor_firebarrel(C, x, z) {
  map_harbor_barrel(C, x, z, 'Rust');
  for (let i = 0; i < 4; i++) map_harbor_blob(C, 'fire', x + C.rand(-0.1, 0.1), 0.95 + i * 0.16, z + C.rand(-0.1, 0.1), 0.2 - i * 0.035, 1.5, 0.3, 0);
  for (let i = 0; i < 5; i++) C.I.rubble.push(map_harbor_mat4(x + C.rand(-0.9, 0.9), 0.06, z + C.rand(-0.9, 0.9), 0.3, 0.12, 0.18, C.rand(0, 3)));
  map_harbor_dq(C, 15, x, z, 3.6, 3.6, C.rng() * 6.28);
}
function map_harbor_crate(C, x, y, z, s, solid) {
  const kit = C.kit, M = C.M, ry = C.rand(-0.35, 0.35), m = C.pick(M.goods);
  kit.box(x, y, z, s, s * 0.9, s, m, { collide: solid !== false, rotY: ry });
  if (m !== M.card) {
    kit.box(x, y + s * 0.9, z, s + 0.06, 0.05, s + 0.06, M.woodD, { collide: false, rotY: ry });
    kit.box(x, y + s * 0.4, z, s + 0.05, 0.1, s + 0.05, M.woodD, { collide: false, rotY: ry });
  } else kit.box(x, y + s * 0.9, z, s * 0.14, 0.012, s + 0.01, M.tarp, { collide: false, rotY: ry });
}
function map_harbor_crates(C, x, z, n) {
  for (let i = 0; i < n; i++) {
    const s = C.rand(0.9, 1.45), px = x + C.rand(-1.5, 1.5), pz = z + C.rand(-1.5, 1.5);
    map_harbor_crate(C, px, 0, pz, s);
    if (C.rng() < 0.45) map_harbor_crate(C, px + C.rand(-0.1, 0.1), s * 0.9 + 0.05, pz, s * 0.7, false);
  }
}
function map_harbor_pallet(C, x, z, rot, stack, y0) {
  const F = map_harbor_frame(C, x, z, rot + C.rand(-0.05, 0.05), y0 || 0), M = C.M, bags = C.rng() < 0.35;
  for (let i = -1; i <= 1; i++) F.box(i * 0.5, 0, 0, 0.1, 0.1, 0.8, M.woodD);
  F.box(0, 0.1, 0, 1.2, 0.04, 0.8, M.wood);
  for (let i = 0; i < stack; i++) {
    if (bags) {
      for (let j = 0; j < 4; j++) {
        const lx = (j % 2 ? 0.28 : -0.28), lz = (j < 2 ? -0.19 : 0.19);
        C.I.bag.push(map_harbor_mat4(F.wx(lx, lz), F.y0 + 0.28 + i * 0.27, F.wz(lx, lz), 0.6, 0.3, 0.42, F.rot + C.rand(-0.1, 0.1)));
      }
    } else F.box(0, 0.14 + i * 0.5, 0, 1.1, 0.48, 0.72, C.pick(M.goods), false, C.rand(-0.04, 0.04));
  }
  if (stack > 0) F.col(0.6, 0.42, 0.14 + stack * (bags ? 0.3 : 0.5));
}
function map_harbor_sandbags(C, x, z, rot, len) {
  len = len || 3.2;
  const c = Math.cos(rot), s = Math.sin(rot), n = Math.round(len / 0.62);
  for (let r = 0; r < 3; r++) {
    const k = n - (r === 2 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      const lx = (i - (k - 1) / 2) * 0.62 + (r % 2 ? 0.2 : 0) + C.rand(-0.04, 0.04), lz = C.rand(-0.05, 0.05);
      C.I.bag.push(map_harbor_mat4(x + lx * c + lz * s, 0.15 + r * 0.27, z - lx * s + lz * c, 0.68, 0.3, 0.42, rot + C.rand(-0.12, 0.12)));
    }
  }
  const hx = Math.abs(c) * len / 2 + Math.abs(s) * 0.25, hz = Math.abs(s) * len / 2 + Math.abs(c) * 0.25;
  C.kit.collider(x - hx, 0, z - hz, x + hx, 0.88, z + hz);
  map_harbor_dq(C, 3, x, z, len + 1, len + 1, C.rng() * 6.28);
}
function map_harbor_jersey(C, x, z, rot) {
  map_harbor_put(C, 'concD', map_harbor_prof(map_harbor_JP, 3.0), x, 0, z, rot + C.rand(-0.03, 0.03));
  const ax = Math.abs(Math.cos(rot)) > 0.5;
  C.kit.collider(x - (ax ? 1.5 : 0.3), 0, z - (ax ? 0.3 : 1.5), x + (ax ? 1.5 : 0.3), 0.9, z + (ax ? 0.3 : 1.5));
  if (C.rng() < 0.4) C.kit.box(x, 0.45, z, ax ? 1.2 : 0.34, 0.28, ax ? 0.34 : 1.2, C.rng() < 0.5 ? C.M.crane : C.M.red, { collide: false, rotY: 0 });
}
function map_harbor_jline(C, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1, n = Math.max(1, Math.round(Math.hypot(dx, dz) / 3.1));
  const rot = Math.abs(dx) > Math.abs(dz) ? 0 : Math.PI / 2;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; map_harbor_jersey(C, x1 + dx * t, z1 + dz * t, rot); }
}
function map_harbor_fence(C, x1, z1, x2, z2) {
  const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(len / 2.5)), K = 'metal';
  for (let i = 0; i <= n; i++) {
    const px = x1 + (x2 - x1) * i / n, pz = z1 + (z2 - z1) * i / n;
    map_harbor_tube(C, K, px, 0, pz, px, 2.3, pz, 0.045, 4);
    map_harbor_tube(C, K, px, 2.3, pz, px + 0.25, 2.65, pz + 0.25, 0.02, 3);
    if (i < n) {
      const qx = x1 + (x2 - x1) * (i + 1) / n, qz = z1 + (z2 - z1) * (i + 1) / n;
      map_harbor_tube(C, K, px, 0.15, pz, qx, 0.15, qz, 0.02, 3);
      map_harbor_tube(C, K, px, 1.2, pz, qx, 1.2, qz, 0.015, 3);
      map_harbor_tube(C, K, px, 2.25, pz, qx, 2.25, qz, 0.025, 3);
      map_harbor_tube(C, K, px + 0.25, 2.65, pz + 0.25, qx + 0.25, 2.65, qz + 0.25, 0.012, 3);
      for (let k = 0; k < 4; k++) {
        const t0 = k / 4, t1 = (k + 1) / 4;
        map_harbor_tube(C, K, px + (qx - px) * t0, 0.15, pz + (qz - pz) * t0, px + (qx - px) * t1, 2.25, pz + (qz - pz) * t1, 0.008, 3);
        map_harbor_tube(C, K, px + (qx - px) * t0, 2.25, pz + (qz - pz) * t0, px + (qx - px) * t1, 0.15, pz + (qz - pz) * t1, 0.008, 3);
      }
    }
  }
  C.kit.collider(Math.min(x1, x2) - 0.06, 0, Math.min(z1, z2) - 0.06, Math.max(x1, x2) + 0.06, 2.3, Math.max(z1, z2) + 0.06);
  const horiz = Math.abs(x2 - x1) > Math.abs(z2 - z1);
  map_harbor_sg(C, 11, (x1 + x2) / 2 + (horiz ? 0 : 0.06), 1.5, (z1 + z2) / 2 + (horiz ? 0.06 : 0), horiz ? 0 : Math.PI / 2, 1.5, 0.5);
  map_harbor_sg(C, 10, (x1 + x2) / 2 - (horiz ? 0 : 0.06), 1.5, (z1 + z2) / 2 - (horiz ? 0.06 : 0), horiz ? Math.PI : -Math.PI / 2, 1.5, 0.5);
}
function map_harbor_lamp(C, x, z, dx, dz, h) {
  const kit = C.kit, M = C.M;
  h = h || 8;
  map_harbor_cyl(C, 'metalD', x, 0, z, 0.07, 0.13, h, 8);
  map_harbor_cyl(C, 'metalD', x, 0, z, 0.2, 0.24, 0.55, 8);
  map_harbor_tube(C, 'metalD', x, h, z, x + dx * 0.9, h + 0.38, z + dz * 0.9, 0.045, 5);
  map_harbor_tube(C, 'metalD', x + dx * 0.9, h + 0.38, z + dz * 0.9, x + dx * 1.8, h + 0.32, z + dz * 1.8, 0.045, 5);
  kit.box(x + dx * 1.95, h + 0.22, z + dz * 1.95, dx ? 0.8 : 0.34, 0.12, dx ? 0.34 : 0.8, M.metalD, { collide: false });
  kit.box(x + dx * 1.95, h + 0.17, z + dz * 1.95, dx ? 0.62 : 0.24, 0.05, dx ? 0.24 : 0.62, M.lamp, { collide: false });
  kit.collider(x - 0.14, 0, z - 0.14, x + 0.14, 3, z + 0.14);
}
function map_harbor_mast(C, x, z, h) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  map_harbor_lattice(C, 'metalD', [x, 0.3, z], [x, h, z], [1, 0, 0], [0, 0, 1], 0.4, Math.round(h / 2.2), 0.045);
  kit.box(x, 0, z, 1.4, 0.3, 1.4, M.concD, nc);
  kit.box(x, h, z, 2.8, 0.12, 1.3, M.metalD, nc);
  for (let i = -1; i <= 1; i++) for (let s = -1; s <= 1; s += 2) kit.box(x + i * 0.9, h + 0.12, z + s * 0.5, 0.62, 0.45, 0.14, M.lamp, nc);
  kit.box(x, h + 0.9, z, 0.2, 0.2, 0.2, M.redL, nc);
  kit.collider(x - 0.5, 0, z - 0.5, x + 0.5, h, z + 0.5);
}
function map_harbor_tree(C, x, z, h) {
  const lx = C.rand(-0.6, 0.6), lz = C.rand(-0.6, 0.6);
  map_harbor_tube(C, 'woodD', x, 0, z, x + lx * 0.35, h * 0.55, z + lz * 0.35, 0.22, 7, 0.16);
  map_harbor_tube(C, 'woodD', x + lx * 0.35, h * 0.55, z + lz * 0.35, x + lx, h, z + lz, 0.16, 6, 0.09);
  const n = 8 + Math.floor(C.rng() * 4);
  for (let i = 0; i < n; i++) {
    const a = C.rng() * 6.283, rr = C.rand(0.4, 1.9), cy = h + C.rand(-0.9, 1.5);
    const cx = x + lx + Math.cos(a) * rr, cz = z + lz + Math.sin(a) * rr;
    map_harbor_blob(C, 'leaf', cx, cy, cz, C.rand(1.0, 1.7), C.rand(0.7, 0.95), 0.22, 1);
    if (i < 4) map_harbor_tube(C, 'woodD', x + lx * 0.6, h * 0.7, z + lz * 0.6, cx, cy - 0.3, cz, 0.06, 4, 0.03);
  }
  C.kit.box(x, 0, z, 1.5, 0.16, 1.5, C.M.concD, { collide: false, rotY: C.rand(-0.05, 0.05) });
  C.kit.box(x, 0.16, z, 1.25, 0.03, 1.25, C.M.dirt, { collide: false });
  C.kit.collider(x - 0.25, 0, z - 0.25, x + 0.25, h, z + 0.25);
}
function map_harbor_bench(C, x, z, rot) {
  const F = map_harbor_frame(C, x, z, rot, 0), M = C.M;
  F.box(0, 0.42, 0, 1.8, 0.06, 0.45, M.wood);
  F.box(0, 0.62, 0.22, 1.8, 0.4, 0.05, M.wood);
  F.box(-0.75, 0, 0, 0.08, 0.42, 0.42, M.metalD); F.box(0.75, 0, 0, 0.08, 0.42, 0.42, M.metalD);
  F.col(0.9, 0.25, 0.5);
}
function map_harbor_dumpster(C, x, z, rot, key) {
  const F = map_harbor_frame(C, x, z, rot + C.rand(-0.06, 0.06), 0), M = C.M;
  F.box(0, 0.15, 0, 1.9, 1.05, 1.1, M[key]);
  F.box(0, 0.6, 0, 1.96, 0.1, 1.16, M.metalD);
  F.put('metalD', map_harbor_prof([[-0.58, 1.2], [0.58, 1.2], [0.58, 1.28], [-0.58, 1.45]], 1.96), 0, 0, 0);
  for (let i = 0; i < 4; i++) F.wheel((i % 2 ? 0.8 : -0.8), (i < 2 ? -0.42 : 0.42), 0.08, 0.06);
  F.col(0.98, 0.58, 1.4);
  map_harbor_dq(C, 9, x, z, 3.4, 3, rot);
}
function map_harbor_reel(C, x, z, rot) {
  const F = map_harbor_frame(C, x, z, rot, 0);
  F.tube('wood', -0.5, 0.75, 0, 0.5, 0.75, 0, 0.45, 12);
  F.tube('woodD', -0.58, 0.75, 0, -0.5, 0.75, 0, 0.75, 14);
  F.tube('woodD', 0.5, 0.75, 0, 0.58, 0.75, 0, 0.75, 14);
  F.col(0.6, 0.75, 1.5);
}
function map_harbor_coil(C, x, z) {
  for (let i = 0; i < 3; i++) map_harbor_put(C, 'sandbag', new THREE.TorusGeometry(0.42 - i * 0.03, 0.07, 6, 14), x, 0.07 + i * 0.13, z, C.rng() * 3, Math.PI / 2, 0, true);
}

// ---------------------------------------------------------------- container dipinti (tutti in 1 draw call)
// scatola da 6.1 x 2.6 x 2.6 m, lunga sull'asse X locale; ci = colore 0..4
function map_harbor_cbox(C, x, y, z, ry, ci) {
  const g = new THREE.BoxGeometry(6.1, map_harbor_H, 2.6), uv = g.attributes.uv;
  const face = function (i0, px, py, pw, ph, swap) {
    for (let i = i0; i < i0 + 4; i++) {
      let u = uv.getX(i), v = uv.getY(i);
      if (swap) { const t = u; u = v; v = t; }
      uv.setXY(i, (px + 1.5 + u * (pw - 3)) / 1024, 1 - (py + 1.5 + (1 - v) * (ph - 3)) / 1024);
    }
  };
  face(0, ci * 160, 800, 160, 224); face(4, ci * 160, 800, 160, 224);
  face(8, 800 + ci * 44, 800, 44, 224, true); face(12, 800 + ci * 44, 800, 44, 224, true);
  face(16, 0, ci * 160, 1024, 160); face(20, 0, ci * 160, 1024, 160);
  map_harbor_put(C, 'cont', g, x, y + map_harbor_H / 2, z, ry, 0, 0, true);
}
function map_harbor_cont(C, cx, y, cz, axisZ, ci, solid) {
  const jx = C.rand(-0.05, 0.05), jz = C.rand(-0.05, 0.05), ry = C.rand(-0.022, 0.022);
  map_harbor_cbox(C, cx + jx, y, cz + jz, (axisZ ? Math.PI / 2 : 0) + ry, ci);
  if (solid !== false) {
    const hx = axisZ ? 1.36 : 3.1, hz = axisZ ? 3.1 : 1.36;
    C.kit.collider(cx - hx, y, cz - hz, cx + hx, y + map_harbor_H, cz + hz);
  }
}

// ---------------------------------------------------------------- veicoli
function map_harbor_car(C, x, z, rot, key) {
  const M = C.M, F = map_harbor_frame(C, x, z, rot + C.rand(-0.05, 0.05), 0), mat = M[key];
  F.put(key, map_harbor_prof([[-2.15, 0.3], [2.15, 0.3], [2.15, 0.84], [1.95, 0.96], [-0.8, 0.96], [-2.0, 0.8], [-2.15, 0.62]], 1.8), 0, 0, 0);
  F.put('glass', map_harbor_prof([[-0.8, 0.96], [1.8, 0.96], [1.5, 1.44], [-0.1, 1.44]], 1.58), 0, 0, 0);
  F.box(0, 1.44, 0.7, 1.62, 0.06, 1.64, mat);
  for (let s = -1; s <= 1; s += 2) {
    F.box(s * 0.79, 0.96, 0.7, 0.05, 0.48, 0.12, mat);
    F.box(s * 0.97, 0.98, -0.62, 0.16, 0.1, 0.08, mat);
    F.box(s * 0.62, 0.58, -2.16, 0.38, 0.14, 0.05, M.lamp);
    F.box(s * 0.66, 0.66, 2.16, 0.32, 0.12, 0.05, M.redL);
    F.wheel(s * 0.86, -1.35, 0.33, 0.24);
    F.wheel(s * 0.86, 1.35, 0.33, 0.24);
    F.box(s * 0.905, 0.72, 0.1, 0.02, 0.04, 0.16, M.metal);
  }
  F.box(0, 0.3, -2.19, 1.84, 0.17, 0.14, M.metalD); F.box(0, 0.3, 2.19, 1.84, 0.17, 0.14, M.metalD);
  F.box(0, 0.5, -2.165, 0.9, 0.2, 0.04, M.metalD);
  F.box(0, 0.42, 2.2, 0.5, 0.12, 0.03, M.white);
  if (C.rng() < 0.35) { F.tube('metalD', -0.7, 1.56, 0.1, 0.7, 1.56, 0.1, 0.02, 4); F.tube('metalD', -0.7, 1.56, 1.3, 0.7, 1.56, 1.3, 0.02, 4); F.box(0, 1.58, 0.7, 1.0, 0.3, 0.8, M.card); }
  F.col(0.92, 2.2, 1.45);
  map_harbor_dq(C, 0, F.wx(0, -1.2), F.wz(0, -1.2), 1.8, 1.8, C.rng() * 6.28);
}
function map_harbor_truck(C, x, z, rot, ci, cabKey) {
  const M = C.M, F = map_harbor_frame(C, x, z, rot + C.rand(-0.03, 0.03), 0), cab = M[cabKey];
  F.put(cabKey, map_harbor_prof([[-6.1, 0.55], [-3.9, 0.55], [-3.9, 3.0], [-5.6, 3.0], [-6.0, 2.3], [-6.1, 1.5]], 2.4), 0, 0, 0);
  F.put(cabKey, map_harbor_prof([[-5.6, 3.0], [-3.95, 3.0], [-3.95, 3.7]], 2.3), 0, 0, 0);
  F.box(0, 1.58, -6.07, 2.1, 0.7, 0.06, M.glass);
  F.box(0, 0.5, -6.15, 2.44, 0.36, 0.18, M.metalD);
  F.box(0, 0.95, -6.11, 1.5, 0.5, 0.05, M.metalD);
  F.box(0, 0.55, 0.6, 1.0, 0.3, 12.4, M.metalD);
  F.box(0, 0.95, 1.9, 2.5, 0.2, 9.6, M.metalD);
  map_harbor_cbox(C, F.wx(0, 3.5), 1.15, F.wz(0, 3.5), F.rot + Math.PI / 2, ci);
  F.box(-0.4, 1.15, -1.5, 1.3, 1.0, 1.4, M.wood, false, 0.1);
  F.box(0.6, 1.15, -0.3, 0.9, 0.7, 0.9, M.card, false, -0.2);
  F.box(-0.4, 2.15, -1.5, 1.4, 0.05, 1.5, M.tarp, false, 0.1);
  for (let s = -1; s <= 1; s += 2) {
    F.box(s * 1.21, 1.6, -5.0, 0.04, 0.7, 1.2, M.glass);
    F.box(s * 1.42, 1.9, -5.8, 0.1, 0.5, 0.2, cab);
    F.tube('metalD', s * 1.2, 2.1, -5.8, s * 1.42, 2.1, -5.8, 0.02, 4);
    F.box(s * 0.85, 0.72, -6.16, 0.4, 0.16, 0.05, M.lamp);
    F.box(s * 0.95, 0.75, 6.56, 0.4, 0.16, 0.05, M.redL);
    F.wheel(s * 1.06, -5.0, 0.52, 0.36);
    F.wheel(s * 1.0, -2.4, 0.52, 0.6);
    F.wheel(s * 1.0, 4.6, 0.52, 0.6);
    F.wheel(s * 1.0, 5.8, 0.52, 0.6);
    F.box(s * 1.0, 0.2, 6.5, 0.6, 0.6, 0.04, M.rubber);
    F.box(s * 1.22, 1.15, -2.8, 0.06, 0.9, 0.1, M.metalD);
    F.box(s * 1.22, 1.15, 0.2, 0.06, 0.9, 0.1, M.metalD);
  }
  F.tube('metal', -1.05, 0.8, -3.7, -1.05, 0.8, -2.95, 0.3, 10);
  F.tube('metal', 1.05, 0.9, -3.8, 1.05, 3.6, -3.8, 0.08, 6);
  F.box(0, 0.5, 6.6, 2.4, 0.14, 0.12, M.metalD);
  F.col(1.28, 6.45, 3.75, 0.25);
  map_harbor_dq(C, 1, F.wx(0, -4), F.wz(0, -4), 3, 3, C.rng() * 6.28);
}
function map_harbor_forklift(C, x, z, rot) {
  const M = C.M, F = map_harbor_frame(C, x, z, rot + C.rand(-0.05, 0.05), 0);
  F.box(0, 0.28, 0.4, 1.15, 0.75, 1.7, M.crane);
  F.box(0, 0.3, 1.45, 1.15, 0.9, 0.5, M.metalD);
  F.box(0, 1.03, 0.75, 0.5, 0.1, 0.5, M.rubber); F.box(0, 1.13, 1.0, 0.5, 0.45, 0.08, M.rubber);
  for (let i = 0; i < 4; i++) F.box((i % 2 ? 0.52 : -0.52), 1.03, (i < 2 ? 0.0 : 1.15), 0.06, 1.1, 0.06, M.metalD);
  F.box(0, 2.13, 0.58, 1.16, 0.06, 1.3, M.metalD);
  F.tube('metalD', 0, 1.0, 0.25, 0, 1.45, 0.42, 0.025, 4);
  F.box(0, 1.42, 0.42, 0.34, 0.04, 0.1, M.rubber);
  for (let s = -1; s <= 1; s += 2) {
    F.box(s * 0.32, 0.1, -0.62, 0.1, 2.3, 0.14, M.metalD);
    F.box(s * 0.3, 0.06, -1.3, 0.12, 0.05, 1.15, M.metal);
    F.wheel(s * 0.56, -0.3, 0.3, 0.22);
    F.wheel(s * 0.5, 1.15, 0.24, 0.2);
  }
  F.box(0, 2.3, -0.62, 0.8, 0.1, 0.14, M.metalD);
  F.box(0, 0.5, -0.72, 0.9, 0.5, 0.06, M.metalD);
  F.box(0, 2.19, 0.95, 0.16, 0.12, 0.16, M.signO);
  F.col(0.62, 1.15, 2.15, 0.3);
}

// ---------------------------------------------------------------- arredi interni
function map_harbor_rack(C, cx, y0, cz, alongX) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  const len = 2.4, dep = 0.95, hgt = 2.9, w = alongX ? len : dep, d = alongX ? dep : len;
  for (let i = 0; i < 4; i++) kit.box(cx + (i % 2 ? 1 : -1) * (w / 2 - 0.04), y0, cz + (i < 2 ? -1 : 1) * (d / 2 - 0.04), 0.08, hgt, 0.08, M.blue, nc);
  for (let l = 0; l < 3; l++) {
    const y = y0 + 0.2 + l * 1.05, k = 2 + Math.floor(C.rng() * 2);
    kit.box(cx, y, cz, w, 0.07, d, M.crane, nc);
    for (let j = 0; j < k; j++) {
      const off = ((j + 0.5) / k - 0.5) * (len - 0.3), s = C.rand(0.45, 0.85);
      const gx = alongX ? cx + off : cx + C.rand(-0.08, 0.08), gz = alongX ? cz + C.rand(-0.08, 0.08) : cz + off;
      if (C.rng() < 0.5) C.I.carton.push(map_harbor_mat4(gx, y + 0.07 + s / 2, gz, 0.62, s, 0.62, C.rand(-0.15, 0.15)));
      else kit.box(gx, y + 0.07, gz, 0.66, s, 0.66, C.pick(M.goods), { collide: false, rotY: C.rand(-0.08, 0.08) });
    }
  }
  kit.collider(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + hgt, cz + d / 2);
}
function map_harbor_desk(C, x, y0, z, alongX, face) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  const w = alongX ? 1.6 : 0.75, d = alongX ? 0.75 : 1.6;
  kit.box(x, y0, z, w, 0.7, d, M.woodD, { collide: true });
  kit.box(x, y0 + 0.7, z, w + 0.08, 0.05, d + 0.08, M.wood, nc);
  const cx = alongX ? x : x + face * 0.78, cz = alongX ? z + face * 0.78 : z;
  kit.box(cx, y0, cz, 0.08, 0.42, 0.08, M.metalD, nc);
  kit.box(cx, y0 + 0.42, cz, 0.46, 0.07, 0.46, M.tarp, nc);
  kit.box(alongX ? cx : cx + face * 0.22, y0 + 0.49, alongX ? cz + face * 0.22 : cz, alongX ? 0.46 : 0.06, 0.5, alongX ? 0.06 : 0.46, M.tarp, nc);
  const mx = alongX ? x + 0.2 : x - face * 0.18, mz = alongX ? z - face * 0.18 : z + 0.2;
  kit.box(mx, y0 + 0.75, mz, 0.1, 0.12, 0.1, M.metalD, nc);
  kit.box(mx, y0 + 0.85, mz, alongX ? 0.56 : 0.04, 0.36, alongX ? 0.04 : 0.56, M.screen, nc);
  kit.box(alongX ? x - 0.45 : x, y0 + 0.75, alongX ? z : z - 0.45, 0.3, 0.02, 0.22, M.white, { collide: false, rotY: C.rand(-0.4, 0.4) });
  C.I.carton.push(map_harbor_mat4(alongX ? x - 0.55 : x + face * 0.1, y0 + 0.84, alongX ? z - face * 0.1 : z - 0.6, 0.22, 0.18, 0.3, C.rand(0, 1)));
}
function map_harbor_bunk(C, x, y0, z, alongX) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  const w = alongX ? 2.0 : 0.9, d = alongX ? 0.9 : 2.0;
  for (let i = 0; i < 4; i++) kit.box(x + (i % 2 ? 1 : -1) * (w / 2 - 0.04), y0, z + (i < 2 ? -1 : 1) * (d / 2 - 0.04), 0.06, 1.85, 0.06, M.metalD, nc);
  for (let l = 0; l < 2; l++) {
    kit.box(x, y0 + 0.35 + l * 1.05, z, w, 0.08, d, M.metalD, nc);
    kit.box(x, y0 + 0.43 + l * 1.05, z, w - 0.1, 0.14, d - 0.1, l ? M.red : M.tarp, nc);
    kit.box(alongX ? x - 0.72 : x, y0 + 0.57 + l * 1.05, alongX ? z : z - 0.72, 0.42, 0.1, 0.42, M.white, nc);
  }
  kit.collider(x - w / 2, y0, z - d / 2, x + w / 2, y0 + 1.85, z + d / 2);
}
function map_harbor_table(C, x, y0, z, w, d, seats) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  kit.box(x, y0 + 0.7, z, w, 0.06, d, M.wood, nc);
  for (let i = 0; i < 4; i++) kit.box(x + (i % 2 ? 1 : -1) * (w / 2 - 0.08), y0, z + (i < 2 ? -1 : 1) * (d / 2 - 0.08), 0.07, 0.7, 0.07, M.metalD, nc);
  kit.collider(x - w / 2, y0, z - d / 2, x + w / 2, y0 + 0.76, z + d / 2);
  const per = Math.ceil(seats / 2);
  for (let i = 0; i < seats; i++) {
    const s = i % 2 ? 1 : -1, off = (Math.floor(i / 2) - (per - 1) / 2) * 0.8;
    const sx = w >= d ? x + off : x + s * (w / 2 + 0.36), sz = w >= d ? z + s * (d / 2 + 0.36) : z + off;
    kit.box(sx, y0, sz, 0.3, 0.45, 0.3, M.metalD, nc);
    kit.box(sx, y0 + 0.45, sz, 0.4, 0.05, 0.4, M.red, nc);
  }
  kit.box(x + C.rand(-0.2, 0.2), y0 + 0.76, z + C.rand(-0.12, 0.12), 0.3, 0.03, 0.22, M.white, { collide: false, rotY: C.rand(0, 1) });
  C.I.carton.push(map_harbor_mat4(x + C.rand(-0.4, 0.4), y0 + 0.84, z + C.rand(-0.1, 0.1), 0.16, 0.16, 0.16, C.rand(0, 1)));
}
function map_harbor_counter(C, x, y0, z, len, alongX) {
  const kit = C.kit, M = C.M;
  kit.box(x, y0, z, alongX ? len : 0.7, 1.05, alongX ? 0.7 : len, M.woodD, { collide: true });
  kit.box(x, y0 + 1.05, z, alongX ? len + 0.12 : 0.86, 0.06, alongX ? 0.86 : len + 0.12, M.wood, { collide: false });
  kit.box(x, y0 + 0.08, z, alongX ? len + 0.02 : 0.72, 0.1, alongX ? 0.72 : len + 0.02, M.metalD, { collide: false });
}
function map_harbor_lockers(C, x, y0, z, n, alongX) {
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 0.52, m = i % 2 ? C.M.blue : C.M.metalD;
    C.kit.box(alongX ? x + o : x, y0, alongX ? z : z + o, alongX ? 0.5 : 0.42, 1.9, alongX ? 0.42 : 0.5, m, { collide: false });
  }
}
function map_harbor_sofa(C, x, y0, z, alongX, face) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  kit.box(x, y0, z, alongX ? 1.9 : 0.8, 0.42, alongX ? 0.8 : 1.9, M.tarp, nc);
  kit.box(alongX ? x : x - face * 0.32, y0 + 0.42, alongX ? z - face * 0.32 : z, alongX ? 1.9 : 0.18, 0.42, alongX ? 0.18 : 1.9, M.tarp, nc);
  for (let s = -1; s <= 1; s += 2) kit.box(alongX ? x + s * 0.88 : x, y0 + 0.42, alongX ? z : z + s * 0.88, alongX ? 0.16 : 0.8, 0.2, alongX ? 0.8 : 0.16, M.tarp, nc);
}

// ---------------------------------------------------------------- scale e file di container
// scala industriale (pedate, cosciali, corrimano, gambe controventate); (tx,tz) = arrivo in alto
function map_harbor_stair(C, tx, tz, dir, width, rise) {
  const kit = C.kit, M = C.M;
  const n = Math.ceil(rise / 0.29), sh = rise / n, sd = 0.4, run = n * sd;
  const dx = dir === 'e' ? 1 : dir === 'w' ? -1 : 0, dz = dir === 's' ? 1 : dir === 'n' ? -1 : 0;
  const fx = tx - dx * run, fz = tz - dz * run, px = dz ? 1 : 0, pz = dx ? 1 : 0;
  const hx = dx ? sd / 2 : width / 2, hz = dz ? sd / 2 : width / 2;
  for (let i = 0; i < n; i++) {
    const off = (i + 0.5) * sd, cx = fx + dx * off, cz = fz + dz * off, top = sh * (i + 1);
    kit.box(cx, top - 0.05, cz, hx * 2, 0.05, hz * 2, M.metal, { collide: false });
    kit.collider(cx - hx, 0, cz - hz, cx + hx, top, cz + hz);
  }
  const hw = width / 2 + 0.04, np = Math.max(2, Math.round(run / 1.8));
  for (let s = -1; s <= 1; s += 2) {
    const ox = px * hw * s, oz = pz * hw * s;
    map_harbor_tube(C, 'metalD', fx + ox, 0.02, fz + oz, tx + ox, rise - 0.04, tz + oz, 0.07, 4);
    map_harbor_tube(C, 'crane', fx + ox, 1.0, fz + oz, tx + ox, rise + 1.0, tz + oz, 0.035, 4);
    map_harbor_tube(C, 'crane', fx + ox, 0.55, fz + oz, tx + ox, rise + 0.55, tz + oz, 0.02, 4);
    let lx = 0, lz = 0, has = false;
    for (let j = 0; j <= np; j++) {
      const t = j / np, qx = fx + dx * run * t + ox, qz = fz + dz * run * t + oz, qy = rise * t;
      map_harbor_tube(C, 'crane', qx, qy, qz, qx, qy + 1.0, qz, 0.025, 4);
      if (qy > 0.5) {
        map_harbor_tube(C, 'metalD', qx, 0, qz, qx, qy, qz, 0.05, 4);
        if (has) map_harbor_tube(C, 'metalD', lx, 0.1, lz, qx, qy - 0.1, qz, 0.03, 4);
        lx = qx; lz = qz; has = true;
      }
    }
  }
  kit.nav(fx - dx * 0.9, 0, fz - dz * 0.9);
  kit.nav((fx + tx) / 2, rise / 2, (fz + tz) / 2);
  map_harbor_dq(C, 13, fx - dx * 0.9, fz - dz * 0.9, 1.6, 1.6, dx ? Math.PI / 2 : 0);
}
function map_harbor_row(C, r) {
  const kit = C.kit, M = C.M, H = map_harbor_H, L = map_harbor_L, ax = r.axis === 'z';
  for (let i = 0; i < r.n; i++) {
    const cx = ax ? r.x : r.x + i * L, cz = ax ? r.z + i * L : r.z, top = r.lv[i] * H;
    for (let k = 0; k < r.lv[i]; k++) map_harbor_cont(C, cx, k * H, cz, ax, C.pick(map_harbor_CI));
    const g = C.rng();
    if (g < 0.25) kit.box(cx, top, cz, ax ? 2.3 : 3.2, 0.06, ax ? 3.2 : 2.3, M.tarp, { collide: false, rotY: C.rand(-0.1, 0.1) });
    else if (g < 0.45) C.I.tireF.push(map_harbor_mat4(cx + C.rand(-0.6, 0.6), top + 0.13, cz + C.rand(-0.6, 0.6), 1, 1, 1, 0));
    else if (g < 0.6) map_harbor_crate(C, cx + C.rand(-0.5, 0.5), top, cz + C.rand(-0.5, 0.5), 0.9, true);
    if (C.rng() < 0.5) map_harbor_dq(C, 2, cx + C.rand(-2, 2), cz + (ax ? 0 : 1.6) * (C.rng() < 0.5 ? -1 : 1), 2.4, 1.8, C.rng() * 6.28);
  }
  if (!r.stair) return;
  const first = r.stair === 'L', idx = first ? 0 : r.n - 1, lv = r.lv[idx], sgn = first ? -1 : 1;
  const cxs = ax ? r.x : r.x + idx * L, czs = ax ? r.z + idx * L : r.z;
  const ex = ax ? cxs : cxs + sgn * 3.05, ez = ax ? czs + sgn * 3.05 : czs;
  map_harbor_stair(C, ex, ez, ax ? (first ? 's' : 'n') : (first ? 'e' : 'w'), 1.3, lv * H);
  for (let t = 0; t < r.n; t++) {
    const i2 = first ? t : r.n - 1 - t;
    if (r.lv[i2] !== lv) break;
    kit.nav(ax ? r.x : r.x + i2 * L, lv * H, ax ? r.z + i2 * L : r.z);
  }
}
// container aperto ed entrabile (asse lungo = Z locale; lato aperto = +Z locale)
function map_harbor_openbox(C, x, z, rot, key) {
  const M = C.M, F = map_harbor_frame(C, x, z, rot, 0), mat = M[key], H = map_harbor_H, L = 6.1, W = 2.6, t = 0.1;
  F.box(0, 0, 0, W, 0.14, L, M.woodD, true);
  F.box(0, H - t, 0, W, t, L, mat, true);
  F.box(-W / 2 + t / 2, 0.14, 0, t, H - 0.14 - t, L, mat, true);
  F.box(W / 2 - t / 2, 0.14, 0, t, H - 0.14 - t, L, mat, true);
  F.box(0, 0.14, -L / 2 + t / 2, W - 2 * t, H - 0.14 - t, t, mat, true);
  F.box(-W / 2 - 0.5, 0.14, L / 2 + 0.32, 1.25, H - 0.3, 0.06, mat, false, 1.1);
  F.box(W / 2 + 0.5, 0.14, L / 2 + 0.32, 1.25, H - 0.3, 0.06, mat, false, -1.1);
  F.box(0, H - t - 0.06, -0.5, 0.16, 0.05, 1.4, M.lamp);
  F.box(-0.7, 0.14, -2.3, 0.9, 0.8, 0.9, M.card); F.box(0.5, 0.14, -2.4, 0.8, 0.6, 0.8, M.wood, false, 0.2);
  F.box(-0.75, 0.94, -2.3, 0.6, 0.5, 0.6, M.card, false, 0.3);
  for (let a = -1; a <= 1; a += 2) for (let b = -1; b <= 1; b += 2) F.box(a * (W / 2 - 0.05), 0, b * (L / 2 - 0.05), 0.17, H + 0.02, 0.17, M.metalD);
  for (let k = -2; k <= 2; k++) for (let s = -1; s <= 1; s += 2) F.box(s * (W / 2 + 0.02), 0.2, k * 1.2, 0.05, H - 0.4, 0.08, mat);
}

// ---------------------------------------------------------------- gru portuali (punto eroe)
function map_harbor_crane(C, zc, tx, hangY) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  const XL = 36, XW = 45, ZS = 4.5, TOP = 26, xs = [XL, XW];
  for (let a = 0; a < 2; a++) {
    const x = xs[a];
    for (let s = -1; s <= 1; s += 2) {
      const z = zc + s * ZS;
      kit.box(x, 0.9, z, 1.2, TOP - 0.9, 1.2, M.crane, { collide: true });
      kit.box(x, 0.25, z, 1.7, 0.65, 2.6, M.metalD, { collide: true });
      kit.box(x, 2.2, z, 1.34, 0.45, 1.34, M.metalD, nc);
      kit.box(x, 3.1, z, 1.34, 0.45, 1.34, M.metalD, nc);
      for (let w = -1; w <= 1; w += 2) C.I.wheel.push(map_harbor_mat4(x, 0.3, z + w * 0.8, 0.5, 0.3, 0.3, 0));
    }
    kit.box(x, 3.6, zc, 0.9, 1.0, 2 * ZS - 1.2, M.crane, nc);
    kit.box(x, 14, zc, 0.7, 0.7, 2 * ZS - 1.2, M.crane, nc);
    kit.box(x, TOP - 1.2, zc, 0.9, 1.2, 2 * ZS - 1.2, M.crane, nc);
    map_harbor_tube(C, 'crane', x, 4.6, zc - ZS, x, 14, zc + ZS, 0.16, 6);
    map_harbor_tube(C, 'crane', x, 4.6, zc + ZS, x, 14, zc - ZS, 0.16, 6);
    map_harbor_tube(C, 'crane', x, 14.7, zc - ZS, x, TOP - 1.2, zc + ZS, 0.14, 6);
    map_harbor_tube(C, 'crane', x, 14.7, zc + ZS, x, TOP - 1.2, zc - ZS, 0.14, 6);
  }
  for (let s = -1; s <= 1; s += 2) {
    const z = zc + s * ZS, zb = zc + s * 2.2, za = zc + s * 0.6;
    kit.box(40.5, 12.5, z, XW - XL - 1.2, 0.9, 0.8, M.crane, nc);
    kit.box(40.5, TOP - 1.0, z, XW - XL - 1.2, 1.0, 0.8, M.crane, nc);
    map_harbor_tube(C, 'crane', XL, 13.4, z, XW, TOP - 1, z, 0.14, 6);
    map_harbor_tube(C, 'crane', XW, 4.6, z, XL, 12.5, z, 0.14, 6);
    kit.box(43, TOP, zb, 46, 1.5, 0.8, M.crane, nc);
    map_harbor_tube(C, 'white', 20, TOP + 2.5, zb + s * 0.5, 66, TOP + 2.5, zb + s * 0.5, 0.04, 4);
    for (let x = 20; x <= 66; x += 4.6) map_harbor_tube(C, 'white', x, TOP + 1.5, zb + s * 0.5, x, TOP + 2.5, zb + s * 0.5, 0.03, 4);
    map_harbor_tube(C, 'crane', XL, TOP, z, 40.5, 42, za, 0.28, 8);
    map_harbor_tube(C, 'crane', XW, TOP, z, 40.5, 42, za, 0.28, 8);
    map_harbor_tube(C, 'metalD', 40.5, 42, za, 65, TOP + 1.5, zb, 0.07, 5);
    map_harbor_tube(C, 'metalD', 40.5, 42, za, 54, TOP + 1.5, zb, 0.07, 5);
    map_harbor_tube(C, 'metalD', 40.5, 42, za, 21, TOP + 1.5, zb, 0.07, 5);
    map_harbor_tube(C, 'rubber', tx + 1.1, TOP - 1.3, zc + s * 2.0, tx + 1.1, hangY + map_harbor_H + 0.3, zc + s * 2.9, 0.03, 4);
    map_harbor_tube(C, 'rubber', tx - 1.1, TOP - 1.3, zc + s * 2.0, tx - 1.1, hangY + map_harbor_H + 0.3, zc + s * 2.9, 0.03, 4);
  }
  for (let x = 21; x <= 65; x += 4) kit.box(x, TOP + 0.4, zc, 0.4, 0.5, 3.8, M.crane, nc);
  for (let x = 26; x <= 62; x += 12) kit.box(x, TOP - 0.2, zc + 2.2, 0.7, 0.15, 0.5, M.lamp, nc);
  kit.box(40.5, 41.7, zc, 1.4, 0.7, 2.2, M.crane, nc);
  kit.box(40.5, 42.5, zc, 0.35, 0.35, 0.35, M.redL, nc);
  kit.box(66.2, TOP + 1.6, zc, 0.3, 0.3, 0.3, M.redL, nc);
  kit.box(19.8, TOP + 1.6, zc, 0.3, 0.3, 0.3, M.redL, nc);
  // sala macchine
  kit.box(28, TOP + 1.5, zc, 9, 3.6, 5.6, M.white, nc);
  kit.box(28, TOP + 5.1, zc, 9.4, 0.2, 6.0, M.metalD, nc);
  kit.box(28, TOP + 2.2, zc, 9.06, 0.5, 5.66, M.red, nc);
  kit.box(23.45, TOP + 2.9, zc, 0.1, 1.2, 3.4, M.winLit, nc);
  kit.box(30, TOP + 5.3, zc - 1, 1.6, 0.8, 1.2, M.metal, nc);
  kit.box(26, TOP + 5.3, zc + 1.2, 1.1, 0.6, 1.0, M.metal, nc);
  // carrello, cabina operatore, spreader con container appeso
  kit.box(tx, TOP - 1.3, zc, 3.4, 1.2, 5.2, M.metalD, nc);
  kit.box(tx - 1.2, TOP - 3.6, zc + 1.9, 2.2, 2.3, 2.0, M.white, nc);
  kit.box(tx - 2.32, TOP - 3.2, zc + 1.9, 0.06, 1.3, 1.7, M.winLit, nc);
  kit.box(tx - 1.2, TOP - 3.72, zc + 1.9, 1.6, 0.1, 1.6, M.glass, nc);
  kit.box(tx, hangY + map_harbor_H, zc, 2.5, 0.3, 6.2, M.crane, nc);
  map_harbor_cbox(C, tx, hangY, zc, Math.PI / 2, C.pick(map_harbor_CI));
  // scala a zig-zag sulla gamba lato terra
  const lz = zc - ZS;
  for (let k = 1; k <= 5; k++) {
    const y = k * 4.2, dz = k % 2 ? 1 : -1;
    kit.box(34.7, y, lz, 1.2, 0.08, 2.8, M.metal, nc);
    map_harbor_beam(C, 'metalD', 34.7, y - 4.2, lz - dz * 1.2, 34.7, y, lz + dz * 1.2, 0.6, 0.06);
    map_harbor_tube(C, 'white', 34.12, y + 1, lz - 1.4, 34.12, y + 1, lz + 1.4, 0.025, 4);
    map_harbor_tube(C, 'white', 34.12, y, lz - 1.4, 34.12, y + 1, lz - 1.4, 0.025, 4);
    map_harbor_tube(C, 'white', 34.12, y, lz + 1.4, 34.12, y + 1, lz + 1.4, 0.025, 4);
  }
  // targhe e zona di pericolo a strisce sotto la gru
  map_harbor_sg(C, 13, 35.38, 2.0, zc - ZS, -Math.PI / 2, 1.5, 0.5);
  map_harbor_sg(C, 14, 35.38, 2.0, zc + ZS, -Math.PI / 2, 1.8, 0.48);
  for (let k = -2; k <= 2; k++) { map_harbor_dq(C, 13, 40.5 + k * 2, zc - 2.9, 2, 2, 0); map_harbor_dq(C, 13, 40.5 + k * 2, zc + 2.9, 2, 2, 0); }
  map_harbor_dq(C, 1, 37, zc + 1, 3.4, 3.4, C.rng() * 6.28);
  map_harbor_dq(C, 2, 44.2, zc - 1, 3, 3, C.rng() * 6.28);
}

// ---------------------------------------------------------------- nave cargo
function map_harbor_winrow(C, x0, z0, x1, z1, y, n, w, h, pLit) {
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    (C.rng() < pLit ? C.I.winLit : C.I.winDark).push(map_harbor_mat4(x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, alongX ? w : 0.1, h, alongX ? 0.1 : w, 0));
  }
}
function map_harbor_hulluv(g) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const along = Math.abs(n.getX(i)) >= Math.abs(n.getZ(i)) ? p.getZ(i) : p.getX(i);
    uv.setXY(i, along / 44, Math.min(0.995, Math.max(0.005, p.getY(i) / 12.5)));
  }
}
function map_harbor_ship(C) {
  const kit = C.kit, M = C.M, nc = { collide: false }, H = map_harbor_H;
  const hull = [[51, 52], [51, -36], [52.2, -46], [55, -55], [59, -61], [63, -55], [65.8, -46], [67, -36], [67, 52], [65, 56], [53, 56]];
  const gh = map_harbor_plan(hull, 10);
  map_harbor_hulluv(gh);
  map_harbor_put(C, 'hull', gh, 0, 0, 0, 0, 0, 0, true);
  map_harbor_put(C, 'metalD', map_harbor_plan(hull, 0.25), 0, 10, 0);
  const bow = [[51.3, -39], [52.2, -46], [55, -55], [59, -61], [63, -55], [65.8, -46], [66.7, -39]];
  const gb = map_harbor_plan(bow, 2.2);
  gb.translate(0, 10.25, 0);
  map_harbor_hulluv(gb);
  map_harbor_put(C, 'hull', gb, 0, 0, 0, 0, 0, 0, true);
  map_harbor_put(C, 'metalD', map_harbor_plan(bow, 0.15), 0, 12.45, 0);
  kit.collider(51, 0, -36, 67, 10.25, 56);
  kit.collider(52.4, 0, -46, 65.6, 12.6, -36);
  kit.collider(55, 0, -55, 63, 12.6, -46);
  kit.collider(57.6, 0, -60, 60.4, 12.6, -55);
  kit.collider(52, 10.25, 38.5, 66, 25, 52);
  // carico sul ponte (due container da 20 piedi in fila per ogni posto)
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 6; iz++) {
    if (C.rng() < 0.07) continue;
    const lv = 1 + Math.floor(C.rng() * 3);
    for (let k = 0; k < lv; k++) for (let h = -1; h <= 1; h += 2) {
      map_harbor_cbox(C, 53.6 + ix * 2.72, 10.25 + k * H, -31 + iz * 12.4 + h * 3.06, Math.PI / 2 + C.rand(-0.008, 0.008), C.pick(map_harbor_CI));
    }
  }
  for (let i = 0; i < 5; i++) kit.box(59, 10.25, -24.8 + i * 12.4, 14.6, 6.4, 0.24, M.metalD, nc);
  // castello di poppa a gradoni
  const T = [[14, 3, 13, 45], [13, 3, 11.4, 45.6], [12, 3, 10, 46.2], [11, 3, 9, 46.6]];
  let y = 10.25;
  for (let i = 0; i < T.length; i++) {
    const t = T[i], x0 = 59 - t[0] / 2, z0 = t[3] - t[2] / 2, ex = t[0] + 0.9, ez = t[2] + 0.9;
    kit.box(59, y, t[3], t[0], t[1], t[2], M.white, nc);
    kit.box(59, y + t[1] - 0.08, t[3], ex, 0.1, ez, M.metalD, nc);
    map_harbor_winrow(C, x0 + 0.6, z0 - 0.03, x0 + t[0] - 0.6, z0 - 0.03, y + 1.7, 7, 0.75, 0.8, 0.55);
    map_harbor_winrow(C, x0 - 0.03, z0 + 0.6, x0 - 0.03, z0 + t[2] - 0.6, y + 1.7, 6, 0.75, 0.8, 0.55);
    const rx0 = x0 - 0.45, rz0 = z0 - 0.45, ry = y + t[1] + 0.02;
    map_harbor_tube(C, 'white', rx0, ry + 1, rz0, rx0 + ex, ry + 1, rz0, 0.03, 4);
    map_harbor_tube(C, 'white', rx0, ry + 1, rz0, rx0, ry + 1, rz0 + ez, 0.03, 4);
    for (let k = 0; k <= 6; k++) {
      map_harbor_tube(C, 'white', rx0 + k * ex / 6, ry, rz0, rx0 + k * ex / 6, ry + 1, rz0, 0.025, 4);
      map_harbor_tube(C, 'white', rx0, ry, rz0 + k * ez / 6, rx0, ry + 1, rz0 + k * ez / 6, 0.025, 4);
    }
    y += t[1];
  }
  kit.box(59, y, 44.6, 17, 2.8, 5, M.white, nc);
  kit.box(59, y + 1.15, 42.06, 16.4, 1.0, 0.08, M.winLit, nc);
  kit.box(50.46, y + 1.15, 44.6, 0.08, 1.0, 4.2, M.winLit, nc);
  kit.box(67.54, y + 1.15, 44.6, 0.08, 1.0, 4.2, M.winLit, nc);
  kit.box(59, y + 2.8, 44.6, 17.6, 0.14, 5.6, M.metalD, nc);
  kit.box(50.6, y + 3.05, 43, 0.25, 0.25, 0.25, M.redL, nc);
  kit.box(67.4, y + 3.05, 43, 0.25, 0.25, 0.25, M.greenL, nc);
  // fumaiolo, albero radar, scialuppe
  map_harbor_cyl(C, 'red', 59, y, 49.6, 1.7, 2.0, 7.5, 16);
  map_harbor_cyl(C, 'white', 59, y + 4.95, 49.6, 1.78, 1.82, 1.1, 16);
  map_harbor_cyl(C, 'metalD', 59, y + 7.5, 49.6, 1.5, 1.72, 0.9, 16);
  map_harbor_tube(C, 'metalD', 58.5, y + 8.3, 49.6, 58.5, y + 9.6, 49.9, 0.18, 6);
  map_harbor_tube(C, 'metalD', 59.5, y + 8.3, 49.6, 59.5, y + 9.3, 49.9, 0.14, 6);
  map_harbor_tube(C, 'white', 59, y + 2.9, 44, 59, y + 10.8, 44, 0.12, 6, 0.06);
  map_harbor_tube(C, 'white', 57.4, y + 7.2, 44, 60.6, y + 7.2, 44, 0.05, 4);
  map_harbor_tube(C, 'white', 58, y + 9.2, 44, 60, y + 9.2, 44, 0.04, 4);
  kit.box(59, y + 10.2, 44, 2.2, 0.14, 0.25, M.metalD, { collide: false, rotY: 0.5 });
  kit.box(59, y + 10.85, 44, 0.22, 0.22, 0.22, M.redL, nc);
  for (let s = -1; s <= 1; s += 2) {
    map_harbor_put(C, 'crane', new THREE.SphereGeometry(1, 10, 8).scale(1, 0.8, 2.6), 59 + s * 8.0, 15.2, 45.6, 0, 0, 0, true);
    map_harbor_tube(C, 'white', 59 + s * 6.8, 13.3, 43.8, 59 + s * 8.0, 16.6, 43.8, 0.06, 5);
    map_harbor_tube(C, 'white', 59 + s * 6.8, 13.3, 47.4, 59 + s * 8.0, 16.6, 47.4, 0.06, 5);
  }
  // prua: argano, albero, cavo bandiere
  kit.box(59, 12.6, -47, 4, 1.1, 3, M.metalD, nc);
  map_harbor_cyl(C, 'metalD', 57, 12.6, -43, 0.25, 0.3, 0.7, 8);
  map_harbor_cyl(C, 'metalD', 61, 12.6, -43, 0.25, 0.3, 0.7, 8);
  map_harbor_tube(C, 'white', 59, 12.6, -52, 59, 19.6, -52, 0.1, 6, 0.05);
  kit.box(59, 19.6, -52, 0.22, 0.22, 0.22, M.redL, nc);
  map_harbor_sag(C, 'rubber', 59, y + 10.6, 44, 59, 19.5, -52, 3, 0.03);
  for (let k = 1; k < 12; k++) {
    const t = k / 12, fy = y + 10.6 + (19.5 - y - 10.6) * t - 12 * t * (1 - t);
    kit.box(59, fy - 0.6, 44 - 96 * t, 0.03, 0.55, 0.7, [M.red, M.crane, M.blue, M.white][k % 4], nc);
  }
  // parapetto del ponte lato banchina + passerella d'imbarco
  map_harbor_tube(C, 'white', 51.25, 11.3, -38, 51.25, 11.3, 38, 0.04, 4);
  map_harbor_tube(C, 'white', 51.25, 10.8, -38, 51.25, 10.8, 38, 0.03, 4);
  for (let z = -38; z <= 38; z += 3.2) map_harbor_tube(C, 'white', 51.25, 10.25, z, 51.25, 11.3, z, 0.03, 4);
  map_harbor_beam(C, 'metal', 46.6, 0.45, 20, 51.3, 10.3, 36, 0.9, 0.08);
  for (let s = -1; s <= 1; s += 2) {
    const ox = s * 0.43, oz = -s * 0.127;
    map_harbor_tube(C, 'white', 46.6 + ox, 1.5, 20 + oz, 51.3 + ox, 11.35, 36 + oz, 0.03, 4);
    for (let k = 0; k <= 8; k++) { const t = k / 8, qx = 46.6 + 4.7 * t + ox, qy = 0.45 + 9.85 * t, qz = 20 + 16 * t + oz; map_harbor_tube(C, 'white', qx, qy, qz, qx, qy + 1.05, qz, 0.025, 4); }
  }
}

// ---------------------------------------------------------------- palazzi di bordo (non entrabili): facciata dipinta + botteghe + rilievi
function map_harbor_block(C, x, z, w, d, h, st, face, sign) {
  const kit = C.kit, M = C.M, body = M[map_harbor_BK[st]], nc = { collide: false };
  const horiz = face === 'n' || face === 's', len = horiz ? w : d, dep = horiz ? d : w, sg = (face === 's' || face === 'e') ? 1 : -1;
  const rot = face === 's' ? 0 : face === 'n' ? Math.PI : face === 'e' ? Math.PI / 2 : -Math.PI / 2;
  const Wp = function (al, out) { const off = sg * (dep / 2 + out); return horiz ? [x + al, z + off] : [x + off, z + al]; };
  const P = function (al, y, out, wa, hh, wo, m) { const p = Wp(al, out); kit.box(p[0], y, p[1], horiz ? wa : wo, hh, horiz ? wo : wa, m, nc); };
  const I = function (list, al, y, out, wa, hh, wo) { const p = Wp(al, out); list.push(map_harbor_mat4(p[0], y, p[1], horiz ? wa : wo, hh, horiz ? wo : wa, 0)); };
  kit.box(x, 0, z, w, h, d, body, { collide: true });
  kit.box(x, h - 0.2, z, w + 0.8, 0.5, d + 0.8, M.cream, nc);
  kit.box(x, h + 0.3, z, w + 0.3, 0.55, d + 0.3, body, nc);
  // facciata dipinta dei piani alti (8 m x 14 m per ripetizione, finestre ogni 2 m, piani da 3,5 m)
  const up = h - 4, nf = Math.round(up / 3.5), gU = new THREE.PlaneGeometry(len, up), uv = gU.attributes.uv;
  const u0 = Math.floor(C.rng() * 4) * 0.25, v0 = Math.floor(C.rng() * 4) * 0.25;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * len / 8, v0 + uv.getY(i) * up / 14);
  const pc = Wp(0, 0.02);
  map_harbor_put(C, map_harbor_FK[st], gU, pc[0], 4 + up / 2, pc[1], rot, 0, 0, true);
  P(0, 3.88, 0.12, len + 0.2, 0.26, 0.24, M.cream);
  // piano terra: botteghe e portoni dipinti + tende, gradini, lampade
  const ns = Math.max(1, Math.round(len / 4)), cw = len / ns;
  for (let i = 0; i < ns; i++) {
    const cell = Math.floor(C.rng() * 8), al = -len / 2 + (i + 0.5) * cw, gs = new THREE.PlaneGeometry(cw, 4), ps = Wp(al, 0.02);
    map_harbor_quv(gs, (cell % 4) * 512, (cell >> 2) * 512, 512, 512, 2048, 1024);
    map_harbor_put(C, 'shops', gs, ps[0], 2, ps[1], rot, 0, 0, true);
    if (cell === 0 || cell === 1 || cell === 4 || cell === 5) {
      const am = M[C.pick(['red', 'blue', 'tarp', 'crane'])];
      P(al, 2.5, 0.58, cw - 0.5, 0.08, 1.15, am);
      P(al, 2.3, 1.14, cw - 0.5, 0.22, 0.04, am);
      P(al - cw / 2 + 0.3, 2.42, 0.58, 0.04, 0.08, 1.1, M.metalD); P(al + cw / 2 - 0.3, 2.42, 0.58, 0.04, 0.08, 1.1, M.metalD);
      P(al, 0, 0.3, cw - 0.8, 0.1, 0.6, M.conc);
    } else if (cell === 3 || cell === 7) {
      P(al, 3.15, 0.14, 0.28, 0.22, 0.28, M.lamp);
      P(al, 3.37, 0.14, 0.34, 0.05, 0.34, M.metalD);
      P(al, 0, 0.35, 2.2, 0.1, 0.7, M.conc);
    } else if (C.rng() < 0.6) {
      const p = Wp(al + cw * 0.3, 0.45);
      map_harbor_cyl(C, 'brickR', p[0], 0, p[1], 0.28, 0.2, 0.45, 8);
      map_harbor_blob(C, 'leaf', p[0], 0.8, p[1], 0.42, 1.2, 0.25, 0);
    }
  }
  // davanzali in rilievo, balconi con ringhiera, condizionatori
  const nw = Math.round(len / 2);
  for (let k = 0; k < nw; k++) {
    const al = -len / 2 + 2 * k + 1;
    for (let f = 0; f < nf; f++) {
      const fy = 4 + f * 3.5, q = C.rng();
      if (f < 3) I(C.I.sill, al, fy + 0.93, 0.1, 1.4, 0.09, 0.2);
      if (q < 0.1) {
        P(al, fy - 0.04, 0.5, 1.9, 0.12, 1.0, M.concD);
        const a0 = Wp(al - 0.93, 0.97), a1 = Wp(al + 0.93, 0.97), b0 = Wp(al - 0.93, 0.02), b1 = Wp(al + 0.93, 0.02), ry = fy + 1.05;
        map_harbor_tube(C, 'metalD', a0[0], ry, a0[1], a1[0], ry, a1[1], 0.025, 4);
        map_harbor_tube(C, 'metalD', a0[0], ry, a0[1], b0[0], ry, b0[1], 0.025, 4);
        map_harbor_tube(C, 'metalD', a1[0], ry, a1[1], b1[0], ry, b1[1], 0.025, 4);
        for (let j = 0; j <= 6; j++) { const t = j / 6, bx = a0[0] + (a1[0] - a0[0]) * t, bz = a0[1] + (a1[1] - a0[1]) * t; map_harbor_tube(C, 'metalD', bx, fy + 0.08, bz, bx, ry, bz, 0.015, 3); }
        if (C.rng() < 0.6) P(al + 0.5, fy + 0.3, 0.9, 0.5, 0.7, 0.03, M[C.pick(['white', 'red', 'tarp'])]);
      } else if (q < 0.2) P(al + 0.1, fy + 0.2, 0.28, 0.85, 0.55, 0.5, M.metal);
    }
  }
  // tetto: macchine, cisterna, antenna, torrino
  const rx = function () { return x + C.rand(-w / 2 + 1.8, w / 2 - 1.8); }, rz = function () { return z + C.rand(-d / 2 + 1.5, d / 2 - 1.5); };
  const n = 2 + Math.floor(C.rng() * 3);
  for (let i = 0; i < n; i++) kit.box(rx(), h + 0.3, rz(), C.rand(1.2, 2.2), C.rand(0.8, 1.3), C.rand(1.1, 1.7), M.metal, { collide: false, rotY: C.rand(-0.04, 0.04) });
  if (C.rng() < 0.65) {
    const tx = rx(), tz = rz();
    map_harbor_cyl(C, 'rust', tx, h + 1.4, tz, 1.0, 1.0, 2.0, 10);
    map_harbor_cyl(C, 'rust', tx, h + 3.4, tz, 0.1, 1.0, 0.5, 10);
    for (let i = 0; i < 4; i++) map_harbor_tube(C, 'metalD', tx + (i % 2 ? 0.7 : -0.7), h + 0.3, tz + (i < 2 ? -0.7 : 0.7), tx + (i % 2 ? 0.6 : -0.6), h + 1.4, tz + (i < 2 ? -0.6 : 0.6), 0.05, 4);
  }
  if (C.rng() < 0.7) {
    const ax = rx(), az = rz(), ah = C.rand(4, 8);
    map_harbor_tube(C, 'metalD', ax, h + 0.3, az, ax, h + ah, az, 0.05, 4);
    map_harbor_tube(C, 'metalD', ax - 0.6, h + ah - 0.8, az, ax + 0.6, h + ah - 0.8, az, 0.02, 3);
    map_harbor_tube(C, 'metalD', ax, h + ah - 1.5, az - 0.45, ax, h + ah - 1.5, az + 0.45, 0.02, 3);
    kit.box(ax, h + ah, az, 0.18, 0.18, 0.18, M.redL, nc);
  }
  kit.box(rx(), h + 0.3, rz(), 2.6, 2.3, 2.8, body, nc);
  const pa = Wp(-len / 2 + 0.15, 0.12), pb = Wp(len / 2 - 0.15, 0.12);
  map_harbor_tube(C, 'rust', pa[0], 0, pa[1], pa[0], h, pa[1], 0.07, 5);
  map_harbor_tube(C, 'rust', pb[0], 0, pb[1], pb[0], h, pb[1], 0.07, 5);
  if (sign) {
    P(len / 2 - 2, h * 0.42, 0.55, 0.9, h * 0.34, 0.22, M[sign]);
    P(len / 2 - 2, h * 0.42 - 0.2, 0.25, 0.12, 0.12, 0.5, M.metalD);
    P(len / 2 - 2, h * 0.76 + 0.1, 0.25, 0.12, 0.12, 0.5, M.metalD);
  }
}
// palazzo lontano fuori mappa (seconda fila della skyline) con la stessa facciata dipinta
function map_harbor_far(C, x, z, w, d, h, st, face) {
  const kit = C.kit, M = C.M, horiz = face === 'n' || face === 's', len = horiz ? w : d, sg = (face === 's' || face === 'e') ? 1 : -1;
  const rot = face === 's' ? 0 : face === 'n' ? Math.PI : face === 'e' ? Math.PI / 2 : -Math.PI / 2;
  kit.box(x, 0, z, w, h, d, M[map_harbor_BK[st]], { collide: false });
  kit.box(x, h, z, w + 0.6, 0.5, d + 0.6, M.cream, { collide: false });
  kit.box(x, h + 0.5, z, w * 0.5, 2.5, d * 0.5, M.concD, { collide: false });
  const g = new THREE.PlaneGeometry(len, h), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 8, uv.getY(i) * h / 14);
  map_harbor_put(C, map_harbor_FK[st], g, horiz ? x : x + sg * (w / 2 + 0.03), h / 2, horiz ? z + sg * (d / 2 + 0.03) : z, rot, 0, 0, true);
  kit.box(x, h + 3, z, 0.3, 0.3, 0.3, M.redL, { collide: false });
}

// ---------------------------------------------------------------- dettagli esterni degli edifici entrabili
function map_harbor_dress(C, b) {
  const kit = C.kit, M = C.M, nc = { collide: false };
  const x = b.x, z = b.z, w = b.w, d = b.d, fh = b.floorH, H = b.floors * fh, trim = M[b.trim], R = b.roof || '';
  for (let k = 1; k <= b.floors; k++) {
    const top = k === b.floors, e = top ? 0.24 : 0.11, hh = top ? 0.32 : 0.16, y = k * fh - hh / 2;
    kit.box(x, y, z - d / 2 - e / 2, w + 2 * e, hh, e, trim, nc);
    kit.box(x, y, z + d / 2 + e / 2, w + 2 * e, hh, e, trim, nc);
    kit.box(x - w / 2 - e / 2, y, z, e, hh, d, trim, nc);
    kit.box(x + w / 2 + e / 2, y, z, e, hh, d, trim, nc);
  }
  for (let i = 0; i < 4; i++) kit.box(x + (i % 2 ? 1 : -1) * (w / 2 - 0.17), 0, z + (i < 2 ? -1 : 1) * (d / 2 - 0.17), 0.5, H, 0.5, trim, nc);
  // zoccolo scuro alla base, interrotto dalle porte
  const sides = ['n', 's', 'e', 'w'];
  for (let si = 0; si < 4; si++) {
    const sd = sides[si], hz = sd === 'n' || sd === 's', sg = (sd === 's' || sd === 'e') ? 1 : -1, len = hz ? w : d, cuts = [];
    for (let i = 0; i < b.doors.length; i++) if (b.doors[i].side === sd) cuts.push([b.doors[i].at - b.doors[i].width / 2 - 0.12, b.doors[i].at + b.doors[i].width / 2 + 0.12]);
    cuts.sort(function (p, q) { return p[0] - q[0]; });
    cuts.push([len / 2, len / 2]);
    let a = -len / 2;
    for (let i = 0; i < cuts.length; i++) {
      const e = cuts[i][0];
      if (e > a + 0.05) {
        const mid = (a + e) / 2, L = e - a;
        if (hz) kit.box(x + mid, 0, z + sg * (d / 2 + 0.03), L, 0.85, 0.06, M.concD, nc);
        else kit.box(x + sg * (w / 2 + 0.03), 0, z + mid, 0.06, 0.85, L, M.concD, nc);
      }
      a = cuts[i][1];
    }
  }
  for (let i = 0; i < b.doors.length; i++) {
    const dr = b.doors[i], hz = dr.side === 'n' || dr.side === 's', sg = (dr.side === 's' || dr.side === 'e') ? 1 : -1, hw = dr.width / 2;
    const P = function (al, y, out, wa, hh, wo, m) {
      if (hz) kit.box(x + dr.at + al, y, z + sg * (d / 2 + out), wa, hh, wo, m, nc);
      else kit.box(x + sg * (w / 2 + out), y, z + dr.at + al, wo, hh, wa, m, nc);
    };
    P(-hw - 0.08, 0, 0.05, 0.16, 2.6, 0.14, trim); P(hw + 0.08, 0, 0.05, 0.16, 2.6, 0.14, trim);
    P(0, 2.6, 0.06, dr.width + 0.5, 0.22, 0.16, trim);
    P(0, 0, 0.5, dr.width + 0.5, 0.06, 1.0, M.conc);
    P(0, 2.95, 0.55, dr.width + 0.9, 0.08, 1.1, M[b.awn]);
    P(0, 2.75, 1.08, dr.width + 0.9, 0.2, 0.04, M[b.awn]);
    P(-hw - 0.3, 2.84, 0.55, 0.05, 0.1, 1.05, M.metalD); P(hw + 0.3, 2.84, 0.55, 0.05, 0.1, 1.05, M.metalD);
    P(0, 2.84, 0.3, 0.5, 0.1, 0.16, M.lamp);
    if (i < 2) {      // targa accanto alla porta
      const rot = dr.side === 's' ? 0 : dr.side === 'n' ? Math.PI : dr.side === 'e' ? Math.PI / 2 : -Math.PI / 2, al = dr.at + hw + 0.75;
      const px = hz ? x + al : x + sg * (w / 2 + 0.08), pz = hz ? z + sg * (d / 2 + 0.08) : z + al;
      map_harbor_sg(C, C.pick([10, 11, 13, 15, 12]), px, 1.75, pz, rot, 0.96, 0.3);
    }
    const mx = hz ? x + dr.at : x + sg * (w / 2 + 1.3), mz = hz ? z + sg * (d / 2 + 1.3) : z + dr.at;
    map_harbor_dq(C, C.pick([3, 9, 0]), mx, mz, 2.6, 2.2, C.rng() * 6.28);
  }
  for (let i = 0; i <= b.floors; i++) {
    const side = C.pick(sides), hz = side === 'n' || side === 's', sg = (side === 's' || side === 'e') ? 1 : -1;
    const len = hz ? w : d, al = C.pick([-1, 1]) * (len / 2 - C.rand(1.2, 1.8)), y = (1 + Math.floor(C.rng() * b.floors)) * fh - 0.95;
    const px = hz ? x + al : x + sg * (w / 2 + 0.27), pz = hz ? z + sg * (d / 2 + 0.27) : z + al;
    kit.box(px, y, pz, hz ? 0.9 : 0.5, 0.6, hz ? 0.5 : 0.9, M.metal, nc);
    kit.box(px, y - 0.08, pz, hz ? 1.0 : 0.56, 0.06, hz ? 0.56 : 1.0, M.metalD, nc);
  }
  map_harbor_tube(C, 'rust', x + w / 2 + 0.1, 0, z - d / 2 + 0.7, x + w / 2 + 0.1, H, z - d / 2 + 0.7, 0.06, 5);
  map_harbor_tube(C, 'rust', x - w / 2 - 0.1, 0, z + d / 2 - 0.7, x - w / 2 - 0.1, H, z + d / 2 - 0.7, 0.06, 5);
  if (R.indexOf('t') >= 0) {
    const tx = x + w * 0.28, tz = z - d * 0.26;
    map_harbor_cyl(C, 'rust', tx, H + 1.0, tz, 0.9, 0.9, 1.8, 10);
    map_harbor_cyl(C, 'rust', tx, H + 2.8, tz, 0.1, 0.9, 0.45, 10);
    for (let i = 0; i < 4; i++) map_harbor_tube(C, 'metalD', tx + (i % 2 ? 0.65 : -0.65), H, tz + (i < 2 ? -0.65 : 0.65), tx + (i % 2 ? 0.55 : -0.55), H + 1.0, tz + (i < 2 ? -0.55 : 0.55), 0.05, 4);
    kit.collider(tx - 0.9, H, tz - 0.9, tx + 0.9, H + 2.8, tz + 0.9);
  }
  if (R.indexOf('a') >= 0) {
    const ax = x - w / 2 + 0.8, az = z + d / 2 - 0.8, ah = b.antH || 7;
    map_harbor_tube(C, 'metalD', ax, H, az, ax, H + ah, az, 0.06, 5, 0.03);
    for (let k = 1; k <= 3; k++) map_harbor_tube(C, 'metalD', ax - 0.7 + k * 0.1, H + ah - k * 0.9, az, ax + 0.7 - k * 0.1, H + ah - k * 0.9, az, 0.02, 3);
    map_harbor_tube(C, 'rubber', ax, H + ah * 0.8, az, ax + 2.2, H + 0.3, az - 2.2, 0.012, 3);
    kit.box(ax, H + ah, az, 0.16, 0.16, 0.16, M.redL, nc);
  }
  if (R.indexOf('d') >= 0) {
    const dx = x + w / 2 - 1.1, dz = z + d / 2 - 1.1;
    map_harbor_tube(C, 'metalD', dx, H, dz, dx, H + 1.5, dz, 0.06, 5);
    map_harbor_put(C, 'white', new THREE.CylinderGeometry(0.95, 0.12, 0.35, 14), dx, H + 1.7, dz, 0.6, 1.0, 0, true);
  }
  if (R.indexOf('m') >= 0) {
    const ml = w - 8;
    kit.box(x, H, z, ml, 1.1, 2.2, M[b.key], { collide: true });
    kit.box(x, H + 0.35, z - 1.12, ml - 0.6, 0.55, 0.06, M.winLit, nc);
    kit.box(x, H + 0.35, z + 1.12, ml - 0.6, 0.55, 0.06, M.winLit, nc);
    map_harbor_put(C, b.key, map_harbor_prof([[-1.3, 0], [1.3, 0], [0, 0.6]], ml + 0.4), x, H + 1.1, z, 0);
  }
  if (R.indexOf('v') >= 0) {
    for (let i = 0; i < 3; i++) {
      const vx = x - w * 0.3 + i * w * 0.18, vz = z + d * 0.3;
      map_harbor_cyl(C, 'metal', vx, H, vz, 0.2, 0.2, 0.7, 8);
      map_harbor_cyl(C, 'metal', vx, H + 0.75, vz, 0.05, 0.34, 0.2, 8);
    }
  }
  if (R.indexOf('c') >= 0) {
    kit.box(x - w * 0.24, H, z + d * 0.22, 1.6, 0.9, 1.1, M.metal, { collide: true, rotY: 0.03 });
    kit.box(x - w * 0.24 + 1.9, H, z + d * 0.22, 1.2, 0.7, 1.0, M.metal, nc);
  }
}

// ---------------------------------------------------------------- build
MAPS.push({
  id: 'harbor',
  name: 'Porto al Tramonto',
  size: 140,
  env: {
    sky: 'sunset', sunElev: 10, sunAzim: 250, sunColor: 0xffa860, sunIntensity: 4.4,
    hemiSky: 0xf0b890, hemiGround: 0x5a4638, hemiIntensity: 0.95,
    fogColor: 0xd9a47c, fogDensity: 0.005, exposure: 0.56, bloomThreshold: 1.8, bloomStrength: 0.6,
    rain: false, snow: false, dust: true
  },
  build(kit) {
    const T = kit.THREE, PI = Math.PI, H = map_harbor_H;
    const M = map_harbor_mats(kit);
    const C = {
      kit: kit, M: M, G: {}, S: { asfalto: 1 / 8, lastre: 1 / 8, stOcra: 1 / 3, stRosa: 1 / 3, stSalvia: 1 / 3 }, dn: 0,
      rng: function () { return kit.rng(); }, rand: function (a, b) { return kit.rand(a, b); }, pick: function (a) { return kit.pick(a); },
      I: { winLit: [], winDark: [], sill: [], wheel: [], hub: [], barR: [], barB: [], barY: [], barRust: [], tire: [], tireF: [],
        lineW: [], lineY: [], rubble: [], brickD: [], carton: [], weed: [], bag: [] }
    };
    const nc = { collide: false };
    const D = function (x, y, z, w, h, d, mat, ry) { kit.box(x, y, z, w, h, d, mat, { collide: false, rotY: ry || 0 }); };
    const B = function (x, y, z, w, h, d, mat, ry) { kit.box(x, y, z, w, h, d, mat, { collide: true, rotY: ry || 0 }); };
    const rnd = C.rand;
    const dq = function (cell, x, z, w, d, rot) { map_harbor_dq(C, cell, x, z, w, d, rot); };
    const floor = function (key, x0, z0, x1, z1) {
      const g = new T.PlaneGeometry(x1 - x0, z1 - z0);
      g.rotateX(-PI / 2);
      map_harbor_put(C, key, g, (x0 + x1) / 2, 0.02, (z0 + z1) / 2, 0);
    };

    // ---------- terreno, pavimentazioni dipinte, acqua, bordi invalicabili
    kit.ground(M.conc);
    floor('lastre', -70, -70, -35, 70);     // piazzali dei magazzini (lastre di cemento)
    floor('asfalto', -35, -70, 33, 70);     // strada e piazzale container
    floor('lastre', 33, -70, 47, 70);       // banchina
    kit.collider(-71, 0, -71, 71, 40, -70);
    kit.collider(-71, 0, 70, 71, 40, 71);
    kit.collider(-71, 0, -71, -70, 40, 71);
    kit.collider(70, 0, -71, 71, 40, 71);
    kit.collider(46.9, 0, -71, 47.6, 6, 71);
    kit.mesh(new T.PlaneGeometry(100, 320), M.water, { x: 97.5, y: 0.06, z: 0, rotX: -PI / 2 }, { collide: false });
    D(47.15, 0, 0, 0.7, 0.35, 142, M.concD);
    D(46.72, 0.35, 0, 0.16, 0.06, 142, M.crane);
    for (let i = 0; i < 5; i++) {
      const bz = -52 + i * 26;
      map_harbor_put(C, 'red', new T.SphereGeometry(0.45, 10, 8), 49.2, 0.3, bz, 0, 0, 0, true);
      map_harbor_tube(C, 'metalD', 49.2, 0.6, bz, 49.2, 1.5, bz, 0.03, 4);
      D(49.2, 1.5, bz, 0.14, 0.14, 0.14, i % 2 ? M.redL : M.greenL);
    }

    // ---------- marciapiedi con cordolo, segnaletica consumata
    B(-34.5, 0, 0, 0.9, 0.15, 124, M.conc);
    const sw = [[-62, -27.2], [-16.8, -6.3], [6.3, 16.8], [27.2, 62]];
    for (let i = 0; i < sw.length; i++) {
      const a = sw[i][0], b = sw[i][1];
      B(-22, 0, (a + b) / 2, 2, 0.15, b - a, M.conc);
      D(-23.05, 0, (a + b) / 2, 0.14, 0.17, b - a, M.concD);
    }
    const L = C.I.lineW, LY = C.I.lineY;
    for (let z = -58; z <= 58; z += 7) L.push(map_harbor_mat4(-28.5, 0.05, z + rnd(-0.1, 0.1), 0.25, 1, rnd(2.4, 3.2), 0));
    for (let z = -60; z < 60; z += 8.2) {       // linee di margine spezzate dall'usura
      L.push(map_harbor_mat4(-33.8, 0.05, z + 3.6, 0.18, 1, rnd(5.5, 7.6), 0));
      L.push(map_harbor_mat4(-23.3, 0.05, z + 3.6, 0.18, 1, rnd(5.5, 7.6), 0));
    }
    for (let x = -21; x <= 45; x += 7) { if (Math.abs(x) < 8) continue; L.push(map_harbor_mat4(x, 0.05, 0, 3.2, 1, 0.25, 0)); }
    for (let i = 0; i < 6; i++) {
      L.push(map_harbor_mat4(-28.5 + (i - 2.5) * 1.6, 0.05, -9, 0.7, 1, 3, 0));
      L.push(map_harbor_mat4(-28.5 + (i - 2.5) * 1.6, 0.05, 9, 0.7, 1, 3, 0));
      L.push(map_harbor_mat4(-17, 0.05, -4.5 + i * 1.8, 3, 1, 0.7, 0));
    }
    for (let z = -66; z < 66; z += 9) { LY.push(map_harbor_mat4(44.4, 0.05, z + 4, 0.3, 1, rnd(6.5, 8.4), 0)); LY.push(map_harbor_mat4(33.6, 0.05, z + 4, 0.2, 1, rnd(6.5, 8.4), 0)); }
    for (let z = -60; z <= 60; z += 12) LY.push(map_harbor_mat4(39, 0.05, z, 10.6, 1, 0.2, 0));
    for (let i = 0; i < 8; i++) {   // stalli merci gialli nel piazzale container
      const sx = -6 + (i % 4) * 6.2, sz = i < 4 ? -19 : 19;
      LY.push(map_harbor_mat4(sx, 0.05, sz, 0.14, 1, 3.2, 0));
      if (i % 2 === 0) dq(14, sx + 3.1, sz, 2.4, 2.4, i < 4 ? 0 : PI);
    }

    // ---------- macchie, crepe, pozze, tombini, scritte a terra (un solo materiale con trasparenza)
    for (let i = 0; i < 60; i++) dq(C.pick([0, 0, 1, 2, 3, 9]), rnd(-33.5, 46), rnd(-62, 62), rnd(1.6, 4.6), rnd(1.6, 4.6), rnd(0, 6.28));
    for (let i = 0; i < 26; i++) dq(C.pick([0, 1, 9]), rnd(-33.5, -23.5), rnd(-60, 60), rnd(1.4, 3.4), rnd(1.6, 4), rnd(0, 6.28));
    for (let i = 0; i < 26; i++) dq(C.pick([2, 3, 3, 9]), rnd(-61, -36), rnd(-62, 62), rnd(1.8, 4.5), rnd(1.8, 4.5), rnd(0, 6.28));
    for (let i = 0; i < 56; i++) dq(C.pick([4, 5, 5]), rnd(-61, 46), rnd(-62, 62), rnd(2, 5.5), rnd(2, 5.5), rnd(0, 6.28));
    for (let i = 0; i < 10; i++) dq(6, rnd(-32, -25), rnd(-56, 56), 5, 5, C.pick([0, PI / 2, PI, -PI / 2]));
    for (let i = 0; i < 6; i++) dq(6, rnd(-14, 30), rnd(-3.5, 3.5), 5, 5, C.pick([0, PI / 2, PI, -PI / 2]));
    const mh = [[-28.5, -40], [-28.5, -15], [-28.5, 18], [-28.5, 44], [-12, 0], [18, 0], [34, 0], [40, -30], [40, 30], [16, -27], [16, 27], [-45, -27], [-45, 27], [-57, 0]];
    for (let i = 0; i < mh.length; i++) dq(7, mh[i][0], mh[i][1], 1.1, 1.1, rnd(0, 6.28));
    for (let z = -55; z <= 55; z += 22) { dq(8, -23.7, z, 0.9, 0.9, PI / 2); dq(8, -33.7, z + 9, 0.9, 0.9, PI / 2); }
    const arz = [-50, -22, 20, 48];
    for (let i = 0; i < arz.length; i++) { dq(10, -31.2, arz[i], 1.6, 3.6, 0); dq(10, -25.8, arz[i] + 4, 1.6, 3.6, PI); }
    dq(12, -19.5, -3, 3, 3, PI / 2); dq(12, -19.5, 3, 3, 3, PI / 2);
    dq(12, -31.2, 12.5, 3, 3, 0); dq(12, -25.8, -12.5, 3, 3, PI);
    const zn = [[25, -3.4, 0], [25, 3.4, PI], [-45, -24.5, 0], [-45, 24.5, PI], [39, -34, PI / 2], [39, 34, PI / 2], [-8, -45, 0], [-8, 45, PI]];
    for (let i = 0; i < zn.length; i++) dq(11, zn[i][0], zn[i][1], 3.4, 3.4, zn[i][2]);
    for (let z = -55; z <= 55; z += 11) dq(13, 46.0, z + 4, 1.2, 1.2, 0);

    // ---------- skyline di bordo: palazzi con facciate dipinte e botteghe
    map_harbor_block(C, -55, -66.5, 30, 7, 25, 2, 's', 'signC');
    map_harbor_block(C, 5, -66.5, 28, 7, 28.5, 0, 's', null);
    map_harbor_block(C, 33, -66.5, 28, 7, 18, 3, 's', 'winLit');
    map_harbor_block(C, -55, 66.5, 30, 7, 21.5, 1, 'n', 'winLit');
    map_harbor_block(C, 5, 66.5, 28, 7, 25, 3, 'n', null);
    map_harbor_block(C, 33, 66.5, 28, 7, 21.5, 0, 'n', 'signC');
    map_harbor_block(C, -66, -52, 8, 22, 25, 0, 'e', null);
    map_harbor_block(C, -66, -30, 8, 22, 18, 1, 'e', 'winLit');
    map_harbor_block(C, -66, 22, 8, 24, 28.5, 3, 'e', null);
    map_harbor_block(C, -66, 48, 8, 28, 21.5, 2, 'e', 'signC');
    map_harbor_far(C, -84, -40, 14, 30, 46, 3, 'e');
    map_harbor_far(C, -82, 36, 12, 26, 39, 0, 'e');
    map_harbor_far(C, -22, -82, 30, 12, 46, 1, 's');
    map_harbor_far(C, 24, 82, 26, 12, 39, 2, 'n');
    map_harbor_far(C, -30, 84, 22, 12, 46, 0, 'n');
    D(5, 18.4, -62.9, 14.4, 3.3, 0.1, M.metalD);
    map_harbor_sg(C, 8, 5, 20, -62.82, 0, 14, 3);
    D(5, 16.4, 62.9, 14.4, 3.3, 0.1, M.metalD);
    map_harbor_sg(C, 9, 5, 18, 62.82, PI, 14, 3);
    // muri di container ai bordi nord e sud
    for (let i = 0; i < 5; i++) {
      const x = -37 + i * 6.2;
      for (let k = 0; k < 4; k++) map_harbor_cont(C, x, k * H, -67.4, false, C.pick(map_harbor_CI), k === 0);
      for (let k = 0; k < 3; k++) map_harbor_cont(C, x, k * H, -64.8, false, C.pick(map_harbor_CI), k === 0);
      for (let k = 0; k < 3; k++) map_harbor_cont(C, x, k * H, 67.4, false, C.pick(map_harbor_CI), k === 0);
      for (let k = 0; k < 4; k++) map_harbor_cont(C, x, k * H, 64.8, false, C.pick(map_harbor_CI), k === 0);
    }
    kit.collider(-40.2, 0, -68.8, -9, 10.4, -63.4);
    kit.collider(-40.2, 0, 63.4, -9, 10.4, 68.8);
    // silos a ovest con tubi e passerella, ciminiera lontana
    for (let i = 0; i < 4; i++) {
      const z = -15.5 + i * 7.2;
      map_harbor_cyl(C, 'white', -66, 0, z, 3.6, 3.6, 20, 20, true);
      map_harbor_cyl(C, 'metalD', -66, 20, z, 0.4, 3.6, 1.8, 20);
      map_harbor_cyl(C, 'red', -66, 6, z, 3.68, 3.68, 0.5, 20);
      map_harbor_cyl(C, 'metal', -66, 13, z, 3.68, 3.68, 0.2, 20);
      map_harbor_tube(C, 'metal', -62.3, 0, z - 1.5, -62.3, 21, z - 1.5, 0.08, 4);
      for (let k = 0; k < 4; k++) D(-62.38, rnd(3, 12), z + rnd(-1.5, 1.5), 0.05, rnd(2, 6), rnd(0.2, 0.5), M.rust);
      map_harbor_sg(C, i % 2 ? 10 : 15, -62.36, 2.2, z + 0.6, PI / 2, 1.8, 0.56);
    }
    map_harbor_tube(C, 'metal', -62.1, 12, -17, -62.1, 12, 8, 0.25, 6);
    map_harbor_tube(C, 'rust', -62.1, 4, -17, -62.1, 4, 8, 0.18, 6);
    D(-61.9, 20.2, -4.7, 1.0, 0.08, 26, M.metal);
    map_harbor_tube(C, 'white', -61.45, 21.2, -17.5, -61.45, 21.2, 8.2, 0.03, 4);
    for (let z = -17.5; z <= 8.3; z += 2.15) map_harbor_tube(C, 'white', -61.45, 20.2, z, -61.45, 21.2, z, 0.025, 4);
    map_harbor_cyl(C, 'brickR', -76, 0, -4, 1.5, 2.3, 42, 14);
    map_harbor_cyl(C, 'concD', -76, 42, -4, 1.7, 1.7, 0.8, 14);
    D(-76, 43, -4, 0.3, 0.3, 0.3, M.redL); D(-74.2, 28, -4, 0.25, 0.25, 0.25, M.redL);
    // molo con faro (nord-est) e capannone (sud-est)
    D(59, 0, -67, 22, 1.8, 6, M.conc);
    map_harbor_cyl(C, 'white', 62, 1.8, -67, 1.4, 2.2, 14, 16);
    map_harbor_cyl(C, 'red', 62, 5, -67, 1.92, 2.02, 2.2, 16);
    map_harbor_cyl(C, 'red', 62, 10.5, -67, 1.62, 1.72, 2.2, 16);
    map_harbor_cyl(C, 'metalD', 62, 15.8, -67, 1.9, 1.9, 0.15, 16);
    map_harbor_cyl(C, 'lamp', 62, 15.95, -67, 1.0, 1.0, 1.4, 12);
    map_harbor_cyl(C, 'red', 62, 17.35, -67, 0.1, 1.5, 1.1, 16);
    D(59, 0, 67, 22, 1.8, 6, M.conc);
    D(59, 1.8, 67, 12, 4.4, 5, M.corrA);
    map_harbor_put(C, 'corrB', map_harbor_prof([[-2.9, 0], [2.9, 0], [0, 1.5]], 12.4), 59, 6.2, 67, 0);
    map_harbor_sg(C, 12, 59, 5.3, 64.44, PI, 5.6, 1.5);
    for (let i = 0; i < 6; i++) map_harbor_blob(C, 'concD', 49.5 + i * 3.6 + rnd(-0.8, 0.8), 0.5, -63.4 + rnd(-0.4, 0.4), rnd(0.9, 1.5), 0.7, 0.3, 0);

    // ---------- nave e gru (punto eroe)
    map_harbor_ship(C);
    map_harbor_crane(C, -18, 58, 20);
    map_harbor_crane(C, 18, 40.5, 6.4);
    D(36, 0, 0, 0.18, 0.1, 140, M.metalD); D(45, 0, 0, 0.18, 0.1, 140, M.metalD);
    D(35.4, 0.02, 0, 0.5, 0.02, 140, M.concD); D(45.6, 0.02, 0, 0.5, 0.02, 140, M.concD);

    // ---------- bitte, parabordi, cime d'ormeggio, salvagenti
    for (let z = -60; z <= 60; z += 10) {
      map_harbor_cyl(C, 'metalD', 45.9, 0, z, 0.2, 0.27, 0.55, 10);
      map_harbor_cyl(C, 'crane', 45.9, 0.55, z, 0.32, 0.2, 0.16, 10);
      kit.collider(45.6, 0, z - 0.3, 46.2, 0.7, z + 0.3);
      dq(2, 45.6, z, 1.8, 1.8, rnd(0, 6.28));
    }
    for (let z = -30; z <= 30; z += 30) {
      map_harbor_sag(C, 'sandbag', 45.9, 0.62, z, 51.05, 9.4, z + 5, 1.4, 0.05);
      map_harbor_sag(C, 'sandbag', 45.9, 0.62, z, 51.05, 9.0, z - 6, 1.6, 0.05);
    }
    map_harbor_sag(C, 'sandbag', 45.9, 0.62, 50, 51.05, 9.2, 54, 1.2, 0.05);
    for (let z = -34; z <= 54; z += 3.6) C.I.tire.push(map_harbor_mat4(47.75, 0.45, z, 1, 1, 1, 0));
    for (let z = -50; z <= 50; z += 25) {
      map_harbor_tube(C, 'white', 46.3, 0, z + 2, 46.3, 1.5, z + 2, 0.04, 4);
      map_harbor_put(C, 'red', new T.TorusGeometry(0.3, 0.06, 6, 12), 46.3, 1.2, z + 2, PI / 2, 0, 0, true);
    }
    map_harbor_coil(C, 45.2, -25); map_harbor_coil(C, 45.3, 5.5); map_harbor_coil(C, 45.2, 31); map_harbor_coil(C, 44.9, -44);
    map_harbor_reel(C, 43.5, -52, 0.3); map_harbor_reel(C, 43.3, 52, 1.2); map_harbor_reel(C, 32.5, 11, 0.8);
    // cartelli della banchina su palo
    const qs = [[34.2, -8, 15], [34.2, 8, 12], [34.2, -36, 14], [34.2, 36, 13]];
    for (let i = 0; i < qs.length; i++) {
      map_harbor_tube(C, 'metalD', qs[i][0], 0, qs[i][1], qs[i][0], 2.9, qs[i][1], 0.04, 5);
      D(qs[i][0] - 0.04, 2.25, qs[i][1], 0.04, 0.6, 1.9, M.metalD);
      map_harbor_sg(C, qs[i][2], qs[i][0] - 0.07, 2.55, qs[i][1], -PI / 2, 1.8, 0.5);
      map_harbor_sg(C, qs[i][2], qs[i][0] - 0.01, 2.55, qs[i][1], PI / 2, 1.8, 0.5);
    }

    // ---------- labirinto di container (corridoi stretti, scale per salire sulle pile)
    const rows = [
      { x: -8, z: -40, n: 5, lv: [2, 3, 2, 2, 3], stair: 'L' },
      { x: -8, z: -35, n: 5, lv: [2, 2, 3, 1, 2], stair: 'R' },
      { x: -52, z: -57, n: 3, lv: [1, 2, 1], stair: 'L' },
      { x: -50, z: -52, n: 2, lv: [2, 1] },
      { x: -8, z: -14, n: 4, lv: [1, 2, 1, 2], stair: 'R' },
      { x: -8, z: 40, n: 5, lv: [3, 2, 2, 3, 2], stair: 'R' },
      { x: -8, z: 35, n: 5, lv: [1, 2, 2, 3, 2], stair: 'L' },
      { x: -52, z: 57, n: 3, lv: [1, 2, 1], stair: 'L' },
      { x: -50, z: 52, n: 2, lv: [1, 2] },
      { x: -8, z: 14, n: 4, lv: [2, 1, 2, 1], stair: 'L' },
      { axis: 'z', x: 40, z: -45, n: 3, lv: [2, 1, 2], stair: 'L' },
      { axis: 'z', x: 35.4, z: -44, n: 3, lv: [1, 2, 2], stair: 'L' },
      { axis: 'z', x: 40, z: 40, n: 3, lv: [2, 2, 1], stair: 'R' },
      { axis: 'z', x: 35.4, z: 41, n: 3, lv: [2, 1, 1], stair: 'L' }
    ];
    for (let i = 0; i < rows.length; i++) map_harbor_row(C, rows[i]);
    const isl = [[-4, -24, 1], [8, -24, 2], [-4, 24, 2], [8, 24, 1]];
    for (let i = 0; i < isl.length; i++) map_harbor_row(C, { x: isl[i][0], z: isl[i][1], n: 1, lv: [isl[i][2]] });
    map_harbor_openbox(C, 17.5, -17.3, PI / 2, 'blue');
    map_harbor_openbox(C, 17.5, 17.3, -PI / 2, 'red');
    map_harbor_openbox(C, 40.5, -14.5, 0, 'corrA');
    map_harbor_openbox(C, 40.5, 14.5, PI, 'crane');

    // ---------- edifici entrabili (intonaci colorati, zoccolo, cornici crema)
    const dW = [{ side: 'n', at: -5, width: 3.2 }, { side: 'n', at: 5, width: 3.2 }, { side: 's', at: -5, width: 3.2 }, { side: 's', at: 5, width: 3.2 }, { side: 'e', at: 0, width: 2.4 }, { side: 'w', at: 0, width: 2.4 }];
    const dS = [{ side: 'n', at: 0, width: 1.8 }, { side: 's', at: 0, width: 1.8 }, { side: 'e', at: 0, width: 1.6 }, { side: 'w', at: 0, width: 1.6 }];
    const bl = [
      { x: -46, z: -38, w: 22, d: 14, floors: 2, floorH: 4.4, key: 'corrA', trim: 'cream', awn: 'corrB', roof: 'mvc', doors: dW },
      { x: -46, z: 38, w: 22, d: 14, floors: 2, floorH: 4.4, key: 'corrB', trim: 'cream', awn: 'corrA', roof: 'mva', doors: dW },
      { x: -47, z: 0, w: 12, d: 10, floors: 3, floorH: 3.4, key: 'stOcra', trim: 'cream', awn: 'tarp', roof: 'tac', doors: dS },
      { x: 0, z: 0, w: 12, d: 10, floors: 3, floorH: 3.4, key: 'stRosa', trim: 'cream', awn: 'blue', roof: 'tdv', doors: dS },
      { x: 28, z: 24, w: 8, d: 8, floors: 4, floorH: 3.4, key: 'cream', trim: 'red', awn: 'red', roof: 'ad', antH: 11, doors: dS },
      { x: 28, z: -26, w: 10, d: 8, floors: 3, floorH: 3.4, key: 'stSalvia', trim: 'cream', awn: 'tarp', roof: 'tav', doors: dS },
      { x: -18, z: -22, w: 9, d: 9, floors: 2, floorH: 3.4, key: 'brickR', trim: 'cream', awn: 'crane', roof: 'tv', doors: dS },
      { x: -18, z: 22, w: 9, d: 9, floors: 2, floorH: 3.4, key: 'stOcra', trim: 'woodD', awn: 'red', roof: 'ac', doors: dS }
    ];
    for (let i = 0; i < bl.length; i++) {
      const b = bl[i], dd = [];
      for (let k = 0; k < b.doors.length; k++) dd.push({ side: b.doors[k].side, at: b.doors[k].at, width: b.doors[k].width });
      kit.building({
        x: b.x, z: b.z, w: b.w, d: b.d, floors: b.floors, floorH: b.floorH, wall: 0.32,
        mat: M[b.key], innerMat: M.cream, floorMat: i < 2 ? M.concD : (i === 7 ? M.conc : M.wood),
        doors: dd, windows: true, roof: 'parapet', ruined: 0, rotY: 0
      });
      map_harbor_dress(C, b);
    }
    map_harbor_sg(C, 0, -34.8, 6.6, -38, PI / 2, 8, 1.6);
    map_harbor_sg(C, 1, -34.8, 6.6, 38, PI / 2, 8, 1.6);
    map_harbor_sg(C, 2, 0, 8.6, 5.2, 0, 5, 1.1);
    map_harbor_sg(C, 2, 0, 8.6, -5.2, PI, 5, 1.1);
    map_harbor_sg(C, 3, 23.8, 11.8, 24, -PI / 2, 5, 1.2);
    map_harbor_sg(C, 4, -40.8, 8.4, 0, PI / 2, 6, 1.2);
    map_harbor_sg(C, 5, 22.8, 8.4, -26, -PI / 2, 6, 1.2);
    map_harbor_sg(C, 6, -22.72, 5.0, 22, -PI / 2, 4.4, 0.95);
    map_harbor_sg(C, 7, -22.72, 5.0, -22, -PI / 2, 4, 0.9);
    D(-22.7, 4.4, 22, 0.06, 0.08, 4.8, M.signC); D(-22.7, 5.55, 22, 0.06, 0.08, 4.8, M.signC);
    // fasce rosse della torre di controllo
    for (let k = 1; k <= 3; k++) { D(28, k * 3.4 + 0.5, 19.95, 8.1, 0.35, 0.06, M.red); D(28, k * 3.4 + 0.5, 28.05, 8.1, 0.35, 0.06, M.red); }
    // scala antincendio della torre (lato est)
    for (let k = 1; k <= 3; k++) {
      const y = k * 3.4;
      D(32.75, y - 0.08, 24, 1.3, 0.08, 3.6, M.metal);
      map_harbor_tube(C, 'metalD', 33.38, y + 1, 22.2, 33.38, y + 1, 25.8, 0.025, 4);
      for (let j = 0; j <= 4; j++) map_harbor_tube(C, 'metalD', 33.38, y, 22.2 + j * 0.9, 33.38, y + 1, 22.2 + j * 0.9, 0.02, 3);
      map_harbor_tube(C, 'metalD', 32.2, y - 0.5, 22.3, 33.3, y - 0.08, 22.3, 0.03, 4);
      map_harbor_tube(C, 'metalD', 32.2, y - 0.5, 25.7, 33.3, y - 0.08, 25.7, 0.03, 4);
      if (k > 1) map_harbor_beam(C, 'metalD', 32.75, y - 3.4, k % 2 ? 25.4 : 22.6, 32.75, y - 0.08, k % 2 ? 22.6 : 25.4, 0.6, 0.06);
    }
    map_harbor_tube(C, 'metalD', 32.5, 2.3, 25.5, 32.5, 3.4, 25.5, 0.02, 3);
    map_harbor_tube(C, 'metalD', 32.9, 2.3, 25.5, 32.9, 3.4, 25.5, 0.02, 3);

    // ---------- interni: magazzini A e B (scaffalature, muletti, officina)
    const rackX = [-8.6, -2.6, 0, 2.6, 8.6];
    for (let i = 0; i < rackX.length; i++) {
      map_harbor_rack(C, -46 + rackX[i], 0, -41.4, true);
      map_harbor_rack(C, -46 + rackX[i], 0, -34.6, true);
      map_harbor_rack(C, -46 + rackX[i], 0, 34.6, true);
      if (i !== 3) map_harbor_rack(C, -46 + rackX[i], 0, 41.4, true);
    }
    map_harbor_forklift(C, -43.4, -37.8, 0.3);
    map_harbor_pallet(C, -48.6, -39.3, 0, 2); map_harbor_pallet(C, -46, -39.6, 0.4, 1);
    map_harbor_crate(C, -49, 4.4, -38, 1.2); map_harbor_crate(C, -47.6, 4.4, -37.4, 1.0); map_harbor_crate(C, -43, 4.4, -38.4, 1.3);
    map_harbor_pallet(C, -45, -38, 0.2, 2, 4.4);
    map_harbor_forklift(C, -48.6, 38, PI / 2);
    map_harbor_crates(C, -40.5, 38, 2);
    map_harbor_table(C, -43.4, 0, 41.6, 2.2, 0.8, 0);
    B(-45.6, 0, 41.6, 0.7, 0.95, 0.6, M.red); D(-45.6, 0.95, 41.6, 0.74, 0.04, 0.64, M.metalD);
    D(-43.4, 0.76, 41.7, 0.5, 0.25, 0.3, M.blue); D(-42.8, 0.76, 41.5, 0.3, 0.12, 0.2, M.metal, 0.4);
    map_harbor_barrel(C, -44.4, 43.9, 'B'); map_harbor_barrel(C, -45.1, 43.7, 'Y');
    for (let k = 0; k < 4; k++) C.I.tireF.push(map_harbor_mat4(-47.2, 0.13 + k * 0.27, 43.6, 1, 1, 1, 0));
    kit.collider(-47.7, 0, 43.1, -46.7, 1.1, 44.1);
    map_harbor_crate(C, -48, 4.4, 38.3, 1.3); map_harbor_crate(C, -44.5, 4.4, 37.6, 1.1); map_harbor_pallet(C, -46.4, 38.2, -0.2, 3, 4.4);
    // ---------- interni: ufficio del porto (reception, uffici, sala riunioni)
    map_harbor_counter(C, -47, 0, -1.8, 4, true);
    D(-47, 1.11, -1.8, 0.5, 0.3, 0.04, M.screen); D(-46, 1.11, -1.8, 0.3, 0.02, 0.22, M.white, 0.3);
    map_harbor_desk(C, -43.6, 0, 2.6, true, 1); map_harbor_desk(C, -50.4, 0, 2.6, true, 1);
    map_harbor_lockers(C, -52.4, 0, -2.8, 4, false);
    map_harbor_sofa(C, -42.0, 0, -3.2, false, -1);
    map_harbor_cyl(C, 'brickR', -52.1, 0, 3.9, 0.25, 0.2, 0.5, 8); map_harbor_blob(C, 'leaf', -52.1, 1.0, 3.9, 0.45, 1.3, 0.25, 0);
    map_harbor_desk(C, -47.85, 3.4, -0.42, true, -1); map_harbor_desk(C, -46.15, 3.4, -0.42, true, -1);
    map_harbor_desk(C, -47.85, 3.4, 0.42, true, 1); map_harbor_desk(C, -46.15, 3.4, 0.42, true, 1);
    map_harbor_lockers(C, -47, 3.4, -4.42, 5, true);
    map_harbor_table(C, -47, 6.8, 0, 3.2, 1.3, 6);
    D(-47, 7.57, 0, 1.4, 0.01, 0.8, M.tarp, 0.1);
    // ---------- interni: dogana (sportelli, scanner bagagli, uffici, camerata)
    map_harbor_counter(C, 0, 0, -1.6, 6.4, true); D(0, 1.11, -1.6, 6.0, 0.9, 0.05, M.glass);
    B(3.4, 0, 2.6, 3.0, 0.75, 0.8, M.metalD); D(3.4, 0.75, 2.6, 3.0, 0.04, 0.7, M.rubber); B(3.4, 0.79, 2.6, 1.0, 0.8, 0.9, M.blue);
    D(2.3, 0.79, 2.6, 0.5, 0.3, 0.4, M.card, 0.2); D(4.5, 0.79, 2.6, 0.45, 0.25, 0.35, M.tarp, -0.3);
    map_harbor_table(C, -3.4, 0, 2.8, 1.6, 0.8, 2);
    map_harbor_desk(C, -1.0, 3.4, 0, false, -1); map_harbor_desk(C, 1.0, 3.4, 0, false, 1);
    map_harbor_lockers(C, 0, 3.4, -4.42, 5, true);
    map_harbor_bunk(C, 0, 6.8, -0.8, true); map_harbor_bunk(C, 0, 6.8, 0.8, true);
    map_harbor_lockers(C, 0, 6.8, 4.42, 4, true);
    // ---------- interni: torre di controllo
    map_harbor_lockers(C, 24.55, 0, 21.6, 3, false);
    D(31, 0, 26.6, 0.9, 0.8, 0.9, M.card, 0.2);
    map_harbor_desk(C, 28, 3.4, 24, true, 1);
    map_harbor_desk(C, 28, 6.8, 23.8, true, 1); B(26.2, 6.8, 24, 0.6, 1.6, 0.6, M.metalD); D(26.52, 7.6, 24, 0.04, 0.5, 0.4, M.screen);
    map_harbor_counter(C, 28, 10.2, 23.4, 3.2, true);
    for (let k = -1; k <= 1; k++) D(28 + k * 1.0, 11.31, 23.4, 0.7, 0.42, 0.05, M.screen);
    map_harbor_table(C, 28, 10.2, 25.3, 1.4, 0.9, 2);
    // ---------- interni: capitaneria
    map_harbor_counter(C, 28, 0, -27.3, 4, true);
    map_harbor_desk(C, 30.6, 0, -24.3, true, 1);
    map_harbor_lockers(C, 23.55, 0, -28.4, 3, false);
    map_harbor_desk(C, 27, 3.4, -26, false, -1); map_harbor_desk(C, 29, 3.4, -26, false, 1);
    map_harbor_table(C, 28, 6.8, -26, 2.4, 1.2, 4); D(28, 7.57, -26, 1.6, 0.01, 0.9, M.tarp, -0.08);
    // ---------- interni: alloggi equipaggio (camerate)
    for (let i = 0; i < 4; i++) map_harbor_bunk(C, -18 + (i % 2 ? 2.3 : -2.3), 0, -22 + (i < 2 ? -2.45 : 2.45), true);
    map_harbor_lockers(C, -15, 0, -25.95, 2, true);
    map_harbor_bunk(C, -20.3, 3.4, -24.45, true); map_harbor_bunk(C, -15.7, 3.4, -24.45, true); map_harbor_bunk(C, -20.3, 3.4, -19.55, true);
    map_harbor_table(C, -15.9, 3.4, -19.6, 1.2, 0.8, 2);
    // ---------- interni: mensa-bar
    map_harbor_counter(C, -20.4, 0, 22, 4, false);
    for (let k = 0; k < 4; k++) { D(-19.55, 0, 20.6 + k * 0.95, 0.3, 0.7, 0.3, M.metalD); D(-19.55, 0.7, 20.6 + k * 0.95, 0.4, 0.05, 0.4, M.red); }
    D(-22.0, 0, 20.5, 0.3, 2.0, 1.0, M.woodD); D(-22.0, 0, 23.5, 0.3, 2.0, 1.0, M.woodD);
    for (let k = 0; k < 6; k++) D(-21.9, 1.0 + (k % 2) * 0.5, (k < 3 ? 20.2 : 23.2) + (k % 3) * 0.3, 0.1, 0.26, 0.1, k % 3 ? M.leaf : M.red);
    D(-21.82, 2.15, 20.5, 0.05, 0.1, 0.9, M.signC); D(-21.82, 2.15, 23.5, 0.05, 0.1, 0.9, M.signC);
    D(-20.4, 1.11, 21, 0.3, 0.3, 0.3, M.metal); D(-20.4, 1.11, 23.2, 0.22, 0.02, 0.3, M.white);
    map_harbor_table(C, -15.6, 0, 19.7, 1.1, 1.1, 4); map_harbor_table(C, -15.6, 0, 24.4, 1.1, 1.1, 4);
    D(-14.2, 0, 18.2, 0.7, 1.9, 0.6, M.white); D(-15.1, 0, 18.15, 0.9, 0.9, 0.55, M.metal);
    map_harbor_table(C, -18, 3.4, 22, 2.4, 1.0, 6);
    map_harbor_sofa(C, -14.3, 3.4, 22, false, -1);

    // ---------- luci vere (6): due magazzini, dogana, neon del bar, due bracieri
    kit.light(-46, 3.6, -38, 0xffc888, 55, 22);
    kit.light(-46, 3.6, 38, 0xffc888, 55, 22);
    kit.light(0, 2.7, 1.2, 0xfff0d0, 30, 14);
    kit.light(-24.4, 3.2, 22, 0x48d8ff, 40, 16);
    kit.light(15.5, 1.5, -10.2, 0xff8a3a, 45, 16);
    kit.light(15.5, 1.5, 10.2, 0xff8a3a, 45, 16);
    map_harbor_firebarrel(C, 15.5, -10.2);
    map_harbor_firebarrel(C, 15.5, 10.2);

    // ---------- spawn al coperto (baie fra container con rete mimetica)
    for (let k = 0; k < 10; k++) {
      map_harbor_cont(C, -35 + k * 7, 0, 59.9, true, C.pick(map_harbor_CI));
      map_harbor_cont(C, -35 + k * 7, 0, -59.9, true, C.pick(map_harbor_CI));
    }
    for (let k = 0; k < 9; k++) {
      const bx = -31.5 + k * 7;
      kit.spawn('blue', bx, 59.4);
      kit.spawn('red', bx, -59.4);
      for (let s = -1; s <= 1; s += 2) {
        B(bx, 2.6, s * 59.9, 7.0, 0.12, 6.1, M.net);
        D(bx, 2.42, s * 59.4, 1.2, 0.08, 0.3, M.lamp);
        D(bx - 1.6, 0, s * 62.1, 0.9, 0.45, 0.5, M.tarp, rnd(-0.2, 0.2));
        D(bx + 1.5, 0, s * 62.2, 0.5, 0.7, 0.5, M.woodD, rnd(-0.3, 0.3));
        map_harbor_sandbags(C, bx, s * 53.8, 0, 3.2);
        if (k % 3 === 0) dq(11, bx, s * 56.2, 2.6, 2.6, s > 0 ? 0 : PI);
      }
    }

    // ---------- veicoli
    const cars = [[-32.5, -47, 0, 'red'], [-24.5, -30, 0, 'blue'], [-32, -14, 0, 'white'], [-25, 5, 0, 'blue'], [-32, 22, 0, 'crane'], [-24.5, 41, 0, 'red'],
      [8, -52, PI / 2, 'white'], [-13, -45.3, PI / 2, 'blue'], [14, 50, PI / 2, 'crane'], [0, 51, PI / 2, 'red'], [33.5, 3.2, PI / 2, 'white'], [-38, 52.5, PI / 2, 'blue']];
    for (let i = 0; i < cars.length; i++) map_harbor_car(C, cars[i][0], cars[i][1], cars[i][2], cars[i][3]);
    map_harbor_truck(C, 41, 0, 0, 1, 'white');
    map_harbor_truck(C, -27, 30, 0, 0, 'blue');
    map_harbor_truck(C, -29, -30, PI, 3, 'red');
    map_harbor_truck(C, 10, -29.5, PI / 2, 2, 'white');
    map_harbor_truck(C, -8, 29.5, -PI / 2, 4, 'blue');
    map_harbor_forklift(C, -52, -27, PI / 2);
    map_harbor_forklift(C, -40, 27, 0);
    map_harbor_forklift(C, 42, -22, 0.2);

    // ---------- coperture: jersey, sacchi, casse, barili, pallet
    const jl = [[30, -8, 39, -8], [30, 8, 39, 8], [12, -20, 22, -20], [12, 20, 22, 20], [-60, -48, -54, -48], [-60, 48, -54, 48],
      [-20, -48, -4, -48], [-20, 48, -4, 48], [14, -48, 28, -48], [14, 48, 28, 48], [-10, -9, -10, -3], [-10, 3, -10, 9], [10, -9, 10, -3], [10, 3, 10, 9]];
    for (let i = 0; i < jl.length; i++) map_harbor_jline(C, jl[i][0], jl[i][1], jl[i][2], jl[i][3]);
    const sbg = [[-14.5, 3.4, 0], [14.5, -3.4, 0], [-56, -12, PI / 2], [-56, 12, PI / 2], [30, -14, PI / 2], [30, 14, PI / 2], [-30, -2, PI / 2], [-30, 2, PI / 2], [2, -19, 0], [2, 19, 0]];
    for (let i = 0; i < sbg.length; i++) map_harbor_sandbags(C, sbg[i][0], sbg[i][1], sbg[i][2], 3.2);
    const crs = [[-58, -18.5, 3], [-58, 18.5, 3], [-38, -14, 3], [-38, 14, 3], [22, -8, 3], [22, 8, 3], [41, -26, 3], [41, 26, 3],
      [-14, -51, 2], [14, -45, 2], [-14, 51, 2], [14, 45, 2], [-27.5, -50.5, 2], [-27.5, 50.5, 2], [-3, -10, 2], [3, 10, 2]];
    for (let i = 0; i < crs.length; i++) map_harbor_crates(C, crs[i][0], crs[i][1], crs[i][2]);
    const brs = [[-60, -35, 4], [-60, 35, 4], [-36.5, -24.5, 3], [-36.5, 24.5, 3], [24, -16, 3], [24, 16, 3], [43, -34, 3], [43, 34, 3], [-12, 8, 3], [12, -8, 3], [31.5, -19, 3], [31.5, 19.4, 3]];
    for (let i = 0; i < brs.length; i++) map_harbor_barrels(C, brs[i][0], brs[i][1], brs[i][2]);
    const pls = [[-59, -10, 0], [-59, 10, 0], [-36, -4, PI / 2], [-36, 6, 0.3], [26, -12, 0], [26, 12, 0], [43, 12, PI / 2], [43, -12, 0.2]];
    for (let i = 0; i < pls.length; i++) map_harbor_pallet(C, pls[i][0], pls[i][1], pls[i][2], 1 + Math.floor(C.rng() * 3));
    map_harbor_dumpster(C, -12.4, -19, 0, 'blue');
    map_harbor_dumpster(C, -12.4, 19, PI, 'red');
    map_harbor_dumpster(C, 22.6, 27, PI / 2, 'blue');
    const tst = [[-36.3, -28.3, 4], [33.2, 30.6, 3], [-57.5, 26, 4], [25, -34.6, 3]];
    for (let i = 0; i < tst.length; i++) {
      for (let k = 0; k < tst[i][2]; k++) C.I.tireF.push(map_harbor_mat4(tst[i][0] + rnd(-0.04, 0.04), 0.13 + k * 0.27, tst[i][1] + rnd(-0.04, 0.04), 1, 1, 1, 0));
      kit.collider(tst[i][0] - 0.48, 0, tst[i][1] - 0.48, tst[i][0] + 0.48, tst[i][2] * 0.27, tst[i][1] + 0.48);
    }

    // ---------- recinzioni, lampioni, torri faro, pali con cavi
    const fns = [[-61, -22, -50, -22], [-44, -22, -37, -22], [-61, 22, -50, 22], [-44, 22, -37, 22], [24, -33, 33, -33], [24, 33, 33, 33]];
    for (let i = 0; i < fns.length; i++) map_harbor_fence(C, fns[i][0], fns[i][1], fns[i][2], fns[i][3]);
    const lzW = [-50, -25, 0, 25, 50], lzE = [-50, -10, 10, 50], lzQ = [-38, -3, 3, 38];
    for (let i = 0; i < lzW.length; i++) {
      map_harbor_lamp(C, -34.5, lzW[i], 1, 0, 8);
      if (i > 0) map_harbor_sag(C, 'rubber', -34.5, 8.25, lzW[i - 1], -34.5, 8.25, lzW[i], 0.5, 0.012);
    }
    for (let i = 0; i < lzE.length; i++) {
      map_harbor_lamp(C, -22, lzE[i], -1, 0, 8);
      if (i > 0) map_harbor_sag(C, 'rubber', -22, 8.25, lzE[i - 1], -22, 8.25, lzE[i], 0.6, 0.012);
    }
    for (let i = 0; i < lzQ.length; i++) map_harbor_lamp(C, 44, lzQ[i], -1, 0, 9);
    map_harbor_mast(C, 20.5, -32, 20);
    map_harbor_mast(C, 21.5, 31, 20);
    map_harbor_mast(C, -60, -27, 18);
    map_harbor_mast(C, -60, 27, 18);
    const upz = [-52, -38, -21, -5, 9, 23.5, 38, 52];
    for (let i = 0; i < upz.length; i++) {
      const ux = -60.8, uz = upz[i];
      map_harbor_tube(C, 'woodD', ux, 0, uz, ux + rnd(-0.1, 0.1), 9, uz, 0.14, 6, 0.09);
      map_harbor_tube(C, 'woodD', ux - 0.9, 8.4, uz, ux + 0.9, 8.4, uz, 0.05, 4);
      map_harbor_cyl(C, 'white', ux - 0.7, 8.45, uz, 0.04, 0.05, 0.16, 6);
      map_harbor_cyl(C, 'white', ux + 0.7, 8.45, uz, 0.04, 0.05, 0.16, 6);
      if (i % 3 === 1) D(ux + 0.32, 6.4, uz, 0.5, 0.8, 0.5, M.metalD);
      kit.collider(ux - 0.15, 0, uz - 0.15, ux + 0.15, 4, uz + 0.15);
      if (i > 0) {
        map_harbor_sag(C, 'rubber', ux - 0.7, 8.6, upz[i - 1], ux - 0.7, 8.6, uz, 0.6, 0.015);
        map_harbor_sag(C, 'rubber', ux + 0.7, 8.6, upz[i - 1], ux + 0.7, 8.6, uz, 0.7, 0.015);
      }
    }
    map_harbor_sag(C, 'rubber', -60.1, 8.6, -38, -57.1, 8.9, -38, 0.3, 0.015);
    map_harbor_sag(C, 'rubber', -60.1, 8.6, 38, -57.1, 8.9, 38, 0.3, 0.015);
    map_harbor_sag(C, 'rubber', -34.5, 8.2, 0, -41.1, 10.1, 0.6, 0.4, 0.012);
    map_harbor_sag(C, 'rubber', -22, 8.2, 10, -22.4, 6.9, 18, 0.3, 0.012);

    // ---------- alberi, panchine, pensilina, posto di guardia della dogana
    map_harbor_tree(C, -38.5, -3.8, 6.5); map_harbor_tree(C, -38.5, 3.8, 7);
    map_harbor_tree(C, -37.5, -17, 6); map_harbor_tree(C, -37.5, 17.5, 6.5);
    map_harbor_tree(C, -60, -13.5, 7); map_harbor_tree(C, -60, 13.5, 6.5);
    map_harbor_bench(C, -21.4, -35, PI / 2); map_harbor_bench(C, -21.4, 35, PI / 2); map_harbor_bench(C, -21.4, -12.5, PI / 2);
    B(-20.75, 0.15, -44, 0.06, 2.1, 3.0, M.glass);
    D(-21.4, 0.15, -45.5, 1.3, 2.1, 0.05, M.glass); D(-21.4, 0.15, -42.5, 1.3, 2.1, 0.05, M.glass);
    D(-21.5, 2.3, -44, 1.9, 0.08, 3.4, M.metalD);
    for (let i = 0; i < 4; i++) D(i % 2 ? -20.75 : -22.05, 0.15, i < 2 ? -45.5 : -42.5, 0.07, 2.15, 0.07, M.metalD);
    map_harbor_bench(C, -21.25, -44, PI / 2);
    D(-22.5, 0.15, -41.6, 0.07, 2.6, 0.07, M.metalD); D(-22.5, 2.3, -41.6, 0.06, 0.5, 0.5, M.blue);
    const bins = [-58, -30, -8, 12, 30, 57];
    for (let i = 0; i < bins.length; i++) map_harbor_cyl(C, 'metalD', -22.3 + (i % 2) * 0.5, 0.15, bins[i], 0.24, 0.2, 0.75, 8);
    const booth = function (x, z, sd) {
      for (let s = -1; s <= 1; s += 2) {
        B(x + s * 0.95, 0, z, 0.1, 1.0, 2.0, M.white); B(x + s * 0.95, 1.0, z, 0.06, 1.2, 2.0, M.glass);
        D(x + s * 0.95, 0, z - 0.95, 0.1, 2.2, 0.1, M.metalD); D(x + s * 0.95, 0, z + 0.95, 0.1, 2.2, 0.1, M.metalD);
      }
      B(x, 0, z - sd * 0.95, 1.8, 1.0, 0.1, M.white); B(x, 1.0, z - sd * 0.95, 1.8, 1.2, 0.06, M.glass);
      D(x, 0.45, z - sd * 1.01, 1.82, 0.2, 0.02, M.red);
      D(x, 2.2, z, 2.4, 0.12, 2.4, M.red); D(x, 2.12, z, 0.5, 0.06, 0.2, M.lamp);
      D(x, 0, z - sd * 0.3, 0.4, 0.45, 0.4, M.metalD); D(x + 0.5, 0.7, z - sd * 0.8, 0.5, 0.3, 0.06, M.screen);
      map_harbor_sg(C, 2, x, 2.55, z - sd * 1.22, sd > 0 ? PI : 0, 2.0, 0.44);
    };
    booth(-12, -4.6, 1);
    booth(12, 4.6, -1);
    const gate = function (x, z, s) {
      B(x, 0, z, 0.35, 1.1, 0.35, M.crane);
      map_harbor_beam(C, 'white', x, 1.0, z, x, 4.6, z + s * 2.4, 0.12, 0.12);
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        map_harbor_beam(C, 'red', x, 1.0 + 3.6 * (t - 0.05), z + s * 2.4 * (t - 0.05), x, 1.0 + 3.6 * (t + 0.05), z + s * 2.4 * (t + 0.05), 0.14, 0.14);
      }
      D(x, 1.1, z, 0.2, 0.16, 0.2, M.redL);
      dq(13, x, z + s * 2.2, 1.6, 1.6, 0);
    };
    gate(-10, -2.8, 1);
    gate(10, 2.8, -1);
    const flags = [[-4.2, 7.2, 'tarp'], [4.2, 7.2, 'red'], [-4.2, -7.2, 'red'], [4.2, -7.2, 'tarp']];
    for (let i = 0; i < flags.length; i++) {
      const fx = flags[i][0], fz = flags[i][1];
      map_harbor_tube(C, 'white', fx, 0, fz, fx, 9, fz, 0.06, 6, 0.035);
      map_harbor_cyl(C, 'concD', fx, 0, fz, 0.3, 0.36, 0.3, 8);
      D(fx + 0.75, 7.9, fz, 1.4, 0.85, 0.03, M[flags[i][2]], 0.12);
      kit.collider(fx - 0.12, 0, fz - 0.12, fx + 0.12, 3, fz + 0.12);
    }
    // vasi di terracotta e fioriere lungo la via delle botteghe (ovest)
    for (let i = 0; i < 10; i++) {
      const pz = -58 + i * 12.6 + rnd(-1.5, 1.5);
      if (pz > -20 && pz < 11) continue;
      map_harbor_cyl(C, 'brickR', -61.3, 0, pz, 0.32, 0.24, 0.5, 8, true);
      map_harbor_blob(C, 'leaf', -61.3, 0.95, pz, 0.5, 1.2, 0.25, 0);
    }
    // tavolini del bar sul marciapiede davanti alla mensa
    for (let i = 0; i < 2; i++) {
      const tz = 20.4 + i * 3.2;
      map_harbor_cyl(C, 'metalD', -24.6, 0, tz, 0.05, 0.22, 0.72, 8);
      map_harbor_cyl(C, 'white', -24.6, 0.72, tz, 0.42, 0.42, 0.04, 12);
      D(-24.6, 0, tz - 0.75, 0.38, 0.45, 0.38, M.red, 0.2); D(-24.6, 0, tz + 0.75, 0.38, 0.45, 0.38, M.red, -0.15);
      kit.collider(-25.0, 0, tz - 0.4, -24.2, 0.76, tz + 0.4);
    }

    // ---------- detriti, mattoni, erbacce (centinaia, istanziati)
    for (let i = 0; i < 130; i++) {
      const edge = C.rng() < 0.45, x = edge ? rnd(-61.6, -58) : rnd(-33, 46), z = rnd(-62, 62);
      C.I.rubble.push(map_harbor_mat4(x, 0.08, z, rnd(0.15, 0.6), rnd(0.1, 0.3), rnd(0.15, 0.6), rnd(0, PI)));
    }
    for (let i = 0; i < 80; i++) C.I.brickD.push(map_harbor_mat4(rnd(-61.5, 46), 0.06, rnd(-62, 62), 0.22, 0.08, 0.11, rnd(0, PI)));
    for (let i = 0; i < 110; i++) {
      const g = C.rng();
      let x, z;
      if (g < 0.4) { x = rnd(-61.7, -60.2); z = rnd(-62, 62); }
      else if (g < 0.7) { x = rnd(45.2, 46.6); z = rnd(-62, 62); }
      else { x = -35.05 + rnd(-0.1, 0.1); z = rnd(-60, 60); }
      C.I.weed.push(map_harbor_mat4(x, 0.12, z, rnd(0.3, 0.7), rnd(0.25, 0.6), rnd(0.3, 0.7), rnd(0, PI)));
    }

    // ---------- lotti fusi (1 draw call per materiale) e istanze
    map_harbor_flush(C);
    const boxG = new T.BoxGeometry(1, 1, 1);
    const cylX = new T.CylinderGeometry(1, 1, 1, 14); cylX.rotateZ(PI / 2);
    const planeG = new T.PlaneGeometry(1, 1); planeG.rotateX(-PI / 2);
    const bp = [[0, 0], [0.27, 0], [0.29, 0.03], [0.29, 0.28], [0.305, 0.3], [0.29, 0.32], [0.29, 0.58], [0.305, 0.6], [0.29, 0.62], [0.29, 0.87], [0.27, 0.9], [0, 0.9]];
    const bv = [];
    for (let i = 0; i < bp.length; i++) bv.push(new T.Vector2(bp[i][0], bp[i][1]));
    const barG = new T.LatheGeometry(bv, 12);
    const tireG = new T.TorusGeometry(0.35, 0.15, 8, 14); tireG.rotateY(PI / 2);
    const tireFG = new T.TorusGeometry(0.33, 0.13, 8, 14); tireFG.rotateX(PI / 2);
    const bagG = new T.SphereGeometry(0.5, 8, 6);
    const weedG = new T.IcosahedronGeometry(0.5, 0);
    const inst = function (name, geo, mat, cast) { if (C.I[name].length) kit.instanced(geo, mat, C.I[name], { cast: cast !== false }); };
    inst('winLit', boxG, M.winLit, false);
    inst('winDark', boxG, M.glass, false);
    inst('sill', boxG, M.cream, false);
    inst('wheel', cylX, M.rubber);
    inst('hub', cylX, M.metal, false);
    inst('barR', barG, M.red);
    inst('barB', barG, M.blue);
    inst('barY', barG, M.crane);
    inst('barRust', barG, M.rust);
    inst('tire', tireG, M.rubber, false);
    inst('tireF', tireFG, M.rubber);
    inst('lineW', planeG, M.white, false);
    inst('lineY', planeG, M.crane, false);
    inst('rubble', boxG, M.concD);
    inst('brickD', boxG, M.brickR, false);
    inst('carton', boxG, M.card);
    inst('weed', weedG, M.leaf, false);
    inst('bag', bagG, M.sandbag);
  }
});

