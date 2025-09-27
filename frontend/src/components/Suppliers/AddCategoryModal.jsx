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
  Building2
} from 'lucide-react';

const AddCategoryModal = ({ onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categoryCreated, setCategoryCreated] = useState(false);
  const [createdCategoryInfo, setCreatedCategoryInfo] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const handleGoBack = () => {
    setCategoryCreated(false);
    setCategoryName('');
  };

  const handleGoToForm = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!categoryName.trim()) {
      toast({
        title: "Hata",
        description: "Kategori adı zorunludur",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Create new category
      const response = await fetch(`${backendUrl}/api/supplier-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create category');
      }

      const newCategory = await response.json();

      // Set success state
      setCreatedCategoryInfo({
        id: newCategory.id,
        name: newCategory.name
      });
      setCategoryCreated(true);

      toast({
        title: "Başarılı",
        description: "Yeni kategori başarıyla oluşturuldu",
        variant: "default"
      });

      // Call onSave callback to refresh parent data
      if (onSave) {
        onSave(newCategory);
      }

    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Hata",
        description: error.message || "Kategori oluşturulurken hata oluştu", 
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoryCreated ? 'Kategori Eklendi!' : 'Yeni Kategori Ekle'}
              </h1>
              <p className="text-gray-600">
                {categoryCreated 
                  ? 'Yeni tedarikçi kategorisi başarıyla oluşturuldu'
                  : 'Tedarikçi kategorisi oluşturun'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {categoryCreated ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, Kategori Başarı ile Eklendi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{createdCategoryInfo?.name}</strong> kategorisi başarıyla oluşturuldu.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Kategori Adı:</span>
                        <span className="text-sm text-gray-900">{createdCategoryInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Kategori ID:</span>
                        <span className="text-sm text-gray-900">{createdCategoryInfo?.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      🎉 Kategori başarıyla eklendi ve artık tedarikçi formunda kullanılabilir.
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Yeni Kategori Ekle</span>
                    </Button>
                    
                    <Button onClick={handleGoToForm} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Forma Dön</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Name */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Kategori Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori Adı *
                    </label>
                    <Input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Örn: Web Tasarımcı, Fotoğrafçı, Çevirmen"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bu kategori tedarikçi formunda seçenekler arasında görünecektir
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Oluşturuluyor...' : 'Kategori Oluştur'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;