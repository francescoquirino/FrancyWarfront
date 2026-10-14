import math
import os
import sys

import bpy
from mathutils import Quaternion, Vector

bpy.ops.wm.read_factory_settings(use_empty=True)

TAU = 2.0 * math.pi

# Nota: l'origine (0,0,0) sta sull'asse dell'oggetto impugnato (come nella versione 1):
# impugnatura verticale lungo Z per la destra, guardamano lungo Y per la sinistra.


def get_output_path():
  argv = sys.argv
  if "--" in argv:
    idx = argv.index("--")
    if idx + 1 < len(argv):
      return argv[-1]
  return "arms.glb"


# ----------------------------------------------------------------------------
# Materiali
# ----------------------------------------------------------------------------
def make_material(name, rgb, roughness=0.8, metallic=0.0):
  mat = bpy.data.materials.new(name=name)
  try:
    mat.use_nodes = True
  except Exception:
    pass
  col = (rgb[0], rgb[1], rgb[2], 1.0)
  try:
    mat.diffuse_color = col
    mat.roughness = roughness
    mat.metallic = metallic
  except Exception:
    pass
  nt = mat.node_tree
  if nt is None:
    return mat
  bsdf = None
  for nd in nt.nodes:
    if nd.type == "BSDF_PRINCIPLED":
      bsdf = nd
      break
  if bsdf is None:
    nt.nodes.clear()
    bsdf = nt.nodes.new(type="ShaderNodeBsdfPrincipled")
    out = nt.nodes.new(type="ShaderNodeOutputMaterial")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
  bsdf.inputs["Base Color"].default_value = col
  bsdf.inputs["Roughness"].default_value = roughness
  bsdf.inputs["Metallic"].default_value = metallic
  return mat


MAT_SPECS = [
    ("Glove", (0.06, 0.06, 0.055), 0.75, 0.0),
    ("Glove_Pad", (0.12, 0.11, 0.09), 0.85, 0.0),
    ("Sleeve_Camo", (0.22, 0.25, 0.15), 0.9, 0.0),
    ("Sleeve_Camo_Green", (0.30, 0.34, 0.20), 0.9, 0.0),
    ("Sleeve_Camo_Brown", (0.36, 0.27, 0.17), 0.9, 0.0),
    ("Sleeve_Camo_Black", (0.08, 0.08, 0.08), 0.9, 0.0),
    ("Watch", (0.03, 0.03, 0.03), 0.4, 0.6),
    ("Skin", (0.62, 0.45, 0.35), 0.6, 0.0),
]
ALL_MATS = [make_material(n, c, r, m) for n, c, r, m in MAT_SPECS]
M = {m.name: i for i, m in enumerate(ALL_MATS)}


# ----------------------------------------------------------------------------
# Piccoli attrezzi matematici
# ----------------------------------------------------------------------------
def clamp(x, a=0.0, b=1.0):
  return max(a, min(b, x))


def smooth(a, b, x):
  if a == b:
    return 0.0 if x < a else 1.0
  t = clamp((x - a) / (b - a))
  return t * t * (3.0 - 2.0 * t)


def sp(v, e):
  return math.copysign(abs(v) ** e, v)


def ridge(x):
  # piega di stoffa: cresta tonda, valle stretta
  return abs(math.sin(0.5 * x)) ** 0.7


def spline(keys, x, col=1):
  n = len(keys)
  if x <= keys[0][0]:
    return keys[0][col]
  if x >= keys[-1][0]:
    return keys[-1][col]
  i = 0
  while i < n - 2 and x > keys[i + 1][0]:
    i += 1
  x0, x1 = keys[i][0], keys[i + 1][0]
  y0, y1 = keys[i][col], keys[i + 1][col]
  h = x1 - x0
  if i > 0:
    m0 = (y1 - keys[i - 1][col]) / (x1 - keys[i - 1][0])
  else:
    m0 = (y1 - y0) / h
  if i < n - 2:
    m1 = (keys[i + 2][col] - y0) / (keys[i + 2][0] - x0)
  else:
    m1 = (y1 - y0) / h
  t = (x - x0) / h
  t2 = t * t
  t3 = t2 * t
  return (
      (2.0 * t3 - 3.0 * t2 + 1.0) * y0
      + (t3 - 2.0 * t2 + t) * h * m0
      + (-2.0 * t3 + 3.0 * t2) * y1
      + (t3 - t2) * h * m1
  )


def cr(p0, p1, p2, p3, u):
  # Catmull-Rom (va bene sia per numeri sia per Vector)
  return (
      p1 * 2.0
      + (p2 - p0) * u
      + (p0 * 2.0 - p1 * 5.0 + p2 * 4.0 - p3) * (u * u)
      + (p1 * 3.0 - p0 - p2 * 3.0 + p3) * (u * u * u)
  ) * 0.5


def centroid(ring):
  c = Vector((0.0, 0.0, 0.0))
  for p in ring:
    c += p
  return c / len(ring)


# ----------------------------------------------------------------------------
# Accumulatore di geometria
# ----------------------------------------------------------------------------
class Builder:
  def __init__(self):
    self.v = []
    self.f = []
    self.m = []

  def add(self, verts, faces, mat, flip=False):
    base = len(self.v)
    for p in verts:
      self.v.append(tuple(p))
    per_face = isinstance(mat, (list, tuple))
    for k, fc in enumerate(faces):
      idx = tuple(base + i for i in fc)
      if flip:
        idx = idx[::-1]
      self.f.append(idx)
      self.m.append(mat[k] if per_face else mat)


