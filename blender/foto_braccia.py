import bpy, sys, math
a = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
roots = [o for o in bpy.data.objects if o.parent is None and o.type == 'EMPTY']
for i, r in enumerate(roots):
    r.rotation_mode = 'XYZ'; r.location = (i * 0.35 - 0.17, 0, 0)
scn = bpy.context.scene; scn.render.engine = 'BLENDER_EEVEE'; scn.render.resolution_x, scn.render.resolution_y = 1400, 900
w = bpy.data.worlds.new('w'); scn.world = w
w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.09, 0.1, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.3
for loc, en in [((1, -1, 1.2), 40), ((-1, -0.5, 0.5), 15)]:
    l = bpy.data.lights.new('l', 'AREA'); l.energy = en; l.size = 1; o = bpy.data.objects.new('l', l); o.location = loc; scn.collection.objects.link(o)
    c = o.constraints.new('TRACK_TO'); c.target = roots[0]
cam = bpy.data.cameras.new('c'); cam.lens = 50; co = bpy.data.objects.new('c', cam); co.location = (0.6, -0.9, 0.45); scn.collection.objects.link(co); scn.camera = co
e = bpy.data.objects.new('t', None); e.location = (0, -0.18, 0); scn.collection.objects.link(e)
c = co.constraints.new('TRACK_TO'); c.target = e
scn.render.filepath = a[1]; bpy.ops.render.render(write_still=True); print('FOTO OK')
