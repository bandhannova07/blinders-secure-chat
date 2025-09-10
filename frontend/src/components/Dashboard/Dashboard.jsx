import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Header from './Header';
import JoinRequests from '../Admin/JoinRequests';
import JoinRequestPopup from '../Admin/JoinRequestPopup';
import UserControlMenu from '../Admin/UserControlMenu';
import Settings from '../Settings/Settings';
import MediaManagement from '../Admin/MediaManagement';
import { Menu, X, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMediaManagement, setShowMediaManagement] = useState(false);
  const [showUserControl, setShowUserControl] = useState(false);
  const [joinRequestPopup, setJoinRequestPopup] = useState(null);

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
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        onShowJoinRequests={() => setShowJoinRequests(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowMediaManagement={() => setShowMediaManagement(true)}
        onShowUserControl={() => setShowUserControl(true)}
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
                  By order of the BLINDERS
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Requests Modal */}
      {showJoinRequests && (
        <JoinRequests onClose={() => setShowJoinRequests(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
            <Settings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* Media Management Modal */}
      {showMediaManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Media Management</h2>
              <button
                onClick={() => setShowMediaManagement(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <MediaManagement />
            </div>
          </div>
        </div>
      )}

      {/* User Control Menu */}
      {showUserControl && (
        <UserControlMenu 
          user={user}
          onClose={() => setShowUserControl(false)}
        />
      )}

      {/* Join Request Popup */}
      {joinRequestPopup && (
        <JoinRequestPopup
          request={joinRequestPopup}
          onClose={() => setJoinRequestPopup(null)}
          onApprove={(userId, role) => {
            // Handle approval
            setJoinRequestPopup(null);
          }}
          onDecline={(userId) => {
            // Handle decline
            setJoinRequestPopup(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
