import React from 'react';
import AllFairsPage from './AllFairsPage';

export default function ActiveFairsPage({ fairs, onBackToDashboard }) {
  // Filter fairs that are currently active or upcoming (end date is today or in future)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const activeFairs = fairs?.filter(fair => {
    const endDate = fair.defaultEndDate || fair.endDate;
    if (!endDate) return false;
    
    const fairEndDate = new Date(endDate);
    fairEndDate.setHours(0, 0, 0, 0);
    
    return fairEndDate >= today;
  }) || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AllFairsPage 
        fairs={activeFairs}
        onBackToDashboard={onBackToDashboard}
      />
      {/* Override header to show "Aktif Fuarlar" */}
      <style jsx>{`
        h1 {
          color: #059669 !important;
        }
      `}</style>
    </div>
  );
}