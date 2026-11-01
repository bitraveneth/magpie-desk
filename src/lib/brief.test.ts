import assert from "node:assert/strict";
import { questionBank } from "../content/questions.ts";
import { answerBlank, firstProblem, groupSections, questionVisible, type BriefQuestion } from "./brief.ts";

assert.equal(questionBank.length, 50);
assert.equal(new Set(questionBank.map((question) => question.id)).size, 50);

const questions = questionBank.map((question) => ({ ...question, hidden: false })) as BriefQuestion[];
const website = new Map<string, string>([
  ["project-type", "Website"],
  ["has-budget", "No"],
]);
const visible = questions.filter((question) => questionVisible(question, website));
assert.equal(visible.some((question) => question.section === "website"), true);
assert.equal(visible.some((question) => question.section === "app"), false);
assert.equal(visible.some((question) => question.section === "erp"), false);
assert.equal(visible.some((question) => question.id === "budget-range"), false);

const withBudget = new Map(website);
withBudget.set("has-budget", "Yes");
assert.equal(questionVisible(questions.find((question) => question.id === "budget-range")!, withBudget), true);

const sections = groupSections(questions, website);
assert.deepEqual(sections.map((section) => section.id), ["company", "project", "website", "brand", "technical", "budget"]);

const missing = firstProblem(questions, new Map([["project-type", "Mobile app"]]));
assert.equal(missing?.section, "company");
assert.equal(answerBlank("MULTI", "[]"), true);
assert.equal(answerBlank("URLS", JSON.stringify([{ url: "https://magpiestudio.com", note: "Clear" }])), false);

console.log("brief tests passed");
