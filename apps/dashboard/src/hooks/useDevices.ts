import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

interface Device {
  guid: string;
  title: string;
  zones?: string[];
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/devices');
        const data = await response.json();
        console.log("🚀 ~ fetchDevices ~ data:", data)
        setDevices(data.devices);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch devices:', err);
        setError(err.message || 'Failed to fetch devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, loading, error };
}
