import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AuditData } from '@/app/audit/page';

interface Props { auditData: AuditData }

export default function TechnicalCard({ auditData }: Props) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Technical Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div><dt className="font-medium">Canonical URL</dt><dd>{auditData.canonical}</dd></div>
          <div><dt className="font-medium">Noindex (Meta)</dt><dd>{auditData.noindexMeta ? 'Yes' : 'No'}</dd></div>
          <div><dt className="font-medium">Noindex (Header)</dt><dd>{auditData.noindexHeader ? 'Yes' : 'No'}</dd></div>
          <div><dt className="font-medium">SSL Enabled</dt><dd>{auditData.sslEnabled ? 'Yes' : 'No'}</dd></div>
          <div><dt className="font-medium">HTTPS Redirect</dt><dd>{auditData.httpsRedirect ? 'Yes' : 'No'}</dd></div>
          <div>
            <dt className="font-medium">Sitemaps</dt>
            <dd>
              {auditData.xmlSitemaps.length > 0 ? (
                <ul>
                  {auditData.xmlSitemaps.map((s) => (
                    <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{s}</a></li>
                  ))}
                </ul>
              ) : 'None'}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Analytics Tags</dt>
            <dd>
              {auditData.analytics.length > 0 ? (
                <ul className="list-disc ml-4">
                  {auditData.analytics.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              ) : 'None'}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Google Analytics Snippet (gtag)</dt>
            <dd>
              {auditData.gtagCode ? (
                <pre className="overflow-auto bg-gray-100 p-2 rounded"><code>{auditData.gtagCode}</code></pre>
              ) : 'None'}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Google Tag Manager Snippet</dt>
            <dd>
              {auditData.gtmCode ? (
                <pre className="w-fit overflow-auto bg-gray-100 p-2 rounded"><code>{auditData.gtmCode}</code></pre>
              ) : 'None'}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Structured Data</dt>
            <dd>
              {auditData.structuredData.length > 0 ? (
                auditData.structuredData.map((sd, idx) => (
                  <pre key={idx} className="w-fit overflow-auto bg-gray-100 p-2 rounded mt-2"><code>{JSON.stringify(sd, null, 2)}</code></pre>
                ))
              ) : (
                'None'
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Robots.txt</dt>
            <dd>
              {auditData.robotsTxtExists && auditData.xmlSitemaps.length > 0 ? (
                <a href={new URL('/robots.txt', auditData.xmlSitemaps[0]).href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">robots.txt</a>
              ) : 'None'}
            </dd>
          </div>
          <div><dt className="font-medium">Blocked by Robots</dt><dd>{auditData.blockedByRobots ? 'Yes' : 'No'}</dd></div>
          <div><dt className="font-medium">Server IP</dt><dd>{auditData.serverIp}</dd></div>
          <div>
            <dt className="font-medium">DNS Servers</dt>
            <dd>
              {auditData.dnsServers.length > 0 ? (
                <ul className="list-disc ml-4">
                  {auditData.dnsServers.map((server) => (
                    <li key={server}>{server}</li>
                  ))}
                </ul>
              ) : (
                'None'
              )}
            </dd>
          </div>
          <div><dt className="font-medium">Domain Age</dt><dd>{auditData.domainAge ?? 'Unknown'}</dd></div>
          <div><dt className="font-medium">Web Server</dt><dd>{auditData.webServer}</dd></div>
          <div><dt className="font-medium">Charset</dt><dd>{auditData.charset || 'Unknown'}</dd></div>
          <div>
            <dt className="font-medium">DMARC Record</dt>
            <dd>
              {auditData.dmarcRecord ? (
                <pre className="overflow-auto bg-gray-100 p-2 rounded">{auditData.dmarcRecord}</pre>
              ) : (
                'None'
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium">SPF Record</dt>
            <dd>
              {auditData.spfRecord ? (
                <pre className="overflow-auto bg-gray-100 p-2 rounded">{auditData.spfRecord}</pre>
              ) : (
                'None'
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
