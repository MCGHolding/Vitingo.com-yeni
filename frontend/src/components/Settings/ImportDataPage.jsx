import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Users, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Building2,
  Globe,
  ChevronDown,
  Download
} from 'lucide-react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';

export default function ImportDataPage({ onBackToDashboard }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const { toast } = useToast();

  const categories = [
    { id: 'fairs', name: 'Fuarlar' },
    { id: 'customers', name: 'Müşteriler' },
    { id: 'people', name: 'Kişiler' },
    { id: 'prospects', name: 'Müşteri Adayları' },
    { id: 'cities', name: 'Şehirler' },
    { id: 'countries', name: 'Ülkeler' },
    { id: 'faircenters', name: 'Fuar Merkezleri' }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir CSV dosyası seçiniz.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedCategory) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen kategori seçiniz ve dosya yükleyiniz.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/import/${selectedCategory}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import işlemi başarısız');
      }

      const result = await response.json();
      
      setImportResult({
        success: true,
        processed: result.processed || 0,
        errors: result.errors || 0,
        message: `${selectedCategory} verisi başarıyla import edildi!`,
        details: result.details || []
      });
      
      toast({
        title: "Başarılı",
        description: `${result.processed} kayıt başarıyla import edildi.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error.message || "Import işlemi sırasında hata oluştu.",
        errors: 1
      });
      
      toast({
        title: "Hata",
        description: error.message || "Import işlemi başarısız.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedFile(null);
    setImportResult(null);
  };

  const downloadTemplate = async () => {
    if (!selectedCategory) {
      toast({
        title: "Uyarı",
        description: "Önce kategori seçiniz.",
        variant: "destructive"
      });
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/download-template/${selectedCategory}`);
      
      if (!response.ok) {
        throw new Error('Template indirilemedi');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedCategory}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Başarılı",
        description: `${selectedCategory} şablonu indirildi.`,
      });
      
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Hata",
        description: error.message || "Şablon indirilemedi.",
        variant: "destructive"
      });
    }
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
        {/* Category Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Lütfen import etmek istediğiniz kategoriyi seçiniz
            </h2>
            
            <div className="mb-8">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-14 text-lg w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Kategori seçiniz...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Section */}
            {selectedCategory && (
              <div className="space-y-6">
                {/* Template Download Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">
                        📋 Önce Şablon İndirin
                      </h3>
                      <p className="text-xs text-blue-700">
                        {selectedCategory} için örnek CSV şablonunu indirin, düzenleyin ve yükleyin
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      <span>Şablon İndir</span>
                    </button>
                  </div>
                </div>

                {/* Browse Button */}
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-file-upload"
                  />
                  <label
                    htmlFor="csv-file-upload"
                    className="bg-green-600 text-white px-8 py-4 rounded-lg cursor-pointer hover:bg-green-700 inline-flex items-center space-x-2 text-lg font-medium"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Browse</span>
                  </label>
                </div>

                {/* Info Message */}
                <p className="text-sm text-gray-600 italic">
                  *Dosyanızın şablonumuza uygun ve geçerli bir CSV formatında olduğunu unutmayınız
                </p>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900 font-medium">{selectedFile.name}</span>
                      <span className="text-gray-600 text-sm">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {selectedFile && (
                  <div className="pt-4">
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2 text-lg font-medium"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Import Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Import Et</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
              
              {/* Reset Button */}
              <div className="pt-4">
                <button
                  onClick={resetForm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Yeni Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}