// Prova l'interfaccia vera (senza demo): node tools/ui-test.mjs out.png "<js da eseguire dopo il caricamento>"
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
const [out, js = ''] = process.argv.slice(2);
const PORT = 9700 + Math.floor(Math.random() * 200), dir = `${(await import("node:os")).tmpdir()}/fw-ui-${PORT}`;
const ch = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--ignore-gpu-blocklist', '--use-angle=vulkan', '--enable-features=Vulkan', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } if (d.method === 'Runtime.exceptionThrown') logs.push('ECC ' + (d.params.exceptionDetails.exception?.description || '').slice(0, 200)); };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await cmd('Runtime.enable'); await cmd('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url: new URL('../FrancyWarfront.html', import.meta.url).href });
await sleep(8000);
if (js) { const r = await cmd('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: true, userGesture: true }); console.log('js:', JSON.stringify(r.result.result?.value ?? r.result.exceptionDetails?.exception?.description)); }
await sleep(1500);
const s = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(out, Buffer.from(s.result.data, 'base64'));
console.log(logs.filter(l => !/pointer lock/i.test(l)).slice(0, 5).join('\n') || 'nessun errore');
ws.close(); ch.kill('SIGKILL'); await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch {}
process.exit(0);
