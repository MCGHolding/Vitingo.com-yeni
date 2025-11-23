import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const CompanyDetailsModal = ({ isOpen, onClose, onSave, company }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    address: '',
    postalCode: '',
    country: '',
    city: '',
    vatNo: ''
  });

  useEffect(() => {
    loadCountries();
    if (company) {
      setFormData({
        address: company.address || '',
        postalCode: company.postalCode || '',
        country: company.country || '',
        city: company.city || '',
        vatNo: company.vatNo || ''
      });
    }
  }, [company]);

  useEffect(() => {
    if (formData.country) {
      loadCities(formData.country);
    }
  }, [formData.country]);

  const loadCountries = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/library/countries`);
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      } else {
        // Fallback to static list
        setCountries([
          'Türkiye', 'ABD', 'Almanya', 'Fransa', 'İngiltere', 'İtalya', 'İspanya',
          'Hollanda', 'Belçika', 'Avusturya', 'İsviçre', 'Portekiz', 'Yunanistan'
        ]);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback
      setCountries([
        'Türkiye', 'ABD', 'Almanya', 'Fransa', 'İngiltere', 'İtalya', 'İspanya',
        'Hollanda', 'Belçika', 'Avusturya', 'İsviçre', 'Portekiz', 'Yunanistan'
      ]);
    }
  };

  const loadCities = async (country) => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('🌍 Loading cities for country:', country);
      const url = `${backendUrl}/api/library/cities?country=${encodeURIComponent(country)}`;
      console.log('🔗 URL:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('🏙️ Cities loaded:', data.length, 'cities');
        setCities(data);
      } else {
        console.error('❌ Failed to load cities:', response.status);
        // Fallback for Turkey
        if (country === 'Türkiye') {
          setCities([
            'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
            'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Diyarbakır', 'Samsun'
          ]);
        } else {
          setCities([]);
        }
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      if (country === 'Türkiye') {
        setCities([
          'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
          'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Diyarbakır', 'Samsun'
        ]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.address.trim() || !formData.country || !formData.city) {
      toast({
        title: "Eksik Bilgi",
        description: "Adres, Ülke ve Şehir zorunludur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/group-companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...company,
          ...formData
        })
      });

      if (!response.ok) throw new Error('İşlem başarısız');

      toast({
        title: "Başarılı",
        description: "Şirket detayları kaydedildi"
      });

      onSave();
    } catch (error) {
      console.error('Error saving details:', error);
      toast({
        title: "Hata",
        description: "Detaylar kaydedilirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Şirket Detayları</h2>
            <p className="text-sm text-gray-600 mt-1">{company?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şirket Adresi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Tam adres giriniz..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ülke <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value, city: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Ülke Seçin</option>
                {countries.map((country) => {
                  // Handle both string and object formats
                  const countryName = typeof country === 'string' ? country : country.name;
                  const countryValue = typeof country === 'string' ? country : country.name;
                  return (
                    <option key={countryValue} value={countryValue}>
                      {countryName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şehir <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!formData.country}
              >
                <option value="">Şehir Seçin</option>
                {cities.map((city) => {
                  // Handle both string and object formats
                  const cityName = typeof city === 'string' ? city : city.name;
                  const cityValue = typeof city === 'string' ? city : city.name;
                  return (
                    <option key={cityValue} value={cityValue}>
                      {cityName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posta Kodu
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="34000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAT No <span className="text-gray-500 text-xs">(Opsiyonel)</span>
            </label>
            <input
              type="text"
              value={formData.vatNo}
              onChange={(e) => setFormData({ ...formData, vatNo: e.target.value })}
              placeholder="TR1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-700">
              <strong>Not:</strong> Ülke seçtikten sonra şehir listesi otomatik olarak yüklenecektir.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;
