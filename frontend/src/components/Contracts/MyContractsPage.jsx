import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, Download, Eye, Trash2 } from 'lucide-react';

const MyContractsPage = ({ onBack, onNavigate }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Geri
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Sözleşmelerim</h1>
        </div>
        <button
          onClick={() => onNavigate('create-contract')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Sözleşme Oluştur
        </button>
      </div>

      {/* Contracts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz sözleşme yok</h3>
          <p className="mt-1 text-sm text-gray-500">İlk sözleşmenizi oluşturmak için yukarıdaki butona tıklayın</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-green-600" />
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {contract.status === 'generated' ? 'Oluşturuldu' : contract.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{contract.contract_name}</h3>
              <p className="text-sm text-gray-600 mb-1">Şablon: {contract.template_name}</p>
              <p className="text-xs text-gray-500 mb-4">
                {new Date(contract.created_at).toLocaleDateString('tr-TR')}
              </p>
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="İndir">
                  <Download className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded" title="Görüntüle">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Sil">
                  <Trash2 className="h-4 w-4" />
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