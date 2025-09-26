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
  Clock
} from 'lucide-react';

export default function MessageModal({ user, onClose }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages for this conversation
  useEffect(() => {
    loadMessages();
  }, [user.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    // Load messages from localStorage (in real app, would come from backend)
    const conversationId = generateConversationId(currentUser.id, user.id);
    const savedMessages = JSON.parse(localStorage.getItem(`messages_${conversationId}`) || '[]');
    setMessages(savedMessages);
  };

  const generateConversationId = (userId1, userId2) => {
    // Create consistent conversation ID regardless of order
    return [userId1, userId2].sort().join('_');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);

    try {
      const message = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: `${currentUser.fullName}`,
        receiverId: user.id,
        receiverName: user.fullName || `${user.firstName} ${user.lastName}`,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      };

      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      // Save to localStorage (in real app, would send to backend)
      const conversationId = generateConversationId(currentUser.id, user.id);
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(updatedMessages));

      // Also save to global messages list for notifications
      const allMessages = JSON.parse(localStorage.getItem('all_messages') || '[]');
      allMessages.push(message);
      localStorage.setItem('all_messages', JSON.stringify(allMessages));

      // Create notification for the recipient
      const notification = {
        id: Date.now() + '_notif',
        userId: user.id, // recipient
        type: 'message',
        title: `${currentUser.fullName} size mesaj gönderdi`,
        message: newMessage.trim(),
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        timestamp: new Date().toISOString(),
        read: false,
        messageId: message.id
      };

      // Save notification to localStorage
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(existingNotifications));

      setNewMessage('');

      toast({
        title: "Mesaj Gönderildi",
        description: `${user.firstName} ${user.lastName} kişisine mesajınız iletildi`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi, lütfen tekrar deneyin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center space-x-3">
              <MessageCircle className="h-5 w-5" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{user.firstName} {user.lastName}</span>
                <p className="text-blue-100 text-sm font-normal">{user.department}</p>
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

          {/* Message Input */}
          <div className="border-t bg-white p-4">
            <div className="flex space-x-2">
              <Input
                placeholder={`${user.firstName} kişisine mesaj yazın...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
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