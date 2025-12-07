/**
 * Tenant-Aware API Client
 * Centralized API client for multi-tenant SaaS
 * Created: 2025-12-07
 */

import { logger } from './logger';

/**
 * Convert frontend slug (with dashes) to backend slug (with underscores)
 * @param {string} slug - Frontend slug (e.g., 'quattro-stand')
 * @returns {string} Backend slug (e.g., 'quattro_stand')
 */
export const slugToBackendFormat = (slug) => {
  if (!slug) return '';
  return slug.replace(/-/g, '_');
};

/**
 * Convert backend slug (with underscores) to frontend slug (with dashes)
 * @param {string} slug - Backend slug (e.g., 'quattro_stand')
 * @returns {string} Frontend slug (e.g., 'quattro-stand')
 */
export const slugToFrontendFormat = (slug) => {
  if (!slug) return '';
  return slug.replace(/_/g, '-');
};

/**
 * Get backend URL from environment
 * @returns {string} Backend URL
 */
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 
         window.runtimeConfig?.REACT_APP_BACKEND_URL || 
         'http://localhost:8001';
};

/**
 * Parse JSON response safely
 * @param {Response} res - Fetch response
 * @returns {Promise<any>} Parsed JSON or null
 */
const parseJsonSafe = async (res) => {
  if (res.status === 204) return null; // No Content
  const text = await res.text();

  if (!text || !text.trim()) return null; // Empty body

  // Clean BOM and Angular JSON-hijack prefix
  const cleaned = text
    .replace(/^\uFEFF/, '')         // UTF-8 BOM
    .replace(/^\)]\}',?\s*/, '');  // )]},

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Non-JSON response:', cleaned.slice(0, 200));
    throw new Error(`Non-JSON response (${res.status})`);
  }
};

/**
 * Tenant-Aware API Client Class
 */
class ApiClient {
  constructor() {
    this.baseUrl = getBackendUrl();
    this.tenantSlug = null;
  }

  /**
   * Set tenant slug for API calls
   * @param {string} slug - Frontend tenant slug (with dashes)
   */
  setTenantSlug(slug) {
    this.tenantSlug = slug;
  }

  /**
   * Get tenant slug in backend format
   * @returns {string} Backend tenant slug (with underscores)
   */
  getTenantSlug() {
    return this.tenantSlug ? slugToBackendFormat(this.tenantSlug) : null;
  }

  /**
   * Build URL with tenant slug
   * @param {string} endpoint - API endpoint
   * @param {boolean} useTenant - Whether to include tenant slug
   * @returns {string} Full URL
   */
  buildUrl(endpoint, useTenant = true) {
    const backendSlug = this.getTenantSlug();
    
    if (useTenant && backendSlug) {
      // Tenant-aware endpoint: /api/{tenant_slug}/resource
      return `${this.baseUrl}/api/${backendSlug}${endpoint}`;
    } else {
      // Global endpoint: /api/resource
      return `${this.baseUrl}${endpoint}`;
    }
  }

