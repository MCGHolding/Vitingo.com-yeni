import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_year');

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://bank-verify-2.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/customers?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">👥 Müşteri Analizi</h1>
          <p className="text-sm text-gray-500 mt-1">Müşteri segmentasyonu ve değer analizi</p>
        </div>
      </div>

      {/* RFM Segmentation Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Segmentasyonu (RFM Analizi)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.segments?.map((segment) => (
            <div
              key={segment.key}
              className={`rounded-xl p-5 border-2 ${
                segment.key === 'vip' ? 'bg-purple-50 border-purple-300' :
                segment.key === 'loyal' ? 'bg-blue-50 border-blue-300' :
                segment.key === 'growing' ? 'bg-green-50 border-green-300' :
                'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{segment.label}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{segment.customerCount}</div>
              <div className="text-sm text-gray-600 mb-3">müşteri</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {formatCurrency(segment.totalRevenue)}
              </div>
              <div className="text-xs text-gray-500">Ort: {formatCurrency(segment.avgRevenue)}</div>
              <div className="text-xs text-gray-400 mt-2 italic">{segment.criteria}</div>
            </div>
          ))}
        </div>
        {data?.segments?.find(s => s.key === 'sleeping')?.customerCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-sm text-yellow-800">
              💡 <strong>Öneri:</strong> {data.segments.find(s => s.key === 'sleeping').customerCount} uyuyan müşteriye reaktivasyon kampanyası düzenleyin
            </span>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sektör Dağılımı</h3>
          <div className="space-y-3">
            {data?.sectorDistribution?.slice(0, 6).map((sector, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{sector.sector}</span>
                  <span className="text-sm text-gray-600">{sector.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-yellow-500' :
                      index === 4 ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${sector.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {sector.count} müşteri • {formatCurrency(sector.totalRevenue)}
                </div>
              </div>
            ))}
            {(!data?.sectorDistribution || data.sectorDistribution.length === 0) && (
              <div className="text-center py-4 text-gray-500">Sektör verisi bulunmuyor</div>
            )}
          </div>
        </div>

        {/* CLV Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Yaşam Boyu Değeri (CLV)</h3>
          <div className="space-y-3">
            {data?.clvDistribution?.map((clv, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{clv.label}</div>
                  <div className="text-sm text-gray-500">{clv.count} müşteri ({clv.percentage}%)</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(clv.totalRevenue)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Ortalama CLV:</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(data?.avgCLV)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Değerli Müşteriler</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Müşteri</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ülke</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Proje</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Toplam</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Son İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.topCustomers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {customer.rank === 1 && <span className="text-2xl">🥇</span>}
                    {customer.rank === 2 && <span className="text-2xl">🥈</span>}
                    {customer.rank === 3 && <span className="text-2xl">🥉</span>}
                    {customer.rank > 3 && <span className="text-gray-600 font-medium">{customer.rank}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{customer.country}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{customer.projectCount}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(customer.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {customer.daysSinceLastPurchase} gün önce
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.topCustomers || data.topCustomers.length === 0) && (
            <div className="text-center py-8 text-gray-500">Müşteri verisi bulunmuyor</div>
          )}
        </div>
      </div>

      {/* New vs Returning */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Yeni vs Tekrar Eden Müşteriler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 mb-2">Bu Yıl</div>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-6 flex-1">
                <div className="text-sm text-blue-600 mb-1">🆕 Yeni</div>
                <div className="text-3xl font-bold text-blue-900">{data?.newVsReturning?.new?.percentage}%</div>
                <div className="text-sm text-gray-600 mt-1">{data?.newVsReturning?.new?.count} müşteri</div>
                <div className="text-sm font-medium text-gray-900 mt-2">
                  {formatCurrency(data?.newVsReturning?.new?.revenue)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 flex-1">
                <div className="text-sm text-green-600 mb-1">🔄 Tekrar</div>
                <div className="text-3xl font-bold text-green-900">{data?.newVsReturning?.returning?.percentage}%</div>
                <div className="text-sm text-gray-600 mt-1">{data?.newVsReturning?.returning?.count} müşteri</div>
                <div className="text-sm font-medium text-gray-900 mt-2">
                  {formatCurrency(data?.newVsReturning?.returning?.revenue)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <div className="text-lg font-medium text-gray-700">Toplam Müşteri</div>
              <div className="text-4xl font-bold text-gray-900 mt-2">{data?.totalCustomers || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalysis;