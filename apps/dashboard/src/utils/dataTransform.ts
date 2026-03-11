/**
 * Transform historical data points to chart format
 */
export function transformToChartData(
  data: Array<{ timestamp: string; value: number }>,
  label: string = "Value",
) {
  return {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: data.map((d) => d.value),
      },
    ],
  };
}

/**
 * Transform energy summary to bar chart format
 */
export function transformEnergyToBarChart(
  data: Array<{ deviceName: string; totalEnergy: number }>,
) {
  return data.map((item) => ({
    name: item.deviceName,
    value: item.totalEnergy,
  }));
}

/**
 * Transform property distribution to pie chart format
 */
export function transformToPieChart(
  data: Array<{ name: string; value: number }>,
) {
  return data.map((item) => ({
    name: item.name,
    value: item.value,
  }));
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(
  timestamp: string,
  format: "date" | "time" | "datetime" = "datetime",
) {
  const date = new Date(timestamp);

  switch (format) {
    case "date":
      return date.toLocaleDateString();
    case "time":
      return date.toLocaleTimeString();
    case "datetime":
    default:
      return date.toLocaleString();
  }
}

/**
 * Format number with units
 */
export function formatValue(
  value: number,
  unit?: string,
  decimals: number = 2,
) {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Group data by time interval
 */
export function groupByTimeInterval(
  data: Array<{ timestamp: string; value: number }>,
  intervalMinutes: number,
) {
  const grouped: { [key: string]: number[] } = {};

  data.forEach((item) => {
    const date = new Date(item.timestamp);
    const intervalKey = new Date(
      Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) *
        (intervalMinutes * 60 * 1000),
    ).toISOString();

    if (!grouped[intervalKey]) {
      grouped[intervalKey] = [];
    }
    grouped[intervalKey].push(item.value);
  });

  return Object.entries(grouped).map(([timestamp, values]) => ({
    timestamp,
    value: values.reduce((sum, v) => sum + v, 0) / values.length, // Average
  }));
}

/**
 * Get time range in ISO format
 */
export function getTimeRangeISO(range: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "1h":
      start.setHours(start.getHours() - 1);
      break;
    case "6h":
      start.setHours(start.getHours() - 6);
      break;
    case "24h":
      start.setHours(start.getHours() - 24);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    default:
      start.setHours(start.getHours() - 24);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
// Format seconds to days, hours, minutes, seconds
export function formatSeconds(seconds: number) {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { days, hours, minutes, seconds: secs };
}

export function formatSecondsToText(seconds: number): string {
  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInMonth = secondsInDay * 30;    // roughly 30 days per month
  const secondsInYear = secondsInDay * 365;    // 365 days per year
  const years = Math.floor(seconds / secondsInYear);
  seconds %= secondsInYear;
  const months = Math.floor(seconds / secondsInMonth);
  seconds %= secondsInMonth;
  const days = Math.floor(seconds / secondsInDay);
  seconds %= secondsInDay;
  const hours = Math.floor(seconds / secondsInHour);
  seconds %= secondsInHour;
  const minutes = Math.floor(seconds / secondsInMinute);
  const secs = seconds % secondsInMinute;
  const parts = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}mo`);
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

// Error bit map definitions based on DALI specification
type ErrorBit = {
  bit: number;
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
};

const ERROR_BIT_MAP: ErrorBit[] = [
  { bit: 0, name: "Device Missing", description: "Device is missing", severity: "error" },
  { bit: 1, name: "Control Gear Error", description: "Device error", severity: "error" },
  { bit: 2, name: "Lamp Error", description: "Lamp error", severity: "error" },
  { bit: 3, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 4, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 5, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 6, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 7, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 8, name: "Detailed Error Info", description: "Device error, the device supports detailed error information", severity: "info" },
  { bit: 9, name: "Undervoltage", description: "Line power undervoltage detected", severity: "warning" },
  { bit: 10, name: "Overvoltage", description: "Line power overvoltage detected", severity: "warning" },
  { bit: 11, name: "Output Power Limit", description: "The output power will be limited", severity: "warning" },
  { bit: 12, name: "Thermal Derating", description: "The light is reduced due to overheating", severity: "warning" },
  { bit: 13, name: "Thermal Shutdown", description: "The light is switched off due to overheating", severity: "error" },
  { bit: 14, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 15, name: "Reserved", description: "Reserved", severity: "info" },
  { bit: 16, name: "Detailed Lamp Info", description: "Lamp error, the device supports detailed error information", severity: "info" },
];

// Parse error bits from a number value
export function parseErrorBits(errorValue: number): ErrorBit[] {
  const activeErrors: ErrorBit[] = [];
  ERROR_BIT_MAP.forEach((errorBit) => {
    if (errorValue & (1 << errorBit.bit)) {
      activeErrors.push(errorBit);
    }
  });
  return activeErrors;
}
