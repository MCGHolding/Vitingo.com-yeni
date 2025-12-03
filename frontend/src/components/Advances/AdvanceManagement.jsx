/**
 * Advance Management Component
 * Manages advance requests with role-based views
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, CheckCircle, XCircle, DollarSign, 
  Eye, Check, X, CreditCard, Building2,
  Filter, Calendar, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdvanceManagement = () => {
  const API = process.env.REACT_APP_BACKEND_URL || '';
  
  const [activeTab, setActiveTab] = useState('pending');
  const [advances, setAdvances] = useState({
    pending: [],
    approved: [],
    paid: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [isAccounting, setIsAccounting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal states
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Payment modal states
  const [paymentType, setPaymentType] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [creditCards, setCreditCards] = useState([]);
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    loadAdvances();
  }, []);

  const loadAdvances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get user's advances as requester
      const response = await axios.get(`${API}/api/documents/advances?user_role=requester`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setAdvances(response.data.advances);
        setIsAccounting(response.data.is_accounting);
        setIsAdmin(response.data.is_admin);
      }
    } catch (error) {
      console.error('Avanslar yüklenemedi:', error);
      toast.error('Avanslar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const [cardsRes, banksRes] = await Promise.all([
        axios.get(`${API}/api/credit-cards`),
        axios.get(`${API}/api/banks`)
      ]);

      setCreditCards(cardsRes.data?.cards || cardsRes.data || []);
      
      // Parse banks
      const banksData = Array.isArray(banksRes.data) ? banksRes.data : [];
      const bankAccounts = [];
      banksData.forEach(bank => {
        if (bank.accounts && bank.accounts.length > 0) {
          bank.accounts.forEach(account => {
            bankAccounts.push({
              ...account,
              bank_name: bank.bank_name,
              display_name: `${bank.bank_name} - ${account.currency_code} - ${account.account_holder}`
            });
          });
        }
      });
      setBanks(bankAccounts);
    } catch (error) {
      console.error('Ödeme yöntemleri yüklenemedi:', error);
    }
  };

  const handleApprove = async (advance) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/documents/advances/${advance.id}/approve`,
        { notes: 'Onaylandı' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Avans onaylandı');
        setApproveModal(null);
        loadAdvances();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Avans onaylanamadı');
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.warning('Lütfen red sebebini yazın');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/documents/advances/${rejectModal.id}/reject`,
        { reason: rejectReason },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Avans reddedildi');
        setRejectModal(null);
        setRejectReason('');
        loadAdvances();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Avans reddedilemedi');
    }
  };

  const handlePayment = async () => {
    if (!paymentModal || !paymentType || !paymentMethodId) {
      toast.warning('Lütfen ödeme yöntemini seçin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/documents/advances/${paymentModal.id}/pay`,
        {
          payment_type: paymentType,
          payment_method_id: paymentMethodId
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Avans ödemesi tamamlandı');
        setPaymentModal(null);
        setPaymentType('');
        setPaymentMethodId('');
        loadAdvances();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ödeme yapılamadı');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'Onay Bekliyor' },
      approved: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Onaylandı' },
      paid: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: DollarSign, label: 'Ödendi' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Reddedildi' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const renderAdvanceCard = (advance) => {
    const statusColor = {
      pending: 'border-l-orange-500',
      approved: 'border-l-green-500',
      paid: 'border-l-blue-500',
      rejected: 'border-l-red-500'
    };

    return (
      <div key={advance.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${statusColor[activeTab]} p-4 mb-4`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getStatusBadge(activeTab)}
              <h3 className="font-semibold text-gray-800">{advance.file_name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Tutar:</span> {advance.amount} {advance.currency_code}
              </div>
              <div>
                <span className="font-medium">Tarih:</span> {new Date(advance.document_date).toLocaleDateString('tr-TR')}
              </div>
              <div>
                <span className="font-medium">Şirket:</span> {advance.group_company_name}
              </div>
              <div>
                <span className="font-medium">Kategori:</span> {advance.expense_category_name}
              </div>
            </div>

            {advance.advance_approver_name && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Onaylayan:</span> {advance.advance_approver_name}
                {advance.advance_approved_at && ` - ${new Date(advance.advance_approved_at).toLocaleDateString('tr-TR')}`}
              </div>
            )}

            {advance.advance_payment_details && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                <strong>Ödeme:</strong> {advance.advance_payment_method_name}
                {advance.advance_paid_at && ` - ${new Date(advance.advance_paid_at).toLocaleDateString('tr-TR')}`}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {activeTab === 'approved' && isAccounting && (
              <button
                onClick={() => {
                  setPaymentModal(advance);
                  loadPaymentMethods();
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                💰 Ödeme Yap
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">Avans Yönetimi</h1>
        <p className="text-sm text-gray-600 mt-1">Avans taleplerinizi takip edin</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🟠 Onay Bekleyenler ({advances.pending.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🟢 Onaylı Avanslar ({advances.approved.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'paid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔵 Ödenmiş Avanslar ({advances.paid.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {advances[activeTab].length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Bu kategoride avans bulunamadı
            </div>
          ) : (
            <div>
              {advances[activeTab].map(renderAdvanceCard)}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Avans Ödemesi Yap</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Belge:</strong> {paymentModal.file_name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Tutar:</strong> {paymentModal.amount} {paymentModal.currency_code}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Yöntemi
              </label>
              <select
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  setPaymentMethodId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              >
                <option value="">Seçiniz...</option>
                <option value="credit_card">💳 Kredi Kartı</option>
                <option value="bank_transfer">🏦 Banka Havalesi</option>
              </select>

              {paymentType === 'credit_card' && (
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Kart seçiniz...</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.display_name || `${card.bank_name} - ${card.card_holder_name} (••••${card.card_last_4_digits || card.last_four_digits})`}
                    </option>
                  ))}
                </select>
              )}

              {paymentType === 'bank_transfer' && (
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Banka seçiniz...</option>
                  {banks.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.display_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPaymentModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handlePayment}
                disabled={!paymentType || !paymentMethodId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Ödemeyi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceManagement;
