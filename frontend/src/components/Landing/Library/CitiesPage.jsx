import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const CitiesPage = () => {
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', country: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCity, setNewCity] = useState({ name: '', country: '' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [citiesRes, countriesRes] = await Promise.all([
        fetch(`${backendUrl}/api/library/cities`),
        fetch(`${backendUrl}/api/library/countries`)
      ]);
      const citiesData = await citiesRes.json();
      const countriesData = await countriesRes.json();
      setCities(citiesData);
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCity.name.trim() || !newCity.country) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newCity.name.trim(),
          country: newCity.country
        })
      });

      if (response.ok) {
        await loadData();
        setNewCity({ name: '', country: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding city:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.name.trim() || !editValue.country) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/cities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editValue.name.trim(),
          country: editValue.country
        })
      });

      if (response.ok) {
        await loadData();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating city:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu şehri silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/cities/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting city:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Şehirler</h2>
          <p className="text-gray-600 mt-1">{cities.length} şehir kayıtlı</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Şehir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Şehir Adı</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Ülke</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cities.map((city) => (
              <tr key={city.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === city.id ? (
                    <input
                      type="text"
                      value={editValue.name}
                      onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg"
                    />
                  ) : (
                    city.name
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === city.id ? (
                    <select
                      value={editValue.country}
                      onChange={(e) => setEditValue({ ...editValue, country: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg"
                    >
                      {countries.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    city.country
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === city.id ? (
                      <>
                        <button onClick={() => handleEdit(city.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(city.id);
                            setEditValue({ name: city.name, country: city.country });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(city.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Yeni Şehir Ekle</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                placeholder="Şehir adı..."
                className="w-full px-4 py-3 border rounded-lg"
              />
              <select
                value={newCity.country}
                onChange={(e) => setNewCity({ ...newCity, country: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Ülke seçin...</option>
                {countries.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">İptal</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesPage;