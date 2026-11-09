import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createRoom() {
  const room = new THREE.Group();
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#b99976', roughness: .78 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#eee8dd', roughness: .95 });
  const wood = new THREE.MeshStandardMaterial({ color: '#b08b60', roughness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: '#4d4338', roughness: .65 });
  const glow = new THREE.MeshBasicMaterial({ color: '#ffe4a6' });
  function box(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.castShadow = true; room.add(mesh); return mesh;
  }
  function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 16), material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    mesh.castShadow = true; room.add(mesh);
  }
  box(6.4, .1, 5.6, 0, -.05, 0, floorMaterial);
  const seam = new THREE.MeshStandardMaterial({ color: '#736451', transparent: true, opacity: .2 });
  for (let i = 0; i < 22; i++) {
    const x = -3.15 + i * .3;
    box(.006, .002, 5.6, x, .001, 0, seam);
    for (let j = 0; j < 4; j++) box(.3, .002, .006, x + .15, .001, -2.5 + j * 1.5 + (i % 2) * .65, seam);
  }
  box(6.4, 3.1, .08, 0, 1.55, -2.8, wallMaterial);
  box(.08, 3.1, 5.6, -3.2, 1.55, 0, wallMaterial);
  box(6.4, .12, .08, 0, .06, -2.73, wood);
  box(.08, .12, 5.6, -3.13, .06, 0, wood);
  // One reflection render shared by three framed panels keeps the scene light.
  const mirror = new Reflector(new THREE.PlaneGeometry(3.35, 2.45), { color: '#d2d5d1', textureWidth: 512, textureHeight: 512, clipBias: .003 });
  mirror.position.set(-1.35, 1.55, -2.74); room.add(mirror);
  for (const x of [-3.05, -1.92, -.79, .35]) {
    box(.035, 2.55, .055, x, 1.55, -2.68, wood);
    box(.012, 2.45, .015, x + .03, 1.55, -2.66, glow);
  }
  for (const y of [.29, 2.8]) {
    box(3.45, .035, .06, -1.35, y, -2.68, wood);
    box(3.35, .015, .025, -1.35, y + .03, -2.66, glow);
  }
  rod(new THREE.Vector3(-3, 1.05, -2.4), new THREE.Vector3(.3, 1.05, -2.4), .035, wood);
  for (const x of [-2.7, -.05]) rod(new THREE.Vector3(x, 1.05, -2.72), new THREE.Vector3(x, 1.05, -2.4), .018, dark);
  // Warm recessed shelving, with dedicated surfaces for each product family.
  box(2.65, 2.9, .035, 1.62, 1.5, -2.74, new THREE.MeshStandardMaterial({ color: '#ded4c4', roughness: 1 }));
  for (const y of [.8, 1.25, 1.7, 2.15, 2.6]) {
    box(2.75, .04, .5, 1.62, y, -2.48, wood);
    box(2.55, .012, .015, 1.62, y - .026, -2.25, glow);
  }
  // Basket sits below the rings against the left wall, in the aisle
  // between mat rows; keep the basket and its balls in the same coordinate frame.
  const basketX = -2.58;
  const basketZ = 0;
  const basketMaterial = new THREE.MeshStandardMaterial({ color: '#ae9777', roughness: 1 });
  const basket = new THREE.Mesh(new RoundedBoxGeometry(.98, .04, .62, 3, .02), basketMaterial);
  basket.position.set(basketX, .02, basketZ); room.add(basket);
  for (let level = 0; level < 10; level++) {
    const y = .04 + level * .029;
    box(.98, .02, .025, basketX, y, basketZ - .3, basketMaterial);
    box(.98, .02, .025, basketX, y, basketZ + .3, basketMaterial);
    box(.025, .02, .62, basketX - .48, y, basketZ, basketMaterial);
    box(.025, .02, .62, basketX + .48, y, basketZ, basketMaterial);
  }
  for (let i = 0; i < 17; i++) box(.012, .3, .025, basketX - .46 + i * .057, .16, basketZ + .31, wood);
  // Left-wall racks for rings and weighted bars.
  for (const y of [.25, 1.1, 1.65]) box(.07, .055, 2.6, -3.1, y, -.7, wood);
  for (const y of [1.65, 2.2]) {
    for (let i = 0; i < 6; i++) rod(new THREE.Vector3(-3.12, y, -1.85 + i * .43), new THREE.Vector3(-2.95, y, -1.85 + i * .43), .012, dark);
  }
  // Small plant on the top shelf.
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .22, 20), new THREE.MeshStandardMaterial({ color: '#c3b39f' }));
  pot.position.set(2.7, 2.73, -2.45); room.add(pot);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? '#65745a' : '#7b8769' }));
    leaf.scale.set(.6, 1.5, .4); leaf.position.set(2.7 + Math.sin(i * 2) * .13, 2.9 + (i % 3) * .05, -2.45 + Math.cos(i * 2) * .1); leaf.rotation.z = Math.sin(i) * .7; room.add(leaf);
  }
  return { room, floorMaterial, wallMaterial, mirror };
}
