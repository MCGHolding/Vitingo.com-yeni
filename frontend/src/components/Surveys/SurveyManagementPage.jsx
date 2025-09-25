import React, { useState, useMemo } from 'react';
import { Search, Mail, Send, Eye, Calendar, User, MapPin, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { customersWithProjects, surveyStats, generateSurveyToken, surveyEmailTemplate } from '../../mock/surveysData';
import SurveyResultsSection from './SurveyResultsSection';

const SurveyManagementPage = ({ onBackToDashboard, initialTab = 'send' }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sentSurveys, setSentSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'send' or 'results'
  const [surveyMode, setSurveyMode] = useState('customer'); // 'customer' or 'arbitrary'
  
  // Arbitrary email survey fields
  const [arbitraryName, setArbitraryName] = useState('');
  const [arbitraryEmail, setArbitraryEmail] = useState('');
  const [arbitraryProject, setArbitraryProject] = useState('');
  const [arbitraryCompany, setArbitraryCompany] = useState('');

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    return customersWithProjects.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Get selected customer details
  const selectedCustomer = customersWithProjects.find(c => c.id === parseInt(selectedCustomerId));
  const selectedProject = selectedCustomer?.projects?.find(p => p.id === parseInt(selectedProjectId)) || selectedCustomer?.projects?.[0];

  const handleTestEmail = async () => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'mbucak@gmail.com'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Test email başarıyla gönderildi!\n\n📧 Alıcı: mbucak@gmail.com\n📨 Durum: ${result.message}`);
      } else {
        throw new Error(result.error || 'Test email gönderim hatası');
      }
      
    } catch (error) {
      console.error('Test email error:', error);
      alert(`❌ Test email gönderilirken hata oluştu:\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSurvey = async () => {
    if (surveyMode === 'customer') {
      if (!selectedCustomer || !selectedProject) return;
    } else {
      if (!arbitraryName || !arbitraryEmail || !arbitraryProject) return;
    }

    setIsLoading(true);
    
    try {
      // Get backend URL from environment
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      let requestData;
      let endpoint = '/api/surveys/send-invitation';
      
      if (surveyMode === 'customer') {
        // Customer-project mode
        requestData = {
          customer_id: selectedCustomer.id.toString(),
          project_id: selectedProject.id.toString(),
          email: selectedCustomer.email,
          customer_name: selectedCustomer.name,
          contact_name: selectedCustomer.contact,
          project_name: selectedProject.name,
          fair_name: selectedProject.fairName,
          city: selectedProject.city,
          country: selectedProject.country,
          delivery_date: selectedProject.deliveryDate
        };
      } else {
        // Arbitrary email mode
        endpoint = '/api/surveys/send-arbitrary';
        requestData = {
          email: arbitraryEmail,
          contact_name: arbitraryName,
          company_name: arbitraryCompany,
          project_name: arbitraryProject
        };
      }
      
      // Send request to backend API
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add to sent surveys list
        const newSentSurvey = {
          id: Date.now(),
          customerId: surveyMode === 'customer' ? selectedCustomer.id : null,
          customerName: surveyMode === 'customer' ? selectedCustomer.name : arbitraryCompany,
          contact: surveyMode === 'customer' ? selectedCustomer.contact : arbitraryName,
          email: surveyMode === 'customer' ? selectedCustomer.email : arbitraryEmail,
          projectName: surveyMode === 'customer' ? selectedProject.name : arbitraryProject,
          fairName: surveyMode === 'customer' ? selectedProject.fairName : arbitraryProject,
          surveyToken: result.survey_token,
          surveyLink: result.survey_link,
          sentAt: new Date().toISOString(),
          status: 'sent',
          opened: false,
          completed: false,
          mode: surveyMode
        };
        
        setSentSurveys(prev => [newSentSurvey, ...prev]);
        
        // Reset form fields
        if (surveyMode === 'customer') {
          setSelectedCustomerId('');
          setSelectedProjectId('');
          setSearchTerm('');
        } else {
          setArbitraryName('');
          setArbitraryEmail('');
          setArbitraryProject('');
          setArbitraryCompany('');
        }
        
        const recipientInfo = surveyMode === 'customer' 
          ? `${selectedCustomer.contact} (${selectedCustomer.email})` 
          : `${arbitraryName} (${arbitraryEmail})`;
          
        alert(`✅ Anket başarıyla gönderildi!\n\n📧 Alıcı: ${recipientInfo}\n🔗 Link: ${result.survey_link}`);
      } else {
        throw new Error(result.error || 'Email gönderim hatası');
      }
      
    } catch (error) {
      console.error('Survey send error:', error);
      alert(`❌ Anket gönderilirken hata oluştu:\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Müşteri Memnuniyet Anketleri</h1>
            <p className="text-gray-600 mt-1">Fuar standı projeleriniz için müşteri geri bildirimlerini toplayın</p>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('send')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'send'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Anket Gönder</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Anket Sonuçları</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'send' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel - Send Survey */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Anket Gönder</h2>
              </div>
            </div>

            <div className="p-6">
              {/* Survey Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Anket Gönderim Şekli
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSurveyMode('customer')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      surveyMode === 'customer'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Müşteri Projesi
                  </button>
                  <button
                    onClick={() => setSurveyMode('arbitrary')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                      surveyMode === 'arbitrary'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Manuel E-posta
                  </button>
                </div>
              </div>

              {surveyMode === 'customer' ? (
                <>
                  {/* Customer Search and Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Müşteri Seç
                    </label>
                    
                    {/* Search Input */}
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

                    {/* Customer Dropdown */}
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        setSelectedProjectId(''); // Reset project selection when customer changes
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Müşteri seçiniz...</option>
                      {filteredCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.contact}
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

                  {/* Selected Customer Project Details */}
                  {selectedCustomer && selectedProject && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Seçilen Proje Detayları
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span><strong>İletişim:</strong> {selectedCustomer.contact}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span><strong>Email:</strong> {selectedCustomer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span><strong>Proje:</strong> {selectedProject.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span><strong>Lokasyon:</strong> {selectedProject.city}, {selectedProject.country}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span><strong>Teslimat:</strong> {new Date(selectedProject.deliveryDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Arbitrary Email Survey Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İletişim Kişisi Adı *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Ahmet Yılmaz"
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
                        placeholder="Örn: ahmet@sirket.com"
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
                        placeholder="Örn: ABC Teknoloji Ltd."
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
                        placeholder="Örn: CeBIT Turkey 2024 Standı"
                        value={arbitraryProject}
                        onChange={(e) => setArbitraryProject(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Preview Info */}
                  {arbitraryName && arbitraryEmail && arbitraryProject && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Anket Özeti
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
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span><strong>Proje:</strong> {arbitraryProject}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendSurvey}
                disabled={
                  (surveyMode === 'customer' && (!selectedCustomer || !selectedProject)) ||
                  (surveyMode === 'arbitrary' && (!arbitraryName || !arbitraryEmail || !arbitraryProject)) ||
                  isLoading
                }
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  ((surveyMode === 'customer' && selectedCustomer && selectedProject) ||
                   (surveyMode === 'arbitrary' && arbitraryName && arbitraryEmail && arbitraryProject)) && !isLoading
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
                    <span>Anketi E-posta ile Gönder</span>
                  </>
                )}
              </button>

              {/* Test Email Button */}
              <button
                onClick={handleTestEmail}
                disabled={isLoading}
                className="w-full mt-3 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-all"
              >
                <Mail className="h-4 w-4" />
                <span>Test Email Gönder (mbucak@gmail.com)</span>
              </button>
            </div>
          </div>

          {/* Right Panel - Survey Statistics & Sent Surveys */}
          <div className="space-y-6">
            
            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Anket İstatistikleri</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{surveyStats.totalSent}</div>
                    <div className="text-sm text-gray-600">Gönderilen</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{surveyStats.totalCompleted}</div>
                    <div className="text-sm text-gray-600">Tamamlanan</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{surveyStats.responseRate}%</div>
                    <div className="text-sm text-gray-600">Yanıt Oranı</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{surveyStats.averageNPS}</div>
                    <div className="text-sm text-gray-600">Ortalama NPS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sent Surveys */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Son Gönderilen Anketler</h2>
              </div>
              <div className="p-6">
                {sentSurveys.length > 0 ? (
                  <div className="space-y-3">
                    {sentSurveys.slice(0, 5).map(survey => (
                      <div key={survey.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{survey.customerName}</div>
                          <div className="text-sm text-gray-600">{survey.projectName}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            survey.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {survey.completed ? 'Tamamlandı' : 'Bekliyor'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz anket gönderilmedi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : (
          <SurveyResultsSection />
        )}
      </div>
    </div>
  );
};

export default SurveyManagementPage;