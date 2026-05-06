import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, formatDate, getStatusBadge, setButtonLoading } from '../utils.js';

// ── Enterprise Resource Catalog ──────────────────────────────────────────────
const ENTERPRISE_RESOURCES = {
  'Software Development': [
    'GitHub Repository', 'GitLab Project', 'Bitbucket Access',
    'CI/CD Pipeline', 'NPM Registry', 'SonarQube Access', 'Code Review Tool'
  ],
  'Database Systems': [
    'Production Database', 'Testing Database', 'Analytics Database',
    'MongoDB Cluster', 'MySQL Server', 'PostgreSQL Server', 'Redis Cache'
  ],
  'Cloud & Infrastructure': [
    'AWS Console', 'Azure Portal', 'Google Cloud Platform',
    'Kubernetes Cluster', 'Docker Registry', 'Production Server', 'Terraform Access'
  ],
  'Internal Tools': [
    'Jira Access', 'Confluence Access', 'HR Portal', 'Monitoring Dashboard',
    'VPN Access', 'Slack Workspace', 'ServiceNow Portal'
  ],
  'Security & Admin': [
    'Admin Dashboard', 'Log Monitoring', 'Security Audit Reports',
    'IAM Management', 'Firewall Configuration', 'SSL Certificate Manager'
  ]
};

// Invalid keyword patterns
const INVALID_PATTERNS = /\b(food|samosa|biryani|pizza|snack|coffee|money|phone|bike|car|personal|random|test123|hello|hi|abc|xyz|game|movie)\b/i;

let currentPage = 1;

// ── Helper: show toast notification ─────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.success-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'success-toast';
  const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
  const colors = { success: '#00ff80', error: '#ef4444', info: '#7047EB', warning: '#f59e0b' };
  toast.style.borderLeftColor = colors[type] || colors.success;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✅'}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Main render ──────────────────────────────────────────────────────────────
