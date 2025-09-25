import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown, ChevronDown, Target } from 'lucide-react';
import { growthData } from '../../mock/growthData';

const GrowthRateCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  const currentData = growthData[selectedPeriod];
  const growthRate = parseFloat(currentData.growthRate);

  const periodOptions = [
    { value: 'weekly', label: 'Haftalık', icon: '📊' },
    { value: 'monthly', label: 'Aylık', icon: '📈' },
    { value: 'yearly', label: 'Yıllık', icon: '🎯' }
  ];

  useEffect(() => {
    // Reset animation when period changes
    setHasAnimated(false);
    setDisplayValue(0);
    
    const timer = setTimeout(() => {
      setDisplayValue(Math.abs(growthRate));
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedPeriod, growthRate]);

  const formatValue = (val) => {
    return val.toFixed(1);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
      
      <div className="relative p-6">
        {/* Header with Icon and Dropdown */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          
          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-xs"
            >
              <span className="font-medium text-gray-700">
                {periodOptions.find(opt => opt.value === selectedPeriod)?.label}
              </span>
              <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      selectedPeriod === option.value ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 mb-2">{currentData.title}</h3>

        {/* Value */}
        <div className="flex items-baseline space-x-1 mb-3">
          <span className="text-3xl font-bold text-gray-900">
            {growthRate >= 0 ? '+' : ''}
            {hasAnimated ? (
              formatValue(displayValue)
            ) : (
              <CountUp
                start={0}
                end={displayValue}
                duration={2}
                decimals={1}
                formattingFn={formatValue}
                onEnd={() => setHasAnimated(true)}
              />
            )}
          </span>
          <span className="text-2xl font-bold text-gray-900">%</span>
        </div>

        {/* Change Indicator */}
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
          growthRate >= 0 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {growthRate >= 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{currentData.subtitle}</span>
        </div>

        {/* Comparison Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">{currentData.currentPeriod}:</span>
            <span className="font-semibold text-gray-900">
              ₺{currentData.currentValue.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">{currentData.previousPeriod}:</span>
            <span className="font-semibold text-gray-600">
              ₺{currentData.previousValue.toLocaleString('tr-TR')}
            </span>
          </div>
          
          {/* Growth Amount */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Büyüme Tutarı:</span>
              <span className={`font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}₺{(currentData.currentValue - currentData.previousValue).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
    </div>
  );
};

export default GrowthRateCard;