import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('card-container').appendChild(renderer.domElement);

// 2. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 3. Texture Loading 
const loader = new THREE.TextureLoader();

// This path assumes your folder is: frontend/assets/images/pack.png
const packTexture = loader.load('../assets/images/pack.png', 
    (tex) => { console.log('Texture Loaded Successfully'); },
    undefined,
    (err) => { console.error('Error loading texture. Check path: ../assets/images/pack.png'); }
);

// 4. Geometry (Width, Height, Depth)
const geometry = new THREE.BoxGeometry(3.2, 4.5, 0.6);

// Material Setup
const sideMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const faceMat = new THREE.MeshStandardMaterial({ 
    map: packTexture,
    roughness: 0.3,
    metalness: 0.2
});

// Materials array: Right, Left, Top, Bottom, Front, Back
const materials = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];
const cardPack = new THREE.Mesh(geometry, materials);
scene.add(cardPack);

// 5. Full Flip Interaction
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
    // Normalized coordinates (-1 to 1)
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

function animate() {
    requestAnimationFrame(animate);

    // Math for "Flip all the way" 
    // Multiply by Math.PI to allow full rotation based on mouse position
    const targetRotY = mouseX * Math.PI; 
    const targetRotX = mouseY * Math.PI;

    // Smooth easing (Lerp)
    cardPack.rotation.y += (targetRotY - cardPack.rotation.y) * 0.05;
    cardPack.rotation.x += (targetRotX - cardPack.rotation.x) * 0.05;

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();