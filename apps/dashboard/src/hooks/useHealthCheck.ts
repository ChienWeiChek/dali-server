import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../lib/apiClient';
import type {
  HealthCheckResponse,
  OverallHealthStatus,
  HealthIndicatorState,
} from '../types/health';

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Determines the overall health status based on service health
 * - Critical: MQTT or InfluxDB is down
 * - Degraded: Some controllers are down
 * - Healthy: All services are operational
 */
function determineOverallStatus(
  data: HealthCheckResponse
): OverallHealthStatus {
  const { mqtt, influxdb, controllers } = data.services;

  // Critical if MQTT or InfluxDB is down
  if (mqtt.status === 'unhealthy' || influxdb.status === 'unhealthy') {
    return 'critical';
  }

  // Degraded if any controller is down
  if (controllers.some((controller) => controller.status === 'unhealthy')) {
    return 'degraded';
  }

  // Otherwise healthy
  return 'healthy';
}

/**
 * Requests notification permission if not already granted
 */
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Sends a browser notification for critical system status
 */
function sendCriticalNotification(data: HealthCheckResponse) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const { mqtt, influxdb } = data.services;
  const affectedServices: string[] = [];

  if (mqtt.status === 'unhealthy') {
    affectedServices.push(`MQTT Broker: ${mqtt.message}`);
  }

  if (influxdb.status === 'unhealthy') {
    affectedServices.push(`InfluxDB: ${influxdb.message}`);
  }

  const body =
    affectedServices.length > 0
      ? `Critical services are down:\n${affectedServices.join('\n')}`
      : 'System health has degraded to critical';

  const notification = new Notification('🔴 DALI IoT - Critical System Alert', {
    body,
    icon: '/favicon.ico',
    tag: 'health-critical',
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = '/health';
    notification.close();
  };
}

/**
 * Custom hook for monitoring system health
 * Polls the /api/health endpoint and provides real-time status updates
 * Sends browser notifications when status becomes critical
 */
export function useHealthCheck(pollInterval: number = POLL_INTERVAL) {
  const [state, setState] = useState<HealthIndicatorState>({
    status: 'healthy',
    data: null,
    loading: true,
    error: null,
    lastChecked: null,
  });

  const previousStatusRef = useRef<OverallHealthStatus | null>(null);
  const notificationPermissionRequested = useRef(false);

  /**
   * Fetches health data from the API
   */
  const fetchHealth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await apiFetch('/api/health');
      const data: HealthCheckResponse = await response.json();

      const overallStatus = determineOverallStatus(data);
      const now = new Date().toISOString();

      setState({
        status: overallStatus,
        data,
        loading: false,
        error: null,
        lastChecked: now,
      });

      // Send notification if status changed to critical
      if (
        previousStatusRef.current !== null &&
        previousStatusRef.current !== 'critical' &&
        overallStatus === 'critical'
      ) {
        sendCriticalNotification(data);
      }

      previousStatusRef.current = overallStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      }));
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Request notification permission on mount
  useEffect(() => {
    if (!notificationPermissionRequested.current) {
      requestNotificationPermission();
      notificationPermissionRequested.current = true;
    }
  }, []);

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchHealth();

    // Set up interval for polling
    const intervalId = setInterval(fetchHealth, pollInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchHealth, pollInterval]);

  return {
    ...state,
    refresh,
  };
}