  /**
   * Get auth token from localStorage
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Generic fetch wrapper with JWT authentication
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @param {boolean} useTenant - Whether to use tenant-aware URL
   * @returns {Promise<any>} Response data
   */
  async fetch(endpoint, options = {}, useTenant = true) {
    const url = this.buildUrl(endpoint, useTenant);
    
    // Get auth token
    const token = this.getAuthToken();
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // Add Authorization header if token exists
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Token expired or invalid');
        // Clear auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await parseJsonSafe(response).catch(() => null);
        throw new Error(
          errorData?.detail || 
          errorData?.message || 
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      return await parseJsonSafe(response);
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, useTenant = true) {
    return this.fetch(endpoint, { method: 'GET' }, useTenant);
  }

  async post(endpoint, data, useTenant = true) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, useTenant);
  }

  async put(endpoint, data, useTenant = true) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, useTenant);
  }

  async patch(endpoint, data, useTenant = true) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }, useTenant);
  }

  async delete(endpoint, useTenant = true) {
    return this.fetch(endpoint, { method: 'DELETE' }, useTenant);
  }

  // Resource-specific methods

  /**
   * Get all customers for tenant
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Customers response
   */
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return this.get(endpoint, true);
  }

  /**
   * Get single customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise<object>} Customer data
   */
  async getCustomer(id) {
    return this.get(`/customers/${id}`, true);
  }

  /**
   * Create new customer
   * @param {object} data - Customer data
   * @returns {Promise<object>} Created customer
   */
  async createCustomer(data) {
    return this.post('/customers', data, true);
  }

  /**
   * Update customer
   * @param {string} id - Customer ID
   * @param {object} data - Customer data
   * @returns {Promise<object>} Updated customer
   */
  async updateCustomer(id, data) {
    return this.put(`/customers/${id}`, data, true);
  }

  /**
   * Delete customer
   * @param {string} id - Customer ID
   * @returns {Promise<object>} Delete response
   */
  async deleteCustomer(id) {
    return this.delete(`/customers/${id}`, true);
  }

  /**
   * Get tenant by slug from platform database
   * @param {string} slug - Frontend tenant slug
   * @returns {Promise<object>} Tenant data
   */
  async getTenantBySlug(slug) {
    const backendSlug = slugToBackendFormat(slug);
    return this.fetch(`/api/${backendSlug}/test`, { method: 'GET' }, false);
  }

  // === PROJECTS ===
  async getProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/projects?${queryString}` : '/projects', true);
  }

  async getProject(id) {
    return this.get(`/projects/${id}`, true);
  }

  async createProject(data) {
    return this.post('/projects', data, true);
  }

  async updateProject(id, data) {
    return this.put(`/projects/${id}`, data, true);
  }

  async deleteProject(id) {
    return this.delete(`/projects/${id}`, true);
  }

  // === OPPORTUNITIES/LEADS ===
  async getOpportunities(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/opportunities?${queryString}` : '/opportunities', true);
  }

  async getOpportunity(id) {
    return this.get(`/opportunities/${id}`, true);
  }

  async createOpportunity(data) {
    return this.post('/opportunities', data, true);
  }

  async updateOpportunity(id, data) {
    return this.put(`/opportunities/${id}`, data, true);
  }

  async deleteOpportunity(id) {
    return this.delete(`/opportunities/${id}`, true);
  }

  async updateOpportunityStage(id, stage) {
    return this.patch(`/opportunities/${id}/stage`, { stage }, true);
  }

  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/leads?${queryString}` : '/leads', true);
  }

  async getLead(id) {
    return this.get(`/leads/${id}`, true);
  }

  async createLead(data) {
    return this.post('/leads', data, true);
  }

  async updateLead(id, data) {
    return this.put(`/leads/${id}`, data, true);
  }

  async deleteLead(id) {
    return this.delete(`/leads/${id}`, true);
  }

  // === INVOICES ===
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/invoices?${queryString}` : '/invoices', true);
  }

  async getInvoice(id) {
    return this.get(`/invoices/${id}`, true);
  }

  async createInvoice(data) {
    return this.post('/invoices', data, true);
  }

  async updateInvoice(id, data) {
    return this.put(`/invoices/${id}`, data, true);
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`, true);
  }

  async updateInvoiceStatus(id, status) {
    return this.patch(`/invoices/${id}/status`, { status }, true);
  }

  async getNextInvoiceNumber(currency) {
    return this.get(`/invoices/next-number/${currency}`, true);
  }

  // === CALENDAR ===
  async getCalendarEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/calendar/events?${queryString}` : '/calendar/events', true);
  }

  async getCalendarEvent(id) {
    return this.get(`/calendar/events/${id}`, true);
  }

  async createCalendarEvent(data) {
    return this.post('/calendar/events', data, true);
  }

  async updateCalendarEvent(id, data) {
    return this.put(`/calendar/events/${id}`, data, true);
  }

  async deleteCalendarEvent(id) {
    return this.delete(`/calendar/events/${id}`, true);
  }

  // === TASKS ===
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/tasks?${queryString}` : '/tasks', true);
  }

  async getTask(id) {
    return this.get(`/tasks/${id}`, true);
  }

  async createTask(data) {
    return this.post('/tasks', data, true);
  }

  async updateTask(id, data) {
    return this.put(`/tasks/${id}`, data, true);
  }

  async deleteTask(id) {
    return this.delete(`/tasks/${id}`, true);
  }

  // === SUPPLIERS ===
  async getSuppliers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/suppliers?${queryString}` : '/suppliers', true);
  }

  async getSupplier(id) {
    return this.get(`/suppliers/${id}`, true);
  }

  async createSupplier(data) {
    return this.post('/suppliers', data, true);
  }

  async updateSupplier(id, data) {
    return this.put(`/suppliers/${id}`, data, true);
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`, true);
  }

  // === BANKS ===
  async getBanks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/banks?${queryString}` : '/banks', true);
  }

  async getBank(id) {
    return this.get(`/banks/${id}`, true);
  }

  async createBank(data) {
    return this.post('/banks', data, true);
  }

  async updateBank(id, data) {
    return this.put(`/banks/${id}`, data, true);
  }

  async deleteBank(id) {
    return this.delete(`/banks/${id}`, true);
  }

  // === PROPOSALS ===
  async getProposals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/proposals?${queryString}` : '/proposals', true);
  }

  async getProposal(id) {
    return this.get(`/proposals/${id}`, true);
  }

  async createProposal(data) {
    return this.post('/proposals', data, true);
  }

  async updateProposal(id, data) {
    return this.put(`/proposals/${id}`, data, true);
  }

  async deleteProposal(id) {
    return this.delete(`/proposals/${id}`, true);
  }

  // === CONTRACTS ===
  async getContracts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/contracts?${queryString}` : '/contracts', true);
  }

  async getContract(id) {
    return this.get(`/contracts/${id}`, true);
  }

  async createContract(data) {
    return this.post('/contracts', data, true);
  }

  async updateContract(id, data) {
    return this.put(`/contracts/${id}`, data, true);
  }

  async deleteContract(id) {
    return this.delete(`/contracts/${id}`, true);
  }

  // === FAIRS ===
  async getFairs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/fairs?${queryString}` : '/fairs', true);
  }

  async getFair(id) {
    return this.get(`/fairs/${id}`, true);
  }

  async createFair(data) {
    return this.post('/fairs', data, true);
  }

  async updateFair(id, data) {
    return this.put(`/fairs/${id}`, data, true);
  }

  async deleteFair(id) {
    return this.delete(`/fairs/${id}`, true);
  }

  // === PEOPLE ===
  async getPeople(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/people?${queryString}` : '/people', true);
  }

  async getPerson(id) {
    return this.get(`/people/${id}`, true);
  }

  async createPerson(data) {
    return this.post('/people', data, true);
  }

  async updatePerson(id, data) {
    return this.put(`/people/${id}`, data, true);
  }

  async deletePerson(id) {
    return this.delete(`/people/${id}`, true);
  }

  // === EXPENSE RECEIPTS ===
  async getExpenseReceipts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/expense-receipts?${queryString}` : '/expense-receipts', true);
  }

  async getExpenseReceipt(id) {
    return this.get(`/expense-receipts/${id}`, true);
  }

  async createExpenseReceipt(data) {
    return this.post('/expense-receipts', data, true);
  }

  async updateExpenseReceipt(id, data) {
    return this.put(`/expense-receipts/${id}`, data, true);
  }

  async deleteExpenseReceipt(id) {
    return this.delete(`/expense-receipts/${id}`, true);
  }

  // === BRIEFS ===
  async getBriefs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/briefs?${queryString}` : '/briefs', true);
  }

  async getBrief(id) {
    return this.get(`/briefs/${id}`, true);
  }

  async createBrief(data) {
    return this.post('/briefs', data, true);
  }

  async updateBrief(id, data) {
    return this.put(`/briefs/${id}`, data, true);
  }

  async deleteBrief(id) {
    return this.delete(`/briefs/${id}`, true);
  }

  // === PRODUCTS ===
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/products?${queryString}` : '/products', true);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`, true);
  }

  async createProduct(data) {
    return this.post('/products', data, true);
  }

  async updateProduct(id, data) {
    return this.put(`/products/${id}`, data, true);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`, true);
  }

  // === DASHBOARD ===
  async getDashboardOverview() {
    return this.get('/dashboard/overview', true);
  }

  async getDashboardRecentActivities(limit = 20) {
    return this.get(`/dashboard/recent-activities?limit=${limit}`, true);
  }

  async getDashboardUpcomingTasks(limit = 10) {
    return this.get(`/dashboard/upcoming-tasks?limit=${limit}`, true);
  }

  async getDashboardUpcomingEvents(limit = 10) {
    return this.get(`/dashboard/upcoming-events?limit=${limit}`, true);
  }

  // === STATS ===
  async getStats() {
    return this.get('/stats', true);
  }

  // === REPORTS ===
  async getSalesReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/reports/sales?${queryString}` : '/reports/sales', true);
  }

  async getPipelineReport() {
    return this.get('/reports/pipeline', true);
  }

  async getCustomersReport() {
    return this.get('/reports/customers', true);
  }

  async getPerformanceReport(period = '30days') {
    return this.get(`/reports/performance?period=${period}`, true);
  }

  // === SETTINGS ===
  async getSettings() {
    return this.get('/settings', true);
  }

  async getSetting(key) {
    return this.get(`/settings/${key}`, true);
  }

  async updateSetting(key, data) {
    return this.put(`/settings/${key}`, data, true);
  }

  async updateSettingsBulk(settings) {
    return this.post('/settings/bulk', settings, true);
  }

  // === USERS (tenant users) ===
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/users?${queryString}` : '/users', true);
  }

  async getUser(id) {
    return this.get(`/users/${id}`, true);
  }

  async createUser(data) {
    return this.post('/users', data, true);
  }

  async updateUser(id, data) {
    return this.put(`/users/${id}`, data, true);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`, true);
  }

  async updateUserStatus(id, status) {
    return this.patch(`/users/${id}/status`, { status }, true);
  }

  // === DOCUMENTS ===
  async getDocuments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/documents?${queryString}` : '/documents', true);
  }

  async getDocument(id) {
    return this.get(`/documents/${id}`, true);
  }

  async createDocument(data) {
    return this.post('/documents', data, true);
  }

  async deleteDocument(id) {
    return this.delete(`/documents/${id}`, true);
  }

  // === ACTIVITIES ===
  async getActivities(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(queryString ? `/activities?${queryString}` : '/activities', true);
  }

  async getActivity(id) {
    return this.get(`/activities/${id}`, true);
  }

  async createActivity(data) {
    return this.post('/activities', data, true);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
