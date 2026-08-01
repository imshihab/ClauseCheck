// functions/api/analyze.js
export async function onRequestPost({ request, env }) {
    const { contractText, clauseTypes, standards } = await request.json();

    const schema = {
        type: "object",
        properties: {
            clauses: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        clause_type: {
                            type: "string",
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
                        found: { type: "boolean" },
                        contract_clause_text: { type: "string" },
                        matched_standard_text: { type: "string" },
                        risk_level: {
                            type: "string",
                            enum: [
                                "low",
                                "medium",
                                "high",
                                "not_enough_information",
                            ],
                        },
                        reason: { type: "string" },
                        source: { type: "string" },
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
                    additionalProperties: false,
                },
            },
        },
        required: ["clauses"],
        additionalProperties: false,
    };

    const system = `You review contracts against company standards. Rules:
- Use only the contract text and standards given below. Never use outside knowledge of "typical" contract terms.
- For each requested clause type, copy the matching clause verbatim into contract_clause_text. Do not paraphrase.
- If no clause of that type exists in the contract, set found:false, risk_level:"not_enough_information", contract_clause_text:"", and reason:"Not enough information to make a reliable assessment."
- Never invent a clause, a standard, or a legal explanation.`;

    const user = `CONTRACT:\n"""${contractText}"""\n\nCLAUSE TYPES TO CHECK: ${clauseTypes.join(", ")}\n\nCOMPANY STANDARDS:\n${JSON.stringify(standards, null, 2)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-5",
            max_tokens: 2000,
            system,
            messages: [{ role: "user", content: user }],
            output_config: { format: { type: "json_schema", schema } },
        }),
    });

    const data = await res.json();
    const result = JSON.parse(data.content.find((b) => b.type === "text").text);

    // Grounding check — the actual anti-hallucination guardrail, not just prompting
    for (const c of result.clauses) {
        if (c.found && !contractText.includes(c.contract_clause_text.trim())) {
            c.found = false;
            c.risk_level = "not_enough_information";
            c.reason = "Not enough information to make a reliable assessment.";
            c.contract_clause_text = "";
        }
    }

    return Response.json(result);
}
