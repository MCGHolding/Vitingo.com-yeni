import React from 'react';
import { CheckCircle, Zap, X } from 'lucide-react';

const AutoMatchNotificationModal = ({ 
  isOpen, 
  onClose, 
  autoMatchedCount,
  suggestedCount,
  transactions = []
}) => {
  if (!isOpen) return null;
  
  // Group by pattern type
  const byType = transactions.reduce((acc, txn) => {
    const type = txn.type || 'unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, avgConfidence: 0, items: [] };
    }
    acc[type].count++;
    acc[type].avgConfidence += (txn.confidence || 0);
    acc[type].items.push(txn);
    return acc;
  }, {});
  
  // Calculate average confidence
  Object.keys(byType).forEach(type => {
    byType[type].avgConfidence = byType[type].avgConfidence / byType[type].count;
  });
  
  const typeLabels = {
    'payment': '💳 Ödeme',
    'collection': '💰 Tahsilat',
    'fx_buy': '💱 Döviz Alım',
    'fx_sell': '💱 Döviz Satım',
    'cashback': '🎁 Cashback',
    'refund': '↩️ İade',
    'unknown': '❓ Diğer'
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Akıllı Eşleştirme Tamamlandı!</h3>
          </div>
          
          <p className="text-purple-100 text-sm">
            AI pattern matching ile işlemler otomatik kategorize edildi
          </p>
        </div>
        
        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{autoMatchedCount}</span>
              </div>
              <p className="text-xs text-green-600 font-medium">Otomatik Eşleşti</p>
            </div>
            
            {suggestedCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">💡</span>
                  <span className="text-2xl font-bold text-yellow-700">{suggestedCount}</span>
                </div>
                <p className="text-xs text-yellow-600 font-medium">Öneri Var</p>
              </div>
            )}
          </div>
          
          {/* Breakdown by Type */}
          {Object.keys(byType).length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 font-semibold mb-3 uppercase">Eşleştirme Detayları:</p>
              <div className="space-y-2">
                {Object.entries(byType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {typeLabels[type] || type}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900 font-semibold">{data.count} işlem</span>
                      <span className="text-xs text-gray-500">
                        %{Math.round(data.avgConfidence * 100)} güven
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">🎯 Öğrenilen Pattern'lar Kullanıldı</p>
            <p className="text-xs text-blue-600">
              Geçmiş kategorileştirmeleriniz sayesinde bu işlemler otomatik olarak tanındı.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Tamam, Devam Et
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AutoMatchNotificationModal;
