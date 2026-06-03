import GAOverview from "./GAOverview"
import GATimeSeries from "./GATimeSeries"
import GAChannels from "./GAChannels"
import GAEvents from "./GAEvents"
import GAPages from "./GAPages"
import GALocations from "./GALocations"
import GAPagesPerformance from "./GAPagesPerformance"
import GADevices from "./GADevices"
import GAReferrers from "./GAReferrers"
import MonthlyAnalytics from "./MonthlyAnalytics"
import ChannelMonthlyAnalytics from "./ChannelMonthlyAnalytics"


const GoogleAnalytics = ({ data }: any) => {
  if (!data) return null

  return (
    <div className="space-y-10">
      <GAOverview overview={data.overview} />
      <GATimeSeries timeseries={data.timeseries} />
      <GAChannels channels={data.channels} overview={data.overview} />
      <GAReferrers referrers={data.referrer} />
      <GAEvents events={data.events} overview={data.overview}/>
      <GAPages pages={data.pages} overview={data.overview} />
      <GAPagesPerformance pages={data.pages} />
      <GADevices devices={data.devices} />
      <GALocations locations={data.locations} />
      <MonthlyAnalytics monthlyAnalytics={data.monthlyAnalytics} />
      <ChannelMonthlyAnalytics
          analytics_data={data.channelMonthlyAnalytics}
        />
    </div>
  )
}

export default GoogleAnalytics
