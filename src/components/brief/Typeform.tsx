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
  "w-full border-0 border-b-2 border-foreground/15 bg-transparent py-3 text-2xl text-foreground outline-none placeholder:text-muted/70 focus:border-accent";

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

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground" onKeyDown={onKeyDown}>
      <div className="h-1.5 bg-border">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/magpie-logo-purple.png" alt="Magpie Studio" className="h-8 w-auto" />
        <p className="text-sm font-medium text-muted">
          {phase === "questions" && question ? `${step + 1} of ${list.length}` : saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "No login needed"}
        </p>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-32 sm:px-8">
        {phase === "welcome" ? (
          <section className="question-rise flex flex-1 flex-col justify-center">
            <p className="text-sm font-semibold text-accent">Magpie Studio</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              This link is public. Anyone with it can answer. There is no account. One question at a time, and you can leave and come back.
            </p>
          </section>
        ) : null}
        {phase === "questions" && question ? (
          <section key={question.id} className="question-rise flex flex-1 flex-col justify-center py-6">
            <p className="text-sm font-semibold text-accent">{question.sectionLabel}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              {question.label}
              {question.required ? <span className="ml-1 text-accent">*</span> : null}
            </h1>
            {question.help ? <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{question.help}</p> : null}
            <div className="mt-8">{renderQuestion(question)}</div>
            {error ? <p className="mt-4 text-sm font-semibold text-accent-strong">{error}</p> : null}
            {question.kind !== "DROPDOWN" ? (
              <p className="mt-6 hidden text-sm text-muted sm:block">
                {question.kind === "LONG" ? "Press OK when you are ready." : "Press Enter"}
              </p>
            ) : null}
          </section>
        ) : null}
        {phase === "sign" ? (
          <section className="question-rise flex flex-1 flex-col justify-center py-6">
            <p className="text-sm font-semibold text-accent">Sign</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">Sign this requirement</h1>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">Your name and email go on the PDF, with the date in Shanghai.</p>
            <div className="mt-8 grid gap-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Name</span>
                <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <button
                type="button"
                onClick={() => setWantNda((current) => !current)}
                className={`rounded-2xl border px-4 py-4 text-left text-base ${wantNda ? "border-accent bg-accent/10" : "border-border bg-card"}`}
              >
                <span className="font-semibold">Also sign the NDA</span>
                <span className="mt-1 block text-sm text-muted">Optional. Leave it off to sign only the requirement.</span>
              </button>
              {wantNda ? <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm leading-6">{ndaText}</pre> : null}
            </div>
            {error ? <p className="mt-4 text-sm font-semibold text-accent-strong">{error}</p> : null}
          </section>
        ) : null}
        {phase === "done" ? (
          <section className="question-rise flex flex-1 flex-col justify-center">
            <p className="text-sm font-semibold text-accent">Signed</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">Thank you.</h1>
            <p className="mt-5 text-lg leading-8 text-muted">
              {signerName || name} signed this requirement{signedLabel ? ` on ${signedLabel}` : ""}.
              {ndaDone ? " The NDA is signed too." : ""}
            </p>
            <a
              href={`/r/${token}/pdf`}
              className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-base font-semibold text-white"
            >
              Download PDF
            </a>
          </section>
        ) : null}
      </main>
      <footer className="sticky bottom-0 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-8" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          {phase === "questions" && step > 0 ? (
            <button type="button" className="h-12 rounded-full px-4 text-sm font-semibold text-muted" onClick={() => { setError(""); setIndex(step - 1); }}>
              Back
            </button>
          ) : phase === "sign" && !locked ? (
            <button
              type="button"
              className="h-12 rounded-full px-4 text-sm font-semibold text-muted"
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
              Edit answers
            </button>
          ) : (
            <span />
          )}
          {phase === "welcome" ? (
            <button
              type="button"
              className="ml-auto h-12 rounded-full bg-accent px-8 text-sm font-semibold text-white"
              onClick={() => {
                const answers = new Map(Object.entries(values));
                const ordered = [...questions]
                  .filter((item) => questionVisible(item, answers))
                  .sort((left, right) => left.sectionSort - right.sectionSort || left.sort - right.sort);
                const resume = ordered.findIndex(
                  (item) => item.required && item.kind !== "FILE" && answerBlank(item.kind, values[item.id] ?? ""),
                );
                setIndex(resume >= 0 ? resume : 0);
                setPhase("questions");
              }}
            >
              {Object.values(values).some((value) => value.trim()) ? "Continue" : "Start"}
            </button>
          ) : null}
          {phase === "questions" && question ? (
            <button type="button" disabled={busy} className="ml-auto h-12 rounded-full bg-accent px-8 text-sm font-semibold text-white disabled:opacity-60" onClick={() => goNext()}>
              {busy ? "Saving…" : step >= list.length - 1 ? "Submit" : "OK"}
            </button>
          ) : null}
          {phase === "sign" ? (
            <button type="button" disabled={busy} className="ml-auto h-12 rounded-full bg-accent px-8 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void onSign()}>
              {busy ? "Signing…" : "Sign"}
            </button>
          ) : null}
        </div>
      </footer>
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
      return <textarea className="min-h-36 w-full rounded-2xl border border-border bg-card p-4 text-lg leading-7 outline-none focus:border-accent" value={value} onChange={(event) => update(item.id, event.target.value)} />;
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
                className={`flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-lg ${selected ? "border-accent bg-accent/10" : "border-border bg-card"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${selected ? "border-accent text-accent" : "border-border text-muted"}`}>
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
                className={`flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-lg ${on ? "border-accent bg-accent/10" : "border-border bg-card"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${on ? "border-accent text-accent" : "border-border text-muted"}`}>
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
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
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
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
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
          <div key={file.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
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
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-card px-4 py-6 text-center">
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
