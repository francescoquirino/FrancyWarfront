import bpy
import bmesh
import sys
import os
import math
import random
from mathutils import Vector, Matrix

# ---------------------------------------------------------------------------
# 1. INIZIALIZZAZIONE E PARAMETRI CLI
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

def get_output_path():
    argv = sys.argv
    if "--" in argv:
        idx = argv.index("--")
        if idx + 1 < len(argv):
            return argv[-1]
    return "props.glb"

OUTPUT_PATH = get_output_path()

# ---------------------------------------------------------------------------
# 2. MATERIALI PRINCIPLED BSDF (Compatibili Blender 4.x / 5.2)
# ---------------------------------------------------------------------------
def set_socket(node, names, value):
    for n in names:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return

def create_material(name, base_color, roughness=0.5, metallic=0.0, emit_color=None, emit_strength=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = None
    for node in nt.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    if bsdf is None:
        bsdf = nt.nodes.new(type='ShaderNodeBsdfPrincipled')
    set_socket(bsdf, ['Base Color'], (base_color[0], base_color[1], base_color[2], 1.0))
    set_socket(bsdf, ['Roughness'], roughness)
    set_socket(bsdf, ['Metallic'], metallic)
    if emit_color is not None and emit_strength > 0.0:
        set_socket(bsdf, ['Emission Color', 'Emission'], (emit_color[0], emit_color[1], emit_color[2], 1.0))
        set_socket(bsdf, ['Emission Strength'], emit_strength)
    return mat

MATERIALS = {
    "Army_Green": create_material("Army_Green", (0.20, 0.24, 0.15), roughness=0.6, metallic=0.0),
    "Desert_Tan": create_material("Desert_Tan", (0.55, 0.45, 0.30), roughness=0.65, metallic=0.0),
    "Metal_Dark": create_material("Metal_Dark", (0.05, 0.05, 0.05), roughness=0.4, metallic=0.8),
    "Rubber":     create_material("Rubber",     (0.02, 0.02, 0.02), roughness=0.9, metallic=0.0),
    "Glass_Dark": create_material("Glass_Dark", (0.05, 0.07, 0.08), roughness=0.05, metallic=0.2),
    "Concrete":   create_material("Concrete",   (0.45, 0.45, 0.45), roughness=0.9, metallic=0.0),
    "Wood_Crate": create_material("Wood_Crate", (0.35, 0.25, 0.15), roughness=0.8, metallic=0.0),
    "Canvas":     create_material("Canvas",     (0.30, 0.30, 0.22), roughness=0.95, metallic=0.0),
    "Burlap":     create_material("Burlap",     (0.55, 0.47, 0.33), roughness=1.0, metallic=0.0),
    "Light_Emit": create_material("Light_Emit", (1.00, 0.85, 0.50), roughness=0.2, metallic=0.0,
                                  emit_color=(1.00, 0.82, 0.45), emit_strength=6.0),
}

# ---------------------------------------------------------------------------
# 3. LIBRERIA DI MODELLAZIONE PROCEDURALE BMesh
# ---------------------------------------------------------------------------
class MeshPartBuilder:
    def __init__(self, name, parent_empty):
        self.name = name
        self.parent = parent_empty
        self.bm = bmesh.new()
        self.mat_list = []
        self.mat_map = {}

    def mat_idx(self, mat_name):
        if mat_name not in self.mat_map:
            self.mat_map[mat_name] = len(self.mat_list)
            self.mat_list.append(MATERIALS[mat_name])
        return self.mat_map[mat_name]

    def _assign_and_bevel(self, geom_verts, mat_name, bevel_w=0.0, bevel_segs=1, transform=None):
        vset = set(geom_verts)
        edges = [e for e in self.bm.edges if e.verts[0] in vset and e.verts[1] in vset]
        faces = [f for f in self.bm.faces if all(v in vset for v in f.verts)]
        m_id = self.mat_idx(mat_name)
        for f in faces:
            f.material_index = m_id
            f.smooth = True
        if transform is not None:
            bmesh.ops.transform(self.bm, matrix=transform, verts=geom_verts)
        if bevel_w > 0.0 and edges:
            sharp_edges = []
            for e in edges:
                if len(e.link_faces) == 2:
                    if e.calc_face_angle(0.0) > 0.35:
                        sharp_edges.append(e)
            if sharp_edges:
                res = bmesh.ops.bevel(
                    self.bm,
                    geom=sharp_edges,
                    offset=bevel_w,
                    offset_type='OFFSET',
                    segments=bevel_segs,
                    profile=0.5,
                    affect='EDGES',
                    clamp_overlap=True
                )
                for f in res.get("faces", []):
                    f.material_index = m_id
                    f.smooth = True

    def add_box(self, center, size, mat_name, bevel_w=0.015, bevel_segs=1, rot_euler=None):
        res = bmesh.ops.create_cube(self.bm, size=1.0)
        verts = res["verts"]
        mat = Matrix.Diagonal((size[0], size[1], size[2], 1.0))
        if rot_euler is not None:
            rmat = Matrix.Identity(4)
            rmat.rotate(rot_euler)
            mat = rmat @ mat
        tmat = Matrix.Translation(center) @ mat
        self._assign_and_bevel(verts, mat_name, bevel_w=bevel_w, bevel_segs=bevel_segs, transform=tmat)

    def add_cylinder(self, center, radius, length, axis='Z', segs=16, mat_name="Metal_Dark",
                     bevel_w=0.012, bevel_segs=1, r_top=None, rot_euler=None):
        r2 = radius if r_top is None else r_top
        res = bmesh.ops.create_cone(
            self.bm,
            cap_ends=True,
            cap_tris=False,
            segments=segs,
            radius1=radius,
            radius2=r2,
            depth=length
        )
        verts = res["verts"]
        rmat = Matrix.Identity(4)
        if axis == 'X':
            rmat = Matrix.Rotation(math.pi / 2.0, 4, 'Y')
        elif axis == 'Y':
            rmat = Matrix.Rotation(-math.pi / 2.0, 4, 'X')
        if rot_euler is not None:
            er = Matrix.Identity(4)
            er.rotate(rot_euler)
            rmat = er @ rmat
        tmat = Matrix.Translation(center) @ rmat
        self._assign_and_bevel(verts, mat_name, bevel_w=bevel_w, bevel_segs=bevel_segs, transform=tmat)

    def add_extruded_profile(self, pts_2d, plane='YZ', c_min=-0.5, c_max=0.5, mat_name="Army_Green",
                             bevel_w=0.015, bevel_segs=1):
        m_id = self.mat_idx(mat_name)
        v_low = []
        v_high = []
        for u, v in pts_2d:
            if plane == 'YZ':
                p1 = Vector((c_min, u, v))
                p2 = Vector((c_max, u, v))
            elif plane == 'XZ':
                p1 = Vector((u, c_min, v))
                p2 = Vector((u, c_max, v))
            else:
                p1 = Vector((u, v, c_min))
                p2 = Vector((u, v, c_max))
            v_low.append(self.bm.verts.new(p1))
            v_high.append(self.bm.verts.new(p2))

        n = len(pts_2d)
        created_faces = []
        for i in range(n):
            ni = (i + 1) % n
            try:
                f = self.bm.faces.new((v_low[i], v_low[ni], v_high[ni], v_high[i]))
                f.material_index = m_id
                f.smooth = True
                created_faces.append(f)
            except ValueError:
                pass
        try:
            f1 = self.bm.faces.new(list(reversed(v_low)))
            f1.material_index = m_id
            f1.smooth = True
            created_faces.append(f1)
        except ValueError:
            pass
        try:
            f2 = self.bm.faces.new(v_high)
            f2.material_index = m_id
            f2.smooth = True
            created_faces.append(f2)
        except ValueError:
            pass

        all_verts = v_low + v_high
        bmesh.ops.recalc_face_normals(self.bm, faces=created_faces)
        if bevel_w > 0.0:
            vset = set(all_verts)
            edges = [e for e in self.bm.edges if e.verts[0] in vset and e.verts[1] in vset and len(e.link_faces) == 2]
            sharp = [e for e in edges if e.calc_face_angle(0.0) > 0.35]
            if sharp:
                res = bmesh.ops.bevel(
                    self.bm, geom=sharp, offset=bevel_w, offset_type='OFFSET',
                    segments=bevel_segs, profile=0.5, affect='EDGES', clamp_overlap=True
                )
                for f in res.get("faces", []):
                    f.material_index = m_id
                    f.smooth = True

    def add_lathe(self, profile_rh, center, axis='Z', segs=24, mat_name="Metal_Dark", cap_ends=True):
        """profile_rh: list of (radius, height_along_axis) oppure (radius, height, mat_name_override)."""
        rings = []
        for item in profile_rh:
            r = max(0.0005, item[0])
            h = item[1]
            ring = []
            for s in range(segs):
                ang = (2.0 * math.pi * s) / segs
                ca = math.cos(ang) * r
                sa = math.sin(ang) * r
                if axis == 'Z':
                    p = Vector((center[0] + ca, center[1] + sa, center[2] + h))
                elif axis == 'X':
                    p = Vector((center[0] + h, center[1] + ca, center[2] + sa))
                else:  # 'Y'
                    p = Vector((center[0] + ca, center[1] + h, center[2] + sa))
                ring.append(self.bm.verts.new(p))
            rings.append((ring, item[2] if len(item) > 2 else mat_name))

        created_faces = []
        for i in range(len(rings) - 1):
            r1, m_name1 = rings[i]
            r2, m_name2 = rings[i + 1]
            m_id = self.mat_idx(m_name2 if len(profile_rh[i + 1]) > 2 else m_name1)
            for s in range(segs):
                ns = (s + 1) % segs
                try:
                    f = self.bm.faces.new((r1[s], r1[ns], r2[ns], r2[s]))
                    f.material_index = m_id
                    f.smooth = True
                    created_faces.append(f)
                except ValueError:
                    pass

        if cap_ends and len(rings) >= 2:
            m_start = self.mat_idx(rings[0][1])
            m_end = self.mat_idx(rings[-1][1])
            try:
                f0 = self.bm.faces.new(list(reversed(rings[0][0])))
                f0.material_index = m_start
                f0.smooth = True
                created_faces.append(f0)
            except ValueError:
                pass
            try:
                f1 = self.bm.faces.new(rings[-1][0])
                f1.material_index = m_end
                f1.smooth = True
                created_faces.append(f1)
            except ValueError:
                pass

        bmesh.ops.recalc_face_normals(self.bm, faces=created_faces)

    def add_loft(self, rings_3d, mat_name="Army_Green", cap_ends=True, closed_ring=True):
        m_id = self.mat_idx(mat_name)
        v_rings = []
        for r in rings_3d:
            v_rings.append([self.bm.verts.new(Vector(p)) for p in r])

        created_faces = []
        for i in range(len(v_rings) - 1):
            r1 = v_rings[i]
            r2 = v_rings[i + 1]
            n = len(r1)
            limit = n if closed_ring else n - 1
            for s in range(limit):
                ns = (s + 1) % n
                try:
                    f = self.bm.faces.new((r1[s], r1[ns], r2[ns], r2[s]))
                    f.material_index = m_id
                    f.smooth = True
                    created_faces.append(f)
                except ValueError:
                    pass

        if cap_ends and closed_ring and len(v_rings) >= 2:
            try:
                f0 = self.bm.faces.new(list(reversed(v_rings[0])))
                f0.material_index = m_id
                f0.smooth = True
                created_faces.append(f0)
            except ValueError:
                pass
            try:
                f1 = self.bm.faces.new(v_rings[-1])
                f1.material_index = m_id
                f1.smooth = True
                created_faces.append(f1)
            except ValueError:
                pass

        bmesh.ops.recalc_face_normals(self.bm, faces=created_faces)

    def add_tube_segment(self, p1, p2, radius, segs=8, mat_name="Metal_Dark", bevel_w=0.0):
        v1 = Vector(p1)
        v2 = Vector(p2)
        diff = v2 - v1
        length = diff.length
        if length < 1e-5:
            return
        mid = (v1 + v2) * 0.5
        quat = Vector((0.0, 0.0, 1.0)).rotation_difference(diff.normalized())
        res = bmesh.ops.create_cone(
            self.bm, cap_ends=True, cap_tris=False, segments=segs,
            radius1=radius, radius2=radius, depth=length
        )
        tmat = Matrix.Translation(mid) @ quat.to_matrix().to_4x4()
        self._assign_and_bevel(res["verts"], mat_name, bevel_w=bevel_w, bevel_segs=1, transform=tmat)

    def finalize(self, apply_bevel_mod=True, bevel_width=0.012, angle_deg=35.0):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0005)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)

        mesh = bpy.data.meshes.new(self.name)
        for m in self.mat_list:
            mesh.materials.append(m)
        self.bm.to_mesh(mesh)
        self.bm.free()

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = self.parent
        obj.location = (0.0, 0.0, 0.0)

        if apply_bevel_mod and bevel_width > 0.0:
            mod = obj.modifiers.new(name="HardSurfaceBevel", type='BEVEL')
            mod.width = bevel_width
            mod.segments = 1
            mod.limit_method = 'ANGLE'
            mod.angle_limit = math.radians(32.0)
            mod.use_clamp_overlap = True
            depsgraph = bpy.context.evaluated_depsgraph_get()
            eval_obj = obj.evaluated_get(depsgraph)
            new_mesh = bpy.data.meshes.new_from_object(eval_obj)
            old_mesh = obj.data
            obj.modifiers.clear()
            obj.data = new_mesh
            bpy.data.meshes.remove(old_mesh)

        apply_smooth_by_angle_and_triangulate(obj, angle_deg=angle_deg)
        return obj


