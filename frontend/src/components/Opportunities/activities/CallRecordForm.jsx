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

const CALL_RESULTS = [
  { value: 'successful', label: 'Başarılı - Görüşüldü', icon: CheckCircle, color: 'text-green-600' },
  { value: 'no_answer', label: 'Cevap Verilmedi', icon: AlertCircle, color: 'text-yellow-600' },
  { value: 'busy', label: 'Meşgul', icon: XCircle, color: 'text-red-600' },
  { value: 'callback', label: 'Geri Arama İstedi', icon: PhoneCall, color: 'text-purple-600' }
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
    next_action: '',
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toTimeString().split(' ')[0].slice(0, 5)
  });

  const [saving, setSaving] = useState(false);
  const [contactPersons, setContactPersons] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Load opportunity and customer data on mount
  useEffect(() => {
    loadOpportunityData();
  }, [opportunityId]);

  const loadOpportunityData = async () => {
    try {
      setLoadingContacts(true);
      
      // Get opportunity details
      const oppResponse = await fetch(`${BACKEND_URL}/api/opportunities/${opportunityId}`);
      if (oppResponse.ok) {
        const opportunity = await oppResponse.json();
        setCustomerInfo({
          name: opportunity.customer,
          id: opportunity.customer_id || opportunity.customer
        });
        
        // Load contact persons for this customer
        await loadContactPersons(opportunity.customer);
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
      // Try to get contact persons for this customer
      const response = await fetch(`${BACKEND_URL}/api/customers`);
      if (response.ok) {
        const customers = await response.json();
        // Match by companyName, companyTitle, or contactPerson
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

  const handleNewContactAdded = (newContact) => {
    // Add new contact to the list
    setContactPersons(prev => [...prev, newContact]);
    
    // Automatically select the new contact (use fullName field)
    handleInputChange('contact_person', newContact.fullName || newContact.name);
    
    // Close modal
    setShowNewContactModal(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.call_type || !formData.contact_person || !formData.call_result) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen gerekli alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const callRecord = {
        type: 'call_record',
        opportunity_id: opportunityId,
        data: formData,
        created_at: new Date().toISOString(),
        id: Date.now().toString()
      };

      toast({
        title: "Başarılı",
        description: "Görüşme kaydı başarıyla oluşturuldu",
      });

      onSave(callRecord);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görüşme kaydı oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Müşteri Görüşmesi Kaydı</h3>
              <p className="text-sm text-blue-700">Telefon görüşmesi detaylarını kaydedin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Call Type & Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <PhoneCall className="h-5 w-5" />
                <span>Arama Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Arama Türü
                </label>
                <Select value={formData.call_type} onValueChange={(value) => handleInputChange('call_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Arama türünü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_TYPES.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className={`h-4 w-4 ${type.color}`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tarih
                  </label>
                  <Input
                    type="date"
                    value={formData.call_date}
                    onChange={(e) => handleInputChange('call_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Saat
                  </label>
                  <Input
                    type="time"
                    value={formData.call_time}
                    onChange={(e) => handleInputChange('call_time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Görüşme Süresi (dakika)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    placeholder="örn: 15"
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    dakika
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Görüşülen Kişi
                </label>
                <Select value={formData.contact_person} onValueChange={(value) => {
                  if (value === 'add_new') {
                    setShowNewContactModal(true);
                  } else {
                    handleInputChange('contact_person', value);
                  }
                }}>
                  <SelectTrigger className={loadingContacts ? 'opacity-50' : ''}>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Call Result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Görüşme Sonucu</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Arama Sonucu
                </label>
                <Select value={formData.call_result} onValueChange={(value) => handleInputChange('call_result', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Arama sonucunu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_RESULTS.map((result) => {
                      const IconComponent = result.icon;
                      return (
                        <SelectItem key={result.value} value={result.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className={`h-4 w-4 ${result.color}`} />
                            <span>{result.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Görüşme Özeti
                </label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Görüşmede konuşulan konular, müşteri geribildirimleri..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sonraki Adım
                </label>
                <Textarea
                  value={formData.next_action}
                  onChange={(e) => handleInputChange('next_action', e.target.value)}
                  placeholder="Görüşme sonrası yapılacaklar, takip edilecek konular..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="px-6"
        >
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !formData.call_type || !formData.contact_person || !formData.call_result}
          className="bg-blue-600 hover:bg-blue-700 px-6"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Görüşmeyi Kaydet
            </>
          )}
        </Button>
      </div>

      {/* New Contact Modal */}
      {showNewContactModal && (
        <NewContactModal
          customerName={customerInfo?.name}
          onSave={handleNewContactAdded}
          onClose={() => setShowNewContactModal(false)}
        />
      )}
    </div>
  );
}

// New Contact Modal Component - Full Detailed Form
function NewContactModal({ customerName, onSave, onClose }) {
  const { toast } = useToast();
  const [contactData, setContactData] = useState({
    fullName: '',
    position: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    country: '',
    birthday: '',
    gender: '',
    project_role: '',
    tags: [],
    is_accounting_responsible: false
  });
  const [saving, setSaving] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!contactData.fullName.trim()) {
        toast({
          title: "Eksik Bilgi",
          description: "Ad Soyad zorunludur.",
          variant: "destructive"
        });
        return;
      }

      // Call parent callback with detailed contact data
      onSave({
        ...contactData,
        name: contactData.fullName // Add name field for compatibility
      });

      toast({
        title: "Başarılı",
        description: "Yeni yetkili kişi başarıyla eklendi.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      onClose();
    } catch (error) {
      console.error('Error saving new contact:', error);
      toast({
        title: "Hata",
        description: "Kişi kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !contactData.tags.includes(currentTag.trim())) {
      setContactData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setContactData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <span>Yeni Yetkili Kişi Ekle</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {customerName} müşterisi için detaylı kişi bilgileri
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <Input
                value={contactData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pozisyon
              </label>
              <Input
                value={contactData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Örn: Satın Alma Müdürü"
                className="w-full"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-posta
              </label>
              <Input
                type="email"
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="ornek@sirket.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mobil Telefon
              </label>
              <Input
                value={contactData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="+90 555 123 4567"
                className="w-full"
              />
            </div>
          </div>

          {/* Address Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Şehir
              </label>
              <Input
                value={contactData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="İstanbul"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ülke
              </label>
              <Input
                value={contactData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Türkiye"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adres
            </label>
            <Input
              value={contactData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Tam adres"
              className="w-full"
            />
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Doğum Tarihi
              </label>
              <Input
                type="date"
                value={contactData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cinsiyet
              </label>
              <Select value={contactData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Erkek">Erkek</SelectItem>
                  <SelectItem value="Kadın">Kadın</SelectItem>
                  <SelectItem value="Belirtmek İstemiyorum">Belirtmek İstemiyorum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Proje Rolü
              </label>
              <Select value={contactData.project_role} onValueChange={(value) => handleInputChange('project_role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Karar Verici">Karar Verici</SelectItem>
                  <SelectItem value="Etkileyici">Etkileyici</SelectItem>
                  <SelectItem value="Son Kullanıcı">Son Kullanıcı</SelectItem>
                  <SelectItem value="Teknik Uzman">Teknik Uzman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Etiketler
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Etiket ekle"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {contactData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Accounting Responsible */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="accounting"
              checked={contactData.is_accounting_responsible}
              onChange={(e) => handleInputChange('is_accounting_responsible', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="accounting" className="text-sm text-gray-700">
              Muhasebe Sorumlusu
            </label>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              size="sm"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !contactData.fullName.trim()}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ekle
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}