# Dynamic Dashboard Implementation

## Overview

This document describes the implementation of a dynamic dashboard for the DALI IoT Pro system. The dashboard displays real-time and historical data from DALI devices using various chart types, KPI cards, and data tables.

## Architecture

### Backend (API)

The backend provides three new endpoints for dashboard metrics:

#### 1. Aggregate Metrics Endpoint
```
GET /api/devices/metrics/aggregate?range=24h
```

Returns aggregated metrics across all devices:
- `avgLightLevel`: Average light level across all devices
- `totalEnergy`: Total energy consumption (kWh)
- `errorCount`: Number of devices with errors
- `deviceCount`: Total number of devices

#### 2. Energy Summary Endpoint
```
GET /api/devices/energy-summary?range=24h&limit=10
```

Returns top devices by energy consumption:
- `deviceGuid`: Device identifier
- `deviceName`: Device title
- `totalEnergy`: Total energy consumed (kWh)

#### 3. Latest Properties Endpoint
```
GET /api/devices/:guid/properties/latest?properties=lightLevel&properties=driverTemperature
```

Returns the latest values for specified properties:
- `property`: Property name
- `value`: Latest value
- `timestamp`: ISO timestamp

### Frontend (Dashboard)

The dashboard is built with React, TypeScript, Material-UI, and ECharts.

## File Structure

```
apps/dashboard/src/
├── components/
│   ├── charts/
│   │   ├── AreaChart.tsx          # Area chart with gradient
│   │   ├── BarChart.tsx           # Vertical/horizontal bar chart
│   │   ├── HistoryChart.tsx       # Line chart for historical data
│   │   ├── PieChart.tsx           # Pie/donut chart
│   │   └── RealTimeGauge.tsx      # Gauge chart for real-time values
│   ├── DataTable.tsx              # Sortable, paginated table
│   ├── DeviceSelector.tsx         # Zone and device multi-select
│   ├── StatCard.tsx               # KPI card component
│   └── TimeRangeSelector.tsx      # Time range toggle buttons
├── hooks/
│   ├── useDevices.ts              # Fetch devices list
│   ├── useDeviceProperty.ts       # Fetch device properties
│   └── useHistoricalData.ts       # Fetch historical data
├── pages/
│   └── Dashboard.tsx              # Main dashboard page
├── types/
│   └── dashboard.ts               # TypeScript interfaces
└── utils/
    └── dataTransform.ts           # Data transformation utilities
```

## Components

### Chart Components

#### AreaChart
```tsx
<AreaChart
  data={[{ name: '12:00', value: 75 }, ...]}
  title="Light Level Trend"
  color="#1976d2"
  gradient={true}
  height={300}
  smooth={true}
/>
```

#### BarChart
```tsx
<BarChart
  data={[{ name: 'Device 1', value: 120 }, ...]}
  title="Energy Consumption"
  color="#2e7d32"
  horizontal={false}
  height={300}
  showValues={true}
/>
```

#### PieChart
```tsx
<PieChart
  data={[{ name: 'Active', value: 45 }, ...]}
  title="Device Status"
  colors={['#4caf50', '#f44336', '#ff9800']}
  height={300}
  showLegend={true}
  radius={['40%', '70%']}
/>
```

### UI Components

#### StatCard
```tsx
<StatCard
  title="Total Devices"
  value={125}
  unit="devices"
  icon={<DevicesIcon />}
  trend={{ value: 5, direction: 'up' }}
  color="primary"
/>
```

#### TimeRangeSelector
```tsx
<TimeRangeSelector
  value="24h"
  onChange={(range) => setTimeRange(range)}
/>
```

#### DeviceSelector
```tsx
<DeviceSelector
  devices={devices}
  selectedDevices={selectedDevices}
  selectedZones={selectedZones}
  onDeviceChange={setSelectedDevices}
  onZoneChange={setSelectedZones}
/>
```

#### DataTable
```tsx
<DataTable
  columns={[
    { field: 'name', headerName: 'Device Name', width: 200 },
    { field: 'energy', headerName: 'Energy (kWh)', align: 'right', format: (v) => v.toFixed(2) }
  ]}
  rows={data}
  loading={loading}
  pageSize={10}
  onRowClick={(row) => console.log(row)}
/>
```

## Custom Hooks

### useDevices
Fetches the list of all devices:
```tsx
const { devices, loading, error } = useDevices();
```

### useDeviceProperty
Fetches latest property values with optional auto-refresh:
```tsx
const { data, loading, error } = useDeviceProperty(
  deviceGuid,
  ['lightLevel', 'driverTemperature'],
  5000 // Refresh every 5 seconds
);
```

