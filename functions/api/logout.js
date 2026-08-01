import { json, COOKIE_NAME } from "./_session.js";

export async function onRequestPost() {
    const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    return json({ ok: true }, { status: 200, headers: { "set-cookie": cookie } });
}

export async function onRequestGet() {
    return json({ error: "Method not allowed." }, { status: 405 });
}