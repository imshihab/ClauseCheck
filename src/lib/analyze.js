// Client-side analyzer wrapper.
// Tries the Cloudflare Pages Function at /api/analyze (which calls Claude).
// If the request fails (no API key configured, offline demo, etc.) we fall
// back to a deterministic local analyzer so the UI always demonstrates the
// required workflow.

import { CLAUSE_TYPES } from "./data";

const NOT_ENOUGH = "Not enough information to make a reliable assessment.";

export async function analyzeContract({ contractText, clauseTypeIds, standards }) {
    const requested = CLAUSE_TYPES.filter((c) => clauseTypeIds.includes(c.id));

    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                contractText,
                clauseTypes: requested.map((c) => c.id),
                standards,
            }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        // Normalise to the client-side shape we use everywhere
        return {
            source: "ai",
            clauses: data.clauses.map((c) => ({
                clauseType: c.clause_type,
                clauseLabel:
                    CLAUSE_TYPES.find((t) => t.id === c.clause_type)?.label ||
                    c.clause_type,
                found: c.found,
                contractClauseText: c.contract_clause_text,
                matchedStandardText: c.matched_standard_text,
                riskLevel: c.risk_level,
                reason: c.reason,
                source: c.source,
            })),
        };
    } catch (err) {
        console.warn("[analyze] AI path unavailable, using local fallback:", err.message);
        return {
            source: "fallback",
            clauses: analyzeLocal(contractText, requested, standards),
        };
    }
}

// --- DETERMINISTIC LOCAL ANALYZER ---
// This is NOT a substitute for the AI path. It's here so the demo still
// produces evidence-backed results when no API key is configured. It only
// uses the contract text + standards as inputs and never invents a clause.

function analyzeLocal(contractText, requestedTypes, standards) {
    return requestedTypes.map((t) => {
        const standard = standards.find((s) => s.category === clauseTypeLabel(t.id));
        const clauseText = findClause(contractText, t.id);

        if (!clauseText) {
            return {
                clauseType: t.id,
                clauseLabel: t.label,
                found: false,
                contractClauseText: "",
                matchedStandardText: standard?.standard || "",
                riskLevel: "not_enough_information",
                reason: NOT_ENOUGH,
                source: "company_standards.json + contract excerpt",
            };
        }

        const risk = evaluateRisk(t.id, clauseText, standard);
        return {
            clauseType: t.id,
            clauseLabel: t.label,
            found: true,
            contractClauseText: clauseText,
            matchedStandardText: standard?.standard || "",
            riskLevel: risk.level,
            reason: risk.reason,
            source: "company_standards.json + contract excerpt",
        };
    });
}

function clauseTypeLabel(id) {
    return {
        payment: "Payment",
        termination: "Termination",
        data_protection: "Data Protection",
        confidentiality: "Confidentiality",
        automatic_renewal: "Automatic Renewal",
        intellectual_property: "Intellectual Property",
        limitation_of_liability: "Limitation of Liability",
    }[id];
}

// Extracts the first numbered/section clause that matches a category.
// Splits the contract into sections by their numeric headings (e.g. "2.1 Payment").
function findClause(contractText, typeId) {
    const sections = contractText.split(/\n(?=\d+\.\d+\s+[A-Z])/);
    const keywords = {
        payment: /\bpayment\b|\binvoice\b/i,
        termination: /\bterminat/i,
        data_protection: /\bdata\b|\bencrypt|\bbreach|\bsubprocessor|\bpersonal data/i,
        confidentiality: /\bconfidential/i,
        automatic_renewal: /\brenew/i,
        intellectual_property: /\bintellectual property|\bownership|\blicence|\blicense/i,
        limitation_of_liability: /\bliabilit/i,
    }[typeId];

    // First pass: look for an explicit clause whose body matches the keywords.
    for (const section of sections) {
        const lines = section.trim().split("\n");
        const body = lines.slice(1).join(" ").trim();
        if (!body) continue;
        // Skip "Dataset Note" lines.
        if (/^dataset note/i.test(lines[0] || "")) continue;
        if (keywords.test(body)) return body;
    }
    return null;
}

