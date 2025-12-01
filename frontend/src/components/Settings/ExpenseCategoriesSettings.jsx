import React, { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ExpenseCategoriesSettings = () => {
  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subCategories: []
  });
  const [newSubCategory, setNewSubCategory] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Kategorileri yükle
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/expense-categories?search=${searchTerm}`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchCategories]);
  
  // Modal aç - Yeni
  const openCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '📁',
      subCategories: []
    });
    setFormErrors({});
    setNewSubCategory('');
    setShowModal(true);
  };
  
  // Modal aç - Düzenle
  const openEditModal = (category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setFormData({
      name: category.name,
      subCategories: category.subCategories || []
    });
    setFormErrors({});
    setNewSubCategory('');
    setShowModal(true);
  };
  
  // Alt kategori ekle
  const addSubCategory = () => {
    const trimmed = newSubCategory.trim();
    if (!trimmed) return;
    
    // Duplicate kontrolü
    const exists = formData.subCategories.some(
      sub => sub.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setFormErrors({ subCategory: 'Bu alt kategori zaten eklenmiş' });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        { id: `temp_${Date.now()}`, name: trimmed }
      ]
    }));
    setNewSubCategory('');
    setFormErrors({});
  };
  
  // Enter ile alt kategori ekle
  const handleSubCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubCategory();
    }
  };
  
  // Alt kategori sil
  const removeSubCategory = (subId) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(sub => sub.id !== subId)
    }));
  };
  
  // Kaydet
  const handleSave = async () => {
    // Validasyon
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Kategori adı zorunludur';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSaving(true);
    
    try {
      const url = modalMode === 'create'
        ? `${API_URL}/api/settings/expense-categories`
        : `${API_URL}/api/settings/expense-categories/${editingCategory.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          icon: formData.icon,
          subCategories: formData.subCategories.map(sub => ({
            id: sub.id?.startsWith('temp_') ? null : sub.id,
            name: sub.name
          }))
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Kaydetme başarısız');
      }
      
      setShowModal(false);
      fetchCategories();
      
    } catch (error) {
      setFormErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };
  
  // Sil
  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    setDeleting(true);
    
    try {
      // Eski kategoriler için name kullan, yeni kategoriler için id kullan
      const categoryIdentifier = deletingCategory.id || deletingCategory.name;
      
      const response = await fetch(
        `${API_URL}/api/settings/expense-categories/${encodeURIComponent(categoryIdentifier)}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Silme başarısız');
      }
      
      setShowDeleteModal(false);
      setDeletingCategory(null);
      fetchCategories();
      
    } catch (error) {
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div className="expense-categories-settings">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏷️</span>
          <h2 className="text-xl font-semibold text-gray-800">Harcama Kategorileri</h2>
        </div>
        
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
        >
          <span>+</span>
          Yeni Kategori Ekle
        </button>
      </div>
      
      {/* ========== ARAMA ========== */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kategori ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* ========== KATEGORİ LİSTESİ ========== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-48" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
          <span className="text-4xl mb-3 block">📁</span>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kategori eklenmemiş'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              + İlk kategoriyi ekle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <div
              key={category.id || category.name}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all flex flex-col h-full"
            >
              {/* Üst - İkon ve Başlık */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">{category.name}</h3>
                    <div className="flex gap-1 mt-1">
                      {!category.id && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Eski Veri
                        </span>
                      )}
                      {category.isSystem && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          Sistem
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Orta - Alt kategoriler */}
              <div className="flex-1 mb-3">
                {category.subCategories?.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Alt Kategoriler ({category.subCategories.length}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {category.subCategories.slice(0, 4).map(sub => (
                        <span
                          key={sub.id}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                        >
                          {sub.name}
                        </span>
                      ))}
                      {category.subCategories.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          +{category.subCategories.length - 4} daha
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Alt kategori yok</p>
                )}
              </div>
              
              {/* Alt - Aksiyon butonları */}
              <div className="flex items-center gap-2 pt-3 border-t">
                {!category.id ? (
                  <>
                    <button
                      onClick={() => {
                        setDeletingCategory(category);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      🗑️ Sil
                    </button>
                    <div className="text-xs text-yellow-600 italic flex-1 text-center">
                      Sonra yeniden oluştur
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      ✏️ Düzenle
                    </button>
                    
                    {!category.isSystem && (
                      <button
                        onClick={() => {
                          setDeletingCategory(category);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      >
                        🗑️ Sil
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* ========== EKLEME/DÜZENLEME MODAL ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalMode === 'create' ? 'Yeni Kategori Ekle' : 'Kategori Güncelle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Genel hata */}
              {formErrors.general && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ {formErrors.general}
                </div>
              )}
              
              {/* Kategori Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setFormErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="Örn: Konaklamalar, Ulaşım, Yemek"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              
              {/* Alt Kategoriler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Kategoriler
                </label>
                
                {/* Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubCategory}
                    onChange={(e) => {
                      setNewSubCategory(e.target.value);
                      setFormErrors(prev => ({ ...prev, subCategory: null }));
                    }}
                    onKeyDown={handleSubCategoryKeyDown}
                    placeholder="Alt kategori adı girin ve Enter'a basın"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={addSubCategory}
                    disabled={!newSubCategory.trim()}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>+</span> Ekle
                  </button>
                </div>
                
                {formErrors.subCategory && (
                  <p className="text-red-500 text-sm mb-2">{formErrors.subCategory}</p>
                )}
                
                {/* Eklenmiş alt kategoriler */}
                {formData.subCategories.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Eklenmiş Alt Kategoriler ({formData.subCategories.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.subCategories.map(sub => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {sub.name}
                          <button
                            type="button"
                            onClick={() => removeSubCategory(sub.id)}
                            className="text-green-600 hover:text-green-800 font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>⏳ Kaydediliyor...</>
                ) : (
                  <>💾 {modalMode === 'create' ? 'Ekle' : 'Güncelle'}</>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* ========== SİLME MODAL ========== */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">🗑️</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              Kategori Silinecek
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              <span className="font-medium">"{deletingCategory.name}"</span> kategorisini silmek istediğinizden emin misiniz?
              {deletingCategory.subCategories?.length > 0 && (
                <span className="block text-sm text-gray-500 mt-1">
                  ({deletingCategory.subCategories.length} alt kategori de silinecek)
                </span>
              )}
            </p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '⏳ Siliniyor...' : '🗑️ Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ExpenseCategoriesSettings;
