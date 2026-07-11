import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

function DashboardCharts({
  charts = {
    labels: [],
    memberships: [],
    listings: [],
  },
  loading = false,
}) {
  if (loading) {
    return (
      <section className="mt-8 rounded-3xl border border-white/10 bg-[#12121A] p-6">
        <div className="h-[320px] animate-pulse rounded-2xl bg-white/5" />
      </section>
    );
  }

  const data = charts.labels.map((month, index) => ({
    month,
    memberships: charts.memberships[index] ?? 0,
    listings: charts.listings[index] ?? 0,
  }));

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-[#12121A] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard Analytics</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Membership and marketplace activity throughout the year.
        </p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />

            <XAxis
              dataKey="month"
              stroke="#71717A"
              tickLine={false}
              axisLine={false}
            />

            <YAxis stroke="#71717A" tickLine={false} axisLine={false} />

            <Tooltip
              contentStyle={{
                background: "#18181B",
                border: "1px solid #27272A",
                borderRadius: "12px",
              }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="memberships"
              name="Memberships"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />

            <Line
              type="monotone"
              dataKey="listings"
              name="Marketplace"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default DashboardCharts;
