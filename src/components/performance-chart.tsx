import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyStat } from "@/lib/types";
import { formatCompact, formatMoney } from "@/lib/format";

export function PerformanceChart({
  stats,
  metric = "spend",
}: {
  stats: DailyStat[];
  metric?: "spend" | "impressions" | "clicks" | "revenue";
}) {
  const data = stats.map((s) => ({
    ...s,
    label: format(new Date(s.date + "T12:00:00"), "d MMM"),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="velumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) =>
              metric === "spend" || metric === "revenue" ? formatCompact(v) : formatCompact(v)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-fg)",
              fontSize: 12,
            }}
            formatter={(value) => {
              const n = Number(value ?? 0);
              if (metric === "spend" || metric === "revenue") return formatMoney(n, 0);
              return formatCompact(n);
            }}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke="var(--color-primary)"
            strokeWidth={1.5}
            fill="url(#velumFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
