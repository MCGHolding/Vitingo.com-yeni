import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Send, CheckCircle, AlertCircle, Calendar, MapPin, Building } from 'lucide-react';
import { surveyQuestions, customersWithProjects } from '../../mock/surveysData';

const SurveyFormPage = () => {
  const { token } = useParams();
  const [responses, setResponses] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [projectData, setProjectData] = useState(null);

  // Mock customer and project data based on token (in real app, fetch from backend)
  useEffect(() => {
    // Simulate fetching customer data based on survey token
    const mockCustomer = customersWithProjects[0]; // For demo, use first customer
    const mockProject = mockCustomer.projects[0];
    
    setCustomerData(mockCustomer);
    setProjectData(mockProject);
  }, [token]);

  const handleResponse = (questionId, value) => {
    if (Array.isArray(value)) {
      // For checkbox questions
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    } else {
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const currentValues = responses[questionId] || [];
    if (checked) {
      handleResponse(questionId, [...currentValues, option]);
    } else {
      handleResponse(questionId, currentValues.filter(v => v !== option));
    }
  };

  const isQuestionAnswered = (question) => {
    const response = responses[question.id];
    if (question.required) {
      if (question.type === 'checkbox') {
        return response && response.length > 0;
      }
      return response && response.trim() !== '';
    }
    return true; // Optional questions are always "answered"
  };

  const canProceed = () => {
    const currentQ = surveyQuestions[currentQuestion];
    return isQuestionAnswered(currentQ);
  };

  const nextQuestion = () => {
    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitSurvey = async () => {
    setIsLoading(true);
    try {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, send to backend
      console.log('Survey submitted:', {
        token,
        customerId: customerData?.id,
        projectId: projectData?.id,
        responses,
        submittedAt: new Date().toISOString()
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('Anket gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id];

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option.value}
                  checked={response === option.value}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(response || []).includes(option.value)}
                  onChange={(e) => handleCheckboxChange(question.id, option.value, e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      default:
        return null;
    }
  };

  // Loading or error states
  if (!customerData || !projectData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Anket yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Thank you page
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Teşekkür Ederiz!</h1>
          <p className="text-gray-600 mb-6">
            Anket yanıtlarınız başarıyla kaydedildi. Değerli görüşleriniz bizim için çok önemli.
          </p>
          <p className="text-sm text-gray-500">
            Gelecek projelerimizde daha iyi hizmet verebilmek için geri bildirimlerinizi değerlendireceğiz.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = surveyQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / surveyQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">
            Hoş Geldiniz, {customerData.contact}! 👋
          </h1>
          <p className="text-blue-100 mb-6">
            Memnuniyetiniz bizim için çok değerli. Lütfen son projemizle ilgili deneyiminizi paylaşın.
          </p>
          
          {/* Project Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Son Teslim Ettiğimiz Proje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span><strong>Proje:</strong> {projectData.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span><strong>Lokasyon:</strong> {projectData.city}, {projectData.country}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span><strong>Fuar:</strong> {projectData.fairName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>Teslimat:</strong> {new Date(projectData.deliveryDate).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Soru {currentQuestion + 1} / {surveyQuestions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% tamamlandı</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Survey Question */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{currentQuestion + 1}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentQ.question}
                </h2>
                {currentQ.required && (
                  <div className="flex items-center space-x-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Bu soru zorunludur</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Input */}
            <div className="ml-11">
              {renderQuestion(currentQ)}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentQuestion === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Önceki
            </button>

            {currentQuestion === surveyQuestions.length - 1 ? (
              <button
                onClick={submitSurvey}
                disabled={!canProceed() || isLoading}
                className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                  canProceed() && !isLoading
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Anketi Gönder</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  canProceed()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Sonraki
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyFormPage;