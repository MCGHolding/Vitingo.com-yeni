import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  Plus,
  X,
  Save,
  CheckCircle,
  Award
} from 'lucide-react';

const AddSpecialtyModal = ({ categoryId, categoryName, onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [specialtyCreated, setSpecialtyCreated] = useState(false);
  const [createdSpecialtyInfo, setCreatedSpecialtyInfo] = useState(null);
  const [specialtyName, setSpecialtyName] = useState('');

  const handleGoBack = () => {
    setSpecialtyCreated(false);
    setSpecialtyName('');
  };

  const handleGoToForm = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!specialtyName.trim()) {
      toast({
        title: "Hata",
        description: "Uzmanlık alanı adı zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (!categoryId) {
      toast({
        title: "Hata",
        description: "Kategori seçilmemiş. Önce bir kategori seçin.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Create new specialty
      const response = await fetch(`${backendUrl}/api/supplier-specialties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: specialtyName.trim(),
          category_id: categoryId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create specialty');
      }

      const newSpecialty = await response.json();

      // Set success state
      setCreatedSpecialtyInfo({
        id: newSpecialty.id,
        name: newSpecialty.name,
        category_id: newSpecialty.category_id
      });
      setSpecialtyCreated(true);

      toast({
        title: "Başarılı",
        description: "Yeni uzmanlık alanı başarıyla oluşturuldu",
        variant: "default"
      });

      // Call onSave callback to refresh parent data
      if (onSave) {
        onSave(newSpecialty);
      }

    } catch (error) {
      console.error('Error creating specialty:', error);
      toast({
        title: "Hata",
        description: error.message || "Uzmanlık alanı oluşturulurken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {specialtyCreated ? 'Uzmanlık Alanı Eklendi!' : 'Yeni Uzmanlık Alanı Ekle'}
              </h1>
              <p className="text-gray-600">
                {specialtyCreated 
                  ? 'Yeni uzmanlık alanı başarıyla oluşturuldu'
                  : `${categoryName} kategorisi için uzmanlık alanı oluşturun`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {specialtyCreated ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, Uzmanlık Alanı Başarı ile Eklendi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{createdSpecialtyInfo?.name}</strong> uzmanlık alanı başarıyla oluşturuldu.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Uzmanlık Alanı:</span>
                        <span className="text-sm text-gray-900">{createdSpecialtyInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Kategori:</span>
                        <span className="text-sm text-gray-900">{categoryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Uzmanlık ID:</span>
                        <span className="text-sm text-gray-900">{createdSpecialtyInfo?.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-800 text-sm">
                      🎉 Uzmanlık alanı başarıyla eklendi ve artık tedarikçi formunda kullanılabilir.
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Yeni Uzmanlık Ekle</span>
                    </Button>
                    
                    <Button onClick={handleGoToForm} className="bg-purple-600 hover:bg-purple-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Forma Dön</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Seçili Kategori</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 font-medium">{categoryName}</p>
                    <p className="text-blue-600 text-sm">Bu kategoriye yeni uzmanlık alanı eklenecek</p>
                  </div>
                </CardContent>
              </Card>

              {/* Specialty Name */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Uzmanlık Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Uzmanlık Alanı Adı *
                    </label>
                    <Input
                      value={specialtyName}
                      onChange={(e) => setSpecialtyName(e.target.value)}
                      placeholder="Örn: E-ticaret Tasarımı, Portre Fotoğrafçılığı, Teknik Çeviri"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bu uzmanlık alanı seçili kategoriye bağlı olarak tedarikçi formunda görünecektir
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Oluşturuluyor...' : 'Uzmanlık Oluştur'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddSpecialtyModal;