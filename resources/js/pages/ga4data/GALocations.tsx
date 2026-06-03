import React, { useEffect, useMemo, useState } from "react"

const formatTime = (seconds: number = 0) => {
  if (!seconds || seconds <= 0) return "00:00:00"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":")
}

const GALocations = ({ locations = [] }: any) => {
  const itemsPerPage = 15

  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  /* ---------- NORMALIZE + MERGE REPEATED LOCATIONS ---------- */

  const rows = useMemo(() => {
    const merged = new Map<
      string,
      {
        country: string
        city: string
        region: string
        sessions: number
        views: number
        users: number
        events: number
        engagement_seconds_total: number
        engagement_rate_total: number
      }
    >()

    locations.forEach((l: any) => {
      const parts = (l.dimension_value || "")
        .split("|")
        .map((v: string) => v || "(not set)")

      const country = parts[0] || "(not set)"
      const city = parts[1] || "(not set)"
      const region = parts[2] || "(not set)"

      const sessions = Number(l.sessions || 0)
      const views = Number(l.views || 0)
      const users = Number(l.users || 0)
      const events = Number(l.event_count || 0)

      const avgEngagementTime = Number(l.avg_engagement_time || 0)
      const engagementRate = Number(l.engagement_rate || 0)

      const key = `${country}__${city}__${region}`

      const existing = merged.get(key)

      if (existing) {
        existing.sessions += sessions
        existing.views += views
        existing.users += users
        existing.events += events

        // weighted by sessions
        existing.engagement_seconds_total += avgEngagementTime * sessions
        existing.engagement_rate_total += engagementRate * sessions
      } else {
        merged.set(key, {
          country,
          city,
          region,
          sessions,
          views,
          users,
          events,
          engagement_seconds_total: avgEngagementTime * sessions,
          engagement_rate_total: engagementRate * sessions,
        })
      }
    })

    return Array.from(merged.values()).map((row) => {
      const avgEngagementTime =
        row.sessions > 0
          ? row.engagement_seconds_total / row.sessions
          : 0

      const engagementRate =
        row.sessions > 0
          ? row.engagement_rate_total / row.sessions
          : 0

      return {
        country: row.country,
        city: row.city,
        region: row.region,
        sessions: row.sessions,
        views: row.views,
        users: row.users,
        engagement_time: formatTime(avgEngagementTime),
        engagement_rate: engagementRate.toFixed(2) + "%",
        events: row.events,
      }
    })
  }, [locations])

  /* ---------- SEARCH ---------- */

  const filtered = rows.filter((r: any) =>
    `${r.country} ${r.city} ${r.region}`
      .toLowerCase()
      .includes(search.toLowerCase())
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800">
          Location Breakdown
        </h3>

        <span className="text-sm text-gray-500">
          {sorted.length === 0
            ? "0 of 0"
            : `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                currentPage * itemsPerPage,
                sorted.length
              )} of ${sorted.length}`}
        </span>
      </div>

      {/* SEARCH */}
      <div className="flex justify-end mb-3">
        <input
          type="text"
          placeholder="Search location..."
          className="border px-3 py-1 rounded text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Country</th>
              <th className="p-2 text-left">City</th>
              <th className="p-2 text-left">Region</th>

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
              <th className="p-2 text-right">Total Users</th>
              <th className="p-2 text-right">Engagement Rate</th>
              <th className="p-2 text-right">Key Events</th>
            </tr>
          </thead>

          <tbody>
            {currentData.map((r: any) => (
              <tr
                key={`${r.country}-${r.city}-${r.region}`}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-2">{r.country}</td>
                <td className="p-2">{r.city}</td>
                <td className="p-2">{r.region}</td>

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
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-6 gap-2 text-sm">
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
    </div>
  )
}

export default GALocations