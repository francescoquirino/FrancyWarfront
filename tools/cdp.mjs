// Foto vera con la GPU: node tools/cdp.mjs <uscita.png> "<query>" [timeout_s]
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
const [out, q = '', tmo = '90'] = process.argv.slice(2);
const R = new URL('..', import.meta.url).pathname.replace(/\/$/, ''), PORT = 9300 + Math.floor(Math.random() * 600);
const dir = `${(await import("node:os")).tmpdir()}/fw-cdp-${PORT}`;
const ch = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-sandbox', '--window-size=1280,720',
  '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan', '--disable-frame-rate-limit', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') logs.push('ECCEZIONE ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300));
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) logs.push(d.params.type + ' ' + d.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300)); };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true })).result.result?.value;
await cmd('Runtime.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url: `file://${R}/FrancyWarfront.html?${q.startsWith("nodemo") ? "" : "demo=1&"}${q}` });
const t0 = Date.now(); let ok = false;
while (Date.now() - t0 < +tmo * 1000) { if ((await ev('document.title')) === 'READY') { ok = true; break; } await sleep(250); }
const st = await ev('JSON.stringify(window.__STATE__||null)');
const gpu = await ev("(()=>{const c=document.createElement('canvas').getContext('webgl2');const e=c.getExtension('WEBGL_debug_renderer_info');return e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):'?'})()");
const shot = await cmd('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(ok ? 'READY' : 'TIMEOUT', ((Date.now() - t0) / 1000).toFixed(1) + 's', 'GPU:', gpu);
console.log('STATE', st);
for (const l of [...new Set(logs)].slice(0, 12)) console.log(l);
ws.close(); ch.kill('SIGKILL'); await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch {}
process.exit(0);
