import React, { useState } from 'react';

const PaginatedTable = ({ allStats }) => {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter based on search
  const filteredData = allStats.filter((item) =>
    (item.keys?.[2] || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded ${i === currentPage ? 'bg-orange-500 text-white' : 'hover:bg-gray-200'}`}
        >
          {i}
        </button>
      );
    }

    return (
      <>
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 text-sm hover:underline">
            Previous
          </button>
        )}
        {start > 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="px-3 py-1 hover:underline">1</button>
            <span className="px-2">...</span>
          </>
        )}
        {pages}
        {end < totalPages && (
          <>
            <span className="px-2">...</span>
            <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 hover:underline">
              {totalPages}
            </button>
          </>
        )}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 text-sm hover:underline">
            Next
          </button>
        )}
      </>
    );
  };

  return (
    <div className="overflow-x-auto mt-10">
      {/* Search Input */}
      <div className="flex justify-between mb-4 items-center">
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // reset pagination on new search
          }}
          className="px-3 py-1 text-sm border border-gray-300 rounded w-64"
        />
        {/* Pagination controls */}
        <div className="flex space-x-1 text-sm text-gray-700">
          {renderPageNumbers()}
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full border border-gray-300 text-sm rounded-lg shadow-md">
        <thead className="bg-gray-100 text-xs font-semibold uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Page</th>
            <th className="px-4 py-2 text-left">Avg. Position</th>
            <th className="px-4 py-2 text-right">Impressions</th>
            <th className="px-4 py-2 text-right">Clicks</th>
            <th className="px-4 py-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((row, index) => {
            const pageUrl = row.site_url || '—';
            const position = row.position?.toFixed?.(1) || '0.0';
            const impressions = row.impressions || 0;
            const clicks = row.clicks || 0;
            const ctr = ((row.ctr || 0) * 100).toFixed(2) + '%';

            return (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {pageUrl}
                  </a>
                </td>
                <td className="px-4 py-2">{position}</td>
                <td className="px-4 py-2 text-right">{impressions.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{clicks.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{ctr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaginatedTable;