def face_sign(verts, faces, ref):
  acc = 0.0
  for fc in faces:
    a, b, c = verts[fc[0]], verts[fc[1]], verts[fc[-1]]
    acc += (b - a).cross(c - a).dot(ref)
  return acc


def add_tube(B, rings, mat, cap0=False, cap1=False):
  nr = len(rings)
  ns = len(rings[0])
  verts = [p for r in rings for p in r]
  faces = []
  acc = 0.0
  for i in range(nr - 1):
    cen = centroid(rings[i])
    for j in range(ns):
      jn = (j + 1) % ns
      faces.append((i * ns + j, i * ns + jn, (i + 1) * ns + jn, (i + 1) * ns + j))
      nrm = (rings[i][jn] - rings[i][j]).cross(rings[i + 1][j] - rings[i][j])
      acc += nrm.dot(rings[i][j] - cen)
  if cap0:
    idx = len(verts)
    verts.append(centroid(rings[0]))
    for j in range(ns):
      faces.append(((j + 1) % ns, j, idx))
  if cap1:
    idx = len(verts)
    verts.append(centroid(rings[-1]))
    o = (nr - 1) * ns
    for j in range(ns):
      faces.append((o + j, o + (j + 1) % ns, idx))
  B.add(verts, faces, mat, flip=(acc < 0.0))


def add_blob(B, c, ax, ay, az, mat, nu=8, e=0.6):
  # superellissoide mezzo affondato: serve per imbottiture e nocche
  rings = []
  for lat in (-75.0, -45.0, -15.0, 15.0, 45.0, 75.0):
    la = math.radians(lat)
    cl = sp(math.cos(la), e)
    sl = sp(math.sin(la), e)
    ring = []
    for j in range(nu):
      a = TAU * j / nu
      ring.append(
          c
          + ax * (sp(math.cos(a), e) * cl)
          + ay * (sp(math.sin(a), e) * cl)
          + az * sl
      )
    rings.append(ring)
  add_tube(B, rings, mat, True, True)


def add_seam(B, pts, outs, mat, h=0.0013, w=0.0009):
  # cucitura in rilievo: cordoncino a sezione triangolare
  n = len(pts)
  if n < 2:
    return
  rings = []
  for i in range(n):
    t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
    if t.length < 1e-9:
      t = Vector((0.0, 1.0, 0.0))
    t.normalize()
    o = outs[i]
    wv = t.cross(o)
    if wv.length < 1e-9:
      wv = o.orthogonal()
    wv.normalize()
    p = pts[i]
    rings.append([p + o * h, p + wv * w - o * 0.0004, p - wv * w - o * 0.0004])
  add_tube(B, rings, mat, True, True)


PLATE_G = (-1.07, -0.95, -0.8, -0.42, 0.0, 0.42, 0.8, 0.95, 1.07)


def add_plate(B, fn, mat, lift):
  # pannello imbottito appoggiato su una superficie: bordo infilato sotto
  g = PLATE_G
  n = len(g)
  verts = []
  for u in g:
    for v in g:
      m = (abs(u) ** 5 + abs(v) ** 5) ** 0.2
      if m >= 1.0:
        off = -0.0009
      else:
        off = lift * min(1.0, (1.0 - m) / 0.16) ** 0.6
      verts.append(fn(u, v, off))
  faces = []
  for i in range(n - 1):
    for j in range(n - 1):
      faces.append((i * n + j, i * n + j + 1, (i + 1) * n + j + 1, (i + 1) * n + j))
  ref = fn(0.0, 0.0, lift + 0.002) - fn(0.0, 0.0, 0.0)
  B.add(verts, faces, mat, flip=(face_sign(verts, faces, ref) < 0.0))


def path_rings(pts, radii, hint, nseg, sub, e=1.0, dome=False):
  P = []
  R = []
  n = len(pts)
  for i in range(n - 1):
    i0, i3 = max(i - 1, 0), min(i + 2, n - 1)
    for k in range(sub):
      u = k / sub
      P.append(cr(pts[i0], pts[i], pts[i + 1], pts[i3], u))
      R.append((
          cr(radii[i0][0], radii[i][0], radii[i + 1][0], radii[i3][0], u),
          cr(radii[i0][1], radii[i][1], radii[i + 1][1], radii[i3][1], u),
      ))
  P.append(pts[-1].copy())
  R.append(radii[-1])
  T = []
  for i in range(len(P)):
    t = P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]
    T.append(t.normalized())
  nrm = hint - T[0] * hint.dot(T[0])
  if nrm.length < 1e-6:
    nrm = T[0].orthogonal()
  nrm.normalize()
  frames = []
  for i in range(len(P)):
    if i > 0:
      q = T[i - 1].rotation_difference(T[i])
      nrm = q @ nrm
      nrm = nrm - T[i] * nrm.dot(T[i])
      nrm.normalize()
    bb = nrm.cross(T[i]).normalized()
    frames.append((P[i], T[i], nrm.copy(), bb, R[i]))
  rings = []
  for p, t, nn, bb, (rw, rh) in frames:
    ring = []
    for j in range(nseg):
      a = TAU * j / nseg
      ring.append(p + bb * (rw * sp(math.cos(a), e)) + nn * (rh * sp(math.sin(a), e)))
    rings.append(ring)
  if dome:
    p, t, nn, bb, (rw, rh) = frames[-1]
    for bd in (30.0, 55.0, 76.0):
      br = math.radians(bd)
      sc = math.cos(br)
      cen = p + t * (0.5 * (rw + rh) * math.sin(br))
      ring = []
      for j in range(nseg):
        a = TAU * j / nseg
        ring.append(
            cen
            + bb * (rw * sc * sp(math.cos(a), e))
            + nn * (rh * sc * sp(math.sin(a), e))
        )
      rings.append(ring)
  return rings, frames


