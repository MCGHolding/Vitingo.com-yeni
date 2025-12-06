import React, { useState, useEffect } from 'react';

const HandoverReceipts = () => {
  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
  
  // States
  const [receipts, setReceipts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    projectId: '',
    language: 'en',
    handoverDate: new Date().toISOString().split('T')[0],
    standType: 'wooden',
    notes: ''
  });
  
  // Load data
  useEffect(() => {
    loadReceipts();
    loadProjects();
  }, []);
  
  const loadReceipts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/handover-receipts`);
      if (response.ok) {
        const data = await response.json();
        setReceipts(data.receipts || []);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadProjects = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly or {projects: []}
        const projectList = Array.isArray(data) ? data : (data.projects || []);
        setProjects(projectList);
        console.log('✅ Loaded projects:', projectList.length);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };
  
  const handleCreate = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/handover-receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Teslim belgesi oluşturuldu: ${result.receiptNumber}`);
        setShowCreateModal(false);
        setFormData({
          projectId: '',
          language: 'en',
          handoverDate: new Date().toISOString().split('T')[0],
          standType: 'wooden',
          notes: ''
        });
        loadReceipts();
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('❌ Hata: ' + error.message);
    }
  };
  
  const handleSend = async (receipt, method = 'email') => {
    try {
      const response = await fetch(`${backendUrl}/api/handover-receipts/${receipt.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, email: receipt.customerEmail })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (method === 'link') {
          const fullUrl = `${window.location.origin}/handover/${result.publicToken}`;
          navigator.clipboard.writeText(fullUrl);
          alert(`✅ Link kopyalandı:\n${fullUrl}`);
        } else {
          alert('✅ Belge gönderildi!');
        }
        
        loadReceipts();
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
    }
  };
  
  const handleDelete = async (receiptId) => {
    if (!window.confirm('Bu teslim belgesini silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/handover-receipts/${receiptId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadReceipts();
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Taslak' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gönderildi' },
      viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Görüntülendi' },
      signed: { bg: 'bg-green-100', text: 'text-green-700', label: 'İmzalandı' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Tamamlandı' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };
  
  const filteredReceipts = receipts.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm && !r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  
  return (
    <div className="p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl text-white">📋</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teslim Belgeleri</h1>
            <p className="text-gray-500">Stand teslim belgelerini oluşturun ve yönetin</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Yeni Teslim Belgesi</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Müşteri, proje veya belge no ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            {[
              { value: 'all', label: 'Tümü' },
              { value: 'draft', label: 'Taslak' },
              { value: 'sent', label: 'Gönderildi' },
              { value: 'viewed', label: 'Görüntülendi' },
              { value: 'signed', label: 'İmzalandı' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  filterStatus === status.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
          
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Toplam', count: receipts.length, color: 'gray', icon: '📋' },
          { label: 'Taslak', count: receipts.filter(r => r.status === 'draft').length, color: 'gray', icon: '📝' },
          { label: 'Gönderildi', count: receipts.filter(r => r.status === 'sent').length, color: 'blue', icon: '📤' },
          { label: 'Görüntülendi', count: receipts.filter(r => r.status === 'viewed').length, color: 'yellow', icon: '👁️' },
          { label: 'İmzalandı', count: receipts.filter(r => r.status === 'signed').length, color: 'green', icon: '✅' }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold text-${stat.color}-600`}>{stat.count}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Receipt List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Belge No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Müşteri</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Proje / Fuar</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Teslim Tarihi</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Dil</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReceipts.map(receipt => (
              <tr key={receipt.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-gray-900">{receipt.receiptNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{receipt.customerName}</p>
                    <p className="text-xs text-gray-500">{receipt.customerEmail}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{receipt.projectName}</p>
                    <p className="text-xs text-gray-500">{receipt.exhibitionName}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {receipt.handoverDate ? new Date(receipt.handoverDate).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-lg">
                    {receipt.language === 'tr' ? '🇹🇷' : receipt.language === 'both' ? '🇹🇷🇬🇧' : '🇬🇧'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(receipt.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end space-x-2">
                    
                    {/* Önizle */}
                    <button
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowPreviewModal(true);
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                      title="Önizle"
                    >
                      👁️
                    </button>
                    
                    {/* Gönder */}
                    {receipt.status === 'draft' && (
                      <div className="relative group">
                        <button
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Gönder"
                        >
                          📤
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 min-w-[150px]">
                          <button
                            onClick={() => handleSend(receipt, 'link')}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            🔗 Link Kopyala
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* İmza Durumu */}
                    {receipt.status === 'signed' && (
                      <button
                        className="p-2 text-green-500"
                        title={`İmzalandı: ${receipt.customerSignedAt}`}
                      >
                        ✅
                      </button>
                    )}
                    
                    {/* Sil */}
                    {receipt.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    )}
                    
                  </div>
                </td>
              </tr>
            ))}
            
            {filteredReceipts.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                  <span className="text-4xl block mb-2">📋</span>
                  Henüz teslim belgesi yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Yeni Teslim Belgesi</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* Proje Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proje Seçin *
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData(prev => ({...prev, projectId: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Proje seçin...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.fairName || project.customerName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Proje seçildiğinde müşteri, fuar ve stand bilgileri otomatik doldurulur
                </p>
              </div>
              
              {/* Dil Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Belge Dili *
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'en', label: 'English', icon: '🇬🇧' },
                    { value: 'tr', label: 'Türkçe', icon: '🇹🇷' },
                    { value: 'both', label: 'Her İkisi', icon: '🇹🇷🇬🇧' }
                  ].map(lang => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, language: lang.value}))}
                      className={`flex-1 px-4 py-3 rounded-lg border transition flex items-center justify-center space-x-2 ${
                        formData.language === lang.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{lang.icon}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Teslim Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teslim Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.handoverDate}
                  onChange={(e) => setFormData(prev => ({...prev, handoverDate: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              
              {/* Stand Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Tipi
                </label>
                <select
                  value={formData.standType}
                  onChange={(e) => setFormData(prev => ({...prev, standType: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="wooden">Ahşap Stand (Wooden)</option>
                  <option value="system">Sistem Stand (System)</option>
                  <option value="mixed">Karma (Mixed)</option>
                  <option value="custom">Özel Tasarım (Custom)</option>
                </select>
              </div>
              
              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ek Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  rows={3}
                  placeholder="Belgeye eklenecek özel notlar..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                />
              </div>
              
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.projectId}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Oluştur
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Belge Önizleme</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Document Preview */}
            <div className="p-8">
              <div className="border border-gray-300 rounded-lg p-8 bg-white shadow-sm">
                
                {/* Letterhead */}
                <div className="flex items-start justify-between mb-8 pb-4 border-b">
                  <div>
                    <h1 className="text-3xl font-light text-orange-600">Quattro</h1>
                    <p className="text-xs text-gray-400">Graphics • Stand • Print • Copy</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Tel: +90 850 305 23 79</p>
                    <p>E-Mail: info@quattrostand.com</p>
                    <p>Web: www.quattrostand.com</p>
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-8">
                  {selectedReceipt.language === 'tr' ? 'Stand Teslim Tutanağı' : 'Exhibition Booth Hand Over Receipt'}
                </h2>
                
                {/* Details */}
                <div className="space-y-3 mb-8">
                  <p><strong>Customer:</strong> <span className="underline">{selectedReceipt.customerName}</span></p>
                  <p><strong>Stand design & construction Company:</strong> <span className="underline">{selectedReceipt.designCompany}</span></p>
                  <p><strong>Name of Exhibition:</strong> <span className="underline">{selectedReceipt.exhibitionName}</span></p>
                  <p><strong>Location:</strong> <span className="underline">{selectedReceipt.exhibitionLocation}</span></p>
                  <p><strong>Hall / Booth No.:</strong> <span className="underline">{selectedReceipt.hallBoothNo}</span></p>
                  <p><strong>Show date:</strong> <span className="underline">
                    {selectedReceipt.showStartDate && selectedReceipt.showEndDate 
                      ? `${new Date(selectedReceipt.showStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} - ${new Date(selectedReceipt.showEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : '-'
                    }
                  </span></p>
                </div>
                
                {/* Body Text */}
                <div className="space-y-4 mb-8 text-gray-700">
                  <p>
                    The booth has been built according to our implementation drawing and it is finished on
                    <br />
                    <strong className="underline">
                      {selectedReceipt.handoverDate 
                        ? new Date(selectedReceipt.handoverDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'
                      }
                    </strong>
                  </p>
                  <p>This receipt is considered to be one part of our contract.</p>
                  <p className="mt-6">
                    I have seen, approved and received the <strong>{selectedReceipt.standArea || '___'} m²</strong> {selectedReceipt.standType || 'wooden'} constructed stand 
                    which produced and prepared by <strong>{selectedReceipt.designCompany}</strong> on behalf of <strong>{selectedReceipt.customerName}</strong> at {selectedReceipt.exhibitionName}, {selectedReceipt.exhibitionLocation}.
                  </p>
                </div>
                
                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
                  <div>
                    <p className="font-medium mb-2">Customer:</p>
                    <p className="text-sm text-gray-600 mb-4">{selectedReceipt.customerName}</p>
                    <div className="border-b border-gray-400 h-16 mb-2">
                      {selectedReceipt.customerSignature && (
                        <img src={selectedReceipt.customerSignature} alt="Customer Signature" className="h-full" />
                      )}
                    </div>
                    <p className="text-sm">Signature:</p>
                    <p className="text-sm">Date: {selectedReceipt.customerSignedAt 
                      ? new Date(selectedReceipt.customerSignedAt).toLocaleDateString('en-GB')
                      : '_______________'
                    }</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Stand design & construction Company:</p>
                    <p className="text-sm text-gray-600 mb-4">{selectedReceipt.designCompany}</p>
                    <div className="border-b border-gray-400 h-16 mb-2 flex items-center justify-center">
                      <div className="w-20 h-20 border-2 border-blue-800 rounded-full flex items-center justify-center text-center text-xs text-blue-800 p-1">
                        QUATTRO STAND
                        <br />DUBAI - U.A.E
                      </div>
                    </div>
                    <p className="text-sm">Signature:</p>
                    <p className="text-sm">Date:</p>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between sticky bottom-0 bg-white">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Durum:</span>
                {getStatusBadge(selectedReceipt.status)}
                {selectedReceipt.sentAt && (
                  <span className="ml-2">• Gönderildi: {new Date(selectedReceipt.sentAt).toLocaleString('tr-TR')}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {selectedReceipt.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleSend(selectedReceipt, 'link');
                      setShowPreviewModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                  >
                    <span>📤</span>
                    <span>Link Kopyala</span>
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default HandoverReceipts;
