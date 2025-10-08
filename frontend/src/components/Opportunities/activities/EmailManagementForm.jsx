import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { 
  Mail, 
  Send, 
  Inbox,
  Reply,
  Forward,
  Paperclip,
  User,
  Calendar,
  Eye,
  MoreVertical,
  Search,
  RefreshCw,
  Archive
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const SAMPLE_EMAILS = [
  {
    id: '1',
    subject: 'Stand Tasarımı Hakkında',
    sender: 'ahmet.yilmaz@ornekfirma.com',
    sender_name: 'Ahmet Yılmaz',
    received_at: '2024-10-08T10:30:00Z',
    content: 'Merhaba, stand tasarımı konusunda görüşmek istiyoruz. 3x6 metrelik alanımız var ve modern bir tasarım istiyoruz.',
    is_read: false,
    has_attachments: false
  },
  {
    id: '2',
    subject: 'Fuar Katılım Detayları',
    sender: 'info@ornekfirma.com',
    sender_name: 'Örnek Firma',
    received_at: '2024-10-07T14:15:00Z',
    content: 'Düsseldorf fuarına katılım için gerekli evrakları aldık. Stand kurulum tarihleri hakkında bilgi verebilir misiniz?',
    is_read: true,
    has_attachments: true
  },
  {
    id: '3',
    subject: 'Fiyat Teklifi Talebi',
    sender: 'satin.alma@ornekfirma.com',
    sender_name: 'Satın Alma Departmanı',
    received_at: '2024-10-06T09:45:00Z',
    content: 'Fuar standımız için detaylı fiyat teklifi talep ediyoruz. Lütfen tüm kalemleri içeren teklifinizi gönderiniz.',
    is_read: true,
    has_attachments: false
  }
];

export default function EmailManagementForm({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [emails, setEmails] = useState(SAMPLE_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composing, setComposing] = useState(false);
  const [replyData, setReplyData] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, is_read: true } : e
      ));
    }
  };

  const handleReply = (email) => {
    setReplyData({
      to: email.sender,
      subject: `Re: ${email.subject}`,
      content: `\n\n--- ${email.sender_name} tarafından gönderilen orijinal mesaj ---\n${email.content}`
    });
    setComposing(true);
  };

  const handleSendReply = async () => {
    if (!replyData.content.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen mesaj içeriği girin",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const emailReply = {
        type: 'email_reply',
        opportunity_id: opportunityId,
        data: replyData,
        created_at: new Date().toISOString(),
        id: Date.now().toString()
      };

      toast({
        title: "Başarılı",
        description: "E-posta başarıyla gönderildi",
      });

      onSave(emailReply);
    } catch (error) {
      toast({
        title: "Hata",
        description: "E-posta gönderilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setReplyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">E-posta Yönetimi</h3>
              <p className="text-sm text-green-700">Müşteri e-postalarını görüntüleyin ve yanıtlayın</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Email List */}
        <div className="space-y-4">
          
          {/* Email List Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Inbox className="h-5 w-5" />
                  <span>Gelen E-postalar</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setComposing(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Yeni
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedEmail?.id === email.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    } ${!email.is_read ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {email.sender_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{email.sender}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {email.has_attachments && (
                          <Paperclip className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500">{formatDate(email.received_at)}</span>
                        {!email.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-1 ${!email.is_read ? 'font-semibold' : ''}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {email.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Email Detail/Compose */}
        <div className="space-y-4">
          
          {!composing && !selectedEmail && (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">E-posta Seçin</p>
                <p className="text-sm">Detayları görüntülemek için soldan bir e-posta seçin</p>
              </div>
            </Card>
          )}

          {/* Email Detail View */}
          {!composing && selectedEmail && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReply(selectedEmail)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Yanıtla
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-1" />
                      İlet
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{selectedEmail.sender_name}</span>
                    <span>&lt;{selectedEmail.sender}&gt;</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedEmail.received_at)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedEmail.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compose/Reply View */}
          {composing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>{replyData.subject.startsWith('Re:') ? 'E-posta Yanıtla' : 'Yeni E-posta'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Alıcı
                  </label>
                  <Input
                    value={replyData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Konu
                  </label>
                  <Input
                    value={replyData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="E-posta konusu"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Mesaj
                  </label>
                  <Textarea
                    value={replyData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="E-posta içeriğinizi yazın..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Dosya Ekle
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setComposing(false);
                        setReplyData({ to: '', subject: '', content: '' });
                      }}
                      disabled={loading}
                    >
                      İptal
                    </Button>
                    <Button 
                      onClick={handleSendReply}
                      disabled={loading || !replyData.content.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gönder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-6"
        >
          Kapat
        </Button>
      </div>
    </div>
  );
}