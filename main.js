import Lenis from 'lenis';

console.log(
  `%c
  ███╗   ███╗██╗   ██╗██╗  ██╗█████╗ ███╗   ███╗█████╗ ██████╗ 
  ████╗ ████║██║   ██║██║  ██║██╔══██╗████╗ ████║██╔══██╗██╔══██╗
  ██╔████╔██║██║   ██║███████║███████║██╔████╔██║███████║██║  ██║
  ██║╚██╔╝██║██║   ██║██╔══██║██╔══██║██║╚██╔╝██║██╔══██║██║  ██║
  ██║ ╚═╝ ██║╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██████╔╝
  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ 

  █████╗ ██╗     ██████╗ ██╗█████╗ ███╗   ██╗███████╗██╗   ██╗█████╗ ██╗  ██╗
 ██╔══██╗██║     ██╔══██╗██║██╔══██╗████╗  ██║██╔════╝╚██╗ ██╔╝██╔══██╗██║  ██║
 ███████║██║     ██║  ██║██║███████║██╔██╗ ██║███████╗ ╚████╔╝ ███████║███████║
 ██╔══██║██║     ██║  ██║██║██╔══██║██║╚██╗██║╚════██║  ╚██╔╝  ██╔══██║██╔══██║
 ██║  ██║███████╗██████╔╝██║██║  ██║██║ ╚████║███████║   ██║   ██║  ██║██║  ██║
 ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
  `,
  "color: #00d2ff; font-weight: bold; background: #080d1a; font-family: monospace; text-shadow: 0 0 10px #00d2ff; line-height: 1.1;"
);

console.log(
  "%c 💻 DEVELOPER %c MUHAMAD ALDIANSYAH ",
  "background: #00d2ff; color: #000000; font-size: 13px; font-weight: 900; font-family: monospace; padding: 4px 10px; border-radius: 4px 0 0 4px;",
  "background: #0f172a; color: #00d2ff; font-size: 13px; font-weight: 800; font-family: monospace; padding: 4px 12px; border: 1px solid #00d2ff; border-radius: 0 4px 4px 0;"
);

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

// Helper HTML Escaper for XSS Prevention
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Dynamic Ticking / Count-Up & Scramble Animation for Stats Section
function animateStats() {
  const statNumbers = document.querySelectorAll('.stat-number');

  statNumbers.forEach((el) => {
    const morph = el.dataset.morph;
    const target = el.dataset.target;
    const suffix = el.dataset.suffix || '';
    const textTarget = el.dataset.text;

    if (morph === 'percent-to-text') {
      animateMorphCard(el, false);
    } else if (target) {
      const endVal = parseInt(target, 10);
      const duration = 1600; // ms
      const startTime = performance.now();
      const scrambleChars = '0123456789!@#$%&';

      el.classList.add('ticking');

      function updateCounter(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeProgress * endVal);

        // Add cyber flicker effect while counting up
        if (progress < 1 && Math.random() < 0.3) {
          const fakeChar = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          el.textContent = `${currentVal}${fakeChar}`;
        } else {
          el.textContent = `${currentVal}${suffix}`;
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = `${endVal}${suffix}`;
          el.classList.remove('ticking');
        }
      }

      requestAnimationFrame(updateCounter);
    } else if (textTarget) {
      morphToWord(el, textTarget, 1200);
    }
  });
}

// Morphing function: 0% -> 100% -> Morph into "Full"
function animateMorphCard(el, isFast = false) {
  const finalWord = el.dataset.text || 'Full';
  const countDuration = isFast ? 600 : 1200;
  const startTime = performance.now();
  el.classList.add('ticking');

  function countUp(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / countDuration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(easeProgress * 100);

    el.textContent = `${currentVal}%`;

    if (progress < 1) {
      requestAnimationFrame(countUp);
    } else {
      el.textContent = '100%';
      // Brief pause at 100%, then scramble morph to target word
      setTimeout(() => {
        morphToWord(el, finalWord, isFast ? 350 : 600);
      }, 150);
    }
  }

  requestAnimationFrame(countUp);
}