### useHistoricalData
Fetches historical data for a property:
```tsx
const { data, loading, error } = useHistoricalData(
  deviceGuid,
  'lightLevel',
  '24h'
);
```

## Data Transformation Utilities

### transformToChartData
Converts historical data to chart format:
```tsx
const chartData = transformToChartData(historicalData, 'Light Level');
```

### transformEnergyToBarChart
Converts energy summary to bar chart format:
```tsx
const barData = transformEnergyToBarChart(energySummary);
```

### formatTimestamp
Formats ISO timestamps:
```tsx
const formatted = formatTimestamp(timestamp, 'datetime');
```

### formatValue
Formats numbers with units:
```tsx
const formatted = formatValue(123.456, 'kWh', 2); // "123.46 kWh"
```

### getTimeRangeISO
Converts time range to ISO start/end:
```tsx
const { start, end } = getTimeRangeISO('24h');
```

## Available Properties

The following properties are collected from DALI devices:

1. `driverInputVoltage` - Input voltage (V)
2. `driverEnergyConsumption` - Energy consumption (kWh)
3. `driverInputPower` - Input power (W)
4. `driverOperationTime` - Operation time (hours)
5. `driverTemperature` - Driver temperature (°C)
6. `errorOverall` - Overall error status (0/1)
7. `lampOperationTime` - Lamp operation time (hours)
8. `lightLevel` - Light level (0-100%)
9. `errorBits` - Error bits (binary)
10. `errorBitsCoupler` - Coupler error bits (binary)

## Dashboard Features

### KPI Cards
- **Total Devices**: Count of all devices
- **Average Light Level**: Average across all devices
- **Total Energy**: Sum of energy consumption
- **Active Errors**: Count of devices with errors

### Charts
1. **Light Level Trend** (Line Chart): Historical light levels
2. **Energy Consumption** (Bar Chart): Top 10 devices by energy
3. **Device Status** (Pie Chart): Distribution of device states
4. **Temperature Trend** (Area Chart): Driver temperature over time
5. **Real-time Gauges**: Current values for selected properties

### Filters
- **Time Range**: 1H, 6H, 24H, 7D, 30D
- **Zone Filter**: Multi-select zones
- **Device Filter**: Multi-select devices (filtered by zone)

## Data Flow

1. **Initial Load**:
   - Fetch devices list
   - Fetch aggregate metrics
   - Fetch energy summary

2. **Real-time Updates**:
   - Poll aggregate metrics every 10 seconds
   - Poll real-time gauge data every 5 seconds

3. **User Interactions**:
   - Time range change → Refetch historical data
   - Device selection → Refetch device-specific data
   - Zone selection → Filter device list

## Running the Dashboard

### Start API Server
```bash
cd services/api
npm install
npm start
```

### Start Dashboard
```bash
cd apps/dashboard
npm install
npm run dev
```

### Access Dashboard
Open browser to: `http://localhost:5173`

## Configuration

### InfluxDB Connection
Configure in `services/api/src/config/loader.ts`:
```typescript
influx: {
  url: process.env.INFLUX_URL || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN,
  org: process.env.INFLUX_ORG || 'dali',
  bucket: process.env.INFLUX_BUCKET || 'dali_metrics'
}
```

### Polling Intervals
Adjust in `Dashboard.tsx`:
```typescript
const METRICS_POLL_INTERVAL = 10000; // 10 seconds
const REALTIME_POLL_INTERVAL = 5000;  // 5 seconds
```

## Troubleshooting

### No Data Displayed
1. Check InfluxDB is running and accessible
2. Verify MQTT subscriber is writing data
3. Check browser console for API errors
4. Verify device GUIDs exist in InfluxDB

### Charts Not Rendering
1. Check ECharts is installed: `npm install echarts echarts-for-react`
2. Verify data format matches chart component props
3. Check browser console for React errors

### API Errors
1. Check API server logs
2. Verify InfluxDB connection
3. Test endpoints with curl:
```bash
curl http://localhost:3000/api/devices/metrics/aggregate?range=24h
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Export dashboard data to CSV/PDF
- [ ] Custom dashboard layouts (drag-and-drop)
- [ ] Alert thresholds and notifications
- [ ] Historical data comparison
- [ ] Device grouping and tagging
- [ ] Custom time range picker
- [ ] Dark mode support
- [ ] Mobile responsive improvements
- [ ] Dashboard templates

## API Reference

See [`api.md`](../../api.md) for complete API documentation.

## License

Copyright © 2026 DALI IoT Pro
