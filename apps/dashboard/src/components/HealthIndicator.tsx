import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthCheck } from '../hooks/useHealthCheck';
import type { OverallHealthStatus } from '../types/health';

interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  icon: string;
}

const STATUS_CONFIG: Record<OverallHealthStatus | 'loading' | 'error', StatusConfig> = {
  healthy: {
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    label: 'Healthy',
    icon: '✓',
  },
  degraded: {
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    label: 'Degraded',
    icon: '⚠',
  },
  critical: {
    color: '#ef4444',
    bgColor: 'bg-red-500',
    label: 'Critical',
    icon: '✗',
  },
  loading: {
    color: '#9ca3af',
    bgColor: 'bg-gray-400',
    label: 'Checking...',
    icon: '⟳',
  },
  error: {
    color: '#9ca3af',
    bgColor: 'bg-gray-400',
    label: 'Error',
    icon: '⚠',
  },
};

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never';

  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function HealthIndicator() {
  const navigate = useNavigate();
  const { status, data, loading, error, lastChecked } = useHealthCheck();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const currentStatus = error ? 'error' : loading && !data ? 'loading' : status;
  const config = STATUS_CONFIG[currentStatus];

  const handleClick = () => {
    navigate('/health');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      {/* Status Light */}
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`System health: ${config.label}`}
        role="status"
        aria-live="polite"
        tabIndex={0}
      >
        <div
          className={`w-3 h-3 rounded-full ${config.bgColor} ${
            currentStatus === 'degraded' || currentStatus === 'critical'
              ? 'animate-pulse'
              : ''
          }`}
          style={{
            boxShadow: `0 0 8px ${config.color}`,
          }}
        />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {config.label}
        </span>
      </button>

      {/* Tooltip */}
      {isTooltipVisible && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div
                className={`w-3 h-3 rounded-full ${config.bgColor}`}
                style={{ boxShadow: `0 0 8px ${config.color}` }}
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  System Status: {config.label}
                </div>
                <div className="text-xs text-gray-500">
                  Last checked: {formatTimeAgo(lastChecked)}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-sm text-red-600">
                <div className="font-medium">Unable to check health</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            )}

            {/* Loading State */}
            {loading && !data && (
              <div className="text-sm text-gray-600">
                Checking system health...
              </div>
            )}

            {/* Services Status */}
            {data && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase">
                  Services
                </div>

                {/* MQTT */}
                <div className="flex items-start gap-2 text-sm">
                  <span
                    className={
                      data.services.mqtt.status === 'healthy'
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }
                  >
                    {data.services.mqtt.status === 'healthy' ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">MQTT</div>
                    <div className="text-xs text-gray-600">
                      {data.services.mqtt.message}
                    </div>
                  </div>
                </div>

                {/* InfluxDB */}
                <div className="flex items-start gap-2 text-sm">
                  <span
                    className={
                      data.services.influxdb.status === 'healthy'
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }
                  >
                    {data.services.influxdb.status === 'healthy' ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">InfluxDB</div>
                    <div className="text-xs text-gray-600">
                      {data.services.influxdb.message}
                    </div>
                  </div>
                </div>

                {/* Controllers */}
                {data.services.controllers.length > 0 && (
                  <>
                    <div className="text-xs font-semibold text-gray-700 uppercase pt-2">
                      Controllers
                    </div>
                    {data.services.controllers.map((controller) => (
                      <div
                        key={controller.name}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span
                          className={
                            controller.status === 'healthy'
                              ? 'text-emerald-500'
                              : 'text-red-500'
                          }
                        >
                          {controller.status === 'healthy' ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {controller.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {controller.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Click for detailed view
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
