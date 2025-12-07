/**
 * Tenant-Aware API Client
 * Centralized API client for multi-tenant SaaS
 * Created: 2025-12-07
 */

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
   * Generic fetch wrapper
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @param {boolean} useTenant - Whether to use tenant-aware URL
   * @returns {Promise<any>} Response data
   */
  async fetch(endpoint, options = {}, useTenant = true) {
    const url = this.buildUrl(endpoint, useTenant);
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
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
    // Use test endpoint for now since we don't have platform endpoint yet
    return this.fetch(`/api/${backendSlug}/test`, { method: 'GET' }, false);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
