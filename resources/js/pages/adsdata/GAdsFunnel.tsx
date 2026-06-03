import { useState } from "react"

const GAdsFunnel = ({ overview }: any) => {
  if (!overview) return <div>No Data</div>

  const data = overview?.overview || overview || {}

  const impressions = Number(data.impressions || 0)
  const clicks = Number(data.clicks || 0)
  const conversions = Number(data.conversions || 0)

  // ✅ correct %
  const total = clicks + conversions
  const clickRate = total ? (clicks / total) * 100 : 0
  const conversionRate = total ? (conversions / total) * 100 : 0

  const [tooltip, setTooltip] = useState<any>(null)

  const totalHeight = 240
  const conversionHeight = clicks
    ? Math.max((conversions / clicks) * totalHeight, 20)
    : 20

  const handleMove = (e: any, content: any) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content,
    })
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6 relative">
      <h2 className="text-lg font-semibold mb-6">
        Performance Funnel
      </h2>

      <div className="relative flex justify-center">

        {/* 🔺 FULL TRIANGLE */}
        <div
          className="relative cursor-pointer"
          style={{
            width: "420px",
            height: `${totalHeight}px`,
            clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            background: "#e4570a",
          }}
          onMouseMove={(e) =>
            handleMove(e, {
              title: "Clicks",
              value: clicks,
              percent: clickRate,
            })
          }
          onMouseLeave={() => setTooltip(null)}
        >
          {/* 🔻 Conversions part */}
          <div
            className="absolute bottom-0 w-full"
            style={{
              height: `${conversionHeight}px`,
              background: "#1f2937",
              clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            }}
            onMouseMove={(e) =>
              handleMove(e, {
                title: "Conversions",
                value: conversions,
                percent: conversionRate,
              })
            }
          />
        </div>

        {/* 👉 RIGHT SIDE LABELS */}
        <div className="ml-8 flex flex-col justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-20 h-[1px] bg-gray-300"></div>
            <span className="text-sm text-gray-700">
              Clicks : {clickRate.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-20 h-[1px] bg-gray-300"></div>
            <span className="text-sm text-gray-700">
              Conversions : {conversionRate.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 🔥 TOOLTIP */}
        {tooltip && (
          <div
            className="fixed bg-black text-white text-xs px-3 py-2 rounded shadow z-50 pointer-events-none"
            style={{
              top: tooltip.y + 10,
              left: tooltip.x + 10,
            }}
          >
            <div className="font-semibold">
              {tooltip.content.title}
            </div>
            <div>
              Value: {tooltip.content.value.toLocaleString()}
            </div>
            <div>
              {tooltip.content.percent.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GAdsFunnel