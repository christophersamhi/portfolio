import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { Howl, Howler } from 'howler';

// =====================================================================
// CONFIG
// =====================================================================
const CONFIG = {
  modelPath: 'scene.glb',
  videoPath: null,                 // ex : 'video/screen.mp4' pour animer l'écran du bureau
  viewDirection: new THREE.Vector3(1, 0.35, 1.4).normalize(), // vue "en coin"
  framingMargin: 1.1,              // > 1 = dézoome
  focusOffset: new THREE.Vector3(0, 3, 1), // position caméra par rapport à un manga
  fanSpeed: 2.4,                   // rad/s (indépendant du framerate)
  clickTolerance: 6,               // px : au-delà, c'est un drag et pas un clic
  azimuth: [0, Math.PI / 2],
  polar: [0, Math.PI / 2],
};

// [mot-clé dans le nom du mesh, fichier de texture] — le premier qui correspond gagne
const TEXTURE_RULES = [

];

// Éléments du menu animés à l'intro (cachés au départ)
const HIDDEN_AT_START = [
  'Hanging_Plank_2', 'My_Work', 'About', 'Contact',
  '_Projet', '_Target', '_Raycaster', '_Letters',
];

// Types d'objets interactifs (on remonte la hiérarchie pour les trouver)
const TYPE_RULES = [
  ['_Projet', 'projet'],
  ['_Raycaster', 'raycaster'],
  ['_Target', 'target'],
  ['Manga', 'manga'],
];
const BUTTON_MODALS = [
  ['About', 'modal-about'],
  ['My_Work', 'modal-work'],
  ['Contact', 'modal-contact'],
];
const INTERACTIVE_KEYS = [...TYPE_RULES.map(([k]) => k), '_Letters', ...BUTTON_MODALS.map(([k]) => k)];
const DELAYED_KEYS = ['_Projet', '_Raycaster', '_Target', '_Letters', ...BUTTON_MODALS.map(([k]) => k)];

// =====================================================================
// DOM
// =====================================================================
const $ = (selector, root = document) => root.querySelector(selector);

const dom = {
  loading: $('#loading-screen'),
  loadingTitle: $('#title-loading'),
  enter: $('#enter'),
  enterSilent: $('#enter-silent'),
  muteButton: $('.mute-toggle-button'),
  debugPanel: $('#camera-debug'),
};

// =====================================================================
// ÉTAT
// =====================================================================
let state = 'loading'; // loading -> ready -> running
let isLoaded = false;
let isFocused = false;
let activeModal = null;
let currentHover = null;
let currentCursor = 'default';

let model = null;
let hourHand = null;
let minuteHand = null;
let chairTop = null;
const ui = {};                  // plank1, plank2, workBtn, aboutBtn, contactBtn
const xAxisFans = [];
const yAxisFans = [];
const hitboxes = [];
let delayedHitboxes = [];

const home = { position: new THREE.Vector3(), target: new THREE.Vector3(), minDistance: 5 };

// =====================================================================
// THREE : scène, caméra, rendu, contrôles
// =====================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 30); // position provisoire, remplacée par frameModel()

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
[controls.minAzimuthAngle, controls.maxAzimuthAngle] = CONFIG.azimuth;
[controls.minPolarAngle, controls.maxPolarAngle] = CONFIG.polar;

scene.add(new THREE.AmbientLight(0xffffff, 1.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(5, 10, 50);
scene.add(sun);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(10, 10); // hors écran tant que la souris n'a pas bougé
const clock = new THREE.Clock();

// =====================================================================
// CHARGEMENT (un seul manager pour modèle + textures + vidéo)
// =====================================================================
const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);

manager.onProgress = (_url, loaded, total) => {
  dom.loadingTitle.textContent = `Loading... ${Math.round((loaded / total) * 100)}%`;
};
manager.onError = (url) => console.error(`Échec de chargement : ${url}`);
manager.onLoad = () => {
  state = 'ready';
  dom.loadingTitle.textContent = 'Ready';
  [dom.enter, dom.enterSilent].forEach((btn, i) => {
    btn.disabled = false;
    gsap.fromTo(btn,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, delay: i * 0.2, ease: 'back.out(1.8)', clearProps: 'transform' });
  });
};

// ---------- Matériaux ----------
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

const materialRules = TEXTURE_RULES.map(([keyword, file]) => {
  const map = textureLoader.load(`textures/${file}`);
  map.flipY = false; // obligatoire pour les UV glTF
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;
  return {
    keyword,
    material: new THREE.MeshStandardMaterial({ map, roughness: 0.65, metalness: 0.05 }),
  };
});

const findMaterial = (name) => materialRules.find((r) => name.includes(r.keyword))?.material;

function createScreenMaterial() {
  if (!CONFIG.videoPath) return new THREE.MeshBasicMaterial({ color: 0x000000 });

  const video = Object.assign(document.createElement('video'), {
    src: CONFIG.videoPath, loop: true, muted: true, playsInline: true, crossOrigin: 'anonymous',
  });
  video.play().catch(() => {});
  const map = new THREE.VideoTexture(video);
  map.flipY = false;
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map });
}
const screenMaterial = createScreenMaterial();

// ---------- Modèle ----------
gltfLoader.load(CONFIG.modelPath, (gltf) => {
  model = gltf.scene;
  scene.add(model);

  // Recentre le modèle sur l'origine
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(center);

  frameModel();
  model.traverse(setupMesh);
  createHitboxes();
});

function setupMesh(child) {
  if (!child.isMesh) return;
  const name = child.name || '';

  const material = findMaterial(name);
  if (material) child.material = material;
  if (name.includes('Screen')) child.material = screenMaterial;

  // État initial, utilisé par les animations
  child.userData.initialScale = child.scale.clone();
  child.userData.initialPosition = child.position.clone();
  child.userData.initialRotation = child.rotation.clone();

  if (name.includes('Hour_Hand')) hourHand = child;
  if (name.includes('Minute_Hand')) minuteHand = child;

  if (name.includes('Chair_Top')) {
    chairTop = child;
  } else if (child.parent?.name.includes('Chair_Top')) {
    chairTop = child.parent;
    chairTop.userData.initialRotation ??= chairTop.rotation.clone();
  }

  const lower = name.toLowerCase();
  if (lower.includes('fan')) (lower.includes('fan_2') ? xAxisFans : yAxisFans).push(child);

  if (name.includes('Hanging_Plank_1')) ui.plank1 = child;
  else if (name.includes('Hanging_Plank_2')) ui.plank2 = child;
  else if (name.includes('My_Work')) ui.workBtn = child;
  else if (name.includes('About')) ui.aboutBtn = child;
  else if (name.includes('Contact')) ui.contactBtn = child;

  // Caché jusqu'à l'animation d'intro
  if (name.includes('Hanging_Plank_1')) child.scale.set(0, 0, 1);
  else if (HIDDEN_AT_START.some((key) => name.includes(key))) child.scale.set(0, 0, 0);
}

/** Place la caméra pour voir tout le modèle, en tenant compte du format d'écran. */
function frameModel() {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = ((maxDim / 2) / Math.tan(Math.min(vFov, hFov) / 2)) * CONFIG.framingMargin;

  camera.position.copy(center).addScaledVector(CONFIG.viewDirection, distance);
  camera.far = Math.max(camera.far, distance * 3);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = distance * 0.4;
  controls.maxDistance = distance * 1.6;
  controls.update();

  home.position.copy(camera.position);
  home.target.copy(controls.target);
  home.minDistance = controls.minDistance;
}

// =====================================================================
// CAMÉRA : zoom sur un objet / retour à la vue d'ensemble
// =====================================================================
function flyTo(position, target, finalMinDistance) {
  gsap.killTweensOf([camera.position, controls.target]);
  controls.enabled = false;
  // On abaisse la limite AVANT le trajet, sinon OrbitControls rejette le zoom
  controls.minDistance = Math.min(controls.minDistance, finalMinDistance);

  const options = { duration: 1.2, ease: 'power2.inOut' };
  gsap.to(camera.position, { x: position.x, y: position.y, z: position.z, ...options });
  gsap.to(controls.target, {
    x: target.x, y: target.y, z: target.z, ...options,
    onUpdate: () => controls.update(),
    onComplete: () => {
      controls.minDistance = finalMinDistance;
      controls.enabled = !activeModal;
    },
  });
}

