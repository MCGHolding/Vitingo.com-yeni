import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, ContentState, convertToRaw, Modifier } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import CoverPageCanvasDesigner from './CoverPageCanvasDesigner';
import TimelineModule from '../../components/proposals/TimelineModule';
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
        // Canvas template exists - preview is always visible in the UI
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
            
            {/* Variable Tags Section */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 px-2">📝 Dinamik Alanlar</h4>
              <p className="text-[10px] text-gray-500 px-2 mb-2">Metinde kelime seçip tag&apos;a tıklayın</p>
              <div className="space-y-1">
                {[
                  { icon: '🏢', label: 'Firma Adı', variable: '{{firma_adi}}' },
                  { icon: '👤', label: 'Yetkili Adı', variable: '{{yetkili_adi}}' },
                  { icon: '📧', label: 'Email', variable: '{{email}}' },
                  { icon: '📞', label: 'Telefon', variable: '{{telefon}}' },
                  { icon: '📍', label: 'Adres', variable: '{{adres}}' },
                  { icon: '🏙️', label: 'Şehir', variable: '{{sehir}}' },
                  { icon: '🌍', label: 'Ülke', variable: '{{ulke}}' },
                  { icon: '📮', label: 'Posta Kodu', variable: '{{posta_kodu}}' },
                  { icon: '💼', label: 'Vergi No', variable: '{{vergi_no}}' }
                ].map(tag => (
                  <button
                    key={tag.variable}
                    onClick={() => handleInsertVariable(tag.variable, tag.label)}
                    className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border border-green-200 hover:border-green-300 transition-all"
                    title={`Seçili metni ${tag.label} ile değiştir`}
                  >
                    <span className="mr-1">{tag.icon}</span>
                    <span className="font-medium text-gray-700">{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content editor */}
          <div className="flex-1 space-y-2">
            {currentModule && (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{currentModule.icon}</span>
                  <h3 className="text-sm font-semibold">{currentModule.module_name}</h3>
                </div>

                {/* Editor for non-cover modules */}
                {currentEditingModule !== 'cover_page' && (
                  <>
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
                    
                    {/* Template Selector for Introduction Module */}
                    {console.log('DEBUG: currentEditingModule =', currentEditingModule, 'currentModule.type =', currentModule?.module_type)}
                    {(currentEditingModule === 'introduction' || currentModule?.module_type === 'introduction') && (
                      <div className="mt-3 mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">📝 Giriş Sayfası Şablonları:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              id: 1,
                              name: 'Şablon 1 - Resmi',
                              content: `<p><strong>Sayın {{yetkili_adi}},</strong></p><p>Öncelikle <strong>{{firma_adi}}</strong> göstermiş olduğunuz ilgiye teşekkür ederiz.</p><p><strong>{{project_name}}</strong> projesi için hazırlamış olduğumuz teklifimizi incelemenizi rica ederiz.</p><p>Bu teklif, ihtiyaçlarınız doğrultusunda özenle hazırlanmıştır ve sizlere en uygun çözümleri sunmayı hedeflemektedir.</p><p>Saygılarımızla,<br><strong>{{hazırlayan}}</strong><br>{{unvan}}<br>{{email}}<br>{{telefon}}</p>`
                            },
                            {
                              id: 2,
                              name: 'Şablon 2 - Samimi',
                              content: `<p>Merhaba <strong>{{yetkili_adi}}</strong>,</p><p><strong>{{firma_adi}}</strong> ile çalışma fırsatı bulmaktan mutluluk duyuyoruz!</p><p><strong>{{project_name}}</strong> için sizin için özel olarak hazırladığımız teklifimiz ektedir. İhtiyaçlarınıza tam uygun çözümler sunduk.</p><p>Sorularınız için her zaman buradayız. Hemen konuşalım mı?</p><p>Selamlar,<br><strong>{{hazırlayan}}</strong><br>{{unvan}}<br>📧 {{email}}<br>📞 {{telefon}}</p>`
                            },
                            {
                              id: 3,
                              name: 'Şablon 3 - Kısa & Öz',
                              content: `<p><strong>{{yetkili_adi}}</strong>,</p><p><strong>{{project_name}}</strong> projesi için hazırladığımız teklifimiz aşağıdadır.</p><p>• Detaylı fiyatlandırma<br>• Teslimat süreleri<br>• Ödeme koşulları</p><p>Sorularınız için iletişime geçin.</p><p><strong>{{hazırlayan}}</strong> | {{email}} | {{telefon}}</p>`
                            },
                            {
                              id: 4,
                              name: 'Şablon 4 - Detaylı',
                              content: `<p><strong>Değerli {{yetkili_adi}},</strong></p><p><strong>{{firma_adi}}</strong> ile iş ortaklığı kurmak üzere hazırladığımız bu teklifle karşınızdayız.</p><p><strong>{{project_name}}</strong> kapsamında:</p><ul><li>Kapsamlı analiz yaptık</li><li>İhtiyaçlarınızı değerlendirdik</li><li>En uygun çözümleri belirledik</li></ul><p>Teklifimiz, sektördeki deneyimimiz ve uzmanlığımız ışığında hazırlanmıştır. Her detayı sizinle paylaşmaktan memnuniyet duyarız.</p><p>Ekibimiz her an görüşmeye hazır.</p><p>Saygılarımızla,<br><strong>{{hazırlayan}}</strong><br>{{unvan}}<br>{{email}}<br>{{telefon}}</p>`
                            },
                            {
                              id: 5,
                              name: 'Şablon 5 - Kurumsal',
                              content: `<p><strong>Sayın {{yetkili_adi}},</strong></p><p>Öncelikle <strong>{{firma_adi}}</strong> göstermiş olduğunuz ilgi ve güven için teşekkür ederiz.</p><p>Bu teklif dokümanı, tarafınızca talep edilen <strong>{{project_name}}</strong> kapsamında sunacağımız hizmetlerin detaylı açıklamasını, teknik spesifikasyonları ve fiyatlandırmayı içermektedir.</p><p>Firmamız, sektördeki uzun yıllara dayanan deneyimi ve uzman kadrosuyla müşterilerine her zaman en yüksek kalitede hizmet sunmayı ilke edinmiştir. Projelerimizde kalite, zamanında teslimat ve müşteri memnuniyetini ön planda tutarak çalışmaktayız.</p><p>Teklifimiz, projenizin tüm gereksinimlerini karşılayacak şekilde hazırlanmış olup, aşağıdaki bölümlerden oluşmaktadır:</p><ul><li>Proje kapsamı ve teknik detaylar</li><li>Malzeme ve işçilik spesifikasyonları</li><li>Üretim ve teslimat takvimi</li><li>Fiyatlandırma ve ödeme koşulları</li><li>Garanti ve satış sonrası destek</li></ul><p>Sunduğumuz çözümler, sektör standartlarına ve uluslararası kalite normlarına uygun olarak tasarlanmıştır. Her projede olduğu gibi bu projede de sizinle yakın iş birliği içinde çalışarak beklentilerinizi en iyi şekilde karşılamayı hedefliyoruz.</p><p>Teklifimizle ilgili her türlü soru, değişiklik talebi veya ek bilgi için bizimle iletişime geçmekten lütfen çekinmeyiniz. Ekibimiz, projenizin her aşamasında yanınızda olmaktan memnuniyet duyacaktır.</p><p>İş birliği fırsatı için tekrar teşekkür eder, çalışmalarınızda başarılar dileriz.</p><p>Saygılarımızla,<br><strong>{{hazırlayan}}</strong><br>{{unvan}}<br>{{email}}<br>{{telefon}}</p>`
                            },
                            {
                              id: 6,
                              name: 'Şablon 6 - Fuar Stand',
                              content: `<p><strong>Sayın {{yetkili_adi}},</strong></p><p><strong>{{firma_adi}}</strong> ile <strong>{{fair_name}}</strong> fuarında bir araya gelmek ve markanızı en iyi şekilde temsil etmek için heyecanlıyız.</p><p>Fuar stand tasarım ve uygulama konusunda uzmanlaşmış firmamız, {{country}} - {{city}} lokasyonunda gerçekleşecek bu önemli etkinlikte sizlere profesyonel çözümler sunmak üzere bu teklifi hazırlamıştır.</p><p>Firmamız, ulusal ve uluslararası birçok fuarda gerçekleştirdiği başarılı projelerle sektörde öncü konumdadır. Her projede yaratıcı tasarım, kaliteli malzeme ve zamanında teslimata olan bağlılığımız ile fark yaratmaktayız.</p><p>Teklifimiz aşağıdaki hizmetleri kapsamaktadır:</p><ul><li>3D stand tasarımı ve görselleştirme</li><li>Malzeme seçimi ve teknik çizimler</li><li>Üretim, nakliye ve montaj hizmetleri</li><li>Fuar süresince teknik destek</li><li>Fuar sonrası söküm ve depolama</li></ul><p>Standınız, markanızın kimliğini yansıtacak, ziyaretçi çekecek ve rakiplerinizden sizi ayırt edecek şekilde özenle tasarlanacaktır. Tüm süreçlerde şeffaf iletişim ve müşteri memnuniyeti önceliğimizdir.</p><p>Fuar tarihleri: <strong>{{start_date}} - {{end_date}}</strong><br>Fuar merkezi: <strong>{{venue}}</strong></p><p>Detaylar için bizimle iletişime geçebilir, örnek çalışmalarımızı inceleyebilirsiniz. Fuarda başarılar dileriz!</p><p>Saygılarımızla,<br><strong>{{hazırlayan}}</strong><br>{{unvan}}<br>{{email}}<br>{{telefon}}</p>`
                            }
                          ].map(template => (
                            <button
                              key={template.id}
                              onClick={() => {
                                handleModuleContentChange(currentEditingModule, 'body', template.content);
                                toast.success(`${template.name} yüklendi`);
                              }}
                              className="px-3 py-2 text-xs border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                            >
                              <div className="font-medium text-blue-700">{template.name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">Tıkla ve kullan</div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">💡 İpucu: Şablon seçtikten sonra istediğiniz gibi düzenleyebilirsiniz</p>
                      </div>
                    )}
                    
                    {/* Template Selector for About Company Module */}
                    {(currentEditingModule === 'about_company' || currentModule?.module_type === 'about_company') && (
                      <div className="mt-3 mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">🏢 Firma Hakkında Şablonları:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              id: 1,
                              name: 'Şablon 1 - Klasik',
                              content: `<p><strong>{{bizim_firma}}</strong>, fuar stand tasarımı ve üretimi alanında uzmanlaşmış, sektörde 15 yılı aşkın deneyime sahip öncü bir firmadır.</p><p>Firmamız, ulusal ve uluslararası fuarlarda yüzlerce başarılı projeye imza atmış, markaların en iyi şekilde temsil edilmesini sağlamıştır. Müşteri memnuniyeti odaklı yaklaşımımız ve kaliteden ödün vermeyen çalışma prensibimiz ile sektörde güvenilir bir iş ortağı konumundayız.</p><p><strong>Hizmetlerimiz:</strong></p><ul><li>Fuar stand tasarım ve uygulama</li><li>3D görselleştirme ve proje yönetimi</li><li>Özel yapım mobilya ve dekorasyon</li><li>Grafik tasarım ve baskı hizmetleri</li><li>Montaj, demontaj ve lojistik</li></ul><p>Deneyimli ekibimiz, her projede yaratıcı çözümler üreterek markanızın fuar alanında fark yaratmasını sağlar. Detaycı yaklaşımımız ve zamanında teslimat garantimiz ile projelerinizi güvenle teslim edebiliriz.</p><p>Referanslarımız ve tamamlanmış projelerimiz hakkında detaylı bilgi almak için bizimle iletişime geçebilirsiniz.</p>`
                            },
                            {
                              id: 2,
                              name: 'Şablon 2 - Vizyon',
                              content: `<h3>Vizyonumuz</h3><p><strong>{{bizim_firma}}</strong>, fuar ve etkinlik sektöründe global standartlarda hizmet veren, yenilikçi ve sürdürülebilir çözümler üreten lider firma olmayı hedeflemektedir.</p><h3>Misyonumuz</h3><p>Müşterilerimizin markalarını en etkin şekilde temsil etmelerini sağlayacak, yaratıcı ve işlevsel stand tasarımları sunmak, her projede mükemmeliyeti yakalamak ve uzun vadeli iş ortaklıkları kurmaktır.</p><h3>Değerlerimiz</h3><ul><li><strong>Kalite:</strong> Her aşamada en yüksek standartları uygularız</li><li><strong>Yenilikçilik:</strong> Sürekli gelişim ve yaratıcı çözümler</li><li><strong>Güvenilirlik:</strong> Sözümüzü tutar, zamanında teslim ederiz</li><li><strong>Müşteri Odaklılık:</strong> İhtiyaçlarınız önceliğimizdir</li><li><strong>Sürdürülebilirlik:</strong> Çevre dostu malzeme ve süreçler</li></ul><p>2008 yılından bu yana sektörde edindiğimiz tecrübe ile Türkiye'nin dört bir yanında ve yurtdışında birçok başarılı projeye imza attık. Modern üretim tesisimiz ve deneyimli ekibimizle her ölçekte projeye çözüm üretiyoruz.</p>`
                            },
                            {
                              id: 3,
                              name: 'Şablon 3 - Başarı',
                              content: `<p><strong>{{bizim_firma}}</strong> olarak, her projede mükemmelliği hedefleyen, sektörde fark yaratan bir ekibiz.</p><h3>Neden Bizi Tercih Etmelisiniz?</h3><ul><li><strong>500+ Başarılı Proje:</strong> Ulusal ve uluslararası fuarlarda gerçekleştirilen projeler</li><li><strong>Deneyimli Ekip:</strong> Tasarımcı, mimar ve üretim uzmanlarından oluşan profesyonel kadro</li><li><strong>Modern Teknoloji:</strong> Son teknoloji üretim makineleri ve yazılımlar</li><li><strong>Hızlı Teslimat:</strong> Zamanında ve eksiksiz proje teslimi garantisi</li><li><strong>7/24 Destek:</strong> Fuar öncesi, sırası ve sonrasında kesintisiz teknik destek</li></ul><h3>Çalıştığımız Sektörler</h3><p>Otomotiv, teknoloji, gıda, tekstil, sağlık, mobilya ve daha birçok sektörde lider firmalara hizmet veriyoruz. Her sektörün kendine özgü ihtiyaçlarını anlıyor ve buna uygun çözümler üretiyoruz.</p><h3>Üretim Kapasitemiz</h3><p>3.000 m² kapalı üretim alanımızda, ahşap işleme, metal işleme, baskı ve montaj atölyelerimiz bulunmaktadır. Kendi üretimimizi yapmamız sayesinde kalite kontrolü ve maliyet avantajı sağlıyoruz.</p><p>Projeleriniz için detaylı bilgi ve referans çalışmalarımızı görmek isterseniz, showroom'umuzu ziyaret edebilir veya online portfolyomuzu inceleyebilirsiniz.</p>`
                            }
                          ].map(template => (
                            <button
                              key={template.id}
                              onClick={() => {
                                handleModuleContentChange(currentEditingModule, 'body', template.content);
                                toast.success(`${template.name} yüklendi`);
                              }}
                              className="px-3 py-2 text-xs border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left"
                            >
                              <div className="font-medium text-purple-700">{template.name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">Tıkla ve kullan</div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">💡 İpucu: Şablon seçtikten sonra {`{{bizim_firma}}`} gibi kodlar ekleyebilirsiniz</p>
                      </div>
                    )}
                    
                    {/* Template Selector for Company Stats Module */}
                    {(currentEditingModule === 'company_statistics' || currentModule?.module_type === 'company_statistics') && (
                      <div className="mt-3 mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">📊 Firma İstatistikleri Şablonları:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              id: 1,
                              name: 'Şablon 1 - Sayılarla Başarı',
                              content: `<h3>{{bizim_firma}} - Rakamlarla Başarı</h3><p>Sektördeki liderliğimizi ve güvenilirliğimizi rakamlarla kanıtlıyoruz:</p><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;"><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">750+</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Başarılı Proje</p></div><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">18</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Yıl Deneyim</p></div><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">320+</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Mutlu Müşteri</p></div><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">65+</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Farklı Sektör</p></div><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">35</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Ülke</p></div><div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #ffffff; font-size: 48px; margin: 0; font-weight: bold;">98%</h2><p style="margin: 12px 0 0 0; font-weight: 600; color: #ffffff; font-size: 14px;">Müşteri Memnuniyeti</p></div></div><p style="margin-top: 30px; line-height: 1.8;">Bu rakamlar, yıllar içinde kazandığımız deneyimin, verdiğimiz kaliteli hizmetin ve sektördeki güçlü konumumuzun somut göstergeleridir. Her projede mükemmelliği hedefliyor, her müşterimize özel çözümler sunuyoruz.</p><p style="margin-top: 15px; font-style: italic; color: #64748b;">* Tüm istatistikler 2024 yılı verilerine dayanmaktadır.</p>`
                            },
                            {
                              id: 2,
                              name: 'Şablon 2 - Kapasite ve Altyapı',
                              content: `<h3>Üretim Kapasitesi ve Teknik Altyapı</h3><p><strong>{{bizim_firma}}</strong> güçlü altyapısı ve modern üretim tesisleri ile sektörde öncü konumdadır.</p><h4>🏭 Üretim Tesislerimiz</h4><ul><li><strong>5.500 m²</strong> kapalı üretim alanı</li><li><strong>2.000 m²</strong> açık depolama ve montaj sahası</li><li><strong>Modern CNC</strong> ahşap ve metal işleme makineleri</li><li><strong>Dijital baskı</strong> ve geniş format çıktı sistemleri</li><li><strong>Özel boyama kabini</strong> ve imalat atölyeleri</li></ul><h4>👥 İnsan Kaynağımız</h4><ul><li>25 kişilik deneyimli üretim ekibi</li><li>12 profesyonel tasarımcı ve mimar</li><li>8 proje yöneticisi ve koordinatör</li><li>20 montaj ve teknik servis personeli</li><li>Toplam 65+ uzman çalışan kadrosu</li></ul><h4>📦 Lojistik ve Depolama</h4><ul><li>Kendi filosu: 6 adet kapalı kasa kamyon</li><li>Avrupa geneli lojistik partnerleri</li><li>Güvenli depolama ve envanter yönetimi</li><li>Uluslararası nakliye tecrübesi</li></ul><h4>⚙️ Teknolojik Donanım</h4><ul><li>3D modelleme ve render yazılımları (3ds Max, SketchUp, Cinema 4D)</li><li>Proje yönetim sistemleri</li><li>CRM ve müşteri takip platformları</li><li>Dijital arşiv ve dokümantasyon</li></ul><p style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9;">💡 <strong>Aylık ortalama kapasite:</strong> 15-20 fuar stand projesi, 50+ özel üretim mobilya, sınırsız grafik ve baskı hizmeti</p>`
                            },
                            {
                              id: 3,
                              name: 'Şablon 3 - Ödüller ve Başarılar',
                              content: `<h3>Ödüller, Sertifikalar ve Başarı Hikayeleri</h3><p><strong>{{bizim_firma}}</strong> kazandığı ödüller ve sertifikalarla sektördeki başarısını tescillemiştir.</p><h4>🏆 Uluslararası Ödüller</h4><ul><li><strong>Best Stand Design Award 2023</strong> - International Exhibition Awards, Berlin</li><li><strong>Excellence in Trade Fair Construction</strong> - Dubai Design Week 2022</li><li><strong>Innovation in Booth Design</strong> - Milan Design Fair 2021</li><li><strong>Green Booth Certificate</strong> - Sustainable Events Summit 2023</li></ul><h4>📜 Kalite Belgeleri ve Sertifikalar</h4><ul><li><strong>ISO 9001:2015</strong> - Kalite Yönetim Sistemi</li><li><strong>ISO 14001:2015</strong> - Çevre Yönetim Sistemi</li><li><strong>ISO 45001:2018</strong> - İş Sağlığı ve Güvenliği Yönetim Sistemi</li><li><strong>TSE Hizmet Yeterlilik Belgesi</strong></li><li><strong>CE Uygunluk Belgesi</strong> - AB standartları</li><li><strong>FSC Sertifikası</strong> - Sürdürülebilir orman yönetimi</li></ul><h4>✨ Öne Çıkan Başarılı Projeler</h4><ul><li><strong>IFA Berlin 2023:</strong> 800 m² iki katlı VIP stand - Teknoloji devi için</li><li><strong>Mobile World Congress Barcelona:</strong> İnteraktif deneyim standı</li><li><strong>Automechanika Frankfurt:</strong> 600 m² modüler sistem stand</li><li><strong>Gulfood Dubai:</strong> 450 m² lüks gıda stand tasarımı</li><li><strong>Maison&Objet Paris:</strong> Minimalist mobilya sergileme alanı</li></ul><h4>🎯 Sektörel Tanınırlık</h4><ul><li>Türkiye'nin en büyük 10 fuar stand firması arasında</li><li>Avrupa Fuar Stand Yapımcıları Birliği (EFSC) üyesi</li><li>Türkiye Fuar Organizatörleri Derneği (TÜYAFOD) iş ortağı</li><li>TOBB ve İTO kayıtlı, resmi kurum ihaleleri onaylı</li></ul><p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;"><strong>📈 2023 Yılı Özeti:</strong> 85 adet fuar projesi, 12 farklı ülke, 45 yeni kurumsal müşteri, %28 büyüme oranı</p>`
                            }
                          ].map(template => (
                            <button
                              key={template.id}
                              onClick={() => {
                                handleModuleContentChange(currentEditingModule, 'body', template.content);
                                toast.success(`${template.name} yüklendi`);
                              }}
                              className="px-3 py-2 text-xs border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition text-left"
                            >
                              <div className="font-medium text-green-700">{template.name}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">Tıkla ve kullan</div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">💡 İpucu: Rakamları ve referansları kendi firmanıza göre düzenleyebilirsiniz</p>
                      </div>
                    )}
                  </>
                )}

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
                                  // Preview scale: canvas width 450px, gerçek width 794px
                                  const previewScale = 450 / 794;
                                  
                                  // Replace variable with real data
                                  const realData = {
                                    '{{company_name}}': formData.company_info?.name || 'Örnek Firma',
                                    '{{fair_name}}': 'Örnek Fuar 2026',
                                    '{{country}}': 'Türkiye',
                                    '{{city}}': 'İstanbul',
                                    '{{venue}}': 'İstanbul Fuar Merkezi',
                                    '{{start_date}}': '2026-03-15',
                                    '{{end_date}}': '2026-03-18',
                                    '{{prepared_by}}': 'Murat Bucak',
                                    '{{prepared_title}}': 'Süper Admin',
                                    '{{project_name}}': 'Örnek Proje'
                                  };
                                  
                                  const displayValue = realData[element.variable] || element.variable;
                                  
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        position: 'absolute',
                                        left: `${element.x * previewScale}px`,
                                        top: `${element.y * previewScale}px`,
                                        width: element.width ? `${element.width * previewScale}px` : 'auto',
                                        fontSize: `${(element.fontSize || 24) * previewScale}px`,
                                        fontFamily: element.fontFamily || 'Inter',
                                        fontWeight: element.fontWeight || 'normal',
                                        fontStyle: element.fontStyle || 'normal',
                                        textDecoration: element.textDecoration || 'none',
                                        color: element.color || '#000000',
                                        textAlign: element.textAlign || 'left',
                                        padding: '2px 4px',
                                        zIndex: 10
                                      }}
                                    >
                                      {displayValue}
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

                {/* Content editor - hide for cover_page and timeline modules */}
                {currentEditingModule !== 'cover_page' && currentEditingModule !== 'timeline' && (
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

  // Variable tag'ına tıklandığında seçili texti variable ile değiştir
  const handleInsertVariable = (variable, label) => {
    if (!currentEditingModule) {
      toast.error('Lütfen önce bir modül seçin');
      return;
    }
    
    const editorState = editorStates[currentEditingModule];
    if (!editorState) {
      toast.error('Editor yüklenemedi');
      return;
    }
    
    const selection = editorState.getSelection();
    
    // Eğer seçili text yoksa uyarı ver
    if (selection.isCollapsed()) {
      toast.error('Lütfen değiştirmek istediğiniz metni seçin');
      return;
    }
    
    // Seçili text'i variable ile değiştir
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.replaceText(
      contentState,
      selection,
      variable
    );
    
    // Yeni editor state oluştur
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      'insert-characters'
    );
    
    // Editor state'i güncelle
    setEditorStates(prev => ({
      ...prev,
      [currentEditingModule]: newEditorState
    }));
    
    // Content'i de güncelle (HTML formatında)
    const newHtml = draftToHtml(convertToRaw(newContentState));
    handleModuleContentChange(currentEditingModule, 'body', newHtml);
    
    toast.success(`✅ "${label}" eklendi`);
  };
  
  // Canvas Designer'dan "Kaydet" tıklandığında çağrılır
  // Direkt tasarımı kaydeder (Live Editor yok artık)
  const handleCoverPageSave = (template) => {
    console.log('🎨 Canvas Designer: Saving template directly...', template);
    
    // Save canvas template with proper structure
    const coverPageContent = {
      title: 'Kapak Sayfası',
      type: 'canvas_design',
      canvas_template: template,
      body: ''
    };
    
    console.log('🎨 Canvas Designer: Creating content:', coverPageContent);
    
    // Direct state update
    setModuleContents(prev => ({
      ...prev,
      cover_page: coverPageContent
    }));
    
    // Canvas preview is always visible in the UI
    
    toast.success('Kapak sayfası kaydedildi!');
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
        realData={{
          company_name: formData.company_info?.name || 'Örnek Firma',
          fair_name: 'Örnek Fuar 2026',
          project_name: 'Örnek Proje',
          country: 'Türkiye',
          city: 'İstanbul',
          venue: 'İstanbul Fuar Merkezi',
          start_date: '2026-03-15',
          end_date: '2026-03-18',
          prepared_by: 'Murat Bucak',
          prepared_title: 'Süper Admin',
          proposal_number: `TKL-${Date.now().toString().slice(-6)}`
        }}
      />
      
      {/* Live Editor removed - Canvas Designer now saves directly */}
      
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
