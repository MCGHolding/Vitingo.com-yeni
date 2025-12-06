import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Edit, Trash2, Search, Globe, Share2, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import BankEmailModal from './BankEmailModal';
import BankStatementAnalyzer from '../BankStatement/BankStatementAnalyzer';

const AllBanksPage = ({ onBackToDashboard, onNewBank, onEditBank }) => {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [groupCompanies, setGroupCompanies] = useState([]);
  
  // Tab state
  const [activeMainTab, setActiveMainTab] = useState('info'); // 'info' | 'accounts' | 'statements'
  const [activeBank, setActiveBank] = useState(null); // Selected bank ID for accounts tab
  
  // Statements state
  const [selectedBankForStatement, setSelectedBankForStatement] = useState(null);
  const [statements, setStatements] = useState([]);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState('single'); // 'single' or 'country'
  const [bankToShare, setBankToShare] = useState(null);
  const [selectedShareCountry, setSelectedShareCountry] = useState('');
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBanks, setEmailBanks] = useState([]);
  const [emailMode, setEmailMode] = useState('single'); // 'single' or 'country'
  
  // Countries list
  const countries = [
    { code: 'Turkey', name: 'Türkiye', flag: '🇹🇷' },
    { code: 'UAE', name: 'BAE', flag: '🇦🇪' },
    { code: 'USA', name: 'ABD', flag: '🇺🇸' }
  ];

  // Load group companies
  const loadGroupCompanies = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/group-companies`);
      
      if (response.ok) {
        const companies = await response.json();
        setGroupCompanies(Array.isArray(companies) ? companies : []);
      }
    } catch (error) {
      console.error('Error loading group companies:', error);
    }
  };

  // Load banks from backend
  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks`);
      
      if (response.ok) {
        const banksData = await response.json();
        console.log('Loaded banks:', banksData);
        setBanks(banksData);
      } else {
        console.error('Failed to load banks:', response.statusText);
        setBanks([]);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      setBanks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load banks and companies on component mount
  useEffect(() => {
    loadGroupCompanies();
    loadBanks();
  }, []);

  // Filter banks based on search and company
  useEffect(() => {
    let filtered = [...banks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bank => 
        bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bank.company_name && bank.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(bank => bank.company_id === selectedCompany);
    }

    setFilteredBanks(filtered);
  }, [banks, searchQuery, selectedCompany]);
  
  // Auto-select first bank when switching to accounts tab
  useEffect(() => {
    if (activeMainTab === 'accounts' && banks.length > 0 && !activeBank) {
      setActiveBank(banks[0].id);
    }
  }, [activeMainTab, banks, activeBank]);

  // Group banks by company
  const groupedBanks = filteredBanks.reduce((groups, bank) => {
    const companyKey = bank.company_id || 'ungrouped';
    if (!groups[companyKey]) {
      groups[companyKey] = [];
    }
    groups[companyKey].push(bank);
    return groups;
  }, {});

  const handleEdit = (bank) => {
    console.log('Edit bank:', bank);
    if (onEditBank) {
      onEditBank(bank);
    }
  };

  const handleDelete = (bank) => {
    setBankToDelete(bank);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bankToDelete) return;

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks/${bankToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setBankToDelete(null);
        loadBanks(); // Reload banks
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Banka silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting bank:', error);
      alert(`Banka silinemedi: ${error.message}`);
    }
  };

  const handleShareSingle = (bank) => {
    setEmailBanks([bank]);
    setEmailMode('single');
    setShowEmailModal(true);
  };

  const handleShareByCountry = () => {
    setShareMode('country');
    setShowShareModal(true);
  };

  const handleCountryShareConfirm = () => {
    if (!selectedShareCountry) return;
    
    const countryBanks = filteredBanks.filter(bank => bank.country === selectedShareCountry);
    setEmailBanks(countryBanks);
    setEmailMode('country');
    setShowShareModal(false);
    setShowEmailModal(true);
    setSelectedShareCountry('');
  };
  
  // Ekstre fonksiyonları
  const handleStatementUpload = async (e, bankId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Sadece PDF dosyaları yükleyebilirsiniz');
      return;
    }
    
    const newStatement = {
      id: Date.now().toString(),
      bankId: bankId,
      filename: file.name,
      period: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      file: file
    };
    
    setStatements(prev => [...prev, newStatement]);
    alert('Ekstre başarıyla yüklendi: ' + file.name);
  };

  const viewStatement = (statement) => {
    if (statement.file) {
      const url = URL.createObjectURL(statement.file);
      window.open(url, '_blank');
    }
  };

  const downloadStatement = (statement) => {
    if (statement.file) {
      const url = URL.createObjectURL(statement.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = statement.filename;
      link.click();
    }
  };

  const deleteStatement = (statementId) => {
    if (window.confirm('Bu ekstreyi silmek istediğinize emin misiniz?')) {
      setStatements(prev => prev.filter(s => s.id !== statementId));
    }
  };
  
  const getCountryInfo = (countryCode) => {
    return countries.find(c => c.code === countryCode) || { name: countryCode, flag: '🏦', code: countryCode };
  };

  const renderBankDetails = (bank) => {
    if (bank.country === 'Turkey' || bank.country === 'UAE') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          {bank.swift_code && (
            <div><span className="font-medium">SWIFT:</span> {bank.swift_code}</div>
          )}
          {bank.iban && (
            <div><span className="font-medium">IBAN:</span> {bank.iban}</div>
          )}
          {bank.branch_name && (
            <div><span className="font-medium">Şube:</span> {bank.branch_name}</div>
          )}
          {bank.branch_code && (
            <div><span className="font-medium">Şube Kodu:</span> {bank.branch_code}</div>
          )}
          {bank.account_holder && (
            <div><span className="font-medium">Hesap Sahibi:</span> {bank.account_holder}</div>
          )}
          {bank.account_number && (
            <div><span className="font-medium">Hesap No:</span> {bank.account_number}</div>
          )}
        </div>
      );
    } else if (bank.country === 'USA') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          {bank.routing_number && (
            <div><span className="font-medium">Routing Number:</span> {bank.routing_number}</div>
          )}
          {bank.us_account_number && (
            <div><span className="font-medium">Account Number:</span> {bank.us_account_number}</div>
          )}
          {bank.bank_address && (
            <div><span className="font-medium">Banka Adresi:</span> {bank.bank_address}</div>
          )}
          {bank.recipient_address && (
            <div><span className="font-medium">Alıcı Adresi:</span> {bank.recipient_address}</div>
          )}
          {bank.recipient_name && (
            <div><span className="font-medium">Alıcı İsmi:</span> {bank.recipient_name}</div>
          )}
          {bank.recipient_zip_code && (
            <div><span className="font-medium">Zip Code:</span> {bank.recipient_zip_code}</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tüm Bankalar</h1>
            <p className="text-gray-600">Kayıtlı banka bilgilerinizi yönetin</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={onNewBank}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Building2 className="h-4 w-4" />
            <span>Yeni Banka</span>
          </Button>
          <Button
            onClick={handleShareByCountry}
            variant="outline"
            className="flex items-center space-x-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4" />
            <span>Paylaş</span>
          </Button>
          <Button
            variant="outline"
            onClick={onNewBank}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          <button 
            onClick={() => setActiveMainTab('info')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeMainTab === 'info' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Banka Bilgileri
          </button>
          <button 
            onClick={() => setActiveMainTab('accounts')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeMainTab === 'accounts' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💳 Banka Hesapları
          </button>
        </nav>
      </div>

      {/* Tab Content: Banka Bilgileri */}
      {activeMainTab === 'info' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Banka ara..."
              className="pl-10"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Tüm Şirketler</option>
              {groupCompanies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Toplam {filteredBanks.length} banka
          </div>
        </div>
      </div>

      {/* Banks List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Bankalar yükleniyor...</div>
          </div>
        ) : Object.keys(groupedBanks).length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz banka eklenmemiş</h3>
            <p className="text-gray-500 mb-4">
              {banks.length === 0 ? 'İlk bankanızı ekleyerek başlayın' : 'Arama kriterlerinize uygun banka bulunamadı'}
            </p>
            {banks.length === 0 && (
              <Button onClick={onNewBank} className="bg-green-600 hover:bg-green-700">
                <Building2 className="h-4 w-4 mr-2" />
                Yeni Banka Ekle
              </Button>
            )}
          </div>
        ) : (
          Object.entries(groupedBanks).map(([companyId, companyBanks]) => {
            const company = groupCompanies.find(c => c.id === companyId);
            const companyName = company ? company.name : 'Diğer';
            return (
              <div key={companyId} className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Company Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">{companyName}</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                      {companyBanks.length} banka
                    </span>
                  </div>
                </div>

                {/* Banks in this company */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {companyBanks.map((bank) => (
                    <div key={bank.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900">{bank.bank_name}</h3>
                          </div>
                          
                          {renderBankDetails(bank)}
                          
                          <div className="mt-3 text-xs text-gray-400">
                            Ekleme: {new Date(bank.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareSingle(bank)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(bank)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(bank)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* Tab Content: Banka Hesapları */}
      {activeMainTab === 'accounts' && (
        <div>
          {/* Bank Sub-Tabs */}
          {banks.length > 0 ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
                {banks.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => setActiveBank(bank.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeBank === bank.id 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {bank.bank_name}
                  </button>
                ))}
              </div>
              
              {/* Selected Bank Content */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {activeBank ? (
                  (() => {
                    const selectedBank = banks.find(b => b.id === activeBank);
                    const isWioBank = selectedBank?.bank_name?.toLowerCase().includes('wio');
                    
                    if (isWioBank) {
                      // Use static import for BankStatementAnalyzer
                      return <BankStatementAnalyzer bankId={activeBank} />;
                    }
                    
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <span className="text-4xl mb-3 block">🏦</span>
                        <p className="font-medium text-gray-800 mb-2">
                          {selectedBank?.bank_name}
                        </p>
                        <p className="text-sm">Hesap bilgileri yakında eklenecek</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Banka seçin</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz banka eklenmemiş</h3>
              <p className="text-gray-500 mb-4">İlk bankanızı ekleyerek başlayın</p>
              <Button onClick={onNewBank} className="bg-green-600 hover:bg-green-700">
                <Building2 className="h-4 w-4 mr-2" />
                Yeni Banka Ekle
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Dikkat!</h3>
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                <strong>"{bankToDelete?.bank_name}"</strong> bankası kayıtlarımızdan silinecektir.
                <br /><br />
                Bu işlem geri alınamaz. Onaylıyor musunuz?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBankToDelete(null);
                }}
                variant="outline"
                className="flex-1 py-3"
              >
                İptal Et
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
              >
                ✓ Onaylıyorum
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {shareMode === 'single' ? 'Banka Bilgisi Paylaş' : 'Ülke Bankalarını Paylaş'}
            </h3>
            
            {shareMode === 'country' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paylaşılacak Ülkeyi Seçin
                </label>
                <select
                  value={selectedShareCountry}
                  onChange={(e) => setSelectedShareCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Ülke seçin...</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shareMode === 'single' && bankToShare && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900">{bankToShare.bank_name}</h4>
                <p className="text-sm text-gray-600">{getCountryInfo(bankToShare.country).flag} {getCountryInfo(bankToShare.country).name}</p>
              </div>
            )}

            {shareMode === 'country' && selectedShareCountry && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900">
                  {getCountryInfo(selectedShareCountry).flag} {getCountryInfo(selectedShareCountry).name} 
                </h4>
                <p className="text-sm text-gray-600">
                  {filteredBanks.filter(bank => bank.country === selectedShareCountry).length} banka bilgisi paylaşılacak
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowShareModal(false);
                  setBankToShare(null);
                  setSelectedShareCountry('');
                }}
                variant="outline"
                className="flex-1 py-3"
              >
                İptal
              </Button>
              <Button
                onClick={handleCountryShareConfirm}
                disabled={shareMode === 'country' && !selectedShareCountry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Penceresini Aç
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <BankEmailModal
          banks={emailBanks}
          mode={emailMode}
          onClose={() => {
            setShowEmailModal(false);
            setEmailBanks([]);
          }}
        />
      )}
    </div>
  );
};

export default AllBanksPage;