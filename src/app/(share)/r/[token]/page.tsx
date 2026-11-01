import { notFound } from "next/navigation";
import { Typeform } from "@/components/brief/Typeform";
import { prefillAnswer } from "@/lib/brief";
import { ndaBody } from "@/lib/nda-text";
import { shanghaiDate } from "@/lib/money";
import { getPublicBrief, listQuestions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SharedRequirementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [job, questions] = await Promise.all([getPublicBrief(token), listQuestions()]);
  if (!job) notFound();
  const initialAnswers: Record<string, string> = {};
  for (const question of questions) {
    const stored = job.answers.find((answer) => answer.questionId === question.id);
    initialAnswers[question.id] = stored ? stored.value : prefillAnswer(question.id, job);
  }

  return (
    <Typeform
      token={job.shareToken}
      title={job.title}
      status={job.briefStatus}
      questions={questions}
      initialAnswers={initialAnswers}
      initialFiles={job.files}
      locked={Boolean(job.quotation) || job.briefStatus === "SIGNED"}
      signerName={job.signedInName || job.answers.find((answer) => answer.questionId === "contact-name")?.value || job.clientName}
      signerEmail={job.signedInEmail || job.answers.find((answer) => answer.questionId === "work-email")?.value || job.clientEmail}
      signedLabel={job.signedInAt ? shanghaiDate(job.signedInAt) : null}
      ndaText={job.nda?.body ?? ndaBody(job)}
      ndaSigned={job.nda?.status === "SIGNED"}
      correctionNote={job.correctionNote}
      signedCopyName={job.files.find((file) => file.questionId === "__signed_copy")?.fileName ?? ""}
    />
  );
}
