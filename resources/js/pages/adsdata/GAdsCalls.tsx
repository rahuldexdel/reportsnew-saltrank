import React, { useMemo, useState } from "react"

const GAdsCalls = ({ calls = [] }: any) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ✅ ALWAYS run hooks
  const sortedCalls = useMemo(() => {
    return [...calls].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [calls])

  const totalItems = sortedCalls.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const paginatedData = sortedCalls.slice(startIndex, endIndex)

  const total = calls.reduce(
    (sum: number, c: any) => sum + Number(c.total_calls || 0),
    0
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  // ✅ AFTER hooks → safe condition
  if (!calls.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Phone Calls By Date</h2>
        <p className="text-sm text-gray-500">No call data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-4">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Phone Calls By Date</h2>
        <span className="text-sm text-gray-500">
          Total: <strong>{total}</strong>
        </span>
      </div>

      <div className="text-sm text-gray-500">
        {startIndex + 1} to {endIndex} of {totalItems}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Date</th>
            <th className="text-right py-2">Total Calls</th>
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((c: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="py-2">{formatDate(c.date)}</td>
              <td className="text-right py-2 font-medium">
                {c.total_calls}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t font-semibold">
            <td className="py-2">Total</td>
            <td className="text-right py-2">{total}</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex justify-end items-center gap-2 pt-2">

        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "bg-orange-500 text-white border-orange-500"
                : ""
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage(prev => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default GAdsCalls  