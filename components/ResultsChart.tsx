"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INK, PAPER, PALETTE, SLATE } from "@/lib/constants";
import { ChartDatum } from "@/lib/stats";
import { truncateLabel, useIsNarrow } from "@/lib/use-is-narrow";

export type ChartVariant = "bar" | "pie";

interface ResultsChartProps {
  data: ChartDatum[];
  variant?: ChartVariant;
}

type PieRow = ChartDatum & { percent: number };

export function ResultsChart({ data, variant = "bar" }: ResultsChartProps) {
  if (variant === "pie") {
    return <PieResultsChart data={data} />;
  }
  return <BarResultsChart data={data} />;
}

function BarResultsChart({ data }: { data: ChartDatum[] }) {
  const narrow = useIsNarrow();
  const yWidth = narrow ? 64 : 120;
  const tickSize = narrow ? 10 : 13;
  const height = Math.max(narrow ? 88 : 100, data.length * (narrow ? 34 : 38));
  const labelMax = narrow ? 10 : 22;

  return (
    <div className="sondage-chart-wrap mt-3 overflow-x-auto" style={{ width: "100%", minHeight: height }}>
      <div style={{ width: "100%", minWidth: narrow ? "100%" : 260, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: narrow ? 28 : 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke={`${SLATE}33`} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: INK, fontFamily: "monospace" }}
              axisLine={{ stroke: `${SLATE}66` }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yWidth}
              tick={{ fontSize: tickSize, fill: INK, fontFamily: "-apple-system, sans-serif" }}
              tickFormatter={(v) => truncateLabel(String(v), labelMax)}
              axisLine={{ stroke: `${SLATE}66` }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: `${SLATE}22` }}
              wrapperStyle={{ maxWidth: "min(90vw, 280px)", zIndex: 20 }}
              contentStyle={{
                background: PAPER,
                border: `1px solid ${INK}`,
                borderRadius: 0,
                fontFamily: "-apple-system, sans-serif",
                fontSize: narrow ? 12 : 13,
                wordBreak: "break-word",
              }}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fill: INK, fontSize: narrow ? 11 : 12, fontFamily: "monospace" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PieResultsChart({ data }: { data: ChartDatum[] }) {
  const narrow = useIsNarrow();
  const rows = useMemo(() => {
    const total = data.reduce((s, d) => s + d.value, 0);
    return data
      .filter((d) => d.value > 0)
      .map((d) => ({
        ...d,
        percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
      })) as PieRow[];
  }, [data]);

  if (rows.length === 0) {
    return (
      <div className="sondage-sans text-sm mt-3" style={{ color: `${INK}77` }}>
        —
      </div>
    );
  }

  const chartHeight = narrow ? 200 : 240;

  return (
    <div className="sondage-chart-wrap mt-3" style={{ width: "100%" }}>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={narrow ? "42%" : "48%"}
              outerRadius={narrow ? "68%" : "74%"}
              paddingAngle={rows.length > 1 ? 2 : 0}
              stroke={PAPER}
              strokeWidth={2}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => {
                const percent = (item?.payload as PieRow | undefined)?.percent ?? 0;
                return [`${value} (${percent}%)`, ""];
              }}
              wrapperStyle={{ maxWidth: "min(90vw, 280px)", zIndex: 20 }}
              contentStyle={{
                background: PAPER,
                border: `1px solid ${INK}`,
                borderRadius: 0,
                fontFamily: "-apple-system, sans-serif",
                fontSize: narrow ? 12 : 13,
                wordBreak: "break-word",
              }}
              itemStyle={{ color: INK }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 px-0.5">
        {rows.map((row, i) => (
          <li key={`${row.name}-${i}`} className="flex items-start gap-2 min-w-0">
            <span
              className="mt-1.5 shrink-0 rounded-sm"
              style={{
                width: 8,
                height: 8,
                background: PALETTE[i % PALETTE.length],
              }}
              aria-hidden
            />
            <span className="sondage-sans text-xs min-w-0 break-words" style={{ color: INK }}>
              {row.name}
              <span className="sondage-mono ml-1.5" style={{ color: SLATE }}>
                {row.value} ({row.percent}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
