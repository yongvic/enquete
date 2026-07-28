"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INK, PAPER, PALETTE, SLATE } from "@/lib/constants";
import { ChartDatum } from "@/lib/stats";

interface ResultsChartProps {
  data: ChartDatum[];
}

export function ResultsChart({ data }: ResultsChartProps) {
  const height = Math.max(120, data.length * 42);

  return (
    <div className="mt-3" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
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
            width={120}
            tick={{ fontSize: 13, fill: INK, fontFamily: "-apple-system, sans-serif" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: `${SLATE}22` }}
            contentStyle={{
              background: PAPER,
              border: `1px solid ${INK}`,
              borderRadius: 0,
              fontFamily: "-apple-system, sans-serif",
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fill: INK, fontSize: 12, fontFamily: "monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
