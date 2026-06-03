import React, { useState, useMemo } from "react";

const PaginatedCampaignStatsTable = ({ stats }) => {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  console.log("stats:", stats);

  // ✅ Normalize current & previous campaigns
  const normalizedData = useMemo(() => {
    if (!Array.isArray(stats)) return [];

    return stats.flatMap((org) => {
      const current = org.campaigns || [];
      const previous = org.previous_campaigns || [];

      return current.map((currCampaign) => {
        const prevCampaign = previous.find(
          (p) => p.campaign_id === currCampaign.campaign_id
        );

        const calcTotals = (ads = []) =>
          ads.reduce(
            (acc, ad) => {
              acc.impressions += Number(ad.impressions) || 0;
              acc.clicks += Number(ad.clicks) || 0;
              acc.total_spend += Number(ad.total_spend) || 0;
              return acc;
            },
            { impressions: 0, clicks: 0, total_spend: 0 }
          );

        const currTotals = calcTotals(currCampaign.ads_merged || []);
        const prevTotals = calcTotals(prevCampaign?.ads_merged || []);

        const currCTR =
          currTotals.impressions > 0
            ? ((currTotals.clicks / currTotals.impressions) * 100).toFixed(2)
            : "0.00";
        const prevCTR =
          prevTotals.impressions > 0
            ? ((prevTotals.clicks / prevTotals.impressions) * 100).toFixed(2)
            : "0.00";

        const calcChange = (curr, prev) =>
          prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : "0";

        const change = {
          clicks: calcChange(currTotals.clicks, prevTotals.clicks),
          impressions: calcChange(
            currTotals.impressions,
            prevTotals.impressions
          ),
          ctr: calcChange(currCTR, prevCTR),
          spend: calcChange(currTotals.total_spend, prevTotals.total_spend),
        };

        return {
          organization_id: org.organization_id,
          campaign_id: currCampaign.campaign_id,
          campaign_name: currCampaign.campaign_name || "N/A",
          curr: {
            clicks: currTotals.clicks,
            impressions: currTotals.impressions,
            ctr: currCTR,
            spend: currTotals.total_spend.toFixed(2),
          },
          prev: {
            clicks: prevTotals.clicks,
            impressions: prevTotals.impressions,
            ctr: prevCTR,
            spend: prevTotals.total_spend.toFixed(2),
          },
          change,
          geo_fences: (currCampaign.geofence && currCampaign.geofence[0]) || "N/A",
        };
      });
    });
  }, [stats]);

  // 🔍 Search
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return normalizedData.filter((item) =>
      item.campaign_name.toLowerCase().includes(query)
    );
  }, [normalizedData, searchQuery]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const maxVisible = 5;
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

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
      <div className="space-x-1 text-sm text-gray-700">
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
      </div>
    );
  };

  // 🧮 Helper to color changes
  const changeClass = (value) => {
    const num = parseFloat(value);
    if (num > 0) return "text-green-600";
    if (num < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-10">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">

        {/* LEFT SIDE */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Geofence Performance
          </h3>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>
              {filteredData.length === 0
                ? "0 of 0"
                : `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                    currentPage * itemsPerPage,
                    filteredData.length
                  )} of ${filteredData.length}`}
            </span>

            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${filteredData.length} records...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <span className="absolute left-2 top-1.5 text-gray-400 text-sm">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE PAGINATION */}
        <div className="flex items-center gap-2 text-sm">

          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2 py-1 hover:bg-gray-200 rounded"
            >
              ‹
            </button>
          )}

          {[...Array(totalPages)].slice(0, 5).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 py-1 rounded ${
                  page === currentPage
                    ? "bg-orange-500 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            );
          })}

          {totalPages > 5 && <span className="px-1">...</span>}

          {currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2 py-1 hover:bg-gray-200 rounded"
            >
              ›
            </button>
          )}

        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Geofence</th>
              <th className="px-4 py-3 text-left">Campaign</th>
              <th className="px-4 py-3 text-right bg-orange-50 text-orange-600 font-semibold">
                Clicks
              </th>
              <th className="px-4 py-3 text-right">Impressions</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 text-right">Spend</th>
            </tr>
          </thead>

          <tbody>
            {currentData.map((c) => (
              <tr
                key={c.campaign_id}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 text-gray-700">
                  {c.geo_fences}
                </td>

                <td className="px-4 py-3 font-medium text-gray-800">
                  {c.campaign_name}
                </td>

                {/* Highlighted Clicks Column */}
                <td className="px-4 py-3 text-right bg-orange-50 font-semibold text-orange-600">
                  {c.curr.clicks.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right">
                  {c.curr.impressions.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right">
                  {c.curr.ctr}%
                </td>

                <td className="px-4 py-3 text-right">
                  ${c.curr.spend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EMPTY STATE */}
      {currentData.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500">
          No matching campaigns found.
        </div>
      )}

    </div>
  );
};

export default PaginatedCampaignStatsTable;
