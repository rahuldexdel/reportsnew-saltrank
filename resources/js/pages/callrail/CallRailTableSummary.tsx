import React, { useState, useMemo } from "react";
import { Call } from "@/types";

type PaginatedCallTableProps = {
  calls: Call[];
};

const PaginatedCallTableSummary = ({ calls }: PaginatedCallTableProps) => {
  const itemsPerPage = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ SORT STATE
  const [sortField, setSortField] = useState("start_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  /* 🔍 SEARCH */
  const filteredData = useMemo(() => {
    return calls.filter((call) =>
      [
        call.customer_name,
        call.customer_phone_number,
        call.business_phone_number,
        call.customer_city,
        call.customer_state,
        call.customer_country,
        call.direction,
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [calls, searchQuery]);

  /* 🔽 SORT */
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a: any, b: any) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortField) {
        case "start_time":
          valA = new Date(a.start_time).getTime();
          valB = new Date(b.start_time).getTime();
          break;

        case "company_name":
          valA = a.company_name || "";
          valB = b.company_name || "";
          break;

        case "customer_name":
          valA = a.customer_name || "";
          valB = b.customer_name || "";
          break;

        default:
          return 0;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [filteredData, sortField, sortOrder]);

  /* 📄 PAGINATION */
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentData = sortedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const renderPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];

    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            i === currentPage ? "bg-orange-500 text-white" : "hover:bg-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <>
        {currentPage > 1 && (
          <button onClick={() => handlePageChange(currentPage - 1)}>
            Previous
          </button>
        )}
        {pages}
        {currentPage < totalPages && (
          <button onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </button>
        )}
      </>
    );
  };

  return (
    <div className="overflow-x-auto mt-10">
      <h1>Top Callers Details</h1>

      {/* SEARCH + PAGINATION */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search calls..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1 text-sm border rounded w-64"
        />
        <div className="space-x-1 text-sm">{renderPageNumbers()}</div>
      </div>

      {/* TABLE */}
      <table className="min-w-full text-sm border rounded shadow-md">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>

            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={() => handleSort("start_time")}
            >
              Start Time {sortField === "start_time" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={() => handleSort("company_name")}
            >
              Company Name {sortField === "company_name" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={() => handleSort("customer_name")}
            >
              Caller Name {sortField === "customer_name" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th className="px-4 py-2 text-left">Call Summary</th>
            <th className="px-4 py-2 text-left">Recording</th>
          </tr>
        </thead>

        <tbody>
          {currentData.map((call) => (
            <tr key={call.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                {new Date(call.start_time).toLocaleString()}
              </td>
              <td className="px-4 py-2">{call.company_name}</td>
              <td className="px-4 py-2">{call.customer_name || "-"}</td>

              <td className="px-4 py-2 max-w-xs break-words">
                {call.lead_explanation || "-"}
              </td>

              <td className="px-4 py-2">
                {call.recording_player ? (
                  <a
                    href={call.recording_player}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Play
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NO DATA */}
      {currentData.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No matching calls found.
        </div>
      )}
    </div>
  );
};

export default PaginatedCallTableSummary;