export function renderRequesterDashboard() {
  const user = auth.getCurrentUser();
  const app  = document.getElementById('app');

  app.innerHTML = `
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">🛡️ Enterprise IAM</div>
        <div class="navbar-menu">
          <div class="user-info">
            <div class="user-avatar">${auth.getUserInitials()}</div>
            <div class="user-details">
              <div class="user-name">${user.username}</div>
              <div class="user-role">${user.role}</div>
            </div>
          </div>
          <button class="btn btn-logout" id="logout-btn">Logout</button>
        </div>
      </div>
    </nav>

    <div class="dashboard">
      <div class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Enterprise Access Management Portal</h1>
          <p class="dashboard-subtitle">Request secure access to enterprise systems and infrastructure</p>
        </div>

        <!-- ① REQUEST HISTORY (top) -->
        <div class="card" style="margin-bottom:24px;">
          <div class="card-header flex justify-between items-center">
            <div>
              <h2 class="card-title section-title">📋 My Access Requests <span class="section-badge">History</span></h2>
              <p class="card-subtitle" style="margin-top:4px;">Track status of all your submitted access requests</p>
            </div>
          </div>

          <div class="filter-bar">
            <input type="text" id="searchInput" placeholder="🔍 Search by resource name...">
            <select id="statusFilter">
              <option value="">All Statuses</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="APPROVED">✅ Approved</option>
              <option value="REJECTED">❌ Rejected</option>
            </select>
            <select id="riskFilter">
              <option value="">All Risk Levels</option>
              <option value="LOW">🟢 Low Risk</option>
              <option value="MEDIUM">🟡 Medium Risk</option>
              <option value="HIGH">🔴 High Risk</option>
            </select>
            <button class="btn btn-primary" id="searchBtn">Search</button>
          </div>

          <div id="requests-container">
            <div class="text-center" style="padding:2rem;">
              <span class="spinner"></span> Loading requests...
            </div>
          </div>
        </div>

        <!-- ② NEW ACCESS REQUEST FORM (below history) -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title section-title">🔐 New Access Request <span class="section-badge">Enterprise RBAC</span></h2>
            <p class="card-subtitle" style="margin-top:4px;">Submit a request for access to enterprise IT systems and infrastructure</p>
          </div>

          <!-- Enterprise hint card -->
          <div class="enterprise-hint">
            <strong>💼 Enterprise Request Examples:</strong>
            <ul>
              <li>Access to <em>Production Database</em> for debugging a critical bug</li>
              <li><em>READ</em> access to Analytics Dashboard for quarterly reporting</li>
              <li><em>VPN Access</em> for secure remote development work</li>
              <li><em>Jira Access</em> for sprint tracking and project management</li>
            </ul>
          </div>

          <form id="request-form" novalidate>
            <!-- Department / Category -->
            <div class="form-group">
              <label for="resourceCategory" class="form-label">🏢 Resource Category</label>
              <select id="resourceCategory" class="resource-category-select" required>
                <option value="">Select a department/category…</option>
                ${Object.keys(ENTERPRISE_RESOURCES).map(cat =>
                  `<option value="${cat}">${cat}</option>`
                ).join('')}
              </select>
            </div>

            <!-- Resource Name (dynamic dropdown) -->
            <div class="form-group">
              <label for="resourceName" class="form-label">🖥️ Resource Name</label>
              <select id="resourceName" class="resource-name-select" required disabled>
                <option value="">← Select a category first</option>
              </select>
              <div id="resource-validation-msg" class="validation-msg" style="display:none;">
                ⚠️ This portal only supports enterprise IT resource access requests.
              </div>
            </div>

            <!-- Access Type -->
            <div class="form-group">
              <label for="accessType" class="form-label">🔑 Access Type</label>
              <select id="accessType" class="form-select" required>
                <option value="">Select access type…</option>
                <option value="READ">👁️ READ — View only, no modifications (Low Risk)</option>
                <option value="WRITE">✏️ WRITE — Create and modify data (Medium Risk)</option>
                <option value="ADMIN">⚙️ ADMIN — Full administrative control (High Risk)</option>
                <option value="DEPLOY">🚀 DEPLOY — Deploy applications/pipelines (Medium Risk)</option>
                <option value="FULL">🔓 FULL ACCESS — Unrestricted (Critical Risk)</option>
                <option value="TEMPORARY">⏱️ TEMPORARY — Time-limited access</option>
              </select>
            </div>

            <!-- Reason with AI Suggest -->
            <div class="form-group" style="position:relative;">
              <label for="reason" class="form-label flex justify-between">
                <span>📝 Business Justification <em style="color:#92929D;font-size:0.78rem;">(min. 10 chars)</em></span>
                <button type="button" id="aiSuggestBtn" class="suggest-btn" style="padding:2px 8px;font-size:0.75rem;margin-top:0;">✨ AI Suggest</button>
              </label>
              <textarea id="reason" class="form-textarea" placeholder="Explain the business need for this access…" minlength="10" required rows="3"></textarea>
              <div id="aiPromptBox" style="display:none;background:rgba(112,71,235,0.1);padding:10px;border-radius:8px;margin-top:10px;border:1px solid rgba(112,71,235,0.3);">
                <label style="font-size:0.75rem;font-weight:700;color:#a78bfa;margin-bottom:4px;display:block;">Brief context (e.g. 'fixing production bug')</label>
                <div style="display:flex;gap:8px;">
                  <input type="text" id="aiCustomPrompt" class="form-input" style="flex:1;padding:8px 12px;font-size:0.8rem;" placeholder="Describe your task briefly…"/>
                  <button type="button" id="aiGenerateBtn" class="btn btn-primary" style="padding:0 16px;font-size:0.8rem;min-width:90px;height:38px;">Generate</button>
                </div>
              </div>
              <div id="aiSuggestionsList" class="suggestions-list" style="display:none;margin-top:10px;"></div>
            </div>

            <!-- Priority -->
            <div class="form-group">
              <label for="priority" class="form-label">⚡ Priority Level</label>
              <select id="priority" class="form-select">
                <option value="LOW">🟢 Low Priority</option>
                <option value="MEDIUM" selected>🟡 Medium Priority</option>
                <option value="HIGH">🔴 High Priority</option>
                <option value="CRITICAL">🚨 Critical — Immediate action needed</option>
              </select>
            </div>

            <!-- Access Duration -->
            <div class="form-group">
              <label for="expiryDays" class="form-label">⏱️ Access Duration (Days)</label>
              <select id="expiryDays" class="form-select">
                <option value="">♾️ Permanent Access</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">6 Months</option>
                <option value="365">1 Year</option>
              </select>
            </div>

            <!-- AI Risk Preview -->
            <div id="ai-risk-preview" style="display:none;"></div>

            <button type="submit" class="btn btn-primary" id="submit-btn" style="width:100%;font-family:'Outfit',sans-serif;font-size:1rem;letter-spacing:0.02em;margin-top:8px;">
              🔐 Submit Access Request
            </button>
          </form>
        </div>

      </div>
    </div>
  `;

  loadRequests();
  setupSmartSuggestions();
  setupResourceDropdown();
  setupRiskPreview();

  document.getElementById('searchBtn').addEventListener('click', () => {
    currentPage = 1;
    loadRequests();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    api.logout().then(() => router.navigate('/login'));
  });

  // Form submission
  const form = document.getElementById('request-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category    = document.getElementById('resourceCategory').value;
    const resourceName = document.getElementById('resourceName').value;
    const accessType  = document.getElementById('accessType').value;
    const reason      = document.getElementById('reason').value;
    const priority    = document.getElementById('priority').value;
    const expiryDays  = document.getElementById('expiryDays').value;

    // Validate category/resource
    if (!category || !resourceName) {
      showToast('Please select a resource category and resource name.', 'error');
      document.getElementById('resourceCategory').classList.add('input-error');
      return;
    }

    // Validate reason
    if (INVALID_PATTERNS.test(reason)) {
      showToast('❌ Invalid request. This portal only supports enterprise IT resource access.', 'error');
      document.getElementById('reason').classList.add('input-error');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    setButtonLoading(submitBtn, true);

    try {
      const payload = {
        department: category,
        resourceName,
        accessType,
        reason,
        priority,
        expiryDays: expiryDays || null
      };

      // AI Validation
      const aiVal = await api.validateRequest({
        reason: payload.reason,
        resourceName: payload.resourceName,
        accessType: payload.accessType
      });

      if (!aiVal.isValid) {
        if (!confirm(`🤖 AI Notice: Your reason seems vague (Score: ${aiVal.score}/10).\nAI Suggests: ${aiVal.suggestion}\n\nDo you still want to submit?`)) {
          setButtonLoading(submitBtn, false);
          return;
        }
      }

      const res = await api.createRequest(payload);

      // Update AI score
      await api.validateRequest({
        reason: payload.reason,
        resourceName: payload.resourceName,
        accessType: payload.accessType,
        requestId: res.request._id
      });

      form.reset();
      document.getElementById('resourceName').innerHTML = '<option value="">← Select a category first</option>';
      document.getElementById('resourceName').disabled = true;
      document.getElementById('ai-risk-preview').style.display = 'none';

      await loadRequests();

      showToast(`✅ Access request submitted! Risk Level: ${res.riskLevel}`, 'success');

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ── Dynamic Resource Dropdown ────────────────────────────────────────────────
function setupResourceDropdown() {
  const catSelect  = document.getElementById('resourceCategory');
  const resSelect  = document.getElementById('resourceName');

  catSelect.addEventListener('change', () => {
    const cat = catSelect.value;
    catSelect.classList.remove('input-error');

    if (!cat) {
      resSelect.innerHTML = '<option value="">← Select a category first</option>';
      resSelect.disabled = true;
      return;
    }

    const resources = ENTERPRISE_RESOURCES[cat] || [];
    resSelect.innerHTML = `
      <option value="">Select a resource…</option>
      ${resources.map(r => `<option value="${r}">${r}</option>`).join('')}
    `;
    resSelect.disabled = false;
  });
}

// ── Smart AI Risk Preview ────────────────────────────────────────────────────
function setupRiskPreview() {
  const accessTypeEl = document.getElementById('accessType');
  const resourceEl   = document.getElementById('resourceName');
  const preview      = document.getElementById('ai-risk-preview');

  function updatePreview() {
    const type     = accessTypeEl.value;
    const resource = resourceEl.value;
    if (!type || !resource) { preview.style.display = 'none'; return; }

    const riskMap = {
      READ: { level: 'LOW', score: 20, msg: 'Low risk. Read-only access is generally safe to approve.' },
      WRITE: { level: 'MEDIUM', score: 55, msg: 'Medium risk. Write access may modify data. Review carefully.' },
      DEPLOY: { level: 'MEDIUM', score: 60, msg: 'Medium risk. Deployment access can affect production systems.' },
      ADMIN: { level: 'HIGH', score: 85, msg: 'High risk. Admin access requires manual review and strong justification.' },
      FULL: { level: 'HIGH', score: 95, msg: 'Critical risk. Full unrestricted access. Requires senior approval.' },
      TEMPORARY: { level: 'LOW', score: 30, msg: 'Low risk. Time-limited access reduces security exposure.' }
    };
    const r = riskMap[type] || { level: 'MEDIUM', score: 50, msg: 'Moderate risk. Standard review required.' };
    const cls = r.level.toLowerCase();

    preview.style.display = 'block';
    preview.innerHTML = `
      <div class="ai-risk-panel risk-${cls}">
        <div class="ai-risk-header">
          🤖 AI Risk Assessment — <span style="color:${cls==='low'?'#10b981':cls==='medium'?'#f59e0b':'#ef4444'}">${r.level} RISK</span>
        </div>
        <p class="ai-risk-text">${r.msg}</p>
        <div class="ai-risk-score-bar">
          <div class="ai-risk-score-fill" style="width:${r.score}%"></div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:6px;">Risk Score: ${r.score}/100</div>
      </div>
    `;
  }

  accessTypeEl.addEventListener('change', updatePreview);
  resourceEl.addEventListener('change', updatePreview);
}

// ── AI Smart Suggestions ─────────────────────────────────────────────────────
function setupSmartSuggestions() {
  const btn         = document.getElementById('aiSuggestBtn');
  const promptBox   = document.getElementById('aiPromptBox');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const loader      = document.getElementById('aiSuggestionsList');

  btn.addEventListener('click', () => {
    promptBox.style.display = promptBox.style.display === 'none' ? 'block' : 'none';
    if (promptBox.style.display === 'block') document.getElementById('aiCustomPrompt').focus();
  });

  generateBtn.addEventListener('click', async () => {
    const resourceName = document.getElementById('resourceName').value;
    const accessType   = document.getElementById('accessType').value;
    const userPrompt   = document.getElementById('aiCustomPrompt').value;

    if (!resourceName || !accessType) {
      showToast('Please select a Resource and Access Type first.', 'error');
      return;
    }
    if (!userPrompt.trim()) {
      showToast('Please give AI a context hint first.', 'error');
      return;
    }

    generateBtn.innerText = '⏳ Thinking…';
    generateBtn.disabled  = true;
    loader.style.display  = 'none';

    try {
      const data = await api.suggestReasons({ resourceName, accessType, userPrompt });
      if (!data.suggestions?.length) throw new Error('No suggestions returned');

      loader.innerHTML = data.suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join('');
      loader.style.display = 'flex';

      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('reason').value = item.innerText;
          loader.innerHTML = '';
          loader.style.display = 'none';
          promptBox.style.display = 'none';
        });
      });
    } catch (err) {
      showToast('AI suggestion failed. Please check your backend.', 'error');
    } finally {
      generateBtn.innerText = 'Generate';
      generateBtn.disabled  = false;
    }
  });
}

