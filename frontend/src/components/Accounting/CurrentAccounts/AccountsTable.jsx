import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AccountRowMenu from './AccountRowMenu';

const AccountsTable = ({
  accounts,
  loading,
  selectedAccounts,
  onSelectAll,
  onSelectAccount,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const truncateName = (name, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const getStatusBadge = (status, balance) => {
    if (status === 'debtor') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          Borçlu
        </span>
      );
    } else if (status === 'creditor') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
          Alacaklı
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
          Denk
        </span>
      );
    }
  };

  const getRiskIndicator = (riskScore) => {
    const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500'];
    return (
      <div className="flex items-center space-x-0.5" title={`Risk Skoru: ${riskScore}/5`}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${i <= riskScore ? colors[riskScore - 1] : 'bg-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Hesaplar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Hesap bulunamadı</h3>
          <p className="text-gray-500">Filtreleri değiştirmeyi veya yeni hesap eklemeyi deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hesap No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Firma Adı
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Borçlar (₺)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Alacaklar (₺)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Bakiye (₺)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map((account, index) => (
              <tr
                key={account.id}
                onClick={(e) => {
                  // Checkbox veya menü butonuna tıklanmadıysa detaya git
                  if (!e.target.closest('input[type="checkbox"]') && !e.target.closest('button')) {
                    navigate(`/${tenantSlug}/cari-hesaplar/${account.id}`);
                  }
                }}
                className={`transition-colors cursor-pointer ${
                  hoveredRow === account.id ? 'bg-blue-50' : 
                  account.overdueAmount > 0 ? 'bg-orange-50' :
                  selectedAccounts.includes(account.id) ? 'bg-blue-50' : 
                  'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredRow(account.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => onSelectAccount(account.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                
                {/* Sıra No */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                
                {/* Hesap No */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {account.accountNo}
                  </span>
                </td>
                
                {/* Firma Adı */}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div
                      className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                      title={account.name}
                    >
                      {truncateName(account.name)}
                    </div>
                    {account.overdueAmount > 0 && (
                      <span className="ml-2 text-orange-500" title="Vadesi geçmiş ödeme var">
                        ⚠️
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Son işlem: {new Date(account.lastTransaction).toLocaleDateString('tr-TR')}
                  </div>
                </td>
                
                {/* Borçlar (Alacak - Bize borçlu) */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(account.receivables)} ₺
                  </span>
                </td>
                
                {/* Alacaklar (Borç - Bizim borcumuz) */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(account.payables)} ₺
                  </span>
                </td>
                
                {/* Bakiye */}
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-bold ${
                    account.balance > 0 ? 'text-green-600' : 
                    account.balance < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {account.balance >= 0 ? '+' : '-'}{formatCurrency(account.balance)} ₺
                  </span>
                </td>
                
                {/* Risk Skoru */}
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    {getRiskIndicator(account.riskScore)}
                  </div>
                </td>
                
                {/* Durum */}
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(account.status, account.balance)}
                </td>
                
                {/* Menü */}
                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                  
                  {openMenuId === account.id && (
                    <AccountRowMenu
                      account={account}
                      onClose={() => setOpenMenuId(null)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
          {' - '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
          {' / '}
          <span>{totalItems}</span>
          {' kayıt gösteriliyor'}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* İlk Sayfa */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ««
          </button>
          
          {/* Önceki */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Önceki
          </button>
          
          {/* Sayfa Numaraları */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 text-sm rounded-lg transition ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          {/* Sonraki */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Sonraki
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Son Sayfa */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountsTable;