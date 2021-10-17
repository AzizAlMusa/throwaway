import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import * as dat from "dat.gui";

import basicVertexShader from "/src/shaders/BasicShader/vertex.glsl";
import basicFragmentShader from "/src/shaders/BasicShader/fragment.glsl";
import { AdditiveBlending } from "three";

//image path
const imgPath = "/images/iguana.jpg";

/**
 * debugger
 */
const gui = new dat.GUI();
const debugObject = {};
debugObject.randomness = 1.0;

gui.add(debugObject, "randomness").min(0).max(100).step(0.1);
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
camera.position.set(0, 0, 300);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Raycasters
 */
const raycaster = new THREE.Raycaster();
const cameraDistanceRaycaster = new THREE.Raycaster();

/**
 * Mouse canvas
 */

let mouseCanvas = null;

/**
 *
 * @param {number} imgWidth image width
 * @param {number} imgHeight image height
 * @returns {HTMLElement} mouse trail canvas
 */
function createCanvas(imgWidth, imgHeight) {
  const mouseCanvas = document.createElement("canvas");
  const ctx = mouseCanvas.getContext("2d");
  document.body.appendChild(ctx.canvas);
  mouseCanvas.id = "mouse-canvas";
  ctx.canvas.width = imgWidth;
  ctx.canvas.height = imgHeight;

  ctx.fillStyle = "000000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#FF0000";
  return mouseCanvas;
}
//mouseCanvas = createCanvas(200, 200);

//Clears canvas
function resetCanvas(mouseCanvas) {
  const ctx = mouseCanvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Mouse
 */

const mouse = new THREE.Vector2({ x: null, y: null, radius: null });
let trail = [];

let capturedTexture = null; // new THREE.CanvasTexture(mouseCanvas);
//capturedTexture.needsUpdate = true;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  mouse.radius = 1.0;

  // track mouse trail
  if (mouseCanvas) updateTrail();
});

/**
 * Mouse trail
 */

/**
 * Updates mouse trail array
 */
function updateTrail() {
  raycaster.setFromCamera(mouse, camera);

  const objectsToTest = [planeMesh];
  const intersects = raycaster.intersectObjects(objectsToTest);

  //Add new point
  if (intersects.length > 0) {
    const currentPoint = intersects[0].uv;
    trail.push(currentPoint);
    currentPoint.radius = 1.0;

    const t1 = gsap.timeline();
    t1.to(currentPoint, {
      radius: 15,
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
 * Draw mouse trail on an off-screen canvas
 */
function drawTrail() {
  resetCanvas(mouseCanvas);
  const ctx = mouseCanvas.getContext("2d");
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
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
  //Need to revise creating objects on each frame
  capturedTexture = new THREE.CanvasTexture(mouseCanvas);
  //capturedTexture.needsUpdate = true;
}

//Genereal parameters of instanced geometry
const parameters = {};
parameters.color = "#ffffff";

//Globals
let geometry = null;
let material = null;
let mesh = null;
let planeMesh = null;

//Load the image as texture
textureLoader.load(imgPath, createParticleImage);

/**
 * Adjusts camera distance to image to fit the screen
 * @param {number} width
 * @param {number} height
 */
function adjustCameraZoom(width, height) {
  const fov = (camera.fov * Math.PI) / 180;
  let cameraZ = camera.position.z;

  //check which side is larger vertical or horizontal
  cameraZ = Math.abs(height / 2 / Math.tan(fov / 2));
  /*
  if (height >= width) cameraZ = Math.abs(height / 2 / Math.tan(fov / 2));
  else cameraZ = Math.abs(width / 2 / Math.tan((fov * camera.aspect) / 2));
*/
  camera.position.z = cameraZ;
}

/**
 * Function to create the plane for the mouse raycaster over the image
 * @param {number} width
 * @param {number} height
 * @returns {THREE.Mesh}
 */
function createRaycasterPlane(width, height) {
  //Raycaster plane
  //Base geometry
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: true,
  });
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.scale.set(width, height, 1);
  planeMesh.visible = false; //Set to true if for debugging
  scene.add(planeMesh);

  planeMesh.position.z = 0;
  return planeMesh;
}

/**
 * Function to create base geometry used for the instanced buffer geometry
 * @returns {THREE.InstancedBufferGeometry}
 */
function createInstancedGeometry() {
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

  return geometry;
}

/**
 * Function to set the instanced attributes of a instanced buffer geometry object
 * @param {number} width - image width in pixels
 * @param {THREE.InstancedBufferGeometry} geometry
 */
function setInstancedAttributes(width, geometry) {
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count);
  const offset = new Float32Array(parameters.count * 3);
  const pindex = new Uint16Array(parameters.count);

  for (let i = 0; i < parameters.count; i++) {
    offset[3 * i + 0] = i % width;
    offset[3 * i + 1] = Math.floor(i / width);

    offset[3 * i + 2] = 0;

    colors[3 * i + 0] = new THREE.Color(parameters.color);
    colors[3 * i + 1] = new THREE.Color(parameters.color);
    colors[3 * i + 2] = new THREE.Color(parameters.color);

    scales[i] = Math.random();

    pindex[i] = i;
  }

  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 3, false));
  geometry.setAttribute("aPindex", new THREE.InstancedBufferAttribute(pindex, 1, false));
}

/**
 * Creates the image from instanced buffer geometries
 * @param {THREE.Texture} texture - Texture passed from loader function
 */
function createParticleImage(texture) {
  geometry = createInstancedGeometry();

  const width = texture.image.width;
  const height = texture.image.height;

  parameters.count = width * height;

  setInstancedAttributes(width, geometry);
  planeMesh = createRaycasterPlane(width, height);
  mouseCanvas = createCanvas(width, height);

  adjustCameraZoom(width, height);

  //Material with raw shader to handle instances of the geometry
  material = new THREE.RawShaderMaterial({
    vertexShader: basicVertexShader,
    fragmentShader: basicFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture },
      uTextureSize: {
        value: new THREE.Vector2(width, height),
      },
      uRandomness: { value: 1.5 },
      uCanvas: { value: 0 },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    //blending: AdditiveBlending,
  });

  //Main mesh of instanced buffer geometry to represent image
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //on load animation
  gsap.fromTo(
    material.uniforms.uRandomness,
    { value: 50 },
    {
      value: 1,
      duration: 1.0,
      ease: "sine.out",
    }
  );
}

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
 * main tick loop
 */

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;

  //Trail update

  if (mouseCanvas) drawTrail();

  //Update shader uniforms
  if (material) {
    material.uniforms.uTime.value = elapsedTime;
    material.uniforms.uCanvas.value = capturedTexture;
    //material.uniforms.uRandomness.value = debugObject.randomness;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
