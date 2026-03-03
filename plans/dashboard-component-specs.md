# Dashboard Component Specifications

## Chart Components

### 1. BarChart Component

**File**: [`apps/dashboard/src/components/charts/BarChart.tsx`](apps/dashboard/src/components/charts/BarChart.tsx)

**Purpose**: Display comparative data across categories using vertical or horizontal bars.

**Props Interface**:
```typescript
interface BarChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
  horizontal?: boolean;
  height?: string;
  showValues?: boolean;
}
```

**ECharts Configuration**:
```typescript
{
  title: { text: title, left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: { 
    type: horizontal ? 'value' : 'category',
    data: horizontal ? undefined : data.map(d => d.name)
  },
  yAxis: { 
    type: horizontal ? 'category' : 'value',
    data: horizontal ? data.map(d => d.name) : undefined
  },
  series: [{
    type: 'bar',
    data: data.map(d => d.value),
    itemStyle: { color: color || '#5470C6' },
    label: { show: showValues, position: 'top' }
  }]
}
```

**Usage Example**:
```typescript
<BarChart
  data={[
    { name: 'Device 1', value: 120 },
    { name: 'Device 2', value: 95 },
    { name: 'Device 3', value: 150 }
  ]}
  title="Energy Consumption by Device"
  color="#91cc75"
  height="350px"
/>
```

---

### 2. PieChart Component

**File**: [`apps/dashboard/src/components/charts/PieChart.tsx`](apps/dashboard/src/components/charts/PieChart.tsx)

**Purpose**: Show distribution and proportions of data.

**Props Interface**:
```typescript
interface PieChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
  height?: string;
  showLegend?: boolean;
  radius?: [string, string];
}
```

**ECharts Configuration**:
```typescript
{
  title: { text: title, left: 'center' },
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { 
    show: showLegend,
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    type: 'pie',
    radius: radius || ['40%', '70%'],
    data: data,
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    label: { formatter: '{b}: {d}%' }
  }]
}
```

**Usage Example**:
```typescript
<PieChart
  data={[
    { name: 'Zone 1', value: 15 },
    { name: 'Zone 2', value: 8 },
    { name: 'Unassigned', value: 3 }
  ]}
  title="Devices by Zone"
  showLegend={true}
/>
```

---

### 3. AreaChart Component

**File**: [`apps/dashboard/src/components/charts/AreaChart.tsx`](apps/dashboard/src/components/charts/AreaChart.tsx)

**Purpose**: Display trends over time with filled area under the line.

**Props Interface**:
```typescript
interface AreaChartProps {
  data: { time: string; value: number }[];
  title: string;
  color?: string;
  gradient?: boolean;
  height?: string;
  smooth?: boolean;
}
```

**ECharts Configuration**:
```typescript
{
  title: { text: title, left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.map(d => d.time)
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    data: data.map(d => d.value),
    smooth: smooth ?? true,
    itemStyle: { color: color || '#5470C6' },
    areaStyle: gradient ? {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: color || '#5470C6' },
          { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
        ]
      }
    } : { color: color || '#5470C6' }
  }]
}
```

**Usage Example**:
```typescript
<AreaChart
  data={[
    { time: '00:00', value: 45 },
    { time: '06:00', value: 78 },
    { time: '12:00', value: 92 },
    { time: '18:00', value: 65 }
  ]}
  title="Power Consumption (24h)"
  color="#ee6666"
  gradient={true}
/>
```

---

## UI Components

### 4. StatCard Component

**File**: [`apps/dashboard/src/components/StatCard.tsx`](apps/dashboard/src/components/StatCard.tsx)

**Purpose**: Display single KPI metric with optional trend indicator.

