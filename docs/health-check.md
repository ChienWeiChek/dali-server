# Health Check API Documentation

## Overview

The health check API endpoint provides comprehensive monitoring of all critical services in the DALI server system. It performs synchronous health checks with timeout protection to ensure reliable status reporting.

## Endpoint

```
GET /api/health
```

## Features

- **Synchronous Checks**: All health checks are performed synchronously before returning a response
- **Timeout Protection**: Each service check has a 5-second timeout to prevent hanging
- **Comprehensive Status**: Checks MQTT, InfluxDB, and all configured DALI controllers
- **HTTP Status Codes**: Returns 200 for healthy, 503 for unhealthy
- **Fail-Fast**: Overall status is "unhealthy" if ANY service fails

## Response Format

### Successful Response (All Services Healthy)

**HTTP Status**: `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T14:39:00.000Z",
  "services": {
    "mqtt": {
      "status": "healthy",
      "message": "Connected to MQTT broker"
    },
    "influxdb": {
      "status": "healthy",
      "message": "InfluxDB connection successful"
    },
    "controllers": [
      {
        "name": "Controller1",
        "status": "healthy",
        "message": "Connected to controller Controller1"
      },
      {
        "name": "Controller2",
        "status": "healthy",
        "message": "Connected to controller Controller2"
      }
    ]
  }
}
```

### Degraded Response (Some Services Unhealthy)

**HTTP Status**: `503 Service Unavailable`

```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-27T14:39:00.000Z",
  "services": {
    "mqtt": {
      "status": "healthy",
      "message": "Connected to MQTT broker"
    },
    "influxdb": {
      "status": "unhealthy",
      "message": "InfluxDB connection failed: Connection timeout"
    },
    "controllers": [
      {
        "name": "Controller1",
        "status": "healthy",
        "message": "Connected to controller Controller1"
      },
      {
        "name": "Controller2",
        "status": "unhealthy",
        "message": "Controller Controller2 unreachable: ECONNREFUSED"
      }
    ]
  }
}
```

## Health Check Details

### MQTT Service
- **Check Method**: Verifies MQTT client connection status
- **Healthy**: Client is connected to the broker
- **Unhealthy**: Client is not initialized or disconnected

### InfluxDB Service
- **Check Method**: Performs a flush operation to verify write API connectivity
- **Healthy**: Successfully communicates with InfluxDB
- **Unhealthy**: Connection failed or timeout

### Controller Services
- **Check Method**: Attempts to fetch device list from each controller
- **Healthy**: Successfully authenticated and retrieved data
- **Unhealthy**: Authentication failed, connection refused, or timeout

## Usage Examples

### cURL

```bash
# Basic health check
curl http://localhost:3000/api/health

# With formatted output
curl -s http://localhost:3000/api/health | jq '.'

# Check HTTP status code
curl -w "\nHTTP Status: %{http_code}\n" http://localhost:3000/api/health
```

### JavaScript/TypeScript

```typescript
async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('All services healthy:', data);
    } else if (response.status === 503) {
      console.warn('Some services unhealthy:', data);
    }
    
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
  }
}
```

### Monitoring Integration

```bash
# Use in monitoring scripts
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$response" = "200" ]; then
    echo "System healthy"
    exit 0
else
    echo "System unhealthy - Status: $response"
    exit 1
fi
```

## Testing

A test script is provided at the root of the project:

```bash
# Run the test script
./test-health-check.sh
```

This script will:
1. Call the health check endpoint
2. Display the HTTP status code
3. Pretty-print the JSON response
4. Indicate overall health status

## Implementation Details

### Timeout Configuration

Each service health check has a 5-second timeout. This prevents the health check endpoint from hanging if a service is unresponsive.

### Service Check Methods

- **MqttSubscriber.checkHealth()**: Checks MQTT client connection state
- **InfluxWriter.checkHealth()**: Performs InfluxDB flush operation
- **DaliClient.checkHealth()**: Attempts to fetch device list from controller

### Error Handling

All health checks are wrapped in try-catch blocks with timeout protection. If a check fails or times out, it returns an unhealthy status with an error message.

## Best Practices

1. **Regular Monitoring**: Poll this endpoint regularly (e.g., every 30-60 seconds)
2. **Alerting**: Set up alerts when status changes to "unhealthy"
3. **Load Balancers**: Configure load balancers to use this endpoint for health checks
4. **Kubernetes**: Use as a readiness/liveness probe
5. **CI/CD**: Include in deployment verification scripts

## Kubernetes Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dali-server
spec:
  containers:
  - name: api
    image: dali-server:latest
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 5
```

## Troubleshooting

### Common Issues

1. **MQTT Unhealthy**
   - Check MQTT broker is running
   - Verify credentials in `.env` file
   - Check network connectivity to broker

2. **InfluxDB Unhealthy**
   - Verify InfluxDB is running
   - Check token and credentials
   - Verify bucket and organization exist

3. **Controller Unhealthy**
   - Check controller IP address is reachable
   - Verify controller credentials
   - Check controller API is responding

### Debug Mode

To see detailed logs, check the server console output when the health check runs. Each service logs its health check attempts.
