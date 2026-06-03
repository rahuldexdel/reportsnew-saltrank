import { useState } from "react"

const formatNumber = (n: number) => n?.toLocaleString() || "0"
const formatCurrency = (n: number) => `$${n?.toFixed(2) || "0.00"}`
const formatPercent = (n: number) => `${n?.toFixed(2) || "0"}%`

// 🔥 Heatmap color
const getHeatColor = (value: number, max: number) => {
  const intensity = max ? value / max : 0
  return `rgba(234, 88, 12, ${0.3 + intensity * 0.7})`
}

const GAdsKeywords = ({ keywords = [] }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // ✅ Sorting state
  const [sortField, setSortField] = useState("impressions")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (!keywords.length) return <div>No Data</div>

  const perPage = 10

  // 🔍 Filter
  const filtered = keywords.filter((k: any) =>
    k.keyword?.toLowerCase().includes(search.toLowerCase())
  )

  // ✅ Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    let valA: number = 0
    let valB: number = 0

    if (sortField === "ctr") {
      valA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0
      valB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0
    } else if (sortField === "cpc") {
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

  // 🔥 Max CTR for heatmap
  const maxCTR = Math.max(
    ...sorted.map((k: any) =>
      k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0
    )
  )

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* Header */}
      <h3 className="font-bold text-2xl text-center bg-black text-white py-3">
        Overall Keyword Performance
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
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-2 text-left">Keyword</th>

              {/* ✅ Sort Impressions */}
              <th
                className="p-2 text-orange-600 cursor-pointer"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortField === "impressions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* ✅ Sort Clicks */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Clicks {sortField === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* ✅ Sort CTR */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("ctr")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                CTR {sortField === "ctr" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* ✅ Sort CPC */}
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
            {paginated.map((k: any, i: number) => {
              const ctr = k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0
              const cpc = k.clicks > 0 ? k.cost / k.clicks : 0

              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{k.keyword}</td>

                  <td className="p-2 font-medium">
                    {formatNumber(k.impressions)}
                  </td>

                  <td className="p-2">{formatNumber(k.clicks)}</td>

                  <td
                    className="p-2 text-white font-semibold text-center"
                    style={{ backgroundColor: getHeatColor(ctr, maxCTR) }}
                  >
                    {formatPercent(ctr)}
                  </td>

                  <td className="p-2">{formatCurrency(cpc)}</td>
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

export default GAdsKeywords