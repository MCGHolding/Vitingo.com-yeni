import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Eye, Trash2, Search } from 'lucide-react';
import CreateContractModal from './CreateContractModal';

const MyContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/contracts/my-contracts`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tüm Sözleşmeler</h2>
          <p className="text-sm text-gray-600 mt-1">{contracts.length} sözleşme</p>
        </div>
        <button
          onClick={() => {
            alert('Yeni Sözleşme Oluşturma\n\nBu özellik yakında eklenecek...\n\n(Şablonlardan birini seçip form doldurarak sözleşme oluşturabileceksiniz)');
          }}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Sözleşme
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Sözleşme ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz sözleşme yok</h3>
          <p className="mt-1 text-sm text-gray-500">İlk sözleşmeyi oluşturmak için "Yeni Sözleşme" butonuna tıklayın</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-5 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-medium">
                  {contract.status === 'generated' ? 'Oluşturuldu' : contract.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{contract.contract_name}</h3>
              <p className="text-sm text-gray-600 mb-1">Şablon: {contract.template_name}</p>
              <p className="text-xs text-gray-500 mb-4">
                {new Date(contract.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    alert(`Sözleşme İndirme: ${contract.contract_name}\n\nBu özellik yakında eklenecek...`);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                  title="İndir"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    alert(`Sözleşme Görüntüleme: ${contract.contract_name}\n\nBu özellik yakında eklenecek...`);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
                  title="Görüntüle"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`"${contract.contract_name}" sözleşmesini silmek istediğinizden emin misiniz?`)) {
                      alert('Silme işlemi yakında eklenecek...');
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyContractsPage;