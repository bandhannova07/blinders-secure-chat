/**
 * Utility function to ping backend health endpoint
 * Keeps the backend alive and checks connectivity
 */
export const pingBackend = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend Alive', data);
      return { success: true, data };
    } else {
      console.error('❌ Backend unreachable - Response not ok');
      return { success: false, error: 'Response not ok' };
    }
  } catch (error) {
    console.error('❌ Backend unreachable', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Start interval pinging to keep backend alive
 */
export const startBackendPing = () => {
  // Initial ping
  pingBackend();
  
  // Set interval to ping every 5 minutes
  const pingInterval = setInterval(() => {
    pingBackend();
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('🔄 Backend ping interval started (every 5 minutes)');
  
  return pingInterval;
};
