import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import FileUpload from '../ui/FileUpload';
import { GetCountries, GetState } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import { 
  X,
  Target,
  DollarSign,
  User,
  Building2,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  Globe,
  TrendingUp,
  Plus
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function NewOpportunityFormPage({ onClose, onSave }) {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  
  // Check if user is admin or super admin
  const isAdminOrSuperAdmin = user && (user.role === 'admin' || user.role === 'super-admin');
  
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    contactPerson: '',
    amount: '',
    currency: 'TRY',
    status: 'open',
    stage: 'lead',
    priority: 'medium',
    closeDate: '',
    source: '',
    description: '',
    businessType: '',
    projectType: '',
    country: '',
    city: '',
    tradeShow: '',
    tradeShowStartDate: '',
    tradeShowEndDate: '',
    standSize: '',
    standSizeUnit: 'm2',
    expectedRevenue: '',
    designFiles: [],
    sampleFiles: [],
    probability: '50',
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOpportunityInfo, setCreatedOpportunityInfo] = useState(null);
  
  // Dynamic data states
  const [customers, setCustomers] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fairs, setFairs] = useState([]);
  const [dynamicStatuses, setDynamicStatuses] = useState([]);
  const [dynamicStages, setDynamicStages] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  
  // Countries and cities from react-country-state-city library
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  
  // Realistic test data samples
  const testDataSamples = {
    titles: [
      'Mobilya İhracat Projesi',
      'Tekstil Ürünleri Tedarik Anlaşması', 
      'Gıda Ürünleri Distribütörlüğü',
      'Makine Ekipman Satışı',
      'Turizm Tesisi Konsept Geliştirme',
      'Restoran Zinciri Franchise Anlaşması',
      'Otomotiv Yan Sanayi Tedarik',
      'İnşaat Malzemeleri Toptan Satış'
    ],
    sources: ['trade-show', 'referral', 'website', 'cold-call', 'partner'],
    businessTypes: ['b2b', 'b2c', 'retail', 'wholesale', 'manufacturing'],
    descriptions: [
      'Müşteri firmanın yıllık ihtiyaçlarını karşılayacak kapsamlı bir tedarik anlaşması.',
      'Uzun vadeli iş birliği potansiyeli olan stratejik proje.',
      'Bölgesel distribütörlük anlaşması görüşmeleri devam ediyor.',
      'Fuar görüşmesinde tanışılan firma ile somut teklif aşamasına gelindi.'
    ],
    amounts: ['50000', '125000', '250000', '500000', '750000', '1000000'],
    tradeshows: [
      'İstanbul Mobilya Fuarı 2025',
      'Bursa Tekstil Expo',
      'İzmir Gıda Teknolojileri Fuarı',
      'Ankara İnşaat ve Yapı Malzemeleri'
    ]
  };
  
  // Static options
  const currencies = [
    { value: 'TRY', label: '₺ Türk Lirası' },
    { value: 'USD', label: '$ ABD Doları' },
    { value: 'EUR', label: '€ Euro' },
    { value: 'GBP', label: '£ İngiliz Sterlini' }
  ];

  const statuses = [
    { value: 'open', label: 'Açık' },
    { value: 'qualified', label: 'Nitelikli' },
    { value: 'proposal', label: 'Teklif Aşamasında' },
    { value: 'negotiation', label: 'Görüşme Aşamasında' },
    { value: 'closed-won', label: 'Kazanıldı' },
    { value: 'closed-lost', label: 'Kaybedildi' }
  ];

  const stages = [
    { value: 'lead', label: 'Potansiyel Müşteri' },
    { value: 'contact', label: 'İletişim Kuruldu' },
    { value: 'demo', label: 'Demo/Sunum' },
    { value: 'proposal', label: 'Teklif Hazırlandı' },
    { value: 'negotiation', label: 'Pazarlık' },
    { value: 'closing', label: 'Kapanış' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' }
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referans' },
    { value: 'cold-call', label: 'Soğuk Arama' },
    { value: 'trade-show', label: 'Ticaret Fuarı' },
    { value: 'social-media', label: 'Sosyal Medya' },
    { value: 'email', label: 'E-posta Kampanyası' },
    { value: 'partner', label: 'İş Ortağı' },
    { value: 'other', label: 'Diğer' }
  ];

  // Load customers, fairs, statuses, stages, project types and countries on component mount
  useEffect(() => {
    loadCustomers();
    loadFairs();
    loadStatuses();
    loadStages();
    loadProjectTypes();
  }, []);

  const loadCustomers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        console.log('Customers loaded for opportunities:', data);
        setCustomers(data);
      } else {
        console.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadFairs = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/fairs`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fairs loaded for opportunities:', data);
        setFairs(data);
      } else {
        console.error('Failed to load fairs');
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
    }
  };

  const loadStatuses = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/opportunity-statuses`);
      if (response.ok) {
        const data = await response.json();
        console.log('Dynamic statuses loaded:', data);
        setDynamicStatuses(data);
      } else {
        console.error('Failed to load statuses');
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const loadStages = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/opportunity-stages`);
      if (response.ok) {
        const data = await response.json();
        console.log('Dynamic stages loaded:', data);
        setDynamicStages(data);
      } else {
        console.error('Failed to load stages');
      }
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const loadProjectTypes = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/project-types`);
      if (response.ok) {
        const data = await response.json();
        console.log('Project types loaded:', data);
        setProjectTypes(data);
      } else {
        console.error('Failed to load project types');
      }
    } catch (error) {
      console.error('Error loading project types:', error);
    }
  };

  // Load countries from library (SAME AS NewCustomerForm)
  // Load countries from react-country-state-city library
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countries = await GetCountries();
        setCountriesList(countries);
        
        // Find Turkey by default (code: TR)
        const turkey = countries.find(c => c.iso2 === 'TR');
        if (turkey) {
          setSelectedCountryId(turkey.id);
          handleInputChange('country', turkey.name);
          loadStates(turkey.id);
        }
      } catch (error) {
        console.error('Ülkeler yüklenemedi:', error);
      }
    };
    
    loadCountries();
  }, []);
  
  // Load states/cities when country changes
  const loadStates = async (countryId) => {
    try {
      const states = await GetState(countryId);
      setStatesList(states);
    } catch (error) {
      console.error('Şehirler yüklenemedi:', error);
      setStatesList([]);
    }
  };
  
  // Handle country change
  const handleCountryChange = (countryName) => {
    const selectedCountry = countriesList.find(c => c.name === countryName);
    
    if (selectedCountry) {
      setSelectedCountryId(selectedCountry.id);
      handleInputChange('country', selectedCountry.name);
      handleInputChange('city', ''); // Clear city
      loadStates(selectedCountry.id);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle stand size input - only numbers, max 4 digits
  const handleStandSizeChange = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to 4 digits
    const limitedValue = numericValue.slice(0, 4);
    
    setFormData(prev => ({
      ...prev,
      standSize: limitedValue
    }));
  };

  // Handle country change and load cities
  // Country and city change handled by useEffect above

  // Handle status change with new status creation
  const handleStatusChange = async (value) => {
    if (value === 'add_new_status') {
      const newStatus = prompt('Yeni durum adını girin:');
      if (newStatus && newStatus.trim()) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
          const response = await fetch(`${backendUrl}/api/opportunity-statuses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              label: newStatus.trim(),
              description: ''
            }),
          });

          if (response.ok) {
            const savedStatus = await response.json();
            console.log('New status created:', savedStatus);
            
            // Update the dynamic statuses list
            setDynamicStatuses(prev => [...prev, savedStatus]);
            
            // Set the new status as selected
            setFormData(prev => ({
              ...prev,
              status: savedStatus.value
            }));
            
            toast({
              title: "Başarılı",
              description: `"${newStatus}" durumu başarıyla eklendi`,
              variant: "default"
            });
          } else {
            const errorData = await response.json();
            toast({
              title: "Hata",
              description: errorData.detail || "Durum eklenirken hata oluştu",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error creating status:', error);
          toast({
            title: "Hata",
            description: "Durum eklenirken hata oluştu",
            variant: "destructive"
          });
        }
      }
    } else {
      handleInputChange('status', value);
    }
  };

  // Handle stage change with new stage creation
  const handleStageChange = async (value) => {
    if (value === 'add_new_stage') {
      const newStage = prompt('Yeni aşama adını girin:');
      if (newStage && newStage.trim()) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
          const response = await fetch(`${backendUrl}/api/opportunity-stages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              label: newStage.trim(),
              description: ''
            }),
          });

          if (response.ok) {
            const savedStage = await response.json();
            console.log('New stage created:', savedStage);
            
            // Update the dynamic stages list
            setDynamicStages(prev => [...prev, savedStage]);
            
            // Set the new stage as selected
            setFormData(prev => ({
              ...prev,
              stage: savedStage.value
            }));
            
            toast({
              title: "Başarılı",
              description: `"${newStage}" aşaması başarıyla eklendi`,
              variant: "default"
            });
          } else {
            const errorData = await response.json();
            toast({
              title: "Hata",
              description: errorData.detail || "Aşama eklenirken hata oluştu",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error creating stage:', error);
          toast({
            title: "Hata",
            description: "Aşama eklenirken hata oluştu",
            variant: "destructive"
          });
        }
      }
    } else {
      handleInputChange('stage', value);
    }
  };

  // Handle project type change with new project type creation
  const handleProjectTypeChange = async (value) => {
    if (value === 'add_new_project_type') {
      const newProjectType = prompt('Yeni proje türü adını girin:');
      if (newProjectType && newProjectType.trim()) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
          const response = await fetch(`${backendUrl}/api/project-types`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              label: newProjectType.trim(),
              description: ''
            }),
          });

          if (response.ok) {
            const savedProjectType = await response.json();
            console.log('New project type created:', savedProjectType);
            
            // Update the project types list
            setProjectTypes(prev => [...prev, savedProjectType]);
            
            // Set the new project type as selected
            setFormData(prev => ({
              ...prev,
              projectType: savedProjectType.value
            }));
            
            toast({
              title: "Başarılı",
              description: `"${newProjectType}" proje türü başarıyla eklendi`,
              variant: "default"
            });
          } else {
            const errorData = await response.json();
            toast({
              title: "Hata",
              description: errorData.detail || "Proje türü eklenirken hata oluştu",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error creating project type:', error);
          toast({
            title: "Hata",
            description: "Proje türü eklenirken hata oluştu",
            variant: "destructive"
          });
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        projectType: value
      }));
    }
  };

  // Handle customer selection and update available contacts
  const handleCustomerChange = (customerName) => {
    // Find the selected customer object by company name
    const customer = customers.find(c => 
      (c.companyName || c.companyTitle || '') === customerName
    );
    
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer: customerName,
      contactPerson: '' // Reset contact person when customer changes
    }));

    // Update available contacts for this customer
    if (customer) {
      const contacts = [];
      
      // Add main contact person if exists
      if (customer.contactPerson || customer.contact_person) {
        contacts.push({
          name: customer.contactPerson || customer.contact_person,
          title: customer.contactTitle || 'Ana İletişim',
          email: customer.email,
          phone: customer.phone
        });
      }

      // Add additional contacts if they exist (assuming they might be in an array)
      if (customer.additionalContacts && Array.isArray(customer.additionalContacts)) {
        customer.additionalContacts.forEach(contact => {
          contacts.push({
            name: contact.name,
            title: contact.title || 'İletişim Kişisi',
            email: contact.email,
            phone: contact.phone
          });
        });
      }

      setAvailableContacts(contacts);
      console.log('🔄 Available contacts for', customerName, ':', contacts);
    } else {
      setAvailableContacts([]);
    }
  };

  // Fill form with realistic test data
  const fillTestData = () => {
    const randomTitle = testDataSamples.titles[Math.floor(Math.random() * testDataSamples.titles.length)];
    const randomSource = testDataSamples.sources[Math.floor(Math.random() * testDataSamples.sources.length)];
    const randomBusinessType = testDataSamples.businessTypes[Math.floor(Math.random() * testDataSamples.businessTypes.length)];
    const randomDescription = testDataSamples.descriptions[Math.floor(Math.random() * testDataSamples.descriptions.length)];
    const randomAmount = testDataSamples.amounts[Math.floor(Math.random() * testDataSamples.amounts.length)];
    const randomTradeshow = testDataSamples.tradeshows[Math.floor(Math.random() * testDataSamples.tradeshows.length)];
    
    // Generate close date (2-6 months from now)
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + Math.floor(Math.random() * 4) + 2);
    const closeDate = futureDate.toISOString().split('T')[0];
    
    // Generate tradeshow dates (1-2 months from now)
    const tradeshowStart = new Date(today);
    tradeshowStart.setMonth(today.getMonth() + Math.floor(Math.random() * 2) + 1);
    const tradeshowEnd = new Date(tradeshowStart);
    tradeshowEnd.setDate(tradeshowStart.getDate() + 4);
    
    const newFormData = {
      ...formData,
      title: randomTitle,
      customer: customers.length > 0 ? customers[Math.floor(Math.random() * customers.length)].companyName : 'Örnek Müşteri A.Ş.',
      amount: randomAmount,
      currency: ['TRY', 'USD', 'EUR'][Math.floor(Math.random() * 3)],
      status: ['open', 'qualified', 'proposal'][Math.floor(Math.random() * 3)],
      stage: ['lead', 'contact', 'demo', 'proposal'][Math.floor(Math.random() * 4)],
      priority: ['medium', 'high'][Math.floor(Math.random() * 2)],
      closeDate: closeDate,
      source: randomSource,
      description: randomDescription,
      businessType: randomBusinessType,
      projectType: projectTypes.length > 0 ? projectTypes[Math.floor(Math.random() * projectTypes.length)].value : 'standard',
      country: 'Türkiye',
      city: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'][Math.floor(Math.random() * 5)],
      tradeShow: randomTradeshow,
      tradeShowStartDate: tradeshowStart.toISOString().split('T')[0],
      tradeShowEndDate: tradeshowEnd.toISOString().split('T')[0],
      standSize: String(Math.floor(Math.random() * 80) + 20),
      standSizeUnit: 'm2',
      expectedRevenue: String(parseInt(randomAmount) * (1 + Math.random() * 0.5)),
      probability: String(Math.floor(Math.random() * 40) + 40)
    };
    
    setFormData(newFormData);
    
    // If customer is selected, load contacts
    if (customers.length > 0) {
      const selectedCust = customers[Math.floor(Math.random() * customers.length)];
      setFormData(prev => ({ ...prev, customer: selectedCust.companyName }));
      handleCustomerChange(selectedCust.companyName);
    }
    
    toast({
      title: "Başarılı",
      description: "Gerçekçi test verisi dolduruldu",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation - required fields for opportunity
    const requiredFieldsValid = formData.title.trim() && formData.customer.trim() && 
        formData.amount.trim() && formData.closeDate.trim() && formData.stage.trim();
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: "Zorunlu alanları doldurunuz: Başlık, Müşteri, Tutar, Kapanış Tarihi, Aşama",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Format opportunity data for backend
      const opportunityData = {
        title: formData.title,
        customer: formData.customer,
        contact_person: formData.contactPerson,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        status: formData.status,
        stage: formData.stage,
        priority: formData.priority,
        close_date: formData.closeDate,
        source: formData.source,
        description: formData.description,
        design_files: formData.designFiles.map(f => f.id),
        sample_files: formData.sampleFiles.map(f => f.id),
        business_type: formData.businessType,
        country: formData.country,
        city: formData.city,
        trade_show: formData.tradeShow,
        trade_show_start_date: formData.tradeShowStartDate,
        trade_show_end_date: formData.tradeShowEndDate,
        stand_size: formData.standSize,
        stand_size_unit: formData.standSizeUnit,
        expected_revenue: parseFloat(formData.expectedRevenue) || parseFloat(formData.amount) || 0,
        probability: parseInt(formData.probability) || 50,
        created_at: new Date().toISOString(),
        tags: formData.tags || []
      };

      const response = await fetch(`${backendUrl}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Opportunity saved:', savedData);

        // Set success state with opportunity info
        const allStages = [...stages, ...dynamicStages];
        const selectedStage = allStages.find(s => s.value === formData.stage);
        
        setCreatedOpportunityInfo({
          title: formData.title,
          customer: formData.customer,
          amount: `${formData.amount} ${formData.currency}`,
          stage: selectedStage?.label || formData.stage
        });
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to save opportunity:', errorData);
        toast({
          title: "Hata",
          description: "Satış fırsatı kaydedilirken hata oluştu: " + (errorData.detail || "Bilinmeyen hata"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting opportunity form:', error);
      toast({
        title: "Hata",
        description: "Satış fırsatı kaydedilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-600" />
              <span>Yeni Satış Fırsatı</span>
            </h1>
            <p className="text-gray-600 mt-1">Satış fırsatı detayları ve takip bilgileri</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={fillTestData}
              className="px-6 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerçekçi Veri Doldur
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Kapat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-6">
        
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Temel Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Başlık */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fırsat Başlığı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Satış fırsatı başlığı"
                  />
                </div>

                {/* Müşteri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Müşteri <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.customer}
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(customer => (customer.companyName || customer.companyTitle || '').trim() !== '')
                        .map((customer) => {
                          const companyName = customer.companyName || customer.companyTitle || `Customer ${customer.id}`;
                          return (
                            <SelectItem key={customer.id} value={companyName}>
                              {companyName}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* İletişim Kişisi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İletişim Kişisi
                  </label>
                  <Select
                    value={formData.contactPerson}
                    onValueChange={(value) => handleInputChange('contactPerson', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        formData.customer 
                          ? (availableContacts.length > 0 
                              ? "İletişim kişisi seçiniz..." 
                              : "Bu müşteri için kayıtlı iletişim kişisi bulunamadı") 
                          : "Önce müşteri seçiniz..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContacts.length > 0 ? (
                        availableContacts.map((contact, index) => (
                          <SelectItem key={index} value={contact.name}>
                            {contact.name}
                          </SelectItem>
                        ))
                      ) : formData.customer ? (
                        <SelectItem value="manual" disabled>
                          Bu müşteri için kayıtlı iletişim kişisi yok
                        </SelectItem>
                      ) : (
                        <SelectItem value="select-customer" disabled>
                          Önce bir müşteri seçin
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Manual entry option */}
                  {formData.customer && availableContacts.length === 0 && (
                    <div className="mt-2">
                      <Input
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        placeholder="İletişim kişisini manuel olarak girin"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Kaynak */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fırsat Kaynağı
                  </label>
                  <Select 
                    value={formData.source}
                    onValueChange={(value) => handleInputChange('source', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kaynak seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proje Türü */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proje Türü
                  </label>
                  <Select 
                    value={formData.projectType}
                    onValueChange={handleProjectTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Proje türü seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Dynamic project types */}
                      {projectTypes.map((projectType) => (
                        <SelectItem key={projectType.value} value={projectType.value}>
                          {projectType.label}
                        </SelectItem>
                      ))}
                      
                      {/* Add new project type option for admin users */}
                      {user && (user.role === 'admin' || user.role === 'super-admin') && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <SelectItem value="add_new_project_type" className="text-blue-600 font-medium">
                            <div className="flex items-center space-x-2">
                              <Plus className="h-4 w-4" />
                              <span>Yeni Proje Türü Ekle</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finansal Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Finansal Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tutar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tutar <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Para Birimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Para Birimi
                  </label>
                  <Select 
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Para birimi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gerçekleşme Olasılığı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olasılık (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Beklenen Gelir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beklenen Gelir
                </label>
                <Input
                  type="number"
                  value={formData.expectedRevenue}
                  onChange={(e) => handleInputChange('expectedRevenue', e.target.value)}
                  placeholder="Beklenen gelir miktarı (opsiyonel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Süreç Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Süreç Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Durum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <Select 
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Static statuses */}
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                      
                      {/* Dynamic statuses from backend */}
                      {dynamicStatuses.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          {dynamicStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {isAdminOrSuperAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <SelectItem value="add_new_status" className="text-blue-600 font-medium">
                            <div className="flex items-center space-x-2">
                              <Plus className="h-4 w-4" />
                              <span>Yeni Durum Ekle</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aşama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aşama <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.stage}
                    onValueChange={handleStageChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aşama seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Static stages */}
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                      
                      {/* Dynamic stages from backend */}
                      {dynamicStages.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          {dynamicStages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {isAdminOrSuperAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <SelectItem value="add_new_stage" className="text-blue-600 font-medium">
                            <div className="flex items-center space-x-2">
                              <Plus className="h-4 w-4" />
                              <span>Yeni Aşama Ekle</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Öncelik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kapanış Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beklenen Kapanış Tarihi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleInputChange('closeDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lokasyon ve Fuar Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Lokasyon ve Fuar Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ülke */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ülke
                  </label>
                  <Select
                    value={formData.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçiniz..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {countriesList.map(country => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.emoji} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Şehir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir
                  </label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    disabled={!formData.country || statesList.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.country ? "Önce ülke seçiniz..." : statesList.length === 0 ? "Şehir bilgisi yok" : "Şehir seçiniz..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {statesList.map(state => (
                        <SelectItem key={state.id} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ticaret Fuarı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticaret Fuarı
                  </label>
                  <Select 
                    value={formData.tradeShow}
                    onValueChange={(value) => handleInputChange('tradeShow', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fuar seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fairs
                        .filter(fair => (fair.name || '').trim() !== '')
                        .map((fair) => {
                          const displayName = fair.name || `Fair ${fair.id}`;
                          return (
                            <SelectItem key={fair.id} value={displayName}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Başlama Tarihi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlama Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.tradeShowStartDate}
                    onChange={(e) => handleInputChange('tradeShowStartDate', e.target.value)}
                    placeholder="Fuar başlama tarihi"
                  />
                </div>

                {/* Bitiş Tarihi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.tradeShowEndDate}
                    onChange={(e) => handleInputChange('tradeShowEndDate', e.target.value)}
                    placeholder="Fuar bitiş tarihi"
                    min={formData.tradeShowStartDate} // Bitiş tarihi başlama tarihinden önce olamaz
                  />
                </div>
              </div>

              {/* Stand Büyüklüğü */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stand Büyüklüğü <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.standSize}
                      onChange={(e) => handleStandSizeChange(e.target.value)}
                      placeholder="Stand büyüklüğü"
                      maxLength="4"
                      required
                      className="flex-1"
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                    <Select 
                      value={formData.standSizeUnit}
                      onValueChange={(value) => handleInputChange('standSizeUnit', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m2">m²</SelectItem>
                        <SelectItem value="ft2">ft²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Açıklama */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Detaylar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* İş Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Türü
                </label>
                <Input
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  placeholder="Satış, Hizmet, Danışmanlık, vb."
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama ve Notlar
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Satış fırsatı hakkında detaylar, notlar ve özel durumlar..."
                  rows={4}
                  className="resize-vertical"
                />
              </div>

              {/* Tasarım Dosyaları */}
              <div className="pt-4 border-t border-gray-200">
                <FileUpload
                  label="Tasarım Dosyaları"
                  description="Tasarım dosyalarını, görselleri, PDF'leri ve video dosyalarını ekleyebilirsiniz"
                  files={formData.designFiles}
                  onFilesChange={(files) => handleInputChange('designFiles', files)}
                  maxFiles={10}
                  acceptedTypes="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
              </div>

              {/* Örnek Resim ve Videolar */}
              <div className="pt-4 border-t border-gray-200">
                <FileUpload
                  label="Örnek Resim ve Videolar"
                  description="Örnek görselleri, referans videolarını ve ilgili belgeleri ekleyebilirsiniz"
                  files={formData.sampleFiles}
                  onFilesChange={(files) => handleInputChange('sampleFiles', files)}
                  maxFiles={10}
                  acceptedTypes="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
              </div>
            </CardContent>
          </Card>
        
        </div> {/* End of form content container */}
        
        {/* Submit Button - Inside form but outside content container */}
        <div className="px-6 pb-6">
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <Target className="h-4 w-4 mr-2" />
              {isLoading ? 'Kaydediliyor...' : 'Fırsat Oluştur'}
            </Button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            {/* X Close Button */}
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Başarılı!
              </h2>
              
              <p className="text-gray-600 mb-4">
                <strong>{createdOpportunityInfo?.title}</strong> satış fırsatı başarı ile sisteme eklenmiştir.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  ✅ Fırsat artık "Tüm Fırsatlar" listesinde görünecektir.
                </p>
              </div>
              
              <Button onClick={() => setShowSuccessModal(false)} className="bg-green-600 hover:bg-green-700">
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}