"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  answerBlank,
  answerProblem,
  parseMulti,
  parseUrlRows,
  questionVisible,
  type BriefQuestion,
} from "@/lib/brief";
import {
  removeBriefFile,
  reopenBriefNow,
  saveBriefDraft,
  signBrief,
  submitBrief,
  uploadBriefFile,
} from "@/lib/brief-actions";

type BriefFile = { id: string; questionId: string; fileName: string };
type Phase = "welcome" | "questions" | "sign" | "done";

const fieldClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/15";

const primaryBtn =
  "inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-strong disabled:opacity-60";

const ghostBtn = "inline-flex h-12 items-center justify-center rounded-full px-3 text-sm font-semibold text-muted transition hover:text-foreground";

export function Typeform({
  token,
  title,
  status,
  questions,
  initialAnswers,
  initialFiles,
  locked,
  signerName,
  signerEmail,
  signedLabel,
  ndaText,
  ndaSigned,
}: {
  token: string;
  title: string;
  status: string;
  questions: BriefQuestion[];
  initialAnswers: Record<string, string>;
  initialFiles: BriefFile[];
  locked: boolean;
  signerName: string;
  signerEmail: string;
  signedLabel: string | null;
  ndaText: string;
  ndaSigned: boolean;
}) {
  const [values, setValues] = useState(initialAnswers);
  const [files, setFiles] = useState(initialFiles);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(status === "SIGNED" ? "done" : status === "FILLED" ? "sign" : "welcome");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [name, setName] = useState(signerName);
  const [email, setEmail] = useState(signerEmail);
  const [wantNda, setWantNda] = useState(false);
  const [ndaDone, setNdaDone] = useState(ndaSigned);
  const dirty = useRef<Record<string, string>>({});
  const timer = useRef<number | null>(null);

  const list = useMemo(() => {
    const answers = new Map(Object.entries(values));
    return [...questions]
      .filter((question) => questionVisible(question, answers))
      .sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
  }, [questions, values]);

  const step = Math.min(index, Math.max(list.length - 1, 0));
  const question = list[step];
  const progress = phase === "welcome" ? 0 : phase === "questions" ? ((step + 1) / Math.max(list.length, 1)) * 100 : 100;

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function scheduleSave() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush();
    }, 500);
  }

  async function flush() {
    const patch = dirty.current;
    if (Object.keys(patch).length === 0) return;
    dirty.current = {};
    setSaveState("saving");
    const result = await saveBriefDraft(token, patch);
    setSaveState(result.ok ? "saved" : "idle");
  }

  function update(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    dirty.current[id] = value;
    setError("");
    scheduleSave();
  }

  function problemFor(item: BriefQuestion, value: string) {
    if (item.kind !== "FILE" && item.required && answerBlank(item.kind, value)) return "This one needs an answer.";
    return answerProblem(item, value);
  }

  function goNext(override?: string) {
    if (!question) return;
    const latest = override === undefined ? values : { ...values, [question.id]: override };
    const value = latest[question.id] ?? "";
    const problem = problemFor(question, value);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const answers = new Map(Object.entries(latest));
    const nextList = [...questions]
      .filter((item) => questionVisible(item, answers))
      .sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
    const currentIndex = Math.max(0, nextList.findIndex((item) => item.id === question.id));
    if (currentIndex >= nextList.length - 1) {
      void finish(latest);
      return;
    }
    setIndex(currentIndex + 1);
  }

  async function finish(latest: Record<string, string>) {
    setBusy(true);
    if (timer.current) window.clearTimeout(timer.current);
    const result = await submitBrief(token, { ...latest, ...dirty.current });
    dirty.current = {};
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      if (result.questionId) {
        const answers = new Map(Object.entries(latest));
        const ordered = [...questions]
          .filter((item) => questionVisible(item, answers))
          .sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
        const found = ordered.findIndex((item) => item.id === result.questionId);
        if (found >= 0) setIndex(found);
      }
      return;
    }
    setPhase("sign");
    setSaveState("saved");
  }

  async function onUpload(list: FileList | null) {
    if (!question || !list?.length) return;
    const body = new FormData();
    body.set("token", token);
    body.set("questionId", question.id);
    for (const file of list) body.append("file", file);
    setBusy(true);
    const result = await uploadBriefFile(body);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFiles((current) => [...current, ...result.files]);
    setError("");
  }

  async function onSign() {
    setBusy(true);
    const result = await signBrief(token, name, email, wantNda);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if ("ndaSigned" in result && result.ndaSigned) setNdaDone(true);
    setPhase("done");
  }

  const started = Object.values(values).some((value) => value.trim());

  function begin() {
    const answers = new Map(Object.entries(values));
    const ordered = [...questions]
      .filter((item) => questionVisible(item, answers))
      .sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
    const resume = ordered.findIndex((item) => item.required && item.kind !== "FILE" && answerBlank(item.kind, values[item.id] ?? ""));
    setIndex(resume >= 0 ? resume : 0);
    setPhase("questions");
  }

  return (
    <div className="brief-stage flex min-h-dvh flex-col text-foreground" onKeyDown={onKeyDown}>
      <div className="brief-frame">
        <header className="mb-5 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-9 w-auto" />
          <p className="text-xs font-semibold tracking-wide text-muted">
            {phase === "questions" && question
              ? `Question ${step + 1} of ${list.length}`
              : saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : "Public link · no login"}
          </p>
        </header>
        <div className="brief-sheet question-rise" key={phase === "questions" ? question?.id : phase}>
          {phase === "welcome" ? null : (
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          {phase === "welcome" ? (
            <section className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Magpie Studio</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">Your project brief</h1>
              {title ? <p className="mt-4 text-sm font-semibold text-foreground">{title}</p> : null}
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
                One question at a time. Anyone with this link can answer. There is no account, and you can leave and come back.
              </p>
              <button type="button" className={`${primaryBtn} mt-8 w-full`} onClick={begin}>
                {started ? "Continue" : "Start"}
              </button>
            </section>
          ) : null}
          {phase === "questions" && question ? (
            <section className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{question.sectionLabel}</p>
              <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                {question.label}
                {question.required ? <span className="text-accent"> *</span> : null}
              </h1>
              {question.help ? <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{question.help}</p> : null}
              <div className="mt-6 text-left">{renderQuestion(question)}</div>
              {error ? <p className="mt-4 text-sm font-semibold text-accent-strong">{error}</p> : null}
              <div className="mt-6 flex items-center gap-2">
                {step > 0 ? (
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => {
                      setError("");
                      setIndex(step - 1);
                    }}
                  >
                    Back
                  </button>
                ) : null}
                <button type="button" disabled={busy} className={`${primaryBtn} min-w-0 flex-1`} onClick={() => goNext()}>
                  {busy ? "Saving…" : step >= list.length - 1 ? "Submit" : "OK"}
                </button>
              </div>
            </section>
          ) : null}
          {phase === "sign" ? (
            <section className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sign</p>
              <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">Sign this requirement</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Your name and email go on the PDF, with the date in Shanghai.</p>
              <div className="mt-6 grid gap-4 text-left">
                <label className="block">
                  <span className="mb-2 block text-center text-sm font-semibold">Name</span>
                  <input className={`${fieldClass} text-center`} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-center text-sm font-semibold">Email</span>
                  <input className={`${fieldClass} text-center`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </label>
                <button
                  type="button"
                  onClick={() => setWantNda((current) => !current)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm ${wantNda ? "border-accent bg-accent text-white" : "border-border bg-background"}`}
                >
                  <span className="font-semibold">Also sign the NDA</span>
                  <span className={`mt-1 block ${wantNda ? "text-white/80" : "text-muted"}`}>Optional. Leave it off to sign only the requirement.</span>
                </button>
                {wantNda ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-left text-xs leading-5">{ndaText}</pre> : null}
              </div>
              {error ? <p className="mt-4 text-sm font-semibold text-accent-strong">{error}</p> : null}
              <div className="mt-6 flex items-center gap-2">
                {!locked ? (
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => {
                      void reopenBriefNow(token).then((result) => {
                        if (!result.ok) setError(result.error);
                        else {
                          setPhase("questions");
                          setIndex(0);
                        }
                      });
                    }}
                  >
                    Edit
                  </button>
                ) : null}
                <button type="button" disabled={busy} className={`${primaryBtn} min-w-0 flex-1`} onClick={() => void onSign()}>
                  {busy ? "Signing…" : "Sign"}
                </button>
              </div>
            </section>
          ) : null}
          {phase === "done" ? (
            <section className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Signed</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">Thank you</h1>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
                {signerName || name} signed this requirement{signedLabel ? ` on ${signedLabel}` : ""}.
                {ndaDone ? " The NDA is signed too." : ""}
              </p>
              <a href={`/r/${token}/pdf`} className={`${primaryBtn} mt-8 w-full`}>
                Download PDF
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (phase !== "questions" || !question) return;
    const target = event.target as HTMLElement;
    if (event.key === "Enter" && question.kind !== "LONG" && question.kind !== "URLS" && target.tagName !== "TEXTAREA") {
      event.preventDefault();
      goNext();
    }
  }

  function renderQuestion(item: BriefQuestion) {
    const value = values[item.id] ?? "";
    if (item.kind === "LONG") {
      return (
        <textarea
          className="min-h-36 w-full rounded-2xl border border-border bg-background p-4 text-base leading-7 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/15"
          value={value}
          onChange={(event) => update(item.id, event.target.value)}
        />
      );
    }
    if (item.kind === "SHORT" || item.kind === "URL") {
      return (
        <input
          className={fieldClass}
          type={item.kind === "URL" ? "url" : item.id === "work-email" ? "email" : "text"}
          inputMode={item.id === "phone" ? "tel" : undefined}
          placeholder={item.kind === "URL" ? "https://" : ""}
          value={value}
          autoFocus
          onChange={(event) => update(item.id, event.target.value)}
        />
      );
    }
    if (item.kind === "DATE") {
      return <input className={`${fieldClass} text-xl`} type="date" value={value} onChange={(event) => update(item.id, event.target.value)} />;
    }
    if (item.kind === "DROPDOWN") {
      return (
        <div className="grid gap-3">
          {item.options.map((option, optionIndex) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  update(item.id, option);
                  window.setTimeout(() => goNext(option), 180);
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-base transition ${selected ? "border-accent bg-accent text-white shadow-md shadow-accent/20" : "border-transparent bg-background text-foreground hover:border-accent/30"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${selected ? "bg-white/20 text-white" : "bg-white text-muted"}`}>
                  {optionIndex < 26 ? String.fromCharCode(65 + optionIndex) : optionIndex + 1}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      );
    }
    if (item.kind === "MULTI") {
      const selected = parseMulti(value);
      return (
        <div className="grid gap-3">
          {item.options.map((option, optionIndex) => {
            const on = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  const next = on ? selected.filter((itemOption) => itemOption !== option) : [...selected, option];
                  update(item.id, JSON.stringify(next));
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-base transition ${on ? "border-accent bg-accent text-white shadow-md shadow-accent/20" : "border-transparent bg-background text-foreground hover:border-accent/30"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${on ? "bg-white/20 text-white" : "bg-white text-muted"}`}>
                  {optionIndex < 26 ? String.fromCharCode(65 + optionIndex) : optionIndex + 1}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      );
    }
    if (item.kind === "URLS") {
      const rows = [0, 1, 2].map((rowIndex) => parseUrlRows(value)[rowIndex] ?? { url: "", note: "" });
      return (
        <div className="grid gap-4">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid gap-2">
              <input
                className={fieldClass}
                type="url"
                placeholder="https://"
                value={row.url}
                onChange={(event) => {
                  const next = [...rows];
                  next[rowIndex] = { ...row, url: event.target.value };
                  update(item.id, JSON.stringify(next));
                }}
              />
              <input
                className={fieldClass}
                placeholder="What you like"
                value={row.note}
                onChange={(event) => {
                  const next = [...rows];
                  next[rowIndex] = { ...row, note: event.target.value };
                  update(item.id, JSON.stringify(next));
                }}
              />
            </div>
          ))}
        </div>
      );
    }
    const ownFiles = files.filter((file) => file.questionId === item.id);
    return (
      <div className="grid gap-3">
        {ownFiles.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
            <span className="text-base">{file.fileName}</span>
            <button
              type="button"
              className="text-sm font-semibold text-accent"
              onClick={() => {
                void removeBriefFile(token, file.id).then((result) => {
                  if (!result.ok) setError(result.error);
                  else setFiles((current) => current.filter((itemFile) => itemFile.id !== file.id));
                });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-background px-4 py-6 text-center">
          <span className="text-base font-semibold">Upload a file</span>
          <span className="mt-1 text-sm text-muted">PDF, Word, PNG, JPEG, or WebP. Up to 8 MB.</span>
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              void onUpload(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
    );
  }
}
