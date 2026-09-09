// Same-origin API by default: the dev server / preview proxy forwards /api to the
// backend, so one build works from localhost and LAN phones over http or https.
// Set VITE_API_URL to call the backend directly instead.
const API_BASE =
  import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

class ApiError extends Error {
  status: number;
  data: ApiResponse;

  constructor(status: number, data: ApiResponse) {
    super(data.message || 'API Error');
    this.status = status;
    this.data = data;
  }
}

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T = ApiResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  let data: any = {};
  const text = await response.text();
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
};

export const api = {
  get: <T = ApiResponse>(endpoint: string, params?: Record<string, string | number>) => {
    const query = params
      ? '?' + new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)).toString()
      : '';
    return request<T>(`${endpoint}${query}`, { method: 'GET' });
  },

  post: <T = ApiResponse>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = ApiResponse>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T = ApiResponse>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T = ApiResponse>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; token?: string; user?: Record<string, unknown>; requiresTwoFactor?: boolean; requiresTwoFactorSetup?: boolean; qrCodeUrl?: string; secret?: string; userId?: string; message?: string }>('/auth/login', { email, password }),

  verifyTwoFactor: (userId: string, code: string) =>
    api.post<{ success: boolean; token: string; user: Record<string, unknown> }>('/auth/verify-2fa', { userId, code }),

  register: (name: string, email: string, phone: string, password: string, role?: string) =>
    api.post<{ success: boolean; token?: string; user?: Record<string, unknown>; requiresTwoFactorSetup?: boolean; qrCodeUrl?: string; secret?: string; userId?: string; message?: string }>('/auth/register', { name, email, phone, password, role }),

  getMe: () =>
    api.get<{ success: boolean; user: Record<string, unknown> }>('/auth/me'),

  updateProfile: (data: Record<string, unknown>) =>
    api.put<{ success: boolean; user: Record<string, unknown> }>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ success: boolean; message: string }>('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; resetCode?: string; rawToken?: string }>('/auth/forgot-password', { email }),

  resetPassword: (payload: { email: string; token?: string; code?: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string; token?: string; user?: Record<string, unknown> }>('/auth/reset-password', payload),

  setupTwoFactor: () =>
    api.post<{ success: boolean; qrCodeUrl: string; secret: string; message: string }>('/auth/2fa/setup', {}),

  confirmTwoFactor: (code: string) =>
    api.post<{ success: boolean; message: string; backupCodes?: string[] }>('/auth/2fa/confirm', { code }),

  regenerateBackupCodes: () =>
    api.post<{ success: boolean; message: string; backupCodes: string[] }>('/auth/2fa/regenerate-backup-codes', {}),

  sendTwoFactorEmailCode: (userId: string) =>
    api.post<{ success: boolean; message: string; expiresIn?: number; code?: string }>('/auth/2fa/email-code', { userId }),

  disableTwoFactor: () =>
    api.post<{ success: boolean; message: string }>('/auth/2fa/disable', {}),
};

export const slotApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; count: number; slots: Record<string, unknown>[] }>(`/slots${query}`);
  },

  getAvailable: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; count: number; slots: Record<string, unknown>[] }>(`/slots/available${query}`);
  },

  getById: (id: string) =>
    api.get<{ success: boolean; slot: Record<string, unknown> }>(`/slots/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; slot: Record<string, unknown> }>('/slots', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; slot: Record<string, unknown> }>(`/slots/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/slots/${id}`),

  updateStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; slot: Record<string, unknown> }>(`/slots/${id}/status`, { status }),
};

export const bookingApi = {
  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; booking: Record<string, unknown> }>('/bookings', data),

  getMyBookings: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get<{ success: boolean; count: number; bookings: Record<string, unknown>[] }>(`/bookings${query}`);
  },

  getById: (id: string) =>
    api.get<{ success: boolean; booking: Record<string, unknown> }>(`/bookings/${id}`),

  verifyQR: (qrToken: string) =>
    api.post<{ success: boolean; booking: Record<string, unknown> }>('/bookings/verify-qr', { qrToken }),

  markEntry: (id: string) =>
    api.post<{ success: boolean; booking: Record<string, unknown> }>(`/bookings/${id}/entry`, {}),

  markExit: (id: string) =>
    api.post<{ success: boolean; booking: Record<string, unknown> }>(`/bookings/${id}/exit`, {}),

  emailQR: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/bookings/${id}/email-qr`, {}),

  cancel: (id: string, reason?: string) =>
    api.put<{ success: boolean; booking: Record<string, unknown> }>(`/bookings/${id}/cancel`, { cancellationReason: reason }),

  joinWaitingList: (category: string) =>
    api.post<{ success: boolean; message: string }>('/bookings/waiting', { category }),

  getDynamicQR: (id: string) =>
    api.get<{
      success: boolean;
      dynamicToken: string;
      dynamicQrCode: string;
      expiresIn: number;
      rotationInterval: number;
      booking: Record<string, unknown>;
    }>(`/bookings/${id}/dynamic-qr`),
};

