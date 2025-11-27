import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Calendar, 
  Bell, 
  Clock,
  Mail,
  Phone,
  FileText,
  Save,
  X,
  AlertTriangle,
  Plus,
  Minus
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const ACTIVITY_TYPES = [
  { 
    value: 'email', 
    label: 'E-posta Gönderimi', 
    icon: Mail, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Müşteriye e-posta gönderme hatırlatıcısı'
  },
  { 
    value: 'phone', 
    label: 'Telefon Araması', 
    icon: Phone, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Müşteri ile telefon görüşmesi hatırlatıcısı'
  },
  { 
    value: 'proposal', 
    label: 'Teklif Gönderimi', 
    icon: FileText, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Teklif hazırlama ve gönderme hatırlatıcısı'
  },
  { 
    value: 'design', 
    label: 'Tasarım Gönderimi', 
    icon: Upload, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Tasarım dosyası hazırlama ve gönderme'
  },
  { 
    value: 'custom', 
    label: 'Özel Aktivite', 
    icon: Plus, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Kendi aktivite tipinizi oluşturun'
  }
];

const REMINDER_OPTIONS = [
  { value: '15', label: '15 dakika önce', icon: '⏰' },
  { value: '30', label: '30 dakika önce', icon: '⏱️' },
  { value: '60', label: '1 saat önce', icon: '🕐' },
  { value: '120', label: '2 saat önce', icon: '🕑' },
  { value: '240', label: '4 saat önce', icon: '🕓' },
  { value: '1440', label: '1 gün önce', icon: '📅' },
  { value: '2880', label: '2 gün önce', icon: '📆' },
  { value: '10080', label: '1 hafta önce', icon: '📋' }
];

const REMINDER_METHODS = [
  { 
    value: 'email', 
    label: 'E-posta', 
    icon: Mail,
    description: 'E-posta ile hatırlatıcı gönder'
  },
  { 
    value: 'sms', 
    label: 'SMS', 
    icon: MessageSquare,
    description: 'SMS ile hatırlatıcı gönder'
  },
  { 
    value: 'push', 
    label: 'Sistem Uyarısı', 
    icon: Bell,
    description: 'Uygulama içi bildirim gönder'
  }
];

const QUICK_DATE_OPTIONS = [
  { label: 'Bugün', getValue: () => new Date().toISOString().split('T')[0] },
  { label: 'Yarın', getValue: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }},
  { label: '3 Gün Sonra', getValue: () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  }},
  { label: '1 Hafta Sonra', getValue: () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }}
];

