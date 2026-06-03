import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { formatK } from "./utils"
import { useState, useEffect } from "react"

const COLORS = ["#2f3138", "#f5d58c", "#34d399", "#60a5fa"]

const GAChannels = ({ channels }: any) => {
  if (!channels?.length) return null


  /* ---------- AGGREGATE CHANNEL DATA ---------- */

  const aggregatedChannels = Object.values(
    (channels || []).reduce((acc: any, row: any) => {

      const channel = row.dimension_value || "Unassigned"

      if (!acc[channel]) {
        acc[channel] = {
          channel,
          sessions: 0,
          engaged_sessions: 0,
          views: 0,
          users: 0,
        }
      }

      acc[channel].sessions += Number(row.sessions || 0)
      acc[channel].engaged_sessions += Number(row.engaged_sessions || 0)
      acc[channel].views += Number(row.views || 0)
      acc[channel].users += Number(row.users || 0)

      return acc

    }, {})
  )

  aggregatedChannels.sort((a: any, b: any) => b.sessions - a.sessions)

  /* ---------- TOTALS ---------- */

  const totalSessions = aggregatedChannels.reduce(
    (sum: number, r: any) => sum + r.sessions,
    0
  )

  const totalViews = aggregatedChannels.reduce(
    (sum: number, r: any) => sum + r.views,
    0
  )

  /* ---------- PIE DATA ---------- */

  const sessionsByChannel = aggregatedChannels.map((row: any) => ({
    name: row.channel,
    value: row.sessions,
    percent: totalSessions
      ? ((row.sessions / totalSessions) * 100).toFixed(2)
      : "0.00",
  }))

  const viewsByChannel = aggregatedChannels.map((row: any) => ({
    name: row.channel,
    value: row.views,
    percent: totalViews
      ? ((row.views / totalViews) * 100).toFixed(2)
      : "0.00",
  }))

  /* ---------- TABLE DATA ---------- */

  const channelTableRows = aggregatedChannels.map((row: any) => {
    const engagementRate = row.sessions
      ? ((row.engaged_sessions / row.sessions) * 100).toFixed(2)
      : "0.00"

    return {
      session_source: "(not set)",
      channel: row.channel,
      sessions: row.sessions,
      engaged_sessions: row.engaged_sessions,
      views: row.views,
      users: row.users,
      engagement_rate: `${engagementRate}%`,
    }
  })





  const [search, setSearch] = useState(
  sessionStorage.getItem("ga_channel_search") || ""
)
const [page, setPage] = useState(
  Number(sessionStorage.getItem("ga_channel_page")) || 1
)
const [sortField, setSortField] = useState(
  sessionStorage.getItem("ga_channel_sortField") || "sessions"
)
const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
  (sessionStorage.getItem("ga_channel_sortOrder") as any) || "desc"
)

const perPage = 10

// 🔍 FILTER
const filtered = channelTableRows.filter((row: any) =>
  row.channel.toLowerCase().includes(search.toLowerCase())
)

// ✅ SORT
const sorted = [...filtered].sort((a: any, b: any) => {
  let valA = a[sortField]
  let valB = b[sortField]

  if (sortField === "engagement_rate") {
    valA = parseFloat(a.engagement_rate)
    valB = parseFloat(b.engagement_rate)
  }

  return sortOrder === "asc" ? valA - valB : valB - valA
})

// 📄 PAGINATION
const totalPages = Math.ceil(sorted.length / perPage)
const paginated = sorted.slice((page - 1) * perPage, page * perPage)

