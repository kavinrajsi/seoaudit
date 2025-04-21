import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Doughnut } from 'react-chartjs-2';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { AuditData } from '@/app/audit/page';

const METRICS = [
  {
    key: "firstContentfulPaint",
    label: "First Contentful Paint (FCP)",
    thresholds: [1000, 3000], // ms
    tooltip: "Time to first content rendered. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/fcp/",
  },
  {
    key: "largestContentfulPaint",
    label: "Largest Contentful Paint (LCP)",
    thresholds: [2500, 4000],
    tooltip: "Time until largest content is visible. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/lcp/",
  },
  {
    key: "speedIndex",
    label: "Speed Index",
    thresholds: [3000, 5000],
    tooltip: "How quickly content is visually displayed. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/speed-index/",
  },
  {
    key: "timeToInteractive",
    label: "Time to Interactive (TTI)",
    thresholds: [5000, 10000],
    tooltip: "Time until page is fully interactive. Lower is better.",
    format: (v: number) => `${(v / 1000).toFixed(1)}s`,
    learnMore: "https://web.dev/tti/",
  },
  {
    key: "totalBlockingTime",
    label: "Total Blocking Time (TBT)",
    thresholds: [200, 600],
    tooltip: "Total time main thread was blocked. Lower is better.",
    format: (v: number) => `${v}ms`,
    learnMore: "https://web.dev/tbt/",
  },
  {
    key: "cumulativeLayoutShift",
    label: "Cumulative Layout Shift (CLS)",
    thresholds: [0.1, 0.25],
    tooltip: "Visual stability of the page. Lower is better.",
    format: (v: number) => v.toFixed(2),
    learnMore: "https://web.dev/cls/",
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

interface Props { auditData: AuditData }

function renderDescriptionWithLinks(description: string) {
  // Find [text](url) and replace with anchor tags
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let partIndex = 0;
  while ((match = regex.exec(description)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${partIndex}`}>{description.slice(lastIndex, match.index)}</span>);
      partIndex++;
    }
    parts.push(
      <a
        key={`link-${partIndex}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        {match[1]}
      </a>
    );
    partIndex++;
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < description.length) {
    parts.push(<span key={`text-${partIndex}`}>{description.slice(lastIndex)}</span>);
  }
  return parts;
}

export default function PerformanceCard({ auditData }: Props) {
  const mobileScore = auditData.psi.mobile?.lighthouseResult?.categories?.performance?.score
    ? auditData.psi.mobile.lighthouseResult.categories.performance.score * 100
    : 0;
  const desktopScore = auditData.psi.desktop?.lighthouseResult?.categories?.performance?.score
    ? auditData.psi.desktop.lighthouseResult.categories.performance.score * 100
    : 0;

  const doughnutData = (score: number) => ({
    labels: ['', ''],
    datasets: [{
      data: [score, 100 - score],
      backgroundColor: [
        score >= 90 ? '#0cce6b' : score >= 50 ? '#ffa400' : '#ff4e42',
        '#e0e0e0',
      ],
      borderWidth: 0,
    }],
  });
  const doughnutOptions = {
    cutout: '75%',
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
  } as const;

  const metricLabels: Record<string, string> = {
    firstContentfulPaint: 'FCP',
    largestContentfulPaint: 'LCP',
    speedIndex: 'Speed Index',
    timeToInteractive: 'TTI',
    totalBlockingTime: 'TBT',
    cumulativeLayoutShift: 'CLS',
  };
  const statusColors: Record<'good'|'needs-improvement'|'poor', string> = {
    good: 'text-green-600',
    'needs-improvement': 'text-yellow-600',
    poor: 'text-red-600',
  };
  const metricKeys = [
    'firstContentfulPaint',
    'largestContentfulPaint',
    'speedIndex',
    'timeToInteractive',
    'totalBlockingTime',
    'cumulativeLayoutShift',
  ] as const;

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Web Performance Metrics (inlined) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Mobile Column */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Mobile</h3>
              <div className="flex flex-col gap-4">
                {METRICS.map((metric) => {
                  const value = auditData.performanceMetrics?.mobile?.[metric.key as MetricKey];
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
                  const value = auditData.performanceMetrics?.desktop?.[metric.key as MetricKey];
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
          <div className="mb-4">
            <Tabs defaultValue="mobile">
              <TabsList className="w-full flex">
                <TabsTrigger value="mobile" className="flex-1">Mobile</TabsTrigger>
                <TabsTrigger value="desktop" className="flex-1">Desktop</TabsTrigger>
              </TabsList>
              <TabsContent value="mobile">
                <Accordion type="single" collapsible className="mt-2">
                  {auditData.actionableRecommendations.mobile.length === 0 ? (
                    <AccordionItem value="none-mobile">
                      <AccordionTrigger>No recommendations</AccordionTrigger>
                      <AccordionContent />
                    </AccordionItem>
                  ) : (
                    auditData.actionableRecommendations.mobile.map(rec => (
                      <AccordionItem value={rec.id} key={rec.id}>
                        <AccordionTrigger>{rec.title}</AccordionTrigger>
                        <AccordionContent>{renderDescriptionWithLinks(rec.description)}</AccordionContent>
                      </AccordionItem>
                    ))
                  )}
                </Accordion>
              </TabsContent>
              <TabsContent value="desktop">
                <Accordion type="single" collapsible className="mt-2">
                  {auditData.actionableRecommendations.desktop.length === 0 ? (
                    <AccordionItem value="none-desktop">
                      <AccordionTrigger>No recommendations</AccordionTrigger>
                      <AccordionContent />
                    </AccordionItem>
                  ) : (
                    auditData.actionableRecommendations.desktop.map(rec => (
                      <AccordionItem value={rec.id} key={rec.id}>
                        <AccordionTrigger>{rec.title}</AccordionTrigger>
                        <AccordionContent>{renderDescriptionWithLinks(rec.description)}</AccordionContent>
                      </AccordionItem>
                    ))
                  )}
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
