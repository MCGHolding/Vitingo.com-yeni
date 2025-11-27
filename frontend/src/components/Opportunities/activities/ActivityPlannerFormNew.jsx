import React, { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import ReminderSettings from './ReminderSettings';

const ACTIVITY_TYPES = [
  { id: 'email', icon: '📧', label: 'E-posta', color: 'blue' },
  { id: 'phone', icon: '📞', label: 'Telefon', color: 'green' },
  { id: 'proposal', icon: '📄', label: 'Teklif', color: 'purple' },
  { id: 'design', icon: '🎨', label: 'Tasarım', color: 'orange' },
  { id: 'custom', icon: '➕', label: 'Özel', color: 'gray' }
];

const QUICK_DATE_OPTIONS = [
  { label: 'Bugün', days: 0 },
  { label: 'Yarın', days: 1 },
  { label: '3 Gün', days: 3 },
  { label: '1 Hafta', days: 7 }
];

// Generate time options (00:00 to 23:30, 30-minute intervals)
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    ['00', '30'].forEach(m => {
      const time = `${h.toString().padStart(2, '0')}:${m}`;
      times.push(time);
    });
  }
  return times;
};

export default function ActivityPlannerFormNew({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState('email');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    customName: '',
    priority: 'normal',
    reminderEnabled: true,
    reminderSettings: {
      timing: '1hour',
      customMinutes: null,
      channels: {
        inApp: true,
        email: false,
        sms: false
      }
    }
  });
  const [loading, setLoading] = useState(false);

  const setQuickDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    setFormData({
      ...formData,
      date: date.toISOString().split('T')[0]
    });
  };

  const isQuickDateSelected = (daysFromNow) => {
    if (!formData.date) return false;
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return formData.date === date.toISOString().split('T')[0];
  };

  const isFormValid = () => {
    if (!formData.title || !formData.date) return false;
    if (selectedType === 'custom' && !formData.customName) return false;
    return true;
  };

  const fillTestData = () => {
    const today = new Date();
    const testDataByType = {
      email: {
        title: 'Teklif e-postası gönder',
        description: 'Müşteriye hazırlanan teklifin detaylarını e-posta ile ilet',
        date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], // Yarın
        time: '14:00',
        customName: '',
        priority: 'high'
      },
      phone: {
        title: 'Müşteri ile telefon görüşmesi',
        description: 'Proje ilerlemesi hakkında bilgi almak için arama yap',
        date: today.toISOString().split('T')[0], // Bugün
        time: '10:30',
        customName: '',
        priority: 'high'
      },
      proposal: {
        title: 'Fiyat teklifi hazırla',
        description: 'Stand kurulumu için detaylı fiyat teklifi oluştur ve gönder',
        date: new Date(today.getTime() + 259200000).toISOString().split('T')[0], // 3 gün sonra
        time: '15:00',
        customName: '',
        priority: 'normal'
      },
      design: {
        title: 'Stand tasarımı paylaş',
        description: '3D tasarım görselleri hazırla ve müşteri ile paylaş',
        date: new Date(today.getTime() + 604800000).toISOString().split('T')[0], // 1 hafta sonra
        time: '11:00',
        customName: '',
        priority: 'normal'
      },
      custom: {
        title: 'Toplantı organize et',
        description: 'Proje kickoff toplantısı için tarih ve yer ayarla',
        date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], // Yarın
        time: '09:00',
        customName: 'Proje Başlangıç Toplantısı',
        priority: 'high'
      }
    };

    const testData = testDataByType[selectedType] || testDataByType.email;
    setFormData(prev => ({
      ...prev,
      ...testData,
      // Keep reminder settings
      reminderEnabled: true,
      reminderSettings: {
        timing: '1hour',
        customMinutes: null,
        channels: {
          inApp: true,
          email: true,  // Enable email for test
          sms: false
        }
      }
    }));

    toast({
      title: "✅ Test verisi dolduruldu",
      description: `${selectedType === 'custom' ? 'Özel' : ACTIVITY_TYPES.find(t => t.id === selectedType)?.label} aktivitesi için örnek veri yüklendi`,
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate reminder scheduled time
      let reminderScheduledFor = null;
      if (formData.reminderEnabled && formData.date) {
        const activityDateTime = new Date(`${formData.date}T${formData.time || '09:00'}:00`);
        let minutesBefore = 60; // Default 1 hour
        
        switch (formData.reminderSettings.timing) {
          case '10min': minutesBefore = 10; break;
          case '30min': minutesBefore = 30; break;
          case '1hour': minutesBefore = 60; break;
          case '3hours': minutesBefore = 180; break;
          case '1day': minutesBefore = 1440; break;
          case 'custom': minutesBefore = formData.reminderSettings.customMinutes || 60; break;
        }
        
        reminderScheduledFor = new Date(activityDateTime.getTime() - minutesBefore * 60000);
      }

      const activityData = {
        type: 'activity_planner',
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        data: {
          activity_type: selectedType,
          custom_activity_name: selectedType === 'custom' ? formData.customName : null,
          scheduled_datetime: `${formData.date}T${formData.time || '09:00'}:00`,
          has_reminder: formData.reminderEnabled,
          reminder_minutes: 60, // Legacy field
          reminder_methods: ['push'], // Legacy field
          notes: formData.description,
          status: 'planned'
        },
        reminder: {
          enabled: formData.reminderEnabled,
          timing: formData.reminderSettings.timing,
          customMinutes: formData.reminderSettings.customMinutes,
          channels: formData.reminderSettings.channels,
          scheduledFor: reminderScheduledFor ? reminderScheduledFor.toISOString() : null,
          sentAt: null
        }
      };

      console.log('🔵 [FORM] Gönderilen data:', activityData);
      console.log('🔵 [FORM] Opportunity ID:', opportunityId);
      
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities`;
      console.log('🔵 [FORM] API URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      console.log('🔵 [FORM] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FORM] API error:', errorText);
        throw new Error(`API isteği başarısız oldu: ${response.status}`);
      }

      const savedActivity = await response.json();
      console.log('✅ [FORM] Kayıt başarılı:', savedActivity);

      toast({
        title: "✅ Başarılı",
        description: `${formData.title} başarıyla planlandı`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        customName: '',
        priority: 'normal',
        reminderEnabled: true,
        reminderSettings: {
          timing: '1hour',
          customMinutes: null,
          channels: {
            inApp: true,
            email: false,
            sms: false
          }
        }
      });
      setSelectedType('email');

      // Call onSave to trigger list refresh
      console.log('🔵 [FORM] onSave çağrılıyor...');
      onSave(savedActivity);
    } catch (error) {
      console.error('❌ [FORM] Activity save error:', error);
      toast({
        title: "❌ Hata",
        description: error.message || "Aktivite planlanırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
      {/* Aktivite Tipi Grid - Responsive */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Aktivite Tipi
          </label>
          <button
            type="button"
            onClick={fillTestData}
            className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Test Verisi Doldur</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {ACTIVITY_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`
                relative flex flex-col items-center justify-center 
                p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all
                ${
                  selectedType === type.id 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{type.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-700">{type.label}</span>
              {selectedType === type.id && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] sm:text-xs font-bold">✓</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Özel Aktivite Adı (conditional) */}
      {selectedType === 'custom' && (
        <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ Özel Aktivite Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.customName}
            onChange={(e) => setFormData({...formData, customName: e.target.value})}
            placeholder="Örn: Toplantı Organize Et, Demo Hazırla"
            className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
      )}

      {/* Form Grid - Responsive */}
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-6 sm:gap-4 mb-4">
        {/* Başlık */}
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Başlık <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Aktivite başlığı"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tarih ve Saat - Mobile: yan yana, Desktop: ayrı kolonlar */}
        <div className="grid grid-cols-2 gap-3 sm:col-span-3 sm:grid-cols-3">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⏰ Saat
            </label>
            <select
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">--:--</option>
              {generateTimeOptions().map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Açıklama */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Açıklama
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Ek bilgiler..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Öncelik */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ⭐ Öncelik
        </label>
        <div className="flex items-center gap-4">
          {[
            { value: 'high', label: 'Yüksek', icon: '⭐', color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
            { value: 'normal', label: 'Normal', icon: '○', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-400' },
            { value: 'low', label: 'Düşük', icon: '↓', color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' }
          ].map(priority => (
            <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={formData.priority === priority.value}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.priority === priority.value 
                  ? `${priority.borderColor} ${priority.bgColor}` 
                  : 'border-gray-300 bg-white'
              }`}>
                {formData.priority === priority.value && (
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    priority.value === 'high' ? 'bg-amber-500' : 'bg-gray-500'
                  }`} />
                )}
              </div>
              <span className={`text-sm ${priority.color} font-medium`}>{priority.icon}</span>
              <span className="text-sm text-gray-700">{priority.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Alt Satır - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        {/* Hızlı Tarih */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">⚡</span>
          {QUICK_DATE_OPTIONS.map(option => (
            <button
              key={option.days}
              type="button"
              onClick={() => setQuickDate(option.days)}
              className={`px-2.5 sm:px-3 py-1 text-xs rounded-full transition-colors ${
                isQuickDateSelected(option.days)
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Hatırlatıcı Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-gray-600">🔔 Hatırlat</span>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              reminderEnabled: !prev.reminderEnabled,
              reminderSettings: !prev.reminderEnabled ? prev.reminderSettings : {
                timing: '1hour',
                customMinutes: null,
                channels: { inApp: true, email: false, sms: false }
              }
            }))}
            className={`w-11 h-6 rounded-full relative transition-colors ${
              formData.reminderEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 shadow transition-transform ${
              formData.reminderEnabled ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </label>
      </div>

      {/* Hatırlatma Ayarları - Toggle açıksa göster */}
      <ReminderSettings
        enabled={formData.reminderEnabled}
        settings={formData.reminderSettings}
        onChange={(newSettings) => setFormData(prev => ({
          ...prev,
          reminderSettings: newSettings
        }))}
      />

      {/* Form Butonları */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          className="px-4 sm:px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <span>Kaydediliyor...</span>
          ) : (
            <>
              <span>📋</span>
              <span className="hidden sm:inline">Planla</span>
              <span className="sm:hidden">Ekle</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
