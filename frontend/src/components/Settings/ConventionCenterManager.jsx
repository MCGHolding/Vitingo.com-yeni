import React, { useState, useEffect } from 'react';
import { Building2, Upload, Trash2, Search, X, Edit2, Globe, MapPin, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

const ConventionCenterManager = () => {
  const { toast } = useToast();
  const [centers, setCenters] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [continentFilter, setContinentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [editData, setEditData] = useState({ name: '', address: '', website: '' });
  const [importText, setImportText] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  // Kıta tanımları
  const continents = {
    'all': { name: 'Tümü', countries: [] },
    'europe': { 
      name: 'Avrupa', 
      countries: ['Almanya', 'Fransa', 'İngiltere', 'İspanya', 'Portekiz', 'İtalya', 
                  'Belçika', 'Lüksemburg', 'Hollanda', 'İsviçre', 'Finlandiya', 'Norveç', 
                  'İsveç', 'Slovenya', 'Slovakya', 'Romanya', 'Yunanistan', 'Bulgaristan',
                  'Hırvatistan', 'Sırbistan', 'Karadağ', 'Bosna-Hersek', 'Arnavutluk',
                  'Kuzey Makedonya', 'Kosova', 'Macaristan', 'Çekya', 'Polonya',
                  'Estonya', 'Letonya', 'Litvanya', 'İrlanda', 'Malta', 'Kıbrıs',
                  'Lihtenştayn', 'San Marino', 'Monako']
    },
    'america': { name: 'Amerika', countries: ['ABD', 'Kanada', 'Meksika'] },
    'asia': { 
      name: 'Asya', 
      countries: ['Türkiye', 'Japonya', 'Güney Kore', 'Singapur', 'Çin', 'Tayland', 
                  'Endonezya', 'Malezya', 'Hindistan', 'Tayvan', 'Filipinler', 
                  'Özbekistan', 'Azerbaycan', 'Gürcistan', 'Kazakistan', 'Rusya']
    },
    'middle_east': { 
      name: 'Orta Doğu', 
      countries: ['BAE', 'Suudi Arabistan', 'Katar', 'Kuveyt', 'Bahreyn', 
                  'Umman', 'Ürdün', 'Lübnan', 'İsrail', 'Irak', 'İran', 'Mısır']
    },
    'africa': { 
      name: 'Afrika', 
      countries: ['Güney Afrika', 'Fas', 'Nijerya', 'Kenya', 'Tunus', 'Gana',
                  'Senegal', 'Etiyopya', 'Angola', 'Cezayir', 'Fildişi Sahili']
    },
    'oceania': { 
      name: 'Okyanusya', 
      countries: ['Avustralya', 'Yeni Zelanda', 'Fiji', 'Papua Yeni Gine', 'Guam']
    }
  };

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

  // İstatistikler
  const stats = {
    totalCenters: centers.length,
    totalCountries: [...new Set(centers.map(c => c.country))].length,
    totalCities: [...new Set(centers.map(c => `${c.country}-${c.city}`))].length,
    selectedCountryCenters: selectedCountry ? centers.filter(c => c.country === selectedCountry).length : 0
  };

  // Ülkeleri grupla ve say
  const countries = centers.reduce((acc, center) => {
    if (!acc[center.country]) {
      acc[center.country] = { name: center.country, count: 0, cities: new Set() };
    }
    acc[center.country].count += 1;
    acc[center.country].cities.add(center.city);
    return acc;
  }, {});

  // Kıta filtresine göre ülkeler
  const filteredCountries = Object.values(countries).filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(countrySearch.toLowerCase());
    const matchesContinent = continentFilter === 'all' || 
                            continents[continentFilter].countries.includes(country.name);
    return matchesSearch && matchesContinent;
  }).sort((a, b) => b.count - a.count);

  // Şehirler (seçili ülkeye göre)
  const cities = selectedCountry 
    ? centers
        .filter(c => c.country === selectedCountry)
        .reduce((acc, center) => {
          if (!acc[center.city]) {
            acc[center.city] = { name: center.city, count: 0 };
          }
          acc[center.city].count += 1;
          return acc;
        }, {})
    : {};

  const filteredCities = Object.values(cities).filter(city =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  ).sort((a, b) => b.count - a.count);

  // Fuar merkezleri (seçili şehre göre)
  const filteredCenters = centers.filter(c => {
    if (!selectedCountry || !selectedCity) return false;
    const matchesLocation = c.country === selectedCountry && c.city === selectedCity;
    const matchesSearch = c.name.toLowerCase().includes(centerSearch.toLowerCase());
    return matchesLocation && matchesSearch;
  });

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
        setSelectedCountry(null);
        setSelectedCity(null);
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with Stats */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-purple-600" />
              Fuar Merkezleri Yönetimi
            </h1>
            <p className="text-gray-600 mt-1">Küresel fuar merkezlerini yönetin</p>
          </div>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Toplu İçe Aktar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Toplam Merkez</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalCenters}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Ülke Sayısı</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalCountries}</p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Şehir Sayısı</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.totalCities}</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Seçili Ülke</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {selectedCountry ? stats.selectedCountryCenters : '-'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continent Filter */}
        <div className="mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Kıta Filtresi:</span>
            {Object.entries(continents).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => {
                  setContinentFilter(key);
                  setSelectedCountry(null);
                  setSelectedCity(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  continentFilter === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Countries */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                Ülkeler
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {filteredCountries.length}
                </span>
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
                    key={country.name}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedCountry === country.name ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                    onClick={() => {
                      setSelectedCountry(country.name);
                      setSelectedCity(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{country.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {country.count} merkez • {country.cities.size} şehir
                        </div>
                      </div>
                      <BarChart3 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Cities */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {selectedCountry ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                    Şehirler
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {filteredCities.length}
                    </span>
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
                        key={city.name}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedCity === city.name ? 'bg-green-50 border-l-4 border-green-600' : ''
                        }`}
                        onClick={() => setSelectedCity(city.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{city.name}</div>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {city.count}
                          </span>
                        </div>
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                    Fuar Merkezleri
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      {filteredCenters.length}
                    </span>
                  </h2>
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
                      {centerSearch ? 'Fuar merkezi bulunamadı' : 'Bu şehir için fuar merkezi yok'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCenters.map((center) => (
                      <Card key={center.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                <span className="font-semibold text-gray-900 truncate">{center.name}</span>
                              </div>
                              {center.address && (
                                <p className="text-sm text-gray-600 mb-1 flex items-start">
                                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                  {center.address}
                                </p>
                              )}
                              {center.website && (
                                <a
                                  href={center.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center"
                                >
                                  <Globe className="h-4 w-4 mr-1" />
                                  {center.website}
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
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteCenter(center.id, center.name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
                <p className="text-lg">Fuar merkezlerini görmek için</p>
                <p className="text-lg">ülke ve şehir seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
