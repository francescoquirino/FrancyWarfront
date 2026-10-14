// src/30_audio.js
// SFX — suoni 100% procedurali in WebAudio (versione 3, "da film").
// API: init, play, update, music, ambience, setVolume.

const SFX = (() => {
    const SPEED_OF_SOUND = 343;   // m/s: ritardo degli spari lontani
    const BULLET_SPEED = 680;     // m/s medi: il "crack" supersonico arriva prima del "boom"
    const MAX_VOICES = 24;
    const DRY_3D = 1.5;
    const DRY_2D = 2.0;           // il suono del giocatore e' piu' forte
    const AMB_LEVEL = 0.2;

    let ctx = null;
    let masterGain = null;
    let compressor = null;
    let limiter = null;
    let softClip = null;
    let preDelay = null;
    let convolver = null;
    let reverbGain = null;
    let listener = null;

    let whiteBuf = null;
    let pinkBuf = null;
    let brownBuf = null;
    let boomCurve = null;

    let masterVolume = 0.8;
    const listenerPos = { x: 0, y: 0, z: 0 };
    const voices = [];

    const musicState = { active: false, nodes: [], gain: null };
    const ambienceState = { type: null, nodes: [], timers: [], gain: null, token: 0 };
    let pendingMusic = false;
    let pendingAmbience = null;

    const rnd = (a, b) => a + Math.random() * (b - a);

    // ------------------------------------------------------------------
    // INIT: grafo master (volume -> compressore -> limiter -> soft clip) + riverbero
    // ------------------------------------------------------------------
    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
            ctx = new AC({ latencyHint: 'interactive' });
        } catch (e) {
            ctx = null;
            return;
        }
        listener = ctx.listener;

        masterGain = ctx.createGain();
        masterGain.gain.value = masterVolume;

        // Compressore "colla": tiene insieme gli strati
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.knee.value = 18;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.18;

        // Limiter: non si supera mai la soglia
        limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -3;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.08;

        // Soft clip finale: lineare fino a 0.8, poi curva morbida che non supera 1.0
        softClip = ctx.createWaveShaper();
        softClip.curve = makeSoftClipCurve();

        masterGain.connect(compressor);
        compressor.connect(limiter);
        limiter.connect(softClip);
        softClip.connect(ctx.destination);

        // Riverbero con pre-delay
        preDelay = ctx.createDelay(0.5);
        preDelay.delayTime.value = 0.03;
        convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(1.8);
        reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.8;
        preDelay.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);

        // Buffer di rumore generati UNA volta
        whiteBuf = createNoiseBuffer('white', 2.5);
        pinkBuf = createNoiseBuffer('pink', 3.0);
        brownBuf = createNoiseBuffer('brown', 3.0);
        boomCurve = makeShaperCurve(2.2);

        if (pendingMusic) { pendingMusic = false; music(true); }
        if (pendingAmbience) { const a = pendingAmbience; pendingAmbience = null; ambience(a); }
    }

    function makeSoftClipCurve() {
        const n = 4096;
        const c = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / (n - 1) - 1;
            const a = Math.abs(x);
            const y = a < 0.8 ? a : 0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2);
            c[i] = x < 0 ? -y : y;
        }
        return c;
    }

    function makeShaperCurve(k) {
        const n = 2048;
        const c = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / (n - 1) - 1;
            c[i] = Math.tanh(k * x);
        }
        return c;
    }

    // Impulso: rumore stereo che decade (~1.8 s), si scurisce col tempo, con prime riflessioni
    function createImpulseResponse(duration) {
        const rate = ctx.sampleRate;
        const length = Math.floor(rate * duration);
        const impulse = ctx.createBuffer(2, length, rate);
        const early = [0.022, 0.041, 0.067, 0.094, 0.131];
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            let lp = 0;
            for (let i = 0; i < length; i++) {
                const t = i / rate;
                const a = 0.55 + 0.42 * Math.min(1, t / 1.2);
                lp = a * lp + (1 - a) * (Math.random() * 2 - 1);
                const fadeIn = Math.min(1, i / (rate * 0.004));
                data[i] = lp * Math.exp(-t * 3.6) * fadeIn * 1.8;
            }
            early.forEach((et, k) => {
                const idx = Math.floor((et + ch * 0.0037 + k * 0.0011) * rate);
                if (idx < length) data[idx] += (k % 2 ? -1 : 1) * (0.55 - k * 0.08);
            });
        }
        return impulse;
    }

    // Rumore bianco/rosa/marrone, ripetibile senza click (crossfade della coda), normalizzato in RMS
    function createNoiseBuffer(type, duration) {
        const rate = ctx.sampleRate;
        const L = Math.floor(rate * duration);
        const N = Math.floor(rate * 0.1);
        const raw = new Float32Array(L + N);
        if (type === 'white') {
            for (let i = 0; i < raw.length; i++) raw[i] = Math.random() * 2 - 1;
        } else if (type === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < raw.length; i++) {
                const w = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + w * 0.0555179;
                b1 = 0.99332 * b1 + w * 0.0750759;
                b2 = 0.96900 * b2 + w * 0.1538520;
                b3 = 0.86650 * b3 + w * 0.3104856;
                b4 = 0.55000 * b4 + w * 0.5329522;
                b5 = -0.7616 * b5 - w * 0.0168980;
                raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
                b6 = w * 0.115926;
            }
        } else {
            let last = 0;
            for (let i = 0; i < raw.length; i++) {
                const w = Math.random() * 2 - 1;
                last = (last + 0.02 * w) / 1.02;
                raw[i] = last;
            }
        }
        const buffer = ctx.createBuffer(1, L, rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < L; i++) {
            if (i < N) {
                const w = i / N;
                data[i] = raw[i] * w + raw[L + i] * (1 - w);
            } else {
                data[i] = raw[i];
            }
        }
        let sum = 0;
        for (let i = 0; i < L; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / L) || 1;
        const scale = 0.4 / rms;
        for (let i = 0; i < L; i++) data[i] *= scale;
        return buffer;
    }

    // ------------------------------------------------------------------
    // VOCI: massimo 24, le piu' vecchie vengono troncate
    // ------------------------------------------------------------------
    function setPannerPos(p, x, y, z) {
        if (p.positionX) {
            p.positionX.value = x;
            p.positionY.value = y;
            p.positionZ.value = z;
        } else if (p.setPosition) {
            p.setPosition(x, y, z);
        }
    }

    function airCutoff(dist) {
        if (dist <= 12) return 18000;
        if (dist >= 60) return Math.max(700, 1200 - (dist - 60) * 2.5);
        return 18000 * Math.pow(1200 / 18000, (dist - 12) / 48);
    }

    // dur: durata utile del suono; send: quantita' di riverbero; propagate: ritardo dovuto alla distanza
    function newVoice(dur, pos, volume, send, propagate) {
        const now = ctx.currentTime;
        const is3d = !!pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z);
        let dist = 0;
        if (is3d) {
            const dx = pos.x - listenerPos.x;
            const dy = pos.y - listenerPos.y;
            const dz = pos.z - listenerPos.z;
            dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        const dClamp = Math.min(dist, 260);
        const delay = propagate && is3d ? dClamp / SPEED_OF_SOUND : 0;
        const crackDelay = propagate && is3d ? dClamp / BULLET_SPEED : 0;

        while (voices.length >= MAX_VOICES) voices[0].kill();

        const v = {
            nodes: [],
            out: ctx.createGain(),
            dead: false,
            panner: null,
            timer: 0,
            pos: is3d ? pos : null,
            dist: dist,
            near: !is3d || dist < 25,
            t0: now,
            t: now + delay,
            tc: now + crackDelay
        };
        v.dispose = () => {
            if (v.dead) return;
            v.dead = true;
            clearTimeout(v.timer);
            const i = voices.indexOf(v);
            if (i >= 0) voices.splice(i, 1);
            for (const n of v.nodes) {
                try { if (n.stop) n.stop(); } catch (e) {}
                try { n.disconnect(); } catch (e) {}
            }
        };
        v.kill = () => {
            if (v.dead) return;
            const i = voices.indexOf(v);
            if (i >= 0) voices.splice(i, 1);
            try {
                const t = ctx.currentTime;
                v.out.gain.cancelScheduledValues(t);
                v.out.gain.setValueAtTime(v.out.gain.value, t);
                v.out.gain.linearRampToValueAtTime(0, t + 0.015);
            } catch (e) {}
            clearTimeout(v.timer);
            v.timer = setTimeout(v.dispose, 40);
        };

        const wet = ctx.createGain();
        const dry = ctx.createGain();
        v.nodes.push(v.out, wet, dry);
        dry.gain.value = volume * (is3d ? DRY_3D : DRY_2D);

        if (is3d) {
            const panner = ctx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 6;
            panner.rolloffFactor = 1.2;
            panner.maxDistance = 200;
            setPannerPos(panner, pos.x, pos.y, pos.z);

            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.Q.value = 0.5;
            lp.frequency.value = airCutoff(dist);

            // Da lontano il riverbero domina sul diretto
            wet.gain.value = Math.min(1.4, send * (1 + Math.min(dist, 150) / 80));

            v.out.connect(panner);
            panner.connect(lp);
            lp.connect(dry);
            lp.connect(wet);
            v.panner = panner;
            v.nodes.push(panner, lp);
        } else {
            wet.gain.value = send;
            v.out.connect(dry);
            v.out.connect(wet);
        }
        dry.connect(masterGain);
        if (send > 0.001) wet.connect(preDelay);

        v.timer = setTimeout(v.dispose, (dur + delay + 0.25) * 1000);
        voices.push(v);
        return v;
    }

    // ------------------------------------------------------------------
    // MATTONCINI: rumore, toni, metallo
    // ------------------------------------------------------------------
    function shape(param, t, peak, att, dur) {
        const p = Math.max(peak, 0.0002);
        param.setValueAtTime(0.0001, t);
        param.linearRampToValueAtTime(p, t + att);
        param.exponentialRampToValueAtTime(0.0001, t + att + dur);
    }

    function addNoise(v, buf, rate, t, dur) {
        const s = ctx.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        s.playbackRate.value = rate;
        s.start(t, Math.random() * buf.duration * 0.9);
        s.stop(t + dur + 0.02);
        v.nodes.push(s);
        return s;
    }

    // o: {buf, rate, type, f, f2, pts, q, t, dur, att, peak, dest}
    function noiseBurst(v, o) {
        const t = o.t;
        const att = o.att !== undefined ? o.att : 0.002;
        const src = addNoise(v, o.buf || whiteBuf, o.rate || 1, t, att + o.dur);
        const f = ctx.createBiquadFilter();
        f.type = o.type || 'bandpass';
        f.Q.value = o.q || (f.type === 'bandpass' ? 1 : 0.7);
        f.frequency.setValueAtTime(o.f, t);
        if (o.pts) {
            for (const p of o.pts) f.frequency.exponentialRampToValueAtTime(p[1], t + p[0]);
        } else if (o.f2) {
            f.frequency.exponentialRampToValueAtTime(o.f2, t + att + o.dur);
        }
        const g = ctx.createGain();
        shape(g.gain, t, o.peak, att, o.dur);
        src.connect(f);
        f.connect(g);
        g.connect(o.dest || v.out);
        v.nodes.push(f, g);
        return { filter: f, gain: g };
    }

    // o: {type, f, f2, pts, t, dur, att, peak, drive, dest}; con drive passa da WaveShaper (distorsione morbida)
    function tone(v, o) {
        const t = o.t;
        const att = o.att !== undefined ? o.att : 0.002;
        const osc = ctx.createOscillator();
        osc.type = o.type || 'sine';
        osc.frequency.setValueAtTime(o.f, t);
        if (o.pts) {
            for (const p of o.pts) osc.frequency.exponentialRampToValueAtTime(p[1], t + p[0]);
        } else if (o.f2) {
            osc.frequency.exponentialRampToValueAtTime(o.f2, t + att + o.dur);
        }
        const eg = ctx.createGain();
        const dest = o.dest || v.out;
        const peak = Math.max(o.peak, 0.0002);
        if (o.drive) {
            shape(eg.gain, t, o.drive, att, o.dur);
            const sh = ctx.createWaveShaper();
            sh.curve = boomCurve;
            sh.oversample = '2x';
            const lv = ctx.createGain();
            lv.gain.value = peak;
            osc.connect(eg);
            eg.connect(sh);
            sh.connect(lv);
            lv.connect(dest);
            v.nodes.push(sh, lv);
        } else {
            shape(eg.gain, t, peak, att, o.dur);
            osc.connect(eg);
            eg.connect(dest);
        }
        osc.start(t);
        osc.stop(t + att + o.dur + 0.03);
        v.nodes.push(osc, eg);
        return osc;
    }

    // Colpo metallico: transiente di rumore + parziali inarmonici che risuonano
    function metal(v, t, f, dur, gain, dest) {
        noiseBurst(v, { type: 'bandpass', f: f * 1.3, q: 3.5, t: t, dur: Math.min(dur, 0.03), att: 0.0005, peak: gain, dest: dest });
        const ratios = [1, 2.76, 5.4];
        const amps = [0.5, 0.32, 0.2];
        for (let i = 0; i < 3; i++) {
            tone(v, {
                type: 'sine', f: f * 0.45 * ratios[i], t: t, dur: dur * (1 - 0.25 * i),
                att: 0.0008, peak: gain * amps[i], dest: dest
            });
        }
    }

    // ------------------------------------------------------------------
    // ARMI DA FUOCO: click meccanico + crack supersonico + boom distorto + coda
    // ------------------------------------------------------------------
    const GUNS = {
        rifle: {
            clickF: 2800, clickG: 0.35,
            crackF: 3600, crackQ: 1.1, crackDur: 0.032, crackG: 1.0,
            bodyF: 1300, bodyQ: 0.8, bodyDur: 0.12, bodyG: 0.85,
            boomF0: 130, boomF1: 44, boomDur: 0.24, boomG: 0.95, drive: 1.6, sub: 0,
            tailDur: 1.5, pre: 0.045, tailG: 0.30, tailF: 950, rumble: 0.18,
            taps: [[0, 1], [0.12, 0.55], [0.26, 0.4], [0.48, 0.22]], send: 0.55
        },
        smg: {
            clickF: 3600, clickG: 0.3,
            crackF: 4900, crackQ: 1.5, crackDur: 0.02, crackG: 0.9,
            bodyF: 2400, bodyQ: 1.0, bodyDur: 0.07, bodyG: 0.7,
            boomF0: 155, boomF1: 62, boomDur: 0.11, boomG: 0.75, drive: 1.4, sub: 0,
            tailDur: 1.0, pre: 0.035, tailG: 0.20, tailF: 1500, rumble: 0,
            taps: [[0, 1], [0.09, 0.55], [0.2, 0.3]], send: 0.35
        },
        pistol: {
            clickF: 3200, clickG: 0.35,
            crackF: 4200, crackQ: 1.3, crackDur: 0.024, crackG: 0.9,
            bodyF: 2000, bodyQ: 1.0, bodyDur: 0.09, bodyG: 0.75,
            boomF0: 140, boomF1: 58, boomDur: 0.14, boomG: 0.8, drive: 1.5, sub: 0,
            tailDur: 1.1, pre: 0.04, tailG: 0.24, tailF: 1250, rumble: 0,
            taps: [[0, 1], [0.1, 0.5], [0.22, 0.3]], send: 0.38
        },
        shotgun: {
            clickF: 2000, clickG: 0.4,
            crackF: 2400, crackQ: 0.6, crackDur: 0.06, crackG: 1.1,
            bodyF: 750, bodyQ: 0.5, bodyDur: 0.26, bodyG: 1.3,
            boomF0: 110, boomF1: 32, boomDur: 0.36, boomG: 1.2, drive: 2.1, sub: 1,
            tailDur: 1.8, pre: 0.06, tailG: 0.42, tailF: 700, rumble: 0.35,
            taps: [[0, 1], [0.14, 0.7], [0.31, 0.5], [0.55, 0.3], [0.85, 0.15]], send: 0.7
        },
        sniper: {
            clickF: 2200, clickG: 0.25,
            crackF: 5400, crackQ: 2.0, crackDur: 0.04, crackG: 1.45,
            bodyF: 1500, bodyQ: 0.8, bodyDur: 0.2, bodyG: 1.0,
            boomF0: 140, boomF1: 36, boomDur: 0.32, boomG: 1.1, drive: 1.9, sub: 1,
            tailDur: 2.0, pre: 0.07, tailG: 0.5, tailF: 800, rumble: 0.3,
            taps: [[0, 0.45], [0.26, 1], [0.55, 0.6], [0.92, 0.32], [1.35, 0.16]], send: 0.8
        },
        lmg: {
            clickF: 2400, clickG: 0.35,
            crackF: 3000, crackQ: 1.0, crackDur: 0.035, crackG: 1.05,
            bodyF: 1200, bodyQ: 0.8, bodyDur: 0.16, bodyG: 1.1,
            boomF0: 118, boomF1: 40, boomDur: 0.25, boomG: 1.05, drive: 1.8, sub: 1,
            tailDur: 1.3, pre: 0.05, tailG: 0.32, tailF: 880, rumble: 0.2,
            taps: [[0, 1], [0.13, 0.6], [0.28, 0.4], [0.5, 0.2]], send: 0.5
        }
    };

    function playGun(name, pos, vol, pitch) {
        const p = GUNS[name] || GUNS.rifle;
        const v = newVoice(p.tailDur + p.pre + 0.4, pos, vol, p.send, true);
        const tB = v.t;
        const tC = v.tc + 0.003;

        // 1. Click meccanico (solo se vicino: da lontano non si sente)
        if (v.near) {
            noiseBurst(v, { type: 'highpass', f: p.clickF * pitch, q: 0.7, t: tB, dur: 0.008, att: 0.0005, peak: p.clickG });
            tone(v, { type: 'square', f: p.clickF * 0.6 * pitch, f2: p.clickF * 0.35 * pitch, t: tB, dur: 0.006, att: 0.0003, peak: p.clickG * 0.25 });
        }

        // 2. Crack supersonico (rumore filtrato 2-6 kHz) — arriva prima del boom se lontano
        noiseBurst(v, {
            type: 'bandpass', f: p.crackF * pitch, f2: p.crackF * 0.7 * pitch, q: p.crackQ,
            t: tC, dur: p.crackDur, att: 0.0007, peak: p.crackG
        });

        // 3. Boom del corpo: sinusoide 60-150 Hz con distorsione morbida + soffio di bocca
        noiseBurst(v, {
            buf: whiteBuf, rate: pitch, f: p.bodyF * pitch, f2: p.bodyF * 0.4 * pitch, q: p.bodyQ,
            t: tB, dur: p.bodyDur, att: 0.002, peak: p.bodyG
        });
        noiseBurst(v, { buf: brownBuf, type: 'lowpass', f: 320, q: 0.7, t: tB, dur: p.boomDur, att: 0.003, peak: p.boomG * 0.45 });
        tone(v, { type: 'sine', f: p.boomF0 * pitch, f2: p.boomF1, t: tB, dur: p.boomDur, att: 0.0025, peak: p.boomG, drive: p.drive });
        if (p.sub) {
            tone(v, { type: 'sine', f: 62 * pitch, f2: 28, t: tB, dur: p.boomDur * 1.35, att: 0.006, peak: 0.5, drive: 1.2 });
        }

        // 4. Coda: eco con pre-delay (rimbalzi) + rombo lontano; il riverbero lungo e' nel send
        const t0 = tB + p.pre;
        const tsrc = addNoise(v, pinkBuf, 0.95 * pitch, t0, p.tailDur);
        const tf = ctx.createBiquadFilter();
        tf.type = 'bandpass';
        tf.Q.value = 0.7;
        tf.frequency.setValueAtTime(p.tailF * pitch, t0);
        tf.frequency.exponentialRampToValueAtTime(300, t0 + p.tailDur);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.0001, t0);
        p.taps.forEach((tp, i) => {
            const ts = t0 + tp[0];
            const end = i < p.taps.length - 1 ? t0 + p.taps[i + 1][0] - 0.01 : t0 + p.tailDur;
            tg.gain.setValueAtTime(0.0001, Math.max(t0, ts - 0.003));
            tg.gain.linearRampToValueAtTime(Math.max(p.tailG * tp[1], 0.0002), ts + 0.006);
            tg.gain.exponentialRampToValueAtTime(0.0001, end);
        });
        tsrc.connect(tf);
        tf.connect(tg);
        tg.connect(v.out);
        v.nodes.push(tf, tg);
        if (p.rumble > 0) {
            noiseBurst(v, {
                buf: brownBuf, type: 'lowpass', f: 240, f2: 90, q: 0.7,
                t: tB + 0.02, dur: p.tailDur * 0.7, att: 0.06, peak: p.rumble
            });
        }
    }

    // ------------------------------------------------------------------
    // ESPLOSIONE: crack, sub-bass 30-50 Hz, onda d'urto, boato, detriti
    // ------------------------------------------------------------------
    function playExplosion(pos, vol, pitch) {
        const v = newVoice(3.4, pos, vol, 0.9, true);
        const t = v.t;

        // Crack iniziale + soffio di scoppio
        noiseBurst(v, { type: 'lowpass', f: 7000, f2: 300, q: 0.7, t: t, dur: 0.18, att: 0.001, peak: 1.2 });
        noiseBurst(v, { rate: pitch, f: 1100, f2: 250, q: 0.6, t: t, dur: 0.55, att: 0.004, peak: 0.9 });

        // Sub-bass sismico 30-50 Hz e colpo di pressione
        tone(v, { type: 'sine', f: 52 * pitch, f2: 30, t: t, dur: 2.0, att: 0.02, peak: 1.4, drive: 1.5 });
        tone(v, { type: 'sine', f: 95 * pitch, f2: 40, t: t, dur: 0.35, att: 0.003, peak: 1.1, drive: 2.0 });

        // Onda d'urto: soffio di aria spostata + riflesso grave in ritardo
        noiseBurst(v, { buf: pinkBuf, type: 'lowpass', f: 1800, f2: 120, q: 0.7, t: t + 0.05, dur: 0.6, att: 0.06, peak: 0.8 });
        tone(v, { type: 'sine', f: 64 * pitch, f2: 28, t: t + 0.22, dur: 0.6, att: 0.04, peak: 0.6, drive: 1.2 });

        // Boato di rumore marrone
        noiseBurst(v, {
            buf: brownBuf, rate: 0.85 * pitch, type: 'lowpass', f: 520, f2: 70, q: 0.7,
            t: t, dur: 2.8, att: 0.05, peak: 1.2
        });

        // Detriti e crepitio che ricadono
        const dsrc = addNoise(v, whiteBuf, pitch, t, 2.9);
        const df = ctx.createBiquadFilter();
        df.type = 'bandpass';
        df.Q.value = 1.6;
        df.frequency.value = 2200;
        const dg = ctx.createGain();
        dg.gain.setValueAtTime(0.0001, t);
        let tt = t + 0.25;
        for (let i = 0; i < 26; i++) {
            const gap = 0.035 + Math.random() * (0.05 + i * 0.012);
            if (tt > t + 2.7) break;
            const dec = Math.min(0.02 + Math.random() * 0.03, gap - 0.006);
            const amp = (0.12 + Math.random() * 0.3) * Math.max(0.1, 1 - (tt - t) / 3.2);
            df.frequency.setValueAtTime(900 + Math.random() * 4200, tt - 0.002);
            dg.gain.setValueAtTime(0.0001, tt - 0.002);
            dg.gain.linearRampToValueAtTime(amp, tt);
            dg.gain.exponentialRampToValueAtTime(0.0001, tt + dec);
            tt += gap;
        }
        dsrc.connect(df);
        df.connect(dg);
        dg.connect(v.out);
        v.nodes.push(df, dg);

        // Pezzi pesanti che cadono
        for (let i = 0; i < 5; i++) {
            const ti = t + 0.4 + i * 0.25 + Math.random() * 0.15;
            tone(v, { type: 'sine', f: rnd(110, 190), f2: 50, t: ti, dur: 0.09, att: 0.002, peak: rnd(0.15, 0.3) });
        }
    }

    function playRocket(pos, vol, pitch) {
        const v = newVoice(1.9, pos, vol, 0.5, true);
        const t = v.t;
        // Lancio
        tone(v, { type: 'sine', f: 120 * pitch, f2: 40, t: t, dur: 0.22, att: 0.003, peak: 0.9, drive: 1.5 });
        noiseBurst(v, { f: 1200, f2: 300, q: 0.8, t: t, dur: 0.15, att: 0.002, peak: 0.8 });
        // Soffio del propulsore
        noiseBurst(v, {
            buf: pinkBuf, rate: pitch, f: 500, pts: [[0.4, 1600], [1.6, 400]], q: 1.0,
            t: t, dur: 1.6, att: 0.05, peak: 0.75
        });
        noiseBurst(v, { type: 'highpass', f: 3000, q: 0.7, t: t, dur: 1.4, att: 0.05, peak: 0.2 });
        // Fischio
        tone(v, { type: 'sine', pts: [[0.15, 2400 * pitch], [0.9, 900 * pitch]], f: 1700 * pitch, t: t, dur: 0.9, att: 0.03, peak: 0.14 });
    }

    // ------------------------------------------------------------------
    // RICARICA: 4 eventi metallici temporizzati
    // ------------------------------------------------------------------
    function playReload(pos, vol, pitch) {
        const v = newVoice(1.4, pos, vol, 0.2, false);
        const t = v.t0;
        // 1. Sgancio caricatore + scivolamento fuori
        metal(v, t, 2600 * pitch, 0.05, 0.55);
        noiseBurst(v, { buf: pinkBuf, f: 900 * pitch, f2: 2200 * pitch, q: 1.5, t: t + 0.04, dur: 0.12, att: 0.02, peak: 0.3 });
        // 2. Caricatore nuovo: tonfo + clic di aggancio
        const t2 = t + 0.52 + Math.random() * 0.02;
        tone(v, { type: 'sine', f: 180 * pitch, f2: 70, t: t2, dur: 0.07, att: 0.001, peak: 0.55 });
        metal(v, t2, 1700 * pitch, 0.07, 0.7);
        metal(v, t2 + 0.05, 3000 * pitch, 0.04, 0.4);
        // 3. Otturatore indietro
        const t3 = t + 0.86;
        noiseBurst(v, { f: 1200 * pitch, f2: 3500 * pitch, q: 2, t: t3, dur: 0.09, att: 0.01, peak: 0.35 });
        metal(v, t3 + 0.09, 2200 * pitch, 0.06, 0.6);
        // 4. Otturatore in chiusura
        const t4 = t + 1.04;
        metal(v, t4, 1500 * pitch, 0.07, 0.9);
        tone(v, { type: 'sine', f: 120 * pitch, f2: 60, t: t4, dur: 0.05, att: 0.001, peak: 0.5 });
    }

    function playEmpty(pos, vol, pitch) {
        const v = newVoice(0.12, pos, vol, 0.08, false);
        const t = v.t0;
        noiseBurst(v, { f: 5200 * pitch, q: 3.5, t: t, dur: 0.03, att: 0.0015, peak: 0.65 });
        tone(v, { type: 'triangle', f: 3400 * pitch, f2: 1600 * pitch, t: t, dur: 0.02, att: 0.0005, peak: 0.22 });
        tone(v, { type: 'sine', f: 220 * pitch, f2: 120, t: t, dur: 0.03, att: 0.001, peak: 0.3 });
    }

    // ------------------------------------------------------------------
    // IMPATTI E FEEDBACK
    // ------------------------------------------------------------------
    function playHit(pos, vol, pitch) {
        const v = newVoice(0.3, pos, vol, 0.15, false);
        const t = v.t0;
        tone(v, { type: 'sine', f: 150 * pitch, f2: 42, t: t, dur: 0.13, att: 0.001, peak: 0.9 });
        noiseBurst(v, { buf: pinkBuf, type: 'lowpass', f: 900 * pitch, f2: 300, q: 0.7, t: t, dur: 0.09, att: 0.002, peak: 0.6 });
        noiseBurst(v, { type: 'highpass', f: 2500, q: 0.7, t: t, dur: 0.01, att: 0.0005, peak: 0.2 });
    }

    function playHitmarker(pos, vol, pitch) {
        const v = newVoice(0.12, null, vol, 0.02, false);
        const t = v.t0;
        tone(v, { type: 'sine', f: 2800 * pitch, f2: 2200 * pitch, t: t, dur: 0.035, att: 0.0008, peak: 0.35 });
        tone(v, { type: 'triangle', f: 5600 * pitch, t: t, dur: 0.02, att: 0.0005, peak: 0.1 });
        noiseBurst(v, { type: 'highpass', f: 5000 * pitch, q: 0.7, t: t, dur: 0.02, att: 0.0005, peak: 0.4 });
    }

    function playKill(pos, vol, pitch) {
        const v = newVoice(0.25, null, vol, 0.05, false);
        const ticks = [[0, 3600], [0.075, 5000]];
        ticks.forEach(h => {
            const t = v.t0 + h[0];
            const f = h[1] * pitch;
            tone(v, { type: 'sine', f: f, f2: f * 0.8, t: t, dur: 0.06, att: 0.0008, peak: 0.4 });
            tone(v, { type: 'sine', f: f * 1.5, t: t, dur: 0.04, att: 0.0008, peak: 0.1 });
            noiseBurst(v, { type: 'highpass', f: f * 1.2, q: 0.7, t: t, dur: 0.025, att: 0.0005, peak: 0.45 });
        });
    }

    // ------------------------------------------------------------------
    // PASSI: tacco + punta, diversi per superficie
    // ------------------------------------------------------------------
    function stepHit(v, t, surface, s, heel, pitch) {
        const k = heel ? 1 : 1.45;
        const d = heel ? 1 : 0.75;
        if (surface === 'snow') {
            noiseBurst(v, { buf: brownBuf, type: 'lowpass', f: 420 * pitch, q: 0.7, t: t, dur: 0.09 * d, att: 0.006, peak: 0.35 * s });
            const n = heel ? 4 : 3;
            for (let i = 0; i < n; i++) {
                noiseBurst(v, {
                    f: rnd(1900, 3400) * pitch, q: 1.6, t: t + 0.006 + i * rnd(0.012, 0.026),
                    dur: rnd(0.014, 0.03), att: 0.0015, peak: rnd(0.14, 0.26) * s
                });
            }
        } else if (surface === 'metal') {
            metal(v, t, 2400 * k * pitch * rnd(0.85, 1.1), 0.16 * d, 0.45 * s);
            tone(v, { type: 'sine', f: 120 * k * pitch, f2: 70, t: t, dur: 0.06, att: 0.001, peak: 0.3 * s });
        } else if (surface === 'wood') {
            tone(v, { type: 'sine', f: 190 * k * pitch, f2: 90 * k, t: t, dur: 0.09 * d, att: 0.001, peak: 0.55 * s });
            tone(v, { type: 'sine', f: 320 * k * pitch, f2: 160 * k, t: t, dur: 0.05 * d, att: 0.001, peak: 0.25 * s });
            noiseBurst(v, { buf: pinkBuf, f: 650 * k * pitch, q: 2.5, t: t, dur: 0.06 * d, att: 0.002, peak: 0.4 * s });
        } else {
            tone(v, { type: 'sine', f: 105 * k * pitch, f2: 48, t: t, dur: 0.07 * d, att: 0.001, peak: 0.5 * s });
            noiseBurst(v, { buf: pinkBuf, f: 1300 * k * pitch, f2: 600 * k * pitch, q: 1.1, t: t, dur: 0.06 * d, att: 0.002, peak: 0.45 * s });
            noiseBurst(v, { f: 3500 * pitch, q: 1.2, t: t, dur: 0.02, att: 0.001, peak: 0.12 * s });
        }
    }

    function playFootstep(surface, pos, vol, pitch) {
        const v = newVoice(0.45, pos, vol * 0.8, 0.12, false);
        const t = v.t0;
        stepHit(v, t, surface, 1, true, pitch);
        stepHit(v, t + 0.075 + Math.random() * 0.015, surface, 0.55, false, pitch);
    }

    // ------------------------------------------------------------------
    // ALTRI SUONI
    // ------------------------------------------------------------------
    function playGrenadePin(pos, vol, pitch) {
        const v = newVoice(0.7, pos, vol, 0.15, false);
        const t = v.t0;
        noiseBurst(v, { f: 2000 * pitch, f2: 5500 * pitch, q: 2, t: t, dur: 0.07, att: 0.01, peak: 0.35 });
        metal(v, t + 0.06, 4200 * pitch, 0.3, 0.45);
        const tl = t + 0.2;
        metal(v, tl, 2000 * pitch, 0.12, 0.5);
        tone(v, { type: 'sine', f: 140 * pitch, f2: 80, t: tl, dur: 0.05, att: 0.001, peak: 0.3 });
    }

    function playWhiz(pos, vol, pitch) {
        const v = newVoice(0.6, pos, vol, 0.06, false);
        const t = v.t0;
        const tp = t + 0.045;
        let dest = v.out;
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (v.panner && v.pos && v.panner.positionX) {
            // il proiettile attraversa lo spazio: posizione che scorre da un lato all'altro
            const a = Math.random() * Math.PI * 2;
            const dx = Math.cos(a) * 9;
            const dz = Math.sin(a) * 9;
            const pn = v.panner;
            pn.positionX.setValueAtTime(v.pos.x + dx, t);
            pn.positionX.linearRampToValueAtTime(v.pos.x - dx, t + 0.3);
            pn.positionZ.setValueAtTime(v.pos.z + dz, t);
            pn.positionZ.linearRampToValueAtTime(v.pos.z - dz, t + 0.3);
        } else if (!v.panner && ctx.createStereoPanner) {
            const sp = ctx.createStereoPanner();
            sp.pan.setValueAtTime(0.85 * dir, t);
            sp.pan.linearRampToValueAtTime(-0.85 * dir, t + 0.32);
            sp.connect(v.out);
            v.nodes.push(sp);
            dest = sp;
        }
        // Snap secco al passaggio
        noiseBurst(v, { f: 6500 * pitch, q: 1.2, t: tp, dur: 0.018, att: 0.0004, peak: 1.0, dest: dest });
        tone(v, { type: 'sine', f: 4200 * pitch, f2: 1800 * pitch, t: tp, dur: 0.02, att: 0.0004, peak: 0.35, dest: dest });
        // Doppler: tono che sale e crolla dopo il passaggio
        tone(v, {
            type: 'triangle', f: 3600 * pitch, pts: [[0.045, 3000 * pitch], [0.3, 1000 * pitch]],
            t: t, dur: 0.26, att: 0.045, peak: 0.2, dest: dest
        });
        // Spostamento d'aria
        noiseBurst(v, { f: 5200 * pitch, f2: 1800 * pitch, q: 1.3, t: t, dur: 0.25, att: 0.045, peak: 0.55, dest: dest });
    }

    function playSwitch(pos, vol, pitch) {
        const v = newVoice(0.35, pos, vol, 0.08, false);
        const t = v.t0;
        noiseBurst(v, { buf: pinkBuf, f: 900 * pitch, f2: 2400 * pitch, q: 1.5, t: t, dur: 0.12, att: 0.025, peak: 0.35 });
        metal(v, t + 0.08, 2100 * pitch, 0.05, 0.4);
        metal(v, t + 0.15, 2900 * pitch, 0.04, 0.3);
    }

    function playJump(pos, vol, pitch) {
        const v = newVoice(0.3, pos, vol, 0.1, false);
        const t = v.t0;
        noiseBurst(v, { buf: pinkBuf, f: 450 * pitch, f2: 1500 * pitch, q: 1.0, t: t, dur: 0.18, att: 0.03, peak: 0.4 });
        tone(v, { type: 'sine', f: 90 * pitch, f2: 60, t: t, dur: 0.08, att: 0.004, peak: 0.3 });
        metal(v, t + 0.05, 3000 * pitch, 0.05, 0.12);
    }

    function playLand(pos, vol, pitch) {
        const v = newVoice(0.5, pos, vol, 0.2, false);
        const t = v.t0;
        tone(v, { type: 'sine', f: 115 * pitch, f2: 34, t: t, dur: 0.2, att: 0.001, peak: 0.95, drive: 1.4 });
        noiseBurst(v, { buf: brownBuf, type: 'lowpass', f: 900 * pitch, f2: 200, q: 0.7, t: t, dur: 0.22, att: 0.002, peak: 0.75 });
        noiseBurst(v, { buf: pinkBuf, f: 700 * pitch, q: 0.8, t: t, dur: 0.12, att: 0.01, peak: 0.2 });
        metal(v, t + 0.02, 2400 * pitch, 0.06, 0.22);
        metal(v, t + 0.07, 1800 * pitch, 0.05, 0.15);
    }

    function playHurt(pos, vol, pitch) {
        const v = newVoice(0.6, pos, vol, 0.2, false);
        const t = v.t0;
        tone(v, { type: 'sine', f: 125 * pitch, f2: 36, t: t, dur: 0.24, att: 0.001, peak: 0.95 });
        noiseBurst(v, { buf: brownBuf, type: 'lowpass', f: 400, q: 0.7, t: t, dur: 0.15, att: 0.002, peak: 0.5 });
        // Respiro contratto a formanti (niente urla)
        noiseBurst(v, { buf: pinkBuf, f: 850 * pitch, f2: 520 * pitch, q: 3, t: t + 0.03, dur: 0.32, att: 0.05, peak: 0.55 });
        noiseBurst(v, { buf: pinkBuf, f: 1500 * pitch, f2: 1100 * pitch, q: 3, t: t + 0.03, dur: 0.28, att: 0.05, peak: 0.25 });
    }

    // ------------------------------------------------------------------
    // API PUBBLICA: play / update / music / setVolume
    // ------------------------------------------------------------------
    function play(name, pos = null, volume = 1) {
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const vol = Math.max(0, Math.min(4, Number.isFinite(volume) ? volume : 1));
        if (vol <= 0.0001) return;

        const pitch = 1 + (Math.random() * 2 - 1) * 0.06; // variazione casuale ±6%

        try {
            switch (name) {
                case 'rifle': case 'smg': case 'pistol':
                case 'shotgun': case 'sniper': case 'lmg':
                    playGun(name, pos, vol, pitch); break;
                case 'rocket': playRocket(pos, vol, pitch); break;
                case 'explosion': playExplosion(pos, vol, pitch); break;
                case 'reload': playReload(pos, vol, pitch); break;
                case 'empty': playEmpty(pos, vol, pitch); break;
                case 'hit': playHit(pos, vol, pitch); break;
                case 'hitmarker': playHitmarker(pos, vol, pitch); break;
                case 'kill': playKill(pos, vol, pitch); break;
                case 'footstep': playFootstep('default', pos, vol, pitch); break;
                case 'footstep_snow': playFootstep('snow', pos, vol, pitch); break;
                case 'footstep_metal': playFootstep('metal', pos, vol, pitch); break;
                case 'footstep_wood': playFootstep('wood', pos, vol, pitch); break;
                case 'grenade_pin': playGrenadePin(pos, vol, pitch); break;
                case 'whiz': playWhiz(pos, vol, pitch); break;
                case 'switch': playSwitch(pos, vol, pitch); break;
                case 'jump': playJump(pos, vol, pitch); break;
                case 'land': playLand(pos, vol, pitch); break;
                case 'hurt': playHurt(pos, vol, pitch); break;
                default: playGun('rifle', pos, vol, pitch); break;
            }
        } catch (e) {
            // l'audio non deve mai bloccare il gioco
        }
    }

    function update(pos, yaw) {
        if (!pos) return;
        const px = Number.isFinite(pos.x) ? pos.x : 0;
        const py = Number.isFinite(pos.y) ? pos.y : 0;
        const pz = Number.isFinite(pos.z) ? pos.z : 0;
        listenerPos.x = px;
        listenerPos.y = py;
        listenerPos.z = pz;
        if (!ctx || !listener) return;

        const yw = Number.isFinite(yaw) ? yaw : 0;
        const fx = -Math.sin(yw);
        const fz = -Math.cos(yw);
        if (listener.positionX) {
            listener.positionX.value = px;
            listener.positionY.value = py;
            listener.positionZ.value = pz;
            listener.forwardX.value = fx;
            listener.forwardY.value = 0;
            listener.forwardZ.value = fz;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        } else if (listener.setPosition) {
            listener.setPosition(px, py, pz);
            listener.setOrientation(fx, 0, fz, 0, 1, 0);
        }
    }

    function setVolume(v) {
        masterVolume = Math.max(0, Math.min(1.5, Number.isFinite(v) ? v : 0.8));
        if (ctx && masterGain) {
            masterGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02);
        }
    }

    // Tappeto di tensione: drone con seconda minore, filtro lento, volume 0.12
    function music(on) {
        if (!ctx) { pendingMusic = !!on; return; }
        const now = ctx.currentTime;
        if (on) {
            if (musicState.active) return;
            musicState.active = true;

            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.12, now + 2.0);
            g.connect(masterGain);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            filter.Q.value = 2.2;
            filter.connect(g);

            const o1 = ctx.createOscillator();
            o1.type = 'sawtooth';
            o1.frequency.value = 48;
            const o2 = ctx.createOscillator();
            o2.type = 'triangle';
            o2.frequency.value = 48.6; // battimento lento
            const o3 = ctx.createOscillator();
            o3.type = 'sine';
            o3.frequency.value = 51;   // seconda minore: tensione
            const g3 = ctx.createGain();
            g3.gain.value = 0.5;

            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.09;
            const lfoG = ctx.createGain();
            lfoG.gain.value = 65;
            lfo.connect(lfoG);
            lfoG.connect(filter.frequency);

            o1.connect(filter);
            o2.connect(filter);
            o3.connect(g3);
            g3.connect(filter);

            o1.start(now);
            o2.start(now);
            o3.start(now);
            lfo.start(now);

            musicState.gain = g;
            musicState.nodes = [o1, o2, o3, g3, lfo, lfoG, filter, g];
        } else {
            pendingMusic = false;
            if (!musicState.active) return;
            musicState.active = false;
            const nodes = musicState.nodes;
            const g = musicState.gain;
            musicState.nodes = [];
            musicState.gain = null;
            if (g) {
                g.gain.cancelScheduledValues(now);
                g.gain.setValueAtTime(g.gain.value, now);
                g.gain.linearRampToValueAtTime(0.0001, now + 0.5);
            }
            setTimeout(() => {
                nodes.forEach(n => {
                    try { if (n.stop) n.stop(); } catch (e) {}
                    try { n.disconnect(); } catch (e) {}
                });
            }, 600);
        }
    }

    // ------------------------------------------------------------------
    // AMBIENTI: ricchi ma discreti (livelli bassi, modulazioni lente, niente toni fissi acuti)
    // ------------------------------------------------------------------
    function bed(buf, rate, type, f, q, level, out) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.playbackRate.value = rate;
        const filt = ctx.createBiquadFilter();
        filt.type = type;
        filt.frequency.value = f;
        filt.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = level;
        src.connect(filt);
        filt.connect(g);
        g.connect(out);
        src.start(0, Math.random() * buf.duration * 0.9);
        ambienceState.nodes.push(src, filt, g);
        return { src: src, filt: filt, g: g };
    }

    function lfo(freq, depth, param) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = depth;
        o.connect(g);
        g.connect(param);
        o.start();
        ambienceState.nodes.push(o, g);
    }

    function ambEvent(token, minMs, maxMs, fn, firstDelay) {
        const h = { id: 0 };
        const run = () => {
            if (!ctx || ambienceState.token !== token) return;
            try { fn(); } catch (e) {}
            h.id = setTimeout(run, rnd(minMs, maxMs));
        };
        h.id = setTimeout(run, firstDelay !== undefined ? firstDelay : rnd(minMs, maxMs));
        ambienceState.timers.push(h);
    }

    // Rumore che sale e scende (auto che passa, tuono, raffica di vento)
    function swell(out, o) {
        const t = ctx.currentTime;
        const total = o.rise + o.fall;
        const pv = { nodes: [], out: out };
        const src = addNoise(pv, o.buf, o.rate || 1, t, total);
        const f = ctx.createBiquadFilter();
        f.type = o.type || 'lowpass';
        f.Q.value = o.q || 0.7;
        f.frequency.setValueAtTime(o.f[0], t);
        f.frequency.exponentialRampToValueAtTime(o.f[1], t + o.rise);
        f.frequency.exponentialRampToValueAtTime(o.f[2], t + total);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(o.peak, t + o.rise);
        g.gain.exponentialRampToValueAtTime(0.0001, t + total);
        src.connect(f);
        f.connect(g);
        g.connect(out);
    }

    const AMBIENCES = {
        city_night_rain(out, tok) {
            const rain = bed(pinkBuf, 1.0, 'bandpass', 1600, 0.45, 0.55, out);
            lfo(0.045, 0.1, rain.g.gain);
            bed(whiteBuf, 1.0, 'highpass', 5500, 0.5, 0.035, out);
            const hum = bed(brownBuf, 0.7, 'lowpass', 140, 0.7, 0.45, out);
            lfo(0.07, 0.12, hum.g.gain);
            // Gocce lontane, molto discrete
            ambEvent(tok, 350, 1100, () => {
                const f = rnd(1500, 3400);
                tone({ nodes: [], out: out }, { type: 'sine', f: f, f2: f * 1.25, t: ctx.currentTime, dur: 0.04, att: 0.002, peak: rnd(0.02, 0.05) });
            });
            // Auto che passa in lontananza
            ambEvent(tok, 11000, 22000, () => {
                swell(out, { buf: pinkBuf, type: 'lowpass', f: [220, 650, 240], rise: 2.3, fall: 2.7, peak: 0.2 });
            }, 4000);
            // Tuono lontano
            ambEvent(tok, 28000, 55000, () => {
                swell(out, { buf: brownBuf, type: 'lowpass', f: [200, 140, 70], rise: 0.7, fall: 3.5, peak: 0.5 });
            });
        },

        war_distant(out, tok) {
            const wind = bed(brownBuf, 0.8, 'lowpass', 220, 0.7, 0.4, out);
            lfo(0.06, 0.15, wind.g.gain);
            bed(pinkBuf, 1.0, 'bandpass', 600, 0.6, 0.08, out);
            ambEvent(tok, 3500, 9000, () => {
                const a = Math.random() * Math.PI * 2;
                const d = rnd(90, 190);
                const pos = {
                    x: listenerPos.x + Math.cos(a) * d,
                    y: listenerPos.y + rnd(-2, 6),
                    z: listenerPos.z + Math.sin(a) * d
                };
                const r = Math.random();
                if (r < 0.35) {
                    play('explosion', pos, rnd(0.6, 0.95));
                } else {
                    const name = r < 0.8 ? 'rifle' : 'lmg';
                    const n = name === 'rifle' ? 2 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 3);
                    const gap = name === 'rifle' ? rnd(95, 160) : rnd(70, 90);
                    for (let i = 0; i < n; i++) {
                        setTimeout(() => {
                            if (ambienceState.token === tok) play(name, pos, rnd(0.4, 0.65));
                        }, i * gap);
                    }
                }
            }, 2500);
        },

        wind_snow(out, tok) {
            const low = bed(pinkBuf, 0.9, 'bandpass', 320, 1.0, 0.6, out);
            lfo(0.07, 150, low.filt.frequency);
            lfo(0.05, 0.2, low.g.gain);
            const hi = bed(pinkBuf, 1.1, 'bandpass', 900, 1.6, 0.18, out);
            lfo(0.11, 300, hi.filt.frequency);
            lfo(0.08, 0.1, hi.g.gain);
            bed(brownBuf, 0.7, 'lowpass', 110, 0.7, 0.3, out);
            ambEvent(tok, 9000, 20000, () => {
                swell(out, { buf: pinkBuf, type: 'bandpass', q: 0.8, f: [350, 1100, 400], rise: 2.0, fall: 3.5, peak: 0.3 });
            }, 3000);
        },

        jungle(out, tok) {
            bed(brownBuf, 0.8, 'lowpass', 200, 0.7, 0.25, out);
            const leaves = bed(pinkBuf, 1.0, 'bandpass', 2500, 0.4, 0.08, out);
            lfo(0.13, 0.04, leaves.g.gain);
            // Insetti: ronzio lento e basso
            const ins1 = bed(whiteBuf, 1.0, 'bandpass', 4200, 5, 0.05, out);
            lfo(0.08, 0.03, ins1.g.gain);
            lfo(6.5, 0.015, ins1.g.gain);
            const ins2 = bed(whiteBuf, 1.0, 'bandpass', 5600, 5, 0.025, out);
            lfo(0.06, 0.015, ins2.g.gain);
            lfo(9, 0.008, ins2.g.gain);
            // Uccelli: frasi di 3-5 note
            ambEvent(tok, 2500, 7000, () => {
                const t = ctx.currentTime;
                const pv = { nodes: [], out: out };
                if (Math.random() < 0.25) {
                    // colomba: tre "hoo" gravi
                    for (let i = 0; i < 3; i++) {
                        tone(pv, { type: 'sine', f: rnd(520, 640), f2: 480, t: t + i * 0.45, dur: 0.3, att: 0.06, peak: 0.05 });
                    }
                } else {
                    const base = rnd(2200, 3600);
                    const n = 3 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < n; i++) {
                        const f = base * rnd(0.9, 1.15);
                        tone(pv, { type: 'sine', f: f, f2: f * rnd(0.8, 1.3), t: t + i * 0.11, dur: 0.07, att: 0.008, peak: 0.05 });
                    }
                }
            });
        },

        harbor(out, tok) {
            const waves = bed(brownBuf, 0.85, 'lowpass', 380, 0.7, 0.4, out);
            lfo(0.16, 0.25, waves.g.gain);
            const foam = bed(pinkBuf, 1.0, 'bandpass', 900, 0.5, 0.12, out);
            lfo(0.13, 0.08, foam.g.gain);
            // Gabbiani
            ambEvent(tok, 6000, 15000, () => {
                const t = ctx.currentTime;
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 2100;
                bp.Q.value = 1.2;
                bp.connect(out);
                const pv = { nodes: [], out: bp };
                const n = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < n; i++) {
                    const ti = t + i * 0.42;
                    tone(pv, { type: 'triangle', f: 1900, pts: [[0.08, 2500], [0.38, 1250]], t: ti, dur: 0.36, att: 0.04, peak: 0.07 });
                }
            });
            // Sirena da nebbia lontana
            ambEvent(tok, 25000, 50000, () => {
                const t = ctx.currentTime;
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 240;
                const hg = ctx.createGain();
                hg.gain.setValueAtTime(0.0001, t);
                hg.gain.linearRampToValueAtTime(0.2, t + 0.5);
                hg.gain.setValueAtTime(0.2, t + 1.9);
                hg.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
                lp.connect(hg);
                hg.connect(out);
                [82.4, 123.5].forEach(f => {
                    const o = ctx.createOscillator();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(lp);
                    o.start(t);
                    o.stop(t + 3.1);
                });
            }, 9000);
            // Boa con campana
            ambEvent(tok, 14000, 28000, () => {
                const t = ctx.currentTime;
                const pv = { nodes: [], out: out };
                const n = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < n; i++) {
                    tone(pv, { type: 'sine', f: 523, t: t + i * 0.9, dur: 2.0, att: 0.003, peak: 0.05 });
                    tone(pv, { type: 'sine', f: 1318, t: t + i * 0.9, dur: 1.2, att: 0.003, peak: 0.025 });
                }
            });
        },

        desert_wind(out, tok) {
            const wind = bed(pinkBuf, 1.0, 'bandpass', 650, 0.6, 0.5, out);
            lfo(0.09, 280, wind.filt.frequency);
            lfo(0.05, 0.2, wind.g.gain);
            const sand = bed(whiteBuf, 1.0, 'highpass', 3500, 0.5, 0.03, out);
            lfo(0.13, 0.02, sand.g.gain);
            bed(brownBuf, 0.7, 'lowpass', 120, 0.7, 0.25, out);
            ambEvent(tok, 9000, 20000, () => {
                swell(out, { buf: pinkBuf, type: 'bandpass', q: 0.7, f: [500, 1400, 450], rise: 1.5, fall: 3.5, peak: 0.35 });
            }, 3500);
        }
    };

    function clearAmbience() {
        ambienceState.token++;
        ambienceState.timers.forEach(h => clearTimeout(h.id));
        ambienceState.timers = [];

        const nodes = ambienceState.nodes;
        const g = ambienceState.gain;
        ambienceState.nodes = [];
        ambienceState.gain = null;
        ambienceState.type = null;

        if (ctx && g) {
            try {
                const now = ctx.currentTime;
                g.gain.cancelScheduledValues(now);
                g.gain.setValueAtTime(g.gain.value, now);
                g.gain.linearRampToValueAtTime(0.0001, now + 0.8);
            } catch (e) {}
        }
        setTimeout(() => {
            nodes.forEach(n => {
                try { if (n.stop) n.stop(); } catch (e) {}
                try { n.disconnect(); } catch (e) {}
            });
        }, 900);
    }

    function ambience(tipo) {
        if (!ctx) { pendingAmbience = tipo || null; return; }
        if (!tipo || tipo === 'none' || tipo === 'off') {
            pendingAmbience = null;
            clearAmbience();
            return;
        }
        if (ambienceState.type === tipo) return;
        const builder = AMBIENCES[tipo];
        clearAmbience();
        if (!builder) return;

        ambienceState.type = tipo;
        const token = ++ambienceState.token;
        const now = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, now);
        out.gain.linearRampToValueAtTime(AMB_LEVEL, now + 2.5);
        out.connect(masterGain);
        ambienceState.gain = out;
        ambienceState.nodes.push(out);
        try {
            builder(out, token);
        } catch (e) {
            // un ambiente rotto non deve fermare il gioco
        }
    }

    return {
        init,
        play,
        update,
        music,
        ambience,
        setVolume
    };
})();
