import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ArrowRight, FileText, Sparkles, Building2, GripVertical, X, Plus, Check, Image, FileBarChart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Module categories and types
const MODULE_CATEGORIES = {
  intro: {
    name: 'Giriş',
    modules: [
      { type: 'cover_page', name: 'Kapak Sayfası', icon: '📄', description: 'Teklifin açılış sayfası' },
      { type: 'introduction', name: 'Giriş Sayfası', icon: '📝', description: 'Karşılama metni' }
    ]
  },
  company: {
    name: 'Firma Tanıtımı',
    modules: [
      { type: 'about_company', name: 'Firma Hakkında', icon: '🏢', description: 'Firma tanıtımı' },
      { type: 'company_statistics', name: 'Firma İstatistikleri', icon: '📊', description: 'Sayılarla firma' },
      { type: 'references', name: 'Referanslar', icon: '⭐', description: 'Referans listesi' },
      { type: 'portfolio', name: 'Portföy / Proje Görselleri', icon: '🖼️', description: 'Geçmiş projeler' }
    ]
  },
  services: {
    name: 'Hizmet Detayları',
    modules: [
      { type: 'included_services', name: 'Dahil Olan Hizmetler', icon: '✅', description: 'Kapsanan hizmetler' },
      { type: 'excluded_services', name: 'Hariç Olan Hizmetler', icon: '❌', description: 'Kapsam dışı hizmetler' },
      { type: 'technical_specs', name: 'Teknik Şartname', icon: '📋', description: 'Teknik detaylar' },
      { type: 'timeline', name: 'Zaman Çizelgesi', icon: '📅', description: 'Proje takvimi' }
    ]
  },
  pricing: {
    name: 'Fiyat ve Koşullar',
    modules: [
      { type: 'pricing', name: 'Fiyatlandırma', icon: '💰', description: 'Fiyat detayları' },
      { type: 'payment_terms', name: 'Ödeme Koşulları', icon: '💳', description: 'Ödeme şartları' },
      { type: 'warranty', name: 'Garanti ve Servis', icon: '🛡️', description: 'Garanti bilgileri' },
      { type: 'terms_conditions', name: 'Koşullar ve Şartlar', icon: '📜', description: 'Genel şartlar' }
    ]
  },
  closing: {
    name: 'Kapanış',
    modules: [
      { type: 'contact', name: 'İletişim', icon: '📞', description: 'İletişim bilgileri' },
      { type: 'attachments', name: 'Ekler', icon: '📎', description: 'Ek dosyalar' }
    ]
  }
};

// Recommended proposal structure
const RECOMMENDED_STRUCTURE = [
  'cover_page',
  'introduction',
  'about_company',
  'included_services',
  'excluded_services',
  'pricing',
  'payment_terms',
  'terms_conditions',
  'contact'
];

// Wizard steps configuration
const WIZARD_STEPS = [
  { id: 1, name: 'Temel Bilgiler', key: 'basics' },
  { id: 2, name: 'Modül Seçimi', key: 'modules' },
  { id: 3, name: 'İçerik', key: 'content' },
  { id: 4, name: 'Fiyat', key: 'pricing' },
  { id: 5, name: 'Önizleme', key: 'preview' }
];

const NewProposalWizard = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [proposalId, setProposalId] = useState(null);
  
  // Dropdown data
  const [salesOpportunities, setSalesOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  
  // Step 2: Module selection state
  const [availableTemplates, setAvailableTemplates] = useState({});
  const [selectedModules, setSelectedModules] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentModuleType, setCurrentModuleType] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(null);
  
  // Step 3: Content editing state
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [moduleContents, setModuleContents] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  
  // Step 4: Pricing state
  const [lineItems, setLineItems] = useState([]);
  const [taxRate, setTaxRate] = useState(20);
  const [generalDiscount, setGeneralDiscount] = useState({ type: 'none', value: 0 });
  const [pricingSummary, setPricingSummary] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    optional_total: 0
  });
  
  // Step 5: Preview and send state
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    subject: '',
    message: ''
  });
  const [publicLink, setPublicLink] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Teklif Kaynağı
    creation_type: 'opportunity', // 'opportunity' or 'scratch'
    sales_opportunity_id: '',
    
    // Teklif Profili
    profile_id: '',
    
    // Müşteri Bilgileri
    customer_id: '',
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    
    // Proje/Fuar Bilgileri
    project_name: '',
    fair_center: '',
    city: '',
    country: '',
    hall_number: '',
    stand_number: '',
    stand_area: '',
    stand_area_unit: 'm²',
    start_date: '',
    end_date: '',
    
    // Teklif Ayarları
    page_orientation: 'portrait',
    currency_code: 'EUR',
    language: 'tr',
    validity_days: 30
  });
  
  const [errors, setErrors] = useState({});
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Load dropdown data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-fill from sales opportunity
  useEffect(() => {
    if (formData.sales_opportunity_id && formData.creation_type === 'opportunity') {
      autoFillFromOpportunity();
    }
  }, [formData.sales_opportunity_id]);

  // Auto-fill from customer
  useEffect(() => {
    if (formData.customer_id && formData.creation_type === 'scratch') {
      autoFillFromCustomer();
    }
  }, [formData.customer_id]);

  // Auto-fill from profile defaults
  useEffect(() => {
    if (formData.profile_id) {
      autoFillFromProfile();
    }
  }, [formData.profile_id]);

  // Recalculate pricing when line items change
  useEffect(() => {
    calculatePricingSummary();
  }, [lineItems, generalDiscount, taxRate]);

  const loadInitialData = async () => {
    console.log('🚀 Loading initial data for wizard...');
    setLoading(true);
    try {
      await Promise.all([
        loadSalesOpportunities(),
        loadCustomers(),
        loadProfiles(),
        loadCurrencies(),
        loadCountries()
      ]);
      console.log('✅ Initial data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOpportunities = async () => {
    console.log('📊 Loading sales opportunities from:', `${BACKEND_URL}/api/opportunities`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/opportunities`);
      const data = await response.json();
      // Filter by status if needed
      const filtered = Array.isArray(data) ? data.filter(op => 
        op.status === 'open' || op.status === 'won'
      ) : [];
      console.log(`✅ Loaded ${filtered.length} sales opportunities`);
      setSalesOpportunities(filtered);
    } catch (error) {
      console.error('❌ Error loading sales opportunities:', error);
      setSalesOpportunities([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/customers`);
      const data = await response.json();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProfiles = async () => {
    console.log('📋 Loading proposal profiles...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/proposal-profiles?user_id=demo-user`);
      const data = await response.json();
      console.log(`✅ Loaded ${data?.length || 0} profiles`);
      setProfiles(data || []);
      
      // Auto-select default profile
      const defaultProfile = data.find(p => p.is_default);
      if (defaultProfile) {
        console.log('✅ Auto-selected default profile:', defaultProfile.profile_name);
        setFormData(prev => ({ ...prev, profile_id: defaultProfile.id }));
      }
    } catch (error) {
      console.error('❌ Error loading profiles:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/currencies`);
      const data = await response.json();
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/countries`);
      const data = await response.json();
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback countries
      setCountries([
        { code: 'TR', name: 'Türkiye' },
        { code: 'DE', name: 'Almanya' },
        { code: 'US', name: 'ABD' },
        { code: 'AE', name: 'BAE' }
      ]);
    }
  };

  const autoFillFromOpportunity = async () => {
    const opportunity = salesOpportunities.find(op => op.id === formData.sales_opportunity_id);
    if (!opportunity) return;
    
    setSelectedOpportunity(opportunity);
    
    // Fetch customer details
    if (opportunity.customer_id) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/customers/${opportunity.customer_id}`);
        const customer = await response.json();
        
        setFormData(prev => ({
          ...prev,
          customer_id: customer.id,
          company_name: customer.companyName || '',
          contact_person: customer.contactPerson || '',
          contact_email: customer.email || '',
          contact_phone: customer.phone || '',
          address: customer.address || '',
          project_name: opportunity.project_name || '',
          fair_center: opportunity.fair_center || '',
          city: opportunity.city || '',
          country: opportunity.country || '',
          hall_number: opportunity.hall_number || '',
          stand_number: opportunity.stand_number || '',
          stand_area: opportunity.stand_area || '',
          start_date: opportunity.start_date || '',
          end_date: opportunity.end_date || ''
        }));
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    }
  };

  const autoFillFromCustomer = async () => {
    const customer = customers.find(c => c.id === formData.customer_id);
    if (!customer) return;
    
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      company_name: customer.companyName || '',
      contact_person: customer.contactPerson || '',
      contact_email: customer.email || '',
      contact_phone: customer.phone || '',
      address: customer.address || ''
    }));
  };

  const autoFillFromProfile = () => {
    const profile = profiles.find(p => p.id === formData.profile_id);
    if (!profile || !profile.defaults) return;
    
    setFormData(prev => ({
      ...prev,
      page_orientation: profile.defaults.page_orientation || 'portrait',
      currency_code: profile.defaults.currency || 'EUR',
      language: profile.defaults.language || 'tr',
      validity_days: profile.defaults.validity_days || 30
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    // Profil zorunlu
    if (!formData.profile_id) {
      newErrors.profile_id = 'Teklif profili seçmelisiniz';
    }
    
    // Müşteri bilgileri zorunlu
    if (!formData.customer_id && !formData.company_name) {
      newErrors.customer_id = 'Müşteri seçmelisiniz veya firma adı girmelisiniz';
    }
    
    // Proje bilgileri zorunlu
    if (!formData.project_name) {
      newErrors.project_name = 'Proje/Fuar adı zorunludur';
    }
    if (!formData.city) {
      newErrors.city = 'Şehir zorunludur';
    }
    if (!formData.country) {
      newErrors.country = 'Ülke zorunludur';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Başlangıç tarihi zorunludur';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'Bitiş tarihi zorunludur';
    }
    
    // Tarih kontrolü
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
    }
    
    // Para birimi zorunlu
    if (!formData.currency_code) {
      newErrors.currency_code = 'Para birimi seçmelisiniz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== STEP 2: MODULE SELECTION ====================
  
  const loadModuleTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/module-templates`);
      const data = await response.json();
      
      // Group templates by module type
      const grouped = {};
      data.forEach(template => {
        if (!grouped[template.module_type]) {
          grouped[template.module_type] = [];
        }
        grouped[template.module_type].push(template);
      });
      
      setAvailableTemplates(grouped);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleAddModule = (moduleType) => {
    // Check if already added
    if (selectedModules.some(m => m.type === moduleType)) {
      return;
    }
    
    // Get module info
    let moduleInfo = null;
    Object.values(MODULE_CATEGORIES).forEach(cat => {
      const found = cat.modules.find(m => m.type === moduleType);
      if (found) moduleInfo = found;
    });
    
    if (!moduleInfo) return;
    
    // Get first template for this module type
    const templates = availableTemplates[moduleType] || [];
    const defaultTemplate = templates[0];
    
    const newModule = {
      id: Date.now().toString(),
      type: moduleType,
      name: moduleInfo.name,
      icon: moduleInfo.icon,
      template_id: defaultTemplate?.id || null,
      template_name: defaultTemplate?.template_name || 'Varsayılan',
      display_order: selectedModules.length + 1
    };
    
    setSelectedModules([...selectedModules, newModule]);
  };

  const handleRemoveModule = (index) => {
    const newModules = selectedModules.filter((_, i) => i !== index);
    // Update display orders
    newModules.forEach((m, i) => m.display_order = i + 1);
    setSelectedModules(newModules);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display orders
    items.forEach((item, index) => {
      item.display_order = index + 1;
    });
    
    setSelectedModules(items);
  };

  const handleChangeTemplate = (index, moduleType) => {
    setCurrentModuleIndex(index);
    setCurrentModuleType(moduleType);
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = (template) => {
    if (currentModuleIndex === null) return;
    
    const newModules = [...selectedModules];
    newModules[currentModuleIndex].template_id = template.id;
    newModules[currentModuleIndex].template_name = template.template_name;
    setSelectedModules(newModules);
    
    setShowTemplateModal(false);
    setCurrentModuleIndex(null);
    setCurrentModuleType(null);
  };

  const handleUseRecommended = () => {
    const recommended = RECOMMENDED_STRUCTURE.map((moduleType, index) => {
      let moduleInfo = null;
      Object.values(MODULE_CATEGORIES).forEach(cat => {
        const found = cat.modules.find(m => m.type === moduleType);
        if (found) moduleInfo = found;
      });
      
      if (!moduleInfo) return null;
      
      const templates = availableTemplates[moduleType] || [];
      const defaultTemplate = templates[0];
      
      return {
        id: Date.now().toString() + index,
        type: moduleType,
        name: moduleInfo.name,
        icon: moduleInfo.icon,
        template_id: defaultTemplate?.id || null,
        template_name: defaultTemplate?.template_name || 'Varsayılan',
        display_order: index + 1
      };
    }).filter(Boolean);
    
    setSelectedModules(recommended);
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm seçili modüller kaldırılacak. Emin misiniz?')) {
      setSelectedModules([]);
    }
  };

  const saveModulesToBackend = async () => {
    if (!proposalId) return;
    
    try {
      console.log('💾 Saving modules to backend...');
      
      // Save each module and update with backend ID
      const updatedModules = [];
      
      for (const module of selectedModules) {
        const response = await fetch(`${BACKEND_URL}/api/proposals/${proposalId}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_type: module.type,
            template_id: module.template_id,
            display_order: module.display_order
          })
        });
        
        if (response.ok) {
          const savedModule = await response.json();
          // Update module with backend ID
          updatedModules.push({
            ...module,
            backend_id: savedModule.id // Store backend ID separately
          });
        } else {
          updatedModules.push(module);
        }
      }
      
      setSelectedModules(updatedModules);
      console.log('✅ Modules saved successfully');
    } catch (error) {
      console.error('❌ Error saving modules:', error);
    }
  };

  const validateStep2 = () => {
    if (selectedModules.length === 0) {
      alert('En az bir modül seçmelisiniz');
      return false;
    }
    
    // Check if pricing module is included
    const hasPricing = selectedModules.some(m => m.type === 'pricing');
    if (!hasPricing) {
      const proceed = window.confirm(
        'Fiyatlandırma modülü seçilmedi. Bu olmadan devam etmek istiyor musunuz?'
      );
      if (!proceed) return false;
    }
    
    return true;
  };

  // ==================== STEP 3: CONTENT EDITING ====================
  
  const initializeModuleContents = () => {
    const contents = {};
    selectedModules.forEach(module => {
      contents[module.id] = getDefaultContent(module.type);
    });
    setModuleContents(contents);
  };

  const getDefaultContent = (moduleType) => {
    const defaults = {
      cover_page: {
        title: '{{project_name}}',
        subtitle: 'Teklif No: {{proposal_number}}',
        date_format: 'DD.MM.YYYY',
        show_prepared_for: true,
        show_prepared_by: true,
        show_validity: true,
        logo_position: 'center'
      },
      introduction: {
        title: 'Değerli İş Ortağımız',
        content: '<p>Sayın {{contact_person}},</p><p>{{project_name}} projesi kapsamında tarafınıza sunduğumuz bu teklif, ihtiyaçlarınız doğrultusunda özenle hazırlanmıştır.</p>'
      },
      about_company: {
        title: 'Hakkımızda',
        content: '',
        show_statistics: true,
        statistics: {
          founded_year: '',
          employee_count: '',
          project_count: '',
          country_count: ''
        }
      },
      included_services: {
        title: 'Teklife Dahil Hizmetler',
        intro: 'Aşağıdaki hizmetler dahildir:',
        items: []
      },
      excluded_services: {
        title: 'Teklife Dahil Olmayan Hizmetler',
        intro: 'Aşağıdaki hizmetler kapsam dışıdır:',
        items: []
      },
      payment_terms: {
        title: 'Ödeme Koşulları',
        intro: 'Ödeme aşağıdaki şekilde gerçekleştirilecektir:',
        schedule: [],
        show_bank_info: true,
        bank_info: {}
      },
      contact: {
        title: 'İletişim',
        subtitle: 'Sorularınız için bize ulaşın',
        use_profile: true,
        contact_person: {},
        company_info: {}
      }
    };
    
    return defaults[moduleType] || { title: '', content: '' };
  };

  const handleModuleContentChange = (moduleId, field, value) => {
    setModuleContents(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value
      }
    }));
    
    // Trigger auto-save
    triggerAutoSave(moduleId);
  };

  const triggerAutoSave = (moduleId) => {
    setSaveStatus('saving');
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      saveModuleContent(moduleId);
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };

  const saveModuleContent = async (moduleId) => {
    if (!proposalId) return;
    
    const module = selectedModules.find(m => m.id === moduleId);
    if (!module) return;
    
    const content = moduleContents[moduleId];
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/proposals/${proposalId}/modules/${module.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content
          })
        }
      );
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    }
  };

  const addListItem = (moduleId, listField) => {
    const module = moduleContents[moduleId];
    const currentItems = module[listField] || [];
    
    setModuleContents(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [listField]: [...currentItems, { id: Date.now(), text: '', checked: true }]
      }
    }));
  };

  const updateListItem = (moduleId, listField, itemId, updates) => {
    setModuleContents(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [listField]: prev[moduleId][listField].map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }
    }));
    
    triggerAutoSave(moduleId);
  };

  const removeListItem = (moduleId, listField, itemId) => {
    setModuleContents(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [listField]: prev[moduleId][listField].filter(item => item.id !== itemId)
      }
    }));
    
    triggerAutoSave(moduleId);
  };

  // ==================== STEP 4: PRICING ====================
  
  const addLineItem = () => {
    const newItem = {
      id: Date.now().toString(),
      category: '',
      description: '',
      details: '',
      quantity: 1,
      unit: 'adet',
      unit_price: 0,
      discount_type: 'none',
      discount_value: 0,
      item_type: 'standard',
      display_order: lineItems.length + 1
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (itemId, field, value) => {
    setLineItems(items => items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    calculatePricingSummary();
  };

  const removeLineItem = (itemId) => {
    setLineItems(items => items.filter(item => item.id !== itemId));
    calculatePricingSummary();
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    let discount = 0;
    
    if (item.discount_type === 'percentage') {
      discount = subtotal * (item.discount_value / 100);
    } else if (item.discount_type === 'fixed') {
      discount = item.discount_value;
    }
    
    return subtotal - discount;
  };

  const calculatePricingSummary = () => {
    const standardItems = lineItems.filter(item => item.item_type === 'standard');
    const optionalItems = lineItems.filter(item => item.item_type === 'optional');
    
    const subtotal = standardItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const optional_total = optionalItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    let discount = 0;
    if (generalDiscount.type === 'percentage') {
      discount = subtotal * (generalDiscount.value / 100);
    } else if (generalDiscount.type === 'fixed') {
      discount = generalDiscount.value;
    }
    
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxRate / 100);
    const total = afterDiscount + tax;
    
    setPricingSummary({
      subtotal,
      discount,
      tax,
      total,
      optional_total
    });
  };

  const saveLineItemsToBackend = async () => {
    if (!proposalId) return;
    
    try {
      // Delete existing line items first
      console.log('💾 Saving line items to backend...');
      
      // Save each line item
      for (const item of lineItems) {
        const payload = {
          item_type: item.item_type || 'standard',
          category: item.category || '',
          description: item.description,
          details: item.details || '',
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          discount_type: item.discount_type || 'none',
          discount_value: item.discount_value || 0,
          display_order: item.display_order
        };
        
        await fetch(`${BACKEND_URL}/api/proposals/${proposalId}/line-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      console.log('✅ Line items saved successfully');
    } catch (error) {
      console.error('❌ Error saving line items:', error);
    }
  };

  const updateProposalPricing = async () => {
    if (!proposalId) return;
    
    try {
      console.log('💾 Updating proposal pricing summary...');
      
      const payload = {
        pricing_summary: {
          subtotal: pricingSummary.subtotal,
          discount_type: generalDiscount.type,
          discount_value: generalDiscount.value,
          discount_amount: pricingSummary.discount,
          tax_rate: taxRate,
          tax_amount: pricingSummary.tax,
          total: pricingSummary.total
        }
      };
      
      await fetch(`${BACKEND_URL}/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('✅ Pricing summary updated');
    } catch (error) {
      console.error('❌ Error updating pricing:', error);
    }
  };

  // ==================== STEP 5: PREVIEW & SEND ====================
  
  const generatePublicLink = async () => {
    if (!proposalId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/proposals/${proposalId}/generate-link`, {
        method: 'POST'
      });
      
      const data = await response.json();
      setPublicLink(data.public_url);
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const sendProposal = async () => {
    if (!proposalId) return;
    
    if (!emailForm.to) {
      alert('Lütfen alıcı e-posta adresi girin');
      return;
    }
    
    const confirmed = window.confirm(
      `Teklifi ${emailForm.to} adresine göndermek istediğinize emin misiniz?`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/proposals/${proposalId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailForm.to,
          cc: emailForm.cc,
          subject: emailForm.subject,
          message: emailForm.message
        })
      });
      
      if (response.ok) {
        alert('✅ Teklif başarıyla gönderildi!');
        // Redirect to proposals list or detail page
      } else {
        alert('❌ Teklif gönderilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error sending proposal:', error);
      alert('❌ Teklif gönderilirken bir hata oluştu');
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
      
      // Save as draft
      try {
        const payload = {
          user_id: 'demo-user',
          profile_id: formData.profile_id,
          sales_opportunity_id: formData.sales_opportunity_id || null,
          customer_id: formData.customer_id || null,
          customer_snapshot: {
            company_name: formData.company_name,
            contact_person: formData.contact_person,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            address: formData.address
          },
          project_info: {
            project_name: formData.project_name,
            fair_name: formData.fair_center,
            fair_venue: formData.fair_center,
            fair_city: formData.city,
            fair_country: formData.country,
            hall_number: formData.hall_number,
            stand_number: formData.stand_number,
            stand_size: formData.stand_area ? `${formData.stand_area} ${formData.stand_area_unit}` : '',
            start_date: formData.start_date,
            end_date: formData.end_date
          },
          settings: {
            page_orientation: formData.page_orientation,
            currency: formData.currency_code,
            language: formData.language,
            validity_days: formData.validity_days
          },
          status: 'draft'
        };
        
        const response = await fetch(`${BACKEND_URL}/api/proposals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error('Teklif kaydedilemedi');
        }
        
        const proposal = await response.json();
        console.log('Proposal created:', proposal);
        
        // Store proposal ID for next steps
        setProposalId(proposal.id);
        
        // Load templates for step 2
        await loadModuleTemplates();
        
        setCurrentStep(2);
      } catch (error) {
        console.error('Error saving proposal:', error);
        alert('Teklif kaydedilirken bir hata oluştu: ' + error.message);
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
      
      // Save modules to backend
      await saveModulesToBackend();
      
      // Initialize module contents for step 3
      initializeModuleContents();
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // All content saved via auto-save, just proceed
      // Initialize email form with default values
      setEmailForm({
        to: formData.contact_email || '',
        cc: '',
        subject: `${formData.project_name} - Teklif`,
        message: `Sayın ${formData.contact_person || 'Yetkili'},\n\n${formData.project_name} projesi için hazırladığımız teklifi ekte bulabilirsiniz.\n\nSorularınız için bizimle iletişime geçebilirsiniz.`
      });
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Save line items to backend
      await saveLineItemsToBackend();
      
      // Update proposal pricing summary
      await updateProposalPricing();
      
      // Generate public link for preview
      await generatePublicLink();
      
      setCurrentStep(5);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                ${currentStep === step.id 
                  ? 'bg-blue-600 text-white' 
                  : currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div className={`mt-2 text-sm font-medium ${
                currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.name}
              </div>
              <div className="text-xs text-gray-400">Adım {step.id}</div>
            </div>
            
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-4 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Bölüm A: Teklif Kaynağı */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Teklif Nasıl Oluşturulacak?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Satış Fırsatından */}
          <div
            onClick={() => handleInputChange('creation_type', 'opportunity')}
            className={`
              p-6 border-2 rounded-lg cursor-pointer transition-all
              ${formData.creation_type === 'opportunity' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <FileText className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Satış Fırsatından Oluştur</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Mevcut bir satış fırsatını seçin. Müşteri ve proje bilgileri otomatik doldurulacak.
                </p>
                
                {formData.creation_type === 'opportunity' && (
                  <select
                    value={formData.sales_opportunity_id}
                    onChange={(e) => handleInputChange('sales_opportunity_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Satış Fırsatı Seçin</option>
                    {salesOpportunities.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.customer_name} - {op.project_name} ({op.fair_date})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          
          {/* Sıfırdan */}
          <div
            onClick={() => handleInputChange('creation_type', 'scratch')}
            className={`
              p-6 border-2 rounded-lg cursor-pointer transition-all
              ${formData.creation_type === 'scratch' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Sıfırdan Oluştur</h4>
                <p className="text-sm text-gray-600">
                  Tüm bilgileri manuel girin. Teklif gönderildiğinde otomatik satış fırsatı oluşturulacak.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bölüm B: Teklif Profili */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Teklif Profili</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={formData.profile_id}
              onChange={(e) => handleInputChange('profile_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.profile_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Profil Seçin</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.profile_name} ({profile.company_info.name})
                </option>
              ))}
            </select>
            {errors.profile_id && (
              <p className="text-sm text-red-600 mt-1">{errors.profile_id}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.alert('Yeni profil oluşturma modal açılacak')}
          >
            Yeni Profil Oluştur
          </Button>
        </div>
      </div>

      {/* Bölüm C & D: Müşteri ve Proje Bilgileri (2 kolon) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Müşteri Bilgileri */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Müşteri Bilgileri</h3>
            
            <div className="space-y-4">
              {formData.creation_type === 'scratch' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Seçimi</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={formData.creation_type === 'opportunity'}
                  >
                    <option value="">Müşteri Seçin veya Manuel Girin</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.customer_id}</p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proje/Fuar Bilgileri */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Proje Bilgileri</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proje/Fuar Adı *</label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.project_name ? 'border-red-500' : 'border-gray-300'
                  } ${formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''}`}
                  disabled={formData.creation_type === 'opportunity'}
                />
                {errors.project_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.project_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuar Merkezi</label>
                <input
                  type="text"
                  placeholder="Messe Frankfurt"
                  value={formData.fair_center}
                  onChange={(e) => handleInputChange('fair_center', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''
                  }`}
                  disabled={formData.creation_type === 'opportunity'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    } ${formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''}`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    } ${formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''}`}
                    disabled={formData.creation_type === 'opportunity'}
                  >
                    <option value="">Seçin</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="text-sm text-red-600 mt-1">{errors.country}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salon No</label>
                  <input
                    type="text"
                    placeholder="Hall 5"
                    value={formData.hall_number}
                    onChange={(e) => handleInputChange('hall_number', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''
                    }`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stand No</label>
                  <input
                    type="text"
                    placeholder="A-120"
                    value={formData.stand_number}
                    onChange={(e) => handleInputChange('stand_number', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''
                    }`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stand Alanı</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.stand_area}
                    onChange={(e) => handleInputChange('stand_area', e.target.value)}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''
                    }`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                  <select
                    value={formData.stand_area_unit}
                    onChange={(e) => handleInputChange('stand_area_unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="m²">m²</option>
                    <option value="sqft">sqft</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? 'border-red-500' : 'border-gray-300'
                    } ${formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''}`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.end_date ? 'border-red-500' : 'border-gray-300'
                    } ${formData.creation_type === 'opportunity' ? 'bg-gray-50' : ''}`}
                    disabled={formData.creation_type === 'opportunity'}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bölüm E: Teklif Ayarları */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Teklif Ayarları</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa Yönü</label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="page_orientation"
                    value="portrait"
                    checked={formData.page_orientation === 'portrait'}
                    onChange={(e) => handleInputChange('page_orientation', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Dikey</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="page_orientation"
                    value="landscape"
                    checked={formData.page_orientation === 'landscape'}
                    onChange={(e) => handleInputChange('page_orientation', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Yatay</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi *</label>
              <select
                value={formData.currency_code}
                onChange={(e) => handleInputChange('currency_code', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currency_code ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seçin</option>
                {currencies.filter(c => c.is_popular).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
                <option disabled>────────────</option>
                {currencies.filter(c => !c.is_popular).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.currency_code && (
                <p className="text-sm text-red-600 mt-1">{errors.currency_code}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Geçerlilik Süresi *</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={formData.validity_days}
                onChange={(e) => handleInputChange('validity_days', parseInt(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">gün</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => {
    // Get all modules grouped
    const allModules = [];
    Object.entries(MODULE_CATEGORIES).forEach(([catKey, category]) => {
      category.modules.forEach(module => {
        const templates = availableTemplates[module.type] || [];
        const isSelected = selectedModules.some(m => m.type === module.type);
        allModules.push({
          ...module,
          category: category.name,
          templateCount: templates.length,
          isSelected
        });
      });
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Module Library */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Kullanılabilir Modüller</h3>
            <p className="text-sm text-gray-500 mb-4">Eklemek istediğiniz modüllere tıklayın</p>
            
            <div className="space-y-6">
              {Object.entries(MODULE_CATEGORIES).map(([catKey, category]) => (
                <div key={catKey}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                    {category.name}
                  </h4>
                  <div className="space-y-2">
                    {category.modules.map(module => {
                      const templates = availableTemplates[module.type] || [];
                      const isSelected = selectedModules.some(m => m.type === module.type);
                      
                      return (
                        <div
                          key={module.type}
                          className={`p-3 border rounded-lg transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'hover:border-gray-400 hover:shadow-sm'
                          }`}
                          onClick={() => !isSelected && handleAddModule(module.type)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{module.icon}</span>
                                  <span className="font-medium text-sm">{module.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {templates.length} şablon mevcut
                                </p>
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="text-xs text-green-600 font-medium">Eklendi ✓</span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddModule(module.type);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Selected Modules */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Teklif Yapısı</h3>
                <p className="text-sm text-gray-500">Modülleri sürükleyerek sıralayın</p>
              </div>
              <div className="flex space-x-2">
                {selectedModules.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Tümünü Kaldır
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseRecommended}
                >
                  Önerilen Yapı
                </Button>
              </div>
            </div>

            {selectedModules.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">Henüz modül seçilmedi</p>
                <p className="text-sm text-gray-500 mb-4">
                  Soldan modül ekleyin veya hazır bir şablon kullanın
                </p>
                <Button
                  variant="outline"
                  onClick={handleUseRecommended}
                >
                  Önerilen Yapıyı Kullan
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {selectedModules.map((module, index) => (
                        <Draggable
                          key={module.id}
                          draggableId={module.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 bg-white border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-bold text-gray-500">
                                        {index + 1}.
                                      </span>
                                      <span className="text-lg">{module.icon}</span>
                                      <span className="font-medium">{module.name}</span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveModule(index)}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                      └─ Şablon: {module.template_name}
                                    </span>
                                    <button
                                      onClick={() => handleChangeTemplate(index, module.type)}
                                      className="text-blue-600 hover:text-blue-700 text-xs"
                                    >
                                      Değiştir
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {selectedModules.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 İpucu: Modülleri sürükleyerek sırasını değiştirebilirsiniz
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Selection Modal */}
        {showTemplateModal && currentModuleType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {MODULE_CATEGORIES[Object.keys(MODULE_CATEGORIES).find(k => 
                    MODULE_CATEGORIES[k].modules.some(m => m.type === currentModuleType)
                  )]?.modules.find(m => m.type === currentModuleType)?.name} Şablonu Seçin
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(availableTemplates[currentModuleType] || []).map(template => {
                  const currentModule = selectedModules[currentModuleIndex];
                  const isSelected = currentModule?.template_id === template.id;
                  
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{template.template_name}</span>
                        <input
                          type="radio"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4"
                        />
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateModal(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={() => setShowTemplateModal(false)}
                >
                  Şablonu Seç
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    if (selectedModules.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Modül seçilmedi. Lütfen önceki adıma dönün.</p>
        </div>
      );
    }

    const activeModule = selectedModules[activeModuleIndex];
    const content = moduleContents[activeModule?.id] || {};
    const completedCount = Object.keys(moduleContents).length;

    return (
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar: Module List */}
        <div className="col-span-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Modüller</h3>
              <div className="space-y-1">
                {selectedModules.map((module, index) => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModuleIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      index === activeModuleIndex
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={index === activeModuleIndex ? '●' : '○'}>
                        {index === activeModuleIndex ? '●' : '○'}
                      </span>
                      <span className="flex-1">
                        {index + 1}. {module.name}
                      </span>
                      {moduleContents[module.id] && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>İlerleme</span>
                  <span>{completedCount}/{selectedModules.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(completedCount / selectedModules.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Content Editor */}
        <div className="col-span-9">
          <Card>
            <CardContent className="pt-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{activeModule.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Şablon: {activeModule.template_name}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-sm ${
                    saveStatus === 'saved' ? 'text-green-600' :
                    saveStatus === 'saving' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {saveStatus === 'saved' ? '✓ Kaydedildi' :
                     saveStatus === 'saving' ? 'Kaydediliyor...' :
                     'Kaydetme hatası'}
                  </div>
                </div>
              </div>

              {/* Module-specific forms */}
              {activeModule.type === 'cover_page' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık *</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="{{project_name}}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Değişkenler: {' '}
                      <span className="text-blue-600 cursor-pointer">{'{{project_name}}'}</span>,{' '}
                      <span className="text-blue-600 cursor-pointer">{'{{fair_name}}'}</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Alt Başlık</label>
                    <input
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Teklif No: {{proposal_number}}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Logo Pozisyonu</label>
                    <div className="flex space-x-4">
                      {['center', 'left', 'right'].map(pos => (
                        <label key={pos} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="logo_position"
                            value={pos}
                            checked={content.logo_position === pos}
                            onChange={(e) => handleModuleContentChange(activeModule.id, 'logo_position', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{pos === 'center' ? 'Orta' : pos === 'left' ? 'Sol' : 'Sağ'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeModule.type === 'introduction' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">İçerik *</label>
                    <textarea
                      value={content.content || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'content', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      placeholder="Giriş metninizi yazın..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Kullanılabilir değişkenler: {"{contact_person}"}, {"{project_name}"}, {"{company_name}"}
                    </p>
                  </div>
                </div>
              )}

              {(activeModule.type === 'included_services' || activeModule.type === 'excluded_services') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Giriş Metni</label>
                    <input
                      type="text"
                      value={content.intro || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'intro', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Hizmet Listesi</label>
                    <div className="space-y-2">
                      {(content.items || []).map((item, idx) => (
                        <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => updateListItem(activeModule.id, 'items', item.id, { checked: e.target.checked })}
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateListItem(activeModule.id, 'items', item.id, { text: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            placeholder="Hizmet açıklaması"
                          />
                          <button
                            onClick={() => removeListItem(activeModule.id, 'items', item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addListItem(activeModule.id, 'items')}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 text-sm"
                      >
                        + Yeni Hizmet Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeModule.type === 'payment_terms' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Giriş Metni</label>
                    <input
                      type="text"
                      value={content.intro || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'intro', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={content.show_bank_info}
                        onChange={(e) => handleModuleContentChange(activeModule.id, 'show_bank_info', e.target.checked)}
                      />
                      <span className="text-sm font-medium">Banka Bilgilerini Göster</span>
                    </label>
                  </div>
                </div>
              )}

              {activeModule.type === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Alt Başlık</label>
                    <input
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={content.use_profile}
                        onChange={(e) => handleModuleContentChange(activeModule.id, 'use_profile', e.target.checked)}
                      />
                      <span className="text-sm">Profilden otomatik al</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Generic form for other modules */}
              {!['cover_page', 'introduction', 'included_services', 'excluded_services', 'payment_terms', 'contact'].includes(activeModule.type) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlık</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">İçerik</label>
                    <textarea
                      value={content.content || ''}
                      onChange={(e) => handleModuleContentChange(activeModule.id, 'content', e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Modül içeriğini yazın..."
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons within editor */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIndex(Math.max(0, activeModuleIndex - 1))}
                  disabled={activeModuleIndex === 0}
                >
                  ← Önceki Modül
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIndex(Math.min(selectedModules.length - 1, activeModuleIndex + 1))}
                  disabled={activeModuleIndex === selectedModules.length - 1}
                >
                  Sonraki Modül →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const formatCurrency = (amount) => {
      const symbol = formData.currency_code === 'EUR' ? '€' : 
                     formData.currency_code === 'USD' ? '$' :
                     formData.currency_code === 'TRY' ? '₺' : '€';
      return `${symbol}${amount.toFixed(2)}`;
    };

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span>📋 Teklif No: PRO-{proposalId?.slice(0, 8)}</span>
                <span>🏢 {formData.company_name}</span>
                <span>🎪 {formData.project_name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Para Birimi: {formData.currency_code}</span>
                <span>KDV: %{taxRate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fiyat Kalemleri</h3>
              <Button onClick={addLineItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Henüz fiyat kalemi eklenmedi</p>
                <Button onClick={addLineItem} variant="outline">
                  İlk Kalemi Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Kalem adı"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => updateLineItem(item.id, 'details', e.target.value)}
                          placeholder="Açıklama"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="adet">adet</option>
                          <option value="m²">m²</option>
                          <option value="m">m</option>
                          <option value="set">set</option>
                          <option value="gün">gün</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(calculateItemTotal(item))}
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between text-lg">
                <span>Ara Toplam:</span>
                <span className="font-medium">{formatCurrency(pricingSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>KDV (%{taxRate}):</span>
                <span className="font-medium">{formatCurrency(pricingSummary.tax)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold border-t pt-3">
                <span>GENEL TOPLAM:</span>
                <span>{formatCurrency(pricingSummary.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStep5 = () => {
    return (
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Preview Area */}
        <div className="col-span-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Teklif Önizleme</h3>
              <div className="border-2 border-dashed rounded-lg p-12 text-center bg-gray-50">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">PDF Önizleme</p>
                <p className="text-sm text-gray-500">
                  {selectedModules.length} modül • {lineItems.length} kalem
                </p>
                <Button variant="outline" className="mt-4">
                  PDF İndir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Send Panel */}
        <div className="col-span-4">
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">📋 Teklif Özeti</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium">{formData.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proje:</span>
                    <span className="font-medium">{formData.project_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam:</span>
                    <span className="font-bold text-lg">{formData.currency_code} {pricingSummary.total.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-yellow-600">🟡 Taslak</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Send */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">📧 E-posta ile Gönder</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Alıcı *</label>
                    <input
                      type="email"
                      value={emailForm.to}
                      onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Konu</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mesaj</label>
                    <textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                      rows={5}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <Button onClick={sendProposal} className="w-full">
                    📧 E-posta Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Online Link */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">🔗 Online Link</h3>
                {!publicLink ? (
                  <Button onClick={generatePublicLink} variant="outline" className="w-full">
                    Link Oluştur
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-100 rounded text-xs break-all">
                      {publicLink}
                    </div>
                    <Button 
                      onClick={() => navigator.clipboard.writeText(publicLink)}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      📋 Kopyala
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Teklif Oluştur</h1>
            <p className="text-gray-600 mt-1">Adım {currentStep}/5 - {WIZARD_STEPS[currentStep - 1].name}</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            İptal
          </Button>
        </div>

        {/* Stepper */}
        {renderStepper()}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={loading}
          >
            {currentStep === 5 ? 'Teklifi Tamamla' : 'Devam Et'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewProposalWizard;
