import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const NewCollectionPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    invoiceId: '',
    invoiceNo: '',
    amount: '',
    currency: 'TRY',
    paymentMethod: 'bank_transfer',
    bankId: '',
    bankName: '',
    accountNo: '',
    checkNo: '',
    checkDate: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  // Data states
  const [customers, setCustomers] = useState([]);
  const [openInvoices, setOpenInvoices] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCustomers();
    loadBanks();
  }, []);

  // Load open invoices when customer changes
  useEffect(() => {
    if (formData.customerId) {
      loadOpenInvoices(formData.customerId);
    } else {
      setOpenInvoices([]);
    }
  }, [formData.customerId]);

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : data.customers || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/banks`);
      if (response.ok) {
        const data = await response.json();
        setBanks(Array.isArray(data) ? data : data.banks || []);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const loadOpenInvoices = async (customerId) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/customers/${customerId}/open-invoices`);
      if (response.ok) {
        const data = await response.json();
        setOpenInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading open invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.companyName || customer.name,
      invoiceId: '',
      invoiceNo: '',
      amount: ''
    });
    setCustomerSearch(customer.companyName || customer.name);
    setShowCustomerDropdown(false);
  };

  const handleInvoiceSelect = (invoice) => {
    setFormData({
      ...formData,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: invoice.remaining,
      currency: invoice.currency || 'TRY'
    });
  };

  const handleBankSelect = (bankId) => {
    const bank = banks.find(b => b.id === bankId);
    setFormData({
      ...formData,
      bankId: bankId,
      bankName: bank?.bank_name || bank?.bankName || '',
      accountNo: bank?.account_number || bank?.accountNo || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerId) {
      alert('Lütfen müşteri seçin');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Lütfen geçerli bir tutar girin');
      return;
    }
    if (!formData.date) {
      alert('Lütfen tarih girin');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`${backendUrl}/api/collections-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Tahsilat başarıyla kaydedildi!\nMakbuz No: ${result.receiptNo}`);
        navigate(`/${tenantSlug}/tahsilatlar`);
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Tahsilat kaydedilemedi'}`);
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Tahsilat kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  // Filter customers for search
  const filteredCustomers = customers.filter(c => {
    const name = (c.companyName || c.name || '').toLowerCase();
    return name.includes(customerSearch.toLowerCase());
  });

  const paymentMethods = [
    { value: 'cash', label: '💵 Nakit', icon: '💵' },
    { value: 'bank_transfer', label: '🏦 Havale/EFT', icon: '🏦' },
    { value: 'credit_card', label: '💳 Kredi Kartı', icon: '💳' },
    { value: 'check', label: '📝 Çek', icon: '📝' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/${tenantSlug}/tahsilatlar`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tahsilatlara Dön
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="text-4xl mr-3">💰</span>
            Yeni Tahsilat
          </h1>
          <p className="text-gray-500 mt-1">Müşteriden ödeme alın</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Müşteri Seçimi */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👤</span> Müşteri Bilgileri
              </h2>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri Seçin *
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) {
                      setFormData({ ...formData, customerId: '', customerName: '' });
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Müşteri adı yazarak arayın..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && customerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">Müşteri bulunamadı</div>
                    ) : (
                      filteredCustomers.slice(0, 10).map(customer => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.companyName || customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email || customer.phone || '-'}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Seçili Müşteri */}
              {formData.customerId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="font-medium text-green-700">{formData.customerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, customerId: '', customerName: '', invoiceId: '', invoiceNo: '' });
                      setCustomerSearch('');
                      setOpenInvoices([]);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    Değiştir
                  </button>
                </div>
              )}
            </div>

            {/* Açık Faturalar */}
            {formData.customerId && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🧾</span> Açık Faturalar
                  {openInvoices.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      {openInvoices.length} fatura
                    </span>
                  )}
                </h2>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-r-transparent mx-auto"></div>
                  </div>
                ) : openInvoices.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <span className="text-3xl">✅</span>
                    <p className="mt-2">Bu müşterinin açık faturası yok</p>
                    <p className="text-sm">Serbest tahsilat yapabilirsiniz</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openInvoices.map(invoice => (
                      <div
                        key={invoice.id}
                        onClick={() => handleInvoiceSelect(invoice)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                          formData.invoiceId === invoice.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {invoice.invoiceNo}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(invoice.date)}
                              </span>
                              {invoice.dueDate && new Date(invoice.dueDate) < new Date() && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                  Vadesi Geçmiş
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Toplam: {formatCurrency(invoice.total, invoice.currency)} | 
                              Ödenen: {formatCurrency(invoice.paid, invoice.currency)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">
                              {formatCurrency(invoice.remaining, invoice.currency)}
                            </div>
                            <div className="text-xs text-gray-500">Kalan</div>
                          </div>
                        </div>
                        
                        {formData.invoiceId === invoice.id && (
                          <div className="mt-2 pt-2 border-t border-green-200 text-sm text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Bu fatura için tahsilat yapılacak
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Serbest Tahsilat Seçeneği */}
                    <div
                      onClick={() => setFormData({ ...formData, invoiceId: '', invoiceNo: '', amount: '' })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        formData.customerId && !formData.invoiceId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-dashed border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-center text-gray-500">
                        <span className="mr-2">📝</span>
                        Faturasız / Serbest Tahsilat
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ödeme Detayları */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💳</span> Ödeme Detayları
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Tarih */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahsilat Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                {/* Tutar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tutar *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 border-0 rounded px-2 py-1 text-sm"
                    >
                      <option value="TRY">₺ TRY</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Ödeme Yöntemi */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yöntemi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        formData.paymentMethod === method.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-medium">{method.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Banka Seçimi (Havale/EFT için) */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banka Hesabı
                  </label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Banka seçin...</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bank_name || bank.bankName} - {bank.account_number || bank.accountNo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Çek Bilgileri */}
              {formData.paymentMethod === 'check' && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çek Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.checkNo}
                      onChange={(e) => setFormData({ ...formData, checkNo: e.target.value })}
                      placeholder="Çek no girin"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çek Vadesi
                    </label>
                    <input
                      type="date"
                      value={formData.checkDate}
                      onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Açıklama */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Opsiyonel not ekleyin..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Özet ve Kaydet */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tahsilat Özeti</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Müşteri: <strong>{formData.customerName || '-'}</strong></p>
                    <p>Fatura: <strong>{formData.invoiceNo || 'Serbest Tahsilat'}</strong></p>
                    <p>Tarih: <strong>{formData.date ? formatDate(formData.date) : '-'}</strong></p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Tahsilat Tutarı</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : '-'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/${tenantSlug}/tahsilatlar`)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.customerId || !formData.amount}
                  className={`px-8 py-3 rounded-lg font-medium transition flex items-center ${
                    saving || !formData.customerId || !formData.amount
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tahsilatı Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCollectionPage;
