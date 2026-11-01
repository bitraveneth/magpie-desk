import { Banner, Field, PageTitle } from "@/components/desk/DeskShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveQuestions } from "@/lib/brief-actions";
import { listQuestions } from "@/lib/queries";

const kindLabel: Record<string, string> = {
  SHORT: "Short text",
  LONG: "Long text",
  DROPDOWN: "Dropdown",
  MULTI: "Multi-select",
  URL: "URL",
  URLS: "URLs with notes",
  DATE: "Date",
  FILE: "File upload",
};

export default async function QuestionEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const messages = await searchParams;
  const questions = await listQuestions();
  const sections: { id: string; label: string; sort: number; questions: typeof questions }[] = [];
  for (const question of questions) {
    let section = sections.find((item) => item.id === question.section);
    if (!section) {
      section = { id: question.section, label: question.sectionLabel, sort: question.sectionSort, questions: [] };
      sections.push(section);
    }
    section.questions.push(question);
  }

  return (
    <>
      <PageTitle
        kicker="Questions"
        title="Requirement questionnaire"
        text="Rename a question, change the help text, edit dropdown choices, or hide a question. Hidden questions leave the client form. Answers already given stay on the requirement."
      />
      <Banner error={messages.error} notice={messages.notice} />
      <form action={saveQuestions} className="grid gap-6">
        <div>
          <Button type="submit">Save questions</Button>
        </div>
        {sections.map((section) => (
          <Card key={section.id}>
            <h2 className="text-xl font-semibold">{section.label}</h2>
            <div className="mt-6 grid gap-8">
              {section.questions.map((question) => (
                <div key={question.id} className="grid gap-3 border-t border-border pt-4">
                  <p className="text-sm text-muted">
                    {question.sort}. {kindLabel[question.kind] ?? question.kind}
                    {question.types.length > 0 ? ` · ${question.types.join(", ")}` : ""}
                  </p>
                  <Field label="Question">
                    <Input name={`label_${question.id}`} defaultValue={question.label} required />
                  </Field>
                  <Field label="Help text">
                    <Textarea name={`help_${question.id}`} rows={2} defaultValue={question.help} />
                  </Field>
                  {question.kind === "DROPDOWN" || question.kind === "MULTI" ? (
                    question.locked ? (
                      <p className="text-sm text-muted">
                        The choices stay {question.options.join(", ")}. This question stays on the form so the later section still appears.
                      </p>
                    ) : (
                      <Field label="Choices, one per line">
                        <Textarea name={`options_${question.id}`} rows={Math.min(8, Math.max(3, question.options.length))} defaultValue={question.options.join("\n")} />
                      </Field>
                    )
                  ) : null}
                  {question.locked ? null : (
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" name={`hidden_${question.id}`} value="yes" defaultChecked={question.hidden} />
                      Hide this question
                    </label>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
        <div>
          <Button type="submit">Save questions</Button>
        </div>
      </form>
    </>
  );
}
