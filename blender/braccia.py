import math
import os
import sys
import bmesh
import bpy
from mathutils import Matrix, Vector

bpy.ops.wm.read_factory_settings(use_empty=True)


def get_output_path():
  argv = sys.argv
  if "--" in argv:
    idx = argv.index("--")
    if idx + 1 < len(argv):
      return argv[-1]
  return "arms.glb"


def make_material(name, rgb, roughness=0.8, metallic=0.0):
  mat = bpy.data.materials.new(name=name)
  mat.use_nodes = True
  nodes = mat.node_tree.nodes
  bsdf = nodes.get("Principled BSDF")
  if bsdf is None:
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
  bsdf.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
  bsdf.inputs["Roughness"].default_value = roughness
  bsdf.inputs["Metallic"].default_value = metallic
  return mat


MAT_GLOVE = make_material("Glove", (0.06, 0.06, 0.055), roughness=0.75)
MAT_PAD = make_material("Glove_Pad", (0.12, 0.11, 0.09), roughness=0.85)
MAT_SLEEVE = make_material("Sleeve_Camo", (0.22, 0.25, 0.15), roughness=0.9)
MAT_CAMO_BROWN = make_material(
    "Sleeve_Camo_Brown", (0.25, 0.18, 0.10), roughness=0.9
)
MAT_CAMO_BLACK = make_material(
    "Sleeve_Camo_Black", (0.05, 0.05, 0.05), roughness=0.9
)
MAT_WATCH = make_material(
    "Watch", (0.03, 0.03, 0.03), roughness=0.35, metallic=0.6
)

ALL_MATS = [
    MAT_GLOVE,
    MAT_PAD,
    MAT_SLEEVE,
    MAT_CAMO_BROWN,
    MAT_CAMO_BLACK,
    MAT_WATCH,
]
MAT_IDX = {m.name: i for i, m in enumerate(ALL_MATS)}


def frame_along(tangent):
  t = tangent.normalized()
  up = Vector((0.0, 0.0, 1.0))
  if abs(t.dot(up)) > 0.92:
    up = Vector((1.0, 0.0, 0.0))
  b = t.cross(up).normalized()
  n = b.cross(t).normalized()
  return t, b, n


def add_grid_faces(bm, rings, mat_idx, closed_u=True, cap_start=False, cap_end=False):
  nr = len(rings)
  nu = len(rings[0])
  for i in range(nr - 1):
    r0 = rings[i]
    r1 = rings[i + 1]
    u_lim = nu if closed_u else nu - 1
    for j in range(u_lim):
      jn = (j + 1) % nu
      v00, v01 = r0[j], r0[jn]
      v11, v10 = r1[jn], r1[j]
      if len({v00, v01, v11, v10}) == 4:
        try:
          f = bm.faces.new((v00, v01, v11, v10))
          f.material_index = mat_idx
          f.smooth = True
        except ValueError:
          pass

  if cap_start and closed_u:
    c0 = sum((v.co for v in rings[0]), Vector((0.0, 0.0, 0.0))) / nu
    vc = bm.verts.new(c0)
    for j in range(nu):
      jn = (j + 1) % nu
      try:
        f = bm.faces.new((rings[0][jn], rings[0][j], vc))
        f.material_index = mat_idx
        f.smooth = True
      except ValueError:
        pass

  if cap_end and closed_u:
    c1 = sum((v.co for v in rings[-1]), Vector((0.0, 0.0, 0.0))) / nu
    vc = bm.verts.new(c1)
    for j in range(nu):
      jn = (j + 1) % nu
      try:
        f = bm.faces.new((rings[-1][j], rings[-1][jn], vc))
        f.material_index = mat_idx
        f.smooth = True
      except ValueError:
        pass


def add_lofted_box_strip(bm, points, up_vec, width_fn, thick_fn, mat_idx, n_seg=8):
  rings = []
  n_pts = len(points)
  for i, p in enumerate(points):
    if i == 0:
      tang = points[1] - points[0]
    elif i == n_pts - 1:
      tang = points[-1] - points[-2]
    else:
      tang = points[i + 1] - points[i - 1]
    tang.normalize()
    n_dir = up_vec.normalized()
    b_dir = tang.cross(n_dir)
    if b_dir.length < 1e-5:
      _, b_dir, n_dir = frame_along(tang)
    else:
      b_dir.normalize()
      n_dir = b_dir.cross(tang).normalized()

    s = i / max(1, n_pts - 1)
    w = width_fn(s)
    th = thick_fn(s)
    ring = []
    for j in range(n_seg):
      ang = 2.0 * math.pi * j / n_seg
      ca, sa = math.cos(ang), math.sin(ang)
      sc = (abs(ca) ** 0.75) * (1 if ca >= 0 else -1)
      ss = (abs(sa) ** 0.75) * (1 if sa >= 0 else -1)
      co = p + b_dir * (w * sc) + n_dir * (th * ss)
      ring.append(bm.verts.new(co))
    rings.append(ring)
  add_grid_faces(bm, rings, mat_idx, closed_u=True, cap_start=True, cap_end=True)


