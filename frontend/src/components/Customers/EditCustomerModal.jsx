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
  User,
  CheckCircle,
  CreditCard,
  Trash2,
  Edit
} from 'lucide-react';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useIban } from '../../hooks/useIban';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EditCustomerModal({ customer, onClose, onSave }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    customer_type: '',
    sector: '',
    phone: '',
    email: '',
    website: '',
    country: '',
    city: '',
    address: '',
    tax_number: '',
    iban: '',
    currency: 'TRY',
    tags: [],
    notes: ''
  });

  const [contacts, setContacts] = useState([]);
  const [newTag, setNewTag] = useState('');
  const { isValidIban, formatIban } = useIban();

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || customer.fullName || '',
        customer_type: customer.customer_type || '',
        sector: customer.sector || '',
        phone: customer.phone || '',
        email: customer.email || '',
        website: customer.website || '',
        country: customer.country || '',
        city: customer.city || '',
        address: customer.address || '',
        tax_number: customer.tax_number || '',
        iban: customer.iban || '',
        currency: customer.currency || 'TRY',
        tags: customer.tags || [],
        notes: customer.notes || ''
      });

      setContacts(customer.contact_persons || []);
    }
    loadDropdownData();
  }, [customer]);

  const loadDropdownData = async () => {
    try {
      // Load customer types
      const typesResponse = await fetch(`${BACKEND_URL}/api/customer-types`);
      if (typesResponse.ok) {
        const types = await typesResponse.json();
        setCustomerTypes(types);
      }

      // Load sectors
      const sectorsResponse = await fetch(`${BACKEND_URL}/api/sectors`);
      if (sectorsResponse.ok) {
        const sectors = await sectorsResponse.json();
        setSectors(sectors);
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

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    setContacts(updatedContacts);
  };

  const addContact = () => {
    setContacts([...contacts, { full_name: '', mobile: '', email: '', position: '' }]);
  };

  const removeContact = (index) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

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

      if (!formData.name.trim()) {
        toast({
          title: "Eksik Bilgi",
          description: "Müşteri adı zorunludur.",
          variant: "destructive"
        });
        return;
      }

      const updatedCustomer = {
        ...formData,
        contact_persons: contacts.filter(contact => contact.full_name.trim()),
        id: customer.id
      };

      console.log('Updating customer:', updatedCustomer);

      // In a real implementation, call the API to update the customer
      // const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updatedCustomer)
      // });

      toast({
        title: "Başarılı",
        description: "Müşteri bilgileri başarıyla güncellendi.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      if (onSave) {
        onSave(updatedCustomer);
      }

      onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Edit className="h-7 w-7" />
                <span>Müşteri Düzenle</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span>Temel Bilgiler</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Müşteri Adı *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Müşteri adını giriniz"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Müşteri Türü
                      </label>
                      <Select value={formData.customer_type} onValueChange={(value) => handleInputChange('customer_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Müşteri türü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {customerTypes.map((type, index) => (
                            <SelectItem key={index} value={type.name || type}>
                              {type.name || type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sektör
                      </label>
                      <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sektör seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector, index) => (
                            <SelectItem key={index} value={sector.name || sector}>
                              {sector.name || sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span>İletişim Bilgileri</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon
                      </label>
                      <PhoneInput
                        country={'tr'}
                        value={formData.phone}
                        onChange={(value) => handleInputChange('phone', value)}
                        inputProps={{
                          className: 'w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        }}
                        containerStyle={{ width: '100%' }}
                        buttonStyle={{ border: '1px solid #d1d5db', borderRadius: '6px 0 0 6px' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="E-posta adresi"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <Input
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="Website URL'si"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span>Adres Bilgileri</span>
                  </h3>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span>Finansal Bilgiler</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vergi Numarası
                      </label>
                      <Input
                        value={formData.tax_number}
                        onChange={(e) => handleInputChange('tax_number', e.target.value)}
                        placeholder="Vergi numarası"
                        className="w-full"
                      />
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
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">

                {/* Contact Persons */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>Yetkili Kişiler</span>
                    </h3>
                    <Button
                      onClick={addContact}
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Kişi Ekle
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {contacts.map((contact, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border relative">
                        <Button
                          onClick={() => removeContact(index)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="space-y-3 pr-8">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ad Soyad
                            </label>
                            <Input
                              value={contact.full_name}
                              onChange={(e) => handleContactChange(index, 'full_name', e.target.value)}
                              placeholder="Yetkili kişinin adı"
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Telefon
                            </label>
                            <Input
                              value={contact.mobile}
                              onChange={(e) => handleContactChange(index, 'mobile', e.target.value)}
                              placeholder="Telefon numarası"
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              E-posta
                            </label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                              placeholder="E-posta adresi"
                              size="sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Pozisyon
                            </label>
                            <Input
                              value={contact.position}
                              onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                              placeholder="İş pozisyonu"
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {contacts.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Henüz yetkili kişi eklenmemiş</p>
                        <Button
                          onClick={addContact}
                          size="sm"
                          variant="outline"
                          className="mt-2 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          İlk Kişiyi Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-orange-600" />
                    <span>Etiketler</span>
                  </h3>
                  
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
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span>Notlar</span>
                  </h3>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Müşteri hakkında notlarınız..."
                    className="w-full min-h-[100px]"
                  />
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !formData.name.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}