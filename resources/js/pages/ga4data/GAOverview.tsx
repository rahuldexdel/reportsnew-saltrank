import { Card, CardContent } from "@/components/ui/card"
import { formatPercent } from "./utils"

const StatCard = ({ title, value, change, prev }: any) => (
  <Card className="bg-orange-100">
    <CardContent className="text-center py-6">
      <p className="text-sm text-gray-600">{title}</p>

      <h4 className="text-3xl font-bold">{value}</h4>

      <p className="text-sm mt-2">
        <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
          {change}% {change >= 0 ? "▲" : "▼"}
        </span>
        <span className="text-gray-500 ml-2">
          vs {prev}
        </span>
      </p>
    </CardContent>
  </Card>
)

const GAOverview = ({ overview }: any) => {
  if (!overview?.overview) return null

  const data = overview.overview

  return (
    <>
      <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
        Acquisition Overview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Sessions"
          value={data.sessions?.toLocaleString()}
          change={data.sessions_change}
          prev={data.sessions_prev?.toLocaleString()}
        />

        <StatCard
          title="Engaged Sessions"
          value={data.engaged_sessions?.toLocaleString()}
          change={data.engaged_sessions_change}
          prev={data.engaged_sessions_prev?.toLocaleString()}
        />

        <StatCard
          title="Views"
          value={data.views?.toLocaleString()}
          change={data.views_change}
          prev={data.views_prev?.toLocaleString()}
        />

        <StatCard
          title="Users"
          value={data.users?.toLocaleString()}
          change={data.users_change}
          prev={data.users_prev?.toLocaleString()}
        />

        <StatCard
          title="Engagement Rate"
          value={formatPercent(data.engagement_rate)}
          change={data.engagement_rate_change}
          prev={formatPercent(data.engagement_rate_prev)}
        />
      </div>
    </>
  )
}

export default GAOverview