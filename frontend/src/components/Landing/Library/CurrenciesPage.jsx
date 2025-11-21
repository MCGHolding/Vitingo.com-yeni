import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const CurrenciesPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ code: '', name: '', symbol: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/currencies`);
      const data = await response.json();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading currencies:', error);
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCurrency.code.trim() || !newCurrency.name.trim() || !newCurrency.symbol.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/currencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          code: newCurrency.code.trim().toUpperCase(),
          name: newCurrency.name.trim(),
          symbol: newCurrency.symbol.trim()
        })
      });

      if (response.ok) {
        await loadCurrencies();
        setNewCurrency({ code: '', name: '', symbol: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding currency:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.code.trim() || !editValue.name.trim() || !editValue.symbol.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/currencies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          code: editValue.code.trim().toUpperCase(),
          name: editValue.name.trim(),
          symbol: editValue.symbol.trim()
        })
      });

      if (response.ok) {
        await loadCurrencies();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu para birimini silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/currencies/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCurrencies();
      }
    } catch (error) {
      console.error('Error deleting currency:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Para Birimleri</h2>
          <p className="text-gray-600 mt-1">{currencies.length} para birimi kayıtlı</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Para Birimi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Kod</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Para Birimi Adı</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Sembol</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currencies.map((currency) => (
              <tr key={currency.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-semibold">
                  {editingId === currency.id ? (
                    <input
                      type="text"
                      value={editValue.code}
                      onChange={(e) => setEditValue({ ...editValue, code: e.target.value.toUpperCase() })}
                      className="px-3 py-1 border border-blue-500 rounded-lg w-20"
                      maxLength={3}
                    />
                  ) : (
                    currency.code
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === currency.id ? (
                    <input
                      type="text"
                      value={editValue.name}
                      onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg"
                    />
                  ) : (
                    currency.name
                  )}
                </td>
                <td className="px-6 py-4 text-lg">
                  {editingId === currency.id ? (
                    <input
                      type="text"
                      value={editValue.symbol}
                      onChange={(e) => setEditValue({ ...editValue, symbol: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg w-16"
                    />
                  ) : (
                    currency.symbol
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === currency.id ? (
                      <>
                        <button onClick={() => handleEdit(currency.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
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
                            setEditingId(currency.id);
                            setEditValue({ code: currency.code, name: currency.name, symbol: currency.symbol });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(currency.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
            <h3 className="text-xl font-bold mb-4">Yeni Para Birimi Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kod (3 karakter)</label>
                <input
                  type="text"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={3}
                  className="w-full px-4 py-3 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi Adı</label>
                <input
                  type="text"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  placeholder="ABD Doları"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sembol</label>
                <input
                  type="text"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  placeholder="$"
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

export default CurrenciesPage;