import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import * as dat from "dat.gui";

import basicVertexShader from "/src/shaders/BasicShader/vertex.glsl";
import basicFragmentShader from "/src/shaders/BasicShader/fragment.glsl";
import { TriangleFanDrawMode } from "three";
import mainImage from "/static/images/shahad.jpg";

const img = new Image();
img.src = mainImage;
const imgWidth = img.width;
const imgHeight = img.height;

/**
 * debugger
 */
const gui = new dat.GUI();
const debugObject = {};

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0);

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader();

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 10000);
camera.position.set(0.0, 0.0, 150);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

/**
 * Mouse canvas
 */
const mouseCanvas = document.createElement("canvas");
const ctx = mouseCanvas.getContext("2d");
document.body.appendChild(ctx.canvas);
mouseCanvas.id = "mouse-canvas";
ctx.canvas.width = imgWidth;
ctx.canvas.height = imgHeight;

const canvasWidth = ctx.canvas.width;
const canvasHeight = ctx.canvas.height;
console.log(canvasWidth);
ctx.fillStyle = "000000";
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
ctx.fillStyle = "#FF0000";

//Clears canvas
function resetCanvas() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Mouse
 */

const mouse = new THREE.Vector2({ x: null, y: null, radius: null });
let trail = [];

let capturedTexture = new THREE.CanvasTexture(mouseCanvas);
capturedTexture.needsUpdate = true;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  mouse.radius = 1.0;

  // track mouse trail
  updateTrail();
});

/**
 * Mouse trail
 */
//Update trail array
function updateTrail() {
  raycaster.setFromCamera(mouse, camera);

  const objectsToTest = [planeMesh];
  const intersects = raycaster.intersectObjects(objectsToTest);

  //Remove last point
  if (trail[0]) {
    const previousPoint = 0;
  }
  //Add new point
  if (intersects.length > 0) {
    const currentPoint = intersects[0].uv;
    trail.push(currentPoint);
    currentPoint.radius = 1.0;

    const t1 = gsap.timeline();
    t1.to(currentPoint, {
      radius: 30,
      duration: 1,
      ease: "sine.out",
    }).to(currentPoint, {
      radius: 0,
      duration: 1,
      ease: "sine.out",
      onComplete: () => {
        trail.shift();
      },
    });
  }
}

/**
 * Draw trail
 */
function drawTrail() {
  resetCanvas();
  trail.forEach((point, i) => {
    const x = point.x * canvasWidth;
    const y = canvasHeight - point.y * canvasHeight;
    const radius = point.radius;

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(x, y, point.radius / 2, x, y, point.radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  });

  //This update is key to capture changes in canvas
  capturedTexture.needsUpdate = true;
}

/**
 * Geometry
 */
const parameters = {};

parameters.color = "#ffffff";
//Base geometry
const mousePlane = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

const geometry = new THREE.InstancedBufferGeometry();
// positions
const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
positions.setXYZ(0, -0.5, 0.5, 0.0);
positions.setXYZ(1, 0.5, 0.5, 0.0);
positions.setXYZ(2, -0.5, -0.5, 0.0);
positions.setXYZ(3, 0.5, -0.5, 0.0);
geometry.setAttribute("position", positions);

// uvs
const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
uvs.setXYZ(0, 0.0, 0.0);
uvs.setXYZ(1, 1.0, 0.0);
uvs.setXYZ(2, 0.0, 1.0);
uvs.setXYZ(3, 1.0, 1.0);
geometry.setAttribute("uv", uvs);

// index
geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));

let mesh;
let colors;
let scales;
let offset;
let pindex;

let material;

let imageWidth;
let imageHeight;
const imageScale = 1;
const animalTexture = textureLoader.load("/images/shahad.jpg", (texture) => {
  const width = texture.image.width;
  const height = texture.image.height;

  imageWidth = width;
  imageHeight = height;

  parameters.count = width * height;

  colors = new Float32Array(parameters.count * 3);
  scales = new Float32Array(parameters.count);
  offset = new Float32Array(parameters.count * 3);
  pindex = new Uint16Array(parameters.count);

  for (let i = 0; i < parameters.count; i++) {
    offset[3 * i + 0] = (i % width) * imageScale;
    offset[3 * i + 1] = Math.floor(i / width) * imageScale;

    offset[3 * i + 2] = 0;

    colors[3 * i + 0] = new THREE.Color(parameters.color);
    colors[3 * i + 1] = new THREE.Color(parameters.color);
    colors[3 * i + 2] = new THREE.Color(parameters.color);

    scales[i] = Math.random();

    pindex[i] = i;
  }

  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 3, false));
  geometry.setAttribute("aPindex", new THREE.InstancedBufferAttribute(pindex, 1, false));
});

/**
 * Material
 */
material = new THREE.RawShaderMaterial({
  vertexShader: basicVertexShader,
  fragmentShader: basicFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uTexture: { value: animalTexture },
    uTextureSize: {
      value: new THREE.Vector2(imgWidth * imageScale, imgHeight * imageScale),
    },
    uRandomness: { value: 0 },
    //uMouse: { value: new THREE.Vector2(0, 0) },
    uCanvas: { value: 0 },
    //blending: THREE.AdditiveBlending,
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
});

/**
 * Mesh
 */
mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//Debugging plane
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
});
const planeMesh = new THREE.Mesh(mousePlane, planeMaterial);
planeMesh.scale.set(imgWidth, imgHeight, 1);
scene.add(planeMesh);

planeMesh.position.z = 0;
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

/**
 * gsap animations
 */

gsap.fromTo(
  material.uniforms.uRandomness,
  { value: 200 },
  {
    value: 1,
    duration: 1.5,
    ease: "expo.out",
  }
);

/**
 * main tick loop
 */

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;

  //Trail update
  drawTrail();

  //Update shader uniforms
  material.uniforms.uTime.value = elapsedTime;
  material.uniforms.uCanvas.value = capturedTexture;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
