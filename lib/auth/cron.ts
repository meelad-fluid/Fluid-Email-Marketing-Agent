// Vercel Cron calls scheduled routes with "Authorization: Bearer <CRON_SECRET>".
export function isCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}
