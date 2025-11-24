import React, { useEffect, useState } from 'react';
import AllFairsPageNew from './AllFairsPageNew';

export default function FutureFairsPage({ fairs: initialFairs, onBackToDashboard }) {
  const [futureFairs, setFutureFairs] = useState([]);

  useEffect(() => {
    if (initialFairs) {
      // Filter fairs that are currently active or upcoming
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filtered = initialFairs.filter(fair => {
        const endDate = fair.defaultEndDate || fair.endDate;
        if (!endDate) return false;
        
        const fairEndDate = new Date(endDate);
        fairEndDate.setHours(0, 0, 0, 0);
        
        return fairEndDate >= today;
      });
      
      setFutureFairs(filtered);
    }
  }, [initialFairs]);

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
