import { cn } from '../../lib/utils';

export default function StatCard({ title, value, change, changeType, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
    green: "bg-gradient-to-r from-green-50 to-green-100 border-green-200",
    purple: "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200",
    orange: "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200",
    red: "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
  };

  const iconColorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500"
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow duration-200",
      colorClasses[color]
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {value}
          </p>
          {change && (
            <div className="flex items-center">
              <span className={cn(
                "text-sm font-medium",
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              )}>
                {changeType === 'positive' ? '+' : ''}{change}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                bu ay
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          iconColorClasses[color]
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}