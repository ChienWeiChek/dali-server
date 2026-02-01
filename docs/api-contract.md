# API Contract

## REST Endpoints

### GET /api/devices
Returns list of all devices with current status.
Response:
```json
[
  {
    "guid": "string",
    "title": "string",
    "zone": "string",
    "properties": {
      "lightLevel": 100,
      "errorOverall": 0
    }
  }
]
```

### GET /api/devices/:guid/history
Returns historical data for a property.
Query Params:
- `property`: string (required)
- `range`: string (default "24h", e.g. "1h", "7d")

Response: InfluxDB result format.

## WebSocket

### URL: /ws/devices
Streams real-time updates.

Message Format:
```json
{
  "type": "update",
  "data": {
    "guid": "string",
    "property": "string",
    "value": number|string,
    "timestamp": "ISO-8601"
  }
}
```
