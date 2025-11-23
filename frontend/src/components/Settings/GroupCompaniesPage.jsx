import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Building2, Edit2, Trash2, MapPin } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import AddCompanyModal from './AddCompanyModal';
import AddAccountantModal from './AddAccountantModal';

const GroupCompaniesPage = ({ onBack }) => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showAddAccountantModal, setShowAddAccountantModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/group-companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Hata",
        description: "Şirketler yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`"${companyName}" şirketini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/group-companies/${companyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Şirket başarıyla silindi"
        });
        loadCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Hata",
        description: "Şirket silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Geri</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                  Grup Şirketleri
                </h1>
                <p className="text-sm text-gray-600">Grup şirketlerinizi ve mali müşavirlerinizi yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Şirket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddAccountantModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Mali Müşavir Ekle</span>
            </button>
            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Şirket Ekle</span>
            </button>
          </div>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Şirket Bulunamadı</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Arama kriterinize uygun şirket bulunamadı.' : 'Henüz hiç şirket eklenmemiş.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddCompanyModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk Şirketi Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      {company.groupName && (
                        <p className="text-sm text-gray-600">📎 {company.groupName}</p>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                    Aktif
                  </span>
                </div>

                {company.country && (
                  <div className="mb-4 flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {company.country}
                  </div>
                )}

                {company.accountant && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Mali Müşavir</p>
                    <p className="text-sm font-medium text-gray-900">{company.accountant.name}</p>
                    {company.accountant.email && (
                      <p className="text-xs text-gray-600">{company.accountant.email}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditingCompany(company);
                      setShowAddCompanyModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company.id, company.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddCompanyModal && (
        <AddCompanyModal
          isOpen={showAddCompanyModal}
          onClose={() => {
            setShowAddCompanyModal(false);
            setEditingCompany(null);
          }}
          onSave={() => {
            loadCompanies();
            setShowAddCompanyModal(false);
            setEditingCompany(null);
          }}
          editingCompany={editingCompany}
        />
      )}

      {showAddAccountantModal && (
        <AddAccountantModal
          isOpen={showAddAccountantModal}
          onClose={() => setShowAddAccountantModal(false)}
          onSave={() => {
            loadCompanies();
            setShowAddAccountantModal(false);
          }}
          companies={companies}
        />
      )}
    </div>
  );
};

export default GroupCompaniesPage;
