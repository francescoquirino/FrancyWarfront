import bpy, sys, math
out = sys.argv[sys.argv.index('--')+1:]
glb, png = out[0], out[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
roots = [o for o in bpy.data.objects if o.parent is None and o.type == 'EMPTY']
order = ['SNIPER','LMG','AR','RPG','SHOTGUN','SMG','PISTOL','GRENADE']
roots.sort(key=lambda o: order.index(o.name) if o.name in order else 99)
for i, r in enumerate(roots):
    col, row = i % 2, i // 2
    r.location = (col * 1.45 - 0.72, 0, -row * 0.42)
    r.rotation_mode = 'XYZ'; r.rotation_euler = (0, 0, math.radians(90))
scn = bpy.context.scene
scn.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'CYCLES'
scn.render.resolution_x, scn.render.resolution_y = 1600, 1000
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.06, 0.07, 0.08, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
for loc, en in [((2, -4, 2), 700), ((-3, -3, -1), 350), ((0, 3, 3), 400)]:
    l = bpy.data.lights.new('l', 'AREA'); l.energy = en; l.size = 3
    o = bpy.data.objects.new('l', l); o.location = loc; scn.collection.objects.link(o)
    c = o.constraints.new('TRACK_TO'); c.target = roots[2] if len(roots) > 2 else None
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = 3.0
co = bpy.data.objects.new('c', cam); co.location = (0, -6, -0.62); co.rotation_euler = (math.radians(90), 0, 0); scn.collection.objects.link(co); scn.camera = co
scn.render.filepath = png
bpy.ops.render.render(write_still=True)
print('FOTO OK')