# ----------------------------------------------------------------------------
# Tabelle anatomiche (f = distanza dal polso lungo il braccio, negativa verso il gomito)
# ----------------------------------------------------------------------------
# (f, semi-larghezza, semi-spessore) della pelle dell'avambraccio
SKIN = [
    (-0.42, 0.0465, 0.0450),
    (-0.36, 0.0475, 0.0455),
    (-0.30, 0.0485, 0.0460),
    (-0.23, 0.0450, 0.0415),
    (-0.16, 0.0395, 0.0340),
    (-0.10, 0.0340, 0.0275),
    (-0.06, 0.0308, 0.0238),
    (-0.03, 0.0296, 0.0218),
    (0.0, 0.0290, 0.0208),
]

# (f, semi-larghezza, semi-spessore, esponente) del guanto: polsino + palmo
GLOVE = [
    (-0.052, 0.0338, 0.0266, 1.0),
    (-0.044, 0.0330, 0.0256, 1.0),
    (-0.030, 0.0324, 0.0246, 1.0),
    (-0.010, 0.0320, 0.0232, 0.95),
    (0.012, 0.0350, 0.0205, 0.85),
    (0.035, 0.0405, 0.0178, 0.78),
    (0.060, 0.0438, 0.0158, 0.74),
    (0.082, 0.0445, 0.0142, 0.72),
    (0.096, 0.0438, 0.0130, 0.72),
    (0.103, 0.0425, 0.0108, 0.75),
    (0.108, 0.0400, 0.0065, 0.80),
]

# nocca (f, s, n) nel sistema della mano, lunghezze falangi, (semi-larghezza, semi-altezza)
FINGERS = (
    ((0.098, 0.0305, 0.001), (0.044, 0.026, 0.023), (0.0098, 0.0092)),
    ((0.102, 0.0100, 0.002), (0.048, 0.030, 0.024), (0.0100, 0.0094)),
    ((0.097, -0.0105, 0.001), (0.044, 0.028, 0.023), (0.0095, 0.0089)),
    ((0.088, -0.0300, -0.002), (0.035, 0.021, 0.021), (0.0085, 0.0080)),
)

F_ROLL_END = -0.150   # dove finisce il risvolto della manica (metà avambraccio)
ROLL_WIDTH = 0.042
VROLL = (0.04, 0.09, 0.16, 0.26, 0.36, 0.46, 0.54, 0.64, 0.74, 0.84, 0.91, 0.96, 1.0)

# macchie mimetiche: (posizione lungo la manica 0..1, angolo, raggio lungo, raggio attorno, materiale, fase)
CAMO = (
    (0.14, 0.4, 0.024, 0.030, "Sleeve_Camo_Brown", 0.3),
    (0.20, 2.3, 0.028, 0.024, "Sleeve_Camo_Black", 1.1),
    (0.16, 4.2, 0.022, 0.032, "Sleeve_Camo_Green", 2.0),
    (0.42, 1.3, 0.030, 0.026, "Sleeve_Camo_Green", 2.9),
    (0.48, 3.3, 0.026, 0.034, "Sleeve_Camo_Brown", 3.7),
    (0.45, 5.4, 0.024, 0.022, "Sleeve_Camo_Black", 4.4),
    (0.72, 0.2, 0.022, 0.028, "Sleeve_Camo_Black", 5.2),
    (0.76, 2.2, 0.026, 0.030, "Sleeve_Camo_Brown", 6.0),
    (0.74, 4.3, 0.028, 0.024, "Sleeve_Camo_Green", 0.9),
    (0.90, 1.2, 0.016, 0.026, "Sleeve_Camo_Brown", 1.7),
    (0.92, 3.6, 0.016, 0.024, "Sleeve_Camo_Green", 2.6),
)


