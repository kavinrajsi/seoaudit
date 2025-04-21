import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AuditData } from '@/app/audit/page';

interface SocialCardProps {
  auditData: AuditData;
}

export default function SocialCard({ auditData }: SocialCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Social</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium">Facebook Page Linked</dt>
            <dd>{auditData.facebookPageLinked}</dd>
          </div>
          <div>
            <dt className="font-medium">Open Graph Tags</dt>
            <dd>{auditData.openGraphTags }</dd>
          </div>
          <div>
            <dt className="font-medium">Facebook Pixel</dt>
            <dd>{auditData.facebookPixel }</dd>
          </div>
          <div>
            <dt className="font-medium">X/Twitter Account Linked</dt>
            <dd>{auditData.xAccountLinked }</dd>
          </div>
          <div>
            <dt className="font-medium">X Cards</dt>
            <dd>{auditData.xCards }</dd>
          </div>
          <div>
            <dt className="font-medium">Instagram Linked</dt>
            <dd>{auditData.instagramLinked }</dd>
          </div>
          <div>
            <dt className="font-medium">LinkedIn Page Linked</dt>
            <dd>{auditData.linkedInPageLinked }</dd>
          </div>
          <div>
            <dt className="font-medium">YouTube Channel Linked</dt>
            <dd>{auditData.youTubeChannelLinked }</dd>
          </div>
          <div>
            <dt className="font-medium">YouTube Channel Activity</dt>
            <dd>{auditData.youTubeChannelActivity }</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
