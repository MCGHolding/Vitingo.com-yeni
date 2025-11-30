import React from 'react';

const AutoMatchBadge = ({ 
  pattern, 
  confidence, 
  matchCount = 0, 
  confirmCount = 0,
  isAutoMatched = false,
  onConfirm, 
  onReject, 
  onEdit 
}) => {
  // Güven seviyesine göre renk ve mesaj
  const getConfidenceStyle = () => {
    if (confidence >= 0.9) {
      return {
        containerClass: 'bg-green-50 border-green-200',
        textClass: 'text-green-800',
        badgeClass: 'bg-green-100 text-green-700',
        icon: '🤖',
        label: 'Otomatik eşleştirildi'
      };
    } else if (confidence >= 0.7) {
      return {
        containerClass: 'bg-yellow-50 border-yellow-200',
        textClass: 'text-yellow-800',
        badgeClass: 'bg-yellow-100 text-yellow-700',
        icon: '💡',
        label: 'Öneri'
      };
    }
    return {
      containerClass: 'bg-gray-50 border-gray-200',
      textClass: 'text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-600',
      icon: '❓',
      label: 'Düşük güven'
    };
  };
  
  const style = getConfidenceStyle();
  const confidencePercent = Math.round((confidence || 0) * 100);
  
  return (
    <div className={`mt-2 p-3 rounded-lg border ${style.containerClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1">
            <div className={`text-sm font-medium ${style.textClass}`}>
              {style.label}
            </div>
            <div className={`text-xs ${style.textClass} opacity-75 mt-0.5`}>
              {pattern && <span>Pattern: "{pattern}" • </span>}
              Güven: %{confidencePercent}
              {matchCount > 0 && confirmCount > 0 && (
                <span> • {confirmCount}/{matchCount} onay</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAutoMatched ? (
            <>
              <button
                onClick={onConfirm}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                title="Pattern'i onayla"
              >
                ✓ Onayla
              </button>
              <button
                onClick={onEdit}
                className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                title="Düzenle"
              >
                ✏️ Düzelt
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                title="Pattern'i reddet"
              >
                ❌ Reddet
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onConfirm}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
              >
                ✓ Uygula
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                ✕ Kapat
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoMatchBadge;
