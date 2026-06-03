import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, PieChart, Pie, Cell, ComposedChart,CartesianGrid,AreaChart , Area, Legend,LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis,Tooltip } from "recharts";
import PaginatedCallTable from "./CallRailTable";
import PaginatedCallTableSummary from "./CallRailTableSummary";
import DonutChart from "./DonutChart";
import CallCampaign from "./CallCampaign";

import CallCountByTag from "./CallCountByTag";
import CallCountByDuration from "./CallCountByDuration";
import MarketingChannels from "./MarketingChannels";

import { useState } from "react"

type Call = {
  id: string;
  customer_name?: string;
  business_phone_number?: string;
  customer_city?: string;
  customer_state?: string;
  duration: number; // seconds
  answered: boolean;
  start_time?: string;
  recording_player?: string;
};

type CallRailData = {
  calls: {
    calls: Call[];
    page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
  };
  timeseries: {
    current: any;
    previous: any;
  };
  sources: any;
  campaign: any;
};


const CallRailCalls = ({ data }: { data: CallRailData }) => {
  const { calls ,timeseries, sources ,campaign } = data;
  const rows = calls?.calls ?? [];

const [tooltip, setTooltip] = useState<any>(null)

  //console.log('timeseries',timeseries?.current?.data);

const current = timeseries?.current?.total_results || {};
const previous = timeseries?.previous?.total_results || {};

const change = (curr = 0, prev = 0) => {
  if (!prev) return { percent: 0, up: true }; 
  const diff = ((curr - prev) / prev) * 100;
  return {
    percent: Math.abs(diff).toFixed(1),
    up: diff >= 0,
  };
};

const totalCallsChange = change(current.total_calls, previous.total_calls);
const answeredCallsChange = change(current.answered_calls, previous.answered_calls);
const firstCallsChange = change(current.first_time_callers, previous.first_time_callers); 
const avgDurationChange = change(current.average_duration, previous.average_duration);


const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};


const callsByDate1 = (timeseries?.current?.data || []).map(day => ({
  date: day.date, 
  totalCalls: day.total_calls ?? 0,        
  uniqueCallers: day.first_time_callers ?? 0 
}));

const avgDurationData1 = (timeseries?.current?.data || []).map(day => ({
  date: day.date,
  avgDuration: day.average_duration ?? 0 
}));


const formatDuration11 = (seconds) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};


const answeredCallsByDate1 = (timeseries?.current?.data || []).map(day => ({
  date: day.date,
  totalCalls: day.total_calls ?? 0,
  answeredCalls: day.answered_calls ?? 0,
}));

const getFunnelData = (data = []) => {
  const totals = data.reduce(
    (acc, d) => {
      acc.total += d.total_calls ?? 0;
      acc.answered += d.answered_calls ?? 0;
      acc.first += d.first_time_callers ?? 0;
      return acc;
    },
    { total: 0, answered: 0, first: 0 }
  );

  const safeTotal = totals.total || 1;
  const safeAnswered = totals.answered || 1;

  return [
    {
      label: "Total Calls",
      value: totals.total,
      percent: 100, // always 100%
      color: "#f47c3c",
    },
    {
      label: "Answered Calls",
      value: totals.answered,
      percent: ((totals.answered / safeTotal) * 100).toFixed(2),
      color: "#2f3138",
    },
    {
      label: "First Calls",
      value: totals.first,
      percent: ((totals.first / safeAnswered) * 100).toFixed(2), // ✅ FIX
      color: "#e6e6e6",
    },
  ];
};


const mergedSources = {};
(sources || []).forEach(company => {
  (company.sources || []).forEach(item => {
    const key = item.key;

    if (!mergedSources[key]) {
      mergedSources[key] = {
        name: key,
        totalCalls: 0,
      };
    }

    mergedSources[key].totalCalls += item.total_calls ?? 0;
  });
});

const chartData = Object.values(mergedSources);


const mergedDuration = {};

(sources || []).forEach(company => {
  (company.sources || []).forEach(item => {

    const key = item.key;
    const calls = item.total_calls ?? 0;
    const avg = item.average_duration ?? 0;

    if (!mergedDuration[key]) {
      mergedDuration[key] = {
        name: key,
        totalCalls: 0,
        totalDuration: 0, // store raw
      };
    }

    mergedDuration[key].totalCalls += calls;
    mergedDuration[key].totalDuration += (avg * calls); // 🔥 IMPORTANT
  });
});

const chartDataduration = Object.values(mergedDuration).map(item => {

  const avg = item.totalCalls > 0
    ? Math.round(item.totalDuration / item.totalCalls)
    : 0;

  return {
    name: item.name,
    formattedDuration: `${Math.floor(avg / 60)}m ${avg % 60}s`,
  };
});







const data1 = getFunnelData(timeseries?.current?.data)

// Extract values
const total = data1[0]?.value || 0
const answered = data1[1]?.value || 0
const first = data1[2]?.value || 0

// Heights (relative)
const totalHeight = 240
const answeredHeight = total ? (answered / total) * totalHeight : 0
const firstHeight = total ? (first / total) * totalHeight : 0






  if (!rows.length) return <div className="text-sm text-gray-500">No call data found</div>;

  return (
    <div className="space-y-6">
   
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Calls"
              current={current.total_calls?.toLocaleString()}
              previous={`vs ${previous.total_calls?.toLocaleString()} prev`}
              change={totalCallsChange.percent}
              direction={totalCallsChange.up ? "up" : "down"}
            />
            <StatCard
              title="Answered Calls"
              current={current.answered_calls?.toLocaleString()}
              previous={`vs ${previous.answered_calls?.toLocaleString()} prev`}
              change={answeredCallsChange.percent}
              direction={answeredCallsChange.up ? "up" : "down"}
            />
            <StatCard
              title="First-Time Callers"
              current={current.first_time_callers?.toLocaleString()}
              previous={`vs ${previous.first_time_callers?.toLocaleString()} prev`}
              change={firstCallsChange.percent}
              direction={firstCallsChange.up ? "up" : "down"}
            />
            <StatCard
              title="Avg Duration"
              current={formatDuration(current.average_duration)}
              previous={`vs ${formatDuration(previous.average_duration)} prev`}
              change={avgDurationChange.percent}
              direction={avgDurationChange.up ? "up" : "down"}
            />
          </div>


      {/* Calls Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Volume of Calls Over Time</CardTitle>
          <CardDescription>Total calls vs unique callers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={callsByDate1}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-35} textAnchor="end" height={50} />
              <YAxis
                yAxisId="calls"
                label={{ value: "Total Calls", angle: -90, position: "insideLeft" }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="unique"
                orientation="right"
                label={{ value: "Unique Callers", angle: 90, position: "insideRight" }}
                allowDecimals={false}
              />
              <Tooltip formatter={(value) => value.toLocaleString()} labelFormatter={(label) => `Date: ${label}`} />
              <Legend verticalAlign="top" />
              <Bar yAxisId="calls" dataKey="totalCalls" fill="#f36201" name="Total Calls" barSize={25} />
              <Line yAxisId="unique" type="monotone" dataKey="uniqueCallers" stroke="#000000" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Unique Callers" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Duration Chart */}

        <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Average Duration of Calls Over Time</CardTitle>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={avgDurationData1}>
              <XAxis
                dataKey="date"
                angle={-35}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tickFormatter={formatDuration11}
                allowDecimals={false}
                label={{ value: "Avg Duration", angle: -90, position: "insideLeft" }}
              />

              <Tooltip
                formatter={(value) => formatDuration11(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Line
                type="monotone"
                dataKey="avgDuration"
                strokeWidth={2}
                  stroke="#f36201" 
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Average Duration"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Calls vs Answered Calls Over Time</CardTitle>
          <CardDescription>Shows how many calls were answered each day</CardDescription>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={answeredCallsByDate1}>
              <XAxis
                dataKey="date"
                angle={-35}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                label={{ value: "Calls", angle: -90, position: "insideLeft" }}
              />

              <Tooltip
                formatter={(value) => value.toLocaleString()}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Legend verticalAlign="top" />

              <Line
                type="monotone"
                dataKey="totalCalls"
                stroke="#f36201" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Calls"
              />

              <Line
                type="monotone"
                dataKey="answeredCalls"
                stroke="#000000"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Answered Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
        {/* Right Column */}


        <div className="flex items-center justify-center gap-10 relative">
        <Card> 
          <CardHeader>
            <CardTitle>Call Performance Funnel</CardTitle>
              </CardHeader>
              <CardContent>
            <svg width="550" height="450" viewBox="0 0 300 260">
              
              {/* 🔺 FULL TRIANGLE (TOP COLOR) */}
              <polygon
                points="0,10 300,10 150,250"
                fill="#e4570a"
                onMouseMove={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: data1[0].label,
                    value: total,
                    percent: data1[0].percent,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />

              {/* 🔻 ANSWERED OVERLAY */}
              <polygon
                points={`
                  ${150 - (answeredHeight / totalHeight) * 150},${250 - answeredHeight}
                  ${150 + (answeredHeight / totalHeight) * 150},${250 - answeredHeight}
                  150,250
                `}
                fill="#2c2f36"
                onMouseMove={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: data1[1].label,
                    value: answered,
                    percent: data1[1].percent,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />

              {/* 🔻 FIRST CALL OVERLAY */}
              <polygon
                points={`
                  ${150 - (firstHeight / totalHeight) * 150},${250 - firstHeight}
                  ${150 + (firstHeight / totalHeight) * 150},${250 - firstHeight}
                  150,250
                `}
                fill="#d1d5db"
                onMouseMove={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: data1[2].label,
                    value: first,
                    percent: data1[2].percent,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />

            </svg>

            {/* 👉 LABELS */}
            <div className="space-y-10 text-sm">
              {data1.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-gray-700">
                    {item.label}: {item.percent}%
                  </span>
                </div>
              ))}
            </div>

            {/* 🔥 TOOLTIP */}
            {tooltip && (
              <div
                className="fixed bg-black text-white text-xs px-3 py-2 rounded shadow z-50 pointer-events-none"
                style={{
                  top: tooltip.y + 10,
                  left: tooltip.x + 10,
                }}
              >
                <div className="font-semibold">{tooltip.label}</div>
                <div>Value: {tooltip.value}</div>
                <div>{tooltip.percent}%</div>
              </div>
            )}
              </CardContent> 
           </Card>
          </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
               <StatCard
              title="Answered Calls"
              current={current.answered_calls?.toLocaleString()}
              previous={`vs ${previous.answered_calls?.toLocaleString()} prev`}
              change={answeredCallsChange.percent}
              direction={answeredCallsChange.up ? "up" : "down"}
            />
            <StatCard
              title="First-Time Callers"
              current={current.first_time_callers?.toLocaleString()}
              previous={`vs ${previous.first_time_callers?.toLocaleString()} prev`}
              change={firstCallsChange.percent}
              direction={firstCallsChange.up ? "up" : "down"}
            /> 
      </div>

  <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
          <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                layout="vertical" // horizontal bars
                data={chartData}
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="totalCalls" fill="#FF7F50" />
              </BarChart>
            </ResponsiveContainer>
        </div> 
    
      <div className="flex flex-col gap-4">
         <DonutChart data={chartDataduration} />
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
               <div className="flex flex-col gap-4">
                <MarketingChannels calls={rows} />
              </div>
          </div>

      <h3 className='font-bold text-4xl text-center bg-black text-white py-2.5'>Callers & Campaign Overview  </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
              <PaginatedCallTable  calls={rows} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
            <PaginatedCallTableSummary calls={rows} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
              <CallCampaign campaign={campaign} />
          </div>
     

    <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
              <CallCountByTag calls={rows} />
          </div>
         <div className="flex flex-col gap-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">
                 <CallCountByDuration calls={rows} />
            </div>
         </div>
    </div>

    </div>
  );
};

export default CallRailCalls;

type StatCardProps = {
  title: string;
  current: string;
  previous: string;
  change?: number;         // percentage
  direction?: "up" | "down";
};
const StatCard = ({ title, current, previous, change, direction }: StatCardProps) => {
  return (
    <Card className="overflow-hidden group border rounded-lg bg-orange-100 dark:bg-card px-5 py-6">
      <CardContent className="flex flex-col items-center">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <h4 className="text-4xl font-bold mb-1">{current}</h4>
        <p className="text-xs text-gray-500 mb-2">{previous}</p>
        {change !== undefined && direction && (
          <span className={`text-sm font-semibold flex items-center gap-1
            ${direction === "up" ? "text-green-600" : "text-red-600"}`}>
            {direction === "up" ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </CardContent>
    </Card>
  );
};
