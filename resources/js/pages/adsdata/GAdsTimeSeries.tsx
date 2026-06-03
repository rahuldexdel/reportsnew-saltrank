import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

const formatNumber = (n: number) => n?.toLocaleString() || "0"

const GAdsTimeSeries = ({ timeseries = [] }: any) => {
  if (!timeseries.length) return  <div>No Data</div>; 

 // console.log('timeseries',timeseries);

  // 🔥 GROUP BY DATE
  const grouped: any = {}

  timeseries.forEach((t: any) => {
    const date = new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    if (!grouped[date]) {
      grouped[date] = {
        date,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      }
    }

    grouped[date].impressions += Number(t.impressions || 0)
    grouped[date].clicks += Number(t.clicks || 0)
    grouped[date].conversions += Number(t.conversions || 0)
  })

  // ✅ FINAL ARRAY
  const data = Object.values(grouped)

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">
        Performance Trends over time
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />

          <Tooltip />

          {/* ORANGE = impressions */}
          <Bar
            yAxisId="left"
            dataKey="impressions"
            fill="#ea580c"
            radius={[6, 6, 0, 0]}
          />

          {/* BLACK = clicks */}
          <Bar
            yAxisId="left"
            dataKey="clicks"
            fill="#1f2937"
            radius={[6, 6, 0, 0]}
          />

          {/* LINE = conversions */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversions"
            stroke="#9ca3af"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GAdsTimeSeries