// ✅ Check if THREE is loaded before doing anything
if (typeof THREE === 'undefined' || typeof CANNON === 'undefined') {
  alert("Three.js or Cannon-es failed to load. Please check your script tags!");
  throw new Error("Three.js or Cannon-es not loaded.");
}

// ✅ Basic Setup
let scene, camera, renderer, world;
let balls = [], ballBodies = [];
let holeY = -5;
let spinStarted = false;

init();
animate();

document.getElementById('spinBtn').addEventListener('click', () => {
  if (spinStarted) return;
  spinStarted = true;
  document.getElementById('resultText').style.display = 'none';
  document.getElementById('tapText').style.display = 'none';
  applySpinForce();

  setTimeout(() => {
    releaseRandomBall();
  }, 3000);
});

document.getElementById('tapText').addEventListener('click', () => {
  const isLucky = Math.random() > 0.5;
  document.getElementById('resultText').textContent = isLucky
    ? "🎉 You're Lucky 🙌🏻😊"
    : "😢 Better Luck Next Time";
  document.getElementById('resultText').style.display = 'block';
  document.getElementById('tapText').style.display = 'none';
});

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // 🌍 Cannon-es physics world
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

  // 💡 Lighting
  const light = new THREE.PointLight(0xffffff, 1.2);
  light.position.set(10, 20, 10);
  scene.add(light);

  // 🧪 Create everything
  createBowl();
  createHole();
  createBalls();
}

function createBowl() {
  const bowlGeo = new THREE.SphereGeometry(5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.3,
    side: THREE.DoubleSide
  });
  const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
  bowlMesh.rotation.x = Math.PI;
  scene.add(bowlMesh);

  const bowlShape = new CANNON.Sphere(5);
  const bowlBody = new CANNON.Body({ mass: 0 });
  bowlBody.addShape(bowlShape);
  bowlBody.position.set(0, 0, 0);
  world.addBody(bowlBody);
}

function createHole() {
  const holeGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const holeMesh = new THREE.Mesh(holeGeo, holeMat);
  holeMesh.position.set(0, holeY, 0);
  scene.add(holeMesh);
}

function createBalls() {
  for (let i = 0; i < 20; i++) {
    const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 50%)`);
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const ball = new THREE.Mesh(geometry, material);
    scene.add(ball);

    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.4),
      position: new CANNON.Vec3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      )
    });
    world.addBody(body);

    balls.push(ball);
    ballBodies.push(body);
  }
}

function applySpinForce() {
  ballBodies.forEach(body => {
    body.angularVelocity.set(
      Math.random() * 5,
      Math.random() * 5,
      Math.random() * 5
    );
    body.velocity.set(
      (Math.random() - 0.5) * 3,
      Math.random() * 2,
      (Math.random() - 0.5) * 3
    );
  });
}

function releaseRandomBall() {
  const index = Math.floor(Math.random() * ballBodies.length);
  const body = ballBodies[index];
  body.applyImpulse(new CANNON.Vec3(0, -20, 0), body.position);

  setTimeout(() => {
    document.getElementById('tapText').style.display = 'block';
  }, 1000);
}

function animate() {
  requestAnimationFrame(animate);
  world.fixedStep();

  for (let i = 0; i < balls.length; i++) {
    balls[i].position.copy(ballBodies[i].position);
    balls[i].quaternion.copy(ballBodies[i].quaternion);
  }

  renderer.render(scene, camera);
    }
