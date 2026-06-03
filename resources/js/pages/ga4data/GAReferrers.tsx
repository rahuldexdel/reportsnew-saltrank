import { useMemo, useState } from "react"

const GAReferrers = ({ referrers = [] }: any) => {

  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // ✅ Sorting
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  /* ---------- NORMALIZE DATA ---------- */

  const rows = useMemo(() => {
    return referrers.map((r: any) => {

      const channel =
        typeof r.extra === "string"
          ? JSON.parse(r.extra)?.channel ?? "Referral"
          : r.extra?.channel ?? "Referral"

      return {
        sessions: Number(r.sessions || 0),
        new_users: Number(r.event_count || 0),
        users: Number(r.users || 0),
        referrer: r.dimension_value || "(not set)",
        channel,
      }

    })
  }, [referrers])

  /* ---------- SEARCH ---------- */

  const filtered = rows.filter((r: any) =>
    `${r.referrer} ${r.channel}`.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- SORT ---------- */

  const sorted = [...filtered].sort((a: any, b: any) => {
    return sortOrder === "asc"
      ? a.sessions - b.sessions
      : b.sessions - a.sessions
  })

  /* ---------- PAGINATION ---------- */

  const itemsPerPage = 15
  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  const start = (currentPage - 1) * itemsPerPage
  const currentData = sorted.slice(start, start + itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <h3 className="font-bold text-2xl">
          Top Referring Sources (Google Excluded)
        </h3>

        <span className="text-sm text-gray-500">
          {sorted.length === 0
            ? "0 of 0"
            : `${start + 1} to ${Math.min(start + itemsPerPage, sorted.length)} of ${sorted.length}`}
        </span>

      </div>

      {/* SEARCH */}
      <div className="flex justify-end mb-3">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-1 rounded text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm border">

          <thead className="bg-gray-100">
            <tr>

              {/* ✅ SORTABLE SESSIONS */}
              <th
                className="p-2 text-right cursor-pointer"
                onClick={() =>
                  setSortOrder(prev => prev === "asc" ? "desc" : "asc")
                }
              >
                Sessions {sortOrder === "desc" ? "↓" : "↑"}
              </th>

              <th className="p-2 text-right">New users</th>
              <th className="p-2 text-right">Total users</th>
              <th className="p-2 text-left">Page Referrer</th>
              <th className="p-2 text-left">Channel</th>
            </tr>
          </thead>

          <tbody>

            {currentData.map((r: any, i: number) => (

              <tr key={i} className="border-t">

                <td className="p-2 text-right font-semibold bg-orange-100">
                  {r.sessions.toLocaleString()}
                </td>

                <td className="p-2 text-right">
                  {r.new_users.toLocaleString()}
                </td>

                <td className="p-2 text-right">
                  {r.users.toLocaleString()}
                </td>

                <td className="p-2 text-left text-orange-600 break-all">
                  {r.referrer}
                </td>

                <td className="p-2 text-left">
                  {r.channel}
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

    </>
  )
}

export default GAReferrers