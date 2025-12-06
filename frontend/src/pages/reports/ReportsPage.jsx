import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ReportsPage = () => {
  const { tenantSlug } = useParams();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  const [activeReport, setActiveReport] = useState('aging');
  const [loading, setLoading] = useState(false);
  const [agingData, setAgingData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport]);

  const loadReport = async (reportType) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (reportType) {
        case 'aging':
          endpoint = '/api/reports/aging';
          break;
        case 'income':
          endpoint = '/api/reports/income-expense?months=12';
          break;
        case 'customer':
          endpoint = '/api/reports/customer-performance?limit=20';
          break;
        default:
          endpoint = '/api/reports/aging';
      }
      
      const response = await fetch(`${backendUrl}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        switch (reportType) {
          case 'aging':
            setAgingData(data);
            break;
          case 'income':
            setIncomeData(data);
            break;
          case 'customer':
            setCustomerData(data);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const reports = [
    { id: 'aging', name: 'Alacak Yaşlandırma', icon: '📊', color: 'blue' },
    { id: 'income', name: 'Gelir/Gider Analizi', icon: '📈', color: 'green' },
    { id: 'customer', name: 'Müşteri Performansı', icon: '👥', color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">📊</span> Raporlama Merkezi
          </h1>
          <p className="text-gray-500 mt-1">Detaylı analizler ve iş zekası raporları</p>
        </div>

        {/* Rapor Seçimi */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {reports.map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-5 rounded-xl border-2 transition text-left ${
                activeReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{report.icon}</span>
                <div>
                  <h3 className={`font-semibold ${activeReport === report.id ? 'text-blue-700' : 'text-gray-900'}`}>
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.id === 'aging' && 'Vadelerine göre alacaklar'}
                    {report.id === 'income' && 'Aylık gelir ve gider analizi'}
                    {report.id === 'customer' && 'Müşteri bazlı performans'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Rapor İçeriği */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-r-transparent mx-auto"></div>
              <p className="mt-4 text-gray-500">Rapor yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Alacak Yaşlandırma Raporu */}
              {activeReport === 'aging' && agingData && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Alacak Yaşlandırma Raporu</h2>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Toplam Alacak</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(agingData.totalReceivables)}</p>
                    </div>
                  </div>
                  
                  {/* Yaşlandırma Barları */}
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {Object.entries(agingData.buckets).map(([key, bucket]) => {
                      const percentage = agingData.totalReceivables > 0 
                        ? (bucket.amount / agingData.totalReceivables * 100).toFixed(1) 
                        : 0;
                      const colors = {
                        current: 'bg-green-500',
                        days_31_60: 'bg-yellow-500',
                        days_61_90: 'bg-orange-500',
                        days_91_120: 'bg-red-500',
                        over_120: 'bg-red-700'
                      };
                      
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">{bucket.label}</div>
                          <div className="text-xl font-bold text-gray-900">{formatCurrency(bucket.amount)}</div>
                          <div className="text-xs text-gray-500 mb-2">{bucket.count} fatura</div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[key]} rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">%{percentage}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Detay Tablosu */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fatura No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Müşteri</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Vade</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Gecikme</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Kalan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.values(agingData.buckets).flatMap(b => b.invoices).slice(0, 15).map((inv, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-blue-600">{inv.invoiceNo}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{inv.customerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{inv.dueDate}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                inv.daysOverdue > 90 ? 'bg-red-100 text-red-700' :
                                inv.daysOverdue > 30 ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {inv.daysOverdue} gün
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(inv.remaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Gelir/Gider Raporu */}
              {activeReport === 'income' && incomeData && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Gelir/Gider Analizi</h2>
                    <p className="text-sm text-gray-500">{incomeData.period}</p>
                  </div>
                  
                  {/* Özet Kartları */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">Toplam Gelir</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(incomeData.totals.totalIncome)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600">Toplam Tahsilat</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(incomeData.totals.totalCollected)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600">Toplam Gider</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(incomeData.totals.totalExpense)}</p>
                    </div>
                    <div className={`rounded-lg p-4 ${incomeData.totals.totalProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <p className={`text-sm ${incomeData.totals.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Kar/Zarar</p>
                      <p className={`text-2xl font-bold ${incomeData.totals.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(incomeData.totals.totalProfit)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Aylık Grafik */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Aylık Trend</h3>
                    <div className="flex items-end justify-between h-48 px-4 bg-gray-50 rounded-lg py-4">
                      {incomeData.months.map((month, i) => {
                        const maxVal = Math.max(...incomeData.months.map(m => Math.max(m.income, m.expense))) || 1;
                        const incomeH = (month.income / maxVal) * 140;
                        const expenseH = (month.expense / maxVal) * 140;
                        return (
                          <div key={i} className="flex flex-col items-center flex-1">
                            <div className="flex items-end space-x-1 h-36">
                              <div className="w-4 bg-green-500 rounded-t" style={{ height: `${incomeH}px` }} title={`Gelir: ${formatCurrency(month.income)}`}></div>
                              <div className="w-4 bg-red-500 rounded-t" style={{ height: `${expenseH}px` }} title={`Gider: ${formatCurrency(month.expense)}`}></div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">{month.month.split(' ')[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center space-x-6 mt-3">
                      <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div><span className="text-sm text-gray-600">Gelir</span></div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-2"></div><span className="text-sm text-gray-600">Gider</span></div>
                    </div>
                  </div>
                  
                  {/* Aylık Tablo */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ay</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Gelir</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Tahsilat</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Gider</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Kar/Zarar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {incomeData.months.map((month, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(month.income)}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(month.collected)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(month.expense)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(month.profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Müşteri Performans Raporu */}
              {activeReport === 'customer' && customerData && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Müşteri Performans Raporu</h2>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span> İyi: {customerData.summary.goodCustomers}</span>
                      <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> Uyarı: {customerData.summary.warningCustomers}</span>
                      <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span> Risk: {customerData.summary.riskCustomers}</span>
                    </div>
                  </div>
                  
                  {/* Özet */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Toplam Müşteri</p>
                      <p className="text-2xl font-bold text-gray-900">{customerData.summary.totalCustomers}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">Toplam Ciro</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(customerData.summary.totalInvoiced)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600">Tahsil Edilen</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(customerData.summary.totalCollected)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600">Vadesi Geçmiş</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(customerData.summary.totalOverdue)}</p>
                    </div>
                  </div>
                  
                  {/* Müşteri Tablosu */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Müşteri</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Toplam Ciro</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Tahsil</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Kalan</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Gecikmiş</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Skor</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customerData.customers.map((cust, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{cust.name}</div>
                              <div className="text-xs text-gray-500">{cust.email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(cust.totalInvoiced)}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(cust.totalCollected)}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(cust.totalRemaining)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(cust.overdueAmount)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full ${
                                  cust.paymentScore >= 80 ? 'bg-green-500' :
                                  cust.paymentScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} style={{ width: `${cust.paymentScore}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500">{cust.paymentScore}%</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cust.status === 'good' ? 'bg-green-100 text-green-700' :
                                cust.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {cust.status === 'good' ? 'İyi' : cust.status === 'warning' ? 'Uyarı' : 'Risk'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
