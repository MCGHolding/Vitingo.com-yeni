import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import SearchableSelect from '../ui/SearchableSelect';
import { 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Tag,
  Plus,
  X,
  Save,
  ArrowLeft,
  User,
  CheckCircle,
  Home
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useIban } from '../../hooks/useIban';

import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';

const NewCustomerForm = ({ onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [customerCreated, setCustomerCreated] = useState(false);
  const [createdCustomerInfo, setCreatedCustomerInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isIndividualCustomer, setIsIndividualCustomer] = useState(false);
  const [contacts, setContacts] = useState([{ 
    full_name: '', 
    mobile: '', 
    email: '', 
    position: '', 
    tags: [],
    address: '',
    country: '',
    city: ''
  }]);

  const [formData, setFormData] = useState({
    company_short_name: '',
    company_title: '',
    address: '',
    phone: '',
    mobile: '',
    email: '',
    tax_office: '',
    tax_number: '',
    services: [],
    customer_type_id: '',
    specialty_id: '',
    // Bank/Payment Information
    iban: '',
    bank_name: '',
    bank_branch: '',
    account_holder_name: '',
    swift_code: '',
    country: '',
    city: '',
    // USA Bank Information
    routing_number: '',
    us_account_number: '',
    bank_address: '',
    // Customer specific fields
    sector: '',
    tags: [],
    notes: '',
    is_candidate: false
  });

  const [currentService, setCurrentService] = useState('');
  const [currentContactTag, setCurrentContactTag] = useState('');
  const [isUSABankFormat, setIsUSABankFormat] = useState(false);
  
  // IBAN hook'u kullan
  const { ibanError, handleIbanChange } = useIban();

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load specialties when category changes
  useEffect(() => {
    if (formData.customer_type_id) {
      loadSpecialties(formData.customer_type_id);
    } else {
      setSpecialties([]);
    }
  }, [formData.customer_type_id]);

  const loadCategories = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Hata",
        description: "Kategoriler yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const loadSpecialties = async (categoryId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/supplier-specialties/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      } else {
        throw new Error('Failed to load specialties');
      }
    } catch (error) {
      console.error('Error loading specialties:', error);
      toast({
        title: "Hata", 
        description: "Uzmanlık alanları yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddService = () => {
    if (currentService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, currentService.trim()]
      }));
      setCurrentService('');
    }
  };

  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    setContacts(updatedContacts);
  };

  // IBAN handler - hook'tan gelen fonksiyonu kullan
  const handleIbanInput = (value) => {
    handleIbanChange(value, (formattedValue) => {
      handleInputChange('iban', formattedValue);
    });
  };

  const handleAddContactTag = (contactIndex) => {
    if (currentContactTag.trim()) {
      const updatedContacts = [...contacts];
      updatedContacts[contactIndex].tags = [...updatedContacts[contactIndex].tags, currentContactTag.trim()];
      setContacts(updatedContacts);
      setCurrentContactTag('');
    }
  };

  const handleRemoveContactTag = (contactIndex, tagIndex) => {
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex].tags = updatedContacts[contactIndex].tags.filter((_, i) => i !== tagIndex);
    setContacts(updatedContacts);
  };

  const handleAddContact = () => {
    setContacts([...contacts, { 
      full_name: '', 
      mobile: '', 
      email: '', 
      position: '', 
      tags: [],
      address: '',
      country: '',
      city: ''
    }]);
  };

  const handleRemoveContact = (index) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
  };

  const getSpecialtyName = (specialtyId) => {
    const specialty = specialties.find(spec => spec.id === specialtyId);
    return specialty ? specialty.name : 'Bilinmiyor';
  };

  const handleGoBack = () => {
    setCustomerCreated(false);
  };

  const handleGoToDashboard = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFieldsValid = isIndividualCustomer 
      ? formData.customer_type_id && formData.specialty_id  // For individual: only category and specialty required
      : formData.company_short_name && formData.company_title && formData.customer_type_id && formData.specialty_id; // For company: all fields required
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: isIndividualCustomer 
          ? "Müşteri türü ve uzmanlık alanı seçimi zorunludur"
          : "Zorunlu alanları doldurunuz (Firma adı, ünvan, kategori, uzmanlık)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Prepare customer data based on type
      const customerData = isIndividualCustomer 
        ? {
            ...formData,
            company_short_name: contacts[0]?.full_name || 'Bireysel Müşteri',
            company_title: contacts[0]?.full_name || 'Bireysel Müşteri',
            address: '',
            phone: contacts[0]?.mobile || '',
            mobile: contacts[0]?.mobile || '',
            email: contacts[0]?.email || '',
            tax_office: '',
            tax_number: '',
            services: []
          }
        : formData;

      // Determine which endpoint to use based on is_candidate checkbox
      const endpoint = formData.is_candidate ? '/api/customer-prospects' : '/api/customers';
      
      // Save directly to backend or use onSave prop
      if (onSave) {
        await onSave(customerData);
      } else {
        // Direct backend save
        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...customerData,
            contacts: contacts.filter(contact => contact.full_name.trim())
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Kaydetme başarısız');
        }

        const savedData = await response.json();
        console.log(`${formData.is_candidate ? 'Customer prospect' : 'Customer'} saved:`, savedData);
      }

      // Set success state with customer info
      setCreatedCustomerInfo({
        company_name: customerData.company_short_name,
        customer_type: getCategoryName(customerData.customer_type_id),
        specialty: getSpecialtyName(customerData.specialty_id),
        contacts_count: contacts.filter(c => c.full_name.trim()).length,
        is_individual: isIndividualCustomer,
        is_candidate: formData.is_candidate
      });
      setCustomerCreated(true);

      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla oluşturuldu",
        variant: "default"
      });

    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Hata",
        description: error.message || "Müşteri oluşturulurken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Müşteri</h1>
            <p className="text-gray-600">Müşteri bilgilerini girin ve yetkili kişileri ekleyin</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        )}
      </div>

      {customerCreated ? (
        /* Success State */
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tebrikler, {createdCustomerInfo?.is_individual ? 'Bireysel ' : ''}{createdCustomerInfo?.is_candidate ? 'Müşteri Adayı' : 'Müşteri'} Başarı ile Oluşturuldu!
              </h2>
              
              <p className="text-gray-600 mb-6">
                <strong>{createdCustomerInfo?.company_name}</strong> {createdCustomerInfo?.is_individual ? 'bireysel' : ''} {createdCustomerInfo?.is_candidate ? 'müşteri adayı' : 'müşteri şirketi'} başarıyla sisteme eklendi.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {createdCustomerInfo?.is_individual ? 'Kişi Adı:' : 'Firma Adı:'}
                    </span>
                    <span className="text-sm text-gray-900">{createdCustomerInfo?.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Tür:</span>
                    <span className="text-sm text-gray-900">
                      {createdCustomerInfo?.is_individual ? 'Bireysel' : 'Şirket'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Kategori:</span>
                    <span className="text-sm text-gray-900">{createdCustomerInfo?.customer_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Uzmanlık:</span>
                    <span className="text-sm text-gray-900">{createdCustomerInfo?.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {createdCustomerInfo?.is_individual ? 'İletişim Bilgileri:' : 'Yetkili Kişiler:'}
                    </span>
                    <span className="text-sm text-gray-900">{createdCustomerInfo?.contacts_count} kişi</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  🎉 Müşteri başarıyla kaydedildi ve artık "Tüm Müşteriler" listesinde görüntülenebilir.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Yeni Müşteri Ekle</span>
                </Button>
                
                <Button onClick={handleGoToDashboard} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Dashboard'a Dön</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kategori Seçimi */}
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Kategori Seçimi</span>
              </CardTitle>
              
              {/* Customer Checkboxes */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="individual-customer"
                    checked={isIndividualCustomer}
                    onChange={(e) => setIsIndividualCustomer(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label 
                    htmlFor="individual-customer" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Bireysel Müşteri
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="customer-candidate"
                    checked={formData.is_candidate || false}
                    onChange={(e) => handleInputChange('is_candidate', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label 
                    htmlFor="customer-candidate" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Müşteri Aday
                  </label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Müşteri Türü */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri Türü *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={[
                        { value: 'firma', label: 'Firma' },
                        { value: 'ajans', label: 'Ajans' },
                        { value: 'devlet_kurumu', label: 'Devlet Kurumu' },
                        { value: 'dernek_vakif', label: 'Dernek veya Vakıf' }
                      ]}
                      value={formData.customer_type_id}
                      onValueChange={(value) => handleInputChange('customer_type_id', value)}
                      placeholder="Müşteri türü seçin..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newType = prompt('Yeni müşteri türü adını girin:');
                      if (newType && newType.trim()) {
                        // Bu kısım daha sonra modal ile değiştirilebilir
                        alert('Yeni müşteri türü: ' + newType.trim());
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sektör */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sektör *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={[
                        { value: 'tarim', label: 'Tarım' },
                        { value: 'hayvancilik', label: 'Hayvancılık' },
                        { value: 'gida_uretimi', label: 'Gıda Üretimi' },
                        { value: 'icecek_uretimi', label: 'İçecek Üretimi' },
                        { value: 'tekstil', label: 'Tekstil' },
                        { value: 'hazir_giyim', label: 'Hazır Giyim' },
                        { value: 'deri_ayakkabi', label: 'Deri ve Ayakkabı' },
                        { value: 'mobilya', label: 'Mobilya' },
                        { value: 'orman_urunleri', label: 'Orman Ürünleri' },
                        { value: 'kagit_ambalaj', label: 'Kağıt ve Ambalaj' },
                        { value: 'plastik_kaucuk', label: 'Plastik ve Kauçuk' },
                        { value: 'cam_seramik', label: 'Cam ve Seramik' },
                        { value: 'metal_isleme', label: 'Metal İşleme' },
                        { value: 'demir_celik', label: 'Demir-Çelik' },
                        { value: 'otomotiv', label: 'Otomotiv' },
                        { value: 'yedek_parca', label: 'Yedek Parça' },
                        { value: 'elektrik_elektronik', label: 'Elektrik ve Elektronik' },
                        { value: 'beyaz_esya', label: 'Beyaz Eşya' },
                        { value: 'makine_ekipman', label: 'Makine ve Ekipman' },
                        { value: 'insaat', label: 'İnşaat' },
                        { value: 'yapi_malzemeleri', label: 'Yapı Malzemeleri' },
                        { value: 'enerji', label: 'Enerji' },
                        { value: 'yenilenebilir_enerji', label: 'Yenilenebilir Enerji' },
                        { value: 'dogalgaz_petrol', label: 'Doğalgaz ve Petrol' },
                        { value: 'kimya', label: 'Kimya' },
                        { value: 'ilac_saglik', label: 'İlaç ve Sağlık' },
                        { value: 'tibbi_cihazlar', label: 'Tıbbi Cihazlar' },
                        { value: 'kozmetik_kisisel_bakim', label: 'Kozmetik ve Kişisel Bakım' },
                        { value: 'temizlik_urunleri', label: 'Temizlik Ürünleri' },
                        { value: 'bilgi_teknolojileri', label: 'Bilgi Teknolojileri (IT)' },
                        { value: 'yazilim', label: 'Yazılım' },
                        { value: 'donanim', label: 'Donanım' },
                        { value: 'telekomunikasyon', label: 'Telekomünikasyon' },
                        { value: 'e_ticaret', label: 'E-Ticaret' },
                        { value: 'lojistik', label: 'Lojistik' },
                        { value: 'tasimacilik', label: 'Taşımacılık' },
                        { value: 'depolama', label: 'Depolama' },
                        { value: 'denizcilik', label: 'Denizcilik' },
                        { value: 'havacilik', label: 'Havacılık' },
                        { value: 'turizm', label: 'Turizm' },
                        { value: 'otelcilik', label: 'Otelcilik' },
                        { value: 'restoran_yiyecek', label: 'Restoran ve Yiyecek Hizmetleri' },
                        { value: 'eglence_medya', label: 'Eğlence ve Medya' },
                        { value: 'reklam_pazarlama', label: 'Reklam ve Pazarlama' },
                        { value: 'yayincilik', label: 'Yayıncılık' },
                        { value: 'egitim', label: 'Eğitim' },
                        { value: 'danismanlik', label: 'Danışmanlık' },
                        { value: 'finans', label: 'Finans' },
                        { value: 'bankacilik', label: 'Bankacılık' },
                        { value: 'sigortacilik', label: 'Sigortacılık' },
                        { value: 'yatirim_portfoy', label: 'Yatırım ve Portföy Yönetimi' },
                        { value: 'gayrimenkul', label: 'Gayrimenkul' },
                        { value: 'mimarlik', label: 'Mimarlık' },
                        { value: 'muhendislik', label: 'Mühendislik' },
                        { value: 'guvenlik', label: 'Güvenlik' },
                        { value: 'savunma_sanayi', label: 'Savunma Sanayi' },
                        { value: 'kamu_hizmetleri', label: 'Kamu Hizmetleri' },
                        { value: 'stk_dernekler', label: 'STK ve Dernekler' }
                      ]}
                      value={formData.specialty_id}
                      onValueChange={(value) => handleInputChange('specialty_id', value)}
                      placeholder="Sektör seçin..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSector = prompt('Yeni sektör adını girin:');
                      if (newSector && newSector.trim()) {
                        alert('Yeni sektör: ' + newSector.trim());
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Müşteri Bilgileri - Only show if not individual customer */}
        {!isIndividualCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Müşteri Form Bilgileri</span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma Kısa Adı *
                </label>
                <Input
                  value={formData.company_short_name}
                  onChange={(e) => handleInputChange('company_short_name', e.target.value)}
                  placeholder="Örn: ABC Ltd"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma Ünvanı *
                </label>
                <Input
                  value={formData.company_title}
                  onChange={(e) => handleInputChange('company_title', e.target.value)}
                  placeholder="Örn: ABC Lojistik Limited Şirketi"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Firma adresi..."
                className="w-full h-20 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ülke
                </label>
                <CountrySelect
                  value={formData.country}
                  onChange={(country) => {
                    const countryCode = country ? country.iso2 : '';
                    handleInputChange('country', countryCode);
                    // Reset city when country changes
                    if (formData.city) {
                      handleInputChange('city', '');
                    }
                  }}
                  placeholder="Ülke seçiniz..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Şehir
                </label>
                <CitySelect
                  country={formData.country}
                  value={formData.city}
                  onChange={(city) => {
                    const cityName = city ? city.name : '';
                    handleInputChange('city', cityName);
                  }}
                  placeholder="Şehir seçiniz..."
                  disabled={!formData.country}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <PhoneInput
                  country={"tr"}
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  enableSearch={true}
                  inputClass="w-full"
                />
              </div>

              {/* Cep Telefonu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cep Telefonu
                </label>
                <PhoneInput
                  country={"tr"}
                  value={formData.mobile}
                  onChange={(value) => handleInputChange('mobile', value)}
                  enableSearch={true}
                  inputClass="w-full"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ornek@sirket.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Dairesi
                </label>
                <Input
                  value={formData.tax_office}
                  onChange={(e) => handleInputChange('tax_office', e.target.value)}
                  placeholder="Örn: Beşiktaş Vergi Dairesi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VKN
                </label>
                <Input
                  value={formData.tax_number}
                  onChange={(e) => handleInputChange('tax_number', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>

            {/* Hizmetler (Etiket Sistemi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hizmetler
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={currentService}
                  onChange={(e) => setCurrentService(e.target.value)}
                  placeholder="Hizmet adı girin..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                />
                <Button type="button" onClick={handleAddService} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {!isIndividualCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Banka / Ödeme Bilgileri</span>
                </div>
                {/* USA Format Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usa-format"
                    checked={isUSABankFormat}
                    onChange={(e) => setIsUSABankFormat(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="usa-format" className="text-sm font-medium text-gray-700">
                    ABD Bankası
                  </label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isUSABankFormat ? (
                /* IBAN Format (International) */
                <div className="space-y-4">
                  {/* Üst satır: Hesap Sahibi Adı (sol) ve IBAN (sağ) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hesap Sahibi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hesap Sahibi Adı
                      </label>
                      <Input
                        value={formData.account_holder_name}
                        onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                        placeholder="Hesap sahibinin adı"
                      />
                    </div>

                    {/* IBAN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IBAN <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.iban}
                        onChange={(e) => handleIbanInput(e.target.value)}
                        placeholder="TR00 0000 0000 0000 0000 00 00"
                        className={ibanError ? 'border-red-500' : ''}
                      />
                      {ibanError && (
                        <p className="text-red-500 text-sm mt-1">{ibanError}</p>
                      )}
                    </div>
                  </div>

                  {/* Diğer alanlar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banka Adı */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banka Adı
                      </label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        placeholder="Örn: Türkiye İş Bankası"
                      />
                    </div>

                    {/* Şube */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Şube
                      </label>
                      <Input
                        value={formData.bank_branch}
                        onChange={(e) => handleInputChange('bank_branch', e.target.value)}
                        placeholder="Şube adı"
                      />
                    </div>

                    {/* SWIFT Kodu */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SWIFT Kodu
                      </label>
                      <Input
                        value={formData.swift_code}
                        onChange={(e) => handleInputChange('swift_code', e.target.value)}
                        placeholder="SWIFT/BIC kodu"
                      />
                    </div>

                    {/* Ülke */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ülke
                      </label>
                      <CountrySelect
                        value={formData.country}
                        onChange={(country) => {
                          const countryCode = country ? country.iso2 : '';
                          handleInputChange('country', countryCode);
                        }}
                        placeholder="Ülke seçiniz..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* USA Format */
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">ABD Banka Formatı</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Amerika'da IBAN kullanılmaz. Routing Number ve Account Number kullanılır.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Routing Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Routing Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.routing_number}
                        onChange={(e) => handleInputChange('routing_number', e.target.value)}
                        placeholder="Örn: 021000021 (Chase Bank)"
                      />
                      <p className="text-xs text-gray-500 mt-1">9 haneli banka routing numarası</p>
                    </div>

                    {/* Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.us_account_number}
                        onChange={(e) => handleInputChange('us_account_number', e.target.value)}
                        placeholder="Örn: 1234567890123456"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hesap numarası</p>
                    </div>

                    {/* Banka Adı */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banka Adı
                      </label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        placeholder="Örn: Chase Bank, Bank of America"
                      />
                    </div>

                    {/* Hesap Sahibi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hesap Sahibi Adı
                      </label>
                      <Input
                        value={formData.account_holder_name}
                        onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                        placeholder="Örn: John Doe LLC"
                      />
                    </div>

                    {/* Banka Adresi */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banka Adresi
                      </label>
                      <Input
                        value={formData.bank_address}
                        onChange={(e) => handleInputChange('bank_address', e.target.value)}
                        placeholder="Örn: 383 Madison Ave, New York, NY 10179"
                      />
                      <p className="text-xs text-gray-500 mt-1">Banka şubesi adresi</p>
                    </div>

                    {/* SWIFT (Opsiyonel) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SWIFT Code
                      </label>
                      <Input
                        value={formData.swift_code}
                        onChange={(e) => handleInputChange('swift_code', e.target.value)}
                        placeholder="Örn: CHASUS33 (Chase)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Uluslararası transferler için</p>
                    </div>

                    {/* Ülke (ABD olarak sabitlendi) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ülke
                      </label>
                      <Input
                        value={isUSABankFormat ? 'USA' : formData.country}
                        onChange={(e) => !isUSABankFormat && handleInputChange('country', e.target.value)}
                        placeholder="USA"
                        disabled={isUSABankFormat}
                        className={isUSABankFormat ? 'bg-gray-100' : ''}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Yetkili Kişi Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Yetkili Kişi Bilgileri</span>
              </div>
              <Button type="button" onClick={handleAddContact} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kişi Ekle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {contacts.map((contact, contactIndex) => (
              <div key={contactIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Yetkili Kişi {contactIndex + 1}</h4>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveContact(contactIndex)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyadı
                    </label>
                    <Input
                      value={contact.full_name}
                      onChange={(e) => handleContactChange(contactIndex, 'full_name', e.target.value)}
                      placeholder="Ad Soyadı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cep Telefonu
                    </label>
                    <PhoneInput
                      country={"tr"}
                      value={contact.mobile}
                      onChange={(value) => handleContactChange(contactIndex, 'mobile', value)}
                      enableSearch={true}
                      inputClass="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(contactIndex, 'email', e.target.value)}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Görevi
                    </label>
                    <Input
                      value={contact.position}
                      onChange={(e) => handleContactChange(contactIndex, 'position', e.target.value)}
                      placeholder="Örn: İş Geliştirme Müdürü"
                    />
                  </div>
                </div>

                {/* Address and Location Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Adres
                  </label>
                  <textarea
                    value={contact.address}
                    onChange={(e) => handleContactChange(contactIndex, 'address', e.target.value)}
                    placeholder="Bireysel müşteri adresi..."
                    className="w-full h-20 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Ülke
                    </label>
                    <CountrySelect
                      value={contact.country}
                      onChange={(country) => {
                        const countryCode = country ? country.iso2 : '';
                        handleContactChange(contactIndex, 'country', countryCode);
                        // Reset city when country changes
                        if (contact.city) {
                          handleContactChange(contactIndex, 'city', '');
                        }
                      }}
                      placeholder="Ülke seçiniz..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Şehir
                    </label>
                    <CitySelect
                      country={contact.country}
                      value={contact.city}
                      onChange={(city) => {
                        const cityName = city ? city.name : '';
                        handleContactChange(contactIndex, 'city', cityName);
                      }}
                      placeholder="Şehir seçiniz..."
                      disabled={!contact.country}
                    />
                  </div>
                </div>

                {/* Kişi Etiketleri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiketler
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={currentContactTag}
                      onChange={(e) => setCurrentContactTag(e.target.value)}
                      placeholder="Etiket girin..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddContactTag(contactIndex))}
                    />
                    <Button 
                      type="button" 
                      onClick={() => handleAddContactTag(contactIndex)} 
                      size="sm" 
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveContactTag(contactIndex, tagIndex)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Etiketler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Etiketler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Etiketler */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Etiketler</span>
              </label>
              
              {/* Current Tags */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags.filter((_, i) => i !== index);
                          handleInputChange('tags', newTags);
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="flex items-center space-x-2">
                <Input
                  value={currentService}
                  onChange={(e) => setCurrentService(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (currentService.trim()) {
                        const currentTags = formData.tags || [];
                        handleInputChange('tags', [...currentTags, currentService.trim()]);
                        setCurrentService('');
                      }
                    }
                  }}
                  placeholder="Etiket yazın ve Enter'a basın..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentService.trim()) {
                      const currentTags = formData.tags || [];
                      handleInputChange('tags', [...currentTags, currentService.trim()]);
                      setCurrentService('');
                    }
                  }}
                  disabled={!currentService.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Önerilen Etiketler */}
              <div className="space-y-2">
                <span className="text-xs text-gray-600">Önerilen etiketler:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'TEKNOLOJI', color: 'bg-cyan-400 text-white' },
                    { label: 'SANAYİ', color: 'bg-gray-500 text-white' },
                    { label: 'TİCARET', color: 'bg-blue-400 text-white' },
                    { label: 'HİZMET', color: 'bg-green-400 text-white' },
                    { label: 'ÜRETİM', color: 'bg-orange-400 text-white' },
                    { label: 'İHRACAT', color: 'bg-teal-500 text-white' },
                    { label: 'İTHALAT', color: 'bg-red-400 text-white' },
                    { label: 'PERAKENDE', color: 'bg-pink-400 text-white' }
                  ].map((suggestedTag) => {
                    const currentTags = formData.tags || [];
                    const isAdded = currentTags.includes(suggestedTag.label);
                    return (
                      <button
                        key={suggestedTag.label}
                        type="button"
                        onClick={() => {
                          if (!isAdded) {
                            handleInputChange('tags', [...currentTags, suggestedTag.label]);
                          }
                        }}
                        disabled={isAdded}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-opacity ${
                          isAdded 
                            ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' 
                            : `${suggestedTag.color} hover:opacity-80 cursor-pointer`
                        }`}
                      >
                        {suggestedTag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Notlar
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Müşteri hakkında notlar..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Kaydediliyor...' : 'Müşteri Kaydet'}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};

export default NewCustomerForm;