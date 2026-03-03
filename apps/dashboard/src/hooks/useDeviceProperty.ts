import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

interface PropertyValue {
  property: string;
  value: number;
  timestamp: string;
}

export function useDeviceProperty(
  deviceGuid: string | null,
  properties: string[],
  refreshInterval?: number
) {
  const [data, setData] = useState<PropertyValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceGuid || properties.length === 0) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = properties.map(p => `properties=${p}`).join('&');
        const response = await apiFetch(
          `/api/devices/${deviceGuid}/properties/latest?${queryParams}`
        );
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch device properties:', err);
        setError(err.message || 'Failed to fetch device properties');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [deviceGuid, properties.join(','), refreshInterval]);

  return { data, loading, error };
}
