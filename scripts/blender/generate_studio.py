"""Generate a configurable boutique Pilates studio shell in Blender 4.x/5.x.

Run: blender --background --python scripts/blender/generate_studio.py
Optional: blender --background --python scripts/blender/generate_studio.py -- /absolute/output.glb
All dimensions are in metres. Export includes the architectural shell only;
interactive products remain managed by the Next.js configurator.
"""
import bpy
import math
import sys
from pathlib import Path

WIDTH = 6.4
DEPTH = 5.6
HEIGHT = 3.1

def material(name, rgb, roughness=0.8, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat

def cuboid(name, location, scale, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj

def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = "METRIC"

    oak = material("Light oak", (.56, .41, .29))
    ivory = material("Warm ivory", (.86, .83, .77))
    trim = material("Warm wood trim", (.43, .30, .20))
    mirror = material("Mirror silver approximation", (.72, .76, .76), .12, .85)
    charcoal = material("Hooks graphite", (.14, .14, .14), .35, .55)

    # Coordinate convention matches Three.js: X width, Y height, Z depth.
    # Blender is Z-up, so author Blender XYZ = Three.js (X,Z,-Y).
    cuboid("Floor", (0, 0, -.05), (WIDTH, DEPTH, .1), oak)
    cuboid("Back wall", (0, -DEPTH/2, HEIGHT/2), (WIDTH, .08, HEIGHT), ivory)
    cuboid("Left accessory wall", (-WIDTH/2, 0, HEIGHT/2), (.08, DEPTH, HEIGHT), ivory)
    # The front wall is intentionally omitted for the design/cutaway view.
    # Three mirrors aligned with the three mat stations.
    for index, x in enumerate((-2.05, 0, 2.05), start=1):
        cuboid(f"Mirror {index}", (x, -DEPTH/2 + .065, 1.56),
               (1.89, .025, 2.38), mirror, .008)
        for side, dx in (("L", -.965), ("R", .965)):
            cuboid(f"Mirror {index} frame {side}",
                   (x + dx, -DEPTH/2 + .09, 1.56),
                   (.035, .05, 2.48), trim)
    # Shelves on the left accessory wall.
    for index, height in enumerate((.8, 1.2, 1.6, 2.0, 2.4), start=1):
        cuboid(f"Accessory shelf {index}",
               (-WIDTH/2 + .34, 1.12, height),
               (.62, 2.25, .045), oak, .012)
    # Wall-mounted ring and Z-bar hooks.
    for index, (y, z) in enumerate(((-1.9, 2.65), (-1.35, 2.65),
                                    (-.8, 2.65), (-1.9, .55),
                                    (-1.35, .55), (-.8, .55)), start=1):
        cuboid(f"Accessory hook {index}",
               (-WIDTH/2 + .17, y, z), (.29, .035, .035), charcoal, .008)

    # Export only architectural objects, with Y-up transform for glTF.
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    output = Path(args[0]).expanduser() if args else Path.cwd() / "studio-shell.glb"
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB",
                              export_yup=True, export_apply=True)
    print(f"Exported architectural studio: {output}")

if __name__ == "__main__":
    main()
