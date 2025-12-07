import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { X, Package, DollarSign, Tag } from 'lucide-react';
import apiClient from '../../utils/apiClient';

export default function AddProductModal({ onClose, onProductAdded }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    category: 'services',
    unit: 'adet',
    default_price: '',
    currency: 'TRY'
  });

  const categories = [
    { value: 'fair_services', label: 'Fuar Hizmetleri' },
    { value: 'equipment_rental', label: 'Ekipman Kiralama' },
    { value: 'utilities', label: 'Altyapı Hizmetleri' },
    { value: 'services', label: 'Genel Hizmetler' },
    { value: 'transportation', label: 'Ulaşım & Transfer' },
    { value: 'accommodation', label: 'Konaklama' },
    { value: 'events', label: 'Etkinlik & Organizasyon' },
    { value: 'other', label: 'Diğer' }
  ];

  const units = [
    { value: 'adet', label: 'Adet' },
    { value: 'saat', label: 'Saat' },
    { value: 'gün', label: 'Gün' },
    { value: 'gece', label: 'Gece' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'm2', label: 'Metrekare' },
    { value: 'm3', label: 'Metreküp' },
    { value: 'lt', label: 'Litre' },
    { value: 'kwh', label: 'kWh' },
    { value: 'piece', label: 'Piece' },
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'night', label: 'Night' }
  ];

  const currencies = [
    { value: 'TRY', label: 'TRY (₺)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Hata",
        description: "Ürün adı zorunludur.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const productData = {
        ...formData,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        is_active: true
      };

      const response = await fetch(`${backendUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Ürün Eklendi",
          description: `${formData.name} başarıyla ürün veritabanına eklendi.`
        });

        if (onProductAdded) {
          onProductAdded(result.product);
        }

        onClose();
      } else {
        throw new Error(result.detail || 'Ürün eklenirken hata oluştu');
      }

    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Hata",
        description: error.message || "Ürün eklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span>Yeni Ürün/Hizmet Ekle</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-white hover:bg-green-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ürün/Hizmet Adı (Türkçe) *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="örn: Yurtdışı Fuar Stand Kiralama Hizmeti"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ürün/Hizmet Adı (İngilizce)
                </label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => handleInputChange('name_en', e.target.value)}
                  placeholder="e.g: International Fair Stand Rental Service"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Category and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <span>Kategori</span>
                </label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Birim
                </label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Birim seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Varsayılan Fiyat</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.default_price}
                  onChange={(e) => handleInputChange('default_price', e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Para Birimi
                </label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 İpuçları</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Türkçe isim zorunlu, İngilizce isim opsiyonel</li>
                <li>• Varsayılan fiyat boş bırakılabilir, faturada manuel girilir</li>
                <li>• Kategori seçimi raporlama ve filtreleme için önemli</li>
                <li>• Eklenen ürünler tüm fatura formlarında kullanılabilir</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Ürünü Ekle
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}