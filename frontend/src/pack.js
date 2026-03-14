import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // Increase this value to brighten everything
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// This makes the colors look more realistic (Standard for modern Three.js)
renderer.outputColorSpace = THREE.SRGBColorSpace; 
document.getElementById('card-container').appendChild(renderer.domElement);

// 2. Lights & Environment (Crucial for Foil)
// Ambient light acts as a "base" brightness for everything
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Doubled intensity
scene.add(ambientLight);

// Point light for that sharp "foil shine"
const pointLight = new THREE.PointLight(0xffffff, 150); // Increased from 100
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// A bright light that follows the mouse can help catch the "shine"
const spotLight = new THREE.SpotLight(0xffffff, 50);
spotLight.position.set(0, 5, 10);
scene.add(spotLight);

// 3. Texture Loading
const loader = new THREE.TextureLoader();
const packTexture = loader.load('./assets/images/pack.png');
packTexture.colorSpace = THREE.SRGBColorSpace; // Keeps Canva colors accurate

// Original: (3.2, 4.5, 0.6)
// New Smaller Version:
const geometry = new THREE.BoxGeometry(2.0, 3.0, 0.1); 

// 5. THE FOIL MATERIAL
// MeshPhysicalMaterial allows for iridescence (rainbow effect)
const faceMat = new THREE.MeshPhysicalMaterial({ 
    map: packTexture,
    metalness: 0.8,
    roughness: 0.2,
    iridescence: 0.7,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 400],
    
    // ADD THESE FOR BRIGHTNESS:
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.15, // Low value so it doesn't turn pure white
    emissiveMap: packTexture // Uses your Canva design as the "light" source
});

const sideMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });

// Materials array: Right, Left, Top, Bottom, Front, Back
// Use the SAME faceMat for all 6 sides
const materials = [faceMat, faceMat, faceMat, faceMat, faceMat, faceMat];
const cardPack = new THREE.Mesh(geometry, materials);
// Add this in pack.js after scene.add(cardPack);
cardPack.position.y = 0.5; // Adjust this number (0.8, 1.2, etc.) until it's perfect
scene.add(cardPack);

// 6. Animation & Interaction
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    
    // Move the light slightly with the mouse to "glint" off the foil
    spotLight.position.x = mouseX * 5;
    spotLight.position.y = -mouseY * 5;
});

function animate() {
    requestAnimationFrame(animate);

    // 1. Existing Mouse Rotation Logic
    const targetRotY = mouseX * Math.PI; 
    const targetRotX = mouseY * Math.PI;
    cardPack.rotation.y += (targetRotY - cardPack.rotation.y) * 0.05;
    cardPack.rotation.x += (targetRotX - cardPack.rotation.x) * 0.05;

    // 2. Add a gentle "Floating" effect (Sine wave)
    // This keeps it "slightly up" but adds a premium feel
    const time = Date.now() * 0.002;
    cardPack.position.y = 0.5 + Math.sin(time) * 0.1; 

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();