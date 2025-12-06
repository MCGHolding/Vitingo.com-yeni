import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadPDF } from '../../utils/pdfDownload';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = `${backendUrl}/api/payments-new`;
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setStats({ total: data.total || 0, count: data.count || 0 });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ödemeyi iptal etmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/payments-new/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
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

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': '💵 Nakit',
      'bank_transfer': '🏦 Havale/EFT',
      'credit_card': '💳 Kredi Kartı',
      'check': '📝 Çek',
      'eft': '🔄 EFT'
    };
    return methods[method] || method;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💸 Ödemeler</h1>
            <p className="text-gray-500 mt-1">Tedarikçilere yapılan ödemeler</p>
          </div>
          
          <button
            onClick={() => navigate(`/${tenantSlug}/odemeler/yeni`)}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition shadow-lg shadow-red-500/30 flex items-center font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Ödeme
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Toplam Ödeme</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">İşlem Sayısı</p>
            <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Ortalama</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.count > 0 ? formatCurrency(stats.total / stats.count) : '-'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Başlangıç</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Bitiş</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={loadPayments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-r-transparent mx-auto"></div>
              <p className="mt-2 text-gray-500">Yükleniyor...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-lg font-medium text-gray-900">Henüz ödeme yok</h3>
              <p className="text-gray-500 mt-1">İlk ödemeyi eklemek için butona tıklayın.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Makbuz No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tedarikçi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fatura No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ödeme Şekli</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-red-600">{p.receiptNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.invoiceNo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getPaymentMethodLabel(p.paymentMethod)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-red-600">{formatCurrency(p.amount, p.currency)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => downloadPDF(`/api/export/payment/${p.id}/pdf`)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition"
                          title="PDF İndir"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                          title="İptal Et"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;