// 💾 SAVE SESSION
useEffect(() => {
  sessionStorage.setItem("ga_channel_search", search)
  sessionStorage.setItem("ga_channel_page", String(page))
  sessionStorage.setItem("ga_channel_sortField", sortField)
  sessionStorage.setItem("ga_channel_sortOrder", sortOrder)
}, [search, page, sortField, sortOrder])

  /* ---------- RENDER ---------- */

  return (
    <div className="grid grid-cols-2 gap-6">

      {/* USERS BAR CHART */}

      <Card>
        <CardHeader>
          <CardTitle>Total Users by Channel Grouping</CardTitle>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={300}>

            <BarChart
              layout="vertical"
              data={aggregatedChannels}
              margin={{ left: 120 }}
            >

              <XAxis type="number" />

              <YAxis
                type="category"
                dataKey="channel"
              />

              <Tooltip />

              <Bar dataKey="users" fill="#f36201" />

            </BarChart>

          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SESSIONS PIE */}

      <Card>
        <CardHeader>
          <CardTitle>Sessions by Channel Grouping</CardTitle>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={350}>

            <PieChart>

              <Pie
                data={sessionsByChannel}
                dataKey="value"
                nameKey="name"
                innerRadius={90}
                outerRadius={130}
              >

                {sessionsByChannel.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}

              </Pie>

                            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold"
              >
                {formatK(totalSessions)}
              </text>

              <Tooltip
                formatter={(value: number, _: any, item: any) =>
                  `${value.toLocaleString()} (${item.payload.percent}%)`
                }
              />

            </PieChart>

          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* VIEWS PIE */}

      <Card>
        <CardHeader>
          <CardTitle>Views by Channel Grouping</CardTitle>
        </CardHeader>

        <CardContent className="flex justify-center">

          <ResponsiveContainer width="100%" height={350}>

            <PieChart>

              <Pie
                data={viewsByChannel}
                dataKey="value"
                nameKey="name"
                innerRadius={90}
                outerRadius={130}
              >

                {viewsByChannel.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}

              </Pie>

              {/* center label */}

              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold"
              >
                {formatK(totalViews)}
              </text>

              <Tooltip
                formatter={(value: number, _: any, item: any) =>
                  `${value.toLocaleString()} (${item.payload.percent}%)`
                }
              />

            </PieChart>

          </ResponsiveContainer>

        </CardContent>
      </Card>

      {/* TABLE */}

      <div className="flex flex-col gap-4">

  <h1>Default Channel Grouping Overview</h1>

  {/* SEARCH + COUNT */}
  <div className="flex justify-between items-center">
    <p className="text-sm text-gray-500">
      {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of {sorted.length}
    </p>

    <input
      type="text"
      placeholder="Search..."
      className="border px-3 py-1 rounded text-sm"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
        setPage(1)
      }}
    />
  </div>

  <table className="w-full border text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 text-left">Session source</th>
        <th className="p-2 text-left">Channel</th>

        <th
          className="p-2 text-right cursor-pointer"
          onClick={() => {
            setSortField("sessions")
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
          }}
        >
          Sessions {sortField === "sessions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </th>

        <th
          className="p-2 text-right cursor-pointer"
          onClick={() => {
            setSortField("engaged_sessions")
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
          }}
        >
          Engaged {sortField === "engaged_sessions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </th>

        <th
          className="p-2 text-right cursor-pointer"
          onClick={() => {
            setSortField("views")
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
          }}
        >
          Views {sortField === "views" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </th>

        <th
          className="p-2 text-right cursor-pointer"
          onClick={() => {
            setSortField("users")
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
          }}
        >
          Users {sortField === "users" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </th>

        <th
          className="p-2 text-right cursor-pointer"
          onClick={() => {
            setSortField("engagement_rate")
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
          }}
        >
          Engagement {sortField === "engagement_rate" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </th>
      </tr>
    </thead>

    <tbody>
      {paginated.map((row: any, i: number) => (
        <tr key={i} className="border-t">
          <td className="p-2">{row.session_source}</td>
          <td className="p-2 font-medium">{row.channel}</td>
          <td className="p-2 text-right">{row.sessions.toLocaleString()}</td>
          <td className="p-2 text-right">{row.engaged_sessions.toLocaleString()}</td>
          <td className="p-2 text-right">{row.views.toLocaleString()}</td>
          <td className="p-2 text-right">{row.users.toLocaleString()}</td>
          <td className="p-2 text-right">{row.engagement_rate}</td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* PAGINATION */}
  {totalPages > 1 && (
    <div className="flex justify-end gap-2">
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>

      {[...Array(totalPages)].slice(0, 5).map((_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={page === i + 1 ? "bg-orange-500 text-white px-2" : "px-2"}
        >
          {i + 1}
        </button>
      ))}

      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
    </div>
  )}

</div>
    </div>
  )
}

export default GAChannels