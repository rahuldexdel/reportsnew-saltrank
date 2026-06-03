import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { formatDate } from "./utils"

const GATimeSeries = ({ timeseries }: any) => {

  const chartData = Object.values(
    (timeseries || []).reduce((acc: any, d: any) => {

      const date = formatDate(d.metric_date)

      if (!acc[date]) {
        acc[date] = {
          date,
          sessions: 0,
          views: 0,
        }
      }

      acc[date].sessions += Number(d.sessions || 0)
      acc[date].views += Number(d.views || 0)

      return acc

    }, {})
  )

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold">Sessions and Views</h3>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar dataKey="sessions" fill="#f36201" />
            <Line dataKey="views" stroke="#000" strokeWidth={2} />

          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default GATimeSeries