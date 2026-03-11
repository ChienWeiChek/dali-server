import { useEffect, useState, useMemo } from "react";
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

// Configuration types
type ChartConfig = {
  property: string;
  title: string;
  unit: string;
  color: string;
  yAxisName: string;
  tooltipLabel: string;
  valueFormatter?: (value: number) => string;
};

type CardConfig = {
  property: string;
  title: string;
  unit: string;
  icon: JSX.Element;
  color: string;
  valueFormatter?: (value: any) => string | number;
};

// UI Configuration - Easy to modify what shows in charts and cards
const UI_CONFIG = {
  // Properties to show as historical charts
  chartData: [
    {
      property: "driverInputPower",
      title: "Driver Input Power",
      unit: "W",
      color: "#8884d8",
      yAxisName: "Power (W)",
      tooltipLabel: "Power",
      valueFormatter: (value: number) => value.toFixed(2),
    },
    {
      property: "driverInputVoltage",
      title: "Driver Input Voltage",
      unit: "V",
      color: "#82ca9d",
      yAxisName: "Voltage (V)",
      tooltipLabel: "Voltage",
      valueFormatter: (value: number) => value.toFixed(2),
    },
    {
      property: "driverTemperature",
      title: "Driver Temperature",
      unit: "°C",
      color: "#ff9800",
      yAxisName: "Temperature (°C)",
      tooltipLabel: "Temperature",
      valueFormatter: (value: number) => value.toFixed(1),
    },
  ] as ChartConfig[],

  // Properties to show as stat cards
  cardData: [
    {
      property: "driverTemperature",
      title: "Driver Temperature",
      unit: "°C",
      icon: <ThermostatIcon />,
      color: "#ff9800",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toFixed(1) : value,
    },
    {
      property: "driverEnergyConsumption",
      title: "Energy Consumption",
      unit: "kWh",
      icon: <BatteryIcon />,
      color: "#4caf50",
      valueFormatter: (value: any) =>
        typeof value === "number" ? (value / 1000).toFixed(2) : value,
    },
    {
      property: "driverOperationTime",
      title: "Operation Time",
      unit: "",
      icon: <TimeIcon />,
      color: "#2196f3",
      valueFormatter: (value: any) =>
        typeof value === "number" ? formatSecondsToText(value) : value,
    },
  ] as CardConfig[],
};

export default function DeviceDetailPage() {
  const { guid, controller } = useParams();
  if (!guid || !controller) return <>404</>;
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");

  // Filter configs based on available device properties
  const availableCharts = useMemo(
    () =>
      UI_CONFIG.chartData.filter((chart) =>
        device?.properties.includes(chart.property),
      ),
    [device?.properties],
  );

  const availableCards = useMemo(
    () =>
      UI_CONFIG.cardData.filter((card) =>
        device?.properties.includes(card.property),
      ),
    [device?.properties],
  );

  // Fetch historical data for all chart properties (always call hooks in same order)
  const chartDataHooks = UI_CONFIG.chartData.map((chart) => {
    const hasProperty = device?.properties.includes(chart.property);
    return {
      property: chart.property,
      data: useHistoricalData(
        controller,
        hasProperty ? guid || null : null,
        chart.property,
        timeRange,
      ).data,
    };
  });

  // Create a map of property -> data for easy lookup
  const chartDataMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    chartDataHooks.forEach((hook) => {
      map[hook.property] = hook.data;
    });
    return map;
  }, [chartDataHooks]);

  // Fetch current values for stat cards directly from controller
  const [currentData, setCurrentData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!device || !guid || !controller || availableCards.length === 0) return;

    const fetchCurrentData = async () => {
      const data: Record<string, any> = {};

      try {
        // Fetch data for all configured card properties
        await Promise.all(
          availableCards.map(async (card) => {
            const res = await apiFetch(
              `/api/devices/${controller}/${guid}/${card.property}`,
            );
            if (res.ok) {
              const result = await res.json();
              data[card.property] = result.value;
            }
          }),
        );
        setCurrentData(data);
      } catch (err) {
        console.error("Failed to fetch current data:", err);
      }
    };

    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [device, guid, controller, availableCards]);

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

      {/* Current Stats Cards - Dynamically rendered from config */}
      {availableCards.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom mb={2}>
            Current Status
          </Typography>
          <Grid container spacing={3}>
            {availableCards.map((card) => (
              <Grid item xs={12} md={4} key={card.property}>
                <StatCard
                  title={card.title}
                  value={
                    currentData[card.property] !== undefined
                      ? card.valueFormatter
                        ? card.valueFormatter(currentData[card.property])
                        : currentData[card.property]
                      : "N/A"
                  }
                  unit={card.unit}
                  icon={card.icon}
                  color={card.color}
                  loading={currentData[card.property] === undefined}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Charts Section - Dynamically rendered from config */}
      {availableCharts.length > 0 && (
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
            {availableCharts.map((chart) => {
              const data = chartDataMap[chart.property] || [];
              return (
                <Grid item xs={12} lg={6} key={chart.property}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {chart.title}
                      </Typography>
                      <ReactECharts
                        option={{
                          tooltip: {
                            trigger: "axis",
                            formatter: (params: any) => {
                              const dataPoint = params[0];
                              const formattedValue = chart.valueFormatter
                                ? chart.valueFormatter(dataPoint.value)
                                : dataPoint.value;
                              return `${new Date(dataPoint.name).toLocaleString()}<br/>${chart.tooltipLabel}: ${formattedValue} ${chart.unit}`;
                            },
                          },
                          xAxis: {
                            type: "category",
                            data: data.map((d: any) => d._time),
                            axisLabel: {
                              formatter: (value: string) =>
                                new Date(value).toLocaleTimeString(),
                            },
                          },
                          yAxis: {
                            type: "value",
                            name: chart.yAxisName,
                          },
                          series: [
                            {
                              name: chart.title,
                              type: "line",
                              data: data.map((d: any) => d.value_num),
                              smooth: true,
                              itemStyle: { color: chart.color },
                            },
                          ],
                          grid: { left: "10%", right: "5%", bottom: "15%" },
                        }}
                        style={{ height: "300px" }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
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
