import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, setButtonLoading } from '../utils.js';
import notifications from '../components/notifications.js';
import { initLiquidEther } from '../components/LiquidEther.js';

export function renderLogin() {
  notifications.destroy();
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container" style="position:relative;">
      <!-- Liquid Ether Background -->
      <div id="liquid-ether-bg" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;"></div>

      <div class="card auth-card" style="position:relative; z-index:1;">
        <!-- Top glow line injected via CSS ::before -->
        <div class="auth-logo" aria-hidden="true">🛡️</div>

        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-tagline">Secure Intelligent Access Management</p>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="email" class="form-label" style="padding-left:0;">Email Address</label>
            <div style="position:relative;">
              <span class="input-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:1rem; opacity:0.5; pointer-events:none;">✉️</span>
              <input
                type="email"
                id="email"
                class="form-input"
                placeholder="you@company.com"
                autocomplete="email"
                style="padding-left:42px;"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label" style="padding-left:0;">Password</label>
            <div style="position:relative;">
              <span class="input-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:1rem; opacity:0.5; pointer-events:none;">🔒</span>
              <input
                type="password"
                id="password"
                class="form-input"
                placeholder="Enter your password"
                autocomplete="current-password"
                style="padding-left:42px;"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary" id="login-submit" style="width:100%;margin-top:8px;font-family:'Outfit',sans-serif;font-size:1rem;letter-spacing:0.02em;">
            Sign In to Portal
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account?
          <a href="/register" class="auth-link" id="register-link">Register here</a>
        </div>

        <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="font-size:0.72rem;color:rgba(255,255,255,0.25);letter-spacing:0.04em;">
            🔐 ENTERPRISE IAM PORTAL &nbsp;|&nbsp; AI-POWERED RBAC &nbsp;|&nbsp; ISO 27001
          </p>
        </div>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showAlert('Please enter both email and password.', 'error');
        return;
      }

      const data = await api.login({ email, password });
      auth.saveUser(data);

      showSuccessToast('✅ Login successful! Redirecting…');

      setTimeout(() => {
        if (data.role === 'REQUESTER') {
          router.navigate('/requester-dashboard');
        } else {
          router.navigate('/approver-dashboard');
        }
      }, 600);

    } catch (error) {
      document.getElementById('email').classList.add('input-error');
      document.getElementById('password').classList.add('input-error');
      showAlert(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Remove error class on input
  ['email','password'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function() {
      this.classList.remove('input-error');
    });
  });

  // Handle register link
  document.getElementById('register-link').addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/register');
  });

  // Initialize LiquidEther background
  const bgContainer = document.getElementById('liquid-ether-bg');
  if (bgContainer) {
    initLiquidEther(bgContainer);
  }
}

function showSuccessToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `<span class="toast-icon">✅</span><span class="toast-text">${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
