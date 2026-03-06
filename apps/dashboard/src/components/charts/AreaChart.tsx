
import ReactECharts from 'echarts-for-react';

interface AreaChartProps {
  data: { time: string; value: number }[];
  title: string;
  color?: string;
  gradient?: boolean;
  height?: string;
  smooth?: boolean;
}

export default function AreaChart({
  data,
  title,
  color = '#ee6666',
  gradient = true,
  height = '350px',
  smooth = true
}: AreaChartProps) {
  const areaStyle = gradient
    ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color },
            { offset: 1, color: `${color}10` }
          ]
        }
      }
    : { color: `${color}40` };

  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.time)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'line',
        data: data.map(d => d.value),
        smooth: smooth,
        itemStyle: {
          color: color
        },
        areaStyle: areaStyle,
        lineStyle: {
          width: 2
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height }} />;
}
