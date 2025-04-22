import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import OnPageCard from '@/components/audit/OnPageCard';
import PerformanceCard from '@/components/audit/PerformanceCard';
import LinksCard from '@/components/audit/LinksCard';
import TechnicalCard from '@/components/audit/TechnicalCard';
import SocialCard from '@/components/audit/SocialCard';

interface Props {
  params: { id: string };
}

export default async function AuditDetailPage({ params }: Props) {
  const { id } = params;
  const { data: audit, error } = await supabase
    .from('seoaudit')
    .select('site_url, created_at, audit_data')
    .eq('id', id)
    .single();

  if (error || !audit) {
    notFound();
  }

  const { site_url, created_at, audit_data } = audit;
  const displayTime = new Date(created_at).toLocaleString();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{`${site_url} – ${displayTime}`}</h1>
      <Tabs defaultValue="technical" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="onpage">On-Page</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>
        <TabsContent value="technical"><TechnicalCard auditData={audit_data} /></TabsContent>
        <TabsContent value="onpage"><OnPageCard auditData={audit_data} /></TabsContent>
        <TabsContent value="performance"><PerformanceCard auditData={audit_data} /></TabsContent>
        <TabsContent value="links"><LinksCard auditData={audit_data} /></TabsContent>
        <TabsContent value="social"><SocialCard auditData={audit_data} /></TabsContent>
      </Tabs>
    </div>
  );
}
