import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";

/**
 * Fetcher function for SWR — must return the resolved data.
 */
const fetcher = async (url: string) => {
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} — ${response.statusText}`);
  }
  return response.json();
};

export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR("/api/devices", fetcher, {
    // Optional configuration
    revalidateOnFocus: true, // auto refresh when tab refocuses
    dedupingInterval: 10000, // avoid refetching within 10s
    refreshInterval: 30000, // auto refetch every 30 seconds
  });

  return {
    devices: data?.devices ?? [],
    liveDevices: data?.liveDevices ?? {},
    loading: isLoading,
    error: error ? error.message : null,
    mutate, // Expose mutate to allow manual refresh from components
  };
}
