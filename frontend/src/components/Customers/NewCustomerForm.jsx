import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  CheckCircle
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useIban } from '../../hooks/useIban';
import { formToDb, getEmptyForm } from '../../models/customer.mapper';
import { parseJsonSafe, apiPostCustomer } from '../../api/utils/parse';

import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';
import AddCustomerTypeModal from './AddCustomerTypeModal';
import AddSectorModal from './AddSectorModal';
import AddCountryModal from './AddCountryModal';
import AddCityModal from './AddCityModal';
import CustomerSuccessModal from './CustomerSuccessModal';

const NewCustomerForm = ({ onClose, onSave, returnToInvoice, onCustomerAdded, refreshCustomers }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCustomerData, setSavedCustomerData] = useState(null);
  const [createdCustomerInfo, setCreatedCustomerInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isIndividualCustomer, setIsIndividualCustomer] = useState(false);
  const [showAddCustomerTypeModal, setShowAddCustomerTypeModal] = useState(false);
  const [showAddSectorModal, setShowAddSectorModal] = useState(false);
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [geoRefreshTrigger, setGeoRefreshTrigger] = useState(0);
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
  
  // Countries and cities from library
  const [ulkeler, setUlkeler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [tumUlkeler, setTumUlkeler] = useState([]);
  const [contactSehirler, setContactSehirler] = useState({});

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
    sector_id: '',
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

  const [currentContactTag, setCurrentContactTag] = useState('');
  const [currentService, setCurrentService] = useState('');
  const [isUSABankFormat, setIsUSABankFormat] = useState(false);
  
  // IBAN hook'u kullan
  const { ibanError, handleIbanChange } = useIban();

  // Load data on mount
  useEffect(() => {
    loadCustomerTypes();
    loadSectors();
    loadUlkeler();
  }, []);
  
  // Load countries from library
  const loadUlkeler = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/countries`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const ulkeIsimleri = data.map(d => d.name).filter(n => n).sort();
        setUlkeler(ulkeIsimleri);
        setTumUlkeler(data);
      }
    } catch (error) {
      console.error('Ülkeler yüklenemedi:', error);
    }
  };
  
  // Filter cities when country changes
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
  
  // Filter cities for contacts when their country changes
  useEffect(() => {
    const newContactSehirler = {};
    contacts.forEach((contact, index) => {
      if (contact.country && tumUlkeler.length > 0) {
        const secilenUlke = tumUlkeler.find(u => u.name === contact.country);
        if (secilenUlke && secilenUlke.cities) {
          newContactSehirler[index] = [...new Set(secilenUlke.cities.filter(c => c))].sort();
        }
      }
    });
    setContactSehirler(newContactSehirler);
  }, [contacts, tumUlkeler]);

  // Load specialties when category changes
  useEffect(() => {
    if (formData.customer_type_id) {
      // Temporarily disable to prevent infinite loop
      // loadSpecialties(formData.customer_type_id);
    } else {
      setSpecialties([]);
    }
  }, [formData.customer_type_id]);

  const loadCustomerTypes = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      console.log('Loading customer types from:', `${backendUrl}/api/customer-types`);
      const response = await fetch(`${backendUrl}/api/customer-types`);
      if (response.ok) {
        const data = await response.json();
        console.log('Customer types loaded:', data);
        setCustomerTypes(data);
      } else {
        console.error('Failed to load customer types, status:', response.status);
        throw new Error('Failed to load customer types');
      }
    } catch (error) {
      console.error('Error loading customer types:', error);
      toast({
        title: "Hata",
        description: "Müşteri türleri yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const loadSectors = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      console.log('Loading sectors from:', `${backendUrl}/api/sectors`);
      const response = await fetch(`${backendUrl}/api/sectors`);
      if (response.ok) {
        const data = await response.json();
        console.log('Sectors loaded:', data);
        setSectors(data);
      } else {
        console.error('Failed to load sectors, status:', response.status);
        throw new Error('Failed to load sectors');
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
      toast({
        title: "Hata",
        description: "Sektörler yüklenirken hata oluştu",
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

  // Test verisi doldurma fonksiyonu - TEST İÇİN, DAHA SONRA KALDIRILACAK
  const fillTestData = () => {
    console.log('🧪 fillTestData called');
    console.log('  customerTypes:', customerTypes?.length || 0);
    console.log('  sectors:', sectors?.length || 0);
    
    // Check if data is loaded
    if (!customerTypes || !sectors || customerTypes.length === 0 || sectors.length === 0) {
      console.log('❌ Data not loaded yet');
      toast({
        title: "Hata",
        description: "Müşteri türleri ve sektörler henüz yüklenmedi. Lütfen birkaç saniye bekleyin.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Data loaded, filling test data...');

    const testCompanyNames = [
      'Teknoloji Çözümleri A.Ş.',
      'İnovasyon Medya Ltd.',
      'Dijital Pazarlama Ajansı',
      'Yaratıcı Tasarım Studio',
      'E-Ticaret Uzmanları A.Ş.',
      'Mobil Uygulama Geliştiricileri'
    ];
    
    const testServices = ['Web Tasarım', 'Mobil Uygulama', 'SEO Optimizasyonu', 'Sosyal Medya Yönetimi', 'Grafik Tasarım'];
    
    const randomCompanyName = testCompanyNames[Math.floor(Math.random() * testCompanyNames.length)];
    // Use actual loaded data for sectors and customer types
    const randomSector = sectors[Math.floor(Math.random() * sectors.length)]?.value || 'teknoloji';
    const randomCustomerType = customerTypes[Math.floor(Math.random() * customerTypes.length)]?.value || 'mevcut_musteri';
    const randomServices = testServices.slice(0, Math.floor(Math.random() * 3) + 1);
    
    const testData = {
      company_short_name: randomCompanyName.replace(' A.Ş.', '').replace(' Ltd.', ''),
      company_title: randomCompanyName,
      customer_type_id: randomCustomerType,
      specialty_id: randomSector,
      phone: '+90 212 555 ' + Math.floor(Math.random() * 9000 + 1000),
      mobile: '+90 532 ' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000),
      email: 'info@' + randomCompanyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15) + '.com',
      address: `${Math.floor(Math.random() * 200) + 1} Sok. No:${Math.floor(Math.random() * 50) + 1} Beşiktaş/İstanbul`,
      country: 'TR',
      city: 'İstanbul',
      tax_office: 'Beşiktaş Vergi Dairesi',
      tax_number: '1' + Math.floor(Math.random() * 900000000 + 100000000),
      services: randomServices,
      iban: 'TR33 0006 1005 1978 6457 8413 26',
      bank_name: 'Ziraat Bankası',
      bank_branch: 'Beşiktaş Şubesi',
      account_holder_name: randomCompanyName,
      swift_code: 'TCZBTR2A',
      notes: 'Test müşterisi - otomatik doldurulmuş veriler'
    };

    // Contacts için test verisi
    const testContacts = [{
      full_name: 'Ahmet Test Kişisi',
      mobile: '+90 532 ' + Math.floor(Math.random() * 900 + 100) + ' ' + Math.floor(Math.random() * 9000 + 1000),
      email: 'ahmet@' + randomCompanyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15) + '.com',
      position: 'Genel Müdür',
      tags: [],
      address: testData.address,
      country: 'TR',
      city: 'İstanbul'
    }];

    // Preserve is_candidate value when filling test data
    setFormData(prev => ({
      ...prev,
      ...testData
    }));
    setContacts(testContacts);
    
    toast({
      title: "Test Verisi Dolduruldu",
      description: `${randomCompanyName} test verileri ile form dolduruldu`,
      variant: "default"
    });
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
      // Ensure tags is always an array
      const currentTags = Array.isArray(updatedContacts[contactIndex].tags) ? updatedContacts[contactIndex].tags : [];
      updatedContacts[contactIndex].tags = [...currentTags, currentContactTag.trim()];
      setContacts(updatedContacts);
      setCurrentContactTag('');
    }
  };

  const handleRemoveContactTag = (contactIndex, tagIndex) => {
    const updatedContacts = [...contacts];
    // Ensure tags is always an array
    const currentTags = Array.isArray(updatedContacts[contactIndex].tags) ? updatedContacts[contactIndex].tags : [];
    updatedContacts[contactIndex].tags = currentTags.filter((_, i) => i !== tagIndex);
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

  const getCustomerTypeName = (customerTypeValue) => {
    const customerType = customerTypes.find(type => type.value === customerTypeValue);
    return customerType ? customerType.name : 'Bilinmiyor';
  };

  const getSectorName = (sectorValue) => {
    const sector = sectors.find(s => s.value === sectorValue);
    return sector ? sector.name : 'Bilinmiyor';
  };

  // Handle country change and update phone numbers accordingly
  const handleCountryChange = (country) => {
    const countryCode = country ? country.iso2 : '';
    
    // Reset city when country changes
    const cityValue = formData.city;
    
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

  // Handle contact country change and update contact phone numbers
  const handleContactCountryChange = (contactIndex, countryName) => {
    // Update contact in single operation to prevent re-render loop
    setContacts(prev => {
      const updated = [...prev];
      const contact = updated[contactIndex];
      
      // Update contact fields
      updated[contactIndex] = {
        ...contact,
        country: countryName,
        city: ''  // Clear city when country changes
      };
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation - more required fields (sector_id is now optional)
    const requiredFieldsValid = isIndividualCustomer 
      ? formData.customer_type_id && formData.specialty_id && 
        contacts[0]?.full_name && contacts[0]?.email && contacts[0]?.mobile && contacts[0]?.position &&
        contacts[0]?.address && contacts[0]?.country && contacts[0]?.city  // Contact location info required
      : formData.company_short_name && formData.company_title && formData.customer_type_id && 
        formData.specialty_id && formData.email && formData.phone && 
        formData.mobile && formData.country && formData.city && formData.address &&  // Company basic info required + address
        contacts[0]?.full_name && contacts[0]?.email && contacts[0]?.mobile && contacts[0]?.position &&
        contacts[0]?.address && contacts[0]?.country && contacts[0]?.city; // Contact person + location required
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: isIndividualCustomer 
          ? "Zorunlu alanları doldurunuz: Müşteri türü, uzmanlık, yetkili kişi bilgileri (ad, email, telefon, görev, adres, ülke, şehir)"
          : "Zorunlu alanları doldurunuz: Firma bilgileri (ad, ünvan, adres, ülke, şehir), iletişim bilgileri ve yetkili kişi bilgileri (ad, email, telefon, görev, adres, ülke, şehir)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Prepare customer data based on type
      const baseCustomerData = isIndividualCustomer 
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

      // Determine endpoint: /api/leads for prospects, /api/customers for regular customers
      const isProspect = baseCustomerData.is_candidate || false;
      const endpoint = isProspect ? '/api/leads' : '/api/customers';
      
      console.log(`Creating ${isProspect ? 'lead' : 'customer'} via ${endpoint}`);
      
      // Use mapper to convert form data to DB format including contact person details
      const dataToSave = formToDb({
        ...baseCustomerData,
        contactPerson: contacts[0]?.full_name || '',
        // Contact person details from contacts array
        contact_mobile: contacts[0]?.mobile || '',
        contact_email: contacts[0]?.email || '', 
        contact_position: contacts[0]?.position || '',
        contact_address: contacts[0]?.address || '',
        contact_country: contacts[0]?.country || '',
        contact_city: contacts[0]?.city || '',
      });
      
      // Always save to backend first (do NOT call onSave yet - wait for modal)
      let savedData = null;
      
      // Post to appropriate endpoint
      if (isProspect) {
        // Create lead
        const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
          throw new Error('Lead oluşturulamadı');
        }
        
        const result = await response.json();
        savedData = result.lead || result;
      } else {
        // Create customer using existing API function
        savedData = await apiPostCustomer(dataToSave);
      }
      
      console.log(`${isProspect ? 'Lead' : 'Customer'} saved:`, savedData);

      // Set success state with customer data for modal
      const customerDataForModal = {
        companyName: baseCustomerData.company_short_name || baseCustomerData.company_title,
        isProspect: formData.is_candidate || false,
        customerId: savedData?.id,
        savedData: savedData // Store for later use
      };
      
      console.log('🎉 Setting success modal data:', customerDataForModal);
      setSavedCustomerData(customerDataForModal);
      setShowSuccessModal(true);
      console.log('🎉 Success modal should now be visible');

      // DO NOT redirect or call callbacks here - wait for modal to be dismissed

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
          <div className="bg-white flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yeni Müşteri</h1>
              <p className="text-gray-600">Müşteri bilgilerini girin ve yetkili kişileri ekleyin</p>
            </div>
            {/* TEST BUTONU - DAHA SONRA KALDIRILACAK */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillTestData}
              className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 flex items-center space-x-2"
            >
              <span>🧪</span>
              <span>Test Verisi Doldur</span>
            </Button>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        )}
      </div>

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
                      options={(customerTypes || []).map(type => ({ value: type.value, label: type.name }))}
                      value={formData.customer_type_id}
                      onValueChange={(value) => handleInputChange('customer_type_id', value)}
                      placeholder="Müşteri türü seçin..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomerTypeModal(true)}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sektör */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sektör
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={(sectors || []).map(sector => ({ value: sector.value, label: sector.name }))}
                      value={formData.specialty_id}
                      onValueChange={(value) => handleInputChange('specialty_id', value)}
                      placeholder="Sektör seçin..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSectorModal(true)}
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
                Adres <span className="text-red-500">*</span>
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
                  Ülke <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCountryModal(true)}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Şehir <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Select
                      value={formData.city}
                      onValueChange={(value) => handleInputChange('city', value)}
                      disabled={!formData.country}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Önce ülke seçiniz..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sehirler.map(sehir => (
                          <SelectItem key={sehir} value={sehir}>{sehir}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCityModal(true)}
                    disabled={!formData.country}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
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
                {(formData.services || []).map((service, index) => (
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
                        IBAN
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
            {(contacts || []).map((contact, contactIndex) => (
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
                      Ad Soyadı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={contact.full_name}
                      onChange={(e) => handleContactChange(contactIndex, 'full_name', e.target.value)}
                      placeholder="Ad Soyadı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cep Telefonu <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      key={`contact-${contactIndex}-mobile-${contact.country || 'tr'}`}
                      country={contact.country || "tr"}
                      value={contact.mobile}
                      onChange={(value) => handleContactChange(contactIndex, 'mobile', value)}
                      enableSearch={true}
                      inputClass="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
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
                      Görevi <span className="text-red-500">*</span>
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
                    Adres <span className="text-red-500">*</span>
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
                      Ülke <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Select
                          value={contact.country}
                          onValueChange={(value) => handleContactCountryChange(contactIndex, value)}
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddCountryModal(true)}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Şehir <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Select
                          value={contact.city}
                          onValueChange={(value) => handleContactChange(contactIndex, 'city', value)}
                          disabled={!contact.country}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Önce ülke seçiniz..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {(contactSehirler[contactIndex] || []).map(sehir => (
                              <SelectItem key={sehir} value={sehir}>{sehir}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddCityModal(true)}
                        disabled={!contact.country}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
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
                placeholder="Müşteri hakkında notlarınız, özel durumlar, yorumlar..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
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

      {/* Add Customer Type Modal */}
      {showAddCustomerTypeModal && (
        <AddCustomerTypeModal
          onClose={() => setShowAddCustomerTypeModal(false)}
          onSave={(newType) => {
            // Refresh customer types and select the new one
            loadCustomerTypes();
            handleInputChange('customer_type_id', newType.value);
            setShowAddCustomerTypeModal(false);
          }}
        />
      )}

      {/* Add Sector Modal */}
      {showAddSectorModal && (
        <AddSectorModal
          onClose={() => setShowAddSectorModal(false)}
          onSave={(newSector) => {
            // Refresh sectors and select the new one
            loadSectors();
            handleInputChange('specialty_id', newSector.value);
            setShowAddSectorModal(false);
          }}
        />
      )}

      {/* Add Country Modal */}
      {showAddCountryModal && (
        <AddCountryModal
          onClose={() => setShowAddCountryModal(false)}
          onSave={(newCountry) => {
            // Country added successfully - refresh geo data
            setGeoRefreshTrigger(prev => prev + 1);
            setShowAddCountryModal(false);
            toast({
              title: "Başarılı",
              description: `${newCountry.name} ülkesi eklendi`,
              variant: "default"
            });
          }}
        />
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <AddCityModal
          onClose={() => setShowAddCityModal(false)}
          selectedCountry={formData.country}
          onSave={(newCity) => {
            // City added successfully - refresh geo data
            setGeoRefreshTrigger(prev => prev + 1);
            setShowAddCityModal(false);
            toast({
              title: "Başarılı",
              description: `${newCity.name} şehri eklendi`,
              variant: "default"
            });
          }}
        />
      )}

      {/* Success Modal */}
      <CustomerSuccessModal 
        isOpen={showSuccessModal}
        customerData={savedCustomerData}
        isProspect={savedCustomerData?.isProspect}
        onClose={async (route) => {
          console.log('🎯 Modal onClose called with route:', route);
          setShowSuccessModal(false);
          
          // IMPORTANT: Refresh customers list so new customer appears in Müşteriler page
          if (refreshCustomers && !savedCustomerData?.isProspect) {
            console.log('🔄 Refreshing customers list...');
            await refreshCustomers();
            console.log('✅ Customers list refreshed');
          }
          
          // Eğer faturadan geliyorsak ve müşteri eklendiyse, fatura sayfasına dön
          if (returnToInvoice && onCustomerAdded && savedCustomerData?.customerId) {
            console.log('🔙 Returning to invoice');
            onCustomerAdded(savedCustomerData.customerId, savedCustomerData.companyName);
          } else {
            // Normal durumda ilgili sayfaya yönlendir
            console.log('🚀 Navigating to route:', route);
            onClose(route);
          }
        }}
      />
    </div>
  );
};

export default NewCustomerForm;