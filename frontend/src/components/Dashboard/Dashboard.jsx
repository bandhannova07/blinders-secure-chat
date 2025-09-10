import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Header from './Header';
import JoinRequests from '../Admin/JoinRequests';
import Settings from '../Settings/Settings';
import { Menu, X, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
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
    <div className="h-screen flex flex-col bg-blinders-black">
      {/* Header */}
      <Header 
        user={user}
        connected={connected}
        onMenuClick={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:relative md:translate-x-0 z-30
          w-80 h-full transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            onRoomSelect={handleRoomSelect}
            selectedRoom={selectedRoom}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">👑</div>
                <h2 className="text-2xl font-bold text-blinders-gold mb-2">
                  Welcome to Blinders Secure Chat
                </h2>
                <p className="text-gray-400 mb-6">
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

      {/* Join Requests Modal */}
      {showJoinRequests && (
        <JoinRequests onClose={() => setShowJoinRequests(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
      </div>
    </div>
  );
};

export default Dashboard;
