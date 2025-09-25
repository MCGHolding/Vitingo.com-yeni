import React, { useState, useMemo } from 'react';
import { Search, Send, FileText, CheckCircle, Clock, User, MapPin, Filter, Eye, Mail } from 'lucide-react';
import { handoverRecords, getAccessibleHandovers, userPermissions } from '../../mock/handoverData';
import { customersWithProjects } from '../../mock/surveysData';

const HandoverManagementPage = ({ onBackToDashboard, initialTab = 'send' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedRepresentative, setSelectedRepresentative] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentHandovers, setSentHandovers] = useState([]);
  const [handoverMode, setHandoverMode] = useState('customer'); // 'customer' or 'arbitrary'
  
  // Arbitrary email handover fields
  const [arbitraryName, setArbitraryName] = useState('');
  const [arbitraryEmail, setArbitraryEmail] = useState('');
  const [arbitraryProject, setArbitraryProject] = useState('');
  const [arbitraryCompany, setArbitraryCompany] = useState('');
  const [arbitraryCountry, setArbitraryCountry] = useState('Türkiye');

  // Mock current user - in real app this would come from auth context
  const currentUser = { name: "admin", role: "admin" }; // Change this to test different users

  // Get accessible handovers based on user permissions
  const accessibleHandovers = useMemo(() => {
    return getAccessibleHandovers(currentUser.role, currentUser.name);
  }, [currentUser]);

  // Get customers that current user can access
  const accessibleCustomers = useMemo(() => {
    if (currentUser.role === 'admin') {
      return customersWithProjects;
    }
    
    const userPerms = userPermissions[currentUser.name];
    if (!userPerms) return [];
    
    return customersWithProjects.filter(customer => 
      userPerms.customersAssigned?.includes(customer.id) ||
      customer.projects.some(project => project.customerRepresentative === currentUser.name)
    );
  }, [currentUser]);

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    return accessibleCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accessibleCustomers, searchTerm]);

  // Get selected customer details
  const selectedCustomer = accessibleCustomers.find(c => c.id === parseInt(selectedCustomerId));
  const selectedProject = selectedCustomer?.projects?.find(p => p.id === parseInt(selectedProjectId));

  // Get language based on customer's country
  const getCustomerLanguage = (customerId) => {
    const customer = customersWithProjects.find(c => c.id === customerId);
    // Simple logic: if country is Turkey, use Turkish, otherwise English
    const turkishCountries = ['Türkiye', 'Turkey'];
    return customer && turkishCountries.includes(customer.country) ? 'tr' : 'en';
  };

  // Filter handover results
  const filteredHandovers = useMemo(() => {
    let filtered = accessibleHandovers;

    // Filter by customer
    if (selectedCustomerId) {
      filtered = filtered.filter(handover => handover.customerId === parseInt(selectedCustomerId));
    }

    // Filter by representative
    if (selectedRepresentative) {
      filtered = filtered.filter(handover => handover.customerRepresentative === selectedRepresentative);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(handover =>
        handover.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        handover.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        handover.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }, [accessibleHandovers, selectedCustomerId, selectedRepresentative, searchTerm]);

  // Get unique representatives for filter (only accessible ones)
  const uniqueRepresentatives = useMemo(() => {
    const reps = new Set();
    accessibleHandovers.forEach(handover => {
      if (handover.customerRepresentative) {
        reps.add(handover.customerRepresentative);
      }
    });
    return Array.from(reps).sort();
  }, [accessibleHandovers]);

  const handleSendHandover = async () => {
    if (handoverMode === 'customer') {
      if (!selectedCustomer || !selectedProject) return;
    } else {
      if (!arbitraryName || !arbitraryEmail || !arbitraryProject) return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      let requestData;
      let endpoint = '/api/handovers/send';
      
      if (handoverMode === 'customer') {
        // Customer-project mode
        const language = getCustomerLanguage(selectedCustomer.id);
        requestData = {
          customer_id: selectedCustomer.id.toString(),
          project_id: selectedProject.id.toString(),
          email: selectedCustomer.email,
          customer_name: selectedCustomer.name,
          contact_name: selectedCustomer.contact,
          project_name: selectedProject.name,
          language: language,
          customer_representative: selectedProject.customerRepresentative
        };
      } else {
        // Arbitrary email mode
        endpoint = '/api/handovers/send-arbitrary';
        const turkishCountries = ['Türkiye', 'Turkey'];
        const language = turkishCountries.includes(arbitraryCountry) ? 'tr' : 'en';
        
        requestData = {
          email: arbitraryEmail,
          contact_name: arbitraryName,
          company_name: arbitraryCompany,
          project_name: arbitraryProject,
          country: arbitraryCountry,
          language: language,
          customer_representative: currentUser.name
        };
      }
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newHandover = {
          id: Date.now(),
          customerId: handoverMode === 'customer' ? selectedCustomer.id : null,
          customerName: handoverMode === 'customer' ? selectedCustomer.name : arbitraryCompany,
          contact: handoverMode === 'customer' ? selectedCustomer.contact : arbitraryName,
          projectId: handoverMode === 'customer' ? selectedProject.id : null,
          projectName: handoverMode === 'customer' ? selectedProject.name : arbitraryProject,
          customerRepresentative: handoverMode === 'customer' ? selectedProject.customerRepresentative : currentUser.name,
          language: handoverMode === 'customer' ? getCustomerLanguage(selectedCustomer.id) : (turkishCountries.includes(arbitraryCountry) ? 'tr' : 'en'),
          sentAt: new Date().toISOString(),
          status: 'pending',
          handoverToken: result.handover_token,
          handoverLink: result.handover_link,
          completedAt: null,
          signatureData: null,
          autoSurveyTriggered: false,
          surveyToken: null,
          mode: handoverMode
        };
        
        setSentHandovers(prev => [newHandover, ...prev]);
        
        // Reset form fields
        if (handoverMode === 'customer') {
          setSelectedCustomerId('');
          setSelectedProjectId('');
          setSearchTerm('');
        } else {
          setArbitraryName('');
          setArbitraryEmail('');
          setArbitraryProject('');
          setArbitraryCompany('');
          setArbitraryCountry('Türkiye');
        }
        
        const recipientInfo = handoverMode === 'customer' 
          ? `${selectedCustomer.contact} (${selectedCustomer.email})` 
          : `${arbitraryName} (${arbitraryEmail})`;
          
        const languageInfo = handoverMode === 'customer' 
          ? (getCustomerLanguage(selectedCustomer.id) === 'tr' ? 'Türkçe' : 'İngilizce')
          : (turkishCountries.includes(arbitraryCountry) ? 'Türkçe' : 'İngilizce');
          
        alert(`✅ Teslim formu başarıyla gönderildi!\n\n📧 Alıcı: ${recipientInfo}\n🌐 Dil: ${languageInfo}\n🔗 Link: ${result.handover_link}`);
      } else {
        throw new Error(result.error || 'Email gönderim hatası');
      }
      
    } catch (error) {
      console.error('Handover send error:', error);
      alert(`❌ Teslim formu gönderilirken hata oluştu:\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Bekliyor';
      case 'expired': return 'Süresi Doldu';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teslim Form Yönetimi</h1>
            <p className="text-gray-600 mt-1">Fuar standı teslim formlarını yönetin ve takip edin</p>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Dashboard'a Dön
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Send className="inline-block w-4 h-4 mr-2" />
            Teslim Formu Gönder
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Teslim Formları ({filteredHandovers.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'send' ? (
          /* Send Handover Form */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              {/* Handover Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Teslim Formu Gönderim Şekli
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setHandoverMode('customer')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      handoverMode === 'customer'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Müşteri Projesi
                  </button>
                  <button
                    onClick={() => setHandoverMode('arbitrary')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      handoverMode === 'arbitrary'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Manuel E-posta
                  </button>
                </div>
              </div>

              {handoverMode === 'customer' ? (
                <>
                  {/* Customer Search and Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Müşteri Seç
                    </label>
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Müşteri adı veya iletişim kişisi ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedProjectId('');
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Müşteri seçiniz...</option>
                  {filteredCustomers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.contact} ({customer.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Selection */}
              {selectedCustomer && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Seç ({selectedCustomer.projects.length} proje mevcut)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Proje seçiniz...</option>
                    {selectedCustomer.projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.city} ({new Date(project.deliveryDate).toLocaleDateString('tr-TR')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Project Details */}
              {selectedCustomer && selectedProject && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Teslim Formu Detayları
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span><strong>Müşteri:</strong> {selectedCustomer.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span><strong>İletişim:</strong> {selectedCustomer.contact} ({selectedCustomer.email})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span><strong>Proje:</strong> {selectedProject.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span><strong>Lokasyon:</strong> {selectedProject.city}, {selectedProject.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span><strong>Müşteri Temsilcisi:</strong> {selectedProject.customerRepresentative}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span><strong>Form Dili:</strong> {getCustomerLanguage(selectedCustomer.id) === 'tr' ? 'Türkçe' : 'İngilizce'}</span>
                    </div>
                  </div>
                </div>
              )}
                </>
              ) : (
                <>
                  {/* Arbitrary Email Handover Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İletişim Kişisi Adı *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Mehmet Yılmaz"
                        value={arbitraryName}
                        onChange={(e) => setArbitraryName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta Adresi *
                      </label>
                      <input
                        type="email"
                        placeholder="Örn: mehmet@sirket.com"
                        value={arbitraryEmail}
                        onChange={(e) => setArbitraryEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Şirket Adı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: XYZ İnşaat Ltd."
                        value={arbitraryCompany}
                        onChange={(e) => setArbitraryCompany(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proje/Fuar Adı *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Yapı Fuarı İzmir 2025 Standı"
                        value={arbitraryProject}
                        onChange={(e) => setArbitraryProject(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ülke (Form Dili İçin)
                      </label>
                      <select
                        value={arbitraryCountry}
                        onChange={(e) => setArbitraryCountry(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Türkiye">Türkiye (Türkçe Form)</option>
                        <option value="Germany">Germany (English Form)</option>
                        <option value="USA">USA (English Form)</option>
                        <option value="France">France (English Form)</option>
                        <option value="Italy">Italy (English Form)</option>
                        <option value="Spain">Spain (English Form)</option>
                        <option value="Other">Other (English Form)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview Info */}
                  {arbitraryName && arbitraryEmail && arbitraryProject && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Teslim Formu Özeti
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-green-600" />
                          <span><strong>Alıcı:</strong> {arbitraryName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <span><strong>Email:</strong> {arbitraryEmail}</span>
                        </div>
                        {arbitraryCompany && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span><strong>Şirket:</strong> {arbitraryCompany}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span><strong>Proje:</strong> {arbitraryProject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span><strong>Form Dili:</strong> {['Türkiye', 'Turkey'].includes(arbitraryCountry) ? 'Türkçe' : 'İngilizce'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-green-600" />
                          <span><strong>Temsilci:</strong> {currentUser.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendHandover}
                disabled={!selectedCustomer || !selectedProject || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  selectedCustomer && selectedProject && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Teslim Formunu E-posta ile Gönder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Handover Results */
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Teslim Formları</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>{filteredHandovers.length} form bulundu</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteriye Göre Filtrele
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tüm Müşteriler</option>
                    {accessibleCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Representative Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temsilciye Göre Filtrele
                  </label>
                  <select
                    value={selectedRepresentative}
                    onChange={(e) => setSelectedRepresentative(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tüm Temsilciler</option>
                    {uniqueRepresentatives.map(rep => (
                      <option key={rep} value={rep}>
                        {rep}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arama
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Müşteri, proje ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCustomerId || selectedRepresentative || searchTerm) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCustomerId('');
                      setSelectedRepresentative('');
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Handover List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Teslim Form Listesi</h3>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredHandovers.length > 0 ? (
                  filteredHandovers.map((handover, index) => (
                    <div key={handover.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{handover.customerName}</h4>
                              <p className="text-sm text-gray-600">{handover.contact}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(handover.status)}`}>
                              {getStatusText(handover.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{handover.projectName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600 font-medium">{handover.customerRepresentative}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {new Date(handover.sentAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{handover.language === 'tr' ? 'Türkçe' : 'English'}</span>
                            </div>
                            {handover.completedAt && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 text-xs">
                                  {new Date(handover.completedAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {handover.status === 'completed' && (
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detayları Görüntüle">
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Henüz teslim formu bulunamadı</p>
                    <p className="text-sm">İlk teslim formunuzu göndermek için "Teslim Formu Gönder" sekmesini kullanın.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandoverManagementPage;