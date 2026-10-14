# armi.py
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.geometry import tessellate_polygon

bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
TAU = math.tau


def material(name, color, metallic, roughness, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    if name == 'Lens':
        p.inputs['Transmission Weight'].default_value = .18
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = 12
    return m


M = {
    'Metal_Black': material('Metal_Black', (.035, .035, .038), .85, .42),
    'Polymer': material('Polymer', (.05, .05, .055), 0, .65),
    'FDE': material('FDE', (.42, .33, .22), 0, .6),
    'Steel': material('Steel', (.5, .51, .53), 1, .3),
    'Lens': material('Lens', (.022, .085, .16), .3, .05),
    'Red_Dot': material(
        'Red_Dot', (1, .005, .002), 0, .15, (1, .005, .002)
    ),
    'Olive': material('Olive', (.16, .22, .11), .12, .55),
    'Brass': material('Brass', (.78, .57, .18), .95, .28),
}


def empty(name, p=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    o.empty_display_type = 'PLAIN_AXES'
    o.empty_display_size = .02
    o.parent = parent
    o.location = p
    return o


class Weapon:
    def __init__(self, name, muzzle, left):
        self.root = empty(name)
        empty('muzzle_' + name, muzzle, self.root)
        empty('lhand_' + name, left, self.root)
        self.groups = {}

    def add(self, verts, faces, mat='Metal_Black', bevel=.0008):
        key = (mat, bevel)
        v, f = self.groups.setdefault(key, ([], []))
        offset = len(v)
        v.extend(tuple(p) for p in verts)
        f.extend(tuple(offset + i for i in face) for face in faces)

    def finish(self):
        for (mat, width), (verts, faces) in self.groups.items():
            name = self.root.name + '_' + mat
            name += '_Rounded' if width else '_Turned'

            mesh = bpy.data.meshes.new(name)
            mesh.from_pydata(verts, [], faces)
            mesh.update()

            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(mesh)
            bm.free()

            o = bpy.data.objects.new(name, mesh)
            scene.collection.objects.link(o)
            o.parent = self.root
            mesh.materials.append(M[mat])

            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.context.view_layer.objects.active = o

            if width:
                mod = o.modifiers.new('Bevel', 'BEVEL')
                mod.width = width
                mod.segments = 2
                mod.limit_method = 'ANGLE'
                mod.angle_limit = math.radians(32)
                mod.use_clamp_overlap = True
                bpy.ops.object.modifier_apply(modifier=mod.name)

            bm = bmesh.new()
            bm.from_mesh(o.data)
            for face in bm.faces:
                face.smooth = True
            for edge in bm.edges:
                edge.smooth = (
                    len(edge.link_faces) == 2
                    and edge.calc_face_angle(0) < math.radians(35)
                )
            bm.to_mesh(o.data)
            bm.free()

            mod = o.modifiers.new('WeightedNormal', 'WEIGHTED_NORMAL')
            mod.keep_sharp = True
            mod.weight = 40
            bpy.ops.object.modifier_apply(modifier=mod.name)
            o.data.update()

        return self.root


def extrusion(w, yz, width, mat='Metal_Black', x=0, bevel=.0008):
    # Triangolare le sagome concave evita ponti attraverso le rientranze.
    n = len(yz)
    v = [(x - width / 2, y, z) for y, z in yz]
    v += [(x + width / 2, y, z) for y, z in yz]

    loop = [Vector((0, y, z)) for y, z in yz]
    faces = []
    for tri in tessellate_polygon([loop]):
        ids = list(tri)
        faces.extend([
            tuple(reversed(ids)),
            tuple(i + n for i in ids),
        ])

    faces += [
        (i, (i + 1) % n, (i + 1) % n + n, i + n)
        for i in range(n)
    ]
    w.add(v, faces, mat, bevel)


def frame(w, outer, inner, width, mat='Metal_Black', x=0, bevel=.0008):
    if len(outer) != len(inner):
        raise ValueError(
            'Le due sagome del telaio devono avere lo stesso numero di punti'
        )

    n = len(outer)
    v = [
        (a, y, z)
        for a in (x - width / 2, x + width / 2)
        for ring in (outer, inner)
        for y, z in ring
    ]
    f = []
    for i in range(n):
        j = (i + 1) % n
        f.extend([
            (i, j, n + j, n + i),
            (2*n+i, 3*n+i, 3*n+j, 2*n+j),
            (i, 2*n+i, 2*n+j, j),
            (n+i, n+j, 3*n+j, 3*n+i),
        ])
    w.add(v, f, mat, bevel)


def box(w, p, size, mat='Metal_Black', bevel=.0008, rotation=None):
    x, y, z = p
    sx, sy, sz = (a / 2 for a in size)
    v = [
        Vector((a*sx, b*sy, c*sz))
        for a, b, c in [
            (-1, -1, -1), (-1, 1, -1),
            (1, 1, -1), (1, -1, -1),
            (-1, -1, 1), (-1, 1, 1),
            (1, 1, 1), (1, -1, 1),
        ]
    ]
    if rotation is not None:
        v = [rotation @ a for a in v]
    v = [a + Vector((x, y, z)) for a in v]

    w.add(v, [
        (0, 3, 2, 1), (4, 5, 6, 7),
        (0, 1, 5, 4), (1, 2, 6, 5),
        (2, 3, 7, 6), (3, 0, 4, 7),
    ], mat, bevel)


def lathe(w, profile, center=(0, 0, 0), axis=(0, 1, 0),
          mat='Metal_Black', segments=12, closed=False):
    # I profili chiusi includono la parete interna delle bocche aperte.
    q = Vector((0, 1, 0)).rotation_difference(Vector(axis).normalized())
    c = Vector(center)
    v, rings, f = [], [], []

    for t, radius in profile:
        if radius == 0:
            rings.append([len(v)])
            v.append(c + q @ Vector((0, t, 0)))
        else:
            ring = []
            for i in range(segments):
                a = TAU * i / segments
                ring.append(len(v))
                v.append(
                    c + q @ Vector((
                        radius * math.cos(a),
                        t,
                        radius * math.sin(a),
                    ))
                )
            rings.append(ring)

    pairs = list(zip(rings, rings[1:]))
    if closed:
        pairs.append((rings[-1], rings[0]))

    for a, b in pairs:
        for i in range(segments):
            j = (i + 1) % segments
            if len(a) == 1 and len(b) == 1:
                break
            if len(a) == 1:
                f.append((a[0], b[j], b[i]))
            elif len(b) == 1:
                f.append((a[i], a[j], b[0]))
            else:
                f.append((a[i], a[j], b[j], b[i]))

    if not closed:
        if len(rings[0]) > 1:
            f.append(tuple(reversed(rings[0])))
        if len(rings[-1]) > 1:
            f.append(tuple(rings[-1]))

    w.add(v, f, mat, 0)


def rod(w, a, b, radius, mat='Metal_Black', segments=12, r_end=None):
    a, b = Vector(a), Vector(b)
    length = (b - a).length
    if length <= 0:
        raise ValueError('Asta di lunghezza nulla')

    r_end = radius if r_end is None else r_end
    ch = min(.0007, length / 8, radius / 5, r_end / 5)
    lathe(
        w,
        [(0, radius-ch), (ch, radius),
         (length-ch, r_end), (length, r_end-ch)],
        a, b-a, mat, segments,
    )


def tube(w, y0, y1, z, outer, inner, mat='Metal_Black',
         x=0, segments=12):
    ch = min(.0006, (outer-inner)/4, (y1-y0)/6)
    lathe(
        w,
        [(y0, outer-ch), (y0+ch, outer), (y1-ch, outer),
         (y1, outer-ch), (y1, inner), (y0, inner)],
        (x, 0, z),
        mat=mat,
        segments=segments,
        closed=True,
    )


def rounded_rect(sx, sy, radius, samples=3):
    hx, hy = sx / 2, sy / 2
    r = min(radius, hx*.8, hy*.8)
    pts = []

    for cx, cy, start in [
        (hx-r, hy-r, 0), (-hx+r, hy-r, 90),
        (-hx+r, -hy+r, 180), (hx-r, -hy+r, 270),
    ]:
        for i in range(samples + 1):
            a = math.radians(start + 90*i/samples)
            pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    return pts


def sweep(w, stations, mat='Polymer', bevel=.0008):
    v, f = [], []
    n = 16

    for y, z, sx, sy, tilt in stations:
        rot = Matrix.Rotation(math.radians(tilt), 3, 'X')
        v.extend(
            rot @ Vector((a, b, 0)) + Vector((0, y, z))
            for a, b in rounded_rect(sx, sy, min(sx, sy)*.22)
        )

    for k in range(len(stations) - 1):
        for i in range(n):
            j = (i + 1) % n
            f.append((k*n+i, k*n+j, (k+1)*n+j, (k+1)*n+i))

    f.extend([
        tuple(reversed(range(n))),
        tuple((len(stations)-1)*n+i for i in range(n)),
    ])
    w.add(v, f, mat, bevel)


def grip(w, mat='Polymer', y=0, top=.045, length=.11,
         width=.031, texture=True):
    stations = []
    t_hand = top / length
    hand_offset = -.032*t_hand + .003*math.sin(math.pi*t_hand)

    for i in range(9):
        t = i / 8
        stations.append((
            y-.032*t+.003*math.sin(math.pi*t)-hand_offset,
            top-length*t,
            width*(.91+.10*math.sin(math.pi*t)+.08*t),
            .039+.009*math.sin(math.pi*t)+.003*t,
            -18+8*t,
        ))
    sweep(w, stations, mat)

    if texture:
        for side in (-1, 1):
            for row in range(8):
                t = .25 + row*.078
                cy = y-.032*t+.003*math.sin(math.pi*t)-hand_offset
                z = top-length*t
                for col in range(4):
                    py = cy + (col-1.5)*.0072
                    px = (
                        side * width
                        * (.91+.1*math.sin(math.pi*t)+.08*t) / 2
                    )
                    rod(
                        w, (px, py, z), (px+side*.0009, py, z),
                        .00095, mat, 6,
                    )
        for i in range(3):
            t = .30+i*.19
            cy = y-.032*t+.003*math.sin(math.pi*t)-hand_offset
            box(
                w, (0, cy+.022, top-length*t),
                (width*.86, .003, .0028), mat, .0006,
            )


def trigger(w, back=.016, front=.073, top=.035, mat='Metal_Black'):
    outer = [
        (back, top), (front-.007, top), (front, top-.007),
        (front-.002, top-.033), (front-.010, top-.039),
        (back+.004, top-.037), (back-.003, top-.028),
        (back-.004, top-.006),
    ]
    inner = [
        (back+.006, top-.006), (front-.011, top-.006),
        (front-.006, top-.010), (front-.008, top-.028),
        (front-.013, top-.032), (back+.010, top-.031),
        (back+.003, top-.025), (back+.002, top-.009),
    ]
    frame(w, outer, inner, .012, mat)

    y = back+(front-back)*.47
    extrusion(
        w,
        [(y, top-.003), (y+.006, top-.004), (y+.003, top-.014),
         (y+.004, top-.022), (y+.009, top-.028), (y+.005, top-.031),
         (y-.003, top-.025), (y-.005, top-.017)],
        .005, 'Steel', bevel=.0006,
    )


def screws(w, points, side=1):
    for y, z, x in points:
        a = side*x
        rod(w, (a, y, z), (a+side*.0015, y, z), .0028, 'Steel', 12)
        box(
            w, (a+side*.0016, y, z),
            (.00035, .0038, .00055), 'Metal_Black', 0,
        )


def controls(w, y=0, z=.055, half=.02):
    for side in (-1, 1):
        rod(
            w, (side*half, y, z), (side*(half+.002), y, z),
            .005, 'Metal_Black', 24,
        )
        extrusion(
            w,
            [(y-.002, z+.003), (y+.018, z-.006),
             (y+.019, z-.010), (y+.009, z-.012), (y-.003, z-.003)],
            .003, 'Metal_Black', side*(half+.003), .0006,
        )
        screws(w, [
            (y-.025, z-.001, half),
            (y+.060, z+.002, half),
        ], side)
    box(w, (-half-.002, y+.047, z-.009), (.004, .012, .009), 'Polymer')


def rail(w, y0, y1, z, width=.021):
    box(w, (0, (y0+y1)/2, z+.002), (width*.7, y1-y0, .004))
    pitch = .010
    n = int((y1-y0)/pitch)

    for i in range(n):
        cy = y0+(i+.5)*(y1-y0)/n
        section = [
            (-width/2+.0006, z+.0075), (width/2-.0006, z+.0075),
            (width/2, z+.0069), (width/2, z+.0050),
            (width*.34, z+.0030), (-width*.34, z+.0030),
            (-width/2, z+.0050), (-width/2, z+.0069),
        ]
        v = [
            (x, py, pz)
            for py in (cy-.0026, cy+.0026)
            for x, pz in section
        ]
        f = [tuple(reversed(range(8))), tuple(range(8, 16))]
        f.extend(
            (j, (j+1) % 8, (j+1) % 8+8, j+8)
            for j in range(8)
        )
        w.add(v, f, 'Metal_Black', 0)


def mlok(w, y0, y1, z, width=.044, height=.045,
         count=6, mat='FDE'):
    # Le celle anulari lasciano fori passanti, senza superfici finte sopra.
    for side in (-1, 1):
        for k in range(count):
            cy = y0+(k+.5)*(y1-y0)/count
            sy = (y1-y0)/count
            outer, inner = [], []

            for j in range(12):
                a = TAU*(j+.5)/12
                co, si = math.cos(a), math.sin(a)
                r = min((sy/2)/abs(co), (height/2)/abs(si))
                outer.append((cy+r*co, z+r*si))

                cap = .0036
                half = max(.001, sy*.31-cap)
                inner.append((
                    cy+(half if co > 0 else -half)+cap*co,
                    z+cap*si,
                ))

            frame(
                w, outer, inner, .0024, mat,
                side*(width/2-.0012), .0006,
            )

        screws(w, [
            (y0+.009, z+.013, width/2),
            (y1-.009, z-.013, width/2),
        ], side)

    box(
        w, (0, (y0+y1)/2, z-height/2+.0015),
        (width-.004, y1-y0, .003), mat,
    )
    box(
        w, (0, (y0+y1)/2, z+height/2-.0015),
        (width-.004, y1-y0, .003), mat,
    )


def magazine(w, y=.12, top=.025, length=.18,
             width=.025, depth=.063, curve=.040, mat='Polymer'):
    stations = []
    for i in range(13):
        t = i / 12
        stations.append((
            y+curve*t*t, top-length*t, width*(1-.08*t),
            depth*(1-.05*t), -22*t,
        ))
    sweep(w, stations, mat)

    sweep(w, [
        (y+curve, top-length+.003, width+.005, depth+.005, -22),
        (y+curve, top-length-.005, width+.005, depth+.005, -22),
    ], mat)

    for side in (-1, 1):
        for j in range(4):
            yc = y+(j-1.5)*depth*.17
            pts = []
            for i in range(11):
                t = .14+.073*i
                pts.append((
                    side*(width/2+.0007),
                    yc+curve*t*t,
                    top-length*t,
                ))
            for a, b in zip(pts, pts[1:]):
                rod(w, a, b, .0013, 'Metal_Black', 6)

        for t in (.28, .55, .82):
            box(
                w,
                (side*(width/2+.001), y+curve*t*t, top-length*t),
                (.002, depth*.84, .002), 'Metal_Black', .0006,
            )


def stock(w, back=-.29, front=-.062, z=.086, mat='FDE'):
    tube(w, back+.030, front, z, .014, .009, 'Metal_Black')
    tube(
        w, front-.014, front+.001, z,
        .019, .014, 'Steel', segments=12,
    )

    outer = [
        (back+.012, z+.023), (back+.123, z+.021),
        (front-.023, z+.012), (front-.037, z-.016),
        (back+.080, z-.065), (back+.013, z-.064),
    ]
    inner = [
        (back+.030, z-.006), (back+.104, z-.003),
        (front-.051, z-.006), (front-.061, z-.018),
        (back+.080, z-.042), (back+.034, z-.043),
    ]
    frame(w, outer, inner, .038, mat, bevel=.0012)

    extrusion(
        w,
        [(back, z+.025), (back+.017, z+.029),
         (back+.022, z-.066), (back+.012, z-.094),
         (back-.001, z-.089)],
        .042, 'Polymer', bevel=.0012,
    )

    for side in (-1, 1):
        extrusion(
            w,
            [(back+.027, z+.025), (back+.134, z+.022),
             (back+.139, z+.002), (back+.023, z+.005)],
            .010, mat, side*.020, .001,
        )
        screws(w, [(back+.052, z-.053, .020)], side)

    extrusion(
        w,
        [(back+.08, z-.043), (back+.153, z-.025),
         (back+.157, z-.033), (back+.089, z-.053)],
        .022, 'Metal_Black',
    )

    for i in range(8):
        box(
            w, (0, back-.001, z-.074+i*.011),
            (.033, .002, .003), 'Polymer', .0006,
        )


def flash(w, y0, y1, z, outer=.011, inner=.005):
    collar = y0+(y1-y0)*.25
    tube(w, y0, collar, z, outer, inner, segments=12)
    tube(w, y1-.003, y1, z, outer, inner, segments=12)

    for k in range(6):
        a0 = TAU*k/6+.095
        a1 = TAU*(k+1)/6-.095
        v = []
        for y in (collar, y1-.003):
            for r in (outer, inner):
                for j in range(5):
                    a = a0+(a1-a0)*j/4
                    v.append((r*math.cos(a), y, z+r*math.sin(a)))

        f = []
        for j in range(4):
            f.extend([
                (j, j+1, 11+j, 10+j),
                (5+j, 15+j, 16+j, 6+j),
                (j, 5+j, 6+j, j+1),
                (10+j, 11+j, 16+j, 15+j),
            ])
        f.extend([(0, 10, 15, 5), (4, 9, 19, 14)])
        w.add(v, f, 'Metal_Black', .0006)


def optic(w, y, z, small=False):
    h = .027 if small else .035
    width = .029 if small else .042
    depth = .028 if small else .045

    box(w, (0, y, z+.007), (width, depth+.012, .014))

    outer = rounded_rect(width, h, .006)
    inner = rounded_rect(width-.008, h-.007, .004)
    v, f = [], []

    for py in (y-depth/2, y+depth/2):
        for ring in (outer, inner):
            v.extend((x, py, z+.014+h/2+pz) for x, pz in ring)

    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        f.extend([
            (i, j, n+j, n+i),
            (2*n+i, 3*n+i, 3*n+j, 2*n+j),
            (i, 2*n+i, 2*n+j, j),
            (n+i, n+j, 3*n+j, 3*n+i),
        ])
    w.add(v, f, 'Metal_Black', .0008)

    box(
        w, (0, y-.003, z+.014+h/2),
        (width-.009, .0008, h-.008), 'Lens', 0,
    )
    rod(
        w,
        (0, y-.0036, z+.014+h/2),
        (0, y-.004, z+.014+h/2),
        .00065, 'Red_Dot', 12,
    )

    if not small:
        box(
            w, (0, y+depth*.70, z+.013),
            (width*.82, .033, .025), 'Polymer',
        )
        for side in (-1, 1):
            rod(
                w, (side*width/2, y, z+.020),
                (side*(width/2+.003), y, z+.020),
                .004, 'Steel', 10,
            )
        box(
            w, (0, y-depth/2-.003, z+.010),
            (.015, .004, .005), 'Polymer',
        )

    screws(w, [(y-.008, z+.007, width/2)], -1)


def sight(w, y, z):
    box(w, (0, y, z+.004), (.022, .015, .008))
    tube(w, y-.003, y+.003, z+.023, .010, .007, segments=12)
    rod(w, (0, y, z+.008), (0, y, z+.022), .0015, 'Steel', 10)
    rod(
        w, (-.015, y, z+.004), (.015, y, z+.004),
        .002, 'Steel', 10,
    )


def scope(w, y0, y1, z, x=0, radius=.028):
    length = y1-y0
    lathe(
        w,
        [(y0, .019), (y0+.006, .020), (y0+.035, .020),
         (y0+.050, .015), (y1-.095, .015), (y1-.070, radius),
         (y1-.006, radius), (y1, radius-.0015),
         (y1, radius-.0035), (y1-.010, radius-.0035),
         (y1-.010, .012), (y0+.007, .012), (y0, .016)],
        (x, 0, z), segments=24, closed=True,
    )

    for py, r in [(y0+.004, .0158), (y1-.007, radius-.0037)]:
        lathe(
            w,
            [(py, 0), (py-.001, r*.75), (py-.0003, r),
             (py+.001, r), (py+.0015, 0)],
            (x, 0, z), mat='Lens', segments=24,
        )

    for py in (y0+.075, y1-.130):
        box(w, (x, py, z-.029), (.032, .019, .028))
        tube(
            w, py-.008, py+.008, z,
            .020, .0155, x=x, segments=24,
        )
        screws(w, [(py, z+.014, x+.017)], 1)

    cy = y0+length*.44
    for axis in ((0, 0, 1), (1, 0, 0), (-1, 0, 0)):
        direction = Vector(axis)
        p = Vector((x, cy, z))+direction*.014
        rod(w, p, p+direction*.019, .011, segments=24)

        u = direction.cross(Vector((0, 1, 0))).normalized()
        v = direction.cross(u)
        for i in range(12):
            a = TAU*i/12
            off = (u*math.cos(a)+v*math.sin(a))*.011
            rod(
                w, p+off+direction*.004, p+off+direction*.016,
                .00065, segments=6,
            )

    for py in (y0+.029, y1-.021):
        tube(
            w, py-.004, py+.004, z,
            .021 if py < cy else radius+.0008,
            .018 if py < cy else radius-.002,
            x=x, segments=24,
        )

    # Il coperchio aperto lascia visibile la lente frontale.
    rod(
        w, (x+radius, y1-.018, z), (x+radius, y1-.009, z),
        .003, segments=24,
    )
    lathe(
        w, [(0, 0), (.001, radius), (.003, radius), (.004, 0)],
        (x, y1-.014, z+radius*2.05), (0, 0, 1), 'Polymer', 12,
    )
    rod(
        w, (x, y0-.0005, z), (x, y0-.001, z),
        .0006, 'Red_Dot', 12,
    )


def bipod(w, y, end, z, spread=.030):
    box(w, (0, y, z+.007), (.044, .027, .014))

    for side in (-1, 1):
        x = side*spread
        rod(w, (side*.021, y, z), (x, y, z), .006, 'Steel', 10)
        rod(
            w, (x, y, z), (x, end, z-.008),
            .0065, segments=12,
        )
        rod(
            w, (x, end, z-.008), (x, end+.025, z-.008),
            .004, 'Steel', 10,
        )
        box(
            w, (x, end+.026, z-.009),
            (.018, .022, .008), 'Polymer',
        )
        for i in range(1):
            tube(
                w, end-.018-i*.015, end-.014-i*.015,
                z-.008, .007, .005, x=x, segments=12,
            )


def build_ar():
    w = Weapon('AR', (0, .56, .086), (0, .285, .068))

    extrusion(
        w,
        [(-.062, .061), (-.055, .106), (-.035, .112),
         (.142, .112), (.166, .097), (.162, .064),
         (.126, .059), (.023, .060)],
        .038,
    )
    extrusion(
        w,
        [(-.058, .062), (.165, .061), (.166, .018),
         (.152, .004), (.085, .009), (.073, .030),
         (.019, .030), (-.006, .035), (-.055, .035)],
        .035,
    )
    extrusion(
        w,
        [(.087, .030), (.154, .028), (.151, .000),
         (.137, -.007), (.083, .001)],
        .039,
    )

    extrusion(
        w,
        [(.035, .080), (.116, .080), (.120, .096), (.033, .096)],
        .0016, 'Polymer', .020,
    )
    box(
        w, (.021, .076, .084),
        (.002, .060, .009), 'Metal_Black', .0006,
    )
    rod(
        w, (.022, .034, .078), (.022, .121, .078),
        .0015, 'Steel', 10,
    )
    extrusion(
        w,
        [(.025, .082), (.034, .082), (.037, .098), (.018, .100)],
        .013, x=.022,
    )
    rod(
        w, (.016, -.021, .084), (.033, -.042, .084),
        .005, segments=12,
    )
    box(w, (0, -.064, .101), (.048, .012, .007))

    controls(w, z=.049, half=.019)
    mlok(w, .164, .411, .086, count=6)
    rail(w, -.048, .410, .111)
    sight(w, -.040, .120)
    sight(w, .398, .120)

    tube(w, .163, .514, .086, .0095, .004, segments=12)
    box(w, (0, .435, .088), (.021, .024, .025))
    rod(
        w, (0, .172, .099), (0, .435, .099),
        .0017, 'Steel', 10,
    )
    flash(w, .514, .560, .086)

    grip(w, 'FDE')
    trigger(w, top=.031)
    magazine(w)
    stock(w)

    extrusion(
        w,
        [(.237, .062), (.332, .062), (.326, .032),
         (.303, .026), (.280, .044), (.243, .043)],
        .026, 'Polymer',
    )
    optic(w, .048, .120)
    return w.finish()


def build_smg():
    w = Weapon('SMG', (0, .340, .082), (0, .225, .028))

    lathe(
        w,
        [(-.057, .016), (-.045, .019), (.245, .019), (.262, .015)],
        (0, 0, .082), segments=12,
    )
    extrusion(
        w,
        [(-.054, .077), (.166, .077), (.182, .056),
         (.155, .020), (.103, .012), (.075, .034), (-.041, .038)],
        .034, 'Polymer',
    )
    grip(w, top=.044, length=.104, width=.030)
    trigger(w, top=.034, mat='Polymer')
    controls(w, z=.052, half=.018)

    extrusion(
        w,
        [(.099, .026), (.158, .029), (.159, .000),
         (.137, -.007), (.104, -.002)],
        .029,
    )
    magazine(w, .128, .012, .166, .019, .037, .035, 'Metal_Black')
    mlok(w, .180, .274, .065, .043, .033, 3, 'Polymer')

    lathe(w, [(.12, .008), (.274, .008)], (0, 0, .106), segments=12)
    rod(
        w, (-.006, .215, .106), (-.032, .221, .106),
        .0035, 'Steel', 10,
    )
    rod(
        w, (-.032, .218, .106), (-.032, .233, .106),
        .006, 'Polymer', 12,
    )

    for side in (-1, 1):
        rod(
            w, (side*.021, -.211, .080), (side*.021, -.044, .080),
            .004, 'Steel', 10,
        )
        screws(w, [(-.043, .062, .019), (.080, .058, .019)], side)

    extrusion(
        w,
        [(-.239, .113), (-.219, .112), (-.212, .013),
         (-.230, .005), (-.242, .014)],
        .038, 'Polymer', bevel=.0012,
    )
    for i in range(7):
        box(
            w, (0, -.240, .018+i*.012),
            (.031, .003, .003), 'Polymer', .0006,
        )

    rail(w, -.031, .173, .103)
    optic(w, .050, .111, True)
    sight(w, .259, .095)

    tube(w, .258, .310, .082, .009, .004, segments=12)
    for a in (0, TAU/3, 2*TAU/3):
        box(
            w, (.010*math.cos(a), .293, .082+.010*math.sin(a)),
            (.006, .008, .006), bevel=.0006,
        )
    flash(w, .307, .340, .082)
    box(
        w, (.019, .062, .086),
        (.0015, .042, .012), 'Steel', .0006,
    )
    return w.finish()


def build_shotgun():
    w = Weapon('SHOTGUN', (0, .680, .072), (0, .428, .035))

    extrusion(
        w,
        [(.018, .034), (.017, .077), (.046, .092),
         (.194, .092), (.240, .077), (.238, .031),
         (.164, .026), (.069, .029)],
        .038,
    )
    extrusion(
        w,
        [(.095, .054), (.184, .054), (.198, .065),
         (.192, .080), (.100, .080)],
        .0018, 'Polymer', .0195,
    )
    extrusion(
        w,
        [(.111, .056), (.190, .056), (.191, .070), (.111, .071)],
        .001, 'Steel', .0207,
    )

    extrusion(
        w,
        [(.026, .062), (-.017, .055), (-.057, .032),
         (-.118, .021), (-.261, .037), (-.273, .017),
         (-.269, -.078), (-.244, -.084), (-.131, -.044),
         (-.064, -.028), (-.023, .015), (.024, .026)],
        .038, 'Polymer', bevel=.0015,
    )
    grip(w, 'Polymer', top=.031, length=.096, width=.032)

    extrusion(
        w,
        [(-.274, .037), (-.259, .038), (-.257, -.080),
         (-.275, -.086), (-.284, -.075), (-.283, .025)],
        .042, 'Polymer', bevel=.0012,
    )

    for side in (-1, 1):
        extrusion(
            w,
            [(-.235, .017), (-.112, .010), (-.096, -.005),
             (-.116, -.020), (-.235, -.043)],
            .002, 'FDE', side*.020,
        )
        screws(w, [
            (.045, .050, .020), (.214, .049, .020),
            (-.247, -.017, .022),
        ], side)

    trigger(w, back=.022, front=.077, top=.029)
    rail(w, .044, .214, .092)
    sight(w, .047, .101)

    tube(w, .236, .680, .072, .0118, .0092, segments=12)
    tube(w, .236, .634, .038, .012, .009, segments=12)
    tube(w, .612, .638, .038, .014, .010, segments=12)
    tube(w, .624, .663, .072, .0135, .0118, segments=12)

    box(w, (0, .606, .055), (.028, .014, .050))
    box(w, (0, .651, .088), (.006, .012, .010))

    lathe(
        w,
        [(.337, .016), (.348, .023), (.370, .025),
         (.489, .025), (.514, .021), (.520, .016)],
        (0, 0, .035), mat='FDE', segments=12,
    )
    for i in range(10):
        y = .350+i*.0164
        tube(w, y, y+.004, .035, .0265, .024, 'FDE', segments=12)

    for side in (-1, 1):
        rod(
            w, (side*.014, .215, .039), (side*.014, .392, .039),
            .0025, 'Steel', 10,
        )

    box(w, (-.022, .130, .054), (.005, .138, .043), 'Polymer')

    for i in range(5):
        y = .076+i*.027
        rod(
            w, (-.031, y, .026), (-.031, y, .063),
            .009, 'FDE', 16,
        )
        rod(
            w, (-.031, y, .063), (-.031, y, .079),
            .0094, 'Brass', 16,
        )
        rod(
            w, (-.031, y, .079), (-.031, y, .080),
            .010, 'Brass', 16,
        )
        lathe(
            w,
            [(-.005, .0105), (.005, .0105),
             (.005, .0095), (-.005, .0095)],
            (-.031, y, .050), (0, 0, 1), 'Polymer', 16,
            closed=True,
        )
    return w.finish()


def build_sniper():
    w = Weapon('SNIPER', (0, .810, .080), (0, .379, .047))

    extrusion(
        w,
        [(-.060, .067), (.224, .067), (.235, .046),
         (.193, .026), (.178, .002), (.082, .002),
         (.071, .029), (-.056, .034)],
        .044, 'FDE',
    )
    mlok(w, .223, .557, .055, .047, .040, 6, 'FDE')
    tube(w, -.045, .224, .080, .019, .011, segments=12)

    extrusion(
        w,
        [(.022, .074), (.150, .074), (.163, .088),
         (.151, .097), (.025, .097)],
        .002, 'Steel', .0195,
    )
    rod(
        w, (.016, .015, .080), (.049, .000, .049),
        .0045, 'Steel', 10,
    )
    rod(w, (.043, .003, .055), (.058, -.007, .039), .010, segments=12)

    for i in range(6):
        t = i/5
        rod(
            w,
            (.044+.014*t, .003-.010*t, .054-.015*t),
            (.045+.014*t, .004-.010*t, .055-.015*t),
            .0105, segments=12,
        )

    rail(w, -.029, .217, .101)
    tube(w, .218, .745, .080, .0135, .005, segments=12)

    tube(w, .740, .755, .080, .016, .0055, segments=12)
    for i in range(3):
        a = .753+i*.018
        tube(w, a, a+.004, .080, .018, .0055, segments=12)
        box(w, (0, a+.009, .096), (.020, .014, .004))
        box(w, (0, a+.009, .064), (.020, .014, .004))
    tube(w, .804, .810, .080, .018, .0055, segments=12)

    grip(w, top=.043, length=.110)
    trigger(w, top=.031)
    magazine(w, .132, .012, .084, .028, .090, .004, 'Metal_Black')

    outer = [
        (-.324, .064), (-.105, .065), (-.062, .053),
        (-.061, .029), (-.179, -.035), (-.322, -.039),
    ]
    inner = [
        (-.302, .042), (-.129, .043), (-.099, .044),
        (-.092, .032), (-.189, -.010), (-.301, -.014),
    ]
    frame(w, outer, inner, .035, 'FDE', bevel=.0012)

    for py in (-.245, -.158):
        rod(w, (0, py, .053), (0, py, .083), .004, 'Steel', 10)

    extrusion(
        w,
        [(-.277, .081), (-.268, .097), (-.144, .097),
         (-.126, .088), (-.127, .077), (-.268, .075)],
        .043, 'Polymer', bevel=.0012,
    )
    extrusion(
        w,
        [(-.338, .071), (-.322, .072), (-.318, -.049),
         (-.334, -.052), (-.345, -.041), (-.344, .060)],
        .043, 'Polymer', bevel=.0012,
    )

    for side in (-1, 1):
        screws(w, [
            (-.276, .001, .019), (-.118, .046, .019),
            (.208, .039, .024),
        ], side)

    scope(w, -.030, .338, .154, radius=.031)
    bipod(w, .535, .711, .024)
    return w.finish()


def build_pistol():
    w = Weapon('PISTOL', (0, .148, .049), (0, .008, -.007))

    grip(w, top=.033, length=.099, width=.029)
    extrusion(
        w,
        [(-.041, .032), (-.027, .041), (.132, .039),
         (.139, .030), (.137, .021), (.073, .019),
         (.064, .025), (.019, .024), (-.027, .019)],
        .029, 'Polymer',
    )
    trigger(w, .017, .072, .025, 'Polymer')
    extrusion(
        w,
        [(.042, .021), (.045, .014), (.049, .003),
         (.047, -.002), (.044, -.002), (.040, .015)],
        .002, 'Polymer',
    )
    sweep(w, [
        (-.024, -.062, .032, .045, -10),
        (-.025, -.073, .033, .046, -10),
    ], 'Polymer')

    # Sponde continue e tetto diviso lasciano aperta la finestra di espulsione.
    side = [
        (-.042, .038), (.144, .038), (.144, .058),
        (.138, .064), (-.036, .064), (-.042, .058),
    ]
    for sign in (-1, 1):
        extrusion(w, side, .0045, x=sign*.012, bevel=.0007)

    box(w, (0, -.012, .061), (.024, .059, .006), bevel=.0007)
    box(w, (0, .107, .061), (.024, .074, .006), bevel=.0007)
    box(w, (-.008, .044, .059), (.008, .042, .008), bevel=.0007)
    box(w, (.002, .042, .056), (.016, .034, .008), 'Steel', .0006)

    tube(w, .058, .148, .049, .0072, .0046, 'Steel', segments=12)
    rod(w, (0, .086, .036), (0, .143, .036), .003, 'Steel', 10)

    for sign in (-1, 1):
        for i in range(9):
            y = -.034+i*.0051
            extrusion(
                w,
                [(y, .039), (y+.0015, .039),
                 (y+.0047, .058), (y+.0032, .058)],
                .0013, 'Polymer', sign*.0146, .0006,
            )
        for i in range(5):
            y = .104+i*.006
            extrusion(
                w,
                [(y, .039), (y+.0014, .039),
                 (y+.003, .058), (y+.0016, .058)],
                .0013, 'Polymer', sign*.0146, .0006,
            )

    box(w, (-.016, .013, .019), (.003, .011, .009), 'Metal_Black', .0006)
    extrusion(
        w,
        [(.015, .034), (.037, .034), (.038, .038),
         (.028, .040), (.016, .038)],
        .002, 'Steel', -.0155, .0006,
    )
    screws(w, [(.007, .024, .015), (.053, .032, .015)], -1)

    box(w, (0, .132, .067), (.004, .009, .006))
    for x in (-.007, .007):
        box(w, (x, -.037, .067), (.005, .008, .006))
        rod(
            w, (x, -.0413, .067), (x, -.0416, .067),
            .0009, 'Steel', 10,
        )

    box(w, (0, .130, .070), (.0015, .004, .0004), 'Steel', 0)
    for i in range(4):
        box(
            w, (0, .088+i*.012, .020),
            (.026, .003, .004), 'Polymer', .0006,
        )

    optic(w, -.010, .065, True)
    return w.finish()


def build_lmg():
    w = Weapon('LMG', (0, .680, .090), (0, .380, .044))

    extrusion(
        w,
        [(-.060, .037), (-.058, .096), (-.028, .108),
         (.210, .108), (.290, .087), (.301, .044),
         (.265, .028), (.080, .028)],
        .050,
    )
    extrusion(
        w,
        [(-.043, .108), (.208, .108), (.224, .118),
         (.206, .125), (-.027, .126), (-.045, .119)],
        .046,
    )
    rail(w, -.024, .204, .125)
    rod(w, (-.028, .213, .110), (.028, .213, .110), .0045, 'Steel', 10)

    for sign in (-1, 1):
        screws(w, [
            (-.023, .077, .026), (.085, .041, .026), (.253, .064, .026),
        ], sign)
        extrusion(
            w,
            [(.025, .063), (.219, .063), (.225, .074), (.028, .074)],
            .0024, 'Polymer', sign*.0265,
        )

    rod(w, (.030, .144, .068), (.046, .150, .068), .004, 'Steel', 10)
    box(w, (.045, .151, .068), (.013, .025, .017), 'Polymer')

    mlok(w, .299, .492, .073, .050, .059, 5, 'Polymer')
    tube(w, .287, .635, .090, .012, .0048, 'Steel', segments=12)
    tube(w, .276, .549, .054, .011, .007, segments=12)
    tube(w, .508, .549, .054, .016, .010, segments=12)
    flash(w, .635, .680, .090, .0125, .005)
    sight(w, .551, .103)

    rod(w, (.019, .258, .099), (.019, .258, .145), .0045, 'Steel', 10)
    rod(w, (.019, .258, .145), (.019, .185, .153), .009, 'Polymer', 12)

    for i in range(6):
        rod(
            w, (.019, .190+i*.009, .151), (.019, .193+i*.009, .151),
            .0097, 'Polymer', 12,
        )

    grip(w, top=.043, width=.033)
    trigger(w, top=.033)
    controls(w, z=.052, half=.026)

    extrusion(
        w,
        [(-.057, .094), (-.091, .101), (-.268, .101),
         (-.286, .083), (-.287, -.029), (-.260, -.039),
         (-.178, .010), (-.081, .044), (-.058, .045)],
        .045, 'Polymer', bevel=.0013,
    )
    extrusion(
        w,
        [(-.298, .096), (-.282, .098), (-.279, -.035),
         (-.294, -.043), (-.303, -.031)],
        .048, 'Polymer', bevel=.0012,
    )

    extrusion(
        w,
        [(.078, .027), (.250, .024), (.249, -.103),
         (.227, -.131), (.097, -.131), (.077, -.113)],
        .104, 'Olive', x=-.010, bevel=.0015,
    )
    box(w, (-.010, .164, .024), (.113, .180, .012), 'Polymer', .001)

    for sign in (-1, 1):
        for i in range(4):
            box(
                w, (-.010+sign*.053, .107+i*.035, -.056),
                (.0025, .004, .112), 'Olive', .0006,
            )
    for y in (.106, .218):
        box(w, (-.065, y, .009), (.004, .019, .022), 'Steel', .0006)

    # Le maglie cave lasciano visibili i bossoli.
    for i in range(10):
        t = i/9
        x = -.078+.047*t*t
        z = .015+.091*t

        lathe(
            w,
            [(.122, .0052), (.124, .0055), (.128, .0052),
             (.154, .0050), (.160, .0031), (.166, .0030)],
            (x, 0, z), mat='Brass', segments=12,
        )
        lathe(
            w,
            [(.165, .0030), (.173, .0026), (.181, 0)],
            (x, 0, z), mat='Steel', segments=12,
        )
        tube(w, .130, .137, z, .0063, .0053, x=x, segments=12)
        rod(
            w, (x-.006, .134, z), (x+.007, .134, z+.009),
            .0011, segments=8,
        )

    optic(w, .069, .134)
    bipod(w, .534, .293, .025, .034)
    return w.finish()


def build_rpg():
    # La volata è la bocca del tubo; il razzo caricato sporge oltre.
    w = Weapon('RPG', (0, .260, .075), (0, -.220, 0))

    lathe(
        w,
        [(-.520, .049), (-.511, .051), (-.487, .048),
         (-.452, .027), (-.390, .025), (-.083, .025),
         (-.061, .031), (.043, .031), (.081, .023),
         (.248, .023), (.260, .028), (.260, .020),
         (-.451, .020), (-.489, .041), (-.520, .043)],
        (0, 0, .075), segments=32, closed=True,
    )
    lathe(
        w,
        [(-.383, .027), (-.372, .032), (-.110, .032),
         (-.091, .027), (-.091, .0255), (-.383, .0255)],
        (0, 0, .075), mat='FDE', segments=32, closed=True,
    )

    for i in range(18):
        a = TAU*i/18
        x = .032*math.cos(a)
        z = .075+.032*math.sin(a)
        rod(w, (x, -.367, z), (x, -.114, z), .0014, 'FDE', 8)

    for y in (-.365, -.240, -.110):
        tube(w, y-.005, y+.005, .075, .034, .0315, 'Steel', segments=32)

    extrusion(
        w,
        [(-.039, .061), (.064, .061), (.067, .036),
         (.043, .026), (-.036, .029)],
        .024,
    )
    grip(w, 'FDE', top=.045, length=.11)
    trigger(w, top=.033)
    grip(w, 'Polymer', y=-.220, top=.044, length=.095, width=.028)
    controls(w, z=.044, half=.016)

    for side in (-1, 1):
        screws(w, [
            (-.360, .075, .034), (-.118, .075, .034), (.046, .045, .017),
        ], side)

    sight(w, .225, .098)
    sight(w, -.060, .098)

    extrusion(
        w,
        [(-.081, .081), (-.019, .081), (-.015, .144), (-.075, .144)],
        .015, x=-.037,
    )
    box(w, (-.048, -.045, .136), (.037, .055, .028))
    scope(w, -.120, .037, .154, x=-.053, radius=.020)

    lathe(
        w,
        [(.255, .018), (.294, .019), (.313, .026), (.335, .037),
         (.356, .045), (.369, .046), (.385, .042), (.408, .031),
         (.430, .020), (.449, .013)],
        (0, 0, .075), mat='Olive', segments=32,
    )
    tube(
        w, .359, .366, .075,
        .0464, .0445, 'Metal_Black', segments=32,
    )
    lathe(
        w,
        [(.448, .013), (.455, .013), (.470, .009), (.480, .0075)],
        (0, 0, .075), mat='Steel', segments=32,
    )
    tube(w, .283, .289, .075, .020, .018, 'Steel', segments=32)
    return w.finish()


def build_grenade():
    w = Weapon('GRENADE', (0, .037, 0), (0, 0, .048))

    lathe(
        w,
        [(-.045, 0), (-.041, .015), (-.031, .026), (-.017, .031),
         (0, .034), (.017, .031), (.031, .025), (.041, .014),
         (.044, 0)],
        axis=(0, 0, 1), mat='Olive', segments=12,
    )

    rows, cols = 8, 16
    for row in range(rows):
        z0 = -.039+row*.0097
        z1 = z0+.0081

        def radius(z):
            return .034*math.sqrt(max(0, 1-(z/.046)**2))

        for col in range(cols):
            a0 = TAU*(col+.08)/cols
            a1 = TAU*(col+.92)/cols
            v = []

            for z in (z0, z1):
                for offset in (-.001, .002):
                    r = radius(z)+offset
                    for j in range(4):
                        a = a0+(a1-a0)*j/3
                        v.append((r*math.cos(a), r*math.sin(a), z))

            f = []
            for j in range(3):
                f.extend([
                    (j, j+1, 9+j, 8+j),
                    (4+j, 12+j, 13+j, 5+j),
                    (j, 4+j, 5+j, j+1),
                    (8+j, 9+j, 13+j, 12+j),
                ])
            f.extend([(0, 8, 12, 4), (3, 7, 15, 11)])
            w.add(v, f, 'Olive', .0006)

    rod(w, (0, 0, .040), (0, 0, .053), .012, 'Steel', 24)
    rod(w, (0, 0, .052), (0, 0, .064), .0085, segments=12)
    box(w, (0, -.004, .061), (.018, .021, .012), bevel=.0006)

    extrusion(
        w,
        [(-.012, .069), (.010, .069), (.026, .056), (.037, .030),
         (.039, -.009), (.033, -.034), (.027, -.036), (.033, -.006),
         (.031, .027), (.021, .050), (.008, .064), (-.012, .064)],
        .014, bevel=.0006,
    )
    rod(
        w, (-.014, -.007, .063), (.014, -.007, .063),
        .002, 'Steel', 10,
    )

    center = Vector((-.022, -.008, .049))
    v, f = [], []
    nu, nv = 40, 8

    for i in range(nu):
        a = TAU*i/nu
        for j in range(nv):
            b = TAU*j/nv
            r = .013+.0013*math.cos(b)
            v.append(
                center + Vector((
                    .0013*math.sin(b),
                    r*math.cos(a),
                    r*math.sin(a),
                ))
            )

    for i in range(nu):
        for j in range(nv):
            f.append((
                i*nv+j,
                ((i+1) % nu)*nv+j,
                ((i+1) % nu)*nv+(j+1) % nv,
                i*nv+(j+1) % nv,
            ))
    w.add(v, f, 'Steel', 0)

    rod(
        w, (-.015, -.008, .061), (-.023, -.008, .060),
        .0013, 'Steel', 10,
    )
    return w.finish()


BUILDERS = [
    build_ar, build_smg, build_shotgun, build_sniper,
    build_pistol, build_lmg, build_rpg, build_grenade,
]

roots = [build() for build in BUILDERS]
bpy.context.view_layer.update()

counts = {}
for root in roots:
    total = 0
    for obj in root.children:
        if obj.type == 'MESH':
            if obj.modifiers:
                raise RuntimeError('Modificatori non applicati: ' + obj.name)
            obj.data.calc_loop_triangles()
            total += len(obj.data.loop_triangles)

    counts[root.name] = total
    if not 6000 <= total <= 25000:
        raise RuntimeError(
            f'{root.name}: {total} triangoli, fuori dal budget 6000–25000'
        )

if '--' not in sys.argv or not sys.argv[sys.argv.index('--') + 1:]:
    raise SystemExit(
        'Uso: blender -b --factory-startup --python armi.py -- '
        '/percorso/weapons.glb'
    )

output = os.path.abspath(
    os.path.expanduser(sys.argv[sys.argv.index('--') + 1:][-1])
)
if os.path.splitext(output)[1].lower() != '.glb':
    raise ValueError(
        'Il percorso di uscita deve terminare con .glb: ' + output
    )

os.makedirs(os.path.dirname(output), exist_ok=True)

# API: https://docs.blender.org/api/dev/bpy.ops.export_scene.html
result = bpy.ops.export_scene.gltf(
    filepath=output,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
)
if 'FINISHED' not in result:
    raise RuntimeError('Esportazione GLB non completata: ' + repr(result))

print('OK weapons.glb')
for name, total in counts.items():
    print(f'{name}: {total} triangoli')

# Verificato: geometria, budget, mesh chiuse e modificatori applicati in Blender 5.2.1.
# Dedotto: realismo visivo; non verificato con un render.
# Da controllare: export GLB e caricamento nel gioco; salvataggio impedito dalla sandbox.
