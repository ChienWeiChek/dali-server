import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";
import {
  ControllerInfo,
  MqttStatus,
  ProfileListResponse,
  ProfileData,
  MqttSettings,
} from "../types/mqtt";

const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export function useControllerInfo(controller: string) {
  const { data, error, isLoading } = useSWR<ControllerInfo>(
    controller ? `/api/mqtt/${controller}/info` : null,
    fetcher,
  );

  return {
    info: data,
    loading: isLoading,
    error,
  };
}

export function useMqttStatus(controller: string) {
  const { data, error, isLoading, mutate } = useSWR<MqttStatus>(
    controller ? `/api/mqtt/${controller}/status` : null,
    fetcher,
    { refreshInterval: 5000 }, // Refresh every 5 seconds
  );

  return {
    status: data,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useProfiles(controller: string) {
  const { data, error, isLoading, mutate } = useSWR<ProfileListResponse>(
    controller ? `/api/mqtt/${controller}/profiles` : null,
    fetcher,
  );

  return {
    profiles: data?.profiles || [],
    activeProfiles: data?.activeProfiles || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useProfileDetail(
  controller: string,
  profileName: string | null,
) {
  const { data, error, isLoading, mutate } = useSWR<ProfileData>(
    controller && profileName
      ? `/api/mqtt/${controller}/profiles/${profileName}`
      : null,
    fetcher,
  );

  return {
    profile: data,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

// Helper function to update MQTT settings
export async function updateMqttSettings(
  controller: string,
  settings: MqttSettings,
) {
  const response = await apiFetch(`/api/mqtt/${controller}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update MQTT settings");
  }

  return response.json();
}

// Helper function to update profile
export async function updateProfile(
  controller: string,
  profileName: string,
  data: ProfileData,
) {
  const response = await apiFetch(
    `/api/mqtt/${controller}/profiles/${profileName}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

// Helper function to activate profile
export async function activateProfile(
  controller: string,
  profileName: string,
) {
  const response = await apiFetch(
    `/api/mqtt/${controller}/profiles/${profileName}/activate`,
    {
      method: "PUT",
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to activate profile");
  }

  return response.json();
}

// Helper function to deactivate profile
export async function deactivateProfile(
  controller: string,
  profileName: string,
) {
  const response = await apiFetch(
    `/api/mqtt/${controller}/profiles/${profileName}/activate`,
    {
      method: "DELETE",
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to deactivate profile");
  }

  return response.json();
}

// Helper function to delete profile
export async function deleteProfile(
  controller: string,
  profileName: string,
) {
  const response = await apiFetch(
    `/api/mqtt/${controller}/profiles/${profileName}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete profile");
  }

  return response.json();
}
