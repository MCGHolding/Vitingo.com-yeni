import React, { useState } from 'react';
import { Search, Loader2, Paperclip, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const EmailList = ({ 
  emails, 
  loading, 
  selectedEmail, 
  onSelectEmail, 
  onToggleStar,
  page,
  totalPages,
  onPageChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter emails by search
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
      email.from?.name?.toLowerCase().includes(query) ||
      email.from?.email?.toLowerCase().includes(query) ||
      email.bodyText?.toLowerCase().includes(query)
    );
  });
  
  if (loading) {
    return (
      <div className="w-96 border-r bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-96 border-r flex flex-col bg-white">
      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="E-postalarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-center font-medium">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz e-posta yok'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-center mt-2">
                "Yeni E-posta" butonuna tıklayarak ilk e-postanızı gönderin
              </p>
            )}
          </div>
        ) : (
          filteredEmails.map(email => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmail?.id === email.id}
              onSelect={() => onSelectEmail(email)}
              onToggleStar={() => onToggleStar(email.id)}
            />
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t flex items-center justify-between text-sm bg-gray-50">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Önceki</span>
          </button>
          <span className="text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Sonraki</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Single email list item
const EmailListItem = ({ email, isSelected, onSelect, onToggleStar }) => {
  const isUnread = !email.isRead && email.direction === 'inbound';
  const isInbound = email.direction === 'inbound';
  
  // Format date
  const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch {
      return '';
    }
  };
  
  // Get display name and email
  const displayInfo = isInbound 
    ? { name: email.from?.name || email.from?.email, email: email.from?.email }
    : { name: email.to?.[0]?.name || email.to?.[0]?.email, email: email.to?.[0]?.email };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      } ${isUnread ? 'bg-blue-25' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${
          isInbound ? 'bg-green-500' : 'bg-blue-500'
        }`}>
          {getInitials(displayInfo.name)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Top row - Name and time */}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {isInbound ? displayInfo.name : `→ ${displayInfo.name}`}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {getRelativeDate(email.sentAt || email.receivedAt)}
            </span>
          </div>
          
          {/* Subject */}
          <div className={`text-sm truncate mb-1 ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
            {email.subject || '(Konu yok)'}
          </div>
          
          {/* Preview text */}
          <div className="text-xs text-gray-500 truncate">
            {email.bodyText?.substring(0, 80) || '(İçerik yok)'}
          </div>
          
          {/* Bottom row - Icons */}
          <div className="flex items-center gap-3 mt-2">
            {/* Direction icon */}
            <span className="text-xs text-gray-400">
              {isInbound ? '📥' : '📤'}
            </span>
            
            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {email.attachments.length}
              </span>
            )}
            
            {/* Unread indicator */}
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
            
            {/* Star button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar();
              }}
              className="ml-auto text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Star 
                className={`h-4 w-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailList;
