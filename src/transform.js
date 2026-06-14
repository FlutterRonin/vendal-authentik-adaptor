/**
 * Authentik Generic SMS POST payload:
 * {
 *   "From": "<from_number>",
 *   "To": "<user_phone>",
 *   "Body": "<otp_token>"
 * }
 *
 * Vendel expects:
 * {
 *   "recipients": ["<user_phone>"],
 *   "body": "<otp_token>"
 * }
 */
export function transformPayload(raw) {
  // Authentik may send fields in any casing, handle both
  const to = raw?.To ?? raw?.to;
  const body = raw?.Body ?? raw?.body;

  if (!to) return { error: 'Missing "To" field in request' };
  if (!body) return { error: 'Missing "Body" field in request' };

  return {
    to,
    body,
  };
}
