import React, { useState } from 'react';

const PaymentProfileModal = ({ onClose, onSave }) => {
  const [profileName, setProfileName] = useState('');
  const [payments, setPayments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const DUE_TYPES = [
    { value: 'contract_date', label: 'Sözleşme Tarihinde Peşin', needsDays: false },
    { value: 'setup_start', label: 'Kurulum Başlayınca', needsDays: false },
    { value: 'event_delivery', label: 'Fuar Tesliminde', needsDays: false },
    { value: 'after_delivery', label: 'Teslimi Takip Eden', needsDays: true },
    { value: 'custom', label: 'Özel', needsDays: true }
  ];
  
  const PERCENTAGE_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);
  
  const addPayment = () => {
    const remaining = 100 - totalPercentage;
    if (remaining <= 0) return;
    
    setPayments(prev => [...prev, {
      id: Date.now(),
      percentage: Math.min(remaining, 10),
      dueType: 'contract_date',
      dueDays: null
    }]);
  };
  
  const updatePayment = (id, updates) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  
  const deletePayment = (id) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };
  
  const handleSave = async () => {
    setError(null);
    
    // Validasyon
    if (!profileName.trim()) {
      setError('Profil adı girilmelidir');
      return;
    }
    
    if (payments.length === 0) {
      setError('En az bir ödeme koşulu eklenmelidir');
      return;
    }
    
    if (totalPercentage !== 100) {
      setError('Toplam yüzde %100 olmalıdır');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payment-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          payments: payments.map((p, i) => ({
            order: i + 1,
            percentage: p.percentage,
            dueType: p.dueType,
            dueDays: p.dueDays
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Profil kaydedilemedi');
      }
      
      const savedProfile = await response.json();
      onSave({...savedProfile, name: profileName, payments: payments.map((p, i) => ({
        order: i + 1,
        percentage: p.percentage,
        dueType: p.dueType,
        dueDays: p.dueDays
      }))});
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Ödeme Profili Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Profil Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profil Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Örn: Standart 3 Taksit, Peşin Ödeme"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          {/* Ödeme Koşulları */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Ödeme Koşulları <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addPayment}
                disabled={totalPercentage >= 100}
                className={`
                  text-sm font-medium flex items-center gap-1
                  ${totalPercentage >= 100 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-green-600 hover:text-green-700'
                  }
                `}
              >
                + Ödeme Ekle
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-3">Henüz ödeme koşulu eklenmedi</p>
                  <button
                    onClick={addPayment}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    + İlk Ödemeyi Ekle
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {payments.map((payment, index) => {
                    const dueType = DUE_TYPES.find(d => d.value === payment.dueType);
                    
                    return (
                      <div key={payment.id} className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-700">{index + 1}. Ödeme</span>
                          <button
                            onClick={() => deletePayment(payment.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Yüzde */}
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
                          
                          {/* Vade */}
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
                        
                        {/* Gün Sayısı */}
                        {dueType?.needsDays && (
                          <div className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">Gün Sayısı</label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={payment.dueDays || ''}
                              onChange={(e) => updatePayment(payment.id, { dueDays: parseInt(e.target.value) || null })}
                              placeholder="Örn: 30"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        )}
                        
                        {/* Vade Uyarı */}
                        {dueType?.needsDays && !payment.dueDays && (
                          <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
                            <span>📅</span>
                            <span>Vade: Gün sayısı girilmeli</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Toplam */}
              {payments.length > 0 && (
                <div className="px-4 py-3 bg-white border-t flex items-center justify-between">
                  <span className="font-medium text-gray-700">Toplam:</span>
                  <span className={`font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    %{totalPercentage}
                  </span>
                </div>
              )}
            </div>
            
            {/* Bilgi Notu */}
            <p className="mt-2 text-xs text-gray-500">
              * Sadece ödeme yüzdeleri ve vadeleri belirleyin. Tutarlar proje oluştururken otomatik hesaplanacaktır.
            </p>
          </div>
          
          {/* Hata Mesajı */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || totalPercentage !== 100}
            className={`
              px-5 py-2 rounded-lg font-medium flex items-center gap-2
              ${saving || totalPercentage !== 100
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Kaydediliyor...
              </>
            ) : (
              <>
                💾 Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProfileModal;
