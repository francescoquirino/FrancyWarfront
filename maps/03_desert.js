// FRANCY WARFRONT — maps/03_desert.js — 'desert' "Base nel Deserto" (v4)
// Nota onesta: file riscritto per intero ma MAI provato nel gioco. Le texture sono dipinte a codice (canvas 2D).
// Ipotesi da verificare: kit.mesh non tocca le UV (le scalo io nei pezzi fusi) e kit.decal mappa u=larghezza, v=lunghezza.
// Veicoli tolti (li mette il motore), resta solo l'elicottero nell'hangar.
// Sud (z+): FOB VIPER blu con portale, hangar ad arco, piazzola H, comando, traliccio radio (punto eroe 1).
// Centro: strada asfaltata, wadi secco con ponte, checkpoint. Nord (z-): villaggio di fango con bazar, moschea e minareto (punto eroe 2).

// Rettangoli [x, y, w, h] dei cartelli dentro l'atlante 1024x1024
const map_desert_SIGNS = [
  [0, 0, 640, 192], [640, 0, 384, 192], [0, 192, 320, 160], [320, 192, 352, 160], [672, 192, 352, 160],
  [0, 352, 384, 160], [384, 352, 320, 160], [704, 352, 320, 160], [0, 512, 384, 192], [384, 512, 320, 192],
  [704, 512, 320, 192], [0, 704, 384, 320], [384, 704, 256, 320], [640, 704, 192, 320], [832, 704, 192, 320]
];

// Piccolo "pennello" per dipingere texture ripetibili senza cuciture
function map_desert_paint(kit, S) {
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const x = cv.getContext('2d'), R = kit.rand;
  const p = {
    cv, x, S,
    rgb: (c, a) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a === undefined ? 1 : a) + ')',
    fill(c) { x.fillStyle = p.rgb(c); x.fillRect(0, 0, S, S); },
    each(fn) { for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { x.save(); x.translate(ox * S, oy * S); fn(); x.restore(); } },
    blot(n, r0, r1, cols, a0, a1) {
      for (let i = 0; i < n; i++) {
        const px = R(0, S), py = R(0, S), r = R(r0, r1), col = kit.pick(cols), a = R(a0, a1);
        const g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, p.rgb(col, a)); g.addColorStop(1, p.rgb(col, 0));
        x.fillStyle = g;
        p.each(() => x.fillRect(px - r, py - r, 2 * r, 2 * r));
      }
    },
    grain(n, cols, a0, a1, s0, s1) {
      for (let i = 0; i < n; i++) { const s = R(s0, s1); x.fillStyle = p.rgb(kit.pick(cols), R(a0, a1)); x.fillRect(R(0, S), R(0, S), s, s); }
    },
    crack(n, col, len, w) {
      x.lineJoin = 'round'; x.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        let px = R(0, S), py = R(0, S), a = R(0, 6.28);
        const pts = [[px, py]], steps = Math.max(4, Math.round((R(0.5, 1) * len) / 10));
        for (let s = 0; s < steps; s++) { a += R(-0.7, 0.7); px += Math.cos(a) * 10; py += Math.sin(a) * 10; pts.push([px, py]); }
        x.strokeStyle = p.rgb(col, R(0.6, 0.95)); x.lineWidth = R(0.6, 1) * w;
        p.each(() => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let s = 1; s < pts.length; s++) x.lineTo(pts[s][0], pts[s][1]); x.stroke(); });
      }
    },
    streak(n, col, a, vert, l0, l1, w) {
      for (let i = 0; i < n; i++) {
        const px = R(0, S), py = R(0, S), len = R(l0, l1), ww = R(w * 0.5, w * 1.5);
        const g = vert ? x.createLinearGradient(0, py, 0, py + len) : x.createLinearGradient(px, 0, px + len, 0);
        g.addColorStop(0, p.rgb(col, 0)); g.addColorStop(0.3, p.rgb(col, a)); g.addColorStop(1, p.rgb(col, 0));
        x.fillStyle = g;
        p.each(() => { if (vert) x.fillRect(px, py, ww, len); else x.fillRect(px, py, len, ww); });
      }
    },
    blob(X, Y, r, rr) {
      x.beginPath();
      for (let i = 0; i < rr.length; i++) { const a = (i / rr.length) * 6.283, d = r * rr[i]; if (i) x.lineTo(X + Math.cos(a) * d, Y + Math.sin(a) * d); else x.moveTo(X + Math.cos(a) * d, Y + Math.sin(a) * d); }
      x.closePath();
    },
    radii(n, a, b) { const rr = []; for (let i = 0; i < n; i++) rr.push(R(a, b)); return rr; }
  };
  return p;
}

// Intonaco di fango chiaro (si tinge col colore del materiale): crepe, scrostature con mattoni, paglia, colature
function map_desert_texMud(kit) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand;
  p.fill([226, 218, 202]);
  p.blot(70, 60, 220, [[204, 192, 170], [229, 224, 214], [196, 182, 160]], 0.1, 0.3);
  p.streak(200, [200, 188, 166], 0.12, false, 80, 300, 3);
  p.grain(14000, [[190, 176, 152], [229, 223, 210], [170, 155, 132]], 0.1, 0.35, 1, 4);
  x.lineWidth = 1.2;
  for (let i = 0; i < 1400; i++) {
    const px = R(0, S), py = R(0, S), a = R(0, 3.14), l = R(4, 11);
    x.strokeStyle = p.rgb([226, 212, 176], R(0.3, 0.6));
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const px = R(0, S), py = R(0, S), r = R(50, 110), rr = p.radii(13, 0.6, 1.1);
    p.each(() => {
      x.save(); p.blob(px, py, r, rr); x.clip();
      x.fillStyle = p.rgb([168, 142, 114]); x.fillRect(px - r * 1.2, py - r * 1.2, r * 2.4, r * 2.4);
      x.fillStyle = p.rgb([118, 96, 76], 0.8);
      for (let yy = -r * 1.2, row = 0; yy < r * 1.2; yy += 26, row++) {
        x.fillRect(px - r * 1.2, py + yy, r * 2.4, 3);
        for (let xx = -r * 1.2 + (row % 2) * 30; xx < r * 1.2; xx += 60) x.fillRect(px + xx, py + yy, 3, 26);
      }
      x.restore();
      p.blob(px, py, r, rr); x.strokeStyle = p.rgb([229, 224, 214], 0.8); x.lineWidth = 3; x.stroke();
      p.blob(px + 1.5, py + 2.5, r, rr); x.strokeStyle = p.rgb([120, 100, 80], 0.35); x.lineWidth = 2; x.stroke();
    });
  }
  p.streak(40, [150, 132, 108], 0.14, true, 150, 500, 10);
  p.crack(9, [110, 92, 72], 280, 2.4);
  return p.cv;
}

// Mattoni di fango a vista (2 m per ripetizione: 5 mattoni x 16 corsi)
function map_desert_texBrick(kit) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand, bw = S / 5, bh = S / 16;
  p.fill([128, 100, 72]);
  for (let row = 0; row < 16; row++) for (let i = -1; i < 6; i++) {
    const bx = i * bw + (row % 2 ? bw / 2 : 0), t = R(-18, 18);
    x.fillStyle = p.rgb([178 + t, 140 + t * 0.8, 98 + t * 0.6]); x.fillRect(bx + 3, row * bh + 3, bw - 6, bh - 6);
    x.fillStyle = p.rgb([216, 186, 142], 0.28); x.fillRect(bx + 3, row * bh + 3, bw - 6, 3);
    x.fillStyle = p.rgb([70, 50, 36], 0.3); x.fillRect(bx + 3, row * bh + bh - 7, bw - 6, 4);
  }
  p.blot(30, 40, 160, [[110, 85, 60], [206, 176, 132]], 0.08, 0.22);
  p.grain(9000, [[120, 92, 64], [210, 180, 136], [150, 118, 84]], 0.12, 0.4, 1, 4);
  p.streak(24, [100, 78, 56], 0.16, true, 120, 400, 9);
  p.crack(5, [84, 62, 44], 240, 2.6);
  return p.cv;
}

function map_desert_winPath(x, cx, y0, w, h) {
  const r = w / 2;
  x.beginPath(); x.moveTo(cx - r, y0 + h); x.lineTo(cx - r, y0 + r); x.arc(cx, y0 + r, r, Math.PI, 0, false); x.lineTo(cx + r, y0 + h); x.closePath();
}

// Facciata 6 m x 6 m (2 piani x 3 finestre ad arco) — emis=true dipinge la mappa delle finestre accese
function map_desert_texFacade(kit, pal, plan, emis) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand, CW = S / 3, CH = S / 2;
  if (emis) { x.fillStyle = '#000000'; x.fillRect(0, 0, S, S); }
  else {
    p.fill(pal.wall);
    p.blot(60, 60, 240, [pal.dark, pal.light], 0.1, 0.3);
    p.streak(160, pal.dark, 0.1, false, 80, 300, 3);
    p.grain(13000, [pal.dark, pal.light, pal.stain], 0.08, 0.3, 1, 4);
    for (let i = 0; i < 2; i++) {
      const px = R(0, S), py = R(0, S), r = R(40, 80), rr = p.radii(12, 0.6, 1.1);
      p.each(() => { p.blob(px, py, r, rr); x.fillStyle = p.rgb([160, 128, 96]); x.fill(); x.strokeStyle = p.rgb(pal.light, 0.8); x.lineWidth = 3; x.stroke(); });
    }
    p.crack(6, pal.stain, 300, 2.4);
    for (let row = 0; row < 2; row++) {
      x.fillStyle = p.rgb(pal.trim); x.fillRect(0, row * CH, S, 18);
      x.fillStyle = p.rgb(pal.stain, 0.35); x.fillRect(0, row * CH + 18, S, 6);
      x.strokeStyle = p.rgb([52, 48, 44], 0.9); x.lineWidth = 2.5; x.beginPath();
      for (let xx = 0; xx <= S; xx += 16) { const yy = row * CH + 62 + 7 * Math.sin((xx / S) * 6.283 * 3 + row); if (xx) x.lineTo(xx, yy); else x.moveTo(xx, yy); }
      x.stroke();
    }
  }
  for (let i = 0; i < 6; i++) {
    const cx = ((i % 3) + 0.5) * CW, top = ((i / 3) | 0) * CH, y0 = top + 110, w = 170, h = 250, pl = plan[i];
    if (emis) {
      if (pl.lit) {
        map_desert_winPath(x, cx, y0, w, h); x.fillStyle = 'rgb(255,190,105)'; x.fill();
        x.fillStyle = '#000000'; x.fillRect(cx - 4, y0, 8, h); x.fillRect(cx - w / 2, y0 + 95, w, 8);
        if (pl.kind === 1) x.fillRect(cx - w / 2, y0 + h * 0.45, w, h * 0.55);
        if (pl.kind === 2) { x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(cx - w / 2, y0, w * 0.55, h); }
      }
      continue;
    }
    for (let s = 0; s < 6; s++) {
      const sx = cx - w / 2 - 14 + R(0, w + 20), len = R(50, 150), g = x.createLinearGradient(0, y0 + h + 18, 0, y0 + h + 18 + len);
      g.addColorStop(0, p.rgb(pal.stain, 0.34)); g.addColorStop(1, p.rgb(pal.stain, 0));
      x.fillStyle = g; x.fillRect(sx, y0 + h + 18, R(5, 14), len);
    }
    map_desert_winPath(x, cx, y0 - 16, w + 34, h + 16); x.fillStyle = p.rgb(pal.trim); x.fill();
    x.strokeStyle = p.rgb(pal.stain, 0.5); x.lineWidth = 2; x.stroke();
    x.save(); map_desert_winPath(x, cx, y0, w, h); x.clip();
    if (pl.lit) { x.fillStyle = p.rgb([224, 188, 124]); x.fillRect(cx - w / 2, y0, w, h); }
    else {
      const g = x.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, p.rgb([152, 188, 218])); g.addColorStop(0.55, p.rgb([104, 136, 166])); g.addColorStop(1, p.rgb([62, 84, 108]));
      x.fillStyle = g; x.fillRect(cx - w / 2, y0, w, h);
      x.fillStyle = p.rgb([228, 226, 214], 0.16);
      x.beginPath(); x.moveTo(cx - w / 2, y0 + h * 0.7); x.lineTo(cx + w / 2, y0 + h * 0.2); x.lineTo(cx + w / 2, y0 + h * 0.4); x.lineTo(cx - w / 2, y0 + h * 0.9); x.closePath(); x.fill();
    }
    if (pl.kind === 1) {
      x.fillStyle = p.rgb(pal.shut); x.fillRect(cx - w / 2, y0 + h * 0.45, w, h * 0.55);
      x.fillStyle = p.rgb([40, 40, 40], 0.4);
      for (let yy = y0 + h * 0.45; yy < y0 + h; yy += 14) x.fillRect(cx - w / 2, yy, w, 3);
    } else if (pl.kind === 2) {
      x.fillStyle = p.rgb(pal.cloth); x.fillRect(cx - w / 2, y0, w * 0.55, h);
      for (let xx = cx - w / 2; xx < cx + w * 0.05; xx += 12) { x.fillStyle = p.rgb([40, 36, 32], 0.22); x.fillRect(xx, y0, 4, h); x.fillStyle = p.rgb([229, 224, 210], 0.18); x.fillRect(xx + 5, y0, 3, h); }
    } else if (pl.kind === 3) {
      x.fillStyle = p.rgb([128, 92, 60]); x.fillRect(cx - w / 2, y0, w, h);
      x.strokeStyle = p.rgb([58, 42, 30], 0.85); x.lineWidth = 3;
      for (let d = -h; d < w + h; d += 16) {
        x.beginPath(); x.moveTo(cx - w / 2 + d, y0); x.lineTo(cx - w / 2 + d + h, y0 + h); x.stroke();
        x.beginPath(); x.moveTo(cx - w / 2 + d, y0 + h); x.lineTo(cx - w / 2 + d + h, y0); x.stroke();
      }
    }
    x.fillStyle = p.rgb(pal.wood); x.fillRect(cx - 4, y0, 8, h); x.fillRect(cx - w / 2, y0 + 95, w, 8);
    x.restore();
    map_desert_winPath(x, cx, y0, w, h); x.strokeStyle = p.rgb([52, 42, 32], 0.6); x.lineWidth = 4; x.stroke();
    x.fillStyle = p.rgb(pal.trim); x.fillRect(cx - w / 2 - 24, y0 + h, w + 48, 18);
    x.fillStyle = p.rgb([52, 42, 32], 0.4); x.fillRect(cx - w / 2 - 24, y0 + h + 18, w + 48, 5);
    if (pl.ac) {
      const ax = cx + 106, ay = y0 + 160;
      x.fillStyle = p.rgb([156, 156, 150]); x.fillRect(ax, ay, 58, 46);
      x.fillStyle = p.rgb([70, 70, 68]); for (let yy = ay + 6; yy < ay + 42; yy += 6) x.fillRect(ax + 5, yy, 48, 2);
      x.fillStyle = p.rgb([60, 56, 52]); x.fillRect(ax + 4, ay + 46, 4, 12); x.fillRect(ax + 50, ay + 46, 4, 12);
      const g = x.createLinearGradient(0, ay + 46, 0, ay + 190);
      g.addColorStop(0, p.rgb([96, 70, 50], 0.4)); g.addColorStop(1, p.rgb([96, 70, 50], 0));
      x.fillStyle = g; x.fillRect(ax + 22, ay + 46, 10, 144);
    }
  }
  return p.cv;
}

// Gabbione HESCO: telo beige stropicciato + rete metallica (1,4 m per ripetizione)
function map_desert_texHesco(kit) {
  const S = 512, p = map_desert_paint(kit, S), x = p.x;
  p.fill([188, 166, 124]);
  p.blot(40, 30, 120, [[160, 138, 100], [212, 194, 154]], 0.12, 0.3);
  p.streak(60, [150, 128, 94], 0.18, true, 60, 260, 5); p.streak(40, [214, 198, 160], 0.16, false, 60, 200, 4);
  p.grain(5000, [[150, 130, 96], [216, 200, 162]], 0.1, 0.35, 1, 3);
  let g = x.createLinearGradient(0, S * 0.75, 0, S); g.addColorStop(0, p.rgb([110, 88, 62], 0)); g.addColorStop(1, p.rgb([110, 88, 62], 0.3));
  x.fillStyle = g; x.fillRect(0, S * 0.75, S, S * 0.25);
  g = x.createLinearGradient(0, 0, 0, S * 0.2); g.addColorStop(0, p.rgb([222, 206, 168], 0.35)); g.addColorStop(1, p.rgb([222, 206, 168], 0));
  x.fillStyle = g; x.fillRect(0, 0, S, S * 0.2);
  for (let i = 0; i <= 8; i++) {
    const q = i * 64;
    x.fillStyle = p.rgb([92, 94, 90], 0.9); x.fillRect(q - 1.5, 0, 3, S); x.fillRect(0, q - 1.5, S, 3);
    x.fillStyle = p.rgb([214, 208, 192], 0.35); x.fillRect(q + 1.5, 0, 1.5, S); x.fillRect(0, q + 1.5, S, 1.5);
  }
  x.fillStyle = p.rgb([70, 72, 70]); x.fillRect(0, 0, 5, S); x.fillRect(S - 5, 0, 5, S);
  return p.cv;
}

