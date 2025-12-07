import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationModal from './NotificationModal';
import NotificationBell from './NotificationBell';
import { 
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Users
} from 'lucide-react';

const Header = ({ 
  toggleSidebar, 
  sidebarOpen, 
  onNewUser, 
  onAllUsers, 
  onInactiveUsers, 
  onFormerUsers 
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      logout();
    }
    setShowUserMenu(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Left side - could add breadcrumbs or page title here */}
          <div className="flex-1 lg:flex lg:items-center">
            <h1 className="hidden lg:block text-xl font-semibold text-gray-900 ml-4">
              Vitingo CRM Dashboard
            </h1>
          </div>

          {/* Right side - notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications - New MongoDB-based component */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all">
                    <span className="text-sm font-medium text-white">
                      {user ? (user.name || user.fullName)?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('') : 'AD'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user ? (user.name || user.fullName) : 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user ? user.department : 'Yönetici'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user ? user.fullName?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('') : 'AD'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user ? user.fullName : 'Admin User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user ? user.email : 'admin@company.com'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user ? user.department : 'Yönetici'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profilim
                    </button>

                    {/* User Management - only for admin and super-admin */}
                    {(user?.role === 'admin' || user?.role === 'super-admin') && (
                      <div className="relative group">
                        <button
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Users className="h-4 w-4 mr-3" />
                          Kullanıcı Yönetimi
                          <ChevronDown className="h-3 w-3 ml-auto" />
                        </button>
                        
                        {/* Submenu */}
                        <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onNewUser && onNewUser();
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Yeni Kullanıcı
                            </button>
                            <button
                              onClick={() => {
                                onAllUsers && onAllUsers();
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Tüm Kullanıcılar
                            </button>
                            <button
                              onClick={() => {
                                onInactiveUsers && onInactiveUsers();
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Pasif Kullanıcılar
                            </button>
                            <button
                              onClick={() => {
                                onFormerUsers && onFormerUsers();
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Önceki Kullanıcılar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Ayarlar
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;