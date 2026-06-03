import React from 'react';
import { Bar, BarChart, PieChart, Pie, Cell, ComposedChart,CartesianGrid,AreaChart , Area, Legend,LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis,Tooltip } from "recharts";


const COLORS = [
  "#FF7F50", "#E38627", "#8A2BE2", "#00C49F", "#FFBB28", "#FF8042", "#A52A2A",
  "#00CED1", "#9400D3", "#FF4500", "#2E8B57", "#8B0000", "#1E90FF", "#D2691E"
];

// Parse "9m 47s" to total seconds
const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  const match = durationStr.match(/(?:(\d+)m)?\s*(?:(\d+)s)?/);
  if (!match) return 0;
  const minutes = parseInt(match[1]) || 0;
  const seconds = parseInt(match[2]) || 0;
  return minutes * 60 + seconds;
};

// Custom tooltip to show name and formatted duration
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ccc', 
        padding: 10, 
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        fontSize: 14
      }}>
        <p><strong>{data.name}</strong></p>
        <p>Avg Duration: {data.formattedDuration}</p>
      </div>
    );
  }
  return null;
};

const DonutChart = ({ data }) => {
  // Add numeric seconds for sizing
  const dataWithSeconds = data.map(item => ({
    ...item,
    durationSeconds: parseDuration(item.formattedDuration),
  }));

  // Sum total duration in seconds for center display
  const totalSeconds = dataWithSeconds.reduce((acc, cur) => acc + cur.durationSeconds, 0);

  // Format total seconds to "Xh Ym" or "Xm Ys"
  const formatTotalDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={dataWithSeconds}
          dataKey="durationSeconds"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={90}
          outerRadius={130}
          fill="#8884d8"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
          paddingAngle={3}
        >
          {dataWithSeconds.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 24, fontWeight: 'bold', pointerEvents: 'none' }}
        >
          {formatTotalDuration(totalSeconds)}
        </text>

        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DonutChart;