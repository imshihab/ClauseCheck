// Shared auth + response helpers used by every protected Pages Function.

export const COOKIE_NAME = "cc_session";

export function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init.headers || {}),
        },
    });
}

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    for (const part of header.split(";")) {
        const [k, ...rest] = part.trim().split("=");
        if (!k) continue;
        out[k] = decodeURIComponent(rest.join("="));
    }
    return out;
}

async function verifyToken(token, env) {
    if (!token || !token.includes(".")) return null;
    const [id, sigHex] = token.split(".");
    if (!id || !sigHex) return null;

    const expectedId = String(env.ID || "");
    const expectedPassword = String(env.password || "");
    if (!expectedId || !expectedPassword) return null;
    if (id !== expectedId) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(String(env.SESSION_SECRET || "clausecheck-dev-salt")),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${expectedId}|${expectedPassword}`),
    );
    const expectedHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    if (expectedHex !== sigHex) return null;

    return { id: expectedId };
}

// Returns { user } on success. On failure throws a 401 Response that callers
// should return directly: `try { const { user } = await requireUser(req, env); }
// catch (r) { return r; }`.
export async function requireUser(request, env) {
    const cookies = parseCookies(request.headers.get("cookie"));
    const user = await verifyToken(cookies[COOKIE_NAME], env);
    if (!user) throw json({ error: "Not signed in." }, { status: 401 });
    return { user };
}

export function requireDB(env) {
    if (!env.DB) throw json({ error: "D1 database is not bound." }, { status: 503 });
    return env.DB;
}