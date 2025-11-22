import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';

const DUE_TYPE_OPTIONS = [
  { value: 'pesin', label: 'Sözleşme Tarihinde Peşin' },
  { value: 'kurulum', label: 'Kurulum Başlayınca' },
  { value: 'teslim', label: 'Fuar Tesliminde' },
  { value: 'takip', label: 'Teslimi Takip Eden' },
  { value: 'ozel', label: 'Özel' }
];

export default function PaymentTermsBuilder({ paymentTerms, onChange, contractAmount, hideAmounts = false }) {
  const handleAddTerm = () => {
    const newTerm = {
      id: Date.now().toString(),
      percentage: 10,
      amount: (contractAmount * 10) / 100,
      dueType: 'pesin',
      dueDays: null,
      notes: ''
    };
    console.log('PaymentTermsBuilder - Adding term:', newTerm);
    console.log('PaymentTermsBuilder - Current terms:', paymentTerms);
    console.log('PaymentTermsBuilder - New terms:', [...paymentTerms, newTerm]);
    onChange([...paymentTerms, newTerm]);
  };

  const handleRemoveTerm = (termId) => {
    onChange(paymentTerms.filter(term => term.id !== termId));
  };

  const handleTermChange = (termId, field, value) => {
    const updatedTerms = paymentTerms.map(term => {
      if (term.id === termId) {
        const updated = { ...term, [field]: value };
        
        // If percentage changes, recalculate amount
        if (field === 'percentage') {
          updated.amount = (contractAmount * value) / 100;
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
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Ödeme Ekle</span>
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
