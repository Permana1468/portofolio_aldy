// Logic for standalone login page with sliding curved container

document.addEventListener('DOMContentLoaded', () => {
  // Check session expired notice
  const notice = sessionStorage.getItem('session_expired_notice');
  if (notice) {
    sessionStorage.removeItem('session_expired_notice');
    showSessionExpiredBanner(notice);
  }

  // Check if already logged in
  const token = localStorage.getItem('admin_token');
  if (token) {
    window.location.href = './admin.html';
    return;
  }

  const container = document.getElementById('loginContainer');
  const signUpBtn = document.getElementById('sign-up-btn');
  const signInBtn = document.getElementById('sign-in-btn');

  if (signUpBtn && container) {
    signUpBtn.addEventListener('click', () => {
      container.classList.add('sign-up-mode');
      setTimeout(() => {
        alert('Fitur Sign Up (Pendaftaran Akun Baru) saat ini dikunci oleh Sistem.\n\nSilakan masuk menggunakan akun Administrator resmi.');
      }, 300);
    });
  }

  if (signInBtn && container) {
    signInBtn.addEventListener('click', () => {
      container.classList.remove('sign-up-mode');
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUser').value.trim();
      const password = document.getElementById('adminPass').value.trim();

      if (!username || !password) {
        alert('Silakan isi Username dan Password Anda.');
        return;
      }

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success && data.token) {
          localStorage.setItem('admin_token', data.token);
          window.location.href = './admin.html';
        } else {
          alert(data.error || 'Username atau password salah.');
        }
      } catch (err) {
        console.error('Login error:', err);
        // Fallback for offline/local environment
        const uLower = username.toLowerCase();
        const activePass = localStorage.getItem('admin_password') || 'admin123';
        if ((uLower === 'aldyansyah' || uLower === 'admin') && password === activePass) {
          localStorage.setItem('admin_token', 'local_demo_token_' + Date.now());
          window.location.href = './admin.html';
        } else {
          alert('Username atau password salah.');
        }
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Fitur Sign Up (Pendaftaran Akun Baru) saat ini dikunci oleh Sistem.\n\nSilakan gunakan akun Administrator resmi.');
      container.classList.remove('sign-up-mode');
    });
  }
});

function showSessionExpiredBanner(message) {
  const banner = document.createElement('div');
  banner.className = 'session-expired-banner';
  banner.style.cssText = `
    position: fixed;
    top: 25px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4757;
    color: #ffffff;
    padding: 0.9rem 1.6rem;
    border-radius: 50px;
    box-shadow: 0 10px 30px rgba(255, 71, 87, 0.45);
    z-index: 9999;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    border: 2px solid rgba(255, 255, 255, 0.3);
  `;
  banner.innerHTML = `<span style="font-size: 1.2rem;">🔒</span> <span>${message}</span>`;
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    banner.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => banner.remove(), 600);
  }, 7000);
}
