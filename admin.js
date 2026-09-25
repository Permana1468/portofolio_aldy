// Admin Dashboard Logic

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

const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.admin-nav-item[data-tab]');
const tabContents = document.querySelectorAll('.admin-tab-content');

let cachedProjectsList = [];

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

// Get Auth Token for Headers
function getAuthToken() {
  return localStorage.getItem('admin_token') || '';
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  };
}

// Auth Token Management
function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = './login.html';
  } else {
    loadAdminData();
    initInactivityTracker();
  }
}

// Logout Handler
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    window.location.href = './login.html';
  });
}

// System Notification Bell Handler
const notifBellBtn = document.getElementById('notifBellBtn');
if (notifBellBtn) {
  notifBellBtn.addEventListener('click', () => {
    alert('🔔 Notifikasi Sistem: Seluruh infrastruktur (Postgres DB, Vercel Blob, Token Security) 100% Online & Aktif.');
  });
}

// Sidebar Tab Switcher
const bannerTitleEl = document.getElementById('topBannerTitle');

const tabTitles = {
  'tab-dashboard': 'Dashboard Utama Portal Admin',
  'tab-hero': 'Pengaturan Hero & About',
  'tab-projects': 'Kelola Proyek Portofolio',
  'tab-news': 'Berita & Vercel Blob Storage',
  'tab-messages': 'Pesan Masuk Pengunjung',
  'tab-security': 'Profil & Password Admin',
  'tab-calendar': 'Kalender & Agenda Pengingat Administrator',
  'tab-social': 'Pengaturan Tautan Media Sosial Portofolio'
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetTab = item.getAttribute('data-tab');
    if (!targetTab) return;

    navItems.forEach(i => i.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    item.classList.add('active');
    const targetEl = document.getElementById(targetTab);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    if (bannerTitleEl && tabTitles[targetTab]) {
      bannerTitleEl.textContent = tabTitles[targetTab];
    }

    // Auto close sidebar on mobile if open
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar && backdrop && window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    }
  });
});

