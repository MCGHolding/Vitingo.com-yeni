import React, { useState } from 'react';
import { Reply, Forward, Trash2, Download, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EmailComposer from './EmailComposer';

const EmailDetail = ({ email, onDelete, onRefresh, customerId, customer }) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📧</div>
          <p className="text-lg font-medium mb-2">E-posta Seçin</p>
          <p className="text-sm">Detayları görüntülemek için soldan bir e-posta seçin</p>
        </div>
      </div>
    );
  }
  
  // Format date
  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, "d MMMM yyyy, HH:mm", { locale: tr });
    } catch {
      return '';
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Action Bar */}
      <div className="px-6 py-3 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReplyComposer(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-white transition-colors"
          >
            <Reply className="h-4 w-4" />
            <span>Cevapla</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-white transition-colors"
          >
            <Forward className="h-4 w-4" />
            <span>İlet</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-white rounded transition-colors"
            title="Arşivle"
          >
            <Archive className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Bu e-postayı silmek istediğinize emin misiniz?')) {
                onDelete(email.id);
              }
            }}
            className="p-2 hover:bg-red-50 rounded transition-colors"
            title="Sil"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
      
      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Subject */}
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">{email.subject || '(Konu yok)'}</h2>
          
          {/* Sender Info */}
          <div className="flex items-start gap-4 mb-6 pb-6 border-b">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
              email.direction === 'inbound' ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {getInitials(email.from?.name || email.from?.email)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {email.from?.name || email.from?.email}
                    </span>
                    {email.from?.name && (
                      <span className="text-sm text-gray-500">
                        &lt;{email.from?.email}&gt;
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Kime:</span>{' '}
                    {email.to?.map(t => t.name || t.email).join(', ')}
                  </div>
                  
                  {email.cc && email.cc.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">CC:</span>{' '}
                      {email.cc.map(c => c.name || c.email).join(', ')}
                    </div>
                  )}
                  
                  {email.replyTo && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Cevap:</span> {email.replyTo}
                    </div>
                  )}
                </div>
                
                <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                  {formatFullDate(email.sentAt || email.receivedAt)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          {email.status && (
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                email.status === 'delivered' ? 'bg-green-100 text-green-800' :
                email.status === 'opened' ? 'bg-blue-100 text-blue-800' :
                email.status === 'bounced' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {email.status === 'sent' && '📤 Gönderildi'}
                {email.status === 'delivered' && '✅ Teslim Edildi'}
                {email.status === 'opened' && '👁️ Açıldı'}
                {email.status === 'received' && '📥 Alındı'}
                {email.status === 'bounced' && '⚠️ Bounce'}
              </span>
            </div>
          )}
          
          {/* Email Body */}
          <div className="prose prose-sm max-w-none mb-6">
            {email.bodyHtml ? (
              <div 
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                className="text-gray-800"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {email.bodyText || '(İçerik yok)'}
              </pre>
            )}
          </div>
          
          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Ekler ({email.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {email.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 text-2xl">
                      {att.contentType?.includes('image') ? '🖼️' :
                       att.contentType?.includes('pdf') ? '📄' :
                       att.contentType?.includes('zip') ? '🗜️' :
                       '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {att.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(att.size)}
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Reply Composer (Inline) */}
      {showReplyComposer && (
        <div className="border-t bg-gray-50 p-4">
          <EmailComposer
            customerId={customerId}
            customer={customer}
            replyToEmail={email}
            onClose={() => setShowReplyComposer(false)}
            onSent={() => {
              setShowReplyComposer(false);
              onRefresh();
            }}
            isReply={true}
          />
        </div>
      )}
    </div>
  );
};

export default EmailDetail;
