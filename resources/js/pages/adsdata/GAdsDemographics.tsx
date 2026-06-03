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

const COLORS = ["#ea580c", "#1f2937", "#d1d5db", "#22c55e", "#3b82f6"]

const formatNumber = (n: number) => n?.toLocaleString()

const GAdsDemographics = ({ demographics }: any) => {


  if (!demographics) return  <div>No Data</div>; 

  const { gender = [], age = [], devices = [] } = demographics

  const totalGender = gender.reduce((sum: number, g: any) => sum + g.value, 0)
  const totalDevices = devices.reduce((sum: number, d: any) => sum + d.value, 0)

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-6">

      <h3 className="font-bold text-2xl text-center bg-black text-white py-2">
        Demographics
      </h3>

      <div className="grid md:grid-cols-3 gap-6">

        {/* 🔹 GENDER */}
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Impressions by Gender
          </h4>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={gender}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
              >
                {gender.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatNumber(v)} />
            </PieChart>
          </ResponsiveContainer>

          <p className="text-center font-semibold">
            {formatNumber(totalGender)}
          </p>
        </div>

        {/* 🔹 AGE */}
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Impressions by Age
          </h4>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={age}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: any) => formatNumber(v)} />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 DEVICE */}
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Impressions by Device
          </h4>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={devices}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
              >
                {devices.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatNumber(v)} />
            </PieChart>
          </ResponsiveContainer>

          <p className="text-center font-semibold">
            {formatNumber(totalDevices)}
          </p>
        </div>

      </div>
    </div>
  )
}

export default GAdsDemographics