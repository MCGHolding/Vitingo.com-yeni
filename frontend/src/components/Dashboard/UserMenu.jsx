import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import UserSwitchModal from './UserSwitchModal';
import { 
  User,
  LogOut,
  Settings,
  ChevronDown,
  Clock,
  Shield,
  Users,
  RotateCcw,
  Crown
} from 'lucide-react';

export default function UserMenu() {
  const { user, logout, getRoleName, returnToAdmin, isImpersonating } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserSwitchModal, setShowUserSwitchModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      logout();
    }
  };

  const handleReturnToAdmin = () => {
    if (window.confirm('Admin hesabına geri dönmek istediğinizden emin misiniz?')) {
      returnToAdmin();
    }
    setIsOpen(false);
  };

  const handleUserSwitch = () => {
    setShowUserSwitchModal(true);
    setIsOpen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-white bg-slate-800 hover:bg-slate-700 px-4 py-3 w-full justify-start rounded-lg border border-slate-600"
      >
        <div className="flex-shrink-0 h-8 w-8">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium flex items-center space-x-2">
            <span>{user.fullName}</span>
            {isImpersonating() && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-400">{getRoleName(user.role)}</div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border-2 border-gray-300 py-2 z-50 backdrop-blur-sm">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.fullName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{getRoleName(user.role)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Giriş: {formatDate(user.loginTime)}</span>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Add profile/settings logic here
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4 mr-3 text-gray-500" />
                Profil ve Ayarlar
              </button>
              
              {/* Admin-only features */}
              {user.role === 'admin' && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  
                  {isImpersonating() ? (
                    <button
                      onClick={handleReturnToAdmin}
                      className="w-full flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4 mr-3" />
                      Admin Hesabına Dön
                    </button>
                  ) : (
                    <button
                      onClick={handleUserSwitch}
                      className="w-full flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-3" />
                      Kullanıcı Değiştir
                    </button>
                  )}
                </>
              )}
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Switch Modal */}
      {showUserSwitchModal && (
        <UserSwitchModal
          onClose={() => setShowUserSwitchModal(false)}
        />
      )}
    </div>
  );
}