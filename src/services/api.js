const API_BASE = '/api';

function getHeaders(userId) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('knooviq_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication & Login
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return res.json();
  },
  logout: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
      return res.json();
    } catch (e) {
      return { success: true };
    }
  },
  getCurrentUser: async (userId) => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  getAdminOffices: async (userId, signal) => {
    const res = await fetch(`${API_BASE}/super-admin/offices`, { headers: getHeaders(userId), signal });
    return res.json();
  },
  saveAdminOffice: async (userId, id, payload) => {
    const res = await fetch(`${API_BASE}/super-admin/offices${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  deleteAdminOffice: async (userId, id) => {
    const res = await fetch(`${API_BASE}/super-admin/offices/${id}`, { method: 'DELETE', headers: getHeaders(userId) });
    return res.json();
  },
  getAdminOfficeAudit: async (userId) => {
    const res = await fetch(`${API_BASE}/super-admin/admin/audit-log`, { headers: getHeaders(userId) });
    return res.json();
  },
  getPendingApprovals: async (userId) => {
    const res = await fetch(`${API_BASE}/super-admin/approvals`, { headers: getHeaders(userId) });
    return res.json();
  },
  reviewSuperAdminRequest: async (userId, id, payload) => {
    const res = await fetch(`${API_BASE}/super-admin/requests/${id}/decision`, { method: 'PATCH', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  getMonthlyAttendanceReport: async (userId, filters) => {
    const res = await fetch(`${API_BASE}/super-admin/reports/attendance?${new URLSearchParams(filters)}`, { headers: getHeaders(userId) });
    return res.json();
  },
  exportMonthlyAttendanceReport: async (userId, filters, format) => {
    const res = await fetch(`${API_BASE}/super-admin/reports/attendance/export?${new URLSearchParams({ ...filters, format })}`, { headers: getHeaders(userId) });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Export failed.');
    }
    return res.blob();
  },
  getSuperAdminRequestOptions: async (userId, year) => {
    const res = await fetch(`${API_BASE}/super-admin/requests/options?year=${year}`, { headers: getHeaders(userId) });
    return res.json();
  },
  previewSuperAdminRequest: async (userId, payload) => {
    const res = await fetch(`${API_BASE}/super-admin/requests/preview`, { method: 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  submitSuperAdminRequest: async (userId, payload) => {
    const res = await fetch(`${API_BASE}/super-admin/requests`, { method: 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  cancelSuperAdminRequest: async (userId, id) => {
    const res = await fetch(`${API_BASE}/super-admin/requests/${id}/cancel`, { method: 'PATCH', headers: getHeaders(userId) });
    return res.json();
  },
  getSuperAdminDashboard: async (userId) => {
    const res = await fetch(`${API_BASE}/super-admin/dashboard`, { headers: getHeaders(userId) });
    return res.json();
  },
  getOfficeLocation: async () => {
    const res = await fetch(`${API_BASE}/office-location`, { headers: getHeaders(localStorage.getItem('knooviq_user_id')) });
    return res.json();
  },
  updateOfficeLocation: async (payload) => {
    const res = await fetch(`${API_BASE}/office-location`, {
      method: 'PUT', headers: getHeaders(localStorage.getItem('knooviq_user_id')), body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Attendance
  getTodayAttendance: async (userId) => {
    const res = await fetch(`${API_BASE}/attendance/today`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  recordPunch: async (userId, action, location = {}) => {
    const res = await fetch(`${API_BASE}/attendance/punch`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ action, ...location })
    });
    return res.json();
  },
  getMyCalendar: async (userId, year, month) => {
    const res = await fetch(`${API_BASE}/attendance/calendar?year=${year}&month=${month}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // HR Attendance
  getCompanyAttendance: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/attendance/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getCompanySummary: async (userId) => {
    const res = await fetch(`${API_BASE}/attendance/summary`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // Requests
  getMyRequests: async (userId, signal) => {
    const res = await fetch(`${API_BASE}/requests/my`, {
      signal, headers: getHeaders(userId)
    });
    return res.json();
  },
  submitMyRequest: async (userId, payload) => {
    const res = await fetch(`${API_BASE}/requests/my`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getCompanyRequests: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/requests/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // Employees (HR Directory)
  getMyProfile: async (userId) => {
    const res = await fetch(`${API_BASE}/employees/me`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getCompanyEmployees: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/employees/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getEmployeeAttendanceHistory: async (userId, empId, year, month) => {
    const res = await fetch(`${API_BASE}/employees/${empId}/attendance-history?year=${year}&month=${month}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // Holidays & Notifications
  getHolidays: async (userId) => {
    const res = await fetch(`${API_BASE}/holidays`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  createHoliday: async (userId, payload) => {
    const res = await fetch(`${API_BASE}/holidays`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateHoliday: async (userId, id, payload) => {
    const res = await fetch(`${API_BASE}/holidays/${id}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteHoliday: async (userId, id) => {
    const res = await fetch(`${API_BASE}/holidays/${id}`, {
      method: 'DELETE',
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getNotifications: async (userId, signal) => {
    const res = await fetch(`${API_BASE}/notifications`, {
      signal, headers: getHeaders(userId)
    });
    return res.json();
  },
  markNotificationRead: async (userId, id) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(userId)
    });
    return res.json();
  }
};
