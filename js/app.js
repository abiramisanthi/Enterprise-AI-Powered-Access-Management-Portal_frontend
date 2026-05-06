import router from './router.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderRequesterDashboard } from './pages/requesterDashboard.js';
import { renderApproverDashboard } from './pages/approverDashboard.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderAuditLog } from './pages/auditLog.js';

import chatbot from './components/chatbot.js';
import notifications from './components/notifications.js';
import aiAssistant from './components/aiAssistant.js';
import auth from './auth.js';

// ================= ROUTES =================

router.register('/', renderLogin);
router.register('/login', renderLogin);
router.register('/register', renderRegister);
router.register('/requester-dashboard', renderRequesterDashboard);
router.register('/approver-dashboard', renderApproverDashboard);
router.register('/analytics', renderAnalytics);
router.register('/audit-log', renderAuditLog);

// Initialize routing
router.init();

// ================= ROUTE CONTROL =================

const publicRoutes = ['/', '/login', '/register'];

function initRealtimeFeatures() {
    const currentRoute = window.location.pathname;

    if (auth.isAuthenticated() && !publicRoutes.includes(currentRoute)) {
        chatbot.init();
        notifications.init();
        aiAssistant.init();
    } else {
        if (chatbot.destroy)     chatbot.destroy();
        if (notifications.destroy) notifications.destroy();
        if (aiAssistant.destroy) aiAssistant.destroy();
    }
}

// Run once on page load
initRealtimeFeatures();

// Listen for navigation changes
window.addEventListener('popstate', initRealtimeFeatures);