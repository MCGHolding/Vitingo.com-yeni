import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Temel Bilgiler</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Profil Adı *</label>
        <input
          type="text"
          value={formData.profile_name}
          onChange={(e) => setFormData(prev => ({ ...prev, profile_name: e.target.value }))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Örn: Fuar Teklifleri - Modern"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Seçin *</label>
        <select
          value={formData.company_group_id}
          onChange={(e) => handleCompanyChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Şirket seçin...</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.companyName || company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
          <input
            type="text"
            value={formData.branding.logo_url}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, logo_url: e.target.value }
            }))}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ana Renk</label>
          <input
            type="color"
            value={formData.branding.primary_color}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, primary_color: e.target.value }
            }))}
            className="w-full h-10 px-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İkincil Renk</label>
          <input
            type="color"
            value={formData.branding.secondary_color}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, secondary_color: e.target.value }
            }))}
            className="w-full h-10 px-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vurgu Rengi</label>
          <input
            type="color"
            value={formData.branding.accent_color}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              branding: { ...prev.branding, accent_color: e.target.value }
            }))}
            className="w-full h-10 px-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Yönü</label>
          <select
            value={formData.defaults.page_orientation}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, page_orientation: e.target.value }
            }))}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="portrait">Dikey</option>
            <option value="landscape">Yatay</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
          <select
            value={formData.defaults.currency}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, currency: e.target.value }
            }))}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik (Gün)</label>
          <input
            type="number"
            value={formData.defaults.validity_days}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              defaults: { ...prev.defaults, validity_days: parseInt(e.target.value) || 30 }
            }))}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Modül Seçimi</h2>
      <p className="text-gray-600">Tekliflerinizde kullanmak istediğiniz modülleri seçin</p>
      
      <div className="grid grid-cols-2 gap-4">
        {availableModules.map((module) => (
          <div
            key={module.module_id}
            onClick={() => handleModuleToggle(module.module_type)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all
              ${selectedModuleIds.includes(module.module_type) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={selectedModuleIds.includes(module.module_type)}
                onChange={() => {}}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{module.icon}</span>
                  <h3 className="font-semibold text-gray-900">{module.module_name}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>{selectedModuleIds.length}</strong> modül seçildi
        </p>
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Modül İçeriklerini Oluştur</h2>
        
        <div className="flex space-x-4">
          {/* Module list sidebar */}
          <div className="w-64 space-y-2">
            {selectedModulesList.map((module) => (
              <button
                key={module.module_type}
                onClick={() => setCurrentEditingModule(module.module_type)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors
                  ${currentEditingModule === module.module_type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{module.icon}</span>
                  <span className="text-sm font-medium">{module.module_name}</span>
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
                  <textarea
                    value={currentContent.body}
                    onChange={(e) => handleModuleContentChange(currentEditingModule, 'body', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-sans"
                    rows={15}
                    placeholder="Modül içeriğini buraya yazın... HTML etiketleri kullanabilirsiniz."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HTML etiketlerini kullanabilirsiniz: &lt;b&gt;kalın&lt;/b&gt;, &lt;i&gt;italik&lt;/i&gt;, &lt;br&gt; (satır atla)
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/proposals/profiles')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Geri Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {profileId ? 'Profil Düzenle' : 'Yeni Teklif Profili Oluştur'}
          </h1>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
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
            className={`px-6 py-2 rounded-lg font-medium ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Önceki
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              Sonraki
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400"
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
