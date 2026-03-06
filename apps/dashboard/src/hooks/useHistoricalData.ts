import { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

export function useHistoricalData(
  controller: string,
  deviceGuid: string | null,
  property: string,
  timeRange: string,
) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceGuid || !property) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/api/devices/${controller}/${deviceGuid}/history?property=${property}&range=${timeRange}`,
        );
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch historical data:", err);
        setError(err.message || "Failed to fetch historical data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceGuid, property, timeRange]);

  return { data, loading, error };
}
