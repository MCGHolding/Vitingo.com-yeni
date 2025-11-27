import React, { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';

const ACTIVITY_TYPES = [
  { id: 'email', icon: '📧', label: 'E-posta' },
  { id: 'phone', icon: '📞', label: 'Telefon' },
  { id: 'proposal', icon: '📄', label: 'Teklif' },
  { id: 'design', icon: '🎨', label: 'Tasarım' },
  { id: 'custom', icon: '➕', label: 'Özel' }
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
    reminder: activity.data?.has_reminder || false
  });
  
  const [saving, setSaving] = useState(false);

  const isFormValid = () => {
    if (!formData.title || !formData.date) return false;
    if (formData.type === 'custom' && !formData.customName) return false;
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

    setSaving(true);
    try {
      const updateData = {
        type: 'activity_planner',
        title: formData.title,
        description: formData.description || '',
        data: {
          activity_type: formData.type,
          custom_activity_name: formData.type === 'custom' ? formData.customName : null,
          scheduled_datetime: `${formData.date}T${formData.time || '09:00'}:00`,
          has_reminder: formData.reminder,
          reminder_minutes: 60,
          reminder_methods: ['push'],
          notes: formData.description,
          status: activity.data?.status || 'planned'
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
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Aktiviteyi Düzenle</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
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
                    ${formData.type === type.id 
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
                className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white"
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
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏰ Saat
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            />
          </div>

          {/* Reminder */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.reminder}
              onChange={(e) => setFormData({...formData, reminder: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">🔔 Hatırlatıcı aktif</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid() || saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
