import { json, requireDB, requireUser } from "../_session.js";

const MAX_CONTENT_BYTES = 200 * 1024;
const MAX_TITLE_CHARS = 200;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function randomId() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `U-${hex}`;
}

function autoTitle(content) {
    const m = String(content || "").match(/^Title:\s*(.+)$/m);
    return m ? m[1].trim() : "";
}

export async function onRequestGet({ request, env }) {
    try {
        await requireUser(request, env);
        const db = requireDB(env);
        const { results } = await db.prepare(
            "SELECT id, title, created_at, uploaded_by FROM contracts ORDER BY created_at ASC, id ASC",
        ).all();
        return json({ contracts: results || [] });
    } catch (res) {
        return res;
    }
}

export async function onRequestPost({ request, env }) {
    let user;
    try {
        ({ user } = await requireUser(request, env));
    } catch (res) {
        return res;
    }
    const db = requireDB(env);

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const submittedId = typeof body?.id === "string" && body.id.trim() ? body.id.trim() : "";
    const submittedTitle = typeof body?.title === "string" ? body.title.trim() : "";
    const submittedContent = typeof body?.content === "string" ? body.content : "";

    const id = submittedId || randomId();
    if (!ID_PATTERN.test(id)) {
        return json(
            { error: "Contract id must be 1–64 chars of letters, digits, '-' or '_'." },
            { status: 400 },
        );
    }

    if (!submittedContent.trim()) {
        return json({ error: "Contract content is required." }, { status: 400 });
    }
    if (submittedContent.length > MAX_CONTENT_BYTES) {
        return json(
            { error: `Contract content is too large (max ${MAX_CONTENT_BYTES} bytes).` },
            { status: 400 },
        );
    }

    const title = (submittedTitle || autoTitle(submittedContent)).slice(0, MAX_TITLE_CHARS);
    if (!title) {
        return json(
            { error: "A title is required (or include a 'Title: …' line in the contract)." },
            { status: 400 },
        );
    }

    // Single round-trip; PK constraint surfaces duplicates. Rely on D1's
    // SQLite error rather than a pre-flight SELECT — racing duplicates are
    // also caught, and we save one query on the happy path.
    let insertedId;
    try {
        const result = await db.prepare(
            "INSERT INTO contracts (id, title, content, uploaded_by) VALUES (?1, ?2, ?3, ?4)",
        )
            .bind(id, title, submittedContent, user.id)
            .run();
        insertedId = id;
        // Touch result so it's not flagged unused if we ever add return-value logic.
        void result;
    } catch (e) {
        const msg = String(e?.message || "");
        if (/UNIQUE constraint failed/i.test(msg)) {
            return json({ error: `Contract id "${id}" already exists.` }, { status: 409 });
        }
        throw e;
    }

    const row = await db.prepare(
        "SELECT id, title, created_at, uploaded_by FROM contracts WHERE id = ?1",
    )
        .bind(insertedId)
        .first();

    return json({ contract: row }, { status: 201 });
}