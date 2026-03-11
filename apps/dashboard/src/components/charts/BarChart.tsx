
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
  horizontal?: boolean;
  height?: string;
  showValues?: boolean;
  unit?: string;
}

export default function BarChart({
  data,
  title,
  color = '#91cc75',
  horizontal = false,
  height = '350px',
  showValues = false,
  unit = ''
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
      },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.value} ${unit}`;
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
      data: horizontal ? data.map(d => d.name) : undefined,
      name: unit,
      nameLocation: 'middle',
      nameGap: 50
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
          formatter: `{c} ${unit}`
        },
        barMaxWidth: 50
      }
    ]
  };

  return <ReactECharts option={option} style={{ height }} />;
}
