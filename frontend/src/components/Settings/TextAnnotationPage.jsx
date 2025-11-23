import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Check } from 'lucide-react';

const TextAnnotationPage = ({ file, onBack, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [fields, setFields] = useState([]);
  
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'text',
    is_required: true,
    dropdown_options: ''
  });

  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'date', label: 'Tarih' },
    { value: 'email', label: 'E-posta' },
    { value: 'phone', label: 'Telefon' },
    { value: 'dropdown', label: 'Seçim Listesi' },
    { value: 'textarea', label: 'Uzun Metin' }
  ];

  useEffect(() => {
    extractPdfText();
  }, []);

  const extractPdfText = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${backendUrl}/api/contracts/extract-pdf-text`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPdfData(data);
      } else {
        alert('PDF metni çıkarılamadı');
        onBack();
      }
    } catch (error) {
      console.error('Error extracting PDF:', error);
      alert('Bir hata oluştu');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setPopupPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 10
      });
      setShowPopup(true);
      setFieldForm({
        field_name: '',
        field_type: 'text',
        is_required: true,
        dropdown_options: ''
      });
    }
  };

  const handleAddField = () => {
    if (!fieldForm.field_name.trim()) {
      alert('Alan adı gereklidir');
      return;
    }

    const newField = {
      id: Date.now(),
      field_name: fieldForm.field_name,
      field_key: fieldForm.field_name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '_'),
      field_type: fieldForm.field_type,
      is_required: fieldForm.is_required,
      dropdown_options: fieldForm.field_type === 'dropdown' 
        ? fieldForm.dropdown_options.split(',').map(opt => opt.trim()).filter(opt => opt)
        : null,
      selected_text: selectedText,
      placeholder: `{{${fieldForm.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}}}`
    };

    setFields([...fields, newField]);
    setShowPopup(false);
    setSelectedText(null);
    window.getSelection().removeAllRanges();
  };

  const handleRemoveField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleComplete = () => {
    if (fields.length === 0) {
      alert('Lütfen en az bir alan ekleyin');
      return;
    }
    
    onComplete({
      file,
      pdfData,
      fields: fields.map((f, idx) => ({
        ...f,
        order_index: idx
      }))
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">PDF işleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Geri
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Sözleşme Annotation</h1>
              <span className="text-sm text-gray-500">
                {pdfData?.total_pages || 0} sayfa
              </span>
            </div>

            <button
              onClick={handleComplete}
              className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Tamamla ({fields.length} alan)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* PDF Text Content */}
        <div 
          className="flex-1 bg-white border-r border-gray-200 p-8 overflow-auto"
          onMouseUp={handleTextSelect}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              💡 <strong>İpucu:</strong> Aşağıdaki metinde fareyle seçim yapın. 
              Seçtiğiniz metin için popup açılacak ve alan tanımlayabileceksiniz.
            </div>

            {pdfData?.pages.map((page) => (
              <div key={page.page_number} className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500">
                    Sayfa {page.page_number}
                  </h3>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                    {page.text}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fields Sidebar */}
        <div className="w-96 bg-white p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Tanımlanan Alanlar ({fields.length})
          </h2>
          
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Henüz alan eklenmedi</p>
              <p className="text-xs mt-2">Sol taraftaki metinde seçim yaparak alan ekleyin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{field.field_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: {fieldTypes.find(t => t.value === field.field_type)?.label}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1 font-mono">
                        {field.placeholder}
                      </p>
                      {field.is_required && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Zorunlu
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 break-words">
                    "{field.selected_text.substring(0, 80)}..."
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Field Popup */}
      {showPopup && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50"
          style={{
            left: `${Math.min(popupPosition.x, window.innerWidth - 340)}px`,
            top: `${popupPosition.y}px`,
            width: '320px'
          }}
        >
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 mb-1">Alan Ekle</h3>
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              "{selectedText.substring(0, 60)}..."
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alan Adı *
              </label>
              <input
                type="text"
                value={fieldForm.field_name}
                onChange={(e) => setFieldForm({...fieldForm, field_name: e.target.value})}
                placeholder="Örnek: Müşteri Adı"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alan Tipi
              </label>
              <select
                value={fieldForm.field_type}
                onChange={(e) => setFieldForm({...fieldForm, field_type: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {fieldForm.field_type === 'dropdown' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Seçenekler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={fieldForm.dropdown_options}
                  onChange={(e) => setFieldForm({...fieldForm, dropdown_options: e.target.value})}
                  placeholder="Örnek: Evet, Hayır, Belki"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={fieldForm.is_required}
                onChange={(e) => setFieldForm({...fieldForm, is_required: e.target.checked})}
                className="h-4 w-4 text-emerald-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Zorunlu alan</label>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setShowPopup(false)}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              İptal
            </button>
            <button
              onClick={handleAddField}
              className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAnnotationPage;
