import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, setButtonLoading } from '../utils.js';
import { initLiquidEther } from '../components/LiquidEther.js';

export function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container" style="position:relative;">
      <div id="liquid-ether-bg" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;"></div>
      <div class="card auth-card" style="position:relative; z-index:1;">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join our access management system</p>
        </div>
        
        <form id="register-form">
          <div class="form-group">
            <label for="username" class="form-label" style="padding-left:0;">Username</label>
            <div style="position:relative;">
              <span class="input-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:1rem; opacity:0.5; pointer-events:none;">👤</span>
              <input 
                type="text" 
                id="username" 
                class="form-input" 
                placeholder="Choose a username"
                style="padding-left:42px;"
                minlength="3"
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label" style="padding-left:0;">Email Address</label>
            <div style="position:relative;">
              <span class="input-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:1rem; opacity:0.5; pointer-events:none;">✉️</span>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="Enter your email"
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
                placeholder="Create a password"
                style="padding-left:42px;"
                minlength="6"
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="role" class="form-label" style="padding-left:0;">Role</label>
            <div style="position:relative;">
              <span class="input-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:1rem; opacity:0.5; pointer-events:none;">🛠️</span>
              <select id="role" class="form-select" style="padding-left:42px;" required>
                <option value="">Select your role</option>
                <option value="REQUESTER">Requester</option>
                <option value="APPROVER">Approver</option>
              </select>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            Create Account
          </button>
        </form>
        
        <div class="auth-footer">
          Already have an account? 
          <a href="/login" class="auth-link" id="login-link">Sign in here</a>
        </div>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      const data = await api.register({ username, email, password, role });
      auth.saveUser(data);

      showAlert('Registration successful!', 'success');

      // Redirect based on role
      if (data.role === 'REQUESTER') {
        router.navigate('/requester-dashboard');
      } else if (data.role === 'APPROVER') {
        router.navigate('/approver-dashboard');
      }
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Handle login link
  document.getElementById('login-link').addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });

  // Initialize LiquidEther background
  const bgContainer = document.getElementById('liquid-ether-bg');
  if (bgContainer) {
    initLiquidEther(bgContainer);
  }
}
