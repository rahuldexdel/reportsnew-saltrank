import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Aggregate call duration by tag name
const aggregateCallDurationByTag = (calls) => {
  const tagMap = {};

  calls.forEach((call) => {
    // Use tag name instead of tag_level
    const tag = call.tags && call.tags.length > 0 && call.tags[0].name
      ? call.tags[0].name
      : "Untagged";

    if (!tagMap[tag]) {
      tagMap[tag] = { tag, total_duration: 0 };
    }

    const duration = Number(call.duration) || 0;
    tagMap[tag].total_duration += duration;
  });

  // Convert to array and sort by total duration descending
  return Object.values(tagMap).sort((a, b) => b.total_duration - a.total_duration);
};

const CallCountByDuration = ({ calls }) => {
  const data = useMemo(() => aggregateCallDurationByTag(calls), [calls]);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="tag" width={180} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value} sec`} />
        <Bar dataKey="total_duration" radius={[0, 6, 6, 0]} fill="#000000ff" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CallCountByDuration;
