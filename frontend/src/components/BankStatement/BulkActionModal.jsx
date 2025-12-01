import React from 'react';

const BulkActionModal = ({ 
  isOpen, 
  onClose, 
  bulkAction, 
  onApply, 
  onApplyAndLearn 
}) => {
  if (!isOpen || !bulkAction) return null;
  
  const { field, value, similarTxns, normalizedDesc, sourceTxn, filledFields } = bulkAction;
  
  // Get display values for multiple fields
  const getFieldsDisplay = () => {
    const typeLabels = {
      'payment': 'Ödeme',
      'collection': 'Tahsilat',
      'fx_buy': 'Döviz Alım',
      'fx_sell': 'Döviz Satım',
      'cashback': 'Cashback',
      'refund': 'İade',
      'transfer': 'Transfer',
      'lending': 'Lending'
    };
    
    // If filledFields exists (from manual bulk action), show all fields
    if (filledFields) {
      const displays = [];
      if (filledFields.type) displays.push(`Tür: ${typeLabels[filledFields.type] || filledFields.type}`);
      if (filledFields.categoryId) displays.push('Kategori');
      if (filledFields.subCategoryId) displays.push('Alt Kategori');
      if (filledFields.customerId) displays.push('Müşteri');
      if (filledFields.currencyPair) displays.push(`Döviz Çifti: ${filledFields.currencyPair}`);
      return displays;
    }
    
    // Old behavior: single field
    switch(field) {
      case 'type':
        return [`Tür: ${typeLabels[value] || value}`];
      case 'categoryId':
        return ['Kategori seçildi'];
      case 'customerId':
        return ['Müşteri seçildi'];
      case 'currencyPair':
        return [`Döviz Çifti: ${value}`];
      default:
        return [field];
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>🤖</span> Akıllı Toplu İşlem
          </h3>
        </div>
        
        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-gray-700">
            "<span className="font-medium">{normalizedDesc.slice(0, 50)}{normalizedDesc.length > 50 ? '...' : ''}</span>" 
            {' '}açıklamalı <span className="font-bold text-blue-600">{similarTxns.length}</span> işlem daha var.
          </p>
          
          <p className="text-gray-600 text-sm">
            Aynı ayarları hepsine uygulansın mı?
          </p>
          
          {/* Applied Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-600 mb-2 font-medium">Uygulanacak:</div>
            <div className="space-y-1">
              {getFieldsDisplay().map((display, idx) => (
                <div key={idx} className="text-sm text-gray-800">• {display}</div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <span className="font-medium">💡 İpucu:</span> "Uygula+Öğren" seçeneği ile gelecek PDF'lerde bu pattern otomatik uygulanır.
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => onApply(false)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ✅ Evet, Uygula
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            🚫 Hayır
          </button>
          <button
            onClick={() => onApplyAndLearn()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            🧠 Uygula+Öğren
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;
