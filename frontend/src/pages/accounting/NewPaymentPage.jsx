import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const NewPaymentPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
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
  
  const [suppliers, setSuppliers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    loadSuppliers();
    loadBanks();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(Array.isArray(data) ? data : data.suppliers || []);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
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

  const handleSupplierSelect = (supplier) => {
    setFormData({
      ...formData,
      supplierId: supplier.id,
      supplierName: supplier.companyName || supplier.name,
      invoiceId: '',
      invoiceNo: '',
      amount: ''
    });
    setSupplierSearch(supplier.companyName || supplier.name);
    setShowSupplierDropdown(false);
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
    
    if (!formData.supplierId) {
      alert('Lütfen tedarikçi seçin');
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
      const response = await fetch(`${backendUrl}/api/payments-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Ödeme başarıyla kaydedildi!\nMakbuz No: ${result.receiptNo}`);
        navigate(`/${tenantSlug}/odemeler`);
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Ödeme kaydedilemedi'}`);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Ödeme kaydedilirken bir hata oluştu');
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

  const filteredSuppliers = suppliers.filter(s => {
    const name = (s.companyName || s.name || '').toLowerCase();
    return name.includes(supplierSearch.toLowerCase());
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
            onClick={() => navigate(`/${tenantSlug}/odemeler`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ödemelere Dön
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="text-4xl mr-3">💸</span>
            Yeni Ödeme
          </h1>
          <p className="text-gray-500 mt-1">Tedarikçiye ödeme yapın</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Tedarikçi Seçimi */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🏭</span> Tedarikçi Bilgileri
              </h2>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tedarikçi Seçin *
                </label>
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                    if (!e.target.value) {
                      setFormData({ ...formData, supplierId: '', supplierName: '' });
                    }
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  placeholder="Tedarikçi adı yazarak arayın..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                
                {showSupplierDropdown && supplierSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">Tedarikçi bulunamadı</div>
                    ) : (
                      filteredSuppliers.slice(0, 10).map(supplier => (
                        <button
                          key={supplier.id}
                          type="button"
                          onClick={() => handleSupplierSelect(supplier)}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {supplier.companyName || supplier.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.email || supplier.phone || '-'}
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
              
              {formData.supplierId && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">✓</span>
                    <span className="font-medium text-red-700">{formData.supplierName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, supplierId: '', supplierName: '' });
                      setSupplierSearch('');
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Değiştir
                  </button>
                </div>
              )}
            </div>

            {/* Ödeme Detayları */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💳</span> Ödeme Detayları
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                
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
                      className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-medium">{method.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Banka Seçimi */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banka Hesabı
                  </label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Fatura No (Opsiyonel) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatura No (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="İlgili fatura numarası..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Özet ve Kaydet */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ödeme Özeti</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Tedarikçi: <strong>{formData.supplierName || '-'}</strong></p>
                    <p>Fatura: <strong>{formData.invoiceNo || 'Serbest Ödeme'}</strong></p>
                    <p>Tarih: <strong>{formData.date ? formatDate(formData.date) : '-'}</strong></p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Ödeme Tutarı</div>
                  <div className="text-3xl font-bold text-red-600">
                    {formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : '-'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/${tenantSlug}/odemeler`)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.supplierId || !formData.amount}
                  className={`px-8 py-3 rounded-lg font-medium transition flex items-center ${
                    saving || !formData.supplierId || !formData.amount
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/30'
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
                      Ödemeyi Kaydet
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

export default NewPaymentPage;
