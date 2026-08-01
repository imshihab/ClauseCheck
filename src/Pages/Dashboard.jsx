import React, { useEffect, useMemo, useState } from "react";
import {
    FileText,
    Sparkles,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    HelpCircle,
    Check,
    X,
    Pencil,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    ScrollText,
    Lightbulb,
    LogOut,
} from "lucide-react";
import {
    Banner,
    Button,
    Card,
    Input,
    Select,
    Textarea,
    Title,
    Subtitle,
    RiskBadge,
    TogglePill,
} from "../components/NeoUI";
import {
    CLAUSE_TYPES,
    loadContract,
    loadContractList,
    loadMissingCases,
    loadStandards,
    loadTestQuestions,
} from "../lib/data";
import { analyzeContract } from "../lib/analyze";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router";
import { createContract } from "../lib/contracts";

const DECISION_LABELS = {
    pending: {
        label: "Pending",
        color: "bg-neo-gray text-neo-black",
        icon: HelpCircle,
    },
    approved: {
        label: "Approved",
        color: "bg-neo-green text-white",
        icon: Check,
    },
    rejected: { label: "Rejected", color: "bg-neo-red text-white", icon: X },
    review: {
        label: "Marked for Review",
        color: "bg-neo-yellow text-neo-black",
        icon: Pencil,
    },
};

