import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import HistoryList from '@/components/HistoryList';

export default async function HistoryPage() {
  const { data: audits, error } = await supabase
    .from('seoaudit')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return <div className="p-6 text-red-500">Error loading history: {error.message}</div>;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SEO Audit History</h1>
      <HistoryList initialAudits={audits} />
    </div>
  );
}
