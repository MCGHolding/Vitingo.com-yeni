import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, GripVertical, X, Check, Info } from 'lucide-react';
import SuccessModal from './SuccessModal';

const PositionsPage = ({ onBack }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/positions`);
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      alert('Pozisyonlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) {
      alert('Lütfen pozisyon adı girin');
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPositionName })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setShowAddModal(false);
        setNewPositionName('');
        fetchPositions();
      } else {
        const error = await response.json();
        alert(error.detail || 'Pozisyon eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleUpdatePosition = async (positionId, newName) => {
    if (!newName.trim()) {
      alert('Lütfen pozisyon adı girin');
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('Updating position:', positionId, newName);

      const response = await fetch(`${backendUrl}/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Update response data:', data);
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setEditingPosition(null);
        fetchPositions();
      } else {
        const error = await response.json();
        console.error('Update error:', error);
        alert(error.detail || 'Pozisyon güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeletePosition = async (positionId, positionName) => {
    if (!confirm(`"${positionName}" pozisyonunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('Deleting position:', positionId, positionName);

      const response = await fetch(`${backendUrl}/api/positions/${positionId}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Delete response data:', data);
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        fetchPositions();
      } else {
        const error = await response.json();
        console.error('Delete error:', error);
        alert(error.detail || 'Pozisyon silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Bir hata oluştu');
    }
  };

  const filteredPositions = positions.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PositionCard = ({ position }) => {
    const isEditing = editingPosition?.id === position.id;
    const [editName, setEditName] = useState(position.name);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div className="cursor-move text-gray-400 hover:text-gray-600">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
              {position.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Position Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePosition(position.id, editName);
                  } else if (e.key === 'Escape') {
                    setEditingPosition(null);
                  }
                }}
              />
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {position.name}
                </h3>
                <p className="text-xs text-gray-500">ID: {position.id.substring(0, 8)}</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleUpdatePosition(position.id, editName)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Kaydet"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingPosition(null)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="İptal"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingPosition(position);
                    setEditName(position.name);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePosition(position.id, position.name)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Pozisyonları</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Toplam {positions.length} pozisyon
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Pozisyon Ekle
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pozisyon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Positions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredPositions.map(position => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>

        {filteredPositions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Pozisyon bulunamadı</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p><span className="font-semibold">Arama:</span> Pozisyonları hızlıca bulmak için arama kutusunu kullanın</p>
              <p><span className="font-semibold">Yeni Pozisyon:</span> Sisteme yeni pozisyonlar ekleyebilirsiniz</p>
              <p><span className="font-semibold">Düzenleme:</span> Mevcut pozisyonların adlarını değiştirebilirsiniz</p>
              <p><span className="font-semibold">Silme:</span> Aktif kullanıcı tarafından kullanılmayan pozisyonlar silinebilir</p>
              <p><span className="font-semibold">Sıralama:</span> Kartları sürükleyip bırakarak sıralayabilirsiniz (drag & drop)</p>
              <p><span className="font-semibold">Hiyerarşi:</span> Bu pozisyonlar kullanıcı yönetiminde kullanılır</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Pozisyon Ekle</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPositionName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pozisyon Adı
              </label>
              <input
                type="text"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Pozisyon adını girin (örn: Genel Müdür)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPosition();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPositionName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="inline h-4 w-4 mr-1" />
                İptal
              </button>
              <button
                onClick={handleAddPosition}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Check className="inline h-4 w-4 mr-1" />
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionsPage;
