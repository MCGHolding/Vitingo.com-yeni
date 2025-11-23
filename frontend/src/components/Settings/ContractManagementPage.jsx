import React, { useState } from 'react';
import { ArrowLeft, FileText, Sparkles, Edit3, Upload, CheckCircle, Plus } from 'lucide-react';
import TextAnnotationPage from './TextAnnotationPage';
import ContractCreatePage from './ContractCreatePage';

const ContractManagementPage = ({ onBack }) => {
  const [step, setStep] = useState('selection'); // 'selection', 'annotation', 'complete', 'create-contract'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const methods = [
    {
      id: 'upload',
      title: 'Mevcut bir sözleşme ile şablon oluştur',
      description: 'PDF dosyanızı yükleyin ve dinamik alanları belirleyin',
      icon: Upload,
      enabled: true
    },
    {
      id: 'ai',
      title: 'Yapay Zeka ile şablon oluştur',
      description: 'AI ile otomatik sözleşme şablonu oluşturun',
      icon: Sparkles,
      enabled: false
    },
    {
      id: 'manual',
      title: 'Manuel Şablon oluştur',
      description: 'Sıfırdan kendi şablonunuzu oluşturun',
      icon: Edit3,
      enabled: false
    }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Lütfen sadece PDF dosyası seçin');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleStart = () => {
    if (!selectedMethod) {
      alert('Lütfen bir yöntem seçin');
      return;
    }

    if (selectedMethod === 'upload' && !selectedFile) {
      alert('Lütfen bir PDF dosyası seçin');
      return;
    }

    // Go to annotation step
    setStep('annotation');
  };

  const handleAnnotationComplete = async (data) => {
    console.log('Annotation complete:', data);
    
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      // Prepare template data
      const templateData = {
        template_name: prompt('Şablon için bir isim girin:', data.file.name.replace('.pdf', '')),
        filename: data.pdfData.filename,
        total_pages: data.pdfData.total_pages,
        pages: data.pdfData.pages,
        fields: data.fields
      };
      
      if (!templateData.template_name) {
        alert('Şablon ismi gereklidir');
        return;
      }
      
      const response = await fetch(`${backendUrl}/api/contract-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Başarılı!\n\nŞablon kaydedildi: ${result.template_id}\n${data.fields.length} alan tanımlandı.`);
        setStep('complete');
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Şablon kaydedilemedi'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Bir hata oluştu: ' + error.message);
    }
  };

  // Show annotation page
  if (step === 'annotation') {
    return (
      <TextAnnotationPage
        file={selectedFile}
        onBack={() => setStep('selection')}
        onComplete={handleAnnotationComplete}
      />
    );
  }

  // Show contract creation page
  if (step === 'create-contract') {
    return (
      <ContractCreatePage
        onBack={() => setStep('selection')}
      />
    );
  }

  // Show completion page
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl w-full text-center">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Şablon Başarıyla Oluşturuldu! 🎉
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            Sözleşme şablonunuz kaydedildi. Artık bu şablonu kullanarak yeni sözleşmeler oluşturabilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setStep('create-contract')}
              className="flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-6 w-6 mr-2" />
              Sözleşme Oluştur
            </button>
            
            <button
              onClick={() => {
                setStep('selection');
                setSelectedMethod(null);
                setSelectedFile(null);
              }}
              className="flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
            >
              <FileText className="h-6 w-6 mr-2" />
              Yeni Şablon Oluştur
            </button>
          </div>

          <button
            onClick={onBack}
            className="mt-6 text-gray-600 hover:text-gray-900 text-sm"
          >
            Ayarlar'a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Ayarlar'a Dön
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-3">
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sözleşme Yönetimi
            </h1>
            <p className="text-gray-600 text-sm mb-3">
              Kendi sözleşme şablonlarınızı oluşturun ve yönetin
            </p>
            
            {/* Quick Action - Create Contract */}
            <button
              onClick={() => setStep('create-contract')}
              className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Mevcut Şablondan Sözleşme Oluştur
            </button>
          </div>

          <div className="mb-6 pt-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Haydi Başlayalım
            </h2>

            {/* Method Selection */}
            <div className="space-y-4 mb-6">
              {methods.map((method) => (
                <div key={method.id} className="relative">
                  <label
                    className={`flex items-start p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${!method.enabled && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMethod === method.id}
                      onChange={() => method.enabled && setSelectedMethod(method.id)}
                      disabled={!method.enabled}
                      className="mt-1 h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <method.icon className="h-5 w-5 text-gray-700" />
                        <h3 className="font-semibold text-gray-900">{method.title}</h3>
                        {!method.enabled && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Yakında
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </label>

                  {/* File Upload Area (only for upload method) */}
                  {selectedMethod === 'upload' && method.id === 'upload' && (
                    <div className="mt-4 ml-9 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      {selectedFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-sm text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Kaldır
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-1">
                              PDF dosyanızı seçin veya buraya sürükleyin
                            </p>
                            <p className="text-xs text-gray-500">(Sadece PDF, Max 10MB)</p>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStart}
              disabled={!selectedMethod || (selectedMethod === 'upload' && !selectedFile)}
              className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              Başlayalım →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagementPage;
