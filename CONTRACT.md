# FRANCY WARFRONT — contratto tra i moduli (LEGGERE TUTTO PRIMA DI SCRIVERE CODICE)

Sparatutto in prima persona (FPS) di guerra, Three.js r170, **tutto procedurale** (zero asset scaricati).
Partita 15 minuti, la mappa cambia ogni 2,5 minuti (6 mappe), 20-30 soldati bot in due squadre
(BLU = giocatore + compagni, ROSSO = nemici). Obiettivo visivo: "ultra realistico" nel browser
(ACES tonemap, IBL, ombre, bloom, nebbia). Pubblico: un bambino → **niente sangue, niente gore**
(i colpiti fanno scintille/polvere, i morti cadono e spariscono).

## Come viene costruito
Tutti i file `.js` vengono CONCATENATI in un solo `<script type="module">` (ordine: core prima, poi
fx, audio, weapons, bots, maps, main). Quindi:
- **NIENTE `import`/`export`** nei vostri file. Sono già disponibili nello scope:
  `THREE` (namespace completo di three r170), `mergeGeometries` (da BufferGeometryUtils),
  `GLTFLoader`.
- Scrivete solo dichiarazioni top-level (`const`, `function`, `class`) con **prefisso del vostro
  modulo** per evitare collisioni di nomi (es. `fx_`, `wpn_`, `bot_`, `map_neon_`).
- Niente `Math.random` sparso nei generatori di mappa: usate `kit.rng()` (seminato).
- Coordinate: metri, Y in alto, terreno a y=0. "Avanti" di un modello = **−Z**.

## Oggetto globale `G` (lo crea il core)
```
G.scene, G.camera (PerspectiveCamera, fov 75), G.renderer
G.time (s), G.dt (s, già limitato a [0,0.05])
G.player   = { pos:Vector3 (piedi), eye:Vector3, yaw, pitch, vel:Vector3, hp:100, alive:bool,
               team:'blue', isPlayer:true, id:0 }
G.bots     = []            // istanze del modulo bots
G.colliders= []            // THREE.Box3 in coordinate mondo (muri, pavimenti, casse...)
G.settings = { difficulty: 1..5, botCount: 20..30 }
G.nav      = { points:[Vector3], links:[[int]], nearest(pos)->int, path(fromVec3,toVec3)->Vector3[] }
G.map      = { def, bounds:{minX,maxX,minZ,maxZ}, spawns:{blue:[Vector3],red:[Vector3]} }
G.shake(amount)            // scossa della camera (0.1 piccola .. 1 enorme)
G.flashHit()               // il giocatore è stato colpito (bordo rosso HUD)
G.hitMarker(kill:bool)     // il giocatore ha colpito qualcuno
G.killFeed(killerName, victimName, weaponName)
```

### Funzioni del core usabili da tutti
```
raycastWorld(origin:Vector3, dir:Vector3 (normalizzato), maxDist:number, opts={ignore:entity|null, entities:true})
  -> null | { dist, point:Vector3, normal:Vector3, kind:'world'|'entity', entity:(bot o G.player) }
  // controlla muri (G.colliders) E le hitbox delle entità vive (capsule semplificate)
  // la hitbox della testa dà hit.head = true
applyDamage(entity, amount, attacker /*entità o null*/, weaponName, hitPoint:Vector3)
  // gestisce hp, morte, punteggio, killfeed, hitmarker. NON toccare hp a mano.
explosionDamage(center:Vector3, radius, maxDamage, attacker, weaponName) // danno decrescente + LOS
hasLineOfSight(a:Vector3, b:Vector3) -> bool   // solo muri
moveWithCollision(pos:Vector3 (piedi), vel:Vector3, dt, radius=0.35, height=1.8) -> {onGround:bool}
  // muove pos sui collider con step-up fino a 0.55 m (scale fatte di gradini). Usatela per i bot.
groundHeightAt(x, y, z) -> number   // altezza del pavimento sotto (x, y+0.5, z)
```

