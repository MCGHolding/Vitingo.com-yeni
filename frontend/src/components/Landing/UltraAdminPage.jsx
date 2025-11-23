import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  CreditCard,
  Headphones,
  FileText,
  Link,
  Database,
  Shield,
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import LibraryPage from './Library/LibraryPage';
import CollectionsPage from './CollectionsPage';

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Genel Bakış',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'users',
    title: 'Kullanıcı Yönetimi',
    subtitle: 'Tüm Kullanıcılar',
    icon: Users,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'companies',
    title: 'Şirket Yönetimi',
    subtitle: 'Kayıtlı Şirketler',
    icon: Building2,
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'analytics',
    title: 'Analitik & Raporlar',
    subtitle: 'Performans Metrikleri',
    icon: BarChart3,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'licenses',
    title: 'Lisans Yönetimi',
    subtitle: 'Plan ve Faturalar',
    icon: CreditCard,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'support',
    title: 'Destek Yönetimi',
    subtitle: 'Ticket Sistemi',
    icon: Headphones,
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'logs',
    title: 'Log Yönetimi',
    subtitle: 'Sistem Logları',
    icon: FileText,
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'integrations',
    title: 'Entegrasyonlar',
    subtitle: 'Sistem Entegrasyonları',
    icon: Link,
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'database',
    title: 'Veritabanı İşlemleri',
    subtitle: 'DB Yönetimi',
    icon: Database,
    color: 'from-violet-500 to-violet-600'
  },
  {
    id: 'security',
    title: 'Güvenlik Ayarları',
    subtitle: 'Kimlik Doğrulama',
    icon: Shield,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'notifications',
    title: 'Bildirim Yönetimi',
    subtitle: 'E-posta & SMS',
    icon: Bell,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'library',
    title: 'Kütüphane',
    subtitle: 'Master Veriler',
    icon: BookOpen,
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'documents',
    title: 'Dökümanlar',
    subtitle: 'Sözleşme Yönetimi',
    icon: FileText,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'collections',
    title: 'Collections',
    subtitle: 'MongoDB Yönetimi',
    icon: Database,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'settings',
    title: 'Platform Ayarları',
    subtitle: 'Sistem Ayarları',
    icon: Settings,
    color: 'from-gray-500 to-gray-600'
  }
];

const statsData = [
  {
    title: 'Toplam Kullanıcı',
    value: '1,247',
    change: '+12%',
    color: 'blue',
    icon: Users
  },
  {
    title: 'Aktif Şirketler',
    value: '89',
    change: '+8%',
    color: 'green',
    icon: Building2
  },
  {
    title: 'Aylık Gelir',
    value: '$45,231',
    change: '+23%',
    color: 'purple',
    icon: CreditCard
  },
  {
    title: 'Açık Ticketlar',
    value: '12',
    change: '-5%',
    color: 'orange',
    icon: Headphones
  }
];

const UltraAdminPage = () => {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-blue-600 via-purple-600 to-indigo-700 transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold text-white">Ultra Admin</h1>
                <p className="text-xs text-blue-200 mt-1">Vitingo CRM</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedMenu === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMenu(item.id)}
                  className={`w-full group mb-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? `bg-gradient-to-r ${item.color}`
                          : 'bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1 text-left">
                        <div className={`font-semibold text-sm ${isActive ? 'text-purple-600' : 'text-white'}`}>
                          {item.title}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-purple-400' : 'text-blue-200'}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    )}
                    {sidebarOpen && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-purple-600 translate-x-1' : 'text-white/50'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer - Logout */}
          <div className="p-4 border-t border-white/10">
            <button className="w-full flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">Çıkış Yap</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {menuItems.find((item) => item.id === selectedMenu)?.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {menuItems.find((item) => item.id === selectedMenu)?.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">Ultra Admin</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                UA
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {selectedMenu === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            stat.change.startsWith('+')
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                      <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* System Status */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sistem Durumu</h3>
                <div className="space-y-3">
                  {[
                    { name: 'API Servisleri', status: 'aktif', color: 'green' },
                    { name: 'Veritabanı', status: 'aktif', color: 'green' },
                    { name: 'Ödeme Sistemi', status: 'aktif', color: 'green' },
                    { name: 'E-posta Servisi', status: 'bakımda', color: 'yellow' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.color === 'green'
                              ? 'bg-green-500'
                              : 'bg-yellow-500 animate-pulse'
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold capitalize ${
                            item.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Library Page */}
          {selectedMenu === 'library' && (
            <LibraryPage />
          )}

          {/* Collections Page */}
          {selectedMenu === 'collections' && (
            <CollectionsPage />
          )}

          {/* Other menu content placeholders */}
          {selectedMenu !== 'dashboard' && selectedMenu !== 'library' && selectedMenu !== 'collections' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                {React.createElement(
                  menuItems.find((item) => item.id === selectedMenu)?.icon || Settings,
                  { className: 'w-12 h-12 text-purple-600' }
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {menuItems.find((item) => item.id === selectedMenu)?.title}
              </h3>
              <p className="text-gray-600 mb-6">
                Bu bölüm üzerinde çalışılıyor...
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">
                Yakında
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UltraAdminPage;
