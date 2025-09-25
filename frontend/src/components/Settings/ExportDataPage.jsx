import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Users, 
  MapPin, 
  Calendar,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  File
} from 'lucide-react';

export default function ExportDataPage({ onBackToDashboard }) {
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const dataTypes = [
    {
      id: 'customers',
      name: 'Müşteriler',
      icon: Users,
      description: 'Tüm müşteri bilgileri ve iletişim detayları',
      count: '150+ kayıt'
    },
    {
      id: 'fairs',
      name: 'Fuarlar',
      icon: MapPin,
      description: 'Fuar bilgileri, tarihler ve sektör detayları',
      count: '4 kayıt'
    },
    {
      id: 'opportunities',
      name: 'Satış Fırsatları',
      icon: FileText,
      description: 'Satış pipeline ve fırsat detayları',
      count: '85+ kayıt'
    },
    {
      id: 'users',
      name: 'Kullanıcılar',
      icon: Users,
      description: 'Sistem kullanıcıları ve yetki bilgileri',
      count: '12 kayıt'
    }
  ];

  const exportFormats = [
    { id: 'xlsx', name: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { id: 'csv', name: 'CSV (.csv)', icon: File }
  ];

  const dateRanges = [
    { id: 'all', name: 'Tüm Veriler' },
    { id: 'last30', name: 'Son 30 Gün' },
    { id: 'last90', name: 'Son 90 Gün' },
    { id: 'thisYear', name: 'Bu Yıl' },
    { id: 'custom', name: 'Özel Tarih Aralığı' }
  ];

  const handleDataTypeToggle = (typeId) => {
    setSelectedDataTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) return;

    setExporting(true);
    setExportResult(null);

    // Simulate export process
    setTimeout(() => {
      const totalRecords = selectedDataTypes.reduce((sum, type) => {
        const typeData = dataTypes.find(d => d.id === type);
        const count = parseInt(typeData?.count?.match(/\d+/)?.[0] || '0');
        return sum + count;
      }, 0);

      setExportResult({
        success: true,
        filename: `vitingo_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`,
        recordCount: totalRecords,
        fileSize: `${(totalRecords * 0.5).toFixed(1)} KB`,
        downloadUrl: '#' // In real implementation, this would be actual download URL
      });
      setExporting(false);
    }, 2000);
  };

  const downloadFile = () => {
    // Simulate file download
    console.log('Downloading:', exportResult.filename);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onBackToDashboard}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Download className="h-7 w-7 text-green-600 mr-2" />
                Export Data
              </h1>
              <p className="text-sm text-gray-600">Verilerinizi dışa aktarın</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Data Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Dışa Aktarılacak Veriler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedDataTypes.includes(type.id);
              return (
                <div
                  key={type.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDataTypeToggle(type.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-green-600' : 'text-gray-600'
                      }`} />
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{type.description}</p>
                  <p className="text-xs text-gray-500">{type.count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Format */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Formatı</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportFormats.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    exportFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat(format.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${
                      exportFormat === format.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h3 className="font-medium text-gray-900">{format.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Tarih Aralığı
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
          
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        {selectedDataTypes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Dışa Aktarım</h2>
                <p className="text-sm text-gray-600">
                  {selectedDataTypes.length} veri türü seçildi • Format: {exportFormat.toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Dışa Aktarılıyor...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Dışa Aktar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Export Result */}
        {exportResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Export Tamamlandı</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">{exportResult.filename}</p>
                    <p className="text-sm text-green-700">
                      {exportResult.recordCount} kayıt • {exportResult.fileSize}
                    </p>
                  </div>
                  <button
                    onClick={downloadFile}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>İndir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}