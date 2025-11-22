import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { 
  MapPin,
  Calendar,
  Building2,
  Globe,
  Plus,
  Save,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

// New Sector Modal Component
const NewSectorModal = ({ isOpen, onClose, onSave }) => {
  const [newSectorName, setNewSectorName] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!newSectorName.trim()) {
      toast({
        title: "Hata",
        description: "Sektör adı boş olamaz.",
        variant: "destructive"
      });
      return;
    }

    onSave(newSectorName.trim());
    setNewSectorName('');
    onClose();
    
    toast({
      title: "Başarılı",
      description: `"${newSectorName}" sektörü eklendi.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Yeni Sektör Ekle</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Sektör Adı
            </label>
            <Input
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="Örn: Yapay Zeka, Blockchain, Yeşil Enerji..."
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, onBackToDashboard, fairInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fuar Başarıyla Oluşturuldu!
            </h3>
            {fairInfo && (
              <p className="text-gray-600">
                "{fairInfo.name}" fuarı başarıyla kaydedildi.
              </p>
            )}
          </div>
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Yeni Fuar Ekle
            </Button>
            <Button onClick={onBackToDashboard} className="flex-1">
              Dashboard'a Dön
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NewFairFormPage({ onClose }) {
  const { toast } = useToast();
  const [showNewSectorModal, setShowNewSectorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdFairInfo, setCreatedFairInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    fairCenter: '',
    fuarYili: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    sector: '',
    cycle: '',
    fairMonth: ''
  });

  // Load countries and cities from collections
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [fairCenters, setFairCenters] = useState([]);
  const [allFairCenters, setAllFairCenters] = useState([]);

  // Default sectors list
  const [sectors, setSectors] = useState([
    'Teknoloji',
    'Otomotiv',
    'Gıda ve İçecek',
    'Tekstil ve Moda',
    'Sağlık ve Tıp',
    'İnşaat ve Mimarlık',
    'Eğitim',
    'Turizm ve Otelcilik',
    'Tarım ve Hayvancılık',
    'Makine ve Sanayi',
    'Enerji',
    'Çevre ve Geri Dönüşüm',
    'Güvenlik',
    'Elektronik',
    'Kimya',
    'Mobilya',
    'Spor ve Rekreasyon',
    'Sanat ve Kültür'
  ]);

  const cycles = [
    { value: '6_months', label: '6 ayda 1' },
    { value: 'yearly', label: 'Her sene' },
    { value: '2_years', label: '2 senede bir' },
    { value: '3_years', label: '3 senede bir' }
  ];

  // Load countries from MongoDB collection on mount
  React.useEffect(() => {
    const loadCountries = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/library/countries`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const countryNames = data
            .map(doc => doc.name)
            .filter(name => name)
            .sort();
          setCountries(countryNames);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };

    loadCountries();
  }, []);

  // Load all countries with cities on mount
  React.useEffect(() => {
    const loadAllCountriesWithCities = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/library/countries`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Store all countries for city filtering
          setAllCities(data);
        }
      } catch (error) {
        console.error('Error loading countries with cities:', error);
      }
    };

    loadAllCountriesWithCities();
  }, []);

  // Filter cities when country changes
  React.useEffect(() => {
    if (formData.country && allCities.length > 0) {
      // Find the selected country
      const selectedCountry = allCities.find(c => c.name === formData.country);
      
      if (selectedCountry && selectedCountry.cities) {
        // Set cities from the selected country - remove duplicates with Set
        const cityList = [...new Set(selectedCountry.cities.filter(city => city))].sort();
        setCities(cityList);
      } else {
        // No cities for this country
        setCities([]);
      }
      
      // Reset city selection when country changes
      if (formData.city) {
        setFormData(prev => ({ ...prev, city: '', fairCenter: '' }));
      }
    } else {
      setCities([]);
    }
  }, [formData.country, allCities]);

  // Load fair centers from Library API on mount
  React.useEffect(() => {
    const loadFairCenters = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/library/fair-centers`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setAllFairCenters(data);
        }
      } catch (error) {
        console.error('Error loading fair centers:', error);
      }
    };

    loadFairCenters();
  }, []);

  // Filter fair centers when city changes
  React.useEffect(() => {
    if (formData.city && allFairCenters.length > 0) {
      // Filter fair centers for the selected city
      const centersForCity = allFairCenters.filter(center => center.city === formData.city);
      
      if (centersForCity.length > 0) {
        // Extract fair center names and sort them
        const centerNames = centersForCity
          .map(center => center.name)
          .filter(name => name)
          .sort();
        setFairCenters(centerNames);
      } else {
        setFairCenters([]);
      }
      
      // Reset fair center selection when city changes
      if (formData.fairCenter) {
        setFormData(prev => ({ ...prev, fairCenter: '' }));
      }
    } else {
      setFairCenters([]);
    }
  }, [formData.city, allFairCenters]);

  const months = [
    { value: '01', label: 'Ocak' },
    { value: '02', label: 'Şubat' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Nisan' },
    { value: '05', label: 'Mayıs' },
    { value: '06', label: 'Haziran' },
    { value: '07', label: 'Temmuz' },
    { value: '08', label: 'Ağustos' },
    { value: '09', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  // Test data generator with realistic information
  const fillTestData = () => {
    const testData = {
      name: 'Euroshop 2025',
      city: 'Düsseldorf',
      country: 'Almanya',
      fairCenter: '',
      fuarYili: '2025',
      startDate: '2025-03-15',
      endDate: '2025-03-19',
      sector: 'Teknoloji',
      cycle: 'yearly',
      fairMonth: '03'
    };
    
    setFormData(testData);
    
    toast({
      title: "Test Verileri Yüklendi",
      description: "Form test verileriyle dolduruldu.",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addNewSector = (sectorName) => {
    setSectors(prev => [...prev, sectorName]);
    setFormData(prev => ({
      ...prev,
      sector: sectorName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('Form submit başladı, form data:', formData);
    
    // Form validation
    if (!formData.name || !formData.city || !formData.country || !formData.fuarYili ||
        !formData.startDate || !formData.endDate || !formData.sector || !formData.cycle || !formData.fairMonth) {
      console.log('Form validation hatası - eksik alanlar');
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen tüm zorunlu alanları doldurunuz.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      console.log('Tarih validation hatası');
      toast({
        title: "Tarih Hatası",
        description: "Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('API çağrısı başlıyor...');
      
      // Create fair object for API
      const fairData = {
        name: formData.name,
        city: formData.city,
        country: formData.country,
        fairCenter: formData.fairCenter || '',
        year: formData.fuarYili,
        startDate: formData.startDate,
        endDate: formData.endDate,
        sector: formData.sector,
        cycle: formData.cycle,
        fairMonth: formData.fairMonth,
        description: `${formData.sector} sektörü fuarı`
      };

      console.log('Gönderilecek veri:', fairData);

      // Send to backend API
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      console.log('Backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/fairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fairData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API hatası:', errorData);
        throw new Error(errorData.detail || 'Fuar kaydedilemedi');
      }

      const savedFair = await response.json();
      console.log('Kaydedilen fuar:', savedFair);
      
      // Set success state
      setCreatedFairInfo({
        name: formData.name
      });
      setShowSuccessModal(true);
      
      toast({
        title: "Başarılı",
        description: `"${formData.name}" fuarı veritabanına başarıyla kaydedildi.`,
      });

    } catch (error) {
      console.error('Error saving fair:', error);
      toast({
        title: "Hata",
        description: error.message || "Fuar kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowSuccessModal(false);
    if (onClose) {
      onClose();
    }
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setCreatedFairInfo(null);
    setFormData({
      name: '',
      city: '',
      country: '',
      fairCenter: '',
      fuarYili: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      sector: '',
      cycle: '',
      fairMonth: ''
    });
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yeni Fuar</h1>
              <p className="text-gray-600">Fuar bilgilerini girin ve kaydedin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              type="button"
              onClick={fillTestData}
              variant="outline"
              className="flex items-center space-x-2 border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Test Verisi Doldur</span>
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Geri Dön</span>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Fuar Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fair Name and Country - Same Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fuar Adı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Örn: Teknoloji Fuarı 2025"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ülke <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Ülke seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length > 0 ? (
                        countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Yükleniyor...
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* City and Fair Center - Same Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)} disabled={!formData.country}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={formData.country ? "Şehir seçiniz" : "Önce ülke seçiniz"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.length > 0 ? (
                        cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          {formData.country ? "Yükleniyor..." : "Önce ülke seçiniz"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fuar Merkezi
                  </label>
                  <Select value={formData.fairCenter} onValueChange={(value) => handleInputChange('fairCenter', value)} disabled={!formData.city}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={formData.city ? "Fuar merkezi seçiniz" : "Önce şehir seçiniz"} />
                    </SelectTrigger>
                    <SelectContent>
                      {fairCenters.length > 0 ? (
                        fairCenters.map((center) => (
                          <SelectItem key={center} value={center}>
                            {center}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          {formData.city ? "Bu şehir için kayıtlı fuar merkezi yok" : "Önce şehir seçiniz"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Fuar Tarihleri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Yil <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.fuarYili} onValueChange={(value) => handleInputChange('fuarYili', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Yil seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const yil = new Date().getFullYear() + i;
                        return (
                          <SelectItem key={yil} value={yil.toString()}>
                            {yil}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector and Cycle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Kategori Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sector with Add Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sektör <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Select 
                    value={formData.sector} 
                    onValueChange={(value) => handleInputChange('sector', value)}
                  >
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue placeholder="Sektör seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                      <div className="border-t my-2">
                        <button
                          type="button"
                          onClick={() => setShowNewSectorModal(true)}
                          className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-blue-600"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Yeni Sektör Ekle</span>
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewSectorModal(true)}
                    className="h-12 px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cycle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Döngü <span className="text-red-500">*</span>
                </label>
                <Select value={formData.cycle} onValueChange={(value) => handleInputChange('cycle', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Fuar döngüsünü seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fair Month */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fuar Ayı <span className="text-red-500">*</span>
                </label>
                <Select value={formData.fairMonth} onValueChange={(value) => handleInputChange('fairMonth', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Fuar ayını seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fair Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fuar Yili <span className="text-red-500">*</span>
                </label>
                <Select value={formData.fuarYili} onValueChange={(value) => handleInputChange('fuarYili', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Yil seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((yil) => (
                      <SelectItem key={yil} value={yil.toString()}>
                        {yil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-8 py-3"
              >
                İptal
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Kaydediliyor...' : 'Fuarı Kaydet'}
            </Button>
          </div>
        </form>
      </div>

      {/* New Sector Modal */}
      <NewSectorModal
        isOpen={showNewSectorModal}
        onClose={() => setShowNewSectorModal(false)}
        onSave={addNewSector}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleAddAnother}
        onBackToDashboard={handleBackToDashboard}
        fairInfo={createdFairInfo}
      />
    </>
  );
}