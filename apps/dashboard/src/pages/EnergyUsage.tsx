import { useState, useMemo } from "react";
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Bolt as BoltIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as NeutralIcon,
} from "@mui/icons-material";
import ReactECharts from "echarts-for-react";
import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";
import { useDevices } from "../hooks/useDevices";
import type { Device } from "../types/dashboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoScale(wh: number): { value: string; unit: string } {
  if (Math.abs(wh) < 1000) return { value: wh.toFixed(1), unit: "Wh" };
  return { value: (wh / 1000).toFixed(2), unit: "kWh" };
}

function buildBarOption(
  data: { name: string; value: number }[],
  title: string,
  color: string,
) {
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>${p.value} kWh`;
      },
    },
    grid: { left: "4%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLabel: { rotate: 35, interval: 0, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "kWh",
      nameLocation: "middle",
      nameGap: 45,
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color },
        label: { show: true, position: "top", formatter: "{c}", fontSize: 10 },
        barMaxWidth: 40,
      },
    ],
  };
}

// ── Energy Stat Card ──────────────────────────────────────────────────────────

interface StatPeriod {
  wh: number;
  changePercent: number | null;
}

function EnergyStatCard({
  title,
  subtitle,
  period,
  compareLabel,
  icon,
  color,
  loading,
}: {
  title: string;
  subtitle?: string;
  period: StatPeriod | undefined;
  compareLabel: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  const scaled = period ? autoScale(period.wh) : null;
  const pct = period?.changePercent ?? null;

  const changeEl = () => {
    if (pct === null) return <Typography variant="caption" color="text.secondary">— no prior data</Typography>;
    const up = pct > 0;
    const neutral = pct === 0;
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {neutral
          ? <NeutralIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          : up
          ? <TrendingUpIcon sx={{ fontSize: 14, color: "#d32f2f" }} />
          : <TrendingDownIcon sx={{ fontSize: 14, color: "#2e7d32" }} />}
        <Typography
          variant="caption"
          sx={{ color: neutral ? "text.secondary" : up ? "#d32f2f" : "#2e7d32", fontWeight: 600 }}
        >
          {pct > 0 ? "+" : ""}{pct.toFixed(1)}% {compareLabel}
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading || !scaled ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box display="flex" alignItems="baseline" gap={0.5}>
                  <Typography variant="h5" fontWeight={700} sx={{ color }}>
                    {scaled.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {scaled.unit}
                  </Typography>
                </Box>
                {subtitle && (
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {subtitle}
                  </Typography>
                )}
                {changeEl()}
              </>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              flexShrink: 0,
              ml: 1,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EnergyUsage() {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const { liveDevices } = useDevices();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Extract unique zones + GUID map from live device data
  const { zones, guidsByZone } = useMemo(() => {
    const zoneSet = new Set<string>();
    const guidMap: Record<string, string[]> = {};
    Object.values(liveDevices as Record<string, Device[]>).forEach((devices) => {
      devices.forEach((device: any) => {
        (device.zones ?? []).forEach((zone: string) => {
          zoneSet.add(zone);
          (guidMap[zone] ??= []).push(device.guid);
        });
      });
    });
    return { zones: Array.from(zoneSet).sort(), guidsByZone: guidMap };
  }, [liveDevices]);

  const guidParam =
    selectedZone !== "all" && guidsByZone[selectedZone]?.length
      ? `guids=${guidsByZone[selectedZone].join(",")}`
      : "";

  const qs = (extra = "") =>
    [guidParam, extra].filter(Boolean).join("&");

  const fetcher = (url: string) => apiFetch(url).then((r) => (r.ok ? r.json() : null));

  const { data: monthlyData = [], isLoading: monthlyLoading } = useSWR(
    `/api/devices/energy/monthly${guidParam ? `?${guidParam}` : ""}`,
    fetcher,
  );
  const { data: weeklyData = [], isLoading: weeklyLoading } = useSWR(
    `/api/devices/energy/weekly${guidParam ? `?${guidParam}` : ""}`,
    fetcher,
  );
  const { data: dailyData = [], isLoading: dailyLoading } = useSWR(
    `/api/devices/energy/daily${guidParam ? `?${guidParam}` : ""}`,
    fetcher,
  );
  const { data: stats, isLoading: statsLoading } = useSWR(
    `/api/devices/energy/stats?tz=${encodeURIComponent(tz)}${guidParam ? `&${guidParam}` : ""}`,
    fetcher,
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
            <BoltIcon sx={{ fontSize: 32, color: "#4caf50" }} />
            <Typography variant="h4" component="h1">
              Energy Usage
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Fleet-wide energy consumption analysis
          </Typography>
        </Box>

        {/* Zone Filter */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Zone</InputLabel>
          <Select
            value={selectedZone}
            label="Zone"
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <MenuItem value="all">All Zones</MenuItem>
            {zones.map((z) => (
              <MenuItem key={z} value={z}>
                {z}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <EnergyStatCard
            title="Today"
            subtitle="so far today"
            period={stats?.today}
            compareLabel="vs yesterday"
            icon={<BoltIcon />}
            color="#4caf50"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnergyStatCard
            title="Yesterday"
            period={stats?.yesterday}
            compareLabel="vs day before"
            icon={<CalendarIcon />}
            color="#2196f3"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnergyStatCard
            title="Current Month"
            subtitle="month-to-date"
            period={stats?.currentMonth}
            compareLabel="vs last month"
            icon={<BoltIcon />}
            color="#ff9800"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnergyStatCard
            title="Last Month"
            period={stats?.lastMonth}
            compareLabel="vs month before"
            icon={<CalendarIcon />}
            color="#9c27b0"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Monthly Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {monthlyLoading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <ReactECharts
            option={buildBarOption(monthlyData, "Monthly Energy Usage — Last 12 Months", "#5470c6")}
            style={{ height: "320px" }}
            notMerge
          />
        )}
      </Paper>

      {/* Weekly + Daily Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            {weeklyLoading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
              <ReactECharts
                option={buildBarOption(weeklyData, "Weekly Energy Usage — Last 12 Complete Weeks", "#91cc75")}
                style={{ height: "320px" }}
                notMerge
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            {dailyLoading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
              <ReactECharts
                option={buildBarOption(dailyData, "Daily Energy Usage — Last 30 Days", "#ee6666")}
                style={{ height: "320px" }}
                notMerge
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
