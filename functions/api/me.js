// functions/api/me.js
//
// Returns the currently signed-in reviewer based on the cc_session cookie,
// or 401 if no valid session is present.

const COOKIE_NAME = "cc_session";

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

function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init.headers || {}),
        },
    });
}

export async function onRequestGet({ request, env }) {
    const cookies = parseCookies(request.headers.get("cookie"));
    const user = await verifyToken(cookies[COOKIE_NAME], env);
    if (!user) return json({ error: "Not signed in." }, { status: 401 });
    return json({ user });
}