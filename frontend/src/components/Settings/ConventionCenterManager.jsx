import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Plus, Trash2, Search, Upload, X, Edit2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

const ConventionCenterManager = () => {
  const { toast } = useToast();
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [showEditCenterModal, setShowEditCenterModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [newCenterData, setNewCenterData] = useState({ name: '', address: '', website: '' });
  const [bulkImportText, setBulkImportText] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  // Load countries from library
  const loadCountries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/countries`);
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Hata",
        description: "Ülkeler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load cities for selected country
  const loadCities = async (countryName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/cities?country=${encodeURIComponent(countryName)}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      toast({
        title: "Hata",
        description: "Şehirler yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Load convention centers for selected city
  const loadCenters = async (countryName, cityName) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/library/convention-centers?country=${encodeURIComponent(countryName)}&city=${encodeURIComponent(cityName)}`
      );
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
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry.name);
      setSelectedCity(null);
      setCenters([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedCity) {
      loadCenters(selectedCountry.name, selectedCity.name);
    }
  }, [selectedCity]);

  // Delete convention center
  const deleteCenter = async (id, name) => {
    if (!confirm(`"${name}" fuar merkezini silmek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Fuar merkezi silindi" });
        if (selectedCountry && selectedCity) {
          loadCenters(selectedCountry.name, selectedCity.name);
        }
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

  // Add convention center
  const handleAdd = async () => {
    if (!newCenterData.name.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen fuar merkezi adını girin",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `${selectedCountry.code}-${selectedCity.name}-${Date.now()}`,
          name: newCenterData.name,
          country: selectedCountry.name,
          city: selectedCity.name,
          address: newCenterData.address,
          website: newCenterData.website
        })
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Fuar merkezi eklendi" });
        setShowAddCenterModal(false);
        setNewCenterData({ name: '', address: '', website: '' });
        loadCenters(selectedCountry.name, selectedCity.name);
      } else {
        throw new Error('Failed to add center');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fuar merkezi eklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Update convention center
  const handleUpdate = async () => {
    if (!newCenterData.name.trim()) {
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
          name: newCenterData.name,
          country: editingCenter.country,
          city: editingCenter.city,
          address: newCenterData.address,
          website: newCenterData.website
        })
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Fuar merkezi güncellendi" });
        setShowEditCenterModal(false);
        setEditingCenter(null);
        setNewCenterData({ name: '', address: '', website: '' });
        loadCenters(selectedCountry.name, selectedCity.name);
      } else {
        throw new Error('Failed to update center');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fuar merkezi güncellenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Bulk import centers
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen fuar merkezleri listesi girin",
        variant: "destructive"
      });
      return;
    }

    try {
      const centerNames = bulkImportText
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (centerNames.length === 0) {
        toast({
          title: "Uyarı",
          description: "Geçerli fuar merkezi bulunamadı",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/library/convention-centers/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centers: centerNames,
          country: selectedCountry.name,
          city: selectedCity.name
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Tamamlandı",
          description: `${result.created} fuar merkezi eklendi, ${result.updated} güncellendi`
        });
        setShowBulkImportModal(false);
        setBulkImportText('');
        loadCenters(selectedCountry.name, selectedCity.name);
      } else {
        throw new Error('Failed to bulk import');
      }
    } catch (error) {
      console.error('Error in bulk import:', error);
      toast({
        title: "Hata",
        description: "Toplu içe aktarma sırasında hata oluştu",
        variant: "destructive"
      });
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(centerSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Left Panel - Countries */}
      <div className="w-1/4 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Ülkeler ({filteredCountries.length})
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Ülke ara..."
              className="pl-10 pr-10"
            />
            {countrySearch && (
              <button
                onClick={() => setCountrySearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
          ) : filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>Ülke bulunamadı</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCountries.map((country) => (
                <div
                  key={country.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedCountry?.id === country.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => setSelectedCountry(country)}
                >
                  <div className="font-medium text-gray-900 truncate">{country.name}</div>
                  <div className="text-sm text-gray-500">{country.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Cities */}
      <div className="w-1/4 border-r border-gray-200 bg-white flex flex-col">
        {selectedCountry ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Şehirler ({cities.length})
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Şehir ara..."
                  className="pl-10 pr-10"
                />
                {citySearch && (
                  <button
                    onClick={() => setCitySearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredCities.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>{citySearch ? 'Şehir bulunamadı' : 'Bu ülke için şehir yok'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCities.map((city) => (
                    <div
                      key={city.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedCity?.id === city.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                      }`}
                      onClick={() => setSelectedCity(city)}
                    >
                      <div className="font-medium text-gray-900">{city.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p>Şehirleri görmek için bir ülke seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Convention Centers */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {selectedCountry && selectedCity ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                  Fuar Merkezleri
                  <span className="ml-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {centers.length}
                  </span>
                </h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowBulkImportModal(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Toplu İçe Aktar
                  </Button>
                  <Button
                    onClick={() => setShowAddCenterModal(true)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={centerSearch}
                  onChange={(e) => setCenterSearch(e.target.value)}
                  placeholder="Fuar merkezi ara..."
                  className="pl-10 pr-10"
                />
                {centerSearch && (
                  <button
                    onClick={() => setCenterSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredCenters.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {centerSearch ? 'Fuar merkezi bulunamadı' : 'Bu şehir için henüz fuar merkezi eklenmemiş'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredCenters.map((center) => (
                    <Card key={center.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building2 className="h-5 w-5 text-purple-600" />
                              <span className="font-semibold text-gray-900">{center.name}</span>
                            </div>
                            {center.address && (
                              <p className="text-sm text-gray-600 mb-1">{center.address}</p>
                            )}
                            {center.website && (
                              <a
                                href={center.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {center.website}
                              </a>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCenter(center);
                                setNewCenterData({
                                  name: center.name,
                                  address: center.address || '',
                                  website: center.website || ''
                                });
                                setShowEditCenterModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCenter(center.id, center.name)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">Fuar merkezlerini görmek için ülke ve şehir seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Center Modal */}
      {showAddCenterModal && selectedCountry && selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedCity.name} için Fuar Merkezi Ekle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuar Merkezi Adı *
                </label>
                <Input
                  value={newCenterData.name}
                  onChange={(e) => setNewCenterData({ ...newCenterData, name: e.target.value })}
                  placeholder="Örn: İstanbul Fuar Merkezi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres (Opsiyonel)
                </label>
                <Input
                  value={newCenterData.address}
                  onChange={(e) => setNewCenterData({ ...newCenterData, address: e.target.value })}
                  placeholder="Örn: Atatürk Bulvarı No:123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Opsiyonel)
                </label>
                <Input
                  value={newCenterData.website}
                  onChange={(e) => setNewCenterData({ ...newCenterData, website: e.target.value })}
                  placeholder="Örn: https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCenterModal(false);
                  setNewCenterData({ name: '', address: '', website: '' });
                }}
              >
                İptal
              </Button>
              <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
                Ekle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Center Modal */}
      {showEditCenterModal && editingCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Fuar Merkezi Düzenle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuar Merkezi Adı *
                </label>
                <Input
                  value={newCenterData.name}
                  onChange={(e) => setNewCenterData({ ...newCenterData, name: e.target.value })}
                  placeholder="Örn: İstanbul Fuar Merkezi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres (Opsiyonel)
                </label>
                <Input
                  value={newCenterData.address}
                  onChange={(e) => setNewCenterData({ ...newCenterData, address: e.target.value })}
                  placeholder="Örn: Atatürk Bulvarı No:123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Opsiyonel)
                </label>
                <Input
                  value={newCenterData.website}
                  onChange={(e) => setNewCenterData({ ...newCenterData, website: e.target.value })}
                  placeholder="Örn: https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditCenterModal(false);
                  setEditingCenter(null);
                  setNewCenterData({ name: '', address: '', website: '' });
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

      {/* Bulk Import Modal */}
      {showBulkImportModal && selectedCountry && selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {selectedCity.name} için Toplu Fuar Merkezi İçe Aktarma
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuar Merkezleri Listesi (virgülle ayrılmış)
                </label>
                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="İstanbul Fuar Merkezi, Yeşilköy Fuar Alanı, CNR Expo, Tüyap..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fuar merkezi isimlerini virgülle ayırarak giriniz. Aynı isimli merkezler güncellenir.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkImportText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConventionCenterManager;