# ----------------------------------------------------------------------------
# Scheletro del braccio: gomito E, polso W, assi della mano F (dita), S (pollice), N (dorso)
# ----------------------------------------------------------------------------
class Arm:
  H = 0.03

  def __init__(self, is_left):
    self.is_left = is_left
    if not is_left:
      # destra: palmo verso -X, dita che girano attorno all'impugnatura verticale
      F = Vector((0.0, 1.0, 0.0))
      N = Vector((1.0, 0.0, 0.0))
      S = Vector((0.0, 0.0, 1.0))
      W = Vector((0.028, -0.096, 0.0))
      E = Vector((0.085, -0.45, -0.065))
      thumb = [
          Vector((-0.002, -0.034, 0.050)),
          Vector((-0.024, -0.010, 0.053)),
          Vector((-0.030, 0.016, 0.052)),
      ]
      self.axis_d = Vector((0.0, 0.0, 1.0))
      self.grip_r = 0.015
      self.seed = 0.7
    else:
      # sinistra: palmo in su, mano in diagonale sotto il guardamano
      al = math.radians(50.0)
      F = Vector((math.sin(al), math.cos(al), 0.0))
      N = Vector((0.0, 0.0, -1.0))
      S = F.cross(N).normalized()
      W = Vector((0.0, 0.0, -0.040)) - F * 0.108 - S * 0.009 - N * 0.002
      thumb = [
          Vector((-0.050, -0.005, -0.014)),
          Vector((-0.035, 0.016, 0.007)),
          Vector((-0.024, 0.028, 0.024)),
      ]
      q = Quaternion(Vector((0.0, 1.0, 0.0)), math.radians(12.0))
      F = q @ F
      N = q @ N
      S = q @ S
      W = q @ W
      thumb = [q @ p for p in thumb]
      E = Vector((-0.215, -0.45, -0.075))
      self.axis_d = Vector((0.0, 1.0, 0.0))
      self.grip_r = 0.025
      self.seed = 2.3
    self.F, self.N, self.S, self.W, self.E = F, N, S, W, E
    self.thumb = thumb
    self.A = (W - E).normalized()
    self.L = (W - E).length
    self.Ls = self.L + F_ROLL_END
    self.u_roll = 1.0 - ROLL_WIDTH / self.Ls

  def hp(self, f, s, n):
    return self.W + self.F * f + self.S * s + self.N * n

  def center(self, f):
    h = self.H
    if f <= -h:
      return self.W + self.A * f
    if f >= h:
      return self.W + self.F * f
    u = (f + h) / (2.0 * h)
    p0 = self.W - self.A * h
    p2 = self.W + self.F * h
    return p0 * ((1.0 - u) ** 2) + self.W * (2.0 * u * (1.0 - u)) + p2 * (u * u)

  def frame(self, f):
    u = clamp((f + self.H) / (2.0 * self.H))
    t = (self.A * (1.0 - u) + self.F * u).normalized()
    s = (self.S - t * self.S.dot(t)).normalized()
    n = self.N - t * self.N.dot(t)
    n = (n - s * n.dot(s)).normalized()
    return t, s, n

  def away(self, p, t=None):
    v = p - self.axis_d * p.dot(self.axis_d)
    if t is not None:
      v = v - t * v.dot(t)
    if v.length < 1e-9:
      v = self.N.copy()
    return v.normalized()

  def ell(self, f, ph, a, b, e=1.0, off=0.0):
    c = self.center(f)
    t, s, n = self.frame(f)
    d = s * (a * sp(math.cos(ph), e)) + n * (b * sp(math.sin(ph), e))
    p = c + d
    if off:
      p = p + d.normalized() * off
    return p

  def skin_pt(self, f, ph, off=0.0):
    a = spline(SKIN, f, 1)
    b = spline(SKIN, f, 2)
    m = 1.0 + 0.035 * math.cos(ph - 0.7) * smooth(-0.09, -0.22, f)
    return self.ell(f, ph, a * m, b * m, 1.0, off)

  def glove_pt(self, f, ph, off=0.0):
    a = spline(GLOVE, f, 1)
    b = spline(GLOVE, f, 2)
    e = spline(GLOVE, f, 3)
    cs = math.cos(ph)
    sn = math.sin(ph)
    x = a * sp(cs, e)
    y = b * sp(sn, e)
    if sn < 0.0:
      # lato palmo: base carnosa dal lato del mignolo e incavo al centro
      heel = math.exp(-(((f - 0.030) / 0.028) ** 2))
      y *= 1.0 + 0.30 * heel * (0.4 + 0.6 * max(0.0, -cs))
      hollow = math.exp(-(((f - 0.062) / 0.03) ** 2)) * math.exp(-((cs / 0.6) ** 2))
      y *= 1.0 - 0.18 * hollow
    else:
      y *= 1.0 + 0.10 * math.exp(-(((f - 0.094) / 0.012) ** 2))
    c = self.center(f)
    t, s, n = self.frame(f)
    d = s * x + n * y
    p = c + d
    if off:
      p = p + d.normalized() * off
    # la fila delle nocche è ad arco: il bordo del palmo arretra verso il mignolo
    p = p + t * (-6.5 * (x - 0.012) ** 2 * smooth(0.04, 0.10, f))
    return p

  def sleeve_off(self, u, ph):
    sd = self.seed
    ur = self.u_roll
    s = clamp(u / ur)
    v = clamp((u - ur) / (1.0 - ur))
    d = 0.0060 + 0.0025 * math.sin(math.pi * s)
    # pieghe di compressione vicino al gomito
    w1 = 1.0 - smooth(0.35, 0.72, s)
    x1 = TAU * 4.6 * s + 0.9 * math.sin(ph + sd) + 0.45 * math.sin(2.0 * ph + 1.7 * sd)
    d += 0.0046 * w1 * (0.6 + 0.4 * math.cos(ph - 1.0 - sd)) * ridge(x1)
    # pieghe diagonali di caduta
    w2 = smooth(0.12, 0.45, s) * (1.0 - 0.6 * smooth(0.8, 1.0, s))
    d += 0.0036 * w2 * ridge(2.0 * ph + TAU * 1.5 * s + sd)
    d += 0.0022 * w2 * ridge(3.0 * ph - TAU * 2.2 * s + 2.1 + sd)
    d += 0.0009 * math.sin(7.0 * ph + 31.0 * s + sd) * math.sin(4.0 * ph - 19.0 * s + 1.3)
    # stoffa raccolta prima del risvolto
    d += 0.0026 * smooth(0.72, 0.95, s) * ridge(5.0 * ph + 0.8 + sd)
    if v > 0.0:
      # risvolto arrotolato: fascia spessa con un solco in mezzo
      vv = clamp(v + 0.035 * math.sin(2.0 * ph + sd) * math.sin(math.pi * v))
      band = max(0.0, math.sin(math.pi * vv)) ** 0.3
      thick = 0.0088 * (1.0 + 0.10 * math.sin(3.0 * ph + sd) + 0.06 * math.sin(5.0 * ph + 2.0 * sd))
      groove = 1.0 - 0.24 * math.exp(-(((vv - 0.5) / 0.07) ** 2))
      d = d * (1.0 - smooth(0.80, 1.0, v)) + thick * band * groove - 0.0045 * smooth(0.93, 1.0, v)
    return d

  def sleeve_pt(self, u, ph, off=0.0):
    f = -self.L + u * self.Ls
    return self.skin_pt(f, ph, self.sleeve_off(u, ph) + off)

  def sleeve_nrm(self, u, ph):
    eu = 0.004
    ep = 0.02
    du = self.sleeve_pt(min(1.0, u + eu), ph) - self.sleeve_pt(max(0.0, u - eu), ph)
    dp = self.sleeve_pt(u, ph + ep) - self.sleeve_pt(u, ph - ep)
    rad = self.sleeve_pt(u, ph) - self.center(-self.L + u * self.Ls)
    nr = du.cross(dp)
    if nr.length < 1e-12:
      return rad.normalized()
    nr.normalize()
    if nr.dot(rad) < 0.0:
      nr = -nr
    return nr


