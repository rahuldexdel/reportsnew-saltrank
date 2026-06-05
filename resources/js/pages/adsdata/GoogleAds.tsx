


import AdsOverview from "./AdsOverview"
import GAdsTimeSeries from "./GAdsTimeSeries"
import GAdsCampaigns from "./GAdsCampaigns"
import GAdsKeywords from "./GAdsKeywords"
import GAdsSearchTerms from "./GAdsSearchTerms"
import GAdsAds from "./GAdsAds"
//import GAdsDevices from "./GAdsDevices"
import GAdsLocations from "./GAdsLocations"
import GAdsDemographics from "./GAdsDemographics"
import GAdsCalls from "./GAdsCalls"
import GAdsFunnel from "./GAdsFunnel"
import NetworkPerformance from "./NetworkPerformance"


const GoogleAds = ({ data }: any) => {
  if (!data) return null

console.log('data.demographics',data.calls);



  return (
    <div className="space-y-10">
      <AdsOverview overview={data.overview || {}} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GAdsTimeSeries timeseries={data.timeseries || []} />
        <GAdsFunnel overview={data.overview || {}} />
      </div>
      <GAdsCalls calls={data.calls || []} />
      <GAdsCampaigns campaigns={data.campaigns || []} />
       <NetworkPerformance networkPerformance={data.networkPerformance || []} />
      
      <GAdsKeywords keywords={data.keywords || []} />
      <GAdsSearchTerms searchTerms={data.searchTerms || []} />
      <GAdsAds data={data} />
      <GAdsDemographics demographics={data.demographics || []} />
      <GAdsLocations locations={data.locations || []} />
    </div>
  )
}

export default GoogleAds