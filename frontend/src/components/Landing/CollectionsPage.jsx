import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus, Edit2, Trash2, Database, X, Save } from 'lucide-react';

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create', 'form'
  const [editedDoc, setEditedDoc] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const docsPerPage = 20;

  // Form data for users collection
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    department: '',
    phone: '',
    company_id: '',
    is_verified: true,
    is_active: true
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const docString = JSON.stringify(doc).toLowerCase();
    
    return docString.includes(searchLower);
  });

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Load documents when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadDocuments();
      loadStats();
    }
  }, [selectedCollection, currentPage]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/collections`);
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!selectedCollection) return;
    
    try {
      setLoading(true);
      const skip = (currentPage - 1) * docsPerPage;
      const response = await fetch(
        `${BACKEND_URL}/api/admin/collections/${selectedCollection.name}?skip=${skip}&limit=${docsPerPage}`
      );
      const data = await response.json();
      setDocuments(data.documents || []);
      setTotalDocs(data.total || 0);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedCollection) return;
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/collections/${selectedCollection.name}/stats`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    setCurrentPage(1);
    setDocuments([]);
    setStats(null);
  };

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setEditedDoc(JSON.stringify(doc, null, 2));
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditDocument = (doc) => {
    setSelectedDoc(doc);
    setEditedDoc(JSON.stringify(doc, null, 2));
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCreateDocument = () => {
    setSelectedDoc(null);
    
    // Check if this collection has a special form
    if (selectedCollection.name === 'users') {
      // Reset form data
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'user',
        department: '',
        phone: '',
        company_id: '',
        is_verified: true,
        is_active: true
      });
      setModalMode('form');
    } else {
      // Use JSON editor for other collections
      setEditedDoc(JSON.stringify({}, null, 2));
      setModalMode('create');
    }
    
    setShowModal(true);
  };

  const handleSaveDocument = async () => {
    try {
      let dataToSave;
      
      if (modalMode === 'form') {
        // Use form data for users collection
        dataToSave = formData;
      } else {
        // Parse JSON for other collections
        dataToSave = JSON.parse(editedDoc);
      }
      
      if (modalMode === 'create' || modalMode === 'form') {
        // Create new document
        const response = await fetch(
          `${BACKEND_URL}/api/admin/collections/${selectedCollection.name}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
          }
        );
        
        if (response.ok) {
          alert('Doküman başarıyla oluşturuldu');
          loadDocuments();
          setShowModal(false);
        } else {
          const error = await response.json();
          alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
        }
      } else if (modalMode === 'edit') {
        // Update existing document
        const docId = selectedDoc.id || selectedDoc._id;
        const response = await fetch(
          `${BACKEND_URL}/api/admin/collections/${selectedCollection.name}/${docId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
          }
        );
        
        if (response.ok) {
          alert('Doküman başarıyla güncellendi');
          loadDocuments();
          setShowModal(false);
        } else {
          const error = await response.json();
          alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
        }
      }
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm('Bu dokümanı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const docId = doc.id || doc._id;
      const response = await fetch(
        `${BACKEND_URL}/api/admin/collections/${selectedCollection.name}/${docId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        alert('Doküman başarıyla silindi');
        loadDocuments();
      }
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalDocs / docsPerPage);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Collections List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Collections
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Collection ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !selectedCollection ? (
            <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCollections.map((collection) => (
                <div
                  key={collection.name}
                  onClick={() => handleSelectCollection(collection)}
                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedCollection?.name === collection.name ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 text-sm">{collection.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {collection.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <div className="font-semibold mb-1">Toplam Collection:</div>
            <div className="text-2xl font-bold text-blue-600">{collections.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content - Documents */}
      <div className="flex-1 flex flex-col">
        {selectedCollection ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selectedCollection.name}</h1>
                  <p className="text-sm text-gray-600">{totalDocs} doküman kayıtlı</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadDocuments}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Yenile
                  </button>
                  <button
                    onClick={handleCreateDocument}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Doküman
                  </button>
                </div>
              </div>

              {/* Search Bar for Documents */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Dokümanlarda ara (email, name, username, rol...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Toplam Kayıt</div>
                    <div className="text-lg font-bold text-gray-800">{stats.count}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Boyut</div>
                    <div className="text-lg font-bold text-gray-800">
                      {(stats.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Ort. Doküman</div>
                    <div className="text-lg font-bold text-gray-800">
                      {(stats.avgObjSize / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">Index Sayısı</div>
                    <div className="text-lg font-bold text-gray-800">{stats.indexes}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Bu collection'da doküman yok</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Arama sonucu bulunamadı</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Aramayı temizle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-2">
                    {searchTerm && `${filteredDocuments.length} / ${documents.length} doküman gösteriliyor`}
                  </div>
                  {filteredDocuments.map((doc, index) => (
                    <div
                      key={doc._id || doc.id || index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            ID: {doc.id || doc._id || 'N/A'}
                          </div>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {JSON.stringify(doc, null, 2)}
                          </pre>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Görüntüle"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditDocument(doc)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Sayfa {currentPage} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Bir collection seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'form' ? 'Yeni Kullanıcı Oluştur' : 
                 modalMode === 'create' ? 'Yeni Doküman Oluştur' : 
                 modalMode === 'edit' ? 'Doküman Düzenle' : 'Doküman Görüntüle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalMode === 'form' ? (
                // User Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ornek@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Kullanıcının tam adı"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şifre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Güçlü bir şifre belirleyin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şirket ID
                    </label>
                    <input
                      type="text"
                      value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                      placeholder="Şirket ID (opsiyonel)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departman
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="IT, Satış, Pazarlama, vb."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+90 555 123 45 67"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_verified}
                        onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Email doğrulanmış</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Aktif kullanıcı</span>
                    </label>
                  </div>
                </div>
              ) : (
                // JSON Editor
                <textarea
                  value={editedDoc}
                  onChange={(e) => setEditedDoc(e.target.value)}
                  readOnly={modalMode === 'view'}
                  className="w-full h-full min-h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'monospace' }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {modalMode === 'view' ? 'Kapat' : 'İptal'}
              </button>
              {modalMode !== 'view' && (
                <button
                  onClick={handleSaveDocument}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {modalMode === 'form' ? 'Kullanıcı Oluştur' : 'Kaydet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
