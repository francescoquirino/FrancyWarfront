// ===================== HUD =====================
if (typeof window !== 'undefined' && !window.WF_MODE) window.WF_MODE = 'battle';

const HUD = {
  el: id => document.getElementById(id),
  hurtT: 0, hmT: 0,
  _lastHp: -1,
  _lastMag: -1,
  _lastRes: -1,
  _lastWpn: '',
  _lastBlue: -1,
  _lastRed: -1,
  _maxMagMap: {},
  _pulse(el) {
    if (!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  },
  hurt() { this.hurtT = 1; },
  hurtFrom(pos) {
    const P = G.player; const a = Math.atan2(pos.x - P.pos.x, pos.z - P.pos.z);
    const rel = a - Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw));
    const ind = this.el('dmgdir'); ind.style.transform = `translate(-50%,-50%) rotate(${-rel}rad)`; ind.style.opacity = 1;
    clearTimeout(this._dd); this._dd = setTimeout(() => ind.style.opacity = 0, 900);
  },
  hitmarker(kill) { const h = this.el('hitm'); h.className = kill ? 'kill show' : 'show'; clearTimeout(this._hm); this._hm = setTimeout(() => h.className = '', kill ? 350 : 140); },
  feed(k, v, w) {
    const f = this.el('feed'); const d = document.createElement('div');
    const isMe = k === 'Francy' || v === 'Francy';
    d.className = 'fi' + (isMe ? ' me' : '');
    d.innerHTML = `<b>${k}</b> <span>⌖ [${w}] ▸</span> <b>${v}</b>`;
    f.prepend(d); while (f.children.length > 6) f.lastChild.remove();
    setTimeout(() => d.remove(), 6000);
  },
  dead(on, killer) { const d = this.el('deadscr'); d.style.display = on ? 'flex' : 'none'; if (on) this.el('deadby').textContent = killer ? `Abbattuto da ${killer}` : 'Sei stato abbattuto'; },
  banner(title, sub) {
    const b = this.el('banner'); this.el('btitle').textContent = title; this.el('bsub').textContent = sub || '';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  },
  fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  update(dt) {
    const P = G.player;
    const hpVal = Math.max(0, Math.ceil(P.hp));
    const isLowHp = P.hp < 35;
    const hpBar = this.el('hpbar');
    const hpNum = this.el('hpnum');
    const blPanel = this.el('bl');

    hpBar.style.width = Math.max(0, P.hp) + '%';
    hpBar.style.background = isLowHp ? '#ef4444' : '#5fd4ff';
    hpNum.textContent = hpVal;
    if (blPanel) blPanel.classList.toggle('low-hp', isLowHp);
    if (this._lastHp !== -1 && this._lastHp !== hpVal) this._pulse(hpNum);
    this._lastHp = hpVal;

    this.hurtT = Math.max(0, this.hurtT - dt * 1.6);
    const low = P.alive ? Math.max(0, (40 - P.hp) / 40) * 0.6 : 0;
    this.el('vign').style.opacity = Math.max(this.hurtT * 0.8, low);

    if (WPN.current) {
      const w = WPN.current(), a = WPN.ammo ? WPN.ammo() : { mag: 0, reserve: 0 };
      const wName = w ? w.name : '';
      this.el('wname').textContent = wName;

      const ammoEl = this.el('ammo');
      if (this._lastMag !== a.mag || this._lastRes !== a.reserve || this._lastWpn !== wName) {
        ammoEl.innerHTML = `${a.mag}<small> / ${a.reserve}</small>`;
        if (this._lastMag !== -1 && this._lastMag !== a.mag && this._lastWpn === wName) {
          this._pulse(ammoEl);
        }
        const knownMax = Math.max(
          this._maxMagMap[wName] || 0,
          (w && (w.mag || w.magSize || w.clip || w.ammo)) || 0,
          a.mag,
          1
        );
        this._maxMagMap[wName] = knownMax;

        ammoEl.classList.toggle('empty-ammo', a.mag === 0);
        ammoEl.classList.toggle('low-ammo', a.mag > 0 && a.mag <= Math.max(2, Math.floor(knownMax * 0.25)));

        const bulEl = this.el('bullets');
        if (bulEl) {
          const slots = Math.min(30, knownMax);
          const activeSlots = knownMax > 30 ? Math.ceil((a.mag / knownMax) * slots) : a.mag;
          const isLowMag = a.mag > 0 && a.mag <= Math.max(2, Math.floor(knownMax * 0.25));
          let html = '';
          for (let i = 0; i < slots; i++) {
            const cls = i < activeSlots ? (isLowMag ? 'low' : '') : 'spent';
            html += `<i class="${cls}"></i>`;
          }
          bulEl.innerHTML = html;
        }

        this._lastMag = a.mag;
        this._lastRes = a.reserve;
        this._lastWpn = wName;
      }

      const sc = WPN.scopeActive && WPN.scopeActive();
      this.el('scope').style.display = sc ? 'block' : 'none';
      const adsK = WPN.adsAmount ? WPN.adsAmount() : (WPN.isADS && WPN.isADS() ? 1 : 0);
      this.el('cross').style.opacity = adsK > 0.3 ? 0 : 1;
      this.el('adsdot').style.display = 'none'; // niente croce extra: c'è già il punto rosso del mirino
      const sp = WPN.spreadNow ? WPN.spreadNow() : 0.02;
      this.el('cross').style.setProperty('--g', (8 + sp * 400) + 'px');
    }

    this.el('tmatch').textContent = this.fmt(MAIN.matchLeft);
    this.el('tmap').textContent = MAIN.mode === 'battle' ? 'Battaglia normale' : 'Cambio mappa ' + this.fmt(MAIN.mapLeft);

    const sbEl = this.el('sblue'), srEl = this.el('sred');
    sbEl.textContent = G.score.blue;
    srEl.textContent = G.score.red;
    if (this._lastBlue !== -1 && this._lastBlue !== G.score.blue) this._pulse(sbEl);
    if (this._lastRed !== -1 && this._lastRed !== G.score.red) this._pulse(srEl);
    this._lastBlue = G.score.blue;
    this._lastRed = G.score.red;

    this.el('mapname').textContent = G.map ? `${MAIN.mapIndex + 1}/${MAIN.order.length} · ${G.map.def.name}` : '';
    this.el('kd').textContent = `Uccisioni ${P.kills}  ·  Morti ${P.deaths}` + (G.godMode ? '  ·  IMMORTALE' : '');
    const godPill = this.el('god-pill');
    if (godPill) godPill.classList.toggle('on', !!G.godMode);

    // minimappa
    this.minimap();
  },
  minimap() {
    const c = this.el('mini'); if (!c || !G.map) return;
    const ctx = c.getContext('2d'), S = c.width, P = G.player, R = 45;
    ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, 7); ctx.clip();
    ctx.fillStyle = 'rgba(8, 14, 18, 0.72)'; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(95, 212, 255, 0.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.28, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, S / 2); ctx.lineTo(S, S / 2); ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, S); ctx.stroke();
    ctx.translate(S / 2, S / 2); ctx.rotate(P.yaw); const k = (S / 2) / R;
    // edifici (collider alti) disegnati una volta
    if (!this._mm || this._mmMap !== G.map) this._buildMini();
    ctx.drawImage(this._mm, -(P.pos.x - this._mmB.minX) * k * this._mmK, -(P.pos.z - this._mmB.minZ) * k * this._mmK, this._mm.width * k * this._mmK, this._mm.height * k * this._mmK);
    for (const b of G.bots) {
      if (!b.alive) continue;
      const vis = b.team === 'blue' || (G.time - (b.lastShot || -99) < 1.5);
      if (!vis) continue;
      const x = (b.pos.x - P.pos.x) * k, z = (b.pos.z - P.pos.z) * k;
      ctx.fillStyle = b.team === 'blue' ? '#3b82f6' : '#ef4444'; ctx.beginPath(); ctx.arc(x, z, 3.4, 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.moveTo(S / 2, S / 2 - 7); ctx.lineTo(S / 2 - 5, S / 2 + 5); ctx.lineTo(S / 2 + 5, S / 2 + 5); ctx.fill();
  },
  _buildMini() {
    const b = G.map.bounds, K = 2, w = Math.ceil((b.maxX - b.minX) * K), h = Math.ceil((b.maxZ - b.minZ) * K);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = 'rgba(180, 210, 225, 0.35)';
    for (const box of G.colliders) { if (box.max.y < 1.5 || box.max.x - box.min.x > 300) continue; x.fillRect((box.min.x - b.minX) * K, (box.min.z - b.minZ) * K, (box.max.x - box.min.x) * K, (box.max.z - box.min.z) * K); }
    this._mm = c; this._mmMap = G.map; this._mmB = b; this._mmK = 1 / K;
  },
  scoreboard() {
    const all = [G.player, ...G.bots].sort((a, b) => (b.kills || 0) - (a.kills || 0));
    const row = e => `<tr class="${e.team}${e.isPlayer ? ' me' : ''}"><td>${e.name}</td><td>${e.kills || 0}</td><td>${e.deaths || 0}</td></tr>`;
    return `<table><tr><th>Soldato</th><th>Uccisioni</th><th>Morti</th></tr>${all.slice(0, 14).map(row).join('')}</table>`;
  },
};
