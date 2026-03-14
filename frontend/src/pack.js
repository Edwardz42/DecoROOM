import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// BALANCED BRIGHTNESS: Reduced to see texture details
renderer.toneMappingExposure = 1.2; 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('card-container').appendChild(renderer.domElement);

function createCodeSnippet() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const codeLines = [
        { text: 'import * as THREE from "three";', color: '#ff79c6' },
        { text: 'const scene = new THREE.Scene();', color: '#8be9fd' },
        { text: 'renderer.render(scene, camera);', color: '#50fa7b' },
        { text: 'requestAnimationFrame(animate);', color: '#bd93f9' },
        { text: 'cardPack.rotation.y += 0.05;', color: '#f1fa8c' }
    ];
    const line = codeLines[Math.floor(Math.random() * codeLines.length)];
    ctx.font = 'bold 48px "JetBrains Mono", monospace';
    ctx.fillStyle = line.color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = line.color; ctx.shadowBlur = 10;
    ctx.fillText(line.text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
}

const codeGroup = new THREE.Group();
for (let i = 0; i < 70; i++) {
    const material = new THREE.MeshBasicMaterial({
        map: createCodeSnippet(), transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const geometry = new THREE.PlaneGeometry(4, 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    const angle = (Math.random() - 0.5) * Math.PI * 1.3; 
    const radius = 10 + Math.random() * 8; 
    mesh.position.set(Math.sin(angle) * radius, (Math.random() - 0.5) * 25, -Math.cos(angle) * radius);
    mesh.lookAt(0, mesh.position.y, 0);
    codeGroup.add(mesh);
}
scene.add(codeGroup);

// CLEAN LIGHTING
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); 
scene.add(ambientLight);
const spotLight = new THREE.SpotLight(0xffffff, 60); 
spotLight.position.set(0, 5, 10);
scene.add(spotLight);

const loader = new THREE.TextureLoader();
const packTexture = loader.load('./assets/images/pack.png');
const faceMat = new THREE.MeshPhysicalMaterial({ 
    map: packTexture, 
    metalness: 0.6, 
    roughness: 0.3, 
    iridescence: 0.5,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: packTexture,
    emissiveIntensity: 0.4 // Glows without being washed out
});
const cardPack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 0.1), faceMat);
cardPack.position.y = 0.5;
scene.add(cardPack);

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    spotLight.position.x = mouseX * 5; spotLight.position.y = -mouseY * 5;
});

function animate() {
    requestAnimationFrame(animate);
    const targetRotY = mouseX * Math.PI, targetRotX = mouseY * Math.PI;
    cardPack.rotation.y += (targetRotY - cardPack.rotation.y) * 0.05;
    cardPack.rotation.x += (targetRotX - cardPack.rotation.x) * 0.05;
    codeGroup.rotation.y += (-targetRotY * 0.1 - codeGroup.rotation.y) * 0.02;
    codeGroup.rotation.x += (-targetRotX * 0.1 - codeGroup.rotation.x) * 0.02;
    cardPack.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1; 
    codeGroup.children.forEach(s => { s.position.y += 0.008; if (s.position.y > 12) s.position.y = -12; });
    renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();

// SLOWEST TYPEWRITER
const prefixT = document.getElementById('type-prefix'), mainT = document.getElementById('type-main');
function typeWriter(text, element, delay, callback) {
    let i = 0;
    function type() {
        if (i < text.length) { element.innerHTML += text.charAt(i); i++; setTimeout(type, delay); }
        else if (callback) callback();
    }
    type();
}
// Delays increased to 300ms/350ms for a very slow effect
setTimeout(() => typeWriter("<CS>", prefixT, 300, () => typeWriter(" Gacha!", mainT, 350)), 500);