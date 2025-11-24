import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react';
import SuccessModal from './SuccessModal';

const ExpenseCategoriesPage = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/expense-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        const expanded = {};
        data.forEach(cat => { if (!cat.parent_id) expanded[cat.id] = true; });
        setExpandedCategories(expanded);
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
      const response = await fetch(`${backendUrl}/api/expense-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, parent_id: parentCategoryId || null })
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        setShowSuccessModal(true);
        setShowAddModal(false);
        setNewCategoryName('');
        setParentCategoryId('');
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
      const response = await fetch(`${backendUrl}/api/expense-categories/${categoryId}`, {
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
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    try {
      const response = await fetch(`${backendUrl}/api/expense-categories/${categoryId}`, { method: 'DELETE' });
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

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const getParentCategories = () => categories.filter(cat => !cat.parent_id);
  const getSubCategories = (parentId) => categories.filter(cat => cat.parent_id === parentId);

  const CategoryCard = ({ category, isParent, isEditing, onEdit, onSave, onCancel, onDelete, onToggle, isExpanded }) => {
    const [editName, setEditName] = useState(category.name);
    const subCategories = getSubCategories(category.id);

    React.useEffect(() => {
      setEditName(category.name);
    }, [category.name]);

    const handleToggleClick = (e) => {
      e.stopPropagation();
      console.log('Toggle clicked for:', category.id);
      onToggle(category.id);
    };

    const handleEditClick = (e) => {
      e.stopPropagation();
      console.log('Edit clicked for:', category.id, category.name);
      onEdit(category);
    };

    const handleDeleteClick = (e) => {
      e.stopPropagation();
      console.log('Delete clicked for:', category.id, category.name);
      onDelete(category.id, category.name);
    };

    const handleSaveClick = (e) => {
      e.stopPropagation();
      console.log('Save clicked:', editName);
      onSave(category.id, editName);
    };

    const handleCancelClick = (e) => {
      e.stopPropagation();
      console.log('Cancel clicked');
      onCancel();
    };

    return (
      <div className={`${isParent ? 'bg-white border border-gray-200' : 'bg-gray-50 border-l-4 border-indigo-400 ml-8'} rounded-lg p-3`}>
        <div className="flex items-center gap-2">
          {isParent && subCategories.length > 0 && (
            <button onClick={handleToggleClick} className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${isParent ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'} flex items-center justify-center text-white font-semibold text-sm`}>
            {category.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm" 
                autoFocus 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') {
                    handleSaveClick(e);
                  } else if (e.key === 'Escape') {
                    handleCancelClick(e);
                  }
                }} 
              />
            ) : (
              <h3 className="text-sm font-semibold text-gray-900 truncate">{category.name}</h3>
            )}
          </div>
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <button onClick={handleSaveClick} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Kaydet">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={handleCancelClick} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="İptal">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEditClick} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Düzenle">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button onClick={handleDeleteClick} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Sil">
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
        {isParent && isExpanded && subCategories.length > 0 && (
          <div className="mt-2 space-y-2">
            {subCategories.map(subCat => (
              <CategoryCard 
                key={subCat.id} 
                category={subCat} 
                isParent={false} 
                isEditing={isEditing && editingCategory?.id === subCat.id} 
                onEdit={onEdit} 
                onSave={onSave} 
                onCancel={onCancel} 
                onDelete={onDelete} 
                onToggle={onToggle} 
                isExpanded={false} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Yükleniyor...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
              <div><h1 className="text-2xl font-bold text-gray-900">Harcama Kategorileri</h1><p className="text-sm text-gray-500 mt-1">Toplam {categories.length} kategori</p></div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus className="h-5 w-5" />Yeni Kategori Ekle</button>
          </div>
          <div className="mt-4 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Kategori ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3 mb-8">
          {getParentCategories().map(category => (
            <CategoryCard key={category.id} category={category} isParent={true} isEditing={editingCategory?.id === category.id} onEdit={(cat) => setEditingCategory(cat)} onSave={(id, name) => handleUpdateCategory(id, name)} onCancel={() => setEditingCategory(null)} onDelete={(id, name) => handleDeleteCategory(id, name)} onToggle={toggleExpand} isExpanded={expandedCategories[category.id]} />
          ))}
        </div>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="text-xl font-semibold text-gray-900">Yeni Kategori Ekle</h2><button onClick={() => { setShowAddModal(false); setNewCategoryName(''); setParentCategoryId(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-500" /></button></div>
            <div className="px-6 py-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label><input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Kategori adını girin" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Üst Kategori (Opsiyonel)</label><select value={parentCategoryId} onChange={(e) => setParentCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"><option value="">Ana Kategori</option>{getParentCategories().map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200"><button onClick={() => { setShowAddModal(false); setNewCategoryName(''); setParentCategoryId(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"><X className="inline h-4 w-4 mr-1" />İptal</button><button onClick={handleAddCategory} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Check className="inline h-4 w-4 mr-1" />Ekle</button></div>
          </div>
        </div>
      )}
      {showSuccessModal && (<SuccessModal message={successMessage} onClose={() => { setShowSuccessModal(false); setSuccessMessage(''); }} />)}
    </div>
  );
};

export default ExpenseCategoriesPage;