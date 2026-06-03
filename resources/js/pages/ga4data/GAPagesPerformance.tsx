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

/** Returns an array of page numbers and "..." ellipsis strings */
const getPaginationRange = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | "...")[] => {
  // Always show: first, last, current ± siblings, and ellipsis between gaps
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const totalPageNumbers = siblingCount * 2 + 5 // siblings + current + 2 ends + 2 ellipsis slots

  // If total pages fit without ellipsis, show all
  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    // Near the start
    const leftRange = range(1, 3 + siblingCount * 2)
    return [...leftRange, "...", totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Near the end
    const rightRange = range(totalPages - (2 + siblingCount * 2), totalPages)
    return [1, "...", ...rightRange]
  }

  // Both ellipses
  const middleRange = range(leftSiblingIndex, rightSiblingIndex)
  return [1, "...", ...middleRange, "...", totalPages]
}

const GAPagesPerformance = ({ pages = [] }: any) => {
  const itemsPerPage = 10

  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  /* ---------- NORMALIZE + MERGE REPEATED PAGES ---------- */

  const rows = useMemo(() => {
    const merged = new Map<
      string,
      {
        path: string
        title: string
        views: number
        sessions: number
        users: number
        engaged_sessions: number
        total_engagement_seconds: number
      }
    >()

    pages.forEach((p: any) => {
      const path = p.dimension_value ?? "(not set)"
      const title = p.page_title ?? "(not set)"

      const views = Number(p.views) || 0
      const sessions = Number(p.sessions) || 0
      const users = Number(p.users) || 0
      const engagedSessions = Number(p.engaged_sessions) || 0
      const totalEngagementSeconds = Number(p.avg_engagement_time) || 0

      const existing = merged.get(path)

      if (existing) {
        existing.views += views
        existing.sessions += sessions
        existing.users += users
        existing.engaged_sessions += engagedSessions
        existing.total_engagement_seconds += totalEngagementSeconds

        if (existing.title === "(not set)" && title !== "(not set)") {
          existing.title = title
        }
      } else {
        merged.set(path, {
          path,
          title,
          views,
          sessions,
          users,
          engaged_sessions: engagedSessions,
          total_engagement_seconds: totalEngagementSeconds,
        })
      }
    })

    return Array.from(merged.values()).map((row) => {
      const viewsPerSession =
        row.sessions > 0 ? (row.views / row.sessions).toFixed(2) : "0.00"

      const viewsPerUser =
        row.users > 0 ? (row.views / row.users).toFixed(2) : "0.00"

      const engagementRate =
        row.sessions > 0
          ? ((row.engaged_sessions / row.sessions) * 100).toFixed(2)
          : "0.00"

      const avgEngagementTime =
        row.sessions > 0
          ? row.total_engagement_seconds / row.sessions
          : 0

      return {
        path: row.path,
        title: row.title,

        views: row.views,
        views_per_session: viewsPerSession,
        views_per_user: viewsPerUser,

        sessions: row.sessions,
        users: row.users,

        engagement_time: formatTime(avgEngagementTime),
        engagement_rate: `${engagementRate}%`,
      }
    })
  }, [pages])

  /* ---------- SEARCH ---------- */

  const filtered = rows.filter((r: any) =>
    `${r.path} ${r.title}`.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- SORT BY VIEWS ---------- */

  const sorted = [...filtered].sort((a: any, b: any) => {
    return sortOrder === "asc"
      ? a.views - b.views
      : b.views - a.views
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

  const paginationRange = getPaginationRange(currentPage, totalPages)

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-2xl">
          Overall Page Performance
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
          placeholder="Search pages..."
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
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Page path</th>
              <th className="p-2 text-left">Page title</th>

              <th
                className="p-2 text-right cursor-pointer select-none"
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              >
                Views {sortOrder === "desc" ? "↓" : "↑"}
              </th>

              <th className="p-2 text-right">Views / Session</th>
              <th className="p-2 text-right">Views / User</th>
              <th className="p-2 text-right">Sessions</th>
              <th className="p-2 text-right">User Engagement</th>
              <th className="p-2 text-right">Total users</th>
              <th className="p-2 text-right">Engagement rate</th>
            </tr>
          </thead>

          <tbody>
            {currentData.map((r: any) => (
              <tr key={r.path} className="border-t">
                <td className="p-2">{r.path}</td>
                <td className="p-2">{r.title}</td>

                <td className="p-2 text-right bg-orange-100 font-semibold">
                  {r.views.toLocaleString()}
                </td>

                <td className="p-2 text-right">{r.views_per_session}</td>
                <td className="p-2 text-right">{r.views_per_user}</td>
                <td className="p-2 text-right">
                  {r.sessions.toLocaleString()}
                </td>
                <td className="p-2 text-right">{r.engagement_time}</td>
                <td className="p-2 text-right">
                  {r.users.toLocaleString()}
                </td>
                <td className="p-2 text-right">{r.engagement_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-6 gap-1 text-sm">
          {/* First page */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200"
            title="First page"
          >
            «
          </button>

          {/* Previous page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Previous
          </button>

          {/* Page number buttons with ellipsis */}
          {paginationRange.map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-gray-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-1 rounded ${
                  page === currentPage
                    ? "bg-orange-500 text-white font-semibold"
                    : "hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Next
          </button>

          {/* Last page */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200"
            title="Last page"
          >
            »
          </button>
        </div>
      )}
    </>
  )
}

export default GAPagesPerformance