export default function ActivityPlannerForm({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    activity_type: '',
    title: '',
    custom_activity_name: '', // For custom activity type
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    has_reminder: false,
    reminder_minutes: '60',
    reminder_methods: ['push'], // Default to push notification
    notes: ''
  });

  const [saving, setSaving] = useState(false);

  const selectedActivityType = ACTIVITY_TYPES.find(type => type.value === formData.activity_type);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReminderToggle = (enabled) => {
    setFormData(prev => ({
      ...prev,
      has_reminder: enabled
    }));
  };

  const handleReminderMethodToggle = (method) => {
    setFormData(prev => {
      const methods = prev.reminder_methods.includes(method)
        ? prev.reminder_methods.filter(m => m !== method)
        : [...prev.reminder_methods, method];
      
      return {
        ...prev,
        reminder_methods: methods
      };
    });
  };

  const getActivityTitle = () => {
    if (!formData.activity_type) return '';
    
    switch (formData.activity_type) {
      case 'email':
        return 'E-posta Gönderimi';
      case 'phone':
        return 'Telefon Araması';
      case 'proposal':
        return 'Teklif Gönderimi';
      case 'design':
        return 'Tasarım Gönderimi';
      case 'custom':
        return formData.custom_activity_name || 'Özel Aktivite';
      default:
        return '';
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.activity_type || !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen aktivite tipi, tarih ve saat seçin",
        variant: "destructive"
      });
      return;
    }

    // Custom activity validation
    if (formData.activity_type === 'custom' && !formData.custom_activity_name) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen özel aktivite adını girin",
        variant: "destructive"
      });
      return;
    }

    // Reminder method validation
    if (formData.has_reminder && formData.reminder_methods.length === 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen en az bir hatırlatıcı yöntemi seçin",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const activityTitle = formData.title || getActivityTitle();
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      
      // Prepare activity data for backend
      const activityData = {
        type: 'activity_planner',
        title: activityTitle,
        description: formData.description || `${getActivityTitle()} - ${opportunityTitle}`,
        data: {
          activity_type: formData.activity_type,
          scheduled_datetime: scheduledDateTime,
          has_reminder: formData.has_reminder,
          reminder_minutes: formData.has_reminder ? parseInt(formData.reminder_minutes) : null,
          notes: formData.notes,
          status: 'planned'
        }
      };

      // Make API call to backend
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData)
        }
      );

      if (!response.ok) {
        throw new Error('API isteği başarısız oldu');
      }

      const savedActivity = await response.json();

      toast({
        title: "✅ Başarılı",
        description: `${activityTitle} başarıyla planlandı`,
      });

      onSave(savedActivity);
    } catch (error) {
      console.error('Activity save error:', error);
      toast({
        title: "❌ Hata",
        description: "Aktivite planlanırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Info */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">Aktivite Planlama</h3>
              <p className="text-sm text-purple-700">Hatırlatıcılı görevler ve aktiviteler oluşturun</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Activity Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktivite Tipi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTIVITY_TYPES.map((type) => {
                const IconComponent = type.icon;
                const isSelected = formData.activity_type === type.value;
                
                return (
                  <div
                    key={type.value}
                    onClick={() => handleInputChange('activity_type', type.value)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? `${type.bgColor} ${type.borderColor} shadow-md` 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-6 w-6 ${isSelected ? type.color : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-medium ${isSelected ? type.color : 'text-gray-700'}`}>
                          {type.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {type.value === 'email' && 'Müşteriye e-posta gönderme hatırlatıcısı'}
                          {type.value === 'phone' && 'Müşteri ile telefon görüşmesi hatırlatıcısı'}
                          {type.value === 'proposal' && 'Teklif hazırlama ve gönderme hatırlatıcısı'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Activity Details */}
          {formData.activity_type && (
            <Card className={`${selectedActivityType.bgColor} ${selectedActivityType.borderColor} border-2`}>
              <CardHeader>
                <CardTitle className={`text-lg ${selectedActivityType.color} flex items-center space-x-2`}>
                  {React.createElement(selectedActivityType.icon, { className: "h-5 w-5" })}
                  <span>{selectedActivityType.label} Detayları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Aktivite Başlığı (İsteğe Bağlı)
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={`Örn: ${getActivityTitle()} - ${opportunityTitle}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Açıklama
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={
                      formData.activity_type === 'email' 
                        ? 'Gönderilecek e-posta içeriği hakkında notlar...'
                        : formData.activity_type === 'phone'
                        ? 'Görüşmede konuşulacak konular...'
                        : 'Teklif detayları ve önemli noktalar...'
                    }
                    className="min-h-[100px]"
                  />
                </div>

                {/* Quick Date Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Hızlı Tarih Seçimi
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_DATE_OPTIONS.map((option) => (
                      <Button
                        key={option.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('scheduled_date', option.getValue())}
                        className={`h-8 text-xs ${
                          formData.scheduled_date === option.getValue() 
                            ? 'bg-purple-100 border-purple-300 text-purple-700' 
                            : ''
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center justify-between">
                      <span>Tarih</span>
                      {formData.scheduled_date && (
                        <span className="text-xs text-purple-600">
                          {new Date(formData.scheduled_date).toLocaleDateString('tr-TR', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      )}
                    </label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Saat ⏰
                    </label>
                    <Input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Reminder Settings */}
          {formData.activity_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Hatırlatıcı Ayarları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-5 w-5 ${formData.has_reminder ? 'text-yellow-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">Hatırlatıcı Aktif</p>
                      <p className="text-sm text-gray-600">Aktivite öncesi bildirim al</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={formData.has_reminder ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleReminderToggle(false)}
                      className="h-8"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Kapalı
                    </Button>
                    <Button
                      variant={formData.has_reminder ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleReminderToggle(true)}
                      className="h-8"
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Açık
                    </Button>
                  </div>
                </div>

                {formData.has_reminder && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Hatırlatıcı Zamanı
                    </label>
                    <Select 
                      value={formData.reminder_minutes} 
                      onValueChange={(value) => handleInputChange('reminder_minutes', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hatırlatıcı zamanını seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{option.icon}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {formData.activity_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Ek Notlar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Aktivite ile ilgili ek notlar, önemli hatırlatmalar..."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {formData.activity_type && formData.scheduled_date && formData.scheduled_time && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Aktivite Önizleme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  {React.createElement(selectedActivityType.icon, { 
                    className: `h-5 w-5 ${selectedActivityType.color}` 
                  })}
                  <span className="font-medium">
                    {formData.title || getActivityTitle()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  📅 {new Date(formData.scheduled_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} - {formData.scheduled_time}
                </div>
                
                {formData.has_reminder && (
                  <div className="text-sm text-yellow-700 flex items-center space-x-1">
                    <Bell className="h-4 w-4" />
                    <span>
                      Hatırlatıcı: {REMINDER_OPTIONS.find(opt => opt.value === formData.reminder_minutes)?.label}
                    </span>
                  </div>
                )}
                
                {formData.description && (
                  <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                    {formData.description}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
          disabled={saving || !formData.activity_type || !formData.scheduled_date || !formData.scheduled_time}
          className="bg-purple-600 hover:bg-purple-700 px-6"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Planlanıyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Aktiviteyi Planla
            </>
          )}
        </Button>
      </div>
    </div>
  );
}