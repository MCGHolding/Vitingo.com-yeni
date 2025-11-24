import React, { useEffect, useState } from 'react';
import AllFairsPageNew from './AllFairsPageNew';

export default function PastFairsPageNew({ fairs: initialFairs, onBackToDashboard }) {
  const [pastFairs, setPastFairs] = useState([]);

  useEffect(() => {
    if (initialFairs) {
      // Filter fairs that have ended
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filtered = initialFairs.filter(fair => {
        const endDate = fair.defaultEndDate || fair.endDate;
        if (!endDate) return false;
        
        const fairEndDate = new Date(endDate);
        fairEndDate.setHours(0, 0, 0, 0);
        
        return fairEndDate < today;
      });
      
      setPastFairs(filtered);
    }
  }, [initialFairs]);

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
