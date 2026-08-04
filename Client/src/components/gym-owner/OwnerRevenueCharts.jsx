import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#18181f] px-3.5 py-2.5 shadow-xl shadow-black/40">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.dataKey === "sales" ? entry.value : formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueTrendChart({ trend = [], compact = false }) {
  const data = trend.map((item) => ({
    label: item.label,
    revenue: item.revenue,
    sales: item.sales,
  }));

  return (
    <section className={`rounded-2xl border border-white/[0.08] bg-[#11121a] ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">Revenue trend</p>
          <p className="mt-1 text-sm text-zinc-500">Membership sales over the past six months</p>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          Live data
        </span>
      </div>

      <div className={compact ? "mt-4 h-52" : "mt-6 h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="ownerRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              width={52}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#8b5cf6", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#a78bfa"
              strokeWidth={3}
              fill="url(#ownerRevenueGradient)"
              dot={{ r: 4, fill: "#ddd6fe", stroke: "#0b0c12", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#c4b5fd", stroke: "#0b0c12", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function RevenueByGymChart({ revenueByGym = [] }) {
  const data = revenueByGym.map((gym) => ({
    name: gym.name.length > 14 ? `${gym.name.slice(0, 14)}…` : gym.name,
    fullName: gym.name,
    revenue: gym.revenue,
    sales: gym.sales,
  }));

  if (!data.length) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
        <p className="text-base font-semibold text-white">Revenue by gym</p>
        <p className="mt-8 text-center text-sm text-zinc-500">Gym breakdown appears once you record sales.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
      <div>
        <p className="text-base font-semibold text-white">Revenue by gym</p>
        <p className="mt-1 text-sm text-zinc-500">Compare performance across your locations</p>
      </div>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barSize={28}>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              width={52}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#18181f] px-3.5 py-2.5 shadow-xl shadow-black/40">
                    <p className="text-xs font-medium text-zinc-400">{item.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">{formatCurrency(item.revenue)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.sales} sale{item.sales === 1 ? "" : "s"}</p>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#34d399" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function SalesVolumeChart({ trend = [] }) {
  const data = trend.map((item) => ({
    label: item.label,
    sales: item.sales,
  }));

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
      <div>
        <p className="text-base font-semibold text-white">Sales volume</p>
        <p className="mt-1 text-sm text-zinc-500">Number of memberships sold each month</p>
      </div>

      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barSize={24}>
            <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(56, 189, 248, 0.08)" }} />
            <Bar dataKey="sales" name="Sales" fill="#38bdf8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
