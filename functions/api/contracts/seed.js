import { json, requireDB, requireUser } from "../_session.js";
import { SEED_CONTRACTS } from "./seed-data.js";

export async function onRequestPost({ request, env }) {
    try {
        await requireUser(request, env);
        const db = requireDB(env);

        const statements = SEED_CONTRACTS.map((c) =>
            db.prepare(
                "INSERT OR IGNORE INTO contracts (id, title, content, uploaded_by) VALUES (?1, ?2, ?3, NULL)",
            ).bind(c.id, c.title, c.content),
        );
        const results = await db.batch(statements);
        const inserted = results.reduce(
            (n, r) => n + (r?.meta?.changes > 0 ? 1 : 0),
            0,
        );
        return json({ ok: true, inserted, total: SEED_CONTRACTS.length });
    } catch (res) {
        return res;
    }
}

export async function onRequestGet() {
    return json({ error: "Method not allowed." }, { status: 405 });
}