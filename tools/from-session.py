#!/usr/bin/env python3
"""Ricostruisce il codice completo di una risposta di `claude -p` dal registro .jsonl.
claude -p stampa solo l'ultimo messaggio; un file lungo arriva spezzato (anche a metà riga)
in più messaggi, e ogni continuazione riapre con ```js. Qui si ricuce tutto esattamente."""
import json, sys, re
src, out = sys.argv[1], sys.argv[2]
texts = []
for line in open(src):
    try: d = json.loads(line)
    except Exception: continue
    if d.get('type') != 'assistant': continue
    for c in d.get('message', {}).get('content', []):
        if c.get('type') == 'text': texts.append(c['text'])
parts = []
for i, t in enumerate(texts):
    if i == 0:
        m = re.search(r'```(?:js|javascript)?[ \t]*\n', t); t = t[m.end():] if m else t
    else:
        t = re.sub(r'^\s*```(?:js|javascript)?[ \t]*\n', '', t, count=1)
    parts.append(t)
code = ''.join(parts)
code = re.sub(r'\n```\s*$', '\n', code.rstrip()) + '\n'
code = re.sub(r'```\s*\Z', '', code)
open(out, 'w').write(code)
print(out, 'messaggi:', len(texts), 'caratteri:', len(code))
