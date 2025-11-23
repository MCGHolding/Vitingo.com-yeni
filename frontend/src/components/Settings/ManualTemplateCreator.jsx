import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, FileText } from 'lucide-react';

const ManualTemplateCreator = ({ onBack, onComplete, templateToEdit = null }) => {
  const isEditMode = Boolean(templateToEdit);
  const [templateName, setTemplateName] = useState(templateToEdit?.template_name || '');
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fields, setFields] = useState(
    templateToEdit?.fields.map((f, idx) => ({
      id: idx + 1,
      name: f.field_name,
      slug: f.field_key,
      type: f.field_type,
      unit: f.unit
    })) || getDefaultFields()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default fields that user can delete if not needed
  function getDefaultFields() {
    return [
      // Firma Bilgileri
      { id: 1, name: 'Firma Adı', slug: 'firma_adi', type: 'text' },
      { id: 2, name: 'Firma Kısa Adı', slug: 'firma_kisa_adi', type: 'text' },
      { id: 3, name: 'Firma Adresi', slug: 'firma_adresi', type: 'textarea' },
      { id: 4, name: 'Firma Yetkili Kişisi', slug: 'firma_yetkili_kisisi', type: 'text' },
      
      // Müşteri Bilgileri
      { id: 5, name: 'Müşteri Adı', slug: 'musteri_adi', type: 'text' },
      { id: 6, name: 'Müşteri Kısa Adı', slug: 'musteri_kisa_adi', type: 'text' },
      { id: 7, name: 'Müşteri Adresi', slug: 'musteri_adresi', type: 'textarea' },
      { id: 8, name: 'Müşteri Yetkili Kişisi', slug: 'musteri_yetkili_kisisi', type: 'text' },
      
      // Sözleşme & Fuar Bilgileri
      { id: 9, name: 'Sözleşme Konusu', slug: 'sozlesme_konusu', type: 'text' },
      { id: 10, name: 'Fuar Adı', slug: 'fuar_adi', type: 'text' },
      { id: 11, name: 'Fuar Başlama Tarihi', slug: 'fuar_baslama_tarihi', type: 'date' },
      { id: 12, name: 'Fuar Bitiş Tarihi', slug: 'fuar_bitis_tarihi', type: 'date' },
      { id: 13, name: 'Fuar Merkezi', slug: 'fuar_merkezi', type: 'text' },
      { id: 14, name: 'Hol No', slug: 'hol_no', type: 'text' },
      { id: 15, name: 'Stand No', slug: 'stand_no', type: 'text' },
      
      // Stand Ölçüleri
      { id: 16, name: 'Stand Büyüklüğü', slug: 'stand_buyuklugu', type: 'number_unit', unit: 'sqm' },
      { id: 17, name: 'Stand Eni', slug: 'stand_eni', type: 'number_unit', unit: 'metre' },
      { id: 18, name: 'Stand Boyu', slug: 'stand_boyu', type: 'number_unit', unit: 'metre' },
      { id: 19, name: 'Stand Yüksekliği', slug: 'stand_yuksekligi', type: 'number_unit', unit: 'metre' },
      
      // Hizmet Detayları
      { id: 20, name: 'Tanımlar', slug: 'tanimlar', type: 'textarea' },
      { id: 21, name: 'Dahil Hizmetler', slug: 'dahil_hizmetler', type: 'textarea' },
      { id: 22, name: 'Hariç Hizmetler', slug: 'haric_hizmetler', type: 'textarea' },
      { id: 23, name: 'Firmanın Sorumlulukları', slug: 'firmanin_sorumluluklari', type: 'textarea' },
      { id: 24, name: 'Müşterinin Sorumlulukları', slug: 'musterinin_sorumluluklari', type: 'textarea' },
      
      // Finansal Bilgiler
      { id: 25, name: 'Sözleşme Tutarı', slug: 'sozlesme_tutari', type: 'number' },
      { id: 26, name: '1. Ödeme Oranı %', slug: 'odeme_1_oran', type: 'number' },
      { id: 27, name: '1. Ödeme Tutarı', slug: 'odeme_1_tutar', type: 'number' },
      { id: 28, name: '2. Ödeme Oranı %', slug: 'odeme_2_oran', type: 'number' },
      { id: 29, name: '2. Ödeme Tutarı', slug: 'odeme_2_tutar', type: 'number' },
      { id: 30, name: '3. Ödeme Oranı %', slug: 'odeme_3_oran', type: 'number' },
      { id: 31, name: '3. Ödeme Tutarı', slug: 'odeme_3_tutar', type: 'number' },
      { id: 32, name: 'Ödeme Koşulları', slug: 'odeme_kosullari', type: 'textarea' },
      
      // Diğer Bilgiler
      { id: 33, name: 'İşin Süresi', slug: 'isin_suresi', type: 'textarea' },
      { id: 34, name: 'Sözleşme Başlama Tarihi', slug: 'sozlesme_baslama_tarihi', type: 'date' },
      { id: 35, name: 'Sözleşme Bitiş Tarihi', slug: 'sozlesme_bitis_tarihi', type: 'date' },
      { id: 36, name: 'Vergiler', slug: 'vergiler', type: 'textarea' },
      { id: 37, name: 'Genel Hükümler', slug: 'genel_hukumler', type: 'textarea' },
      { id: 38, name: 'Ekler', slug: 'ekler', type: 'file' },
    ];
  }

  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'text_number', label: 'Metin+Sayı Beraber' },
    { value: 'date', label: 'Tarih' },
    { value: 'email', label: 'E-posta' },
    { value: 'select', label: 'Seçim Listesi' },
    { value: 'textarea', label: 'Uzun Metin' },
    { value: 'phone', label: 'Telefon' },
    { value: 'number_unit', label: 'Sayı + Birim' },
    { value: 'file', label: 'Resim/Dosya' },
  ];

  // Generate slug from field name
  const generateSlug = (name) => {
    const turkishChars = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    return name
      .toLowerCase()
      .split('')
      .map(char => turkishChars[char] || char)
      .join('')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleAddField = (newField) => {
    const maxId = fields.length > 0 ? Math.max(...fields.map(f => f.id)) : 0;
    setFields([...fields, { ...newField, id: maxId + 1 }]);
    setShowAddFieldModal(false);
  };

  const handleEditField = (updatedField) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
    setEditingField(null);
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Bu alanı silmek istediğinizden emin misiniz?')) {
      setFields(fields.filter(f => f.id !== fieldId));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Lütfen şablon adı girin');
      return;
    }

    if (fields.length === 0) {
      alert('En az bir alan eklemelisiniz');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const templateData = {
        template_name: templateName,
        filename: `${templateName}.txt`,
        total_pages: 1,
        pages: [{
          page_number: 1,
          text: '<p>Manuel şablon</p>',
          lines: ['Manuel şablon']
        }],
        fields: fields.map(f => ({
          field_name: f.name,
          field_key: f.slug,
          field_type: f.type,
          unit: f.unit || null,
          default_value: f.defaultValue || null,
          page: 1,
          bbox: [0, 0, 100, 20]
        })),
        creation_method: templateToEdit?.creation_method || 'manual'
      };

      const url = isEditMode 
        ? `${backendUrl}/api/contract-templates/${templateToEdit.id}`
        : `${backendUrl}/api/contract-templates`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        const message = isEditMode 
          ? `✅ Başarılı!\n\nŞablon "${templateName}" güncellendi.\n${fields.length} alan mevcut.`
          : `✅ Başarılı!\n\nŞablon "${templateName}" oluşturuldu.\n${fields.length} alan eklendi.`;
        alert(message);
        if (onComplete) onComplete();
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || (isEditMode ? 'Şablon güncellenemedi' : 'Şablon kaydedilemedi')}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Şablon kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldTypeLabel = (type) => {
    return fieldTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Şablon Düzenle' : 'Manuel Şablon Oluştur'}
              </h1>
              <p className="text-gray-600">
                {isEditMode ? 'Şablon alanlarını güncelleyin' : 'Sözleşme alanlarınızı özelleştirin'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveTemplate}
            disabled={isSubmitting}
            className={`flex items-center space-x-2 px-6 py-3 ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg disabled:opacity-50`}
          >
            <Save className="h-5 w-5" />
            <span>
              {isSubmitting 
                ? (isEditMode ? 'Güncelleniyor...' : 'Kaydediliyor...') 
                : (isEditMode ? 'Şablonu Güncelle' : 'Şablonu Kaydet')
              }
            </span>
          </button>
        </div>

        {/* Template Name */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şablon Adı
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Örn: QUATTROSTAND SÖZLEŞME ŞABLONUv3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fields List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Sözleşme Alanları ({fields.length})
            </h2>
            <button
              onClick={() => setShowAddFieldModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Alan Ekle</span>
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{field.name}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-blue-600">
                          {`{{${field.slug}}}`}
                        </code>
                        <span className="text-xs text-gray-500">
                          {getFieldTypeLabel(field.type)}
                          {field.unit && ` (${field.unit})`}
                        </span>
                        {field.defaultValue && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            ✓ Default
                          </span>
                        )}
                      </div>
                      {field.defaultValue && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          Default: {field.defaultValue.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingField(field);
                      setShowAddFieldModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz alan eklenmemiş</p>
                <p className="text-sm">Yukarıdaki "Yeni Alan Ekle" butonuna tıklayın</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      {showAddFieldModal && (
        <AddFieldModal
          field={editingField}
          fieldTypes={fieldTypes}
          generateSlug={generateSlug}
          onSave={editingField ? handleEditField : handleAddField}
          onClose={() => {
            setShowAddFieldModal(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
};

// Add Field Modal Component
const AddFieldModal = ({ field, fieldTypes, generateSlug, onSave, onClose }) => {
  const [fieldName, setFieldName] = useState(field?.name || '');
  const [fieldSlug, setFieldSlug] = useState(field?.slug || '');
  const [fieldType, setFieldType] = useState(field?.type || 'text');
  const [fieldUnit, setFieldUnit] = useState(field?.unit || '');
  const [fieldDefaultValue, setFieldDefaultValue] = useState(field?.defaultValue || '');
  const [autoSlug, setAutoSlug] = useState(!field);

  const handleFieldNameChange = (name) => {
    setFieldName(name);
    if (autoSlug) {
      setFieldSlug(generateSlug(name));
    }
  };

  const handleSave = () => {
    if (!fieldName.trim()) {
      alert('Alan adı gereklidir');
      return;
    }

    const newField = {
      id: field?.id,
      name: fieldName,
      slug: fieldSlug || generateSlug(fieldName),
      type: fieldType,
      unit: fieldType === 'number_unit' ? fieldUnit : undefined,
      defaultValue: fieldDefaultValue || undefined
    };

    onSave(newField);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {field ? 'Alan Düzenle' : 'Yeni Alan Ekle'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alan Adı
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => handleFieldNameChange(e.target.value)}
              placeholder="Örn: Müşteri Ünvanı"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Auto-generated Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alan Kodu (Otomatik)
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-mono">
                {`{{${fieldSlug || 'alan_kodu'}}}`}
              </code>
              <button
                onClick={() => setAutoSlug(!autoSlug)}
                className={`px-3 py-2 rounded-lg text-sm ${autoSlug ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              >
                {autoSlug ? '🔒 Otomatik' : '🔓 Manuel'}
              </button>
            </div>
            {!autoSlug && (
              <input
                type="text"
                value={fieldSlug}
                onChange={(e) => setFieldSlug(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alan Tipi
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Selection (for number_unit type) */}
          {fieldType === 'number_unit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birim
              </label>
              <select
                value={fieldUnit}
                onChange={(e) => setFieldUnit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Birim Seçin</option>
                <option value="sqm">m² (Metrekare)</option>
                <option value="sqf">ft² (Feet²)</option>
                <option value="metre">Metre</option>
                <option value="feet">Feet</option>
                <option value="cm">Santimetre</option>
              </select>
            </div>
          )}

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Değer (Opsiyonel)
              <span className="text-xs text-gray-500 ml-2">
                - Sözleşmede otomatik doldurulacak
              </span>
            </label>
            {fieldType === 'textarea' ? (
              <textarea
                value={fieldDefaultValue}
                onChange={(e) => setFieldDefaultValue(e.target.value)}
                placeholder="Bu alanın default değerini girin..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            ) : (
              <input
                type="text"
                value={fieldDefaultValue}
                onChange={(e) => setFieldDefaultValue(e.target.value)}
                placeholder="Bu alanın default değerini girin..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              💡 Örn: "Genel Hükümler" için standart metin, "Para Birimi" için "TRY" gibi
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {field ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualTemplateCreator;
