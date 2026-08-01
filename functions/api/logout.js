// functions/api/logout.js
//
// Clears the session cookie. Idempotent — always returns 200.

const COOKIE_NAME = "cc_session";

function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init.headers || {}),
        },
    });
}

export async function onRequestPost() {
    const cookie =
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    return json({ ok: true }, { status: 200, headers: { "set-cookie": cookie } });
}

export async function onRequestGet() {
    return json({ error: "Method not allowed." }, { status: 405 });
}