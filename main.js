import Lenis from 'lenis';

const TOTAL_FRAMES = 240;
const BATCH_CONCURRENCY = 20; // Concurrent fetch workers for lightning fast preloading

const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loadingOverlay = document.getElementById('loading');
const loadPercentageEl = document.getElementById('loadPercentage');
const loaderProgressBarEl = document.getElementById('loaderProgressBar');

const frames = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let currentFrameFloat = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;

// Responsive Canvas Sizing
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

// Update active navigation link on scroll (Desktop & Mobile Dock)
const sections = document.querySelectorAll('section');
const allNavLinks = document.querySelectorAll('.nav-link, .mobile-bottom-link');

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

  allNavLinks.forEach((link) => {
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

// Single frame loader with progress notification
function loadFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getFramePath(index);
    img.onload = async () => {
      try {
        const bitmap = await createImageBitmap(img);
        frames[index] = bitmap;
      } catch {
        frames[index] = img;
      }
      onFrameLoaded();
      resolve();
    };
    img.onerror = () => {
      console.warn(`Failed to load frame ${index + 1}`);
      onFrameLoaded();
      resolve();
    };
  });
}

// Progress Bar & Percentage Counter Update
function onFrameLoaded() {
  loadedCount++;
  const percent = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));
  
  if (loadPercentageEl) {
    loadPercentageEl.textContent = percent;
  }
  if (loaderProgressBarEl) {
    loaderProgressBarEl.style.width = `${percent}%`;
  }
}

const PRIORITY_FRAMES = 15;

// Instant initial launch preloader (Priority frames 0-15 load in <0.3s)
async function preloadFrames() {
  // Phase 1: Load priority initial frames for instant launch
  const priorityPromises = [];
  for (let i = 0; i < PRIORITY_FRAMES; i++) {
    priorityPromises.push(loadFrame(i));
  }
  await Promise.all(priorityPromises);

  // Set initial canvas resolution
  resizeCanvas();
  renderFrame(0);

  // Instant launch (<0.3s)
  if (loadPercentageEl) loadPercentageEl.textContent = '100';
  if (loaderProgressBarEl) loaderProgressBarEl.style.width = '100%';

  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    renderLoop();
  }, 100);

  // Phase 2: Stream remaining 225 frames silently in background
  const queue = Array.from({ length: TOTAL_FRAMES - PRIORITY_FRAMES }, (_, i) => i + PRIORITY_FRAMES);
  const workers = Array.from({ length: BATCH_CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const index = queue.shift();
      if (index !== undefined) {
        await loadFrame(index);
      }
    }
  });

  await Promise.all(workers);
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

// Scroll Listeners
window.addEventListener('scroll', () => {
  calculateTargetFrame();
  updateActiveNav();
}, { passive: true });

lenis.on('scroll', () => {
  calculateTargetFrame();
  updateActiveNav();
});

// Fullscreen Cover Mode Image Drawing
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

// High performance render loop with smooth lerp interpolation
function renderLoop() {
  calculateTargetFrame();

  const delta = targetFrame - currentFrameFloat;
  currentFrameFloat += delta * 0.16; // Lightning smooth lerp factor

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

// Start Preloading
preloadFrames();
