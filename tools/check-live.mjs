// Controlla il gioco aperto con GIOCA.sh (porta 9444): errori, schermata, GPU, fps
const list = await (await fetch('http://127.0.0.1:9444/json/list')).json();
const page = list.find(t => t.type === 'page' && t.url.includes('FrancyWarfront'));
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
console.log('errori:', JSON.stringify(await ev("document.getElementById('err').textContent")));
console.log('menu:', await ev("getComputedStyle(document.getElementById('menu')).display"), '| caricamento:', await ev("getComputedStyle(document.getElementById('loading')).display"));
console.log('fps:', await ev("new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(Math.round(n/2))};requestAnimationFrame(f)})"));
if (process.argv[2]) { const s = await cmd('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(process.argv[2], Buffer.from(s.result.data, 'base64')); }
ws.close(); process.exit(0);
