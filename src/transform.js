const APP_NAME = process.env.SMS_APP_NAME ?? 'App';
const APP_HASH = process.env.SMS_APP_HASH ?? '';

export function transformPayload(raw) {
  const to = raw?.To ?? raw?.to;
  const body = raw?.Body ?? raw?.body;

  if (!to) return { error: 'Missing "To" field in request' };
  if (!body) return { error: 'Missing "Body" field in request' };

  // Format required by Android SMS Retriever API:
  // must end with the 11-character app hash on its own line
  const message = `${APP_NAME}: Your verification code is ${body}\n${APP_HASH}`.trim();

  return { to, body: message };
}
