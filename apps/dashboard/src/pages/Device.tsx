import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Devices as DevicesIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  DeviceThermostat as ThermostatIcon,
  BatteryChargingFull as BatteryIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { apiFetch } from "../lib/apiClient";
import PropertyValue from "../components/PropertyValue";
import StatCard from "../components/StatCard";
import TimeRangeSelector from "../components/TimeRangeSelector";
import { useHistoricalData } from "../hooks/useHistoricalData";
import ReactECharts from "echarts-for-react";
import { formatSecondsToText } from "../utils/dataTransform";

type DeviceDetail = {
  guid: string;
  title: string;
  port: number;
  shortAddress: number;
  type: string;
  gtin?: string;
  serial?: string;
  zones?: string[];
  properties: string[];
};

export default function DeviceDetailPage() {
  const { guid, controller } = useParams();
  if (!guid || !controller) return <>404</>;
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");

  // Check which properties are supported
  const hasDriverInputPower = device?.properties.includes("driverInputPower");
  const hasDriverInputVoltage =
    device?.properties.includes("driverInputVoltage");
  const hasDriverTemperature = device?.properties.includes("driverTemperature");
  const hasDriverEnergyConsumption = device?.properties.includes(
    "driverEnergyConsumption",
  );
  const hasDriverOperationTime = device?.properties.includes(
    "driverOperationTime",
  );

  // Fetch historical data for charts
  const { data: powerData } = useHistoricalData(
    controller,
    hasDriverInputPower ? guid || null : null,
    "driverInputPower",
    timeRange,
  );
  const { data: voltageData } = useHistoricalData(
    controller,
    hasDriverInputVoltage ? guid || null : null,
    "driverInputVoltage",
    timeRange,
  );
  const { data: temperatureData } = useHistoricalData(
    controller,
    hasDriverTemperature ? guid || null : null,
    "driverTemperature",
    timeRange,
  );

  // Fetch current values for stat cards directly from controller
  const [currentData, setCurrentData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!device || !guid || !controller) return;

    const fetchCurrentData = async () => {
      const data: Record<string, any> = {};

      try {
        if (hasDriverTemperature) {
          const res = await apiFetch(
            `/api/devices/${controller}/${guid}/driverTemperature`,
          );
          if (res.ok) {
            const result = await res.json();
            data.driverTemperature = result.value;
          }
        }
        if (hasDriverEnergyConsumption) {
          const res = await apiFetch(
            `/api/devices/${controller}/${guid}/driverEnergyConsumption`,
          );
          if (res.ok) {
            const result = await res.json();
            data.driverEnergyConsumption = result.value;
          }
        }
        if (hasDriverOperationTime) {
          const res = await apiFetch(
            `/api/devices/${controller}/${guid}/driverOperationTime`,
          );
          if (res.ok) {
            const result = await res.json();
            data.driverOperationTime = result.value;
          }
        }
        setCurrentData(data);
      } catch (err) {
        console.error("Failed to fetch current data:", err);
      }
    };

    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [
    device,
    guid,
    controller,
    hasDriverTemperature,
    hasDriverEnergyConsumption,
    hasDriverOperationTime,
  ]);

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const res = await apiFetch(`/api/devices/${controller}/${guid}`, {
          method: "GET",
        });
        if (!res.ok)
          throw new Error(`Failed to get device details (${res.status})`);
        const data = await res.json();
        setDevice(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load device information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [guid, controller]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!device) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DevicesIcon sx={{ fontSize: 40, color: "#1976d2" }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {device.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip
                icon={<InfoIcon />}
                label={device.type}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Address: ${device.shortAddress}`}
                variant="outlined"
              />
              <Chip label={`Port: ${device.port}`} variant="outlined" />
              {device.zones && device.zones.length > 0 && (
                <Chip
                  icon={<LocationIcon />}
                  label={device.zones.join(", ")}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Current Stats Cards */}
      {(hasDriverTemperature ||
        hasDriverEnergyConsumption ||
        hasDriverOperationTime) && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom mb={2}>
            Current Status
          </Typography>
          <Grid container spacing={3}>
            {hasDriverTemperature && (
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Driver Temperature"
                  value={
                    currentData.driverTemperature !== undefined
                      ? typeof currentData.driverTemperature === "number"
                        ? currentData.driverTemperature.toFixed(1)
                        : currentData.driverTemperature
                      : "N/A"
                  }
                  unit="°C"
                  icon={<ThermostatIcon />}
                  color="#ff9800"
                  loading={
                    currentData.driverTemperature !== undefined ? false : true
                  }
                />
              </Grid>
            )}
            {hasDriverEnergyConsumption && (
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Energy Consumption"
                  value={
                    currentData.driverEnergyConsumption !== undefined
                      ? typeof currentData.driverEnergyConsumption === "number"
                        ? (currentData.driverEnergyConsumption / 1000).toFixed(
                            2,
                          )
                        : currentData.driverEnergyConsumption
                      : "N/A"
                  }
                  unit="kWh"
                  icon={<BatteryIcon />}
                  color="#4caf50"
                  loading={
                    currentData.driverEnergyConsumption !== undefined
                      ? false
                      : true
                  }
                />
              </Grid>
            )}
            {hasDriverOperationTime && (
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Operation Time"
                  value={
                    currentData.driverOperationTime !== undefined
                      ? typeof currentData.driverOperationTime === "number"
                        ? formatSecondsToText(currentData.driverOperationTime)
                        : currentData.driverOperationTime
                      : "N/A"
                  }
                  unit="hrs"
                  icon={<TimeIcon />}
                  color="#2196f3"
                  loading={
                    currentData.driverOperationTime !== undefined ? false : true
                  }
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Charts Section */}
      {(hasDriverInputPower ||
        hasDriverInputVoltage ||
        hasDriverTemperature) && (
        <Box mb={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">Historical Data</Typography>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </Box>
          <Grid container spacing={3}>
            {hasDriverInputPower && (
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Driver Input Power
                    </Typography>
                                        <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "axis",
                          formatter: (params: any) => {
                            const data = params[0];
                            return `${new Date(data.name).toLocaleString()}<br/>Power: ${data.value.toFixed(2)} W`;
                          },
                        },
                        xAxis: {
                          type: "category",
                          data: powerData.map((d: any) => d._time),
                          axisLabel: {
                            formatter: (value: string) => new Date(value).toLocaleTimeString(),
                          },
                        },
                        yAxis: {
                          type: "value",
                          name: "Power (W)",
                        },
                        series: [
                          {
                            name: "Power",
                            type: "line",
                            data: powerData.map((d: any) => d.value_num),
                            smooth: true,
                            itemStyle: { color: "#8884d8" },
                          },
                        ],
                        grid: { left: "10%", right: "5%", bottom: "15%" },
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
            {hasDriverInputVoltage && (
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Driver Input Voltage
                    </Typography>
                                        <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "axis",
                          formatter: (params: any) => {
                            const data = params[0];
                            return `${new Date(data.name).toLocaleString()}<br/>Voltage: ${data.value.toFixed(2)} V`;
                          },
                        },
                        xAxis: {
                          type: "category",
                          data: voltageData.map((d: any) => d._time),
                          axisLabel: {
                            formatter: (value: string) => new Date(value).toLocaleTimeString(),
                          },
                        },
                        yAxis: {
                          type: "value",
                          name: "Voltage (V)",
                        },
                        series: [
                          {
                            name: "Voltage",
                            type: "line",
                            data: voltageData.map((d: any) => d.value_num),
                            smooth: true,
                            itemStyle: { color: "#82ca9d" },
                          },
                        ],
                        grid: { left: "10%", right: "5%", bottom: "15%" },
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
            {hasDriverTemperature && (
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Driver Temperature
                    </Typography>
                                        <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "axis",
                          formatter: (params: any) => {
                            const data = params[0];
                            return `${new Date(data.name).toLocaleString()}<br/>Temperature: ${data.value.toFixed(1)} °C`;
                          },
                        },
                        xAxis: {
                          type: "category",
                          data: temperatureData.map((d: any) => d._time),
                          axisLabel: {
                            formatter: (value: string) => new Date(value).toLocaleTimeString(),
                          },
                        },
                        yAxis: {
                          type: "value",
                          name: "Temperature (°C)",
                        },
                        series: [
                          {
                            name: "Temperature",
                            type: "line",
                            data: temperatureData.map((d: any) => d.value_num),
                            smooth: true,
                            itemStyle: { color: "#ff9800" },
                          },
                        ],
                        grid: { left: "10%", right: "5%", bottom: "15%" },
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Static Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <InfoIcon color="primary" />
                <Typography variant="h6">Static Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    GUID
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {device.guid}
                  </Typography>
                </Box>
                {device.gtin && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      GTIN
                    </Typography>
                    <Typography variant="body2">{device.gtin}</Typography>
                  </Box>
                )}
                {device.serial && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Serial Number
                    </Typography>
                    <Typography variant="body2">{device.serial}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Controller
                  </Typography>
                  <Typography variant="body2">{controller}</Typography>
                </Box>
                {device.zones && device.zones.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Zones
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {device.zones.map((zone, index) => (
                        <Chip
                          key={index}
                          label={zone}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Properties Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">Live Properties</Typography>
                {device.properties && device.properties.length > 0 && (
                  <Chip
                    label={`${device.properties.length} properties`}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  flex: 1,
                  maxHeight: "calc(100vh - 400px)",
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {device.properties && device.properties.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {device.properties.map((prop) => (
                      <PropertyValue
                        key={prop}
                        guid={guid as string}
                        property={prop}
                        controller={controller as string}
                      />
                    ))}
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    <SettingsIcon
                      sx={{ fontSize: 60, color: "#9e9e9e", mb: 2 }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      No properties available for this device
                    </Typography>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
