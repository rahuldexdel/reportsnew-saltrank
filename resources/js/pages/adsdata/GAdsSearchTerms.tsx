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

  if (!searchTerms.length) return <div>No Data</div>

  const perPage = 150

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

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* Header */}
      <h3 className="font-bold text-2xl text-center bg-black text-white py-3">
        Search Queries
      </h3>

      {/* Search */}
      <div className="flex justify-between items-center p-4">
        <p className="text-sm text-gray-500">
          1 to {paginated.length} of {sorted.length}
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

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 text-left">Search Term</th>

              {/* Impressions sort */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortField === "impressions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Clicks sort */}
              <th
                className="p-2 text-orange-600 cursor-pointer"
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Clicks {sortField === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              <th className="p-2">Interactions</th>

              {/* Cost sort */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("cost")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Cost {sortField === "cost" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* CPC sort */}
              <th
                className="p-2 cursor-pointer"
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
                  <td className="p-2">{s.search_term}</td>

                  <td className="p-2">
                    {formatNumber(s.impressions)}
                  </td>

                  <td
                    className="p-2 text-white font-semibold text-center"
                    style={{ backgroundColor: getHeatColor(s.clicks, maxClicks) }}
                  >
                    {formatNumber(s.clicks)}
                  </td>

                  <td className="p-2">
                    {formatNumber(interactions)}
                  </td>

                  {/* <td className="p-2">
                    {formatCurrency(s.cost)}
                  </td>

                  <td className="p-2">
                    {formatCurrency(cpc)}
                  </td> */}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 p-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1 ? "bg-orange-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

    </div>
  )
}

export default GAdsSearchTerms