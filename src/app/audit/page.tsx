"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import TechnicalCard from "../../components/audit/TechnicalCard";
import OnPageCard from "../../components/audit/OnPageCard";
import PerformanceCard from "../../components/audit/PerformanceCard";
import LinksCard from "../../components/audit/LinksCard";
import SocialCard from "../../components/audit/SocialCard";
import ShackletonLoader from "@/components/ui/ShackletonLoader";

export interface Hreflang { hreflang: string; href: string; }
export interface AuditData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  serpSnippet: string;
  hreflangs: Hreflang[];
  language: string;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  h4Tags: string[];
  h5Tags: string[];
  h6Tags: string[];
  canonical: string;
  noindexMeta: boolean;
  noindexHeader: boolean;
  sslEnabled: boolean;
  httpsRedirect: boolean;
  robotsTxtExists: boolean;
  blockedByRobots: boolean;
  xmlSitemaps: string[];
  analytics: string[];
  gtagCode: string | null;
  gtmCode: string | null;
  /** Age of the domain since creation */
  domainAge: string | null;
  structuredData: unknown[];
  metaImage: string;
  favicon: string;
  psi: {
    desktop: PageSpeedResponse | null;
    mobile: PageSpeedResponse | null;
  };
  performanceMetrics: {
    mobile: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      speedIndex: number;
      timeToInteractive: number;
      totalBlockingTime: number;
      cumulativeLayoutShift: number;
    };
    desktop: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      speedIndex: number;
      timeToInteractive: number;
      totalBlockingTime: number;
      cumulativeLayoutShift: number;
    };
  };
  performanceComparison: {
    mobile: {
      firstContentfulPaint: 'good' | 'needs-improvement' | 'poor';
      largestContentfulPaint: 'good' | 'needs-improvement' | 'poor';
      speedIndex: 'good' | 'needs-improvement' | 'poor';
      timeToInteractive: 'good' | 'needs-improvement' | 'poor';
      totalBlockingTime: 'good' | 'needs-improvement' | 'poor';
      cumulativeLayoutShift: 'good' | 'needs-improvement' | 'poor';
    };
    desktop: {
      firstContentfulPaint: 'good' | 'needs-improvement' | 'poor';
      largestContentfulPaint: 'good' | 'needs-improvement' | 'poor';
      speedIndex: 'good' | 'needs-improvement' | 'poor';
      timeToInteractive: 'good' | 'needs-improvement' | 'poor';
      totalBlockingTime: 'good' | 'needs-improvement' | 'poor';
      cumulativeLayoutShift: 'good' | 'needs-improvement' | 'poor';
    };
  };
  actionableRecommendations: {
    mobile: { id: string; title: string; description: string }[];
    desktop: { id: string; title: string; description: string }[];
  };
  technology: string[];
  serverIp: string;
  dnsServers: string[];
  webServer: string;
  charset: string;
  dmarcRecord: boolean;
  spfRecord: boolean;
  addressPhoneShown: boolean;
  localBusinessSchema: boolean;
  googleBusinessProfileIdentified: boolean;
  facebookPageLinked: string;
  openGraphTags: string;
  facebookPixel: string;
  xAccountLinked: string;
  xCards: string;
  instagramLinked: string;
  linkedInPageLinked: string;
  youTubeChannelLinked: string;
  youTubeChannelActivity: string;
  linkAnalysis: {
    totalLinks: number;
    referringDomainsCount: number;
    nofollowLinksCount: number;
    dofollowLinksCount: number;
    eduLinksCount: number;
    govLinksCount: number;
    uniqueSubnetsCount: number;
    uniqueIpsCount: number;
    onPageLinkStructure: { internal: number; external: number };
    friendlyLinksCount: number;
    topPagesByBacklinks: { url: string; count: number }[];
    topAnchorsByBacklinks: { anchor: string; count: number }[];
    topDomainGeographies: { geography: string; count: number }[];
  };
}

