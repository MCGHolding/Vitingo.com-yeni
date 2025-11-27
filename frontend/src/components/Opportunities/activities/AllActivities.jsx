import React, { useMemo } from 'react';

const ACTIVITY_ICONS = {
  email: '📧',
  phone: '📞',
  proposal: '📄',
  design: '🎨',
  custom: '📌'
};

const ACTIVITY_LABELS = {
  email: 'E-posta Gönderimi',
  phone: 'Telefon Araması',
  proposal: 'Teklif Gönderimi',
  design: 'Tasarım Gönderimi'
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return { date: '', time: '' };
  
  const date = new Date(dateStr);
  const dateFormatted = date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  const timeFormatted = dateStr.split('T')[1]?.substring(0, 5) || '';
  
  return { date: dateFormatted, time: timeFormatted };
};

const ActivityListItem = ({ activity, onComplete, onEdit, onDelete }) => {
  const activityType = activity.data?.activity_type || 'custom';
  const isCompleted = activity.data?.status === 'completed' || activity.status === 'completed';
  const { date, time } = formatDateTime(activity.data?.scheduled_datetime);
  const isPast = activity.data?.scheduled_datetime && new Date(activity.data.scheduled_datetime) < new Date();
  
  return (
    <div className={`
      flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0
      ${isCompleted ? 'opacity-60 bg-gray-25' : ''}
      ${isPast && !isCompleted ? 'bg-red-50' : ''}
    `}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {activity.priority === 'high' && <span className="text-amber-500 text-lg">⭐</span>}
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
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${
              isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
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
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            {activity.title}
          </p>
        </div>
      </div>
      
      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-right hidden sm:block">
          <div className={`text-sm font-medium whitespace-nowrap ${
            isPast && !isCompleted ? 'text-red-600' : 'text-gray-700'
          }`}>
            {time}
          </div>
          {isPast && !isCompleted && (
            <span className="text-xs text-red-500 font-medium">Gecikmiş</span>
          )}
        </div>
        
        <span 
          className="text-base sm:text-lg" 
          title={activity.data?.has_reminder ? 'Hatırlatıcı Açık' : 'Hatırlatıcı Kapalı'}
        >
          {activity.data?.has_reminder ? '🔔' : '🔕'}
        </span>
        
        <div className="flex items-center gap-1">
          {!isCompleted && (
            <>
              <button
                onClick={() => onComplete(activity.id)}
                className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Tamamlandı İşaretle"
              >
                <span className="text-base sm:text-lg">✓</span>
              </button>
              <button
                onClick={() => onEdit(activity)}
                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Düzenle"
              >
                <span className="text-sm sm:text-base">✏️</span>
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(activity.id)}
            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sil"
          >
            <span className="text-sm sm:text-base">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AllActivities({
  activities,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  page,
  totalPages,
  onPageChange,
  onComplete,
  onEdit,
  onDelete,
  showCompleted,
  onShowCompletedChange
}) {
  const tabs = [
    { id: 'today', label: 'Bugün' },
    { id: 'thisWeek', label: 'Bu Hafta' },
    { id: 'thisMonth', label: 'Bu Ay' },
    { id: 'future', label: 'Gelecek' },
    { id: 'all', label: 'Tümü' }
  ];
  
  // Tarihe göre grupla
  const groupedActivities = useMemo(() => {
    const groups = {};
    activities.forEach(activity => {
      const { date } = formatDateTime(activity.data?.scheduled_datetime);
      const dateKey = date || 'Tarih Belirtilmemiş';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return groups;
  }, [activities]);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-gray-800">
            📋 Tüm Aktiviteler
          </h3>
        </div>
        
        {/* Tabs + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onPageChange(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Search + Type Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
                placeholder="Ara..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32 sm:w-40"
              />
              <span className="absolute left-2.5 top-2 text-gray-400">🔍</span>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => { onTypeFilterChange(e.target.value); onPageChange(1); }}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="email">📧 E-posta</option>
              <option value="phone">📞 Telefon</option>
              <option value="proposal">📄 Teklif</option>
              <option value="design">🎨 Tasarım</option>
              <option value="custom">📌 Özel</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Grouped List */}
      <div>
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm">Aktivite bulunamadı</p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 sticky top-0 border-b">
                📅 {date}
              </div>
              
              {/* Activities */}
              <div>
                {items.map(activity => (
                  <ActivityListItem
                    key={activity.id}
                    activity={activity}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-center gap-2 bg-gray-50">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded font-medium transition-colors ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          {totalPages > 5 && page < totalPages - 2 && (
            <>
              <span className="text-gray-400">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 border border-gray-300 rounded hover:bg-white transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => onShowCompletedChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Tamamlananları göster
        </label>
      </div>
    </div>
  );
}
