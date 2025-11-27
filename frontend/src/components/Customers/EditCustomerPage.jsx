import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Briefcase
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { dbToForm, formToDb } from '../../models/customer.mapper';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EditCustomerPage({ customer, onBack, onSave }) {
  console.log('=== COMPONENT RENDERED ===');
  console.log('Customer prop:', customer);
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize from customer directly
  const initialData = {
    company_short_name: customer.companyName || '',
    company_title: customer.companyTitle || '',
    customer_type_id: customer.relationshipType || '',
    specialty_id: customer.sector || '',
    source: customer.source || '',
    status: customer.status || 'active',
    address: customer.address || '',
    country: customer.country || '',
    city: customer.city || '',
    phone: customer.phone || '',
    mobile: customer.mobile || '',
    email: customer.email || '',
    tax_office: customer.taxOffice || '',
    tax_number: customer.taxNumber || '',
    services: customer.services || [],
    tags: customer.tags || [],
    notes: customer.notes || ''
  };
  
  const [formData, setFormData] = useState(initialData);
  const [initialFormData] = useState(JSON.parse(JSON.stringify(initialData))); // Deep clone
  const [initialContacts] = useState(JSON.parse(JSON.stringify(customer.contacts || []))); // Store initial contacts
  
  console.log('Initial formData:', formData);
  
  // Modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  
  // Dropdown options
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [ulkeler, setUlkeler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  
  // Tags and contacts - Initialize from customer data
  const [currentTag, setCurrentTag] = useState('');
  const [contacts, setContacts] = useState(() => {
    // Use contacts from customer
    const contactsData = customer.contacts || [];
    if (contactsData.length === 0) {
      return [{
        full_name: '',
        position: '',
        mobile: '',
        email: '',
        address: '',
        country: '',
        city: '',
        birthday: '',
        gender: '',
        project_role: '',
        is_accounting_responsible: false
      }];
    }
    return contactsData.map(contact => ({
      full_name: contact.fullName || contact.full_name || '',
      position: contact.position || '',
      mobile: contact.mobile || '',
      email: contact.email || '',
      address: contact.address || '',
      country: contact.country || '',
      city: contact.city || '',
      birthday: contact.birthday || '',
      gender: contact.gender || '',
      project_role: contact.project_role || '',
      is_accounting_responsible: contact.is_accounting_responsible || false
    }));
  });
  
  // Load dropdown data
  useEffect(() => {
    loadCustomerTypes();
    loadSectors();
    loadUlkeler();
  }, []);
  
  // Map customer type code to ID after options load
  useEffect(() => {
    if (customerTypes.length > 0 && customer.relationshipType) {
      // Find by value field
      const matchingType = customerTypes.find(t => t.value === customer.relationshipType);
      if (matchingType) {
        console.log('✅ Customer Type Match:', matchingType);
        setFormData(prev => ({...prev, customer_type_id: matchingType.id}));
      } else {
        console.log('❌ No match for relationshipType:', customer.relationshipType);
      }
    }
  }, [customerTypes, customer.relationshipType]);
  
  // Map sector code to ID after options load
  useEffect(() => {
    if (sectors.length > 0 && customer.sector) {
      // Find by value field
      const matchingSector = sectors.find(s => s.value === customer.sector);
      if (matchingSector) {
        console.log('✅ Sector Match:', matchingSector);
        setFormData(prev => ({...prev, specialty_id: matchingSector.id}));
      } else {
        console.log('❌ No match for sector:', customer.sector);
      }
    }
  }, [sectors, customer.sector]);
  
  // Set status and tags directly from customer
  useEffect(() => {
    if (customer) {
      console.log('=== DEBUG REMAINING FIELDS ===');
      console.log('customer.status:', customer.status);
      console.log('customer.country:', customer.country);
      console.log('customer.tags:', customer.tags, 'type:', typeof customer.tags);
      
      setFormData(prev => ({
        ...prev,
        status: customer.status || 'active',
        tags: Array.isArray(customer.tags) ? customer.tags : []
      }));
    }
  }, [customer]);
  
  // Map country after ulkeler loads
  useEffect(() => {
    console.log('🔵 ÜLKE MAPPING useEffect');
    console.log('customer:', customer);
    console.log('customer.country:', customer?.country);
    console.log('ulkeler array:', ulkeler);
    console.log('ulkeler length:', ulkeler?.length);
    
    if (!customer) {
      console.log('❌ customer yok');
      return;
    }
    
    if (!ulkeler || ulkeler.length === 0) {
      console.log('❌ ulkeler boş veya yüklenmedi');
      return;
    }
    
    const rawCountry = customer.country || '';
    console.log('rawCountry:', rawCountry);
    
    if (!rawCountry) {
      console.log('❌ rawCountry boş');
      return;
    }
    
    // ulkeler is array of objects with {id, name, code, value}
    const foundCountry = ulkeler.find(c => 
      c.name === rawCountry ||
      c.name?.toLowerCase() === rawCountry?.toLowerCase() ||
      c.code === rawCountry ||
      c.value === rawCountry ||
      c.id === rawCountry
    );
    
    console.log('foundCountry:', foundCountry);
    
    if (foundCountry) {
      // Set the country name (since options use name as value)
      setFormData(prev => ({
        ...prev,
        country: foundCountry.name
      }));
      console.log('✅ Country set to:', foundCountry.name);
    } else {
      console.log('❌ Ülke bulunamadı! rawCountry:', rawCountry);
      if (ulkeler.length > 0) {
        console.log('İlk 5 ülke:', ulkeler.slice(0, 5).map(c => c.name));
      }
    }
  }, [customer, ulkeler]);
  
  // Don't use auto-mapping - let form show original values
  // User will select from dropdown if needed
  
  const loadCustomerTypes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/customer-types`);
      const data = await response.json();
      setCustomerTypes(data);
    } catch (error) {
      console.error('Error loading customer types:', error);
    }
  };
  
  const loadSectors = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/sectors`);
      const data = await response.json();
      setSectors(data);
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };
  
  const loadUlkeler = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/countries`);
      const data = await response.json();
      console.log('🟢 Countries API Response:', data);
      setUlkeler(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading countries:', error);
      setUlkeler([]);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };
  
  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData({
      ...formData,
      tags: [...currentTags, currentTag.trim()]
    });
    setCurrentTag('');
  };
  
  const handleRemoveTag = (tagIndex) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData({
      ...formData,
      tags: currentTags.filter((_, i) => i !== tagIndex)
    });
  };
  
  // Check if form has changes - Simple string comparison
  const hasChanges = () => {
    try {
      // Compare formData
      const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      
      // Compare contacts
      const contactsChanged = JSON.stringify(contacts) !== JSON.stringify(initialContacts);
      
      const hasChange = formChanged || contactsChanged;
      console.log('🔍 Change detection:', { formChanged, contactsChanged, hasChange });
      
      return hasChange;
    } catch (error) {
      console.error('Error checking changes:', error);
      return false;
    }
  };
  
  // Handle back button click
  const handleBackClick = () => {
    const hasChange = hasChanges();
    console.log('🔙 Back button clicked, hasChanges:', hasChange);
    
    if (hasChange) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };
  
  // Save and go back
  const handleSaveAndBack = async () => {
    console.log('💾 handleSaveAndBack called');
    setIsLoading(true);
    
    try {
      const fakeEvent = { preventDefault: () => {} };
      const success = await handleSubmit(fakeEvent);
      console.log('💾 Save result:', success);
      
      if (success === true) {
        console.log('✅ Save successful, closing modal and going back');
        setShowUnsavedModal(false);
        setTimeout(() => {
          onBack();
        }, 200);
      } else {
        console.log('❌ Save failed');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  };
  
  // Discard changes and go back
  const handleDiscardAndBack = () => {
    console.log('💨 Discarding changes');
    setShowUnsavedModal(false);
    onBack();
  };
  
  // Cancel modal
  const handleCancelModal = () => {
    console.log('❌ Modal cancelled');
    setShowUnsavedModal(false);
  };
  
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsLoading(true);
    
    try {
      // Convert dropdown IDs to values/codes before saving
      const dataToSave = { ...formData };
      
      // Müşteri Türü: ID → value (code)
      if (dataToSave.customer_type_id && customerTypes.length > 0) {
        const typeObj = customerTypes.find(t => t.id === dataToSave.customer_type_id);
        if (typeObj) {
          dataToSave.customer_type_id = typeObj.value || typeObj.code;
        }
      }
      
      // Sektör: ID → value (code)
      if (dataToSave.specialty_id && sectors.length > 0) {
        const sectorObj = sectors.find(s => s.id === dataToSave.specialty_id);
        if (sectorObj) {
          dataToSave.specialty_id = sectorObj.value || sectorObj.code;
        }
      }
      
      // Prepare data with formToDb mapper
      const finalData = formToDb({
        ...dataToSave,
        contacts: contacts
      });
      
      console.log('💾 Saving data:', finalData);
      
      const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Response error:', errorData);
        throw new Error(errorData.detail || 'Failed to update customer');
      }
      
      const result = await response.json();
      console.log('✅ Update successful:', result);
      
      toast({
        title: "Başarılı!",
        description: "Müşteri bilgileri güncellendi.",
      });
      
      if (onSave) {
        onSave(result.customer || result);
      }
      
      setIsLoading(false);
      return true;
      
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      toast({
        title: "Hata!",
        description: error.message || "Müşteri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Geri Dön</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Müşteri Düzenle</h1>
              <p className="text-gray-600 mt-1">Müşteri bilgilerini güncelleyin</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kategori Seçimi */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Kategori Seçimi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Müşteri Türü */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Türü <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.customer_type_id} 
                    onValueChange={(value) => handleInputChange('customer_type_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri türü seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sektör */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sektör
                  </label>
                  <Select 
                    value={formData.specialty_id} 
                    onValueChange={(value) => handleInputChange('specialty_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sektör seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Kaynak */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kaynak
                  </label>
                  <Input
                    value={formData.source || ''}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="Kaynak seçin..."
                  />
                </div>
                
                {/* Durum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <Input
                    value={formData.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    placeholder="Durum"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Firma Bilgileri */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <span>Firma Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Firma Adı ve Ünvanı */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Kısa Adı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.company_short_name || ''}
                    onChange={(e) => handleInputChange('company_short_name', e.target.value)}
                    placeholder="Örneğin: Yapı Kredi"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Ünvanı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.company_title || ''}
                    onChange={(e) => handleInputChange('company_title', e.target.value)}
                    placeholder="Örn: ABC Lojistik Limited Şirketi"
                    required
                  />
                </div>
              </div>
              
              {/* Adres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Firma adresi"
                  rows={3}
                  required
                />
              </div>
              
              {/* Ülke ve Şehir */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ülke <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={formData.country || ''} 
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Ülke seçiniz...</option>
                    {Array.isArray(ulkeler) && ulkeler.map(ulke => (
                      <option key={ulke.id || ulke.name} value={ulke.name}>
                        {ulke.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Şehir seçiniz..."
                    required
                  />
                </div>
              </div>
              
              {/* Telefon ve Cep */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    country={'tr'}
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    enableSearch={true}
                    inputClass="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Cep Telefonu
                  </label>
                  <PhoneInput
                    country={'tr'}
                    value={formData.mobile}
                    onChange={(value) => handleInputChange('mobile', value)}
                    enableSearch={true}
                    inputClass="w-full"
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ornek@sirket.com"
                  required
                />
              </div>
              
              {/* Vergi Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vergi Dairesi
                  </label>
                  <Input
                    value={formData.tax_office || ''}
                    onChange={(e) => handleInputChange('tax_office', e.target.value)}
                    placeholder="Örn: Beşiktaş Vergi Dairesi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VKN
                  </label>
                  <Input
                    value={formData.tax_number || ''}
                    onChange={(e) => handleInputChange('tax_number', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
              </div>
              
              {/* Ürün ve Servisler - Tag Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün ve Servisler
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Ürün veya servis girin..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentTag.trim()) {
                          const currentServices = Array.isArray(formData.services) ? formData.services : [];
                          handleInputChange('services', [...currentServices, currentTag.trim()]);
                          setCurrentTag('');
                        }
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (currentTag.trim()) {
                        const currentServices = Array.isArray(formData.services) ? formData.services : [];
                        handleInputChange('services', [...currentServices, currentTag.trim()]);
                        setCurrentTag('');
                      }
                    }} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(formData.services) && formData.services.map((service, serviceIndex) => (
                    <span
                      key={serviceIndex}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => {
                          const currentServices = Array.isArray(formData.services) ? formData.services : [];
                          handleInputChange('services', currentServices.filter((_, i) => i !== serviceIndex));
                        }}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Yetkili Kişi Bilgileri */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <span>Yetkili Kişi Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-700">Yetkili Kişi #{index + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={contact.full_name || ''}
                        onChange={(e) => handleContactChange(index, 'full_name', e.target.value)}
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Görev <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={contact.position || ''}
                        onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                        placeholder="Örn: İş Geliştirme Müdürü"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cep Telefonu <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        country={'tr'}
                        value={contact.mobile}
                        onChange={(value) => handleContactChange(index, 'mobile', value)}
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
                        value={contact.email || ''}
                        onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={contact.is_accounting_responsible || false}
                      onChange={(e) => handleContactChange(index, 'is_accounting_responsible', e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Bu kişi firmanın muhasebe işlerinden sorumludur
                    </label>
                  </div>
                  
                  {/* Collapsible Adres */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Adres</span>
                    </summary>
                    <div className="mt-4 space-y-4 pl-6">
                      <Textarea
                        value={contact.address || ''}
                        onChange={(e) => handleContactChange(index, 'address', e.target.value)}
                        placeholder="Yetkili kişi adresi (opsiyonel)..."
                        rows={2}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ülke
                          </label>
                          <select 
                            value={contact.country || ''} 
                            onChange={(e) => handleContactChange(index, 'country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Ülke seçiniz...</option>
                            {Array.isArray(ulkeler) && ulkeler.map(ulke => (
                              <option key={ulke.id || ulke.name} value={ulke.name}>
                                {ulke.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Şehir
                          </label>
                          <Input
                            value={contact.city || ''}
                            onChange={(e) => handleContactChange(index, 'city', e.target.value)}
                            placeholder="Şehir seçiniz..."
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Doğum Günü
                          </label>
                          <Input
                            type="date"
                            value={contact.birthday || ''}
                            onChange={(e) => handleContactChange(index, 'birthday', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cinsiyet
                          </label>
                          <Select 
                            value={contact.gender} 
                            onValueChange={(value) => handleContactChange(index, 'gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Cinsiyet seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Kadın">Kadın</SelectItem>
                              <SelectItem value="Erkek">Erkek</SelectItem>
                              <SelectItem value="Diğer">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Proje Rolü
                        </label>
                        <Input
                          value={contact.project_role || ''}
                          onChange={(e) => handleContactChange(index, 'project_role', e.target.value)}
                          placeholder="Proje rolü seçin..."
                        />
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Notlar */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Notlar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar ve Yorumlar
              </label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Müşteri hakkında notlarınız, özel durumlar, yorumlar..."
                rows={4}
              />
            </CardContent>
          </Card>
          
          {/* Etiketler */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-orange-600" />
                <span>Etiketler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex space-x-2 mb-4">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Etiket girin..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagIndex)}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackClick}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span>Kaydediliyor...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Müşteriyi Kaydet</span>
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Kaydedilmemiş Değişiklikler
              </h3>
            </div>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">
              Yaptığınız değişiklikler kaydedilmedi. Kaydetmek istiyor musunuz?
            </p>
            
            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelModal}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleDiscardAndBack}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Kaydetme
              </button>
              <button
                onClick={handleSaveAndBack}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