function focusOn(object) {
  const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
  const position = center.clone().add(CONFIG.focusOffset);
  isFocused = true;
  flyTo(position, center, 1);
}

function resetView() {
  isFocused = false;
  flyTo(home.position, home.target, home.minDistance);
}

// =====================================================================
// HITBOXES (boîtes invisibles pour le raycast)
// =====================================================================
const hasKey = (name, keys) => keys.some((key) => name.includes(key));

function findInChain(object, keys) {
  for (let node = object; node; node = node.parent) {
    if (hasKey(node.name || '', keys)) return node;
  }
  return null;
}

function createHitboxes() {
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    const target = findInChain(obj, INTERACTIVE_KEYS);
    if (!target) return;

    // Les objets cachés au départ ont une taille nulle : leur hitbox est créée après l'intro
    if (hasKey(obj.name, DELAYED_KEYS)) delayedHitboxes.push(obj);
    else createHitbox(obj, target);
  });
}

function createHitbox(obj, target = obj) {
  obj.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());

  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial());
  hitbox.position.copy(box.getCenter(new THREE.Vector3()));
  hitbox.visible = false; // non rendu, mais toujours détecté par le Raycaster
  hitbox.userData.target = target;

  scene.add(hitbox);
  hitboxes.push(hitbox);
}

function createDelayedHitboxes() {
  delayedHitboxes.forEach((obj) => {
    const currentScale = obj.scale.clone();
    obj.scale.copy(obj.userData.initialScale);
    createHitbox(obj);
    obj.scale.copy(currentScale);
  });
  delayedHitboxes = [];
}

function getType(object) {
  for (let node = object; node; node = node.parent) {
    const name = node.name || '';
    const rule = TYPE_RULES.find(([key]) => name.includes(key));
    if (rule) return rule[1];
  }
  return null;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(hitboxes, false)[0]?.object.userData.target ?? null;
}

function isClickable(target) {
  const type = getType(target);
  return type === 'manga' || type === 'target' || type === 'projet' || hasKey(target.name, BUTTON_MODALS.map(([k]) => k));
}

// =====================================================================
// HOVER
// =====================================================================
function applyHover(obj, hovering) {
  obj.userData.initialScale ??= obj.scale.clone();
  obj.userData.initialPosition ??= obj.position.clone();
  obj.userData.initialRotation ??= obj.rotation.clone();

  const { initialScale: base, initialPosition: basePos, initialRotation: baseRot } = obj.userData;

  gsap.killTweensOf([obj.scale, obj.position, obj.rotation]);

  const scaleTo = (factor, duration = 0.2) => {
    const f = hovering ? factor : 1;
    gsap.to(obj.scale, { x: base.x * f, y: base.y * f, z: base.z * f, duration });
  };
  const liftTo = (height) =>
    gsap.to(obj.position, { y: basePos.y + (hovering ? height : 0), duration: 0.25, ease: 'power2.out' });
  const tiltTo = (angle, ease = 'back.out(2)') =>
    gsap.to(obj.rotation, { x: baseRot.x + (hovering ? angle : 0), duration: 0.5, ease });

  const type = getType(obj);

  if (type === 'manga') {
    scaleTo(1.2, 0.25);
    liftTo(0.4);
  } else if (type === 'raycaster') {
    scaleTo(1.7);
  } else if (obj.name.includes('About_Button')) {
    scaleTo(1.4);
    tiltTo(-Math.PI / 10, hovering ? 'back.out(2)' : 'power2.out');
  } else if (type === 'projet') {
    scaleTo(1.4);
    tiltTo(Math.PI / 10);
  } else if (type === 'target') {
    tiltTo(Math.PI / 10);
  } else if (obj.name.includes('_Letters')) {
    liftTo(0.4);
  }
}

