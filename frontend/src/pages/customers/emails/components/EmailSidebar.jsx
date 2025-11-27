import React from 'react';
import { Mail, Inbox, Star, Send, Clock, Archive } from 'lucide-react';

const EmailSidebar = ({ filter, onFilterChange, counts }) => {
  const menuItems = [
    { 
      id: 'all', 
      label: 'Tüm E-postalar', 
      icon: Inbox, 
      count: counts.all,
      color: 'text-gray-600'
    },
    { 
      id: 'unread', 
      label: 'Okunmamış', 
      icon: Mail, 
      count: counts.unread,
      color: 'text-blue-600'
    },
    { 
      id: 'starred', 
      label: 'Yıldızlı', 
      icon: Star, 
      count: counts.starred,
      color: 'text-yellow-600'
    },
    { 
      id: 'sent', 
      label: 'Gönderilenler', 
      icon: Send, 
      count: counts.sent,
      color: 'text-green-600'
    },
    { 
      id: 'awaiting', 
      label: 'Cevap Bekleyen', 
      icon: Clock, 
      count: counts.awaiting,
      color: 'text-orange-600'
    },
  ];
  
  return (
    <div className="w-64 bg-white border-r flex flex-col">
      {/* Klasörler */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">
          Klasörler
        </h3>
        
        <nav className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = filter === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onFilterChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : item.color}`} />
                  <span>{item.label}</span>
                </span>
                {item.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Ayırıcı */}
      <div className="border-t mx-4" />
      
      {/* İstatistikler */}
      <div className="p-4 flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">
          İstatistikler
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between px-2">
            <span className="text-gray-600">Toplam</span>
            <span className="font-medium text-gray-900">{counts.all}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-gray-600">Okunmamış</span>
            <span className="font-medium text-blue-600">{counts.unread}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-gray-600">Gönderilen</span>
            <span className="font-medium text-green-600">{counts.sent}</span>
          </div>
        </div>
      </div>
      
      {/* Alt kısım - Info */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            SendGrid Aktif
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            E-postalar platform üzerinden gönderilir
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;
