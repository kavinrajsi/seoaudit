export async function fetchAudit(url: string) {
  const res = await fetch(`/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`/api/history`);
  return res.json();
}
