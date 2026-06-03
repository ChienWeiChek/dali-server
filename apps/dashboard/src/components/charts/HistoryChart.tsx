
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface HistoryChartProps {
  data: { time: string; label?: string; value: number }[];
  title: string;
  color?: string;
  unit?: string;
}

export default function HistoryChart({ data, title, color = '#5470C6', unit = '' }: HistoryChartProps) {
  const option = useMemo(() => ({
    title: { text: title },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        const fullTime = data[param.dataIndex]?.time ?? param.name;
        return `${fullTime}<br/>${param.value} ${unit}`;
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.label ?? d.time)
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameLocation: 'middle',
      nameGap: 50
    },
    series: [
      {
        data: data.map(d => d.value),
        type: 'line',
        smooth: true,
        sampling: 'lttb',
        itemStyle: { color },
        areaStyle: { color }
      }
    ]
  }), [data, title, color, unit]);

  return <ReactECharts option={option} lazyUpdate={true} notMerge={true} style={{ height: '300px' }} />;
}
