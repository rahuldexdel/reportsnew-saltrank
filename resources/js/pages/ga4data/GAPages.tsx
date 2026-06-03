import React, { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

/* ---------------- NUMBER FORMATTER ---------------- */

const formatNumber = (num: number) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B"
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M"
  if (num >= 1000) return (num / 1000).toFixed(2) + "K"
  return num.toLocaleString()
}

const GAPages = ({ pages = [] }: any) => {

  // ✅ Sorting state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  /* ---------------- TOTAL CALCULATIONS ---------------- */

  const {
    totalViews,
    totalSessions,
    totalUsers,
  } = useMemo(() => {

    return pages.reduce(
      (acc: any, p: any) => {

        acc.totalViews += Number(p.views || 0)
        acc.totalSessions += Number(p.sessions || 0)
        acc.totalUsers += Number(p.users || 0)

        return acc

      },
      { totalViews: 0, totalSessions: 0, totalUsers: 0 }
    )

  }, [pages])

  const viewsPerSession = totalSessions
    ? (totalViews / totalSessions).toFixed(2)
    : "0.00"

  const viewsPerUser = totalUsers
    ? (totalViews / totalUsers).toFixed(2)
    : "0.00"

  /* ---------------- TOP PAGES (SORTED) ---------------- */

  const topPages = useMemo(() => {

    const sorted = [...pages].sort((a: any, b: any) => {
      const valA = Number(a.views || 0)
      const valB = Number(b.views || 0)

      return sortOrder === "asc"
        ? valA - valB
        : valB - valA
    })

    return sorted.slice(0, 10)

  }, [pages, sortOrder])

  /* ---------------- RENDER ---------------- */

  return (
    <>
      <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
        Pages Overview
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">

        {/* LEFT STATS */}

        <Card className="lg:col-span-1 bg-orange-50">
          <CardContent className="grid grid-cols-2 gap-4 p-6">

            <Stat
              label="Views"
              value={formatNumber(totalViews)}
            />

            <Stat
              label="Views per Session"
              value={viewsPerSession}
            />

            <Stat
              label="Screen Page Views per User"
              value={viewsPerUser}
              full
            />

          </CardContent>
        </Card>

        {/* RIGHT TABLE */}

        <Card className="lg:col-span-2">
          <CardContent className="p-0">

            <h4 className="font-semibold text-lg px-4 py-3">
              Top 10 Pages by Views
            </h4>

            <table className="w-full text-sm border-t">

              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Page path</th>

                  {/* ✅ SORTABLE HEADER */}
                  <th
                    className="p-2 text-right cursor-pointer"
                    onClick={() =>
                      setSortOrder(prev =>
                        prev === "asc" ? "desc" : "asc"
                      )
                    }
                  >
                    Views {sortOrder === "desc" ? "↓" : "↑"}
                  </th>

                </tr>
              </thead>

              <tbody>

                {topPages.map((p: any, i: number) => (

                  <tr key={i} className="border-t">

                    <td className="p-2">
                      {p.dimension_value || "(not set)"}
                    </td>

                    <td className="p-2 text-right bg-orange-100 font-semibold">
                      {Number(p.views || 0).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </CardContent>
        </Card>

      </div>
    </>
  )
}

export default GAPages

/* ---------------- STAT COMPONENT ---------------- */

const Stat = ({
  label,
  value,
  full = false,
}: {
  label: string
  value: string
  full?: boolean
}) => (
  <div className={full ? "col-span-2 text-center" : ""}>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
)