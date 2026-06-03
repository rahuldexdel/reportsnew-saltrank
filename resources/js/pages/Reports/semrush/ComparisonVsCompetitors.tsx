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
  site_id: number;
  competitor_id: number | null;
  domain?: string;
  url?: string;
  keyword: string;
  position: number | null;
};

interface Props {
  organicData?: KeywordRow[];
  competitorKeywords?: KeywordRow[];
}

/* ================= HELPERS ================= */

const extractDomainFromUrl = (url?: string) => {
  if (!url) return "";

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
};

/* ================= COMPONENT ================= */

export default function ComparisonVsCompetitors({
  organicData,
  competitorKeywords,
}: Props) {
  const youData = Array.isArray(organicData) ? organicData : [];
  const competitorData = Array.isArray(competitorKeywords)
    ? competitorKeywords
    : [];

  const PAGE_SIZE = 10;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  /* ===== MERGE + NORMALIZE ===== */
  const allRows = useMemo(() => {
    const combined = [...youData, ...competitorData];

    return combined.map((row, index) => {
      const isYou = row.competitor_id === null;

      return {
        id: `${isYou ? "you" : row.competitor_id}-${index}`,
        siteOwner: isYou ? "You" : "Competitor",
        website: isYou ? extractDomainFromUrl(row.url) : row.domain ?? "",
        keyword: row.keyword,
        position: row.position ?? "-",
      };
    });
  }, [youData, competitorData]);

  /* ===== SEARCH FILTER ===== */
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return allRows;

    return allRows.filter((row) =>
      [row.siteOwner, row.website, row.keyword, String(row.position)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [allRows, search]);

  /* ===== RESET PAGE ON SEARCH ===== */
  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ===== PAGED DATA ===== */
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  const pageRows = filteredRows.slice(startIndex, endIndex);

  /* ===== PAGE CONTROLS ===== */
  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const goNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center gap-4">
        <CardTitle>Comparison vs. Competitors</CardTitle>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keyword, website..."
            className="border rounded px-3 py-1 text-sm w-64"
          />

          <div className="text-sm text-gray-600 whitespace-nowrap">
            {total > 0 ? `${startIndex + 1} to ${endIndex} of ${total}` : "0 of 0"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-left">Site Owner</th>
              <th className="px-4 py-2 border text-left">Website</th>
              <th className="px-4 py-2 border text-left">Keyword</th>
              <th className="px-4 py-2 border text-right">Position ↑↓</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border font-medium">
                  {row.siteOwner}
                </td>

                <td className="px-4 py-2 border text-blue-600">
                  {row.website}
                </td>

                <td className="px-4 py-2 border">{row.keyword}</td>

                <td className="px-4 py-2 border text-right">
                  {row.position}
                </td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center px-4 py-6 text-gray-500">
                  No keyword data available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end items-center gap-2 mt-4 text-sm">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={goNext}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}