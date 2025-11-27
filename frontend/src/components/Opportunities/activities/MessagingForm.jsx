import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { 
  MessageSquare, 
  Send,
  User,
  Clock,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Image,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const SAMPLE_MESSAGES = [
  {
    id: '1',
    content: 'Merhaba, stand tasarımı konusunda görüşmek istiyoruz.',
    sender: 'customer',
    sender_name: 'Ahmet Yılmaz',
    timestamp: '2024-10-08T09:30:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: '2',
    content: 'Merhaba Ahmet Bey, tabii ki! Size nasıl yardımcı olabiliriz?',
    sender: 'us',
    sender_name: 'Murat Bucak',
    timestamp: '2024-10-08T09:32:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: '3',
    content: '3x6 metrelik bir alanımız var. Modern ve çekici bir tasarım istiyoruz.',
    sender: 'customer',
    sender_name: 'Ahmet Yılmaz',
    timestamp: '2024-10-08T09:35:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: '4',
    content: 'Anlıyorum. Size birkaç örnek tasarım gönderebilirim. Hangi sektörde faaliyet gösteriyorsunuz?',
    sender: 'us',
    sender_name: 'Murat Bucak',
    timestamp: '2024-10-08T09:37:00Z',
    status: 'delivered',
    type: 'text'
  },
  {
    id: '5',
    content: 'Medikal cihazlar alanında çalışıyoruz.',
    sender: 'customer',
    sender_name: 'Ahmet Yılmaz',
    timestamp: '2024-10-08T10:15:00Z',
    status: 'read',
    type: 'text'
  }
];

export default function MessagingForm({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Şimdi' : `${diffInMinutes} dk önce`;
    }
    
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Add message immediately to UI
    const newMsg = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'us',
      sender_name: 'Murat Bucak',
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: 'text'
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status to delivered
      setMessages(prev => prev.map(msg => 
        msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
      ));

      // Simulate customer typing response
      setTimeout(() => setIsTyping(true), 2000);
      setTimeout(() => {
        setIsTyping(false);
        // Add sample customer response
        const customerResponse = {
          id: (Date.now() + 1).toString(),
          content: 'Teşekkür ederim, bekliyorum.',
          sender: 'customer',
          sender_name: 'Ahmet Yılmaz',
          timestamp: new Date().toISOString(),
          status: 'read',
          type: 'text'
        };
        setMessages(prev => [...prev, customerResponse]);
        
        // Mark our message as read
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'read' } : msg
        ));
      }, 4000);

      const messageRecord = {
        type: 'messaging',
        opportunity_id: opportunityId,
        data: {
          message: messageText,
          direction: 'outgoing'
        },
        created_at: new Date().toISOString(),
        id: Date.now().toString()
      };

      // Don't close modal, just save the activity
      // onSave(messageRecord);

    } catch (error) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Header with Close Button */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-pink-600" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Müşteri Mesajlaşması</h3>
            <p className="text-xs text-gray-500">Ahmet Yılmaz ile mesajlaşma</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Container */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Mesajlaşma</span>
            </CardTitle>
            <div className="text-sm opacity-90">
              Son görülme: 2 dakika önce
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'us' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'us'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.sender === 'us' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">{formatTime(message.timestamp)}</span>
                    {message.sender === 'us' && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-xs text-gray-500">yazıyor...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Image className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  disabled={sending}
                  className="pr-12"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Quick Responses */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Teşekkür ederim',
                'Size geri dönüş yapacağım',
                'Ek bilgi gönderebilir misiniz?',
                'Toplantı planlayalım'
              ].map((quickReply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage(quickReply)}
                  className="text-xs h-7 border-gray-300 hover:bg-gray-50"
                >
                  {quickReply}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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