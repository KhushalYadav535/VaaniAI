/**
 * VaaniAI Frontend API Service
 * Centralized HTTP client for backend communication
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

// ─── Helper ─────────────────────────────────────────────────────────────────

async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { isFormData?: boolean } = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { isFormData, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiRequest('/auth/me'),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Agents ──────────────────────────────────────────────────────────────────

export const agentsApi = {
  getAll: (params?: { status?: string; search?: string; sortBy?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/agents${query ? '?' + query : ''}`);
  },

  getById: (id: string) => apiRequest(`/agents/${id}`),

  create: (data: any) =>
    apiRequest('/agents', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/agents/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: string, status: 'active' | 'inactive') =>
    apiRequest(`/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Phone Numbers ───────────────────────────────────────────────────────────

export const numbersApi = {
  getAll: () => apiRequest('/numbers'),

  getById: (id: string) => apiRequest(`/numbers/${id}`),

  create: (data: any) =>
    apiRequest('/numbers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/numbers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/numbers/${id}`, { method: 'DELETE' }),

  assignAgent: (numberId: string, agentId: string | null) =>
    apiRequest(`/numbers/${numberId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ agentId }),
    }),
};

// ─── Call Logs ───────────────────────────────────────────────────────────────

export const callsApi = {
  getAll: (params?: {
    agentId?: string;
    status?: string;
    direction?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/calls${query ? '?' + query : ''}`);
  },

  getActive: () => apiRequest('/calls/active'),

  getById: (id: string) => apiRequest(`/calls/${id}`),

  getTranscript: (id: string) => apiRequest(`/calls/${id}/transcript`),

  delete: (id: string) => apiRequest(`/calls/${id}`, { method: 'DELETE' }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getOverview: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/overview${period ? '?period=' + period : ''}`),

  getCallsOverTime: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/calls-over-time${period ? '?period=' + period : ''}`),

  getTopAgents: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/top-agents${period ? '?period=' + period : ''}`),

  getSentimentDistribution: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/sentiment-distribution${period ? '?period=' + period : ''}`),

  getIntentDistribution: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/intent-distribution${period ? '?period=' + period : ''}`),

  getVoicemailStats: () =>
    apiRequest('/analytics/voicemail-stats'),

  getFollowUpStats: () =>
    apiRequest('/analytics/follow-up-stats'),

  getPeakHours: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/peak-hours${period ? '?period=' + period : ''}`),

  getAgentComparison: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/agent-comparison${period ? '?period=' + period : ''}`),

  getCallDurationDistribution: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/call-duration-distribution${period ? '?period=' + period : ''}`),

  getConversionFunnel: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/conversion-funnel${period ? '?period=' + period : ''}`),

  getTrends: (period?: '7d' | '30d' | '90d') =>
    apiRequest(`/analytics/trends${period ? '?period=' + period : ''}`),
};

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export const knowledgeBaseApi = {
  getAll: () => apiRequest('/knowledge-base'),
  
  getById: (id: string) => apiRequest(`/knowledge-base/${id}`),
  
  createFromText: (data: { name: string; description?: string; content: string }) =>
    apiRequest('/knowledge-base/text', { method: 'POST', body: JSON.stringify(data) }),
    
  createFromUrl: (data: { name: string; description?: string; url: string }) =>
    apiRequest('/knowledge-base/url', { method: 'POST', body: JSON.stringify(data) }),
    
  createFromUpload: (formData: FormData) =>
    apiRequest('/knowledge-base/upload', {
      method: 'POST',
      body: formData, // FormData doesn't need Content-Type header (browser sets it with boundary)
      isFormData: true, 
    }),
    
  delete: (id: string) => apiRequest(`/knowledge-base/${id}`, { method: 'DELETE' }),
  
  testSearch: (id: string, query: string, topK?: number) =>
    apiRequest(`/knowledge-base/${id}/search`, { method: 'POST', body: JSON.stringify({ query, topK }) }),
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => apiRequest('/settings'),

  update: (data: Record<string, string>) =>
    apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  testGroq: (apiKey?: string) =>
    apiRequest('/settings/test-groq', { method: 'POST', body: JSON.stringify({ apiKey }) }),

  testDeepgram: (apiKey?: string) =>
    apiRequest('/settings/test-deepgram', { method: 'POST', body: JSON.stringify({ apiKey }) }),
};

// ─── Campaigns ─────────────────────────────────────────────────────────────────

export const campaignsApi = {
  getAll: () => apiRequest('/campaigns'),
  create: (data: any) => apiRequest('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/campaigns/${id}`, { method: 'DELETE' }),
  start: (id: string) => apiRequest(`/campaigns/${id}/start`, { method: 'POST' }),
  pause: (id: string) => apiRequest(`/campaigns/${id}/pause`, { method: 'POST' }),
};

// ─── Webhooks ────────────────────────────────────────────────────────────────

export const webhooksApi = {
  getAll: () => apiRequest('/webhooks'),

  create: (data: any) =>
    apiRequest('/webhooks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/webhooks/${id}`, { method: 'DELETE' }),

  test: (id: string) =>
    apiRequest(`/webhooks/${id}/test`, { method: 'POST' }),
};

// ─── Public ──────────────────────────────────────────────────────────────────

export const publicApi = {
  getVoices: () => apiRequest('/voices'),
  getModels: () => apiRequest('/models'),
  healthCheck: () => apiRequest('/health').catch(() => ({ status: 'offline' })),
};

// ─── Twilio ──────────────────────────────────────────────────────────────────

export const twilioApi = {
  makeOutboundCall: (to: string, agentId: string) =>
    apiRequest('/twilio/outbound', { method: 'POST', body: JSON.stringify({ to, agentId }) }),

  getCallStatus: (callSid: string) =>
    apiRequest(`/twilio/call/${callSid}`),
};

// ─── WebSocket Voice Session ─────────────────────────────────────────────────

export function createVoiceSession(
  agentId: string,
  options?: { preferBinaryAudio?: boolean }
): WebSocket {
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`${WS_BASE}/ws/voice`);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    // Initialize session
    ws.send(JSON.stringify({
      type: 'init',
      agentId,
      token,
      preferBinaryAudio: options?.preferBinaryAudio ?? true,
    }));
  };

  return ws;
}

export const API_URL = API_BASE;
export const WS_URL = WS_BASE;


// Call Flows
export const callFlowsApi = {
  getAll: () => apiRequest('/call-flows'),
  getById: (id: string) => apiRequest(`/call-flows/${id}`),
  create: (data: any) => apiRequest('/call-flows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest(`/call-flows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/call-flows/${id}`, { method: 'DELETE' }),
};

// Update webhooks api to support logs
export const webhooksLogsApi = {
  getAllLogs: () => apiRequest('/webhooks/logs'),
  getLogsByWebhook: (id: string) => apiRequest(`/webhooks/${id}/logs`),
};

// ─── Super Admin ─────────────────────────────────────────────────────────────

export const superAdminApi = {
  getStats: () => apiRequest('/super-admin/stats'),
  getUsers: (search = '') => apiRequest(`/super-admin/users?search=${encodeURIComponent(search)}`),
  getUserDetail: (id: string) => apiRequest(`/super-admin/users/${id}`),
  updateSubscription: (id: string, plan: string, status: string) =>
    apiRequest(`/super-admin/users/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ plan, status }),
    }),
  updateRole: (id: string, role: string) =>
    apiRequest(`/super-admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id: string) =>
    apiRequest(`/super-admin/users/${id}`, { method: 'DELETE' }),
  getCalls: () => apiRequest('/super-admin/calls'),
};

// ─── CRM (Leads & Tickets) ───────────────────────────────────────────────────

export const crmApi = {
  getLeads: () => apiRequest('/crm/leads'),
  createLead: (data: any) => apiRequest('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
  
  getTickets: () => apiRequest('/crm/tickets'),
  createTicket: (data: any) => apiRequest('/crm/tickets', { method: 'POST', body: JSON.stringify(data) }),
};
