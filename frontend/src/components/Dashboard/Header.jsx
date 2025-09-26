import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationModal from './NotificationModal';
import { 
  Menu,
  LogOut,
  User,
  Settings,
  Bell,
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      logout();
    }
    setShowUserMenu(false);
  };

  // Load notifications for current user
  const loadNotifications = () => {
    if (!user?.id) return;
    
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const userNotifications = allNotifications.filter(notif => notif.userId === user.id);
    const unreadNotifications = userNotifications.filter(notif => !notif.read);
    
    setNotifications(userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setUnreadCount(unreadNotifications.length);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = allNotifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    loadNotifications();
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = allNotifications.map(notif => 
      notif.userId === user?.id ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    loadNotifications();
  };

  // Handle notification click (open message thread)
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // Here you could open the message modal with the sender
    setShowNotifications(false);
  };

  // Load notifications when component mounts or user changes
  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu, showNotifications]);

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
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-y-auto">
                  <div className="py-2">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Bildirimler</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Tümünü okundu işaretle
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Henüz bildirim yok</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors ${
                            notification.read 
                              ? 'border-transparent' 
                              : 'border-blue-500 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {notification.senderName?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user ? user.fullName?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('') : 'AD'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user ? user.fullName : 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user ? user.department : 'Yönetici'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
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