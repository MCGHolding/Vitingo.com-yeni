import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Download,
  Upload,
  Factory,
  Save,
  X
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

const SectorManager = () => {
  const { toast } = useToast();
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorDescription, setNewSectorDescription] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/library/sectors`);
      if (!response.ok) throw new Error('Failed to fetch sectors');
      const data = await response.json();
      setSectors(data);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      toast({
        title: 'Hata',
        description: 'Sektörler yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSectorName.trim()) {
      toast({
        title: 'Uyarı',
        description: 'Sektör adı boş olamaz',
        variant: 'destructive'
      });
      return;
    }

    // Check if sector already exists
    const exists = sectors.some(s => s.name.toLowerCase() === newSectorName.trim().toLowerCase());
    if (exists) {
      toast({
        title: 'Uyarı',
        description: 'Bu sektör zaten mevcut',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BACKEND_URL}/api/library/sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSectorName.trim(),
          description: newSectorDescription.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add sector');
      }

      toast({
        title: 'Başarılı',
        description: 'Sektör eklendi'
      });

      setNewSectorName('');
      setNewSectorDescription('');
      fetchSectors();
    } catch (error) {
      console.error('Error adding sector:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Sektör eklenemedi',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      toast({
        title: 'Uyarı',
        description: 'Sektör adı boş olamaz',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BACKEND_URL}/api/library/sectors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          description: editDescription.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update sector');
      }

      toast({
        title: 'Başarılı',
        description: 'Sektör güncellendi'
      });

      setEditingId(null);
      setEditName('');
      setEditDescription('');
      fetchSectors();
    } catch (error) {
      console.error('Error updating sector:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Sektör güncellenemedi',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" sektörünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/sectors/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete sector');

      toast({
        title: 'Başarılı',
        description: 'Sektör silindi'
      });

      fetchSectors();
    } catch (error) {
      console.error('Error deleting sector:', error);
      toast({
        title: 'Hata',
        description: 'Sektör silinemedi',
        variant: 'destructive'
      });
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast({
        title: 'Uyarı',
        description: 'İçe aktarılacak metin boş olamaz',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BACKEND_URL}/api/library/sectors/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_text: bulkImportText })
      });

      if (!response.ok) throw new Error('Failed to import sectors');

      const result = await response.json();
      toast({
        title: 'Başarılı',
        description: `${result.created} sektör eklendi, ${result.skipped} sektör zaten mevcut`
      });

      setBulkImportText('');
      setShowBulkImport(false);
      fetchSectors();
    } catch (error) {
      console.error('Error importing sectors:', error);
      toast({
        title: 'Hata',
        description: 'Toplu içe aktarma başarısız',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDefaults = async () => {
    if (!window.confirm('Default sektörleri yüklemek istediğinizden emin misiniz? Mevcut sektörler silinecek.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BACKEND_URL}/api/library/sectors/seed?force=true`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to load default sectors');

      const result = await response.json();
      toast({
        title: 'Başarılı',
        description: `${result.count} default sektör yüklendi`
      });

      fetchSectors();
    } catch (error) {
      console.error('Error loading defaults:', error);
      toast({
        title: 'Hata',
        description: 'Default sektörler yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (sector) => {
    setEditingId(sector.id);
    setEditName(sector.name);
    setEditDescription(sector.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Factory className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sektörler</h2>
            <p className="text-sm text-gray-600">
              Sektörleri yönetin ({sectors.length} sektör)
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowBulkImport(!showBulkImport)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Toplu İçe Aktar</span>
          </Button>
          <Button
            onClick={handleLoadDefaults}
            disabled={isSubmitting}
            variant="outline"
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Default Sektörleri Yükle</span>
          </Button>
        </div>
      </div>

      {/* Bulk Import Card */}
      {showBulkImport && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Toplu İçe Aktarma</span>
              <Button
                onClick={() => setShowBulkImport(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sektörleri virgülle veya alt alta yazın:</Label>
              <Textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="Örnek:&#10;Teknoloji, Yazılım, Perakende&#10;veya&#10;Teknoloji&#10;Yazılım&#10;Perakende"
                className="mt-2 min-h-[200px] font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleBulkImport}
              disabled={isSubmitting || !bulkImportText.trim()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              İçe Aktar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add New Sector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yeni Sektör Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Sektör Adı *</Label>
              <Input
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                placeholder="Örn: Teknoloji"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Açıklama (Opsiyonel)</Label>
              <Input
                value={newSectorDescription}
                onChange={(e) => setNewSectorDescription(e.target.value)}
                placeholder="Örn: Teknoloji ve yazılım sektörü"
                className="mt-1"
              />
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={isSubmitting || !newSectorName.trim()}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ekle
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sektör ara..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Sectors List */}
      <Card>
        <CardHeader>
          <CardTitle>Sektör Listesi ({filteredSectors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : filteredSectors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz sektör eklenmemiş'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {editingId === sector.id ? (
                    <div className="flex-1 flex items-center space-x-4">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Sektör adı"
                        className="flex-1"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Açıklama"
                        className="flex-1"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleUpdate(sector.id)}
                          disabled={isSubmitting}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{sector.name}</div>
                        {sector.description && (
                          <div className="text-sm text-gray-600 mt-1">{sector.description}</div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => startEdit(sector)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(sector.id, sector.name)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SectorManager;