# ----------------------------------------------------------------------------
# Dita: cinematica diretta con tre articolazioni
# ----------------------------------------------------------------------------
def finger_chain(o, t, n, lens, r, angs):
  rw, rh = r
  b = n.cross(t).normalized()   # asse della cerniera: ruotando si piega verso il palmo
  total = lens[0] + lens[1] + lens[2]
  piv_k = (0.45, 0.65, 0.65)
  steps = (4, 5, 3)

  def tap(d):
    return 1.0 - 0.20 * d / total

  st = [(o - t * 0.012, t.copy(), n.copy(), tap(0.0), 0.0, 1.0)]
  segs = []
  kn = []
  co, ct, cn = o.copy(), t.copy(), n.copy()
  done = 0.0
  for j in range(3):
    sc = tap(done)
    # il perno sta verso il palmo: così la nocca sporge sul dorso e l'interno fa la piega
    piv = co - cn * (rh * sc * piv_k[j])
    for i in range(steps[j] + 1):
      u = i / steps[j]
      q = Quaternion(b, angs[j] * u)
      st.append((piv + q @ (co - piv), q @ ct, q @ cn, sc, math.sin(math.pi * u), 1.0))
    q = Quaternion(b, angs[j] * 0.5)
    kn.append((piv + q @ (co - piv), q @ ct, q @ cn, sc))
    q = Quaternion(b, angs[j])
    co = piv + q @ (co - piv)
    ct = q @ ct
    cn = q @ cn
    L = lens[j]
    if j < 2:
      for u in (0.3, 0.55, 0.8):
        st.append((co + ct * (L * u), ct.copy(), cn.copy(), tap(done + L * u), 0.0, 1.0))
    else:
      rr = rh * tap(total)
      Lt = max(L - rr, L * 0.5)
      for u in (0.35, 0.7, 1.0):
        st.append((co + ct * (Lt * u), ct.copy(), cn.copy(), tap(done + Lt * u), 0.0, 1.0))
      for bd in (30.0, 55.0, 76.0):
        br = math.radians(bd)
        st.append((
            co + ct * (Lt + rr * math.sin(br)),
            ct.copy(),
            cn.copy(),
            tap(total),
            0.0,
            math.cos(br),
        ))
    segs.append((co.copy(), co + ct * L, ct.copy(), cn.copy(), sc))
    co = co + ct * L
    done += L
  return st, segs, kn, b


def fpt(stn, b, r, ang, off=0.0):
  o, t, n, sc, k, dm = stn
  c = math.cos(ang)
  s = math.sin(ang)
  x = r[0] * sc * (1.0 + 0.06 * k) * sp(c, 0.9) * dm
  y = r[1] * sc * sp(s, 0.9) * dm
  y *= (1.0 + 0.14 * k) if s > 0.0 else 0.92
  d = b * x + n * y
  p = o + d
  if off and d.length > 1e-9:
    p = p + d.normalized() * off
  return p


def seg_line_dist(p0, p1, d):
  # distanza tra un segmento e la retta per l'origine con direzione d
  u = p1 - p0
  a = u.dot(u)
  bq = u.dot(d)
  dd = u.dot(p0)
  e = d.dot(p0)
  den = a - bq * bq
  s = 0.0 if den < 1e-12 else clamp((bq * e - dd) / den)
  p = p0 + u * s
  return (p - d * p.dot(d)).length


def solve_grip(o, t, n, lens, r, axis_d, R):
  # chiude ogni articolazione finché la falange tocca il cilindro impugnato
  start = (math.radians(10.0), math.radians(15.0), math.radians(10.0))
  limit = (math.radians(80.0), math.radians(100.0), math.radians(62.0))
  tol = (0.9, 0.7, 0.7)
  step = math.radians(2.0)
  angs = list(start)
  for j in range(3):
    a = start[j]
    best = a
    while a <= limit[j] + 1e-6:
      angs[j] = a
      segs = finger_chain(o, t, n, lens, r, angs)[1]
      p0, p1, _, _, sc = segs[j]
      if seg_line_dist(p0, p1, axis_d) < R + r[1] * sc * tol[j]:
        break
      best = a
      a += step
    angs[j] = best
  return angs


# ----------------------------------------------------------------------------
# Pezzi del braccio
# ----------------------------------------------------------------------------
def add_camo(B, arm, s0, ph0, ru, rph, mat, phase, lift):
  u0 = s0 * arm.u_roll
  f0 = -arm.L + u0 * arm.Ls
  rloc = 0.5 * (spline(SKIN, f0, 1) + spline(SKIN, f0, 2)) + 0.009
  umin = 0.004 / arm.Ls
  umax = arm.u_roll - 0.012 / arm.Ls

  def pt(x, y, off):
    u = clamp(u0 + x / arm.Ls, umin, umax)
    ph = ph0 + y / rloc
    return arm.sleeve_pt(u, ph) + arm.sleeve_nrm(u, ph) * off

  nt = 16
  fr = (0.30, 0.56, 0.78, 0.92, 1.0, 1.07)
  lf = (lift, lift, lift, lift * 0.85, lift * 0.25, -0.0009)
  verts = [pt(0.0, 0.0, lift)]
  for k in range(len(fr)):
    for j in range(nt):
      th = TAU * j / nt
      wob = (
          1.0
          + 0.24 * math.sin(2.0 * th + phase)
          + 0.17 * math.sin(3.0 * th + 1.7 * phase)
          + 0.09 * math.sin(5.0 * th + 0.6 * phase)
      )
      verts.append(pt(ru * fr[k] * wob * math.cos(th), rph * fr[k] * wob * math.sin(th), lf[k]))
  faces = []
  for j in range(nt):
    jn = (j + 1) % nt
    faces.append((0, 1 + j, 1 + jn))
  for k in range(len(fr) - 1):
    for j in range(nt):
      jn = (j + 1) % nt
      faces.append((1 + k * nt + j, 1 + (k + 1) * nt + j, 1 + (k + 1) * nt + jn, 1 + k * nt + jn))
  ref = arm.sleeve_nrm(u0, ph0)
  B.add(verts, faces, mat, flip=(face_sign(verts, faces, ref) < 0.0))


def build_sleeve(B, arm):
  ns = 36
  nu = 30
  us = [arm.u_roll * i / (nu - 1) for i in range(nu)]
  us += [arm.u_roll + (1.0 - arm.u_roll) * v for v in VROLL]
  rings = [[arm.sleeve_pt(u, TAU * j / ns) for j in range(ns)] for u in us]
  add_tube(B, rings, M["Sleeve_Camo"], True, False)
  for i, (s0, ph0, ru, rph, mname, phase) in enumerate(CAMO):
    add_camo(B, arm, s0, ph0, ru, rph, M[mname], phase, 0.0015 + 0.0004 * (i % 3))


def build_skin(B, arm):
  ns = 28
  n = 16
  f0 = F_ROLL_END - 0.065
  f1 = -0.030
  rings = []
  for i in range(n):
    f = f0 + (f1 - f0) * i / (n - 1)
    rings.append([arm.skin_pt(f, TAU * j / ns) for j in range(ns)])
  add_tube(B, rings, M["Skin"], True, True)


def build_glove(B, Bh, arm):
  G = M["Glove"]
  P = M["Glove_Pad"]
  ns = 32
  fs = (
      -0.052, -0.048, -0.044, -0.037, -0.030, -0.022, -0.014, -0.006,
      0.002, 0.010, 0.019, 0.028, 0.037, 0.046, 0.055, 0.064, 0.073,
      0.082, 0.090, 0.096, 0.100, 0.104, 0.108,
  )
  rings = [[arm.skin_pt(-0.0505, TAU * j / ns, -0.0015) for j in range(ns)]]
  for f in fs:
    rings.append([arm.glove_pt(f, TAU * j / ns) for j in range(ns)])
  add_tube(B, rings, G, False, True)

  # pannelli imbottiti: dorso della mano e palmo
  add_plate(
      B,
      lambda u, v, off: arm.glove_pt(0.050 + 0.027 * u, math.radians(90.0 - 38.0 * v), off),
      P,
      0.0022,
  )
  add_plate(
      B,
      lambda u, v, off: arm.glove_pt(0.060 + 0.026 * u, math.radians(-90.0 + 42.0 * v), off),
      P,
      0.0018,
  )

  # cuciture sul dorso
  for phd in (38.0, 142.0):
    ph = math.radians(phd)
    pts = []
    outs = []
    for i in range(13):
      f = -0.008 + 0.094 * i / 12.0
      p0 = arm.glove_pt(f, ph, 0.0)
      pts.append(arm.glove_pt(f, ph, 0.0002))
      outs.append((arm.glove_pt(f, ph, 0.002) - p0).normalized())
    add_seam(B, pts, outs, G)
  pts = []
  outs = []
  for i in range(13):
    ph = math.radians(15.0 + 150.0 * i / 12.0)
    p0 = arm.glove_pt(0.014, ph, 0.0)
    pts.append(arm.glove_pt(0.014, ph, 0.0002))
    outs.append((arm.glove_pt(0.014, ph, 0.002) - p0).normalized())
  add_seam(B, pts, outs, G)

  # cinturino a velcro attorno al polso, con la linguetta che si solleva
  prof = (
      (-0.036, -0.0008),
      (-0.036, 0.0019),
      (-0.0345, 0.0026),
      (-0.0135, 0.0026),
      (-0.012, 0.0019),
      (-0.012, -0.0008),
  )
  K = 28
  pha = math.radians(110.0)
  phb = math.radians(430.0)
  rings = []
  for k in range(K + 1):
    ph = pha + (phb - pha) * k / K
    lift = 0.0016 * smooth(0.86, 1.0, k / K)
    rings.append([arm.glove_pt(f, ph, off + (lift if off > 0.0 else 0.0)) for f, off in prof])
  add_tube(Bh, rings, P, True, True)


