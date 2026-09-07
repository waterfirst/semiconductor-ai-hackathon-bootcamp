"""가상팹 클린룸 외부 환경을 Blender 로 만든다(사람 제외).

R3F 씬은 박스 프리미티브로만 되어 있어 벽·천장·집기가 판때기로 보인다.
여기서는 하드서피스 디테일(패널 이음매, FFU 격자, 그레이팅, 배관)을 만들어
.glb 로 내보내고, R3F 는 그것을 불러 쓴다.

좌표계: three.js 는 Y-up, Blender 는 Z-up 이다. glTF 익스포터가
Blender(x,y,z) -> glTF(x, z, -y) 로 변환하므로, three.js 좌표 (X,Y,Z) 를
쓰려면 Blender 에는 (X, -Z, Y) 로 넣는다. t3() 가 그 변환을 한다.

사용:
  blender -b -P cleanroom_shell.py -- --render out.png [--glb out.glb] [--blend out.blend]
"""
import argparse
import math
import sys

import bpy

# ---------------------------------------------------------------- 인자


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--render", default="")
    p.add_argument("--glb", default="")
    p.add_argument("--blend", default="")
    p.add_argument("--samples", type=int, default=48)
    p.add_argument("--res", type=int, default=960)
    p.add_argument("--cam", default="wide", choices=["wide", "mask", "shower"])
    p.add_argument("--join", action="store_true", help="재질별 병합(드로우콜 축소)")
    # 에어샤워는 문이 열리고 노즐이 켜지는 애니메이션이 R3F 쪽에 있다.
    # 구우면 그 동작이 죽으므로 static 세트에서 뺀다.
    p.add_argument("--set", dest="parts", default="static", choices=["static", "full"])
    return p.parse_args(argv)


# ---------------------------------------------------------------- 유틸


def t3(x: float, y: float, z: float) -> tuple[float, float, float]:
    """three.js 좌표를 Blender 좌표로 옮긴다."""
    return (x, -z, y)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for item in list(coll):
            coll.remove(item)


