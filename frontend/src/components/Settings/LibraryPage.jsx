import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Building, Search, Globe, Palette, Upload, X, ZoomIn } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import AddCustomerTypeModal from '../Customers/AddCustomerTypeModal';
import AddSectorModal from '../Customers/AddSectorModal';
import CountryCityManager from './CountryCityManager';
import PhoneCodeManager from './PhoneCodeManager';
import ConventionCenterManager from './ConventionCenterManager';

const LibraryPage = ({ onBack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('customer-types');
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCustomerTypeModal, setShowAddCustomerTypeModal] = useState(false);
  const [showAddSectorModal, setShowAddSectorModal] = useState(false);
  
  // Edit states
  const [editingCustomerTypeId, setEditingCustomerTypeId] = useState(null);
  const [editingCustomerType, setEditingCustomerType] = useState({ name: '', value: '', description: '' });
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [editingSector, setEditingSector] = useState({ name: '', description: '' });

  // Design Templates states
  const [designTemplates, setDesignTemplates] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingDesign, setUploadingDesign] = useState(false);

  // Load design templates
  const loadDesignTemplates = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/design-templates?category=cover_page`);
      if (response.ok) {
        const data = await response.json();
        setDesignTemplates(data);
      }
    } catch (error) {
      console.error('Error loading design templates:', error);
    }
  };

  // Upload design template
  const handleDesignUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesign(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('category', 'cover_page');

      const response = await fetch(`${backendUrl}/api/library/design-templates`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Tasarım şablonu eklendi" });
        loadDesignTemplates();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading design:', error);
      toast({ title: "Hata", description: "Yükleme başarısız", variant: "destructive" });
    } finally {
      setUploadingDesign(false);
      e.target.value = '';
    }
  };

  // Delete design template
  const deleteDesignTemplate = async (id) => {
    if (!confirm('Bu tasarımı silmek istediğinizden emin misiniz?')) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/design-templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Tasarım silindi" });
        loadDesignTemplates();
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      toast({ title: "Hata", description: "Silme başarısız", variant: "destructive" });
    }
  };

  // Load customer types
  const loadCustomerTypes = async () => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customer-types`);
      if (response.ok) {
        const data = await response.json();
        setCustomerTypes(data);
      }
    } catch (error) {
      console.error('Error loading customer types:', error);
      toast({
        title: "Hata",
        description: "Müşteri türleri yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load sectors
  const loadSectors = async () => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/sectors`);
      if (response.ok) {
        const data = await response.json();
        setSectors(data);
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
      toast({
        title: "Hata",
        description: "Sektörler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerTypes();
    loadSectors();
  }, []);

  // Delete customer type
  const deleteCustomerType = async (id, name) => {
    if (!confirm(`"${name}" müşteri türünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customer-types/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Müşteri türü silindi"
        });
        loadCustomerTypes();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting customer type:', error);
      toast({
        title: "Hata",
        description: "Müşteri türü silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Delete sector
  const deleteSector = async (id, name) => {
    if (!confirm(`"${name}" sektörünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/sectors/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Sektör silindi"
        });
        loadSectors();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting sector:', error);
      toast({
        title: "Hata",
        description: "Sektör silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Start editing customer type
  const startEditCustomerType = (type) => {
    setEditingCustomerTypeId(type.id);
    setEditingCustomerType({
      name: type.name,
      value: type.value,
      description: type.description || ''
    });
  };

  // Cancel editing customer type
  const cancelEditCustomerType = () => {
    setEditingCustomerTypeId(null);
    setEditingCustomerType({ name: '', value: '', description: '' });
  };

  // Update customer type
  const updateCustomerType = async (id) => {
    if (!editingCustomerType.name.trim() || !editingCustomerType.value.trim()) {
      toast({
        title: "Uyarı",
        description: "Müşteri türü adı ve değeri boş olamaz",
        variant: "destructive"
      });
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customer-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomerType)
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Müşteri türü güncellendi"
        });
        cancelEditCustomerType();
        loadCustomerTypes();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating customer type:', error);
      toast({
        title: "Hata",
        description: error.message || "Müşteri türü güncellenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Start editing sector
  const startEditSector = (sector) => {
    setEditingSectorId(sector.id);
    setEditingSector({
      name: sector.name,
      description: sector.description || ''
    });
  };

  // Cancel editing sector
  const cancelEditSector = () => {
    setEditingSectorId(null);
    setEditingSector({ name: '', description: '' });
  };

  // Update sector
  const updateSector = async (id) => {
    if (!editingSector.name.trim()) {
      toast({
        title: "Uyarı",
        description: "Sektör adı boş olamaz",
        variant: "destructive"
      });
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/library/sectors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSector)
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Sektör güncellendi"
        });
        cancelEditSector();
        loadSectors();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating sector:', error);
      toast({
        title: "Hata",
        description: error.message || "Sektör güncellenirken hata oluştu",
        variant: "destructive"
      });
    }
  };


  // Filter items based on search
  const filteredCustomerTypes = customerTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'customer-types', label: 'Müşteri Türleri', icon: Tag },
    { id: 'sectors', label: 'Sektörler', icon: Building },
    { id: 'countries-cities', label: 'Ülke & Şehir', icon: Globe },
    { id: 'phone-codes', label: 'Telefon Kodları', icon: Tag },
    { id: 'convention-centers', label: 'Fuar Merkezleri', icon: Building }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kütüphane</h1>
              <p className="text-gray-600 mt-1">Müşteri türleri, sektörler ve diğer tanımları yönetin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={activeTab === 'countries-cities' || activeTab === 'phone-codes' || activeTab === 'convention-centers' ? '' : 'px-6 py-6'}>
        {/* Country & City Manager (Full Width) */}
        {activeTab === 'countries-cities' && (
          <CountryCityManager />
        )}
        
        {/* Phone Codes Manager (Full Width) */}
        {activeTab === 'phone-codes' && (
          <PhoneCodeManager />
        )}

        {/* Convention Centers Manager (Full Width) */}
        {activeTab === 'convention-centers' && (
          <ConventionCenterManager />
        )}

        {/* Other tabs content */}
        {activeTab !== 'countries-cities' && activeTab !== 'phone-codes' && activeTab !== 'convention-centers' && (
          <>
        {/* Search and Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={activeTab === 'customer-types' ? 'Müşteri türü ara...' : 'Sektör ara...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => {
              if (activeTab === 'customer-types') {
                setShowAddCustomerTypeModal(true);
              } else {
                setShowAddSectorModal(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
        </div>

        {/* Customer Types List */}
        {activeTab === 'customer-types' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Yükleniyor...
              </div>
            ) : filteredCustomerTypes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Müşteri türü bulunamadı' : 'Henüz müşteri türü eklenmemiş'}
                </p>
              </div>
            ) : (
              filteredCustomerTypes.map((type) => (
                <Card key={type.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {editingCustomerTypeId === type.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600">Müşteri Türü Adı</Label>
                          <Input
                            value={editingCustomerType.name}
                            onChange={(e) => setEditingCustomerType({...editingCustomerType, name: e.target.value})}
                            placeholder="Müşteri türü adı"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Değer (Kod)</Label>
                          <Input
                            value={editingCustomerType.value}
                            onChange={(e) => setEditingCustomerType({...editingCustomerType, value: e.target.value})}
                            placeholder="Örn: firma, ajans"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Açıklama</Label>
                          <Input
                            value={editingCustomerType.description}
                            onChange={(e) => setEditingCustomerType({...editingCustomerType, description: e.target.value})}
                            placeholder="Açıklama (opsiyonel)"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => updateCustomerType(type.id)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Kaydet
                          </Button>
                          <Button
                            onClick={cancelEditCustomerType}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">{type.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500">Kod: {type.value}</p>
                          {type.description && (
                            <p className="text-sm text-gray-600 mt-2">{type.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditCustomerType(type)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomerType(type.id, type.name)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Sectors List */}
        {activeTab === 'sectors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Yükleniyor...
              </div>
            ) : filteredSectors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Sektör bulunamadı' : 'Henüz sektör eklenmemiş'}
                </p>
              </div>
            ) : (
              filteredSectors.map((sector) => (
                <Card key={sector.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {editingSectorId === sector.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-600">Sektör Adı</Label>
                          <Input
                            value={editingSector.name}
                            onChange={(e) => setEditingSector({...editingSector, name: e.target.value})}
                            placeholder="Sektör adı"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Açıklama</Label>
                          <Input
                            value={editingSector.description}
                            onChange={(e) => setEditingSector({...editingSector, description: e.target.value})}
                            placeholder="Açıklama (opsiyonel)"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => updateSector(sector.id)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Kaydet
                          </Button>
                          <Button
                            onClick={cancelEditSector}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">{sector.name}</h3>
                          </div>
                          {sector.description && (
                            <p className="text-sm text-gray-600 mt-2">{sector.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditSector(sector)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSector(sector.id, sector.name)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Modals */}
      {showAddCustomerTypeModal && (
        <AddCustomerTypeModal
          isOpen={showAddCustomerTypeModal}
          onClose={() => {
            setShowAddCustomerTypeModal(false);
            // Reload customer types when modal closes
            loadCustomerTypes();
          }}
          onSuccess={() => {
            setShowAddCustomerTypeModal(false);
            loadCustomerTypes();
          }}
        />
      )}

      {showAddSectorModal && (
        <AddSectorModal
          isOpen={showAddSectorModal}
          onClose={() => {
            setShowAddSectorModal(false);
            // Reload sectors when modal closes
            loadSectors();
          }}
          onSuccess={() => {
            setShowAddSectorModal(false);
            loadSectors();
          }}
        />
      )}
    </div>
  );
};

export default LibraryPage;
