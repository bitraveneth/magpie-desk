import { Banner, PageTitle } from "@/components/desk/DeskShell";
import { Button } from "@/components/ui/Button";
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

const fieldClass = "w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-500";

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
  const hidden = questions.filter((question) => question.hidden).length;

  return (
    <>
      <PageTitle
        kicker="Questions"
        title="Question bank"
        text="Edit the brief the client fills. Hidden questions leave the form. Answers already saved stay on the requirement."
      />
      <Banner error={messages.error} notice={messages.notice} />
      <form action={saveQuestions}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-lg bg-white px-3 py-2 shadow-theme-xs">{sections.length} sections</span>
            <span className="rounded-lg bg-white px-3 py-2 shadow-theme-xs">{questions.length} questions</span>
            <span className="rounded-lg bg-white px-3 py-2 shadow-theme-xs">{hidden} hidden</span>
          </div>
          <Button type="submit">Save questions</Button>
        </div>
        <nav className="mb-4 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a key={section.id} href={`#section-${section.id}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {section.label}
              <span className="ml-2 text-gray-400">{section.questions.length}</span>
            </a>
          ))}
        </nav>
        <div className="grid gap-4">
          {sections.map((section) => (
            <section key={section.id} id={`section-${section.id}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-800">{section.label}</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{section.questions.length}</span>
              </header>
              <div className="divide-y divide-gray-100">
                {section.questions.map((question) => (
                  <div key={question.id} className={`grid gap-4 px-5 py-5 lg:grid-cols-[200px_1fr] ${question.hidden ? "bg-gray-50" : ""}`}>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Question {question.sort}</p>
                      <p className="mt-2 inline-flex rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-500">
                        {kindLabel[question.kind] ?? question.kind}
                      </p>
                      {question.types.length > 0 ? <p className="mt-2 text-xs text-gray-500">{question.types.join(" · ")}</p> : null}
                      {question.locked ? (
                        <p className="mt-3 text-xs leading-5 text-gray-500">This one stays on the form so the next section still appears.</p>
                      ) : (
                        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" name={`hidden_${question.id}`} value="yes" defaultChecked={question.hidden} className="size-4 rounded border-gray-300" />
                          Hide
                        </label>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">Question</span>
                        <input name={`label_${question.id}`} defaultValue={question.label} required className={`${fieldClass} h-11`} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500">Help text</span>
                        <textarea name={`help_${question.id}`} rows={2} defaultValue={question.help} className={`${fieldClass} py-2`} />
                      </label>
                      {question.kind === "DROPDOWN" || question.kind === "MULTI" ? (
                        question.locked ? (
                          <p className="text-sm text-gray-500">Choices: {question.options.join(", ")}</p>
                        ) : (
                          <label className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-500">Choices, one per line</span>
                            <textarea
                              name={`options_${question.id}`}
                              rows={Math.min(8, Math.max(3, question.options.length))}
                              defaultValue={question.options.join("\n")}
                              className={`${fieldClass} py-2`}
                            />
                          </label>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="sticky bottom-4 z-20 mt-4 flex justify-end">
          <Button type="submit" className="shadow-theme-lg">
            Save questions
          </Button>
        </div>
      </form>
    </>
  );
}
