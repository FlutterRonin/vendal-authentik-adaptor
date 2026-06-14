import { timingSafeEqual } from "crypto";

const ADAPTOR_PASSWORD = process.env.ADAPTOR_PASSWORD;

if (!ADAPTOR_PASSWORD) {
  console.error("[adaptor] FATAL: ADAPTOR_PASSWORD env var is not set");
  process.exit(1);
}

/**
 * Validates incoming requests from Authentik.
 * Authentik Generic SMS supports HTTP Basic or Bearer token auth.
 * We support both here — the token/password is ADAPTOR_PASSWORD in both cases.
 */
export function validateAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  let incoming = null;

  if (authHeader.startsWith("Basic ")) {
    // Authentik sends Basic base64(username:password)
    const b64 = authHeader.slice(6);
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    // password is the part after the first colon
    incoming = decoded.split(":").slice(1).join(":");
  } else if (authHeader.startsWith("Bearer ")) {
    incoming = authHeader.slice(7);
  } else {
    return res.status(401).json({ error: "Unsupported auth scheme" });
  }

  // Constant-time compare to prevent timing attacks
  try {
    const a = Buffer.from(incoming);
    const b = Buffer.from(ADAPTOR_PASSWORD);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("mismatch");
    }
  } catch {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
}
