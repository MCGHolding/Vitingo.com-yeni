import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { allPeople } from '../../mock/peopleData';
import { getSortedCountries, getCitiesForCountry } from '../../data/countriesAndCities';
import NewPersonForm from './NewPersonForm';
import { 
  X,
  Building,
  Upload,
  Search,
  MapPin,
  Plus,
  User,
  Phone,
  Globe
} from 'lucide-react';

export default function NewCustomerForm({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    companyName: '',
    relationshipType: '',
    contactPersonId: '',
    phone: '',
    countryCode: 'TR',
    email: '',
    website: '',
    address: '',
    country: 'TR',
    city: '',
    sector: '',
    notes: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [relationshipTypes, setRelationshipTypes] = useState([
    { value: 'potential_customer', label: 'Potansiyel Müşteri' },
    { value: 'customer', label: 'Müşteri' },
    { value: 'supplier', label: 'Tedarikçi' }
  ]);
  const [sectors, setSectors] = useState([
    { value: 'Teknoloji', label: 'Teknoloji' },
    { value: 'İmalat', label: 'İmalat' },
    { value: 'Sağlık', label: 'Sağlık' },
    { value: 'Finans', label: 'Finans' },
    { value: 'Eğitim', label: 'Eğitim' },
    { value: 'Turizm', label: 'Turizm' },
    { value: 'Gıda', label: 'Gıda ve İçecek' },
    { value: 'Otomotiv', label: 'Otomotiv' },
    { value: 'İnşaat', label: 'İnşaat' },
    { value: 'Tekstil', label: 'Tekstil' },
    { value: 'Enerji', label: 'Enerji' },
    { value: 'Lojistik', label: 'Lojistik' },
    { value: 'Perakende', label: 'Perakende' },
    { value: 'Diğer', label: 'Diğer' }
  ]);
  
  const [newRelationshipType, setNewRelationshipType] = useState('');
  const [newSector, setNewSector] = useState('');
  const [showNewRelationshipInput, setShowNewRelationshipInput] = useState(false);
  const [showNewSectorInput, setShowNewSectorInput] = useState(false);
  const [availablePeople, setAvailablePeople] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    // Load people data and sort alphabetically
    const sortedPeople = allPeople
      .filter(person => person.status === 'active')
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
    setAvailablePeople(sortedPeople);

    // Load countries data
    setAvailableCountries(getSortedCountries());
  }, []);

  useEffect(() => {
    // Update cities when country changes
    if (formData.country) {
      const cities = getCitiesForCountry(formData.country);
      setAvailableCities(cities);
      
      // Clear city selection if it doesn't exist in new country
      if (formData.city && !cities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
      
      // Update phone country code
      const selectedCountry = availableCountries.find(c => c.code === formData.country);
      if (selectedCountry) {
        setFormData(prev => ({ ...prev, countryCode: formData.country }));
      }
    }
  }, [formData.country, availableCountries]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryChange = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      city: '' // Reset city when country changes
    }));
  };

  const handleWebsiteChange = (value) => {
    // Remove http:// or https:// if user enters it
    let cleanValue = value.replace(/^https?:\/\//, '');
    setFormData(prev => ({
      ...prev,
      website: cleanValue
    }));
  };

  const handleAddNewRelationshipType = () => {
    if (newRelationshipType.trim()) {
      const newType = {
        value: newRelationshipType.toLowerCase().replace(/\s+/g, '_'),
        label: newRelationshipType.trim()
      };
      
      setRelationshipTypes(prev => [...prev, newType]);
      setFormData(prev => ({ ...prev, relationshipType: newType.value }));
      setNewRelationshipType('');
      setShowNewRelationshipInput(false);
      
      toast({
        title: "Başarılı",
        description: "Yeni ilişki tipi eklendi.",
      });
    }
  };

  const handleAddNewSector = () => {
    if (newSector.trim()) {
      const newSectorObj = {
        value: newSector.trim(),
        label: newSector.trim()
      };
      
      setSectors(prev => [...prev, newSectorObj]);
      setFormData(prev => ({ ...prev, sector: newSector.trim() }));
      setNewSector('');
      setShowNewSectorInput(false);
      
      toast({
        title: "Başarılı",
        description: "Yeni sektör eklendi.",
      });
    }
  };

  const handlePersonAdded = (newPerson) => {
    // Add new person to available people list
    setAvailablePeople(prev => 
      [...prev, newPerson].sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'))
    );
    
    // Auto-select the new person
    setFormData(prev => ({ ...prev, contactPersonId: newPerson.id.toString() }));
    setShowPersonForm(false);
    
    toast({
      title: "Başarılı",
      description: "Yeni kişi eklendi ve seçildi.",
    });
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
    
    // Validation
    if (!formData.companyName || !formData.relationshipType || !formData.email) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen zorunlu alanları doldurunuz.",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Geçersiz E-posta",
        description: "Lütfen geçerli bir e-posta adresi giriniz.",
        variant: "destructive"
      });
      return;
    }

    // Get selected person data
    const selectedPerson = availablePeople.find(p => p.id.toString() === formData.contactPersonId);
    
    // Get selected country data
    const selectedCountry = availableCountries.find(c => c.code === formData.country);

    const customerData = {
      ...formData,
      contactPerson: selectedPerson ? selectedPerson.fullName : '',
      logo: imagePreview,
      status: 'active',
      customerSince: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalRevenue: 0,
      currency: formData.country === 'TR' ? 'TRY' : 
                formData.country === 'US' || formData.country === 'CA' ? 'USD' : 'EUR'
    };

    onSave(customerData);
    
    toast({
      title: "Başarılı",
      description: "Yeni müşteri başarıyla eklendi.",
    });
    
    onClose();
  };

  const clearForm = () => {
    setFormData({
      companyName: '',
      relationshipType: '',
      contactPersonId: '',
      phone: '',
      countryCode: 'TR',
      email: '',
      website: '',
      address: '',
      country: 'TR',
      city: '',
      sector: '',
      notes: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                <Building className="h-6 w-6" />
                <span>Yeni Müşteri Ekle</span>
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
              {/* Company Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Şirket Logosu
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload').click()}
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
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Şirket İsmi *
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Şirket adını giriniz"
                  className="w-full"
                />
              </div>

              {/* Relationship Type */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    İlişki Tipi *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewRelationshipInput(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Yeni İlişki Tipi
                  </Button>
                </div>
                
                {showNewRelationshipInput && (
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newRelationshipType}
                      onChange={(e) => setNewRelationshipType(e.target.value)}
                      placeholder="Yeni ilişki tipi adı"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewRelationshipType}
                    >
                      Ekle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewRelationshipInput(false);
                        setNewRelationshipType('');
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                )}
                
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

              {/* Contact Person */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    İletişim Kişisi
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonForm(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Yeni Kişi Ekle
                  </Button>
                </div>
                <Select value={formData.contactPersonId} onValueChange={(value) => handleInputChange('contactPersonId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="İletişim kişisi seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeople.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{person.fullName}</span>
                            {person.jobTitle && (
                              <span className="text-xs text-gray-500">{person.jobTitle}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <div className="flex space-x-2">
                  <div className="w-32">
                    <Select 
                      value={formData.countryCode} 
                      onValueChange={(value) => handleInputChange('countryCode', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ülke" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{country.flag}</span>
                              <div className="flex flex-col">
                                <span className="text-xs">{country.phoneCode}</span>
                                <span className="text-xs text-gray-500">{country.name}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefon numarasını giriniz"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  E-posta *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="E-posta adresini giriniz"
                  className="w-full"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Web Sitesi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleWebsiteChange(e.target.value)}
                    placeholder="ornek.com (http:// olmadan)"
                    className="pl-10 w-full"
                  />
                </div>
                {formData.website && (
                  <p className="text-xs text-gray-500">
                    Önizleme: https://{formData.website}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Adres
                </label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Şirket adresini giriniz"
                  rows={3}
                  className="w-full"
                />
                <div className="flex items-center space-x-2 text-sm text-blue-600 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  <span>Konumu haritada işaretle</span>
                </div>
              </div>

              {/* Country and Region */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ülke
                  </label>
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Şehir
                  </label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sektör
                </label>
                <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sektör seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notlar
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Müşteri hakkında notlar..."
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                >
                  Temizle
                </Button>
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Kaydet
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* New Person Form Modal */}
      {showPersonForm && (
        <NewPersonForm
          onClose={() => setShowPersonForm(false)}
          onSave={handlePersonAdded}
        />
      )}
    </div>
  );
}