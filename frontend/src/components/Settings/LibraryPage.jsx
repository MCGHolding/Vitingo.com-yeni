import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Building, Search, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import AddCustomerTypeModal from '../Customers/AddCustomerTypeModal';
import AddSectorModal from '../Customers/AddSectorModal';
import CountryCityManager from './CountryCityManager';

const LibraryPage = ({ onBack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('customer-types');
  const [customerTypes, setCustomerTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCustomerTypeModal, setShowAddCustomerTypeModal] = useState(false);
  const [showAddSectorModal, setShowAddSectorModal] = useState(false);

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
      const response = await fetch(`${backendUrl}/api/sectors`);
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
      const response = await fetch(`${backendUrl}/api/sectors/${id}`, {
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
    { id: 'phone-codes', label: 'Telefon Kodları', icon: Tag }
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
      <div className={activeTab === 'countries-cities' || activeTab === 'phone-codes' ? '' : 'px-6 py-6'}>
        {/* Country & City Manager (Full Width) */}
        {activeTab === 'countries-cities' && (
          <CountryCityManager />
        )}
        
        {/* Phone Codes Manager (Full Width) */}
        {activeTab === 'phone-codes' && (
          <div className="p-6">
            <div className="text-center text-gray-500">
              <p>Telefon Kodları modülü yakında eklenecek...</p>
              <p className="text-sm mt-2">221 telefon kodu API'de hazır</p>
            </div>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab !== 'countries-cities' && activeTab !== 'phone-codes' && (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomerType(type.id, type.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">{sector.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500">Kod: {sector.value}</p>
                        {sector.description && (
                          <p className="text-sm text-gray-600 mt-2">{sector.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSector(sector.id, sector.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