export const adminApi = {
  getDashboard: () =>
    api.get<{ success: boolean; stats: Record<string, unknown> }>('/admin/dashboard'),

  getAllBookings: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; count: number; bookings: Record<string, unknown>[] }>(`/admin/bookings${query}`);
  },

  getUsers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; count: number; users: Record<string, unknown>[] }>(`/admin/users${query}`);
  },

  updateUser: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; user: Record<string, unknown> }>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/admin/users/${id}`),

  getRevenue: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; revenue: Record<string, unknown> }>(`/admin/revenue${query}`);
  },

  getAnalytics: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ success: boolean; analytics: Record<string, unknown> }>(`/admin/analytics${query}`);
  },

  getNoShowReport: () =>
    api.get<{ success: boolean; bookings: Record<string, unknown>[]; count: number; percentage: number }>('/admin/reports/no-show'),

  getOverstayReport: () =>
    api.get<{ success: boolean; bookings: Record<string, unknown>[]; count: number; totalPenalty: number }>('/admin/reports/overstay'),

  updatePricing: (data: Record<string, unknown>) =>
    api.put<{ success: boolean; message: string; modifiedCount: number }>('/admin/pricing', data),

  getAuditLogs: () =>
    api.get<{ success: boolean; logs: Record<string, unknown>[] }>('/admin/audit-logs'),

  getWaitingList: () =>
    api.get<{ success: boolean; waitingList: Record<string, unknown>[] }>('/admin/waiting-list'),

  triggerRecovery: () =>
    api.post<{
      success: boolean;
      message: string;
      recoveredPending: number;
      recoveredOrphanedSlots: number;
      orphanedSlotNumbers: string[];
      cancelledNoShows: number;
      flaggedOverstays: number;
      unlockedAccounts: number;
      durationMs: number;
    }>('/admin/recovery/sweep', {}),

  getRecoveryDiagnostics: () =>
    api.get<{
      success: boolean;
      diagnostics: {
        systemHealth: 'HEALTHY' | 'RECOVERY_RECOMMENDED';
        totalSlots: number;
        availableSlots: number;
        occupiedSlots: number;
        reservedSlots: number;
        maintenanceSlots: number;
        activeBookings: number;
        orphanedSlotsDetected: number;
        stalePendingHolds: number;
        lockedUsersCount: number;
        totalBookings: number;
        lastChecked: string;
      };
    }>('/admin/recovery/diagnostics'),

  exportBackupUrl: () => `${API_BASE}/admin/backup/export`,
};

export const securityApi = {
  getDashboard: () =>
    api.get<{ success: boolean; stats: Record<string, unknown> }>('/security/dashboard'),

  getTodayLogs: () =>
    api.get<{ success: boolean; logs: Record<string, unknown>[]; totalMovements: number; entries: number; exits: number }>('/security/logs'),

  scanQR: (qrToken: string, gateMode?: string) =>
    api.post<{
      success: boolean;
      allowed: boolean;
      type: string;
      message: string;
      paymentRequired?: boolean;
      blacklisted?: boolean;
      blacklistDetails?: Record<string, unknown>;
      vehicleNumber?: string;
      unbookedVehicle?: boolean;
      warning?: string;
      booking?: Record<string, unknown>;
    }>('/security/scan', { qrToken, gateMode }),

  manualVerify: (vehicleNumber: string, gateMode?: string) =>
    api.post<{
      success: boolean;
      count?: number;
      blacklistAlert?: Record<string, unknown>;
      bookings: Record<string, unknown>[];
    }>('/security/manual-verify', { vehicleNumber, gateMode }),

  // Watchlist & Blacklist
  getBlacklist: () =>
    api.get<{ success: boolean; count: number; data: Record<string, unknown>[] }>('/security/blacklist'),

  addToBlacklist: (data: { vehicleNumber: string; reason: string; severity: string; notes?: string }) =>
    api.post<{ success: boolean; message: string; data: Record<string, unknown> }>('/security/blacklist', data),

  removeFromBlacklist: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/security/blacklist/${id}`),

  // Incident & Damage Reporting
  getIncidents: () =>
    api.get<{ success: boolean; count: number; data: Record<string, unknown>[] }>('/security/incidents'),

  createIncident: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; message: string; data: Record<string, unknown> }>('/security/incidents', data),

  updateIncident: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; message: string; data: Record<string, unknown> }>(`/security/incidents/${id}`, data),

  // Offline / Walk-in Pass
  createWalkinPass: (data: { vehicleNumber: string; vehicleType?: string; durationHours?: number; driverName?: string; driverPhone?: string }) =>
    api.post<{ success: boolean; message: string; pass: Record<string, unknown> }>('/security/walkin-pass', data),

  // Emergency SOS Trigger
  triggerEmergencySOS: (data: { emergencyType?: string; notes?: string }) =>
    api.post<{ success: boolean; message: string; alert: Record<string, unknown> }>('/security/emergency-sos', data),
};

