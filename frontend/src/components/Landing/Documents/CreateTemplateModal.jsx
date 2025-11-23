import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

const CreateTemplateModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creation_method: 'upload'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('wordprocessing')) {
        setError('Sadece PDF ve DOCX dosyaları kabul edilir');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Dosya boyutu 10MB\'dan küçük olmalıdır');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Şablon adı zorunludur');
      return;
    }
    if (!selectedFile) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      // 1. Upload file
      const fileFormData = new FormData();
      fileFormData.append('file', selectedFile);
      
      const uploadResponse = await fetch(`${backendUrl}/api/contracts/upload`, {
        method: 'POST',
        body: fileFormData
      });

      if (!uploadResponse.ok) {
        throw new Error('Dosya yüklenemedi');
      }

      const uploadData = await uploadResponse.json();

      // 2. Create template
      const templateData = {
        name: formData.name,
        description: formData.description,
        creation_method: 'upload',
        original_file: {
          file_id: uploadData.file_id,
          filename: uploadData.filename,
          file_type: uploadData.file_type,
          mime_type: uploadData.mime_type
        }
      };

      const templateResponse = await fetch(`${backendUrl}/api/contracts/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (!templateResponse.ok) {
        throw new Error('Şablon oluşturulamadı');
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Yeni Şablon Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Template Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şablon Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örnek: Satış Sözleşmesi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Bu şablonun ne için kullanılacağını yazın..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Yükle <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="mx-auto w-12 h-12 text-green-600" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto w-12 h-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Dosya seç veya buraya sürükle</p>
                  <p className="mt-1 text-xs text-gray-500">Sadece PDF veya Word dosyaları (Max 10MB)</p>
                  <label className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    Dosya Seç
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !selectedFile}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Yükleniyor...' : 'Şablonu Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;