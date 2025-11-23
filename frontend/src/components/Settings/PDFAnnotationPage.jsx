import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Plus, X } from 'lucide-react';

// PDF.js worker setup - using local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const PDFAnnotationPage = ({ file, onBack, onComplete }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [selectedText, setSelectedText] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [fields, setFields] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // Field form state
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'text',
    is_required: true,
    dropdown_options: ''
  });

  // Convert File to URL
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'number', label: 'Sayı' },
    { value: 'date', label: 'Tarih' },
    { value: 'email', label: 'E-posta' },
    { value: 'phone', label: 'Telefon' },
    { value: 'dropdown', label: 'Seçim Listesi' },
    { value: 'textarea', label: 'Uzun Metin' }
  ];

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
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
      page: currentPage
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
      fields: fields.map((f, idx) => ({
        ...f,
        order_index: idx
      }))
    });
  };

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
              <h1 className="text-xl font-bold text-gray-900">PDF Annotation</h1>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">
                Sayfa {currentPage} / {numPages || '-'}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              {/* Zoom Controls */}
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Tamamla ({fields.length} alan)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="col-span-2 bg-white rounded-lg shadow-lg p-4">
            <div 
              className="flex justify-center"
              onMouseUp={handleTextSelect}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => console.error('PDF Load Error:', error)}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 text-red-600">
                    <div className="text-center">
                      <p className="font-semibold mb-2">PDF Yüklenemedi</p>
                      <p className="text-sm">Lütfen geçerli bir PDF dosyası seçin</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>

          {/* Fields Sidebar */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tanımlanan Alanlar ({fields.length})
            </h2>
            
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Henüz alan eklenmedi</p>
                <p className="text-xs mt-2">PDF üzerinde metin seçerek alan ekleyin</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{field.field_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Tip: {fieldTypes.find(t => t.value === field.field_type)?.label}
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
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      "{field.selected_text.substring(0, 50)}..."
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Field Popup */}
      {showPopup && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            width: '320px'
          }}
        >
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 mb-1">Alan Ekle</h3>
            <p className="text-xs text-gray-500">"{selectedText.substring(0, 40)}..."</p>
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

export default PDFAnnotationPage;