// Asfalto consumato: toppe, crepe, macchie d'olio, sabbia portata dal vento
function map_desert_texAsphalt(kit) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand;
  p.fill([88, 84, 78]);
  p.blot(40, 80, 260, [[74, 71, 66], [102, 97, 90]], 0.15, 0.35);
  p.grain(20000, [[60, 58, 54], [124, 119, 110], [104, 99, 92]], 0.15, 0.5, 1, 3);
  for (let i = 0; i < 5; i++) {
    const px = R(0, S), py = R(0, S), w = R(90, 240), h = R(70, 180);
    p.each(() => { x.fillStyle = p.rgb([68, 66, 62], 0.85); x.fillRect(px, py, w, h); x.strokeStyle = p.rgb([46, 44, 42], 0.8); x.lineWidth = 3; x.strokeRect(px, py, w, h); });
  }
  p.crack(14, [44, 42, 40], 380, 3);
  p.blot(7, 25, 70, [[40, 38, 38]], 0.3, 0.5);
  p.blot(46, 40, 170, [[200, 176, 132]], 0.08, 0.2);
  p.grain(5000, [[204, 182, 140]], 0.1, 0.3, 1, 3);
  return p.cv;
}

// Lastre di cemento 2x2 m con giunti, macchie e crepe
function map_desert_texSlab(kit) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const t = R(-10, 10); x.fillStyle = p.rgb([178 + t, 168 + t, 148 + t]); x.fillRect(i * 512, j * 512, 512, 512); }
  p.blot(50, 50, 200, [[150, 140, 122], [198, 190, 172]], 0.1, 0.28);
  p.grain(16000, [[140, 132, 116], [204, 196, 178], [164, 152, 132]], 0.1, 0.35, 1, 3);
  p.blot(8, 30, 90, [[84, 76, 68]], 0.2, 0.4);
  p.crack(7, [96, 88, 76], 320, 2.4);
  for (const q of [0, 512, 1024]) {
    x.fillStyle = p.rgb([84, 76, 64]); x.fillRect(q - 3, 0, 6, S); x.fillRect(0, q - 3, S, 6);
    x.fillStyle = p.rgb([212, 204, 186], 0.5); x.fillRect(q + 3, 0, 2, S); x.fillRect(0, q + 3, S, 2);
  }
  p.grain(2500, [[206, 184, 142]], 0.2, 0.5, 1, 3);
  return p.cv;
}

// Piastrelle di cemento decorate (25 cm): rombo terracotta + angoli turchesi, molto consumate
function map_desert_texTile(kit) {
  const S = 512, p = map_desert_paint(kit, S), x = p.x, R = kit.rand;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const cx = i * 64 + 32, cy = j * 64 + 32, t = R(-8, 8), plain = kit.rng() < 0.08;
    x.fillStyle = plain ? p.rgb([152, 142, 126]) : p.rgb([214 + t, 198 + t, 166 + t]); x.fillRect(i * 64, j * 64, 64, 64);
    if (plain) continue;
    x.fillStyle = p.rgb([172 + t, 92, 62]);
    x.beginPath(); x.moveTo(cx, cy - 24); x.lineTo(cx + 24, cy); x.lineTo(cx, cy + 24); x.lineTo(cx - 24, cy); x.closePath(); x.fill();
    x.fillStyle = p.rgb([218, 202, 170]);
    x.beginPath(); x.moveTo(cx, cy - 9); x.lineTo(cx + 9, cy); x.lineTo(cx, cy + 9); x.lineTo(cx - 9, cy); x.closePath(); x.fill();
  }
  x.fillStyle = p.rgb([58, 124, 126]);
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) { x.beginPath(); x.arc(i * 64, j * 64, 15, 0, 6.283); x.fill(); }
  x.fillStyle = p.rgb([96, 84, 70]);
  for (let i = 0; i <= 8; i++) { x.fillRect(i * 64 - 1, 0, 2, S); x.fillRect(0, i * 64 - 1, S, 2); }
  p.blot(34, 30, 110, [[200, 182, 150], [150, 132, 108]], 0.15, 0.42);
  p.grain(6000, [[196, 178, 146], [120, 104, 86]], 0.1, 0.35, 1, 3);
  p.crack(4, [80, 68, 56], 200, 1.8);
  return p.cv;
}

// Telone mimetico da deserto (3 m per ripetizione)
function map_desert_texCamo(kit) {
  const S = 512, p = map_desert_paint(kit, S), x = p.x, R = kit.rand;
  p.fill([188, 160, 116]);
  for (let i = 0; i < 46; i++) {
    const px = R(0, S), py = R(0, S), r = R(26, 78), rr = p.radii(11, 0.55, 1.15), col = kit.pick([[140, 106, 72], [214, 196, 158], [128, 122, 84], [164, 130, 88]]);
    p.each(() => { p.blob(px, py, r, rr); x.fillStyle = p.rgb(col); x.fill(); });
  }
  for (let i = 0; i < S; i += 4) { x.fillStyle = p.rgb([60, 50, 38], 0.08); x.fillRect(i, 0, 1, S); x.fillRect(0, i, S, 1); }
  p.streak(30, [90, 74, 54], 0.14, true, 80, 300, 6);
  p.blot(24, 40, 120, [[220, 204, 168]], 0.08, 0.2);
  p.grain(5000, [[110, 92, 66], [222, 206, 170]], 0.08, 0.28, 1, 3);
  return p.cv;
}

// Stoffa a righe (tende da sole, tappeti, bandierine): terracotta, crema, turchese, ocra, indaco
function map_desert_texStripe(kit) {
  const S = 512, p = map_desert_paint(kit, S), x = p.x;
  const bands = [[70, [166, 62, 46]], [14, [222, 206, 170]], [40, [46, 118, 122]], [14, [222, 206, 170]], [70, [166, 62, 46]], [20, [206, 160, 72]],
    [60, [52, 62, 98]], [20, [206, 160, 72]], [90, [222, 206, 170]], [20, [46, 118, 122]], [74, [214, 196, 160]], [20, [46, 118, 122]]];
  let q = 0;
  for (const b of bands) { x.fillStyle = p.rgb(b[1]); x.fillRect(q, 0, b[0], S); q += b[0]; }
  x.fillStyle = p.rgb([166, 62, 46]);
  for (let yy = 16; yy < S; yy += 32) { x.beginPath(); x.moveTo(373, yy - 11); x.lineTo(384, yy); x.lineTo(373, yy + 11); x.lineTo(362, yy); x.closePath(); x.fill(); }
  for (let i = 0; i < S; i += 4) { x.fillStyle = p.rgb([50, 40, 34], 0.1); x.fillRect(0, i, S, 1); x.fillStyle = p.rgb([228, 220, 200], 0.06); x.fillRect(i, 0, 1, S); }
  p.blot(26, 40, 130, [[222, 208, 176], [120, 96, 72]], 0.08, 0.22);
  p.grain(4000, [[96, 78, 60], [226, 214, 188]], 0.08, 0.25, 1, 3);
  return p.cv;
}

// Impronte di cingoli sulla sabbia (trasparente): due tracce a 1 m e 3 m su 4 m
function map_desert_texTrack(kit) {
  const S = 512, p = map_desert_paint(kit, S), x = p.x;
  x.clearRect(0, 0, S, S);
  for (const cx of [128, 384]) {
    x.fillStyle = 'rgba(236,218,176,0.3)'; x.fillRect(cx - 41, 0, 6, S); x.fillRect(cx + 35, 0, 6, S);
    x.fillStyle = 'rgba(150,122,82,0.25)'; x.fillRect(cx - 35, 0, 70, S);
    for (let j = 0; j < 16; j++) {
      x.fillStyle = 'rgba(112,88,56,0.62)'; x.fillRect(cx - 33, j * 32 + 4, 66, 12);
      x.fillStyle = 'rgba(236,218,176,0.38)'; x.fillRect(cx - 33, j * 32 + 19, 66, 7);
    }
  }
  x.globalCompositeOperation = 'destination-out';
  p.blot(26, 30, 90, [[0, 0, 0]], 0.5, 1);
  x.globalCompositeOperation = 'source-over';
  return p.cv;
}

