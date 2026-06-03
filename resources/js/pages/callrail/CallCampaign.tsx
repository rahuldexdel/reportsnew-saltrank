import React, { useMemo, useState } from "react";

const ITEMS_PER_PAGE = 15;

const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const CallCampaign = ({ campaign }) => {
  //console.log("campaign", campaign);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState("totalCalls");
  const [sortOrder, setSortOrder] = useState("desc");

  /* ✅ FIX: HANDLE MULTIPLE COMPANIES + CAMPAIGNS */
  const rows = useMemo(() => {
    if (!campaign || !Array.isArray(campaign)) return [];

    let allRows = [];

   

    campaign.forEach((company) => {
      if (!company?.Campaign) return;

      company.Campaign.forEach((r) => {
       // if (!r?.key) return;

        const total = r.total_calls || 0;
        const answered = r.answered_calls || 0;

        allRows.push({
          company: company.company_name || "-", // 👈 NEW COLUMN
          campaign: r.key,
          totalCalls: total,
          answeredCalls: answered,
          firstCalls: r.first_time_callers || 0,
          uniqueCallers: r.first_time_callers || 0,
          avgDuration: r.average_duration || 0,
          avgDurationFormatted: formatDuration(r.average_duration || 0),
          answeredPct: total ? (answered / total) * 100 : 0,
          answeredPctFormatted: total
            ? ((answered / total) * 100).toFixed(2) + "%"
            : "0.00%",
        });
      });
    });

    return allRows;
  }, [campaign]);


  

  /* 🔍 SEARCH */
  const filteredData = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [rows, searchQuery]);

  /* 🔽 SORT */
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [filteredData, sortField, sortOrder]);

  /* 📄 PAGINATION */
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentData = sortedData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="overflow-x-auto mt-10">
      <h1>Call Campaign Overview</h1>

      {/* SEARCH + PAGINATION */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1 text-sm border rounded w-64"
        />

        <div className="space-x-1 text-sm">
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
                  page === currentPage ? "bg-orange-500 text-white" : ""
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

      {/* TABLE */}
      <table className="min-w-full text-sm border rounded shadow-md">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th onClick={() => handleSort("company")} className="px-4 py-2 text-left cursor-pointer">
              Company {sortField === "company" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th className="px-4 py-2 text-left cursor-pointer">
              Campaign {sortField === "campaign" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("totalCalls")} className="px-4 py-2 text-left cursor-pointer">
              Total Calls {sortField === "totalCalls" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("answeredCalls")} className="px-4 py-2 text-left cursor-pointer">
              Answered Calls {sortField === "answeredCalls" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("firstCalls")} className="px-4 py-2 text-left cursor-pointer">
              First Calls {sortField === "firstCalls" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("uniqueCallers")} className="px-4 py-2 text-left cursor-pointer">
              Unique Callers {sortField === "uniqueCallers" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("avgDuration")} className="px-4 py-2 text-left cursor-pointer">
              Avg Duration {sortField === "avgDuration" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>

            <th onClick={() => handleSort("answeredPct")} className="px-4 py-2 text-left cursor-pointer">
              % Answered {sortField === "answeredPct" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </th>
          </tr>
        </thead>

        <tbody>
          {currentData.map((row, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{row.company}</td>
              <td className="px-4 py-2">{row.campaign}</td>
              <td className="px-4 py-2">{row.totalCalls}</td>
              <td className="px-4 py-2">{row.answeredCalls}</td>
              <td className="px-4 py-2">{row.firstCalls}</td>
              <td className="px-4 py-2">{row.uniqueCallers}</td>
              <td className="px-4 py-2">{row.avgDurationFormatted}</td>
              <td className="px-4 py-2">{row.answeredPctFormatted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NO DATA */}
      {currentData.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No matching campaigns found.
        </div>
      )}
    </div>
  );
};

export default CallCampaign;