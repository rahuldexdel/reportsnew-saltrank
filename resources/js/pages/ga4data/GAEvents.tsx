import { useEffect, useMemo, useState } from "react"

const GAEvents = ({ events = [] }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const pageSize = 25

  /* ---------- NORMALIZE + MERGE REPEATED EVENTS ---------- */

  const rows = useMemo(() => {
    const merged = new Map<
      string,
      {
        event_name: string
        event_count: number
        sessions: number
      }
    >()

    events.forEach((row: any) => {
      const eventName = row.dimension_value || "(not set)"
      const eventCount = Number(row.event_count || 0)

      let sessions = 0

      try {
        const extra =
          typeof row.extra === "string"
            ? JSON.parse(row.extra || "{}")
            : row.extra || {}

        sessions = Number(extra.sessions || 0)
      } catch {
        sessions = 0
      }

      const existing = merged.get(eventName)

      if (existing) {
        existing.event_count += eventCount
        existing.sessions += sessions
      } else {
        merged.set(eventName, {
          event_name: eventName,
          event_count: eventCount,
          sessions,
        })
      }
    })

    return Array.from(merged.values()).map((row) => ({
      event_name: row.event_name,
      event_count: row.event_count,
      events_per_session:
        row.sessions > 0
          ? (row.event_count / row.sessions).toFixed(2)
          : "0.00",
    }))
  }, [events])

  /* ---------- SEARCH ---------- */

  const filtered = rows.filter((r: any) =>
    r.event_name.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- SORT ---------- */

  const sorted = [...filtered].sort((a: any, b: any) => {
    return sortOrder === "asc"
      ? a.event_count - b.event_count
      : b.event_count - a.event_count
  })

  /* ---------- PAGINATION ---------- */

  const totalPages = Math.ceil(sorted.length / pageSize)

  useEffect(() => {
    if (totalPages === 0 && page !== 1) {
      setPage(1)
    } else if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const start = (page - 1) * pageSize
  const paginated = sorted.slice(start, start + pageSize)

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center relative">
        <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5 w-full">
          Events Overview
        </h3>

        <span className="text-sm text-gray-500 absolute right-6 mt-3">
          {sorted.length === 0
            ? "0 of 0"
            : `${start + 1} to ${Math.min(
                start + pageSize,
                sorted.length
              )} of ${sorted.length}`}
        </span>
      </div>

      {/* SEARCH */}
      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search event..."
          className="border px-3 py-1 rounded text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* TABLE */}
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Event name</th>

            <th
              className="p-2 text-right cursor-pointer"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              Event count {sortOrder === "desc" ? "↓" : "↑"}
            </th>

            <th className="p-2 text-right">Events per session</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((row: any, i: number) => (
            <tr key={`${row.event_name}-${i}`} className="border-t">
              <td className="p-2 font-medium">{row.event_name}</td>

              <td className="p-2 text-right bg-orange-100">
                {row.event_count.toLocaleString()}
              </td>

              <td className="p-2 text-right">{row.events_per_session}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 text-sm">
          {page > 1 && (
            <button
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1 rounded hover:bg-gray-200"
            >
              Previous
            </button>
          )}

          {[...Array(totalPages)].slice(0, 5).map((_, i) => {
            const p = i + 1

            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1 rounded ${
                  p === page
                    ? "bg-orange-500 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            )
          })}

          {page < totalPages && (
            <button
              onClick={() => handlePageChange(page + 1)}
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

export default GAEvents