"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

/* ================= TYPES ================= */

type KeywordRow = {
  keyword: string;
  position: number | null;
  previous_position: number | null;
  search_volume: number | null;
};

interface Props {
  data?: KeywordRow[];
}

/* ================= COMPONENT ================= */

export default function KeywordRankTracking({ data }: Props) {
  const rows = Array.isArray(data) ? data : [];

  const PAGE_SIZE = 10;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  /* ===== SEARCH FILTER ===== */
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return rows;

    return rows.filter((row) =>
      [
        row.keyword,
        String(row.position ?? ""),
        String(row.previous_position ?? ""),
        String(row.search_volume ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  /* ===== RESET PAGE ON SEARCH ===== */
  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ===== PAGINATION ===== */
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);

  const pageRows = filteredRows.slice(start, end);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center gap-4">
        <CardTitle>Keyword Rank Tracking</CardTitle>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keyword..."
            className="border rounded px-3 py-1 text-sm w-64"
          />

          <div className="text-sm text-gray-600 whitespace-nowrap">
            {total > 0 ? `${start + 1} to ${end} of ${total}` : "0 of 0"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-left">Keyword</th>
              <th className="px-4 py-2 border text-right">Position ↑↓</th>
              <th className="px-4 py-2 border text-right">
                Previous Position
              </th>
              <th className="px-4 py-2 border text-right">
                Position Change
              </th>
              <th className="px-4 py-2 border text-right">Search Volume</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, i) => {
              const current = row.position ?? 0;
              const previous = row.previous_position ?? 0;
              const change = previous - current;

              return (
                <tr key={`${row.keyword}-${i}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{row.keyword}</td>

                  <td className="px-4 py-2 border text-right">{current}</td>

                  <td className="px-4 py-2 border text-right">{previous}</td>

                  <td className="px-4 py-2 border text-right">
                    {change > 0 && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded">
                        +{change}
                      </span>
                    )}

                    {change < 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded">
                        {change}
                      </span>
                    )}

                    {change === 0 && "0"}
                  </td>

                  <td className="px-4 py-2 border text-right">
                    {row.search_volume ?? 0}
                  </td>
                </tr>
              );
            })}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No keyword data available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end items-center gap-2 mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}