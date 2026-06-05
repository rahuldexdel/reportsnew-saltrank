import { useState } from "react"

const formatNumber = (n: number) => n?.toLocaleString() || "0"
const formatCurrency = (n: number) => n > 0 ? `$${n.toFixed(2)}` : "$0.00"

// 🔥 Heatmap applied directly to Impressions to replicate your target design layout
const getHeatColor = (value: number, max: number) => {
  const intensity = max ? value / max : 0
  return `rgba(234, 88, 12, ${0.15 + intensity * 0.6})`
}

const NetworkPerformance = ({ networkPerformance = [] }: { networkPerformance: any[] }) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // Sorting tracking options matching target structural logic
  const [sortField, setSortField] = useState("impressions")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (!networkPerformance.length) {
    return <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow">No Network Performance Data Available</div>
  }

  const perPage = 10

  // 🔍 Filter networks matching search string input
  const filtered = networkPerformance.filter((n: any) =>
    n.network?.toLowerCase().includes(search.toLowerCase())
  )

  // 排序 Handling Logic
  const sorted = [...filtered].sort((a: any, b: any) => {
    let valA: any = 0
    let valB: any = 0

    if (sortField === "ctr") {
      valA = parseFloat(a.ctr) || 0
      valB = parseFloat(b.ctr) || 0
    } else {
      valA = a[sortField] ?? 0
      valB = b[sortField] ?? 0
    }

    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // Pagination metrics
  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  // Find max impressions across results to correctly anchor relative color intensities
  const maxImpressions = Math.max(...sorted.map((n: any) => n.impressions || 0))

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100 my-6">
      
      {/* Table Section Identity Frame */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-bold text-lg text-gray-800">Network Performance</h3>
      </div>

      {/* Controller actions section panel */}
      <div className="flex justify-between items-center p-4 bg-white">
        <p className="text-xs text-gray-400">
          {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of {sorted.length} records
        </p>

        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-orange-500 transition-all"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* Render Data Grid */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/70 border-b text-gray-500 font-medium">
            <tr>
              <th className="p-3 text-left font-semibold">Google Network</th>
              
              {/* Impressions Sortable Cell Header */}
              <th
                className={`p-3 text-right cursor-pointer select-none font-semibold ${sortField === "impressions" ? "text-orange-600" : ""}`}
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortField === "impressions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Clicks Sortable Cell Header */}
              <th
                className={`p-3 text-right cursor-pointer select-none font-semibold ${sortField === "clicks" ? "text-orange-600" : ""}`}
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Clicks {sortField === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* CTR Sortable Cell Header */}
              <th
                className={`p-3 text-right cursor-pointer select-none font-semibold ${sortField === "ctr" ? "text-orange-600" : ""}`}
                onClick={() => {
                  setSortField("ctr")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                CTR {sortField === "ctr" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Cost Sortable Cell Header */}
              <th
                className={`p-3 text-right cursor-pointer select-none font-semibold ${sortField === "cost" ? "text-orange-600" : ""}`}
                onClick={() => {
                  setSortField("cost")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Cost {sortField === "cost" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Average CPC Sortable Cell Header */}
              <th
                className={`p-3 text-right cursor-pointer select-none font-semibold ${sortField === "avg_cpc" ? "text-orange-600" : ""}`}
                onClick={() => {
                  setSortField("avg_cpc")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Avg. CPC {sortField === "avg_cpc" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((n: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                
                {/* Network Class Title Row Label */}
                <td className="p-3 font-medium text-gray-700 tracking-wide text-left">
                  {n.network}
                </td>

                {/* Heat-mapped Impressions Field matching Dashboard styles */}
                <td
                  className="p-3 text-right font-semibold text-gray-800 transition-all"
                  style={{ backgroundColor: getHeatColor(n.impressions, maxImpressions) }}
                >
                  {formatNumber(n.impressions)}
                </td>

                <td className="p-3 text-right text-gray-600">{formatNumber(n.clicks)}</td>
                <td className="p-3 text-right text-gray-600 font-medium">{n.ctr}</td>
                <td className="p-3 text-right text-gray-600">{formatCurrency(n.cost)}</td>
                <td className="p-3 text-right font-medium text-gray-700">
                  {n.avg_cpc > 0 ? formatCurrency(n.avg_cpc) : "-"}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Section Frame */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-1.5 p-4 border-t border-gray-50 bg-white">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 font-medium disabled:opacity-40 transition-colors"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-2.5 py-1 text-xs border rounded-md font-medium transition-all ${
                page === i + 1 
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 font-medium disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

    </div>
  )
}

export default NetworkPerformance