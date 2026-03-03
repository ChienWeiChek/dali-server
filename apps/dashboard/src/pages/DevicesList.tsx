import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

type Device = {
  guid: string;
  title: string;
  type: string;
  shortAddress: number;
  zones?: string[];
  properties?: string[];
  error?: boolean;
};

type DeviceListResponse = { deviceList: Device[] };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await apiFetch('/api/bmsapi/dali-devices', { method: 'GET' });
        if (!res.ok) throw new Error(`Failed to fetch devices: ${res.status}`);
        const data: DeviceListResponse = await res.json();
        setDevices(data.deviceList);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load DALI device list. Please check connection or credentials.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Group devices by zone
  const groupedDevices = devices.reduce<Record<string, Device[]>>((acc, device) => {
    const zoneKey = device.zones?.length ? device.zones.join(', ') : 'Unassigned';
    if (!acc[zoneKey]) acc[zoneKey] = [];
    acc[zoneKey].push(device);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading DALI devices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">{error}</div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">DALI Devices</h1>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        {Object.keys(groupedDevices).map((zone) => (
          <div key={zone} className="border rounded-md bg-white shadow-sm">
            <button
              className="w-full flex justify-between items-center p-4 text-left font-medium bg-gray-100 hover:bg-gray-200 text-black"
              onClick={() => setExpandedZone(expandedZone === zone ? null : zone)}
            >
              <span>{zone}</span>
              <span>{expandedZone === zone ? '-' : '+'}</span>
            </button>

            {expandedZone === zone && (
              <div className="p-4 space-y-2">
                {groupedDevices[zone].map((device) => (
                  <div
                    key={device.guid}
                    className="border rounded p-3 hover:bg-blue-50 cursor-pointer transition"
                    onClick={() =>
                      window.open(`/devices/${device.guid}`, '_self')
                    }
                  >
                    <p className="font-semibold text-gray-800">{device.title}</p>
                    <p className="text-sm text-gray-500">
                      Type: {device.type} | Address: {device.shortAddress}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
