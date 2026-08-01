// Loads the provided datasets from the public/ folder.
// All data is fictional and provided by the hackathon organisers.

export const CLAUSE_TYPES = [
    { id: "payment", label: "Payment", standardId: "STD-PAY-01" },
    { id: "termination", label: "Termination", standardId: "STD-TERM-01" },
    { id: "data_protection", label: "Data Protection", standardId: "STD-DP-01" },
    { id: "confidentiality", label: "Confidentiality", standardId: "STD-CONF-01" },
    { id: "automatic_renewal", label: "Auto Renewal", standardId: "STD-REN-01" },
    { id: "intellectual_property", label: "IP", standardId: "STD-IP-01" },
    { id: "limitation_of_liability", label: "Liability", standardId: "STD-LIAB-01" },
];

export async function loadStandards() {
    const res = await fetch("/data/company_standards.json");
    return res.json();
}

export async function loadContractList() {
    // The 8 provided contracts. We hardcode the list so the UI can show
    // a readable title parsed from each file's first line.
    return ["C-001", "C-002", "C-003", "C-004", "C-005", "C-006", "C-007", "C-008"];
}

export async function loadContract(id) {
    const res = await fetch(`/data/contracts/${id}.txt`);
    if (!res.ok) throw new Error(`Could not load ${id}`);
    return res.text();
}

export async function loadTestQuestions() {
    const res = await fetch("/data/public_test_questions.json");
    return res.json();
}

export async function loadMissingCases() {
    const res = await fetch("/data/missing_information_cases.json");
    return res.json();
}

// Pulls a title out of the contract text (line 2, e.g. "Title: BrightDesk SaaS ...")
export function extractTitle(contractText) {
    const m = contractText.match(/^Title:\s*(.+)$/m);
    return m ? m[1].trim() : null;
}