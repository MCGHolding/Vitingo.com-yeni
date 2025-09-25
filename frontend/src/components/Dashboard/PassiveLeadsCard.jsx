import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { Clock, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { leadsStats, PASSIVE_LEAD_THRESHOLD_DAYS, passiveLeads } from '../../mock/leadsData';

const PassiveLeadsCard = () => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      setHasAnimated(true);
      const timer = setTimeout(() => {
        setDisplayValue(leadsStats.totalPassiveLeads);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(leadsStats.totalPassiveLeads);
    }
  }, [hasAnimated]);

  const formatValue = (val) => {
    return val.toLocaleString('tr-TR');
  };

  // Calculate additional metrics
  const recentlyPassiveCount = leadsStats.recentlyPassive;
  const passiveValue = leadsStats.passiveValue;
  const averagePassiveDays = Math.round(leadsStats.averagePassiveDays);

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
      
      <div className="relative p-6">
        {/* Header with Icon and Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          
          {/* Info Icon with Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Info className="h-4 w-4 text-gray-500" />
            </button>
            
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 z-50">
                <div className="space-y-2">
                  <p className="font-semibold">Pasif Lead Kuralı:</p>
                  <p>• {PASSIVE_LEAD_THRESHOLD_DAYS} gün boyunca hiç işlem olmayan leadler</p>
                  <p>• Otomatik olarak pasif lead'e aktarılır</p>
                  <p>• Açık lead'lerden çıkarılır</p>
                </div>
                <div className="absolute top-0 right-4 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 mb-2">Pasif Leadler</h3>

        {/* Value */}
        <div className="flex items-baseline space-x-1 mb-3">
          <span className="text-3xl font-bold text-gray-900">
            {hasAnimated ? (
              formatValue(displayValue)
            ) : (
              <CountUp
                start={0}
                end={displayValue}
                duration={2}
                formattingFn={formatValue}
                onEnd={() => setHasAnimated(true)}
              />
            )}
          </span>
          <span className="text-lg font-medium text-gray-600">lead</span>
        </div>

        {/* Change Indicator */}
        <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 mb-3">
          <AlertTriangle className="h-4 w-4" />
          <span>{recentlyPassiveCount} yeni pasif</span>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {/* Passive Value */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Toplam Değer:</span>
            <span className="font-semibold text-gray-900">
              ₺{passiveValue.toLocaleString('tr-TR')}
            </span>
          </div>
          
          {/* Average Days */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Ortalama Pasif Süre:</span>
            <span className="font-semibold text-red-600">
              {averagePassiveDays} gün
            </span>
          </div>

          {/* Rule Info */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Kural:</span>
              <span className="font-bold text-red-600">
                {PASSIVE_LEAD_THRESHOLD_DAYS}+ gün işlemsiz
              </span>
            </div>
          </div>

          {/* Most Recent Passive */}
          <div className="bg-red-50 rounded-lg p-2 mt-2">
            <div className="text-xs text-red-800">
              <p className="font-medium mb-1">Son Pasif Lead:</p>
              {passiveLeads.length > 0 && (
                <div>
                  <p className="truncate">{passiveLeads[0].name}</p>
                  <p className="text-red-600">{passiveLeads[0].daysSinceActivity} gün önce</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
    </div>
  );
};

export default PassiveLeadsCard;