// Atlante di cartelli, insegne, manifesti, graffiti e una porta di legno
function map_desert_texSigns(kit) {
  const S = 1024, p = map_desert_paint(kit, S), x = p.x, R = kit.rand, RC = map_desert_SIGNS;
  const LAT = 'Impact, "Arial Black", "DejaVu Sans", sans-serif', ARA = '"Noto Naskh Arabic", "Noto Sans Arabic", "DejaVu Sans", Arial, sans-serif';
  const CREAM = [222, 208, 172], DARK = [44, 42, 40];
  const txt = (s, cx, cy, px, col, mw, font) => { x.font = 'bold ' + px + 'px ' + (font || LAT); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = p.rgb(col); x.fillText(s, cx, cy, mw); };
  const board = (i, bg, edge) => {
    const r = RC[i];
    x.fillStyle = p.rgb(bg); x.fillRect(r[0], r[1], r[2], r[3]);
    if (edge) {
      x.strokeStyle = p.rgb(edge); x.lineWidth = 6; x.strokeRect(r[0] + 11, r[1] + 11, r[2] - 22, r[3] - 22);
      x.fillStyle = p.rgb([70, 66, 60]);
      for (const sx of [24, r[2] - 24]) for (const sy of [24, r[3] - 24]) { x.beginPath(); x.arc(r[0] + sx, r[1] + sy, 5, 0, 6.283); x.fill(); }
    }
    return { x: r[0], y: r[1], w: r[2], h: r[3], cx: r[0] + r[2] / 2, cy: r[1] + r[3] / 2 };
  };
  const arrow = (cx, cy, len, dir, col) => {
    const t = 13, hd = 36, a = cx - (dir * len) / 2, b = cx + dir * (len / 2 - hd), e = cx + (dir * len) / 2;
    x.fillStyle = p.rgb(col); x.beginPath();
    x.moveTo(a, cy - t); x.lineTo(b, cy - t); x.lineTo(b, cy - 2.4 * t); x.lineTo(e, cy); x.lineTo(b, cy + 2.4 * t); x.lineTo(b, cy + t); x.lineTo(a, cy + t);
    x.closePath(); x.fill();
  };
  p.fill([150, 140, 120]);
  let b = board(0, [86, 92, 62], CREAM);
  x.fillStyle = p.rgb([214, 170, 60]); x.beginPath(); x.moveTo(b.x + 84, b.y + 40); x.lineTo(b.x + 136, b.cy); x.lineTo(b.x + 84, b.y + 152); x.lineTo(b.x + 32, b.cy); x.closePath(); x.fill();
  txt('V', b.x + 84, b.cy + 4, 70, DARK, 60);
  txt('FOB VIPER', b.cx + 60, b.cy - 16, 112, CREAM, 440);
  txt('BASE OPERATIVA AVANZATA · 3° RGT', b.cx + 60, b.cy + 58, 26, [214, 170, 60], 440);
  b = board(1, [214, 170, 60], DARK); txt('HELIPAD', b.cx, b.y + 68, 78, DARK, 330); arrow(b.cx, b.y + 140, 230, 1, DARK);
  b = board(2, [210, 198, 170], null); txt('ZONA 4', b.cx, b.cy, 104, DARK, 290);
  x.fillStyle = p.rgb([210, 198, 170]); for (let xx = b.x + 30; xx < b.x + b.w - 20; xx += 37) x.fillRect(xx, b.y + 20, 4, b.h - 40);
  b = board(3, [52, 72, 104], CREAM); txt('COMANDO', b.cx, b.cy - 12, 78, CREAM, 300); txt('ACCESSO RISERVATO', b.cx, b.cy + 46, 24, [214, 170, 60], 300);
  b = board(4, [70, 104, 70], CREAM); txt('MENSA', b.cx, b.cy - 12, 84, CREAM, 300); txt('ORARIO 06 - 21', b.cx, b.cy + 46, 24, CREAM, 300);
  b = board(5, [170, 50, 40], CREAM); txt('ALT!', b.x + 120, b.cy - 14, 86, CREAM, 190); txt('قف', b.x + 290, b.cy - 16, 80, CREAM, 150, ARA);
  txt('CHECKPOINT · DOCUMENTI', b.cx, b.cy + 50, 24, CREAM, 340);
  b = board(6, [192, 162, 112], DARK); txt('DEPOSITO', b.cx, b.y + 58, 62, DARK, 280); arrow(b.cx, b.y + 118, 200, -1, DARK);
  b = board(7, [222, 210, 180], [60, 120, 80]); x.fillStyle = p.rgb([60, 130, 84]); x.fillRect(b.x + 40, b.cy - 14, 64, 28); x.fillRect(b.x + 58, b.cy - 32, 28, 64);
  txt('INFERMERIA', b.cx + 50, b.cy, 44, [60, 120, 80], 190);
  b = board(8, [40, 112, 116], [206, 160, 72]); txt('سوق', b.cx, b.cy - 26, 96, CREAM, 300, ARA); txt('BAZAR', b.cx, b.cy + 56, 44, [214, 170, 60], 300);
  b = board(9, [168, 74, 50], CREAM); txt('مخبز', b.cx, b.cy - 26, 90, CREAM, 260, ARA); txt('FORNO · PANE CALDO', b.cx, b.cy + 56, 28, CREAM, 270);
  b = board(10, [222, 206, 170], [52, 62, 98]); txt('شاي', b.cx, b.cy - 26, 92, [52, 62, 98], 260, ARA); txt('CASA DEL TÈ', b.cx, b.cy + 56, 34, [166, 62, 46], 270);
  b = board(11, [214, 206, 188], null);
  x.save(); x.translate(b.cx, b.y + 90); x.rotate(-0.07); txt('VIPER 7', 0, 0, 92, [176, 48, 40], 340); x.restore();
  x.save(); x.translate(b.cx - 20, b.y + 180); x.rotate(0.04); txt('ERA QUI', 0, 0, 60, [176, 48, 40], 300); x.restore();
  txt('مرحبا', b.cx + 40, b.y + 262, 70, DARK, 260, ARA);
  x.strokeStyle = p.rgb([52, 62, 98]); x.lineWidth = 6; x.beginPath();
  for (let i = 0; i <= 10; i++) { const a = (i * 4 * Math.PI) / 5 - Math.PI / 2, px = b.x + 62 + Math.cos(a) * 36, py = b.y + 264 + Math.sin(a) * 36; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
  x.stroke();
  x.fillStyle = p.rgb([176, 48, 40], 0.8); for (let i = 0; i < 9; i++) x.fillRect(b.x + R(40, 340), b.y + 120, R(3, 6), R(20, 90));
  b = board(12, [52, 104, 150], CREAM);
  x.fillStyle = p.rgb(CREAM); x.beginPath(); x.moveTo(b.cx, b.y + 44); x.quadraticCurveTo(b.cx + 62, b.y + 130, b.cx, b.y + 166); x.quadraticCurveTo(b.cx - 62, b.y + 130, b.cx, b.y + 44); x.fill();
  txt('ACQUA', b.cx, b.y + 208, 56, CREAM, 220); txt('POTABILE', b.cx, b.y + 254, 36, CREAM, 220); txt('ماء', b.cx, b.y + 292, 34, CREAM, 200, ARA);
  b = board(13, [212, 172, 56], DARK);
  x.fillStyle = p.rgb(DARK); x.beginPath(); x.moveTo(b.cx, b.y + 40); x.lineTo(b.cx + 66, b.y + 156); x.lineTo(b.cx - 66, b.y + 156); x.closePath(); x.fill();
  txt('!', b.cx, b.y + 112, 78, [212, 172, 56], 60); txt('PERICOLO', b.cx, b.y + 206, 34, DARK, 160); txt('MINE', b.cx, b.y + 258, 58, [170, 50, 40], 160);
  b = board(14, [44, 110, 114], null);
  x.fillStyle = p.rgb([28, 74, 78]); for (let xx = b.x; xx < b.x + b.w; xx += 32) x.fillRect(xx, b.y, 3, b.h);
  x.fillStyle = p.rgb([62, 50, 40]); x.fillRect(b.x, b.y + 60, b.w, 14); x.fillRect(b.x, b.y + 240, b.w, 14); x.fillRect(b.cx - 2, b.y, 4, b.h);
  x.fillStyle = p.rgb([206, 160, 72]);
  for (let xx = b.x + 16; xx < b.x + b.w; xx += 32) for (const yy of [67, 247]) { x.beginPath(); x.arc(xx, b.y + yy, 5, 0, 6.283); x.fill(); }
  x.strokeStyle = p.rgb([206, 160, 72]); x.lineWidth = 5; x.beginPath(); x.arc(b.cx + 26, b.y + 160, 12, 0, 6.283); x.stroke();
  for (let i = 0; i < 40; i++) {
    const px = R(0, S), py = R(0, S), len = R(30, 120), g = x.createLinearGradient(0, py, 0, py + len);
    g.addColorStop(0, p.rgb([120, 72, 42], 0.3)); g.addColorStop(1, p.rgb([120, 72, 42], 0));
    x.fillStyle = g; x.fillRect(px, py, R(3, 8), len);
  }
  p.grain(9000, [[204, 184, 144], [120, 104, 84]], 0.12, 0.4, 1, 3);
  p.blot(30, 40, 140, [[206, 186, 146]], 0.08, 0.22);
  return p.cv;
}

function map_desert_mats(kit) {
  const T = kit.THREE;
  const M = (n, color, roughness, o) => kit.mat(n, Object.assign({ color, roughness }, o || {}));
  const tex = (cv) => { const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true; return t; };
  const P = (t, metres, o) => { const mat = new T.MeshStandardMaterial(Object.assign({ map: t, roughness: 0.93, metalness: 0 }, o || {})); mat.userData.uvScale = 1 / metres; return mat; };
  const plan = [];
  for (let i = 0; i < 6; i++) { const kind = (kit.rng() * 4) | 0; plan.push({ kind, lit: kind !== 3 && kit.rng() < 0.25, ac: kit.rng() < 0.35 }); }
  if (plan[4].kind === 3) plan[4].kind = 0;
  plan[4].lit = true;
  const tMud = tex(map_desert_texMud(kit)), tBrick = tex(map_desert_texBrick(kit)), tHesco = tex(map_desert_texHesco(kit)), tAsph = tex(map_desert_texAsphalt(kit)), tSlab = tex(map_desert_texSlab(kit));
  const tEm = tex(map_desert_texFacade(kit, null, plan, true));
  const fac = (pal) => P(tex(map_desert_texFacade(kit, pal, plan, false)), 6, { roughness: 0.9, emissive: 0xffffff, emissiveMap: tEm, emissiveIntensity: 1.5 });
  return {
    sand: M('sand', 0xd6bc8e, 0.93, { scale: 3.5 }), sandDark: M('sand', 0xb3966a, 0.95, { scale: 2.5 }),
    conc: M('concrete', 0xb9ad94, 0.85, { scale: 2.2 }), concD: M('concrete_dark', 0x857a68, 0.88, { scale: 2 }),
    wood: M('wood', 0x96704a, 0.84, { scale: 1.8 }), woodD: M('wood_dark', 0x62462c, 0.86, { scale: 1.8 }),
    metal: M('metal', 0x8a8c88, 0.45, { metalness: 0.75, scale: 1.5 }), metalD: M('metal_painted', 0x464a44, 0.55, { metalness: 0.5, scale: 1.5 }),
    olive: M('metal_painted', 0x66704a, 0.65, { metalness: 0.35 }), rust: M('rust', 0x8e5536, 0.88, { metalness: 0.3, scale: 1.8 }),
    corr: M('corrugated', 0xb8a480, 0.7, { metalness: 0.4, scale: 1.6 }), bag: M('sandbag', 0xbd9e6e, 0.94, { scale: 1.2 }),
    palm: M('camo_net', 0x6f8046, 0.9), rubber: M('rubber', 0x2e2d2b, 0.92, { scale: 1 }), glass: M('glass', 0x8fb3c1, 0.18, { metalness: 0.2 }),
    rock: M('rubble', 0x9c7e58, 0.96, { scale: 3 }), teal: M('plaster', 0x2f858a, 0.8, { scale: 1.5 }), red: M('plaster', 0xa8402f, 0.88, { scale: 1.5 }),
    lineY: M('road_line', 0xd2b455, 0.75, { scale: 1 }), lineW: M('road_line', 0xdcd6c6, 0.75, { scale: 1 }),
    nWarm: kit.neon(0xffdd99, 3.5), nGreen: kit.neon(0x44ff77, 4.5), nRed: kit.neon(0xff4433, 5), nAmber: kit.neon(0xffaa33, 4.5),
    mudO: P(tMud, 4, { color: 0xdcb478, bumpMap: tMud, bumpScale: 1.2 }), mudT: P(tMud, 4, { color: 0xcf8f6c, bumpMap: tMud, bumpScale: 1.2 }),
    mudC: P(tMud, 4, { color: 0xe6d6b4, bumpMap: tMud, bumpScale: 1.2 }), brick: P(tBrick, 2, { bumpMap: tBrick, bumpScale: 1.5 }),
    facA: fac({ wall: [206, 160, 92], dark: [176, 132, 74], light: [224, 186, 124], stain: [112, 84, 52], trim: [226, 208, 170], shut: [48, 118, 120], cloth: [170, 70, 52], wood: [84, 60, 42] }),
    facB: fac({ wall: [196, 132, 104], dark: [166, 106, 82], light: [216, 160, 132], stain: [108, 70, 54], trim: [224, 204, 180], shut: [84, 112, 72], cloth: [214, 190, 140], wood: [78, 56, 40] }),
    facC: fac({ wall: [218, 198, 156], dark: [190, 168, 126], light: [228, 214, 180], stain: [124, 100, 70], trim: [176, 128, 86], shut: [150, 70, 50], cloth: [52, 92, 120], wood: [90, 64, 44] }),
    hesco: P(tHesco, 1.4, { bumpMap: tHesco, bumpScale: 1.2, roughness: 0.95 }), asph: P(tAsph, 4, { bumpMap: tAsph, bumpScale: 1, roughness: 0.88 }),
    slab: P(tSlab, 4, { bumpMap: tSlab, bumpScale: 1, roughness: 0.86 }), ftile: P(tex(map_desert_texTile(kit)), 2, { roughness: 0.7 }),
    camo: P(tex(map_desert_texCamo(kit)), 3, { roughness: 0.95, side: T.DoubleSide }), stripe: P(tex(map_desert_texStripe(kit)), 2, { roughness: 0.95, side: T.DoubleSide }),
    track: P(tex(map_desert_texTrack(kit)), 4, { roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    signs: P(tex(map_desert_texSigns(kit)), 1, { roughness: 0.8, side: T.DoubleSide })
  };
}

// Deforma i vertici in base alla posizione (niente crepe tra facce) per rocce e cespugli
function map_desert_lumpy(geo, amp, seed) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amp * Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 - seed) + amp * 0.5 * Math.sin(z * 4.3 + seed * 2 + x * 1.3);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function map_desert_archGeo(T, w, h, ow, oh, depth) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-ow / 2, 0); s.lineTo(-ow / 2, oh - ow / 2); s.absarc(0, oh - ow / 2, ow / 2, Math.PI, 0, true);
  s.lineTo(ow / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  g.userData.uvk = 3;
  return g;
}

function map_desert_ctx(kit) {
  const T = kit.THREE, g = {}, PI = Math.PI;
  const c = { kit, T, m: map_desert_mats(kit), batch: {}, inst: {}, o: new T.Object3D(), g };
  c.uvm = { mudO: 4, mudT: 4, mudC: 4, brick: 2, facA: 6, facB: 6, facC: 6, hesco: 1.4, asph: 4, slab: 4, ftile: 2, camo: 3, stripe: 2 };
  g.box = new T.BoxGeometry(1, 1, 1); g.box.userData.uvk = 1;
  g.cyl = new T.CylinderGeometry(1, 1, 1, 12); g.cyl.translate(0, 0.5, 0); g.cyl.userData.uvk = 2;
  g.cyl6 = new T.CylinderGeometry(1, 1, 1, 6); g.cyl6.translate(0, 0.5, 0); g.cyl6.userData.uvk = 2;
  g.taper = new T.CylinderGeometry(0.35, 1, 1, 10); g.taper.translate(0, 0.5, 0);
  g.cone = new T.ConeGeometry(1, 1, 12); g.cone.translate(0, 0.5, 0);
  g.sph = new T.SphereGeometry(1, 12, 8);
  g.dome = new T.SphereGeometry(1, 16, 8, 0, PI * 2, 0, PI / 2);
  g.tor = new T.TorusGeometry(1, 0.08, 6, 16); g.tor.rotateX(PI / 2);
  g.ring = new T.RingGeometry(6.0, 6.4, 40); g.ring.rotateX(-PI / 2);
  g.wheel = new T.CylinderGeometry(0.5, 0.5, 0.36, 14); g.wheel.rotateZ(PI / 2);
  g.barrel = new T.CylinderGeometry(0.3, 0.3, 0.9, 10); g.barrel.translate(0, 0.45, 0);
  g.rock = map_desert_lumpy(new T.IcosahedronGeometry(1, 1), 0.28, 1.7);
  g.peb = map_desert_lumpy(new T.IcosahedronGeometry(0.4, 0), 0.3, 3.1);
  g.bush = map_desert_lumpy(new T.IcosahedronGeometry(0.6, 1), 0.35, 5.3);
  g.bag = new T.SphereGeometry(1, 7, 5); g.bag.scale(0.36, 0.13, 0.2); g.bag.translate(0, 0.12, 0);
  g.brick = new T.BoxGeometry(0.42, 0.2, 0.22); g.brick.translate(0, 0.1, 0);
  g.tuft = new T.ConeGeometry(0.1, 0.6, 4); g.tuft.translate(0, 0.3, 0);
  g.frond = new T.BoxGeometry(0.75, 0.04, 3.4, 2, 1, 6); g.frond.translate(0, 0, 1.7);
  const fp = g.frond.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const zz = fp.getZ(i), xx = fp.getX(i), t = zz / 3.4;
    fp.setXYZ(i, xx * (1 - t * 0.85), fp.getY(i) - zz * zz * 0.13 - Math.abs(xx) * 0.35 * (1 - t), zz);
  }
  g.frond.computeVertexNormals();
  g.jar = new T.LatheGeometry([[0.01, 0], [0.15, 0], [0.23, 0.2], [0.2, 0.38], [0.1, 0.47], [0.13, 0.53], [0.01, 0.5]].map((p) => new T.Vector2(p[0], p[1])), 10);
  const js = new T.Shape();
  [[-0.4, 0], [0.4, 0], [0.4, 0.2], [0.14, 0.5], [0.1, 0.95], [-0.1, 0.95], [-0.14, 0.5], [-0.4, 0.2]].forEach((p, i) => (i ? js.lineTo(p[0], p[1]) : js.moveTo(p[0], p[1])));
  g.jersey = new T.ExtrudeGeometry(js, { depth: 2.8, bevelEnabled: false }); g.jersey.translate(0, 0, -1.4); g.jersey.userData.uvk = 3;
  c.kinds = { tire: ['wheel', 'rubber'], barrel: ['barrel', 'rust'], barrelB: ['barrel', 'teal'], rock: ['rock', 'rock'], peb: ['peb', 'rock'],
    bush: ['bush', 'palm'], bag: ['bag', 'bag'], brick: ['brick', 'mudT'], tuft: ['tuft', 'palm'], frond: ['frond', 'palm'], jar: ['jar', 'mudT'],
    post: ['cyl6', 'metalD'], log: ['cyl6', 'woodD'], dune: ['sph', 'sand'] };
  return c;
}

function map_desert_mx(c, x, y, z, ry, rx, rz, sx, sy, sz) {
  const o = c.o, s = sx === undefined ? 1 : sx;
  o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, rz || 0, 'YXZ');
  o.scale.set(s, sy === undefined ? s : sy, sz === undefined ? s : sz); o.updateMatrix();
  return o.matrix;
}
// Geometria fusa per materiale (1 draw call per materiale a fine build); le UV vengono riportate in metri
function map_desert_add(c, mk, geo, x, y, z, ry, rx, rz, sx, sy, sz, col) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const kind = geo.userData.uvk, s1 = sx === undefined ? 1 : sx, s2 = sy === undefined ? s1 : sy, s3 = sz === undefined ? s1 : sz;
  if (kind) {
    const uv = g.attributes.uv, k = 1 / (c.uvm[mk] || 2);
    if (kind === 1) {
      for (let i = 0; i < uv.count; i++) { const fc = (i / 6) | 0, su = fc < 2 ? s3 : s1, sv = fc === 2 || fc === 3 ? s3 : s2; uv.setXY(i, uv.getX(i) * su * k, uv.getY(i) * sv * k); }
    } else if (kind === 2) {
      const ku = Math.max(1, Math.round(6.283 * s1 * k)), kv = s2 * k;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ku, uv.getY(i) * kv);
    } else for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
  }
  g.applyMatrix4(map_desert_mx(c, x, y, z, ry, rx, rz, sx, sy, sz));
  (c.batch[mk] || (c.batch[mk] = [])).push(g);
  if (col) { g.computeBoundingBox(); const b = g.boundingBox; c.kit.collider(b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z); }
}
function map_desert_inst(c, key, x, y, z, ry, rx, rz, sx, sy, sz) {
  (c.inst[key] || (c.inst[key] = [])).push(map_desert_mx(c, x, y, z, ry, rx, rz, sx, sy, sz).clone());
}
function map_desert_beam(c, mk, x1, y1, z1, x2, y2, z2, t) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = Math.hypot(dx, dy, dz) || 0.001;
  map_desert_add(c, mk, c.g.box, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, Math.atan2(dx, dz), -Math.asin(dy / len), 0, t, t, len);
}
function map_desert_cable(c, x1, y1, z1, x2, y2, z2, sag) {
  let px = x1, py = y1, pz = z1;
  for (let i = 1; i <= 4; i++) {
    const t = i / 4, nx = x1 + (x2 - x1) * t, nz = z1 + (z2 - z1) * t, ny = y1 + (y2 - y1) * t - sag * 4 * t * (1 - t);
    map_desert_beam(c, 'metalD', px, py, pz, nx, ny, nz, 0.035);
    px = nx; py = ny; pz = nz;
  }
}
function map_desert_flush(c) {
  for (const mk in c.batch) c.kit.mesh(mergeGeometries(c.batch[mk], false), c.m[mk], { x: 0, y: 0, z: 0 }, { collide: false });
  for (const key in c.inst) { const k = c.kinds[key]; c.kit.instanced(c.g[k[0]], c.m[k[1]], c.inst[key], { cast: true }); }
}

// Cartello dall'atlante: piano w x h centrato in (x,y,z), rivolto verso (sin ry, 0, cos ry)
function map_desert_sign(c, id, x, y, z, ry, w, h) {
  const r = map_desert_SIGNS[id], g = new c.T.PlaneGeometry(w, h), uv = g.attributes.uv;
  const u0 = (r[0] + 3) / 1024, u1 = (r[0] + r[2] - 3) / 1024, v1 = 1 - (r[1] + 3) / 1024, v0 = 1 - (r[1] + r[3] - 3) / 1024;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
  map_desert_add(c, 'signs', g, x, y, z, ry, 0, 0, 1, 1, 1);
}
// Cartello con pannello di metallo dietro e (se posts) due pali fino a terra
function map_desert_board(c, id, x, y, z, ry, w, posts) {
  const r = map_desert_SIGNS[id], h = (w * r[3]) / r[2], nx = Math.sin(ry), nz = Math.cos(ry), tx = Math.cos(ry), tz = -Math.sin(ry);
  map_desert_add(c, 'metalD', c.g.box, x, y, z, ry, 0, 0, w + 0.14, h + 0.14, 0.06);
  map_desert_sign(c, id, x + nx * 0.045, y, z + nz * 0.045, ry, w, h);
  if (posts) for (const s of [-1, 1]) map_desert_inst(c, 'post', x + tx * s * (w / 2 - 0.1) - nx * 0.08, 0, z + tz * s * (w / 2 - 0.1) - nz * 0.08, 0, 0, 0, 0.05, y + h / 2, 0.05);
}

// Sistema di riferimento locale (origine + rotY): tutti i prefab costruiscono in coordinate locali
function map_desert_fr(c, x, y, z, r) {
  const cs = Math.cos(r), sn = Math.sin(r), k = c.kit, ac = Math.abs(cs), as = Math.abs(sn);
  const f = {
    wx: (lx, lz) => x + lx * cs + lz * sn,
    wz: (lx, lz) => z - lx * sn + lz * cs,
    box(lx, ly, lz, w, h, d, mk, col, ry) { k.box(f.wx(lx, lz), y + ly, f.wz(lx, lz), w, h, d, c.m[mk], { collide: !!col, rotY: r + (ry || 0), cast: h > 0.06 }); },
    add(mk, geo, lx, ly, lz, ry, rx, rz, sx, sy, sz, col) { map_desert_add(c, mk, geo, f.wx(lx, lz), y + ly, f.wz(lx, lz), r + (ry || 0), rx, rz, sx, sy, sz, col); },
    inst(key, lx, ly, lz, ry, rx, rz, sx, sy, sz) { map_desert_inst(c, key, f.wx(lx, lz), y + ly, f.wz(lx, lz), r + (ry || 0), rx, rz, sx, sy, sz); },
    beam(mk, ax, ay, az, bx, by, bz, t) { map_desert_beam(c, mk, f.wx(ax, az), y + ay, f.wz(ax, az), f.wx(bx, bz), y + by, f.wz(bx, bz), t); },
    col(lx, lz, a, b, y0, y1) { const X = f.wx(lx, lz), Z = f.wz(lx, lz); k.collider(X - ac * a - as * b, y + y0, Z - as * a - ac * b, X + ac * a + as * b, y + y1, Z + as * a + ac * b); },
    nav(lx, ly, lz) { k.nav(f.wx(lx, lz), y + ly, f.wz(lx, lz)); }
  };
  return f;
}

