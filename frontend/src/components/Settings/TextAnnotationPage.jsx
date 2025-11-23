import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Check, ChevronLeft, ChevronRight, Edit3, Eye } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const TextAnnotationPage = ({ file, onBack, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [fields, setFields] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedPages, setEditedPages] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  
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
    checkForDraft();
  }, []);

  // Check for existing draft
  const checkForDraft = () => {
    try {
      const draftKey = `contract_draft_${file?.name || 'unknown'}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        setShowDraftPrompt(true);
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  };

  // Load draft
  const loadDraft = () => {
    try {
      const draftKey = `contract_draft_${file?.name || 'unknown'}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setEditedPages(draft.editedPages || {});
        setFields(draft.fields || []);
        setCurrentPageIndex(draft.currentPageIndex || 0);
        setShowDraftPrompt(false);
        alert('✅ Taslak yüklendi!');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      alert('❌ Taslak yüklenirken hata oluştu');
    }
  };

  // Discard draft
  const discardDraft = () => {
    try {
      const draftKey = `contract_draft_${file?.name || 'unknown'}`;
      localStorage.removeItem(draftKey);
      setShowDraftPrompt(false);
    } catch (error) {
      console.error('Error discarding draft:', error);
    }
  };

  // Save draft
  const saveDraft = () => {
    try {
      const draftKey = `contract_draft_${file?.name || 'unknown'}`;
      const draftData = {
        editedPages,
        fields,
        currentPageIndex,
        savedAt: new Date().toISOString(),
        fileName: file?.name || 'unknown'
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSaved(true);
      
      // Show success message temporarily
      setTimeout(() => setDraftSaved(false), 3000);
      
      alert('💾 Taslak kaydedildi!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('❌ Taslak kaydedilirken hata oluştu');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showPopup) return; // Don't navigate if popup is open
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pdfData, showPopup]);

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
    
    // Merge edited pages with original PDF data
    const finalPages = pdfData.pages.map((page, idx) => ({
      ...page,
      text: editedPages[idx] || page.text
    }));
    
    // Clear draft after completion
    try {
      const draftKey = `contract_draft_${file?.name || 'unknown'}`;
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
    
    onComplete({
      file,
      pdfData: {
        ...pdfData,
        pages: finalPages
      },
      fields: fields.map((f, idx) => ({
        ...f,
        order_index: idx
      }))
    });
  };

  const handlePageContentChange = (newContent) => {
    setEditedPages({
      ...editedPages,
      [currentPageIndex]: newContent
    });
  };

  const goToNextPage = () => {
    if (currentPageIndex < pdfData.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
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
                Sayfa {currentPageIndex + 1} / {pdfData?.total_pages || 0}
              </span>
              
              {/* Page Navigation */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Önceki Sayfa (←)"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPageIndex === pdfData?.pages.length - 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sonraki Sayfa (→)"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Edit Mode Toggle */}
              <button
                onClick={toggleEditMode}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  editMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {editMode ? (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Düzenleme Modu
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Görüntüleme
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveDraft}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  draftSaved 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Değişiklikleri taslak olarak kaydet"
              >
                <svg 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                  />
                </svg>
                {draftSaved ? 'Kaydedildi!' : 'Taslak Kaydet'}
              </button>
              
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
      </div>

      {/* Draft Prompt Modal */}
      {showDraftPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <svg 
                  className="h-12 w-12 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Kaydedilmiş Taslak Bulundu!
              </h2>
              <p className="text-gray-600">
                Bu dosya için daha önce kaydedilmiş bir taslak var. Ne yapmak istersiniz?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={loadDraft}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                📂 Taslağı Yükle
              </button>
              <button
                onClick={discardDraft}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                🗑️ Taslağı Sil ve Yeni Başla
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              💡 İpucu: Düzenlemelerinizi kaybetmemek için düzenli olarak "Taslak Kaydet" butonunu kullanın
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* PDF Text Content - Single Page View */}
        <div 
          className="flex-1 bg-white border-r border-gray-200 overflow-auto"
          onMouseUp={!editMode ? handleTextSelect : undefined}
        >
          <div className="max-w-6xl mx-auto p-8">
            {!editMode && (
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                💡 <strong>İpucu:</strong> Metinde fareyle seçim yapın ve alan tanımlayın. 
                Gelişmiş düzenleme için "Düzenleme Modu" butonuna tıklayın.
              </div>
            )}

            {editMode && (
              <div className="mb-4 text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
                ✏️ <strong>Düzenleme Modu:</strong> Metni zengin düzenleyici ile düzenleyebilirsiniz. 
                Bold, italic, renk, resim ekleme gibi özellikler mevcuttur.
              </div>
            )}

            {/* Current Page Content */}
            {pdfData?.pages[currentPageIndex] && (
              <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg p-8 min-h-[600px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-700">
                    Sayfa {currentPageIndex + 1}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {editMode ? 'Düzenleme Modu Aktif' : 'Alan Seçim Modu'}
                  </span>
                </div>
                
                {editMode ? (
                  <RichTextEditor
                    content={editedPages[currentPageIndex] || pdfData.pages[currentPageIndex].text}
                    onChange={handlePageContentChange}
                    placeholder="Sayfa içeriğini düzenleyin..."
                  />
                ) : (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                      {editedPages[currentPageIndex] || pdfData.pages[currentPageIndex].text}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Klavye Kısayolları:</strong> ← Önceki Sayfa | → Sonraki Sayfa | 
              {editMode && ' Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+U: Underline'}
            </div>
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
