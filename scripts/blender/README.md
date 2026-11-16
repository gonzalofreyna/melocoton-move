# Estudio 3D híbrido — Blender pipeline

This is the first **non-destructive** step toward the hybrid studio. The current
Three.js room and commerce UI are intentionally untouched.

## Generate the architectural GLB

With Blender 4.x/5.x installed:

```bash
blender --background --python scripts/blender/generate_studio.py -- /tmp/studio-shell.glb
```

The script produces a 6.4 × 5.6 × 3.1 m cutaway room with three mirrors,
an accessory wall, five shelves and six wall hooks. The front wall is absent
for design mode. These are provisional architectural dimensions.

## Integration plan

1. Visually inspect the generated GLB in Blender and confirm dimensions and
   coordinate axes against `components/studio/room.ts`.
2. Optimize the mesh and materials, then place the approved GLB in public
   assets (or S3/CDN).
3. Add a GLTFLoader-based architectural renderer behind a feature flag,
   retaining the existing room as fallback.
4. Implement separate design and walkthrough camera controllers; in walkthrough
   mode show enclosing walls and enforce collision/bounds.
5. Profile mobile FPS, GPU memory and download size before enabling by default.

## Important

The Blender shell is not yet integrated into the Next.js scene. This commit
does not change storefront behaviour, pricing, product selection or WhatsApp.