def apply_smooth_by_angle_and_triangulate(obj, angle_deg=35.0):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=bm.faces, quad_method='BEAUTY', ngon_method='BEAUTY')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    angle_rad = math.radians(angle_deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2:
            if e.calc_face_angle(0.0) > angle_rad:
                e.smooth = False
            else:
                e.smooth = True
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def create_root_empty(name):
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = 'PLAIN_AXES'
    root.location = (0.0, 0.0, 0.0)
    bpy.context.scene.collection.objects.link(root)
    return root


# ---------------------------------------------------------------------------
# 4. HELPER PER RUOTE SCOLPITE E COMPONENTI COMUNI
# ---------------------------------------------------------------------------
def build_sculpted_wheel(builder, center, radius, width, rim_radius, lug_count=20,
                         bolt_count=8, mat_rim="Desert_Tan", segs=24):
    cx, cy, cz = center
    sign = 1.0 if cx >= 0.0 else -1.0
    hw = width * 0.5
    # Profilo pneumatico + cerchione
    prof = [
        (0.001, -hw * 0.70, "Metal_Dark"),
        (rim_radius * 0.85, -hw * 0.70, mat_rim),
        (rim_radius, -hw * 0.82, mat_rim),
        (radius * 0.90, -hw * 0.96, "Rubber"),
        (radius * 0.95, -hw * 0.78, "Rubber"),
        (radius * 0.95, hw * 0.78, "Rubber"),
        (radius * 0.90, hw * 0.96, "Rubber"),
        (rim_radius, hw * 0.82, mat_rim),
        (rim_radius * 0.78, hw * 0.50, mat_rim),
        (rim_radius * 0.38, hw * 0.55, "Metal_Dark"),
        (rim_radius * 0.35, hw * 0.85, "Metal_Dark"),
        (0.001, hw * 0.85, "Metal_Dark"),
    ]
    if sign < 0:
        prof = [(r, -h, m) for (r, h, m) in reversed(prof)]
    builder.add_lathe(prof, center, axis='X', segs=segs, mat_name="Rubber")

    # Tasselli del battistrada scolpito (due file sfalsate)
    lug_h = radius * 0.055
    lug_w = width * 0.42
    lug_l = (2.0 * math.pi * radius / lug_count) * 0.58
    for i in range(lug_count):
        ang = (2.0 * math.pi * i) / lug_count
        for side in (-1, 1):
            a_off = ang + (0.5 * math.pi / lug_count if side > 0 else 0.0)
            ry = cy + math.cos(a_off) * (radius * 0.955)
            rz = cz + math.sin(a_off) * (radius * 0.955)
            rx = cx + side * (width * 0.22)
            from mathutils import Euler
            rot = Euler((a_off, 0.0, 0.0), 'XYZ')
            builder.add_box((rx, ry, rz), (lug_w, lug_h, lug_l), "Rubber", bevel_w=0.004, rot_euler=rot)

    # Bulloni sul cerchione
    for i in range(bolt_count):
        ang = (2.0 * math.pi * i) / bolt_count
        by = cy + math.cos(ang) * (rim_radius * 0.58)
        bz = cz + math.sin(ang) * (rim_radius * 0.58)
        bx = cx + sign * (hw * 0.62)
        builder.add_cylinder((bx, by, bz), radius * 0.032, 0.04, axis='X', segs=6, mat_name="Metal_Dark", bevel_w=0.002)


# ---------------------------------------------------------------------------
# 5. COSTRUZIONE DEI 12 OGGETTI MILITARI
# ---------------------------------------------------------------------------

# ================= 1. TANK (Leopard 2A6 / M1A2 Abrams, ~9.5 m) =============
def build_tank():
    root = create_root_empty("TANK")

    # --- A. SCAFO (TANK_Hull) ---
    hull = MeshPartBuilder("TANK_Hull", root)
    # Scafo centrale corazzato inclinato
    hull_pts = [
        (-3.85, 0.52),
        (-3.60, 0.38),
        (2.85, 0.38),
        (3.75, 0.88),
        (3.88, 1.05),
        (2.75, 1.44),
        (1.65, 1.48),
        (-1.85, 1.48),
        (-2.05, 1.56),
        (-3.75, 1.54),
        (-3.92, 1.25),
    ]
    hull.add_extruded_profile(hull_pts, plane='YZ', c_min=-1.12, c_max=1.12, mat_name="Army_Green", bevel_w=0.02, bevel_segs=1)

    # Sponson superiori e gonne laterali corazzate (Side Skirts) con pannelli modulari
    for side in (-1.0, 1.0):
        sx = side * 1.48
        hull.add_box((sx, -0.05, 1.24), (0.72, 7.45, 0.34), "Army_Green", bevel_w=0.015)
        # 7 Pannelli corazzati pesanti laterali (side skirts)
        for p in range(7):
            py = -3.15 + p * 1.04
            skirt_h = 0.62 if p < 5 else 0.72
            skirt_z = 0.84 if p < 5 else 0.88
            hull.add_box((side * 1.81, py, skirt_z), (0.09, 1.00, skirt_h), "Army_Green", bevel_w=0.012)
            # Cerniere superiori e tacche pedana
            hull.add_box((side * 1.85, py - 0.30, 1.15), (0.04, 0.12, 0.08), "Metal_Dark", bevel_w=0.005)
            hull.add_box((side * 1.85, py + 0.30, 1.15), (0.04, 0.12, 0.08), "Metal_Dark", bevel_w=0.005)

        # Parafanghi anteriori inclinati e posteriori
        hull.add_box((sx, 3.75, 1.10), (0.70, 0.42, 0.14), "Army_Green", bevel_w=0.012,
                     rot_euler=Matrix.Rotation(math.radians(-22), 3, 'X').to_euler())
        # Fari anteriori con gabbia + lente luminosa
        hull.add_box((side * 1.38, 3.72, 1.26), (0.24, 0.18, 0.18), "Metal_Dark", bevel_w=0.008)
        hull.add_cylinder((side * 1.38, 3.80, 1.26), 0.065, 0.05, axis='Y', segs=12, mat_name="Light_Emit", bevel_w=0.003)
        # Ganci di traino anteriori e posteriori
        hull.add_box((side * 0.85, 3.88, 0.78), (0.12, 0.18, 0.16), "Metal_Dark", bevel_w=0.01)
        hull.add_box((side * 0.85, -3.90, 0.78), (0.12, 0.18, 0.16), "Metal_Dark", bevel_w=0.01)

    # Botola pilota e 3 periscopi in vetro scuro
    hull.add_cylinder((0.35, 2.35, 1.49), 0.36, 0.08, axis='Z', segs=16, mat_name="Army_Green", bevel_w=0.01)
    for px in (0.18, 0.35, 0.52):
        hull.add_box((px, 2.68, 1.51), (0.12, 0.10, 0.07), "Army_Green", bevel_w=0.005)
        hull.add_box((px, 2.73, 1.51), (0.10, 0.02, 0.045), "Glass_Dark", bevel_w=0.002)

    # Griglie vano motore posteriori e scarichi
    for side in (-1.0, 1.0):
        hull.add_cylinder((side * 0.58, -2.55, 1.56), 0.42, 0.04, axis='Z', segs=20, mat_name="Metal_Dark", bevel_w=0.005)
        for i in range(9):
            ly = -3.65 + i * 0.16
            hull.add_box((side * 0.62, ly, 1.56), (0.72, 0.07, 0.04), "Metal_Dark", bevel_w=0.004)
        # Griglie scarico posteriori
        hull.add_box((side * 0.70, -3.91, 1.15), (0.65, 0.08, 0.32), "Metal_Dark", bevel_w=0.008)

    hull.finalize(apply_bevel_mod=True, bevel_width=0.012)

    # --- B. CINGOLI E RUOTE (TANK_Tracks) ---
    tracks = MeshPartBuilder("TANK_Tracks", root)
    wheel_ys = [-2.70, -1.80, -0.90, 0.0, 0.90, 1.80, 2.70]
    for side in (-1.0, 1.0):
        tx = side * 1.48
        # 7 Coppie di ruote portanti (Road Wheels)
        for wy in wheel_ys:
            for offset_x in (-0.18, 0.18):
                wx = tx + offset_x
                tracks.add_cylinder((wx, wy, 0.42), 0.36, 0.13, axis='X', segs=18, mat_name="Rubber", bevel_w=0.008)
                tracks.add_cylinder((wx, wy, 0.42), 0.27, 0.14, axis='X', segs=18, mat_name="Army_Green", bevel_w=0.008)
            tracks.add_cylinder((tx + side * 0.22, wy, 0.42), 0.11, 0.18, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.006)
            # Braccio barra di torsione
            tracks.add_box((tx - side * 0.20, wy + 0.14, 0.50), (0.14, 0.35, 0.12), "Metal_Dark", bevel_w=0.008)

        # Ruota tendicingolo anteriore (Idler) e Ruota motrice posteriore (Sprocket)
        for wy, is_sprocket in ((3.38, False), (-3.32, True)):
            tracks.add_cylinder((tx, wy, 0.68), 0.33, 0.54, axis='X', segs=18,
                                mat_name="Metal_Dark" if is_sprocket else "Army_Green", bevel_w=0.01)
            if is_sprocket:
                for t in range(12):
                    ang = (2.0 * math.pi * t) / 12.0
                    dy = wy + math.cos(ang) * 0.35
                    dz = 0.68 + math.sin(ang) * 0.35
                    tracks.add_box((tx, dy, dz), (0.58, 0.06, 0.06), "Metal_Dark", bevel_w=0.004)

        # 4 Rulli reggicingolo superiori
        for ry in (-2.1, -0.7, 0.7, 2.1):
            tracks.add_cylinder((tx, ry, 0.96), 0.11, 0.38, axis='X', segs=10, mat_name="Metal_Dark", bevel_w=0.005)

        # Anello del nastro cingolato + pattini scolpiti (Track Pads) lungo tutto il circuito
        track_loop = [
            (-2.85, 0.04), (2.85, 0.04), (3.62, 0.52), (3.68, 0.76), (3.42, 1.02),
            (-3.38, 1.02), (-3.64, 0.76), (-3.58, 0.50)
        ]
        n_tl = len(track_loop)
        for i in range(n_tl):
            y1, z1 = track_loop[i]
            y2, z2 = track_loop[(i + 1) % n_tl]
            seg_vec = Vector((0.0, y2 - y1, z2 - z1))
            seg_len = seg_vec.length
            ang_x = math.atan2(z2 - z1, y2 - y1)
            from mathutils import Euler
            erot = Euler((ang_x, 0.0, 0.0), 'XYZ')
            # Nastro metallico
            tracks.add_box((tx, (y1 + y2) * 0.5, (z1 + z2) * 0.5),
                           (0.60, seg_len + 0.04, 0.045), "Metal_Dark", bevel_w=0.005, rot_euler=erot)
            # Pattini in gomma lungo il tratto
            num_pads = max(2, int(seg_len / 0.17))
            for k in range(num_pads):
                t = (k + 0.5) / num_pads
                py = y1 + (y2 - y1) * t
                pz = z1 + (z2 - z1) * t
                # Normale esterna
                ny = -math.sin(ang_x) * 0.032
                nz = math.cos(ang_x) * 0.032
                tracks.add_box((tx - 0.14, py + ny, pz + nz), (0.24, 0.11, 0.035), "Rubber", bevel_w=0.004, rot_euler=erot)
                tracks.add_box((tx + 0.14, py + ny, pz + nz), (0.24, 0.11, 0.035), "Rubber", bevel_w=0.004, rot_euler=erot)

    tracks.finalize(apply_bevel_mod=False)

    # --- C. TORRETTA, CANNONE E MITRAGLIATRICE (TANK_Turret) ---
    turret = MeshPartBuilder("TANK_Turret", root)
    # Ralla della torretta
    turret.add_cylinder((0.0, 0.30, 1.50), 1.18, 0.12, axis='Z', segs=24, mat_name="Metal_Dark", bevel_w=0.01)

    # Corpo principale torretta con profilo a cuneo Leopard 2A6 / Abrams
    t_rings = [
        # Fondo torretta (z=1.54)
        [(-0.95, -2.15, 1.54), (0.95, -2.15, 1.54), (1.32, -0.35, 1.54),
         (1.22, 1.45, 1.54), (0.48, 2.05, 1.54), (-0.48, 2.05, 1.54),
         (-1.22, 1.45, 1.54), (-1.32, -0.35, 1.54)],
        # Metà torretta — punta del cuneo corazzato (z=1.88)
        [(-1.05, -2.35, 1.88), (1.05, -2.35, 1.88), (1.42, -0.30, 1.88),
         (1.30, 1.72, 1.88), (0.46, 2.52, 1.88), (-0.46, 2.52, 1.88),
         (-1.30, 1.72, 1.88), (-1.42, -0.30, 1.88)],
        # Tetto torretta (z=2.22)
        [(-0.96, -2.25, 2.22), (0.96, -2.25, 2.22), (1.22, -0.25, 2.22),
         (1.08, 1.42, 2.22), (0.44, 1.95, 2.22), (-0.44, 1.95, 2.22),
         (-1.08, 1.42, 2.22), (-1.22, -0.25, 2.22)],
    ]
    turret.add_loft(t_rings, mat_name="Army_Green", cap_ends=True, closed_ring=True)

    # Cesto portadotazioni posteriore (Bustle Rack) e cassette laterali
    turret.add_box((0.0, -2.68, 1.95), (1.92, 0.65, 0.46), "Metal_Dark", bevel_w=0.01)
    turret.add_box((-0.55, -2.68, 1.96), (0.65, 0.52, 0.42), "Desert_Tan", bevel_w=0.012)
    turret.add_box((0.52, -2.68, 1.96), (0.70, 0.50, 0.40), "Army_Green", bevel_w=0.012)
    for side in (-1.0, 1.0):
        # Cassette porta-attrezzi laterali in torretta
        turret.add_box((side * 1.38, -0.95, 1.88), (0.24, 1.15, 0.44), "Army_Green", bevel_w=0.012)
        # 4 Lanciagranate fumogene per lato
        for sg in range(4):
            sgy = 0.35 + sg * 0.16
            sgz = 1.92 + (sg % 2) * 0.12
            from mathutils import Euler
            srot = Euler((math.radians(55), 0.0, side * math.radians(-25)), 'XYZ')
            turret.add_cylinder((side * 1.36, sgy, sgz), 0.045, 0.28, axis='Z', segs=10,
                                mat_name="Army_Green", bevel_w=0.004, rot_euler=srot)

    # Ottica termica corazzata del cannoniere + CITV panoramico
    turret.add_box((0.68, 1.55, 2.38), (0.44, 0.52, 0.34), "Army_Green", bevel_w=0.012)
    turret.add_box((0.68, 1.81, 2.38), (0.30, 0.03, 0.20), "Glass_Dark", bevel_w=0.003)
    turret.add_cylinder((-0.42, 0.85, 2.40), 0.20, 0.36, axis='Z', segs=16, mat_name="Army_Green", bevel_w=0.01)
    turret.add_box((-0.42, 1.03, 2.44), (0.16, 0.06, 0.14), "Glass_Dark", bevel_w=0.003)

    # Mantelletto e Cannone da 120mm L/55 (lunghezza fino a Y = +5.60 -> totale carro ~9.52 m)
    turret.add_box((0.0, 2.15, 1.90), (0.82, 0.68, 0.52), "Army_Green", bevel_w=0.018)
    gun_prof = [
        (0.16, 2.20, "Army_Green"),
        (0.14, 3.05, "Army_Green"),
        (0.20, 3.12, "Army_Green"),  # Estrattore di fumi (Bore Evacuator)
        (0.20, 3.78, "Army_Green"),
        (0.12, 3.85, "Army_Green"),
        (0.115, 5.48, "Army_Green"),
        (0.135, 5.52, "Metal_Dark"), # Volata con MRS
        (0.135, 5.60, "Metal_Dark"),
        (0.065, 5.60, "Metal_Dark"),
        (0.060, 5.15, "Metal_Dark"),
    ]
    turret.add_lathe(gun_prof, (0.0, 0.0, 1.90), axis='Y', segs=24, mat_name="Army_Green", cap_ends=True)

    # Cupola capocarro + Mitragliatrice pesante in torretta + 2 Antenne
    turret.add_cylinder((-0.55, -0.25, 2.28), 0.42, 0.14, axis='Z', segs=18, mat_name="Army_Green", bevel_w=0.01)
    for a in range(6):
        ang = (2.0 * math.pi * a) / 6.0
        px = -0.55 + math.cos(ang) * 0.36
        py = -0.25 + math.sin(ang) * 0.36
        turret.add_box((px, py, 2.36), (0.08, 0.08, 0.06), "Glass_Dark", bevel_w=0.003)

    # Mitragliatrice in torretta (castello, cassetta munizioni, canna forata, impugnatura)
    turret.add_cylinder((-0.55, 0.12, 2.48), 0.04, 0.32, axis='Z', segs=8, mat_name="Metal_Dark", bevel_w=0.004)
    turret.add_box((-0.55, 0.18, 2.65), (0.12, 0.56, 0.14), "Metal_Dark", bevel_w=0.006)
    turret.add_box((-0.72, 0.22, 2.62), (0.22, 0.24, 0.18), "Army_Green", bevel_w=0.006)
    turret.add_cylinder((-0.55, 0.72, 2.66), 0.025, 0.65, axis='Y', segs=10, mat_name="Metal_Dark", bevel_w=0.003)
    turret.add_cylinder((-0.55, 0.55, 2.66), 0.042, 0.32, axis='Y', segs=10, mat_name="Metal_Dark", bevel_w=0.003)

    # Antenne radio posteriori
    for side in (-1.0, 1.0):
        turret.add_cylinder((side * 0.88, -2.25, 2.75), 0.018, 1.15, axis='Z', segs=8, mat_name="Metal_Dark", bevel_w=0.002)

    turret.finalize(apply_bevel_mod=True, bevel_width=0.012)
    return root


# ================= 2. HUMVEE (M1114 HMMWV 4x4, ~4.65 m) =====================
def build_humvee():
    root = create_root_empty("HUMVEE")

    # --- A. CARROZZERIA E TELAIO (HUMVEE_Body) ---
    body = MeshPartBuilder("HUMVEE_Body", root)
    # Longheroni telaio, assali e differenziali
    for sx in (-0.48, 0.48):
        body.add_box((sx, 0.0, 0.52), (0.10, 4.35, 0.16), "Metal_Dark", bevel_w=0.01)
    for ay in (-1.45, 1.55):
        body.add_cylinder((0.0, ay, 0.46), 0.07, 1.75, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.006)
        body.add_cylinder((0.0, ay, 0.46), 0.18, 0.28, axis='Y', segs=12, mat_name="Metal_Dark", bevel_w=0.008)
        for sx in (-0.65, 0.65):
            body.add_cylinder((sx, ay, 0.62), 0.08, 0.32, axis='Z', segs=10, mat_name="Metal_Dark", bevel_w=0.005)

    # Scocca centrale + cofano + tetto cabina + cassone posteriore
    body.add_box((0.0, -0.25, 0.92), (2.12, 3.30, 0.66), "Desert_Tan", bevel_w=0.018)
    # Cofano anteriore inclinato
    hood_pts = [
        (0.75, 0.62), (2.15, 0.62), (2.22, 1.10), (0.75, 1.26)
    ]
    body.add_extruded_profile(hood_pts, plane='YZ', c_min=-1.04, c_max=1.04, mat_name="Desert_Tan", bevel_w=0.018)
    # Griglia superiore cofano a lamelle
    for i in range(8):
        body.add_box((0.0, 1.25 + i * 0.08, 1.21 - i * 0.008), (0.95, 0.04, 0.04), "Metal_Dark", bevel_w=0.003)

    # Griglia radiatore anteriore iconica a 7 feritoie + fari rotondi
    body.add_box((0.0, 2.21, 0.92), (1.65, 0.08, 0.42), "Desert_Tan", bevel_w=0.01)
    for slot in range(-3, 4):
        body.add_box((slot * 0.13, 2.23, 0.92), (0.07, 0.06, 0.30), "Metal_Dark", bevel_w=0.004)
    for side in (-1.0, 1.0):
        body.add_cylinder((side * 0.66, 2.22, 0.94), 0.11, 0.08, axis='Y', segs=14, mat_name="Metal_Dark", bevel_w=0.005)
        body.add_cylinder((side * 0.66, 2.25, 0.94), 0.085, 0.04, axis='Y', segs=14, mat_name="Light_Emit", bevel_w=0.003)
        # Luci di posizione
        body.add_box((side * 0.88, 2.22, 0.94), (0.08, 0.06, 0.08), "Light_Emit", bevel_w=0.004)

    # Paraurti anteriore pesante con verricello e bull-bar + paraurti posteriore
    body.add_box((0.0, 2.34, 0.56), (2.10, 0.22, 0.24), "Metal_Dark", bevel_w=0.015)
    body.add_cylinder((0.0, 2.38, 0.58), 0.09, 0.48, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.006)
    body.add_box((0.0, 2.42, 0.88), (1.35, 0.08, 0.48), "Metal_Dark", bevel_w=0.012)
    body.add_box((0.0, -2.22, 0.58), (2.10, 0.18, 0.22), "Metal_Dark", bevel_w=0.015)

    # Tetto cabina e montanti + cassone posteriore inclinato (Slant-Back)
    body.add_box((0.0, -0.22, 1.84), (2.02, 1.95, 0.10), "Desert_Tan", bevel_w=0.015)
    slant_pts = [
        (-2.15, 1.22), (-1.18, 1.22), (-1.18, 1.86), (-2.12, 1.32)
    ]
    body.add_extruded_profile(slant_pts, plane='YZ', c_min=-1.00, c_max=1.00, mat_name="Desert_Tan", bevel_w=0.015)

    # Snorkel d'aspirazione e specchietti retrovisori
    body.add_cylinder((1.08, 0.72, 1.48), 0.065, 0.92, axis='Z', segs=12, mat_name="Rubber", bevel_w=0.006)
    body.add_cylinder((1.08, 0.72, 1.96), 0.11, 0.12, axis='Z', segs=12, mat_name="Metal_Dark", bevel_w=0.006)
    for side in (-1.0, 1.0):
        body.add_box((side * 1.16, 0.62, 1.48), (0.18, 0.08, 0.26), "Metal_Dark", bevel_w=0.006)

    body.finalize(apply_bevel_mod=True, bevel_width=0.012)

    # --- B. PORTIERE CORAZZATE E VETRI BALISTICI (HUMVEE_Doors_Glass) ---
    doors = MeshPartBuilder("HUMVEE_Doors_Glass", root)
    # Parabrezza diviso in due con cornice corazzata
    from mathutils import Euler
    w_rot = Euler((math.radians(-26), 0.0, 0.0), 'XYZ')
    doors.add_box((0.0, 0.68, 1.54), (1.98, 0.10, 0.62), "Desert_Tan", bevel_w=0.012, rot_euler=w_rot)
    for side in (-1.0, 1.0):
        doors.add_box((side * 0.48, 0.72, 1.55), (0.80, 0.06, 0.44), "Glass_Dark", bevel_w=0.005, rot_euler=w_rot)

        # 2 Portiere laterali corazzate per lato (anteriore e posteriore) con cerniere, maniglie e finestrini
        for dy, dw in ((0.22, 0.86), (-0.72, 0.82)):
            # Pannello inferiore portiera
            doors.add_box((side * 1.06, dy, 0.98), (0.09, dw, 0.56), "Desert_Tan", bevel_w=0.012)
            # Cornice superiore portiera
            doors.add_box((side * 1.03, dy, 1.54), (0.08, dw, 0.54), "Desert_Tan", bevel_w=0.01)
            # Vetro balistico incassato
            doors.add_box((side * 1.05, dy, 1.55), (0.09, dw - 0.18, 0.36), "Glass_Dark", bevel_w=0.004)
            # Cerniere esterne pesanti e maniglia a X
            doors.add_box((side * 1.10, dy + dw * 0.38, 1.12), (0.04, 0.09, 0.08), "Metal_Dark", bevel_w=0.004)
            doors.add_box((side * 1.10, dy + dw * 0.38, 0.84), (0.04, 0.09, 0.08), "Metal_Dark", bevel_w=0.004)
            doors.add_box((side * 1.10, dy - dw * 0.32, 1.16), (0.04, 0.14, 0.06), "Metal_Dark", bevel_w=0.004)

    doors.finalize(apply_bevel_mod=True, bevel_width=0.01)

    # --- C. GOMME SCOLPITE 4x4 + RUOTA DI SCORTA (HUMVEE_Wheels) ---
    wheels = MeshPartBuilder("HUMVEE_Wheels", root)
    for sx in (-0.94, 0.94):
        for wy in (-1.45, 1.55):
            build_sculpted_wheel(wheels, (sx, wy, 0.46), radius=0.46, width=0.31,
                                 rim_radius=0.25, lug_count=18, bolt_count=8, mat_rim="Desert_Tan", segs=20)
    # Ruota di scorta montata su portaruota posteriore
    wheels.add_cylinder((0.35, -2.36, 0.98), 0.44, 0.28, axis='Y', segs=20, mat_name="Rubber", bevel_w=0.012)
    wheels.add_cylinder((0.35, -2.38, 0.98), 0.24, 0.28, axis='Y', segs=16, mat_name="Desert_Tan", bevel_w=0.01)
    wheels.finalize(apply_bevel_mod=False)

    # --- D. TORRETTA AD ANELLO CON SCUDATURA E MITRAGLIATRICE (HUMVEE_Turret) ---
    turret = MeshPartBuilder("HUMVEE_Turret", root)
    tx, ty, tz = 0.0, -0.15, 1.92
    # Anello girevole sul tetto
    turret.add_cylinder((tx, ty, tz), 0.52, 0.12, axis='Z', segs=24, mat_name="Metal_Dark", bevel_w=0.01)
    turret.add_cylinder((tx, ty, tz + 0.02), 0.42, 0.14, axis='Z', segs=24, mat_name="Desert_Tan", bevel_w=0.008)

    # Scudatura poligonale corazzata (Gunner Protection Kit) con visori blindati
    shield_angles = [-70, -35, 0, 35, 70, 180]
    for ang_deg in shield_angles:
        ang = math.radians(ang_deg)
        px = tx + math.sin(ang) * 0.48
        py = ty + math.cos(ang) * 0.48
        erot = Euler((0.0, 0.0, -ang), 'XYZ')
        turret.add_box((px, py, tz + 0.26), (0.34, 0.06, 0.42), "Desert_Tan", bevel_w=0.01, rot_euler=erot)
        if abs(ang_deg) <= 70:
            turret.add_box((px, py, tz + 0.34), (0.22, 0.07, 0.14), "Glass_Dark", bevel_w=0.003, rot_euler=erot)

    # Mitragliatrice calibro .50 su ralla
    turret.add_box((0.0, ty + 0.35, tz + 0.36), (0.14, 0.58, 0.16), "Metal_Dark", bevel_w=0.008)
    turret.add_box((-0.18, ty + 0.38, tz + 0.34), (0.22, 0.24, 0.20), "Army_Green", bevel_w=0.008)
    turret.add_cylinder((0.0, ty + 0.90, tz + 0.38), 0.028, 0.68, axis='Y', segs=10, mat_name="Metal_Dark", bevel_w=0.003)
    turret.add_cylinder((0.0, ty + 0.72, tz + 0.38), 0.048, 0.32, axis='Y', segs=10, mat_name="Metal_Dark", bevel_w=0.003)

    turret.finalize(apply_bevel_mod=True, bevel_width=0.01)
    return root


# ================= 3. TRUCK (Camion militare 6x6 con telone, ~7.8 m) =========
def build_truck():
    root = create_root_empty("TRUCK")

    # --- A. TELAIO, ASSALI E CABINA (TRUCK_Cab_Chassis) ---
    cab = MeshPartBuilder("TRUCK_Cab_Chassis", root)
    # Longheroni telaio a C, paraurti, serbatoi e 3 assali
    for sx in (-0.46, 0.46):
        cab.add_box((sx, 0.0, 0.82), (0.12, 7.55, 0.24), "Metal_Dark", bevel_w=0.012)
    for ay in (2.55, -1.35, -2.65):
        cab.add_cylinder((0.0, ay, 0.56), 0.085, 2.05, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.008)
        cab.add_cylinder((0.0, ay, 0.56), 0.22, 0.34, axis='Y', segs=12, mat_name="Metal_Dark", bevel_w=0.01)

    # Serbatoi carburante laterali, cassetta batterie e scarico verticale
    cab.add_cylinder((-0.92, 0.65, 0.78), 0.28, 1.15, axis='Y', segs=16, mat_name="Metal_Dark", bevel_w=0.01)
    cab.add_box((0.90, 0.65, 0.78), (0.52, 0.95, 0.48), "Metal_Dark", bevel_w=0.012)
    cab.add_cylinder((-1.08, 1.38, 2.15), 0.065, 2.10, axis='Z', segs=10, mat_name="Metal_Dark", bevel_w=0.005)

    # Paraurti anteriore pesante con fari
    cab.add_box((0.0, 3.82, 0.78), (2.42, 0.24, 0.32), "Metal_Dark", bevel_w=0.015)
    for side in (-1.0, 1.0):
        cab.add_cylinder((side * 0.88, 3.92, 0.80), 0.095, 0.06, axis='Y', segs=12, mat_name="Light_Emit", bevel_w=0.004)

    # Cabina militare e cofano anteriore
    cab_pts = [
        (1.45, 0.95), (3.72, 0.95), (3.78, 1.72), (2.82, 1.88),
        (2.55, 2.65), (1.45, 2.68)
    ]
    cab.add_extruded_profile(cab_pts, plane='YZ', c_min=-1.18, c_max=1.18, mat_name="Army_Green", bevel_w=0.02)

    # Griglia radiatore anteriore
    cab.add_box((0.0, 3.76, 1.36), (1.52, 0.08, 0.56), "Metal_Dark", bevel_w=0.01)
    for i in range(-4, 5):
        cab.add_box((i * 0.15, 3.79, 1.36), (0.06, 0.06, 0.46), "Army_Green", bevel_w=0.004)

    # Parabrezza diviso in due + finestrini portiere + specchietti + botola tetto
    from mathutils import Euler
    w_rot = Euler((math.radians(-18), 0.0, 0.0), 'XYZ')
    for side in (-1.0, 1.0):
        cab.add_box((side * 0.54, 2.68, 2.26), (0.88, 0.06, 0.54), "Glass_Dark", bevel_w=0.005, rot_euler=w_rot)
        # Portiera cabina e finestrino laterale
        cab.add_box((side * 1.19, 2.05, 1.65), (0.06, 0.92, 1.12), "Army_Green", bevel_w=0.012)
        cab.add_box((side * 1.20, 2.06, 2.22), (0.07, 0.72, 0.48), "Glass_Dark", bevel_w=0.004)
        # Passaruota anteriore e gradini di salita
        cab.add_box((side * 1.08, 2.55, 1.12), (0.36, 1.25, 0.14), "Army_Green", bevel_w=0.012)
        cab.add_box((side * 1.16, 1.95, 0.72), (0.22, 0.42, 0.06), "Metal_Dark", bevel_w=0.006)
        # Specchietto retrovisore
        cab.add_box((side * 1.32, 2.48, 2.18), (0.14, 0.08, 0.36), "Metal_Dark", bevel_w=0.006)

    cab.add_cylinder((0.52, 1.95, 2.70), 0.34, 0.08, axis='Z', segs=16, mat_name="Army_Green", bevel_w=0.01)
    cab.finalize(apply_bevel_mod=True, bevel_width=0.012)

    # --- B. CASSONE DI CARICO E TELONE SAGOMATO (TRUCK_Bed_Canopy) ---
    bed = MeshPartBuilder("TRUCK_Bed_Canopy", root)
    # Pianale e sponde laterali nervate
    bed.add_box((0.0, -1.25, 1.12), (2.46, 5.15, 0.16), "Army_Green", bevel_w=0.015)
    for side in (-1.0, 1.0):
        bed.add_box((side * 1.19, -1.25, 1.48), (0.08, 5.12, 0.58), "Army_Green", bevel_w=0.012)
        for p in range(9):
            py = -3.65 + p * 0.60
            bed.add_box((side * 1.23, py, 1.44), (0.05, 0.08, 0.64), "Army_Green", bevel_w=0.006)
    # Sponda posteriore
    bed.add_box((0.0, -3.80, 1.48), (2.38, 0.08, 0.58), "Army_Green", bevel_w=0.012)

    # Telone militare (Canvas) sagomato con centine sporgenti e pieghe realistiche
    canopy_rings = []
    num_sec = 17
    for s in range(num_sec):
        t = s / (num_sec - 1)
        y = -3.76 + t * 5.02
        # Leggero avvallamento del telo tra una centina e l'altra
        rib_factor = math.cos(t * 6.0 * math.pi) ** 2
        sag = -0.028 * (1.0 - rib_factor)
        w = 1.18 + 0.015 * rib_factor
        ring = [
            (-w, y, 1.74),
            (-w - 0.02, y, 2.48 + sag),
            (-0.88, y, 2.96 + sag),
            (-0.35, y, 3.16 + sag),
            (0.35, y, 3.16 + sag),
            (0.88, y, 2.96 + sag),
            (w + 0.02, y, 2.48 + sag),
            (w, y, 1.74),
        ]
        canopy_rings.append(ring)
    bed.add_loft(canopy_rings, mat_name="Canvas", cap_ends=True, closed_ring=True)

    # Cinghie e occhielli di fissaggio del telone lungo i fianchi
    for side in (-1.0, 1.0):
        for p in range(8):
            py = -3.45 + p * 0.62
            bed.add_box((side * 1.22, py, 1.72), (0.04, 0.06, 0.16), "Canvas", bevel_w=0.004)

    bed.finalize(apply_bevel_mod=True, bevel_width=0.012)

    # --- C. 6 RUOTE SCOLPITE + RUOTA DI SCORTA (TRUCK_Wheels) ---
    wheels = MeshPartBuilder("TRUCK_Wheels", root)
    for sx in (-1.04, 1.04):
        for wy in (2.55, -1.35, -2.65):
            build_sculpted_wheel(wheels, (sx, wy, 0.56), radius=0.56, width=0.36,
                                 rim_radius=0.30, lug_count=18, bolt_count=8, mat_rim="Army_Green", segs=20)
    # Ruota di scorta verticale tra cabina e cassone
    wheels.add_cylinder((0.82, 1.32, 1.48), 0.52, 0.32, axis='X', segs=18, mat_name="Rubber", bevel_w=0.01)
    wheels.finalize(apply_bevel_mod=False)
    return root


# ================= 4. HELI (UH-60 Black Hawk, ~19.7 m con rotori) ============
def build_heli():
    root = create_root_empty("HELI")

    # --- A. FUSOLIERA, MOTORI E TRONCONE DI CODA (HELI_Fuselage) ---
    fuse = MeshPartBuilder("HELI_Fuselage", root)

    def make_fuse_ring(y, cx, cz, rx, rz_top, rz_bot, squareness=0.5):
        pts = []
        n = 12
        for i in range(n):
            ang = (2.0 * math.pi * i) / n
            ca = math.cos(ang)
            sa = math.sin(ang)
            sx = math.copysign(abs(ca) ** (1.0 - 0.45 * squareness), ca) * rx
            rz = rz_top if sa >= 0 else rz_bot
            sz = math.copysign(abs(sa) ** (1.0 - 0.45 * squareness), sa) * rz
            pts.append((cx + sx, y, cz + sz))
        return pts

    # Lofting longitudinale dal muso (Y=+5.6) alla coda (Y=-9.2)
    fuse_sections = [
        make_fuse_ring(5.65, 0.0, 1.15, 0.18, 0.14, 0.14, 0.1),   # Punta radome
        make_fuse_ring(5.25, 0.0, 1.18, 0.68, 0.36, 0.34, 0.3),   # Muso
        make_fuse_ring(4.35, 0.0, 1.42, 1.06, 0.68, 0.58, 0.6),   # Cockpit anteriore
        make_fuse_ring(3.10, 0.0, 1.56, 1.22, 0.86, 0.72, 0.85),  # Inizio cabina
        make_fuse_ring(0.80, 0.0, 1.56, 1.24, 0.86, 0.72, 0.88),  # Centro cabina
        make_fuse_ring(-1.35, 0.0, 1.56, 1.18, 0.84, 0.70, 0.82), # Fine cabina
        make_fuse_ring(-2.85, 0.0, 1.66, 0.76, 0.62, 0.52, 0.5),  # Raccordo coda
        make_fuse_ring(-5.50, 0.0, 1.88, 0.42, 0.44, 0.38, 0.3),  # Trave di coda
        make_fuse_ring(-8.35, 0.0, 2.12, 0.26, 0.34, 0.28, 0.2),  # Base pilone
        make_fuse_ring(-9.15, 0.0, 2.25, 0.16, 0.24, 0.18, 0.2),  # Estremità coda
    ]
    fuse.add_loft(fuse_sections, mat_name="Army_Green", cap_ends=True, closed_ring=True)

    # Carenatura superiore trasmissione e 2 Gondole motore turboshaft (T700)
    fuse.add_box((0.0, 0.15, 2.58), (1.18, 3.65, 0.48), "Army_Green", bevel_w=0.03)
    for side in (-1.0, 1.0):
        nx = side * 0.76
        nacelle_prof = [
            (0.18, -1.65, "Metal_Dark"),
            (0.32, -1.25, "Metal_Dark"),
            (0.36, -0.45, "Army_Green"),
            (0.36, 1.25, "Army_Green"),
            (0.28, 1.85, "Army_Green"),
            (0.20, 1.92, "Metal_Dark"),
            (0.14, 1.72, "Metal_Dark"),
        ]
        fuse.add_lathe(nacelle_prof, (nx, 0.0, 2.62), axis='Y', segs=16, mat_name="Army_Green", cap_ends=True)

    # Pilone verticale di coda (Tail Fin) e Stabilizzatore orizzontale (Stabilator)
    tail_fin = [
        (-8.15, 2.10), (-9.15, 2.20), (-9.68, 4.45), (-8.95, 4.48)
    ]
    fuse.add_extruded_profile(tail_fin, plane='YZ', c_min=-0.14, c_max=0.14, mat_name="Army_Green", bevel_w=0.015)
    fuse.add_box((0.0, -8.95, 2.28), (4.25, 0.76, 0.12), "Army_Green", bevel_w=0.015)

    # Sponson laterali per il carrello principale
    for side in (-1.0, 1.0):
        fuse.add_box((side * 1.38, 1.25, 1.02), (0.48, 1.35, 0.28), "Army_Green", bevel_w=0.02)

    fuse.finalize(apply_bevel_mod=True, bevel_width=0.015)

    # --- B. PORTELLONI SCORREVOLI E VETRI COCKPIT (HELI_Doors_Glass) ---
    glass = MeshPartBuilder("HELI_Doors_Glass", root)
    from mathutils import Euler
    # Parabrezza anteriore a 4 pannelli + vetri superiori e inferiori (chin windows)
    for side in (-1.0, 1.0):
        w_rot1 = Euler((math.radians(-38), 0.0, side * math.radians(-12)), 'XYZ')
        w_rot2 = Euler((math.radians(-36), 0.0, side * math.radians(-32)), 'XYZ')
        glass.add_box((side * 0.34, 4.05, 1.88), (0.58, 0.08, 0.68), "Glass_Dark", bevel_w=0.005, rot_euler=w_rot1)
        glass.add_box((side * 0.84, 3.85, 1.84), (0.52, 0.08, 0.64), "Glass_Dark", bevel_w=0.005, rot_euler=w_rot2)
        glass.add_box((side * 0.78, 4.55, 1.22), (0.38, 0.46, 0.28), "Glass_Dark", bevel_w=0.005)
        # Portiera pilota e finestrino
        glass.add_box((side * 1.18, 3.15, 1.56), (0.08, 0.92, 1.12), "Army_Green", bevel_w=0.01)
        glass.add_box((side * 1.20, 3.15, 1.82), (0.09, 0.74, 0.52), "Glass_Dark", bevel_w=0.004)

        # Grande portellone scorrevole vano truppe con 2 finestrini rettangolari
        glass.add_box((side * 1.26, 0.25, 1.54), (0.09, 2.35, 1.28), "Army_Green", bevel_w=0.012)
        glass.add_box((side * 1.28, 0.82, 1.72), (0.10, 0.78, 0.48), "Glass_Dark", bevel_w=0.004)
        glass.add_box((side * 1.28, -0.32, 1.72), (0.10, 0.78, 0.48), "Glass_Dark", bevel_w=0.004)
        # Finestrino mitragliere
        glass.add_box((side * 1.22, 2.02, 1.72), (0.09, 0.62, 0.52), "Glass_Dark", bevel_w=0.004)

    glass.finalize(apply_bevel_mod=True, bevel_width=0.01)

    # --- C. CARRELLO D'ATTERRAGGIO E PATTINO DI CODA (HELI_Landing_Gear) ---
    gear = MeshPartBuilder("HELI_Landing_Gear", root)
    for side in (-1.0, 1.0):
        # Puntoni oleopneumatici e bracci oscillanti
        gear.add_tube_segment((side * 1.22, 1.35, 1.85), (side * 1.58, 1.15, 0.36), 0.055, segs=10, mat_name="Metal_Dark")
        gear.add_tube_segment((side * 1.18, 1.55, 0.96), (side * 1.58, 1.15, 0.36), 0.06, segs=10, mat_name="Metal_Dark")
        # Ruota principale
        build_sculpted_wheel(gear, (side * 1.66, 1.15, 0.36), radius=0.36, width=0.22,
                             rim_radius=0.18, lug_count=14, bolt_count=6, mat_rim="Metal_Dark", segs=16)

    # Carrello di coda + pattino paracolpi (Tail Skid)
    gear.add_tube_segment((0.0, -7.85, 2.08), (0.0, -8.35, 0.24), 0.048, segs=10, mat_name="Metal_Dark")
    gear.add_cylinder((0.0, -8.35, 0.24), 0.24, 0.14, axis='X', segs=16, mat_name="Rubber", bevel_w=0.008)
    gear.add_cylinder((0.0, -8.35, 0.24), 0.12, 0.16, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.005)
    gear.add_tube_segment((0.0, -5.80, 1.55), (0.0, -6.55, 0.72), 0.035, segs=8, mat_name="Metal_Dark")
    gear.add_tube_segment((0.0, -7.25, 1.75), (0.0, -6.55, 0.72), 0.035, segs=8, mat_name="Metal_Dark")

    gear.finalize(apply_bevel_mod=False)

    # --- D. ROTORE PRINCIPALE A 4 PALE E ROTORE DI CODA (HELI_Rotors) ---
    rotors = MeshPartBuilder("HELI_Rotors", root)
    rx, ry, rz = 0.0, 0.55, 3.18
    # Albero rotore, piatto oscillante e mozzo a 4 bracci
    rotors.add_cylinder((rx, ry, rz - 0.22), 0.16, 0.52, axis='Z', segs=16, mat_name="Metal_Dark", bevel_w=0.01)
    rotors.add_cylinder((rx, ry, rz - 0.14), 0.34, 0.08, axis='Z', segs=16, mat_name="Metal_Dark", bevel_w=0.008)
    rotors.add_cylinder((rx, ry, rz + 0.06), 0.44, 0.16, axis='Z', segs=16, mat_name="Metal_Dark", bevel_w=0.012)

    # 4 Pale del rotore principale (raggio 8.15 m, profilo alare e swept tip UH-60)
    for b in range(4):
        base_ang = (math.pi * 0.5) * b + math.radians(25.0)
        ca = math.cos(base_ang)
        sa = math.sin(base_ang)
        # Braccio d'attacco
        rotors.add_box((rx + ca * 0.68, ry + sa * 0.68, rz + 0.06),
                       (0.24, 0.24, 0.12), "Metal_Dark", bevel_w=0.008)
        # Loft della pala con swept tip
        blade_rings = []
        radii_steps = [0.95, 2.5, 4.5, 6.5, 7.65, 8.15]
        for idx_r, r_dist in enumerate(radii_steps):
            sweep_lag = -0.32 if idx_r == len(radii_steps) - 1 else 0.0
            chord = 0.52 if idx_r < len(radii_steps) - 1 else 0.34
            thick = 0.055 if idx_r < len(radii_steps) - 1 else 0.028
            twist = math.radians(8.0 - idx_r * 1.8)
            bx = rx + ca * r_dist - sa * sweep_lag
            by = ry + sa * r_dist + ca * sweep_lag
            bz = rz + 0.06 - (r_dist * 0.012) # Leggero droop statico
            # 6 punti di profilo alare
            local_airfoil = [
                (0.50 * chord, 0.0),
                (0.20 * chord, 0.60 * thick),
                (-0.35 * chord, 0.45 * thick),
                (-0.50 * chord, 0.0),
                (-0.35 * chord, -0.35 * thick),
                (0.20 * chord, -0.40 * thick),
            ]
            ring = []
            for u, w in local_airfoil:
                ru = u * math.cos(twist) - w * math.sin(twist)
                rw = u * math.sin(twist) + w * math.cos(twist)
                px = bx - sa * ru
                py = by + ca * ru
                pz = bz + rw
                ring.append((px, py, pz))
            blade_rings.append(ring)
        rotors.add_loft(blade_rings, mat_name="Metal_Dark", cap_ends=True, closed_ring=True)

    # Rotore di coda a 4 pale (sul lato destro del pilone verticale)
    trx, try_pos, trz = 0.34, -9.35, 4.22
    rotors.add_cylinder((0.18, try_pos, trz), 0.14, 0.36, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.008)
    for b in range(4):
        ang = (math.pi * 0.5) * b + math.radians(15.0)
        by = try_pos + math.cos(ang) * 0.82
        bz = trz + math.sin(ang) * 0.82
        erot = Euler((ang, 0.0, 0.0), 'XYZ')
        rotors.add_box((trx, by, bz), (0.035, 1.45, 0.22), "Metal_Dark", bevel_w=0.005, rot_euler=erot)

    rotors.finalize(apply_bevel_mod=True, bevel_width=0.008)
    return root


# ================= 5. JERSEY (Barriera New Jersey in cemento 3 m) ===========
def build_jersey():
    root = create_root_empty("JERSEY")
    jb = MeshPartBuilder("JERSEY_Body", root)

    # Profilo New Jersey in XZ, estruso lungo Y per 3.0 m in 3 segmenti (per avere i 2 fori di drenaggio/muletto alla base)
    prof_full = [
        (-0.31, 0.0), (0.31, 0.0), (0.31, 0.08),
        (0.16, 0.34), (0.09, 1.00), (-0.09, 1.00),
        (-0.16, 0.34), (-0.31, 0.08)
    ]
    prof_arch = [
        (-0.31, 0.11), (0.31, 0.11),
        (0.16, 0.34), (0.09, 1.00), (-0.09, 1.00),
        (-0.16, 0.34)
    ]
    # Segmenti pieni (con piedi a terra z=0) e segmenti ad arco per le forche del muletto
    y_spans = [
        (-1.50, -0.95, prof_full),
        (-0.95, -0.35, prof_arch),
        (-0.35,  0.35, prof_full),
        ( 0.35,  0.95, prof_arch),
        ( 0.95,  1.50, prof_full),
    ]
    for y0, y1, p in y_spans:
        jb.add_extruded_profile(p, plane='XZ', c_min=y0, c_max=y1, mat_name="Concrete", bevel_w=0.018, bevel_segs=2)

    # Incastri maschio/femmina e ganci di sollevamento in ferro
    jb.add_box((0.0, 1.53, 0.50), (0.12, 0.08, 0.68), "Concrete", bevel_w=0.015)
    for hy in (-0.85, 0.85):
        jb.add_cylinder((0.0, hy, 1.02), 0.055, 0.03, axis='X', segs=12, mat_name="Metal_Dark", bevel_w=0.004)
    for sy in (-1.51, 1.55):
        jb.add_box((0.0, sy, 0.52), (0.08, 0.05, 0.24), "Metal_Dark", bevel_w=0.006)

    jb.finalize(apply_bevel_mod=True, bevel_width=0.015)
    return root


# ================= 6. SANDBAGS (Muretto di sacchi 2 m x 1 m alto) ===========
def build_sandbags():
    root = create_root_empty("SANDBAGS")
    sb = MeshPartBuilder("SANDBAGS_Wall", root)

    rng = random.Random(42)

    def add_single_sandbag(cx, cy, cz, length=0.46, width=0.28, height=0.145, yaw=0.0, seed=0):
        # Sacco singolo schiacciato con pancia, pieghe e collo arricciato
        sections = []
        s_steps = [-0.50, -0.40, -0.18, 0.0, 0.20, 0.38, 0.45, 0.52]
        scales_w = [0.68, 0.94, 1.04, 1.06, 1.02, 0.86, 0.32, 0.46]
        scales_h = [0.62, 0.92, 1.02, 0.96, 1.02, 0.84, 0.36, 0.42]
        ca = math.cos(yaw)
        sa = math.sin(yaw)
        for u, sw, sh in zip(s_steps, scales_w, scales_h):
            ly = u * length
            rx = (width * 0.5) * sw
            rz = (height * 0.5) * sh
            ring = []
            for k in range(8):
                ang = (2.0 * math.pi * k) / 8.0
                # Forma schiacciata sopra e sotto (superellisse)
                c_k = math.cos(ang)
                s_k = math.sin(ang)
                lx = math.copysign(abs(c_k) ** 0.75, c_k) * rx
                lz = math.copysign(abs(s_k) ** 0.65, s_k) * rz
                # Pieghe leggere sui fianchi
                crease = 1.0 + 0.04 * math.sin(u * 9.0 + k + seed)
                lx *= crease
                wx = cx + lx * ca - ly * sa
                wy = cy + lx * sa + ly * ca
                wz = cz + lz
                ring.append((wx, wy, wz))
            sections.append(ring)
        sb.add_loft(sections, mat_name="Burlap", cap_ends=True, closed_ring=True)

    # 7 Corsi orizzontali sfalsati fino a 1.0 m di altezza per 2.0 m di larghezza
    num_rows = 7
    row_h = 1.0 / num_rows
    bag_idx = 0
    for r in range(num_rows):
        cz = (r + 0.5) * row_h
        is_odd = (r % 2 == 1)
        count = 4 if not is_odd else 4
        for i in range(count):
            offset = 0.12 if is_odd else -0.12
            cy = -0.72 + i * 0.48 + offset + rng.uniform(-0.015, 0.015)
            cx = rng.uniform(-0.02, 0.02)
            yaw = rng.uniform(-0.07, 0.07) + (math.pi if (r + i) % 2 == 0 else 0.0)
            add_single_sandbag(cx, cy, cz, length=0.49, width=0.32, height=row_h * 1.06, yaw=yaw, seed=bag_idx)
            bag_idx += 1

    # Fila anteriore e posteriore di contrafforte alla base
    for side in (-1.0, 1.0):
        for i in range(3):
            cy = -0.52 + i * 0.52
            add_single_sandbag(side * 0.22, cy, row_h * 0.5, length=0.48, width=0.28, height=row_h * 1.02,
                               yaw=side * 0.08, seed=bag_idx)
            bag_idx += 1

    sb.finalize(apply_bevel_mod=False, angle_deg=50.0)
    return root


# ================= 7. CRATE (Cassa militare di legno + scritte in rilievo) ===
def build_crate():
    root = create_root_empty("CRATE")
    cb = MeshPartBuilder("CRATE_Body", root)

    # Dimensioni cassa: X = 0.72 m, Y = 1.20 m, Z = 0.66 m
    # 3 Travetti inferiori (Skids) a terra
    for sy in (-0.48, 0.0, 0.48):
        cb.add_box((0.0, sy, 0.03), (0.70, 0.10, 0.06), "Wood_Crate", bevel_w=0.01)

    # Assi orizzontali dei fianchi lunghi, corti, fondo e coperchio
    for i in range(5):
        pz = 0.11 + i * 0.105
        for side in (-1.0, 1.0):
            cb.add_box((side * 0.32, 0.0, pz), (0.03, 1.12, 0.098), "Wood_Crate", bevel_w=0.008)
        for end in (-1.0, 1.0):
            cb.add_box((0.0, end * 0.54, pz), (0.62, 0.03, 0.098), "Wood_Crate", bevel_w=0.008)

    # Assi del coperchio superiore e del fondo
    for i in range(6):
        px = -0.275 + i * 0.11
        cb.add_box((px, 0.0, 0.60), (0.102, 1.16, 0.03), "Wood_Crate", bevel_w=0.008)
        cb.add_box((px, 0.0, 0.075), (0.102, 1.12, 0.025), "Wood_Crate", bevel_w=0.008)

    # Cornici di rinforzo esterne e diagonali sui lati
    from mathutils import Euler
    for side in (-1.0, 1.0):
        sx = side * 0.35
        cb.add_box((sx, 0.0, 0.09), (0.03, 1.18, 0.06), "Wood_Crate", bevel_w=0.01)
        cb.add_box((sx, 0.0, 0.56), (0.03, 1.18, 0.06), "Wood_Crate", bevel_w=0.01)
        for py in (-0.56, 0.0, 0.56):
            cb.add_box((sx, py, 0.325), (0.03, 0.07, 0.42), "Wood_Crate", bevel_w=0.01)
        # Diagonali di controventatura
        d_rot1 = Euler((math.radians(36), 0.0, 0.0), 'XYZ')
        d_rot2 = Euler((math.radians(-36), 0.0, 0.0), 'XYZ')
        cb.add_box((sx, -0.28, 0.325), (0.028, 0.56, 0.06), "Wood_Crate", bevel_w=0.008, rot_euler=d_rot1)
        cb.add_box((sx,  0.28, 0.325), (0.028, 0.56, 0.06), "Wood_Crate", bevel_w=0.008, rot_euler=d_rot2)

    # Cantoniere metalliche, cerniere, chiusure a leva e maniglie
    for sx in (-0.355, 0.355):
        for sy in (-0.575, 0.575):
            for sz in (0.09, 0.59):
                cb.add_box((sx, sy, sz), (0.05, 0.08, 0.08), "Metal_Dark", bevel_w=0.005)
    for sy in (-0.36, 0.36):
        cb.add_box((0.365, sy, 0.54), (0.025, 0.06, 0.14), "Metal_Dark", bevel_w=0.004)
        cb.add_box((-0.365, sy, 0.55), (0.025, 0.05, 0.11), "Metal_Dark", bevel_w=0.004)
    for end in (-1.0, 1.0):
        cb.add_box((0.0, end * 0.575, 0.36), (0.18, 0.03, 0.09), "Metal_Dark", bevel_w=0.005)
        cb.add_box((0.0, end * 0.60, 0.33), (0.14, 0.03, 0.06), "Metal_Dark", bevel_w=0.004)

    # Scritte 3D in rilievo ("US ARMY" / "LOT-762" + frecce UP) con segmenti estrusi
    LETTER_SEGMENTS = {
        'U': [(-0.8, 0.0, 0.2, 2.0), (0.8, 0.0, 0.2, 2.0), (0.0, -0.8, 1.6, 0.25)],
        'S': [(0.0, 0.8, 1.6, 0.25), (-0.7, 0.4, 0.25, 0.8), (0.0, 0.0, 1.6, 0.25), (0.7, -0.4, 0.25, 0.8), (0.0, -0.8, 1.6, 0.25)],
        'A': [(-0.7, -0.1, 0.25, 1.8), (0.7, -0.1, 0.25, 1.8), (0.0, 0.8, 1.5, 0.25), (0.0, 0.0, 1.3, 0.25)],
        'R': [(-0.7, 0.0, 0.25, 2.0), (0.0, 0.8, 1.4, 0.25), (0.65, 0.4, 0.25, 0.8), (0.0, 0.0, 1.4, 0.25), (0.55, -0.5, 0.25, 0.9)],
        'M': [(-0.8, 0.0, 0.22, 2.0), (0.8, 0.0, 0.22, 2.0), (-0.3, 0.3, 0.22, 1.1), (0.3, 0.3, 0.22, 1.1), (0.0, 0.0, 0.3, 0.6)],
        'Y': [(-0.5, 0.45, 0.25, 1.0), (0.5, 0.45, 0.25, 1.0), (0.0, -0.45, 0.25, 1.1)],
    }
    text_str = "USARMY"
    for idx_ch, ch in enumerate(text_str):
        base_y = -0.35 + idx_ch * 0.14
        for (ox, oz, w, h) in LETTER_SEGMENTS[ch]:
            # In rilievo sul coperchio e sul fianco
            cb.add_box((oz * 0.045, base_y + ox * 0.032, 0.622),
                       (h * 0.042, w * 0.032, 0.016), "Metal_Dark", bevel_w=0.002)
            cb.add_box((0.342, base_y + ox * 0.032, 0.33 + oz * 0.042),
                       (0.016, w * 0.032, h * 0.040), "Desert_Tan", bevel_w=0.002)

    cb.finalize(apply_bevel_mod=True, bevel_width=0.01)
    return root


# ================= 8. AMMO_BOX (Cassetta munizioni metallica M2A1) ===========
def build_ammo_box():
    root = create_root_empty("AMMO_BOX")
    ab = MeshPartBuilder("AMMO_BOX_Mesh", root)

    # Corpo principale in lamiera stampata (X=0.16 m, Y=0.31 m, Z=0.195 m)
    ab.add_box((0.0, 0.0, 0.092), (0.155, 0.30, 0.176), "Army_Green", bevel_w=0.012, bevel_segs=2)

    # Nervature stampate in rilievo sui due fianchi
    for side in (-1.0, 1.0):
        sx = side * 0.079
        for iy in (-0.095, -0.032, 0.032, 0.095):
            ab.add_box((sx, iy, 0.088), (0.008, 0.024, 0.115), "Army_Green", bevel_w=0.003)
        ab.add_box((sx, 0.0, 0.032), (0.008, 0.23, 0.016), "Army_Green", bevel_w=0.003)

    # Guarnizione in gomma + Coperchio superiore stampato
    ab.add_box((0.0, 0.0, 0.178), (0.160, 0.306, 0.008), "Rubber", bevel_w=0.002)
    ab.add_box((0.0, 0.0, 0.190), (0.166, 0.314, 0.024), "Army_Green", bevel_w=0.01, bevel_segs=2)

    # Cerniera posteriore a rullino
    for iy in (-0.09, -0.03, 0.03, 0.09):
        ab.add_cylinder((0.0, -0.158, 0.178), 0.009, 0.24, axis='X', segs=10, mat_name="Metal_Dark", bevel_w=0.002)

    # Chiusura anteriore articolata a leva (Cam Latch) e anello
    ab.add_box((0.0, 0.162, 0.145), (0.068, 0.016, 0.085), "Army_Green", bevel_w=0.005)
    ab.add_box((0.0, 0.168, 0.125), (0.052, 0.014, 0.065), "Metal_Dark", bevel_w=0.004)
    ab.add_cylinder((0.0, 0.164, 0.182), 0.008, 0.074, axis='X', segs=10, mat_name="Metal_Dark", bevel_w=0.002)
    # Maniglia frontale a filo
    ab.add_tube_segment((-0.038, 0.162, 0.095), (-0.038, 0.178, 0.045), 0.005, segs=8, mat_name="Metal_Dark")
    ab.add_tube_segment(( 0.038, 0.162, 0.095), ( 0.038, 0.178, 0.045), 0.005, segs=8, mat_name="Metal_Dark")
    ab.add_tube_segment((-0.038, 0.178, 0.045), ( 0.038, 0.178, 0.045), 0.005, segs=8, mat_name="Metal_Dark")

    # Maniglia superiore pieghevole sul coperchio
    for sy in (-0.068, 0.068):
        ab.add_box((0.0, sy, 0.204), (0.042, 0.026, 0.012), "Metal_Dark", bevel_w=0.003)
    ab.add_tube_segment((-0.015, -0.062, 0.208), (-0.055, -0.055, 0.212), 0.006, segs=8, mat_name="Metal_Dark")
    ab.add_tube_segment((-0.015,  0.062, 0.208), (-0.055,  0.055, 0.212), 0.006, segs=8, mat_name="Metal_Dark")
    ab.add_tube_segment((-0.055, -0.055, 0.212), (-0.055,  0.055, 0.212), 0.007, segs=8, mat_name="Metal_Dark")

    ab.finalize(apply_bevel_mod=True, bevel_width=0.005)
    return root


# ================= 9. BARREL (Fusto 200 L con nervature e tappi) =============
def build_barrel():
    root = create_root_empty("BARREL")
    bb = MeshPartBuilder("BARREL_Mesh", root)

    # Profilo di rivoluzione ad alta fedeltà (altezza 0.88 m, diametro 0.58 m)
    prof = [
        (0.001, 0.016, "Army_Green"),
        (0.268, 0.016, "Army_Green"),
        (0.282, 0.000, "Metal_Dark"), # Orlo inferiore arrotolato a terra (z=0)
        (0.292, 0.004, "Metal_Dark"),
        (0.292, 0.022, "Metal_Dark"),
        (0.282, 0.026, "Army_Green"),
        (0.282, 0.265, "Army_Green"),
        (0.296, 0.285, "Army_Green"), # Prima nervatura principale (rolling hoop)
        (0.300, 0.300, "Army_Green"),
        (0.296, 0.315, "Army_Green"),
        (0.282, 0.335, "Army_Green"),
        (0.282, 0.425, "Desert_Tan"), # Fascia identificativa centrale
        (0.285, 0.440, "Desert_Tan"),
        (0.282, 0.455, "Desert_Tan"),
        (0.282, 0.545, "Army_Green"),
        (0.296, 0.565, "Army_Green"), # Seconda nervatura principale
        (0.300, 0.580, "Army_Green"),
        (0.296, 0.595, "Army_Green"),
        (0.282, 0.615, "Army_Green"),
        (0.282, 0.854, "Army_Green"),
        (0.292, 0.858, "Metal_Dark"), # Orlo superiore arrotolato
        (0.292, 0.880, "Metal_Dark"),
        (0.276, 0.880, "Metal_Dark"),
        (0.272, 0.862, "Army_Green"), # Piatto superiore incassato
        (0.195, 0.862, "Army_Green"),
        (0.185, 0.868, "Army_Green"), # Nervatura circolare sul piatto
        (0.175, 0.862, "Army_Green"),
        (0.001, 0.862, "Army_Green"),
    ]
    bb.add_lathe(prof, (0.0, 0.0, 0.0), axis='Z', segs=36, mat_name="Army_Green", cap_ends=True)

    # 2 Tappi filettati sul coperchio (2 pollici e 3/4 di pollice) con guarnizione
    # Tappo grande
    bb.add_cylinder((-0.155, 0.0, 0.865), 0.044, 0.008, axis='Z', segs=16, mat_name="Rubber", bevel_w=0.002)
    bb.add_cylinder((-0.155, 0.0, 0.874), 0.036, 0.016, axis='Z', segs=8, mat_name="Metal_Dark", bevel_w=0.003)
    bb.add_box((-0.155, 0.0, 0.883), (0.048, 0.012, 0.006), "Metal_Dark", bevel_w=0.002)
    # Tappo piccolo di sfiato
    bb.add_cylinder((0.155, 0.0, 0.865), 0.025, 0.007, axis='Z', segs=12, mat_name="Rubber", bevel_w=0.002)
    bb.add_cylinder((0.155, 0.0, 0.873), 0.019, 0.014, axis='Z', segs=6, mat_name="Metal_Dark", bevel_w=0.002)

    bb.finalize(apply_bevel_mod=False)
    return root


# ================= 10. LAMP (Lampione stradale 7 m con braccio) ==============
def build_lamp():
    root = create_root_empty("LAMP")
    lb = MeshPartBuilder("LAMP_Mesh", root)

    # Plinto ottagonale in cemento alla base (z=0..0.28)
    lb.add_cylinder((0.0, -0.75, 0.14), 0.28, 0.28, axis='Z', segs=8, mat_name="Concrete", bevel_w=0.015, r_top=0.24)
    # Piastra d'ancoraggio in acciaio + 4 bulloni + fazzoletti di irrigidimento
    lb.add_box((0.0, -0.75, 0.295), (0.34, 0.34, 0.03), "Metal_Dark", bevel_w=0.008)
    for bx in (-0.12, 0.12):
        for by in (-0.87, -0.63):
            lb.add_cylinder((bx, by, 0.32), 0.018, 0.04, axis='Z', segs=6, mat_name="Metal_Dark", bevel_w=0.003)

    # Palo rastremato fino a 6.45 m + sportello di ispezione
    lb.add_cylinder((0.0, -0.75, 3.38), 0.115, 6.15, axis='Z', segs=12, mat_name="Metal_Dark", bevel_w=0.01, r_top=0.068)
    lb.add_box((0.0, -0.64, 1.25), (0.11, 0.03, 0.42), "Metal_Dark", bevel_w=0.006)

    # Braccio curvo che sale a 7.0 m di altezza e si estende in avanti (+Y)
    arm_pts = [
        (0.0, -0.75, 6.35),
        (0.0, -0.58, 6.68),
        (0.0, -0.22, 6.88),
        (0.0,  0.25, 6.96),
        (0.0,  0.72, 6.98),
    ]
    for i in range(len(arm_pts) - 1):
        lb.add_tube_segment(arm_pts[i], arm_pts[i + 1], 0.048, segs=10, mat_name="Metal_Dark")
    # Saetta tubolare di rinforzo sotto il braccio
    lb.add_tube_segment((0.0, -0.75, 5.75), (0.0, -0.05, 6.86), 0.032, segs=8, mat_name="Metal_Dark")

    # Plafoniera stradale (Cobra-head) a 7.0 m con alette, vetro e sorgente luminosa calda ("Light_Emit")
    lb.add_box((0.0, 0.96, 6.96), (0.34, 0.62, 0.12), "Metal_Dark", bevel_w=0.018, bevel_segs=2)
    for i in range(5):
        lb.add_box((0.0, 0.78 + i * 0.09, 7.02), (0.28, 0.03, 0.03), "Metal_Dark", bevel_w=0.004)
    lb.add_box((0.0, 0.98, 6.90), (0.26, 0.44, 0.03), "Glass_Dark", bevel_w=0.005)
    lb.add_box((0.0, 0.98, 6.885), (0.22, 0.38, 0.02), "Light_Emit", bevel_w=0.004)

    lb.finalize(apply_bevel_mod=True, bevel_width=0.008)
    return root


# ================= 11. GENERATOR (Generatore militare su ruote) ==============
def build_generator():
    root = create_root_empty("GENERATOR")
    gb = MeshPartBuilder("GENERATOR_Mesh", root)

    # Telaio rimorchio + timone triangolare in avanti (+Y) + occhione di traino
    gb.add_box((0.0, -0.25, 0.44), (1.16, 1.58, 0.12), "Metal_Dark", bevel_w=0.012)
    gb.add_tube_segment((-0.48, 0.52, 0.44), (0.0, 1.32, 0.44), 0.042, segs=8, mat_name="Metal_Dark")
    gb.add_tube_segment(( 0.48, 0.52, 0.44), (0.0, 1.32, 0.44), 0.042, segs=8, mat_name="Metal_Dark")
    gb.add_cylinder((0.0, 1.40, 0.44), 0.075, 0.04, axis='Z', segs=12, mat_name="Metal_Dark", bevel_w=0.005)

    # Piedino d'appoggio anteriore con ruotino a z=0 + 2 stabilizzatori posteriori
    gb.add_cylinder((0.0, 1.05, 0.28), 0.032, 0.46, axis='Z', segs=10, mat_name="Metal_Dark", bevel_w=0.004)
    gb.add_cylinder((0.0, 1.05, 0.08), 0.08, 0.06, axis='X', segs=12, mat_name="Rubber", bevel_w=0.005)
    for sx in (-0.52, 0.52):
        gb.add_cylinder((sx, -0.96, 0.22), 0.028, 0.44, axis='Z', segs=8, mat_name="Metal_Dark", bevel_w=0.004)
        gb.add_box((sx, -0.96, 0.015), (0.12, 0.12, 0.03), "Metal_Dark", bevel_w=0.004)

    # Assale, parafanghi e 2 ruote scolpite (raggio 0.36 -> toccano z=0)
    gb.add_cylinder((0.0, -0.25, 0.36), 0.05, 1.42, axis='X', segs=10, mat_name="Metal_Dark", bevel_w=0.005)
    for side in (-1.0, 1.0):
        gb.add_box((side * 0.66, -0.25, 0.68), (0.24, 0.82, 0.06), "Army_Green", bevel_w=0.01)
        build_sculpted_wheel(gb, (side * 0.68, -0.25, 0.36), radius=0.36, width=0.22,
                             rim_radius=0.19, lug_count=14, bolt_count=6, mat_rim="Army_Green", segs=16)

    # Cofanatura insonorizzata del gruppo elettrogeno con tetto spiovente
    gen_pts = [
        (-0.54, 0.50), (0.54, 0.50), (0.54, 1.32), (0.0, 1.42), (-0.54, 1.32)
    ]
    gb.add_extruded_profile(gen_pts, plane='XZ', c_min=-1.02, c_max=0.52, mat_name="Army_Green", bevel_w=0.018)

    # Sportelli laterali, griglie di aerazione a lamelle e pannello strumenti
    for side in (-1.0, 1.0):
        sx = side * 0.55
        gb.add_box((sx, 0.12, 0.92), (0.03, 0.58, 0.64), "Army_Green", bevel_w=0.008)
        for i in range(6):
            gb.add_box((sx, -0.58, 0.68 + i * 0.08), (0.04, 0.52, 0.04), "Metal_Dark", bevel_w=0.003)

    # Quadro elettrico posteriore con quadranti in vetro e spie luminose
    gb.add_box((0.0, -1.03, 0.96), (0.76, 0.04, 0.52), "Metal_Dark", bevel_w=0.008)
    for gx in (-0.22, 0.0, 0.22):
        gb.add_cylinder((gx, -1.05, 1.08), 0.065, 0.03, axis='Y', segs=12, mat_name="Glass_Dark", bevel_w=0.003)
    gb.add_cylinder((0.28, -1.05, 0.84), 0.025, 0.03, axis='Y', segs=10, mat_name="Light_Emit", bevel_w=0.003)

    # Tubo di scarico con marmitta e gancio di sollevamento sul tetto
    gb.add_cylinder((-0.26, 0.28, 1.56), 0.045, 0.34, axis='Z', segs=10, mat_name="Metal_Dark", bevel_w=0.004)
    gb.add_box((0.0, -0.25, 1.46), (0.04, 0.16, 0.12), "Metal_Dark", bevel_w=0.005)

    gb.finalize(apply_bevel_mod=True, bevel_width=0.01)
    return root


# ================= 12. ANTENNA (Traliccio radio 12 m reticolare) =============
def build_antenna():
    root = create_root_empty("ANTENNA")
    ab = MeshPartBuilder("ANTENNA_Tower", root)

    # Base in cemento a terra (z=0..0.32) + armadio radio trasmettitore
    ab.add_box((0.0, 0.0, 0.16), (1.65, 1.65, 0.32), "Concrete", bevel_w=0.02)
    ab.add_box((0.0, -0.58, 0.68), (0.68, 0.42, 0.72), "Army_Green", bevel_w=0.012)

    # Torre reticolare a 4 montanti rastremata da z=0.30 a z=10.40 m (9 campate)
    bay_z = [0.30, 1.40, 2.50, 3.60, 4.70, 5.80, 6.90, 8.00, 9.20, 10.40]
    bay_w = [0.58, 0.53, 0.48, 0.43, 0.38, 0.34, 0.30, 0.26, 0.23, 0.20]

    def corners_at(idx):
        w = bay_w[idx]
        z = bay_z[idx]
        return [(-w, -w, z), (w, -w, z), (w, w, z), (-w, w, z)]

    for i in range(len(bay_z) - 1):
        c_low = corners_at(i)
        c_high = corners_at(i + 1)
        for k in range(4):
            nk = (k + 1) % 4
            # Montante verticale d'angolo
            ab.add_tube_segment(c_low[k], c_high[k], 0.028, segs=6, mat_name="Metal_Dark")
            # Traversa orizzontale superiore
            ab.add_tube_segment(c_high[k], c_high[nk], 0.018, segs=6, mat_name="Metal_Dark")
            # Controventatura diagonale reticolare su ogni faccia
            if (i + k) % 2 == 0:
                ab.add_tube_segment(c_low[k], c_high[nk], 0.015, segs=6, mat_name="Metal_Dark")
            else:
                ab.add_tube_segment(c_low[nk], c_high[k], 0.015, segs=6, mat_name="Metal_Dark")

    # Piattaforma superiore a 10.40 m + Parabola ponte radio a 8.2 m + Antenne settoriali
    ab.add_box((0.0, 0.0, 10.42), (0.68, 0.68, 0.05), "Metal_Dark", bevel_w=0.008)
    ab.add_cylinder((0.0, 0.42, 8.20), 0.48, 0.18, axis='Y', segs=18, mat_name="Desert_Tan", bevel_w=0.012, r_top=0.32)
    for ang_deg in (0, 120, 240):
        ang = math.radians(ang_deg)
        px = math.sin(ang) * 0.36
        py = math.cos(ang) * 0.36
        from mathutils import Euler
        erot = Euler((0.0, 0.0, -ang), 'XYZ')
        ab.add_box((px, py, 9.85), (0.16, 0.08, 0.92), "Desert_Tan", bevel_w=0.008, rot_euler=erot)

    # Stelo omnidirezionale in vetta fino a 12.0 m + Fanale luminoso d'ostacolo ("Light_Emit")
    ab.add_cylinder((0.0, 0.0, 11.15), 0.024, 1.50, axis='Z', segs=8, mat_name="Metal_Dark", bevel_w=0.003, r_top=0.012)
    ab.add_cylinder((0.0, 0.0, 11.95), 0.055, 0.10, axis='Z', segs=12, mat_name="Light_Emit", bevel_w=0.005)

    ab.finalize(apply_bevel_mod=False)
    return root


# ---------------------------------------------------------------------------
# 6. ALLINEAMENTO ORIGINE A TERRA (z=0) E BILANCIAMENTO BUDGET TRIANGOLI
# ---------------------------------------------------------------------------
def get_mesh_children(root):
    return [obj for obj in root.children if obj.type == 'MESH']


def count_root_triangles(root):
    total = 0
    for obj in get_mesh_children(root):
        mesh = obj.data
        for poly in mesh.polygons:
            total += max(0, len(poly.vertices) - 2)
    return total


def align_root_to_ground_center(root):
    children = get_mesh_children(root)
    if not children:
        return
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in children:
        for v in obj.data.vertices:
            co = v.co
            if co.x < min_x: min_x = co.x
            if co.x > max_x: max_x = co.x
            if co.y < min_y: min_y = co.y
            if co.y > max_y: max_y = co.y
            if co.z < min_z: min_z = co.z
            if co.z > max_z: max_z = co.z

    cx = 0.5 * (min_x + max_x)
    cy = 0.5 * (min_y + max_y)
    shift = Vector((-cx, -cy, -min_z))

    for obj in children:
        mesh = obj.data
        for v in mesh.vertices:
            v.co += shift
        mesh.update()
        obj.location = (0.0, 0.0, 0.0)
        obj.rotation_euler = (0.0, 0.0, 0.0)
        obj.scale = (1.0, 1.0, 1.0)
    root.location = (0.0, 0.0, 0.0)
    root.rotation_euler = (0.0, 0.0, 0.0)
    root.scale = (1.0, 1.0, 1.0)


def enforce_triangle_budget(root, min_tris, max_tris):
    children = get_mesh_children(root)
    if not children:
        return 0

    for obj in children:
        apply_smooth_by_angle_and_triangulate(obj, angle_deg=35.0)

    total = count_root_triangles(root)

    # Se sotto il minimo, suddividiamo gli spigoli più lunghi in modo mirato
    guard = 0
    while total < min_tris and guard < 8:
        guard += 1
        target_obj = max(children, key=lambda o: len(o.data.polygons))
        bm = bmesh.new()
        bm.from_mesh(target_obj.data)
        deficit = (min_tris + 350) - total
        edges_needed = max(10, min(len(bm.edges), int(deficit / 1.8)))
        sorted_edges = sorted(bm.edges, key=lambda e: e.calc_length(), reverse=True)
        bmesh.ops.subdivide_edges(bm, edges=sorted_edges[:edges_needed], cuts=1, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=bm.faces)
        bm.to_mesh(target_obj.data)
        bm.free()
        apply_smooth_by_angle_and_triangulate(target_obj, angle_deg=35.0)
        total = count_root_triangles(root)

    # Se sopra il massimo, riduciamo proporzionalmente con Decimate applicato
    guard = 0
    while total > max_tris and guard < 6:
        guard += 1
        target_total = int((min_tris + max_tris) * 0.55)
        ratio = max(0.15, min(0.92, target_total / float(total)))
        for obj in children:
            if len(obj.data.polygons) > 120:
                mod = obj.modifiers.new(name="BudgetDecimate", type='DECIMATE')
                mod.decimate_type = 'COLLAPSE'
                mod.ratio = ratio
                depsgraph = bpy.context.evaluated_depsgraph_get()
                eval_obj = obj.evaluated_get(depsgraph)
                new_mesh = bpy.data.meshes.new_from_object(eval_obj)
                old_mesh = obj.data
                obj.modifiers.clear()
                obj.data = new_mesh
                bpy.data.meshes.remove(old_mesh)
                apply_smooth_by_angle_and_triangulate(obj, angle_deg=35.0)
        total = count_root_triangles(root)

    # Verifica finale che tutti i modificatori siano rimossi
    for obj in children:
        obj.modifiers.clear()

    align_root_to_ground_center(root)
    return count_root_triangles(root)


# ---------------------------------------------------------------------------
# 7. ESECUZIONE COSTRUZIONE ED EXPORT GLB
# ---------------------------------------------------------------------------
def main():
    builders = [
        ("TANK",      build_tank,      8500, 28500),
        ("HUMVEE",    build_humvee,    8500, 28500),
        ("TRUCK",     build_truck,     8500, 28500),
        ("HELI",      build_heli,      8500, 28500),
        ("JERSEY",    build_jersey,     350,  2850),
        ("SANDBAGS",  build_sandbags,   350,  2850),
        ("CRATE",     build_crate,      350,  2850),
        ("AMMO_BOX",  build_ammo_box,   350,  2850),
        ("BARREL",    build_barrel,     350,  2850),
        ("LAMP",      build_lamp,       350,  2850),
        ("GENERATOR", build_generator,  350,  2850),
        ("ANTENNA",   build_antenna,    350,  2850),
    ]

    tri_counts = {}
    for name, fn, min_t, max_t in builders:
        root = fn()
        align_root_to_ground_center(root)
        tris = enforce_triangle_budget(root, min_t, max_t)
        tri_counts[name] = tris

    out_dir = os.path.dirname(os.path.abspath(OUTPUT_PATH))
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_PATH,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )

    print("OK props.glb")
    for name, _, _, _ in builders:
        print(f"{name}: {tri_counts[name]} triangoli")

if __name__ == "__main__":
    main()
