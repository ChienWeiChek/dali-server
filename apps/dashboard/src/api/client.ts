import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy handles this
});

export const getDevices = async () => {
  const response = await api.get('/devices');
  return response.data;
};

export const getDeviceHistory = async (guid: string, property: string, range = '24h') => {
  const response = await api.get(`/devices/${guid}/history`, {
    params: { property, range }
  });
  return response.data;
};

export default api;
