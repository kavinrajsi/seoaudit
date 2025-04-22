"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AuditItem {
  id: string;
  site_url: string;
  created_at: string;
  view_option: boolean;
  audit_data?: { favicon?: string };
}

interface HistoryListProps {
  initialAudits: AuditItem[];
}

export default function HistoryList({ initialAudits }: HistoryListProps) {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditItem[]>(initialAudits);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audit?')) return;
    const res = await fetch(`/api/history/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_option: false })
    });
    if (res.ok) {
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } else {
      console.error('Delete failed', await res.json());
    }
  };

  if (!audits || audits.length === 0) {
    return <p>No audit history found.</p>;
  }

  return (
    <ul className="space-y-4">
      {audits.map((audit) => (
        <li
          key={audit.id}
          onClick={() => router.push(`/history/${audit.id}`)}
          className="p-4 border rounded flex justify-between items-center cursor-pointer hover:bg-gray-50"
        >
          <div>
            <div className="font-medium text-lg flex items-center">
              {audit.audit_data?.favicon && (
                <img
                  src={audit.audit_data.favicon}
                  alt="favicon"
                  className="h-5 w-5 mr-2"
                />
              )}
              <span>{audit.site_url}</span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(audit.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* View icon removed; clicking row navigates */}
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleDelete(audit.id); }}
              className="p-2"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
