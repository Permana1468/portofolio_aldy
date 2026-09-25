// Helper to safely sanitize HTML string
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('articleLoading');
  const errorEl = document.getElementById('articleError');
  const detailCard = document.getElementById('articleDetailCard');
  const relatedSection = document.getElementById('relatedNewsSection');

  const categoryEl = document.getElementById('articleCategory');
  const dateEl = document.getElementById('articleDate');
  const titleEl = document.getElementById('articleTitle');
  const imageEl = document.getElementById('articleImage');
  const contentEl = document.getElementById('articleContent');
  const relatedGrid = document.getElementById('relatedNewsGrid');

  // Parse article ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  if (!articleId) {
    showError();
    return;
  }

  try {
    // 1. Fetch single article detail
    const res = await fetch(`/api/berita?id=${encodeURIComponent(articleId)}`);
    const json = await res.json();

    if (!json.success || !json.data) {
      showError();
      return;
    }

    const article = json.data;

    // 2. Populate page metadata & title
    document.title = `${article.title} | Muhamad Aldiansyah`;
    if (categoryEl) categoryEl.textContent = article.category || 'Berita';
    if (dateEl) dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${escapeHTML(article.date || 'Terbaru')}`;
    if (titleEl) titleEl.textContent = article.title;
    if (imageEl) {
      imageEl.src = article.image_url || article.imageUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800';
      imageEl.alt = article.title;
    }

    // 3. Format body content into readable paragraphs
    if (contentEl) {
      const rawText = article.content || '';
      const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim() !== '');
      if (paragraphs.length > 0) {
        contentEl.innerHTML = paragraphs.map(p => `<p>${escapeHTML(p.trim())}</p>`).join('');
      } else {
        contentEl.innerHTML = `<p>${escapeHTML(rawText)}</p>`;
      }
    }

    // Hide loading, show article detail card
    if (loadingEl) loadingEl.classList.add('hidden');
    if (detailCard) detailCard.classList.remove('hidden');

    // 4. Setup Social Share buttons
    setupShareButtons(article);

    // 5. Fetch related news articles
    loadRelatedNews(articleId);

  } catch (err) {
    console.error('Error loading article:', err);
    showError();
  }

  function showError() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (detailCard) detailCard.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }

  function setupShareButtons(article) {
    const currentUrl = window.location.href;
    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    if (shareWhatsappBtn) {
      shareWhatsappBtn.addEventListener('click', () => {
        const text = encodeURIComponent(`*${article.title}*\n\nBaca selengkapnya di: ${currentUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    }

    if (shareTwitterBtn) {
      shareTwitterBtn.addEventListener('click', () => {
        const text = encodeURIComponent(`"${article.title}" - Muhamad Aldiansyah`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank');
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
          alert('Tautan artikel berhasil disalin ke clipboard!');
        }).catch(() => {
          alert('Gagal menyalin tautan.');
        });
      });
    }
  }

  async function loadRelatedNews(currentId) {
    if (!relatedGrid || !relatedSection) return;
    try {
      const res = await fetch('/api/berita');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const otherArticles = json.data.filter(a => String(a.id) !== String(currentId)).slice(0, 3);
        if (otherArticles.length > 0) {
          relatedGrid.innerHTML = otherArticles.map(item => `
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
          relatedSection.classList.remove('hidden');
        }
      }
    } catch (err) {
      console.warn('Gagal memuat berita terkait:', err);
    }
  }
});
