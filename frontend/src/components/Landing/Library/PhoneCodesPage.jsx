import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const PhoneCodesPage = () => {
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ country: '', code: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhoneCode, setNewPhoneCode] = useState({ country: '', code: '' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadPhoneCodes();
  }, []);

  const loadPhoneCodes = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/library/phone-codes`);
      const data = await response.json();
      setPhoneCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading phone codes:', error);
      setPhoneCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newPhoneCode.country.trim() || !newPhoneCode.code.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/phone-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          country: newPhoneCode.country.trim(),
          code: newPhoneCode.code.trim()
        })
      });

      if (response.ok) {
        await loadPhoneCodes();
        setNewPhoneCode({ country: '', code: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding phone code:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.country.trim() || !editValue.code.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/phone-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          country: editValue.country.trim(),
          code: editValue.code.trim()
        })
      });

      if (response.ok) {
        await loadPhoneCodes();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating phone code:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu telefon kodunu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/library/phone-codes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadPhoneCodes();
      }
    } catch (error) {
      console.error('Error deleting phone code:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Telefon Kodları</h2>
          <p className="text-gray-600 mt-1">{phoneCodes.length} telefon kodu kayıtlı</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Yeni Telefon Kodu
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Ülke</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Telefon Kodu</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {phoneCodes.map((phoneCode) => (
              <tr key={phoneCode.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === phoneCode.id ? (
                    <input
                      type="text"
                      value={editValue.country}
                      onChange={(e) => setEditValue({ ...editValue, country: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg"
                    />
                  ) : (
                    phoneCode.country
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === phoneCode.id ? (
                    <input
                      type="text"
                      value={editValue.code}
                      onChange={(e) => setEditValue({ ...editValue, code: e.target.value })}
                      className="px-3 py-1 border border-blue-500 rounded-lg w-24 font-mono"
                    />
                  ) : (
                    <span className="font-mono font-semibold text-blue-600">{phoneCode.code}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === phoneCode.id ? (
                      <>
                        <button onClick={() => handleEdit(phoneCode.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
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
                            setEditingId(phoneCode.id);
                            setEditValue({ country: phoneCode.country, code: phoneCode.code });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(phoneCode.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
            <h3 className="text-xl font-bold mb-4">Yeni Telefon Kodu Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                <input
                  type="text"
                  value={newPhoneCode.country}
                  onChange={(e) => setNewPhoneCode({ ...newPhoneCode, country: e.target.value })}
                  placeholder="Türkiye"
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Kodu *</label>
                <input
                  type="text"
                  value={newPhoneCode.code}
                  onChange={(e) => setNewPhoneCode({ ...newPhoneCode, code: e.target.value })}
                  placeholder="+90"
                  className="w-full px-4 py-3 border rounded-lg font-mono"
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

export default PhoneCodesPage;