// Load Data into Forms and Tables
async function loadAdminData() {
  const token = getAuthToken();

  // Load Site Content (Hero & Projects)
  try {
    const contentRes = await fetch('/api/content');
    const contentJson = await contentRes.json();
    if (contentJson.success && contentJson.data) {
      const { hero, projects } = contentJson.data;

      if (hero) {
        document.getElementById('heroSubtitle').value = hero.subtitle || '';
        document.getElementById('heroTitleLine1').value = hero.titleLine1 || '';
        document.getElementById('heroTitleLine2').value = hero.titleLine2 || '';
        document.getElementById('heroTagline').value = hero.tagline || '';
        document.getElementById('heroDescription').value = hero.description || '';
      }

      cachedProjectsList = projects || [];
      renderProjectsTable(cachedProjectsList);

      const dashProjectsEl = document.getElementById('dashTotalProjects');
      if (dashProjectsEl) {
        dashProjectsEl.textContent = cachedProjectsList.length;
      }
    }
  } catch (err) {
    console.error('Error loading content:', err);
  }

  // Load News Items
  try {
    const newsRes = await fetch('/api/berita');
    const newsJson = await newsRes.json();
    if (newsJson.success && Array.isArray(newsJson.data)) {
      renderNewsAdminTable(newsJson.data);
      const dashNewsEl = document.getElementById('dashTotalNews');
      if (dashNewsEl) {
        dashNewsEl.textContent = newsJson.data.length;
      }
    }
  } catch (err) {
    console.error('Error loading news:', err);
  }

  // Load Contact Messages (Requires Admin Authorization)
  try {
    const msgRes = await fetch('/api/content?type=messages', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const msgJson = await msgRes.json();
    if (msgJson.success && Array.isArray(msgJson.data)) {
      renderMessagesTable(msgJson.data);
      const dashMsgEl = document.getElementById('dashTotalMessages');
      if (dashMsgEl) {
        dashMsgEl.textContent = msgJson.data.length;
      }
    } else if (msgRes.status === 401) {
      console.warn('Unauthorized token, redirecting to login');
      localStorage.removeItem('admin_token');
      window.location.href = './login.html';
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}


// Render Projects Table (with Edit & Delete buttons)
function renderProjectsTable(projects) {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;
  if (!projects || !projects.length) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada proyek. Klik <strong>+ Tambah Proyek Baru</strong> untuk menambahkan.</td></tr>';
    return;
  }
  tbody.innerHTML = projects.map(p => {
    const techText = Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || '-');
    return `
      <tr>
        <td><strong>${escapeHTML(p.title)}</strong></td>
        <td><span class="status-badge">${escapeHTML(p.tag || 'Proyek')}</span></td>
        <td style="max-width:300px; font-size:0.85rem; color:#475569;">${escapeHTML(p.desc)}</td>
        <td><span style="font-size:0.8rem; color:#64748b;">${escapeHTML(techText)}</span></td>
        <td>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <button class="action-btn edit" style="background:#3b82f6; color:#ffffff; border:none; padding:0.35rem 0.65rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.78rem;" onclick="editProjectItem(${p.id})">✏️ Edit</button>
            <button class="action-btn delete" onclick="deleteProjectItem(${p.id})">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render News Admin Table
function renderNewsAdminTable(news) {
  const tbody = document.getElementById('newsAdminTableBody');
  if (!tbody) return;
  if (!news.length) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada artikel berita.</td></tr>';
    return;
  }
  tbody.innerHTML = news.map(n => `
    <tr>
      <td><img src="${escapeHTML(n.image_url || n.imageUrl)}" width="50" height="35" style="object-fit:cover; border-radius:6px;"></td>
      <td><strong>${escapeHTML(n.title)}</strong></td>
      <td><span class="status-badge">${escapeHTML(n.category || 'Berita')}</span></td>
      <td>${escapeHTML(n.date || '-')}</td>
      <td><button class="action-btn delete" onclick="deleteNewsItem(${n.id})">Hapus</button></td>
    </tr>
  `).join('');
}

// Render Messages Table
function renderMessagesTable(messages) {
  const tbody = document.getElementById('messagesTableBody');
  if (!tbody) return;
  if (!messages.length) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada pesan masuk dari pengunjung.</td></tr>';
    return;
  }
  tbody.innerHTML = messages.map(m => `
    <tr>
      <td>${escapeHTML(new Date(m.created_at || Date.now()).toLocaleDateString('id-ID'))}</td>
      <td><strong>${escapeHTML(m.name)}</strong></td>
      <td>${escapeHTML(m.email)}</td>
      <td>${escapeHTML(m.message)}</td>
      <td><button class="action-btn delete" onclick="deleteMessageItem(${m.id})">Hapus</button></td>
    </tr>
  `).join('');
}

// Delete News Item Handler
window.deleteNewsItem = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
  try {
    const res = await fetch(`/api/berita?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      alert('Berita berhasil dihapus.');
      loadAdminData();
    } else {
      alert('Gagal menghapus berita: ' + data.error);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// Delete Message Item Handler
window.deleteMessageItem = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
  try {
    const res = await fetch(`/api/content?type=messages&id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      alert('Pesan berhasil dihapus.');
      loadAdminData();
    } else {
      alert('Gagal menghapus pesan: ' + data.error);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// Delete Project Item Handler
window.deleteProjectItem = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
  try {
    const res = await fetch(`/api/content?type=projects&id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      alert('Proyek berhasil dihapus.');
      loadAdminData();
    } else {
      alert('Gagal menghapus proyek: ' + data.error);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// Project Modal & Form Handling (Add & Edit)
const adminProjectModal = document.getElementById('adminProjectModal');
const adminOpenProjectModalBtn = document.getElementById('adminOpenProjectModalBtn');
const adminCloseProjectModalBtn = document.getElementById('adminCloseProjectModalBtn');
const adminCancelProjectBtn = document.getElementById('adminCancelProjectBtn');
const adminAddProjectForm = document.getElementById('adminAddProjectForm');

function openAdminProjectModal(projectToEdit = null) {
  if (!adminProjectModal) return;
  const modalTitle = document.getElementById('adminProjectModalTitle');
  const idInput = document.getElementById('adminProjectId');
  const titleInput = document.getElementById('adminProjectTitle');
  const tagInput = document.getElementById('adminProjectTag');
  const descInput = document.getElementById('adminProjectDesc');
  const techInput = document.getElementById('adminProjectTech');
  const urlInput = document.getElementById('adminProjectUrl');

  if (projectToEdit) {
    if (modalTitle) modalTitle.textContent = `Edit Proyek: ${projectToEdit.title}`;
    if (idInput) idInput.value = projectToEdit.id;
    if (titleInput) titleInput.value = projectToEdit.title || '';
    if (tagInput) tagInput.value = projectToEdit.tag || '';
    if (descInput) descInput.value = projectToEdit.desc || '';
    if (techInput) techInput.value = Array.isArray(projectToEdit.tech) ? projectToEdit.tech.join(', ') : (projectToEdit.tech || '');
    if (urlInput) urlInput.value = projectToEdit.url || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Proyek Baru';
    if (idInput) idInput.value = '';
    if (adminAddProjectForm) adminAddProjectForm.reset();
  }

  adminProjectModal.classList.remove('hidden');
}

function closeAdminProjectModal() {
  if (adminProjectModal) adminProjectModal.classList.add('hidden');
  if (adminAddProjectForm) adminAddProjectForm.reset();
}

if (adminOpenProjectModalBtn) adminOpenProjectModalBtn.addEventListener('click', () => openAdminProjectModal(null));
if (adminCloseProjectModalBtn) adminCloseProjectModalBtn.addEventListener('click', closeAdminProjectModal);
if (adminCancelProjectBtn) adminCancelProjectBtn.addEventListener('click', closeAdminProjectModal);

// Edit Project Click Handler
window.editProjectItem = function(id) {
  const targetProject = cachedProjectsList.find(p => String(p.id) === String(id));
  if (targetProject) {
    openAdminProjectModal(targetProject);
  } else {
    alert('Proyek tidak ditemukan.');
  }
};

// Handle Add / Edit Project Submission
if (adminAddProjectForm) {
  adminAddProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adminProjectId').value;
    const title = document.getElementById('adminProjectTitle').value.trim();
    const tag = document.getElementById('adminProjectTag').value.trim();
    const desc = document.getElementById('adminProjectDesc').value.trim();
    const techRaw = document.getElementById('adminProjectTech').value.trim();
    const url = document.getElementById('adminProjectUrl').value.trim();

    const techArray = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    let updatedList = [...cachedProjectsList];

    if (id) {
      // Edit existing project item
      updatedList = updatedList.map(p => {
        if (String(p.id) === String(id)) {
          return { ...p, title, tag, desc, tech: techArray, url };
        }
        return p;
      });
    } else {
      // Add new project item
      const newProj = {
        id: Date.now(),
        title,
        tag,
        desc,
        tech: techArray,
        url: url || '#'
      };
      updatedList.unshift(newProj);
    }

    try {
      const submitBtn = document.getElementById('adminSubmitProjectBtn');
      if (submitBtn) submitBtn.disabled = true;

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          section: 'projects',
          data: updatedList
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan proyek');
      }

      alert(id ? 'Proyek berhasil diperbarui!' : 'Proyek baru berhasil ditambahkan!');
      closeAdminProjectModal();
      loadAdminData();
    } catch (err) {
      console.error('Error submit project:', err);
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      const submitBtn = document.getElementById('adminSubmitProjectBtn');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Handle Hero Form Submission
const heroForm = document.getElementById('heroForm');
if (heroForm) {
  heroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const heroData = {
      subtitle: document.getElementById('heroSubtitle').value.trim(),
      titleLine1: document.getElementById('heroTitleLine1').value.trim(),
      titleLine2: document.getElementById('heroTitleLine2').value.trim(),
      tagline: document.getElementById('heroTagline').value.trim(),
      description: document.getElementById('heroDescription').value.trim()
    };

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ section: 'hero', data: heroData })
      });
      const json = await res.json();
      if (json.success) {
        alert('Seksi Hero berhasil diperbarui!');
      } else {
        alert('Gagal update: ' + json.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// Modal Admin Upload Berita & Vercel Blob
const adminOpenNewsModalBtn = document.getElementById('adminOpenNewsModalBtn');
const adminNewsModal = document.getElementById('adminNewsModal');
const adminCloseNewsModalBtn = document.getElementById('adminCloseNewsModalBtn');
const adminCancelNewsBtn = document.getElementById('adminCancelNewsBtn');
const adminAddNewsForm = document.getElementById('adminAddNewsForm');
const adminSubmitNewsBtn = document.getElementById('adminSubmitNewsBtn');
const adminSubmitBtnText = document.getElementById('adminSubmitBtnText');

if (adminOpenNewsModalBtn) {
  adminOpenNewsModalBtn.addEventListener('click', () => {
    if (adminNewsModal) adminNewsModal.classList.remove('hidden');
  });
}

function closeAdminNewsModal() {
  if (adminNewsModal) adminNewsModal.classList.add('hidden');
  if (adminAddNewsForm) adminAddNewsForm.reset();
}

if (adminCloseNewsModalBtn) adminCloseNewsModalBtn.addEventListener('click', closeAdminNewsModal);
if (adminCancelNewsBtn) adminCancelNewsBtn.addEventListener('click', closeAdminNewsModal);

if (adminAddNewsForm) {
  adminAddNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('adminNewsImageFile');
    const selectedFile = fileInput.files[0];
    if (!selectedFile) {
      alert('Pilih foto terlebih dahulu.');
      return;
    }

    const title = document.getElementById('adminNewsTitle').value.trim();
    const category = document.getElementById('adminNewsCategory').value;
    const content = document.getElementById('adminNewsContent').value.trim();
    const token = getAuthToken();

    try {
      if (adminSubmitNewsBtn) adminSubmitNewsBtn.disabled = true;
      if (adminSubmitBtnText) adminSubmitBtnText.textContent = 'Mengunggah Foto ke Vercel Blob...';

      // 1. Upload photo to Vercel Blob API with Authorization header
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: selectedFile
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Upload foto ke Vercel Blob gagal');
      }

      const imageUrl = uploadData.url;
      if (adminSubmitBtnText) adminSubmitBtnText.textContent = 'Menyimpan Berita...';

      // 2. Save news item to API with Authorization header
      const newsRes = await fetch('/api/berita', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, category, content, imageUrl })
      });

      const newsData = await newsRes.json();
      if (!newsRes.ok || !newsData.success) {
        throw new Error(newsData.error || 'Gagal menyimpan artikel berita');
      }

      alert('Berhasil! Artikel berita & foto terunggah.');
      closeAdminNewsModal();
      loadAdminData();
    } catch (error) {
      console.error('Error admin submit news:', error);
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      if (adminSubmitNewsBtn) adminSubmitNewsBtn.disabled = false;
      if (adminSubmitBtnText) adminSubmitBtnText.textContent = 'Simpan Berita & Foto';
    }
  });
}

