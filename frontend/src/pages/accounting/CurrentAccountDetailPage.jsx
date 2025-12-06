import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { downloadPDF } from '../../utils/pdfDownload';

const CurrentAccountDetailPage = () => {
  const { tenantSlug, accountId } = useParams();
  const navigate = useNavigate();
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    import.meta.env.VITE_BACKEND_URL ||
                    import.meta.env.REACT_APP_BACKEND_URL;
  
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, invoices, payments, info
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadAccountDetail();
  }, [accountId]);

  const loadAccountDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/current-accounts/${accountId}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Hesap bulunamadı');
      }
      
      const data = await response.json();
      console.log('Account data loaded:', data);
      
      if (data.success) {
        setAccount(data.account);
        setTransactions(data.movements || []);
        setSummary(data.summary || { totalDebit: 0, totalCredit: 0, balance: 0 });
      }
    } catch (error) {
      console.error('Error loading account detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'invoice': return '🧾';
      case 'collection': return '💰';
      case 'payment': return '💸';
      case 'debit_note': return '📝';
      case 'credit_note': return '📋';
      default: return '📄';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'invoice': return 'Satış Faturası';
      case 'collection': return 'Tahsilat';
      case 'payment': return 'Ödeme';
      case 'debit_note': return 'Borç Dekontu';
      case 'credit_note': return 'Alacak Dekontu';
      default: return 'İşlem';
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/current-accounts/${accountId}/export/excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cari_hesap_${account?.accountNo}_ekstre.xlsx`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleExportPDF = async () => {
    await downloadPDF(`/api/export/statement/${accountId}/pdf`);
  };

  const handleSendEmail = async () => {
    if (!account?.email) {
      alert('Bu hesaba ait e-posta adresi bulunamadı.');
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/current-accounts/send-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, email: account.email })
      });
      
      if (response.ok) {
        alert(`Ekstre ${account.email} adresine gönderildi.`);
      }
    } catch (error) {
      console.error('Send email error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900">Hesap bulunamadı</h2>
          <button
            onClick={() => navigate(`/${tenantSlug}/cari-hesaplar`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto p-6">
        
        {/* HEADER */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/${tenantSlug}/cari-hesaplar`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Cari Hesaplara Dön
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono">
                  {account.accountNo}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  account.type === 'customer' ? 'bg-green-100 text-green-700' :
                  account.type === 'supplier' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {account.type === 'customer' ? '👤 Müşteri' :
                   account.type === 'supplier' ? '🏭 Tedarikçi' : '👨‍💼 Personel'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{account.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-500">
                {account.email && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {account.email}
                  </span>
                )}
                {account.phone && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {account.phone}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center"
              >
                <span className="mr-2">📧</span>
                Ekstre Gönder
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center"
              >
                <span className="mr-2">📊</span>
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center"
              >
                <span className="mr-2">📄</span>
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* ÖZET KARTLARI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Toplam Borç</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalDebit)} ₺</p>
            <p className="text-xs text-gray-400 mt-1">Bize borçlu tutar</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Toplam Alacak</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCredit)} ₺</p>
            <p className="text-xs text-gray-400 mt-1">Ödenen tutar</p>
          </div>
          
          <div className={`rounded-xl p-5 border shadow-sm ${
            summary.balance >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-sm text-gray-500 mb-1">Güncel Bakiye</p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)} ₺
            </p>
            <p className={`text-xs mt-1 ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.balance >= 0 ? 'Bize borçlu' : 'Bizim borcumuz'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">İşlem Sayısı</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            <p className="text-xs text-gray-400 mt-1">Toplam hareket</p>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'transactions', label: 'Hesap Hareketleri', icon: '📋' },
                { id: 'invoices', label: 'Faturalar', icon: '🧾' },
                { id: 'payments', label: 'Ödemeler/Tahsilatlar', icon: '💰' },
                { id: 'info', label: 'Firma Bilgileri', icon: 'ℹ️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB İÇERİĞİ */}
          <div className="p-6">
            
            {/* Hesap Hareketleri Tab */}
            {activeTab === 'transactions' && (
              <div>
                {/* Tarih Filtresi */}
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Başlangıç</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Bitiş</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <button className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Filtrele
                  </button>
                </div>
                
                {/* Hareketler Tablosu */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tarih</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">İşlem Tipi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Açıklama</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Borç (₺)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Alacak (₺)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Bakiye (₺)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Henüz işlem bulunmuyor
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t, index) => (
                        <tr key={t.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(t.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100">
                              {getTransactionIcon(t.type)} {getTransactionLabel(t.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {t.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            t.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(t.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {transactions.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm text-gray-700">
                          TOPLAM
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-green-600">
                          {formatCurrency(summary.totalDebit)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">
                          {formatCurrency(summary.totalCredit)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${
                          summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(summary.balance)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Firma Bilgileri Tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Firma Adı</label>
                    <p className="text-gray-900 font-medium">{account.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500">E-posta</label>
                    <p className="text-gray-900">{account.email || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Telefon</label>
                    <p className="text-gray-900">{account.phone || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Adres</label>
                    <p className="text-gray-900">{account.address || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vergi Bilgileri</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Vergi Dairesi</label>
                    <p className="text-gray-900">{account.taxOffice || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Vergi Numarası</label>
                    <p className="text-gray-900">{account.taxNumber || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500">Hesap Tipi</label>
                    <p className="text-gray-900">
                      {account.type === 'customer' ? 'Müşteri' :
                       account.type === 'supplier' ? 'Tedarikçi' : 'Personel'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Faturalar Tab - Placeholder */}
            {activeTab === 'invoices' && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">🧾</span>
                <p className="mt-2">Faturalar listesi burada görünecek</p>
              </div>
            )}

            {/* Ödemeler Tab - Placeholder */}
            {activeTab === 'payments' && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">💰</span>
                <p className="mt-2">Ödemeler ve tahsilatlar burada görünecek</p>
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default CurrentAccountDetailPage;
