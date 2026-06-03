import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type OverviewProps = {
  overviewData: any
  range: string
  filterKey: string
}

type ChangeResult = {
  percent: number
  up: boolean
}

const calcChange = (current = 0, previous = 0): ChangeResult => {
  if (!previous || previous === 0) {
    return { percent: 0, up: true }
  }

  const diff = ((current - previous) / previous) * 100
  return {
    percent: Math.abs(Number(diff.toFixed(1))),
    up: diff >= 0,
  }
}

const normalizeRangeKey = (range: string) => {
  if (!range) return "7";
  if (range.includes(":")) return "7"; // date range
  return range; // "7", "30"
};


const formatNumber = (value?: number) =>
  value?.toLocaleString() ?? "0"

const OverviewSaltData = ({ overviewData, range, filterKey }: OverviewProps) => {
const safeRange = normalizeRangeKey(range);
const safeFilterKey = filterKey || "default";
const data = overviewData?.[safeRange]?.[safeFilterKey];

// console.log('range',safeRange);
// console.log('filterKey',filterKey);
// console.log('overviewData',overviewData);


  if (!data) {
    return <p>No overview data available.</p>
  }

  const { totals, callrail, dataSources, platformPerformance } = data



  
const callrailByDate = new Map(
  (callrail?.timeseries?.current?.data || []).map((row: any) => [
    row.date,
    row.total_calls ?? 0,
  ])
);


const simplifiSeries = Object.entries(
  data?.simplifi?.current || {}
).map(([date, row]: any) => ({
  date,
  impressions: row.impressions ?? 0,
  spend: row.spend ?? 0,
}));


const sortedSimplifi = [...simplifiSeries].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);


const fillDates = (
  series: any[],
  start: string,
  end: string
) => {
  const map = new Map(series.map(s => [s.date, s]));
  const result = [];

  for (
    let d = new Date(start);
    d <= new Date(end);
    d.setDate(d.getDate() + 1)
  ) {
    const key = d.toISOString().slice(0, 10);

    result.push({
      date: key,
      impressions: map.get(key)?.impressions ?? 0,
      spend: map.get(key)?.spend ?? 0,
      calls: callrailByDate.get(key) ?? 0,
    });
  }

  return result;
};

