import { json, requireUser } from "./_session.js";

export async function onRequestGet({ request, env }) {
    try {
        const { user } = await requireUser(request, env);
        return json({ user });
    } catch (res) {
        return res;
    }
}