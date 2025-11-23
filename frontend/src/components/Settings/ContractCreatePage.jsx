import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Loader2, AlertCircle, Check, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';

const ContractCreatePage = ({ onBack, fromContracts = false, contractId = null, isEdit = false }) => {
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
    const init = async () => {
      const loadedTemplates = await fetchTemplates();
      
      if (isEdit && contractId) {
        await loadDraftContract(loadedTemplates);
      } else {
        await loadProjectDataIfNeeded();
      }
    };
    
    init();
  }, [contractId, isEdit]);

  const loadDraftContract = async (templatesArray) => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/${contractId}`);
      if (response.ok) {
        const draft = await response.json();
        console.log('📋 Loaded draft contract:', draft);
        
        // Set contract title
        setContractTitle(draft.contract_title);
        
        // Set field values
        setFieldValues(draft.field_values || {});
        
        // Find and set the template using the passed templates array
        const template = templatesArray.find(t => t.id === draft.template_id);
        if (template) {
          console.log('✅ Template found and set:', template.template_name);
          setSelectedTemplate(template);
        } else {
          console.error('❌ Template not found:', draft.template_id);
          alert('Şablon bulunamadı');
          if (onBack) onBack();
        }
      } else {
        console.error('❌ Failed to load draft contract');
        alert('Taslak yüklenemedi');
        if (onBack) onBack();
      }
    } catch (error) {
      console.error('Error loading draft contract:', error);
      alert('Bir hata oluştu');
      if (onBack) onBack();
    }
  };

  const loadProjectDataIfNeeded = async () => {
    // Check if projectId is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    
    if (!projectId) return;

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        console.log('📋 Loaded project data:', project);
        
        // Auto-fill fields from project data
        const autoFilledValues = {
          'firma_unvani': project.companyName || '',
          'firma_kisa_adi': project.companyName?.split(' ')[0] || '',
          'musteri_adi': project.customerName || '',
          'musteri_kisa_adi': project.customerName?.split(' ')[0] || '',
          'etkinlik_merkezi': project.fairName || '',
          'sozlesme_tarihi': project.contractDate || new Date().toISOString().split('T')[0],
          'tutar': project.contractAmount?.toString() || '',
          'doviz': project.currency || 'TRY',
          'sehir': project.city || '',
          'ulke': project.country || '',
          'fuar_baslangic': project.fairStartDate || '',
          'fuar_bitis': project.fairEndDate || ''
        };
        
        // Add payment terms if available
        if (project.paymentTerms && Array.isArray(project.paymentTerms)) {
          project.paymentTerms.forEach((term, index) => {
            const termNum = index + 1;
            
            // Try multiple possible field key formats
            const possibleKeys = [
              {
                percentage: `${termNum}_odeme`,
                amount: `${termNum}_odeme_tutari`,
                dueType: `${termNum}_odeme_vade`
              },
              {
                percentage: `f${termNum}_odeme`,
                amount: `f${termNum}_odeme_tutari`,
                dueType: `f${termNum}_odeme_vade`
              },
              {
                percentage: `odeme_${termNum}_yuzdesi`,
                amount: `odeme_${termNum}_tutari`,
                dueType: `odeme_${termNum}_vade`
              }
            ];
            
            // Use the first format for now, will be overwritten if template has different keys
            autoFilledValues[`${termNum}_odeme`] = term.percentage?.toString() || '';
            autoFilledValues[`${termNum}_odeme_tutari`] = term.amount?.toString() || '';
            autoFilledValues[`${termNum}_odeme_vade`] = term.dueType === 'pesin' ? 'Peşin' : 
                                                        term.dueType === 'kurulum' ? 'Kurulum' :
                                                        term.dueType === 'takip' ? `${term.dueDays} gün` :
                                                        term.dueType || '';
          });
          
          console.log('💰 Payment terms added to auto-fill');
        }
        
        console.log('✨ Auto-filled values:', autoFilledValues);
        setFieldValues(autoFilledValues);
        
        // Set contract title
        const title = `${project.customerName} - ${project.fairName} Sözleşmesi`;
        console.log('📝 Setting contract title:', title);
        setContractTitle(title);
      } else {
        console.error('❌ Failed to load project:', response.status);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  // Keyboard navigation for preview
  useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPreviewPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPreviewPageIndex((prev) => Math.min(updatedPages.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        setShowPreview(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreview, updatedPages]);

  const fetchTemplates = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contract-templates`);
      if (response.ok) {
        const data = await response.json();
        const loadedTemplates = data.templates || [];
        setTemplates(loadedTemplates);
        return loadedTemplates;
      } else {
        setError('Şablonlar yüklenemedi');
        return [];
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Bir hata oluştu');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!confirm(`"${templateName}" şablonunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contract-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local state
        setTemplates(templates.filter(t => t.id !== templateId));
        alert('✅ Şablon başarıyla silindi!');
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Şablon silinemedi'}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Bir hata oluştu: ' + error.message);
    }
  };

  const handleTemplateSelect = (template) => {
    console.log('🎯 Template selected:', template.template_name);
    setSelectedTemplate(template);
    
    // Initialize field values - preserve any auto-filled values from project data
    setFieldValues((prevValues) => {
      console.log('📦 Previous field values:', prevValues);
      const initialValues = {};
      template.fields.forEach((field) => {
        // Use existing value if available (from project data), otherwise empty string
        const value = prevValues[field.field_key] || '';
        initialValues[field.field_key] = value;
        if (value) {
          console.log(`  ✅ Kept value for ${field.field_key}: ${value}`);
        }
      });
      console.log('🔄 New field values:', initialValues);
      return initialValues;
    });
    
    // Update contract title if not already set from project
    if (contractTitle === 'Yeni Sözleşme') {
      setContractTitle(`${template.template_name} - ${new Date().toLocaleDateString('tr-TR')}`);
    }
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

  // Helper function to extract text from HTML
  const htmlToText = (html) => {
    if (!html) return '';
    
    // If it's already plain text (no HTML tags), return as is
    if (!html.includes('<')) return html;
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    } catch (error) {
      // Fallback: strip HTML tags with regex
      return html.replace(/<[^>]*>/g, '');
    }
  };

  // Update contract with field values (replace placeholders)
  const handleUpdateContract = () => {
    if (!validateForm()) return;

    try {
      // Always use original template pages, not previously updated ones
      const originalPages = selectedTemplate.pages;
      
      console.log('🔍 Debugging Template Update:');
      console.log('Original Pages:', originalPages);
      console.log('Template Fields:', selectedTemplate.fields);
      console.log('Field Values:', fieldValues);
      
      // Replace placeholders in each page
      const updated = originalPages.map((page, pageIndex) => {
        let updatedText = page.text;
        
        // If text is HTML, work with both HTML and plain text
        const isHTML = updatedText.includes('<');
        
        console.log(`📄 Page ${pageIndex + 1}:`);
        console.log(`   Is HTML: ${isHTML}`);
        console.log(`   Original (first 200 chars):`, updatedText.substring(0, 200));
        
        // Replace each field placeholder with its value
        selectedTemplate.fields.forEach((field) => {
          const placeholder = field.placeholder;
          const value = fieldValues[field.field_key] || '[DOLDURULMADI]';
          
          console.log(`🔄 Replacing "${placeholder}" with "${value}"`);
          
          // Try to find placeholder in both HTML and text
          const existsInOriginal = updatedText.includes(placeholder);
          console.log(`   Found in original: ${existsInOriginal}`);
          
          if (!existsInOriginal && isHTML) {
            // Try in plain text version
            const plainText = htmlToText(updatedText);
            console.log(`   Checking in plain text: ${plainText.includes(placeholder)}`);
          }
          
          // Escape special regex characters in placeholder
          const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPlaceholder, 'g');
          
          // Count occurrences before replace
          const beforeCount = (updatedText.match(regex) || []).length;
          
          // Perform replacement - works for both HTML and plain text
          updatedText = updatedText.replace(regex, value);
          
          const afterCount = (updatedText.match(regex) || []).length;
          console.log(`   Replaced ${beforeCount - afterCount} occurrences`);
        });
        
        console.log(`   Updated (first 200 chars):`, updatedText.substring(0, 200));
        
        return {
          ...page,
          text: updatedText
        };
      });
      
      setUpdatedPages(updated);
      console.log('✅ Final Updated Pages:', updated);
      
      // Count total replacements made
      const totalReplacements = selectedTemplate.fields.length;
      alert(`✅ ${totalReplacements} alan için güncelleme yapıldı! Console'u kontrol edin ve önizlemeye bakın.`);
    } catch (error) {
      console.error('❌ Error updating contract:', error);
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

  // Create and save contract
  const handleSaveDraft = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const userEmail = localStorage.getItem('userEmail') || 'demo@example.com';

      const draftData = {
        contract_title: contractTitle,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.template_name,
        field_values: fieldValues,
        status: 'draft',
        created_by: userEmail
      };

      const response = await fetch(`${backendUrl}/api/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Taslak başarıyla kaydedildi!');
        
        // Redirect back to contracts page
        if (onBack) {
          onBack();
        } else {
          window.location.href = '/contracts';
        }
      } else {
        const error = await response.json();
        alert(`❌ Hata: ${error.detail || 'Taslak kaydedilemedi'}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('❌ Bir hata oluştu');
    }
  };

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

      // Create contract (saves to DB and generates PDF)
      const response = await fetch(`${backendUrl}/api/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contract_title: contractTitle,
          template_id: selectedTemplate.id,
          field_values: fieldValues,
          status: 'active',
          created_by: 'mbucak@gmail.com' // TODO: Get from auth context
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Sözleşme başarıyla oluşturuldu!');
        
        // Redirect to contracts page
        if (fromContracts && onBack) {
          // Use onBack to navigate properly
          onBack();
        } else {
          // Stay on page, offer to download
          const downloadResponse = await fetch(`${backendUrl}/api/contracts/${data.contract_id}/pdf`);
          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${contractTitle}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }
      } else {
        const error = await response.json();
        alert(`Hata: ${error.detail || 'Sözleşme oluşturulamadı'}`);
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const renderFieldInput = (field) => {
    const commonClasses = "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent";
    
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

      <div className="max-w-4xl mx-auto">
        {!selectedTemplate ? (
          /* Template Selection */
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h1 className="text-lg font-bold text-gray-900 mb-4">
              Sözleşme Şablonu Seçin
            </h1>
            
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm mb-3">Henüz şablon oluşturulmamış</p>
                <button
                  onClick={onBack}
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700"
                >
                  Şablon Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="relative border border-gray-200 rounded-md p-3 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id, template.template_name);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Şablonu Sil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    {/* Template Card - Clickable */}
                    <div
                      onClick={() => handleTemplateSelect(template)}
                      className="cursor-pointer"
                    >
                      <FileText className="h-6 w-6 text-emerald-600 mb-2" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {template.template_name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {template.total_pages} sayfa
                      </p>
                      <p className="text-xs text-emerald-600">
                        {template.fields.length} alan
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Contract Form */
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-600 hover:text-gray-900 mb-1 text-xs"
                >
                  ← Şablon Değiştir
                </button>
                <h1 className="text-lg font-bold text-gray-900">
                  Yeni Sözleşme Oluştur
                </h1>
                <p className="text-gray-600 text-xs mt-0.5">
                  Şablon: {selectedTemplate.template_name}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Update Contract Button */}
                <button
                  onClick={handleUpdateContract}
                  className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    updatedPages 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {updatedPages ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Güncellendi
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Güncelle
                    </>
                  )}
                </button>

                {/* Preview Button */}
                <button
                  onClick={handlePreview}
                  disabled={!updatedPages}
                  className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium"
                >
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Önizle
                </button>

                {/* Generate Contract Button */}
                <button
                  onClick={handleGenerateContract}
                  disabled={generating || !updatedPages}
                  className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Sözleşme Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Contract Title */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sözleşme Başlığı
              </label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Sözleşme başlığı girin"
              />
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-3">
              {selectedTemplate.fields
                .sort((a, b) => a.order_index - b.order_index)
                .map((field) => (
                  <div key={field.field_key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {field.field_name}
                      {field.is_required && (
                        <span className="text-red-600 ml-0.5">*</span>
                      )}
                    </label>
                    {renderFieldInput(field)}
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {field.placeholder}
                    </p>
                  </div>
                ))}
            </div>

            {/* Action Buttons (bottom) */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              {/* Save Draft Button */}
              <button
                onClick={handleSaveDraft}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Kaydet (Taslak)
              </button>
              
              <button
                onClick={handleUpdateContract}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  updatedPages 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {updatedPages ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Bilgiler Güncellendi ✓
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Bilgileri Güncelle
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePreview}
                  disabled={!updatedPages}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Önizleme
                </button>

                <button
                  onClick={handleGenerateContract}
                  disabled={generating || !updatedPages}
                  className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Sözleşme Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Sözleşme Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && updatedPages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Sözleşme Önizleme</h2>
                  <p className="text-purple-100 mt-1">
                    Sayfa {previewPageIndex + 1} / {updatedPages.length}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setPreviewPageIndex(Math.max(0, previewPageIndex - 1))}
                  disabled={previewPageIndex === 0}
                  className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <span className="px-6 py-2 bg-white bg-opacity-20 rounded-lg font-semibold">
                  {previewPageIndex + 1} / {updatedPages.length}
                </span>
                
                <button
                  onClick={() => setPreviewPageIndex(Math.min(updatedPages.length - 1, previewPageIndex + 1))}
                  disabled={previewPageIndex === updatedPages.length - 1}
                  className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-8 bg-gray-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto min-h-[600px]">
                <div className="mb-4 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-700">
                    Sayfa {updatedPages[previewPageIndex].page_number}
                  </h3>
                </div>
                
                <div className="prose max-w-none">
                  {updatedPages[previewPageIndex].text.includes('<') ? (
                    // If HTML content, render as HTML
                    <div 
                      className="font-sans text-gray-800 leading-relaxed text-base"
                      dangerouslySetInnerHTML={{ __html: updatedPages[previewPageIndex].text }}
                    />
                  ) : (
                    // If plain text, render as pre
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                      {updatedPages[previewPageIndex].text}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 p-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                💡 <strong>İpucu:</strong> ← ve → ok tuşlarıyla sayfalar arası geçiş yapabilirsiniz
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Kapat
                </button>
                
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleGenerateContract();
                  }}
                  disabled={generating}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                >
                  Sözleşme Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractCreatePage;
