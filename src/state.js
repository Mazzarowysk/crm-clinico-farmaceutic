const getStoredToken = () => typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hn_token') : null;
const getStoredUser = () => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem('hn_user')) || null;
  } catch {
    return null;
  }
};

export const state = {
  activeTab: 'dashboard',
  isAuthenticated: !!getStoredToken(),
  token: getStoredToken(),
  user: getStoredUser(),
  dashboardData: {
    activePatients: 0,
    occupancyRate: 0,
    averageWaitTimeMinutes: 0,
    dailyAppointmentsCount: 0,
    billingSummary: { totalRevenue: 0, pendingClaims: 0 }
  },
  loading: true,
  navHistory: []
};

export const CACHE_TTL_MS = 30_000;
export const dataCache = new Map();
export const dataCacheTimestamps = new Map();

export function clearDataCache() {
  dataCache.clear();
  dataCacheTimestamps.clear();
}

if (typeof window !== 'undefined') {
  window.clearDataCache = clearDataCache;
}

// O timeout não deve ser uma simples variável exportada, pois seria read-only nos importadores.
// Exportamos funções de getter/setter caso algum módulo precise modificá-lo.
let _syncUploadTimeout = null;

export const getSyncUploadTimeout = () => _syncUploadTimeout;
export const setSyncUploadTimeout = (timeout) => {
  _syncUploadTimeout = timeout;
};