**Props Interface**:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: string;
  loading?: boolean;
}
```

**Component Structure**:
```typescript
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCard({ title, value, unit, icon, trend, color, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', bgcolor: color ? `${color}10` : 'background.paper' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" component="div" sx={{ color: color }}>
                {value} {unit && <Typography variant="caption">{unit}</Typography>}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend.direction === 'up' ? (
                  <TrendingUp fontSize="small" color="success" />
                ) : (
                  <TrendingDown fontSize="small" color="error" />
                )}
                <Typography variant="caption" ml={0.5}>
                  {trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box sx={{ color: color || 'primary.main', opacity: 0.7 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
```

**Usage Example**:
```typescript
<StatCard
  title="Total Devices"
  value={26}
  icon={<DevicesIcon fontSize="large" />}
  color="#1976d2"
/>

<StatCard
  title="Average Light Level"
  value={78}
  unit="%"
  icon={<LightbulbIcon fontSize="large" />}
  trend={{ value: 5.2, direction: 'up' }}
  color="#2e7d32"
/>
```

---

### 5. DeviceSelector Component

**File**: [`apps/dashboard/src/components/DeviceSelector.tsx`](apps/dashboard/src/components/DeviceSelector.tsx)

**Purpose**: Multi-select dropdowns for filtering by zones and devices.

**Props Interface**:
```typescript
interface Device {
  guid: string;
  title: string;
  zones?: string[];
}

interface DeviceSelectorProps {
  devices: Device[];
  selectedDevices: string[];
  selectedZones: string[];
  onDeviceChange: (deviceIds: string[]) => void;
  onZoneChange: (zones: string[]) => void;
}
```

**Component Structure**:
```typescript
import { Autocomplete, TextField, Box, Chip } from '@mui/material';

export default function DeviceSelector({
  devices,
  selectedDevices,
  selectedZones,
  onDeviceChange,
  onZoneChange
}: DeviceSelectorProps) {
  // Extract unique zones
  const zones = Array.from(
    new Set(devices.flatMap(d => d.zones || []))
  ).sort();

  // Filter devices by selected zones
  const filteredDevices = selectedZones.length > 0
    ? devices.filter(d => d.zones?.some(z => selectedZones.includes(z)))
    : devices;

  return (
    <Box display="flex" gap={2} flexWrap="wrap">
      <Autocomplete
        multiple
        options={zones}
        value={selectedZones}
        onChange={(_, newValue) => onZoneChange(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Filter by Zone" placeholder="Select zones" />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} {...getTagProps({ index })} />
          ))
        }
        sx={{ minWidth: 250 }}
      />

      <Autocomplete
        multiple
        options={filteredDevices}
        getOptionLabel={(option) => option.title}
        value={filteredDevices.filter(d => selectedDevices.includes(d.guid))}
        onChange={(_, newValue) => onDeviceChange(newValue.map(d => d.guid))}
        renderInput={(params) => (
          <TextField {...params} label="Select Devices" placeholder="Select devices" />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option.title} {...getTagProps({ index })} />
          ))
        }
        sx={{ minWidth: 300 }}
      />
    </Box>
  );
}
```

---

### 6. TimeRangeSelector Component

**File**: [`apps/dashboard/src/components/TimeRangeSelector.tsx`](apps/dashboard/src/components/TimeRangeSelector.tsx)

**Purpose**: Select time range for historical data.

**Props Interface**:
```typescript
interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  options?: { label: string; value: string }[];
}
```

**Component Structure**:
```typescript
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const DEFAULT_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

