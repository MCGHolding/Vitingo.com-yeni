import { topPerformers } from '../../mock/data';
import { formatCurrency } from '../../lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

export default function TopPerformersTable() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800">En İyi Performanslar</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Bu ayın en başarılı satış temsilcileri</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-sm font-semibold text-gray-600 pb-3">Sıra</th>
              <th className="text-left text-sm font-semibold text-gray-600 pb-3">Satış Temsilcisi</th>
              <th className="text-right text-sm font-semibold text-gray-600 pb-3">Satış Adedi</th>
              <th className="text-right text-sm font-semibold text-gray-600 pb-3">Toplam Gelir</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {topPerformers.map((performer, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                <td className="py-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-gray-900">{performer.sales}</span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(performer.revenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}