def mat(name, color, metallic=0.0, roughness=0.5, emission=None, strength=3.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


def box(name, center, size, material, bevel=0.0, segments=3):
    """three.js 기준 중심·크기(전체 변 길이)로 육면체를 만든다."""
    bpy.ops.mesh.primitive_cube_add(location=t3(*center))
    o = bpy.context.object
    o.name = name
    sx, sy, sz = size
    o.scale = (sx / 2, sz / 2, sy / 2)   # three(x,y,z) -> blender(x,z,y)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = segments
        b.limit_method = "ANGLE"
    return o


def cyl(name, center, radius, height, material, axis="y", verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=height,
                                        location=t3(*center))
    o = bpy.context.object
    o.name = name
    if axis == "y":
        pass                                  # blender Z == three Y
    elif axis == "x":
        o.rotation_euler = (0, math.radians(90), 0)
    else:                                     # three Z == blender -Y
        o.rotation_euler = (math.radians(90), 0, 0)
    o.data.materials.append(material)
    return o


# ---------------------------------------------------------------- 재료

def build_materials() -> dict:
    return {
        "floor":   mat("Floor epoxy",   (.80, .86, .86), metallic=.05, roughness=.34),
        "grate":   mat("Grating",       (.62, .69, .70), metallic=.75, roughness=.35),
        "panel":   mat("Wall panel",    (.90, .94, .94), metallic=.10, roughness=.42),
        "seam":    mat("Panel seam",    (.63, .72, .74), metallic=.55, roughness=.30),
        "frame":   mat("Steel frame",   (.55, .62, .65), metallic=.85, roughness=.28),
        "ffu":     mat("FFU face",      (.86, .92, .93), metallic=.15, roughness=.55),
        "light":   mat("Light panel",   (.92, 1.0, 1.0), emission=(.86, .98, 1.0), strength=4.2),
        "glass":   mat("Glass",         (.72, .86, .88), metallic=.05, roughness=.06, alpha=.28),
        "duct":    mat("Duct",          (.70, .76, .78), metallic=.70, roughness=.34),
        "accent":  mat("Teal accent",   (.06, .46, .52), metallic=.30, roughness=.34),
        "screen":  mat("Screen",        (.55, .95, .95), emission=(.10, .62, .68), strength=2.4),
        "white":   mat("White plastic", (.94, .97, .97), metallic=.02, roughness=.38),
    }


# ---------------------------------------------------------------- 방 셸

def build_shell(M: dict) -> None:
    """바닥·벽·천장. 치수는 R3F FacilityShell 과 맞춘다(18 x 13, 벽 x=+-8.8)."""
    box("floor", (0, -.10, 0), (18, .20, 13), M["floor"], bevel=.02)

    # 그레이팅 띠 — 통로 양옆에 넣어 바닥이 단색 판이 되지 않게 한다.
    for z in (-2.4, 2.4):
        box(f"grate_run_{z}", (0, .012, z), (17.2, .03, .62), M["grate"], bevel=.006)
        for i in range(-27, 28):
            box(f"grate_bar_{z}_{i}", (i * .31, .028, z), (.055, .05, .58), M["frame"])

    # 벽: 패널 + 이음매. 통짜 박스 하나였던 것을 폭 2.25 패널로 나눈다.
    def wall_panels(axis: str, fixed: float, span: float, count: int):
        step = span / count
        for i in range(count):
            c = -span / 2 + step * (i + .5)
            if axis == "back":
                box(f"wall_b_{i}", (c, 2.6, fixed), (step - .05, 5.2, .18), M["panel"], bevel=.03)
                box(f"seam_b_{i}", (c + step / 2, 2.6, fixed + .10), (.05, 5.2, .04), M["seam"])
            else:
                box(f"wall_{axis}_{i}", (fixed, 2.6, c), (.18, 5.2, step - .05), M["panel"], bevel=.03)
                box(f"seam_{axis}_{i}", (fixed + (.10 if fixed < 0 else -.10), 2.6, c + step / 2),
                    (.04, 5.2, .05), M["seam"])

    wall_panels("back", -4.35, 17.6, 8)
    wall_panels("l", -8.85, 12.4, 6)
    wall_panels("r", 8.85, 12.4, 6)

    # 걸레받이(coving) — 클린룸은 청소를 위해 벽-바닥 모서리를 둥글게 만다.
    for x in (-8.7, 8.7):
        box(f"cove_{x}", (x, .16, 0), (.22, .32, 12.6), M["seam"], bevel=.09, segments=5)
    box("cove_back", (0, .16, -4.2), (17.8, .32, .22), M["seam"], bevel=.09, segments=5)

    # FFU 천장: 격자 프레임 + 필터면 + 조명 패널
    top = 5.15
    box("ceil_slab", (0, top + .30, 0), (18, .22, 13), M["panel"])
    for gx in range(-4, 5):
        box(f"ffu_rail_x{gx}", (gx * 2.0, top, 0), (.10, .14, 12.4), M["frame"])
    for gz in range(-3, 4):
        box(f"ffu_rail_z{gz}", (0, top, gz * 1.9), (17.6, .14, .10), M["frame"])
    for gx in range(-4, 4):
        for gz in range(-3, 3):
            cx, cz = gx * 2.0 + 1.0, gz * 1.9 + .95
            lit = (gx + gz) % 2 == 0
            box(f"ffu_{gx}_{gz}", (cx, top - .02, cz), (1.82, .07, 1.72),
                M["light"] if lit else M["ffu"])

    # 배관·덕트 — 천장 아래를 지나가게 해서 공간의 깊이를 만든다.
    for z, r in ((-3.5, .30), (-3.0, .20)):
        cyl(f"duct_{z}", (0, 4.55, z), r, 17.4, M["duct"], axis="x", verts=20)
        for x in (-6.4, -1.6, 3.2, 7.4):
            box(f"duct_hanger_{z}_{x}", (x, 4.85, z), (.07, .62, .07), M["frame"])


# ---------------------------------------------------------------- 집기

def build_sink(M: dict, ox: float = -3.4, oz: float = .6) -> None:
    box("sink_counter", (ox, .80, oz), (1.60, .10, 1.05), M["white"], bevel=.03)
    for sx in (-.68, .68):
        box(f"sink_leg{sx}", (ox + sx, .40, oz), (.09, .80, .09), M["frame"])
    box("sink_apron", (ox, .60, oz - .48), (1.60, .30, .08), M["frame"])
    cyl("sink_basin", (ox, .74, oz), .46, .20, M["frame"], verts=30)
    cyl("sink_drain", (ox, .66, oz), .07, .06, M["seam"], verts=14)
    cyl("faucet_stem", (ox, 1.12, oz - .34), .045, .58, M["frame"], verts=16)
    cyl("faucet_arm", (ox, 1.40, oz - .18), .04, .36, M["frame"], axis="z", verts=16)
    cyl("faucet_head", (ox, 1.34, oz - .02), .05, .14, M["frame"], verts=16)
    box("soap", (ox + .60, 1.00, oz - .18), (.12, .30, .12), M["accent"], bevel=.02)


def build_mask_cabinet(M: dict, ox: float = -1.2, oz: float = .2) -> None:
    """마스크 디스펜서. 기존에는 큰 박스 + 4.6도 기울어진 흰 판이라 실수처럼 보였다.
    기울기를 없애고 실제 디스펜서 구조(캐비닛 - 인셋 전면 - 배출구 - 마스크 적층)로 만든다."""
    box("mask_body", (ox, 1.05, oz), (1.16, 2.06, .72), M["white"], bevel=.035, segments=4)
    box("mask_base", (ox, .06, oz), (1.22, .12, .78), M["frame"], bevel=.02)
    # 전면 인셋: 본체보다 살짝 안쪽으로 들어간 패널
    box("mask_front", (ox, 1.16, oz + .335), (1.00, 1.62, .05), M["accent"], bevel=.02)
    # 상단 안내 화면 — 수평이다. 기울이지 않는다.
    box("mask_screen", (ox, 1.62, oz + .375), (.66, .40, .03), M["screen"], bevel=.012)
    box("mask_screen_bezel", (ox, 1.62, oz + .365), (.74, .48, .03), M["frame"], bevel=.012)
    # 배출구: 오목한 슬롯과 그 안에 쌓인 마스크
    box("mask_slot", (ox, .86, oz + .30), (.78, .26, .16), M["frame"], bevel=.02)
    for i in range(5):
        box(f"mask_stack{i}", (ox, .80 + i * .022, oz + .345), (.60, .02, .10), M["glass"])
    box("mask_lip", (ox, .70, oz + .38), (.80, .06, .10), M["frame"], bevel=.02)
    # 폐기함
    box("mask_bin", (ox + .78, .42, oz - .05), (.40, .84, .40), M["frame"], bevel=.03)
    box("mask_bin_lid", (ox + .78, .87, oz - .05), (.42, .06, .42), M["accent"], bevel=.02)


def build_gown(M: dict, ox: float = 1.15, oz: float = .2) -> None:
    box("gown_rail", (ox, 1.58, oz - .2), (1.86, .10, .72), M["frame"], bevel=.02)
    for sx in (-.86, .86):
        box(f"gown_post{sx}", (ox + sx, .80, oz - .2), (.09, 1.56, .09), M["frame"])
    for i, sx in enumerate((-.56, 0, .56)):
        cyl(f"gown_hook{i}", (ox + sx, 1.50, oz - .2), .022, .22, M["frame"], verts=10)
        box(f"gown_suit{i}", (ox + sx, .96, oz - .16), (.42, .98, .22), M["white"], bevel=.10, segments=4)
        box(f"gown_hood{i}", (ox + sx, 1.44, oz - .16), (.26, .26, .20), M["white"], bevel=.09, segments=4)
    box("gown_bench", (ox, .42, oz + .78), (1.70, .10, .44), M["white"], bevel=.03)
    for sx in (-.72, .72):
        box(f"bench_leg{sx}", (ox + sx, .20, oz + .78), (.07, .40, .07), M["frame"])


def build_air_shower(M: dict, ox: float = 3.55, oz: float = .1) -> None:
    # 벽체를 통짜 박스가 아니라 프레임 + 유리로 만든다.
    box("as_ceiling", (ox, 3.24, oz - .15), (2.30, .18, 1.86), M["panel"], bevel=.03)
    for sx in (-1.06, 1.06):
        box(f"as_wall{sx}", (ox + sx, 1.62, oz - .15), (.14, 3.24, 1.86), M["panel"], bevel=.03)
    for sz, tag in ((.78, "in"), (-1.08, "out")):
        for sx in (-.62, .62):
            box(f"as_jamb_{tag}{sx}", (ox + sx, 1.62, oz + sz), (.16, 3.24, .16), M["frame"], bevel=.02)
        box(f"as_head_{tag}", (ox, 3.10, oz + sz), (2.20, .22, .16), M["frame"], bevel=.02)
        box(f"as_glass_{tag}", (ox, 1.60, oz + sz), (1.08, 2.90, .05), M["glass"])
    # 노즐 열 — 에어샤워의 상징. 양 벽에 박아 넣는다.
    for sx in (-.92, .92):
        for i in range(4):
            for j in range(2):
                cyl(f"as_nozzle{sx}_{i}_{j}", (ox + sx, 1.05 + i * .58, oz - .55 + j * .78),
                    .055, .16, M["frame"], axis="x", verts=10)
    box("as_grate", (ox, .04, oz - .15), (1.90, .08, 1.60), M["grate"], bevel=.01)
    for i in range(11):
        box(f"as_grate_bar{i}", (ox - .85 + i * .17, .09, oz - .15), (.05, .04, 1.56), M["frame"])


def build_threshold(M: dict, ox: float = 3.55, oz: float = -2.15) -> None:
    box("th_step", (ox, .04, oz - .8), (2.54, .08, 2.70), M["grate"], bevel=.01)
    for i in range(13):
        box(f"th_bar{i}", (ox - 1.14 + i * .19, .09, oz - .8), (.05, .04, 2.52), M["frame"])
    for sx in (-1.22, 1.22):
        box(f"th_post{sx}", (ox + sx, 1.72, oz + .42), (.18, 3.44, .20), M["frame"], bevel=.03)
    box("th_header", (ox, 3.34, oz + .42), (2.72, .26, .22), M["accent"], bevel=.03)
    box("th_sign", (ox, 3.34, oz + .54), (1.30, .16, .03), M["screen"])


# ---------------------------------------------------------------- 렌더

CAM_PRESETS = {
    "wide":   ((1.6, 3.6, 9.4), (-.4, 1.4, -.6), 30),
    "mask":   ((-.2, 1.9, 3.1), (-1.2, 1.15, .2), 46),
    "shower": ((5.4, 2.4, 4.6), (3.55, 1.5, -.2), 34),
}


def setup_camera_and_light(res: int, samples: int, preset: str = "wide") -> None:
    from mathutils import Vector
    loc, look, lens = CAM_PRESETS[preset]
    bpy.ops.object.camera_add(location=t3(*loc))
    cam = bpy.context.object
    bpy.context.scene.camera = cam
    target = Vector(t3(*look))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens

    def area(name, loc, energy, size, color=(1, 1, 1)):
        bpy.ops.object.light_add(type="AREA", location=t3(*loc))
        lamp = bpy.context.object
        lamp.name = name
        lamp.data.energy = energy
        lamp.data.size = size
        lamp.data.color = color
        lamp.rotation_euler = (0, 0, 0)      # 아래를 향한다
        return lamp

    area("key", (0, 5.0, 0), 2600, 12)
    area("fill_front", (0, 4.2, 5.5), 900, 8, (.86, .95, 1.0))
    area("fill_side", (-6.5, 3.4, 1.5), 500, 6, (.90, .96, 1.0))

    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.eevee.taa_render_samples = samples
    sc.render.resolution_x = res
    sc.render.resolution_y = int(res * .62)
    sc.render.image_settings.file_format = "PNG"
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.05, .07, .09, 1)
    sc.view_settings.look = "AgX - Medium High Contrast"


