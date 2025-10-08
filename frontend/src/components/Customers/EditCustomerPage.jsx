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
  CheckCircle,
  CreditCard,
  Trash2,
  Edit
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EditCustomerPage({ customer, onBack, onSave }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_short_name: '',
    company_title: '',
    customer_type_id: '',
    specialty_id: '',
    address: '',
    country: '',
    city: '',
    phone: '',
    mobile: '',
    email: '',
    tax_office: '',
    tax_number: '',
    services: [],
    tags: [],
    notes: '',
    contactPerson: '',
    iban: '',
    currency: 'TRY'
  });

  // Dropdown data
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [newTag, setNewTag] = useState('');

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      setFormData({
        company_short_name: customer.companyName || '',
        company_title: customer.companyTitle || '',
        customer_type_id: customer.relationshipType || 'customer',
        specialty_id: customer.sector || '',
        address: customer.address || '',
        country: customer.country || '',
        city: customer.city || '',
        phone: customer.phone || '',
        mobile: customer.phone || '', // Backend'de mobile ayrı field yok, phone'u kullan
        email: customer.email || '',
        tax_office: customer.taxOffice || '',
        tax_number: customer.taxNumber || '',
        services: customer.services || [],
        tags: customer.tags || [],
        notes: customer.notes || '',
        contactPerson: customer.contactPerson || '',
        iban: customer.iban || '',
        currency: customer.currency || 'TRY'
      });
    }
    loadDropdownData();
  }, [customer]);

  const loadDropdownData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Load customer types
      const customerTypesResponse = await fetch(`${backendUrl}/api/customer-types`);
      if (customerTypesResponse.ok) {
        const customerTypesData = await customerTypesResponse.json();
        setCustomerTypes(customerTypesData);
      }
      
      // Load sectors
      const sectorsResponse = await fetch(`${backendUrl}/api/sectors`);
      if (sectorsResponse.ok) {
        const sectorsData = await sectorsResponse.json();
        setSectors(sectorsData);
      }
      
      // Load countries
      const countriesResponse = await fetch(`${backendUrl}/api/countries`);
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);
      }
      
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Removed unused contact functions since we're using single contact person field

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      if (!formData.company_short_name.trim()) {
        toast({
          title: "Eksik Bilgi",
          description: "Firma kısa adı zorunludur.",
          variant: "destructive"
        });
        return;
      }

      const updatedCustomer = {
        id: customer.id,
        companyName: formData.company_short_name,
        companyTitle: formData.company_title,
        relationshipType: formData.customer_type_id || 'customer',
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        country: formData.country,
        city: formData.city,
        sector: formData.specialty_id,
        taxOffice: formData.tax_office,
        taxNumber: formData.tax_number,
        iban: formData.iban,
        currency: formData.currency,
        tags: formData.tags,
        notes: formData.notes,
        services: formData.services || []
      };

      console.log('Updating customer:', updatedCustomer);

      toast({
        title: "Başarılı",
        description: "Müşteri bilgileri başarıyla güncellendi.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      if (onSave) {
        onSave(updatedCustomer);
      }

      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-white hover:bg-white/20 p-2 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Edit className="h-7 w-7" />
                  </div>
                  <h1 className="text-3xl font-bold">Müşteri Düzenle</h1>
                </div>
                <p className="mt-2 text-orange-100">
                  {customer?.companyName || customer?.name || customer?.fullName} - Müşteri bilgilerini düzenleyin
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.company_short_name.trim()}
              className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-2 font-semibold rounded-lg shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Güncelle
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Müşteri Türü ve Sektör */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>Müşteri Türü ve Sektör</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Müşteri Türü *
                    </label>
                    <Select value={formData.customer_type_id} onValueChange={(value) => handleInputChange('customer_type_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri türü seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customerTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sektör *
                    </label>
                    <Select value={formData.specialty_id} onValueChange={(value) => handleInputChange('specialty_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sektör seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firma Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <span>Firma Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firma Kısa Adı *
                    </label>
                    <Input
                      value={formData.company_short_name}
                      onChange={(e) => handleInputChange('company_short_name', e.target.value)}
                      placeholder="Örn: ABC Ltd"
                      className="w-full"
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
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
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
                      Ülke *
                    </label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ülke seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.iso2} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Şehir *
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Şehir adı"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* İletişim Bilgileri */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <span>İletişim Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
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
                      Cep Telefonu *
                    </label>
                    <PhoneInput
                      country={'tr'}
                      value={formData.mobile}
                      onChange={(value) => handleInputChange('mobile', value)}
                      enableSearch={true}
                      inputClass="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="ornek@sirket.com"
                      className="w-full"
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
                      className="w-full"
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
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <span>Adres Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ülke
                    </label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Ülke"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şehir
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Şehir"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Detaylı adres bilgisi"
                    className="w-full min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Contact Person */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <span>İletişim Kişisi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İletişim Kişisi Adı
                  </label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="İletişim kişisinin adı"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hizmetler ve Finansal */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <span>Hizmetler ve Finansal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hizmetler
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => {
                            const newServices = [...formData.services];
                            newServices.splice(index, 1);
                            handleInputChange('services', newServices);
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    placeholder="IBAN numarası"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Para Birimi
                  </label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                      <SelectItem value="USD">USD - Dolar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  <span>Etiketler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        <span>{tag}</span>
                        <Button
                          onClick={() => removeTag(tag)}
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-4 w-4 p-0 text-blue-600 hover:bg-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Yeni etiket ekle"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button
                      onClick={addTag}
                      size="sm"
                      variant="outline"
                      disabled={!newTag.trim()}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span>Notlar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Müşteri hakkında notlarınız..."
                  className="w-full min-h-[120px]"
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}