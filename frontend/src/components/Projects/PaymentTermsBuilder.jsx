import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Calendar } from 'lucide-react';

const DUE_TYPE_OPTIONS = [
  { value: 'pesin', label: 'Sözleşme Tarihinde Peşin' },
  { value: 'kurulum', label: 'Kurulum Başlayınca' },
  { value: 'teslim', label: 'Fuar Tesliminde' },
  { value: 'takip', label: 'Teslimi Takip Eden' },
  { value: 'ozel', label: 'Özel' }
];

export default function PaymentTermsBuilder({ paymentTerms, onChange, contractAmount, hideAmounts = false, fairStartDate = '', kurulumStartDate = '', contractDate = '' }) {
  
  // ============ HELPER FUNCTIONS FOR DYNAMIC PERCENTAGE ============
  
  // Toplam kullanılan yüzdeyi hesapla
  const getTotalUsedPercentage = () => {
    return paymentTerms.reduce((sum, term) => sum + (term.percentage || 0), 0);
  };

  // Kalan yüzdeyi hesapla
  const getRemainingPercentage = () => {
    return 100 - getTotalUsedPercentage();
  };

  // Belirli bir satır HARİÇ toplam yüzde (o satırın kendi değerini dahil etmemek için)
  const getUsedPercentageExcluding = (excludeId) => {
    return paymentTerms
      .filter(term => term.id !== excludeId)
      .reduce((sum, term) => sum + (term.percentage || 0), 0);
  };

  // Bir satır için mümkün olan maksimum yüzde
  const getMaxPercentageForTerm = (termId) => {
    const usedByOthers = getUsedPercentageExcluding(termId);
    return 100 - usedByOthers;
  };

  // Dropdown seçeneklerini oluştur (5'er artışla)
  const getPercentageOptions = (termId, currentValue) => {
    const maxAllowed = getMaxPercentageForTerm(termId);
    const options = [];
    
    // 5'er artışla seçenekler (5, 10, 15, ... maxAllowed'a kadar)
    for (let i = 5; i <= maxAllowed; i += 5) {
      options.push(i);
    }
    
    // Eğer maxAllowed 5'in katı değilse, maxAllowed'ı da ekle
    if (maxAllowed % 5 !== 0 && maxAllowed > 0) {
      options.push(maxAllowed);
    }
    
    // Mevcut değer listede yoksa ekle (düzenleme durumu için)
    if (currentValue && !options.includes(currentValue) && currentValue <= maxAllowed) {
      options.push(currentValue);
      options.sort((a, b) => a - b);
    }
    
    return options;
  };
  
  // ============ END HELPER FUNCTIONS ============
  
  // Calculate due date based on type
  const calculateDueDate = (term) => {
    if (!term.dueType) return null;
    
    let baseDate = null;
    
    switch(term.dueType) {
      case 'pesin':
        if (contractDate) {
          baseDate = new Date(contractDate);
          return `${baseDate.toLocaleDateString('tr-TR')} (Sözleşme tarihi)`;
        }
        return 'Sözleşme tarihi girilmeli';
      case 'kurulum':
        if (kurulumStartDate) {
          baseDate = new Date(kurulumStartDate);
          return `${baseDate.toLocaleDateString('tr-TR')} (Kurulum başlangıcı)`;
        }
        return 'Kurulum başlangıcı girilmeli';
      case 'teslim':
        if (fairStartDate) {
          baseDate = new Date(fairStartDate);
          return `${baseDate.toLocaleDateString('tr-TR')} (Fuar ilk günü)`;
        }
        return 'Fuar tarihi girilmeli';
      case 'takip':
        if (fairStartDate && term.dueDays) {
          baseDate = new Date(fairStartDate);
          baseDate.setDate(baseDate.getDate() + parseInt(term.dueDays));
          return `${baseDate.toLocaleDateString('tr-TR')} (Fuar + ${term.dueDays} gün)`;
        }
        return 'Gün sayısı girilmeli';
      case 'ozel':
        if (contractDate && term.dueDays) {
          baseDate = new Date(contractDate);
          baseDate.setDate(baseDate.getDate() + parseInt(term.dueDays));
          return `${baseDate.toLocaleDateString('tr-TR')} (Sözleşme + ${term.dueDays} gün)`;
        }
        return 'Sözleşme tarihi ve gün sayısı girilmeli';
      default:
        return null;
    }
  };
  
  const handleAddTerm = () => {
    const remaining = getRemainingPercentage();
    
    // Kalan yoksa ekleme yapma
    if (remaining <= 0) {
      return;
    }
    
    // Kalan oranı otomatik ata
    const newTerm = {
      id: Date.now().toString(),
      percentage: remaining,
      amount: (contractAmount * remaining) / 100,
      dueType: 'pesin',
      dueDays: null,
      notes: ''
    };
    console.log('PaymentTermsBuilder - Adding term with remaining:', remaining);
    console.log('PaymentTermsBuilder - New term:', newTerm);
    onChange([...paymentTerms, newTerm]);
  };

  const handleRemoveTerm = (termId) => {
    // En az 1 ödeme kalmalı
    if (paymentTerms.length <= 1) {
      return;
    }
    onChange(paymentTerms.filter(term => term.id !== termId));
  };

  const handleTermChange = (termId, field, value) => {
    const updatedTerms = paymentTerms.map(term => {
      if (term.id === termId) {
        const updated = { ...term, [field]: value };
        
        // If percentage changes, recalculate amount
        if (field === 'percentage') {
          // Maksimum kontrolü
          const maxAllowed = getMaxPercentageForTerm(termId);
          if (value > maxAllowed) {
            updated.percentage = maxAllowed;
          }
          updated.amount = (contractAmount * updated.percentage) / 100;
        }
        
        // If amount changes manually, recalculate percentage
        if (field === 'amount') {
          updated.percentage = contractAmount > 0 ? (value / contractAmount) * 100 : 0;
        }
        
        return updated;
      }
      return term;
    });
    onChange(updatedTerms);
  };

  const totalPercentage = paymentTerms.reduce((sum, term) => sum + (term.percentage || 0), 0);
  const totalAmount = paymentTerms.reduce((sum, term) => sum + (term.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Ödeme Koşulları
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTerm}
          disabled={getRemainingPercentage() <= 0}
          className={`flex items-center space-x-1 ${
            getRemainingPercentage() <= 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-100'
          }`}
          title={getRemainingPercentage() <= 0 ? 'Toplam %100\'e ulaşıldı' : `Kalan: %${getRemainingPercentage()}`}
        >
          <Plus className="h-4 w-4" />
          <span>Ödeme Ekle</span>
          {getRemainingPercentage() > 0 && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              %{getRemainingPercentage()}
            </span>
          )}
        </Button>
      </div>

      {paymentTerms.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 text-sm">Henüz ödeme koşulu eklenmedi</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddTerm}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            İlk Ödemeyi Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentTerms.map((term, index) => (
            <div key={term.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {index + 1}. Ödeme
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTerm(term.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className={`grid grid-cols-1 gap-3 ${hideAmounts ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {/* Percentage */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Yüzde (%)</label>
                  <Select
                    value={term.percentage.toString()}
                    onValueChange={(value) => handleTermChange(term.id, 'percentage', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(20)].map((_, i) => {
                        const percent = (i + 1) * 5;
                        return (
                          <SelectItem key={percent} value={percent.toString()}>
                            %{percent}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount - Only show if not hidden */}
                {!hideAmounts && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Tutar</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={term.amount}
                      onChange={(e) => handleTermChange(term.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Due Type */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Vade</label>
                  <Select
                    value={term.dueType}
                    onValueChange={(value) => handleTermChange(term.id, 'dueType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DUE_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Days (for takip and ozel) */}
              {(term.dueType === 'takip' || term.dueType === 'ozel') && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Gün Sayısı</label>
                  <Input
                    type="number"
                    placeholder="Örn: 30"
                    value={term.dueDays || ''}
                    onChange={(e) => handleTermChange(term.id, 'dueDays', parseInt(e.target.value) || null)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Calculated Due Date Display */}
              {term.dueType && (
                <div className="col-span-full mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center text-xs text-blue-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="font-medium">Vade: </span>
                    <span className="ml-1">{calculateDueDate(term)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          <div className="border-t pt-3 mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Toplam:</span>
              <div className="flex space-x-4">
                <span className={`font-semibold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  %{totalPercentage.toFixed(0)}
                </span>
                {!hideAmounts && (
                  <span className="font-semibold text-gray-900">
                    {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-xs text-red-600 mt-1 text-right">
                Ödeme koşullarının toplamı %100 olmalıdır
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
