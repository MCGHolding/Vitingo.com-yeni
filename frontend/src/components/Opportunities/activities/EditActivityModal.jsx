import React, { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';

const ACTIVITY_TYPES = [
  { id: 'email', icon: '📧', label: 'E-posta' },
  { id: 'phone', icon: '📞', label: 'Telefon' },
  { id: 'proposal', icon: '📄', label: 'Teklif' },
  { id: 'design', icon: '🎨', label: 'Tasarım' },
  { id: 'custom', icon: '➕', label: 'Özel' }
];

const TIMING_OPTIONS = [
  { value: '10min', label: '10 dk önce' },
  { value: '30min', label: '30 dk önce' },
  { value: '1hour', label: '1 saat önce' },
  { value: '3hours', label: '3 saat önce' },
  { value: '1day', label: '1 gün önce' },
  { value: 'custom', label: 'Özel...' }
];

// Generate time options
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

export default function EditActivityModal({ activity, opportunityId, onClose, onSaved }) {
  const { toast } = useToast();
  
  // Parse existing data
  const existingType = activity.data?.activity_type || 'email';
  const existingDateTime = activity.data?.scheduled_datetime || '';
  const [date, time] = existingDateTime.split('T');
  const timeOnly = time?.substring(0, 5) || '';

  const [formData, setFormData] = useState({
    type: existingType,
    customName: activity.data?.custom_activity_name || '',
    title: activity.title || '',
    description: activity.description || '',
    date: date || '',
    time: timeOnly,
    priority: activity.priority || 'normal',
    reminderEnabled: activity.reminder?.enabled ?? (activity.data?.has_reminder || false),
    reminderSettings: {
      timing: activity.reminder?.timing || '1hour',
      customMinutes: activity.reminder?.customMinutes || null,
      channels: {
        inApp: activity.reminder?.channels?.inApp ?? true,
        email: activity.reminder?.channels?.email ?? false,
        sms: activity.reminder?.channels?.sms ?? false
      }
    }
  });
  
  const [saving, setSaving] = useState(false);

  const isFormValid = () => {
    if (!formData.title || !formData.date) return false;
    if (formData.type === 'custom' && !formData.customName) return false;
    return true;
  };
  
  const hasValidChannels = formData.reminderEnabled ? (
    formData.reminderSettings.channels.inApp ||
    formData.reminderSettings.channels.email ||
    formData.reminderSettings.channels.sms
  ) : true;
  
  const handleReminderToggle = () => {
    setFormData(prev => ({
      ...prev,
      reminderEnabled: !prev.reminderEnabled
    }));
  };
  
  const handleTimingChange = (timing) => {
    setFormData(prev => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        timing,
        customMinutes: timing === 'custom' ? (prev.reminderSettings.customMinutes || 60) : null
      }
    }));
  };
  
  const handleChannelChange = (channel, checked) => {
    setFormData(prev => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        channels: {
          ...prev.reminderSettings.channels,
          [channel]: checked
        }
      }
    }));
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
    
    if (!hasValidChannels) {
      toast({
        title: "Hatırlatma Kanalı",
        description: "En az bir hatırlatma kanalı seçmelisiniz",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Calculate reminder scheduled time
      let reminderScheduledFor = null;
      if (formData.reminderEnabled && formData.date) {
        const activityDateTime = new Date(`${formData.date}T${formData.time || '09:00'}:00`);
        let minutesBefore = 60;
        
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

      const updateData = {
        type: 'activity_planner',
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        data: {
          activity_type: formData.type,
          custom_activity_name: formData.type === 'custom' ? formData.customName : null,
          scheduled_datetime: `${formData.date}T${formData.time || '09:00'}:00`,
          has_reminder: formData.reminderEnabled,
          reminder_minutes: 60,
          reminder_methods: ['push'],
          notes: formData.description,
          status: activity.data?.status || 'planned'
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

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities/${activity.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        throw new Error('Update failed');
      }

      toast({
        title: "✅ Başarılı",
        description: "Aktivite güncellendi",
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "❌ Hata",
        description: "Güncelleme başarısız. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Aktiviteyi Düzenle</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktivite Tipi
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ACTIVITY_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({...formData, type: type.id})}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${
                      formData.type === type.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-xl mb-1">{type.icon}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Activity Name */}
          {formData.type === 'custom' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏷️ Özel Aktivite Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customName}
                onChange={(e) => setFormData({...formData, customName: e.target.value})}
                placeholder="Örn: Toplantı Organize Et"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Aktivite başlığı"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Tarih <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏰ Saat
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--:--</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ek bilgiler..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⭐ Öncelik
            </label>
            <div className="flex items-center gap-4">
              {[
                { value: 'high', label: 'Yüksek', icon: '⭐', color: 'text-amber-500' },
                { value: 'normal', label: 'Normal', icon: '○', color: 'text-gray-500' },
                { value: 'low', label: 'Düşük', icon: '↓', color: 'text-gray-400' }
              ].map(p => (
                <label key={p.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="priority-edit"
                    value={p.value}
                    checked={formData.priority === p.value}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`${p.color} font-medium`}>{p.icon}</span>
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Reminder Section */}
          <div className="border-t pt-5">
            {/* Toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>🔔</span> Hatırlatıcı
              </label>
              <button
                type="button"
                onClick={handleReminderToggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  formData.reminderEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 shadow transition-transform ${
                  formData.reminderEnabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
            
            {/* Reminder Settings */}
            {formData.reminderEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                
                {/* When */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ne zaman hatırlatılsın?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIMING_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTimingChange(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                          formData.reminderSettings.timing === option.value
                            ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                        {formData.reminderSettings.timing === option.value && ' ✓'}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom */}
                  {formData.reminderSettings.timing === 'custom' && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-white rounded-lg border">
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        value={formData.reminderSettings.customMinutes || 60}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reminderSettings: {
                            ...prev.reminderSettings,
                            customMinutes: parseInt(e.target.value) || 60
                          }
                        }))}
                        className="w-20 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">dakika önce</span>
                    </div>
                  )}
                </div>
                
                {/* How */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nasıl hatırlatılsın?
                  </label>
                  <div className="space-y-2">
                    {/* System */}
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.reminderSettings.channels.inApp}
                        onChange={(e) => handleChannelChange('inApp', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-lg">🔔</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium block">Sistem Bildirimi</span>
                        <p className="text-xs text-gray-500">Uygulama içi bildirim</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        Ücretsiz
                      </span>
                    </label>
                    
                    {/* Email */}
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.reminderSettings.channels.email}
                        onChange={(e) => handleChannelChange('email', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-lg">📧</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium block">E-posta</span>
                        <p className="text-xs text-gray-500">Kayıtlı e-posta adresinize</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        Ücretsiz
                      </span>
                    </label>
                    
                    {/* SMS */}
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.reminderSettings.channels.sms}
                        onChange={(e) => handleChannelChange('sms', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-lg">📱</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium block">SMS</span>
                        <p className="text-xs text-gray-500">Kayıtlı telefon numaranıza</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                        Ek ücret
                      </span>
                    </label>
                  </div>
                  
                  {/* Warning */}
                  {!hasValidChannels && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">⚠️</span>
                      <p className="text-xs text-red-700">En az bir hatırlatma kanalı seçmelisiniz</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isFormValid() || !hasValidChannels}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⌛</span>
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
