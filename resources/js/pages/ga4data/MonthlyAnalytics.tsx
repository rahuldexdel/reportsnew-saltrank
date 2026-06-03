import React from "react";
import dayjs from "dayjs";

type MonthlyRow = {
  metric_date: string;
  sessions: number;
  users: number;
  extra?: {
    new_users?: number;
  };
};

interface Props {
  monthlyAnalytics: MonthlyRow[];
}

const MonthlyAnalytics: React.FC<Props> = ({ monthlyAnalytics }) => {
  if (!monthlyAnalytics || monthlyAnalytics.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        No monthly analytics data available
      </div>
    );
  }

  // Sort months ASC (old → new)
  const months = [...monthlyAnalytics].sort(
    (a, b) =>
      new Date(a.metric_date).getTime() -
      new Date(b.metric_date).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">
          Analytics – Overall Monthly Performance
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 z-10 px-3 py-2 text-left border">
                &nbsp;
              </th>

              {months.map((m, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-center border font-medium whitespace-nowrap"
                >
                  {dayjs(m.metric_date).format("MMM YYYY")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Sessions */}
            <tr>
              <td className="sticky left-0 bg-white z-10 px-3 py-2 border text-gray-600">
                Sessions
              </td>
              {months.map((m, i) => (
                <td key={i} className="px-3 py-2 text-right border">
                  {Number(m.sessions).toLocaleString()}
                </td>
              ))}
            </tr>

            {/* New Users */}
            <tr className="bg-gray-50">
              <td className="sticky left-0 bg-gray-50 z-10 px-3 py-2 border text-gray-600">
                New users
              </td>
              {months.map((m, i) => (
                <td key={i} className="px-3 py-2 text-right border">
                  {Number(m.extra?.new_users ?? 0).toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Total Users */}
            <tr>
              <td className="sticky left-0 bg-white z-10 px-3 py-2 border text-gray-600">
                Total users
              </td>
              {months.map((m, i) => (
                <td key={i} className="px-3 py-2 text-right border">
                  {Number(m.users).toLocaleString()}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default MonthlyAnalytics;
