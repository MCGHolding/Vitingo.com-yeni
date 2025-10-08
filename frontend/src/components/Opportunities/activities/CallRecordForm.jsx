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
                <div className="relative">
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Görüşülen kişinin adı"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
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
    </div>
  );
}