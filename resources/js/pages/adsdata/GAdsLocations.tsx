import { useState, useEffect } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps"

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const formatNumber = (n: number) => n?.toLocaleString() || "0"

const getHeatColor = (value: number, max: number) => {
  const intensity = max ? value / max : 0
  return `rgba(234, 88, 12, ${0.3 + intensity * 0.7})`
}

// 🔑 API KEY
const GOOGLE_API_KEY = "AIzaSyCN0QgXRXxbrHhV4RV7cMpLUflyJsjyHiw"

// ✅ Geocode with caching
const getLatLngFromCity = async (city: string, region?: string) => {
  const key = `${city}-${region}`
  const cached = localStorage.getItem(key)

  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${city}, ${region}, USA&key=${GOOGLE_API_KEY}`
    )
    const data = await res.json()

    if (data.status === "OK") {
      const location = data.results[0].geometry.location
      localStorage.setItem(key, JSON.stringify(location))
      return location
    }
  } catch (err) {
    console.error("Geocode error:", err)
  }

  return null
}

const GAdsLocations = ({ locations = [] }: any) => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [tooltip, setTooltip] = useState<any>(null)
  const [geoData, setGeoData] = useState<any[]>([])

  const [position, setPosition] = useState({
    coordinates: [-95, 38],
    zoom: 1
  })

  const handleReset = () => {
  setPosition({
    coordinates: [0, 20], // center of world
    zoom: 1
  })
}

  const [sortField, setSortField] = useState("impressions")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const perPage = 15

  // ✅ Fetch lat/lng
  useEffect(() => {
    const fetchCoords = async () => {
      const results = await Promise.all(
        locations.map(async (loc: any) => {
          const coords = await getLatLngFromCity(loc.city, loc.region)

          return {
            ...loc,
            lat: coords?.lat,
            lng: coords?.lng
          }
        })
      )
      setGeoData(results)
    }

    if (locations.length) fetchCoords()
  }, [locations])




  // 🔍 Filter
  const filtered = geoData.filter((l: any) =>
    JSON.stringify(l).toLowerCase().includes(search.toLowerCase())
  )

  // ✅ Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    const valA = a[sortField] || 0
    const valB = b[sortField] || 0
    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // ✅ Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))

   useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
 
  if (!geoData.length) return <div>Loading map...</div>

  const paginated = sorted.slice(
    (page - 1) * perPage,
    page * perPage
  )

  const maxImpressions = Math.max(
    0,
    ...sorted.map((l: any) => l.impressions || 0)
  )

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <h3 className="font-semibold text-lg p-4">
        Targeted Locations
      </h3>

      {/* MAP */}
      <div className="relative px-4 pb-4">
        <div className="absolute left-6 top-6 flex flex-col gap-2 z-10">

            <button
            onClick={handleReset}
            className="bg-blue-500 text-white w-10 h-10 rounded-md shadow"
          >
            🏠
          </button>
          <button
            onClick={() =>
              setPosition((pos) => ({
                ...pos,
                zoom: Math.min(pos.zoom + 0.5, 5)
              }))
            }
          >
            +
          </button>

          <button
            onClick={() =>
              setPosition((pos) => ({
                ...pos,
                zoom: Math.max(pos.zoom - 0.5, 0.3)
              }))
            }
          >
            −
          </button>
        </div>

        <ComposableMap projection="geoMercator" height={320}>
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={setPosition}
            minZoom={0.3}
            maxZoom={5}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#5276b0"
                    stroke="#fff"
                  />
                ))
              }
            </Geographies>

            {geoData.map((loc: any, i: number) => {
              if (!loc.lat || !loc.lng) return null

              return (
                <Marker
                  key={i}
                  coordinates={[loc.lng, loc.lat]}
                  onMouseEnter={() => setTooltip(loc)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <circle
                    r={1}
                    fill="rgba(234,88,12,0.9)"
                    stroke="#fff"
                     fill="#90898a"
                    strokeWidth={0.2}
                  />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div className="absolute top-10 left-24 bg-white shadow-lg border rounded px-3 py-2 text-sm z-20">
            <strong>{tooltip.city}</strong><br />
            {tooltip.region}<br />
            Impressions: {formatNumber(tooltip.impressions)}<br />
            Clicks: {formatNumber(tooltip.clicks)}<br />
            Conversions: {formatNumber(tooltip.conversions)}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex justify-between items-center px-4 pb-2">
        <p className="text-sm text-gray-500">
          {sorted.length === 0
            ? "0 results"
            : `${(page - 1) * perPage + 1} to ${Math.min(
                page * perPage,
                sorted.length
              )} of ${sorted.length}`}
        </p>

        <input
          type="text"
          placeholder="Search records..."
          className="border px-3 py-1 rounded text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 text-left">Target Type</th>
              <th className="p-2 text-left">Region</th>
              <th className="p-2 text-left">City</th>

              <th
                className="p-2 text-orange-600 cursor-pointer"
                onClick={() => {
                  setSortField("impressions")
                  setSortOrder((prev) =>
                    prev === "asc" ? "desc" : "asc"
                  )
                }}
              >
                Impressions
              </th>

              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("clicks")
                  setSortOrder((prev) =>
                    prev === "asc" ? "desc" : "asc"
                  )
                }}
              >
                Clicks
              </th>

              <th
                className="p-2 cursor-pointer"
                onClick={() => {
                  setSortField("conversions")
                  setSortOrder((prev) =>
                    prev === "asc" ? "desc" : "asc"
                  )
                }}
              >
                Conversions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((l: any, i: number) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2">{l.target_type}</td>
                <td className="p-2">{l.region}</td>
                <td className="p-2">{l.city}</td>

                <td
                  className="p-2 text-white font-semibold text-center"
                  style={{
                    backgroundColor: getHeatColor(
                      l.impressions,
                      maxImpressions
                    )
                  }}
                >
                  {formatNumber(l.impressions)}
                </td>

                <td className="p-2">
                  {formatNumber(l.clicks)}
                </td>
                <td className="p-2">
                  {formatNumber(l.conversions)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 p-3">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage((p) => Math.max(p - 1, 1))
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() =>
              setPage((p) =>
                Math.min(p + 1, totalPages)
              )
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default GAdsLocations