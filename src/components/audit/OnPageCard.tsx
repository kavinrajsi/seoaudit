import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AuditData } from '@/app/audit/page';

interface Props { auditData: AuditData }

export default function OnPageCard({ auditData }: Props) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>On-Page SEO Results</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium">Favicon</dt>
            <dd>{auditData.favicon ? <img src={auditData.favicon} alt="Favicon" className="w-8 h-8" /> : 'None'}</dd>
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
          </div>
          <div>
            <dt className="font-medium">Title Tag <span className='text-sm text-muted-foreground mb-1'>({auditData.titleLength} characters)</span></dt>
            <dd>{auditData.title}</dd>
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
          </div>
          <div>
            <dt className="font-medium">Meta Description Tag <span className='text-sm text-muted-foreground mb-1'>({auditData.metaDescriptionLength} characters)</span></dt>
            <dd>{auditData.metaDescription}</dd>
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
          </div>
          <div>
            <dt className="font-medium">SERP Snippet Preview</dt>
            <dd>{auditData.serpSnippet}</dd>
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
          </div>
          <div>
            <dt className="font-medium">Meta Image</dt>
            <dd>{auditData.metaImage ? <img src={auditData.metaImage} alt="Meta Image" className="max-h-48" /> : 'None'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
