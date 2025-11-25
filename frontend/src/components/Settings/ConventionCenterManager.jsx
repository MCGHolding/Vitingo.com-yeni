import React, { useState, useEffect } from 'react';
import { Building2, Upload, Trash2, Search, X, Edit2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

const ConventionCenterManager = () => {
  const { toast } = useToast();
  const [centers, setCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [editData, setEditData] = useState({ name: '', address: '', website: '' });
  const [importText, setImportText] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  // Load all convention centers
  const loadCenters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers`);
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      }
    } catch (error) {
      console.error('Error loading convention centers:', error);
      toast({
        title: "Hata",
        description: "Fuar merkezleri yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  // Bulk import
  const handleImport = async () => {
    if (!importText.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen veri girin",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_text: importText })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Başarılı",
          description: `${result.created} fuar merkezi eklendi, ${result.updated} güncellendi${result.errors > 0 ? `, ${result.errors} hata` : ''}`
        });
        setShowImportModal(false);
        setImportText('');
        loadCenters();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast({
        title: "Hata",
        description: `İçe aktarma sırasında hata: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Update center
  const handleUpdate = async () => {
    if (!editData.name.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen fuar merkezi adını girin",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers/${editingCenter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCenter.id,
          name: editData.name,
          country: editingCenter.country,
          city: editingCenter.city,
          address: editData.address,
          website: editData.website
        })
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Fuar merkezi güncellendi" });
        setShowEditModal(false);
        setEditingCenter(null);
        setEditData({ name: '', address: '', website: '' });
        loadCenters();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fuar merkezi güncellenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Delete center
  const deleteCenter = async (id, name) => {
    if (!confirm(`"${name}" fuar merkezini silmek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Fuar merkezi silindi" });
        loadCenters();
      }
    } catch (error) {
      console.error('Error deleting center:', error);
      toast({
        title: "Hata",
        description: "Fuar merkezi silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Filter and group centers
  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by country and city
  const groupedCenters = filteredCenters.reduce((acc, center) => {
    const key = `${center.country} - ${center.city}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(center);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-purple-600" />
              Fuar Merkezleri
            </h2>
            <p className="text-gray-600 mt-1">
              Toplam {centers.length} fuar merkezi ({Object.keys(groupedCenters).length} lokasyon)
            </p>
          </div>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ülke, şehir veya fuar merkezi ara..."
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Centers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : Object.keys(groupedCenters).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz fuar merkezi eklenmemiş'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              İlk Verileri İçe Aktar
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedCenters).sort().map((location) => (
            <div key={location} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                {location}
                <span className="ml-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {groupedCenters[location].length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedCenters[location].map((center) => (
                  <Card key={center.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate mb-2">
                            {center.name}
                          </div>
                          {center.address && (
                            <p className="text-sm text-gray-600 mb-1 truncate">
                              📍 {center.address}
                            </p>
                          )}
                          {center.website && (
                            <a
                              href={center.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate block"
                            >
                              🌐 {center.website}
                            </a>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingCenter(center);
                              setEditData({
                                name: center.name,
                                address: center.address || '',
                                website: center.website || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCenter(center.id, center.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Fuar Merkezleri İçe Aktar</h3>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Format:</h4>
              <p className="text-sm text-blue-800 mb-2">Her satıra bir fuar merkezi yazın:</p>
              <code className="text-sm bg-blue-100 px-2 py-1 rounded block">
                Ülke, Şehir, Fuar Merkezi Adı
              </code>
              <div className="mt-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">Örnek:</p>
                <pre className="bg-blue-100 p-2 rounded text-xs">
Türkiye, İstanbul, Tüyap Fuar ve Kongre Merkezi{'\n'}Türkiye, İstanbul, CNR Expo{'\n'}Türkiye, Ankara, Congresium Ankara{'\n'}Almanya, Berlin, Messe Berlin{'\n'}Fransa, Paris, Paris Expo Porte de Versailles
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veri Girişi
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Ülke, Şehir, Fuar Merkezi&#10;Türkiye, İstanbul, Tüyap Fuar ve Kongre Merkezi&#10;Türkiye, Ankara, Congresium Ankara&#10;..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Her satır: Ülke, Şehir, Fuar Merkezi formatında olmalı
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Fuar Merkezi Düzenle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke & Şehir
                </label>
                <Input
                  value={`${editingCenter.country} - ${editingCenter.city}`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuar Merkezi Adı *
                </label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Örn: İstanbul Fuar Merkezi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres (Opsiyonel)
                </label>
                <Input
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="Örn: Atatürk Bulvarı No:123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Opsiyonel)
                </label>
                <Input
                  value={editData.website}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  placeholder="Örn: https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCenter(null);
                  setEditData({ name: '', address: '', website: '' });
                }}
              >
                İptal
              </Button>
              <Button onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700">
                Güncelle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConventionCenterManager;