def build_fingers(B, arm):
  G = M["Glove"]
  P = M["Glove_Pad"]
  ns = 12
  for (mf, ms, mn), lens, r in FINGERS:
    o = arm.hp(mf, ms, mn)
    angs = solve_grip(o, arm.F, arm.N, lens, r, arm.axis_d, arm.grip_r)
    st, segs, kn, b = finger_chain(o, arm.F, arm.N, lens, r, angs)
    rings = [[fpt(s_, b, r, TAU * j / ns) for j in range(ns)] for s_ in st]
    add_tube(B, rings, G, True, True)

    # cuciture laterali lungo il dito
    for ang in (math.radians(24.0), math.radians(156.0)):
      pts = []
      outs = []
      for s_ in st[1:-2]:
        p = fpt(s_, b, r, ang, 0.0002)
        pts.append(p)
        outs.append((p - s_[0]).normalized())
      add_seam(B, pts, outs, G)

    rw, rh = r
    # nocche imbottite
    ko, kt, kn_, ksc = kn[0]
    add_blob(
        B,
        ko + kn_ * (rh * ksc * 0.62),
        kt * 0.0125,
        b * (rw * ksc * 0.95),
        kn_ * (rh * ksc * 0.45 + 0.0045),
        P,
    )
    ko, kt, kn_, ksc = kn[1]
    add_blob(
        B,
        ko + kn_ * (rh * ksc * 0.72),
        kt * 0.0085,
        b * (rw * ksc * 0.80),
        kn_ * (rh * ksc * 0.40 + 0.0032),
        P,
    )
    # imbottiture sul dorso delle prime due falangi
    for j, (c0, hl) in ((0, (0.58, 0.22)), (1, (0.56, 0.26))):
      p0, p1, t, n, sc = segs[j]
      L = (p1 - p0).length
      add_blob(
          B,
          p0 + t * (L * c0) + n * (rh * sc - 0.0016),
          t * (L * hl),
          b * (rw * sc * 0.62),
          n * 0.0034,
          P,
          e=0.7,
      )


def build_thumb(B, arm):
  G = M["Glove"]
  P = M["Glove_Pad"]
  cmc = arm.hp(0.022, 0.030, -0.010)
  root = arm.hp(0.004, 0.016, -0.004)
  mcp, ip, tip = arm.thumb
  # la parte grossa all'inizio è la base carnosa del pollice
  pts = [root, cmc, cmc.lerp(mcp, 0.5), mcp, mcp.lerp(ip, 0.5), ip, ip.lerp(tip, 0.55), tip]
  rad = (0.0130, 0.0175, 0.0168, 0.0130, 0.0110, 0.0114, 0.0102, 0.0092)
  radii = [(r_, r_ * 0.93) for r_ in rad]
  rings, frames = path_rings(pts, radii, arm.away(mcp), 12, 3, dome=True)
  add_tube(B, rings, G, True, True)

  for idx, hl, hw, hh in ((12, 0.009, 0.62, 0.0034), (15, 0.008, 0.80, 0.0040)):
    p, t, nn, bb, (rw, rh) = frames[idx]
    d = arm.away(p, t)
    side = t.cross(d).normalized()
    add_blob(B, p + d * (rh - 0.0016), t * hl, side * (rw * hw), d * hh, P, e=0.7)

  # la pelle tra pollice e indice
  a = arm.hp(0.074, 0.036, -0.004)
  bq = mcp.lerp(cmc, 0.2)
  rings, _ = path_rings(
      [a, a.lerp(bq, 0.5), bq],
      [(0.011, 0.008), (0.0105, 0.008), (0.010, 0.009)],
      arm.N,
      10,
      3,
  )
  add_tube(B, rings, G, True, True)


def build_watch(Bh, arm):
  # orologio tattico portato all'interno del polso (lato palmo), così si vede in prima persona
  Wm = M["Watch"]
  fw = -0.079
  ns = 32
  prof = (
      (-0.0115, -0.001),
      (-0.011, 0.0020),
      (-0.0095, 0.0028),
      (0.0095, 0.0028),
      (0.011, 0.0020),
      (0.0115, -0.001),
  )
  rings = [[arm.skin_pt(fw + df, TAU * j / ns, off) for j in range(ns)] for df, off in prof]
  add_tube(Bh, rings, Wm, False, False)

  phc = -0.5 * math.pi
  c0 = arm.skin_pt(fw, phc)
  out = (arm.skin_pt(fw, phc, 0.002) - c0).normalized()
  t = arm.frame(fw)[0]
  e1 = (t - out * t.dot(out)).normalized()
  e2 = out.cross(e1).normalized()
  nc = 24
  cp = (
      (-0.007, 0.0185, 0),
      (0.0035, 0.0195, 0),
      (0.0072, 0.0195, 1),
      (0.0098, 0.0180, 1),
      (0.0098, 0.0152, 0),
      (0.0084, 0.0147, 0),
  )
  rings = []
  for h, rr, notch in cp:
    ring = []
    for j in range(nc):
      a = TAU * j / nc
      k = 1.0 + (0.035 if (notch and j % 2 == 0) else 0.0)
      ring.append(c0 + out * h + e1 * (rr * k * math.cos(a)) + e2 * (rr * k * math.sin(a)))
    rings.append(ring)
  add_tube(Bh, rings, Wm, True, True)
  for sgn in (-1.0, 1.0):
    add_blob(
        Bh,
        c0 + out * 0.0025 + e1 * (0.0195 * sgn),
        e1 * 0.0065,
        e2 * 0.0115,
        out * 0.0042,
        Wm,
        nu=8,
        e=0.35,
    )
  add_blob(Bh, c0 + out * 0.0055 + e2 * 0.0205, e2 * 0.0032, e1 * 0.0030, out * 0.0030, Wm, nu=8, e=0.8)


