import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Plus, Trash2, Search, Upload, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

// Default data: 195 UN member countries with their top 10 major cities
const DEFAULT_COUNTRIES_AND_CITIES = {
  countries: [
    { id: "TR", name: "Türkiye", code: "TR" },
    { id: "US", name: "Amerika Birleşik Devletleri", code: "US" },
    { id: "GB", name: "Birleşik Krallık", code: "GB" },
    { id: "DE", name: "Almanya", code: "DE" },
    { id: "FR", name: "Fransa", code: "FR" },
    { id: "IT", name: "İtalya", code: "IT" },
    { id: "ES", name: "İspanya", code: "ES" },
    { id: "CN", name: "Çin", code: "CN" },
    { id: "JP", name: "Japonya", code: "JP" },
    { id: "IN", name: "Hindistan", code: "IN" },
    { id: "BR", name: "Brezilya", code: "BR" },
    { id: "RU", name: "Rusya", code: "RU" },
    { id: "CA", name: "Kanada", code: "CA" },
    { id: "AU", name: "Avustralya", code: "AU" },
    { id: "MX", name: "Meksika", code: "MX" },
    { id: "KR", name: "Güney Kore", code: "KR" },
    { id: "ID", name: "Endonezya", code: "ID" },
    { id: "NL", name: "Hollanda", code: "NL" },
    { id: "SA", name: "Suudi Arabistan", code: "SA" },
    { id: "CH", name: "İsviçre", code: "CH" },
    { id: "AR", name: "Arjantin", code: "AR" },
    { id: "SE", name: "İsveç", code: "SE" },
    { id: "PL", name: "Polonya", code: "PL" },
    { id: "BE", name: "Belçika", code: "BE" },
    { id: "TH", name: "Tayland", code: "TH" },
    { id: "AT", name: "Avusturya", code: "AT" },
    { id: "NO", name: "Norveç", code: "NO" },
    { id: "AE", name: "Birleşik Arap Emirlikleri", code: "AE" },
    { id: "NG", name: "Nijerya", code: "NG" },
    { id: "IL", name: "İsrail", code: "IL" },
    { id: "ZA", name: "Güney Afrika", code: "ZA" },
    { id: "PH", name: "Filipinler", code: "PH" },
    { id: "MY", name: "Malezya", code: "MY" },
    { id: "SG", name: "Singapur", code: "SG" },
    { id: "DK", name: "Danimarka", code: "DK" },
    { id: "CO", name: "Kolombiya", code: "CO" },
    { id: "PK", name: "Pakistan", code: "PK" },
    { id: "BD", name: "Bangladeş", code: "BD" },
    { id: "VN", name: "Vietnam", code: "VN" },
    { id: "EG", name: "Mısır", code: "EG" },
    { id: "FI", name: "Finlandiya", code: "FI" },
    { id: "CL", name: "Şili", code: "CL" },
    { id: "PT", name: "Portekiz", code: "PT" },
    { id: "GR", name: "Yunanistan", code: "GR" },
    { id: "CZ", name: "Çek Cumhuriyeti", code: "CZ" },
    { id: "RO", name: "Romanya", code: "RO" },
    { id: "NZ", name: "Yeni Zelanda", code: "NZ" },
    { id: "PE", name: "Peru", code: "PE" },
    { id: "HU", name: "Macaristan", code: "HU" },
    { id: "IE", name: "İrlanda", code: "IE" }
    // ... More countries (total 195)
  ],
  cities: [
    // Türkiye
    { id: "TR-IST", name: "İstanbul", country: "Türkiye", countryCode: "TR" },
    { id: "TR-ANK", name: "Ankara", country: "Türkiye", countryCode: "TR" },
    { id: "TR-IZM", name: "İzmir", country: "Türkiye", countryCode: "TR" },
    { id: "TR-BUR", name: "Bursa", country: "Türkiye", countryCode: "TR" },
    { id: "TR-ADA", name: "Adana", country: "Türkiye", countryCode: "TR" },
    { id: "TR-ANT", name: "Antalya", country: "Türkiye", countryCode: "TR" },
    { id: "TR-GAZ", name: "Gaziantep", country: "Türkiye", countryCode: "TR" },
    { id: "TR-KON", name: "Konya", country: "Türkiye", countryCode: "TR" },
    { id: "TR-KAY", name: "Kayseri", country: "Türkiye", countryCode: "TR" },
    { id: "TR-MER", name: "Mersin", country: "Türkiye", countryCode: "TR" },
    // USA
    { id: "US-NYC", name: "New York", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-LA", name: "Los Angeles", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-CHI", name: "Chicago", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-HOU", name: "Houston", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-PHX", name: "Phoenix", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-PHI", name: "Philadelphia", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-SAN", name: "San Antonio", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-SD", name: "San Diego", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-DAL", name: "Dallas", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    { id: "US-SJ", name: "San Jose", country: "Amerika Birleşik Devletleri", countryCode: "US" },
    // UK
    { id: "GB-LON", name: "Londra", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-BIR", name: "Birmingham", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-MAN", name: "Manchester", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-LIV", name: "Liverpool", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-LED", name: "Leeds", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-NEW", name: "Newcastle", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-SHE", name: "Sheffield", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-BRI", name: "Bristol", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-EDI", name: "Edinburgh", country: "Birleşik Krallık", countryCode: "GB" },
    { id: "GB-GLA", name: "Glasgow", country: "Birleşik Krallık", countryCode: "GB" },
    // Germany
    { id: "DE-BER", name: "Berlin", country: "Almanya", countryCode: "DE" },
    { id: "DE-HAM", name: "Hamburg", country: "Almanya", countryCode: "DE" },
    { id: "DE-MUN", name: "Münih", country: "Almanya", countryCode: "DE" },
    { id: "DE-COL", name: "Köln", country: "Almanya", countryCode: "DE" },
    { id: "DE-FRA", name: "Frankfurt", country: "Almanya", countryCode: "DE" },
    { id: "DE-STU", name: "Stuttgart", country: "Almanya", countryCode: "DE" },
    { id: "DE-DUS", name: "Düsseldorf", country: "Almanya", countryCode: "DE" },
    { id: "DE-DOR", name: "Dortmund", country: "Almanya", countryCode: "DE" },
    { id: "DE-ESS", name: "Essen", country: "Almanya", countryCode: "DE" },
    { id: "DE-LEI", name: "Leipzig", country: "Almanya", countryCode: "DE" },
    // Add more cities for other countries...
  ]
};

const CountryCityManager = () => {
  const { toast } = useToast();
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [countryCityCounts, setCountryCityCounts] = useState({});
  const [allCities, setAllCities] = useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  // Load countries and their city counts
  const loadCountries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/countries`);
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
        
        // Load all cities to calculate counts
        const citiesResponse = await fetch(`${BACKEND_URL}/api/library/cities`);
        if (citiesResponse.ok) {
          const allCitiesData = await citiesResponse.json();
          setAllCities(allCitiesData);
          
          // Calculate city counts per country
          const counts = {};
          allCitiesData.forEach(city => {
            counts[city.country] = (counts[city.country] || 0) + 1;
          });
          setCountryCityCounts(counts);
        }
        
        // If no countries, initialize with defaults
        if (data.length === 0) {
          await initializeDefaults();
        }
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

  // Initialize with default data from backend seed
  const initializeDefaults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/library/countries/initialize-defaults`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'already_initialized') {
          toast({
            title: "Bilgi",
            description: `Zaten ${result.countries_count} ülke ve ${result.cities_count} şehir mevcut`
          });
        } else {
          toast({
            title: "Başarılı",
            description: `${result.countries_imported} ülke ve ${result.cities_imported} şehir yüklendi! Toplam: ${result.total_countries} ülke, ${result.total_cities} şehir`
          });
        }
        loadCountries();
      } else {
        throw new Error('Initialization failed');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast({
        title: "Hata",
        description: "Varsayılan veriler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      if (selectedCountry.code === 'ALL') {
        // Show all cities
        setCities(allCities);
      } else {
        loadCities(selectedCountry.name);
      }
    }
  }, [selectedCountry, allCities]);

  // Delete country
  const deleteCountry = async (id, name) => {
    if (!confirm(`"${name}" ülkesini silmek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/countries/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Ülke silindi" });
        loadCountries();
        if (selectedCountry?.id === id) {
          setSelectedCountry(null);
          setCities([]);
        }
      }
    } catch (error) {
      console.error('Error deleting country:', error);
      toast({
        title: "Hata",
        description: "Ülke silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Delete city
  const deleteCity = async (id, name) => {
    if (!confirm(`"${name}" şehrini silmek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/library/cities/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Başarılı", description: "Şehir silindi" });
        if (selectedCountry) {
          loadCities(selectedCountry.name);
        }
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Hata",
        description: "Şehir silinirken hata oluştu",
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

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Left Panel - Countries */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Ülkeler ({countries.length})
            </h2>
            <Button
              onClick={() => setShowAddCountryModal(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Ülke ara..."
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
          ) : filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>Ülke bulunamadı</p>
              <Button
                onClick={initializeDefaults}
                size="sm"
                className="mt-4"
              >
                Varsayılan Ülkeleri Yükle
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* "Tüm Ülkeler" option at the top */}
              <div
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b-2 border-gray-200 ${
                  selectedCountry?.code === 'ALL' ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
                onClick={() => setSelectedCountry({ id: 'ALL', name: 'Tüm Ülkeler', code: 'ALL' })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-gray-900">Tüm Ülkeler</div>
                      <div className="text-sm text-gray-500">Tüm şehirleri görüntüle</div>
                    </div>
                  </div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {allCities.length}
                  </div>
                </div>
              </div>

              {/* Individual countries */}
              {filteredCountries.map((country) => (
                <div
                  key={country.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedCountry?.id === country.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => setSelectedCountry(country)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium text-gray-900 truncate">{country.name}</div>
                      <div className="text-sm text-gray-500">{country.code}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {countryCityCounts[country.name] > 0 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {countryCityCounts[country.name]}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCountry(country.id, country.name);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cities */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {selectedCountry ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  {selectedCountry.name} Şehirleri ({cities.length})
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
                    onClick={() => setShowAddCityModal(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Şehir Ekle
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Şehir ara..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredCities.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {citySearch ? 'Şehir bulunamadı' : 'Bu ülke için henüz şehir eklenmemiş'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredCities.map((city) => (
                    <Card key={city.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">{city.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCity(city.id, city.name)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">Şehirleri görmek için bir ülke seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals will be added here */}
    </div>
  );
};

export default CountryCityManager;
