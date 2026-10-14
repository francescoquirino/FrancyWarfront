#!/usr/bin/env python3
"""Unisce src/*.js + maps/*.js (+ armi Blender in base64) in un solo HTML: FrancyWarfront.html"""
import base64, glob, os, re, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sorted(glob.glob(f'{R}/src/*.js'))
pre = [f for f in src if os.path.basename(f) < '90']
post = [f for f in src if os.path.basename(f) >= '90']
maps = sorted(glob.glob(f'{R}/maps/*.js'))
skip = set(a for a in sys.argv[1:] if a.startswith('-'))
maps = [m for m in maps if '-' + os.path.basename(m).split('_', 1)[1][:-3] not in skip]
parts = []
glb = f'{R}/assets/weapons.glb'
b64 = base64.b64encode(open(glb, 'rb').read()).decode() if os.path.exists(glb) and '-noglb' not in skip else ''
parts.append(f'const ASSETS_GLB_B64 = "{b64}";')
for nm in ['props', 'props2', 'props3', 'arms', 'city']:
    fp = f'{R}/assets/{nm}.glb'
    bb = base64.b64encode(open(fp, 'rb').read()).decode() if os.path.exists(fp) else ''
    parts.append(f'const ASSETS_{nm.upper()}_B64 = "{bb}";')
names = ''.join(open(f).read() for f in pre)
stubs = []
if not re.search(r'\b(const|let|var)\s+SFX\b', names): stubs.append("const SFX={init(){},play(){},update(){},music(){},setVolume(){}};")
if not re.search(r'\b(const|let|var)\s+FX\b', names): stubs.append("const FX={init(){},update(){},muzzle(){},tracer(){},impact(){},explosion(){},smoke(){},casing(){}};")
if not re.search(r'\b(const|let|var)\s+WPN\b', names): stubs.append("const WPN_DEFS=[];const WPN={init(){},update(){},current(){return {name:'—'}},ammo(){return {mag:0,reserve:0}},isADS(){return false},adsAmount(){return 0},reset(){},fireFrom(){},updateProjectiles(){},desiredFov(){return 75},scopeActive(){return false}};")
if not re.search(r'\b(const|let|var)\s+BOT\b', names): stubs.append("const BOT={spawnAll(){},updateAll(){},clearAll(){}};")
for f in pre: parts.append(f'// ---- {os.path.basename(f)} ----\n' + open(f).read())
if stubs: parts.append('// ---- stub (moduli non ancora pronti) ----\n' + '\n'.join(stubs))
for f in maps: parts.append(f'// ---- maps/{os.path.basename(f)} ----\n' + open(f).read())
for f in post: parts.append(f'// ---- {os.path.basename(f)} ----\n' + open(f).read())
shell = open(f'{R}/src/shell.html').read()
out = shell.replace('/*__CODE__*/', '\n'.join(parts))
dst = f'{R}/FrancyWarfront.html'
open(dst, 'w').write(out)
print(f'build: {dst} ({len(out)//1024} KB), moduli {len(pre)+len(post)}, mappe {len(maps)}, stub {len(stubs)}, glb {len(b64)//1365} KB')
