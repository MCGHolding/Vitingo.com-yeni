import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { 
  Trash2,
  Share2,
  MessageCircle,
  Mail,
  MoreHorizontal
} from 'lucide-react';

export default function ActionMenuPersonPopover({ person, onDelete, onShare, onMessage, onMail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const { toast } = useToast();

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

  const handleAction = (action, actionName) => {
    setIsOpen(false);
    
    if (action) {
      action(person);
    } else {
      // Default action
      toast({
        title: `${actionName} İşlemi`,
        description: `${person.fullName} için ${actionName.toLowerCase()} işlemi başlatılıyor...`,
      });
    }
  };

  const togglePopover = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Menü yüksekliği (4 item + header = ~240px)
      const menuHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Eğer altta yeterli yer varsa alta aç, yoksa üste aç
      const shouldOpenUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      setPosition({
        top: shouldOpenUpward ? rect.top - menuHeight - 8 : rect.bottom + 8,
        right: window.innerWidth - rect.right,
        openUpward: shouldOpenUpward
      });
    }
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      icon: Trash2,
      label: 'Sil',
      action: onDelete,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    },
    {
      icon: Share2,
      label: 'Paylaş',
      action: onShare,
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
    },
    {
      icon: MessageCircle,
      label: 'Mesaj',
      action: onMessage,
      className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
    },
    {
      icon: Mail,
      label: 'Mail',
      action: onMail,
      className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
    }
  ];

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={togglePopover}
        className="text-gray-600 hover:text-gray-900"
        title="Daha Fazla İşlem"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover Menu - FIXED: Now appears as overlay */}
          <div 
            ref={popoverRef}
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
            style={{ 
              top: `${position.top}px`, 
              right: `${position.right}px`,
              zIndex: 9999
            }}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{person.fullName}</p>
              <p className="text-xs text-gray-500">{person.company}</p>
            </div>
            
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleAction(item.action, item.label)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium transition-colors duration-150 ${item.className}`}
                >
                  <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}