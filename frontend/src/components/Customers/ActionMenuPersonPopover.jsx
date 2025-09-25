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
  const popoverRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
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
          
          {/* Popover Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
    </div>
  );
}