export default function TimeRangeSelector({ value, onChange, options = DEFAULT_OPTIONS }: TimeRangeSelectorProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue) => newValue && onChange(newValue)}
      size="small"
    >
      {options.map(option => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
```

---

### 7. DataTable Component

**File**: [`apps/dashboard/src/components/DataTable.tsx`](apps/dashboard/src/components/DataTable.tsx)

**Purpose**: Display device properties in tabular format.

**Props Interface**:
```typescript
interface Column {
  field: string;
  headerName: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: any) => void;
}
```

**Component Structure**:
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Box
} from '@mui/material';
import { useState } from 'react';

export default function DataTable({ columns, rows, loading, pageSize = 10, onRowClick }: DataTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map(column => (
                    <TableCell key={column.field} align={column.align || 'left'}>
                      {column.format ? column.format(row[column.field]) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
```

**Usage Example**:
```typescript
<DataTable
  columns={[
    { field: 'title', headerName: 'Device Name', width: 200 },
    { field: 'zone', headerName: 'Zone', width: 150 },
    { field: 'lightLevel', headerName: 'Light Level', align: 'right', format: (v) => `${v}%` },
    { field: 'power', headerName: 'Power (W)', align: 'right' },
    { field: 'status', headerName: 'Status', align: 'center' }
  ]}
  rows={deviceData}
  loading={loading}
  onRowClick={(row) => navigate(`/devices/${row.guid}`)}
/>
```

---

## Custom Hooks

### useDevices Hook

**File**: [`apps/dashboard/src/hooks/useDevices.ts`](apps/dashboard/src/hooks/useDevices.ts)

```typescript
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

interface Device {
  guid: string;
  title: string;
  type: string;
  zones?: string[];
  properties?: string[];
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await apiFetch('/api/bmsapi/dali-devices');
        if (!res.ok) throw new Error('Failed to fetch devices');
        const data = await res.json();
        setDevices(data.deviceList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, loading, error };
}
```

### useDeviceProperty Hook

**File**: [`apps/dashboard/src/hooks/useDeviceProperty.ts`](apps/dashboard/src/hooks/useDeviceProperty.ts)

```typescript
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

interface PropertyValue {
  guid: string;
  property: string;
  value: number;
  unit?: string;
  date: string;
  time: string;
}

export function useDeviceProperty(guid: string, property: string, pollInterval = 5000) {
  const [data, setData] = useState<PropertyValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await apiFetch(
          `/api/bmsapi/dali-devices/${guid}/property/${property}/active`
        );
        if (!res.ok) throw new Error('Failed to fetch property');
        const data = await res.json();
        setData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
    const interval = setInterval(fetchProperty, pollInterval);

    return () => clearInterval(interval);
  }, [guid, property, pollInterval]);

  return { data, loading, error };
}
```

### useHistoricalData Hook

**File**: [`apps/dashboard/src/hooks/useHistoricalData.ts`](apps/dashboard/src/hooks/useHistoricalData.ts)

```typescript
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

interface HistoricalDataPoint {
  _time: string;
  value_num?: number;
  value_str?: string;
  unit?: string;
}

export function useHistoricalData(guid: string, property: string, range: string) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(
          `/api/devices/${guid}/history?property=${property}&range=${range}`
        );
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        setData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (guid && property) {
      fetchHistory();
    }
  }, [guid, property, range]);

  return { data, loading, error };
}
```

---

## Data Transformation Utilities

**File**: [`apps/dashboard/src/utils/dataTransform.ts`](apps/dashboard/src/utils/dataTransform.ts)

```typescript
// Format timestamp for charts
export function formatTime(timestamp: string, range: string): string {
  const date = new Date(timestamp);
  
  if (range === '1h' || range === '6h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (range === '24h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Calculate average from array of numbers
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Group devices by zone
export function groupByZone(devices: any[]): { name: string; value: number }[] {
  const grouped = devices.reduce((acc, device) => {
    const zone = device.zones?.length ? device.zones[0] : 'Unassigned';
    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

// Transform historical data for charts
export function transformHistoricalData(
  data: any[],
  range: string
): { time: string; value: number }[] {
  return data.map(point => ({
    time: formatTime(point._time, range),
    value: point.value_num || 0
  }));
}
```

---

## Type Definitions

**File**: [`apps/dashboard/src/types/dashboard.ts`](apps/dashboard/src/types/dashboard.ts)

```typescript
export interface Device {
  guid: string;
  title: string;
  type: string;
  shortAddress: number;
  zones?: string[];
  properties?: string[];
  error?: boolean;
}

export interface DashboardMetrics {
  totalDevices: number;
  avgLightLevel: number;
  totalEnergy: number;
  activeErrors: number;
}

export interface ChartData {
  lightLevelTrend: { time: string; value: number }[];
  energyByDevice: { name: string; value: number }[];
  devicesByZone: { name: string; value: number }[];
  powerTrend: { time: string; value: number }[];
}

export interface RealTimeMetrics {
  power: number;
  temperature: number;
  voltage: number;
}

export interface PropertyValue {
  guid: string;
  property: string;
  value: number;
  unit?: string;
  date: string;
  time: string;
}
```
