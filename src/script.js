import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import basicVertexShader from "/src/shaders/BasicShader/vertex.glsl";
import basicFragmentShader from "/src/shaders/BasicShader/fragment.glsl";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = 0xffffff;

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("/images/parrot.jpg");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0.0, 0.0, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Geometry
 */
const parameters = {};

//Base geometry
const plane = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

//instance geometry
const geometry = new THREE.InstancedBufferGeometry();
geometry.index = plane.index;
geometry.attributes.position = plane.attributes.position;

/**
 * Material
 */
const material = new THREE.ShaderMaterial({
  vertexShader: basicVertexShader,
  fragmentShader: basicFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uTexture: { value: texture },
  },
  side: THREE.DoubleSide,
});

const img = material.uniforms.uTexture.value.image;
console.log(img);
parameters.count = img.width * img.height;

const offsets = new Float32Array(parameters.count * 3);

for (let i = 0; i < parameters.count; i++) {
  offsets[3 * i + 0] = (Math.random() - 0.5) * 2.0;
  offsets[3 * i + 1] = (Math.random() - 0.5) * 2.0;
  offsets[3 * i + 2] = (Math.random() - 0.5) * 2.0;
}

geometry.setAttribute(
  "aOffsets",
  new THREE.InstancedBufferAttribute(offsets, 3)
);

/**
 * Mesh
 */
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

/**
 * Test material
 */
const imagePlane = new THREE.PlaneGeometry(1, 1, 1, 1);
const imageMaterial = new THREE.MeshBasicMaterial({
  map: texture,
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let lastElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
