import { useState } from "react"

const formatNumber = (n: number) => n?.toLocaleString() || "0"
const formatCurrency = (n: number) => `$${n?.toFixed(2) || "0.00"}`
const formatPercent = (n: number) => `${n?.toFixed(2) || "0"}%`

const GAdsCampaigns = ({ campaigns = [] }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // ✅ Sorting state
  const [sortField, setSortField] = useState("impressions")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (!campaigns.length) return <div>No Data</div>

  const perPage = 10

  // 🔍 Filter
  const filtered = campaigns.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  // ✅ Sort (IMPORTANT)
  const sorted = [...filtered].sort((a: any, b: any) => {
    const valA = a[sortField] || 0
    const valB = b[sortField] || 0

    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // 📄 Pagination (AFTER SORT)
  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* Header */}
      <h3 className="font-bold text-2xl text-center bg-black text-white py-3">
        Campaign & Keywords Breakdown
      </h3>

      {/* Search + Count */}
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
            setPage(1) // reset page on search
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr className="bg-gray-50">
              <th className="p-2">Campaign Type</th>
              <th className="p-2">Campaign Name</th>

              {/* ✅ Clickable Sorting */}
              <th
                className="p-2 text-orange-600 cursor-pointer"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortOrder === "desc" ? "↓" : "↑"}
              </th>

              <th className="p-2">Clicks</th>
              <th className="p-2">CTR</th>
              <th className="p-2">Cost</th>
              <th className="p-2">Avg CPC</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((c: any, i: number) => {
              const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0
              const cpc = c.clicks > 0 ? c.cost / c.clicks : 0

              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{c.type}</td>
                  <td className="p-2">{c.name}</td>

                  <td className="p-2 bg-orange-500/70 text-white font-semibold">
                    {formatNumber(c.impressions)}
                  </td>

                  <td className="p-2">{formatNumber(c.clicks)}</td>
                  <td className="p-2">{formatPercent(ctr)}</td>
                  <td className="p-2">{formatCurrency(c.cost)}</td>
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

export default GAdsCampaigns