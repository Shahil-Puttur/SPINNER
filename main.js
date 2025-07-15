console.log("Main.js loaded");

// ✅ Check if Three.js and Cannon are loaded
if (typeof THREE === "undefined") {
  alert("❌ THREE.js not loaded!");
} else {
  console.log("✅ Three.js loaded!");
}

if (typeof CANNON === "undefined") {
  alert("❌ Cannon-es not loaded!");
} else {
  console.log("✅ Cannon-es loaded!");
}

// ✅ Setup Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// ✅ Create a basic spinning ball
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xff0055 });
const ball = new THREE.Mesh(geometry, material);
scene.add(ball);

// ✅ Add light
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(5, 5, 5);
scene.add(light);

// ✅ Animate
function animate() {
  requestAnimationFrame(animate);
  ball.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// ✅ Button interaction
document.getElementById("spinBtn").addEventListener("click", () => {
  alert("You pressed SPIN — ball spinning now!");
  // You can trigger Cannon physics here later
});
