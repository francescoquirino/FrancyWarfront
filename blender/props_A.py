import math
import sys
import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

bpy.ops.wm.read_factory_settings(use_empty=True)

argv = sys.argv
out_path = argv[argv.index("--") + 1] if "--" in argv else "props.glb"


def make_mat(
    name, color, rough=0.5, metal=0.0, coat=0.0, emit=None, emit_str=0.0
):
  m = bpy.data.materials.new(name=name)
  m.use_nodes = True
  m.use_fake_user = True
  bsdf = m.node_tree.nodes.get("Principled BSDF")
  if not bsdf:
    bsdf = m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
  bsdf.inputs["Base Color"].default_value = (*color, 1.0)
  bsdf.inputs["Roughness"].default_value = rough
  bsdf.inputs["Metallic"].default_value = metal
  if "Coat Weight" in bsdf.inputs:
    bsdf.inputs["Coat Weight"].default_value = coat
  elif "Clearcoat" in bsdf.inputs:
    bsdf.inputs["Clearcoat"].default_value = coat
  if emit is not None:
    if "Emission Color" in bsdf.inputs:
      bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
    elif "Emission" in bsdf.inputs:
      bsdf.inputs["Emission"].default_value = (*emit, 1.0)
    if "Emission Strength" in bsdf.inputs:
      bsdf.inputs["Emission Strength"].default_value = emit_str
  return m


MATS = {
    "Army_Green": make_mat("Army_Green", (0.20, 0.24, 0.15), rough=0.6),
    "Desert_Tan": make_mat("Desert_Tan", (0.55, 0.45, 0.30), rough=0.65),
    "Metal_Dark": make_mat(
        "Metal_Dark", (0.05, 0.05, 0.05), rough=0.4, metal=0.8
    ),
    "Rubber": make_mat("Rubber", (0.02, 0.02, 0.02), rough=0.9),
    "Glass_Dark": make_mat(
        "Glass_Dark", (0.05, 0.07, 0.08), rough=0.05, metal=0.2
    ),
    "Concrete": make_mat("Concrete", (0.45, 0.45, 0.45), rough=0.9),
    "Wood_Crate": make_mat("Wood_Crate", (0.35, 0.25, 0.15), rough=0.8),
    "Canvas": make_mat("Canvas", (0.30, 0.30, 0.22), rough=0.95),
    "Burlap": make_mat("Burlap", (0.55, 0.47, 0.33), rough=1.0),
    "Light_Emit": make_mat(
        "Light_Emit",
        (1.0, 0.92, 0.75),
        rough=0.1,
        emit=(1.0, 0.88, 0.65),
        emit_str=6.0,
    ),
    "Paint_White": make_mat(
        "Paint_White", (0.86, 0.86, 0.84), rough=0.25, coat=0.6
    ),
    "Paint_Red": make_mat(
        "Paint_Red", (0.68, 0.08, 0.06), rough=0.25, coat=0.6
    ),
    "Paint_Blue": make_mat(
        "Paint_Blue", (0.08, 0.24, 0.58), rough=0.25, coat=0.6
    ),
    "Paint_Grey": make_mat(
        "Paint_Grey", (0.32, 0.34, 0.36), rough=0.28, coat=0.6
    ),
}
MAT_LIST = list(MATS.values())
MI = {k: i for i, k in enumerate(MATS.keys())}


