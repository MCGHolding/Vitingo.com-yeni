import React, { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';

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
    reminder: true,
    customName: ''
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
      const activityData = {
        type: 'activity_planner',
        title: formData.title,
        description: formData.description || '',
        data: {
          activity_type: selectedType,
          custom_activity_name: selectedType === 'custom' ? formData.customName : null,
          scheduled_datetime: `${formData.date}T${formData.time || '09:00'}:00`,
          has_reminder: formData.reminder,
          reminder_minutes: 60,
          reminder_methods: ['push'],
          notes: formData.description,
          status: 'planned'
        }
      };

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
        description: `${formData.title} başarıyla planlandı`,
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Aktivite Tipi Grid */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Aktivite Tipi
        </label>
        <div className="grid grid-cols-5 gap-3">
          {ACTIVITY_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                ${selectedType === type.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-2xl mb-1">{type.icon}</span>
              <span className="text-xs font-medium text-gray-700">{type.label}</span>
              {selectedType === type.id && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Özel Aktivite Adı (conditional) */}
      {selectedType === 'custom' && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ Özel Aktivite Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.customName}
            onChange={(e) => setFormData({...formData, customName: e.target.value})}
            placeholder="Örn: Toplantı Organize Et, Demo Hazırla"
            className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        {/* Row 1: Başlık + Tarih/Saat */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          {/* Başlık - 3 columns */}
          <div className="col-span-3">
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

          {/* Tarih - 1 column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Saat - 1 column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ⏰ Saat
            </label>
            <select
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">--:--</option>
              {generateTimeOptions().map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Açıklama - Full Width */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Ek bilgiler..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Row 3: Quick Date + Reminder Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Quick Date Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">⚡</span>
            {QUICK_DATE_OPTIONS.map(option => (
              <button
                key={option.days}
                type="button"
                onClick={() => setQuickDate(option.days)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  isQuickDateSelected(option.days)
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Reminder Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600">🔔 Hatırlat</span>
            <div 
              onClick={() => setFormData({...formData, reminder: !formData.reminder})}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                formData.reminder ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 shadow-sm transition-transform ${
                formData.reminder ? 'right-0.5' : 'left-0.5'
              }`} />
            </div>
          </label>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <span>Kaydediliyor...</span>
          ) : (
            <>
              <span>📋</span>
              <span>Planla</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
