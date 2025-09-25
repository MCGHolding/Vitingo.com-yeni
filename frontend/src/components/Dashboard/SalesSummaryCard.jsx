import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, DollarSign, ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { salesSummaryData } from '../../mock/salesSummaryData';
import CountUp from 'react-countup';

const SalesSummaryCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const currentData = salesSummaryData[selectedPeriod];
  
  const periodOptions = [
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '📊' },
    { value: 'monthly', label: 'Monthly', icon: '📈' },
    { value: 'yearly', label: 'Yearly', icon: '🎯' }
  ];

  const earningsGrowth = ((currentData.currentEarnings - currentData.previousEarnings) / currentData.previousEarnings * 100).toFixed(1);
  const salesGrowth = ((currentData.currentSales - currentData.previousSales) / currentData.previousSales * 100).toFixed(1);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 truncate">{currentData.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{currentData.subtitle}</p>
        </div>
        
        {/* Period Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xs font-medium text-gray-700">
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
                    selectedPeriod === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Current Earnings */}
        <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center space-x-1 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Gelir</span>
          </div>
          <div className="text-lg font-bold text-green-900 leading-tight">
            ₺<CountUp end={currentData.currentEarnings} duration={1.5} separator="." />
          </div>
          <div className="flex items-center space-x-1 mt-1">
            {earningsGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`text-xs font-medium ${earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {earningsGrowth >= 0 ? '+' : ''}{earningsGrowth}%
            </span>
          </div>
        </div>

        {/* Current Sales */}
        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-1 mb-2">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Satış</span>
          </div>
          <div className="text-lg font-bold text-blue-900 leading-tight">
            <CountUp end={currentData.currentSales} duration={1.5} separator="." />
          </div>
          <div className="flex items-center space-x-1 mt-1">
            {salesGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-blue-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`text-xs font-medium ${salesGrowth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {salesGrowth >= 0 ? '+' : ''}{salesGrowth}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="period" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="iphone"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2 }}
              name="iPhone"
            />
            <Line
              type="monotone"
              dataKey="ipad"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2 }}
              name="iPad"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Toplam"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">iPhone</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">iPad</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span className="text-sm text-gray-600">Toplam</span>
        </div>
      </div>
    </div>
  );
};

export default SalesSummaryCard;