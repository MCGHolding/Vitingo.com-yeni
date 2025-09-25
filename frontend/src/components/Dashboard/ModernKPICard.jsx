import React from 'react';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ModernKPICard = ({ 
  title, 
  value, 
  unit = '', 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  gradient = 'from-blue-500 to-blue-600',
  isPercentage = false,
  isCurrency = false 
}) => {
  const formatValue = (val) => {
    if (isCurrency) {
      return val.toLocaleString('tr-TR');
    }
    if (isPercentage) {
      return val;
    }
    return val.toLocaleString('tr-TR');
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          {/* Change Indicator */}
          {change && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              changeType === 'positive' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

        {/* Value */}
        <div className="flex items-baseline space-x-1">
          {isCurrency && <span className="text-2xl font-bold text-gray-900">₺</span>}
          <span className="text-3xl font-bold text-gray-900">
            <CountUp
              end={value}
              duration={2}
              separator="."
              decimals={isPercentage ? 1 : 0}
              formattingFn={formatValue}
            />
          </span>
          {isPercentage && <span className="text-2xl font-bold text-gray-900">%</span>}
          {unit && <span className="text-lg font-medium text-gray-600">{unit}</span>}
        </div>
      </div>

      {/* Bottom Accent */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
    </div>
  );
};

export default ModernKPICard;