import React, { useState } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import { geographicSales } from '../../mock/dashboardData';

const GeographicSalesMap = () => {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Simplified country coordinates for visualization
  const countryPositions = {
    'Turkey': { x: 60, y: 45 },
    'Germany': { x: 35, y: 25 },
    'France': { x: 25, y: 35 },
    'Italy': { x: 40, y: 50 },
    'Spain': { x: 15, y: 50 }
  };

  const maxSales = Math.max(...geographicSales.map(c => c.sales));

  const getCircleSize = (sales) => {
    const minSize = 8;
    const maxSize = 25;
    const normalized = sales / maxSales;
    return minSize + (maxSize - minSize) * normalized;
  };

  const getCircleColor = (sales) => {
    const normalized = sales / maxSales;
    if (normalized > 0.7) return '#10B981'; // Green
    if (normalized > 0.4) return '#F59E0B'; // Yellow
    return '#3B82F6'; // Blue
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Coğrafi Satış Dağılımı</h3>
          <p className="text-sm text-gray-600 mt-1">Ülkelere göre satış performansı</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Yüksek</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Orta</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Düşük</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        {/* Simplified Europe Map */}
        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8" style={{ height: '300px' }}>
          <svg 
            viewBox="0 0 100 80" 
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          >
            {/* Background continents (simplified shapes) */}
            <path 
              d="M10,20 Q20,15 35,20 Q45,18 55,25 Q65,22 75,30 Q80,35 85,40 Q80,50 70,55 Q60,60 45,58 Q35,62 25,58 Q15,55 10,45 Z"
              fill="#E5E7EB" 
              opacity="0.3"
            />
            
            {/* Sales circles for each country */}
            {geographicSales.map((country) => {
              const position = countryPositions[country.country];
              if (!position) return null;

              const size = getCircleSize(country.sales);
              const color = getCircleColor(country.sales);

              return (
                <g key={country.country}>
                  {/* Outer glow effect */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={size + 3}
                    fill={color}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                  {/* Main circle */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={size}
                    fill={color}
                    className="cursor-pointer transition-all duration-200 hover:opacity-80"
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                  {/* MapPin icon */}
                  <g transform={`translate(${position.x - 2}, ${position.y - 2})`}>
                    <MapPin className="w-4 h-4 text-white" />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-48">
              <h4 className="font-semibold text-gray-900 mb-2">{hoveredCountry.country}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Satış:</span>
                  <span className="font-medium">₺{hoveredCountry.sales.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Müşteri:</span>
                  <span className="font-medium">{hoveredCountry.customers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proje:</span>
                  <span className="font-medium">{hoveredCountry.projects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Büyüme:</span>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-medium">+{hoveredCountry.growth}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Toplam Ülke</p>
          <p className="text-xl font-bold text-gray-900">{geographicSales.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Toplam Müşteri</p>
          <p className="text-xl font-bold text-gray-900">
            {geographicSales.reduce((sum, c) => sum + c.customers, 0)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Aktif Proje</p>
          <p className="text-xl font-bold text-gray-900">
            {geographicSales.reduce((sum, c) => sum + c.projects, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeographicSalesMap;