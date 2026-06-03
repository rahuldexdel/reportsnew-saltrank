"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

/* ================= TYPES ================= */

type CompetitorKeywordRow = {
  competitor_id: number;
  domain: string;
  position: number | null;
};

type CompetitorStats = {
  competitor_id: number;
  domain: string;
  top5: number;
  page1: number;
};

interface Props {
  competitors?: CompetitorKeywordRow[];
}

/* ================= CALCULATION ================= */

const calculateCompetitorStats = (
  rows: CompetitorKeywordRow[]
): CompetitorStats[] => {
  const stats: Record<number, CompetitorStats> = {};

  rows.forEach((row) => {
    if (!row.competitor_id || !row.domain) return;
    if (row.position === null) return;

    if (!stats[row.competitor_id]) {
      stats[row.competitor_id] = {
        competitor_id: row.competitor_id,
        domain: row.domain,
        top5: 0,
        page1: 0,
      };
    }

    if (row.position <= 5) {
      stats[row.competitor_id].top5++;
      stats[row.competitor_id].page1++;
    } else if (row.position <= 10) {
      stats[row.competitor_id].page1++;
    }
  });

  return Object.values(stats);
};

/* ================= COMPONENT ================= */

export default function WebsitePerformanceVsCompetitors({
  competitors,
}: Props) {
  const competitorRows = Array.isArray(competitors) ? competitors : [];

  const [search, setSearch] = useState("");

  const tableData = useMemo(
    () => calculateCompetitorStats(competitorRows),
    [competitorRows]
  );

  /* ===== SEARCH FILTER ===== */
  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return tableData;

    return tableData.filter((row) =>
      [row.domain, String(row.top5), String(row.page1)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [tableData, search]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center gap-4">
        <CardTitle>Website Performance v/s Competitors</CardTitle>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search website..."
            className="border rounded px-3 py-1 text-sm w-64"
          />

          <div className="text-sm text-gray-600 whitespace-nowrap">
            {filteredData.length} of {tableData.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 border">Website</th>
              <th className="text-right px-4 py-2 border">
                All Keywords in Top 5 Positions
              </th>
              <th className="text-right px-4 py-2 border">
                All Google Page 1 Keywords
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row) => (
              <tr key={row.competitor_id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-blue-600">
                  {row.domain}
                </td>

                <td className="px-4 py-2 border text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div
                        className="bg-orange-500 h-2 rounded"
                        style={{
                          width: `${Math.min(row.top5 * 2, 100)}%`,
                        }}
                      />
                    </div>
                    <span>{row.top5}</span>
                  </div>
                </td>

                <td className="px-4 py-2 border text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div
                        className="bg-orange-400 h-2 rounded"
                        style={{
                          width: `${Math.min(row.page1 * 2, 100)}%`,
                        }}
                      />
                    </div>
                    <span>{row.page1}</span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center px-4 py-6 text-gray-500">
                  No competitor data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}