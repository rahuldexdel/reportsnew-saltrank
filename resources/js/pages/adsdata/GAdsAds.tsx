import { useState } from "react"

const formatNumber = (n: number) => n?.toLocaleString() || "0"
const formatCurrency = (n: number) => `$${n?.toFixed(2) || "0.00"}`
const formatPercent = (n: number) => `${n?.toFixed(2)}%`

const getHeatColor = (value: number, max: number) => {
  const intensity = max ? value / max : 0
  return `rgba(234, 88, 12, ${0.3 + intensity * 0.7})`
}

const SectionTable = ({ title, data = [], type = "adgroup" }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // ✅ Sorting
  const [sortField, setSortField] = useState("impressions")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const perPage = 15

  if (!data.length) return null

  // 🔍 Filter
  const filtered = data.filter((d: any) =>
    JSON.stringify(d).toLowerCase().includes(search.toLowerCase())
  )

  // ✅ SORT
  const sorted = [...filtered].sort((a: any, b: any) => {
    let valA = 0
    let valB = 0

    if (sortField === "ctr") {
      valA = a.impressions ? (a.clicks / a.impressions) * 100 : 0
      valB = b.impressions ? (b.clicks / b.impressions) * 100 : 0
    } else if (sortField === "cpc") {
      valA = a.clicks ? a.cost / a.clicks : 0
      valB = b.clicks ? b.cost / b.clicks : 0
    } else {
      valA = a[sortField] || 0
      valB = b[sortField] || 0
    }

    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // 📄 Pagination AFTER SORT
  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = sorted.slice(
    (page - 1) * perPage,
    page * perPage
  )

  // 🔥 heatmap
  const maxImpressions = Math.max(...sorted.map((d: any) => d.impressions || 0))

  return (
    <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">

      <h3 className="font-semibold text-lg p-4">{title}</h3>

      {/* Search + Count */}
      <div className="flex justify-between items-center px-4 pb-2">
        <p className="text-sm text-gray-500">
          {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of {sorted.length}
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
              <th className="p-2 text-left">
                {type === "adgroup" ? "Ad Group" : "Ad (Headline)"}
              </th>

              {type !== "adgroup" && (
                <th className="p-2 text-left">Ad Preview</th>
              )}

              {/* ✅ Impressions */}
              <th
                className="p-2 text-orange-600 cursor-pointer"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Impressions {sortField === "impressions" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Clicks */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Clicks {sortField === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* CTR */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("ctr")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                CTR {sortField === "ctr" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* Cost */}
              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("cost")
                  setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                }}
              >
                Cost {sortField === "cost" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
              </th>

              {/* CPC */}
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
            {paginated.map((d: any, i: number) => {
              const ctr = d.impressions ? (d.clicks / d.impressions) * 100 : 0
              const cpc = d.clicks ? d.cost / d.clicks : 0
  
      console.log('Ad Group Data:', d);

              return (
                <tr key={i} className="border-b hover:bg-gray-50">

                 <td className="p-2">
                    {/* For display ads */}
                    {type === "display_ads" && d.headline ? d.headline : d.ad_group_name}
                    {/* For search ads, ensure the headline is shown */}
                    {type === "search_ads" && d.headline ? d.headline : d.ad_group_name}

                   {type === "adgroup"
                    ? (d.name ?? d.name)
                    : null}

                  </td>

                  {type !== "adgroup" && (
                    <td className="p-2 text-xs flex items-center gap-3">
                      {type === "display_ads" && d.image_url && (
                        <img
                          src={d.image_url}
                          alt={d.headline || "Ad Image"}
                          className="w-20 h-auto rounded border"
                        />
                      )}
                      {type === "search_ads" && (
                      <div>
                        <div>{d.headline}</div>
                        <div className="text-gray-500 text-xs">{d.final_url}</div>
                      </div>
                      )}
                    </td>
                  )}

                  <td
                    className="p-2 text-white font-semibold text-center"
                    style={{
                      backgroundColor: getHeatColor(d.impressions, maxImpressions)
                    }}
                  >
                    {formatNumber(d.impressions)}
                  </td>

                  <td className="p-2">{formatNumber(d.clicks)}</td>
                  <td className="p-2">{formatPercent(ctr)}</td>
                  <td className="p-2">{formatCurrency(d.cost)}</td>
                  <td className="p-2">{formatCurrency(cpc)}</td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 p-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ‹
          </button>

          {[...Array(totalPages)].slice(0, 5).map((_, i) => (
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
            ›
          </button>

        </div>
      )}

    </div>
  )
}

const GAdsAds = ({ data }: any) => {
  if (!data) return <div>No Data</div>

  return (
    <div className="space-y-6">

      <h3 className="font-bold text-3xl text-center bg-black text-white py-3">
        Ad Group & Ads Performance
      </h3>

      <SectionTable
        title="Overall Ad Group Performance"
        data={data.ads.ad_groups}
        type="adgroup"
      />

      <SectionTable
        title="Display Ads Performance"
        data={data.ads.display_ads}
        type="display_ads" // <-- add this flag here
      />

    <SectionTable
      title="Search Ads Performance"
      data={data.ads.search_ads}
      type="search_ads"  // add this
    />

      <SectionTable
        title="Search Re-Targeting Ads Performance"
        data={data.ads.retargeting_ads}
      />

    </div>
  )
}

export default GAdsAds