import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ReportExport = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [exportOptions, setExportOptions] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'weekly',
    email: '',
    reportName: ''
  });

  const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    'https://sales-reports-hub.preview.emergentagent.com';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load export options
      const optionsResponse = await fetch(`${backendUrl}/api/reports/export-options`);
      const optionsResult = await optionsResponse.json();
      if (optionsResult.success) {
        setExportOptions(optionsResult.data);
      }

      // Load scheduled reports
      const scheduledResponse = await fetch(`${backendUrl}/api/reports/scheduled-reports`);
      const scheduledResult = await scheduledResponse.json();
      if (scheduledResult.success) {
        setScheduledReports(scheduledResult.data.scheduledReports);
      }
    } catch (error) {
      console.error('Error loading export data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (reportType, format) => {
    // In a real implementation, this would trigger a download
    alert(`${reportType.name} raporu ${format.toUpperCase()} formatında indirilecek.\n\n(Not: Bu özellik demo modunda çalışmaktadır)`);
  };

  const handleScheduleReport = async () => {
    if (!selectedReport || !scheduleForm.email) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/reports/schedule-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: selectedReport.id,
          frequency: scheduleForm.frequency,
          format: selectedFormat,
          email: scheduleForm.email,
          report_name: scheduleForm.reportName || selectedReport.name
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Rapor zamanlaması başarıyla oluşturuldu!');
        setShowScheduleModal(false);
        setScheduleForm({ frequency: 'weekly', email: '', reportName: '' });
        loadData(); // Reload to show new scheduled report
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Rapor zamanlanırken hata oluştu');
    }
  };

  const handleDeleteScheduled = async (reportId) => {
    if (!window.confirm('Bu zamanlanmış raporu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/reports/scheduled-reports/${reportId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Zamanlanmış rapor silindi');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
    }
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'daily': 'Günlük',
      'weekly': 'Haftalık',
      'monthly': 'Aylık'
    };
    return labels[frequency] || frequency;
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
          <h1 className="text-2xl font-bold text-gray-900">📥 Rapor Dışa Aktar</h1>
          <p className="text-sm text-gray-500 mt-1">Raporları indirin veya otomatik gönderim planlayın</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Kullanılabilir Raporlar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportOptions?.reportTypes?.map((report, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{report.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{report.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExport(report, 'pdf')}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    📄 PDF İndir
                  </button>
                  <button
                    onClick={() => handleExport(report, 'excel')}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    📊 Excel İndir
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowScheduleModal(true);
                  }}
                  className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  ⏰ Otomatik Gönderim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📅 Zamanlanmış Raporlar</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {scheduledReports.length} aktif
          </span>
        </div>
        
        {scheduledReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>⏰ Henüz zamanlanmış rapor bulunmuyor</p>
            <p className="text-sm mt-2">Yukarıdaki raporlardan birini seçip otomatik gönderim ayarlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rapor</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sıklık</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Format</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">E-posta</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Son Çalışma</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sonraki</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scheduledReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {report.reportName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {getFrequencyLabel(report.frequency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.email}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {report.lastRunAt ? new Date(report.lastRunAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {report.nextRunAt ? new Date(report.nextRunAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {report.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteScheduled(report.reportId)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedReport?.icon} {selectedReport?.name} - Otomatik Gönderim
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rapor Adı (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={scheduleForm.reportName}
                  onChange={(e) => setScheduleForm({...scheduleForm, reportName: e.target.value})}
                  placeholder={selectedReport?.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gönderim Sıklığı *
                </label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format *
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi *
                </label>
                <input
                  type="email"
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm({...scheduleForm, email: e.target.value})}
                  placeholder="ornek@sirket.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleScheduleReport}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Zamanla
              </button>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleForm({ frequency: 'weekly', email: '', reportName: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Rapor Dışa Aktarma Hakkında</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• PDF formatı, raporların profesyonel sunumu için uygundur</li>
              <li>• Excel formatı, veri analizi ve özel raporlama için idealdir</li>
              <li>• Otomatik gönderim ile raporlar belirlediğiniz sıklıkta e-postanıza gönderilir</li>
              <li>• Zamanlanmış raporları istediğiniz zaman silebilir veya düzenleyebilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportExport;
