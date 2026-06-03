import React, { useState, useMemo } from 'react';

const PaginatedCampPerformance = ({ Performance = [] }) => {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');


  // Map raw objects into a shape easier for rendering
  const formattedData = useMemo(() => {
    return Performance.map(item => {
      // Note: adjust how you access nested fields if your structure differs
      return {
        campaignName:
          item["dim_campaign.campaign_name"] ??
          (item.dim_campaign && item.dim_campaign.campaign_name) ??
          "",
        campaignUsers:
          item["fact_geo_fence_users.campaign_users"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.campaign_users) ??
          0,
        campaignConverters:
          item["fact_geo_fence_users.campaign_converters"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.campaign_converters) ??
          0,
     campaigndaystoconvert:
          item["fact_geo_fence_users.campaign_days_to_convert"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.campaign_days_to_convert) ??
          0,
        campaignConversionRate:
          item["fact_geo_fence_users.campaign_conversion_rate"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.campaign_conversion_rate) ??
          0,
        // add more if needed
        naturalConversionRate:
          item["fact_geo_fence_users.natural_conversion_rate"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.natural_conversion_rate) ??
          0,
        naturalConverters:
          item["fact_geo_fence_users.natural_converters"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.natural_converters) ??
          0,
        naturalDaysToConvert:
          item["fact_geo_fence_users.natural_days_to_convert"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.natural_days_to_convert) ??
          0,
        naturalTargetFenceUsers:
          item["fact_geo_fence_users.natural_target_fence_users"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.natural_target_fence_users) ??
          0,
        newCampaignConverters:
          item["fact_geo_fence_users.new_campaign_converters"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.new_campaign_converters) ??
          0,
        newConversionLift:
          item["fact_geo_fence_users.new_conversion_lift"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.new_conversion_lift) ??
          0,
        newNaturalConverters:
          item["fact_geo_fence_users.new_natural_converters"] ??
          (item.fact_geo_fence_users && item.fact_geo_fence_users.new_natural_converters) ??
          0,
      };
    });
  }, [Performance]);

const filteredData = formattedData.filter(item => {
  const lower = searchQuery.toLowerCase();
  return item.campaignName.toLowerCase().includes(lower);
});


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const maxVisiblePages = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    const pages = [];
    for (let p = start; p <= end; p++) {
      pages.push(
        <button
          key={p}
          onClick={() => handlePageChange(p)}
          className={`px-3 py-1 rounded ${p === currentPage ? 'bg-orange-500 text-white' : 'hover:bg-gray-200'}`}
        >
          {p}
        </button>
      );
    }

    return (
      <>
        {currentPage > 1 && (
          <button onClick={() => handlePageChange(currentPage - 1)} className="px-3 py-1 text-sm hover:underline">
            Previous
          </button>
        )}
        {start > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="px-3 py-1 hover:underline">1</button>
            <span className="px-2">…</span>
          </>
        )}
        {pages}
        {end < totalPages && (
          <>
            <span className="px-2">…</span>
            <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1 hover:underline">
              {totalPages}
            </button>
          </>
        )}
        {currentPage < totalPages && (
          <button onClick={() => handlePageChange(currentPage + 1)} className="px-3 py-1 text-sm hover:underline">
            Next
          </button>
        )}
      </>
    );
  };

  return (
    <div className="overflow-x-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by campaign or company"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1 text-sm border border-gray-300 rounded w-64"
        />
        <div className="space-x-1 text-sm text-gray-700">
          {renderPageNumbers()}
        </div>
      </div>

      <table className="min-w-full text-sm border border-gray-300 rounded-lg shadow-md">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Campaign Name</th>
            {/* <th className="px-4 py-2 text-right">Users</th> */}
            <th className="px-4 py-2 text-right">Campaign Converters</th>
            <th className="px-4 py-2 text-right">Campaign Days to Convert</th>
            <th className="px-4 py-2 text-right">Campaign Conversion Rate</th>
            <th className="px-4 py-2 text-right">Natural Converters</th>
            <th className="px-4 py-2 text-right">Natural Days to Convert</th>
            <th className="px-4 py-2 text-right">Natural Target Fence Users</th>
            <th className="px-4 py-2 text-right">Natural Conversion Rate</th>
            <th className="px-4 py-2 text-right">New Campaign converters</th>
            <th className="px-4 py-2 text-right">New Natural  Converters</th>
            <th className="px-4 py-2 text-right">New Conversion Lift</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">

              <td className="px-4 py-2">{item.campaignName}</td>
              {/* <td className="px-4 py-2 text-right">{item.campaignUsers}</td> */}
              <td className="px-4 py-2 text-right">{item.campaignConverters}</td>
              <td className="px-4 py-2 text-right">{item.campaigndaystoconvert}</td>
              <td className="px-4 py-2 text-right">{item.naturalConversionRate}</td>
              <td className="px-4 py-2 text-right">{item.naturalConverters}</td>
              <td classFrame="px-4 py-2 text-right">{item.naturalDaysToConvert}</td>
              <td className="px-4 py-2 text-right">{item.naturalTargetFenceUsers}</td>
              <td className="px-4 py-2 text-right">{item.campaignConversionRate}</td>
              <td className="px-4 py-2 text-right">{item.newCampaignConverters}</td>
              <td className="px-4 py-2 text-right">{item.newNaturalConverters}</td>
                <td className="px-4 py-2 text-right">{item.newConversionLift}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {currentData.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No matching records found.</div>
      )}
    </div>
  );
};

export default PaginatedCampPerformance;