// Gabbioni HESCO (texture con rete e telo) + cumuli di sabbia in cima (r = 0 oppure PI/2)
function map_desert_hesco(c, x, z, n, r, tiers) {
  const k = c.kit, f = map_desert_fr(c, x, 0, z, r), W = 1.4, H = 1.4;
  for (let t = 0; t < tiers; t++) {
    const cnt = n - t, len = cnt * W;
    f.box(0, t * H, 0, len, H, 1.3 - t * 0.04, 'hesco', true);
    for (let i = 0; i < cnt; i++) if (t === tiers - 1 || i === 0 || i === cnt - 1)
      f.add('sandDark', c.g.sph, -len / 2 + (i + 0.5) * W, t * H + H - 0.04, 0, k.rand(0, 3), 0, 0, 0.6, k.rand(0.12, 0.22), 0.55);
  }
}

// Muro di T-wall in cemento
function map_desert_twall(c, x, z, n, r) {
  const f = map_desert_fr(c, x, 0, z, r), W = 2.5, len = n * W;
  f.box(0, 0, 0, len, 3.4, 0.4, 'conc', true);
  for (let i = 0; i < n; i++) {
    const lx = -len / 2 + (i + 0.5) * W;
    f.box(lx, 0, 0, W - 0.06, 0.5, 1.3, 'conc', false); f.box(lx, 0.5, 0, W - 0.06, 0.5, 0.8, 'conc', false);
    f.box(lx, 3.4, 0, 0.3, 0.1, 0.1, 'rust', false); f.box(lx - W / 2, 0.4, 0, 0.04, 3.02, 0.44, 'concD', false);
  }
}

function map_desert_jersey(c, x, z, r) { map_desert_add(c, 'conc', c.g.jersey, x, 0, z, r + c.kit.rand(-0.05, 0.05), 0, 0, 1, 1, 1, true); }

// Muro di sacchi di sabbia veri (istanze sfalsate) + un collider
function map_desert_bagwall(c, x, y, z, len, r, rows, thick) {
  const k = c.kit, f = map_desert_fr(c, x, y, z, r), n = Math.max(1, Math.round(len / 0.66)), th = thick || 1;
  for (let j = 0; j < rows; j++) for (let t = 0; t < th; t++) for (let i = 0; i < n - (j % 2); i++)
    f.inst('bag', (i - (n - 1 - (j % 2)) / 2) * 0.66 + k.rand(-0.03, 0.03), j * 0.21, (t - (th - 1) / 2) * 0.38, k.rand(-0.08, 0.08), 0, 0, k.rand(0.95, 1.08));
  f.col(0, 0, len / 2, th * 0.2, 0, rows * 0.21 + 0.04);
}

// Postazione a U di sacchi (fronte = -Z locale) con telone mimetico e mitragliatrice
function map_desert_nest(c, x, z, r, roof) {
  const f = map_desert_fr(c, x, 0, z, r);
  map_desert_bagwall(c, f.wx(0, -1.4), 0, f.wz(0, -1.4), 3.6, r, 5, 2);
  map_desert_bagwall(c, f.wx(-1.7, 0), 0, f.wz(-1.7, 0), 2.6, r + Math.PI / 2, 5, 1);
  map_desert_bagwall(c, f.wx(1.7, 0), 0, f.wz(1.7, 0), 2.6, r + Math.PI / 2, 5, 1);
  if (roof) {
    for (const sx of [-1.75, 1.75]) for (const sz of [-1.45, 1.3]) f.inst('log', sx, 0, sz, 0, 0, 0, 0.06, 2.3, 0.06);
    f.add('camo', c.g.box, 0, 2.32, 0, 0, 0.05, 0, 4, 0.06, 3.3);
    f.box(0.6, 0, 0.2, 0.5, 0.42, 0.9, 'olive', true);
    f.beam('metalD', -0.5, 1.2, -0.9, -0.5, 1.25, -2.2, 0.08); f.inst('post', -0.5, 0, -1.0, 0, 0, 0, 0.04, 1.2, 0.04);
  }
}

// Telone teso su quattro pali con tiranti (mk = 'camo' alla base, 'stripe' al villaggio)
function map_desert_canopy(c, x, z, w, d, r, mk) {
  const k = c.kit, f = map_desert_fr(c, x, 0, z, r);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const h = 2.9 + k.rand(-0.2, 0.2);
    f.inst('log', (sx * w) / 2, 0, (sz * d) / 2, 0, k.rand(-0.05, 0.05), k.rand(-0.05, 0.05), 0.05, h, 0.05);
    f.beam('woodD', (sx * w) / 2, h, (sz * d) / 2, sx * (w / 2 + 1.2), 0, sz * (d / 2 + 1.0), 0.025);
  }
  f.add(mk, c.g.box, -w / 4, 2.78, 0, 0, 0, -0.1, w / 2 + 0.3, 0.04, d + 0.6);
  f.add(mk, c.g.box, w / 4, 2.78, 0, 0, 0, 0.1, w / 2 + 0.3, 0.04, d + 0.6);
}

// Container 20 piedi con nervature, montanti e barre delle porte
function map_desert_container(c, x, y, z, r, mk, open) {
  const k = c.kit, f = map_desert_fr(c, x, y, z, r + k.rand(-0.02, 0.02));
  f.box(0, 0.12, 0, 2.36, 2.38, 6.0, mk, true);
  f.box(0, 0, 0, 2.44, 0.14, 6.1, 'metalD', false); f.box(0, 2.48, 0, 2.44, 0.12, 6.1, mk, false);
  for (const sx of [-1.2, 1.2]) {
    for (const sz of [-3.0, 3.0]) f.box(sx, 0, sz, 0.14, 2.6, 0.14, 'metalD', false);
    for (let i = 0; i < 14; i++) f.box(sx, 0.2, -2.7 + i * 0.415, 0.1, 2.22, 0.2, mk, false);
  }
  for (const bx of [-0.75, -0.25, 0.25, 0.75]) f.box(bx, 0.2, 3.05, 0.05, 2.2, 0.05, 'metal', false);
  f.box(0, 1.2, 3.07, 2.1, 0.06, 0.04, 'metal', false);
  if (open) f.box(1.75, 0.15, 3.5, 1.15, 2.3, 0.08, mk, true, 0.9);
}

// Torre di guardia calpestabile: tralicci incrociati, sacchi, tettoia a due falde, faro, scala con corrimano
function map_desert_tower(c, x, z, r) {
  const f = map_desert_fr(c, x, 0, z, r), H = 4.4;
  for (const sx of [-1.8, 1.8]) for (const sz of [-1.8, 1.8]) { f.box(sx, 0, sz, 0.24, H + 2.5, 0.24, 'metalD', true); f.box(sx, 0, sz, 0.6, 0.12, 0.6, 'conc', false); }
  for (const s of [-1.8, 1.8]) {
    f.beam('metalD', s, 0.3, -1.8, s, H - 0.4, 1.8, 0.1); f.beam('metalD', s, 0.3, 1.8, s, H - 0.4, -1.8, 0.1);
    f.beam('metalD', -1.8, 0.3, s, 1.8, H - 0.4, s, 0.1); f.beam('metalD', -1.8, 2.2, s, 1.8, 2.2, s, 0.1);
  }
  f.box(0, H - 0.22, 0, 4.4, 0.22, 4.4, 'woodD', true);
  map_desert_bagwall(c, f.wx(0, -1.95), H, f.wz(0, -1.95), 4.2, r, 5, 1);
  for (const sx of [-2.05, 2.05]) { f.box(sx, H, 0, 0.1, 1.1, 4.3, 'corr', true); f.box(sx, H + 1.1, 0, 0.14, 0.06, 4.4, 'metalD', false); }
  f.box(-1.2, H, 2.1, 2.0, 1.1, 0.1, 'corr', true);
  f.add('corr', c.g.box, -1.25, H + 2.75, 0, 0, 0, 0.22, 2.75, 0.06, 5.2); f.add('corr', c.g.box, 1.25, H + 2.75, 0, 0, 0, -0.22, 2.75, 0.06, 5.2);
  f.add('camo', c.g.box, 0, H + 1.9, -2.3, 0, 0.5, 0, 4.6, 0.04, 1.4);
  f.add('metalD', c.g.cyl, 1.3, H + 1.45, -1.95, 0, -Math.PI / 2, 0, 0.2, 0.32, 0.2);
  f.box(1.3, H + 1.3, -2.3, 0.3, 0.3, 0.04, 'nWarm', false);
  f.inst('post', 1.3, H, -1.95, 0, 0, 0, 0.04, 1.3, 0.04); f.inst('post', -1.8, H + 2.5, -1.8, 0, 0, 0, 0.025, 3.2, 0.025);
  c.kit.stairs(f.wx(0.95, 4.9), 0, f.wz(0.95, 4.9), 1.5, H, 5.6, r, c.m.metal);
  for (const sx of [0.18, 1.72]) f.beam('metalD', sx, 1.0, 7.6, sx, H + 1.0, 2.2, 0.06);
  f.nav(0, H, 0); f.nav(0.95, 0, 8.6);
}

function map_desert_cot(c, f, lx, ly, lz, ry) {
  f.box(lx, ly, lz, 0.85, 0.34, 1.95, 'metalD', true, ry); f.box(lx, ly + 0.34, lz, 0.8, 0.12, 1.9, 'olive', false, ry);
  f.box(lx - Math.sin(ry) * 0.72, ly + 0.46, lz - Math.cos(ry) * 0.72, 0.55, 0.1, 0.35, 'mudC', false, ry);
}

// Tenda militare entrabile in telone mimetico: falde inclinate, tiranti, brande, radio, armadietti
function map_desert_tent(c, x, z, r, neon) {
  const f = map_desert_fr(c, x, 0, z, r), W = 6.4, D = 10.4, H = 2.2;
  f.box(0, 0, 0, W, 0.1, D, 'woodD', true);
  for (const sx of [-W / 2 + 0.06, W / 2 - 0.06]) f.box(sx, 0.1, 0, 0.12, H, D, 'camo', true);
  const sl = Math.atan2(1.3, W / 2), L = Math.hypot(1.3, W / 2) + 0.35;
  f.add('camo', c.g.box, -W / 4 - 0.1, H + 0.72, 0, 0, 0, sl, L, 0.07, D + 0.5); f.add('camo', c.g.box, W / 4 + 0.1, H + 0.72, 0, 0, 0, -sl, L, 0.07, D + 0.5);
  for (const sz of [-D / 2 + 0.06, D / 2 - 0.06]) {
    for (const sx of [-2.2, 2.2]) f.box(sx, 0.1, sz, 2.0, H, 0.12, 'camo', true);
    f.box(0, H + 0.1, sz, 3.4, 0.62, 0.1, 'camo', false); f.box(0, H + 0.72, sz, 1.5, 0.5, 0.1, 'camo', false);
  }
  for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) {
    f.beam('woodD', s * (W / 2 + 0.05), H + 0.1, i * 4.6, s * (W / 2 + 1.5), 0, i * 4.6, 0.03);
    f.inst('log', s * (W / 2 + 1.5), 0, i * 4.6, 0, 0, 0.3 * s, 0.03, 0.35, 0.03);
  }
  f.box(0, H + 1.25, 0, 0.1, 0.06, 5, neon, false);
  for (const lz of [-3.9, -1.9, 1.9, 3.9]) map_desert_cot(c, f, -2.25, 0.1, lz, 0);
  f.box(2.3, 0.1, -3.2, 1.0, 0.78, 2.2, 'wood', false); f.box(2.3, 0.88, -3.5, 0.5, 0.36, 0.6, 'metalD', false); f.box(2.03, 1.0, -3.5, 0.03, 0.12, 0.4, 'nGreen', false);
  f.box(2.4, 0.1, 0.4, 1.1, 0.5, 1.6, 'olive', true); f.box(2.4, 0.6, 0.4, 0.9, 0.4, 0.9, 'wood', false);
  f.box(2.7, 0.1, 3.4, 0.6, 1.8, 2.2, 'metalD', false);
  f.nav(0, 0.1, 0);
}

// Elicottero da trasporto (avanti = -Z): fusoliera a ellissoidi, coda rastremata, rotori, carrello, alette
function map_desert_heli(c, x, y, z, r) {
  const g = c.g, f = map_desert_fr(c, x, y, z, r), HP = Math.PI / 2;
  f.add('olive', g.sph, 0, 1.75, 0, 0, 0, 0, 1.3, 1.25, 3.7); f.add('olive', g.sph, 0, 1.6, -3.0, 0, 0, 0, 1.15, 1.0, 1.9);
  f.add('glass', g.sph, 0, 1.95, -3.25, 0, 0, 0, 1.0, 0.72, 1.45); f.add('metalD', g.sph, 0, 1.25, -4.75, 0, 0, 0, 0.35, 0.3, 0.4);
  f.add('olive', g.taper, 0, 2.05, 2.6, 0, HP - 0.06, 0, 0.62, 6.4, 0.62);
  f.add('olive', g.box, 0, 3.55, 8.9, 0, -0.35, 0, 0.14, 2.6, 1.0); f.box(0, 2.5, 8.2, 2.6, 0.1, 0.7, 'olive', false);
  f.add('rubber', g.box, 0.2, 4.2, 9.3, 0, 0.6, 0, 0.05, 2.5, 0.22); f.add('rubber', g.box, 0.2, 4.2, 9.3, 0, 0.6 + HP, 0, 0.05, 2.5, 0.22);
  f.add('metalD', g.box, 0, 3.05, 0.3, 0, 0, 0, 1.5, 0.6, 3.4);
  for (const s of [-1, 1]) {
    f.add('metalD', g.cyl, s * 0.55, 3.0, 2.0, 0, HP, 0, 0.26, 0.5, 0.26);
    f.box(s * 1.28, 1.1, 0.4, 0.06, 1.3, 1.9, 'metalD', false); f.box(s * 1.1, 1.75, -1.6, 0.05, 0.6, 0.9, 'glass', false);
    f.beam('metalD', s * 0.9, 1.0, -0.8, s * 1.5, 0.35, -0.8, 0.1); f.inst('tire', s * 1.55, 0.35, -0.8, 0, 0, 0, 0.7);
    f.box(s * 1.75, 1.2, 0.2, 0.9, 0.12, 0.6, 'olive', false); f.add('metalD', g.cyl, s * 2.0, 1.02, 0.9, 0, -HP, 0, 0.16, 1.5, 0.16);
  }
  f.inst('tire', 0, 0.3, 6.2, 0, 0, 0, 0.55); f.beam('metalD', 0, 0.3, 6.2, 0, 1.6, 5.8, 0.09);
  f.add('metal', g.cyl, 0, 3.3, 0.2, 0, 0, 0, 0.16, 0.7, 0.16);
  for (const a of [0.5, 0.5 + HP]) f.add('rubber', g.box, 0, 3.98, 0.2, a, 0, 0, 13.6, 0.05, 0.42);
  f.box(0, 4.9, 9.3, 0.1, 0.1, 0.1, 'nRed', false);
  f.col(0, -0.4, 1.3, 4.6, 0.3, 3.5); f.col(0, 6.4, 0.4, 3.2, 1.6, 3.0);
}

