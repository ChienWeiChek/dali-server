import ReactECharts from 'echarts-for-react';

interface HistoryChartProps {
  data: { time: string; value: number }[];
  title: string;
  color?: string;
}

export default function HistoryChart({ data, title, color = '#5470C6' }: HistoryChartProps) {
  const option = {
    title: { text: title },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time)
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: data.map(d => d.value),
        type: 'line',
        smooth: true,
        itemStyle: { color },
        areaStyle: { color }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
