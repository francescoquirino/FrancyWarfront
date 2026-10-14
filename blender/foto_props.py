import bpy, sys, math
a = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
roots = [o for o in bpy.data.objects if o.parent is None]
lay = {'TANK':(-7,4),'HUMVEE':(0.5,4),'TRUCK':(7,4),'HELI':(-6,-6),'CAR_BURNT':(2,-5),'BUS':(9,-6),'JERSEY':(1,-3),'SANDBAGS':(4,-3),'CRATE':(1,-6),'AMMO_BOX':(3,-6),'BARREL':(5,-6),'LAMP':(9,-4),'GENERATOR':(7,-7),'ANTENNA':(11,0)}
for r in roots:
    r.rotation_mode = 'XYZ'
    if r.name in lay: r.location = (lay[r.name][0], lay[r.name][1], 0)
scn = bpy.context.scene; scn.render.engine = 'BLENDER_EEVEE'; scn.render.resolution_x, scn.render.resolution_y = 1600, 1000
w = bpy.data.worlds.new('w'); scn.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.42, 0.5, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
bpy.ops.mesh.primitive_plane_add(size=80); bpy.context.object.data.materials.append(bpy.data.materials.new('g')); bpy.context.object.active_material.diffuse_color = (0.4,0.36,0.3,1)
s = bpy.data.lights.new('s', 'SUN'); s.energy = 4; so = bpy.data.objects.new('s', s); so.rotation_euler = (math.radians(50), 0, math.radians(30)); scn.collection.objects.link(so)
cam = bpy.data.cameras.new('c'); cam.lens = 28; co = bpy.data.objects.new('c', cam); co.location = (2, -24, 14); co.rotation_euler = (math.radians(62), 0, 0); scn.collection.objects.link(co); scn.camera = co
scn.render.filepath = a[1]; bpy.ops.render.render(write_still=True); print('FOTO OK')
