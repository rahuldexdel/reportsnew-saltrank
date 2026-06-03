import React, { useState, useMemo, useRef } from "react"
import { Head, router, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas-pro"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackingPosition {
  id: number
  prompt_id: string
  keyword: string
  tracking_date: string
  position: number | null
  traffic: number | string | null
  traffic_cost: number | string | null
  visibility: number | string | null
  sov: number | string | null
  serp_features: string[]
  raw_data: any
}

interface Campaign {
  id: number
  campaign_id: string
  url: string
  engine: string
  device: string
  language: string
  location_name: string
  keywords_count: number
  tracking_positions: TrackingPosition[]
}

interface Site {
  id: number
  project_name: string
  domain: string
  semrush_campaigns: Campaign[]
}

interface Client {
  id: number
  company_name: string
}

interface SiteOption {
  id: number
  project_name: string
  domain: string
  client_id: number | null
}

interface Props {
  sites: Site[]
  siteOptions: SiteOption[]
  selectedSiteId: number
  clients: Client[]
  selectedClientId: number | null
  range: string
  flash?: string
}

const safeNumber = (value: any): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const toYMD = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function parseDateRange(range: string): { startYMD: string; endYMD: string } {
  const today = new Date()
  if (range.includes(":")) {
    const [s, e] = range.split(":")
    return { startYMD: s.replace(/-/g, ""), endYMD: e.replace(/-/g, "") }
  }
  switch (range) {
    case "7":         return { startYMD: toYMD(subDays(today, 7)), endYMD: toYMD(today) }
    case "30":        return { startYMD: toYMD(subDays(today, 30)), endYMD: toYMD(today) }
    case "this_month":return { startYMD: toYMD(startOfMonth(today)), endYMD: toYMD(endOfMonth(today)) }
    case "last_month":{
      const lm = subMonths(today, 1)
      return { startYMD: toYMD(startOfMonth(lm)), endYMD: toYMD(endOfMonth(lm)) }
    }
    default: return { startYMD: toYMD(subDays(today, 7)), endYMD: toYMD(today) }
  }
}

const getDateRangeFromPreset = (preset: string): DateRange => {
  const today = new Date()
  switch (preset) {
    case "7":          return { from: subDays(today, 7), to: today }
    case "30":         return { from: subDays(today, 30), to: today }
    case "this_month": return { from: startOfMonth(today), to: endOfMonth(today) }
    case "last_month": {
      const lm = subMonths(today, 1)
      return { from: startOfMonth(lm), to: endOfMonth(lm) }
    }
    default: return { from: subDays(today, 7), to: today }
  }
}

const formatDisplayRange = (range?: DateRange) => {
  if (!range?.from || !range?.to) return "Select Date"
  return `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`
}

// ─── Core Data Functions ───────────────────────────────────────────────────────