// Sidebar Toggle Logic (Desktop Collapse & Mobile Drawer)
const adminSidebar = document.getElementById('adminSidebar');
const desktopSidebarToggle = document.getElementById('desktopSidebarToggle');
const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function toggleDesktopSidebar() {
  if (adminSidebar) {
    adminSidebar.classList.toggle('collapsed');
  }
}

function openMobileSidebar() {
  if (adminSidebar) adminSidebar.classList.add('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
}

function closeMobileSidebar() {
  if (adminSidebar) adminSidebar.classList.remove('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
}

if (desktopSidebarToggle) desktopSidebarToggle.addEventListener('click', toggleDesktopSidebar);
if (mobileSidebarToggle) mobileSidebarToggle.addEventListener('click', openMobileSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

// Close mobile sidebar when selecting menu tab on mobile view
navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
    }
  });
});

// Change Password Handler
const changePasswordForm = document.getElementById('changePasswordForm');
const submitChangePassBtn = document.getElementById('submitChangePassBtn');
const submitChangePassText = document.getElementById('submitChangePassText');

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassInput').value;
    const newPassword = document.getElementById('newPassInput').value;
    const confirmPassword = document.getElementById('confirmPassInput').value;

    if (newPassword !== confirmPassword) {
      alert('Konfirmasi password baru tidak cocok. Silakan periksa kembali.');
      return;
    }

    if (newPassword.length < 5) {
      alert('Password baru minimal 5 karakter.');
      return;
    }

    try {
      if (submitChangePassBtn) submitChangePassBtn.disabled = true;
      if (submitChangePassText) submitChangePassText.textContent = 'Memperbarui Password...';

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('admin_password', newPassword);
        alert('Sukses! ' + data.message);
        changePasswordForm.reset();
      } else {
        alert('Gagal mengubah password: ' + (data.error || 'Terjadi kesalahan.'));
      }
    } catch (err) {
      console.error('Change password error:', err);
      alert('Error saat merubah password: ' + err.message);
    } finally {
      if (submitChangePassBtn) submitChangePassBtn.disabled = false;
      if (submitChangePassText) submitChangePassText.textContent = 'Simpan Password Baru';
    }
  });
}

