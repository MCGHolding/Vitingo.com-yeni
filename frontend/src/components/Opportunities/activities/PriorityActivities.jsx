import React from 'react';

const ACTIVITY_ICONS = {
  email: '📧',
  phone: '📞',
  proposal: '📄',
  design: '🎨',
  custom: '📌'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

export default function PriorityActivities({ activities, onComplete, onEdit, onViewAll }) {
  if (!activities || activities.length === 0) return null;
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h3 className="font-semibold text-amber-800">Öncelikli Aktiviteler</h3>
          <span className="text-sm text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
            {activities.length}
          </span>
        </div>
        {activities.length > 5 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
          >
            Tümünü Gör →
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-amber-100 divide-y divide-amber-50 shadow-sm">
        {activities.slice(0, 5).map(activity => {
          const activityType = activity.data?.activity_type || 'email';
          const isCompleted = activity.data?.status === 'completed' || activity.status === 'completed';
          
          return (
            <div 
              key={activity.id}
              className={`flex items-center justify-between p-3 hover:bg-amber-25 transition-colors ${
                isCompleted ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-amber-500 text-lg">⭐</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg">
                  {ACTIVITY_ICONS[activityType]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}>
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  📅 {formatDate(activity.data?.scheduled_datetime)}
                </span>
                {!isCompleted && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onComplete(activity.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Tamamla"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => onEdit(activity)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Düzenle"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
