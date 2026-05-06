/**
 * AI Assistant – floating helper panel (all pages except login/register)
 */
const aiAssistant = {
  _mounted: false,

  init() {
    if (this._mounted) return;
    this._mounted = true;
    this._inject();
    this._bind();
  },

  destroy() {
    const el = document.getElementById('ai-assistant-root');
    if (el) el.remove();
    this._mounted = false;
  },

  _inject() {
    const root = document.createElement('div');
    root.id = 'ai-assistant-root';
    root.innerHTML = `
      <!-- AI Assistant Panel -->
      <div id="ai-assistant-panel" class="ai-assistant-panel hidden">
        <div class="ai-panel-header">
          <div class="ai-panel-avatar">🤖</div>
          <div class="ai-panel-info">
            <h4>AI Access Assistant</h4>
            <p>Enterprise IAM Helper • Online</p>
          </div>
          <button class="ai-panel-close" id="ai-panel-close">✕</button>
        </div>
        <div class="ai-panel-body">
          <p>Hello! I can help you navigate the <strong style="color:#a78bfa">Enterprise Access Management Portal</strong>. What would you like to know?</p>
          <div class="ai-quick-links">
            <div class="ai-quick-link" data-tip="how-to-request">
              <span class="ql-icon">📋</span> How to submit an access request
            </div>
            <div class="ai-quick-link" data-tip="access-types">
              <span class="ql-icon">🔑</span> Understanding access types
            </div>
            <div class="ai-quick-link" data-tip="risk-levels">
              <span class="ql-icon">🛡️</span> What do risk levels mean?
            </div>
            <div class="ai-quick-link" data-tip="enterprise-rbac">
              <span class="ql-icon">🏢</span> About Enterprise RBAC
            </div>
            <div class="ai-quick-link" data-tip="ai-score">
              <span class="ql-icon">🤖</span> How is the AI score calculated?
            </div>
          </div>
          <div id="ai-tip-box" style="display:none; margin-top:14px; padding:12px; background:rgba(112,71,235,0.1); border:1px solid rgba(112,71,235,0.25); border-radius:10px; font-size:0.82rem; color:#c4b5fd; line-height:1.6;"></div>
        </div>
      </div>

      <!-- Floating Button -->
      <button class="ai-assistant-btn" id="ai-assistant-btn" title="AI Access Assistant">
        <span class="ai-face">🤗</span>
      </button>
    `;
    document.body.appendChild(root);
  },

  _bind() {
    const btn   = document.getElementById('ai-assistant-btn');
    const panel = document.getElementById('ai-assistant-panel');
    const close = document.getElementById('ai-panel-close');
    const tipBox = document.getElementById('ai-tip-box');

    const tips = {
      'how-to-request': '📋 <strong>Submitting a Request:</strong><br>1. Select your Department/Category<br>2. Choose a specific resource from the dropdown<br>3. Select the access type you need<br>4. Write a clear business reason (min. 10 characters)<br>5. Set priority and access duration<br>6. Click <em>Submit Request</em>',
      'access-types': '🔑 <strong>Access Types:</strong><br>• <em>READ</em> – View only, no modifications<br>• <em>WRITE</em> – Create and modify data<br>• <em>ADMIN</em> – Full administrative control<br>• <em>DEPLOY</em> – Deploy applications/code<br>• <em>FULL ACCESS</em> – Unrestricted access (high risk)<br>• <em>TEMPORARY</em> – Time-limited access',
      'risk-levels': '🛡️ <strong>Risk Levels:</strong><br>• <em style="color:#10b981">LOW</em> – Safe to approve (READ on non-critical systems)<br>• <em style="color:#f59e0b">MEDIUM</em> – Needs review (WRITE or sensitive systems)<br>• <em style="color:#ef4444">HIGH</em> – Manual review required (ADMIN/FULL on production)',
      'enterprise-rbac': '🏢 <strong>Enterprise RBAC:</strong><br>This portal implements Role-Based Access Control (RBAC) used in companies like Infosys, TCS, Wipro. Requesters submit for IT resources; managers approve based on business need and risk level. All actions are audit-logged.',
      'ai-score': '🤖 <strong>AI Score (1–10):</strong><br>The AI evaluates your request reason for clarity, relevance, and business justification. A score of <em>8+</em> means the reason is clear. A low score triggers a warning — you can still submit after review.',
    };

    btn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      tipBox.style.display = 'none';
    });

    close.addEventListener('click', () => {
      panel.classList.add('hidden');
    });

    document.querySelectorAll('.ai-quick-link').forEach(link => {
      link.addEventListener('click', () => {
        const key = link.dataset.tip;
        tipBox.innerHTML = tips[key] || '';
        tipBox.style.display = 'block';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!document.getElementById('ai-assistant-root')?.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });
  }
};

export default aiAssistant;
