async function asJson(res) {
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Unexpected response from server (${res.status}).`);
    }
    if (!res.ok) {
        throw new Error(data.error || `API ${res.status}`);
    }
    return data;
}

export async function listContracts() {
    const res = await fetch("/api/contracts", { credentials: "same-origin" });
    const data = await asJson(res);
    return data.contracts || [];
}

export async function getContract(id) {
    const res = await fetch(`/api/contracts/${encodeURIComponent(id)}`, {
        credentials: "same-origin",
    });
    const data = await asJson(res);
    return data.contract;
}

export async function createContract({ title, content, id }) {
    const res = await fetch("/api/contracts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content, id }),
    });
    const data = await asJson(res);
    return data.contract;
}

export async function seedContracts() {
    const res = await fetch("/api/contracts/seed", {
        method: "POST",
        credentials: "same-origin",
    });
    const data = await asJson(res);
    return data;
}