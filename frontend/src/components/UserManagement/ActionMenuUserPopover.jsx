import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  MoreHorizontal,
  Trash2,
  Share,
  Send,
  Mail
} from 'lucide-react';

export default function ActionMenuUserPopover({ user, onAction }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const menuItems = [
    {
      icon: Trash2,
      label: 'Sil',
      action: 'delete',
      color: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    },
    {
      icon: Share,
      label: 'Paylaş',
      action: 'share',
      color: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    },
    {
      icon: Send,
      label: 'Mesaj',
      action: 'message',
      color: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
    },
    {
      icon: Mail,
      label: 'Mail',
      action: 'email',
      color: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
    }
  ];

  const togglePopover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action) => {
    let message = '';
    let description = '';
    
    switch (action) {
      case 'delete':
        message = `${user.firstName} ${user.lastName} silindi`;
        description = 'Kullanıcı başarıyla sistemden kaldırıldı';
        break;
      case 'share':
        message = `${user.firstName} ${user.lastName} paylaşıldı`;
        description = 'Kullanıcı bilgileri paylaşım için hazırlandı';
        break;
      case 'message':
        message = `${user.firstName} ${user.lastName} ile mesajlaşma başlatıldı`;
        description = 'Mesaj penceresi açıldı';
        break;
      case 'email':
        message = `${user.firstName} ${user.lastName} için e-posta oluşturuldu`;
        description = 'E-posta editörü açıldı';
        break;
      default:
        message = 'İşlem gerçekleştirildi';
        description = `${action} işlemi tamamlandı`;
    }

    toast({
      title: message,
      description: description,
    });

    if (onAction) {
      onAction(action, user);
    }
    setIsOpen(false);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
        onClick={togglePopover}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {/* Popover Menu */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute right-0 top-full mt-1 z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <Card className="w-48 shadow-lg border border-gray-200">
            <CardContent className="p-2">
              <div className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleMenuItemClick(item.action)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${item.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}