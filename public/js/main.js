// ============================================================
// main.js - Core Frontend JavaScript
// Dark Mode, Toast Notifications, Wishlist, Active Nav, Loader
// ============================================================

// ── Loader ────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 1500);
});

// ── Dark Mode Toggle ──────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  if (theme === 'dark') {
    themeIcon.className = 'fas fa-sun';
  } else {
    themeIcon.className = 'fas fa-moon';
  }
}

// ── Navbar Active Link ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
      link.style.color = 'white';
    }
  });
});

// ── Toast Notification System ─────────────────────────────
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    danger: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="${icons[type] || 'fas fa-bell'} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
    </div>`;

  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, duration);
}

// ── Wishlist System ───────────────────────────────────────
function toggleWishlist(btn, id, name) {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const exists = wishlist.some(w => w.id == id);
  const icon = btn.querySelector('i');

  if (exists) {
    const updated = wishlist.filter(w => w.id != id);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    btn.classList.remove('active');
    icon.className = 'far fa-heart';
    showToast(`${name} removed from wishlist`, 'warning');
  } else {
    wishlist.push({ id, name });
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    btn.classList.add('active');
    icon.className = 'fas fa-heart';
    showToast(`${name} added to wishlist! ❤️`, 'danger');
  }
}

// Load wishlist state on page load
document.addEventListener('DOMContentLoaded', () => {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const card = btn.closest('[data-id]') || btn.closest('.destination-card');
    const onclick = btn.getAttribute('onclick') || '';
    const match = onclick.match(/toggleWishlist\(this,\s*'?(\d+)'?/);
    if (match) {
      const id = match[1];
      if (wishlist.some(w => String(w.id) === id)) {
        btn.classList.add('active');
        const icon = btn.querySelector('i');
        if (icon) { icon.className = 'fas fa-heart'; }
      }
    }
  });
});

// ── Scroll Reveal Animation ───────────────────────────────
function revealOnScroll() {
  const elements = document.querySelectorAll('.destination-card, .package-card, .package-card-full, .tip-card, .review-card, .blog-card, .team-card, .why-card, .stat-card-admin, .contact-info-card');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.style.animation = 'fadeInUp 0.5s ease forwards';
    }
  });
}
window.addEventListener('scroll', revealOnScroll);
document.addEventListener('DOMContentLoaded', revealOnScroll);

// ── Navbar Scroll Effect ──────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('mainNavbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
    } else {
      navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.2)';
    }
  }
});

// ── Footer Newsletter ─────────────────────────────────────
document.getElementById('footerNewsletterForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('footerEmail').value;
  if (!email) return;
  try {
    const res = await fetch('/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'warning');
    if (data.success) this.reset();
  } catch (err) {
    showToast('Something went wrong. Please try again.', 'danger');
  }
});

// ── Back to Top ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  btn.style.cssText = 'position:fixed;bottom:90px;right:24px;width:44px;height:44px;background:var(--primary-color);color:white;border:none;border-radius:50%;cursor:pointer;z-index:9996;display:none;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);transition:all 0.3s;';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-3px)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
});
