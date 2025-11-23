import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Loader2, AlertCircle, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ContractCreatePage = ({ onBack }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [contractTitle, setContractTitle] = useState('Yeni Sözleşme');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [updatedPages, setUpdatedPages] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contract-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Şablonlar yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Initialize field values
    const initialValues = {};
    template.fields.forEach((field) => {
      initialValues[field.field_key] = '';
    });
    setFieldValues(initialValues);
    setContractTitle(`${template.template_name} - ${new Date().toLocaleDateString('tr-TR')}`);
  };

  const handleFieldChange = (fieldKey, value) => {
    setFieldValues({
      ...fieldValues,
      [fieldKey]: value
    });
  };

  const validateForm = () => {
    if (!selectedTemplate) return false;
    
    for (const field of selectedTemplate.fields) {
      if (field.is_required && !fieldValues[field.field_key]?.trim()) {
        alert(`Lütfen "${field.field_name}" alanını doldurun`);
        return false;
      }
    }
    return true;
  };

  // Update contract with field values (replace placeholders)
  const handleUpdateContract = () => {
    if (!validateForm()) return;

    try {
      // Replace placeholders in each page
      const updated = selectedTemplate.pages.map((page) => {
        let updatedText = page.text;
        
        // Replace each field placeholder with its value
        selectedTemplate.fields.forEach((field) => {
          const placeholder = field.placeholder;
          const value = fieldValues[field.field_key] || '[DOLDURULMADI]';
          updatedText = updatedText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
        
        return {
          ...page,
          text: updatedText
        };
      });
      
      setUpdatedPages(updated);
      alert('✅ Bilgiler sözleşmeye uygulandı! Önizleme yapabilirsiniz.');
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Bir hata oluştu: ' + error.message);
    }
  };

  // Show preview
  const handlePreview = () => {
    if (!updatedPages) {
      alert('⚠️ Önce "Bilgileri Güncelle" butonuna tıklayın!');
      return;
    }
    setShowPreview(true);
    setPreviewPageIndex(0);
  };

  // Generate and download PDF
  const handleGenerateContract = async () => {
    if (!updatedPages) {
      alert('⚠️ Önce "Bilgileri Güncelle" butonuna tıklayın!');
      return;
    }

    setGenerating(true);
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          field_values: fieldValues,
          contract_title: contractTitle
        })
      });

      if (response.ok) {
        // Download PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contractTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('✅ Sözleşme PDF olarak oluşturuldu ve indirildi!');
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Sözleşme oluşturulamadı'}`);
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const renderFieldInput = (field) => {
    const commonClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent";
    
    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            rows={4}
            className={commonClasses}
            placeholder={field.selected_text.substring(0, 50) + '...'}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
            placeholder={field.selected_text.substring(0, 50) + '...'}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
            placeholder="ornek@email.com"
          />
        );
      
      case 'phone':
        return (
          <input
            type="tel"
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
            placeholder="+90 555 123 45 67"
          />
        );
      
      case 'dropdown':
        return (
          <select
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
          >
            <option value="">Seçiniz...</option>
            {field.dropdown_options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={fieldValues[field.field_key] || ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className={commonClasses}
            placeholder={field.selected_text.substring(0, 50) + '...'}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Geri
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {!selectedTemplate ? (
          /* Template Selection */
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Sözleşme Şablonu Seçin
            </h1>
            
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Henüz şablon oluşturulmamış</p>
                <button
                  onClick={onBack}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Şablon Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all"
                  >
                    <FileText className="h-10 w-10 text-emerald-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {template.template_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.total_pages} sayfa
                    </p>
                    <p className="text-sm text-emerald-600">
                      {template.fields.length} alan
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Contract Form */
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-600 hover:text-gray-900 mb-2 text-sm"
                >
                  ← Şablon Değiştir
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Yeni Sözleşme Oluştur
                </h1>
                <p className="text-gray-600 mt-1">
                  Şablon: {selectedTemplate.template_name}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Update Contract Button */}
                <button
                  onClick={handleUpdateContract}
                  className={`flex items-center px-5 py-3 rounded-lg font-semibold transition-all ${
                    updatedPages 
                      ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {updatedPages ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Güncellendi
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Bilgileri Güncelle
                    </>
                  )}
                </button>

                {/* Preview Button */}
                <button
                  onClick={handlePreview}
                  disabled={!updatedPages}
                  className="flex items-center px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Önizleme
                </button>

                {/* Generate PDF Button */}
                <button
                  onClick={handleGenerateContract}
                  disabled={generating || !updatedPages}
                  className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      PDF Oluştur ve İndir
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Contract Title */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sözleşme Başlığı
              </label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Sözleşme başlığı girin"
              />
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-6">
              {selectedTemplate.fields
                .sort((a, b) => a.order_index - b.order_index)
                .map((field) => (
                  <div key={field.field_key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.field_name}
                      {field.is_required && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </label>
                    {renderFieldInput(field)}
                    <p className="text-xs text-gray-500 mt-1">
                      {field.placeholder}
                    </p>
                  </div>
                ))}
            </div>

            {/* Generate Button (bottom) */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleGenerateContract}
                disabled={generating}
                className="w-full flex items-center justify-center px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                    Sözleşme Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Download className="h-6 w-6 mr-2" />
                    PDF Oluştur ve İndir
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractCreatePage;
