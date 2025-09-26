import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { allPeople } from '../../mock/peopleData';
import { customerTagColors } from '../../mock/customersData';
import NewPersonForm from './NewPersonForm';
import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';
import SearchableSelect from '../ui/SearchableSelect';
import CompanyAvatar from '../ui/CompanyAvatar';
import { 
  X,
  Building,
  Upload,
  Search,
  MapPin,
  Plus,
  User,
  Phone,
  Globe,
  Tag
} from 'lucide-react';

export default function NewCustomerForm({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    companyName: '',
    relationshipType: '',
    contactPersonId: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    country: 'TR',
    city: '',
    sector: '',
    notes: '',
    // Turkey-specific fields
    companyTitle: '', // Firma Unvanı
    taxOffice: '', // Vergi Dairesi
    taxNumber: '', // Vergi Numarası
    // Tags field
    tags: [] // Etiketler
  });

  // Tag management state
  const [tagInput, setTagInput] = useState('');
  const [availableTags] = useState([
    'TEKNOLOJI', 'SANAYI', 'TICARET', 'HIZMET', 'ÜRETIM', 
    'İHRACAT', 'İTHALAT', 'PERAKENDE', 'TOPTAN', 'LOJISTIK',
    'INŞAAT', 'GIDA', 'TEKSTIL', 'OTOMOTIV', 'ENERJI'
  ]);

  // Geographic data state
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Separate state for phone country code to avoid conflicts
  const [phoneCountryCode, setPhoneCountryCode] = useState('TR');

  // Logo management state  
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  
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

  // Turkish Tax Offices List
  const turkishTaxOffices = [
    'İstanbul Vergi Dairesi Başkanlığı',
    'Ankara Vergi Dairesi Başkanlığı',
    'İzmir Vergi Dairesi Başkanlığı',
    'Bursa Vergi Dairesi Başkanlığı',
    'Antalya Vergi Dairesi Başkanlığı',
    'Adana Vergi Dairesi Başkanlığı',
    'Konya Vergi Dairesi Başkanlığı',
    'Gaziantep Vergi Dairesi Başkanlığı',
    'Kayseri Vergi Dairesi Başkanlığı',
    'Mersin Vergi Dairesi Başkanlığı',
    'Eskişehir Vergi Dairesi Başkanlığı',
    'Diyarbakır Vergi Dairesi Başkanlığı',
    'Samsun Vergi Dairesi Başkanlığı',
    'Denizli Vergi Dairesi Başkanlığı',
    'Şanlıurfa Vergi Dairesi Başkanlığı',
    'Adapazarı Vergi Dairesi Başkanlığı',
    'Malatya Vergi Dairesi Başkanlığı',
    'Kahramanmaraş Vergi Dairesi Başkanlığı',
    'Erzurum Vergi Dairesi Başkanlığı',
    'Van Vergi Dairesi Başkanlığı',
    'Batman Vergi Dairesi Başkanlığı',
    'Elazığ Vergi Dairesi Başkanlığı',
    'İzmit Vergi Dairesi Başkanlığı',
    'Manisa Vergi Dairesi Başkanlığı',
    'Tarsus Vergi Dairesi Başkanlığı',
    'Çorum Vergi Dairesi Başkanlığı',
    'Balıkesir Vergi Dairesi Başkanlığı',
    'Aydın Vergi Dairesi Başkanlığı',
    'Hatay Vergi Dairesi Başkanlığı',
    'Tekirdağ Vergi Dairesi Başkanlığı'
  ].sort();

  useEffect(() => {
    // Load people data
    const sortedPeople = allPeople
      .filter(person => person.status === 'active')
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
    setAvailablePeople(sortedPeople);

    // Set default country to Turkey
    if (!selectedCountry) {
      // Turkey will be set by CountrySelect component's default behavior
    }
  }, []); // EMPTY dependency array - runs only once

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryChange = (countryData) => {
    setSelectedCountry(countryData);
    setSelectedCity(null); // Clear city when country changes
    
    if (countryData) {
      setFormData(prev => ({
        ...prev,
        country: countryData.iso2,
        city: '' // Clear city
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        country: '',
        city: ''
      }));
    }
  };

  const handleCityChange = (cityData) => {
    setSelectedCity(cityData);
    
    if (cityData) {
      setFormData(prev => ({
        ...prev,
        city: cityData.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        city: ''
      }));
    }
  };

  const handleWebsiteChange = (value) => {
    // Remove http:// or https:// if user enters it
    let cleanValue = value.replace(/^https?:\/\//, '');
    setFormData(prev => ({
      ...prev,
      website: cleanValue
    }));
  };

  // Tag management functions
  const addTag = (tag) => {
    const upperTag = tag.toUpperCase();
    if (upperTag && !formData.tags.includes(upperTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, upperTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const getTagColor = (tag) => {
    return customerTagColors[tag] || 'bg-gray-500 text-white';
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
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Logo handlers
  const handleLogoChange = (file, preview) => {
    setLogoFile(file);
    setLogoUrl(preview);
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoUrl('');
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
    
    const customerData = {
      ...formData,
      countryCode: phoneCountryCode, // Add phone country code
      contactPerson: selectedPerson ? selectedPerson.fullName : '',
      logo: logoUrl || '', // Ensure logo is always a string
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
      email: '',
      website: '',
      address: '',
      country: 'TR',
      city: '',
      sector: '',
      notes: '',
      // Turkey-specific fields
      companyTitle: '',
      taxOffice: '',
      taxNumber: '',
      // Tags field
      tags: []
    });
    setPhoneCountryCode('TR');
    setLogoFile(null);
    setLogoUrl('');
    setTagInput('');
    // Clear geographic selections
    setSelectedCountry(null);
    setSelectedCity(null);
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
              {/* Company Avatar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Firma Logosu / Avatar</span>
                </label>
                <div className="flex items-center space-x-4">
                  <CompanyAvatar
                    companyName={formData.companyName}
                    logoUrl={logoUrl}
                    onLogoChange={handleLogoChange}
                    onLogoRemove={handleLogoRemove}
                    size="lg"
                    editable={true}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Logo yüklemek için avatar'a tıklayın veya sürükleyip bırakın.
                    </p>
                    <p className="text-xs text-gray-500">
                      Logo yoksa firma adından otomatik avatar oluşturulur.
                    </p>
                    <p className="text-xs text-gray-400">
                      Desteklenen formatlar: JPG, PNG, GIF (Max 2MB)
                    </p>
                  </div>
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
                <SearchableSelect
                  options={availablePeople.map(person => ({
                    id: person.id.toString(),
                    label: person.fullName,
                    sublabel: person.jobTitle || person.email,
                    icon: User
                  }))}
                  value={formData.contactPersonId}
                  onChange={(value) => handleInputChange('contactPersonId', value)}
                  placeholder="İletişim kişisi ara ve seç..."
                  searchPlaceholder="Kişi ara (isim, unvan)..."
                  emptyMessage="Kişi bulunamadı"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <div className="flex space-x-2">
                  <div className="w-40">  {/* Ülke kodları genişletildi */}
                    <Select 
                      value={phoneCountryCode} 
                      onValueChange={setPhoneCountryCode}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ülke" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TR">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇹🇷</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+90</span>
                              <span className="text-xs text-gray-500">Turkey</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="US">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇺🇸</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+1</span>
                              <span className="text-xs text-gray-500">United States</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="GB">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇬🇧</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+44</span>
                              <span className="text-xs text-gray-500">United Kingdom</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="DE">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇩🇪</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+49</span>
                              <span className="text-xs text-gray-500">Germany</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="FR">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇫🇷</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+33</span>
                              <span className="text-xs text-gray-500">France</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="AE">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇦🇪</span>
                            <div className="flex flex-col">
                              <span className="text-xs">+971</span>
                              <span className="text-xs text-gray-500">UAE</span>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">  {/* Telefon alanı daraltıldı */}
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefon numarası"
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
              </div>

              {/* Country and Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Ülke *</span>
                  </label>
                  <CountrySelect
                    value={formData.country}
                    onChange={handleCountryChange}
                    placeholder="Ülke seçiniz"
                    required={true}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Şehir *</span>
                  </label>
                  <CitySelect
                    country={formData.country}
                    value={formData.city}
                    onChange={handleCityChange}
                    placeholder="Şehir seçiniz"
                    required={true}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Turkish-specific fields - only show when Turkey is selected */}
              {formData.country === 'TR' && (
                <>
                  {/* Company Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Firma Unvanı
                    </label>
                    <Input
                      value={formData.companyTitle}
                      onChange={(e) => handleInputChange('companyTitle', e.target.value)}
                      placeholder="Şirket unvanını giriniz (örn: Ltd. Şti., A.Ş.)"
                      className="w-full"
                    />
                  </div>

                  {/* Tax Office */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Vergi Dairesi
                    </label>
                    <Select value={formData.taxOffice} onValueChange={(value) => handleInputChange('taxOffice', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vergi dairesi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {turkishTaxOffices.map((office) => (
                          <SelectItem key={office} value={office}>
                            {office}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tax Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Vergi Numarası
                    </label>
                    <Input
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      placeholder="Vergi numarasını giriniz (10 haneli)"
                      className="w-full"
                      maxLength="11"
                    />
                  </div>
                </>
              )}

              {/* Sector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Sektör
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSectorInput(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Yeni Sektör Ekle
                  </Button>
                </div>
                
                {showNewSectorInput && (
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      placeholder="Yeni sektör adı"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewSector}
                    >
                      Ekle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewSectorInput(false);
                        setNewSector('');
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                )}
                
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

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Etiketler</span>
                </label>
                
                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className={`text-xs px-2 py-1 ${getTagColor(tag)} border-0 flex items-center space-x-1`}
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Tag Input */}
                <div className="flex items-center space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Etiket yazın ve Enter'a basın..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggested Tags */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-600">Önerilen etiketler:</span>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag))
                      .slice(0, 8)
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className={`text-xs px-2 py-1 rounded-full border hover:shadow-sm transition-colors ${getTagColor(tag)} opacity-70 hover:opacity-100`}
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
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