import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
renderer.outputColorSpace = THREE.SRGBColorSpace; 
document.getElementById('card-container').appendChild(renderer.domElement);

// 2. High-Quality Code Texture Generator
function createCodeTexture() {
    const canvas = document.createElement('canvas');
    // Larger canvas size = clearer text
    canvas.width = 2048; 
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Solid Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const codeLines = [
        { text: 'import * as THREE from "three";', color: '#ff79c6' }, // Pink
        { text: 'const scene = new THREE.Scene();', color: '#8be9fd' }, // Cyan
        { text: 'renderer.render(scene, camera);', color: '#50fa7b' }, // Green
        { text: 'requestAnimationFrame(animate);', color: '#bd93f9' }, // Purple
        { text: 'cardPack.rotation.y += 0.05;', color: '#f1fa8c' },    // Yellow
        { text: 'console.log("DECOROOM_PRO");', color: '#ffb86c' },    // Orange
        { text: 'mesh.material.metalness = 0.8;', color: '#ff5555' },  // Red
        { text: 'const loader = new TextureLoader();', color: '#8be9fd' }
    ];

    // Sharp, monospace font
    ctx.font = 'bold 32px "Courier New", monospace';
    
    // Distribute code lines across the canvas
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const line = codeLines[Math.floor(Math.random() * codeLines.length)];
        
        ctx.globalAlpha = Math.random() * 0.7 + 0.3; // Make some lines brighter than others
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, x, y);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improves clarity at angles
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5); 
    return texture;
}

// 3. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 150);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0xffffff, 50);
spotLight.position.set(0, 5, 10);
scene.add(spotLight);

// 4. Texture Loading (FIXED PATH)
const loader = new THREE.TextureLoader();
// "../" goes up from src folder into frontend folder
const packTexture = loader.load('./assets/images/pack.png', 
    () => console.log("Pack texture loaded successfully!"),
    undefined,
    (err) => console.error("Error loading pack texture. Check file path.")
);
packTexture.colorSpace = THREE.SRGBColorSpace;

// 5. Create 3D Code Background Sphere
const codeTexture = createCodeTexture();
const bgGeometry = new THREE.SphereGeometry(45, 32, 32);
const bgMaterial = new THREE.MeshBasicMaterial({
    map: codeTexture,
    side: THREE.BackSide, 
    transparent: true,
    opacity: 0.6 // Increased opacity for clearer colors
});
const backgroundSphere = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(backgroundSphere);

// 6. THE PACK (Foil Logic)
const geometry = new THREE.BoxGeometry(2.0, 3.0, 0.1); 

const faceMat = new THREE.MeshPhysicalMaterial({ 
    map: packTexture,
    metalness: 0.8,
    roughness: 0.2,
    iridescence: 0.7,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 400],
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.1,
    emissiveMap: packTexture 
});

const materials = [faceMat, faceMat, faceMat, faceMat, faceMat, faceMat];
const cardPack = new THREE.Mesh(geometry, materials);
cardPack.position.y = 0.5;
scene.add(cardPack);

// 7. Interaction
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    
    spotLight.position.x = mouseX * 5;
    spotLight.position.y = -mouseY * 5;
});

// 8. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const targetRotY = mouseX * Math.PI; 
    const targetRotX = mouseY * Math.PI;

    // Smooth Pack Movement
    cardPack.rotation.y += (targetRotY - cardPack.rotation.y) * 0.05;
    cardPack.rotation.x += (targetRotX - cardPack.rotation.x) * 0.05;

    // Smooth Background Parallax
    backgroundSphere.rotation.y += (-targetRotY * 0.1 - backgroundSphere.rotation.y) * 0.02;
    backgroundSphere.rotation.x += (-targetRotX * 0.1 - backgroundSphere.rotation.x) * 0.02;

    // Continuous Code Scrolling (Slow drift)
    codeTexture.offset.y += 0.0002;
    codeTexture.offset.x += 0.0001;

    // Floating effect
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