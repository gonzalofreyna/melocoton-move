import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Product } from '../../lib/fetchProducts';
import { accessoryKind, displaySize, type StudioItem } from '../../lib/studio/catalog';

type Props = { items: StudioItem[]; products: Product[]; selectedId: string | null; onSelect: (id: string) => void; view: 'perspective' | 'top'; reset: number };
function dispose(root: THREE.Object3D) {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose());
  });
}
export default function StudioScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const sceneState = useRef<{ scene: THREE.Scene; products: THREE.Group; camera: THREE.PerspectiveCamera; controls: OrbitControls; render: () => void } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Vista 3D del estudio. Usa los controles inferiores para colocar los accesorios.');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#eee8e1');
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 40);
    camera.position.set(3.4, 3.3, 4.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .1, 0); controls.minDistance = 1; controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 - .04; controls.enablePan = false;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9bbaa', 2.5));
    const sun = new THREE.DirectionalLight('#fff4e7', 3);
    sun.position.set(1, 5, 3); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
    sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3; sun.shadow.bias = -.001;
    scene.add(sun);
    const room = new THREE.Group(); scene.add(room);
    function box(w: number, h: number, d: number, x: number, y: number, z: number, color: string) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .9 }));
      mesh.position.set(x, y, z); mesh.receiveShadow = true; room.add(mesh); return mesh;
    }
    box(3.3, .1, 3.3, 0, -.05, 0, '#d4bda4');
    for (let i = 0; i < 11; i++) box(.006, .001, 3.3, -1.5 + i * .3, .001, 0, '#bca48b');
    box(3.3, 1.25, .06, 0, .625, -1.65, '#faf6ef');
    box(.06, 1.25, 3.3, -1.65, .625, 0, '#e7ded1');
    box(1.7, .8, .025, 0, .75, -1.61, '#b6b8b1');
    box(1.76, .035, .045, 0, 1.16, -1.59, '#c1a180');
    box(1.76, .035, .045, 0, .34, -1.59, '#c1a180');
    const products = new THREE.Group(); scene.add(products);
    sceneState.current = { scene, camera, controls, products, render };
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); controls.update(); resize();
    const ray = new THREE.Raycaster(); let down = { x: 0, y: 0 };
    const pointerDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = ray.intersectObjects(products.children, true).find(h => h.object.userData.itemId);
      if (hit) latest.current.onSelect(hit.object.userData.itemId);
    };
    const lost = (e: Event) => { e.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      observer.disconnect(); controls.dispose(); sceneState.current = null;
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      dispose(scene); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    dispose(state.products); state.products.clear();
    props.items.forEach(item => {
      const product = props.products.find(p => p.slug === item.slug); if (!product) return;
      const group = new THREE.Group(); group.position.set(item.x, 0, item.z); group.rotation.y = item.rotation;
      const kind = accessoryKind(product);
      // Accessories rest above the mat surface when positioned over a mat.
      if (kind !== 'mat') {
        for (const other of props.items) {
          const mat = props.products.find(p => p.slug === other.slug);
          if (!mat || accessoryKind(mat) !== 'mat') continue;
          const [w, h, l] = displaySize(mat), dx = item.x - other.x, dz = item.z - other.z;
          const x = dx * Math.cos(other.rotation) - dz * Math.sin(other.rotation);
          const z = dx * Math.sin(other.rotation) + dz * Math.cos(other.rotation);
          if (Math.abs(x) <= w / 2 && Math.abs(z) <= l / 2) group.position.y = Math.max(group.position.y, h + .006);
        }
      }
      const material = new THREE.MeshStandardMaterial({ color: /^#[0-9a-f]{3,8}$/i.test(item.color) ? item.color : '#c5b6a6', roughness: .8 });
      const [width, height, length] = displaySize(product);
      function add(geometry: THREE.BufferGeometry, y: number, x = 0, z = 0) {
        const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.itemId = item.id; group.add(mesh); return mesh;
      }
      if (kind === 'block') add(new RoundedBoxGeometry(.225, .075, .145, 3, .012), .038);
      if (kind === 'ball') add(new THREE.SphereGeometry(.1, 32, 20), .1);
      if (kind === 'ring') {
        const ring = add(new THREE.TorusGeometry(.15, .01, 12, 64), .025); ring.rotation.x = Math.PI / 2;
        add(new RoundedBoxGeometry(.07, .045, .04, 3, .008), .026, -.15);
        add(new RoundedBoxGeometry(.07, .045, .04, 3, .008), .026, .15);
      }
      if (kind === 'mat') add(new RoundedBoxGeometry(width, height, length, 3, Math.min(height / 3, .002)), height / 2 + .003);
      if (kind === 'dumbbells') {
        const heavy = /2[.-]5kg/.test(product.slug);
        for (const x of [-.09, .09]) {
          const capsule = add(new THREE.CapsuleGeometry(heavy ? .0275 : .0225, heavy ? .125 : .115, 6, 16), .03, x);
          capsule.rotation.x = Math.PI / 2;
        }
      }
      if (kind === 'ankleWeights') {
        for (const z of [-.07, .07]) {
          const strap = add(new RoundedBoxGeometry(.31, .012, .08, 2, .004), .01, 0, z);
          strap.material = new THREE.MeshStandardMaterial({ color: '#303030', roughness: 1 });
          for (let n = 0; n < 6; n++) add(new RoundedBoxGeometry(.038, .035, .075, 3, .008), .027, (n - 2.5) * .043, z);
        }
      }
      if (kind === 'bar') {
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-.57, 0, 0), new THREE.Vector3(-.38, 0, 0),
          new THREE.Vector3(-.2, 0, .07), new THREE.Vector3(0, 0, -.07),
          new THREE.Vector3(.2, 0, .07), new THREE.Vector3(.38, 0, 0), new THREE.Vector3(.57, 0, 0),
        ]);
        add(new THREE.TubeGeometry(path, 48, .025, 12, false), .026);
        for (const x of [-.57, .57]) add(new THREE.SphereGeometry(.025, 16, 12), .026, x);
      }
      if (kind === 'triangle') {
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, -.095), new THREE.Vector3(.09, 0, .075), new THREE.Vector3(-.09, 0, .075),
        ], true, 'centripetal');
        add(new THREE.TubeGeometry(path, 48, .022, 12, true), .023);
      }
      if (kind === 'generic') add(new RoundedBoxGeometry(width, height, length, 3, .015), height / 2);
      if (item.id === props.selectedId) {
        const outline = new THREE.Mesh(new THREE.RingGeometry(.5, .515, 48), new THREE.MeshBasicMaterial({ color: '#8b5c50', side: THREE.DoubleSide }));
        outline.rotation.x = -Math.PI / 2; outline.position.y = .002; outline.scale.set(width + .1, length + .1, 1); group.add(outline);
      }
      state.products.add(group);
    });
    state.render();
  }, [props.items, props.products, props.selectedId]);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    state.camera.position.set(...(props.view === 'top' ? [0, 5.8, .01] : [3.4, 3.3, 4.2]) as [number, number, number]);
    state.controls.target.set(0, .1, 0); state.controls.update(); state.render();
  }, [props.view, props.reset]);
  return <div className="relative h-[360px] sm:h-[520px] lg:h-[600px] overflow-hidden rounded-2xl" style={{ touchAction: 'none' }}>
    <div ref={host} className="h-full w-full" />
    {failed && <div role="alert" className="absolute inset-0 grid place-content-center bg-brand-sand p-8 text-center">No fue posible mostrar la vista 3D en este dispositivo. Puedes seguir seleccionando accesorios en el catálogo.</div>}
  </div>;
}
