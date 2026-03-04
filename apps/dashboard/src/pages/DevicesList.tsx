import DevicesByZone from "../components/DeviceByZone";
import { useDevices } from "../hooks/useDevices";
import { Device } from "../types/dashboard";

export default function DevicesPage() {
  const { liveDevices: devices, loading, error } = useDevices();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading DALI devices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        DALI Devices
      </h1>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        {Object.keys(devices).map((controller) => {
          const groupedDevices = (devices[controller] as Device[])?.reduce<
            Record<string, Device[]>
          >((acc: Record<string, Device[]>, device: Device) => {
            const zoneKey = device.zones?.length
              ? device.zones.join(", ")
              : "Unassigned";
            if (!acc[zoneKey]) acc[zoneKey] = [];
            acc[zoneKey].push(device);
            return acc;
          }, {});

          return (
            <div key={controller}>
              <p className="font-medium text-lg mb-2">{controller}</p>
              <DevicesByZone
                groupedDevices={groupedDevices}
                controller={controller}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
