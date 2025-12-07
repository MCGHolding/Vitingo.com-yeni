import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FairAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedFair, setSelectedFair] = useState(null);
  const [fairDetail, setFairDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://saas-migration.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/reports/fairs?year=${year}&limit=10`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFairDetail = async (fairId) => {
    try {
      setLoadingDetail(true);
      const response = await fetch(`${backendUrl}/api/reports/fairs/${fairId}`);
      const result = await response.json();
      if (result.success) {
        setFairDetail(result.data);
      }
    } catch (error) {
      console.error('Error loading fair detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFairClick = (fair) => {
    setSelectedFair(fair);
    loadFairDetail(fair.fairId);
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
          <h1 className="text-2xl font-bold text-gray-900">🏢 Fuar Bazlı Analiz</h1>
          <p className="text-sm text-gray-500 mt-1">Fuar performanslarını karşılaştırın</p>
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

      {/* Top Fairs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En Çok Kazanç Sağlayan Fuarlar</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fuar Adı</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Şehir</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Stand</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Kazanç</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ort. Değer</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">m²</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.topFairs?.map((fair) => (
                <tr key={fair.fairId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    {fair.rank === 1 && <span className="text-2xl">🥇</span>}
                    {fair.rank === 2 && <span className="text-2xl">🥈</span>}
                    {fair.rank === 3 && <span className="text-2xl">🥉</span>}
                    {fair.rank > 3 && <span className="text-gray-600 font-medium">{fair.rank}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{fair.fairName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fair.city}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{fair.standCount}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                    {formatCurrency(fair.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {formatCurrency(fair.avgValue)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{fair.totalSquareMeters}m²</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleFairClick(fair)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.topFairs || data.topFairs.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Bu yıl için fuar verisi bulunmuyor
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuar Merkezi Performansı</h3>
          <div className="space-y-3">
            {data?.venuePerformance?.map((venue, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{venue.venue}</span>
                  <span className="text-sm text-gray-600">{venue.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${venue.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>{formatCurrency(venue.totalRevenue)}</span>
                  <span>{venue.standCount} stand</span>
                </div>
              </div>
            ))}
            {(!data?.venuePerformance || data.venuePerformance.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Fuar merkezi verisi yok
              </div>
            )}
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Fuar Takvimi & Satışlar</h3>
          <div className="space-y-2">
            {data?.monthlyCalendar?.map((month, index) => {
              const maxRevenue = Math.max(...(data.monthlyCalendar?.map(m => m.revenue) || [1]));
              const widthPercentage = (month.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="w-16 text-sm text-gray-600">{month.monthName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(month.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-xs text-gray-500 text-right">
                    {month.fairCount} fuar
                  </div>
                </div>
              );
            })}
            {(!data?.monthlyCalendar || data.monthlyCalendar.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                Aylık veri bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fair Detail Modal */}
      {selectedFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedFair.fairName}</h2>
                <p className="text-sm text-gray-500">{selectedFair.city} • {selectedFair.venue}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFair(null);
                  setFairDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : fairDetail ? (
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{fairDetail.stats?.totalProposals || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Toplam Teklif</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{fairDetail.stats?.wonProposals || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Kazanıldı</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{fairDetail.stats?.winRate || 0}%</div>
                    <div className="text-xs text-gray-500 mt-1">Kazanma Oranı</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{fairDetail.stats?.avgSize || 0}m²</div>
                    <div className="text-xs text-gray-500 mt-1">Ort. Stand</div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="text-sm font-medium text-green-700 mb-1">Toplam Gelir</div>
                  <div className="text-3xl font-bold text-green-900">
                    {formatCurrency(fairDetail.stats?.totalRevenue)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {fairDetail.stats?.totalSquareMeters}m² • En Büyük: {fairDetail.stats?.maxSize}m²
                  </div>
                </div>

                {/* Customers */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Müşteriler</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {fairDetail.customers?.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.squareMeters}m²</div>
                        </div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(customer.value)}
                        </div>
                      </div>
                    ))}
                    {(!fairDetail.customers || fairDetail.customers.length === 0) && (
                      <div className="text-center py-4 text-gray-500">Müşteri verisi yok</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default FairAnalysis;