function aggregateKeywords(
  positions: TrackingPosition[],
  startYMD: string,
  endYMD: string
) {
  const map = new Map<string, {
    keyword: string
    prompt_id: string
    latestPos: number | null
    firstPos: number | null
    bestPos: number | null
    positions: { date: string; pos: number | null }[]
    avgPosition: number | null
    visibility: number
    firstVis: number
    visibilityDiff: number
    traffic: number
    sov: number
    serpFeatures: string[]
    rawDiff: number | null
  }>()

  for (const tp of positions) {
    const raw    = tp.raw_data || {}
    const urlKey = Object.keys(raw.Fi || {})[0] || ""

    const dailyPositions: { date: string; pos: number | null }[] = []
    for (const [dateStr, vals] of Object.entries(raw.Dt || {})) {
      if (dateStr < startYMD || dateStr > endYMD) continue
      const v = (vals as Record<string, unknown>)[urlKey]
      dailyPositions.push({
        date: dateStr,
        pos: (v === "-" || v === undefined || v === null) ? null : Number(v),
      })
    }
    dailyPositions.sort((a, b) => a.date.localeCompare(b.date))

    if (dailyPositions.length === 0) {
      if (!map.has(tp.prompt_id)) {
        map.set(tp.prompt_id, {
          keyword: tp.keyword, prompt_id: tp.prompt_id,
          latestPos: null, firstPos: null, bestPos: null,
          positions: [], avgPosition: null,
          visibility: 0, firstVis: 0, visibilityDiff: 0,
          traffic: 0, sov: 0, serpFeatures: [], rawDiff: null,
        })
      }
      continue
    }

    const firstEntry = dailyPositions[0]
    const lastEntry  = dailyPositions[dailyPositions.length - 1]
    const firstPos   = firstEntry.pos
    const latestPos  = lastEntry.pos
    const nonNull    = dailyPositions.map(p => p.pos).filter((p): p is number => p !== null)
    const bestPos    = nonNull.length > 0 ? Math.min(...nonNull) : null
    const avgPosition= nonNull.length > 0 ? nonNull.reduce((a, b) => a + b, 0) / nonNull.length : null
    const rawDiff    = firstPos !== null && latestPos !== null ? firstPos - latestPos : null

    const viData = raw.Vi || {}
    const latestVis: number = (() => {
      if (urlKey && lastEntry?.date) {
        const db = viData[lastEntry.date] as Record<string, unknown> | undefined
        if (db && db[urlKey] !== undefined) return safeNumber(db[urlKey])
      }
      return safeNumber(tp.visibility)
    })()
    const firstVis: number = (() => {
      if (urlKey && firstEntry?.date) {
        const db = viData[firstEntry.date] as Record<string, unknown> | undefined
        if (db && db[urlKey] !== undefined) return safeNumber(db[urlKey])
      }
      return latestVis
    })()
    const visibilityDiff = latestVis - firstVis

    const sfData = raw.Sf || {}
    const serpFeatures: string[] = Array.isArray(sfData[lastEntry.date])
      ? (sfData[lastEntry.date] as string[])
      : (Array.isArray(tp.serp_features) ? tp.serp_features : [])

    const trData  = raw.Tr  || {}
    const sovData = raw.Sov || {}
    const traffic: number = (() => {
      if (urlKey && lastEntry?.date) {
        const db = trData[lastEntry.date] as Record<string, unknown> | undefined
        if (db && db[urlKey] !== undefined) return safeNumber(db[urlKey])
      }
      return safeNumber(tp.traffic)
    })()
    const sov: number = (() => {
      if (urlKey && lastEntry?.date) {
        const db = sovData[lastEntry.date] as Record<string, unknown> | undefined
        if (db && db[urlKey] !== undefined) return safeNumber(db[urlKey])
      }
      return safeNumber(tp.sov)
    })()

    if (!map.has(tp.prompt_id)) {
      map.set(tp.prompt_id, {
        keyword: tp.keyword, prompt_id: tp.prompt_id,
        latestPos, firstPos, bestPos, positions: dailyPositions,
        avgPosition, visibility: latestVis, firstVis, visibilityDiff,
        traffic, sov, serpFeatures, rawDiff,
      })
    } else {
      const ex = map.get(tp.prompt_id)!
      if (dailyPositions.length > ex.positions.length) {
        Object.assign(ex, {
          latestPos, firstPos, bestPos, positions: dailyPositions,
          avgPosition, visibility: latestVis, firstVis, visibilityDiff,
          traffic, sov, serpFeatures, rawDiff,
        })
      }
    }
  }

  return Array.from(map.values())
}

type AggregatedKeyword = ReturnType<typeof aggregateKeywords>[number]

function computeMetrics(keywords: AggregatedKeyword[]) {
  const ranked   = keywords.filter(k => k.latestPos !== null)
  const top3     = ranked.filter(k => k.latestPos! <= 3)
  const top10    = ranked.filter(k => k.latestPos! <= 10)
  const top20    = ranked.filter(k => k.latestPos! <= 20)
  const kwsWithAvg = keywords.filter(k => k.avgPosition !== null)
  const avgPos = kwsWithAvg.length
    ? kwsWithAvg.reduce((a, k) => a + k.avgPosition!, 0) / kwsWithAvg.length
    : null
  const totalVis       = keywords.reduce((a, k) => a + k.visibility, 0)
  const improved       = keywords.filter(k => k.rawDiff !== null && k.rawDiff > 0)
  const declined       = keywords.filter(k => k.rawDiff !== null && k.rawDiff < 0)
  const positiveImpact = keywords.filter(k => k.visibilityDiff > 0).sort((a, b) => b.visibilityDiff - a.visibilityDiff)
  const negativeImpact = keywords.filter(k => k.visibilityDiff < 0).sort((a, b) => a.visibilityDiff - b.visibilityDiff)
  const topByVis = [...keywords].sort((a, b) => b.visibility - a.visibility).slice(0, 5)
  return { ranked, top3, top10, top20, avgPos, totalVis, improved, declined, positiveImpact, negativeImpact, topByVis }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MicroSparkline({ values, color = "#da7843" }: { values: (number | null)[]; color?: string }) {
  const nums = values.map(v => v ?? 0)
  const max  = Math.max(...nums, 1)
  const h = 28, w = 6, gap = 2
  return (
    <svg width={values.length * (w + gap)} height={h} viewBox={`0 0 ${values.length * (w + gap)} ${h}`}>
      {nums.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * (h - 4)))
        return <rect key={i} x={i * (w + gap)} y={h - barH} width={w} height={barH} rx="1" fill={v > 0 ? color : "#E8DDD3"} />
      })}
    </svg>
  )
}

