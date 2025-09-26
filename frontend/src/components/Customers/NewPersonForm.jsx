import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';
import { 
  X,
  UserRound,
  Upload,
  Search,
  Plus,
  Edit3,
  ChevronDown,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin
} from 'lucide-react';

export default function NewPersonForm({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationshipType: '',
    jobTitle: '',
    company: '',
    countryCode: '+90',
    phone: '',
    extension: '',
    emailType: 'is', // 'is' for work, 'kisisel' for personal
    email: '',
    website: '',
    country: 'TR', // Default to Turkey
    city: '',
    address: '',
    additionalFields: {},
    specialDays: []
  });

  // Geographic data state
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMoreFields, setShowMoreFields] = useState(false);

  const relationshipTypes = [
    { value: 'kontak', label: 'Kontak' },
    { value: 'potential_customer', label: 'Potansiyel Müşteri' },
    { value: 'customer', label: 'Müşteri' },
    { value: 'supplier', label: 'Tedarikçi' }
  ];

  const emailTypes = [
    { value: 'is', label: 'İş' },
    { value: 'kisisel', label: 'Kişisel' }
  ];

  const countries = [
    { value: '+90', label: '+90 (Türkiye)' },
    { value: '+1', label: '+1 (ABD/Kanada)' },
    { value: '+49', label: '+49 (Almanya)' },
    { value: '+44', label: '+44 (İngiltere)' },
    { value: '+33', label: '+33 (Fransa)' },
    { value: '+39', label: '+39 (İtalya)' },
    { value: '+34', label: '+34 (İspanya)' },
    { value: '+31', label: '+31 (Hollanda)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen zorunlu alanları doldurunuz (İsim ve Soyisim).",
        variant: "destructive"
      });
      return;
    }

    // Email validation if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Geçersiz E-posta",
          description: "Lütfen geçerli bir e-posta adresi giriniz.",
          variant: "destructive"
        });
        return;
      }
    }

    const personData = {
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`,
      avatar: imagePreview,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      relationshipText: relationshipTypes.find(r => r.value === formData.relationshipType)?.label || '',
      tags: formData.relationshipType ? [formData.relationshipType.toUpperCase()] : [],
      sector: 'Diğer',
      priority: 'medium'
    };

    onSave(personData);
    
    toast({
      title: "Başarılı",
      description: "Yeni kişi başarıyla eklendi.",
    });
    
    onClose();
  };

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      relationshipType: '',
      jobTitle: '',
      company: '',
      countryCode: '+90',
      phone: '',
      extension: '',
      emailType: 'is',
      email: '',
      website: '',
      additionalFields: {},
      specialDays: []
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShowMoreFields(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                <UserRound className="h-6 w-6" />
                <span>Yeni Kişi</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  + Etiket ekle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Person Image and Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Kişi resmi:
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <UserRound className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload').click()}
                    >
                      Resim Yükle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      Resim Bul
                    </Button>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    İsim *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder=""
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Soyisim *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder=""
                    className="w-full"
                  />
                </div>
              </div>

              {/* Relationship Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  İlişki tipi:
                </label>
                <div className="flex space-x-4">
                  {relationshipTypes.map((type) => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="relationshipType"
                        value={type.value}
                        checked={formData.relationshipType === type.value}
                        onChange={(e) => handleInputChange('relationshipType', e.target.checked ? e.target.value : '')}
                        className="text-green-600"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Diğer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="other1">Diğer Seçenek 1</SelectItem>
                      <SelectItem value="other2">Diğer Seçenek 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  İş ünvanı:
                </label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder=""
                  className="w-full"
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Şirket:
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder=""
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Telefon:
                  </label>
                  <Select value={formData.countryCode} onValueChange={(value) => handleInputChange('countryCode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    &nbsp;
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ülke kodunu giriniz (+90)..."
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    &nbsp;
                  </label>
                  <Input
                    value={formData.extension}
                    onChange={(e) => handleInputChange('extension', e.target.value)}
                    placeholder="Dahili"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    E-posta:
                  </label>
                  <Select value={formData.emailType} onValueChange={(value) => handleInputChange('emailType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    &nbsp;
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder=""
                    className="w-full"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Web sitesi:
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder=""
                  className="w-full"
                />
              </div>

              {/* Show More Fields Button */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMoreFields(!showMoreFields)}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <span>Daha fazla alan göster</span>
                  <ChevronDown className={`h-4 w-4 transform transition-transform ${showMoreFields ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* More Fields */}
              {showMoreFields && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Özel günler:
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Tarih ekle</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearForm}
                  >
                    Alanları düzenle
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    Haber akışında yayınla
                  </Button>
                </div>
                <div className="space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Kapat
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  >
                    Kaydet
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}