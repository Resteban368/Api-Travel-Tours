import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lambda = require('../dist/lambda');
    await lambda(req, res);
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: e.message ?? String(e),
      code: e.code,
      requireStack: e.requireStack ?? [],
    }));
  }
}