// Hangar a volta (tetto estruso ad arco), portoni aperti a nord e sud, passerella con scala, officina
function map_desert_hangar(c, x, z) {
  const k = c.kit, T = c.T, f = map_desert_fr(c, x, 0, z, 0), W = 18, D = 22, H = 5, ez = D / 2 - 0.3;
  f.box(0, 0, 0, W, 0.12, D, 'slab', true);
  for (const s of [-1, 1]) {
    for (const sz of [-6.6, 6.6]) { f.box(s * (W / 2 - 0.2), 0.12, sz, 0.4, 1.4, 8.8, 'conc', true); f.box(s * (W / 2 - 0.2), 1.52, sz, 0.3, H - 1.4, 8.8, 'corr', true); }
    f.box(s * (W / 2 - 0.2), 2.9, 0, 0.3, H - 2.78, 4.4, 'corr', true);
    for (let i = -2; i <= 2; i++) if (i) f.box(s * (W / 2 - 0.2), 0.12, i * 5.3, 0.55, H, 0.4, 'metalD', false);
    f.box(s * 6.6, 0.13, 0, 0.3, 0.02, D - 2, 'lineY', false);
  }
  const sh = new T.Shape();
  sh.moveTo(-9, 0); sh.lineTo(-5.5, 0); sh.lineTo(-5.5, 5.6); sh.lineTo(5.5, 5.6); sh.lineTo(5.5, 0); sh.lineTo(9, 0); sh.lineTo(9, H);
  sh.absellipse(0, H, 9, 4.2, 0, Math.PI, false, 0); sh.lineTo(-9, 0);
  const end = new T.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false, curveSegments: 14 });
  const rs = new T.Shape();
  rs.absellipse(0, 0, 9.3, 4.5, 0, Math.PI, false, 0); rs.absellipse(0, 0, 9.0, 4.25, Math.PI, 0, true, 0);
  const roof = new T.ExtrudeGeometry(rs, { depth: D + 0.8, bevelEnabled: false, curveSegments: 18 });
  const rib = new T.ExtrudeGeometry(rs, { depth: 0.3, bevelEnabled: false, curveSegments: 18 });
  end.userData.uvk = 3; roof.userData.uvk = 3; rib.userData.uvk = 3;
  f.add('corr', roof, 0, H + 0.12, -(D + 0.8) / 2, 0, 0, 0);
  k.collider(x - 9, H + 2.6, z - D / 2, x + 9, H + 4.8, z + D / 2);
  for (const s of [-1, 1]) {
    f.add('corr', end, 0, 0.12, s * ez - 0.125, 0, 0, 0);
    for (const sx of [-7.25, 7.25]) k.collider(x + sx - 1.75, 0, z + s * ez - 0.2, x + sx + 1.75, H + 2, z + s * ez + 0.2);
    k.collider(x - 5.5, 5.7, z + s * ez - 0.2, x + 5.5, 9.4, z + s * ez + 0.2);
    f.box(0, 5.6, s * ez, 11.4, 0.3, 0.4, 'metalD', false);
    for (const sx of [-5.7, 5.7]) f.box(sx, 0.12, s * (ez + 0.15), 0.3, 1.2, 0.1, 'lineY', false);
  }
  for (let i = -2; i <= 2; i++) {
    f.add('metalD', rib, 0, H + 0.12, i * 5.2 - 0.15, 0, 0, 0, 0.985, 0.97, 1);
    for (const sx of [-4, 4]) f.box(sx, H + 2.75, i * 5.2, 2.4, 0.08, 0.25, 'nWarm', false);
  }
  f.box(-7.2, 3.0, -2, 2.6, 0.15, 14, 'metal', true); f.box(-5.95, 3.15, -2, 0.06, 1.0, 14, 'metalD', true);
  for (const zz of [-8, -3.5, 3.5]) f.inst('post', -6.0, 0.12, zz, 0, 0, 0, 0.07, 2.9, 0.07);
  k.stairs(x - 7.2, 0.12, z + 7.2, 1.5, 3.03, 4.4, 0, c.m.metal);
  f.nav(-7.2, 3.15, -2); f.nav(0, 0.12, 0); f.nav(-7.2, 0.12, 10);
  f.box(7.9, 0.12, -6, 1.0, 0.9, 5, 'woodD', false); f.box(7.9, 1.02, -7.5, 0.6, 0.35, 0.8, 'red', false); f.box(7.9, 1.02, -5, 0.5, 0.25, 1.2, 'metal', false);
  f.box(7.6, 0.12, 4, 1.2, 1.3, 0.8, 'red', false); f.box(7.9, 0.12, 7.5, 0.9, 2.4, 3.2, 'metalD', false);
  for (let i = 0; i < 3; i++) f.box(7.8, 0.4 + i * 0.75, 7.5, 1.0, 0.4, 2.8, i === 1 ? 'wood' : 'olive', false);
  f.beam('lineY', 4, 0.12, -8.5, 4, 3.6, -8.5, 0.14); f.beam('lineY', 4, 3.6, -8.5, 6.2, 3.6, -8.5, 0.14); f.beam('metalD', 6.1, 3.6, -8.5, 6.1, 1.8, -8.5, 0.04);
  f.box(6.1, 1.2, -8.5, 0.8, 0.6, 0.6, 'metalD', false);
  for (let i = 0; i < 5; i++) f.inst(i % 2 ? 'barrel' : 'barrelB', -3.5 + i * 0.68, 0.12, -9.6, 0, 0, 0, 1);
  for (let i = 0; i < 4; i++) f.inst('tire', -7.6, 0.28 + i * 0.3, 10, 0, 0, Math.PI / 2, 0.9);
  f.box(-2.5, 0.12, 9.2, 1.6, 1.0, 1.2, 'olive', true); f.box(-0.6, 0.12, 9.4, 1.2, 0.5, 1.0, 'wood', true);
  map_desert_board(c, 2, x + 8.72, 3.4, z - 6.6, Math.PI / 2, 3, false); map_desert_board(c, 2, x - 8.72, 3.4, z + 6.6, -Math.PI / 2, 3, false);
}

// Palma: tronco curvo a segmenti, corona di 11 fronde piegate, datteri
function map_desert_palm(c, x, z, h) {
  const k = c.kit, g = c.g, lx = k.rand(-0.16, 0.16), lz = k.rand(-0.16, 0.16), n = 6, sh = h / n;
  let px = x, py = 0, pz = z;
  for (let i = 0; i < n; i++) {
    const a = lz * (i + 1) * 0.45, b = -lx * (i + 1) * 0.45, rr = 0.3 - i * 0.025;
    map_desert_add(c, 'woodD', g.cyl, px, py, pz, 0, a, b, rr, sh + 0.06, rr);
    px += -Math.sin(b) * sh; pz += Math.sin(a) * sh; py += Math.cos(a) * Math.cos(b) * sh;
  }
  k.collider(x - 0.3, 0, z - 0.3, x + 0.3, 3, z + 0.3);
  map_desert_add(c, 'woodD', g.sph, px, py - 0.1, pz, 0, 0, 0, 0.42, 0.5, 0.42);
  for (let i = 0; i < 11; i++) map_desert_inst(c, 'frond', px, py + 0.15, pz, i * 1.142 + k.rand(-0.2, 0.2), i % 2 ? -0.1 : -0.5, 0, k.rand(0.9, 1.2));
  for (let i = 0; i < 3; i++) map_desert_add(c, 'wood', g.sph, px + k.rand(-0.3, 0.3), py - 0.45, pz + k.rand(-0.3, 0.3), 0, 0, 0, 0.14);
}

// Bancarella del bazar: banco, tenda a righe inclinata, giare, casse, tappeto
function map_desert_stall(c, x, z, r) {
  const k = c.kit, f = map_desert_fr(c, x, 0, z, r + k.rand(-0.04, 0.04));
  f.box(0, 0, 0, 3.4, 0.9, 1.1, 'wood', true); f.box(0, 0.9, 0, 3.6, 0.06, 1.3, 'woodD', false);
  for (const sx of [-1.7, 1.7]) for (const sz of [-0.9, 1.2]) f.inst('log', sx, 0, sz, 0, 0, 0, 0.045, sz < 0 ? 2.3 : 2.8, 0.045);
  f.add('stripe', c.g.box, 0, 2.58, 0.15, 0, -0.23, 0, 3.9, 0.05, 2.5); f.box(0, 2.05, -1.05, 3.9, 0.3, 0.03, 'stripe', false);
  for (let i = 0; i < 5; i++) f.inst('jar', -1.3 + i * 0.65 + k.rand(-0.1, 0.1), 0.96, k.rand(-0.3, 0.3), k.rand(0, 3), 0, 0, k.rand(0.7, 1.1));
  f.box(-1.0, 0, 1.0, 0.9, 0.5, 0.7, 'woodD', true, 0.1); f.box(0.9, 0, 1.1, 0.7, 0.45, 0.7, 'wood', true, -0.2);
  f.inst('jar', 1.9, 0, -0.6, 0, 0, 0, 1.6); f.inst('jar', 2.2, 0, 0.1, 1, 0, 0, 1.3);
  f.box(0, 0.02, -1.9, 2.4, 0.02, 1.5, 'stripe', false, 0.05);
}

function map_desert_crates(c, x, z, mk) {
  const k = c.kit, f = map_desert_fr(c, x, 0, z, k.rand(-0.3, 0.3));
  f.box(0, 0, 0, 1.5, 1.1, 1.5, mk, true); f.box(1.35, 0, 0.2, 1.1, 0.8, 1.1, 'wood', true, 0.3); f.box(0.1, 1.1, -0.05, 1.0, 0.75, 1.0, 'olive', true, -0.2);
  for (const s of [-0.76, 0.76]) { f.box(s, 0.1, 0, 0.04, 0.9, 1.3, 'woodD', false); f.box(0, 0.1, s, 1.3, 0.9, 0.04, 'woodD', false); }
  f.box(-0.3, 0, 1.4, 1.2, 0.14, 1.0, 'wood', false, 0.4);
}

function map_desert_barrels(c, x, z, n) {
  const k = c.kit;
  for (let i = 0; i < n; i++) map_desert_inst(c, i % 3 ? 'barrel' : 'barrelB', x + (i % 2) * 0.66 + k.rand(-0.05, 0.05), 0, z + Math.floor(i / 2) * 0.66 + k.rand(-0.05, 0.05), k.rand(0, 6), 0, 0, 1);
  k.collider(x - 0.35, 0, z - 0.35, x + 1.0, 0.95, z + Math.ceil(n / 2) * 0.66 - 0.3);
}

// Palo di legno con traversa (lungo Z), isolatori, trasformatore e lampione
function map_desert_pole(c, x, z) {
  const k = c.kit, f = map_desert_fr(c, x, 0, z, 0);
  f.add('woodD', c.g.cyl, 0, 0, 0, 0, k.rand(-0.03, 0.03), k.rand(-0.03, 0.03), 0.13, 8, 0.13);
  k.collider(x - 0.15, 0, z - 0.15, x + 0.15, 8, z + 0.15);
  f.box(0, 7.2, 0, 0.1, 0.1, 2.0, 'woodD', false);
  for (const s of [-0.9, 0, 0.9]) f.box(0, 7.3, s, 0.07, 0.14, 0.07, 'conc', false);
  f.box(0.3, 6.0, 0, 0.4, 0.55, 0.35, 'metal', false);
  f.beam('metalD', 0, 6.4, 0, 0, 6.8, -1.5, 0.05); f.box(0, 6.72, -1.6, 0.3, 0.08, 0.5, 'metalD', false); f.box(0, 6.68, -1.6, 0.22, 0.04, 0.4, 'nWarm', false);
}

// PUNTO EROE 1: traliccio radio bianco/rosso alto 38 m con parabole, fari rossi e recinto
function map_desert_mast(c, x, z) {
  const g = c.g, k = c.kit, f = map_desert_fr(c, x, 0, z, 0), H = 38, L = 12, cor = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const half = (i) => 1.6 + (0.35 - 1.6) * (i / L);
  f.box(0, 0, 0, 4.2, 0.3, 4.2, 'conc', true); k.collider(x - 1.6, 0.3, z - 1.6, x + 1.6, 12, z + 1.6);
  for (let i = 0; i < L; i++) {
    const a = half(i), b = half(i + 1), y0 = 0.3 + (i * H) / L, y1 = 0.3 + ((i + 1) * H) / L, mk = i % 2 ? 'lineW' : 'red';
    for (let q = 0; q < 4; q++) {
      const P = cor[q], N = cor[(q + 1) % 4];
      f.beam(mk, P[0] * a, y0, P[1] * a, P[0] * b, y1, P[1] * b, 0.12);
      f.beam(mk, P[0] * b, y1, P[1] * b, N[0] * b, y1, N[1] * b, 0.07);
      f.beam(mk, P[0] * a, y0, P[1] * a, N[0] * b, y1, N[1] * b, 0.06);
      if (i === 5 || i === 9) f.box(P[0] * b, y1, P[1] * b, 0.2, 0.2, 0.2, 'nRed', false);
    }
  }
  f.inst('post', 0, H + 0.3, 0, 0, 0, 0, 0.04, 4, 0.04); f.box(0, H + 0.3, 0, 0.35, 0.35, 0.35, 'nRed', false);
  for (const [yy, a] of [[22, 0.4], [26.5, 2.6], [30, 4.4], [33, 1.5]]) {
    const dx = Math.sin(a), dz = Math.cos(a);
    f.add('lineW', g.cyl, dx * 0.6, yy, dz * 0.6, a, Math.PI / 2, 0, 0.75, 0.35, 0.75); f.add('lineW', g.dome, dx * 0.95, yy, dz * 0.95, a, Math.PI / 2, 0, 0.75, 0.3, 0.75);
  }
  for (let q = 0; q < 4; q++) {
    const P = cor[q], N = cor[(q + 1) % 4];
    f.inst('post', P[0] * 3, 0, P[1] * 3, 0, 0, 0, 0.05, 2.2, 0.05);
    if (q !== 2) for (const yy of [0.5, 1.3, 2.1]) f.beam('metal', P[0] * 3, yy, P[1] * 3, N[0] * 3, yy, N[1] * 3, 0.035);
  }
  k.collider(x - 3.05, 0, z - 3.05, x + 3.05, 2.2, z - 2.95); k.collider(x - 3.05, 0, z - 3, x - 2.95, 2.2, z + 3); k.collider(x + 2.95, 0, z - 3, x + 3.05, 2.2, z + 3);
  f.box(1.5, 0.3, 1.5, 0.8, 1.6, 0.6, 'metal', false); f.box(-1.6, 0.3, 1.6, 0.7, 0.2, 0.5, 'lineY', false);
  map_desert_sign(c, 13, x, 1.3, z - 3.09, Math.PI, 0.75, 1.25);
}

// PUNTO EROE 2: moschea con cupola turchese, portale ad arco, merli e minareto di 26 m
function map_desert_mosque(c, x, z) {
  const g = c.g, k = c.kit, f = map_desert_fr(c, x, 0, z, 0);
  f.box(0, 0, 0, 9, 5.2, 9, 'mudC', true); f.box(0, 5.2, 0, 9.4, 0.3, 9.4, 'brick', false);
  for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) { f.box(i * 1.3, 5.5, s * 4.55, 0.7, 0.5, 0.3, 'mudC', false); f.box(s * 4.55, 5.5, i * 1.3, 0.3, 0.5, 0.7, 'mudC', false); }
  f.add('mudC', g.cyl, 0, 5.5, 0, 0, 0, 0, 3.3, 0.9, 3.3); f.add('teal', g.dome, 0, 6.4, 0, 0, 0, 0, 3.2, 3.0, 3.2);
  f.add('metal', g.cyl6, 0, 9.3, 0, 0, 0, 0, 0.05, 1.2, 0.05); f.add('metal', g.sph, 0, 10.5, 0, 0, 0, 0, 0.2);
  f.add('mudT', map_desert_archGeo(c.T, 3.6, 4.6, 2.0, 3.5, 0.35), 0, 0, 4.6, 0, 0, 0);
  f.box(0, 0, 4.52, 2.0, 3.5, 0.08, 'woodD', false); f.box(0, 0, 5.3, 4.2, 0.12, 1.4, 'slab', false);
  map_desert_sign(c, 14, x, 1.5, z + 4.61, 0, 1.8, 3.0);
  for (const s of [-1, 1]) {
    f.box(s * 3.2, 1.8, 4.52, 0.8, 1.7, 0.06, 'nWarm', false); f.box(s * 3.2, 1.6, 4.55, 1.1, 0.14, 0.12, 'brick', false);
    for (const i of [-2.5, 0, 2.5]) f.box(s * 4.52, 2.0, i, 0.06, 1.7, 0.8, 'teal', false);
  }
  map_desert_sign(c, 12, x - 4.54, 1.8, z - 1.25, -Math.PI / 2, 1.0, 1.25);
  const mx = 6.3, mz = 3.2;
  f.box(mx, 0, mz, 2.6, 6, 2.6, 'mudC', true); f.box(mx, 6, mz, 2.9, 0.25, 2.9, 'brick', false);
  map_desert_sign(c, 14, x + mx, 1.0, z + mz + 1.33, 0, 1.1, 1.9);
  f.add('mudC', g.cyl, mx, 6.2, mz, 0, 0, 0, 1.05, 13, 1.05); k.collider(x + mx - 1.1, 6, z + mz - 1.1, x + mx + 1.1, 26, z + mz + 1.1);
  for (const yy of [9.5, 12.5]) f.add('mudT', g.tor, mx, yy, mz, 0, 0, 0, 1.08, 1.4, 1.08);
  f.add('mudT', g.cyl, mx, 15.4, mz, 0, 0, 0, 1.75, 0.3, 1.75); f.add('woodD', g.tor, mx, 16.5, mz, 0, 0, 0, 1.7, 0.6, 1.7);
  for (let i = 0; i < 8; i++) f.inst('log', mx + Math.sin(i * 0.785) * 1.7, 15.7, mz + Math.cos(i * 0.785) * 1.7, 0, 0, 0, 0.04, 0.8, 0.04);
  f.add('mudC', g.cyl, mx, 19.2, mz, 0, 0, 0, 0.8, 3, 0.8);
  for (let i = 0; i < 4; i++) f.box(mx + Math.sin(i * 1.571) * 0.8, 19.8, mz + Math.cos(i * 1.571) * 0.8, 0.45, 1.3, 0.1, 'nWarm', false, i * 1.571);
  f.add('teal', g.cone, mx, 22.2, mz, 0, 0, 0, 1.15, 3, 1.15); f.add('metal', g.sph, mx, 25.4, mz, 0, 0, 0, 0.22);
}

