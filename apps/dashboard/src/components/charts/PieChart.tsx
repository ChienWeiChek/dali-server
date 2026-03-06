
import ReactECharts from 'echarts-for-react';

interface PieChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
  height?: string;
  showLegend?: boolean;
  radius?: [string, string];
}

export default function PieChart({
  data,
  title,
  colors,
  height = '350px',
  showLegend = true,
  radius = ['40%', '70%']
}: PieChartProps) {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      show: showLegend,
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    color: colors || [
      '#5470c6',
      '#91cc75',
      '#fac858',
      '#ee6666',
      '#73c0de',
      '#3ba272',
      '#fc8452',
      '#9a60b4'
    ],
    series: [
      {
        type: 'pie',
        radius: radius,
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height }} />;
}
