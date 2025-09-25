import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Users, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';

export default function ImportDataPage({ onBackToDashboard }) {
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const dataTypes = [
    {
      id: 'customers',
      name: 'Müşteriler',
      icon: Users,
      description: 'Müşteri listesi ve bilgilerini import edin',
      format: 'CSV, Excel (.xlsx)'
    },
    {
      id: 'fairs',
      name: 'Fuarlar',
      icon: MapPin,
      description: 'Fuar bilgilerini ve detaylarını import edin',
      format: 'CSV, Excel (.xlsx)'
    },
    {
      id: 'opportunities',
      name: 'Satış Fırsatları',
      icon: FileText,
      description: 'Satış fırsatları ve pipeline verilerini import edin',
      format: 'CSV, Excel (.xlsx)'
    }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedFileType) return;

    setImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      setImportResult({
        success: true,
        processed: Math.floor(Math.random() * 100) + 50,
        errors: Math.floor(Math.random() * 5),
        message: `${selectedFileType} verisi başarıyla import edildi!`
      });
      setImporting(false);
      setSelectedFile(null);
      setSelectedFileType('');
    }, 2000);
  };

  const downloadTemplate = (type) => {
    // Simulate template download
    console.log(`Downloading template for ${type}`);
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
                <Upload className="h-7 w-7 text-blue-600 mr-2" />
                Import Data
              </h1>
              <p className="text-sm text-gray-600">Verilerinizi sisteme aktarın</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Data Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Veri Türü Seçin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedFileType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFileType(type.id)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className={`h-5 w-5 ${
                      selectedFileType === type.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                  <p className="text-xs text-gray-500">Format: {type.format}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate(type.id);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Template İndir
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        {selectedFileType && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Seçin</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Dosyayı buraya sürükleyin veya seçin
              </p>
              <p className="text-sm text-gray-600 mb-4">
                CSV veya Excel dosyası (.csv, .xlsx)
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
              >
                Dosya Seç
              </label>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    Seçilen dosya: {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Boyut: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Button */}
        {selectedFile && selectedFileType && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Import İşlemi</h2>
                <p className="text-sm text-gray-600">
                  {selectedFile.name} dosyası {selectedFileType} olarak import edilecek
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Import Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import Et</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              {importResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <h2 className="text-lg font-semibold text-gray-900">Import Sonucu</h2>
            </div>
            
            <div className="space-y-2">
              <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {importResult.message}
              </p>
              {importResult.success && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✅ İşlenen kayıt: {importResult.processed}</p>
                  <p>⚠️ Hata sayısı: {importResult.errors}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}