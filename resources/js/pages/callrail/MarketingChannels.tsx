import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const buildMarketingChannelData = (calls = []) => {
  const map = {};


 console.log('calls',calls);
  
  calls.forEach(call => {
    const source = call.source_name || "Unknown";

    if (!map[source]) {
      map[source] = {
        source_name: source,
        total_calls: 0,
        first_calls: 0,
        unique_callers_set: new Set(),
      };
    }

    map[source].total_calls += 1;

    if (call.first_call) {
      map[source].first_calls += 1;
    }

    if (call.customer_phone_number) {
      map[source].unique_callers_set.add(call.customer_phone_number);
    }
  });

  return Object.values(map).map(item => ({
    source_name: item.source_name,
    total_calls: item.total_calls,
    first_calls: item.first_calls,
    unique_callers: item.unique_callers_set.size,
  }));
};

const MarketingChannels = ({ calls  }) => {
  const data = useMemo(() => buildMarketingChannelData(calls), [calls]);


 

  return (
    <div className="w-full h-[420px]">
      <h3 className="text-sm font-semibold mb-2">
        How are My Marketing Channels Performing?
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
          <XAxis
            dataKey="source_name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={80}
          />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* STACKED BARS */}
          <Bar dataKey="unique_callers" stackId="a" fill="#e5e7eb" name="Unique Callers" />
          <Bar dataKey="first_calls" stackId="a" fill="#111827" name="First Calls" />
          <Bar dataKey="total_calls" fill="#fb923c" name="Total Calls" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketingChannels;
