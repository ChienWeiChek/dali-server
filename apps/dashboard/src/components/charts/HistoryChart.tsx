
import ReactECharts from 'echarts-for-react';

interface HistoryChartProps {
  data: { time: string; value: number }[];
  title: string;
  color?: string;
  unit?: string;
}

export default function HistoryChart({ data, title, color = '#5470C6', unit = '' }: HistoryChartProps) {
  const option = {
    title: { text: title },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.value} ${unit}`;
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time)
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
        itemStyle: { color },
        areaStyle: { color }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
