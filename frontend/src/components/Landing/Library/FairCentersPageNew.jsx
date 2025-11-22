import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search, Building } from 'lucide-react';

const FairCentersPageNew = () => {
  const [fairCenters, setFairCenters] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected filters
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    address: ''
  });
  
  // Import
  const [importText, setImportText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCountries();
    loadFairCenters();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find(c => c.name === selectedCountry);
      setCities(country?.cities || []);
      setSelectedCity('');
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedCountry, countries]);

  const loadCountries = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/countries`);
      const data = await response.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadFairCenters = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers`);
      const data = await response.json();
      setFairCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading fair centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.country || !formData.city) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadFairCenters();
        setFormData({ name: '', country: '', city: '', address: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding fair center:', error);
      alert('Fuar merkezi eklenirken hata oluştu');
    }
  };

  const handleEdit = async () => {
    if (!editingCenter || !editingCenter.name.trim()) {
      alert('Fuar merkezi adı boş olamaz');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers/${editingCenter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCenter)
      });

      if (response.ok) {
        await loadFairCenters();
        setEditingCenter(null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error editing fair center:', error);
      alert('Fuar merkezi güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu fuar merkezini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadFairCenters();
      }
    } catch (error) {
      console.error('Error deleting fair center:', error);
      alert('Fuar merkezi silinirken hata oluştu');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportText(e.target.result);
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
      // Format: "Ülke | Şehir | Fuar Merkezi | Adres (optional)"
      const lines = importText.trim().split('\n');
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 3) {
          console.warn(`Invalid line format: ${line}`);
          errorCount++;
          continue;
        }

        const [country, city, name, address = ''] = parts;

        const response = await fetch(`${backendUrl}/api/library/fair-centers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            country,
            city,
            address
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json();
          console.error(`Failed to create ${name}:`, errorData);
          errorCount++;
        }
      }

      console.log(`İçeri aktarma tamamlandı! Başarılı: ${successCount}, Hatalı: ${errorCount}`);
      
      await loadFairCenters();
      setImportText('');
      setSelectedFile(null);
      setShowImportModal(false);
      
      setTimeout(() => {
        alert(`İçeri aktarma tamamlandı!\n✅ Başarılı: ${successCount}\n❌ Hatalı: ${errorCount}`);
      }, 100);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('İçeri aktarma sırasında hata oluştu');
    }
  };

  const filteredCenters = fairCenters.filter(center => {
    if (selectedCountry && center.country !== selectedCountry) return false;
    if (selectedCity && center.city !== selectedCity) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Yükleniyor...</div></div>;
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Filters */}
      <div className="w-1/3 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Filtreler</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Ülkeler</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.name}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedCountry}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Tüm Şehirler</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedCountry('');
                setSelectedCity('');
              }}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">
            <div className="font-semibold mb-1">📊 İstatistikler</div>
            <div className="space-y-1">
              <div>Toplam: <span className="font-bold">{fairCenters.length}</span></div>
              <div>Filtrelenmiş: <span className="font-bold">{filteredCenters.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Fair Centers */}
      <div className="w-2/3 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Fuar Merkezleri ({filteredCenters.length})</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Toplu İçeri Aktar
              </button>
              <button
                onClick={() => {
                  setFormData({ name: '', country: selectedCountry, city: selectedCity, address: '' });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Yeni Ekle
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCenters.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {selectedCountry || selectedCity ? 'Bu kriterlere uygun fuar merkezi bulunamadı' : 'Henüz fuar merkezi eklenmemiş'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Fuar Merkezi</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Ülke</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Şehir</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCenters.map((center) => (
                  <tr key={center.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{center.name}</div>
                      {center.address && <div className="text-xs text-gray-500">{center.address}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{center.country}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{center.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCenter(center);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(center.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Yeni Fuar Merkezi Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({ ...formData, country: e.target.value, city: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.country}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seçiniz</option>
                  {(countries.find(c => c.name === formData.country)?.cities || []).map((city, i) => (
                    <option key={i} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuar Merkezi Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: İstanbul Fuar Merkezi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Fuar merkezi adresi"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">İptal</button>
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Fuar Merkezi Düzenle</h3>
              <button onClick={() => { setShowEditModal(false); setEditingCenter(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                <select
                  value={editingCenter.country}
                  onChange={(e) => setEditingCenter({ ...editingCenter, country: e.target.value, city: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <select
                  value={editingCenter.city}
                  onChange={(e) => setEditingCenter({ ...editingCenter, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(countries.find(c => c.name === editingCenter.country)?.cities || []).map((city, i) => (
                    <option key={i} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuar Merkezi Adı *</label>
                <input
                  type="text"
                  value={editingCenter.name}
                  onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={editingCenter.address || ''}
                  onChange={(e) => setEditingCenter({ ...editingCenter, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button onClick={() => { setShowEditModal(false); setEditingCenter(null); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">İptal</button>
              <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Toplu İçeri Aktar - Fuar Merkezleri</h3>
              <button onClick={() => { setShowImportModal(false); setImportText(''); setSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">📋 Format:</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Her satırda: <code className="bg-white px-1 py-0.5 rounded">Ülke | Şehir | Fuar Merkezi | Adres (opsiyonel)</code>
                </p>
                <div className="bg-white rounded p-2 text-xs font-mono text-gray-700">
                  Türkiye | İstanbul | İstanbul Fuar Merkezi | Yeşilköy Mahallesi<br/>
                  Almanya | Berlin | Messe Berlin | Messedamm 22<br/>
                  Fransa | Paris | Paris Expo | Porte de Versailles
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📁 Dosya Yükle (.txt)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept=".txt" onChange={handleFileChange} className="hidden" id="file-upload-fair" />
                  <label htmlFor="file-upload-fair" className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Dosya Seç
                  </label>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{selectedFile.name}</span>
                      <button onClick={() => { setSelectedFile(null); setImportText(''); }} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">veya aşağıdaki alana manuel olarak yapıştırın</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuar Merkezi Verileri *</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Türkiye | İstanbul | İstanbul Fuar Merkezi | Adres&#10;Almanya | Berlin | Messe Berlin | Messedamm 22"
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button onClick={() => { setShowImportModal(false); setImportText(''); setSelectedFile(null); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">İptal</button>
              <button onClick={handleBulkImport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

export default FairCentersPageNew;
