import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Phone, 
  Clock, 
  User, 
  Calendar,
  Save,
  X,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  UserPlus
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const CALL_TYPES = [
  { value: 'outgoing', label: 'Giden Arama', icon: PhoneOutgoing, color: 'text-blue-600' },
  { value: 'incoming', label: 'Gelen Arama', icon: PhoneIncoming, color: 'text-green-600' }
];

// DEĞİŞİKLİK 2: Yeni Arama Sonuç Listesi (Gruplandırılmış)
const CALL_RESULTS_GROUPED = {
  gorusuldu: [
    { value: 'gorusuldu_olumlu', label: 'Görüşüldü - Olumlu' },
    { value: 'gorusuldu_olumsuz', label: 'Görüşüldü - Olumsuz' },
    { value: 'gorusuldu_notr', label: 'Görüşüldü - Nötr' },
    { value: 'gorusuldu_mail_istedi', label: 'Görüşüldü - Mail istedi' }
  ],
  gorusulemedi: [
    { value: 'gorusulemedi_cevap_yok', label: 'Görüşülemedi - Cevap verilmedi' },
    { value: 'gorusulemedi_not_birakildi', label: 'Görüşülemedi - Not bırakıldı' },
    { value: 'gorusulemedi_mesgul', label: 'Görüşülemedi - Meşgul' }
  ]
};

// DEĞİŞİKLİK 1: Sadece 15 dakikalık aralıklar
const MINUTE_OPTIONS = [
  { value: '00', label: '00' },
  { value: '15', label: '15' },
  { value: '30', label: '30' },
  { value: '45', label: '45' }
];

// Saat seçenekleri (00-23)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}));

