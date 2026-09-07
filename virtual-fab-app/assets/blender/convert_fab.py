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


def join_by_material() -> int:
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
        bpy.context.object.name = f"fab_{key.replace(' ', '_').lower()}"
    bpy.ops.object.select_all(action="DESELECT")
    return len([o for o in bpy.data.objects if o.type == "MESH"])


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
    after = join_by_material()

    lift = args.lift if args.lift is not None else -floor_z()
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        o.location.z += lift

    tris = 0
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
    print(f"[convert] font->mesh {fonts} · modifiers {mods} · objects {before}->{after} · tris {tris:,} · lift {lift:.3f}")

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
