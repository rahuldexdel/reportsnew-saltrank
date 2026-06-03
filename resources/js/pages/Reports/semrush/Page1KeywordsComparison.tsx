"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

/* ================= TYPES ================= */

type KeywordRow = {
  competitor_id: number | null;
  position: number | null;
};

interface Props {
  organicData?: KeywordRow[];        // YOUR keywords
  competitorKeywords?: KeywordRow[]; // ALL competitors keywords
}

/* ================= HELPERS ================= */

// Page-1 = positions 1–10
const countPage1 = (rows: KeywordRow[]) =>
  rows.filter(
    (r) => r.position !== null && r.position <= 10
  ).length;

// Best competitor = max Page-1 count
const getBestCompetitorPage1 = (rows: KeywordRow[]) => {
  const grouped = rows.reduce<Record<number, KeywordRow[]>>(
    (acc, row) => {
      if (row.competitor_id === null) return acc;
      acc[row.competitor_id] ||= [];
      acc[row.competitor_id].push(row);
      return acc;
    },
    {}
  );

  return Math.max(
    ...Object.values(grouped).map(countPage1),
    0
  );
};

/* ================= COMPONENT ================= */

export default function Page1KeywordsComparison({
  organicData,
  competitorKeywords,
}: Props) {
  const youData = Array.isArray(organicData) ? organicData : [];
  const competitorData = Array.isArray(competitorKeywords)
    ? competitorKeywords
    : [];

  const youPage1 = useMemo(
    () => countPage1(youData),
    [youData]
  );

  const competitorPage1 = useMemo(
    () => getBestCompetitorPage1(competitorData),
    [competitorData]
  );

  const chartData = [
    { name: "Competitor", value: competitorPage1 },
    { name: "You", value: youPage1 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page 1 Keywords vs. All Competitors</CardTitle>
      </CardHeader>

      <CardContent style={{ height: 350 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value: number) =>
                `All Google Page 1 Keywords: ${value}`
              }
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill="#fb7c3c"
                  opacity={entry.name === "You" ? 1 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 text-sm flex gap-2 items-center">
          <span className="w-3 h-3 bg-[#fb7c3c] rounded-sm" />
          All Google Page 1 Keywords
        </div>
      </CardContent>
    </Card>
  );
}
