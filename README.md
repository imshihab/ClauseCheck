# Contract Review — Hackathon Project

A tool that reviews a contract clause-by-clause against a company's own standards and flags risk. It uses Google's Gemini API for the heavy reasoning and a Cloudflare Pages Function as the backend, with a deterministic local fallback so the UI always demonstrates the workflow even when the API key isn't configured.

---

## Table of contents

1. [What the app does](#what-the-app-does)
2. [High-level architecture](#high-level-architecture)
3. [Repo layout](#repo-layout)
4. [The analyze pipeline, end to end](#the-analyze-pipeline-end-to-end)
5. [`functions/api/analyze.js` — the server](#functionsapianalyzejs--the-server)
   - [Why a Cloudflare Pages Function](#why-a-cloudflare-pages-function)
   - [Request shape](#request-shape)
   - [The system prompt](#the-system-prompt)
   - [The response schema](#the-response-schema)
   - [Why we force JSON with `responseSchema`](#why-we-force-json-with-responseschema)
   - [Safety settings](#safety-settings)
   - [Calling Gemini](#calling-gemini)
   - [The four guards that turn opaque 500s into useful 502s](#the-four-guards-that-turn-opaque-500s-into-useful-502s)
   - [The grounding loop — the real anti-hallucination guardrail](#the-grounding-loop--the-real-anti-hallucination-guardrail)
   - [Final response](#final-response)
6. [`src/lib/analyze.js` — the client](#srclibanalyzejs--the-client)
   - [Why a local fallback exists](#why-a-local-fallback-exists)
   - [Local analyzer heuristics](#local-analyzer-heuristics)
7. [Environment variables](#environment-variables)
8. [Running locally](#running-locally)
9. [Deploying to Cloudflare Pages](#deploying-to-cloudflare-pages)
10. [Troubleshooting](#troubleshooting)

---

## What the app does

A user uploads (or picks) a contract, selects which clause categories they want reviewed (Payment, Termination, Data Protection, Confidentiality, Auto-Renewal, IP, Limitation of Liability), and the app returns, for each category:

- whether that clause **was found** in the contract,
- the **verbatim clause text** copied out of the contract,
- the **matched company standard**,
- a **risk level** (`low` / `medium` / `high` / `not_enough_information`),
- a **reason** grounded in the standard,
- and a **source** label so reviewers know where the verdict came from.

The crucial design choice: the model is *not* asked to "summarise what this contract probably means." It is asked to *locate* specific clauses and *copy them verbatim*. If a clause isn't in the contract, it returns `not_enough_information` rather than guessing.

---

## High-level architecture

```
┌────────────────────┐    POST /api/analyze    ┌──────────────────────────────────┐
│  React UI (Vite)   │ ──────────────────────► │ functions/api/analyze.js         │
│  src/lib/analyze.js│                         │   Cloudflare Pages Function      │
│                    │ ◄────────────────────── │                                  │
│   • fetch AI path  │     { clauses: [...] }  │   • Validates request            │
│   • local fallback │                         │   • Calls Gemini                 │
└────────────────────┘                         │   • responseSchema (JSON shape)   │
        │                                      │   • 4 error guards               │
        │ if /api/analyze fails                │   • grounding loop               │
        ▼                                      └──────────────┬───────────────────┘
┌────────────────────┐                                        │
│  Local analyzer    │                                        ▼
│  (deterministic)   │                       ┌──────────────────────────────┐
│  src/lib/analyze.js│                       │  Google Gemini API           │
│  functions/...     │                       │  gemini-3.5-flash            │
└────────────────────┘                       │  :generateContent            │
                                             └──────────────────────────────┘
```

The AI path is preferred because it actually understands language. The local fallback is a safety net for the demo (no key configured, offline, API outage).

---

## Repo layout

```
.
├── functions/
│   └── api/
│       ├── analyze.js      ← AI path: calls Gemini, enforces JSON, grounds results
│       ├── login.js        ← auth (see wrangler.toml for env vars)
│       ├── logout.js
│       ├── me.js
│       └── _session.js     ← shared session helper
├── src/
│   ├── lib/
│   │   ├── analyze.js      ← client-side analyzer (AI + local fallback)
│   │   ├── auth.jsx
│   │   ├── contracts.js
│   │   └── data.js
│   ├── Pages/
│   ├── components/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── wrangler.toml           ← Cloudflare Pages config (D1 binding, build dir)
├── .dev.vars               ← LOCAL secrets (gitignored)
├── Datasets/               ← sample contracts + standards JSON
├── schema.sql              ← D1 schema
├── design.md
└── package.json
```

---

## The analyze pipeline, end to end

1. UI collects the contract text and the user's selected clause types.
2. `src/lib/analyze.js#analyzeContract` POSTs to `/api/analyze`.
3. Cloudflare routes `/api/*` to `functions/api/analyze.js`.
4. That function:
   - parses the JSON body,
   - builds a `responseSchema` matching our internal shape,
   - POSTs to Gemini with `responseMimeType: "application/json"`,
   - guards against upstream errors, missing parts, unfinished generations, and bad JSON,
   - runs a **grounding loop** that verifies every quoted clause actually appears in the contract text,
   - returns the cleaned result.
5. The client normalises the response into its own shape (`clauseType`, `riskLevel`, …) and renders.
6. If any of the above throws or the request fails, the client falls back to `analyzeLocal`, a deterministic regex-based analyzer that uses the contract text + standards only — no model.

---

## `functions/api/analyze.js` — the server

This is a Cloudflare Pages Function. It's the only piece of code that talks to Gemini; the browser never sees the API key.

### Why a Cloudflare Pages Function

- It's co-located with the static site (same project, same domain) so the browser hits `/api/analyze` with no CORS or extra auth setup.
- Secrets (`GEMINI_API_KEY`) come from `.dev.vars` locally and from `wrangler pages secret put` in production — never from the client.
- The function runs on the edge, so the round trip to Gemini is one hop from the user.

### Request shape

The function expects a JSON POST body:

```jsonc
{
  "contractText": "1.1 Payment. ...full contract text...",
  "clauseTypes":  ["payment", "termination", "data_protection", "confidentiality"],
  "standards":    [ /* the parsed company_standards.json */ ]
}
```

`clauseTypes` are the IDs the client wants checked (drawn from `CLAUSE_TYPES` in `src/lib/data.js`); `standards` is the full standards array, serialised into the prompt.

### The system prompt

```
You review contracts against company standards. Rules:
- Use only the contract text and standards given below. Never use outside knowledge
  of "typical" contract terms.
- For each requested clause type, copy the matching clause verbatim into
  contract_clause_text. Do not paraphrase.
- If no clause of that type exists in the contract, set found:false,
  risk_level:"not_enough_information", contract_clause_text:"", and
  reason:"Not enough information to make a reliable assessment."
- Never invent a clause, a standard, or a legal explanation.
```

Three things this prompt is doing:

1. **Anti-knowledge instruction.** LLMs default to "here's what a typical payment clause looks like." We explicitly forbid that — the model must work only from the contract + standards we gave it.
2. **Verbatim copy requirement.** The output's `contract_clause_text` is used as a citation. Paraphrasing would defeat the grounding loop below.
3. **`not_enough_information` as an explicit option.** This is more useful to a reviewer than a confident hallucination. Reviewers learn to trust the "we don't know" answer.

### The response schema

```js
const responseSchema = {
  type: "OBJECT",
  properties: {
    clauses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          clause_type:           { type: "STRING" },
          found:                 { type: "BOOLEAN" },
          contract_clause_text:  { type: "STRING" },
          matched_standard_text: { type: "STRING" },
          risk_level:            { type: "STRING" },
          reason:                { type: "STRING" },
          source:                { type: "STRING" },
        },
        required: [
          "clause_type", "found", "contract_clause_text",
          "matched_standard_text", "risk_level", "reason", "source",
        ],
      },
    },
  },
  required: ["clauses"],
};
```

The `required` array guarantees no field can be missing. `responseMimeType: "application/json"` (sent alongside) tells Gemini to return valid JSON, not JSON-inside-prose.

> **Note on enums.** Earlier drafts of this schema constrained `clause_type` and `risk_level` to enum lists. Gemini's schema validator is strict about enum value casing and surface a generic "internal error" when expectations don't match — and the values can drift between API versions. We intentionally keep the schema as `STRING` and rely on the system prompt + the grounding loop for correctness. If you want the enum back, do it on the *client* side (map unknown values to `not_enough_information`).

### Why we force JSON with `responseSchema`

Without it, the model might return:

```
Here is the analysis:
{"clauses": [...]}
Hope this helps!
```

…and we'd need a brittle regex to extract the JSON. With `responseMimeType: "application/json"` plus `responseSchema`:

- Gemini guarantees the output parses as JSON,
- the structure is fixed (no missing fields, no extra ones),
- we can call `JSON.parse(part.text)` and trust the result.

### Safety settings

```js
safetySettings: [
  { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
]
```

Contract clauses routinely contain words like "breach," "liability," "termination for cause," "harm," etc. — perfectly legal language that Gemini's default safety filters will sometimes refuse to process. Setting every category to `BLOCK_NONE` keeps Gemini focused on the legal task. We're not generating harmful content; we're reviewing it.

### Calling Gemini

```js
const GEMINI_MODEL     = "gemini-3.5-flash";
const GEMINI_ENDPOINT  =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const res = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents:          [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
      maxOutputTokens: 8192,
    },
    safetySettings: [ /* see above */ ],
  }),
});
```

A few choices worth knowing about:

- **`v1beta`** — Google keeps `v1` reserved for stable GA. `v1beta` is where structured-output features like `responseSchema` live.
- **`?key=...` query param** — Google's documented auth pattern for the AI Studio REST API. (`x-goog-api-key` header works too.)
- **`temperature: 0`** — we want deterministic clause extraction, not creative rewording. Reviewers should get the same answer every time for the same contract.
- **`maxOutputTokens: 8192`** — a generous ceiling so a 7-clause analysis with full text quotes doesn't truncate mid-clause. The `finishReason` guard below would otherwise let a truncated response look like a valid one.

### The four guards that turn opaque 500s into useful 502s

Cloudflare Pages surfaces any uncaught exception inside a Function as `500 Internal Server Error; reference=h6hhik1inh3e4ks6e4qm3u6q`. That reference is useless for debugging. Each guard catches a *specific* failure mode and returns a structured `502 Bad Gateway` with diagnostic detail the client can show in the UI:

| # | Guard                                                                                            | Catches                                                                                                | Response                                                                                  |
|---|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| 1 | `if (!env.GEMINI_API_KEY)`                                                                       | Function deployed without a secret configured                                                          | `{ error: "missing_gemini_api_key" }`                                                      |
| 2 | `if (!res.ok)`                                                                                   | Bad key, model retired, quota, regional restriction, billing                                          | `{ error: "upstream_gemini_error", status, detail: <Google's error body> }`                |
| 3 | `if (candidate?.finishReason && candidate.finishReason !== "STOP")`                              | Hit `MAX_TOKENS`, blocked by a safety filter, or stopped for some other reason mid-generation          | `{ error: "generation_interrupted", finishReason, message }`                              |
| 4 | `if (!part || typeof part.text !== "string")` and the surrounding `try { JSON.parse(...) }`      | Empty content, refusal, or malformed JSON                                                               | `{ error: "no_text_part", ... }` or `{ error: "invalid_json", message, raw: <first 500> }` |

The pattern is the same in every case: **never let an upstream failure become an opaque 500**. If anything goes wrong, the client gets a structured error and can fall back to the local analyzer (see below).

### The grounding loop — the real anti-hallucination guardrail

This is the part that actually defends against the model inventing clauses. The prompt says "copy verbatim" and "never invent," but LLMs hallucinate anyway. The grounding loop doesn't trust the prompt — it verifies:

```js
for (const c of result.clauses || []) {
  if (c.found && !contractText.includes(c.contract_clause_text.trim())) {
    c.found = false;
    c.risk_level = "not_enough_information";
    c.reason = "Not enough information to make a reliable assessment.";
    c.contract_clause_text = "";
  }
}
```

For every clause the model claims it found:

1. Take the verbatim text the model copied out.
2. `String.prototype.includes` against the full contract.
3. If the substring is **not** in the contract, the model lied. Overwrite the clause with `not_enough_information`.

This is strict — any whitespace mismatch will fail the check. That's intentional. If we can't find the quoted text in the contract, we don't trust the verdict.

### Final response

The cleaned `result` object is returned verbatim with `Response.json(result)`. The client (`src/lib/analyze.js`) is responsible for translating the snake_case keys into its own camelCase shape.

---

## `src/lib/analyze.js` — the client

This is the browser-side wrapper around `/api/analyze`. It has two completely separate code paths in one file: the AI path and the local fallback.

### Why a local fallback exists

The AI path can fail in many ways: no `GEMINI_API_KEY` configured in the local environment, the dev server is offline, the user is on a flaky connection, Google returns a billing error, the schema validation goes wrong, etc. For a demo we want the UI to *always* produce a result the user can click through and understand — even if the underlying reasoning is less rich. The fallback uses only the contract text and the standards JSON; it never invents a clause.

```js
try {
  const res = await fetch("/api/analyze", { /* ... */ });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return normaliseAiResult(await res.json());
} catch (err) {
  console.warn("[analyze] AI path unavailable, using local fallback:", err.message);
  return { source: "fallback", clauses: analyzeLocal(...) };
}
```

The two paths produce the same shape so the UI doesn't care which one ran. The `source` field ("ai" vs "fallback") lets the UI label the verdict accordingly so reviewers aren't misled about provenance.

### Local analyzer heuristics

The fallback is a small rule engine. It does **not** understand language. It:

1. Splits the contract into sections on `^\d+\.\d+\s+[A-Z]` headings.
2. For each requested clause type, scans section bodies for keywords (e.g. `payment` / `invoice` for the `payment` clause).
3. If a section matches, runs category-specific heuristics:
   - **payment** — flags sub-standard due days, 100% upfront requirements.
   - **termination** — flags sub-standard notice periods, no-cure rights, one-sided termination.
   - **data_protection** — flags missing encryption requirements, slow breach notice, subprocessor additions without approval.
   - **confidentiality** — flags short confidentiality terms, no obligation at all.
   - **automatic_renewal** — flags long non-cancellation windows, missing reminders.
   - **intellectual_property** — flags non-transferable / vendor-owned deliverables.
   - **limitation_of_liability** — flags sub-standard liability caps, unlimited liability for one party, missing carve-outs for fraud / data protection / IP.
4. Scores each clause on the deviations found and maps the score to `low` / `medium` / `high`.

This produces results that are demonstrably *less good* than the AI path but are still useful for a demo. The comment block above `analyzeLocal` calls this out explicitly:

> This is NOT a substitute for the AI path. It's here so the demo still produces evidence-backed results when no API key is configured. It only uses the contract text + standards as inputs and never invents a clause.

---

## Environment variables

| Var                | Where                | Purpose                                          |
|--------------------|----------------------|--------------------------------------------------|
| `ID`               | `.dev.vars` / secret | Login username (see `functions/api/login.js`)    |
| `password`         | `.dev.vars` / secret | Login password                                   |
| `SESSION_SECRET`   | `.dev.vars` / secret | Signs the session cookie                         |
| `ANTHROPIC_API_KEY`| `.dev.vars` / secret | **Unused now** — kept for backwards compatibility |
| `GEMINI_API_KEY`   | `.dev.vars` / secret | Google AI Studio API key for `gemini-3.5-flash`  |

`.dev.vars` is gitignored. For production, secrets live in the Cloudflare dashboard (or are set via `wrangler pages secret put`).

---

## Running locally

```bash
npm install
npm run dev
```

Vite serves the SPA on `http://localhost:5173` and Cloudflare Pages Functions are served by wrangler on `http://127.0.0.1:8788`. The Vite config proxies `/api/*` to wrangler so the browser just hits `/api/analyze`.

Before the first run, create `.dev.vars` (gitignored) at the project root:

```
ID=hackathon
password=hackathon
SESSION_SECRET=any-long-random-string
GEMINI_API_KEY=AIzaSy...your-key-from-aistudio.google.com
```

Without `GEMINI_API_KEY`, the AI path 502s and the client uses the local fallback automatically — the UI still works end to end.

---

## Deploying to Cloudflare Pages

```bash
npm run build
wrangler pages deploy dist --project-name contract-review
```

Then set the secrets in the Cloudflare dashboard (Pages → your project → Settings → Environment variables), or from the CLI:

```bash
wrangler pages secret put GEMINI_API_KEY --project-name contract-review
wrangler pages secret put ID            --project-name contract-review
wrangler pages secret put PASSWORD      --project-name contract-review
wrangler pages secret put SESSION_SECRET --project-name contract-review
```

`wrangler.toml` already declares the D1 binding:

```toml
[[d1_databases]]
binding = "DB"
database_name = "contract-review-db"
database_id   = "d2f4d84d-cbac-4419-bd5a-127cb4a89731"
```

---

## Troubleshooting

### `500 Internal Server Error; reference=h6hhik1inh3e4ks6e4qm3u6q`

A Cloudflare Pages Function threw an uncaught exception. The reference id is intentionally useless — look at the **terminal where wrangler is running**, not the browser. The stack trace there has the real file and line number. The four guards in `functions/api/analyze.js` exist specifically to prevent this from happening for known failure modes.

### `{ "error": "upstream_gemini_error", "status": 404 }`

The model name is wrong or has been retired by Google. Update `GEMINI_MODEL` at the top of `functions/api/analyze.js`. To see what's actually available to your key:

```bash
source .dev.vars
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" \
  | python3 -c "import sys, json; print('\n'.join(m['name'] for m in json.load(sys.stdin)['models']))"
```

### `{ "error": "upstream_gemini_error", "status": 400, "detail": { ... "API key not valid" } }`

`GEMINI_API_KEY` in `.dev.vars` is still the placeholder `your-google-ai-studio-key-here`, or the key has been revoked. Get a new key at https://aistudio.google.com/apikey.

### `{ "error": "generation_interrupted", "finishReason": "MAX_TOKENS" }`

The model hit the output token cap before finishing. Raise `maxOutputTokens` (currently 8192) in `functions/api/analyze.js`. If you raise it past the model's hard limit, the API will 400 and the guard will catch it as `upstream_gemini_error`.

### `{ "error": "generation_interrupted", "finishReason": "SAFETY" }`

A safety filter tripped. We already set every category to `BLOCK_NONE`, so this usually means the prompt itself triggered something — review the contract text and standards being sent.

### The UI says "AI" but the results look like regex matches

The AI path fell back silently. Open the browser console: you'll see `[analyze] AI path unavailable, using local fallback: API 500` or similar. Whatever the upstream error was, the four guards in `analyze.js` should have produced a structured 502 — chase that error.