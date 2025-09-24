import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyRevenue } from '../../mock/data';

export default function RevenueChart() {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label} 2024`}</p>
          <p className="text-blue-600">
            {`Gelir: ${formatCurrency(payload[0].value)}`}
          </p>
          <p className="text-green-600">
            {`Müşteri: ${payload[1].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Aylık Gelir Trendi</h3>
        <p className="text-sm text-gray-600 mt-1">Son 12 ayın gelir ve müşteri analizi</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 6 }}
              activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
            />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 6 }}
              activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Aylık Gelir</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Yeni Müşteriler</span>
        </div>
      </div>
    </div>
  );
}