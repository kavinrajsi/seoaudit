import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { google } from "googleapis";
import dayjs from "dayjs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const siteUrl = url.searchParams.get('siteUrl');
  if (!siteUrl) {
    return NextResponse.json({ error: 'Missing siteUrl' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken as string });

  const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

  try {
    const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          { filters: [ { dimension: 'page', operator: 'equals', expression: siteUrl } ] }
        ],
        rowLimit: 1
      }
    });
    return NextResponse.json(res.data);
  } catch (error: unknown) {
    console.error('Search Console API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Search Console data' }, { status: 500 });
  }
}
