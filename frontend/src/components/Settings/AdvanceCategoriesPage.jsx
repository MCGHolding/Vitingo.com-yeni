import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Check, Info } from 'lucide-react';
import SuccessModal from './SuccessModal';

const CategoryCard = ({ category, isEditing, onEdit, onSave, onCancel, onDelete, onToggleStatus }) => {
  const [editName, setEditName] = useState(category.name);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-semibold">
            {category.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Kategori Adı"
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSave(category.id, editName);
                } else if (e.key === 'Escape') {
                  onCancel();
                }
              }}
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {category.name}
            </h3>
          )}
        </div>

        {/* Status Toggle */}
        <div className="flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={category.status === 'active'}
              onChange={() => onToggleStatus(category.id, category.status)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-600"></div>
            <span className="ml-2 text-xs font-medium text-gray-700">
              {category.status === 'active' ? 'Aktif' : 'Pasif'}
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(category.id, editName)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Kaydet"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="İptal"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(category)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(category.id, category.name)}
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

const AdvanceCategoriesPage = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                    process.env.REACT_APP_BACKEND_URL || 
                    import.meta.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/advance-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Kategoriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Lütfen kategori adı girin');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/advance-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setShowAddModal(false);
        setNewCategoryName('');
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.detail || 'Kategori eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleUpdateCategory = async (categoryId, newName) => {
    if (!newName.trim()) {
      alert('Lütfen kategori adı girin');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/advance-categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setEditingCategory(null);
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.detail || 'Kategori güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/advance-categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.detail || 'Kategori silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${backendUrl}/api/advance-categories/${categoryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.detail || 'Durum değiştirilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Bir hata oluştu');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Avans Kategorileri</h1>
                <p className="text-sm text-gray-500 mt-1">Toplam {categories.length} kategori</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Yeni Kategori Ekle
            </button>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-3 mb-8">
          {filteredCategories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              isEditing={editingCategory?.id === category.id}
              onEdit={(cat) => setEditingCategory(cat)}
              onSave={(id, name) => handleUpdateCategory(id, name)}
              onCancel={() => setEditingCategory(null)}
              onDelete={(id, name) => handleDeleteCategory(id, name)}
              onToggleStatus={(id, status) => handleToggleStatus(id, status)}
            />
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Kategori bulunamadı</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p><span className="font-semibold">Durum:</span> Toggle ile aktif/pasif yapabilirsiniz</p>
              <p><span className="font-semibold">Düzenleme:</span> Kategori adını değiştirebilirsiniz</p>
              <p><span className="font-semibold">Silme:</span> Kullanılmayan kategoriler silinebilir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Kategori Ekle</h2>
              <button onClick={() => { setShowAddModal(false); setNewCategoryName(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adını girin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
              />
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => { setShowAddModal(false); setNewCategoryName(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="inline h-4 w-4 mr-1" />İptal
              </button>
              <button onClick={handleAddCategory} className="flex-1 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors">
                <Check className="inline h-4 w-4 mr-1" />Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => { setShowSuccessModal(false); setSuccessMessage(''); }}
        />
      )}
    </div>
  );
};

export default AdvanceCategoriesPage;