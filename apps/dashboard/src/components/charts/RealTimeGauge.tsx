import ReactECharts from 'echarts-for-react';

interface RealTimeGaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  title: string;
}

export default function RealTimeGauge({ value, min = 0, max = 100, unit = '', title }: RealTimeGaugeProps) {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    series: [
      {
        type: 'gauge',
        min,
        max,
        progress: { show: true },
        detail: {
          valueAnimation: true,
          formatter: `{value}${unit}`,
          fontSize: 20
        },
        data: [{ value }]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
