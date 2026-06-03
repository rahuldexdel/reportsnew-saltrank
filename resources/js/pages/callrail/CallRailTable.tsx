import React, { useState, useMemo } from "react";
import { Call } from "@/types";

type PaginatedCallTableProps = {
  calls: Call[];
};

const ITEMS_PER_PAGE = 15;

const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const PaginatedCallTable = ({ calls }: PaginatedCallTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ SORTING STATE
  const [sortField, setSortField] = useState("start_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const normalizeKeywords = (keywords: any): string => {
    if (Array.isArray(keywords)) return keywords.join(" ");
    if (typeof keywords === "string") return keywords;
    return "";
  };

  const normalizeTags = (tags: any[]): string =>
    Array.isArray(tags) ? tags.map((t) => t?.name).join(" ") : "";

  /* 🔍 SEARCH */
  const filteredData = useMemo(() => {
    return calls.filter((call) =>
      [
        call.customer_name,
        call.customer_phone_number,
        call.source_name,
        normalizeKeywords(call.keywords),
        normalizeTags(call.tags),
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [calls, searchQuery]);

  /* 🔽 SORT */
const sortedData = useMemo(() => {
  return [...filteredData].sort((a: any, b: any) => {

    let valA: any = 0;
    let valB: any = 0;

    switch (sortField) {
      case "start_time":
        valA = new Date(a.start_time).getTime();
        valB = new Date(b.start_time).getTime();
        break;

      case "duration":
        valA = a.duration || 0;
        valB = b.duration || 0;
        break;

      case "customer_name":
        valA = a.customer_name || "";
        valB = b.customer_name || "";
        break;

      case "phone":
        valA = a.customer_phone_number || "";
        valB = b.customer_phone_number || "";
        break;

      case "source":
        valA = a.source_name || "";
        valB = b.source_name || "";
        break;

      case "first_call":
        valA = a.first_call ? 1 : 0;
        valB = b.first_call ? 1 : 0;
        break;

      case "answered":
        valA = a.answered ? 1 : 0;
        valB = b.answered ? 1 : 0;
        break;

      case "qualified":
        valA = a.milestones?.qualified ? 1 : 0;
        valB = b.milestones?.qualified ? 1 : 0;
        break;

      default:
        return 0;
    }

    // string vs number handling
    if (typeof valA === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return sortOrder === "asc"
      ? valA - valB
      : valB - valA;
  });
}, [filteredData, sortField, sortOrder]);
  /* 📄 PAGINATION (AFTER SORT) */
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = sortedData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      <h1>Top Callers Details</h1>

      {/* 🔝 Controls */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder={`Search ${calls.length} records...`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1 text-sm border rounded w-64"
        />

        <div className="space-x-1 text-sm text-gray-700">
          {currentPage > 1 && (
            <button onClick={() => handlePageChange(currentPage - 1)}>
              Previous
            </button>
          )}

          {[...Array(totalPages)].slice(0, 5).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  page === currentPage
                    ? "bg-orange-500 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            );
          })}

          {currentPage < totalPages && (
            <button onClick={() => handlePageChange(currentPage + 1)}>
              Next
            </button>
          )}
        </div>
      </div>

      {/* 📊 TABLE */}
      <table className="min-w-full text-sm borde
      
      r rounded shadow-sm">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>

            {/* SORTABLE START TIME */}
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => handleSort("start_time")}
            >
              Start Time {sortField === "start_time" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>
            <th onClick={() => handleSort("customer_name")} className="cursor-pointer">
              Company Name {sortField === "customer_name" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("first_call")} className="cursor-pointer">
              First Call {sortField === "first_call" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("answered")} className="cursor-pointer">
              Answered {sortField === "answered" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>
            <th className="px-3 py-2 text-left">Caller Name</th>

            {/* SORTABLE DURATION */}
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => handleSort("duration")}
            >
              Duration {sortField === "duration" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th className="px-3 py-2 text-left">Caller Number</th>
            <th onClick={() => handleSort("source")} className="cursor-pointer">
              Source Name {sortField === "source" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>
            <th className="px-3 py-2 text-left">Keywords</th>
            <th className="px-3 py-2 text-left">Tags</th>
           <th onClick={() => handleSort("qualified")} className="cursor-pointer">
            Qualified {sortField === "qualified" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
          </th>
          </tr>
        </thead>

        <tbody>
          {currentData.map((call) => (
            <tr key={call.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">
                {new Date(call.start_time).toLocaleString()}
              </td>
              <td className="px-3 py-2">{call.customer_name || "-"}</td>
              <td className="px-3 py-2">{call.first_call ? "Yes" : "No"}</td>
              <td className="px-3 py-2">{call.answered ? "Yes" : "No"}</td>
              <td className="px-3 py-2">{call.customer_name || "-"}</td>
              <td className="px-3 py-2">{formatDuration(call.duration)}</td>
              <td className="px-3 py-2">{call.customer_phone_number || "-"}</td>
              <td className="px-3 py-2">{call.source_name || "-"}</td>
              <td className="px-3 py-2">
                {call.keywords?.length ? call.keywords.join(", ") : "-"}
              </td>
              <td className="px-3 py-2">
                {call.tags?.length
                  ? call.tags.map((t) => t.name).join(", ")
                  : "Uncategorized"}
              </td>
              <td className="px-3 py-2">
                {call.milestones?.qualified ? "Yes" : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ❌ NO DATA */}
      {currentData.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No matching records found.
        </div>
      )}
    </div>
  );
};

export default PaginatedCallTable;