function RiskIcon({ level }) {
    const map = {
        low: ShieldCheck,
        medium: ShieldAlert,
        high: ShieldX,
        not_enough_information: HelpCircle,
    };
    const Icon = map[level] || HelpCircle;
    return <Icon size={20} strokeWidth={2.5} />;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    const [standards, setStandards] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [contractId, setContractId] = useState("");
    const [contractText, setContractText] = useState("");

    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadContent, setUploadContent] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // {kind: 'ok'|'err', message}

    const [selectedTypes, setSelectedTypes] = useState(
        CLAUSE_TYPES.map((c) => c.id),
    );

    const [questions, setQuestions] = useState([]);
    const [missingCases, setMissingCases] = useState([]);

    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null); // {source, clauses: [...]}
    const [error, setError] = useState(null);

    const [decisions, setDecisions] = useState({}); // clauseType -> {status, notes}

    const contractTitle = useMemo(
        () => contracts.find((c) => c.id === contractId)?.title || contractId,
        [contracts, contractId],
    );

    useEffect(() => {
        (async () => {
            const [s, list, q, mi] = await Promise.all([
                loadStandards(),
                loadContractList(),
                loadTestQuestions(),
                loadMissingCases(),
            ]);
            setStandards(s);
            setContracts(list);
            setQuestions(q);
            setMissingCases(mi);
            if (list.length > 0) {
                setContractId((prev) => prev || list[0].id);
            }
        })();
    }, []);

    useEffect(() => {
        if (!contractId) return;
        let cancelled = false;
        (async () => {
            try {
                const text = await loadContract(contractId);
                if (cancelled) return;
                setContractText(text);
                setResults(null);
                setDecisions({});
            } catch (e) {
                setError(e.message);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [contractId]);

    const summary = useMemo(() => {
        if (!results) return null;
        const counts = {
            high: 0,
            medium: 0,
            low: 0,
            not_enough_information: 0,
        };
        for (const c of results.clauses) {
            counts[c.riskLevel] = (counts[c.riskLevel] || 0) + 1;
        }
        return counts;
    }, [results]);

    function toggleType(id) {
        setSelectedTypes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    async function runAnalysis() {
        setAnalyzing(true);
        setError(null);
        try {
            const out = await analyzeContract({
                contractText,
                clauseTypeIds: selectedTypes,
                standards,
            });
            setResults(out);
            setDecisions({});
        } catch (e) {
            setError(e.message);
        } finally {
            setAnalyzing(false);
        }
    }

    function setDecision(clauseType, status, notes = "") {
        setDecisions((d) => ({ ...d, [clauseType]: { status, notes } }));
    }

    function selectQuestion(q) {
        setContractId(q.contract_id);
    }

    async function handleUpload() {
        const content = uploadContent;
        if (!content.trim()) {
            setUploadStatus({
                kind: "err",
                message: "Paste a contract first.",
            });
            return;
        }
        setUploading(true);
        setUploadStatus(null);
        try {
            const created = await createContract({
                title: uploadTitle.trim(),
                content,
            });
            // Splice the new row into the existing list — server returns
            // {id, title, created_at, uploaded_by} which already matches the
            // list shape, and `created` is the newest row so appending keeps
            // the ASC ordering from the server.
            setContracts((prev) => [...prev, created]);
            setContractId(created.id);
            setUploadContent("");
            setUploadTitle("");
            setUploadStatus({
                kind: "ok",
                message: `Uploaded ${created.id} — ${created.title}`,
            });
        } catch (e) {
            setUploadStatus({
                kind: "err",
                message: e.message || "Upload failed.",
            });
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="min-h-screen bg-neo-bg">
            <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                {/* HEADER */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-4 border-neo-black pb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-neo-yellow border-2 border-neo-black p-2 shadow-neo-sm">
                                <ScrollText size={28} strokeWidth={2.5} />
                            </div>
                            <Title>ClauseCheck</Title>
                        </div>
                        <Subtitle className="uppercase tracking-widest text-xs font-bold mt-2 border-l-4 border-neo-black pl-2">
                            AI contract review assistant · human decides
                        </Subtitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {user && (
                            <span className="px-3 py-1 border-2 border-neo-black bg-white text-[10px] font-black uppercase tracking-widest">
                                {user.id}
                            </span>
                        )}
                        <span className="px-3 py-1 border-2 border-neo-black bg-white text-[10px] font-black uppercase tracking-widest">
                            Final Round · IUB Hackathon
                        </span>
                        <Button variant="dark" size="sm" onClick={handleLogout}>
                            <LogOut size={14} strokeWidth={3} /> LOG OUT
                        </Button>
                    </div>
                </header>

                {/* STEP 1 — SELECT */}
                <Card className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-neo-black text-white px-2 py-0.5 text-xs font-black">
                            STEP 1
                        </span>
                        <Subtitle className="uppercase tracking-widest text-xs font-bold">
                            Pick a contract
                        </Subtitle>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                Contract
                            </label>
                            <Select
                                value={contractId}
                                onChange={(e) => setContractId(e.target.value)}
                            >
                                {contracts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.id} — {c.title}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                Title
                            </label>
                            <div className="border-2 border-neo-black bg-neo-bg p-3 font-bold">
                                {contractTitle || "—"}
                            </div>
                        </div>
                    </div>

                    {questions.length > 0 && (
                        <details className="border-2 border-neo-black bg-neo-bg p-3">
                            <summary className="cursor-pointer font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <Lightbulb size={14} strokeWidth={2.5} />
                                Jump to a public test question (
                                {questions.length})
                            </summary>
                            <div className="mt-3 grid md:grid-cols-2 gap-2">
                                {questions.map((q) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => selectQuestion(q)}
                                        className="text-left p-2 border-2 border-neo-black bg-white hover:bg-neo-yellow text-xs"
                                    >
                                        <span className="font-black mr-1">
                                            {q.id} · {q.contract_id}
                                        </span>
                                        <span className="text-neo-black/70">
                                            {q.question}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </details>
                    )}

                    {missingCases.length > 0 && (
                        <details className="border-2 border-neo-black bg-neo-bg p-3">
                            <summary className="cursor-pointer font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <HelpCircle size={14} strokeWidth={2.5} />
                                Missing-information demos ({missingCases.length}
                                )
                            </summary>
                            <div className="mt-3 flex flex-col gap-2">
                                {missingCases.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                            selectQuestion({
                                                contract_id: m.contract_id,
                                            })
                                        }
                                        className="text-left p-2 border-2 border-neo-black bg-white hover:bg-neo-yellow text-xs"
                                    >
                                        <span className="font-black mr-1">
                                            {m.id} · {m.contract_id}
                                        </span>
                                        <span className="text-neo-black/70">
                                            {m.question}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </details>
                    )}

                    <details className="border-2 border-neo-black bg-neo-bg">
                        <summary className="cursor-pointer p-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neo-yellow">
                            <FileText size={14} strokeWidth={2.5} />
                            Upload a new contract
                        </summary>
                        <div className="border-t-2 border-neo-black p-3 flex flex-col gap-3">
                            <p className="text-xs text-neo-black/70">
                                Paste the contract text below. A new id like
                                <code className="mx-1 font-mono">U-…</code>
                                is assigned automatically. Include a
                                <code className="mx-1 font-mono">Title: …</code>
                                line for a friendly name.
                            </p>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-widest">
                                    Title (optional)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Auto-detected from the contract if blank"
                                    value={uploadTitle}
                                    onChange={(e) =>
                                        setUploadTitle(e.target.value)
                                    }
                                    disabled={uploading}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-widest">
                                    Contract text
                                </label>
                                <Textarea
                                    rows={8}
                                    placeholder="Paste the full contract here…"
                                    value={uploadContent}
                                    onChange={(e) =>
                                        setUploadContent(e.target.value)
                                    }
                                    disabled={uploading}
                                    className="font-mono text-xs"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neo-black/50">
                                    {uploadContent.length} chars
                                </span>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={handleUpload}
                                    disabled={
                                        uploading || !uploadContent.trim()
                                    }
                                >
                                    {uploading
                                        ? "Uploading…"
                                        : "Upload contract"}
                                </Button>
                            </div>
                            {uploadStatus && (
                                <Banner
                                    kind={
                                        uploadStatus.kind === "ok"
                                            ? "success"
                                            : "error"
                                    }
                                >
                                    {uploadStatus.message}
                                </Banner>
                            )}
                        </div>
                    </details>
                </Card>

                {/* STEP 2 — CLAUSE TYPES */}
                <Card className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="bg-neo-black text-white px-2 py-0.5 text-xs font-black">
                                STEP 2
                            </span>
                            <Subtitle className="uppercase tracking-widest text-xs font-bold">
                                Pick clause types to review
                            </Subtitle>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTypes(
                                        CLAUSE_TYPES.map((c) => c.id),
                                    )
                                }
                                className="text-[10px] font-black uppercase tracking-widest underline"
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTypes([])}
                                className="text-[10px] font-black uppercase tracking-widest underline"
                            >
                                None
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CLAUSE_TYPES.map((t) => (
                            <TogglePill
                                key={t.id}
                                active={selectedTypes.includes(t.id)}
                                onClick={() => toggleType(t.id)}
                            >
                                {t.label}
                            </TogglePill>
                        ))}
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        onClick={runAnalysis}
                        disabled={
                            analyzing ||
                            selectedTypes.length === 0 ||
                            !contractText
                        }
                        className="w-full md:w-auto"
                    >
                        {analyzing ? (
                            <>
                                <RotateCcw
                                    size={20}
                                    strokeWidth={3}
                                    className="animate-spin"
                                />
                                Analysing…
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} strokeWidth={3} />
                                Run Review
                            </>
                        )}
                    </Button>
                    {error && <Banner kind="error">{error}</Banner>}
                </Card>

                {/* RESULTS */}
                {results && (
                    <div className="flex flex-col gap-4">
                        {/* Summary card */}
                        <Card variant="dark" className="flex flex-col gap-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <Subtitle className="text-white/60 text-[10px] uppercase tracking-widest font-black">
                                        Review Summary · {contractId}
                                    </Subtitle>
                                    <Title className="text-2xl md:text-3xl mt-1">
                                        {results.clauses.length} clause
                                        {results.clauses.length === 1
                                            ? ""
                                            : "s"}{" "}
                                        checked
                                    </Title>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 border-2 border-white text-[10px] font-black uppercase tracking-widest">
                                        {results.source === "ai"
                                            ? "Powered by Gemini"
                                            : "Local deterministic fallback"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <SummaryPill
                                    color="bg-neo-red"
                                    label="High"
                                    value={summary.high}
                                />
                                <SummaryPill
                                    color="bg-neo-yellow text-neo-black"
                                    label="Medium"
                                    value={summary.medium}
                                />
                                <SummaryPill
                                    color="bg-neo-green"
                                    label="Low"
                                    value={summary.low}
                                />
                                <SummaryPill
                                    color="bg-neo-gray text-neo-black"
                                    label="No Info"
                                    value={summary.not_enough_information}
                                />
                            </div>
                            <p className="text-xs text-white/70 border-t-2 border-white/20 pt-3">
                                <strong className="text-white">
                                    Disclaimer:
                                </strong>{" "}
                                this is an AI assistant, not legal advice. Every
                                result below shows the contract text and the
                                company standard that supports it. A human
                                reviewer makes the final decision.
                            </p>
                        </Card>

                        {/* Per-clause cards */}
                        {results.clauses.map((c) => (
                            <ClauseResultCard
                                key={c.clauseType}
                                clause={c}
                                decision={decisions[c.clauseType]}
                                onDecision={(status, notes) =>
                                    setDecision(c.clauseType, status, notes)
                                }
                            />
                        ))}
                    </div>
                )}

                <footer className="text-center text-[10px] font-black uppercase tracking-widest text-neo-black/50 py-6">
                    Built for the Intra IUB Legal Tech Hackathon · Final Round
                </footer>
            </div>
        </div>
    );
}

function SummaryPill({ color, label, value }) {
    return (
        <div className={`px-3 py-2 border-2 border-white ${color}`}>
            <div className="text-[10px] font-black uppercase tracking-widest">
                {label}
            </div>
            <div className="text-2xl font-black leading-none">{value}</div>
        </div>
    );
}

function ClauseResultCard({ clause, decision, onDecision }) {
    const [expanded, setExpanded] = useState(false);
    const decisionInfo = decision ? DECISION_LABELS[decision.status] : null;
    const DIcon = decisionInfo?.icon || HelpCircle;

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="border-2 border-neo-black p-2 bg-neo-bg">
                        <RiskIcon level={clause.riskLevel} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-neo-black/60">
                            Clause Type
                        </div>
                        <Title className="text-2xl">{clause.clauseLabel}</Title>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <RiskBadge level={clause.riskLevel} />
                    {decisionInfo && (
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-neo-black ${decisionInfo.color}`}
                        >
                            <DIcon size={12} strokeWidth={3} />
                            {decisionInfo.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="border-l-4 border-neo-black pl-3 py-1">
                <p className="text-sm font-bold">{clause.reason}</p>
            </div>

            {clause.found ? (
                <div className="grid md:grid-cols-2 gap-4">
                    <EvidenceBlock
                        title="Contract Clause"
                        source="contract excerpt"
                    >
                        {clause.contractClauseText}
                    </EvidenceBlock>
                    <EvidenceBlock
                        title="Company Standard"
                        source={clause.source}
                    >
                        {clause.matchedStandardText}
                    </EvidenceBlock>
                </div>
            ) : (
                <div className="border-2 border-neo-black bg-neo-bg p-4 text-sm">
                    <div className="font-black uppercase text-[10px] tracking-widest mb-1">
                        No matching clause found
                    </div>
                    The contract excerpt does not contain a{" "}
                    {clause.clauseLabel.toLowerCase()} clause. The system does
                    not invent a rule.
                </div>
            )}

            {/* Human review actions */}
            <div className="border-t-2 border-neo-black pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest">
                        Human Review · Required
                    </div>
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="text-[10px] font-black uppercase tracking-widest underline flex items-center gap-1"
                    >
                        {expanded ? "Hide notes" : "Add notes"}
                        {expanded ? (
                            <ChevronUp size={12} strokeWidth={3} />
                        ) : (
                            <ChevronDown size={12} strokeWidth={3} />
                        )}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="green"
                        size="sm"
                        onClick={() => onDecision("approved")}
                    >
                        <Check size={16} strokeWidth={3} /> Approve
                    </Button>
                    <Button
                        variant="red"
                        size="sm"
                        onClick={() => onDecision("rejected")}
                    >
                        <X size={16} strokeWidth={3} /> Reject
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDecision("review")}
                    >
                        <Pencil size={16} strokeWidth={3} /> Mark for review
                    </Button>
                    {decision && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDecision("pending", "")}
                        >
                            <RotateCcw size={14} strokeWidth={3} /> Clear
                        </Button>
                    )}
                </div>
                {expanded && (
                    <Textarea
                        rows={3}
                        placeholder="Reviewer notes (visible to your team, not the AI)…"
                        value={decision?.notes || ""}
                        onChange={(e) =>
                            onDecision(
                                decision?.status || "pending",
                                e.target.value,
                            )
                        }
                    />
                )}
            </div>
        </Card>
    );
}

function EvidenceBlock({ title, source, children }) {
    return (
        <div className="border-2 border-neo-black bg-neo-bg p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest">
                    {title}
                </div>
                <div className="text-[10px] font-bold text-neo-black/60 uppercase tracking-widest">
                    {source}
                </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {children}
            </p>
        </div>
    );
}
