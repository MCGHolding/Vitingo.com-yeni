import React from 'react';
import AllFairsPage from './AllFairsPage';

export default function PastFairsPage({ fairs, onBackToDashboard }) {
  // Filter fairs whose end date has passed
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const pastFairs = fairs?.filter(fair => {
    const endDate = fair.defaultEndDate || fair.endDate;
    if (!endDate) return false;
    
    const fairEndDate = new Date(endDate);
    fairEndDate.setHours(0, 0, 0, 0);
    
    return fairEndDate < today;
  }) || [];
  
  console.log('PastFairsPage - Total fairs:', fairs?.length);
  console.log('PastFairsPage - Past fairs:', pastFairs.length);
  console.log('PastFairsPage - Today:', today.toISOString());
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AllFairsPage 
        fairs={pastFairs}
        onBackToDashboard={onBackToDashboard}
      />
      {/* Override header styling for past fairs */}
      <style jsx>{`
        h1 {
          color: #7c3aed !important;
        }
      `}</style>
    </div>
  );
}