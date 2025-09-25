import { useState } from 'react';
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
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Eye,
  Trophy,
  XCircle,
  Heart,
  User,
  UserPlus,
  UserSearch,
  ClipboardList,
  Files
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: true },
  { name: 'Müşteriler', href: '/customers', icon: Users, current: false },
  { name: 'Satışlar', href: '/sales', icon: TrendingUp, current: false },
  { 
    name: 'Müşteri Aday', 
    href: '/prospects', 
    icon: UserSearch, 
    current: false,
    hasSubmenu: true,
    submenu: [
      { name: 'Yeni Müşteri Adayı', href: '/prospects/new', icon: UserPlus },
      { name: 'Müşteri Adayları', href: '/prospects/all', icon: Users }
    ]
  },
  { 
    name: 'Satış Fırsatları', 
    href: '/opportunities', 
    icon: Zap, 
    current: false,
    hasSubmenu: true,
    submenu: [
      { name: 'Yeni Satış Fırsatı', href: '/opportunities/new', icon: Plus },
      { name: 'Açık Fırsatlar', href: '/opportunities/open', icon: Eye },
      { name: 'Kazanılan Fırsatlar', href: '/opportunities/won', icon: Trophy },
      { name: 'Kaybedilen Fırsatlar', href: '/opportunities/lost', icon: XCircle },
      { name: 'Favori Fırsatlar', href: '/opportunities/favorites', icon: Heart },
      { name: 'Tüm Satış Fırsatları', href: '/opportunities/all', icon: List }
    ]
  },
  { 
    name: 'Teklifler', 
    href: '/quotes', 
    icon: ClipboardList, 
    current: false,
    hasSubmenu: true,
    submenu: [
      { name: 'Yeni Teklif', href: '/quotes/new', icon: Plus },
      { name: 'Tüm Teklifler', href: '/quotes/all', icon: Files }
    ]
  },
  { name: 'Raporlar', href: '/reports', icon: BarChart3, current: false },
  { name: 'Görevler', href: '/tasks', icon: Target, current: false },
  { name: 'Takvim', href: '/calendar', icon: Calendar, current: false },
  { name: 'Dökümanlar', href: '/documents', icon: FileText, current: false },
  { name: 'Ayarlar', href: '/settings', icon: Settings, current: false },
];

export default function Sidebar({ 
  isOpen, 
  toggleSidebar, 
  onNewOpportunity, 
  onOpenOpportunities, 
  onNewUser, 
  onAllUsers, 
  onInactiveUsers, 
  onFormerUsers,
  onNewProspect,
  onAllProspects,
  onNewQuote,
  onAllQuotes
}) {
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const toggleSubmenu = (itemName) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  const handleMenuClick = (item, subItem = null) => {
    // Handle specific menu actions
    if (subItem && subItem.name === 'Yeni Müşteri Adayı') {
      if (onNewProspect) {
        onNewProspect();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Müşteri Adayları') {
      if (onAllProspects) {
        onAllProspects();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Yeni Satış Fırsatı') {
      if (onNewOpportunity) {
        onNewOpportunity();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Açık Fırsatlar') {
      if (onOpenOpportunities) {
        onOpenOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Yeni Teklif') {
      if (onNewQuote) {
        onNewQuote();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Teklifler') {
      if (onAllQuotes) {
        onAllQuotes();
      }
      return;
    }
    
    // Default click behavior (preventDefault for demo)
    if (!subItem) {
      if (item.hasSubmenu) {
        toggleSubmenu(item.name);
      } else {
        // Handle main menu navigation
        console.log('Navigate to:', item.href);
      }
    } else {
      // Handle submenu navigation
      console.log('Navigate to:', subItem.href);
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Vitingo</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isSubmenuOpen = openSubmenu === item.name;
            
            return (
              <div key={item.name}>
                {/* Main menu item */}
                <div
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                    item.current
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                  onClick={() => handleMenuClick(item)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.hasSubmenu && (
                    isSubmenuOpen ? 
                      <ChevronDown className="h-4 w-4 text-slate-400" /> :
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Submenu */}
                {item.hasSubmenu && isSubmenuOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          className="group flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                          onClick={(e) => {
                            e.preventDefault();
                            handleMenuClick(item, subItem);
                          }}
                        >
                          <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                          {subItem.name}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-slate-400 truncate">
                admin@vitingo.com
              </p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="space-y-1">
            <div>
              {/* User Management with submenu */}
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                  "text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
                onClick={() => toggleSubmenu('Kullanıcı Yönetimi')}
              >
                <User className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="flex-1">Kullanıcı Yönetimi</span>
                {openSubmenu === 'Kullanıcı Yönetimi' ? 
                  <ChevronDown className="h-4 w-4 text-slate-400" /> :
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                }
              </div>

              {/* User Management Submenu */}
              {openSubmenu === 'Kullanıcı Yönetimi' && (
                <div className="ml-6 mt-2 space-y-1">
                  <button
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => {
                      if (onNewUser) onNewUser();
                    }}
                  >
                    <Plus className="mr-3 h-4 w-4 flex-shrink-0" />
                    Yeni Kullanıcı
                  </button>
                  
                  <button
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => {
                      if (onAllUsers) onAllUsers();
                    }}
                  >
                    <Users className="mr-3 h-4 w-4 flex-shrink-0" />
                    Tüm Kullanıcılar
                  </button>
                  
                  <button
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => {
                      if (onInactiveUsers) onInactiveUsers();
                    }}
                  >
                    <Target className="mr-3 h-4 w-4 flex-shrink-0" />
                    Pasif Kullanıcılar
                  </button>
                  
                  <button
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                    onClick={() => {
                      if (onFormerUsers) onFormerUsers();
                    }}
                  >
                    <XCircle className="mr-3 h-4 w-4 flex-shrink-0" />
                    Önceki Kullanıcılar
                  </button>
                </div>
              )}
            </div>
            
            <button
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all duration-200"
              onClick={() => console.log('Profile clicked')}
            >
              <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
              Profil Ayarları
            </button>
            
            <button
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all duration-200"
              onClick={() => console.log('Logout clicked')}
            >
              <Target className="mr-3 h-4 w-4 flex-shrink-0" />
              Çıkış Yap
            </button>
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