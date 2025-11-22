import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, X, Save, MapPin, Flag } from 'lucide-react';

const CountryCityPage = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState(new Set());
  
  // Modals
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Form data
  const [newCountry, setNewCountry] = useState({ name: '', flag: '' });
  const [newCity, setNewCity] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/countries`);
      const data = await response.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (countryId) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryId)) {
      newExpanded.delete(countryId);
    } else {
      newExpanded.add(countryId);
    }
    setExpandedCountries(newExpanded);
  };

  const handleAddCountry = async () => {
    if (!newCountry.name.trim()) {
      alert('Ülke adı boş olamaz');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newCountry.name.trim(),
          flag: newCountry.flag.trim(),
          cities: []
        })
      });

      if (response.ok) {
        await loadCountries();
        setNewCountry({ name: '', flag: '' });
        setShowAddCountryModal(false);
      } else {
        alert('Ülke eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding country:', error);
      alert('Ülke eklenirken hata oluştu');
    }
  };

  const handleDeleteCountry = async (countryId) => {
    if (!window.confirm('Bu ülkeyi ve tüm şehirlerini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/countries/${countryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCountries();
      } else {
        alert('Ülke silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting country:', error);
      alert('Ülke silinirken hata oluştu');
    }
  };

  const handleAddCity = async () => {
    if (!newCity.trim() || !selectedCountry) {
      alert('Şehir adı boş olamaz');
      return;
    }

    try {
      // Get current country data
      const country = countries.find(c => c.id === selectedCountry.id);
      const updatedCities = [...(country.cities || []), newCity.trim()];

      const response = await fetch(`${backendUrl}/api/library/countries/${selectedCountry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...country,
          cities: updatedCities
        })
      });

      if (response.ok) {
        await loadCountries();
        setNewCity('');
        setShowAddCityModal(false);
        setSelectedCountry(null);
      } else {
        alert('Şehir eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding city:', error);
      alert('Şehir eklenirken hata oluştu');
    }
  };

  const handleDeleteCity = async (country, cityName) => {
    if (!window.confirm(`"${cityName}" şehrini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const updatedCities = country.cities.filter(c => c !== cityName);

      const response = await fetch(`${backendUrl}/api/library/countries/${country.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...country,
          cities: updatedCities
        })
      });

      if (response.ok) {
        await loadCountries();
      } else {
        alert('Şehir silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('Şehir silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Ülke & Şehir</h2>
          <span className="text-sm text-gray-500">({countries.length} ülke)</span>
        </div>
        <button
          onClick={() => setShowAddCountryModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ülke Ekle
        </button>
      </div>

      {/* Countries List */}
      <div className="space-y-2">
        {countries.map((country) => (
          <div key={country.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Country Header */}
            <div className="bg-white p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => toggleCountry(country.id)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {expandedCountries.has(country.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <span className="text-2xl">{country.flag || '🏳️'}</span>
                <span className="font-semibold text-gray-800">{country.name}</span>
                <span className="text-sm text-gray-500">
                  ({(country.cities || []).length} şehir)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCountry(country);
                    setShowAddCityModal(true);
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Şehir Ekle"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCountry(country.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Ülkeyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cities List */}
            {expandedCountries.has(country.id) && (
              <div className="bg-gray-50 border-t border-gray-200">
                {(country.cities || []).length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Bu ülkeye henüz şehir eklenmemiş
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {country.cities.map((city, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-sm text-gray-700">{city}</span>
                        <button
                          onClick={() => handleDeleteCity(country, city)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Country Modal */}
      {showAddCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-600" />
                Yeni Ülke Ekle
              </h3>
              <button
                onClick={() => {
                  setShowAddCountryModal(false);
                  setNewCountry({ name: '', flag: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                  placeholder="Örn: Türkiye"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bayrak Emojisi
                </label>
                <input
                  type="text"
                  value={newCountry.flag}
                  onChange={(e) => setNewCountry({ ...newCountry, flag: e.target.value })}
                  placeholder="🇹🇷"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bayrak emojisi ekleyebilirsiniz (opsiyonel)
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddCountryModal(false);
                  setNewCountry({ name: '', flag: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddCountry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && selectedCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Yeni Şehir Ekle
              </h3>
              <button
                onClick={() => {
                  setShowAddCityModal(false);
                  setSelectedCountry(null);
                  setNewCity('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCountry.flag || '🏳️'}</span>
                  <span className="font-semibold text-gray-800">{selectedCountry.name}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Örn: İstanbul"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddCityModal(false);
                  setSelectedCountry(null);
                  setNewCity('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddCity}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCityPage;
