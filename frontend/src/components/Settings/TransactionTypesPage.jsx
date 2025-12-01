import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TransactionTypesPage = () => {
  const [types, setTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactionTypes();
  }, []);

  const loadTransactionTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/transaction-types`);
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error('Failed to load transaction types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Bu işlem türünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/settings/transaction-types/${typeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTypes(types.filter(t => t.id !== typeId));
        alert('✅ İşlem türü silindi');
      } else {
        const error = await response.text();
        alert(`❌ Hata: ${error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Silme işlemi başarısız');
    }
  };

  const filteredTypes = types.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          🔄 İşlem Türleri
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          + Yeni Tür Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Tür ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Türler Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTypes.map(type => (
          <TransactionTypeCard
            key={type.id}
            type={type}
            onEdit={() => setEditingType(type)}
            onDelete={() => handleDelete(type.id)}
          />
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz işlem türü eklenmemiş'}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <EditTypeModal
          onClose={() => setShowAddModal(false)}
          onSave={loadTransactionTypes}
        />
      )}
      {editingType && (
        <EditTypeModal
          type={editingType}
          onClose={() => setEditingType(null)}
          onSave={loadTransactionTypes}
        />
      )}
    </div>
  );
};

const TransactionTypeCard = ({ type, onEdit, onDelete }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    teal: 'bg-teal-50 border-teal-200',
    orange: 'bg-orange-50 border-orange-200',
    gray: 'bg-gray-50 border-gray-200',
    pink: 'bg-pink-50 border-pink-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200'
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses[type.color] || 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{type.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{type.name}</h3>
            <span className="text-xs text-gray-500">
              {type.subTypes?.length || 0} Alt Tür
            </span>
          </div>
        </div>
        {type.isSystem && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
            Sistem
          </span>
        )}
      </div>

      {/* Description */}
      {type.description && (
        <p className="text-sm text-gray-600 mb-3">{type.description}</p>
      )}

      {/* Alt Türler */}
      <div className="flex flex-wrap gap-1 mb-4 min-h-[60px]">
        {type.subTypes?.slice(0, 4).map((sub, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-white rounded text-xs text-gray-600 border"
          >
            {sub.name}
          </span>
        ))}
        {type.subTypes?.length > 4 && (
          <span className="px-2 py-1 text-xs text-gray-400">
            +{type.subTypes.length - 4} daha
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ✏️ Düzenle
        </button>
        {!type.isSystem && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            🗑️ Sil
          </button>
        )}
      </div>
    </div>
  );
};

const EditTypeModal = ({ type, onClose, onSave }) => {
  const [name, setName] = useState(type?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('İşlem türü adı zorunludur');
      return;
    }

    setSaving(true);

    try {
      const data = {
        name
      };

      const url = type
        ? `${API_URL}/api/settings/transaction-types/${type.id}`
        : `${API_URL}/api/settings/transaction-types`;

      const response = await fetch(url, {
        method: type ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert(type ? '✅ İşlem türü güncellendi' : '✅ İşlem türü oluşturuldu');
        onSave();
        onClose();
      } else {
        const error = await response.text();
        alert(`❌ Hata: ${error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Kaydetme işlemi başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {type ? 'İşlem Türü Düzenle' : 'Yeni İşlem Türü Ekle'}
          </h2>

          {/* Tür Adı */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İşlem Türü Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Örn: Tahsilat, Ödeme, Transfer..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={saving}
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionTypesPage;