## Modulo FX (`src/20_fx.js`) — API che tutti chiamano
```
FX.init(G)
FX.update(dt)
FX.muzzle(pos:Vector3, dir:Vector3, scale=1)       // fiammata + luce breve
FX.tracer(from:Vector3, to:Vector3)                // scia proiettile
FX.impact(point:Vector3, normal:Vector3, kind)      // kind: 'world'|'entity'  (polvere/scintille; MAI sangue)
FX.explosion(pos:Vector3, radius)                  // palla di fuoco + fumo + detriti + PointLight + G.shake
FX.smoke(pos, radius, seconds)                     // granata fumogena
FX.casing(pos, dir)                                // bossolo espulso (facoltativo)
```

## Modulo AUDIO (`src/30_audio.js`) — WebAudio procedurale
```
SFX.init()                    // dopo il primo click (policy autoplay)
SFX.play(name, pos:Vector3|null, volume=1)   // pos null = suono 2D (del giocatore)
  name: 'rifle','smg','pistol','shotgun','sniper','lmg','rocket','explosion','reload','empty',
        'hit','hitmarker','kill','footstep','grenade_pin','whiz','switch','jump','land','hurt'
SFX.update(listenerPos:Vector3, yaw:number)
SFX.music(on:bool)            // tappeto di tensione leggero, facoltativo
```

## Modulo ARMI (`src/40_weapons.js`)
```
WPN_DEFS : array di definizioni (id, name, slot, damage, headMult, rpm, mag, reserve, reload(s),
           spread, adsSpread, recoil, range, pellets, auto:bool, sound, projectile:'hitscan'|'rocket'|'grenade')
  Almeno: AR (fucile d'assalto), SMG, SHOTGUN, SNIPER (con mirino zoom), PISTOL, LMG, RPG, GRENADE (frag).
WPN.init(G)                  // crea il viewmodel attaccato a G.camera
WPN.update(dt, input)        // input = { fire:bool (tenuto), firePressed:bool, ads:bool, reload:bool,
                             //   switchTo:int|null (0..n), wheel:int, grenade:bool, moving:bool, sprint:bool }
WPN.current() -> def ;  WPN.ammo() -> {mag, reserve} ;  WPN.isADS() -> bool ; WPN.adsAmount() -> 0..1
WPN.reset()                  // al respawn: munizioni piene
WPN.fireFrom(entity, defId, origin, dir) // usata anche dai BOT: hitscan/razzo/granata + FX + SFX + danno
WPN.updateProjectiles(dt)    // razzi e granate in volo (anche quelli dei bot)
```
Modelli 3D delle armi: se esiste `ASSETS.weapons[id]` (THREE.Group caricato dal GLB fatto in Blender,
con figli vuoti chiamati `muzzle`), usatelo; altrimenti costruite un modello procedurale dettagliato.
Viewmodel: mani/guanti + avambracci in mimetica, sway, bob, rinculo, animazione di ricarica, ADS.

## Modulo BOT (`src/50_bots.js`)
```
BOT.createSoldier(team:'blue'|'red', rng) -> THREE.Group   // soldato procedurale dettagliato (elmetto,
     giubbotto tattico, tasche, ginocchiere, scarponi, arma in mano), colori mimetica per squadra
     (blu: verde-oliva/woodland con fascia blu sul braccio; rosso: deserto/grigio con fascia rossa)
class Bot { constructor(team, name, rng)
   pos:Vector3 (piedi), yaw, hp, alive, team, name, id, model:Group
   respawn(spawnPos)   update(dt)   // IA completa
}
BOT.spawnAll(G)  // crea G.settings.botCount bot (giocatore conta nella squadra blu)
BOT.updateAll(dt)
```
Le hitbox le calcola il core da `entity.pos` (+ `entity.crouch` se presente): capsula corpo
(raggio 0.35, h 1.75) + sfera testa (centro pos.y+1.62, r 0.14). Non servono mesh-raycast.
Difficoltà `G.settings.difficulty` 1..5: tempo di reazione (1: 0.9 s → 5: 0.18 s), errore di mira,
cadenza, uso di copertura, lancio granate, aggressività.

## Mappe (`maps/NN_nome.js`) — una per file
```
MAPS.push({
  id: 'neon', name: 'Neon District', size: 140,     // quadrato ±size/2
  env: { sky:'day'|'sunset'|'night'|'overcast'|'snow'|'dusk',
         sunElev:deg, sunAzim:deg, sunColor:0xffd9a8, sunIntensity:4.5,
         hemiSky:0x9ec4ff, hemiGround:0x6b5a45, hemiIntensity:1.2,
         fogColor:0xb8c6d6, fogDensity:0.006, exposure:0.5, bloomThreshold:2.0, bloomStrength:0.5,
         rain:false, snow:false, dust:false },
  build(kit) { ... }        // costruisce tutto con il kit, sotto
});
```
### Il kit (lo implementa il core) — usate SOLO questo per costruire
```
kit.rng() -> [0,1)       kit.rand(a,b)   kit.pick(array)
kit.mat(name, opts={})   // materiale PBR procedurale CONDIVISO (texture canvas con normal+roughness)
   name: 'concrete','concrete_dark','brick','brick_red','plaster','metal','metal_painted','rust',
         'asphalt','sand','snow','dirt','grass','wood','wood_dark','tile','glass','sandbag',
         'camo_net','container_red','container_blue','container_green','container_yellow',
         'rubber','road_line','rubble','ice','corrugated'
   opts: { color:0xRRGGBB (tinta), roughness, metalness, scale (metri per ripetizione, default 2) }
kit.neon(color, intensity=6) -> MeshStandardMaterial emissivo (insegne, tubi al neon)
kit.box(x, y, z, w, h, d, mat, opts={collide:true, rotY:0, cast:true})
   // x,z = centro; y = BASE (fondo). rotY ruota la mesh; il collider resta un AABB che la contiene.
   // UV in METRI automatiche.
kit.cyl(x, y, z, rTop, rBot, h, mat, opts={collide:true, seg:16})
kit.mesh(geometry, mat, {x,y,z,rotY=0,rotX=0,rotZ=0,scale=1}, opts={collide:false})
kit.collider(minX,minY,minZ,maxX,maxY,maxZ)       // collider invisibile
kit.ramp(x, y, z, w, d, rise, rotY, mat)          // rampa camminabile
kit.stairs(x, y, z, width, rise, run, rotY, mat)  // scala a gradini (avanti = -Z ruotato di rotY), collidibile
kit.building({ x, z, w, d, floors=2, floorH=3.4, wall=0.3, mat, innerMat, floorMat,
               doors:[{side:'n'|'s'|'e'|'w', at:0 (offset dal centro del lato), width:1.6}],
               windows:true, roof:'flat'|'parapet'|'none', ruined:0..1, rotY:0 /*solo 0 o PI/2*/ })
   // edificio ENTRABILE: muri con porte e finestre, solai, scala interna tra i piani, tetto
   // calpestabile (accesso dalla scala); aggiunge da solo nav point e collider.
   // ruined>0 = muri e solai mancanti a pezzi, macerie a terra.
kit.room({ x, y=0, z, w, d, h=3.2, mat, floorMat, ceiling:true, doors:[...], windows:[...] })
kit.instanced(geometry, mat, matrices:Matrix4[], opts={cast:true})   // clutter ripetuto (1 draw call)
kit.light(x, y, z, color, intensity, distance)   // PointLight vera: MASSIMO 6 per mappa
kit.spawn(team, x, z)      // almeno 8 per squadra, lati opposti della mappa, al coperto
kit.nav(x, y, z)           // nav point extra (il core genera già una griglia a terra ogni 4 m)
kit.decal(x, z, w, d, rotY, mat)   // macchia/strisce sul terreno (piano sottile, niente collider)
kit.ground(mat)            // terreno di base della mappa (obbligatorio, una volta)
kit.THREE                  // il namespace three, per geometrie custom
```
Regole mappe: dimensione 120-160 m; layout a 3 corsie (sinistra / centro / destra) con incroci,
coperture ogni 6-10 m (casse, auto, sacchi di sabbia, muretti), **almeno 6 edifici entrabili**
(kit.building), punti alti, linee di tiro lunghe E zone strette. Bordi chiusi in modo credibile
(palazzi, muri, recinzioni, rocce). Budget: ≤ 350 draw call dopo il merge, ≤ 1.5 M triangoli,
≤ 6 luci vere. Albedo mai sotto ~30/255 né sopra ~235/255. Imperfezione: rotazioni ±2°, sporco,
crepe, oggetti storti. Le luci al neon sono materiali `kit.neon` (il bloom fa il resto), non luci vere.
