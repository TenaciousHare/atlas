import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "../lib/supabase";

type Row = { date: string; weight_kg: number | null; waist_cm: number | null };
type Point = { t: number; weight: number | null; waist: number | null };

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });

export default function CombinedChart() {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    supabase
      .from("daily_logs")
      .select("date, weight_kg, waist_cm")
      .order("date")
      .then(({ data }) => {
        const rows = (data ?? []) as Row[];
        setData(
          rows.map((r) => ({
            t: new Date(r.date).getTime(),
            weight: r.weight_kg,
            waist: r.waist_cm,
          })),
        );
      });
  }, []);

  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-300">Waga vs pas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 8, bottom: 5, left: -12 }}
        >
          <CartesianGrid stroke="#2a2e3a" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtDate}
            stroke="#71717a"
            fontSize={12}
          />
          <YAxis
            yAxisId="weight"
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="#f5b945"
            fontSize={12}
            width={40}
          />
          <YAxis
            yAxisId="waist"
            orientation="right"
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="#60a5fa"
            fontSize={12}
            width={40}
          />
          <Tooltip
            labelFormatter={(t) => fmtDate(t as number)}
            formatter={(v, name) => [
              v == null ? "—" : `${v} ${name === "Waga" ? "kg" : "cm"}`,
              name,
            ]}
            contentStyle={{
              background: "#17171c",
              border: "1px solid #2a2e3a",
              borderRadius: 8,
              color: "#e4e4e7",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="weight"
            type="linear"
            dataKey="weight"
            name="Waga"
            stroke="#f5b945"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="waist"
            type="linear"
            dataKey="waist"
            name="Pas"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
