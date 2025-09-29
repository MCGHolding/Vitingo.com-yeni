import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import VitingoPhoneInput from '../ui/SupplierPhone';
import { VitingoPhoneInput } from '../ui/vitingo-phone-input';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  UserRound,
  Upload,
  Search
} from 'lucide-react';

export default function EditPersonModal({ person, onClose, onSave }) {
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
    emailType: 'is',
    email: '',
    website: '',
    notes: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Initialize form with person data
  useEffect(() => {
    if (person) {
      const nameParts = person.fullName ? person.fullName.split(' ') : ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        relationshipType: person.relationshipType || '',
        jobTitle: person.jobTitle || '',
        company: person.company || '',
        countryCode: person.countryCode || '+90',
        phone: person.phone ? person.phone.replace(/\+90\s?/, '') : '',
        extension: person.extension || '',
        emailType: person.emailType || 'is',
        email: person.email || '',
        website: person.website || '',
        notes: person.notes || ''
      });
      setImagePreview(person.avatar || null);
    }
  }, [person]);

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

    const updatedPerson = {
      ...person,
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`,
      avatar: imagePreview,
      relationshipText: relationshipTypes.find(r => r.value === formData.relationshipType)?.label || '',
      tags: formData.relationshipType ? [formData.relationshipType.toUpperCase()] : person.tags || [],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    onSave(updatedPerson);
    
    toast({
      title: "Başarılı",
      description: "Kişi bilgileri başarıyla güncellendi.",
    });
    
    onClose();
  };

  if (!person) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                <UserRound className="h-6 w-6" />
                <span>Kişi Düzenle</span>
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
                      onClick={() => document.getElementById('avatar-upload-edit').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Resim Yükle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Resim Bul
                    </Button>
                  </div>
                  <input
                    id="avatar-upload-edit"
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
                <Select value={formData.relationshipType} onValueChange={(value) => handleInputChange('relationshipType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="İlişki tipi seçiniz" />
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
                <Input
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder=""
                  className="w-full"
                />
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
                  <VitingoPhoneInput
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    placeholder="Telefon numarası giriniz"
                    label=""
                    className="my-0"
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

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notlar:
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Kişi hakkında notlar..."
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Güncelle
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}