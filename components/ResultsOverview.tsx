"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
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
import { INK, OCHRE, PAPER, PALETTE, SLATE } from "@/lib/constants";
import { Question, SurveyResponse } from "@/lib/constants";
import { computeGlobalOverview } from "@/lib/stats";
import { truncateLabel, useIsNarrow } from "@/lib/use-is-narrow";
import { ResultsChart, type ChartVariant } from "./ResultsChart";

interface ResultsOverviewProps {
  questions: Question[];
  responses: SurveyResponse[];
  chartVariant: ChartVariant;
}

export function ResultsOverview({ questions, responses, chartVariant }: ResultsOverviewProps) {
  const t = useTranslations("results");
  const locale = useLocale();
  const overview = computeGlobalOverview(questions, responses, locale);

  if (overview.total === 0) return null;

  return (
    <section className="mt-8" style={{ borderTop: `1px solid ${SLATE}44`, paddingTop: 24 }}>
      <h2 className="text-lg font-bold">{t("overviewTitle")}</h2>
      <p className="sondage-sans text-sm mt-1" style={{ color: `${INK}99` }}>
        {t("overviewSubtitle", { avg: overview.avgCompletion })}
      </p>

      <div className="mt-6 flex flex-col gap-8">
        <div>
          <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
            {t("overviewTimeline")}
          </div>
          <TimelineChart data={overview.timeline} />
        </div>

        <div>
          <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
            {t("overviewCompletion")}
          </div>
          <CompletionChart data={overview.completion} />
        </div>

        {overview.ratings.length > 0 && (
          <div>
            <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
              {t("overviewRatings")}
            </div>
            <RatingsChart data={overview.ratings} />
          </div>
        )}

        {overview.leadingChoices.length > 0 && (
          <div>
            <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
              {t("overviewLeading")}
            </div>
            <p className="sondage-sans text-xs mb-1" style={{ color: `${INK}88` }}>
              {t("overviewLeadingHint")}
            </p>
            <ResultsChart data={overview.leadingChoices} variant={chartVariant} />
          </div>
        )}
      </div>
    </section>
  );
}

function chartTooltipStyle(narrow: boolean) {
  return {
    background: PAPER,
    border: `1px solid ${INK}`,
    borderRadius: 0,
    fontFamily: "-apple-system, sans-serif",
    fontSize: narrow ? 12 : 13,
    wordBreak: "break-word" as const,
  };
}

function TimelineChart({ data }: { data: { name: string; value: number }[] }) {
  const t = useTranslations("results");
  const narrow = useIsNarrow();

  if (data.length === 0) {
    return (
      <p className="sondage-sans text-sm" style={{ color: `${INK}77` }}>
        —
      </p>
    );
  }

  const angled = narrow && data.length > 4;
  const height = narrow ? (angled ? 200 : 180) : 220;

  return (
    <div className="sondage-chart-wrap overflow-x-auto" style={{ width: "100%", height }}>
      <div style={{ width: "100%", minWidth: narrow && data.length > 8 ? Math.min(data.length * 36, 480) : "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 8,
              right: narrow ? 8 : 12,
              left: 0,
              bottom: angled ? 28 : 4,
            }}
          >
            <defs>
              <linearGradient id="sondageTimelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={OCHRE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={OCHRE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={`${SLATE}33`} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: narrow ? 10 : 11, fill: INK, fontFamily: "monospace" }}
              axisLine={{ stroke: `${SLATE}66` }}
              tickLine={false}
              interval={narrow ? "preserveStartEnd" : 0}
              minTickGap={narrow ? 28 : 12}
              angle={angled ? -35 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 50 : 30}
            />
            <YAxis
              allowDecimals={false}
              width={narrow ? 28 : 32}
              tick={{ fontSize: narrow ? 10 : 11, fill: INK, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              wrapperStyle={{ maxWidth: "min(90vw, 280px)", zIndex: 20 }}
              contentStyle={chartTooltipStyle(narrow)}
              formatter={(value: number) => [value, t("overviewResponsesAxis")]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={OCHRE}
              strokeWidth={2}
              fill="url(#sondageTimelineFill)"
              dot={{ r: narrow ? 2 : 3, fill: INK, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CompletionChart({
  data,
}: {
  data: { name: string; value: number; answered: number; total: number }[];
}) {
  const t = useTranslations("results");
  const narrow = useIsNarrow();
  const height = Math.max(narrow ? 100 : 120, data.length * (narrow ? 32 : 36));

  return (
    <div className="sondage-chart-wrap" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: narrow ? 40 : 36, left: 0, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke={`${SLATE}33`} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: narrow ? 10 : 11, fill: INK, fontFamily: "monospace" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={narrow ? 34 : 40}
            tick={{ fontSize: narrow ? 11 : 12, fill: INK, fontFamily: "monospace" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <Tooltip
            wrapperStyle={{ maxWidth: "min(90vw, 280px)", zIndex: 20 }}
            contentStyle={chartTooltipStyle(narrow)}
            formatter={(value: number, _n, item) => {
              const row = item?.payload as { answered?: number; total?: number } | undefined;
              return [
                `${value}% (${row?.answered ?? 0}/${row?.total ?? 0})`,
                t("overviewAnswered"),
              ];
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={INK}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: number) => `${v}%`}
              style={{ fill: INK, fontSize: narrow ? 10 : 11, fontFamily: "monospace" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingsChart({ data }: { data: { name: string; value: number; fullLabel: string }[] }) {
  const t = useTranslations("results");
  const narrow = useIsNarrow();
  const height = Math.max(narrow ? 100 : 120, data.length * (narrow ? 36 : 40));

  return (
    <div className="sondage-chart-wrap" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: narrow ? 40 : 36, left: 0, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke={`${SLATE}33`} />
          <XAxis
            type="number"
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: narrow ? 10 : 11, fill: INK, fontFamily: "monospace" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={narrow ? 34 : 40}
            tick={{ fontSize: narrow ? 11 : 12, fill: INK, fontFamily: "monospace" }}
            axisLine={{ stroke: `${SLATE}66` }}
            tickLine={false}
          />
          <Tooltip
            wrapperStyle={{ maxWidth: "min(90vw, 280px)", zIndex: 20 }}
            contentStyle={chartTooltipStyle(narrow)}
            formatter={(value: number) => [`${value} / 5`, t("average")]}
            labelFormatter={(_label, payload) => {
              const full = (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel;
              return full ? truncateLabel(full, narrow ? 80 : 120) : String(_label);
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} fill={OCHRE}>
            <LabelList
              dataKey="value"
              position="right"
              style={{ fill: INK, fontSize: narrow ? 10 : 11, fontFamily: "monospace" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
