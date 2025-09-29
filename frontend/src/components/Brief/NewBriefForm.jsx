import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import VitingoPhoneInput from '../ui/SupplierPhone';
import { allCustomers } from '../../mock/customersData';
import { allPeople } from '../../mock/peopleData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
import { 
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Users,
  FileText,
  ImageIcon,
  Ruler,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

export default function NewBriefForm({ onBackToDashboard }) {
  const [formData, setFormData] = useState({
    // Basic Information
    projectName: '',
    customerId: '', // Changed from clientCompany to customerId
    contactPerson: '',
    email: '',
    phone: '',
    
    // Event/Fair Information
    eventName: '',
    eventLocation: '',
    eventDate: '',
    eventDuration: '',
    
    // Stand Requirements
    standArea: '', // m2
    standType: '', // dropdown
    closedSides: '', // number
    standHeight: '', // meters
    
    // Design Preferences
    designStyle: '', // dropdown
    colorPreferences: [],
    brandColors: '',
    
    // Services Required
    services: [],
    
    // Budget
    budgetRange: '',
    
    // Additional Information
    specialRequirements: '',
    targetAudience: '',
    objectives: '',
    
    // Files
    logoFiles: [],
    referenceImages: [],
    brandGuidelines: [],
    
    // Priorities
    priority: 'normal',
    deadline: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingSections, setUploadingSections] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [relatedPeople, setRelatedPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // Load customers data
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Load customers from backend API
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/customers`);
        if (response.ok) {
          const customersData = await response.json();
          setCustomers(customersData.filter(customer => customer.status === 'active'));
        } else {
          console.error('Failed to fetch customers');
          // Fallback to mock data
          setCustomers(allCustomers.filter(customer => customer.status === 'active'));
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Fallback to mock data
        setCustomers(allCustomers.filter(customer => customer.status === 'active'));
      }
    };

    fetchCustomers();
  }, []);

  // Update contact person and email when customer is selected
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id.toString() === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        
        // Fetch related people from backend API
        const fetchCustomerPeople = async () => {
          try {
            const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}/people`);
            if (response.ok) {
              const customerPeople = await response.json();
              setRelatedPeople(customerPeople);
              
              // Reset person selection when customer changes
              setSelectedPersonId('');
              
              // If there are related people, don't auto-fill, let user choose
              // If no related people, auto-select customer default and fill data
              if (customerPeople.length === 0) {
                setSelectedPersonId('customer-default');
              }
            } else {
              console.error('Failed to fetch customer people');
              // Fallback to mock data
              const customerPeople = allPeople.filter(person => 
                person.company === customer.companyName && 
                person.status === 'active'
              );
              setRelatedPeople(customerPeople);
              setSelectedPersonId('');
              if (customerPeople.length === 0) {
                setSelectedPersonId('customer-default');
              }
            }
          } catch (error) {
            console.error('Error fetching customer people:', error);
            // Fallback to mock data
            const customerPeople = allPeople.filter(person => 
              person.company === customer.companyName && 
              person.status === 'active'
            );
            setRelatedPeople(customerPeople);
            setSelectedPersonId('');
            if (customerPeople.length === 0) {
              setSelectedPersonId('customer-default');
            }
          }
        };

        fetchCustomerPeople();
      }
    } else {
      setSelectedCustomer(null);
      setRelatedPeople([]);
      setSelectedPersonId('');
    }
  }, [formData.customerId, customers]);

  // Update contact info when a person is selected - separate useEffect to prevent loops
  useEffect(() => {
    if (selectedPersonId && selectedCustomer) {
      if (selectedPersonId === 'customer-default') {
        // Use customer's default contact info
        setFormData(prev => ({
          ...prev,
          contactPerson: selectedCustomer.contactPerson,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone || ''
        }));
      } else {
        // Use selected person's info
        const person = relatedPeople.find(p => p.id.toString() === selectedPersonId);
        if (person) {
          setFormData(prev => ({
            ...prev,
            contactPerson: person.fullName,
            email: person.email,
            phone: person.phone || ''
          }));
        }
      }
    } else if (!selectedPersonId) {
      // Clear contact fields when no person is selected
      setFormData(prev => ({
        ...prev,
        contactPerson: '',
        email: '',
        phone: ''
      }));
    }
  }, [selectedPersonId, selectedCustomer, relatedPeople]);

  const standTypes = [
    { value: 'shell-scheme', label: 'Shell Scheme (Kabuk Stand)' },
    { value: 'space-only', label: 'Space Only (Boş Alan)' },
    { value: 'peninsula', label: 'Peninsula (Yarımada)' },
    { value: 'island', label: 'Island (Ada Stand)' },
    { value: 'corner', label: 'Corner (Köşe Stand)' },
    { value: 'linear', label: 'Linear (Doğrusal)' }
  ];

  const designStyles = [
    { value: 'modern', label: 'Modern' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'industrial', label: 'Endüstriyel' },
    { value: 'classic', label: 'Klasik' },
    { value: 'tech', label: 'Teknolojik' },
    { value: 'elegant', label: 'Şık/Zarif' },
    { value: 'creative', label: 'Yaratıcı' },
    { value: 'corporate', label: 'Kurumsal' }
  ];

  const serviceOptions = [
    { value: 'design', label: '3D Tasarım' },
    { value: 'construction', label: 'İnşaat/Montaj' },
    { value: 'graphics', label: 'Grafik Tasarım' },
    { value: 'lighting', label: 'Aydınlatma' },
    { value: 'av-equipment', label: 'AV Ekipmanları' },
    { value: 'furniture', label: 'Mobilya' },
    { value: 'flooring', label: 'Zemin Kaplama' },
    { value: 'storage', label: 'Depolama' },
    { value: 'catering', label: 'İkram/Catering' },
    { value: 'transport', label: 'Nakliye' },
    { value: 'installation', label: 'Kurulum Hizmeti' },
    { value: 'dismantling', label: 'Söküm Hizmeti' }
  ];

  const budgetRanges = [
    { value: '0-25k', label: '0 - 25.000 TL' },
    { value: '25k-50k', label: '25.000 - 50.000 TL' },
    { value: '50k-100k', label: '50.000 - 100.000 TL' },
    { value: '100k-250k', label: '100.000 - 250.000 TL' },
    { value: '250k-500k', label: '250.000 - 500.000 TL' },
    { value: '500k+', label: '500.000 TL+' },
    { value: 'custom', label: 'Özel Bütçe' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Acil', color: 'bg-red-100 text-red-700' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileUpload = async (field, files) => {
    setUploadingSections(prev => ({ ...prev, [field]: true }));
    
    // Simulate file upload process
    try {
      const uploadedFiles = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }));

      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...uploadedFiles]
      }));
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setTimeout(() => {
        setUploadingSections(prev => ({ ...prev, [field]: false }));
      }, 1000);
    }
  };

  const removeFile = (field, fileId) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(file => file.id !== fileId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.projectName || !formData.customerId || !formData.contactPerson) {
      alert('Lütfen zorunlu alanları doldurun: Proje Adı, Müşteri, İletişim Kişisi');
      return;
    }

    // Create brief object with customer data
    const customer = customers.find(c => c.id.toString() === formData.customerId);
    const newBrief = {
      id: Date.now(),
      ...formData,
      clientCompany: customer ? customer.companyName : '', // Add company name for compatibility
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage for now
    const existingBriefs = JSON.parse(localStorage.getItem('briefs') || '[]');
    existingBriefs.unshift(newBrief);
    localStorage.setItem('briefs', JSON.stringify(existingBriefs));

    console.log('New brief saved:', newBrief);
    alert('Brief başarıyla oluşturuldu!');
    
    // Reset form
    setFormData({
      projectName: '',
      customerId: '',
      contactPerson: '',
      email: '',
      phone: '',
      eventName: '',
      eventLocation: '',
      eventDate: '',
      eventDuration: '',
      standArea: '',
      standType: '',
      closedSides: '',
      standHeight: '',
      designStyle: '',
      colorPreferences: [],
      brandColors: '',
      services: [],
      budgetRange: '',
      specialRequirements: '',
      targetAudience: '',
      objectives: '',
      logoFiles: [],
      referenceImages: [],
      brandGuidelines: [],
      priority: 'normal',
      deadline: ''
    });
    setSelectedCustomer(null);
    setRelatedPeople([]);
    setSelectedPersonId('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Brief Oluştur</h1>
            <p className="text-gray-600 mt-1">Stand tasarımı için detaylı brief formu</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAdvanced ? 'Basit Görünüm' : 'Detaylı Görünüm'}</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Temel Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proje Adı *
                </label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="Örn: CeBIT Turkey 2025 Standı"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                <Select value={formData.customerId} onValueChange={(value) => handleInputChange('customerId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.companyName}</span>
                            <span className="text-xs text-gray-500">{customer.contactPerson}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>{selectedCustomer.companyName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedCustomer.sector} • {selectedCustomer.country}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkili Kişi *
                </label>
                
                {selectedCustomer && (relatedPeople.length > 0 || selectedCustomer.contactPerson) ? (
                  <div className="space-y-3">
                    {/* Person Selection Dropdown */}
                    <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yetkili kişi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Default customer contact */}
                        {selectedCustomer.contactPerson && (
                          <SelectItem value="customer-default">
                            <div className="flex flex-col">
                              <span className="font-medium">{selectedCustomer.contactPerson}</span>
                              <span className="text-xs text-gray-500">Varsayılan İletişim (Müşteri Kaydı)</span>
                            </div>
                          </SelectItem>
                        )}
                        
                        {/* Related people */}
                        {relatedPeople.map(person => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{person.fullName}</span>
                              <span className="text-xs text-gray-500">{person.jobTitle}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Display selected person info */}
                    {selectedPersonId && (
                      <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border">
                        {selectedPersonId === 'customer-default' ? (
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{selectedCustomer.contactPerson}</span>
                            </div>
                            <div className="text-xs text-gray-500">Müşteri kaydından varsayılan iletişim kişisi</div>
                          </div>
                        ) : (
                          (() => {
                            const person = relatedPeople.find(p => p.id.toString() === selectedPersonId);
                            return person ? (
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <User className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">{person.fullName}</span>
                                </div>
                                <div className="text-xs text-gray-500">{person.jobTitle} • {person.relationshipText}</div>
                              </div>
                            ) : null;
                          })()
                        )}
                      </div>
                    )}
                    
                    {/* Hidden input for form compatibility */}
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="hidden"
                      required
                    />
                  </div>
                ) : (
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Ad Soyad"
                    required
                  />
                )}
                
                {relatedPeople.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                    ✨ Bu müşteriye bağlı {relatedPeople.length} kişi bulundu
                  </p>
                )}
                {selectedCustomer && relatedPeople.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Bu müşteri için kayıtlı ek kişi bulunamadı, varsayılan iletişim bilgileri kullanılacak
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  disabled={!!selectedPersonId}
                  className={selectedPersonId ? 'bg-gray-50' : ''}
                />
                {selectedPersonId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen kişiden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <VitingoPhoneInput
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Telefon numarası giriniz"
                  label=""
                  className="my-0"
                  disabled={!!selectedPersonId}
                />
                {selectedPersonId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seçilen kişiden otomatik dolduruldu
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öncelik Seviyesi
                </label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                          {priority.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Etkinlik Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etkinlik/Fuar Adı
                </label>
                <Input
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  placeholder="Örn: CeBIT Turkey, Mobile World Congress"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasyon
                </label>
                <Input
                  value={formData.eventLocation}
                  onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                  placeholder="Şehir, Ülke"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etkinlik Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Süre (Gün)
                </label>
                <Input
                  type="number"
                  value={formData.eventDuration}
                  onChange={(e) => handleInputChange('eventDuration', e.target.value)}
                  placeholder="3"
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stand Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ruler className="h-5 w-5" />
              <span>Stand Gereksinimleri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan (m²)
                </label>
                <Input
                  type="number"
                  value={formData.standArea}
                  onChange={(e) => handleInputChange('standArea', e.target.value)}
                  placeholder="36"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Tipi
                </label>
                <Select value={formData.standType} onValueChange={(value) => handleInputChange('standType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stand tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {standTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapalı Kenar Sayısı
                </label>
                <Input
                  type="number"
                  value={formData.closedSides}
                  onChange={(e) => handleInputChange('closedSides', e.target.value)}
                  placeholder="2"
                  min="0"
                  max="4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseklik (m)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.standHeight}
                  onChange={(e) => handleInputChange('standHeight', e.target.value)}
                  placeholder="2.5"
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Preferences Card - Show only in advanced mode */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Tasarım Tercihleri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasarım Stili
                  </label>
                  <Select value={formData.designStyle} onValueChange={(value) => handleInputChange('designStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {designStyles.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marka Renkleri
                  </label>
                  <Input
                    value={formData.brandColors}
                    onChange={(e) => handleInputChange('brandColors', e.target.value)}
                    placeholder="Örn: #FF0000, Kırmızı, Mavi"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  İhtiyaç Duyulan Hizmetler
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {serviceOptions.map(service => (
                    <label key={service.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.value)}
                        onChange={() => handleMultiSelect('services', service.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget and Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Bütçe ve Gereksinimler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bütçe Aralığı
                </label>
                <Select value={formData.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bütçe seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Son Teslim Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özel Gereksinimler
                </label>
                <Textarea
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Özel talep, kısıtlama veya gereksinimler..."
                  rows={3}
                />
              </div>
              
              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Kitle
                    </label>
                    <Textarea
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                      placeholder="Stantta hedeflenen ziyaretçi profili..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standın Hedefleri
                    </label>
                    <Textarea
                      value={formData.objectives}
                      onChange={(e) => handleInputChange('objectives', e.target.value)}
                      placeholder="Standla ulaşılmak istenen amaçlar..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section - Show only in advanced mode */}
        {showAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Dosyalar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Logo Dosyaları
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.ai,.eps"
                    onChange={(e) => handleFileUpload('logoFiles', e.target.files)}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Logo dosyalarını seçin veya sürükleyin
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF, AI, EPS</p>
                    </div>
                  </label>
                  
                  {formData.logoFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.logoFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile('logoFiles', file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reference Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Referans Görselleri
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload('referenceImages', e.target.files)}
                    className="hidden"
                    id="reference-upload"
                  />
                  <label htmlFor="reference-upload" className="cursor-pointer">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Referans görsellerini seçin
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                    </div>
                  </label>
                  
                  {formData.referenceImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {formData.referenceImages.map(file => (
                        <div key={file.id} className="relative">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6"
                            onClick={() => removeFile('referenceImages', file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>İptal</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Save as draft
                const draftBrief = {
                  ...formData,
                  id: Date.now(),
                  status: 'draft',
                  createdAt: new Date().toISOString()
                };
                
                const customer = customers.find(c => c.id.toString() === formData.customerId);
                if (customer) {
                  draftBrief.clientCompany = customer.companyName;
                }
                
                const drafts = JSON.parse(localStorage.getItem('briefDrafts') || '[]');
                drafts.unshift(draftBrief);
                localStorage.setItem('briefDrafts', JSON.stringify(drafts));
                
                alert('Brief taslak olarak kaydedildi!');
              }}
            >
              Taslak Kaydet
            </Button>
            
            <Button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Brief Oluştur</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}