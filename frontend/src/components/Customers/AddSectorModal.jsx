import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, CheckCircle } from 'lucide-react';

const AddSectorModal = ({ onClose, onSave, onSuccess }) => {
  const [sectorName, setSectorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSector, setCreatedSector] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sectorName.trim()) {
      alert('Sektör adı gereklidir');
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Generate value from name (lowercase, replace spaces and special chars)
      const value = sectorName.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      const response = await fetch(`${backendUrl}/api/sectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sectorName.trim(),
          value: value
        })
      });

      if (response.ok) {
        const newSector = await response.json();
        setCreatedSector(newSector);
        setShowSuccess(true);
        
        // Notify parent component
        if (onSave) {
          onSave(newSector);
        }

        // Don't auto-close, let user manually close with X or button
      } else {
        const errorData = await response.json();
        alert('Hata: ' + (errorData.detail || 'Sektör kaydedilemedi'));
      }
    } catch (error) {
      console.error('Error creating sector:', error);
      alert('Sektör kaydedilirken hata oluştu: ' + error.message);
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
              <strong>{createdSector?.name}</strong> sektörü başarıyla eklendi.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                ✅ Yeni sektör artık dropdown menüsünde görünecek.
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
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Yeni Sektör Ekle</span>
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
                  Sektör Adı *
                </label>
                <Input
                  value={sectorName}
                  onChange={(e) => setSectorName(e.target.value)}
                  placeholder="Örn: Blockchain, Yapay Zeka, Spor..."
                  className="w-full"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Yeni sektör adını girin
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
                  disabled={isLoading || !sectorName.trim()}
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

export default AddSectorModal;