import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { kpiStats } from '../../mock/dashboardData';

const CSATGauge = () => {
  const csat = kpiStats.csat;
  const angle = (csat / 100) * 180; // Convert to semi-circle angle
  
  const getCSATColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCSATIcon = (score) => {
    if (score >= 80) return <Smile className="h-8 w-8 text-green-600" />;
    if (score >= 60) return <Meh className="h-8 w-8 text-yellow-600" />;
    return <Frown className="h-8 w-8 text-red-600" />;
  };

  const getCSATMessage = (score) => {
    if (score >= 90) return 'Mükemmel';
    if (score >= 80) return 'Çok İyi';
    if (score >= 70) return 'İyi';
    if (score >= 60) return 'Orta';
    return 'Düşük';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Müşteri Memnuniyeti</h3>
        <p className="text-sm text-gray-600 mt-1">CSAT Puanı</p>
      </div>

      {/* Gauge Container */}
      <div className="relative flex items-center justify-center">
        {/* SVG Gauge */}
        <div className="relative">
          <svg width="200" height="120" className="transform">
            {/* Background Arc */}
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Progress Arc */}
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              stroke="url(#csatGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 220} 220`}
              className="transition-all duration-1000 ease-out"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="csatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Needle */}
            <g transform={`rotate(${angle - 90} 100 100)`}>
              <circle cx="100" cy="100" r="6" fill="#374151" />
              <path
                d="M 100 100 L 100 45"
                stroke="#374151"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
            {getCSATIcon(csat)}
            <div className={`text-3xl font-bold mt-2 ${getCSATColor(csat)}`}>
              {csat.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {getCSATMessage(csat)}
            </div>
          </div>
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-4 px-4">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {/* Details */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Bu Ay</span>
          <span className="font-semibold text-gray-900">{csat.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Geçen Ay</span>
          <span className="font-semibold text-gray-900">{(csat - 2.3).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-gray-600">Değişim</span>
          <span className="font-semibold text-green-600">+2.3%</span>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        Detaylı Rapor
      </button>
    </div>
  );
};

export default CSATGauge;