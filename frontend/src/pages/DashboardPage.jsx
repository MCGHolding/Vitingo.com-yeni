import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/stats`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const overdueInvoices = data?.overdueInvoices || [];
  const upcomingDues = data?.upcomingDues || [];
  const recentActivities = data?.recentActivities || [];
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👋 Hoş Geldiniz!</h1>
          <p className="text-gray-500 mt-1">
            İşte bugünün özeti • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Ana Metrikler - Satır 1 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/cari-hesaplar`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Alacak</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(overview.totalRemaining)}</p>
                <p className="text-xs text-gray-400 mt-1">Tahsil edilecek</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-5 border shadow-sm hover:shadow-md transition cursor-pointer ${
            overview.overdueCount > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-white border-gray-200'
          }`} onClick={() => navigate(`/${tenantSlug}/cari-hesaplar`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Vadesi Geçen</p>
                <p className={`text-2xl font-bold ${overview.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatCurrency(overview.overdueAmount)}
                </p>
                <p className="text-xs text-red-500 mt-1">{overview.overdueCount || 0} fatura gecikmiş</p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${overview.overdueCount > 0 ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/tahsilatlar`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Bu Ay Tahsilat</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(overview.thisMonthCollections)}</p>
                <p className="text-xs text-gray-400 mt-1">Alınan ödemeler</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tahsilat Oranı</p>
                <p className="text-2xl font-bold text-purple-600">%{overview.collectionRate || 0}</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, overview.collectionRate || 0)}%` }}/>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ana Metrikler - Satır 2 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/musteriler`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Müşteriler</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalCustomers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/projeler`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Aktif Projeler</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activeProjects || 0}</p>
                <p className="text-xs text-gray-400">/ {overview.totalProjects || 0} toplam</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/faturalar`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Bu Ay Fatura</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.thisMonthInvoices)}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🧾</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
               onClick={() => navigate(`/${tenantSlug}/odemeler`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Bu Ay Ödeme</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(overview.thisMonthPayments)}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💸</span>
              </div>
            </div>
          </div>
        </div>

        {/* Üç Kolon Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          
          {/* Vadesi Geçen */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔴</span> Vadesi Geçen
              </h3>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {overdueInvoices.length}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {overdueInvoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-3xl">✅</span>
                  <p className="mt-2">Vadesi geçen fatura yok!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {overdueInvoices.slice(0, 8).map((inv, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-red-50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{inv.customerName}</div>
                          <div className="text-xs text-gray-500">{inv.invoiceNo} • {inv.daysOverdue} gün gecikmiş</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600 text-sm">{formatCurrency(inv.remaining)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Yaklaşan Vadeler */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🟡</span> Yaklaşan Vadeler
              </h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {upcomingDues.length}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {upcomingDues.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-3xl">📅</span>
                  <p className="mt-2">Yaklaşan vade yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingDues.slice(0, 8).map((inv, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-yellow-50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{inv.customerName}</div>
                          <div className="text-xs text-gray-500">{inv.invoiceNo} • {inv.daysLeft} gün kaldı</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-600 text-sm">{formatCurrency(inv.remaining)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📋</span> Son Aktiviteler
              </h3>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <span className="text-3xl">📝</span>
                  <p className="mt-2">Henüz aktivite yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActivities.slice(0, 8).map((act, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-gray-50 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          act.type === 'invoice' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <span className="text-sm">{act.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{act.title}</div>
                          <div className="text-xs text-gray-500 truncate">{act.subtitle}</div>
                        </div>
                        <div className={`font-bold text-sm ${act.type === 'collection' ? 'text-green-600' : 'text-gray-900'}`}>
                          {formatCurrency(act.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aylık Trend */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📈</span> Aylık Trend (Son 6 Ay)
          </h3>
          <div className="flex items-end justify-between h-40 px-4">
            {monthlyTrend.map((month, i) => {
              const maxVal = Math.max(...monthlyTrend.map(m => Math.max(m.invoices || 0, m.collections || 0))) || 1;
              const invH = ((month.invoices || 0) / maxVal) * 120;
              const colH = ((month.collections || 0) / maxVal) * 120;
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="flex items-end space-x-1 h-32">
                    <div className="w-5 bg-blue-500 rounded-t hover:bg-blue-600 transition" style={{ height: `${invH}px` }} title={`Fatura: ${formatCurrency(month.invoices)}`}/>
                    <div className="w-5 bg-green-500 rounded-t hover:bg-green-600 transition" style={{ height: `${colH}px` }} title={`Tahsilat: ${formatCurrency(month.collections)}`}/>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{month.month}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div><span className="text-sm text-gray-600">Faturalar</span></div>
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div><span className="text-sm text-gray-600">Tahsilatlar</span></div>
          </div>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => navigate(`/${tenantSlug}/faturalar/yeni`)} className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center space-x-2">
            <span className="text-xl">🧾</span><span className="font-medium">Yeni Fatura</span>
          </button>
          <button onClick={() => navigate(`/${tenantSlug}/tahsilatlar/yeni`)} className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center space-x-2">
            <span className="text-xl">💰</span><span className="font-medium">Yeni Tahsilat</span>
          </button>
          <button onClick={() => navigate(`/${tenantSlug}/odemeler/yeni`)} className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg flex items-center justify-center space-x-2">
            <span className="text-xl">💸</span><span className="font-medium">Yeni Ödeme</span>
          </button>
          <button onClick={() => navigate(`/${tenantSlug}/projeler/yeni`)} className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition shadow-lg flex items-center justify-center space-x-2">
            <span className="text-xl">📁</span><span className="font-medium">Yeni Proje</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
