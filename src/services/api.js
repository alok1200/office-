import { announceDataChange } from './dataChanges';

const backendUrl = (import.meta.env?.VITE_BACKEND_URL || '').trim().replace(/\/+$/, '');
const API_BASE = '/api';

async function appFetch(path, options = {}) {
  const response = await fetch(`${backendUrl}${path}`, options);
  if (response.ok) announceDataChange(path, options.method || 'GET');
  return response;
}

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
  createHRAdmin: async payload => {
    const res = await appFetch(`${API_BASE}/super-admin/hr-admins`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  // Authentication & Login
  login: async (identifier, password) => {
    const res = await appFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return res.json();
  },
  logout: async () => {
    try {
      const res = await appFetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
      return res.json();
    } catch (e) {
      return { success: true };
    }
  },
  getCurrentUser: async (userId) => {
    const res = await appFetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  getAdminOffices: async (userId, signal) => {
    const res = await appFetch(`${API_BASE}/super-admin/offices`, { headers: getHeaders(userId), signal });
    return res.json();
  },
  saveAdminOffice: async (userId, id, payload) => {
    const res = await appFetch(`${API_BASE}/super-admin/offices${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  deleteAdminOffice: async (userId, id) => {
    const res = await appFetch(`${API_BASE}/super-admin/offices/${id}`, { method: 'DELETE', headers: getHeaders(userId) });
    return res.json();
  },
  getAdminOfficeAudit: async (userId) => {
    const res = await appFetch(`${API_BASE}/super-admin/admin/audit-log`, { headers: getHeaders(userId) });
    return res.json();
  },
  getPendingApprovals: async (userId) => {
    const res = await appFetch(`${API_BASE}/super-admin/approvals`, { headers: getHeaders(userId) });
    return res.json();
  },
  getSuperAdminHRRequests: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/super-admin/hr-requests${params ? `?${params}` : ''}`, { headers: getHeaders(userId) });
    return res.json();
  },
  getAllSuperAdminRequests: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/super-admin/requests/all${params ? `?${params}` : ''}`, { headers: getHeaders(userId) });
    return res.json();
  },
  editAttendanceBySuperAdmin: async (userId, payload) => {
    const res = await appFetch(`${API_BASE}/super-admin/attendance/edit`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  reviewSuperAdminRequest: async (userId, id, payload) => {
    const res = await appFetch(`${API_BASE}/super-admin/requests/${id}/decision`, { method: 'PATCH', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  getMonthlyAttendanceReport: async (userId, filters) => {
    const res = await appFetch(`${API_BASE}/super-admin/reports/attendance?${new URLSearchParams(filters)}`, { headers: getHeaders(userId) });
    return res.json();
  },
  exportMonthlyAttendanceReport: async (userId, filters, format) => {
    const res = await appFetch(`${API_BASE}/super-admin/reports/attendance/export?${new URLSearchParams({ ...filters, format })}`, { headers: getHeaders(userId) });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Export failed.');
    }
    return res.blob();
  },
  getSuperAdminRequestOptions: async (userId, year) => {
    const res = await appFetch(`${API_BASE}/super-admin/requests/options?year=${year}`, { headers: getHeaders(userId) });
    return res.json();
  },
  previewSuperAdminRequest: async (userId, payload) => {
    const res = await appFetch(`${API_BASE}/super-admin/requests/preview`, { method: 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  submitSuperAdminRequest: async (userId, payload) => {
    const res = await appFetch(`${API_BASE}/super-admin/requests`, { method: 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) });
    return res.json();
  },
  cancelSuperAdminRequest: async (userId, id) => {
    const res = await appFetch(`${API_BASE}/super-admin/requests/${id}/cancel`, { method: 'PATCH', headers: getHeaders(userId) });
    return res.json();
  },
  getSuperAdminDashboard: async (userId) => {
    const res = await appFetch(`${API_BASE}/super-admin/dashboard?office=primary`, { headers: getHeaders(userId) });
    return res.json();
  },
  getOfficeLocation: async () => {
    const res = await appFetch(`${API_BASE}/office-location`, { headers: getHeaders(localStorage.getItem('knooviq_user_id')) });
    return res.json();
  },
  updateOfficeLocation: async (payload) => {
    const res = await appFetch(`${API_BASE}/office-location`, {
      method: 'PUT', headers: getHeaders(localStorage.getItem('knooviq_user_id')), body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Attendance
  getTodayAttendance: async (userId) => {
    const res = await appFetch(`${API_BASE}/attendance/today`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  recordPunch: async (userId, action, location = {}) => {
    const res = await appFetch(`${API_BASE}/attendance/punch`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ action, ...location })
    });
    return res.json();
  },
  getMyCalendar: async (userId, year, month, employeeId) => {
    const res = await appFetch(`${API_BASE}/attendance/calendar?year=${year}&month=${month}${employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : ''}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // HR Attendance
  getCompanyAttendance: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/attendance/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getCompanySummary: async (userId) => {
    const res = await appFetch(`${API_BASE}/attendance/summary`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  exportCompanyMonthlyAttendance: async (filters, format) => {
    const res = await appFetch(`${API_BASE}/attendance/export?${new URLSearchParams({ ...filters, format })}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Export failed.');
    }
    return res.blob();
  },

  getAttendanceCorrections: async (signal) => (await appFetch(`${API_BASE}/requests/attendance-corrections`, { headers: getHeaders(), signal })).json(),
  raiseAttendanceCorrection: async (payload) => (await appFetch(`${API_BASE}/requests/attendance-corrections`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) })).json(),
  getAttendanceCorrectionAudit: async (id) => (await appFetch(`${API_BASE}/requests/attendance-corrections/${id}/audit`, { headers: getHeaders() })).json(),

  // Requests
  getMyRequestOptions: async (userId, year) => (await appFetch(`${API_BASE}/requests/options?year=${year}`, { headers: getHeaders(userId) })).json(),
  previewMyRequest: async (userId, payload) => (await appFetch(`${API_BASE}/requests/preview`, { method: 'POST', headers: getHeaders(userId), body: JSON.stringify(payload) })).json(),
  getMyRequests: async (userId, signal) => {
    const res = await appFetch(`${API_BASE}/requests/my`, {
      signal, headers: getHeaders(userId)
    });
    return res.json();
  },
  submitMyRequest: async (userId, payload) => {
    const res = await appFetch(`${API_BASE}/requests/my`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  cancelMyRequest: async (userId, id) => {
    const res = await appFetch(`${API_BASE}/requests/${id}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getCompanyRequests: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/requests/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // Employees (HR Directory)
  getMyProfile: async (userId) => {
    const res = await appFetch(`${API_BASE}/employees/me`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getCompanyEmployees: async (userId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/employees/company?${params}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getEmployeeAttendanceHistory: async (userId, empId, year, month) => {
    const res = await appFetch(`${API_BASE}/employees/${empId}/attendance-history?year=${year}&month=${month}`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  createEmployee: async (payload) => (await appFetch(`${API_BASE}/employees/company`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) })).json(),
  updateEmployee: async (id, payload) => (await appFetch(`${API_BASE}/employees/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) })).json(),
  getEmployeeDetails: async (id) => (await appFetch(`${API_BASE}/employees/${id}/details`, { headers: getHeaders() })).json(),
  addEmployeeAsset: async (id, payload) => (await appFetch(`${API_BASE}/employees/${id}/assets`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) })).json(),
  returnEmployeeAsset: async (assetId, returned_date) => (await appFetch(`${API_BASE}/employees/assets/${assetId}/return`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ returned_date }) })).json(),
  resetEmployeePassword: async (id, password) => (await appFetch(`${API_BASE}/employees/${id}/password`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ password }) })).json(),
  deleteEmployee: async (id) => (await appFetch(`${API_BASE}/employees/${id}`, { method: 'DELETE', headers: getHeaders() })).json(),
  getMyAssets: async () => (await appFetch(`${API_BASE}/employees/me/assets`, { headers: getHeaders() })).json(),

  // Holidays & Notifications
  getHolidays: async (userId) => {
    const res = await appFetch(`${API_BASE}/holidays`, {
      headers: getHeaders(userId)
    });
    return res.json();
  },
  createHoliday: async (userId, payload) => {
    const res = await appFetch(`${API_BASE}/holidays`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateHoliday: async (userId, id, payload) => {
    const res = await appFetch(`${API_BASE}/holidays/${id}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  deleteHoliday: async (userId, id) => {
    const res = await appFetch(`${API_BASE}/holidays/${id}`, {
      method: 'DELETE',
      headers: getHeaders(userId)
    });
    return res.json();
  },
  getNotifications: async (userId, signal) => {
    const res = await appFetch(`${API_BASE}/notifications`, {
      signal, headers: getHeaders(userId)
    });
    return res.json();
  },
  markNotificationRead: async (userId, id) => {
    const res = await appFetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(userId)
    });
    return res.json();
  },

  // Payroll & Monthly Salary Management
  getPayrollDashboard: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/payroll/dashboard${params ? `?${params}` : ''}`, { headers: getHeaders() });
    return res.json();
  },
  listEmployeeSalaries: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/payroll/salaries${params ? `?${params}` : ''}`, { headers: getHeaders() });
    return res.json();
  },
  upsertEmployeeSalary: async (employeeId, payload) => {
    const res = await appFetch(`${API_BASE}/payroll/salaries/${employeeId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  getSalaryHistory: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await appFetch(`${API_BASE}/payroll/salary-history${params ? `?${params}` : ''}`, { headers: getHeaders() });
    return res.json();
  },
  upsertEmployeeBankAccount: async (employeeId, payload) => {
    const res = await appFetch(`${API_BASE}/payroll/bank-accounts/${employeeId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  previewMonthlyPayroll: async (filters) => {
    const res = await appFetch(`${API_BASE}/payroll/periods/preview?${new URLSearchParams(filters)}`, { headers: getHeaders() });
    return res.json();
  },
  generateMonthlyPayroll: async (payload) => {
    const res = await appFetch(`${API_BASE}/payroll/periods/generate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  listPayrollPeriods: async () => {
    const res = await appFetch(`${API_BASE}/payroll/periods`, { headers: getHeaders() });
    return res.json();
  },
  getPayrollPeriodDetails: async (id) => {
    const res = await appFetch(`${API_BASE}/payroll/periods/${id}`, { headers: getHeaders() });
    return res.json();
  },
  exportPayrollReport: async (filters, format) => {
    const res = await appFetch(`${API_BASE}/payroll/reports/export?${new URLSearchParams({ ...filters, format })}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Export failed.');
    }
    return res.blob();
  }
};