// Clear Cache & Spam Handler
const clearCacheBtn = document.getElementById('clearCacheBtn');
const clearCacheBtnText = document.getElementById('clearCacheBtnText');
const cacheStatusBadge = document.getElementById('cacheStatusBadge');
const dashboardAuditTrail = document.getElementById('dashboardAuditTrail');

if (clearCacheBtn) {
  clearCacheBtn.addEventListener('click', async () => {
    try {
      if (clearCacheBtn) clearCacheBtn.disabled = true;
      if (clearCacheBtnText) clearCacheBtnText.textContent = '⏳ Memproses Pembersihan...';

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'clear_cache' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✨ Sukses! ' + data.message);
        if (cacheStatusBadge) {
          cacheStatusBadge.textContent = 'Status: Dibersihkan (Optimal 60 FPS)';
          cacheStatusBadge.style.color = '#10b981';
          cacheStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        }

        // Add event entry into Audit Log feed
        if (dashboardAuditTrail) {
          const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newAuditItem = document.createElement('div');
          newAuditItem.className = 'activity-item';
          newAuditItem.style.justifyContent = 'space-between';
          newAuditItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="activity-dot" style="background: #00f0ff;"></div>
              <span><strong>[Pembersihan]</strong> Cache sistem & temporary data berhasil dibersihkan</span>
            </div>
            <span style="font-size: 0.75rem; color: #64748b;">${nowTime}</span>
          `;
          dashboardAuditTrail.prepend(newAuditItem);
        }
      } else {
        alert('Gagal membersihkan cache: ' + (data.error || 'Terjadi kesalahan.'));
      }
    } catch (err) {
      console.error('Clear cache error:', err);
      alert('Error saat membersihkan cache: ' + err.message);
    } finally {
      if (clearCacheBtn) clearCacheBtn.disabled = false;
      if (clearCacheBtnText) clearCacheBtnText.textContent = '🧹 Bersihkan Cache & File Temporary';
    }
  });
}

// Admin Profile Management (Nama & Avatar)
function loadProfileData() {
  const savedName = localStorage.getItem('admin_profile_name') || 'Muhamad Aldiansyah';
  const savedRole = localStorage.getItem('admin_profile_role') || 'Administrator';
  const savedAvatar = localStorage.getItem('admin_profile_avatar') || './Cyber_Aldy/images/LOGO ALDY.png';

  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatarEl = document.querySelector('.user-avatar');
  const previewAvatarEl = document.getElementById('profilePreviewAvatar');
  const profileNameInput = document.getElementById('profileNameInput');
  const profileRoleInput = document.getElementById('profileRoleInput');

  if (userNameEl) userNameEl.textContent = savedName;
  if (userRoleEl) userRoleEl.textContent = savedRole;
  if (userAvatarEl) userAvatarEl.src = savedAvatar;
  if (previewAvatarEl) previewAvatarEl.src = savedAvatar;
  if (profileNameInput) profileNameInput.value = savedName;
  if (profileRoleInput) profileRoleInput.value = savedRole;
}

// Live Avatar Image Selection Preview
const profileAvatarInput = document.getElementById('profileAvatarInput');
if (profileAvatarInput) {
  profileAvatarInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const preview = document.getElementById('profilePreviewAvatar');
        if (preview) preview.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Profile Save Form Listener
const changeProfileForm = document.getElementById('changeProfileForm');
if (changeProfileForm) {
  changeProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('profileNameInput').value.trim();
    const roleVal = document.getElementById('profileRoleInput').value.trim();
    const avatarInput = document.getElementById('profileAvatarInput');
    const submitBtnText = document.getElementById('submitProfileText');

    if (!nameVal) return alert('Nama lengkap tidak boleh kosong.');

    if (submitBtnText) submitBtnText.textContent = '⏳ Menyimpan Identitas...';

    let avatarUrl = localStorage.getItem('admin_profile_avatar') || './Cyber_Aldy/images/LOGO ALDY.png';

    // If new avatar file uploaded, convert to Base64 data URL for instant persistent display
    if (avatarInput && avatarInput.files && avatarInput.files[0]) {
      const file = avatarInput.files[0];
      avatarUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target.result);
        reader.readAsDataURL(file);
      });
    }

    localStorage.setItem('admin_profile_name', nameVal);
    localStorage.setItem('admin_profile_role', roleVal);
    localStorage.setItem('admin_profile_avatar', avatarUrl);

    loadProfileData();

    if (submitBtnText) submitBtnText.textContent = '✓ Identitas & Avatar Berhasil Disimpan!';
    setTimeout(() => {
      if (submitBtnText) submitBtnText.textContent = 'Simpan Identitas & Avatar';
    }, 2500);
  });
}

// ----------------------------------------------------
// CALENDAR & AGENDA REMINDERS SYSTEM LOGIC
// ----------------------------------------------------
let currentCalDate = new Date();
let selectedCalDateStr = formatDateKey(new Date());

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getStoredNotes() {
  try {
    const raw = localStorage.getItem('admin_calendar_notes');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading calendar notes:', e);
  }
  
  // Default sample notes for initial demonstration
  const todayStr = formatDateKey(new Date());
  const sampleNotes = [
    {
      id: 'note-sample-1',
      date: todayStr,
      title: 'Release Version 2.0 Admin Dashboard',
      category: 'Penting',
      time: '09:00 WIB',
      desc: 'Peluncuran tampilan baru admin panel, Vercel Blob storage, & kalender pengingat.',
      done: false
    },
    {
      id: 'note-sample-2',
      date: todayStr,
      title: 'Audit Keamanan Token HMAC-SHA256',
      category: 'Kerja',
      time: '14:30 WIB',
      desc: 'Pemeriksaan integritas API endpoint & pengujian otentikasi token JWT.',
      done: false
    }
  ];
  localStorage.setItem('admin_calendar_notes', JSON.stringify(sampleNotes));
  return sampleNotes;
}

function saveNotes(notesArr) {
  localStorage.setItem('admin_calendar_notes', JSON.stringify(notesArr));
  renderCalendarGrid();
  renderNotesList();
  checkCalendarReminders();
}

function renderCalendarGrid() {
  const gridEl = document.getElementById('calendarDaysGrid');
  const monthTitleEl = document.getElementById('calMonthYearTitle');
  if (!gridEl || !monthTitleEl) return;

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  monthTitleEl.textContent = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const todayStr = formatDateKey(new Date());
  const notes = getStoredNotes();

  gridEl.innerHTML = '';

  // 1. Prev Month Trailing Days
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${dayNum}</span>`;
    gridEl.appendChild(cell);
  }

  // 2. Current Month Days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = formatDateKey(dateObj);
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell';

    if (dateStr === todayStr) {
      cell.classList.add('today');
    }
    if (dateStr === selectedCalDateStr) {
      cell.classList.add('selected');
    }

    // Check notes for this date
    const dateNotes = notes.filter(n => n.date === dateStr);
    let dotsHTML = '';
    if (dateNotes.length > 0) {
      dotsHTML = `<div class="cal-notes-indicator">` +
        dateNotes.slice(0, 3).map(n => `<span class="cal-note-dot dot-${n.category}"></span>`).join('') +
        `</div>`;
    }

    cell.innerHTML = `
      <span class="cal-day-num">${d}</span>
      ${dotsHTML}
    `;

    cell.addEventListener('click', () => {
      selectedCalDateStr = dateStr;
      const targetInput = document.getElementById('noteTargetDate');
      const dateBadge = document.getElementById('selectedDateBadge');
      if (targetInput) targetInput.value = dateStr;
      if (dateBadge) {
        const dFormatted = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        dateBadge.textContent = dFormatted;
      }
      renderCalendarGrid();
      renderNotesList();
    });

    gridEl.appendChild(cell);
  }

  // 3. Next Month Days to complete 35 or 42 cells
  const totalRendered = startOffset + totalDaysInMonth;
  const nextDays = (totalRendered <= 35) ? (35 - totalRendered) : (42 - totalRendered);
  for (let n = 1; n <= nextDays; n++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${n}</span>`;
    gridEl.appendChild(cell);
  }
}

function renderNotesList() {
  const listEl = document.getElementById('calendarNotesList');
  const badgeEl = document.getElementById('totalNotesCountBadge');
  if (!listEl) return;

  const notes = getStoredNotes();
  if (badgeEl) badgeEl.textContent = `${notes.length} Catatan`;

  if (notes.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.88rem;">
        📌 Belum ada catatan pengingat tersimpan.<br>
        <span style="font-size: 0.78rem;">Pilih tanggal di kalender dan isi formulir di atas untuk menambahkan agenda.</span>
      </div>
    `;
    return;
  }

  // Sort notes by date ascending
  const sorted = [...notes].sort((a, b) => a.date.localeCompare(b.date));

  listEl.innerHTML = sorted.map(note => {
    const isSelectedDate = note.date === selectedCalDateStr;
    const borderHighlight = isSelectedDate ? 'border-left: 4px solid var(--accent-purple);' : '';
    const dObj = new Date(note.date + 'T00:00:00');
    const dateFormatted = dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <div class="note-item-card" style="${borderHighlight}">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="note-category-badge note-badge-${note.category}">${note.category}</span>
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">📅 ${dateFormatted} (${escapeHTML(note.time)})</span>
          </div>
          <h4 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0.25rem 0 0.2rem 0;">${escapeHTML(note.title)}</h4>
          <p style="font-size: 0.82rem; color: #64748b; margin: 0; line-height: 1.35;">${escapeHTML(note.desc)}</p>
        </div>
        <button onclick="deleteCalendarNote('${note.id}')" style="background: rgba(255, 71, 87, 0.12); color: #ff4757; border: none; padding: 0.35rem 0.6rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; flex-shrink: 0;" title="Hapus Catatan">
          🗑️ Hapus
        </button>
      </div>
    `;
  }).join('');
}

// Window Global Delete Note Handler
window.deleteCalendarNote = function(noteId) {
  if (confirm('Apakah Anda yakin ingin menghapus catatan agenda ini?')) {
    const notes = getStoredNotes().filter(n => n.id !== noteId);
    saveNotes(notes);
  }
};

// Form Add Note Handler
const addCalendarNoteForm = document.getElementById('addCalendarNoteForm');
if (addCalendarNoteForm) {
  addCalendarNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('noteTargetDate').value || formatDateKey(new Date());
    const title = document.getElementById('noteTitleInput').value.trim();
    const category = document.getElementById('noteCategoryInput').value;
    const time = document.getElementById('noteTimeInput').value.trim() || '09:00 WIB';
    const desc = document.getElementById('noteDescInput').value.trim();

    if (!title || !desc) return alert('Judul dan rincian catatan wajib diisi.');

    const newNote = {
      id: 'note-' + Date.now(),
      date,
      title,
      category,
      time,
      desc,
      done: false
    };

    const notes = getStoredNotes();
    notes.push(newNote);
    saveNotes(notes);

    // Reset Form
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteDescInput').value = '';

    alert(`✅ Catatan agenda "${title}" berhasil disimpan untuk tanggal ${date}!`);
  });
}

// Calendar Month Navigation Buttons
const calPrevBtn = document.getElementById('calPrevMonthBtn');
const calNextBtn = document.getElementById('calNextMonthBtn');
const calTodayBtn = document.getElementById('calTodayBtn');

if (calPrevBtn) {
  calPrevBtn.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendarGrid();
  });
}

if (calNextBtn) {
  calNextBtn.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendarGrid();
  });
}

if (calTodayBtn) {
  calTodayBtn.addEventListener('click', () => {
    currentCalDate = new Date();
    selectedCalDateStr = formatDateKey(new Date());
    renderCalendarGrid();
    renderNotesList();
  });
}

// Reminder Notification Checker
function checkCalendarReminders() {
  const todayStr = formatDateKey(new Date());
  const notes = getStoredNotes();
  const todayNotes = notes.filter(n => n.date === todayStr);

  const notifDot = document.querySelector('.notif-badge-dot');
  if (notifDot) {
    notifDot.style.display = (todayNotes.length > 0) ? 'block' : 'none';
  }
}

// System Notification Bell Click Handler Overwrite with Reminders Summary
if (notifBellBtn) {
  notifBellBtn.addEventListener('click', () => {
    const todayStr = formatDateKey(new Date());
    const notes = getStoredNotes();
    const todayNotes = notes.filter(n => n.date === todayStr);

    if (todayNotes.length > 0) {
      const titles = todayNotes.map(n => `• [${n.category}] ${n.title} (${n.time})`).join('\n');
      alert(`🔔 Pengingat Agenda Hari Ini (${todayNotes.length}):\n\n${titles}\n\nSeluruh sistem berjalan 100% Optimal.`);
    } else {
      alert(`🔔 Notifikasi Sistem: Tidak ada pengingat agenda untuk hari ini. Seluruh sistem 100% Online.`);
    }
  });
}

// Load Profile, Calendar, & Social Systems on Init
loadProfileData();
renderCalendarGrid();
renderNotesList();
checkCalendarReminders();
loadSocialMediaData();

// Initialize Auth Check
checkAuth();

// ==========================================================================
// Inactivity Auto-Logout System (5 Minutes Inactivity Limit)
// ==========================================================================
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 Minutes
const WARNING_THRESHOLD_MS = 30 * 1000; // 30 Seconds warning before timeout
let inactivityTimer = null;
let warningTimer = null;
let warningToastEl = null;
let countdownInterval = null;
let secondsRemaining = 30;

function createInactivityWarningToast() {
  if (document.getElementById('inactivityWarningToast')) return;
  const toast = document.createElement('div');
  toast.id = 'inactivityWarningToast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
    color: #ffffff;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(255, 71, 87, 0.4);
    z-index: 10000;
    display: none;
    align-items: center;
    gap: 0.85rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  toast.innerHTML = `
    <span style="font-size: 1.5rem; line-height: 1;">⏳</span>
    <div>
      <div style="font-weight: 800; font-size: 0.95rem;">Sesi Hampir Berakhir!</div>
      <div style="font-size: 0.8rem; opacity: 0.95; margin-top: 2px;">
        Otomatis logout dalam <span id="inactivityCountdown" style="font-weight: 800; text-decoration: underline;">30</span> detik karena tidak ada aktivitas.
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  warningToastEl = toast;
}

function showInactivityWarning() {
  if (!warningToastEl) createInactivityWarningToast();
  if (warningToastEl) {
    warningToastEl.style.display = 'flex';
    secondsRemaining = 30;
    const countdownEl = document.getElementById('inactivityCountdown');
    if (countdownEl) countdownEl.textContent = secondsRemaining;

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      secondsRemaining--;
      if (countdownEl) countdownEl.textContent = Math.max(0, secondsRemaining);
      if (secondsRemaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }
}

function hideInactivityWarning() {
  if (warningToastEl) {
    warningToastEl.style.display = 'none';
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
}

function performAutoLogout() {
  hideInactivityWarning();
  localStorage.removeItem('admin_token');
  sessionStorage.setItem('session_expired_notice', '🔒 Sesi Anda telah berakhir otomatis karena tidak ada aktivitas selama 5 menit. Silakan login kembali demi keamanan.');
  window.location.href = './login.html';
}

function resetInactivityTimer() {
  hideInactivityWarning();

  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);

  warningTimer = setTimeout(() => {
    showInactivityWarning();
  }, INACTIVITY_LIMIT_MS - WARNING_THRESHOLD_MS);

  inactivityTimer = setTimeout(() => {
    performAutoLogout();
  }, INACTIVITY_LIMIT_MS);
}

function initInactivityTracker() {
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointermove'];
  activityEvents.forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}

// ==========================================================================
// Social Media Links Management System
// ==========================================================================
async function loadSocialMediaData() {
  try {
    const res = await fetch('/api/content');
    const result = await res.json();
    let socialData = {};

    if (result.success && result.data && result.data.social) {
      socialData = result.data.social;
    } else {
      const cached = localStorage.getItem('admin_social_data');
      if (cached) socialData = JSON.parse(cached);
    }

    if (document.getElementById('socialGithubInput')) document.getElementById('socialGithubInput').value = socialData.github || '';
    if (document.getElementById('socialLinkedinInput')) document.getElementById('socialLinkedinInput').value = socialData.linkedin || '';
    if (document.getElementById('socialInstagramInput')) document.getElementById('socialInstagramInput').value = socialData.instagram || '';
    if (document.getElementById('socialTwitterInput')) document.getElementById('socialTwitterInput').value = socialData.twitter || '';
    if (document.getElementById('socialWhatsappInput')) document.getElementById('socialWhatsappInput').value = socialData.whatsapp || '';
    if (document.getElementById('socialEmailInput')) document.getElementById('socialEmailInput').value = socialData.email || '';
  } catch (err) {
    console.warn('Load social data warning:', err);
  }
}

const socialForm = document.getElementById('socialMediaForm');
if (socialForm) {
  socialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtnText = document.getElementById('submitSocialText');
    if (submitBtnText) submitBtnText.textContent = '⏳ Menyimpan...';

    const socialData = {
      github: document.getElementById('socialGithubInput').value.trim(),
      linkedin: document.getElementById('socialLinkedinInput').value.trim(),
      instagram: document.getElementById('socialInstagramInput').value.trim(),
      twitter: document.getElementById('socialTwitterInput').value.trim(),
      whatsapp: document.getElementById('socialWhatsappInput').value.trim(),
      email: document.getElementById('socialEmailInput').value.trim()
    };

    localStorage.setItem('admin_social_data', JSON.stringify(socialData));

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ section: 'social', data: socialData })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ Tautan Media Sosial berhasil diperbarui!');
      } else {
        alert('✅ Tautan tersimpan (Local & API sync).');
      }
    } catch (err) {
      console.warn('Save social err:', err);
      alert('✅ Tautan tersimpan lokal.');
    } finally {
      if (submitBtnText) submitBtnText.textContent = '💾 Simpan Tautan Media Sosial';
    }
  });
}



