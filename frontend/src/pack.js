import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('card-container').appendChild(renderer.domElement);

const questionPool = [
    "What is the difference between let and const?",
    "How does the Event Loop work in JavaScript?",
    "Explain Three.js Raycasting in simple terms.",
    "What is the purpose of the virtual DOM?",
    "How do you optimize 3D textures for the web?",
    "What are the benefits of using TypeScript?",
    "Explain CSS Flexbox vs. Grid.",
    "How do you handle state in a 3D environment?"
];

// --- RESTORED ORIGINAL CIRCULAR CODE TUNNEL ---
function createCodeSnippet() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const codeLines = [
        { text: 'import * as THREE from "three";', color: '#ff79c6' },
        { text: 'const scene = new THREE.Scene();', color: '#8be9fd' },
        { text: 'renderer.render(scene, camera);', color: '#50fa7b' },
        { text: 'requestAnimationFrame(animate);', color: '#bd93f9' },
        { text: 'cardPack.rotation.y += 0.05;', color: '#f1fa8c' },
        { text: 'const query = backend.fetch();', color: '#ffb86c' }
    ];
    const line = codeLines[Math.floor(Math.random() * codeLines.length)];
    ctx.font = 'bold 44px "JetBrains Mono", monospace';
    ctx.fillStyle = line.color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = line.color; ctx.shadowBlur = 15;
    ctx.fillText(line.text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
}

const codeGroup = new THREE.Group();
const snippetCount = 120; // High density

for (let i = 0; i < snippetCount; i++) {
    const material = new THREE.MeshBasicMaterial({
        map: createCodeSnippet(), 
        transparent: true, 
        opacity: 0.25, 
        side: THREE.DoubleSide, 
        blending: THREE.AdditiveBlending
    });
    const geometry = new THREE.PlaneGeometry(4, 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    
    // CIRCULAR LOGIC: Placing snippets in a 360-degree cylinder
    const angle = (i / snippetCount) * Math.PI * 2 + (Math.random() * 0.5); 
    const radius = 10 + Math.random() * 5; // The radius of the tunnel
    const yPos = (Math.random() - 0.5) * 30; // Vertical spread
    
    mesh.position.set(Math.sin(angle) * radius, yPos, -Math.cos(angle) * radius);
    
    // Make each snippet face the center of the tunnel
    mesh.lookAt(0, mesh.position.y, 0);
    
    codeGroup.add(mesh);
}
scene.add(codeGroup);

// --- CARD TEXT GENERATOR (No branding) ---
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else { line = testLine; }
    }
    ctx.fillText(line, x, y);
}

function generateCardTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 600, 900);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#000000');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 25;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    wrapText(ctx, text, canvas.width / 2, 420, 480, 60);
    return new THREE.CanvasTexture(canvas);
}

const loader = new THREE.TextureLoader();
const packTex = loader.load('./assets/images/pack.png', (t) => t.colorSpace = THREE.SRGBColorSpace);
const cardPack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.1), new THREE.MeshBasicMaterial({ map: packTex, transparent: true }));
cardPack.position.y = 0.5;
scene.add(cardPack);

const rarityGlow = new THREE.PointLight(0x4A90E2, 0, 15);
rarityGlow.position.set(0, 0, 1);
scene.add(rarityGlow);

let isOpened = false;
let currentIdx = 0;
let activeCard = null;
const mouse = new THREE.Vector2();
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.x = mouseX; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (isOpened) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.intersectObject(cardPack).length > 0) openPack();
});

function openPack() {
    isOpened = true;
    document.getElementById('tap-cta').style.opacity = '0';
    let start = Date.now();
    const tear = () => {
        let p = (Date.now() - start) / 600;
        if (p < 1) {
            cardPack.scale.set(1 + p * 2, 1 + p * 2, 1);
            cardPack.material.opacity = 1 - p;
            requestAnimationFrame(tear);
        } else {
            scene.remove(cardPack);
            document.getElementById('gallery-nav').style.display = 'flex';
            updateCard();
        }
    };
    tear();
}

function updateCard() {
    if (activeCard) scene.remove(activeCard);
    const colors = ['#4A90E2', '#50fa7b', '#bd93f9', '#f1fa8c', '#ff79c6', '#ffb86c', '#8be9fd', '#ff5555'];
    const tex = generateCardTexture(questionPool[currentIdx], colors[currentIdx]);
    activeCard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.05), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    activeCard.position.y = 0.0; 
    rarityGlow.color.set(colors[currentIdx]);
    rarityGlow.intensity = 100;
    scene.add(activeCard);
}

document.getElementById('next-card').onclick = (e) => { e.stopPropagation(); currentIdx = (currentIdx + 1) % questionPool.length; updateCard(); };
document.getElementById('prev-card').onclick = (e) => { e.stopPropagation(); currentIdx = (currentIdx - 1 + questionPool.length) % questionPool.length; updateCard(); };

function animate() {
    requestAnimationFrame(animate);

    const targetRotY = mouseX * Math.PI; 
    const targetRotX = mouseY * Math.PI;

    if (!isOpened && cardPack) {
        cardPack.rotation.y += (targetRotY - cardPack.rotation.y) * 0.05;
        cardPack.rotation.x += (targetRotX - cardPack.rotation.x) * 0.05;
        cardPack.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    } 
    else if (activeCard) {
        activeCard.rotation.set(0, 0, 0); 
        activeCard.position.y = 0.0; 
    }

    // --- CIRCULAR EFFECT MOVES WITH PACK ---
    codeGroup.rotation.y += (-mouseX * 0.15 - codeGroup.rotation.y) * 0.02;
    codeGroup.rotation.x += (-mouseY * 0.15 - codeGroup.rotation.x) * 0.02;
    
    codeGroup.children.forEach(s => { 
        s.position.y += 0.01; 
        if (s.position.y > 15) s.position.y = -15; 
    });

    renderer.render(scene, camera);
}
animate();

const prefixT = document.getElementById('type-prefix'), mainT = document.getElementById('type-main');
const type = (t, e, d, c) => {
    let i = 0;
    const f = () => { if (i < t.length) { e.innerHTML += t.charAt(i); i++; setTimeout(f, d); } else if (c) c(); };
    f();
};
setTimeout(() => type("<CS>", prefixT, 200, () => type(" Gacha!", mainT, 250)), 500);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});