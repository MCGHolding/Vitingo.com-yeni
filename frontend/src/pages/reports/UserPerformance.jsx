import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const UserPerformance = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_year');

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://sales-reports-hub.preview.emergentagent.com';

  const periods = [
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'this_quarter', label: 'Bu Çeyrek' },
    { value: 'this_year', label: 'Bu Yıl' }
  ];

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/user-performance?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading user performance:', error);
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

  const getPerformanceBadge = (performance) => {
    const badges = {
      'Mükemmel': 'bg-green-100 text-green-700',
      'İyi': 'bg-blue-100 text-blue-700',
      'Orta': 'bg-yellow-100 text-yellow-700',
      'Geliştirilmeli': 'bg-red-100 text-red-700'
    };
    return badges[performance] || 'bg-gray-100 text-gray-700';
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
          <h1 className="text-2xl font-bold text-gray-900">👥 Satıcı Performansı</h1>
          <p className="text-sm text-gray-500 mt-1">Takım üyelerinin satış performans analizi</p>
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
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Toplam Gelir</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.teamSummary?.totalRevenue)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Takım toplamı
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Toplam Anlaşma</span>
            <span className="text-2xl">🤝</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data?.teamSummary?.totalDeals)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Kazanılan anlaşmalar
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ort. Kazanma Oranı</span>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            %{(data?.teamSummary?.avgWinRate || 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Takım ortalaması
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Aktif Satıcı</span>
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data?.teamSummary?.activeUsers)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Satış yapan kullanıcı
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top by Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 En Yüksek Gelir</h3>
          <div className="space-y-3">
            {data?.topPerformers?.byRevenue?.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-500">{user.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(user.totalRevenue)}</div>
                  <div className="text-xs text-gray-500">{user.acceptedProposals} anlaşma</div>
                </div>
              </div>
            ))}
            {(!data?.topPerformers?.byRevenue || data.topPerformers.byRevenue.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Henüz veri yok
              </div>
            )}
          </div>
        </div>

        {/* Top by Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 En Çok Anlaşma</h3>
          <div className="space-y-3">
            {data?.topPerformers?.byDeals?.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-500">{user.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{user.acceptedProposals} adet</div>
                  <div className="text-xs text-gray-500">{formatCurrency(user.totalRevenue)}</div>
                </div>
              </div>
            ))}
            {(!data?.topPerformers?.byDeals || data.topPerformers.byDeals.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Henüz veri yok
              </div>
            )}
          </div>
        </div>

        {/* Top by Win Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💯 En Yüksek Kazanma Oranı</h3>
          <div className="space-y-3">
            {data?.topPerformers?.byWinRate?.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-500">{user.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-purple-600">%{user.winRate}</div>
                  <div className="text-xs text-gray-500">{user.acceptedProposals}/{user.totalProposals}</div>
                </div>
              </div>
            ))}
            {(!data?.topPerformers?.byWinRate || data.topPerformers.byWinRate.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Henüz veri yok
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Users Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı Performans Tablosu</h3>
        {(!data?.userPerformance || data.userPerformance.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <p>👥 Kullanıcı performans verisi bulunmuyor</p>
            <p className="text-sm mt-2">Satış verileri ekledikçe performans tablosu dolacaktır.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Satıcı</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Departman</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gelir</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Anlaşma</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ort. Anlaşma</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Kazanma %</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Fırsatlar</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Performans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.userPerformance?.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{user.department}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(user.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {user.acceptedProposals}
                    <span className="text-xs text-gray-400 ml-1">/ {user.totalProposals}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatCurrency(user.avgDealSize)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-full rounded-full ${
                            user.winRate >= 80 ? 'bg-green-500' :
                            user.winRate >= 60 ? 'bg-blue-500' :
                            user.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${user.winRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">%{user.winRate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{user.opportunities}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceBadge(user.performance)}`}>
                      {user.performance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default UserPerformance;