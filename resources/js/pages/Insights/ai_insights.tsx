
import React, { useState } from "react"
import { Head, router, usePage } from "@inertiajs/react"

import AppLayout from "@/layouts/app-layout"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"

import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from "recharts"

/* ================= TYPES ================= */

type AiData = {
  report_title: string
  executive_summary?: {
    headline: string
    summary: string
  }
  kpi_cards?: any[]
  recommended_charts?: any[]
  written_insights?: any[]
  channel_insights?: any[]
  data_quality_notes?: string[]
  client_friendly_closing?: string
}

/* ================= COMPONENT ================= */

const AIInsights = () => {
  const { aiData, range: initialRange } = usePage().props as {
    aiData: AiData | null
    range: string
  }

  const data = aiData

  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState(initialRange || "last_month")

  const handleSync = () => {
    setLoading(true)

    router.post(
      "/insights-sync",
      {},
      {
        preserveState: true,
        replace: true,
        onFinish: () => setLoading(false),
      }
    )
  }

  const handleRangeChange = (r: string) => {
    setRange(r)

    router.get(
      "/insights-data",
      { range: r },
      { preserveState: true, replace: true }
    )
  }

  // Updated chart color palette to lead with the new orange/amber primary brand theme
  const chartColors = ["#ea580c", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

  return (
    <AppLayout>
      <Head title="AI Insights" />

      <style>
        {`button.text-xs.font-semibold.px-4.py-2.rounded-lg.transition-all.text-slate-500.hover\:text-slate-800 {
    display: none;
}`}
      </style>

      <div className="flex flex-col gap-8 p-6  mx-auto w-full bg-slate-50/50 min-h-screen">

        {/* ================= CONTROLS HEADER BAR (SaaS Style) ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["last_month", "this_month"].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  range === r
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r === "last_month" ? "Last Month" : r === "this_month" ? "This Month" : r}
              </button>
            ))}
          </div>

          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </>
            ) : (
              "Sync Data"
            )}
          </button>
        </div>

        {/* ================= SAFE WRAPPER ================= */}
        {data && (
          <>
            {/* ================= TITLE & OVERVIEW HEADLINE ================= */}
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.report_title}
              </h2>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
                  AI-generated performance insights summarizing campaign trends,
                  engagement metrics, conversions, and channel performance for the
                  selected reporting period.
                </p>

                <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    AI Powered
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Monthly Summary
                  </span>
                </div>
              </div>
            </div>

            {/* ================= SECTION: KPI ================= */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Key Performance Indicators
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.kpi_cards?.map((kpi: any, i: number) => {
                  const change = kpi.change_percent ?? kpi.percent_change ?? 0
                  const isUp = kpi.direction === "up" || change >= 0

                  return (
                    <Card
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <p className="text-xs font-medium text-slate-400 truncate w-full">
                          {kpi.title}
                        </p>

                        <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                          {typeof kpi.value === "number"
                            ? kpi.value.toLocaleString()
                            : kpi.value}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                              isUp
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-rose-700 bg-rose-50"
                            }`}
                          >
                            {isUp ? "▲" : "▼"} {Math.abs(change)}%
                          </span>

                          {kpi.comparison_value && (
                            <span className="text-slate-400 font-medium truncate">
                              vs {kpi.comparison_value}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* ================= EXECUTIVE SUMMARY ================= */}
            {data.executive_summary && (
              <Card className="border border-slate-200/80 bg-white shadow-xs overflow-hidden rounded-2xl">
                <div className="border-l-4 border-orange-600 h-full">
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-orange-600">Executive Briefing</p>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      {data.executive_summary.headline}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed">
                    <p>{data.executive_summary.summary}</p>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* ================= SECTION: CHARTS ================= */}
            {data.recommended_charts && data.recommended_charts.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Performance Charts
                  </h3>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {data.recommended_charts.map((chart: any, i: number) => {
                    const chartData = chart.data || []
                    if (!chartData.length) return null

                    const keys = Object.keys(chartData[0]).filter((k) => k !== "name")

                    return (
                      <Card key={i} className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 py-4 px-5">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {chart.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="p-5">
                          <div className="h-[260px] text-[11px] font-medium text-slate-400">

                            {/* LINE CHART */}
                            {chart.chart_type === "line" && (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                                  <YAxis stroke="#94a3b8" tickLine={false} />
                                  <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "15px" }} />
                                  {keys.map((k, idx) => (
                                    <Line
                                      key={idx}
                                      type="monotone"
                                      dataKey={k}
                                      stroke={chartColors[idx % chartColors.length]}
                                      strokeWidth={2.5}
                                      dot={{ r: 3 }}
                                      activeDot={{ r: 5 }}
                                    />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            )}

                            {/* BAR CHART */}
                            {chart.chart_type === "bar" && (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ left: -20, right: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                                  <YAxis stroke="#94a3b8" tickLine={false} />
                                  <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "15px" }} />
                                  {keys.map((k, idx) => (
                                    <Bar
                                      key={idx}
                                      dataKey={k}
                                      fill={chartColors[idx % chartColors.length]}
                                      radius={[4, 4, 0, 0]}
                                      maxBarSize={45}
                                    />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            )}

                            {/* DONUT/PIE CHART */}
                            {chart.chart_type === "donut" && (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={3}
                                  >
                                    {chartData.map((entry: any, idx: number) => (
                                      <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                  <Legend iconType="circle" />
                                </PieChart>
                              </ResponsiveContainer>
                            )}

                            {/* SCORECARD DATA TILES */}
                            {chart.chart_type === "scorecard" && (
                              <div className="grid grid-cols-2 gap-3 h-full items-center">
                                {chartData.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1"
                                  >
                                    <p className="font-semibold text-slate-500 truncate">{item.name}</p>
                                    <p className="text-xl font-bold text-slate-900">{item.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ================= WRITTEN INSIGHTS & CHANNEL BREAKDOWNS ================= */}
            <div className="grid lg:grid-cols-2 gap-6 pt-4">
              
              {/* DEEP-DIVE INSIGHTS */}
              {data.written_insights && data.written_insights.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col">
                  <CardHeader className="border-b border-slate-100 py-4 px-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      General Campaign Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 divide-y divide-slate-100">
                    {data.written_insights.map((ins: any, i: number) => (
                      <div key={i} className="p-5 space-y-1 hover:bg-slate-50/30 transition-colors">
                        <p className="font-bold text-sm text-slate-800">{ins.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{ins.body}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CHANNEL PERFORMANCE INSIGHTS */}
              {data.channel_insights && data.channel_insights.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col">
                  <CardHeader className="border-b border-slate-100 py-4 px-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Channel Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 divide-y divide-slate-100">
                    {data.channel_insights.map((ch: any, i: number) => (
                      <div key={i} className="p-5 space-y-3 hover:bg-slate-50/30 transition-colors">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                            {ch.channel}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{ch.summary}</p>
                        </div>

                        {ch.key_metrics && ch.key_metrics.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {ch.key_metrics.map((m: any, j: number) => (
                              <div key={j} className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                <p className="text-[10px] font-medium text-slate-400 truncate">{m.label}</p>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            </div>

            {/* ================= DATA NOTES CALLOUT ================= */}
            {data.data_quality_notes && data.data_quality_notes.length > 0 && (
              <Card className="border border-amber-200 bg-amber-50/40 rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-5 bg-amber-50 border-b border-amber-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Data Reporting Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-2">
                  {data.data_quality_notes.map((note: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-amber-800">
                      <span className="mt-0.5 select-none">•</span>
                      <p>{note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ================= CLOSING STATEMENT ================= */}
            {data.client_friendly_closing && (
              <div className="text-center py-6">
                <p className="text-xs italic text-slate-400 max-w-xl mx-auto leading-relaxed">
                  "{data.client_friendly_closing}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default AIInsights

