import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  Target,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: true },
  { name: 'Müşteriler', href: '/customers', icon: Users, current: false },
  { name: 'Satışlar', href: '/sales', icon: TrendingUp, current: false },
  { name: 'Satış Fırsatları', href: '/opportunities', icon: Zap, current: false },
  { name: 'Raporlar', href: '/reports', icon: BarChart3, current: false },
  { name: 'Görevler', href: '/tasks', icon: Target, current: false },
  { name: 'Takvim', href: '/calendar', icon: Calendar, current: false },
  { name: 'Dökümanlar', href: '/documents', icon: FileText, current: false },
  { name: 'Ayarlar', href: '/settings', icon: Settings, current: false },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Bana Vitingo</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  item.current
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
                onClick={(e) => e.preventDefault()}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-slate-400 truncate">
                admin@banavitingo.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}