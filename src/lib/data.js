import { getContract, listContracts } from "./contracts.js";

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
    return listContracts();
}

export async function loadContract(id) {
    const c = await getContract(id);
    if (!c || !c.content) {
        throw new Error(`Could not load ${id}`);
    }
    return c.content;
}

export async function loadTestQuestions() {
    const res = await fetch("/data/public_test_questions.json");
    return res.json();
}

export async function loadMissingCases() {
    const res = await fetch("/data/missing_information_cases.json");
    return res.json();
}