import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useToast } from '../../hooks/use-toast';
import { GetCountries, GetState } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import { 
  X,
  UserRound,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  FileText,
  CheckCircle,
  User,
  Briefcase,
  Calendar,
  Save
} from 'lucide-react';

export default function NewPersonFormPage({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationshipType: 'customer', // customer, supplier, partner, other
    jobTitle: '',
    company: '',
    companyId: '', // For customer companies
    supplier: '',
    supplierId: '', // For supplier companies  
    department: '',
    phone: '+90',
    mobile: '+90',
    email: '',
    website: '',
    country: 'tr', // Default to Turkey
    city: '',
    address: '',
    notes: '',
    birthDate: '',
    linkedin: '',
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPersonInfo, setCreatedPersonInfo] = useState(null);
  
  // Dynamic data states
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // Countries and cities from react-country-state-city library
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  
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
          setFormData(prev => ({ ...prev, country: turkey.name }));
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

  // Realistic Turkish names and data for test
  const testDataSamples = {
    firstNames: ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Zeynep', 'Mustafa', 'Elif', 'Hüseyin', 'Emine', 'Can', 'Deniz', 'Ece', 'Emre', 'Selin'],
    lastNames: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Arslan', 'Doğan', 'Kılıç', 'Erdoğan', 'Özdemir', 'Koç', 'Kurt', 'Aksoy'],
    jobTitles: ['Satış Müdürü', 'Pazarlama Direktörü', 'İnsan Kaynakları Müdürü', 'Genel Müdür Yardımcısı', 'Proje Müdürü', 'Operasyon Müdürü', 'Finans Müdürü', 'Satın Alma Müdürü', 'Üretim Müdürü', 'Kalite Kontrol Müdürü'],
    departments: ['Satış', 'Pazarlama', 'İnsan Kaynakları', 'Finans', 'Operasyon', 'Üretim', 'Kalite Kontrol', 'Satın Alma', 'Lojistik', 'IT'],
    cities: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'],
    addresses: [
      'Maslak Mahallesi, Ahi Evran Caddesi No:1 Daire:5',
      'Bağlarbaşı Mahallesi, Kızılırmak Sokak No:23/7',
      'Çankaya Mahallesi, Tunalı Hilmi Caddesi No:45 Kat:3',
      'Karşıyaka Mahallesi, Gazi Bulvarı No:156/12',
      'Nilüfer Mahallesi, Odunluk Caddesi No:78 D:4'
    ]
  };
  
  // Load countries on component mount
  useEffect(() => {
    loadUlkeler();
  }, []);

  // Filter cities when country changes (SAME AS NewCustomerForm)
  useEffect(() => {
    if (formData.country && tumUlkeler.length > 0) {
      const secilenUlke = tumUlkeler.find(u => u.name === formData.country);
      
      if (secilenUlke && secilenUlke.cities) {
        const sehirListesi = [...new Set(secilenUlke.cities.filter(c => c))].sort();
        setSehirler(sehirListesi);
      } else {
        setSehirler([]);
      }
      
      // Reset city when country changes
      setFormData(prev => ({ ...prev, city: '' }));
    } else {
      setSehirler([]);
    }
  }, [formData.country, tumUlkeler]);

  // Load companies and suppliers on component mount
  useEffect(() => {
    loadCompanies();
    loadSuppliers();
  }, []);

  const loadCompanies = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        console.log('Companies loaded:', data);
        setCompanies(data);
      } else {
        console.error('Failed to load companies');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        console.log('Suppliers loaded:', data);
        setSuppliers(data);
      } else {
        console.error('Failed to load suppliers');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };
  
  const relationshipTypes = [
    { value: 'customer', label: 'Müşteri' },
    { value: 'supplier', label: 'Tedarikçi' },
    { value: 'partner', label: 'İş Ortağı' },
    { value: 'consultant', label: 'Danışman' },
    { value: 'vendor', label: 'Satıcı' },
    { value: 'employee', label: 'Çalışan' },
    { value: 'contact', label: 'İletişim' },
    { value: 'other', label: 'Diğer' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle country change and update phone numbers accordingly
  const handleCountryChange = (country) => {
    const countryCode = country ? country.iso2 : '';
    
    // Update all fields in single state update to prevent re-render loop
    setFormData(prev => {
      const updates = {
        ...prev,
        country: countryCode,
        city: countryCode ? '' : prev.city  // Clear city only if country changed
      };
      
      // Update phone numbers with new country dial code
      if (countryCode) {
        // Get dial code for the new country
        const dialCodes = {
          'tr': '+90', 'us': '+1', 'gb': '+44', 'de': '+49', 'fr': '+33',
          'it': '+39', 'es': '+34', 'ca': '+1', 'au': '+61', 'in': '+91',
          'cn': '+86', 'jp': '+81', 'br': '+55', 'mx': '+52', 'ru': '+7',
          'kr': '+82', 'sa': '+966', 'ae': '+971', 'eg': '+20', 'za': '+27'
        };
        
        const newDialCode = dialCodes[countryCode.toLowerCase()];
        if (newDialCode) {
          updates.phone = newDialCode;
          updates.mobile = newDialCode;
        }
      } else {
        // Reset to default Turkish numbers if no country selected
        updates.phone = '+90';
        updates.mobile = '+90';
      }
      
      return updates;
    });
  };

  // Fill form with realistic test data
  const fillTestData = () => {
    const randomFirstName = testDataSamples.firstNames[Math.floor(Math.random() * testDataSamples.firstNames.length)];
    const randomLastName = testDataSamples.lastNames[Math.floor(Math.random() * testDataSamples.lastNames.length)];
    const randomJobTitle = testDataSamples.jobTitles[Math.floor(Math.random() * testDataSamples.jobTitles.length)];
    const randomDepartment = testDataSamples.departments[Math.floor(Math.random() * testDataSamples.departments.length)];
    const randomCity = testDataSamples.cities[Math.floor(Math.random() * testDataSamples.cities.length)];
    const randomAddress = testDataSamples.addresses[Math.floor(Math.random() * testDataSamples.addresses.length)];
    
    // Generate realistic phone numbers
    const phonePrefix = '+90 5' + ['3', '4', '5'][Math.floor(Math.random() * 3)];
    const phoneNumber = phonePrefix + Math.floor(Math.random() * 900000000 + 100000000);
    
    // Generate email from name
    const email = `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@${['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com'][Math.floor(Math.random() * 4)]}`;

    setFormData({
      ...formData,
      firstName: randomFirstName,
      lastName: randomLastName,
      relationshipType: ['customer', 'supplier', 'partner'][Math.floor(Math.random() * 3)],
      jobTitle: randomJobTitle,
      department: randomDepartment,
      phone: phoneNumber,
      mobile: phonePrefix + Math.floor(Math.random() * 900000000 + 100000000),
      email: email,
      country: 'Türkiye',
      city: randomCity,
      address: randomAddress,
      notes: 'Fuar görüşmesinde tanışıldı.',
      // If companies loaded, select a random one
      companyId: companies.length > 0 ? companies[Math.floor(Math.random() * companies.length)].id : '',
      company: companies.length > 0 ? companies[Math.floor(Math.random() * companies.length)].companyName : ''
    });

    toast({
      title: "Başarılı",
      description: "Gerçekçi veriler dolduruldu",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation - required fields for person
    const requiredFieldsValid = formData.firstName.trim() && formData.lastName.trim() && 
        formData.relationshipType && formData.email.trim() && formData.phone.trim() && 
        formData.mobile.trim() && formData.country && formData.city.trim() && formData.address.trim() &&
        (formData.companyId || formData.supplierId); // Either customer company or supplier company required
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: "Zorunlu alanları doldurunuz: Ad, Soyad, İlişki türü, Email, Telefon, Cep telefonu, Ülke, Şehir, Adres ve Şirket (Müşteri veya Tedarikçi)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Format person data for backend (snake_case required)
      const personData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        relationship_type: formData.relationshipType,
        job_title: formData.jobTitle,
        company: formData.company, // Company name for display
        company_id: formData.companyId, // Customer company ID
        supplier: formData.supplier, // Supplier name for display  
        supplier_id: formData.supplierId, // Supplier company ID
        department: formData.department,
        phone: formData.phone,
        mobile: formData.mobile, // Store mobile in notes if backend doesn't support it
        email: formData.email,
        website: formData.website,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        notes: `${formData.notes ? formData.notes + '\n' : ''}Mobile: ${formData.mobile}${formData.birthDate ? '\nBirthdate: ' + formData.birthDate : ''}${formData.linkedin ? '\nLinkedIn: ' + formData.linkedin : ''}`,
        created_at: new Date().toISOString(),
        tags: formData.tags || []
      };

      const response = await fetch(`${backendUrl}/api/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Person saved:', savedData);

        // Set success state with person info
        setCreatedPersonInfo({
          fullName: `${formData.firstName} ${formData.lastName}`,
          relationshipType: relationshipTypes.find(rt => rt.value === formData.relationshipType)?.label || formData.relationshipType,
          company: formData.company || formData.supplier || 'Belirtilmemiş'
        });
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to save person:', errorData);
        toast({
          title: "Hata",
          description: "Kişi kaydedilirken hata oluştu: " + (errorData.detail || "Bilinmeyen hata"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting person form:', error);
      toast({
        title: "Hata",
        description: "Kişi kaydedilirken hata oluştu",
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
              <UserRound className="h-8 w-8 text-blue-600" />
              <span>Yeni Kişi Ekle</span>
            </h1>
            <p className="text-gray-600 mt-1">İletişim bilgileri ve kişi detayları</p>
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
        
        {/* Kişi Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Kişi Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Adınızı girin"
                />
              </div>

              {/* Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Soyadınızı girin"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* İlişki Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İlişki Türü <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.relationshipType}
                  onValueChange={(value) => handleInputChange('relationshipType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İlişki türü seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* İş Ünvanı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Ünvanı <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="Genel Müdür, Satış Sorumlusu, vb."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Şirket (Müşteri Şirketleri) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şirket (Müşteri)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Select 
                      value={formData.companyId}
                      onValueChange={(value) => {
                        const selectedCompany = companies.find(c => c.id === value);
                        handleInputChange('companyId', value);
                        handleInputChange('company', selectedCompany ? selectedCompany.companyName || selectedCompany.companyTitle : '');
                        
                        // Clear supplier selection when company is selected
                        if (value) {
                          handleInputChange('supplierId', '');
                          handleInputChange('supplier', '');
                        }
                      }}
                      disabled={!!formData.supplierId} // Disable if supplier is selected
                    >
                      <SelectTrigger className={formData.supplierId ? "opacity-50 cursor-not-allowed" : ""}>
                        <SelectValue placeholder="Müşteri şirketi seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyName || company.companyTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Clear button for company */}
                  {formData.companyId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange('companyId', '');
                        handleInputChange('company', '');
                      }}
                      className="px-2 py-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.supplierId && (
                  <p className="text-xs text-gray-500 mt-1">Tedarikçi seçili olduğu için devre dışı</p>
                )}
              </div>

              {/* Tedarikçi Şirketi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tedarikçi Şirketi
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Select 
                      value={formData.supplierId}
                      onValueChange={(value) => {
                        const selectedSupplier = suppliers.find(s => s.id === value);
                        handleInputChange('supplierId', value);
                        handleInputChange('supplier', selectedSupplier ? selectedSupplier.company_short_name : '');
                        
                        // Clear company selection when supplier is selected
                        if (value) {
                          handleInputChange('companyId', '');
                          handleInputChange('company', '');
                        }
                      }}
                      disabled={!!formData.companyId} // Disable if company is selected
                    >
                      <SelectTrigger className={formData.companyId ? "opacity-50 cursor-not-allowed" : ""}>
                        <SelectValue placeholder="Tedarikçi şirketi seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.company_short_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Clear button for supplier */}
                  {formData.supplierId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange('supplierId', '');
                        handleInputChange('supplier', '');
                      }}
                      className="px-2 py-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.companyId && (
                  <p className="text-xs text-gray-500 mt-1">Müşteri şirketi seçili olduğu için devre dışı</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {/* Departman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departman
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Satış, Pazarlama, IT, vb."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>İletişim Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ornek@sirket.com"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.sirket.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  key={`phone-${formData.country || 'tr'}`}
                  country={formData.country || "tr"}
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  enableSearch={true}
                  inputClass="w-full"
                />
              </div>

              {/* Cep Telefonu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cep Telefonu <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  key={`mobile-${formData.country || 'tr'}`}
                  country={formData.country || "tr"}
                  value={formData.mobile}
                  onChange={(value) => handleInputChange('mobile', value)}
                  enableSearch={true}
                  inputClass="w-full"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profili
              </label>
              <Input
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                placeholder="https://www.linkedin.com/in/kullanici-adi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Konum Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Konum Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ülke */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ülke <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ülke seçiniz..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ulkeler.map(ulke => (
                      <SelectItem key={ulke} value={ulke}>{ulke}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Şehir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Şehir <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                  disabled={!formData.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.country ? "Önce ülke seçiniz..." : "Şehir seçiniz..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sehirler.map(sehir => (
                      <SelectItem key={sehir} value={sehir}>{sehir}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Tam adres bilgisi"
                rows={3}
                className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ek Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Ek Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Doğum Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doğum Tarihi
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Notlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notlar Alanı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar ve Yorumlar
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Kişi hakkında notlarınız, özel durumlar, yorumlar..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
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
              <User className="h-4 w-4 mr-2" />
              {isLoading ? 'Kaydediliyor...' : 'Kişi Oluştur'}
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
                <strong>{createdPersonInfo?.fullName}</strong> kişisi başarı ile sisteme eklenmiştir.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  ✅ Kişi artık "Tüm Kişiler" listesinde görünecektir.
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