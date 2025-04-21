"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { AuditData } from "@/app/audit/page";

const METRICS = [
  {
    key: "firstContentfulPaint",
    label: "First Contentful Paint (FCP)",
    thresholds: [1000, 3000], // ms
    tooltip: "Time to first content rendered. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/fcp/", // Added
  },
  {
    key: "largestContentfulPaint",
    label: "Largest Contentful Paint (LCP)",
    thresholds: [2500, 4000],
    tooltip: "Time until largest content is visible. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/lcp/", // Added
  },
  {
    key: "speedIndex",
    label: "Speed Index",
    thresholds: [3000, 5000],
    tooltip: "How quickly content is visually displayed. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/speed-index/", // Added
  },
  {
    key: "timeToInteractive",
    label: "Time to Interactive (TTI)",
    thresholds: [5000, 10000],
    tooltip: "Time until page is fully interactive. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/tti/", // Added
  },
  {
    key: "totalBlockingTime",
    label: "Total Blocking Time (TBT)",
    thresholds: [200, 600],
    tooltip: "Total time main thread was blocked. Lower is better.",
    format: (v: number) => `${v}ms`,
    learnMore: "https://web.dev/tbt/", // Added
  },
  {
    key: "cumulativeLayoutShift",
    label: "Cumulative Layout Shift (CLS)",
    thresholds: [0.1, 0.25],
    tooltip: "Visual stability of the page. Lower is better.",
    format: (v: number) => v.toFixed(2),
    learnMore: "https://web.dev/cls/", // Added
  },
] as const;

type MetricKey = typeof METRICS[number]["key"];

function getColor(value: number, [good, moderate]: [number, number], isCls = false) {
  if (isCls) {
    if (value <= good) return "green";
    if (value <= moderate) return "orange";
    return "red";
  }
  if (value <= good) return "green";
  if (value <= moderate) return "orange";
  return "red";
}

const colorMap = {
  green: "bg-green-100 text-green-800 border-green-300",
  orange: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

interface Props {
  metrics: AuditData["performanceMetrics"];
}

export default function PerformanceMetricsDashboard({ metrics }: Props) {
  return (
    <Card className="w-full max-w-5xl mx-auto mb-6">
      <CardHeader>
        <CardTitle>Web Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mobile Column */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Mobile</h3>
            <div className="flex flex-col gap-4">
              {METRICS.map((metric) => {
                const value = metrics?.mobile?.[metric.key as MetricKey];
                const isCls = metric.key === "cumulativeLayoutShift";
                const color = getColor(value, metric.thresholds as [number, number], isCls);
                const icon = color === "green" ? "●" : color === "orange" ? "■" : "▲";
                const iconColor = color === "green" ? "text-green-600" : color === "orange" ? "text-yellow-600" : "text-red-600";
                return (
                  <div key={metric.key} className="rounded border p-4 bg-white dark:bg-gray-950 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={iconColor + " text-lg"}>{icon}</span>
                      <span className="font-medium text-base">{metric.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${iconColor}`}>{metric.format(value)}</div>
                    <div className="text-sm text-muted-foreground mb-1">{metric.tooltip}</div>
                    {metric.learnMore && (
                      <a href={metric.learnMore} className="text-blue-600 underline text-xs" target="_blank" rel="noopener noreferrer">Learn more about the {metric.label} metric.</a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Column */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Desktop</h3>
            <div className="flex flex-col gap-4">
              {METRICS.map((metric) => {
                const value = metrics?.desktop?.[metric.key as MetricKey];
                const isCls = metric.key === "cumulativeLayoutShift";
                const color = getColor(value, metric.thresholds as [number, number], isCls);
                const icon = color === "green" ? "●" : color === "orange" ? "■" : "▲";
                const iconColor = color === "green" ? "text-green-600" : color === "orange" ? "text-yellow-600" : "text-red-600";
                return (
                  <div key={metric.key} className="rounded border p-4 bg-white dark:bg-gray-950 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={iconColor + " text-lg"}>{icon}</span>
                      <span className="font-medium text-base">{metric.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${iconColor}`}>{metric.format(value)}</div>
                    <div className="text-sm text-muted-foreground mb-1">{metric.tooltip}</div>
                    {metric.learnMore && (
                      <a href={metric.learnMore} className="text-blue-600 underline text-xs" target="_blank" rel="noopener noreferrer">Learn more about the {metric.label} metric.</a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
