import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRoom } from './room';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Product } from '../../lib/fetchProducts';
import { MAT_DIMENSIONS, type MatShape } from '../../lib/mat-config';
import { accessoryKind, displaySize, colorName, unitPrice, STATIONS, STATION_COUNT, OVERFLOW_GALLERY_START_X, OVERFLOW_GALLERY_WIDTH, type VisualItem } from '../../lib/studio/catalog';

type Props = { fill?: boolean; items: VisualItem[]; products: Product[]; mat: { shape: MatShape; color: string } | null; selectedId: string | null; onSelect: (id: string) => void; view: 'perspective' | 'top'; reset: number; floorColor: string; wallColor: string };
function dispose(root: THREE.Object3D) {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose());
  });
}

// A single chosen mat design is replicated at the three stations in front of the mirrors.
// Rounded ends use the same silhouette rules as Crea tu Mat.
function createStudioMatGeometry(shape: MatShape) {
  const { width, height: length } = MAT_DIMENSIONS[shape];
  const w = width / 100, l = length / 100, halfW = w / 2, halfL = l / 2;
  // Following rotateX(-PI/2), the +Y end faces the mirror (-Z).
  // Bala: flat end toward mirror, rounded tip pointing into the room.
  const topR = shape === 'capsula' ? halfW : .08;
  const bottomR = shape === 'clasico' ? .08 : halfW;
  const outline = new THREE.Shape();
  outline.moveTo(-halfW + bottomR, -halfL);
  outline.lineTo(halfW - bottomR, -halfL);
  outline.quadraticCurveTo(halfW, -halfL, halfW, -halfL + bottomR);
  outline.lineTo(halfW, halfL - topR);
  outline.quadraticCurveTo(halfW, halfL, halfW - topR, halfL);
  outline.lineTo(-halfW + topR, halfL);
  outline.quadraticCurveTo(-halfW, halfL, -halfW, halfL - topR);
  outline.lineTo(-halfW, -halfL + bottomR);
  outline.quadraticCurveTo(-halfW, -halfL, -halfW + bottomR, -halfL);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: .005, bevelEnabled: false, curveSegments: 16 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export default function StudioScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const sceneState = useRef<{ scene: THREE.Scene; products: THREE.Group; camera: THREE.PerspectiveCamera; controls: OrbitControls; render: () => void; floorMaterial: THREE.MeshStandardMaterial; wallMaterial: THREE.MeshStandardMaterial } | null>(null);
  const [detail, setDetail] = useState<{ sourceId: string; x: number; y: number; pinned: boolean } | null>(null);
  const pinned = useRef(false);
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
    renderer.domElement.setAttribute('aria-label', 'Vista 3D del estudio. Toca un producto para ver su ficha. Los accesorios se acomodan automáticamente.');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#eee8e1');
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 40);
    camera.position.set(6.5, 5.2, 8.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .65, -.3); controls.minDistance = 1; controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2 - .04; controls.enablePan = false;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9bbaa', 2.5));
    const sun = new THREE.DirectionalLight('#fff4e7', 3);
    sun.position.set(2, 8, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5; sun.shadow.bias = -.001;
    scene.add(sun);
    const { room, floorMaterial, wallMaterial, mirror } = createRoom();
    floorMaterial.color.set(latest.current.floorColor); wallMaterial.color.set(latest.current.wallColor);
    scene.add(room);
    const products = new THREE.Group(); scene.add(products);
    sceneState.current = { scene, camera, controls, products, render, floorMaterial, wallMaterial };
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height;
      // Fit the whole studio in narrow portrait viewports instead of cropping its sides.
      camera.zoom = latest.current.fill ? Math.max(.58, Math.min(1, camera.aspect)) : 1;
      camera.updateProjectionMatrix(); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); controls.update(); resize();
    const ray = new THREE.Raycaster(); let down = { x: 0, y: 0 };
    const pointerDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const hitAt = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
      // Include architecture so products cannot be picked through walls or shelves.
      const hit = ray.intersectObjects(scene.children, true).find(h => (h.object as THREE.Mesh).isMesh);
      if (!hit?.object.userData.itemId) return null;
      return { sourceId: hit.object.userData.itemId as string,
        x: Math.max(8, Math.min(rect.width - 240, e.clientX - rect.left + 12)),
        y: Math.max(48, Math.min(rect.height - 185, e.clientY - rect.top - 50)) };
    };
    const pointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons || pinned.current) return;
      const hit = hitAt(e); container.style.cursor = hit ? 'pointer' : 'grab';
      setDetail(hit ? { ...hit, pinned: false } : null);
    };
    const pointerLeave = () => { if (!pinned.current) setDetail(null); };
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const hit = hitAt(e); pinned.current = Boolean(hit) && !latest.current.fill;
      setDetail(hit && !latest.current.fill ? { ...hit, pinned: true } : null);
      if (hit) latest.current.onSelect(hit.sourceId);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { pinned.current = false; setDetail(null); } };
    window.addEventListener('keydown', escape);
    const lost = (e: Event) => { e.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerleave', pointerLeave);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      observer.disconnect(); controls.dispose(); sceneState.current = null;
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      window.removeEventListener('keydown', escape);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerleave', pointerLeave);
      mirror.getRenderTarget().dispose();
      dispose(scene); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    dispose(state.products); state.products.clear();
    if (props.mat) {
      const geometry = createStudioMatGeometry(props.mat.shape);
      const material = new THREE.MeshStandardMaterial({ color: props.mat.color, roughness: .86, side: THREE.DoubleSide });
      const positions = STATIONS.map(station => [station.x, station.z]);
      positions.forEach(([x, z]) => {
        const mat = new THREE.Mesh(geometry.clone(), material.clone());
        mat.position.set(x, .011, z);
        mat.receiveShadow = true;
        mat.userData.itemId = 'studio-mat';
        state.products.add(mat);
      });
      geometry.dispose(); material.dispose();
    }
    // Modular exhibition stations for every additional distinct model.
    // Models are never dropped when the original room is fully occupied.
    const overflowModels = props.items.filter(item => item.x >= OVERFLOW_GALLERY_START_X - .1);
    const galleryCount = overflowModels.length
      ? Math.max(...overflowModels.map(item => Math.floor((item.x - OVERFLOW_GALLERY_START_X + .1) / OVERFLOW_GALLERY_WIDTH))) + 1 : 0;
    for (let gallery = 0; gallery < galleryCount; gallery++) {
      const center = OVERFLOW_GALLERY_START_X + gallery * OVERFLOW_GALLERY_WIDTH + 1.45;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(4.65, .1, 3.4),
        new THREE.MeshStandardMaterial({ color: '#d6cbbd', roughness: .8 }));
      platform.position.set(center, -.05, 0); platform.receiveShadow = true;
      state.products.add(platform);
      const backdrop = new THREE.Mesh(new THREE.BoxGeometry(4.65, 2.4, .08),
        new THREE.MeshStandardMaterial({ color: '#e9e1d6', roughness: .95 }));
      backdrop.position.set(center, 1.2, -1.6); state.products.add(backdrop);
      for (let col = 0; col < STATION_COUNT; col++) {
        const pedestal = new THREE.Mesh(new RoundedBoxGeometry(1.38, .38, 1.6, 3, .07),
          new THREE.MeshStandardMaterial({ color: '#ede7df', roughness: .85 }));
        pedestal.position.set(OVERFLOW_GALLERY_START_X + gallery * OVERFLOW_GALLERY_WIDTH + col * 1.45, .19, .35);
        pedestal.castShadow = true; pedestal.receiveShadow = true;
        state.products.add(pedestal);
      }
    }
    props.items.forEach(item => {
      const product = props.products.find(p => p.slug === item.slug); if (!product) return;
      const group = new THREE.Group(); group.position.set(item.x, item.y, item.z); group.rotation.set(item.tiltX, item.rotation, item.tiltZ);
      const kind = accessoryKind(product);
      const material = new THREE.MeshStandardMaterial({ color: /^#[0-9a-f]{3,8}$/i.test(item.color) ? item.color : '#c5b6a6', roughness: .8 });
      const [width, height, length] = displaySize(product);
      function add(geometry: THREE.BufferGeometry, y: number, x = 0, z = 0) {
        const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.itemId = item.sourceId; group.add(mesh); return mesh;
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
      if (item.sourceId === props.selectedId) {
        const outline = new THREE.Mesh(new THREE.RingGeometry(.5, .515, 48), new THREE.MeshBasicMaterial({ color: '#8b5c50', side: THREE.DoubleSide }));
        outline.rotation.x = -Math.PI / 2; outline.position.y = .002; outline.scale.set(width + .1, length + .1, 1); group.add(outline);
      }
      state.products.add(group);
    });
    state.render();
  }, [props.items, props.products, props.selectedId, props.mat]);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    const farthest = props.items.reduce((max, item) => Math.max(max, item.x + .8), 3.2);
    const hasGallery = farthest > 3.5;
    const centerX = hasGallery ? (farthest - 3.2) / 2 : 0;
    const sceneWidth = farthest + 3.2;
    const aspect = Math.max(.45, state.camera.aspect);
    const distance = hasGallery
      ? Math.max(11, sceneWidth / (2 * Math.tan(38 * Math.PI / 360) * Math.min(aspect, 1.6)) * 1.12)
      : 11.6;
    if (props.view === 'top') {
      state.camera.position.set(centerX, Math.max(11.6, distance), .01);
    } else {
      state.camera.position.set(centerX + distance * .52, distance * .39, distance * .68);
    }
    state.controls.target.set(centerX, .65, -.3);
    state.controls.maxDistance = Math.max(16, distance * 2.5);
    state.controls.update(); state.render();
  }, [props.items, props.view, props.reset]);
  useEffect(() => {
    const state = sceneState.current; if (!state) return;
    state.floorMaterial.color.set(props.floorColor); state.wallMaterial.color.set(props.wallColor); state.render();
  }, [props.floorColor, props.wallColor]);
  useEffect(() => {
    if (detail && !props.items.some(i => i.sourceId === detail.sourceId) && !(detail.sourceId === 'studio-mat' && props.mat)) { pinned.current = false; setDetail(null); }
  }, [props.items, detail]);
  const matDetail = detail?.sourceId === 'studio-mat' && props.mat;
  const detailItem = detail && props.items.find(i => i.sourceId === detail.sourceId);
  const detailProduct = detailItem && props.products.find(p => p.slug === detailItem.slug);
  return <div className={props.fill ? "absolute inset-0 overflow-hidden" : "relative h-[360px] sm:h-[520px] lg:h-[600px] overflow-hidden rounded-2xl"} style={{ touchAction: 'none' }}>
    <div ref={host} className="h-full w-full" />
    {detail && detailItem && detailProduct && <div role="group" aria-label="Detalle del producto" className={`absolute z-10 w-[230px] rounded-xl border border-brand-line bg-white/95 p-3 shadow-lg ${detail.pinned ? '' : 'pointer-events-none'}`} style={{ left: detail.x, top: detail.y, touchAction: 'auto' }}>
      <div className="flex gap-2"><img src={detailProduct.image} alt="" className="h-12 w-12 rounded-lg object-contain" /><h3 className="text-xs font-semibold leading-4 flex-1">{detailProduct.name}</h3>{detail.pinned && <button aria-label="Cerrar ficha" className="h-8 w-8 shrink-0" onClick={() => { pinned.current = false; setDetail(null); }}>×</button>}</div>
      <p className="text-xs mt-2">{colorName(detailItem.color)} · {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(unitPrice(detailProduct))}</p>
      <p className="text-xs text-brand-muted mt-1 line-clamp-2">{detailProduct.materials?.slice(0, 2).join(' · ') || 'Accesorio para tu estudio'}</p>
      <p className="text-[10px] text-brand-muted mt-2">{detail.pinned ? 'Edita el color en el panel debajo de la vista.' : 'Toca para seleccionar y cambiar el color.'}</p>
    </div>}
    {detail && matDetail && <div className="absolute z-10 w-[230px] rounded-xl border border-brand-line bg-white/95 p-3 shadow-lg pointer-events-none" style={{ left: detail.x, top: detail.y }}>
      <h3 className="text-xs font-semibold">Tapete personalizado</h3>
      <p className="text-xs mt-2">Forma: {MAT_DIMENSIONS[matDetail.shape] ? ({ capsula: 'Cápsula', bala: 'Bala', clasico: 'Clásico' } as const)[matDetail.shape] : ''}</p>
      <p className="text-xs mt-1">Color: {matDetail.color}</p>
      <p className="text-[10px] text-brand-muted mt-2">Edita su forma y color en el panel de tapetes.</p>
    </div>}
    {failed && <div role="alert" className="absolute inset-0 grid place-content-center bg-brand-sand p-8 text-center">No fue posible mostrar la vista 3D en este dispositivo. Puedes seguir seleccionando accesorios en el catálogo.</div>}
  </div>;
}
