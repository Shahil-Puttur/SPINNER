console.log("Main.js loaded");

if (typeof THREE === "undefined") {
  alert("❌ THREE.js not loaded!");
}
if (typeof CANNON === "undefined") {
  alert("❌ Cannon-es not loaded!");
}

// ✅ Setup Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// ✅ Add Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// ✅ Create Ball Mesh
const geometry = new THREE.SphereGeometry(0.5, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xff007f });
const ball = new THREE.Mesh(geometry, material);
scene.add(ball);

// ✅ Setup Cannon Physics
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

const ballBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(0.5),
  position: new CANNON.Vec3(0, 1, 0)
});
world.addBody(ballBody);

// Ground (invisible floor)
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// ✅ Animate
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  ball.position.copy(ballBody.position);
  ball.quaternion.copy(ballBody.quaternion);

  renderer.render(scene, camera);
}
animate();

// ✅ Spin Button Logic
document.getElementById("spinBtn").addEventListener("click", () => {
  // Apply spin + jump
  ballBody.velocity.set(
    (Math.random() - 0.5) * 5,
    Math.random() * 5 + 5,
    (Math.random() - 0.5) * 5
  );

  document.getElementById("tapText").style.display = "block";

  setTimeout(() => {
    document.getElementById("resultText").style.display = "block";
    document.getElementById("resultText").innerText =
      Math.random() > 0.5 ? "🎉 You're Lucky!" : "😢 Better Luck Next Time";
  }, 3000);
});
