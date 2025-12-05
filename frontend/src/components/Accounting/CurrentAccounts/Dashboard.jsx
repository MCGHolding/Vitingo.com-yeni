import React from 'react';

const Dashboard = ({ stats, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* İlk Satır - Ana Metrikler */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        
        {/* Toplam Hesap */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Hesap</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAccounts}</p>
              <p className="text-xs text-gray-400 mt-1">aktif hesap</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        {/* Toplam Alacak */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Alacak</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalReceivables)}</p>
              <p className="text-xs text-green-500 mt-1">Bize borçlu tutarı</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Toplam Borç */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Borç</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalPayables)}</p>
              <p className="text-xs text-red-500 mt-1">Bizim borcumuz</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>

        {/* Net Bakiye */}
        <div className={`rounded-xl p-5 border shadow-sm hover:shadow-md transition ${
          stats.netBalance >= 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Net Bakiye</p>
              <p className={`text-3xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance)}
              </p>
              <p className={`text-xs mt-1 ${stats.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.netBalance >= 0 ? '↑ Lehimize' : '↓ Aleyhimize'}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              stats.netBalance >= 0 
                ? 'bg-gradient-to-br from-green-200 to-emerald-300' 
                : 'bg-gradient-to-br from-red-200 to-rose-300'
            }`}>
              <span className="text-2xl">⚖️</span>
            </div>
          </div>
        </div>
      </div>

      {/* İkinci Satır - Durum Metrikleri */}
      <div className="grid grid-cols-4 gap-4">
        
        {/* Borçlu Firmalar */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Borçlu Firmalar</p>
              <p className="text-3xl font-bold text-green-600">{stats.debtorCount}</p>
              <p className="text-xs text-gray-400 mt-1">firma bize borçlu</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-xl">🟢</span>
            </div>
          </div>
        </div>

        {/* Alacaklı Firmalar */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Alacaklı Firmalar</p>
              <p className="text-3xl font-bold text-red-600">{stats.creditorCount}</p>
              <p className="text-xs text-gray-400 mt-1">firmaya borcumuz var</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-xl">🔴</span>
            </div>
          </div>
        </div>

        {/* Sıfır Bakiye */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sıfır Bakiye</p>
              <p className="text-3xl font-bold text-gray-600">{stats.zeroBalanceCount}</p>
              <p className="text-xs text-gray-400 mt-1">hesap denk</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-xl">⚪</span>
            </div>
          </div>
        </div>

        {/* Vadesi Geçen */}
        <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm hover:shadow-md transition cursor-pointer group bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 mb-1">Vadesi Geçen</p>
              <p className="text-3xl font-bold text-orange-600">{stats.overdueCount}</p>
              <p className="text-xs text-orange-500 mt-1">firma takipte</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center group-hover:scale-110 transition animate-pulse">
              <span className="text-xl">⚠️</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;