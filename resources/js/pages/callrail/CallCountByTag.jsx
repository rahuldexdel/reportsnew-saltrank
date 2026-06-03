import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Aggregate calls by tag name
const aggregateCallCountByTag = (calls) => {
  const tagMap = {};

  calls.forEach((call) => {
    // Use tag name instead of tag_level
    const tag = call.tags && call.tags.length > 0 && call.tags[0].name
      ? call.tags[0].name
      : "Untagged";

    if (!tagMap[tag]) {
      tagMap[tag] = { tag, call_count: 0 };
    }
    tagMap[tag].call_count += 1;
  });

  // Convert object to array
  return Object.values(tagMap);
};

const CallCountByTag = ({ calls }) => {


   // console.log('calls',calls);
  const data = useMemo(() => aggregateCallCountByTag(calls), [calls]);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        layout="vertical"
        
        margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
      >
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="tag" 
          width={180}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="call_count" radius={[0, 6, 6, 0]} fill="#e05d05ff" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CallCountByTag;
