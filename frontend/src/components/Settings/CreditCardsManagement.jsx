import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Eye, EyeOff } from 'lucide-react';

const CreditCardsManagement = ({ onBackToDashboard }) => {
  const [cards, setCards] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardTypeFilter, setCardTypeFilter] = useState('all'); // all, corporate, personal
  const [formData, setFormData] = useState({
    cardCategory: 'corporate', // corporate or personal
    cardHolderFirstName: '',
    cardHolderLastName: '',
    companyId: '',
    cardNumber: '',
    expiryDate: '',
    cardType: 'visa',
    bank: '',
    isActive: true
  });
  const [showCardNumbers, setShowCardNumbers] = useState({});

  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

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

  // Format card number: add space every 4 digits
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited;
    return formatted;
  };

  // Mask card number: show only last 4 digits
  const maskCardNumber = (number) => {
    if (!number) return '****';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    const last4 = cleaned.slice(-4);
    return `**** **** **** ${last4}`;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formatted });
  };

  const filteredCards = cards.filter(card => {
    if (cardTypeFilter === 'all') return true;
    if (cardTypeFilter === 'corporate') return card.cardCategory === 'corporate';
    if (cardTypeFilter === 'personal') return card.cardCategory === 'personal';
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.cardHolderFirstName.trim()) {
      alert('Kart sahibinin adını giriniz!');
      return;
    }
    if (!formData.cardHolderLastName.trim()) {
      alert('Kart sahibinin soyadını giriniz!');
      return;
    }
    if (formData.cardCategory === 'corporate' && !formData.companyId) {
      alert('Kurumsal kart için şirket seçiniz!');
      return;
    }
    if (!formData.cardNumber || formData.cardNumber.replace(/\D/g, '').length !== 16) {
      alert('Geçerli bir kart numarası giriniz (16 haneli)!');
      return;
    }
    
    try {
      const cleanedCardNumber = formData.cardNumber.replace(/\D/g, '');
      const dataToSend = {
        ...formData,
        cardNumber: cleanedCardNumber,
        cardHolderFullName: `${formData.cardHolderFirstName} ${formData.cardHolderLastName}`
      };
      
      const url = editingCard 
        ? `${backendUrl}/api/credit-cards/${editingCard._id || editingCard.id}`
        : `${backendUrl}/api/credit-cards`;
      
      const method = editingCard ? 'PUT' : 'POST';
      
      console.log('Submitting card:', dataToSend);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        await loadCards();
        closeModal();
        alert(editingCard ? '✅ Kart güncellendi!' : '✅ Kart eklendi!');
      } else {
        const error = await response.text();
        console.error('Save error:', error);
        alert('❌ Kayıt hatası: ' + error);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('❌ Kayıt hatası: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kartı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/credit-cards/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadCards();
        alert('✅ Kart silindi!');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('❌ Silme hatası!');
    }
  };

  const openModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      const [firstName, ...lastNameParts] = (card.cardHolderFullName || '').split(' ');
      setFormData({
        cardCategory: card.cardCategory || 'corporate',
        cardHolderFirstName: firstName || '',
        cardHolderLastName: lastNameParts.join(' ') || '',
        companyId: card.companyId || '',
        cardNumber: card.cardNumber || '',
        expiryDate: card.expiryDate || '',
        cardType: card.cardType || 'visa',
        bank: card.bank || '',
        isActive: card.isActive !== false
      });
    } else {
      setEditingCard(null);
      setFormData({
        cardCategory: 'corporate',
        cardHolderFirstName: '',
        cardHolderLastName: '',
        companyId: '',
        cardNumber: '',
        expiryDate: '',
        cardType: 'visa',
        bank: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const toggleCardVisibility = (cardId) => {
    setShowCardNumbers(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBackToDashboard} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kredi Kartları</h1>
            <p className="text-sm text-gray-500 mt-1">Şirket kredi kartlarını yönetin</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={cardTypeFilter}
            onChange={(e) => setCardTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Kartlar</option>
            <option value="corporate">Kurumsal Kartlar</option>
            <option value="personal">Bireysel Kartlar</option>
          </select>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kart Ekle
          </button>
        </div>
      </div>

      {/* Section Headers */}
      {cardTypeFilter === 'all' && (
        <>
          {filteredCards.filter(c => c.cardCategory === 'corporate').length > 0 && (
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kurumsal Kartlar</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCards.filter(card => card.cardCategory === 'corporate').map(card => (
              <CardItem key={card._id || card.id} card={card} />
            ))}
          </div>
          
          {filteredCards.filter(c => c.cardCategory === 'personal').length > 0 && (
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bireysel Kartlar</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.filter(card => card.cardCategory === 'personal').map(card => (
              <CardItem key={card._id || card.id} card={card} />
            ))}
          </div>
        </>
      )}
      
      {cardTypeFilter !== 'all' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {cardTypeFilter === 'corporate' ? 'Kurumsal Kartlar' : 'Bireysel Kartlar'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <CardItem key={card._id || card.id} card={card} />
            ))}
          </div>
        </>
      )}

      {filteredCards.length === 0 && (
        <div className="col-span-full text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {cardTypeFilter === 'all' ? 'Henüz kredi kartı eklenmemiş' :
             cardTypeFilter === 'corporate' ? 'Henüz kurumsal kart eklenmemiş' :
             'Henüz bireysel kart eklenmemiş'}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            İlk kartı ekle
          </button>
        </div>
      )}
    </div>
  );

  // Card Item Component
  const CardItem = ({ card }) => (
    <div
      className={`bg-gradient-to-br ${
        card.cardType === 'visa' ? 'from-blue-500 to-blue-700' :
        card.cardType === 'mastercard' ? 'from-orange-500 to-red-600' :
        card.cardType === 'amex' ? 'from-green-500 to-teal-600' :
        'from-gray-500 to-gray-700'
      } text-white rounded-xl p-6 shadow-lg relative`}
    >
      {/* Card Type Badge */}
      <div className="absolute top-4 left-4">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/20">
          {card.cardCategory === 'corporate' ? '🏢 Kurumsal' : '👤 Bireysel'}
        </span>
      </div>

      {/* Card Type Logo */}
      <div className="flex items-center justify-end mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider">
          {card.cardType || 'Card'}
        </span>
      </div>

      {/* Card Number */}
      <div className="mb-4">
        <button
          onClick={() => toggleCardVisibility(card._id || card.id)}
          className="flex items-center text-sm text-white/80 hover:text-white mb-2"
        >
          {showCardNumbers[card._id || card.id] ? (
            <>
              <EyeOff className="w-4 h-4 mr-1" />
              Gizle
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Göster
            </>
          )}
        </button>
        <div className="text-xl font-mono tracking-wider">
          {showCardNumbers[card._id || card.id] 
            ? formatCardNumber(card.cardNumber || '')
            : maskCardNumber(card.cardNumber)
          }
        </div>
      </div>

      {/* Card Holder */}
      <div className="mb-3">
        <div className="text-xs text-white/70 mb-1">Kart Sahibi</div>
        <div className="font-medium">{card.cardHolderFullName || 'İsimsiz'}</div>
      </div>

      {/* Company (if corporate) */}
      {card.cardCategory === 'corporate' && card.companyName && (
        <div className="mb-3 text-sm text-white/80">
          🏢 {card.companyName}
        </div>
      )}

      {/* Expiry & Bank */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/70 mb-1">Son Kullanma</div>
          <div className="font-medium">{card.expiryDate || '--/--'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/70 mb-1">Banka</div>
          <div className="font-medium text-sm">{card.bank || '-'}</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          card.isActive === false ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {card.isActive === false ? 'Pasif' : 'Aktif'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/20">
        <button
          onClick={() => openModal(card)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Düzenle
        </button>
        <button
          onClick={() => handleDelete(card._id || card.id)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Sil
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header - moved above */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBackToDashboard} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kredi Kartları</h1>
            <p className="text-sm text-gray-500 mt-1">Şirket kredi kartlarını yönetin</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={cardTypeFilter}
            onChange={(e) => setCardTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Kartlar</option>
            <option value="corporate">Kurumsal Kartlar</option>
            <option value="personal">Bireysel Kartlar</option>
          </select>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kart Ekle
          </button>
        </div>
      </div>

      {/* Content Grid Sections */}
      <div>
      {cardTypeFilter === 'all' && (
        <>
          {filteredCards.filter(c => c.cardCategory === 'corporate').length > 0 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Kurumsal Kartlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCards.filter(card => card.cardCategory === 'corporate').map(card => (
                  <CardItem key={card._id || card.id} card={card} />
                ))}
              </div>
            </>
          )}
          
          {filteredCards.filter(c => c.cardCategory === 'personal').length > 0 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bireysel Kartlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.filter(card => card.cardCategory === 'personal').map(card => (
                  <CardItem key={card._id || card.id} card={card} />
                ))}
              </div>
            </>
          )}
        </>
      )}
      
      {cardTypeFilter !== 'all' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {cardTypeFilter === 'corporate' ? 'Kurumsal Kartlar' : 'Bireysel Kartlar'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <CardItem key={card._id || card.id} card={card} />
            ))}
          </div>
        </>
      )}

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {cardTypeFilter === 'all' ? 'Henüz kredi kartı eklenmemiş' :
             cardTypeFilter === 'corporate' ? 'Henüz kurumsal kart eklenmemiş' :
             'Henüz bireysel kart eklenmemiş'}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            İlk kartı ekle
          </button>
        </div>
      )}
      </div>

      {/* OLD CARDS GRID - REMOVING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{display: 'none'}}>
        {cards.map(card => (
          <div
            key={card._id || card.id}
            className={`bg-gradient-to-br ${
              card.cardType === 'visa' ? 'from-blue-500 to-blue-700' :
              card.cardType === 'mastercard' ? 'from-orange-500 to-red-600' :
              card.cardType === 'amex' ? 'from-green-500 to-teal-600' :
              'from-gray-500 to-gray-700'
            } text-white rounded-xl p-6 shadow-lg relative`}
          >
            {/* Card Type Logo */}
            <div className="flex items-center justify-between mb-8">
              <CreditCard className="w-10 h-10" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {card.cardType || 'Card'}
              </span>
            </div>

            {/* Card Number */}
            <div className="mb-4">
              <button
                onClick={() => toggleCardVisibility(card._id || card.id)}
                className="flex items-center text-sm text-white/80 hover:text-white mb-2"
              >
                {showCardNumbers[card._id || card.id] ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Gizle
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Göster
                  </>
                )}
              </button>
              <div className="text-xl font-mono tracking-wider">
                {showCardNumbers[card._id || card.id] 
                  ? card.cardNumber 
                  : maskCardNumber(card.cardNumber)
                }
              </div>
            </div>

            {/* Card Details */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/70 mb-1">Kart Adı</div>
                <div className="font-medium">{card.cardName}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/70 mb-1">Son Kullanma</div>
                <div className="font-medium">{card.expiryDate || '--/--'}</div>
              </div>
            </div>

            {/* Bank */}
            {card.bank && (
              <div className="mt-3 text-sm text-white/80">
                🏦 {card.bank}
              </div>
            )}

            {/* Limit */}
            {card.limit && (
              <div className="mt-2 text-sm text-white/90">
                Limit: {parseFloat(card.limit).toLocaleString('tr-TR')} TL
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                card.isActive === false ? 'bg-red-500' : 'bg-green-500'
              }`}>
                {card.isActive === false ? 'Pasif' : 'Aktif'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/20">
              <button
                onClick={() => openModal(card)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Düzenle
              </button>
              <button
                onClick={() => handleDelete(card._id || card.id)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Sil
              </button>
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="col-span-full text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Henüz kredi kartı eklenmemiş</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              İlk kartı ekle
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
            
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
              <h2 className="text-xl font-bold mb-4">
                {editingCard ? 'Kart Düzenle' : 'Yeni Kart Ekle'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kart Adı *</label>
                  <input
                    type="text"
                    value={formData.cardName}
                    onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Şirket Kartı"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası *</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma *</label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kart Tipi</label>
                    <select
                      value={formData.cardType}
                      onChange={(e) => setFormData({...formData, cardType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banka</label>
                  <input
                    type="text"
                    value={formData.bank}
                    onChange={(e) => setFormData({...formData, bank: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kart Limiti (TL)</label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({...formData, limit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Aktif</label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

export default CreditCardsManagement;