export const layoutApi = {
  getByFloor: (floor: number) =>
    api.get<{ success: boolean; layout: { name: string; floor: number; items: Array<Record<string, unknown>> } }>(`/layout/${floor}`),

  save: (data: { floor: number; items: Array<Record<string, unknown>>; name?: string }) =>
    api.post<{ success: boolean; message: string; layout: Record<string, unknown> }>('/layout/save', data),
};

export const aiApi = {
  searchSlots: (q: string, params?: Record<string, string>) => {
    const all: Record<string, string> = { q };
    if (params) Object.assign(all, params);
    const query = '?' + new URLSearchParams(all).toString();
    return api.get<{ success: boolean; results: Array<Record<string, unknown>> }>(`/ai/search${query}`);
  },
};

export const paymentApi = {
  createOrder: (bookingId: string, type?: 'booking' | 'penalty') =>
    api.post<{ success: boolean; orderId: string; amount: number; currency: string; keyId: string; isTestMode?: boolean; message?: string }>('/payments/create-order', { bookingId, type }),

  verify: (payload: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    type?: 'booking' | 'penalty';
  }) =>
    api.post<{ success: boolean; booking: Record<string, unknown>; message?: string }>('/payments/verify', payload),

  cancel: (bookingId: string) =>
    api.post<{ success: boolean; message: string }>('/payments/cancel', { bookingId }),

  // User's own payment history
  my: () =>
    api.get<{ success: boolean; transactions: Array<Record<string, unknown>> }>('/payments/my'),

  // Admin payment management
  stats: () =>
    api.get<{ success: boolean; stats: Record<string, number> }>('/payments/stats'),
  list: (params: { q?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 0).map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get<{ success: boolean; transactions: Array<Record<string, unknown>>; total: number; page: number; pages: number }>(`/payments${query ? `?${query}` : ''}`);
  },
  detail: (bookingId: string) =>
    api.get<{ success: boolean; payment: Record<string, unknown>; booking: Record<string, unknown>; user: Record<string, unknown> | null }>(`/payments/${bookingId}`),
  exportUrl: (params: { q?: string; status?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return `${API_BASE}/payments/export${query ? `?${query}` : ''}`;
  },
};

export default api;
