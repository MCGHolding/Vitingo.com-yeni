import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { salesFunnel } from '../../mock/data';

export default function SalesFunnelChart() {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p style={{ color: payload[0].payload.color }}>
            {`Adet: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Satış Hunisi</h3>
        <p className="text-sm text-gray-600 mt-1">Satış sürecinin aşama analizi</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesFunnel} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              type="category"
              dataKey="stage"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[0, 4, 4, 0]}
              fill={(entry) => entry.color}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center flex-wrap gap-4 mt-4">
        {salesFunnel.map((stage, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: stage.color }}
            ></div>
            <span className="text-sm text-gray-600">{stage.stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}