// Rilievi di facciata: marcapiani, spigoli di mattoni, travi sporgenti (vigas), tende a righe, lampade, insegna, tetto
function map_desert_dress(c, b) {
  const k = c.kit, g = c.g, f = map_desert_fr(c, b.x, 0, b.z, 0), hw = b.w / 2, hd = b.d / 2, H = b.floors * b.floorH, tr = b.trim, HP = Math.PI / 2;
  for (let fl = 1; fl <= b.floors; fl++) {
    const y = fl * b.floorH - 0.12;
    for (const s of [-1, 1]) { f.box(0, y, s * (hd + 0.06), b.w + 0.3, 0.2, 0.14, tr, false); f.box(s * (hw + 0.06), y, 0, 0.14, 0.2, b.d + 0.3, tr, false); }
    if (b.vigas) for (let i = -hw + 0.9; i < hw; i += 1.1) { f.inst('log', i, y - 0.25, -hd - 0.45, 0, HP, 0, 0.07, 0.5, 0.07); f.inst('log', i, y - 0.25, hd - 0.05, 0, HP, 0, 0.07, 0.5, 0.07); }
    f.box(hw - 2.2, y - 0.9, -hd - 0.28, 0.8, 0.55, 0.45, 'metal', false); f.box(-hw - 0.28, y - 0.9, hd - 2.4, 0.45, 0.55, 0.8, 'metal', false);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box(sx * (hw + 0.04), 0, sz * (hd + 0.04), 0.5, H + 0.5, 0.5, tr, false);
  f.box(-hw + 0.9, 0, hd + 0.1, 0.1, H, 0.1, 'metalD', false); f.box(hw + 0.1, 0, -hd + 1.0, 0.1, H, 0.1, 'metalD', false);
  b.dl.forEach((d, i) => {
    const ns = d.side === 'n' || d.side === 's', sg = d.side === 'n' || d.side === 'w' ? -1 : 1;
    const lx = ns ? d.at : sg * (hw + 0.5), lz = ns ? sg * (hd + 0.5) : d.at;
    f.box(lx, 0, lz, ns ? d.width + 0.8 : 1.0, 0.1, ns ? 1.0 : d.width + 0.8, 'slab', false);
    f.add(b.awn, g.box, ns ? lx : sg * (hw + 0.7), 2.75, ns ? sg * (hd + 0.7) : lz, ns ? (sg > 0 ? 0 : Math.PI) : sg * HP, 0.3, 0, d.width + 1.0, 0.05, 1.5);
    f.box(ns ? lx + d.width / 2 + 0.5 : sg * (hw + 0.12), 2.3, ns ? sg * (hd + 0.12) : lz + d.width / 2 + 0.5, 0.18, 0.25, 0.18, 'nWarm', false);
    if (!i && b.sign !== undefined) {
      const ry = d.side === 'n' ? Math.PI : d.side === 's' ? 0 : d.side === 'e' ? HP : -HP;
      map_desert_board(c, b.sign, b.x + (ns ? lx : sg * (hw + 0.1)), 3.75, b.z + (ns ? sg * (hd + 0.1) : lz), ry, 2.6, false);
    }
  });
  const ry = H + 0.02;
  f.box(-hw + 1.6, ry, -hd + 1.5, 1.2, 0.8, 0.9, 'metal', true, 0.1); f.box(-hw + 1.6, ry + 0.8, -hd + 1.5, 0.7, 0.08, 0.7, 'metalD', false, 0.1);
  f.add(b.tank, g.cyl, hw - 1.6, ry + 0.5, hd - 1.6, 0, 0, 0, 0.8, 1.5, 0.8); f.col(hw - 1.6, hd - 1.6, 0.8, 0.8, ry, ry + 2);
  for (const s of [-0.5, 0.5]) f.inst('post', hw - 1.6 + s, ry, hd - 1.6 + s, 0, 0, 0, 0.05, 0.5, 0.05);
  f.inst('post', hw - 0.8, ry, -hd + 0.8, 0, 0, 0, 0.03, k.rand(2.5, 4.5), 0.03);
  f.add('lineW', g.dome, -hw + 1.2, ry + 0.9, hd - 1.2, 0.8, 0.9, 0, 0.5, 0.2, 0.5); f.inst('post', -hw + 1.2, ry, hd - 1.2, 0, 0, 0, 0.04, 0.9, 0.04);
  if (b.vigas) {
    f.inst('log', hw - 3.4, ry, -hd + 3.2, 0, 0, 0, 0.04, 1.9, 0.04); f.inst('log', -hw + 3.6, ry, -hd + 3.2, 0, 0, 0, 0.04, 1.9, 0.04);
    f.beam('woodD', hw - 3.4, ry + 1.85, -hd + 3.2, -hw + 3.6, ry + 1.85, -hd + 3.2, 0.02);
    for (let i = hw - 4.2; i > -hw + 4; i -= 1.3) f.box(i, ry + 1.05, -hd + 3.2, 0.8, 0.8, 0.02, 'stripe', false);
  }
}

// Arredo di una stanza (mobili alti senza collider, bassi <= 0.5 m scavalcabili: non bloccano mai scale e porte)
function map_desert_room(c, b, fl, kind) {
  const k = c.kit, f = map_desert_fr(c, b.x, fl * b.floorH + 0.05, b.z, 0), iw = b.w / 2 - 1.1, id = b.d / 2 - 0.75;
  const shelf = (lx, lz, mk) => { f.box(lx, 0, lz, 2.2, 2.0, 0.42, 'metalD', false); for (let i = 0; i < 3; i++) f.box(lx + k.rand(-0.1, 0.1), 0.22 + i * 0.62, lz, 1.7, 0.36, 0.48, i === 1 ? 'wood' : mk, false); };
  const table = (lx, lz, w, d, mk) => { f.box(lx, 0.7, lz, w, 0.07, d, mk, false); for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box(lx + sx * (w / 2 - 0.1), 0, lz + sz * (d / 2 - 0.1), 0.08, 0.7, 0.08, mk, false); };
  const chair = (lx, lz) => { f.box(lx, 0, lz, 0.42, 0.44, 0.42, 'woodD', true); f.box(lx, 0.44, lz + 0.19, 0.42, 0.46, 0.05, 'woodD', false); };
  const crate = (lx, lz, mk) => { f.box(lx, 0, lz, 1.0, 0.5, 0.8, mk, true, k.rand(-0.2, 0.2)); f.box(lx + 0.1, 0.5, lz, 0.7, 0.42, 0.6, 'wood', false, k.rand(-0.3, 0.3)); };
  const desk = (lx, lz) => { f.box(lx, 0, lz, 1.5, 0.74, 0.7, 'wood', false); f.box(lx, 0.74, lz, 0.5, 0.36, 0.06, 'metalD', false); f.box(lx, 0.79, lz, 0.42, 0.26, 0.08, 'nGreen', false); chair(lx, lz + 0.8); };
  const bunk = (lx, lz) => { map_desert_cot(c, f, lx, 0, lz, 0); map_desert_cot(c, f, lx, 1.0, lz, 0); for (const sx of [-0.42, 0.42]) for (const sz of [-0.97, 0.97]) f.box(lx + sx, 0, lz + sz, 0.06, 1.55, 0.06, 'metalD', false); };
  const rug = (mk) => f.box(0, 0.005, 0, b.w * 0.42, 0.02, b.d * 0.36, mk, false, k.rand(-0.06, 0.06));
  if (kind === 'command') {
    table(0, 0.4, 3.2, 1.9, 'metalD'); f.box(0, 0.78, 0.4, 2.8, 0.02, 1.5, 'nGreen', false);
    for (let i = 0; i < 3; i++) { f.box(iw - i * 0.95, 0, -id, 0.8, 2.0, 0.6, 'metalD', false); f.box(iw - i * 0.95, 0.5 + i * 0.3, -id + 0.31, 0.6, 0.12, 0.02, 'nAmber', false); }
    desk(-iw + 0.2, -id + 0.2); desk(-iw + 2.2, -id + 0.2); crate(iw, id - 0.2, 'olive'); f.box(-iw, 0, id, 0.9, 1.9, 0.5, 'metal', false);
  } else if (kind === 'office') {
    rug('stripe'); desk(-iw + 0.2, -id + 0.2); desk(iw - 0.2, -id + 0.2); shelf(-iw + 0.5, id, 'mudC'); f.box(iw, 0, id, 0.9, 1.3, 0.5, 'metal', false);
    table(0, 0.6, 1.8, 1.0, 'wood'); chair(-0.5, 1.5); chair(0.6, -0.3);
  } else if (kind === 'barracks') {
    rug('camo'); bunk(-iw, -id + 0.6); bunk(iw, -id + 0.6); bunk(-iw, id - 0.6); bunk(iw, id - 0.6);
    f.box(-iw + 1.3, 0, -id, 0.9, 1.9, 0.5, 'olive', false); f.box(iw - 1.3, 0, id, 0.9, 1.9, 0.5, 'olive', false); crate(0.4, -id + 0.2, 'wood');
  } else if (kind === 'store') {
    shelf(-iw + 0.6, -id + 0.05, 'stripe'); shelf(iw - 0.6, -id + 0.05, 'olive'); shelf(-iw + 0.6, id - 0.05, 'teal');
    crate(iw, id - 0.2, 'wood'); crate(iw - 1.4, id - 0.3, 'woodD'); crate(0, 0.5, 'olive');
    for (let i = 0; i < 3; i++) f.inst('barrel', iw - 0.2 - i * 0.66, 0, 0.3, 0, 0, 0, 1);
  } else if (kind === 'market') {
    for (const s of [-1, 1]) {
      f.box(s * (iw - 0.6), 0, 0, 2.6, 0.5, 0.9, 'wood', true); f.box(s * (iw - 0.6), 0.5, 0, 2.6, 0.4, 0.9, 'wood', false);
      for (let i = 0; i < 4; i++) f.inst('jar', s * (iw - 0.6) - 1 + i * 0.66, 0.9, k.rand(-0.2, 0.2), 0, 0, 0, k.rand(0.7, 1));
    }
    for (let i = 0; i < 12; i++) f.inst('bag', -iw + k.rand(0, 1.6), (i % 3) * 0.21, -id + k.rand(0, 0.8), k.rand(0, 3), 0, 0, 1.1);
    shelf(iw - 0.6, -id + 0.05, 'stripe'); crate(-iw + 0.3, id - 0.2, 'woodD'); rug('stripe'); f.inst('jar', iw, 0, id, 0, 0, 0, 1.8);
  } else if (kind === 'living') {
    rug('stripe'); f.box(0, 0.02, 0.3, 1.2, 0.34, 0.8, 'woodD', true); f.inst('jar', 0.2, 0.38, 0.3, 0, 0, 0, 0.7);
    for (const s of [-1, 1]) { f.box(s * (iw + 0.3), 0, 0, 0.8, 0.3, b.d * 0.5, 'teal', true); f.box(s * (iw + 0.6), 0.3, 0, 0.25, 0.4, b.d * 0.5, 'stripe', false); }
    shelf(0.6, -id + 0.05, 'mudT'); f.inst('jar', -iw, 0, -id, 0, 0, 0, 1.7); f.inst('jar', iw, 0, id, 0, 0, 0, 1.4);
  } else if (kind === 'kitchen') {
    f.box(-iw + 0.9, 0, -id, 3.2, 0.9, 0.6, 'conc', false); f.box(-iw + 0.2, 0.9, -id, 0.7, 0.08, 0.5, 'metalD', false); f.box(-iw + 2.9, 0, -id, 0.7, 1.7, 0.6, 'metal', false);
    for (let i = 0; i < 3; i++) f.inst('jar', -iw + 0.9 + i * 0.5, 0.9, -id, 0, 0, 0, 0.6);
    table(0.5, 0.8, 2.0, 1.1, 'wood'); chair(-0.2, 1.7); chair(1.2, 1.7); chair(0.5, -0.1); shelf(iw - 0.6, id - 0.05, 'mudT'); crate(-iw + 0.2, id - 0.2, 'wood');
  } else {
    f.box(-iw + 0.9, 0, -id, 3.4, 0.85, 0.7, 'woodD', false); f.box(-iw + 0.2, 0.85, -id, 0.5, 0.3, 0.4, 'red', false); shelf(iw - 0.6, -id + 0.05, 'rust');
    for (let i = 0; i < 4; i++) f.inst('tire', iw, 0.14 + i * 0.28, id - 0.3, 0, 0, Math.PI / 2, 0.8);
    for (let i = 0; i < 3; i++) f.inst('barrel', -iw + i * 0.66, 0, id - 0.1, 0, 0, 0, 1);
    f.box(0.5, 0, 0.5, 1.1, 0.5, 0.8, 'metalD', true); f.box(0.5, 0.5, 0.5, 0.7, 0.3, 0.5, 'rust', false); crate(iw - 0.2, 0.4, 'olive');
  }
}

MAPS.push({
  id: 'desert',
  name: 'Base nel Deserto',
  size: 140,
  env: { sky: 'day', sunElev: 50, sunAzim: 215, sunColor: 0xffe2b4, sunIntensity: 4.9, hemiSky: 0x9cc6ff, hemiGround: 0x96784f, hemiIntensity: 1.2,
    fogColor: 0xdcc39b, fogDensity: 0.004, exposure: 0.52, bloomThreshold: 1.9, bloomStrength: 0.45, rain: false, snow: false, dust: true },

  build(kit) {
    const c = map_desert_ctx(kit), m = c.m, g = c.g, T = c.T, PI = Math.PI, HP = PI / 2, R = kit.rand;
    const W = map_desert_fr(c, 0, 0, 0, 0);
    const D = (x, z, w, d, r, mk) => kit.decal(x, z, w, d, r || 0, m[mk]);

    // ---- 1. TERRENO: asfalto crepato, lastre, piastrelle della piazza, cingoli sulla sabbia, macchie (130+ decal) ----
    kit.ground(m.sand);
    D(0, 40, 124, 45, 0, 'sandDark'); D(0, 8, 126, 10, 0, 'asph'); D(0, 23.5, 8, 21, 0, 'asph'); D(0, -6, 126, 9.5, 0.01, 'sandDark');
    D(38, 42.5, 24, 30, 0, 'slab'); D(-38, 44, 23, 23, 0, 'asph'); D(0, 40, 22, 17, 0, 'slab'); D(-46, 23, 24, 13, 0, 'sandDark');
    D(0, -22, 32, 15, 0, 'ftile'); D(0, -33.5, 104, 6.5, 0, 'sandDark'); D(-45, -26, 9, 26, 0, 'sandDark'); D(45, -22, 13, 24, 0, 'sandDark'); D(0, -13, 9, 5, 0, 'slab');
    D(-45, -6, 8, 11, 0, 'sandDark'); D(45, -6, 8, 11, 0, 'sandDark'); D(-22, 26, 18, 14, 0, 'slab'); D(20, 25.5, 16, 14, 0, 'slab');
    for (const [x, z, len, r] of [[-45, 10, 30, 0], [45, 8, 34, 0.03], [-45, -22, 30, -0.02], [45, -24, 26, 0.04], [-30, -6, 36, HP], [28, -6.4, 40, HP + 0.03], [-56, 24, 20, 0.2],
      [-26, 36, 22, HP - 0.1], [24, 44, 14, HP], [52, 30, 22, 0.05], [0, -33.5, 44, HP], [-34, -33.8, 24, HP - 0.04], [36, -33.2, 26, HP + 0.05], [-20, 21, 20, HP + 0.2],
      [30, 20.5, 22, HP - 0.15], [-54, -44, 20, 0.3], [54, -50, 18, -0.2], [10, 56, 16, HP], [-45, 36, 14, 0.5], [58, -4, 14, 0.1]]) D(x, z, 4, len, r, 'track');
    for (let x = -60; x <= 60; x += 6) if (Math.abs(x) > 5) D(x, 8, 3, 0.22, R(-0.02, 0.02), 'lineY');
    for (let x = -54; x <= 54; x += 18) { D(x, 3.5, 13, 0.18, 0, 'lineW'); D(x, 12.5, 13, 0.18, 0, 'lineW'); }
    for (let z = 15; z <= 32; z += 4.5) D(0, z, 0.2, 2.4, 0, 'lineW');
    D(0, 14.2, 7, 0.4, 0, 'lineW');
    for (let i = 0; i < 44; i++) D(R(-58, 58), R(-58, 58), R(1.5, 6), R(1.5, 5), R(0, 3), kit.pick(['sandDark', 'sandDark', 'rock', 'sand']));
    for (let i = 0; i < 12; i++) D(R(-58, 58), R(3, 13), R(2, 6), R(1, 3), R(-0.3, 0.3), 'sand');
    for (let i = 0; i < 10; i++) D(R(-55, 55), i % 2 ? R(4, 12) : R(34, 52), R(1, 2.4), R(1, 2.4), R(0, 3), 'concD');
    for (let x = -54; x <= 54; x += 12) if (Math.abs(x) > 6) for (const z of [2.85, 13.15]) W.box(x, 0, z, 11.6, 0.15, 0.3, 'conc', false, R(-0.01, 0.01));
    for (const x of [-30, 14, 50]) W.add('metalD', g.cyl, x, 0.005, 8 + R(-2, 2), 0, 0, 0, 0.45, 0.02, 0.45);
    W.box(-24, 0, -17.2, 16, 0.15, 1.6, 'slab', false); W.box(24, 0, -17.2, 14, 0.15, 1.6, 'slab', false); W.box(0, 0, -33.2, 16, 0.15, 1.6, 'slab', false);

    // ---- 2. BORDI: HESCO, T-wall, mura di fango merlate, città di fango con facciate dipinte, dune e mesa ----
    kit.collider(-72, 0, -72, 72, 30, -64); kit.collider(-72, 0, 64, 72, 30, 72); kit.collider(-72, 0, -64, -64, 30, 64); kit.collider(64, 0, -64, 72, 30, 64);
    map_desert_hesco(c, 0, 63.2, 90, 0, 2);
    for (const s of [-1, 1]) {
      map_desert_hesco(c, s * 63.2, 40, 32, HP, 2); map_desert_twall(c, s * 63.4, 3, 12, HP);
      map_desert_board(c, 2, s * 63.16, 2.1, 3, -s * HP, 3, false);
      W.box(s * 63.4, 0, -37.5, 1, 5, 51, 'mudO', true); W.box(s * 63.4, 5, -37.5, 1.3, 0.25, 51.4, 'brick', false);
      for (let z = -60; z <= -14; z += 6.5) W.box(s * 62.8, 0, z, 0.6, 4.2, 1.2, 'brick', false);
      map_desert_sign(c, 12, s * 62.88, 1.8, -37.2, -s * HP, 1.0, 1.25); map_desert_sign(c, 13, s * 62.88, 1.8, -24.2, -s * HP, 0.75, 1.25);
      map_desert_sign(c, 11, s * 62.88, 1.9, -50.2, -s * HP, 3, 2.5);
    }
    W.box(0, 0, -63.4, 128, 5, 1, 'mudO', true); W.box(0, 5, -63.4, 128.4, 0.25, 1.3, 'brick', false);
    for (let x = -62; x <= 62; x += 2) W.box(x, 5.25, -63.4, 0.9, 0.55, 0.9, 'mudO', false);
    for (let x = -60; x <= 60; x += 7.5) W.box(x, 0, -62.8, 1.2, 4.2, 0.6, 'brick', false);
    map_desert_sign(c, 11, -18.5, 2.0, -62.87, 0, 3, 2.5); map_desert_sign(c, 11, 33.75, 2.0, -62.87, 0, 3, 2.5);
    map_desert_sign(c, 12, 4, 1.9, -62.87, 0, 1.0, 1.25); map_desert_sign(c, 13, -41, 1.9, -62.87, 0, 0.75, 1.25);
    for (const [x, w, h, mk] of [[-56, 12, 12, 'facA'], [-37, 24, 24, 'facB'], [-18, 12, 24, 'facC'], [-5, 12, 12, 'facA'], [14, 24, 24, 'facC'], [33, 12, 12, 'facB'], [46, 12, 36, 'facA'], [59, 12, 12, 'facC']]) {
      const z = -72 - kit.pick([0, 1.5, 3]), fz = z + 6;
      W.box(x, 0, z, w, h, 12, mk, false); W.box(x, h, z, w + 0.6, 0.5, 12.6, 'mudT', false);
      for (let i = -w / 2 + 0.6; i <= w / 2 - 0.5; i += 1.6) W.box(x + i, h + 0.5, fz - 0.2, 0.8, 0.6, 0.4, 'mudC', false);
      for (let y = 6; y < h; y += 6) W.box(x, y - 0.14, fz + 0.06, w + 0.2, 0.22, 0.14, 'mudT', false);
      for (let j = 2; j < h / 3; j++) if (kit.rng() < 0.6) {
        const kx = x - w / 2 + 1 + 2 * ((kit.rng() * (w / 2)) | 0);
        W.box(kx, 3 * j + 0.5, fz + 0.45, 1.7, 1.0, 0.9, 'woodD', false); W.box(kx, 3 * j + 0.35, fz + 0.45, 1.9, 0.15, 1.0, 'wood', false);
        W.add('stripe', g.box, kx, 3 * j + 2.75, fz + 0.5, 0, 0.35, 0, 1.9, 0.04, 1.1);
      }
      if (kit.rng() < 0.5) W.add('teal', g.dome, x, h + 0.5, z, 0, 0, 0, 3, 2.6, 3); else W.add('metal', g.cyl, x + 2, h + 0.5, z, 0, 0, 0, 1.2, 2.2, 1.2);
      W.add('lineW', g.dome, x - w / 2 + 2.2, h + 1.6, z + 2, 0.6, 0.9, 0, 0.8, 0.3, 0.8);
      W.inst('post', x - w / 2 + 1, h + 0.5, z + 3, 0, 0, 0, 0.05, R(3, 6), 0.05);
    }
    for (const x of [-50, -42, 44, 52]) { W.add('olive', g.cyl, x, 0, 73, 0, 0, 0, 3.6, 13, 3.6); W.add('olive', g.dome, x, 13, 73, 0, 0, 0, 3.6, 1.6, 3.6); }
    W.box(-18, 0, 74, 26, 9, 12, 'corr', false); W.box(-18, 9, 74, 26.6, 0.5, 12.6, 'metalD', false);
    map_desert_board(c, 0, -18, 6.6, 67.9, PI, 9, false);
    W.box(18, 0, 74, 20, 12, 12, 'mudC', false); W.box(18, 12, 74, 20.6, 0.5, 12.6, 'concD', false);
    for (let i = -3; i <= 3; i++) W.box(18 + i * 2.6, 8, 67.95, 1.4, 1.6, 0.1, i % 2 ? 'glass' : 'nWarm', false);
    W.add('conc', g.cyl, 18, 12.5, 74, 0, 0, 0, 1.2, 1.5, 1.2); W.add('lineW', g.sph, 18, 16, 74, 0, 0, 0, 3.6);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283, rr = R(80, 96); W.inst('dune', Math.sin(a) * rr, -1, Math.cos(a) * rr, R(0, 3), 0, 0, R(14, 26), R(3.5, 8), R(9, 15)); }
    for (const [x, z, s] of [[-84, -40, 11], [-88, 6, 14], [-83, 44, 10], [84, -42, 12], [88, 4, 13], [84, 46, 10], [-30, 92, 12], [40, 94, 11]]) {
      W.inst('rock', x, s * 0.5, z, R(0, 6), 0, 0, s, s * 1.1, s * 1.3); W.inst('rock', x + s * 0.4, s * 1.3, z - s * 0.3, R(0, 6), 0, 0, s * 0.6, s * 0.5, s * 0.8);
    }

    // ---- 3. OTTO EDIFICI ENTRABILI: intonaco di fango dipinto, rilievi, insegne, arredo stanza per stanza ----
    const BL = [
      { x: 0, z: 40, w: 16, d: 12, floors: 2, mk: 'mudC', im: 'mudC', fm: 'slab', ru: 0, doors: [['n', 0, 1.8], ['s', -3, 1.7], ['e', 0, 1.6], ['w', 0, 1.6]], trim: 'concD', awn: 'camo', tank: 'metal', sign: 3, rooms: ['command', 'office'] },
      { x: -22, z: 26, w: 14, d: 10, floors: 2, mk: 'mudO', im: 'mudC', fm: 'slab', ru: 0, doors: [['n', 0, 1.7], ['s', 0, 1.7], ['e', 1.5, 1.6]], trim: 'concD', awn: 'camo', tank: 'olive', sign: 2, rooms: ['barracks', 'barracks'] },
      { x: 20, z: 25.5, w: 12, d: 10, floors: 2, mk: 'mudC', im: 'mudO', fm: 'ftile', ru: 0.05, doors: [['n', 0, 1.7], ['s', 0, 1.7], ['w', -1.5, 1.6]], trim: 'conc', awn: 'camo', tank: 'teal', sign: 4, rooms: ['kitchen', 'store'] },
      { x: -24, z: -24, w: 16, d: 12, floors: 3, mk: 'mudO', im: 'brick', fm: 'ftile', ru: 0.12, doors: [['s', 0, 1.8], ['e', 1.5, 1.7], ['n', -2, 1.7], ['w', 0, 1.6]], trim: 'brick', awn: 'stripe', tank: 'rust', sign: 8, vigas: true, rooms: ['market', 'store', 'living'] },
      { x: 0, z: -40, w: 16, d: 12, floors: 3, mk: 'mudC', im: 'brick', fm: 'ftile', ru: 0.08, doors: [['s', 0, 1.9], ['n', 0, 1.9], ['e', 0, 1.7], ['w', 0, 1.7]], trim: 'brick', awn: 'stripe', tank: 'metal', sign: 10, vigas: true, rooms: ['living', 'kitchen', 'barracks'] },
      { x: 24, z: -24, w: 14, d: 12, floors: 3, mk: 'mudT', im: 'mudC', fm: 'ftile', ru: 0.25, doors: [['s', 0, 1.8], ['w', 1.5, 1.7], ['n', 2, 1.7], ['e', 0, 1.6]], trim: 'brick', awn: 'stripe', tank: 'teal', sign: 9, vigas: true, rooms: ['kitchen', 'living', 'barracks'] },
      { x: -42, z: -47, w: 12, d: 10, floors: 2, mk: 'mudT', im: 'brick', fm: 'slab', ru: 0.1, doors: [['n', 0, 1.7], ['e', 0, 1.7]], trim: 'brick', awn: 'stripe', tank: 'metal', vigas: true, rooms: ['barracks', 'store'] },
      { x: 42, z: -47, w: 12, d: 10, floors: 2, mk: 'mudO', im: 'brick', fm: 'slab', ru: 0.15, doors: [['n', 0, 1.7], ['w', 0, 1.7]], trim: 'brick', awn: 'camo', tank: 'rust', vigas: true, rooms: ['workshop', 'store'] }
    ];
    for (const b of BL) {
      b.floorH = 3.4; b.dl = b.doors.map((d) => ({ side: d[0], at: d[1], width: d[2] }));
      kit.building({ x: b.x, z: b.z, w: b.w, d: b.d, floors: b.floors, floorH: 3.4, wall: 0.3, mat: m[b.mk], innerMat: m[b.im], floorMat: m[b.fm], doors: b.dl, windows: true, roof: 'parapet', ruined: b.ru, rotY: 0 });
      map_desert_dress(c, b);
      b.rooms.forEach((kd, i) => map_desert_room(c, b, i, kd));
    }
    const NO = BL.map((b) => [b.x - b.w / 2 - 0.6, b.x + b.w / 2 + 0.6, b.z - b.d / 2 - 0.6, b.z + b.d / 2 + 0.6]);
    NO.push([28.5, 47.5, 31, 54], [-47.5, -28.5, 34.5, 53.5], [-22, -10, 53, 61], [10, 22, 53, 61], [-6, 6, -59, -51], [17, 31, -47, -37], [-6.5, 6.5, -13.5, 1.5], [-4, 4, -25, -17]);
    const free = (x, z) => !NO.some((r) => x > r[0] && x < r[1] && z > r[2] && z < r[3]);

    // ---- 4. ZONA A — FOB VIPER: portale con insegna, hangar, piazzola H, traliccio, tende, torri, container ----
    for (const s of [-1, 1]) { W.box(s * 8.2, 0, 15.9, 0.4, 6.7, 0.4, 'metalD', true); W.box(s * 8.2, 0, 15.9, 0.9, 0.5, 0.9, 'conc', false); W.box(s * 8.2, 6.7, 15.9, 0.3, 0.3, 0.3, 'nAmber', false); }
    W.box(0, 6.35, 15.9, 16.8, 0.3, 0.3, 'metalD', false); W.box(0, 3.7, 15.9, 16.4, 0.12, 0.12, 'metalD', false);
    map_desert_board(c, 0, 0, 5.1, 15.84, PI, 8, false); map_desert_board(c, 0, 0, 5.1, 15.96, 0, 8, false);
    map_desert_board(c, 1, -6.3, 3.9, 27, PI, 3, true); map_desert_board(c, 6, -6.3, 2.3, 27, PI, 3, false);
    map_desert_board(c, 7, 12, 2.2, 53.2, PI, 2.4, true);
    map_desert_hangar(c, 38, 42.5);
    map_desert_heli(c, 39.2, 0.12, 43, 0);
    const hx = -38, hz = 44;
    W.box(hx, 0, hz, 18, 0.16, 18, 'slab', true);
    for (const s of [-1, 1]) { W.box(hx + s * 8.3, 0.16, hz, 0.35, 0.02, 17, 'lineY', false); W.box(hx, 0.16, hz + s * 8.3, 17, 0.02, 0.35, 'lineY', false); W.box(hx + s * 2.2, 0.16, hz, 0.9, 0.02, 6.4, 'lineW', false); }
    W.box(hx, 0.16, hz, 4.4, 0.02, 0.9, 'lineW', false); W.add('lineW', g.ring, hx, 0.175, hz, 0, 0, 0);
    for (let i = 0; i < 8; i++) W.box(hx + Math.sin(i * 0.785) * 8.8, 0.16, hz + Math.cos(i * 0.785) * 8.8, 0.3, 0.2, 0.3, 'nGreen', false);
    map_desert_board(c, 1, -26.6, 2.4, 44, HP, 2.6, true);
    W.inst('post', -48.5, 0, 34, 0, 0, 0, 0.05, 5.2, 0.05); W.add('red', g.cone, -48.4, 5, 34, 0.4, 0, -HP, 0.28, 1.5, 0.28);
    map_desert_mast(c, -14, 40);
    map_desert_tent(c, -16, 57, HP, 'nGreen'); map_desert_tent(c, 16, 57, HP, 'nGreen');
    map_desert_tower(c, -57, 31, 0); map_desert_tower(c, 56, 24, 0);
    map_desert_hesco(c, -21, 17, 18, 0, 2); map_desert_hesco(c, 21, 17, 18, 0, 2); map_desert_hesco(c, 48, 17, 8, 0, 2); map_desert_hesco(c, -40, 16, 6, 0, 2);
    map_desert_hesco(c, -20, 48, 6, 0, 2); map_desert_hesco(c, 20, 48, 6, 0, 2);
    map_desert_container(c, -50, 0, 18, HP, 'teal', false); map_desert_container(c, -50, 0, 20.6, HP, 'rust', false); map_desert_container(c, -50, 2.6, 18, HP, 'olive', false);
    map_desert_container(c, -40, 0, 23, 0, 'olive', true); map_desert_container(c, -44, 0, 29, HP, 'rust', true);
    kit.stairs(-50, 0, 23.6, 1.4, 2.6, 3.6, 0, m.metal); kit.nav(-50, 2.6, 20.6);
    map_desert_canopy(c, 19, 37, 5, 6, 0.1, 'camo'); map_desert_canopy(c, 53, 39, 5, 6, 0, 'camo'); map_desert_canopy(c, -33, 33, 4.4, 4.4, 0.2, 'camo'); map_desert_canopy(c, -53, 44, 4.4, 4.4, -0.1, 'camo');
    map_desert_crates(c, 19, 37, 'olive'); map_desert_crates(c, 53, 39, 'wood');
    W.inst('post', 3.6, 0, 32.4, 0, 0, 0, 0.05, 9, 0.05); W.box(4.35, 7.8, 32.4, 1.4, 0.9, 0.03, 'stripe', false);
    for (let i = 0; i < 4; i++) { W.box(25 + i * 1.3, 0, 60.8, 1.15, 2.3, 1.15, 'teal', true); W.box(25 + i * 1.3, 2.3, 60.8, 1.25, 0.08, 1.25, 'lineW', false); }
    W.box(11.5, 0, 46.8, 2.2, 1.3, 1.2, 'olive', true); W.box(11.5, 1.3, 46.8, 0.3, 0.6, 0.3, 'metalD', false); W.add('olive', g.cyl, 13.6, 0.6, 47.6, 0, 0, HP, 0.6, 2.2, 0.6, true);
    map_desert_palm(c, -5.6, 32.6, 6.5); map_desert_palm(c, 5.6, 32.6, 7.2);

    // ---- 5. ZONA B — CENTRO: checkpoint, ponte sul wadi, argini, tubi, porta ad arco del villaggio ----
    W.box(-7.5, 0, 13.6, 2.4, 2.5, 2.4, 'mudC', true); W.box(-7.5, 2.5, 13.6, 3.0, 0.14, 3.0, 'corr', false); W.box(-6.28, 1.2, 13.6, 0.05, 0.8, 1.4, 'glass', false);
    W.box(-5.9, 0, 12.6, 0.3, 1.1, 0.3, 'lineY', true); W.beam('red', -5.9, 1.1, 12.6, 1.5, 2.6, 12.6, 0.12);
    map_desert_board(c, 5, 5.4, 2.0, 12.4, PI, 2.4, true);
    map_desert_jersey(c, -2.6, 18.5, HP); map_desert_jersey(c, 2.6, 21, HP); map_desert_jersey(c, -6.5, 5, 0.2); map_desert_jersey(c, 6.5, 11, -0.2);
    W.box(0, 0, -6, 12, 0.35, 10, 'conc', true); W.box(0, 0.35, -6, 8, 0.02, 10, 'asph', false);
    for (const s of [-1, 1]) {
      W.box(s * 5.7, 0.35, -6, 0.5, 1.0, 10, 'concD', true); W.box(s * 5.7, 1.35, -6, 0.7, 0.1, 10.2, 'conc', false);
      for (const z of [-10.8, -1.2]) { W.box(s * 5.7, 0, z, 0.8, 1.7, 0.8, 'conc', true); W.box(s * 5.7, 1.7, z, 0.25, 0.25, 0.25, 'nAmber', false); }
      for (let x = 13; x <= 58; x += 9) if (Math.abs(x - 45) > 5) for (const z of [-1.2, -10.8]) {
        W.add('sandDark', g.sph, s * x, 0, z, R(-0.1, 0.1), 0, 0, 4.6, R(0.45, 0.7), 1.4); kit.collider(s * x - 3.2, 0, z - 0.7, s * x + 3.2, 0.4, z + 0.7);
      }
      map_desert_nest(c, s * 10, 1.0, 0, s < 0);
      map_desert_bagwall(c, s * 9, 0, -12.4, 3.2, 0, 5, 2);
      W.box(s * 9.5, 0, -14.5, 8, 3.2, 0.6, 'mudO', true); W.box(s * 9.5, 3.2, -14.5, 8.3, 0.2, 0.8, 'brick', false);
      map_desert_sign(c, 11, s * 9.5, 1.55, -14.17, 0, 2.4, 2.0);
      map_desert_sign(c, s < 0 ? 12 : 13, s * 11, 1.7, -14.83, PI, s < 0 ? 1.0 : 0.75, 1.25);
      map_desert_palm(c, s * 13.2, -17, 7 + s * 0.6);
    }
    kit.ramp(0, 0, 0.1, 12, 2.2, 0.35, 0, m.asph); kit.ramp(0, 0, -12.1, 12, 2.2, 0.35, PI, m.asph);
    W.add('conc', g.cyl, -19.5, 0.95, -6.5, 0.3, 0, HP, 0.95, 3.2, 0.95, true); W.add('conc', g.cyl, -19, 0.95, -4.2, 0.1, 0, HP, 0.95, 3.2, 0.95, true); W.add('conc', g.cyl, 25, 0.95, -5.5, -0.4, 0, HP, 0.95, 3.2, 0.95, true);
    W.add('mudO', map_desert_archGeo(T, 11, 6.8, 6, 5.4, 1.2), 0, 0, -14.5, 0, 0, 0);
    kit.collider(-5.5, 0, -15.1, -3, 6.8, -13.9); kit.collider(3, 0, -15.1, 5.5, 6.8, -13.9); kit.collider(-3, 5.4, -15.1, 3, 6.8, -13.9);
    for (let i = -4; i <= 4; i++) W.box(i * 1.25, 6.8, -14.5, 0.7, 0.55, 1.0, 'brick', false);
    map_desert_board(c, 8, 0, 6.0, -13.86, 0, 2.4, false);
    map_desert_container(c, 53, 0, 0.3, HP, 'teal', true); map_desert_bagwall(c, -30, 0, 0.6, 3.3, 0, 5, 2); map_desert_bagwall(c, 30, 0, 0.8, 3.3, 0, 5, 2);
    map_desert_canopy(c, 13, 0.6, 4.4, 4, 0, 'camo'); map_desert_canopy(c, -41, 0.5, 4.4, 4.4, 0.15, 'camo');

    // ---- 6. ZONA C — VILLAGGIO: fontana, moschea e minareto, bazar a righe, oasi con pozzo, tenda rossa ----
    W.add('brick', g.cyl, 0, 0, -21, 0, 0, 0, 3.2, 0.8, 3.2); W.add('teal', g.cyl, 0, 0.78, -21, 0, 0, 0, 2.8, 0.06, 2.8); kit.collider(-3.2, 0, -24.2, 3.2, 0.8, -17.8);
    W.add('conc', g.cyl, 0, 0.8, -21, 0, 0, 0, 0.45, 1.8, 0.45); W.add('mudT', g.cyl, 0, 2.5, -21, 0, 0, 0, 1.3, 0.18, 1.3); W.add('conc', g.sph, 0, 3.0, -21, 0, 0, 0, 0.35);
    kit.collider(-0.5, 0.8, -21.5, 0.5, 3.2, -20.5);
    map_desert_mosque(c, 22, -42);
    map_desert_stall(c, -41.5, -17, HP); map_desert_stall(c, -49.5, -21, -HP); map_desert_stall(c, -41.5, -27, HP); map_desert_stall(c, -49.5, -33, -HP);
    map_desert_stall(c, -9, -18.5, PI); map_desert_stall(c, 10, -25.5, 0);
    map_desert_tent(c, 0, -55, HP, 'nAmber'); map_desert_tower(c, 54, -30, PI);
    map_desert_hesco(c, -20, -49.5, 6, 0, 2); map_desert_hesco(c, 20, -50.5, 6, 0, 2); map_desert_twall(c, -30, -57, 3, HP); map_desert_twall(c, 31, -52, 3, HP);
    map_desert_canopy(c, -45.5, -24, 3.6, 6, 0.05, 'stripe'); map_desert_canopy(c, 33, -34, 4.4, 4.4, -0.1, 'stripe'); map_desert_canopy(c, -22, -38, 4.4, 4.4, 0.2, 'stripe'); map_desert_canopy(c, 45, -36, 5, 4.4, 0, 'stripe');
    for (const [x, z, h] of [[40, -13, 7.5], [51, -15, 6.4], [47, -25.5, 8], [38, -20, 6.8], [53, -21, 7.4], [43, -29, 6.2], [-36, -1, 7], [19, -0.6, 6.6], [-55, -14, 7.6], [-18, -11.6, 6.9], [33, -11.6, 7.2], [-12, -47.5, 6.5]]) map_desert_palm(c, x, z, h);
    W.add('brick', g.cyl, 46, 0, -20, 0, 0, 0, 1.2, 0.9, 1.2); W.add('rubber', g.cyl, 46, 0.86, -20, 0, 0, 0, 0.95, 0.06, 0.95); kit.collider(44.8, 0, -21.2, 47.2, 0.9, -18.8);
    for (const s of [-1, 1]) W.inst('log', 46 + s * 1.1, 0, -20, 0, 0, 0, 0.07, 2.4, 0.07);
    W.beam('woodD', 44.7, 2.4, -20, 47.3, 2.4, -20, 0.12); W.beam('metalD', 46, 2.4, -20, 46, 1.3, -20, 0.03); W.inst('jar', 46, 0.95, -20, 0, 0, 0, 0.8);
    W.box(40, 0, -27, 5, 1.3, 0.6, 'mudO', true, 0.03); W.box(42.3, 0, -29.2, 0.6, 1.0, 4, 'brick', true); W.box(49, 0, -11.5, 4.5, 1.1, 0.6, 'mudT', true, -0.04);
    W.box(-30, 0, -34.5, 0.6, 1.2, 5, 'mudT', true, 0.04); W.box(-9.5, 0, -27.5, 4.4, 1.1, 0.6, 'brick', true, 0.3); W.box(30, 0, -15.5, 4.8, 1.2, 0.6, 'mudO', true, -0.05);
    map_desert_cable(c, -16, 6.5, -22, 17, 6.5, -22, 1.2);
    for (let i = 1; i < 16; i++) { const t = i / 16; W.box(-16 + 33 * t, 6.5 - 4.8 * t * (1 - t) - 0.42, -22, 0.4, 0.4, 0.02, i % 2 ? 'stripe' : 'teal', false); }
    map_desert_cable(c, -16, 9.8, -30, 8, 9.8, -34, 1.0);
    for (let i = 1; i < 10; i++) { const t = i / 10; W.box(-16 + 24 * t, 9.8 - 4 * t * (1 - t) - 0.5, -30 - 4 * t, 0.6, 0.8, 0.02, i % 3 ? 'mudC' : 'stripe', false, 0.165); }
    W.inst('barrel', -10, 0, -33, 0, 0, 0, 1); W.box(-10, 0.86, -33, 0.42, 0.14, 0.42, 'nAmber', false); kit.collider(-10.3, 0, -33.3, -9.7, 0.9, -32.7);

    // ---- 7. COPERTURE su tutte le corsie: casse, fusti, jersey, sacchi, rocce, gomme, pallet ----
    for (const [x, z, mk] of [[-10, 30, 'wood'], [11, 31, 'olive'], [-33, 33, 'wood'], [26, 34, 'woodD'], [-6, 20, 'olive'], [-53, 44, 'wood'], [52, 36, 'olive'], [50, 30, 'wood'], [-41, 0.5, 'wood'],
      [-22, 1, 'woodD'], [22, 1, 'olive'], [-12, -20, 'wood'], [13, -29.5, 'woodD'], [-50, -30, 'wood'], [-34, -15.5, 'woodD'], [33, -34, 'wood'], [-22, -38, 'woodD'], [10, -48.5, 'woodD'], [-34, 9, 'olive'], [30, 9.5, 'wood'],
      [56, -44, 'wood'], [-56, -40, 'woodD'], [13, 0.6, 'olive'], [5.6, 23, 'wood'], [-14, 9.6, 'woodD'], [46, 9.5, 'olive'], [-50, 6, 'wood'], [39.5, -6.5, 'woodD']]) map_desert_crates(c, x, z, mk);
    for (const [x, z, n] of [[27, 32, 4], [-27.5, 54, 6], [50, 52, 4], [-50, 57, 4], [9, -31, 4], [-39, -38.5, 4], [34, 14.5, 4], [-18, 14, 4], [-57, 10, 6], [58, -10, 4], [8.5, 50, 4], [30, -57, 4], [-26, -11, 4], [36, -15, 4]]) map_desert_barrels(c, x, z, n);
    for (const [x, z, r] of [[54, 46, 0], [-55, 50, 0.3], [30, 2, HP], [42, -14, HP], [48, -16, HP + 0.3], [-28, 10, 0.1], [24, 6, -0.15], [-16, -30, HP], [16, -32, HP], [-55, -24, 0.2], [57, 12, 0.1], [-36, -9.5, HP]]) map_desert_jersey(c, x, z, r);
    for (const [x, z, len, r] of [[-44, -13.5, 3.3, 0], [44, 14.5, 3.3, 0], [-46, 33, 3.3, HP], [0, 33.5, 2.6, 0], [-28, -36, 3.3, 0], [28, -35, 3.3, 0], [0, -29, 4, 0], [-56, -6, 2.6, HP], [50, 20.5, 3.3, 0], [-8, -48, 2.6, HP]]) map_desert_bagwall(c, x, 0, z, len, r, 5, 2);
    const rock = (x, z, s) => {
      W.inst('rock', x, s * 0.35, z, R(0, 6), R(-0.2, 0.2), 0, s * 1.25, s, s * 1.05); W.inst('rock', x + s * 0.9, s * 0.15, z + s * 0.5, R(0, 6), 0, 0, s * 0.6, s * 0.5, s * 0.7);
      kit.collider(x - s * 0.9, 0, z - s * 0.8, x + s * 0.9, s * 1.2, z + s * 0.8);
    };
    for (const [x, z, s] of [[-32, -6, 1.3], [-14, -7, 1.1], [15, -5, 1.2], [31, -7, 1.4], [-58, -7, 2.2], [59, -5, 2.3], [-49, -6.5, 1.5], [50, -6.5, 1.6], [-59, -20, 1.8], [59, -38, 1.7], [-58, -58, 2], [58, -58, 2.1], [-59, 14, 1.6], [59, 16, 1.5], [36, -40, 1.1], [-54, -44, 1.2]]) rock(x, z, s);
    for (const [x, z] of [[-36, 30], [24, 14.5], [47, 26], [-52, 12], [38, -37], [-13, -34]]) for (let i = 0; i < 4; i++) W.inst('tire', x + R(-0.15, 0.15), 0.14 + i * 0.28, z + R(-0.15, 0.15), R(0, 3), 0, HP, 0.85);
    for (const [x, z] of [[-30, 20], [10, 28], [48, 56], [-44, 12], [34, -18], [-20, -15.5], [20, -36], [-52, -52]]) { W.box(x, 0, z, 1.2, 0.14, 1.0, 'wood', false, R(0, 3)); W.box(x + 0.1, 0.14, z, 1.2, 0.14, 1.0, 'woodD', false, R(0, 3)); }
    const scat = (key, n, x0, x1, z0, z1, s0, s1, flat) => {
      for (let i = 0; i < n; i++) {
        const x = R(x0, x1), z = R(z0, z1), s = R(s0, s1);
        if (free(x, z)) map_desert_inst(c, key, x, 0, z, R(0, 6.28), flat ? 0 : R(-0.3, 0.3), 0, s, s * R(0.6, 1.1), s);
      }
    };
    scat('peb', 260, -62, 62, -62, 62, 0.3, 1.1); scat('peb', 130, -62, 62, -10.5, -1.5, 0.4, 1.6); scat('tuft', 320, -62, 62, -62, 62, 0.7, 1.6, true);
    scat('tuft', 130, -62, 62, -11, -1, 0.8, 1.8, true); scat('brick', 220, -52, 52, -58, -12, 0.8, 1.3); scat('bush', 40, -62, 62, -12, 2, 0.8, 1.7);
    scat('bush', 36, 36, 56, -34, -10, 0.7, 1.5); scat('bag', 60, -60, 60, 16, 62, 0.9, 1.1, true); scat('jar', 30, -52, -38, -40, -14, 0.9, 1.7, true);

    // ---- 8. PALI CON CAVI lungo la strada principale e la via del villaggio ----
    for (const line of [[[-58, 14.6], [-30, 14.6], [-9.8, 14.6], [9.5, 14.6], [34.5, 14.6], [58, 14.6]], [[-58, -30.3], [-34, -30.3], [-12, -30.3], [12, -30.3], [36, -30.3], [58, -30.3]]])
      line.forEach((p, i) => {
        map_desert_pole(c, p[0], p[1]);
        if (i) for (const s of [-0.9, 0.9]) map_desert_cable(c, line[i - 1][0], 7.4, line[i - 1][1] + s, p[0], 7.4, p[1] + s, 0.7);
      });
    map_desert_cable(c, -9.8, 7.3, 14.6, -14, 12, 40, 1.5); map_desert_cable(c, -12, 7.3, -30.3, -16, 9.8, -24, 0.5); map_desert_cable(c, 12, 7.3, -30.3, 17, 9.8, -24, 0.5);

    // ---- 9. LUCI VERE (6): comando, hangar, mercato, fuoco nel fusto, casa del tè, portale moschea ----
    kit.light(0, 2.6, 40, 0xbfe0c8, 2.4, 14); kit.light(38, 6.5, 42.5, 0xffe0b2, 3, 26); kit.light(-24, 2.6, -24, 0xffb870, 2.4, 14);
    kit.light(-10, 1.6, -33, 0xff9a44, 3, 14); kit.light(0, 2.6, -40, 0xffc285, 2.2, 14); kit.light(22, 3, -36.5, 0x66d6d0, 2.2, 12);

    // ---- 10. SPAWN (10 per squadra, al coperto) e NAV POINT ----
    for (const [x, z] of [[-26, 58], [-8, 58], [0, 60], [8, 58], [26, 58], [-4, 50], [4, 50], [-24, 50.5], [24, 51], [-30, 58]]) { kit.spawn('blue', x, z); kit.nav(x, 0, z); }
    for (const [x, z] of [[-26, -57], [-12, -57], [-8, -50], [8, -50], [12, -57], [26, -57], [-30, -52], [30, -56], [0, -48.5], [-18, -52.5]]) { kit.spawn('red', x, z); kit.nav(x, 0, z); }
    for (const [x, y, z] of [[0, 0.35, -6], [0, 0, 8], [0, 0, 24], [0, 0, -14.5], [0, 0, -28], [-45, 0, 8], [-45, 0, -6], [-45, 0, -26], [-45, 0, -34], [45, 0, 8], [45, 0, -6], [45, 0, -22], [45, 0, -34],
      [-14, 0, 6], [14, 0, 4.5], [-12, 0, -33.5], [12, 0, -33.5], [-34, 0, 17], [36, 0, 17], [57, 0, 17], [-12, 0, 32], [12, 0, 40], [-27, 0, 40], [28, 0, 42.5], [48, 0, 42.5], [38, 0.12, 29], [38, 0.12, 56]]) kit.nav(x, y, z);

    map_desert_flush(c);
  }
});

