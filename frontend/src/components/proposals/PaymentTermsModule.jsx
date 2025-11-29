import React, { useState, useEffect } from 'react';
import PaymentProfileModal from './PaymentProfileModal';

const PaymentTermsModule = ({ 
  data, 
  onChange, 
  totalAmount = 0,
  currency = 'TRY',
  opportunity = null
}) => {
  const [paymentTerms, setPaymentTerms] = useState(() => {
    if (data && typeof data === 'object') {
      return {
        ...getDefaultPaymentTerms(),
        ...data,
        payments: Array.isArray(data.payments) ? data.payments : []
      };
    }
    return getDefaultPaymentTerms();
  });
  const [profiles, setProfiles] = useState([]);
  const [banks, setBanks] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Local pricing state
  const [localPricing, setLocalPricing] = useState({
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    total: totalAmount || 0,
    currency: currency || 'TRY'
  });
  
  const DUE_TYPES = [
    { value: 'contract_date', label: 'Sözleşme Tarihinde Peşin', needsDays: false },
    { value: 'setup_start', label: 'Kurulum Başlayınca', needsDays: false },
    { value: 'event_delivery', label: 'Fuar Tesliminde', needsDays: false },
    { value: 'after_delivery', label: 'Teslimi Takip Eden', needsDays: true },
    { value: 'custom', label: 'Özel', needsDays: true }
  ];
  
  const PERCENTAGE_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  function getDefaultPaymentTerms() {
    return {
      title: 'Ödeme Koşulları',
      introText: '',
      profileId: null,
      profileName: null,
      payments: [],
      totalPercentage: 0,
      totalAmount: totalAmount || 0,
      bankAccountId: null,
      bankAccount: null,
      showBankDetails: true
    };
  }
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profiles
        const profilesRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payment-profiles`);
        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          setProfiles(Array.isArray(profilesData) ? profilesData : []);
          
          const defaultProfile = Array.isArray(profilesData) ? profilesData.find(p => p.isDefault) : null;
          if (defaultProfile && !data?.profileId) {
            applyProfile(defaultProfile);
          }
        } else {
          setProfiles([]);
        }
        
        // Fetch banks - if endpoint doesn't exist, use empty array
        try {
          const banksRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/settings/banks`);
          if (banksRes.ok) {
            const banksData = await banksRes.json();
            setBanks(Array.isArray(banksData) ? banksData.filter(b => b.isActive) : []);
          } else {
            setBanks([]);
          }
        } catch (bankError) {
          console.warn('Banks API not available:', bankError);
          setBanks([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setProfiles([]);
        setBanks([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (totalAmount && paymentTerms.payments && paymentTerms.payments.length > 0) {
      recalculateAmounts();
    }
  }, [totalAmount]);
  
  useEffect(() => {
    if (onChange) {
      onChange(paymentTerms);
    }
  }, [paymentTerms]);
  
  const recalculateAmounts = () => {
    setPaymentTerms(prev => ({
      ...prev,
      totalAmount: totalAmount,
      payments: prev.payments.map(payment => ({
        ...payment,
        amount: Math.round((totalAmount * payment.percentage) / 100),
        currency: currency
      }))
    }));
  };
  
  const calculateDueDate = (dueType, dueDays) => {
    if (!opportunity) return null;
    
    switch (dueType) {
      case 'contract_date':
        return opportunity.contractDate || null;
      case 'setup_start':
        return opportunity.setupStartDate || opportunity.setupDate || null;
      case 'event_delivery':
        return opportunity.eventStartDate || opportunity.eventDate || null;
      case 'after_delivery':
        if ((opportunity.deliveryDate || opportunity.eventEndDate) && dueDays) {
          const date = new Date(opportunity.deliveryDate || opportunity.eventEndDate);
          date.setDate(date.getDate() + dueDays);
          return date.toISOString().split('T')[0];
        }
        return null;
      case 'custom':
        if (opportunity.contractDate && dueDays) {
          const date = new Date(opportunity.contractDate);
          date.setDate(date.getDate() + dueDays);
          return date.toISOString().split('T')[0];
        }
        return null;
      default:
        return null;
    }
  };
  
  const applyProfile = (profile) => {
    const payments = profile.payments.map((p, index) => ({
      id: `pay_${Date.now()}_${index}`,
      order: p.order,
      percentage: p.percentage,
      amount: totalAmount ? Math.round((totalAmount * p.percentage) / 100) : 0,
      currency: currency,
      dueType: p.dueType,
      dueDays: p.dueDays,
      dueDate: calculateDueDate(p.dueType, p.dueDays),
      description: DUE_TYPES.find(d => d.value === p.dueType)?.label || ''
    }));
    
    setPaymentTerms(prev => ({
      ...prev,
      profileId: profile._id,
      profileName: profile.name,
      payments: payments,
      totalPercentage: payments.reduce((sum, p) => sum + p.percentage, 0)
    }));
  };
  
  const handleProfileChange = (profileId) => {
    if (!profileId) {
      setPaymentTerms(prev => ({
        ...prev,
        profileId: null,
        profileName: null,
        payments: [],
        totalPercentage: 0
      }));
      return;
    }
    
    const profile = profiles.find(p => p._id === profileId);
    if (profile) {
      applyProfile(profile);
    }
  };
  
  const addPayment = () => {
    const remainingPercentage = 100 - paymentTerms.totalPercentage;
    const newPercentage = Math.min(remainingPercentage, 10);
    
    if (remainingPercentage <= 0) {
      alert('Toplam yüzde zaten %100. Yeni ödeme eklemek için mevcut ödemeleri düzenleyin.');
      return;
    }
    
    const newPayment = {
      id: `pay_${Date.now()}`,
      order: (paymentTerms.payments || []).length + 1,
      percentage: newPercentage,
      amount: totalAmount ? Math.round((totalAmount * newPercentage) / 100) : 0,
      currency: currency,
      dueType: 'contract_date',
      dueDays: null,
      dueDate: null,
      description: ''
    };
    
    setPaymentTerms(prev => ({
      ...prev,
      profileId: null,
      profileName: null,
      payments: [...prev.payments, newPayment],
      totalPercentage: prev.totalPercentage + newPercentage
    }));
  };
  
  const updatePayment = (paymentId, updates) => {
    setPaymentTerms(prev => {
      const updatedPayments = prev.payments.map(payment => {
        if (payment.id !== paymentId) return payment;
        
        const updated = { ...payment, ...updates };
        
        if (updates.percentage !== undefined) {
          updated.amount = totalAmount ? Math.round((totalAmount * updates.percentage) / 100) : 0;
        }
        
        if (updates.dueType !== undefined || updates.dueDays !== undefined) {
          updated.dueDate = calculateDueDate(
            updates.dueType ?? payment.dueType,
            updates.dueDays ?? payment.dueDays
          );
          updated.description = DUE_TYPES.find(d => d.value === (updates.dueType ?? payment.dueType))?.label || '';
        }
        
        return updated;
      });
      
      return {
        ...prev,
        profileId: null,
        profileName: null,
        payments: updatedPayments,
        totalPercentage: updatedPayments.reduce((sum, p) => sum + p.percentage, 0)
      };
    });
  };
  
  const deletePayment = (paymentId) => {
    setPaymentTerms(prev => {
      const filteredPayments = prev.payments
        .filter(p => p.id !== paymentId)
        .map((p, index) => ({ ...p, order: index + 1 }));
      
      return {
        ...prev,
        profileId: null,
        profileName: null,
        payments: filteredPayments,
        totalPercentage: filteredPayments.reduce((sum, p) => sum + p.percentage, 0)
      };
    });
  };
  
  const handleBankChange = (bankId) => {
    const bank = banks.find(b => b._id === bankId);
    setPaymentTerms(prev => ({
      ...prev,
      bankAccountId: bankId || null,
      bankAccount: bank ? {
        bankName: bank.bankName,
        accountName: bank.accountName,
        iban: bank.iban,
        currency: bank.currency
      } : null
    }));
  };
  
  const formatCurrency = (amount, curr = currency) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const getDueWarning = (payment) => {
    const dueType = DUE_TYPES.find(d => d.value === payment.dueType);
    
    if (!dueType) return null;
    
    if (dueType.needsDays && !payment.dueDays) {
      return 'Gün sayısı girilmeli';
    }
    
    if (!opportunity) return 'Satış fırsatı bilgisi yok';
    
    switch (payment.dueType) {
      case 'contract_date':
        if (!opportunity.contractDate) return 'Sözleşme tarihi girilmeli';
        break;
      case 'setup_start':
        if (!opportunity.setupStartDate && !opportunity.setupDate) return 'Kurulum başlangıç tarihi girilmeli';
        break;
      case 'event_delivery':
        if (!opportunity.eventStartDate && !opportunity.eventDate) return 'Fuar tarihi girilmeli';
        break;
      case 'after_delivery':
        if (!opportunity.deliveryDate && !opportunity.eventEndDate) return 'Teslim tarihi girilmeli';
        if (!payment.dueDays) return 'Gün sayısı girilmeli';
        break;
    }
    
    return null;
  };
  
  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-lg h-64" />;
  }
  
  // Local pricing state for this module
  const [localPricing, setLocalPricing] = useState({
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    total: totalAmount || 0,
    currency: currency || 'TRY'
  });

  // When local pricing changes, recalculate
  useEffect(() => {
    const calculatedTax = (localPricing.subtotal * localPricing.taxRate) / 100;
    const calculatedTotal = localPricing.subtotal + calculatedTax;
    
    setLocalPricing(prev => ({
      ...prev,
      taxAmount: calculatedTax,
      total: calculatedTotal
    }));
    
    // Trigger payment recalculation
    if (paymentTerms.payments && paymentTerms.payments.length > 0) {
      setPaymentTerms(prevTerms => ({
        ...prevTerms,
        totalAmount: calculatedTotal,
        payments: prevTerms.payments.map(payment => ({
          ...payment,
          amount: Math.round((calculatedTotal * payment.percentage) / 100),
          currency: localPricing.currency
        }))
      }));
    }
  }, [localPricing.subtotal, localPricing.taxRate]);

  const formatCurrencyInput = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="payment-terms-module space-y-6">
      
      {/* FİYAT FORMU - EN ÜSTTE */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
        <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2 text-lg">
          <span>💰</span>
          Fiyat Bilgileri
        </h3>
        
        <div className="bg-white rounded-lg p-4 space-y-4">
          {/* Para Birimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
            <select
              value={localPricing.currency}
              onChange={(e) => setLocalPricing(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="TRY">TRY - Türk Lirası</option>
              <option value="USD">USD - Amerikan Doları</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          
          {/* Ara Toplam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ara Toplam (KDV Hariç)</label>
            <input
              type="number"
              value={localPricing.subtotal}
              onChange={(e) => setLocalPricing(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-semibold"
            />
          </div>
          
          {/* KDV Oranı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KDV Oranı (%)</label>
            <select
              value={localPricing.taxRate}
              onChange={(e) => setLocalPricing(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="0">%0 - KDV Yok</option>
              <option value="1">%1</option>
              <option value="8">%8</option>
              <option value="10">%10</option>
              <option value="18">%18</option>
              <option value="20">%20</option>
            </select>
          </div>
          
          {/* Özet */}
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ara Toplam:</span>
                <span className="font-medium">{formatCurrency(localPricing.subtotal, localPricing.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">KDV (%{localPricing.taxRate}):</span>
                <span className="font-medium">{formatCurrency(localPricing.taxAmount, localPricing.currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-800">TOPLAM:</span>
                <span className="text-green-600">{formatCurrency(localPricing.total, localPricing.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ÖDEME KOŞULLARI BAŞLIK */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
        <input
          type="text"
          value={paymentTerms.title}
          onChange={(e) => setPaymentTerms(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ödeme Koşulları"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Giriş Metni</label>
        <textarea
          value={paymentTerms.introText}
          onChange={(e) => setPaymentTerms(prev => ({ ...prev, introText: e.target.value }))}
          placeholder="Aşağıdaki ödeme planı teklif onayından itibaren geçerlidir..."
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        
        <div className="px-5 py-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>📅</span>
            Ödeme Planı
          </h3>
          
          <div className="flex items-center gap-3">
            <select
              value={paymentTerms.profileId || ''}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">Profil Seç</option>
              {(profiles || []).map(profile => (
                <option key={profile._id} value={profile._id}>
                  {profile.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <span>+</span>
              Profil Oluştur
            </button>
          </div>
        </div>
        
        <div className="p-5">
          
          <div className="flex justify-end mb-4">
            <button
              onClick={addPayment}
              disabled={paymentTerms.totalPercentage >= 100}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1
                ${paymentTerms.totalPercentage >= 100
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-green-600 hover:bg-green-50'
                }
              `}
            >
              <span>+</span>
              Ödeme Ekle
            </button>
          </div>
          
          {(!paymentTerms.payments || paymentTerms.payments.length === 0) ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 mb-4">Henüz ödeme koşulu eklenmedi</p>
              <button
                onClick={addPayment}
                className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium"
              >
                + İlk Ödemeyi Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(paymentTerms.payments || []).map((payment, index) => {
                const dueType = DUE_TYPES.find(d => d.value === payment.dueType);
                const warning = getDueWarning(payment);
                
                return (
                  <div 
                    key={payment.id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-700">
                        {index + 1}. Ödeme
                      </span>
                      <button
                        onClick={() => deletePayment(payment.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Yüzde (%)</label>
                        <select
                          value={payment.percentage}
                          onChange={(e) => updatePayment(payment.id, { percentage: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {PERCENTAGE_OPTIONS.map(p => (
                            <option key={p} value={p}>%{p}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tutar</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Vade</label>
                        <select
                          value={payment.dueType}
                          onChange={(e) => updatePayment(payment.id, { dueType: e.target.value, dueDays: null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {DUE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {dueType?.needsDays && (
                      <div className="mt-4">
                        <label className="block text-xs text-gray-500 mb-1">Gün Sayısı</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={payment.dueDays || ''}
                          onChange={(e) => updatePayment(payment.id, { dueDays: parseInt(e.target.value) || null })}
                          placeholder="Örn: 30"
                          className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}
                    
                    <div className={`mt-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      warning 
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : payment.dueDate
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      <span>📅</span>
                      {warning ? (
                        <span>Vade: {warning}</span>
                      ) : payment.dueDate ? (
                        <span>Vade: {formatDate(payment.dueDate)}</span>
                      ) : (
                        <span>Vade: {dueType?.label}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {paymentTerms.payments && paymentTerms.payments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Toplam:</span>
                <div className="text-right">
                  <span className={`
                    font-bold text-lg mr-4
                    ${paymentTerms.totalPercentage === 100 
                      ? 'text-green-600' 
                      : 'text-red-600'
                    }
                  `}>
                    %{paymentTerms.totalPercentage}
                  </span>
                  <span className="font-bold text-lg text-gray-800">
                    {formatCurrency(localPricing.total || 0, localPricing.currency)}
                  </span>
                </div>
              </div>
              
              {paymentTerms.totalPercentage !== 100 && (
                <p className="mt-2 text-sm text-red-600">
                  ⚠️ Ödeme koşullarının toplamı %100 olmalıdır
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>🏦</span>
            Banka Bilgileri
          </h3>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banka Hesabı</label>
            <select
              value={paymentTerms.bankAccountId || ''}
              onChange={(e) => handleBankChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Banka hesabı seçin</option>
              {(banks || []).map(bank => (
                <option key={bank._id} value={bank._id}>
                  {bank.bankName} - {bank.iban}
                </option>
              ))}
            </select>
          </div>
          
          {paymentTerms.bankAccount && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Banka:</span>
                  <span className="ml-2 font-medium">{paymentTerms.bankAccount.bankName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Hesap Adı:</span>
                  <span className="ml-2 font-medium">{paymentTerms.bankAccount.accountName}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">IBAN:</span>
                  <span className="ml-2 font-medium font-mono">{paymentTerms.bankAccount.iban}</span>
                </div>
              </div>
            </div>
          )}
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentTerms.showBankDetails}
              onChange={(e) => setPaymentTerms(prev => ({ ...prev, showBankDetails: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Teklif PDF'inde banka bilgilerini göster</span>
          </label>
        </div>
      </div>
      
      {showProfileModal && (
        <PaymentProfileModal
          onClose={() => setShowProfileModal(false)}
          onSave={(profile) => {
            setProfiles(prev => [...prev, profile]);
            applyProfile(profile);
            setShowProfileModal(false);
          }}
        />
      )}
      
    </div>
  );
};

export default PaymentTermsModule;
