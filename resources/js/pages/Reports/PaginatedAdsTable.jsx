import React, { useState, useMemo } from "react";

const PaginatedAdsTable = ({ ads }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 7;

  // ✅ Flatten Simplifi data into comparable pairs (current + previous)
  const allAds = useMemo(() => {
    if (!Array.isArray(ads)) return [];

    return ads.flatMap((org) => {
      const currentCampaigns = org.campaigns || [];
      const previousCampaigns = org.previous_campaigns || [];

      return currentCampaigns.flatMap((camp) => {
        const currentAds = camp.ads_merged || [];
        const prevCamp = previousCampaigns.find(
          (p) => p.campaign_id === camp.campaign_id
        );
        const previousAds = prevCamp?.ads_merged || [];

        return currentAds.map((ad) => {
          const prevAd = previousAds.find(
            (p) =>
              p.ad_name?.trim().toLowerCase() ===
              ad.ad_name?.trim().toLowerCase()
          );

          const currentClicks = Number(ad.clicks || 0);
          const previousClicks = Number(prevAd?.clicks || 0);
          const clickGrowth =
            previousClicks > 0
              ? (((currentClicks - previousClicks) / previousClicks) * 100).toFixed(1)
              : 0;

          const currentImpressions = Number(ad.impressions || 0);
          const previousImpressions = Number(prevAd?.impressions || 0);
          const impressionGrowth =
            previousImpressions > 0
              ? (
                  ((currentImpressions - previousImpressions) /
                    previousImpressions) *
                  100
                ).toFixed(1)
              : 0;

          const currentCTR =
            ad.ctr ||
            (currentImpressions > 0
              ? (currentClicks / currentImpressions) * 100
              : 0);
          const previousCTR =
            prevAd?.ctr ||
            (previousImpressions > 0
              ? (previousClicks / previousImpressions) * 100
              : 0);
          const ctrGrowth =
            previousCTR > 0
              ? (((currentCTR - previousCTR) / previousCTR) * 100).toFixed(1)
              : 0;

          const currentSpend = Number(ad.total_spend || 0);
          const previousSpend = Number(prevAd?.total_spend || 0);
          const spendGrowth =
            previousSpend > 0
              ? (((currentSpend - previousSpend) / previousSpend) * 100).toFixed(1)
              : 0;

          return {
            organization_id: org.organization_id,
            campaign_id: camp.campaign_id,
            campaign_name: camp.campaign_name || "N/A",
            ad_id: ad.ad_id || `${camp.campaign_id}-${ad.ad_name}`,
            ad_name: ad.ad_name || "N/A",
            clicks: currentClicks,
            prev_clicks: previousClicks,
            click_growth: clickGrowth,
            impressions: currentImpressions,
            prev_impressions: previousImpressions,
            impression_growth: impressionGrowth,
            ctr: currentCTR,
            prev_ctr: previousCTR,
            ctr_growth: ctrGrowth,
            total_spend: currentSpend,
            prev_spend: previousSpend,
            spend_growth: spendGrowth,
            status: ad.status || "N/A",
            primary_creative_url: ad.primary_creative_url || "",
            target_url: ad.target_url || "",
          };
        });
      });
    });
  }, [ads]);

  // 🔍 Search filter
  const filteredAds = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return allAds;

    return allAds.filter((ad) => {
      const adName = (ad.ad_name || "").toLowerCase();
      const campaignName = (ad.campaign_name || "").toLowerCase();
      return adName.includes(normalized) || campaignName.includes(normalized);
    });
  }, [allAds, searchQuery]);

  // 📄 Pagination logic
  const totalPages = Math.ceil(filteredAds.length / itemsPerPage);
  const currentData = filteredAds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
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
          <button onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
        )}
        {start > 1 && (
          <>
            <button onClick={() => handlePageChange(1)}>1</button>
            <span>...</span>
          </>
        )}
        {pages}
        {end < totalPages && (
          <>
            <span>...</span>
            <button onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
          </>
        )}
        {currentPage < totalPages && (
          <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by ad or campaign name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1 text-sm border border-gray-300 rounded w-80"
        />
        {renderPagination()}
      </div>

      <table className="table-auto min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Campaign</th>
            <th className="px-4 py-2 border">Ad</th>
            <th className="px-4 py-2 border text-right">Clicks</th>
            <th className="px-4 py-2 border text-right">Impressions</th>
            <th className="px-4 py-2 border text-right">CTR</th>
            <th className="px-4 py-2 border text-right">Spend</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Preview</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((ad) => (
            <tr key={ad.ad_id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{ad.campaign_name}</td>
              <td className="px-4 py-2 border">{ad.ad_name}</td>

              {/* ✅ Clicks */}
              <td className="px-4 py-2 border text-right">
                <div className="font-medium">{ad.clicks}</div>
                {/* <div
                  className={`text-xs ${
                    ad.click_growth > 0
                      ? "text-green-600"
                      : ad.click_growth < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {ad.click_growth > 0
                    ? "▲"
                    : ad.click_growth < 0
                    ? "▼"
                    : "–"}{" "}
                  {Math.abs(ad.click_growth)}%{" "}
                  <span className="text-gray-400">{ad.prev_clicks}</span>
                </div> */}
              </td>

              {/* ✅ Impressions */}
              <td className="px-4 py-2 border text-right">
                <div className="font-medium">{ad.impressions}</div>
                {/* <div
                  className={`text-xs ${
                    ad.impression_growth > 0
                      ? "text-green-600"
                      : ad.impression_growth < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {ad.impression_growth > 0
                    ? "▲"
                    : ad.impression_growth < 0
                    ? "▼"
                    : "–"}{" "}
                  {Math.abs(ad.impression_growth)}%{" "}
                  <span className="text-gray-400">{ad.prev_impressions}</span>
                </div> */}
              </td>

              {/* ✅ CTR */}
              <td className="px-4 py-2 border text-right">
                <div className="font-medium">{ad.ctr.toFixed(2)}%</div>
                {/* <div
                  className={`text-xs ${
                    ad.ctr_growth > 0
                      ? "text-green-600"
                      : ad.ctr_growth < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {ad.ctr_growth > 0 ? "▲" : ad.ctr_growth < 0 ? "▼" : "–"}{" "}
                  {Math.abs(ad.ctr_growth)}%{" "}
                  <span className="text-gray-400">
                    {ad.prev_ctr.toFixed(2)}%
                  </span>
                </div> */}
              </td>

              {/* ✅ Spend */}
              <td className="px-4 py-2 border text-right">
                <div className="font-medium">${ad.total_spend.toFixed(2)}</div>
                {/* <div
                  className={`text-xs ${
                    ad.spend_growth > 0
                      ? "text-green-600"
                      : ad.spend_growth < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {ad.spend_growth > 0 ? "▲" : ad.spend_growth < 0 ? "▼" : "–"}{" "}
                  {Math.abs(ad.spend_growth)}%{" "}
                  <span className="text-gray-400">
                    ${ad.prev_spend.toFixed(2)}
                  </span>
                </div> */}
              </td>

              <td className="px-4 py-2 border">{ad.status}</td>

              <td className="px-4 py-2 border text-center">
                {ad.primary_creative_url ? (
                  <a href={ad.target_url} target="_blank" rel="noopener noreferrer">
                    {ad.primary_creative_url.endsWith(".mp4") ? (
                      <video width="100" height="70" controls>
                        <source src={ad.primary_creative_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={ad.primary_creative_url}
                        alt={ad.ad_name}
                        className="w-24 h-auto hover:opacity-80 rounded-md"
                      />
                    )}
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {currentData.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No matching ads found.
        </div>
      )}
    </div>
  );
};

export default PaginatedAdsTable;
