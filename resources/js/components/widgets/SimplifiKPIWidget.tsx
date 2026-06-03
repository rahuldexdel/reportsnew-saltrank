// SimplifiKPIWidget.tsx
import StatCard from "./StatCard"

type Props = {
  simplifi_data: any
  getChangePercentage: any
  formatCompact: any
}

export default function SimplifiKPIWidget({
  simplifi_data,
  getChangePercentage,
  formatCompact
}: Props) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <StatCard
        title="Impressions"
        current={(simplifi_data?.totals?.current?.impressions || 0).toLocaleString()}
        percentage={getChangePercentage(
          simplifi_data?.totals?.current?.impressions || 0,
          simplifi_data?.totals?.previous?.impressions || 0
        )}
        previous={`vs ${formatCompact(
          simplifi_data?.totals?.previous?.impressions || 0
        )} prev.`}
      />

      <StatCard
        title="Clicks"
        current={(simplifi_data?.totals?.current?.clicks || 0).toLocaleString()}
        percentage={getChangePercentage(
          simplifi_data?.totals?.current?.clicks || 0,
          simplifi_data?.totals?.previous?.clicks || 0
        )}
        previous={`vs ${formatCompact(
          simplifi_data?.totals?.previous?.clicks || 0
        )} prev.`}
      />

      <StatCard
        title="CTR"
        current={`${((simplifi_data?.totals?.current?.ctr || 0) * 100).toFixed(2)}%`}
        percentage={getChangePercentage(
          simplifi_data?.totals?.current?.ctr || 0,
          simplifi_data?.totals?.previous?.ctr || 0
        )}
        previous={`vs ${((simplifi_data?.totals?.previous?.ctr || 0) * 100).toFixed(2)}% prev.`}
      />

      <StatCard
        title="Walk-Ins"
        current={(simplifi_data?.totals?.current?.walkIns || 0).toLocaleString()}
        percentage={getChangePercentage(
          simplifi_data?.totals?.current?.walkIns || 0,
          simplifi_data?.totals?.previous?.walkIns || 0
        )}
        previous={`vs ${formatCompact(
          simplifi_data?.totals?.previous?.walkIns || 0
        )} prev.`}
      />

    </div>
  )
}