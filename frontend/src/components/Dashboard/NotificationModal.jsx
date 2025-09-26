import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send,
  X,
  MessageCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function NotificationModal({ notification, onClose, onBack }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [senderUser, setSenderUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Get sender user info
  useEffect(() => {
    // In a real app, you'd fetch this from backend
    // For now, get from usersData
    const usersData = JSON.parse(localStorage.getItem('vitingo_users') || '[]');
    const sender = usersData.find(u => u.id === notification.senderId);
    setSenderUser(sender);
  }, [notification.senderId]);

  // Load conversation messages
  useEffect(() => {
    loadMessages();
  }, [notification.senderId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    const conversationId = generateConversationId(currentUser.id, notification.senderId);
    const savedMessages = JSON.parse(localStorage.getItem(`messages_${conversationId}`) || '[]');
    setMessages(savedMessages);
  };

  const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendReply = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);

    try {
      const message = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        receiverId: notification.senderId,
        receiverName: senderUser?.fullName || 'Unknown',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      };

      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      // Save to localStorage
      const conversationId = generateConversationId(currentUser.id, notification.senderId);
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(updatedMessages));

      // Create notification for the original sender
      const replyNotification = {
        id: Date.now() + '_reply_notif',
        userId: notification.senderId,
        type: 'message',
        title: `${currentUser.fullName} mesajınıza yanıt verdi`,
        message: newMessage.trim(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        timestamp: new Date().toISOString(),
        read: false,
        messageId: message.id
      };

      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      existingNotifications.push(replyNotification);
      localStorage.setItem('notifications', JSON.stringify(existingNotifications));

      setNewMessage('');

      toast({
        title: "Yanıt Gönderildi",
        description: `${senderUser?.fullName || 'Kullanıcı'} kişisine yanıtınız iletildi`,
      });

    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Hata",
        description: "Yanıt gönderilemedi, lütfen tekrar deneyin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return messageDate.toLocaleDateString('tr-TR');
    }
  };

  if (!senderUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-1 hover:bg-blue-600 rounded"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <MessageCircle className="h-5 w-5" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {senderUser.fullName?.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{senderUser.fullName}</span>
                <p className="text-blue-100 text-sm font-normal">{senderUser.department}</p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz mesaj yok</p>
                <p className="text-sm">İlk mesajı göndererek konuşmaya başlayın</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isMyMessage = message.senderId === currentUser.id;
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMyMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                            isMyMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Reply Input */}
          <div className="border-t bg-white p-4">
            <div className="flex space-x-2">
              <Input
                placeholder={`${senderUser.fullName} kişisine yanıt yazın...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendReply}
                disabled={!newMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}