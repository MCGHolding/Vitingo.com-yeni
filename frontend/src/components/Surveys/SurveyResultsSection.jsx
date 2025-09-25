import React, { useState, useMemo } from 'react';
import { Search, Eye, Calendar, User, MapPin, Star, TrendingUp, TrendingDown, Filter, ChevronDown } from 'lucide-react';
import { surveyResponses, surveyQuestions, customersWithProjects } from '../../mock/surveysData';

const SurveyResultsSection = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRepresentative, setSelectedRepresentative] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Helper function to get customer representative by project ID
  const getCustomerRepresentative = (projectId) => {
    for (const customer of customersWithProjects) {
      const project = customer.projects.find(p => p.id === projectId);
      if (project) {
        return project.customerRepresentative || 'Belirtilmemiş';
      }
    }
    return 'Belirtilmemiş';
  };

  // Get unique customer representatives for filter
  const uniqueRepresentatives = useMemo(() => {
    const reps = new Set();
    customersWithProjects.forEach(customer => {
      customer.projects.forEach(project => {
        if (project.customerRepresentative) {
          reps.add(project.customerRepresentative);
        }
      });
    });
    return Array.from(reps).sort();
  }, []);

  // Filter responses by customer, representative and search term
  const filteredResponses = useMemo(() => {
    let filtered = surveyResponses;

    // Filter by customer
    if (selectedCustomerId) {
      filtered = filtered.filter(response => response.customerId === parseInt(selectedCustomerId));
    }

    // Filter by customer representative
    if (selectedRepresentative) {
      filtered = filtered.filter(response => {
        const rep = getCustomerRepresentative(response.projectId);
        return rep === selectedRepresentative;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(response =>
        response.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [selectedCustomerId, selectedRepresentative, searchTerm]);

  // Get unique customers
  const customers = useMemo(() => {
    const uniqueCustomers = [];
    const customerIds = new Set();
    
    surveyResponses.forEach(response => {
      if (!customerIds.has(response.customerId)) {
        uniqueCustomers.push({
          id: response.customerId,
          name: response.customerName,
          contact: response.contact
        });
        customerIds.add(response.customerId);
      }
    });
    
    return uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Calculate statistics for filtered responses
  const stats = useMemo(() => {
    if (filteredResponses.length === 0) return { avgSatisfaction: 0, avgNPS: 0, avgQuality: 0 };

    const satisfactionSum = filteredResponses.reduce((sum, response) => 
      sum + parseInt(response.responses['1'] || 0), 0);
    const npsSum = filteredResponses.reduce((sum, response) => 
      sum + parseInt(response.responses['9'] || 0), 0);
    const qualitySum = filteredResponses.reduce((sum, response) => 
      sum + parseInt(response.responses['4'] || 0), 0);

    return {
      avgSatisfaction: (satisfactionSum / filteredResponses.length).toFixed(1),
      avgNPS: (npsSum / filteredResponses.length).toFixed(1),
      avgQuality: (qualitySum / filteredResponses.length).toFixed(1)
    };
  }, [filteredResponses]);

  const getSatisfactionLevel = (score) => {
    if (score >= 4.5) return { text: 'Çok İyi', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 3.5) return { text: 'İyi', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 2.5) return { text: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Düşük', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getNPSColor = (score) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQuestionText = (questionId) => {
    const question = surveyQuestions.find(q => q.id === parseInt(questionId));
    return question ? question.question : `Soru ${questionId}`;
  };

  const getAnswerText = (questionId, answer) => {
    const question = surveyQuestions.find(q => q.id === parseInt(questionId));
    if (!question) return answer;

    if (question.type === 'multiple_choice') {
      const option = question.options?.find(opt => opt.value === answer);
      return option ? option.label : answer;
    }

    if (question.type === 'checkbox' && Array.isArray(answer)) {
      return answer.map(value => {
        const option = question.options?.find(opt => opt.value === value);
        return option ? option.label : value;
      }).join(', ');
    }

    return answer;
  };

  const viewSurveyDetails = (survey) => {
    setSelectedSurvey(survey);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Anket Sonuçları</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredResponses.length} anket bulundu</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.contact}
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
                placeholder="Müşteri, proje adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {filteredResponses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.avgSatisfaction}</div>
              <div className="text-sm text-gray-600">Ortalama Memnuniyet</div>
              <div className={`text-xs font-medium mt-1 ${getSatisfactionLevel(stats.avgSatisfaction).color}`}>
                {getSatisfactionLevel(stats.avgSatisfaction).text}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getNPSColor(stats.avgNPS)}`}>{stats.avgNPS}</div>
              <div className="text-sm text-gray-600">Ortalama NPS</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.avgQuality}</div>
              <div className="text-sm text-gray-600">Ortalama Kalite</div>
            </div>
          </div>
        )}
      </div>

      {/* Survey Results List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Anket Listesi</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredResponses.length > 0 ? (
            filteredResponses.map((survey, index) => (
              <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{survey.customerName}</h4>
                        <p className="text-sm text-gray-600">{survey.contact}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{survey.projectName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(survey.submittedAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-gray-900">
                          Memnuniyet: {survey.responses['1']}/5
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-gray-900">
                          NPS: {survey.responses['9']}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => viewSurveyDetails(survey)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detayları Gör</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Eye className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Anket bulunamadı</h3>
              <p className="text-gray-600">Seçilen filtrelere uygun anket sonucu bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Survey Details Modal */}
      {showDetailsModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSurvey.customerName}</h2>
                  <p className="text-blue-100 mt-1">{selectedSurvey.projectName}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown className="h-6 w-6 rotate-45" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedSurvey.responses['1']}/5</div>
                  <div className="text-blue-100 text-sm">Memnuniyet</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedSurvey.responses['4']}/10</div>
                  <div className="text-blue-100 text-sm">Kalite</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedSurvey.responses['9']}/10</div>
                  <div className="text-blue-100 text-sm">NPS</div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="space-y-6">
                {Object.entries(selectedSurvey.responses).map(([questionId, answer]) => (
                  <div key={questionId} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {getQuestionText(questionId)}
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-800">{getAnswerText(questionId, answer)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Gönderim Tarihi: {new Date(selectedSurvey.submittedAt).toLocaleString('tr-TR')}</span>
                  <span>IP: {selectedSurvey.ipAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResultsSection;