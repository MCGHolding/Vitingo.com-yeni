// Customer status calculation utilities

/**
 * Calculate customer status based on invoice history
 * @param {string} customerId - Customer ID
 * @param {Array} invoices - All invoices from localStorage
 * @returns {Object} Status information with type, label, and details
 */
export const calculateCustomerStatus = (customerId, invoices = []) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  // Filter invoices for this customer
  const customerInvoices = invoices.filter(invoice => 
    invoice.customerId === customerId || invoice.customerName === customerId
  );
  
  if (customerInvoices.length === 0) {
    return {
      type: 'new',
      label: 'Yeni Müşteri',
      description: 'Henüz fatura kesilmemiş',
      color: 'bg-blue-100 text-blue-700',
      invoiceCount: 0,
      lastInvoiceDate: null
    };
  }
  
  // Sort invoices by date (newest first)
  const sortedInvoices = customerInvoices.sort((a, b) => 
    new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
  );
  
  const lastInvoice = sortedInvoices[0];
  const lastInvoiceDate = new Date(lastInvoice.date || lastInvoice.createdAt);
  
  // Count invoices in the last year
  const invoicesLastYear = customerInvoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date || invoice.createdAt);
    return invoiceDate >= oneYearAgo;
  });
  
  // Check if customer is PASSIVE (no invoice in last 6 months)
  if (lastInvoiceDate < sixMonthsAgo) {
    const monthsSinceLastInvoice = Math.floor((now - lastInvoiceDate) / (1000 * 60 * 60 * 24 * 30));
    return {
      type: 'passive',
      label: 'Pasif Müşteri',
      description: `Son fatura: ${monthsSinceLastInvoice} ay önce`,
      color: 'bg-gray-100 text-gray-700',
      invoiceCount: customerInvoices.length,
      lastInvoiceDate: lastInvoiceDate,
      monthsSinceLastInvoice
    };
  }
  
  // Check if customer is FAVORITE (3+ invoices in last year)
  if (invoicesLastYear.length >= 3) {
    return {
      type: 'favorite',
      label: 'Favori Müşteri',
      description: `Son 1 yılda ${invoicesLastYear.length} fatura`,
      color: 'bg-green-100 text-green-700',
      invoiceCount: customerInvoices.length,
      lastInvoiceDate: lastInvoiceDate,
      invoicesLastYear: invoicesLastYear.length
    };
  }
  
  // Regular active customer
  return {
    type: 'active',
    label: 'Aktif Müşteri',
    description: `Son 1 yılda ${invoicesLastYear.length} fatura`,
    color: 'bg-blue-100 text-blue-700',
    invoiceCount: customerInvoices.length,
    lastInvoiceDate: lastInvoiceDate,
    invoicesLastYear: invoicesLastYear.length
  };
};

/**
 * Get all passive customers
 * @param {Array} customers - All customers
 * @param {Array} invoices - All invoices
 * @returns {Array} Filtered passive customers with status info
 */
export const getPassiveCustomers = (customers, invoices) => {
  return customers
    .map(customer => ({
      ...customer,
      statusInfo: calculateCustomerStatus(customer.id, invoices)
    }))
    .filter(customer => customer.statusInfo.type === 'passive')
    .sort((a, b) => b.statusInfo.monthsSinceLastInvoice - a.statusInfo.monthsSinceLastInvoice);
};

/**
 * Get all favorite customers
 * @param {Array} customers - All customers
 * @param {Array} invoices - All invoices
 * @returns {Array} Filtered favorite customers with status info
 */
export const getFavoriteCustomers = (customers, invoices) => {
  return customers
    .map(customer => ({
      ...customer,
      statusInfo: calculateCustomerStatus(customer.id, invoices)
    }))
    .filter(customer => customer.statusInfo.type === 'favorite')
    .sort((a, b) => b.statusInfo.invoicesLastYear - a.statusInfo.invoicesLastYear);
};

/**
 * Format date for display
 * @param {Date|string} date 
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'Belirtilmemiş';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get customer statistics summary
 * @param {Array} customers 
 * @param {Array} invoices 
 * @returns {Object} Statistics summary
 */
export const getCustomerStatistics = (customers, invoices) => {
  let activeCount = 0;
  let passiveCount = 0;
  let favoriteCount = 0;
  let newCount = 0;
  
  customers.forEach(customer => {
    const status = calculateCustomerStatus(customer.id, invoices);
    switch (status.type) {
      case 'active':
        activeCount++;
        break;
      case 'passive':
        passiveCount++;
        break;
      case 'favorite':
        favoriteCount++;
        break;
      case 'new':
        newCount++;
        break;
    }
  });
  
  return {
    total: customers.length,
    active: activeCount,
    passive: passiveCount,
    favorite: favoriteCount,
    new: newCount
  };
};