import dayjs from "dayjs"

interface Props {
  analytics_data: {
    months: string[]
    channels: {
      [channel: string]: {
        sessions: number[]
        views: number[]
        activeUsers: number[]
        screenPageViewsPerUser: number[]
      }
    }
  }
}

const ChannelMonthlyAnalytics = ({ analytics_data }: Props) => {
  if (!analytics_data) return null

  const { months, channels } = analytics_data

  return (
    <div className="space-y-10">
      {Object.entries(channels).map(([channelName, data]) => (
        <div key={channelName} className="bg-white rounded-xl shadow p-4">
          <h3 className="font-bold text-lg mb-3">
            Analytics - Traffic Channel Monthly Performance - {channelName}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border text-left">Metric</th>
                  {months.map((m) => (
                    <th key={m} className="p-2 border text-right">
                      {dayjs(m).format("MMM YYYY")}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Screen Page Views Per User */}
                <tr>
                  <td className="p-2 border font-medium">
                    Screen Page Views Per User
                  </td>
                  {data.screenPageViewsPerUser.map((v, i) => (
                    <td key={i} className="p-2 border text-right">
                      {v.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Views */}
                <tr>
                  <td className="p-2 border font-medium">Views</td>
                  {data.views.map((v, i) => (
                    <td key={i} className="p-2 border text-right">
                      {v.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Sessions */}
                <tr>
                  <td className="p-2 border font-medium">Sessions</td>
                  {data.sessions.map((v, i) => (
                    <td key={i} className="p-2 border text-right">
                      {v.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Active Users */}
                <tr>
                  <td className="p-2 border font-medium">Active Users</td>
                  {data.activeUsers.map((v, i) => (
                    <td key={i} className="p-2 border text-right">
                      {v.toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChannelMonthlyAnalytics

