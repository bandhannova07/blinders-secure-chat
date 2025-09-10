import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { SocketContext } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import JoinRequests from '../Admin/JoinRequests';
import Settings from '../Settings/Settings';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Menu, X, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { connected } = useContext(SocketContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    // On mobile, close sidebar when room is selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-blinders-black text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-80 bg-blinders-dark transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <Sidebar 
          onRoomSelect={handleRoomSelect} 
          selectedRoom={selectedRoom}
          onToggleSidebar={toggleSidebar}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-blinders-dark p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-blinders-gold transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : showJoinRequests ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <JoinRequests onBack={() => setShowJoinRequests(false)} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blinders-gold mb-4">
                  Welcome to Blinders Secure Chat
                </h2>
                <p className="text-gray-400">
                  Select a room from the sidebar to start chatting
                </p>
                {user?.role === 'president' && (
                  <button
                    onClick={() => setShowJoinRequests(true)}
                    className="btn-primary flex items-center space-x-2 mx-auto mb-4"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Manage Join Requests</span>
                  </button>
                )}
                <p className="text-sm text-gray-500">
                  By order of the Peaky Blinders
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
