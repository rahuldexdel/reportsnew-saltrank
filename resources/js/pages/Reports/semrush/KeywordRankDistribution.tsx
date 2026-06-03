"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
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

type OrganicKeyword = {
  position: number | null;
};

interface Props {
  organicData?: OrganicKeyword[];
}

/* ================= COLORS ================= */

const COLORS = ["#111827", "#fb7c3c", "#14b8a6", "#9ca3af"];

/* ================= CALCULATION ================= */

const calculateDistribution = (data: OrganicKeyword[]) => {
  let top5 = 0;
  let page1 = 0;
  let page2 = 0;
  let unranked = 0;

//console.log('KeywordRankDistribution' , data);



  data.forEach((item) => {
    const pos = item.position;

    if (!pos || pos <= 0) {
      unranked++;
    } else if (pos <= 5) {
      top5++;
      page1++;
    } else if (pos <= 10) {
      page1++;
    } else if (pos <= 20) {
      page2++;
    } else {
      unranked++;
    }
  });

  return { top5, page1, page2, unranked };
};

/* ================= COMPONENT ================= */

export default function KeywordRankDistribution({
  organicData,
}: Props) {
  const data = Array.isArray(organicData) ? organicData : [];

  const d = calculateDistribution(data);

  const chartData = [
    { name: "All Google Page 1 Keywords", value: d.page1 },
    { name: "Top 5 Positions", value: d.top5 },
    { name: "All Google Page 2 Keywords", value: d.page2 },
    { name: "Current Unranked", value: d.unranked },
  ];

  const total = chartData.reduce((a, b) => a + b.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Rank Distribution</CardTitle>
      </CardHeader>

      <CardContent style={{ height: 320 }}>
        {data.length === 0 ? (
          <div className="text-center text-sm text-gray-500 pt-20">
            No keyword data available
          </div>
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: number) =>
                  `${value} (${((value / total) * 100).toFixed(2)}%)`
                }
              />

              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
