import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react';

const CountryCityPageNew = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [cities, setCities] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  
  // Modals
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showEditCountryModal, setShowEditCountryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  
  // Form data
  const [newCountry, setNewCountry] = useState({ name: '', flag: '' });
  const [newCity, setNewCity] = useState('');
  const [importText, setImportText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      const country = countries.find(c => c.id === selectedCountryId);
      setCities(country?.cities || []);
    } else {
      setCities([]);
    }
  }, [selectedCountryId, countries]);

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
      }
    } catch (error) {
      console.error('Error adding country:', error);
      alert('Ülke eklenirken hata oluştu');
    }
  };

  const handleEditCountry = async () => {
    if (!editingCountry || !editingCountry.name.trim()) {
      alert('Ülke adı boş olamaz');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/countries/${editingCountry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCountry)
      });

      if (response.ok) {
        await loadCountries();
        setEditingCountry(null);
        setShowEditCountryModal(false);
      }
    } catch (error) {
      console.error('Error editing country:', error);
      alert('Ülke güncellenirken hata oluştu');
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
        if (selectedCountryId === countryId) {
          setSelectedCountryId('');
        }
        await loadCountries();
      }
    } catch (error) {
      console.error('Error deleting country:', error);
      alert('Ülke silinirken hata oluştu');
    }
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) {
      alert('Şehir adı boş olamaz');
      return;
    }

    if (!selectedCountryId) {
      alert('Lütfen önce bir ülke seçin');
      return;
    }

    try {
      const country = countries.find(c => c.id === selectedCountryId);
      const updatedCities = [...(country.cities || []), newCity.trim()];

      const response = await fetch(`${backendUrl}/api/library/countries/${selectedCountryId}`, {
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
      }
    } catch (error) {
      console.error('Error adding city:', error);
      alert('Şehir eklenirken hata oluştu');
    }
  };

  const handleDeleteCity = async (cityName) => {
    if (!window.confirm(`"${cityName}" şehrini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const country = countries.find(c => c.id === selectedCountryId);
      const updatedCities = country.cities.filter(c => c !== cityName);

      const response = await fetch(`${backendUrl}/api/library/countries/${selectedCountryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...country,
          cities: updatedCities
        })
      });

      if (response.ok) {
        await loadCountries();
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('Şehir silinirken hata oluştu');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setImportText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) {
      alert('Lütfen içeri aktarmak istediğiniz verileri girin veya dosya yükleyin');
      return;
    }

    try {
      // Parse the import text
      // Format: "Ülke: Şehir1, Şehir2, Şehir3"
      const lines = importText.trim().split('\n');
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split(':');
        if (parts.length !== 2) {
          console.warn(`Invalid line format: ${line}`);
          errorCount++;
          continue;
        }

        const countryName = parts[0].trim();
        const citiesStr = parts[1].trim();
        const citiesList = citiesStr.split(',').map(c => c.trim()).filter(c => c);

        // Check if country already exists
        let existingCountry = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

        if (existingCountry) {
          // Update existing country - add new cities
          const updatedCities = [...new Set([...existingCountry.cities, ...citiesList])];
          
          const response = await fetch(`${backendUrl}/api/library/countries/${existingCountry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...existingCountry,
              cities: updatedCities
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          // Create new country
          const response = await fetch(`${backendUrl}/api/library/countries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              name: countryName,
              flag: '',
              cities: citiesList
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      alert(`İçeri aktarma tamamlandı!\n✅ Başarılı: ${successCount}\n❌ Hatalı: ${errorCount}`);
      await loadCountries();
      setImportText('');
      setShowImportModal(false);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('İçeri aktarma sırasında hata oluştu');
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.id === selectedCountryId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Countries */}
      <div className="w-1/2 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">Tüm Ülkeler ({countries.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Toplu İçeri Aktar
              </button>
              <button
                onClick={() => setShowAddCountryModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Yeni Ekle
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ülke ara..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Ülke adı</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCountries.map((country) => (
                <tr
                  key={country.id}
                  onClick={() => setSelectedCountryId(country.id)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedCountryId === country.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag || '🏳️'}</span>
                      <span className="text-sm text-gray-800">{country.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCountry(country);
                          setShowEditCountryModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCountry(country.id);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel - Cities */}
      <div className="w-1/2 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">
              Şehirler ({cities.length})
            </h2>
          </div>
          
          {/* Country Selector */}
          <div className="mb-3">
            <select
              value={selectedCountryId}
              onChange={(e) => setSelectedCountryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ülke seçiniz</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add City Button */}
          <button
            onClick={() => setShowAddCityModal(true)}
            disabled={!selectedCountryId}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </button>
        </div>

        {/* Cities List */}
        <div className="flex-1 overflow-y-auto">
          {!selectedCountryId ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Şehirleri görmek için bir ülke seçin
            </div>
          ) : cities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Bu ülkeye henüz şehir eklenmemiş
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Şehir</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Ülke</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cities.map((city, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{city}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {selectedCountry?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeleteCity(city)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Country Modal */}
      {showAddCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Yeni Ülke Ekle</h3>
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

      {/* Edit Country Modal */}
      {showEditCountryModal && editingCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Ülke Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditCountryModal(false);
                  setEditingCountry(null);
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
                  value={editingCountry.name}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bayrak Emojisi
                </label>
                <input
                  type="text"
                  value={editingCountry.flag || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, flag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="2"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditCountryModal(false);
                  setEditingCountry(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleEditCountry}
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
              <h3 className="text-lg font-bold text-gray-800">Yeni Şehir Ekle</h3>
              <button
                onClick={() => {
                  setShowAddCityModal(false);
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

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Toplu İçeri Aktar</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">📋 Format:</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Her satırda bir ülke ve şehirleri olmalı. Format: <code className="bg-white px-1 py-0.5 rounded">Ülke: Şehir1, Şehir2, Şehir3</code>
                </p>
                <div className="bg-white rounded p-2 text-xs font-mono text-gray-700">
                  İtalya: Roma, Milano, Napoli, Floransa<br/>
                  İspanya: Madrid, Barcelona, Sevilla, Valencia<br/>
                  Portekiz: Lizbon, Porto, Braga
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke ve Şehir Verileri <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="İtalya: Roma, Milano, Napoli&#10;İspanya: Madrid, Barcelona&#10;Fransa: Paris, Lyon"
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Mevcut ülkeler için şehirler eklenecek, yeni ülkeler oluşturulacaktır.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleBulkImport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                İçeri Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCityPageNew;
