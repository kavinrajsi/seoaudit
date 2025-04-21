import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AuditData } from '@/app/audit/page';

interface Props { auditData: AuditData }

export default function LinksCard({ auditData }: Props) {
  const { linkAnalysis } = auditData;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ['Total Backlinks', linkAnalysis.totalLinks],
                ['Referring Domains', linkAnalysis.referringDomainsCount],
                ['Nofollow Backlinks', linkAnalysis.nofollowLinksCount],
                ['Dofollow Backlinks', linkAnalysis.dofollowLinksCount],
                ['Edu Backlinks', linkAnalysis.eduLinksCount],
                ['Gov Backlinks', linkAnalysis.govLinksCount],
                ['Subnets', linkAnalysis.uniqueSubnetsCount],
                ['IPs', linkAnalysis.uniqueIpsCount],
                ['Internal Links', linkAnalysis.onPageLinkStructure.internal],
                ['External Links', linkAnalysis.onPageLinkStructure.external],
                ['Friendly Links', linkAnalysis.friendlyLinksCount],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{label}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 font-semibold">Top Pages by Backlinks</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium">Page URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {linkAnalysis.topPagesByBacklinks.map(({ url, count }) => (
                <tr key={url}>
                  <td className="px-6 py-4 whitespace-nowrap"><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{url}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 font-semibold">Top Anchors by Backlinks</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium">Anchor Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {linkAnalysis.topAnchorsByBacklinks.map(({ anchor, count }) => (
                <tr key={anchor}>
                  <td className="px-6 py-4 whitespace-nowrap">{anchor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 font-semibold">Top Referring Domain Geographies</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium">Geography</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {linkAnalysis.topDomainGeographies.map(({ geography, count }) => (
                <tr key={geography}>
                  <td className="px-6 py-4 whitespace-nowrap">{geography}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
