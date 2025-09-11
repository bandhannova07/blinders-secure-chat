/**
 * Utility function to ping backend health endpoint
 * Keeps the backend alive and checks connectivity
 */
export const pingBackend = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend Alive ✅', data);
      return { success: true, data };
    } else {
      console.log('Backend unreachable ❌');
      return { success: false, error: 'Response not ok' };
    }
  } catch (error) {
    console.log('Backend unreachable ❌');
    return { success: false, error: error.message };
  }
};
