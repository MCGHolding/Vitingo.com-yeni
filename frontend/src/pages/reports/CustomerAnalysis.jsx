import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerAnalysis = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [segment, setSegment] = useState('all');

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://sales-reports-hub.preview.emergentagent.com';

  const segments = [
    { value: 'all', label: 'Tüm Müşteriler' },
    { value: 'vip', label: 'VIP Müşteriler' },
    { value: 'active', label: 'Aktif Müşteriler' },
    { value: 'passive', label: 'Pasif Müşteriler' },
    { value: 'new', label: 'Yeni Müşteriler' }
  ];

  useEffect(() => {
    loadData();
  }, [segment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/customers?segment=${segment}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading customer analysis:', error);
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
            onClick={() => navigate(`/${tenantSlug}/raporlar/satis-ozeti`)}
            className="text-green-600 hover:text-green-700 mb-2 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">👥 Müşteri Analizi</h1>
          <p className="text-sm text-gray-500 mt-1">Müşteri segmentasyonu ve davranış analizi</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
          >
            {segments.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Müşteri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Toplam Müşteri</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data?.overview?.totalCustomers)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Aktif: {formatNumber(data?.overview?.activeCustomers)}
          </div>
        </div>

        {/* Ortalama Sipariş Değeri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ort. Sipariş Değeri</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.overview?.averageOrderValue)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Toplam: {formatCurrency(data?.overview?.totalRevenue)}
          </div>
        </div>

        {/* Müşteri Yaşam Değeri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Müşteri Yaşam Değeri</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.overview?.lifetimeValue)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Ortalama
          </div>
        </div>

        {/* Tekrar Sipariş Oranı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Tekrar Sipariş Oranı</span>
            <span className="text-2xl">🔄</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            %{(data?.overview?.repeatRate || 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {formatNumber(data?.overview?.repeatCustomers)} müşteri
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Müşteri Segmentasyonu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Segmentasyonu</h3>
          <div className="space-y-4">
            {data?.segmentation?.map((seg, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{seg.segment}</span>
                  <span className="text-sm text-gray-600">
                    {formatNumber(seg.count)} müşteri • {formatCurrency(seg.totalValue)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-purple-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-green-500' :
                      index === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${seg.percentage}%` }}
                  />
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">%{seg.percentage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ülke Bazlı Dağılım */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ülke Bazlı Dağılım</h3>
          <div className="space-y-3">
            {data?.geography?.slice(0, 5).map((geo, index) => {
              const maxValue = Math.max(...(data.geography?.map(g => g.totalValue) || [1]));
              const percentage = (geo.totalValue / maxValue) * 100;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="w-16 text-sm text-gray-500">{geo.country}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(geo.totalValue)}
                      </span>
                    </div>
                  </div>
                  <span className="w-8 text-sm text-gray-500 text-right">{geo.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Değerli Müşteriler</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sıra</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Müşteri</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sipariş</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ülke</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Toplam Değer</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İlk Sipariş</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Son Sipariş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.topCustomers?.map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {customer.customerName}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {customer.orderCount}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {customer.country}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(customer.totalValue, customer.currency)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {customer.firstOrderDate ? new Date(customer.firstOrderDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.topCustomers || data.topCustomers.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Bu segment için müşteri verisi bulunmuyor
          </div>
        )}
      </div>

      {/* Activity Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Aktivite Analizi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">Aktif Müşteriler (Son 90 Gün)</div>
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(data?.activity?.active90Days)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Toplam müşterilerin %{((data?.activity?.active90Days / data?.overview?.totalCustomers) * 100).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Uyuyan Müşteriler (90-180 Gün)</div>
            <div className="text-3xl font-bold text-yellow-600">
              {formatNumber(data?.activity?.dormant)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Yeniden aktivasyon fırsatı
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Kayıp Müşteriler (180+ Gün)</div>
            <div className="text-3xl font-bold text-red-600">
              {formatNumber(data?.activity?.lost)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Geri kazanım stratejisi gerekli
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalysis;