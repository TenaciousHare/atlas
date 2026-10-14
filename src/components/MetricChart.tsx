import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { supabase } from "../lib/supabase";
type Point = { t: number; value: number; trend: number };
type Row = { date: string } & Record<"weight_kg" | "waist_cm", number | null>;

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });

type Props = {
  title: string;
  column: "weight_kg" | "waist_cm";
  unit: string;
  color: string;
};

const WINDOW = 7; // okno = 7, bo ~tydzień ładnie gasi dzienne wahania

function withTrend(raw: { t: number; value: number }[]): Point[] {
  return raw.map((p, i) => {
    const start = Math.max(0, i - (WINDOW - 1)); // nie wychodź przed początek tablicy
    const window = raw.slice(start, i + 1); // ten punkt + do 6 wcześniejszych
    const avg = window.reduce((sum, q) => sum + q.value, 0) / window.length;
    return { ...p, trend: Number(avg.toFixed(1)) };
  });
}

export default function MetricChart({ title, column, unit, color }: Props) {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    supabase
      .from("daily_logs")
      .select(`date, ${column}`)
      .order("date")
      .then(({ data }) => {
        const rows = (data ?? []) as Row[];
        const raw = rows
          .filter((r) => r[column] !== null)
          .map((r) => ({
            t: new Date(r.date).getTime(),
            value: r[column] as number,
          }));
        setData(withTrend(raw));
      });
  }, [column]);

  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-300">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 12, bottom: 5, left: -12 }}
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
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="#71717a"
            fontSize={12}
            width={40}
          />
          <Tooltip
            labelFormatter={(t) => fmtDate(t as number)}
            formatter={(v, name) => [`${v} ${unit}`, name]}
            contentStyle={{
              background: "#17171c",
              border: "1px solid #2a2e3a",
              borderRadius: 8,
              color: "#e4e4e7",
            }}
          />
          <Line
            type="linear"
            dataKey="value"
            name="pomiar"
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.35}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="trend"
            name="trend"
            stroke="#f4f4f5"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
