const VENDEL_URL = process.env.VENDEL_URL;
const VENDEL_API_KEY = process.env.VENDEL_API_KEY;

if (!VENDEL_URL) {
  console.error("[adaptor] FATAL: VENDEL_URL env var is not set");
  process.exit(1);
}

if (!VENDEL_API_KEY) {
  console.error("[adaptor] FATAL: VENDEL_API_KEY env var is not set");
  process.exit(1);
}

/**
 * Sends an SMS via the Vendel gateway.
 * @param {string} to   - E.164 phone number
 * @param {string} body - SMS message text
 * @returns {{ ok: boolean, status: number, data?: object, detail?: string }}
 */
export async function sendSms(to, body) {
  let response;

  try {
    response = await fetch(`${VENDEL_URL}/api/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": VENDEL_API_KEY,
      },
      body: JSON.stringify({ recipients: [to], body }),
    });
  } catch (err) {
    console.error(`[adaptor] Network error reaching Vendel: ${err.message}`);
    return { ok: false, status: 502, detail: "Could not reach Vendel gateway" };
  }

  if (!response.ok) {
    let detail = `Vendel returned ${response.status}`;
    try {
      const json = await response.json();
      detail = json?.message ?? JSON.stringify(json);
    } catch {
      // non-JSON error body, ignore
    }
    return { ok: false, status: response.status >= 500 ? 502 : 400, detail };
  }

  const data = await response.json();
  return { ok: true, status: 200, data };
}
