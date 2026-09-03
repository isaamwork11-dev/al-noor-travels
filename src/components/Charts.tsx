"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const salesData = [
  { day: "1", sales: 45000, cost: 38000, profit: 7000 },
  { day: "5", sales: 82000, cost: 65000, profit: 17000 },
  { day: "10", sales: 120000, cost: 98000, profit: 22000 },
  { day: "15", sales: 95000, cost: 78000, profit: 17000 },
  { day: "20", sales: 150000, cost: 120000, profit: 30000 },
  { day: "25", sales: 175000, cost: 140000, profit: 35000 },
  { day: "31", sales: 210000, cost: 168000, profit: 42000 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export function SalesLineChart({ showFinancials }: { showFinancials: boolean }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            formatter={(v) => `PKR ${Number(v).toLocaleString()}`}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales" />
          {showFinancials && (
            <>
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={false} name="Cost" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServicesPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
