import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, CheckCircle, Globe } from 'lucide-react';

const AddCountryModal = ({ onClose, onSave }) => {
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCountry, setCreatedCountry] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!countryName.trim() || !countryCode.trim()) {
      alert('Ülke adı ve kodu gereklidir');
      return;
    }

    if (countryCode.length !== 2) {
      alert('Ülke kodu 2 karakter olmalıdır (örn: TR, US, FR)');
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/countries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: countryName.trim(),
          iso2: countryCode.trim().toUpperCase()
        })
      });

      if (response.ok) {
        const newCountry = await response.json();
        setCreatedCountry(newCountry);
        setShowSuccess(true);
        
        // Notify parent component
        if (onSave) {
          onSave(newCountry);
        }
      } else {
        const errorData = await response.json();
        alert('Hata: ' + (errorData.detail || 'Ülke kaydedilemedi'));
      }
    } catch (error) {
      console.error('Error creating country:', error);
      alert('Ülke kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          {/* X Close Button */}
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Başarılı!
            </h2>
            
            <p className="text-gray-600 mb-4">
              <strong>{createdCountry?.name} ({createdCountry?.iso2})</strong> ülkesi başarıyla eklendi.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                ✅ Yeni ülke artık dropdown menüsünde görünecek.
              </p>
            </div>
            
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Tamam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>Yeni Ülke Ekle</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke Adı *
                </label>
                <Input
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Örn: Türkiye, Amerika, Fransa..."
                  className="w-full"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke Kodu (ISO2) *
                </label>
                <Input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="Örn: TR, US, FR..."
                  className="w-full"
                  disabled={isLoading}
                  maxLength="2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  2 karakterli ülke kodu (ISO 3166-1 alpha-2)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !countryName.trim() || !countryCode.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Kaydediliyor...' : 'Ekle'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddCountryModal;