import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PerformanceAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://bank-verify-2.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/performance?year=${year}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">📊 Performans Analizi</h1>
          <p className="text-sm text-gray-500 mt-1">Hedef vs gerçekleşen performansınızı takip edin</p>
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

      {/* Hedef vs Gerçekleşen */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hedef vs Gerçekleşen</h3>
        <div className="space-y-4">
          {data?.quarterlyResults?.map((quarter) => (
            <div key={quarter.quarter}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">{quarter.quarterName}</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(quarter.actual)} / {formatCurrency(quarter.target)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center justify-end pr-3 text-white font-medium text-sm ${
                    quarter.percentage >= 100 ? 'bg-green-600' :
                    quarter.percentage >= 75 ? 'bg-blue-600' :
                    quarter.percentage >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(quarter.percentage, 100)}%` }}
                >
                  {quarter.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-lg">
            <span className="font-bold text-gray-900">Yıllık Hedef:</span>
            <div className="text-right">
              <div className="font-bold text-gray-900">{formatCurrency(data?.yearlyTarget)}</div>
              <div className="text-sm text-gray-500">
                Gerçekleşen: {formatCurrency(data?.yearlyActual)} • 
                Kalan: {formatCurrency(Math.max(0, (data?.yearlyTarget || 0) - (data?.yearlyActual || 0)))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kazanma/Kaybetme Oranı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kazanma/Kaybetme Oranı</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90" width="192" height="192">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#e5e7eb"
                  strokeWidth="24"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#10b981"
                  strokeWidth="24"
                  fill="none"
                  strokeDasharray={`${(data?.winLoss?.winRate || 0) * 5.02} 502`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    %{data?.winLoss?.winRate || 0}
                  </div>
                  <div className="text-sm text-gray-500">KAZANMA ORANI</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data?.winLoss?.won || 0}</div>
              <div className="text-sm text-gray-500">Kazanılan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data?.winLoss?.lost || 0}</div>
              <div className="text-sm text-gray-500">Kayıp</div>
            </div>
          </div>
        </div>

        {/* Kayıp Sebepleri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kayıp Sebepleri</h3>
          <div className="space-y-3">
            {data?.lostReasons?.slice(0, 5).map((reason, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{reason.reason}</span>
                  <span className="text-sm font-medium text-gray-900">{reason.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${reason.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {reason.count} fırsat • {formatCurrency(reason.totalValue)}
                </div>
              </div>
            ))}
            {(!data?.lostReasons || data.lostReasons.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Kayıp sebep verisi yok
              </div>
            )}
          </div>
          {data?.lostReasons?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              Toplam Kayıp: {formatCurrency(data.lostReasons.reduce((sum, r) => sum + r.totalValue, 0))}
            </div>
          )}
        </div>
      </div>

      {/* Stand Tipi Performansı */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stand Tipi Bazlı Performans</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tip</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Teklif</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Kazanma</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ort. Değer</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Toplam</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.standTypePerformance?.map((type, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {type.type === 'wooden' ? '🪵' : type.type === 'system' ? '🔧' : '🔀'} {type.typeName}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{type.total}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {type.won}
                    <span className="ml-2 text-xs text-gray-400">({type.winRate}%)</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {formatCurrency(type.avgValue)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(type.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {type.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