// Telefon ülke kodları
const PHONE_COUNTRY_CODES = [
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Türkiye' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'ABD' },
  { code: '+44', country: 'UK', flag: '🇬🇧', name: 'İngiltere' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Almanya' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'Fransa' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'İtalya' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'İspanya' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Rusya' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'Çin' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japonya' }
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CallRecordForm({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    call_type: '',
    duration_minutes: '',
    contact_person: '',
    call_result: '',
    summary: '',
    call_date: new Date().toISOString().split('T')[0],
    call_hour: new Date().getHours().toString().padStart(2, '0'),
    call_minute: new Date().getMinutes() < 15 ? '00' : 
                  new Date().getMinutes() < 30 ? '15' :
                  new Date().getMinutes() < 45 ? '30' : '45'
  });

  const [saving, setSaving] = useState(false);
  const [contactPersons, setContactPersons] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  
  // Arama sonucu yeni ekleme için state
  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const [newResultOption, setNewResultOption] = useState({ label: '', category: 'gorusuldu' });
  const [callResultOptions, setCallResultOptions] = useState(CALL_RESULTS_GROUPED);

  // Yeni yetkili ekleme için state'ler
  const [newContact, setNewContact] = useState({
    name: '',
    position: '',
    phone: '',
    phoneCountryCode: '+90',
    email: '',
    country: '',
    city: ''
  });
  
  const [contactCountries, setContactCountries] = useState([]);
  const [contactCities, setContactCities] = useState([]);
  const [positions, setPositions] = useState([]);

  // Load opportunity and customer data on mount
  useEffect(() => {
    loadOpportunityData();
    loadLibraryData();
  }, [opportunityId]);

  const loadLibraryData = async () => {
    try {
      // Ülkeleri yükle
      const countriesRes = await fetch(`${BACKEND_URL}/api/library/countries`);
      if (countriesRes.ok) {
        const countries = await countriesRes.json();
        setContactCountries(countries);
      }

      // Pozisyonları yükle
      const positionsRes = await fetch(`${BACKEND_URL}/api/library/positions`);
      if (positionsRes.ok) {
        const positions = await positionsRes.json();
        setPositions(positions);
      }
    } catch (error) {
      console.error('Error loading library data:', error);
    }
  };

  const loadOpportunityData = async () => {
    try {
      setLoadingContacts(true);
      
      // Try to get opportunity details first
      const oppResponse = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}`);
      if (oppResponse.ok) {
        const opportunity = await oppResponse.json();
        setCustomerInfo({
          name: opportunity.customer,
          id: opportunity.customer_id || opportunity.customer
        });
        
        // Load contact persons for this customer
        await loadContactPersons(opportunity.customer);
      } else {
        // If opportunity not found, treat opportunityId as customerId
        console.log('Opportunity not found, treating as customer ID');
        const customersResponse = await fetch(`${BACKEND_URL}/api/customers`);
        if (customersResponse.ok) {
          const customers = await customersResponse.json();
          const customer = customers.find(c => c.id === opportunityId);
          
          if (customer) {
            setCustomerInfo({
              name: customer.companyName || customer.companyTitle,
              id: customer.id
            });
            
            // Load contacts directly from customer
            setContactPersons(customer.contacts || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading opportunity data:', error);
      toast({
        title: "Hata",
        description: "Müşteri bilgileri yüklenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadContactPersons = async (customerName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/customers`);
      if (response.ok) {
        const customers = await response.json();
        const customer = customers.find(c => 
          c.companyName === customerName || 
          c.companyTitle === customerName ||
          c.contactPerson === customerName
        );
        
        if (customer && customer.contacts) {
          setContactPersons(customer.contacts || []);
        } else {
          setContactPersons([]);
        }
      }
    } catch (error) {
      console.error('Error loading contact persons:', error);
      setContactPersons([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactPersonChange = (value) => {
    if (value === 'add_new') {
      setShowNewContactModal(true);
    } else {
      handleInputChange('contact_person', value);
    }
  };

  // Yeni arama sonucu ekleme
  const handleAddNewResultOption = () => {
    if (!newResultOption.label.trim()) {
      toast({
        title: "Uyarı",
        description: "Sonuç adı boş olamaz",
        variant: "destructive"
      });
      return;
    }

    const category = newResultOption.category;
    const newOption = {
      value: `${category}_${newResultOption.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      label: `${category === 'gorusuldu' ? 'Görüşüldü' : 'Görüşülemedi'} - ${newResultOption.label}`
    };

    setCallResultOptions(prev => ({
      ...prev,
      [category]: [...prev[category], newOption]
    }));

    toast({
      title: "Başarılı",
      description: "Yeni arama sonucu eklendi",
      className: "bg-green-50 border-green-200 text-green-800"
    });

    setShowAddResultModal(false);
    setNewResultOption({ label: '', category: 'gorusuldu' });
  };

  // Ülke değişince şehirleri yükle
  const handleContactCountryChange = async (e) => {
    const selectedCountry = e.target.value;
    setNewContact(prev => ({ ...prev, country: selectedCountry, city: '' }));
    
    if (selectedCountry) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/library/cities?country=${encodeURIComponent(selectedCountry)}`);
        if (response.ok) {
          const cities = await response.json();
          setContactCities(cities);
        }
      } catch (error) {
        console.error('Şehirler yüklenemedi:', error);
        setContactCities([]);
      }
    } else {
      setContactCities([]);
    }
  };

  // Yeni yetkili ekleme - ÇİFT KAYIT
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    try {
      const fullPhone = `${newContact.phoneCountryCode} ${newContact.phone}`;
      
      const contactData = {
        name: newContact.name,
        fullName: newContact.name,
        position: newContact.position,
        phone: fullPhone,
        mobile: fullPhone,
        email: newContact.email,
        country: newContact.country,
        city: newContact.city
      };
      
      // 1. FİRMAYA YETKİLİ OLARAK EKLE (KALICI)
      const response = await fetch(`${BACKEND_URL}/api/customers/${customerInfo.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      
      if (!response.ok) {
        throw new Error('Yetkili eklenemedi');
      }
      
      const result = await response.json();
      const savedContact = result.contact;
      
      // 2. GÖRÜŞÜLEN KİŞİLER LİSTESİNE EKLE
      setContactPersons(prev => [...prev, savedContact]);
      
      // 3. FORMDA SEÇİLİ HİLE GETİR
      handleInputChange('contact_person', savedContact.fullName || savedContact.name);
      
      // 4. MODAL'I KAPAT VE SIFIRLA
      setShowNewContactModal(false);
      setNewContact({
        name: '',
        position: '',
        phone: '',
        phoneCountryCode: '+90',
        email: '',
        country: '',
        city: ''
      });
      setContactCities([]);
      
      toast({
        title: "Başarılı",
        description: `${contactData.name} yetkili olarak eklendi ve seçildi`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
    } catch (error) {
      console.error('Yetkili eklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Yetkili eklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!formData.call_type || !formData.contact_person || !formData.call_result) {
      toast({
        title: "Eksik Bilgi",
        description: "Arama tipi, görüşülen kişi ve arama sonucu zorunludur.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const callTime = `${formData.call_hour}:${formData.call_minute}`;
      
      const callRecord = {
        opportunity_id: opportunityId,
        type: 'call_record',
        title: `Görüşme: ${formData.contact_person}`,
        description: formData.summary || `${formData.call_type === 'outgoing' ? 'Giden' : 'Gelen'} arama - ${formData.call_result}`,
        status: 'completed',
        priority: 'medium',
        data: {
          call_type: formData.call_type,
          contact_person: formData.contact_person,
          call_result: formData.call_result,
          summary: formData.summary,
          duration_minutes: parseInt(formData.duration_minutes) || 0,
          call_date: formData.call_date,
          call_time: callTime
        }
      };

      const response = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callRecord)
      });

      if (!response.ok) throw new Error('Kaydetme başarısız');

      toast({
        title: "Başarılı",
        description: "Görüşme kaydı başarıyla eklendi.",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      onSave(callRecord);
    } catch (error) {
      console.error('Error saving call record:', error);
      toast({
        title: "Hata",
        description: "Görüşme kaydı eklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Görüşme Kaydı</h3>
            <p className="text-sm text-gray-600">{customerInfo?.name || opportunityTitle}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Arama Tipi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arama Tipi *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CALL_TYPES.map(type => (
              <Button
                key={type.value}
                type="button"
                variant={formData.call_type === type.value ? "default" : "outline"}
                onClick={() => handleInputChange('call_type', type.value)}
                className={`flex items-center justify-center space-x-2 ${
                  formData.call_type === type.value ? '' : 'border-gray-300'
                }`}
              >
                <type.icon className={`h-4 w-4 ${type.color}`} />
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tarih ve Saat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görüşme Tarihi *
            </label>
            <Input
              type="date"
              value={formData.call_date}
              onChange={(e) => handleInputChange('call_date', e.target.value)}
              className="w-full"
            />
          </div>

          {/* DEĞİŞİKLİK 1: Saat ve Dakika Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görüşme Saati *
            </label>
            <div className="flex gap-2">
              <Select value={formData.call_hour} onValueChange={(value) => handleInputChange('call_hour', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Saat" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map(hour => (
                    <SelectItem key={hour.value} value={hour.value}>{hour.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="flex items-center">:</span>
              
              <Select value={formData.call_minute} onValueChange={(value) => handleInputChange('call_minute', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dakika" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_OPTIONS.map(minute => (
                    <SelectItem key={minute.value} value={minute.value}>{minute.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Süre ve Görüşülen Kişi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görüşme Süresi (dakika)
            </label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
              placeholder="Örn: 15"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görüşülen Kişi *
            </label>
            <Select 
              value={formData.contact_person} 
              onValueChange={handleContactPersonChange}
              disabled={loadingContacts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingContacts ? "Yükleniyor..." : "Görüşülen kişiyi seçin"} />
              </SelectTrigger>
              <SelectContent>
                {contactPersons.map((person, index) => (
                  <SelectItem key={index} value={person.fullName || person.name || person}>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span>{person.fullName || person.name || person}</span>
                      {(person.mobile || person.phone) && (
                        <span className="text-xs text-gray-500">({person.mobile || person.phone})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="add_new">
                  <div className="flex items-center space-x-2 text-green-600">
                    <UserPlus className="h-4 w-4" />
                    <span>Yeni Kişi Ekle</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* DEĞİŞİKLİK 2: Arama Sonucu (Gruplandırılmış) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arama Sonucu *
          </label>
          <Select value={formData.call_result} onValueChange={(value) => handleInputChange('call_result', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Arama sonucu seçin" />
            </SelectTrigger>
            <SelectContent>
              {/* Görüşüldü Kategorisi */}
              <SelectItem value="_gorusuldu_header" disabled className="font-semibold text-gray-900 bg-gray-100">
                Görüşüldü
              </SelectItem>
              {callResultOptions.gorusuldu.map(result => (
                <SelectItem key={result.value} value={result.value} className="pl-6">
                  {result.label}
                </SelectItem>
              ))}
              
              {/* Görüşülemedi Kategorisi */}
              <SelectItem value="_gorusulemedi_header" disabled className="font-semibold text-gray-900 bg-gray-100 mt-2">
                Görüşülemedi
              </SelectItem>
              {callResultOptions.gorusulemedi.map(result => (
                <SelectItem key={result.value} value={result.value} className="pl-6">
                  {result.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button 
            type="button" 
            onClick={() => setShowAddResultModal(true)}
            className="text-blue-600 text-sm mt-1 hover:underline flex items-center space-x-1"
          >
            <Plus className="h-3 w-3" />
            <span>+ Yeni Ekle</span>
          </button>
        </div>

        {/* DEĞİŞİKLİK 4: Görüşme Özeti Genişletildi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Görüşme Özeti
          </label>
          <Textarea
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            placeholder="Görüşme detaylarını buraya yazın..."
            rows={8}
            className="w-full min-h-[200px] resize-y"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !formData.call_type || !formData.contact_person || !formData.call_result}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </>
          )}
        </Button>
      </div>

      {/* DEĞİŞİKLİK 2: Yeni Arama Sonucu Ekleme Modalı */}
      {showAddResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yeni Arama Sonucu Ekle</h3>
              <button 
                onClick={() => setShowAddResultModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <Select 
                  value={newResultOption.category}
                  onValueChange={(value) => setNewResultOption({...newResultOption, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gorusuldu">Görüşüldü</SelectItem>
                    <SelectItem value="gorusulemedi">Görüşülemedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sonuç Adı</label>
                <Input 
                  type="text"
                  placeholder="Örnek: Toplantı planlandı"
                  value={newResultOption.label}
                  onChange={(e) => setNewResultOption({...newResultOption, label: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddResultModal(false)}>İptal</Button>
                <Button onClick={handleAddNewResultOption} className="bg-blue-600">Ekle</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEĞİŞİKLİK 5: Yeni Yetkili Kişi Ekleme Modalı (Tam Detaylı) */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl my-8">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Yeni Yetkili Kişi Ekle</h3>
              <button 
                onClick={() => setShowNewContactModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="space-y-4">
              
              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <Input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Ad Soyad"
                  required
                />
              </div>
              
              {/* Pozisyon Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon *</label>
                <Select
                  value={newContact.position}
                  onValueChange={(value) => setNewContact({...newContact, position: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pozisyon Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos.id || pos._id} value={pos.name}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Telefon (Ülke Kodu + Numara) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                <div className="flex gap-2">
                  <Select
                    value={newContact.phoneCountryCode}
                    onValueChange={(value) => setNewContact({...newContact, phoneCountryCode: value})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHONE_COUNTRY_CODES.map(item => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.flag} {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="5XX XXX XX XX"
                    className="flex-1"
                    required
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  placeholder="ornek@firma.com"
                />
              </div>
              
              {/* Ülke ve Şehir */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                  <Select
                    value={newContact.country}
                    onValueChange={(value) => {
                      setNewContact({...newContact, country: value, city: ''});
                      // Şehirleri yükle
                      if (value) {
                        fetch(`${BACKEND_URL}/api/library/cities?country=${encodeURIComponent(value)}`)
                          .then(res => res.json())
                          .then(cities => setContactCities(cities))
                          .catch(() => setContactCities([]));
                      } else {
                        setContactCities([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactCountries.map(country => (
                        <SelectItem key={country.id || country._id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                  <Select
                    value={newContact.city}
                    onValueChange={(value) => setNewContact({...newContact, city: value})}
                    disabled={!newContact.country || contactCities.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!newContact.country ? "Önce ülke seçin" : "Şehir Seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {contactCities.map(city => (
                        <SelectItem key={city.id || city._id || city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Butonlar */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewContactModal(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ekle
                </Button>
              </div>
              
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
