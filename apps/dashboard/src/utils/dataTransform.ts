/**
 * Transform historical data points to chart format
 */
export function transformToChartData(
  data: Array<{ timestamp: string; value: number }>,
  label: string = 'Value'
) {
  return {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label,
        data: data.map(d => d.value),
      },
    ],
  };
}

/**
 * Transform energy summary to bar chart format
 */
export function transformEnergyToBarChart(
  data: Array<{ deviceName: string; totalEnergy: number }>
) {
  return data.map(item => ({
    name: item.deviceName,
    value: item.totalEnergy,
  }));
}

/**
 * Transform property distribution to pie chart format
 */
export function transformToPieChart(
  data: Array<{ name: string; value: number }>
) {
  return data.map(item => ({
    name: item.name,
    value: item.value,
  }));
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp: string, format: 'date' | 'time' | 'datetime' = 'datetime') {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'datetime':
    default:
      return date.toLocaleString();
  }
}

/**
 * Format number with units
 */
export function formatValue(value: number, unit?: string, decimals: number = 2) {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Group data by time interval
 */
export function groupByTimeInterval(
  data: Array<{ timestamp: string; value: number }>,
  intervalMinutes: number
) {
  const grouped: { [key: string]: number[] } = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    const intervalKey = new Date(
      Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
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
    case '1h':
      start.setHours(start.getHours() - 1);
      break;
    case '6h':
      start.setHours(start.getHours() - 6);
      break;
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
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