// ── Load Requests ────────────────────────────────────────────────────────────
async function loadRequests() {
  const container = document.getElementById('requests-container');
  const search    = document.getElementById('searchInput').value;
  const status    = document.getElementById('statusFilter').value;
  const riskLevel = document.getElementById('riskFilter').value;

  try {
    const data = await api.getMyRequests({ page: currentPage, limit: 10, search, status, riskLevel });
    const requests = data.requests;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📋</span>
          <h3 class="empty-state-title">No access requests found</h3>
          <p>You haven't submitted any access requests yet, or none match your filters.</p>
          <div class="empty-state-hint">⬇️ Use the form below to request access to enterprise systems</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Risk Level</th>
              <th>AI Score</th>
              <th>Access Duration</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td><strong>${req.resourceName}</strong></td>
                <td><span style="font-size:0.8rem;color:var(--text-secondary);">${req.department || '—'}</span></td>
                <td>${getAccessTypeBadge(req.accessType)}</td>
                <td>${getStatusBadge(req.status)}</td>
                <td>${getRiskBadge(req.riskLevel)}</td>
                <td>${req.aiValidationScore ? `<span class="ai-score-badge">🤖 ${req.aiValidationScore}/10</span>` : '—'}</td>
                <td>${getDurationBadge(req.expiryDays, req.expiryDate)}</td>
                <td>${formatDate(req.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination" id="reqPagination"></div>
    `;

    renderPagination(data.page, data.totalPages, 'reqPagination');

  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">Failed to load requests: ${error.message}</div>`;
  }
}

// ── Badge Helpers ────────────────────────────────────────────────────────────
function getDurationBadge(expiryDays, expiryDate) {
  if (expiryDate) {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
    return `<span class="duration-badge"><span class="clock-icon">🕐</span>${days > 0 ? `${days} days left` : 'Expired'}</span>`;
  }
  if (expiryDays) {
    return `<span class="duration-badge"><span class="clock-icon">⏱️</span>${expiryDays} days</span>`;
  }
  return `<span class="duration-badge"><span class="clock-icon">♾️</span>Permanent</span>`;
}

function getAccessTypeBadge(type) {
  const map = {
    READ: 'read', WRITE: 'write', ADMIN: 'admin',
    DEPLOY: 'deploy', FULL: 'full', TEMPORARY: 'temp'
  };
  const cls = map[type] || 'read';
  return `<span class="access-type-badge ${cls}">${type}</span>`;
}

function getRiskBadge(level) {
  if (!level) return '<span style="color:#999;font-size:0.8rem;">UNRATED</span>';
  return `<span class="risk-badge ${level.toLowerCase()}"><div class="risk-dot"></div>${level}</span>`;
}

function renderPagination(page, totalPages, containerId) {
  const pag = document.getElementById(containerId);
  if (!pag || totalPages <= 1) return;

  pag.innerHTML = `
    <button class="prev-page" ${page === 1 ? 'disabled' : ''}>Previous</button>
    <span class="page-info">Page ${page} of ${totalPages}</span>
    <button class="next-page" ${page === totalPages ? 'disabled' : ''}>Next</button>
  `;

  if (page > 1)         pag.querySelector('.prev-page').addEventListener('click', () => { currentPage--; loadRequests(); });
  if (page < totalPages) pag.querySelector('.next-page').addEventListener('click', () => { currentPage++; loadRequests(); });
}
