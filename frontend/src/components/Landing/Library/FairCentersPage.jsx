import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const FairCentersPage = () => {
  const [fairCenters, setFairCenters] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', city: '', country: '', address: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCenter, setNewCenter] = useState({ name: '', city: '', country: '', address: '' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [centersRes, countriesRes, citiesRes] = await Promise.all([
        fetch(`${backendUrl}/api/library/fair-centers`),
        fetch(`${backendUrl}/api/library/countries`),
        fetch(`${backendUrl}/api/library/cities`)
      ]);
      const centersData = await centersRes.json();
      const countriesData = await countriesRes.json();
      const citiesData = await citiesRes.json();
      setFairCenters(Array.isArray(centersData) ? centersData : []);
      setCountries(Array.isArray(countriesData) ? countriesData : []);
      setCities(Array.isArray(citiesData) ? citiesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setFairCenters([]);
      setCountries([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCenter.name.trim() || !newCenter.city || !newCenter.country) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newCenter.name.trim(),
          city: newCenter.city,
          country: newCenter.country,
          address: newCenter.address.trim()
        })
      });

      if (response.ok) {
        await loadData();
        setNewCenter({ name: '', city: '', country: '', address: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding fair center:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.name.trim() || !editValue.city || !editValue.country) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editValue.name.trim(),
          city: editValue.city,
          country: editValue.country,
          address: editValue.address.trim()
        })
      });

      if (response.ok) {
        await loadData();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating fair center:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu fuar merkezini silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/fair-centers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting fair center:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fuar Merkezleri</h2>
          <p className="text-gray-600 mt-1">{fairCenters.length} fuar merkezi kayıtlı</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Fuar Merkezi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Merkez Adı</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Şehir</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Ülke</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Adres</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fairCenters.map((center) => (
              <tr key={center.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === center.id ? (
                    <input
                      type="text"
                      value={editValue.name}
                      onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg w-full"
                    />
                  ) : (
                    <span className="font-medium">{center.name}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === center.id ? (
                    <select
                      value={editValue.city}
                      onChange={(e) => setEditValue({ ...editValue, city: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg"
                    >
                      {cities.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    center.city
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === center.id ? (
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
                    center.country
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {editingId === center.id ? (
                    <input
                      type="text"
                      value={editValue.address}
                      onChange={(e) => setEditValue({ ...editValue, address: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg w-full"
                    />
                  ) : (
                    center.address || '-'
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === center.id ? (
                      <>
                        <button onClick={() => handleEdit(center.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
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
                            setEditingId(center.id);
                            setEditValue({ name: center.name, city: center.city, country: center.country, address: center.address || '' });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(center.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Yeni Fuar Merkezi Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merkez Adı *</label>
                <input
                  type="text"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  placeholder="LVCC (Las Vegas Convention Center)"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                  <select
                    value={newCenter.city}
                    onChange={(e) => setNewCenter({ ...newCenter, city: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Şehir seçin...</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                  <select
                    value={newCenter.country}
                    onChange={(e) => setNewCenter({ ...newCenter, country: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Ülke seçin...</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={newCenter.address}
                  onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                  placeholder="3150 Paradise Rd, Las Vegas, NV 89109, USA"
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">İptal</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FairCentersPage;