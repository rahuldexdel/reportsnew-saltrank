import { Card, CardContent } from "@/components/ui/card"

const formatNumber = (num: number) =>
  num ? num.toLocaleString() : "0"

const formatCurrency = (num: number) =>
  num ? `$${num.toFixed(2)}` : "$0"

const formatPercent = (num: number) =>
  num ? `${num.toFixed(2)}%` : "0%"

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

const AdsOverview = ({ overview }: any) => {
  if (!overview?.overview) return null

  const data = overview.overview

  return (
    <>
      <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
        Key Performance Indicators
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative p-12 shadow-2xl my-12 rounded-2xl">

        <StatCard
          title="Impressions"
          value={data.impressions?.toLocaleString()}
          change={data.impressions_change}
          prev={data.impressions_prev?.toLocaleString()}
        />

        <StatCard
          title="Clicks"
          value={data.clicks?.toLocaleString()}
          change={data.clicks_change}
          prev={data.clicks_prev?.toLocaleString()}
        />

        <StatCard
          title="CTR"
          value={`${data.ctr}%`}
          change={data.ctr_change}
          prev={`${data.ctr_prev}%`}
        />

        <StatCard
          title="Avg CPC"
          value={`$${data.cpc}`}
          change={data.cpc_change}
          prev={`$${data.cpc_prev}`}
        />

      </div>
    </>
  )
}

export default AdsOverview