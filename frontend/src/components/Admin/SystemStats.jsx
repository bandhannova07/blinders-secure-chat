import React from 'react';
import { Users, MessageSquare, Shield, Activity, RefreshCw } from 'lucide-react';

const SystemStats = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'text-blinders-gold',
      bgColor: 'bg-blinders-gold/10'
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    }
  ];

  const roleDistribution = stats.usersByRole || [];
  const roleNames = {
    'president': 'President',
    'vice-president': 'Vice President',
    'team-core': 'Team Core',
    'study-circle': 'Study Circle',
    'shield-circle': 'Shield Circle'
  };

  const roleEmojis = {
    'president': '👑',
    'vice-president': '⚔️',
    'team-core': '🔑',
    'study-circle': '📚',
    'shield-circle': '🛡️'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blinders-gold">System Statistics</h2>
          <p className="text-gray-400">Overview of Blinders Secure Chat system</p>
        </div>
        <button
          onClick={onRefresh}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-blinders-gold mb-4">Role Distribution</h3>
          <div className="space-y-3">
            {roleDistribution.map((role) => (
              <div key={role._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{roleEmojis[role._id]}</span>
                  <span className="text-white">{roleNames[role._id] || role._id}</span>
                </div>
                <span className="text-blinders-gold font-semibold">{role.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold text-blinders-gold mb-4">Activity Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Messages Today</span>
              <span className="text-white font-semibold">{stats.recentMessages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Banned Users</span>
              <span className="text-red-400 font-semibold">{stats.bannedUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Active Rooms</span>
              <span className="text-green-400 font-semibold">{stats.totalRooms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <h3 className="text-lg font-semibold text-blinders-gold mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blinders-gray rounded-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Database</p>
            <p className="text-xs text-green-400">Connected</p>
          </div>
          <div className="text-center p-4 bg-blinders-gray rounded-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">WebSocket</p>
            <p className="text-xs text-green-400">Active</p>
          </div>
          <div className="text-center p-4 bg-blinders-gray rounded-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Encryption</p>
            <p className="text-xs text-green-400">Enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStats;
