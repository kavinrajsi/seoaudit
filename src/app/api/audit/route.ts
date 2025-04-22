{{ /* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any */ }}
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import robotsParser from 'robots-parser';
import psi from 'psi';
import dns from 'dns/promises';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { auditCache, historyCache, CacheEntry } from '../../../lib/auditCache';
import dayjs from 'dayjs';
import whois from 'whois-json';
import { supabase } from '../../../lib/supabaseClient';

// Normalize URL helper for relative paths
const getAbsoluteUrl = (src: string, parsedUrl: URL): string => {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return `${parsedUrl.protocol}${src}`;
  return parsedUrl.origin + (src.startsWith('/') ? src : `/${src}`);
};

// Utility: Convert JSON to CSV format
function jsonToCsv(data: Record<string, unknown>): string {
  const keys = Object.keys(data);
  const header = keys.join(',');
  const values = keys.map(key => {
    const val = data[key];
    const str = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  }).join(',');
  return `${header}\n${values}`;
}

// PDF Report Generator
/**
 * Generates a professional PDF audit report.
 * Supports custom templates via a template name.
 * @param data - Complete audit result object
 * @param template - Optional template identifier (default: 'default')
 * @returns Promise resolving to PDF bytes
 */
async function generatePdf(
  data: Record<string, unknown>,
  template: string = 'default'
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { height } = page.getSize();
  // Embed a standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Initial cursor position
  let y = height - 40;
  // Draw report title with template name
  page.drawText(`SEO Audit Report (${template})`, {
    x: 50,
    y,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  // Iterate over each metric and render as text
  for (const [key, value] of Object.entries(data)) {
    const text = `${key}: ${
      typeof value === 'object' && value !== null ? JSON.stringify(value) : value
    }`;
    // Add new page if running out of space
    if (y < 50) {
      page = pdfDoc.addPage();
      const { height } = page.getSize();
      y = height - 40;
    }
    page.drawText(text, { x: 50, y, size: 12, font });
    y -= 20;
  }
  // Serialize and return PDF bytes
  return pdfDoc.save();
}

// In-memory cache setup
const CACHE_DURATION_SECONDS = process.env.CACHE_DURATION_SECONDS ? parseInt(process.env.CACHE_DURATION_SECONDS, 10) : 3600;

/**
 * Categorize a performance metric value using defined thresholds.
 * @param value - Metric value (ms or unitless for CLS)
 * @param good - Upper bound for 'good'
 * @param moderate - Upper bound for 'needs-improvement'
 */
function categorizeMetric(
  value: number,
  good: number,
  moderate: number
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= good) return 'good';
  if (value <= moderate) return 'needs-improvement';
  return 'poor';
}

export async function POST(request: Request) {
  // Accept exportType (json, csv, pdf), optional template, and crawl depth
  const { url, exportType = 'json', template, depth = 1 }: {
    url: string;
    exportType?: 'json' | 'csv' | 'pdf';
    template?: string;
    depth?: number;
  } = await request.json();

  // Helper for crawling multiple pages
  async function crawlSite(startUrl: string, maxDepth: number) {
    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    const pages: any[] = [];
    const crawlIssues: any[] = [];
    const titleMap: Record<string, string> = {};
    while (queue.length > 0) {
      const { url: pageUrl, depth: d } = queue.shift()!;
      if (visited.has(pageUrl) || d > maxDepth) continue;
      visited.add(pageUrl);
      try {
        const res = await fetch(pageUrl);
        const html = await res.text();
        const $ = load(html);
        const title = $('title').text() || '';
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const h1Tags = $('h1').map((i, el) => $(el).text()).get();
        const links = $('a[href]').map((i, el) => $(el).attr('href')).get().filter(Boolean);
        const absLinks = links.map((l: string) => getAbsoluteUrl(l, new URL(pageUrl)));
        // Crawlability checks
        if (!title) crawlIssues.push({ url: pageUrl, issue: 'Missing title' });
        if (titleMap[title]) crawlIssues.push({ url: pageUrl, issue: 'Duplicate title', duplicateOf: titleMap[title] });
        titleMap[title] = pageUrl;
        // robots.txt check (only for startUrl)
        if (d === 0) {
          const robotsUrl = new URL('/robots.txt', pageUrl).toString();
          try {
            const robotsRes = await fetch(robotsUrl);
            if (robotsRes.ok) {
              const robotsTxt = await robotsRes.text();
              const parser = robotsParser(robotsUrl, robotsTxt);
              if (!parser.isAllowed(pageUrl, '*')) {
                crawlIssues.push({ url: pageUrl, issue: 'Blocked by robots.txt' });
              }
            }
          } catch {}
        }
        // Broken link check
        for (const link of absLinks) {
          try {
            const linkUrl = new URL(link);
            if (linkUrl.hostname === new URL(startUrl).hostname && !visited.has(link) && d + 1 <= maxDepth) {
              queue.push({ url: link, depth: d + 1 });
            }
            // Only check status for internal links
            if (linkUrl.hostname === new URL(startUrl).hostname) {
              const linkRes = await fetch(link, { method: 'HEAD' });
              if (!linkRes.ok) {
                crawlIssues.push({ url: pageUrl, issue: 'Broken internal link', link });
              }
            }
          } catch {}
        }
        pages.push({ url: pageUrl, title, metaDesc, h1Tags, links: absLinks });
      } catch (err) {
        crawlIssues.push({ url: pageUrl, issue: 'Fetch error', error: (err as Error).message });
      }
    }
    return { pages, crawlIssues };
  }

  console.log('Page URL:', url);
  // Step 1: Compute current timestamp for cache validation
  const now = Date.now();
  // Step 2: Attempt to retrieve cached audit for this URL
  const cached = auditCache.get(url);
  // Step 3: If cache hit and within TTL, return cached data
  if (cached && now - cached.timestamp < CACHE_DURATION_SECONDS * 1000) {
    console.log(`Returning cached audit for ${url}`);
    if (exportType === 'pdf') {
      // Return cached PDF report
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const hostname = new URL(url).hostname.replace(/\./g, '_');
      const filename = `${hostname}_${timestamp}.pdf`;
      const pdfBytes = await generatePdf(
        cached.data as Record<string, unknown>,
        template || 'default'
      );
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (exportType === 'csv') {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const hostname = new URL(url).hostname.replace(/\./g, '_');
      const filename = `${hostname}_${timestamp}.csv`;
      const csv = jsonToCsv(cached.data as Record<string, unknown>);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    return NextResponse.json(cached.data);
  }

  try {
    const parsedUrl = new URL(url);
    const origin = parsedUrl.origin;

    // Initialize PSI data containers
    // eslint-disable-next-line prefer-const
    let psiData: any = {
      desktop: null,
      mobile: null
    };

    // Try to fetch PageSpeed Insights metrics for mobile and desktop
    const apiKey = process.env.PAGESPEED_API_KEY;
    if (apiKey) {
      try {
        const [mobileResult, desktopResult] = await Promise.all([
          psi(url, { key: apiKey, strategy: 'mobile' }),
          psi(url, { key: apiKey, strategy: 'desktop' }),
        ]);
        psiData.mobile = mobileResult.data;
        psiData.desktop = desktopResult.data;
        console.log('Mobile speed score:', mobileResult.data.lighthouseResult?.categories?.performance?.score);
        console.log('Desktop speed score:', desktopResult.data.lighthouseResult?.categories?.performance?.score);
      } catch (error: unknown) {
        console.error('PageSpeed API error:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.warn('PageSpeed API key not configured');
    }

    // Multi-page crawl if depth > 1
    let siteStructure = null;
    let crawlIssues = null;
    if (depth > 1) {
      const crawlResult = await crawlSite(url, depth);
      siteStructure = crawlResult.pages;
      crawlIssues = crawlResult.crawlIssues;
    }

    // HTTPS redirect test
    let httpsRedirect = false;
    if (parsedUrl.protocol === 'http:') {
      const headRes = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      const location = headRes.headers.get('location') || '';
      httpsRedirect = location.startsWith('https:');
    }

    // Fetch page content
    const res = await fetch(url);
    const finalUrl = res.url;
    const html = await res.text();
    const $ = load(html);

    // Title and description
    const title = $('title').text() || '';
    const titleLength = title.length;
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaDescLength = metaDesc.length;
    const serpSnippet = `${title} - ${metaDesc}`.slice(0, 160);

    // Hreflang
    const hreflangs = $('link[rel="alternate"][hreflang]').map((i, el) => ({
      hreflang: $(el).attr('hreflang'),
      href: $(el).attr('href'),
    })).get();

    // Language
    const language = $('html').attr('lang') || '';

    // H1 tags
    const h1Tags = $('h1').map((i, el) => $(el).text()).get();

    // H2-H6 Header Tag Usage
    const h2Tags = $('h2').map((i, el) => $(el).text()).get();
    const h3Tags = $('h3').map((i, el) => $(el).text()).get();
    const h4Tags = $('h4').map((i, el) => $(el).text()).get();
    const h5Tags = $('h5').map((i, el) => $(el).text()).get();
    const h6Tags = $('h6').map((i, el) => $(el).text()).get();
    const headerUsage: Record<string, number> = {
      H2: h2Tags.length,
      H3: h3Tags.length,
      H4: h4Tags.length,
      H5: h5Tags.length,
      H6: h6Tags.length,
    };

    // Link Analysis (on-page links without external API)
    const rawLinks = $('a[href]').map((i, el) => ({
      href: $(el).attr('href') || '',
      text: $(el).text().trim(),
      rel: ($(el).attr('rel') || '').toLowerCase(),
    })).get();
    const normalizedLinks = rawLinks.map(link => {
      let urlObj: URL | null = null;
      try { urlObj = new URL(link.href, parsedUrl.origin); } catch { }
      const normalized = urlObj ? urlObj.href : '';
      const internal = urlObj ? urlObj.host === parsedUrl.host : false;
      const domain = urlObj ? urlObj.host : '';
      return { ...link, normalized, internal, domain };
    });
    const totalLinks = normalizedLinks.length;
    const internalLinksCount = normalizedLinks.filter(l => l.internal).length;
    const externalLinks = normalizedLinks.filter(l => !l.internal && l.normalized);
    const externalLinksCount = externalLinks.length;
    const nofollowLinksCount = externalLinks.filter(l => l.rel.split(' ').includes('nofollow')).length;
    const dofollowLinksCount = externalLinksCount - nofollowLinksCount;
    const eduLinksCount = externalLinks.filter(l => l.domain.endsWith('.edu')).length;
    const govLinksCount = externalLinks.filter(l => l.domain.endsWith('.gov')).length;
    // Unique external domains, filtering out any empty values
    const referringDomains = Array.from(new Set(externalLinks.map(l => l.domain))).filter(domain => domain);
    const ips = await Promise.all(referringDomains.map(async domain => {
      try { const { address } = await dns.lookup(domain); return address; } catch { return null; }
    }));
    const uniqueIps = Array.from(new Set(ips.filter(Boolean) as string[]));
    const uniqueIpsCount = uniqueIps.length;
    const uniqueSubnetsCount = new Set(uniqueIps.map(ip => ip.split('.').slice(0,3).join('.'))).size;
    const pageCountsMap: Record<string, number> = {};
    externalLinks.forEach(l => { if (l.normalized) pageCountsMap[l.normalized] = (pageCountsMap[l.normalized] || 0) + 1; });
    const topPagesByBacklinks = Object.entries(pageCountsMap)
      .sort((a, b) => b[1] - a[1]).slice(0,5).map(([url, count]) => ({ url, count }));
    const anchorCountsMap: Record<string, number> = {};
    externalLinks.forEach(l => {
      const key = l.text || l.normalized;
      anchorCountsMap[key] = (anchorCountsMap[key] || 0) + 1;
    });
    const topAnchorsByBacklinks = Object.entries(anchorCountsMap)
      .sort((a, b) => b[1] - a[1]).slice(0,5).map(([anchor, count]) => ({ anchor, count }));
    const geoCountsMap: Record<string, number> = {};
    referringDomains.forEach(domain => {
      const tld = domain.split('.').pop()?.toUpperCase() || '';
      geoCountsMap[tld] = (geoCountsMap[tld] || 0) + 1;
    });
    const topDomainGeographies = Object.entries(geoCountsMap)
      .sort((a, b) => b[1] - a[1]).slice(0,5).map(([geography, count]) => ({ geography, count }));
    const onPageLinkStructure = { internal: internalLinksCount, external: externalLinksCount };
    const friendlyLinksCount = externalLinks.filter(l => l.text && !l.normalized.includes(l.text)).length;
    const linkAnalysis = {
      totalLinks,
      internalLinksCount,
      externalLinksCount,
      nofollowLinksCount,
      dofollowLinksCount,
      eduLinksCount,
      govLinksCount,
      referringDomainsCount: referringDomains.length,
      uniqueSubnetsCount,
      uniqueIpsCount,
      topPagesByBacklinks,
      topAnchorsByBacklinks,
      topDomainGeographies,
      onPageLinkStructure,
      friendlyLinksCount,
    };

    // Canonical
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    // Noindex meta
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const noindexMeta = robotsMeta.toLowerCase().includes('noindex');

    // Noindex header
    const xRobots = res.headers.get('x-robots-tag') || '';
    const noindexHeader = xRobots.toLowerCase().includes('noindex');

    // SSL enabled
    const sslEnabled = finalUrl.startsWith('https:');

    // Meta image (og:image or twitter:image)
    const metaImageTag = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
    const metaImage = getAbsoluteUrl(metaImageTag, parsedUrl);

    // Favicon link
    const faviconTag = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';
    const favicon = getAbsoluteUrl(faviconTag, parsedUrl);

    // Robots.txt and sitemaps
    const robotsUrl = `${origin}/robots.txt`;
    let robotsTxtExists = false;
    let blockedByRobots = false;
    let xmlSitemaps: string[] = [];
    try {
      const robotsRes = await fetch(robotsUrl);
      if (robotsRes.ok) {
        robotsTxtExists = true;
        const robotsTxt = await robotsRes.text();
        const parser = robotsParser(robotsUrl, robotsTxt);
        blockedByRobots = !parser.isAllowed(url, '*');
        xmlSitemaps = parser.getSitemaps();
      }
    } catch {};
    // fallback sitemap
    if (xmlSitemaps.length === 0) {
      const sitemapRes = await fetch(`${origin}/sitemap.xml`);
      if (sitemapRes.ok) xmlSitemaps.push(`${origin}/sitemap.xml`);
    }

    // Analytics detection
    const analytics: string[] = [];
    let gtagCode: string | null = null;
    let gtmCode: string | null = null;
    if (/gtag\(/.test(html)) analytics.push('Google Analytics (gtag)');
    if (/analytics\.js/.test(html)) analytics.push('Google Analytics (analytics.js)');
    if (/ga\('create'/.test(html)) analytics.push('Google Analytics (ga.js)');
    if (/dataLayer/.test(html)) analytics.push('Google Tag Manager');
    // Facebook Pixel detection
    if (/fbq\(/.test(html) || /connect\.facebook\.net/.test(html)) analytics.push('Facebook Pixel');

    // Extract Google Analytics (gtag) scripts (external first, then inline)
    const gtagExternalMatch = html.match(/<script[^>]*src=["'][^"']*gtag\/js[^"']*["'][^>]*><\/script>/i);
    const gtagInlineMatch = html.match(/<script[^>]*>[\s\S]*?gtag\([\s\S]*?<\/script>/i);
    if (gtagExternalMatch) {
      gtagCode = gtagExternalMatch[0];
    } else if (gtagInlineMatch) {
      gtagCode = gtagInlineMatch[0];
    }
    // Extract Google Tag Manager scripts (external first, then inline)
    const gtmExternalMatch = html.match(/<script[^>]*src=["'][^"']*googletagmanager\.com[^"']*["'][^>]*><\/script>/i);
    const gtmInlineMatch = html.match(/<script[^>]*>[\s\S]*?dataLayer[\s\S]*?<\/script>/i);
    if (gtmExternalMatch) {
      gtmCode = gtmExternalMatch[0];
    } else if (gtmInlineMatch) {
      gtmCode = gtmInlineMatch[0];
    }

    // Structured data
    const structuredData = $('script[type="application/ld+json"]').map((i, el) => {
      try { return JSON.parse($(el).html()!); } catch { return null; }
    }).get().filter(i => i != null);

    // Technology detection
    const technology: string[] = [];
    if (html.includes('wp-content')) technology.push('WordPress');
    if (html.includes('Drupal.settings')) technology.push('Drupal');
    if (html.includes('Shopify')) technology.push('Shopify');
    if (/next\.js/i.test(html)) technology.push('Next.js');
    if (/react/i.test(html)) technology.push('React');

    // DNS & server info
    let serverIp = '';
    try { const lookup = await dns.lookup(parsedUrl.hostname); serverIp = lookup.address; } catch {}
    let dnsServers: string[] = [];
    try { dnsServers = await dns.resolveNs(parsedUrl.hostname); } catch {}
    const webServer = res.headers.get('server') || '';
    const contentType = res.headers.get('content-type') || '';
    const charsetMatch = contentType.match(/charset=([^;]+)/);
    const charset = charsetMatch ? charsetMatch[1] : '';

    // DMARC & SPF
    let dmarcRecord: string | null = null;
    try {
      const txts = await dns.resolveTxt(`_dmarc.${parsedUrl.hostname}`);
      const joined = txts.map(r => r.join(''));
      dmarcRecord = joined.find(r => r.startsWith('v=DMARC1')) || null;
    } catch {}
    let spfRecord: string | null = null;
    try {
      const txts2 = await dns.resolveTxt(parsedUrl.hostname);
      const joined2 = txts2.map(r => r.join(''));
      spfRecord = joined2.find(r => r.startsWith('v=spf1')) || null;
    } catch {}

    // Domain Age lookup via WHOIS
    let domainAge: string | null = null;
    try {
      const whoisData = await whois(parsedUrl.hostname);
      const creation = (whoisData.creationDate || (whoisData as any).createdDate) || null;
      if (creation) {
        const createdDate = new Date(Array.isArray(creation) ? creation[0] : creation);
        const years = dayjs(now).diff(createdDate, 'year');
        domainAge = `${years} year${years !== 1 ? 's' : ''}`;
      }
    } catch {}

    // Local SEO
    const addressPhoneShown = $('a[href^="tel:"]').length > 0 || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(html);
    const localBusinessSchema = structuredData.some(i => (i as Record<string, unknown>)['@type'] === 'LocalBusiness');
    const googleBusinessProfileIdentified = html.includes('google.com/maps');

    // Social Results: extract real data
    const facebookPageLinks = $('a[href*="facebook.com"]').map((i, el) => $(el).attr('href')).get();
    const facebookPageLinked = facebookPageLinks.length ? facebookPageLinks.join(', ') : '';
    const openGraphTagsList = $('meta[property^="og:"]').map((i, el) => $(el).attr('content')).get();
    const openGraphTags = openGraphTagsList.length ? openGraphTagsList.join(', ') : '';
    const pixelMatch = html.match(/fbq\(['"]init['"],\s*['"]([^'"]+)['"]/);
    const facebookPixel = pixelMatch ? pixelMatch[1] : '';
    const xAccountLinkedList = $('a[href*="twitter.com"]').map((i, el) => $(el).attr('href')).get();
    const xAccountLinked = xAccountLinkedList.length ? xAccountLinkedList.join(', ') : '';
    const xCardsList = $('meta[name^="twitter:card"]').map((i, el) => $(el).attr('content')).get();
    const xCards = xCardsList.length ? xCardsList.join(', ') : '';
    const instagramLinkedList = $('a[href*="instagram.com"]').map((i, el) => $(el).attr('href')).get();
    const instagramLinked = instagramLinkedList.length ? instagramLinkedList.join(', ') : '';
    const linkedInList = $('a[href*="linkedin.com"]').map((i, el) => $(el).attr('href')).get();
    const linkedInPageLinked = linkedInList.length ? linkedInList.join(', ') : '';
    const youTubeLinks = $('a[href*="youtube.com"]').map((i, el) => $(el).attr('href')).get();
    const youTubeChannelLinked = youTubeLinks.length ? youTubeLinks.join(', ') : '';
    const youTubeEmbedUrls = $('iframe[src*="youtube.com/embed"]').map((i, el) => $(el).attr('src')).get();
    const youTubeChannelActivity = youTubeEmbedUrls.length ? youTubeEmbedUrls.join(', ') : '';

    const responseData = {
      title,
      titleLength,
      metaDescription: metaDesc,
      metaDescriptionLength: metaDescLength,
      serpSnippet,
      hreflangs,
      language,
      h1Tags,
      h2Tags,
      h3Tags,
      h4Tags,
      h5Tags,
      h6Tags,
      canonical,
      noindexMeta,
      noindexHeader,
      sslEnabled,
      httpsRedirect,
      robotsTxtExists,
      blockedByRobots,
      xmlSitemaps,
      analytics,
      gtagCode,
      gtmCode,
      domainAge,
      structuredData,
      metaImage,
      favicon,
      psi: psiData,
      // Detailed Performance Metrics extracted from Lighthouse audits
      performanceMetrics: {
        mobile: {
          firstContentfulPaint:
            psiData.mobile.lighthouseResult.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint:
            psiData.mobile.lighthouseResult.audits['largest-contentful-paint'].numericValue,
          speedIndex:
            psiData.mobile.lighthouseResult.audits['speed-index'].numericValue,
          timeToInteractive:
            psiData.mobile.lighthouseResult.audits['interactive'].numericValue,
          totalBlockingTime:
            psiData.mobile.lighthouseResult.audits['total-blocking-time'].numericValue,
          cumulativeLayoutShift:
            psiData.mobile.lighthouseResult.audits['cumulative-layout-shift'].numericValue,
        },
        desktop: {
          firstContentfulPaint:
            psiData.desktop.lighthouseResult.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint:
            psiData.desktop.lighthouseResult.audits['largest-contentful-paint'].numericValue,
          speedIndex:
            psiData.desktop.lighthouseResult.audits['speed-index'].numericValue,
          timeToInteractive:
            psiData.desktop.lighthouseResult.audits['interactive'].numericValue,
          totalBlockingTime:
            psiData.desktop.lighthouseResult.audits['total-blocking-time'].numericValue,
          cumulativeLayoutShift:
            psiData.desktop.lighthouseResult.audits['cumulative-layout-shift'].numericValue,
        },
      },
      // Benchmark comparison for key performance metrics
      performanceComparison: {
        mobile: {
          firstContentfulPaint: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['first-contentful-paint'].numericValue,
            1000,
            3000
          ),
          largestContentfulPaint: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['largest-contentful-paint'].numericValue,
            2500,
            4000
          ),
          speedIndex: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['speed-index'].numericValue,
            3000,
            5000
          ),
          timeToInteractive: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['interactive'].numericValue,
            5000,
            10000
          ),
          totalBlockingTime: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['total-blocking-time'].numericValue,
            200,
            600
          ),
          cumulativeLayoutShift: categorizeMetric(
            psiData.mobile.lighthouseResult.audits['cumulative-layout-shift'].numericValue,
            0.1,
            0.25
          ),
        },
        desktop: {
          firstContentfulPaint: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['first-contentful-paint'].numericValue,
            1000,
            3000
          ),
          largestContentfulPaint: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['largest-contentful-paint'].numericValue,
            2500,
            4000
          ),
          speedIndex: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['speed-index'].numericValue,
            3000,
            5000
          ),
          timeToInteractive: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['interactive'].numericValue,
            5000,
            10000
          ),
          totalBlockingTime: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['total-blocking-time'].numericValue,
            200,
            600
          ),
          cumulativeLayoutShift: categorizeMetric(
            psiData.desktop.lighthouseResult.audits['cumulative-layout-shift'].numericValue,
            0.1,
            0.25
          ),
        },
      },
      // Actionable recommendations derived from Lighthouse audit results
      actionableRecommendations: {
        mobile: Object.entries(
          psiData.mobile.lighthouseResult.audits
        )
          .filter(([, audit]) => (audit as any).score !== 1)
          .map(([id, audit]) => ({
            id,
            title: (audit as any).title,
            description: (audit as any).description,
          })),
        desktop: Object.entries(
          psiData.desktop.lighthouseResult.audits
        )
          .filter(([, audit]) => (audit as any).score !== 1)
          .map(([id, audit]) => ({
            id,
            title: (audit as any).title,
            description: (audit as any).description,
          })),
      },
      technology,
      serverIp,
      dnsServers,
      webServer,
      charset,
      dmarcRecord,
      spfRecord,
      addressPhoneShown,
      localBusinessSchema,
      googleBusinessProfileIdentified,
      facebookPageLinked,
      openGraphTags,
      facebookPixel,
      xAccountLinked,
      xCards,
      instagramLinked,
      linkedInPageLinked,
      youTubeChannelLinked,
      youTubeChannelActivity,
      headerUsage,
      linkAnalysis,
    };
    // Step 4: Cache the fresh audit result with current timestamp
    auditCache.set(url, { timestamp: now, data: responseData });
    if (!historyCache.has(url)) {
      historyCache.set(url, []);
    }
    historyCache.get(url)?.push({ timestamp: now, data: responseData });
    if (exportType === 'pdf') {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const hostname = parsedUrl.hostname.replace(/\./g, '_');
      const filename = `${hostname}_${timestamp}.pdf`;
      const pdfBytes = await generatePdf(responseData, template || 'default');
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (exportType === 'csv') {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const hostname = parsedUrl.hostname.replace(/\./g, '_');
      const filename = `${hostname}_${timestamp}.csv`;
      const csv = jsonToCsv(responseData as Record<string, unknown>);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    // Store audit in Supabase
    try {
      const { error: supabaseError } = await supabase
        .from('seoaudit')
        .insert([{ site_url: url, audit_data: responseData }]);
      if (supabaseError) console.error('Supabase insert error:', supabaseError);
    } catch (e) {
      console.error('Supabase insert exception:', e);
    }
    return NextResponse.json(responseData);
  } catch (err: unknown) {
    // Normalize error message
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}