def xform(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
  return (
      Matrix.Translation(Vector(loc))
      @ Euler(rot, "XYZ").to_matrix().to_4x4()
      @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
  )


def tag_verts_faces(verts, mat_idx):
  faces = {f for v in verts for f in v.link_faces}
  for f in faces:
    f.material_index = mat_idx
    f.smooth = True


def add_box(
    bm,
    size,
    loc=(0, 0, 0),
    rot=(0, 0, 0),
    mat=0,
    top_scale=(1.0, 1.0),
    shear_y=0.0,
    bot_scale=(1.0, 1.0),
):
  res = bmesh.ops.create_cube(bm, size=1.0)
  verts = res["verts"]
  sx, sy, sz = size
  for v in verts:
    v.co.x *= sx
    v.co.y *= sy
    v.co.z *= sz
    if v.co.z > 0:
      v.co.x *= top_scale[0]
      v.co.y = v.co.y * top_scale[1] + shear_y
    else:
      v.co.x *= bot_scale[0]
      v.co.y *= bot_scale[1]
  bmesh.ops.transform(bm, matrix=xform(loc, rot), verts=verts)
  tag_verts_faces(verts, mat)
  return verts


def add_cyl(
    bm, r1, r2, depth, segs=16, loc=(0, 0, 0), rot=(0, 0, 0), mat=0, cap=True
):
  res = bmesh.ops.create_cone(
      bm,
      cap_ends=cap,
      cap_tris=False,
      segments=segs,
      radius1=r1,
      radius2=r2,
      depth=depth,
      matrix=xform(loc, rot),
  )
  tag_verts_faces(res["verts"], mat)
  return res["verts"]


def add_sphere(
    bm,
    r,
    segs=16,
    rings=10,
    loc=(0, 0, 0),
    rot=(0, 0, 0),
    scale=(1, 1, 1),
    mat=0,
):
  res = bmesh.ops.create_uvsphere(
      bm,
      u_segments=segs,
      v_segments=rings,
      radius=r,
      matrix=xform(loc, rot, scale),
  )
  tag_verts_faces(res["verts"], mat)
  return res["verts"]


def add_loft(
    bm,
    profiles,
    mat=0,
    closed_loop=True,
    cap_ends=True,
    seg_mats=None,
    station_mats=None,
):
  v_grid = [[bm.verts.new(p) for p in prof] for prof in profiles]
  n_st = len(v_grid)
  n_pt = len(v_grid[0])
  created = []
  for i in range(n_st - 1):
    r0, r1 = v_grid[i], v_grid[i + 1]
    lim = n_pt if closed_loop else n_pt - 1
    for j in range(lim):
      jn = (j + 1) % n_pt
      try:
        f = bm.faces.new((r0[j], r0[jn], r1[jn], r1[j]))
        m_use = mat
        if station_mats and i < len(station_mats) and station_mats[i] is not None:
          m_use = station_mats[i]
        if seg_mats and j < len(seg_mats) and seg_mats[j] is not None:
          m_use = seg_mats[j]
        f.material_index = m_use
        f.smooth = True
        created.append(f)
      except ValueError:
        pass
  if cap_ends and closed_loop and n_pt >= 3:
    try:
      f0 = bm.faces.new(v_grid[0][::-1])
      f0.material_index = mat
      f0.smooth = True
      created.append(f0)
      f1 = bm.faces.new(v_grid[-1])
      f1.material_index = mat
      f1.smooth = True
      created.append(f1)
    except ValueError:
      pass
  return created


def body_section(y, w, z_bot, z_mid, z_top, tuck=0.06, tumble=0.12, crown=0.03):
  hw = w * 0.5
  return [
      (0.0, y, z_bot),
      (hw - tuck, y, z_bot + 0.02),
      (hw, y, z_bot + (z_mid - z_bot) * 0.35),
      (hw, y, z_mid),
      (hw - tumble * 0.35, y, z_mid + (z_top - z_mid) * 0.35),
      (hw - tumble, y, z_top - 0.03),
      (0.0, y, z_top + crown),
      (-(hw - tumble), y, z_top - 0.03),
      (-(hw - tumble * 0.35), y, z_mid + (z_top - z_mid) * 0.35),
      (-hw, y, z_mid),
      (-hw, y, z_bot + (z_mid - z_bot) * 0.35),
      (-(hw - tuck), y, z_bot + 0.02),
  ]


def add_wheel(
    bm,
    x,
    y,
    z,
    radius,
    width,
    spokes=6,
    lugs=26,
    mat_tire=MI["Rubber"],
    mat_rim=MI["Metal_Dark"],
    dual=False,
    has_tire=True,
):
  side = 1.0 if x >= 0 else -1.0
  offsets = [-width * 0.58, width * 0.58] if dual else [0.0]
  for dx in offsets:
    wx = x + dx * side
    rim_r = radius * (0.58 if has_tire else 0.96)
    if has_tire:
      hw = width * 0.5
      r_in = rim_r * 0.96
      r_mid = radius * 0.92
      r_sh = radius * 0.97
      profs = []
      for a_i in range(24):
        ang = 2.0 * math.pi * a_i / 24.0
        ca, sa = math.cos(ang), math.sin(ang)
        pts = [
            (wx - hw * 0.78, y + r_in * ca, z + r_in * sa),
            (wx - hw, y + r_mid * ca, z + r_mid * sa),
            (wx - hw * 0.86, y + r_sh * ca, z + r_sh * sa),
            (wx + hw * 0.86, y + r_sh * ca, z + r_sh * sa),
            (wx + hw, y + r_mid * ca, z + r_mid * sa),
            (wx + hw * 0.78, y + r_in * ca, z + r_in * sa),
        ]
        profs.append(pts)
      profs.append(profs[0])
      add_loft(bm, profs, mat=mat_tire, closed_loop=True, cap_ends=False)
      for i in range(lugs):
        ang = 2.0 * math.pi * i / lugs
        ca, sa = math.cos(ang), math.sin(ang)
        ly = y + (radius - 0.012) * ca
        lz = z + (radius - 0.012) * sa
        for s_off in (-width * 0.24, width * 0.24):
          stag = 0.04 if s_off > 0 else -0.04
          add_box(
              bm,
              (width * 0.36, 0.042, 0.028),
              loc=(wx + s_off, ly + stag * sa, lz - stag * ca),
              rot=(ang, 0, 0),
              mat=mat_tire,
          )
    add_cyl(
        bm,
        rim_r,
        rim_r,
        width * 0.72,
        segs=20,
        loc=(wx, y, z),
        rot=(0, math.pi / 2, 0),
        mat=mat_rim,
    )
    add_cyl(
        bm,
        rim_r * 0.84,
        rim_r * 0.80,
        width * 0.76,
        segs=20,
        loc=(wx, y, z),
        rot=(0, math.pi / 2, 0),
        mat=MI["Metal_Dark"],
    )
    add_cyl(
        bm,
        rim_r * 0.30,
        rim_r * 0.26,
        width * 0.82,
        segs=14,
        loc=(wx, y, z),
        rot=(0, math.pi / 2, 0),
        mat=mat_rim,
    )
    for s in range(spokes):
      ang = 2.0 * math.pi * s / spokes
      ca, sa = math.cos(ang), math.sin(ang)
      mr = rim_r * 0.56
      add_box(
          bm,
          (width * 0.14, rim_r * 0.58, rim_r * 0.13),
          loc=(wx + side * width * 0.22, y + mr * ca, z + mr * sa),
          rot=(ang + math.pi / 2, 0, 0),
          mat=mat_rim,
      )
      br = rim_r * 0.20
      add_cyl(
          bm,
          0.014,
          0.014,
          width * 0.86,
          segs=6,
          loc=(wx, y + br * ca, z + br * sa),
          rot=(0, math.pi / 2, 0),
          mat=MI["Metal_Dark"],
      )
    add_cyl(
        bm,
        rim_r * 0.62,
        rim_r * 0.62,
        0.035,
        segs=16,
        loc=(wx - side * width * 0.18, y, z),
        rot=(0, math.pi / 2, 0),
        mat=MI["Metal_Dark"],
    )
    add_box(
        bm,
        (0.06, rim_r * 0.35, rim_r * 0.22),
        loc=(wx - side * width * 0.18, y + rim_r * 0.45, z + rim_r * 0.15),
        mat=MI["Paint_Red"],
    )


def add_suspension(
    bm, y, z_axle, half_track, coil=True, leaf=False, arms=True, mat=MI["Metal_Dark"]
):
  add_cyl(
      bm,
      0.065,
      0.065,
      half_track * 1.95,
      segs=12,
      loc=(0, y, z_axle),
      rot=(0, math.pi / 2, 0),
      mat=mat,
  )
  add_sphere(
      bm, 0.16, segs=12, rings=8, loc=(0.12, y, z_axle), scale=(0.8, 1.1, 1.0), mat=mat
  )
  for s in (-1.0, 1.0):
    sx = s * (half_track - 0.26)
    add_cyl(
        bm,
        0.038,
        0.038,
        0.38,
        segs=10,
        loc=(sx * 0.92, y - 0.08, z_axle + 0.20),
        rot=(0, -s * 0.18, 0),
        mat=mat,
    )
    add_cyl(
        bm,
        0.024,
        0.024,
        0.42,
        segs=8,
        loc=(sx * 0.92, y - 0.08, z_axle + 0.16),
        rot=(0, -s * 0.18, 0),
        mat=MI["Paint_Grey"],
    )
    if coil:
      for k in range(7):
        kz = z_axle + 0.06 + k * 0.045
        add_cyl(
            bm,
            0.075,
            0.075,
            0.022,
            segs=12,
            loc=(sx, y + 0.06, kz),
            rot=(0.12, 0, 0),
            mat=mat,
        )
    if leaf:
      for l_i in range(4):
        lw = 0.95 - l_i * 0.16
        add_box(
            bm,
            (0.08, lw, 0.022),
            loc=(sx, y, z_axle + 0.08 + l_i * 0.024),
            mat=mat,
        )
      for uy in (-0.12, 0.12):
        add_box(bm, (0.11, 0.02, 0.16), loc=(sx, y + uy, z_axle + 0.06), mat=mat)
    if arms:
      for az in (z_axle - 0.05, z_axle + 0.12):
        for ay in (-0.14, 0.14):
          add_box(
              bm,
              (0.38, 0.04, 0.035),
              loc=(s * (half_track - 0.34), y + ay * 0.5, az),
              rot=(0, 0, s * ay * 0.8),
              mat=mat,
          )


def add_headlight(
    bm, x, y, z, r, is_front=True, signal_dx=0.14, broken=False
):
  dir_y = 1.0 if is_front else -1.0
  rot_x = math.pi / 2 if is_front else -math.pi / 2
  add_cyl(
      bm,
      r * 1.12,
      r * 1.05,
      0.06,
      segs=16,
      loc=(x, y - dir_y * 0.02, z),
      rot=(rot_x, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_cyl(
      bm,
      r * 0.95,
      r * 0.25,
      0.07,
      segs=16,
      loc=(x, y - dir_y * 0.03, z),
      rot=(-rot_x, 0, 0),
      mat=MI["Paint_White"],
  )
  if not broken:
    add_sphere(
        bm,
        r * 0.32,
        segs=10,
        rings=8,
        loc=(x, y - dir_y * 0.02, z),
        mat=MI["Light_Emit"] if is_front else MI["Paint_Red"],
    )
    add_sphere(
        bm,
        r * 0.96,
        segs=14,
        rings=8,
        loc=(x, y + dir_y * 0.01, z),
        scale=(1.0, 0.32, 1.0),
        mat=MI["Glass_Dark"] if is_front else MI["Paint_Red"],
    )
  else:
    for k in range(6):
      ang = 2.0 * math.pi * k / 6.0
      add_box(
          bm,
          (r * 0.35, 0.012, r * 0.25),
          loc=(
              x + math.cos(ang) * r * 0.7,
              y + dir_y * 0.01,
              z + math.sin(ang) * r * 0.7,
          ),
          rot=(0.2, ang, 0.3),
          mat=MI["Glass_Dark"],
      )
  if signal_dx != 0.0:
    sx = x + (signal_dx if x >= 0 else -signal_dx)
    add_box(
        bm,
        (r * 0.65, 0.04, r * 0.55),
        loc=(sx, y, z - r * 0.1),
        mat=MI["Light_Emit"] if is_front else MI["Paint_Red"],
    )
    add_box(
        bm,
        (r * 0.72, 0.03, r * 0.62),
        loc=(sx, y - dir_y * 0.01, z - r * 0.1),
        mat=MI["Metal_Dark"],
    )


def add_grille(bm, x, y, z, w, h, slats=9, vertical=False, mat=MI["Metal_Dark"]):
  add_box(bm, (w, 0.04, h), loc=(x, y - 0.015, z), mat=MI["Metal_Dark"])
  add_box(bm, (w + 0.04, 0.05, 0.035), loc=(x, y, z + h * 0.5), mat=mat)
  add_box(bm, (w + 0.04, 0.05, 0.035), loc=(x, y, z - h * 0.5), mat=mat)
  add_box(bm, (0.035, 0.05, h + 0.04), loc=(x - w * 0.5, y, z), mat=mat)
  add_box(bm, (0.035, 0.05, h + 0.04), loc=(x + w * 0.5, y, z), mat=mat)
  for i in range(slats):
    t = -0.45 + 0.90 * (i / max(1, slats - 1))
    if vertical:
      add_box(
          bm,
          (w / (slats * 1.9), 0.045, h * 0.92),
          loc=(x + t * w, y + 0.008, z),
          mat=mat,
      )
    else:
      add_box(
          bm,
          (w * 0.94, 0.045, h / (slats * 1.9)),
          loc=(x, y + 0.008, z + t * h),
          rot=(0.25, 0, 0),
          mat=mat,
      )


def add_bumper_and_plate(bm, y, z, w, h, d, is_front=True, mat=MI["Metal_Dark"]):
  dir_y = 1.0 if is_front else -1.0
  add_box(
      bm,
      (w * 0.84, d, h),
      loc=(0, y, z),
      top_scale=(0.98, 0.92),
      mat=mat,
  )
  for s in (-1.0, 1.0):
    add_box(
        bm,
        (w * 0.14, d * 1.25, h * 0.96),
        loc=(s * w * 0.45, y - dir_y * d * 0.25, z),
        rot=(0, 0, -s * dir_y * 0.28),
        mat=mat,
    )
    hx = s * w * 0.28
    hy = y + dir_y * (d * 0.55)
    add_box(bm, (0.05, 0.08, 0.09), loc=(hx, hy, z), mat=MI["Metal_Dark"])
    for seg in range(5):
      ang = -math.pi * 0.5 + math.pi * seg / 4.0
      add_box(
          bm,
          (0.025, 0.03, 0.03),
          loc=(
              hx,
              hy + dir_y * (0.04 + 0.045 * math.cos(ang)),
              z - 0.02 + 0.045 * math.sin(ang),
          ),
          mat=MI["Metal_Dark"],
      )
  py = y + dir_y * (d * 0.52)
  add_box(bm, (0.38, 0.018, 0.12), loc=(0, py, z - 0.01), mat=MI["Metal_Dark"])
  add_box(
      bm,
      (0.35, 0.015, 0.095),
      loc=(0, py + dir_y * 0.006, z - 0.01),
      mat=MI["Paint_White"],
  )


def add_mirror(bm, x, y, z, side, arm_w=0.16, mw=0.14, mh=0.22, mat=MI["Metal_Dark"]):
  for dz in (-0.05, 0.05):
    add_cyl(
        bm,
        0.012,
        0.012,
        arm_w,
        segs=8,
        loc=(x + side * arm_w * 0.5, y, z + dz),
        rot=(0, math.pi / 2, -side * 0.18),
        mat=MI["Metal_Dark"],
    )
  mx = x + side * arm_w
  add_box(
      bm,
      (mw, 0.07, mh),
      loc=(mx, y - 0.02, z),
      rot=(0, 0, -side * 0.15),
      top_scale=(0.9, 0.85),
      mat=mat,
  )
  add_box(
      bm,
      (mw * 0.88, 0.015, mh * 0.88),
      loc=(mx, y - 0.052, z),
      rot=(0, 0, -side * 0.15),
      mat=MI["Glass_Dark"],
  )


def add_wiper(bm, x, y, z, length=0.46, pitch=0.75, mat=MI["Metal_Dark"]):
  add_cyl(bm, 0.018, 0.022, 0.04, segs=8, loc=(x, y, z), mat=mat)
  add_box(
      bm,
      (length * 0.65, 0.018, 0.015),
      loc=(x + length * 0.28, y - 0.04, z + 0.04),
      rot=(pitch, 0, 0.18),
      mat=mat,
  )
  add_box(
      bm,
      (length, 0.014, 0.022),
      loc=(x + length * 0.45, y - 0.07, z + 0.07),
      rot=(pitch, 0, 0.08),
      mat=MI["Rubber"],
  )


def add_handle(bm, x, y, z, side, mat=MI["Metal_Dark"]):
  add_box(bm, (0.018, 0.16, 0.055), loc=(x - side * 0.005, y, z), mat=MI["Metal_Dark"])
  add_box(bm, (0.025, 0.15, 0.026), loc=(x + side * 0.018, y, z), mat=mat)
  for dy in (-0.055, 0.055):
    add_box(bm, (0.03, 0.028, 0.026), loc=(x + side * 0.008, y + dy, z), mat=mat)


def add_jerrycan(bm, x, y, z, rot_z=0.0, mat=MI["Army_Green"]):
  verts = []
  verts += add_box(
      bm,
      (0.17, 0.35, 0.46),
      loc=(0, 0, 0),
      top_scale=(0.92, 0.94),
      mat=mat,
  )
  for sx in (-0.086, 0.086):
    verts += add_box(bm, (0.012, 0.26, 0.34), loc=(sx, 0, -0.02), mat=mat)
    for rz in (-0.65, 0.65):
      verts += add_box(
          bm, (0.018, 0.24, 0.028), loc=(sx, 0, -0.02), rot=(rz, 0, 0), mat=mat
      )
  for hx in (-0.045, 0.0, 0.045):
    verts += add_box(bm, (0.016, 0.18, 0.022), loc=(hx, -0.02, 0.25), mat=mat)
  verts += add_cyl(
      bm,
      0.028,
      0.032,
      0.07,
      segs=10,
      loc=(0, 0.12, 0.24),
      rot=(-0.45, 0, 0),
      mat=MI["Metal_Dark"],
  )
  verts += add_box(bm, (0.19, 0.37, 0.035), loc=(0, 0, -0.10), mat=MI["Metal_Dark"])
  bmesh.ops.transform(bm, matrix=xform((x, y, z), (0, 0, rot_z)), verts=verts)


def add_seat(bm, x, y, z, w=0.48, mat=MI["Canvas"], burnt=False):
  if not burnt:
    add_box(bm, (w, 0.48, 0.11), loc=(x, y, z + 0.06), top_scale=(0.95, 0.95), mat=mat)
    for sx in (-w * 0.42, w * 0.42):
      add_box(bm, (0.09, 0.46, 0.15), loc=(x + sx, y, z + 0.08), mat=mat)
      add_box(
          bm,
          (0.09, 0.14, 0.54),
          loc=(x + sx, y - 0.20, z + 0.38),
          rot=(-0.18, 0, 0),
          mat=mat,
      )
    add_box(
        bm,
        (w * 0.86, 0.11, 0.56),
        loc=(x, y - 0.21, z + 0.38),
        rot=(-0.18, 0, 0),
        mat=mat,
    )
    add_box(
        bm,
        (w * 0.56, 0.10, 0.18),
        loc=(x, y - 0.28, z + 0.74),
        rot=(-0.12, 0, 0),
        mat=mat,
    )
  for sx in (-w * 0.32, w * 0.32):
    add_box(bm, (0.03, 0.44, 0.04), loc=(x + sx, y, z + 0.02), mat=MI["Metal_Dark"])
    add_cyl(
        bm,
        0.015,
        0.015,
        0.68,
        segs=8,
        loc=(x + sx, y - 0.21, z + 0.38),
        rot=(-0.18, 0, 0),
        mat=MI["Metal_Dark"],
    )
  if burnt:
    for i in range(5):
      add_box(
          bm,
          (w * 0.65, 0.015, 0.015),
          loc=(x, y - 0.14 + i * 0.07, z + 0.05),
          mat=MI["Metal_Dark"],
      )
      add_box(
          bm,
          (w * 0.65, 0.015, 0.015),
          loc=(x, y - 0.21 - i * 0.015, z + 0.18 + i * 0.09),
          mat=MI["Metal_Dark"],
      )


def add_dash_and_steering(
    bm, y_dash, z_dash, width, steer_x, steer_r=0.20, mat_dash=MI["Metal_Dark"]
):
  add_box(
      bm,
      (width, 0.36, 0.28),
      loc=(0, y_dash, z_dash),
      top_scale=(0.96, 0.85),
      mat=mat_dash,
  )
  add_box(
      bm,
      (0.42, 0.24, 0.14),
      loc=(steer_x, y_dash - 0.04, z_dash + 0.16),
      top_scale=(0.85, 0.85),
      mat=mat_dash,
  )
  for dx in (-0.10, 0.0, 0.10):
    add_cyl(
        bm,
        0.042,
        0.042,
        0.02,
        segs=12,
        loc=(steer_x + dx, y_dash - 0.15, z_dash + 0.15),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Light_Emit"],
    )
  add_box(
      bm,
      (0.28, 0.55, 0.32),
      loc=(0, y_dash - 0.25, z_dash - 0.16),
      mat=mat_dash,
  )
  add_cyl(
      bm,
      0.016,
      0.012,
      0.28,
      segs=8,
      loc=(0.04, y_dash - 0.32, z_dash + 0.08),
      rot=(-0.22, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_sphere(
      bm, 0.032, segs=8, rings=6, loc=(0.04, y_dash - 0.35, z_dash + 0.21), mat=MI["Rubber"]
  )
  wy, wz = y_dash - 0.26, z_dash + 0.12
  add_cyl(
      bm,
      0.032,
      0.038,
      0.34,
      segs=10,
      loc=(steer_x, wy + 0.12, wz - 0.06),
      rot=(1.05, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_cyl(
      bm,
      0.055,
      0.048,
      0.06,
      segs=12,
      loc=(steer_x, wy, wz),
      rot=(1.05, 0, 0),
      mat=MI["Rubber"],
  )
  ring_verts = []
  for i in range(16):
    a0 = 2.0 * math.pi * i / 16.0
    a1 = 2.0 * math.pi * (i + 1) / 16.0
    mx = 0.5 * steer_r * (math.cos(a0) + math.cos(a1))
    mz = 0.5 * steer_r * (math.sin(a0) + math.sin(a1))
    seg_l = 2.0 * steer_r * math.sin(math.pi / 16.0) * 1.08
    ring_verts += add_cyl(
        bm,
        0.018,
        0.018,
        seg_l,
        segs=8,
        loc=(mx, 0, mz),
        rot=(0, a0 + math.pi / 2, 0),
        mat=MI["Rubber"],
    )
  for sa in (0.0, 2.2, -2.2):
    ring_verts += add_box(
        bm,
        (0.032, 0.018, steer_r * 0.92),
        loc=(
            0.46 * steer_r * math.sin(sa),
            0,
            -0.46 * steer_r * math.cos(sa),
        ),
        rot=(0, sa, 0),
        mat=MI["Metal_Dark"],
    )
  bmesh.ops.transform(
      bm, matrix=xform((steer_x, wy, wz), (-0.52, 0, 0)), verts=ring_verts
  )


def finalize_object(
    name, bm, bevel_w=0.016, target_min=22000, target_max=29000
):
  bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0004)
  bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
  mesh = bpy.data.meshes.new(name)
  for m in MAT_LIST:
    mesh.materials.append(m)
  bm.to_mesh(mesh)
  bm.free()

  obj = bpy.data.objects.new(name, mesh)
  bpy.context.collection.objects.link(obj)
  bpy.ops.object.select_all(action="DESELECT")
  obj.select_set(True)
  bpy.context.view_layer.objects.active = obj

  bev = obj.modifiers.new(name="Bevel", type="BEVEL")
  bev.width = bevel_w
  bev.segments = 1
  bev.limit_method = "ANGLE"
  bev.angle_limit = math.radians(32.0)
  bev.use_clamp_overlap = True
  bpy.ops.object.modifier_apply(modifier=bev.name)

  bm2 = bmesh.new()
  bm2.from_mesh(obj.data)
  bmesh.ops.triangulate(bm2, faces=bm2.faces)

  if len(bm2.faces) > target_max:
    ratio = (target_max - 1200) / float(len(bm2.faces))
    bm2.to_mesh(obj.data)
    bm2.free()
    dec = obj.modifiers.new(name="Decimate", type="DECIMATE")
    dec.ratio = max(0.1, min(0.98, ratio))
    bpy.ops.object.modifier_apply(modifier=dec.name)
    bm2 = bmesh.new()
    bm2.from_mesh(obj.data)
    bmesh.ops.triangulate(bm2, faces=bm2.faces)

  while len(bm2.faces) < target_min and len(bm2.faces) > 0:
    need = (target_min - len(bm2.faces) + 1) // 2
    faces_sorted = sorted(bm2.faces, key=lambda f: f.calc_area(), reverse=True)
    bmesh.ops.poke(bm2, faces=faces_sorted[: min(len(faces_sorted), need)])

  xs = [v.co.x for v in bm2.verts]
  ys = [v.co.y for v in bm2.verts]
  zs = [v.co.z for v in bm2.verts]
  cx = 0.5 * (min(xs) + max(xs))
  cy = 0.5 * (min(ys) + max(ys))
  min_z = min(zs)
  bmesh.ops.translate(bm2, verts=bm2.verts, vec=Vector((-cx, -cy, -min_z)))

  lim = math.radians(35.0)
  for f in bm2.faces:
    f.smooth = True
  for e in bm2.edges:
    e.smooth = e.calc_face_angle(0.0) <= lim

  bm2.to_mesh(obj.data)
  bm2.free()
  obj.data.update()
  obj.location = (0.0, 0.0, 0.0)
  obj.rotation_euler = (0.0, 0.0, 0.0)
  obj.scale = (1.0, 1.0, 1.0)
  return obj


def build_tank():
  bm = bmesh.new()
  hull_st = [
      body_section(-3.85, 3.35, 0.55, 1.12, 1.38, tuck=0.35, tumble=0.18),
      body_section(-3.20, 3.58, 0.44, 1.15, 1.44, tuck=0.45, tumble=0.16),
      body_section(-1.20, 3.62, 0.42, 1.16, 1.46, tuck=0.48, tumble=0.14),
      body_section(1.40, 3.62, 0.42, 1.16, 1.44, tuck=0.48, tumble=0.15),
      body_section(2.85, 3.56, 0.46, 1.12, 1.32, tuck=0.45, tumble=0.22),
      body_section(3.68, 3.40, 0.65, 1.02, 1.14, tuck=0.32, tumble=0.28),
      body_section(3.92, 3.15, 0.78, 0.94, 1.02, tuck=0.20, tumble=0.25),
  ]
  seg_m = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, hull_st, mat=MI["Army_Green"], seg_mats=seg_m)

  for side in (-1.0, 1.0):
    tx = side * 1.48
    for i in range(7):
      wy = -2.55 + i * 0.84
      for dx in (-0.16, 0.16):
        add_cyl(
            bm,
            0.39,
            0.39,
            0.16,
            segs=20,
            loc=(tx + dx, wy, 0.41),
            rot=(0, math.pi / 2, 0),
            mat=MI["Rubber"],
        )
        add_cyl(
            bm,
            0.31,
            0.28,
            0.18,
            segs=20,
            loc=(tx + dx, wy, 0.41),
            rot=(0, math.pi / 2, 0),
            mat=MI["Army_Green"],
        )
        add_cyl(
            bm,
            0.11,
            0.09,
            0.22,
            segs=12,
            loc=(tx + dx, wy, 0.41),
            rot=(0, math.pi / 2, 0),
            mat=MI["Metal_Dark"],
        )
      add_box(
          bm,
          (0.28, 0.36, 0.09),
          loc=(side * 1.15, wy - 0.14, 0.46),
          rot=(0.35, 0, 0),
          mat=MI["Metal_Dark"],
      )
    for dy_sp, r_sp, z_sp in ((-3.32, 0.38, 0.68), (3.34, 0.35, 0.66)):
      add_cyl(
          bm,
          r_sp,
          r_sp,
          0.44,
          segs=18,
          loc=(tx, dy_sp, z_sp),
          rot=(0, math.pi / 2, 0),
          mat=MI["Metal_Dark"],
      )
      if dy_sp < 0:
        for t_i in range(12):
          ang = 2.0 * math.pi * t_i / 12.0
          add_box(
              bm,
              (0.46, 0.08, 0.06),
              loc=(
                  tx,
                  dy_sp + (r_sp + 0.02) * math.cos(ang),
                  z_sp + (r_sp + 0.02) * math.sin(ang),
              ),
              rot=(ang, 0, 0),
              mat=MI["Metal_Dark"],
          )
    for ry in (-1.7, 0.0, 1.7):
      add_cyl(
          bm,
          0.14,
          0.14,
          0.36,
          segs=12,
          loc=(tx, ry, 0.96),
          rot=(0, math.pi / 2, 0),
          mat=MI["Metal_Dark"],
      )

    pts = []
    for k in range(22):
      pts.append((-2.75 + 5.50 * (k / 21.0), 0.025, 0.0))
    for k in range(10):
      a = -math.pi * 0.5 + math.pi * (k / 9.0)
      pts.append((3.34 + 0.42 * math.cos(a), 0.66 + 0.38 * math.sin(a), a + math.pi * 0.5))
    for k in range(22):
      pts.append((2.75 - 5.50 * (k / 21.0), 1.08, math.pi))
    for k in range(10):
      a = math.pi * 0.5 + math.pi * (k / 9.0)
      pts.append((-3.32 + 0.44 * math.cos(a), 0.68 + 0.40 * math.sin(a), a + math.pi * 0.5))
    for py, pz, pitch in pts:
      add_box(
          bm,
          (0.58, 0.13, 0.032),
          loc=(tx, py, pz),
          rot=(pitch, 0, 0),
          mat=MI["Metal_Dark"],
      )
      for gx in (-0.15, 0.15):
        add_box(
            bm,
            (0.22, 0.09, 0.024),
            loc=(tx + gx, py, pz - 0.015 * math.cos(pitch)),
            rot=(pitch, 0, 0),
            mat=MI["Rubber"],
        )
      add_box(
          bm,
          (0.04, 0.06, 0.065),
          loc=(tx, py, pz + 0.035 * math.cos(pitch)),
          rot=(pitch, 0, 0),
          mat=MI["Metal_Dark"],
      )

    for sk in range(7):
      sy = -2.6 + sk * 0.88
      add_box(
          bm,
          (0.08, 0.84, 0.52),
          loc=(side * 1.80, sy, 0.92),
          mat=MI["Army_Green"] if sk % 2 == 0 else MI["Concrete"],
      )
      if sk >= 2:
        add_box(
            bm,
            (0.09, 0.40, 0.26),
            loc=(side * 1.85, sy - 0.2, 1.02),
            mat=MI["Desert_Tan"],
        )
        add_box(
            bm,
            (0.09, 0.40, 0.26),
            loc=(side * 1.85, sy + 0.2, 1.02),
            mat=MI["Army_Green"],
        )

  for ix in range(8):
    ex = -1.26 + ix * 0.36
    add_box(
        bm,
        (0.33, 0.26, 0.09),
        loc=(ex, 3.45, 1.18),
        rot=(0.35, 0, 0),
        mat=MI["Army_Green"] if ix % 2 == 0 else MI["Desert_Tan"],
    )
    add_box(
        bm,
        (0.33, 0.24, 0.09),
        loc=(ex, 3.74, 1.02),
        rot=(0.55, 0, 0),
        mat=MI["Army_Green"],
    )

  for gx in (-0.85, 0.85):
    for gy in (-3.15, -2.35):
      add_grille(
          bm, gx, gy, 1.46, 0.72, 0.58, slats=8, vertical=False, mat=MI["Metal_Dark"]
      )
  add_grille(bm, 0.0, -3.86, 0.96, 1.45, 0.42, slats=10, vertical=True)
  add_bumper_and_plate(bm, 3.92, 0.78, 3.10, 0.20, 0.14, is_front=True, mat=MI["Army_Green"])
  add_bumper_and_plate(bm, -3.88, 0.82, 3.10, 0.20, 0.14, is_front=False, mat=MI["Army_Green"])
  for sx in (-1.25, 1.25):
    add_headlight(bm, sx, 3.82, 1.18, 0.11, is_front=True, signal_dx=-0.16)
    add_headlight(bm, sx, -3.86, 1.18, 0.09, is_front=False, signal_dx=-0.14)
    add_mirror(bm, sx * 1.38, 2.75, 1.42, 1.0 if sx > 0 else -1.0, mat=MI["Army_Green"])

  add_cyl(bm, 0.32, 0.34, 0.08, segs=14, loc=(0.0, 2.35, 1.45), mat=MI["Army_Green"])
  for pa in (-0.45, 0.0, 0.45):
    add_box(
        bm,
        (0.14, 0.12, 0.09),
        loc=(0.32 * math.sin(pa), 2.52 + 0.1 * math.cos(pa), 1.49),
        rot=(0, 0, -pa),
        mat=MI["Army_Green"],
    )
    add_box(
        bm,
        (0.11, 0.03, 0.05),
        loc=(0.32 * math.sin(pa), 2.58 + 0.1 * math.cos(pa), 1.50),
        rot=(0, 0, -pa),
        mat=MI["Glass_Dark"],
    )

  tur_st = [
      body_section(-2.45, 2.15, 1.46, 1.88, 2.12, tuck=0.10, tumble=0.18),
      body_section(-1.45, 2.68, 1.44, 1.92, 2.22, tuck=0.14, tumble=0.24),
      body_section(0.15, 2.86, 1.44, 1.94, 2.25, tuck=0.16, tumble=0.28),
      body_section(1.35, 2.42, 1.46, 1.88, 2.16, tuck=0.18, tumble=0.35),
      body_section(1.98, 1.48, 1.52, 1.82, 2.04, tuck=0.12, tumble=0.22),
  ]
  add_loft(bm, tur_st, mat=MI["Army_Green"])

  for side in (-1.0, 1.0):
    for k in range(5):
      add_box(
          bm,
          (0.32, 0.34, 0.11),
          loc=(side * (0.62 + k * 0.14), 1.92 - k * 0.12, 1.82),
          rot=(0.28, side * 0.35, -side * 0.55),
          mat=MI["Desert_Tan"] if k % 2 else MI["Army_Green"],
      )
    for k in range(5):
      add_box(
          bm,
          (0.10, 0.36, 0.28),
          loc=(side * 1.44, -0.85 + k * 0.42, 1.84),
          rot=(0, -side * 0.22, 0),
          mat=MI["Army_Green"],
      )
    for sg in range(6):
      r_i, c_i = sg // 3, sg % 3
      add_cyl(
          bm,
          0.042,
          0.042,
          0.28,
          segs=10,
          loc=(side * (1.28 + c_i * 0.09), 1.15 + r_i * 0.10, 1.95 + r_i * 0.09),
          rot=(1.05, 0, -side * 0.35),
          mat=MI["Metal_Dark"],
      )

  add_box(bm, (0.68, 0.48, 0.44), loc=(0.0, 1.95, 1.82), mat=MI["Army_Green"])
  add_cyl(
      bm,
      0.115,
      0.095,
      3.90,
      segs=20,
      loc=(0.0, 3.85, 1.84),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Army_Green"],
  )
  add_cyl(
      bm,
      0.155,
      0.150,
      0.72,
      segs=20,
      loc=(0.0, 3.55, 1.84),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Army_Green"],
  )
  add_cyl(
      bm,
      0.112,
      0.112,
      0.18,
      segs=20,
      loc=(0.0, 5.74, 1.84),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_cyl(
      bm,
      0.068,
      0.068,
      0.12,
      segs=16,
      loc=(0.0, 5.80, 1.84),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Rubber"],
  )

  add_cyl(bm, 0.42, 0.45, 0.18, segs=16, loc=(0.55, 0.10, 2.32), mat=MI["Army_Green"])
  for p_i in range(6):
    ang = 2.0 * math.pi * p_i / 6.0
    add_box(
        bm,
        (0.12, 0.08, 0.09),
        loc=(0.55 + 0.38 * math.sin(ang), 0.10 + 0.38 * math.cos(ang), 2.42),
        rot=(0, 0, -ang),
        mat=MI["Glass_Dark"],
    )
  add_box(bm, (0.36, 0.46, 0.32), loc=(-0.58, 0.85, 2.38), mat=MI["Army_Green"])
  add_box(bm, (0.26, 0.04, 0.20), loc=(-0.58, 1.08, 2.38), mat=MI["Glass_Dark"])

  add_box(bm, (0.14, 0.55, 0.16), loc=(0.55, 0.35, 2.62), mat=MI["Metal_Dark"])
  add_cyl(
      bm,
      0.032,
      0.025,
      0.85,
      segs=12,
      loc=(0.55, 0.95, 2.64),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_box(bm, (0.16, 0.28, 0.22), loc=(0.72, 0.35, 2.58), mat=MI["Army_Green"])

  add_box(bm, (1.85, 0.65, 0.42), loc=(0.0, -2.65, 1.95), mat=MI["Metal_Dark"])
  add_box(bm, (0.62, 0.42, 0.34), loc=(-0.45, -2.65, 2.02), mat=MI["Wood_Crate"])
  add_cyl(
      bm,
      0.18,
      0.18,
      0.68,
      segs=12,
      loc=(0.42, -2.65, 2.05),
      rot=(0, math.pi / 2, 0),
      mat=MI["Canvas"],
  )
  add_box(
      bm,
      (0.45, 0.28, 0.128),
      loc=(0.0, 2.95, 1.38),
      mat=MI["Burlap"],
  )
  add_jerrycan(bm, -1.08, -2.65, 1.98, rot_z=math.pi / 2, mat=MI["Army_Green"])
  add_jerrycan(bm, 1.08, -2.65, 1.98, rot_z=-math.pi / 2, mat=MI["Desert_Tan"])
  for ax in (-0.88, 0.88):
    add_cyl(bm, 0.015, 0.004, 1.85, segs=8, loc=(ax, -2.15, 3.10), mat=MI["Metal_Dark"])

  return finalize_object("TANK", bm, bevel_w=0.015)


def build_humvee():
  bm = bmesh.new()
  hood_st = [
      body_section(0.82, 2.12, 0.52, 1.18, 1.28, tuck=0.10, tumble=0.08),
      body_section(1.65, 2.08, 0.54, 1.14, 1.22, tuck=0.10, tumble=0.10),
      body_section(2.22, 1.96, 0.58, 1.06, 1.14, tuck=0.12, tumble=0.12),
  ]
  cab_st = [
      body_section(-2.28, 2.12, 0.54, 1.24, 1.88, tuck=0.10, tumble=0.18),
      body_section(-1.35, 2.16, 0.50, 1.24, 1.94, tuck=0.12, tumble=0.16),
      body_section(0.15, 2.16, 0.50, 1.24, 1.94, tuck=0.12, tumble=0.16),
      body_section(0.82, 2.12, 0.52, 1.22, 1.88, tuck=0.10, tumble=0.18),
  ]
  seg_tan = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Desert_Tan"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, hood_st, mat=MI["Desert_Tan"], seg_mats=seg_tan)
  add_loft(bm, cab_st, mat=MI["Desert_Tan"], seg_mats=seg_tan)

  add_grille(bm, 0.0, 1.55, 1.23, 0.92, 0.55, slats=10, vertical=False, mat=MI["Metal_Dark"])
  add_grille(bm, 0.0, 2.23, 0.90, 0.96, 0.34, slats=7, vertical=True, mat=MI["Desert_Tan"])
  for sx in (-0.72, 0.72):
    add_headlight(bm, sx, 2.21, 0.90, 0.11, is_front=True, signal_dx=0.18)
    add_headlight(bm, sx * 1.12, -2.29, 0.96, 0.085, is_front=False, signal_dx=-0.14)
    add_mirror(bm, sx * 1.48, 0.72, 1.52, 1.0 if sx > 0 else -1.0, mat=MI["Metal_Dark"])
    add_wiper(bm, sx * 0.58 - 0.16, 0.85, 1.32, length=0.42, pitch=0.95)
    add_box(bm, (0.48, 0.03, 0.44), loc=(sx * 0.68, 0.83, 1.56), rot=(-0.38, 0, 0), mat=MI["Glass_Dark"])

  add_bumper_and_plate(bm, 2.34, 0.58, 2.08, 0.18, 0.16, is_front=True)
  add_bumper_and_plate(bm, -2.35, 0.60, 2.08, 0.18, 0.16, is_front=False)
  add_cyl(
      bm, 0.09, 0.09, 0.36, segs=12, loc=(0.0, 2.38, 0.62), rot=(0, math.pi / 2, 0), mat=MI["Metal_Dark"]
  )
  for bx in (-0.52, 0.52):
    add_box(bm, (0.04, 0.12, 0.52), loc=(bx, 2.38, 0.84), mat=MI["Metal_Dark"])
  add_box(bm, (1.16, 0.04, 0.04), loc=(0.0, 2.42, 1.08), mat=MI["Metal_Dark"])

  for side in (-1.0, 1.0):
    for dy in (-0.58, 0.26):
      add_box(
          bm,
          (0.04, 0.74, 0.64),
          loc=(side * 1.08, dy, 0.92),
          mat=MI["Army_Green"],
      )
      for rz in (-0.62, 0.62):
        add_box(
            bm,
            (0.05, 0.58, 0.04),
            loc=(side * 1.09, dy, 0.90),
            rot=(rz, 0, 0),
            mat=MI["Army_Green"],
        )
      add_box(
          bm,
          (0.05, 0.58, 0.38),
          loc=(side * 1.03, dy, 1.54),
          rot=(0, -side * 0.16, 0),
          mat=MI["Glass_Dark"],
      )
      add_handle(bm, side * 1.09, dy - 0.22, 1.15, side)

  add_cyl(bm, 0.055, 0.055, 0.85, segs=12, loc=(1.10, 0.92, 1.62), mat=MI["Metal_Dark"])
  add_cyl(bm, 0.09, 0.09, 0.14, segs=12, loc=(1.10, 0.92, 2.06), mat=MI["Metal_Dark"])
  add_box(
      bm,
      (1.62, 0.85, 0.54),
      loc=(0.0, -1.78, 1.56),
      rot=(0.35, 0, 0),
      mat=MI["Canvas"],
  )
  add_box(bm, (0.48, 0.32, 0.24), loc=(0.0, -1.65, 1.15), mat=MI["Wood_Crate"])
  add_box(bm, (0.42, 0.24, 0.14), loc=(0.0, 2.28, 0.72), mat=MI["Burlap"])
  add_jerrycan(bm, -0.68, -2.38, 0.98, rot_z=0.0, mat=MI["Army_Green"])
  add_jerrycan(bm, 0.68, -2.38, 0.98, rot_z=0.0, mat=MI["Desert_Tan"])

  add_cyl(bm, 0.48, 0.52, 0.12, segs=16, loc=(0.0, -0.20, 1.98), mat=MI["Desert_Tan"])
  for k in range(5):
    ang = -1.2 + k * 0.6
    add_box(
        bm,
        (0.32, 0.04, 0.36),
        loc=(0.48 * math.sin(ang), -0.20 + 0.48 * math.cos(ang), 2.18),
        rot=(0, 0, -ang),
        mat=MI["Army_Green"],
    )
  add_box(bm, (0.14, 0.62, 0.16), loc=(0.0, 0.10, 2.34), mat=MI["Metal_Dark"])
  add_cyl(
      bm,
      0.032,
      0.024,
      0.82,
      segs=12,
      loc=(0.0, 0.68, 2.36),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_cyl(bm, 0.014, 0.004, 1.45, segs=8, loc=(-0.95, -2.15, 2.55), mat=MI["Metal_Dark"])

  add_dash_and_steering(bm, 0.62, 1.18, 1.84, -0.58, steer_r=0.19)
  for sy in (0.15, -0.68):
    for sx in (-0.62, 0.62):
      add_seat(bm, sx, sy, 0.68, w=0.46, mat=MI["Canvas"])

  for wy in (-1.52, 1.55):
    add_suspension(bm, wy, 0.46, 0.92, coil=True, leaf=False, arms=True)
    for sx in (-0.96, 0.96):
      add_wheel(
          bm,
          sx,
          wy,
          0.46,
          0.46,
          0.30,
          spokes=8,
          lugs=26,
          mat_tire=MI["Rubber"],
          mat_rim=MI["Desert_Tan"],
      )

  return finalize_object("HUMVEE", bm, bevel_w=0.015)


def build_truck():
  bm = bmesh.new()
  for sx in (-0.48, 0.48):
    add_box(bm, (0.10, 7.65, 0.22), loc=(sx, 0.0, 0.88), mat=MI["Metal_Dark"])
  for cy in range(-3, 4):
    add_box(bm, (0.98, 0.10, 0.18), loc=(0.0, cy * 1.1, 0.88), mat=MI["Metal_Dark"])

  hood_st = [
      body_section(2.15, 2.28, 0.95, 1.75, 1.98, tuck=0.12, tumble=0.14),
      body_section(2.95, 2.15, 0.95, 1.68, 1.90, tuck=0.12, tumble=0.18),
      body_section(3.75, 1.92, 0.98, 1.58, 1.78, tuck=0.14, tumble=0.22),
  ]
  cab_st = [
      body_section(0.45, 2.38, 0.95, 1.85, 2.86, tuck=0.10, tumble=0.16, crown=0.06),
      body_section(1.30, 2.40, 0.95, 1.85, 2.90, tuck=0.10, tumble=0.15, crown=0.06),
      body_section(2.15, 2.34, 0.95, 1.82, 2.82, tuck=0.10, tumble=0.18, crown=0.05),
  ]
  seg_grn = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, hood_st, mat=MI["Army_Green"], seg_mats=seg_grn)
  add_loft(bm, cab_st, mat=MI["Army_Green"], seg_mats=seg_grn)

  for side in (-1.0, 1.0):
    add_box(
        bm,
        (0.42, 1.35, 0.22),
        loc=(side * 1.02, 2.88, 1.08),
        top_scale=(0.88, 0.90),
        mat=MI["Army_Green"],
    )
    add_box(
        bm,
        (0.05, 0.98, 1.25),
        loc=(side * 1.20, 1.32, 1.72),
        mat=MI["Army_Green"],
    )
    add_box(
        bm,
        (0.06, 0.78, 0.56),
        loc=(side * 1.14, 1.32, 2.32),
        rot=(0, -side * 0.12, 0),
        mat=MI["Glass_Dark"],
    )
    add_handle(bm, side * 1.21, 0.95, 1.78, side)
    add_mirror(bm, side * 1.18, 1.88, 2.32, side, arm_w=0.22, mw=0.16, mh=0.38)
    for sz in (0.68, 0.92):
      add_box(bm, (0.24, 0.52, 0.04), loc=(side * 1.12, 1.32, sz), mat=MI["Metal_Dark"])

  for sx in (-0.52, 0.52):
    add_box(
        bm,
        (0.88, 0.04, 0.58),
        loc=(sx, 2.13, 2.34),
        rot=(-0.22, 0, 0),
        mat=MI["Glass_Dark"],
    )
    add_wiper(bm, sx - 0.18, 2.16, 2.08, length=0.46, pitch=1.15)
  add_box(
      bm, (2.22, 0.24, 0.06), loc=(0.0, 2.18, 2.72), rot=(0.35, 0, 0), mat=MI["Army_Green"]
  )
  for mx in (-0.75, -0.35, 0.0, 0.35, 0.75):
    add_box(bm, (0.08, 0.10, 0.05), loc=(mx, 2.02, 2.94), mat=MI["Light_Emit"])

  add_grille(bm, 0.0, 3.76, 1.42, 1.18, 0.68, slats=11, vertical=True)
  for sx in (-0.82, 0.82):
    add_headlight(bm, sx, 3.74, 1.28, 0.12, is_front=True, signal_dx=0.18)
    add_headlight(bm, sx * 1.15, -3.84, 0.88, 0.095, is_front=False, signal_dx=-0.16)
  add_bumper_and_plate(bm, 3.88, 0.82, 2.38, 0.24, 0.18, is_front=True)
  add_bumper_and_plate(bm, -3.88, 0.78, 2.36, 0.22, 0.16, is_front=False)

  add_cyl(bm, 0.07, 0.07, 2.35, segs=12, loc=(1.22, 0.52, 2.15), mat=MI["Metal_Dark"])
  add_cyl(bm, 0.105, 0.105, 1.35, segs=14, loc=(1.22, 0.52, 1.98), mat=MI["Metal_Dark"])
  add_cyl(
      bm,
      0.26,
      0.26,
      0.95,
      segs=14,
      loc=(-0.92, 0.05, 0.78),
      rot=(math.pi / 2, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_wheel(bm, 0.92, 0.12, 1.55, 0.51, 0.28, spokes=8, lugs=24, mat_rim=MI["Army_Green"])
  add_jerrycan(bm, -1.02, -0.45, 0.88, rot_z=math.pi / 2, mat=MI["Army_Green"])
  add_jerrycan(bm, 1.02, -0.45, 0.88, rot_z=-math.pi / 2, mat=MI["Desert_Tan"])

  add_dash_and_steering(bm, 1.92, 1.74, 2.08, -0.62, steer_r=0.22)
  for sx in (-0.64, 0.64):
    add_seat(bm, sx, 1.25, 1.18, w=0.52, mat=MI["Canvas"])

  add_box(bm, (2.44, 4.18, 0.14), loc=(0.0, -1.75, 1.12), mat=MI["Army_Green"])
  for side in (-1.0, 1.0):
    add_box(bm, (0.07, 4.16, 0.72), loc=(side * 1.19, -1.75, 1.52), mat=MI["Army_Green"])
    for r_i in range(9):
      add_box(
          bm,
          (0.09, 0.07, 0.76),
          loc=(side * 1.21, -3.65 + r_i * 0.47, 1.52),
          mat=MI["Army_Green"],
      )
  add_box(bm, (2.36, 0.07, 0.72), loc=(0.0, -3.81, 1.52), mat=MI["Army_Green"])

  tarp_st = []
  for ty in (-3.80, -3.00, -2.15, -1.30, -0.45, 0.28):
    prof = [
        (1.18, ty, 1.86),
        (1.16, ty, 2.52),
        (0.88, ty, 2.94),
        (0.0, ty, 3.08),
        (-0.88, ty, 2.94),
        (-1.16, ty, 2.52),
        (-1.18, ty, 1.86),
    ]
    tarp_st.append(prof)
  add_loft(bm, tarp_st, mat=MI["Canvas"], closed_loop=False, cap_ends=False)
  for by in (-3.75, -2.95, -2.15, -1.35, -0.55, 0.25):
    add_box(bm, (2.30, 0.04, 0.04), loc=(0.0, by, 2.96), mat=MI["Metal_Dark"])

  for cx, cy in ((-0.55, -1.2), (0.52, -1.4), (-0.48, -2.3), (0.55, -2.6)):
    add_box(bm, (0.68, 0.58, 0.48), loc=(cx, cy, 1.44), mat=MI["Wood_Crate"])
  for bx in (-0.42, 0.42):
    add_box(bm, (0.55, 0.36, 0.20), loc=(bx, -3.35, 1.30), mat=MI["Burlap"])

  add_suspension(bm, 2.88, 0.52, 0.96, coil=False, leaf=True, arms=True)
  add_wheel(bm, -1.04, 2.88, 0.52, 0.52, 0.30, spokes=8, lugs=24, mat_rim=MI["Army_Green"])
  add_wheel(bm, 1.04, 2.88, 0.52, 0.52, 0.30, spokes=8, lugs=24, mat_rim=MI["Army_Green"])
  for ry in (-1.65, -2.95):
    add_suspension(bm, ry, 0.52, 0.82, coil=False, leaf=True, arms=True)
    for sx in (-0.92, 0.92):
      add_wheel(
          bm,
          sx,
          ry,
          0.52,
          0.52,
          0.26,
          spokes=8,
          lugs=22,
          mat_rim=MI["Army_Green"],
          dual=True,
      )

  return finalize_object("TRUCK", bm, bevel_w=0.016)


def build_heli():
  bm = bmesh.new()
  fuse_spec = [
      (-7.20, 0.28, 1.85, 2.15, 2.45, 0.04, 0.04),
      (-6.10, 0.55, 1.45, 1.82, 2.18, 0.06, 0.08),
      (-4.60, 0.85, 1.25, 1.68, 2.12, 0.08, 0.12),
      (-2.90, 1.48, 0.92, 1.56, 2.18, 0.12, 0.18),
      (-1.60, 2.22, 0.68, 1.45, 2.24, 0.14, 0.16),
      (0.20, 2.28, 0.66, 1.45, 2.26, 0.14, 0.16),
      (1.85, 2.18, 0.68, 1.42, 2.18, 0.16, 0.22),
      (3.15, 1.78, 0.74, 1.28, 1.72, 0.22, 0.36),
      (4.15, 1.18, 0.84, 1.12, 1.32, 0.24, 0.32),
      (4.65, 0.52, 0.94, 1.04, 1.12, 0.14, 0.18),
  ]
  fuse_st = [
      body_section(y, w, zb, zm, zt, tuck=tk, tumble=tb, crown=0.05)
      for (y, w, zb, zm, zt, tk, tb) in fuse_spec
  ]
  seg_heli = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Army_Green"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, fuse_st, mat=MI["Army_Green"], seg_mats=seg_heli)

  for side in (-1.0, 1.0):
    add_box(
        bm,
        (0.56, 3.15, 0.72),
        loc=(side * 0.62, -0.35, 2.48),
        top_scale=(0.82, 0.92),
        mat=MI["Army_Green"],
    )
    add_cyl(
        bm,
        0.26,
        0.22,
        0.48,
        segs=16,
        loc=(side * 0.62, 1.22, 2.48),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Metal_Dark"],
    )
    add_cyl(
        bm,
        0.10,
        0.02,
        0.32,
        segs=12,
        loc=(side * 0.62, 1.32, 2.48),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Army_Green"],
    )
    add_cyl(
        bm,
        0.24,
        0.28,
        0.65,
        segs=14,
        loc=(side * 0.62, -1.95, 2.54),
        rot=(-1.25, 0, side * 0.18),
        mat=MI["Concrete"],
    )

  for sx in (-0.48, 0.48):
    add_box(
        bm,
        (0.76, 0.05, 0.68),
        loc=(sx, 2.68, 1.74),
        rot=(-0.55, 0, sx * 0.18),
        mat=MI["Glass_Dark"],
    )
    add_wiper(bm, sx - 0.16, 2.75, 1.48, length=0.44, pitch=0.72)
    add_box(
        bm,
        (0.58, 0.04, 0.34),
        loc=(sx * 1.15, 3.45, 1.02),
        rot=(0.45, 0, sx * 0.25),
        mat=MI["Glass_Dark"],
    )
  add_grille(bm, 0.0, 1.35, 2.52, 0.56, 0.32, slats=7, vertical=False)
  add_bumper_and_plate(bm, 4.45, 0.85, 0.88, 0.12, 0.10, is_front=True)

  add_sphere(bm, 0.22, segs=14, rings=10, loc=(0.0, 4.42, 0.78), mat=MI["Metal_Dark"])
  for lx in (-0.07, 0.07):
    add_cyl(
        bm,
        0.055,
        0.055,
        0.06,
        segs=12,
        loc=(lx, 4.61, 0.78),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Glass_Dark"],
    )
  for sx in (-0.42, 0.42):
    add_headlight(bm, sx, 4.18, 0.92, 0.085, is_front=True, signal_dx=0.14)
    add_mirror(bm, sx * 2.15, 2.55, 1.65, 1.0 if sx > 0 else -1.0)

  for side in (-1.0, 1.0):
    add_box(
        bm,
        (0.06, 1.75, 1.18),
        loc=(side * 1.15, -0.55, 1.42),
        mat=MI["Army_Green"],
    )
    for wy in (-1.05, -0.15):
      add_box(
          bm,
          (0.08, 0.68, 0.52),
          loc=(side * 1.15, wy, 1.62),
          mat=MI["Glass_Dark"],
      )
    add_handle(bm, side * 1.18, 0.18, 1.35, side)
    add_box(
        bm,
        (0.06, 0.58, 0.62),
        loc=(side * 1.12, 1.95, 1.62),
        rot=(0, -side * 0.14, 0),
        mat=MI["Glass_Dark"],
    )

    gx = side * 1.18
    gy, gz = 0.68, 1.36
    add_cyl(bm, 0.04, 0.04, 0.48, segs=10, loc=(gx, gy, gz - 0.18), mat=MI["Metal_Dark"])
    add_box(bm, (0.22, 0.34, 0.18), loc=(gx + side * 0.08, gy, gz + 0.06), mat=MI["Metal_Dark"])
    for b_i in range(6):
      ang = 2.0 * math.pi * b_i / 6.0
      add_cyl(
          bm,
          0.012,
          0.012,
          0.68,
          segs=8,
          loc=(
              gx + side * 0.38,
              gy + 0.22 + 0.038 * math.cos(ang),
              gz + 0.06 + 0.038 * math.sin(ang),
          ),
          rot=(0, side * 1.15, 0.42),
          mat=MI["Metal_Dark"],
      )
    add_box(bm, (0.28, 0.32, 0.26), loc=(gx - side * 0.25, gy, gz - 0.28), mat=MI["Army_Green"])

  add_dash_and_steering(bm, 2.55, 1.32, 1.58, -0.45, steer_r=0.16, mat_dash=MI["Desert_Tan"])
  for sx in (-0.48, 0.48):
    add_seat(bm, sx, 1.95, 0.88, w=0.46, mat=MI["Canvas"])
    for ty in (0.45, -0.35, -1.15):
      add_seat(bm, sx * 1.12, ty, 0.86, w=0.42, mat=MI["Canvas"])
  add_box(bm, (0.55, 0.42, 0.34), loc=(0.0, -1.25, 0.92), mat=MI["Wood_Crate"])
  add_box(bm, (0.46, 0.32, 0.18), loc=(0.0, -0.65, 0.82), mat=MI["Burlap"])
  add_jerrycan(bm, 0.0, -1.75, 0.96, rot_z=0.0, mat=MI["Army_Green"])

  for ry in (-6.0, -4.8, -3.6, -2.4, -1.2, 0.0, 1.2, 2.4):
    for a_i in range(10):
      ang = -2.2 + 4.4 * (a_i / 9.0)
      rx = math.sin(ang) * (1.12 if abs(ry) < 2.2 else 0.52)
      rz = 1.45 + math.cos(ang) * (0.78 if abs(ry) < 2.2 else 0.42)
      add_sphere(bm, 0.016, segs=6, rings=4, loc=(rx, ry, rz), mat=MI["Metal_Dark"])

  for ax in (-0.42, 0.42):
    add_cyl(
        bm,
        0.014,
        0.014,
        2.65,
        segs=8,
        loc=(ax, -4.45, 1.55),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Metal_Dark"],
    )
    for sy in (-5.6, -4.4, -3.2):
      add_box(bm, (0.14, 0.02, 0.02), loc=(ax * 0.85, sy, 1.55), mat=MI["Metal_Dark"])
  add_box(
      bm, (0.04, 0.38, 0.42), loc=(0.0, 2.65, 2.38), rot=(-0.45, 0, 0), mat=MI["Metal_Dark"]
  )
  add_box(
      bm, (0.04, 0.38, 0.42), loc=(0.0, 2.95, 0.52), rot=(0.45, 0, 0), mat=MI["Metal_Dark"]
  )

  add_cyl(bm, 0.28, 0.32, 0.58, segs=18, loc=(0.0, 0.15, 2.96), mat=MI["Metal_Dark"])
  add_cyl(bm, 0.46, 0.42, 0.14, segs=18, loc=(0.0, 0.15, 3.18), mat=MI["Metal_Dark"])
  for b_i in range(4):
    az = b_i * math.pi * 0.5 + 0.35
    ca, sa = math.cos(az), math.sin(az)
    add_box(
        bm,
        (0.22, 0.55, 0.10),
        loc=(0.52 * sa, 0.15 + 0.52 * ca, 3.18),
        rot=(0, 0, -az),
        mat=MI["Metal_Dark"],
    )
    add_cyl(
        bm,
        0.022,
        0.022,
        0.34,
        segs=8,
        loc=(0.36 * sa + 0.12 * ca, 0.15 + 0.36 * ca - 0.12 * sa, 3.04),
        mat=MI["Metal_Dark"],
    )
    b_profs = []
    for st in range(10):
      r = 0.72 + st * 0.64
      chord = 0.52 if st < 9 else 0.36
      thk = 0.065 if st < 9 else 0.035
      pitch = 0.14 - st * 0.012
      sweep = -0.18 if st == 9 else 0.0
      raw_af = [
          (-chord * 0.30 + sweep, 0.0),
          (-chord * 0.18 + sweep, thk * 0.65),
          (0.05 * chord + sweep, thk * 0.78),
          (0.38 * chord + sweep, thk * 0.38),
          (0.70 * chord + sweep, 0.0),
          (0.38 * chord + sweep, -thk * 0.18),
          (0.05 * chord + sweep, -thk * 0.26),
          (-chord * 0.18 + sweep, -thk * 0.22),
      ]
      pts = []
      for cx_l, cz_l in raw_af:
        rx_l = cx_l * math.cos(pitch) - cz_l * math.sin(pitch)
        rz_l = cx_l * math.sin(pitch) + cz_l * math.cos(pitch)
        px = r * sa + rx_l * ca
        py = 0.15 + r * ca - rx_l * sa
        pz = 3.18 + rz_l - 0.012 * (r - 0.72)
        pts.append((px, py, pz))
      b_profs.append(pts)
    add_loft(
        bm,
        b_profs,
        mat=MI["Metal_Dark"],
        station_mats=[MI["Metal_Dark"]] * 8 + [MI["Paint_Red"]],
    )

  fin_st = [
      body_section(-7.05, 0.36, 1.95, 2.55, 3.65, tuck=0.04, tumble=0.10),
      body_section(-7.75, 0.22, 2.25, 2.85, 3.78, tuck=0.04, tumble=0.08),
  ]
  add_loft(bm, fin_st, mat=MI["Army_Green"])
  add_box(
      bm,
      (2.65, 0.62, 0.08),
      loc=(0.0, -7.25, 2.02),
      rot=(0.15, 0, 0),
      top_scale=(0.88, 0.80),
      mat=MI["Army_Green"],
  )
  add_cyl(
      bm,
      0.16,
      0.14,
      0.28,
      segs=14,
      loc=(0.24, -7.42, 3.42),
      rot=(0, math.pi / 2, 0),
      mat=MI["Metal_Dark"],
  )
  for tb in range(4):
    ang = tb * math.pi * 0.5 + 0.4
    add_box(
        bm,
        (0.035, 0.22, 1.28),
        loc=(0.36, -7.42 + 0.62 * math.cos(ang), 3.42 + 0.62 * math.sin(ang)),
        rot=(ang, 0, 0.18),
        mat=MI["Metal_Dark"],
    )

  for side in (-1.0, 1.0):
    add_box(
        bm,
        (0.55, 1.15, 0.28),
        loc=(side * 1.25, 0.55, 0.76),
        top_scale=(0.82, 0.88),
        mat=MI["Army_Green"],
    )
    add_cyl(
        bm,
        0.055,
        0.048,
        1.15,
        segs=10,
        loc=(side * 1.22, 0.55, 1.12),
        rot=(0, -side * 0.38, 0),
        mat=MI["Metal_Dark"],
    )
    add_wheel(
        bm,
        side * 1.48,
        0.55,
        0.34,
        0.34,
        0.22,
        spokes=6,
        lugs=20,
        mat_rim=MI["Metal_Dark"],
    )
  add_cyl(
      bm,
      0.045,
      0.040,
      1.65,
      segs=10,
      loc=(0.0, -6.55, 1.12),
      rot=(-0.55, 0, 0),
      mat=MI["Metal_Dark"],
  )
  add_wheel(bm, 0.0, -7.05, 0.22, 0.22, 0.14, spokes=5, lugs=16, mat_rim=MI["Metal_Dark"])

  return finalize_object("HELI", bm, bevel_w=0.014)


def build_car_burnt():
  bm = bmesh.new()
  car_spec = [
      (-2.22, 1.56, 0.24, 0.62, 0.78, 0.12, 0.14, 0.01),
      (-1.85, 1.74, 0.20, 0.68, 0.86, 0.10, 0.14, 0.02),
      (-1.32, 1.80, 0.18, 0.72, 0.88, 0.10, 0.16, 0.02),
      (-0.88, 1.80, 0.18, 0.74, 1.26, 0.10, 0.24, 0.02),
      (-0.15, 1.82, 0.17, 0.74, 1.28, 0.10, 0.24, -0.02),
      (0.62, 1.80, 0.18, 0.72, 1.24, 0.10, 0.25, 0.01),
      (1.08, 1.78, 0.18, 0.70, 0.86, 0.10, 0.14, 0.02),
      (1.75, 1.72, 0.20, 0.66, 0.80, 0.12, 0.16, 0.02),
      (2.22, 1.52, 0.24, 0.56, 0.68, 0.14, 0.18, 0.01),
  ]
  car_st = [
      body_section(y, w, zb, zm, zt, tuck=tk, tumble=tb, crown=cr)
      for (y, w, zb, zm, zt, tk, tb, cr) in car_spec
  ]
  seg_burnt = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Metal_Dark"],
      MI["Paint_Grey"],
      MI["Metal_Dark"],
      MI["Wood_Crate"],
      MI["Metal_Dark"],
      MI["Paint_Grey"],
      MI["Metal_Dark"],
      MI["Wood_Crate"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, car_st, mat=MI["Metal_Dark"], seg_mats=seg_burnt)

  add_box(
      bm,
      (1.42, 0.96, 0.05),
      loc=(0.0, 1.56, 0.94),
      rot=(-0.22, 0.04, 0.02),
      top_scale=(0.90, 0.92),
      mat=MI["Paint_Grey"],
  )
  add_box(bm, (0.52, 0.62, 0.38), loc=(0.0, 1.52, 0.54), mat=MI["Metal_Dark"])
  for cy in (1.32, 1.45, 1.58, 1.71):
    add_cyl(bm, 0.055, 0.055, 0.12, segs=10, loc=(0.0, cy, 0.76), mat=MI["Paint_Grey"])
    add_box(bm, (0.18, 0.05, 0.06), loc=(-0.28, cy, 0.68), mat=MI["Wood_Crate"])
  add_box(bm, (0.78, 0.08, 0.36), loc=(0.0, 2.02, 0.54), mat=MI["Metal_Dark"])
  add_box(bm, (0.28, 0.22, 0.20), loc=(-0.48, 1.72, 0.62), mat=MI["Concrete"])
  for sx in (-0.62, 0.62):
    add_cyl(bm, 0.11, 0.13, 0.24, segs=12, loc=(sx, 1.48, 0.66), mat=MI["Metal_Dark"])

  for side in (-1.0, 1.0):
    for dy in (-0.42, 0.32):
      add_box(
          bm,
          (0.05, 0.68, 0.48),
          loc=(side * 0.91, dy, 0.52),
          mat=MI["Metal_Dark"],
      )
      add_handle(bm, side * 0.92, dy - 0.18, 0.68, side, mat=MI["Paint_Grey"])
      for k in range(5):
        sy = dy - 0.26 + k * 0.13
        add_box(
            bm,
            (0.02, 0.09, 0.14 + (k % 2) * 0.06),
            loc=(side * 0.82, sy, 0.82),
            rot=(0.25 * (k - 2), -side * 0.22, 0.18),
            mat=MI["Glass_Dark"],
        )
    add_mirror(bm, side * 0.88, 0.76, 0.82, side, mat=MI["Metal_Dark"])

  for wy, pitch in ((0.88, -0.58), (-1.08, 0.58)):
    for k in range(8):
      sx = -0.64 + k * 0.18
      add_box(
          bm,
          (0.14, 0.02, 0.18 + (k % 3) * 0.05),
          loc=(sx, wy, 0.92),
          rot=(pitch, 0.15 * (k % 2 - 0.5), 0.2 * (k - 3.5)),
          mat=MI["Glass_Dark"],
      )
  for sx in (-0.42, 0.42):
    add_wiper(bm, sx - 0.14, 0.98, 0.84, length=0.38, pitch=0.45)

  add_grille(bm, 0.0, 2.21, 0.52, 0.84, 0.24, slats=8, vertical=False)
  for sx in (-0.58, 0.58):
    add_headlight(bm, sx, 2.18, 0.56, 0.095, is_front=True, signal_dx=0.14, broken=True)
    add_headlight(bm, sx, -2.20, 0.62, 0.095, is_front=False, signal_dx=-0.14, broken=True)
  add_bumper_and_plate(bm, 2.25, 0.32, 1.66, 0.16, 0.14, is_front=True, mat=MI["Concrete"])
  add_bumper_and_plate(bm, -2.25, 0.34, 1.68, 0.16, 0.14, is_front=False, mat=MI["Concrete"])

  add_box(bm, (0.48, 0.38, 0.26), loc=(-0.22, -1.68, 0.52), mat=MI["Wood_Crate"])
  add_box(bm, (0.42, 0.28, 0.14), loc=(0.24, -1.68, 0.46), mat=MI["Burlap"])
  add_jerrycan(bm, 0.0, -1.78, 0.58, rot_z=0.45, mat=MI["Metal_Dark"])

  add_dash_and_steering(bm, 0.64, 0.68, 1.48, -0.42, steer_r=0.17, mat_dash=MI["Concrete"])
  for sy in (0.12, -0.62):
    for sx in (-0.42, 0.42):
      add_seat(bm, sx, sy, 0.24, w=0.42, mat=MI["Canvas"], burnt=True)

  for wy in (-1.38, 1.38):
    add_suspension(bm, wy, 0.24, 0.74, coil=True, leaf=False, arms=True)
    for sx in (-0.78, 0.78):
      add_wheel(
          bm,
          sx,
          wy,
          0.24,
          0.25,
          0.22,
          spokes=7,
          lugs=18,
          mat_rim=MI["Metal_Dark"],
          has_tire=False,
      )

  return finalize_object("CAR_BURNT", bm, bevel_w=0.013)


def build_bus():
  bm = bmesh.new()
  bus_spec = [
      (-5.58, 2.42, 0.38, 1.38, 2.96, 0.10, 0.12, 0.06),
      (-5.15, 2.52, 0.34, 1.42, 3.04, 0.08, 0.08, 0.08),
      (-3.20, 2.54, 0.32, 1.42, 3.06, 0.08, 0.08, 0.08),
      (0.00, 2.54, 0.32, 1.42, 3.06, 0.08, 0.08, 0.08),
      (3.20, 2.54, 0.32, 1.42, 3.06, 0.08, 0.08, 0.08),
      (5.12, 2.50, 0.34, 1.38, 3.02, 0.08, 0.10, 0.07),
      (5.58, 2.36, 0.38, 1.32, 2.88, 0.12, 0.16, 0.05),
  ]
  bus_st = [
      body_section(y, w, zb, zm, zt, tuck=tk, tumble=tb, crown=cr)
      for (y, w, zb, zm, zt, tk, tb, cr) in bus_spec
  ]
  seg_bus = [
      MI["Concrete"],
      MI["Concrete"],
      MI["Paint_Blue"],
      MI["Paint_Blue"],
      MI["Paint_White"],
      MI["Paint_White"],
      MI["Paint_White"],
      MI["Paint_White"],
      MI["Paint_Blue"],
      MI["Paint_Blue"],
      MI["Concrete"],
      MI["Concrete"],
  ]
  add_loft(bm, bus_st, mat=MI["Paint_Blue"], seg_mats=seg_bus)

  add_box(
      bm,
      (2.26, 0.08, 1.24),
      loc=(0.0, 5.52, 2.02),
      rot=(-0.12, 0, 0),
      mat=MI["Glass_Dark"],
  )
  add_box(bm, (1.68, 0.08, 0.28), loc=(0.0, 5.45, 2.82), mat=MI["Light_Emit"])
  add_box(bm, (1.88, 0.06, 0.78), loc=(0.0, -5.56, 2.15), mat=MI["Glass_Dark"])
  add_box(bm, (1.12, 0.06, 0.22), loc=(0.0, -5.56, 2.78), mat=MI["Light_Emit"])

  for wy in (-4.4, -2.9, -1.4, 0.1, 1.6, 3.1):
    add_box(bm, (0.06, 1.32, 1.12), loc=(-1.25, wy, 2.04), mat=MI["Glass_Dark"])
    add_box(bm, (0.08, 1.32, 0.05), loc=(-1.26, wy, 2.38), mat=MI["Metal_Dark"])
    if wy not in (0.1, -4.4):
      add_box(bm, (0.06, 1.32, 1.12), loc=(1.25, wy, 2.04), mat=MI["Glass_Dark"])
      add_box(bm, (0.08, 1.32, 0.05), loc=(1.26, wy, 2.38), mat=MI["Metal_Dark"])

  for dy in (4.35, 0.10, -4.40):
    for leaf in (-0.28, 0.28):
      add_box(
          bm,
          (0.06, 0.50, 2.12),
          loc=(1.22, dy + leaf, 1.48),
          mat=MI["Rubber"],
      )
      add_box(
          bm,
          (0.08, 0.38, 1.45),
          loc=(1.22, dy + leaf, 1.72),
          mat=MI["Glass_Dark"],
      )
    add_handle(bm, 1.26, dy - 0.62, 1.42, 1.0)

  for ac_y in (-1.85, 1.65):
    add_box(
        bm,
        (1.65, 2.35, 0.24),
        loc=(0.0, ac_y, 3.18),
        top_scale=(0.88, 0.90),
        mat=MI["Paint_White"],
    )
    for fy in (-0.55, 0.55):
      add_cyl(
          bm, 0.36, 0.36, 0.06, segs=14, loc=(0.0, ac_y + fy, 3.29), mat=MI["Metal_Dark"]
      )
  for hy in (-3.8, 3.8):
    add_box(bm, (0.72, 0.72, 0.08), loc=(0.0, hy, 3.14), mat=MI["Paint_White"])

  add_grille(bm, 0.0, 5.58, 0.86, 1.24, 0.34, slats=7, vertical=False)
  add_grille(bm, 0.0, -5.58, 1.12, 1.56, 0.68, slats=11, vertical=False)
  for sx in (-0.92, 0.92):
    add_headlight(bm, sx, 5.56, 0.88, 0.11, is_front=True, signal_dx=0.18)
    add_headlight(bm, sx * 0.82, 5.56, 0.88, 0.09, is_front=True, signal_dx=0.0)
    add_headlight(bm, sx * 1.05, -5.56, 1.05, 0.10, is_front=False, signal_dx=-0.16)
    add_mirror(bm, sx * 1.34, 5.38, 2.35, 1.0 if sx > 0 else -1.0, arm_w=0.26, mw=0.18, mh=0.42)
    add_wiper(bm, sx * 0.65 - 0.22, 5.56, 1.48, length=0.68, pitch=1.35)
  add_bumper_and_plate(bm, 5.62, 0.54, 2.46, 0.26, 0.18, is_front=True, mat=MI["Paint_Grey"])
  add_bumper_and_plate(bm, -5.62, 0.56, 2.46, 0.26, 0.18, is_front=False, mat=MI["Paint_Grey"])

  add_dash_and_steering(bm, 5.05, 1.25, 2.15, -0.74, steer_r=0.24, mat_dash=MI["Paint_Grey"])
  add_seat(bm, -0.74, 4.35, 0.68, w=0.52, mat=MI["Canvas"])
  add_box(bm, (0.88, 0.05, 1.65), loc=(-0.72, 3.85, 1.38), mat=MI["Glass_Dark"])

  for r_i in range(6):
    sy = 3.15 - r_i * 1.32
    for side in (-1.0, 1.0):
      for col in (0, 1):
        sx = side * (0.94 - col * 0.44)
        add_seat(
            bm,
            sx,
            sy,
            0.62,
            w=0.41,
            mat=MI["Paint_Blue"] if (r_i + col) % 2 == 0 else MI["Canvas"],
        )
    for side in (-1.0, 1.0):
      add_cyl(
          bm,
          0.022,
          0.022,
          2.25,
          segs=8,
          loc=(side * 0.42, sy + 0.35, 1.62),
          mat=MI["Paint_White"],
      )
  for side in (-1.0, 1.0):
    add_cyl(
        bm,
        0.022,
        0.022,
        8.60,
        segs=8,
        loc=(side * 0.42, -0.40, 2.68),
        rot=(math.pi / 2, 0, 0),
        mat=MI["Paint_White"],
    )

  add_box(bm, (0.48, 0.36, 0.28), loc=(-0.75, -5.05, 0.85), mat=MI["Wood_Crate"])
  add_box(bm, (0.42, 0.28, 0.16), loc=(0.75, -5.05, 0.78), mat=MI["Burlap"])
  add_jerrycan(bm, 0.0, -5.12, 0.88, rot_z=0.0, mat=MI["Paint_Red"])

  add_suspension(bm, 3.25, 0.51, 0.98, coil=True, leaf=False, arms=True)
  for sx in (-1.06, 1.06):
    add_wheel(
        bm, sx, 3.25, 0.51, 0.51, 0.28, spokes=10, lugs=26, mat_rim=MI["Paint_White"]
    )
  add_suspension(bm, -2.85, 0.51, 0.84, coil=True, leaf=True, arms=True)
  for sx in (-0.94, 0.94):
    add_wheel(
        bm,
        sx,
        -2.85,
        0.51,
        0.51,
        0.26,
        spokes=10,
        lugs=26,
        mat_rim=MI["Paint_White"],
        dual=True,
    )

  return finalize_object("BUS", bm, bevel_w=0.016)


objs = [
    build_tank(),
    build_humvee(),
    build_truck(),
    build_heli(),
    build_car_burnt(),
    build_bus(),
]

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
)

for o in objs:
  print(f"{o.name}: {len(o.data.polygons)} tris")
print("OK props.glb")
