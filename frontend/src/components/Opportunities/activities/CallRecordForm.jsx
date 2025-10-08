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
        const customer = customers.find(c => c.name === customerName);
        
        if (customer && customer.contact_persons) {
          setContactPersons(customer.contact_persons || []);
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
                      <SelectItem key={index} value={person.name || person}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span>{person.name || person}</span>
                          {person.phone && (
                            <span className="text-xs text-gray-500">({person.phone})</span>
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

// New Contact Modal Component
function NewContactModal({ customerName, onSave, onClose }) {
  const { toast } = useToast();
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    email: '',
    position: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!contactData.name.trim()) {
        toast({
          title: "Eksik Bilgi",
          description: "Kişi adı zorunludur.",
          variant: "destructive"
        });
        return;
      }

      // In a real implementation, you would add the contact to the customer
      // For now, we'll just call the callback with the new contact data
      onSave({
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        position: contactData.position
      });

      toast({
        title: "Başarılı",
        description: "Yeni kişi başarıyla eklendi.",
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span>Yeni Yetkili Kişi Ekle</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {customerName} müşterisi için yeni yetkili kişi
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Soyad *
            </label>
            <Input
              value={contactData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Yetkili kişinin adı soyadı"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <Input
              value={contactData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Telefon numarası"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <Input
              type="email"
              value={contactData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="E-posta adresi"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pozisyon
            </label>
            <Input
              value={contactData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              placeholder="Şirket pozisyonu"
              className="w-full"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !contactData.name.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Kişiyi Ekle
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}