# ----------------------------------------------------------------------------
# Dalla geometria all'oggetto Blender
# ----------------------------------------------------------------------------
def mesh_from_builder(name, B):
  mesh = bpy.data.meshes.new(name)
  mesh.from_pydata(B.v, [], B.f)
  for mat in ALL_MATS:
    mesh.materials.append(mat)
  mesh.polygons.foreach_set("material_index", B.m)
  mesh.update()
  return mesh


def bevel_hard_parts(B, Bh):
  # smusso (Bevel) solo sui pezzi rigidi: orologio e cinturino a velcro
  if not Bh.f:
    return
  verts = None
  faces = None
  mats = None
  try:
    me = mesh_from_builder("tmp_hard", Bh)
    ob = bpy.data.objects.new("tmp_hard", me)
    bpy.context.scene.collection.objects.link(ob)
    md = ob.modifiers.new(name="Bevel", type="BEVEL")
    md.width = 0.0006
    md.segments = 2
    md.limit_method = "ANGLE"
    md.angle_limit = math.radians(40.0)
    dg = bpy.context.evaluated_depsgraph_get()
    m2 = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    verts = [v.co.copy() for v in m2.vertices]
    faces = [tuple(p.vertices) for p in m2.polygons]
    mats = [p.material_index for p in m2.polygons]
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.meshes.remove(m2)
    bpy.data.meshes.remove(me)
  except Exception as exc:
    print("Avviso: bevel dei pezzi rigidi saltato:", exc)
    verts = None
  if verts is None or not faces:
    B.add(Bh.v, Bh.f, list(Bh.m))
  else:
    B.add(verts, faces, mats)


def count_tris(mesh):
  return sum(len(p.vertices) - 2 for p in mesh.polygons)


def apply_modifier(obj, mod_type, setup):
  try:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    md = obj.modifiers.new(name=mod_type.title(), type=mod_type)
    setup(md)
    bpy.ops.object.modifier_apply(modifier=md.name)
  except Exception as exc:
    print("Avviso: modificatore", mod_type, "non applicato:", exc)
    for md in list(obj.modifiers):
      obj.modifiers.remove(md)


def create_arm_object(name, is_left, root_empty):
  arm = Arm(is_left)
  B = Builder()
  Bh = Builder()

  build_sleeve(B, arm)
  build_skin(B, arm)
  build_glove(B, Bh, arm)
  build_fingers(B, arm)
  build_thumb(B, arm)
  if is_left:
    build_watch(Bh, arm)
  bevel_hard_parts(B, Bh)

  mesh = mesh_from_builder(name, B)
  try:
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
  except Exception:
    try:
      mesh.shade_smooth()
    except Exception:
      pass
  mesh.validate()
  mesh.update()

  obj = bpy.data.objects.new(name, mesh)
  obj.location = (0.0, 0.0, 0.0)
  bpy.context.scene.collection.objects.link(obj)
  obj.parent = root_empty

  # reti di sicurezza sul numero di triangoli (obiettivo 8.000-20.000)
  tris = count_tris(obj.data)
  if tris > 19500:
    ratio = 17000.0 / float(tris)
    apply_modifier(obj, "DECIMATE", lambda md: setattr(md, "ratio", ratio))
  elif tris < 8000:
    def setup_sub(md):
      md.levels = 1
      md.render_levels = 1
    apply_modifier(obj, "SUBSURF", setup_sub)

  try:
    obj.data.set_sharp_from_angle(angle=math.radians(50.0))
  except Exception:
    pass
  obj.data.update()
  return obj


def main():
  out_path = os.path.abspath(get_output_path())
  out_dir = os.path.dirname(out_path)
  if out_dir and not os.path.exists(out_dir):
    os.makedirs(out_dir, exist_ok=True)

  root_empty = bpy.data.objects.new("ARMS_ROOT", None)
  root_empty.empty_display_type = "PLAIN_AXES"
  root_empty.location = (0.0, 0.0, 0.0)
  bpy.context.scene.collection.objects.link(root_empty)

  arm_r = create_arm_object("ARM_R", is_left=False, root_empty=root_empty)
  arm_l = create_arm_object("ARM_L", is_left=True, root_empty=root_empty)

  tris_r = count_tris(arm_r.data)
  tris_l = count_tris(arm_l.data)

  bpy.ops.export_scene.gltf(
      filepath=out_path,
      export_format="GLB",
      export_apply=True,
      export_yup=True,
  )

  print("OK arms.glb")
  print(
      f"ARM_R: {tris_r} triangoli, ARM_L: {tris_l} triangoli,"
      f" TOTALE: {tris_r + tris_l} triangoli"
  )


if __name__ == "__main__":
  main()
