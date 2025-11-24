import React, { useEffect, useState } from 'react';
import AllFairsPageNew from './AllFairsPageNew';

export default function PastFairsPageNew({ fairs: initialFairs, onBackToDashboard }) {
  const [pastFairs, setPastFairs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPastFairs();
  }, [initialFairs]);

  const loadPastFairs = async () => {
    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/fairs`);
      
      if (response.ok) {
        const fairsData = await response.json();
        
        // Filter fairs that have ended
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = fairsData.filter(fair => {
          const endDate = fair.defaultEndDate || fair.endDate;
          if (!endDate) return false;
          
          const fairEndDate = new Date(endDate);
          fairEndDate.setHours(0, 0, 0, 0);
          
          return fairEndDate < today;
        });
        
        setPastFairs(filtered);
      }
    } catch (error) {
      console.error('Error loading past fairs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Geçmiş fuarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AllFairsPageNew 
      fairs={pastFairs}
      onBackToDashboard={onBackToDashboard}
      title="Geçmiş Fuarlar"
      titleColor="text-red-600"
      showImport={false}
    />
  );
}
