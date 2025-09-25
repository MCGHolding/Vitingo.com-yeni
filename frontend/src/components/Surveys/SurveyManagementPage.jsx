import React, { useState, useMemo } from 'react';
import { Search, Mail, Send, Eye, Calendar, User, MapPin, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { customersWithProjects, surveyStats, generateSurveyToken, surveyEmailTemplate } from '../../mock/surveysData';
import SurveyResultsSection from './SurveyResultsSection';

const SurveyManagementPage = ({ onBackToDashboard }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sentSurveys, setSentSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'results'

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    return customersWithProjects.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Get selected customer details
  const selectedCustomer = customersWithProjects.find(c => c.id === parseInt(selectedCustomerId));
  const latestProject = selectedCustomer?.projects?.[0]; // Assuming latest project is first

  const handleSendSurvey = async () => {
    if (!selectedCustomer || !latestProject) return;

    setIsLoading(true);
    
    try {
      // Generate unique survey token
      const surveyToken = generateSurveyToken();
      const surveyLink = `${window.location.origin}/survey/${surveyToken}`;
      
      // Simulate email sending (in real app, this would be a backend API call)
      const emailData = surveyEmailTemplate(selectedCustomer, latestProject, surveyLink);
      
      // Add to sent surveys list
      const newSentSurvey = {
        id: Date.now(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        contact: selectedCustomer.contact,
        email: selectedCustomer.email,
        projectName: latestProject.name,
        fairName: latestProject.fairName,
        surveyToken,
        surveyLink,
        sentAt: new Date().toISOString(),
        status: 'sent',
        opened: false,
        completed: false
      };
      
      setSentSurveys(prev => [newSentSurvey, ...prev]);
      setSelectedCustomerId('');
      setSearchTerm('');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Anket başarıyla ${selectedCustomer.contact} (${selectedCustomer.email}) adresine gönderildi!`);
      
    } catch (error) {
      console.error('Survey send error:', error);
      alert('Anket gönderilirken bir hata oluştu.');
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
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
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

              {/* Selected Customer Project Details */}
              {selectedCustomer && latestProject && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Son Teslim Edilen Proje
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
                      <span><strong>Proje:</strong> {latestProject.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span><strong>Lokasyon:</strong> {latestProject.city}, {latestProject.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span><strong>Teslimat:</strong> {new Date(latestProject.deliveryDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendSurvey}
                disabled={!selectedCustomer || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  selectedCustomer && !isLoading
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