def sleeve_point_and_normal(s, theta, side_sign):
  y = -0.44 + s * (-0.088 - (-0.44))
  wrist_x = 0.012 * side_sign
  wrist_z = -0.004 if side_sign > 0 else -0.022
  elbow_x = 0.024 * side_sign
  elbow_z = -0.016 if side_sign > 0 else -0.028

  cx = elbow_x * (1.0 - s) + wrist_x * s + 0.004 * side_sign * math.sin(math.pi * s)
  cz = elbow_z * (1.0 - s) + wrist_z * s - 0.005 * math.sin(math.pi * s)

  base_rx = 0.049 * (1.0 - 0.30 * (s ** 1.15))
  base_rz = 0.044 * (1.0 - 0.28 * (s ** 1.15))

  muscle = 0.0055 * math.sin(math.pi * min(1.0, s / 0.68)) ** 1.4
  base_rx += muscle
  base_rz += muscle * 0.8

  roll_env = math.exp(-((s - 0.11) / 0.095) ** 2)
  roll_folds = (
      0.0075 * roll_env * (0.55 + 0.45 * math.cos(3.0 * math.pi * (s - 0.02) / 0.18))
      + 0.0022 * roll_env * math.sin(3.0 * theta + 9.0 * s * side_sign)
  )

  elbow_lip = 0.0038 * math.exp(-((s - 0.03) / 0.035) ** 2) * (
      1.0 + 0.3 * math.sin(5.0 * theta)
  )

  diag1 = 0.0032 * math.sin(2.0 * theta + 19.0 * s * side_sign) * math.sin(math.pi * s)
  diag2 = 0.0024 * math.cos(3.0 * theta - 27.0 * s * side_sign + 0.7) * (0.3 + 0.7 * s)
  crease_top = (
      0.0028
      * max(0.0, math.sin(theta))
      * math.sin(38.0 * s + 1.5 * math.cos(2.0 * theta))
      * (0.4 + 0.6 * math.sin(math.pi * s))
  )
  cuff_bunch = (
      0.0035
      * math.exp(-((s - 0.90) / 0.085) ** 2)
      * (0.5 + 0.5 * math.sin(6.0 * theta + 12.0 * s))
  )

  dr = roll_folds + elbow_lip + diag1 + diag2 + crease_top + cuff_bunch
  rx = base_rx + dr
  rz = base_rz + dr * 0.95

  dy_fold = 0.0030 * roll_env * math.sin(2.0 * theta) + 0.0015 * math.sin(
      4.0 * theta + 14.0 * s
  ) * math.sin(math.pi * s)

  ct = math.cos(theta)
  st = math.sin(theta)
  pos = Vector((cx + rx * ct, y + dy_fold, cz + rz * st))
  nrm = Vector((ct / max(rx, 1e-4), 0.0, st / max(rz, 1e-4))).normalized()
  return pos, nrm


def build_sleeve_and_camo(bm, side_sign):
  n_rings = 38
  n_seg = 32
  rings = []

  for i in range(n_rings):
    s = i / (n_rings - 1)
    ring = []
    for j in range(n_seg):
      theta = 2.0 * math.pi * j / n_seg
      p, _ = sleeve_point_and_normal(s, theta, side_sign)
      ring.append(bm.verts.new(p))
    rings.append(ring)

  inner_elbow = []
  for j in range(n_seg):
    theta = 2.0 * math.pi * j / n_seg
    p, nrm = sleeve_point_and_normal(0.0, theta, side_sign)
    p_in = p - nrm * 0.009 + Vector((0.0, 0.008, 0.0))
    inner_elbow.append(bm.verts.new(p_in))
  rings.insert(0, inner_elbow)

  add_grid_faces(
      bm,
      rings,
      MAT_IDX["Sleeve_Camo"],
      closed_u=True,
      cap_start=True,
      cap_end=False,
  )

  patches = [
      (0.24, 0.65 * side_sign, 0.13, 0.62, MAT_IDX["Sleeve_Camo_Brown"], 1.1),
      (0.46, 2.15 * side_sign, 0.14, 0.68, MAT_IDX["Sleeve_Camo_Black"], 2.4),
      (0.66, -0.75 * side_sign, 0.12, 0.58, MAT_IDX["Sleeve_Camo_Brown"], 3.7),
      (0.81, 1.25 * side_sign, 0.10, 0.52, MAT_IDX["Sleeve_Camo_Black"], 5.0),
  ]

  for s0, th0, ds, dth, mat_idx, phase in patches:
    n_u = 5
    n_v = 18
    p_rings = []
    for iu in range(n_u):
      u = (iu + 1) / n_u
      lift = 0.0002 if iu == n_u - 1 else 0.0016 * (1.0 - 0.25 * (u ** 2))
      ring = []
      for iv in range(n_v):
        ang = 2.0 * math.pi * iv / n_v
        wobble = (
            1.0
            + 0.22 * math.sin(2.0 * ang + phase)
            + 0.14 * math.cos(3.0 * ang - phase * 1.3)
        )
        s = max(0.03, min(0.97, s0 + ds * u * wobble * math.cos(ang)))
        th = th0 + dth * u * wobble * math.sin(ang)
        base_p, nrm = sleeve_point_and_normal(s, th, side_sign)
        ring.append(bm.verts.new(base_p + nrm * lift))
      p_rings.append(ring)

    c_p, c_nrm = sleeve_point_and_normal(s0, th0, side_sign)
    v_center = bm.verts.new(c_p + c_nrm * 0.0018)
    for iv in range(n_v):
      ivn = (iv + 1) % n_v
      try:
        f = bm.faces.new((v_center, p_rings[0][iv], p_rings[0][ivn]))
        f.material_index = mat_idx
        f.smooth = True
      except ValueError:
        pass
    add_grid_faces(bm, p_rings, mat_idx, closed_u=True, cap_start=False, cap_end=False)


