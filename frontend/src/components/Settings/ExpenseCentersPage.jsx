import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, GripVertical, X, Check, Info } from 'lucide-react';
import SuccessModal from './SuccessModal';

// Expense Center Card Component
const ExpenseCenterCard = ({ center, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  const [editName, setEditName] = useState(center.name);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
            {center.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Center Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Masraf Merkezi Adı"
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Enter pressed, saving:', editName);
                  onSave(center.id, editName);
                } else if (e.key === 'Escape') {
                  console.log('Escape pressed, cancelling');
                  onCancel();
                }
              }}
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {center.name}
              </h3>
              <p className="text-xs text-gray-500">Kod: {center.code}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  console.log('Save button clicked:', editName);
                  onSave(center.id, editName);
                }}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Kaydet"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  console.log('Cancel button clicked');
                  onCancel();
                }}
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
                  console.log('Edit button clicked for:', center.id, center.name);
                  onEdit(center);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  console.log('Delete button clicked for:', center.id, center.name);
                  onDelete(center.id, center.name);
                }}
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

const ExpenseCentersPage = ({ onBack }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterCode, setNewCenterCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/expense-centers`);
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      }
    } catch (error) {
      console.error('Error fetching expense centers:', error);
      alert('Masraf merkezleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCenter = async () => {
    if (!newCenterName.trim() || !newCenterCode.trim()) {
      alert('Lütfen masraf merkezi adı ve kodu girin');
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/expense-centers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCenterName, code: newCenterCode })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setShowAddModal(false);
        setNewCenterName('');
        setNewCenterCode('');
        fetchCenters();
      } else {
        const error = await response.json();
        alert(error.detail || 'Masraf merkezi eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error adding expense center:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleUpdateCenter = async (centerId, newName, newCode) => {
    if (!newName.trim() || !newCode.trim()) {
      alert('Lütfen masraf merkezi adı ve kodu girin');
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('Updating expense center:', centerId, newName, newCode);

      const response = await fetch(`${backendUrl}/api/expense-centers/${centerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, code: newCode })
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Update response data:', data);
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setEditingCenter(null);
        fetchCenters();
      } else {
        const error = await response.json();
        console.error('Update error:', error);
        alert(error.detail || 'Masraf merkezi güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating expense center:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeleteCenter = async (centerId, centerName) => {
    if (!confirm(`"${centerName}" masraf merkezini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('Deleting expense center:', centerId, centerName);

      const response = await fetch(`${backendUrl}/api/expense-centers/${centerId}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Delete response data:', data);
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        fetchCenters();
      } else {
        const error = await response.json();
        console.error('Delete error:', error);
        alert(error.detail || 'Masraf merkezi silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting expense center:', error);
      alert('Bir hata oluştu');
    }
  };

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                <h1 className="text-2xl font-bold text-gray-900">Masraf Merkezleri</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Toplam {centers.length} masraf merkezi
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Masraf Merkezi Ekle
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Masraf merkezi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredCenters.map(center => (
            <ExpenseCenterCard
              key={center.id}
              center={center}
              isEditing={editingCenter?.id === center.id}
              onEdit={(c) => setEditingCenter(c)}
              onSave={(id, name, code) => handleUpdateCenter(id, name, code)}
              onCancel={() => setEditingCenter(null)}
              onDelete={(id, name) => handleDeleteCenter(id, name)}
            />
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Masraf merkezi bulunamadı</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p><span className="font-semibold">Arama:</span> Masraf merkezlerini ad veya kod ile arayabilirsiniz</p>
              <p><span className="font-semibold">Yeni Merkez:</span> Sisteme yeni masraf merkezleri ekleyebilirsiniz</p>
              <p><span className="font-semibold">Düzenleme:</span> Mevcut masraf merkezlerinin ad ve kodlarını değiştirebilirsiniz</p>
              <p><span className="font-semibold">Silme:</span> Kullanılmayan masraf merkezleri silinebilir</p>
              <p><span className="font-semibold">Kod:</span> Her masraf merkezinin benzersiz bir kodu olmalıdır</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Masraf Merkezi Ekle</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCenterName('');
                  setNewCenterCode('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masraf Merkezi Adı
                </label>
                <input
                  type="text"
                  value={newCenterName}
                  onChange={(e) => setNewCenterName(e.target.value)}
                  placeholder="Örn: Pazarlama Giderleri"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masraf Merkezi Kodu
                </label>
                <input
                  type="text"
                  value={newCenterCode}
                  onChange={(e) => setNewCenterCode(e.target.value)}
                  placeholder="Örn: PAZ-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCenter();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCenterName('');
                  setNewCenterCode('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="inline h-4 w-4 mr-1" />
                İptal
              </button>
              <button
                onClick={handleAddCenter}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Check className="inline h-4 w-4 mr-1" />
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessMessage('');
          }}
        />
      )}
    </div>
  );
};

export default ExpenseCentersPage;
