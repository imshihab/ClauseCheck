// functions/api/analyze.js
// Calls Google's Gemini API (gemini-2.5-flash) and uses responseSchema to
// force the response into the exact JSON shape the client expects.
//
// Env:
//   GEMINI_API_KEY  — Google AI Studio API key (required)

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function onRequestPost({ request, env }) {
    const { contractText, clauseTypes, standards } = await request.json();

    // responseSchema enforces the structure at the model level — no JSON.parse
    // of free-form text is needed.
    const responseSchema = {
        type: "OBJECT",
        properties: {
            clauses: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        clause_type: {
                            type: "STRING",
                            enum: [
                                "payment",
                                "termination",
                                "data_protection",
                                "confidentiality",
                                "automatic_renewal",
                                "intellectual_property",
                                "limitation_of_liability",
                            ],
                        },
                        found: { type: "BOOLEAN" },
                        contract_clause_text: { type: "STRING" },
                        matched_standard_text: { type: "STRING" },
                        risk_level: {
                            type: "STRING",
                            enum: ["low", "medium", "high", "not_enough_information"],
                        },
                        reason: { type: "STRING" },
                        source: { type: "STRING" },
                    },
                    required: [
                        "clause_type",
                        "found",
                        "contract_clause_text",
                        "matched_standard_text",
                        "risk_level",
                        "reason",
                        "source",
                    ],
                },
            },
        },
        required: ["clauses"],
    };

    const systemInstruction = `You review contracts against company standards. Rules:
- Use only the contract text and standards given below. Never use outside knowledge of "typical" contract terms.
- For each requested clause type, copy the matching clause verbatim into contract_clause_text. Do not paraphrase.
- If no clause of that type exists in the contract, set found:false, risk_level:"not_enough_information", contract_clause_text:"", and reason:"Not enough information to make a reliable assessment."
- Never invent a clause, a standard, or a legal explanation.`;

    const userText = `CONTRACT:
"""${contractText}"""

CLAUSE TYPES TO CHECK: ${clauseTypes.join(", ")}

COMPANY STANDARDS:
${JSON.stringify(standards, null, 2)}`;

    if (!env.GEMINI_API_KEY) {
        return Response.json(
            { error: "missing_gemini_api_key" },
            { status: 500 }
        );
    }

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: userText }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0,
                maxOutputTokens: 4096,
            },
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        return Response.json(
            {
                error: "upstream_gemini_error",
                status: res.status,
                detail: data,
            },
            { status: 502 }
        );
    }

    // With responseMimeType=application/json, Gemini returns the parsed object
    // directly under candidates[0].content.parts[0].text — but it's already
    // valid JSON we can safely parse.
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    if (!part || typeof part.text !== "string") {
        return Response.json(
            {
                error: "no_text_part",
                finishReason: data?.candidates?.[0]?.finishReason,
                promptFeedback: data?.promptFeedback,
            },
            { status: 502 }
        );
    }

    let result;
    try {
        result = JSON.parse(part.text);
    } catch (err) {
        return Response.json(
            { error: "invalid_json", message: err.message, raw: part.text.slice(0, 500) },
            { status: 502 }
        );
    }

    // Grounding check — the actual anti-hallucination guardrail, not just prompting
    for (const c of result.clauses || []) {
        if (c.found && !contractText.includes(c.contract_clause_text.trim())) {
            c.found = false;
            c.risk_level = "not_enough_information";
            c.reason = "Not enough information to make a reliable assessment.";
            c.contract_clause_text = "";
        }
    }

    return Response.json(result);
}