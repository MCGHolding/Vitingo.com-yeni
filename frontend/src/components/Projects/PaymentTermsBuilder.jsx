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

export default function PaymentTermsBuilder({ 
  paymentTerms, 
  onChange, 
  contractAmount, 
  hideAmounts = false, 
  fairStartDate = '', 
  kurulumStartDate = '', 
  contractDate = '',
  sourceType = 'project', // 'project' or 'invoice'
  invoiceDate = ''
}) {
  
  // ============ VADE SEÇENEKLERİ ============
  
  // Fatura için gün bazlı vade seçenekleri
  const invoiceDueOptions = [
    { value: 'immediate', label: 'Peşin (Fatura Kesim Tarihi)', days: 0 },
    { value: '7', label: '7 Gün', days: 7 },
    { value: '15', label: '15 Gün', days: 15 },
    { value: '30', label: '30 Gün', days: 30 },
    { value: '45', label: '45 Gün', days: 45 },
    { value: '60', label: '60 Gün', days: 60 },
    { value: '90', label: '90 Gün', days: 90 },
    { value: '120', label: '120 Gün', days: 120 },
    { value: 'custom', label: 'Özel (Gün Girin)', days: null }
  ];

  // Proje için olay bazlı vade seçenekleri
  const projectDueOptions = [
    { value: 'pesin', label: 'Sözleşme Tarihinde Peşin' },
    { value: 'kurulum', label: 'Kurulum Başlayınca' },
    { value: 'teslim', label: 'Teslimde' },
    { value: 'takip', label: 'Teslimi Takip Eden' },
    { value: 'ozel', label: 'Özel Tarih' }
  ];
  
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
  
  // Fatura için vade tarihi hesaplama (fatura tarihine göre)
  const calculateInvoiceDueDate = (days) => {
    const baseDate = new Date(invoiceDate || new Date());
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split('T')[0];
  };

  // Tarih formatlama
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Calculate due date based on type (Proje için)
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
      dueType: sourceType === 'invoice' ? '30' : 'pesin',
      dueDays: sourceType === 'invoice' ? 30 : null,
      dueDate: sourceType === 'invoice' ? calculateInvoiceDueDate(30) : '',
      customDays: '',
      notes: ''
    };
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
          } else {
            updated.percentage = value;
          }
          // Tutarı yeniden hesapla
          updated.amount = (contractAmount * updated.percentage) / 100;
          console.log(`💰 Percentage changed to ${updated.percentage}%, amount: ${updated.amount}`);
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
                {/* Percentage - Dynamic Options */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Yüzde (%)
                    <span className="ml-2 text-blue-600 font-medium">
                      Max: %{getMaxPercentageForTerm(term.id)}
                    </span>
                  </label>
                  <Select
                    value={term.percentage.toString()}
                    onValueChange={(value) => handleTermChange(term.id, 'percentage', parseInt(value))}
                  >
                    <SelectTrigger className={term.percentage ? 'border-gray-300' : 'border-orange-300 bg-orange-50'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getPercentageOptions(term.id, term.percentage).map(percent => (
                        <SelectItem key={percent} value={percent.toString()}>
                          %{percent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount - Only show if not hidden */}
                {!hideAmounts && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Tutar</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800">
                      {term.amount?.toLocaleString('tr-TR', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      }) || '0,00'}
                    </div>
                  </div>
                )}

                {/* Due Type - Koşullu: Fatura için gün bazlı, Proje için olay bazlı */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Vade</label>
                  <Select
                    value={term.dueType || ''}
                    onValueChange={(value) => {
                      // Fatura modunda sayısal değer veya özel ise
                      if (sourceType === 'invoice') {
                        const updated = { ...term, dueType: value };
                        
                        if (value === 'immediate') {
                          updated.dueDays = 0;
                          updated.dueDate = invoiceDate || new Date().toISOString().split('T')[0];
                        } else if (value === 'custom') {
                          updated.dueDays = term.customDays || 0;
                          updated.dueDate = calculateInvoiceDueDate(updated.dueDays);
                        } else if (!isNaN(parseInt(value))) {
                          updated.dueDays = parseInt(value);
                          updated.dueDate = calculateInvoiceDueDate(parseInt(value));
                        }
                        
                        handleTermChange(term.id, 'dueType', value);
                        if (updated.dueDays !== undefined) {
                          handleTermChange(term.id, 'dueDays', updated.dueDays);
                        }
                        if (updated.dueDate) {
                          handleTermChange(term.id, 'dueDate', updated.dueDate);
                        }
                      } else {
                        handleTermChange(term.id, 'dueType', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceType === 'invoice' 
                        ? invoiceDueOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        : projectDueOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Days - Koşullu render */}
              {sourceType === 'invoice' ? (
                /* FATURA MODU: Custom gün girişi */
                term.dueType === 'custom' && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Gün Sayısı</label>
                    <Input
                      type="text"
                      placeholder="Gün sayısı girin"
                      value={term.customDays || ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        const days = parseInt(numericValue) || 0;
                        handleTermChange(term.id, 'customDays', numericValue);
                        handleTermChange(term.id, 'dueDays', days);
                        handleTermChange(term.id, 'dueDate', calculateInvoiceDueDate(days));
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={3}
                      className="w-full"
                    />
                  </div>
                )
              ) : (
                /* PROJE MODU: takip ve ozel için gün girişi */
                (term.dueType === 'takip' || term.dueType === 'ozel') && (
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
                )
              )}

              {/* Calculated Due Date Display */}
              {term.dueType && (
                <div className="col-span-full mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center text-xs text-blue-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="font-medium">Vade: </span>
                    <span className="ml-1">
                      {sourceType === 'invoice' ? (
                        /* FATURA için vade gösterimi */
                        <>
                          {term.dueType === 'immediate' && `${formatDate(invoiceDate || new Date())} (Peşin)`}
                          {term.dueType === 'custom' && `${formatDate(term.dueDate)} (${term.customDays || 0} gün sonra)`}
                          {!isNaN(parseInt(term.dueType)) && `${formatDate(term.dueDate)} (${term.dueType} gün sonra)`}
                        </>
                      ) : (
                        /* PROJE için vade gösterimi */
                        calculateDueDate(term)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Summary - Enhanced with Smart Indicators */}
          <div className={`border-t pt-3 mt-4 rounded-lg p-4 ${
            totalPercentage === 100 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Toplam:</span>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    totalPercentage === 100 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    %{totalPercentage.toFixed(0)}
                  </span>
                  
                  {totalPercentage !== 100 && (
                    <p className="text-xs text-red-500 mt-1">
                      {totalPercentage < 100 
                        ? `%${(100 - totalPercentage).toFixed(0)} daha eklenmeli`
                        : `%${(totalPercentage - 100).toFixed(0)} fazla!`
                      }
                    </p>
                  )}
                  
                  {totalPercentage === 100 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Ödeme planı tamamlandı
                    </p>
                  )}
                </div>
                
                {!hideAmounts && (
                  <span className="font-semibold text-gray-900">
                    {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
