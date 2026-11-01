import { Field } from "@/components/desk/DeskShell";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { parseMulti, parseUrlRows, type BriefQuestion } from "@/lib/brief";

const selectClass =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function BriefFields({
  question,
  value,
  files,
}: {
  question: BriefQuestion;
  value: string;
  files: { id: string; fileName: string }[];
}) {
  const required = question.required;
  return (
    <Field label={question.label}>
      {question.help ? <p className="-mt-1 mb-2 text-sm text-muted">{question.help}</p> : null}
      {question.kind === "LONG" ? <Textarea name={`a_${question.id}`} rows={5} defaultValue={value} required={required} /> : null}
      {question.kind === "SHORT" || question.kind === "URL" ? (
        <Input
          name={`a_${question.id}`}
          type={question.kind === "URL" ? "url" : question.id === "work-email" ? "email" : "text"}
          defaultValue={value}
          required={required}
          placeholder={question.kind === "URL" ? "https://" : undefined}
        />
      ) : null}
      {question.kind === "DATE" ? <Input name={`a_${question.id}`} type="date" defaultValue={value} required={required} /> : null}
      {question.kind === "DROPDOWN" ? (
        <select name={`a_${question.id}`} defaultValue={value} required={required} className={selectClass}>
          <option value="">{required ? "Choose" : "Choose, if you want"}</option>
          {(value && !question.options.includes(value) ? [value, ...question.options] : question.options).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {question.kind === "MULTI" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <label key={option} className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm">
              <input type="checkbox" name={`a_${question.id}`} value={option} defaultChecked={parseMulti(value).includes(option)} />
              {option}
            </label>
          ))}
        </div>
      ) : null}
      {question.kind === "URLS" ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((index) => {
            const row = parseUrlRows(value)[index] ?? { url: "", note: "" };
            return (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <Input name={`url_${question.id}_${index + 1}`} type="url" defaultValue={row.url} placeholder="https://" />
                <Input name={`note_${question.id}_${index + 1}`} defaultValue={row.note} placeholder="What you like" />
              </div>
            );
          })}
        </div>
      ) : null}
      {question.kind === "FILE" ? (
        <div className="grid gap-3">
          {files.length > 0 ? (
            <ul className="grid gap-2">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-sm">
                  <span>{file.fileName}</span>
                  <label className="flex items-center gap-2 text-muted">
                    <input type="checkbox" name="removeFile" value={file.id} />
                    Remove
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            name={`file_${question.id}`}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>
      ) : null}
    </Field>
  );
}
