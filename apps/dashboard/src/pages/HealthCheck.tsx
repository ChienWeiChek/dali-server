import { useHealthCheck } from '../hooks/useHealthCheck';
import type { OverallHealthStatus, ServiceHealth, ControllerHealth } from '../types/health';

interface StatusCardProps {
  title: string;
  status: 'healthy' | 'unhealthy';
  message: string;
  lastChecked?: string | null;
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never';

  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}

function StatusCard({ title, status, message, lastChecked }: StatusCardProps) {
  const isHealthy = status === 'healthy';

  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        isHealthy
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={`text-2xl ${
            isHealthy ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {isHealthy ? '✓' : '✗'}
        </span>
      </div>

      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
          isHealthy
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {isHealthy ? 'Healthy' : 'Unhealthy'}
      </div>

      <p className="text-gray-700 mb-2">{message}</p>

      {lastChecked && (
        <p className="text-xs text-gray-500">
          Last checked: {formatTimeAgo(lastChecked)}
        </p>
      )}
    </div>
  );
}

function OverallStatusCard({
  status,
  lastChecked,
  onRefresh,
  loading,
}: {
  status: OverallHealthStatus;
  lastChecked: string | null;
  onRefresh: () => void;
  loading: boolean;
}) {
  const statusConfig = {
    healthy: {
      color: 'emerald',
      icon: '✓',
      title: 'HEALTHY',
      message: 'All systems are operating normally.',
    },
    degraded: {
      color: 'amber',
      icon: '⚠',
      title: 'DEGRADED',
      message:
        'Some controllers are experiencing issues. Core services are operational but some devices may be unavailable.',
    },
    critical: {
      color: 'red',
      icon: '✗',
      title: 'CRITICAL',
      message:
        'Critical infrastructure services are down. System functionality is severely impacted.',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`rounded-lg border-2 p-8 bg-${config.color}-50 border-${config.color}-200 ${
        status === 'critical' ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-full bg-${config.color}-500 flex items-center justify-center text-white text-2xl`}
          style={{
            boxShadow: `0 0 20px var(--tw-${config.color}-500)`,
          }}
        >
          {config.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Overall Status: {config.title}
          </h2>
          <p className="text-sm text-gray-600">
            Last updated: {formatTimeAgo(lastChecked)}
          </p>
        </div>
      </div>

      <p className="text-gray-700 mb-6">{config.message}</p>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {loading ? 'Refreshing...' : 'Refresh Now'}
      </button>
    </div>
  );
}

export default function HealthCheck() {
  const { status, data, loading, error, lastChecked, refresh } = useHealthCheck();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            System Health Status
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor the health of all DALI IoT services and controllers
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border-2 border-red-200 p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl text-red-500">⚠</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Unable to Check System Health
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="mb-6 rounded-lg bg-gray-50 border-2 border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Checking system health...</p>
          </div>
        )}

        {/* Health Data */}
        {data && (
          <div className="space-y-8">
            {/* Overall Status */}
            <OverallStatusCard
              status={status}
              lastChecked={lastChecked}
              onRefresh={refresh}
              loading={loading}
            />

            {/* Critical Services */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Critical Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard
                  title="MQTT Broker"
                  status={data.services.mqtt.status}
                  message={data.services.mqtt.message}
                  lastChecked={lastChecked}
                />
                <StatusCard
                  title="InfluxDB"
                  status={data.services.influxdb.status}
                  message={data.services.influxdb.message}
                  lastChecked={lastChecked}
                />
              </div>
            </div>

            {/* Controllers */}
            {data.services.controllers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  DALI Controllers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.services.controllers.map((controller) => (
                    <StatusCard
                      key={controller.name}
                      title={controller.name}
                      status={controller.status}
                      message={controller.message}
                      lastChecked={lastChecked}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Auto-refresh Notice */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p>
                This page automatically refreshes every 30 seconds to provide
                real-time health status.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
