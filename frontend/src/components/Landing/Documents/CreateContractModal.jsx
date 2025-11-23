import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const CreateContractModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contractName, setContractName] = useState('');
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Şablonlar yüklenirken hata oluştu');
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep(2);
    // Initialize field values
    const initialValues = {};
    template.fields?.forEach(field => {
      initialValues[field.field_key] = '';
    });
    setFieldValues(initialValues);
  };

  const handleFieldChange = (fieldKey, value) => {
    setFieldValues({
      ...fieldValues,
      [fieldKey]: value
    });
  };

  const validateForm = () => {
    if (!contractName.trim()) {
      setError('Sözleşme adı zorunludur');
      return false;
    }

    // Check required fields
    for (const field of selectedTemplate.fields || []) {
      if (field.is_required && !fieldValues[field.field_key]?.trim()) {
        setError(`"${field.field_name}" alanı zorunludur`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const requestData = {
        template_id: selectedTemplate.id,
        contract_name: contractName,
        field_values: fieldValues
      };

      const response = await fetch(`${backendUrl}/api/contracts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Sözleşme oluşturulamadı');
      }

      const data = await response.json();
      setStep(3); // Success step
      setTimeout(() => {
        onSuccess(data);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field) => {
    const value = fieldValues[field.field_key] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          />
        );
      
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          >
            <option value="">Seçiniz...</option>
            {field.dropdown_options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.is_required}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Yeni Sözleşme Oluştur</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 1 && 'Şablon seçin'}
              {step === 2 && 'Bilgileri doldurun'}
              {step === 3 && 'Sözleşme oluşturuldu'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Hangi şablondan sözleşme oluşturmak istiyorsunuz?</p>
              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Henüz şablon yok</p>
                  <p className="text-xs text-gray-500">Önce bir şablon oluşturmalısınız</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description || 'Açıklama yok'}</p>
                          <p className="text-xs text-gray-500 mt-2">{template.fields?.length || 0} alan</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Form Filling */}
          {step === 2 && selectedTemplate && (
            <div className="space-y-6">
              {/* Contract Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sözleşme Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="Örnek: Ahmet Yılmaz Satış Sözleşmesi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Dynamic Fields */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sözleşme Bilgileri</h3>
                <div className="space-y-4">
                  {selectedTemplate.fields?.map((field) => (
                    <div key={field.field_id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sözleşme Oluşturuldu!</h3>
              <p className="text-gray-600">Sözleşmeniz başarıyla oluşturuldu ve kaydedildi.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {step === 1 ? 'İptal' : 'Geri'}
            </button>
            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Oluşturuluyor...' : 'Sözleşmeyi Oluştur'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateContractModal;
