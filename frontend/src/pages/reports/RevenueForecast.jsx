import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RevenueForecast = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [months, setMonths] = useState(6);

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://feature-flags-1.preview.emergentagent.com';

  const monthOptions = [
    { value: 3, label: '3 Ay' },
    { value: 6, label: '6 Ay' },
    { value: 12, label: '12 Ay' }
  ];

  useEffect(() => {
    loadData();
  }, [months]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/forecast?months=${months}`);
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

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(value || 0);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-blue-600 bg-blue-50';
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'qualified':
        return 'bg-blue-100 text-blue-700';
      case 'proposal':
        return 'bg-purple-100 text-purple-700';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">📊 Gelir Tahminleri</h1>
          <p className="text-sm text-gray-500 mt-1">Potansiyel gelir ve pipeline analizi</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tahmini Gelir */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Tahmini Gelir</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.summary?.forecastedRevenue)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Sonraki {months} ay
          </div>
        </div>

        {/* Pipeline Değeri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Pipeline Değeri</span>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.summary?.pipelineValue)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {formatNumber(data?.summary?.opportunityCount)} fırsat
          </div>
        </div>

        {/* Kazanma Olasılığı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ağırlıklı Pipeline</span>
            <span className="text-2xl">⚖️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.summary?.weightedPipeline)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Olasılık ağırlıklı
          </div>
        </div>

        {/* Ortalama Güven */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ortalama Güven</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            %{(data?.summary?.averageConfidence || 0).toFixed(0)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Kazanma olasılığı
          </div>
        </div>
      </div>

      {/* Monthly Forecast */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Gelir Tahmini</h3>
        {(!data?.monthlyForecast || data.monthlyForecast.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <p>📅 Aylık tahmin verisi bulunmuyor</p>
            <p className="text-sm mt-2">Fırsatlar oluşturup kapanış tarihleri belirlediğinizde tahminler görünecektir.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {data?.monthlyForecast?.map((month, index) => {
            const maxRevenue = Math.max(...(data.monthlyForecast?.map(m => m.forecastedRevenue) || [1]));
            const percentage = (month.forecastedRevenue / maxRevenue) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{month.monthName}</span>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{formatCurrency(month.forecastedRevenue)}</span>
                    <span className="ml-2 text-gray-400">• {month.opportunityCount} fırsat</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      %{((month.forecastedRevenue / month.pipelineValue) * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Pipeline: {formatCurrency(month.pipelineValue)}</span>
                  <span>Ort. Güven: %{month.averageConfidence}</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Stage Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aşama Bazlı Tahmin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aşama Bazlı Tahmin</h3>
          {(!data?.byStage || data.byStage.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <p>🎯 Aşama bazlı veri bulunmuyor</p>
              <p className="text-sm mt-2">Fırsatlar oluşturun ve aşamalar belirleyin.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {data?.byStage?.map((stage, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stage.stage)}`}>
                      {stage.stageName}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{stage.count} fırsat</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(stage.forecastedValue)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Pipeline: {formatCurrency(stage.pipelineValue)}</span>
                  <span>Ağırlık: %{stage.confidence}</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Güven Seviyesi Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Güven Seviyesi Dağılımı</h3>
          {(!data?.byConfidence || data.byConfidence.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <p>📈 Güven seviyesi verisi bulunmuyor</p>
              <p className="text-sm mt-2">Fırsatlara güven seviyeleri ekleyin.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {data?.byConfidence?.map((conf, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(conf.minConfidence)}`}>
                      {conf.range}
                    </span>
                    <span className="text-sm text-gray-600">{conf.count} fırsat</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(conf.totalValue)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      conf.minConfidence >= 80 ? 'bg-green-500' :
                      conf.minConfidence >= 60 ? 'bg-blue-500' :
                      conf.minConfidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${conf.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Yüksek Değerli Fırsatlar</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Müşteri</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fırsat</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aşama</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Değer</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Güven</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tahmini Gelir</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Kapanış Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.topOpportunities?.slice(0, 10).map((opp, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {opp.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {opp.title}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(opp.stage)}`}>
                      {opp.stageName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(opp.value, opp.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(opp.confidence)}`}>
                      %{opp.confidence}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(opp.forecastedValue, opp.currency)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.topOpportunities || data.topOpportunities.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Pipeline'da fırsat bulunmuyor
          </div>
        )}
      </div>

      {/* Risk Analysis */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Risk Analizi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Düşük Güvenli Fırsatlar</div>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(data?.risks?.lowConfidenceCount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(data?.risks?.lowConfidenceValue || 0)} risk altında
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Gecikmeli Fırsatlar</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(data?.risks?.overdueCount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Kapanış tarihi geçmiş
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Uzun Süreli Fırsatlar</div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(data?.risks?.stalledCount || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              90+ gün aktivite yok
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecast;