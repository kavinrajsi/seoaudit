import { NextResponse } from 'next/server';
import { historyCache } from '../../../../lib/auditCache';

/**
 * GET /api/audit/history
 * Returns all past audit entries for a given URL to support trend analysis.
 * Query Parameters:
 *  - url: string (required) - the audited page URL
 * Response: JSON array of { timestamp: number; data: Record<string, unknown> }
 */
export async function GET(request: Request) {
  // Parse the requested URL and extract `url` param
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing `url` query parameter' }, { status: 400 });
  }

  // Retrieve history from in-memory cache
  const entries = historyCache.get(url) || [];

  // Sort entries chronologically (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Return the array of cache entries
  return NextResponse.json(entries);
}
