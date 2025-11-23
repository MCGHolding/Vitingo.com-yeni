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
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'text',
    is_required: true,
    dropdown_options: ''
  });
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [replaceAllOccurrences, setReplaceAllOccurrences] = useState(true);
  
  // Undo/Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
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
  }, [currentPageIndex, pdfData, showPopup, historyIndex, history]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!pdfData) return;
    
    const autoSaveInterval = setInterval(() => {
      // Only auto-save if there are changes
      if (Object.keys(editedPages).length > 0 || fields.length > 0) {
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
          console.log('📝 Otomatik taslak kaydedildi');
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [editedPages, fields, currentPageIndex, file, pdfData]);

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

  const handleTextSelect = (e) => {
    // Small delay to let selection settle (especially in TipTap editor)
    setTimeout(() => {
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
    }, 100);
  };

  const handleAddField = () => {
    if (!fieldForm.field_name.trim()) {
      alert('Alan adı gereklidir');
      return;
    }

    const fieldKey = fieldForm.field_name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_');
    const placeholder = `{{${fieldKey}}}`;

    const newField = {
      id: Date.now(),
      field_name: fieldForm.field_name,
      field_key: fieldKey,
      field_type: fieldForm.field_type,
      is_required: fieldForm.is_required,
      dropdown_options: fieldForm.field_type === 'dropdown' 
        ? fieldForm.dropdown_options.split(',').map(opt => opt.trim()).filter(opt => opt)
        : null,
      selected_text: selectedText,
      placeholder: placeholder
    };

    const updatedFields = [...fields, newField];
    
    // IMPORTANT: Replace selected text with placeholder
    let totalReplacements = 0;
    const newEditedPages = {};
    
    if (replaceAllOccurrences) {
      // Replace in ALL pages
      pdfData.pages.forEach((page, pageIndex) => {
        const currentText = editedPages[pageIndex] || page.text;
        
        // Count occurrences
        const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = currentText.match(regex);
        const count = matches ? matches.length : 0;
        
        if (count > 0) {
          // Replace all occurrences
          const updatedText = currentText.replace(regex, placeholder);
          newEditedPages[pageIndex] = updatedText;
          totalReplacements += count;
          
          console.log(`📄 Page ${pageIndex + 1}: Replaced ${count} occurrences`);
        } else {
          // Keep existing or original
          if (editedPages[pageIndex]) {
            newEditedPages[pageIndex] = editedPages[pageIndex];
          }
        }
      });
      
      console.log(`✅ Total replacements: ${totalReplacements} across all pages`);
    } else {
      // Replace only in current page
      const currentText = editedPages[currentPageIndex] || pdfData.pages[currentPageIndex].text;
      const updatedText = currentText.replace(selectedText, placeholder);
      newEditedPages[currentPageIndex] = updatedText;
      totalReplacements = 1;
      
      console.log(`✅ Replaced in current page only`);
    }
    
    // Merge with existing editedPages
    const finalEditedPages = {
      ...editedPages,
      ...newEditedPages
    };
    
    setEditedPages(finalEditedPages);
    setFields(updatedFields);
    
    // Add to history
    addToHistory(updatedFields, finalEditedPages);
    
    // Force re-render
    setRefreshKey(prev => prev + 1);
    
    setShowPopup(false);
    setSelectedText(null);
    
    // Clear selection
    window.getSelection().removeAllRanges();
    
    // Show success message
    setTimeout(() => {
      if (replaceAllOccurrences) {
        alert(`✅ Alan eklendi!\n\n"${selectedText}" → ${placeholder}\n\n${totalReplacements} yerde değiştirildi (tüm sayfalarda)`);
      } else {
        alert(`✅ Alan eklendi!\n\n"${selectedText}" → ${placeholder}\n\nSadece bu sayfada değiştirildi`);
      }
    }, 100);
  };

  const handleRemoveField = (fieldId) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFields(updatedFields);
    
    // Add to history
    addToHistory(updatedFields, editedPages);
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
    const updatedPages = {
      ...editedPages,
      [currentPageIndex]: newContent
    };
    setEditedPages(updatedPages);
    
    // Add to history (debounced to avoid too many history entries)
    // We'll add it on blur or after a delay
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

  // Add state to history
  const addToHistory = (newFields, newEditedPages) => {
    const newState = {
      fields: JSON.parse(JSON.stringify(newFields)), // Deep copy
      editedPages: JSON.parse(JSON.stringify(newEditedPages))
    };
    
    // Remove future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log(`📝 History added. Total: ${newHistory.length}, Index: ${newHistory.length - 1}`);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFields(prevState.fields);
      setEditedPages(prevState.editedPages);
      setHistoryIndex(historyIndex - 1);
      setRefreshKey(prev => prev + 1);
      
      console.log(`↩️ Undo. Index: ${historyIndex - 1}/${history.length}`);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setFields(nextState.fields);
      setEditedPages(nextState.editedPages);
      setHistoryIndex(historyIndex + 1);
      setRefreshKey(prev => prev + 1);
      
      console.log(`↪️ Redo. Index: ${historyIndex + 1}/${history.length}`);
    }
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

              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Geri Al (Ctrl+Z)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="İleri Al (Ctrl+Y)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
                <span className="text-xs text-gray-500 ml-1">
                  {historyIndex + 1}/{history.length}
                </span>
              </div>

              {/* Edit Mode Toggle */}
              <button
                onClick={toggleEditMode}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  editMode 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Görüntüleme Modu
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Düzenleme Modu
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
          onMouseUp={handleTextSelect}
        >
          <div className="max-w-6xl mx-auto p-8">
            {/* Info Banners */}
            <div className="space-y-3 mb-4">
              {!editMode && (
                <div className="text-sm text-gray-600 bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">👆</span>
                    <div>
                      <strong className="text-blue-900">Görüntüleme Modu:</strong> Metinde fareyle seçim yapın ve popup'tan alan tanımlayın. 
                      <br />
                      💡 Metin düzenlemek için "Düzenleme Modu" butonuna tıklayın.
                    </div>
                  </div>
                </div>
              )}

              {editMode && (
                <div className="text-sm text-gray-600 bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">✏️</span>
                    <div>
                      <strong className="text-green-900">Düzenleme Modu Aktif:</strong> 
                      <ul className="mt-2 ml-4 space-y-1">
                        <li>✅ Bold, italic, renk, resim ekleme yapabilirsiniz</li>
                        <li>✅ Editör dışındaki metinde alan seçebilirsiniz</li>
                        <li>✅ Düzenledikçe otomatik kaydedilir (30 sn)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Draft Status */}
              {(Object.keys(editedPages).length > 0 || fields.length > 0) && (
                <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Kaydedilmemiş Değişiklikler:</strong> {Object.keys(editedPages).length} sayfa düzenlendi, {fields.length} alan eklendi
                    </span>
                  </div>
                  <span className="text-xs text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
                    Otomatik kayıt: Her 30 saniyede
                  </span>
                </div>
              )}
            </div>

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
                    key={`editor-${currentPageIndex}-${refreshKey}`}
                    content={editedPages[currentPageIndex] || pdfData.pages[currentPageIndex].text}
                    onChange={handlePageContentChange}
                    onTextSelect={handleTextSelect}
                    placeholder="Sayfa içeriğini düzenleyin..."
                  />
                ) : (
                  <div key={`view-${currentPageIndex}-${refreshKey}`} className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                      {editedPages[currentPageIndex] || pdfData.pages[currentPageIndex].text}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Klavye Kısayolları:</strong> 
              <span className="ml-2">Ctrl+Z: Geri Al</span> | 
              <span className="ml-2">Ctrl+Y: İleri Al</span> | 
              <span className="ml-2">← Önceki Sayfa</span> | 
              <span className="ml-2">→ Sonraki Sayfa</span>
              {editMode && ' | Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+U: Underline'}
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
                <div key={field.field_key} className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:border-gray-300 transition-all group">
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
                      onClick={() => {
                        if (confirm(`"${field.field_name}" alanını silmek istediğinizden emin misiniz?`)) {
                          handleRemoveField(field.field_key);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all text-xs font-medium opacity-0 group-hover:opacity-100"
                      title="Alanı Sil"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Sil</span>
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
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alan Adı * 
                {fields.length > 0 && (
                  <span className="text-[10px] text-gray-500 ml-1">(Daha önce tanımlanmış alanlar)</span>
                )}
              </label>
              <input
                type="text"
                value={fieldForm.field_name}
                onChange={(e) => {
                  setFieldForm({...fieldForm, field_name: e.target.value});
                  setShowFieldSuggestions(e.target.value.length > 0 && fields.length > 0);
                }}
                onFocus={() => setShowFieldSuggestions(fieldForm.field_name.length > 0 && fields.length > 0)}
                placeholder="Örnek: Müşteri Adı"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              
              {/* Autocomplete Dropdown */}
              {showFieldSuggestions && fields.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                  {fields
                    .filter(f => f.field_name.toLowerCase().includes(fieldForm.field_name.toLowerCase()))
                    .slice(0, 5)
                    .map((field, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFieldForm({
                            field_name: field.field_name,
                            field_type: field.field_type,
                            is_required: field.is_required,
                            dropdown_options: field.dropdown_options?.join(', ') || ''
                          });
                          setShowFieldSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{field.field_name}</div>
                        <div className="text-xs text-gray-500">
                          {field.field_type} • {field.placeholder}
                        </div>
                      </button>
                    ))}
                  {fields.filter(f => f.field_name.toLowerCase().includes(fieldForm.field_name.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">Eşleşen alan yok</div>
                  )}
                </div>
              )}
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

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={fieldForm.is_required}
                  onChange={(e) => setFieldForm({...fieldForm, is_required: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Zorunlu alan</label>
              </div>
              
              <div className="flex items-center bg-yellow-50 p-2 rounded border border-yellow-200">
                <input
                  type="checkbox"
                  checked={replaceAllOccurrences}
                  onChange={(e) => setReplaceAllOccurrences(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 rounded"
                />
                <label className="ml-2 text-xs text-gray-700">
                  <span className="font-semibold">Tüm sayfalarda değiştir</span>
                  <br />
                  <span className="text-[10px] text-gray-600">
                    Bu metni sözleşmenin her yerinde placeholder ile değiştirir
                  </span>
                </label>
              </div>
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
