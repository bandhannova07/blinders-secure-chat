import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import CryptoJS from 'crypto-js';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('authToken');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Encryption key (in production, this should be derived from user credentials)
  const encryptionKey = `blinders_${user?.id}_${user?.username}`;

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      console.log('Initializing socket connection for user:', user.username);
      console.log('Using token:', token ? 'Token present' : 'No token');
      console.log('Socket URL:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: {
          token: token
        }
      });

      newSocket.connect();

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Authenticate with the server
        newSocket.emit('authenticate', token);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data.user);
        toast.success('Connected to Blinders Secure Chat');
      });

      newSocket.on('auth-error', (data) => {
        console.error('Socket auth error:', data.error);
        toast.error('Connection authentication failed');
        setConnected(false);
      });

      newSocket.on('error', (data) => {
        console.error('Socket error:', data.error);
        toast.error(data.error);
      });

      newSocket.on('joined-room', (data) => {
        console.log('Joined room:', data);
        setCurrentRoom(data);
        toast.success(`Joined ${data.roomIcon} ${data.roomName}`);
      });

      newSocket.on('left-room', (data) => {
        console.log('Left room:', data);
        if (currentRoom?.roomId === data.roomId) {
          setCurrentRoom(null);
          setMessages([]);
        }
      });

      newSocket.on('new-message', (message) => {
        console.log('New message received:', message);
        
        // Decrypt message if encrypted
        let decryptedContent = message.content;
        if (message.isEncrypted && message.content) {
          try {
            const bytes = CryptoJS.AES.decrypt(message.content, encryptionKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
              decryptedContent = decrypted;
            }
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            // Keep original content if decryption fails
          }
        }

        // Ensure content is always a string and sanitized
        const sanitizedContent = typeof decryptedContent === 'string' 
          ? decryptedContent.trim() 
          : String(decryptedContent || '').trim();

        const processedMessage = {
          ...message,
          content: sanitizedContent,
          timestamp: new Date(message.timestamp)
        };

        setMessages(prev => {
          // Prevent duplicate messages
          const exists = prev.find(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, processedMessage];
        });
      });

      newSocket.on('user-joined', (data) => {
        console.log('User joined room:', data);
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      });

      newSocket.on('user-left', (data) => {
        console.log('User left room:', data);
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      newSocket.on('user-typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      newSocket.on('user-disconnected', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      // Listen for new join requests (President only)
      if (user?.role === 'president') {
        newSocket.on('new-join-request', (data) => {
          console.log('New join request received:', data);
          toast.success(`New join request from ${data.username}`, {
            duration: 6000,
            icon: '👤'
          });
        });
      }

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
      setMessages([]); // Clear previous messages
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (content, messageType = 'text') => {
    if (socket && connected && currentRoom && content?.trim()) {
      // Sanitize content
      const sanitizedContent = content.trim();
      
      // Encrypt message content
      let encryptedContent = sanitizedContent;
      let isEncrypted = false;

      try {
        encryptedContent = CryptoJS.AES.encrypt(sanitizedContent, encryptionKey).toString();
        isEncrypted = true;
      } catch (error) {
        console.error('Failed to encrypt message:', error);
        // Send unencrypted if encryption fails
        encryptedContent = sanitizedContent;
      }

      socket.emit('send-message', {
        roomId: currentRoom.roomId,
        content: encryptedContent,
        messageType,
        isEncrypted
      });
    }
  };

  const sendTyping = (isTyping) => {
    if (socket && connected && currentRoom) {
      socket.emit('typing', {
        roomId: currentRoom.roomId,
        isTyping
      });
    }
  };

  const value = {
    socket,
    connected,
    currentRoom,
    messages,
    onlineUsers,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
