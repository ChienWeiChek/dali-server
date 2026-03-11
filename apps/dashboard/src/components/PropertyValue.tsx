"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { parseErrorBits } from "../utils/dataTransform";

type PropertyData = {
  guid: string;
  property: string;
  date: string;
  time: string;
  value: number;
  unit?: string;
};

interface PropertyValueProps {
  guid: string;
  property: string;
  controller: string;
}

export default function PropertyValue({
  guid,
  property,
  controller,
}: PropertyValueProps) {
  const [data, setData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPropertyValue = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await apiFetch(
          `/api/devices/${controller}/${guid}/${property}`,
          { method: "GET" },
        );

        if (res.ok) {
          const propData = await res.json();
          setData(propData);
        } else {
          setError(true);
        }
      } catch (err: unknown) {
        console.error(`Failed to fetch property ${property}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyValue();
  }, [guid, property]);

  if (loading) {
    return (
      <div className="border-b py-2 text-sm text-gray-700 flex justify-between items-center">
        <span className="font-semibold">{property}</span>
        <span className="text-gray-500 italic">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-b py-2 text-sm text-gray-700 flex justify-between">
        <span className="font-semibold">{property}</span>
        <span className="text-red-500 italic">unknown</span>
      </div>
    );
  }

  return (
    <div className="border-b py-2 text-sm text-gray-700 flex justify-between">
      <span className="font-semibold">{property}</span>
      <span>
        {property === "errorBits" ? (
          <div className="flex flex-col gap-1">
            {parseErrorBits(data.value).length > 0 ? (
              parseErrorBits(data.value).map((error, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-1 rounded ${
                    error.severity === "error"
                      ? "bg-red-100 text-red-800"
                      : error.severity === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                  title={error.description}
                >
                  {error.name}
                </span>
              ))
            ) : (
              <span className="text-green-600">No errors</span>
            )}
          </div>
        ) : (
          `${data.value} ${data.unit || ""}`
        )}
      </span>
    </div>
  );
}