function resetHover() {
  if (!currentHover) return;
  applyHover(currentHover, false);
  currentHover = null;
}

function setCursor(cursor) {
  if (cursor === currentCursor) return;
  currentCursor = cursor;
  renderer.domElement.style.cursor = cursor;
}

function updateHover() {
  if (!isLoaded || activeModal) return;

  const target = pick();
  if (target !== currentHover) {
    resetHover();
    if (target) {
      currentHover = target;
      applyHover(target, true);
    }
  }
  setCursor(target && isClickable(target) ? 'pointer' : 'default');
}

// =====================================================================
// INTERACTIONS
// =====================================================================
function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

let pointerStart = null;
const canvas = renderer.domElement;

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') updatePointer(e);
});
canvas.addEventListener('pointerleave', () => pointer.set(10, 10));
canvas.addEventListener('pointerdown', (e) => { pointerStart = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointercancel', () => { pointerStart = null; });
canvas.addEventListener('pointerup', (e) => {
  if (!pointerStart) return;
  const moved = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
  pointerStart = null;

  // Un drag de caméra n'est pas un clic ; sur tactile, il n'y a pas de "move" avant le tap
  if (moved > CONFIG.clickTolerance || !isLoaded || activeModal) return;
  updatePointer(e);
  handleClick();
});

function handleClick() {
  const target = pick();

  if (!target) {
    if (isFocused) resetView(); // clic dans le vide = retour à la vue d'ensemble
    return;
  }

  const type = getType(target);
  if (type === 'manga') return focusOn(target);
  if (type === 'projet') return openProject(target);

  const button = BUTTON_MODALS.find(([key]) => target.name.includes(key));
  if (button) openModal(button[1]);
}

// =====================================================================
// MODALES
// =====================================================================
const swiper = window.Swiper
  ? new window.Swiper('.mySwiper', {
      loop: true,
      speed: 600,
      grabCursor: true,
      keyboard: { enabled: true },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      observer: true,        // recalcule la taille quand la modale (display:none) s'ouvre
      observeParents: true,
    })
  : null;

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  resetHover();
  setCursor('default');
  activeModal = modal;
  modal.classList.add('is-open');
  controls.enabled = false;
  clickSound.play();
  if (id === 'modal-work') swiper?.update();
}

function openProject(target) {
  // TODO : remplacer par le vrai contenu du projet
  $('#title-projet').textContent = target.name.replace('_Projet', '').replace(/_/g, ' ').trim() || 'Projet';
  openModal('modal-projet');
}

function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove('is-open');
  activeModal = null;
  controls.enabled = true;
  clickSound.play();
}

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
});
document.querySelectorAll('.modal-close').forEach((btn) => btn.addEventListener('click', closeModal));

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (activeModal) closeModal();
    else if (isFocused) resetView();
  }
  if (e.key.toLowerCase() === 'l') dom.debugPanel.hidden = !dom.debugPanel.hidden;
});

// =====================================================================
// AUDIO
// =====================================================================
const clickSound = new Howl({ src: ['audio/bubble.ogg'], volume: 0.5 });
const music = new Howl({ src: ['audio/musique.ogg'], loop: true, volume: 1 });
let isMuted = false;

function setMuted(muted) {
  isMuted = muted;
  Howler.mute(muted);
  dom.muteButton.classList.toggle('is-muted', muted);
}

