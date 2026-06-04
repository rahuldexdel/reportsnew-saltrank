import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

// Matching exact visual theme color palette from screenshot
const COLORS = ["#f97316", "#374151", "#e5e7eb", "#0d9488", "#fef08a", "#93c5fd"]

const formatNumber = (n: number) => n?.toLocaleString()

// Formats long values to match short dashboard notation (e.g., 36370 -> 36.37k)
const formatChartK = (n: number) => {
  if (!n) return "0"
  if (n >= 1000) {
    return (n / 1000).toFixed(2).replace(/\.00$/, "") + "k"
  }
  return n.toString()
}

const GAdsDemographics = ({ demographics }: any) => {
  if (!demographics) return <div className="p-4 text-center text-gray-500">No Data Available</div> 

  const { gender = [], age = [], devices = [] } = demographics

  // Calculate total aggregations across metrics cards
  const totalGender = gender.reduce((sum: number, g: any) => sum + g.value, 0)
  const totalAge = age.reduce((sum: number, a: any) => sum + a.value, 0)
  const totalDevices = devices.reduce((sum: number, d: any) => sum + d.value, 0)

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* 🔹 GENDER DONUT COMPONENT */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <h4 className="text-gray-900 text-sm font-semibold tracking-tight">
              Impressions by Gender
            </h4>
            
            <div className="relative w-full h-[240px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gender}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {gender.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatNumber(v)} />
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute Central Total Overlay */}
              <div className="absolute text-center select-none pointer-events-none">
                <p className="text-3xl font-normal text-gray-800">
                  {formatChartK(totalGender)}
                </p>
              </div>
            </div>
          </div>

          {/* Inline Legend List Footer Layout */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] font-medium text-gray-600 border-t pt-3">
            {gender.map((item: any, i: number) => (
              <div key={i} className="flex items-center space-x-1.5 truncate">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate uppercase">{item.name}</span>
                <span className="text-gray-400 ml-auto font-normal">{formatChartK(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 HORIZONTAL AGE BAR COMPONENT */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <h4 className="text-gray-900 text-sm font-semibold tracking-tight mb-4">
              Impressions by Age
            </h4>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {/* layout="vertical" flips Recharts components horizontally */}
                <BarChart data={age} layout="vertical" margin={{ top: 0, right: 25, left: -10, bottom: 5 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} tickFormatter={formatChartK} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} width={85} tick={{ fill: '#4b5563' }} />
                  <Tooltip formatter={(v: any) => formatNumber(v)} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Custom Age Metric Base Row Info Panel */}
          <div className="flex items-center space-x-2 text-[11px] font-medium text-gray-600 border-t pt-3">
            <span className="w-3 h-3 bg-[#f97316] rounded-sm flex-shrink-0" />
            <span className="uppercase">Impressions</span>
            <span className="text-gray-400 font-normal">({formatNumber(totalAge)} total)</span>
          </div>
        </div>

        {/* 🔹 DEVICE DONUT COMPONENT */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <h4 className="text-gray-900 text-sm font-semibold tracking-tight">
              Impressions by Device
            </h4>

            <div className="relative w-full h-[240px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {devices.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatNumber(v)} />
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute Central Total Overlay */}
              <div className="absolute text-center select-none pointer-events-none">
                <p className="text-3xl font-normal text-gray-800">
                  {formatChartK(totalDevices)}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic 2-Column Grid Alignment For Device Elements List */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-medium text-gray-600 border-t pt-3">
            {devices.map((item: any, i: number) => (
              <div key={i} className="flex items-center space-x-2 truncate">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate uppercase">{item.name}</span>
                <span className="text-gray-400 ml-auto font-normal pr-1">{formatChartK(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default GAdsDemographics