import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Bildirimleri yükle
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bildirimi okundu işaretle
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Bildirim güncellenemedi:', error);
    }
  };

  // Tüm bildirimleri okundu işaretle
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/user/${user.id}/mark-all-read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Bildirimler güncellenemedi:', error);
    }
  };

  // Bildirimi sil
  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  // Bildirime tıklama
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setShowDropdown(false);
  };

  // Component mount olduğunda ve her 30 saniyede bir bildirimleri yükle
  useEffect(() => {
    if (!user?.id) return;
    
    loadNotifications();
    
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]); // loadNotifications is stable, no need to include

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Öncelik rengini al
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  // Öncelik ikonu
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-gray-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  // Tarih formatlama
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Tümünü okundu işaretle</span>
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Henüz bildirim yok</p>
                <p className="text-xs text-gray-400 mt-1">Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-all ${
                      notification.isRead 
                        ? 'border-transparent' 
                        : getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm ${notification.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </p>
                          {notification.relatedType && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {notification.relatedType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
