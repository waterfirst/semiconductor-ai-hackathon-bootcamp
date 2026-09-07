"""사용자가 GPU PC 에서 만든 semiconductor_fab.blend 를 웹용 .glb 로 변환한다.

원본은 오프라인 렌더용이라 그대로 내보내면 안 되는 것이 셋 있다.
  1) FONT 오브젝트 10개 — glTF 는 텍스트 커브를 모른다. 메시로 변환한다.
  2) BEVEL/WEIGHTED_NORMAL 모디파이어 208개 — 적용해야 형상에 반영된다.
  3) 오브젝트 150개 — 하나가 드로우콜 하나다. 재질별로 합친다.

바닥이 Z=-0.46 에 있어 R3F 에서 바닥면(Y=0)에 맞도록 올린다.

  blender -b in.blend -P convert_fab.py -- --glb out.glb [--lift 0.46]
"""
import argparse
import sys

import bpy


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--glb", required=True)
    p.add_argument("--lift", type=float, default=None, help="바닥을 Z=0 으로 올린다")
    p.add_argument("--keep-lights", action="store_true")
    return p.parse_args(argv)


def convert_text() -> int:
    fonts = [o for o in bpy.data.objects if o.type == "FONT"]
    if not fonts:
        return 0
    bpy.ops.object.select_all(action="DESELECT")
    for o in fonts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = fonts[0]
    bpy.ops.object.convert(target="MESH")
    return len(fonts)


def apply_modifiers() -> int:
    n = 0
    for obj in [o for o in bpy.data.objects if o.type == "MESH"]:
        if not obj.modifiers:
            continue
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
                n += 1
            except RuntimeError as exc:      # 적용 불가한 모디파이어는 건너뛴다
                print(f"[convert] skip {obj.name}/{mod.name}: {exc}")
    return n


def _bbox(obj):
    import mathutils
    cs = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    xs = [c.x for c in cs]; ys = [c.y for c in cs]; zs = [c.z for c in cs]
    return ((sum(xs) / 8, sum(ys) / 8, sum(zs) / 8),
            (max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))


def cluster_tools(radius: float = 1.9, min_parts: int = 6):
    """장비 한 대를 이루는 부품들을 XY 근접도로 묶는다.

    재질별로만 합치면 장비 8대가 한 덩어리가 되어 개별 클릭·하이라이트가
    불가능하다. 폭 6 이상은 바닥·벽 같은 구조물로 보고 제외한 뒤, 남은
    부품을 위치로 군집화한다. 부품 6개 미만 군집(레일 등)은 장비로 보지 않는다.
    """
    import math
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    parts, structure = [], []
    for o in meshes:
        ctr, size = _bbox(o)
        (structure if max(size[0], size[1]) > 6 else parts).append((o, ctr))
    clusters: list[list] = []
    for o, ctr in sorted(parts, key=lambda t: -t[0].dimensions.x * t[0].dimensions.y):
        for cl in clusters:
            cx = sum(m[1][0] for m in cl) / len(cl)
            cy = sum(m[1][1] for m in cl) / len(cl)
            if math.hypot(ctr[0] - cx, ctr[1] - cy) < radius:
                cl.append((o, ctr))
                break
        else:
            clusters.append([(o, ctr)])
    tools = [cl for cl in clusters if len(cl) >= min_parts]
    loose = [m for cl in clusters if len(cl) < min_parts for m in cl]
    # 화면 안쪽(three -Z)부터, 그 다음 왼쪽부터 번호를 매겨 순서를 안정시킨다.
    tools.sort(key=lambda cl: (-round(sum(m[1][1] for m in cl) / len(cl), 1),
                               round(sum(m[1][0] for m in cl) / len(cl), 1)))
    return tools, [o for o, _ in loose] + [o for o, _ in structure]


def _join(objs, name):
    if not objs:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = name
    bpy.ops.object.select_all(action="DESELECT")
    return bpy.context.object


def group_scene() -> tuple[int, list]:
    """장비는 대별로, 나머지는 재질별로 합친다."""
    tools, rest = cluster_tools()
    centers = []
    for i, cl in enumerate(tools):
        objs = [o for o, _ in cl]
        cx = sum(c[0] for _, c in cl) / len(cl)
        cy = sum(c[1] for _, c in cl) / len(cl)
        _join(objs, f"tool_{i:02d}")
        centers.append((i, cx, cy))
    groups: dict[str, list] = {}
    for obj in rest:
        key = obj.data.materials[0].name if obj.data.materials else "_none"
        groups.setdefault(key, []).append(obj)
    for key, objs in groups.items():
        _join(objs, f"fab_{key.replace(' ', '_').lower()}")
    return len([o for o in bpy.data.objects if o.type == "MESH"]), centers


def floor_z() -> float:
    import mathutils
    lo = 1e9
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        for c in o.bound_box:
            lo = min(lo, (o.matrix_world @ mathutils.Vector(c))[2])
    return lo


def main() -> int:
    args = parse_args()
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object else None

    fonts = convert_text()
    mods = apply_modifiers()
    before = len([o for o in bpy.data.objects if o.type == "MESH"])
    after, centers = group_scene()

    lift = args.lift if args.lift is not None else -floor_z()
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        o.location.z += lift

    tris = 0
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
    print(f"[convert] font->mesh {fonts} · modifiers {mods} · objects {before}->{after} · tris {tris:,} · lift {lift:.3f}")
    # three.js 좌표(x, z)로 바꿔 출력한다. R3F STATION_LAYOUT 에 그대로 넣는다.
    for i, cx, cy in centers:
        print(f"[tool] tool_{i:02d}  three [{cx:.2f}, 0, {-cy:.2f}]")

    for o in bpy.data.objects:
        o.select_set(o.type == "MESH" or (args.keep_lights and o.type == "LIGHT"))
    bpy.ops.export_scene.gltf(
        filepath=args.glb, export_format="GLB", use_selection=True,
        export_draco_mesh_compression_enable=False,   # 디코더 CDN 의존을 만들지 않는다
        export_apply=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
