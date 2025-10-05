import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Smile, Users, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ChatModal = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock users - in production this would come from API
  const mockUsers = [
    { id: 'demo_user', name: 'Demo User', email: 'demo@example.com', status: 'online' },
    { id: 'admin_user', name: 'Admin User', email: 'admin@example.com', status: 'online' },
    { id: 'user1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', status: 'away' },
    { id: 'user2', name: 'Fatma Demir', email: 'fatma@example.com', status: 'online' },
    { id: 'user3', name: 'Mehmet Kaya', email: 'mehmet@example.com', status: 'offline' }
  ];

  useEffect(() => {
    if (isOpen) {
      setUsers(mockUsers.filter(user => user.id !== currentUser.id));
    }
  }, [isOpen, currentUser.id]);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection management  
  const connectWebSocket = (userId) => {
    if (ws) {
      ws.close();
    }

    // For demo purposes, we'll use a mock chatroom ID
    const chatRoomId = `private_${Math.min(currentUser.id, userId)}_${Math.max(currentUser.id, userId)}`;
    
    // In production, you would get a JWT token from your auth context
    const token = localStorage.getItem('auth_token') || 'demo_token';
    
    try {
      // Use the REACT_APP_BACKEND_URL environment variable but replace http with ws
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const wsUrl = backendUrl.replace('http', 'ws');
      const websocket = new WebSocket(`${wsUrl}/api/v1/ws?token=${token}&chatroom_id=${chatRoomId}`);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setWs(null);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection_success':
        console.log('Connected successfully to chat room');
        if (data.recent_messages) {
          setMessages(data.recent_messages);
        }
        break;
      
      case 'message_received':
        setMessages(prev => [...prev, data.message]);
        break;
      
      case 'typing':
        if (data.is_typing && data.user_id !== currentUser.id) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.user_id), data.user_id]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.user_id));
        }
        break;
      
      case 'user_joined':
        console.log(`${data.username} joined the chat`);
        break;
      
      case 'user_left':
        console.log(`${data.username} left the chat`);
        break;
      
      case 'error':
        console.error('Chat error:', data.message);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !isConnected) return;

    const messageData = {
      type: 'chat_message',
      content: newMessage.trim(),
      message_type: 'text',
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify(messageData));
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: false
      }));
    }
  };

  const handleTyping = (typing) => {
    if (!ws || !isConnected) return;

    if (typing !== isTyping) {
      setIsTyping(typing);
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: typing
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In production, upload file to server first
    console.log('File selected:', file.name);
    
    // Mock file upload
    if (ws && isConnected) {
      const messageData = {
        type: 'chat_message',
        content: `📎 ${file.name}`,
        message_type: 'file',
        file_name: file.name,
        file_size: file.size,
        timestamp: new Date().toISOString()
      };

      ws.send(JSON.stringify(messageData));
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);
    connectWebSocket(user.id);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Close WebSocket when modal closes
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[600px] flex overflow-hidden">
        {/* User List Sidebar */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span>Sohbet</span>
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Kullanıcılar</span>
              </h4>
              
              {users.map(user => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(selectedUser.status)}`}></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedUser.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{selectedUser.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Bağlı
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        Bağlantı Kesildi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.sender_id === currentUser.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at || message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm italic">
                      Yazıyor...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleFileUpload}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Dosya Ekle"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping(e.target.value.length > 0);
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="1"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Gönder"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>
            </>
          ) : (
            /* No User Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Sohbet Başlatın
                </h4>
                <p className="text-gray-500">
                  Sol taraftan bir kullanıcı seçerek sohbete başlayın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;