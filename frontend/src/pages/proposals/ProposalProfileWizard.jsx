import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProposalProfileWizard = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    profile_name: '',
    company_group_id: '',
    company_info: {
      name: '',
      address: '',
      city: '',
      country: 'TR',
      phone: '',
      email: '',
      website: '',
      tax_office: '',
      tax_number: ''
    },
    branding: {
      logo_url: '',
      primary_color: '#1a73e8',
      secondary_color: '#34a853',
      accent_color: '#fbbc04'
    },
    defaults: {
      page_orientation: 'portrait',
      currency: 'TRY',
      language: 'tr',
      validity_days: 30,
      payment_terms: ''
    },
    selected_modules: [],
    is_default: false
  });

  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [moduleContents, setModuleContents] = useState({});
  const [currentEditingModule, setCurrentEditingModule] = useState(null);
  const [editorStates, setEditorStates] = useState({});

  // Fetch companies and available modules on mount
  useEffect(() => {
    fetchCompanies();
    fetchAvailableModules();
    if (profileId) {
      fetchProfile(profileId);
    }
  }, [profileId]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/group-companies?user_id=demo-user`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAvailableModules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/proposal-modules/available`);
      if (response.ok) {
        const data = await response.json();
        setAvailableModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Modüller yüklenemedi');
    }
  };

  const fetchProfile = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/proposal-profiles/${id}`);
      if (response.ok) {
        const profile = await response.json();
        setFormData(profile);
        
        // Extract selected module IDs
        const moduleIds = profile.selected_modules?.map(m => m.module_type) || [];
        setSelectedModuleIds(moduleIds);
        
        // Extract module contents
        const contents = {};
        profile.selected_modules?.forEach(module => {
          contents[module.module_type] = module.content_template;
        });
        setModuleContents(contents);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (companyId) => {
    setFormData(prev => ({ ...prev, company_group_id: companyId }));
    
    // Auto-fill company info
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setFormData(prev => ({
        ...prev,
        company_info: {
          name: company.companyName || company.name || '',
          address: company.address || '',
          city: company.city || '',
          country: company.country || 'TR',
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          tax_office: company.taxOffice || '',
          tax_number: company.taxNo || company.vatNo || ''
        }
      }));
    }
  };

  const handleModuleToggle = (moduleType) => {
    setSelectedModuleIds(prev => {
      if (prev.includes(moduleType)) {
        return prev.filter(id => id !== moduleType);
      } else {
        return [...prev, moduleType];
      }
    });
  };

  const handleModuleContentChange = (moduleType, field, value) => {
    setModuleContents(prev => ({
      ...prev,
      [moduleType]: {
        ...(prev[moduleType] || {}),
        [field]: value
      }
    }));
  };

  const handleEditorChange = (moduleType, editorState) => {
    setEditorStates(prev => ({
      ...prev,
      [moduleType]: editorState
    }));
    
    // Convert to HTML and save
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    handleModuleContentChange(moduleType, 'body', html);
  };

  const getEditorState = (moduleType) => {
    if (editorStates[moduleType]) {
      return editorStates[moduleType];
    }
    
    // Initialize from existing content
    const content = moduleContents[moduleType]?.body || '';
    if (content) {
      const contentBlock = htmlToDraft(content);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        return EditorState.createWithContent(contentState);
      }
    }
    
    return EditorState.createEmpty();
  };

  const validateStep1 = () => {
    if (!formData.profile_name.trim()) {
      toast.error('Profil adı gerekli');
      return false;
    }
    if (!formData.company_group_id) {
      toast.error('Lütfen bir şirket seçin');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedModuleIds.length === 0) {
      toast.error('En az bir modül seçmelisiniz');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    if (currentStep === 2) {
      // Start editing first module
      const firstModule = selectedModuleIds[0];
      setCurrentEditingModule(firstModule);
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Prepare selected_modules with content
      const selected_modules = selectedModuleIds.map((moduleType, index) => {
        const moduleInfo = availableModules.find(m => m.module_type === moduleType);
        const content = moduleContents[moduleType] || { title: '', body: '', sections: [], images: [], variables: [] };
        
        return {
          module_id: moduleInfo?.module_id || moduleType,
          module_name: moduleInfo?.module_name || moduleType,
          module_type: moduleType,
          display_order: index,
          is_active: true,
          content_template: content
        };
      });

      const payload = {
        ...formData,
        user_id: 'demo-user',
        selected_modules
      };

      const url = profileId 
        ? `${API_URL}/api/proposal-profiles/${profileId}`
        : `${API_URL}/api/proposal-profiles`;
      
      const method = profileId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(profileId ? 'Profil güncellendi' : 'Profil oluşturuldu');
        navigate('/proposals/profiles');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Kaydetme başarısız');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Temel Bilgiler' },
      { num: 2, label: 'Modül Seçimi' },
      { num: 3, label: 'Modül İçerikleri' },
      { num: 4, label: 'Önizleme' }
    ];

    return (
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${currentStep >= step.num ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step.num}
              </div>
              <p className="text-sm mt-2 text-gray-700">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 ${currentStep > step.num ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 mb-3">Temel Bilgiler</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Profil Adı *</label>
          <input
            type="text"
            value={formData.profile_name}
            onChange={(e) => setFormData(prev => ({ ...prev, profile_name: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Fuar Teklifleri - Modern"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Şirket Seçin *</label>
          <select
            value={formData.company_group_id}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Şirket seçin...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.companyName || company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, logo_url: reader.result }
                  }));
                  toast.success('Logo yüklendi');
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full px-2 py-1 text-xs border rounded"
          />
          {formData.branding.logo_url && (
            <img 
              src={formData.branding.logo_url} 
              alt="Logo" 
              className="h-10 object-contain border rounded p-1 mt-1"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ana Renk</label>
          <input
            type="color"
            value={formData.branding.primary_color}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, primary_color: e.target.value }
            }))}
            className="w-full h-8 px-1 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sayfa Yönü</label>
          <select
            value={formData.defaults.page_orientation}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, page_orientation: e.target.value }
            }))}
            className="w-full px-3 py-1.5 text-sm border rounded"
          >
            <option value="portrait">Dikey</option>
            <option value="landscape">Yatay</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Para Birimi</label>
          <select
            value={formData.defaults.currency}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, currency: e.target.value }
            }))}
            className="w-full px-3 py-1.5 text-sm border rounded"
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">İkincil Renk</label>
          <input
            type="color"
            value={formData.branding.secondary_color}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, secondary_color: e.target.value }
            }))}
            className="w-full h-8 px-1 border rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Geçerlilik</label>
          <input
            type="number"
            value={formData.defaults.validity_days}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, validity_days: parseInt(e.target.value) || 30 }
            }))}
            className="w-full px-3 py-1.5 text-sm border rounded"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-900">Modül Seçimi</h2>
        <span className="text-xs text-gray-500">{selectedModuleIds.length} seçildi</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {availableModules.map((module) => (
          <div
            key={module.module_id}
            onClick={() => handleModuleToggle(module.module_type)}
            className={`p-2 border rounded cursor-pointer transition-all text-sm
              ${selectedModuleIds.includes(module.module_type) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={selectedModuleIds.includes(module.module_type)}
                onChange={() => {}}
                className="mt-0.5 mr-2"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="text-lg mr-1">{module.icon}</span>
                  <h3 className="font-medium text-gray-900 text-xs truncate">{module.module_name}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{module.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedModulesList = availableModules.filter(m => 
      selectedModuleIds.includes(m.module_type)
    );

    if (!currentEditingModule && selectedModulesList.length > 0) {
      setCurrentEditingModule(selectedModulesList[0].module_type);
    }

    const currentModule = availableModules.find(m => m.module_type === currentEditingModule);
    const currentContent = moduleContents[currentEditingModule] || { title: '', body: '', sections: [], images: [], variables: [] };

    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Modül İçerikleri</h2>
        
        <div className="flex space-x-3">
          {/* Module list sidebar */}
          <div className="w-48 space-y-1">
            {selectedModulesList.map((module) => (
              <button
                key={module.module_type}
                onClick={() => setCurrentEditingModule(module.module_type)}
                className={`w-full text-left px-2 py-2 rounded text-xs transition-colors
                  ${currentEditingModule === module.module_type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
              >
                <div className="flex items-center">
                  <span className="mr-1.5 text-sm">{module.icon}</span>
                  <span className="font-medium truncate">{module.module_name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Content editor */}
          <div className="flex-1 space-y-4">
            {currentModule && (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{currentModule.icon}</span>
                  <h3 className="text-xl font-semibold">{currentModule.module_name}</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    value={currentContent.title}
                    onChange={(e) => handleModuleContentChange(currentEditingModule, 'title', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Modül başlığı..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                  <div className="border rounded-lg bg-white" style={{ minHeight: '400px' }}>
                    <Editor
                      editorState={getEditorState(currentEditingModule)}
                      onEditorStateChange={(editorState) => handleEditorChange(currentEditingModule, editorState)}
                      wrapperClassName="wrapper-class"
                      editorClassName="editor-class px-4 py-2"
                      toolbarClassName="toolbar-class"
                      placeholder="Modül içeriğini buraya yazın... Bold, italic, resim ekleyebilirsiniz."
                      toolbar={{
                        options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'image', 'history'],
                        inline: {
                          options: ['bold', 'italic', 'underline']
                        },
                        blockType: {
                          inDropdown: true,
                          options: ['Normal', 'H1', 'H2', 'H3']
                        },
                        list: {
                          inDropdown: false,
                          options: ['unordered', 'ordered']
                        },
                        textAlign: {
                          inDropdown: false,
                          options: ['left', 'center', 'right']
                        },
                        link: {
                          inDropdown: false,
                          options: ['link']
                        },
                        image: {
                          uploadEnabled: true,
                          uploadCallback: (file) => {
                            return new Promise((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                resolve({ data: { link: reader.result } });
                              };
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });
                          },
                          alt: { present: true, mandatory: false }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>Değişkenler:</strong> Metne <code className="bg-gray-100 px-1 rounded">{'{{firma_adı}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{fuar_adı}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{tarih}}'}</code> gibi değişkenler ekleyebilirsiniz.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Değişkenler:</strong> {'{{'}firma_adı{'}}'}, {'{{'}fuar_adı{'}}'}, {'{{'}tarih{'}}'}, {'{{'}ülke{'}}'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Önizleme ve Kaydet</h2>
      
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Profil Adı:</p>
              <p className="font-medium">{formData.profile_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Şirket:</p>
              <p className="font-medium">{formData.company_info.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Para Birimi:</p>
              <p className="font-medium">{formData.defaults.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Geçerlilik:</p>
              <p className="font-medium">{formData.defaults.validity_days} gün</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Seçilen Modüller ({selectedModuleIds.length})</h3>
          <div className="mt-2 space-y-2">
            {selectedModuleIds.map(moduleType => {
              const module = availableModules.find(m => m.module_type === moduleType);
              return (
                <div key={moduleType} className="flex items-center space-x-2 text-sm">
                  <span>{module?.icon}</span>
                  <span>{module?.module_name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Renk Paleti</h3>
          <div className="mt-2 flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: formData.branding.primary_color }} />
              <span className="text-sm">Ana</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: formData.branding.secondary_color }} />
              <span className="text-sm">İkincil</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: formData.branding.accent_color }} />
              <span className="text-sm">Vurgu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/proposals/profiles'}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Geri
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {profileId ? 'Profil Düzenle' : 'Yeni Profil'}
            </h1>
          </div>
          {/* Compact Step Indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step ? 'bg-blue-500 text-white' : 
                currentStep > step ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5 mb-3">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded text-sm font-medium ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Önceki
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
            >
              Sonraki
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Kaydediliyor...' : (profileId ? 'Güncelle' : 'Kaydet')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalProfileWizard;
