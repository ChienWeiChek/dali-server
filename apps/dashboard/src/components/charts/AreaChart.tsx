
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface AreaChartProps {
  data: { time: string; label?: string; value: number }[];
  title: string;
  color?: string;
  gradient?: boolean;
  height?: string;
  smooth?: boolean;
  unit?: string;
}

export default function AreaChart({
  data,
  title,
  color = '#ee6666',
  gradient = true,
  height = '350px',
  smooth = true,
  unit = ''
}: AreaChartProps) {
  const option = useMemo(() => {
    const areaStyle = gradient
      ? {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color },
              { offset: 1, color: `${color}10` }
            ]
          }
        }
      : { color: `${color}40` };

    return {
      title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const param = params[0];
          const fullTime = data[param.dataIndex]?.time ?? param.name;
          return `${fullTime}<br/>${param.value} ${unit}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(d => d.label ?? d.time)
      },
      yAxis: { type: 'value', name: unit, nameLocation: 'middle', nameGap: 50 },
      series: [
        {
          type: 'line',
          data: data.map(d => d.value),
          smooth,
          sampling: 'lttb',
          itemStyle: { color },
          areaStyle,
          lineStyle: { width: 2 }
        }
      ]
    };
  }, [data, title, color, gradient, smooth, unit]);

  return <ReactECharts option={option} lazyUpdate={true} notMerge={true} style={{ height }} />;
}
