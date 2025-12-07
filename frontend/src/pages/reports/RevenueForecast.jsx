import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RevenueForecast = () => {
  const navigate = useNavigate();
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
      const response = await fetch(`${backendUrl}/api/reports/forecast?year=${year}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading forecast:', error);
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
            onClick={() => navigate('/raporlar/satis-ozeti')}
            className="text-green-600 hover:text-green-700 mb-2 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">💰 Gelir Tahminleri</h1>
          <p className="text-sm text-gray-500 mt-1">Aylık projeksiyon ve pipeline tahminleri</p>
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

      {/* Year Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">🎯 Yıl Sonu Tahmini</div>
            <div className="text-4xl font-bold text-green-900 mb-2">
              {formatCurrency(data?.yearSummary?.projectedYearEnd)}
            </div>
            <div className="text-sm text-green-600">
              Hedef: {formatCurrency(data?.yearSummary?.yearlyTarget)} • 
              Başarı: %{data?.yearSummary?.targetAchievement}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Mevcut Gerçekleşen</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data?.yearSummary?.currentActual)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Kalan: {formatCurrency(data?.yearSummary?.remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Projection Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Aylık Gelir Projeksiyonu</h3>
        <div className="space-y-3">
          {data?.monthlyProjection?.map((month, index) => {
            const maxValue = Math.max(
              ...data.monthlyProjection.map(m => m.actual || m.projected || m.target || 0)
            );
            const value = month.actual || month.projected || 0;
            const widthPercentage = (value / maxValue) * 100;
            const targetPercentage = (month.target / maxValue) * 100;

            return (
              <div key={index} className="relative">
                <div className="flex items-center space-x-3 mb-1">
                  <span className="w-12 text-sm text-gray-600">{month.monthName}</span>
                  <div className="flex-1 relative h-8">
                    {/* Target line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-gray-300"
                      style={{ left: `${targetPercentage}%` }}
                    />
                    {/* Actual/Projected bar */}
                    <div
                      className={`h-full rounded-lg flex items-center justify-end pr-2 ${
                        month.isActual
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 opacity-60'
                      }`}
                      style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  </div>
                  <span className="w-24 text-xs text-gray-500 text-right">
                    {month.isActual ? 'Gerçekleşen' : 'Tahmin'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-gray-600">Gerçekleşen</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-600">Tahmin</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-gray-300"></div>
            <span className="text-gray-600">Hedef</span>
          </div>
        </div>
      </div>

      {/* Pipeline Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kapanma Olasılığı Bazlı Tahmin</h3>
          <div className="space-y-4">
            {[
              { key: 'high', data: data?.pipelineForecast?.high, color: 'green' },
              { key: 'medium', data: data?.pipelineForecast?.medium, color: 'yellow' },
              { key: 'low', data: data?.pipelineForecast?.low, color: 'red' }
            ].map(({ key, data: forecast, color }) => (
              <div key={key} className={`bg-${color}-50 rounded-lg p-4 border border-${color}-200`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium text-${color}-700`}>{forecast?.label}</span>
                  <span className="text-sm text-gray-600">{forecast?.count} fırsat</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(forecast?.weightedValue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Toplam: {formatCurrency(forecast?.totalValue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Ağırlıklı Tahmin:</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(data?.pipelineForecast?.totalWeighted)}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Closes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Yaklaşan Fırsatlar (30 Gün)</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.upcomingCloses?.map((opp, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 text-sm">{opp.name}</div>
                  <div className="text-xs text-gray-500">{opp.daysUntilClose} gün</div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {opp.customerName} • {opp.fairName}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(opp.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Olasılık: %{opp.probability}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.upcomingCloses || data.upcomingCloses.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                30 gün içinde kapanacak fırsat yok
              </div>
            )}
          </div>
          {data?.upcomingCloses && data.upcomingCloses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">30 Günlük Beklenen Gelir</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data?.thirtyDayForecast)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueForecast;