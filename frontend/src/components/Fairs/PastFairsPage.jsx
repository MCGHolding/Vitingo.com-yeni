import React from 'react';
import AllFairsPage from './AllFairsPage';

export default function PastFairsPage({ fairs, onBackToDashboard }) {
  const pastFairs = fairs?.filter(fair => fair.status === 'past') || [];
  
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