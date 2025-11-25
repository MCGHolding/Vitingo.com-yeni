import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ChevronDown, Search, X, User } from 'lucide-react';

/**
 * SearchableSelect - Aranabilir Select Component
 * 
 * Props:
 * - options: Array of {id/value, label, sublabel?, icon?} objects
 * - value: Selected option ID
 * - onChange: (selectedId) => void (legacy support)
 * - onValueChange: (selectedId) => void (preferred)
 * - placeholder: Input placeholder
 * - searchPlaceholder: Search placeholder
 * - disabled: Boolean
 * - className: Additional CSS classes
 * - emptyMessage: Message when no options found
 * - showAddNew: Boolean - Show "+Yeni Ekle" button at bottom
 * - onAddNew: () => void - Callback when add new button clicked
 * - addNewLabel: String - Label for add new button (default: "+ Yeni Ekle")
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  onValueChange,
  placeholder = "Seçim yapınız...",
  searchPlaceholder = "Ara...",
  disabled = false,
  className = "",
  emptyMessage = "Seçenek bulunamadı",
  showAddNew = false,
  onAddNew,
  addNewLabel = "+ Yeni Ekle"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(query) ||
        (option.sublabel && option.sublabel.toLowerCase().includes(query))
      );
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => (option.id || option.value) === value);

  const handleSelect = (optionId) => {
    setIsOpen(false);
    setSearchQuery('');
    // Support both onChange and onValueChange for compatibility
    if (onChange) {
      onChange(optionId);
    }
    if (onValueChange) {
      onValueChange(optionId);
    }
  };

  const clearSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Support both onChange and onValueChange for compatibility
    if (onChange) {
      onChange('');
    }
    if (onValueChange) {
      onValueChange('');
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main selector */}
      <div
        className={`
          relative flex items-center justify-between px-3 py-1 border border-gray-300 rounded-md 
          bg-white cursor-pointer transition-colors h-9
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        onClick={toggleDropdown}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.sublabel && (
                  <span className="text-xs text-gray-500 truncate">
                    {selectedOption.sublabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          {selectedOption && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={clearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Options list - scrollable area */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id || option.value}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-blue-50 
                      flex items-center space-x-2
                      ${(selectedOption?.id || selectedOption?.value) === (option.id || option.value) ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
                    `}
                    onClick={() => handleSelect(option.id || option.value)}
                  >
                    {option.icon ? (
                      <option.icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-gray-500 truncate">{option.sublabel}</span>
                      )}
                    </div>
                    {(selectedOption?.id || selectedOption?.value) === (option.id || option.value) && (
                      <div className="text-blue-600 ml-auto">✓</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : emptyMessage}
              </div>
            )}
          </div>

          {/* Add New Button - Outside scrollable area */}
          {showAddNew && onAddNew && (
            <div className="border-t border-gray-100 bg-white">
              <button
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50 flex items-center space-x-2 text-green-600 font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setSearchQuery('');
                  onAddNew();
                }}
              >
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}

          {/* Footer */}
          {filteredOptions.length > 0 && !showAddNew && (
            <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center bg-white">
              {filteredOptions.length} seçenek gösteriliyor
            </div>
          )}
        </div>
      )}
    </div>
  );
}