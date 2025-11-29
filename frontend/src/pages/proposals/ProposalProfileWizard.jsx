import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import CoverPageCanvasDesigner from './CoverPageCanvasDesigner';
import { Sparkles, Upload, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Hazır Renk Paletleri
const COLOR_PALETTES = [
  { id: 'modern', name: 'Modern Mavi', primary: '#1a73e8', secondary: '#34a853', accent: '#fbbc04' },
  { id: 'professional', name: 'Profesyonel Lacivert', primary: '#1e40af', secondary: '#0891b2', accent: '#f59e0b' },
  { id: 'elegant', name: 'Zarif Mor', primary: '#7c3aed', secondary: '#a78bfa', accent: '#fbbf24' },
  { id: 'warm', name: 'Sıcak Turuncu', primary: '#ea580c', secondary: '#fb923c', accent: '#fde047' },
  { id: 'fresh', name: 'Taze Yeşil', primary: '#059669', secondary: '#10b981', accent: '#fcd34d' },
  { id: 'classic', name: 'Klasik Gri', primary: '#475569', secondary: '#64748b', accent: '#f59e0b' },
  { id: 'bold', name: 'Cesur Kırmızı', primary: '#dc2626', secondary: '#ef4444', accent: '#facc15' },
  { id: 'cool', name: 'Serin Cyan', primary: '#0891b2', secondary: '#06b6d4', accent: '#fde68a' },
  { id: 'royal', name: 'Kraliyet Mavisi', primary: '#1e3a8a', secondary: '#3b82f6', accent: '#fbbf24' },
  { id: 'nature', name: 'Doğa Yeşili', primary: '#15803d', secondary: '#22c55e', accent: '#fde047' }
];

// Dünya Para Birimleri
const CURRENCIES = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'Amerikan Doları', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
  { code: 'JPY', name: 'Japon Yeni', symbol: '¥' },
  { code: 'CNY', name: 'Çin Yuanı', symbol: '¥' },
  { code: 'CHF', name: 'İsviçre Frangı', symbol: 'Fr' },
  { code: 'CAD', name: 'Kanada Doları', symbol: 'C$' },
  { code: 'AUD', name: 'Avustralya Doları', symbol: 'A$' },
  { code: 'NZD', name: 'Yeni Zelanda Doları', symbol: 'NZ$' },
  { code: 'SEK', name: 'İsveç Kronu', symbol: 'kr' },
  { code: 'NOK', name: 'Norveç Kronu', symbol: 'kr' },
  { code: 'DKK', name: 'Danimarka Kronu', symbol: 'kr' },
  { code: 'PLN', name: 'Polonya Zlotisi', symbol: 'zł' },
  { code: 'RUB', name: 'Rus Rublesi', symbol: '₽' },
  { code: 'INR', name: 'Hint Rupisi', symbol: '₹' },
  { code: 'BRL', name: 'Brezilya Reali', symbol: 'R$' },
  { code: 'ZAR', name: 'Güney Afrika Randı', symbol: 'R' },
  { code: 'MXN', name: 'Meksika Pesosu', symbol: 'Mex$' },
  { code: 'SGD', name: 'Singapur Doları', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Doları', symbol: 'HK$' },
  { code: 'KRW', name: 'Güney Kore Wonu', symbol: '₩' },
  { code: 'THB', name: 'Tayland Bahtı', symbol: '฿' },
  { code: 'MYR', name: 'Malezya Ringgiti', symbol: 'RM' },
  { code: 'IDR', name: 'Endonezya Rupisi', symbol: 'Rp' },
  { code: 'AED', name: 'BAE Dirhemi', symbol: 'د.إ' },
  { code: 'SAR', name: 'Suudi Arabistan Riyali', symbol: '﷼' }
];

const ProposalProfileWizard = ({ profileId }) => {
  // Get profileId from URL if not passed as prop
  const urlProfileId = profileId || (() => {
    const path = window.location.pathname;
    const match = path.match(/\/proposals\/profiles\/edit\/(.+)/);
    return match ? match[1] : null;
  })();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState('modern');
  const [showCoverImagePreview, setShowCoverImagePreview] = useState(false);
  const [showCanvasPreview, setShowCanvasPreview] = useState(false);
  const [showModulePreview, setShowModulePreview] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);

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
  const [showCoverDesigner, setShowCoverDesigner] = useState(false);

  // Fetch companies and available modules on mount
  useEffect(() => {
    fetchCompanies();
    fetchAvailableModules();
    if (urlProfileId) {
      fetchProfile(urlProfileId);
    }
  }, [urlProfileId]);

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

  const handlePaletteChange = (paletteId) => {
    setSelectedPalette(paletteId);
    const palette = COLOR_PALETTES.find(p => p.id === paletteId);
    if (palette) {
      setFormData(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          primary_color: palette.primary,
          secondary_color: palette.secondary,
          accent_color: palette.accent
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

      // DEBUG: Check entire moduleContents state
      console.log('💾 SAVING PROFILE - moduleContents:', JSON.stringify(moduleContents, null, 2));
      console.log('📋 Selected module IDs:', selectedModuleIds);

      // Prepare selected_modules with content
      const selected_modules = selectedModuleIds.map((moduleType, index) => {
        const moduleInfo = availableModules.find(m => m.module_type === moduleType);
        const content = moduleContents[moduleType] || { title: '', body: '', sections: [], images: [], variables: [] };
        
        // Debug: Check if canvas_template exists for cover_page
        if (moduleType === 'cover_page') {
          console.log('🔍 Cover Page Content from state:', JSON.stringify(content, null, 2));
          console.log('🔍 Content keys:', Object.keys(content));
          console.log('🔍 Content type:', content.type);
          console.log('🔍 Has canvas_template:', 'canvas_template' in content);
          console.log('🔍 Has cover_image:', 'cover_image' in content);
          
          if (content.canvas_template) {
            console.log('✅ Canvas template found!', {
              selectedTemplate: content.canvas_template.selectedTemplate,
              elementsCount: content.canvas_template.elements?.length
            });
          } else if (content.cover_image) {
            console.log('✅ Cover image found! Length:', content.cover_image.length);
          } else {
            console.warn('⚠️ NO canvas_template OR cover_image in cover_page content!');
            console.warn('⚠️ This means Canvas Designer / Image Upload did NOT update state!');
          }
        }
        
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

      console.log('🚀 SENDING TO BACKEND:', {
        url: urlProfileId ? 'UPDATE' : 'CREATE',
        modulesCount: selected_modules.length,
        coverPageModule: selected_modules.find(m => m.module_type === 'cover_page')
      });
      
      // Log the actual payload (but truncate images for readability)
      const logPayload = JSON.parse(JSON.stringify(payload));
      if (logPayload.selected_modules) {
        logPayload.selected_modules.forEach(mod => {
          if (mod.content_template?.cover_image) {
            const imgLength = mod.content_template.cover_image.length;
            mod.content_template.cover_image = `[IMAGE DATA - ${imgLength} chars]`;
          }
        });
      }
      console.log('🚀 Payload (images truncated):', JSON.stringify(logPayload, null, 2));

      const url = urlProfileId 
        ? `${API_URL}/api/proposal-profiles/${urlProfileId}`
        : `${API_URL}/api/proposal-profiles`;
      
      const method = urlProfileId ? 'PUT' : 'POST';

      console.log('🚀 Making request to:', url, 'method:', method);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Backend response status:', response.status);

      if (response.ok) {
        toast.success(urlProfileId ? 'Profil güncellendi' : 'Profil oluşturuldu');
        window.location.href = '/proposals/profiles';
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
          <label className="block text-xs font-medium text-gray-700 mb-1">Renk Paleti</label>
          <select
            value={selectedPalette}
            onChange={(e) => handlePaletteChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded"
          >
            {COLOR_PALETTES.map(palette => (
              <option key={palette.id} value={palette.id}>
                {palette.name}
              </option>
            ))}
          </select>
          <div className="flex space-x-1 mt-1">
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: formData.branding.primary_color }} title="Ana Renk" />
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: formData.branding.secondary_color }} title="İkincil Renk" />
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: formData.branding.accent_color }} title="Vurgu Rengi" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
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

  // Auto-show previews when cover_page module is selected
  useEffect(() => {
    if (currentEditingModule === 'cover_page' && moduleContents['cover_page']) {
      if (moduleContents['cover_page'].canvas_template) {
        setShowCanvasPreview(true);
      }
      if (moduleContents['cover_page'].cover_image) {
        setShowCoverImagePreview(true);
      }
    }
  }, [currentEditingModule, moduleContents]);

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
              <div key={module.module_type} className="relative">
                <button
                  onClick={() => setCurrentEditingModule(module.module_type)}
                  className={`w-full text-left px-2 py-2 rounded text-xs transition-colors
                    ${currentEditingModule === module.module_type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-1.5 text-sm">{module.icon}</span>
                      <span className="font-medium truncate">{module.module_name}</span>
                    </div>
                    {/* Preview icon for cover page */}
                    {module.module_type === 'cover_page' && (moduleContents[module.module_type]?.canvas_template || moduleContents[module.module_type]?.cover_image) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModule(module.module_type);
                          setShowModulePreview(true);
                        }}
                        className="ml-2 p-1 hover:bg-blue-600 rounded"
                        title="Önizleme"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Content editor */}
          <div className="flex-1 space-y-2">
            {currentModule && (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{currentModule.icon}</span>
                  <h3 className="text-sm font-semibold">{currentModule.module_name}</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    value={currentContent.title}
                    onChange={(e) => handleModuleContentChange(currentEditingModule, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                    placeholder="Modül başlığı..."
                  />
                </div>

                {/* Cover Page Options for Cover Page Module */}
                {currentEditingModule === 'cover_page' && (
                  <div className="mb-3 space-y-2">
                    {/* Option 1: Canvas Designer */}
                    <button
                      onClick={() => setShowCoverDesigner(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition flex items-center justify-center space-x-2 font-medium"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Hazır Şablonlar Kullanarak Kapak Sayfası Oluştur</span>
                    </button>
                    
                    {/* Option 2: Upload Image */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        className="hidden"
                        id="cover-image-upload"
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition flex items-center justify-center space-x-2 font-medium cursor-pointer"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Kendi Kapak Resmini Yükle</span>
                      </label>
                    </div>
                    
                    {/* Show uploaded image status and preview toggle */}
                    {currentContent.cover_image && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-green-700 font-medium">✅ Kapak resmi yüklendi</span>
                          </div>
                          <button
                            onClick={() => handleModuleContentChange(currentEditingModule, 'cover_image', null)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Checkbox to show/hide preview */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showCoverImagePreview}
                            onChange={(e) => setShowCoverImagePreview(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">Yüklenen Dosyayı Gör</span>
                        </label>
                        
                        {/* Image preview (expandable) */}
                        {showCoverImagePreview && (
                          <div className="relative border-2 border-green-300 rounded-lg overflow-hidden bg-gray-50">
                            <img 
                              src={currentContent.cover_image} 
                              alt="Cover Preview" 
                              className="w-full object-contain"
                              style={{ maxHeight: '600px' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Canvas Designer Preview */}
                    {currentContent.canvas_template && currentContent.canvas_template.customBackgroundImage && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700 font-medium">✅ Kapak sayfası tasarımı hazır</span>
                          </div>
                          <button
                            onClick={() => setShowCoverDesigner(true)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            ✏️ Düzenle
                          </button>
                        </div>
                        
                        {/* Canvas preview - ALWAYS VISIBLE */}
                        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          {(() => {
                            const customBg = currentContent.canvas_template.customBackgroundImage;
                            
                            const bgStyle = {
                              width: '100%',
                              maxWidth: '450px',
                              aspectRatio: '794 / 1123',
                              position: 'relative',
                              backgroundColor: '#ffffff',
                              margin: '0 auto',
                              ...(customBg ? {
                                backgroundImage: `url(${customBg})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              } : {})
                            };
                            
                            return (
                              <div style={bgStyle}>
                                {/* Render elements */}
                                {currentContent.canvas_template.elements && currentContent.canvas_template.elements.map((element, idx) => {
                                  const scale = 450 / 794;
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${element.x * scale}px`,
                                        top: `${element.y * scale}px`,
                                        fontSize: `${(element.fontSize || 24) * scale}px`,
                                        fontFamily: element.fontFamily || 'Inter',
                                        fontWeight: element.fontWeight || 'normal',
                                        fontStyle: element.fontStyle || 'normal',
                                        textDecoration: element.textDecoration || 'none',
                                        color: element.color || '#000000',
                                        textAlign: element.textAlign || 'left',
                                        zIndex: 10
                                      }}
                                    >
                                      {element.variable}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Element list */}
                        <div className="text-xs text-gray-500">
                          {currentContent.canvas_template.elements?.length || 0} element eklenmiş
                        </div>
                      </div>
                    )}
                    
                    {!currentContent.cover_image && !currentContent.canvas_template?.customBackgroundImage && (
                      <p className="text-xs text-gray-500 text-center">
                        Canvas tasarımı veya kendi resminizi yükleyin
                      </p>
                    )}
                  </div>
                )}

                {/* Content editor - hide for cover_page module */}
                {currentEditingModule !== 'cover_page' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">İçerik</label>
                    <div className="border rounded bg-white" style={{ minHeight: '280px' }}>
                      <Editor
                        editorState={getEditorState(currentEditingModule)}
                        onEditorStateChange={(editorState) => handleEditorChange(currentEditingModule, editorState)}
                        wrapperClassName="wrapper-class"
                        editorClassName="editor-class px-2 py-1 text-sm"
                        toolbarClassName="toolbar-class text-xs"
                        placeholder="İçerik yazın..."
                        toolbar={{
                          options: ['inline', 'list', 'textAlign', 'link', 'image'],
                          inline: {
                            options: ['bold', 'italic', 'underline']
                          },
                          list: {
                            inDropdown: false,
                            options: ['unordered', 'ordered']
                          },
                          textAlign: {
                            inDropdown: false,
                            options: ['left', 'center']
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
                            alt: { present: false, mandatory: false }
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Değişkenler: <code className="bg-gray-50 px-1">{'{{firma_adı}}'}</code>, <code className="bg-gray-50 px-1">{'{{tarih}}'}</code>
                    </p>
                  </div>
                )}

                {/* Variables info - hide for cover_page */}
                {currentEditingModule !== 'cover_page' && (
                  <div className="mt-8 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Değişkenler:</strong> {'{{'}firma_adı{'}}'}, {'{{'}fuar_adı{'}}'}, {'{{'}tarih{'}}'}, {'{{'}ülke{'}}'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Module Preview Modal */}
        {showModulePreview && previewModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Kapak Sayfası Önizlemesi</h2>
                <button
                  onClick={() => setShowModulePreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Preview Content */}
              {(() => {
                const content = moduleContents[previewModule];
                if (!content) return null;

                // Canvas design
                if (content.canvas_template) {
                  const canvas = content.canvas_template;
                  return (
                    <div 
                      className="relative mx-auto bg-white shadow-xl"
                      style={{ 
                        width: '595px',
                        height: '842px',
                        maxWidth: '100%',
                        backgroundImage: canvas.customBackgroundImage ? `url(${canvas.customBackgroundImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {canvas.elements && canvas.elements.map((element, idx) => {
                        const scale = 0.75;
                        return (
                          <div
                            key={idx}
                            style={{
                              position: 'absolute',
                              left: `${element.x * scale}px`,
                              top: `${element.y * scale}px`,
                              fontSize: `${element.fontSize * scale}px`,
                              fontWeight: element.fontWeight,
                              fontStyle: element.fontStyle,
                              color: element.color,
                              zIndex: 10
                            }}
                          >
                            {element.variable}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Uploaded image
                if (content.cover_image) {
                  return (
                    <div className="mx-auto bg-white shadow-xl" style={{ maxWidth: '595px' }}>
                      <img 
                        src={content.cover_image} 
                        alt="Cover Page" 
                        className="w-full"
                      />
                    </div>
                  );
                }

                return (
                  <div className="text-center py-12 bg-gray-50 rounded">
                    <p className="text-gray-500">Önizleme mevcut değil</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Önizleme</h2>
      
      <div className="bg-gray-50 border rounded p-3 space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-gray-500">Profil</p>
            <p className="font-medium text-sm">{formData.profile_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Şirket</p>
            <p className="font-medium text-sm truncate">{formData.company_info.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Para / Geçerlilik</p>
            <p className="font-medium text-sm">{formData.defaults.currency} / {formData.defaults.validity_days} gün</p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Modüller ({selectedModuleIds.length})</p>
          <div className="flex flex-wrap gap-1">
            {selectedModuleIds.map(moduleType => {
              const module = availableModules.find(m => m.module_type === moduleType);
              return (
                <span key={moduleType} className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                  <span>{module?.icon}</span>
                  <span>{module?.module_name}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Renk Paleti</p>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: formData.branding.primary_color }} />
              <span className="text-xs">Ana</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: formData.branding.secondary_color }} />
              <span className="text-xs">İkincil</span>
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

  const handleCoverPageSave = (template) => {
    console.log('🎨 Canvas Designer: Saving template...', template);
    
    // Save canvas template with proper structure
    const coverPageContent = {
      title: 'Kapak Sayfası',
      type: 'canvas_design',
      canvas_template: template,
      body: ''
    };
    
    console.log('🎨 Canvas Designer: Creating content:', coverPageContent);
    
    // Direct state update - React will handle this properly
    setModuleContents(prev => ({
      ...prev,
      cover_page: coverPageContent
    }));
    
    // Auto-show canvas preview
    setShowCanvasPreview(true);
    
    console.log('🎨 Canvas Designer: State update queued');
    toast.success('Kapak sayfası şablonu kaydedildi!');
  };

  const handleCoverImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📤 Image Upload: File selected:', file.name, file.size, 'bytes');
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu 5MB\'dan küçük olmalı');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('📤 Image Upload: Base64 conversion complete, length:', reader.result.length);
      
      const coverImageContent = {
        title: 'Kapak Sayfası',
        type: 'image_upload',
        cover_image: reader.result,
        body: ''
      };
      
      console.log('📤 Image Upload: Updating state with type:', coverImageContent.type);
      
      // Direct state update - React batches this automatically
      setModuleContents(prev => ({
        ...prev,
        cover_page: coverImageContent
      }));
      
      // Auto-show preview when image is uploaded
      setShowCoverImagePreview(true);
      
      console.log('📤 Image Upload: State update queued');
      toast.success('Kapak resmi yüklendi!');
    };
    
    reader.onerror = () => {
      console.error('📤 Image Upload: Error reading file');
      toast.error('Resim yüklenirken hata oluştu');
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <CoverPageCanvasDesigner
        isOpen={showCoverDesigner}
        onClose={() => setShowCoverDesigner(false)}
        profileData={formData}
        onSave={handleCoverPageSave}
        initialData={moduleContents[currentEditingModule]?.canvas_template}
      />
      
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
              {urlProfileId ? 'Profil Düzenle' : 'Yeni Profil'}
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
              {loading ? 'Kaydediliyor...' : (urlProfileId ? 'Güncelle' : 'Kaydet')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalProfileWizard;
