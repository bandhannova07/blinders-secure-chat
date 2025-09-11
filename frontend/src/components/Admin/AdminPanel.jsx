import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, Users, Database, Settings, BarChart3, Shield, LogOut } from 'lucide-react';
import UserManagement from './UserManagement';
import SystemStats from './SystemStats';
import BlindersLogo from '../UI/BlindersLogo';
import axios from 'axios';
import toast from 'react-hot-toast';
import RoomManagement from './RoomManagement';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'rooms', label: 'Room Management', icon: Shield },
    { id: 'stats', label: 'System Stats', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'stats':
        return <SystemStats stats={stats} onRefresh={loadStats} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blinders-black">
      {/* Header */}
      <div className="bg-blinders-dark border-b border-blinders-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BlindersLogo size="medium" showText={false} />
              <div>
                <h1 className="text-xl font-bold text-blinders-gold">Admin Panel</h1>
                <p className="text-sm text-gray-400">Blinders Secure Chat Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.username}</p>
                <p className="text-xs text-blinders-gold capitalize">
                  {user?.role?.replace('-', ' ')}
                </p>
              </div>
              <div className="text-2xl">
                {user?.role === 'president' ? '👑' : '⚔️'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-blinders-dark border-b border-blinders-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blinders-gold text-blinders-gold'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinders-gold mx-auto mb-4"></div>
              <p className="text-gray-400">Loading admin panel...</p>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
