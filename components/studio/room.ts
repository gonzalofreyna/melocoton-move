import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Three stations face the back-wall mirrors. The LEFT wall is devoted entirely
// to accessories: rings at the far end, shelves beside them, basket underneath.
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

  // A single reflector is split by wooden dividers into three *aligned*
  // mirror bays. One reflection pass is much cheaper on mobile than three.
  const mirror = new Reflector(new THREE.PlaneGeometry(6.05, 2.45), {
    color: '#d2d5d1', textureWidth: 512, textureHeight: 512, clipBias: .003,
  });
  mirror.position.set(0, 1.55, -2.735);
  room.add(mirror);
  for (const x of [-3.1, -1.03, 1.03, 3.1]) {
    box(.055, 2.53, .075, x, 1.55, -2.67, wood);
    box(.014, 2.39, .016, x + .04, 1.55, -2.61, glow);
  }
  for (const y of [.29, 2.81]) box(6.27, .06, .075, 0, y, -2.67, wood);

  // Rings and bars hang on the rear section of the ACCESSORY wall.
  // The shelf section starts farther toward the front, beside the hooks.
  for (const y of [.86, 1.43, 2.02, 2.61]) {
    for (let i = 0; i < 3; i++) {
      const z = -2.18 + i * .49;
      rod(new THREE.Vector3(-3.1, y, z), new THREE.Vector3(-2.88, y, z), .013, dark);
    }
  }
  for (const z of [-2.20, -1.65, -1.10]) {
    rod(new THREE.Vector3(-3.13, .39, z), new THREE.Vector3(-2.85, .39, z), .018, dark);
    rod(new THREE.Vector3(-3.13, .57, z), new THREE.Vector3(-2.85, .57, z), .018, dark);
  }

  // Side-facing shelves. Each shelf supports three displayed copies, never
  // standing in front of a mirror or over the mat closest to the wall.
  box(.065, 2.2, 2.45, -3.06, 1.75, 1.32,
    new THREE.MeshStandardMaterial({ color: '#ded4c4', roughness: 1 }));
  for (const y of [.78, 1.21, 1.64, 2.07, 2.50]) {
    box(.54, .04, 2.4, -2.82, y, 1.32, wood);
    box(.018, .013, 2.28, -2.54, y - .027, 1.32, glow);
  }

  // Low basket directly BELOW the shelves, not under the ring hooks or on a mat.
  const basketX = -2.79, basketZ = 1.28;
  const basketMaterial = new THREE.MeshStandardMaterial({ color: '#ae9777', roughness: 1 });
  const basket = new THREE.Mesh(new RoundedBoxGeometry(.58, .04, 1.76, 3, .02), basketMaterial);
  basket.position.set(basketX, .02, basketZ); room.add(basket);
  for (let level = 0; level < 10; level++) {
    const y = .04 + level * .029;
    box(.58, .02, .025, basketX, y, basketZ - .86, basketMaterial);
    box(.58, .02, .025, basketX, y, basketZ + .86, basketMaterial);
    box(.025, .02, 1.76, basketX - .27, y, basketZ, basketMaterial);
    box(.025, .02, 1.76, basketX + .27, y, basketZ, basketMaterial);
  }
  for (let i = 0; i < 16; i++) {
    box(.012, .28, .025, basketX + .29, .16, basketZ - .81 + i * .108, wood);
  }
  return { room, floorMaterial, wallMaterial, mirror };
}
