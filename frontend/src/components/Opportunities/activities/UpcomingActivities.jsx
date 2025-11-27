import React from 'react';

const ACTIVITY_ICONS = {
  email: '📧',
  phone: '📞',
  proposal: '📄',
  design: '🎨',
  custom: '📌'
};

const ActivityCompactItem = ({ activity, onComplete, onEdit }) => {
  const activityType = activity.data?.activity_type || 'email';
  const isCompleted = activity.data?.status === 'completed' || activity.status === 'completed';
  const scheduledTime = activity.data?.scheduled_datetime?.split('T')[1]?.substring(0, 5) || '--:--';
  
  return (
    <div className={`
      flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group transition-colors
      ${isCompleted ? 'opacity-50' : ''}
    `}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {activity.priority === 'high' && <span className="text-amber-500">⭐</span>}
        <span className="text-lg">{ACTIVITY_ICONS[activityType]}</span>
        <span className={`text-sm truncate ${
          isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
        }`}>
          {activity.title}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">
          {scheduledTime}
        </span>
        {!isCompleted && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button 
              onClick={() => onComplete(activity.id)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Tamamla"
            >
              ✓
            </button>
            <button 
              onClick={() => onEdit(activity)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Düzenle"
            >
              ✏️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function UpcomingActivities({ today, tomorrow, onComplete, onEdit }) {
  const totalCount = (today?.length || 0) + (tomorrow?.length || 0);
  
  if (totalCount === 0) return null;
  
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h3 className="font-semibold text-orange-800">Yaklaşan Aktiviteler</h3>
        <span className="text-sm text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
          {totalCount}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bugün */}
        <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            BUGÜN ({today?.length || 0})
          </h4>
          
          {(!today || today.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-4">Bugün aktivite yok</p>
          ) : (
            <div className="space-y-2">
              {today.map(activity => (
                <ActivityCompactItem 
                  key={activity.id}
                  activity={activity}
                  onComplete={onComplete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Yarın */}
        <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            YARIN ({tomorrow?.length || 0})
          </h4>
          
          {(!tomorrow || tomorrow.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-4">Yarın aktivite yok</p>
          ) : (
            <div className="space-y-2">
              {tomorrow.map(activity => (
                <ActivityCompactItem 
                  key={activity.id}
                  activity={activity}
                  onComplete={onComplete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
