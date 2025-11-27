import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';

const ACTIVITY_ICONS = {
  email: '📧',
  phone: '📞',
  proposal: '📄',
  design: '🎨',
  custom: '📌'
};

const ACTIVITY_COLORS = {
  email: 'blue',
  phone: 'green',
  proposal: 'purple',
  design: 'orange',
  custom: 'gray'
};

const ACTIVITY_LABELS = {
  email: 'E-posta Gönderimi',
  phone: 'Telefon Araması',
  proposal: 'Teklif Gönderimi',
  design: 'Tasarım Gönderimi'
};

export default function ActivityList({ opportunityId, refreshTrigger, onEdit }) {
  const { toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [opportunityId, filter, showCompleted, refreshTrigger]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      
      // Filter by status
      let filtered = data;
      if (!showCompleted) {
        filtered = data.filter(a => a.data?.status !== 'completed');
      }
      
      // Filter by type
      if (filter !== 'all') {
        filtered = filtered.filter(a => a.data?.activity_type === filter);
      }

      setActivities(filtered);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Hata",
        description: "Aktiviteler yüklenemedi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);

    let dateLabel;
    if (activityDate.getTime() === today.getTime()) {
      dateLabel = 'Bugün';
    } else if (activityDate.getTime() === tomorrow.getTime()) {
      dateLabel = 'Yarın';
    } else {
      dateLabel = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }

    // Get time from datetime
    const time = dateStr.split('T')[1]?.substring(0, 5);
    return time ? `${dateLabel}, ${time}` : dateLabel;
  };

  const isPast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const handleDelete = async (activityId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities/${activityId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Delete failed');

      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast({
        title: "✅ Başarılı",
        description: "Aktivite silindi",
      });
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "❌ Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (activityId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/opportunities/${opportunityId}/activities/${activityId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'completed' })
        }
      );

      if (!response.ok) throw new Error('Update failed');

      fetchActivities();
      toast({
        title: "✅ Başarılı",
        description: "Aktivite tamamlandı",
      });
    } catch (error) {
      console.error('Complete error:', error);
      toast({
        title: "❌ Hata",
        description: "İşlem başarısız",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          📋 <span className="hidden sm:inline">Planlanan</span> Aktiviteler
          <span className="text-sm font-normal text-gray-500">
            ({activities.length})
          </span>
        </h3>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tümü</option>
            <option value="email">E-posta</option>
            <option value="phone">Telefon</option>
            <option value="proposal">Teklif</option>
            <option value="design">Tasarım</option>
            <option value="custom">Özel</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="text-center py-10 sm:py-12 text-gray-500">
            <span className="text-3xl sm:text-4xl block mb-2">📭</span>
            <p className="text-sm">Planlanmış aktivite yok</p>
          </div>
        ) : (
          activities.map(activity => {
            const activityType = activity.data?.activity_type || 'custom';
            const isCompleted = activity.data?.status === 'completed';
            const isPastDue = isPast(activity.data?.scheduled_datetime) && !isCompleted;

            return (
              <div
                key={activity.id}
                className={`
                  flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors
                  ${isCompleted ? 'opacity-60' : ''}
                  ${isPastDue ? 'bg-red-50' : ''}
                `}
              >
                {/* Left - Icon and Info */}
                <div className="flex items-center gap-3">
                  {/* Type Icon */}
                  <div className={`
                    w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl
                    ${activityType === 'email' ? 'bg-blue-100' : ''}
                    ${activityType === 'phone' ? 'bg-green-100' : ''}
                    ${activityType === 'proposal' ? 'bg-purple-100' : ''}
                    ${activityType === 'design' ? 'bg-orange-100' : ''}
                    ${activityType === 'custom' ? 'bg-gray-100' : ''}
                  `}>
                    {ACTIVITY_ICONS[activityType]}
                  </div>

                  {/* Title and Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isCompleted ? 'line-through text-gray-500' : ''
                      }`}>
                        {activityType === 'custom' && activity.data?.custom_activity_name
                          ? activity.data.custom_activity_name
                          : ACTIVITY_LABELS[activityType] || 'Aktivite'
                        }
                      </span>
                      {isCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          ✓ Tamamlandı
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {activity.title}
                    </p>
                  </div>
                </div>

                {/* Right - Date and Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Date */}
                  <div className="text-right hidden sm:block">
                    <div className={`text-sm font-medium ${
                      isPastDue ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      📅 {formatDate(activity.data?.scheduled_datetime)}
                    </div>
                    {isPastDue && (
                      <span className="text-xs text-red-500 font-medium">Gecikmiş</span>
                    )}
                  </div>

                  {/* Reminder Icon */}
                  <span 
                    className="text-base sm:text-lg" 
                    title={activity.data?.has_reminder ? 'Hatırlatıcı Açık' : 'Hatırlatıcı Kapalı'}
                  >
                    {activity.data?.has_reminder ? '🔔' : '🔕'}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <>
                        {/* Complete */}
                        <button
                          onClick={() => handleComplete(activity.id)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Tamamlandı İşaretle"
                        >
                          <span className="text-base sm:text-lg">✓</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEdit(activity)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <span className="text-sm sm:text-base">✏️</span>
                        </button>
                      </>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirm(activity.id)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <span className="text-sm sm:text-base">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs sm:text-sm text-gray-600">Tamamlananları göster</span>
        </label>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h4 className="text-lg font-semibold mb-2">Aktiviteyi Sil</h4>
            <p className="text-gray-600 mb-6">
              Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
