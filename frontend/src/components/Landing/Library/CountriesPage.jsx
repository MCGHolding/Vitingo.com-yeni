import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const CountriesPage = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/countries`);
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCountryName.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newCountryName.trim(),
          code: ''
        })
      });

      if (response.ok) {
        await loadCountries();
        setNewCountryName('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding country:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.trim()) return;

    try {
      const country = countries.find(c => c.id === id);
      const response = await fetch(`${backendUrl}/api/library/countries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...country,
          name: editValue.trim()
        })
      });

      if (response.ok) {
        await loadCountries();
        setEditingId(null);
        setEditValue('');
      }
    } catch (error) {
      console.error('Error updating country:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ülkeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/countries/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCountries();
      }
    } catch (error) {
      console.error('Error deleting country:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ülkeler</h2>
          <p className="text-gray-600 mt-1">{countries.length} ülke kayıtlı</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Ülke
        </button>
      </div>

      {/* Countries List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ülke Adı</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {countries.map((country) => (
                <tr key={country.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === country.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-900">{country.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === country.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(country.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue('');
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(country.id);
                              setEditValue(country.name);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(country.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
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
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Ülke Ekle</h3>
            <input
              type="text"
              value={newCountryName}
              onChange={(e) => setNewCountryName(e.target.value)}
              placeholder="Ülke adı..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCountryName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountriesPage;
