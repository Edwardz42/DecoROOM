import * as THREE from 'three';
import { syncClientSessionWithBackend } from './sessionSync';
import { API_BASE } from "./apiBase";

const PACK_COOLDOWN_MS = 60_000;

function getUnlockedIds() {
    try {
        return JSON.parse(localStorage.getItem('unlockedQuestionIds') || '[]');
    } catch {
        return [];
    }
}

function saveUnlockedIds(ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    localStorage.setItem('unlockedQuestionIds', JSON.stringify(unique));
}

function getPackCooldownLeft() {
    const last = Number(localStorage.getItem('lastPackOpenedAt') || 0);
    return Math.max(0, PACK_COOLDOWN_MS - (Date.now() - last));
}

function emitGachaSoundHook(type, rarity = null, index = null) {
    window.dispatchEvent(new CustomEvent('gacha:sound', {
        detail: { type, rarity, index, at: Date.now() }
    }));
}

const cooldownProgressRing = document.getElementById('cooldown-progress');
const cooldownText = document.getElementById('cooldown-text');
const openPackBtn = document.getElementById('open-pack-btn');
const starterBanner = document.getElementById('starter-banner');
const tapCta = document.getElementById('tap-cta');
const cardCountEl = document.getElementById('card-count');
const cardRarityEl = document.getElementById('card-rarity');
const prevBtn = document.getElementById('prev-card');
const nextBtn = document.getElementById('next-card');

const ringRadius = 34;
const ringCircumference = 2 * Math.PI * ringRadius;
cooldownProgressRing.style.strokeDasharray = String(ringCircumference);

function rarityColor(diff) {
    if (diff === 'hard') return '#ff5555';
    if (diff === 'medium') return '#f1fa8c';
    return '#50fa7b';
}

function rarityLabel(diff) {
    if (diff === 'hard') return 'HARD';
    if (diff === 'medium') return 'MEDIUM';
    return 'EASY';
}

function updateCardMeta() {
    const total = questionPool.length || 8;
    const pos = questionPool.length ? currentIdx + 1 : 0;
    if (cardCountEl) cardCountEl.textContent = `${pos}/${total}`;

    const q = questionPool[currentIdx];
    const diff = q?.difficulty || null;
    const label = diff ? rarityLabel(diff) : '--';
    if (cardRarityEl) {
        cardRarityEl.textContent = `RARITY: ${label}`;
        cardRarityEl.className = `rarity-chip${diff ? ` ${diff}` : ''}`;
    }

    if (prevBtn) prevBtn.disabled = currentIdx <= 0;
    if (nextBtn) nextBtn.disabled = currentIdx >= total - 1;
}

function updatePackUi(opening = false) {
    const left = getPackCooldownLeft();
    const progress = left / PACK_COOLDOWN_MS;
    const offset = ringCircumference * progress;

    cooldownProgressRing.style.strokeDashoffset = String(offset);
    cooldownProgressRing.style.stroke = left > 0 ? '#f1fa8c' : '#50fa7b';

    cooldownText.textContent = left > 0 ? `${Math.ceil(left / 1000)}s` : 'READY';
    cooldownText.style.color = left > 0 ? '#f1fa8c' : '#50fa7b';

    openPackBtn.disabled = opening || left > 0;
    openPackBtn.textContent = opening ? 'OPENING...' : left > 0 ? 'ON COOLDOWN' : 'OPEN PACK';
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('card-container').appendChild(renderer.domElement);

let questionPool = [];

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
const snippetCount = 120; 

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
    
    const angle = (i / snippetCount) * Math.PI * 2 + (Math.random() * 0.5); 
    const radius = 10 + Math.random() * 5; 
    const yPos = (Math.random() - 0.5) * 30; 
    
    mesh.position.set(Math.sin(angle) * radius, yPos, -Math.cos(angle) * radius);
    mesh.lookAt(0, mesh.position.y, 0);
    codeGroup.add(mesh);
}
scene.add(codeGroup);

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

function generateCardTexture(text, color, rarity) {
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
    ctx.fillStyle = color;
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText((rarity || 'easy').toUpperCase(), canvas.width / 2, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "JetBrains Mono", monospace';
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
let openingPack = false;
const mouse = new THREE.Vector2();
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.x = mouseX; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (openingPack) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (!isOpened && raycaster.intersectObject(cardPack).length > 0) {
        openPack(false);
    }
});

openPackBtn.addEventListener('click', () => openPack(false));
tapCta.addEventListener('click', () => openPack(false));

async function fetchPackQuestions() {
    const playerId = localStorage.getItem('playerId') || 'anonymous';
    const r = await fetch(`${API_BASE}/api/gacha/open-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
    });
    const data = await r.json();
    if (!Array.isArray(data.pack)) throw new Error('PACK_FETCH_FAILED');
    return data.pack.slice(0, 8).map((q) => ({
        id: q.questionId || q.id,
        questionText: q.questionText || q.q || '',
        topic: q.topic || 'General',
        difficulty: q.difficulty || q.diff || 'easy'
    }));
}

async function openPack(isStarter = false) {
    if (openingPack) return;
    if (!isStarter && getPackCooldownLeft() > 0) return;

    openingPack = true;
    updatePackUi(true);
    emitGachaSoundHook('pack-open', null, null);

    try {
        questionPool = await fetchPackQuestions();
    } catch {
        questionPool = [
            { id: 'fallback_easy_1', questionText: 'What is a process in Operating Systems?', topic: 'Operating Systems', difficulty: 'easy' },
            { id: 'fallback_easy_2', questionText: 'What does HTTP stand for?', topic: 'Networking', difficulty: 'easy' },
            { id: 'fallback_easy_3', questionText: 'What is Big-O notation used for?', topic: 'Algorithms', difficulty: 'easy' },
            { id: 'fallback_med_1', questionText: 'How does hashing help in lookup performance?', topic: 'Data Structures', difficulty: 'medium' },
            { id: 'fallback_med_2', questionText: 'What is virtual memory?', topic: 'Operating Systems', difficulty: 'medium' },
            { id: 'fallback_hard_1', questionText: 'Explain deadlock and Coffman conditions.', topic: 'Operating Systems', difficulty: 'hard' },
            { id: 'fallback_med_3', questionText: 'How does TCP ensure reliability?', topic: 'Networking', difficulty: 'medium' },
            { id: 'fallback_hard_2', questionText: 'Compare Dijkstra and Bellman-Ford.', topic: 'Algorithms', difficulty: 'hard' }
        ];
    }

    const unlocked = getUnlockedIds();
    questionPool = questionPool.slice(0, 8);
    saveUnlockedIds([...unlocked, ...questionPool.map((q) => q.id)]);
    localStorage.setItem('lastPackOpenedAt', String(Date.now()));

    const starterClaimed = localStorage.getItem('starterPackClaimed') === '1';
    if (isStarter && !starterClaimed) {
        localStorage.setItem('starterPackClaimed', '1');
        starterBanner.classList.remove('hidden');
        setTimeout(() => starterBanner.classList.add('hidden'), 3600);
    }

    isOpened = true;
    currentIdx = 0;
    document.getElementById('tap-cta').style.opacity = '0';

    const revealDelay = 280;
    questionPool.forEach((q, i) => {
        setTimeout(() => emitGachaSoundHook('card-flip', q.difficulty, i), revealDelay * (i + 1));
    });

    if (scene.getObjectById(cardPack.id)) {
        let start = Date.now();
        const tear = () => {
            const p = (Date.now() - start) / 600;
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
    } else {
        document.getElementById('gallery-nav').style.display = 'flex';
        updateCard();
    }

    setTimeout(() => {
        openingPack = false;
        updatePackUi(false);
        emitGachaSoundHook('pack-complete', null, null);
    }, 8 * revealDelay + 300);
}

function updateCard() {
    if (!questionPool.length) return;
    if (activeCard) scene.remove(activeCard);
    const q = questionPool[currentIdx];
    const color = rarityColor(q.difficulty);
    const tex = generateCardTexture(q.questionText, color, q.difficulty);
    activeCard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.05), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    activeCard.position.y = 0.0; 
    rarityGlow.color.set(color);
    rarityGlow.intensity = 100;
    scene.add(activeCard);
    updateCardMeta();
}

document.getElementById('next-card').onclick = (e) => {
    e.stopPropagation();
    if (currentIdx < questionPool.length - 1) {
        currentIdx += 1;
        updateCard();
    }
};
document.getElementById('prev-card').onclick = (e) => {
    e.stopPropagation();
    if (currentIdx > 0) {
        currentIdx -= 1;
        updateCard();
    }
};

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

    codeGroup.rotation.y += (-mouseX * 0.15 - codeGroup.rotation.y) * 0.02;
    codeGroup.rotation.x += (-mouseY * 0.15 - codeGroup.rotation.x) * 0.02;
    
    codeGroup.children.forEach(s => { 
        s.position.y += 0.01; 
        if (s.position.y > 15) s.position.y = -15; 
    });

    renderer.render(scene, camera);
}
animate();

setInterval(() => updatePackUi(openingPack), 250);
updatePackUi(false);
updateCardMeta();

const initSessionAndStarterPack = async () => {
    await syncClientSessionWithBackend();
    const hasUnlocked = getUnlockedIds().length > 0;
    const starterClaimed = localStorage.getItem('starterPackClaimed') === '1';
    if (!hasUnlocked && !starterClaimed) {
        setTimeout(() => openPack(true), 650);
    }
};
initSessionAndStarterPack();

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