// Rapid character scramble morph to final text
function morphToWord(el, word, duration) {
  const chars = '!@#$%^&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const startTime = performance.now();
  el.classList.add('ticking');

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress < 1) {
      let result = '';
      for (let i = 0; i < word.length; i++) {
        if (i < Math.floor(progress * word.length)) {
          result += word[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      el.textContent = result;
      requestAnimationFrame(step);
    } else {
      el.textContent = word;
      el.classList.remove('ticking');
    }
  }

  requestAnimationFrame(step);
}

// Re-trigger ticking counter effect when hovered for interactive responsiveness
document.querySelectorAll('.stat-card').forEach((card) => {
  card.addEventListener('mouseenter', () => {
    const numEl = card.querySelector('.stat-number');
    if (!numEl || numEl.classList.contains('ticking')) return;

    const morph = numEl.dataset.morph;
    const target = numEl.dataset.target;
    const suffix = numEl.dataset.suffix || '';
    const textTarget = numEl.dataset.text;

    if (morph === 'percent-to-text') {
      animateMorphCard(numEl, true);
    } else if (target) {
      const endVal = parseInt(target, 10);
      const duration = 600;
      const startTime = performance.now();
      numEl.classList.add('ticking');

      function quickTick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const currentVal = Math.floor(progress * endVal);
        numEl.textContent = `${currentVal}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(quickTick);
        } else {
          numEl.textContent = `${endVal}${suffix}`;
          numEl.classList.remove('ticking');
        }
      }
      requestAnimationFrame(quickTick);
    } else if (textTarget) {
      morphToWord(numEl, textTarget, 400);
    }
  });
});

// IntersectionObserver to trigger animation when stats section enters view
const statsGridEl = document.querySelector('.stats-grid');
if (statsGridEl) {
  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          animateStats();
        }
      });
    },
    { threshold: 0.2 }
  );
  observer.observe(statsGridEl);
}

// ==========================================================================
// Vercel Postgres & Vercel Blob Integration (News & Image Upload)
// ==========================================================================
const newsGrid = document.getElementById('newsGrid');
const newsModal = document.getElementById('newsModal');
const openNewsModalBtn = document.getElementById('openNewsModalBtn');
const closeNewsModalBtn = document.getElementById('closeNewsModalBtn');
const cancelNewsBtn = document.getElementById('cancelNewsBtn');
const addNewsForm = document.getElementById('addNewsForm');
const newsImageFileInput = document.getElementById('newsImageFile');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const submitBtnText = document.getElementById('submitBtnText');
const submitNewsBtn = document.getElementById('submitNewsBtn');

let selectedFile = null;

// Render News Items to DOM (XSS Safe & Clickable)
function renderNewsCards(articles) {
  if (!newsGrid) return;
  if (!articles || articles.length === 0) {
    newsGrid.innerHTML = `
      <div class="news-loading">
        <p>Belum ada artikel berita yang dipublikasikan.</p>
      </div>
    `;
    return;
  }

  newsGrid.innerHTML = articles.map(item => `
    <a href="./berita.html?id=${item.id}" class="news-card-link">
      <article class="news-card">
        <div class="news-card-img-wrapper">
          <img src="${escapeHTML(item.image_url || item.imageUrl)}" alt="${escapeHTML(item.title)}" class="news-card-img" loading="lazy">
          <span class="news-category-tag">${escapeHTML(item.category || 'Berita')}</span>
        </div>
        <div class="news-card-body">
          <span class="news-card-date">${escapeHTML(item.date || 'Terbaru')}</span>
          <h3 class="news-card-title">${escapeHTML(item.title)}</h3>
          <p class="news-card-desc">${escapeHTML(item.content)}</p>
        </div>
      </article>
    </a>
  `).join('');
}

// Load News from API endpoint
async function loadNews() {
  if (!newsGrid) return;
  try {
    const res = await fetch('/api/berita');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      renderNewsCards(json.data);
    } else {
      renderNewsCards([]);
    }
  } catch (err) {
    console.error('Gagal mengambil berita:', err);
    renderNewsCards([]);
  }
}

// Modal Toggle Handlers
if (openNewsModalBtn) {
  openNewsModalBtn.addEventListener('click', () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      if (confirm('Menambah berita memerlukan otentikasi Admin. Ingin menuju ke halaman Login Admin?')) {
        window.location.href = './login.html';
      }
      return;
    }
    if (newsModal) newsModal.classList.remove('hidden');
  });
}

function closeModal() {
  if (newsModal) newsModal.classList.add('hidden');
  if (addNewsForm) addNewsForm.reset();
  if (previewContainer) previewContainer.classList.add('hidden');
  if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
  selectedFile = null;
}

if (closeNewsModalBtn) closeNewsModalBtn.addEventListener('click', closeModal);
if (cancelNewsBtn) cancelNewsBtn.addEventListener('click', closeModal);

// File Selection & Preview
if (newsImageFileInput) {
  newsImageFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (evt) => {
        imagePreview.src = evt.target.result;
        uploadPlaceholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });
}

// Submit Form (Upload to Vercel Blob -> Save to Database)
if (addNewsForm) {
  addNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    if (!token) {
      alert('Sesi admin berakhir. Silakan login sebagai admin terlebih dahulu.');
      window.location.href = './login.html';
      return;
    }

    if (!selectedFile) {
      alert('Pilih foto terlebih dahulu untuk di-upload.');
      return;
    }

    const title = document.getElementById('newsTitle').value.trim();
    const category = document.getElementById('newsCategory').value;
    const content = document.getElementById('newsContent').value.trim();

    try {
      submitNewsBtn.disabled = true;
      submitBtnText.textContent = 'Mengunggah Foto ke Vercel Blob...';

      // 1. Upload photo to Vercel Blob API with Auth Token
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: selectedFile
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Upload foto gagal');
      }

      const imageUrl = uploadData.url;
      submitBtnText.textContent = 'Menyimpan Berita ke Database...';

      // 2. Save news item to API/Database with Auth Token
      const newsRes = await fetch('/api/berita', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, category, content, imageUrl })
      });

      const newsData = await newsRes.json();
      if (!newsRes.ok || !newsData.success) {
        throw new Error(newsData.error || 'Gagal menyimpan artikel');
      }

      alert('Berhasil! Foto terunggah ke Vercel Blob dan berita tersimpan.');
      closeModal();
      loadNews();
    } catch (error) {
      console.error('Error submit news:', error);
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      submitNewsBtn.disabled = false;
      submitBtnText.textContent = 'Simpan Berita & Foto';
    }
  });
}

// Contact Form Handler (Saves to Admin Dashboard & Database)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageData: { name, email, message }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pesan Anda telah berhasil terkirim dan disimpan! Terima kasih.');
        contactForm.reset();
      } else {
        alert(data.error || 'Gagal mengirim pesan.');
      }
    } catch (err) {
      alert('Pesan Anda telah dikirim! Terima kasih.');
      contactForm.reset();
    }
  });
}

// Apply social media links dynamically to landing page icons
function applySocialLinks(social) {
  if (!social) return;
  const mappings = {
    github: social.github,
    linkedin: social.linkedin,
    instagram: social.instagram,
    twitter: social.twitter,
    whatsapp: social.whatsapp ? (social.whatsapp.startsWith('http') ? social.whatsapp : `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, '')}`) : null,
    email: social.email ? (social.email.startsWith('mailto:') ? social.email : `mailto:${social.email}`) : null,
  };

  Object.entries(mappings).forEach(([key, url]) => {
    if (!url) return;
    const targets = document.querySelectorAll(`.social-${key}-link`);
    targets.forEach((el) => {
      el.href = url;
    });
  });
}

// Projects Carousel State & Logic (3D Coverflow Infinite Autoplay Mode)
let projectsCarouselState = {
  currentIndex: 0,
  totalProjects: 0,
  startX: 0,
  isDragging: false,
  autoPlayTimer: null
};

function startProjectsAutoplay() {
  stopProjectsAutoplay();
  projectsCarouselState.autoPlayTimer = setInterval(() => {
    if (projectsCarouselState.totalProjects > 1) {
      projectsCarouselState.currentIndex = (projectsCarouselState.currentIndex + 1) % projectsCarouselState.totalProjects;
      updateCarouselPosition();
    }
  }, 3500);
}

function stopProjectsAutoplay() {
  if (projectsCarouselState.autoPlayTimer) {
    clearInterval(projectsCarouselState.autoPlayTimer);
    projectsCarouselState.autoPlayTimer = null;
  }
}

function getCircularDiff(idx, activeIndex, total) {
  if (total <= 0) return 0;
  let diff = (idx - activeIndex) % total;
  if (diff < -Math.floor(total / 2)) diff += total;
  if (diff > Math.floor(total / 2)) diff -= total;
  return diff;
}

function updateCarouselPosition() {
  const track = document.getElementById('projectsCarouselTrack');
  const prevBtn = document.getElementById('projPrevBtn');
  const nextBtn = document.getElementById('projNextBtn');

  if (!track) return;

  const cards = Array.from(track.children);
  if (cards.length === 0) return;

  const total = cards.length;
  projectsCarouselState.totalProjects = total;

  // Wrap around index safely
  projectsCarouselState.currentIndex = ((projectsCarouselState.currentIndex % total) + total) % total;
  const activeIndex = projectsCarouselState.currentIndex;

  cards.forEach((card, idx) => {
    // Reset state classes
    card.classList.remove(
      'coverflow-center',
      'coverflow-left-1',
      'coverflow-right-1',
      'coverflow-far-left',
      'coverflow-far-right'
    );

    const diff = getCircularDiff(idx, activeIndex, total);

    if (diff === 0) {
      card.classList.add('coverflow-center');
    } else if (diff === -1) {
      card.classList.add('coverflow-left-1');
    } else if (diff === 1) {
      card.classList.add('coverflow-right-1');
    } else if (diff < 0) {
      card.classList.add('coverflow-far-left');
    } else {
      card.classList.add('coverflow-far-right');
    }

    // Allow clicking side cards to bring them into center focus
    card.onclick = (e) => {
      if (idx !== projectsCarouselState.currentIndex) {
        if (e.target.closest('a')) {
          e.preventDefault();
        }
        projectsCarouselState.currentIndex = idx;
        updateCarouselPosition();
        startProjectsAutoplay();
      }
    };
  });

  if (prevBtn) prevBtn.disabled = false;
  if (nextBtn) nextBtn.disabled = false;
}

function initProjectsCarousel() {
  const prevBtn = document.getElementById('projPrevBtn');
  const nextBtn = document.getElementById('projNextBtn');
  const container = document.querySelector('.projects-carousel-container');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (projectsCarouselState.totalProjects > 0) {
        projectsCarouselState.currentIndex = (projectsCarouselState.currentIndex - 1 + projectsCarouselState.totalProjects) % projectsCarouselState.totalProjects;
        updateCarouselPosition();
        startProjectsAutoplay();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (projectsCarouselState.totalProjects > 0) {
        projectsCarouselState.currentIndex = (projectsCarouselState.currentIndex + 1) % projectsCarouselState.totalProjects;
        updateCarouselPosition();
        startProjectsAutoplay();
      }
    };
  }

  window.addEventListener('resize', () => {
    updateCarouselPosition();
  });

  if (container) {
    container.addEventListener('mouseenter', () => {
      stopProjectsAutoplay();
    });

    container.addEventListener('mouseleave', () => {
      startProjectsAutoplay();
    });

    container.addEventListener('touchstart', (e) => {
      stopProjectsAutoplay();
      projectsCarouselState.startX = e.touches[0].clientX;
      projectsCarouselState.isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!projectsCarouselState.isDragging) return;
      projectsCarouselState.isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - projectsCarouselState.startX;

      if (diffX < -40) {
        projectsCarouselState.currentIndex = (projectsCarouselState.currentIndex + 1) % projectsCarouselState.totalProjects;
        updateCarouselPosition();
      } else if (diffX > 40) {
        projectsCarouselState.currentIndex = (projectsCarouselState.currentIndex - 1 + projectsCarouselState.totalProjects) % projectsCarouselState.totalProjects;
        updateCarouselPosition();
      }
      startProjectsAutoplay();
    }, { passive: true });
  }

  updateCarouselPosition();
  startProjectsAutoplay();
}

// Render Projects Cards dynamically if updated from Admin Panel
function renderProjectsCards(projects) {
  const track = document.getElementById('projectsCarouselTrack') || document.querySelector('.projects-grid');
  if (!track || !Array.isArray(projects) || projects.length === 0) return;

  track.innerHTML = projects.map((p, idx) => {
    const isFeatured = idx === 0 || (p.url && p.url.includes('desacimanggusatu'));
    const techSpans = Array.isArray(p.tech) ? p.tech.map(t => `<span>${escapeHTML(t)}</span>`).join('') : (p.tech ? `<span>${escapeHTML(p.tech)}</span>` : '');
    const hasUrl = p.url && p.url !== '#';

    return `
      <div class="glass-card project-card ${isFeatured ? 'featured-card' : ''}">
        <div class="project-header">
          <span class="project-tag">${escapeHTML(p.tag || 'Proyek')}</span>
          ${hasUrl ? `
            <a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer" class="project-arrow-btn" aria-label="${escapeHTML(p.title)}" title="${escapeHTML(p.title)}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ` : `
            <div class="project-arrow-btn disabled">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
          `}
        </div>
        <h3 class="project-title">
          ${hasUrl ? `<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer" class="project-title-link">${escapeHTML(p.title)}</a>` : escapeHTML(p.title)}
        </h3>
        <p class="project-desc">${escapeHTML(p.desc)}</p>
        <div class="project-footer">
          <div class="project-tech">
            ${techSpans}
          </div>
          ${hasUrl ? `
            <a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer" class="project-visit-btn">
              <span>Kunjungi Website</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  updateCarouselPosition();
}

// Sync Landing Page Content & Social Links from API / LocalStorage
async function syncLandingContent() {
  // First load from local storage if available for instant UI update
  try {
    const localSocial = localStorage.getItem('admin_social_data');
    if (localSocial) {
      applySocialLinks(JSON.parse(localSocial));
    }
  } catch (e) {
    console.warn('LocalStorage social read error:', e);
  }

  try {
    const res = await fetch('/api/content');
    const json = await res.json();
    if (json.success && json.data) {
      if (json.data.hero) {
        const { hero } = json.data;
        const subtitleEl = document.querySelector('.hero-subtitle');
        const titleEl = document.querySelector('.hero-title');
        const taglineEl = document.querySelector('.hero-tagline');
        const descEl = document.querySelector('.hero-description');

        if (subtitleEl && hero.subtitle) subtitleEl.textContent = hero.subtitle;
        if (titleEl && hero.titleLine1) titleEl.innerHTML = `${escapeHTML(hero.titleLine1)}<br>${escapeHTML(hero.titleLine2 || '')}`;
        if (taglineEl && hero.tagline) taglineEl.textContent = hero.tagline;
        if (descEl && hero.description) descEl.textContent = hero.description;
      }

      if (json.data.projects) {
        renderProjectsCards(json.data.projects);
      }

      if (json.data.social) {
        applySocialLinks(json.data.social);
      }
    }
  } catch (e) {
    // Keep default content if offline
  }
}

// Initial load
loadNews();
syncLandingContent();
initProjectsCarousel();


