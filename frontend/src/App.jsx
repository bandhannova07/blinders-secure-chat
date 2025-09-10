import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AdminPanel from './components/Admin/AdminPanel';
import LocalhostRestriction from './components/LocalhostRestriction';

function App() {
  return (
    <LocalhostRestriction>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-blinders-black">
            <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #d4af37',
              },
              success: {
                iconTheme: {
                  primary: '#d4af37',
                  secondary: '#1a1a1a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc143c',
                  secondary: '#1a1a1a',
                },
              },
            }}
          />
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </LocalhostRestriction>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blinders-gold mx-auto mb-4"></div>
          <p className="text-blinders-gold">Loading Blinders Secure Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/dashboard" 
        element={
          user ? (
            <SocketProvider>
              <Dashboard />
            </SocketProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          user && ['president', 'vice-president'].includes(user.role) ? (
            <SocketProvider>
              <AdminPanel />
            </SocketProvider>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
