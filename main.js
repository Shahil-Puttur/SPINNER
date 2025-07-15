// Ensure script runs after the page is loaded
window.addEventListener('DOMContentLoaded', () => {

    // --- SETUP ---
    const canvas = document.getElementById('c');
    const spinButton = document.getElementById('spin-button');
    const resultOverlay = document.getElementById('result-overlay');
    const resultMessage = document.getElementById('result-message');

    // Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2a);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Controls (for debugging)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Physics World (Cannon-es)
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth's gravity
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;

    // Materials
    const ballMaterial = new CANNON.Material('ball');
    const bowlMaterial = new CANNON.Material('bowl');
    const contactMaterial = new CANNON.ContactMaterial(ballMaterial, bowlMaterial, {
        friction: 0.1,
        restitution: 0.4,
    });
    world.addContactMaterial(contactMaterial);

    let balls = [];
    let gameState = 'IDLE'; // IDLE, SPINNING, RESULT
    let luckyBall = null;

    // --- OBJECTS ---

    // Create the visual glass bowl
    const bowlRadius = 6;
    const bowlHeight = 3;
    const bowlGeometry = new THREE.TorusGeometry(bowlRadius, 1, 16, 100);
    const bowlMaterial3D = new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0,
        transmission: 0.9,
        ior: 1.5,
        thickness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
    });
    const bowlMesh = new THREE.Mesh(bowlGeometry, bowlMaterial3D);
    bowlMesh.rotation.x = -Math.PI / 2;
    bowlMesh.position.y = bowlHeight - 1;
    scene.add(bowlMesh);

    // Create the invisible physics bowl (container)
    function createPhysicsBowl() {
        const segments = 24;
        const segmentAngle = (Math.PI * 2) / segments;
        for (let i = 0; i < segments; i++) {
            const angle = i * segmentAngle;
            const x = Math.cos(angle) * bowlRadius;
            const z = Math.sin(angle) * bowlRadius;

            const wallBody = new CANNON.Body({ mass: 0, material: bowlMaterial });
            wallBody.addShape(new CANNON.Plane());
            wallBody.position.set(x, bowlHeight / 2, z);
            wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle + Math.PI);
            world.addBody(wallBody);
        }

        // Bottom plane
        const floorBody = new CANNON.Body({ mass: 0, material: bowlMaterial });
        floorBody.addShape(new CANNON.Plane());
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(floorBody);

        // The "exit hole" is a sloped plane
        const exitRamp = new CANNON.Body({ mass: 0, material: bowlMaterial });
        exitRamp.addShape(new CANNON.Plane());
        exitRamp.position.set(0, -2, bowlRadius + 2);
        exitRamp.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 6);
        world.addBody(exitRamp);
    }
    createPhysicsBowl();


    // Create Balls
    function createBalls() {
        const ballCount = 25;
        const ballRadius = 0.5;
        const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);

        for (let i = 0; i < ballCount; i++) {
            const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 75%)`);
            const ballMesh = new THREE.Mesh(ballGeometry, new THREE.MeshStandardMaterial({ 
                color,
                roughness: 0.2,
                metalness: 0.1,
             }));
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            scene.add(ballMesh);

            const ballShape = new CANNON.Sphere(ballRadius);
            const ballBody = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(
                    (Math.random() - 0.5) * (bowlRadius - 2),
                    Math.random() * 5 + bowlHeight,
                    (Math.random() - 0.5) * (bowlRadius - 2)
                ),
                shape: ballShape,
                material: ballMaterial,
            });
            world.addBody(ballBody);

            balls.push({ mesh: ballMesh, body: ballBody });
        }
    }
    createBalls();

    // The central spinner (invisible physics object)
    const spinnerBody = new CANNON.Body({ mass: 0 });
    spinnerBody.addShape(new CANNON.Sphere(0.1));
    spinnerBody.position.y = 1;
    world.addBody(spinnerBody);


    // --- GAME LOGIC ---

    spinButton.addEventListener('click', () => {
        if (gameState !== 'IDLE') return;
        gameState = 'SPINNING';
        spinButton.disabled = true;
        spinButton.textContent = 'SPINNING...';

        // Apply a strong rotational force for a few seconds
        spinnerBody.angularVelocity.set(0, 50, 0);

        setTimeout(() => {
            spinnerBody.angularVelocity.set(0, 0, 0); // Stop the spinner

            // After 3 seconds, pick a lucky ball and eject it
            setTimeout(() => {
                const luckyIndex = Math.floor(Math.random() * balls.length);
                luckyBall = balls[luckyIndex];
                
                // Give it a push towards the exit
                const force = new CANNON.Vec3(0, 10, 20); // Up and slightly forward
                luckyBall.body.applyLocalImpulse(force, new CANNON.Vec3(0, 0, 0));
            }, 3000);

        }, 2000); // Spin for 2 seconds
    });

    function showResult() {
        gameState = 'RESULT';
        resultOverlay.classList.remove('hidden');

        const isLucky = Math.random() > 0.5;
        resultMessage.innerHTML = `
            <h1>${isLucky ? '🎉 You’re lucky!' : '😢 Better luck next time'}</h1>
            <p>Tap anywhere to play again.</p>
        `;

        // Freeze the lucky ball in front of the camera
        scene.add(luckyBall.mesh); // Re-add to scene in case it was removed
        luckyBall.mesh.position.set(camera.position.x, camera.position.y, camera.position.z - 5);
        luckyBall.mesh.scale.set(3, 3, 3);
        
        // Hide other balls
        balls.forEach(b => {
            if (b !== luckyBall) b.mesh.visible = false;
        });

        // Listen for a click to reset
        resultOverlay.addEventListener('click', resetGame, { once: true });
    }
    
    function resetGame() {
        // Remove old balls
        balls.forEach(ball => {
            scene.remove(ball.mesh);
            world.removeBody(ball.body);
        });
        balls = [];

        // Reset UI
        resultOverlay.classList.add('hidden');
        spinButton.disabled = false;
        spinButton.textContent = 'SPIN';
        
        // Reset state
        luckyBall = null;
        gameState = 'IDLE';

        // Create new balls
        createBalls();
    }


    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let oldElapsedTime = 0;

    function animate() {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - oldElapsedTime;
        oldElapsedTime = elapsedTime;

        // Update physics world
        if (gameState !== 'RESULT') {
            world.step(1 / 60, deltaTime, 3);
        }

        // Sync 3D meshes with physics bodies
        balls.forEach(ball => {
            ball.mesh.position.copy(ball.body.position);
            ball.mesh.quaternion.copy(ball.body.quaternion);
            
            // If a lucky ball has been chosen, check if it has exited
            if (luckyBall && ball === luckyBall && ball.body.position.y < -5) {
                if (gameState !== 'RESULT') showResult();
            }
        });
        
        if (gameState !== 'RESULT') {
            // Give all balls a little nudge towards the center spinner
            balls.forEach(ball => {
                const toCenter = new CANNON.Vec3().copy(spinnerBody.position).vsub(ball.body.position);
                toCenter.normalize();
                toCenter.scale(2, toCenter); // a small force
                ball.body.applyForce(toCenter, ball.body.position);
            });
        }

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});
