console.log("Main.js loaded");

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Glass bowl (transparent)
const bowlGeometry = new THREE.SphereGeometry(2.2, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
const bowlMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x222222,
  metalness: 0.3,
  roughness: 0,
  transmission: 1,
  opacity: 0.3,
  transparent: true,
  side: THREE.DoubleSide
});
const glassBowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
scene.add(glassBowl);

// Colorful balls inside the bowl
const balls = [];
const ballBodies = [];

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

const ballMaterial = new CANNON.Material();
const groundMaterial = new CANNON.Material();
const contact = new CANNON.ContactMaterial(ballMaterial, groundMaterial, {
  friction: 0.01,
  restitution: 0.8
});
world.addContactMaterial(contact);

// Invisible ground
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  material: groundMaterial
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Create balls
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
for (let i = 0; i < 20; i++) {
  const color = colors[i % colors.length];
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color })
  );
  scene.add(sphere);
  balls.push(sphere);

  const sphereBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.2),
    position: new CANNON.Vec3(
      (Math.random() - 0.5) * 1.5,
      Math.random() * 1 + 0.5,
      (Math.random() - 0.5) * 1.5
    ),
    material: ballMaterial
  });
  world.addBody(sphereBody);
  ballBodies.push(sphereBody);
}

// Animate everything
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  for (let i = 0; i < balls.length; i++) {
    balls[i].position.copy(ballBodies[i].position);
    balls[i].quaternion.copy(ballBodies[i].quaternion);
  }

  renderer.render(scene, camera);
}
animate();

// Spin Button
document.getElementById("spinBtn").addEventListener("click", () => {
  const luckyIndex = Math.floor(Math.random() * balls.length);
  const luckyBall = ballBodies[luckyIndex];

  luckyBall.velocity.set(0, 8, 0);

  document.getElementById("tapText").style.display = "block";

  setTimeout(() => {
    document.getElementById("resultText").style.display = "block";
    document.getElementById("resultText").innerText =
      Math.random() > 0.5 ? "🎉 You're Lucky!" : "😢 Better Luck Next Time";
  }, 3000);
});
