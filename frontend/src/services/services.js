import api from './api';

// ---------------- Auth ----------------
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
    googleAuth: (data) => api.post('/auth/google', data),
    googleLogin: (data) => api.post('/auth/google', data),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
    changePassword: (data) => api.put('/auth/change-password', data)
};

// ---------------- Dashboard / Reports ----------------
export const dashboardService = {
    getDashboard: () => api.get('/dashboard'),
    getMonthlyReport: (month) => api.get('/reports/monthly', { params: { month } }),
    getSemesterReport: (startDate, endDate) => api.get('/reports/semester', { params: { startDate, endDate } }),
    getSavingsPerformance: () => api.get('/reports/savings-performance')
};

// ---------------- Income ----------------
export const incomeService = {
    getAll: (params) => api.get('/income', { params }),
    add: (data) => api.post('/income', data),
    update: (id, data) => api.put(`/income/${id}`, data),
    remove: (id) => api.delete(`/income/${id}`)
};

// ---------------- Expenses ----------------
export const expenseService = {
    getAll: (params) => api.get('/expenses', { params }),
    add: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    remove: (id) => api.delete(`/expenses/${id}`)
};

// ---------------- Budgets ----------------
export const budgetService = {
    getAll: () => api.get('/budgets'),
    getDetail: (id) => api.get(`/budgets/${id}`),
    suggest: (totalIncome) => api.post('/budgets/suggest', { totalIncome }),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    remove: (id) => api.delete(`/budgets/${id}`)
};

// ---------------- Savings ----------------
export const savingsService = {
    getAll: () => api.get('/savings'),
    getDetail: (id) => api.get(`/savings/${id}`),
    create: (data) => api.post('/savings', data),
    update: (id, data) => api.put(`/savings/${id}`, data),
    remove: (id) => api.delete(`/savings/${id}`),
    contribute: (id, data) => api.post(`/savings/${id}/contribute`, data)
};

// ---------------- Recurring Expenses ----------------
export const recurringService = {
    getAll: () => api.get('/recurring'),
    add: (data) => api.post('/recurring', data),
    update: (id, data) => api.put(`/recurring/${id}`, data),
    remove: (id) => api.delete(`/recurring/${id}`),
    logPayment: (id) => api.post(`/recurring/${id}/log-payment`)
};

// ---------------- Alerts ----------------
export const alertService = {
    getAll: (status) => api.get('/alerts', { params: status ? { status } : {} }),
    markRead: (id) => api.put(`/alerts/${id}/read`),
    dismiss: (id) => api.put(`/alerts/${id}/dismiss`),
    refresh: () => api.post('/alerts/refresh')
};

// ---------------- Categories ----------------
export const categoryService = {
    getAll: (type) => api.get('/categories', { params: type ? { type } : {} }),
    add: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    remove: (id) => api.delete(`/categories/${id}`)
};

// ---------------- Admin ----------------
export const adminService = {
    getUsers: () => api.get('/admin/users'),
    disableUser: (id) => api.put(`/admin/users/${id}/disable`),
    enableUser: (id) => api.put(`/admin/users/${id}/enable`),
    getStats: () => api.get('/admin/stats'),
    getActivity: () => api.get('/admin/activity')
};
