import { useState } from "react"

const formatNumber = (n: number) => n?.toLocaleString() || "0"
const formatCurrency = (n: number) => `$${n?.toFixed(2) || "0.00"}`

// 🔥 heat color
const getHeatColor = (value: number, max: number) => {
  const intensity = max ? value / max : 0
  return `rgba(234, 88, 12, ${0.3 + intensity * 0.7})`
}

const GAdsSearchTerms = ({ searchTerms = [] }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // ✅ Sorting state
  const [sortField, setSortField] = useState("clicks")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (!searchTerms.length) return <div className="p-4 text-center text-gray-500">No Data</div>

  // 🔽 Updated to display 10 items per page
  const perPage = 10

  // 🔍 Filter
  const filtered = searchTerms.filter((s: any) =>
    s.search_term?.toLowerCase().includes(search.toLowerCase())
  )

  // ✅ Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    let valA = 0
    let valB = 0

    if (sortField === "cpc") {
      valA = a.clicks > 0 ? a.cost / a.clicks : 0
      valB = b.clicks > 0 ? b.cost / b.clicks : 0
    } else {
      valA = a[sortField] || 0
      valB = b[sortField] || 0
    }

    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // 📄 Pagination AFTER SORT
  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  // 🔥 Heatmap max (based on sorted)
  const maxClicks = Math.max(...sorted.map((s: any) => s.clicks || 0))

  // 🧮 Logic to get condensed sliding window page numbers
  const getVisiblePages = () => {
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return { pages, start, end }
  }

  const { pages: visiblePages, start: pageStart, end: pageEnd } = getVisiblePages()

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* Header */}
      <h3 className="font-bold text-2xl text-center bg-black text-white py-3">
        Search Queries
      </h3>

      {/* Search */}
      <div className="flex justify-between items-center p-4">
        <p className="text-sm text-gray-500">
          {sorted.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, sorted.length)} of {sorted.length}
        </p>

        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 text-left">Search Term</th>

              <th
                className="p-2 cursor-pointer select-none text-center"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortField === "impressions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              <th
                className="p-2 text-orange-600 cursor-pointer select-none text-center"
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Clicks {sortField === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              <th className="p-2 text-center">Interactions</th>

              <th
                className="p-2 cursor-pointer select-none text-center"
                onClick={() => {
                  setSortField("cost")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Cost {sortField === "cost" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              <th
                className="p-2 cursor-pointer select-none text-center"
                onClick={() => {
                  setSortField("cpc")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Avg CPC {sortField === "cpc" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((s: any, i: number) => {
              const interactions = s.clicks
              const cpc = s.clicks > 0 ? s.cost / s.clicks : 0

              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-700">{s.search_term}</td>

                  <td className="p-2 text-center">
                    {formatNumber(s.impressions)}
                  </td>

                  <td
                    className="p-2 text-white font-semibold text-center transition-colors"
                    style={{ backgroundColor: getHeatColor(s.clicks, maxClicks) }}
                  >
                    {formatNumber(s.clicks)}
                  </td>

                  <td className="p-2 text-center">
                    {formatNumber(interactions)}
                  </td>

                  <td className="p-2 text-center">
                    {formatCurrency(s.cost)}
                  </td>

                  <td className="p-2 text-center">
                    {formatCurrency(cpc)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Optimized & Compact Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-1 p-4 bg-gray-50 border-t select-none">
          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            « First
          </button>
          
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            Prev
          </button>

          {/* Optional: Indicator for hidden trailing items on left side */}
          {pageStart > 1 && <span className="px-1 text-xs text-gray-400">...</span>}

          {visiblePages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-3 py-1 text-xs font-medium border rounded transition-all ${
                page === pageNum 
                  ? "bg-orange-500 border-orange-500 text-white shadow-sm" 
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Optional: Indicator for hidden trailing items on right side */}
          {pageEnd < totalPages && <span className="px-1 text-xs text-gray-400">...</span>}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            Next
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            Last »
          </button>
        </div>
      )}

    </div>
  )
}

export default GAdsSearchTerms