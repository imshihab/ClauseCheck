import { json, requireDB, requireUser } from "../_session.js";

export async function onRequestGet({ request, env, params }) {
    try {
        await requireUser(request, env);
        const db = requireDB(env);

        const id = params?.id;
        if (!id || typeof id !== "string") {
            return json({ error: "Contract id is required." }, { status: 400 });
        }

        const row = await db.prepare(
            "SELECT id, title, content, created_at, uploaded_by FROM contracts WHERE id = ?1",
        )
            .bind(id)
            .first();

        if (!row) {
            return json({ error: `Contract "${id}" not found.` }, { status: 404 });
        }

        return json({ contract: row });
    } catch (res) {
        return res;
    }
}

export async function onRequestPost() {
    return json({ error: "Method not allowed." }, { status: 405 });
}