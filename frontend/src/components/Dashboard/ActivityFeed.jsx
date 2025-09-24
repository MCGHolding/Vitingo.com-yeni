import { recentActivities } from '../../mock/data';
import { formatRelativeTime, formatCurrency } from '../../lib/utils';
import { 
  DollarSign, 
  UserPlus, 
  Calendar, 
  Phone,
  CheckCircle
} from 'lucide-react';

const activityIcons = {
  sale: DollarSign,
  customer: UserPlus,
  meeting: Calendar,
  'follow-up': Phone,
  completed: CheckCircle
};

const activityColors = {
  sale: 'text-green-600 bg-green-100',
  customer: 'text-blue-600 bg-blue-100',
  meeting: 'text-purple-600 bg-purple-100',
  'follow-up': 'text-orange-600 bg-orange-100',
  completed: 'text-emerald-600 bg-emerald-100'
};

export default function ActivityFeed() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Son Aktiviteler</h3>
        <p className="text-sm text-gray-600 mt-1">Güncel sistem aktiviteleri</p>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {recentActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];
          
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
              <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.customer}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.action}
                </p>
                {activity.amount && (
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(activity.amount)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">
          Tüm aktiviteleri görüntüle
        </button>
      </div>
    </div>
  );
}