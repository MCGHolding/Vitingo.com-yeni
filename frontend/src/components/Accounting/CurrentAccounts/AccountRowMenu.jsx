import React, { useEffect, useRef } from 'react';

const AccountRowMenu = ({ account, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { icon: '📧', label: 'E-posta Gönder', action: 'email', color: 'text-gray-700' },
    { icon: '💬', label: 'WhatsApp Mesaj', action: 'whatsapp', color: 'text-green-600' },
    { type: 'divider' },
    { icon: '📋', label: 'Hesap Detayı', action: 'detail', color: 'text-blue-600' },
    { icon: '📊', label: 'Hesap Özeti', action: 'summary', color: 'text-gray-700' },
    { icon: '📄', label: 'Ekstre Al', action: 'statement', color: 'text-gray-700' },
    { type: 'divider' },
    { icon: '💳', label: 'Ödeme Girişi', action: 'payment', color: 'text-green-600' },
    { icon: '🧾', label: 'Fatura Kes', action: 'invoice', color: 'text-blue-600' },
    { type: 'divider' },
    { icon: '⚠️', label: 'Hatırlatma Gönder', action: 'reminder', color: 'text-orange-600' },
    { icon: '🔔', label: 'Bildirim Oluştur', action: 'notification', color: 'text-gray-700' },
    { type: 'divider' },
    { icon: '✏️', label: 'Düzenle', action: 'edit', color: 'text-gray-700' },
    { icon: '🗑️', label: 'Pasife Al', action: 'deactivate', color: 'text-red-600' }
  ];

  const handleAction = (action) => {
    console.log(`Action: ${action} for account: ${account.id}`);
    // Burada action'a göre işlem yapılacak
    switch (action) {
      case 'email':
        window.location.href = `mailto:${account.email || ''}?subject=Cari Hesap Bildirimi`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${account.phone || ''}`, '_blank');
        break;
      case 'detail':
        // Navigate to detail page
        break;
      // ... diğer action'lar
      default:
        break;
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
      style={{ transform: 'translateX(-10px)' }}
    >
      {/* Hesap Bilgisi */}
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
        <p className="text-xs text-gray-500">{account.accountNo}</p>
      </div>
      
      {/* Menü Öğeleri */}
      <div className="py-1">
        {menuItems.map((item, index) => (
          item.type === 'divider' ? (
            <div key={index} className="my-1 border-t border-gray-100" />
          ) : (
            <button
              key={index}
              onClick={() => handleAction(item.action)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${item.color}`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default AccountRowMenu;