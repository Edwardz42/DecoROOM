import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; 
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
        { text: 'renderer.render(scene, camera);', color: '#50fa7b' }
    ];
    const line = codeLines[Math.floor(Math.random() * codeLines.length)];
    ctx.font = 'bold 48px "JetBrains Mono", monospace';
    ctx.fillStyle = line.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

const loader = new THREE.TextureLoader();
const packTexture = loader.load('./assets/images/pack.png');
packTexture.colorSpace = THREE.SRGBColorSpace;

const cardTextures = [];
for(let i=1; i<=8; i++) {
    const t = loader.load(`./assets/images/card${i}.png`);
    t.colorSpace = THREE.SRGBColorSpace;
    cardTextures.push(t);
}

const faceMat = new THREE.MeshBasicMaterial({ map: packTexture, transparent: true });
const cardPack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.1), faceMat);
cardPack.position.y = 0.5;
scene.add(cardPack);

let isOpened = false;
let currentCardIdx = 0;
let activeCard = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.x = mouseX;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (isOpened) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cardPack);
    if (intersects.length > 0) openPack();
});

function openPack() {
    isOpened = true;
    const cta = document.getElementById('tap-cta');
    if(cta) cta.style.opacity = '0';
    
    let startTime = Date.now();
    const duration = 600;

    function tearAnim() {
        let elapsed = Date.now() - startTime;
        let p = elapsed / duration;
        if (p < 1) {
            cardPack.scale.set(1 + p * 2, 1 + p * 2, 1);
            cardPack.material.opacity = 1 - p;
            requestAnimationFrame(tearAnim);
        } else {
            scene.remove(cardPack);
            initGallery();
        }
    }
    tearAnim();
}

function initGallery() {
    document.getElementById('gallery-nav').style.display = 'flex';
    updateGalleryCard();
}

function updateGalleryCard() {
    if (activeCard) scene.remove(activeCard);
    const mat = new THREE.MeshBasicMaterial({ map: cardTextures[currentCardIdx], transparent: true });
    activeCard = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.8, 0.05), mat);
    activeCard.position.y = 0.5;
    scene.add(activeCard);
}

document.getElementById('next-card').onclick = (e) => {
    e.stopPropagation();
    currentCardIdx = (currentCardIdx + 1) % 8;
    updateGalleryCard();
};
document.getElementById('prev-card').onclick = (e) => {
    e.stopPropagation();
    currentCardIdx = (currentCardIdx - 1 + 8) % 8;
    updateGalleryCard();
};

function animate() {
    requestAnimationFrame(animate);
    const targetRotY = mouseX * Math.PI; 
    const targetRotX = mouseY * Math.PI;

    const displayObj = isOpened ? activeCard : cardPack;
    if (displayObj) {
        displayObj.rotation.y += (targetRotY - displayObj.rotation.y) * 0.05;
        displayObj.rotation.x += (targetRotX - displayObj.rotation.x) * 0.05;
        displayObj.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }

    codeGroup.rotation.y += (-targetRotY * 0.1 - codeGroup.rotation.y) * 0.02;
    codeGroup.rotation.x += (-targetRotX * 0.1 - codeGroup.rotation.x) * 0.02;
    codeGroup.children.forEach(s => { s.position.y += 0.008; if (s.position.y > 12) s.position.y = -12; });

    renderer.render(scene, camera);
}
animate();

const prefixT = document.getElementById('type-prefix'), mainT = document.getElementById('type-main');
function typeWriter(text, element, delay, callback) {
    let i = 0;
    function type() {
        if (i < text.length) { element.innerHTML += text.charAt(i); i++; setTimeout(type, delay); }
        else if (callback) callback();
    }
    type();
}
setTimeout(() => typeWriter("<CS>", prefixT, 300, () => typeWriter(" Gacha!", mainT, 350)), 500);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});