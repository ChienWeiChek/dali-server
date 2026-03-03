# Dashboard Implementation Example

## Main Dashboard Page Structure

**File**: [`apps/dashboard/src/pages/Dashboard.tsx`](apps/dashboard/src/pages/Dashboard.tsx)

```typescript
import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Lightbulb as LightbulbIcon,
  Bolt as BoltIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Components
import StatCard from '../components/StatCard';
import DeviceSelector from '../components/DeviceSelector';
import TimeRangeSelector from '../components/TimeRangeSelector';
import DataTable from '../components/DataTable';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import RealTimeGauge from '../components/charts/RealTimeGauge';
import HistoryChart from '../components/charts/HistoryChart';

// Hooks
import { useDevices } from '../hooks/useDevices';

// Utils
import { groupByZone, calculateAverage } from '../utils/dataTransform';

// Types
import type { Device, DashboardMetrics, ChartData } from '../types/dashboard';

export default function Dashboard() {
  // State
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDevices: 0,
    avgLightLevel: 0,
    totalEnergy: 0,
    activeErrors: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    lightLevelTrend: [],
    energyByDevice: [],
    devicesByZone: [],
    powerTrend: []
  });
  const [realTimeData, setRealTimeData] = useState({
    power: 0,
    temperature: 0,
    voltage: 0
  });

  // Fetch devices
  const { devices, loading: devicesLoading, error: devicesError } = useDevices();

  // Filter devices based on selection
  const filteredDevices = useMemo(() => {
    let filtered = devices;

    if (selectedZones.length > 0) {
      filtered = filtered.filter(d =>
        d.zones?.some(z => selectedZones.includes(z))
      );
    }

    if (selectedDevices.length > 0) {
      filtered = filtered.filter(d => selectedDevices.includes(d.guid));
    }

    return filtered;
  }, [devices, selectedZones, selectedDevices]);

  // Calculate metrics
  useEffect(() => {
    const calculateMetrics = async () => {
      if (filteredDevices.length === 0) {
        setMetrics({
          totalDevices: 0,
          avgLightLevel: 0,
          totalEnergy: 0,
          activeErrors: 0
        });
        return;
      }

      // Fetch property values for filtered devices
      // This is a simplified example - in production, you'd batch these requests
      const lightLevels: number[] = [];
      const energyValues: number[] = [];
      let errorCount = 0;

      for (const device of filteredDevices.slice(0, 10)) { // Limit for demo
        try {
          // Fetch light level
          const lightRes = await fetch(
            `/api/bmsapi/dali-devices/${device.guid}/property/lightLevel/active`
          );
          if (lightRes.ok) {
            const lightData = await lightRes.json();
            lightLevels.push(lightData.value || 0);
          }

          // Fetch energy consumption
          const energyRes = await fetch(
            `/api/bmsapi/dali-devices/${device.guid}/property/driverEnergyConsumption/active`
          );
          if (energyRes.ok) {
            const energyData = await energyRes.json();
            energyValues.push(energyData.value || 0);
          }

          // Check for errors
          const errorRes = await fetch(
            `/api/bmsapi/dali-devices/${device.guid}/property/errorOverall/active`
          );
          if (errorRes.ok) {
            const errorData = await errorRes.json();
            if (errorData.value > 0) errorCount++;
          }
        } catch (err) {
          console.error(`Error fetching data for device ${device.guid}:`, err);
        }
      }

      setMetrics({
        totalDevices: filteredDevices.length,
        avgLightLevel: calculateAverage(lightLevels),
        totalEnergy: energyValues.reduce((sum, val) => sum + val, 0),
        activeErrors: errorCount
      });

      // Update chart data
      setChartData({
        lightLevelTrend: [], // Populated from historical data
        energyByDevice: filteredDevices.slice(0, 10).map((device, i) => ({
          name: device.title,
          value: energyValues[i] || 0
        })),
        devicesByZone: groupByZone(filteredDevices),
        powerTrend: [] // Populated from historical data
      });
    };

    calculateMetrics();
  }, [filteredDevices]);

  // Real-time data polling
  useEffect(() => {
    if (filteredDevices.length === 0) return;

    const pollRealTimeData = async () => {
      const firstDevice = filteredDevices[0];
      
      try {
        const [powerRes, tempRes, voltageRes] = await Promise.all([
          fetch(`/api/bmsapi/dali-devices/${firstDevice.guid}/property/driverInputPower/active`),
          fetch(`/api/bmsapi/dali-devices/${firstDevice.guid}/property/driverTemperature/active`),
          fetch(`/api/bmsapi/dali-devices/${firstDevice.guid}/property/driverInputVoltage/active`)
        ]);

        const [powerData, tempData, voltageData] = await Promise.all([
          powerRes.ok ? powerRes.json() : null,
          tempRes.ok ? tempRes.json() : null,
          voltageRes.ok ? voltageRes.json() : null
        ]);

        setRealTimeData({
          power: powerData?.value || 0,
          temperature: tempData?.value || 0,
          voltage: voltageData?.value || 0
        });
      } catch (err) {
        console.error('Error polling real-time data:', err);
      }
    };

    pollRealTimeData();
    const interval = setInterval(pollRealTimeData, 5000);

    return () => clearInterval(interval);
  }, [filteredDevices]);

  // Loading state
  if (devicesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (devicesError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{devicesError}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and analyze your DALI devices
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <DeviceSelector
            devices={devices}
            selectedDevices={selectedDevices}
            selectedZones={selectedZones}
            onDeviceChange={setSelectedDevices}
            onZoneChange={setSelectedZones}
          />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Devices"
            value={metrics.totalDevices}
            icon={<DevicesIcon fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Light Level"
            value={metrics.avgLightLevel.toFixed(1)}
            unit="%"
            icon={<LightbulbIcon fontSize="large" />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Energy"
            value={metrics.totalEnergy.toFixed(2)}
            unit="Wh"
            icon={<BoltIcon fontSize="large" />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Errors"
            value={metrics.activeErrors}
            icon={<ErrorIcon fontSize="large" />}
            color={metrics.activeErrors > 0 ? "#d32f2f" : "#2e7d32"}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 - Full Width Line Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <HistoryChart
              data={chartData.lightLevelTrend}
              title="Light Level Trends (24h)"
              color="#5470C6"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 - Bar and Pie */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <BarChart
              data={chartData.energyByDevice}
              title="Energy Consumption by Device"
              color="#91cc75"
              height="350px"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <PieChart
              data={chartData.devicesByZone}
              title="Devices by Zone"
              showLegend={true}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 3 - Area Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <AreaChart
              data={chartData.powerTrend}
              title="Power Consumption Trend"
              color="#ee6666"
              gradient={true}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 4 - Gauge Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <RealTimeGauge
              value={realTimeData.power}
              min={0}
              max={200}
              unit="W"
              title="Driver Input Power"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <RealTimeGauge
              value={realTimeData.temperature}
              min={0}
              max={100}
              unit="°C"
              title="Driver Temperature"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <RealTimeGauge
              value={realTimeData.voltage}
              min={0}
              max={300}
              unit="V"
              title="Input Voltage"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Properties
            </Typography>
            <DataTable
              columns={[
                { field: 'title', headerName: 'Device Name', width: 200 },
                { field: 'zone', headerName: 'Zone', width: 150 },
                {
                  field: 'lightLevel',
                  headerName: 'Light Level',
                  align: 'right',
                  format: (v) => v ? `${v}%` : 'N/A'
                },
                {
                  field: 'power',
                  headerName: 'Power (W)',
                  align: 'right',
                  format: (v) => v ? v.toFixed(2) : 'N/A'
                },
                {
                  field: 'energy',
                  headerName: 'Energy (Wh)',
                  align: 'right',
                  format: (v) => v ? v.toFixed(2) : 'N/A'
                },
                {
                  field: 'temperature',
                  headerName: 'Temp (°C)',
                  align: 'right',
                  format: (v) => v ? v.toFixed(1) : 'N/A'
                },
                {
                  field: 'status',
                  headerName: 'Status',
                  align: 'center',
                  format: (v) => v ? 'Error' : 'OK'
                }
              ]}
              rows={filteredDevices.map(device => ({
                guid: device.guid,
                title: device.title,
                zone: device.zones?.join(', ') || 'Unassigned',
                lightLevel: null, // Populated from API
                power: null,
                energy: null,
                temperature: null,
                status: device.error || false
              }))}
              onRowClick={(row) => {
                window.location.href = `/devices/${row.guid}`;
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
```

