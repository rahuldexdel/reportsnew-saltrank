import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#cc6c2c', '#1f1f1f', '#bfbfbf'];

const parseValue = (val) => {
  if (typeof val === 'string' && val.includes('k')) return parseFloat(val) * 1000;
  return parseFloat(val);
};

const DonutChart = ({ deviceClickSummary }) => {
  const chartData = Object.entries(deviceClickSummary.devices).map(([device, value]) => ({
    name: device,
    value: parseValue(value),
  }));

  return (
    <div className="flex flex-col items-center justify-center relative">
      <PieChart width={200} height={200}>
        <Pie
          data={chartData}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
      <div className="text-xl font-semibold absolute top-[85px] left-[85px]">
        {deviceClickSummary.totalClicks_stats}
      </div>
      <div className="mt-4 flex gap-4 text-sm">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <span>{entry.name}: {deviceClickSummary.devices[entry.name]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
