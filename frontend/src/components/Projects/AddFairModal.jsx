import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Check } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function AddFairModal({ isOpen, onClose, onFairAdded }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [allCountries, setAllCountries] = useState([]); // Store all countries data for city filtering
  
  const [formData, setFormData] = useState({
    name: '',
    defaultCity: '',
    defaultCountry: '',
    defaultStartDate: '',
    defaultEndDate: '',
    description: ''
  });

  // Load countries from Library API on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                          process.env.REACT_APP_BACKEND_URL || 
                          import.meta.env.REACT_APP_BACKEND_URL;

        const response = await fetch(`${backendUrl}/api/library/countries`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Extract country names and sort them
          const countryNames = data
            .map(doc => doc.name)
            .filter(name => name) // Remove empty names
            .sort();
          setCountries(countryNames);
          
          // Store all countries data for city filtering
          setAllCountries(data);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        toast({
          title: "Uyarı",
          description: "Ülkeler yüklenemedi. Lütfen sayfayı yenileyin.",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      loadCountries();
    }
  }, [isOpen, toast]);

  // Filter cities when country changes
  useEffect(() => {
    if (formData.defaultCountry && allCountries.length > 0) {
      // Find the selected country
      const selectedCountry = allCountries.find(c => c.name === formData.defaultCountry);
      
      if (selectedCountry && selectedCountry.cities) {
        // Set cities from the selected country
        const cityList = selectedCountry.cities.filter(city => city).sort();
        setCities(cityList);
      } else {
        // No cities for this country
        setCities([]);
      }
      
      // Reset city selection when country changes
      if (formData.defaultCity) {
        setFormData(prev => ({ ...prev, defaultCity: '' }));
      }
    } else {
      setCities([]);
    }
  }, [formData.defaultCountry, allCountries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.defaultCity) {
      toast({
        title: "Eksik Bilgi",
        description: "Fuar adı ve şehir zorunludur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/fairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Fuar eklenemedi');
      }

      const result = await response.json();
      
      toast({
        title: "Başarılı",
        description: result.message || "Fuar başarıyla eklendi",
      });

      // Reset form
      setFormData({
        name: '',
        defaultCity: '',
        defaultCountry: '',
        defaultStartDate: '',
        defaultEndDate: '',
        description: ''
      });

      // Call callback with new fair
      if (onFairAdded) {
        onFairAdded(result.fair);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error adding fair:', error);
      toast({
        title: "Hata",
        description: "Fuar eklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Yeni Fuar Ekle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fair Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuar Adı <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: ISK-SODEX İstanbul"
              required
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ülke <span className="text-red-500">*</span>
            </label>
            <Select 
              value={formData.defaultCountry} 
              onValueChange={(value) => setFormData({ ...formData, defaultCountry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ülke seçin..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şehir <span className="text-red-500">*</span>
            </label>
            <Select 
              value={formData.defaultCity} 
              onValueChange={(value) => setFormData({ ...formData, defaultCity: value })}
              disabled={!formData.defaultCountry || cities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.defaultCountry 
                    ? "Önce ülke seçin..." 
                    : cities.length === 0 
                    ? "Yükleniyor..." 
                    : "Şehir seçin..."
                } />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.defaultCountry && cities.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Bu ülke için kayıtlı şehir bulunmamaktadır.
              </p>
            )}
          </div>

          {/* Default Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Varsayılan Başlangıç
              </label>
              <Input
                type="date"
                value={formData.defaultStartDate}
                onChange={(e) => setFormData({ ...formData, defaultStartDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Varsayılan Bitiş
              </label>
              <Input
                type="date"
                value={formData.defaultEndDate}
                onChange={(e) => setFormData({ ...formData, defaultEndDate: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Fuar hakkında notlar..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                'Ekleniyor...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Fuar Ekle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
