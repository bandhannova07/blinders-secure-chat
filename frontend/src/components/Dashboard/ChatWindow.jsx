import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const ChatWindow = ({ room }) => {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    typingUsers, 
    setMessages 
  } = useSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages when room changes
  useEffect(() => {
    if (room?.id) {
      loadMessages();
    }
  }, [room?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      sendTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 1000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, sendTyping]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/messages/room/${room.id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.length > 0 && !isTyping) {
      setIsTyping(true);
    } else if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getRoleEmoji = (role) => {
    const emojis = {
      'president': '👑',
      'vice-president': '⚔️',
      'team-core': '🔑',
      'study-circle': '📚',
      'shield-circle': '🛡️'
    };
    return emojis[role] || '👤';
  };

  if (!room) {
    return null;
  }

  return (
    <div className="flex-1 chat-container bg-blinders-dark">
      {/* Chat Header */}
      <div className="bg-blinders-dark border-b border-blinders-gray px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{room.icon}</div>
            <div>
              <h2 className="text-lg font-semibold text-white">{room.name}</h2>
              <p className="text-sm text-gray-400 capitalize">
                {room.role?.replace('-', ' ')} • {room.description || 'Secure Communication'}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-blinders-gray transition-colors duration-200">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold mx-auto mb-2"></div>
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">{room.icon}</div>
              <h3 className="text-xl font-semibold text-blinders-gold mb-2">
                Welcome to {room.name}
              </h3>
              <p className="text-gray-400">
                This is the beginning of your secure conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender.id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs">{getRoleEmoji(message.sender.role)}</span>
                      <span className="text-sm font-semibold text-gray-300">
                        {message.sender.username}
                      </span>
                    </div>
                  )}
                  <div
                    className={`
                      message-bubble
                      ${isOwnMessage ? 'message-sent' : 'message-received'}
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {typeof message.content === 'string' ? message.content : String(message.content || '')}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blinders-dark' : 'text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-blinders-gray rounded-lg px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-400">
                  {typingUsers[0].username} is typing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-blinders-gray transition-colors duration-200"
          >
            <Paperclip className="h-5 w-5 text-gray-400" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={`Message ${room.name}...`}
              className="input-field w-full pr-10"
              maxLength={1000}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-blinders-light-gray transition-colors duration-200"
            >
              <Smile className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${messageInput.trim() 
                ? 'bg-blinders-gold text-blinders-black hover:bg-blinders-light-gold' 
                : 'bg-blinders-gray text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>End-to-end encrypted</span>
          <span>{messageInput.length}/1000</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
