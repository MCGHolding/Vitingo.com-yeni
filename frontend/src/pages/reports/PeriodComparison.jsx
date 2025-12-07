import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PeriodComparison = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://sales-reports-hub.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/period-comparison?year=${year}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading period comparison:', error);
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

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
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
          <button
            onClick={() => navigate(`/${tenantSlug}/raporlar/satis-ozeti`)}
            className="text-green-600 hover:text-green-700 mb-2 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📅 Dönemsel Karşılaştırma</h1>
          <p className="text-sm text-gray-500 mt-1">Yıllık performans karşılaştırması ve trendler</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Overview Cards */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Karşılaştırma: {data?.currentPeriod} vs {data?.previousPeriod}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Comparison */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Toplam Gelir</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(data?.summary?.revenue?.current)}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Önceki: {formatCurrency(data?.summary?.revenue?.previous)}
              </div>
              <div className={`text-sm font-semibold ${getChangeColor(data?.summary?.revenue?.change)}`}>
                {getChangeIcon(data?.summary?.revenue?.change)} {Math.abs(data?.summary?.revenue?.change || 0)}%
              </div>
            </div>
          </div>

          {/* Deals Comparison */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Anlaşma Sayısı</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(data?.summary?.deals?.current)}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Önceki: {formatNumber(data?.summary?.deals?.previous)}
              </div>
              <div className={`text-sm font-semibold ${getChangeColor(data?.summary?.deals?.change)}`}>
                {getChangeIcon(data?.summary?.deals?.change)} {Math.abs(data?.summary?.deals?.change || 0)}%
              </div>
            </div>
          </div>

          {/* Avg Deal Size */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Ort. Anlaşma Değeri</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(data?.summary?.avgDealSize?.current)}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Önceki: {formatCurrency(data?.summary?.avgDealSize?.previous)}
              </div>
              <div className={`text-sm font-semibold ${getChangeColor(data?.summary?.avgDealSize?.change)}`}>
                {getChangeIcon(data?.summary?.avgDealSize?.change)} {Math.abs(data?.summary?.avgDealSize?.change || 0)}%
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Kazanma Oranı</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              %{data?.summary?.winRate?.current || 0}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Önceki: %{data?.summary?.winRate?.previous || 0}
              </div>
              <div className={`text-sm font-semibold ${getChangeColor(data?.summary?.winRate?.change)}`}>
                {getChangeIcon(data?.summary?.winRate?.change)} {Math.abs(data?.summary?.winRate?.change || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Karşılaştırma</h3>
        {(!data?.monthlyComparison || data.monthlyComparison.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <p>📅 Aylık karşılaştırma verisi bulunmuyor</p>
            <p className="text-sm mt-2">Veri ekledikçe aylık trendler görünecektir.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {data?.monthlyComparison?.map((month, index) => {
            const maxRevenue = Math.max(
              ...data.monthlyComparison.map(m => Math.max(m.current.revenue, m.previous.revenue)),
              1
            );
            const currentPercentage = (month.current.revenue / maxRevenue) * 100;
            const previousPercentage = (month.previous.revenue / maxRevenue) * 100;
            
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 w-24">{month.monthName}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{data.currentPeriod}</div>
                        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(currentPercentage, 5)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {formatCurrency(month.current.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{data.previousPeriod}</div>
                        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(previousPercentage, 5)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {formatCurrency(month.previous.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`w-20 text-right font-semibold ${getChangeColor(month.change)}`}>
                    {getChangeIcon(month.change)} {Math.abs(month.change || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Changes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ İyileşmeler</h3>
          <div className="space-y-3">
            {[
              { label: 'Gelir', value: data?.summary?.revenue?.change, amount: data?.summary?.revenue?.changeAmount },
              { label: 'Anlaşma Sayısı', value: data?.summary?.deals?.change, amount: data?.summary?.deals?.changeAmount },
              { label: 'Ort. Anlaşma', value: data?.summary?.avgDealSize?.change, amount: data?.summary?.avgDealSize?.changeAmount },
              { label: 'Kazanma Oranı', value: data?.summary?.winRate?.change, amount: data?.summary?.winRate?.changeAmount }
            ]
              .filter(item => item.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.label}</span>
                  <div className="text-right">
                    <div className="text-green-600 font-semibold">↑ {item.value.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      {item.label === 'Kazanma Oranı' ? 
                        `+${item.amount.toFixed(1)}%` : 
                        item.label === 'Anlaşma Sayısı' ?
                          `+${item.amount} adet` :
                          `+${formatCurrency(item.amount)}`
                      }
                    </div>
                  </div>
                </div>
              ))}
            {[
              { label: 'Gelir', value: data?.summary?.revenue?.change },
              { label: 'Anlaşma Sayısı', value: data?.summary?.deals?.change },
              { label: 'Ort. Anlaşma', value: data?.summary?.avgDealSize?.change },
              { label: 'Kazanma Oranı', value: data?.summary?.winRate?.change }
            ].filter(item => item.value > 0).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Bu dönemde iyileşme görülmedi
              </div>
            )}
          </div>
        </div>

        {/* Negative Changes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Gerileyen Alanlar</h3>
          <div className="space-y-3">
            {[
              { label: 'Gelir', value: data?.summary?.revenue?.change, amount: data?.summary?.revenue?.changeAmount },
              { label: 'Anlaşma Sayısı', value: data?.summary?.deals?.change, amount: data?.summary?.deals?.changeAmount },
              { label: 'Ort. Anlaşma', value: data?.summary?.avgDealSize?.change, amount: data?.summary?.avgDealSize?.changeAmount },
              { label: 'Kazanma Oranı', value: data?.summary?.winRate?.change, amount: data?.summary?.winRate?.changeAmount }
            ]
              .filter(item => item.value < 0)
              .sort((a, b) => a.value - b.value)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.label}</span>
                  <div className="text-right">
                    <div className="text-red-600 font-semibold">↓ {Math.abs(item.value).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      {item.label === 'Kazanma Oranı' ? 
                        `${item.amount.toFixed(1)}%` : 
                        item.label === 'Anlaşma Sayısı' ?
                          `${item.amount} adet` :
                          formatCurrency(item.amount)
                      }
                    </div>
                  </div>
                </div>
              ))}
            {[
              { label: 'Gelir', value: data?.summary?.revenue?.change },
              { label: 'Anlaşma Sayısı', value: data?.summary?.deals?.change },
              { label: 'Ort. Anlaşma', value: data?.summary?.avgDealSize?.change },
              { label: 'Kazanma Oranı', value: data?.summary?.winRate?.change }
            ].filter(item => item.value < 0).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Tüm metrikler pozitif! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodComparison;