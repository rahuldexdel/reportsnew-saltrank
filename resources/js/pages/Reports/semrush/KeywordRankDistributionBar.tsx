"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

type OrganicKeyword = {
  Position: string;
};

interface Props {
  organic: OrganicKeyword[];
}

const calculateKeywordStats = (organic: OrganicKeyword[]) => {
  let page1 = 0;
  let top5 = 0;
  let page2 = 0;

  organic.forEach((k) => {
    const pos = Number(k.Position);
    if (!pos || isNaN(pos)) return;

    if (pos <= 5) {
      top5++;
      page1++;
    } else if (pos <= 10) {
      page1++;
    } else if (pos <= 20) {
      page2++;
    }
  });

  return { page1, top5, page2 };
};

export default function KeywordRankDistributionBar({ organic }: Props) {
  const stats = calculateKeywordStats(organic);

  const data = [
    {
      name: "Jan 2026",
      "Google Page 1 Keywords": stats.page1,
      "Keywords in Top 5 Positions": stats.top5,
      "All Google Page 2 Keywords": stats.page2,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Keywords this Month</CardTitle>
      </CardHeader>

      <CardContent style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar
              dataKey="Google Page 1 Keywords"
              fill="#fb7c3c"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="Keywords in Top 5 Positions"
              fill="#8b4513"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="All Google Page 2 Keywords"
              fill="#f4b183"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
