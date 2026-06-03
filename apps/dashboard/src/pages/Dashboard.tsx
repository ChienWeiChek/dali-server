import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Devices as DevicesIcon,
  Bolt as BoltIcon,
  Error as ErrorIcon,
  DeviceThermostat,
} from "@mui/icons-material";

// Components
import StatCard from "../components/StatCard";
import TimeRangeSelector from "../components/TimeRangeSelector";
import BarChart from "../components/charts/BarChart";
import AreaChart from "../components/charts/AreaChart";
import RealTimeGauge from "../components/charts/RealTimeGauge";
import HistoryChart from "../components/charts/HistoryChart";
import useSWR from "swr";
// API
import { apiFetch } from "../lib/apiClient";

// Types
import type { DashboardMetrics, ChartData, Device } from "../types/dashboard";
import { useDevices } from "../hooks/useDevices";

const DeviceCard = () => {
  const { devices, liveDevices, loading } = useDevices();
  const liveCount = Object.values(
    liveDevices as Record<string, Device[]>,
  ).reduce((sum: number, deviceList: Device[]) => sum + deviceList.length, 0);
  return (
    <StatCard
      title="Live/Total Devices"
      loading={loading}
      value={`${liveCount}/${devices.length}`}
      icon={<DevicesIcon fontSize="large" />}
      color="#1976d2"
    />
  );
};

const EnergySummaryCard = () => {
  const { data, error, isLoading } = useSWR(
    `/api/devices/energy-summary`,
    async () => {
      const res = await apiFetch(`/api/devices/energy-summary`);
      console.log("🚀 ~ EnergySummaryCard ~ res.ok:", res.ok);
      return res.ok
        ? res.json()
        : Promise.reject(new Error("Failed to fetch energy summary"));
    },
  );
  return (
    <StatCard
      title="Total Energy"
      loading={isLoading}
      value={(data?.total / 1000).toFixed(2)}
      unit={"kWh"}
      icon={<BoltIcon fontSize="large" />}
      color="#ed6c02"
    />
  );
};

const DriverTemperatureCard = () => {
  const { data, error, isLoading } = useSWR(
    `/api/devices/driver-temperature`,
    async () => {
      const res = await apiFetch(`/api/devices/driver-temperature`);
      return res.ok
        ? res.json()
        : Promise.reject(new Error("Failed to fetch energy summary"));
    },
  );
  return (
    <StatCard
      title="Driver Avg Temperature"
      loading={isLoading}
      value={data?.avg}
      unit={data?.unit || "°C"}
      icon={<DeviceThermostat fontSize="large" />}
      color="#2e7d32"
    />
  );
};

const ErrorDeviceCard = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useSWR(`/api/devices/error`, async () => {
    const res = await apiFetch(`/api/devices/error`);
    return res.ok
      ? res.json()
      : Promise.reject(new Error("Failed to fetch device errors"));
  });
  const errorDeviceCount: number = data
    ? Object.values(data as Record<string, Device[]>).reduce(
        (total, devices) => total + devices.length,
        0,
      )
    : 0;
  return (
    <StatCard
      title="Devices with Errors"
      loading={isLoading}
      value={errorDeviceCount}
      unit={""}
      icon={<ErrorIcon fontSize="large" />}
      color={errorDeviceCount > 0 ? "#d32f2f" : "#2e7d32"}
      onClick={() => navigate("/errors")}
    />
  );
};
const RealTimeGauges = () => {
  const [realTimeData, setRealTimeData] = useState({
    power: 0,
    temperature: 0,
    voltage: 0,
  });

  const fetchRealTimeData = async () => {
    try {
      const res = await apiFetch(
        `/api/devices/real-time-data?type[]=driverInputPower&type[]=driverTemperature&type[]=driverInputVoltage`,
      );
      if (!res.ok) return;
      const data = await res.json();

      setRealTimeData({
        power: data.avg?.driverInputPower?.value || 0,
        temperature: data.avg?.driverTemperature?.value || 0,
        voltage: data.avg?.driverInputVoltage?.value || 0,
      });
    } catch (err: any) {
      console.error("Error fetching real-time data:", err);
    }
  };

  // Fetch real-time data for gauges
  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  /* Charts Row 4 - Gauge Charts */
  return (
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
  );
};

