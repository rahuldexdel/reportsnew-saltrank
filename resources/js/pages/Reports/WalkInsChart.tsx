import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

const WalkInsChart = ({ simplifi_data }) => {
  const [walkInsByDay, setWalkInsByDay] = useState([]);
  const [totalWalkIns, setTotalWalkIns] = useState(0);
  const [avgDaysToWalkIn, setAvgDaysToWalkIn] = useState(0);

  const [zoomLevel, setZoomLevel] = useState(7);
  const [startIndex, setStartIndex] = useState(0);

  // ✅ Ref for chart container
  const chartRef = useRef(null);

  useEffect(() => {
    if (!simplifi_data?.campaigns_with_stats) return;

    const dayMap = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    let totalWalks = 0;
    let totalDays = 0;
    let count = 0;

    simplifi_data.campaigns_with_stats.forEach((campaign) => {
      campaign.stats.forEach((stat) => {
        const walkIns = parseFloat(stat.walk_ins);
        if (walkIns > 0) {
          const date = new Date(stat.stat_date);
          const day = date.toLocaleDateString("en-US", { weekday: "long" });
          dayMap[day] += walkIns;
          totalWalks += walkIns;

          const campaignStart = new Date(campaign.start_date || stat.stat_date);
          const diffInDays = Math.floor((date - campaignStart) / (1000 * 60 * 60 * 24));
          totalDays += diffInDays;
          count += 1;
        }
      });
    });

    const orderedDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const result = orderedDays.map((day) => ({
      day,
      walkins: dayMap[day] || 0,
    }));

    setWalkInsByDay(result);
    setTotalWalkIns(Math.round(totalWalks));
    setAvgDaysToWalkIn(count > 0 ? Math.round(totalDays / count) : 0);
  }, [simplifi_data]);

  const visibleWalkInsData = useMemo(() => {
    return walkInsByDay.slice(startIndex, startIndex + zoomLevel);
  }, [walkInsByDay, zoomLevel, startIndex]);

  // ✅ Native wheel event to stop page scroll completely
  useEffect(() => {
    const chartDiv = chartRef.current;
    if (!chartDiv) return;

    const wheelHandler = (e) => {
      e.preventDefault(); // ✅ stops page scroll completely

      if (e.deltaY < 0) {
        // Zoom in
        setZoomLevel((z) => Math.max(3, z - 1));
      } else {
        // Zoom out
        setZoomLevel((z) => Math.min(7, z + 1));
      }
    };

    chartDiv.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      chartDiv.removeEventListener("wheel", wheelHandler);
    };
  }, []);

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

   {/* ================= LEFT COLUMN ================= */}
  <div className="col-span-12 lg:col-span-4 space-y-6">

    {/* Walk-Ins Metrics Card */}
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-800">
        Walk-Ins by Campaigns
      </h3>

      <div className="flex justify-between items-center">
        <div className="text-center w-1/2">
          <div className="text-4xl font-semibold text-gray-900">
            {totalWalkIns}
          </div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mt-2">
            Unique Walk Ins
          </div>
        </div>

        <div className="text-center w-1/2">
          <div className="text-4xl font-semibold text-gray-900">
            {avgDaysToWalkIn}
          </div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mt-2">
            Avg # of Days to Walk In
          </div>
        </div>
      </div>
    </div>

    {/* Walk-Ins by Day Chart */}
    <div
      ref={chartRef}
      className="bg-white rounded-xl border border-gray-200 p-6"
      style={{ cursor: "zoom-in" }}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Walk-Ins by Day of The Week
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart layout="vertical" data={visibleWalkInsData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="day"
            type="category"
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip />
          <Bar
            dataKey="walkins"
            fill="#d4551f"
            radius={[0, 6, 6, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="walkins"
              position="right"
              style={{ fill: "#111", fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

  </div>
  </div>
);
};

export default WalkInsChart;
