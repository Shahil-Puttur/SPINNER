window.onload = function() {
  console.log("DOM loaded, starting Three.js + Cannon-es");

  // 1. Basic Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 4, 6);        // Pull back and up
  camera.lookAt(0, 0, 0);              // Look at bowl center

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // 2. Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const point = new THREE.PointLight(0xffffff, 1);
  point.position.set(5, 5, 5);
  scene.add(point);

  // 3. Add a simple grid helper (for orientation)
  const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
  grid.rotation.x = Math.PI / 2; // lay flat
  scene.add(grid);

  // 4. Create transparent glass bowl
  const bowlGeo = new THREE.SphereGeometry(2, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
  const bowlMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0,
    transmission: 1,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.3
  });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  scene.add(bowl);

  // 5. Physics world
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  // Invisible ground under bowl so balls stay inside
  const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI/2, 0, 0);
  world.addBody(ground);

  // 6. Create balls and physics bodies
  const ballMeshes = [];
  const ballBodies = [];
  const colors = [0xff004f, 0x00f2ff, 0x39ff14, 0xffff00, 0xff9900, 0xff33cc];
  for (let i = 0; i < 20; i++) {
    // Three.js mesh
    const color = colors[i % colors.length];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshStandardMaterial({ color })
    );
    scene.add(mesh);
    ballMeshes.push(mesh);

    // Cannon-es body
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.2),
      position: new CANNON.Vec3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1 + 0.5,
        (Math.random() - 0.5) * 2
      )
    });
    world.addBody(body);
    ballBodies.push(body);
  }

  // 7. Animation loop
  function animate() {
    requestAnimationFrame(animate);
    world.step(1/60);
    // Sync meshes to physics
    for (let i = 0; i < ballMeshes.length; i++) {
      ballMeshes[i].position.copy(ballBodies[i].position);
      ballMeshes[i].quaternion.copy(ballBodies[i].quaternion);
    }
    renderer.render(scene, camera);
  }
  animate();

  // 8. Spin button logic
  document.getElementById("spinBtn").onclick = () => {
    const idx = Math.floor(Math.random() * ballBodies.length);
    const body = ballBodies[idx];
    // Knock it out upward
    body.velocity.set(0, 5, 0);

    document.getElementById("tapText").style.display = "block";

    setTimeout(() => {
      const lucky = Math.random() > 0.5;
      document.getElementById("resultText").innerText = 
        lucky ? "🎉 You're Lucky!" : "😢 Better Luck Next Time";
      document.getElementById("resultText").style.display = "block";
    }, 3000);
  };
};
