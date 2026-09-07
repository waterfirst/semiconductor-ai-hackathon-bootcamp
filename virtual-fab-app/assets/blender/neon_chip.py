"""칩 클로즈업 렌더 — Blender 헤드리스 검증용 레퍼런스.

2026-09-07 Codex 가 서버에서 Blender 를 처음 구동하며 만든 스크립트다.
mat()/cube()/route()/look_at() 패턴을 cleanroom_shell.py 가 물려받았다.
출력 경로가 임시 워크스페이스에 박혀 있어 인자로 바꿔 보관한다.

  blender -b -P neon_chip.py -- --render out.png --blend out.blend
"""
import sys

import bpy
import math
from mathutils import Vector

import argparse

_argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
_p = argparse.ArgumentParser()
_p.add_argument("--render", default="neon_chip_render.png")
_p.add_argument("--blend", default="neon_chip.blend")
_a = _p.parse_args(_argv)
OUT, BLEND = _a.render, _a.blend

# Clean scene.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.materials, bpy.data.curves):
    pass

def mat(name, color, metallic=0.0, roughness=0.45, emission=None):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 5.0
    return m

navy = mat("PCB navy", (0.015, 0.055, 0.12), metallic=0.25, roughness=0.28)
chip = mat("Chip ceramic", (0.028, 0.12, 0.20), metallic=0.45, roughness=0.25)
gold = mat("Gold contacts", (0.95, 0.42, 0.06), metallic=0.92, roughness=0.2)
cyan = mat("Cyan circuit light", (0.01, 0.35, 0.48), metallic=0.1, roughness=0.28, emission=(0.0, 0.65, 1.0))
orange = mat("Orange circuit light", (0.7, 0.08, 0.0), metallic=0.1, roughness=0.28, emission=(1.0, 0.09, 0.0))

def cube(name, location, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        mod = o.modifiers.new("Rounded edges", "BEVEL")
        mod.width = bevel
        mod.segments = 4
    return o

# Board and raised package.
cube("PCB", (0, 0, 0), (4.8, 4.8, 0.18), navy, 0.22)
cube("Processor", (0, 0, 0.55), (2.25, 2.25, 0.42), chip, 0.24)
cube("Core glow", (0, 0, 1.0), (1.4, 1.4, 0.05), cyan, 0.12)

# Gold pins.
for side in (-1, 1):
    for i in range(-4, 5):
        x = i * 0.47
        cube("pin", (x, side * 2.65, 0.34), (0.12, 0.42, 0.08), gold, 0.04)
        cube("pin", (side * 2.65, x, 0.34), (0.42, 0.12, 0.08), gold, 0.04)

# Raised glowing routes, mirrored to form a readable circuit motif.
def route(points, material):
    curve = bpy.data.curves.new("Circuit route", type="CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.045
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new("Circuit route", curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)

for s in (-1, 1):
    route([(s*2.2, -4.0, .28), (s*2.2, -3.0, .28), (s*3.65, -2.4, .28), (s*3.65, -1.2, .28)], cyan)
    route([(s*1.3, 2.3, .28), (s*1.3, 3.2, .28), (s*3.7, 3.2, .28), (s*3.7, 4.1, .28)], orange)
    for x, y, m in [(s*3.65, -1.2, cyan), (s*3.7, 4.1, orange)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, location=(x, y, .28), radius=.16)
        bpy.context.object.data.materials.append(m)

# Ground plane.
ground = cube("Ground", (0, 0, -0.35), (8, 8, 0.05), mat("Ground", (0.003, 0.008, 0.018), metallic=0.2, roughness=0.18))

# Camera.
bpy.ops.object.camera_add(location=(9.2, -10.5, 9.0))
camera = bpy.context.object
bpy.context.scene.camera = camera
def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()
look_at(camera, (0, 0, 0.35))
camera.data.lens = 52

# Lighting.
def area(name, location, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=location)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy = energy
    lamp.data.shape = "DISK"
    lamp.data.size = size
    lamp.data.color = color
    look_at(lamp, (0, 0, 0))
area("Cool key", (3, -4, 8), 900, (0.20, 0.65, 1.0), 5)
area("Warm rim", (-5, 3, 5), 700, (1.0, 0.18, 0.04), 4)
area("Soft fill", (0, 5, 3), 350, (0.20, 0.35, 0.8), 5)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
scene.render.film_transparent = False
scene.world.color = (0.002, 0.005, 0.012)
scene.view_settings.look = "AgX - Medium High Contrast"

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.render.render(write_still=True)
