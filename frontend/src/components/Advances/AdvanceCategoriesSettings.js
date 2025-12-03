import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { PlusIcon, EditIcon, TrashIcon, FolderIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from './ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvanceCategoriesSettings = () => {
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryData, setCategoryData] = useState({ name: '', is_active: true });
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/categories`);
      const categoriesData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryData.name || !categoryData.name.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, {
          name: categoryData.name,
          description: ''
        });
        toast.success('Kategori güncellendi');
      } else {
        await axios.post(`${API}/categories`, {
          name: categoryData.name,
          description: ''
        });
        toast.success('Kategori oluşturuldu');
      }

      setDialogOpen(false);
      setCategoryData({ name: '', is_active: true });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Kategori kaydedilirken hata oluştu';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Kategori kaydedilirken hata oluştu');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/categories/${category.id}`);
      toast.success('Kategori silindi');
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Kategori silinirken hata oluştu';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Kategori silinirken hata oluştu');
    }
  };

  const openDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryData({
        name: category.name,
        is_active: category.is_active !== false
      });
    } else {
      setEditingCategory(null);
      setCategoryData({ name: '', is_active: true });
    }
    setDialogOpen(true);
  };

  const handleToggleStatus = async (category) => {
    try {
      const newStatus = !category.is_active;
      await axios.put(`${API}/categories/${category.id}`, {
        name: category.name,
        description: category.description || '',
        is_active: newStatus
      });
      toast.success(newStatus ? 'Kategori aktif edildi' : 'Kategori pasif edildi');
      fetchCategories();
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-6 w-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Avans Kategorileri</h2>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openDialog()} 
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Yeni Kategori Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Kategori Güncelle' : 'Yeni Kategori'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="categoryName">Kategori Adı *</Label>
                    <Input
                      id="categoryName"
                      value={categoryData.name}
                      onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                      placeholder="Kategori adını girin"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button 
                      onClick={handleSaveCategory}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {editingCategory ? 'Güncelle' : 'Oluştur'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kategori eklenmemiş'}
            </p>
            <p className="text-gray-400 mt-2">
              {searchTerm ? 'Farklı bir arama terimi deneyin' : 'Başlamak için "Yeni Kategori Ekle" butonuna tıklayın'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FolderIcon className="h-5 w-5 text-teal-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.is_active !== false}
                          onCheckedChange={() => handleToggleStatus(category)}
                        />
                        <Badge 
                          variant={category.is_active !== false ? 'success' : 'secondary'}
                          className={category.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {category.is_active !== false ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(category)}
                          className="text-teal-600 hover:text-teal-700 hover:border-teal-600"
                        >
                          <EditIcon className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                          disabled={category.is_default}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdvanceCategoriesSettings;