dom.muteButton.addEventListener('click', () => {
  setMuted(!isMuted);
  clickSound.play();
  if (!music.playing()) music.play();
  gsap.fromTo(dom.muteButton, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' });
});

// =====================================================================
// ENTRÉE + ANIMATIONS D'INTRO
// =====================================================================
dom.enter.addEventListener('click', () => enterExperience(false));
dom.enterSilent.addEventListener('click', () => enterExperience(true));

function enterExperience(silent) {
  if (state !== 'ready') return;
  state = 'running';

  setMuted(silent);
  music.play(); // lancée dans tous les cas : "dé-mute" suffit ensuite

  dom.enter.disabled = true;
  dom.enterSilent.disabled = true;
  dom.enter.textContent = '~ Bonjour ~';
  dom.enter.classList.add('is-greeting');
  dom.loading.classList.add('is-entering');
  dom.enterSilent.style.display = 'none';
  dom.loadingTitle.style.display = 'none';

  playReveal();
}

function playReveal() {
  gsap.timeline({
    onComplete: () => {
      dom.loading.remove();
      isLoaded = true;
      playIntroAnimation();
    },
  })
    .to(dom.loading, { scale: 0.5, duration: 1.2, ease: 'back.in(1.8)' })
    .to(dom.loading, {
      y: '200vh', rotateX: 45, rotateY: -35, transformPerspective: 1000,
      duration: 1.2, ease: 'back.in(1.8)',
    }, '-=0.1');
}

/** Fait apparaître un objet : scale depuis 0 + petit rebond vers le haut. */
function popIn(obj) {
  const { initialScale: s, initialPosition: p } = obj.userData;
  return gsap.timeline({ defaults: { duration: 0.6, ease: 'back.out(2)' } })
    .to(obj.scale, { x: s.x, y: s.y, z: s.z })
    .fromTo(obj.position, { y: p.y - 0.25 }, { y: p.y, duration: 0.5 }, 0);
}

function playIntroAnimation() {
  // Cibles et raycasters : apparition aléatoire
  const targetsTl = gsap.timeline();
  const letters = [];

  model.traverse((child) => {
    if (!child.isMesh) return;
    if (child.name.includes('_Target') || child.name.includes('_Raycaster')) {
      targetsTl.add(popIn(child), Math.random() * 0.5);
    }
    if (child.name.includes('_Letters')) letters.push(child);
  });

  // Lettres : une par une, dans l'ordre alphanumérique
  letters.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const lettersTl = gsap.timeline();
  letters.forEach((letter, i) => lettersTl.add(popIn(letter), i * 0.1));

  // Menu : planches puis boutons, en léger chevauchement
  const menuTl = gsap.timeline({
    defaults: { duration: 0.8, ease: 'back.out(1.8)' },
    onComplete: createDelayedHitboxes,
  });
  menuTl.timeScale(0.8);

  [
    [ui.plank1, undefined],
    [ui.plank2, '-=0.5'],
    [ui.workBtn, '-=0.6'],
    [ui.aboutBtn, '-=0.6'],
    [ui.contactBtn, '-=0.6'],
  ].forEach(([obj, position]) => {
    if (!obj) return;
    const { x, y, z } = obj.userData.initialScale;
    menuTl.to(obj.scale, { x, y, z }, position);
  });
}

// =====================================================================
// BOUCLE DE RENDU
// =====================================================================
function updateClockHands() {
  if (!hourHand || !minuteHand) return;
  const now = new Date();
  const minutes = now.getMinutes() + now.getSeconds() / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  minuteHand.rotation.x = -minutes * (Math.PI * 2 / 60);
  hourHand.rotation.x = -hours * (Math.PI * 2 / 12);
}

function updateChair() {
  if (!chairTop?.userData.initialRotation) return;
  const t = clock.elapsedTime * 0.5;
  const amplitude = Math.PI / 8;
  const offset = amplitude * Math.sin(t) * (1 - Math.abs(Math.sin(t)) * 0.3);
  chairTop.rotation.y = chairTop.userData.initialRotation.y + offset;
}

function updateCameraDebug() {
  const { position: p } = camera;
  const t = controls.target;
  $('#cam-pos').textContent = `${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}`;
  $('#cam-target').textContent = `${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)}`;
  $('#cam-dist').textContent = p.distanceTo(t).toFixed(2);
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);

  controls.update();
  updateClockHands();
  updateChair();

  xAxisFans.forEach((fan) => { fan.rotation.x -= CONFIG.fanSpeed * delta; });
  yAxisFans.forEach((fan) => { fan.rotation.y -= CONFIG.fanSpeed * delta; });

  updateHover();
  if (!dom.debugPanel.hidden) updateCameraDebug();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setMuted(false);
renderer.setAnimationLoop(animate);