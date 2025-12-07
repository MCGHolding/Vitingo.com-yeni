import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SalesSummary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_month');

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://saas-migration.preview.emergentagent.com';

  const periods = [
    { value: 'today', label: 'Bugün' },
    { value: 'this_week', label: 'Bu Hafta' },
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'this_quarter', label: 'Bu Çeyrek' },
    { value: 'this_year', label: 'Bu Yıl' },
    { value: 'last_month', label: 'Geçen Ay' },
    { value: 'last_quarter', label: 'Geçen Çeyrek' },
    { value: 'last_year', label: 'Geçen Yıl' }
  ];

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/summary?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency = 'EUR') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(value || 0);
  };

  const getChangeIndicator = (change) => {
    if (change > 0) return { icon: '↑', color: 'text-green-600', bg: 'bg-green-50' };
    if (change < 0) return { icon: '↓', color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: '→', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📈 Satış Özeti</h1>
          <p className="text-sm text-gray-500 mt-1">Genel satış performansınızı takip edin</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
          >
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/raporlar/disa-aktar')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span>⬇️</span>
            <span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Satış */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Toplam Satış</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.kpis?.totalRevenue?.value)}
          </div>
          {data?.kpis?.totalRevenue?.changePercentage !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${getChangeIndicator(data.kpis.totalRevenue.changePercentage).color}`}>
              <span className={`px-2 py-0.5 rounded ${getChangeIndicator(data.kpis.totalRevenue.changePercentage).bg}`}>
                {getChangeIndicator(data.kpis.totalRevenue.changePercentage).icon} {Math.abs(data.kpis.totalRevenue.changePercentage).toFixed(1)}%
              </span>
              <span className="ml-2 text-gray-500">vs önceki dönem</span>
            </div>
          )}
        </div>

        {/* Kazanılan Fırsatlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Kazanılan Fırsatlar</span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data?.kpis?.wonOpportunities?.value)}
          </div>
          {data?.kpis?.wonOpportunities?.change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${getChangeIndicator(data.kpis.wonOpportunities.change).color}`}>
              <span className={`px-2 py-0.5 rounded ${getChangeIndicator(data.kpis.wonOpportunities.change).bg}`}>
                {getChangeIndicator(data.kpis.wonOpportunities.change).icon} {Math.abs(data.kpis.wonOpportunities.change)}
              </span>
              <span className="ml-2 text-gray-500">vs önceki dönem</span>
            </div>
          )}
        </div>

        {/* Ortalama Teklif */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ortalama Teklif</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.kpis?.averageValue?.value)}
          </div>
        </div>

        {/* Dönüşüm Oranı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Dönüşüm Oranı</span>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            %{(data?.kpis?.conversionRate?.value || 0).toFixed(1)}
          </div>
          {data?.kpis?.conversionRate?.change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${getChangeIndicator(data.kpis.conversionRate.change).color}`}>
              <span className={`px-2 py-0.5 rounded ${getChangeIndicator(data.kpis.conversionRate.change).bg}`}>
                {getChangeIndicator(data.kpis.conversionRate.change).icon} {Math.abs(data.kpis.conversionRate.change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Satış Trendi</h3>
          <div className="space-y-3">
            {data?.monthlyTrend?.map((month, index) => {
              const maxRevenue = Math.max(...(data.monthlyTrend?.map(m => m.revenue) || [1]));
              const percentage = (month.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="w-12 text-sm text-gray-500">{month.monthName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(month.revenue)}
                      </span>
                    </div>
                  </div>
                  <span className="w-8 text-sm text-gray-500 text-right">{month.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Para Birimi Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Para Birimi Dağılımı</h3>
          <div className="space-y-4">
            {data?.currencyBreakdown?.map((currency, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{currency.currency}</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(currency.totalValue, currency.currency)} • {currency.count} teklif
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-green-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${currency.percentage}%` }}
                  />
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">%{currency.percentage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teklif Durumları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teklif Durumları</h3>
          <div className="flex justify-around">
            {[
              { status: 'draft', label: 'Taslak', color: 'bg-gray-200 text-gray-700', icon: '📝' },
              { status: 'sent', label: 'Gönderildi', color: 'bg-blue-100 text-blue-700', icon: '📤' },
              { status: 'accepted', label: 'Kazanıldı', color: 'bg-green-100 text-green-700', icon: '✅' },
              { status: 'rejected', label: 'Kayıp', color: 'bg-red-100 text-red-700', icon: '❌' },
              { status: 'pending', label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' }
            ].map((item) => {
              const stat = data?.proposalStats?.find(p => p.status === item.status);
              return (
                <div key={item.status} className="text-center">
                  <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stat?.count || 0}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Son Kazanılan Fırsatlar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Kazanılan Fırsatlar</h3>
          <div className="space-y-3">
            {data?.recentWins?.slice(0, 5).map((win, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{win.customerName}</div>
                  <div className="text-sm text-gray-500">{win.fairName}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(win.value, win.currency)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {win.date ? new Date(win.date).toLocaleDateString('tr-TR') : '-'}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentWins || data.recentWins.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Bu dönemde kazanılan fırsat bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı Navigasyon */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Detaylı Analizler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { path: '/raporlar/performans', icon: '📊', label: 'Performans', desc: 'Hedef vs Gerçekleşen' },
            { path: '/raporlar/pipeline', icon: '🎯', label: 'Satış Hunisi', desc: 'Pipeline Analizi' },
            { path: '/raporlar/fuar-analizi', icon: '🏢', label: 'Fuar Analizi', desc: 'Fuar Bazlı Rapor' },
            { path: '/raporlar/musteri-analizi', icon: '👥', label: 'Müşteri', desc: 'Segmentasyon' }
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl p-4 text-left hover:shadow-md transition-shadow border border-gray-100"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="font-medium text-gray-900 mt-2">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
