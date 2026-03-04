import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { apiFetch } from "../lib/apiClient";
import PropertyValue from "../components/PropertyValue";

type DeviceDetail = {
  guid: string;
  title: string;
  port: number;
  shortAddress: number;
  type: string;
  gtin?: string;
  serial?: string;
  zones?: string[];
  properties: string[];
};

export default function DeviceDetailPage() {
  const { guid, controller } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const res = await apiFetch(`/api/devices/${controller}/${guid}`, {
          method: "GET",
        });
        if (!res.ok)
          throw new Error(`Failed to get device details (${res.status})`);
        const data = await res.json();
        setDevice(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load device information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [guid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading device data...
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

  if (!device) return null;

  return (
    <div className="h-full bg-gray-50 p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        Back
      </button>
      <h1 className="text-3xl font-semibold mb-2 text-gray-800">
        {device.title}
      </h1>
      <p className="text-gray-600 mb-4">
        Type: {device.type} | Address: {device.shortAddress} | Port:{" "}
        {device.port}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow text-gray-800">
          <h2 className="text-xl font-bold mb-3 ">Static Info</h2>
          {device.gtin && <p>GTIN: {device.gtin}</p>}
          {device.serial && <p>Serial: {device.serial}</p>}
          {device.zones && <p>Zones: {device.zones.join(", ")}</p>}
        </div>

        <div className="bg-white p-4 rounded shadow flex flex-col">
          <h2 className="text-xl font-bold mb-3 text-gray-800">
            Live Properties
          </h2>
          <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            {device.properties && device.properties.length > 0 ? (
              device.properties.map((prop) => (
                <PropertyValue
                  key={prop}
                  guid={guid as string}
                  property={prop}
                  controller={controller as string}
                />
              ))
            ) : (
              <p className="text-gray-500 italic p-2">
                No properties available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
