import React from 'react';
import AllFairsPage from './AllFairsPage';

export default function ActiveFairsPage({ fairs, onBackToDashboard }) {
  const activeFairs = fairs?.filter(fair => fair.status === 'active') || [];
  
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