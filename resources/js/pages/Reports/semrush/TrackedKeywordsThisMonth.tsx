"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
  fetched_at: string;
  competitor_id: number | null;
};

interface Props {
  organicData?: KeywordRow[];
}

/* ================= HELPERS ================= */

// YYYY-MM key for grouping
const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

// Label like "Jan 2026"
const getMonthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};

/* ================= COMPONENT ================= */

export default function TrackedKeywordsThisMonth({
  organicData,
}: Props) {
  const rows = Array.isArray(organicData) ? organicData : [];

  const chartData = useMemo(() => {
    if (!rows.length) return [];

    /* 🔹 STEP 1: GROUP BY MONTH */
    const grouped: Record<string, KeywordRow[]> = {};

    rows.forEach((row) => {
      if (!row.fetched_at) return;
      const key = getMonthKey(row.fetched_at);
      grouped[key] ||= [];
      grouped[key].push(row);
    });

    /* 🔹 STEP 2: CALCULATE STATS PER MONTH */
    const monthlyData = Object.values(grouped).map((monthRows) => {
      let page1 = 0;
      let top5 = 0;
      let page2 = 0;

      monthRows.forEach((row) => {
        const pos = row.position;
        if (!pos) return;

        if (pos <= 5) {
          top5++;
          page1++;
        } else if (pos <= 10) {
          page1++;
        } else if (pos <= 20) {
          page2++;
        }
      });

      return {
        month: getMonthLabel(monthRows[0].fetched_at),
        page1,
        top5,
        page2,
      };
    });

    /* 🔹 STEP 3: SORT CHRONOLOGICALLY */
    return monthlyData.sort(
      (a, b) =>
        new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Keywords this Month</CardTitle>
      </CardHeader>

      <CardContent style={{ height: 360 }}>
        {chartData.length === 0 ? (
          <div className="text-center text-sm text-gray-500 pt-24">
            No keyword data available
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />

              <Bar
                dataKey="page1"
                name="Google Page 1 Keywords"
                fill="#fb7c3c"
              />
              <Bar
                dataKey="top5"
                name="Keywords in Top 5 Positions"
                fill="#8b4513"
              />
              <Bar
                dataKey="page2"
                name="All Google Page 2 Keywords"
                fill="#fbbf9c"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