export type PageSpeedResponse = {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
    };
  };
};

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  // Store the last requested URL to ensure exports match the displayed audit
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const { data: session } = useSession();
  const [selectedTab, setSelectedTab] = useState<'onpage'|'performance'|'links'|'technical'|'social'>('technical');
  const [tabLoading, setTabLoading] = useState(false);

  /**
   * handleExport - Requests audit export in specified format and triggers download
   * @param exportType - 'json' | 'csv' | 'pdf'
   */
  const handleExport = async (exportType: 'json' | 'csv' | 'pdf') => {
    if (!auditData || !currentUrl) return;
    try {
      // Call backend with exportType and optional template for PDF
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl, exportType }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
      let blob: Blob;
      let filename: string;
      if (exportType === 'pdf') {
        blob = await res.blob();
        filename = 'audit.pdf';
      } else if (exportType === 'csv') {
        const text = await res.text();
        blob = new Blob([text], { type: 'text/csv' });
        filename = 'audit.csv';
      } else {
        const jsonData = await res.json();
        const jsonStr = JSON.stringify(jsonData, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json' });
        filename = 'audit.json';
      }
      // Create temporary link to download blob
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    const stripped = trimmed.replace(/^https?:\/\//i, '');
    if (!stripped) {
      setErrorMsg("Please enter a valid URL");
      return;
    }
    const fullUrl = `https://${stripped}`;
    try { new URL(fullUrl); } catch { setLoading(false); setErrorMsg('Please enter a valid URL'); return; }
    // Save for export operations
    setCurrentUrl(fullUrl);
    setErrorMsg("");
    setLoading(true);
    setAuditData(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Audit failed");
      } else {
        setAuditData(json);
      }
    } catch {
      setErrorMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

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
    'firstContentfulPaint', 'largestContentfulPaint', 'speedIndex',
    'timeToInteractive', 'totalBlockingTime', 'cumulativeLayoutShift',
  ] as const;

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900 text-black dark:text-white">
      {!session ? (
        <Button onClick={() => signIn('google')} className="mb-4">Connect to Google Search Console</Button>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          <span>Connected as {session.user?.email}</span>
          <Button onClick={() => signOut()}>Disconnect</Button>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6">SEO Audit</h1>
      <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 flex flex-col">
          <Input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Run Audit</Button>
      </form>
      </div>
      {errorMsg && <p className="mt-4 text-red-600">{errorMsg}</p>}
      {loading && <div className="mt-4"><ShackletonLoader /></div>}
      {auditData && (
        <>
          <Tabs value={selectedTab} onValueChange={(val: 'onpage'|'performance'|'links'|'technical'|'social') => { setTabLoading(true); setSelectedTab(val); setTimeout(() => setTabLoading(false), 300); }} className="mt-6">
            <TabsList>
              <TabsTrigger value="onpage">On-Page</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
            <TabsContent value="onpage" className="print-page-break">
              {tabLoading && selectedTab === "onpage" ? <ShackletonLoader /> : <OnPageCard auditData={auditData} />}
            </TabsContent>
            <TabsContent value="performance" className="print-page-break">
              {tabLoading && selectedTab === "performance" ? <ShackletonLoader /> : <PerformanceCard auditData={auditData} />}
            </TabsContent>
            <TabsContent value="links" className="print-page-break">
              {tabLoading && selectedTab === "links" ? <ShackletonLoader /> : <LinksCard auditData={auditData} />}
            </TabsContent>
            <TabsContent value="technical" className="print-page-break">
              {tabLoading && selectedTab === "technical" ? <ShackletonLoader /> : <TechnicalCard auditData={auditData} />}
            </TabsContent>
            <TabsContent value="social" className="print-page-break">
              {tabLoading && selectedTab === "social" ? <ShackletonLoader /> : <SocialCard auditData={auditData} />}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}