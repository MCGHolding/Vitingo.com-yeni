import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { customerSegments } from '../../mock/data';

export default function CustomerSegmentChart() {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color }}>
            {`${payload[0].value}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Müşteri Segmentleri</h3>
        <p className="text-sm text-gray-600 mt-1">Müşteri dağılım analizi</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={customerSegments}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {customerSegments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        {customerSegments.map((segment, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: segment.color }}
            ></div>
            <span className="text-sm text-gray-600">{segment.segment}</span>
          </div>
        ))}
      </div>
    </div>
  );
}