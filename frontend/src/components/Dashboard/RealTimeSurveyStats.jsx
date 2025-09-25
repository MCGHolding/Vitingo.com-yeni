import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Mail, CheckCircle, Clock, Users, Star, AlertTriangle } from 'lucide-react';

const RealTimeSurveyStats = ({ onDetailedReport, onSendSurvey }) => {
  const [surveyStats, setSurveyStats] = useState({
    total_sent: 0,
    total_completed: 0,
    response_rate: 0,
    averageNPS: 0,
    averageCSAT: 0,
    completionTime: 4.2,
    recentResponses: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchSurveyStats = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    
    // Ana istatistikleri çek
    fetch(`${backendUrl}/api/surveys/stats`)
      .then(response => response.json())
      .then(statsData => {
        // Yanıtları çek
        return fetch(`${backendUrl}/api/surveys/responses`)
          .then(response => response.json())
          .then(responsesData => {
            // NPS ve CSAT hesapla
            let npsSum = 0;
            let csatSum = 0;
            let npsCount = 0;
            let csatCount = 0;
            
            const responses = responsesData.responses || [];
            responses.forEach(response => {
              try {
                // NPS sorusu (soru 9)
                if (response.responses && response.responses['9']) {
                  const npsValue = parseInt(response.responses['9']);
                  if (!isNaN(npsValue)) {
                    npsSum += npsValue;
                    npsCount++;
                  }
                }
                
                // CSAT sorusu (soru 1) - 5 üzerinden puanı yüzdeye çevir
                if (response.responses && response.responses['1']) {
                  const satisfaction = parseInt(response.responses['1']);
                  if (!isNaN(satisfaction)) {
                    csatSum += (satisfaction * 20); // 5 üzerinden 100 üzerine çevir
                    csatCount++;
                  }
                }
              } catch (err) {
                console.warn('Error processing response:', err);
              }
            });
            
            const averageNPS = npsCount > 0 ? (npsSum / npsCount) : 0;
            const averageCSAT = csatCount > 0 ? (csatSum / csatCount) : 0;
            
            setSurveyStats({
              total_sent: statsData.total_sent || 0,
              total_completed: statsData.total_completed || 0,
              response_rate: statsData.response_rate || 0,
              averageNPS: averageNPS,
              averageCSAT: averageCSAT,
              completionTime: 4.2,
              recentResponses: responses.slice(0, 5)
            });
            
            setLoading(false);
          });
      })
      .catch(error => {
        console.error('Error fetching survey stats:', error);
        setError('İstatistikler yüklenirken hata oluştu');
        setLoading(false);
      });
  };

  // İlk yükleme
  useEffect(() => {
    fetchSurveyStats();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchSurveyStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getNPSColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getCSATColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseRateColor = (rate) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="text-center mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">Anket İstatistikleri</h3>
        </div>
        <p className="text-sm text-gray-600">Gerçek Zamanlı Müşteri Geri Bildirimleri</p>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Gönderilen Anketler */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{surveyStats.total_sent}</div>
              <div className="text-sm text-gray-600">Gönderilen</div>
            </div>
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Tamamlanan Anketler */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{surveyStats.total_completed}</div>
              <div className="text-sm text-gray-600">Tamamlanan</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Yanıt Oranı */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Yanıt Oranı</span>
          <span className={`text-lg font-bold ${getResponseRateColor(surveyStats.response_rate)}`}>
            {surveyStats.response_rate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              surveyStats.response_rate >= 70 ? 'bg-green-500' :
              surveyStats.response_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(surveyStats.response_rate, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* NPS ve CSAT */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* NPS Puanı */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <Star className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className={`text-xl font-bold ${getNPSColor(surveyStats.averageNPS)}`}>
            {surveyStats.averageNPS.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Ortalama NPS</div>
        </div>

        {/* CSAT Puanı */}
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <div className={`text-xl font-bold ${getCSATColor(surveyStats.averageCSAT)}`}>
            {surveyStats.averageCSAT.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Müşteri Memnuniyeti</div>
        </div>
      </div>

      {/* Tamamlama Süresi */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">{surveyStats.completionTime} dk</div>
            <div className="text-sm text-gray-600">Ortalama Tamamlama Süresi</div>
          </div>
          <Clock className="h-6 w-6 text-gray-600" />
        </div>
      </div>

      {/* Son Yanıtlar */}
      {surveyStats.recentResponses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Son Yanıtlar
          </h4>
          <div className="space-y-2">
            {surveyStats.recentResponses.map((response, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600 truncate">
                  {response.customer_name || 'Anonim Müşteri'}
                </span>
                <div className="flex items-center space-x-2">
                  {response.responses['9'] && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      parseInt(response.responses['9']) >= 8 ? 'bg-green-100 text-green-700' :
                      parseInt(response.responses['9']) >= 6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      NPS: {response.responses['9']}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Detaylı Rapor
        </button>
        <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Anket Gönder
        </button>
      </div>
    </div>
  );
};

export default RealTimeSurveyStats;