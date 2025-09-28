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
import PhoneInput from '../ui/PhoneInput';
import { useIban } from '../../hooks/useIban';

import AddCategoryModal from './AddCategoryModal';
import AddSpecialtyModal from './AddSpecialtyModal';
import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';

const NewSupplierForm = ({ onClose }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [supplierCreated, setSupplierCreated] = useState(false);
  const [createdSupplierInfo, setCreatedSupplierInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isIndividualSupplier, setIsIndividualSupplier] = useState(false);
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
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSpecialtyModal, setShowAddSpecialtyModal] = useState(false);

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
    supplier_type_id: '',
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
    bank_address: ''
  });

  const [currentService, setCurrentService] = useState('');
  const [currentContactTag, setCurrentContactTag] = useState('');
  const [isUSABankFormat, setIsUSABankFormat] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load specialties when category changes
  useEffect(() => {
    if (formData.supplier_type_id) {
      loadSpecialties(formData.supplier_type_id);
    } else {
      setSpecialties([]);
    }
  }, [formData.supplier_type_id]);

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

  // IBAN validasyonu - Gelişmiş version
  const validateIban = (iban) => {
    // Boşlukları sil ve büyük harfe çevir
    const rawIban = iban.replace(/\s/g, '').toUpperCase();
    
    if (!rawIban) {
      return '';
    }

    // 1. Uzunluk kontrolü
    if (rawIban.length < 15 || rawIban.length > 34) {
      return "IBAN uzunluğu 15 ile 34 karakter arasında olmalıdır.";
    }

    // 2. İlk 2 karakter harf değilse
    if (!/^[A-Z]{2}/.test(rawIban)) {
      return "İlk 2 karakter harf olmalıdır.";
    }

    // 3. İlk 2 karakterden sonrasında harf varsa
    if (!/^[A-Z]{2}[0-9]+$/.test(rawIban)) {
      return "İlk 2 karakterden sonrası sadece rakam olmalıdır.";
    }

    // 4. Genel format (sadece alfanümerik)
    if (!/^[A-Z0-9]+$/.test(rawIban)) {
      return "IBAN sadece harf ve rakam içerebilir.";
    }

    // 5. Checksum (mod 97 algoritması)
    const rearranged = rawIban.slice(4) + rawIban.slice(0, 4);
    let expanded = "";
    
    for (let char of rearranged) {
      if (/[A-Z]/.test(char)) {
        expanded += (char.charCodeAt(0) - 55).toString();
      } else {
        expanded += char;
      }
    }

    let remainder = parseInt(expanded[0]);
    for (let i = 1; i < expanded.length; i++) {
      remainder = (remainder * 10 + parseInt(expanded[i])) % 97;
    }

    if (remainder !== 1) {
      return "Geçersiz IBAN (checksum hatası).";
    }

    // ✅ Geçerli IBAN
    return '';
  };

  // IBAN formatla - her 4 karakterde bir boşluk
  const formatIban = (iban) => {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < cleanIban.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += cleanIban.slice(i, i + 4);
    }
    return formatted;
  };

  const handleIbanChange = (value) => {
    // Önce formatla
    const formattedValue = formatIban(value);
    handleInputChange('iban', formattedValue);
    
    // Sonra validate et
    const error = validateIban(formattedValue);
    setIbanError(error);
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
    setSupplierCreated(false);
  };

  const handleGoToDashboard = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddCategoryModal = () => {
    setShowAddCategoryModal(true);
  };

  const handleAddSpecialtyModal = () => {
    if (!formData.supplier_type_id) {
      toast({
        title: "Hata",
        description: "Önce bir kategori seçin",
        variant: "destructive"
      });
      return;
    }
    setShowAddSpecialtyModal(true);
  };

  const handleCategorySaved = async (newCategory) => {
    // Reload categories and select the new one
    await loadCategories();
    setFormData(prev => ({ ...prev, supplier_type_id: newCategory.id }));
    setShowAddCategoryModal(false);
  };

  const handleSpecialtySaved = async (newSpecialty) => {
    // Reload specialties and select the new one
    await loadSpecialties(formData.supplier_type_id);
    setFormData(prev => ({ ...prev, specialty_id: newSpecialty.id }));
    setShowAddSpecialtyModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFieldsValid = isIndividualSupplier 
      ? formData.supplier_type_id && formData.specialty_id  // For individual: only category and specialty required
      : formData.company_short_name && formData.company_title && formData.supplier_type_id && formData.specialty_id; // For company: all fields required
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: isIndividualSupplier 
          ? "Tedarikçi türü ve uzmanlık alanı seçimi zorunludur"
          : "Zorunlu alanları doldurunuz (Firma adı, ünvan, kategori, uzmanlık)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Prepare supplier data based on type
      const supplierData = isIndividualSupplier 
        ? {
            ...formData,
            company_short_name: contacts[0]?.full_name || 'Bireysel Tedarikçi',
            company_title: contacts[0]?.full_name || 'Bireysel Tedarikçi',
            address: '',
            phone: contacts[0]?.mobile || '',
            mobile: contacts[0]?.mobile || '',
            email: contacts[0]?.email || '',
            tax_office: '',
            tax_number: '',
            services: []
          }
        : formData;

      // Create supplier first
      const supplierResponse = await fetch(`${backendUrl}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });

      if (!supplierResponse.ok) {
        const error = await supplierResponse.json();
        throw new Error(error.detail || 'Failed to create supplier');
      }

      const supplier = await supplierResponse.json();

      // Create contacts
      for (const contact of contacts) {
        if (contact.full_name.trim()) {
          const contactData = {
            ...contact,
            supplier_id: supplier.id
          };
          
          const contactResponse = await fetch(`${backendUrl}/api/supplier-contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
          });

          if (!contactResponse.ok) {
            console.error('Failed to create contact:', contact);
          }
        }
      }

      // Set success state with supplier info
      setCreatedSupplierInfo({
        company_name: supplier.company_short_name,
        supplier_type: getCategoryName(supplier.supplier_type_id),
        specialty: getSpecialtyName(supplier.specialty_id),
        contacts_count: contacts.filter(c => c.full_name.trim()).length,
        is_individual: isIndividualSupplier
      });
      setSupplierCreated(true);

      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla oluşturuldu",
        variant: "default"
      });

    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi oluşturulurken hata oluştu", 
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
            <h1 className="text-2xl font-bold text-gray-900">Yeni Tedarikçi</h1>
            <p className="text-gray-600">Tedarikçi bilgilerini girin ve yetkili kişileri ekleyin</p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Geri Dön</span>
        </Button>
      </div>

      {supplierCreated ? (
        /* Success State */
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tebrikler, {createdSupplierInfo?.is_individual ? 'Bireysel ' : ''}Tedarikçi Başarı ile Oluşturuldu!
              </h2>
              
              <p className="text-gray-600 mb-6">
                <strong>{createdSupplierInfo?.company_name}</strong> {createdSupplierInfo?.is_individual ? 'bireysel tedarikçi' : 'tedarikçi şirketi'} başarıyla sisteme eklendi.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {createdSupplierInfo?.is_individual ? 'Kişi Adı:' : 'Firma Adı:'}
                    </span>
                    <span className="text-sm text-gray-900">{createdSupplierInfo?.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Tür:</span>
                    <span className="text-sm text-gray-900">
                      {createdSupplierInfo?.is_individual ? 'Bireysel' : 'Şirket'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Kategori:</span>
                    <span className="text-sm text-gray-900">{createdSupplierInfo?.supplier_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Uzmanlık:</span>
                    <span className="text-sm text-gray-900">{createdSupplierInfo?.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {createdSupplierInfo?.is_individual ? 'İletişim Bilgileri:' : 'Yetkili Kişiler:'}
                    </span>
                    <span className="text-sm text-gray-900">{createdSupplierInfo?.contacts_count} kişi</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  🎉 Tedarikçi başarıyla kaydedildi ve artık "Tüm Tedarikçiler" listesinde görüntülenebilir.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Yeni Tedarikçi Ekle</span>
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
              
              {/* Individual Supplier Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="individual-supplier"
                  checked={isIndividualSupplier}
                  onChange={(e) => setIsIndividualSupplier(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label 
                  htmlFor="individual-supplier" 
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Bireysel Tedarikçi
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tedarikçi Türü */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tedarikçi Türü *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                      value={formData.supplier_type_id}
                      onValueChange={(value) => handleInputChange('supplier_type_id', value)}
                      placeholder="Tedarikçi türü seçin..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCategoryModal}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Uzmanlık Alanı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uzmanlık Alanı *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={specialties.map(spec => ({ value: spec.id, label: spec.name }))}
                      value={formData.specialty_id}
                      onValueChange={(value) => handleInputChange('specialty_id', value)}
                      placeholder="Uzmanlık alanı seçin..."
                      disabled={!formData.supplier_type_id}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSpecialtyModal}
                    disabled={!formData.supplier_type_id}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tedarikçi Bilgileri - Only show if not individual supplier */}
        {!isIndividualSupplier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Tedarikçi Form Bilgileri</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Telefon numarası"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cep Telefonu
                </label>
                <PhoneInput
                  value={formData.mobile}
                  onChange={(value) => handleInputChange('mobile', value)}
                  placeholder="Cep telefonu numarası"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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

        {!isIndividualSupplier && (
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
                        onChange={(e) => handleIbanChange(e.target.value)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cep Telefonu
                    </label>
                    <PhoneInput
                      value={contact.mobile}
                      onChange={(value) => handleContactChange(contactIndex, 'mobile', value)}
                      placeholder="Cep telefonu numarası"
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
                    placeholder="Bireysel tedarikçi adresi..."
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

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Kaydediliyor...' : 'Tedarikçi Kaydet'}
          </Button>
        </div>
      </form>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSave={handleCategorySaved}
        />
      )}

      {/* Add Specialty Modal */}
      {showAddSpecialtyModal && (
        <AddSpecialtyModal
          onClose={() => setShowAddSpecialtyModal(false)}
          onSave={handleSpecialtySaved}
          categoryId={formData.supplier_type_id}
          categoryName={getCategoryName(formData.supplier_type_id)}
        />
      )}
    </div>
  );
};

export default NewSupplierForm;