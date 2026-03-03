const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error del servidor');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/api/auth/me'),

  // Groups
  createGroup: (data) => request('/api/groups/', { method: 'POST', body: JSON.stringify(data) }),
  listGroups: () => request('/api/groups/'),
  getGroup: (id) => request(`/api/groups/${id}`),
  getGroupPublicInfo: (code) => request(`/api/groups/invite/${code}/info`),
  joinGroup: (code) => request(`/api/groups/invite/${code}/join`, { method: 'POST' }),

  // Expenses
  createExpense: (groupId, data) =>
    request(`/api/groups/${groupId}/expenses/`, { method: 'POST', body: JSON.stringify(data) }),
  listExpenses: (groupId) => request(`/api/groups/${groupId}/expenses/`),
  deleteExpense: (groupId, expenseId) =>
    request(`/api/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' }),

  // Balances
  getBalances: (groupId) => request(`/api/groups/${groupId}/balances/`),

  // Payments
  createPayment: (data) => request('/api/payments/', { method: 'POST', body: JSON.stringify(data) }),
  settlePayment: (id) => request(`/api/payments/${id}/settle`, { method: 'POST' }),
  createMercadoPagoPreference: (id) => request(`/api/payments/${id}/mercadopago`, { method: 'POST' }),
  listGroupPayments: (groupId) => request(`/api/payments/group/${groupId}`),
};