export default function Dashboard() {
  // State
  const [timeRange, setTimeRange] = useState("24h");

  const [chartData, setChartData] = useState<ChartData>({
    lightLevelTrend: [],
    energyByDevice: [],
    devicesByZone: [],
    powerTrend: [],
    voltageTrend: [],
    energyTrend: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data for trend charts — all three in parallel, single state update
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const isHourRange = timeRange.endsWith("h");
        const toPoints = (raw: any[]) =>
          raw.map((d: any) => {
            const date = new Date(d.time);
            return {
              time: date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              label: isHourRange
                ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
              value: d.value || 0,
            };
          });

        const [tempRes, powerRes, voltageRes, energyRes, energyTrendRes] = await Promise.all([
          apiFetch(
            `/api/devices/history/aggregate?property=driverTemperature&range=${timeRange}`,
          ),
          apiFetch(
            `/api/devices/history/aggregate?property=driverInputPower&range=${timeRange}`,
          ),
          apiFetch(
            `/api/devices/history/aggregate?property=driverInputVoltage&range=${timeRange}`,
          ),
          apiFetch(`/api/devices/energy-by-device?range=${timeRange}`),
          apiFetch(`/api/devices/energy/trend?range=${timeRange}`),
        ]);

        const [tempData, powerData, voltageData, energyData, energyTrendData] =
          await Promise.all([
            tempRes.ok ? tempRes.json() : Promise.resolve([]),
            powerRes.ok ? powerRes.json() : Promise.resolve([]),
            voltageRes.ok ? voltageRes.json() : Promise.resolve([]),
            energyRes.ok ? energyRes.json() : Promise.resolve([]),
            energyTrendRes.ok ? energyTrendRes.json() : Promise.resolve([]),
          ]);

        setChartData((prev) => ({
          ...prev,
          lightLevelTrend: toPoints(tempData),
          powerTrend: toPoints(powerData),
          voltageTrend: toPoints(voltageData),
          energyByDevice: energyData,
          energyTrend: toPoints(energyTrendData),
        }));
      } catch (err: any) {
        console.error("Error fetching historical data:", err);
      }
    };

    fetchHistoricalData();
  }, [timeRange]);

  // Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and analyze your DALI devices
          </Typography>
        </Box>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DeviceCard />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DriverTemperatureCard />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnergySummaryCard />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ErrorDeviceCard />
        </Grid>
      </Grid>

      {/* Charts Row 1 - Full Width Line Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <HistoryChart
              data={chartData.lightLevelTrend}
              title={`Driver Temperature Trend - All Devices (${timeRange})`}
              color="#5470C6"
              unit="°C"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 - Energy Consumption Bar Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <BarChart
              data={chartData.energyByDevice}
              title="Top 10 Energy Consumption by Device"
              color="#91cc75"
              height="350px"
              unit="kWh"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Energy Consumption Trend */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <AreaChart
              data={chartData.energyTrend}
              title={`Total Energy Consumption Trend — All Devices (${timeRange})`}
              color="#4caf50"
              gradient={true}
              unit="Wh"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Power and Voltage Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <AreaChart
              data={chartData.powerTrend}
              title={`Driver Input Power Trend (${timeRange})`}
              color="#ee6666"
              gradient={true}
              unit="W"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <AreaChart
              data={chartData.voltageTrend}
              title={`Driver Input Voltage Trend (${timeRange})`}
              color="#fac858"
              gradient={true}
              unit="V"
            />
          </Paper>
        </Grid>
      </Grid>
      <RealTimeGauges />
    </Container>
  );
}