def join_by_material() -> int:
    """재질별로 메시를 합친다.

    오브젝트 하나가 드로우콜 하나다. 병합 전 327개는 면이 2,180개뿐인데도
    R3F 씬 전체(메시 40개)의 8배라 프레임을 깎는다. 재질이 12종이므로
    합치면 12개로 떨어진다. 조인은 활성 오브젝트의 모디파이어만 남기므로
    베벨을 먼저 적용한다.
    """
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [o for o in bpy.data.objects if o.type == "MESH"]:
        if not obj.modifiers:
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False)

    groups: dict[str, list] = {}
    for obj in [o for o in bpy.data.objects if o.type == "MESH"]:
        key = obj.data.materials[0].name if obj.data.materials else "_none"
        groups.setdefault(key, []).append(obj)

    for key, objs in groups.items():
        if len(objs) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        bpy.context.object.name = f"cleanroom_{key.split()[0].lower()}"
    bpy.ops.object.select_all(action="DESELECT")
    return len([o for o in bpy.data.objects if o.type == "MESH"])


def main() -> int:
    args = parse_args()
    clear_scene()
    M = build_materials()
    build_shell(M)
    build_sink(M)
    build_mask_cabinet(M)
    build_gown(M)
    if args.parts == "full":
        build_air_shower(M)
        build_threshold(M)
    setup_camera_and_light(args.res, args.samples, args.cam)

    before = len([o for o in bpy.data.objects if o.type == "MESH"])
    after = join_by_material() if args.join else before
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    tris = sum(len(o.data.polygons) for o in meshes)
    print(f"[cleanroom] objects {before} -> {after}  faces={tris}")

    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.blend)
    if args.glb:
        for o in bpy.data.objects:
            o.select_set(o.type == "MESH")
        bpy.ops.export_scene.gltf(
            filepath=args.glb, export_format="GLB", use_selection=True,
            export_draco_mesh_compression_enable=False,
            export_apply=True,
        )
    if args.render:
        bpy.context.scene.render.filepath = args.render
        bpy.ops.render.render(write_still=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