function PositionBadge({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="inline-flex items-center justify-center w-8 h-6 text-xs text-gray-400">–</span>
  const cls = pos === 1
    ? "bg-[#FAE8D8] text-[#7A2E04]"
    : pos <= 3  ? "bg-[#FAE8D8] text-[#D4510A]"
    : pos <= 10 ? "bg-[#F5EDE0] text-[#A3400C]"
    : "bg-gray-100 text-gray-600"
  return <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-medium ${cls}`}>{pos}</span>
}

function DeltaBadge({ diff }: { diff: number | null }) {
  if (diff === null) return null
  if (diff > 0) return <span className="text-xs text-green-600 ml-1">↑{diff}</span>
  if (diff < 0) return <span className="text-xs text-red-500 ml-1">↓{Math.abs(diff)}</span>
  return <span className="text-xs text-gray-400 ml-1">—</span>
}

function ImprovedDeclinedArc({ improved, declined }: { improved: number; declined: number }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-xl font-semibold text-green-600">{improved}</span>
      <svg width="36" height="20" viewBox="0 0 36 20">
        <path d="M2 19 Q18 2 34 19" stroke="#da7843" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="text-xl font-semibold text-gray-300">{declined}</span>
    </div>
  )
}

function PromptsPanel({ top3, top10, top20, improved, declined }: {
  top3: number; top10: number; top20: number; improved: number; declined: number
}) {
  const tiers = [
    { label: "Top 3",  count: top3  },
    { label: "Top 10", count: top10 },
    { label: "Top 20", count: top20 },
  ]
  return (
    <div className="divide-y divide-[#EDE0D4]">
      {tiers.map(tier => (
        <div key={tier.label} className="flex items-center justify-between py-3">
          <div>
            <div className="text-xs text-gray-500">{tier.label}</div>
            <div className="text-2xl font-semibold">{tier.count}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">New</div>
            <div className="font-medium">{tier.count}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Lost</div>
            <div className="font-medium text-gray-400">0</div>
          </div>
          <div className="flex items-end gap-0.5 h-6">
            {[0, 0, 0, 0, tier.count > 0 ? 1 : 0].map((v, i) => (
              <div key={i} className="w-1.5 rounded-sm" style={{
                height: v > 0 ? "16px" : "4px",
                backgroundColor: v > 0 ? "#da7843" : "#E8DDD3"
              }} />
            ))}
            <div className="w-2 h-2 rounded-full mb-0.5 ml-0.5" style={{ backgroundColor: "#da7843" }} />
          </div>
        </div>
      ))}
      <div className="pt-3">
        <div className="text-xs text-gray-500 mb-1">Improved vs. declined</div>
        <ImprovedDeclinedArc improved={improved} declined={declined} />
      </div>
    </div>
  )
}

function SummaryCard({ campaign, metrics, domain }: {
  campaign: Campaign
  metrics: ReturnType<typeof computeMetrics>
  domain: string
}) {
  const totalVisGain = metrics.positiveImpact.reduce((a, k) => a + k.visibilityDiff, 0)
  return (
    <div className="rounded-xl border border-[#EDE0D4] p-4 text-sm text-gray-700 leading-relaxed h-full" style={{ backgroundColor: "#FBF5EF" }}>
      <div className="font-semibold text-gray-900 mb-2">Summary</div>
      <p className="mb-2">
        Traffic performance of <span className="font-semibold text-[#D4510A]">{domain}</span> for{" "}
        {campaign.location_name} (Google AI Mode · {campaign.language ?? "English"} · {campaign.device}) improved.
        {totalVisGain > 0 && ` Visibility up by ${totalVisGain.toFixed(2)}%.`}
      </p>
      <ul className="list-disc pl-4 space-y-1 text-gray-600 text-xs">
        {metrics.improved.length > 0 && (
          <li>{metrics.improved.length} prompt{metrics.improved.length > 1 ? "s" : ""}'s position improved.</li>
        )}
        {metrics.top3.length > 0 && (
          <li>
            Domain has {metrics.top3.length} new prompt{metrics.top3.length > 1 ? "s" : ""} in the top 3.
            {metrics.top10.length > 0 && ` Also ${metrics.top10.length} in the top 10.`}
          </li>
        )}
        {metrics.positiveImpact.slice(0, 2).map(k => (
          <li key={k.prompt_id}>
            Visibility changed for: <span className="text-[#D4510A] font-medium">{k.keyword}</span>
            {` (+${k.visibilityDiff.toFixed(2)}%`}
            {k.rawDiff !== null && k.rawDiff !== 0 && `, ${k.rawDiff > 0 ? "↑" : "↓"}${Math.abs(k.rawDiff)}`})
          </li>
        ))}
        {metrics.ranked.length === 0 && (
          <li>No keywords currently ranking in the selected date range.</li>
        )}
      </ul>
    </div>
  )
}

// ─── Campaign Dashboard ────────────────────────────────────────────────────────

function CampaignDashboard({ campaign, domain, range }: {
  campaign: Campaign; domain: string; range: string
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "keywords">("overview")
  const [kwSearch,  setKwSearch]  = useState("")
  const [posFilter, setPosFilter] = useState("all")

  const { startYMD, endYMD } = useMemo(() => parseDateRange(range), [range])
  const keywords = useMemo(
    () => aggregateKeywords(campaign.tracking_positions, startYMD, endYMD),
    [campaign.tracking_positions, startYMD, endYMD]
  )
  const metrics = useMemo(() => computeMetrics(keywords), [keywords])

  const filteredKeywords = useMemo(() => {
    let kws = keywords
    if (kwSearch)              kws = kws.filter(k => k.keyword.toLowerCase().includes(kwSearch.toLowerCase()))
    if (posFilter === "top3")  kws = kws.filter(k => k.latestPos !== null && k.latestPos <= 3)
    else if (posFilter === "top10")  kws = kws.filter(k => k.latestPos !== null && k.latestPos <= 10)
    else if (posFilter === "top20")  kws = kws.filter(k => k.latestPos !== null && k.latestPos <= 20)
    else if (posFilter === "norank") kws = kws.filter(k => k.latestPos === null)
    return kws.sort((a, b) => {
      if (a.latestPos === null && b.latestPos === null) return 0
      if (a.latestPos === null) return 1
      if (b.latestPos === null) return -1
      return a.latestPos - b.latestPos
    })
  }, [keywords, kwSearch, posFilter])

  const allDates = useMemo(() => {
    const s = new Set<string>()
    for (const kw of keywords) kw.positions.forEach(p => s.add(p.date))
    return Array.from(s).sort()
  }, [keywords])

  const rankingsByDate = useMemo(() => allDates.map(date => {
    let t1 = 0, t4 = 0, t11 = 0
    for (const kw of keywords) {
      const entry = kw.positions.find(p => p.date === date)
      const pos   = entry?.pos ?? null
      if (pos === null) continue
      if (pos <= 3) t1++
      else if (pos <= 10) t4++
      else if (pos <= 20) t11++
    }
    return { date, t1, t4, t11 }
  }), [keywords, allDates])

  const maxBarVal = Math.max(...rankingsByDate.map(d => d.t1 + d.t4 + d.t11), 1)

  const fmtDate = (d: string) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `${months[parseInt(d.slice(4, 6)) - 1]} ${parseInt(d.slice(6, 8))}`
  }

  const visSparkline = useMemo(() => allDates.map(date => {
    let sum = 0
    for (const kw of keywords) {
      const entry = kw.positions.find(p => p.date === date)
      if (entry?.pos !== null && entry?.pos !== undefined) sum += kw.visibility
    }
    return sum
  }), [keywords, allDates])

  const mentionsSparkline = useMemo(() => allDates.map(date =>
    keywords.filter(kw => {
      const entry = kw.positions.find(p => p.date === date)
      return entry?.pos !== null && entry?.pos !== undefined
    }).length
  ), [keywords, allDates])

  const avgPosSparkline = useMemo(() => allDates.map(date => {
    const ranked = keywords
      .map(kw => kw.positions.find(p => p.date === date)?.pos ?? null)
      .filter((p): p is number => p !== null)
    if (!ranked.length) return null
    return ranked.reduce((a, b) => a + b, 0) / ranked.length
  }), [keywords, allDates])

  return (
    <div className="border border-[#EDE0D4] rounded-xl overflow-hidden bg-white">
      {/* Campaign header */}
      <div className="border-b border-[#EDE0D4] px-5 py-3 flex flex-wrap gap-6 items-center" style={{ backgroundColor: "#F5EDE0" }}>
  <div>
          <div className="text-xs text-gray-500">Engine</div>
              {campaign.engine === "google" ? (
                <div className="font-medium text-sm capitalize">
                  {campaign.engine ?? "Google"} - Organic Data
                </div>
              ) : (
                <div className="font-medium text-sm capitalize">
                  {campaign.engine ?? "Google"}
                </div>
              )}
          </div>

        <div>
          <div className="text-xs text-gray-500">Location</div>
          <div className="font-medium text-sm">{campaign.location_name ?? "–"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Device</div>
          <div className="font-medium text-sm capitalize">{campaign.device ?? "–"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Keywords tracked</div>
          <div className="font-medium text-sm">{campaign.keywords_count}</div>
        </div>
        <div className="ml-auto flex gap-2">
          {(["overview", "keywords"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors capitalize ${
                activeTab === tab
                  ? "text-white border-[#D4510A]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-[#FAE8D8]"
              }`}
              style={activeTab === tab ? { backgroundColor: "#da7843" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="p-5 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 border border-[#EDE0D4] rounded-xl p-4 space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Visibility</div>
              <div className="pb-3 border-b border-[#EDE0D4]">
                <div className="text-xs text-gray-500 mb-0.5">Visibility</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{metrics.totalVis.toFixed(2)}%</span>
                  {metrics.positiveImpact.length > 0 && (
                    <span className="text-xs text-green-600">
                      +{metrics.positiveImpact.reduce((a, k) => a + k.visibilityDiff, 0).toFixed(2)}%
                    </span>
                  )}
                  {metrics.negativeImpact.length > 0 && metrics.positiveImpact.length === 0 && (
                    <span className="text-xs text-red-500">
                      {metrics.negativeImpact.reduce((a, k) => a + k.visibilityDiff, 0).toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="mt-2"><MicroSparkline values={visSparkline} color="#da7843" /></div>
              </div>
              <div className="pb-3 border-b border-[#EDE0D4]">
                <div className="text-xs text-gray-500 mb-0.5">Mentions</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{metrics.ranked.length}</span>
                  <span className="text-xs text-green-600">+{metrics.ranked.length}</span>
                </div>
                <div className="mt-2"><MicroSparkline values={mentionsSparkline} color="#da7843" /></div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Average position</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {metrics.avgPos !== null ? metrics.avgPos.toFixed(2) : "–"}
                  </span>
                  {metrics.improved.length > 0 && metrics.improved[0].rawDiff !== null && (
                    <span className="text-xs text-green-600">↑{metrics.improved[0].rawDiff}</span>
                  )}
                </div>
                <div className="mt-2"><MicroSparkline values={avgPosSparkline} color="#da7843" /></div>
              </div>
            </div>
            <div className="col-span-3">
              <SummaryCard campaign={campaign} metrics={metrics} domain={domain} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3 border border-[#EDE0D4] rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rankings Distribution</div>
              <div className="flex gap-4 mb-3 text-xs">
                {[
                  { label: "#1–3", color: "#da7843" },
                  { label: "#4–10", color: "#d1b19f" },
                  { label: "#11–20", color: "#F5A57A" },
                  { label: "Out of top 20", color: "#E8DDD3" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color, border: l.color === "#E8DDD3" ? "1px solid #ccc" : "none" }} />
                    <span className="text-gray-600">{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-1 h-36 mt-2">
                {rankingsByDate.map(d => {
                  const total   = d.t1 + d.t4 + d.t11
                  const outTop20 = (d as any).out || 0
                  const maxH    = 120
                  const h       = total > 0 ? Math.max(8, Math.round((total / maxBarVal) * maxH)) : 4
                  const tooltipText = `${fmtDate(d.date)}\n#1–3: ${d.t1}\n#4–10: ${d.t4}\n#11–20: ${d.t11}\nOut of top 20: ${outTop20}\nTotal ranked: ${total}`
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-0 cursor-pointer" title={tooltipText}>
                      <div className="flex flex-col justify-end w-full" style={{ height: maxH }}>
                        {total === 0 ? (
                          <div className="w-full rounded-t-sm" style={{ height: 4, backgroundColor: "#E8DDD3" }} />
                        ) : (
                          <div className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse" style={{ height: h }}>
                            {d.t1  > 0 && <div className="w-full" style={{ flex: d.t1,  backgroundColor: "#da7843" }} />}
                            {d.t4  > 0 && <div className="w-full" style={{ flex: d.t4,  backgroundColor: "#e6a887" }} />}
                            {d.t11 > 0 && <div className="w-full" style={{ flex: d.t11, backgroundColor: "#F5A57A" }} />}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(d.date)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="col-span-2 border border-[#EDE0D4] rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Keyword</div>
              <PromptsPanel
                top3={metrics.top3.length} top10={metrics.top10.length}
                top20={metrics.top20.length} improved={metrics.improved.length}
                declined={metrics.declined.length}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-[#EDE0D4] rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Keyword</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#EDE0D4]">
                    <th className="text-left pb-2 font-medium text-gray-500">Keyword</th>
                    <th className="text-right pb-2 font-medium text-gray-500">Pos.</th>
                    <th className="text-right pb-2 font-medium text-gray-500">AI Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topByVis.map(kw => (
                    <tr key={kw.prompt_id} className="border-b border-[#EDE0D4] last:border-0">
                      <td className="py-2 pr-2 max-w-[160px]" style={{ color: "#000000" }}>
                        <div className="truncate" title={kw.keyword}>{kw.keyword}</div>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <span className="text-gray-700">{kw.latestPos ?? "–"}</span>
                        {kw.rawDiff !== null && kw.rawDiff > 0 && <span className="text-green-600 ml-1">↑{kw.rawDiff}</span>}
                        {kw.rawDiff !== null && kw.rawDiff < 0 && <span className="text-red-500 ml-1">↓{Math.abs(kw.rawDiff)}</span>}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {kw.visibility > 0 ? `${kw.visibility.toFixed(2)}%` : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-[#EDE0D4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Positive Impact</div>
                {metrics.positiveImpact.length > 0 && (
                  <span className="text-xs font-semibold text-green-600">
                    +{metrics.positiveImpact.reduce((a, k) => a + k.visibilityDiff, 0).toFixed(2)}%
                  </span>
                )}
              </div>
              {metrics.positiveImpact.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">We have no data to show.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE0D4]">
                      <th className="text-left pb-2 font-medium text-gray-500">Prompt</th>
                      <th className="text-right pb-2 font-medium text-gray-500">AI Visibility gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.positiveImpact.slice(0, 5).map(kw => (
                      <tr key={kw.prompt_id} className="border-b border-[#EDE0D4] last:border-0">
                        <td className="py-2 pr-2 max-w-[160px]" style={{ color: "#0f0601" }}>
                          <div className="truncate" title={kw.keyword}>{kw.keyword}</div>
                        </td>
                        <td className="py-2 text-right font-medium text-green-600">+{kw.visibilityDiff.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border border-[#EDE0D4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Negative Impact</div>
                {metrics.negativeImpact.length > 0 && (
                  <span className="text-xs font-semibold text-red-500">
                    {metrics.negativeImpact.reduce((a, k) => a + k.visibilityDiff, 0).toFixed(2)}%
                  </span>
                )}
              </div>
              {metrics.negativeImpact.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">We have no data to show.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE0D4]">
                      <th className="text-left pb-2 font-medium text-gray-500">Prompt</th>
                      <th className="text-right pb-2 font-medium text-gray-500">AI Visibility loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.negativeImpact.slice(0, 5).map(kw => (
                      <tr key={kw.prompt_id} className="border-b border-[#EDE0D4] last:border-0">
                        <td className="py-2 pr-2 max-w-[160px]" style={{ color: "#000000" }}>
                          <div className="truncate" title={kw.keyword}>{kw.keyword}</div>
                        </td>
                        <td className="py-2 text-right font-medium text-red-500">{kw.visibilityDiff.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Keywords tab ── */
        <div className="p-5">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search keywords…"
              value={kwSearch}
              onChange={e => setKwSearch(e.target.value)}
              className="border border-[#EDE0D4] rounded-md px-3 py-1.5 text-sm flex-1 max-w-xs focus:outline-none focus:ring-1 focus:ring-[#D4510A] focus:border-[#D4510A]"
            />
            <select
              value={posFilter}
              onChange={e => setPosFilter(e.target.value)}
              className="border border-[#EDE0D4] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4510A]"
            >
              <option value="all">All positions</option>
              <option value="top3">Top 3</option>
              <option value="top10">Top 10</option>
              <option value="top20">Top 20</option>
              <option value="norank">Not ranking</option>
            </select>
            <div className="text-xs text-gray-500 self-center ml-auto">
              {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="border border-[#EDE0D4] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500" style={{ backgroundColor: "#F5EDE0" }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium border-b border-[#EDE0D4] w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium border-b border-[#EDE0D4]">Keyword</th>
                  <th className="text-right px-4 py-3 font-medium border-b border-[#EDE0D4]">Position</th>
                  <th className="text-right px-4 py-3 font-medium border-b border-[#EDE0D4]">Best</th>
                  <th className="text-left px-4 py-3 font-medium border-b border-[#EDE0D4]">Trend</th>
                  <th className="text-right px-4 py-3 font-medium border-b border-[#EDE0D4]">Visibility</th>
                  <th className="text-right px-4 py-3 font-medium border-b border-[#EDE0D4]">Traffic</th>
                  <th className="text-left px-4 py-3 font-medium border-b border-[#EDE0D4]">SERP Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE0D4]">
                {filteredKeywords.map((kw, i) => (
                  <tr key={kw.prompt_id} className="hover:bg-[#FBF5EF]">
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900 max-w-xs truncate" title={kw.keyword}>{kw.keyword}</div>
                      <div className="text-xs text-gray-400 mt-0.5">ID: {kw.prompt_id.slice(0, 12)}…</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PositionBadge pos={kw.latestPos} />
                        <DeltaBadge diff={kw.rawDiff} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-green-600 font-medium">{kw.bestPos ?? "–"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <MicroSparkline
                        values={allDates.map(d => { const e = kw.positions.find(p => p.date === d); return e?.pos ?? null })}
                        color="#da7843"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {kw.visibility > 0 ? (
                        <span>
                          {kw.visibility.toFixed(2)}<span className="text-gray-400">%</span>
                          {kw.visibilityDiff !== 0 && (
                            <span className={`ml-1 text-xs ${kw.visibilityDiff > 0 ? "text-green-600" : "text-red-500"}`}>
                              {kw.visibilityDiff > 0 ? "+" : ""}{kw.visibilityDiff.toFixed(2)}%
                            </span>
                          )}
                        </span>
                      ) : <span className="text-gray-400">0%</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {safeNumber(kw.traffic) > 0 ? safeNumber(kw.traffic).toFixed(1) : "0"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {kw.serpFeatures.length > 0
                          ? kw.serpFeatures.map(f => (
                              <span key={f} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FAE8D8", color: "#da7843" }}>{f}</span>
                            ))
                          : <span className="text-gray-400 text-xs">–</span>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredKeywords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                      No keywords match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SemrushAI() {
  const { sites, siteOptions, selectedSiteId, clients, selectedClientId, flash, range = "7" } = usePage<Props>().props

  const [open1,        setOpen1]        = useState(false)
  const [customRange,  setCustomRange]  = useState<DateRange | undefined>(getDateRangeFromPreset(range))
  const [tempRange,    setTempRange]    = useState<DateRange | undefined>(getDateRangeFromPreset(range))
  const [pdfLoading,   setPdfLoading]   = useState(false)

  // ── ref wraps only the dashboard content (excludes header controls) ──────────
  const dashboardRef = useRef<HTMLDivElement>(null)

  const syncData = () => {
    router.post("/insights/semrush-ai/sync", {}, { preserveScroll: true })
  }

  const fetchData = (selectedRange: string) => {
    router.get(
      "/insights/semrush-ai",
      { range: selectedRange, site_id: selectedSiteId, client_id: selectedClientId },
      { preserveScroll: true, preserveState: true }
    )
  }

  const changeClient = (clientId: string) => {
    router.get(
      "/insights/semrush-ai",
      { client_id: clientId, range },
      { preserveScroll: true, preserveState: false }
    )
  }

  const changeSite = (siteId: string) => {
    router.get(
      "/insights/semrush-ai",
      { site_id: siteId, client_id: selectedClientId, range },
      { preserveScroll: true, preserveState: false }
    )
  }

  const generatePDF = async () => {
  const element = dashboardRef.current
  if (!element) return

  setPdfLoading(true)

  try {
    // Temporarily expand element to full scroll dimensions so nothing is clipped
    const originalStyle = element.getAttribute("style") || ""
    element.style.width  = element.scrollWidth  + "px"
    element.style.height = element.scrollHeight + "px"
    element.style.overflow = "visible"

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth:  element.scrollWidth,
      windowHeight: element.scrollHeight,
      width:        element.scrollWidth,
      height:       element.scrollHeight,
      x: 0,
      y: 0,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
    })

    // Restore original styles
    element.setAttribute("style", originalStyle)

    const imgData   = canvas.toDataURL("image/png")
    const imgWidth  = canvas.width   // pixels (scale: 2, so 2× real px)
    const imgHeight = canvas.height

    // A4 landscape: 297mm × 210mm
    const pdf   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageW = pdf.internal.pageSize.getWidth()   // 297
    const pageH = pdf.internal.pageSize.getHeight()  // 210

    // Convert canvas pixels → mm (96 dpi × scale:2 = 192 dpi effective)
    const DPI        = 192
    const MM_PER_IN  = 25.4
    const totalWmm   = (imgWidth  / DPI) * MM_PER_IN
    const totalHmm   = (imgHeight / DPI) * MM_PER_IN

    // Fit width to page; if content is narrower than page, don't upscale beyond pageW
    const fitScale  = Math.min(pageW / totalWmm, 1)
    const scaledW   = totalWmm * fitScale
    const scaledH   = totalHmm * fitScale

    // Center horizontally if narrower than page
    const xOffset   = (pageW - scaledW) / 2

    const pageCount = Math.ceil(scaledH / pageH)

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) pdf.addPage()
      pdf.addImage(
        imgData,
        "PNG",
        xOffset,
        -(i * pageH),   // shift image up by one page per iteration
        scaledW,
        scaledH
      )
    }

    const siteName = sites[0]?.project_name ?? "semrush-dashboard"
    const dateStr  = format(new Date(), "yyyy-MM-dd")
    pdf.save(`${siteName.toLowerCase().replace(/\s+/g, "-")}-${dateStr}.pdf`)
  } catch (err) {
    console.error("PDF generation failed:", err)
    // Ensure styles are restored even on error
    dashboardRef.current?.setAttribute("style", "")
  } finally {
    setPdfLoading(false)
  }
}

  return (
    <AppLayout>
      <Head title="SEMrush AI" />

      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">SEMrush AI Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Sites, Campaigns & Tracking Data</p>
            <div className="flex items-center gap-3 mt-8">
              {/* Client dropdown */}
              <select
                value={selectedClientId || ""}
                onChange={(e) => changeClient(e.target.value)}
                className="h-10 rounded-md border border-[#EDE0D4] bg-white px-3 text-sm min-w-[200px] focus:outline-none focus:ring-1 focus:ring-[#D4510A] focus:border-[#D4510A]"
              >
                <option value="">-- All Clients --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.company_name}</option>
                ))}
              </select>

              {/* Site dropdown */}
              <select
                value={selectedSiteId || ""}
                onChange={(e) => changeSite(e.target.value)}
                className="h-10 rounded-md border border-[#EDE0D4] bg-white px-3 text-sm min-w-[280px] focus:outline-none focus:ring-1 focus:ring-[#D4510A] focus:border-[#D4510A]"
              >
                {siteOptions.length === 0 ? (
                  <option value="">-- No sites for this client --</option>
                ) : (
                  siteOptions.map((site) => (
                    <option key={site.id} value={site.id}>{site.project_name} - {site.domain}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex flex-col items-end">
              {/* Date range picker */}
              <Popover open={open1} onOpenChange={setOpen1}>
                <PopoverTrigger asChild>
                  <button
                    className="text-sm font-semibold border-b-2"
                    style={{
                      color: customRange ? "#1a1a1a" : "#9ca3af",
                      borderBottomColor: customRange ? "#da7843" : "transparent",
                    }}
                  >
                    {formatDisplayRange(customRange)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 rounded-xl shadow-xl border bg-white w-auto">
                  <div className="flex flex-col gap-3">
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      selected={tempRange}
                      onSelect={setTempRange}
                      className="rounded-md border shadow-sm"
                      classNames={{
                        day_selected: "text-white hover:text-white",
                        day_today: "bg-muted font-semibold",
                        day: "w-9 h-9 p-0 text-sm hover:bg-[#FAE8D8] rounded-md",
                        head_cell: "text-xs text-muted-foreground font-medium",
                        nav_button: "h-7 w-7 bg-transparent hover:bg-[#FAE8D8] rounded-md",
                        caption: "text-sm font-semibold text-center mb-2",
                      }}
                    />
                    <div className="flex justify-end gap-2 px-1 pb-1">
                      <button
                        className="px-3 py-1 text-xs rounded-md border bg-gray-100 hover:bg-gray-200"
                        onClick={() => setOpen1(false)}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!tempRange?.from || !tempRange?.to}
                        className="px-3 py-1 text-xs rounded-md text-white disabled:opacity-40"
                        style={{ backgroundColor: "#da7843" }}
                        onClick={() => {
                          if (!tempRange?.from || !tempRange?.to) return
                          const formatted = `${format(tempRange.from, "yyyy-MM-dd")}:${format(tempRange.to, "yyyy-MM-dd")}`
                          setCustomRange(tempRange)
                          fetchData(formatted)
                          setOpen1(false)
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Preset range buttons */}
              <div className="flex items-center mt-1.5 gap-3">
                {(["7", "30", "this_month", "last_month"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      const dr = getDateRangeFromPreset(r)
                      setCustomRange(dr)
                      setTempRange(dr)
                      fetchData(r)
                    }}
                    className="text-xs border-b-2 transition-colors"
                    style={{
                      color: range === r ? "#da7843" : "#4b5563",
                      borderBottomColor: range === r ? "#da7843" : "transparent",
                    }}
                  >
                    {r === "7" ? "7 Days" : r === "30" ? "30 Days" : r === "this_month" ? "This Month" : "Last Month"}
                  </button>
                ))}
              </div>
            </div>

            {/* Export PDF button */}
            <button
              onClick={generatePDF}
              disabled={pdfLoading || sites.length === 0}
              className="h-10 px-4 rounded-md text-sm font-medium border transition-all hover:opacity-80 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "#da7843", color: "#da7843", backgroundColor: "white" }}
            >
              {pdfLoading ? (
                <>
                  {/* Spinner */}
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  {/* Download icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  Export PDF
                </>
              )}
            </button>

            {/* Sync Data button */}
            <button
              onClick={syncData}
              className="h-10 px-4 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#da7843" }}
            >
              Sync Data
            </button>
          </div>
        </div>

        {/* Flash */}
        {flash && (
          <div className="p-4 rounded-lg border text-sm" style={{ backgroundColor: "#FAE8D8", borderColor: "#da7843", color: "#7A2E04" }}>
            {flash}
          </div>
        )}

        {/* ── Dashboard content captured for PDF ── */}
        <div ref={dashboardRef} className="space-y-8">
          {sites.map(site => (
            <div key={site.id} className="space-y-4">
              {/* Site header */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black text-white">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{ backgroundColor: "#da7843" }}
                >
                  {site.domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{site.project_name}</div>
                  <div className="text-xs text-gray-400">
                    {site.domain} · {site.semrush_campaigns.length} campaign{site.semrush_campaigns.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {site.semrush_campaigns.map(campaign => (
                  <CampaignDashboard
                    key={campaign.id}
                    campaign={campaign}
                    domain={site.domain}
                    range={range}
                  />
                ))}
              </div>
            </div>
          ))}

          {sites.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-lg font-medium mb-1">No sites found</div>
              <div className="text-sm">Make sure sites have a project_id and sync data first.</div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
