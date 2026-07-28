"use client";

import { useEffect, useState } from "react";
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
  const [yWidth, setYWidth] = useState(120);

  useEffect(() => {
    const update = () => setYWidth(window.innerWidth < 640 ? 72 : 120);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const height = Math.max(100, data.length * 38);

  const tickSize = yWidth < 100 ? 11 : 13;

  return (
    <div className="sondage-chart-wrap mt-3 overflow-x-auto" style={{ width: "100%", minHeight: height }}>
      <div style={{ width: "100%", minWidth: 260, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
    </div>
  );
}
