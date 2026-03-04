import { Device } from "@/types/dashboard";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function DevicesByZone({
  groupedDevices,
  controller,
}: {
  groupedDevices: Record<string, Device[]>;
  controller: string;
}) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  return (
    <>
      {Object.keys(groupedDevices).map((zone) => (
        <div key={zone} className="border rounded-md bg-white shadow-sm">
          <button
            className="w-full flex justify-between items-center p-4 text-left font-medium bg-gray-100 hover:bg-gray-200 text-black"
            onClick={() => setExpandedZone(expandedZone === zone ? null : zone)}
          >
            <span>{zone}</span>
            <span>{expandedZone === zone ? "-" : "+"}</span>
          </button>

          {expandedZone === zone && (
            <div className="p-4 space-y-2">
              {groupedDevices[zone].map((device) => (
                <NavLink
                  to={`/devices/${controller}/${device.guid}`}
                  key={device.guid}
                >
                  <div className="border rounded p-3 hover:bg-blue-50 cursor-pointer transition">
                    <p className="font-semibold text-gray-800">
                      {device.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Type: {device.type} | Address: {device.shortAddress}
                    </p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
