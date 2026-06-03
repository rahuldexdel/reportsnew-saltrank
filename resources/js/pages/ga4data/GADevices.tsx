import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

const formatTime = (seconds: number = 0) => {
  if (!seconds || seconds <= 0) return "00:00:00"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":")
}

const GADevices = ({ devices = [] }: any) => {
  const itemsPerPage = 10

  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  /* ---------- NORMALIZE + MERGE REPEATED DEVICES ---------- */

  const rows = useMemo(() => {
    const merged = new Map<
      string,
      {
        device: string
        model: string
        sessions: number
        views: number
        users: number
        total_engagement_time: number
        events: number
      }
    >()

    devices.forEach((row: any) => {
      const extra =
        typeof row.extra === "string"
          ? JSON.parse(row.extra || "{}")
          : row.extra || {}

      const device = row.dimension_value || "(not set)"
      const model = extra?.device_model || "(not set)"

      const sessions = Number(row.sessions) || 0
      const views = Number(row.views) || 0
      const users = Number(row.users) || 0
      const engagementTime = Number(row.avg_engagement_time) || 0
      const events = Number(row.event_count) || 0

      // Merge by device + model
      const key = `${device}__${model}`

      const existing = merged.get(key)

      if (existing) {
        existing.sessions += sessions
        existing.views += views
        existing.users += users
        existing.total_engagement_time += engagementTime
        existing.events += events
      } else {
        merged.set(key, {
          device,
          model,
          sessions,
          views,
          users,
          total_engagement_time: engagementTime,
          events,
        })
      }
    })

    return Array.from(merged.values()).map((row) => {
      const engagementRate =
        row.sessions > 0
          ? ((row.events / row.sessions) * 100).toFixed(2)
          : "0.00"

      return {
        device: row.device,
        model: row.model,
        sessions: row.sessions,
        views: row.views,
        users: row.users,
        engagement_time: formatTime(row.total_engagement_time),
        engagement_rate: `${engagementRate}%`,
        events: row.events,
      }
    })
  }, [devices])

  /* ---------- CHART DATA MERGED BY DEVICE ---------- */

  const sessionsByDevice = useMemo(() => {
    const merged = new Map<string, { name: string; sessions: number }>()

    rows.forEach((row: any) => {
      const existing = merged.get(row.device)

      if (existing) {
        existing.sessions += row.sessions
      } else {
        merged.set(row.device, {
          name: row.device,
          sessions: row.sessions,
        })
      }
    })

    return Array.from(merged.values())
  }, [rows])

  /* ---------- SEARCH ---------- */

  const filtered = rows.filter((r: any) =>
    `${r.device} ${r.model}`.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- SORT BY SESSIONS ---------- */

  const sorted = [...filtered].sort((a: any, b: any) => {
    return sortOrder === "asc"
      ? a.sessions - b.sessions
      : b.sessions - a.sessions
  })

  /* ---------- PAGINATION ---------- */

  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1)
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const currentData = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (!devices.length) return null

  return (
    <>
      <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
        Device Breakdown
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions by Device</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByDevice} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="sessions" fill="#f36201" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RIGHT TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Device Performance</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* SEARCH */}
            <div className="flex justify-end p-3">
              <input
                type="text"
                placeholder="Search device..."
                className="border px-3 py-1 rounded text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Device</th>
                  <th className="p-2 text-left">Model</th>

                  <th
                    className="p-2 text-right cursor-pointer"
                    onClick={() =>
                      setSortOrder((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      )
                    }
                  >
                    Sessions {sortOrder === "desc" ? "↓" : "↑"}
                  </th>

                  <th className="p-2 text-right">Views</th>
                  <th className="p-2 text-right">User Engagement</th>
                  <th className="p-2 text-right">Users</th>
                  <th className="p-2 text-right">Engagement rate</th>
                  <th className="p-2 text-right">Key Events</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((r: any) => (
                  <tr key={`${r.device}-${r.model}`} className="border-t">
                    <td className="p-2">{r.device}</td>
                    <td className="p-2">{r.model}</td>

                    <td className="p-2 text-right bg-orange-100 font-semibold">
                      {r.sessions.toLocaleString()}
                    </td>

                    <td className="p-2 text-right">
                      {r.views.toLocaleString()}
                    </td>

                    <td className="p-2 text-right">
                      {r.engagement_time}
                    </td>

                    <td className="p-2 text-right">
                      {r.users.toLocaleString()}
                    </td>

                    <td className="p-2 text-right">
                      {r.engagement_rate}
                    </td>

                    <td className="p-2 text-right">
                      {r.events.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center mt-4 gap-2 p-4 text-sm">
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-1 rounded hover:bg-gray-200"
                  >
                    Previous
                  </button>
                )}

                {[...Array(totalPages)].slice(0, 5).map((_, i) => {
                  const page = i + 1

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${
                        page === currentPage
                          ? "bg-orange-500 text-white"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}

                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-1 rounded hover:bg-gray-200"
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default GADevices