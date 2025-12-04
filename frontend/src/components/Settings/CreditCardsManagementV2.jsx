import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, X, Building2, User, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CreditCardsManagementV2 = ({ onBackToDashboard }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('corporate'); // 'corporate' or 'personal'
  const [cards, setCards] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    bank: '',
    companyId: ''
  });
  const [cardNumberError, setCardNumberError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
  
  // Check if user is ultra admin (super-admin or admin)
  const isUltraAdmin = user?.role === 'super-admin' || user?.role === 'admin';

  // Luhn Algorithm - Card Number Validation
  const validateCardNumber = (cardNumber) => {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Only digits allowed
    if (!/^\d+$/.test(cleanNumber)) {
      return { valid: false, message: 'Kart numarası sadece rakam içermeli' };
    }
    
    // Must be 13-19 digits (most cards are 16)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return { valid: false, message: 'Kart numarası 13-19 hane arasında olmalı' };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
      return { valid: false, message: 'Geçersiz kart numarası! Lütfen kontrol edin.' };
    }
    
    return { valid: true, message: '' };
  };

  useEffect(() => {
    loadCards();
    loadCompanies();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/credit-cards`);
      if (response.ok) {
        const data = await response.json();
        setCards(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      setCards([]);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/group-companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

  // Auto-format card number: Add space after every 4 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 19 digits (some cards can be longer)
    if (value.length > 19) {
      value = value.slice(0, 19);
    }
    
    // Add spaces every 4 digits
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setFormData({ ...formData, cardNumber: formatted });
    
    // Clear error when user types
    if (cardNumberError) {
      setCardNumberError('');
    }
  };

  // Validate card number on blur
  const handleCardNumberBlur = () => {
    if (formData.cardNumber.trim()) {
      const validation = validateCardNumber(formData.cardNumber);
      if (!validation.valid) {
        setCardNumberError(validation.message);
      } else {
        setCardNumberError('');
      }
    }
  };

  // Auto-format expiry date: MM/YY
  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setFormData({ ...formData, expiryDate: value });
  };

  // Get card type from first digit
  const getCardType = (cardNumber) => {
    const firstDigit = cardNumber.replace(/\D/g, '')[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'visa';
  };

  // Get card logo based on type
  const getCardLogo = (cardType) => {
    if (cardType === 'visa') return '💳 Visa';
    if (cardType === 'mastercard') return '💳 Mastercard';
    if (cardType === 'amex') return '💳 Amex';
    return '💳';
  };

  // Filter cards by active tab
  const filteredCards = cards.filter(card => card.cardCategory === activeTab);

  const openModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      // For editing, we need to decrypt first - but we can't since backend returns masked
      // So we'll let user update other fields without changing card number
      setFormData({
        cardHolderName: card.cardHolderFullName || '',
        cardNumber: '', // Don't pre-fill for security
        expiryDate: card.expiryDate || '',
        bank: card.bank || '',
        companyId: card.companyId || ''
      });
    } else {
      setEditingCard(null);
      setFormData({
        cardHolderName: '',
        cardNumber: '',
        expiryDate: '',
        bank: '',
        companyId: ''
      });
    }
    setCardNumberError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    setCardNumberError('');
    setFormData({
      cardHolderName: '',
      cardNumber: '',
      expiryDate: '',
      bank: '',
      companyId: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.cardHolderName.trim()) {
      alert('❌ Kart sahibi adını giriniz!');
      return;
    }

    if (!formData.cardNumber.trim()) {
      alert('❌ Kart numarasını giriniz!');
      return;
    }

    // Luhn validation
    const validation = validateCardNumber(formData.cardNumber);
    if (!validation.valid) {
      alert('❌ ' + validation.message);
      setCardNumberError(validation.message);
      return;
    }

    const cleanCardNumber = formData.cardNumber.replace(/\D/g, '');

    if (!formData.expiryDate.trim() || formData.expiryDate.length !== 5) {
      alert('❌ Son kullanma tarihi MM/YY formatında olmalıdır!');
      return;
    }

    if (activeTab === 'corporate' && !formData.companyId) {
      alert('❌ Kurumsal kart için firma seçiniz!');
      return;
    }

    // Detect card type
    const detectedCardType = getCardType(formData.cardNumber);

    // Prepare data
    const dataToSend = {
      cardCategory: activeTab,
      cardHolderFirstName: formData.cardHolderName.split(' ')[0] || '',
      cardHolderLastName: formData.cardHolderName.split(' ').slice(1).join(' ') || '',
      cardHolderFullName: formData.cardHolderName,
      cardNumber: cleanCardNumber,
      expiryDate: formData.expiryDate,
      cardType: detectedCardType,
      bank: formData.bank || '',
      companyId: activeTab === 'corporate' ? formData.companyId : null,
      companyName: activeTab === 'corporate' && formData.companyId 
        ? companies.find(c => c.id === formData.companyId)?.name || '' 
        : null,
      isActive: true
    };

    try {
      const url = editingCard 
        ? `${backendUrl}/api/credit-cards/${editingCard.id}`
        : `${backendUrl}/api/credit-cards`;
      
      const method = editingCard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        await loadCards();
        closeModal();
        alert(editingCard ? '✅ Kart güncellendi!' : '✅ Kart başarıyla kaydedildi!');
      } else {
        const errorText = await response.text();
        alert(`❌ Hata: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('❌ Kayıt sırasında hata oluştu!');
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('⚠️ Bu kartı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/credit-cards/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCards();
        alert('✅ Kart başarıyla silindi!');
      } else {
        alert('❌ Silme hatası!');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('❌ Silme sırasında hata oluştu!');
    }
  };

  // Preview card (decrypt) - Only for ultra admin
  const handlePreviewCard = async (card) => {
    try {
      const response = await fetch(`${backendUrl}/api/credit-cards/${card.id}/decrypt`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || 'user'
        }
      });
      
      if (response.ok) {
        const decryptedCard = await response.json();
        setPreviewCard(decryptedCard);
        setShowPreviewModal(true);
      } else {
        alert('❌ Bu işlem için yetkiniz yok!');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('❌ Kart bilgileri alınamadı!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onBackToDashboard} 
              className="mr-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💳 Kredi Kartları</h1>
              <p className="text-sm text-gray-500 mt-1">Şirket ve kişisel kredi kartlarını yönetin</p>
            </div>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kart Ekle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('corporate')}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'corporate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-5 h-5 mr-2" />
            Kurumsal Kartlar ({cards.filter(c => c.cardCategory === 'corporate').length})
          </button>
          
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5 mr-2" />
            Kişisel Kartlar ({cards.filter(c => c.cardCategory === 'personal').length})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="max-w-7xl mx-auto">
        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <CreditCard className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeTab === 'corporate' 
                ? 'Henüz kurumsal kart eklenmemiş' 
                : 'Henüz kişisel kart eklenmemiş'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              İlk kartı eklemek için yukarıdaki butona tıklayın
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              İlk Kartı Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className={`bg-gradient-to-br ${
                  card.cardType === 'visa' 
                    ? 'from-blue-500 to-blue-700' 
                    : card.cardType === 'mastercard'
                    ? 'from-orange-500 to-red-600'
                    : card.cardType === 'amex'
                    ? 'from-green-500 to-teal-600'
                    : 'from-gray-600 to-gray-800'
                } text-white rounded-xl p-6 shadow-xl relative transform hover:scale-105 transition-transform`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-bold">{getCardLogo(card.cardType)}</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    card.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {card.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* Card Number (Masked) */}
                <div className="mb-6">
                  <div className="text-2xl font-mono tracking-wider">
                    {card.cardNumber}
                  </div>
                </div>

                {/* Card Holder */}
                <div className="mb-4">
                  <div className="text-xs text-white/70 mb-1">Kart Sahibi</div>
                  <div className="font-semibold text-lg">{card.cardHolderFullName}</div>
                </div>

                {/* Company (for corporate cards) */}
                {card.cardCategory === 'corporate' && card.companyName && (
                  <div className="mb-4 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-white/70" />
                    <span className="text-sm text-white/90">{card.companyName}</span>
                  </div>
                )}

                {/* Footer: Expiry & Bank */}
                <div className="flex items-center justify-between text-sm pt-4 border-t border-white/20">
                  <div>
                    <div className="text-xs text-white/70 mb-1">Son Kullanma</div>
                    <div className="font-medium">{card.expiryDate}</div>
                  </div>
                  {card.bank && (
                    <div className="text-right">
                      <div className="text-xs text-white/70 mb-1">Banka</div>
                      <div className="font-medium">{card.bank}</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/20">
                  {isUltraAdmin && (
                    <button
                      onClick={() => handlePreviewCard(card)}
                      className="flex items-center justify-center px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg transition-colors"
                      title="Ön İzleme (Tam Bilgi)"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openModal(card)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={closeModal}></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCard ? '✏️ Kart Düzenle' : '➕ Yeni Kart Ekle'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-5">
                {/* Card Holder Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kart Sahibi Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    value={formData.cardHolderName}
                    onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                </div>

                {/* Company Selection (Corporate Only) */}
                {activeTab === 'corporate' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Firma Seçimi *
                    </label>
                    <select
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Firma Seçin...</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kart Numarası * (13-19 haneli)
                  </label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    onBlur={handleCardNumberBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg ${
                      cardNumberError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={editingCard ? `Mevcut: ${editingCard.cardNumber}` : '1234 5678 9012 3456'}
                    maxLength="23"
                    required
                  />
                  {cardNumberError && (
                    <p className="text-red-500 text-xs mt-1">⚠️ {cardNumberError}</p>
                  )}
                  {!cardNumberError && (
                    <p className="text-xs text-gray-500 mt-1">
                      Otomatik formatlama: 4xxx = Visa, 5xxx = Mastercard, 3xxx = Amex
                    </p>
                  )}
                  {editingCard && !formData.cardNumber && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Güvenlik nedeniyle kart numarası gösterilmiyor. Değiştirmek için yeni numara girin.
                    </p>
                  )}
                </div>

                {/* Expiry Date & Bank */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Son Kullanma *
                    </label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={handleExpiryDateChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Banka
                    </label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ziraat Bankası"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                  >
                    {editingCard ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardsManagementV2;
