import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PurchaseInvoiceListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = (window.runtimeConfig && window.runtimeConfig.REACT_APP_BACKEND_URL) || 
                     process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/purchase-invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
        console.log('✅ Purchase invoices loaded:', data.length);
      }
    } catch (error) {
      console.error('Error loading purchase invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewInvoice = () => {
    navigate(`/${tenantSlug}/faturalar/yeni`);
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Alış faturaları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alış Faturaları</h1>
            <p className="text-sm text-gray-500">Tedarikçilerden gelen fatura ve fişler</p>
          </div>
        </div>
        <button
          onClick={handleNewInvoice}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Alış Faturası
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">Toplam Fatura</div>
          <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600">Ödenen</div>
          <div className="text-2xl font-bold text-green-700">
            {invoices.filter(i => i.paymentStatus === 'odendi').length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600">Ödenmemiş</div>
          <div className="text-2xl font-bold text-red-700">
            {invoices.filter(i => i.paymentStatus === 'odenmedi').length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600">Toplam Tutar</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(invoices.reduce((sum, i) => sum + (i.amountTRY || 0), 0))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz alış faturası yok</h3>
          <p className="text-gray-500 mb-6">İlk alış faturanızı ekleyin</p>
          <button
            onClick={handleNewInvoice}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Yeni Alış Faturası
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belge No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tedarikçi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TL Karşılığı</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ödeme</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {invoice.documentType === 'fatura' ? '📄' : '🧾'}
                      </span>
                      <span className="font-medium text-gray-900">{invoice.documentNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.supplierName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {invoice.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {invoice.grossAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                    {invoice.amountTRY?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.paymentStatus === 'odendi'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invoice.paymentStatus === 'odendi' ? '✓ Ödendi' : '✗ Ödenmedi'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoiceListPage;
