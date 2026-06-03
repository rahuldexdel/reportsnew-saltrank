import React, { useState } from 'react';

const PaginatedQueryTable = ({ formattedQueryData }) => {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered based on search input
  const filteredData = formattedQueryData.filter(item =>
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
          className={`px-3 py-1 rounded ${i === currentPage ? 'bg-orange-500 text-white' : 'hover:bg-gray-200'}`}
        >
          {i}
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
            <span className="px-2">...</span>
          </>
        )}
        {pages}
        {end < totalPages && (
          <>
            <span className="px-2">...</span>
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

      {/* Top Controls: Search (left), Pagination (right) */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search queries..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // reset to page 1 after filtering
          }}
          className="px-3 py-1 text-sm border border-gray-300 rounded w-64"
        />
        <div className="space-x-1 text-sm text-gray-700">
          {renderPageNumbers()}
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full text-sm border border-gray-300 rounded-lg shadow-md">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Queries</th>
            <th className="px-4 py-2 text-left">Search Type</th>
            <th className="px-4 py-2 text-right">Avg. Position</th>
            <th className="px-4 py-2 text-right">Impressions</th>
            <th className="px-4 py-2 text-right">Clicks</th>
            <th className="px-4 py-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 break-all">{item.query}</td>
              <td className="px-4 py-2">{item.device}</td>
              <td className="px-4 py-2 text-right">{item.position}</td>
              <td className="px-4 py-2 text-right">{item.impressions}</td>
              <td className="px-4 py-2 text-right">{item.clicks}</td>
              <td className="px-4 py-2 text-right">{item.ctr}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Optional: No data message */}
      {currentData.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No matching queries found.</div>
      )}
    </div>
  );
};

export default PaginatedQueryTable;
