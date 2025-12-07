import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SalesPipeline = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://feature-flags-1.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/pipeline`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading pipeline:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">🎯 Satış Hunisi</h1>
          <p className="text-sm text-gray-500 mt-1">Satış aşamalarını ve dönüşüm oranlarını görüntüleyin</p>
        </div>
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <span className="font-medium">Canlı Görünüm</span>
        </div>
      </div>

      {/* Main Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">SATIŞ HUNİSİ</h3>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {data?.funnel?.map((stage, index) => {
            const maxValue = Math.max(...(data?.funnel?.map(s => s.count) || [1]));
            const widthPercentage = (stage.count / maxValue) * 100;
            const conversionRate = data?.conversionRates?.find(c => c.from === stage.stage);
            
            return (
              <div key={stage.stage} className="space-y-2">
                {/* Stage Box */}
                <div 
                  className="mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-all"
                  style={{ width: `${Math.max(widthPercentage, 30)}%` }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">{stage.label}</div>
                    <div className="text-3xl font-bold mb-1">{formatNumber(stage.count)} Fırsat</div>
                    <div className="text-sm opacity-90">{formatCurrency(stage.value)} Potansiyel</div>
                  </div>
                </div>

                {/* Conversion Arrow */}
                {conversionRate && index < data.funnel.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="text-center">
                      <div className="text-2xl">↓</div>
                      <div className="text-sm text-gray-600 font-medium">
                        %{conversionRate.rate} ({conversionRate.passed} fırsat geçti)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Conversion */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <div className="text-lg text-gray-600">Genel Dönüşüm Oranı</div>
          <div className="text-4xl font-bold text-green-600 mt-2">
            %{data?.overallConversion || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            (Lead → Kazanıldı)
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aşama Bazlı Yaşlanma */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aşama Bazlı Yaşlanma</h3>
          <div className="space-y-4">
            {data?.aging?.map((stage, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{stage.status}</span>
                  <span className="text-sm text-gray-500">{stage.count} fırsat</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Ortalama: {stage.avgDays} gün</div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          stage.avgDays < 7 ? 'bg-green-500' :
                          stage.avgDays < 14 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((stage.avgDays / 30) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Max: {stage.maxDays} gün
                  </div>
                </div>
              </div>
            ))}
            {(!data?.aging || data.aging.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Aktif aşama verisi yok
              </div>
            )}
          </div>
          {data?.aging && data.aging.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="font-medium">Toplam Ortalama Süre:</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round(data.aging.reduce((sum, a) => sum + a.avgDays, 0) / data.aging.length)} gün
              </div>
            </div>
          )}
        </div>

        {/* Tahmini Kapanış Tarihleri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tahmini Kapanış Tarihi</h3>
          <div className="space-y-3">
            {data?.closingForecast?.map((period, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{period.periodLabel}</div>
                  <div className="text-sm text-gray-500">{period.count} fırsat</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(period.weightedValue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    (Ağırlıklı)
                  </div>
                </div>
              </div>
            ))}
            {(!data?.closingForecast || data.closingForecast.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Tahmini kapanış verisi yok
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Toplam Pipeline:</span>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {formatCurrency(data?.pipelineTotal?.weightedValue)}
                </div>
                <div className="text-xs text-gray-500">
                  {data?.pipelineTotal?.count} fırsat
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">Toplam Pipeline</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(data?.pipelineTotal?.totalValue)}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {data?.pipelineTotal?.count} aktif fırsat
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="text-sm font-medium text-green-700 mb-1">Ağırlıklı Pipeline</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(data?.pipelineTotal?.weightedValue)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            Olasılık bazlı
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <div className="text-sm font-medium text-purple-700 mb-1">Dönüşüm Oranı</div>
          <div className="text-2xl font-bold text-purple-900">
            %{data?.overallConversion || 0}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Lead'den Kazanılana
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPipeline;