const finalSeries = fillDates(
  sortedSimplifi,
  data.range.currentStart,
  data.range.currentEnd
);




  const currentTotals = totals?.current || {}
  const previousTotals = totals?.previous || {}

  const currentCalls = callrail?.timeseries?.current?.total_results || {}
  const previousCalls = callrail?.timeseries?.previous?.total_results || {}

  const impressionsChange = calcChange(
    currentTotals.impressions,
    previousTotals.impressions
  )

  const walkinsChange = calcChange(
    currentTotals.walkIns,
    previousTotals.walkIns
  )

  const callsChange = calcChange(
    currentCalls.total_calls,
    previousCalls.total_calls
  )

  const firstTimeChange = calcChange(
    currentCalls.first_time_callers,
    previousCalls.first_time_callers
  )

  const uniqueCallsChange = calcChange(
    currentCalls.answered_calls,
    previousCalls.answered_calls
  )

  const qualifiedCallsChange = calcChange(
    currentCalls.leads,
    previousCalls.leads
  )

  return (
  <div className="space-y-10">

    {/* Header */}
    <h3 className="font-bold text-4xl text-center bg-black text-white py-3 rounded-md">
      Key Performance Indicators working
    </h3>

    {/* KPI Container */}
    <div className="bg-white shadow-2xl rounded-2xl p-10 space-y-10">

      {/* TOP ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Impressions"
          current={formatNumber(currentTotals.impressions)}
          previous={formatNumber(previousTotals.impressions)}
          change={impressionsChange}
        />

        <KpiCard
          title="Walk-Ins"
          current={formatNumber(currentTotals.walkIns)}
          previous={formatNumber(previousTotals.walkIns)}
          change={walkinsChange}
        />

        <KpiCard
          title="Total Calls"
          current={formatNumber(currentCalls.total_calls)}
          previous={formatNumber(previousCalls.total_calls)}
          change={callsChange}
        />

        <KpiCard
          title="First Time Callers"
          current={formatNumber(currentCalls.first_time_callers)}
          previous={formatNumber(previousCalls.first_time_callers)}
          change={firstTimeChange}
        />
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <KpiCard
          title="Unique Calls"
          current={formatNumber(currentCalls.answered_calls)}
          previous={formatNumber(previousCalls.answered_calls)}
          change={uniqueCallsChange}
        />

        <KpiCard
          title="Qualified Calls"
          current={formatNumber(currentCalls.leads)}
          previous={formatNumber(previousCalls.leads)}
          change={qualifiedCallsChange}
        />
      </div>

    </div>



    <h3 className="font-bold text-4xl text-center bg-black text-white py-3 rounded-md">
      Platform Performance
    </h3>


<ResponsiveContainer width="100%" height={350}>
  <ComposedChart data={finalSeries}>
    <XAxis
      dataKey="date"
      tickFormatter={(d) =>
        new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      }
    />

    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />

    <Tooltip
      labelFormatter={(d) =>
        new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
      formatter={(value: any, name: string) => {
        if (name === "spend") return [`$${value.toFixed(2)}`, "Spend"];
        return [value.toLocaleString(), name === "calls" ? "Calls" : name];
      }}
    />

    {/* Impressions */}
    <Bar
      yAxisId="left"
      dataKey="impressions"
      fill="#f97316"
      name="Total Impressions"
    />

    {/* Calls (NEW) */}
    <Bar
      yAxisId="left"
      dataKey="calls"
      fill="#111827"
      name="Calls"
    />

    {/* Spend */}
    <Line
      yAxisId="right"
      dataKey="spend"
      stroke="#9ca3af"
      strokeWidth={3}
      name="Spend"
    />
  </ComposedChart>
</ResponsiveContainer>

<div className="bg-white shadow-xl rounded-xl overflow-hidden">
  <table className="w-full border-collapse">
    <thead className="bg-gray-100">
      <tr>
        <th className="text-left p-4">Data Source Name</th>
        <th className="text-right p-4">Total Impressions</th>
        <th className="text-right p-4">Conversions</th>
        <th className="text-right p-4">Calls</th>
        <th className="text-right p-4">Spend</th>
      </tr>
    </thead>

    <tbody>
      {Object.values(platformPerformance || {}).map((row: any, i) => (
        <tr key={i} className="border-t">
          <td className="p-4 font-medium">{row.name}</td>
          <td className="p-4 text-right">
            {formatNumber(row.impressions)}
          </td>
          <td className="p-4 text-right">
            {formatNumber(row.conversions)}
          </td>
          <td className="p-4 text-right">
            {formatNumber(row.calls)}
          </td>
          <td className="p-4 text-right">
            {/* ${row.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })} */}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



  </div>
)

}

export default OverviewSaltData

/* ------------------ KPI CARD ------------------ */

type KpiCardProps = {
  title: string
  current: string
  previous: string
  change: ChangeResult
}

const KpiCard = ({ title, current, previous, change }: KpiCardProps) => {
  return (
    <Card className="bg-orange-100 border-none rounded-lg">
      <CardContent className="p-6 text-center space-y-1">
        <p className="text-sm text-gray-700 font-medium">{title}</p>

        <p className="text-4xl font-bold">{current}</p>

        <div className="flex justify-center items-center gap-2 text-sm">
          <span
            className={`font-semibold ${
              change.up ? "text-green-600" : "text-red-600"
            }`}
          >
            {change.up ? "▲" : "▼"} {change.percent}%
          </span>
          <span className="text-gray-500">
            vs {previous} prev.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
