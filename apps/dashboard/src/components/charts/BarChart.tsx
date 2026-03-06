
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
  horizontal?: boolean;
  height?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  title,
  color = '#91cc75',
  horizontal = false,
  height = '350px',
  showValues = false
}: BarChartProps) {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map(d => d.name),
      axisLabel: {
        rotate: horizontal ? 0 : 45,
        interval: 0
      }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map(d => d.name) : undefined
    },
    series: [
      {
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: {
          color: color
        },
        label: {
          show: showValues,
          position: horizontal ? 'right' : 'top',
          formatter: '{c}'
        },
        barMaxWidth: 50
      }
    ]
  };

  return <ReactECharts option={option} style={{ height }} />;
}
