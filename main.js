import Lenis from 'lenis';

const TOTAL_FRAMES = 240;

const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loadingOverlay = document.getElementById('loading');

const frames = new Array(TOTAL_FRAMES);
let currentFrameFloat = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;

// Resize canvas handling
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  if (lastRenderedFrame >= 0) {
    renderFrame(lastRenderedFrame);
  }
}

window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('orientationchange', resizeCanvas, { passive: true });

// Initialize Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Smooth scroll to anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      lenis.scrollTo(targetElement, { offset: -60, duration: 1.5 });
    }
  });
});

// Update active navigation link on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
  let currentSectionId = 'home';
  const scrollPosition = window.scrollY + 200;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('active');
    }
  });
}

// Generate frame image path
function getFramePath(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `./Cyber_Aldy/ezgif-frame-${frameNumber}.jpg`;
}

// Preload frames into ImageBitmap
async function preloadFrames() {
  const loadPromises = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const p = new Promise((resolve) => {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = async () => {
        try {
          const bitmap = await createImageBitmap(img);
          frames[i] = bitmap;
        } catch {
          frames[i] = img;
        }
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed frame ${i + 1}`);
        resolve();
      };
    });
    loadPromises.push(p);
  }

  await Promise.all(loadPromises);

  // Set initial dimensions
  resizeCanvas();

  // Hide loading spinner
  loadingOverlay.classList.add('hidden');

  // Start main render loop
  renderLoop();
}

// Calculate target frame from scroll
function calculateTargetFrame() {
  const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (maxScroll > 0) {
    const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
    targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  } else {
    targetFrame = 0;
  }
}

// Event listeners for scroll updates
window.addEventListener('scroll', () => {
  calculateTargetFrame();
  updateActiveNav();
}, { passive: true });

lenis.on('scroll', () => {
  calculateTargetFrame();
  updateActiveNav();
});

// Cover mode image drawing
function drawImageCover(img, targetWidth, targetHeight) {
  const imgWidth = img.width || 1920;
  const imgHeight = img.height || 1080;
  const imgRatio = imgWidth / imgHeight;
  const targetRatio = targetWidth / targetHeight;

  let dw, dh, dx, dy;

  if (targetRatio > imgRatio) {
    dw = targetWidth;
    dh = targetWidth / imgRatio;
    dx = 0;
    dy = (targetHeight - dh) / 2;
  } else {
    dh = targetHeight;
    dw = targetHeight * imgRatio;
    dx = (targetWidth - dw) / 2;
    dy = 0;
  }

  ctx.drawImage(img, dx, dy, dw, dh);
}

function renderFrame(index) {
  const frame = frames[index];
  if (frame) {
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawImageCover(frame, canvas.width, canvas.height);
  }
}

// Render loop with smooth lerp interpolation
function renderLoop() {
  calculateTargetFrame();

  const delta = targetFrame - currentFrameFloat;
  currentFrameFloat += delta * 0.15; // Smooth factor

  const frameToRender = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.round(currentFrameFloat))
  );

  if (frameToRender !== lastRenderedFrame) {
    renderFrame(frameToRender);
    lastRenderedFrame = frameToRender;
  }

  requestAnimationFrame(renderLoop);
}

// Preload
preloadFrames();