def build_cuff_and_velcro(bm, side_sign):
  wrist_x = 0.012 * side_sign
  wrist_z = -0.004 if side_sign > 0 else -0.022

  n_rings = 10
  n_seg = 24
  cuff_rings = []
  for i in range(n_rings):
    s = i / (n_rings - 1)
    y = -0.094 + s * (-0.062 - (-0.094))
    rib = 0.0012 * math.sin(18.0 * theta_rib if False else 2.0 * math.pi * s * 2.0)
    ring = []
    for j in range(n_seg):
      theta = 2.0 * math.pi * j / n_seg
      wave = 0.0011 * math.sin(10.0 * theta) * math.sin(math.pi * s)
      rx = 0.0335 * (1.0 - 0.06 * s) + rib + wave
      rz = 0.0295 * (1.0 - 0.06 * s) + rib + wave
      co = Vector(
          (wrist_x + rx * math.cos(theta), y, wrist_z + rz * math.sin(theta))
      )
      ring.append(bm.verts.new(co))
    cuff_rings.append(ring)
  add_grid_faces(
      bm,
      cuff_rings,
      MAT_IDX["Glove"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  v_rings = []
  for i in range(7):
    s = i / 6.0
    y = -0.066 + s * (-0.044 - (-0.066))
    bevel_s = math.sin(math.pi * s) ** 0.45
    ring = []
    for j in range(n_seg):
      theta = 2.0 * math.pi * j / n_seg
      rx = 0.0332 + 0.0024 * bevel_s
      rz = 0.0292 + 0.0024 * bevel_s
      co = Vector(
          (wrist_x + rx * math.cos(theta), y, wrist_z + rz * math.sin(theta))
      )
      ring.append(bm.verts.new(co))
    v_rings.append(ring)
  add_grid_faces(
      bm,
      v_rings,
      MAT_IDX["Glove_Pad"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  tab_pts = []
  for k in range(8):
    ang = 0.25 * math.pi + (0.65 * math.pi) * (k / 7.0)
    if side_sign < 0:
      ang = math.pi - ang
    rx = 0.0372
    rz = 0.0332
    tab_pts.append(
        Vector((
            wrist_x + rx * math.cos(ang),
            -0.055,
            wrist_z + rz * math.sin(ang),
        ))
    )
  add_lofted_box_strip(
      bm,
      tab_pts,
      Vector((0.0, 0.0, 1.0)),
      lambda s: 0.0095 * (0.85 + 0.15 * math.sin(math.pi * s)),
      lambda s: 0.0024,
      MAT_IDX["Glove"],
      n_seg=8,
  )


def build_tactical_watch(bm, side_sign):
  wrist_x = 0.012 * side_sign
  wrist_z = -0.022
  y_watch = -0.079

  n_rings = 7
  n_seg = 24
  strap_rings = []
  for i in range(n_rings):
    s = i / (n_rings - 1)
    y = y_watch - 0.011 + s * 0.022
    prof = math.sin(math.pi * s) ** 0.4
    ring = []
    for j in range(n_seg):
      theta = 2.0 * math.pi * j / n_seg
      rib = 0.0006 * math.cos(16.0 * theta)
      rx = 0.0342 + (0.0026 + rib) * prof
      rz = 0.0302 + (0.0026 + rib) * prof
      co = Vector(
          (wrist_x + rx * math.cos(theta), y, wrist_z + rz * math.sin(theta))
      )
      ring.append(bm.verts.new(co))
    strap_rings.append(ring)
  add_grid_faces(
      bm,
      strap_rings,
      MAT_IDX["Watch"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  ang_watch = 0.38 * math.pi
  normal = Vector((math.cos(ang_watch), 0.0, math.sin(ang_watch))).normalized()
  tangent_y = Vector((0.0, 1.0, 0.0))
  tangent_u = normal.cross(tangent_y).normalized()
  center = Vector((
      wrist_x + 0.0355 * math.cos(ang_watch),
      y_watch,
      wrist_z + 0.0315 * math.sin(ang_watch),
  ))

  case_profiles = [
      (-0.002, 0.021, 0.019),
      (0.001, 0.023, 0.021),
      (0.006, 0.022, 0.020),
      (0.0085, 0.019, 0.018),
      (0.0085, 0.014, 0.014),
      (0.0062, 0.0135, 0.0135),
  ]
  n_oct = 16
  case_rings = []
  for h, ru, ry in case_profiles:
    ring = []
    for j in range(n_oct):
      a = 2.0 * math.pi * j / n_oct
      oct_mod = 1.0 + 0.045 * math.cos(8.0 * a)
      p = (
          center
          + normal * h
          + tangent_u * (ru * oct_mod * math.cos(a))
          + tangent_y * (ry * oct_mod * math.sin(a))
      )
      ring.append(bm.verts.new(p))
    case_rings.append(ring)
  add_grid_faces(
      bm,
      case_rings,
      MAT_IDX["Watch"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  for b_ang in [0.45, -0.45, math.pi - 0.45, math.pi + 0.45]:
    b_dir = (tangent_u * math.cos(b_ang) + tangent_y * math.sin(b_ang)).normalized()
    p0 = center + normal * 0.004 + b_dir * 0.019
    p1 = center + normal * 0.0045 + b_dir * 0.0245
    add_lofted_box_strip(
        bm,
        [p0, p1],
        normal,
        lambda s: 0.0032,
        lambda s: 0.0022,
        MAT_IDX["Watch"],
        n_seg=6,
    )


def build_phalanx_segment(bm, p0, p1, r0_w, r0_h, r1_w, r1_h, up_hint, mat_idx, has_pad=True, is_distal=False):
  tang = p1 - p0
  t_dir, b_dir, n_dir = frame_along(tang)
  if up_hint.length > 1e-4:
    n_proj = (up_hint - t_dir * up_hint.dot(t_dir))
    if n_proj.length > 1e-4:
      n_dir = n_proj.normalized()
      b_dir = t_dir.cross(n_dir).normalized()

  n_rings = 6
  n_seg = 10
  rings = []
  for i in range(n_rings):
    s = i / (n_rings - 1)
    p = p0.lerp(p1, s)
    arch = math.sin(math.pi * s)
    end_taper = 0.88 + 0.12 * arch
    if is_distal and s > 0.65:
      end_taper *= 1.0 - 0.32 * ((s - 0.65) / 0.35) ** 1.5
    rw = (r0_w * (1.0 - s) + r1_w * s) * end_taper
    rh = (r0_h * (1.0 - s) + r1_h * s) * end_taper
    ring = []
    for j in range(n_seg):
      ang = 2.0 * math.pi * j / n_seg
      ca, sa = math.cos(ang), math.sin(ang)
      flat_bottom = 0.86 if sa < 0 else 1.0
      seam_ridge = 1.06 if abs(sa) < 0.25 else 1.0
      co = (
          p
          + b_dir * (rw * ca * seam_ridge)
          + n_dir * (rh * sa * flat_bottom)
      )
      ring.append(bm.verts.new(co))
    rings.append(ring)

  add_grid_faces(
      bm,
      rings,
      mat_idx,
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  if has_pad:
    pad_pts = [
        p0.lerp(p1, 0.20) + n_dir * (r0_h * 0.92),
        p0.lerp(p1, 0.50) + n_dir * ((r0_h + r1_h) * 0.52),
        p0.lerp(p1, 0.80) + n_dir * (r1_h * 0.92),
    ]
    add_lofted_box_strip(
        bm,
        pad_pts,
        n_dir,
        lambda s: (r0_w * 0.68) * (0.85 + 0.15 * math.sin(math.pi * s)),
        lambda s: 0.0022 * (0.75 + 0.25 * math.sin(math.pi * s)),
        MAT_IDX["Glove_Pad"],
        n_seg=6,
    )


def build_right_hand(bm):
  wrist_c = Vector((0.012, -0.056, -0.004))
  palm_stations = [
      (Vector((0.013, -0.052, -0.003)), 0.030, 0.025, 0.05),
      (Vector((0.017, -0.038, -0.002)), 0.034, 0.023, 0.20),
      (Vector((0.021, -0.022, -0.001)), 0.038, 0.020, 0.45),
      (Vector((0.022, -0.008, 0.000)), 0.039, 0.018, 0.70),
      (Vector((0.020, 0.003, 0.000)), 0.037, 0.016, 0.85),
  ]

  n_steps = 13
  n_seg = 24
  palm_rings = []
  for i in range(n_steps):
    s = i / (n_steps - 1)
    idx_f = s * (len(palm_stations) - 1)
    k0 = min(len(palm_stations) - 2, int(idx_f))
    f = idx_f - k0
    c0, rz0, rx0, rot0 = palm_stations[k0]
    c1, rz1, rx1, rot1 = palm_stations[k0 + 1]
    c = c0.lerp(c1, f)
    rz = rz0 * (1.0 - f) + rz1 * f
    rx = rx0 * (1.0 - f) + rx1 * f
    rot = rot0 * (1.0 - f) + rot1 * f

    u_axis = Vector((math.cos(rot), math.sin(rot) * 0.35, 0.0)).normalized()
    v_axis = Vector((0.0, 0.0, 1.0))
    ring = []
    for j in range(n_seg):
      ang = 2.0 * math.pi * j / n_seg
      ca, sa = math.cos(ang), math.sin(ang)
      palm_hollow = 0.78 if (ca < -0.2 and s > 0.3) else 1.0
      co = c + u_axis * (rx * ca * palm_hollow) + v_axis * (rz * sa)
      ring.append(bm.verts.new(co))
    palm_rings.append(ring)

  add_grid_faces(
      bm,
      palm_rings,
      MAT_IDX["Glove"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  palm_pad_pts = [
      Vector((0.010, -0.036, -0.020)),
      Vector((0.012, -0.018, -0.004)),
      Vector((0.011, -0.005, 0.016)),
  ]
  add_lofted_box_strip(
      bm,
      palm_pad_pts,
      Vector((-1.0, 0.2, 0.0)),
      lambda s: 0.012 * (0.8 + 0.2 * math.sin(math.pi * s)),
      lambda s: 0.0025,
      MAT_IDX["Glove_Pad"],
      n_seg=6,
  )

  fingers_r = [
      (
          [
              Vector((0.020, 0.004, 0.025)),
              Vector((0.012, 0.023, 0.024)),
              Vector((-0.011, 0.021, 0.023)),
              Vector((-0.021, 0.003, 0.022)),
          ],
          (0.0082, 0.0076),
      ),
      (
          [
              Vector((0.022, 0.003, 0.008)),
              Vector((0.013, 0.025, 0.008)),
              Vector((-0.012, 0.022, 0.007)),
              Vector((-0.022, 0.001, 0.007)),
          ],
          (0.0086, 0.0080),
      ),
      (
          [
              Vector((0.021, 0.000, -0.009)),
              Vector((0.012, 0.023, -0.009)),
              Vector((-0.011, 0.020, -0.009)),
              Vector((-0.021, 0.001, -0.009)),
          ],
          (0.0080, 0.0075),
      ),
      (
          [
              Vector((0.019, -0.004, -0.025)),
              Vector((0.010, 0.019, -0.025)),
              Vector((-0.009, 0.017, -0.024)),
              Vector((-0.019, 0.002, -0.024)),
          ],
          (0.0072, 0.0068),
      ),
  ]

  for j_pts, (rw0, rh0) in fingers_r:
    for ph in range(3):
      p0, p1 = j_pts[ph], j_pts[ph + 1]
      mid = p0.lerp(p1, 0.5)
      out_dir = Vector((mid.x, mid.y, 0.0)).normalized()
      sc0 = 1.0 - 0.11 * ph
      sc1 = 1.0 - 0.11 * (ph + 1)
      build_phalanx_segment(
          bm,
          p0,
          p1,
          rw0 * sc0,
          rh0 * sc0,
          rw0 * sc1,
          rh0 * sc1,
          out_dir,
          MAT_IDX["Glove"],
          has_pad=(ph < 2),
          is_distal=(ph == 2),
      )

    knuckle_p = j_pts[0] + Vector((0.012, -0.003, 0.0))
    add_lofted_box_strip(
        bm,
        [
            knuckle_p + Vector((-0.002, -0.010, 0.0)),
            knuckle_p + Vector((0.002, 0.004, 0.0)),
        ],
        Vector((1.0, 0.2, 0.0)),
        lambda s: 0.0078 * (0.8 + 0.2 * math.sin(math.pi * s)),
        lambda s: 0.0042 * (0.7 + 0.3 * math.sin(math.pi * s)),
        MAT_IDX["Glove_Pad"],
        n_seg=8,
    )

    rib_p0 = wrist_c + Vector((0.024, 0.012, j_pts[0].z * 0.65))
    rib_p1 = j_pts[0] + Vector((0.011, -0.014, 0.0))
    add_lofted_box_strip(
        bm,
        [rib_p0, rib_p0.lerp(rib_p1, 0.5), rib_p1],
        Vector((1.0, 0.0, 0.0)),
        lambda s: 0.0048,
        lambda s: 0.0025,
        MAT_IDX["Glove_Pad"],
        n_seg=6,
    )

  thumb_r = [
      Vector((0.010, -0.028, 0.014)),
      Vector((-0.015, -0.016, 0.024)),
      Vector((-0.023, 0.004, 0.028)),
      Vector((-0.014, 0.020, 0.026)),
  ]
  for ph in range(3):
    p0, p1 = thumb_r[ph], thumb_r[ph + 1]
    mid = p0.lerp(p1, 0.5)
    out_dir = Vector((mid.x, mid.y, 0.35)).normalized()
    sc0 = 1.0 - 0.12 * ph
    sc1 = 1.0 - 0.12 * (ph + 1)
    build_phalanx_segment(
        bm,
        p0,
        p1,
        0.0092 * sc0,
        0.0082 * sc0,
        0.0092 * sc1,
        0.0082 * sc1,
        out_dir,
        MAT_IDX["Glove"],
        has_pad=(ph < 2),
        is_distal=(ph == 2),
    )

  seams_r = [
      [
          Vector((0.016, -0.052, 0.024)),
          Vector((0.022, -0.026, 0.032)),
          Vector((0.022, 0.000, 0.030)),
      ],
      [
          Vector((0.014, -0.052, -0.026)),
          Vector((0.022, -0.026, -0.034)),
          Vector((0.020, -0.004, -0.031)),
      ],
      [
          Vector((0.036, -0.044, -0.018)),
          Vector((0.038, -0.020, 0.000)),
          Vector((0.035, -0.004, 0.020)),
      ],
      [
          Vector((0.004, -0.038, 0.016)),
          Vector((-0.008, -0.024, 0.026)),
          Vector((-0.018, -0.008, 0.029)),
      ],
  ]
  for s_pts in seams_r:
    add_lofted_box_strip(
        bm,
        s_pts,
        Vector((1.0, 0.0, 0.3)),
        lambda s: 0.0016,
        lambda s: 0.0014,
        MAT_IDX["Glove_Pad"],
        n_seg=5,
    )


def build_left_hand(bm):
  wrist_c = Vector((-0.012, -0.056, -0.022))
  palm_stations = [
      (Vector((-0.011, -0.052, -0.023)), 0.028, 0.022, -0.15),
      (Vector((-0.007, -0.035, -0.028)), 0.032, 0.019, -0.08),
      (Vector((-0.002, -0.016, -0.032)), 0.035, 0.016, 0.0),
      (Vector((0.003, 0.004, -0.032)), 0.036, 0.015, 0.08),
      (Vector((0.006, 0.021, -0.030)), 0.033, 0.014, 0.12),
  ]

  n_steps = 13
  n_seg = 24
  palm_rings = []
  for i in range(n_steps):
    s = i / (n_steps - 1)
    idx_f = s * (len(palm_stations) - 1)
    k0 = min(len(palm_stations) - 2, int(idx_f))
    f = idx_f - k0
    c0, rx0, rz0, tilt0 = palm_stations[k0]
    c1, rx1, rz1, tilt1 = palm_stations[k0 + 1]
    c = c0.lerp(c1, f)
    rx = rx0 * (1.0 - f) + rx1 * f
    rz = rz0 * (1.0 - f) + rz1 * f
    tilt = tilt0 * (1.0 - f) + tilt1 * f

    u_axis = Vector((math.cos(tilt), 0.0, math.sin(tilt))).normalized()
    v_axis = Vector((-math.sin(tilt), 0.0, math.cos(tilt))).normalized()
    ring = []
    for j in range(n_seg):
      ang = 2.0 * math.pi * j / n_seg
      ca, sa = math.cos(ang), math.sin(ang)
      cup_offset = 0.005 * (ca ** 2) if s > 0.25 else 0.0
      palm_hollow = 0.76 if (sa > 0.2 and s > 0.25) else 1.0
      co = (
          c
          + u_axis * (rx * ca)
          + v_axis * (rz * sa * palm_hollow + cup_offset)
      )
      ring.append(bm.verts.new(co))
    palm_rings.append(ring)

  add_grid_faces(
      bm,
      palm_rings,
      MAT_IDX["Glove"],
      closed_u=True,
      cap_start=True,
      cap_end=True,
  )

  palm_pad_pts = [
      Vector((-0.014, -0.022, -0.019)),
      Vector((0.000, -0.002, -0.022)),
      Vector((0.014, 0.016, -0.019)),
  ]
  add_lofted_box_strip(
      bm,
      palm_pad_pts,
      Vector((0.0, 0.0, 1.0)),
      lambda s: 0.013 * (0.8 + 0.2 * math.sin(math.pi * s)),
      lambda s: 0.0024,
      MAT_IDX["Glove_Pad"],
      n_seg=6,
  )

  fingers_l = [
      (
          [
              Vector((0.022, 0.020, -0.023)),
              Vector((0.034, 0.023, -0.008)),
              Vector((0.033, 0.025, 0.010)),
              Vector((0.022, 0.026, 0.023)),
          ],
          (0.0080, 0.0075),
      ),
      (
          [
              Vector((0.023, 0.005, -0.024)),
              Vector((0.035, 0.007, -0.007)),
              Vector((0.034, 0.008, 0.012)),
              Vector((0.022, 0.009, 0.025)),
          ],
          (0.0085, 0.0078),
      ),
      (
          [
              Vector((0.022, -0.010, -0.024)),
              Vector((0.034, -0.009, -0.008)),
              Vector((0.032, -0.008, 0.010)),
              Vector((0.021, -0.007, 0.022)),
          ],
          (0.0080, 0.0074),
      ),
      (
          [
              Vector((0.020, -0.024, -0.023)),
              Vector((0.031, -0.023, -0.009)),
              Vector((0.029, -0.022, 0.006)),
              Vector((0.020, -0.021, 0.017)),
          ],
          (0.0072, 0.0068),
      ),
  ]

  for j_pts, (rw0, rh0) in fingers_l:
    for ph in range(3):
      p0, p1 = j_pts[ph], j_pts[ph + 1]
      mid = p0.lerp(p1, 0.5)
      out_dir = Vector((mid.x, 0.0, mid.z)).normalized()
      sc0 = 1.0 - 0.11 * ph
      sc1 = 1.0 - 0.11 * (ph + 1)
      build_phalanx_segment(
          bm,
          p0,
          p1,
          rw0 * sc0,
          rh0 * sc0,
          rw0 * sc1,
          rh0 * sc1,
          out_dir,
          MAT_IDX["Glove"],
          has_pad=(ph < 2),
          is_distal=(ph == 2),
      )

    knuckle_p = j_pts[0] + Vector((0.008, 0.0, -0.009))
    add_lofted_box_strip(
        bm,
        [
            knuckle_p + Vector((-0.005, -0.003, -0.004)),
            knuckle_p + Vector((0.005, 0.003, 0.004)),
        ],
        Vector((0.6, 0.0, -0.8)),
        lambda s: 0.0078 * (0.8 + 0.2 * math.sin(math.pi * s)),
        lambda s: 0.0042 * (0.7 + 0.3 * math.sin(math.pi * s)),
        MAT_IDX["Glove_Pad"],
        n_seg=8,
    )

    rib_p0 = wrist_c + Vector((0.008, j_pts[0].y * 0.45, -0.018))
    rib_p1 = j_pts[0] + Vector((0.002, 0.0, -0.012))
    add_lofted_box_strip(
        bm,
        [rib_p0, rib_p0.lerp(rib_p1, 0.5), rib_p1],
        Vector((0.2, 0.0, -1.0)),
        lambda s: 0.0046,
        lambda s: 0.0024,
        MAT_IDX["Glove_Pad"],
        n_seg=6,
    )

  thumb_l = [
      Vector((-0.022, -0.018, -0.020)),
      Vector((-0.034, -0.002, -0.004)),
      Vector((-0.033, 0.012, 0.014)),
      Vector((-0.021, 0.022, 0.026)),
  ]
  for ph in range(3):
    p0, p1 = thumb_l[ph], thumb_l[ph + 1]
    mid = p0.lerp(p1, 0.5)
    out_dir = Vector((mid.x, 0.0, mid.z)).normalized()
    sc0 = 1.0 - 0.12 * ph
    sc1 = 1.0 - 0.12 * (ph + 1)
    build_phalanx_segment(
        bm,
        p0,
        p1,
        0.0092 * sc0,
        0.0082 * sc0,
        0.0092 * sc1,
        0.0082 * sc1,
        out_dir,
        MAT_IDX["Glove"],
        has_pad=(ph < 2),
        is_distal=(ph == 2),
    )

  seams_l = [
      [
          Vector((-0.028, -0.044, -0.022)),
          Vector((-0.028, -0.015, -0.026)),
          Vector((-0.024, 0.016, -0.024)),
      ],
      [
          Vector((0.014, -0.044, -0.024)),
          Vector((0.022, -0.012, -0.028)),
          Vector((0.022, 0.018, -0.026)),
      ],
      [
          Vector((-0.012, -0.046, -0.042)),
          Vector((-0.002, -0.016, -0.046)),
          Vector((0.006, 0.016, -0.042)),
      ],
      [
          Vector((-0.022, -0.026, -0.018)),
          Vector((-0.032, -0.008, -0.006)),
          Vector((-0.032, 0.008, 0.010)),
      ],
  ]
  for s_pts in seams_l:
    add_lofted_box_strip(
        bm,
        s_pts,
        Vector((0.0, 0.0, -1.0)),
        lambda s: 0.0016,
        lambda s: 0.0014,
        MAT_IDX["Glove_Pad"],
        n_seg=5,
    )


def create_arm_object(name, is_left, root_empty):
  bm = bmesh.new()
  side_sign = -1.0 if is_left else 1.0

  build_sleeve_and_camo(bm, side_sign)
  build_cuff_and_velcro(bm, side_sign)
  if is_left:
    build_tactical_watch(bm, side_sign)
    build_left_hand(bm)
  else:
    build_right_hand(bm)

  bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
  bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

  mesh = bpy.data.meshes.new(name)
  for mat in ALL_MATS:
    mesh.materials.append(mat)
  bm.to_mesh(mesh)
  bm.free()

  for poly in mesh.polygons:
    poly.use_smooth = True

  obj = bpy.data.objects.new(name, mesh)
  obj.location = (0.0, 0.0, 0.0)
  obj.parent = root_empty
  bpy.context.collection.objects.link(obj)

  bpy.ops.object.select_all(action="DESELECT")
  obj.select_set(True)
  bpy.context.view_layer.objects.active = obj

  bev = obj.modifiers.new(name="Bevel", type="BEVEL")
  bev.width = 0.0005
  bev.segments = 1
  bev.limit_method = "ANGLE"
  bev.angle_limit = math.radians(62.0)
  bpy.ops.object.modifier_apply(modifier=bev.name)

  smooth_mod = obj.modifiers.new(name="Smooth", type="CORRECTIVE_SMOOTH")
  smooth_mod.factor = 0.25
  smooth_mod.iterations = 2
  bpy.ops.object.modifier_apply(modifier=smooth_mod.name)

  tri_mod = obj.modifiers.new(name="Triangulate", type="TRIANGULATE")
  bpy.ops.object.modifier_apply(modifier=tri_mod.name)

  tri_count = len(obj.data.polygons)
  if tri_count > 11800:
    dec = obj.modifiers.new(name="Decimate", type="DECIMATE")
    dec.ratio = 9500.0 / float(tri_count)
    bpy.ops.object.modifier_apply(modifier=dec.name)
    tri_mod2 = obj.modifiers.new(name="Triangulate2", type="TRIANGULATE")
    bpy.ops.object.modifier_apply(modifier=tri_mod2.name)
  elif tri_count < 4200:
    sub = obj.modifiers.new(name="Subsurf", type="SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    tri_mod2 = obj.modifiers.new(name="Triangulate2", type="TRIANGULATE")
    bpy.ops.object.modifier_apply(modifier=tri_mod2.name)
    tri_count = len(obj.data.polygons)
    if tri_count > 11800:
      dec = obj.modifiers.new(name="Decimate", type="DECIMATE")
      dec.ratio = 9500.0 / float(tri_count)
      bpy.ops.object.modifier_apply(modifier=dec.name)
      tri_mod3 = obj.modifiers.new(name="Triangulate3", type="TRIANGULATE")
      bpy.ops.object.modifier_apply(modifier=tri_mod3.name)

  return obj


def main():
  out_path = os.path.abspath(get_output_path())
  out_dir = os.path.dirname(out_path)
  if out_dir and not os.path.exists(out_dir):
    os.makedirs(out_dir, exist_ok=True)

  root_empty = bpy.data.objects.new("ARMS_ROOT", None)
  root_empty.empty_display_type = "PLAIN_AXES"
  root_empty.location = (0.0, 0.0, 0.0)
  bpy.context.collection.objects.link(root_empty)

  arm_r = create_arm_object("ARM_R", is_left=False, root_empty=root_empty)
  arm_l = create_arm_object("ARM_L", is_left=True, root_empty=root_empty)

  tris_r = len(arm_r.data.polygons)
  tris_l = len(arm_l.data.polygons)

  bpy.ops.export_scene.gltf(
      filepath=out_path,
      export_format="GLB",
      export_apply=True,
      export_yup=True,
  )

  print(
      f"OK arms.glb | ARM_R: {tris_r} triangoli, ARM_L: {tris_l} triangoli,"
      f" TOTALE: {tris_r + tris_l} triangoli"
  )


if __name__ == "__main__":
  main()