---

## App.tsx Route Configuration

Add the Dashboard route to [`apps/dashboard/src/App.tsx`](apps/dashboard/src/App.tsx):

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Devices from "./pages/DevicesList";
import Dashboard from "./pages/Dashboard"; // Add this import
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import ClientLayout from "./components/ClientLayout";

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<ClientLayout />}>
            {/* Add Dashboard route */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/devices" element={<Devices />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
```

---

## Sample Mock Data for Testing

**File**: [`apps/dashboard/src/mocks/dashboardData.ts`](apps/dashboard/src/mocks/dashboardData.ts)

```typescript
export const mockDevices = [
  {
    guid: "e516322a-d7c1-4d2a-b0a4-5c9e9457cf1c",
    title: "EVG A63",
    type: "gear",
    shortAddress: 63,
    zones: ["Zone 1"],
    properties: ["lightLevel", "driverInputPower", "driverTemperature"]
  },
  {
    guid: "72164943-5a77-4429-8ead-68dde5ba5430",
    title: "Ballast A00",
    type: "gear",
    shortAddress: 0,
    zones: ["Zone 1"],
    properties: ["lightLevel", "gearStatus", "lampFailure"]
  },
  {
    guid: "6174ae79-b300-4bae-b23e-799d71e22fc4",
    title: "Ballast A09",
    type: "gear",
    shortAddress: 9,
    zones: ["Zone 1", "Zone 2"],
    properties: ["lightLevel", "gearStatus", "lampFailure"]
  }
];

export const mockLightLevelTrend = [
  { time: "00:00", value: 45 },
  { time: "03:00", value: 38 },
  { time: "06:00", value: 78 },
  { time: "09:00", value: 85 },
  { time: "12:00", value: 92 },
  { time: "15:00", value: 88 },
  { time: "18:00", value: 65 },
  { time: "21:00", value: 52 }
];

export const mockEnergyByDevice = [
  { name: "EVG A63", value: 120.5 },
  { name: "Ballast A00", value: 95.3 },
  { name: "Ballast A09", value: 150.8 },
  { name: "Device A12", value: 88.2 },
  { name: "Device A15", value: 110.6 }
];

export const mockDevicesByZone = [
  { name: "Zone 1", value: 15 },
  { name: "Zone 2", value: 8 },
  { name: "Unassigned", value: 3 }
];

export const mockPowerTrend = [
  { time: "00:00", value: 45.2 },
  { time: "04:00", value: 38.5 },
  { time: "08:00", value: 78.3 },
  { time: "12:00", value: 92.1 },
  { time: "16:00", value: 85.7 },
  { time: "20:00", value: 62.4 }
];
```

---

## Environment Variables

If needed, add API configuration to `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_POLL_INTERVAL=5000
VITE_DEFAULT_TIME_RANGE=24h
```

---

## Testing Checklist

### Unit Tests
- [ ] Test StatCard component with different props
- [ ] Test chart components render correctly
- [ ] Test DeviceSelector filtering logic
- [ ] Test data transformation utilities
- [ ] Test custom hooks with mock data

### Integration Tests
- [ ] Test Dashboard page renders all components
- [ ] Test filter interactions update charts
- [ ] Test time range selector updates data
- [ ] Test real-time polling updates gauges
- [ ] Test table row click navigation

### E2E Tests
- [ ] Test complete user flow: select zone → view charts → click device
- [ ] Test dashboard with no devices selected
- [ ] Test dashboard with API errors
- [ ] Test responsive layout on different screen sizes

---

## Performance Considerations

1. **Debounce Filter Changes**
   ```typescript
   import { debounce } from 'lodash';
   
   const debouncedZoneChange = useMemo(
     () => debounce((zones: string[]) => {
       setSelectedZones(zones);
     }, 300),
     []
   );
   ```

2. **Memoize Expensive Calculations**
   ```typescript
   const chartData = useMemo(() => {
     return transformHistoricalData(rawData, timeRange);
   }, [rawData, timeRange]);
   ```

3. **Virtualize Large Tables**
   - Use `react-window` or MUI DataGrid for large datasets

4. **Lazy Load Charts**
   ```typescript
   const BarChart = lazy(() => import('../components/charts/BarChart'));
   ```

---

## Accessibility Features

1. **ARIA Labels**
   ```typescript
   <StatCard
     title="Total Devices"
     value={26}
     aria-label="Total devices count: 26"
   />
   ```

2. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Tab order follows logical flow

3. **Screen Reader Support**
   - Chart descriptions via `aria-describedby`
   - Table headers properly associated

4. **Color Contrast**
   - Ensure all text meets WCAG AA standards
   - Use Material-UI theme for consistent colors

---

## Next Steps

After reviewing this plan:

1. **Switch to Code Mode** to implement the components
2. **Create components in order**: Charts → UI Components → Hooks → Dashboard Page
3. **Test incrementally** as each component is built
4. **Integrate with real API** and adjust based on actual data structure
5. **Refine styling** and add polish
6. **Add error boundaries** for production readiness
