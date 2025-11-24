import React, { useEffect, useState } from 'react';
import AllFairsPageNew from './AllFairsPageNew';

export default function FutureFairsPage({ fairs: initialFairs, onBackToDashboard }) {
  const [futureFairs, setFutureFairs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFutureFairs();
  }, [initialFairs]);

  const loadFutureFairs = async () => {
    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/fairs`);
      
      if (response.ok) {
        const fairsData = await response.json();
        
        // Filter fairs that are currently active or upcoming
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = fairsData.filter(fair => {
          const endDate = fair.defaultEndDate || fair.endDate;
          if (!endDate) return false;
          
          const fairEndDate = new Date(endDate);
          fairEndDate.setHours(0, 0, 0, 0);
          
          return fairEndDate >= today;
        });
        
        setFutureFairs(filtered);
      }
    } catch (error) {
      console.error('Error loading future fairs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gelecek fuarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AllFairsPageNew 
      fairs={futureFairs}
      onBackToDashboard={onBackToDashboard}
      title="Gelecek Fuarlar"
      titleColor="text-green-600"
      showImport={false}
    />
  );
}