function evaluateRisk(typeId, clauseText, standard) {
    const stdText = standard?.standard || "";
    const reasons = [];
    let score = 0;

    // Helper: extract days/numbers from a piece of text.
    const days = (s) => {
        const m = s.match(/(\d+)\s*(calendar|business)?\s*days?/i);
        return m ? parseInt(m[1], 10) : null;
    };
    const months = (s) => {
        const m = s.match(/(\d+)\s*month/i);
        return m ? parseInt(m[1], 10) : null;
    };
    const pct = (s) => {
        const m = s.match(/(\d+(?:\.\d+)?)\s*%/);
        return m ? parseFloat(m[1]) : null;
    };

    switch (typeId) {
        case "payment": {
            const d = days(clauseText);
            const sD = days(stdText);
            if (d !== null && sD !== null && d < sD) {
                score += 2;
                reasons.push(
                    `payment due in ${d} days, earlier than the standard ${sD} days`
                );
            } else if (d !== null && sD !== null && d > sD) {
                reasons.push(
                    `payment due in ${d} days, slightly longer than the standard ${sD} days`
                );
            }
            if (/before.*begin|advance|upfront|100%/i.test(clauseText)) {
                score += 2;
                reasons.push(
                    "payment is required before work begins / 100% upfront"
                );
            }
            break;
        }
        case "termination": {
            const d = days(clauseText);
            const sD = days(stdText);
            if (d !== null && sD !== null && d < sD) {
                score += 2;
                reasons.push(
                    `notice period is ${d} days, shorter than the standard ${sD} days`
                );
            }
            if (
                /no (right|opportunity) to (fix|cure)|immediately after any breach/i.test(
                    clauseText
                )
            ) {
                score += 3;
                reasons.push(
                    "the breaching party has no right to fix the breach"
                );
            }
            if (/may terminate.*for any reason/i.test(clauseText)) {
                score += 2;
                reasons.push("one-sided termination right with very short notice");
            }
            break;
        }
        case "data_protection": {
            if (/not required/i.test(clauseText)) {
                score += 3;
                reasons.push("encryption of stored data is not required");
            }
            const breachHrs =
                clauseText.match(/(\d+)\s*hours?/i)?.[1] || null;
            const stdHrs = stdText.match(/(\d+)\s*hours?/i)?.[1] || null;
            if (breachHrs && stdHrs && parseInt(breachHrs) > parseInt(stdHrs)) {
                score += 2;
                reasons.push(
                    `breach notice is ${breachHrs}h, longer than the standard ${stdHrs}h`
                );
            }
            if (/without prior approval|without prior/i.test(clauseText)) {
                score += 3;
                reasons.push(
                    "new subprocessors can be added without prior approval"
                );
            }
            if (/any other internal business purpose/i.test(clauseText)) {
                score += 2;
                reasons.push(
                    "personal data may be used for purposes beyond the agreed service"
                );
            }
            const dDays = days(clauseText);
            const sDays = days(stdText);
            if (dDays !== null && sDays !== null && dDays > sDays) {
                score += 1;
                reasons.push(
                    `data return/deletion window is ${dDays} days vs. standard ${sDays} days`
                );
            }
            break;
        }
        case "confidentiality": {
            const years = (s) => {
                const m = s.match(/(\d+)\s*year/i);
                return m ? parseInt(m[1], 10) : null;
            };
            const cYears = years(clauseText);
            const sYears = years(stdText);
            if (cYears !== null && sYears !== null && cYears < sYears) {
                score += 2;
                reasons.push(
                    `confidentiality duty is ${cYears}y vs. standard ${sYears}y`
                );
            }
            if (/no confidentiality duty|no obligation/i.test(clauseText)) {
                score += 3;
                reasons.push("one party has no confidentiality duty at all");
            }
            break;
        }
        case "automatic_renewal": {
            const d = days(clauseText);
            const sD = days(stdText);
            if (d !== null && sD !== null && d > sD) {
                score += 3;
                reasons.push(
                    `notice required to stop renewal is ${d} days vs. standard of ${sD} days`
                );
            }
            const m = months(clauseText);
            const sM = months(stdText);
            if (m !== null && sM !== null && m > sM) {
                score += 2;
                reasons.push(
                    `renewal term is ${m} months, longer than the standard ${sM} months`
                );
            }
            if (!/reminder|notice/i.test(clauseText)) {
                reasons.push("no renewal reminder mentioned");
            }
            break;
        }
        case "intellectual_property": {
            if (
                /non-transferable|while this agreement remains active|for six months/i.test(
                    clauseText
                )
            ) {
                score += 3;
                reasons.push(
                    "the customer does not receive permanent ownership of custom work"
                );
            }
            if (/vendor owns|developer keeps/i.test(clauseText)) {
                reasons.push("the vendor keeps ownership of deliverables");
            }
            break;
        }
        case "limitation_of_liability": {
            const cM = months(clauseText);
            const sM = months(stdText);
            if (
                cM !== null &&
                sM !== null &&
                cM < sM &&
                !/12\s*month/i.test(clauseText)
            ) {
                score += 3;
                reasons.push(
                    `liability cap is based on ${cM} months of fees vs. standard ${sM} months`
                );
            }
            if (/unlimited liability/i.test(clauseText)) {
                score += 2;
                reasons.push("one party has unlimited liability");
            }
            const stdExceptions = [
                "fraud",
                "gross negligence",
                "confidentiality",
                "data protection",
                "intellectual property",
            ];
            const missing = stdExceptions.filter(
                (e) => !new RegExp(e, "i").test(clauseText)
            );
            if (missing.length >= 2) {
                score += 2;
                reasons.push(
                    `liability cap may apply to ${missing.length} carve-outs that should normally be excluded: ${missing.join(", ")}`
                );
            }
            break;
        }
    }

    let level = "low";
    if (score >= 3) level = "high";
    else if (score >= 1) level = "medium";

    let reason;
    if (reasons.length === 0) {
        reason = "The clause matches the company standard.";
    } else {
        const intro =
            level === "high"
                ? "Material deviation from the company standard: "
                : level === "medium"
                ? "Minor deviation from the company standard: "
                : "The clause is consistent with the company standard.";
        reason = intro + reasons.join("; ") + ".";
    }
    return { level, reason };
}