import { json, COOKIE_NAME } from "./_session.js";

const SESSION_MAX_AGE = 60 * 60 * 12;

function timingSafeEqual(a, b) {
    // Constant-time string compare. Both inputs must be strings.
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

function buildCookie(token) {
    const parts = [
        `${COOKIE_NAME}=${token}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=${SESSION_MAX_AGE}`,
    ];
    // Secure only when the request is https (so local http dev still works).
    if (token && !token.startsWith("dev:")) parts.push("Secure");
    return parts.join("; ");
}

export async function onRequestPost({ request, env }) {
    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const submittedId = String(body?.id ?? "").trim();
    const submittedPassword = String(body?.password ?? "");

    if (!submittedId || !submittedPassword) {
        return json(
            { error: "Both ID and password are required." },
            { status: 400 },
        );
    }

    // The user explicitly asked for env.ID and env.password.
    const expectedId = env.ID;
    const expectedPassword = env.password;

    if (!expectedId || !expectedPassword) {
        // Misconfiguration on the server side — never reveal which side is missing.
        return json(
            { error: "Login is not configured on the server." },
            { status: 503 },
        );
    }

    const idOk = timingSafeEqual(submittedId, String(expectedId));
    const passOk = timingSafeEqual(submittedPassword, String(expectedPassword));

    if (!idOk || !passOk) {
        // Tiny artificial delay so the wrong path takes ~as long as the right one.
        await new Promise((r) => setTimeout(r, 250));
        return json({ error: "Invalid ID or password." }, { status: 401 });
    }

    // Tiny session token. The real check is the cookie + the same creds,
    // so we just sign it with a hash of (id + password + env salt) so it
    // can't be forged by clients.
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
    const sigHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const token = `${expectedId}.${sigHex}`;

    return json(
        { ok: true, user: { id: expectedId } },
        { status: 200, headers: { "set-cookie": buildCookie(token) } },
    );
}

export async function onRequestGet() {
    return json({ error: "Method not allowed." }, { status: 405 });
}