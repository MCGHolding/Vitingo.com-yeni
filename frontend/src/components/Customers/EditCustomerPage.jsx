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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data initialized from customer
  const [formData, setFormData] = useState(dbToForm(customer));
  
  // Dropdown options
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [ulkeler, setUlkeler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  
  // Tags and contacts
  const [currentTag, setCurrentTag] = useState('');
  const [contacts, setContacts] = useState(customer.contacts || [{
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
  }]);
  
  // Load dropdown data
  useEffect(() => {
    loadCustomerTypes();
    loadSectors();
    loadUlkeler();
  }, []);
  
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
      const response = await fetch(`${BACKEND_URL}/api/ulkeler`);
      const data = await response.json();
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data with contacts
      const dataToSave = formToDb({
        ...formData,
        contacts: contacts
      });
      
      const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update customer');
      }
      
      const result = await response.json();
      
      toast({
        title: "Başarılı!",
        description: "Müşteri bilgileri güncellendi.",
      });
      
      if (onSave) {
        onSave(result.customer || result);
      }
      
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Hata!",
        description: "Müşteri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              onClick={onBack}
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
                  <Select 
                    value={formData.status || 'active'} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçiniz..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.isArray(ulkeler) && ulkeler.map(ulke => (
                        <SelectItem key={ulke} value={ulke}>{ulke}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              
              {/* Ürün ve Servisler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün ve Servisler
                </label>
                <Input
                  value={formData.services ? formData.services.join(', ') : ''}
                  onChange={(e) => handleInputChange('services', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Ürün veya servis adı girin..."
                />
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
                          <Select 
                            value={contact.country} 
                            onValueChange={(value) => handleContactChange(index, 'country', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ülke seçiniz..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {Array.isArray(ulkeler) && ulkeler.map(ulke => (
                                <SelectItem key={ulke} value={ulke}>{ulke}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
              onClick={onBack}
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
    </div>
  );
}
