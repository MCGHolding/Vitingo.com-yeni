import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

const AddFieldModal = ({ templateId, onClose, onSuccess }) => {
  const [fields, setFields] = useState([
    {
      field_name: '',
      field_key: '',
      field_type: 'text',
      is_required: true,
      dropdown_options: [],
      order_index: 0
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'date', label: 'Tarih' },
    { value: 'email', label: 'E-posta' },
    { value: 'phone', label: 'Telefon' },
    { value: 'dropdown', label: 'Seçim Listesi' },
    { value: 'textarea', label: 'Uzun Metin' }
  ];

  const addNewField = () => {
    setFields([
      ...fields,
      {
        field_name: '',
        field_key: '',
        field_type: 'text',
        is_required: true,
        dropdown_options: [],
        order_index: fields.length
      }
    ]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [key]: value
    };

    // Auto-generate field_key from field_name
    if (key === 'field_name') {
      const fieldKey = value
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '_');
      updatedFields[index].field_key = fieldKey;
    }

    setFields(updatedFields);
  };

  const validateFields = () => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.field_name.trim()) {
        setError(`Alan ${i + 1}: Alan adı zorunludur`);
        return false;
      }
      if (!field.field_key.trim()) {
        setError(`Alan ${i + 1}: Alan anahtarı zorunludur`);
        return false;
      }
      if (field.field_type === 'dropdown' && (!field.dropdown_options || field.dropdown_options.length === 0)) {
        setError(`Alan ${i + 1}: Seçim listesi için seçenekler girilmelidir`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/templates/${templateId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Alanlar eklenemedi');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Alan Ekle</h2>
            <p className="text-sm text-gray-600 mt-1">Şablona dinamik alanlar ekleyin</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {fields.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Alan {index + 1}</h3>
                {fields.length > 1 && (
                  <button
                    onClick={() => removeField(index)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alan Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.field_name}
                    onChange={(e) => updateField(index, 'field_name', e.target.value)}
                    placeholder="Örnek: Müşteri Adı"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Field Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alan Anahtarı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.field_key}
                    onChange={(e) => updateField(index, 'field_key', e.target.value)}
                    placeholder="Örnek: musteri_adi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alan Tipi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={field.field_type}
                    onChange={(e) => updateField(index, 'field_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Is Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zorunlu mu?</label>
                  <div className="flex items-center space-x-4 mt-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.is_required}
                        onChange={() => updateField(index, 'is_required', true)}
                        className="mr-2"
                      />
                      Evet
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!field.is_required}
                        onChange={() => updateField(index, 'is_required', false)}
                        className="mr-2"
                      />
                      Hayır
                    </label>
                  </div>
                </div>

                {/* Dropdown Options */}
                {field.field_type === 'dropdown' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seçenekler <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={field.dropdown_options.join(', ')}
                      onChange={(e) => {
                        const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt);
                        updateField(index, 'dropdown_options', options);
                      }}
                      placeholder="Örnek: Nakit, Kredi Kartı, Havale (virgülle ayırın)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Field Button */}
          <button
            onClick={addNewField}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Yeni Alan Ekle
          </button>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Ekleniyor...' : 'Alanları Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFieldModal;
